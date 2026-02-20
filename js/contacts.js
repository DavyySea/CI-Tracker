/* =========================
   js/contacts.js
   Contacts Management Module
   ========================= */

(function() {
    'use strict';

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContactsModule);
    } else {
        initContactsModule();
    }

    function initContactsModule() {
        if (!app.data.contacts) app.data.contacts = [];
    }

    // ─── Render Contacts Page ─────────────────────────────────────────────────

    function renderContactsPage() {
        const container = document.getElementById('contacts-list');
        if (!container) return;

        const contacts = (app.data.contacts || []).slice()
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        if (contacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <p>No contacts yet.</p>
                    <p style="font-size:13px;color:var(--muted);">Add people you work with — their names will be available to select as meeting attendees.</p>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="contacts-grid">${contacts.map(renderContactCard).join('')}</div>`;
    }

    function renderContactCard(contact) {
        const initials = getInitials(contact.name);
        const meetingCount = (app.data.meetings || []).filter(m =>
            (m.attendeeIds || []).includes(contact.id)
        ).length;

        return `
            <div class="contact-card">
                <div class="contact-avatar">${escapeHtml(initials)}</div>
                <div class="contact-info">
                    <div class="contact-name">${escapeHtml(contact.name)}</div>
                    ${contact.title ? `<div class="contact-role">${escapeHtml(contact.title)}${contact.department ? ' · ' + escapeHtml(contact.department) : ''}</div>` : ''}
                    ${contact.email ? `<a class="contact-email" href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>` : ''}
                    ${contact.phone ? `<div class="contact-phone">📞 ${escapeHtml(contact.phone)}</div>` : ''}
                    ${contact.notes ? `<div class="contact-notes">${escapeHtml(contact.notes)}</div>` : ''}
                    ${meetingCount > 0 ? `<span class="contact-meeting-badge">${meetingCount} meeting${meetingCount !== 1 ? 's' : ''}</span>` : ''}
                </div>
                <div class="contact-actions">
                    <button class="btn btn-secondary btn-small" onclick="editContact('${contact.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteContact('${contact.id}')">Delete</button>
                </div>
            </div>`;
    }

    // ─── Contact Modal ────────────────────────────────────────────────────────

    function showContactModal(prefill = {}) {
        const existing = document.getElementById('contactModal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="contactModal">
                <div class="modal">
                    <div class="modal-header">
                        <h2>${prefill.id ? 'Edit Contact' : 'Add Contact'}</h2>
                        <button class="modal-close" onclick="closeContactModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="contactForm">
                            <input type="hidden" id="contactId" value="${prefill.id || ''}">

                            <div class="form-group">
                                <label>Full Name *</label>
                                <input type="text" id="contactName" class="form-control" required
                                    value="${escapeHtml(prefill.name || '')}" placeholder="e.g. Jane Smith">
                            </div>

                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="contactEmail" class="form-control"
                                    value="${escapeHtml(prefill.email || '')}" placeholder="jane@company.com">
                            </div>

                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                                <div class="form-group">
                                    <label>Job Title</label>
                                    <input type="text" id="contactTitle" class="form-control"
                                        value="${escapeHtml(prefill.title || '')}" placeholder="e.g. Buyer">
                                </div>
                                <div class="form-group">
                                    <label>Department</label>
                                    <input type="text" id="contactDepartment" class="form-control"
                                        value="${escapeHtml(prefill.department || '')}" placeholder="e.g. Planning">
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Phone</label>
                                <input type="text" id="contactPhone" class="form-control"
                                    value="${escapeHtml(prefill.phone || '')}" placeholder="555-1234">
                            </div>

                            <div class="form-group">
                                <label>Notes</label>
                                <textarea id="contactNotes" class="form-control" rows="2"
                                    placeholder="Any notes about this person">${escapeHtml(prefill.notes || '')}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeContactModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="saveContact()">${prefill.id ? 'Update' : 'Add'} Contact</button>
                    </div>
                </div>
            </div>
        `);
        document.getElementById('contactName').focus();
    }

    function closeContactModal() {
        const modal = document.getElementById('contactModal');
        if (modal) modal.remove();
    }

    function saveContact() {
        const id   = document.getElementById('contactId').value;
        const name = document.getElementById('contactName').value.trim();
        if (!name) { showToast('Name is required', 'error'); return; }

        if (!app.data.contacts) app.data.contacts = [];

        const existing = id ? (app.data.contacts || []).find(c => c.id === id) : null;
        const contact = {
            id:         id || generateId(),
            name,
            email:      document.getElementById('contactEmail').value.trim(),
            title:      document.getElementById('contactTitle').value.trim(),
            department: document.getElementById('contactDepartment').value.trim(),
            phone:      document.getElementById('contactPhone').value.trim(),
            notes:      document.getElementById('contactNotes').value.trim(),
            createdDate: existing?.createdDate || new Date().toISOString()
        };

        if (id) {
            const idx = app.data.contacts.findIndex(c => c.id === id);
            if (idx !== -1) app.data.contacts[idx] = contact;
            if (typeof logAudit === 'function') logAudit('update', 'contact', `Updated contact: ${name}`);
        } else {
            app.data.contacts.push(contact);
            if (typeof logAudit === 'function') logAudit('create', 'contact', `Added contact: ${name}`);
        }

        saveData();
        closeContactModal();
        showToast(`Contact ${id ? 'updated' : 'added'}`, 'success');
        if (app.currentPage === 'contacts') renderContactsPage();
    }

    function editContact(contactId) {
        const c = (app.data.contacts || []).find(c => c.id === contactId);
        if (c) showContactModal(c);
    }

    function deleteContact(contactId) {
        const c = (app.data.contacts || []).find(c => c.id === contactId);
        if (!c) return;
        if (!confirm(`Delete contact "${c.name}"?`)) return;

        app.data.contacts = (app.data.contacts || []).filter(x => x.id !== contactId);
        saveData();
        if (typeof logAudit === 'function') logAudit('delete', 'contact', `Deleted contact: ${c.name}`);
        showToast('Contact deleted', 'success');
        if (app.currentPage === 'contacts') renderContactsPage();
    }

    // ─── Public helpers for attendee picker ──────────────────────────────────

    function searchContacts(query) {
        const q = (query || '').toLowerCase();
        return (app.data.contacts || []).filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.email && c.email.toLowerCase().includes(q))
        );
    }

    function getContactById(id) {
        return (app.data.contacts || []).find(c => c.id === id);
    }

    function getContactName(id) {
        const c = getContactById(id);
        return c ? c.name : id;
    }

    // Create a minimal contact from just a name (used by attendee picker "add new" flow)
    function createContactFromName(name) {
        if (!app.data.contacts) app.data.contacts = [];
        const contact = {
            id: generateId(),
            name: name.trim(),
            email: '', title: '', department: '', phone: '', notes: '',
            createdDate: new Date().toISOString()
        };
        app.data.contacts.push(contact);
        saveData();
        if (app.currentPage === 'contacts') renderContactsPage();
        return contact;
    }

    // ─── Expose ───────────────────────────────────────────────────────────────

    window.renderContactsPage   = renderContactsPage;
    window.showContactModal     = showContactModal;
    window.closeContactModal    = closeContactModal;
    window.saveContact          = saveContact;
    window.editContact          = editContact;
    window.deleteContact        = deleteContact;
    window.searchContacts       = searchContacts;
    window.getContactById       = getContactById;
    window.getContactName       = getContactName;
    window.createContactFromName = createContactFromName;

})();
