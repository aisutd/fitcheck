# Know You orbit carousel

The weather questions show three adjacent outfit-idea cards in an arc around the
avatar. Previous/Next wraps through the full group. Browsing and tapping a card
change the preview only; Add to answers explicitly selects it. Remove from answers
removes it. A selection summary preserves visibility of choices not currently in
the arc. At the two-answer limit, browsing remains possible while adding another
choice is disabled with an explanation. Existing review and saved-profile approval
are unchanged. Warmth, heat-tolerance, coverage and rain follow-up controls remain
below the carousel.

No automatic spin or animated transitions are used. Explicit turn buttons rotate
the avatar. Cards and controls expose text labels and selected-answer status;
layout grows with system font scale. Native screen-reader and large-text tests
remain pending, even after browser checks.

## Live product examples

When EXPO_PUBLIC_SHOPPING_API_URL is configured, Load a real shopping example
requests one choice-specific, allowlisted search. This button does not select an
answer. A thumbnail replaces only that idea's illustrated card; the retailer,
price, source and retrieval time appear below, with an external shopping link.
The result illustrates one piece, not the full outfit, and never becomes an owned
wardrobe item or an exact 3D garment.

The existing /shopping endpoint now accepts optional quizChoice. IDs and matching
categories are validated against a fixed mapping in carouselModel.js; arbitrary
provider query text is not accepted through that field. Existing cache, request
coalescing, timeout and limits also apply. The request sends a Casual search context
and the selected outfit-idea ID/category; it does not send photos or the full quiz.

With no configured backend, the screen explicitly identifies illustrated ideas
and unavailable live shopping. No calls are made, and no simulated listings are
shown as real. A missing key, hosted URL or provider result must not block the quiz.
Changing focus or leaving the screen aborts the request; stale responses cannot
replace another idea's preview. Product examples are held only for this question
session and are not saved to the user's style profile.

Live provider, thumbnail and external-link behavior require the hosted service/key.
Neither has been supplied at this checkpoint. Simulator work remains deferred.

## Recorded checks

All 12 logic suites pass, lint has no errors or warnings, scoped model checking
passes and iOS/Android/web bundles export. The browser was used to resume a draft,
browse without changing its two answers, verify the third-choice limit, explicitly
remove/add an answer, and inspect the arc and avatar together. Native runtime and
live-provider behavior remain unverified. Source data for the offline evaluation
is separate from the carousel and is never bundled into the app.
