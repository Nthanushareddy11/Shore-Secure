import Colors from '@/constants/colors';
import { Beach } from '@/types';
import { MapPin } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import SafetyStatusBadge from './SafetyStatusBadge';

interface BeachCardProps {
    beach: Beach;
    compact?: boolean;
    onPress?: () => void;
}

export default function BeachCard({ beach, compact = false, onPress }: BeachCardProps) {
    if (compact) {
        return (
            <Pressable
                style={styles.compactContainer}
                onPress={onPress}
                android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
                <Image
                    source={{ uri: beach.images[0] }}
                    style={styles.compactImage}
                    resizeMode="cover"
                />
                <View style={styles.compactContent}>
                    <Text style={styles.compactTitle} numberOfLines={1}>{beach.name}</Text>
                    <View style={styles.locationRow}>
                        <MapPin size={14} color={Colors.dark.textSecondary} />
                        <Text style={styles.locationText} numberOfLines={1}>{beach.location}</Text>
                    </View>
                    {beach.currentSafetyStatus && (
                        <SafetyStatusBadge status={beach.currentSafetyStatus} size="small" />
                    )}
                </View>
            </Pressable>
        );
    }

    return (
        <Pressable
            style={styles.container}
            onPress={onPress}
            android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
            <Image
                source={{ uri: beach.images[0] }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.content}>
                <Text style={styles.title}>{beach.name}</Text>
                <View style={styles.locationRow}>
                    <MapPin size={16} color={Colors.dark.textSecondary} />
                    <Text style={styles.locationText}>{beach.location}</Text>
                </View>
                <Text style={styles.description} numberOfLines={2}>
                    {beach.description}
                </Text>
                <View style={styles.footer}>
                    {beach.currentSafetyStatus && (
                        <SafetyStatusBadge status={beach.currentSafetyStatus} />
                    )}
                    <View style={styles.facilitiesContainer}>
                        {beach.facilities.slice(0, 3).map((facility, index) => (
                            <View key={index} style={styles.facilityBadge}>
                                <Text style={styles.facilityText}>{facility}</Text>
                            </View>
                        ))}
                        {beach.facilities.length > 3 && (
                            <Text style={styles.moreText}>+{beach.facilities.length - 3}</Text>
                        )}
                    </View>
                </View>
            </View>
        </Pressable>
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
    image: {
        width: '100%',
        height: 180,
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    locationText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    description: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 12,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    facilitiesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    facilityBadge: {
        backgroundColor: 'rgba(30, 144, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    facilityText: {
        fontSize: 12,
        color: Colors.dark.accent,
    },
    moreText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
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
        marginBottom: 4,
    },
});