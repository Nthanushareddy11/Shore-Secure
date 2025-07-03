import Colors from '@/constants/colors';
import { WeatherData } from '@/types';
import { Droplets, Eye, Sun, Thermometer, Wind } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

interface WeatherInfoCardProps {
    weatherData: WeatherData;
}

export default function WeatherInfoCard({ weatherData }: WeatherInfoCardProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Current Conditions</Text>

            <View style={styles.grid}>
                <View style={styles.gridItem}>
                    <Thermometer size={20} color={Colors.dark.accent} />
                    <View>
                        <Text style={styles.label}>Air Temp</Text>
                        <Text style={styles.value}>{weatherData.temperature.toFixed(1)}°C</Text>
                    </View>
                </View>

                <View style={styles.gridItem}>
                    <Thermometer size={20} color={Colors.dark.primary} />
                    <View>
                        <Text style={styles.label}>Water Temp</Text>
                        <Text style={styles.value}>{weatherData.waterTemperature.toFixed(1)}°C</Text>
                    </View>
                </View>

                <View style={styles.gridItem}>
                    <Wind size={20} color={Colors.dark.accent} />
                    <View>
                        <Text style={styles.label}>Wind</Text>
                        <Text style={styles.value}>{weatherData.windSpeed.toFixed(1)} km/h {weatherData.windDirection}</Text>
                    </View>
                </View>

                <View style={styles.gridItem}>
                    <Droplets size={20} color={Colors.dark.accent} />
                    <View>
                        <Text style={styles.label}>Wave Height</Text>
                        <Text style={styles.value}>{weatherData.waveHeight.toFixed(1)} m</Text>
                    </View>
                </View>

                <View style={styles.gridItem}>
                    <Sun size={20} color={Colors.dark.warning} />
                    <View>
                        <Text style={styles.label}>UV Index</Text>
                        <Text style={styles.value}>{weatherData.uvIndex}</Text>
                    </View>
                </View>

                <View style={styles.gridItem}>
                    <Eye size={20} color={Colors.dark.accent} />
                    <View>
                        <Text style={styles.label}>Visibility</Text>
                        <Text style={styles.value}>{weatherData.visibility}</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.updateTime}>
                Updated: {new Date(weatherData.timestamp).toLocaleTimeString()}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.dark.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    label: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 2,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
    },
    updateTime: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        textAlign: 'right',
        marginTop: 8,
    },
});