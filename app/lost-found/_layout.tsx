import Colors from '@/constants/colors';
import { Stack } from 'expo-router';

export default function LostFoundLayout() {
    return (
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
            <Stack.Screen
                name="index"
                options={{
                    title: 'Lost & Found',
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="report"
                options={{
                    title: 'Report Item',
                    headerShown: true,
                    presentation: 'modal',
                }}
            />
            <Stack.Screen
                name="item/[id]"
                options={{
                    title: 'Item Details',
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="message/[id]"
                options={{
                    title: 'Messages',
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="my-items"
                options={{
                    title: 'My Items',
                    headerShown: true,
                }}
            />
        </Stack>
    );
}