import Colors from '@/constants/colors';
import { useBeachStore } from '@/store/beachStore';
import { useLostItemStore } from '@/store/lostItemStore';
import { LostItemCategory, LostItemStatus } from '@/types';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
    Calendar,
    Camera,
    Check,
    ChevronRight,
    MapPin,
    Plus,
    Tag,
    X
} from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function ReportItemScreen() {
    const router = useRouter();
    const { beaches } = useBeachStore();
    const { createLostItem } = useLostItemStore();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 1: Basic Info
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<LostItemCategory>('other');
    const [status, setStatus] = useState<LostItemStatus>('lost');

    // Step 2: Location & Date
    const [selectedBeachId, setSelectedBeachId] = useState('');
    const [date, setDate] = useState('');
    const [showBeachSelector, setShowBeachSelector] = useState(false);

    // Step 3: Image & Tags
    const [image, setImage] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    // Step 4: Contact Info
    const [contactInfo, setContactInfo] = useState('');

    const handleNext = () => {
        if (currentStep === 1) {
            if (!title || !description || !category) {
                Alert.alert('Missing Information', 'Please fill in all required fields.');
                return;
            }
        } else if (currentStep === 2) {
            if (!selectedBeachId || !date) {
                Alert.alert('Missing Information', 'Please select a beach and date.');
                return;
            }
        } else if (currentStep === 3) {
            if (tags.length === 0) {
                Alert.alert('Missing Tags', 'Please add at least one tag to help with matching.');
                return;
            }
        }

        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }

        setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }

        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            router.back();
        }
    };

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Permission Required', 'You need to grant permission to access your photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
            setTags([...tags, tagInput.trim().toLowerCase()]);
            setTagInput('');
            if (Platform.OS !== 'web') {
                Haptics.selectionAsync();
            }
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
    };

    const handleSubmit = async () => {
        if (!contactInfo) {
            Alert.alert('Missing Information', 'Please provide contact information.');
            return;
        }

        setIsSubmitting(true);

        try {
            // In a real app, we would upload the image to a storage service
            // and get a URL back. For now, we'll just use the local URI.
            const imageUrl = image || undefined;

            await createLostItem({
                title,
                description,
                category,
                location: {
                    beachId: selectedBeachId,
                    // In a real app, we would get more precise coordinates
                    coordinates: beaches.find(b => b.id === selectedBeachId)?.coordinates,
                },
                date,
                contactInfo,
                imageUrl,
                tags,
                status,
            });

            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            Alert.alert(
                'Success',
                `Your ${status === 'lost' ? 'lost' : 'found'} item has been reported.`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to submit your report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepIndicator = () => {
        return (
            <View style={styles.stepIndicator}>
                {[1, 2, 3, 4].map(step => (
                    <View
                        key={step}
                        style={[
                            styles.stepDot,
                            currentStep === step && styles.activeStepDot,
                            currentStep > step && styles.completedStepDot,
                        ]}
                    >
                        {currentStep > step ? (
                            <Check size={12} color="#fff" />
                        ) : (
                            <Text style={styles.stepDotText}>{step}</Text>
                        )}
                    </View>
                ))}
            </View>
        );
    };

    const renderStep1 = () => {
        return (
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Item Information</Text>

                <Text style={styles.inputLabel}>Item Status*</Text>
                <View style={styles.statusToggle}>
                    <TouchableOpacity
                        style={[
                            styles.statusButton,
                            status === 'lost' && styles.activeStatusButton
                        ]}
                        onPress={() => setStatus('lost')}
                    >
                        <Text
                            style={[
                                styles.statusButtonText,
                                status === 'lost' && styles.activeStatusButtonText
                            ]}
                        >
                            Lost Item
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.statusButton,
                            status === 'found' && styles.activeStatusButton
                        ]}
                        onPress={() => setStatus('found')}
                    >
                        <Text
                            style={[
                                styles.statusButtonText,
                                status === 'found' && styles.activeStatusButtonText
                            ]}
                        >
                            Found Item
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Title*</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Brief title describing the item"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.inputLabel}>Description*</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Detailed description of the item"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                <Text style={styles.inputLabel}>Category*</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                >
                    {(['electronics', 'jewelry', 'clothing', 'accessories', 'documents', 'toys', 'other'] as LostItemCategory[]).map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryChip,
                                category === cat && styles.activeCategoryChip
                            ]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text
                                style={[
                                    styles.categoryChipText,
                                    category === cat && styles.activeCategoryChipText
                                ]}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderStep2 = () => {
        return (
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Location & Date</Text>

                <Text style={styles.inputLabel}>Beach Location*</Text>
                <TouchableOpacity
                    style={styles.beachSelector}
                    onPress={() => setShowBeachSelector(!showBeachSelector)}
                >
                    <View style={styles.beachSelectorContent}>
                        <MapPin size={20} color={Colors.dark.textSecondary} />
                        <Text style={styles.beachSelectorText}>
                            {selectedBeachId
                                ? beaches.find(b => b.id === selectedBeachId)?.name || 'Select Beach'
                                : 'Select Beach'
                            }
                        </Text>
                    </View>
                    <ChevronRight size={20} color={Colors.dark.textSecondary} />
                </TouchableOpacity>

                {showBeachSelector && (
                    <ScrollView
                        style={styles.beachList}
                        nestedScrollEnabled
                    >
                        {beaches.map(beach => (
                            <TouchableOpacity
                                key={beach.id}
                                style={styles.beachItem}
                                onPress={() => {
                                    setSelectedBeachId(beach.id);
                                    setShowBeachSelector(false);
                                    if (Platform.OS !== 'web') {
                                        Haptics.selectionAsync();
                                    }
                                }}
                            >
                                <Text style={styles.beachItemName}>{beach.name}</Text>
                                <Text style={styles.beachItemLocation}>{beach.location}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <Text style={styles.inputLabel}>Date*</Text>
                <View style={styles.dateInputContainer}>
                    <Calendar size={20} color={Colors.dark.textSecondary} />
                    <TextInput
                        style={styles.dateInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.dark.textSecondary}
                        value={date}
                        onChangeText={setDate}
                    />
                </View>
                <Text style={styles.helperText}>
                    Enter the date when the item was lost or found
                </Text>
            </View>
        );
    };

    const renderStep3 = () => {
        return (
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Image & Tags</Text>

                <Text style={styles.inputLabel}>Item Image (Optional)</Text>
                <TouchableOpacity
                    style={styles.imageUploader}
                    onPress={handlePickImage}
                >
                    {image ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image
                                source={{ uri: image }}
                                style={styles.imagePreview}
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => setImage(null)}
                            >
                                <X size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Camera size={32} color={Colors.dark.textSecondary} />
                            <Text style={styles.uploadPlaceholderText}>Tap to add an image</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Text style={styles.inputLabel}>Tags*</Text>
                <View style={styles.tagInputContainer}>
                    <Tag size={20} color={Colors.dark.textSecondary} />
                    <TextInput
                        style={styles.tagInput}
                        placeholder="Add descriptive tags"
                        placeholderTextColor={Colors.dark.textSecondary}
                        value={tagInput}
                        onChangeText={setTagInput}
                        onSubmitEditing={handleAddTag}
                    />
                    <TouchableOpacity
                        style={styles.addTagButton}
                        onPress={handleAddTag}
                        disabled={!tagInput.trim()}
                    >
                        <Plus size={20} color={tagInput.trim() ? Colors.dark.primary : Colors.dark.inactive} />
                    </TouchableOpacity>
                </View>

                <View style={styles.tagsContainer}>
                    {tags.map(tag => (
                        <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>#{tag}</Text>
                            <TouchableOpacity
                                style={styles.removeTagButton}
                                onPress={() => handleRemoveTag(tag)}
                            >
                                <X size={12} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <Text style={styles.helperText}>
                    Add tags to help others find your item (e.g., color, brand, material)
                </Text>
            </View>
        );
    };

    const renderStep4 = () => {
        return (
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Contact Information</Text>

                <Text style={styles.inputLabel}>Contact Information*</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Email or phone number"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={contactInfo}
                    onChangeText={setContactInfo}
                />
                <Text style={styles.helperText}>
                    This will be visible to users who want to contact you about this item
                </Text>

                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Report Summary</Text>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Status:</Text>
                        <Text style={styles.summaryValue}>
                            {status === 'lost' ? 'Lost Item' : 'Found Item'}
                        </Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Title:</Text>
                        <Text style={styles.summaryValue}>{title}</Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Category:</Text>
                        <Text style={styles.summaryValue}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Location:</Text>
                        <Text style={styles.summaryValue}>
                            {beaches.find(b => b.id === selectedBeachId)?.name || 'Unknown Beach'}
                        </Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Date:</Text>
                        <Text style={styles.summaryValue}>{date}</Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Tags:</Text>
                        <Text style={styles.summaryValue}>
                            {tags.map(tag => `#${tag}`).join(', ')}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {renderStepIndicator()}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                >
                    <Text style={styles.backButtonText}>
                        {currentStep === 1 ? 'Cancel' : 'Back'}
                    </Text>
                </TouchableOpacity>

                {currentStep < 4 ? (
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleNext}
                    >
                        <Text style={styles.nextButtonText}>Next</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
        gap: 24,
    },
    stepDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.dark.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeStepDot: {
        backgroundColor: Colors.dark.primary,
    },
    completedStepDot: {
        backgroundColor: Colors.dark.success,
    },
    stepDotText: {
        color: Colors.dark.textPrimary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    stepContainer: {
        marginBottom: 24,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.textPrimary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: Colors.dark.textPrimary,
        marginBottom: 16,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    helperText: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: -8,
        marginBottom: 16,
    },
    statusToggle: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        overflow: 'hidden',
    },
    statusButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeStatusButton: {
        backgroundColor: Colors.dark.primary,
    },
    statusButtonText: {
        color: Colors.dark.textPrimary,
        fontWeight: '600',
    },
    activeStatusButtonText: {
        color: '#fff',
    },
    categoriesContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: Colors.dark.card,
        borderRadius: 16,
    },
    activeCategoryChip: {
        backgroundColor: 'rgba(0, 128, 128, 0.2)',
        borderColor: Colors.dark.primary,
        borderWidth: 1,
    },
    categoryChipText: {
        color: Colors.dark.textPrimary,
        fontSize: 14,
    },
    activeCategoryChipText: {
        color: Colors.dark.primary,
        fontWeight: '600',
    },
    beachSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 8,
    },
    beachSelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    beachSelectorText: {
        color: Colors.dark.textPrimary,
        fontSize: 16,
    },
    beachList: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 8,
        maxHeight: 200,
        marginBottom: 16,
    },
    beachItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.border,
    },
    beachItemName: {
        color: Colors.dark.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    beachItemLocation: {
        color: Colors.dark.textSecondary,
        fontSize: 12,
    },
    dateInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
        gap: 8,
    },
    dateInput: {
        flex: 1,
        color: Colors.dark.textPrimary,
        fontSize: 16,
    },
    imageUploader: {
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        marginBottom: 16,
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadPlaceholderText: {
        color: Colors.dark.textSecondary,
        marginTop: 8,
    },
    imagePreviewContainer: {
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 200,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        gap: 8,
    },
    tagInput: {
        flex: 1,
        color: Colors.dark.textPrimary,
        fontSize: 16,
    },
    addTagButton: {
        padding: 4,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 128, 128, 0.1)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    tagText: {
        color: Colors.dark.primary,
        fontSize: 14,
    },
    removeTagButton: {
        padding: 2,
    },
    summaryContainer: {
        backgroundColor: Colors.dark.card,
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.textPrimary,
        marginBottom: 12,
    },
    summaryItem: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    summaryLabel: {
        width: 80,
        color: Colors.dark.textSecondary,
        fontSize: 14,
    },
    summaryValue: {
        flex: 1,
        color: Colors.dark.textPrimary,
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 16,
        backgroundColor: Colors.dark.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.dark.border,
    },
    backButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.dark.border,
        borderRadius: 8,
        marginRight: 8,
    },
    backButtonText: {
        color: Colors.dark.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: Colors.dark.primary,
        borderRadius: 8,
        marginLeft: 8,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: Colors.dark.success,
        borderRadius: 8,
        marginLeft: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});