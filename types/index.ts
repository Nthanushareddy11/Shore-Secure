// Type definitions for the ShoreSecure app

export interface Beach {
    id: string;
    name: string;
    location: string;
    state: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    description: string;
    images: string[];
    facilities: string[];
    activities: string[];
    safetyTips: string[];
    lifeguardHours: string;
    bestTimeToVisit: string;
    currentSafetyStatus?: SafetyStatus;
    waterQuality?: string;
    accessibility?: string[];
    nearbyCity?: string;
}

export type SafetyStatus = 'safe' | 'moderate' | 'dangerous';

export interface WeatherData {
    temperature: number;
    windSpeed: number;
    windDirection: string;
    waveHeight: number;
    uvIndex: number;
    visibility: string;
    precipitation: number;
    waterTemperature: number;
    timestamp: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    profilePhoto?: string;
    emergencyContacts: EmergencyContact[];
    savedBeaches: string[];
    trips: Trip[];
    preferences: UserPreferences;
}

export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relationship: string;
}

export interface Trip {
    id: string;
    beachId: string;
    startDate: string;
    endDate: string;
    activities: string[];
    notes: string;
}

export interface UserPreferences {
    notificationSettings: {
        safetyAlerts: boolean;
        weatherUpdates: boolean;
        tripReminders: boolean;
    };
    units: 'metric' | 'imperial';
    language: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface LostItem {
    id: string;
    title: string;
    description: string;
    category: LostItemCategory;
    location: {
        beachId: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    date: string;
    contactInfo: string;
    imageUrl?: string;
    tags: string[];
    status: LostItemStatus;
    userId: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
}

export type LostItemCategory =
    | 'electronics'
    | 'jewelry'
    | 'clothing'
    | 'accessories'
    | 'documents'
    | 'toys'
    | 'other';

export type LostItemStatus = 'lost' | 'found' | 'claimed' | 'resolved';

export interface LostItemMessage {
    id: string;
    lostItemId: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
    isRead: boolean;
}

export interface LocalRecommendation {
    id: string;
    beachId: string;
    name: string;
    type: 'food' | 'toilet' | 'firstaid' | 'shop' | 'cafe' | 'rental';
    distance: string;
    contact?: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
}

export interface CommunityPost {
    id: string;
    beachId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    imageUrl?: string;
    timestamp: string;
    likes: number;
    isAlert: boolean;
    alertType?: 'riptide' | 'jellyfish' | 'pollution' | 'crowded' | 'other';
    tags: string[];
    comments: CommunityComment[];
}

export interface CommunityComment {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: string;
}