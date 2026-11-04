> Historical audit: Length and Rise have since been retired from the active classification system. This report does not describe current training fields.

# Training label audit

Scope: 43 JSONL records; all 43 referenced images were opened and visually reviewed. Counts below describe existing annotations, not verified ground truth. No labels or models were changed.

Original labels.jsonl SHA-256: `ec6aa5ae004480d0f73f8de00959208faadf194a7cad79c822570faa6e875c43`

| Attribute | Labeled images | Missing | Classes |
|---|---:|---:|---:|
| item | 43 | 0 | 11 |
| category | 43 | 0 | 4 |
| color | 42 | 1 | 9 |
| design | 0 | 43 | 0 |
| material | 0 | 43 | 0 |
| length | 0 | 43 | 0 |
| fit | 0 | 43 | 0 |
| rise | 0 | 43 | 0 |

For each of design, material, length, fit and rise, all 43 records are missing labels. The single missing color is line 32, `clear-jacket.jpg`. “Not Applicable” has not been filled in automatically.

## Existing class counts and example images

### item

| Existing class | Images | Example filenames (up to 3) |
|---|---:|---|
| boots | 4 | `boots.jpg`, `BlackCrocodilePrintPointedWesternBootsPointedToe.webp`, `il_fullxfull.5515609380_4qli.webp` |
| dress | 3 | `woman-black-dress-cn63926165.jpg`, `purple-dress.jpg`, `red-dress.jpg` |
| dress shoe | 7 | `heels-1.jpg`, `heels-2.jpg`, `heels-3.jpg` |
| jacket | 4 | `men-shirt-2.jpg`, `leather-jacket.webp`, `clear-jacket.jpg` |
| jeans | 3 | `woman-blue-long-jean-cn63843522.jpg`, `black-jean_0.webp`, `jean-blue.png` |
| pants | 5 | `khaki-pants.jpg`, `slack-pants.jpg`, `jogger-black.avif` |
| shirt | 4 | `men-shirt.jpg`, `woman-shirt-1.jpg`, `green-shirt_.jpg` |
| shorts | 3 | `green-shorts.avif`, `istockphoto-1463785097-612x612.jpg`, `shorts-black.avif` |
| sneakers | 6 | `adidas-men.jpg`, `adidas-women.jpg`, `nike-men.jpg` |
| sweater | 2 | `woman-blue-sweater-cn62796634.jpg`, `woman-pink-sweater-cn63067173.jpg` |
| t-shirt | 2 | `t-shirt.jpg`, `t-shirt2.jpg` |

### category

| Existing class | Images | Example filenames (up to 3) |
|---|---:|---|
| Bottoms | 11 | `woman-blue-long-jean-cn63843522.jpg`, `khaki-pants.jpg`, `slack-pants.jpg` |
| Dresses | 3 | `woman-black-dress-cn63926165.jpg`, `purple-dress.jpg`, `red-dress.jpg` |
| Shoes | 17 | `adidas-men.jpg`, `adidas-women.jpg`, `boots.jpg` |
| Tops | 12 | `men-shirt-2.jpg`, `men-shirt.jpg`, `t-shirt.jpg` |

### color

| Existing class | Images | Example filenames (up to 3) |
|---|---:|---|
| Beige | 3 | `puma-men.jpg`, `woman-shirt-1.jpg`, `khaki-pants.jpg` |
| Black | 11 | `men-shirt.jpg`, `woman-black-dress-cn63926165.jpg`, `BlackCrocodilePrintPointedWesternBootsPointedToe.webp` |
| Blue | 3 | `woman-blue-long-jean-cn63843522.jpg`, `woman-blue-sweater-cn62796634.jpg`, `jean-blue.png` |
| Brown | 3 | `boots.jpg`, `men-shoe.jpg`, `men-shoes.jpg` |
| Gray | 3 | `slack-pants.jpg`, `jogger-grey.webp`, `jogger-o.jpg` |
| Green | 5 | `men-shirt-2.jpg`, `t-shirt.jpg`, `t-shirt2.jpg` |
| Pink | 2 | `woman-pink-sweater-cn63067173.jpg`, `red-dress.jpg` |
| Purple | 2 | `purple-dress.jpg`, `women-jacket.jpeg` |
| White | 10 | `adidas-men.jpg`, `adidas-women.jpg`, `heels-1.jpg` |

### design

| Existing class | Images | Example filenames (up to 3) |
|---|---:|---|
| No labeled classes | 0 | — |

### material

| Existing class | Images | Example filenames (up to 3) |
|---|---:|---|
| No labeled classes | 0 | — |

### length

| Existing class | Images | Example filenames (up to 3) |
|---|---:|---|
| No labeled classes | 0 | — |

### fit

| Existing class | Images | Example filenames (up to 3) |
|---|---:|---|
| No labeled classes | 0 | — |

### rise

| Existing class | Images | Example filenames (up to 3) |
|---|---:|---|
| No labeled classes | 0 | — |

## Proposed changes — approval required

