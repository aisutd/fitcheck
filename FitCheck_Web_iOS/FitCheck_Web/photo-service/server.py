import io
import os
import uuid
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from PIL import Image
from werkzeug.utils import secure_filename
# Added for the "Recognize Clothes (Closet) + Add an Item" feature - see
# fashion_tagger.py for the actual FashionCLIP model wrapper this route
# calls into.
import fashion_tagger
from remote_images import download_image

app = Flask(__name__)
CORS(app)
STORAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'storage')
os.makedirs(STORAGE_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

@app.route('/photos', methods=['POST'])
def upload_photo():
    if 'photo' not in request.files:
        return jsonify({'error': "Missing 'photo' file in form data"}), 400
    photo = request.files['photo']
    original_name = secure_filename(photo.filename or '')
    extension = os.path.splitext(original_name)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        extension = '.jpg'

    filename = f'{uuid.uuid4().hex}{extension}'
    photo.save(os.path.join(STORAGE_DIR, filename))
    photo_url = f'{request.host_url.rstrip("/")}/photos/{filename}'
    return jsonify({'url': photo_url, 'filename': filename}), 201

@app.route('/photos/import', methods=['POST'])
def import_photo():
    payload = request.get_json(silent=True)
    url = payload.get('url') if isinstance(payload, dict) else None
    if not isinstance(url, str) or not url.strip():
        return jsonify({'error': 'Enter a direct image URL.'}), 400
    try:
        image_bytes = download_image(url.strip())
    except ValueError as error:
        return jsonify({'error': str(error)}), 400
    filename = f'{uuid.uuid4().hex}.jpg'
    with open(os.path.join(STORAGE_DIR, filename), 'wb') as destination:
        destination.write(image_bytes)
    tags = None
    tagging_error = None
    try:
        with Image.open(io.BytesIO(image_bytes)) as image:
            tags = fashion_tagger.tag_image(image.convert('RGB'))
    except Exception:
        app.logger.exception('URL image imported, but automatic tagging failed')
        tagging_error = 'Image imported, but automatic tagging is unavailable. Fill in the clothing fields manually.'
    return jsonify({
        'url': f'{request.host_url.rstrip("/")}/photos/{filename}',
        'filename': filename, 'tags': tags, 'tagging_error': tagging_error,
    }), 201


@app.route('/photos/<filename>', methods=['GET'])
def get_photo(filename):
    return send_from_directory(STORAGE_DIR, secure_filename(filename))

@app.route('/photos/<filename>', methods=['DELETE'])
def delete_photo(filename):
    file_path = os.path.join(STORAGE_DIR, secure_filename(filename))
    if os.path.exists(file_path):
        os.remove(file_path)
    return '', 204

# Added for the "Recognize Clothes (Closet) + Add an Item" feature - takes
# a photo (same multipart 'photo' field as /photos above, for consistency)
# and returns six flat attributes plus scores/predictions metadata, for
# fitcheck's Add form to auto-fill once that integration phase happens.
# Deliberately a separate endpoint from /photos rather than folded into
# upload_photo() - tagging is a slower, optional, best-effort step and a
# failure here shouldn't block a photo upload from succeeding.
@app.route('/tag', methods=['POST'])
# def tag_photo():
#     if 'photo' not in request.files:
#         return jsonify({'error': "Missing 'photo' file in form data"}), 400
#     image = Image.open(request.files['photo'].stream).convert('RGB')
#     result = fashion_tagger.tag_image(image)
#     return jsonify(result), 200

def tag_photo():
    file = request.files.get('photo')
    if file is None or file.filename == "":
        return jsonify({'error': "Missing 'photo' file in form data"}), 400

    try:
        image = Image.open(io.BytesIO(file.read())).convert('RGB')
        result = fashion_tagger.tag_image(image)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "error": type(e).__name__,
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)