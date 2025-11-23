# X Sarcasm Detector - Chrome Extension

A Chrome extension that detects sarcasm in X (Twitter) tweets. Supports three modes: Static testing, JavaScript model, or External API.

## Features

- 🔍 Automatically detects sarcasm in tweets on X.com and Twitter.com
- 🎨 Visual indicators showing sarcasm detection results
- ⚙️ Three detection modes:
  - **Static Mode**: For testing (random results)
  - **JavaScript Model**: Use your ML model directly in the browser
  - **External API**: Connect to any API endpoint
- 📊 Confidence scores displayed
- 🔄 Real-time detection on dynamically loaded tweets

## Installation

1. **Download/Clone this extension folder**

2. **Create Extension Icons** (Optional)
   - Create three icon files: `icon16.png`, `icon48.png`, and `icon128.png`
   - Or remove the icon references from `manifest.json` temporarily

3. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder

4. **Test the Extension**
   - Navigate to https://x.com or https://twitter.com
   - The extension will automatically detect tweets and show sarcasm indicators
   - Click the extension icon to open the popup and adjust settings

## Detection Modes

### 1. Static Mode (Testing)
- Uses random detection results for testing
- No configuration needed
- Perfect for testing the UI

### 2. JavaScript Model Mode
Use your ML model directly in JavaScript.

**Setup:**
1. Create a `model.js` file in the extension root (see `model.js.example`)
2. Implement a function: `window.detectSarcasmModel(text)`
3. Return: `{ isSarcasm: boolean, confidence: number }`
4. In the popup, select "JavaScript Model" mode
5. Enter the model file path (default: `model.js`)

**Example Model:**
```javascript
window.detectSarcasmModel = function(text) {
    // Your model logic here
    return {
        isSarcasm: true,
        confidence: 0.85
    };
};
```

**Supported Libraries:**
- TensorFlow.js
- ONNX Runtime Web
- Any JavaScript ML library
- Custom logic

### 3. External API Mode
Connect to any external API endpoint.

**Setup:**
1. In the popup, select "External API" mode
2. Enter your API endpoint URL
3. Your API should accept POST requests with:
   ```json
   {
     "text": "Tweet text here"
   }
   ```
4. And return:
   ```json
   {
     "is_sarcasm": true,
     "confidence": 0.85
   }
   ```

**API Response Formats Supported:**
- `is_sarcasm` or `sarcasm` or `isSarcasm` or `prediction`
- `confidence` or `score`

## File Structure

```
Chrom_extension/
├── manifest.json      # Extension configuration
├── content.js         # Main script that detects tweets
├── styles.css         # Styling for sarcasm badges
├── popup.html         # Extension popup UI
├── popup.js           # Popup functionality
├── model.js           # Your JavaScript model (create this)
├── model.js.example   # Example model template
├── README.md          # This file
└── icon*.png          # Extension icons (optional)
```

## How It Works

1. **Content Script** (`content.js`):
   - Runs on X.com and Twitter.com pages
   - Monitors for new tweets using MutationObserver
   - Extracts tweet text and sends it for detection
   - Adds visual badges to tweets showing detection results

2. **Detection Modes**:
   - **Static**: Random results for testing
   - **JS Model**: Loads and runs your JavaScript model
   - **API**: Sends POST request to your API endpoint

3. **Visual Indicators**:
   - 🟠 Orange badge: Sarcasm detected
   - 🟢 Green badge: Not sarcasm
   - Shows confidence percentage

## Using TensorFlow.js

If you want to use TensorFlow.js:

1. Download TensorFlow.js and include it in your extension
2. Load your trained model:
```javascript
window.detectSarcasmModel = async function(text) {
    const model = await tf.loadLayersModel(chrome.runtime.getURL('model.json'));
    // Preprocess text
    const input = preprocessText(text);
    // Predict
    const prediction = model.predict(input);
    const result = await prediction.data();
    return {
        isSarcasm: result[0] > 0.5,
        confidence: Math.abs(result[0] - 0.5) * 2
    };
};
```

3. Add model files to `web_accessible_resources` in `manifest.json`

## Using ONNX Runtime

If you want to use ONNX Runtime:

1. Include ONNX Runtime Web in your extension
2. Load your ONNX model:
```javascript
window.detectSarcasmModel = async function(text) {
    const session = await ort.InferenceSession.create(
        chrome.runtime.getURL('model.onnx')
    );
    const input = preprocessText(text);
    const results = await session.run(input);
    return {
        isSarcasm: results.output.data[0] > 0.5,
        confidence: Math.abs(results.output.data[0] - 0.5) * 2
    };
};
```

## Troubleshooting

- **Icons not showing**: Create the icon PNG files or remove icon references from manifest.json
- **Extension not working**: Check that you're on x.com or twitter.com
- **Badges not appearing**: Open browser console (F12) to check for errors
- **JS Model not loading**: Check the file path and ensure the function is named `window.detectSarcasmModel`
- **API not connecting**: Check CORS settings and API URL

## Development

### Testing Static Mode
- Works immediately after installation
- No configuration required
- Results are randomized for demonstration

### Testing JavaScript Model
1. Copy `model.js.example` to `model.js`
2. Implement your model function
3. Switch to "JavaScript Model" mode in popup
4. Test on X.com

### Testing External API
1. Set up your API endpoint
2. Switch to "External API" mode
3. Enter your API URL
4. Test on X.com

## License

MIT License - Feel free to modify and use as needed.
