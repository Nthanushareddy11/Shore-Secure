# ShoreSecure - Beach Safety Mobile Application

ShoreSecure is a comprehensive beach safety mobile application designed to enhance the beach tourism experience across India. The app provides real-time marine conditions, safety recommendations, emergency services, and community features to help users stay safe and informed during their beach visits.

## Track
This project is submitted under the **Full Stack + AI/ML** track.

## Problem Statement
Many beachgoers in India lack access to real-time safety information and emergency services. ShoreSecure addresses this by providing a centralized app for beach safety alerts, community support, and lost-and-found management.

## Features

### 🌊 Beach Information
- Comprehensive database of beaches across India
- Real-time safety status indicators (safe, moderate, dangerous)
- Detailed beach information including facilities, activities, and safety tips
- Weather and marine conditions

### 🗺️ Interactive Map
- Dark-themed map using Leaflet.js
- Color-coded beach markers based on safety status
- Marker clustering for dense areas
- User location tracking
- Offline map caching

### 🚨 Safety Features
- Real-time safety alerts
- Emergency SOS button
- One-tap emergency calls
- Safety tips and recommendations

### 👥 Community System
- Beach-specific discussion boards
- Alert reporting system
- Image sharing
- Tagging and filtering

### 🔍 Lost & Found Portal
- Report lost items
- Browse found items
- In-app messaging for coordination
- AI-powered matching

### 📍 Local Recommendations
- Nearby facilities (restrooms, food, first aid)
- Distance information
- Contact details
- Navigation assistance

### 🤖 AI Chatbot (ShoreBot)
- Natural language processing
- Beach-specific information
- Safety recommendations
- Weather updates

## Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: Zustand
- **Storage**: AsyncStorage
- **Maps**: Leaflet.js (via WebView)
- **UI Components**: Custom components with React Native StyleSheet

## Business Model – ShoreSecure
Freemium Model
Core beach safety, SOS, and lost & found tools are free.

ShoreSecure Plus (₹99/month)
Unlocks advanced alerts, offline access, and priority SOS support.

B2B Partnerships
Offer custom dashboards to resorts, lifeguards, and tourism boards.

Smart Ads & Sponsorships
Eco-friendly, location-based promotions — no user tracking.

Data Licensing
Anonymized safety trends for governments, insurers, and NGOs.

## Bounties/Challenges Completed
- [Choose Your Color Theme] ✅
- [Include a star Wars Easter Egg ] ✅

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shore-secure.git
```

2. Install dependencies:
```bash
cd shore-secure
npm install
```

3. Start the development server:
```bash
npx expo start
```

## Exporting the Project

To export the entire project to your local system:

1. From Expo Go, use the "Export" option in the project settings
2. Alternatively, download the project as a ZIP file
3. For a manual export:
   - Create a new Expo project: `npx create-expo-app ShoreSecure`
   - Replace the contents with the files from this project
   - Install the required dependencies

## Project Structure

```
shore-secure/
├── app/                  # Main application screens
│   ├── (tabs)/           # Tab-based navigation screens
│   ├── beach/            # Beach detail screens
│   ├── community/        # Community screens
│   └── lost-found/       # Lost & Found screens
├── assets/               # Static assets
├── components/           # Reusable UI components
├── constants/            # App constants and configuration
├── store/                # Zustand state management
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- OpenStreetMap for map data
- Open-Meteo for marine weather data
- Unsplash for sample images
