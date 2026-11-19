# FitCheck integration report

## Audit and plan

Audit completed before application edits on 2026-11-04. Cloned aisutd/fitcheck, fetched origin with prune, inspected main and all thirteen requested remote tips using trees, source, manifests, history and diffs. Main contains only README and a placeholder Compose container. Recognition has no merge base with main; two-dot/tree comparison is required. No user changes existed in the initially empty workspace.

## Branch inventory and feature mapping

| Branch | Owner | Actual functionality | Source | Dependencies/framework | Configuration/persistence | Destination / known issues | Complexity |
|---|---|---|---|---|---|---|---|
| feature/vaibhav-suggest | Vaibhav Pathy | Expo 57 / JS; original quiz, avatar, manual wardrobe CRUD and deterministic occasion/profile recommendations | App.js; src/screens; src/features | AsyncStorage, image picker/manipulator, Three.js | Local device persistence; no backend/database | Preserved through descendant baseline; original homepage predates requested reference | Low |
| codex/standalone-suggest | Vaibhav Pathy | Latest editorial homepage; saved looks, opt-in style feedback, travel capsules, eight occasions | src/screens/SuggestScreen.js; StyleToolsScreen.js; features/suggest | Expo Router, SVG; same Expo foundation | EXPO_PUBLIC_SHOPPING_API_URL; local memory | Integration baseline: exact contributor homepage matching supplied text | Low |
| Try-On | AnnaBananaFanta | Photo selection/validation UI; FastAPI multipart proxy to Colab /generate; frontend generation was explicitly unconnected | frontend/src/VirtualTryOn.tsx; photos.ts; backend/app | Expo 57; FastAPI, httpx, dotenv; Python >=3.13 | COLAB_API_URL, COLAB_API_KEY; no database | Connect existing proxy to outfit/wardrobe photo actions; real person photo required; parametric avatar is not an accepted model input | High |
| AI-bias-Rating | ashishtilloo | Gemini single-image recognition/confidence and potential bias findings; saved human reviews and aggregate dashboard; not fashion taste rating | server/src; tagging-accuracy/src | Expo 54 frontend; Express, multer, Gemini REST | GEMINI_API_KEY, GEMINI_MODEL, PORT, ALLOWED_ORIGINS; EXPO_PUBLIC_API_BASE_URL; AsyncStorage | Port complete review/dashboard components to current SDK, retain schema 5 and score meanings | High |
| codex/carousel-evaluation | Vaibhav Pathy | Quiz orbit carousel (not outfit carousel); category co-occurrence Polyvore evaluator and AUC | features/quiz/carouselModel.js; features/evaluation; scripts/evaluate-polyvore.cjs | Same Expo; reanimated; Node evaluation scripts | External Polyvore input needed for fresh evaluation; no remote API | Already ancestor of baseline; preserve quiz behavior, reproducible scripts and limitations | Low |
| codex/checkpoint-readiness | Vaibhav Pathy | Live quiz avatar, profile commit recovery, controlled behavioral evaluation and checkpoint documentation | features/avatar; quiz/commitProfile.js; scripts/test-checkpoint.cjs | Same Expo; Three.js | Local persistence; sample behavioral evaluation is not model accuracy | Already ancestor; retain all checks | Low |
| privacy-demo-screen | Sally Duru | Supabase anonymous session/settings; photo retention and protected preview; export/delete; authenticated activity gateway and anomaly detector | privacy-demo/App.tsx; lib; ai-model; supabase migrations | Expo 57; Supabase JS; FastAPI, SQLite, sklearn, pandas, Pillow | EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, EXPO_PUBLIC_ACTIVITY_API_URL; ACTIVITY_DB_PATH, PHOTO_STORAGE_PATH, APP_ORIGINS; Supabase SQL migrations | Adapt complete screen; clearly separate cloud-managed photos from local wardrobe; preferences do not automatically govern independent AI services | High |
| recognize-clothes/fitcheck-app | scheungfish | Flask photo upload/import/tag; FashionCLIP with optional trained attribute heads; closet photo management; training and evaluation tooling | FitCheck_Web_iOS/FitCheck_Web/{fitcheck,photo-service} | Expo 57 JS; Flask, torch, transformers, Pillow | FASHIONCLIP_MODEL_PATH; classifier model paths in CLASSIFIERS.md; local photo filesystem; port 5050 | Unrelated history: selectively retain backend/training/assets and photo client, adapt flat attributes into existing wardrobe review form without guessing occasions | High |
| codex/shopping-integration | Vaibhav Pathy | SerpApi Google Shopping proxy; item/category/occasion/budget filters and merchant links | server/shopping.cjs; features/shopping; screens/ShoppingScreen.js | Node HTTP server; Expo Router | SERPAPI_KEY, PORT, SHOPPING_WEB_ORIGIN; EXPO_PUBLIC_SHOPPING_API_URL | Already ancestor; preserve private credential boundary and filter validation | Low |
| codex/avatar-onboarding | Vaibhav Pathy | Open avatar studio after first profile confirmation; responsive render quality and editable persistent body/style model | App.js; features/avatar; screens/AvatarStudioScreen.js | React Three Fiber; Three.js; Expo GL | AsyncStorage; no external avatar API | Already ancestor; no photoreal avatar export supported for Colab try-on | Low |
| codex/know-you-weather | Vaibhav Pathy | Quiz cold/hot/rain preferences feed known garment attribute ranking; weather is manually selected, no weather API | features/quiz/weatherPreferences.js; features/suggest/outfitRecommendations.js | Same Expo/JS; pure scoring modules | Local style profile, manually chosen condition | Already ancestor; preserve explicit preference vs learned comfort distinction | Low |
| Khushi-SearchScreen | Khushi Vyas | Interactive category filtering and open-ended Groq fashion search; standalone navigation buttons were alerts | screens/SearchScreen.js; App.js; server/server.js | Expo 57; Express/cors; Groq chat completions | GROQ_API_KEY missing config module; server port 5001; frontend hardcoded URL | Preserve category/filter and generation contract; repair config, validate response, link shopping and wardrobe matches instead of duplicate navigation | Medium |
| codex/fitcheck-dependabot-ci | Ali Benrami | Python/npm matrix validation, Compose check, weekly dependency updates; main was scaffold only | .github; requirements-dev.txt; .python-version | GitHub Actions, pytest; npm lockfiles | No runtime secrets; Python scaffold initially 3.11 | Adapt CI to actual integrated app and independently provisioned Python services | Medium |

