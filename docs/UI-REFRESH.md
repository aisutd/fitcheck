# Outfit screen refresh

The Suggest screen now prioritizes browsing outfits: compact navigation, a small
quiz callout, occasion tabs, optional weather/variety filters and a responsive
three/two/one-column outfit grid. Each look has one-tap saving, a shopping action
and expandable pieces, feedback and match explanations. The quiz, avatar, wardrobe,
shopping and style tools screens retain their existing functionality and styling.

References inspected: COS new arrivals (https://www.cos.com/en-us/women/new-arrivals),
Aritzia All New (https://www.aritzia.com/us/en/new), and Zara new arrivals
(https://www.zara.com/us/en/woman-new-in-l1180.html). Category browsing and visual
hierarchy informed this design; no claims about conversion rates or usability study
results are made. No retailer photographs or brand assets were copied.

Clothing photos are shown when available. Otherwise, labeled category illustrations
use wardrobe colors. These are approximate visual aids, not exact garment renderings
or virtual try-on. The Expo-compatible react-native-svg dependency renders them on
web and native platforms. Failed photos fall back to illustrations.

Validation: all 14 logic suites pass; Expo lint and scoped non-strict JavaScript
checks pass for the changed UI components. Web, iOS and Android exports succeeded.
Browser interactions checked weather filters, details, feedback availability,
explanations, shopping navigation and optional-shoe Sleepwear. A 390px phone-width
layout and the default laptop layout were visually inspected. Font scaling uses a
single-column layout above 1.3; actions have at least 44px targets. Native interaction
verification and live API shopping remain pending. User preference records and the
recommendation scoring model were not changed.
