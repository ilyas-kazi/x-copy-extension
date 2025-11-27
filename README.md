# X Copy Tweet - Cross-Browser Extension

A lightweight browser extension that adds a clean **Copy Tweet** button to every real tweet on **X.com** (formerly Twitter).  
It works across **Chrome, Edge, Brave, Opera, Vivaldi, Firefox, and Safari** using a unified `/src` codebase with platform-specific build folders.

---

# Project Structure (Cross-Browser)

```
x-copy-tweet/
│
├── src/                     # Master source (shared across all browsers)
│   ├── content.js
│   ├── styles.css
│   └── manifest.base.json
│
├── chrome/                  # Chrome / Edge / Brave / Opera / Vivaldi (Chromium)
│   ├── manifest.json
│   ├── content.js
│   ├── styles.css
│   └── icon.png
│
├── firefox/                 # Firefox MV3-compatible build
│   ├── manifest.json
│   ├── content.js
│   ├── styles.css
│   └── icon.png
│
└── safari/                  # Safari Web Extension (Xcode build folder)
    └── XCopyTweet/
        ├── manifest.json
        ├── content.js
        ├── styles.css
        ├── Resources/
        │   └── icon.png
        └── _metadata.json
```

---

# Browser Support

| Browser | Support | Folder |
|--------|---------|--------|
| Chrome |  Full  | `/chrome` |
| Edge |  Full  | `/chrome` |
| Brave |  Full  | `/chrome` |
| Opera |  Full  | `/chrome` |
| Vivaldi |  Full  | `/chrome` |
| Firefox |  MV3  | `/firefox` |
| Safari |  MV2  | `/safari/XCopyTweet` |

---

# Installation Instructions

## Chrome / Edge / Brave / Opera / Vivaldi

1. Open: `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select folder:

```
/chrome
```

---

## Firefox

1. Open: `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select:

```
/firefox/manifest.json
```

---

## Safari

Safari requires Xcode.

1. Open Xcode  
2. File → Open → select:

```
/safari/XCopyTweet/
```

3. Build & Run → enable the extension in Safari Preferences → Extensions

---

# How It Works

### ➣ Detects real tweets  
Only `<article>` elements containing tweet text are modified.

### ➣ Skips notifications  
No button appears for:
- Likes  
- Replies  
- Mentions  
- Follows  
- Suggestions  
- System notifications  

### ➣ Injects copy button into action bar  
Button becomes the *first icon*, maintaining native UX.

### ➣ Click → Copies text + shows toast  
Works via:
- `navigator.clipboard.writeText`
- Safari/Firefox fallback using `execCommand("copy")`

---

# Build Workflow

Place your working files in `/src`.

When you update:

```
content.js
styles.css
```

Copy them into:

```
/chrome
/firefox
/safari/XCopyTweet
```

(Optionally automate using a build script.)

---

# Future Enhancements

- Copy full thread  
- Copy tweet + username  
- Options page  
- Publish to Chrome Web Store  
- Firefox `.xpi` packaging  
- Safari App Store distribution  

---

# License  
MIT License - free to use, modify, and distribute.

---

# Credits  
Created for productivity - copy tweets with one click.
