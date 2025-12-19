// Popup script for X Sarcasm Detector

document.addEventListener('DOMContentLoaded', () => {
    const enableToggle = document.getElementById('enableToggle');
    const statusText = document.getElementById('statusText');

    // Load saved settings
    chrome.storage.sync.get(['enabled'], (result) => {
        const enabled = result.enabled !== undefined ? result.enabled : true;
        enableToggle.classList.toggle('active', enabled);
        updateStatusText(enabled);
    });

    function updateStatusText(enabled) {
        statusText.textContent = enabled ? 'Activée' : 'Désactivée';
        statusText.classList.toggle('active', enabled);
    }

    // Toggle enable/disable
    enableToggle.addEventListener('click', () => {
        const isActive = enableToggle.classList.contains('active');
        const newState = !isActive;
        
        enableToggle.classList.toggle('active', newState);
        updateStatusText(newState);
        chrome.storage.sync.set({ enabled: newState });
        
        // Send message to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggle',
                    enabled: newState
                }).catch(err => {
                    console.log('Tab message failed (may need page refresh):', err);
                });
            }
        });
    });
});
