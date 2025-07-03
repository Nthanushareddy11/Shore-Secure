import { useBeachStore } from '@/store/beachStore';
import { CommunityPost, useCommunityStore } from '@/store/communityStore';
import { useUserStore } from '@/store/userStore';
import { formatDistanceToNow } from '@/utils/dateUtils';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
    AlertTriangle,
    ArrowUp,
    Camera,
    Flag,
    Image as ImageIcon,
    MapPin,
    MessageCircle,
    MoreVertical,
    Plus,
    Search,
    TrendingUp,
    Users,
    X
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

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
    upvote: '#FF8C42',
    downvote: '#6C5CE7',
};

interface CreatePostModalProps {
    visible: boolean;
    onClose: () => void;
    selectedBeach?: string;
}

export default function CommunityScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedBeach, setSelectedBeach] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

    const {
        posts,
        isLoading,
        fetchPosts,
        likePost,
        createPost,
        deletePost,
        reportPost,
        addComment
    } = useCommunityStore();

    const { beaches } = useBeachStore();
    const { user, isAuthenticated } = useUserStore();

    useEffect(() => {
        fetchPosts();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPosts();
        setRefreshing(false);
    }, []);

    const getBeachName = (beachId: string) => {
        const beach = beaches.find(b => b.id === beachId);
        return beach?.name || 'Unknown Beach';
    };

    const handleLikePost = async (postId: string) => {
        if (!isAuthenticated) {
            Alert.alert('Login Required', 'Please login to like posts');
            return;
        }
        try {
            await likePost(postId);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleReportPost = (postId: string) => {
        Alert.alert(
            'Report Post',
            'Why are you reporting this post?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Spam', onPress: () => reportPost(postId, 'spam') },
                { text: 'Inappropriate', onPress: () => reportPost(postId, 'inappropriate') },
                { text: 'Misinformation', onPress: () => reportPost(postId, 'misinformation') },
            ]
        );
    };

    const handleDeletePost = (postId: string) => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deletePost(postId) },
            ]
        );
    };

    const togglePostExpansion = (postId: string) => {
        const newExpanded = new Set(expandedPosts);
        if (newExpanded.has(postId)) {
            newExpanded.delete(postId);
        } else {
            newExpanded.add(postId);
        }
        setExpandedPosts(newExpanded);
    };

    const filteredAndSortedPosts = useCallback(() => {
        let filtered = posts.filter(post => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesContent = post.content.toLowerCase().includes(query);
                const matchesBeach = getBeachName(post.beachId).toLowerCase().includes(query);
                const matchesUser = post.userName.toLowerCase().includes(query);
                const matchesTags = post.tags.some(tag => tag.toLowerCase().includes(query));

                if (!matchesContent && !matchesBeach && !matchesUser && !matchesTags) {
                    return false;
                }
            }

            if (selectedFilter) {
                if (selectedFilter === 'alerts') {
                    return post.isAlert;
                } else {
                    return post.tags.includes(selectedFilter);
                }
            }

            return true;
        });

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'new':
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                case 'top':
                    return b.likes - a.likes;
                case 'hot':
                default:
                    const aScore = (a.likes + a.comments.length) / Math.pow((Date.now() - new Date(a.timestamp).getTime()) / 3600000 + 1, 1.5);
                    const bScore = (b.likes + b.comments.length) / Math.pow((Date.now() - new Date(b.timestamp).getTime()) / 3600000 + 1, 1.5);
                    return bScore - aScore;
            }
        });

        return filtered;
    }, [posts, searchQuery, selectedFilter, sortBy]);

    const CreatePostModal = ({ visible, onClose, selectedBeach }: CreatePostModalProps) => {
        const [content, setContent] = useState('');
        const [selectedImages, setSelectedImages] = useState<string[]>([]);
        const [tags, setTags] = useState<string[]>([]);
        const [newTag, setNewTag] = useState('');
        const [isAlert, setIsAlert] = useState(false);
        const [alertType, setAlertType] = useState<'safety' | 'weather' | 'crowded' | 'other'>('safety');
        const [posting, setPosting] = useState(false);
        const [beachId, setBeachId] = useState(selectedBeach || (beaches.length > 0 ? beaches[0].id : ''));

        // Request camera permissions on modal open
        useEffect(() => {
            if (visible) {
                requestPermissions();
            }
        }, [visible]);

        const requestPermissions = async () => {
            try {
                const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
                const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                
                if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
                    console.log('Permissions not granted');
                }
            } catch (error) {
                console.error('Error requesting permissions:', error);
            }
        };

        const pickImage = async () => {
            try {
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsMultipleSelection: true,
                    quality: 0.8,
                    aspect: [16, 9],
                });

                if (!result.canceled) {
                    const newImages = result.assets.map(asset => asset.uri);
                    setSelectedImages(prev => [...prev, ...newImages].slice(0, 4));
                }
            } catch (error) {
                console.error('Error picking image:', error);
                Alert.alert('Error', 'Failed to pick image. Please try again.');
            }
        };

        const takePhoto = async () => {
            try {
                // Check permissions first
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (permission.status !== 'granted') {
                    Alert.alert(
                        'Camera Permission Required',
                        'Please enable camera access in your device settings to take photos.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Settings', onPress: () => {
                                // On iOS, this would open settings
                                if (Platform.OS === 'ios') {
                                    // Linking.openURL('app-settings:');
                                }
                            }}
                        ]
                    );
                    return;
                }

                const result = await ImagePicker.launchCameraAsync({
                    quality: 0.8,
                    aspect: [16, 9],
                    allowsEditing: true,
                });

                if (!result.canceled) {
                    setSelectedImages(prev => [...prev, result.assets[0].uri].slice(0, 4));
                }
            } catch (error) {
                console.error('Error taking photo:', error);
                Alert.alert('Error', 'Failed to take photo. Please try again.');
            }
        };

        const addTag = () => {
            if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
                setTags(prev => [...prev, newTag.trim()]);
                setNewTag('');
            }
        };

        const removeTag = (tagToRemove: string) => {
            setTags(prev => prev.filter(tag => tag !== tagToRemove));
        };

        const removeImage = (indexToRemove: number) => {
            setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
        };

        const handleSubmit = async () => {
            if (!content.trim()) {
                Alert.alert('Error', 'Please enter some content for your post.');
                return;
            }
            
            if (!beachId) {
                Alert.alert('Error', 'Please select a beach for your post.');
                return;
            }

            if (!isAuthenticated || !user) {
                Alert.alert('Error', 'You must be logged in to create a post.');
                return;
            }

            setPosting(true);
            try {
                // Create the post object
                const newPost = {
                    id: Date.now().toString(), // Temporary ID
                    beachId,
                    userId: user.id,
                    userName: user.name,
                    userAvatar: user.avatar || '',
                    content: content.trim(),
                    imageUrl: selectedImages.length > 0 ? selectedImages[0] : undefined,
                    images: selectedImages,
                    tags,
                    isAlert,
                    alertType: isAlert ? alertType : undefined,
                    timestamp: new Date().toISOString(),
                    likes: 0,
                    isLiked: false,
                    comments: [],
                };

                // Call the store method
                await createPost(newPost);
                
                // Reset form
                setContent('');
                setSelectedImages([]);
                setTags([]);
                setNewTag('');
                setIsAlert(false);
                setAlertType('safety');
                
                // Close modal
                onClose();
                
                // Show success message
                Alert.alert('Success', 'Your post has been created successfully!');
                
            } catch (error) {
                console.error('Error creating post:', error);
                Alert.alert('Error', 'Failed to create post. Please check your connection and try again.');
            } finally {
                setPosting(false);
            }
        };

        return (
            <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
                <KeyboardAvoidingView 
                    style={styles.modalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <StatusBar barStyle="light-content" />
                    
                    {/* Enhanced Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                            <X size={24} color={Theme.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Create Post</Text>
                        <TouchableOpacity 
                            onPress={handleSubmit}
                            disabled={!content.trim() || !beachId || posting}
                            style={[
                                styles.postButton,
                                (!content.trim() || !beachId || posting) && styles.postButtonDisabled
                            ]}
                        >
                            {posting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.postButtonText}>Post</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {/* Beach Selection - Improved */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Select Beach</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.beachScrollContainer}>
                                <View style={styles.beachChipsContainer}>
                                    {beaches.map(beach => (
                                        <TouchableOpacity
                                            key={beach.id}
                                            style={[
                                                styles.beachChip,
                                                beachId === beach.id && styles.selectedBeachChip
                                            ]}
                                            onPress={() => setBeachId(beach.id)}
                                        >
                                            <MapPin size={14} color={beachId === beach.id ? 'white' : Theme.primary} />
                                            <Text style={[
                                                styles.beachChipText,
                                                beachId === beach.id && styles.selectedBeachChipText
                                            ]}>
                                                {beach.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Content Input - Enhanced */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>What's happening?</Text>
                            <View style={styles.contentInputContainer}>
                                <TextInput
                                    style={styles.contentInput}
                                    placeholder="Share your beach experience, ask questions, or report conditions..."
                                    placeholderTextColor={Theme.textSecondary}
                                    value={content}
                                    onChangeText={setContent}
                                    multiline
                                    maxLength={500}
                                    textAlignVertical="top"
                                />
                                <View style={styles.inputFooter}>
                                    <Text style={styles.characterCount}>
                                        {content.length}/500
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Alert Toggle - Improved */}
                        <View style={styles.section}>
                            <TouchableOpacity 
                                style={styles.alertToggleContainer}
                                onPress={() => setIsAlert(!isAlert)}
                            >
                                <View style={styles.alertToggleLeft}>
                                    <View style={[styles.alertIcon, isAlert && styles.alertIconActive]}>
                                        <AlertTriangle size={18} color={isAlert ? 'white' : Theme.warning} />
                                    </View>
                                    <View>
                                        <Text style={styles.alertToggleTitle}>Safety Alert</Text>
                                        <Text style={styles.alertToggleSubtitle}>Mark as important safety information</Text>
                                    </View>
                                </View>
                                <View style={[styles.toggleSwitch, isAlert && styles.toggleSwitchActive]}>
                                    <View style={[styles.toggleThumb, isAlert && styles.toggleThumbActive]} />
                                </View>
                            </TouchableOpacity>

                            {isAlert && (
                                <View style={styles.alertTypeContainer}>
                                    <Text style={styles.alertTypeLabel}>Alert Type</Text>
                                    <View style={styles.alertTypeGrid}>
                                        {[
                                            { id: 'safety', label: 'Safety', icon: '⚠️' },
                                            { id: 'weather', label: 'Weather', icon: '🌊' },
                                            { id: 'crowded', label: 'Crowded', icon: '👥' },
                                            { id: 'other', label: 'Other', icon: '📢' }
                                        ].map(type => (
                                            <TouchableOpacity
                                                key={type.id}
                                                style={[
                                                    styles.alertTypeOption,
                                                    alertType === type.id && styles.selectedAlertType
                                                ]}
                                                onPress={() => setAlertType(type.id as any)}
                                            >
                                                <Text style={styles.alertTypeEmoji}>{type.icon}</Text>
                                                <Text style={[
                                                    styles.alertTypeText,
                                                    alertType === type.id && styles.selectedAlertTypeText
                                                ]}>
                                                    {type.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Media Section - Enhanced */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Add Media</Text>
                            <View style={styles.mediaActions}>
                                <TouchableOpacity style={styles.mediaActionButton} onPress={takePhoto}>
                                    <View style={styles.mediaActionIcon}>
                                        <Camera size={20} color={Theme.primary} />
                                    </View>
                                    <Text style={styles.mediaActionText}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.mediaActionButton} onPress={pickImage}>
                                    <View style={styles.mediaActionIcon}>
                                        <ImageIcon size={20} color={Theme.primary} />
                                    </View>
                                    <Text style={styles.mediaActionText}>Gallery</Text>
                                </TouchableOpacity>
                            </View>

                            {selectedImages.length > 0 && (
                                <View style={styles.selectedImagesContainer}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {selectedImages.map((uri, index) => (
                                            <View key={index} style={styles.selectedImageWrapper}>
                                                <Image source={{ uri }} style={styles.selectedImage} />
                                                <TouchableOpacity 
                                                    style={styles.removeImageButton}
                                                    onPress={() => removeImage(index)}
                                                >
                                                    <X size={14} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                    <Text style={styles.imageCount}>{selectedImages.length}/4 images</Text>
                                </View>
                            )}
                        </View>

                        {/* Tags Section - Enhanced */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Tags (Optional)</Text>
                            <View style={styles.tagInputContainer}>
                                <TextInput
                                    style={styles.tagInput}
                                    placeholder="Add a tag..."
                                    placeholderTextColor={Theme.textSecondary}
                                    value={newTag}
                                    onChangeText={setNewTag}
                                    onSubmitEditing={addTag}
                                    returnKeyType="done"
                                    maxLength={20}
                                />
                                <TouchableOpacity 
                                    onPress={addTag} 
                                    style={styles.addTagButton}
                                    disabled={!newTag.trim() || tags.length >= 5}
                                >
                                    <Plus size={16} color={!newTag.trim() || tags.length >= 5 ? Theme.textTertiary : Theme.primary} />
                                </TouchableOpacity>
                            </View>

                            {tags.length > 0 && (
                                <View style={styles.selectedTagsContainer}>
                                    {tags.map(tag => (
                                        <View key={tag} style={styles.selectedTag}>
                                            <Text style={styles.selectedTagText}>#{tag}</Text>
                                            <TouchableOpacity onPress={() => removeTag(tag)}>
                                                <X size={12} color={Theme.text} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    <Text style={styles.tagCount}>{tags.length}/5 tags</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.modalBottomSpacing} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        );
    };

    const renderPost = ({ item }: { item: CommunityPost }) => {
        const formattedTime = formatDistanceToNow(new Date(item.timestamp));
        const beachName = getBeachName(item.beachId);
        const isExpanded = expandedPosts.has(item.id);
        const isOwnPost = user?.id === item.userId;

        return (
            <View style={[
                styles.postCard,
                item.isAlert && styles.alertPostCard
            ]}>
                {item.isAlert && (
                    <View style={styles.alertBanner}>
                        <AlertTriangle size={14} color="white" />
                        <Text style={styles.alertBannerText}>
                            {item.alertType?.toUpperCase()} ALERT
                        </Text>
                    </View>
                )}

                <View style={styles.postHeader}>
                    <Image
                        source={{ uri: item.userAvatar || 'https://i.pravatar.cc/150' }}
                        style={styles.userAvatar}
                    />
                    <View style={styles.postHeaderContent}>
                        <Text style={styles.userName}>{item.userName}</Text>
                        <View style={styles.postMetaRow}>
                            <TouchableOpacity onPress={() => router.push(`/beach/${item.beachId}`)}>
                                <Text style={styles.beachName}>{beachName}</Text>
                            </TouchableOpacity>
                            <Text style={styles.postTimestamp}>• {formattedTime}</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.postMenuButton}
                        onPress={() => {
                            Alert.alert(
                                'Post Options',
                                '',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    ...(isOwnPost ? [{ 
                                        text: 'Delete', 
                                        style: 'destructive', 
                                        onPress: () => handleDeletePost(item.id) 
                                    }] : []),
                                    { 
                                        text: 'Report', 
                                        onPress: () => handleReportPost(item.id) 
                                    },
                                ]
                            );
                        }}
                    >
                        <MoreVertical size={16} color={Theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => togglePostExpansion(item.id)}>
                    <Text
                        style={styles.postContent}
                        numberOfLines={isExpanded ? undefined : 3}
                    >
                        {item.content}
                    </Text>
                    {item.content.length > 150 && (
                        <Text style={styles.expandToggle}>
                            {isExpanded ? 'Show less' : 'Show more'}
                        </Text>
                    )}
                </TouchableOpacity>

                {item.imageUrl && (
                    <TouchableOpacity style={styles.postImageContainer}>
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.postImage}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )}

                {item.tags.length > 0 && (
                    <View style={styles.postTagsContainer}>
                        {item.tags.slice(0, 3).map((tag, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={styles.postTag}
                                onPress={() => setSelectedFilter(tag)}
                            >
                                <Text style={styles.postTagText}>#{tag}</Text>
                            </TouchableOpacity>
                        ))}
                        {item.tags.length > 3 && (
                            <View style={styles.postTag}>
                                <Text style={styles.postTagText}>+{item.tags.length - 3}</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.postActions}>
                    <TouchableOpacity 
                        style={styles.postActionButton}
                        onPress={() => handleLikePost(item.id)}
                    >
                        <ArrowUp 
                            size={18} 
                            color={item.isLiked ? Theme.upvote : Theme.textSecondary}
                            fill={item.isLiked ? Theme.upvote : 'none'}
                        />
                        <Text style={[
                            styles.postActionText,
                            item.isLiked && { color: Theme.upvote }
                        ]}>
                            {item.likes}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.postActionButton}
                        onPress={() => router.push(`/community/post/${item.id}`)}
                    >
                        <MessageCircle size={18} color={Theme.textSecondary} />
                        <Text style={styles.postActionText}>{item.comments.length}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.postActionButton}>
                        <Flag size={18} color={Theme.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderFilterChips = () => {
        const filters = [
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'swimming', label: 'Swimming' },
            { id: 'surfing', label: 'Surfing' },
            { id: 'weather', label: 'Weather' },
            { id: 'safety', label: 'Safety' },
            { id: 'crowded', label: 'Crowded' },
            { id: 'photos', label: 'Photos' },
        ];

        return (
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsContainer}
            >
                {filters.map((filter) => {
                    const Icon = filter.icon;
                    return (
                        <TouchableOpacity
                            key={filter.id}
                            style={[
                                styles.filterChip,
                                selectedFilter === filter.id && styles.activeFilterChip
                            ]}
                            onPress={() => setSelectedFilter(
                                selectedFilter === filter.id ? null : filter.id
                            )}
                        >
                            {Icon && (
                                <Icon
                                    size={14}
                                    color={selectedFilter === filter.id ? 'white' : Theme.textSecondary}
                                />
                            )}
                            <Text
                                style={[
                                    styles.filterChipText,
                                    selectedFilter === filter.id && styles.activeFilterChipText
                                ]}
                            >
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    const renderSortOptions = () => {
        const sortOptions = [
            { id: 'hot', label: 'Hot', icon: TrendingUp },
            { id: 'new', label: 'New' },
            { id: 'top', label: 'Top' },
        ];

        return (
            <View style={styles.sortOptionsContainer}>
                {sortOptions.map(option => {
                    const Icon = option.icon;
                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.sortOption,
                                sortBy === option.id && styles.activeSortOption
                            ]}
                            onPress={() => setSortBy(option.id as any)}
                        >
                            {Icon && (
                                <Icon 
                                    size={16} 
                                    color={sortBy === option.id ? Theme.primary : Theme.textSecondary} 
                                />
                            )}
                            <Text style={[
                                styles.sortOptionText,
                                sortBy === option.id && styles.activeSortOptionText
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Theme.background} />
            
            {/* Enhanced Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Community</Text>
                    {isAuthenticated && (
                        <TouchableOpacity 
                            style={styles.createPostButton}
                            onPress={() => setShowCreateModal(true)}
                        >
                            <Plus size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
                
                <View style={styles.searchContainer}>
                    <Search size={20} color={Theme.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search posts, beaches, users..."
                        placeholderTextColor={Theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Filters and Sort */}
            {renderFilterChips()}
            {renderSortOptions()}

            {/* Posts List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Theme.primary} />
                    <Text style={styles.loadingText}>Loading community posts...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredAndSortedPosts()}
                    renderItem={renderPost}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.postsList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Theme.primary}
                            colors={[Theme.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyStateContainer}>
                            <View style={styles.emptyStateIcon}>
                                <Users size={48} color={Theme.primary} />
                            </View>
                            <Text style={styles.emptyStateTitle}>No posts yet</Text>
                            <Text style={styles.emptyStateSubtitle}>
                                {searchQuery || selectedFilter
                                    ? 'Try adjusting your search or filters'
                                    : 'Be the first to share something with the community!'}
                            </Text>
                            {isAuthenticated && !searchQuery && !selectedFilter && (
                                <TouchableOpacity 
                                    style={styles.emptyStateButton}
                                    onPress={() => setShowCreateModal(true)}
                                >
                                    <Text style={styles.emptyStateButtonText}>Create First Post</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}

            {/* Create Post Modal */}
            <CreatePostModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                selectedBeach={selectedBeach}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.background,
    },
    
    // Enhanced Header
    header: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: Theme.background,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Theme.text,
    },
    createPostButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Theme.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        borderRadius: 16,
        paddingHorizontal: 20,
        height: 52,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        color: Theme.text,
        fontSize: 16,
        height: '100%',
    },
    
    // Enhanced Filters
    filterChipsContainer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 12,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeFilterChip: {
        backgroundColor: Theme.primary,
        borderColor: Theme.primary,
    },
    filterChipText: {
        color: Theme.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    activeFilterChipText: {
        color: 'white',
    },
    
    // Enhanced Sort Options
    sortOptionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 16,
        gap: 16,
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    activeSortOption: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
    },
    sortOptionText: {
        color: Theme.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    activeSortOptionText: {
        color: Theme.primary,
    },
    
    // Enhanced Posts
    postsList: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    postCard: {
        backgroundColor: Theme.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    alertPostCard: {
        borderLeftWidth: 4,
        borderLeftColor: Theme.warning,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 184, 0, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    alertBannerText: {
        color: Theme.warning,
        fontWeight: '700',
        fontSize: 12,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    postHeaderContent: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 4,
    },
    postMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    beachName: {
        fontSize: 14,
        color: Theme.primary,
        fontWeight: '600',
    },
    postTimestamp: {
        fontSize: 14,
        color: Theme.textSecondary,
        marginLeft: 8,
    },
    postMenuButton: {
        padding: 8,
    },
    postContent: {
        fontSize: 16,
        color: Theme.text,
        lineHeight: 24,
        marginBottom: 12,
    },
    expandToggle: {
        fontSize: 14,
        color: Theme.primary,
        fontWeight: '600',
        marginBottom: 12,
    },
    postImageContainer: {
        marginBottom: 16,
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 16,
    },
    postTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 8,
    },
    postTag: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    postTagText: {
        fontSize: 12,
        color: Theme.primary,
        fontWeight: '600',
    },
    postActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: Theme.border,
        paddingTop: 16,
        gap: 24,
    },
    postActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    postActionText: {
        fontSize: 14,
        color: Theme.textSecondary,
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
        marginTop: 16,
        color: Theme.textSecondary,
        fontSize: 16,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyStateIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: Theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    emptyStateButton: {
        backgroundColor: Theme.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyStateButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    
    // Enhanced Create Post Modal
    modalContainer: {
        flex: 1,
        backgroundColor: Theme.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: Theme.border,
    },
    modalCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Theme.text,
    },
    postButton: {
        backgroundColor: Theme.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        minWidth: 60,
        alignItems: 'center',
    },
    postButtonDisabled: {
        backgroundColor: Theme.textTertiary,
    },
    postButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 24,
    },
    
    // Enhanced Sections
    section: {
        marginVertical: 20,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 16,
    },
    
    // Enhanced Beach Selection
    beachScrollContainer: {
        marginHorizontal: -4,
    },
    beachChipsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        gap: 12,
    },
    beachChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    selectedBeachChip: {
        backgroundColor: Theme.primary,
        borderColor: Theme.primary,
    },
    beachChipText: {
        color: Theme.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    selectedBeachChipText: {
        color: 'white',
    },
    
    // Enhanced Content Input
    contentInputContainer: {
        backgroundColor: Theme.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    contentInput: {
        padding: 20,
        color: Theme.text,
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    inputFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    characterCount: {
        color: Theme.textSecondary,
        fontSize: 12,
    },
    
    // Enhanced Alert Toggle
    alertToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Theme.surface,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    alertToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 16,
    },
    alertIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 184, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertIconActive: {
        backgroundColor: Theme.warning,
    },
    alertToggleTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.text,
    },
    alertToggleSubtitle: {
        fontSize: 12,
        color: Theme.textSecondary,
        marginTop: 2,
    },
    toggleSwitch: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: Theme.surfaceLight,
        padding: 2,
        justifyContent: 'center',
    },
    toggleSwitchActive: {
        backgroundColor: Theme.warning,
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleThumbActive: {
        transform: [{ translateX: 20 }],
    },
    alertTypeContainer: {
        marginTop: 16,
    },
    alertTypeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.text,
        marginBottom: 12,
    },
    alertTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    alertTypeOption: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: Theme.surfaceLight,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedAlertType: {
        backgroundColor: 'rgba(255, 184, 0, 0.1)',
        borderColor: Theme.warning,
    },
    alertTypeEmoji: {
        fontSize: 20,
        marginBottom: 8,
    },
    alertTypeText: {
        color: Theme.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    selectedAlertTypeText: {
        color: Theme.warning,
    },
    
    // Enhanced Media Section
    mediaActions: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    mediaActionButton: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Theme.surface,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    mediaActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    mediaActionText: {
        color: Theme.text,
        fontWeight: '600',
        fontSize: 14,
    },
    selectedImagesContainer: {
        backgroundColor: Theme.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    selectedImageWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    selectedImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Theme.danger,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCount: {
        color: Theme.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
    },
    
    // Enhanced Tags Section
    tagInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        borderRadius: 16,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    tagInput: {
        flex: 1,
        color: Theme.text,
        fontSize: 16,
        paddingVertical: 16,
    },
    addTagButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedTagsContainer: {
        backgroundColor: Theme.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Theme.border,
        marginTop: 12,
    },
    selectedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    selectedTagText: {
        color: Theme.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    tagCount: {
        color: Theme.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
    },
    
    modalBottomSpacing: {
        height: 40,
    },
});