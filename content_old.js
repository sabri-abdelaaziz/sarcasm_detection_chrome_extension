// X Sarcasm Detector - Content Script
// Uses ONNX model for sarcasm detection

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        enabled: true
    };

    // Load saved settings
    chrome.storage.sync.get(['enabled'], (result) => {
        if (result.enabled !== undefined) CONFIG.enabled = result.enabled;
        console.log('[Sarcasm Detector] Configuration loaded:', CONFIG);
    });

    // JavaScript Model detection (ONNX model)
    let jsModel = null;
    let modelLoadAttempted = false;
    let scriptElement = null;
    let ortScriptElement = null;
    let isLoading = false;
    
    async function loadJSModel() {
        // Return cached model if available
        if (jsModel !== null) {
            console.log('[Sarcasm Detector] Using cached model');
            return jsModel;
        }
        
        // If currently loading, wait for it
        if (isLoading) {
            console.log('[Sarcasm Detector] Model loading in progress, waiting...');
            await new Promise(resolve => setTimeout(resolve, 500));
            return jsModel;
        }
        
        // Check if extension context is still valid
        if (!chrome.runtime?.id) {
            throw new Error('Extension context invalidated. Please refresh the page.');
        }
        
        // Check if model is already loaded in window
        if (typeof window.detectSarcasmModel === 'function') {
            jsModel = window.detectSarcasmModel;
            console.log('[Sarcasm Detector] Model already available in window');
            return jsModel;
        }
        
        // Don't retry loading if already attempted and failed
        if (modelLoadAttempted && !jsModel) {
            console.warn('[Sarcasm Detector] Model loading already failed, skipping retry');
            return null;
        }
        
        modelLoadAttempted = true;
        isLoading = true;
        
        try {
            // Step 1: Load ONNX Runtime first
            if (!ortScriptElement && typeof window.ort === 'undefined') {
                console.log('[Sarcasm Detector] Loading ONNX Runtime...');
                ortScriptElement = document.createElement('script');
                ortScriptElement.src = chrome.runtime.getURL('ort.min.js');
                ortScriptElement.type = 'text/javascript';
                document.head.appendChild(ortScriptElement);
                
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('ONNX Runtime loading timeout')), 10000);
                    ortScriptElement.onload = () => {
                        clearTimeout(timeout);
                        console.log('[Sarcasm Detector] ONNX Runtime loaded');
                        resolve();
                    };
                    ortScriptElement.onerror = () => {
                        clearTimeout(timeout);
                        reject(new Error('Failed to load ONNX Runtime'));
                    };
                });
                
                // Wait for ort to be available
                let attempts = 0;
                console.log('[Sarcasm Detector] Waiting for window.ort to be available...');
                while (typeof window.ort === 'undefined' && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                    if (attempts % 10 === 0) {
                        console.log(`[Sarcasm Detector] Still waiting for ort... attempt ${attempts}/50`);
                    }
                }
                
                if (typeof window.ort !== 'undefined') {
                    console.log('[Sarcasm Detector] ✓ window.ort is now available!');
                } else {
                    console.error('[Sarcasm Detector] ✗ window.ort not available after 5 seconds!');
                }
            }
            
            // Step 2: Load the model script
            if (!scriptElement) {
                console.log('[Sarcasm Detector] Creating script element for model.js');
                scriptElement = document.createElement('script');
                scriptElement.src = chrome.runtime.getURL('model.js');
                scriptElement.type = 'text/javascript';
                document.head.appendChild(scriptElement);
            }
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    isLoading = false;
                    console.error('[Sarcasm Detector] Model loading timeout after 15 seconds');
                    reject(new Error('Model loading timeout - check if model.js is properly configured'));
                }, 15000); // Increased to 15 seconds for ONNX model loading
                
                // Poll for the function with multiple attempts
                const checkModel = (attempts = 0) => {
                    console.log(`[Sarcasm Detector] Checking for model... attempt ${attempts + 1}`);
                    
                    if (typeof window.detectSarcasmModel === 'function') {
                        clearTimeout(timeout);
                        isLoading = false;
                        jsModel = window.detectSarcasmModel;
                        console.log('[Sarcasm Detector] Model loaded successfully!');
                        resolve(jsModel);
                    } else if (attempts < 100) {
                        // Keep trying for up to 10 seconds (100 * 100ms)
                        setTimeout(() => checkModel(attempts + 1), 100);
                    } else {
                        clearTimeout(timeout);
                        isLoading = false;
                        console.error('[Sarcasm Detector] Model script loaded but function not found after 100 attempts');
                        reject(new Error('Model function not found. Expected window.detectSarcasmModel'));
                    }
                };
                
                scriptElement.onload = () => {
                    console.log('[Sarcasm Detector] model.js script loaded successfully!');
                    console.log('[Sarcasm Detector] Checking window properties:', {
                        hasOrt: typeof window.ort !== 'undefined',
                        hasDetectFunction: typeof window.detectSarcasmModel !== 'undefined',
                        hasSetModelUrl: typeof window.setModelUrl !== 'undefined'
                    });
                    
                    // Set the model URL so model.js can load it
                    if (typeof window.setModelUrl === 'function') {
                        const modelUrl = chrome.runtime.getURL('model.onnx');
                        console.log('[Sarcasm Detector] Setting model URL:', modelUrl);
                        window.setModelUrl(modelUrl);
                    }
                    
                    // Start checking immediately
                    setTimeout(() => checkModel(), 100);
                };
                
                scriptElement.onerror = (error) => {
                    clearTimeout(timeout);
                    isLoading = false;
                    console.error('[Sarcasm Detector] Failed to load model script:', error);
                    reject(new Error('Failed to load model script'));
                };
            });
        } catch (error) {
            isLoading = false;
            console.error('[Sarcasm Detector] Error loading model:', error);
            throw error;
        }
    }

    async function detectSarcasmJSModel(tweetText) {
        try {
            const model = await loadJSModel();
            
            if (!model) {
                console.warn('[Sarcasm Detector] Model not available');
                return null;
            }
            
            const result = await Promise.resolve(model(tweetText));
            
            if (!result) {
                console.warn('[Sarcasm Detector] Model returned no result');
                return null;
            }
            
            // Ensure result has correct format
            return {
                isSarcasm: Boolean(result.isSarcasm || result.sarcasm || result.prediction),
                confidence: Math.min(1.0, Math.max(0.0, parseFloat(result.confidence || result.score || 0.5))),
                method: 'js-model'
            };
        } catch (error) {
            console.error('[Sarcasm Detector] JS Model error:', error);
            // Show user-friendly message
            if (error.message.includes('Extension context invalidated')) {
                console.warn('[Sarcasm Detector] Please refresh the page to reload the extension.');
            }
            return null;
        }
    }

    // Main detection function
    async function detectSarcasm(tweetText) {
        if (!CONFIG.enabled || !tweetText || tweetText.trim().length === 0) {
            return null;
        }

        return await detectSarcasmJSModel(tweetText);
    }

    // Create sarcasm indicator badge
    function createSarcasmBadge(result) {
        const badge = document.createElement('div');
        badge.className = 'sarcasm-badge';
        
        if (result.isSarcasm) {
            badge.classList.add('sarcasm-detected');
            badge.innerHTML = `
                <span class="sarcasm-icon">😏</span>
                <span class="sarcasm-text">Sarcasme</span>
                <span class="sarcasm-confidence">${Math.round(result.confidence * 100)}%</span>
            `;
        } else if (result.isNeutral) {
            badge.classList.add('sarcasm-neutral');
            badge.innerHTML = `
                <span class="sarcasm-icon">😐</span>
                <span class="sarcasm-text">Neutre</span>
                <span class="sarcasm-confidence">${Math.round(result.confidence * 100)}%</span>
            `;
        } else {
            badge.classList.add('sarcasm-not-detected');
            badge.innerHTML = `
                <span class="sarcasm-icon">😊</span>
                <span class="sarcasm-text">Non-Sarcasme</span>
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
                // Reset model loading state to allow retry
                modelLoadAttempted = false;
                jsModel = null;
                isLoading = false;
                scriptElement = null; // Allow script to be loaded again
                console.log('[Sarcasm Detector] Extension enabled, resetting model state');
                processAllTweets();
            } else {
                console.log('[Sarcasm Detector] Extension disabled, removing badges');
                document.querySelectorAll('.sarcasm-badge').forEach(badge => badge.remove());
                // Reset processed markers
                document.querySelectorAll('article[data-testid="tweet"]').forEach(tweet => {
                    tweet.dataset.sarcasmProcessed = 'false';
                });
            }
        }
    });

})();
