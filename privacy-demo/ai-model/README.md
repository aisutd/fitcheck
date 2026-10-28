# FitCheck privacy backend

This local prototype serves the existing Privacy & Data screen. It uses Supabase
for verified identities and owner-protected settings, private backend files for
photos, SQLite for photo metadata/activity, and scikit-learn Isolation Forest
for request-volume anomalies. No paid AI API or Supabase service-role key is needed.

## One-time setup

1. Enable anonymous sign-ins in your Supabase project for the standalone demo.
2. Run **all of `../supabase/SETUP_ALL.sql`** in Supabase SQL Editor. It is safe to
   rerun and includes owner-only DELETE permission needed by Delete All.
3. Keep the project URL and publishable key in `../.env.local`:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

4. Dependencies are installed in `.venv`. For another machine, from this folder:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

## Run

From `privacy-demo` or the workspace root, run `npm start`, then visit
http://localhost:8082. The command starts both servers. Keep the terminal running.
The backend health endpoint is http://127.0.0.1:8000/health.

## What is implemented

- Preferences load/save under the verified Supabase user session and RLS.
- Browser uploads accept real JPEG/PNG files up to 8 MB, with 50 files per account.
- Photo files live outside the Expo app in the workspace `.fitcheck-private`
  directory. The upload directory has no public URL. Preview requests verify the
  JWT and check ownership; supplying someone else's photo ID returns 404.
- Processing produces a resized, metadata-free PNG. Private Mirror or either
  protection flag instead produces a generic identity-free silhouette with no
  source pixels. This is conservative masking, not selective face detection,
  body-shape reconstruction, or a realistic virtual try-on model.
- After processing removes the original immediately. After 24 hours sets a
  deadline based on upload time. Keep until I delete retains it. Changing the
  policy updates existing retained originals. Deleted originals cannot return.
- A background task checks every 15 seconds and on backend startup. It retries
  failures. Failed processing has a one-hour original cleanup deadline. This
  worker runs independently of the screen, but the backend must remain running.
- Category deletion removes owned real files and saved category records. Closet
  deletion clears saved outfits. Individual photo deletion removes both files.
- Delete All removes the Supabase settings row, backend photo files/metadata,
  and activity logs/alerts. It keeps the authentication identity. No success is
  reported if a step fails; retrying is safe. Fresh subsequent requests create
  new activity logs. This is not an account deletion endpoint.
- Browser export downloads a ZIP with settings and retained files. Mobile JSON
  export contains metadata only; the upload picker is currently browser-only.
- Requests through the gateway are recorded by verified identity, not by a
  client-provided account ID. Logs exclude bodies, photos, tokens, and query values.
- Isolation Forest uses measured request volume and peak requests per minute.
  It scores five-minute windows after enough traffic arrives. It was calibrated
  on synthetic traffic; its accuracy on real users has not been established.
- Account activity shows only that user's flags. The development burst button
  makes 80 real read-only requests to that user's settings through the backend.
  A flag means review, not proven fraud, and does not automatically ban a user.

## Limits and integration

The realistic try-on/avatar generator, selective face/background processing,
retailer integration, and any content-training pipeline belong to the main app
and are not connected. Training/retailer consent is stored; this backend never
sends content to a training provider or retailer, regardless of the preference.
Preview metadata removal is a mandatory baseline, even if its preference is off.
Closet visibility is a saved choice; this prototype keeps private data owner-only
until a separate sharing implementation exists.

Monitoring covers routed privacy/photo operations, not Supabase login attempts
or calls made directly to Supabase. RLS protects those direct calls, but their
activity is not captured here. For production, route protected operations through
a mandatory backend or add trusted platform-side logging. This prototype does
not claim comprehensive fraud detection or production rate limiting.

Replace the anonymous fallback with the team's existing authenticated session at
integration. For hosted/mobile builds set `EXPO_PUBLIC_ACTIVITY_API_URL` to the
HTTPS backend URL and configure exact `APP_ORIGINS`. The local default is loopback
only; do not expose it directly as a production service. Deploy one backend
worker with persistent disk (or replace local files with private object storage)
and ensure scheduled cleanup is always running. Deletion is from active app
storage; provider/OS/OneDrive backups and files exported to a device have their
own retention. This workspace is under OneDrive, so use sample photos for demos.

Optional server-only configuration: `ACTIVITY_DB_PATH`, `PHOTO_STORAGE_PATH`,
`APP_ORIGINS`. None of these is an Expo public secret. Activity metadata is
pruned after seven days when requests are recorded; Delete All removes it now.

## Checks

```powershell
.\.venv\Scripts\python.exe -m unittest test_connection -v
```

Tests cover actual filesystem deletion, deadline cleanup, failed deletion,
retention changes, account ownership, API authentication/CORS, Delete All success
and failure, synthetic feature generation, and model burst scoring. API unit tests
mock Supabase; file and ML tests use actual local files and the real model.

With the servers running, `python verify_live.py` is an optional end-to-end check.
It creates two labeled anonymous test accounts in Supabase, touches only their
sample data, and checks settings/photo isolation, processing, export, a real
request burst, category deletion, and Delete All. Authentication identities remain
in Supabase's test-account list. No service-role key is used.
