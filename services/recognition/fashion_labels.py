# Added for the FashionCLIP "Recognize Clothes" feature (see fashion_tagger.py).
# #
# CLIP-family models (and FashionCLIP) don't have a fixed set of output
# classes - zero-shot classification works by embedding a list of candidate
# text strings and picking whichever is closest to the image embedding. So
# "the model's vocabulary" is really just whatever strings we hand it here,
# and the requirement doc's "enhancement" step (better candidate text) is
# really just editing these lists/templates, not touching the model itself.
# #
# These mirror fitcheck's own dropdown options in
# ../fitcheck/constants.js (CATEGORIES/COLORS/DESIGNS/MATERIALS) minus the
# "All" filter-only entry, since the whole point is to auto-fill
# those exact fields - picking a label CLIP can't return would be useless.
# Kept as a plain Python copy rather than importing the JS file directly;
# if fitcheck's lists change, update both by hand.
CATEGORY_LABELS = [
    "Tops",
    "Bottoms",
    "Dresses",
    "Outerwear",
    "Suits",
    "Shoes"
]

ITEM_TO_CATEGORY = {
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
    "sneakers": "Shoes",
}

COLOR_LABELS = [
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
    "Other"
]
DESIGN_LABELS = [
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
    "Other"
]
MATERIAL_LABELS = [
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
    "Other"
]

# Turns a bare label ("Red") into the kind of descriptive sentence CLIP was
# trained on ("a photo of a red piece of clothing") - the "basic" phrasing.
# Each field gets its own template since "a photo of Tops" reads worse than
# "a photo of a Tops item"; keeping templates per-field (instead of one
# generic "a photo of {label}") is what the requirement doc's step 4 calls
# "enhancing" via better candidate text.
def basic_prompt(label, field):
    templates = {
        "category": "a photo of {article}",
        "color": "a photo of a {label} piece of clothing",
        "design": "a photo of clothing with a {label} pattern",
        "material": "a photo of clothing made of {label}",
    }
    if field == "category":
        return templates[field].format(article=_with_article(label))
    return templates[field].format(label=label.lower())

def _with_article(label):
    return f"a {label.lower()}" if not label[0].lower() in "aeiou" else f"an {label.lower()}"

# "Enhanced" prompt variant (requirement doc step 4): instead of describing
# each field in isolation, combine the already-known/guessed fields from the
# other passes into one richer sentence per candidate, e.g.
# "a photo of a red cotton dress" instead of just "a photo of Suits/Dresses".
# combo() lets fashion_tagger.py build that composite string once it has
# already picked color/material/category from earlier passes - see
# tag_image()'s second pass in fashion_tagger.py.
def combo_prompt(category_label, color_label=None, material_label=None):
    parts = []
    if color_label:
        parts.append(color_label.lower())
    if material_label:
        parts.append(material_label.lower())
    parts.append(category_label.lower())
    return f"a photo of a {' '.join(parts)}"

CLOTHING_FITS = {
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
}

def fit_labels_for_category(category):
    return CLOTHING_FITS.get(category, [])



FIELDS = ('item', 'category', 'color', 'design', 'material', 'fit')
FIELD_LABELS = {
    'item': list(ITEM_TO_CATEGORY), 'category': CATEGORY_LABELS,
    'color': COLOR_LABELS, 'design': DESIGN_LABELS, 'material': MATERIAL_LABELS,
    'fit': list(dict.fromkeys(x for values in CLOTHING_FITS.values() for x in values)),
}


def allowed_labels(field, category=None, item=None):
    if field == 'item' and category:
        return [label for label, group in ITEM_TO_CATEGORY.items() if group == category]
    if field == 'fit' and category:
        return fit_labels_for_category(category)
    return FIELD_LABELS[field]
