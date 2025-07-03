import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Types for community posts
export interface CommunityPost {
    id: string;
    beachId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    imageUrl?: string;
    images?: string[];
    timestamp: string;
    likes: number;
    isLiked: boolean;
    isAlert: boolean;
    alertType?: 'safety' | 'weather' | 'crowded' | 'other';
    tags: string[];
    comments: CommunityComment[];
}

export interface CommunityComment {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    timestamp: string;
    likes: number;
    isLiked: boolean;
    replies: CommunityComment[];
}

interface CommunityState {
    posts: CommunityPost[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchPosts: (beachId?: string) => Promise<void>;
    createPost: (post: any) => Promise<void>; // Fixed: Added createPost function
    addPost: (post: Omit<CommunityPost, 'id' | 'timestamp' | 'likes' | 'comments' | 'isLiked'>) => Promise<void>;
    likePost: (postId: string) => Promise<void>;
    addComment: (comment: Omit<CommunityComment, 'id' | 'timestamp' | 'likes' | 'isLiked' | 'replies'>) => Promise<void>;
    reportPost: (postId: string, reason: string) => Promise<void>;
    deletePost: (postId: string) => Promise<void>;
    updatePost: (postId: string, updates: Partial<CommunityPost>) => Promise<void>;
    searchPosts: (query: string) => CommunityPost[];
    getPostsByBeach: (beachId: string) => CommunityPost[];
    getPostsByUser: (userId: string) => CommunityPost[];
}

// Enhanced mock data generator
const generateMockPost = (beachId: string, index: number): CommunityPost => {
    const isAlert = index % 5 === 0;
    const alertTypes = ['safety', 'weather', 'crowded', 'other'] as const;
    
    const postTypes = [
        { content: "Beautiful sunset at the beach today! Perfect weather for swimming.", tags: ['sunset', 'swimming', 'weather'] },
        { content: "Spotted some jellyfish near the shore. Be careful while swimming!", tags: ['jellyfish', 'safety', 'warning'], isAlert: true, alertType: 'safety' },
        { content: "Great waves for surfing today! Wind conditions are perfect.", tags: ['surfing', 'waves', 'wind'] },
        { content: "Beach is quite crowded today. Arrive early to get a good spot.", tags: ['crowded', 'tips'], isAlert: true, alertType: 'crowded' },
        { content: "Found a lost wallet near the lifeguard station. Turned it in to lost & found.", tags: ['lost', 'found', 'help'] },
        { content: "Amazing snorkeling conditions today! Crystal clear water.", tags: ['snorkeling', 'clear', 'water'] },
        { content: "Strong rip current warning issued for this area. Stay safe!", tags: ['rip-current', 'safety', 'warning'], isAlert: true, alertType: 'safety' },
        { content: "Perfect family day at the beach. Kids are loving the calm waters.", tags: ['family', 'kids', 'calm'] }
    ];

    const postData = postTypes[index % postTypes.length];
    
    return {
        id: `post-${beachId}-${index}`,
        beachId,
        userId: `user${index % 5 + 1}`,
        userName: `Beach Explorer ${index % 5 + 1}`,
        userAvatar: `https://i.pravatar.cc/150?img=${index % 10 + 1}`,
        content: postData.content,
        imageUrl: index % 3 === 0 ? `https://picsum.photos/400/300?random=${index}` : undefined,
        images: index % 3 === 0 ? [`https://picsum.photos/400/300?random=${index}`] : [],
        timestamp: new Date(Date.now() - index * 3600000).toISOString(),
        likes: Math.floor(Math.random() * 50),
        isLiked: Math.random() > 0.7,
        isAlert: postData.isAlert || false,
        alertType: postData.alertType,
        tags: postData.tags,
        comments: Array(Math.floor(Math.random() * 5)).fill(0).map((_, i) => ({
            id: `comment-${beachId}-${index}-${i}`,
            postId: `post-${beachId}-${index}`,
            userId: `user${(index + i) % 5 + 2}`,
            userName: `Beach User ${(index + i) % 5 + 2}`,
            userAvatar: `https://i.pravatar.cc/150?img=${(index + i) % 10 + 1}`,
            content: [
                "Thanks for sharing this info!",
                "Great photo! 📸",
                "Be safe out there everyone!",
                "I was there yesterday, conditions were similar.",
                "Appreciate the heads up! 🙏"
            ][i % 5],
            timestamp: new Date(Date.now() - (index * 3600000) - (i * 600000)).toISOString(),
            likes: Math.floor(Math.random() * 10),
            isLiked: Math.random() > 0.8,
            replies: []
        }))
    };
};

export const useCommunityStore = create<CommunityState>()(
    persist(
        (set, get) => ({
            posts: [],
            isLoading: false,
            error: null,

            fetchPosts: async (beachId?: string) => {
                set({ isLoading: true, error: null });

                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    let mockPosts: CommunityPost[] = [];

                    if (beachId) {
                        mockPosts = Array(15).fill(0).map((_, i) => generateMockPost(beachId, i));
                    } else {
                        const beachIds = ['beach1', 'beach2', 'beach3', 'beach4', 'beach5'];
                        mockPosts = beachIds.flatMap((id, beachIndex) =>
                            Array(8).fill(0).map((_, i) => generateMockPost(id, beachIndex * 10 + i))
                        );
                    }

                    mockPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                    set({ posts: mockPosts, isLoading: false });
                } catch (error) {
                    console.error('Error fetching posts:', error);
                    set({ error: 'Failed to fetch community posts', isLoading: false });
                }
            },

            // Fixed: Implemented createPost function
            createPost: async (postData) => {
                set({ isLoading: true, error: null });

                try {
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    const newPost: CommunityPost = {
                        id: `post-${Date.now()}`,
                        beachId: postData.beachId,
                        userId: postData.userId,
                        userName: postData.userName,
                        userAvatar: postData.userAvatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 10) + 1}`,
                        content: postData.content,
                        imageUrl: postData.images && postData.images.length > 0 ? postData.images[0] : undefined,
                        images: postData.images || [],
                        timestamp: new Date().toISOString(),
                        likes: 0,
                        isLiked: false,
                        isAlert: postData.isAlert || false,
                        alertType: postData.alertType,
                        tags: postData.tags || [],
                        comments: []
                    };

                    set(state => ({
                        posts: [newPost, ...state.posts],
                        isLoading: false,
                    }));

                    return newPost;
                } catch (error) {
                    console.error('Error creating post:', error);
                    set({ error: 'Failed to create post', isLoading: false });
                    throw error;
                }
            },

            addPost: async (postData) => {
                return get().createPost(postData);
            },

            likePost: async (postId) => {
                try {
                    set(state => ({
                        posts: state.posts.map(post =>
                            post.id === postId
                                ? { 
                                    ...post, 
                                    likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                                    isLiked: !post.isLiked 
                                }
                                : post
                        ),
                    }));
                } catch (error) {
                    console.error('Error liking post:', error);
                    set({ error: 'Failed to like post' });
                }
            },

            addComment: async (commentData) => {
                try {
                    const newComment: CommunityComment = {
                        ...commentData,
                        id: `comment-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        likes: 0,
                        isLiked: false,
                        replies: []
                    };

                    set(state => ({
                        posts: state.posts.map(post =>
                            post.id === commentData.postId
                                ? { ...post, comments: [...post.comments, newComment] }
                                : post
                        ),
                    }));
                } catch (error) {
                    console.error('Error adding comment:', error);
                    set({ error: 'Failed to add comment' });
                }
            },

            reportPost: async (postId, reason) => {
                try {
                    console.log(`Reported post ${postId} for reason: ${reason}`);
                    // In real app, send to moderation system
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error('Error reporting post:', error);
                    set({ error: 'Failed to report post' });
                }
            },

            deletePost: async (postId) => {
                try {
                    set(state => ({
                        posts: state.posts.filter(post => post.id !== postId),
                    }));
                } catch (error) {
                    console.error('Error deleting post:', error);
                    set({ error: 'Failed to delete post' });
                }
            },

            updatePost: async (postId, updates) => {
                try {
                    set(state => ({
                        posts: state.posts.map(post =>
                            post.id === postId
                                ? { ...post, ...updates }
                                : post
                        ),
                    }));
                } catch (error) {
                    console.error('Error updating post:', error);
                    set({ error: 'Failed to update post' });
                }
            },

            searchPosts: (query) => {
                const { posts } = get();
                return posts.filter(post =>
                    post.content.toLowerCase().includes(query.toLowerCase()) ||
                    post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
                    post.userName.toLowerCase().includes(query.toLowerCase())
                );
            },

            getPostsByBeach: (beachId) => {
                const { posts } = get();
                return posts.filter(post => post.beachId === beachId);
            },

            getPostsByUser: (userId) => {
                const { posts } = get();
                return posts.filter(post => post.userId === userId);
            }
        }),
        {
            name: 'community-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                posts: state.posts.slice(0, 100), // Limit stored posts
            }),
        }
    )
);