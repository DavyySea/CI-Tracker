/* =========================
   js/areas.js
   Supply Chain Areas — Improvements Tracking
   ========================= */

(function() {
    'use strict';

    const SC_AREAS = [
        { id: 'Planning',        icon: '📅', label: 'Planning' },
        { id: 'Buying',          icon: '🛒', label: 'Buying' },
        { id: 'Receiving',       icon: '📦', label: 'Receiving' },
        { id: 'Warehouse',       icon: '🏪', label: 'Warehouse' },
        { id: 'Logistics',       icon: '🚚', label: 'Logistics' },
        { id: 'Supplier Quality', icon: '✅', label: 'Supplier Quality' },
        { id: 'Scheduling',      icon: '🗓️', label: 'Scheduling' },
    ];

    const IMPROVEMENT_TYPES = [
        'Process Improvement',
        'Kaizen',
        'Error-proofing (Poka-yoke)',
        'Standard Work',
        'Training',
        '5S / Visual Management',
        'Automation',
        'Supplier Development',
        'Other'
    ];

    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAreasModule);
    } else {
        initAreasModule();
    }

    function initAreasModule() {
        if (!app.data.areaImprovements) app.data.areaImprovements = [];
    }

    // ─── Render Areas Page ────────────────────────────────────────────────────

    function renderAreasPage() {
        const container = document.getElementById('areas-grid');
        if (!container) return;

        const improvements = app.data.areaImprovements || [];
        const issues = app.data.issues || [];
        const projects = app.data.projects || [];

        container.innerHTML = SC_AREAS.map(area => {
            const areaImprovements = improvements.filter(i => i.area === area.id);
            const recentImprovement = areaImprovements.length > 0
                ? areaImprovements.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
                : null;

            const openIssues = issues.filter(i => i.area === area.id || i.section === area.id).filter(i => i.status !== 'Closed').length;
            const activeProjects = projects.filter(p => p.area === area.id && p.status !== 'Closed').length;
            const implementedCount = areaImprovements.filter(i => i.status === 'Implemented').length;

            return `
                <div class="area-card" id="area-card-${area.id.replace(/\s+/g, '-')}">
                    <div class="area-card-header">
                        <div class="area-card-title">
                            <span class="area-icon">${area.icon}</span>
                            <span>${area.label}</span>
                        </div>
                        <button class="btn btn-primary btn-small" onclick="showAddImprovementModal('${escapeHtml(area.id)}')">+ Improvement</button>
                    </div>

                    <div class="area-stats">
                        <div class="area-stat area-stat-issues ${openIssues > 0 ? 'has-items' : ''}">
                            <span class="stat-value">${openIssues}</span>
                            <span class="stat-label">Open Issues</span>
                        </div>
                        <div class="area-stat area-stat-projects ${activeProjects > 0 ? 'has-items' : ''}">
                            <span class="stat-value">${activeProjects}</span>
                            <span class="stat-label">Active Projects</span>
                        </div>
                        <div class="area-stat area-stat-improvements">
                            <span class="stat-value">${implementedCount}</span>
                            <span class="stat-label">Improvements</span>
                        </div>
                    </div>

                    <div class="area-improvements-list" id="improvements-${area.id.replace(/\s+/g, '-')}">
                        ${renderImprovementsList(areaImprovements.slice(0, 3))}
                        ${areaImprovements.length > 3 ? `
                            <button class="btn btn-secondary btn-small" style="margin-top:8px;"
                                onclick="showAllImprovements('${escapeHtml(area.id)}')">
                                View all ${areaImprovements.length} improvements
                            </button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderImprovementsList(improvements) {
        if (improvements.length === 0) {
            return '<div class="empty-improvements">No improvements recorded yet</div>';
        }

        return improvements.map(imp => {
            const statusClass = imp.status === 'Implemented' ? 'status-implemented'
                : imp.status === 'In Progress' ? 'status-in-progress'
                : 'status-planned';

            return `
                <div class="improvement-item">
                    <div class="improvement-item-header">
                        <span class="improvement-title">${escapeHtml(imp.title)}</span>
                        <span class="improvement-status ${statusClass}">${escapeHtml(imp.status)}</span>
                    </div>
                    <div class="improvement-meta">
                        <span>${imp.type}</span>
                        ${imp.owner ? `<span>• ${escapeHtml(imp.owner)}</span>` : ''}
                        <span>• ${imp.date}</span>
                    </div>
                    ${imp.impact ? `<div class="improvement-impact">📈 ${escapeHtml(imp.impact)}</div>` : ''}
                    <div class="improvement-item-actions">
                        <button class="btn-link" onclick="editImprovement('${imp.id}')">Edit</button>
                        <button class="btn-link btn-link-danger" onclick="deleteImprovement('${imp.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ─── Show All Improvements for an Area ───────────────────────────────────

    function showAllImprovements(areaId) {
        const area = SC_AREAS.find(a => a.id === areaId);
        if (!area) return;

        const improvements = (app.data.areaImprovements || []).filter(i => i.area === areaId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const existing = document.getElementById('allImprovementsModal');
        if (existing) existing.remove();

        const html = `
            <div class="modal-overlay" id="allImprovementsModal">
                <div class="modal modal-large">
                    <div class="modal-header">
                        <h2>${area.icon} ${area.label} — All Improvements</h2>
                        <button class="modal-close" onclick="document.getElementById('allImprovementsModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom:12px;">
                            <button class="btn btn-primary btn-small" onclick="document.getElementById('allImprovementsModal').remove(); showAddImprovementModal('${escapeHtml(areaId)}')">+ Add Improvement</button>
                        </div>
                        ${improvements.length === 0
                            ? '<div class="empty-state"><p>No improvements recorded yet.</p></div>'
                            : improvements.map(imp => {
                                const statusClass = imp.status === 'Implemented' ? 'status-implemented'
                                    : imp.status === 'In Progress' ? 'status-in-progress'
                                    : 'status-planned';
                                return `
                                    <div class="improvement-item improvement-item-full">
                                        <div class="improvement-item-header">
                                            <span class="improvement-title">${escapeHtml(imp.title)}</span>
                                            <span class="improvement-status ${statusClass}">${escapeHtml(imp.status)}</span>
                                        </div>
                                        <div class="improvement-meta">
                                            <span>${escapeHtml(imp.type)}</span>
                                            ${imp.owner ? `<span>• ${escapeHtml(imp.owner)}</span>` : ''}
                                            <span>• ${imp.date}</span>
                                        </div>
                                        ${imp.description ? `<div class="improvement-description">${escapeHtml(imp.description)}</div>` : ''}
                                        ${imp.impact ? `<div class="improvement-impact">📈 ${escapeHtml(imp.impact)}</div>` : ''}
                                        ${imp.linkedProjectId ? (() => {
                                            const proj = (app.data.projects || []).find(p => p.id === imp.linkedProjectId);
                                            return proj ? `<div class="improvement-meta">📋 Linked project: ${escapeHtml(proj.title)}</div>` : '';
                                        })() : ''}
                                        <div class="improvement-item-actions">
                                            <button class="btn-link" onclick="document.getElementById('allImprovementsModal').remove(); editImprovement('${imp.id}')">Edit</button>
                                            <button class="btn-link btn-link-danger" onclick="deleteImprovement('${imp.id}')">Delete</button>
                                        </div>
                                    </div>`;
                            }).join('')
                        }
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    // ─── Add / Edit Improvement Modal ─────────────────────────────────────────

    function showAddImprovementModal(areaId, prefillData = {}) {
        const existing = document.getElementById('improvementModal');
        if (existing) existing.remove();

        const area = SC_AREAS.find(a => a.id === areaId) || { id: areaId, label: areaId };
        const today = new Date().toISOString().split('T')[0];

        const projectOptions = (app.data.projects || []).map(p =>
            `<option value="${p.id}" ${prefillData.linkedProjectId === p.id ? 'selected' : ''}>${escapeHtml(p.title)}</option>`
        ).join('');

        const typeOptions = IMPROVEMENT_TYPES.map(t =>
            `<option value="${t}" ${(prefillData.type || 'Process Improvement') === t ? 'selected' : ''}>${t}</option>`
        ).join('');

        const html = `
            <div class="modal-overlay" id="improvementModal">
                <div class="modal">
                    <div class="modal-header">
                        <h2>${prefillData.id ? 'Edit' : 'Record'} Improvement — ${area.label}</h2>
                        <button class="modal-close" onclick="closeImprovementModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="improvementForm">
                            <input type="hidden" id="improvementId" value="${prefillData.id || ''}">
                            <input type="hidden" id="improvementArea" value="${escapeHtml(areaId)}">

                            <div class="form-group">
                                <label>Title *</label>
                                <input type="text" id="improvementTitle" class="form-control" required
                                    value="${escapeHtml(prefillData.title || '')}"
                                    placeholder="e.g. Implemented kanban pull system for fasteners">
                            </div>

                            <div class="form-group">
                                <label>Type *</label>
                                <select id="improvementType" class="form-control">
                                    ${typeOptions}
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Status *</label>
                                <select id="improvementStatus" class="form-control">
                                    <option value="Planned" ${(prefillData.status || 'Planned') === 'Planned' ? 'selected' : ''}>Planned</option>
                                    <option value="In Progress" ${prefillData.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="Implemented" ${prefillData.status === 'Implemented' ? 'selected' : ''}>Implemented</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Date *</label>
                                <input type="date" id="improvementDate" class="form-control"
                                    value="${prefillData.date || today}" required>
                            </div>

                            <div class="form-group">
                                <label>Owner</label>
                                <input type="text" id="improvementOwner" class="form-control"
                                    value="${escapeHtml(prefillData.owner || '')}"
                                    placeholder="Person responsible">
                            </div>

                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="improvementDescription" class="form-control" rows="3"
                                    placeholder="What was done and how?">${escapeHtml(prefillData.description || '')}</textarea>
                            </div>

                            <div class="form-group">
                                <label>Impact / Result</label>
                                <input type="text" id="improvementImpact" class="form-control"
                                    value="${escapeHtml(prefillData.impact || '')}"
                                    placeholder="e.g. Reduced lead time by 20%, saved 2hrs/day">
                            </div>

                            <div class="form-group">
                                <label>Linked Project (optional)</label>
                                <select id="improvementProject" class="form-control">
                                    <option value="">None</option>
                                    ${projectOptions}
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeImprovementModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="saveImprovement()">${prefillData.id ? 'Update' : 'Save'} Improvement</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('improvementTitle').focus();
    }

    function closeImprovementModal() {
        const modal = document.getElementById('improvementModal');
        if (modal) modal.remove();
    }

    function saveImprovement() {
        const id = document.getElementById('improvementId').value;
        const area = document.getElementById('improvementArea').value;
        const title = document.getElementById('improvementTitle').value.trim();
        const type = document.getElementById('improvementType').value;
        const status = document.getElementById('improvementStatus').value;
        const date = document.getElementById('improvementDate').value;
        const owner = document.getElementById('improvementOwner').value.trim();
        const description = document.getElementById('improvementDescription').value.trim();
        const impact = document.getElementById('improvementImpact').value.trim();
        const linkedProjectId = document.getElementById('improvementProject').value;

        if (!title || !date) {
            showToast('Title and date are required', 'error');
            return;
        }

        if (!app.data.areaImprovements) app.data.areaImprovements = [];

        const record = { id: id || generateId(), area, title, type, status, date, owner, description, impact, linkedProjectId };

        if (id) {
            const index = app.data.areaImprovements.findIndex(i => i.id === id);
            if (index !== -1) {
                app.data.areaImprovements[index] = record;
                if (typeof logAudit === 'function') logAudit('update', 'improvement', `Updated improvement: ${title}`);
            }
        } else {
            app.data.areaImprovements.push(record);
            if (typeof logAudit === 'function') logAudit('create', 'improvement', `Recorded improvement: ${title} (${area})`);
        }

        saveData();
        closeImprovementModal();
        showToast(`Improvement ${id ? 'updated' : 'recorded'} successfully`, 'success');

        if (app.currentPage === 'areas') renderAreasPage();
    }

    function editImprovement(improvementId) {
        const imp = (app.data.areaImprovements || []).find(i => i.id === improvementId);
        if (!imp) return;
        showAddImprovementModal(imp.area, imp);
    }

    function deleteImprovement(improvementId) {
        const imp = (app.data.areaImprovements || []).find(i => i.id === improvementId);
        if (!imp) return;

        if (!confirm(`Delete improvement "${imp.title}"?`)) return;

        app.data.areaImprovements = (app.data.areaImprovements || []).filter(i => i.id !== improvementId);
        saveData();
        if (typeof logAudit === 'function') logAudit('delete', 'improvement', `Deleted improvement: ${imp.title}`);
        showToast('Improvement deleted', 'success');

        if (app.currentPage === 'areas') renderAreasPage();
    }

    // ─── Expose to global scope ───────────────────────────────────────────────

    window.renderAreasPage = renderAreasPage;
    window.showAddImprovementModal = showAddImprovementModal;
    window.closeImprovementModal = closeImprovementModal;
    window.saveImprovement = saveImprovement;
    window.editImprovement = editImprovement;
    window.deleteImprovement = deleteImprovement;
    window.showAllImprovements = showAllImprovements;

})();
