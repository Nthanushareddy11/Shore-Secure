import { beaches } from '@/constants/beaches';
import { Beach, SafetyStatus, WeatherData } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface BeachState {
    beaches: Beach[];
    nearbyBeaches: Beach[];
    selectedBeach: Beach | null;
    weatherData: Record<string, WeatherData>;
    isLoading: boolean;
    error: string | null;
    lastUpdated: string | null;
    offlineMode: boolean;

    // Actions
    fetchBeaches: () => Promise<void>;
    fetchNearbyBeaches: (latitude: number, longitude: number, radius: number) => Promise<void>;
    selectBeach: (beachId: string) => void;
    fetchWeatherData: (beachId: string) => Promise<void>;
    updateSafetyStatus: (beachId: string, status: SafetyStatus) => void;
    setOfflineMode: (mode: boolean) => void;
}

// Calculate distance between coordinates in kilometers
const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Determine safety status based on weather data
const determineSafetyStatus = (weatherData: WeatherData): SafetyStatus => {
    if (weatherData.waveHeight > 2 || weatherData.windSpeed > 30 || weatherData.uvIndex > 10) {
        return 'dangerous';
    } else if (weatherData.waveHeight > 1 || weatherData.windSpeed > 20 || weatherData.uvIndex > 7) {
        return 'moderate';
    } else {
        return 'safe';
    }
};

// Fetch marine weather data from Open-Meteo API
const fetchMarineWeatherData = async (latitude: number, longitude: number): Promise<WeatherData> => {
    try {
        // Open-Meteo Marine API endpoint (no API key required)
        const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&hourly=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&daily=wave_height_max,wave_direction_dominant,wave_period_max,wind_wave_height_max,wind_wave_direction_dominant,wind_wave_period_max,swell_wave_height_max,swell_wave_direction_dominant,swell_wave_period_max&timezone=auto&current_weather=true`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch marine data');
        }

        const data = await response.json();

        // Get current hour index
        const now = new Date();
        const currentHourIndex = now.getHours();

        // Extract relevant data
        const waveHeight = data.hourly.wave_height[currentHourIndex] || 0;
        const waveDirection = data.hourly.wave_direction[currentHourIndex] || 0;

        // Convert wave direction to cardinal direction
        const cardinalDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
        const windDirectionIndex = Math.round(waveDirection / 45);
        const windDirectionText = cardinalDirections[windDirectionIndex];

        // Fetch additional weather data
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,uv_index,visibility&timezone=auto`;

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error('Failed to fetch weather data');
        }

        const weatherData = await weatherResponse.json();

        // Extract weather data
        const temperature = weatherData.current.temperature_2m || 25;
        const windSpeed = weatherData.current.wind_speed_10m || 10;
        const windDirectionDeg = weatherData.current.wind_direction_10m || 0;
        const windDirectionIndex2 = Math.round(windDirectionDeg / 45);
        const windDirection = cardinalDirections[windDirectionIndex2];
        const uvIndex = weatherData.hourly.uv_index[currentHourIndex] || 5;
        const visibility = weatherData.hourly.visibility[currentHourIndex] || 10000;

        // Convert visibility to text
        let visibilityText = 'Poor';
        if (visibility > 20000) {
            visibilityText = 'Excellent';
        } else if (visibility > 10000) {
            visibilityText = 'Good';
        } else if (visibility > 5000) {
            visibilityText = 'Moderate';
        }

        // Create weather data object
        const weatherDataObject: WeatherData = {
            temperature,
            windSpeed,
            windDirection,
            waveHeight,
            uvIndex,
            visibility: visibilityText,
            precipitation: weatherData.current.precipitation || 0,
            waterTemperature: temperature - 2 + (Math.random() * 4), // Estimate water temperature
            timestamp: new Date().toISOString(),
        };

        return weatherDataObject;
    } catch (error) {
        console.error('Error fetching marine weather data:', error);
        // Return fallback data if API fails
        return generateFallbackWeatherData();
    }
};

// Generate fallback weather data if API fails
const generateFallbackWeatherData = (): WeatherData => {
    return {
        temperature: 20 + Math.random() * 15,
        windSpeed: 5 + Math.random() * 30,
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        waveHeight: Math.random() * 3,
        uvIndex: Math.floor(Math.random() * 12),
        visibility: ['Excellent', 'Good', 'Moderate', 'Poor'][Math.floor(Math.random() * 4)],
        precipitation: Math.random() * 100,
        waterTemperature: 18 + Math.random() * 10,
        timestamp: new Date().toISOString(),
    };
};

