## Cross-Browser Build Folder Structure

x-copy-tweet/
│
├── src/                     # Master source (your real code)
│   ├── content.js
│   ├── styles.css
│   ├── icon.png
│   └── manifest.base.json   # Shared values
│
├── chrome/                  # Chrome / Edge / Brave / Opera / Vivaldi
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
└── safari/                  # Safari Web Extension (Xcode folder)
    ├── XCopyTweet/
    │   ├── manifest.json
    │   ├── content.js
    │   ├── styles.css
    │   ├── Resources/
    │   │   └── icon.png
    │   └── _metadata.json
    └── README_SAFARI.md
