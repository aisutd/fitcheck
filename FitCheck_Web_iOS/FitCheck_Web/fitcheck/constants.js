// Base URL of the local photo-service (a separate standalone app - see
// ../photo-service/README.md relative to this project) that
// owns photo storage - the app uploads picked photos here and stores only
// the returned URL on the item, instead of a blob:/data:/file: reference
// that doesn't survive a restart. Plain http (not https) on purpose: when
// pointing this at a different machine later, just change this one
// constant - nothing else in the app needs to change.
export const PHOTO_SERVICE_URL = 'http://localhost:5050';
export const CATEGORIES = [
    "All",
    "Tops",
    "Bottoms",
    "Dresses",
    "Outerwear",
    "Suits",
    "Shoes"
];
// On a browser window much wider than a phone, the content area is capped
// to this width (and centered - see styles.container) so cards stay phone-
// sized instead of stretching across the whole window. 480 comfortably
// covers the widest common phone screens (e.g. iPhone Pro Max ~430px) with
// a little breathing room; narrower windows (actual phones) are unaffected
// since Math.min just passes their own width through.
export const MAX_CONTENT_WIDTH = 480;
// 3 cards per row: content width minus the container's own left/right
// padding and the two gaps between cards, divided by 3.
export const GRID_HORIZONTAL_PADDING = 20; // matches container.paddingHorizontal
export const GRID_GAP = 12; // matches clothingGrid.gap
// The grid lives inside a web ScrollView, whose own vertical scrollbar (once
// enough items overflow one screen) eats into its content width after
// CARD_WIDTH is computed from the full window width - without reserving this
// gutter up front, 3 cards' worth of width no longer fits once the scrollbar
// appears, and the grid silently drops to 2 per row. 17px covers the widest
// common desktop browser scrollbar; phones use an overlay scrollbar that
// doesn't take up layout width, so this is a no-op there.
export const SCROLLBAR_GUTTER = 17;
// 390 is the iPhone 16 viewport width the category-chip sizing below was
// last tuned against (fits all 6 chips with no overflow/scrolling).
const CATEGORY_CHIP_BASE_WIDTH = 390;
// All of the below were previously computed once at module load from
// Dimensions.get('window').width - that only reflects the window size at
// first app load, so switching device/viewport size afterward (e.g. Chrome
// DevTools' device toolbar switching from iPhone to Pixel without a full
// reload) left every one of these stale, causing the grid and category
// chips to silently keep the old screen's sizing (and overflow on a
// narrower one). getResponsiveLayout(windowWidth) instead takes the current
// width as an argument, so callers that re-read it on every render (e.g.
// via React Native's useWindowDimensions() hook, which does update live on
// resize/orientation/device-emulation changes) get sizing that's always
// correct for whatever width is active right now.
export function getResponsiveLayout(windowWidth) {
    const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH);
    const cardWidth = (contentWidth - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP * 2 - SCROLLBAR_GUTTER) / 3;
    // Exact width of one full row (3 cards + the 2 gaps between them). The
    // grid itself is pinned to this width and centered as a single block
    // (see TabScreen.js) rather than centering each wrapped row individually
    // - that way a trailing partial row (e.g. 2 leftover items) lines up on
    // the left under the full rows above it instead of floating centered on
    // its own.
    const gridWidth = cardWidth * 3 + GRID_GAP * 2;
    // Grid card photo box size - scales down with cardWidth on narrow
    // screens (e.g. a real phone, ~390px wide) instead of
    // styles.imagePlaceholder's fixed 120px, which overflows/clips once
    // cardWidth's own content area (cardWidth minus clothingCard's 10px
    // padding on each side) drops below 120px. Only applied to the grid's
    // own photo box - the Add/Detail modals have a full modal's width to
    // work with and keep the fixed 120px size.
    const gridImageSize = cardWidth - 20;
    // Grid card height - styles.clothingCard's fixed 190px assumed the old
    // fixed 120px photo box; shrink/grow it by the same amount gridImageSize
    // differs from 120 so a smaller photo on a narrow screen doesn't leave a
    // gap of blank space before the name/details text below it.
    const gridCardHeight = 190 + (gridImageSize - 120);
    // Category chip sizing (applied inline in TabScreen.js's category
    // quick-tabs) scales with the available content width instead of using
    // a fixed pixel size tuned only for one phone width - a wider screen
    // gets slightly bigger chips instead of leaving unused space, while a
    // narrower one shrinks the same way cardWidth does.
    const categoryChipScale = contentWidth / CATEGORY_CHIP_BASE_WIDTH;
    return {
        cardWidth,
        gridWidth,
        gridImageSize,
        gridCardHeight,
        categoryChipPaddingVertical: 7 * categoryChipScale,
        categoryChipPaddingHorizontal: 8 * categoryChipScale,
        categoryChipFontSize: 12 * categoryChipScale,
        categoryTabsGap: 6 * categoryChipScale,
    };
}
export const COLORS = [
    "All",
    "White",
    "Black",
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Pink",
    "Purple",
    "Orange",
    "Brown",
    "Gray",
    "Tie-Dye",
    "Beige",
    "Maroon",
    "Other",
];
export const DESIGNS = [
    "All",
    "Solid",
    "Plain",
    "Striped",
    "Plaid",
    "Floral",
    "Polka Dot",
    "Graphic",
    "Ribbed",
    "Knitted",
    "Lace",
    "Embroidered",
    "Pleated",
    "Ruffled",
    "Classic",
    "Minimal",
    "Sporty",
    "Casual",
    "Formal",
    "Elegant",
    "Distressed",
    "Layered",
    "Textured",
    "Patterned",
    "Other",
]
export const LAUNDRY_STATUSES = [
    'All',
    'Clean',
    'Dirty',
    'In Washer',
]
export const MATERIALS = [
    "All",
    "Cotton",
    "Denim",
    "Leather",
    "Synthetic",
    "Polyester",
    "Nylon",
    "Silk",
    "Linen",
    "Wool",
    "Cashmere",
    "Velvet",
    "Corduroy",
    "Mesh",
    "Knit",
    "Fleece",
    "Spandex",
    "Blend",
    "Satin",
    "Suede",
    "Canvas",
    "Chiffon",
    "Jersey",
    "Stretch",
    "Tweed",
    "Rubber",
    "Metallic",
    "Bamboo",
    "Hemp",
    "Other",
]
export const TIMES_WORN = [
    "All",
    "Never Worn",
    "Worn Once",
    "2-5",
    "6-10",
    "11-20",
    "20+",
]
export function matchesTimesWorn(count, selection){
    const worn = Number(count) || 0
    switch (selection){
        case 'Never Worn': return worn === 0;
        case 'Worn Once': return worn === 1;
        case '2-5': return worn >=2 && worn <=5;
        case '6-10': return worn >=6 && worn <= 10;
        case '10-20': return worn >=10 && worn <=20;
        case '20+': return worn > 20;
        default: return true;
    }
}
export const CLOTHING_FITS = {
    "Tops": [
        "Skinny",
        "Slim",
        "Fitted",
        "Regular",
        "Relaxed",
        "Loose",
        "Oversized",
        "Boxy",
        "Tailored",
        "Athletic",
        "Compression",
        "Muscle"
    ],
    "Bottoms": [
        "Skinny",
        "Slim",
        "Slim Straight",
        "Straight",
        "Regular",
        "Relaxed",
        "Loose",
        "Baggy",
        "Wide-Leg",
        "Extra Wide-Leg",
        "Bootcut",
        "Flared",
        "Bell-Bottom",
        "Tapered",
        "Carrot",
        "Mom",
        "Boyfriend",
        "Girlfriend",
        "Dad",
        "Barrel-Leg",
        "Balloon",
        "Jogger"
    ],
    "Dresses": [
        "Bodycon",
        "Fitted",
        "Slim",
        "Regular",
        "Relaxed",
        "Loose",
        "Oversized",
        "A-Line",
        "Fit-and-Flare",
        "Shift",
        "Sheath",
        "Empire Waist",
        "Wrap",
        "Mermaid",
        "Trumpet",
        "Column",
        "Ball Gown"
    ],
    "Outerwear": [
        "Slim",
        "Fitted",
        "Regular",
        "Relaxed",
        "Loose",
        "Oversized",
        "Boxy",
        "Tailored",
        "Athletic",
        "Straight",
        "Cocoon",
        "A-Line"
    ],
    "Suits": [
        "Skinny",
        "Slim",
        "Modern",
        "Tailored",
        "Regular",
        "Classic",
        "Relaxed",
        "Athletic",
        "Oversized",
        "Straight"
    ],
    "Shoes": [
        "Extra Narrow",
        "Narrow",
        "Standard",
        "Wide",
        "Extra Wide",
        "Relaxed",
        "Snug",
        "Adjustable",
        "Roomy Toe Box"
    ]
};

export function getClothingFits(category) {
    return CLOTHING_FITS[category] || ["Not Applicable"];
}

export const ITEM_TO_CATEGORY = {
    "t-shirt": "Tops",
    "shirt": "Tops",
    "blouse": "Tops",
    "coat": "Outerwear",
    "jacket": "Outerwear",
    "sweater": "Tops",
    "hoodie": "Outerwear",
    "suit": "Suits",
    "jeans": "Bottoms",
    "pants": "Bottoms",
    "shorts": "Bottoms",
    "skirt": "Bottoms",
    "dress": "Dresses",
    "boots": "Shoes",
    "dress shoe": "Shoes",
    "sneakers": "Shoes"
};
export function getItemLabels(category) {
    return Object.keys(ITEM_TO_CATEGORY).filter((item) => ITEM_TO_CATEGORY[item] === category);
}
