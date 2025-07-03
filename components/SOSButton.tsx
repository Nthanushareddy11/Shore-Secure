import Colors from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, PhoneCall } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export default function SOSButton() {
    const [isPressed, setIsPressed] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const user = useUserStore(state => state.user);

    const handlePressIn = () => {
        setIsPressed(true);

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        // Start countdown
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    triggerSOS();
                    return 3; // Reset for next time
                }
                return prev - 1;
            });
        }, 1000);

        // Clear timer if button is released
        return () => clearInterval(timer);
    };

    const handlePressOut = () => {
        setIsPressed(false);
        setCountdown(3); // Reset countdown
    };

    const triggerSOS = () => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // In a real app, this would send SMS, make calls, etc.
        Alert.alert(
            "Emergency SOS Activated",
            `Emergency contacts will be notified with your current location. ${user?.emergencyContacts.length ? '' : 'No emergency contacts found. Please add contacts in your profile.'}`,
            [
                {
                    text: "Call Emergency Services",
                    onPress: () => console.log("Would call emergency services")
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.button,
                    isPressed && styles.buttonPressed
                ]}
            >
                {isPressed ? (
                    <View style={styles.countdownContainer}>
                        <Text style={styles.countdownText}>{countdown}</Text>
                    </View>
                ) : (
                    <>
                        <AlertTriangle size={24} color="#fff" />
                        <Text style={styles.text}>SOS</Text>
                    </>
                )}
            </Pressable>
            <View style={styles.callContainer}>
                <Pressable
                    style={styles.callButton}
                    onPress={() => Alert.alert(
                        "Emergency Numbers",
                        "Coast Guard: 1554\nPolice: 100\nAmbulance: 108\nTourist Helpline: 1363",
                        [{ text: "OK" }]
                    )}
                >
                    <PhoneCall size={20} color="#fff" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        alignItems: 'center',
    },
    button: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.dark.danger,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    buttonPressed: {
        backgroundColor: '#b71c1c', // Darker red when pressed
        transform: [{ scale: 1.1 }],
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        marginTop: 2,
    },
    countdownContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countdownText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    callContainer: {
        marginTop: 12,
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.dark.accent,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
});