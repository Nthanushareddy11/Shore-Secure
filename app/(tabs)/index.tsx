import BeachCard from '@/components/BeachCard';
import LostItemCard from '@/components/LostItemCard';
import SOSButton from '@/components/SOSButton';
import Colors from '@/constants/colors';
import { useBeachStore } from '@/store/beachStore';
import { useLostItemStore } from '@/store/lostItemStore';
import { useUserStore } from '@/store/userStore';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, CreditCard as Edit3, FileText, MapPin, MessageCircle, Navigation, Search, Shield, Waves, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface UserLocation {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    region?: string;
    country?: string;
    isManual?: boolean;
}

export default function HomeScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [manualLocation, setManualLocation] = useState('');
    const [locationMode, setLocationMode] = useState<'auto' | 'manual'>('auto');
    const [permissionStatus, setPermissionStatus] = useState<Location.LocationPermissionResponse | null>(null);
    // Easter egg states
    const [showEasterEggModal, setShowEasterEggModal] = useState(false);
    const [searchText, setSearchText] = useState('What are you looking for?');
    const [yodaQuote, setYodaQuote] = useState('');
    const glowAnimation = useState(new Animated.Value(0))[0];

    const {
        beaches,
        nearbyBeaches,
        fetchBeaches,
        fetchNearbyBeaches,
        isLoading,
        offlineMode,
        setOfflineMode,
        error: beachError
    } = useBeachStore();

    const { user, isAuthenticated } = useUserStore();
    const { lostItems, fetchLostItems } = useLostItemStore();

    // Yoda quotes for the Easter egg
    const yodaQuotes = [
        'Do or do not. There is no try.',
        'Fear is the path to the dark side.',
        'Size matters not.',
        'You must unlearn what you have learned.',
        'The greatest teacher, failure is.'
    ];

    useEffect(() => {
        initializeData();
    }, []);

    const initializeData = async () => {
        try {
            await fetchBeaches();
            if (locationMode === 'auto') {
                await getLocationAsync();
            }
            await fetchLostItems();
            checkNetworkStatus();
        } catch (error) {
            console.error('Error initializing data:', error);
        }
    };

    const checkNetworkStatus = () => {
        const isOffline = false;
        setOfflineMode(isOffline);
    };

    const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
        try {
            const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });
            if (reverseGeocodedAddress.length > 0) {
                const location = reverseGeocodedAddress[0];
                const parts = [];
                if (location.city) parts.push(location.city);
                if (location.region) parts.push(location.region);
                if (location.country) parts.push(location.country);
                return parts.length > 0 ? parts.join(', ') : 'Unknown location';
            }
            return 'Unknown location';
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return 'Location unavailable';
        }
    };

    const geocodeAddress = async (address: string): Promise<UserLocation | null> => {
        try {
            const geocodedAddress = await Location.geocodeAsync(address);
            if (geocodedAddress.length > 0) {
                const coords = geocodedAddress[0];
                const fullAddress = await reverseGeocode(coords.latitude, coords.longitude);
                return {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    address: fullAddress,
                    isManual: true
                };
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    };

    const getLocationAsync = async () => {
        try {
            setLocationLoading(true);
            setLocationError(null);
            const isLocationEnabled = await Location.hasServicesEnabledAsync();
            if (!isLocationEnabled) {
                setLocationError('Location services are disabled');
                setLocationLoading(false);
                setDefaultLocation();
                return;
            }
            const permission = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(permission);
            if (permission.status !== 'granted') {
                setLocationError('Location permission denied');
                setLocationLoading(false);
                Alert.alert(
                    'Location Permission Required',
                    'This app needs location access to find beaches near you. You can also set your location manually.',
                    [
                        { text: 'Set Manually', onPress: () => setShowLocationModal(true) },
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open Settings',
                            onPress: () => {
                                if (Platform.OS === 'ios') {
                                    Alert.alert(
                                        'Enable Location',
                                        'Go to Settings > Privacy & Security > Location Services > Beach Safety App and select "While Using App"'
                                    );
                                }
                            }
                        }
                    ]
                );
                setDefaultLocation();
                return;
            }
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 15000,
                maximumAge: 300000,
            });
            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };
            const address = await reverseGeocode(coords.latitude, coords.longitude);
            const locationData: UserLocation = {
                ...coords,
                address,
                isManual: false
            };
            setUserLocation(locationData);
            await fetchNearbyBeaches(coords.latitude, coords.longitude, 50);
            setLocationLoading(false);
        } catch (error) {
            console.error('Error getting location:', error);
            setLocationError('Error getting location');
            setLocationLoading(false);
            setDefaultLocation();
        }
    };

    const setDefaultLocation = () => {
        const fallbackLocation: UserLocation = {
            latitude: 15.5491,
            longitude: 73.7632,
            address: 'Goa, India (Default)',
            isManual: false
        };
        setUserLocation(fallbackLocation);
        fetchNearbyBeaches(fallbackLocation.latitude, fallbackLocation.longitude, 50);
    };

    const handleManualLocationSubmit = async () => {
        if (!manualLocation.trim()) {
            Alert.alert('Error', 'Please enter a location');
            return;
        }
        setLocationLoading(true);
        const location = await geocodeAddress(manualLocation.trim());
        if (location) {
            setUserLocation(location);
            setLocationMode('manual');
            setLocationError(null);
            await fetchNearbyBeaches(location.latitude, location.longitude, 50);
            setShowLocationModal(false);
            setManualLocation('');
        } else {
            Alert.alert('Error', 'Could not find the specified location. Please try again.');
        }
        setLocationLoading(false);
    };

    const handleLocationModeSwitch = () => {
        if (locationMode === 'auto') {
            setShowLocationModal(true);
        } else {
            setLocationMode('auto');
            getLocationAsync();
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchBeaches();
            if (userLocation) {
                await fetchNearbyBeaches(userLocation.latitude, userLocation.longitude, 50);
            }
            await fetchLostItems();
            if (locationMode === 'auto') {
                await getLocationAsync();
            }
        } catch (error) {
            console.error('Error refreshing:', error);
        }
        setRefreshing(false);
    };

    const getSavedBeaches = () => {
        if (!user || !user.savedBeaches || !user.savedBeaches.length) return [];
        return beaches.filter(beach => user.savedBeaches.includes(beach.id));
    };

    const getRecentLostItems = () => {
        return lostItems
            .filter(item => item.status === 'lost' || item.status === 'found')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
    };

    const getLocationName = () => {
        if (locationLoading) return 'Getting location...';
        if (locationError && !userLocation) return 'Location unavailable';
        if (!userLocation) return 'Location unavailable';
        return userLocation.address || 'Unknown location';
    };

    const getCurrentTime = () => {
        const now = new Date();
        const hour = now.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const handleLocationPress = () => {
        setShowLocationModal(true);
    };

    // Easter egg: Handle long press on search bar
    const handleSearchLongPress = () => {
        setSearchText('Search the Galaxy, you must');
        setYodaQuote(yodaQuotes[Math.floor(Math.random() * yodaQuotes.length)]);
        setShowEasterEggModal(true);
        // Start lightsaber glow animation
        Animated.sequence([
            Animated.timing(glowAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(glowAnimation, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();
        // Optional: Add sound effect (requires audio asset)
        // Example: Sound.playAsync(require('../assets/lightsaber.mp3'));
        ToastAndroid.show('The Force is strong with this one!', ToastAndroid.SHORT);
        setTimeout(() => {
            setSearchText('What are you looking for?');
            setShowEasterEggModal(false);
        }, 4000);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.dark.primary}
                        colors={[Colors.dark.primary]}
                        progressBackgroundColor="transparent"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.heroSection}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.locationContainer}
                            onPress={handleLocationPress}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.locationDot,
                                { backgroundColor: locationError && !userLocation ? Colors.dark.danger : Colors.dark.success }
                            ]} />
                            <Text style={styles.locationText} numberOfLines={1}>
                                {getLocationName()}
                            </Text>
                            <TouchableOpacity
                                style={styles.editLocationButton}
                                onPress={handleLocationPress}
                            >
                                <Edit3 size={12} color={Colors.dark.textSecondary} strokeWidth={1.5} />
                            </TouchableOpacity>
                            {locationLoading && (
                                <ActivityIndicator
                                    size="small"
                                    color={Colors.dark.textSecondary}
                                    style={styles.locationLoader}
                                />
                            )}
                            {offlineMode && <View style={styles.offlineIndicator} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.notificationButton}>
                            <Bell size={18} color={Colors.dark.textSecondary} strokeWidth={1.5} />
                            <View style={styles.notificationDot} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.greetingSection}>
                        <Text style={styles.timeGreeting}>{getCurrentTime()}</Text>
                        <Text style={styles.userName}>
                            {isAuthenticated ? user?.name.split(' ')[0] : 'Explorer'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.searchContainer}
                        onPress={() => router.push('/search')}
                        onLongPress={handleSearchLongPress}
                        activeOpacity={0.7}
                    >
                        <View style={styles.searchIcon}>
                            <Search size={16} color={Colors.dark.textSecondary} strokeWidth={1.5} />
                        </View>
                        <Text style={styles.searchText}>{searchText}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsSection}>
                    <View style={styles.statsGrid}>
                        <View style={styles.primaryStat}>
                            <View style={styles.statIconContainer}>
                                <Waves size={20} color={Colors.dark.primary} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.primaryStatNumber}>
                                {nearbyBeaches?.length || 0}
                            </Text>
                            <Text style={styles.primaryStatLabel}>Nearby beaches</Text>
                        </View>
                        <View style={styles.secondaryStats}>
                            <View style={styles.miniStat}>
                                <Text style={styles.miniStatNumber}>
                                    {beaches.filter(b => b.currentSafetyStatus === 'safe').length}
                                </Text>
                                <Text style={styles.miniStatLabel}>Safe now</Text>
                            </View>
                            <View style={styles.miniStat}>
                                <Text style={styles.miniStatNumber}>{getRecentLostItems().length}</Text>
                                <Text style={styles.miniStatLabel}>Lost items</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {locationError && !userLocation && (
                    <View style={styles.statusSection}>
                        <TouchableOpacity
                            style={styles.warningBanner}
                            activeOpacity={0.8}
                            onPress={handleLocationPress}
                        >
                            <View style={styles.warningIndicator}>
                                <MapPin size={16} color={Colors.dark.warning} strokeWidth={1.5} />
                            </View>
                            <View style={styles.statusContent}>
                                <Text style={styles.warningTitle}>Location needed</Text>
                                <Text style={styles.statusDescription}>Set your location to find nearby beaches</Text>
                            </View>
                            <View style={styles.statusAction}>
                                <ChevronRight size={14} color={Colors.dark.textTertiary} strokeWidth={1.5} />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {!locationError && userLocation && (
                    <View style={styles.statusSection}>
                        <TouchableOpacity style={styles.statusBanner} activeOpacity={0.8}>
                            <View style={styles.statusIndicator}>
                                <Shield size={16} color={Colors.dark.success} strokeWidth={1.5} />
                            </View>
                            <View style={styles.statusContent}>
                                <Text style={styles.statusTitle}>Conditions are excellent</Text>
                                <Text style={styles.statusDescription}>Perfect for swimming • Low tide</Text>
                            </View>
                            <View style={styles.statusAction}>
                                <ChevronRight size={14} color={Colors.dark.textTertiary} strokeWidth={1.5} />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Discover</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/explore')}
                            style={styles.seeAllButton}
                        >
                            <Text style={styles.seeAllText}>View all</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingState}>
                            <ActivityIndicator color={Colors.dark.primary} size="small" />
                            <Text style={styles.loadingText}>Finding beaches...</Text>
                        </View>
                    ) : beachError ? (
                        <View style={styles.errorState}>
                            <View style={styles.emptyIcon}>
                                <MapPin size={24} color={Colors.dark.danger} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>Unable to load beaches</Text>
                            <Text style={styles.emptyDescription}>
                                There was an error loading beach data. Please try again.
                            </Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => {
                                    fetchBeaches();
                                    if (userLocation) {
                                        fetchNearbyBeaches(userLocation.latitude, userLocation.longitude, 50);
                                    }
                                }}
                            >
                                <Text style={styles.retryButtonText}>Try again</Text>
                            </TouchableOpacity>
                        </View>
                    ) : nearbyBeaches && nearbyBeaches.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselContent}
                            decelerationRate="fast"
                            snapToInterval={width * 0.8}
                        >
                            {nearbyBeaches.slice(0, 5).map(beach => (
                                <BeachCard
                                    key={beach.id}
                                    beach={beach}
                                    compact
                                    onPress={() => router.push(`/beach/${beach.id}`)}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <MapPin size={24} color={Colors.dark.textTertiary} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.emptyTitle}>No beaches nearby</Text>
                            <Text style={styles.emptyDescription}>
                                {!userLocation
                                    ? 'Set your location to find beaches near you'
                                    : "We couldn't find beaches in your area"
                                }
                            </Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={handleLocationPress}
                            >
                                <Text style={styles.retryButtonText}>
                                    {!userLocation ? 'Set Location' : 'Change Location'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {getRecentLostItems().length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent activity</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/lost-found')}
                                style={styles.seeAllButton}
                            >
                                <Text style={styles.seeAllText}>View all</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselContent}
                        >
                            {getRecentLostItems().map(item => (
                                <LostItemCard
                                    key={item.id}
                                    item={item}
                                    compact
                                    onPress={() => router.push(`/lost-found/item/${item.id}`)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {isAuthenticated && getSavedBeaches().length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Your favorites</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/profile')}
                                style={styles.seeAllButton}
                            >
                                <Text style={styles.seeAllText}>Manage</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselContent}
                        >
                            {getSavedBeaches().slice(0, 5).map(beach => (
                                <BeachCard
                                    key={beach.id}
                                    beach={beach}
                                    compact
                                    onPress={() => router.push(`/beach/${beach.id}`)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Quick actions</Text>
                    </View>
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionItem, styles.primaryAction]}
                            onPress={() => router.push('/lost-found/report')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.actionIcon}>
                                <FileText size={18} color="#fff" strokeWidth={1.5} />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Report item</Text>
                                <Text style={styles.actionSubtitle}>Lost or found something?</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => router.push('/chat')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.actionIconSecondary}>
                                <MessageCircle size={18} color={Colors.dark.primary} strokeWidth={1.5} />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitleSecondary}>Ask ShoreBot</Text>
                                <Text style={styles.actionSubtitle}>Get instant help</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Location Selection Modal */}
            <Modal
                visible={showLocationModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowLocationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choose Location</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowLocationModal(false)}
                            >
                                <X size={20} color={Colors.dark.textSecondary} strokeWidth={1.5} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.locationModeContainer}>
                            <TouchableOpacity
                                style={[styles.locationModeOption, locationMode === 'auto' && styles.locationModeActive]}
                                onPress={() => {
                                    setLocationMode('auto');
                                    setShowLocationModal(false);
                                    getLocationAsync();
                                }}
                            >
                                <Navigation size={18} color={locationMode === 'auto' ? Colors.dark.primary : Colors.dark.textSecondary} strokeWidth={1.5} />
                                <View style={styles.locationModeContent}>
                                    <Text style={[styles.locationModeTitle, locationMode === 'auto' && styles.locationModeActiveText]}>
                                        Auto-detect
                                    </Text>
                                    <Text style={styles.locationModeDescription}>
                                        Use your device's GPS location
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.locationModeOption, locationMode === 'manual' && styles.locationModeActive]}
                                onPress={() => setLocationMode('manual')}
                            >
                                <Edit3 size={18} color={locationMode === 'manual' ? Colors.dark.primary : Colors.dark.textSecondary} strokeWidth={1.5} />
                                <View style={styles.locationModeContent}>
                                    <Text style={[styles.locationModeTitle, locationMode === 'manual' && styles.locationModeActiveText]}>
                                        Set manually
                                    </Text>
                                    <Text style={styles.locationModeDescription}>
                                        Enter a city or address
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        {locationMode === 'manual' && (
                            <View style={styles.manualLocationContainer}>
                                <TextInput
                                    style={styles.locationInput}
                                    placeholder="Enter city, address, or landmark"
                                    placeholderTextColor={Colors.dark.textTertiary}
                                    value={manualLocation}
                                    onChangeText={setManualLocation}
                                    autoCapitalize="words"
                                    returnKeyType="done"
                                    onSubmitEditing={handleManualLocationSubmit}
                                />
                                <TouchableOpacity
                                    style={styles.setLocationButton}
                                    onPress={handleManualLocationSubmit}
                                    disabled={!manualLocation.trim() || locationLoading}
                                >
                                    {locationLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.setLocationButtonText}>Set Location</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Easter Egg Modal */}
            <Modal
                visible={showEasterEggModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowEasterEggModal(false)}
            >
                <View style={styles.easterEggModalOverlay}>
                    <Animated.View style={[
                        styles.easterEggModalContent,
                        {
                            shadowOpacity: glowAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.5],
                            }),
                            shadowColor: '#00ff00', // Lightsaber green glow
                            shadowOffset: { width: 0, height: 0 },
                            shadowRadius: 10,
                        }
                    ]}>
                        <Text style={styles.easterEggTitle}>Wisdom of Master Yoda</Text>
                        <Text style={styles.easterEggQuote}>"{yodaQuote}"</Text>
                        <TouchableOpacity
                            style={styles.easterEggCloseButton}
                            onPress={() => setShowEasterEggModal(false)}
                        >
                            <Text style={styles.easterEggCloseButtonText}>Close</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            <View style={styles.floatingButtonsContainer}>
                <SOSButton />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
    },
    heroSection: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        marginRight: 16,
    },
    locationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.dark.success,
    },
    locationText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
        letterSpacing: 0.2,
        flex: 1,
    },
    editLocationButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    locationLoader: {
        marginLeft: 8,
    },
    offlineIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.dark.danger,
        marginLeft: 4,
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.dark.danger,
    },
    greetingSection: {
        marginBottom: 28,
    },
    timeGreeting: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        fontWeight: '400',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    userName: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.dark.textPrimary,
        letterSpacing: -0.8,
        lineHeight: 38,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 16,
        backdropFilter: 'blur(20px)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchText: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
        flex: 1,
        fontWeight: '400',
    },
    statsSection: {
        paddingHorizontal: 24,
        marginBottom: 28,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    primaryStat: {
        flex: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    primaryStatNumber: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.dark.textPrimary,
        marginBottom: 4,
        letterSpacing: -1.2,
        lineHeight: 40,
    },
    primaryStatLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    secondaryStats: {
        flex: 1,
        gap: 16,
    },
    miniStat: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 20,
        padding: 20,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    miniStatNumber: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.dark.textPrimary,
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    miniStatLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    statusSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    statusIndicator: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    warningIndicator: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statusContent: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 2,
    },
    warningTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 2,
    },
    statusDescription: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        fontWeight: '400',
    },
    statusAction: {
        marginLeft: 12,
    },
    section: {
        marginBottom: 36,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.textPrimary,
        letterSpacing: -0.4,
    },
    seeAllButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    seeAllText: {
        fontSize: 13,
        color: Colors.dark.primary,
        fontWeight: '600',
    },
    loadingState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 12,
        fontWeight: '500',
    },
    errorState: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 48,
    },
    carouselContent: {
        paddingHorizontal: 24,
        gap: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 48,
    },
    emptyIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
        maxWidth: 280,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.dark.primary,
        borderRadius: 16,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    actionsContainer: {
        paddingHorizontal: 24,
        gap: 16,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    primaryAction: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionIconSecondary: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    actionTitleSecondary: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '400',
    },
    bottomSpacing: {
        height: 140,
    },
    floatingButtonsContainer: {
        position: 'absolute',
        bottom: 110,
        right: 0,
        zIndex: 1000,
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 16,
        transform: [{ perspective: 1000 }, { rotateX: '10deg' }, { rotateY: '-10deg' }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.dark.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 24,
        paddingBottom: 40,
        paddingHorizontal: 24,
        maxHeight: height * 0.7,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.textPrimary,
        letterSpacing: -0.4,
    },
    modalCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationModeContainer: {
        gap: 16,
        marginBottom: 28,
    },
    locationModeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    locationModeActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    locationModeContent: {
        marginLeft: 16,
        flex: 1,
    },
    locationModeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 4,
    },
    locationModeActiveText: {
        color: Colors.dark.primary,
    },
    locationModeDescription: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        lineHeight: 18,
    },
    manualLocationContainer: {
        gap: 20,
    },
    locationInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 15,
        color: Colors.dark.textPrimary,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    setLocationButton: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    setLocationButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    // Easter Egg Modal Styles
    easterEggModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    easterEggModalContent: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 20,
        padding: 24,
        width: width * 0.8,
        alignItems: 'center',
        elevation: 10,
    },
    easterEggTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.dark.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    easterEggQuote: {
        fontSize: 16,
        color: Colors.dark.textPrimary,
        textAlign: 'center',
        marginBottom: 24,
        fontStyle: 'italic',
    },
    easterEggCloseButton: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    easterEggCloseButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
