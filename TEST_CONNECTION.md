# Testing Extension ↔ Flask API Connection

## How the Connection Works

1. **Extension sends POST request** to Flask API with tweet text
2. **Flask API processes** the request and returns JSON response
3. **Extension receives response** and displays sarcasm badge

## Step-by-Step Test

### 1. Start Flask Server
```bash
cd flask_api
python app.py
```
You should see:
```
Starting server...
Running on http://0.0.0.0:5000
```

### 2. Configure Extension
1. Open Chrome extension popup
2. Make sure "🌐 External API" mode is selected (should be default now)
3. Verify API URL: `http://localhost:5000/detect-sarcasm`
4. Make sure extension is enabled (toggle ON)

### 3. Open Browser Console
1. Visit https://x.com
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. You should see logs like:
   ```
   [Sarcasm Detector] Configuration loaded: {mode: 'api', apiUrl: '...'}
   [Sarcasm Detector] Sending request to Flask API: http://localhost:5000/detect-sarcasm
   [Sarcasm Detector] Request payload: {text: "..."}
   [Sarcasm Detector] Response status: 200
   [Sarcasm Detector] Received response from Flask: {is_sarcasm: true, confidence: 0.85}
   [Sarcasm Detector] Processed result: {isSarcasm: true, confidence: 0.85, method: 'api'}
   ```

### 4. Check Flask Server Logs
In the Flask terminal, you should see:
```
127.0.0.1 - - [timestamp] "POST /detect-sarcasm HTTP/1.1" 200 -
```

### 5. Verify on X.com
- Scroll through tweets
- You should see sarcasm detection badges
- Badges should show results from Flask API (not static)

## Request/Response Flow

### Extension → Flask (Request)
```json
POST http://localhost:5000/detect-sarcasm
Content-Type: application/json

{
  "text": "Oh great, another meeting!"
}
```

### Flask → Extension (Response)
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "is_sarcasm": true,
  "confidence": 0.85,
  "text": "Oh great, another meeting!"
}
```

### Extension Processing
- Receives JSON response
- Extracts `is_sarcasm` and `confidence`
- Creates visual badge on tweet
- Displays result to user

## Troubleshooting

### No requests in Flask console?
- ✅ Check extension is in "API" mode (not Static)
- ✅ Verify API URL is correct
- ✅ Refresh X.com page
- ✅ Check browser console for errors

### Getting CORS errors?
- Flask-CORS is configured
- Check Flask console for CORS logs
- Verify Flask is running on port 5000

### Requests failing?
- Check Flask server is running
- Verify API URL in extension popup
- Check browser console for error details
- Look at Flask console for error messages

### Not seeing badges?
- Make sure extension is enabled
- Refresh X.com page
- Check browser console for processing logs
- Verify tweets are being detected

## Success Indicators

✅ Flask console shows POST requests  
✅ Browser console shows request/response logs  
✅ Sarcasm badges appear on tweets  
✅ Badges show confidence percentages  
✅ Results match Flask API responses  

