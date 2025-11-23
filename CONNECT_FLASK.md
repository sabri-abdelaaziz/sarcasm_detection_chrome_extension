# How to Connect Extension to Flask API

## Quick Setup

The extension is now configured with the Flask API URL as default. Here's how to connect:

### Step 1: Start Flask Server
```bash
cd flask_api
python app.py
```
You should see:
```
Starting server...
Running on http://0.0.0.0:5000
```

### Step 2: Configure Extension

1. **Open Chrome Extension Popup**
   - Click the extension icon in Chrome toolbar
   - Or right-click extension → "Options"

2. **Switch to API Mode**
   - Click the "🌐 External API" button
   - The API URL field should show: `http://localhost:5000/detect-sarcasm`
   - If not, enter it manually

3. **Save Settings**
   - Click outside the input field (it auto-saves)
   - You should see "API URL updated" message

### Step 3: Test on X.com

1. Visit https://x.com
2. Refresh the page (F5)
3. Scroll through tweets
4. You should see sarcasm detection badges!

## Verify Connection

### Check Flask Server Logs
When you visit X.com, you should see requests in the Flask console:
```
127.0.0.1 - - [timestamp] "POST /detect-sarcasm HTTP/1.1" 200 -
```

### Check Browser Console
1. Open X.com
2. Press F12 → Console tab
3. Look for any errors (should be none if connected)

## Troubleshooting

### Extension not detecting?
- ✅ Make sure Flask server is running
- ✅ Check API URL in extension popup is correct
- ✅ Refresh X.com page after changing settings
- ✅ Check browser console for errors

### Flask server not receiving requests?
- ✅ Check Flask is running on port 5000
- ✅ Verify CORS is enabled (it is by default)
- ✅ Check firewall isn't blocking localhost:5000

### Getting CORS errors?
- Flask-CORS is already configured
- If still getting errors, check Flask console for details

## Default Settings

- **Mode**: Static (for testing)
- **API URL**: `http://localhost:5000/detect-sarcasm` (pre-filled)
- **Status**: Extension enabled by default

You just need to switch to "External API" mode and the Flask URL is already there!

