// ===== VARIÁVEIS GLOBAIS =====

// Controle de estado da aplicação
let currentApp = 'welcome'; // App atualmente ativo na tela
let calcDisplay = 'Calculadora'; // Texto mostrado no display da calculadora
let calcExpression = ''; // Expressão matemática sendo construída
let soundsEnabled = true; // Controla se sons de feedback estão ativos
let highContrast = false; // Controla modo de alto contraste

// Variáveis para varredura automática (assistive scanning)
let scanMode = false; // Indica se o modo de varredura está ativo
let scanInterval = null; // ID do intervalo que controla a varredura
let scanElements = []; // Array com elementos que podem ser varridos
let currentScanIndex = 0; // Índice do elemento atualmente destacado
let scanSpeed = 2000; // Velocidade da varredura em milissegundos (2 segundos)
let scanPaused = false; // Indica se a varredura está pausada

// Variáveis para navegação na calculadora com setas do teclado
let calcFocus = { row: 0, col: 0 }; // Posição atual na grade da calculadora
// Mapeamento da grade de botões da calculadora (tabindex de cada posição)
const calcGrid = [
    [11, 12, 13, 14],   // C, ⌫, ÷, ×
    [15, 16, 17, 18],   // 7, 8, 9, -
    [19, 20, 21, 22],   // 4, 5, 6, +
    [23, 24, 25, 26],   // 1, 2, 3, =
    [27, 27, 28, 26]    // 0 (span 2 colunas), ., = (duplicado)
];

// Variáveis para funcionalidades específicas
let currentPdf = null; // Objeto PDF atualmente carregado
let currentPage = 1; // Página atual do PDF
let pdfTotalPages = 0; // Total de páginas do PDF
let pdfScale = 1.5; // Nível de zoom do PDF
let customShortcuts = {}; // Atalhos de teclado personalizados pelo usuário

// Frases pré-definidas para comunicação alternativa (CAA)
let communicationPhrases = {
    saudacoes: ["Olá", "Bom dia", "Boa tarde", "Boa noite", "Tudo bem?", "Prazer em conhecê-lo"],
    necessidades: ["Estou com fome", "Estou com sede", "Preciso ir ao banheiro", "Estou com dor", "Preciso de ajuda"],
    sentimentos: ["Estou feliz", "Estou triste", "Estou cansado", "Estou com medo", "Estou com raiva", "Eu te amo"],
    emergencia: ["Preciso de ajuda urgente", "Chame um médico", "Ligue para minha família", "Não estou me sentindo bem"]
};

// Variáveis para navegação nas configurações
let settingsFocusIndex = 0; // Índice do elemento focado nas configurações
let settingsButtons = []; // Array de botões nas configurações

// ===== FUNÇÕES DE CONFIGURAÇÃO =====

/**
 * Carrega as configurações salvas do usuário do localStorage
 * Aplica automaticamente fonte, contraste, sons e velocidade de varredura
 */
function loadUserSettings() {
    try {
        // Tenta recuperar configurações salvas
        const saved = JSON.parse(localStorage.getItem('easyface-settings') || '{}');

        // Aplica cada configuração se existir
        if (saved.fontSize) changeFontSize(saved.fontSize);
        if (saved.highContrast) toggleContrast();
        if (saved.soundsEnabled !== undefined) soundsEnabled = saved.soundsEnabled;
        if (saved.scanSpeed) scanSpeed = saved.scanSpeed;

        updateStatus('Configurações carregadas');
    } catch (error) {
        // Se houver erro, usa configurações padrão
        updateStatus('Configurações padrão aplicadas');
    }
}

/**
 * Salva as configurações atuais do usuário no localStorage
 * Chamada automaticamente quando qualquer configuração é alterada
 */
function saveUserSettings() {
    try {
        // Monta objeto com configurações atuais
        const settings = {
            fontSize: getCurrentFontSize(),
            highContrast: highContrast,
            soundsEnabled: soundsEnabled,
            scanSpeed: scanSpeed
        };
        // Salva no localStorage
        localStorage.setItem('easyface-settings', JSON.stringify(settings));
        updateStatus('Configurações salvas automaticamente');
    } catch (error) {
        console.log('Não foi possível salvar configurações');
    }
}

/**
 * Obtém o tamanho de fonte atual baseado no fontSize do body
 * @returns {string} 'small', 'medium' ou 'large'
 */
function getCurrentFontSize() {
    const size = parseInt(document.body.style.fontSize);
    if (size <= 16) return 'small';
    if (size <= 18) return 'medium';
    return 'large';
}

// ===== FUNÇÕES DE NAVEGAÇÃO =====

/**
 * Exibe um aplicativo específico e esconde todos os outros
 * Reinicia a varredura automática se estiver ativa
 * @param {string} appId - ID do elemento HTML do aplicativo
 */
function showApp(appId) {
    const previousApp = currentApp;
    
    // Esconde todos os aplicativos
    const apps = document.querySelectorAll('.app-container');
    apps.forEach(app => {
        app.classList.add('hidden');
    });

    // Mostra o aplicativo selecionado
    const currentAppElement = document.getElementById(appId);
    if (currentAppElement) {
        currentAppElement.classList.remove('hidden');
    }
    
    currentApp = appId;
    playFeedbackSound();

    console.log(`Mudando de app: ${previousApp} → ${appId}, ScanMode: ${scanMode}`);
    
    // Reinicia varredura ao mudar de app (se scanMode ativo)
    if (scanMode) {
        console.log(`Reiniciando varredura para: ${appId}`);
        setTimeout(() => {
            restartScan();
        }, 300);
    }
}

/**
 * Abre o Editor de Texto e foca automaticamente na área de texto
 */
function showTextEditor() {
    try {
        showApp('text-editor-app');
        // Foca na área de texto quando o editor é aberto (exceto em modo varredura)
        setTimeout(() => {
            const editorArea = document.querySelector('#text-editor-app textarea, #text-editor-app input, #text-editor-app [contenteditable="true"]');
            if (editorArea && !scanMode) {
                editorArea.focus();
            }
        }, 100);
    } catch (error) {
        console.error('Erro em showTextEditor:', error);
        updateStatus('Erro ao abrir editor de texto');
    }
}

/**
 * Abre a Calculadora e foca no botão 7 (primeiro número)
 * Inicializa a posição de foco na grade
 */
