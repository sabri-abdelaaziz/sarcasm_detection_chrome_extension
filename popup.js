// Popup script for X Sarcasm Detector

document.addEventListener('DOMContentLoaded', () => {
    const enableToggle = document.getElementById('enableToggle');
    const staticModeBtn = document.getElementById('staticMode');
    const jsModelModeBtn = document.getElementById('jsModelMode');
    const apiModeBtn = document.getElementById('apiMode');
    const jsModelPathInput = document.getElementById('jsModelPath');
    const apiUrlInput = document.getElementById('apiUrl');
    const jsModelConfig = document.getElementById('jsModelConfig');
    const apiConfig = document.getElementById('apiConfig');
    const statusMessage = document.getElementById('statusMessage');

    // Load saved settings
    chrome.storage.sync.get(['enabled', 'mode', 'apiUrl', 'jsModelPath'], (result) => {
        const enabled = result.enabled !== undefined ? result.enabled : true;
        const mode = result.mode || 'api'; // Default to API mode for Flask
        const apiUrl = result.apiUrl || 'http://localhost:5000/detect-sarcasm'; // Default to Flask API
        const jsModelPath = result.jsModelPath || 'model.js';

        enableToggle.classList.toggle('active', enabled);
        updateModeButtons(mode);
        apiUrlInput.value = apiUrl;
        jsModelPathInput.value = jsModelPath;
        showConfigForMode(mode);
        
        // Save default API URL if not set
        if (mode === 'api' && !result.apiUrl) {
            chrome.storage.sync.set({ apiUrl: apiUrl });
        }
    });

    function updateModeButtons(activeMode) {
        [staticModeBtn, jsModelModeBtn, apiModeBtn].forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === activeMode);
        });
    }

    function showConfigForMode(mode) {
        jsModelConfig.style.display = mode === 'js-model' ? 'block' : 'none';
        apiConfig.style.display = mode === 'api' ? 'block' : 'none';
    }

    // Toggle enable/disable
    enableToggle.addEventListener('click', () => {
        const isActive = enableToggle.classList.contains('active');
        const newState = !isActive;
        
        enableToggle.classList.toggle('active', newState);
        chrome.storage.sync.set({ enabled: newState });
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggle',
                enabled: newState
            });
        });

        showStatus(newState ? 'Extension enabled' : 'Extension disabled', 'success');
    });

    // Mode selection
    function handleModeChange(mode) {
        updateModeButtons(mode);
        showConfigForMode(mode);
        chrome.storage.sync.set({ mode: mode });
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'setMode',
                mode: mode
            });
        });

        const modeNames = {
            'static': 'Static Mode',
            'js-model': 'JavaScript Model Mode',
            'api': 'External API Mode'
        };
        showStatus(`Switched to ${modeNames[mode]}`, 'info');
    }

    staticModeBtn.addEventListener('click', () => handleModeChange('static'));
    jsModelModeBtn.addEventListener('click', () => handleModeChange('js-model'));
    apiModeBtn.addEventListener('click', () => handleModeChange('api'));

    // JS Model Path input
    jsModelPathInput.addEventListener('blur', () => {
        const path = jsModelPathInput.value.trim();
        if (path) {
            chrome.storage.sync.set({ jsModelPath: path });
            
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'setJsModelPath',
                    jsModelPath: path
                });
            });

            showStatus('Model path updated', 'success');
        }
    });

    // API URL input
    apiUrlInput.addEventListener('blur', () => {
        const url = apiUrlInput.value.trim();
        if (url) {
            chrome.storage.sync.set({ apiUrl: url });
            
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'setApiUrl',
                    apiUrl: url
                });
            });

            showStatus('API URL updated', 'success');
        }
    });

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status ${type}`;
        statusMessage.style.display = 'block';
        
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
    }
});
