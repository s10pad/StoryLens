# StoryLens

Welcome to StoryLens, the AI-powered story visualization engine!

## Overview
StoryLens allows you to transform a simple text premise into an immersive media experience. It supports multiple output formats driven by state-of-the-art AI generation pipelines.

### New Features & Improvements
- **Monorepo Architecture**: Cleanly separated into `backend`, `frontend`, and `mobile_app` so it's easy to manage code, environments, and testing in one place.
- **Dual-Engine Architecture**: 
  - **Live Action/Animation/Anime**: Powered by **Google Veo** to generate high-fidelity, temporally consistent video scenes.
  - **Graphic Comic/Storyboard**: Powered by **Imagen 3** for stunning static frames, enhanced dynamically via FFmpeg Ken Burns effects for cinematic motion without the video generation overhead.
- **Robust Resilience**: Integrated a powerful retry and fallback mechanism for HTTP 503 (Service Unavailable) errors, ensuring your generation pipelines don't fail when the AI APIs are under heavy load.

---

## Getting Started

Because StoryLens is now a Monorepo, you must run each layer of the stack from its respective folder.

### 1. The Backend (Node.js API)
The central nervous system that orchestrates AI generation.

```bash
cd backend
npm install
npm start
```
*Runs on `http://localhost:3001`.*
*Note: Make sure your `.env` file contains your credentials (Anthropic, Fal.ai, etc.).*

### 2. The Web Frontend (Next.js)
The web-based studio for creating and managing trailers.

```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:3000`.*

### 3. The Mobile App (React Native / Expo)
The pocket studio for on-the-go generation.

```bash
cd mobile_app/app
npm install
npm start
```
*Note: The mobile app automatically points to the local backend on port 3001. If you test on a physical device, ensure both are on the same Wi-Fi or update the `.env` URL to match your local IP.*

---

## Verification & Automated Testing

You can run automated visual testing and health checks on the backend using the included verify scripts in the `backend/` directory:

```bash
cd backend
npm test
```
This tests all endpoints and uses Puppeteer to take a screenshot and pixel-diff it against a baseline.

## Tunneling for Remote Testing
If you are running the backend locally but want to test on your phone or share with friends, use Pinggy:

1. **Expose Backend**: `ssh -p 443 -R0:127.0.0.1:3001 a.pinggy.io`
2. **Update App**: Update the `EXPO_PUBLIC_API_URL` in `mobile_app/app/.env` to the provided Pinggy URL.
