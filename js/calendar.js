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

        // Meetings: meeting date + follow-up date + action items
        (data.meetings || []).forEach(m => {
            const meetingDate = m.date || m.dateTime;
            if (meetingDate) {
                events.push({ type: 'meeting', date: meetingDate,
                    label: m.title || `${m.area || 'Meeting'} CI Meeting`,
                    area: m.section || m.area || '', ref: m });
            }
            if (m.followupDate) {
                events.push({ type: 'meeting', date: m.followupDate,
                    label: `Follow-up: ${m.title || 'Meeting'}`,
                    area: m.section || m.area || '', ref: m });
            }
            if (m.nextMeetingDate) {
                events.push({ type: 'meeting', date: m.nextMeetingDate,
                    label: `Next: ${m.title || m.area || 'Meeting'}`,
                    area: m.section || m.area || '', ref: m });
            }
            (m.actionItems || []).forEach(a => {
                if (a.dueDate && a.status !== 'Done') {
                    events.push({ type: 'action', date: a.dueDate,
                        label: a.text, area: m.section || m.area || '',
                        ref: { ...a, meetingTitle: m.title, meetingArea: m.area } });
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

        // Issues: next action due date
        (data.issues || []).forEach(issue => {
            if (issue.nextActionDueDate && issue.status !== 'Closed') {
                events.push({ type: 'action', date: issue.nextActionDueDate,
                    label: issue.nextAction || issue.title || 'Issue action due',
                    area: issue.section || '', ref: issue });
            }
        });

        // Tickets: due dates for open requests
        (data.tickets || []).forEach(ticket => {
            if (ticket.dueDate && ticket.status !== 'Closed' && ticket.status !== 'Converted') {
                events.push({ type: 'action', date: ticket.dueDate,
                    label: ticket.ticketNumber + ': ' + (ticket.title || 'Request'),
                    area: '', ref: ticket });
            }
        });

        // RFQ expiry events (within 30 days)
        if (data.costAnalysis && data.costAnalysis.parts) {
            const rfqToday = new Date(); rfqToday.setHours(0,0,0,0);
            const rfqSoonMs = 30 * 24 * 60 * 60 * 1000;
            data.costAnalysis.parts.forEach(p => {
                const rfqs = p.rfqs || [];
                if (rfqs.length === 0) return;
                // Find cheapest RFQ (best)
                const best = rfqs.reduce((b, r) => (!b || Number(r.unitCost) < Number(b.unitCost)) ? r : b, null);
                if (best && best.validUntil) {
                    const expDate = new Date(best.validUntil);
                    if ((expDate - rfqToday) <= rfqSoonMs) {
                        events.push({ type: 'rfqexpiry', date: best.validUntil,
                            label: 'RFQ Expiry: ' + (p.partNumber || '') + ' (' + (best.supplier || '') + ')',
                            area: '', ref: { part: p, rfq: best } });
                    }
                }
            });
        }

        // SC Area improvements
        (data.scAreas || []).forEach(area => {
            (area.improvements || []).forEach(imp => {
                if (imp.date) {
                    events.push({ type: 'project', date: imp.date,
                        label: imp.title || 'Improvement', area: area.name || '', ref: imp });
                }
            });
        });

        // User-created calendar events (supports single-day and multi-day)
        (data.calendarEvents || []).forEach(ev => {
            if (!ev.date) return;
            if (!ev.endDate || ev.endDate <= ev.date) {
                events.push({ type: 'calendarEvent', date: ev.date,
                    label: ev.title || 'Event', area: '', ref: ev });
                return;
            }
            // Expand multi-day span into per-day entries
            const start = new Date(ev.date + 'T00:00:00');
            const end   = new Date(ev.endDate + 'T00:00:00');
            const totalDays = Math.round((end - start) / 86400000);
            for (let i = 0; i <= totalDays; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                events.push({ type: 'calendarEvent', date: dateStr,
                    label: ev.title || 'Event', area: '', ref: ev,
                    isStart: i === 0, isMid: i > 0 && i < totalDays, isEnd: i === totalDays });
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
            events:   document.getElementById('filter-events')?.checked ?? true,
            area:     document.getElementById('filter-calendar-area')?.value || ''
        };
    }

    function applyFilters(events) {
        const f = getActiveFilters();
        return events.filter(e => {
            if (e.type === 'project'       && !f.projects) return false;
            if (e.type === 'action'        && !f.actions)  return false;
            if (e.type === 'aar'           && !f.aar)      return false;
            if (e.type === 'meeting'       && !f.meetings) return false;
            if (e.type === 'process'       && !f.process)  return false;
            if (e.type === 'calendarEvent' && !f.events)   return false;
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
            const chips = dayEvts.slice(0, MAX_VISIBLE).map(e => {
                const spanClass = e.isStart ? ' chip-span-start'
                                : e.isMid   ? ' chip-span-mid'
                                : e.isEnd   ? ' chip-span-end'
                                : '';
                const label = (e.isMid || e.isEnd) ? '' : escapeHtml(e.label);
                return `<div class="calendar-chip chip-${e.type}${spanClass}" title="${escapeHtml(e.label)}">${label}</div>`;
            }).join('');

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
                     'filter-meetings','filter-process','filter-events','filter-calendar-area'];
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
        project:       'Project',
        action:        'Action',
        aar:           'AAR',
        meeting:       'Meeting',
        process:       'Process Review',
        rfqexpiry:     'RFQ Expiry',
        calendarEvent: 'Event'
    };

    function renderDrawerEvent(e) {
        const details = buildDetails(e);
        const actions = buildDrawerActions(e);
        return `
            <div class="day-item item-${e.type}">
                <div class="day-item-type">${TYPE_LABELS[e.type] || e.type}</div>
                <div class="day-item-title">${escapeHtml(e.label)}</div>
                ${e.area ? `<div class="day-item-meta">${escapeHtml(e.area)}</div>` : ''}
                ${details}
                ${actions ? `<div class="day-item-actions">${actions}</div>` : ''}
            </div>`;
    }

    function buildDrawerActions(e) {
        const id = e.ref && e.ref.id ? escapeHtml(e.ref.id) : '';
        switch (e.type) {
            case 'meeting':
                return `<button class="btn btn-secondary btn-small" onclick="app.closeDayDrawer();app.editMeetingBasicInfo('${id}')">Edit</button>`
                     + `<button class="btn btn-secondary btn-small" onclick="app.closeDayDrawer();showMeetingDetailModal('${id}')">View</button>`;
            case 'project':
                return `<button class="btn btn-secondary btn-small" onclick="app.closeDayDrawer();editProject('${id}')">Edit</button>`
                     + `<button class="btn btn-secondary btn-small" onclick="app.closeDayDrawer();showProjectDetailModal('${id}')">View</button>`;
            case 'aar':
                return `<button class="btn btn-secondary btn-small" onclick="app.closeDayDrawer();editAAR('${id}')">Edit</button>`
                     + `<button class="btn btn-secondary btn-small" onclick="app.closeDayDrawer();showAARDetailModal('${id}')">View</button>`;
            case 'calendarEvent':
                return `<button class="btn btn-secondary btn-small" onclick="app.editCalendarEvent('${id}')">Edit</button>`
                     + `<button class="btn btn-danger btn-small" onclick="app.deleteCalendarEvent('${id}')">Delete</button>`;
            case 'action':
                // Actions live inside meetings/projects — navigate to context
                if (e.ref.projectTitle) return `<button class="btn btn-secondary btn-small" onclick="app.closeDayDrawer();navigateToPage('projects')">View Project</button>`;
                if (e.ref.meetingTitle || e.ref.meetingArea) return `<button class="btn btn-secondary btn-small" onclick="app.closeDayDrawer();navigateToPage('meetings')">View Meeting</button>`;
                return '';
            default:
                return '';
        }
    }

    function buildDetails(e) {
        const lines = [];
        if (e.type === 'meeting') {
            const m = e.ref;
            if (m.time) lines.push(`Time: ${escapeHtml(m.time)}${m.endTime ? '–' + escapeHtml(m.endTime) : ''}`);
            if (m.section || m.type) lines.push([m.section, m.type].filter(Boolean).map(escapeHtml).join(' · '));
            if (m.attendees) lines.push(`Attendees: ${escapeHtml(m.attendees)}`);
        } else if (e.type === 'action') {
            const a = e.ref;
            if (a.owner)         lines.push(`Owner: ${escapeHtml(a.owner)}`);
            if (a.projectTitle)  lines.push(`Project: ${escapeHtml(a.projectTitle)}`);
            if (a.meetingTitle)  lines.push(`Meeting: ${escapeHtml(a.meetingTitle)}`);
            else if (a.meetingArea) lines.push(`Meeting: ${escapeHtml(a.meetingArea)}`);
            if (a.status)        lines.push(`Status: ${escapeHtml(a.status)}`);
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
        } else if (e.type === 'rfqexpiry') {
            const rfq = e.ref && e.ref.rfq;
            if (rfq && rfq.supplier)   lines.push(`Supplier: ${escapeHtml(rfq.supplier)}`);
            if (rfq && rfq.unitCost)   lines.push(`Unit Cost: $${Number(rfq.unitCost).toFixed(4)}`);
            if (rfq && rfq.validUntil) lines.push(`Valid Until: ${rfq.validUntil}`);
        } else if (e.type === 'calendarEvent') {
            const ev = e.ref;
            if (ev.endDate && ev.endDate !== ev.date) {
                const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                lines.push(`${fmt(ev.date)} → ${fmt(ev.endDate)}`);
            }
            if (ev.notes) lines.push(escapeHtml(ev.notes));
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

    // ─── Calendar Event CRUD ──────────────────────────────────────────────────

    function openAddEventModal(dateStr) {
        const existing = document.getElementById('cal-event-modal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="cal-event-modal" onclick="if(event.target===this)closeAddEventModal()">
                <div class="modal" style="max-width:420px;">
                    <div class="modal-header">
                        <h2>Add Calendar Event</h2>
                        <button class="modal-close" onclick="closeAddEventModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Title *</label>
                            <input class="form-control" id="cal-ev-title" placeholder="e.g. PO Deadline, Design Review">
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                            <div class="form-group">
                                <label>Start Date *</label>
                                <input class="form-control" id="cal-ev-date" type="date" value="${escapeHtml(dateStr || '')}">
                            </div>
                            <div class="form-group">
                                <label>End Date <span style="font-weight:400;color:var(--muted);">(optional)</span></label>
                                <input class="form-control" id="cal-ev-end-date" type="date" value="${escapeHtml(dateStr || '')}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea class="form-control" id="cal-ev-notes" rows="3" placeholder="Optional details..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeAddEventModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="app.saveCalendarEvent()">Save Event</button>
                    </div>
                </div>
            </div>`);
        setTimeout(() => document.getElementById('cal-ev-title')?.focus(), 50);
    }

    function closeAddEventModal() {
        const el = document.getElementById('cal-event-modal');
        if (el) el.remove();
    }

    function saveCalendarEvent() {
        const title   = document.getElementById('cal-ev-title')?.value.trim();
        const date    = document.getElementById('cal-ev-date')?.value;
        const endDate = document.getElementById('cal-ev-end-date')?.value;
        const notes   = document.getElementById('cal-ev-notes')?.value.trim();
        if (!title) { showToast('Title is required'); return; }
        if (!date)  { showToast('Date is required');  return; }
        if (endDate && endDate < date) { showToast('End date must be on or after start date', 'error'); return; }
        if (!app.data.calendarEvents) app.data.calendarEvents = [];
        const ev = { id: generateId(), title, date, notes };
        if (endDate && endDate !== date) ev.endDate = endDate;
        app.data.calendarEvents.push(ev);
        saveData();
        closeAddEventModal();
        renderCalendarPage();
        // Re-open drawer to show the new event
        calendarSelectDay(date);
        showToast('Event added');
    }

    function editCalendarEvent(id) {
        const ev = (app.data.calendarEvents || []).find(e => e.id === id);
        if (!ev) return;
        const existing = document.getElementById('cal-event-modal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="cal-event-modal" onclick="if(event.target===this)closeAddEventModal()">
                <div class="modal" style="max-width:420px;">
                    <div class="modal-header">
                        <h2>Edit Calendar Event</h2>
                        <button class="modal-close" onclick="closeAddEventModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Title *</label>
                            <input class="form-control" id="cal-ev-title" value="${escapeHtml(ev.title || '')}">
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                            <div class="form-group">
                                <label>Start Date *</label>
                                <input class="form-control" id="cal-ev-date" type="date" value="${escapeHtml(ev.date || '')}">
                            </div>
                            <div class="form-group">
                                <label>End Date <span style="font-weight:400;color:var(--muted);">(optional)</span></label>
                                <input class="form-control" id="cal-ev-end-date" type="date" value="${escapeHtml(ev.endDate || ev.date || '')}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea class="form-control" id="cal-ev-notes" rows="3">${escapeHtml(ev.notes || '')}</textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeAddEventModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="app.updateCalendarEvent('${escapeHtml(id)}')">Save</button>
                    </div>
                </div>
            </div>`);
        setTimeout(() => document.getElementById('cal-ev-title')?.focus(), 50);
    }

    function updateCalendarEvent(id) {
        const ev = (app.data.calendarEvents || []).find(e => e.id === id);
        if (!ev) return;
        const title   = document.getElementById('cal-ev-title')?.value.trim();
        const date    = document.getElementById('cal-ev-date')?.value;
        const endDate = document.getElementById('cal-ev-end-date')?.value;
        const notes   = document.getElementById('cal-ev-notes')?.value.trim();
        if (!title) { showToast('Title is required'); return; }
        if (!date)  { showToast('Date is required');  return; }
        if (endDate && endDate < date) { showToast('End date must be on or after start date', 'error'); return; }
        ev.title = title;
        ev.date  = date;
        ev.endDate = (endDate && endDate !== date) ? endDate : undefined;
        ev.notes = notes;
        saveData();
        closeAddEventModal();
        renderCalendarPage();
        calendarSelectDay(date);
        showToast('Event updated');
    }

    function deleteCalendarEvent(id) {
        if (!app.data.calendarEvents) return;
        app.data.calendarEvents = app.data.calendarEvents.filter(e => e.id !== id);
        saveData();
        const date = state.selectedDate;
        renderCalendarPage();
        if (date) calendarSelectDay(date);
        showToast('Event deleted');
    }

    function quickAddEvent() {
        openAddEventModal(state.selectedDate || '');
    }

    // ─── Expose ───────────────────────────────────────────────────────────────

    window.renderCalendarPage  = renderCalendarPage;
    window.calendarSelectDay   = calendarSelectDay;
    window.closeAddEventModal  = closeAddEventModal;

    app.prevMonth           = prevMonth;
    app.nextMonth           = nextMonth;
    app.closeDayDrawer      = closeDayDrawer;
    app.quickAddMeeting     = quickAddMeeting;
    app.quickAddAAR         = quickAddAAR;
    app.quickAddAction      = quickAddAction;
    app.quickAddEvent       = quickAddEvent;
    app.saveCalendarEvent   = saveCalendarEvent;
    app.editCalendarEvent   = editCalendarEvent;
    app.updateCalendarEvent = updateCalendarEvent;
    app.deleteCalendarEvent = deleteCalendarEvent;

})();
