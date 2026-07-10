# StoryLens Mobile App

This repository contains the mobile frontend for StoryLens, built using React Native and Expo. 

## The Quick App Creation Process

This entire mobile application was rapidly prototyped and scaffolded using the **Quick App Builder** AI workflow. 

### What is the Quick App Workflow?
The `quick_app` folder acts as an "App Factory". Instead of relying on a human to manually write code line by line, the Quick App workflow forces an AI agent through a rigorous, multi-step Software Development Life Cycle (SDLC):

1. **Ideation (`brief.md`)**: The AI interviews the user to understand the core requirements.
2. **Architecture (`generate.md`)**: The AI drafts a Product Requirements Document (PRD), a UI/UX wireframe spec, and an Engineering/System Design document. 
   *(Crucially, the AI is forced to pause here and await human approval and visual reference screenshots before proceeding.)*
3. **Implementation (`build.md`)**: The AI scaffolds the project (or pulls from a seed template) and uses subagents to build the frontend and backend in parallel, enforcing test-driven checkpoints.
4. **Integration (`api.md`)**: The AI wires the frontend securely to the external backend APIs.

### Why use this Workflow?
By forcing the AI to act like a Senior Software Engineer (gathering requirements and writing architecture docs *before* coding), we eliminate AI hallucination, prevent spaghetti code, and ensure the resulting app is robust, scalable, and exactly what the user envisioned.

## Running Locally

To run the app locally in development mode:
```bash
npm install
npx expo start
```

To run the production-ready Progressive Web App (PWA) build:
```bash
npx serve dist -l 8081
```
