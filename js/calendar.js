/* =========================
   js/calendar.js
   Full Calendar View
   ========================= */

(function() {
    'use strict';

    const MONTH_NAMES = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];
    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    const state = {
        year: new Date().getFullYear(),
        month: new Date().getMonth(), // 0-based
        selectedDate: null
    };

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ─── Collect Events from all data sources ────────────────────────────────

    function collectEvents() {
        const events = [];
        const data = app.data;

        // Meetings: meeting date + next meeting date + action items
        (data.meetings || []).forEach(m => {
            if (m.dateTime) {
                events.push({ type: 'meeting', date: m.dateTime,
                    label: `${m.area || 'Meeting'} CI Meeting`, area: m.area || '', ref: m });
            }
            if (m.nextMeetingDate) {
                events.push({ type: 'meeting', date: m.nextMeetingDate,
                    label: `Next: ${m.area || 'Meeting'} CI Meeting`, area: m.area || '', ref: m });
            }
            (m.actionItems || []).forEach(a => {
                if (a.dueDate && a.status !== 'Done') {
                    events.push({ type: 'action', date: a.dueDate,
                        label: a.text, area: m.area || '',
                        ref: { ...a, meetingArea: m.area } });
                }
            });
        });

        // Projects: due date + actions
        (data.projects || []).forEach(p => {
            if (p.dueDate) {
                events.push({ type: 'project', date: p.dueDate,
                    label: p.title, area: p.area || '', ref: p });
            }
            (p.actions || []).forEach(a => {
                if (a.dueDate && a.status !== 'Done') {
                    events.push({ type: 'action', date: a.dueDate,
                        label: a.text, area: p.area || '',
                        ref: { ...a, projectTitle: p.title } });
                }
            });
        });

        // AARs: incident date + countermeasure due date
        (data.aars || []).forEach(aar => {
            if (aar.date) {
                events.push({ type: 'aar', date: aar.date,
                    label: `AAR: ${aar.incidentType || 'Incident'}`,
                    area: aar.area || '', ref: aar });
            }
            if (aar.dueDate && aar.dueDate !== aar.date) {
                events.push({ type: 'aar', date: aar.dueDate,
                    label: `AAR Due: ${aar.incidentType || 'Incident'}`,
                    area: aar.area || '', ref: aar });
            }
        });

        // Process docs: last reviewed date
        (data.processDocs || []).forEach(doc => {
            if (doc.lastReviewedDate) {
                events.push({ type: 'process', date: doc.lastReviewedDate,
                    label: doc.name, area: doc.area || '', ref: doc });
            }
        });

        return events;
    }

    function getActiveFilters() {
        return {
            projects: document.getElementById('filter-projects')?.checked ?? true,
            actions:  document.getElementById('filter-actions')?.checked ?? true,
            aar:      document.getElementById('filter-aar')?.checked ?? true,
            meetings: document.getElementById('filter-meetings')?.checked ?? true,
            process:  document.getElementById('filter-process')?.checked ?? true,
            area:     document.getElementById('filter-calendar-area')?.value || ''
        };
    }

    function applyFilters(events) {
        const f = getActiveFilters();
        return events.filter(e => {
            if (e.type === 'project' && !f.projects) return false;
            if (e.type === 'action'  && !f.actions)  return false;
            if (e.type === 'aar'     && !f.aar)      return false;
            if (e.type === 'meeting' && !f.meetings)  return false;
            if (e.type === 'process' && !f.process)   return false;
            if (f.area && e.area !== f.area) return false;
            return true;
        });
    }

    function buildEventMap(events) {
        const map = {};
        events.forEach(e => {
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return map;
    }

    // ─── Render Calendar ──────────────────────────────────────────────────────

    function renderCalendarPage() {
        const titleEl = document.getElementById('calendar-month-title');
        const grid    = document.getElementById('calendar-grid');
        if (!grid) return;

        if (titleEl) titleEl.textContent = `${MONTH_NAMES[state.month]} ${state.year}`;

        const eventMap = buildEventMap(applyFilters(collectEvents()));
        const todayStr = new Date().toISOString().split('T')[0];

        // Day-of-week headers
        const headers = DAY_NAMES.map(d =>
            `<div class="calendar-day-header">${d}</div>`
        ).join('');

        // Blank leading cells
        const firstDayOfWeek = new Date(state.year, state.month, 1).getDay();
        const daysInMonth    = new Date(state.year, state.month + 1, 0).getDate();

        let cells = '';
        for (let i = 0; i < firstDayOfWeek; i++) {
            cells += '<div class="calendar-day calendar-day-empty"></div>';
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const mm      = String(state.month + 1).padStart(2, '0');
            const dd      = String(d).padStart(2, '0');
            const dateStr = `${state.year}-${mm}-${dd}`;
            const dayEvts = eventMap[dateStr] || [];
            const isToday = dateStr === todayStr;

            const MAX_VISIBLE = 3;
            const chips = dayEvts.slice(0, MAX_VISIBLE).map(e =>
                `<div class="calendar-chip chip-${e.type}" title="${escapeHtml(e.label)}">${escapeHtml(e.label)}</div>`
            ).join('');

            const overflow = dayEvts.length > MAX_VISIBLE
                ? `<div class="calendar-chip-overflow">+${dayEvts.length - MAX_VISIBLE} more</div>`
                : '';

            cells += `
                <div class="calendar-day${isToday ? ' calendar-day-today' : ''}${dayEvts.length ? ' calendar-day-has-events' : ''}"
                     onclick="calendarSelectDay('${dateStr}')">
                    <div class="calendar-day-number${isToday ? ' today-badge' : ''}">${d}</div>
                    <div class="calendar-chips">${chips}${overflow}</div>
                </div>`;
        }

        grid.innerHTML = headers + cells;
        setupCalendarFilters();
    }

    function setupCalendarFilters() {
        const ids = ['filter-projects','filter-actions','filter-aar',
                     'filter-meetings','filter-process','filter-calendar-area'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el._calListener) {
                el.addEventListener('change', renderCalendarPage);
                el._calListener = true;
            }
        });
    }

    // ─── Day Drawer ───────────────────────────────────────────────────────────

    function calendarSelectDay(dateStr) {
        state.selectedDate = dateStr;

        const drawer  = document.getElementById('day-drawer');
        const titleEl = document.getElementById('day-drawer-title');
        const bodyEl  = document.getElementById('day-drawer-body');
        if (!drawer || !titleEl || !bodyEl) return;

        const [y, m, d] = dateStr.split('-').map(Number);
        titleEl.textContent = new Date(y, m - 1, d)
            .toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const dayEvts = applyFilters(collectEvents()).filter(e => e.date === dateStr);

        bodyEl.innerHTML = dayEvts.length === 0
            ? '<div style="padding:16px;color:var(--muted);">No events on this day.</div>'
            : dayEvts.map(renderDrawerEvent).join('');

        drawer.classList.add('open');
    }

    const TYPE_LABELS = {
        project: 'Project',
        action:  'Action',
        aar:     'AAR',
        meeting: 'Meeting',
        process: 'Process Review'
    };

    function renderDrawerEvent(e) {
        const details = buildDetails(e);
        return `
            <div class="day-item item-${e.type}">
                <div class="day-item-type">${TYPE_LABELS[e.type] || e.type}</div>
                <div class="day-item-title">${escapeHtml(e.label)}</div>
                ${e.area ? `<div class="day-item-meta">${escapeHtml(e.area)}</div>` : ''}
                ${details}
            </div>`;
    }

    function buildDetails(e) {
        const lines = [];
        if (e.type === 'meeting') {
            const m = e.ref;
            if (m.attendees) lines.push(`Attendees: ${escapeHtml(m.attendees)}`);
        } else if (e.type === 'action') {
            const a = e.ref;
            if (a.owner)        lines.push(`Owner: ${escapeHtml(a.owner)}`);
            if (a.projectTitle) lines.push(`Project: ${escapeHtml(a.projectTitle)}`);
            if (a.meetingArea)  lines.push(`Meeting: ${escapeHtml(a.meetingArea)}`);
            if (a.status)       lines.push(`Status: ${escapeHtml(a.status)}`);
        } else if (e.type === 'project') {
            const p = e.ref;
            if (p.status) lines.push(`Status: ${escapeHtml(p.status)}`);
            if (p.owner)  lines.push(`Owner: ${escapeHtml(p.owner)}`);
        } else if (e.type === 'aar') {
            const aar = e.ref;
            if (aar.incidentType) lines.push(`Type: ${escapeHtml(aar.incidentType)}`);
            if (aar.owner)        lines.push(`Owner: ${escapeHtml(aar.owner)}`);
            if (aar.status)       lines.push(`Status: ${escapeHtml(aar.status)}`);
        } else if (e.type === 'process') {
            const doc = e.ref;
            if (doc.owner) lines.push(`Owner: ${escapeHtml(doc.owner)}`);
        }
        return lines.map(l => `<div class="day-item-meta">${l}</div>`).join('');
    }

    function closeDayDrawer() {
        const drawer = document.getElementById('day-drawer');
        if (drawer) drawer.classList.remove('open');
        state.selectedDate = null;
    }

    // ─── Month Navigation ─────────────────────────────────────────────────────

    function prevMonth() {
        if (state.month === 0) { state.month = 11; state.year--; }
        else { state.month--; }
        renderCalendarPage();
    }

    function nextMonth() {
        if (state.month === 11) { state.month = 0; state.year++; }
        else { state.month++; }
        renderCalendarPage();
    }

    // ─── Quick Add ────────────────────────────────────────────────────────────

    function quickAddMeeting() {
        const date = state.selectedDate;
        closeDayDrawer();
        if (typeof showCreateMeetingModal === 'function') {
            showCreateMeetingModal(date ? { dateTime: date } : {});
        } else {
            navigateToPage('meetings');
        }
    }

    function quickAddAAR() {
        const date = state.selectedDate;
        closeDayDrawer();
        if (typeof showCreateAARModal === 'function') {
            showCreateAARModal(date ? { date } : {});
        } else {
            navigateToPage('aar');
        }
    }

    function quickAddAction() {
        closeDayDrawer();
        navigateToPage('projects');
    }

    // ─── Expose ───────────────────────────────────────────────────────────────

    window.renderCalendarPage = renderCalendarPage;
    window.calendarSelectDay  = calendarSelectDay;

    app.prevMonth      = prevMonth;
    app.nextMonth      = nextMonth;
    app.closeDayDrawer = closeDayDrawer;
    app.quickAddMeeting = quickAddMeeting;
    app.quickAddAAR    = quickAddAAR;
    app.quickAddAction = quickAddAction;

})();
