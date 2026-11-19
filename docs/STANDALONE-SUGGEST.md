# Standalone Suggest / Know You increment

This branch adds local features to Vaibhav's Suggest/Know You work without merging
teammates' branches or requiring hosted services. It includes the earlier quiz,
avatar, carousel, shopping scaffolding and evaluation milestones.

## New local features

### Style memory with an explicit enable switch

Each outfit can receive Like this, Not my style, Too warm, Too cold or Comfortable
feedback. Comfort feedback requires a manually selected weather condition. Records
are scoped by Personal/Demo mode, occasion, weather, outfit signature and the
device's calendar day. Repeating a response for the same look/day replaces it;
clicking repeatedly does not manufacture repeated evidence. Style and comfort
responses are separate dimensions.

A weather lesson requires at least three comfort observations and at least
two-thirds agreement toward lighter or warmer clothing. Comfortable observations
count toward the denominator. This is a transparent heuristic, not a trained
model, physiological assessment or confidence probability. No generalization is
made from Date Night to Gym, from cold to hot, or from Demo to Personal records.

Learning is off by default in each mode. The user reviews counts and individual
observations in Style memory before enabling it. While on, future supported
patterns apply automatically for their exact context. A supported lesson replaces
only warmth preference matching; existing coverage preferences and ranked 6/3/1
weights remain. Saved quiz answers are never rewritten. Turning the switch off
restores quiz-only matching. Likes/dislikes only break equal match-score ties and
do not alter percentages. Individual observations can be removed and lessons are
recomputed. Up to 200 feedback records are retained across both modes.

### Saved looks

Save complete outfit suggestions locally and remove them when no longer wanted.
Up to 50 looks are retained across both modes. Stored looks contain item IDs,
name snapshots, occasion and weather—not copies of photos or new wardrobe items.
On opening Saved looks, records resolve against the current mode's wardrobe.
Deleted, unavailable or differently tagged pieces are identified; no deleted item
is restored. Saved looks are separated by mode. Partial suggestions cannot be saved
as complete looks, and no notification, account or external sharing is involved.

### Travel capsules

Choose one to five days, each with its own occasion and optional manual weather.
The planner considers each day's top three complete available-wardrobe suggestions.
It chooses the combination with the fewest distinct pieces, then lower total rank,
then a deterministic item signature. This is exhaustive only within those daily
top-three candidates, not a global optimum across every possible outfit.

The packing list shows re-used items and the days they serve. If any day has no
complete outfit, the planner reports the missing days instead of inventing pieces
or presenting an incomplete capsule as complete. No forecasting, location, laundry,
fit/size validation or luggage-capacity model is included. Plans are session-only.

### Concert, Travel and Sleepwear occasions

All eight occasion values share a central local definition used by Suggest,
wardrobe tagging and the shopping request validator. The original five remain
supported. Existing personal items are not automatically assigned new tags.
Users must explicitly tag suitable pieces. Authored Demo examples demonstrate the
new categories and stay separate from owned clothing.

Sleepwear requires a top and bottom; shoes are optional. Other occasions retain
the top/bottom/shoes requirement. Partial-outfit convenience scores are now clamped
so missing essentials cannot produce a percentage above 100.

## Storage and failure behavior

Suggest memory uses its own versioned AsyncStorage key. Loading or writing it does
not overwrite the quiz, wardrobe or avatar. Invalid stored records are rejected;
writes are serialized and published to the UI only after persistence succeeds.
A failed load disables memory changes and offers Retry. Other app features remain
available. Saved-look and travel context loading has its own retry and does not
claim availability when current records cannot be read.

## Verification and scope limits

New logic checks cover evidence thresholds, same-look/day deduplication, mode and
occasion isolation, explicit learning enablement, unchanged quiz data, favorite
resolution, new occasion tags, optional sleepwear shoes, packing reuse and missing
or unavailable pieces. `npm test` runs these along with all prior suites.

This increment does not integrate Search, clothing recognition, Magic Mirror,
privacy-service models or hosted shopping. API deployment must use the same updated
occasion vocabulary before using the new contexts online. Skin-tone matching,
social-media image analysis and exact garment fitting are not implemented. Native
simulator troubleshooting and physical-device checks remain deferred; successful
platform bundles are not native interaction certification.

### Recorded verification

All 14 logic suites pass, including the shopping HTTP tests with a mock provider.
Expo lint passes. Scoped JavaScript typechecking passes for the occasion, memory,
travel and weather models with non-strict JavaScript settings. Web, iOS and Android
exports succeeded. Browser checks verified saved-look and observation persistence,
learning enable/disable, removal, and a two-day travel capsule reusing five pieces.
Native interaction and live shopping verification remain pending.
