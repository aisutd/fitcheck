# FitCheck evening checkpoint — October 28, 2026

## What is in this branch

This branch includes the earlier weather, avatar onboarding and shopping work.
The runtime recommendation engine is a deterministic heuristic, not a trained
model or an LLM call. AI_PROMPT.md is a reference prompt, not the active backend.

| Requirement | Current status |
| --- | --- |
| Ten-question Know You quiz | Implemented, with drafts, review/edit and explicit save confirmation |
| Ranked top-three priorities | Implemented with saved-order weights 6/3/1 |
| Personal weather exceptions in Date Night | Implemented for supported answers and explicit garment metadata |
| Repeat observations to learn preference frequency | Not implemented; current evidence is individual quiz answers |
| Live avatar while answering | Implemented for cold/hot/rain outfit choices, using illustrative geometry |
| Circular clothing carousel | Arc carousel implemented; manual browsing plus explicit answer selection |
| Real shopping products in quiz carousel | Choice-specific loader implemented; live access remains unconfigured and unverified |
| Avatar after quiz | Implemented on first profile save; optional customization and continue action |
| Adaptive 3D quality | Studio startup adaptation plus manual Low/Standard; quiz uses lightweight rendering |
| Reduced motion/accessibility | Explicit controls, no automatic rotation, selection labels, progress, error fallback; assistive-tech audit pending |
| Editorial A+C presentation | Existing typography, sage/forest palette and restrained cards preserved |
| Shopping screen/backend | Implemented; missing pieces first, optional alternatives, USD budget and external links |
| Live Google Shopping results | Pending reachable hosting and private SerpApi key; no live request verified |
| Polyvore compatibility evaluation | Offline category baseline measured; runtime personalization and human evaluation remain separate |
| Skin-tone palette guidance | Not implemented; avatar tone is user-selected and does not infer race |
| Travel, sleepwear, concerts and social inspiration | Ideas discussed; no corresponding features implemented |
| iOS/Android | Platform bundles built; native runtime interaction verification remains pending |

## Changes in this checkpoint

- Authored sample wardrobe attributes make personalization visible in Demo Mode.
  These attributes are deliberately written fixtures, not image-model outputs.
- A Date Night tailored-shorts sample demonstrates the cold-weather shorts choice.
- That answer now also matches explicit minimal bottom coverage, rather than
  treating all lightweight pants as equivalent to shorts.
- Equal-score results favor more supporting details. Unknown details still do not
  count as mismatches, and the numeric score is not a confidence probability.
- A confirmed profile becomes active even if old-draft cleanup fails; a warning
  explains the partial storage failure instead of saying the profile was not saved.
- Weather-question previews share the Avatar Studio figure, use render-on-demand,
  provide explicit turn controls and preserve quiz answers if graphics fail.

## Reproducible validation

Recorded for this checkpoint: all 12 logic suites pass; lint reports no errors
or warnings; scoped JavaScript model checking passes; iOS, Android and web
bundles export successfully. Three.js scene properties are excluded from the
DOM-only unknown-property lint rule in the three scene-rendering files.

Run `npm test` for all logic suites, including simulated-provider HTTP shopping
checks. Run `npm run evaluate:checkpoint` for the JSON comparison report.

Four controlled cases check cold/light clothing, cold/warm clothing, hot/more
coverage and a waterproof rain layer. All four expected personalized behaviors
pass while returned items remain in the sample wardrobe and Date Night category.
These are authored examples, not a human preference study, model accuracy score,
causal effect estimate, or a Polyvore evaluation. The rain baseline already meets
its expected behavior; do not describe all cases as improvements over baseline.

## Meeting demonstration

1. Open Wardrobe and select Demo Mode; sample records stay separate from owned items.
2. Complete Know You: select a style, fit and exactly three ranked priorities.
3. In the cold-weather question choose Shorts & a Light Top. Observe the short
   bottoms preview, then browse other cards without changing answers. Use Add to
   answers to confirm a choice. A maximum of two answers is enforced explicitly.
4. Review answers and save. First-time users enter Avatar Studio; See outfits skips it.
5. Select Date Night and Cold. Inspect the outfit and Why this outfit details.
6. Edit the cold-weather answer to Warm Layers, save, and compare the top result.
7. Open shopping from an outfit. Show category and USD budget controls. Until the
   host/key is configured, explicitly demonstrate the unavailable state rather than
   claiming these are live products.
8. Show the evaluation JSON and explain its limited, synthetic scope.

## Mentor handoff: hosting and API

Hosting is being arranged by the mentor. SerpApi account/key ownership is unconfirmed.
The team must still decide who supplies the key and provider allowance.

- Runtime: Node 22 or newer.
- Start: `node server/shopping.cjs` from repository root.
- Health check: `/health` reports service readiness and whether shopping is configured.
- Private server variable: `SERPAPI_KEY` (host secret settings only).
- Optional server variables: `PORT`, `SHOPPING_WEB_ORIGIN` (exact frontend origin).
- Public app variable: `EXPO_PUBLIC_SHOPPING_API_URL` (HTTPS backend base URL only).
- After host configuration, rebuild/restart the app and verify an actual product
  query, budget filtering, linked retailer page and provider quota/error handling.
- Never put the provider key in an EXPO_PUBLIC variable, Git commit or chat message.

See server/README.md for cache, quota, CORS and prototype limitations. No deployment
or paid provider request has been performed as part of this checkpoint.

## Browser preview checks

The final exported build was opened in the browser. Selection and Continue, optional
question skipping, ranked selection, the cold-weather 3D preview and live changes
between shorts/light clothing and warm layers were exercised. A screenshot of the
shorts preview is included in the checkpoint outputs. This does not establish native
simulator or physical-device correctness.

## Deferred simulator verification

An iPhone 16 Pro simulator booted and Expo Go was installed, but the project showed
“Could not connect to the server.” Native interaction testing is not passed.
Simulator troubleshooting was deferred at the user's request. No Android emulator
was available in the checked local tool paths. Successful exports are bundle checks,
not proof of native UI, graphics, permission, persistence or accessibility behavior.

The next runtime pass must cover quiz resume/review/save, avatar graphics fallback,
return navigation, large text, screen-reader labels and shopping network states on
both platforms. Physical-device 3D verification remains necessary afterward.

Later update: see docs/CAROUSEL.md and docs/POLYVORE-EVALUATION.md for the carousel and real-data baseline. Simulator troubleshooting remains deferred; hosting/key ownership remains unconfirmed.
