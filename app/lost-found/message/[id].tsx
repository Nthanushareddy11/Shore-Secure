import Colors from '@/constants/colors';
import { useLostItemStore } from '@/store/lostItemStore';
import { useUserStore } from '@/store/userStore';
import { LostItemMessage } from '@/types';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Info, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function MessageScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const {
        lostItems,
        messages,
        selectItem,
        selectedItem,
        sendMessage
    } = useLostItemStore();

    const { user, isAuthenticated } = useUserStore();

    useEffect(() => {
        if (id) {
            selectItem(id);
        }

        return () => {
            selectItem(null);
        };
    }, [id]);

    const conversationMessages = selectedItem ? messages[selectedItem.id] || [] : [];

    const handleSend = async () => {
        if (!selectedItem || !user || !message.trim()) return;

        setIsLoading(true);

        try {
            // Determine the recipient
            const receiverId = selectedItem.userId === user.id
                ? conversationMessages.length > 0
                    ? conversationMessages[0].senderId
                    : '' // No recipient yet
                : selectedItem.userId;

            if (!receiverId) {
                setIsLoading(false);
                return;
            }

            await sendMessage(selectedItem.id, receiverId, message.trim());
            setMessage('');

            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: LostItemMessage }) => {
        const isUserMessage = item.senderId === user?.id;

        return (
            <View style={[
                styles.messageContainer,
                isUserMessage ? styles.userMessageContainer : styles.otherMessageContainer
            ]}>
                <View style={[
                    styles.messageBubble,
                    isUserMessage ? styles.userMessageBubble : styles.otherMessageBubble
                ]}>
                    <Text style={styles.messageText}>{item.content}</Text>
                    <Text style={styles.messageTime}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (!selectedItem) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading conversation...</Text>
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.authContainer}>
                <Info size={40} color={Colors.dark.textSecondary} />
                <Text style={styles.authTitle}>Sign In Required</Text>
                <Text style={styles.authText}>
                    Please sign in to message the user about this item.
                </Text>
                <TouchableOpacity
                    style={styles.authButton}
                    onPress={() => router.push('/profile')}
                >
                    <Text style={styles.authButtonText}>Go to Profile</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {selectedItem.status === 'lost' ? 'Lost Item' : 'Found Item'}: {selectedItem.title}
                </Text>
            </View>

            {conversationMessages.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Info size={40} color={Colors.dark.textSecondary} />
                    <Text style={styles.emptyTitle}>No Messages Yet</Text>
                    <Text style={styles.emptyText}>
                        Start a conversation about this {selectedItem.status} item.
                    </Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={conversationMessages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesContainer}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!message.trim() || isLoading) && styles.sendButtonDisabled
                    ]}
                    onPress={handleSend}
                    disabled={!message.trim() || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Send size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: Colors.dark.textSecondary,
        fontSize: 16,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
    },
    messagesContainer: {
        padding: 16,
        flexGrow: 1,
    },
    messageContainer: {
        marginBottom: 16,
    },
    userMessageContainer: {
        alignItems: 'flex-end',
    },
    otherMessageContainer: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    userMessageBubble: {
        backgroundColor: Colors.dark.primary,
        borderBottomRightRadius: 4,
    },
    otherMessageBubble: {
        backgroundColor: Colors.dark.card,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        color: '#fff',
        fontSize: 16,
        lineHeight: 22,
    },
    messageTime: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
        backgroundColor: Colors.dark.surface,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.dark.card,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: Colors.dark.textPrimary,
        maxHeight: 100,
        fontSize: 16,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.dark.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: Colors.dark.inactive,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    authTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    authText: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    authButton: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    authButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});