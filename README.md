# FitCheck

FitCheck is an Expo and React Native fashion styling prototype. The current app
includes occasion-aware outfit suggestions, separate Personal and Demo
wardrobes, locally stored clothing photos, and a locally saved 10-question
Know You style quiz. Avatar Studio adds an interactive, locally rendered
stylized 3D avatar with saved appearance and camera controls.

Personalized suggestions use the saved quiz profile and metadata entered for
each clothing item. The three ranked priorities use weights 6 / 3 / 1 in saved
order. Match percentages are normalized only across available, relevant
metadata; a percentage is omitted when there is no supporting metadata.
Weather matching uses the condition selected in Suggest and explicit garment
weather tags, not a live forecast. Familiar, Balanced, and Creative variety
controls and rerolls do not override the selected occasion or available items.

## Development

```bash
npm install
npm start
```

Run the focused logic checks with:

```bash
npm run test:quiz
npm run test:wardrobe
npm run test:recommendations
npm run test:avatar
```

Quiz drafts, confirmed style profiles, wardrobe records, and demo availability
are stored locally on the device. Clothing photos are copied into the app's
local documents directory. FitCheck does not send these records or photos to a
backend.

Avatar appearance preferences are stored locally. The avatar is a stylized
illustration, not a body scan or garment fit simulation. The renderer uses
React Three Fiber, Three.js, and Expo GL. Expo SDK 57 includes Expo GL in
Expo Go, but iOS Simulator OpenGL support may be unreliable; verify rendering
on a physical iOS device before relying on it.

## Docker

`docker-compose.yml` is a generic starter configuration and is not required to
run the Expo application.

## Know You weather preferences

Cold-weather outfit choices and hot-weather coverage answers now influence
recommendation ranking when garments have explicit Warmth or Coverage details.
Add these optional details in the wardrobe editor. Unknown details are not guessed
from names or photos. An explicit cold-weather outfit choice takes precedence over
cold sensitivity; selecting both light and warm options permits either.

Personal weather matching replaces generic weather-tag matching when relevant
personal and garment details exist, retaining the ranked priority weights 6 / 3 / 1.
Otherwise the existing weather-tag behavior is retained. The selected occasion
and item availability still constrain every result. Explanations identify the quiz
answer used. This is a deterministic preference rule based on individual answers,
not a trained model, repeated-observation confidence, or a live forecast.

Run `npm run test:weather` for contrasting Date Night profiles and edge cases.
Device verification, repeated weather scenarios, avatar integration, and shopping
integration remain separate milestones.

## Avatar onboarding and preview quality

The first confirmed quiz profile opens Avatar Studio when avatar storage is ready.
Use See outfits to continue immediately; edits to an existing quiz profile return
to suggestions. Avatar appearance remains user-selected and locally saved.

Auto preview quality starts low, then uses reported graphics capability and startup
time: texture limits below 4096 or startup above 2.5 seconds retain low detail.
Low uses pixel ratio 1 and 10 geometry segments; Standard uses pixel ratio 1.5
and 24 segments. Manual selection overrides Auto for the current studio session.
This is startup adaptation, not continuous FPS or battery monitoring. The renderer
remains on-demand and retains its timeout, retry, and error fallback.

System reduced motion disables drag rotation; explicit view buttons remain usable.
There is no automatic avatar rotation. Quality selection is session-only; appearance
settings retain their existing storage format. Run `npm run test:render-quality`.
Physical-device motion, graphics, persistence and screen-reader checks remain pending.

## Shopping edit

Each outfit opens a dedicated Expo Router shopping route. Missing essentials are
selected first; complete looks offer optional alternatives. The editorial product
grid uses large images and restrained USD prices, with an optional maximum per
item. Product taps open external shopping links; products are never inserted into
the owned wardrobe. Searches run only after Find pieces is tapped.

See `server/README.md` for private SerpApi setup, the public backend URL, local
phone networking, hosting and limits. With no backend/key the app displays a clear
unavailable state. There are no fabricated listings or silent demo fallbacks.
Run `npm run test:shopping` for backend and normalization checks.

Expo Router now owns the app entry and shopping route; existing home quiz,
wardrobe and avatar views retain their current state and local persistence.

## October 28 checkpoint

See `docs/CHECKPOINT.md` for implemented features, remaining requirements,
mentor hosting handoff, demo instructions and verification limits. Run `npm test`
for all logic suites and `npm run evaluate:checkpoint` for controlled sample cases.
The weather quiz now previews illustrative sleeve lengths, bottoms and a layer
without changing the user's saved avatar appearance or quiz selections. The later orbit milestone adds arc browsing and an optional real-product example
loader; hosted live products and exact product garments remain unverified.

## Orbit carousel and dataset baseline

Weather questions now browse answer ideas in an arc around the avatar, with
explicit Add to answers confirmation. Choice-specific shopping examples are wired
for the hosted service; unavailable live data is clearly labeled. See
`docs/CAROUSEL.md` for behavior and verification limits.

`npm run evaluate:polyvore -- /path/to/polyvore-data` reproduces an offline
category-pair baseline on the original dataset. Its measured ROC-AUC is 0.735029
on 7,061 evaluable compatibility examples. This is neither app accuracy nor a
personalized match score; see `docs/POLYVORE-EVALUATION.md` for method and limitations.

## Standalone Suggest / Know You tools

Style memory records local outfit feedback with explicit per-mode enablement;
saved looks preserve references to complete outfits; travel capsules plan up to
five days from available wardrobe pieces. Concert, Travel and Sleepwear are new
explicitly tagged occasions, with footwear optional for Sleepwear. No teammate
services or account are required. See `docs/STANDALONE-SUGGEST.md` for limits,
learning behavior, storage, and verification. `npm test` includes the new checks.
