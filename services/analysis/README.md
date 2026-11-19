# FitCheck AI API

This server keeps the Gemini key outside the Expo bundle and validates images before forwarding
them to Gemini. It accepts JPG, PNG, and WebP files up to 8 MB.

## Run locally

1. Copy `.env.example` to `.env`.
2. Put a Gemini API key in `GEMINI_API_KEY`.
3. Run `npm install` and `npm start`.
4. Set `EXPO_PUBLIC_API_BASE_URL=http://localhost:8787` in `tagging-accuracy/.env` for web.
   For Expo Go on a phone, use the computer's LAN address instead of `localhost`.

The backend uses Gemini 3.8 Flash by default. Change `GEMINI_MODEL` to use another
image-capable Gemini model. Never place `GEMINI_API_KEY` in an `EXPO_PUBLIC_*` variable.
