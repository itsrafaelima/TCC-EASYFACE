let currentApp = 'welcome';
        let calcDisplay = '0';
        let calcExpression = '';
        let soundsEnabled = true;
        let highContrast = false;

        // Variáveis para varredura automática
        let scanMode = false;
        let scanInterval = null;
        let scanElements = [];
        let currentScanIndex = 0;
        let scanSpeed = 2000;
        let scanPaused = false;

        // Variáveis para navegação na calculadora
        let calcFocus = { row: 0, col: 0 };
        const calcGrid = [
            [11, 12, 13, 14],   // C, ⌫, ÷, ×
            [15, 16, 17, 18],   // 7, 8, 9, -
            [19, 20, 21, 22],   // 4, 5, 6, +
            [23, 24, 25, 26],   // 1, 2, 3, =
            [27, 27, 28, 26]    // 0 (span 2), ., = (duplicado para mapeamento)
        ];

        // Variáveis Novas Funcionalidades
        let currentPdf = null;
        let currentPage = 1;
        let pdfTotalPages = 0;
        let pdfScale = 1.5;
        let customShortcuts = {};
        let communicationPhrases = {
            saudacoes: ["Olá", "Bom dia", "Boa tarde", "Boa noite", "Tudo bem?", "Prazer em conhecê-lo"],
            necessidades: ["Estou com fome", "Estou com sede", "Preciso ir ao banheiro", "Estou com dor", "Preciso de ajuda"],
            sentimentos: ["Estou feliz", "Estou triste", "Estou cansado", "Estou com medo", "Estou com raiva", "Eu te amo"],
            emergencia: ["Preciso de ajuda urgente", "Chame um médico", "Ligue para minha família", "Não estou me sentindo bem"]
        };

        // ===== FUNÇÕES DE CONFIGURAÇÃO =====
        function loadUserSettings() {
            try {
                const saved = JSON.parse(localStorage.getItem('easyface-settings') || '{}');

                if (saved.fontSize) changeFontSize(saved.fontSize);
                if (saved.highContrast) toggleContrast();
                if (saved.soundsEnabled !== undefined) soundsEnabled = saved.soundsEnabled;
                if (saved.scanSpeed) scanSpeed = saved.scanSpeed;

                updateStatus('Configurações carregadas');
            } catch (error) {
                updateStatus('Configurações padrão aplicadas');
            }
        }

        function saveUserSettings() {
            try {
                const settings = {
                    fontSize: getCurrentFontSize(),
                    highContrast: highContrast,
                    soundsEnabled: soundsEnabled,
                    scanSpeed: scanSpeed
                };
                localStorage.setItem('easyface-settings', JSON.stringify(settings));
                updateStatus('Configurações salvas automaticamente');
            } catch (error) {
                console.log('Não foi possível salvar configurações');
            }
        }

        function getCurrentFontSize() {
            const size = parseInt(document.body.style.fontSize);
            if (size <= 16) return 'small';
            if (size <= 18) return 'medium';
            return 'large';
        }

        // ===== FUNÇÕES DE NAVEGAÇÃO =====
        function showApp(appId) {
            const apps = document.querySelectorAll('.app-container');
            apps.forEach(app => {
                app.classList.add('hidden');
            });

            const currentAppElement = document.getElementById(appId);
            if (currentAppElement) {
                currentAppElement.classList.remove('hidden');
            }
            currentApp = appId;
            playFeedbackSound();
        }

        function showTextEditor() {
            showApp('text-editor-app');
            // Foca na área de texto quando o editor é aberto
            setTimeout(() => {
            const editorArea = document.querySelector('#text-editor-app textarea, #text-editor-app input, #text-editor-app [contenteditable="true"]');
                if (editorArea){
                    editorArea.focus();
                }
            },100);
        }

        function showCalculator() {
            showApp('calculator-app');
            // Foca no botão 7 quando a calculadora é aberta
            setTimeout(() => {
                const firstNumber = document.querySelector('.calc-button[data-key="7"]');
                if (firstNumber) {
                    firstNumber.focus();
                    calcFocus = { row: 1, col: 0 }; // Posição do número 7 na grade
                    document.querySelectorAll('.calc-button').forEach(btn => {
                        btn.classList.remove('navigation-focus');
                    });
                    firstNumber.classList.add('navigation-focus');
                }
            }, 100);
    }

        function showSiteLauncher() {
            showApp('site-launcher-app');
            // Foca no campo de URL quando o lançador de sites é aberto
            setTimeout(() => {
            const urlBar = document.querySelector('input[type="text"]');
            if (urlBar){
                urlBar.focus();
                }
            }, 100);
        }

        function showAccessibilitySettings() {
            showApp('accessibility-settings-app');
            // Foca no primeiro controle de acessibilidade quando a seção é aberta
            setTimeout(() => {
                const firstControl = document.querySelector('#accessibility-settings button, #accessibility-settings input');
                if (firstControl) {
                    firstControl.focus();
                }
            }, 100);
        }

        function showHelp() {
            showApp('help-app');
            // Foca no botão de fechar ajuda quando a seção é aberta
            setTimeout(() => {
                const closeButton = document.getElementById('close-help');
                if (closeButton) {
                    closeButton.focus();
                }
            }, 100);
        }

        // ===== FUNÇÕES EXPLORADOR DE ARQUIVOS =====
        function showFileManager() {
            showApp('file-manager-app');
            // Foca no botão de carregar arquivo quando o gerenciador de arquivos é aberto
            setTimeout(() => {
                const loadButton = document.getElementById('load-file-button');
                if (loadButton) {
                    loadButton.focus();
                }
            }, 100);
        }

        document.getElementById('file-input').addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById('file-text-area').value = e.target.result;
                    document.getElementById('file-info').textContent = `Arquivo "${file.name}" carregado com sucesso.`;
                    speakFeedback(`Arquivo ${file.name} carregado com sucesso`);
                };
                reader.readAsText(file);
            }
        });

        function saveTextFile() {
            const text = document.getElementById('file-text-area').value;
            if (text.trim()) {
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'documento.txt';
                a.click();
                document.getElementById('file-info').textContent = 'Arquivo salvo com sucesso!';
                speakFeedback('Arquivo salvo com sucesso');
            } else {
                document.getElementById('file-info').textContent = 'Nenhum texto para salvar.';
            }
        }

        // ===== FUNÇÕES REPRODUTOR AÚDIO =====

        function showMediaPlayer() {
            showApp('media-player-app');
            // Foca no botão de carregar mídia quando o reprodutor é aberto
            setTimeout(() => {
                const loadButton = document.getElementById('load-media-button');
                if (loadButton) {
                    loadButton.focus();
                }
            }, 100);
        }

        document.getElementById('media-input').addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                if (file.type.startsWith('audio/')) {
                    document.getElementById('audio-player').classList.remove('hidden');
                    document.getElementById('video-player').classList.add('hidden');
                    document.getElementById('audio-player').src = url;
                } else if (file.type.startsWith('video/')) {
                    document.getElementById('video-player').classList.remove('hidden');
                    document.getElementById('audio-player').classList.add('hidden');
                    document.getElementById('video-player').src = url;
                }
                document.getElementById('media-info').textContent = `Mídia "${file.name}" carregada.`;
                speakFeedback(`Mídia carregada!`);
            }
        });

        // ===== FUNÇÕES LEITOR PDF =====

        function showPdfReader() {
            showApp('pdf-reader-app');
            // Foca no botão de carregar PDF quando o leitor é aberto
            setTimeout(() => {
                const loadButton = document.getElementById('load-pdf-button');
                if (loadButton) {
                    loadButton.focus();
                }
            }, 100);
            // Inicializar PDF.js
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.worker.min.js';
        }

        document.getElementById('pdf-input').addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file && file.type === 'application/pdf') {
                const fileReader = new FileReader();
                fileReader.onload = function () {
                    const typedarray = new Uint8Array(this.result);
                    loadPdf(typedarray);
                };
                fileReader.readAsArrayBuffer(file);
                document.getElementById('pdf-info').textContent = `PDF "${file.name}" carregado.`;
                speakFeedback(`PDF ${file.name} carregado`);
            }
        });

        function loadPdf(data) {
            pdfjsLib.getDocument(data).promise.then(function (pdf) {
                currentPdf = pdf;
                pdfTotalPages = pdf.numPages;
                currentPage = 1;
                renderPage(currentPage);
            });
        }

        function renderPage(pageNum) {
            if (!currentPdf) return;

            currentPdf.getPage(pageNum).then(function (page) {
                const viewport = page.getViewport({ scale: pdfScale });
                const canvas = document.getElementById('pdf-canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                page.render(renderContext).promise.then(function () {
                    document.getElementById('pdf-info').textContent = `Página ${pageNum} de ${pdfTotalPages}`;
                    speakFeedback(`Página ${pageNum} de ${pdfTotalPages}`);
                });
            });
        }

        function prevPage() {
            if (currentPdf && currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
            }
        }

        function nextPage() {
            if (currentPdf && currentPage < pdfTotalPages) {
                currentPage++;
                renderPage(currentPage);
            }
        }

        function zoomIn() {
            pdfScale += 0.25;
            if (currentPdf) renderPage(currentPage);
        }

        function zoomOut() {
            if (pdfScale > 0.5) {
                pdfScale -= 0.25;
                if (currentPdf) renderPage(currentPage);
            }
        }

        // ===== FUNÇÕES COMUNICAÇÃO ALTERNATIVA =====

        function showCommunicationAid() {
            showApp('communication-aid-app');
            // Foca no primeiro botão de categoria quando o auxílio é aberto
            setTimeout(() => {
                const firstCategory = document.querySelector('.category-button');
                if (firstCategory) {
                    firstCategory.focus();
                }
            }, 100);
        }

        function showPhrases(category) {
            const container = document.getElementById('phrases-container');
            container.innerHTML = '';

            communicationPhrases[category].forEach((phrase, index) => {
                const button = document.createElement('button');
                button.className = 'phrase-button scannable';
                button.textContent = phrase;
                button.tabIndex = 50 + index;
                button.setAttribute('aria-label', `Selecionar frase: ${phrase}`);
                button.onclick = function () {
                    document.getElementById('communication-display').textContent = phrase;
                    speakFeedback(`${phrase}`);
                };
                container.appendChild(button);
            });
        }

        function speakCommunication() {
            const text = document.getElementById('communication-display').textContent;
            if (text && text !== 'Sua mensagem aparecerá aqui...' && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'pt-BR';
                speechSynthesis.speak(utterance);
                speakFeedback('Mensagem falada');
            }
        }

        function clearCommunication() {
            document.getElementById('communication-display').textContent = 'Sua mensagem aparecerá aqui...';
            speakFeedback('Mensagem limpa');
        }

        // FUNÇÕES EMAIL-WHATSAPP

        function showEmailIntegration() {
            showApp('email-integration-app');
            // Foca no botão de abrir Gmail quando a seção é aberta
            setTimeout(() => {
                const gmailButton = document.getElementById('open-gmail-button');
                if (gmailButton) {
                    gmailButton.focus();
                }
            }, 100);
        }

        function openGmail() {
            window.open('https://mail.google.com', '_blank');
            speakFeedback('Abrindo Gmail');
        }

        function openWhatsApp() {
            window.open('https://web.whatsapp.com', '_blank');
            speakFeedback('Abrindo Uatzap');
        }

        function sendEmail() {
            const to = document.getElementById('email-to').value;
            const subject = document.getElementById('email-subject').value;
            const body = document.getElementById('email-body').value;

            if (to && subject && body) {
                const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = mailtoLink;
                speakFeedback('E-mail preparado para envio');
            } else {
                speakFeedback('Preencha todos os campos para enviar o e-mail');
            }
        }

        // ===== PERSONALIZAÇÃO ATALHOS =====

        function loadShortcuts() {
            try {
                const saved = JSON.parse(localStorage.getItem('easyface-shortcuts') || '{}');
                customShortcuts = saved;

                // Aplicar atalhos salvos
                if (saved.text) document.getElementById('shortcut-text').value = saved.text;
                if (saved.file) document.getElementById('shortcut-file').value = saved.file;
                if (saved.calc) document.getElementById('shortcut-calc').value = saved.calc;
                // Carregar outros atalhos...
            } catch (error) {
                console.log('Não foi possível carregar atalhos personalizados');
            }
        }

        function saveShortcuts() {
            try {
                customShortcuts = {
                    text: document.getElementById('shortcut-text').value,
                    file: document.getElementById('shortcut-file').value,
                    calc: document.getElementById('shortcut-calc').value,
                    site: document.getElementById('shortcut-site').value,
                    acce: document.getElementById('shortcut-accessibility').value,
                    help: document.getElementById('shortcut-help').value,
                    media: document.getElementById('shortcut-media').value,
                    pdf: document.getElementById('shortcut-pdf').value,
                    commu: document.getElementById('shortcut-communication').value,
                    email: document.getElementById('shortcut-email').value,
                    whats: document.getElementById('shortcut-whatsapp').value
                };

                localStorage.setItem('easyface-shortcuts', JSON.stringify(customShortcuts));
                updateStatus('Atalhos personalizados salvos');
                speakFeedback('Atalhos personalizados salvos');
            } catch (error) {
                console.log('Não foi possível salvar atalhos personalizados');
            }
        }

        // ===== LEITOR DE TELA =====

        function speakFeedback(message) {
            if (soundsEnabled && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(message);
                utterance.volume = 0.8;
                utterance.rate = 0.9;
                utterance.pitch = 1;
                speechSynthesis.speak(utterance);
            }
        }

        // ===== FUNÇÕES DO EDITOR DE TEXTO =====
        function saveText() {
            const text = document.getElementById('text-area').value;
            if (text.trim()) {
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'easyface-texto.txt';
                a.click();
                updateStatus('Texto salvo com sucesso!');
                playFeedbackSound();
            } else {
                updateStatus('Nenhum texto para salvar.');
            }
        }

        function clearText() {
            document.getElementById('text-area').value = '';
            updateStatus('Texto limpo.');
            playFeedbackSound();
        }

        function speakText() {
            const text = document.getElementById('text-area').value;
            if (text.trim() && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'pt-BR';
                speechSynthesis.speak(utterance);
                updateStatus('Lendo texto...');
            } else {
                updateStatus('Nenhum texto para ler ou recurso não disponível.');
            }
        }

        // ===== FUNÇÕES DA CALCULADORA =====
        function addToCalc(value) {
            if (calcDisplay === '0' && !isNaN(value)) {
                calcDisplay = value;
            } else {
                calcDisplay += value;
            }
            calcExpression += value;
            document.getElementById('calc-display').textContent = calcDisplay;
            playFeedbackSound();
        }

        function calculateResult() {
            if (calcExpression.trim() === '') {
                calcDisplay = '0';
                document.getElementById('calc-display').textContent = calcDisplay;
                return;
            }

            try {
                const expressionToEval = calcExpression
                    .replace(/×/g, '*')
                    .replace(/÷/g, '/')
                    .replace(/−/g, '-');

                const result = eval(expressionToEval);
                calcDisplay = result.toString();
                calcExpression = result.toString();
                document.getElementById('calc-display').textContent = calcDisplay;
            } catch (error) {
                calcDisplay = 'Erro';
                calcExpression = '';
                document.getElementById('calc-display').textContent = calcDisplay;
            }
        }

        function clearCalc() {
            calcDisplay = '0';
            calcExpression = '';
            document.getElementById('calc-display').textContent = calcDisplay;
            updateStatus('Calculadora limpa');
            playFeedbackSound();
        }

        function deleteLast() {
            if (calcDisplay.length > 1) {
                calcDisplay = calcDisplay.slice(0, -1);
                calcExpression = calcExpression.slice(0, -1);
            } else {
                calcDisplay = '0';
                calcExpression = '';
            }
            document.getElementById('calc-display').textContent = calcDisplay;
            playFeedbackSound();
        }

        // ===== SISTEMA DE NAVEGAÇÃO POR SETAS =====
        function moveCalcFocus(rowDelta, colDelta) {
            const newRow = Math.max(0, Math.min(calcFocus.row + rowDelta, calcGrid.length - 1));
            let newCol = Math.max(0, Math.min(calcFocus.col + colDelta, calcGrid[newRow].length - 1));

            // Ajuste especial para o botão 0 que ocupa duas colunas
            if (newRow === 4 && newCol === 1) {
                newCol = 0;
            }

            // Encontra o elemento a ser focado
            const tabIndex = calcGrid[newRow][newCol];
            const element = document.querySelector(`.calc-button[tabindex="${tabIndex}"]`);

            if (element) {
                element.focus();
                calcFocus = { row: newRow, col: newCol };

                // Destacar visualmente o botão com foco de navegação
                document.querySelectorAll('.calc-button').forEach(btn => {
                    btn.classList.remove('navigation-focus');
                });
                element.classList.add('navigation-focus');
            }
        }

        // ===== FUNÇÕES DO LAUNCHER DE SITE =====
        function launchSite(url) {
            window.open(url, '_blank', 'noopener,noreferrer');
            updateStatus('Site aberto em nova janela: ' + url);
            playFeedbackSound();
        }

        function launchCustomSite() {
            const url = document.getElementById('custom-site-url').value.trim();
            if (!url) {
                updateStatus('Por favor, digite uma URL');
                return;
            }

            let finalUrl = url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                finalUrl = 'https://' + url;
            }

            // Abre o site sem verificação (mais simples)
            launchSite(finalUrl);

            // Aviso para o usuário sobre segurança
            updateStatus('Site aberto. Cuidado com sites desconhecidos.');
        }

        // ===== FUNÇÕES DE ACESSIBILIDADE =====
        function changeFontSize(size) {
            const body = document.body;
            body.classList.remove('font-small', 'font-medium', 'font-large');

            if (size === 'small') {
                body.style.fontSize = '16px';
                updateStatus('Fonte pequena aplicada');
            } else if (size === 'medium') {
                body.style.fontSize = '18px';
                updateStatus('Fonte média aplicada');
            } else if (size === 'large') {
                body.style.fontSize = '22px';
                updateStatus('Fonte grande aplicada');
            }

            saveUserSettings();
            playFeedbackSound();
        }

        function toggleContrast() {
            highContrast = !highContrast;
            if (highContrast) {
                document.body.style.filter = 'contrast(150%) brightness(110%)';
                updateStatus('Alto contraste ativado');
            } else {
                document.body.style.filter = 'none';
                updateStatus('Alto contraste desativado');
            }

            saveUserSettings();
            playFeedbackSound();
        }

        function toggleSounds() {
            soundsEnabled = !soundsEnabled;
            updateStatus(soundsEnabled ? 'Sons ativados' : 'Sons desativados');

            saveUserSettings();
            if (soundsEnabled) playFeedbackSound();
        }

        // ===== FUNÇÕES DE VARREDURA AUTOMÁTICA =====
        function toggleScanMode() {
            scanMode = !scanMode;
            const button = document.getElementById('scan-toggle');
            const indicator = document.getElementById('scan-indicator');
            const controls = document.getElementById('scan-controls');

            if (scanMode) {
                startScanning();
                button.textContent = '⏹️ Parar Varredura';
                button.setAttribute('aria-label', 'Parar modo de varredura automática');
                indicator.style.display = 'block';
                controls.style.display = 'block';
                updateStatus('Modo de varredura ativado - Use ENTER para selecionar');
            } else {
                stopScanning();
                button.textContent = '🔄 Ativar Varredura';
                button.setAttribute('aria-label', 'Ativar modo de varredura automática');
                indicator.style.display = 'none';
                controls.style.display = 'none';
                updateStatus('Modo de varredura desativado');
            }

            saveUserSettings();
        }

        function startScanning() {
            scanElements = document.querySelectorAll('.scannable:not([disabled])');
            currentScanIndex = 0;
            scanPaused = false;

            if (scanElements.length > 0) {
                scanInterval = setInterval(nextScanElement, scanSpeed);
                highlightCurrentElement();
            }
        }

        function stopScanning() {
            if (scanInterval) {
                clearInterval(scanInterval);
                scanInterval = null;
            }

            scanElements.forEach(el => el.classList.remove('scan-active'));
            scanElements = [];
            currentScanIndex = 0;
        }

        function nextScanElement() {
            if (scanPaused) return;

            if (scanElements[currentScanIndex]) {
                scanElements[currentScanIndex].classList.remove('scan-active');
            }

            currentScanIndex = (currentScanIndex + 1) % scanElements.length;
            highlightCurrentElement();
        }

        function highlightCurrentElement() {
            if (scanElements[currentScanIndex]) {
                const element = scanElements[currentScanIndex];
                element.classList.add('scan-active');

                element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                if (soundsEnabled) {
                    playDifferentSound(800);
                }

                const label = element.getAttribute('aria-label') || element.textContent;
                updateStatus(`Selecionando: ${label.trim()}`);
            }
        }

        function selectCurrentScanElement() {
            if (scanElements[currentScanIndex] && scanMode) {
                const element = scanElements[currentScanIndex];
                element.classList.remove('scan-active');
                element.click();
                playFeedbackSound();
                return true;
            }
            return false;
        }

        function pauseScanning() {
            scanPaused = !scanPaused;
            const button = document.getElementById('pause-scan');

            if (scanPaused) {
                button.textContent = '▶️ Continuar';
                updateStatus('Varredura pausada');
            } else {
                button.textContent = '⏸️ Pausar';
                updateStatus('Varredura retomada');
            }
        }

        function setScanSpeed(speed) {
            scanSpeed = speed;
            updateStatus(`Velocidade definida: ${speed / 1000} segundos`);

            if (scanMode) {
                stopScanning();
                startScanning();
            }

            saveUserSettings();
        }

        // ===== FUNÇÕES DE SOM =====
        function playFeedbackSound() {
            playDifferentSound(800, 0.1);
        }

        function playErrorSound() {
            playDifferentSound(300, 0.2);
        }

        function playDifferentSound(frequency, duration = 0.1) {
            if (!soundsEnabled) return;

            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            } catch (error) {
                console.log('Erro ao reproduzir som');
            }
        }

        // ===== FUNÇÕES DE STATUS =====
        function updateStatus(message) {
            const statusBar = document.getElementById('status-bar');
            statusBar.textContent = message;
            statusBar.setAttribute('aria-live', 'polite');

            setTimeout(() => {
                if (!scanMode) {
                    statusBar.textContent = 'EASYFACE ativo - Use TAB para navegar';
                } else {
                    statusBar.textContent = 'EASYFACE - Modo varredura ativo - ENTER para selecionar';
                }
            }, 3000);
        }

        // ===== FUNÇÕES DE RECONHECIMENTO DE VOZ =====
        function checkVoiceRecognitionSupport() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                const voiceWarning = document.createElement('div');
                voiceWarning.className = 'alert-warning';
                voiceWarning.innerHTML = `
                    <strong>⚠️ Comando de Voz Indisponível</strong><br>
                    Seu navegador não suporta reconhecimento de voz. 
                    Recomendamos usar Google Chrome para ter acesso a todos os recursos.
                `;

                const settingsDiv = document.getElementById('accessibility-settings');
                if (settingsDiv) {
                    settingsDiv.appendChild(voiceWarning);
                }
                return false;
            }
            return true;
        }

        function setupVoiceRecognition() {
            if (!checkVoiceRecognitionSupport()) return;

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.continuous = false;
            recognition.interimResults = false;

            function startVoiceCommand() {
                try {
                    recognition.start();
                    updateStatus('Escutando comando de voz... Diga: "editor", "calculadora", etc.');
                } catch (error) {
                    updateStatus('Erro ao iniciar reconhecimento de voz');
                    playErrorSound();
                }
            }

            recognition.onresult = function (event) {
                const command = event.results[0][0].transcript.toLowerCase().trim();
                updateStatus(`Comando reconhecido: ${command}`);

                if (command.includes('editor') || command.includes('texto')) {
                    showTextEditor();
                } else if (command.includes('arquivo') || command.includes('documento')) {
                    showFileManager();
                } else if (command.includes('calculadora') || command.includes('calcular')) {
                    showCalculator();
                } else if (command.includes('site') || command.includes('internet') || command.includes('navegador')) {
                    showSiteLauncher();
                } else if (command.includes('mídia') || command.includes('vídeo') || command.includes('áudio')) {
                    showMediaPlayer();
                } else if (command.includes('pdf') || command.includes('leitor')) {
                    showPdfReader();
                } else if (command.includes('comunicação') || command.includes('mensagem') || command.includes('falar')) {
                    showCommunicationAid();
                } else if (command.includes('email') || command.includes('correio') || command.includes('gmail')) {
                    showEmailIntegration();
                } else if (command.includes('configurações') || command.includes('configurar')) {
                    showAccessibilitySettings();
                } else if (command.includes('ajuda') || command.includes('socorro')) {
                    showHelp();
                } else if (command.includes('varredura') || command.includes('escanear')) {
                    toggleScanMode();
                } else if (command.includes('início') || command.includes('menu')) {
                    showApp('welcome');
                } else {
                    updateStatus('Comando não reconhecido. Tente: "editor", "calculadora", "configurações"...');
                    playErrorSound();
                }
            };

            recognition.onerror = function (event) {
                updateStatus('Erro no reconhecimento de voz: ' + event.error);
                playErrorSound();
            };

            // Adicionar botão de comando de voz
            const voiceButton = document.createElement('button');
            voiceButton.className = 'menu-button scannable';
            voiceButton.innerHTML = '🎤 Comando de Voz';
            voiceButton.onclick = startVoiceCommand;
            voiceButton.tabIndex = 90;
            voiceButton.setAttribute('aria-label', 'Ativar comando de voz - Diga o nome da funcionalidade desejada');
            document.querySelector('.sidebar').appendChild(voiceButton);
        }

        // ===== INICIALIZAÇÃO DA CALCULADORA =====
        function initCalculator() {
            const calculatorApp = document.getElementById('calculator-app');
            if (!calculatorApp) return;

            // Atualiza calcFocus quando um botão ganha foco
            document.querySelectorAll('.calc-button').forEach(button => {
                button.addEventListener('focus', function () {
                    for (let row = 0; row < calcGrid.length; row++) {
                        for (let col = 0; col < calcGrid[row].length; col++) {
                            if (calcGrid[row][col] === parseInt(this.getAttribute('tabindex'))) {
                                calcFocus = { row, col };
                                document.querySelectorAll('.calc-button').forEach(btn => btn.classList.remove('navigation-focus'));
                                this.classList.add('navigation-focus');
                                return;
                            }
                        }
                    }
                });
            });
        }

        // ===== EVENT LISTENERS GERAL (ÚNICO E CONSOLIDADO) =====
        document.addEventListener('keydown', function (e) {
            const focused = document.activeElement;
            const isCalcButtonFocused = focused && focused.classList.contains('calc-button');

            // Lógica de navegação da calculadora com setas e outras teclas
            if (currentApp === 'calculator-app' && isCalcButtonFocused) {
                const key = e.key;

                if (key === 'Tab') {
                    // Permitir navegação normal com Tab
                    return;
                }

                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                    e.preventDefault();
                    if (key === 'ArrowRight') moveCalcFocus(0, 1);
                    else if (key === 'ArrowLeft') moveCalcFocus(0, -1);
                    else if (key === 'ArrowDown') moveCalcFocus(1, 0);
                    else if (key === 'ArrowUp') moveCalcFocus(-1, 0);
                    return;
                }

                if ('0123456789.+-*/'.includes(key)) {
                    e.preventDefault();
                    addToCalc(key);
                    return;
                } else if (key === 'Enter') {
                    e.preventDefault();
                    if (focused && focused.classList.contains('calc-button')) {
                        focused.click();
                    } else {
                        calculateResult();
                    }
                    return;
                } else if (key === 'Escape') {
                    e.preventDefault();
                    clearCalc();
                    return;
                } else if (key === 'Backspace') {
                    e.preventDefault();
                    deleteLast();
                    return;
                }
            }

            if (e.ctrlKey) {
                // Verificar atalhos personalizados primeiro
                if (customShortcuts.text && e.key === customShortcuts.text) {
                    e.preventDefault();
                    showTextEditor();
                    return;
                }
                if (customShortcuts.file && e.key === customShortcuts.file) {
                    e.preventDefault();
                    showFileManager();
                    return;
                }
                if (customShortcuts.calc && e.key === customShortcuts.calc) {
                    e.preventDefault();
                    showCalculator();
                    return;
                }

                // Atalhos padrão como fallback
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        showTextEditor();
                        break;
                    case '2':
                        e.preventDefault();
                        showFileManager();
                        break;
                    case '3':
                        e.preventDefault();
                        showCalculator();
                        break;
                    case '4':
                        e.preventDefault();
                        showSiteLauncher();
                        break;
                    case '5':
                        e.preventDefault();
                        showMediaPlayer();
                        break;
                    case '6':
                        e.preventDefault();
                        showPdfReader();
                        break;
                    case '7':
                        e.preventDefault();
                        showCommunicationAid();
                        break;
                    case '8':
                        e.preventDefault();
                        showEmailIntegration();
                        break;
                    case '9':
                        e.preventDefault();
                        showAccessibilitySettings();
                        break;
                    case 's':
                        e.preventDefault();
                        toggleScanMode();
                        break;
                }
            }

            // Lógica de varredura automática (após a calculadora)
            if (scanMode && e.key === 'Enter') {
                e.preventDefault();
                if (selectCurrentScanElement()) {
                    return;
                }
            }

            // ESC volta ao menu principal
            if (e.key === 'Escape') {
                if (scanMode) {
                    toggleScanMode();
                } else {
                    showApp('welcome');
                    const firstButton = document.querySelector('.menu-button');
                    if (firstButton) firstButton.focus();
                }
                e.preventDefault();
                return;
            }

            // Barra de espaço para pausar varredura
            if (scanMode && e.key === ' ') {
                e.preventDefault();
                pauseScanning();
                return;
            }

            // Atalhos de teclado para apps (Ctrl + número)
            if (e.ctrlKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        showTextEditor();
                        break;
                    case '2':
                        e.preventDefault();
                        showCalculator();
                        break;
                    case '3':
                        e.preventDefault();
                        showSiteLauncher();
                        break;
                    case '4':
                        e.preventDefault();
                        showAccessibilitySettings();
                        break;
                    case '5':
                        e.preventDefault();
                        showHelp();
                        break;
                    case '6':
                        e.preventDefault();
                        showFileManager();
                        break;
                    case '7':
                        e.preventDefault();
                        showCommunicationAid();
                        break;
                    case '7':
                        e.preventDefault();
                        showMediaPlayer();
                        break;
                    case '8':
                        e.preventDefault();
                        showPdfReader();
                        break;
                    case '9':
                        e.preventDefault();
                        showEmailIntegration();
                        break;
                    case 's':
                        e.preventDefault();
                        toggleScanMode();
                        break;
                }
            }
        });

        // ===== INICIALIZAÇÃO =====
        document.addEventListener('DOMContentLoaded', function () {
            // Inicializar a calculadora
            initCalculator();
        });

        window.addEventListener('load', function () {
            // Verificar e configurar reconhecimento de voz
            setupVoiceRecognition();

            // Carregar configurações salvas
            loadUserSettings();

            updateStatus('EASYFACE carregado e pronto para uso!');

            // Carregar atalhos personalizados
            loadShortcuts();

            // Configurar eventos para os novos inputs de arquivo
            setupFileInputs();

            // Foco inicial no primeiro botão do menu após um delay
            setTimeout(() => {
                if (!scanMode) {
                    const firstButton = document.querySelector('.menu-button');
                    if (firstButton) firstButton.focus();
                }
            }, 1000);
        });

        function setupFileInputs() {
            // Configurar aria-labels para inputs de arquivo
            document.getElementById('file-input').setAttribute('aria-label', 'Selecionar arquivo de texto');
            document.getElementById('media-input').setAttribute('aria-label', 'Selecionar arquivo de mídia');
            document.getElementById('pdf-input').setAttribute('aria-label', 'Selecionar arquivo PDF');
        }