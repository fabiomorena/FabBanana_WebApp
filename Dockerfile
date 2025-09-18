# Verwende ein offizielles Python-Basis-Image
FROM python:3.11-slim

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die Abhängigkeitsdatei und installiere die Pakete
# Dies wird gecached, um spätere Builds zu beschleunigen
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Kopiere den gesamten restlichen App-Code in das Arbeitsverzeichnis
COPY . .

# Gib den Port an, auf dem die App laufen wird
EXPOSE 8080

# Der Befehl, um die Anwendung mit einem produktionsreifen Server zu starten
# Gunicorn ist ein robusterer Webserver als der eingebaute Flask-Server
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]
