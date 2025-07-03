import { LostItem, LostItemCategory, LostItemMessage, LostItemStatus } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useUserStore } from './userStore';

interface LostItemState {
    lostItems: LostItem[];
    userLostItems: LostItem[];
    filteredItems: LostItem[];
    selectedItem: LostItem | null;
    messages: Record<string, LostItemMessage[]>;
    isLoading: boolean;
    error: string | null;
    searchQuery: string;
    categoryFilter: LostItemCategory | null;
    statusFilter: LostItemStatus | null;
    dateFilter: { startDate: string | null; endDate: string | null };

    // Actions
    fetchLostItems: () => void;
    fetchUserLostItems: () => void;
    createLostItem: (item: Omit<LostItem, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'expiresAt'>) => void;
    updateLostItem: (id: string, updates: Partial<LostItem>) => void;
    deleteLostItem: (id: string) => void;
    selectItem: (id: string | null) => void;
    searchItems: (query: string) => void;
    filterByCategory: (category: LostItemCategory | null) => void;
    filterByStatus: (status: LostItemStatus | null) => void;
    filterByDate: (startDate: string | null, endDate: string | null) => void;
    resetFilters: () => void;
    sendMessage: (lostItemId: string, receiverId: string, content: string) => void;
    markMessageAsRead: (messageId: string) => void;
    getMatchingItems: (item: LostItem) => LostItem[];
}

// Mock data for lost items
const mockLostItems: LostItem[] = [
    {
        id: '1',
        title: 'Gold Ring with Ruby Stone',
        description: 'Lost my gold ring with a ruby stone at the beach. It has sentimental value.',
        category: 'jewelry',
        location: {
            beachId: '1',
            coordinates: {
                latitude: 15.5491,
                longitude: 73.7632,
            },
        },
        date: '2025-06-10',
        contactInfo: 'john.doe@example.com',
        imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000',
        tags: ['gold', 'ring', 'ruby', 'jewelry'],
        status: 'lost',
        userId: '1',
        createdAt: '2025-06-10T10:30:00Z',
        updatedAt: '2025-06-10T10:30:00Z',
        expiresAt: '2025-07-10T10:30:00Z',
    },
    {
        id: '2',
        title: 'Blue Waterproof Camera',
        description: 'Found a blue waterproof camera near the lifeguard tower. Has photos of a family vacation.',
        category: 'electronics',
        location: {
            beachId: '2',
            coordinates: {
                latitude: 8.3988,
                longitude: 76.9781,
            },
        },
        date: '2025-06-12',
        contactInfo: 'finder@example.com',
        imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=1000',
        tags: ['camera', 'blue', 'waterproof', 'electronics'],
        status: 'found',
        userId: '2',
        createdAt: '2025-06-12T15:45:00Z',
        updatedAt: '2025-06-12T15:45:00Z',
        expiresAt: '2025-07-12T15:45:00Z',
    },
    {
        id: '3',
        title: 'Child\'s Teddy Bear',
        description: 'Lost a brown teddy bear with a red bow tie. My daughter is heartbroken.',
        category: 'toys',
        location: {
            beachId: '3',
            coordinates: {
                latitude: 13.0500,
                longitude: 80.2824,
            },
        },
        date: '2025-06-14',
        contactInfo: 'parent@example.com',
        imageUrl: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=1000',
        tags: ['teddy bear', 'toy', 'brown', 'child'],
        status: 'lost',
        userId: '3',
        createdAt: '2025-06-14T09:20:00Z',
        updatedAt: '2025-06-14T09:20:00Z',
        expiresAt: '2025-07-14T09:20:00Z',
    },
    {
        id: '4',
        title: 'Prescription Sunglasses',
        description: 'Found black prescription sunglasses in a blue case near the beach entrance.',
        category: 'accessories',
        location: {
            beachId: '4',
            coordinates: {
                latitude: 11.9810,
                longitude: 92.9520,
            },
        },
        date: '2025-06-15',
        contactInfo: 'finder2@example.com',
        imageUrl: 'https://images.unsplash.com/photo-1577803645773-f96470509666?q=80&w=1000',
        tags: ['sunglasses', 'prescription', 'black', 'case'],
        status: 'found',
        userId: '4',
        createdAt: '2025-06-15T16:10:00Z',
        updatedAt: '2025-06-15T16:10:00Z',
        expiresAt: '2025-07-15T16:10:00Z',
    },
    {
        id: '5',
        title: 'Car Keys with Dolphin Keychain',
        description: 'Lost my car keys with a distinctive dolphin keychain. Toyota keys.',
        category: 'accessories',
        location: {
            beachId: '5',
            coordinates: {
                latitude: 19.8076,
                longitude: 85.8317,
            },
        },
        date: '2025-06-16',
        contactInfo: 'driver@example.com',
        imageUrl: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=1000',
        tags: ['keys', 'car', 'keychain', 'dolphin'],
        status: 'resolved',
        userId: '5',
        createdAt: '2025-06-16T11:30:00Z',
        updatedAt: '2025-06-18T14:20:00Z',
        expiresAt: '2025-07-16T11:30:00Z',
    }
];

