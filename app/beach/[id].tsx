import LocalRecommendations from '@/components/LocalRecommendations';
import SOSButton from '@/components/SOSButton';
import SafetyStatusBadge from '@/components/SafetyStatusBadge';
import WeatherInfoCard from '@/components/WeatherInfoCard';
import Colors from '@/constants/colors';
import { useBeachStore } from '@/store/beachStore';
import { useUserStore } from '@/store/userStore';
import * as Haptics from 'expo-haptics';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertTriangle,
    ChevronLeft,
    Clock,
    Heart,
    Info,
    MapPin,
    MessageCircle,
    Navigation,
    Phone,
    Share2
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

export default function BeachDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const {
        selectedBeach,
        selectBeach,
        weatherData,
        isLoading
    } = useBeachStore();

    const {
        user,
        saveBeach,
        unsaveBeach,
        isAuthenticated
    } = useUserStore();

    useEffect(() => {
        if (id) {
            selectBeach(id);
        }
    }, [id]);

    const isBeachSaved = () => {
        if (!user || !selectedBeach) return false;
        return user.savedBeaches.includes(selectedBeach.id);
    };

    const handleToggleSave = () => {
        if (!isAuthenticated || !selectedBeach) return;

        if (isBeachSaved()) {
            unsaveBeach(selectedBeach.id);
        } else {
            saveBeach(selectedBeach.id);
        }

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handleShare = () => {
        // In a real app, this would use the Share API
        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
    };

    const handleGetDirections = () => {
        // In a real app, this would open maps
        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
    };

    const handleEmergencyCall = () => {
        if (Platform.OS === 'web') {
            alert('Emergency call would be initiated: 108');
            return;
        }

        // Vibrate to indicate emergency action
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        // In a real app, this would use Linking to make a call
        Linking.openURL('tel:108');
    };

    const renderSafetyStatus = () => {
        if (!selectedBeach?.currentSafetyStatus) return null;

        const status = selectedBeach.currentSafetyStatus;
        let message = '';

        switch (status) {
            case 'safe':
                message = 'Conditions are currently safe for most beach activities.';
                break;
            case 'moderate':
                message = 'Use caution. Some activities may be affected by current conditions.';
                break;
            case 'dangerous':
                message = 'Dangerous conditions present. Swimming and water activities not recommended.';
                break;
        }

        return (
            <View style={[
                styles.safetyContainer,
                status === 'safe' && { backgroundColor: 'rgba(76, 175, 80, 0.1)' },
                status === 'moderate' && { backgroundColor: 'rgba(255, 152, 0, 0.1)' },
                status === 'dangerous' && { backgroundColor: 'rgba(244, 67, 54, 0.1)' },
            ]}>
                <View style={styles.safetyHeader}>
                    <SafetyStatusBadge status={status} size="large" />
                    <Text style={styles.safetyTitle}>
                        {status === 'safe' ? 'Safe Conditions' :
                            status === 'moderate' ? 'Moderate Risk' :
                                'Dangerous Conditions'}
                    </Text>
                </View>
                <Text style={styles.safetyMessage}>{message}</Text>
            </View>
        );
    };

    if (isLoading || !selectedBeach) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.dark.primary} />
                <Text style={styles.loadingText}>Loading beach information...</Text>
            </View>
        );
    }

    const beachWeather = weatherData[selectedBeach.id];

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Image Gallery */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: selectedBeach.images[currentImageIndex] }}
                        style={[styles.image, { width }]}
                        resizeMode="cover"
                    />

                    {/* Image Pagination */}
                    {selectedBeach.images.length > 1 && (
                        <View style={styles.pagination}>
                            {selectedBeach.images.map((_, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.paginationDot,
                                        index === currentImageIndex && styles.paginationDotActive
                                    ]}
                                    onPress={() => setCurrentImageIndex(index)}
                                />
                            ))}
                        </View>
                    )}

                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Beach Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.beachName}>{selectedBeach.name}</Text>

                    <View style={styles.locationRow}>
                        <MapPin size={16} color={Colors.dark.textSecondary} />
                        <Text style={styles.locationText}>{selectedBeach.location}</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleToggleSave}
                        >
                            <Heart
                                size={20}
                                color={isBeachSaved() ? Colors.dark.danger : Colors.dark.textPrimary}
                                fill={isBeachSaved() ? Colors.dark.danger : 'transparent'}
                            />
                            <Text style={styles.actionButtonText}>
                                {isBeachSaved() ? 'Saved' : 'Save'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleShare}
                        >
                            <Share2 size={20} color={Colors.dark.textPrimary} />
                            <Text style={styles.actionButtonText}>Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleGetDirections}
                        >
                            <Navigation size={20} color={Colors.dark.textPrimary} />
                            <Text style={styles.actionButtonText}>Directions</Text>
                        </TouchableOpacity>

                        <Link href={`/community/${selectedBeach.id}`} asChild>
                            <TouchableOpacity style={styles.actionButton}>
                                <MessageCircle size={20} color={Colors.dark.textPrimary} />
                                <Text style={styles.actionButtonText}>Community</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* Safety Status */}
                    {renderSafetyStatus()}

                    {/* Weather Info */}
                    {beachWeather && (
                        <WeatherInfoCard weatherData={beachWeather} />
                    )}

                    {/* Local Recommendations */}
                    <LocalRecommendations beachId={selectedBeach.id} />

                    {/* Emergency Call Button */}
                    <TouchableOpacity
                        style={styles.emergencyCallButton}
                        onPress={handleEmergencyCall}
                    >
                        <Phone size={20} color="#fff" />
                        <Text style={styles.emergencyCallText}>Emergency Call (108)</Text>
                    </TouchableOpacity>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.description}>{selectedBeach.description}</Text>
                    </View>

                    {/* Facilities */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Facilities</Text>
                        <View style={styles.facilitiesContainer}>
                            {selectedBeach.facilities.map((facility, index) => (
                                <View key={index} style={styles.facilityBadge}>
                                    <Text style={styles.facilityText}>{facility}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Activities */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Activities</Text>
                        <View style={styles.activitiesContainer}>
                            {selectedBeach.activities.map((activity, index) => (
                                <View key={index} style={styles.activityBadge}>
                                    <Text style={styles.activityText}>{activity}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Safety Tips */}
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <AlertTriangle size={20} color={Colors.dark.warning} />
                            <Text style={styles.sectionTitle}>Safety Tips</Text>
                        </View>
                        <View style={styles.safetyTipsContainer}>
                            {selectedBeach.safetyTips.map((tip, index) => (
                                <View key={index} style={styles.safetyTipRow}>
                                    <View style={styles.safetyTipBullet} />
                                    <Text style={styles.safetyTipText}>{tip}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Additional Info */}
                    <View style={styles.section}>
                        <View style={styles.infoRow}>
                            <Info size={16} color={Colors.dark.textSecondary} />
                            <Text style={styles.infoLabel}>Lifeguard Hours:</Text>
                            <Text style={styles.infoValue}>{selectedBeach.lifeguardHours}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Clock size={16} color={Colors.dark.textSecondary} />
                            <Text style={styles.infoLabel}>Best Time to Visit:</Text>
                            <Text style={styles.infoValue}>{selectedBeach.bestTimeToVisit}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <SOSButton />
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
        marginTop: 16,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        height: 250,
    },
    pagination: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    paginationDotActive: {
        backgroundColor: '#fff',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        padding: 16,
    },
    beachName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 4,
    },
    locationText: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 12,
    },
    actionButton: {
        alignItems: 'center',
        gap: 4,
    },
    actionButtonText: {
        fontSize: 14,
        color: Colors.dark.textPrimary,
    },
    safetyContainer: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    safetyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    safetyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
    },
    safetyMessage: {
        fontSize: 14,
        color: Colors.dark.textPrimary,
        lineHeight: 20,
    },
    emergencyCallButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.danger,
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
        gap: 8,
    },
    emergencyCallText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 12,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    description: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        lineHeight: 24,
    },
    facilitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    facilityBadge: {
        backgroundColor: 'rgba(30, 144, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    facilityText: {
        fontSize: 14,
        color: Colors.dark.accent,
    },
    activitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    activityBadge: {
        backgroundColor: 'rgba(0, 128, 128, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    activityText: {
        fontSize: 14,
        color: Colors.dark.primary,
    },
    safetyTipsContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
    },
    safetyTipRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    safetyTipBullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.dark.warning,
        marginTop: 6,
        marginRight: 8,
    },
    safetyTipText: {
        flex: 1,
        fontSize: 14,
        color: Colors.dark.textPrimary,
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginRight: 4,
    },
    infoValue: {
        fontSize: 14,
        color: Colors.dark.textPrimary,
        fontWeight: '500',
    },
});