function showCalculator() {
    try {
        showApp('calculator-app');
        // Foca no botão 7 quando a calculadora é aberta
        setTimeout(() => {
            const firstNumber = document.querySelector('.calc-button[data-key="7"]');
            if (firstNumber && !scanMode) {
                firstNumber.focus();
                calcFocus = { row: 1, col: 0 }; // Posição do número 7 na grade
                document.querySelectorAll('.calc-button').forEach(btn => {
                    btn.classList.remove('navigation-focus');
                });
                firstNumber.classList.add('navigation-focus');
            }
        }, 100);
    } catch (error) {
        console.error('Erro em showCalculator:', error);
        updateStatus('Erro ao abrir calculadora');
    }
}

/**
 * Abre o Lançador de Sites e foca no botão do Google
 */
function showSiteLauncher() {
    try {
        showApp('site-launcher-app');
        setTimeout(() => {
            const googleButton = document.querySelector('.site-button[onclick*="google.com"]');
            if (googleButton && !scanMode) {
                googleButton.focus();
            }
        }, 100);
    } catch (error) {
        console.error('Erro em showSiteLauncher:', error);
        updateStatus('Erro ao abrir sites seguros');
    }
}

/**
 * Abre as Configurações de Acessibilidade
 * Atualiza a lista de botões navegáveis e foca no primeiro
 */
function showAccessibilitySettings() {
    try {
        showApp('accessibility-settings-app');

        // Atualiza a lista de botões navegáveis
        setTimeout(() => {
            settingsButtons = Array.from(document.querySelectorAll('#accessibility-settings-app .action-button, #accessibility-settings-app .scannable'));
            settingsFocusIndex = 0;

            // Foca no botão de fonte pequena quando a seção é aberta
            const smallFontButton = document.querySelector('#accessibility-settings-app button[onclick*="small"]');
            if (smallFontButton && !scanMode) {
                const index = settingsButtons.indexOf(smallFontButton);
                if (index !== -1) {
                    settingsFocusIndex = index;
                }
            }

            if (settingsButtons[settingsFocusIndex]) {
                settingsButtons[settingsFocusIndex].focus();
                highlightSettingsElement(settingsButtons[settingsFocusIndex]);
            }
        }, 100);
    } catch (error) {
        console.error('Erro em showAccessibilitySettings:', error);
        updateStatus('Erro ao abrir configurações');
    }
}

/**
 * Destaca visualmente um elemento nas configurações
 * Remove destaque anterior e aplica ao novo elemento
 * @param {HTMLElement} element - Elemento a ser destacado
 */
function highlightSettingsElement(element) {
    // Remove destaque anterior
    document.querySelectorAll('#accessibility-settings-app .action-button, #accessibility-settings-app .scannable').forEach(btn => {
        btn.classList.remove('navigation-focus');
    });
    // Adiciona destaque ao elemento atual
    if (element) {
        element.classList.add('navigation-focus');
    }
}

/**
 * Navega entre elementos nas configurações usando setas
 * @param {number} direction - 1 para avançar, -1 para retroceder
 */
function moveSettingsFocus(direction) {
    if (settingsButtons.length === 0) return;

    // Remove destaque do elemento atual
    if (settingsButtons[settingsFocusIndex]) {
        settingsButtons[settingsFocusIndex].classList.remove('navigation-focus');
    }

    // Calcula novo índice (com wrap-around circular)
    settingsFocusIndex = (settingsFocusIndex + direction + settingsButtons.length) % settingsButtons.length;

    // Aplica foco e destaque ao novo elemento
    if (settingsButtons[settingsFocusIndex]) {
        settingsButtons[settingsFocusIndex].focus();
        highlightSettingsElement(settingsButtons[settingsFocusIndex]);
    }
}

/**
 * Abre a Central de Ajuda
 */
function showHelp() {
    try {
        showApp('help-app');
        setTimeout(() => {
            const closeButton = document.getElementById('close-help');
            if (closeButton && !scanMode) {
                closeButton.focus();
            }
        }, 100);
    } catch (error) {
        console.error('Erro em showHelp:', error);
        updateStatus('Erro ao abrir menu de ajuda');
    }
}

// ===== FUNÇÕES GERENCIADOR DE ARQUIVOS =====

/**
 * Abre o Gerenciador de Arquivos e foca no botão de carregar
 */
function showFileManager() {
    try {
        showApp('file-manager-app');
        setTimeout(() => {
            const openFileButton = document.querySelector('#file-manager-app .action-button');
            if (openFileButton && !scanMode) {
                openFileButton.focus();
            }
        }, 100);
    } catch (error) {
        console.error('Erro em showFileManager:', error);
        updateStatus('Erro ao abrir gerenciador de arquivos');
    }
}

/**
 * Event listener para carregamento de arquivos de texto
 * Lê o arquivo e exibe seu conteúdo na textarea
 */
document.getElementById('file-input').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Exibe conteúdo do arquivo na textarea
            document.getElementById('file-text-area').value = e.target.result;
            document.getElementById('file-info').textContent = `Arquivo "${file.name}" carregado com sucesso.`;
            speakFeedback(`Arquivo ${file.name} carregado com sucesso`);
        };
        reader.readAsText(file); // Lê arquivo como texto
    }
});

/**
 * Salva o conteúdo da textarea como arquivo .txt
 * Cria um blob e inicia download
 */
function saveTextFile() {
    const text = document.getElementById('file-text-area').value;
    if (text.trim()) {
        // Cria arquivo blob
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Cria link temporário e clica para download
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

// ===== FUNÇÕES REPRODUTOR DE MÍDIA =====

/**
 * Abre o Reprodutor de Mídia e foca no botão de carregar
 */
function showMediaPlayer() {
    try {
        showApp('media-player-app');
        setTimeout(() => {
            const loadButton = document.querySelector('#media-player-app .action-button');
            if (loadButton && !scanMode) {
                loadButton.focus();
            }
        }, 100);
    } catch (error) {
        console.error('Erro em showMediaPlayer:', error);
        updateStatus('Erro ao abrir reprodutor de mídia');
    }
}

/**
 * Event listener para carregamento de arquivos de mídia
 * Detecta se é áudio ou vídeo e carrega no player apropriado
 */
document.getElementById('media-input').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        
        // Verifica tipo de arquivo e escolhe player correto
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

// ===== FUNÇÕES LEITOR DE PDF =====

/**
 * Abre o Leitor de PDF e inicializa a biblioteca PDF.js
 */
function showPdfReader() {
    try {
        showApp('pdf-reader-app');
        setTimeout(() => {
            const loadButton = document.querySelector('#pdf-reader-app .action-button');
            if (loadButton && !scanMode) {
                loadButton.focus();
            }
        }, 100);

        // Configura worker do PDF.js (necessário para processar PDFs)
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.worker.min.js';
    } catch (error) {
        console.error('Erro em showPdfReader:', error);
        updateStatus('Erro ao abrir leitor de PDF');
    }
}

/**
 * Event listener para carregamento de arquivos PDF
 * Lê o arquivo e carrega no visualizador
 */
document.getElementById('pdf-input').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        const fileReader = new FileReader();
        fileReader.onload = function () {
            // Converte para Uint8Array (formato necessário para PDF.js)
            const typedarray = new Uint8Array(this.result);
            loadPdf(typedarray);
        };
        fileReader.readAsArrayBuffer(file); // Lê como array buffer
        document.getElementById('pdf-info').textContent = `PDF "${file.name}" carregado.`;
        speakFeedback(`PDF ${file.name} carregado`);
    }
});

