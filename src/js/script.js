const synth = window.speechSynthesis;

// DOM Elements
const textInput = document.querySelector('#text-input');
const speakBtn = document.querySelector('#speak-btn');
const recordBtn = document.querySelector('#record-btn');
const stopBtn = document.querySelector('#stop-btn');
const logContainer = document.querySelector('#log-container');
const clearLogsBtn = document.querySelector('#clear-logs-btn');

// Mode Switcher
const localModeBtn = document.querySelector('#local-mode-btn');
const cloudModeBtn = document.querySelector('#cloud-mode-btn');
const localControls = document.querySelector('#local-controls');
const cloudControls = document.querySelector('#cloud-controls');

// Local Controls
const voiceSelect = document.querySelector('#voice-select');
const rateInput = document.querySelector('#rate');
const pitchInput = document.querySelector('#pitch');
const rateValue = document.querySelector('#rate-value');
const pitchValue = document.querySelector('#pitch-value');

// Cloud Controls
const apiProviderSelect = document.querySelector('#api-provider');
const apiBaseUrlInput = document.querySelector('#api-base-url');
const apiKeyInput = document.querySelector('#api-key');
const cloudModelInput = document.querySelector('#cloud-model');
const cloudVoiceSelect = document.querySelector('#cloud-voice');

// --- Configuration & State ---
let currentMode = 'cloud'; // Default to cloud
let voices = [];
let audioContext = null;
let currentSource = null;

const CLOUD_CONFIGS = {
    zhipu: {
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        model: 'glm-tts',
        voices: [
            { id: 'tongtong', name: '彤彤 (女声 - 智谱)' },
            { id: 'xiaochen', name: '晓辰 (男声 - 智谱)' },
            { id: 'female', name: '女声 (智谱)' },
            { id: 'male', name: '男声 (智谱)' },
            { id: 'glm-4-voice', name: 'GLM-4-Voice (端到端语音)' },
            { id: 'glm-asr-2512', name: 'GLM-ASR (语音识别)' }
        ]
    },
    minimax: {
        baseUrl: 'https://api.minimaxi.com/v1',
        model: 'speech-01',
        voices: [
            { id: 'male-qn-qingse', name: '青涩青年 (MiniMax)' },
            { id: 'female-shaonv', name: '甜美少女 (MiniMax)' },
            { id: 'female-yujie', name: '成熟御姐 (MiniMax)' },
            { id: 'presenter', name: '播音员 (MiniMax)' },
            { id: 'audiobook_male_1', name: '有声书男声 (MiniMax)' },
            { id: 'audiobook_female_1', name: '有声书女声 (MiniMax)' }
        ]
    },
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        model: 'tts-1',
        voices: [
            { id: 'alloy', name: 'Alloy' },
            { id: 'echo', name: 'Echo' },
            { id: 'fable', name: 'Fable' },
            { id: 'onyx', name: 'Onyx' },
            { id: 'nova', name: 'Nova' },
            { id: 'shimmer', name: 'Shimmer' }
        ]
    },
    custom: {
        baseUrl: '',
        model: '',
        voices: []
    }
};

// --- Persistence ---
function saveConfig() {
    const config = {
        provider: apiProviderSelect.value,
        baseUrl: apiBaseUrlInput.value,
        apiKey: apiKeyInput.value,
        model: cloudModelInput.value,
        voice: cloudVoiceSelect.value
    };
    localStorage.setItem('tts_config', JSON.stringify(config));
}

function loadConfig() {
    const saved = localStorage.getItem('tts_config');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            apiProviderSelect.value = config.provider || 'minimax';
            updateCloudUI(); // Fill default values first
            
            // Override with saved values, but for minimax/openai, we prefer the new default baseUrl if it's the old one
            if (config.baseUrl) {
                const isOldMinimax = config.provider === 'minimax' && config.baseUrl.includes('minimax.chat');
                if (!isOldMinimax) {
                    apiBaseUrlInput.value = config.baseUrl;
                }
            }
            if (config.apiKey) apiKeyInput.value = config.apiKey;
            if (config.model) cloudModelInput.value = config.model;
            if (config.voice) cloudVoiceSelect.value = config.voice;
            updateRecordButtonVisibility();
        } catch (e) {
            console.error('Failed to load config', e);
        }
    } else {
        apiProviderSelect.value = 'minimax';
        updateCloudUI();
    }
}

// --- Mode Switching ---
localModeBtn.addEventListener('click', () => {
    currentMode = 'local';
    localModeBtn.classList.add('active');
    cloudModeBtn.classList.remove('active');
    localControls.classList.remove('hidden');
    cloudControls.classList.add('hidden');
    updateRecordButtonVisibility();
});

cloudModeBtn.addEventListener('click', () => {
    currentMode = 'cloud';
    cloudModeBtn.classList.add('active');
    localModeBtn.classList.remove('active');
    cloudControls.classList.remove('hidden');
    localControls.classList.add('hidden');
    updateRecordButtonVisibility();
});

