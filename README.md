# FitCheck prototype

A small Expo app: choose your photo and a garment, tap Generate, and see the image returned by IDM-VTON. The original lavender design, camera/gallery picker and loading dots remain.

## Backend

From `C:\Users\annal\fitcheck\backend`, using Python 3.11+:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

All backend code is in `backend/main.py`: image validation, the `generate_tryon()` provider function, and the `/tryon` endpoint. Images are limited to 8 MB each and 20 megapixels, normalized without cropping, and kept only in a temporary folder. Each result gets a unique filename. The backend sends photos to the public Hugging Face IDM-VTON Space with automatic masking, 30 steps and seed 42. It checks the API schema and reports errors instead of showing a fake result. No model weights run locally.

If Hugging Face requires a token, set the backend environment variable `HF_TOKEN` before starting. Never place it in the frontend. The public demo can be busy or run out of GPU quota. It targets upper-body clothing, and its code/model license is noncommercial: https://huggingface.co/yisol/IDM-VTON . This is a local prototype, not a production server.

## Frontend

From `C:\Users\annal\fitcheck\frontend`:

```powershell
npm install
Copy-Item .env.example .env
```

Set `EXPO_PUBLIC_API_URL` in `.env` to `http://YOUR_COMPUTER_WIFI_IPV4:8000`. Find that address with `ipconfig`. A physical phone must use your computer's LAN address, not localhost. Keep both devices on the same network. Check `http://YOUR_COMPUTER_WIFI_IPV4:8000/health` in the phone browser if it cannot connect.

```powershell
npm start -- --clear
```

Scan the QR code in Expo Go. Restart Expo after editing `.env`. For a browser on the same computer, the API URL can be `http://localhost:8000`. Browser CORS allows localhost ports 8081 and 8085 by default; change backend `CORS_ORIGINS` for another origin.

## Main files

- `frontend/src/VirtualTryOn.tsx`: upload screen and generation button.
- `frontend/src/photos.ts`: camera/gallery selection.
- `frontend/src/tryOnApi.ts`: sends both photos to the backend.
- `frontend/src/TryOnResultScreen.tsx`: shows the returned image.
- `frontend/src/TryOnResultContext.tsx`: keeps the result in memory between screens.
- `frontend/src/app/`: the two Expo Router screens and shared layout.

Back and Try Another preserve uploads. Photos/results disappear when the app session ends. Other feature tabs remain placeholders. The old 3D demo, Save Look placeholder, test suites, API inspection scripts and unused Docker configuration have been removed. Removed files are recoverable outside the project under `Documents\Codex\2026-10-09\files-pasted-by-the-user-development-2\work\prototype-removed`.
