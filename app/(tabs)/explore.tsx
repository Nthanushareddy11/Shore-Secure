import BeachCard from '@/components/BeachCard';
import BeachDetailModal from '@/components/BeachDetailModal';
import SafetyStatusBadge from '@/components/SafetyStatusBadge';
import { useBeachStore } from '@/store/beachStore';
import { Beach, SafetyStatus } from '@/types';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import {
    Filter,
    List,
    Map as MapIcon,
    MapPin,
    Navigation,
    Search,
    Sliders,
    X
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Keyboard,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

// Enhanced Theme
const Theme = {
    background: '#0A0A0B',
    surface: '#1A1A1C',
    surfaceLight: '#2A2A2C',
    primary: '#00D4FF',
    primaryDark: '#0099CC',
    accent: '#FF6B6B',
    text: '#FFFFFF',
    textSecondary: '#A0A0A3',
    textTertiary: '#6B6B6E',
    border: '#2A2A2C',
    success: '#00C896',
    warning: '#FFB800',
    danger: '#FF4757',
};

export default function ExploreScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [filters, setFilters] = useState<{
        safety: SafetyStatus | null;
        location: string | null;
        activities: string[];
        lifeguard: boolean;
        sortBy: 'distance' | 'name' | 'safety';
    }>({
        safety: null,
        location: null,
        activities: [],
        lifeguard: false,
        sortBy: 'distance',
    });

    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [offlineMode, setOfflineMode] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    const webViewRef = useRef<WebView>(null);
    const searchInputRef = useRef<TextInput>(null);
    const filterPanelAnimation = useRef(new Animated.Value(0)).current;

    const {
        beaches,
        fetchBeaches,
        isLoading,
        selectBeach,
        fetchWeatherData
    } = useBeachStore();

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchBeaches();
        getLocationAsync();
        checkOfflineMapCache();
    }, []);

    const getLocationAsync = async () => {
        try {
            setLocationLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 10000,
            });
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        } catch (error) {
            console.log('Error getting location:', error);
            // Fallback to default location (Goa, India)
            setUserLocation({ latitude: 15.5491, longitude: 73.7632 });
        } finally {
            setLocationLoading(false);
        }
    };

    const checkOfflineMapCache = async () => {
        if (Platform.OS === 'web') return;

        try {
            const cacheDir = `${FileSystem.cacheDirectory}map-tiles/`;
            const cacheInfo = await FileSystem.getInfoAsync(cacheDir);
            setOfflineMode(cacheInfo.exists && cacheInfo.isDirectory);
        } catch (error) {
            console.log('Error checking offline cache:', error);
        }
    };

    // Enhanced filtering with better search
    const filteredBeaches = useCallback(() => {
        let filtered = beaches.filter(beach => {
            // Enhanced search - search in name, location, and activities
            if (debouncedSearchQuery) {
                const query = debouncedSearchQuery.toLowerCase();
                const searchableText = [
                    beach.name,
                    beach.location,
                    ...beach.activities,
                    ...beach.facilities
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(query)) {
                    return false;
                }
            }

            // Safety filter
            if (filters.safety && beach.currentSafetyStatus !== filters.safety) {
                return false;
            }

            // Location filter
            if (filters.location && !beach.location.includes(filters.location)) {
                return false;
            }

            // Activities filter
            if (filters.activities.length > 0 &&
                !filters.activities.some(activity => beach.activities.includes(activity))) {
                return false;
            }

            // Lifeguard filter
            if (filters.lifeguard && !beach.facilities.includes('Lifeguards')) {
                return false;
            }

            return true;
        });

        // Enhanced sorting
        filtered.sort((a, b) => {
            switch (filters.sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'safety':
                    const safetyOrder = { 'safe': 0, 'moderate': 1, 'dangerous': 2 };
                    return safetyOrder[a.currentSafetyStatus] - safetyOrder[b.currentSafetyStatus];
                case 'distance':
                default:
                    if (!userLocation) return 0;
                    const distanceA = calculateDistance(
                        userLocation.latitude, userLocation.longitude,
                        a.coordinates.latitude, a.coordinates.longitude
                    );
                    const distanceB = calculateDistance(
                        userLocation.latitude, userLocation.longitude,
                        b.coordinates.latitude, b.coordinates.longitude
                    );
                    return distanceA - distanceB;
            }
        });

        return filtered;
    }, [beaches, debouncedSearchQuery, filters, userLocation]);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const handleBeachSelect = (beach: Beach) => {
        selectBeach(beach.id);
        setSelectedBeach(beach);
        fetchWeatherData(beach.id);
    };

    const handleCloseBeachDetail = () => {
        setSelectedBeach(null);
    };

    const sendMessageToMap = (message: string) => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                (function() {
                    window.receiveMessageFromRN(${JSON.stringify(message)});
                    return true;
                })();
            `);
        }
    };

    const handleMapMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'BEACH_SELECTED') {
                const beach = beaches.find(b => b.id === data.beachId);
                if (beach) {
                    handleBeachSelect(beach);
                }
            } else if (data.type === 'MAP_READY') {
                setMapReady(true);
                sendMessageToMap(JSON.stringify({
                    type: 'SET_BEACHES',
                    beaches: filteredBeaches()
                }));

                if (userLocation) {
                    sendMessageToMap(JSON.stringify({
                        type: 'SET_USER_LOCATION',
                        location: userLocation
                    }));
                }
            } else if (data.type === 'NAVIGATION_REQUESTED') {
                const { latitude, longitude, beachName } = data;
                handleExternalNavigation(latitude, longitude, beachName);
            }
        } catch (error) {
            console.log('Error parsing message from map:', error);
        }
    };

    useEffect(() => {
        if (mapReady && viewMode === 'map') {
            sendMessageToMap(JSON.stringify({
                type: 'SET_BEACHES',
                beaches: filteredBeaches()
            }));
        }
    }, [filteredBeaches, mapReady, viewMode]);

    useEffect(() => {
        if (mapReady && userLocation && viewMode === 'map') {
            sendMessageToMap(JSON.stringify({
                type: 'SET_USER_LOCATION',
                location: userLocation
            }));
        }
    }, [userLocation, mapReady, viewMode]);

    const handleExternalNavigation = (latitude: number, longitude: number, beachName: string) => {
        let url = '';
        if (Platform.OS === 'ios') {
            url = `maps://app?daddr=${latitude},${longitude}&dirflg=d`;
        } else if (Platform.OS === 'android') {
            url = `google.navigation:q=${latitude},${longitude}`;
        } else {
            url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        }
        console.log(`Opening navigation to ${beachName} at ${latitude},${longitude}`);
    };

    const toggleFiltersPanel = () => {
        const toValue = showFiltersPanel ? 0 : 1;
        setShowFiltersPanel(!showFiltersPanel);
        
        Animated.spring(filterPanelAnimation, {
            toValue,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
        }).start();
    };

    const clearSearch = () => {
        setSearchQuery('');
        setDebouncedSearchQuery('');
        searchInputRef.current?.blur();
    };

    const resetAllFilters = () => {
        setSearchQuery('');
        setDebouncedSearchQuery('');
        setFilters({
            safety: null,
            location: null,
            activities: [],
            lifeguard: false,
            sortBy: 'distance',
        });
        setShowFiltersPanel(false);
        Animated.spring(filterPanelAnimation, {
            toValue: 0,
            useNativeDriver: false,
        }).start();
    };

    const getMapHTML = () => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <title>ShoreSecure Beach Map</title>
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
                <style>
                    body { padding: 0; margin: 0; }
                    html, body, #map { height: 100%; width: 100%; background-color: #0A0A0B; }
                    
                    .leaflet-container { background-color: #0A0A0B; }
                    .leaflet-tile-pane { 
                        filter: brightness(0.7) contrast(1.2) saturate(0.8) hue-rotate(200deg);
                    }
                    
                    .leaflet-control-zoom a {
                        background-color: #1A1A1C;
                        color: #FFFFFF;
                        border-color: #2A2A2C;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    }
                    .leaflet-control-zoom a:hover { background-color: #2A2A2C; }
                    
                    .leaflet-popup-content-wrapper {
                        background-color: #1A1A1C;
                        color: #FFFFFF;
                        border-radius: 12px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                    }
                    .leaflet-popup-tip { background-color: #1A1A1C; }
                    
                    .beach-popup {
                        min-width: 200px;
                        padding: 8px;
                    }
                    .beach-popup-title {
                        font-weight: 700;
                        font-size: 16px;
                        margin-bottom: 8px;
                        color: #FFFFFF;
                    }
                    .beach-popup-location {
                        font-size: 14px;
                        color: #A0A0A3;
                        margin-bottom: 8px;
                    }
                    .beach-popup-status {
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 8px;
                        font-size: 12px;
                        font-weight: 600;
                        margin-bottom: 12px;
                    }
                    .status-safe { background-color: rgba(0, 200, 150, 0.2); color: #00C896; }
                    .status-moderate { background-color: rgba(255, 184, 0, 0.2); color: #FFB800; }
                    .status-dangerous { background-color: rgba(255, 71, 87, 0.2); color: #FF4757; }
                    
                    .beach-popup-buttons {
                        display: flex;
                        gap: 8px;
                        margin-top: 12px;
                    }
                    .beach-popup-button {
                        flex: 1;
                        padding: 8px 12px;
                        border-radius: 8px;
                        border: none;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 600;
                        transition: all 0.2s;
                    }
                    .view-details { background-color: #00D4FF; color: #0A0A0B; }
                    .navigate { background-color: #2A2A2C; color: #FFFFFF; }
                    .beach-popup-button:hover { transform: translateY(-1px); }
                    
                    .user-location-marker {
                        background-color: #00D4FF;
                        border: 3px solid #FFFFFF;
                        border-radius: 50%;
                        width: 16px;
                        height: 16px;
                        box-shadow: 0 2px 8px rgba(0, 212, 255, 0.4);
                    }
                    
                    .custom-cluster-icon {
                        background: linear-gradient(135deg, #00D4FF, #0099CC);
                        border-radius: 50%;
                        color: white;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-weight: 700;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    }
                </style>
            </head>
            <body>
                <div id="map"></div>
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
                <script>
                    const map = L.map('map', {
                        zoomControl: true,
                        attributionControl: false
                    }).setView([15.0, 78.0], 6);
                    
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        subdomains: ['a', 'b', 'c']
                    }).addTo(map);
                    
                    const markers = L.markerClusterGroup({
                        maxClusterRadius: 60,
                        iconCreateFunction: function(cluster) {
                            const count = cluster.getChildCount();
                            return L.divIcon({
                                html: '<div class="custom-cluster-icon" style="width: ' + (30 + count * 2) + 'px; height: ' + (30 + count * 2) + 'px;">' + count + '</div>',
                                className: '',
                                iconSize: L.point(30 + count * 2, 30 + count * 2)
                            });
                        }
                    });
                    
                    const beachMarkers = {};
                    let userLocationMarker = null;
                    let userLocationCircle = null;
                    
                    const createCustomIcon = (status, size = 24) => {
                        const colors = {
                            safe: '#00C896',
                            moderate: '#FFB800',
                            dangerous: '#FF4757'
                        };
                        const color = colors[status] || colors.safe;
                        
                        return L.divIcon({
                            html: \`<div style="
                                background: \${color};
                                border: 3px solid #FFFFFF;
                                border-radius: 50%;
                                width: \${size}px;
                                height: \${size}px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                position: relative;
                            ">
                                <div style="
                                    position: absolute;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -50%);
                                    width: 8px;
                                    height: 8px;
                                    background: white;
                                    border-radius: 50%;
                                "></div>
                            </div>\`,
                            className: '',
                            iconSize: [size, size],
                            iconAnchor: [size/2, size/2]
                        });
                    };
                    
                    function createBeachMarkers(beaches) {
                        markers.clearLayers();
                        
                        beaches.forEach(beach => {
                            const { id, name, location, coordinates, currentSafetyStatus } = beach;
                            const { latitude, longitude } = coordinates;
                            
                            const marker = L.marker([latitude, longitude], {
                                icon: createCustomIcon(currentSafetyStatus || 'safe')
                            });
                            
                            const statusClass = \`status-\${currentSafetyStatus || 'safe'}\`;
                            const statusText = (currentSafetyStatus || 'safe').charAt(0).toUpperCase() + 
                                             (currentSafetyStatus || 'safe').slice(1);
                            
                            marker.bindPopup(\`
                                <div class="beach-popup">
                                    <div class="beach-popup-title">\${name}</div>
                                    <div class="beach-popup-location">\${location}</div>
                                    <div class="beach-popup-status \${statusClass}">\${statusText}</div>
                                    <div class="beach-popup-buttons">
                                        <button class="beach-popup-button view-details" data-id="\${id}">
                                            View Details
                                        </button>
                                        <button class="beach-popup-button navigate" 
                                                data-lat="\${latitude}" 
                                                data-lng="\${longitude}" 
                                                data-name="\${name}">
                                            Navigate
                                        </button>
                                    </div>
                                </div>
                            \`);
                            
                            marker.on('popupopen', function() {
                                setTimeout(() => {
                                    const viewBtn = document.querySelector('.view-details[data-id="' + id + '"]');
                                    const navBtn = document.querySelector('.navigate[data-lat="' + latitude + '"]');
                                    
                                    if (viewBtn) {
                                        viewBtn.addEventListener('click', () => {
                                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                                type: 'BEACH_SELECTED',
                                                beachId: id
                                            }));
                                        });
                                    }
                                    
                                    if (navBtn) {
                                        navBtn.addEventListener('click', () => {
                                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                                type: 'NAVIGATION_REQUESTED',
                                                latitude,
                                                longitude,
                                                beachName: name
                                            }));
                                        });
                                    }
                                }, 100);
                            });
                            
                            markers.addLayer(marker);
                            beachMarkers[id] = marker;
                        });
                        
                        map.addLayer(markers);
                        
                        if (beaches.length > 0) {
                            const group = new L.featureGroup(Object.values(beachMarkers));
                            map.fitBounds(group.getBounds().pad(0.1));
                        }
                    }
                    
                    function setUserLocation(location) {
                        const { latitude, longitude } = location;
                        
                        if (userLocationMarker) map.removeLayer(userLocationMarker);
                        if (userLocationCircle) map.removeLayer(userLocationCircle);
                        
                        userLocationMarker = L.marker([latitude, longitude], {
                            icon: L.divIcon({
                                className: 'user-location-marker',
                                iconSize: [16, 16],
                                iconAnchor: [8, 8]
                            })
                        }).addTo(map);
                        
                        userLocationCircle = L.circle([latitude, longitude], {
                            radius: 2000,
                            fillColor: '#00D4FF',
                            fillOpacity: 0.1,
                            color: '#00D4FF',
                            weight: 2,
                            opacity: 0.3
                        }).addTo(map);
                    }
                    
                    window.receiveMessageFromRN = function(messageString) {
                        try {
                            const message = JSON.parse(messageString);
                            
                            switch(message.type) {
                                case 'SET_BEACHES':
                                    createBeachMarkers(message.beaches);
                                    break;
                                case 'SET_USER_LOCATION':
                                    setUserLocation(message.location);
                                    break;
                                default:
                                    console.log('Unknown message type:', message.type);
                            }
                        } catch (error) {
                            console.error('Error processing message:', error);
                        }
                    };
                    
                    setTimeout(() => {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'MAP_READY'
                        }));
                    }, 1000);
                </script>
            </body>
            </html>
        `;
    };

    const renderMapView = () => {
        if (Platform.OS === 'web') {
            return (
                <View style={styles.mapPlaceholder}>
                    <MapPin size={48} color={Theme.primary} />
                    <Text style={styles.mapPlaceholderText}>Interactive Map</Text>
                    <Text style={styles.mapPlaceholderSubtext}>
                        {filteredBeaches().length} beaches found
                    </Text>
                    <Text style={styles.mapPlaceholderNote}>
                        Map view available on mobile devices
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.mapContainer}>
                <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={{ html: getMapHTML() }}
                    style={styles.map}
                    onMessage={handleMapMessage}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Theme.primary} />
                            <Text style={styles.loadingText}>Loading map...</Text>
                        </View>
                    )}
                />

                {/* Map Controls */}
                <View style={styles.mapControls}>
                    <TouchableOpacity
                        style={styles.mapControlButton}
                        onPress={getLocationAsync}
                        disabled={locationLoading}
                    >
                        {locationLoading ? (
                            <ActivityIndicator size="small" color={Theme.text} />
                        ) : (
                            <Navigation size={20} color={Theme.text} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.mapControlButton}
                        onPress={toggleFiltersPanel}
                    >
                        <Sliders size={20} color={Theme.text} />
                    </TouchableOpacity>
                </View>

                {offlineMode && (
                    <View style={styles.offlineBadge}>
                        <Text style={styles.offlineBadgeText}>Offline Mode</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderListView = () => {
        const filtered = filteredBeaches();
        
        return (
            <ScrollView
                style={styles.listContainer}
                contentContainerStyle={styles.listContentContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Theme.primary} />
                        <Text style={styles.loadingText}>Loading beaches...</Text>
                    </View>
                ) : filtered.length > 0 ? (
                    <>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsCount}>
                                {filtered.length} beach{filtered.length !== 1 ? 'es' : ''} found
                            </Text>
                            <TouchableOpacity
                                style={styles.sortButton}
                                onPress={() => {
                                    const sortOptions = ['distance', 'name', 'safety'];
                                    const currentIndex = sortOptions.indexOf(filters.sortBy);
                                    const nextSort = sortOptions[(currentIndex + 1) % sortOptions.length];
                                    setFilters(prev => ({ ...prev, sortBy: nextSort }));
                                }}
                            >
                                <Text style={styles.sortButtonText}>
                                    Sort: {filters.sortBy.charAt(0).toUpperCase() + filters.sortBy.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        {filtered.map((beach, index) => (
                            <BeachCard
                                key={beach.id}
                                beach={beach}
                                onPress={() => handleBeachSelect(beach)}
                                style={[
                                    styles.beachCardItem,
                                    index === filtered.length - 1 && styles.lastBeachCard
                                ]}
                                showDistance={userLocation}
                                userLocation={userLocation}
                            />
                        ))}
                    </>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Search size={48} color={Theme.textSecondary} />
                        <Text style={styles.emptyTitle}>No beaches found</Text>
                        <Text style={styles.emptyText}>
                            {debouncedSearchQuery 
                                ? `No results for "${debouncedSearchQuery}"`
                                : 'Try adjusting your filters'
                            }
                        </Text>
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={resetAllFilters}
                        >
                            <Text style={styles.resetButtonText}>Reset All Filters</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        );
    };

    const renderFilterChips = () => {
        const activeFiltersCount = [
            filters.safety,
            filters.activities.length > 0,
            filters.lifeguard,
            debouncedSearchQuery
        ].filter(Boolean).length;

        if (activeFiltersCount === 0) return null;

        return (
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChips}
            >
                {debouncedSearchQuery && (
                    <View style={styles.activeFilterChip}>
                        <Text style={styles.filterChipText}>"{debouncedSearchQuery}"</Text>
                        <TouchableOpacity onPress={clearSearch}>
                            <X size={14} color={Theme.text} />
                        </TouchableOpacity>
                    </View>
                )}
                
                {filters.safety && (
                    <View style={styles.activeFilterChip}>
                        <SafetyStatusBadge status={filters.safety} size="small" />
                        <Text style={styles.filterChipText}>{filters.safety}</Text>
                        <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, safety: null }))}>
                            <X size={14} color={Theme.text} />
                        </TouchableOpacity>
                    </View>
                )}
                
                {filters.activities.map(activity => (
                    <View key={activity} style={styles.activeFilterChip}>
                        <Text style={styles.filterChipText}>{activity}</Text>
                        <TouchableOpacity onPress={() => setFilters(prev => ({
                            ...prev,
                            activities: prev.activities.filter(a => a !== activity)
                        }))}>
                            <X size={14} color={Theme.text} />
                        </TouchableOpacity>
                    </View>
                ))}
                
                {filters.lifeguard && (
                    <View style={styles.activeFilterChip}>
                        <Text style={styles.filterChipText}>Lifeguard</Text>
                        <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, lifeguard: false }))}>
                            <X size={14} color={Theme.text} />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        );
    };

    const renderFiltersPanel = () => {
        const panelHeight = filterPanelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 300],
        });

        return (
            <Animated.View style={[styles.filtersPanel, { height: panelHeight }]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.filtersPanelTitle}>Filters & Sort</Text>

                    <Text style={styles.filtersPanelSubtitle}>Safety Status</Text>
                    <View style={styles.filtersPanelRow}>
                        {['safe', 'moderate', 'dangerous'].map(status => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.filtersPanelChip,
                                    filters.safety === status && styles.activeFiltersPanelChip
                                ]}
                                onPress={() => setFilters(prev => ({
                                    ...prev,
                                    safety: prev.safety === status ? null : status as SafetyStatus
                                }))}
                            >
                                <SafetyStatusBadge status={status as SafetyStatus} size="small" />
                                <Text style={styles.filtersPanelChipText}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.filtersPanelSubtitle}>Activities</Text>
                    <View style={styles.filtersPanelRow}>
                        {['Swimming', 'Surfing', 'Snorkeling', 'Sunbathing', 'Fishing'].map(activity => (
                            <TouchableOpacity
                                key={activity}
                                style={[
                                    styles.filtersPanelChip,
                                    filters.activities.includes(activity) && styles.activeFiltersPanelChip
                                ]}
                                onPress={() => setFilters(prev => ({
                                    ...prev,
                                    activities: prev.activities.includes(activity)
                                        ? prev.activities.filter(a => a !== activity)
                                        : [...prev.activities, activity]
                                }))}
                            >
                                <Text style={styles.filtersPanelChipText}>{activity}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.filtersPanelSubtitle}>Sort By</Text>
                    <View style={styles.filtersPanelRow}>
                        {[
                            { key: 'distance', label: 'Distance' },
                            { key: 'name', label: 'Name' },
                            { key: 'safety', label: 'Safety' }
                        ].map(sort => (
                            <TouchableOpacity
                                key={sort.key}
                                style={[
                                    styles.filtersPanelChip,
                                    filters.sortBy === sort.key && styles.activeFiltersPanelChip
                                ]}
                                onPress={() => setFilters(prev => ({ ...prev, sortBy: sort.key as any }))}
                            >
                                <Text style={styles.filtersPanelChipText}>{sort.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.resetFiltersButton}
                        onPress={resetAllFilters}
                    >
                        <Text style={styles.resetFiltersButtonText}>Reset All Filters</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Theme.background} />
            
            {/* Enhanced Header */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Search size={20} color={Theme.textSecondary} />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="Search beaches, activities..."
                        placeholderTextColor={Theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        returnKeyType="search"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <X size={20} color={Theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        showFiltersPanel && styles.activeFilterButton
                    ]}
                    onPress={toggleFiltersPanel}
                >
                    <Filter size={20} color={showFiltersPanel ? Theme.primary : Theme.textSecondary} />
                </TouchableOpacity>

                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[
                            styles.viewToggleButton,
                            viewMode === 'list' && styles.activeViewToggleButton
                        ]}
                        onPress={() => setViewMode('list')}
                    >
                        <List size={20} color={viewMode === 'list' ? Theme.primary : Theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.viewToggleButton,
                            viewMode === 'map' && styles.activeViewToggleButton
                        ]}
                        onPress={() => setViewMode('map')}
                    >
                        <MapIcon size={20} color={viewMode === 'map' ? Theme.primary : Theme.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {renderFilterChips()}
            {renderFiltersPanel()}

            {viewMode === 'list' ? renderListView() : renderMapView()}

            {selectedBeach && (
                <BeachDetailModal
                    beach={selectedBeach}
                    visible={!!selectedBeach}
                    onClose={handleCloseBeachDetail}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: Theme.background,
        borderBottomWidth: 1,
        borderBottomColor: Theme.border,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        color: Theme.text,
        fontSize: 16,
        height: '100%',
    },
    filterButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        backgroundColor: Theme.surface,
        borderRadius: 12,
    },
    activeFilterButton: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderWidth: 1,
        borderColor: Theme.primary,
    },
    viewToggle: {
        flexDirection: 'row',
        marginLeft: 12,
        backgroundColor: Theme.surface,
        borderRadius: 12,
        overflow: 'hidden',
    },
    viewToggleButton: {
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
    },
    activeViewToggleButton: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
    },
    
    // Filter Chips
    filterChips: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    activeFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.primary,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    filterChipText: {
        color: Theme.background,
        fontSize: 12,
        fontWeight: '600',
    },
    
    // Results
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    resultsCount: {
        color: Theme.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    sortButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: Theme.surface,
        borderRadius: 8,
    },
    sortButtonText: {
        color: Theme.text,
        fontSize: 12,
        fontWeight: '600',
    },
    
    // List View
    listContainer: {
        flex: 1,
    },
    listContentContainer: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 100,
    },
    beachCardItem: {
        marginBottom: 16,
    },
    lastBeachCard: {
        marginBottom: 32,
    },
    
    // Map View
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        margin: 20,
        borderRadius: 16,
    },
    mapPlaceholderText: {
        color: Theme.text,
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
    },
    mapPlaceholderSubtext: {
        color: Theme.textSecondary,
        marginTop: 8,
        fontSize: 14,
    },
    mapPlaceholderNote: {
        color: Theme.textTertiary,
        marginTop: 4,
        fontSize: 12,
    },
    mapControls: {
        position: 'absolute',
        top: 20,
        right: 20,
        gap: 12,
    },
    mapControlButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(26, 26, 28, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    offlineBadge: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(255, 71, 87, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    offlineBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    
    // Loading & Empty States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        color: Theme.textSecondary,
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    resetButton: {
        backgroundColor: Theme.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    resetButtonText: {
        color: Theme.background,
        fontWeight: '700',
        fontSize: 14,
    },
    
    // Filters Panel
    filtersPanel: {
        backgroundColor: Theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: Theme.border,
        overflow: 'hidden',
    },
    filtersPanelTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 20,
        marginTop: 20,
        marginHorizontal: 20,
    },
    filtersPanelSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.text,
        marginBottom: 12,
        marginTop: 16,
        marginHorizontal: 20,
    },
    filtersPanelRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 8,
    },
    filtersPanelChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surfaceLight,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 6,
    },
    activeFiltersPanelChip: {
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        borderColor: Theme.primary,
        borderWidth: 1,
    },
    filtersPanelChipText: {
        color: Theme.text,
        fontSize: 14,
        fontWeight: '500',
    },
    resetFiltersButton: {
        backgroundColor: 'rgba(255, 71, 87, 0.1)',
        marginHorizontal: 20,
        marginVertical: 20,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    resetFiltersButtonText: {
        color: Theme.danger,
        fontWeight: '700',
        fontSize: 14,
    },
});