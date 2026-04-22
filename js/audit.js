/* =========================
   js/audit.js
   Audit Log Management Module
   ========================= */

(function() {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuditModule);
    } else {
        initAuditModule();
    }

    function initAuditModule() {
        setupAuditLogViewer();
    }

    function setupAuditLogViewer() {
        const viewBtn = document.getElementById('viewAuditLogBtn');
        if (viewBtn) {
            viewBtn.addEventListener('click', toggleAuditLogViewer);
        }
    }

    function toggleAuditLogViewer() {
        const viewer = document.getElementById('auditLogViewer');
        if (!viewer) return;

        if (viewer.classList.contains('hidden')) {
            viewer.classList.remove('hidden');
            renderAuditLog();
        } else {
            viewer.classList.add('hidden');
        }
    }

    function renderAuditLog() {
        const viewer = document.getElementById('auditLogViewer');
        if (!viewer) return;

        if (!app.data.auditLog || app.data.auditLog.length === 0) {
            viewer.innerHTML = '<div class="empty-state" style="padding: 32px;"><p>No audit log entries</p></div>';
            return;
        }

        // Show most recent first
        const logs = [...app.data.auditLog].reverse();

        let html = '<div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">';
        html += '<strong>Audit Log</strong>';
        html += '<button class="btn btn-secondary btn-small" onclick="app.exportAuditLog()">Export CSV</button>';
        html += '</div>';

        logs.forEach(log => {
            const icon = getAuditIcon(log.action);
            const timestamp = new Date(log.timestamp);
            html += `
                <div class="audit-log-item">
                    <div class="audit-log-time">${formatTimestamp(timestamp)}</div>
                    <div class="audit-log-action">
                        ${icon} <span class="audit-log-entity">${log.entity}</span> - ${escapeHtml(log.description)}
                    </div>
                </div>
            `;
        });

        viewer.innerHTML = html;
    }

    function getAuditIcon(action) {
        const icons = {
            'create': '+',
            'update': 'Edit',
            'delete': 'Delete',
            'close': 'Close',
            'reopen': '',
            'export': '',
            'import': ''
        };
        return icons[action] || '';
    }

    function formatTimestamp(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (days > 0) {
            return `${days}d ago`;
        } else if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
        }
    }

    function exportAuditLog() {
        if (!app.data.auditLog || app.data.auditLog.length === 0) {
            showToast('No audit log to export', 'error');
            return;
        }

        // Create CSV
        let csv = 'Timestamp,Action,Entity,Description\n';
        app.data.auditLog.forEach(log => {
            const timestamp = new Date(log.timestamp).toISOString();
            csv += `"${timestamp}","${log.action}","${log.entity}","${escapeCSV(log.description)}"\n`;
        });

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_log_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Audit log exported', 'success');
    }

    function escapeCSV(text) {
        if (!text) return '';
        return text.replace(/"/g, '""');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Log helper function (can be called from anywhere)
    function logAudit(action, entity, description) {
        if (!app.data.auditLog) app.data.auditLog = [];
        app.data.auditLog.push({
            timestamp: new Date().toISOString(),
            action,
            entity,
            description
        });
        // Keep only last 500 entries
        if (app.data.auditLog.length > 500) {
            app.data.auditLog = app.data.auditLog.slice(-500);
        }
    }

    // Expose functions to app namespace
    app.toggleAuditLogViewer = toggleAuditLogViewer;
    app.renderAuditLog = renderAuditLog;
    app.exportAuditLog = exportAuditLog;
    app.logAudit = logAudit;

    // Expose global logAudit for other modules
    window.logAudit = logAudit;

})();
