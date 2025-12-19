/**
 * ONNX Sarcasm Detection Model
 * HybridBERT_AMBLSTM_GRU model for sarcasm classification
 * Classes: 0=non-sarcasm, 1=sarcasm, 2=neutral
 */

console.log('[Sarcasm Detector] Loading model.js...');

// Initialize ONNX Runtime WASM paths early
if (typeof window !== 'undefined' && window.ort) {
    // Try to get the extension URL for WASM files
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        const wasmPath = chrome.runtime.getURL('');
        console.log('[Sarcasm Detector] Setting WASM path to:', wasmPath);
        window.ort.env.wasm.wasmPaths = wasmPath;
    }
}

// Global variables
let ortSession = null;
let isModelLoading = false;
let tokenizer = null;
let modelUrl = null; // Will be set from content.js

// BERT Vocabulary (étendu avec les mots les plus courants)
const SIMPLIFIED_VOCAB = {
    '[PAD]': 0, '[UNK]': 100, '[CLS]': 101, '[SEP]': 102, '[MASK]': 103,
    
    // Articles, prépositions, conjonctions (1000-2100)
    'the': 1996, 'a': 1037, 'an': 1998, 'is': 2003, 'are': 2024, 'was': 2001, 'were': 2020,
    'of': 1997, 'and': 1998, 'to': 2000, 'in': 1999, 'for': 2005, 'with': 2007, 'on': 2006,
    'at': 2012, 'by': 2011, 'from': 2013, 'as': 2004, 'that': 2008, 'this': 2023,
    'it': 2009, 'be': 2022, 'or': 2030, 'but': 2021, 'not': 2025, 'so': 2061,
    
    // Verbes courants (2100-2300)
    'have': 2031, 'has': 2032, 'had': 2033, 'do': 2079, 'does': 2080, 'did': 2081,
    'will': 2097, 'would': 2052, 'can': 2064, 'could': 2071, 'should': 2323,
    'go': 2175, 'get': 2131, 'make': 2191, 'know': 2113, 'think': 2228, 'see': 2156,
    'come': 2272, 'want': 2215, 'look': 2291, 'use': 2224, 'find': 2424, 'give': 2507,
    'tell': 2425, 'work': 2147, 'call': 2170, 'try': 3046, 'ask': 3148, 'need': 2342,
    'feel': 2514, 'become': 2468, 'leave': 2681, 'put': 2404, 'mean': 2812,
    
    // Pronoms (2400-2500)
    'i': 1045, 'you': 2017, 'he': 2002, 'she': 2016, 'we': 2057, 'they': 2027,
    'me': 2033, 'him': 2032, 'her': 2014, 'us': 2149, 'them': 2068,
    'my': 2026, 'your': 2115, 'his': 2010, 'our': 2256, 'their': 2037,
    'what': 2054, 'which': 2029, 'who': 2040, 'when': 2043, 'where': 2073,
    'why': 2339, 'how': 2129,
    
    // Mots de sarcasme et sentiments (3000-4000)
    'obviously': 5468, 'sure': 2469, 'totally': 6135, 'definitely': 7078,
    'great': 2307, 'perfect': 3819, 'wonderful': 6919, 'amazing': 6429,
    'brilliant': 9351, 'genius': 7471, 'fantastic': 10392, 'excellent': 8313,
    'awesome': 12476, 'incredible': 13336, 'lovely': 7912, 'nice': 3835,
    'good': 2204, 'bad': 2919, 'terrible': 6659, 'horrible': 9202, 'awful': 11976,
    'love': 2293, 'hate': 5223, 'like': 2066, 'really': 2428, 'very': 2200,
    'never': 2196, 'always': 2467, 'maybe': 2672, 'perhaps': 3383,
    
    // Mots courants additionnels (2500-3000)
    'just': 2074, 'now': 2085, 'than': 2084, 'more': 2062, 'much': 2172,
    'about': 2055, 'out': 2041, 'up': 2039, 'if': 2065, 'some': 2070,
    'time': 2051, 'way': 2126, 'could': 2071, 'other': 2060, 'then': 2059,
    'people': 2111, 'take': 2202, 'into': 2046, 'year': 2095, 'good': 2204,
    'new': 2047, 'write': 3957, 'day': 2154, 'man': 2158, 'woman': 2450,
    
    // Ponctuation
    '!': 999, '?': 1029, '.': 1012, ',': 1010, "'": 1005, '"': 1000,
    '-': 1011, ':': 1024, ';': 1025, '(': 1006, ')': 1007
};

