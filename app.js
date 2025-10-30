const uploadedFiles = {
    oeffentlich: [],
    zivil: [],
    straf: []
};

function navigateToSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            navigateToSection(sectionId);
        });
    });

    setupFileUpload('upload-oeffentlich', 'files-oeffentlich', 'oeffentlich');
    setupFileUpload('upload-zivil', 'files-zivil', 'zivil');
    setupFileUpload('upload-straf', 'files-straf', 'straf');

    setupChatForm('oeffentlich');
    setupChatForm('zivil');
    setupChatForm('straf');
});

function setupFileUpload(inputId, listId, area) {
    const input = document.getElementById(inputId);
    const fileList = document.getElementById(listId);

    if (!input || !fileList) return;

    input.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files, area, fileList);
    });

    const label = input.nextElementSibling;
    if (label) {
        label.addEventListener('dragover', (e) => {
            e.preventDefault();
            label.style.borderColor = 'var(--secondary-color)';
            label.style.background = '#e6f2ff';
        });

        label.addEventListener('dragleave', (e) => {
            e.preventDefault();
            label.style.borderColor = 'var(--border-color)';
            label.style.background = 'var(--bg-color)';
        });

        label.addEventListener('drop', (e) => {
            e.preventDefault();
            label.style.borderColor = 'var(--border-color)';
            label.style.background = 'var(--bg-color)';

            const files = Array.from(e.dataTransfer.files);
            handleFiles(files, area, fileList);
        });
    }
}

function handleFiles(files, area, fileListElement) {
    files.forEach(file => {
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert(`Datei "${file.name}" ist zu groß. Maximale Größe: 10 MB`);
            return;
        }

        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (!validTypes.includes(file.type)) {
            alert(`Datei "${file.name}" hat ein ungültiges Format. Erlaubt: PDF, DOCX, TXT`);
            return;
        }

        const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        uploadedFiles[area].push({
            id: fileId,
            name: file.name,
            file: file
        });

        displayFile(fileId, file.name, area, fileListElement);
    });
}

function displayFile(fileId, fileName, area, fileListElement) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.fileId = fileId;

    fileItem.innerHTML = `
        <span class="file-name">${fileName}</span>
        <span class="file-remove" onclick="removeFile('${fileId}', '${area}')">✕</span>
    `;

    fileListElement.appendChild(fileItem);
}

function removeFile(fileId, area) {
    uploadedFiles[area] = uploadedFiles[area].filter(f => f.id !== fileId);

    const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
    if (fileItem) {
        fileItem.remove();
    }
}

function setupChatForm(area) {
    const form = document.querySelector(`form[data-area="${area}"]`);
    if (!form) return;

    const chatMessages = document.getElementById(`chat-${area}`);
    const input = form.querySelector('.chat-input');
    const sendButton = form.querySelector('.btn-send');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const question = input.value.trim();
        if (!question) return;


        appendMessage(chatMessages, 'user', question);
        input.value = '';

        showLoadingIndicator(chatMessages);
        sendButton.disabled = true;

        try {
            const filesContext = uploadedFiles[area].length > 0
                ? uploadedFiles[area].map(f => f.name).join(', ')
                : 'keine';

            const contextMessage = uploadedFiles[area].length > 0
                ? `Hochgeladene Dokumente: ${filesContext}. Bitte beziehe dich ausschließlich auf diese Dokumente.`
                : 'Keine Dokumente hochgeladen. Beantworte die Frage basierend auf allgemeinem juristischem Wissen.';

            const response = await fetch('/.netlify/functions/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    area: area,
                    context: contextMessage
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP Fehler: ${response.status}`);
            }

            const data = await response.json();
            hideLoadingIndicator(chatMessages);
            appendMessage(chatMessages, 'bot', data.answer);

        } catch (error) {
            console.error('API Fehler:', error);
            hideLoadingIndicator(chatMessages);
            appendMessage(chatMessages, 'bot', 'Es tut mir leid, es gab ein technisches Problem. Bitte versuchen Sie es erneut.');
        } finally {
            sendButton.disabled = false;
        }
    });
}

function appendMessage(chatContainer, sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/\n/g, '<br>');

    messageDiv.innerHTML = text;
    chatContainer.appendChild(messageDiv);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showLoadingIndicator(chatContainer) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message loading';
    loadingDiv.id = 'loading-indicator';
    loadingDiv.innerHTML = `
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideLoadingIndicator(chatContainer) {
    const loadingDiv = chatContainer.querySelector('#loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

if (window.location.hash) {
    const sectionId = window.location.hash.substring(1);
    navigateToSection(sectionId);
}