/**
 * Carrega um PDF usando a biblioteca PDF.js
 * @param {Uint8Array} data - Dados do PDF em formato binário
 */
function loadPdf(data) {
    pdfjsLib.getDocument(data).promise.then(function (pdf) {
        currentPdf = pdf;
        pdfTotalPages = pdf.numPages;
        currentPage = 1;
        renderPage(currentPage); // Renderiza primeira página
    });
}

/**
 * Renderiza uma página específica do PDF no canvas
 * @param {number} pageNum - Número da página a renderizar
 */
function renderPage(pageNum) {
    if (!currentPdf) return;

    currentPdf.getPage(pageNum).then(function (page) {
        // Calcula dimensões baseadas no zoom
        const viewport = page.getViewport({ scale: pdfScale });
        const canvas = document.getElementById('pdf-canvas');
        const context = canvas.getContext('2d');
        
        // Ajusta tamanho do canvas
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Renderiza página no canvas
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

/**
 * Navega para a página anterior do PDF
 */
function prevPage() {
    if (currentPdf && currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
}

/**
 * Navega para a próxima página do PDF
 */
function nextPage() {
    if (currentPdf && currentPage < pdfTotalPages) {
        currentPage++;
        renderPage(currentPage);
    }
}

/**
 * Aumenta o zoom do PDF em 25%
 */
function zoomIn() {
    pdfScale += 0.25;
    if (currentPdf) renderPage(currentPage);
}

/**
 * Diminui o zoom do PDF em 25% (mínimo 0.5)
 */
function zoomOut() {
    if (pdfScale > 0.5) {
        pdfScale -= 0.25;
        if (currentPdf) renderPage(currentPage);
    }
}

// ===== COMUNICAÇÃO ALTERNATIVA (CAA) =====

// Variáveis para navegação na comunicação alternativa
let commFocus = {
    section: 'controls', // Seção atual: 'controls', 'categories' ou 'phrases'
    index: 0 // Índice do elemento focado na seção
};
let currentCategory = null; // Categoria de frases atualmente selecionada
const categories = ['saudacoes', 'necessidades', 'sentimentos', 'emergencia'];

// Objeto para armazenar elementos navegáveis
let commElements = {
    controls: [],   // Botões Falar e Limpar
    categories: [], // Botões de categoria
    phrases: []     // Botões de frases
};

/**
 * Atualiza a lista de elementos navegáveis na comunicação alternativa
 * Necessário chamar toda vez que a interface muda
 */
function updateCommElements() {
    commElements.controls = Array.from(document.querySelectorAll('.communication-controls .action-button'));
    commElements.categories = Array.from(document.querySelectorAll('.category-button'));
    commElements.phrases = Array.from(document.querySelectorAll('.phrase-button'));
}

/**
 * Move o foco entre elementos na comunicação alternativa
 * Navega de forma inteligente entre controles → categorias → frases
 * @param {number} direction - 1 para avançar, -1 para retroceder
 */
function moveCommFocus(direction) {
    updateCommElements();

    if (commFocus.section === 'controls') {
        // Navegação nos controles (Falar, Limpar)
        const newIndex = commFocus.index + direction;

        if (newIndex >= 0 && newIndex < commElements.controls.length) {
            // Continua nos controles
            commFocus.index = newIndex;
            commElements.controls[newIndex].focus();
            highlightCommElement(commElements.controls[newIndex]);
        }
        else if (newIndex >= commElements.controls.length && direction === 1) {
            // Avança para categorias
            moveToCategories();
        }
        else if (newIndex < 0 && direction === -1 && commElements.phrases.length > 0) {
            // Volta das frases (wrap-around circular)
            moveToPhrases(commElements.phrases.length - 1);
        }

    } else if (commFocus.section === 'categories') {
        // Navegação nas categorias
        const newIndex = commFocus.index + direction;

        if (newIndex >= 0 && newIndex < commElements.categories.length) {
            // Continua nas categorias
            commFocus.index = newIndex;
            commElements.categories[newIndex].focus();
            highlightCommElement(commElements.categories[newIndex]);
        }
        else if (newIndex >= commElements.categories.length && direction === 1 && commElements.phrases.length > 0) {
            // Avança para frases
            moveToPhrases();
        }
        else if (newIndex < 0 && direction === -1) {
            // Volta para controles
            moveToControls(commElements.controls.length - 1);
        }

    } else if (commFocus.section === 'phrases') {
        // Navegação nas frases
        const newIndex = commFocus.index + direction;

        if (newIndex >= 0 && newIndex < commElements.phrases.length) {
            // Continua nas frases
            commFocus.index = newIndex;
            commElements.phrases[newIndex].focus();
            highlightCommElement(commElements.phrases[newIndex]);
        }
        else if (newIndex >= commElements.phrases.length && direction === 1) {
            // Volta para controles (wrap-around circular completo)
            moveToControls();
        }
        else if (newIndex < 0 && direction === -1) {
            // Volta para categorias
            moveToCategories(commElements.categories.length - 1);
        }
    }
}

/**
 * Move o foco para a seção de controles (Falar/Limpar)
 * @param {number} targetIndex - Índice do botão a focar (padrão: 0)
 */
function moveToControls(targetIndex = 0) {
    commFocus.section = 'controls';
    commFocus.index = targetIndex;
    updateCommElements();

    if (commElements.controls[targetIndex]) {
        commElements.controls[targetIndex].focus();
        highlightCommElement(commElements.controls[targetIndex]);
    }
}

/**
 * Move o foco para a seção de categorias
 * @param {number} targetIndex - Índice da categoria a focar (padrão: 0)
 */
function moveToCategories(targetIndex = 0) {
    commFocus.section = 'categories';
    commFocus.index = targetIndex;
    updateCommElements();

    if (commElements.categories[targetIndex]) {
        commElements.categories[targetIndex].focus();
        highlightCommElement(commElements.categories[targetIndex]);
    }
}

/**
 * Move o foco para a seção de frases
 * @param {number} targetIndex - Índice da frase a focar (padrão: 0)
 */
function moveToPhrases(targetIndex = 0) {
    if (commElements.phrases.length > 0) {
        commFocus.section = 'phrases';
        commFocus.index = targetIndex;
        updateCommElements();

        if (commElements.phrases[targetIndex]) {
            commElements.phrases[targetIndex].focus();
            highlightCommElement(commElements.phrases[targetIndex]);
        }
    }
}

/**
 * Destaca visualmente um elemento na comunicação alternativa
 * @param {HTMLElement} element - Elemento a ser destacado
 */
function highlightCommElement(element) {
    // Remove destaque anterior
    document.querySelectorAll('.action-button, .category-button, .phrase-button').forEach(btn => {
        btn.classList.remove('navigation-focus');
    });
    // Adiciona destaque ao elemento atual
    if (element) {
        element.classList.add('navigation-focus');
    }
}

/**
 * Seleciona uma categoria e exibe suas frases
 * @param {string} category - Nome da categoria (ex: 'saudacoes')
 */
function selectCategory(category) {
    currentCategory = category;
    showPhrases(category);

    // Atualiza elementos e move foco para as frases
    setTimeout(() => {
        updateCommElements();
        if (commElements.phrases.length > 0) {
            moveToPhrases();
        }
    }, 100);
}

/**
 * Volta da visualização de frases para as categorias
 * Limpa o container de frases
 */
function backToCategories() {
    currentCategory = null;
    document.getElementById('phrases-container').innerHTML = '';

    // Volta para as categorias
    setTimeout(() => {
        updateCommElements();
        moveToCategories();
    }, 100);
}

/**
 * Abre o aplicativo de Comunicação Alternativa
 * Inicializa com foco nos controles
 */
function showCommunicationAid() {
    try {
        showApp('communication-aid-app');
        setTimeout(() => {
            commFocus = { section: 'controls', index: 0 };
            currentCategory = null;
            updateCommElements();
            const speakButton = document.getElementById('speak-button');
            if (speakButton && !scanMode) {
                speakButton.focus();
                highlightCommElement(speakButton);
            }
        }, 100);
    } catch (error) {
        console.error('Erro em showCommunicationAid:', error);
        updateStatus('Erro ao abrir comunicação alternativa');
    }
}

/**
 * Cria botões para as frases de uma categoria específica
 * @param {string} category - Nome da categoria
 */
function showPhrases(category) {
    const container = document.getElementById('phrases-container');
    container.innerHTML = ''; // Limpa frases anteriores

    // Cria um botão para cada frase da categoria
    communicationPhrases[category].forEach((phrase, index) => {
        const button = document.createElement('button');
        button.className = 'phrase-button scannable';
        button.textContent = phrase;
        button.tabIndex = 50 + index;
        button.setAttribute('aria-label', `Selecionar frase: ${phrase}`);
        
        // Ao clicar, exibe a frase no display
        button.onclick = function () {
            document.getElementById('communication-display').textContent = phrase;
            speakFeedback(`${phrase}`);
        };
        
        container.appendChild(button);
    });
}

/**
 * Fala o texto exibido no display usando síntese de voz
 */
function speakCommunication() {
    const text = document.getElementById('communication-display').textContent;
    if (text && text !== 'Sua mensagem aparecerá aqui...' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        speechSynthesis.speak(utterance);
        speakFeedback('Mensagem falada');
    }
}

/**
 * Limpa a mensagem do display de comunicação
 */
function clearCommunication() {
    document.getElementById('communication-display').textContent = 'Sua mensagem aparecerá aqui...';
    speakFeedback('Mensagem limpa');
}

// ===== PERSONALIZAÇÃO DE ATALHOS =====

/**
 * Carrega atalhos de teclado personalizados do localStorage
 * Preenche os campos de input com os valores salvos
 */
function loadShortcuts() {
    try {
        const saved = JSON.parse(localStorage.getItem('easyface-shortcuts') || '{}');
        customShortcuts = saved;

        // Aplica atalhos salvos aos campos de input
        if (saved.text) document.getElementById('shortcut-text').value = saved.text;
        if (saved.file) document.getElementById('shortcut-file').value = saved.file;
        if (saved.calc) document.getElementById('shortcut-calc').value = saved.calc;
        if (saved.site) document.getElementById('shortcut-site').value = saved.site;
        if (saved.media) document.getElementById('shortcut-media').value = saved.media;
        if (saved.pdf) document.getElementById('shortcut-pdf').value = saved.pdf;
        if (saved.commu) document.getElementById('shortcut-comm').value = saved.commu;
        if (saved.conf) document.getElementById('shortcut-conf').value = saved.conf;
        if (saved.help) document.getElementById('shortcut-help').value = saved.help;
    } catch (error) {
        console.log('Não foi possível carregar atalhos personalizados');
    }
}

/**
 * Salva os atalhos personalizados definidos pelo usuário
 * Lê os valores dos campos e armazena no localStorage
 */
function saveShortcuts() {
    try {
        customShortcuts = {
            text: document.getElementById('shortcut-text').value,
            file: document.getElementById('shortcut-file').value,
            calc: document.getElementById('shortcut-calc').value,
            site: document.getElementById('shortcut-site').value,
            media: document.getElementById('shortcut-media').value,
            pdf: document.getElementById('shortcut-pdf').value,
            comm: document.getElementById('shortcut-comm').value,
            conf: document.getElementById('shortcut-conf').value,
            help: document.getElementById('shortcut-help').value
        };

        localStorage.setItem('easyface-shortcuts', JSON.stringify(customShortcuts));
        updateStatus('Atalhos personalizados salvos');
        speakFeedback('Atalhos personalizados salvos');
    } catch (error) {
        console.log('Não foi possível salvar atalhos personalizados');
    }
}

// ===== LEITOR DE TELA (TEXT-TO-SPEECH) =====

/**
 * Fornece feedback de voz usando a API Web Speech
 * @param {string} message - Mensagem a ser falada
 */
function speakFeedback(message) {
    if (soundsEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.volume = 0.8; // Volume (0 a 1)
        utterance.rate = 0.9;   // Velocidade da fala
        utterance.pitch = 1;    // Tom da voz
        speechSynthesis.speak(utterance);
    }
}

// ===== FUNÇÕES DO EDITOR DE TEXTO =====

/**
 * Salva o conteúdo da textarea como arquivo .txt
 * Cria um blob e inicia o download
 */
function saveText() {
    const text = document.getElementById('text-area').value;
    if (text.trim()) {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'easyface-texto.txt';
        a.click(); // Inicia o download
        updateStatus('Texto salvo com sucesso!');
        playFeedbackSound();
    } else {
        updateStatus('Nenhum texto para salvar.');
    }
}

/**
 * Limpa todo o conteúdo da textarea do editor
 */
function clearText() {
    document.getElementById('text-area').value = '';
    updateStatus('Texto limpo.');
    playFeedbackSound();
}

/**
 * Lê o texto da textarea em voz alta usando síntese de voz
 */
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

/**
 * Adiciona um valor (número ou operador) à expressão da calculadora
 * @param {string} value - Valor a adicionar (número ou operador)
 */
function addToCalc(value) {
    if (calcDisplay === '0' && !isNaN(value)) {
        // Se display está em zero e valor é número, substitui
        calcDisplay = value;
    } else {
        // Caso contrário, adiciona ao final
        calcDisplay += value;
    }
    calcExpression += value; // Adiciona também à expressão completa
    document.getElementById('calc-display').textContent = calcDisplay;
    playFeedbackSound();
}

/**
 * Calcula o resultado da expressão matemática atual
 * Usa eval() para avaliar a expressão (com precauções)
 */
function calculateResult() {
    if (calcExpression.trim() === '') {
        calcDisplay = '0';
        document.getElementById('calc-display').textContent = calcDisplay;
        return;
    }

    try {
        // Substitui símbolos visuais por operadores JavaScript
        const expressionToEval = calcExpression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-');

        const result = eval(expressionToEval); // Calcula resultado
        calcDisplay = result.toString();
        calcExpression = result.toString();
        document.getElementById('calc-display').textContent = calcDisplay;
    } catch (error) {
        // Se houver erro na expressão
        calcDisplay = 'Erro';
        calcExpression = '';
        document.getElementById('calc-display').textContent = calcDisplay;
    }
}

/**
 * Limpa completamente a calculadora (C)
 */
function clearCalc() {
    calcDisplay = '0';
    calcExpression = '';
    document.getElementById('calc-display').textContent = calcDisplay;
    updateStatus('Calculadora limpa');
    playFeedbackSound();
}

/**
 * Apaga o último caractere digitado (⌫)
 */
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

// ===== NAVEGAÇÃO POR SETAS NA CALCULADORA =====

/**
 * Move o foco entre botões da calculadora usando setas
 * @param {number} rowDelta - Mudança na linha (-1 para cima, 1 para baixo)
 * @param {number} colDelta - Mudança na coluna (-1 para esquerda, 1 para direita)
 */
function moveCalcFocus(rowDelta, colDelta) {
    // Calcula nova posição com limites da grade
    const newRow = Math.max(0, Math.min(calcFocus.row + rowDelta, calcGrid.length - 1));
    let newCol = Math.max(0, Math.min(calcFocus.col + colDelta, calcGrid[newRow].length - 1));

    // Ajuste especial para o botão 0 que ocupa duas colunas
    if (newRow === 4 && newCol === 1) {
        newCol = 0;
    }

    // Encontra o elemento a ser focado pelo tabindex
    const tabIndex = calcGrid[newRow][newCol];
    const element = document.querySelector(`.calc-button[tabindex="${tabIndex}"]`);

    if (element) {
        element.focus();
        calcFocus = { row: newRow, col: newCol };

        // Destaca visualmente o botão com foco de navegação
        document.querySelectorAll('.calc-button').forEach(btn => {
            btn.classList.remove('navigation-focus');
        });
        element.classList.add('navigation-focus');
    }
}

// ===== FUNÇÕES DO LANÇADOR DE SITES =====

/**
 * Abre um site em nova aba
 * @param {string} url - URL completa do site
 */
function launchSite(url) {
    window.open(url, '_blank', 'noopener,noreferrer'); // Abre com segurança
    updateStatus('Site aberto em nova janela: ' + url);
    playFeedbackSound();
}

/**
 * Abre um site personalizado digitado pelo usuário
 * Adiciona https:// se necessário
 */
function launchCustomSite() {
    const url = document.getElementById('custom-site-url').value.trim();
    if (!url) {
        updateStatus('Por favor, digite uma URL');
        return;
    }

    let finalUrl = url;
    // Adiciona protocolo se não tiver
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'https://' + url;
    }

    launchSite(finalUrl);
    updateStatus('Site aberto. Cuidado com sites desconhecidos.');
}

// ===== FUNÇÕES DE ACESSIBILIDADE =====

/**
 * Altera o tamanho da fonte de toda a interface
 * @param {string} size - 'small', 'medium' ou 'large'
 */
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

/**
 * Alterna o modo de alto contraste
 * Aplica filtros CSS para melhorar visibilidade
 */
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

/**
 * Ativa ou desativa sons de feedback
 */
function toggleSounds() {
    soundsEnabled = !soundsEnabled;
    updateStatus(soundsEnabled ? 'Sons ativados' : 'Sons desativados');

    saveUserSettings();
    if (soundsEnabled) playFeedbackSound();
}

// ===== FUNÇÕES DE VARREDURA AUTOMÁTICA =====

/**
 * Ativa ou desativa o modo de varredura automática
 * Em modo varredura, elementos são destacados sequencialmente
 */
function toggleScanMode() {
    scanMode = !scanMode;
    const button = document.getElementById('scan-toggle');
    const indicator = document.getElementById('scan-indicator');
    const controls = document.getElementById('scan-controls');

    console.log('=== DEBUG TOGGLE SCAN ===');
    console.log('currentApp:', currentApp);
    console.log('scanMode será:', scanMode);

    if (scanMode) {
        // Se não estiver no welcome, volta para lá
        if (currentApp !== 'welcome') {
            console.log('Forçando volta para welcome...');
            showApp('welcome');
        }

        setTimeout(() => {
            console.log('Iniciando varredura após timeout...');
            startScanning();
            button.textContent = '⏹️ Parar Varredura';
            button.setAttribute('aria-label', 'Parar modo de varredura automática');
            indicator.style.display = 'block';
            controls.style.display = 'block';
            updateStatus('Modo de varredura ativado - Use ENTER para selecionar');
            speakFeedback('Modo de varredura ativado');
        }, 300);
    } else {
        stopScanning();
        button.textContent = '🔄 Ativar Varredura';
        button.setAttribute('aria-label', 'Ativar modo de varredura automática');
        indicator.style.display = 'none';
        controls.style.display = 'none';
        updateStatus('Modo de varredura desativado');
        speakFeedback('Modo de varredura desativado');
    }

    saveUserSettings();
}

/**
 * Inicia o processo de varredura automática
 * Encontra elementos navegáveis e inicia o loop de destaque
 */
function startScanning() {
    console.log('=== START SCANNING ===');
    console.log('App atual:', currentApp);
    console.log('ScanMode:', scanMode);
    
    // Define seletor baseado no app atual
    let selector = '.scannable';
    if (currentApp !== 'welcome') {
        selector = `#${currentApp} .scannable`;
    }
    
    console.log('Seletor usado:', selector);
    
    // Filtra apenas elementos visíveis
    scanElements = Array.from(document.querySelectorAll(selector)).filter(el => {
        const isVisible = !el.disabled && 
               el.offsetParent !== null &&
               getComputedStyle(el).visibility !== 'hidden' &&
               getComputedStyle(el).display !== 'none';
        return isVisible;
    });
    
    console.log(`Elementos encontrados em ${currentApp}:`, scanElements.length);

    // Ordena elementos por posição na tela (top-left to bottom-right)
    scanElements.sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return (rectA.top - rectB.top) || (rectA.left - rectB.left);
    });

    currentScanIndex = 0;
    scanPaused = false;

    if (scanElements.length > 0) {
        if (scanInterval) {
            clearInterval(scanInterval);
        }
        // Inicia loop de varredura
        scanInterval = setInterval(nextScanElement, scanSpeed);
        highlightCurrentElement(); // Destaca primeiro elemento
    } else {
        updateStatus('Nenhum elemento encontrado para varredura');
    }
}

/**
 * Obtém nome amigável de um app pelo ID
 * @param {string} appId - ID do app
 * @returns {string} Nome amigável
 */
function getAppName(appId) {
    const appNames = {
        'welcome': 'Menu Principal',
        'text-editor-app': 'Editor de Texto',
        'file-manager-app': 'Gerenciador de Arquivos',
        'calculator-app': 'Calculadora',
        'site-launcher-app': 'Sites Seguros',
        'media-player-app': 'Reprodutor de Mídia',
        'pdf-reader-app': 'Leitor de PDF',
        'communication-aid-app': 'Comunicação Alternativa',
        'accessibility-settings-app': 'Configurações',
        'help-app': 'Ajuda'
    };
    return appNames[appId] || appId;
}

/**
 * Para completamente a varredura automática
 * Remove destaques e limpa o intervalo
 */
function stopScanning() {
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }

    // Remove destaque de todos os elementos
    scanElements.forEach(el => {
        el.classList.remove('scan-active');
        el.style.outline = '';
    });

    scanElements = [];
    currentScanIndex = 0;
    scanPaused = false;
}

