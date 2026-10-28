# Add wardrobe photos yourself

Open the iOS Simulator. From `FitCheck_Web/fitcheck`, run:

```sh
npm run photos:watch
```

Leave that terminal running and save AVIF, JPG, JPEG, PNG, WebP, or GIF images into `public/item-photos`. The watcher refreshes the app photo references and imports new image contents into the running Simulator's Photos library. In FitCheck, use **Add Photo → Photo Library**, select your photo, fill in the fields, and save.

For a one-time import instead, run `npm run photos:sync`. Preview pending imports with `npm run photos:sync -- --dry-run`.

Successful imports are tracked by image contents and Simulator ID in `.expo/simulator-photo-imports.json`, so subsequent runs skip unchanged files, even when renamed. The first run can duplicate images previously imported manually. If you erase the Simulator or remove imported photos and want to reimport them, delete this tracking file. Removing a source file does not delete photos or wardrobe items.

Start the upload service in another terminal with `cd FitCheck_Web/photo-service` and `python3 server.py` (from the repository root). Keep it running for Photo Library uploads and URL imports. Alternatively, use **Import from URL** inside FitCheck with a direct image link and skip Simulator importing entirely.

AVIF images are automatically converted to PNG before importing. Original AVIF files stay in the folder; generated PNG names include a content hash to avoid collisions. Mislabeled JPG/PNG files are repaired automatically, with originals backed up in `.expo/original-photos`. Conversion uses Python 3 and Pillow with AVIF support (`python3 -m pip install --upgrade pillow`). The refresh and sync commands perform the same conversion. Keep `publicPhotos.js` and its referenced files for previously saved `public-photo:` selections. Those references are refreshed by the sync/watch commands, or separately with `npm run photos:refresh`.
