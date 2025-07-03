import { beaches } from '@/constants/beaches';
import { ChatMessage } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useBeachStore } from './beachStore';
import { useUserStore } from './userStore';

interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    conversationContext: string[];

    // Actions
    sendMessage: (content: string) => Promise<void>;
    clearChat: () => void;
    addContext: (context: string) => void;
    getQuickReplies: () => string[];
}

// Enhanced ShoreBot responses with app-specific knowledge
const generateShoreSecureResponse = async (message: string, context: string[]): Promise<string> => {
    const lowerMessage = message.toLowerCase();
    
    // App Navigation Help
    if (lowerMessage.includes('how to') || lowerMessage.includes('navigate') || lowerMessage.includes('use app')) {
        return `🏖️ **ShoreSecure App Guide:**

**🏠 Home Tab:** Browse all beaches, search by location, view safety status
**🗺️ Map Tab:** Interactive map with beach locations and real-time conditions  
**💬 Community Tab:** Join beach discussions, share experiences, get local tips
**🤖 Chat Tab:** Ask me anything about beach safety (you're here!)
**📋 Plan Tab:** Create trip itineraries and get personalized recommendations
**👤 Profile Tab:** Manage settings, emergency contacts, and saved beaches

What specific feature would you like help with?`;
    }

    // Beach Safety Information
    if (lowerMessage.includes('safety') || lowerMessage.includes('dangerous') || lowerMessage.includes('safe')) {
        const beachName = extractBeachName(message);
        if (beachName) {
            const beach = beaches.find(b => b.name.toLowerCase().includes(beachName.toLowerCase()));
            if (beach) {
                const weatherData = useBeachStore.getState().weatherData[beach.id];
                if (weatherData) {
                    return generateBeachSafetyReport(beach, weatherData);
                }
            }
        }
        
        return `🛡️ **Beach Safety Guidelines:**

**🌊 Water Safety:**
• Always swim near lifeguard stations
• Check for rip current warnings
• Never swim alone
• Stay within designated swimming areas

**☀️ Sun Protection:**
• Use SPF 30+ sunscreen, reapply every 2 hours
• Seek shade during peak hours (10 AM - 4 PM)
• Wear protective clothing and sunglasses

**🚨 Emergency Preparedness:**
• Know the location of nearest lifeguard station
• Keep emergency contacts updated in your profile
• Learn to identify rip currents and how to escape them

Which beach are you planning to visit? I can provide specific safety information!`;
    }

    // Weather Information
    if (lowerMessage.includes('weather') || lowerMessage.includes('forecast') || lowerMessage.includes('temperature')) {
        const beachName = extractBeachName(message);
        if (beachName) {
            return await generateWeatherResponse(beachName);
        }
        
        return `🌤️ **Weather Information:**

I can provide detailed weather forecasts for any beach in our database! Just mention the beach name.

**Available Data:**
• Current temperature & conditions
• Wave height and wind speed
• UV index and visibility
• 7-day forecast
• Safety recommendations based on conditions

Try asking: "What's the weather like at Goa Beach?" or "Is it safe to swim at Marina Beach today?"`;
    }

    // Community Features
    if (lowerMessage.includes('community') || lowerMessage.includes('post') || lowerMessage.includes('forum')) {
        return `👥 **Community Features:**

**🗣️ Beach Forums:** Each beach has its own discussion thread where you can:
• Ask questions about current conditions
• Share photos and experiences  
• Get tips from locals and other visitors
• Report safety concerns or found items

**📝 Creating Posts:**
• Tap the + button in Community tab
• Select your beach location
• Add photos, tags, and safety alerts
• Engage with other beachgoers

**🚩 Safety Alerts:** Mark important posts as safety alerts to help others stay informed about:
• Dangerous conditions
• Wildlife sightings
• Crowded areas
• Weather warnings

Want to know more about any specific community feature?`;
    }

    // Trip Planning
    if (lowerMessage.includes('plan') || lowerMessage.includes('trip') || lowerMessage.includes('itinerary')) {
        const user = useUserStore.getState().user;
        const upcomingTrips = useUserStore.getState().getUpcomingTrips();
        
        return `📅 **Trip Planning with ShoreSecure:**

**🎯 Plan Tab Features:**
• Create detailed beach itineraries
• Select activities and set dates
• Get weather forecasts for your trip dates
• Receive safety recommendations
• Set trip reminders

**📋 Your Current Status:**
${user ? `• Saved Beaches: ${user.savedBeaches.length}
• Upcoming Trips: ${upcomingTrips.length}
• Emergency Contacts: ${user.emergencyContacts.length}` : '• Sign in to access personalized trip planning'}

**💡 Pro Tips:**
• Plan trips during optimal weather windows
• Check beach capacity and crowd levels
• Set up emergency contacts before traveling
• Save your favorite beaches for quick access

Need help planning a specific trip?`;
    }

    // Emergency Information
    if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || lowerMessage.includes('rescue')) {
        return `🚨 **Emergency Information:**

**Immediate Danger - Call 112 (India Emergency Number)**

**Beach Emergency Steps:**
1. **Stay Calm** - Don't panic
2. **Signal for Help** - Wave arms, shout, use whistle
3. **Contact Lifeguards** - Look for nearest lifeguard station
4. **Call Emergency Services** - 112 for immediate assistance

**Rip Current Escape:**
• Don't fight the current directly
• Swim parallel to shore until free
• Then swim at an angle back to beach

**Your Emergency Contacts:**
${useUserStore.getState().user?.emergencyContacts.map(contact => 
    `• ${contact.name}: ${contact.phone}`
).join('\n') || '• Add emergency contacts in your Profile tab'}

**App Emergency Features:**
• Quick access to emergency numbers
• Share location with emergency contacts
• Offline safety information available

Are you currently in an emergency situation?`;
    }

    // Lost & Found
    if (lowerMessage.includes('lost') || lowerMessage.includes('found') || lowerMessage.includes('missing')) {
        return `🔍 **Lost & Found System:**

**Report Lost Items:**
• Go to Community tab → Lost & Found section
• Add detailed description and photo
• Mark location where item was lost
• Set contact information for finders

**Report Found Items:**
• Post in the same Lost & Found section
• Include photo and location details
• Our AI matching system will suggest potential matches
• Connect directly with item owners

**Smart Matching:**
• Automatic matching based on description, location, and date
• Get notifications for potential matches
• Secure messaging system for coordination

**Popular Lost Items:**
• Jewelry and accessories
• Electronics and cameras
• Personal belongings
• Car keys and wallets

Have you lost something at the beach recently?`;
    }

    // Beach Recommendations
    if (lowerMessage.includes('recommend') || lowerMessage.includes('best beach') || lowerMessage.includes('suggest')) {
        const user = useUserStore.getState().user;
        const savedBeaches = user?.savedBeaches || [];
        
        return `🏖️ **Beach Recommendations:**

**🌟 Top Rated Beaches:**
${beaches.slice(0, 3).map(beach => 
    `• **${beach.name}** - ${beach.location}
  ${beach.description.substring(0, 80)}...
  Activities: ${beach.activities.slice(0, 3).join(', ')}`
).join('\n\n')}

**📍 Based on Your Profile:**
${savedBeaches.length > 0 ? 
    `• You have ${savedBeaches.length} saved beaches
• Check your saved beaches for personalized recommendations` :
    '• Save beaches to get personalized recommendations'}

**🎯 Find Your Perfect Beach:**
• Family-friendly: Look for beaches with calm waters and facilities
• Adventure: Choose beaches with water sports and activities  
• Peaceful: Select less crowded beaches with natural beauty

What type of beach experience are you looking for?`;
    }

    // Default response with app context
    return `🤖 **Hi! I'm ShoreBot, your personal beach safety assistant!**

I'm here to help you make the most of ShoreSecure. I can assist with:

**🏖️ Beach Information:** Safety status, weather, conditions
**🛡️ Safety Guidance:** Swimming tips, emergency procedures  
**📱 App Features:** Navigation help, feature explanations
**🗺️ Trip Planning:** Itinerary creation, recommendations
**👥 Community:** Forum usage, posting guidelines
**🔍 Lost & Found:** Report and find lost items

**Quick Examples:**
• "Is Goa Beach safe today?"
• "How do I create a trip plan?"
• "What's the weather forecast for Marina Beach?"
• "How do I report a lost item?"

What would you like to know about beaches or the ShoreSecure app?`;
};