// Initialize ONNX model
async function initONNXModel() {
    if (ortSession) {
        console.log('[Sarcasm Detector] ONNX model already loaded');
        return ortSession;
    }
    
    if (isModelLoading) {
        console.log('[Sarcasm Detector] Model loading in progress...');
        while (isModelLoading && !ortSession) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return ortSession;
    }
    
    isModelLoading = true;
    
    try {
        console.log('[Sarcasm Detector] Initializing ONNX Runtime...');
        
        // Wait for ort to be available
        let attempts = 0;
        while (typeof window.ort === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof window.ort === 'undefined') {
            throw new Error('ONNX Runtime not loaded');
        }
        
        // Wait for model URL to be set
        attempts = 0;
        while (!modelUrl && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!modelUrl) {
            throw new Error('Model URL not provided');
        }
        
        console.log('[Sarcasm Detector] ONNX Runtime available, loading model from:', modelUrl);
        
        // Configure ONNX Runtime to find WASM files
        // Extract base path from model URL
        const basePath = modelUrl.substring(0, modelUrl.lastIndexOf('/') + 1);
        console.log('[Sarcasm Detector] Setting WASM path to:', basePath);
        
        // Set WASM paths (try both methods)
        if (!window.ort.env.wasm.wasmPaths) {
            window.ort.env.wasm.wasmPaths = basePath;
        }
        
        // Also try setting numThreads to 1 to avoid threading issues
        window.ort.env.wasm.numThreads = 1;
        
        console.log('[Sarcasm Detector] ONNX env configured:', {
            wasmPaths: window.ort.env.wasm.wasmPaths,
            numThreads: window.ort.env.wasm.numThreads
        });
        
        // Load the ONNX model
        ortSession = await window.ort.InferenceSession.create(modelUrl, {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all'
        });
        
        console.log('[Sarcasm Detector] ONNX model loaded successfully');
        console.log('[Sarcasm Detector] Model inputs:', ortSession.inputNames);
        console.log('[Sarcasm Detector] Model outputs:', ortSession.outputNames);
        
        isModelLoading = false;
        return ortSession;
        
    } catch (error) {
        console.error('[Sarcasm Detector] Failed to load ONNX model:', error);
        isModelLoading = false;
        throw error;
    }
}

