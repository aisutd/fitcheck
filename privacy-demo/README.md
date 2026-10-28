# FitCheck Privacy & Data

An Expo screen connected to Supabase settings and a Python privacy backend.

## Required setup

Run `supabase/SETUP_ALL.sql` in your Supabase SQL Editor. It combines all columns,
owner-only policies, and DELETE privileges and is safe to rerun. Enable anonymous
sign-ins for this standalone prototype. Keep your Supabase project URL and
publishable key in `.env.local`.

## Start the complete app

From this folder or the workspace root:

```powershell
npm start
```

Open http://localhost:8082. This starts the backend at http://127.0.0.1:8000 too.
Keep the terminal running for timed photo cleanup. Dependencies are installed;
setup for another computer is documented in [ai-model/README.md](ai-model/README.md).

## Implemented

- Saved preferences with owner-only access.
- Real private sample-photo upload, protected previews, and retention cleanup.
- Individual/category deletion and Delete All app data (login identity remains).
- ZIP export with retained files in the browser; metadata JSON on mobile.
- Server-recorded activity and Isolation Forest burst flags, with a development
  burst-test button in Account activity.

Photo upload is currently browser-only. This is a local prototype; realistic
virtual try-on, retailer connections, and content-training services are separate
main-app integrations. See [backend details and tests](ai-model/README.md) for
exact privacy behavior, storage, monitoring coverage, and deployment requirements.