// Helper functions
const extractBeachName = (message: string): string | null => {
    const beachNames = beaches.map(beach => beach.name.toLowerCase());
    
    for (const beachName of beachNames) {
        if (message.toLowerCase().includes(beachName)) {
            return beaches.find(beach => beach.name.toLowerCase() === beachName)?.name || null;
        }
    }
    
    return null;
};

const generateBeachSafetyReport = (beach: any, weatherData: any): string => {
    const safetyLevel = beach.currentSafetyStatus || 'unknown';
    const safetyEmoji = safetyLevel === 'safe' ? '✅' : safetyLevel === 'moderate' ? '⚠️' : '🚫';
    
    return `${safetyEmoji} **${beach.name} Safety Report:**

**Current Status:** ${safetyLevel.toUpperCase()}

**🌊 Conditions:**
• Wave Height: ${weatherData.waveHeight?.toFixed(1)}m
• Wind Speed: ${weatherData.windSpeed?.toFixed(1)} km/h
• Water Temperature: ${weatherData.waterTemperature?.toFixed(1)}°C

**☀️ Weather:**
• Air Temperature: ${weatherData.temperature?.toFixed(1)}°C
• UV Index: ${weatherData.uvIndex} (${weatherData.uvIndex > 7 ? 'Very High' : 'Moderate'})
• Visibility: ${weatherData.visibility}

**🏖️ Beach Info:**
• Location: ${beach.location}
• Facilities: ${beach.facilities?.join(', ')}
• Best Time: ${beach.bestTimeToVisit}

**💡 Recommendations:**
${safetyLevel === 'safe' ? '• Great conditions for swimming and water activities' :
  safetyLevel === 'moderate' ? '• Exercise caution, stay near lifeguards' :
  '• Avoid water activities, dangerous conditions'}

Last updated: ${new Date(weatherData.timestamp).toLocaleString()}`;
};

