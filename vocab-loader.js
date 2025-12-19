/**
 * BERT Vocabulary Loader
 * Loads the full BERT vocab.txt and creates token mappings
 */

console.log('[Sarcasm Detector] Loading BERT vocabulary...');

// Global vocabulary object
window.BERT_VOCAB = null;
window.BERT_VOCAB_LOADING = false;

// Load vocabulary from vocab.txt
async function loadBertVocab() {
    if (window.BERT_VOCAB) {
        return window.BERT_VOCAB;
    }
    
    if (window.BERT_VOCAB_LOADING) {
        // Wait for loading to complete
        while (window.BERT_VOCAB_LOADING && !window.BERT_VOCAB) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return window.BERT_VOCAB;
    }
    
    window.BERT_VOCAB_LOADING = true;
    
    try {
        const vocabUrl = chrome.runtime.getURL('vocab.txt');
        console.log('[Sarcasm Detector] Fetching vocab from:', vocabUrl);
        
        const response = await fetch(vocabUrl);
        const text = await response.text();
        
        // Parse vocab.txt - each line is a token, line number is the ID
        const tokens = text.trim().split('\n');
        
        // Create token-to-id mapping
        const vocab = {};
        tokens.forEach((token, index) => {
            vocab[token.trim()] = index;
        });
        
        console.log(`[Sarcasm Detector] ✓ Loaded ${Object.keys(vocab).length} tokens`);
        
        window.BERT_VOCAB = vocab;
        window.BERT_VOCAB_LOADING = false;
        
        return vocab;
        
    } catch (error) {
        console.error('[Sarcasm Detector] Failed to load vocabulary:', error);
        window.BERT_VOCAB_LOADING = false;
        
        // Fallback to simplified vocab
        console.warn('[Sarcasm Detector] Using fallback vocabulary');
        window.BERT_VOCAB = {
            '[PAD]': 0, '[UNK]': 100, '[CLS]': 101, '[SEP]': 102, '[MASK]': 103
        };
        return window.BERT_VOCAB;
    }
}

// WordPiece tokenization (basic implementation)
function wordPieceTokenize(word, vocab) {
    if (vocab[word] !== undefined) {
        return [word];
    }
    
    const tokens = [];
    let start = 0;
    
    while (start < word.length) {
        let end = word.length;
        let foundToken = null;
        
        while (start < end) {
            let substr = word.slice(start, end);
            if (start > 0) {
                substr = '##' + substr;
            }
            
            if (vocab[substr] !== undefined) {
                foundToken = substr;
                break;
            }
            end--;
        }
        
        if (foundToken === null) {
            return ['[UNK]'];
        }
        
        tokens.push(foundToken);
        start = end;
    }
    
    return tokens;
}

// Enhanced BERT tokenization with full vocabulary
window.bertTokenizeWithFullVocab = async function(text, maxLength = 128) {
    const vocab = await loadBertVocab();
    
    // Basic text cleaning
    text = text.toLowerCase().trim();
    
    // Split on whitespace and punctuation
    const words = text.split(/\s+/);
    
    // Start with [CLS]
    const tokens = ['[CLS]'];
    let tokenIds = [vocab['[CLS]']];
    let unkCount = 0;
    
    for (const word of words) {
        if (tokenIds.length >= maxLength - 1) break;
        
        // Clean word (remove special chars but keep alphanumeric)
        const cleanWord = word.replace(/[^\w\s'-]/g, '').toLowerCase();
        if (!cleanWord) continue;
        
        // WordPiece tokenization
        const subTokens = wordPieceTokenize(cleanWord, vocab);
        
        for (const token of subTokens) {
            if (tokenIds.length >= maxLength - 1) break;
            
            const tokenId = vocab[token] !== undefined ? vocab[token] : vocab['[UNK]'];
            if (tokenId === vocab['[UNK]']) unkCount++;
            
            tokens.push(token);
            tokenIds.push(tokenId);
        }
    }
    
    // Add [SEP]
    tokens.push('[SEP]');
    tokenIds.push(vocab['[SEP]']);
    
    // Create attention mask
    const attentionMask = new Array(tokenIds.length).fill(1);
    
    // Pad to maxLength
    while (tokenIds.length < maxLength) {
        tokens.push('[PAD]');
        tokenIds.push(vocab['[PAD]']);
        attentionMask.push(0);
    }
    
    // Truncate if needed
    const finalTokenIds = tokenIds.slice(0, maxLength);
    const finalAttentionMask = attentionMask.slice(0, maxLength);
    const finalTokens = tokens.slice(0, maxLength);
    
    const totalTokens = words.length;
    const unkPercentage = totalTokens > 0 ? (unkCount / totalTokens * 100).toFixed(1) : 0;
    
    console.log(`[Sarcasm Detector] Full vocab tokenization: ${totalTokens} words → ${finalTokenIds.length} tokens, ${unkCount} UNK (${unkPercentage}%)`);
    
    return {
        tokens: finalTokens,
        input_ids: finalTokenIds,
        attention_mask: finalAttentionMask
    };
};

console.log('[Sarcasm Detector] ✓ Vocab loader ready');
