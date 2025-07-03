import LostItemCard from '@/components/LostItemCard';
import Colors from '@/constants/colors';
import { useLostItemStore } from '@/store/lostItemStore';
import { useUserStore } from '@/store/userStore';
import { LostItemCategory, LostItemStatus } from '@/types';
import { useRouter } from 'expo-router';
import {
    AlertTriangle,
    Filter,
    Plus,
    Search,
    Tag,
    X
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function LostFoundScreen() {
    const router = useRouter();
    const { isAuthenticated } = useUserStore();
    const {
        lostItems,
        filteredItems,
        fetchLostItems,
        searchItems,
        filterByCategory,
        filterByStatus,
        resetFilters,
        isLoading,
        categoryFilter,
        statusFilter,
        searchQuery
    } = useLostItemStore();

    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchLostItems();
    }, []);

    const handleSearch = (text: string) => {
        searchItems(text);
    };

    const handleCategoryFilter = (category: LostItemCategory | null) => {
        filterByCategory(category);
    };

    const handleStatusFilter = (status: LostItemStatus | null) => {
        filterByStatus(status);
    };

    const handleResetFilters = () => {
        resetFilters();
    };

    const renderCategoryFilters = () => {
        const categories: (LostItemCategory | null)[] = [
            null, 'electronics', 'jewelry', 'clothing', 'accessories', 'documents', 'toys', 'other'
        ];

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersRow}
            >
                {categories.map((category, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.filterChip,
                            categoryFilter === category && styles.activeFilterChip
                        ]}
                        onPress={() => handleCategoryFilter(category)}
                    >
                        <Tag size={14} color={categoryFilter === category ? Colors.dark.primary : Colors.dark.textSecondary} />
                        <Text
                            style={[
                                styles.filterChipText,
                                categoryFilter === category && styles.activeFilterChipText
                            ]}
                        >
                            {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Categories'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    const renderStatusFilters = () => {
        const statuses: (LostItemStatus | null)[] = [
            null, 'lost', 'found', 'claimed', 'resolved'
        ];

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersRow}
            >
                {statuses.map((status, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.filterChip,
                            statusFilter === status && styles.activeFilterChip
                        ]}
                        onPress={() => handleStatusFilter(status)}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                statusFilter === status && styles.activeFilterChipText
                            ]}
                        >
                            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All Status'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Search size={20} color={Colors.dark.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search lost & found items..."
                        placeholderTextColor={Colors.dark.textSecondary}
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <X size={20} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                    ) : null}
                </View>

                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Filter size={20} color={Colors.dark.textPrimary} />
                </TouchableOpacity>
            </View>

            {showFilters && (
                <View style={styles.filtersContainer}>
                    <View style={styles.filterSection}>
                        <Text style={styles.filterTitle}>Category</Text>
                        {renderCategoryFilters()}
                    </View>

                    <View style={styles.filterSection}>
                        <Text style={styles.filterTitle}>Status</Text>
                        {renderStatusFilters()}
                    </View>

                    {(categoryFilter || statusFilter) && (
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={handleResetFilters}
                        >
                            <Text style={styles.resetButtonText}>Reset Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                </View>
            ) : (
                <>
                    {filteredItems.length > 0 ? (
                        <FlatList
                            data={filteredItems}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => <LostItemCard item={item} />}
                            contentContainerStyle={styles.listContent}
                            ListHeaderComponent={
                                <View style={styles.listHeader}>
                                    <Text style={styles.listTitle}>
                                        {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'} Found
                                    </Text>

                                    {isAuthenticated && (
                                        <TouchableOpacity
                                            style={styles.myItemsButton}
                                            onPress={() => router.push('/lost-found/my-items')}
                                        >
                                            <Text style={styles.myItemsButtonText}>My Items</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            }
                        />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <AlertTriangle size={40} color={Colors.dark.textSecondary} />
                            <Text style={styles.emptyTitle}>No Items Found</Text>
                            <Text style={styles.emptyText}>
                                No lost or found items match your search criteria. Try adjusting your filters or search terms.
                            </Text>
                        </View>
                    )}
                </>
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    if (isAuthenticated) {
                        router.push('/lost-found/report');
                    } else {
                        router.push('/profile');
                    }
                }}
            >
                <Plus size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: Colors.dark.textPrimary,
        fontSize: 16,
        height: '100%',
    },
    filterButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
    },
    filtersContainer: {
        backgroundColor: Colors.dark.surface,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    filterSection: {
        marginBottom: 16,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    filtersRow: {
        paddingRight: 16,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    activeFilterChip: {
        backgroundColor: 'rgba(0, 128, 128, 0.2)',
        borderColor: Colors.dark.primary,
        borderWidth: 1,
    },
    filterChipText: {
        color: Colors.dark.textPrimary,
        fontSize: 12,
    },
    activeFilterChipText: {
        color: Colors.dark.primary,
        fontWeight: '600',
    },
    resetButton: {
        alignSelf: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: 8,
    },
    resetButtonText: {
        color: Colors.dark.danger,
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
    },
    myItemsButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
    },
    myItemsButtonText: {
        color: Colors.dark.accent,
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.dark.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});