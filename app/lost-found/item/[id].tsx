import Colors from '@/constants/colors';
import { useBeachStore } from '@/store/beachStore';
import { useLostItemStore } from '@/store/lostItemStore';
import { useUserStore } from '@/store/userStore';
import { LostItem } from '@/types';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Calendar,
    Check,
    MapPin,
    MessageCircle,
    Share2,
    Tag
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function ItemDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const {
        lostItems,
        selectItem,
        selectedItem,
        updateLostItem,
        getMatchingItems
    } = useLostItemStore();

    const { beaches } = useBeachStore();
    const { user, isAuthenticated } = useUserStore();

    const [matchingItems, setMatchingItems] = useState<LostItem[]>([]);

    useEffect(() => {
        if (id) {
            selectItem(id);
        }

        return () => {
            selectItem(null);
        };
    }, [id]);

    useEffect(() => {
        if (selectedItem) {
            const matches = getMatchingItems(selectedItem);
            setMatchingItems(matches);
        }
    }, [selectedItem]);

    const beach = selectedItem
        ? beaches.find(b => b.id === selectedItem.location.beachId)
        : null;

    const isOwner = selectedItem && user && selectedItem.userId === user.id;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleShare = () => {
        if (!selectedItem) return;

        // In a real app, this would use the Share API
        Alert.alert(
            'Share Item',
            `Share this ${selectedItem.status} item with others to help ${selectedItem.status === 'lost' ? 'find it' : 'find its owner'}.`
        );

        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
    };

    const handleContact = () => {
        if (!selectedItem) return;

        if (!isAuthenticated) {
            Alert.alert(
                'Sign In Required',
                'Please sign in to contact the user about this item.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign In', onPress: () => router.push('/profile') }
                ]
            );
            return;
        }

        router.push(`/lost-found/message/${selectedItem.id}`);
    };

    const handleUpdateStatus = (newStatus: 'claimed' | 'resolved') => {
        if (!selectedItem || !isOwner) return;

        Alert.alert(
            `Mark as ${newStatus === 'claimed' ? 'Claimed' : 'Resolved'}`,
            `Are you sure you want to mark this item as ${newStatus}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        updateLostItem(selectedItem.id, { status: newStatus });
                        if (Platform.OS !== 'web') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                    }
                }
            ]
        );
    };

    if (!selectedItem) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Item not found</Text>
            </View>
        );
    }

    const getStatusColor = () => {
        switch (selectedItem.status) {
            case 'lost':
                return Colors.dark.warning;
            case 'found':
                return Colors.dark.accent;
            case 'claimed':
                return Colors.dark.primary;
            case 'resolved':
                return Colors.dark.success;
            default:
                return Colors.dark.inactive;
        }
    };

    const getStatusText = () => {
        switch (selectedItem.status) {
            case 'lost':
                return 'Lost Item';
            case 'found':
                return 'Found Item';
            case 'claimed':
                return 'Claimed';
            case 'resolved':
                return 'Resolved';
            default:
                return 'Unknown';
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.statusBanner, { backgroundColor: `${getStatusColor()}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor() }]}>
                        {getStatusText()}
                    </Text>
                    <Text style={styles.dateText}>
                        {selectedItem.status === 'lost' ? 'Lost on ' : 'Found on '}
                        {formatDate(selectedItem.date)}
                    </Text>
                </View>

                {selectedItem.imageUrl ? (
                    <Image
                        source={{ uri: selectedItem.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.image, styles.noImage]}>
                        <Tag size={60} color={Colors.dark.textSecondary} />
                        <Text style={styles.noImageText}>No image available</Text>
                    </View>
                )}

                <View style={styles.contentContainer}>
                    <Text style={styles.title}>{selectedItem.title}</Text>

                    <View style={styles.infoRow}>
                        <MapPin size={16} color={Colors.dark.textSecondary} />
                        <Text style={styles.infoText}>
                            {beach?.name || 'Unknown Beach'}, {beach?.location || 'Unknown Location'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Calendar size={16} color={Colors.dark.textSecondary} />
                        <Text style={styles.infoText}>{formatDate(selectedItem.date)}</Text>
                    </View>

                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                            {selectedItem.category.charAt(0).toUpperCase() + selectedItem.category.slice(1)}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>{selectedItem.description}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tags</Text>
                        <View style={styles.tagsContainer}>
                            {selectedItem.tags.map((tag, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        <TouchableOpacity
                            style={styles.contactInfoContainer}
                            onPress={() => {
                                if (selectedItem.contactInfo.includes('@')) {
                                    Linking.openURL(`mailto:${selectedItem.contactInfo}`);
                                } else {
                                    Linking.openURL(`tel:${selectedItem.contactInfo}`);
                                }
                            }}
                        >
                            <Text style={styles.contactInfo}>{selectedItem.contactInfo}</Text>
                        </TouchableOpacity>
                    </View>

                    {matchingItems.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Potential Matches</Text>
                            <Text style={styles.matchesDescription}>
                                We found {matchingItems.length} potential {selectedItem.status === 'lost' ? 'found items' : 'lost items'} that might match this one.
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.matchesContainer}
                            >
                                {matchingItems.map(item => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.matchCard}
                                        onPress={() => router.push(`/lost-found/item/${item.id}`)}
                                    >
                                        {item.imageUrl ? (
                                            <Image
                                                source={{ uri: item.imageUrl }}
                                                style={styles.matchImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={[styles.matchImage, styles.noMatchImage]}>
                                                <Tag size={24} color={Colors.dark.textSecondary} />
                                            </View>
                                        )}
                                        <View style={styles.matchContent}>
                                            <Text style={styles.matchTitle} numberOfLines={1}>{item.title}</Text>
                                            <Text style={styles.matchDate}>{formatDate(item.date)}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {isOwner && selectedItem.status !== 'resolved' && (
                        <View style={styles.ownerActionsContainer}>
                            <Text style={styles.ownerActionsTitle}>Item Actions</Text>

                            {selectedItem.status === 'lost' || selectedItem.status === 'found' ? (
                                <TouchableOpacity
                                    style={styles.claimButton}
                                    onPress={() => handleUpdateStatus('claimed')}
                                >
                                    <Check size={16} color="#fff" />
                                    <Text style={styles.claimButtonText}>
                                        Mark as {selectedItem.status === 'lost' ? 'Found' : 'Claimed'}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            {selectedItem.status !== 'resolved' && (
                                <TouchableOpacity
                                    style={styles.resolveButton}
                                    onPress={() => handleUpdateStatus('resolved')}
                                >
                                    <Check size={16} color="#fff" />
                                    <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {!isOwner && selectedItem.status !== 'resolved' && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShare}
                    >
                        <Share2 size={20} color={Colors.dark.textPrimary} />
                        <Text style={styles.shareButtonText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={handleContact}
                    >
                        <MessageCircle size={20} color="#fff" />
                        <Text style={styles.contactButtonText}>Contact</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: Colors.dark.textSecondary,
        fontSize: 16,
    },
    statusBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.warning,
    },
    dateText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    image: {
        width: '100%',
        height: 250,
    },
    noImage: {
        backgroundColor: Colors.dark.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: Colors.dark.textSecondary,
        marginTop: 8,
    },
    contentContainer: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(30, 144, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 8,
        marginBottom: 16,
    },
    categoryText: {
        fontSize: 14,
        color: Colors.dark.accent,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        lineHeight: 24,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: 'rgba(0, 128, 128, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 14,
        color: Colors.dark.primary,
    },
    contactInfoContainer: {
        backgroundColor: Colors.dark.card,
        padding: 12,
        borderRadius: 8,
    },
    contactInfo: {
        fontSize: 16,
        color: Colors.dark.textPrimary,
    },
    matchesDescription: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 12,
    },
    matchesContainer: {
        paddingRight: 16,
        gap: 12,
    },
    matchCard: {
        width: 150,
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        overflow: 'hidden',
    },
    matchImage: {
        width: '100%',
        height: 100,
    },
    noMatchImage: {
        backgroundColor: Colors.dark.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    matchContent: {
        padding: 8,
    },
    matchTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 4,
    },
    matchDate: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    ownerActionsContainer: {
        backgroundColor: Colors.dark.card,
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    ownerActionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 12,
    },
    claimButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.primary,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 12,
        gap: 8,
    },
    claimButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resolveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.success,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    resolveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        backgroundColor: Colors.dark.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    shareButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 8,
        marginRight: 8,
        gap: 8,
    },
    shareButtonText: {
        color: Colors.dark.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: Colors.dark.primary,
        borderRadius: 8,
        marginLeft: 8,
        gap: 8,
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});