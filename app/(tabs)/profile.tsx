import { useUserStore } from '@/store/userStore';
import { EmergencyContact } from '@/types';
import * as Haptics from 'expo-haptics';
import {
    Bell,
    Calendar,
    Camera,
    Check,
    ChevronRight,
    Edit3,
    LogOut,
    Mail,
    MapPin,
    Phone,
    Plus,
    Settings,
    Shield,
    Star,
    User,
    X
} from 'lucide-react-native';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
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

export default function ProfileScreen() {
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactRelationship, setContactRelationship] = useState('');
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');

    const {
        user,
        isAuthenticated,
        login,
        logout,
        isLoading,
        addEmergencyContact,
        removeEmergencyContact,
        updatePreferences,
        updateProfile
    } = useUserStore();

    const handleLogin = () => {
        login('demo@shoresecure.com', 'password');
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', onPress: () => logout(), style: 'destructive' },
            ]
        );
    };

    const handleEditProfile = () => {
        if (!user) return;
        setEditName(user.name);
        setEditEmail(user.email);
        setIsEditingProfile(true);
    };

    const handleSaveProfile = () => {
        if (!editName.trim() || !editEmail.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        updateProfile({
            name: editName.trim(),
            email: editEmail.trim()
        });

        setIsEditingProfile(false);
        
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleAddContact = () => {
        if (!contactName || !contactPhone) {
            Alert.alert('Error', 'Please enter name and phone number');
            return;
        }

        const newContact: Omit<EmergencyContact, 'id'> = {
            name: contactName,
            phone: contactPhone,
            relationship: contactRelationship || 'Family',
        };

        addEmergencyContact(newContact);

        setContactName('');
        setContactPhone('');
        setContactRelationship('');
        setIsAddingContact(false);

        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleRemoveContact = (contactId: string) => {
        Alert.alert(
            'Remove Contact',
            'Are you sure you want to remove this emergency contact?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    onPress: () => {
                        removeEmergencyContact(contactId);
                        if (Platform.OS !== 'web') {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const toggleNotificationSetting = (setting: 'safetyAlerts' | 'weatherUpdates' | 'tripReminders') => {
        if (!user) return;

        const currentValue = user.preferences.notificationSettings[setting];

        updatePreferences({
            notificationSettings: {
                ...user.preferences.notificationSettings,
                [setting]: !currentValue,
            }
        });

        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
    };

    const renderLoginScreen = () => {
        return (
            <View style={styles.authContainer}>
                <StatusBar barStyle="light-content" backgroundColor={Theme.background} />
                
                <View style={styles.authIconContainer}>
                    <View style={styles.authIcon}>
                        <User size={48} color={Theme.primary} />
                    </View>
                </View>
                
                <Text style={styles.authTitle}>Welcome to ShoreSecure</Text>
                <Text style={styles.authSubtitle}>
                    Sign in to access personalized beach recommendations, save your favorite beaches, and plan amazing trips
                </Text>

                <View style={styles.authFeatures}>
                    <View style={styles.authFeature}>
                        <Star size={16} color={Theme.success} />
                        <Text style={styles.authFeatureText}>Save favorite beaches</Text>
                    </View>
                    <View style={styles.authFeature}>
                        <MapPin size={16} color={Theme.success} />
                        <Text style={styles.authFeatureText}>Get personalized recommendations</Text>
                    </View>
                    <View style={styles.authFeature}>
                        <Calendar size={16} color={Theme.success} />
                        <Text style={styles.authFeatureText}>Plan and track trips</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    <Text style={styles.loginButtonText}>
                        {isLoading ? 'Signing in...' : 'Sign In (Demo)'}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.authFooter}>
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </Text>
            </View>
        );
    };

    const renderEmergencyContactForm = () => {
        return (
            <View style={styles.contactForm}>
                <View style={styles.contactFormHeader}>
                    <Text style={styles.contactFormTitle}>Add Emergency Contact</Text>
                    <TouchableOpacity 
                        onPress={() => setIsAddingContact(false)}
                        style={styles.contactFormClose}
                    >
                        <X size={20} color={Theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter contact name"
                        placeholderTextColor={Theme.textSecondary}
                        value={contactName}
                        onChangeText={setContactName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="+91 1234567890"
                        placeholderTextColor={Theme.textSecondary}
                        value={contactPhone}
                        onChangeText={setContactPhone}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Relationship</Text>
                    <View style={styles.relationshipChips}>
                        {['Family', 'Friend', 'Colleague', 'Other'].map(rel => (
                            <TouchableOpacity
                                key={rel}
                                style={[
                                    styles.relationshipChip,
                                    contactRelationship === rel && styles.selectedRelationshipChip
                                ]}
                                onPress={() => setContactRelationship(rel)}
                            >
                                <Text style={[
                                    styles.relationshipChipText,
                                    contactRelationship === rel && styles.selectedRelationshipChipText
                                ]}>
                                    {rel}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.contactFormButtons}>
                    <TouchableOpacity
                        style={styles.contactSaveButton}
                        onPress={handleAddContact}
                    >
                        <Check size={16} color="white" />
                        <Text style={styles.contactSaveButtonText}>Save Contact</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderProfileEditForm = () => {
        return (
            <View style={styles.editForm}>
                <View style={styles.editFormHeader}>
                    <Text style={styles.editFormTitle}>Edit Profile</Text>
                    <View style={styles.editFormActions}>
                        <TouchableOpacity 
                            onPress={() => setIsEditingProfile(false)}
                            style={styles.editFormCancel}
                        >
                            <X size={20} color={Theme.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={handleSaveProfile}
                            style={styles.editFormSave}
                        >
                            <Check size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        placeholderTextColor={Theme.textSecondary}
                        value={editName}
                        onChangeText={setEditName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={Theme.textSecondary}
                        value={editEmail}
                        onChangeText={setEditEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
            </View>
        );
    };

    const renderProfileScreen = () => {
        if (!user) return null;

        return (
            <ScrollView 
                contentContainerStyle={styles.profileScrollContent}
                showsVerticalScrollIndicator={false}
            >
                <StatusBar barStyle="light-content" backgroundColor={Theme.background} />
                
                {/* Enhanced Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.profileImageContainer}>
                        {user.profilePhoto ? (
                            <Image
                                source={require('@/assets/images/logo.png')}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <User size={32} color={Theme.primary} />
                            </View>
                        )}
                        <TouchableOpacity style={styles.cameraButton}>
                            <Camera size={16} color="white" />
                        </TouchableOpacity>
                    </View>

                    {isEditingProfile ? (
                        renderProfileEditForm()
                    ) : (
                        <View style={styles.profileInfo}>
                            <View style={styles.profileNameRow}>
                                <Text style={styles.profileName}>{user.name}</Text>
                                <TouchableOpacity 
                                    onPress={handleEditProfile}
                                    style={styles.editButton}
                                >
                                    <Edit3 size={16} color={Theme.primary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.profileEmail}>{user.email}</Text>
                            
                            <View style={styles.profileStats}>
                                <View style={styles.profileStat}>
                                    <Text style={styles.profileStatNumber}>{user.savedBeaches?.length || 0}</Text>
                                    <Text style={styles.profileStatLabel}>Saved Beaches</Text>
                                </View>
                                <View style={styles.profileStat}>
                                    <Text style={styles.profileStatNumber}>{user.trips?.length || 0}</Text>
                                    <Text style={styles.profileStatLabel}>Planned Trips</Text>
                                </View>
                                <View style={styles.profileStat}>
                                    <Text style={styles.profileStatNumber}>{user.emergencyContacts?.length || 0}</Text>
                                    <Text style={styles.profileStatLabel}>Emergency Contacts</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Emergency Contacts Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
                            <Text style={styles.sectionDescription}>
                                Contacts notified during emergencies
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setIsAddingContact(true)}
                        >
                            <Plus size={16} color={Theme.primary} />
                        </TouchableOpacity>
                    </View>

                    {isAddingContact && renderEmergencyContactForm()}

                    {user.emergencyContacts.length > 0 ? (
                        user.emergencyContacts.map(contact => (
                            <View key={contact.id} style={styles.contactCard}>
                                <View style={styles.contactIcon}>
                                    <Phone size={16} color={Theme.primary} />
                                </View>
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactName}>{contact.name}</Text>
                                    <Text style={styles.contactDetails}>
                                        {contact.relationship} • {contact.phone}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleRemoveContact(contact.id)}
                                    style={styles.removeButton}
                                >
                                    <X size={16} color={Theme.danger} />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : !isAddingContact && (
                        <View style={styles.emptyContacts}>
                            <Phone size={24} color={Theme.textTertiary} />
                            <Text style={styles.emptyContactsText}>No emergency contacts added</Text>
                            <TouchableOpacity
                                style={styles.addFirstContactButton}
                                onPress={() => setIsAddingContact(true)}
                            >
                                <Text style={styles.addFirstContactText}>Add First Contact</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Enhanced Notification Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>

                    <View style={styles.settingCard}>
                        <View style={styles.settingIcon}>
                            <Shield size={20} color={Theme.danger} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Safety Alerts</Text>
                            <Text style={styles.settingDescription}>
                                Critical safety warnings and beach conditions
                            </Text>
                        </View>
                        <Switch
                            value={user.preferences.notificationSettings.safetyAlerts}
                            onValueChange={() => toggleNotificationSetting('safetyAlerts')}
                            trackColor={{ false: Theme.surfaceLight, true: Theme.primary }}
                            thumbColor="white"
                        />
                    </View>

                    <View style={styles.settingCard}>
                        <View style={styles.settingIcon}>
                            <Bell size={20} color={Theme.warning} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Weather Updates</Text>
                            <Text style={styles.settingDescription}>
                                Daily forecasts for your saved beaches
                            </Text>
                        </View>
                        <Switch
                            value={user.preferences.notificationSettings.weatherUpdates}
                            onValueChange={() => toggleNotificationSetting('weatherUpdates')}
                            trackColor={{ false: Theme.surfaceLight, true: Theme.primary }}
                            thumbColor="white"
                        />
                    </View>

                    <View style={styles.settingCard}>
                        <View style={styles.settingIcon}>
                            <Calendar size={20} color={Theme.success} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Trip Reminders</Text>
                            <Text style={styles.settingDescription}>
                                Reminders for your upcoming beach trips
                            </Text>
                        </View>
                        <Switch
                            value={user.preferences.notificationSettings.tripReminders}
                            onValueChange={() => toggleNotificationSetting('tripReminders')}
                            trackColor={{ false: Theme.surfaceLight, true: Theme.primary }}
                            thumbColor="white"
                        />
                    </View>
                </View>

                {/* Enhanced App Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>

                    <TouchableOpacity style={styles.menuCard}>
                        <View style={styles.menuIcon}>
                            <Settings size={20} color={Theme.primary} />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>App Preferences</Text>
                            <Text style={styles.menuDescription}>Language, theme, and display settings</Text>
                        </View>
                        <ChevronRight size={20} color={Theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard}>
                        <View style={styles.menuIcon}>
                            <Shield size={20} color={Theme.success} />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>Privacy & Security</Text>
                            <Text style={styles.menuDescription}>Data protection and account security</Text>
                        </View>
                        <ChevronRight size={20} color={Theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuCard}>
                        <View style={styles.menuIcon}>
                            <Mail size={20} color={Theme.accent} />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuTitle}>Help & Support</Text>
                            <Text style={styles.menuDescription}>Get help and contact our team</Text>
                        </View>
                        <ChevronRight size={20} color={Theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Enhanced Logout */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <LogOut size={20} color={Theme.danger} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>ShoreSecure v1.0.0</Text>
                <View style={styles.bottomSpacing} />
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            {isAuthenticated ? renderProfileScreen() : renderLoginScreen()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.background,
    },
    
    // Enhanced Auth Screen
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    authIconContainer: {
        marginBottom: 32,
    },
    authIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    authTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    authSubtitle: {
        fontSize: 16,
        color: Theme.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    authFeatures: {
        width: '100%',
        marginBottom: 32,
    },
    authFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    authFeatureText: {
        fontSize: 14,
        color: Theme.textSecondary,
    },
    loginButton: {
        backgroundColor: Theme.primary,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        shadowColor: Theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    authFooter: {
        fontSize: 12,
        color: Theme.textTertiary,
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 16,
    },
    
    // Enhanced Profile Screen
    profileScrollContent: {
        paddingBottom: 32,
    },
    profileHeader: {
        backgroundColor: Theme.surface,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 32,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    profileImageContainer: {
        alignSelf: 'center',
        position: 'relative',
        marginBottom: 20,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    profileImagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        alignItems: 'center',
    },
    profileNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    profileName: {
        fontSize: 24,
        fontWeight: '700',
        color: Theme.text,
    },
    editButton: {
        padding: 8,
    },
    profileEmail: {
        fontSize: 14,
        color: Theme.textSecondary,
        marginBottom: 24,
    },
    profileStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    profileStat: {
        alignItems: 'center',
    },
    profileStatNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
    },
    profileStatLabel: {
        fontSize: 12,
        color: Theme.textSecondary,
        marginTop: 4,
    },
    
    // Enhanced Sections
    section: {
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 4,
    },
    sectionDescription: {
        fontSize: 14,
        color: Theme.textSecondary,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Enhanced Contact Cards
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 16,
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.text,
        marginBottom: 4,
    },
    contactDetails: {
        fontSize: 14,
        color: Theme.textSecondary,
    },
    removeButton: {
        padding: 8,
    },
    emptyContacts: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: Theme.surface,
        borderRadius: 16,
    },
    emptyContactsText: {
        fontSize: 14,
        color: Theme.textSecondary,
        marginTop: 12,
        marginBottom: 16,
    },
    addFirstContactButton: {
        backgroundColor: Theme.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addFirstContactText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    
    // Enhanced Forms
    contactForm: {
        backgroundColor: Theme.surfaceLight,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    contactFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    contactFormTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Theme.text,
    },
    contactFormClose: {
        padding: 4,
    },
    editForm: {
        marginTop: 20,
    },
    editFormHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    editFormTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Theme.text,
    },
    editFormActions: {
        flexDirection: 'row',
        gap: 12,
    },
    editFormCancel: {
        padding: 8,
    },
    editFormSave: {
        backgroundColor: Theme.primary,
        padding: 8,
        borderRadius: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Theme.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: Theme.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    relationshipChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    relationshipChip: {
        backgroundColor: Theme.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    selectedRelationshipChip: {
        backgroundColor: Theme.primary,
        borderColor: Theme.primary,
    },
    relationshipChipText: {
        color: Theme.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    selectedRelationshipChipText: {
        color: 'white',
        fontWeight: '600',
    },
    contactFormButtons: {
        marginTop: 8,
    },
    contactSaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.primary,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    contactSaveButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    
    // Enhanced Settings Cards
    settingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 16,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.text,
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        color: Theme.textSecondary,
    },
    
    // Enhanced Menu Cards
    menuCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        gap: 16,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.text,
        marginBottom: 4,
    },
    menuDescription: {
        fontSize: 14,
        color: Theme.textSecondary,
    },
    
    // Enhanced Logout
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: 'rgba(255, 71, 87, 0.1)',
        borderRadius: 16,
        gap: 12,
        marginBottom: 16,
    },
    logoutText: {
        color: Theme.danger,
        fontSize: 16,
        fontWeight: '700',
    },
    versionText: {
        textAlign: 'center',
        color: Theme.textTertiary,
        fontSize: 12,
        marginBottom: 16,
    },
    bottomSpacing: {
        height: 32,
    },
});