// --- Cloud Provider Switching ---
apiProviderSelect.addEventListener('change', () => {
    updateCloudUI();
    saveConfig();
});

function updateCloudUI() {
    const provider = apiProviderSelect.value;
    const config = CLOUD_CONFIGS[provider];
    
    if (provider !== 'custom') {
        apiBaseUrlInput.value = config.baseUrl;
        cloudModelInput.value = config.model;
        
        cloudVoiceSelect.innerHTML = '';
        config.voices.forEach(v => {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = v.name;
            cloudVoiceSelect.appendChild(option);
        });
    }
    
    updateRecordButtonVisibility();
}

function updateRecordButtonVisibility() {
    const provider = apiProviderSelect.value;
    const model = cloudModelInput.value;
    const voice = cloudVoiceSelect.value;
    
    if (currentMode === 'cloud' && provider === 'zhipu' && (model === 'glm-asr-2512' || voice === 'glm-asr-2512')) {
        recordBtn.classList.remove('hidden');
        speakBtn.classList.add('hidden');
    } else {
        recordBtn.classList.add('hidden');
        speakBtn.classList.remove('hidden');
    }
}

// Save config on input change
[apiBaseUrlInput, apiKeyInput, cloudModelInput, cloudVoiceSelect].forEach(el => {
    el.addEventListener('change', () => {
        if (el === cloudVoiceSelect && apiProviderSelect.value === 'zhipu') {
            // Auto-update model if it's a special Zhipu model
            if (cloudVoiceSelect.value === 'glm-4-voice' || cloudVoiceSelect.value === 'glm-asr-2512') {
                cloudModelInput.value = cloudVoiceSelect.value;
            } else if (cloudModelInput.value === 'glm-4-voice' || cloudModelInput.value === 'glm-asr-2512') {
                // If switching back from special model to normal voice, reset to glm-tts
                cloudModelInput.value = 'glm-tts';
            }
        }
        saveConfig();
        updateRecordButtonVisibility();
    });
});

// --- ASR (Speech to Text) ---
let mediaRecorder = null;
let audioChunks = [];

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await transcribeAudio(audioBlob);
        };

        mediaRecorder.start();
        setRecordUI(true);
    } catch (err) {
        console.error('录音失败:', err);
        alert('无法访问麦克风');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        setRecordUI(false);
    }
}

function setRecordUI(isRecording) {
    if (isRecording) {
        recordBtn.textContent = '停止录音 (正在识别...)';
        recordBtn.classList.add('recording');
    } else {
        recordBtn.textContent = '语音转文字';
        recordBtn.classList.remove('recording');
    }
}

