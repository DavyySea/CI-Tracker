/* =========================
   app-extensions.js
   Extends existing app.js with new features:
   - Issues, VSM, Audit Log
   - Global Search
   - Keyboard Shortcuts
   - Enhanced Dashboard
   ========================= */

// Extend app.data with new collections
(function() {
    'use strict';

    // Add new collections if they don't exist
    if (!app.data.issues) app.data.issues = [];
    if (!app.data.vsmMaps) app.data.vsmMaps = [];
    if (!app.data.auditLog) app.data.auditLog = [];
    if (!app.data.products) app.data.products = [];
    if (!app.data.areaImprovements) app.data.areaImprovements = [];
    if (!app.data.tickets) app.data.tickets = [];
    if (!app.data.suppliers) app.data.suppliers = [];

    // Store original saveData to wrap it
    const originalSaveData = window.saveData;
    window.saveData = function() {
        // Ensure new collections are included
        if (!app.data.issues) app.data.issues = [];
        if (!app.data.vsmMaps) app.data.vsmMaps = [];
        if (!app.data.auditLog) app.data.auditLog = [];
        if (!app.data.products) app.data.products = [];
        if (!app.data.areaImprovements) app.data.areaImprovements = [];
        if (!app.data.tickets) app.data.tickets = [];
        if (!app.data.suppliers) app.data.suppliers = [];
        return originalSaveData();
    };

    // Initialize extensions when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExtensions);
    } else {
        initExtensions();
    }

    function initExtensions() {
        _seedFastenal();
        initGlobalSearch();
        initKeyboardShortcuts();
        initQuickCreateButtons();
        updateNavigationBadges();
        restoreAllFilters();
        setupFilterPersistence();

        // Update dashboard if on dashboard page
        if (app.currentPage === 'dashboard') {
            setTimeout(renderEnhancedDashboard, 100);
        }
    }

    // Filter Persistence
    const FILTER_PAGES = {
        'projects': ['project-search', 'project-area-filter', 'project-status-filter', 'project-health-filter', 'project-product-filter'],
        'aar':      ['aar-search', 'aar-area-filter', 'aar-type-filter', 'aar-status-filter'],
        'kpis':     ['kpi-search', 'kpi-category-filter'],
        'process':  ['process-search', 'process-area-filter'],
    };

    function restoreAllFilters() {
        Object.entries(FILTER_PAGES).forEach(([page, ids]) => {
            const raw = sessionStorage.getItem('ci_filters_' + page);
            if (!raw) return;
            try {
                const state = JSON.parse(raw);
                ids.forEach(id => {
                    const el = document.getElementById(id);
                    if (el && state[id] !== undefined) el.value = state[id];
                });
            } catch(e) {}
        });
    }

    function setupFilterPersistence() {
        Object.entries(FILTER_PAGES).forEach(([page, ids]) => {
            const save = () => {
                const state = {};
                ids.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) state[id] = el.value;
                });
                sessionStorage.setItem('ci_filters_' + page, JSON.stringify(state));
            };
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                el.addEventListener('input', save);
                el.addEventListener('change', save);
            });
        });
    }

    // Global Search
    function initGlobalSearch() {
        const searchInput = document.getElementById('globalSearch');
        const searchResults = document.getElementById('globalSearchResults');

        if (!searchInput || !searchResults) return;

        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2) {
                searchResults.classList.add('hidden');
                return;
            }

            searchTimeout = setTimeout(() => {
                performGlobalSearch(query);
            }, 300);
        });

        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                searchResults.classList.add('hidden');
            }, 200);
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2) {
                performGlobalSearch(searchInput.value.trim());
            }
        });
    }

    function performGlobalSearch(query) {
        const searchResults = document.getElementById('globalSearchResults');
        if (!searchResults) return;

        const lowerQuery = query.toLowerCase();
        const results = {
            issues: [],
            projects: [],
            meetings: [],
            aars: []
        };

        // Search Issues
        if (app.data.issues) {
            results.issues = app.data.issues.filter(issue =>
                issue.title?.toLowerCase().includes(lowerQuery) ||
                issue.section?.toLowerCase().includes(lowerQuery) ||
                issue.type?.toLowerCase().includes(lowerQuery)
            ).slice(0, 5);
        }

        // Search Projects
        results.projects = app.data.projects.filter(proj =>
            proj.title?.toLowerCase().includes(lowerQuery) ||
            proj.area?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5);

        // Search Meetings
        if (app.data.meetings) {
            results.meetings = app.data.meetings.filter(meeting =>
                meeting.title?.toLowerCase().includes(lowerQuery) ||
                meeting.section?.toLowerCase().includes(lowerQuery)
            ).slice(0, 5);
        }

        // Search AARs
        results.aars = (app.data.aars || []).filter(aar =>
            aar.description?.toLowerCase().includes(lowerQuery) ||
            aar.area?.toLowerCase().includes(lowerQuery) ||
            aar.incidentType?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5);

        // Search Contacts
        results.contacts = (app.data.contacts || []).filter(c =>
            c.name?.toLowerCase().includes(lowerQuery) ||
            c.email?.toLowerCase().includes(lowerQuery) ||
            c.company?.toLowerCase().includes(lowerQuery) ||
            c.title?.toLowerCase().includes(lowerQuery)
        ).slice(0, 5);

        renderSearchResults(results);
    }

    function renderSearchResults(results) {
        const searchResults = document.getElementById('globalSearchResults');
        if (!searchResults) return;

        const totalResults = results.issues.length + results.projects.length +
                           results.meetings.length + results.aars.length +
                           (results.contacts || []).length;

        if (totalResults === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
            searchResults.classList.remove('hidden');
            return;
        }

        let html = '';

        if (results.issues.length > 0) {
            html += '<div class="search-result-section">';
            html += '<div class="search-result-header">Issues</div>';
            results.issues.forEach(issue => {
                html += `
                    <div class="search-result-item" onclick="app.viewIssueDetail('${issue.id}')">
                        <div class="search-result-icon"></div>
                        <div class="search-result-content">
                            <div class="search-result-title">${escapeHtml(issue.title)}</div>
                            <div class="search-result-meta">${issue.section || 'No section'} • ${issue.severity || 'No severity'}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        if (results.projects.length > 0) {
            html += '<div class="search-result-section">';
            html += '<div class="search-result-header">Projects</div>';
            results.projects.forEach(proj => {
                html += `
                    <div class="search-result-item" onclick="navigateToPage('projects'); app.viewProjectDetail('${proj.id}');">
                        <div class="search-result-icon"></div>
                        <div class="search-result-content">
                            <div class="search-result-title">${escapeHtml(proj.title)}</div>
                            <div class="search-result-meta">${proj.area || 'No area'} • ${proj.status || 'No status'}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        if (results.meetings.length > 0) {
            html += '<div class="search-result-section">';
            html += '<div class="search-result-header">Meetings</div>';
            results.meetings.forEach(meeting => {
                html += `
                    <div class="search-result-item" onclick="app.viewMeetingDetail('${meeting.id}')">
                        <div class="search-result-icon"></div>
                        <div class="search-result-content">
                            <div class="search-result-title">${escapeHtml(meeting.title || 'Untitled Meeting')}</div>
                            <div class="search-result-meta">${meeting.section || 'No section'} • ${meeting.date || 'No date'}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        if (results.aars.length > 0) {
            html += '<div class="search-result-section">';
            html += '<div class="search-result-header">After Action Reports</div>';
            results.aars.forEach(aar => {
                html += `
                    <div class="search-result-item" onclick="navigateToPage('aar');">
                        <div class="search-result-icon"></div>
                        <div class="search-result-content">
                            <div class="search-result-title">${escapeHtml(aar.description || aar.incidentType || 'AAR')}</div>
                            <div class="search-result-meta">${aar.area || 'No area'} • ${aar.incidentType || ''}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        if ((results.contacts || []).length > 0) {
            html += '<div class="search-result-section">';
            html += '<div class="search-result-header">Contacts</div>';
            results.contacts.forEach(c => {
                html += `
                    <div class="search-result-item" onclick="navigateToPage('contacts');">
                        <div class="search-result-icon"></div>
                        <div class="search-result-content">
                            <div class="search-result-title">${escapeHtml(c.name)}</div>
                            <div class="search-result-meta">${c.title ? escapeHtml(c.title) + ' · ' : ''}${c.company ? escapeHtml(c.company) : c.email ? escapeHtml(c.email) : ''}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        searchResults.innerHTML = html;
        searchResults.classList.remove('hidden');
    }

    // Keyboard Shortcuts
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape closes any open modal
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    modal.remove();
                    return;
                }
                // Also close global search results
                const searchResults = document.getElementById('globalSearchResults');
                if (searchResults) searchResults.classList.add('hidden');
                return;
            }

            // Ctrl+K or Cmd+K for global search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('globalSearch');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }

            // Don't trigger shortcuts if typing in input or rich-text editor
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            // N for new issue
            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                if (typeof app.showCreateIssueModal === 'function') {
                    app.showCreateIssueModal();
                }
            }

            // M for new meeting
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                if (typeof app.showCreateMeetingModal === 'function') {
                    app.showCreateMeetingModal();
                }
            }
        });
    }

    // Quick Create Buttons
    function initQuickCreateButtons() {
        const issueBtn = document.getElementById('quickCreateIssueBtn');
        const meetingBtn = document.getElementById('quickCreateMeetingBtn');

        if (issueBtn) {
            issueBtn.onclick = function(e) {
                e.preventDefault();
                if (typeof app.showCreateIssueModal === 'function') {
                    app.showCreateIssueModal();
                } else {
                    showToast('Issue module not loaded yet', 'error');
                }
            };
        }

        if (meetingBtn) {
            meetingBtn.onclick = function(e) {
                e.preventDefault();
                if (typeof app.showCreateMeetingModal === 'function') {
                    app.showCreateMeetingModal();
                } else {
                    showToast('Meeting module not loaded yet', 'error');
                }
            };
        }
    }

    // Expose global quick create functions for direct use
    window.quickCreateIssue = function() {
        if (typeof app.showCreateIssueModal === 'function') {
            app.showCreateIssueModal();
        } else {
            alert('Issue module not loaded yet. Please refresh the page.');
        }
    };

    window.quickCreateMeeting = function() {
        if (typeof app.showCreateMeetingModal === 'function') {
            app.showCreateMeetingModal();
        } else {
            alert('Meeting module not loaded yet. Please refresh the page.');
        }
    };

    // Update Navigation Badges
    function updateNavigationBadges() {
        // Issues badge - count new/high severity issues
        const issuesNewBadge = document.getElementById('issuesNewBadge');
        if (issuesNewBadge && app.data.issues) {
            const newCount = app.data.issues.filter(i =>
                i.status === 'New' && (i.severity === 'Critical' || i.severity === 'High')
            ).length;
            issuesNewBadge.textContent = newCount;
            issuesNewBadge.style.display = newCount > 0 ? 'inline-block' : 'none';
        }

        // Meetings badge - count today's meetings
        const meetingsTodayBadge = document.getElementById('meetingsTodayBadge');
        if (meetingsTodayBadge && app.data.meetings) {
            const today = new Date().toISOString().split('T')[0];
            const todayCount = app.data.meetings.filter(m =>
                m.date && m.date.startsWith(today)
            ).length;
            meetingsTodayBadge.textContent = todayCount;
            meetingsTodayBadge.style.display = todayCount > 0 ? 'inline-block' : 'none';
        }

        // Tickets badge - count New tickets
        const ticketsNewBadge = document.getElementById('ticketsNewBadge');
        if (ticketsNewBadge && app.data.tickets) {
            const newCount = app.data.tickets.filter(t => t.status === 'New').length;
            ticketsNewBadge.textContent = newCount;
            ticketsNewBadge.style.display = newCount > 0 ? 'inline-block' : 'none';
        }

        // Cost Analysis badge - expired + expiring RFQs
        const costAnalysisBadge = document.getElementById('costAnalysisBadge');
        if (costAnalysisBadge && app.data.costAnalysis) {
            const today = new Date(); today.setHours(0,0,0,0);
            const soonMs = 30 * 24 * 60 * 60 * 1000;
            let riskCount = 0;
            (app.data.costAnalysis.parts || []).forEach(p => {
                const rfqs = p.rfqs || [];
                if (rfqs.length === 0) return;
                const best = rfqs.reduce((b, r) => (!b || Number(r.unitCost) < Number(b.unitCost)) ? r : b, null);
                if (best && best.validUntil) {
                    const d = new Date(best.validUntil);
                    if (d < today || (d - today) <= soonMs) riskCount++;
                }
            });
            costAnalysisBadge.textContent = riskCount;
            costAnalysisBadge.style.display = riskCount > 0 ? 'inline-block' : 'none';
        }
    }

    // Expose update function
    window.updateNavigationBadges = updateNavigationBadges;

    // Enhanced Dashboard Rendering
    function renderEnhancedDashboard() {
        renderDashboardStatStrip();
        renderOverdueActionsWidget();
        renderIssuesTriageWidget();
        renderUpcomingFollowupsWidget();
        renderTicketsNewWidget();
        renderIssuesStatusWidget();
        renderIssuesSeverityWidget();
        renderProjectsStageWidget();
        renderProjectsHealthWidget();
        renderGoalTrackingWidget();
        renderRecurringIssuesWidget();
        renderRootCauseParetoWidget();
        renderRecentActivityWidget();
    }

    function renderDashboardStatStrip() {
        const container = document.getElementById('dashboard-stat-strip');
        if (!container) return;

        const today = new Date().toISOString().split('T')[0];
        const issues = app.data.issues || [];
        const projects = app.data.projects || [];
        const meetings = app.data.meetings || [];

        // Open issues
        const openIssues = issues.filter(i => i.status !== 'Closed').length;
        const criticalIssues = issues.filter(i => i.status !== 'Closed' && (i.severity === 'Critical' || i.severity === 'High')).length;

        // Active projects
        const activeProjects = projects.filter(p => p.status !== 'Closed').length;
        const atRisk = projects.filter(p => p.status !== 'Closed' && (p.health === 'At Risk' || p.health === 'Off Track')).length;

        // Meetings today
        const todayMeetings = meetings.filter(m => (m.date || '').startsWith(today)).length;

        // Overdue actions
        const now = new Date();
        let overdueActions = 0;
        projects.forEach(p => (p.actions || []).forEach(a => {
            if (a.status !== 'Done' && a.dueDate && new Date(a.dueDate) < now) overdueActions++;
        }));
        issues.forEach(i => {
            if (i.status !== 'Closed' && i.nextActionDueDate && new Date(i.nextActionDueDate) < now) overdueActions++;
        });

        // Open action items total
        let openActions = 0;
        projects.forEach(p => (p.actions || []).forEach(a => {
            if (a.status !== 'Done') openActions++;
        }));

        // Phase 6: Action Item Velocity
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentlyClosed = issues.filter(i => {
            if (i.status !== 'Closed') return false;
            const closeTs = i.lastUpdated || i.closedDate;
            return closeTs && new Date(closeTs) >= thirtyDaysAgo;
        });
        const closedThisMonth = recentlyClosed.length;
        let avgCloseDays = '—';
        if (recentlyClosed.length > 0) {
            const diffs = recentlyClosed.filter(i => i.createdAt && (i.lastUpdated || i.closedDate)).map(i => {
                const open = new Date(i.createdAt);
                const close = new Date(i.lastUpdated || i.closedDate);
                return (close - open) / (1000 * 60 * 60 * 24);
            }).filter(d => d >= 0);
            if (diffs.length > 0) avgCloseDays = (diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(1);
        }

        const stats = [
            {
                label: 'Open Issues',
                value: openIssues,
                sub: criticalIssues > 0 ? `${criticalIssues} critical/high` : 'none critical',
                cls: criticalIssues > 0 ? 'stat-danger' : 'stat-success',
                nav: 'issues'
            },
            {
                label: 'Active Projects',
                value: activeProjects,
                sub: atRisk > 0 ? `${atRisk} at risk` : 'all on track',
                cls: atRisk > 0 ? 'stat-warning' : 'stat-success',
                nav: 'projects'
            },
            {
                label: 'Meetings Today',
                value: todayMeetings,
                sub: todayMeetings === 0 ? 'none scheduled' : 'scheduled today',
                cls: todayMeetings > 0 ? 'stat-accent' : '',
                nav: 'meetings'
            },
            {
                label: 'Overdue Actions',
                value: overdueActions,
                sub: overdueActions === 0 ? 'all on track' : 'need attention',
                cls: overdueActions > 0 ? 'stat-danger' : 'stat-success',
                nav: 'projects'
            },
            {
                label: 'Open Actions',
                value: openActions,
                sub: 'across all projects',
                cls: '',
                nav: 'projects'
            },
            {
                label: 'Closed This Month',
                value: closedThisMonth,
                sub: 'issues closed (30d)',
                cls: closedThisMonth > 0 ? 'stat-success' : '',
                nav: 'issues'
            },
            {
                label: 'Avg Close Time',
                value: avgCloseDays === '—' ? '—' : avgCloseDays + 'd',
                sub: 'days open→closed (30d)',
                cls: '',
                nav: 'issues'
            },
            {
                label: 'Escalated',
                value: projects.filter(p => p.createdFromIssueId).length || 0,
                sub: 'issues → projects',
                cls: 'stat-accent',
                nav: 'projects'
            }
        ];

        container.innerHTML = stats.map(s => `
            <div class="dash-stat-card ${s.cls}" onclick="navigateToPage('${s.nav}')">
                <div class="dash-stat-label">${s.label}</div>
                <div class="dash-stat-value">${s.value}</div>
                <div class="dash-stat-sub">${s.sub}</div>
            </div>
        `).join('');
    }

    function renderOverdueActionsWidget() {
        const container = document.getElementById('overdueActionsWidget');
        if (!container) return;

        const today = new Date();
        const overdueActions = [];

        // Project actions
        app.data.projects.forEach(proj => {
            if (proj.actions) {
                proj.actions.forEach(action => {
                    if (action.status !== 'Done' && action.dueDate) {
                        const dueDate = new Date(action.dueDate);
                        if (dueDate < today) {
                            overdueActions.push({
                                text: action.text,
                                owner: action.owner,
                                dueDate: action.dueDate,
                                source: proj.title,
                                type: 'project'
                            });
                        }
                    }
                });
            }
        });

        // Issue actions
        if (app.data.issues) {
            app.data.issues.forEach(issue => {
                if (issue.nextActionDueDate && issue.status !== 'Closed') {
                    const dueDate = new Date(issue.nextActionDueDate);
                    if (dueDate < today) {
                        overdueActions.push({
                            text: issue.nextAction || 'Action required',
                            owner: issue.owner,
                            dueDate: issue.nextActionDueDate,
                            source: issue.title,
                            type: 'issue'
                        });
                    }
                }
            });
        }

        if (overdueActions.length === 0) {
            container.innerHTML = '<div class="widget-empty">No overdue actions</div>';
            return;
        }

        let html = '<div class="widget-list">';
        overdueActions.slice(0, 5).forEach(action => {
            html += `
                <div class="widget-item">
                    <div>
                        <strong>${escapeHtml(action.text.substring(0, 50))}${action.text.length > 50 ? '...' : ''}</strong><br>
                        <small>${escapeHtml(action.source)} • ${action.owner || 'Unassigned'}</small>
                    </div>
                    <div><span class="severity-critical" style="font-size: 11px; padding: 3px 8px;">Overdue</span></div>
                </div>
            `;
        });
        if (overdueActions.length > 5) {
            html += `<div class="widget-item" style="text-align: center; color: var(--muted);">+${overdueActions.length - 5} more</div>`;
        }
        html += '</div>';
        container.innerHTML = html;
    }

    function renderIssuesTriageWidget() {
        const container = document.getElementById('issuesTriageWidget');
        if (!container || !app.data.issues) return;

        const needsTriage = app.data.issues.filter(i =>
            i.status === 'New' && (i.severity === 'Critical' || i.severity === 'High')
        );

        if (needsTriage.length === 0) {
            container.innerHTML = '<div class="widget-empty">No issues need triage</div>';
            return;
        }

        let html = '<div class="widget-list">';
        needsTriage.slice(0, 5).forEach(issue => {
            html += `
                <div class="widget-item" style="cursor: pointer;" onclick="navigateToPage('issues'); app.viewIssueDetail('${issue.id}');">
                    <div>
                        <strong>${escapeHtml(issue.title)}</strong><br>
                        <small>${issue.section || 'No section'}</small>
                    </div>
                    <div><span class="severity-${issue.severity.toLowerCase()}">${issue.severity}</span></div>
                </div>
            `;
        });
        if (needsTriage.length > 5) {
            html += `<div class="widget-item" style="text-align: center; color: var(--muted);">+${needsTriage.length - 5} more</div>`;
        }
        html += '</div>';
        container.innerHTML = html;
    }

    function renderUpcomingFollowupsWidget() {
        const container = document.getElementById('upcomingFollowupsWidget');
        if (!container) return;

        const today = new Date();
        const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcoming = [];

        // Project updates
        app.data.projects.forEach(proj => {
            if (proj.nextUpdateDate) {
                const updateDate = new Date(proj.nextUpdateDate);
                if (updateDate >= today && updateDate <= next7Days) {
                    upcoming.push({
                        text: `${proj.title} - Update due`,
                        date: proj.nextUpdateDate,
                        type: 'project'
                    });
                }
            }
        });

        // Issue actions
        if (app.data.issues) {
            app.data.issues.forEach(issue => {
                if (issue.nextActionDueDate && issue.status !== 'Closed') {
                    const actionDate = new Date(issue.nextActionDueDate);
                    if (actionDate >= today && actionDate <= next7Days) {
                        upcoming.push({
                            text: `${issue.title} - ${issue.nextAction || 'Action due'}`,
                            date: issue.nextActionDueDate,
                            type: 'issue'
                        });
                    }
                }
            });
        }

        // Meetings
        if (app.data.meetings) {
            app.data.meetings.forEach(meeting => {
                if (meeting.date) {
                    const meetingDate = new Date(meeting.date);
                    if (meetingDate >= today && meetingDate <= next7Days) {
                        upcoming.push({
                            text: meeting.title || 'Meeting',
                            date: meeting.date,
                            type: 'meeting'
                        });
                    }
                }
            });
        }

        upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcoming.length === 0) {
            container.innerHTML = '<div class="widget-empty">No upcoming follow-ups</div>';
            return;
        }

        let html = '<div class="widget-list">';
        upcoming.slice(0, 5).forEach(item => {
            html += `
                <div class="widget-item">
                    <div><strong>${escapeHtml(item.text.substring(0, 40))}${item.text.length > 40 ? '...' : ''}</strong></div>
                    <div><small>${formatDate(new Date(item.date))}</small></div>
                </div>
            `;
        });
        if (upcoming.length > 5) {
            html += `<div class="widget-item" style="text-align: center; color: var(--muted);">+${upcoming.length - 5} more</div>`;
        }
        html += '</div>';
        container.innerHTML = html;
    }

    function renderTicketsNewWidget() {
        const container = document.getElementById('ticketsNewWidget');
        if (!container) return;

        const newTickets = (app.data.tickets || []).filter(t => t.status === 'New');

        if (newTickets.length === 0) {
            container.innerHTML = '<div class="widget-empty">No new requests</div>';
            return;
        }

        // Sort by priority then submitted date
        const priWeight = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        newTickets.sort((a, b) => (priWeight[b.priority] || 0) - (priWeight[a.priority] || 0));

        let html = '<div class="widget-list">';
        newTickets.slice(0, 5).forEach(t => {
            const priCls = { Low: 'priority-low', Medium: 'priority-med', High: 'priority-high', Urgent: 'priority-urgent' }[t.priority] || '';
            html += `
                <div class="widget-item" style="cursor:pointer;" onclick="navigateToPage('tickets'); window._tickets && window._tickets.showDetail('${t.id}');">
                    <div>
                        <strong>${escapeHtml(t.ticketNumber)}</strong> ${escapeHtml((t.title || '').substring(0, 35))}${(t.title || '').length > 35 ? '…' : ''}<br>
                        <small>${escapeHtml(t.requesterName || 'Unknown')}</small>
                    </div>
                    <span class="status-badge ${priCls}" style="font-size:11px;">${escapeHtml(t.priority)}</span>
                </div>
            `;
        });
        if (newTickets.length > 5) {
            html += `<div class="widget-item" style="text-align:center;color:var(--muted);">+${newTickets.length - 5} more</div>`;
        }
        html += '</div>';
        container.innerHTML = html;
    }

    function renderIssuesStatusWidget() {
        const container = document.getElementById('issuesStatusWidget');
        if (!container || !app.data.issues) return;

        const statusCounts = {};
        app.data.issues.forEach(issue => {
            const status = issue.status || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        let html = '<div class="widget-list">';
        Object.entries(statusCounts).forEach(([status, count]) => {
            html += `
                <div class="widget-item">
                    <span>${status}</span>
                    <strong>${count}</strong>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderIssuesSeverityWidget() {
        const container = document.getElementById('issuesSeverityWidget');
        if (!container || !app.data.issues) return;

        const severityCounts = { Critical: 0, High: 0, Med: 0, Low: 0 };
        app.data.issues.forEach(issue => {
            if (issue.status !== 'Closed' && severityCounts.hasOwnProperty(issue.severity)) {
                severityCounts[issue.severity]++;
            }
        });

        let html = '<div class="widget-list">';
        Object.entries(severityCounts).forEach(([severity, count]) => {
            html += `
                <div class="widget-item">
                    <span class="severity-${severity.toLowerCase()}">${severity}</span>
                    <strong>${count}</strong>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderProjectsStageWidget() {
        const container = document.getElementById('projectsStageWidget');
        if (!container) return;

        const stageCounts = {};
        app.data.projects.forEach(proj => {
            const stage = proj.status || 'Unknown';
            stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        });

        let html = '<div class="widget-list">';
        ['Define', 'Measure', 'Analyze', 'Improve', 'Control', 'Closed'].forEach(stage => {
            const count = stageCounts[stage] || 0;
            if (count > 0) {
                html += `
                    <div class="widget-item">
                        <span>${stage}</span>
                        <strong>${count}</strong>
                    </div>
                `;
            }
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderProjectsHealthWidget() {
        const container = document.getElementById('projectsHealthWidget');
        if (!container) return;

        const healthCounts = { 'On Track': 0, 'At Risk': 0, 'Off Track': 0 };
        app.data.projects.forEach(proj => {
            if (proj.status !== 'Closed' && healthCounts.hasOwnProperty(proj.health)) {
                healthCounts[proj.health]++;
            }
        });

        let html = '<div class="widget-list">';
        Object.entries(healthCounts).forEach(([health, count]) => {
            const className = health.toLowerCase().replace(' ', '-');
            html += `
                <div class="widget-item">
                    <span class="health-badge health-${className}">${health}</span>
                    <strong>${count}</strong>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function renderRootCauseParetoWidget() {
        const container = document.getElementById('pareto-chart');
        if (!container) return;

        const rootCauseCounts = {};

        // From AAR
        (app.data.aars || []).forEach(aar => {
            if (aar.rootCauseCategory) {
                rootCauseCounts[aar.rootCauseCategory] = (rootCauseCounts[aar.rootCauseCategory] || 0) + 1;
            }
        });

        // From Issues
        if (app.data.issues) {
            app.data.issues.forEach(issue => {
                if (issue.rootCauseCategory) {
                    rootCauseCounts[issue.rootCauseCategory] = (rootCauseCounts[issue.rootCauseCategory] || 0) + 1;
                }
            });
        }

        const sortedCauses = Object.entries(rootCauseCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        if (sortedCauses.length === 0) {
            container.innerHTML = '<div class="widget-empty">No root cause data available</div>';
            return;
        }

        const maxCount = sortedCauses[0][1];
        let html = '';
        sortedCauses.forEach(([cause, count]) => {
            const percentage = (count / maxCount) * 100;
            html += `
                <div class="pareto-bar">
                    <div class="pareto-label">${escapeHtml(cause)}</div>
                    <div class="pareto-bar-container">
                        <div class="pareto-bar-fill" style="width: ${percentage}%">${count}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    function renderRecentActivityWidget() {
        const container = document.getElementById('recentActivityWidget');
        if (!container || !app.data.auditLog) return;

        const recentLogs = app.data.auditLog.slice(-10).reverse();

        if (recentLogs.length === 0) {
            container.innerHTML = '<div class="widget-empty">No recent activity</div>';
            return;
        }

        let html = '';
        recentLogs.forEach(log => {
            const icon = getActivityIcon(log.action);
            html += `
                <div class="activity-item">
                    <div class="activity-icon">${icon}</div>
                    <div class="activity-content">
                        <div class="activity-text">${escapeHtml(log.description)}</div>
                        <div class="activity-time">${formatTimeAgo(new Date(log.timestamp))}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    function getActivityIcon(action) {
        const icons = {
            'create': '+',
            'update': 'edit',
            'delete': 'delete',
            'close': 'close',
            'reopen': 'reopen'
        };
        return icons[action] || '';
    }

    function formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    // Helper function
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ─── Goal Tracking Widget ─────────────────────────────────────────────────

    function renderGoalTrackingWidget() {
        if (!app.data.goals) app.data.goals = [];

        const container = document.getElementById('goalTrackingWidget');
        if (!container) return;

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const issues = app.data.issues || [];
        const projects = app.data.projects || [];

        function computeCurrent(unit) {
            const u = (unit || '').toLowerCase();
            if (u.indexOf('issue') !== -1) {
                return issues.filter(i => i.status === 'Closed' && (i.lastUpdated || i.closedDate || '') >= monthStart).length;
            }
            if (u.indexOf('action') !== -1) {
                let count = 0;
                projects.forEach(p => (p.actions || []).forEach(a => {
                    if (a.status === 'Done' && (a.completedAt || a.dueDate || '') >= monthStart) count++;
                }));
                return count;
            }
            if (u.indexOf('meeting') !== -1) {
                return (app.data.meetings || []).filter(m => (m.date || '') >= monthStart).length;
            }
            return 0;
        }

        const goals = app.data.goals;

        let html = '<div class="goals-widget">';

        if (goals.length === 0) {
            html += '<div class="widget-empty">No goals set. Add one to start tracking progress.</div>';
        } else {
            goals.forEach(g => {
                const current = computeCurrent(g.unit);
                const target = g.target || 1;
                const pct = Math.min(100, Math.round((current / target) * 100));
                html += `
                <div class="goal-item">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:13px;font-weight:500;">${escapeHtml(g.title)}</span>
                        <button onclick="app.deleteGoal('${g.id}')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:14px;padding:0 2px;" title="Delete goal">x</button>
                    </div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="goal-meta">
                        <span>${current} / ${target} ${escapeHtml(g.unit)}</span>
                        <span>${g.deadline ? 'Due ' + g.deadline : ''}</span>
                    </div>
                </div>`;
            });
        }

        html += '</div>';
        container.innerHTML = html;
    }

    app.showAddGoalModal = function() {
        const existing = document.getElementById('addGoalModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'addGoalModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
        modal.innerHTML = `
            <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:24px;width:360px;max-width:90vw;">
                <h3 style="margin:0 0 16px;font-size:16px;">Add Monthly Goal</h3>
                <div style="display:flex;flex-direction:column;gap:10px;">
                    <input id="goalTitleInput" type="text" placeholder="Goal title (e.g. Close 10 issues)" style="background:var(--surface-3);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:8px 10px;font-size:13px;">
                    <input id="goalTargetInput" type="number" min="1" placeholder="Target number" style="background:var(--surface-3);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:8px 10px;font-size:13px;">
                    <input id="goalUnitInput" type="text" placeholder='Unit (e.g. "issues closed", "meetings")' style="background:var(--surface-3);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:8px 10px;font-size:13px;">
                    <input id="goalDeadlineInput" type="date" style="background:var(--surface-3);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:8px 10px;font-size:13px;">
                </div>
                <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;">
                    <button onclick="document.getElementById('addGoalModal').remove()" style="background:var(--surface-3);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:7px 14px;cursor:pointer;font-size:13px;">Cancel</button>
                    <button onclick="app.addGoal()" style="background:var(--accent);border:none;color:#000;border-radius:6px;padding:7px 14px;cursor:pointer;font-size:13px;font-weight:600;">Save Goal</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('goalTitleInput').focus();
    };

    app.addGoal = function() {
        const title = (document.getElementById('goalTitleInput') || {}).value || '';
        const target = parseInt((document.getElementById('goalTargetInput') || {}).value || '0', 10);
        const unit = (document.getElementById('goalUnitInput') || {}).value || '';
        const deadline = (document.getElementById('goalDeadlineInput') || {}).value || '';

        if (!title.trim()) { showToast('Please enter a goal title', 'error'); return; }
        if (!target || target < 1) { showToast('Please enter a valid target number', 'error'); return; }
        if (!unit.trim()) { showToast('Please enter a unit', 'error'); return; }

        if (!app.data.goals) app.data.goals = [];
        app.data.goals.push({
            id: generateId(),
            title: title.trim(),
            target: target,
            unit: unit.trim(),
            deadline: deadline,
            createdAt: new Date().toISOString()
        });
        saveData();

        const modal = document.getElementById('addGoalModal');
        if (modal) modal.remove();

        renderGoalTrackingWidget();
        showToast('Goal added');
    };

    app.deleteGoal = function(id) {
        if (!app.data.goals) return;
        app.data.goals = app.data.goals.filter(g => g.id !== id);
        saveData();
        renderGoalTrackingWidget();
        showToast('Goal removed');
    };

    // ─── Phase 5: Recurring Issues Widget ────────────────────────────────────

    function renderRecurringIssuesWidget() {
        const container = document.getElementById('recurringIssuesWidget');
        if (!container) return;
        const issues = app.data.issues || [];
        // Group by (rootCauseCategory, first productId or '')
        const groups = {};
        issues.forEach(i => {
            const rc = i.rootCauseCategory || 'Unknown';
            const prod = (i.productIds && i.productIds.length > 0)
                ? ((app.data.products || []).find(p => p.id === i.productIds[0]) || {}).name || i.productIds[0]
                : 'General';
            const key = rc + '||' + prod;
            if (!groups[key]) groups[key] = { rootCause: rc, product: prod, issues: [] };
            groups[key].issues.push(i);
        });
        const recurring = Object.values(groups)
            .filter(g => g.issues.length >= 3)
            .sort((a, b) => b.issues.length - a.issues.length)
            .slice(0, 5);
        if (recurring.length === 0) {
            container.innerHTML = '<p class="muted" style="font-size:13px;">No recurring patterns detected (need 3+ issues with same root cause).</p>';
            return;
        }
        container.innerHTML = recurring.map(g => {
            const open = g.issues.filter(i => i.status !== 'Closed').length;
            const rc = escapeHtml(g.rootCause); const prod = escapeHtml(g.product);
            return '<div class="recurrence-row" onclick="navigateToPage(\'issues\')" title="Click to view Issues page">' +
                '<div>' +
                '<div style="font-size:13px;font-weight:600;">' + rc + '</div>' +
                '<div style="font-size:11px;color:var(--text-muted);">' + prod + ' · ' + open + ' open</div>' +
                '</div>' +
                '<span class="recurrence-count">' + g.issues.length + 'x</span>' +
                '</div>';
        }).join('');
    }

    // ─── Phase 9: Monthly CI Report ───────────────────────────────────────────

    function showMonthlyReportModal() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const fmt = d => new Date(d).toLocaleDateString();
        const issues = app.data.issues || [];
        const projects = app.data.projects || [];
        const meetings = app.data.meetings || [];

        // Issues opened vs closed in last 30d
        const recentOpened = issues.filter(i => i.createdAt && new Date(i.createdAt) >= thirtyDaysAgo);
        const recentClosed = issues.filter(i => i.status === 'Closed' && i.lastUpdated && new Date(i.lastUpdated) >= thirtyDaysAgo);

        // Meetings held
        const recentMeetings = meetings.filter(m => {
            const d = m.date || m.dateTime || '';
            return d && new Date(d) >= thirtyDaysAgo && new Date(d) <= now;
        });

        // Action items closed (from projects)
        let actionsClosed = 0;
        projects.forEach(p => (p.actions || []).forEach(a => {
            if (a.status === 'Done' && a.completedDate && new Date(a.completedDate) >= thirtyDaysAgo) actionsClosed++;
        }));

        // RFQs awarded this month (by negotiationStage)
        let rfqsAwarded = 0; let savingsAwarded = 0;
        (app.data.costAnalysis && app.data.costAnalysis.parts || []).forEach(p => {
            (p.rfqs || []).forEach(r => {
                if (r.negotiationStage === 'Awarded') {
                    rfqsAwarded++;
                    savingsAwarded += ((Number(p.currentUnitCost) || 0) - (Number(r.unitCost) || 0)) * (Number(p.qpb) || 1);
                }
            });
        });

        // Severity breakdown
        const sevCounts = { Critical: 0, High: 0, Med: 0, Low: 0 };
        recentOpened.forEach(i => { if (sevCounts[i.severity] !== undefined) sevCounts[i.severity]++; });

        // Recurring root causes
        const rcGroups = {};
        issues.forEach(i => { const rc = i.rootCauseCategory || 'Unknown'; rcGroups[rc] = (rcGroups[rc] || 0) + 1; });
        const topRC = Object.entries(rcGroups).sort((a, b) => b[1] - a[1]).slice(0, 5);

        // Projects advanced (status changed recently - approximate by lastUpdated)
        const advancedProjects = projects.filter(p => p.lastUpdated && new Date(p.lastUpdated) >= thirtyDaysAgo && p.status !== 'New');

        const kpiRow = (label, val) =>
            '<div class="report-kpi-card"><div class="report-kpi-val">' + val + '</div><div class="report-kpi-lbl">' + label + '</div></div>';

        const html = '<div class="modal-overlay" id="monthlyReportModal">' +
            '<div class="modal modal-wide">' +
            '<div class="modal-header"><h2>Monthly CI Report — ' + fmt(thirtyDaysAgo) + ' to ' + fmt(now) + '</h2>' +
            '<button class="modal-close" onclick="document.getElementById(\'monthlyReportModal\').remove()">&times;</button></div>' +
            '<div class="modal-body report-modal-body">' +

            '<div class="report-section">' +
            '<div class="report-section-title">Summary KPIs</div>' +
            '<div class="report-kpi-row">' +
            kpiRow('Issues Opened', recentOpened.length) +
            kpiRow('Issues Closed', recentClosed.length) +
            kpiRow('Meetings Held', recentMeetings.length) +
            kpiRow('Actions Closed', actionsClosed) +
            kpiRow('RFQs Awarded', rfqsAwarded) +
            (savingsAwarded > 0 ? kpiRow('Savings Captured', '$' + savingsAwarded.toFixed(0)) : '') +
            '</div></div>' +

            '<div class="report-section">' +
            '<div class="report-section-title">Issues Opened by Severity</div>' +
            '<table class="report-table"><thead><tr><th>Severity</th><th>Count</th></tr></thead><tbody>' +
            Object.entries(sevCounts).map(([sev, n]) => '<tr><td>' + sev + '</td><td>' + n + '</td></tr>').join('') +
            '</tbody></table></div>' +

            '<div class="report-section">' +
            '<div class="report-section-title">Projects Advanced</div>' +
            (advancedProjects.length === 0 ? '<p class="muted">No projects updated this period.</p>' :
            '<table class="report-table"><thead><tr><th>Project</th><th>Status</th><th>Health</th></tr></thead><tbody>' +
            advancedProjects.map(p => '<tr><td>' + escapeHtml(p.title) + '</td><td>' + escapeHtml(p.status || '') + '</td><td>' + escapeHtml(p.health || '') + '</td></tr>').join('') +
            '</tbody></table>') + '</div>' +

            '<div class="report-section">' +
            '<div class="report-section-title">Top Root Causes (All Time)</div>' +
            '<table class="report-table"><thead><tr><th>Root Cause</th><th>Issues</th></tr></thead><tbody>' +
            topRC.map(([rc, n]) => '<tr><td>' + escapeHtml(rc) + '</td><td>' + n + '</td></tr>').join('') +
            '</tbody></table></div>' +

            '</div>' +
            '<div class="modal-footer">' +
            '<button class="btn btn-secondary" onclick="window.print()">Print</button>' +
            '<button class="btn btn-secondary" onclick="window._copyReportMarkdown()">Copy Markdown</button>' +
            '<button class="btn btn-secondary" onclick="document.getElementById(\'monthlyReportModal\').remove()">Close</button>' +
            '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    }

    window._copyReportMarkdown = function() {
        const body = document.querySelector('#monthlyReportModal .modal-body');
        if (!body) return;
        const text = body.innerText;
        navigator.clipboard.writeText(text).then(() => showToast('Report copied to clipboard')).catch(() => showToast('Copy failed', 'error'));
    };

    window.showMonthlyReportModal = showMonthlyReportModal;

    // ── Fastenal seed ────────────────────────────────────────────────────────
    function _seedFastenal() {
        if (app.data._fastenalSeeded) return;
        app.data._fastenalSeeded = true;

        // Add supplier record
        if (!app.data.suppliers) app.data.suppliers = [];
        var alreadySupplier = app.data.suppliers.find(function(s) {
            return s.name.toLowerCase() === 'fastenal';
        });
        if (!alreadySupplier) {
            app.data.suppliers.push({
                id: generateId(),
                name: 'Fastenal',
                supplierType: 'service',
                contactName: '',
                contactEmail: '',
                contactPhone: '',
                commodity: 'Fasteners / Hardware / MRO',
                notes: 'Hardware/MRO distributor. Primary commodity: fasteners (bolts, nuts, screws, washers, pins). Engaged for hardware supply program.',
                tags: ['Hardware', 'MRO', 'Fasteners'],
                quality: 0,
                delivery: 0,
                responsiveness: 0,
                price: 0
            });
        }

        // Add project
        if (!app.data.projects) app.data.projects = [];
        var alreadyProject = app.data.projects.find(function(p) {
            return p.title && p.title.toLowerCase().indexOf('fastenal') !== -1;
        });
        if (!alreadyProject) {
            app.data.projects.push({
                id: generateId(),
                title: 'Fastenal Hardware Supply Program',
                area: 'Procurement',
                problemStatement: 'Evaluate and establish a formal hardware supply agreement with Fastenal to consolidate fastener/MRO sourcing, reduce per-part costs, and improve supply reliability across hardware commodity parts.',
                impactedKPIs: [],
                owner: '',
                stakeholders: 'Procurement, Engineering',
                startDate: '2026-03-26',
                dueDate: '',
                status: 'Define',
                health: 'On Track',
                priority: 'Medium',
                expectedImpact: '',
                actualImpact: '',
                lastUpdated: '2026-03-26',
                nextUpdateDate: '',
                actions: [],
                links: [],
                notes: ''
            });
        }

        // Ensure supplierType is set on Fastenal (migration for existing records)
        var fastenalRec = app.data.suppliers.find(function(s) { return s.name === 'Fastenal'; });
        if (fastenalRec && !fastenalRec.supplierType) {
            fastenalRec.supplierType = 'service';
        }

        saveData();
    }

    // Expose enhanced dashboard render
    window.renderEnhancedDashboard = renderEnhancedDashboard;

    // Re-render badges and dashboard when data changes
    const originalRenderCurrentPage = window.renderCurrentPage;
    if (originalRenderCurrentPage) {
        window.renderCurrentPage = function() {
            originalRenderCurrentPage();
            updateNavigationBadges();
            if (app.currentPage === 'dashboard') {
                setTimeout(renderEnhancedDashboard, 100);
            }
        };
    }

})();
