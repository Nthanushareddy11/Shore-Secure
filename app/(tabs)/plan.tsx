import { useBeachStore } from '@/store/beachStore';
import { useUserStore } from '@/store/userStore';
import { Beach, Trip } from '@/types';
import * as Haptics from 'expo-haptics';
import {
    Calendar,
    Check,
    ChevronDown,
    Edit3,
    MapPin,
    Plus,
    Star,
    Trash2,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    ScrollView,
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

export default function PlanScreen() {
    const [isAddingTrip, setIsAddingTrip] = useState(false);
    const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
    const [showBeachDropdown, setShowBeachDropdown] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activities, setActivities] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [editingTrip, setEditingTrip] = useState<string | null>(null);

    const { user, isAuthenticated, addTrip, removeTrip, updateTrip } = useUserStore();
    const { beaches, fetchBeaches } = useBeachStore();

    React.useEffect(() => {
        fetchBeaches();
    }, []);

    const handleAddTrip = () => {
        if (!selectedBeach) {
            Alert.alert('Error', 'Please select a beach');
            return;
        }

        if (!startDate || !endDate) {
            Alert.alert('Error', 'Please select start and end dates');
            return;
        }

        // Validate date format and logic
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            Alert.alert('Error', 'Please enter valid dates (YYYY-MM-DD)');
            return;
        }

        if (start >= end) {
            Alert.alert('Error', 'End date must be after start date');
            return;
        }

        const newTrip: Omit<Trip, 'id'> = {
            beachId: selectedBeach.id,
            startDate,
            endDate,
            activities,
            notes,
        };

        addTrip(newTrip);
        resetForm();

        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const resetForm = () => {
        setSelectedBeach(null);
        setStartDate('');
        setEndDate('');
        setActivities([]);
        setNotes('');
        setIsAddingTrip(false);
        setEditingTrip(null);
    };

    const handleRemoveTrip = (tripId: string) => {
        Alert.alert(
            'Remove Trip',
            'Are you sure you want to remove this trip?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    onPress: () => {
                        removeTrip(tripId);
                        if (Platform.OS !== 'web') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const handleEditTrip = (trip: Trip) => {
        const beach = getBeachById(trip.beachId);
        setSelectedBeach(beach || null);
        setStartDate(trip.startDate);
        setEndDate(trip.endDate);
        setActivities(trip.activities);
        setNotes(trip.notes || '');
        setEditingTrip(trip.id);
        setIsAddingTrip(true);
    };

    const handleUpdateTrip = () => {
        if (!editingTrip || !selectedBeach) return;

        const updatedTrip: Trip = {
            id: editingTrip,
            beachId: selectedBeach.id,
            startDate,
            endDate,
            activities,
            notes,
        };

        updateTrip(updatedTrip);
        resetForm();

        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const toggleActivity = (activity: string) => {
        if (activities.includes(activity)) {
            setActivities(activities.filter(a => a !== activity));
        } else {
            setActivities([...activities, activity]);
        }
    };

    const getBeachById = (id: string): Beach | undefined => {
        return beaches.find(beach => beach.id === id);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDaysBetween = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const renderAddTripForm = () => {
        const allActivities = [
            { name: 'Swimming', icon: '🏊‍♂️' },
            { name: 'Sunbathing', icon: '☀️' },
            { name: 'Surfing', icon: '🏄‍♂️' },
            { name: 'Snorkeling', icon: '🤿' },
            { name: 'Photography', icon: '📸' },
            { name: 'Walking', icon: '🚶‍♂️' },
            { name: 'Family Activities', icon: '👨‍👩‍👧‍👦' },
            { name: 'Water Sports', icon: '🚤' }
        ];

        return (
            <View style={styles.formContainer}>
                <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>
                        {editingTrip ? 'Edit Trip' : 'Plan New Trip'}
                    </Text>
                    <TouchableOpacity onPress={resetForm} style={styles.closeButton}>
                        <X size={20} color={Theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Beach Selection */}
                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Choose Beach</Text>
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => setShowBeachDropdown(!showBeachDropdown)}
                    >
                        <View style={styles.dropdownContent}>
                            {selectedBeach ? (
                                <>
                                    <MapPin size={16} color={Theme.primary} />
                                    <Text style={styles.dropdownText}>{selectedBeach.name}</Text>
                                </>
                            ) : (
                                <>
                                    <MapPin size={16} color={Theme.textSecondary} />
                                    <Text style={styles.dropdownPlaceholder}>Select a beach</Text>
                                </>
                            )}
                        </View>
                        <ChevronDown size={20} color={Theme.textSecondary} />
                    </TouchableOpacity>

                    {showBeachDropdown && (
                        <View style={styles.dropdownMenu}>
                            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                {beaches.map(beach => (
                                    <TouchableOpacity
                                        key={beach.id}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setSelectedBeach(beach);
                                            setShowBeachDropdown(false);
                                        }}
                                    >
                                        <View style={styles.beachOption}>
                                            <View>
                                                <Text style={styles.beachName}>{beach.name}</Text>
                                                <Text style={styles.beachLocation}>{beach.location}</Text>
                                            </View>
                                            <View style={styles.beachRating}>
                                                <Star size={12} color={Theme.warning} fill={Theme.warning} />
                                                <Text style={styles.ratingText}>4.5</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Date Selection */}
                <View style={styles.dateSection}>
                    <View style={styles.dateField}>
                        <Text style={styles.inputLabel}>Start Date</Text>
                        <View style={styles.dateInput}>
                            <Calendar size={16} color={Theme.primary} />
                            <TextInput
                                style={styles.dateTextInput}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={Theme.textSecondary}
                                value={startDate}
                                onChangeText={setStartDate}
                            />
                        </View>
                    </View>

                    <View style={styles.dateField}>
                        <Text style={styles.inputLabel}>End Date</Text>
                        <View style={styles.dateInput}>
                            <Calendar size={16} color={Theme.primary} />
                            <TextInput
                                style={styles.dateTextInput}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={Theme.textSecondary}
                                value={endDate}
                                onChangeText={setEndDate}
                            />
                        </View>
                    </View>
                </View>

                {/* Activities */}
                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Activities</Text>
                    <View style={styles.activitiesGrid}>
                        {allActivities.map(activity => (
                            <TouchableOpacity
                                key={activity.name}
                                style={[
                                    styles.activityCard,
                                    activities.includes(activity.name) && styles.activityCardSelected
                                ]}
                                onPress={() => toggleActivity(activity.name)}
                            >
                                <Text style={styles.activityIcon}>{activity.icon}</Text>
                                <Text
                                    style={[
                                        styles.activityText,
                                        activities.includes(activity.name) && styles.activityTextSelected
                                    ]}
                                >
                                    {activity.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Notes */}
                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Notes (Optional)</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="Add any notes about your trip..."
                        placeholderTextColor={Theme.textSecondary}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        maxLength={200}
                    />
                    <Text style={styles.characterCount}>{notes.length}/200</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.formActions}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={editingTrip ? handleUpdateTrip : handleAddTrip}
                    >
                        <Check size={16} color="white" />
                        <Text style={styles.saveButtonText}>
                            {editingTrip ? 'Update Trip' : 'Save Trip'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderTrips = () => {
        if (!user || !user.trips.length) {
            return (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Calendar size={48} color={Theme.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>No trips planned yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Start planning your beach adventures and get personalized safety recommendations
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={() => setIsAddingTrip(true)}
                    >
                        <Plus size={16} color="white" />
                        <Text style={styles.emptyButtonText}>Plan Your First Trip</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return user.trips.map(trip => {
            const beach = getBeachById(trip.beachId);
            const days = getDaysBetween(trip.startDate, trip.endDate);

            return (
                <View key={trip.id} style={styles.tripCard}>
                    <View style={styles.tripHeader}>
                        <View style={styles.tripTitleSection}>
                            <Text style={styles.tripBeachName}>{beach?.name || 'Unknown Beach'}</Text>
                            <Text style={styles.tripLocation}>{beach?.location || 'Unknown Location'}</Text>
                        </View>
                        <View style={styles.tripActions}>
                            <TouchableOpacity
                                onPress={() => handleEditTrip(trip)}
                                style={styles.editTripButton}
                            >
                                <Edit3 size={16} color={Theme.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleRemoveTrip(trip.id)}
                                style={styles.deleteTripButton}
                            >
                                <Trash2 size={16} color={Theme.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.tripDetails}>
                        <View style={styles.tripDates}>
                            <View style={styles.dateInfo}>
                                <Text style={styles.dateLabel}>From</Text>
                                <Text style={styles.dateValue}>{formatDate(trip.startDate)}</Text>
                            </View>
                            <View style={styles.dateSeparator}>
                                <View style={styles.dateLine} />
                                <Text style={styles.durationText}>{days} days</Text>
                                <View style={styles.dateLine} />
                            </View>
                            <View style={styles.dateInfo}>
                                <Text style={styles.dateLabel}>To</Text>
                                <Text style={styles.dateValue}>{formatDate(trip.endDate)}</Text>
                            </View>
                        </View>

                        {trip.activities.length > 0 && (
                            <View style={styles.tripActivities}>
                                <Text style={styles.activitiesLabel}>Planned Activities</Text>
                                <View style={styles.activitiesChips}>
                                    {trip.activities.map((activity, index) => (
                                        <View key={index} style={styles.activityChip}>
                                            <Text style={styles.activityChipText}>{activity}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {trip.notes && (
                            <View style={styles.tripNotes}>
                                <Text style={styles.notesLabel}>Notes</Text>
                                <Text style={styles.notesText}>{trip.notes}</Text>
                            </View>
                        )}
                    </View>
                </View>
            );
        });
    };

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={Theme.background} />
                <View style={styles.authPrompt}>
                    <View style={styles.authIcon}>
                        <Calendar size={48} color={Theme.primary} />
                    </View>
                    <Text style={styles.authPromptTitle}>Sign In Required</Text>
                    <Text style={styles.authPromptText}>
                        Sign in to plan and manage your beach trips with personalized recommendations
                    </Text>
                    <TouchableOpacity
                        style={styles.authButton}
                        onPress={() => Alert.alert('Sign In', 'Navigate to the Profile tab to sign in')}
                    >
                        <Text style={styles.authButtonText}>Go to Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Theme.background} />
            
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Enhanced Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.title}>Trip Planner</Text>
                        <Text style={styles.subtitle}>
                            Plan your beach adventures and get safety insights
                        </Text>
                    </View>
                    {!isAddingTrip && (
                        <TouchableOpacity
                            style={styles.addTripButton}
                            onPress={() => setIsAddingTrip(true)}
                        >
                            <Plus size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                {isAddingTrip ? (
                    renderAddTripForm()
                ) : (
                    <View style={styles.tripsSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Your Trips</Text>
                            {user?.trips && user.trips.length > 0 && (
                                <Text style={styles.tripCount}>
                                    {user.trips.length} trip{user.trips.length !== 1 ? 's' : ''}
                                </Text>
                            )}
                        </View>
                        {renderTrips()}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.background,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    
    // Enhanced Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 32,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Theme.textSecondary,
        lineHeight: 22,
    },
    addTripButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Theme.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    
    // Enhanced Form
    formContainer: {
        backgroundColor: Theme.surface,
        borderRadius: 20,
        marginHorizontal: 24,
        padding: 24,
        marginBottom: 24,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
    },
    closeButton: {
        padding: 8,
    },
    inputSection: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.text,
        marginBottom: 12,
    },
    
    // Enhanced Dropdown
    dropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Theme.surfaceLight,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    dropdownContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dropdownText: {
        color: Theme.text,
        fontSize: 16,
    },
    dropdownPlaceholder: {
        color: Theme.textSecondary,
        fontSize: 16,
    },
    dropdownMenu: {
        backgroundColor: Theme.surfaceLight,
        borderRadius: 12,
        marginTop: 8,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Theme.border,
    },
    beachOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    beachName: {
        color: Theme.text,
        fontSize: 14,
        fontWeight: '600',
    },
    beachLocation: {
        color: Theme.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    beachRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: Theme.text,
        fontSize: 12,
        fontWeight: '600',
    },
    
    // Enhanced Date Section
    dateSection: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    dateField: {
        flex: 1,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surfaceLight,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Theme.border,
        gap: 12,
    },
    dateTextInput: {
        flex: 1,
        color: Theme.text,
        fontSize: 16,
    },
    
    // Enhanced Activities
    activitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    activityCard: {
        backgroundColor: Theme.surfaceLight,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        minWidth: (width - 96) / 3,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    activityCardSelected: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderColor: Theme.primary,
    },
    activityIcon: {
        fontSize: 20,
        marginBottom: 8,
    },
    activityText: {
        color: Theme.textSecondary,
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    activityTextSelected: {
        color: Theme.primary,
        fontWeight: '600',
    },
    
    // Enhanced Notes
    notesInput: {
        backgroundColor: Theme.surfaceLight,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: Theme.text,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: Theme.border,
    },
    characterCount: {
        textAlign: 'right',
        color: Theme.textSecondary,
        fontSize: 12,
        marginTop: 8,
    },
    
    // Enhanced Actions
    formActions: {
        marginTop: 8,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.primary,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    
    // Enhanced Trips Section
    tripsSection: {
        paddingHorizontal: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
    },
    tripCount: {
        fontSize: 14,
        color: Theme.textSecondary,
        fontWeight: '500',
    },
    
    // Enhanced Trip Cards
    tripCard: {
        backgroundColor: Theme.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    tripTitleSection: {
        flex: 1,
    },
    tripBeachName: {
        fontSize: 18,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 4,
    },
    tripLocation: {
        fontSize: 14,
        color: Theme.textSecondary,
    },
    tripActions: {
        flexDirection: 'row',
        gap: 8,
    },
    editTripButton: {
        padding: 8,
    },
    deleteTripButton: {
        padding: 8,
    },
    tripDetails: {
        gap: 20,
    },
    tripDates: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surfaceLight,
        borderRadius: 12,
        padding: 16,
    },
    dateInfo: {
        flex: 1,
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 12,
        color: Theme.textSecondary,
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.text,
    },
    dateSeparator: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    dateLine: {
        width: 20,
        height: 1,
        backgroundColor: Theme.border,
    },
    durationText: {
        fontSize: 12,
        color: Theme.primary,
        fontWeight: '600',
        marginVertical: 4,
    },
    tripActivities: {
        gap: 12,
    },
    activitiesLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.text,
    },
    activitiesChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    activityChip: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    activityChipText: {
        fontSize: 12,
        color: Theme.primary,
        fontWeight: '600',
    },
    tripNotes: {
        gap: 8,
    },
    notesLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.text,
    },
    notesText: {
        fontSize: 14,
        color: Theme.textSecondary,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    
    // Enhanced Empty State
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
        backgroundColor: Theme.surface,
        borderRadius: 20,
        marginHorizontal: 24,
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
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: Theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    emptyButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    
    // Enhanced Auth Prompt
    authPrompt: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    authIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    authPromptTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    authPromptText: {
        fontSize: 16,
        color: Theme.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    authButton: {
        backgroundColor: Theme.primary,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    authButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
});