// Mock messages
const mockMessages: Record<string, LostItemMessage[]> = {
    '1': [
        {
            id: 'm1',
            lostItemId: '1',
            senderId: '2',
            receiverId: '1',
            content: 'Hi, I think I found your ring! It matches your description.',
            timestamp: '2025-06-11T09:30:00Z',
            isRead: true,
        },
        {
            id: 'm2',
            lostItemId: '1',
            senderId: '1',
            receiverId: '2',
            content: 'That\'s great news! Can you describe it in more detail to confirm?',
            timestamp: '2025-06-11T10:15:00Z',
            isRead: true,
        }
    ]
};

// Helper function to calculate similarity score between two items
const calculateSimilarity = (item1: LostItem, item2: LostItem): number => {
    let score = 0;

    // Check if categories match (lost vs found)
    if ((item1.status === 'lost' && item2.status === 'found') ||
        (item1.status === 'found' && item2.status === 'lost')) {
        score += 30;
    } else {
        return 0; // No match if both are lost or both are found
    }

    // Check if categories match
    if (item1.category === item2.category) {
        score += 20;
    }

    // Check location proximity
    if (item1.location.beachId === item2.location.beachId) {
        score += 15;
    }

    // Check date proximity (within 3 days)
    const date1 = new Date(item1.date);
    const date2 = new Date(item2.date);
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
        score += 15;
    }

    // Check tag similarity
    const commonTags = item1.tags.filter(tag => item2.tags.includes(tag));
    score += commonTags.length * 5;

    // Check title and description similarity (simple word matching)
    const item1Words = (item1.title + ' ' + item1.description).toLowerCase().split(/\s+/);
    const item2Words = (item2.title + ' ' + item2.description).toLowerCase().split(/\s+/);

    const commonWords = item1Words.filter(word =>
        word.length > 3 && item2Words.includes(word)
    );

    score += commonWords.length * 2;

    return Math.min(score, 100); // Cap at 100%
};

