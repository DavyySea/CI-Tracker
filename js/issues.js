/* =========================
   js/issues.js
   Complete Issue Management Module
   ========================= */

(function() {
    'use strict';

    // Current filters state
    let issueFilters = {
        search: '',
        section: '',
        status: '',
        severity: '',
        type: '',
        owner: '',
        product: ''
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIssuesModule);
    } else {
        initIssuesModule();
    }

    function initIssuesModule() {
        setupIssueFilters();
        setupIssuePageListeners();

        // Hook into page navigation
        const originalRenderCurrentPage = window.renderCurrentPage;
        if (originalRenderCurrentPage) {
            window.renderCurrentPage = function() {
                originalRenderCurrentPage();
                if (app.currentPage === 'issues') {
                    renderIssuesPage();
                }
            };
        }
    }

    function setupIssueFilters() {
        const searchInput = document.getElementById('issue-search');
        const sectionFilter = document.getElementById('issue-section-filter');
        const statusFilter = document.getElementById('issue-status-filter');
        const severityFilter = document.getElementById('issue-severity-filter');
        const typeFilter = document.getElementById('issue-type-filter');
        const ownerFilter = document.getElementById('issue-owner-filter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                issueFilters.search = e.target.value.toLowerCase();
                renderIssuesList();
            });
        }

        if (sectionFilter) {
            sectionFilter.addEventListener('change', (e) => {
                issueFilters.section = e.target.value;
                renderIssuesList();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                issueFilters.status = e.target.value;
                renderIssuesList();
            });
        }

        if (severityFilter) {
            severityFilter.addEventListener('change', (e) => {
                issueFilters.severity = e.target.value;
                renderIssuesList();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                issueFilters.type = e.target.value;
                renderIssuesList();
            });
        }

        if (ownerFilter) {
            ownerFilter.addEventListener('change', (e) => {
                issueFilters.owner = e.target.value;
                renderIssuesList();
            });
        }

        const productFilter = document.getElementById('issue-product-filter');
        if (productFilter) {
            productFilter.addEventListener('change', (e) => {
                issueFilters.product = e.target.value;
                renderIssuesList();
            });
            populateIssueProductFilter();
        }

        // Populate owner filter
        populateOwnerFilter();
    }

    function setupIssuePageListeners() {
        const createBtn = document.querySelector('#page-issues .btn-primary');
        if (createBtn) {
            createBtn.addEventListener('click', showCreateIssueModal);
        }
    }

    function populateOwnerFilter() {
        const ownerFilter = document.getElementById('issue-owner-filter');
        if (!ownerFilter || !app.data.issues) return;

        const owners = new Set();
        app.data.issues.forEach(issue => {
            if (issue.owner) owners.add(issue.owner);
        });
        app.data.projects.forEach(proj => {
            if (proj.owner) owners.add(proj.owner);
        });

        const currentValue = ownerFilter.value;
        ownerFilter.innerHTML = '<option value="">All Owners</option>';
        Array.from(owners).sort().forEach(owner => {
            ownerFilter.innerHTML += `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`;
        });
        ownerFilter.value = currentValue;
    }

    function populateIssueProductFilter() {
        const productFilter = document.getElementById('issue-product-filter');
        if (!productFilter) return;

        const products = app.data.products || [];
        const currentValue = productFilter.value;
        productFilter.innerHTML = '<option value="">All Products</option>';
        products.forEach(p => {
            productFilter.innerHTML += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.code ? ' (' + escapeHtml(p.code) + ')' : ''}</option>`;
        });
        productFilter.value = currentValue;
    }

    // Render Issues Page
    function renderIssuesPage() {
        renderTriagePanel();
        renderIssuesList();
        populateOwnerFilter();
        populateIssueProductFilter();
    }

    function renderTriagePanel() {
        const panel = document.getElementById('triagePanel');
        if (!panel || !app.data.issues) return;

        const today = new Date();
        const triageIssues = app.data.issues.filter(issue => {
            if (issue.status === 'Closed') return false;

            // Issues with upcoming or overdue actions
            if (issue.nextActionDueDate) {
                const actionDate = new Date(issue.nextActionDueDate);
                const daysUntil = Math.ceil((actionDate - today) / (1000 * 60 * 60 * 24));
                if (daysUntil <= 7) return true;
            }

            // New critical/high issues
            if (issue.status === 'New' && (issue.severity === 'Critical' || issue.severity === 'High')) {
                return true;
            }

            return false;
        });

        if (triageIssues.length === 0) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        let html = '<h3>⚠️ Requires Immediate Attention</h3>';
        html += '<div class="triage-list">';

        triageIssues.slice(0, 5).forEach(issue => {
            const daysOverdue = issue.nextActionDueDate ?
                Math.ceil((today - new Date(issue.nextActionDueDate)) / (1000 * 60 * 60 * 24)) : 0;

            html += `
                <div class="action-item ${daysOverdue > 0 ? 'overdue' : 'due-soon'}"
                     style="cursor: pointer;"
                     onclick="app.viewIssueDetail('${issue.id}')">
                    <div class="action-text">
                        <strong>${escapeHtml(issue.title)}</strong>
                        ${issue.nextAction ? `<br><small>${escapeHtml(issue.nextAction)}</small>` : ''}
                    </div>
                    <div class="action-meta">
                        <span class="severity-${issue.severity.toLowerCase()}">${issue.severity}</span>
                        ${issue.nextActionDueDate ? ` • ${daysOverdue > 0 ? daysOverdue + 'd overdue' : 'Due ' + formatDate(new Date(issue.nextActionDueDate))}` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        panel.innerHTML = html;
    }

    function renderIssuesList() {
        const container = document.getElementById('issue-list');
        if (!container || !app.data.issues) return;

        let filteredIssues = app.data.issues.filter(issue => {
            if (issueFilters.search && !issue.title.toLowerCase().includes(issueFilters.search)) {
                return false;
            }
            if (issueFilters.section && issue.section !== issueFilters.section) {
                return false;
            }
            if (issueFilters.status && issue.status !== issueFilters.status) {
                return false;
            }
            if (issueFilters.severity && issue.severity !== issueFilters.severity) {
                return false;
            }
            if (issueFilters.type && issue.type !== issueFilters.type) {
                return false;
            }
            if (issueFilters.owner && issue.owner !== issueFilters.owner) {
                return false;
            }
            if (issueFilters.product && !(issue.productIds || []).includes(issueFilters.product)) {
                return false;
            }
            return true;
        });

        // Sort by severity and date
        const severityOrder = { 'Critical': 0, 'High': 1, 'Med': 2, 'Low': 3 };
        filteredIssues.sort((a, b) => {
            const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (severityDiff !== 0) return severityDiff;
            return new Date(b.createdDate) - new Date(a.createdDate);
        });

        if (filteredIssues.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎯</div><p>No issues found</p></div>';
            return;
        }

        let html = '';
        filteredIssues.forEach(issue => {
            html += renderIssueCard(issue);
        });
        container.innerHTML = html;
    }

    function renderIssueCard(issue) {
        const linkedProjects = issue.linkedProjectIds?.length || 0;
        const linkedMeetings = issue.linkedMeetingIds?.length || 0;
        const linkedAARs = issue.linkedAarIds?.length || 0;

        return `
            <div class="issue-card" onclick="app.viewIssueDetail('${issue.id}')">
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
                        ${issue.section ? `<div class="issue-meta-item">📂 ${escapeHtml(issue.section)}</div>` : ''}
                        ${issue.type ? `<div class="issue-meta-item">🏷️ ${escapeHtml(issue.type)}</div>` : ''}
                        ${issue.owner ? `<div class="issue-meta-item">👤 ${escapeHtml(issue.owner)}</div>` : ''}
                        ${issue.createdDate ? `<div class="issue-meta-item">📅 ${formatDate(new Date(issue.createdDate))}</div>` : ''}
                        ${linkedProjects > 0 ? `<div class="issue-meta-item">📋 ${linkedProjects} project(s)</div>` : ''}
                        ${linkedMeetings > 0 ? `<div class="issue-meta-item">🗓️ ${linkedMeetings} meeting(s)</div>` : ''}
                        ${linkedAARs > 0 ? `<div class="issue-meta-item">📝 ${linkedAARs} AAR(s)</div>` : ''}
                    </div>
                    ${(issue.productIds || []).length > 0 ? `<div class="product-tags">${(issue.productIds || []).map(pid => { const p = (app.data.products || []).find(p => p.id === pid); return p ? `<span class="product-tag">${escapeHtml(p.name)}</span>` : ''; }).join('')}</div>` : ''}
                </div>
            </div>
        `;
    }

    // Create Issue Modal
    function showCreateIssueModal(prefillData = {}) {
        const modalHtml = `
            <div class="modal-overlay" id="issueModal">
                <div class="modal">
                    <div class="modal-header">
                        <h2>${prefillData.id ? 'Edit Issue' : 'New Issue'}</h2>
                        <button class="modal-close" onclick="app.closeIssueModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="issueForm">
                            <input type="hidden" id="issueId" value="${prefillData.id || ''}">

                            <div class="form-group">
                                <label>Title *</label>
                                <input type="text" id="issueTitle" class="form-control" required value="${escapeHtml(prefillData.title || '')}">
                            </div>

                            <div class="form-group">
                                <label>Section/Category *</label>
                                <select id="issueSection" class="form-control" required>
                                    <option value="">Select Section</option>
                                    <option value="Electrical" ${prefillData.section === 'Electrical' ? 'selected' : ''}>Electrical</option>
                                    <option value="Mechanical" ${prefillData.section === 'Mechanical' ? 'selected' : ''}>Mechanical</option>
                                    <option value="Procurement" ${prefillData.section === 'Procurement' ? 'selected' : ''}>Procurement</option>
                                    <option value="Manufacturing" ${prefillData.section === 'Manufacturing' ? 'selected' : ''}>Manufacturing</option>
                                    <option value="Warehouse" ${prefillData.section === 'Warehouse' ? 'selected' : ''}>Warehouse</option>
                                    <option value="Quality" ${prefillData.section === 'Quality' ? 'selected' : ''}>Quality</option>
                                    <option value="Planning" ${prefillData.section === 'Planning' ? 'selected' : ''}>Planning</option>
                                    <option value="Other" ${prefillData.section === 'Other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Area (Specific)</label>
                                <input type="text" id="issueArea" class="form-control" placeholder="e.g., Receiving, CNC Mill, Kitting" value="${escapeHtml(prefillData.area || '')}">
                            </div>

                            <div class="form-group">
                                <label>Severity *</label>
                                <select id="issueSeverity" class="form-control" required>
                                    <option value="Low" ${prefillData.severity === 'Low' ? 'selected' : ''}>Low</option>
                                    <option value="Med" ${prefillData.severity === 'Med' ? 'selected' : ''}>Med</option>
                                    <option value="High" ${prefillData.severity === 'High' ? 'selected' : ''}>High</option>
                                    <option value="Critical" ${prefillData.severity === 'Critical' ? 'selected' : ''}>Critical</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Type *</label>
                                <select id="issueType" class="form-control" required>
                                    <option value="">Select Type</option>
                                    <option value="Shortage" ${prefillData.type === 'Shortage' ? 'selected' : ''}>Shortage</option>
                                    <option value="Late supplier" ${prefillData.type === 'Late supplier' ? 'selected' : ''}>Late supplier</option>
                                    <option value="Quality escape" ${prefillData.type === 'Quality escape' ? 'selected' : ''}>Quality escape</option>
                                    <option value="Process waste" ${prefillData.type === 'Process waste' ? 'selected' : ''}>Process waste</option>
                                    <option value="Safety risk" ${prefillData.type === 'Safety risk' ? 'selected' : ''}>Safety risk</option>
                                    <option value="Cost overrun" ${prefillData.type === 'Cost overrun' ? 'selected' : ''}>Cost overrun</option>
                                    <option value="Scheduling conflict" ${prefillData.type === 'Scheduling conflict' ? 'selected' : ''}>Scheduling conflict</option>
                                    <option value="Other" ${prefillData.type === 'Other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Status</label>
                                <select id="issueStatus" class="form-control">
                                    <option value="New" ${!prefillData.status || prefillData.status === 'New' ? 'selected' : ''}>New</option>
                                    <option value="Triaged" ${prefillData.status === 'Triaged' ? 'selected' : ''}>Triaged</option>
                                    <option value="Investigating" ${prefillData.status === 'Investigating' ? 'selected' : ''}>Investigating</option>
                                    <option value="In DMAIC" ${prefillData.status === 'In DMAIC' ? 'selected' : ''}>In DMAIC</option>
                                    <option value="Monitoring" ${prefillData.status === 'Monitoring' ? 'selected' : ''}>Monitoring</option>
                                    <option value="Closed" ${prefillData.status === 'Closed' ? 'selected' : ''}>Closed</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Owner</label>
                                <input type="text" id="issueOwner" class="form-control" value="${escapeHtml(prefillData.owner || '')}">
                            </div>

                            <div class="form-group">
                                <label>Stakeholders</label>
                                <input type="text" id="issueStakeholders" class="form-control" placeholder="Comma-separated" value="${escapeHtml(prefillData.stakeholders || '')}">
                            </div>

                            <div class="form-group">
                                <label>Root Cause Category</label>
                                <select id="issueRootCause" class="form-control">
                                    <option value="">Not determined yet</option>
                                    <option value="People/Training" ${prefillData.rootCauseCategory === 'People/Training' ? 'selected' : ''}>People/Training</option>
                                    <option value="Process" ${prefillData.rootCauseCategory === 'Process' ? 'selected' : ''}>Process</option>
                                    <option value="Technology" ${prefillData.rootCauseCategory === 'Technology' ? 'selected' : ''}>Technology</option>
                                    <option value="Materials/Suppliers" ${prefillData.rootCauseCategory === 'Materials/Suppliers' ? 'selected' : ''}>Materials/Suppliers</option>
                                    <option value="Environment" ${prefillData.rootCauseCategory === 'Environment' ? 'selected' : ''}>Environment</option>
                                    <option value="Communication" ${prefillData.rootCauseCategory === 'Communication' ? 'selected' : ''}>Communication</option>
                                    <option value="Design" ${prefillData.rootCauseCategory === 'Design' ? 'selected' : ''}>Design</option>
                                    <option value="Other" ${prefillData.rootCauseCategory === 'Other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Impact - Cost (USD)</label>
                                <input type="number" id="issueImpactCost" class="form-control" value="${prefillData.impact?.costUSD || ''}">
                            </div>

                            <div class="form-group">
                                <label>Impact - Time (Hours)</label>
                                <input type="number" id="issueImpactTime" class="form-control" value="${prefillData.impact?.timeHours || ''}">
                            </div>

                            <div class="form-group">
                                <label>Impact - Units Affected</label>
                                <input type="number" id="issueImpactUnits" class="form-control" value="${prefillData.impact?.units || ''}">
                            </div>

                            <div class="form-group">
                                <label>Impact - Schedule Days</label>
                                <input type="number" id="issueImpactSchedule" class="form-control" value="${prefillData.impact?.scheduleDays || ''}">
                            </div>

                            <div class="form-group">
                                <label>Impact Notes</label>
                                <textarea id="issueImpactNotes" class="form-control" rows="2">${escapeHtml(prefillData.impact?.notes || '')}</textarea>
                            </div>

                            <div class="form-group">
                                <label>Evidence/Attachments (text links)</label>
                                <textarea id="issueEvidence" class="form-control" rows="2" placeholder="Links to photos, documents, etc.">${escapeHtml(prefillData.evidence || '')}</textarea>
                            </div>

                            <div class="form-group">
                                <label>Notes</label>
                                <textarea id="issueNotes" class="form-control" rows="3">${escapeHtml(prefillData.notes || '')}</textarea>
                            </div>

                            <div class="form-group">
                                <label>Next Action</label>
                                <input type="text" id="issueNextAction" class="form-control" value="${escapeHtml(prefillData.nextAction || '')}">
                            </div>

                            <div class="form-group">
                                <label>Next Action Due Date</label>
                                <input type="date" id="issueNextActionDate" class="form-control" value="${prefillData.nextActionDueDate || ''}">
                            </div>

                            <div class="form-group">
                                <label>Product(s)</label>
                                <select id="issueProducts" class="form-control" multiple size="3">
                                    ${(app.data.products || []).map(p => `<option value="${escapeHtml(p.id)}" ${(prefillData.productIds || []).includes(p.id) ? 'selected' : ''}>${escapeHtml(p.name)}${p.code ? ' (' + escapeHtml(p.code) + ')' : ''}</option>`).join('')}
                                </select>
                                <small>Hold Ctrl/Cmd to select multiple${(app.data.products || []).length === 0 ? ' — add products in the Products page first' : ''}</small>
                            </div>

                            <div class="form-group">
                                <label>Tags (comma-separated)</label>
                                <input type="text" id="issueTags" class="form-control" value="${prefillData.tags?.join(', ') || ''}">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="app.closeIssueModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="app.saveIssue()">${prefillData.id ? 'Update' : 'Create'} Issue</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    function closeIssueModal() {
        const modal = document.getElementById('issueModal');
        if (modal) modal.remove();
    }

    function saveIssue() {
        const id = document.getElementById('issueId').value;
        const title = document.getElementById('issueTitle').value.trim();
        const section = document.getElementById('issueSection').value;
        const severity = document.getElementById('issueSeverity').value;
        const type = document.getElementById('issueType').value;

        if (!title || !section || !severity || !type) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        const issueData = {
            id: id || generateId(),
            title,
            section,
            area: document.getElementById('issueArea').value.trim(),
            severity,
            type,
            status: document.getElementById('issueStatus').value,
            owner: document.getElementById('issueOwner').value.trim(),
            stakeholders: document.getElementById('issueStakeholders').value.trim(),
            rootCauseCategory: document.getElementById('issueRootCause').value,
            impact: {
                costUSD: parseFloat(document.getElementById('issueImpactCost').value) || 0,
                timeHours: parseFloat(document.getElementById('issueImpactTime').value) || 0,
                units: parseFloat(document.getElementById('issueImpactUnits').value) || 0,
                scheduleDays: parseFloat(document.getElementById('issueImpactSchedule').value) || 0,
                notes: document.getElementById('issueImpactNotes').value.trim()
            },
            evidence: document.getElementById('issueEvidence').value.trim(),
            notes: document.getElementById('issueNotes').value.trim(),
            nextAction: document.getElementById('issueNextAction').value.trim(),
            nextActionDueDate: document.getElementById('issueNextActionDate').value,
            tags: document.getElementById('issueTags').value.split(',').map(t => t.trim()).filter(t => t),
            productIds: Array.from(document.getElementById('issueProducts')?.selectedOptions || []).map(o => o.value),
            linkedMeetingIds: [],
            linkedProjectIds: [],
            linkedAarIds: [],
            createdDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        if (id) {
            // Update existing
            const index = app.data.issues.findIndex(i => i.id === id);
            if (index !== -1) {
                issueData.createdDate = app.data.issues[index].createdDate;
                issueData.linkedMeetingIds = app.data.issues[index].linkedMeetingIds || [];
                issueData.linkedProjectIds = app.data.issues[index].linkedProjectIds || [];
                issueData.linkedAarIds = app.data.issues[index].linkedAarIds || [];
                app.data.issues[index] = issueData;
                logAudit('update', 'issue', `Updated issue: ${title}`);
            }
        } else {
            // Create new
            app.data.issues.push(issueData);
            logAudit('create', 'issue', `Created issue: ${title}`);
        }

        saveData();
        closeIssueModal();
        renderIssuesPage();
        updateNavigationBadges();
        showToast(id ? 'Issue updated' : 'Issue created', 'success');
    }

    // View Issue Detail
    function viewIssueDetail(issueId) {
        const issue = app.data.issues.find(i => i.id === issueId);
        if (!issue) return;

        const linkedProjects = app.data.projects.filter(p =>
            issue.linkedProjectIds?.includes(p.id)
        );
        const linkedMeetings = app.data.meetings?.filter(m =>
            issue.linkedMeetingIds?.includes(m.id)
        ) || [];
        const linkedAARs = app.data.aars.filter(a =>
            issue.linkedAarIds?.includes(a.id)
        );

        const modalHtml = `
            <div class="modal-overlay" id="issueDetailModal">
                <div class="modal" style="max-width: 900px;">
                    <div class="modal-header">
                        <h2>${escapeHtml(issue.title)}</h2>
                        <button class="modal-close" onclick="app.closeIssueDetailModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                            <span class="severity-pill severity-${issue.severity.toLowerCase()}">${issue.severity}</span>
                            <span class="issue-status-pill issue-status-${issue.status.toLowerCase().replace(' ', '-')}">${issue.status}</span>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div><strong>Section:</strong> ${issue.section || 'N/A'}</div>
                            <div><strong>Area:</strong> ${issue.area || 'N/A'}</div>
                            <div><strong>Type:</strong> ${issue.type || 'N/A'}</div>
                            <div><strong>Owner:</strong> ${issue.owner || 'Unassigned'}</div>
                            <div><strong>Created:</strong> ${formatDate(new Date(issue.createdDate))}</div>
                            <div><strong>Last Updated:</strong> ${formatDate(new Date(issue.lastUpdated))}</div>
                        </div>

                        ${issue.stakeholders ? `<div style="margin-bottom: 16px;"><strong>Stakeholders:</strong> ${escapeHtml(issue.stakeholders)}</div>` : ''}

                        ${issue.rootCauseCategory ? `
                        <div style="margin-bottom: 16px;">
                            <strong>Root Cause Category:</strong> ${escapeHtml(issue.rootCauseCategory)}
                        </div>
                        ` : ''}

                        <div style="margin-bottom: 16px;">
                            <strong>Impact:</strong><br>
                            ${issue.impact.costUSD ? `Cost: $${issue.impact.costUSD.toLocaleString()}<br>` : ''}
                            ${issue.impact.timeHours ? `Time: ${issue.impact.timeHours} hours<br>` : ''}
                            ${issue.impact.units ? `Units: ${issue.impact.units}<br>` : ''}
                            ${issue.impact.scheduleDays ? `Schedule: ${issue.impact.scheduleDays} days<br>` : ''}
                            ${issue.impact.notes ? `<small>${escapeHtml(issue.impact.notes)}</small>` : ''}
                        </div>

                        ${issue.notes ? `
                        <div style="margin-bottom: 16px;">
                            <strong>Notes:</strong><br>
                            <div style="background: var(--surface-2); padding: 12px; border-radius: 6px; white-space: pre-wrap;">${escapeHtml(issue.notes)}</div>
                        </div>
                        ` : ''}

                        ${issue.evidence ? `
                        <div style="margin-bottom: 16px;">
                            <strong>Evidence:</strong><br>
                            <div style="background: var(--surface-2); padding: 12px; border-radius: 6px; white-space: pre-wrap;">${escapeHtml(issue.evidence)}</div>
                        </div>
                        ` : ''}

                        ${issue.nextAction ? `
                        <div style="margin-bottom: 16px; padding: 12px; background: var(--accent-light); border-radius: 6px;">
                            <strong>Next Action:</strong> ${escapeHtml(issue.nextAction)}<br>
                            ${issue.nextActionDueDate ? `<strong>Due:</strong> ${formatDate(new Date(issue.nextActionDueDate))}` : ''}
                        </div>
                        ` : ''}

                        ${issue.tags && issue.tags.length > 0 ? `
                        <div style="margin-bottom: 16px;">
                            <strong>Tags:</strong> ${issue.tags.map(t => `<span class="status-badge">${escapeHtml(t)}</span>`).join(' ')}
                        </div>
                        ` : ''}

                        ${(issue.productIds || []).length > 0 ? `
                        <div style="margin-bottom: 16px;">
                            <strong>Products:</strong>
                            <div class="product-tags" style="margin-top: 4px;">
                                ${(issue.productIds || []).map(pid => {
                                    const p = (app.data.products || []).find(p => p.id === pid);
                                    return p ? `<span class="product-tag">${escapeHtml(p.name)}</span>` : '';
                                }).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border);">

                        <div style="margin-bottom: 16px;">
                            <strong>Linked Items:</strong><br>
                            ${linkedProjects.length > 0 ? `
                                <div style="margin-top: 8px;">
                                    <strong>Projects (${linkedProjects.length}):</strong><br>
                                    ${linkedProjects.map(p => `<span class="status-badge" style="cursor: pointer;" onclick="navigateToPage('projects'); app.viewProjectDetail('${p.id}');">${escapeHtml(p.title)}</span>`).join(' ')}
                                </div>
                            ` : ''}
                            ${linkedMeetings.length > 0 ? `
                                <div style="margin-top: 8px;">
                                    <strong>Meetings (${linkedMeetings.length}):</strong><br>
                                    ${linkedMeetings.map(m => `<span class="status-badge">${escapeHtml(m.title || 'Untitled')}</span>`).join(' ')}
                                </div>
                            ` : ''}
                            ${linkedAARs.length > 0 ? `
                                <div style="margin-top: 8px;">
                                    <strong>AARs (${linkedAARs.length}):</strong><br>
                                    ${linkedAARs.map(a => `<span class="status-badge" style="cursor: pointer;" onclick="navigateToPage('aar'); app.viewAARDetail('${a.id}');">${escapeHtml(a.title)}</span>`).join(' ')}
                                </div>
                            ` : ''}
                        </div>

                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 20px;">
                            <button class="btn btn-secondary" onclick="app.editIssue('${issue.id}')">✏️ Edit</button>
                            <button class="btn btn-primary" onclick="app.convertIssueToProject('${issue.id}')">📋 Convert to DMAIC Project</button>
                            <button class="btn btn-secondary" onclick="app.createAARFromIssue('${issue.id}')">📝 Add AAR</button>
                            <button class="btn btn-secondary" onclick="app.startVSMForIssue('${issue.id}')">🗺️ Start VSM</button>
                            ${issue.status !== 'Closed' ? `<button class="btn btn-success" onclick="app.closeIssue('${issue.id}')">✓ Close Issue</button>` : ''}
                            <button class="btn btn-danger" onclick="app.deleteIssue('${issue.id}')">🗑️ Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    function closeIssueDetailModal() {
        const modal = document.getElementById('issueDetailModal');
        if (modal) modal.remove();
    }

    function editIssue(issueId) {
        const issue = app.data.issues.find(i => i.id === issueId);
        if (!issue) return;

        closeIssueDetailModal();
        showCreateIssueModal(issue);
    }

    function closeIssue(issueId) {
        if (!confirm('Mark this issue as closed?')) return;

        const issue = app.data.issues.find(i => i.id === issueId);
        if (issue) {
            issue.status = 'Closed';
            issue.lastUpdated = new Date().toISOString();
            saveData();
            logAudit('update', 'issue', `Closed issue: ${issue.title}`);
            closeIssueDetailModal();
            renderIssuesPage();
            showToast('Issue closed', 'success');
        }
    }

    function deleteIssue(issueId) {
        if (!confirm('Delete this issue? This cannot be undone.')) return;

        const index = app.data.issues.findIndex(i => i.id === issueId);
        if (index !== -1) {
            const title = app.data.issues[index].title;
            app.data.issues.splice(index, 1);
            saveData();
            logAudit('delete', 'issue', `Deleted issue: ${title}`);
            closeIssueDetailModal();
            renderIssuesPage();
            updateNavigationBadges();
            showToast('Issue deleted', 'success');
        }
    }

    function convertIssueToProject(issueId) {
        const issue = app.data.issues.find(i => i.id === issueId);
        if (!issue) return;

        if (!confirm(`Convert "${issue.title}" into a DMAIC project?`)) return;

        const projectId = generateId();
        const newProject = {
            id: projectId,
            title: issue.title,
            area: issue.section || 'Other',
            problemStatement: issue.notes || `Issue: ${issue.title}. Type: ${issue.type}. Impact: $${issue.impact.costUSD || 0}, ${issue.impact.timeHours || 0} hours.`,
            impactedKPIs: [],
            owner: issue.owner || '',
            stakeholders: issue.stakeholders || '',
            startDate: formatDate(new Date()),
            dueDate: '',
            status: 'Define',
            health: 'On Track',
            priority: issue.severity === 'Critical' || issue.severity === 'High' ? 'High' : 'Med',
            expectedImpact: issue.impact.notes || '',
            actualImpact: '',
            lastUpdated: formatDate(new Date()),
            nextUpdateDate: '',
            actions: issue.nextAction ? [{
                id: generateId(),
                text: issue.nextAction,
                owner: issue.owner || '',
                dueDate: issue.nextActionDueDate || '',
                status: 'Open',
                blockerNote: ''
            }] : [],
            links: [],
            notes: `Converted from issue: ${issue.title}`
        };

        app.data.projects.push(newProject);

        // Link issue to project
        if (!issue.linkedProjectIds) issue.linkedProjectIds = [];
        issue.linkedProjectIds.push(projectId);
        issue.status = 'In DMAIC';
        issue.lastUpdated = new Date().toISOString();

        saveData();
        logAudit('create', 'project', `Created project from issue: ${issue.title}`);
        closeIssueDetailModal();
        showToast('Project created from issue', 'success');

        // Navigate to projects page
        setTimeout(() => {
            navigateToPage('projects');
        }, 1000);
    }

    function createAARFromIssue(issueId) {
        closeIssueDetailModal();
        showToast('AAR creation from issue - feature coming in AAR module', 'info');
        // This will be implemented when AAR functionality is enhanced
    }

    function startVSMForIssue(issueId) {
        const issue = app.data.issues.find(i => i.id === issueId);
        if (!issue) return;

        closeIssueDetailModal();

        if (typeof app.openVSMModal === 'function') {
            app.openVSMModal(issueId, issue.title);
        } else {
            showToast('VSM module not loaded yet', 'info');
        }
    }

    function clearIssueFilters() {
        issueFilters = {
            search: '',
            section: '',
            status: '',
            severity: '',
            type: '',
            owner: '',
            product: ''
        };

        document.getElementById('issue-search').value = '';
        document.getElementById('issue-section-filter').value = '';
        document.getElementById('issue-status-filter').value = '';
        document.getElementById('issue-severity-filter').value = '';
        document.getElementById('issue-type-filter').value = '';
        document.getElementById('issue-owner-filter').value = '';
        const productFilter = document.getElementById('issue-product-filter');
        if (productFilter) productFilter.value = '';

        renderIssuesList();
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
    app.showCreateIssueModal = showCreateIssueModal;
    app.closeIssueModal = closeIssueModal;
    app.saveIssue = saveIssue;
    app.viewIssueDetail = viewIssueDetail;
    app.closeIssueDetailModal = closeIssueDetailModal;
    app.editIssue = editIssue;
    app.closeIssue = closeIssue;
    app.deleteIssue = deleteIssue;
    app.convertIssueToProject = convertIssueToProject;
    app.createAARFromIssue = createAARFromIssue;
    app.startVSMForIssue = startVSMForIssue;
    app.clearIssueFilters = clearIssueFilters;
    app.renderIssuesPage = renderIssuesPage;

})();
