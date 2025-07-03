import { useBeachStore } from '@/store/beachStore';
import { useChatStore } from '@/store/chatStore';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import {
    Bot,
    Mic,
    Send,
    Shield,
    Sparkles,
    Sun,
    Trash2,
    X,
    Zap
} from 'lucide-react-native';
import React, { memo, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

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

// Sample optimized ChatMessage component
const ChatMessage = memo(({ message, onSpeakMessage }) => {
    return (
        <View style={[
            styles.messageContainer,
            message.role === 'user' ? styles.userMessage : styles.botMessage
        ]}>
            <Text style={styles.messageText}>{message.content}</Text>
            {message.role === 'bot' && (
                <TouchableOpacity
                    style={styles.speakButton}
                    onPress={() => onSpeakMessage(message.content)}
                >
                    <Bot size={16} color={Theme.primary} />
                </TouchableOpacity>
            )}
        </View>
    );
}, (prevProps, nextProps) => {
    // Only re-render if message content or role changes
    return prevProps.message.id === nextProps.message.id &&
        prevProps.message.content === nextProps.message.content &&
        prevProps.message.role === nextProps.message.role;
});

export default function ChatScreen() {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [recordingAnimation] = useState(new Animated.Value(0));
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

    const { messages, sendMessage, clearChat, isLoading } = useChatStore();
    const { beaches } = useBeachStore();

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setIsKeyboardVisible(true);
                scrollToBottom();
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setIsKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(recordingAnimation, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(recordingAnimation, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            recordingAnimation.setValue(0);
        }
    }, [isRecording]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: true });
            }
        }, 100);
    };

    const handleSend = async () => {
        if (message.trim() === '') return;

        const trimmedMessage = message.trim();
        setMessage('');

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        await sendMessage(trimmedMessage);
        scrollToBottom();
    };

    const handleClearChat = () => {
        if (messages.length === 0) return;

        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        clearChat();
    };

    const handleStartRecording = async () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        setIsRecording(true);

        setTimeout(() => {
            setIsRecording(false);

            const randomBeach = beaches[Math.floor(Math.random() * beaches.length)];
            const queries = [
                `Is ${randomBeach?.name || 'Calangute Beach'} safe for swimming today?`,
                `What's the weather like at ${randomBeach?.name || 'Baga Beach'}?`,
                `How are the waves at ${randomBeach?.name || 'Anjuna Beach'}?`,
                'What should I do if I see a rip current?',
                'Beach safety tips for children'
            ];

            setMessage(queries[Math.floor(Math.random() * queries.length)]);

            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 2000);
    };

    const handleStopRecording = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        setIsRecording(false);
    };

    const handleSpeakMessage = (text: string) => {
        if (Platform.OS === 'web') return;

        Speech.speak(text, {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
        });
    };

    const renderSuggestions = () => {
        const suggestions = [
            { text: "Is Calangute Beach safe today?", icon: Shield, color: Theme.success },
            { text: "Best beaches for families in Goa?", icon: Sun, color: Theme.warning },
            { text: "What should I do during a rip current?", icon: Zap, color: Theme.danger },
            { text: "Beach safety tips for children", icon: Shield, color: Theme.primary },
            { text: "Weather forecast for Kovalam Beach", icon: Sun, color: Theme.accent }
        ];

        return (
            <View style={styles.suggestionsContainer}>
                <View style={styles.suggestionsHeader}>
                    <Sparkles size={16} color={Theme.primary} />
                    <Text style={styles.suggestionsTitle}>Quick Questions</Text>
                </View>
                <View style={styles.suggestionGrid}>
                    {suggestions.map((suggestion, index) => {
                        const Icon = suggestion.icon;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestionCard}
                                onPress={() => {
                                    setMessage(suggestion.text);
                                    if (inputRef.current) {
                                        inputRef.current.focus();
                                    }
                                    if (Platform.OS !== 'web') {
                                        Haptics.selectionAsync();
                                    }
                                }}
                            >
                                <View style={[styles.suggestionIcon, { backgroundColor: `${suggestion.color}20` }]}>
                                    <Icon size={16} color={suggestion.color} />
                                </View>
                                <Text style={styles.suggestionText} numberOfLines={2}>
                                    {suggestion.text}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderEmptyState = () => {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                    <Bot size={48} color={Theme.primary} />
                </View>
                <Text style={styles.emptyTitle}>Meet ShoreBot</Text>
                <Text style={styles.emptySubtitle}>
                    Your AI-powered beach safety assistant. Ask me anything about beach conditions, safety tips, or weather forecasts!
                </Text>
                <View style={styles.emptyFeatures}>
                    <View style={styles.emptyFeature}>
                        <Shield size={16} color={Theme.success} />
                        <Text style={styles.emptyFeatureText}>Real-time safety alerts</Text>
                    </View>
                    <View style={styles.emptyFeature}>
                        <Sun size={16} color={Theme.warning} />
                        <Text style={styles.emptyFeatureText}>Weather forecasts</Text>
                    </View>
                    <View style={styles.emptyFeature}>
                        <Zap size={16} color={Theme.accent} />
                        <Text style={styles.emptyFeatureText}>Emergency guidance</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <StatusBar barStyle="light-content" backgroundColor={Theme.background} />

            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.botAvatar}>
                        <Bot size={24} color={Theme.primary} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>ShoreBot</Text>
                        <Text style={styles.headerSubtitle}>
                            {isLoading ? 'Thinking...' : 'Online • Beach Safety AI'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[
                        styles.clearButton,
                        messages.length === 0 && styles.clearButtonDisabled
                    ]}
                    onPress={handleClearChat}
                    disabled={messages.length === 0}
                >
                    <Trash2 size={16} color={messages.length > 0 ? Theme.textSecondary : Theme.textTertiary} />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ChatMessage
                        message={item}
                        onSpeakMessage={handleSpeakMessage}
                    />
                )}
                contentContainerStyle={[
                    styles.messagesContainer,
                    messages.length === 0 && styles.emptyMessagesContainer
                ]}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                ListEmptyComponent={renderEmptyState()}
                ListFooterComponent={
                    isLoading ? (
                        <View style={styles.loadingContainer}>
                            <View style={styles.loadingBubble}>
                                <ActivityIndicator color={Theme.primary} size="small" />
                                <Text style={styles.loadingText}>ShoreBot is thinking...</Text>
                            </View>
                        </View>
                    ) : null
                }
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
            />

            {messages.length <= 1 && !isKeyboardVisible && renderSuggestions()}

            <View style={styles.inputSection}>
                {isRecording && (
                    <Animated.View
                        style={[
                            styles.recordingIndicator,
                            {
                                opacity: recordingAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.5, 1],
                                }),
                            }
                        ]}
                    >
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>Listening...</Text>
                        <Text style={styles.recordingSubtext}>Speak now</Text>
                    </Animated.View>
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Ask ShoreBot about beach safety..."
                        placeholderTextColor={Theme.textSecondary}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        maxLength={500}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />
                    <View style={styles.inputActions}>
                        {message.trim() !== '' ? (
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSend}
                                disabled={isLoading}
                            >
                                <Send size={18} color="white" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.micButton,
                                    isRecording && styles.recordingButton
                                ]}
                                onPress={isRecording ? handleStopRecording : handleStartRecording}
                                disabled={isLoading}
                            >
                                {isRecording ? (
                                    <X size={18} color="white" />
                                ) : (
                                    <Mic size={18} color="white" />
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <Text style={styles.inputHint}>
                    {message.length}/500 • Powered by AI
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: Theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: Theme.border,
        zIndex: 1000,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    botAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Theme.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: Theme.textSecondary,
        marginTop: 2,
    },
    clearButton: {
        padding: 8,
        borderRadius: 8,
    },
    clearButtonDisabled: {
        opacity: 0.5,
    },
    messagesContainer: {
        paddingVertical: 16,
        flexGrow: 1,
    },
    emptyMessagesContainer: {
        justifyContent: 'center',
    },
    messageContainer: {
        marginVertical: 8,
        marginHorizontal: 24,
        padding: 16,
        borderRadius: 20,
        maxWidth: '80%',
    },
    userMessage: {
        backgroundColor: Theme.primary,
        alignSelf: 'flex-end',
    },
    botMessage: {
        backgroundColor: Theme.surfaceLight,
        alignSelf: 'flex-start',
    },
    messageText: {
        color: Theme.text,
        fontSize: 16,
    },
    speakButton: {
        marginTop: 8,
        padding: 8,
        alignSelf: 'flex-start',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 40,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 16,
        color: Theme.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    emptyFeatures: {
        width: '100%',
    },
    emptyFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    emptyFeatureText: {
        fontSize: 14,
        color: Theme.textSecondary,
    },
    loadingContainer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        alignSelf: 'flex-start',
        gap: 12,
    },
    loadingText: {
        color: Theme.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    suggestionsContainer: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: Theme.surface,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Theme.border,
        zIndex: 500,
    },
    suggestionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    suggestionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.text,
    },
    suggestionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    suggestionCard: {
        backgroundColor: Theme.surfaceLight,
        borderRadius: 16,
        padding: 16,
        width: (width - 72) / 2,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    suggestionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    suggestionText: {
        color: Theme.text,
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
    },
    inputSection: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: Theme.surface,
        borderTopWidth: 1,
        borderColor: Theme.border,
        zIndex: 500,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 71, 87, 0.1)',
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Theme.danger,
    },
    recordingText: {
        color: Theme.danger,
        fontWeight: '700',
        fontSize: 14,
    },
    recordingSubtext: {
        color: Theme.danger,
        fontSize: 12,
        opacity: 0.7,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: Theme.surfaceLight,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 12,
    },
    input: {
        flex: 1,
        color: Theme.text,
        fontSize: 16,
        maxHeight: 100,
        paddingVertical: 8,
    },
    inputActions: {
        flexDirection: 'row',
        gap: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Theme.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    micButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Theme.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingButton: {
        backgroundColor: Theme.danger,
    },
    inputHint: {
        fontSize: 12,
        color: Theme.textTertiary,
        textAlign: 'center',
        marginTop: 8,
    },
});