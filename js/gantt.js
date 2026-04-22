/* =========================
   js/gantt.js  v1
   Project Gantt Chart View
   ========================= */

(function() {
    'use strict';

    let _active = false;
    let _listenersAttached = false;

    const PHASE_COLORS = {
        'New':     '#6b7280',
        'Define':  '#3b82f6',
        'Measure': '#8b5cf6',
        'Analyze': '#f59e0b',
        'Improve': '#7aaae4',
        'Control': '#4a8fc7',
        'Closed':  '#4b5563'
    };

    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ─── Filter helpers (mirrors renderProjects logic) ────────────────────────

    function getFilteredProjects() {
        const search  = (document.getElementById('project-search')?.value || '').toLowerCase();
        const area    = document.getElementById('project-area-filter')?.value || '';
        const status  = document.getElementById('project-status-filter')?.value || '';
        const health  = document.getElementById('project-health-filter')?.value || '';
        const product = document.getElementById('project-product-filter')?.value || '';

        return (app.data.projects || []).filter(p => {
            if (search && !p.title.toLowerCase().includes(search) &&
                !(p.problemStatement || '').toLowerCase().includes(search)) return false;
            if (area   && p.area   !== area)   return false;
            if (status && p.status !== status) return false;
            if (health && p.health !== health) return false;
            if (product && !(p.productIds || []).includes(product)) return false;
            return true;
        });
    }

    // ─── Lazy filter listener registration ───────────────────────────────────

    function attachFilterListeners() {
        if (_listenersAttached) return;
        _listenersAttached = true;
        const ids = ['project-search','project-area-filter','project-status-filter',
                     'project-health-filter','project-product-filter'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener(id === 'project-search' ? 'input' : 'change', () => {
                    if (_active) renderGanttView();
                });
            }
        });
    }

    // ─── View switcher ────────────────────────────────────────────────────────

    function switchProjectView(view) {
        _active = (view === 'gantt');

        document.querySelectorAll('.project-view-tab').forEach(b => {
            b.classList.toggle('active', b.dataset.view === view);
        });

        const listEl  = document.getElementById('project-list');
        const ganttEl = document.getElementById('gantt-container');
        if (listEl)  listEl.style.display  = _active ? 'none' : '';
        if (ganttEl) ganttEl.style.display = _active ? ''     : 'none';

        if (_active) {
            attachFilterListeners();
            renderGanttView();
        } else {
            if (typeof renderProjects === 'function') renderProjects();
        }
    }

    // ─── Main render ──────────────────────────────────────────────────────────

    function renderGanttView() {
        const container = document.getElementById('gantt-container');
        if (!container) return;

        const projects = getFilteredProjects();
        if (projects.length === 0) {
            container.innerHTML = '<div class="gantt-empty">No projects match the current filters.</div>';
            return;
        }

        const today = new Date(); today.setHours(0,0,0,0);

        // ── Determine date range ──
        let rangeStart = new Date(today);
        let rangeEnd   = new Date(today);

        projects.forEach(p => {
            if (p.startDate) {
                const d = new Date(p.startDate);
                if (d < rangeStart) rangeStart = d;
            }
            if (p.dueDate) {
                const d = new Date(p.dueDate);
                if (d > rangeEnd) rangeEnd = d;
            }
            // Also include action due dates
            (p.actions || []).forEach(a => {
                if (a.dueDate) {
                    const d = new Date(a.dueDate);
                    if (d > rangeEnd) rangeEnd = d;
                }
            });
        });

        // Pad ~14 days each side then snap to month boundaries
        rangeStart = new Date(rangeStart.getTime() - 14 * 86400000);
        rangeEnd   = new Date(rangeEnd.getTime()   + 14 * 86400000);
        rangeStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
        rangeEnd   = new Date(rangeEnd.getFullYear(),   rangeEnd.getMonth() + 1, 0);

        const totalMs = rangeEnd - rangeStart;

        function toPct(dateStr) {
            const ms = new Date(dateStr) - rangeStart;
            return Math.max(0, Math.min(100, ms / totalMs * 100));
        }

        const todayPct = (today - rangeStart) / totalMs * 100;

        // ── Month header ──
        const monthHeader = buildMonthHeader(rangeStart, rangeEnd, totalMs);

        // ── Legend ──
        const legend = Object.entries(PHASE_COLORS).map(([phase, color]) =>
            `<span class="gantt-legend-chip" style="border-color:${color};">${phase}</span>`
        ).join('');

        // ── Rows ──
        const rows = projects.map(p => renderRow(p, today, toPct, todayPct)).join('');

        container.innerHTML = `
            <div class="gantt-legend">${legend}</div>
            <div class="gantt-wrap">
                <div class="gantt-header-row">
                    <div class="gantt-label gantt-header-label">
                        ${projects.length} project${projects.length !== 1 ? 's' : ''}
                    </div>
                    <div class="gantt-track gantt-track-header">
                        ${monthHeader}
                        <div class="gantt-today-line" style="left:${todayPct.toFixed(2)}%;" title="Today"></div>
                    </div>
                </div>
                <div class="gantt-body">${rows}</div>
            </div>`;
    }

    function renderRow(p, today, toPct, todayPct) {
        const start = p.startDate ? new Date(p.startDate) : new Date(today);
        const end   = p.dueDate   ? new Date(p.dueDate)   : new Date(start.getTime() + 30 * 86400000);

        const leftPct  = toPct(start);
        const rightPct = toPct(end);
        const widthPct = Math.max(0.4, rightPct - leftPct);

        const color       = PHASE_COLORS[p.status] || '#6b7280';
        const healthColor = p.health === 'On Track' ? '#7aaae4' :
                            p.health === 'At Risk'   ? '#f59e0b' : '#ef4444';
        const overdue = p.dueDate && end < today && p.status !== 'Closed';

        // Progress fill (done actions %)
        const totalActions = (p.actions || []).length;
        const doneActions  = (p.actions || []).filter(a => a.status === 'Done').length;
        const pctDone = totalActions > 0 ? Math.round(doneActions / totalActions * 100) : 0;

        // Action milestones (open actions with due dates)
        const milestones = (p.actions || [])
            .filter(a => a.dueDate && a.status !== 'Done')
            .map(a => {
                const ap = toPct(a.dueDate).toFixed(2);
                const aOverdue = new Date(a.dueDate) < today;
                return `<div class="gantt-milestone${aOverdue ? ' gantt-milestone-overdue' : ''}"
                             style="left:${ap}%"
                             title="${escapeHtml(a.text)} · due ${a.dueDate}${aOverdue ? ' (overdue)' : ''}"></div>`;
            }).join('');

        const barLabel = p.status + (pctDone > 0 ? ` · ${pctDone}%` : '');
        const dateRange = (p.startDate || '?') + ' → ' + (p.dueDate || '?');

        return `
            <div class="gantt-row" onclick="showProjectDetailModal('${p.id}')" title="${escapeHtml(p.title)}">
                <div class="gantt-label">
                    <div class="gantt-label-title">${escapeHtml(p.title)}</div>
                    <div class="gantt-label-meta">${escapeHtml(p.area)} · ${escapeHtml(p.owner)}</div>
                </div>
                <div class="gantt-track">
                    <div class="gantt-bar${overdue ? ' gantt-bar-overdue' : ''}"
                         style="left:${leftPct.toFixed(2)}%;width:${widthPct.toFixed(2)}%;
                                background:${color};border-left:3px solid ${healthColor};"
                         title="${escapeHtml(p.title)} · ${dateRange}">
                        <div class="gantt-bar-progress" style="width:${pctDone}%"></div>
                        <span class="gantt-bar-label">${escapeHtml(barLabel)}</span>
                    </div>
                    ${milestones}
                    <div class="gantt-today-line" style="left:${todayPct.toFixed(2)}%;"></div>
                </div>
            </div>`;
    }

    function buildMonthHeader(rangeStart, rangeEnd, totalMs) {
        const markers = [];
        const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
        while (d <= rangeEnd) {
            const pct = ((d - rangeStart) / totalMs * 100).toFixed(2);
            const label = MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
            markers.push(`<div class="gantt-month-label" style="left:${pct}%">${label}</div>`);
            d.setMonth(d.getMonth() + 1);
        }
        return markers.join('');
    }

    // ─── Expose ───────────────────────────────────────────────────────────────

    window.renderGanttView  = renderGanttView;
    app.switchProjectView   = switchProjectView;

})();