const generateWeatherResponse = async (beachName: string): Promise<string> => {
    const beach = beaches.find(b => b.name.toLowerCase().includes(beachName.toLowerCase()));
    if (!beach) {
        return `I couldn't find weather data for "${beachName}". Please check the beach name and try again.`;
    }
    
    const weatherData = useBeachStore.getState().weatherData[beach.id];
    if (!weatherData) {
        return `Weather data for ${beach.name} is currently unavailable. Please try again later.`;
    }
    
    return generateBeachSafetyReport(beach, weatherData);
};

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            messages: [
                {
                    id: '1',
                    role: 'assistant',
                    content: `🏖️ **Welcome to ShoreSecure!** 

I'm ShoreBot, your personal beach safety assistant. I'm here to help you:

• 🛡️ **Stay Safe** - Get real-time safety updates and emergency guidance
• 🌤️ **Check Weather** - Access detailed forecasts and conditions  
• 📱 **Use the App** - Navigate features and get the most out of ShoreSecure
• 🗺️ **Plan Trips** - Create perfect beach itineraries
• 👥 **Connect** - Join community discussions and find lost items

**Try asking me:**
• "Is [Beach Name] safe today?"
• "What's the weather like at [Beach Name]?"
• "How do I plan a trip?"
• "Show me emergency procedures"

What would you like to know about beaches or beach safety?`,
                    timestamp: new Date().toISOString(),
                }
            ],
            isLoading: false,
            error: null,
            conversationContext: [],

            sendMessage: async (content) => {
                const userMessage: ChatMessage = {
                    id: Date.now().toString(),
                    role: 'user',
                    content,
                    timestamp: new Date().toISOString(),
                };

                set(state => ({
                    messages: [...state.messages, userMessage],
                    isLoading: true,
                    error: null,
                    conversationContext: [...state.conversationContext, content].slice(-5) // Keep last 5 messages for context
                }));

                try {
                    const { conversationContext } = get();
                    const aiResponse = await generateShoreSecureResponse(content, conversationContext);

                    const assistantMessage: ChatMessage = {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: aiResponse,
                        timestamp: new Date().toISOString(),
                    };

                    set(state => ({
                        messages: [...state.messages, assistantMessage],
                        isLoading: false,
                    }));
                } catch (error) {
                    console.error('Error getting AI response:', error);
                    set({
                        isLoading: false,
                        error: 'Failed to get response from ShoreBot'
                    });
                }
            },

            clearChat: () => {
                set({
                    messages: [
                        {
                            id: '1',
                            role: 'assistant',
                            content: `🏖️ **Welcome back to ShoreSecure!** 

I'm ShoreBot, ready to help you with beach safety, weather updates, app navigation, and more!

What can I help you with today?`,
                            timestamp: new Date().toISOString(),
                        }
                    ],
                    conversationContext: []
                });
            },

            addContext: (context) => {
                set(state => ({
                    conversationContext: [...state.conversationContext, context].slice(-5)
                }));
            },

            getQuickReplies: () => {
                const user = useUserStore.getState().user;
                const savedBeaches = user?.savedBeaches || [];
                
                const baseReplies = [
                    "Show me beach safety tips",
                    "What's the weather forecast?",
                    "How do I plan a trip?",
                    "Emergency procedures",
                    "How to use the community forum?",
                    "Lost and found help"
                ];
                
                if (savedBeaches.length > 0) {
                    const beachName = beaches.find(b => b.id === savedBeaches[0])?.name;
                    if (beachName) {
                        baseReplies.unshift(`Is ${beachName} safe today?`);
                    }
                }
                
                return baseReplies;
            }
        }),
        {
            name: 'shore-secure-chat',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                messages: state.messages.slice(-20), // Store last 20 messages
            }),
        }
    )
);