export const useLostItemStore = create<LostItemState>()(
    persist(
        (set, get) => ({
            lostItems: mockLostItems,
            userLostItems: [],
            filteredItems: mockLostItems,
            selectedItem: null,
            messages: mockMessages,
            isLoading: false,
            error: null,
            searchQuery: '',
            categoryFilter: null,
            statusFilter: null,
            dateFilter: { startDate: null, endDate: null },

            fetchLostItems: () => {
                set({ isLoading: true, error: null });
                try {
                    // In a real app, this would be an API call
                    // For now, we'll use the mock data
                    set({
                        lostItems: mockLostItems,
                        filteredItems: mockLostItems,
                        isLoading: false
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to fetch lost items',
                        isLoading: false
                    });
                }
            },

            fetchUserLostItems: () => {
                set({ isLoading: true, error: null });
                try {
                    const userId = useUserStore.getState().user?.id;
                    if (!userId) {
                        set({ userLostItems: [], isLoading: false });
                        return;
                    }

                    const userItems = mockLostItems.filter(item => item.userId === userId);
                    set({ userLostItems: userItems, isLoading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to fetch user lost items',
                        isLoading: false
                    });
                }
            },

            createLostItem: (item) => {
                set({ isLoading: true, error: null });
                try {
                    const userId = useUserStore.getState().user?.id;
                    if (!userId) {
                        throw new Error('User not authenticated');
                    }

                    const newItem: LostItem = {
                        ...item,
                        id: Date.now().toString(),
                        userId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                    };

                    set(state => ({
                        lostItems: [...state.lostItems, newItem],
                        filteredItems: [...state.filteredItems, newItem],
                        userLostItems: [...state.userLostItems, newItem],
                        isLoading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to create lost item',
                        isLoading: false
                    });
                }
            },

            updateLostItem: (id, updates) => {
                set({ isLoading: true, error: null });
                try {
                    set(state => {
                        const updatedItems = state.lostItems.map(item =>
                            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
                        );

                        const updatedUserItems = state.userLostItems.map(item =>
                            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
                        );

                        const updatedFilteredItems = state.filteredItems.map(item =>
                            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
                        );

                        const updatedSelectedItem = state.selectedItem?.id === id
                            ? { ...state.selectedItem, ...updates, updatedAt: new Date().toISOString() }
                            : state.selectedItem;

                        return {
                            lostItems: updatedItems,
                            userLostItems: updatedUserItems,
                            filteredItems: updatedFilteredItems,
                            selectedItem: updatedSelectedItem,
                            isLoading: false
                        };
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to update lost item',
                        isLoading: false
                    });
                }
            },

            deleteLostItem: (id) => {
                set({ isLoading: true, error: null });
                try {
                    set(state => ({
                        lostItems: state.lostItems.filter(item => item.id !== id),
                        userLostItems: state.userLostItems.filter(item => item.id !== id),
                        filteredItems: state.filteredItems.filter(item => item.id !== id),
                        selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
                        isLoading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to delete lost item',
                        isLoading: false
                    });
                }
            },

            selectItem: (id) => {
                if (!id) {
                    set({ selectedItem: null });
                    return;
                }

                const item = get().lostItems.find(item => item.id === id) || null;
                set({ selectedItem: item });
            },

            searchItems: (query) => {
                set({ searchQuery: query });

                const { categoryFilter, statusFilter, dateFilter } = get();
                const filteredItems = get().lostItems.filter(item => {
                    // Apply search query
                    const matchesQuery = query === '' ||
                        item.title.toLowerCase().includes(query.toLowerCase()) ||
                        item.description.toLowerCase().includes(query.toLowerCase()) ||
                        item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

                    // Apply category filter
                    const matchesCategory = !categoryFilter || item.category === categoryFilter;

                    // Apply status filter
                    const matchesStatus = !statusFilter || item.status === statusFilter;

                    // Apply date filter
                    const matchesDate = !dateFilter.startDate || !dateFilter.endDate ||
                        (new Date(item.date) >= new Date(dateFilter.startDate) &&
                            new Date(item.date) <= new Date(dateFilter.endDate));

                    return matchesQuery && matchesCategory && matchesStatus && matchesDate;
                });

                set({ filteredItems });
            },

            filterByCategory: (category) => {
                set({ categoryFilter: category });

                const { searchQuery, statusFilter, dateFilter } = get();
                const filteredItems = get().lostItems.filter(item => {
                    // Apply search query
                    const matchesQuery = searchQuery === '' ||
                        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

                    // Apply category filter
                    const matchesCategory = !category || item.category === category;

                    // Apply status filter
                    const matchesStatus = !statusFilter || item.status === statusFilter;

                    // Apply date filter
                    const matchesDate = !dateFilter.startDate || !dateFilter.endDate ||
                        (new Date(item.date) >= new Date(dateFilter.startDate) &&
                            new Date(item.date) <= new Date(dateFilter.endDate));

                    return matchesQuery && matchesCategory && matchesStatus && matchesDate;
                });

                set({ filteredItems });
            },

            filterByStatus: (status) => {
                set({ statusFilter: status });

                const { searchQuery, categoryFilter, dateFilter } = get();
                const filteredItems = get().lostItems.filter(item => {
                    // Apply search query
                    const matchesQuery = searchQuery === '' ||
                        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

                    // Apply category filter
                    const matchesCategory = !categoryFilter || item.category === categoryFilter;

                    // Apply status filter
                    const matchesStatus = !status || item.status === status;

                    // Apply date filter
                    const matchesDate = !dateFilter.startDate || !dateFilter.endDate ||
                        (new Date(item.date) >= new Date(dateFilter.startDate) &&
                            new Date(item.date) <= new Date(dateFilter.endDate));

                    return matchesQuery && matchesCategory && matchesStatus && matchesDate;
                });

                set({ filteredItems });
            },

            filterByDate: (startDate, endDate) => {
                set({ dateFilter: { startDate, endDate } });

                const { searchQuery, categoryFilter, statusFilter } = get();
                const filteredItems = get().lostItems.filter(item => {
                    // Apply search query
                    const matchesQuery = searchQuery === '' ||
                        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

                    // Apply category filter
                    const matchesCategory = !categoryFilter || item.category === categoryFilter;

                    // Apply status filter
                    const matchesStatus = !statusFilter || item.status === statusFilter;

                    // Apply date filter
                    const matchesDate = !startDate || !endDate ||
                        (new Date(item.date) >= new Date(startDate) &&
                            new Date(item.date) <= new Date(endDate));

                    return matchesQuery && matchesCategory && matchesStatus && matchesDate;
                });

                set({ filteredItems });
            },

            resetFilters: () => {
                set({
                    searchQuery: '',
                    categoryFilter: null,
                    statusFilter: null,
                    dateFilter: { startDate: null, endDate: null },
                    filteredItems: get().lostItems
                });
            },

            sendMessage: (lostItemId, receiverId, content) => {
                const senderId = useUserStore.getState().user?.id;
                if (!senderId) {
                    set({ error: 'User not authenticated' });
                    return;
                }

                const newMessage: LostItemMessage = {
                    id: Date.now().toString(),
                    lostItemId,
                    senderId,
                    receiverId,
                    content,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                };

                set(state => {
                    const existingMessages = state.messages[lostItemId] || [];
                    return {
                        messages: {
                            ...state.messages,
                            [lostItemId]: [...existingMessages, newMessage]
                        }
                    };
                });
            },

            markMessageAsRead: (messageId) => {
                set(state => {
                    const updatedMessages = { ...state.messages };

                    // Find the message in all conversation threads
                    Object.keys(updatedMessages).forEach(lostItemId => {
                        updatedMessages[lostItemId] = updatedMessages[lostItemId].map(message =>
                            message.id === messageId ? { ...message, isRead: true } : message
                        );
                    });

                    return { messages: updatedMessages };
                });
            },

            getMatchingItems: (item) => {
                const allItems = get().lostItems;
                const oppositeStatus = item.status === 'lost' ? 'found' : 'lost';

                // Filter items with opposite status
                const potentialMatches = allItems.filter(potentialMatch =>
                    potentialMatch.status === oppositeStatus && potentialMatch.id !== item.id
                );

                // Calculate similarity scores
                const scoredMatches = potentialMatches.map(potentialMatch => ({
                    item: potentialMatch,
                    score: calculateSimilarity(item, potentialMatch)
                }));

                // Sort by score (highest first) and filter out low scores
                const goodMatches = scoredMatches
                    .filter(match => match.score >= 40) // Minimum threshold
                    .sort((a, b) => b.score - a.score)
                    .map(match => match.item);

                return goodMatches;
            }
        }),
        {
            name: 'shore-secure-lost-items',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);