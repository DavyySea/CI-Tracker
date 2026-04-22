/* =========================
   js/emoji-style.js  v5
   Emoji palette styling
   ========================= */

(function() {
    'use strict';

    // Matches emoji glyphs + optional variation selector / skin-tone modifier + ZWJ sequences
    const EMOJI_RE = /\p{Extended_Pictographic}[\p{Emoji_Modifier}\uFE0F\u20E3]?(?:\u200D\p{Extended_Pictographic}[\p{Emoji_Modifier}\uFE0F\u20E3]?)*/gu;

    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'CODE', 'PRE', 'SVG']);

    function wrapTextNode(textNode) {
        const text = textNode.textContent;
        EMOJI_RE.lastIndex = 0;
        if (!EMOJI_RE.test(text)) return;
        EMOJI_RE.lastIndex = 0;

        const frag = document.createDocumentFragment();
        let lastIndex = 0;
        let match;

        while ((match = EMOJI_RE.exec(text)) !== null) {
            if (match.index > lastIndex) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }
            const span = document.createElement('span');
            span.className = 'emoji-glyph';
            span.textContent = match[0];
            frag.appendChild(span);
            lastIndex = EMOJI_RE.lastIndex;
        }

        if (lastIndex < text.length) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        textNode.parentNode.replaceChild(frag, textNode);
    }

    function processNode(node) {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
            const p = node.parentNode;
            if (!p || SKIP_TAGS.has(p.nodeName)) return;
            if (p.classList && p.classList.contains('emoji-glyph')) return;
            if (p.isContentEditable || (p.closest && p.closest('[contenteditable]'))) return;
            wrapTextNode(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (SKIP_TAGS.has(node.nodeName)) return;
            if (node.classList.contains('emoji-glyph')) return;
            if (node.isContentEditable) return;
            Array.from(node.childNodes).forEach(processNode);
        }
    }

    function applyAll() {
        processNode(document.body);
    }

    // Exposed for render functions to call directly (e.g. cost-analysis.js)
    window.applyEmojiStyles = applyAll;

    // Run once on load, then poll every 300ms to catch all dynamic renders —
    // async re-renders, setTimeout-delayed widgets, filter-triggered redraws, etc.
    // The emoji-glyph guard makes repeat passes instant no-ops.
    function init() {
        applyAll();
        setInterval(applyAll, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