/**
 * Avança para o próximo elemento na varredura
 * Chamada automaticamente pelo intervalo
 */
function nextScanElement() {
    if (scanPaused || scanElements.length === 0) return;

    try {
        // Remove destaque do elemento atual
        if (scanElements[currentScanIndex]) {
            scanElements[currentScanIndex].classList.remove('scan-active');
            scanElements[currentScanIndex].style.outline = '';
        }

        // Avança para o próximo (com wrap-around circular)
        currentScanIndex = (currentScanIndex + 1) % scanElements.length;
        highlightCurrentElement();
    } catch (error) {
        console.error('Erro em nextScanElement:', error);
        // Tenta reiniciar em caso de erro
        if (scanMode) {
            setTimeout(() => {
                startScanning();
                updateStatus('Varredura reiniciada devido a erro');
            }, 1000);
        }
    }
}

/**
 * Destaca visualmente o elemento atual da varredura
 * Aplica borda, scroll e foco
 */
function highlightCurrentElement() {
    if (scanElements[currentScanIndex]) {
        try {
            const element = scanElements[currentScanIndex];
            
            // Aplica destaque visual
            element.classList.add('scan-active');
            element.style.outline = '4px solid #ff6b6b'; // Borda vermelha
            element.style.outlineOffset = '2px';

            // Rola a página para mostrar o elemento
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
            });

            // Foca no elemento para acessibilidade
            element.focus();

            // Toca som de feedback
            if (soundsEnabled) {
                playDifferentSound(800);
            }

            // Atualiza status com descrição do elemento
            const label = element.getAttribute('aria-label') || element.textContent || element.placeholder || 'Elemento';
            updateStatus(`Varredura: ${label.trim()} - Pressione ENTER para selecionar`);
            
        } catch (error) {
            console.error('Erro em highlightCurrentElement:', error);
        }
    }
}

