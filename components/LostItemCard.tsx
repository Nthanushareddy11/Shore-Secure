import Colors from '@/constants/colors';
import { useBeachStore } from '@/store/beachStore';
import { LostItem } from '@/types';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, MessageCircle, Tag } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LostItemCardProps {
    item: LostItem;
    compact?: boolean;
}

export default function LostItemCard({ item, compact = false }: LostItemCardProps) {
    const router = useRouter();
    const { beaches } = useBeachStore();

    const beach = beaches.find(b => b.id === item.location.beachId);

    const getStatusColor = () => {
        switch (item.status) {
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
        switch (item.status) {
            case 'lost':
                return 'Lost';
            case 'found':
                return 'Found';
            case 'claimed':
                return 'Claimed';
            case 'resolved':
                return 'Resolved';
            default:
                return 'Unknown';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handlePress = () => {
        router.push(`/lost-found/item/${item.id}`);
    };

    if (compact) {
        return (
            <TouchableOpacity
                style={styles.compactContainer}
                onPress={handlePress}
                android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
                {item.imageUrl ? (
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.compactImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.compactImage, styles.noImage]}>
                        <Tag size={24} color={Colors.dark.textSecondary} />
                    </View>
                )}
                <View style={styles.compactContent}>
                    <View style={styles.statusBadge}>
                        <Text style={[styles.statusText, { color: getStatusColor() }]}>
                            {getStatusText()}
                        </Text>
                    </View>
                    <Text style={styles.compactTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.compactInfo}>
                        <MapPin size={12} color={Colors.dark.textSecondary} />
                        <Text style={styles.compactInfoText} numberOfLines={1}>
                            {beach?.name || 'Unknown Beach'}
                        </Text>
                    </View>
                    <View style={styles.compactInfo}>
                        <Calendar size={12} color={Colors.dark.textSecondary} />
                        <Text style={styles.compactInfoText}>{formatDate(item.date)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
            <View style={styles.header}>
                <View style={styles.statusBadge}>
                    <Text style={[styles.statusText, { color: getStatusColor() }]}>
                        {getStatusText()}
                    </Text>
                </View>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>

            <View style={styles.content}>
                {item.imageUrl ? (
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.image, styles.noImage]}>
                        <Tag size={40} color={Colors.dark.textSecondary} />
                    </View>
                )}

                <View style={styles.details}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

                    <View style={styles.infoRow}>
                        <MapPin size={14} color={Colors.dark.textSecondary} />
                        <Text style={styles.infoText}>{beach?.name || 'Unknown Beach'}</Text>
                    </View>

                    <View style={styles.tagsContainer}>
                        {item.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                        ))}
                        {item.tags.length > 3 && (
                            <Text style={styles.moreText}>+{item.tags.length - 3}</Text>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                </View>

                <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => router.push(`/lost-found/message/${item.id}`)}
                >
                    <MessageCircle size={16} color={Colors.dark.primary} />
                    <Text style={styles.contactButtonText}>Contact</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    date: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    content: {
        flexDirection: 'row',
        padding: 12,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
    },
    noImage: {
        backgroundColor: Colors.dark.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    details: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 8,
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    infoText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: 'rgba(0, 128, 128, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 12,
        color: Colors.dark.primary,
    },
    moreText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        alignSelf: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    categoryBadge: {
        backgroundColor: 'rgba(30, 144, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    categoryText: {
        fontSize: 12,
        color: Colors.dark.accent,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    contactButtonText: {
        fontSize: 14,
        color: Colors.dark.primary,
        fontWeight: '600',
    },
    compactContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        overflow: 'hidden',
        width: 160,
        marginRight: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    compactImage: {
        width: '100%',
        height: 100,
    },
    compactContent: {
        padding: 12,
    },
    compactTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    compactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    compactInfoText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
});