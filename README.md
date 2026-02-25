# Ambar Cocktail App

A React Native (Expo) app for discovering cocktails, sharing posts, finding bars, and managing your home bar.

![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat&logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript)

## Features

- **Feed** – Social feed with posts, likes, comments, save; create posts with photo, caption, and cocktail tag
- **Cocktails** – Browse and search cocktails (TheCocktailDB), filter by alcoholic / non-alcoholic, search by ingredients
- **Discover** – Featured cocktails, categories, mood-based suggestions, seasonal section
- **Bars** – List of bars with cocktail menus, ratings, and reviews; search by bar, city, country, or cocktail; sort by distance (with location); save and rate bars
- **Profile** – Posts, saved posts, favorites, saved bars, followers/following; edit profile (name, bio, avatar)
- **Onboarding** – First-launch welcome flow (skip or get started)
- **Notifications** – Mock notifications (likes, comments, follows)
- **Dark / light theme** – Toggle in Settings
- **Other** – My Bar, Journal, Collections, Achievements, Unit converter, Create recipe, Step-by-step preparation

## Screenshots

*(Add screenshots from your app here.)*

## Getting started

### Prerequisites

- Node.js 18+
- npm or yarn
- [Expo Go](https://expo.dev/go) on your device (for quick testing), or Xcode / Android Studio for simulators

### Install and run

```bash
# Clone the repo
git clone https://github.com/canberkyigit/Ambar-Cocktail-App.git
cd Ambar-Cocktail-App

# Install dependencies
npm install

# Start Expo (opens in Expo Go or simulator)
npm start

# Run on iOS simulator (with hot reload)
npm run ios

# Run on Android
npm run android
```

### Scripts

| Command       | Description                    |
|---------------|--------------------------------|
| `npm start`   | Start Expo dev server          |
| `npm run ios` | Start and open in iOS simulator |
| `npm run android` | Start and open on Android  |
| `npm run dev` | Start with hot reload (CI=false) |

## Project structure

```
├── app/                 # Expo Router screens
│   ├── (tabs)/          # Tab screens: Feed, Cocktails, Discover, Bars, Profile
│   ├── cocktail/        # Cocktail detail, step-by-step prepare
│   ├── user/            # User profile
│   ├── post/            # Post detail
│   ├── create-post.tsx  # New post (photo, caption, cocktail)
│   ├── edit-profile.tsx
│   ├── onboarding.tsx
│   ├── notifications.tsx
│   └── ...
├── src/
│   ├── components/      # Reusable UI (social, cocktail, shared)
│   ├── stores/          # Zustand stores (social, bars, theme, etc.)
│   ├── data/            # Mock data (e.g. bars)
│   ├── services/        # API (cocktail service)
│   ├── theme/           # Colors, typography, spacing
│   └── types/           # TypeScript types
└── assets/
```

## API and data

- **Cocktails** – [TheCocktailDB](https://www.thecocktaildb.com/api.php) (free tier; rate limits apply; avoid excessive pull-to-refresh on the full list).
- **Bars** – In-app mock data; structure is ready for a real backend.

## License

MIT (or your chosen license).

## Screen Shoots

<img width="1290" height="2796" alt="Simulator Screenshot - iPhone 15 Pro Max - 2026-02-25 at 13 15 10" src="https://github.com/user-attachments/assets/225bdbf0-1ae7-405b-a5f1-3d5766682f72" />
<img width="1290" height="2796" alt="Simulator Screenshot - iPhone 15 Pro Max - 2026-02-25 at 13 14 55" src="https://github.com/user-attachments/assets/d14f6be8-ad26-4144-9855-500da1b5966f" />
<img width="1290" height="2796" alt="Simulator Screenshot - iPhone 15 Pro Max - 2026-02-25 at 13 13 58" src="https://github.com/user-attachments/assets/d4cc5701-a3ad-4082-a36d-a5051c521956" />
<img width="1290" height="2796" alt="Simulator Screenshot - iPhone 15 Pro Max - 2026-02-25 at 13 15 31" src="https://github.com/user-attachments/assets/81adf9b0-ae88-4340-a400-069c3707d331" />
<img width="1290" height="2796" alt="Simulator Screenshot - iPhone 15 Pro Max - 2026-02-25 at 13 15 27" src="https://github.com/user-attachments/assets/e2379d68-2be5-49f7-bb98-3ff96c432357" />
<img width="1290" height="2796" alt="Simulator Screenshot - iPhone 15 Pro Max - 2026-02-25 at 13 15 19" src="https://github.com/user-attachments/assets/f7a14bf7-5ffd-4596-add0-6fe8acbcaca8" />
<img width="1290" height="2796" alt="Simulator Screenshot - iPhone 15 Pro Max - 2026-02-25 at 13 13 55" src="https://github.com/user-attachments/assets/ec626da2-11da-4130-b7a7-3314de5a8bd5" />
<img width="1290" height="2796" alt="Simulator Screenshot - iPhone 15 Pro Max - 2026-02-25 at 13 13 50" src="https://github.com/user-attachments/assets/e18f7afb-ce0e-4b4e-9f47-becaae678efb" />
<img width="1290" height="2796" alt="Simulator Screenshot - iPhone 15 Pro Max - 2026-02-25 at 13 13 45" src="https://github.com/user-attachments/assets/f7b22a3a-94f6-4589-ae81-c9cc041720fc" />
<img width="1290" height="2796" alt="Simulator Screenshot - iPhone 15 Pro Max - 2026-02-25 at 13 13 34" src="https://github.com/user-attachments/assets/6e7d7471-54f8-433e-820a-2db4e2cdc640" />


---

Built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev).
