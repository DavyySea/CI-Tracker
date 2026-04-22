/* =========================
   js/notes.js  v4
   Notes — OneNote-style editor
   ========================= */
(function () {
    'use strict';

    var NOTE_COLORS = [
        { key:'none',   hex:null,       label:'Default'  },
        { key:'yellow', hex:'#b8940a',  label:'Yellow'   },
        { key:'green',  hex:'#27ae60',  label:'Green'    },
        { key:'blue',   hex:'#2980b9',  label:'Blue'     },
        { key:'purple', hex:'#8e44ad',  label:'Purple'   },
        { key:'red',    hex:'#c0392b',  label:'Red'      },
        { key:'teal',   hex:'#16a085',  label:'Teal'     },
    ];

    var HIGHLIGHT_COLORS = [
        { color:'#fef08a', label:'Yellow'  },
        { color:'#bbf7d0', label:'Green'   },
        { color:'#bae6fd', label:'Cyan'    },
        { color:'#fbcfe8', label:'Pink'    },
        { color:'#fed7aa', label:'Orange'  },
        { color:'#e9d5ff', label:'Purple'  },
    ];

    var TEXT_COLORS = [
        '#ffffff','#d0d0d0','#888888','#444444','#111111',
        '#ef4444','#f97316','#eab308','#22c55e','#3b82f6',
        '#8b5cf6','#ec4899','#14b8a6','#00c8f0','#60a5fa'
    ];

    var _search = '';
    var _editNoteId = null;
    var _autoSaveTimer = null;
    var _sortMode = 'updated';
    var _savedSel = null; // saved selection ranges for color pickers

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotesModule);
    } else {
        initNotesModule();
    }

    function initNotesModule() {
        var orig = window.renderCurrentPage;
        if (orig) {
            window.renderCurrentPage = function () {
                orig();
                if (app.currentPage === 'notes') renderNotesPage();
            };
        }
    }

    function ensureData() {
        if (!app.data.notes) app.data.notes = [];
    }

    function escapeHtml(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── Selection save/restore ───────────────────────────────────────────────
    function saveSelection() {
        var sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            _savedSel = [];
            for (var i = 0; i < sel.rangeCount; i++) {
                _savedSel.push(sel.getRangeAt(i).cloneRange());
            }
        }
    }

    function restoreSelection() {
        if (!_savedSel || !_savedSel.length) return false;
        var sel = window.getSelection();
        sel.removeAllRanges();
        _savedSel.forEach(function(r) { sel.addRange(r); });
        return true;
    }

    function editorExec(cmd, val) {
        var editor = document.getElementById('note-body-editor');
        if (!editor) return;
        editor.focus();
        try { document.execCommand('styleWithCSS', false, true); } catch(e){}
        document.execCommand(cmd, false, val || null);
        scheduleAutoSave();
    }

    // ── Page render ──────────────────────────────────────────────────────────
    function renderNotesPage() {
        ensureData();
        var container = document.getElementById('page-notes');
        if (!container) return;

        var notes = app.data.notes;
        var q = _search.toLowerCase();
        var filtered = q ? notes.filter(function(n) {
            return (n.title||'').toLowerCase().includes(q) || (n.bodyText||'').toLowerCase().includes(q);
        }) : notes.slice();

        filtered.sort(function(a,b) {
            if (_sortMode === 'title')   return (a.title||'').localeCompare(b.title||'');
            if (_sortMode === 'created') return (b.createdAt||'') > (a.createdAt||'') ? 1 : -1;
            return (b.updatedAt||'') > (a.updatedAt||'') ? 1 : -1;
        });

        var pinned = filtered.filter(function(n){ return n.pinned; });
        var rest   = filtered.filter(function(n){ return !n.pinned; });

        var sortHtml = ['updated','created','title'].map(function(s){
            return '<option value="' + s + '"' + (_sortMode===s?' selected':'') + '>' +
                (s==='updated'?'Last modified':s==='created'?'Date created':'Title A–Z') + '</option>';
        }).join('');

        var bodyHtml = '';
        if (!notes.length) {
            bodyHtml = '<div class="empty-state" style="margin-top:80px"><p>No notes yet.</p><button class="btn btn-primary" onclick="window._notes.openEditor(null)">Create your first note</button></div>';
        } else if (!filtered.length) {
            bodyHtml = '<div class="empty-state" style="margin-top:80px"><p>No notes match "<strong>' + escapeHtml(_search) + '</strong>"</p></div>';
        } else {
            if (pinned.length) bodyHtml += '<div class="notes-section-label">Pinned</div><div class="notes-grid">' + pinned.map(renderCard).join('') + '</div>';
            if (rest.length) {
                if (pinned.length) bodyHtml += '<div class="notes-section-label" style="margin-top:28px">Notes</div>';
                bodyHtml += '<div class="notes-grid">' + rest.map(renderCard).join('') + '</div>';
            }
        }

        container.innerHTML = '<header class="page-header"><h1>Notes</h1>'
            + '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">'
            + '<input type="text" class="form-control notes-search-input" id="notes-search" placeholder="Search notes…" value="' + escapeHtml(_search) + '" oninput="window._notes.setSearch(this.value)">'
            + '<select class="form-control" style="width:auto" onchange="window._notes.setSort(this.value)">' + sortHtml + '</select>'
            + '<button class="btn btn-primary" onclick="window._notes.openEditor(null)">+ New Note</button>'
            + '</div></header>'
            + '<div class="notes-count-bar">' + notes.length + ' note' + (notes.length!==1?'s':'')
            + (q?' &nbsp;·&nbsp; ' + filtered.length + ' matching "<strong>' + escapeHtml(_search) + '</strong>"':'')
            + (pinned.length?' &nbsp;·&nbsp; ' + pinned.length + ' pinned':'')
            + '</div>' + bodyHtml;

        if (_search) {
            var el = document.getElementById('notes-search');
            if (el) { el.focus(); el.setSelectionRange(_search.length,_search.length); }
        }
    }

    function renderCard(note) {
        var colorObj = NOTE_COLORS.find(function(c){ return c.key===note.color; }) || NOTE_COLORS[0];
        var borderColor = colorObj.hex || 'var(--border)';
        var preview = (note.bodyText||'').trim().slice(0,160);
        var updated = note.updatedAt ? new Date(note.updatedAt) : null;
        var dateStr = updated ? updated.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '';
        return '<div class="note-card" style="border-left:4px solid ' + borderColor + '" onclick="window._notes.openEditor(\'' + note.id + '\')">'
            + '<div class="note-card-header"><div class="note-card-title">' + escapeHtml(note.title||'Untitled') + '</div>'
            + (note.pinned?'<span class="note-pin-indicator" title="Pinned">*</span>':'')
            + '</div>'
            + (preview?'<div class="note-card-preview">' + escapeHtml(preview) + '</div>':'<div class="note-card-preview note-card-empty">Empty note</div>')
            + '<div class="note-card-meta">' + dateStr + '</div>'
            + '</div>';
    }

    // ── Editor ───────────────────────────────────────────────────────────────
    function openEditor(noteId) {
        ensureData();
        var note, focusTitle = false;
        if (noteId) {
            note = app.data.notes.find(function(n){ return n.id===noteId; });
            if (!note) return;
        } else {
            note = { id:generateId(), title:'', body:'', bodyText:'', color:'none', pinned:false,
                     createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
            app.data.notes.unshift(note);
            saveData();
            focusTitle = true;
        }
        _editNoteId = note.id;

        // Note label color dots
        var colorDotsHtml = NOTE_COLORS.map(function(c){
            return '<button class="note-color-dot' + (note.color===c.key?' active':'') + '" title="' + c.label + '"'
                + ' style="' + (c.hex?'background:'+c.hex:'background:var(--surface-3);border:1px solid var(--muted)') + '"'
                + ' onmousedown="event.preventDefault()" onclick="window._notes.setColor(\'' + c.key + '\')"></button>';
        }).join('');

        // Highlight swatches
        var hlSwatches = HIGHLIGHT_COLORS.map(function(h){
            return '<span class="notes-hl-swatch" title="' + h.label + '" style="background:' + h.color + '"'
                + ' onmousedown="event.preventDefault();window._notes._applyHl(\'' + h.color + '\')"></span>';
        }).join('');
        var hlRemove = '<span class="notes-hl-swatch notes-hl-remove" title="Remove highlight"'
            + ' onmousedown="event.preventDefault();window._notes._applyHl(\'transparent\')">x</span>';

        // Text color swatches
        var tcSwatches = TEXT_COLORS.map(function(c){
            return '<span class="re-color-swatch" title="' + c + '" style="background:' + c + '"'
                + ' onmousedown="event.preventDefault();window._notes._applyTc(\'' + c + '\')"></span>';
        }).join('');

        var html = '<div class="modal-overlay" id="notesEditorModal" onclick="if(event.target===this)window._notes.closeEditor()">'
            + '<div class="modal notes-editor-modal">'

            // Top bar
            + '<div class="notes-editor-topbar">'
            + '<input type="text" id="note-title-input" class="notes-title-input" placeholder="Untitled note…" value="' + escapeHtml(note.title||'') + '" oninput="window._notes.scheduleAutoSave()">'
            + '<div class="notes-editor-actions">'
            + '<div class="note-color-picker">' + colorDotsHtml + '</div>'
            + '<button class="btn btn-secondary btn-small note-pin-btn' + (note.pinned?' active':'') + '" id="note-pin-btn" onmousedown="event.preventDefault()" onclick="window._notes.togglePin()">' + (note.pinned?'Pinned':'Pin') + '</button>'
            + '<button class="btn btn-secondary btn-small" style="color:#ff6b6b" onmousedown="event.preventDefault()" onclick="window._notes.deleteNote()" title="Delete">Delete</button>'
            + '<button class="modal-close" onclick="window._notes.closeEditor()">×</button>'
            + '</div></div>'

            // Toolbar
            + '<div class="notes-toolbar" id="notes-toolbar" onmousedown="return window._notes._tbMousedown(event)">'

            // Undo / Redo
            + '<button class="ntb-btn" data-cmd="undo" title="Undo (Ctrl+Z)">Undo</button>'
            + '<button class="ntb-btn" data-cmd="redo" title="Redo (Ctrl+Y)">↪</button>'
            + '<div class="ntb-sep"></div>'

            // Block format
            + '<select class="ntb-select" id="ntb-format" title="Paragraph style"'
            + ' onmousedown="event.stopPropagation()" onchange="window._notes._applyBlock(this.value)">'
            + '<option value="p">Normal</option>'
            + '<option value="h1">Heading 1</option>'
            + '<option value="h2">Heading 2</option>'
            + '<option value="h3">Heading 3</option>'
            + '<option value="blockquote">Quote</option>'
            + '<option value="pre">Code</option>'
            + '</select>'
            + '<div class="ntb-sep"></div>'

            // Inline formatting
            + '<button class="ntb-btn" data-cmd="bold"          title="Bold (Ctrl+B)"><b>B</b></button>'
            + '<button class="ntb-btn" data-cmd="italic"        title="Italic (Ctrl+I)"><i>I</i></button>'
            + '<button class="ntb-btn" data-cmd="underline"     title="Underline (Ctrl+U)"><u>U</u></button>'
            + '<button class="ntb-btn" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>'
            + '<div class="ntb-sep"></div>'

            // Highlight
            + '<div class="ntb-dropdown-wrap" id="ntb-hl-wrap">'
            + '<button class="ntb-btn ntb-hl-btn" title="Highlight" onmousedown="event.preventDefault();event.stopPropagation();window._notes._toggleHlPicker()">'
            + '<span class="ntb-hl-preview" id="ntb-hl-preview">ab</span>'
            + '</button>'
            + '<div class="ntb-dropdown ntb-hl-dropdown" id="ntb-hl-dropdown">'
            + '<div class="ntb-dropdown-row">' + hlSwatches + hlRemove + '</div>'
            + '</div>'
            + '</div>'

            // Text color
            + '<div class="ntb-dropdown-wrap" id="ntb-tc-wrap">'
            + '<button class="ntb-btn" title="Text color" onmousedown="event.preventDefault();event.stopPropagation();window._notes._toggleTcPicker()">'
            + '<span class="ntb-tc-preview" id="ntb-tc-preview" style="color:#fff">A</span>&#9660;</button>'
            + '<div class="ntb-dropdown" id="ntb-tc-dropdown">'
            + '<div class="re-color-grid">' + tcSwatches + '</div>'
            + '<div style="display:flex;gap:6px;align-items:center;margin-top:6px;padding-top:6px;border-top:1px solid #333">'
            + '<label style="font-size:11px;color:#aaa;white-space:nowrap">Custom:</label>'
            + '<input type="color" id="ntb-tc-custom" value="#ffffff" style="width:36px;height:24px;padding:1px;border:1px solid #444;border-radius:3px;background:none;cursor:pointer">'
            + '<button class="ntb-btn" style="font-size:11px;padding:2px 8px" onmousedown="event.preventDefault()" onclick="window._notes._applyTcCustom()">Apply</button>'
            + '</div></div></div>'
            + '<div class="ntb-sep"></div>'

            // Lists
            + '<button class="ntb-btn" data-cmd="insertUnorderedList" title="Bullet list">• List</button>'
            + '<button class="ntb-btn" data-cmd="insertOrderedList"   title="Numbered list">1. List</button>'
            + '<button class="ntb-btn" data-cmd-custom="checklist"    title="Checklist">Check</button>'
            + '<div class="ntb-sep"></div>'

            // Indent
            + '<button class="ntb-btn" data-cmd="indent"  title="Indent (Tab)">⇥</button>'
            + '<button class="ntb-btn" data-cmd="outdent" title="Outdent (Shift+Tab)">⇤</button>'
            + '<div class="ntb-sep"></div>'

            // Align
            + '<button class="ntb-btn" data-cmd="justifyLeft"   title="Align left">L</button>'
            + '<button class="ntb-btn" data-cmd="justifyCenter" title="Center">C</button>'
            + '<button class="ntb-btn" data-cmd="justifyRight"  title="Align right">R</button>'
            + '<div class="ntb-sep"></div>'

            // Misc
            + '<button class="ntb-btn" data-cmd-custom="hr"     title="Insert divider">— HR</button>'
            + '<button class="ntb-btn" data-cmd-custom="link"   title="Insert link (Ctrl+K)">Link</button>'
            + '<button class="ntb-btn" data-cmd="removeFormat"  title="Clear formatting">Tx</button>'
            + '</div>'

            // Body
            + '<div class="notes-editor-body" id="note-body-editor" contenteditable="true" spellcheck="true" oninput="window._notes.scheduleAutoSave()">' + (note.body||'') + '</div>'

            // Footer
            + '<div class="notes-editor-footer">'
            + '<span id="note-save-status" class="note-save-status">All changes saved</span>'
            + '<span id="notes-word-count" class="note-meta-info"></span>'
            + '<span class="note-meta-info">Created ' + (note.createdAt?new Date(note.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'today') + '</span>'
            + '</div>'
            + '</div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
        updateWordCount();

        var bodyEl = document.getElementById('note-body-editor');

        // Tab key
        bodyEl.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                editorExec(e.shiftKey ? 'outdent' : 'indent');
            }
            // Ctrl+K = insert link
            if ((e.ctrlKey||e.metaKey) && e.key === 'k') {
                e.preventDefault();
                _insertLink();
            }
        });

        // Track format state to update toolbar active states & block format selector
        bodyEl.addEventListener('keyup', updateToolbarState);
        bodyEl.addEventListener('mouseup', updateToolbarState);
        bodyEl.addEventListener('input', function() { updateWordCount(); updateToolbarState(); });

        // Close dropdowns on outside click
        document.addEventListener('mousedown', _onOutsideClick, true);

        if (focusTitle) {
            document.getElementById('note-title-input').focus();
        } else {
            bodyEl.focus();
            var range = document.createRange();
            var sel = window.getSelection();
            range.selectNodeContents(bodyEl);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    // Central toolbar mousedown handler — prevents focus loss on all buttons
    function _tbMousedown(e) {
        var btn = e.target.closest('[data-cmd]');
        var customBtn = e.target.closest('[data-cmd-custom]');
        if (!btn && !customBtn) return; // dropdowns handle themselves
        e.preventDefault(); // KEY FIX: don't let the editor lose focus

        var editor = document.getElementById('note-body-editor');
        if (!editor) return;
        editor.focus();

        if (customBtn) {
            var customCmd = customBtn.getAttribute('data-cmd-custom');
            if (customCmd === 'checklist') _insertChecklist();
            if (customCmd === 'hr')        _insertHR();
            if (customCmd === 'link')      _insertLink();
            scheduleAutoSave();
            return;
        }

        var cmd = btn.getAttribute('data-cmd');
        try { document.execCommand('styleWithCSS', false, true); } catch(ex){}
        document.execCommand(cmd, false, null);
        scheduleAutoSave();
        updateToolbarState();
    }

    function _applyBlock(tag) {
        var editor = document.getElementById('note-body-editor');
        if (!editor) return;
        editor.focus();
        document.execCommand('formatBlock', false, tag);
        scheduleAutoSave();
    }

    function _applyHl(color) {
        var editor = document.getElementById('note-body-editor');
        if (!editor) return;
        restoreSelection();
        editor.focus();
        try {
            document.execCommand('styleWithCSS', false, true);
            document.execCommand('hiliteColor', false, color);
        } catch(e) {
            document.execCommand('backColor', false, color);
        }
        // Update preview
        var prev = document.getElementById('ntb-hl-preview');
        if (prev) prev.style.background = color === 'transparent' ? '' : color;
        _closeDropdowns();
        scheduleAutoSave();
    }

    function _toggleHlPicker() {
        saveSelection();
        var dd = document.getElementById('ntb-hl-dropdown');
        if (!dd) return;
        var isOpen = dd.classList.contains('open');
        _closeDropdowns();
        if (!isOpen) dd.classList.add('open');
    }

    function _toggleTcPicker() {
        saveSelection();
        var dd = document.getElementById('ntb-tc-dropdown');
        if (!dd) return;
        var isOpen = dd.classList.contains('open');
        _closeDropdowns();
        if (!isOpen) dd.classList.add('open');
    }

    function _applyTc(color) {
        var editor = document.getElementById('note-body-editor');
        if (!editor) return;
        restoreSelection();
        editor.focus();
        try { document.execCommand('styleWithCSS', false, true); } catch(e){}
        document.execCommand('foreColor', false, color);
        var prev = document.getElementById('ntb-tc-preview');
        if (prev) prev.style.color = color;
        _closeDropdowns();
        scheduleAutoSave();
    }

    function _applyTcCustom() {
        var input = document.getElementById('ntb-tc-custom');
        if (input) _applyTc(input.value);
    }

    function _closeDropdowns() {
        ['ntb-hl-dropdown','ntb-tc-dropdown'].forEach(function(id){
            var el = document.getElementById(id);
            if (el) el.classList.remove('open');
        });
    }

    function _onOutsideClick(e) {
        var hlWrap = document.getElementById('ntb-hl-wrap');
        var tcWrap = document.getElementById('ntb-tc-wrap');
        if (hlWrap && !hlWrap.contains(e.target)) {
            var dd = document.getElementById('ntb-hl-dropdown');
            if (dd) dd.classList.remove('open');
        }
        if (tcWrap && !tcWrap.contains(e.target)) {
            var dd2 = document.getElementById('ntb-tc-dropdown');
            if (dd2) dd2.classList.remove('open');
        }
    }

    function _insertChecklist() {
        var editor = document.getElementById('note-body-editor');
        if (!editor) return;
        editor.focus();
        // Insert a checkbox list item using a div with checkbox
        var html = '<div><input type="checkbox" style="margin-right:6px;accent-color:var(--accent)">&nbsp;</div>';
        document.execCommand('insertHTML', false, html);
        scheduleAutoSave();
    }

    function _insertHR() {
        document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid var(--border);margin:12px 0">');
        scheduleAutoSave();
    }

    function _insertLink() {
        var url = prompt('Enter URL:', 'https://');
        if (!url) return;
        var text = window.getSelection().toString() || url;
        document.execCommand('insertHTML', false, '<a href="' + escapeHtml(url) + '" target="_blank" style="color:var(--accent)">' + escapeHtml(text) + '</a>');
        scheduleAutoSave();
    }

    function updateToolbarState() {
        var cmds = ['bold','italic','underline','strikeThrough','insertUnorderedList','insertOrderedList','justifyLeft','justifyCenter','justifyRight'];
        cmds.forEach(function(cmd) {
            var btn = document.querySelector('.notes-toolbar [data-cmd="' + cmd + '"]');
            if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
        });
        // Update block format selector
        var sel = document.getElementById('ntb-format');
        if (sel) {
            try {
                var val = document.queryCommandValue('formatBlock').toLowerCase().replace(/[<>]/g,'');
                var map = { h1:'h1', h2:'h2', h3:'h3', blockquote:'blockquote', pre:'pre' };
                sel.value = map[val] || 'p';
            } catch(e) {}
        }
        updateWordCount();
    }

    function updateWordCount() {
        var el = document.getElementById('note-body-editor');
        var counter = document.getElementById('notes-word-count');
        if (!el || !counter) return;
        var text = (el.innerText || el.textContent || '').trim();
        var words = text ? text.split(/\s+/).filter(Boolean).length : 0;
        counter.textContent = words + ' word' + (words!==1?'s':'');
    }

    // ── Save / close ─────────────────────────────────────────────────────────
    function scheduleAutoSave() {
        var statusEl = document.getElementById('note-save-status');
        if (statusEl) statusEl.textContent = 'Saving…';
        if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
        _autoSaveTimer = setTimeout(function() {
            _doSave();
            var el = document.getElementById('note-save-status');
            if (el) el.textContent = 'Saved';
        }, 600);
    }

    function _doSave() {
        if (!_editNoteId) return;
        ensureData();
        var note = app.data.notes.find(function(n){ return n.id===_editNoteId; });
        if (!note) return;
        var titleEl = document.getElementById('note-title-input');
        var bodyEl  = document.getElementById('note-body-editor');
        if (!titleEl || !bodyEl) return;
        note.title    = titleEl.value.trim();
        note.body     = bodyEl.innerHTML;
        note.bodyText = bodyEl.innerText || bodyEl.textContent || '';
        note.updatedAt = new Date().toISOString();
        saveData();
    }

    function closeEditor() {
        if (_autoSaveTimer) { clearTimeout(_autoSaveTimer); _autoSaveTimer = null; }
        _doSave();
        document.removeEventListener('mousedown', _onOutsideClick, true);
        var modal = document.getElementById('notesEditorModal');
        if (modal) modal.remove();
        _editNoteId = null;
        _savedSel = null;
        renderNotesPage();
    }

    // ── Note actions ─────────────────────────────────────────────────────────
    function setColor(colorKey) {
        if (!_editNoteId) return;
        _doSave();
        var note = app.data.notes.find(function(n){ return n.id===_editNoteId; });
        if (!note) return;
        note.color = colorKey;
        saveData();
        document.querySelectorAll('.note-color-dot').forEach(function(btn, i) {
            btn.classList.toggle('active', NOTE_COLORS[i] && NOTE_COLORS[i].key === colorKey);
        });
    }

    function togglePin() {
        if (!_editNoteId) return;
        _doSave();
        var note = app.data.notes.find(function(n){ return n.id===_editNoteId; });
        if (!note) return;
        note.pinned = !note.pinned;
        saveData();
        var btn = document.getElementById('note-pin-btn');
        if (btn) { btn.textContent = note.pinned?'Pinned':'Pin'; btn.classList.toggle('active',note.pinned); }
        showToast(note.pinned?'Note pinned':'Note unpinned');
    }

    function deleteNote() {
        if (!_editNoteId) return;
        if (!confirm('Delete this note? This cannot be undone.')) return;
        ensureData();
        app.data.notes = app.data.notes.filter(function(n){ return n.id!==_editNoteId; });
        saveData();
        var modal = document.getElementById('notesEditorModal');
        if (modal) modal.remove();
        _editNoteId = null;
        renderNotesPage();
        showToast('Note deleted');
    }

    function setSearch(val) { _search = val; renderNotesPage(); }
    function setSort(val)   { _sortMode = val; renderNotesPage(); }

    // ── Public API ───────────────────────────────────────────────────────────
    window._notes = {
        openEditor:       openEditor,
        closeEditor:      closeEditor,
        scheduleAutoSave: scheduleAutoSave,
        setColor:         setColor,
        togglePin:        togglePin,
        deleteNote:       deleteNote,
        setSearch:        setSearch,
        setSort:          setSort,
        _tbMousedown:     _tbMousedown,
        _applyBlock:      _applyBlock,
        _applyHl:         _applyHl,
        _toggleHlPicker:  _toggleHlPicker,
        _toggleTcPicker:  _toggleTcPicker,
        _applyTc:         _applyTc,
        _applyTcCustom:   _applyTcCustom,
        // Legacy aliases kept for any external callers
        applyTextColor:       _applyTc,
        toggleTextColorPicker: _toggleTcPicker,
        applyCustomTextColor:  _applyTcCustom
    };

})();