No suggestion in this section has been applied. “Tentative” and “Uncertain” entries should remain blank until confirmed. Suggestions are intentionally incomplete where the photograph is insufficient.

| Line | Image | Attribute | Proposed label | Review status | Visible evidence |
|---:|---|---|---|---|---|
| 7 | `men-shirt-2.jpg` | category | Outerwear | Proposed — review before applying | Visible jacket construction; matches the existing jacket-to-Outerwear mapping. Line 7 is an overshirt-style jacket; confirm that item choice if you prefer shirt. |
| 24 | `leather-jacket.webp` | category | Outerwear | Proposed — review before applying | Visible jacket construction; matches the existing jacket-to-Outerwear mapping. Line 7 is an overshirt-style jacket; confirm that item choice if you prefer shirt. |
| 32 | `clear-jacket.jpg` | category | Outerwear | Proposed — review before applying | Visible jacket construction; matches the existing jacket-to-Outerwear mapping. Line 7 is an overshirt-style jacket; confirm that item choice if you prefer shirt. |
| 35 | `women-jacket.jpeg` | category | Outerwear | Proposed — review before applying | Visible jacket construction; matches the existing jacket-to-Outerwear mapping. Line 7 is an overshirt-style jacket; confirm that item choice if you prefer shirt. |
| 15 | `t-shirt.jpg` | design | Solid | Proposed — review before applying | Visible garment body is predominantly a single color without an obvious repeating print. Ignore seams, buttons, shadows and texture for this label. |
| 16 | `t-shirt2.jpg` | design | Solid | Proposed — review before applying | Visible garment body is predominantly a single color without an obvious repeating print. Ignore seams, buttons, shadows and texture for this label. |
| 17 | `woman-black-dress-cn63926165.jpg` | design | Solid | Proposed — review before applying | Visible garment body is predominantly a single color without an obvious repeating print. Ignore seams, buttons, shadows and texture for this label. |
| 20 | `woman-pink-sweater-cn63067173.jpg` | design | Solid | Proposed — review before applying | Visible garment body is predominantly a single color without an obvious repeating print. Ignore seams, buttons, shadows and texture for this label. |
| 26 | `khaki-pants.jpg` | design | Solid | Proposed — review before applying | Visible garment body is predominantly a single color without an obvious repeating print. Ignore seams, buttons, shadows and texture for this label. |
| 29 | `slack-pants.jpg` | design | Solid | Proposed — review before applying | Visible garment body is predominantly a single color without an obvious repeating print. Ignore seams, buttons, shadows and texture for this label. |
| 33 | `green-shirt_.jpg` | design | Solid | Proposed — review before applying | Visible garment body is predominantly a single color without an obvious repeating print. Ignore seams, buttons, shadows and texture for this label. |
| 34 | `white-shirt.jpg` | design | Solid | Proposed — review before applying | Visible garment body is predominantly a single color without an obvious repeating print. Ignore seams, buttons, shadows and texture for this label. |
| 37 | `green-shorts.avif` | design | Graphic | Proposed — review before applying | Visible printed lettering and small illustrated marks on the shorts. |
| 17 | `woman-black-dress-cn63926165.jpg` | length | Mini | Tentative — confirm garment length | Dress hem appears well above a typical knee-length silhouette; flat-lay image has no body reference. |
| 27 | `purple-dress.jpg` | length | Mini | Tentative — confirm garment length | Short dress silhouette; no wearer or measurement establishes actual hem position. |
| 28 | `red-dress.jpg` | length | Mini | Tentative — confirm garment length | Short dress silhouette; no wearer or measurement establishes actual hem position. |
| 37 | `green-shorts.avif` | length | Short | Proposed — review before applying | Clearly shortened leg panels on the shorts, rather than full-length trouser legs. |
| 38 | `istockphoto-1463785097-612x612.jpg` | length | Short | Proposed — review before applying | Clearly shortened leg panels on the shorts, rather than full-length trouser legs. |
| 42 | `shorts-black.avif` | length | Short | Proposed — review before applying | Clearly shortened leg panels on the shorts, rather than full-length trouser legs. |
| 18 | `woman-blue-long-jean-cn63843522.jpg` | material | Denim | Uncertain material — verify product specification or care label | Visible twill-like texture, jean construction and wash appearance support a denim candidate; exact composition and blend are not visible. |
| 30 | `black-jean_0.webp` | material | Denim | Uncertain material — verify product specification or care label | Visible twill-like texture, jean construction and wash appearance support a denim candidate; exact composition and blend are not visible. |
| 31 | `jean-blue.png` | material | Denim | Uncertain material — verify product specification or care label | Visible twill-like texture, jean construction and wash appearance support a denim candidate; exact composition and blend are not visible. |
| 18 | `woman-blue-long-jean-cn63843522.jpg` | fit | Wide-Leg | Uncertain fit — review with measurements or wearer photo | Leg panels appear broad through the lower leg. Flat product images cannot confirm fit on a wearer. |
| 31 | `jean-blue.png` | fit | Wide-Leg | Uncertain fit — review with measurements or wearer photo | Leg panels appear broad through the lower leg. Flat product images cannot confirm fit on a wearer. |
| 39 | `jogger-black.avif` | fit | Jogger | Uncertain fit — confirm silhouette classification | Visible elastic/drawstring waist and gathered or narrowed ankle cuffs support a jogger silhouette. Actual body fit remains unverified. |
| 40 | `jogger-grey.webp` | fit | Jogger | Uncertain fit — confirm silhouette classification | Visible elastic/drawstring waist and gathered or narrowed ankle cuffs support a jogger silhouette. Actual body fit remains unverified. |
| 41 | `jogger-o.jpg` | fit | Jogger | Uncertain fit — confirm silhouette classification | Visible elastic/drawstring waist and gathered or narrowed ankle cuffs support a jogger silhouette. Actual body fit remains unverified. |
| 1 | `adidas-men.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 2 | `adidas-women.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 3 | `boots.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 4 | `heels-1.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 5 | `heels-2.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 6 | `heels-3.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 9 | `men-shoe.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 10 | `men-shoes.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 11 | `nike-men.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 12 | `nike-women.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 13 | `puma-men.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 14 | `puma-women.jpg` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 22 | `BlackCrocodilePrintPointedWesternBootsPointedToe.webp` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 23 | `il_fullxfull.5515609380_4qli.webp` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 25 | `mil-boots.webp` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 36 | `ballet-shoes.webp` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 43 | `woman-shoes.webp` | length | Not Applicable | Proposed — review before applying | Image depicts footwear; garment-length taxonomy does not apply. |
| 1 | `adidas-men.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 2 | `adidas-women.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 3 | `boots.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 4 | `heels-1.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 5 | `heels-2.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 6 | `heels-3.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 7 | `men-shirt-2.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 8 | `men-shirt.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 9 | `men-shoe.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 10 | `men-shoes.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 11 | `nike-men.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 12 | `nike-women.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 13 | `puma-men.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 14 | `puma-women.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 15 | `t-shirt.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 16 | `t-shirt2.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 17 | `woman-black-dress-cn63926165.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 19 | `woman-blue-sweater-cn62796634.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 20 | `woman-pink-sweater-cn63067173.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 21 | `woman-shirt-1.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 22 | `BlackCrocodilePrintPointedWesternBootsPointedToe.webp` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 23 | `il_fullxfull.5515609380_4qli.webp` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 24 | `leather-jacket.webp` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 25 | `mil-boots.webp` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 27 | `purple-dress.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 28 | `red-dress.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 32 | `clear-jacket.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 33 | `green-shirt_.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 34 | `white-shirt.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 35 | `women-jacket.jpeg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 36 | `ballet-shoes.webp` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 37 | `green-shorts.avif` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 38 | `istockphoto-1463785097-612x612.jpg` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 42 | `shorts-black.avif` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |
| 43 | `woman-shoes.webp` | rise | Not Applicable | Proposed — review before applying | Visible item is outside the current pants/jeans rise scope. This is an applicability label, not a measured rise. |

## Leave unresolved for review

- **Color, line 32:** the jacket is transparent/clear with reflections and a grey background. Do not label it Gray solely from the background. The current color vocabulary has no Clear/Transparent value; choose a policy or leave blank.
- **Material, all 43 images:** verify a care label or product specification. Denim candidates above are visual suggestions, not confirmed fiber composition. Smooth or shiny shoes/jackets could use leather, synthetic, coated textile or mixed materials; do not choose from appearance alone. Knitted sweaters do not establish Wool, Cotton or a blend.
- **Fit, all 43 images:** flat/product photos do not establish size or fit on a body. The shape-based candidates above need review. Footwear width and snugness cannot be measured from these photos.
- **Rise, eight pants/jeans records:** lines 18, 26, 29, 30, 31, 39, 40, 41. No rise label is proposed: waistbands without body landmarks or rise measurements cannot reliably distinguish Low-, Mid-, High- or Ultra rises.
- **Other lengths/designs:** cropped product framing, no wearer/scale, tonal texture, decorative shoe panels and prints can make taxonomy choices ambiguous. Leave blank rather than force a class.
- **Existing item annotations:** broad shoe labels such as dress shoe combine heels, flats and formal shoes; they are valid current vocabulary but may warrant a separate taxonomy review. No item relabeling is proposed here.

## Photos without JSONL records

These four files have no annotation record and are not included in the 43-record counts:
- `socks-images.jpg`
- `socks-mix.webp`
- `socks-thick.webp`
- `socks.webp`

No labels are inferred from these names. They were not included in the corresponding-record visual review and need a separate review before adding records. Accessories remains excluded.

## Training readiness

Item, category and color have enough existing counts for the nested trainer’s minimum stratified holdout checks; this is not an accuracy or data-quality endorsement. Four jacket categories conflict with the shared taxonomy. Design, material, length, fit and rise currently have zero labels and cannot be trained. The stricter parent trainer will reject inconsistent item/category pairs until reviewed. No training was performed.
