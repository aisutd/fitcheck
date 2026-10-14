# FitCheck

## Description

FitCheck is an AI-powered virtual wardrobe and personal stylist for web and mobile. Users can try on clothes virtually, organize a digital closet, and receive outfit suggestions based on occasions, preferences, and items they already own.

## Planned Technologies

- Python and JavaScript/TypeScript
- React Native with Expo
- Node.js and Express
- Firebase
- Replicate, CLIP, Google Cloud Vision, Claude, and SerpAPI

## Docker Setup

Make sure Docker Desktop is installed and running.

```bash
docker compose up -d
docker compose down
docker compose ps
```

This is a generic starter configuration. The team can add project-specific dependencies and startup commands later.

## Privacy & Data demo

The standalone Expo / React Native / TypeScript screen is in [`privacy-demo`](privacy-demo/README.md).

```bash
cd privacy-demo
npm ci
npm run web
```

Open the localhost address printed in the terminal. For Expo Go on a phone, use `npm start` and scan the QR code.

The demo includes closet visibility, Private Mirror, photo retention, AI and shopping consent controls, editable preferences, category deletion, a mock closet export, and a privacy policy preview. All data is local mock data; no backend or actual AI/photo processing is connected.
