// X-COPY content script (debug friendly, robust selectors)

console.log("X-COPY: content script loaded");

const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) console.log("X-COPY:", ...args);
}

// Helper: extract username from tweet
function extractUsername(tweetEl) {
    // Try to find username in tweet
    const userLink = tweetEl.querySelector("a[href^='/'][role='link']");
    if (userLink) {
        const href = userLink.getAttribute('href');
        const match = href.match(/^\/([^\/]+)/);
        if (match) return '@' + match[1];
    }
    return null;
}

// Helper: extract display name from tweet
function extractDisplayName(tweetEl) {
    // Try multiple approaches to find the display name
    
    // Approach 1: Look in the User-Name test ID area
    const userNameSection = tweetEl.querySelector('[data-testid="User-Name"]');
    if (userNameSection) {
        // Find all spans and get the first one that's not a username (doesn't start with @)
        const spans = userNameSection.querySelectorAll('span');
        for (const span of spans) {
            const text = span.textContent?.trim();
            if (text && !text.startsWith('@') && !text.includes('·') && text.length > 0) {
                return text;
            }
        }
    }
    
    // Approach 2: Look for a div/span with specific styling (usually bold)
    const boldSpans = tweetEl.querySelectorAll('div[dir="ltr"] > span');
    for (const span of boldSpans) {
        const text = span.textContent?.trim();
        if (text && !text.startsWith('@') && !text.includes('http') && text.length > 0 && text.length < 50) {
            return text;
        }
    }
    
    return null;
}

// Helper: clean up text by fixing URLs and mentions that have line breaks
function cleanText(text) {
    return text
        // Remove line breaks WITHIN URLs (after protocol)
        .replace(/(https?:\/\/)\s*\n\s*/g, '$1')
        // Remove line breaks before and after @mentions
        .replace(/\s*\n\s*(@\w+)/g, ' $1')
        .replace(/(@\w+)\s*\n\s*/g, '$1 ')
        // Remove line breaks before URLs
        .replace(/\s*\n\s*(https?:\/\/)/g, ' $1')
        // Remove line breaks after URLs (before next word)
        .replace(/(https?:\/\/\S+)\s+/g, '$1 ')
        // Fix space before punctuation (e.g., "word ." -> "word.")
        .replace(/\s+([.,!?;:])/g, '$1')
        // Clean up multiple spaces
        .replace(/  +/g, ' ')
        // Trim
        .trim();
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
    // get all article elements that are not processed
    const articles = Array.from(document.querySelectorAll("article:not([data-x-copy])"));

    articles.forEach(article => {

        // Skip ALL notifications entirely
        if (article.closest('[data-testid="notification"]')) {
            article.dataset.xCopy = "skip-notification";
            return;
        }

        // Only allow REAL tweets (with tweetText)
        const hasTweetText =
            article.querySelector("[data-testid='tweetText']") ||
            article.querySelector("div[lang]");

        if (!hasTweetText) {
            article.dataset.xCopy = "skip-non-tweet";
            return;
        }

        // mark processed (Continue normally for real tweets only)
        article.dataset.xCopy = "1";

        // Create wrapper and button
        const wrapper = document.createElement("span");
        wrapper.className = "x-copy-btn-wrapper";

        const btn = document.createElement("button");
        btn.className = "x-copy-btn";
        btn.type = "button";
        btn.setAttribute("aria-label", "Copy tweet text");

        // SVG icon (copy) — small and simple
        btn.innerHTML = `
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M10 1H3C2.4477 1 2 1.4477 2 2v8h1V2h7V1zm3 3H6C5.4477 4 5 4.4477 5 5v9c0 .5523.4477 1 1 1h7c.5523 0 1-.4477 1-1V5c0-.5523-.4477-1-1-1zm-1 9H7V6h5v7z"></path>
      </svg>
    `;

        // Create tooltip element
        const tooltip = document.createElement("div");
        tooltip.className = "x-copy-tooltip";
        tooltip.textContent = "Copy Tweet";
        document.body.appendChild(tooltip);

        // Store reference to tooltip in button for cleanup
        btn._xcopyTooltip = tooltip;

        // Tooltip hover handlers
        let tooltipTimeout;
        btn.addEventListener("mouseenter", () => {
            tooltipTimeout = setTimeout(() => {
                const rect = btn.getBoundingClientRect();
                tooltip.style.left = (rect.left + rect.width / 2) + "px";
                tooltip.style.top = (rect.bottom + 4) + "px";
                tooltip.classList.add("show");
            }, 300); // 300ms delay
        });

        btn.addEventListener("mouseleave", () => {
            clearTimeout(tooltipTimeout);
            tooltip.classList.remove("show");
        });

        // Create menu (will be appended to body for proper z-index)
        const menu = document.createElement("div");
        menu.className = "x-copy-menu";
        menu.style.display = "none";
        menu.style.position = "fixed";  // Use fixed positioning

        // Menu item 1: Copy tweet
        const menuItem1 = document.createElement("div");
        menuItem1.className = "x-copy-menu-item";
        menuItem1.textContent = "Copy tweet";
        menuItem1.addEventListener("click", async (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const textNode = article.querySelector("[data-testid='tweetText'], div[lang]");
            const text = cleanText(textNode?.innerText?.trim() ?? "");

            if (!text) {
                showToast(article, "No text");
                closeMenu(menu);
                return;
            }

            try {
                await navigator.clipboard.writeText(text);
                showToast(article, "Copied!");
            } catch (err) {
                fallbackCopy(text, article);
            }
            closeMenu(menu);
        });

        // Menu item 2: Copy tweet + Username
        const menuItem2 = document.createElement("div");
        menuItem2.className = "x-copy-menu-item";
        menuItem2.textContent = "Copy tweet + Username";
        menuItem2.addEventListener("click", async (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const textNode = article.querySelector("[data-testid='tweetText'], div[lang]");
            const text = cleanText(textNode?.innerText?.trim() ?? "");
            const username = extractUsername(article);
            const displayName = extractDisplayName(article);

            if (!text) {
                showToast(article, "No text");
                closeMenu(menu);
                return;
            }

            // Format: Display Name (@username) or just @username if display name not found
            let header = '';
            if (displayName && username) {
                header = `${displayName} (${username})`;
            } else if (username) {
                header = username;
            }
            
            const fullText = header ? `${header}\n${text}` : text;

            try {
                await navigator.clipboard.writeText(fullText);
                showToast(article, "Copied with username!");
            } catch (err) {
                fallbackCopy(fullText, article);
            }
            closeMenu(menu);
        });

        menu.appendChild(menuItem1);
        menu.appendChild(menuItem2);
        
        // Append menu to body instead of wrapper to avoid z-index issues
        document.body.appendChild(menu);
        
        // Store reference to menu in button for cleanup
        btn._xcopyMenu = menu;

        // Click handler to toggle menu
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();

            // Hide tooltip when menu opens
            tooltip.classList.remove("show");
            clearTimeout(tooltipTimeout);

            // Close other open menus
            document.querySelectorAll(".x-copy-menu").forEach(m => {
                if (m !== menu) m.style.display = "none";
            });

            // Toggle this menu
            if (menu.style.display === "none" || !menu.style.display) {
                // Calculate position relative to button
                const rect = btn.getBoundingClientRect();
                menu.style.left = rect.left + "px";
                menu.style.top = (rect.bottom + 4) + "px";  // 4px below button
                menu.style.display = "block";
            } else {
                menu.style.display = "none";
            }
        });

        wrapper.appendChild(btn);

        // --- Insert wrapper into action / icon group if possible ---
        // Preferred: find the action group container (where reply/retweet/like/bookmark live)
        let actionGroup = article.querySelector("div[role='group']");
        if (!actionGroup) {
            // fallback: find a div inside article that has several svg icons/buttons (heuristic)
            const divs = Array.from(article.querySelectorAll("div"));
            actionGroup = divs.find(d => {
                const btnCount = d.querySelectorAll("div[role='button'], button, a").length;
                const svgCount = d.querySelectorAll("svg").length;
                return btnCount >= 3 && svgCount >= 3;
            });
        }

        if (actionGroup) {
            // insert as first child so native icons appear to the right
            actionGroup.insertBefore(wrapper, actionGroup.firstChild);

            // Optional: mark action group so CSS hover rules can target it if needed
            actionGroup.classList.add("x-action-group");
        } else {
            // fallback: absolute position inside article (safe fallback)
            article.style.position = article.style.position || "relative";
            const fallbackWrap = document.createElement("div");
            fallbackWrap.style.position = "absolute";
            fallbackWrap.style.top = "8px";
            fallbackWrap.style.right = "8px";
            fallbackWrap.style.zIndex = 20;
            fallbackWrap.appendChild(wrapper);
            article.appendChild(fallbackWrap);
        }
    });
}

