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

    // Store original saveData to wrap it
    const originalSaveData = window.saveData;
    window.saveData = function() {
        // Ensure new collections are included
        if (!app.data.issues) app.data.issues = [];
        if (!app.data.vsmMaps) app.data.vsmMaps = [];
        if (!app.data.auditLog) app.data.auditLog = [];
        if (!app.data.products) app.data.products = [];
        if (!app.data.areaImprovements) app.data.areaImprovements = [];
        return originalSaveData();
    };

    // Initialize extensions when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExtensions);
    } else {
        initExtensions();
    }

    function initExtensions() {
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
                        <div class="search-result-icon">🎯</div>
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
                        <div class="search-result-icon">📋</div>
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
                        <div class="search-result-icon">🗓️</div>
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
                        <div class="search-result-icon">📝</div>
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
                        <div class="search-result-icon">👤</div>
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

            // Don't trigger shortcuts if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
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
    }

    // Expose update function
    window.updateNavigationBadges = updateNavigationBadges;

    // Enhanced Dashboard Rendering
    function renderEnhancedDashboard() {
        renderDashboardStatStrip();
        renderOverdueActionsWidget();
        renderIssuesTriageWidget();
        renderUpcomingFollowupsWidget();
        renderIssuesStatusWidget();
        renderIssuesSeverityWidget();
        renderProjectsStageWidget();
        renderProjectsHealthWidget();
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
            container.innerHTML = '<div class="widget-empty">✓ No overdue actions</div>';
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
            container.innerHTML = '<div class="widget-empty">✓ No issues need triage</div>';
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
            'create': '➕',
            'update': '✏️',
            'delete': '🗑️',
            'close': '✅',
            'reopen': '🔄'
        };
        return icons[action] || '📝';
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