/**
 * Seleciona (clica) o elemento atualmente destacado na varredura
 * @returns {boolean} true se selecionou com sucesso
 */
function selectCurrentScanElement() {
    if (scanElements[currentScanIndex] && scanMode && !scanPaused) {
        const element = scanElements[currentScanIndex];
        const currentElementIndex = currentScanIndex;
        
        try {
            // Remove destaque temporariamente
            element.classList.remove('scan-active');
            element.style.outline = '';
            
            // Dispara evento de clique
            element.dispatchEvent(new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            }));
            
            playFeedbackSound();
            
            // Restaura o destaque após um delay
            setTimeout(() => {
                if (scanMode && scanElements[currentElementIndex] === element) {
                    element.classList.add('scan-active');
                    element.style.outline = '4px solid #ff6b6b';
                    element.style.outlineOffset = '2px';
                }
            }, 500);
            
            return true;
        } catch (error) {
            console.error('Erro ao selecionar elemento na varredura:', error);
            // Restaura a varredura mesmo com erro
            if (scanMode && scanElements[currentElementIndex] === element) {
                element.classList.add('scan-active');
                element.style.outline = '4px solid #ff6b6b';
                element.style.outlineOffset = '2px';
            }
            return false;
        }
    }
    return false;
}

/**
 * Pausa ou retoma a varredura automática
 */
