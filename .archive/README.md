# X Copy Tweet – Chrome Extension

A lightweight Chrome extension that adds a clean, native-style **Copy** button to every real tweet on X.com.  
The button copies tweet text instantly and does **not** appear in the Notifications tab.

---

## Installation (Manual)

### 1. Download this folder to your computer

Make sure the folder contains:

```
manifest.json
content.js
styles.css
README.md
```

### 2. Open Chrome Extensions page

Visit:

```
chrome://extensions
```

### 3. Enable Developer Mode

Toggle **Developer Mode** (top‑right corner).

### 4. Click **Load unpacked**

Select the extension folder.

Chrome will immediately install it.

---

## How to Test

### ➣ On Timeline or Profile  
Hover on a tweet → Copy button appears inside the action icons.  
Click → Text copied + small “Copied!” toast appears.

### ✘ On Notifications  
The copy button **will NOT** appear for:

- Likes  
- Reposts  
- Follows  
- Mentions  
- Suggestions  
- Recommendations  
- Any non‑tweet notifications

Only real tweets show the button.

---

## How It Works

- `content.js` injects the Copy button into tweets.  
- `styles.css` handles styling of the icon and the toast notification.  
- `manifest.json` registers the scripts with Chrome.  

Tweets are detected using:

- Must contain `data-testid="tweetText"` or `div[lang]`  
- Must NOT be inside `data-testid="notification"`

---

## Reload After Editing

If you change any file:

1. Go to `chrome://extensions`
2. Click **Reload** under the extension
3. Refresh X.com

---

## License

MIT License – free to use and modify.

