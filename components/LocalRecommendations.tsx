import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { Coffee, FirstAid, Navigation, Phone, ShoppingBag, Toilet, Umbrella, Utensils } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Types for local recommendations
interface LocalRecommendation {
    id: string;
    name: string;
    type: 'food' | 'toilet' | 'firstaid' | 'shop' | 'cafe' | 'rental';
    distance: string;
    contact?: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
}

// Mock data for local recommendations
const getMockRecommendations = (beachId: string): LocalRecommendation[] => {
    // In a real app, this would fetch from an API based on the beach ID
    return [
        {
            id: '1',
            name: 'Beach Shack Restaurant',
            type: 'food',
            distance: '50m',
            contact: '+91 9876543210',
            coordinates: {
                latitude: 15.1234,
                longitude: 73.9876,
            },
        },
        {
            id: '2',
            name: 'Public Restrooms',
            type: 'toilet',
            distance: '100m',
            coordinates: {
                latitude: 15.1235,
                longitude: 73.9877,
            },
        },
        {
            id: '3',
            name: 'Lifeguard First Aid Station',
            type: 'firstaid',
            distance: '150m',
            contact: '+91 9876543211',
            coordinates: {
                latitude: 15.1236,
                longitude: 73.9878,
            },
        },
        {
            id: '4',
            name: 'Beach Essentials Shop',
            type: 'shop',
            distance: '200m',
            contact: '+91 9876543212',
            coordinates: {
                latitude: 15.1237,
                longitude: 73.9879,
            },
        },
        {
            id: '5',
            name: 'Seaside Cafe',
            type: 'cafe',
            distance: '250m',
            contact: '+91 9876543213',
            coordinates: {
                latitude: 15.1238,
                longitude: 73.9880,
            },
        },
        {
            id: '6',
            name: 'Water Sports Equipment Rental',
            type: 'rental',
            distance: '300m',
            contact: '+91 9876543214',
            coordinates: {
                latitude: 15.1239,
                longitude: 73.9881,
            },
        },
    ];
};

// Icon mapping for recommendation types
const getIconForType = (type: string) => {
    switch (type) {
        case 'food':
            return <Utensils size={20} color={Colors.dark.primary} />;
        case 'toilet':
            return <Toilet size={20} color={Colors.dark.primary} />;
        case 'firstaid':
            return <FirstAid size={20} color={Colors.dark.primary} />;
        case 'shop':
            return <ShoppingBag size={20} color={Colors.dark.primary} />;
        case 'cafe':
            return <Coffee size={20} color={Colors.dark.primary} />;
        case 'rental':
            return <Umbrella size={20} color={Colors.dark.primary} />;
        default:
            return <Utensils size={20} color={Colors.dark.primary} />;
    }
};

// Get human-readable type name
const getTypeName = (type: string) => {
    switch (type) {
        case 'food':
            return 'Restaurant';
        case 'toilet':
            return 'Restroom';
        case 'firstaid':
            return 'First Aid';
        case 'shop':
            return 'Shop';
        case 'cafe':
            return 'Cafe';
        case 'rental':
            return 'Rental';
        default:
            return type;
    }
};

interface LocalRecommendationsProps {
    beachId: string;
}

const LocalRecommendations: React.FC<LocalRecommendationsProps> = ({ beachId }) => {
    const [recommendations, setRecommendations] = useState<LocalRecommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        const fetchRecommendations = async () => {
            try {
                // In a real app, this would be an API call
                const data = getMockRecommendations(beachId);
                setRecommendations(data);
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [beachId]);

    const handleCall = (phoneNumber: string) => {
        if (Platform.OS === 'web') {
            alert(`Would call: ${phoneNumber}`);
            return;
        }

        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }

        Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleGetDirections = (item: LocalRecommendation) => {
        if (Platform.OS === 'web') {
            alert(`Would navigate to: ${item.name}`);
            return;
        }

        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }

        const { latitude, longitude } = item.coordinates;
        let url = '';

        if (Platform.OS === 'ios') {
            url = `maps://app?daddr=${latitude},${longitude}&dirflg=d`;
        } else if (Platform.OS === 'android') {
            url = `google.navigation:q=${latitude},${longitude}`;
        } else {
            url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
        }

        Linking.openURL(url);
    };

    const renderRecommendationItem = ({ item }: { item: LocalRecommendation }) => (
        <View style={styles.recommendationItem}>
            <View style={styles.recommendationIconContainer}>
                {getIconForType(item.type)}
            </View>
            <View style={styles.recommendationContent}>
                <Text style={styles.recommendationName}>{item.name}</Text>
                <View style={styles.recommendationDetails}>
                    <Text style={styles.recommendationType}>{getTypeName(item.type)}</Text>
                    <Text style={styles.recommendationDistance}>{item.distance}</Text>
                </View>
            </View>
            <View style={styles.recommendationActions}>
                {item.contact && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleCall(item.contact!)}
                    >
                        <Phone size={18} color={Colors.dark.textPrimary} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleGetDirections(item)}
                >
                    <Navigation size={18} color={Colors.dark.textPrimary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Local Recommendations</Text>
                <Text style={styles.loadingText}>Loading recommendations...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Local Recommendations</Text>
            <FlatList
                data={recommendations}
                renderItem={renderRecommendationItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendationsList}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 12,
    },
    loadingText: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
    },
    recommendationsList: {
        paddingRight: 16,
    },
    recommendationItem: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        width: 200,
        flexDirection: 'row',
        alignItems: 'center',
    },
    recommendationIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 128, 128, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    recommendationContent: {
        flex: 1,
    },
    recommendationName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 4,
    },
    recommendationDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recommendationType: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginRight: 8,
    },
    recommendationDistance: {
        fontSize: 12,
        color: Colors.dark.primary,
        fontWeight: '500',
    },
    recommendationActions: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: 60,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default LocalRecommendations;