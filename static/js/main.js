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
    const progressText = document.getElementById('progress-text');

    let currentMode = 'text_to_image';
    let uploadedFiles = []; // Kann jetzt mehrere Dateien enthalten
    let uploadedFile2 = null;

    // --- Zustands-Management ---
    function updateUIForMode(mode) {
        const needsImage1 = !['text_to_image'].includes(mode);
        const needsImage2 = ['watermark', 'product_mockup'].includes(mode);

        uploadLabel1.style.display = needsImage1 ? 'block' : 'none';
        uploadLabel2.style.display = needsImage2 ? 'block' : 'none';

        // Label-Text für den Upload-Button anpassen
        uploadLabel1.textContent = mode === 'batch' ? 'Mehrere Bilder auswählen' : 'Hauptbild laden';

        const buttonTexts = {
            'text_to_image': '🚀 Generieren', 'uncropping': '🚀 Erweitern',
            'avatar': '🚀 Erstellen', 'watermark': '🚀 Hinzufügen',
            'product_mockup': '🚀 Erstellen', 'batch': '🚀 Stapelverarbeitung starten'
        };
        actionButton.textContent = buttonTexts[mode] || '🚀 Ausführen';

        if (mode === 'watermark') uploadLabel2.textContent = 'Wasserzeichen laden';
        else if (mode === 'product_mockup') uploadLabel2.textContent = 'Hintergrund laden';
    }

    // --- Event Listener ---
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentMode = button.dataset.mode;
            promptInput.value = button.dataset.prompt;
            updateUIForMode(currentMode);
        });
    });

    imageUpload1.addEventListener('change', (event) => {
        uploadedFiles = Array.from(event.target.files);
        if (uploadedFiles.length > 0) {
            // Zeige das erste Bild als Vorschau
            previewImage.src = URL.createObjectURL(uploadedFiles[0]);
            previewImage.style.display = 'block';
            placeholder.style.display = 'none';
            downloadLink.style.display = 'none';
            progressText.textContent = `${uploadedFiles.length} Bild(er) ausgewählt.`;
        }
    });

    imageUpload2.addEventListener('change', (event) => {
        uploadedFile2 = event.target.files[0];
        if(uploadedFile2) alert(`"${uploadedFile2.name}" wurde als zweites Bild geladen.`);
    });

    // --- Kernfunktionalität ---
    async function handleBatchProcessing(prompt) {
        if (uploadedFiles.length === 0) {
            alert('Bitte wähle zuerst Bilder für die Stapelverarbeitung aus.');
            return;
        }

        loader.style.display = 'block';
        placeholder.style.display = 'none';
        previewImage.style.display = 'none';
        actionButton.disabled = true;

        const zip = new JSZip();
        let successCount = 0;

        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            progressText.textContent = `Verarbeite Bild ${i + 1} von ${uploadedFiles.length}: ${file.name}`;

            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('image', file);

            try {
                const response = await fetch('/api/process-image', { method: 'POST', body: formData });
                if (!response.ok) throw new Error(`Fehler bei Bild ${i + 1}`);

                const data = await response.json();
                const processedImageBlob = await (await fetch(`data:image/png;base64,${data.image}`)).blob();

                const originalName = file.name.split('.').slice(0, -1).join('.');
                zip.file(`${originalName}_processed.png`, processedImageBlob);
                successCount++;

            } catch (error) {
                console.error(error);
            }
        }

        progressText.textContent = `Verarbeitung abgeschlossen. ${successCount} von ${uploadedFiles.length} Bildern erfolgreich. Erstelle ZIP-Datei...`;

        if (successCount > 0) {
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);
            downloadLink.href = zipUrl;
            downloadLink.download = `FabBanana_Batch_${Date.now()}.zip`;
            downloadLink.textContent = 'ZIP-Datei herunterladen';
            downloadLink.style.display = 'block';
        } else {
            progressText.textContent = 'Keine Bilder konnten verarbeitet werden.';
        }

        loader.style.display = 'none';
        actionButton.disabled = false;
    }

    actionButton.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert('Bitte gib einen Prompt ein.');
            return;
        }

        if (currentMode === 'batch') {
            handleBatchProcessing(prompt);
            return;
        }

        loader.style.display = 'block';
        previewImage.style.display = 'none';
        placeholder.style.display = 'none';
        actionButton.disabled = true;
        downloadLink.style.display = 'none';

        const formData = new FormData();
        formData.append('prompt', prompt);

        let apiUrl = '/api/process-image';
        let requiresImage1 = !['text_to_image'].includes(currentMode);

        if (currentMode === 'text_to_image') {
            apiUrl = '/api/text-to-image';
        } else {
            if (uploadedFiles.length === 0) {
                alert('Bitte lade zuerst ein Hauptbild hoch.');
                loader.style.display = 'none';
                placeholder.style.display = 'block';
                actionButton.disabled = false;
                return;
            }
            formData.append('image', uploadedFiles[0]);

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
            const response = await fetch(apiUrl, { method: 'POST', body: formData });
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
            downloadLink.textContent = 'Bild herunterladen';
            downloadLink.style.display = 'block';

        } catch (error) {
            console.error('Fehler:', error);
            alert(`Ein Fehler ist aufgetreten: ${error.message}`);
            placeholder.style.display = 'block';
            placeholder.textContent = 'Fehler bei der Generierung.';
        } finally {
            loader.style.display = 'none';
            actionButton.disabled = false;
            progressText.textContent = '';
        }
    });

    // --- Initialisierung ---
    updateUIForMode(currentMode);
    document.querySelector('.mode-button[data-mode="text_to_image"]').click();
});