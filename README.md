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

## Features

- `tagging-accuracy/` — Task 6: Catch the AI Being Unfair. A premium Expo/React Native tagging accuracy dashboard with demographic and clothing-dimension breakdowns, highlighted performance gaps, animated visualizations, and an AI accuracy information sheet.

## AI bias analysis

The existing upload experience is connected to `server/`, a Node API that keeps the Gemini key
outside the mobile bundle. Copy `server/.env.example` to `server/.env`, add a server-side
`GEMINI_API_KEY`, run `npm install && npm start` in `server/`, then configure the public backend URL
with `tagging-accuracy/.env.example`.

Single-image results are limited representational-risk assessments. They are not counted as
accuracy tests and are never presented as proof of algorithmic bias.
