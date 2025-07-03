import { EmergencyContact, Trip, User, UserPreferences } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UserState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Auth actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (name: string, email: string, password: string) => Promise<void>;

    // User data actions
    updateProfile: (data: Partial<User>) => void;
    addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
    removeEmergencyContact: (contactId: string) => void;
    updateEmergencyContact: (contactId: string, updates: Partial<EmergencyContact>) => void;
    saveBeach: (beachId: string) => void;
    unsaveBeach: (beachId: string) => void;
    addTrip: (trip: Omit<Trip, 'id'>) => void;
    removeTrip: (tripId: string) => void;
    updateTrip: (tripId: string, updates: Partial<Trip>) => void; // Fixed: Added missing updateTrip
    updatePreferences: (preferences: Partial<UserPreferences>) => void;
    
    // Additional utility functions
    getTripsByBeach: (beachId: string) => Trip[];
    getUpcomingTrips: () => Trip[];
    getPastTrips: () => Trip[];
    isBeachSaved: (beachId: string) => boolean;
}

// Enhanced mock user data
const mockUser: User = {
    id: '1',
    name: 'Beach Explorer',
    email: 'demo@shoresecure.com',
    profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000',
    emergencyContacts: [
        { 
            id: '1', 
            name: 'John Doe', 
            phone: '+91 9876543210', 
            relationship: 'Family' 
        },
        { 
            id: '2', 
            name: 'Jane Smith', 
            phone: '+91 9876543211', 
            relationship: 'Friend' 
        }
    ],
    savedBeaches: ['1', '2', '4'],
    trips: [
        {
            id: '1',
            beachId: '2',
            startDate: '2025-07-15',
            endDate: '2025-07-20',
            activities: ['Swimming', 'Sunbathing', 'Photography'],
            notes: 'Family vacation - remember sunscreen!'
        },
        {
            id: '2',
            beachId: '1',
            startDate: '2025-08-10',
            endDate: '2025-08-12',
            activities: ['Surfing', 'Beach Volleyball'],
            notes: 'Weekend getaway with friends'
        }
    ],
    preferences: {
        notificationSettings: {
            safetyAlerts: true,
            weatherUpdates: true,
            tripReminders: true,
        },
        units: 'metric',
        language: 'en',
    }
};

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    if (email === 'demo@shoresecure.com' && password === 'password') {
                        set({ user: mockUser, isAuthenticated: true, isLoading: false });
                    } else {
                        throw new Error('Invalid credentials. Use demo@shoresecure.com / password');
                    }
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Login failed',
                        isLoading: false
                    });
                }
            },

            logout: () => {
                set({ user: null, isAuthenticated: false, error: null });
            },

            register: async (name, email, password) => {
                set({ isLoading: true, error: null });
                try {
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    const newUser: User = {
                        id: Date.now().toString(),
                        name,
                        email,
                        emergencyContacts: [],
                        savedBeaches: [],
                        trips: [],
                        preferences: {
                            notificationSettings: {
                                safetyAlerts: true,
                                weatherUpdates: true,
                                tripReminders: true,
                            },
                            units: 'metric',
                            language: 'en',
                        }
                    };

                    set({ user: newUser, isAuthenticated: true, isLoading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Registration failed',
                        isLoading: false
                    });
                }
            },

            updateProfile: (data) => {
                set(state => ({
                    user: state.user ? { ...state.user, ...data } : null
                }));
            },

            addEmergencyContact: (contact) => {
                set(state => {
                    if (!state.user) return state;

                    const newContact: EmergencyContact = {
                        ...contact,
                        id: Date.now().toString()
                    };

                    return {
                        user: {
                            ...state.user,
                            emergencyContacts: [...state.user.emergencyContacts, newContact]
                        }
                    };
                });
            },

            removeEmergencyContact: (contactId) => {
                set(state => {
                    if (!state.user) return state;

                    return {
                        user: {
                            ...state.user,
                            emergencyContacts: state.user.emergencyContacts.filter(
                                contact => contact.id !== contactId
                            )
                        }
                    };
                });
            },

            updateEmergencyContact: (contactId, updates) => {
                set(state => {
                    if (!state.user) return state;

                    return {
                        user: {
                            ...state.user,
                            emergencyContacts: state.user.emergencyContacts.map(contact =>
                                contact.id === contactId ? { ...contact, ...updates } : contact
                            )
                        }
                    };
                });
            },

            saveBeach: (beachId) => {
                set(state => {
                    if (!state.user || state.user.savedBeaches.includes(beachId)) return state;

                    return {
                        user: {
                            ...state.user,
                            savedBeaches: [...state.user.savedBeaches, beachId]
                        }
                    };
                });
            },

            unsaveBeach: (beachId) => {
                set(state => {
                    if (!state.user) return state;

                    return {
                        user: {
                            ...state.user,
                            savedBeaches: state.user.savedBeaches.filter(id => id !== beachId)
                        }
                    };
                });
            },

            addTrip: (trip) => {
                set(state => {
                    if (!state.user) return state;

                    const newTrip: Trip = {
                        ...trip,
                        id: Date.now().toString()
                    };

                    return {
                        user: {
                            ...state.user,
                            trips: [...state.user.trips, newTrip]
                        }
                    };
                });
            },

            removeTrip: (tripId) => {
                set(state => {
                    if (!state.user) return state;

                    return {
                        user: {
                            ...state.user,
                            trips: state.user.trips.filter(trip => trip.id !== tripId)
                        }
                    };
                });
            },

            // Fixed: Implemented missing updateTrip function
            updateTrip: (tripId, updates) => {
                set(state => {
                    if (!state.user) return state;

                    return {
                        user: {
                            ...state.user,
                            trips: state.user.trips.map(trip =>
                                trip.id === tripId ? { ...trip, ...updates } : trip
                            )
                        }
                    };
                });
            },

            updatePreferences: (preferences) => {
                set(state => {
                    if (!state.user) return state;

                    return {
                        user: {
                            ...state.user,
                            preferences: {
                                ...state.user.preferences,
                                ...preferences
                            }
                        }
                    };
                });
            },

            // Utility functions
            getTripsByBeach: (beachId) => {
                const { user } = get();
                return user ? user.trips.filter(trip => trip.beachId === beachId) : [];
            },

            getUpcomingTrips: () => {
                const { user } = get();
                if (!user) return [];
                
                const now = new Date();
                return user.trips.filter(trip => new Date(trip.startDate) > now)
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            },

            getPastTrips: () => {
                const { user } = get();
                if (!user) return [];
                
                const now = new Date();
                return user.trips.filter(trip => new Date(trip.endDate) < now)
                    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
            },

            isBeachSaved: (beachId) => {
                const { user } = get();
                return user ? user.savedBeaches.includes(beachId) : false;
            }
        }),
        {
            name: 'shore-secure-user',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);