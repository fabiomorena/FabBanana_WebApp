import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from PIL import Image
import io
import base64
import logging

# --- Konfiguration ---
app = Flask(__name__)

# Setup Logging
if not app.debug:
    logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Globale Model-Variable
model = None


def init_model():
    """Initialisiert das Gemini-Modell sicher"""
    global model
    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            logger.error("GOOGLE_API_KEY Umgebungsvariable nicht gesetzt")
            return False

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash-image-preview')
        logger.info("Gemini-Modell erfolgreich initialisiert")
        return True
    except Exception as e:
        logger.error(f"Fehler bei der Modell-Initialisierung: {e}")
        return False


# Initialisiere das Modell beim Start
init_model()


# --- Hilfsfunktionen ---
def process_api_request(prompt, images=None):
    """
    Zentrale Funktion zur Verarbeitung von API-Anfragen an das Gemini-Modell.
    """
    if not model:
        return None, "Google API Key ist nicht konfiguriert oder das Modell konnte nicht geladen werden."

    try:
        content = [prompt]
        if images:
            for img in images:
                content.append(img)

        response = model.generate_content(content)

        # Überprüfe die Antwort auf Bild- und Textdaten
        image_data = None
        text_response = ""

        for candidate in response.candidates:
            for part in candidate.content.parts:
                if part.inline_data:
                    image_data = part.inline_data.data
                if hasattr(part, 'text'):
                    text_response += part.text

        # Wenn Bilddaten gefunden wurden, gib sie zurück
        if image_data:
            print("INFO: Bilddaten erfolgreich von der API empfangen.")
            return image_data, None

        # Wenn keine Bilddaten, aber Text gefunden wurde, gib diesen als Fehler zurück
        if text_response:
            print(f"WARNUNG: Keine Bilddaten von der API erhalten. Textantwort: '{text_response}'")
            return None, f"Die API hat ein Text anstelle eines Bildes zurückgegeben: {text_response}"

        # Fallback, falls die Antwort leer ist
        return None, "Keine Bilddaten oder Text in der API-Antwort gefunden."

    except Exception as e:
        # Gib eine detailliertere Fehlermeldung aus
        print(f"API-Fehler bei der Anfrage: {e}")
        # Versuche, genauere Fehlerdetails aus der Antwort zu extrahieren, falls vorhanden
        error_details = getattr(e, 'response', e)
        return None, f"Ein unerwarteter API-Fehler ist aufgetreten: {error_details}"


def image_to_base64(image_data):
    """Konvertiert Bilddaten zu Base64"""
    return base64.b64encode(image_data).decode('utf-8')


def optimize_image(image_file, max_size=(1024, 1024)):
    """Optimiert das Bild, um Speicherverbrauch zu reduzieren"""
    try:
        image = Image.open(image_file.stream)

        # Konvertiere zu RGB falls nötig (entfernt Transparenz)
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')

        # Reduziere Bildgröße falls zu groß
        if image.width > max_size[0] or image.height > max_size[1]:
            image.thumbnail(max_size, Image.Resampling.LANCZOS)

        return image
    except Exception as e:
        logger.error(f"Fehler bei der Bildoptimierung: {e}")
        raise


# --- Routen ---
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/process-image', methods=['POST'])
def process_image_endpoint():
    if 'prompt' not in request.form:
        return jsonify({'error': 'Kein Prompt übermittelt'}), 400
    if 'image' not in request.files:
        return jsonify({'error': 'Kein Bild übermittelt'}), 400

    try:
        prompt = request.form['prompt']
        image_file = request.files['image']

        if image_file.filename == '':
            return jsonify({'error': 'Leeres Bild übermittelt'}), 400

        # Optimiere das Hauptbild
        image = optimize_image(image_file)

        # Behandle optionale zweites Bild
        images_to_process = [image]
        if 'image2' in request.files and request.files['image2'].filename != '':
            image2_file = request.files['image2']
            image2 = optimize_image(image2_file)
            images_to_process.append(image2)

        # API-Anfrage mit Timeout
        image_data, error = process_api_request(prompt, images=images_to_process, timeout=30)

        if error:
            logger.error(f"API-Fehler bei process-image: {error}")
            return jsonify({'error': f"API-Fehler: {error}"}), 500

        base64_image = image_to_base64(image_data)
        return jsonify({'image': base64_image})

    except Exception as e:
        logger.error(f"Server-Fehler bei process-image: {e}")
        return jsonify({'error': f"Server-Fehler: {str(e)}"}), 500
    finally:
        # Speicher aufräumen
        if 'image' in locals():
            del image
        if 'image2' in locals():
            del image2


@app.route('/api/text-to-image', methods=['POST'])
def text_to_image_endpoint():
    if 'prompt' not in request.form:
        return jsonify({'error': 'Kein Prompt übermittelt'}), 400

    try:
        prompt = request.form['prompt']

        # API-Anfrage mit Timeout
        image_data, error = process_api_request(prompt, timeout=30)

        if error:
            logger.error(f"API-Fehler bei text-to-image: {error}")
            return jsonify({'error': f"API-Fehler: {error}"}), 500

        base64_image = image_to_base64(image_data)
        return jsonify({'image': base64_image})

    except Exception as e:
        logger.error(f"Server-Fehler bei text-to-image: {e}")
        return jsonify({'error': f"Server-Fehler: {str(e)}"}), 500


# --- Start der App ---
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    # Debug nur lokal aktivieren!
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    app.run(host='0.0.0.0', port=port, debug=debug_mode)

