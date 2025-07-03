import Colors from '@/constants/colors';
import { ChatMessage as ChatMessageType } from '@/types';
import { Volume2 } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChatMessageProps {
    message: ChatMessageType;
    onSpeakMessage?: (text: string) => void;
}

export default function ChatMessage({ message, onSpeakMessage }: ChatMessageProps) {
    const isUser = message.role === 'user';

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleSpeakMessage = () => {
        if (onSpeakMessage) {
            onSpeakMessage(message.content);
        }
    };

    // Format message content with line breaks and emojis
    const formatContent = (content: string) => {
        // Split by line breaks
        const lines = content.split('\n');

        return lines.map((line, index) => (
            <Text key={index} style={isUser ? styles.userMessageText : styles.botMessageText}>
                {line}
            </Text>
        ));
    };

    return (
        <View style={[
            styles.container,
            isUser ? styles.userContainer : styles.botContainer
        ]}>
            <View style={[
                styles.bubble,
                isUser ? styles.userBubble : styles.botBubble
            ]}>
                {formatContent(message.content)}

                <View style={styles.messageFooter}>
                    <Text style={styles.timestamp}>
                        {formatTimestamp(message.timestamp)}
                    </Text>

                    {!isUser && onSpeakMessage && (
                        <TouchableOpacity
                            style={styles.speakButton}
                            onPress={handleSpeakMessage}
                        >
                            <Volume2 size={14} color={Colors.dark.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        paddingHorizontal: 16,
    },
    userContainer: {
        alignItems: 'flex-end',
    },
    botContainer: {
        alignItems: 'flex-start',
    },
    bubble: {
        maxWidth: '80%',
        borderRadius: 16,
        padding: 12,
        paddingBottom: 8,
    },
    userBubble: {
        backgroundColor: Colors.dark.primary,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: Colors.dark.card,
        borderBottomLeftRadius: 4,
    },
    userMessageText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 4,
    },
    botMessageText: {
        color: Colors.dark.textPrimary,
        fontSize: 16,
        marginBottom: 4,
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    timestamp: {
        fontSize: 10,
        color: Colors.dark.textSecondary,
        opacity: 0.7,
    },
    speakButton: {
        padding: 4,
    },
});