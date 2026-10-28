# Import an online image

Start the photo service with `python3 server.py`. In FitCheck's Add Item or Clothing Item Details form, tap **Import from URL**, paste a direct HTTP/HTTPS image URL, and tap **Use Image**. Fill in the clothing fields and save as usual.

Use your browser's **Copy Image Address** option. Product page links normally contain HTML and cannot be imported. Some websites block image downloads.

Imports are limited to 10 MB and 25 megapixels, converted to JPEG, and stored in `photo-service/storage`. The item references the local saved copy, so it does not depend on the original image URL remaining available. URL imports run the existing clothing tagger to suggest name, category, color, design, and material. Review these suggestions before saving. If tagging fails, the image still imports and a warning asks you to fill in the fields manually.

Restart the service after updating its Python source. Run URL import checks with `python3 -m unittest test_remote_images.py` from this directory.
