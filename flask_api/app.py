"""
Flask API for Sarcasm Detection
Receives requests from Chrome extension and returns sarcasm detection results
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome extension

# Sample sarcasm keywords for basic detection
SARCASM_KEYWORDS = [
    'sure', 'obviously', 'totally', 'definitely', 'yeah right',
    'as if', 'whatever', 'great', 'wonderful', 'perfect',
    'love it', 'amazing', 'brilliant', 'genius', 'fantastic',
    'best ever', 'so happy', 'thrilled'
]


def detect_sarcasm_sample(text):
    """
    Sample sarcasm detection function.
    Replace this with your actual ML model later.
    
    Args:
        text: Input text to analyze
        
    Returns:
        dict: {
            'is_sarcasm': bool,
            'confidence': float (0.0-1.0)
        }
    """
    if not text or not isinstance(text, str):
        return {
            'is_sarcasm': False,
            'confidence': 0.5
        }
    
    text_lower = text.lower()
    
    # Count sarcasm keywords
    keyword_count = sum(1 for keyword in SARCASM_KEYWORDS if keyword in text_lower)
    
    # Count punctuation
    exclamation_count = text.count('!')
    question_count = text.count('?')
    
    # Simple scoring algorithm
    score = 0.0
    
    # Keywords contribute to sarcasm score
    if keyword_count > 0:
        score += 0.3
    if keyword_count > 1:
        score += 0.2
    if keyword_count > 2:
        score += 0.15
    
    # Multiple punctuation marks suggest sarcasm
    if exclamation_count > 1:
        score += 0.15
    if question_count > 0 and keyword_count > 0:
        score += 0.1
    
    # All caps can indicate sarcasm
    if text == text.upper() and len(text) > 5 and text != text.lower():
        score += 0.1
    
    # Add some randomness for variety (remove this when using real model)
    score += random.uniform(-0.1, 0.1)
    score = max(0.0, min(1.0, score))  # Clamp between 0 and 1
    
    # Determine if sarcasm
    is_sarcasm = score > 0.4
    
    # Calculate confidence
    confidence = min(score + 0.3, 0.95) if is_sarcasm else min((1 - score) + 0.3, 0.95)
    
    return {
        'is_sarcasm': is_sarcasm,
        'confidence': round(confidence, 2)
    }


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Sarcasm Detection API is running'
    }), 200


@app.route('/detect-sarcasm', methods=['POST'])
def detect_sarcasm():
    """
    Main endpoint for sarcasm detection.
    
    Expected request body:
    {
        "text": "Tweet text here"
    }
    
    Returns:
    {
        "is_sarcasm": true/false,
        "confidence": 0.0-1.0
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No JSON data provided'
            }), 400
        
        # Extract text
        text = data.get('text', '')
        
        if not text or not isinstance(text, str):
            return jsonify({
                'error': 'Text field is required and must be a string'
            }), 400
        
        # TODO: Replace this with your actual ML model
        # For now, using sample detection
        result = detect_sarcasm_sample(text)
        
        # Return response
        return jsonify({
            'is_sarcasm': result['is_sarcasm'],
            'confidence': result['confidence'],
            'text': text[:100]  # Return first 100 chars for debugging
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


@app.route('/detect-sarcasm', methods=['GET'])
def detect_sarcasm_get():
    """GET endpoint for testing (optional)"""
    text = request.args.get('text', '')
    if not text:
        return jsonify({
            'error': 'Text parameter is required'
        }), 400
    
    result = detect_sarcasm_sample(text)
    return jsonify({
        'is_sarcasm': result['is_sarcasm'],
        'confidence': result['confidence'],
        'text': text[:100]
    }), 200


if __name__ == '__main__':
    print("=" * 50)
    print("Sarcasm Detection API")
    print("=" * 50)
    print("API Endpoint: http://localhost:5000/detect-sarcasm")
    print("Health Check: http://localhost:5000/health")
    print("=" * 50)
    print("Starting server...")
    app.run(debug=True, host='0.0.0.0', port=5000)

