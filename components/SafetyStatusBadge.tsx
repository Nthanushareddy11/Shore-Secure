import Colors from '@/constants/colors';
import { SafetyStatus } from '@/types';
import { StyleSheet, Text, View } from 'react-native';

interface SafetyStatusBadgeProps {
    status: SafetyStatus;
    size?: 'small' | 'medium' | 'large';
    showText?: boolean;
}

export default function SafetyStatusBadge({
    status,
    size = 'medium',
    showText = true
}: SafetyStatusBadgeProps) {
    const getStatusColor = () => {
        switch (status) {
            case 'safe':
                return Colors.dark.success;
            case 'moderate':
                return Colors.dark.warning;
            case 'dangerous':
                return Colors.dark.danger;
            default:
                return Colors.dark.inactive;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'safe':
                return 'Safe';
            case 'moderate':
                return 'Moderate Risk';
            case 'dangerous':
                return 'Dangerous';
            default:
                return 'Unknown';
        }
    };

    const getDotSize = () => {
        switch (size) {
            case 'small':
                return 8;
            case 'large':
                return 16;
            case 'medium':
            default:
                return 12;
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'small':
                return 12;
            case 'large':
                return 16;
            case 'medium':
            default:
                return 14;
        }
    };

    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.dot,
                    {
                        backgroundColor: getStatusColor(),
                        width: getDotSize(),
                        height: getDotSize(),
                        borderRadius: getDotSize() / 2,
                    }
                ]}
            />
            {showText && (
                <Text
                    style={[
                        styles.text,
                        {
                            color: getStatusColor(),
                            fontSize: getFontSize(),
                        }
                    ]}
                >
                    {getStatusText()}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    text: {
        fontWeight: '600',
    },
});