function pauseScanning() {
    if (!scanMode) return;

    scanPaused = !scanPaused;
    const button = document.getElementById('pause-scan');

    if (scanPaused) {
        button.textContent = '▶️ Continuar';
        updateStatus('Varredura pausada');
        speakFeedback('Varredura pausada');
    } else {
        button.textContent = '⏸️ Pausar';
        updateStatus('Varredura retomada');
        speakFeedback('Varredura retomada');
    }
}

/**
 * Define a velocidade da varredura
 * @param {number} speed - Velocidade em milissegundos
 */
function setScanSpeed(speed) {
    scanSpeed = speed;
    updateStatus(`Velocidade definida: ${speed / 1000} segundos`);
    speakFeedback(`Velocidade de varredura definida para ${speed / 1000} segundos`);

    if (scanMode) {
        // Reinicia a varredura com nova velocidade
        const wasPaused = scanPaused;
        stopScanning();
        startScanning();
        if (wasPaused) {
            scanPaused = true;
            document.getElementById('pause-scan').textContent = '▶️ Continuar';
        }
    }

    saveUserSettings();
}

// ===== FUNÇÕES DE DEBUG E UTILITÁRIAS =====

/**
 * Função de debug para inspecionar elementos da varredura
 * Exibe informações detalhadas no console (Ctrl+Shift+D)
 */
