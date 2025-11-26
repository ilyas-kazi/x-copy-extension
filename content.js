// X-COPY content script (debug friendly, robust selectors)

console.log("X-COPY: content script loaded");

const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) console.log("X-COPY:", ...args);
}

// Helper: get tweet text reliably (tries multiple selectors)
function extractTweetText(tweetEl) {
    // Prefer explicit tweet text testid
    let textEl = tweetEl.querySelector("[data-testid='tweetText'], div[lang]");
    if (textEl && textEl.innerText.trim()) return textEl.innerText.trim();

    // Fallback: gather visible text nodes inside article ignoring buttons/links
    const walker = document.createTreeWalker(tweetEl, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            // skip script/style and common UI/class names
            const skip = ["button", "a", "svg", "time"].includes(parent.tagName.toLowerCase()) ||
                parent.closest("a, button, svg, css-1dbjc4n");
            if (skip) return NodeFilter.FILTER_REJECT;
            if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    let pieces = [];
    let n;
    while (n = walker.nextNode()) pieces.push(n.nodeValue.trim());
    const joined = pieces.join(" ").replace(/\s+/g, " ").trim();
    return joined;
}

// Create the copy button element
function makeCopyButton() {
    const btn = document.createElement("button");
    btn.className = "x-copy-btn";
    btn.type = "button";
    btn.innerText = "Copy";
    btn.style.userSelect = "none";
    return btn;
}

function addCopyButtons() {
    const tweets = document.querySelectorAll("article:not([data-x-copy])");

    tweets.forEach(article => {
        article.dataset.xCopy = "1";
        article.style.position = "relative"; // anchor for absolute button

        // Create wrapper
        const wrapper = document.createElement("div");
        wrapper.className = "x-copy-btn-wrapper";

        // Create the button
        const btn = document.createElement("button");
        btn.className = "x-copy-btn";
        btn.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M10 1H3C2.4 1 2 1.4 2 2v9h2V3h6V1zm3 3H6C5.4 4 5 4.4 5 5v9c0 .6.4 1 1 1h7c.6 0 1-.4 1-1V5c0-.6-.4-1-1-1zm-1 9H7V6h5v7z"></path>
      </svg>
    `;

        // Copy logic
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();

            const textNode = article.querySelector("[data-testid='tweetText'], div[lang]");
            const text = textNode?.innerText?.trim() ?? "";

            await navigator.clipboard.writeText(text);

            // Toast animation
            const toast = document.createElement("div");
            toast.className = "x-copy-toast";
            toast.innerText = "Copied!";
            article.appendChild(toast);

            requestAnimationFrame(() => toast.classList.add("show"));

            setTimeout(() => {
                toast.classList.remove("show");
                setTimeout(() => toast.remove(), 300);
            }, 1000);
        });

        wrapper.appendChild(btn);
        article.appendChild(wrapper);
    });
}

// Try to add copy buttons to all articles that don't have one
function addCopyButtonsLegacy() {
    // X tweets are usually <article role="article"> or article elements
    const articles = Array.from(document.querySelectorAll("article[role='article'], article"));

    if (!articles.length) {
        debugLog("no article elements found yet");
    }

    articles.forEach(article => {
        if (article.dataset.xCopyAdded) return;
        // mark as processed early
        article.dataset.xCopyAdded = "1";

        // Where to insert the button? Try header or the action bar
        let insertTarget = article.querySelector("header") || article.querySelector("[data-testid='tweet']") || article;

        if (!insertTarget) {
            debugLog("no insert target for article", article);
            return;
        }

        const btn = makeCopyButton();
        btn.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            const text = extractTweetText(article);
            if (!text) {
                debugLog("no tweet text found for this article");
                btn.innerText = "No text";
                setTimeout(() => btn.innerText = "Copy", 1200);
                return;
            }

            try {
                await navigator.clipboard.writeText(text);
                btn.innerText = "Copied!";
                setTimeout(() => btn.innerText = "Copy", 1200);
                debugLog("copied text:", text.slice(0, 120));
            } catch (err) {
                debugLog("clipboard write failed:", err);
                // Fallback: select and execCommand (may be blocked in MV3 but try)
                const ta = document.createElement("textarea");
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand("copy"); btn.innerText = "Copied!"; }
                catch (e) { btn.innerText = "Err"; console.error(e); }
                document.body.removeChild(ta);
                setTimeout(() => btn.innerText = "Copy", 1200);
            }
        });

        // Wrapper absolute-positioned inside article
        const wrapper = document.createElement("div");
        wrapper.className = "x-copy-btn-wrapper";
        wrapper.appendChild(btn);

        // Ensure article has relative position to anchor the ABS wrapper
        article.style.position = "relative";

        article.appendChild(wrapper);
        debugLog("inserted absolute-positioned copy button");

        // Append button (small container to avoid breaking layout)
        // const wrapper = document.createElement("span");
        // wrapper.className = "x-copy-btn-wrapper";
        // wrapper.style.marginLeft = "8px";
        // wrapper.appendChild(btn);
        // // Prefer to append to header's right side if possible
        // // If header contains a flex container, append to it; otherwise append at end
        // try {
        //     // try to find a logical action bar (right of header)
        //     const headerRight = insertTarget.querySelector("div[dir='auto'], div[role='group']") || insertTarget;
        //     headerRight.appendChild(wrapper);
        //     debugLog("inserted button into", headerRight);
        // } catch (e) {
        //     insertTarget.appendChild(wrapper);
        //     debugLog("fallback inserted button into article");
        // }
    });
}

// Observe DOM changes (infinite scroll)
const observer = new MutationObserver((mutations) => {
    addCopyButtons();
});

observer.observe(document.body, { childList: true, subtree: true });

// Also run periodically for initial load edge cases
const interval = setInterval(() => {
    addCopyButtons();
}, 1500);

// Stop interval after 30s to avoid polling forever
setTimeout(() => clearInterval(interval), 30000);

debugLog("setup complete, attempting initial injection");
addCopyButtons();
