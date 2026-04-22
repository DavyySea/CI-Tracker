/* =========================
   js/tickets.js
   Requests Inbox — CI Manager triage view
   ========================= */

(function () {
    'use strict';

    const STATUSES   = ['New', 'Reviewing', 'In Progress', 'Converted', 'Closed'];
    const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
    const CATEGORIES = [
        'Supply Chain Issue','Process Improvement','Cost Reduction',
        'Quality Issue','Supplier Concern','Data Request','General Request','Other'
    ];

    let _search         = '';
    let _statusFilter   = '';
    let _priorityFilter = '';
    let _sortMode       = 'submittedAt';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTicketsModule);
    } else {
        initTicketsModule();
    }

    function initTicketsModule() {
        const orig = window.renderCurrentPage;
        if (orig) {
            window.renderCurrentPage = function () {
                orig();
                if (app.currentPage === 'tickets') renderTicketsPage();
            };
        }
    }

    function ensure() {
        if (!app.data.tickets) app.data.tickets = [];
    }

    function escapeHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function displayDate(d) {
        if (!d) return '—';
        return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function priorityWeight(p) {
        return { Urgent: 4, High: 3, Medium: 2, Low: 1 }[p] || 0;
    }

    function priClass(p) {
        return { Low: 'priority-low', Medium: 'priority-med', High: 'priority-high', Urgent: 'priority-urgent' }[p] || 'priority-med';
    }

    function removeModal(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // ─── Page Render ──────────────────────────────────────────────────────────

    function renderTicketsPage() {
        ensure();
        const container = document.getElementById('page-tickets');
        if (!container) return;

        const tickets = app.data.tickets;
        const q = _search.toLowerCase();

        let filtered = tickets.filter(function (t) {
            if (q && !(
                (t.ticketNumber || '').toLowerCase().includes(q) ||
                (t.title        || '').toLowerCase().includes(q) ||
                (t.requesterName|| '').toLowerCase().includes(q) ||
                (t.description  || '').toLowerCase().includes(q) ||
                (t.category     || '').toLowerCase().includes(q)
            )) return false;
            if (_statusFilter   && t.status   !== _statusFilter)   return false;
            if (_priorityFilter && t.priority !== _priorityFilter) return false;
            return true;
        });

        filtered.sort(function (a, b) {
            if (_sortMode === 'priority') return priorityWeight(b.priority) - priorityWeight(a.priority);
            if (_sortMode === 'dueDate') {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);
            }
            return (b.submittedAt || '') > (a.submittedAt || '') ? 1 : -1;
        });

        const counts = {};
        STATUSES.forEach(function (s) { counts[s] = 0; });
        tickets.forEach(function (t) { if (counts[t.status] !== undefined) counts[t.status]++; });
        const newCount = counts['New'] || 0;
        const total = tickets.length;

        // ── Stats strip ──
        const statsHtml = '<div class="ticket-stats-strip">' +
            STATUSES.map(function (s) {
                return '<div class="ticket-stat-card' + (s === 'New' && counts[s] > 0 ? ' ticket-stat-new' : '') +
                    '" onclick="window._tickets.setFilter(\'status\',\'' + s + '\')">' +
                    '<div class="ticket-stat-num">' + counts[s] + '</div>' +
                    '<div class="ticket-stat-label">' + s + '</div>' +
                    '</div>';
            }).join('') +
            '</div>';

        // ── Filters ──
        const statusOpts = [''].concat(STATUSES).map(function (s) {
            return '<option value="' + s + '"' + (_statusFilter === s ? ' selected' : '') + '>' + (s || 'All Statuses') + '</option>';
        }).join('');
        const priOpts = [''].concat(PRIORITIES).map(function (p) {
            return '<option value="' + p + '"' + (_priorityFilter === p ? ' selected' : '') + '>' + (p || 'All Priorities') + '</option>';
        }).join('');
        const sortOpts = [['submittedAt','Newest first'],['priority','Priority'],['dueDate','Due date']].map(function (pair) {
            return '<option value="' + pair[0] + '"' + (_sortMode === pair[0] ? ' selected' : '') + '>' + pair[1] + '</option>';
        }).join('');

        const filtersHtml = '<div class="filters-bar">' +
            '<input type="text" class="search-input" id="ticket-search" placeholder="Search tickets…"' +
            ' value="' + escapeHtml(_search) + '" oninput="window._tickets.setSearch(this.value)" style="max-width:260px;">' +
            '<select class="filter-select" onchange="window._tickets.setFilter(\'status\',this.value)">' + statusOpts + '</select>' +
            '<select class="filter-select" onchange="window._tickets.setFilter(\'priority\',this.value)">' + priOpts + '</select>' +
            '<select class="filter-select" onchange="window._tickets.setSort(this.value)">' + sortOpts + '</select>' +
            (_search || _statusFilter || _priorityFilter ? '<button class="btn btn-secondary" onclick="window._tickets.clearFilters()">Clear</button>' : '') +
            '</div>';

        // ── Table / empty state ──
        let bodyHtml;
        if (total === 0) {
            bodyHtml = '<div class="empty-state" style="margin-top:60px;">' +
                '<div class="empty-state-icon"></div>' +
                '<p>No requests yet. Share the <a href="submit.html" target="_blank" style="color:var(--accent);">submission form</a> with your team.</p>' +
                '<button class="btn btn-primary" style="margin-top:12px;" onclick="window._tickets.showNewTicketModal()">+ Log a Request Manually</button>' +
                '</div>';
        } else if (filtered.length === 0) {
            bodyHtml = '<div class="empty-state" style="margin-top:60px;">' +
                '<div class="empty-state-icon"></div>' +
                '<p>No tickets match your filters.</p>' +
                '<button class="btn btn-secondary" onclick="window._tickets.clearFilters()">Clear filters</button>' +
                '</div>';
        } else {
            bodyHtml = '<div class="cost-table-wrap"><table class="cost-table">' +
                '<thead><tr>' +
                '<th>Ticket</th><th>Subject</th><th>Requester</th>' +
                '<th>Category</th><th>Priority</th><th>Status</th>' +
                '<th>Due</th><th>Submitted</th><th>Actions</th>' +
                '</tr></thead><tbody>' +
                filtered.map(renderRow).join('') +
                '</tbody></table></div>';
        }

        container.innerHTML =
            '<header class="page-header">' +
            '<div><h1>Requests Inbox</h1>' +
            '<p class="page-subtitle">' + total + ' request' + (total !== 1 ? 's' : '') + ' total' +
            (newCount > 0 ? ' &nbsp;·&nbsp; <strong style="color:var(--accent);">' + newCount + ' new</strong>' : '') +
            '</p></div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
            '<a href="submit.html" target="_blank" class="btn btn-secondary" style="text-decoration:none;">Share Form</a>' +
            '<button class="btn btn-primary" onclick="window._tickets.showNewTicketModal()">+ Log Request</button>' +
            '</div></header>' +
            statsHtml +
            filtersHtml +
            bodyHtml;

        if (_search) {
            const el = document.getElementById('ticket-search');
            if (el) { el.focus(); el.setSelectionRange(_search.length, _search.length); }
        }
    }

    function renderRow(t) {
        const overdue = t.dueDate && t.status !== 'Closed' && t.status !== 'Converted' && new Date(t.dueDate + 'T00:00:00') < new Date();
        const statusCls = {
            'New': 'ticket-status-new',
            'Reviewing': 'ticket-status-reviewing',
            'In Progress': 'ticket-status-inprogress',
            'Converted': 'ticket-status-converted',
            'Closed': 'ticket-status-closed'
        }[t.status] || '';

        return '<tr onclick="window._tickets.showDetail(\'' + t.id + '\')" style="cursor:pointer;">' +
            '<td><code class="ticket-num">' + escapeHtml(t.ticketNumber) + '</code></td>' +
            '<td>' + escapeHtml(t.title) + '</td>' +
            '<td>' + escapeHtml(t.requesterName) +
            (t.requesterEmail ? '<br><small style="color:var(--muted);">' + escapeHtml(t.requesterEmail) + '</small>' : '') +
            '</td>' +
            '<td>' + escapeHtml(t.category || '—') + '</td>' +
            '<td><span class="status-badge ' + priClass(t.priority) + '">' + escapeHtml(t.priority) + '</span></td>' +
            '<td><span class="ticket-status ' + statusCls + '">' + escapeHtml(t.status) + '</span></td>' +
            '<td style="' + (overdue ? 'color:#ff6b6b;font-weight:600;' : '') + '">' + displayDate(t.dueDate) + '</td>' +
            '<td>' + (t.submittedAt ? new Date(t.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—') + '</td>' +
            '<td onclick="event.stopPropagation();" style="white-space:nowrap;">' +
            (t.status !== 'Converted' && t.status !== 'Closed'
                ? '<button class="btn btn-small btn-secondary" onclick="window._tickets.convertToIssue(\'' + t.id + '\')" title="Convert to Issue" style="margin-right:4px;">→ Issue</button>'
                : '') +
            '<button class="btn btn-small btn-secondary" onclick="window._tickets.showDetail(\'' + t.id + '\')" title="View">⋯</button>' +
            '</td></tr>';
    }

    // ─── Detail Modal ─────────────────────────────────────────────────────────

    function showDetail(ticketId) {
        ensure();
        const t = app.data.tickets.find(function (x) { return x.id === ticketId; });
        if (!t) return;

        const linkedIssue = t.linkedIssueId && app.data.issues
            ? app.data.issues.find(function (i) { return i.id === t.linkedIssueId; })
            : null;

        const statusOpts = STATUSES.map(function (s) {
            return '<option value="' + s + '"' + (t.status === s ? ' selected' : '') + '>' + s + '</option>';
        }).join('');
        const priOpts = PRIORITIES.map(function (p) {
            return '<option value="' + p + '"' + (t.priority === p ? ' selected' : '') + '>' + p + '</option>';
        }).join('');

        const html = '<div class="modal-overlay" id="ticketDetailModal" onclick="if(event.target===this)window._tickets.closeDetail()">' +
            '<div class="modal" style="max-width:640px;width:100%;max-height:90vh;overflow-y:auto;">' +
            '<div class="modal-header">' +
            '<h3>' + escapeHtml(t.ticketNumber) + ' — ' + escapeHtml(t.title) + '</h3>' +
            '<button class="modal-close" onclick="window._tickets.closeDetail()">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
            '<div class="ticket-detail-meta">' +
            metaRow('From', escapeHtml(t.requesterName) + (t.requesterEmail ? ' &lt;' + escapeHtml(t.requesterEmail) + '&gt;' : '')) +
            metaRow('Submitted', t.submittedAt ? new Date(t.submittedAt).toLocaleString() : '—') +
            metaRow('Category', escapeHtml(t.category || '—')) +
            '<div class="ticket-meta-row"><span class="ticket-meta-label">Priority</span>' +
            '<select class="form-control" style="width:auto;padding:4px 8px;font-size:13px;" onchange="window._tickets.updateField(\'' + t.id + '\',\'priority\',this.value)">' + priOpts + '</select></div>' +
            '<div class="ticket-meta-row"><span class="ticket-meta-label">Status</span>' +
            '<select class="form-control" style="width:auto;padding:4px 8px;font-size:13px;" onchange="window._tickets.updateField(\'' + t.id + '\',\'status\',this.value)">' + statusOpts + '</select></div>' +
            '<div class="ticket-meta-row"><span class="ticket-meta-label">Needed By</span>' +
            '<input type="date" class="form-control" style="width:auto;padding:4px 8px;font-size:13px;" value="' + (t.dueDate || '') + '" onchange="window._tickets.updateField(\'' + t.id + '\',\'dueDate\',this.value)"></div>' +
            (linkedIssue ? metaRow('Linked Issue', '<span style="color:var(--accent);">' + escapeHtml(linkedIssue.title || 'Issue') + '</span>') : '') +
            '</div>' +
            '<div style="margin-top:16px;">' +
            '<label class="form-label">Description</label>' +
            '<div class="ticket-description-box">' + escapeHtml(t.description) + '</div>' +
            '</div>' +
            '<div style="margin-top:16px;">' +
            '<label class="form-label">CI Team Notes</label>' +
            '<textarea class="form-control" id="ticket-notes-ta" rows="3" placeholder="Internal notes (not visible to requester)…"' +
            ' onchange="window._tickets.updateField(\'' + t.id + '\',\'notes\',this.value)">' + escapeHtml(t.notes || '') + '</textarea>' +
            '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            (t.status !== 'Converted' && t.status !== 'Closed'
                ? '<button class="btn btn-primary" onclick="window._tickets.convertToIssue(\'' + t.id + '\')">→ Convert to Issue</button>'
                : '') +
            '<button class="btn btn-secondary" style="color:#ff6b6b;" onclick="window._tickets.deleteTicket(\'' + t.id + '\')">Delete</button>' +
            '</div>' +
            '<button class="btn btn-secondary" onclick="window._tickets.closeDetail()">Close</button>' +
            '</div>' +
            '</div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    }

    function metaRow(label, value) {
        return '<div class="ticket-meta-row"><span class="ticket-meta-label">' + label + '</span><span>' + value + '</span></div>';
    }

    function closeDetail() {
        removeModal('ticketDetailModal');
        renderTicketsPage();
    }

    // ─── New Ticket Modal ─────────────────────────────────────────────────────

    function showNewTicketModal() {
        ensure();
        const catOpts = CATEGORIES.map(function (c) {
            return '<option value="' + c + '">' + c + '</option>';
        }).join('');
        const priOpts = PRIORITIES.map(function (p) {
            return '<option value="' + p + '"' + (p === 'Medium' ? ' selected' : '') + '>' + p + '</option>';
        }).join('');

        const html = '<div class="modal-overlay" id="newTicketModal" onclick="if(event.target===this)window._tickets.closeNewTicket()">' +
            '<div class="modal" style="max-width:520px;width:100%;">' +
            '<div class="modal-header">' +
            '<h3>Log a Request</h3>' +
            '<button class="modal-close" onclick="window._tickets.closeNewTicket()">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
            '<div class="form-group"><label class="form-label">Requester Name <span style="color:var(--accent)">*</span></label>' +
            '<input type="text" class="form-control" id="ntm-name" placeholder="Jane Smith"></div>' +
            '<div class="form-group"><label class="form-label">Requester Email</label>' +
            '<input type="email" class="form-control" id="ntm-email" placeholder="jane@company.com"></div>' +
            '<div class="form-group"><label class="form-label">Subject <span style="color:var(--accent)">*</span></label>' +
            '<input type="text" class="form-control" id="ntm-title" placeholder="Brief description"></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
            '<div class="form-group"><label class="form-label">Category</label>' +
            '<select class="form-control" id="ntm-category">' + catOpts + '</select></div>' +
            '<div class="form-group"><label class="form-label">Priority</label>' +
            '<select class="form-control" id="ntm-priority">' + priOpts + '</select></div>' +
            '</div>' +
            '<div class="form-group"><label class="form-label">Needed By</label>' +
            '<input type="date" class="form-control" id="ntm-due"></div>' +
            '<div class="form-group"><label class="form-label">Description <span style="color:var(--accent)">*</span></label>' +
            '<textarea class="form-control" id="ntm-desc" rows="4" placeholder="Describe the issue or request…"></textarea></div>' +
            '<div id="ntm-error" style="color:#ff6b6b;font-size:12px;display:none;margin-top:4px;"></div>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button class="btn btn-secondary" onclick="window._tickets.closeNewTicket()">Cancel</button>' +
            '<button class="btn btn-primary" onclick="window._tickets.saveNewTicket()">Save Request</button>' +
            '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
        const el = document.getElementById('ntm-name');
        if (el) el.focus();
    }

    function closeNewTicket() {
        removeModal('newTicketModal');
    }

    function saveNewTicket() {
        const name  = (document.getElementById('ntm-name').value  || '').trim();
        const email = (document.getElementById('ntm-email').value || '').trim();
        const title = (document.getElementById('ntm-title').value || '').trim();
        const desc  = (document.getElementById('ntm-desc').value  || '').trim();
        const cat   = document.getElementById('ntm-category').value;
        const pri   = document.getElementById('ntm-priority').value;
        const due   = document.getElementById('ntm-due').value;
        const errEl = document.getElementById('ntm-error');

        if (!name || !title || !desc) {
            errEl.textContent = 'Please fill in Name, Subject, and Description.';
            errEl.style.display = 'block';
            return;
        }
        errEl.style.display = 'none';

        ensure();
        const num = getNextTicketNumber(app.data.tickets);
        app.data.tickets.push({
            id:             generateId(),
            ticketNumber:   num,
            title:          title,
            description:    desc,
            requesterName:  name,
            requesterEmail: email,
            category:       cat,
            priority:       pri,
            status:         'New',
            dueDate:        due || null,
            notes:          '',
            linkedIssueId:  null,
            submittedAt:    new Date().toISOString()
        });
        saveData();
        removeModal('newTicketModal');
        showToast('Request logged: ' + num);
        renderTicketsPage();
        if (typeof updateNavigationBadges === 'function') updateNavigationBadges();
    }

    // ─── Convert to Issue ─────────────────────────────────────────────────────

    function convertToIssue(ticketId) {
        ensure();
        const t = app.data.tickets.find(function (x) { return x.id === ticketId; });
        if (!t) return;
        if (t.status === 'Converted') { showToast('Already converted to an issue', 'error'); return; }

        removeModal('ticketDetailModal');

        const byLine = t.requesterName
            ? '\n\nSubmitted by: ' + t.requesterName + (t.requesterEmail ? ' <' + t.requesterEmail + '>' : '')
            : '';

        const issue = {
            id:                 generateId(),
            title:              t.title,
            description:        (t.description || '') + byLine,
            section:            categoryToSection(t.category),
            severity:           priorityToSeverity(t.priority),
            status:             'New',
            priority:           t.priority,
            owner:              '',
            supplier:           '',
            nextAction:         '',
            nextActionDueDate:  t.dueDate || '',
            rootCause:          '',
            resolution:         '',
            tags:               [],
            linkedTicketId:     t.id,
            createdAt:          new Date().toISOString(),
            updatedAt:          new Date().toISOString()
        };

        if (!app.data.issues) app.data.issues = [];
        app.data.issues.unshift(issue);

        t.status = 'Converted';
        t.linkedIssueId = issue.id;

        saveData();
        showToast('Converted to Issue: ' + issue.title);
        renderTicketsPage();
        if (typeof updateNavigationBadges === 'function') updateNavigationBadges();
    }

    function categoryToSection(cat) {
        var map = {
            'Supply Chain Issue':  'Procurement',
            'Process Improvement': 'Manufacturing',
            'Cost Reduction':      'Procurement',
            'Quality Issue':       'Quality',
            'Supplier Concern':    'Procurement',
            'Data Request':        'Planning',
            'General Request':     'Other',
            'Other':               'Other'
        };
        return map[cat] || 'Other';
    }

    function priorityToSeverity(p) {
        return { Urgent: 'Critical', High: 'High', Medium: 'Medium', Low: 'Low' }[p] || 'Medium';
    }

    // ─── Update Field ─────────────────────────────────────────────────────────

    function updateField(ticketId, field, value) {
        ensure();
        const t = app.data.tickets.find(function (x) { return x.id === ticketId; });
        if (!t) return;
        t[field] = value || null;
        if (field === 'notes') t[field] = value; // notes can be empty string
        saveData();
        if (field === 'status' || field === 'priority') {
            if (typeof updateNavigationBadges === 'function') updateNavigationBadges();
        }
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    function deleteTicket(ticketId) {
        if (!confirm('Delete this ticket? This cannot be undone.')) return;
        ensure();
        app.data.tickets = app.data.tickets.filter(function (x) { return x.id !== ticketId; });
        saveData();
        removeModal('ticketDetailModal');
        showToast('Ticket deleted');
        renderTicketsPage();
        if (typeof updateNavigationBadges === 'function') updateNavigationBadges();
    }

    // ─── Filters / Sort ───────────────────────────────────────────────────────

    function setSearch(val) { _search = val; renderTicketsPage(); }
    function setFilter(field, val) {
        if (field === 'status')   _statusFilter   = val;
        if (field === 'priority') _priorityFilter = val;
        renderTicketsPage();
    }
    function setSort(val) { _sortMode = val; renderTicketsPage(); }
    function clearFilters() { _search = ''; _statusFilter = ''; _priorityFilter = ''; renderTicketsPage(); }

    // ─── Ticket Number Generator ──────────────────────────────────────────────

    function getNextTicketNumber(tickets) {
        if (!tickets || tickets.length === 0) return 'TKT-001';
        var max = 0;
        tickets.forEach(function (t) {
            var m = (t.ticketNumber || '').match(/TKT-(\d+)/);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        return 'TKT-' + String(max + 1).padStart(3, '0');
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    window._tickets = {
        showNewTicketModal: showNewTicketModal,
        closeNewTicket:     closeNewTicket,
        saveNewTicket:      saveNewTicket,
        showDetail:         showDetail,
        closeDetail:        closeDetail,
        convertToIssue:     convertToIssue,
        updateField:        updateField,
        deleteTicket:       deleteTicket,
        setSearch:          setSearch,
        setFilter:          setFilter,
        setSort:            setSort,
        clearFilters:       clearFilters
    };

})();