function debugScanElements() {
    let selector = '.scannable';
    if (currentApp !== 'welcome') {
        selector = `#${currentApp} .scannable`;
    }

    const elements = Array.from(document.querySelectorAll(selector)).filter(el => {
        return !el.disabled &&
            el.offsetParent !== null &&
            getComputedStyle(el).visibility !== 'hidden' &&
            getComputedStyle(el).display !== 'none';
    });

    console.log('=== DEBUG SCAN ELEMENTS ===');
    console.log('App atual:', currentApp);
    console.log('Seletor usado:', selector);
    console.log('Modo de varredura:', scanMode ? 'ATIVO' : 'INATIVO');
    console.log('Elementos scannable no app atual:', elements.length);
    console.log('Elementos na lista de varredura:', scanElements.length);
    console.log('Índice atual:', currentScanIndex);

    elements.forEach((el, index) => {
        const isInScanList = scanElements.includes(el);
        const isCurrent = scanElements[currentScanIndex] === el;
        console.log(`${index}: ${el.tagName}.${el.className} - "${el.textContent?.substring(0, 30) || el.placeholder || 'sem texto'}" - ScanList: ${isInScanList} - Current: ${isCurrent}`);
    });

    if (scanElements[currentScanIndex]) {
        console.log('Elemento atual destacado:', scanElements[currentScanIndex]);
    }

    updateStatus(`Debug: ${elements.length} elementos em ${currentApp} (ver console)`);
}

/**
 * Reinicia completamente a varredura para o app atual
 * Útil quando a interface muda dinamicamente
 */
function restartScan() {
    if (scanMode) {
        console.log('🔄 REINICIANDO VARREDURA para:', currentApp);
        
        // Para completamente a varredura atual
        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
        }
        
        // Limpa elementos anteriores
        scanElements.forEach(el => {
            el.classList.remove('scan-active');
            el.style.outline = '';
        });
        
        // Pequeno delay para garantir que a DOM atualizou
        setTimeout(() => {
            startScanning();
            updateStatus(`Varredura em ${getAppName(currentApp)}`);
        }, 200);
    }
}

// ===== FUNÇÕES DE SOM (FEEDBACK AUDITIVO) =====

/**
 * Toca som de feedback padrão (sucesso/confirmação)
 */
function playFeedbackSound() {
    playDifferentSound(800, 0.1); // Frequência 800Hz, duração 0.1s
}

/**
 * Toca som de erro
 */
function playErrorSound() {
    playDifferentSound(300, 0.2); // Frequência 300Hz (grave), duração 0.2s
}

/**
 * Gera um som sintético usando Web Audio API
 * @param {number} frequency - Frequência do som em Hz
 * @param {number} duration - Duração do som em segundos (padrão: 0.1)
 */
function playDifferentSound(frequency, duration = 0.1) {
    if (!soundsEnabled) return;

    try {
        // Cria contexto de áudio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator(); // Gerador de onda
        const gainNode = audioContext.createGain(); // Controle de volume

        // Conecta oscilador -> volume -> saída
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency; // Define frequência
        oscillator.type = 'sine'; // Onda senoidal (som suave)

        // Fade out suave para evitar cliques
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        // Inicia e para o som
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.log('Erro ao reproduzir som');
    }
}

// ===== FUNÇÕES DE STATUS =====

/**
 * Atualiza a mensagem da barra de status
 * Mensagem desaparece após 3 segundos
 * @param {string} message - Mensagem a exibir
 */
function updateStatus(message) {
    const statusBar = document.getElementById('status-bar');
    statusBar.textContent = message;
    statusBar.setAttribute('aria-live', 'polite'); // Acessibilidade

    // Restaura mensagem padrão após 3 segundos
    setTimeout(() => {
        if (!scanMode) {
            statusBar.textContent = 'EASYFACE ativo - Use TAB para navegar';
        } else {
            statusBar.textContent = 'EASYFACE - Modo varredura ativo - ENTER para selecionar';
        }
    }, 3000);
}

// ===== RECONHECIMENTO DE VOZ =====

/**
 * Verifica se o navegador suporta reconhecimento de voz
 * @returns {boolean} true se suportado
 */
function checkVoiceRecognitionSupport() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        // Exibe aviso se não suportar
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

/**
 * Configura o reconhecimento de voz para comandos
 * Adiciona botão ao menu lateral
 */
