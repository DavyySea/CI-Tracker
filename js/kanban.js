/* =========================
   js/kanban.js
   Kanban Board Module
   ========================= */

(function() {
    'use strict';

    const PROJECT_COLS = ['Define','Measure','Analyze','Improve','Control','Closed'];
    const ACTION_COLS  = ['Open','In Progress','Blocked','Done'];

    let activeTab = 'projects';

    // ─── Public entry ────────────────────────────────────────────────────────

    function renderKanbanBoard() {
        setupKanbanFilters();
        updateOwnerFilter();
        renderBoard();
    }

    function switchKanbanTab(tab) {
        activeTab = tab;
        document.querySelectorAll('.kanban-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        const healthFilter = document.getElementById('kanban-health-filter');
        if (healthFilter) healthFilter.style.display = tab === 'projects' ? '' : 'none';
        renderBoard();
    }

    // ─── Filters ─────────────────────────────────────────────────────────────

    function getFilters() {
        return {
            search:  (document.getElementById('kanban-search')?.value || '').toLowerCase(),
            area:    document.getElementById('kanban-area-filter')?.value || '',
            owner:   document.getElementById('kanban-owner-filter')?.value || '',
            health:  document.getElementById('kanban-health-filter')?.value || '',
            overdue: document.getElementById('kanban-overdue-filter')?.checked || false
        };
    }

    function setupKanbanFilters() {
        const ids = ['kanban-search','kanban-area-filter','kanban-owner-filter',
                     'kanban-health-filter','kanban-overdue-filter'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el._kanbanListener) {
                el.addEventListener(id === 'kanban-search' ? 'input' : 'change', renderBoard);
                el._kanbanListener = true;
            }
        });
    }

    function updateOwnerFilter() {
        const sel = document.getElementById('kanban-owner-filter');
        if (!sel) return;
        const owners = new Set();
        (app.data.projects || []).forEach(p => { if (p.owner) owners.add(p.owner); });
        (app.data.projects || []).forEach(p =>
            (p.actions || []).forEach(a => { if (a.owner) owners.add(a.owner); })
        );
        const current = sel.value;
        sel.innerHTML = '<option value="">All Owners</option>';
        Array.from(owners).sort().forEach(o => {
            const opt = document.createElement('option');
            opt.value = o;
            opt.textContent = o;
            sel.appendChild(opt);
        });
        sel.value = current;
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    function renderBoard() {
        if (activeTab === 'projects') renderProjectsKanban();
        else renderActionsKanban();
    }

    function isOverdueDate(dateStr) {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date(new Date().toDateString());
    }

    function renderProjectsKanban() {
        const board = document.getElementById('kanban-board');
        if (!board) return;

        const f = getFilters();
        const projects = (app.data.projects || []).filter(p => {
            if (f.search && !p.title.toLowerCase().includes(f.search) &&
                !(p.owner || '').toLowerCase().includes(f.search)) return false;
            if (f.area && p.area !== f.area) return false;
            if (f.owner && p.owner !== f.owner) return false;
            if (f.health && p.health !== f.health) return false;
            if (f.overdue && !isOverdueDate(p.dueDate)) return false;
            return true;
        });

        const byStatus = {};
        PROJECT_COLS.forEach(c => byStatus[c] = []);
        projects.forEach(p => {
            const col = byStatus[p.status] ? p.status : 'Define';
            byStatus[col].push(p);
        });

        board.innerHTML = PROJECT_COLS.map(col => {
            const cards = byStatus[col];
            return `
                <div class="kanban-column">
                    <div class="kanban-column-header">
                        <span>${col}</span>
                        <span class="kanban-column-count">${cards.length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${cards.length === 0
                            ? '<div class="kanban-empty">No projects</div>'
                            : cards.map(renderProjectCard).join('')}
                    </div>
                </div>`;
        }).join('');
    }

    function renderProjectCard(p) {
        const overdue = isOverdueDate(p.dueDate);
        const healthClass = p.health === 'On Track' ? 'health-on-track' :
                            p.health === 'At Risk'   ? 'health-at-risk'  : 'health-off-track';
        const openActions = (p.actions || []).filter(a => a.status !== 'Done').length;
        const blockedActions = (p.actions || []).filter(a => a.status === 'Blocked').length;

        return `
            <div class="kanban-card${overdue ? ' overdue' : ''}"
                 onclick="app.viewProjectDetail && app.viewProjectDetail('${p.id}') || navigateToPage('projects')"
                 style="cursor:pointer; border-left:4px solid ${overdue ? 'var(--danger)' : 'var(--accent)'};">
                <div class="kanban-card-title">${escapeHtml(p.title)}</div>
                <div class="kanban-card-meta">
                    <span>${escapeHtml(p.area)}</span>
                    ${p.owner ? `<span>👤 ${escapeHtml(p.owner)}</span>` : ''}
                    ${p.dueDate ? `<span>📅 Due: ${p.dueDate}${overdue ? ' ⚠️' : ''}</span>` : ''}
                    ${openActions > 0 ? `<span>📋 ${openActions} open action${openActions !== 1 ? 's' : ''}${blockedActions > 0 ? ` (${blockedActions} blocked)` : ''}</span>` : ''}
                </div>
                <div class="kanban-card-badges">
                    <span class="health-badge ${healthClass}">${p.health}</span>
                    ${p.priority ? `<span class="priority-badge priority-${p.priority.toLowerCase()}">${p.priority}</span>` : ''}
                </div>
            </div>`;
    }

    function renderActionsKanban() {
        const board = document.getElementById('kanban-board');
        if (!board) return;

        const f = getFilters();

        // Collect all actions from projects
        const actions = [];
        (app.data.projects || []).forEach(p => {
            (p.actions || []).forEach(a => {
                actions.push({ ...a, projectTitle: p.title, projectArea: p.area, projectId: p.id });
            });
        });

        const filtered = actions.filter(a => {
            if (f.search && !a.text.toLowerCase().includes(f.search) &&
                !(a.owner || '').toLowerCase().includes(f.search)) return false;
            if (f.area && a.projectArea !== f.area) return false;
            if (f.owner && a.owner !== f.owner) return false;
            if (f.overdue && !isOverdueDate(a.dueDate)) return false;
            return true;
        });

        const byStatus = {};
        ACTION_COLS.forEach(c => byStatus[c] = []);
        filtered.forEach(a => {
            const col = byStatus[a.status] ? a.status : 'Open';
            byStatus[col].push(a);
        });

        board.innerHTML = ACTION_COLS.map(col => {
            const cards = byStatus[col];
            return `
                <div class="kanban-column">
                    <div class="kanban-column-header">
                        <span>${col}</span>
                        <span class="kanban-column-count">${cards.length}</span>
                    </div>
                    <div class="kanban-cards">
                        ${cards.length === 0
                            ? '<div class="kanban-empty">No actions</div>'
                            : cards.map(renderActionCard).join('')}
                    </div>
                </div>`;
        }).join('');
    }

    function renderActionCard(a) {
        const overdue = isOverdueDate(a.dueDate);
        return `
            <div class="kanban-card${overdue ? ' overdue' : ''}"
                 style="border-left:4px solid ${overdue ? 'var(--danger)' : 'var(--border-2)'};">
                <div class="kanban-card-title">${escapeHtml(a.text)}</div>
                <div class="kanban-card-meta">
                    <span>📋 ${escapeHtml(a.projectTitle)}</span>
                    ${a.owner ? `<span>👤 ${escapeHtml(a.owner)}</span>` : ''}
                    ${a.dueDate ? `<span>📅 Due: ${a.dueDate}${overdue ? ' ⚠️' : ''}</span>` : ''}
                    ${a.blockerNote ? `<span style="color:var(--danger)">🚫 ${escapeHtml(a.blockerNote)}</span>` : ''}
                </div>
            </div>`;
    }

    // ─── Expose ───────────────────────────────────────────────────────────────

    window.renderKanbanBoard = renderKanbanBoard;
    app.switchKanbanTab = switchKanbanTab;

})();