## Integration decisions

Baseline: origin/codex/standalone-suggest (e43fb5a), a descendant of feature/vaibhav-suggest and all five incremental Vaibhav feature branches. Its exact homepage matches the requested hero, navigation, illustrations and eight occasion pills. The older primary branch has a different “Style Your Day” hero; selecting the contributor’s latest design preserves the requested reference without recreating it. All original history is retained. Independent branches were selectively ported to avoid conflicting root applications and server folder collisions. Never copy committed .env.local, generated builds, caches, pyc files or credentials.

Order: preserve baseline and run its tests; retain independent backend services and contributor modules; connect recognition to wardrobe review; connect search, try-on, analysis and privacy through current navigation; normalize only at API boundaries; validate and document. Keep services separate where different runtimes/contracts require it. No database/auth replacement.

## Final feature destinations

| Source work | Integrated destination |
|---|---|
| Vaibhav suggestion/UI + standalone | Existing `src/screens/SuggestScreen.js`, `OutfitArtwork`, recommendation modules, style-memory/travel screens and original tests retained. |
| Avatar, weather, checkpoint, carousel, shopping branches | Their complete changes are already ancestors of the baseline; retained without cherry-picking older versions over newer work. |
| Clothing recognition | `services/recognition/` retains Flask endpoints, FashionCLIP/attribute heads, annotations, reference photos, training and evaluation tools; existing photo client is under `src/features/recognition/`. Wardrobe now imports URLs, requests recognition and exposes editable raw results before saving. |
| Recognition closet + wishlist | Original `TabScreen`, dropdowns, collection hook, photo picker, styles and bundled sample assets under `src/features/collections/`; controlled adapters connect them to the same canonical wardrobe. Favorites, laundry, wear counts, filters, bulk actions and wishlist transfers are retained. |
| Try-On | Original photo picker/validation and upload interactions in `src/features/tryon/`; FastAPI proxy in `services/tryon/`. Added real multipart requests, error/timeout handling and generated-image rendering. |
| AI-bias-Rating | Complete original review/report components, persistence, schema 5 types and aggregation in `src/features/analysis/`; original Gemini server in `services/analysis/`. Selected wardrobe photos can seed analysis. |
| Khushi search | Original Groq prompt/model/request/response fields preserved in `services/search/`; category filtering, category selection and free-text generation adapted to editorial `SearchScreen`. All original occasion labels remain available. Search also uses existing local wardrobe filtering and opens item details or shopping. |
| Privacy | Complete screen, controls, exports, photo library, security activity and Supabase session/services in `src/features/privacy/`; authenticated gateway, physical retention/deletion, SQLite photo store, anomaly model and SQL migrations in `services/privacy/`. Missing configuration produces an informative page. |
| CI/Dependabot | Original workflow matrix, concurrency, aggregate gate, read-only checkout permissions and Compose validation preserved; added root web/iOS exports, browser tests, isolated backend tests and actual npm/Python dependency paths. |

