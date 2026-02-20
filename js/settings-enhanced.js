/* =========================
   js/settings-enhanced.js
   Enhanced Settings & Data Management
   User settings, demo data, enhanced export/import
   ========================= */

(function() {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSettingsEnhanced);
    } else {
        initSettingsEnhanced();
    }

    function initSettingsEnhanced() {
        loadUserSettings();
        setupEnhancedExportImport();
    }

    // User Settings
    function loadUserSettings() {
        const userName = localStorage.getItem('ci_tracker_user_name') || '';
        const userNameInput = document.getElementById('settingUserName');
        const currentUserSpan = document.getElementById('currentUser');

        if (userNameInput) {
            userNameInput.value = userName;
        }
        if (currentUserSpan) {
            currentUserSpan.textContent = userName || 'User';
        }
    }

    function saveUserSettings() {
        const userNameInput = document.getElementById('settingUserName');
        if (!userNameInput) return;

        const userName = userNameInput.value.trim();
        localStorage.setItem('ci_tracker_user_name', userName);

        const currentUserSpan = document.getElementById('currentUser');
        if (currentUserSpan) {
            currentUserSpan.textContent = userName || 'User';
        }

        showToast('Settings saved', 'success');
    }

    // Enhanced Export/Import
    function setupEnhancedExportImport() {
        const importFileInput = document.getElementById('import-data-file');
        if (importFileInput) {
            importFileInput.addEventListener('change', handleImportFile);
        }
    }

    function exportData() {
        try {
            // Include all collections
            const dataToExport = {
                ...app.data,
                exportDate: new Date().toISOString(),
                version: '2.0'
            };

            const json = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ci_tracker_backup_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            logAudit('export', 'data', 'Exported all data');
            showToast('Data exported successfully', 'success');
        } catch (e) {
            console.error('Export failed:', e);
            showToast('Export failed', 'error');
        }
    }

    function importDataPrompt() {
        const fileInput = document.getElementById('import-data-file');
        if (fileInput) {
            fileInput.click();
        }
    }

    function handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                // Validate data
                if (!imported || typeof imported !== 'object') {
                    throw new Error('Invalid data format');
                }

                // Confirm import
                const message = `Import data from ${imported.exportDate || 'unknown date'}?\n\n` +
                               `This will REPLACE all current data!\n\n` +
                               `KPIs: ${imported.kpis?.length || 0}\n` +
                               `Projects: ${imported.projects?.length || 0}\n` +
                               `Issues: ${imported.issues?.length || 0}\n` +
                               `Meetings: ${imported.meetings?.length || 0}\n` +
                               `AARs: ${imported.aars?.length || 0}\n` +
                               `Processes: ${imported.processDocs?.length || 0}`;

                if (!confirm(message)) {
                    event.target.value = ''; // Reset file input
                    return;
                }

                // Import data
                app.data = {
                    kpis: imported.kpis || [],
                    projects: imported.projects || [],
                    dmaicRecords: imported.dmaicRecords || [],
                    aars: imported.aars || [],
                    processDocs: imported.processDocs || [],
                    meetings: imported.meetings || [],
                    issues: imported.issues || [],
                    vsmMaps: imported.vsmMaps || [],
                    auditLog: imported.auditLog || []
                };

                saveData();
                logAudit('import', 'data', 'Imported data from file');
                showToast('Data imported successfully', 'success');

                // Refresh current page
                if (typeof renderCurrentPage === 'function') {
                    renderCurrentPage();
                }
                if (typeof updateNavigationBadges === 'function') {
                    updateNavigationBadges();
                }

                event.target.value = ''; // Reset file input
            } catch (e) {
                console.error('Import failed:', e);
                showToast('Import failed: ' + e.message, 'error');
                event.target.value = ''; // Reset file input
            }
        };
        reader.readAsText(file);
    }

    // Load Demo Data
    function loadDemoData() {
        if (!confirm('Load demo data?\n\nThis will ADD demo Issues, Meetings, and a VSM to your existing data.\n\nYour current data will NOT be deleted.')) {
            return;
        }

        // Demo Issues
        const demoIssues = [
            {
                id: generateId(),
                title: 'CNC Mill #3 - Excessive Cycle Time',
                section: 'Manufacturing',
                area: 'CNC Mill',
                severity: 'High',
                type: 'Process waste',
                status: 'Investigating',
                owner: 'John Smith',
                stakeholders: 'Manufacturing, Quality',
                rootCauseCategory: 'Technology',
                impact: {
                    costUSD: 2500,
                    timeHours: 40,
                    units: 150,
                    scheduleDays: 3,
                    notes: 'Throughput reduced by 25%'
                },
                evidence: '',
                notes: 'Observed during gemba walk. Tool wear causing longer cycle times. Need to review tool change schedule and potentially upgrade tooling.',
                nextAction: 'Conduct time study and tool wear analysis',
                nextActionDueDate: getDateString(7),
                tags: ['gemba', 'tooling', 'cycle-time'],
                linkedMeetingIds: [],
                linkedProjectIds: [],
                linkedAarIds: [],
                createdDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            },
            {
                id: generateId(),
                title: 'Supplier XYZ - Late Deliveries (3 weeks in a row)',
                section: 'Procurement',
                area: 'Supplier OTD',
                severity: 'Critical',
                type: 'Late supplier',
                status: 'New',
                owner: 'Sarah Johnson',
                stakeholders: 'Procurement, Planning',
                rootCauseCategory: 'Materials/Suppliers',
                impact: {
                    costUSD: 8000,
                    timeHours: 120,
                    units: 0,
                    scheduleDays: 10,
                    notes: 'Causing downstream shortages and expedite costs'
                },
                evidence: 'PO tracking report showing consistent 5-7 day delays',
                notes: 'Supplier claims capacity issues. Need to engage supplier quality engineer and consider alternate sources.',
                nextAction: 'Schedule supplier QBR call',
                nextActionDueDate: getDateString(2),
                tags: ['supplier', 'otd', 'critical'],
                linkedMeetingIds: [],
                linkedProjectIds: [],
                linkedAarIds: [],
                createdDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            },
            {
                id: generateId(),
                title: 'Receiving Dock - Inventory Discrepancies',
                section: 'Warehouse',
                area: 'Receiving',
                severity: 'Med',
                type: 'Process waste',
                status: 'Triaged',
                owner: 'Mike Davis',
                stakeholders: 'Warehouse, IT',
                rootCauseCategory: 'Process',
                impact: {
                    costUSD: 1200,
                    timeHours: 30,
                    units: 0,
                    scheduleDays: 0,
                    notes: '~5 discrepancies per week requiring rework'
                },
                evidence: '',
                notes: 'Root cause appears to be manual data entry errors during receiving process. Potential solution: implement barcode scanning.',
                nextAction: 'Pilot barcode scanning for high-volume SKUs',
                nextActionDueDate: getDateString(14),
                tags: ['receiving', 'inventory', 'automation'],
                linkedMeetingIds: [],
                linkedProjectIds: [],
                linkedAarIds: [],
                createdDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            }
        ];

        // Demo Meetings
        const demoMeetings = [
            {
                id: generateId(),
                title: 'Manufacturing Gemba Walk - CNC Area',
                date: getDateString(-2),
                time: '09:00',
                section: 'Manufacturing',
                type: 'Gemba',
                location: 'Shop Floor - CNC Area',
                attendees: 'John Smith, Mike Chen, Sarah L.',
                agenda: '• Walk the CNC process\n• Observe current conditions\n• Identify waste or problems\n• Talk to operators',
                decisions: [
                    {
                        id: generateId(),
                        text: 'Prioritize CNC Mill #3 cycle time investigation',
                        timestamp: new Date().toISOString()
                    },
                    {
                        id: generateId(),
                        text: 'Schedule daily standups for next 2 weeks to track progress',
                        timestamp: new Date().toISOString()
                    }
                ],
                decisionsText: 'Prioritize CNC Mill #3 cycle time investigation\nSchedule daily standups for next 2 weeks to track progress',
                risks: 'If not addressed quickly, may impact Q2 deliveries',
                notes: 'Observed operators manually adjusting feeds/speeds. Tool wear more severe than expected. Mill #3 showing 25% longer cycle times vs. Mill #1 and #2 on same parts.',
                followupDate: getDateString(7),
                linkedIssueIds: [demoIssues[0].id],
                actions: [
                    {
                        id: generateId(),
                        text: 'Conduct formal time study on Mill #3',
                        owner: 'John Smith',
                        dueDate: getDateString(5),
                        status: 'Open'
                    }
                ],
                createdDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            },
            {
                id: generateId(),
                title: 'Weekly Supplier Performance Review',
                date: getDateString(0),
                time: '14:00',
                section: 'Procurement',
                type: 'Supplier Call',
                location: 'Conference Room B',
                attendees: 'Sarah Johnson, Tom Wilson, Quality Team',
                agenda: '• Review weekly supplier scorecard\n• Discuss late deliveries from XYZ Corp\n• Upcoming PO forecast',
                decisions: [],
                decisionsText: '',
                risks: 'Supplier capacity constraints may worsen',
                notes: 'XYZ Corp continues to miss delivery dates. Root cause: capacity issues at their facility. Discussed corrective action plan.',
                followupDate: getDateString(7),
                linkedIssueIds: [demoIssues[1].id],
                actions: [],
                createdDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            }
        ];

        // Link issues to meetings
        demoIssues[0].linkedMeetingIds.push(demoMeetings[0].id);
        demoIssues[1].linkedMeetingIds.push(demoMeetings[1].id);

        // Demo VSM (simple receiving process)
        const demoVSM = {
            id: generateId(),
            issueId: demoIssues[2].id,
            title: 'Receiving Process - Current State',
            nodes: [
                {
                    id: generateId(),
                    type: 'Supplier',
                    title: 'Supplier Shipment',
                    notes: 'Multiple suppliers',
                    metrics: { CT: 0, LT: 0, WIP: 0, FPY: 0, scrap: 0, rework: 0 },
                    x: 100,
                    y: 150
                },
                {
                    id: generateId(),
                    type: 'Process',
                    title: 'Unload & Inspect',
                    notes: 'Dock receiving',
                    metrics: { CT: 0.5, LT: 1, WIP: 5, FPY: 95, scrap: 0, rework: 5 },
                    x: 300,
                    y: 150
                },
                {
                    id: generateId(),
                    type: 'Process',
                    title: 'Manual Data Entry',
                    notes: 'Enter into ERP',
                    metrics: { CT: 0.3, LT: 0.5, WIP: 3, FPY: 90, scrap: 0, rework: 10 },
                    x: 500,
                    y: 150
                },
                {
                    id: generateId(),
                    type: 'Queue',
                    title: 'Verification Queue',
                    notes: 'Waiting for quality check',
                    metrics: { CT: 0, LT: 4, WIP: 20, FPY: 0, scrap: 0, rework: 0 },
                    x: 700,
                    y: 150
                },
                {
                    id: generateId(),
                    type: 'Process',
                    title: 'Quality Verification',
                    notes: 'Sample inspection',
                    metrics: { CT: 0.5, LT: 1, WIP: 2, FPY: 98, scrap: 1, rework: 1 },
                    x: 900,
                    y: 150
                },
                {
                    id: generateId(),
                    type: 'Customer',
                    title: 'To Warehouse',
                    notes: 'Put-away process',
                    metrics: { CT: 0, LT: 0, WIP: 0, FPY: 0, scrap: 0, rework: 0 },
                    x: 1100,
                    y: 150
                }
            ],
            edges: [
                { id: generateId(), fromId: '', toId: '', label: '' }
            ],
            createdDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        // Link edges (need actual IDs)
        demoVSM.edges = [
            { id: generateId(), fromId: demoVSM.nodes[0].id, toId: demoVSM.nodes[1].id, label: '' },
            { id: generateId(), fromId: demoVSM.nodes[1].id, toId: demoVSM.nodes[2].id, label: '' },
            { id: generateId(), fromId: demoVSM.nodes[2].id, toId: demoVSM.nodes[3].id, label: '' },
            { id: generateId(), fromId: demoVSM.nodes[3].id, toId: demoVSM.nodes[4].id, label: '' },
            { id: generateId(), fromId: demoVSM.nodes[4].id, toId: demoVSM.nodes[5].id, label: '' }
        ];

        // Add to app.data
        if (!app.data.issues) app.data.issues = [];
        if (!app.data.meetings) app.data.meetings = [];
        if (!app.data.vsmMaps) app.data.vsmMaps = [];

        app.data.issues.push(...demoIssues);
        app.data.meetings.push(...demoMeetings);
        app.data.vsmMaps.push(demoVSM);

        saveData();
        logAudit('create', 'demo-data', 'Loaded demo data (3 issues, 2 meetings, 1 VSM)');
        showToast('Demo data loaded successfully', 'success');

        // Refresh page
        if (typeof renderCurrentPage === 'function') {
            renderCurrentPage();
        }
        if (typeof updateNavigationBadges === 'function') {
            updateNavigationBadges();
        }
    }

    // Clear All Data
    function clearAllData() {
        const confirmation = prompt('Type "DELETE ALL" to confirm clearing all data:');
        if (confirmation !== 'DELETE ALL') {
            showToast('Cancelled', 'info');
            return;
        }

        app.data = {
            kpis: [],
            projects: [],
            dmaicRecords: [],
            aars: [],
            processDocs: [],
            meetings: [],
            issues: [],
            vsmMaps: [],
            auditLog: []
        };

        saveData();
        logAudit('delete', 'data', 'Cleared all data');
        showToast('All data cleared', 'success');

        // Refresh page
        if (typeof renderCurrentPage === 'function') {
            renderCurrentPage();
        }
        if (typeof updateNavigationBadges === 'function') {
            updateNavigationBadges();
        }
    }

    // Helper functions
    function getDateString(daysOffset) {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
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
    app.saveUserSettings = saveUserSettings;
    app.exportData = exportData;
    app.importDataPrompt = importDataPrompt;
    app.loadDemoData = loadDemoData;
    app.clearAllData = clearAllData;

})();