// Helper: close menu
function closeMenu(menu) {
    menu.style.display = "none";
}

// Helper: fallback copy method
function fallbackCopy(text, article) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand("copy");
        showToast(article, "Copied!");
    } catch (e) {
        showToast(article, "Copy failed");
    }
    ta.remove();
}

// helper: show small toast near action group or at top-right of article
function showToast(article, message) {
    const existing = article.querySelector(".x-copy-toast");
    if (existing) { existing.remove(); }
    const toast = document.createElement("div");
    toast.className = "x-copy-toast";
    toast.innerText = message;

    // try to position near action group if present
    const actionGroup = article.querySelector("div[role='group'], .x-action-group");
    if (actionGroup) {
        // append to actionGroup's parent so it floats near icons
        actionGroup.parentElement.style.position = actionGroup.parentElement.style.position || "relative";
        actionGroup.parentElement.appendChild(toast);
        // slight positioning to put toast above icons
        toast.style.position = "absolute";
        toast.style.right = "0px";
        toast.style.top = "-36px";
    } else {
        // fallback append to article
        article.appendChild(toast);
        toast.style.position = "absolute";
        toast.style.right = "8px";
        toast.style.top = "-36px";
    }

    // animate
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 220);
    }, 900);
}


// Close menu and tooltips when clicking outside
document.addEventListener("click", (e) => {
    if (!e.target.closest(".x-copy-btn-wrapper")) {
        document.querySelectorAll(".x-copy-menu").forEach(menu => {
            menu.style.display = "none";
        });
        document.querySelectorAll(".x-copy-tooltip").forEach(tooltip => {
            tooltip.classList.remove("show");
        });
    }
});

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
