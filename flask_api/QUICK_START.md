# Flask API Quick Start

## ✅ Flask API is Running!

The Flask server is running and tested successfully.

## Current Status

- ✅ Server running on: `http://localhost:5000`
- ✅ API endpoint: `http://localhost:5000/detect-sarcasm`
- ✅ Sample detection working (ready for ML model integration)
- ✅ CORS configured for Chrome extension

## Connect Chrome Extension

1. **Make sure Flask server is running:**
   ```bash
   cd flask_api
   python app.py
   ```

2. **Open Chrome Extension:**
   - Click the extension icon in Chrome toolbar
   - Select "External API" mode
   - Enter API URL: `http://localhost:5000/detect-sarcasm`
   - Click outside the input to save

3. **Test on X.com:**
   - Visit https://x.com
   - Scroll through tweets
   - You should see sarcasm detection badges!

## API Endpoint

**URL:** `http://localhost:5000/detect-sarcasm`

**Method:** POST

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

## Test the API

```bash
# Using curl
curl -X POST http://localhost:5000/detect-sarcasm \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Sure, that sounds perfect!\"}"

# Or run the test script
python test_api.py
```

## Next Steps: Integrate Your ML Model

1. **Replace the `detect_sarcasm_sample()` function** in `app.py`:

```python
def detect_sarcasm_with_model(text):
    # Load your model
    # model = load_your_model('path/to/model.pkl')
    
    # Preprocess text
    # processed = preprocess_text(text)
    
    # Make prediction
    # prediction = model.predict(processed)
    # confidence = model.predict_proba(processed)[0][1]
    
    return {
        'is_sarcasm': bool(prediction > 0.5),
        'confidence': float(confidence)
    }
```

2. **Update the endpoint** to use your model:
   - Replace `detect_sarcasm_sample(text)` with `detect_sarcasm_with_model(text)`

3. **Add your model dependencies** to `requirements.txt`:
   ```
   scikit-learn==1.3.0
   numpy==1.24.3
   # ... your other dependencies
   ```

## Troubleshooting

- **Connection refused?** Make sure Flask server is running
- **CORS errors?** Flask-CORS is already configured
- **Extension not connecting?** Check the API URL in extension popup