## Architecture and data flow

Expo 57 / React Native remains the only application runtime. `src/app/_layout.js` mounts a single `FitCheckProvider` around Expo Router. Routes cover outfits, wardrobe, collections, quiz, avatar, shopping, saved/travel, search, try-on, photo analysis and privacy. Existing screens continue using their callbacks, now backed by Router; mounted routes retain their own screen identity. No second global navigation bar was introduced.

The provider owns profile/draft, wardrobe and avatar state. Wardrobe writes are serialized and functional updates read the last successfully persisted state, preventing bulk wishlist moves from losing preceding items. The recognition collection hook is controlled by that store instead of writing duplicate closet keys. Local style memory and analysis history keep their existing feature-specific persistence keys.

`collectionAdapter` explicitly converts source category names and dates while retaining brand, material, design, fit, favorite, laundry, wear count, photo and unknown contributor metadata. Existing `@fitcheck/clothes` and `@fitcheck/wishlist` records are copied into the canonical wardrobe on first load if it has no saved state; original keys remain untouched. Invalid legacy data fails visibly instead of being discarded. `src/models/integration.ts` documents common boundaries; runtime wardrobe validation remains authoritative.

The recognition adapter preserves the full response, including scores/predictions, and does not infer suitable occasions. The user reviews details and assigns occasions before the existing recommender can use the item. Dresses and suits are represented as one-piece garments; they satisfy top/bottom requirements without being relabeled as tops. Existing separate-piece scoring is retained. One-piece outfits can be saved and included in travel capsules. Wishlisted items are excluded from recommendations until moved into the personal closet.

Web wardrobe photos are persisted as processed data URIs, avoiding use of native-only file APIs or expired blob URLs. Native photo storage keeps the original file-system implementation. Bundled collection photos resolve through their original asset registry. Recognition-service photos are remote files; deleting a wardrobe record does not claim to delete that service’s file.

Service boundaries remain explicit: SerpApi → shopping; Groq → free-text outfit ideas; Flask/FashionCLIP → clothing tags; Colab proxy → try-on image; Gemini → single-image recognition/bias findings; Supabase/FastAPI → authenticated cloud privacy records/photos/activity. No new database or authentication provider was added.

## UI preservation

The requested hero, neutral background, serif headings, occasion pills, card artwork, ranking labels, favorites, Refine behavior and four primary navigation choices come directly from Vaibhav’s latest source. The older primary branch and latest descendant differ; the latest contributor-authored homepage is the one matching the supplied written reference. No separate reference screenshot was attached in this session.

The homepage receives only a Search action, a footer privacy link and contextual try-on/analysis actions inside expanded outfit details. New surrounding pages use extracted neutral/green tokens in `src/theme.js`. Contributor analysis/privacy/try-on interfaces keep their functional components and animations with adapted palettes. Collections stays inside Wardrobe as a secondary management route for its richer filters and wishlist; it does not add another outfit browsing interface.

## API configuration

See root `.env.example`, service `.env.example` files and README commands. No committed credentials or the privacy branch’s live `.env.local` were copied.

