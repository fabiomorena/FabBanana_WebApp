document.addEventListener('DOMContentLoaded', () => {
    // --- Element-Referenzen ---
    const modeButtons = document.querySelectorAll('.mode-button');
    const promptInput = document.getElementById('prompt-input');
    const actionButton = document.getElementById('action-button');
    const imageUpload1 = document.getElementById('image-upload');
    const imageUpload2 = document.getElementById('image-upload-2');
    const uploadLabel1 = document.getElementById('upload-label-1');
    const uploadLabel2 = document.getElementById('upload-label-2');
    const previewImage = document.getElementById('preview-image');
    const placeholder = document.getElementById('placeholder');
    const loader = document.getElementById('loader');
    const downloadLink = document.getElementById('download-link');

    let currentMode = 'text_to_image';
    let uploadedFile1 = null;
    let uploadedFile2 = null;

    // --- Zustands-Management ---
    function updateUIForMode(mode) {
        // Logik zur Anzeige der Upload-Buttons basierend auf dem Modus
        const needsImage1 = !['text_to_image', 'batch'].includes(mode);
        const needsImage2 = ['watermark', 'product_mockup'].includes(mode); // ERWEITERT

        uploadLabel1.style.display = needsImage1 ? 'block' : 'none';
        uploadLabel2.style.display = needsImage2 ? 'block' : 'none';

        // Setze den Text des Action-Buttons
        const buttonTexts = {
            'text_to_image': '🚀 Generieren',
            'uncropping': '🚀 Erweitern',
            'avatar': '🚀 Erstellen',
            'watermark': '🚀 Hinzufügen',
            'product_mockup': '🚀 Erstellen', // NEU
            'batch': '🚀 Starten' // NEU
        };
        actionButton.textContent = buttonTexts[mode] || '🚀 Ausführen';

        // Setze den Text des zweiten Upload-Buttons dynamisch
        if (mode === 'watermark') {
            uploadLabel2.textContent = 'Wasserzeichen laden';
        } else if (mode === 'product_mockup') {
            uploadLabel2.textContent = 'Hintergrund laden';
        }
    }

    // --- Event Listener ---

    // Modus-Buttons
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            currentMode = button.dataset.mode;
            promptInput.value = button.dataset.prompt;

            updateUIForMode(currentMode);
        });
    });

    // Bild-Uploads
    imageUpload1.addEventListener('change', (event) => {
        uploadedFile1 = event.target.files[0];
        if (uploadedFile1) {
            previewImage.src = URL.createObjectURL(uploadedFile1);
            previewImage.style.display = 'block';
            placeholder.style.display = 'none';
            downloadLink.style.display = 'none';
        }
    });

    imageUpload2.addEventListener('change', (event) => {
        uploadedFile2 = event.target.files[0];
        // Optional: Zeige eine Vorschau für das zweite Bild an, wenn die UI es unterstützt
        if(uploadedFile2) {
            alert(`"${uploadedFile2.name}" wurde als zweites Bild geladen.`);
        }
    });

    // Action-Button (Kernfunktionalität)
    actionButton.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert('Bitte gib einen Prompt ein.');
            return;
        }

        // Hinweis für Stapelverarbeitung, da diese serverseitig anders implementiert werden muss
        if (currentMode === 'batch') {
            alert('Die Stapelverarbeitung ist in dieser Web-Demo nicht vollständig implementiert, würde aber eine ähnliche Logik auf dem Server für einen ganzen Ordner auslösen.');
            return;
        }

        // Ladezustand aktivieren
        loader.style.display = 'block';
        previewImage.style.display = 'none';
        placeholder.style.display = 'none';
        actionButton.disabled = true;

        const formData = new FormData();
        formData.append('prompt', prompt);

        let apiUrl = '/api/process-image'; // Standard-Endpunkt

        if (currentMode === 'text_to_image') {
            apiUrl = '/api/text-to-image';
        } else {
            if (!uploadedFile1) {
                alert('Bitte lade zuerst ein Hauptbild hoch.');
                loader.style.display = 'none';
                placeholder.style.display = 'block';
                actionButton.disabled = false;
                return;
            }
            formData.append('image', uploadedFile1);

            if (['watermark', 'product_mockup'].includes(currentMode)) {
                 if (!uploadedFile2) {
                    alert('Bitte lade ein zweites Bild für diesen Modus hoch.');
                    loader.style.display = 'none';
                    placeholder.style.display = 'block';
                    actionButton.disabled = false;
                    return;
                }
                formData.append('image2', uploadedFile2);
            }
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP-Fehler: ${response.status}`);
            }

            const data = await response.json();
            const imageUrl = `data:image/png;base64,${data.image}`;

            previewImage.src = imageUrl;
            previewImage.style.display = 'block';
            downloadLink.href = imageUrl;
            downloadLink.download = `${currentMode}_${Date.now()}.png`;
            downloadLink.style.display = 'block';

        } catch (error) {
            console.error('Fehler:', error);
            alert(`Ein Fehler ist aufgetreten: ${error.message}`);
            placeholder.style.display = 'block';
            placeholder.textContent = 'Fehler bei der Generierung.';
        } finally {
            // Ladezustand deaktivieren
            loader.style.display = 'none';
            actionButton.disabled = false;
        }
    });

    // --- Initialisierung ---
    updateUIForMode(currentMode); // Setze den initialen UI-Zustand
    document.querySelector('.mode-button[data-mode="text_to_image"]').click();
});