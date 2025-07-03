import LostItemCard from '@/components/LostItemCard';
import Colors from '@/constants/colors';
import { useLostItemStore } from '@/store/lostItemStore';
import { useUserStore } from '@/store/userStore';
import { LostItemStatus } from '@/types';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Plus
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function MyItemsScreen() {
    const router = useRouter();
    const { isAuthenticated, user } = useUserStore();
    const {
        userLostItems,
        fetchUserLostItems,
        deleteLostItem,
        isLoading
    } = useLostItemStore();

    const [statusFilter, setStatusFilter] = useState<LostItemStatus | null>(null);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserLostItems();
        }
    }, [isAuthenticated]);

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: () => {
                        deleteLostItem(id);
                        if (Platform.OS !== 'web') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const filteredItems = userLostItems
        .filter(item => statusFilter ? item.status === statusFilter : true)
        .sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    if (!isAuthenticated) {
        return (
            <View style={styles.authContainer}>
                <AlertTriangle size={40} color={Colors.dark.textSecondary} />
                <Text style={styles.authTitle}>Sign In Required</Text>
                <Text style={styles.authText}>
                    Please sign in to view and manage your lost and found items.
                </Text>
                <TouchableOpacity
                    style={styles.authButton}
                    onPress={() => router.push('/profile')}
                >
                    <Text style={styles.authButtonText}>Go to Profile</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    My Items ({userLostItems.length})
                </Text>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/lost-found/report')}
                >
                    <Plus size={16} color="#fff" />
                    <Text style={styles.addButtonText}>Add New</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filtersContainer}>
                <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Status:</Text>
                    <View style={styles.filterButtons}>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                statusFilter === null && styles.activeFilterButton
                            ]}
                            onPress={() => setStatusFilter(null)}
                        >
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    statusFilter === null && styles.activeFilterButtonText
                                ]}
                            >
                                All
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                statusFilter === 'lost' && styles.activeFilterButton
                            ]}
                            onPress={() => setStatusFilter('lost')}
                        >
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    statusFilter === 'lost' && styles.activeFilterButtonText
                                ]}
                            >
                                Lost
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                statusFilter === 'found' && styles.activeFilterButton
                            ]}
                            onPress={() => setStatusFilter('found')}
                        >
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    statusFilter === 'found' && styles.activeFilterButtonText
                                ]}
                            >
                                Found
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                statusFilter === 'claimed' && styles.activeFilterButton
                            ]}
                            onPress={() => setStatusFilter('claimed')}
                        >
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    statusFilter === 'claimed' && styles.activeFilterButtonText
                                ]}
                            >
                                Claimed
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                statusFilter === 'resolved' && styles.activeFilterButton
                            ]}
                            onPress={() => setStatusFilter('resolved')}
                        >
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    statusFilter === 'resolved' && styles.activeFilterButtonText
                                ]}
                            >
                                Resolved
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.sortSection}>
                    <Text style={styles.filterLabel}>Sort:</Text>
                    <TouchableOpacity
                        style={styles.sortButton}
                        onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                    >
                        <Text style={styles.sortButtonText}>
                            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                        </Text>
                        {sortOrder === 'newest' ? (
                            <ChevronDown size={16} color={Colors.dark.textPrimary} />
                        ) : (
                            <ChevronUp size={16} color={Colors.dark.textPrimary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

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
                            renderItem={({ item }) => (
                                <View style={styles.itemContainer}>
                                    <LostItemCard item={item} />
                                    <View style={styles.itemActions}>
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => router.push(`/lost-found/item/${item.id}`)}
                                        >
                                            <Text style={styles.editButtonText}>View Details</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDelete(item.id)}
                                        >
                                            <Text style={styles.deleteButtonText}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            contentContainerStyle={styles.listContent}
                        />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <AlertTriangle size={40} color={Colors.dark.textSecondary} />
                            <Text style={styles.emptyTitle}>No Items Found</Text>
                            <Text style={styles.emptyText}>
                                You haven't reported any {statusFilter || 'lost or found'} items yet.
                            </Text>
                            <TouchableOpacity
                                style={styles.reportButton}
                                onPress={() => router.push('/lost-found/report')}
                            >
                                <Text style={styles.reportButtonText}>Report an Item</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    filtersContainer: {
        padding: 16,
        backgroundColor: Colors.dark.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    filterSection: {
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    filterButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
    },
    activeFilterButton: {
        backgroundColor: 'rgba(0, 128, 128, 0.2)',
        borderColor: Colors.dark.primary,
        borderWidth: 1,
    },
    filterButtonText: {
        fontSize: 14,
        color: Colors.dark.textPrimary,
    },
    activeFilterButtonText: {
        color: Colors.dark.primary,
        fontWeight: '600',
    },
    sortSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    sortButtonText: {
        fontSize: 14,
        color: Colors.dark.textPrimary,
    },
    listContent: {
        padding: 16,
    },
    itemContainer: {
        marginBottom: 24,
    },
    itemActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    editButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        marginRight: 8,
    },
    editButtonText: {
        color: Colors.dark.accent,
        fontWeight: '600',
    },
    deleteButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: 8,
        marginLeft: 8,
    },
    deleteButtonText: {
        color: Colors.dark.danger,
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
        marginBottom: 24,
        lineHeight: 20,
    },
    reportButton: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    reportButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    authTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    authText: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    authButton: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    authButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});