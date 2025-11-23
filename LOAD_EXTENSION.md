# How to Load the Extension in Chrome

## Step-by-Step Instructions

1. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Type `chrome://extensions/` in the address bar and press Enter
   - OR go to: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner
   - It should turn blue/on

3. **Load the Extension**
   - Click the "Load unpacked" button (top-left)
   - Navigate to this folder: `C:\Users\jook\Desktop\adia_m2\deep_learning\Chrom_extension`
   - Select the folder and click "Select Folder"

4. **Verify Installation**
   - You should see "ADIA-X Sarcasm Detector" in your extensions list
   - Make sure it's enabled (toggle switch should be ON)

5. **Test the Extension**
   - Go to https://x.com or https://twitter.com
   - The extension will automatically start detecting sarcasm in tweets
   - Look for orange/green badges on tweets
   - Click the extension icon in the toolbar to open settings

## Troubleshooting

- **Extension not loading?**
  - Make sure all files are in the same folder
  - Check that manifest.json is valid (no errors shown)
  - Try reloading the extension (click the refresh icon)

- **Not working on X.com?**
  - Refresh the X.com page (F5)
  - Check browser console for errors (F12 → Console tab)
  - Make sure the extension is enabled

- **Icon missing?**
  - This is normal - the extension works without icons
  - You'll see a puzzle piece icon instead

## Quick Test

1. Load the extension
2. Visit https://x.com
3. Scroll through tweets
4. You should see sarcasm detection badges appear!

