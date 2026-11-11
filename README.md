# FitCheck

An integrated Expo 57 / React Native application for web, iOS and Android. Vaibhav’s editorial outfit homepage, questionnaire, avatar, wardrobe, saved looks, style memory, travel planner and shopping flow remain the foundation. Recognition, collections/wishlist, Groq search, Gemini analysis and cloud privacy tools are connected through Expo Router and shared wardrobe state.

For the latest completion status and remaining service setup, see [docs/FINAL-INTEGRATION.md](docs/FINAL-INTEGRATION.md).

See [INTEGRATION_REPORT.md](INTEGRATION_REPORT.md) for the branch inventory, preservation decisions, actual validation results and limitations.

## Start the app

Use Node 22+ (local validation used Node 24). From the repository root:

```sh
npm ci
npm ci --prefix services/search
npm ci --prefix services/analysis
cp .env.example .env.local
npm run web
```

`npm run ios` and `npm run android` start Expo for those platforms. A physical phone needs reachable LAN service URLs in `.env.local`; `localhost` on a phone refers to the phone. Native modules require the compatible Expo Go/development build. No simulator testing is claimed.

Run these commands from `fitcheck`, not `fitcheck/privacy-demo`. The standalone
privacy demo has its own `.env.local`; Expo does not read that file for the
integrated app. Put the same public Supabase URL and publishable key in
`fitcheck/.env.local`, together with `EXPO_PUBLIC_ACTIVITY_API_URL=http://127.0.0.1:8000`.
Configure `services/privacy/.env.local` using its example. `npm run web` starts
the configured local privacy backend before opening the integrated app on port
8081. It uses `fitcheck/.venv`, or the existing `privacy-demo/ai-model/.venv`.
`npm run privacy:server` starts only the backend. Restart `npm run web` after setup.

You can use the quiz, manual wardrobe, avatar, local outfit recommendations, saved looks and travel planner without external API keys. Open Wardrobe → Demo Mode to explore authored sample clothes. Personal and sample closets remain separate. Weather is manually selected in Refine; the quiz’s weather preferences affect known garment attributes.

The homepage exposes Search and Privacy & data. Outfit details and personal clothing cards expose try-on and photo analysis. Wardrobe → Collections & wishlist preserves the recognition contributor’s favorites, laundry, wear counts, filters, sample photos and bulk wishlist transfers. Set suitable occasions in the main wardrobe form before a new item can appear in recommendations. Recognition results are editable suggestions, never ground truth.

## Backend setup

Python 3.13+ is recommended; lightweight service tests were run locally on Python 3.14. Keep model inference dependencies in a separate environment if your Torch build requires a different supported Python version.

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
```

Run required services in separate terminals. API keys belong only in service `.env.local` files or server environment variables. The root `.env.local` contains public service origins and the Supabase publishable key only.

| Service | Start from repository root | Configuration |
|---|---|---|
| Shopping | `npm run shopping:server` | Copy `server/.env.example` to `server/.env.local`; set `SERPAPI_KEY`. Port 8789; `SHOPPING_WEB_ORIGIN` must match your browser origin. |
| AI search | `npm run search:server` | Copy `services/search/.env.example` to `.env.local` in that directory; set `GROQ_API_KEY`. Port 5001. |
| Photo analysis | `npm run analysis:server` | Copy `services/analysis/.env.example` to `.env.local` there; set `GEMINI_API_KEY`, confirm an accessible `GEMINI_MODEL`, and set `ALLOWED_ORIGINS`. Port 8787. |
| Try-on | `.venv/bin/python -m uvicorn app.main:app --app-dir services/tryon --host 0.0.0.0 --port 8001` | Copy `services/tryon/.env.example` to `.env.local` there. Set `COLAB_API_URL` and `COLAB_API_KEY` for the original `/generate` model endpoint. |
| Recognition | `.venv/bin/python services/recognition/server.py` | Install `services/recognition/requirements.txt` in an inference-compatible environment. Port 5050. Optional `FASHIONCLIP_MODEL_PATH` and `FASHION_CLASSIFIERS_DIR` in `services/recognition/.env.local`. The first inference downloads FashionCLIP weights unless a local model is supplied. |
| Privacy | `.venv/bin/python -m uvicorn server:app --app-dir services/privacy --host 0.0.0.0 --port 8000` | Copy `services/privacy/.env.example` to `.env.local` there. Configure the same Supabase URL/publishable key as the app; enable anonymous sign-in and apply `services/privacy/supabase/SETUP_ALL.sql`. Set `APP_ORIGINS`. |

Try-on sends a real person photo and a garment photo as multipart inputs and displays the model’s returned image. The local parametric avatar has no compatible photographic export. Analysis preserves single-image recognition confidence, human reviews and potential bias findings; its values are not outfit taste ratings or independently measured population accuracy.

Privacy controls manage Supabase preferences and photos uploaded through the privacy service. They do not control local wardrobe storage, recognition-service files, or independent AI provider retention. Cloud deletion is labeled accordingly. No credentials, account, SQL deployment or live model setup is provisioned automatically.

Recognition training/evaluation tools, annotations and reference images are retained under `services/recognition/`. The unmodified source notes describe their original paths; use this integrated path when following those documents. `test_model.py` explicitly downloads model weights and is a manual smoke script, not part of offline CI.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build:web -- --output-dir dist-web
npm run build:ios -- --output-dir dist-ios
npx playwright install chromium
npm run test:web
```

With Chrome already installed, you can use `CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:web` on macOS. The test preview runs on port 8081. `npm run serve:web` serves an exported `dist-web` bundle locally.

Run backend tests separately to avoid collisions between their modules named `server`:

```sh
(cd services/tryon && ../../.venv/bin/python -m pytest tests -q)
(cd services/privacy && ../../.venv/bin/python -m unittest test_connection -v)
(cd services/recognition && ../../.venv/bin/python -m unittest test_attributes test_evaluate_tagger test_remote_images test_train_categories -v)
```

CI retains the contributor’s aggregate CI gate and dependency automation, adds actual app exports/browser journeys, and runs service tests without live provider calls. The Compose file remains the original development shell container; it does not launch the application or its services.

## Native startup troubleshooting

If Expo Router reports missing default exports together with an import failure in
`QuizAvatarPreview`, restart Metro after configuration changes:

```sh
npx expo start --clear
```

The routes already export components. Three r186’s CommonJS compatibility entry
calls Node-only `process.emitWarning`, which is unavailable in Hermes.
`metro.config.js` resolves all `three` imports/requires to its portable ES module,
including React Three Fiber’s native imports. Keep this resolver when updating Metro
configuration; do not patch `node_modules` or remove the avatar to bypass the error.
`node scripts/test-native-three.cjs` checks this compatibility boundary.
