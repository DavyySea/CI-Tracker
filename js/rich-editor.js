/* =========================
   js/rich-editor.js  v2
   Rich Text Editor — auto-attaches to textarea.form-control
   Exclusion: add data-plain attribute or class "re-plain" to opt out
   ========================= */

(function () {
    'use strict';

    // Palette shown in the color picker dropdown
    var COLOR_PALETTE = [
        '#ffffff', '#d0d0d0', '#888888', '#444444', '#111111',
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
        '#8b5cf6', '#ec4899', '#14b8a6', '#ACFF24', '#60a5fa'
    ];

    function buildColorSwatches() {
        return COLOR_PALETTE.map(function (c) {
            return '<span class="re-color-swatch" data-color="' + c + '" ' +
                'style="background:' + c + ';" title="' + c + '"></span>';
        }).join('');
    }

    var TOOLBAR_HTML = [
        '<div class="re-toolbar">',
        '<button type="button" class="re-btn re-btn-bold"      data-cmd="bold"               title="Bold"><b>B</b></button>',
        '<button type="button" class="re-btn re-btn-italic"    data-cmd="italic"             title="Italic"><i>I</i></button>',
        '<button type="button" class="re-btn re-btn-underline" data-cmd="underline"          title="Underline"><u>U</u></button>',
        '<button type="button" class="re-btn re-btn-strike"    data-cmd="strikeThrough"      title="Strikethrough"><s>S</s></button>',
        '<span class="re-sep"></span>',
        '<button type="button" class="re-btn" data-cmd="insertUnorderedList" title="Bullet list">&#8226; List</button>',
        '<button type="button" class="re-btn" data-cmd="insertOrderedList"   title="Numbered list">1. List</button>',
        '<span class="re-sep"></span>',
        '<button type="button" class="re-btn re-btn-indent"  data-cmd="indent"  title="Indent (Tab)">&#8677; Indent</button>',
        '<button type="button" class="re-btn re-btn-outdent" data-cmd="outdent" title="Outdent (Shift+Tab)">&#8676; Outdent</button>',
        '<span class="re-sep"></span>',
        '<button type="button" class="re-btn re-btn-hilite" data-cmd="hiliteColor" data-val="#ffff66" title="Highlight">Highlight</button>',
        // Color picker wrapper — dropdown appears on click
        '<div class="re-color-wrap">',
        '  <button type="button" class="re-btn re-btn-color" title="Text color">',
        '    <span class="re-color-preview">A</span>',
        '    <span style="font-size:9px;vertical-align:middle;">&#9660;</span>',
        '  </button>',
        '  <div class="re-color-dropdown">',
        '    <div class="re-color-grid">' + buildColorSwatches() + '</div>',
        '    <div style="display:flex;gap:6px;align-items:center;margin-top:6px;padding-top:6px;border-top:1px solid #333;">',
        '      <label style="font-size:11px;color:#aaa;white-space:nowrap;">Custom:</label>',
        '      <input type="color" class="re-color-custom" value="#ffffff" title="Custom color">',
        '      <button type="button" class="re-btn" style="padding:2px 8px;font-size:11px;" data-action="applyCustomColor">Apply</button>',
        '    </div>',
        '  </div>',
        '</div>',
        '<button type="button" class="re-btn" data-cmd="removeFormat" title="Remove all formatting">Clear</button>',
        '</div>'
    ].join('');

    function upgradeTextarea(ta) {
        if (ta.dataset.reUpgraded) return;
        if (ta.hasAttribute('data-plain')) return;
        if (ta.classList.contains('re-plain')) return;
        ta.dataset.reUpgraded = '1';

        var rows = parseInt(ta.getAttribute('rows'), 10) || 3;

        // Wrapper
        var wrapper = document.createElement('div');
        wrapper.className = 're-wrapper';

        // Toolbar
        var toolbarContainer = document.createElement('div');
        toolbarContainer.innerHTML = TOOLBAR_HTML;
        var toolbar = toolbarContainer.firstElementChild;

        // Editor div
        var editor = document.createElement('div');
        editor.className = 're-editor';
        editor.contentEditable = 'true';
        editor.spellcheck = true;
        editor.style.minHeight = (rows * 1.6) + 'em';

        // Load existing value
        var existingVal = ta.value;
        if (existingVal) {
            if (/<[a-z][\s\S]*?>/i.test(existingVal)) {
                editor.innerHTML = existingVal;
            } else {
                editor.innerHTML = existingVal
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\n/g, '<br>');
            }
        }

        // Insert into DOM
        ta.parentNode.insertBefore(wrapper, ta);
        ta.style.display = 'none';
        wrapper.appendChild(toolbar);
        wrapper.appendChild(editor);
        wrapper.appendChild(ta);

        // Sync editor → hidden textarea
        function sync() {
            var html = editor.innerHTML;
            ta.value = (html === '<br>' || html === '') ? '' : html;
        }
        editor.addEventListener('input', sync);

        // ── Tab key: indent / Shift+Tab: outdent ──────────────────────────────
        editor.addEventListener('keydown', function (e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                e.stopPropagation();
                document.execCommand(e.shiftKey ? 'outdent' : 'indent');
                sync();
            }
        });

        // ── Toolbar: regular command buttons ─────────────────────────────────
        toolbar.addEventListener('mousedown', function (e) {
            // Color swatch click
            var swatch = e.target.closest('.re-color-swatch');
            if (swatch) {
                e.preventDefault();
                editor.focus();
                var color = swatch.dataset.color;
                applyColor(color, toolbar);
                closeColorDropdown(toolbar);
                sync();
                return;
            }

            // Custom color apply button
            var customApply = e.target.closest('[data-action="applyCustomColor"]');
            if (customApply) {
                e.preventDefault();
                editor.focus();
                var customInput = toolbar.querySelector('.re-color-custom');
                if (customInput) applyColor(customInput.value, toolbar);
                closeColorDropdown(toolbar);
                sync();
                return;
            }

            // Color picker toggle button
            var colorBtn = e.target.closest('.re-btn-color');
            if (colorBtn) {
                e.preventDefault();
                var wrap = colorBtn.closest('.re-color-wrap');
                if (wrap) wrap.classList.toggle('re-color-open');
                return;
            }

            // Standard execCommand buttons
            var btn = e.target.closest('[data-cmd]');
            if (!btn) return;
            e.preventDefault();
            editor.focus();

            var cmd  = btn.dataset.cmd;
            var val  = btn.dataset.val || null;

            if (cmd === 'hiliteColor') {
                try {
                    document.execCommand('styleWithCSS', false, true);
                    document.execCommand('hiliteColor', false, val);
                } catch (ex) {
                    document.execCommand('backColor', false, val);
                }
            } else {
                document.execCommand(cmd, false, val);
            }
            sync();
        });

        // Close color dropdown when clicking outside
        document.addEventListener('mousedown', function (e) {
            var wrap = toolbar.querySelector('.re-color-wrap');
            if (wrap && !wrap.contains(e.target)) {
                wrap.classList.remove('re-color-open');
            }
        }, true);
    }

    function applyColor(color, toolbar) {
        try {
            document.execCommand('styleWithCSS', false, true);
            document.execCommand('foreColor', false, color);
        } catch (ex) {
            document.execCommand('foreColor', false, color);
        }
        // Update the preview swatch on the button
        var preview = toolbar.querySelector('.re-color-preview');
        if (preview) preview.style.color = color;
    }

    function closeColorDropdown(toolbar) {
        var wrap = toolbar.querySelector('.re-color-wrap');
        if (wrap) wrap.classList.remove('re-color-open');
    }

    // ── Auto-upgrade ──────────────────────────────────────────────────────────

    function scanAndUpgrade(root) {
        if (!root || root.nodeType !== 1) return;
        if (root.tagName === 'TEXTAREA' && root.classList.contains('form-control')) {
            upgradeTextarea(root);
        }
        var found = root.querySelectorAll('textarea.form-control');
        Array.prototype.forEach.call(found, upgradeTextarea);
    }

    var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var added = mutations[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
                scanAndUpgrade(added[j]);
            }
        }
    });

    var initialized = false;
    function init() {
        if (initialized) return;
        initialized = true;
        scanAndUpgrade(document.body);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
