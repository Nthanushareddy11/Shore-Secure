import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import {
    Bot,
    Calendar,
    Compass,
    Home,
    UserCircle,
    Users
} from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#3B82F6',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 20,
                    left: 30,
                    right: 30,
                    height: 70,
                    borderRadius: 180,
                    backgroundColor: Platform.OS === 'ios' 
                        ? 'rgba(0,0,0,0.6)' 
                        : 'rgba(15,23,42,0.75)',
                    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
                    paddingTop: 10,
                    paddingHorizontal: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.15,
                    shadowRadius: 20,
                    elevation: 20,
                    borderWidth: 0,
                    borderColor: 'rgba(47, 129, 113, 0.05)',
                    overflow: 'hidden',
                },
                tabBarBackground: () =>
                    Platform.OS === 'ios' ? (
                        <BlurView
                            intensity={80}
                            tint="dark"
                            style={StyleSheet.absoluteFill}
                        />
                    ) : null,
                tabBarItemStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                },
            })}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                            <Home size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
                            {focused && <View style={styles.activeIndicator} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                            <Compass size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
                            {focused && <View style={styles.activeIndicator} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="community"
                options={{
                    title: 'Community',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                            <Users size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
                            {focused && <View style={styles.activeIndicator} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="plan"
                options={{
                    title: 'Plan',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                            <Calendar size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
                            {focused && <View style={styles.activeIndicator} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'ShoreBot',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                            <Bot size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
                            {focused && <View style={styles.activeIndicator} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                            <UserCircle size={22} color={color} strokeWidth={focused ? 2 : 1.5} />
                            {focused && <View style={styles.activeIndicator} />}
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 42,
        height: 42,
        borderRadius: 21,
    },
    activeIconContainer: {
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
    }
});
