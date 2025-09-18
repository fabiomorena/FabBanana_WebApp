# 🍌 FabBanana WebApp

Eine Webanwendung, die das `gemini-2.5-flash-image-preview`-Modell von Google Generative AI für eine Vielzahl von Bildbearbeitungs- und Generierungsaufgaben nutzt.

## Projektstruktur

-   `app.py`: Das Flask-Backend, das die API-Anfragen verarbeitet.
-   `templates/index.html`: Die Haupt-HTML-Datei für das Frontend.
-   `static/css/style.css`: Das CSS für das Design der WebApp.
-   `static/js/main.js`: Das JavaScript für die Anwendungslogik und Interaktivität.
-   `requirements.txt`: Die Python-Abhängigkeiten für die Installation.

## Lokale Installation und Ausführung

1.  **Repository klonen:**
    ```bash
    git clone [DEIN_REPOSITORY_LINK]
    cd FabBanana_WebApp
    ```

2.  **Virtuelle Umgebung erstellen und aktivieren:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # Auf Windows: .venv\Scripts\activate
    ```

3.  **Abhängigkeiten installieren:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **API-Schlüssel setzen:**
    Setze deinen Google API Key als Umgebungsvariable.
    -   Auf Unix/macOS:
        ```bash
        export GOOGLE_API_KEY="Dein-API-Schlüssel"
        ```
    -   Auf Windows (Command Prompt):
        ```bash
        set GOOGLE_API_KEY="Dein-API-Schlüssel"
        ```

5.  **Flask-App starten:**
    ```bash
    flask run
    ```
    Öffne deinen Browser und gehe zu `http://127.0.0.1:5001`.

## Deployment

Diese Anwendung ist bereit für das Deployment auf Plattformen wie Vercel, Heroku oder Google Cloud Run. Verbinde einfach dein GitHub-Repository mit dem Hosting-Anbieter deiner Wahl.