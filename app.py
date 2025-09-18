import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from PIL import Image
import io
import base64

# --- Konfiguration ---
app = Flask(__name__)

# Lade den API-Schlüssel sicher aus einer Umgebungsvariable
# Stelle sicher, dass du diese Variable auf deinem System/Server gesetzt hast!
try:
    api_key = os.environ["GOOGLE_API_KEY"]
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash-image-preview')
except KeyError:
    print("\nFEHLER: Die Umgebungsvariable 'GOOGLE_API_KEY' wurde nicht gefunden.")
    print("Bitte setze die Variable und starte die App erneut.")
    # Im echten Betrieb würde man hier die App beenden oder einen Fehlerstatus handhaben
    model = None
except Exception as e:
    print(f"Ein Fehler bei der Initialisierung des Modells ist aufgetreten: {e}")
    model = None


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

        # Finde und extrahiere die Bilddaten aus der Antwort
        for candidate in response.candidates:
            for part in candidate.content.parts:
                if part.inline_data:
                    return part.inline_data.data, None
        return None, "Keine Bilddaten in der API-Antwort gefunden."

    except Exception as e:
        print(f"API-Fehler: {e}")
        return None, str(e)


def image_to_base64(image_data):
    """
    Konvertiert rohe Bilddaten in einen Base64-String zur Anzeige im Web.
    """
    return base64.b64encode(image_data).decode('utf-8')


# --- Routen (API Endpunkte) ---

@app.route('/')
def index():
    """
    Rendert die Hauptseite der Web-App (index.html).
    """
    return render_template('index.html')


@app.route('/api/process-image', methods=['POST'])
def process_image_endpoint():
    """
    Ein universeller Endpunkt für alle Bild-zu-Bild-Operationen.
    """
    if 'prompt' not in request.form:
        return jsonify({'error': 'Kein Prompt übermittelt'}), 400
    if 'image' not in request.files:
        return jsonify({'error': 'Kein Bild übermittelt'}), 400

    prompt = request.form['prompt']
    image_file = request.files['image']

    try:
        image = Image.open(image_file.stream)

        # Zusätzliche Bilder für Modi wie "Wasserzeichen" oder "Mockup"
        images_to_process = [image]
        if 'image2' in request.files:
            image2_file = request.files['image2']
            image2 = Image.open(image2_file.stream)
            images_to_process.append(image2)

        image_data, error = process_api_request(prompt, images=images_to_process)

        if error:
            return jsonify({'error': f"API-Fehler: {error}"}), 500

        base64_image = image_to_base64(image_data)
        return jsonify({'image': base64_image})

    except Exception as e:
        return jsonify({'error': f"Server-Fehler: {e}"}), 500


@app.route('/api/text-to-image', methods=['POST'])
def text_to_image_endpoint():
    """
    Ein Endpunkt speziell für die Text-zu-Bild-Generierung.
    """
    if 'prompt' not in request.form:
        return jsonify({'error': 'Kein Prompt übermittelt'}), 400

    prompt = request.form['prompt']

    image_data, error = process_api_request(prompt)  # Hier werden keine Bilder übergeben

    if error:
        return jsonify({'error': f"API-Fehler: {error}"}), 500

    base64_image = image_to_base64(image_data)
    return jsonify({'image': base64_image})


# --- Start der App ---
if __name__ == '__main__':
    # Passe den Port für Cloud Run an (wird automatisch gesetzt)
    # Lokal wird weiterhin 5001 verwendet, wenn PORT nicht gesetzt ist
    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=True)

