# StoryLens
Welcome to StoryLens, the AI-powered story visualization engine!

## Overview
StoryLens allows you to transform a simple text premise into an immersive media experience. It supports multiple output formats driven by state-of-the-art AI generation pipelines.

### New Features & Improvements
- **Dual-Engine Architecture**: 
  - **Live Action/Animation/Anime**: Powered by **Google Veo** to generate high-fidelity, temporally consistent video scenes.
  - **Graphic Comic/Storyboard**: Powered by **Imagen 3** for stunning static frames, enhanced dynamically via FFmpeg Ken Burns effects for cinematic motion without the video generation overhead.
- **Robust Resilience**: Integrated a powerful retry and fallback mechanism for HTTP 503 (Service Unavailable) errors, ensuring your generation pipelines don't fail when the AI APIs are under heavy load.
- **Progressive Web App**: We now export our React Native (Expo) frontend as a high-performance PWA for immediate cross-platform browser testing—no app store downloads required.

## Getting Started

### 1. Backend Server
Navigate to the root directory and start the Node.js server:
```bash
npm install
node server.js
```
*Note: Make sure your `.env` file contains your Google Gemini SDK credentials.*

### 2. Frontend Application
StoryLens now features a dedicated mobile-first frontend located in the `mobile_app` folder. 
To serve it to users globally:
```bash
cd mobile_app/app
npx serve dist -l 8081
```

## Tunneling for Remote Testing
If you are running the backend and frontend locally but want to test on your phone or share with friends, use Pinggy:

1. **Expose Backend**: `ssh -p 443 -R0:127.0.0.1:3001 a.pinggy.io`
2. **Expose Frontend**: `ssh -p 443 -R0:127.0.0.1:8081 a.pinggy.io`

*(Update the `EXPO_PUBLIC_API_URL` in the frontend's `.env` to match the backend tunnel before serving).*