| Feature | Public app configuration | Server-only configuration / persistence |
|---|---|---|
| Shopping | `EXPO_PUBLIC_SHOPPING_API_URL` | `SERPAPI_KEY`, `PORT`, `SHOPPING_WEB_ORIGIN`; default integrated port **8789**, changed to avoid collision with analysis. Existing variable names preserved. |
| Search | `EXPO_PUBLIC_SEARCH_API_URL` | `GROQ_API_KEY`, `SEARCH_PORT` (5001); original source referenced undefined `config`; repaired with server environment lookup. |
| Recognition | `EXPO_PUBLIC_PHOTO_SERVICE_URL` | Optional `FASHIONCLIP_MODEL_PATH`, `FASHION_CLASSIFIERS_DIR`; port 5050; service-local photo filesystem. Inference needs Torch/Transformers and weights. |
| Try-on | `EXPO_PUBLIC_TRYON_API_URL` | `COLAB_API_URL`, `COLAB_API_KEY`; FastAPI port 8001; original `/generate` multipart contract retained. |
| Analysis | `EXPO_PUBLIC_API_BASE_URL` | `GEMINI_API_KEY`, `GEMINI_MODEL`, `PORT` (8787), `ALLOWED_ORIGINS`; schema 5 retained. |
| Cloud privacy | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_ACTIVITY_API_URL` | Same Supabase URL/publishable key, `APP_ORIGINS`, optional `ACTIVITY_DB_PATH`, `PHOTO_STORAGE_PATH`; port 8000; Supabase migrations, anonymous auth and local SQLite/photo store. |

URLs must be reachable from the target device, and web allowed origins must match the actual Expo/hosting origin. API keys remain server-side. Model endpoint/model-name availability must be verified with the owner’s credentials.

## Conflict resolution and contributor preservation

No blind merges or destructive Git operations were used. The integration branch starts from `e43fb5a`; its ancestor history preserves all Vaibhav incremental branches. Independent backends moved into separate service folders because several branches used incompatible root `server` modules and different runtimes. Existing endpoints and original model/business logic remain available.

The AI frontend originated on Expo 54. It now uses the main app’s Expo 57-compatible dependencies; one removed StyleSheet API and old blur prop were adapted. Animated values use stable state identities to satisfy current lint checks without changing animations. A narrow lint exception preserves storage-loading/edit-draft effects in imported privacy/collection components; it does not disable application-wide checks.

Recognition imports heavy model libraries lazily so upload/import and offline plumbing tests can run without downloading a model. Inference still calls the original CLIP/attribute pipeline; missing model dependencies cause an error rather than fabricated tags. The manual `test_model.py` smoke script is preserved but excluded from offline test discovery.

Search’s prompt and Groq model are preserved; undefined configuration was fixed, inputs/timeouts validated, and fabricated fallback outfit pieces removed. Invalid upstream results now fail visibly. Original placeholder navigation alerts were replaced by actual app destinations. Original handwritten-font/color treatment was superseded by the requested visual authority; no functional search behavior depends on it.

The try-on branch supplied a functional backend but an explicitly unconnected frontend. The original picker, validation, camera guidance and upload tabs were retained, while the generation action now sends its two images to that backend and displays the returned bytes. Competing “muse” navigation and coming-soon placeholders were excluded because the real FitCheck routes provide those destinations.

Privacy’s backend and Supabase schema are retained. Its deletion labels now explicitly say cloud-managed data, because the original cloud deletion cannot delete the integrated local wardrobe or independent service uploads. Public/friends visibility is still a stored preference, not implemented social sharing. No unsupported end-to-end privacy or retention guarantee was introduced.

Generated Expo logs/builds, Python bytecode, committed environment files and duplicate standalone root app/package configurations were excluded. Source-specific training notes are retained and their original directory references are called out in README. These exclusions do not remove runnable feature logic; source branch/file provenance is recorded in `docs/BRANCH_SOURCE_INDEX.md`.

## Testing

Local environment: macOS, Node 24.21.0, Python 3.14.7. CI targets Node 22 and Python 3.13. Tests use fixture providers where external credentials are unavailable.

| Command / check | Actual result |
|---|---|
| `git fetch origin --prune`, branch/tree/history/source inspection | All 13 requested branches plus main inspected. |
| `npm ci`; `npm ci --prefix services/search`; `npm ci --prefix services/analysis` | Passed after sandbox/network permissions were granted. |
| `npm test` | **17 suites passed**, including all 14 original suites plus recognition/collections integration, Groq HTTP contract and Gemini startup/configuration/upload validation. No live model calls. |
| `npm run typecheck` | Passed with strict TypeScript checks for imported typed modules. Existing JS remains `checkJs: false`. |
| `npm run lint` | Passed. |
| `npm run build:web -- --output-dir dist-web` | Passed; all integrated routes and assets bundled. |
| `npm run build:ios -- --output-dir dist-ios` | Passed native iOS/Hermes export. This is not simulator/device execution or a signed build. |
| `services/tryon`: `python -m pytest tests -q` | **3 passed**: input/config errors, original Colab multipart request and binary response, upstream failure. MockTransport replaces only the external provider. |
| `services/privacy`: `python -m unittest test_connection -v` | **14 passed**: owner isolation/auth, gateway routing, real synthetic-traffic detector, physical photo retention/deletion, failure recovery. Supabase HTTP is mocked. |
| `services/recognition`: `python -m unittest test_attributes test_evaluate_tagger test_remote_images test_train_categories -v` | **17 passed**: flat/structured tags, attribute training/plumbing, category constraints, URL validation/import and evaluation bookkeeping. Fixtures are synthetic; this does not measure live recognition accuracy. |
| `npm run check --prefix services/analysis`; same for search | Passed syntax checks. |
| `python -m pip check` | Passed. |
| Browser checks | Desktop and phone-sized Chromium journeys cover homepage, occasions, saving, saved/travel, wardrobe editing, quiz navigation, search, shopping, try-on/analysis/privacy routing, avatar controls and wishlist transfers. **8 passed** (four journeys each at desktop and phone viewport sizes). |

Initial failures were addressed: sandbox loopback/network restrictions; SDK 54 compatibility; route duplication on mounted stack screens; a privacy test dependency on committed environment configuration; recognition’s eager model import. Browser selector ambiguity was corrected with accessible collection item buttons. No existing test was deleted.

## Remaining limitations

- Live SerpApi, Groq, Gemini, Colab and Supabase calls were not executed: owner credentials/configuration were not provided. Request construction, validation and error paths are tested; successful production inference is not claimed.
- The inherited Kaggle `eval_accuracy.py` dataset-download/ground-truth helpers still raise `NotImplementedError`; the separate working CSV/attribute evaluation tools and their tests are retained. The `fashion_tagger.py` CLI now calls its real tagging function when dependencies/weights are available.
- FashionCLIP weights, optional trained heads and GPU inference were not downloaded/run. Training assets/scripts are preserved. The existing annotation set contains missing labels; no new recognition accuracy claim is made.
- A configured parametric avatar is not a valid input to the photographic try-on model. Real person/garment photos are required; no fake avatar try-on is shown.
- Weather is manual, as implemented in the source. No live weather provider was invented.
- Privacy account preferences and cloud photo cleanup do not automatically govern independent AI endpoints or local wardrobe data. Social visibility enforcement/sharing remains unimplemented in the source.
- Original Gemini report fields aggregate both confidence and reviewed correctness. Their computations are preserved; the surrounding UI explains that confidence is not independently measured accuracy.
- The preserved privacy photo uploader and private-preview viewer are browser-only, as in the source; mobile retains preferences, records, metadata exports and deletion controls. Native photo-based try-on/analysis use the separate integrated pickers.
- Browser tests emulate phone viewport/touch behavior in Chromium; they do not constitute iOS Safari or simulator/device validation. Android runtime and signed native builds were not tested.
- The original try-on backend still uses its contributor’s fixed model description/steps/seed. Model owners should verify suitability for garments beyond its initial tank-top example before production use.
- Dependency installation reported existing audit advisories (31 in the integrated app, including 6 high; 2 high in the analysis service). No forced/breaking dependency upgrades were applied. Review advisories before production deployment.
- GitHub Actions execution and remote hosting/deployment were not performed. No push or merge into main is authorized or performed.

## Native import follow-up

A reported Hermes startup failure in the static React Three Fiber import prevented
route modules from loading, producing misleading missing-default-export warnings.
The installed Three 0.186.1 CommonJS entry calls Node-only `process.emitWarning`
and uses Node `require(esm)`. Metro now resolves every bare `three` request to
`three.module.js`, keeping a single portable Three instance for application and
Fiber code. No route exports, avatar functionality, dependencies or credentials
were removed or replaced.

`node scripts/test-native-three.cjs` reproduces the old entry's failure with a
Hermes-style process object, checks iOS/Android/web resolution and verifies that
other imports still delegate to Metro. It passes. Typecheck, lint, web export and
unminified iOS export pass; the iOS bundle excludes `THREE_CJS_DEPRECATED`.
The browser run passed six journeys; two exceeded the existing overall timeout
on this busy machine. A simulator startup attempt reached Expo's loading screen
but has not established successful application rendering. Restart an existing
Metro session with `npx expo start --clear` to load the new resolver.
