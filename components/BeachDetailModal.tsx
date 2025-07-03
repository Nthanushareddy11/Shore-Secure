import Colors from '@/constants/colors';
import { useBeachStore } from '@/store/beachStore';
import { Beach } from '@/types';
import { Clock, Droplets, Eye, MapPin, Sun, Thermometer, Wind, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import SafetyStatusBadge from './SafetyStatusBadge';

interface BeachDetailModalProps {
    beach: Beach;
    visible: boolean;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function BeachDetailModal({ beach, visible, onClose }: BeachDetailModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { weatherData, isLoading } = useBeachStore();

    const beachWeather = weatherData[beach.id];

    useEffect(() => {
        if (visible) {
            setCurrentImageIndex(0);
        }
    }, [visible, beach.id]);

    const handleNextImage = () => {
        if (currentImageIndex < beach.images.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
        } else {
            setCurrentImageIndex(0);
        }
    };

    const renderWeatherData = () => {
        if (isLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.dark.primary} />
                    <Text style={styles.loadingText}>Loading weather data...</Text>
                </View>
            );
        }

        if (!beachWeather) {
            return (
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>Weather data not available</Text>
                </View>
            );
        }

        return (
            <View style={styles.weatherContainer}>
                <View style={styles.weatherRow}>
                    <View style={styles.weatherItem}>
                        <Thermometer size={20} color={Colors.dark.primary} />
                        <Text style={styles.weatherLabel}>Temperature</Text>
                        <Text style={styles.weatherValue}>{beachWeather.temperature.toFixed(1)}°C</Text>
                    </View>

                    <View style={styles.weatherItem}>
                        <Thermometer size={20} color={Colors.dark.accent} />
                        <Text style={styles.weatherLabel}>Water Temp</Text>
                        <Text style={styles.weatherValue}>{beachWeather.waterTemperature.toFixed(1)}°C</Text>
                    </View>

                    <View style={styles.weatherItem}>
                        <Wind size={20} color={Colors.dark.primary} />
                        <Text style={styles.weatherLabel}>Wind</Text>
                        <Text style={styles.weatherValue}>{beachWeather.windSpeed.toFixed(1)} km/h</Text>
                        <Text style={styles.weatherSubvalue}>{beachWeather.windDirection}</Text>
                    </View>
                </View>

                <View style={styles.weatherRow}>
                    <View style={styles.weatherItem}>
                        <Droplets size={20} color={Colors.dark.primary} />
                        <Text style={styles.weatherLabel}>Wave Height</Text>
                        <Text style={styles.weatherValue}>{beachWeather.waveHeight.toFixed(1)} m</Text>
                    </View>

                    <View style={styles.weatherItem}>
                        <Sun size={20} color={Colors.dark.warning} />
                        <Text style={styles.weatherLabel}>UV Index</Text>
                        <Text style={styles.weatherValue}>{beachWeather.uvIndex}</Text>
                        <Text style={styles.weatherSubvalue}>
                            {beachWeather.uvIndex > 7 ? 'Very High' :
                                beachWeather.uvIndex > 5 ? 'High' :
                                    beachWeather.uvIndex > 2 ? 'Moderate' : 'Low'}
                        </Text>
                    </View>

                    <View style={styles.weatherItem}>
                        <Eye size={20} color={Colors.dark.primary} />
                        <Text style={styles.weatherLabel}>Visibility</Text>
                        <Text style={styles.weatherValue}>{beachWeather.visibility}</Text>
                    </View>
                </View>

                <View style={styles.timestampContainer}>
                    <Clock size={14} color={Colors.dark.textSecondary} />
                    <Text style={styles.timestampText}>
                        Updated: {new Date(beachWeather.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    const renderSafetyInfo = () => {
        return (
            <View style={styles.safetyContainer}>
                <View style={styles.safetyHeader}>
                    <Text style={styles.safetyTitle}>Safety Status</Text>
                    <SafetyStatusBadge status={beach.currentSafetyStatus || 'safe'} />
                </View>

                <View style={styles.safetyTipsContainer}>
                    <Text style={styles.safetyTipsTitle}>Safety Tips:</Text>
                    {beach.safetyTips.map((tip, index) => (
                        <View key={index} style={styles.safetyTip}>
                            <Text style={styles.safetyTipBullet}>•</Text>
                            <Text style={styles.safetyTipText}>{tip}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.lifeguardInfo}>
                    <Text style={styles.lifeguardTitle}>Lifeguard Hours:</Text>
                    <Text style={styles.lifeguardHours}>{beach.lifeguardHours}</Text>
                </View>
            </View>
        );
    };

    const renderFacilities = () => {
        return (
            <View style={styles.facilitiesContainer}>
                <Text style={styles.facilitiesTitle}>Facilities & Activities</Text>

                <View style={styles.facilitiesList}>
                    {beach.facilities.map((facility, index) => (
                        <View key={index} style={styles.facilityBadge}>
                            <Text style={styles.facilityText}>{facility}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.activitiesTitle}>Popular Activities:</Text>
                <View style={styles.activitiesList}>
                    {beach.activities.map((activity, index) => (
                        <View key={index} style={styles.activityBadge}>
                            <Text style={styles.activityText}>{activity}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.accessibilityTitle}>Accessibility:</Text>
                <View style={styles.accessibilityList}>
                    {beach.accessibility.map((item, index) => (
                        <View key={index} style={styles.accessibilityBadge}>
                            <Text style={styles.accessibilityText}>{item}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X size={24} color={Colors.dark.textPrimary} />
                    </TouchableOpacity>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: beach.images[currentImageIndex] }}
                                style={styles.image}
                                resizeMode="cover"
                            />

                            {beach.images.length > 1 && (
                                <TouchableOpacity
                                    style={styles.nextImageButton}
                                    onPress={handleNextImage}
                                >
                                    <Text style={styles.nextImageButtonText}>
                                        {currentImageIndex + 1}/{beach.images.length}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.contentContainer}>
                            <Text style={styles.beachName}>{beach.name}</Text>

                            <View style={styles.locationContainer}>
                                <MapPin size={16} color={Colors.dark.textSecondary} />
                                <Text style={styles.locationText}>{beach.location}</Text>
                            </View>

                            <Text style={styles.description}>{beach.description}</Text>

                            {renderWeatherData()}
                            {renderSafetyInfo()}
                            {renderFacilities()}

                            <View style={styles.additionalInfo}>
                                <Text style={styles.additionalInfoTitle}>Additional Information</Text>
                                <View style={styles.additionalInfoItem}>
                                    <Text style={styles.additionalInfoLabel}>Best Time to Visit:</Text>
                                    <Text style={styles.additionalInfoValue}>{beach.bestTimeToVisit}</Text>
                                </View>

                                <View style={styles.additionalInfoItem}>
                                    <Text style={styles.additionalInfoLabel}>Water Quality:</Text>
                                    <Text style={styles.additionalInfoValue}>{beach.waterQuality}</Text>
                                </View>

                                <View style={styles.additionalInfoItem}>
                                    <Text style={styles.additionalInfoLabel}>Nearby City:</Text>
                                    <Text style={styles.additionalInfoValue}>{beach.nearbyCity}</Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Save</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.primaryActionButton]}>
                            <Text style={styles.primaryActionButtonText}>Get Directions</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.dark.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '90%',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 80,
    },
    imageContainer: {
        width: '100%',
        height: 250,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    nextImageButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    nextImageButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    contentContainer: {
        padding: 16,
    },
    beachName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 4,
    },
    locationText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    description: {
        fontSize: 14,
        color: Colors.dark.textPrimary,
        lineHeight: 20,
        marginBottom: 16,
    },
    weatherContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    weatherRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    weatherItem: {
        alignItems: 'center',
        width: (width - 64) / 3,
    },
    weatherLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: 4,
        marginBottom: 2,
    },
    weatherValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
    },
    weatherSubvalue: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    timestampContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    timestampText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    loadingContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        height: 150,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    noDataContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
    },
    noDataText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontStyle: 'italic',
    },
    safetyContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    safetyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    safetyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
    },
    safetyTipsContainer: {
        marginBottom: 12,
    },
    safetyTipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    safetyTip: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    safetyTipBullet: {
        fontSize: 14,
        color: Colors.dark.textPrimary,
        marginRight: 8,
    },
    safetyTipText: {
        fontSize: 14,
        color: Colors.dark.textPrimary,
        flex: 1,
    },
    lifeguardInfo: {
        marginTop: 8,
    },
    lifeguardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 4,
    },
    lifeguardHours: {
        fontSize: 14,
        color: Colors.dark.textPrimary,
    },
    facilitiesContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    facilitiesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 12,
    },
    facilitiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    facilityBadge: {
        backgroundColor: 'rgba(30, 144, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    facilityText: {
        fontSize: 12,
        color: Colors.dark.accent,
    },
    activitiesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    activitiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    activityBadge: {
        backgroundColor: 'rgba(0, 128, 128, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    activityText: {
        fontSize: 12,
        color: Colors.dark.primary,
    },
    accessibilityTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    accessibilityList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    accessibilityBadge: {
        backgroundColor: 'rgba(128, 128, 128, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    accessibilityText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    additionalInfo: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
    },
    additionalInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 12,
    },
    additionalInfoItem: {
        marginBottom: 8,
    },
    additionalInfoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 2,
    },
    additionalInfoValue: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.dark.background,
    },
    actionButton: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginRight: 8,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
    },
    primaryActionButton: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
        marginRight: 0,
        marginLeft: 8,
    },
    primaryActionButtonText: {
        color: '#fff',
    },
});