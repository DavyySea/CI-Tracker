/* =========================
   js/meetings.js
   Enhanced Meeting Management Module
   FOCUSED ON: Live note-taking for Outlook meetings
   ========================= */

(function() {
    'use strict';

    // Current state
    let meetingFilters = {
        search: '',
        section: '',
        type: '',
        dateFrom: '',
        dateTo: ''
    };

    let currentView = 'list'; // 'list' or 'timeline'
    let activeMeetingId = null; // For live note-taking mode
    let _pickerSelectedIds = []; // Attendee picker state

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMeetingsModule);
    } else {
        initMeetingsModule();
    }

    function initMeetingsModule() {
        setupMeetingFilters();
        setupMeetingPageListeners();
        setupViewToggle();

        // Hook into page navigation
        const originalRenderCurrentPage = window.renderCurrentPage;
        if (originalRenderCurrentPage) {
            window.renderCurrentPage = function() {
                originalRenderCurrentPage();
                if (app.currentPage === 'meetings') {
                    renderMeetingsPage();
                }
            };
        }
    }

    function setupMeetingFilters() {
        const searchInput = document.getElementById('meeting-search');
        const sectionFilter = document.getElementById('meeting-section-filter');
        const typeFilter = document.getElementById('meeting-type-filter');
        const dateFromInput = document.getElementById('meeting-date-from');
        const dateToInput = document.getElementById('meeting-date-to');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                meetingFilters.search = e.target.value.toLowerCase();
                renderMeetingsList();
            });
        }

        if (sectionFilter) {
            sectionFilter.addEventListener('change', (e) => {
                meetingFilters.section = e.target.value;
                renderMeetingsList();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                meetingFilters.type = e.target.value;
                renderMeetingsList();
            });
        }

        if (dateFromInput) {
            dateFromInput.addEventListener('change', (e) => {
                meetingFilters.dateFrom = e.target.value;
                renderMeetingsList();
            });
        }

        if (dateToInput) {
            dateToInput.addEventListener('change', (e) => {
                meetingFilters.dateTo = e.target.value;
                renderMeetingsList();
            });
        }
    }

    function setupMeetingPageListeners() {
        // Buttons use onclick attributes in HTML — no duplicate listeners needed
    }

    function setupViewToggle() {
        const listBtn = document.getElementById('meetingListViewBtn');
        const timelineBtn = document.getElementById('meetingTimelineViewBtn');

        if (listBtn) {
            listBtn.addEventListener('click', () => switchMeetingView('list'));
        }
        if (timelineBtn) {
            timelineBtn.addEventListener('click', () => switchMeetingView('timeline'));
        }
    }

    function switchMeetingView(view) {
        currentView = view;

        const listView = document.getElementById('meeting-list-view');
        const timelineView = document.getElementById('meeting-timeline-view');
        const listBtn = document.getElementById('meetingListViewBtn');
        const timelineBtn = document.getElementById('meetingTimelineViewBtn');

        if (view === 'list') {
            if (listView) listView.classList.remove('hidden');
            if (timelineView) timelineView.classList.add('hidden');
            if (listBtn) listBtn.classList.add('active');
            if (timelineBtn) timelineBtn.classList.remove('active');
            renderMeetingsList();
        } else {
            if (listView) listView.classList.add('hidden');
            if (timelineView) timelineView.classList.remove('hidden');
            if (listBtn) listBtn.classList.remove('active');
            if (timelineBtn) timelineBtn.classList.add('active');
            renderMeetingsTimeline();
        }
    }

    // Render Meetings Page
    function renderMeetingsPage() {
        if (currentView === 'list') {
            renderMeetingsList();
        } else {
            renderMeetingsTimeline();
        }
        updateNavigationBadges();
    }

    function renderMeetingsList() {
        const container = document.getElementById('meeting-list');
        if (!container || !app.data.meetings) return;

        let filteredMeetings = app.data.meetings.filter(meeting => {
            if (meetingFilters.search) {
                const searchLower = meetingFilters.search;
                if (!meeting.title?.toLowerCase().includes(searchLower) &&
                    !meeting.section?.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }
            if (meetingFilters.section && meeting.section !== meetingFilters.section) {
                return false;
            }
            if (meetingFilters.type && meeting.type !== meetingFilters.type) {
                return false;
            }
            if (meetingFilters.dateFrom && meeting.date < meetingFilters.dateFrom) {
                return false;
            }
            if (meetingFilters.dateTo && meeting.date > meetingFilters.dateTo) {
                return false;
            }
            return true;
        });

        // Sort by date descending
        filteredMeetings.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
            const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
            return dateB - dateA;
        });

        if (filteredMeetings.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🗓️</div><p>No meetings found</p><p style="font-size: 13px; color: var(--muted);">Create a meeting record for your Outlook meetings to track notes and outcomes</p></div>';
            return;
        }

        let html = '';
        filteredMeetings.forEach(meeting => {
            html += renderMeetingCard(meeting);
        });
        container.innerHTML = html;
    }

    function renderMeetingCard(meeting) {
        const issueCount = meeting.linkedIssueIds?.length || 0;
        const actionCount = meeting.actionItems?.filter(a => a.status !== 'Done').length || 0;
        const decisionCount = meeting.decisions?.length || 0;
        const hasNotes = meeting.keyTopics || meeting.discussionNotes || meeting.risks || meeting.parkingLot;

        return `
            <div class="meeting-card" onclick="app.viewMeetingDetail('${meeting.id}')">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 4px 0; font-size: 16px;">${escapeHtml(meeting.title || 'Untitled Meeting')}</h3>
                        <div style="font-size: 13px; color: var(--muted);">
                            ${meeting.date ? formatDate(new Date(meeting.date)) : 'No date'}
                            ${meeting.time ? ' • ' + meeting.time : ''}
                            ${meeting.endTime ? '–' + meeting.endTime : ''}
                            ${meeting.location ? ' • ' + escapeHtml(meeting.location) : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        ${meeting.type ? `<span class="status-badge">${escapeHtml(meeting.type)}</span>` : ''}
                        ${meeting.section ? `<span class="status-badge">${escapeHtml(meeting.section)}</span>` : ''}
                        <button class="btn btn-secondary btn-small" style="margin-left:4px;"
                            onclick="event.stopPropagation(); app.editMeetingBasicInfo('${meeting.id}')">Edit</button>
                        <button class="btn btn-danger btn-small"
                            onclick="event.stopPropagation(); app.deleteMeeting('${meeting.id}')">Delete</button>
                    </div>
                </div>
                ${getMeetingAttendeesDisplay(meeting) ? `
                    <div style="font-size: 13px; margin-bottom: 8px; color: var(--text-2);">
                        <strong>Attendees:</strong> ${escapeHtml(getMeetingAttendeesDisplay(meeting))}
                    </div>
                ` : ''}
                <div style="display: flex; gap: 16px; font-size: 13px; color: var(--muted); flex-wrap: wrap;">
                    ${hasNotes ? `<span>📝 Has notes</span>` : '<span style="color: var(--warning);">⚠️ No notes yet</span>'}
                    ${issueCount > 0 ? `<span>🎯 ${issueCount} issue(s)</span>` : ''}
                    ${decisionCount > 0 ? `<span>✓ ${decisionCount} decision(s)</span>` : ''}
                    ${actionCount > 0 ? `<span style="color: var(--warning);">⚡ ${actionCount} open action(s)</span>` : ''}
                </div>
            </div>
        `;
    }

    function renderMeetingsTimeline() {
        const container = document.getElementById('meeting-timeline');
        if (!container || !app.data.meetings) return;

        let filteredMeetings = app.data.meetings.filter(meeting => {
            if (meetingFilters.search) {
                const searchLower = meetingFilters.search;
                if (!meeting.title?.toLowerCase().includes(searchLower) &&
                    !meeting.section?.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }
            if (meetingFilters.section && meeting.section !== meetingFilters.section) {
                return false;
            }
            if (meetingFilters.type && meeting.type !== meetingFilters.type) {
                return false;
            }
            return true;
        });

        // Sort by date descending
        filteredMeetings.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
            const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
            return dateB - dateA;
        });

        // Group by month
        const grouped = {};
        filteredMeetings.forEach(meeting => {
            if (!meeting.date) return;
            const date = new Date(meeting.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            if (!grouped[key]) {
                grouped[key] = { label, meetings: [] };
            }
            grouped[key].meetings.push(meeting);
        });

        if (Object.keys(grouped).length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🗓️</div><p>No meetings found</p></div>';
            return;
        }

        let html = '<div class="meeting-timeline">';
        Object.keys(grouped).sort().reverse().forEach(key => {
            const group = grouped[key];
            html += `
                <div class="timeline-group">
                    <div class="timeline-group-header">${group.label}</div>
                    <div class="timeline-items">
            `;
            group.meetings.forEach(meeting => {
                const hasNotes = meeting.keyTopics || meeting.discussionNotes || meeting.risks;
                html += `
                    <div class="timeline-item" onclick="app.viewMeetingDetail('${meeting.id}')">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <strong>${escapeHtml(meeting.title || 'Untitled Meeting')}</strong>
                                ${!hasNotes ? ' <span style="color: var(--warning); font-size: 11px;">⚠️ No notes</span>' : ''}
                                <br>
                                <small style="color: var(--muted);">
                                    ${meeting.date ? formatDate(new Date(meeting.date)) : ''}
                                    ${meeting.time ? ' • ' + meeting.time : ''}
                                </small>
                            </div>
                            <span class="status-badge">${escapeHtml(meeting.type || 'Meeting')}</span>
                        </div>
                    </div>
                `;
            });
            html += `
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    // ─── Attendee Picker ──────────────────────────────────────────────────────

    function initAttendeePicker(existingIds) {
        if (typeof app._attendeePickerCleanup === 'function') {
            app._attendeePickerCleanup();
            app._attendeePickerCleanup = null;
        }

        _pickerSelectedIds = Array.isArray(existingIds) ? [...existingIds] : [];
        renderPickerTags();

        const input       = document.getElementById('attendeeInput');
        const suggestions = document.getElementById('attendeeDropdown');
        if (!input || !suggestions) return;

        function showSuggestions(q) {
            const all      = typeof searchContacts === 'function' ? searchContacts(q) : [];
            const filtered = all.filter(c => !_pickerSelectedIds.includes(c.id));
            let html = filtered.map(c => `
                <div class="attendee-option" onclick="app.pickerSelect('${c.id}')">
                    <span class="attendee-option-avatar">${escapeHtml(getInitials(c.name))}</span>
                    <span><strong>${escapeHtml(c.name)}</strong>${(c.title || c.company) ? ' <small style="color:var(--muted)">· ' + escapeHtml(c.title || c.company) + '</small>' : ''}</span>
                </div>`).join('');
            if (q) {
                html += `<div class="attendee-option attendee-option-new" onclick="app.pickerAddNew(document.getElementById('attendeeInput').value.trim())">
                    + Add "<strong>${escapeHtml(q)}</strong>" as new contact
                </div>`;
            }
            if (!html) {
                html = '<div class="attendee-option-empty">No contacts yet — type a name and press Enter to add one</div>';
            }
            suggestions.innerHTML = html;
            suggestions.classList.remove('hidden');
        }

        function onFocus()  { showSuggestions(input.value.trim()); }
        function onInput()  { showSuggestions(input.value.trim()); }

        function onKeydown(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const q = input.value.trim();
                if (q) app.pickerAddNew(q);
            }
            if (e.key === 'Escape') suggestions.classList.add('hidden');
        }

        function onDocClick(e) {
            if (e.target.closest('#attendeePicker') || e.target.closest('#attendeeDropdown')) return;
            suggestions.classList.add('hidden');
        }

        input.addEventListener('focus',   onFocus);
        input.addEventListener('input',   onInput);
        input.addEventListener('keydown', onKeydown);
        document.addEventListener('click', onDocClick);

        app._attendeePickerCleanup = function() {
            input.removeEventListener('focus',   onFocus);
            input.removeEventListener('input',   onInput);
            input.removeEventListener('keydown', onKeydown);
            document.removeEventListener('click', onDocClick);
        };
    }

    function renderPickerTags() {
        const container = document.getElementById('attendeeTagsList');
        if (!container) return;
        container.innerHTML = _pickerSelectedIds.map(id => {
            const name = typeof getContactName === 'function' ? getContactName(id) : id;
            return `<span class="attendee-tag">${escapeHtml(name)}<button type="button" class="attendee-tag-edit" onclick="app.pickerEditContact('${id}')" title="Edit contact">✏</button><button type="button" class="attendee-tag-remove" onclick="app.pickerRemove('${id}')">&times;</button></span>`;
        }).join('');
    }

    function pickerSelect(contactId) {
        if (!_pickerSelectedIds.includes(contactId)) {
            _pickerSelectedIds.push(contactId);
            renderPickerTags();
        }
        const input    = document.getElementById('attendeeInput');
        // Dropdown may now live in body
        const dropdown = document.getElementById('attendeeDropdown') ||
                         document.querySelector('.attendee-dropdown');
        if (input) input.value = '';
        if (dropdown) dropdown.classList.add('hidden');
        if (input) input.focus();
    }

    function pickerAddNew(name) {
        if (!name || !name.trim()) return;
        const existing = typeof searchContacts === 'function'
            ? searchContacts(name).find(c => c.name.toLowerCase() === name.toLowerCase())
            : null;
        if (existing) {
            pickerSelect(existing.id);
            return;
        }
        // Open the full contact modal so the user can fill in email, company, etc.
        if (typeof showContactModal === 'function') {
            app._pickerContactCallback = function(contact) {
                pickerSelect(contact.id);
            };
            showContactModal({ name: name.trim() });
        } else {
            // Fallback: create minimal contact
            const contact = typeof createContactFromName === 'function'
                ? createContactFromName(name)
                : { id: generateId(), name: name.trim() };
            pickerSelect(contact.id);
        }
    }

    function pickerEditContact(contactId) {
        if (typeof editContact === 'function') {
            editContact(contactId);
        }
    }

    function pickerRemove(contactId) {
        _pickerSelectedIds = _pickerSelectedIds.filter(id => id !== contactId);
        renderPickerTags();
    }

    function getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        return parts.length === 1 ? parts[0][0].toUpperCase()
            : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function getMeetingAttendeesDisplay(meeting) {
        if (meeting.attendeeIds && meeting.attendeeIds.length > 0) {
            return meeting.attendeeIds
                .map(id => typeof getContactName === 'function' ? getContactName(id) : id)
                .join(', ');
        }
        return meeting.attendees || '';
    }

    function getDefaultSections() {
        return ['Electrical','Mechanical','Procurement','Manufacturing',
                'Warehouse','Quality','Planning','Logistics','Leadership','Other'];
    }
    function getDefaultTypes() {
        return ['1:1','Standup','Gemba Walk','Team Meeting','Supplier Call',
                'Project Review','Problem Solving','QBR','Other'];
    }
    function getSections() {
        const s = app.data.meetingSections;
        return (s && s.length) ? s : getDefaultSections();
    }
    function getTypes() {
        const t = app.data.meetingTypes;
        return (t && t.length) ? t : getDefaultTypes();
    }
    function buildDatalistOptions(arr) {
        return arr.map(v => `<option value="${escapeHtml(v)}">`).join('');
    }

    // ─── Save new section/type values back to the global list ────────────────
    function persistCustomValue(value, listKey, defaultsFn) {
        if (!value) return;
        const current = app.data[listKey] && app.data[listKey].length
            ? app.data[listKey] : defaultsFn();
        if (!current.includes(value)) {
            app.data[listKey] = [...current, value];
        }
    }

    // Create Meeting Modal (WITH Notes Sections - All-in-One)
    function showCreateMeetingModal(prefillData = {}) {
        // Guard against double-open (button has both onclick and addEventListener)
        const existing = document.getElementById('meetingModal');
        if (existing) existing.remove();

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 5);

        const modalHtml = `
            <div class="modal-overlay" id="meetingModal">
                <div class="modal" style="max-width: 900px; max-height: 95vh;">
                    <div class="modal-header">
                        <h2>${prefillData.id ? 'Edit Meeting' : 'New Meeting Record'}</h2>
                        <button class="modal-close" onclick="app.closeMeetingModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="color: var(--muted); font-size: 13px; margin-bottom: 16px;">
                            ${prefillData.id ? 'Update meeting info and notes.' : 'Create a meeting record for an Outlook meeting and add notes.'}
                        </p>
                        <form id="meetingForm">
                            <input type="hidden" id="meetingId" value="${prefillData.id || ''}">

                            <h3 style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid var(--border);">Meeting Info</h3>

                            <div class="form-group">
                                <label>Meeting Title (from Outlook) *</label>
                                <input type="text" id="meetingTitle" class="form-control" required
                                       placeholder="e.g., Weekly Standup, Supplier Review Call"
                                       value="${escapeHtml(prefillData.title || '')}">
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label>Date *</label>
                                    <input type="date" id="meetingDate" class="form-control" required value="${prefillData.date || today}">
                                </div>
                                <div class="form-group">
                                    <label>Start Time</label>
                                    <input type="time" id="meetingTime" class="form-control" value="${prefillData.time || currentTime}">
                                </div>
                                <div class="form-group">
                                    <label>End Time</label>
                                    <input type="time" id="meetingEndTime" class="form-control" value="${prefillData.endTime || ''}">
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label>Section / Category</label>
                                    <input type="text" id="meetingSection" class="form-control"
                                           list="sectionList" value="${escapeHtml(prefillData.section || '')}"
                                           placeholder="e.g. Planning">
                                    <datalist id="sectionList">${buildDatalistOptions(getSections())}</datalist>
                                </div>
                                <div class="form-group">
                                    <label>Meeting Type</label>
                                    <input type="text" id="meetingType" class="form-control"
                                           list="typeList" value="${escapeHtml(prefillData.type || '')}"
                                           placeholder="e.g. Team Meeting">
                                    <datalist id="typeList">${buildDatalistOptions(getTypes())}</datalist>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Location (optional)</label>
                                <input type="text" id="meetingLocation" class="form-control"
                                       placeholder="e.g., Conference Room B, Shop Floor, Teams"
                                       value="${escapeHtml(prefillData.location || '')}">
                            </div>

                            <div class="form-group">
                                <label>Attendees</label>
                                <div class="attendee-picker" id="attendeePicker">
                                    <div class="attendee-tags" id="attendeeTagsList"></div>
                                    <input type="text" id="attendeeInput" class="attendee-input"
                                           placeholder="Click here to search contacts…" autocomplete="off">
                                </div>
                                <div class="attendee-suggestions hidden" id="attendeeDropdown"></div>
                                <small style="color:var(--muted);">Click the field to browse contacts, or type to search. Press Enter to add a new contact.</small>
                            </div>

                            <hr style="margin: 24px 0; border: none; border-top: 2px solid var(--border);">
                            <h3 style="margin-bottom: 12px;">Meeting Notes</h3>

                            <div class="form-group">
                                <label><strong>Key Topics Discussed</strong></label>
                                <textarea id="meetingKeyTopics" class="form-control" rows="3"
                                          placeholder="• Main topics covered&#10;• Key discussion points">${escapeHtml(prefillData.keyTopics || '')}</textarea>
                            </div>

                            <div class="form-group">
                                <label><strong>Discussion Notes / Details</strong></label>
                                <textarea id="meetingDiscussionNotes" class="form-control" rows="6"
                                          placeholder="Detailed notes from the discussion...&#10;&#10;Use this for free-form notes during the meeting.">${escapeHtml(prefillData.discussionNotes || '')}</textarea>
                            </div>

                            <div class="form-group">
                                <label><strong>Decisions Made</strong></label>
                                <textarea id="meetingDecisionsText" class="form-control" rows="3"
                                          placeholder="• Decision 1&#10;• Decision 2">${escapeHtml(prefillData.decisionsText || '')}</textarea>
                                <small style="color: var(--muted);">One decision per line. You can also add them later in the Decisions tab.</small>
                            </div>

                            <div class="form-group">
                                <label><strong>Risks / Concerns Raised</strong></label>
                                <textarea id="meetingRisks" class="form-control" rows="3"
                                          placeholder="• Risk 1&#10;• Risk 2">${escapeHtml(prefillData.risks || '')}</textarea>
                            </div>

                            <div class="form-group">
                                <label><strong>Parking Lot Items</strong></label>
                                <textarea id="meetingParkingLot" class="form-control" rows="2"
                                          placeholder="Items to discuss later or in a different forum">${escapeHtml(prefillData.parkingLot || '')}</textarea>
                            </div>

                            <div class="form-group">
                                <label><strong>Next Steps / Follow-up</strong></label>
                                <textarea id="meetingNextSteps" class="form-control" rows="2"
                                          placeholder="What happens next?">${escapeHtml(prefillData.nextSteps || '')}</textarea>
                            </div>

                            <div class="form-group">
                                <label>Follow-up Meeting Date</label>
                                <input type="date" id="meetingFollowupDate" class="form-control" value="${prefillData.followupDate || ''}">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="app.closeMeetingModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="app.saveMeetingWithNotes()">${prefillData.id ? 'Update' : 'Save'} Meeting</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        // Init attendee picker after DOM insertion
        setTimeout(() => initAttendeePicker(prefillData.attendeeIds || []), 0);
    }

    // Quick Capture for past meetings
    function showQuickCaptureMeetingModal() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const modalHtml = `
            <div class="modal-overlay" id="quickMeetingModal">
                <div class="modal">
                    <div class="modal-header">
                        <h2>⚡ Quick Capture Past Meeting</h2>
                        <button class="modal-close" onclick="app.closeQuickMeetingModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="color: var(--muted); font-size: 13px; margin-bottom: 16px;">
                            Quickly log a meeting that already happened with minimal info.
                        </p>
                        <form id="quickMeetingForm">
                            <div class="form-group">
                                <label>What was the meeting? *</label>
                                <input type="text" id="quickMeetingTitle" class="form-control" required
                                       placeholder="e.g., Quick sync with Sarah about supplier issues">
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                                <div class="form-group">
                                    <label>Section *</label>
                                    <select id="quickMeetingSection" class="form-control" required>
                                        <option value="">Select</option>
                                        <option value="Procurement">Procurement</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Quality">Quality</option>
                                        <option value="Planning">Planning</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label>Type *</label>
                                    <select id="quickMeetingType" class="form-control" required>
                                        <option value="">Select</option>
                                        <option value="1:1">1:1</option>
                                        <option value="Gemba">Gemba</option>
                                        <option value="Team Meeting">Team Meeting</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label>When?</label>
                                    <input type="date" id="quickMeetingDate" class="form-control" value="${today}">
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Quick Summary (optional)</label>
                                <textarea id="quickMeetingNotes" class="form-control" rows="3"
                                          placeholder="Quick summary of what was discussed or decided..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="app.closeQuickMeetingModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="app.saveQuickMeeting()">Save</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    function closeMeetingModal() {
        if (typeof app._attendeePickerCleanup === 'function') {
            app._attendeePickerCleanup();
            app._attendeePickerCleanup = null;
        }
        const modal = document.getElementById('meetingModal');
        if (modal) modal.remove();
    }

    function closeQuickMeetingModal() {
        const modal = document.getElementById('quickMeetingModal');
        if (modal) modal.remove();
    }

    function saveMeetingWithNotes() {
        const id = document.getElementById('meetingId').value;
        const title = document.getElementById('meetingTitle').value.trim();
        const date = document.getElementById('meetingDate').value;
        const section = document.getElementById('meetingSection').value;
        const type = document.getElementById('meetingType').value;

        if (!title) {
            showToast('Meeting title is required', 'error');
            return;
        }

        // Parse decisions from textarea into array
        const decisionsText = document.getElementById('meetingDecisionsText').value.trim();
        const decisions = decisionsText ? decisionsText.split('\n').filter(d => d.trim()).map(d => ({
            id: generateId(),
            text: d.trim(),
            timestamp: new Date().toISOString()
        })) : [];

        // Persist custom section/type values for future use
        persistCustomValue(section, 'meetingSections', getDefaultSections);
        persistCustomValue(type, 'meetingTypes', getDefaultTypes);

        // Build attendee display string from selected IDs
        const attendeeNames = _pickerSelectedIds
            .map(id => typeof getContactName === 'function' ? getContactName(id) : id)
            .join(', ');

        const meetingData = {
            id: id || generateId(),
            title,
            date,
            time: document.getElementById('meetingTime').value,
            endTime: document.getElementById('meetingEndTime').value,
            section,
            type,
            location: document.getElementById('meetingLocation').value.trim(),
            attendeeIds: [..._pickerSelectedIds],
            attendees: attendeeNames,
            // Note sections
            keyTopics: document.getElementById('meetingKeyTopics').value.trim(),
            discussionNotes: document.getElementById('meetingDiscussionNotes').value.trim(),
            decisionsText: decisionsText,
            decisions: decisions,
            risks: document.getElementById('meetingRisks').value.trim(),
            parkingLot: document.getElementById('meetingParkingLot').value.trim(),
            nextSteps: document.getElementById('meetingNextSteps').value.trim(),
            followupDate: document.getElementById('meetingFollowupDate').value,
            actionItems: [],
            linkedIssueIds: [],
            createdDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        if (id) {
            // Update existing - preserve action items and linked issues
            const index = app.data.meetings.findIndex(m => m.id === id);
            if (index !== -1) {
                meetingData.actionItems = app.data.meetings[index].actionItems || [];
                meetingData.linkedIssueIds = app.data.meetings[index].linkedIssueIds || [];
                meetingData.createdDate = app.data.meetings[index].createdDate;
                // Merge new decisions with existing ones (keep existing if user didn't change)
                if (decisionsText === '') {
                    meetingData.decisions = app.data.meetings[index].decisions || [];
                }
                app.data.meetings[index] = meetingData;
                logAudit('update', 'meeting', `Updated meeting: ${title}`);
            }
        } else {
            // Create new
            app.data.meetings.push(meetingData);
            logAudit('create', 'meeting', `Created meeting: ${title}`);
        }

        saveData();
        closeMeetingModal();
        updateNavigationBadges();
        renderMeetingsPage();
        showToast(id ? 'Meeting updated' : 'Meeting saved', 'success');
    }

    function saveQuickMeeting() {
        const title = document.getElementById('quickMeetingTitle').value.trim();
        const section = document.getElementById('quickMeetingSection').value;
        const type = document.getElementById('quickMeetingType').value;
        const notes = document.getElementById('quickMeetingNotes').value.trim();

        if (!title || !section || !type) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const meetingData = {
            id: generateId(),
            title,
            date: document.getElementById('quickMeetingDate').value,
            time: '',
            section,
            type,
            location: '',
            attendees: '',
            keyTopics: '',
            discussionNotes: notes, // Put quick notes here
            decisions: [],
            actionItems: [],
            risks: '',
            parkingLot: '',
            nextSteps: '',
            followupDate: '',
            linkedIssueIds: [],
            createdDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        app.data.meetings.push(meetingData);
        logAudit('create', 'meeting', `Quick captured meeting: ${title}`);

        saveData();
        closeQuickMeetingModal();
        renderMeetingsPage();
        updateNavigationBadges();
        showToast('Meeting captured', 'success');
    }

    // View Meeting Detail with Live Note-Taking
    function viewMeetingDetail(meetingId, editMode = false) {
        const meeting = app.data.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        const linkedIssues = app.data.issues?.filter(i =>
            meeting.linkedIssueIds?.includes(i.id)
        ) || [];

        activeMeetingId = meetingId;

        const modalHtml = `
            <div class="modal-overlay" id="meetingDetailModal">
                <div class="modal" style="max-width: 1000px; max-height: 95vh;">
                    <div class="modal-header" style="background: var(--accent-light); border-bottom: 2px solid var(--accent);">
                        <div>
                            <h2 style="margin-bottom: 4px;">${escapeHtml(meeting.title)}</h2>
                            <div style="font-size: 13px; color: var(--text-2);">
                                ${formatDate(new Date(meeting.date))} ${meeting.time ? '• ' + meeting.time : ''}${meeting.endTime ? '–' + meeting.endTime : ''} ${meeting.location ? '• ' + escapeHtml(meeting.location) : ''}
                            </div>
                        </div>
                        <button class="modal-close" onclick="app.closeMeetingDetailModal()">&times;</button>
                    </div>
                    <div class="modal-body" style="padding: 0;">
                        <!-- Tabs for different note sections -->
                        <div class="tabs" style="border-bottom: 2px solid var(--border); padding: 0 24px; background: var(--surface-2);">
                            <button class="tab-btn active" onclick="app.switchMeetingTab('overview')">Overview</button>
                            <button class="tab-btn" onclick="app.switchMeetingTab('notes')">📝 Notes</button>
                            <button class="tab-btn" onclick="app.switchMeetingTab('decisions')">✓ Decisions</button>
                            <button class="tab-btn" onclick="app.switchMeetingTab('actions')">⚡ Actions</button>
                            <button class="tab-btn" onclick="app.switchMeetingTab('issues')">🎯 Issues</button>
                        </div>

                        <div style="padding: 24px;">
                            <!-- Overview Tab -->
                            <div id="meeting-tab-overview" class="meeting-tab-content">
                                <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                                    <span class="status-badge">${escapeHtml(meeting.type)}</span>
                                    <span class="status-badge">${escapeHtml(meeting.section)}</span>
                                </div>

                                ${getMeetingAttendeesDisplay(meeting) ? `
                                <div style="margin-bottom: 16px;">
                                    <strong>Attendees:</strong> ${escapeHtml(getMeetingAttendeesDisplay(meeting))}
                                </div>
                                ` : ''}

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px;">
                                    <div class="dashboard-subcard">
                                        <h4 style="margin-bottom: 8px;">Meeting Stats</h4>
                                        <div style="font-size: 13px;">
                                            ${meeting.decisions?.length || 0} decisions<br>
                                            ${meeting.actionItems?.length || 0} action items<br>
                                            ${linkedIssues.length} issues identified
                                        </div>
                                    </div>
                                    <div class="dashboard-subcard">
                                        <h4 style="margin-bottom: 8px;">Last Updated</h4>
                                        <div style="font-size: 13px;">
                                            ${formatDate(new Date(meeting.lastUpdated))}<br>
                                            <small style="color: var(--muted);">Created: ${formatDate(new Date(meeting.createdDate))}</small>
                                        </div>
                                    </div>
                                </div>

                                <div style="margin-top: 24px;">
                                    <button class="btn btn-primary" onclick="app.switchMeetingTab('notes')">📝 Add/Edit Notes</button>
                                    <button class="btn btn-secondary" onclick="app.editMeetingBasicInfo('${meeting.id}')">Edit Meeting Info</button>
                                </div>
                            </div>

                            <!-- Notes Tab -->
                            <div id="meeting-tab-notes" class="meeting-tab-content hidden">
                                <h3 style="margin-bottom: 16px;">Meeting Notes</h3>

                                <div class="form-group">
                                    <label><strong>Key Topics Discussed</strong></label>
                                    <textarea id="meetingKeyTopics" class="form-control" rows="3"
                                              placeholder="• Main topics covered&#10;• Key discussion points">${escapeHtml(meeting.keyTopics || '')}</textarea>
                                </div>

                                <div class="form-group">
                                    <label><strong>Discussion Notes / Details</strong></label>
                                    <textarea id="meetingDiscussionNotes" class="form-control" rows="6"
                                              placeholder="Detailed notes from the discussion...&#10;&#10;Use this for free-form notes during the meeting.">${escapeHtml(meeting.discussionNotes || '')}</textarea>
                                </div>

                                <div class="form-group">
                                    <label><strong>Risks / Concerns Raised</strong></label>
                                    <textarea id="meetingRisks" class="form-control" rows="3"
                                              placeholder="• Risk 1&#10;• Risk 2">${escapeHtml(meeting.risks || '')}</textarea>
                                </div>

                                <div class="form-group">
                                    <label><strong>Parking Lot Items</strong></label>
                                    <textarea id="meetingParkingLot" class="form-control" rows="2"
                                              placeholder="Items to discuss later or in a different forum">${escapeHtml(meeting.parkingLot || '')}</textarea>
                                </div>

                                <div class="form-group">
                                    <label><strong>Next Steps / Follow-up</strong></label>
                                    <textarea id="meetingNextSteps" class="form-control" rows="2"
                                              placeholder="What happens next?">${escapeHtml(meeting.nextSteps || '')}</textarea>
                                </div>

                                <div class="form-group">
                                    <label>Follow-up Meeting Date</label>
                                    <input type="date" id="meetingFollowupDate" class="form-control" value="${meeting.followupDate || ''}">
                                </div>

                                <button class="btn btn-primary" onclick="app.saveMeetingNotes('${meeting.id}')">💾 Save Notes</button>
                            </div>

                            <!-- Decisions Tab -->
                            <div id="meeting-tab-decisions" class="meeting-tab-content hidden">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                    <h3 style="margin: 0;">Decisions Made</h3>
                                    <button class="btn btn-primary btn-small" onclick="app.addDecision('${meeting.id}')">+ Add Decision</button>
                                </div>

                                <div id="decisionsList">
                                    ${renderDecisionsList(meeting.decisions || [])}
                                </div>
                            </div>

                            <!-- Actions Tab -->
                            <div id="meeting-tab-actions" class="meeting-tab-content hidden">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                    <h3 style="margin: 0;">Action Items</h3>
                                    <button class="btn btn-primary btn-small" onclick="app.addActionItem('${meeting.id}')">+ Add Action</button>
                                </div>

                                <div id="actionItemsList">
                                    ${renderActionItemsList(meeting.actionItems || [])}
                                </div>
                            </div>

                            <!-- Issues Tab -->
                            <div id="meeting-tab-issues" class="meeting-tab-content hidden">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                    <h3 style="margin: 0;">Issues Identified</h3>
                                    <button class="btn btn-primary btn-small" onclick="app.createIssueFromMeeting('${meeting.id}')">+ Create Issue</button>
                                </div>

                                ${linkedIssues.length > 0 ? `
                                    <div style="display: flex; flex-direction: column; gap: 12px;">
                                        ${linkedIssues.map(issue => `
                                            <div class="issue-card" onclick="app.viewIssueDetail('${issue.id}')" style="cursor: pointer;">
                                                <div class="issue-severity-indicator severity-${issue.severity.toLowerCase()}"></div>
                                                <div class="issue-content">
                                                    <div class="issue-header">
                                                        <div class="issue-title">${escapeHtml(issue.title)}</div>
                                                        <div class="issue-badges">
                                                            <span class="severity-pill severity-${issue.severity.toLowerCase()}">${issue.severity}</span>
                                                            <span class="issue-status-pill issue-status-${issue.status.toLowerCase().replace(' ', '-')}">${issue.status}</span>
                                                        </div>
                                                    </div>
                                                    <div class="issue-meta">
                                                        <div class="issue-meta-item">📂 ${issue.section || 'No section'}</div>
                                                        <div class="issue-meta-item">👤 ${issue.owner || 'Unassigned'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : '<div class="empty-state" style="padding: 32px;"><p>No issues identified yet</p></div>'}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="border-top: 2px solid var(--border);">
                        <button class="btn btn-danger" onclick="app.deleteMeeting('${meeting.id}')">🗑️ Delete Meeting</button>
                        <button class="btn btn-secondary" onclick="app.printMeetingSummary('${meeting.id}')">🖨️ Print Summary</button>
                        <button class="btn btn-secondary" onclick="app.closeMeetingDetailModal()">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // If editMode, switch to notes tab
        if (editMode) {
            setTimeout(() => app.switchMeetingTab('notes'), 50);
        }
    }

    function renderDecisionsList(decisions) {
        if (!decisions || decisions.length === 0) {
            return '<div class="empty-state" style="padding: 32px;"><p>No decisions recorded yet</p></div>';
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
        decisions.forEach(decision => {
            html += `
                <div class="action-item" style="background: var(--success-bg); border-left-color: var(--success);">
                    <div class="action-text">✓ ${escapeHtml(decision.text)}</div>
                    <div class="action-meta">
                        <small>${formatDate(new Date(decision.timestamp))}</small>
                        <button class="btn btn-danger btn-small" onclick="app.removeDecision('${activeMeetingId}', '${decision.id}')" style="margin-left: 8px;">Remove</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    function renderActionItemsList(actionItems) {
        if (!actionItems || actionItems.length === 0) {
            return '<div class="empty-state" style="padding: 32px;"><p>No action items yet</p></div>';
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
        actionItems.forEach(action => {
            const isOverdue = action.dueDate && new Date(action.dueDate) < new Date();
            html += `
                <div class="action-item ${action.status === 'Done' ? '' : (isOverdue ? 'overdue' : 'due-soon')}">
                    <div style="flex: 1;">
                        <div class="action-text">
                            ${action.status === 'Done' ? '✓ ' : ''}${escapeHtml(action.text)}
                        </div>
                        <div class="action-meta">
                            ${action.owner || 'Unassigned'} • Due: ${action.dueDate ? formatDate(new Date(action.dueDate)) : 'No date'}
                            • <strong>${action.status || 'Open'}</strong>
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        ${action.status !== 'Done' ? `<button class="btn btn-success btn-small" onclick="app.toggleActionStatus('${activeMeetingId}', '${action.id}')">✓ Done</button>` : ''}
                        <button class="btn btn-secondary btn-small" onclick="app.editActionItem('${activeMeetingId}', '${action.id}')">Edit</button>
                        <button class="btn btn-danger btn-small" onclick="app.removeActionItem('${activeMeetingId}', '${action.id}')">Remove</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    function switchMeetingTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Show/hide content
        document.querySelectorAll('.meeting-tab-content').forEach(content => content.classList.add('hidden'));
        document.getElementById(`meeting-tab-${tabName}`).classList.remove('hidden');
    }

    function closeMeetingDetailModal() {
        const modal = document.getElementById('meetingDetailModal');
        if (modal) modal.remove();
        activeMeetingId = null;
    }

    function printMeetingSummary(meetingId) {
        const meeting = app.data.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        const attendeeNames = (meeting.attendeeIds || [])
            .map(id => typeof getContactName === 'function' ? getContactName(id) : id)
            .join(', ') || meeting.attendees || '';

        const actions = (meeting.actionItems || []);
        const decisions = (meeting.decisions || []);

        const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${escapeHtml(meeting.title)} — Meeting Summary</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #111; font-size: 14px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { color: #555; margin-bottom: 24px; font-size: 13px; }
  h2 { font-size: 15px; border-bottom: 2px solid #ddd; padding-bottom: 4px; margin-top: 24px; }
  .item { padding: 8px 0; border-bottom: 1px solid #eee; }
  .item:last-child { border-bottom: none; }
  .badge { display: inline-block; background: #e5e7eb; border-radius: 4px; padding: 2px 8px; font-size: 12px; margin-right: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; padding: 6px 8px; background: #f3f4f6; font-size: 12px; }
  td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1>${escapeHtml(meeting.title)}</h1>
<div class="meta">
  ${meeting.date || ''} ${meeting.time ? '• ' + meeting.time : ''}${meeting.endTime ? '–' + meeting.endTime : ''}
  ${meeting.location ? ' • ' + escapeHtml(meeting.location) : ''}
  <span class="badge">${escapeHtml(meeting.type || '')}</span>
  <span class="badge">${escapeHtml(meeting.section || '')}</span>
</div>
${attendeeNames ? `<p><strong>Attendees:</strong> ${escapeHtml(attendeeNames)}</p>` : ''}
${meeting.agenda ? `<h2>Agenda</h2><pre style="font-family:inherit;white-space:pre-wrap;">${escapeHtml(meeting.agenda)}</pre>` : ''}
${meeting.discussionNotes ? `<h2>Discussion Notes</h2><pre style="font-family:inherit;white-space:pre-wrap;">${escapeHtml(meeting.discussionNotes)}</pre>` : ''}
${decisions.length > 0 ? `<h2>Decisions (${decisions.length})</h2>${decisions.map(d => `<div class="item">• ${escapeHtml(d.text || d)}</div>`).join('')}` : ''}
${actions.length > 0 ? `<h2>Action Items (${actions.length})</h2>
<table><tr><th>Action</th><th>Owner</th><th>Due</th><th>Status</th></tr>
${actions.map(a => `<tr><td>${escapeHtml(a.text)}</td><td>${escapeHtml(a.owner || '')}</td><td>${a.dueDate || ''}</td><td>${a.status || ''}</td></tr>`).join('')}
</table>` : ''}
${meeting.risks ? `<h2>Risks / Blockers</h2><p>${escapeHtml(meeting.risks)}</p>` : ''}
${meeting.nextMeetingDate ? `<p><strong>Next Meeting:</strong> ${meeting.nextMeetingDate}</p>` : ''}
<p style="margin-top:40px;color:#999;font-size:11px;">Generated by CI Tracker — ${new Date().toLocaleString()}</p>
</body></html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.print();
    }

    function saveMeetingNotes(meetingId) {
        const meeting = app.data.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        meeting.keyTopics = document.getElementById('meetingKeyTopics').value.trim();
        meeting.discussionNotes = document.getElementById('meetingDiscussionNotes').value.trim();
        meeting.risks = document.getElementById('meetingRisks').value.trim();
        meeting.parkingLot = document.getElementById('meetingParkingLot').value.trim();
        meeting.nextSteps = document.getElementById('meetingNextSteps').value.trim();
        meeting.followupDate = document.getElementById('meetingFollowupDate').value;
        meeting.lastUpdated = new Date().toISOString();

        saveData();
        logAudit('update', 'meeting', `Updated notes for meeting: ${meeting.title}`);
        showToast('Notes saved', 'success');
    }

    function addDecision(meetingId) {
        const decision = prompt('What decision was made?');
        if (!decision || !decision.trim()) return;

        const meeting = app.data.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        if (!meeting.decisions) meeting.decisions = [];
        meeting.decisions.push({
            id: generateId(),
            text: decision.trim(),
            timestamp: new Date().toISOString()
        });

        meeting.lastUpdated = new Date().toISOString();
        saveData();
        logAudit('update', 'meeting', `Added decision to meeting: ${meeting.title}`);

        // Refresh decisions list
        document.getElementById('decisionsList').innerHTML = renderDecisionsList(meeting.decisions);
        showToast('Decision added', 'success');
    }

    function removeDecision(meetingId, decisionId) {
        const meeting = app.data.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        meeting.decisions = meeting.decisions.filter(d => d.id !== decisionId);
        meeting.lastUpdated = new Date().toISOString();
        saveData();

        document.getElementById('decisionsList').innerHTML = renderDecisionsList(meeting.decisions);
        showToast('Decision removed', 'success');
    }

    function addActionItem(meetingId) {
        const text = prompt('Action item description:');
        if (!text || !text.trim()) return;

        const owner = prompt('Owner (optional):');
        const dueDate = prompt('Due date (YYYY-MM-DD, optional):');

        const meeting = app.data.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        if (!meeting.actionItems) meeting.actionItems = [];
        meeting.actionItems.push({
            id: generateId(),
            text: text.trim(),
            owner: owner?.trim() || '',
            dueDate: dueDate?.trim() || '',
            status: 'Open',
            createdDate: new Date().toISOString()
        });

        meeting.lastUpdated = new Date().toISOString();
        saveData();
        logAudit('update', 'meeting', `Added action item to meeting: ${meeting.title}`);

        document.getElementById('actionItemsList').innerHTML = renderActionItemsList(meeting.actionItems);
        showToast('Action item added', 'success');
    }

    function editActionItem(meetingId, actionId) {
        const meeting = app.data.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        const action = meeting.actionItems.find(a => a.id === actionId);
        if (!action) return;

        const text = prompt('Action item description:', action.text);
        if (text === null) return;

        const owner = prompt('Owner:', action.owner);
        if (owner === null) return;

        const dueDate = prompt('Due date (YYYY-MM-DD):', action.dueDate);
        if (dueDate === null) return;

        action.text = text.trim();
        action.owner = owner.trim();
        action.dueDate = dueDate.trim();
        meeting.lastUpdated = new Date().toISOString();

        saveData();
        document.getElementById('actionItemsList').innerHTML = renderActionItemsList(meeting.actionItems);
        showToast('Action item updated', 'success');
    }

    function toggleActionStatus(meetingId, actionId) {
        const meeting = app.data.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        const action = meeting.actionItems.find(a => a.id === actionId);
        if (!action) return;

        action.status = action.status === 'Done' ? 'Open' : 'Done';
        action.completedDate = action.status === 'Done' ? new Date().toISOString() : null;
        meeting.lastUpdated = new Date().toISOString();

        saveData();
        document.getElementById('actionItemsList').innerHTML = renderActionItemsList(meeting.actionItems);
        showToast(`Action marked as ${action.status}`, 'success');
    }

    function removeActionItem(meetingId, actionId) {
        if (!confirm('Remove this action item?')) return;

        const meeting = app.data.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        meeting.actionItems = meeting.actionItems.filter(a => a.id !== actionId);
        meeting.lastUpdated = new Date().toISOString();
        saveData();

        document.getElementById('actionItemsList').innerHTML = renderActionItemsList(meeting.actionItems);
        showToast('Action item removed', 'success');
    }

    function editMeetingBasicInfo(meetingId) {
        const meeting = app.data.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        closeMeetingDetailModal();
        // Show the full create/edit modal with all notes
        showCreateMeetingModal(meeting);
    }

    function deleteMeeting(meetingId) {
        if (!confirm('Delete this meeting? This cannot be undone.')) return;

        const index = app.data.meetings.findIndex(m => m.id === meetingId);
        if (index !== -1) {
            const title = app.data.meetings[index].title;
            app.data.meetings.splice(index, 1);
            saveData();
            logAudit('delete', 'meeting', `Deleted meeting: ${title}`);
            closeMeetingDetailModal();
            renderMeetingsPage();
            updateNavigationBadges();
            showToast('Meeting deleted', 'success');
        }
    }

    function createIssueFromMeeting(meetingId) {
        const meeting = app.data.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        // Prefill issue with meeting context
        const prefillData = {
            section: meeting.section,
            notes: `From meeting: ${meeting.title}\nDate: ${meeting.date}\n\n${meeting.discussionNotes || ''}`
        };

        if (typeof app.showCreateIssueModal === 'function') {
            app.showCreateIssueModal(prefillData);

            // Hook into issue save to link back to meeting
            const originalSaveIssue = app.saveIssue;
            app.saveIssue = function() {
                originalSaveIssue();
                // Link the new issue to the meeting
                const newIssue = app.data.issues[app.data.issues.length - 1];
                if (newIssue) {
                    if (!meeting.linkedIssueIds) meeting.linkedIssueIds = [];
                    if (!meeting.linkedIssueIds.includes(newIssue.id)) {
                        meeting.linkedIssueIds.push(newIssue.id);
                    }
                    if (!newIssue.linkedMeetingIds) newIssue.linkedMeetingIds = [];
                    if (!newIssue.linkedMeetingIds.includes(meetingId)) {
                        newIssue.linkedMeetingIds.push(meetingId);
                    }
                    saveData();

                    // Refresh the issues tab
                    if (activeMeetingId === meetingId) {
                        closeMeetingDetailModal();
                        setTimeout(() => viewMeetingDetail(meetingId), 100);
                    }
                }
                app.saveIssue = originalSaveIssue; // Restore
            };
        } else {
            showToast('Issue module not loaded', 'error');
        }
    }

    function clearMeetingFilters() {
        meetingFilters = {
            search: '',
            section: '',
            type: '',
            dateFrom: '',
            dateTo: ''
        };

        document.getElementById('meeting-search').value = '';
        document.getElementById('meeting-section-filter').value = '';
        document.getElementById('meeting-type-filter').value = '';
        document.getElementById('meeting-date-from').value = '';
        document.getElementById('meeting-date-to').value = '';

        if (currentView === 'list') {
            renderMeetingsList();
        } else {
            renderMeetingsTimeline();
        }
    }

    // Helper functions
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function logAudit(action, entity, description) {
        if (!app.data.auditLog) app.data.auditLog = [];
        app.data.auditLog.push({
            timestamp: new Date().toISOString(),
            action,
            entity,
            description
        });
        if (app.data.auditLog.length > 500) {
            app.data.auditLog = app.data.auditLog.slice(-500);
        }
    }

    // Expose functions to app namespace
    app.pickerSelect       = pickerSelect;
    app.pickerAddNew       = pickerAddNew;
    app.pickerRemove       = pickerRemove;
    app.pickerEditContact  = pickerEditContact;
    app.showCreateMeetingModal = showCreateMeetingModal;
    app.showQuickCaptureMeetingModal = showQuickCaptureMeetingModal;
    app.closeMeetingModal = closeMeetingModal;
    app.closeQuickMeetingModal = closeQuickMeetingModal;
    app.saveMeetingWithNotes = saveMeetingWithNotes;
    app.saveQuickMeeting = saveQuickMeeting;
    app.viewMeetingDetail = viewMeetingDetail;
    app.closeMeetingDetailModal = closeMeetingDetailModal;
    app.switchMeetingTab = switchMeetingTab;
    app.saveMeetingNotes = saveMeetingNotes;
    app.addDecision = addDecision;
    app.removeDecision = removeDecision;
    app.addActionItem = addActionItem;
    app.editActionItem = editActionItem;
    app.toggleActionStatus = toggleActionStatus;
    app.removeActionItem = removeActionItem;
    app.editMeetingBasicInfo = editMeetingBasicInfo;
    app.deleteMeeting = deleteMeeting;
    app.createIssueFromMeeting = createIssueFromMeeting;
    app.switchMeetingView = switchMeetingView;
    app.clearMeetingFilters = clearMeetingFilters;
    app.renderMeetingsPage = renderMeetingsPage;
    app.printMeetingSummary = printMeetingSummary;

})();
