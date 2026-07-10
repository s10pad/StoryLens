# StoryLens Mobile - Engineering Document

## Tech Stack
- **Frontend Framework**: React Native with Expo (Managed Workflow)
- **Routing**: Expo Router (File-based routing)
- **Styling**: Native `StyleSheet` with consistent theme constants.
- **Video Playback**: `expo-av`
- **Backend/API**: Since this is a mobile app, it will initially connect to the existing Node.js `server.js` running on `localhost:3001` (or your local IP address for mobile testing). We will use `fetch` to call `/api/directions`, `/api/scenes`, and `/api/generate-trailer`.

## Folder Structure
```
storylens_quick_app_test/
├── app/                  # Expo Router pages
│   ├── index.tsx         # The Prompter screen
│   ├── studio.tsx        # The Pipeline/Loading screen
│   └── player.tsx        # The Theater screen
├── components/           # Reusable UI components
├── constants/
│   └── Theme.ts          # Colors, fonts
└── utils/
    └── api.ts            # Fetch wrappers for backend calls
```

## Testing Strategy
- Use `jest-expo` for basic unit testing of utility functions and component rendering.
- For initial MVP testing, we will mock the API responses in `utils/api.ts` to ensure the UI flows perfectly without burning Gemini API credits.
