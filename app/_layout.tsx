import SplashLogo from "@/components/SplashLogo";
import Colors from "@/constants/colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export const unstable_settings = {
    initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        ...FontAwesome.font,
    });

    const [appIsReady, setAppIsReady] = useState(false);

    useEffect(() => {
        if (error) {
            console.error(error);
            throw error;
        }
    }, [error]);

    useEffect(() => {
        async function prepare() {
            try {
                // Wait for fonts to load
                if (loaded) {
                    // Additional app preparation can go here
                    // (API calls, cache warming, etc.)

                    // Wait for splash animation to complete
                    // The animation takes about 1.4s (200ms + 600ms + 600ms delays)
                    // Plus some extra time for the user to see the final state
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            } catch (e) {
                console.warn(e);
            } finally {
                if (loaded) {
                    setAppIsReady(true);
                    await SplashScreen.hideAsync();
                }
            }
        }

        prepare();
    }, [loaded]);

    const onLayoutRootView = useCallback(async () => {
        if (appIsReady) {
            // Layout is ready, splash screen has been hidden
        }
    }, [appIsReady]);

    // Show loading state while fonts are loading
    if (!loaded) {
        return null;
    }

    // Show splash screen while app is preparing
    if (!appIsReady) {
        return (
            <View style={styles.splashContainer}>
                <StatusBar style="light" backgroundColor={Colors.dark.background} />
                <SplashLogo size="large" />
            </View>
        );
    }

    // Show main app once everything is ready
    return (
        <View style={styles.container} onLayout={onLayoutRootView}>
            <RootLayoutNav />
        </View>
    );
}

function RootLayoutNav() {
    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Colors.dark.background,
                    },
                    headerTintColor: Colors.dark.textPrimary,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    contentStyle: {
                        backgroundColor: Colors.dark.background,
                    },
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="beach/[id]"
                    options={{
                        headerShown: false,
                        presentation: 'card',
                    }}
                />
                <Stack.Screen
                    name="community/[beachId]"
                    options={{
                        title: "Beach Community",
                        presentation: 'card',
                    }}
                />
            </Stack>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    splashContainer: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
});