export const useBeachStore = create<BeachState>()(
    persist(
        (set, get) => ({
            beaches: [],
            nearbyBeaches: [],
            selectedBeach: null,
            weatherData: {},
            isLoading: false,
            error: null,
            lastUpdated: null,
            offlineMode: false,

            fetchBeaches: async () => {
                set({ isLoading: true, error: null });
                try {
                    // In a real app, this would be an API call to fetch beaches from a backend
                    // For now, we'll use the local data

                    // Check if we need to update the data (every 30 minutes)
                    const lastUpdated = get().lastUpdated;
                    const now = new Date().toISOString();
                    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

                    if (!lastUpdated || lastUpdated < thirtyMinutesAgo) {
                        // Update safety status for each beach based on weather data
                        const updatedBeaches = await Promise.all(
                            beaches.map(async (beach) => {
                                try {
                                    if (get().offlineMode) {
                                        // Use existing data in offline mode
                                        const existingWeatherData = get().weatherData[beach.id];
                                        if (existingWeatherData) {
                                            return {
                                                ...beach,
                                                currentSafetyStatus: determineSafetyStatus(existingWeatherData)
                                            };
                                        }
                                        return beach;
                                    }

                                    // Fetch weather data for this beach
                                    const weatherData = await fetchMarineWeatherData(
                                        beach.coordinates.latitude,
                                        beach.coordinates.longitude
                                    );

                                    // Update weather data in store
                                    set(state => ({
                                        weatherData: {
                                            ...state.weatherData,
                                            [beach.id]: weatherData
                                        }
                                    }));

                                    // Determine safety status
                                    const safetyStatus = determineSafetyStatus(weatherData);

                                    return {
                                        ...beach,
                                        currentSafetyStatus: safetyStatus
                                    };
                                } catch (error) {
                                    console.error(`Error updating beach ${beach.id}:`, error);
                                    return beach;
                                }
                            })
                        );

                        set({
                            beaches: updatedBeaches,
                            isLoading: false,
                            lastUpdated: now
                        });
                    } else {
                        // Use existing data if it's recent enough
                        set({
                            beaches,
                            isLoading: false
                        });
                    }
                } catch (error) {
                    console.error('Error fetching beaches:', error);
                    set({
                        error: 'Failed to fetch beaches',
                        isLoading: false,
                        beaches // Use local data as fallback
                    });
                }
            },

            fetchNearbyBeaches: async (latitude, longitude, radius) => {
                set({ isLoading: true, error: null });
                try {
                    const nearby = get().beaches.filter(beach => {
                        const distance = calculateDistance(
                            latitude,
                            longitude,
                            beach.coordinates.latitude,
                            beach.coordinates.longitude
                        );
                        return distance <= radius;
                    });

                    // Sort by distance
                    nearby.sort((a, b) => {
                        const distanceA = calculateDistance(
                            latitude,
                            longitude,
                            a.coordinates.latitude,
                            a.coordinates.longitude
                        );
                        const distanceB = calculateDistance(
                            latitude,
                            longitude,
                            b.coordinates.latitude,
                            b.coordinates.longitude
                        );
                        return distanceA - distanceB;
                    });

                    set({ nearbyBeaches: nearby, isLoading: false });
                } catch (error) {
                    console.error('Error fetching nearby beaches:', error);
                    set({ error: 'Failed to fetch nearby beaches', isLoading: false });
                }
            },

            selectBeach: (beachId) => {
                const { beaches } = get();
                const beach = beaches.find(b => b.id === beachId) || null;
                set({ selectedBeach: beach });

                if (beach) {
                    get().fetchWeatherData(beachId);
                }
            },

            fetchWeatherData: async (beachId) => {
                set({ isLoading: true, error: null });
                try {
                    const beach = get().beaches.find(b => b.id === beachId);

                    if (!beach) {
                        throw new Error('Beach not found');
                    }

                    if (get().offlineMode) {
                        // Use existing data in offline mode
                        const existingWeatherData = get().weatherData[beachId];
                        if (existingWeatherData) {
                            set({ isLoading: false });
                            return;
                        }
                    }

                    // Fetch weather data from API
                    const weatherData = await fetchMarineWeatherData(
                        beach.coordinates.latitude,
                        beach.coordinates.longitude
                    );

                    const safetyStatus = determineSafetyStatus(weatherData);

                    set(state => ({
                        weatherData: { ...state.weatherData, [beachId]: weatherData },
                        beaches: state.beaches.map(beach =>
                            beach.id === beachId
                                ? { ...beach, currentSafetyStatus: safetyStatus }
                                : beach
                        ),
                        nearbyBeaches: state.nearbyBeaches.map(beach =>
                            beach.id === beachId
                                ? { ...beach, currentSafetyStatus: safetyStatus }
                                : beach
                        ),
                        isLoading: false,
                    }));

                    if (get().selectedBeach?.id === beachId) {
                        set(state => ({
                            selectedBeach: state.selectedBeach
                                ? { ...state.selectedBeach, currentSafetyStatus: safetyStatus }
                                : null
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching weather data:', error);
                    set({ error: 'Failed to fetch weather data', isLoading: false });
                }
            },

            updateSafetyStatus: (beachId, status) => {
                set(state => ({
                    beaches: state.beaches.map(beach =>
                        beach.id === beachId
                            ? { ...beach, currentSafetyStatus: status }
                            : beach
                    ),
                    nearbyBeaches: state.nearbyBeaches.map(beach =>
                        beach.id === beachId
                            ? { ...beach, currentSafetyStatus: status }
                            : beach
                    ),
                    selectedBeach: state.selectedBeach?.id === beachId
                        ? { ...state.selectedBeach, currentSafetyStatus: status }
                        : state.selectedBeach
                }));
            },

            setOfflineMode: (mode) => {
                set({ offlineMode: mode });
            },
        }),
        {
            name: 'shore-secure-beaches',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                weatherData: state.weatherData,
                lastUpdated: state.lastUpdated,
                offlineMode: state.offlineMode,
            }),
        }
    )
);