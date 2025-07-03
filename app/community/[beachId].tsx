import Colors from '@/constants/colors';
import { useBeachStore } from '@/store/beachStore';
import { CommunityPost, useCommunityStore } from '@/store/communityStore';
import { formatDistanceToNow } from '@/utils/dateUtils';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertTriangle,
    Flag,
    Heart,
    Image as ImageIcon,
    MessageCircle,
    Send,
    Tag,
    X
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Mock user data
const currentUser = {
    id: 'user123',
    name: 'Beach Explorer',
    avatar: 'https://i.pravatar.cc/150?img=3',
};

export default function BeachCommunityScreen() {
    const { beachId } = useLocalSearchParams<{ beachId: string }>();
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);

    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState<string | null>(null);
    const [isAlert, setIsAlert] = useState(false);
    const [alertType, setAlertType] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showTagSelector, setShowTagSelector] = useState(false);
    const [showCommentInput, setShowCommentInput] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');

    const {
        posts,
        isLoading,
        fetchPosts,
        addPost,
        likePost,
        addComment,
        reportPost
    } = useCommunityStore();

    const { selectedBeach, selectBeach } = useBeachStore();

    useEffect(() => {
        if (beachId) {
            fetchPosts(beachId);
            selectBeach(beachId);
        }
    }, [beachId]);

    const beachPosts = posts.filter(post => post.beachId === beachId);

    const handleAddPost = async () => {
        if (!newPostContent.trim() && !newPostImage) return;

        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        await addPost({
            beachId: beachId as string,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            content: newPostContent,
            imageUrl: newPostImage || undefined,
            isAlert,
            alertType: alertType as any,
            tags: selectedTags,
        });

        // Reset form
        setNewPostContent('');
        setNewPostImage(null);
        setIsAlert(false);
        setAlertType(null);
        setSelectedTags([]);
    };

    const handleAddComment = async (postId: string) => {
        if (!commentText.trim()) return;

        await addComment({
            postId,
            userId: currentUser.id,
            userName: currentUser.name,
            content: commentText,
        });

        setCommentText('');
        setShowCommentInput(null);

        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
    };

    const handleLikePost = (postId: string) => {
        likePost(postId);

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleReportPost = (postId: string) => {
        Alert.alert(
            'Report Post',
            'Why are you reporting this post?',
            [
                {
                    text: 'Inappropriate Content',
                    onPress: () => reportPost(postId, 'inappropriate'),
                },
                {
                    text: 'False Information',
                    onPress: () => reportPost(postId, 'false_info'),
                },
                {
                    text: 'Spam',
                    onPress: () => reportPost(postId, 'spam'),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Permission Required', 'You need to grant permission to access your photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setNewPostImage(result.assets[0].uri);
        }
    };

    const handleToggleAlert = () => {
        setIsAlert(!isAlert);
        if (!isAlert) {
            setShowTagSelector(true);
        } else {
            setAlertType(null);
        }
    };

    const handleSelectAlertType = (type: string) => {
        setAlertType(type);
        setShowTagSelector(false);

        // Add the alert type as a tag
        if (!selectedTags.includes(type)) {
            setSelectedTags([...selectedTags, type]);
        }
    };

    const handleToggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const renderPost = ({ item }: { item: CommunityPost }) => {
        const formattedTime = formatDistanceToNow(new Date(item.timestamp));

        return (
            <View style={[
                styles.postContainer,
                item.isAlert && styles.alertPostContainer
            ]}>
                {item.isAlert && (
                    <View style={styles.alertBanner}>
                        <AlertTriangle size={16} color="#fff" />
                        <Text style={styles.alertText}>
                            {item.alertType?.toUpperCase()} ALERT
                        </Text>
                    </View>
                )}

                <View style={styles.postHeader}>
                    <Image
                        source={{ uri: item.userAvatar || 'https://i.pravatar.cc/150' }}
                        style={styles.avatar}
                    />
                    <View style={styles.postHeaderText}>
                        <Text style={styles.userName}>{item.userName}</Text>
                        <Text style={styles.timestamp}>{formattedTime}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.reportButton}
                        onPress={() => handleReportPost(item.id)}
                    >
                        <Flag size={16} color={Colors.dark.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.postContent}>{item.content}</Text>

                {item.imageUrl && (
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                    />
                )}

                {item.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {item.tags.map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.postActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleLikePost(item.id)}
                    >
                        <Heart
                            size={18}
                            color={Colors.dark.textSecondary}
                        />
                        <Text style={styles.actionText}>{item.likes}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setShowCommentInput(item.id)}
                    >
                        <MessageCircle size={18} color={Colors.dark.textSecondary} />
                        <Text style={styles.actionText}>{item.comments.length}</Text>
                    </TouchableOpacity>
                </View>

                {item.comments.length > 0 && (
                    <View style={styles.commentsContainer}>
                        {item.comments.map((comment, index) => (
                            <View key={index} style={styles.commentItem}>
                                <Text style={styles.commentUserName}>{comment.userName}</Text>
                                <Text style={styles.commentContent}>{comment.content}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {showCommentInput === item.id && (
                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Add a comment..."
                            placeholderTextColor={Colors.dark.textSecondary}
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline
                        />
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={() => handleAddComment(item.id)}
                        >
                            <Send size={18} color={Colors.dark.primary} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderAlertTypeSelector = () => {
        if (!showTagSelector) return null;

        const alertTypes = [
            { id: 'riptide', label: 'Riptide' },
            { id: 'jellyfish', label: 'Jellyfish' },
            { id: 'pollution', label: 'Pollution' },
            { id: 'crowded', label: 'Crowded' },
            { id: 'other', label: 'Other Hazard' },
        ];

        return (
            <Modal
                visible={showTagSelector}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTagSelector(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Alert Type</Text>
                            <TouchableOpacity
                                onPress={() => setShowTagSelector(false)}
                            >
                                <X size={20} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {alertTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={styles.alertTypeOption}
                                onPress={() => handleSelectAlertType(type.id)}
                            >
                                <AlertTriangle
                                    size={18}
                                    color={Colors.dark.warning}
                                />
                                <Text style={styles.alertTypeText}>{type.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        );
    };

    const renderTagSelector = () => {
        const popularTags = [
            'beach', 'swimming', 'surfing', 'sunset', 'crowded',
            'quiet', 'clean', 'family', 'waves', 'weather'
        ];

        return (
            <View style={styles.tagSelectorContainer}>
                <Text style={styles.tagSelectorTitle}>Add Tags</Text>
                <View style={styles.tagOptions}>
                    {popularTags.map((tag) => (
                        <TouchableOpacity
                            key={tag}
                            style={[
                                styles.tagOption,
                                selectedTags.includes(tag) && styles.selectedTagOption
                            ]}
                            onPress={() => handleToggleTag(tag)}
                        >
                            <Text
                                style={[
                                    styles.tagOptionText,
                                    selectedTags.includes(tag) && styles.selectedTagOptionText
                                ]}
                            >
                                #{tag}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {selectedBeach?.name || 'Beach'} Community
                </Text>
            </View>

            <View style={styles.newPostContainer}>
                <View style={styles.inputContainer}>
                    <Image
                        source={{ uri: currentUser.avatar }}
                        style={styles.userAvatar}
                    />
                    <TextInput
                        style={styles.postInput}
                        placeholder="Share your beach experience..."
                        placeholderTextColor={Colors.dark.textSecondary}
                        value={newPostContent}
                        onChangeText={setNewPostContent}
                        multiline
                    />
                </View>

                {newPostImage && (
                    <View style={styles.imagePreviewContainer}>
                        <Image
                            source={{ uri: newPostImage }}
                            style={styles.imagePreview}
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => setNewPostImage(null)}
                        >
                            <X size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                {selectedTags.length > 0 && (
                    <View style={styles.selectedTagsContainer}>
                        {selectedTags.map((tag, index) => (
                            <View key={index} style={styles.selectedTag}>
                                <Text style={styles.selectedTagText}>#{tag}</Text>
                                <TouchableOpacity
                                    onPress={() => handleToggleTag(tag)}
                                >
                                    <X size={12} color={Colors.dark.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.postActions}>
                    <View style={styles.postOptions}>
                        <TouchableOpacity
                            style={styles.postOption}
                            onPress={handlePickImage}
                        >
                            <ImageIcon size={20} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.postOption,
                                isAlert && styles.activePostOption
                            ]}
                            onPress={handleToggleAlert}
                        >
                            <AlertTriangle
                                size={20}
                                color={isAlert ? Colors.dark.warning : Colors.dark.textSecondary}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.postOption}
                            onPress={() => setShowTagSelector(true)}
                        >
                            <Tag size={20} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.postButton,
                            (!newPostContent.trim() && !newPostImage) && styles.disabledPostButton
                        ]}
                        onPress={handleAddPost}
                        disabled={!newPostContent.trim() && !newPostImage}
                    >
                        <Text style={styles.postButtonText}>Post</Text>
                    </TouchableOpacity>
                </View>

                {showTagSelector && renderTagSelector()}
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} />
                    <Text style={styles.loadingText}>Loading community posts...</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={beachPosts}
                    renderItem={renderPost}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.postsList}
                    showsVerticalScrollIndicator={true}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MessageCircle size={40} color={Colors.dark.textSecondary} />
                            <Text style={styles.emptyText}>No posts yet</Text>
                            <Text style={styles.emptySubtext}>Be the first to share your experience!</Text>
                        </View>
                    }
                />
            )}

            {renderAlertTypeSelector()}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
    },
    newPostContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        backgroundColor: Colors.dark.surface,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    postInput: {
        flex: 1,
        minHeight: 80,
        color: Colors.dark.textPrimary,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    imagePreviewContainer: {
        marginTop: 12,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 8,
    },
    selectedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 128, 128, 0.1)',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 4,
    },
    selectedTagText: {
        fontSize: 12,
        color: Colors.dark.primary,
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    postOptions: {
        flexDirection: 'row',
        gap: 16,
    },
    postOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.dark.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activePostOption: {
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
    },
    postButton: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    disabledPostButton: {
        backgroundColor: Colors.dark.inactive,
    },
    postButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: Colors.dark.textSecondary,
    },
    postsList: {
        padding: 16,
        paddingBottom: 100,
    },
    postContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    alertPostContainer: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.dark.warning,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        marginBottom: 12,
        gap: 8,
    },
    alertText: {
        color: Colors.dark.warning,
        fontWeight: 'bold',
        fontSize: 12,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
    },
    postHeaderText: {
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
    },
    timestamp: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    reportButton: {
        padding: 4,
    },
    postContent: {
        fontSize: 16,
        color: Colors.dark.textPrimary,
        marginBottom: 12,
        lineHeight: 22,
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
        gap: 8,
    },
    tag: {
        backgroundColor: 'rgba(0, 128, 128, 0.1)',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    tagText: {
        fontSize: 12,
        color: Colors.dark.primary,
    },
    postActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
        gap: 4,
    },
    actionText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    commentsContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    commentItem: {
        marginBottom: 8,
    },
    commentUserName: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 2,
    },
    commentContent: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    commentInput: {
        flex: 1,
        backgroundColor: Colors.dark.surface,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: Colors.dark.textPrimary,
        fontSize: 14,
        marginRight: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 128, 128, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.textSecondary,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
    },
    alertTypeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        gap: 12,
    },
    alertTypeText: {
        fontSize: 16,
        color: Colors.dark.textPrimary,
    },
    tagSelectorContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
    },
    tagSelectorTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    tagOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagOption: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    selectedTagOption: {
        backgroundColor: 'rgba(0, 128, 128, 0.2)',
    },
    tagOptionText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    selectedTagOptionText: {
        color: Colors.dark.primary,
    },
});