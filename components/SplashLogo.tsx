import Colors from '@/constants/colors';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface SplashLogoProps {
    size?: 'small' | 'medium' | 'large';
}

export default function SplashLogo({ size = 'medium' }: SplashLogoProps) {
    const logoSize = size === 'small' ? 60 : size === 'medium' ? 100 : 150;
    const textSize = size === 'small' ? 20 : size === 'medium' ? 28 : 36;

    // Animation values
    const logoOpacity = useSharedValue(0);
    const logoScale = useSharedValue(0.3);
    const logoRotate = useSharedValue(-180);

    const tealTextOpacity = useSharedValue(0);
    const tealTextTranslateY = useSharedValue(30);

    const whiteTextOpacity = useSharedValue(0);
    const whiteTextTranslateY = useSharedValue(30);

    const containerScale = useSharedValue(0.9);

    useEffect(() => {
        // Container entrance
        containerScale.value = withSpring(1, {
            damping: 15,
            stiffness: 150,
        });

        // Logo animation - dramatic entrance with rotation and scale
        logoOpacity.value = withDelay(200, withTiming(1, {
            duration: 800,
            easing: Easing.out(Easing.cubic)
        }));

        logoScale.value = withDelay(200, withSequence(
            withSpring(1.1, { damping: 8, stiffness: 100 }),
            withSpring(1, { damping: 12, stiffness: 150 })
        ));

        logoRotate.value = withDelay(200, withSpring(0, {
            damping: 15,
            stiffness: 80,
        }));

        // Text animations - staggered with elegant slide up
        tealTextOpacity.value = withDelay(600, withTiming(1, {
            duration: 600,
            easing: Easing.out(Easing.quad)
        }));

        tealTextTranslateY.value = withDelay(600, withSpring(0, {
            damping: 20,
            stiffness: 150,
        }));

        whiteTextOpacity.value = withDelay(800, withTiming(1, {
            duration: 600,
            easing: Easing.out(Easing.quad)
        }));

        whiteTextTranslateY.value = withDelay(800, withSpring(0, {
            damping: 20,
            stiffness: 150,
        }));
    }, []);

    // Animated styles
    const containerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: containerScale.value }]
    }));

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [
            { scale: logoScale.value },
            { rotate: `${logoRotate.value}deg` }
        ]
    }));

    const tealTextAnimatedStyle = useAnimatedStyle(() => ({
        opacity: tealTextOpacity.value,
        transform: [{ translateY: tealTextTranslateY.value }]
    }));

    const whiteTextAnimatedStyle = useAnimatedStyle(() => ({
        opacity: whiteTextOpacity.value,
        transform: [{ translateY: whiteTextTranslateY.value }]
    }));

    return (
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
            <Animated.View style={logoAnimatedStyle}>
                <Image
                    source={require('@/assets/images/logo.png')}
                    style={[styles.logo, { width: logoSize, height: logoSize }]}
                    resizeMode="contain"
                />
            </Animated.View>

            <View style={styles.textContainer}>
                <Animated.View style={tealTextAnimatedStyle}>
                    <Text style={[styles.titleTeal, { fontSize: textSize }]}>Shore</Text>
                </Animated.View>

                <Animated.View style={whiteTextAnimatedStyle}>
                    <Text style={[styles.titleWhite, { fontSize: textSize }]}>Secure</Text>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        marginBottom: 16,
    },
    textContainer: {
        alignItems: 'center',
    },
    titleTeal: {
        fontWeight: 'bold',
        color: Colors.dark.primary,
        letterSpacing: 1,
    },
    titleWhite: {
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 1,
    },
});