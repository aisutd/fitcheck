# Added for the "Recognize Clothes" requirement doc's steps 1-4: download
# the Kaggle "Fashion Product Images Small" dataset (free category/color
# answer key), run FashionCLIP on a sample, compare guesses to the real
# labels, and report accuracy - then repeat with the "enhanced" (combo)
# prompts to show whether the richer candidate text actually helps.
# #
# This is an offline dev/eval script, not part of the live app - it's
# never called by server.py or fitcheck. Run it by hand after changing
# fashion_labels.py's prompt templates to check whether accuracy improved
# or regressed.
# #
# NOT runnable yet in this environment - needs both the model weights
# (blocked on the same expired-proxy-cert issue as fashion_tagger.py) and
# the Kaggle dataset itself (downloaded via kagglehub, which also needs
# working HTTPS + a Kaggle API token in ~/.kaggle/kaggle.json). Written to
# show the intended steps/shape; fill in the real calls once both
# downloads are possible.
# import kagglehub
# import pandas as pd
# from PIL import Image

import os
import random
from fashion_tagger import tag_image
SAMPLE_SIZE = 25 # requirement doc asks for 20-30 images.
RANDOM_SEED = 42 # fixed seed so re-runs sample the same images - otherwise
# an accuracy change between runs could just be "different random sample"
# noise instead of a real effect of the prompt-template change being tested.
# Kaggle dataset slug for "Fashion Product Images Small" (searched on
# Kaggle per the requirement doc - small variant keeps the download size
# manageable for a 20-30 image spot-check instead of the full ~25GB
# original dataset).
KAGGLE_DATASET = "paramaggarwal/fashion-product-images-small"

# Downloads (or reuses a prior local copy of) the dataset and returns the
# local directory kagglehub cached it in. Separated into its own function
# so main() reads top-to-bottom as the eval steps themselves, not dataset
# plumbing.
def download_dataset():
    raise NotImplementedError(
    "kagglehub needs working HTTPS to kaggle.com, currently blocked - "
    "see module docstring."
    )
# return kagglehub.dataset_download(KAGGLE_DATASET)

# The dataset's styles.csv has one row per image with columns including
# articleType (maps to our "category") and baseColour (maps to our
# "color") - this loads it and narrows to just the columns this eval
# script actually compares against, rather than the full ~10-column
# dataset schema.
def load_ground_truth(dataset_dir):
    raise NotImplementedError
    # csv_path = os.path.join(dataset_dir, "styles.csv")
    # df = pd.read_csv(csv_path, on_bad_lines="skip")
    # return df[["id", "articleType", "baseColour"]]

# The dataset's own category/color label spellings (e.g. "Tshirts",
# "Navy Blue") don't exactly match fitcheck's CATEGORIES/COLORS vocabulary
# (e.g. "Tops", "Blue") - this is a best-effort mapping from dataset labels
# to our label set, needed so "correct" can be judged at all. Deliberately
# coarse/lossy (many dataset articleTypes collapse onto one of our 5
# categories) since the goal is comparing against our vocabulary, not
# reproducing the dataset's finer-grained one.
CATEGORY_LABEL_MAP = {
"Tshirts": "Tops", "Shirts": "Tops", "Tops": "Tops", "Sweaters": "Tops",
"Jackets": "Tops", "Hoodie": "Hoodies",
"Jeans": "Bottoms", "Trousers": "Bottoms", "Shorts": "Bottoms", "Skirts": "Bottoms",
"Socks": "Socks",
"Casual Shoes": "Shoes", "Sports Shoes": "Shoes", "Formal Shoes": "Shoes", "Sandals": "Shoes",
"Dresses": "Suits/Dresses", "Suits": "Suits/Dresses",
}
COLOR_LABEL_MAP = {
"Navy Blue": "Blue", "Blue": "Blue", "Teal": "Blue",
"White": "White", "Off White": "White",
"Black": "Black", "Charcoal": "Black",
"Red": "Red", "Maroon": "Maroon",
"Green": "Green", "Olive": "Green",
"Yellow": "Yellow", "Mustard": "Yellow",
"Pink": "Pink", "Purple": "Purple", "Orange": "Orange",
"Brown": "Brown", "Tan": "Brown", "Khaki": "Brown",
"Grey": "Gray", "Silver": "Gray",
"Beige": "Beige",
}

# Picks SAMPLE_SIZE random rows that have a ground-truth category we can
# actually map (via CATEGORY_LABEL_MAP) - skipping rows whose dataset
# category has no fitcheck equivalent instead of letting them auto-count
# as wrong, which would understate accuracy for reasons unrelated to the
# model itself.
def sample_rows(ground_truth_df):
    raise NotImplementedError
    # mappable = ground_truth_df[ground_truth_df["articleType"].isin(CATEGORY_LABEL_MAP)]
    # random.seed(RANDOM_SEED)
    # return mappable.sample(n=min(SAMPLE_SIZE, len(mappable)))

# Runs tag_image() on one sampled row's photo and reports whether the
# category/color guesses matched the (mapped) ground truth - returns a
# dict of per-field booleans rather than a single pass/fail, since
# category and color are scored/reported independently (a model doing well
# on one and poorly on the other is useful signal the single-number
# version would hide).
def score_one(dataset_dir, row):
    raise NotImplementedError
    # image_path = os.path.join(dataset_dir, "images", f"{row['id']}.jpg")
    # image = Image.open(image_path).convert("RGB")
    # result = tag_image(image)
    # expected_category = CATEGORY_LABEL_MAP.get(row["articleType"])
    # expected_color = COLOR_LABEL_MAP.get(row["baseColour"])
    # return {
    # "category_correct": result["category"] == expected_category,
    # "color_correct": result["color"] == expected_color,
    # }

# Prints accuracy as (# correct / # sampled) per field - the requirement
# doc's step 3 ("calculate your accuracy"). Kept as a plain print rather
# than returning a value since this script's whole purpose is to be run by
# hand and read the printed output, not imported elsewhere.
def report_accuracy(results):
    total = len(results)
    if total == 0:
        print("No scored rows - nothing to report.")
        return
    category_correct = sum(r["category_correct"] for r in results)
    color_correct = sum(r["color_correct"] for r in results)
    print(f"Sampled {total} images")
    print(f" category accuracy: {category_correct}/{total} ({category_correct/total:.0%})")
    print(f" color accuracy: {color_correct}/{total} ({color_correct/total:.0%})")

def main():
    dataset_dir = download_dataset()
    ground_truth_df = load_ground_truth(dataset_dir)
    sampled = sample_rows(ground_truth_df)
    results = [score_one(dataset_dir, row) for _, row in sampled.iterrows()]
    report_accuracy(results)

if __name__ == "__main__":
    main()