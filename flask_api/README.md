# Flask Sarcasm Detection API

Flask API server that receives requests from the Chrome extension and returns sarcasm detection results.

## Setup

1. **Install dependencies:**
   ```bash
   cd flask_api
   pip install -r requirements.txt
   ```

2. **Run the server:**
   ```bash
   python app.py
   ```

   The server will start on `http://localhost:5000`

## API Endpoints

### POST `/detect-sarcasm`
Main endpoint for sarcasm detection.

**Request:**
```json
{
  "text": "Oh great, another meeting!"
}
```

**Response:**
```json
{
  "is_sarcasm": true,
  "confidence": 0.85,
  "text": "Oh great, another meeting!"
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "Sarcasm Detection API is running"
}
```

## Testing

### Using curl:
```bash
curl -X POST http://localhost:5000/detect-sarcasm \
  -H "Content-Type: application/json" \
  -d '{"text": "Sure, that sounds like a perfect idea!"}'
```

### Using Python:
```python
import requests

response = requests.post(
    'http://localhost:5000/detect-sarcasm',
    json={'text': 'Oh wonderful, another update!'}
)
print(response.json())
```

## Integrating Your ML Model

1. **Replace the `detect_sarcasm_sample()` function** in `app.py` with your actual model:

```python
def detect_sarcasm_with_model(text):
    # Load your model
    # model = load_your_model()
    
    # Preprocess text
    # processed = preprocess(text)
    
    # Make prediction
    # prediction = model.predict(processed)
    
    return {
        'is_sarcasm': bool(prediction),
        'confidence': float(confidence_score)
    }
```

2. **Update the endpoint** to use your model function instead of `detect_sarcasm_sample()`

## Chrome Extension Integration

1. Start the Flask server
2. Open Chrome extension popup
3. Select "External API" mode
4. Enter API URL: `http://localhost:5000/detect-sarcasm`
5. Visit X.com to test

## CORS Configuration

The API is configured with CORS enabled to allow requests from the Chrome extension. If you need to restrict access, modify the CORS settings in `app.py`.

