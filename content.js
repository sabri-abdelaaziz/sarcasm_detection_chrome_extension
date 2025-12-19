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

    // JavaScript Model detection (ONNX model loaded via manifest)
    let jsModel = null;
    let modelInitialized = false;
    
    async function loadJSModel() {
        // Check if model is already available (loaded via manifest)
        if (typeof window.detectSarcasmModel === 'function') {
            if (!jsModel) {
                jsModel = window.detectSarcasmModel;
                console.log('[Sarcasm Detector] ✓ Model function found');
                
                // Set model URL if needed
                if (typeof window.setModelUrl === 'function' && !modelInitialized) {
                    const modelUrl = chrome.runtime.getURL('model.onnx');
                    console.log('[Sarcasm Detector] Setting model URL:', modelUrl);
                    window.setModelUrl(modelUrl);
                    modelInitialized = true;
                }
            }
            return jsModel;
        }
        
        // Wait for model to be loaded (should happen quickly since it's in manifest)
        console.log('[Sarcasm Detector] Waiting for model to load...');
        let attempts = 0;
        while (typeof window.detectSarcasmModel !== 'function' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
            if (attempts % 10 === 0) {
                console.log(`[Sarcasm Detector] Still waiting... attempt ${attempts}/50`);
            }
        }
        
        if (typeof window.detectSarcasmModel === 'function') {
            jsModel = window.detectSarcasmModel;
            console.log('[Sarcasm Detector] ✓ Model loaded successfully!');
            
            // Set model URL
            if (typeof window.setModelUrl === 'function' && !modelInitialized) {
                const modelUrl = chrome.runtime.getURL('model.onnx');
                console.log('[Sarcasm Detector] Setting model URL:', modelUrl);
                window.setModelUrl(modelUrl);
                modelInitialized = true;
            }
            
            return jsModel;
        }
        
        console.error('[Sarcasm Detector] ✗ Model not found after waiting');
        return null;
    }

    // Language detection function - checks if text is primarily English
    function isEnglish(text) {
        // Remove URLs, mentions, hashtags, emojis for better detection
        const cleanText = text.replace(/https?:\/\/\S+/g, '')
                              .replace(/@\w+/g, '')
                              .replace(/#\w+/g, '')
                              .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
                              .trim();
        
        if (cleanText.length < 5) return true; // Too short to determine reliably, allow it
        
        // Check what percentage is non-Latin scripts (Arabic, Chinese, Japanese, Korean, Cyrillic, Greek, Hebrew, Thai, etc.)
        const nonLatinChars = (cleanText.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF\u0E00-\u0E7F]/g) || []).length;
        const totalChars = cleanText.replace(/\s/g, '').length;
        
        if (totalChars > 0 && nonLatinChars / totalChars > 0.3) {
            console.log('[Language] >30% non-Latin characters detected');
            return false;
        }
        
        // Clean for word analysis
        const wordText = cleanText.replace(/[^\w\s]/g, ' ').trim();
        const words = wordText.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        
        if (wordCount === 0) return false;
        
        // Check for French-specific words and patterns
        const frenchIndicators = [
            /\b(le|la|les|un|une|des|du|de|dans|sur|avec|sans|pour|par|chez|vers|contre)\b/i,
            /\b(je|tu|il|elle|nous|vous|ils|elles|mon|ma|mes|ton|ta|tes|son|sa|ses)\b/i,
            /\b(très|beaucoup|aussi|plus|moins|bien|mal|tout|tous|toute|toutes|même|autre)\b/i,
            /\b(qui|que|quoi|dont|où|comment|pourquoi|quand|quel|quelle)\b/i,
            /\b(est|sont|était|étaient|sera|seront|avoir|été|faire|dit)\b/i
        ];
        
        let frenchScore = 0;
        frenchIndicators.forEach(pattern => {
            const matches = wordText.match(pattern);
            if (matches) frenchScore += matches.length;
        });
        
        if (frenchScore >= 3) {
            console.log('[Language] French detected (score:', frenchScore, ')');
            return false;
        }
        
        // Check for Spanish-specific words
        const spanishIndicators = [
            /\b(el|la|los|las|un|una|unos|unas|del|en|con|por|para|como|pero|muy|más|menos)\b/i,
            /\b(yo|tú|él|ella|nosotros|vosotros|ellos|ellas|mi|tu|su|está|están|hay|qué)\b/i,
            /\b(ser|estar|hacer|poder|decir|ir|ver|dar|saber|querer|llegar|pasar)\b/i
        ];
        
        let spanishScore = 0;
        spanishIndicators.forEach(pattern => {
            const matches = wordText.match(pattern);
            if (matches) spanishScore += matches.length;
        });
        
        if (spanishScore >= 3) {
            console.log('[Language] Spanish detected (score:', spanishScore, ')');
            return false;
        }
        
        // Common English words - expanded list
        const englishIndicators = [
            // Articles, pronouns, basic verbs
            /\b(the|a|an|this|that|these|those)\b/i,
            /\b(i|you|he|she|it|we|they|me|him|her|us|them|my|your|his|her|its|our|their)\b/i,
            /\b(is|are|am|was|were|be|being|been|have|has|had|having)\b/i,
            /\b(do|does|did|doing|done|will|would|shall|should|can|could|may|might|must)\b/i,
            
            // Common verbs
            /\b(get|got|getting|make|take|go|come|see|look|want|need|know|think|feel)\b/i,
            /\b(say|said|tell|ask|work|seem|try|use|find|give|put|mean|keep|let|begin)\b/i,
            /\b(help|show|hear|play|run|move|live|believe|bring|happen|write|sit|stand|lose|pay)\b/i,
            
            // Conjunctions and prepositions
            /\b(and|or|but|if|when|where|what|who|how|why|which|because|while|since|until|unless)\b/i,
            /\b(in|on|at|to|for|with|from|by|about|as|into|like|through|after|over|between|under)\b/i,
            /\b(out|up|down|off|above|below|near|during|before|without|against|among|towards)\b/i,
            
            // Common adjectives and adverbs
            /\b(not|no|yes|all|any|some|every|each|many|much|more|most|less|little|few|other|another)\b/i,
            /\b(new|old|good|bad|great|big|small|long|short|high|low|early|late|last|next|first)\b/i,
            /\b(very|so|too|just|only|also|even|still|now|then|here|there|always|never|often)\b/i,
            
            // Question words and common expressions
            /\b(who's|what's|where's|when's|why's|how's|there's|here's|it's|that's|i'm|you're)\b/i,
            /\b(going to|have to|want to|need to|used to|able to|about to|got to)\b/i
        ];
        
        // Count English indicators
        let englishScore = 0;
        englishIndicators.forEach(pattern => {
            const matches = wordText.match(pattern);
            if (matches) englishScore += matches.length;
        });
        
        const englishRatio = englishScore / wordCount;
        
        // Debug log
        console.log('[Language] Words:', wordCount, 'English:', englishScore, 'Ratio:', (englishRatio * 100).toFixed(1) + '%', 'French:', frenchScore, 'Spanish:', spanishScore);
        
        // Stricter thresholds for better accuracy
        if (wordCount <= 5) {
            // Short texts: need at least 2 English words
            return englishScore >= 2;
        } else if (wordCount <= 10) {
            // Medium texts: need at least 30% English words
            return englishRatio >= 0.3 || englishScore >= 3;
        } else {
            // Longer texts: need at least 25% English words
            return englishRatio >= 0.25 || englishScore >= 5;
        }
    }

    async function detectSarcasmJSModel(tweetText) {
        try {
            // Language check - model trained only for English
            if (!isEnglish(tweetText)) {
                console.log('[Sarcasm Detector] Text is not in English, skipping detection');
                return null;
            }
            
            // Pre-filter: Skip obviously non-sarcastic content
            const lowerText = tweetText.toLowerCase();
            
            // Skip questions about sports/news (likely neutral/informative)
            const neutralPatterns = [
                /who('s| is| will|se)?\s+(been|join|your|the|man|player)/i,
                /what('s| is)?\s+(your|the|next|happening)/i,
                /when('s| is| will)/i,
                /where('s| is)/i,
                /\b(score|match|game|championship|winner|result)\b/i,
                /\b(announced|confirmed|official|breaking|update)\b/i
            ];
            
            if (neutralPatterns.some(pattern => pattern.test(tweetText))) {
                console.log('[Sarcasm Detector] Neutral/informative pattern detected, skipping');
                return null;
            }
            
            // Skip tweets with sports emojis (likely factual)
            if (/[🏆⚽🏀🎾⚾🏐🏈🥅]/.test(tweetText)) {
                console.log('[Sarcasm Detector] Sports emoji detected, likely factual');
                return null;
            }
            
            const model = await loadJSModel();
            
            if (!model) {
                console.warn('[Sarcasm Detector] Model not available');
                return null;
            }
            
            const result = await Promise.resolve(model(tweetText));
            
            if (!result || !result.probabilities) {
                console.warn('[Sarcasm Detector] Model returned no result');
                return null;
            }
            
            // Use probabilities for better accuracy
            const probs = result.probabilities;
            const maxProb = Math.max(probs.nonSarcasm, probs.sarcasm, probs.neutral);
            
            // Anti-false-positive: sarcasm needs VERY high confidence
            const isSarcasmPredicted = probs.sarcasm === maxProb;
            const minConfidence = isSarcasmPredicted ? 0.85 : 0.65; // 85% for sarcasm!
            
            // Only show badge if confidence meets threshold
            if (maxProb < minConfidence) {
                console.log('[Sarcasm Detector] Confidence too low:', (maxProb * 100).toFixed(1) + '%');
                return null;
            }
            
            // Strict check: sarcasm must be MUCH higher than non-sarcasm
            if (isSarcasmPredicted) {
                const gap = probs.sarcasm - probs.nonSarcasm;
                if (gap < 0.25) { // 25% minimum gap!
                    console.log('[Sarcasm Detector] Sarcasm gap too small:', (gap * 100).toFixed(1) + '%');
                    return null;
                }
                
                // Also check if sarcasm is not just slightly higher than neutral
                if (probs.sarcasm - probs.neutral < 0.20) {
                    console.log('[Sarcasm Detector] Sarcasm vs neutral too close');
                    return null;
                }
            }
            
            return {
                isSarcasm: probs.sarcasm === maxProb,
                isNeutral: probs.neutral === maxProb,
                confidence: maxProb,
                probabilities: probs,
                method: 'onnx-model'
            };
        } catch (error) {
            console.error('[Sarcasm Detector] JS Model error:', error);
            return null;
        }
    }

    async function processTweet(tweetElement) {
        // Check if already processed
        if (tweetElement.hasAttribute('data-sarcasm-processed')) {
            return;
        }
        tweetElement.setAttribute('data-sarcasm-processed', 'true');

        // Find tweet text
        const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');
        if (!tweetTextElement) {
            return;
        }

        const tweetText = tweetTextElement.innerText;
        if (!tweetText || tweetText.trim().length < 5) {
            return; // Skip very short tweets
        }

        // Detect sarcasm
        const result = await detectSarcasmJSModel(tweetText);
        
        if (!result) {
            return;
        }

        // Add colored border to tweet
        let borderColor, backgroundColor;
        if (result.isNeutral) {
            borderColor = 'rgba(158, 158, 158, 0.5)';
            backgroundColor = 'rgba(158, 158, 158, 0.05)';
        } else if (result.isSarcasm) {
            borderColor = 'rgba(255, 152, 0, 0.6)';
            backgroundColor = 'rgba(255, 193, 7, 0.08)';
        } else {
            borderColor = 'rgba(76, 175, 80, 0.6)';
            backgroundColor = 'rgba(76, 175, 80, 0.08)';
        }
        
        tweetElement.style.borderLeft = `4px solid ${borderColor}`;
        tweetElement.style.backgroundColor = backgroundColor;
        tweetElement.style.transition = 'all 0.3s ease';

        // Create badge
        const badge = document.createElement('div');
        
        if (result.isNeutral) {
            badge.className = 'sarcasm-badge sarcasm-neutral';
            badge.innerHTML = `<span class="sarcasm-icon">🤔</span><span class="sarcasm-text">Neutre</span>`;
        } else if (result.isSarcasm) {
            badge.className = 'sarcasm-badge sarcasm-detected';
            badge.innerHTML = `<span class="sarcasm-icon">😏</span><span class="sarcasm-text">Sarcasme</span>`;
        } else {
            badge.className = 'sarcasm-badge sarcasm-not-detected';
            badge.innerHTML = `<span class="sarcasm-icon">✓</span><span class="sarcasm-text">Not Sarcasm</span>`;
        }

        // Insert badge
        const tweetContainer = tweetElement.querySelector('[data-testid="tweetText"]').closest('div[data-testid="tweetText"]').parentElement;
        if (tweetContainer) {
            tweetContainer.appendChild(badge);
        }
    }

    let processingQueue = [];
    let isProcessing = false;
    
    async function processQueue() {
        if (isProcessing || processingQueue.length === 0) return;
        
        isProcessing = true;
        const tweet = processingQueue.shift();
        
        try {
            await processTweet(tweet);
        } catch (err) {
            console.error('[Sarcasm Detector] Error processing tweet:', err);
        }
        
        // Small delay between tweets to avoid blocking
        await new Promise(resolve => setTimeout(resolve, 50));
        isProcessing = false;
        
        // Process next
        if (processingQueue.length > 0) {
            processQueue();
        }
    }

    function processAllTweets() {
        if (!CONFIG.enabled) {
            return;
        }

        const tweets = document.querySelectorAll('article[data-testid="tweet"]:not([data-sarcasm-processed])');
        
        // Limit to 10 tweets at a time to avoid lag
        const tweetsArray = Array.from(tweets).slice(0, 10);
        
        tweetsArray.forEach(tweet => {
            if (!processingQueue.includes(tweet)) {
                processingQueue.push(tweet);
            }
        });
        
        processQueue();
    }

    // Initial processing
    setTimeout(() => {
        console.log('[Sarcasm Detector] Starting initial tweet processing...');
        processAllTweets();
    }, 2000);

    // Watch for new tweets with debouncing
    let debounceTimer;
    const observer = new MutationObserver((mutations) => {
        if (CONFIG.enabled) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                processAllTweets();
            }, 500); // Wait 500ms after last mutation
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Listen for toggle messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggleSarcasm') {
            CONFIG.enabled = request.enabled;
            console.log('[Sarcasm Detector] Detection', CONFIG.enabled ? 'enabled' : 'disabled');
            
            if (!CONFIG.enabled) {
                // Remove all badges
                document.querySelectorAll('.sarcasm-badge').forEach(badge => {
                    badge.remove();
                });
                // Remove borders and backgrounds
                document.querySelectorAll('[data-sarcasm-processed]').forEach(tweet => {
                    tweet.removeAttribute('data-sarcasm-processed');
                    tweet.style.borderLeft = '';
                    tweet.style.backgroundColor = '';
                });
                // Clear queue
                processingQueue = [];
            } else {
                // Re-process all tweets
                processAllTweets();
            }
            
            sendResponse({success: true});
        }
    });

    console.log('[Sarcasm Detector] Content script loaded successfully!');
    console.log('[Sarcasm Detector] Checking dependencies:', {
        hasOrt: typeof window.ort !== 'undefined',
        hasDetectFunction: typeof window.detectSarcasmModel !== 'undefined',
        hasSetModelUrl: typeof window.setModelUrl !== 'undefined'
    });
})();
