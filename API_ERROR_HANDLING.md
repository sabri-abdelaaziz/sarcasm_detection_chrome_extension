# API Error Handling - No Fallback Behavior

## Current Behavior

When the Flask API server is **not running** or **unreachable**:

✅ **Extension shows NOTHING** - No badges appear on tweets  
✅ **No fallback to static detection** - Only shows results from Flask API  
✅ **Errors logged to console** - Check browser console (F12) for details  

## What Happens

### When Flask API is Running:
- ✅ Extension sends POST request to Flask
- ✅ Flask responds with sarcasm detection
- ✅ Badges appear on tweets showing results

### When Flask API is NOT Running:
- ❌ Extension tries to connect (5 second timeout)
- ❌ Connection fails
- ❌ **No badges shown** - Tweets appear normally without detection badges
- ❌ Error logged in console: `"Flask API server is not running or unreachable"`

## Console Messages

### When Server is Down:
```
[Sarcasm Detector] Sending request to Flask API: http://localhost:5000/detect-sarcasm
[Sarcasm Detector] Flask API server is not running or unreachable
[Sarcasm Detector] Error details: Failed to fetch
[Sarcasm Detector] No result - API server may not be running
```

### When Server is Running:
```
[Sarcasm Detector] Sending request to Flask API: http://localhost:5000/detect-sarcasm
[Sarcasm Detector] Response status: 200
[Sarcasm Detector] Received response from Flask: {is_sarcasm: true, confidence: 0.85}
[Sarcasm Detector] Processed result: {isSarcasm: true, confidence: 0.85, method: 'api'}
```

## Testing

1. **Start Flask server:**
   ```bash
   cd flask_api
   python app.py
   ```

2. **Visit X.com:**
   - Badges should appear on tweets

3. **Stop Flask server (Ctrl+C):**
   - Refresh X.com page
   - **No badges should appear**
   - Check console for error messages

4. **Restart Flask server:**
   - Refresh X.com page
   - Badges should appear again

## Key Points

- ✅ **No false results** - Extension only shows real API responses
- ✅ **Clear error indication** - Console logs show what's wrong
- ✅ **No confusing fallbacks** - Users know when API is down
- ✅ **5 second timeout** - Fast detection of server issues

## Troubleshooting

**Q: Why are no badges showing?**
- Check if Flask server is running
- Check browser console for error messages
- Verify API URL in extension popup is correct

**Q: How do I know if the API is working?**
- Open browser console (F12)
- Look for `[Sarcasm Detector]` messages
- Check Flask server console for incoming requests

**Q: Can I get a visual indicator when server is down?**
- Currently, no badges = server down
- Check console for detailed error messages
- Future: Could add a status indicator in extension popup

