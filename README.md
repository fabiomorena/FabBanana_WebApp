# 🍌 FabBanana WebApp

Eine Webanwendung, die das `gemini-2.5-flash-image-preview`-Modell von Google Generative AI für eine Vielzahl von Bildbearbeitungs- und Generierungsaufgaben nutzt. Das Projekt ist die Web-Version der **NanoBanana AI Image Studio** Desktop-Anwendung und wurde mit Flask und modernen Web-Technologien entwickelt.

## Features

Die **FabBanana WebApp** bietet eine umfassende Palette von KI-gestützten Funktionen in einer benutzerfreundlichen, webbasierten Oberfläche:

### Generierung & Kreation
* **Text-zu-Bild-Generierung**: Erstellt neue Bilder nur aus einer Textbeschreibung.
* **Bild erweitern (Outpainting)**: Vergrößert ein Bild, indem es den Inhalt an den Rändern nahtlos weitergeneriert.
* **Avatar-Erstellung**: Wandelt Porträtfotos in stilisierte Avatare um.

### Bearbeitung & Verbesserung
* **Hintergrundentfernung**: Isoliert Motive durch das Entfernen des gesamten Hintergrunds.
* **Bildrestaurierung**: Verbessert die Qualität von alten oder beschädigten Fotos.
* **Bildhochauflösung (Upscaling)**: Erhöht die Auflösung und Schärfe von Bildern.
* **Objektentfernung**: Entfernt nahtlos unerwünschte Objekte aus einem Bild.
* **Wasserzeichen hinzufügen**: Fügt ein Logo oder Wasserzeichen zu einem Bild hinzu.
* **Interaktiver Chat-Modus**: Ermöglicht die schrittweise Bearbeitung eines Bildes durch Anweisungen in natürlicher Sprache.
* **Stilübertragung**: Überträgt den künstlerischen Stil eines Bildes auf ein anderes.

### Anwendungsfälle & Workflow
* **Produkt-Mockups**: Erstellt fotorealistische Produkt-Mockups.
* **Marketing-Assets**: Gestaltet Bilder zu ansprechenden Marketing-Materialien.
* **Stapelverarbeitung**: Wendet eine Aktion auf mehrere Bilder gleichzeitig an und stellt die Ergebnisse als ZIP-Datei zum Download bereit.

## Lokale Einrichtung

Um die Web-App lokal zu betreiben, befolge diese Schritte:

1.  **Repository klonen:**
    ```bash
    git clone [LINK_ZU_DEINEM_REPOSITORY]
    cd FabBanana_WebApp
    ```

2.  **Virtuelle Umgebung erstellen und aktivieren:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # Auf Windows: .venv\Scripts\activate
    ```

3.  **Abhängigkeiten installieren:**
    Die notwendigen Pakete sind in `requirements.txt` aufgelistet.
    ```bash
    pip install -r requirements.txt
    ```

4.  **API-Schlüssel setzen:**
    Du musst deinen Google API Key als Umgebungsvariable setzen.
    * Auf macOS/Linux:
        ```bash
        export GOOGLE_API_KEY="Dein-API-Schlüssel"
        ```
    * Auf Windows (Command Prompt):
        ```bash
        set GOOGLE_API_KEY="Dein-API-Schlüssel"
        ```

5.  **App starten:**
    Führe die Flask-Anwendung aus. Die App ist so konfiguriert, dass sie auf Port 5001 läuft, um Konflikte zu vermeiden.
    ```bash
    flask run
    ```
    Öffne deinen Browser und gehe zu `http://127.0.0.1:5001`.

## Deployment auf Google Cloud Run

Die Web-App ist für die Bereitstellung auf Google Cloud Run vorbereitet. Die notwendigen Konfigurationsdateien (`Dockerfile`, `.dockerignore`) sind im Repository enthalten.

1.  **Voraussetzungen**: Stelle sicher, dass `gcloud` SDK und `Docker` installiert und konfiguriert sind.

2.  **Deployment-Befehl**: Führe den folgenden Befehl im Hauptverzeichnis deines Projekts aus:
    ```bash
    gcloud run deploy fabbanana-webapp --source . --region europe-west3 --allow-unauthenticated
    ```
    *(Passe die Region bei Bedarf an)*

3.  **API-Schlüssel in Cloud Run setzen**:
    Nach dem ersten Deployment musst du deinen `GOOGLE_API_KEY` sicher in den Einstellungen deines Cloud Run-Dienstes als Umgebungsvariable hinterlegen. Gehe dazu in der Google Cloud Console zu deinem Dienst, wähle "Neue Überarbeitung bearbeiten und bereitstellen" und füge die Variable unter "Variablen und Secrets" hinzu.