async function transcribeAudio(blob) {
    const baseUrl = apiBaseUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) return alert('请输入 API Key');

    setLoadingUI('正在识别语音...');

    try {
        const formData = new FormData();
        formData.append('file', blob, 'recording.wav');
        formData.append('model', 'glm-asr-2512');

        addLog(`请求 ASR (${baseUrl}/audio/transcriptions)`, { model: 'glm-asr-2512', file: 'recording.wav' }, 'info', 'request');

        const response = await fetch(`${baseUrl}/audio/transcriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) throw await handleApiError(response);

        const result = await response.json();
        addLog('响应成功 (ASR)', result, 'success', 'response');

        if (result.text) {
            textInput.value = result.text;
        } else {
            alert('未能识别到文字');
        }
    } catch (error) {
        console.error(error);
        alert(`识别错误: ${error.message}`);
    } finally {
        resetUI();
    }
}

recordBtn.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopRecording();
    } else {
        startRecording();
    }
});

// --- Local Mode (Web Speech API) ---
function populateVoiceList() {
    voices = synth.getVoices();
    const filteredVoices = voices.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        if (aName.includes('chinese') || aName.includes('zh-')) return -1;
        if (bName.includes('chinese') || bName.includes('zh-')) return 1;
        return 0;
    });

    voiceSelect.innerHTML = '';
    filteredVoices.forEach((voice) => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });
}

if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

function speakLocal() {
    if (synth.speaking) return;
    if (textInput.value === '') return;

    const utterThis = new SpeechSynthesisUtterance(textInput.value);
    const selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
    utterThis.voice = voices.find(v => v.name === selectedOption);
    utterThis.rate = rateInput.value;
    utterThis.pitch = pitchInput.value;

    utterThis.onend = () => resetUI();
    utterThis.onerror = () => resetUI();

    setLoadingUI('正在播放...');
    synth.speak(utterThis);
}

// --- Cloud Mode (Universal API Adapter) ---
async function speakCloud() {
    // Aggressively clean input to avoid "non ISO-8859-1 code point" error in headers
    const baseUrl = apiBaseUrlInput.value.trim().replace(/[^\x00-\x7F]/g, "");
    const apiKey = apiKeyInput.value.trim().replace(/[^\x00-\x7F]/g, "");
    const model = cloudModelInput.value.trim();
    const voice = cloudVoiceSelect.value;
    const text = textInput.value.trim();
    const provider = apiProviderSelect.value;

    if (!text) return alert('请输入文字');
    if (!apiKey) return alert('请输入 API Key');
    if (!baseUrl) return alert('请输入 Base URL');

    setLoadingUI('生成语音中...');

    try {
        let audioData;
        
        // Handle GLM-4-Voice specially as it uses chat completions endpoint
        if (provider === 'zhipu' && model === 'glm-4-voice') {
            const requestBody = {
                model: model,
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: text }
                    ]
                }]
            };
            
            addLog(`请求 GLM-4-Voice (${baseUrl}/chat/completions)`, requestBody, 'info', 'request');

            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw await handleApiError(response);
            
            const result = await response.json();
            addLog('响应成功 (GLM-4-Voice)', result, 'success', 'response');

            const base64Audio = result.choices[0].message.audio?.data;
            if (!base64Audio) throw new Error('未返回音频数据');
            
            // Convert base64 to ArrayBuffer
            const binaryString = atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            audioData = bytes.buffer;
        } else {
            // Standard OpenAI-compatible TTS
            const requestBody = {
                model: model,
                input: text,
                voice: voice
            };
            
            addLog(`请求 TTS (${baseUrl}/audio/speech)`, requestBody, 'info', 'request');

            const response = await fetch(`${baseUrl}/audio/speech`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw await handleApiError(response);
            
            addLog('响应成功 (TTS Binary Audio)', 'Audio binary received', 'success', 'response');
            
            const blob = await response.blob();
            audioData = await blob.arrayBuffer();
        }
        
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(audioData);
        
        if (currentSource) {
            try { currentSource.stop(); } catch(e) {}
        }
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        currentSource.connect(audioContext.destination);
        
        currentSource.onended = () => resetUI();
        currentSource.start(0);
        setLoadingUI('正在播放...');

    } catch (error) {
        console.error(error);
        alert(`错误: ${error.message}`);
        resetUI();
    }
}

async function handleApiError(response) {
    let errorMessage = `请求失败 (${response.status})`;
    let errorDetail = null;
    try {
        const clonedResponse = response.clone();
        errorDetail = await clonedResponse.json();
        errorMessage = errorDetail.error?.message || errorDetail.message || errorMessage;
    } catch (e) {
        const textError = await response.text();
        errorDetail = textError;
        errorMessage = textError.length > 100 ? textError.substring(0, 100) + '...' : (textError || errorMessage);
    }
    
    addLog(`API 错误 (${response.status})`, errorDetail || errorMessage, 'error');
    return new Error(errorMessage);
}

// --- Common UI Helpers ---
function addLog(title, content, type = 'info', extraClass = '') {
    // Remove placeholder if it exists
    const placeholder = logContainer.querySelector('.log-placeholder');
    if (placeholder) placeholder.remove();

    const logItem = document.createElement('div');
    logItem.className = `log-item ${type} ${extraClass}`;
    
    const time = new Date().toLocaleTimeString();
    
    // Obfuscate API key in logs for safety
    let displayContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
    displayContent = displayContent.replace(/Bearer [a-zA-Z0-9._-]+/g, 'Bearer ******');

    logItem.innerHTML = `
        <div class="log-time">[${time}]</div>
        <div class="log-title">${title}</div>
        <div class="log-content">${displayContent}</div>
    `;
    
    logContainer.prepend(logItem); // Show newest logs at top
}

clearLogsBtn.addEventListener('click', () => {
    logContainer.innerHTML = '<div class="log-placeholder">日志已清空</div>';
});

function setLoadingUI(text) {
    speakBtn.disabled = true;
    speakBtn.textContent = text;
}

function resetUI() {
    speakBtn.disabled = false;
    speakBtn.textContent = '立即播放';
}

// --- Event Listeners ---
speakBtn.addEventListener('click', () => {
    if (currentMode === 'local') {
        speakLocal();
    } else {
        speakCloud();
    }
});

stopBtn.addEventListener('click', () => {
    if (currentMode === 'local') {
        synth.cancel();
    } else {
        if (currentSource) {
            try { currentSource.stop(); } catch(e) {}
            currentSource = null;
        }
    }
    resetUI();
});

rateInput.addEventListener('input', () => rateValue.textContent = rateInput.value);
pitchInput.addEventListener('input', () => pitchValue.textContent = pitchInput.value);

// Initial Load
populateVoiceList();
loadConfig(); // This will also call updateCloudUI()

// Sync UI for default mode
if (currentMode === 'cloud') {
    cloudModeBtn.classList.add('active');
    localModeBtn.classList.remove('active');
    cloudControls.classList.remove('hidden');
    localControls.classList.add('hidden');
} else {
    localModeBtn.classList.add('active');
    cloudModeBtn.classList.remove('active');
    localControls.classList.remove('hidden');
    cloudControls.classList.add('hidden');
}