// BERT-style tokenization
async function bertTokenize(text, maxLength = 128) {
    // Check if full vocab tokenizer is available
    if (typeof window.bertTokenizeWithFullVocab === 'function') {
        try {
            const result = await window.bertTokenizeWithFullVocab(text, maxLength);
            return {
                input_ids: result.input_ids,
                attention_mask: result.attention_mask
            };
        } catch (error) {
            console.warn('[Sarcasm Detector] Full vocab tokenization failed, using fallback:', error);
        }
    }
    
    // Fallback to simplified tokenization
    console.warn('[Sarcasm Detector] Using simplified vocabulary (fallback)');
    
    // Lowercase and basic cleaning
    text = text.toLowerCase().trim();
    
    // Split into words
    const words = text.split(/\s+/);
    
    // Convert to token IDs
    const tokenIds = [SIMPLIFIED_VOCAB['[CLS]']]; // Start with CLS
    let unkCount = 0;
    
    for (const word of words) {
        if (tokenIds.length >= maxLength - 1) break; // Reserve space for SEP
        
        // Clean word
        let cleanWord = word.replace(/[^\w\s!?,.']/g, '').toLowerCase();
        
        // Look up in vocab or use UNK
        const tokenId = SIMPLIFIED_VOCAB[cleanWord] || SIMPLIFIED_VOCAB['[UNK]'];
        if (tokenId === SIMPLIFIED_VOCAB['[UNK]']) unkCount++;
        tokenIds.push(tokenId);
    }
    
    console.log(`[Sarcasm Detector] Tokenization: ${words.length} words, ${unkCount} unknown (${(unkCount/words.length*100).toFixed(1)}%)`);
    
    // Add SEP token
    tokenIds.push(SIMPLIFIED_VOCAB['[SEP]']);
    
    // Create attention mask (1 for real tokens, 0 for padding)
    const attentionMask = new Array(tokenIds.length).fill(1);
    
    // Pad to maxLength
    while (tokenIds.length < maxLength) {
        tokenIds.push(SIMPLIFIED_VOCAB['[PAD]']);
        attentionMask.push(0);
    }
    
    // Truncate if too long
    return {
        input_ids: tokenIds.slice(0, maxLength),
        attention_mask: attentionMask.slice(0, maxLength)
    };
}

// Extract custom features (matching your notebook - 19 features)
function extractCustomFeatures(text) {
    const features = [];
    const lowerText = text.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length || 1;
    
    // 1. Text length features (2 features) - clamped to [0,1]
    features.push(Math.min(text.length / 280, 1.0));
    features.push(Math.min(wordCount / 50, 1.0));
    
    // 2. Punctuation features (4 features) - clamped
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    const periods = (text.match(/\./g) || []).length;
    const commas = (text.match(/,/g) || []).length;
    features.push(
        Math.min(exclamations / 3, 1.0),
        Math.min(questions / 2, 1.0),
        Math.min(periods / 3, 1.0),
        Math.min(commas / 3, 1.0)
    );
    
    // 3. Capitalization features (3 features)
    const upperCount = (text.match(/[A-Z]/g) || []).length;
    const upperRatio = upperCount / (text.length || 1);
    const allCapsWords = words.filter(w => w.length > 1 && w === w.toUpperCase()).length;
    features.push(
        Math.min(upperRatio, 1.0),
        Math.min(allCapsWords / wordCount, 1.0),
        Math.min(upperCount / 20, 1.0)
    );
    
    // 4. Special characters (2 features)
    const hashtags = (text.match(/#/g) || []).length;
    const mentions = (text.match(/@/g) || []).length;
    features.push(Math.min(hashtags / 3, 1.0), Math.min(mentions / 3, 1.0));
    
    // 5. Sarcasm keyword indicators (3 features) - lower sensitivity
    const sarcasmWords = ['obviously', 'sure', 'totally', 'definitely', 'great', 'perfect', 'brilliant', 'genius'];
    const positiveWords = ['great', 'perfect', 'wonderful', 'amazing', 'fantastic', 'excellent', 'brilliant'];
    const negativeContext = ['not', 'never', 'no', 'barely', 'hardly'];
    
    const sarcasmCount = sarcasmWords.filter(word => lowerText.includes(word)).length;
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeContext.filter(word => lowerText.includes(word)).length;
    
    features.push(
        Math.min(sarcasmCount / 3, 1.0),
        Math.min(positiveCount / 3, 1.0),
        Math.min(negativeCount / 2, 1.0)
    );
    
    // 6. Emoji and special patterns (3 features)
    const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/u.test(text) ? 1.0 : 0.0;
    const hasQuotes = Math.min((text.match(/["']/g) || []).length / 4, 1.0);
    const hasEllipsis = Math.min((text.match(/\.\.\.|\u2026/g) || []).length, 1.0);
    features.push(hasEmoji, hasQuotes, hasEllipsis);
    
    // 7. Additional linguistic features (2 features)
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;
    const uniqueWordRatio = new Set(words.map(w => w.toLowerCase())).size / wordCount;
    features.push(Math.min(avgWordLength / 8, 1.0), uniqueWordRatio);
    
    // Ensure exactly 19 features
    while (features.length < 19) {
        features.push(0.0);
    }
    
    console.log('[Sarcasm Detector] Features:', features.map(f => f.toFixed(3)).join(', '));
    
    return features.slice(0, 19);

}

// Main detection function
window.detectSarcasmModel = async function(text) {
    console.log('[Sarcasm Detector] Model called with text:', text.substring(0, 50) + '...');
    
    try {
        // Fallback simple si ONNX n'est pas disponible
        if (typeof window.ort === 'undefined') {
            console.warn('[Sarcasm Detector] ONNX Runtime not available, using fallback');
            return simpleFallback(text);
        }
        
        const session = await initONNXModel();
        
        if (!session) {
            console.warn('[Sarcasm Detector] Model not loaded, using fallback');
            return simpleFallback(text);
        }
        
        // Tokenize input (BERT-style with full vocabulary)
        const { input_ids, attention_mask } = await bertTokenize(text, 128);
        
        // Extract custom features
        const customFeatures = extractCustomFeatures(text);
        
        // Create tensors
        const feeds = {};
        
        try {
            // Input IDs (BERT tokens)
            feeds['input_ids'] = new window.ort.Tensor('int64', 
                BigInt64Array.from(input_ids.map(id => BigInt(id))), 
                [1, 128]
            );
            
            // Attention mask
            feeds['attention_mask'] = new window.ort.Tensor('int64',
                BigInt64Array.from(attention_mask.map(m => BigInt(m))),
                [1, 128]
            );
            
            // Custom features
            feeds['custom_features'] = new window.ort.Tensor('float32',
                Float32Array.from(customFeatures),
                [1, customFeatures.length]
            );
            
            console.log('[Sarcasm Detector] Input shapes:', {
                input_ids: [1, 128],
                attention_mask: [1, 128],
                custom_features: [1, customFeatures.length]
            });
            console.log('[Sarcasm Detector] Running inference...');
            
            // Run inference
            const results = await session.run(feeds);
            
            // Get output logits
            const logits = results.logits.data;
            
            console.log('[Sarcasm Detector] Model logits:', Array.from(logits));
            
            // Apply softmax
            const expScores = Array.from(logits).map(x => Math.exp(x));
            const sumExp = expScores.reduce((a, b) => a + b, 0);
            const probabilities = expScores.map(x => x / sumExp);
            
            console.log('[Sarcasm Detector] Probabilities:', {
                nonSarcasm: (probabilities[0] * 100).toFixed(1) + '%',
                sarcasm: (probabilities[1] * 100).toFixed(1) + '%',
                neutral: (probabilities[2] * 100).toFixed(1) + '%'
            });
            
            // Apply strong calibration to reduce false positives
            // Heavily penalize sarcasm prediction unless it's VERY clear
            let calibratedProbs = [...probabilities];
            const sarcasmScore = probabilities[1];
            const nonSarcasmScore = probabilities[0];
            const neutralScore = probabilities[2];
            
            // If sarcasm is not dominant by a large margin, heavily reduce it
            const gap = sarcasmScore - nonSarcasmScore;
            
            if (gap < 0.4) { // If gap < 40%, apply strong penalty
                calibratedProbs[0] = calibratedProbs[0] * 1.8; // Strong boost non-sarcasm
                calibratedProbs[1] = calibratedProbs[1] * 0.4; // Heavy penalty sarcasm
                calibratedProbs[2] = calibratedProbs[2] * 1.2; // Slight boost neutral
                
                // Re-normalize
                const sum = calibratedProbs.reduce((a, b) => a + b, 0);
                calibratedProbs = calibratedProbs.map(p => p / sum);
                
                console.log('[Sarcasm Detector] Strong calibration applied (gap=' + (gap * 100).toFixed(1) + '%):');
                console.log('[Sarcasm Detector] Calibrated probabilities:', {
                    nonSarcasm: (calibratedProbs[0] * 100).toFixed(1) + '%',
                    sarcasm: (calibratedProbs[1] * 100).toFixed(1) + '%',
                    neutral: (calibratedProbs[2] * 100).toFixed(1) + '%'
                });
            } else if (gap < 0.25) { // If gap < 25%, apply moderate penalty
                calibratedProbs[0] = calibratedProbs[0] * 1.5;
                calibratedProbs[1] = calibratedProbs[1] * 0.6;
                
                const sum = calibratedProbs.reduce((a, b) => a + b, 0);
                calibratedProbs = calibratedProbs.map(p => p / sum);
                
                console.log('[Sarcasm Detector] Moderate calibration applied');
            }
            
            // Use calibrated probabilities
            const finalProbabilities = calibratedProbs;
            
            // Classes: 0=non-sarcasm, 1=sarcasm, 2=neutral
            const predictedClass = finalProbabilities.indexOf(Math.max(...finalProbabilities));
            const confidence = finalProbabilities[predictedClass];
            
            const result = {
                isSarcasm: predictedClass === 1,
                isNeutral: predictedClass === 2,
                confidence: confidence,
                probabilities: {
                    nonSarcasm: finalProbabilities[0],
                    sarcasm: finalProbabilities[1],
                    neutral: finalProbabilities[2]
                }
            };
            
            console.log('[Sarcasm Detector] Final result:', {
                predictedClass,
                label: predictedClass === 0 ? 'Non-Sarcasm' : predictedClass === 1 ? 'Sarcasm' : 'Neutral',
                confidence: (confidence * 100).toFixed(1) + '%',
                sarcasmProb: (finalProbabilities[1] * 100).toFixed(1) + '%',
                gap: (Math.abs(finalProbabilities[1] - finalProbabilities[0]) * 100).toFixed(1) + '%'
            });
            return result;
            
        } catch (tensorError) {
            console.error('[Sarcasm Detector] Error during inference:', tensorError);
            return simpleFallback(text);
        }
        
    } catch (error) {
        console.error('[Sarcasm Detector] ONNX inference error:', error);
        return simpleFallback(text);
    }
};

// Simple fallback when ONNX fails
function simpleFallback(text) {
    console.log('[Sarcasm Detector] Using simple fallback detection');
    const sarcasmKeywords = [
        'obviously', 'sure', 'totally', 'definitely', 'yeah right',
        'as if', 'whatever', 'great', 'wonderful', 'perfect',
        'love it', 'amazing', 'brilliant', 'genius', 'fantastic'
    ];
    
    const lowerText = text.toLowerCase();
    const keywordCount = sarcasmKeywords.filter(kw => lowerText.includes(kw)).length;
    const exclamationCount = (text.match(/!/g) || []).length;
    
    let score = 0;
    if (keywordCount > 0) score += 0.3;
    if (keywordCount > 1) score += 0.2;
    if (exclamationCount > 1) score += 0.15;
    
    const isSarcasm = score > 0.4;
    const confidence = Math.min(score + 0.4, 0.95);
    
    return {
        isSarcasm: isSarcasm,
        confidence: confidence,
        probabilities: {
            nonSarcasm: isSarcasm ? 1 - confidence : confidence,
            sarcasm: isSarcasm ? confidence : 1 - confidence,
            neutral: 0.1
        }
    };
}

console.log('[Sarcasm Detector] Model function defined successfully');

// Expose the function immediately so content.js can find it
if (typeof window !== 'undefined') {
    console.log('[Sarcasm Detector] Model function exposed to window');
    console.log('[Sarcasm Detector] window.detectSarcasmModel type:', typeof window.detectSarcasmModel);
    console.log('[Sarcasm Detector] ort available:', typeof window.ort !== 'undefined' ? 'YES' : 'NO');
    
    // Function to set model URL (will be called from content.js)
    window.setModelUrl = function(url) {
        console.log('[Sarcasm Detector] Model URL set to:', url);
        modelUrl = url;
        
        // Start loading the model if ort is available
        if (typeof window.ort !== 'undefined') {
            console.log('[Sarcasm Detector] Starting model preload...');
            initONNXModel().then(() => {
                console.log('[Sarcasm Detector] Model preloaded successfully!');
            }).catch(err => {
                console.error('[Sarcasm Detector] Model preload failed:', err);
            });
        } else {
            console.warn('[Sarcasm Detector] ort not available yet, model will load on first use');
        }
    };
}

