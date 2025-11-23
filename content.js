// X Sarcasm Detector - Content Script
// Supports: Static mode, JavaScript model, or External API

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        enabled: true,
        mode: 'api', // 'static', 'js-model', or 'api' - Default to API mode
        apiUrl: 'http://localhost:5000/detect-sarcasm', // Flask API URL
        jsModelPath: 'model.js' // Path to your JS model file
    };

    // Load saved settings
    chrome.storage.sync.get(['enabled', 'mode', 'apiUrl', 'jsModelPath'], (result) => {
        if (result.enabled !== undefined) CONFIG.enabled = result.enabled;
        if (result.mode) CONFIG.mode = result.mode;
        if (result.apiUrl) CONFIG.apiUrl = result.apiUrl;
        else if (!CONFIG.apiUrl) CONFIG.apiUrl = 'http://localhost:5000/detect-sarcasm'; // Default Flask URL
        if (result.jsModelPath) CONFIG.jsModelPath = result.jsModelPath;
        
        console.log('[Sarcasm Detector] Configuration loaded:', CONFIG);
    });

    // Static sarcasm detection (for testing)
    function detectSarcasmStatic(tweetText) {
        const sarcasmKeywords = [
            'sure', 'obviously', 'totally', 'definitely', 'yeah right',
            'as if', 'whatever', 'great', 'wonderful', 'perfect',
            'love it', 'amazing', 'brilliant', 'genius'
        ];
        
        const lowerText = tweetText.toLowerCase();
        const hasKeywords = sarcasmKeywords.some(keyword => lowerText.includes(keyword));
        
        return {
            isSarcasm: Math.random() > 0.5 || hasKeywords,
            confidence: Math.random() * 0.3 + 0.7,
            method: 'static'
        };
    }

    // JavaScript Model detection (load your model from a JS file)
    let jsModel = null;
    
    async function loadJSModel() {
        if (jsModel !== null) return jsModel;
        
        try {
            // Load the model script dynamically
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL(CONFIG.jsModelPath);
            document.head.appendChild(script);
            
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    // Check if model function is available
                    if (typeof window.detectSarcasmModel === 'function') {
                        jsModel = window.detectSarcasmModel;
                        resolve(jsModel);
                    } else {
                        reject(new Error('Model function not found. Expected window.detectSarcasmModel'));
                    }
                };
                script.onerror = () => reject(new Error('Failed to load model script'));
            });
        } catch (error) {
            console.error('Error loading JS model:', error);
            throw error;
        }
    }

    async function detectSarcasmJSModel(tweetText) {
        try {
            const model = await loadJSModel();
            const result = await Promise.resolve(model(tweetText)); // Handle both sync and async
            
            // Ensure result has correct format
            return {
                isSarcasm: Boolean(result.isSarcasm || result.sarcasm || result.prediction),
                confidence: parseFloat(result.confidence || result.score || 0.5),
                method: 'js-model'
            };
        } catch (error) {
            console.error('JS Model error:', error);
            // Fallback to static
            return detectSarcasmStatic(tweetText);
        }
    }

    // External API detection - Sends request to Flask API and receives response
    // Returns null if API is not available (no fallback)
    async function detectSarcasmAPI(tweetText) {
        if (!CONFIG.apiUrl) {
            console.error('[Sarcasm Detector] API URL not configured');
            return null; // Return null instead of fallback
        }

        try {
            console.log('[Sarcasm Detector] Sending request to Flask API:', CONFIG.apiUrl);
            console.log('[Sarcasm Detector] Request payload:', { text: tweetText.substring(0, 50) + '...' });

            // Create timeout controller for request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: tweetText
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('[Sarcasm Detector] Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Sarcasm Detector] API returned error:', response.status, errorText);
                return null; // Return null instead of fallback
            }

            const data = await response.json();
            console.log('[Sarcasm Detector] Received response from Flask:', data);

            // Handle Flask API response format
            const result = {
                isSarcasm: Boolean(data.is_sarcasm || data.sarcasm || data.isSarcasm || data.prediction),
                confidence: parseFloat(data.confidence || data.score || 0.5),
                method: 'api'
            };

            console.log('[Sarcasm Detector] Processed result:', result);
            return result;

        } catch (error) {
            // Check if it's a network error (server not running)
            if (error.name === 'TypeError' || error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
                console.error('[Sarcasm Detector] Flask API server is not running or unreachable');
                console.error('[Sarcasm Detector] Error details:', error.message);
            } else {
                console.error('[Sarcasm Detector] API error:', error);
            }
            // Return null - no badge will be shown
            return null;
        }
    }

    // Main detection function
    async function detectSarcasm(tweetText) {
        if (!CONFIG.enabled || !tweetText || tweetText.trim().length === 0) {
            return null;
        }

        switch (CONFIG.mode) {
            case 'js-model':
                return await detectSarcasmJSModel(tweetText);
            case 'api':
                if (!CONFIG.apiUrl) {
                    console.error('[Sarcasm Detector] API URL not configured');
                    return null; // Return null instead of fallback
                }
                return await detectSarcasmAPI(tweetText);
            case 'static':
            default:
                return detectSarcasmStatic(tweetText);
        }
    }

    // Create sarcasm indicator badge
    function createSarcasmBadge(result) {
        const badge = document.createElement('div');
        badge.className = 'sarcasm-badge';
        
        if (result.isSarcasm) {
            badge.classList.add('sarcasm-detected');
            badge.innerHTML = `
                <span class="sarcasm-icon">😏</span>
                <span class="sarcasm-text">Sarcasm Detected</span>
                <span class="sarcasm-confidence">${Math.round(result.confidence * 100)}%</span>
            `;
        } else {
            badge.classList.add('sarcasm-not-detected');
            badge.innerHTML = `
                <span class="sarcasm-icon">😊</span>
                <span class="sarcasm-text">Not Sarcasm</span>
                <span class="sarcasm-confidence">${Math.round(result.confidence * 100)}%</span>
            `;
        }

        return badge;
    }

    // Process a single tweet
    async function processTweet(tweetElement) {
        // Skip if already processed
        if (tweetElement.dataset.sarcasmProcessed === 'true') {
            return;
        }

        // Find tweet text
        const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');
        if (!tweetTextElement) {
            return;
        }

        const tweetText = tweetTextElement.innerText || tweetTextElement.textContent;
        if (!tweetText || tweetText.trim().length === 0) {
            return;
        }

        // Mark as processed
        tweetElement.dataset.sarcasmProcessed = 'true';

        // Detect sarcasm
        const result = await detectSarcasm(tweetText);
        if (!result) {
            // No result means API is not available - don't show anything
            console.log('[Sarcasm Detector] No result - API server may not be running');
            return;
        }

        // Remove existing badge if any
        const existingBadge = tweetElement.querySelector('.sarcasm-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Create and insert badge
        const badge = createSarcasmBadge(result);
        
        // Find a good place to insert the badge (usually after the tweet text)
        const tweetTextContainer = tweetTextElement.closest('div[dir="auto"]') || tweetTextElement.parentElement;
        if (tweetTextContainer) {
            tweetTextContainer.appendChild(badge);
        } else {
            tweetElement.insertBefore(badge, tweetElement.firstChild);
        }
    }

    // Find and process all tweets on the page
    function processAllTweets() {
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        tweets.forEach(tweet => {
            processTweet(tweet);
        });
    }

    // Observer for dynamically loaded tweets
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;
            
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (node.matches && node.matches('article[data-testid="tweet"]')) {
                                shouldProcess = true;
                            }
                            if (node.querySelectorAll && node.querySelectorAll('article[data-testid="tweet"]').length > 0) {
                                shouldProcess = true;
                            }
                        }
                    });
                }
            });

            if (shouldProcess) {
                clearTimeout(window.sarcasmProcessTimeout);
                window.sarcasmProcessTimeout = setTimeout(() => {
                    processAllTweets();
                }, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize when page loads
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                processAllTweets();
                setupObserver();
            });
        } else {
            processAllTweets();
            setupObserver();
        }
    }

    // Run initialization
    init();

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggle') {
            CONFIG.enabled = request.enabled;
            if (CONFIG.enabled) {
                processAllTweets();
            } else {
                document.querySelectorAll('.sarcasm-badge').forEach(badge => badge.remove());
            }
        }
        if (request.action === 'setMode') {
            CONFIG.mode = request.mode;
            jsModel = null; // Reset model cache when switching modes
            processAllTweets();
        }
        if (request.action === 'setApiUrl') {
            CONFIG.apiUrl = request.apiUrl;
        }
        if (request.action === 'setJsModelPath') {
            CONFIG.jsModelPath = request.jsModelPath;
            jsModel = null; // Reset model cache
        }
        if (request.action === 'updateConfig') {
            Object.assign(CONFIG, request.config);
            jsModel = null;
            processAllTweets();
        }
    });

})();