function setupVoiceRecognition() {
    if (!checkVoiceRecognitionSupport()) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false; // Para após um comando
    recognition.interimResults = false; // Apenas resultados finais

    /**
     * Inicia captura de comando de voz
     */
    function startVoiceCommand() {
        try {
            recognition.start();
            updateStatus('Escutando comando de voz... Diga: "editor", "calculadora", etc.');
        } catch (error) {
            updateStatus('Erro ao iniciar reconhecimento de voz');
            playErrorSound();
        }
    }

    /**
     * Processa comando reconhecido
     */
    recognition.onresult = function (event) {
        const command = event.results[0][0].transcript.toLowerCase().trim();
        updateStatus(`Comando reconhecido: ${command}`);

        // Mapeamento de comandos de voz para funções
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

    /**
     * Trata erros no reconhecimento de voz
     */
    recognition.onerror = function (event) {
        updateStatus('Erro no reconhecimento de voz: ' + event.error);
        playErrorSound();
    };

    // Adiciona botão de comando de voz ao menu
    const voiceButton = document.createElement('button');
    voiceButton.className = 'menu-button scannable';
    voiceButton.innerHTML = '🎤 Comando de Voz';
    voiceButton.onclick = startVoiceCommand;
    voiceButton.tabIndex = 90;
    voiceButton.setAttribute('aria-label', 'Ativar comando de voz - Diga o nome da funcionalidade desejada');
    document.querySelector('.sidebar').appendChild(voiceButton);
}

// ===== INICIALIZAÇÃO DA CALCULADORA =====

/**
 * Configura event listeners para os botões da calculadora
 * Atualiza calcFocus quando um botão ganha foco
 */
function initCalculator() {
    const calculatorApp = document.getElementById('calculator-app');
    if (!calculatorApp) return;

    // Adiciona listener de foco a cada botão
    document.querySelectorAll('.calc-button').forEach(button => {
        button.addEventListener('focus', function () {
            // Encontra posição do botão na grade
            for (let row = 0; row < calcGrid.length; row++) {
                for (let col = 0; col < calcGrid[row].length; col++) {
                    if (calcGrid[row][col] === parseInt(this.getAttribute('tabindex'))) {
                        calcFocus = { row, col };
                        // Atualiza destaque visual
                        document.querySelectorAll('.calc-button').forEach(btn => btn.classList.remove('navigation-focus'));
                        this.classList.add('navigation-focus');
                        return;
                    }
                }
            }
        });
    });
}

// ===== EVENT LISTENERS GLOBAIS DE TECLADO =====

/**
 * Handler principal de eventos de teclado
 * Gerencia navegação, atalhos e controles especiais
 */
document.addEventListener('keydown', function (e) {
    // Atalho de debug: Ctrl+Shift+D
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        debugScanElements();
        return;
    }

    const focused = document.activeElement;
    const isCalcButtonFocused = focused && focused.classList.contains('calc-button');

    // ===== NAVEGAÇÃO NA CALCULADORA COM SETAS =====
    if (currentApp === 'calculator-app' && isCalcButtonFocused) {
        const key = e.key;

        if (key === 'Tab') {
            // Permite navegação normal com Tab
            return;
        }

        // Navegação com setas
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            e.preventDefault();
            if (key === 'ArrowRight') moveCalcFocus(0, 1);
            else if (key === 'ArrowLeft') moveCalcFocus(0, -1);
            else if (key === 'ArrowDown') moveCalcFocus(1, 0);
            else if (key === 'ArrowUp') moveCalcFocus(-1, 0);
            return;
        }

        // Digitação direta de números e operadores
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
        } else if (key === 'Backspace') {
            e.preventDefault();
            deleteLast();
            return;
        }
    }

    // ===== NAVEGAÇÃO NA COMUNICAÇÃO ALTERNATIVA =====
    else if (currentApp === 'communication-aid-app') {
        const key = e.key;

        // Navegação com setas
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            e.preventDefault();

            if (key === 'ArrowDown' || key === 'ArrowRight') {
                moveCommFocus(1); // Próximo elemento
            } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
                moveCommFocus(-1); // Elemento anterior
            }
            return;
        }

        // Tab para navegação sequencial
        if (key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                moveCommFocus(-1); // Tab + Shift: anterior
            } else {
                moveCommFocus(1); // Tab: próximo
            }
            return;
        }

        // ESC volta para nível anterior
        if (key === 'Escape') {
            e.preventDefault();

            if (commFocus.section === 'phrases') {
                // Volta para categorias
                backToCategories();
            } else if (commFocus.section === 'categories') {
                // Volta para controles
                moveToControls();
            } else if (commFocus.section === 'controls') {
                // Volta para menu principal
                showApp('welcome');
                const firstButton = document.querySelector('.menu-button');
                if (firstButton) firstButton.focus();
            }
            return;
        }

        // Enter ou Espaço para selecionar
        if (key === 'Enter' || key === ' ') {
            e.preventDefault();
            const focused = document.activeElement;
            if (focused && (focused.classList.contains('action-button') ||
                focused.classList.contains('category-button') ||
                focused.classList.contains('phrase-button'))) {
                focused.click();
            }
            return;
        }
    }

    // ===== NAVEGAÇÃO NAS CONFIGURAÇÕES =====
    else if (currentApp === 'accessibility-settings-app') {
        const key = e.key;

        // Navegação com setas
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            e.preventDefault();

            if (key === 'ArrowDown' || key === 'ArrowRight') {
                moveSettingsFocus(1); // Próximo
            } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
                moveSettingsFocus(-1); // Anterior
            }
            return;
        }

        // Tab atualiza lista de botões
        if (key === 'Tab') {
            setTimeout(() => {
                settingsButtons = Array.from(document.querySelectorAll('#accessibility-settings-app .action-button, #accessibility-settings-app .scannable'));
                const currentFocused = document.activeElement;
                const newIndex = settingsButtons.indexOf(currentFocused);
                if (newIndex !== -1) {
                    settingsFocusIndex = newIndex;
                    highlightSettingsElement(currentFocused);
                }
            }, 10);
            return;
        }

        // ESC volta ao menu
        if (key === 'Escape') {
            e.preventDefault();
            showApp('welcome');
            const firstButton = document.querySelector('.menu-button');
            if (firstButton) firstButton.focus();
            return;
        }

        // Enter/Espaço ativa botão
        if ((key === 'Enter' || key === ' ') &&
            document.activeElement.classList.contains('action-button')) {
            e.preventDefault();
            document.activeElement.click();
            return;
        }
    }

    // ===== ATALHOS GLOBAIS COM CTRL =====
    if (e.ctrlKey) {
        // Verifica atalhos personalizados primeiro
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

        // Atalhos padrão (fallback)
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
                showAccessibilitySettings();
                break;
            case 's':
                e.preventDefault();
                toggleScanMode();
                break;
        }
    }

    // ===== CONTROLES DA VARREDURA =====
    
    // ENTER seleciona elemento na varredura
    if (scanMode && e.key === 'Enter') {
        e.preventDefault();
        if (selectCurrentScanElement()) {
            return;
        }
    }

    // ESC volta ao menu ou desativa varredura
    if (e.key === 'Escape') {
        e.preventDefault();
        if (scanMode) {
            toggleScanMode();
        } else {
            showApp('welcome');
            const firstButton = document.querySelector('.menu-button');
            if (firstButton) firstButton.focus();
        }
        return;
    }

    // ESPAÇO pausa/retoma varredura
    if (scanMode && e.key === ' ') {
        e.preventDefault();
        pauseScanning();
        return;
    }
});

// ===== INICIALIZAÇÃO DO DOM =====

/**
 * Executado quando o DOM está pronto (antes de imagens/recursos)
 */
document.addEventListener('DOMContentLoaded', function () {
    // Inicializa a calculadora
    initCalculator();
});

/**
 * Executado quando todos os recursos estão carregados
 */
window.addEventListener('load', function () {
    // Configura reconhecimento de voz
    setupVoiceRecognition();

    // Carrega configurações salvas do usuário
    loadUserSettings();

    updateStatus('EASYFACE carregado e pronto para uso!');

    // Carrega atalhos personalizados
    loadShortcuts();

    // Configura eventos para inputs de arquivo
    setupFileInputs();

    // Foca no primeiro botão do menu após 1 segundo
    setTimeout(() => {
        if (!scanMode) {
            const firstButton = document.querySelector('.menu-button');
            if (firstButton) firstButton.focus();
        }
    }, 1000);
});

/**
 * Configura aria-labels para inputs de arquivo (acessibilidade)
 */
function setupFileInputs() {
    document.getElementById('file-input').setAttribute('aria-label', 'Selecionar arquivo de texto');
    document.getElementById('media-input').setAttribute('aria-label', 'Selecionar arquivo de mídia');
    document.getElementById('pdf-input').setAttribute('aria-label', 'Selecionar arquivo PDF');
}