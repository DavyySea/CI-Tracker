/* =========================
   js/suppliers.js  v5
   Supplier Master Record Page
   ========================= */

(function() {
    'use strict';

    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function fmt$(n) {
        if (n === null || n === undefined || isNaN(n)) return '—';
        return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    function formatDate(d) {
        if (!d) return '—';
        return d.slice(0, 10);
    }
    function ensureSuppliersData() {
        if (!app.data.suppliers) app.data.suppliers = [];
    }

    // ─── Tab state ────────────────────────────────────────────────────────────
    var _supDetailTab = 'overview';
    var _supDetailName = null;
    var _pendingScores = { quality: 0, delivery: 0, responsiveness: 0, price: 0 };

    // ─── Scorecard ────────────────────────────────────────────────────────────
    function setSupplierStar(dim, val) {
        _pendingScores[dim] = val;
        document.querySelectorAll('.sup-star[data-dim="' + dim + '"]').forEach(function(s) {
            s.classList.toggle('sup-star-active', parseInt(s.getAttribute('data-val'), 10) <= val);
        });
        var dims = ['quality','delivery','responsiveness','price'];
        var total = 0, rated = 0;
        dims.forEach(function(d) { if (_pendingScores[d] > 0) { total += _pendingScores[d]; rated++; } });
        var el = document.getElementById('sup-score-overall');
        if (el) el.textContent = rated === 0 ? 'Overall: Not yet rated' : 'Overall: ' + (total / dims.length).toFixed(1) + ' / 5.0';
    }

    function buildScorecardHtml(record) {
        var isService = record.supplierType === 'service';
        var dims = isService ? [
            { key: 'quality',        label: 'Service Quality',       desc: 'Quality of products / service delivered' },
            { key: 'delivery',       label: 'Availability',          desc: 'Stock availability / fulfillment speed' },
            { key: 'responsiveness', label: 'Responsiveness',        desc: 'Communication speed & quality' },
            { key: 'price',          label: 'Price Competitiveness', desc: 'Value for money vs. market' }
        ] : [
            { key: 'quality',        label: 'Quality',               desc: 'Product quality / defect rate' },
            { key: 'delivery',       label: 'On-Time Delivery',      desc: 'On-time delivery / lead time' },
            { key: 'responsiveness', label: 'Responsiveness',        desc: 'Communication speed & quality' },
            { key: 'price',          label: 'Price Competitiveness', desc: 'Value for money vs. market' }
        ];
        var rows = dims.map(function(d) {
            var current = parseInt(record[d.key] || 0, 10);
            var stars = '';
            for (var i = 1; i <= 5; i++) {
                stars += '<span class="sup-star' + (i <= current ? ' sup-star-active' : '') + '" data-dim="' + d.key + '" data-val="' + i + '" onclick="app.setSupplierStar(\'' + d.key + '\',' + i + ')" title="' + i + ' — ' + ['Poor','Below Avg','Average','Good','Excellent'][i-1] + '">' + (i <= current ? '●' : '·') + '</span>';
            }
            return '<div class="sup-score-row"><div class="sup-score-label">' + d.label + '<div class="sup-score-desc">' + d.desc + '</div></div><div class="sup-stars-wrap">' + stars + '</div></div>';
        }).join('');
        var total = 0, rated = 0;
        ['quality','delivery','responsiveness','price'].forEach(function(d) {
            var v = parseInt(record[d] || 0, 10); if (v > 0) { total += v; rated++; }
        });
        var overall = rated === 0 ? 'Not yet rated' : (total / 4).toFixed(1) + ' / 5.0';
        return '<div class="sup-scorecard">' + rows + '</div>' +
               '<div class="sup-score-overall" id="sup-score-overall">Overall: ' + overall + '</div>';
    }

    // ─── Derived stats from Cost Analysis ────────────────────────────────────
    function getSupplierStats() {
        ensureSuppliersData();
        if (!app.data.costAnalysis) return {};
        const parts = app.data.costAnalysis.parts || [];
        const today = new Date(); today.setHours(0,0,0,0);
        const soonMs = 30 * 24 * 60 * 60 * 1000;
        const stats = {};
        function ensure(name) {
            if (!name || !name.trim()) return null;
            const k = name.trim();
            if (!stats[k]) stats[k] = { name: k, partCount: 0, totalSpendPerBoat: 0, rfqCount: 0, expiredRfqs: 0, expiringRfqs: 0 };
            return stats[k];
        }
        parts.forEach(function(p) {
            const qpb = Number(p.qpb) || 1;
            if (p.currentSupplier) {
                const s = ensure(p.currentSupplier);
                if (s) { s.partCount++; s.totalSpendPerBoat += (Number(p.currentUnitCost) || 0) * qpb; }
            }
            (p.rfqs || []).forEach(function(r) {
                if (!r.supplier) return;
                const s = ensure(r.supplier);
                if (!s) return;
                s.rfqCount++;
                if (r.validUntil) {
                    const d = new Date(r.validUntil);
                    if (d < today) s.expiredRfqs++;
                    else if ((d - today) <= soonMs) s.expiringRfqs++;
                }
            });
        });
        return stats;
    }

    // ─── Suppliers Page ───────────────────────────────────────────────────────
    function renderSuppliersPage() {
        const container = document.getElementById('page-suppliers');
        if (!container) return;
        ensureSuppliersData();

        const stats = getSupplierStats();
        const allNames = Array.from(new Set([
            ...Object.keys(stats),
            ...app.data.suppliers.map(s => s.name)
        ])).sort();

        var pageHeader = '<header class="page-header"><h1>Suppliers</h1>' +
            '<p class="page-subtitle">' + (function() {
                var p = 0, s = 0;
                allNames.forEach(function(n) {
                    var r = app.data.suppliers.find(function(x) { return x.name === n; }) || {};
                    if (r.supplierType === 'service') s++; else p++;
                });
                return p + ' parts suppliers · ' + s + ' service providers';
            })() + '</p>' +
            '<button class="btn btn-primary" onclick="window._suppliers._showAddSupplierModal()">+ Add Supplier</button>' +
            '</header>';

        if (allNames.length === 0) {
            container.innerHTML = pageHeader +
                '<div class="empty-state"><div class="empty-state-icon"></div>' +
                '<p>No suppliers yet. Click Add Supplier or add suppliers to parts in Cost Analysis.</p></div>';
            return;
        }

        // Split into parts suppliers and service providers
        var partsNames = [];
        var serviceNames = [];
        allNames.forEach(function(name) {
            var record = app.data.suppliers.find(r => r.name === name) || {};
            if (record.supplierType === 'service') {
                serviceNames.push(name);
            } else {
                partsNames.push(name);
            }
        });

        function buildCard(name) {
            const s = stats[name] || {};
            const record = app.data.suppliers.find(r => r.name === name) || {};
            const isService = record.supplierType === 'service';
            const alertColor = s.expiredRfqs > 0 ? '#ef4444' : s.expiringRfqs > 0 ? '#f59e0b' : 'var(--accent)';
            const scoreDims = ['quality','delivery','responsiveness','price'];
            const scoreTotal = scoreDims.reduce((sum, d) => sum + parseInt(record[d] || 0, 10), 0);
            const scored = scoreDims.some(d => parseInt(record[d] || 0, 10) > 0);
            const oppCount = (record.opportunities || []).filter(o => o.status === 'Open' || o.status === 'In Progress').length;
            const issueCount = (app.data.issues || []).filter(i => i.supplier === name && i.status !== 'Closed').length;
            const meetingCount = _getSupplierMeetings(name).length;

            var statsHtml = '<div class="supplier-stat-row">';
            if (isService) {
                statsHtml +=
                    '<div class="supplier-stat"><div class="supplier-stat-val">' + meetingCount + '</div><div class="supplier-stat-lbl">Meetings</div></div>' +
                    (scored ? '<div class="supplier-stat"><div class="supplier-stat-val" style="color:#f59e0b;">' + (scoreTotal / 4).toFixed(1) + '</div><div class="supplier-stat-lbl">Score</div></div>' : '') +
                    (oppCount > 0 ? '<div class="supplier-stat"><div class="supplier-stat-val" style="color:var(--accent);">' + oppCount + '</div><div class="supplier-stat-lbl">Opportunities</div></div>' : '') +
                    (issueCount > 0 ? '<div class="supplier-stat"><div class="supplier-stat-val" style="color:#ff4757;">' + issueCount + '</div><div class="supplier-stat-lbl">Open Issues</div></div>' : '');
            } else {
                statsHtml +=
                    '<div class="supplier-stat"><div class="supplier-stat-val" style="color:' + alertColor + ';">' + (s.partCount || 0) + '</div><div class="supplier-stat-lbl">Parts</div></div>' +
                    '<div class="supplier-stat"><div class="supplier-stat-val">' + fmt$(s.totalSpendPerBoat || 0) + '</div><div class="supplier-stat-lbl">$/Boat</div></div>' +
                    (scored ? '<div class="supplier-stat"><div class="supplier-stat-val" style="color:#f59e0b;">' + (scoreTotal / 4).toFixed(1) + '</div><div class="supplier-stat-lbl">Score</div></div>' : '') +
                    (oppCount > 0 ? '<div class="supplier-stat"><div class="supplier-stat-val" style="color:var(--accent);">' + oppCount + '</div><div class="supplier-stat-lbl">Opportunities</div></div>' : '') +
                    (issueCount > 0 ? '<div class="supplier-stat"><div class="supplier-stat-val" style="color:#ff4757;">' + issueCount + '</div><div class="supplier-stat-lbl">Open Issues</div></div>' : '');
            }
            statsHtml += '</div>';

            return '<div class="supplier-card" onclick="window._suppliers.showSupplierDetailModal(\'' + escapeHtml(name).replace(/'/g, "\\'") + '\')">' +
                '<div class="supplier-card-name">' + escapeHtml(name) + '</div>' +
                (record.commodity ? '<div class="sup-card-commodity">' + escapeHtml(record.commodity) + '</div>' : '') +
                statsHtml +
                (record.contactName ? '<div class="supplier-contact-row">' + escapeHtml(record.contactName) + (record.contactEmail ? ' · ' + escapeHtml(record.contactEmail) : '') + '</div>' : '') +
                (record.paymentTerms || record.leadTimeDays ? '<div class="supplier-contact-row" style="font-size:11px;color:var(--muted);">' + (record.paymentTerms || '') + (record.paymentTerms && record.leadTimeDays ? ' · ' : '') + (record.leadTimeDays ? record.leadTimeDays + 'd LT' : '') + '</div>' : '') +
                '</div>';
        }

        var html = pageHeader;

        if (partsNames.length > 0) {
            html += '<div class="sup-section-header">Parts Suppliers</div>';
            html += '<div class="supplier-grid">' + partsNames.map(buildCard).join('') + '</div>';
        }

        if (serviceNames.length > 0) {
            html += '<div class="sup-section-header" style="margin-top:28px;">Service Providers</div>';
            html += '<div class="supplier-grid">' + serviceNames.map(buildCard).join('') + '</div>';
        }

        container.innerHTML = html;
    }

    // ─── Detail Modal ─────────────────────────────────────────────────────────
    function showSupplierDetailModal(name) {
        _supDetailName = name;
        if (_supDetailTab === '') _supDetailTab = 'overview';
        _renderSupplierModal();
    }

    function _setSupTab(tab) {
        _supDetailTab = tab;
        _renderSupplierModal();
    }

    function _renderSupplierModal() {
        var name = _supDetailName;
        var existing = document.getElementById('supplierDetailModal');
        if (existing) existing.remove();

        ensureSuppliersData();
        var record = app.data.suppliers.find(r => r.name === name) || { name };
        var isService = record.supplierType === 'service';

        _pendingScores = {
            quality:        parseInt(record.quality        || 0, 10),
            delivery:       parseInt(record.delivery       || 0, 10),
            responsiveness: parseInt(record.responsiveness || 0, 10),
            price:          parseInt(record.price          || 0, 10)
        };

        var tabs = [
            { id: 'overview',      label: 'Overview' },
            { id: 'contact',       label: 'Contact & Terms' },
            { id: 'meetings',      label: 'Meetings' },
            { id: 'issues',        label: 'Issues' },
            { id: 'opportunities', label: 'Opportunities' }
        ];
        // Only show Parts tab for parts suppliers
        if (!isService) {
            tabs.splice(2, 0, { id: 'parts', label: 'Parts' });
        }

        var tabNav = '<div class="sup-modal-tabs">' + tabs.map(function(t) {
            var badge = '';
            if (t.id === 'opportunities') {
                var activeOpps = (record.opportunities || []).filter(o => o.status === 'Open' || o.status === 'In Progress').length;
                if (activeOpps) badge = ' <span class="sup-tab-badge">' + activeOpps + '</span>';
            }
            if (t.id === 'issues') {
                var openIssues = (app.data.issues || []).filter(i => i.supplier === name && i.status !== 'Closed').length;
                if (openIssues) badge = ' <span class="sup-tab-badge sup-tab-badge-red">' + openIssues + '</span>';
            }
            return '<button class="sup-modal-tab' + (_supDetailTab === t.id ? ' active' : '') + '" onclick="window._suppliers._setSupTab(\'' + t.id + '\')">' + t.label + badge + '</button>';
        }).join('') + '</div>';

        var body = '';
        if (_supDetailTab === 'overview')           body = _renderOverviewTab(record, name);
        else if (_supDetailTab === 'contact')       body = _renderContactTab(record);
        else if (_supDetailTab === 'parts')         body = _renderPartsTab(name);
        else if (_supDetailTab === 'meetings')      body = _renderMeetingsTab(name);
        else if (_supDetailTab === 'issues')        body = _renderIssuesTab(name);
        else if (_supDetailTab === 'opportunities') body = _renderOpportunitiesTab(record, name);

        var icon = '';
        var typeBadge = isService
            ? '<span class="sup-type-badge sup-type-service">Service Provider</span>'
            : '<span class="sup-type-badge sup-type-parts">Parts Supplier</span>';

        var html = '<div class="modal-overlay" id="supplierDetailModal">' +
            '<div class="modal modal-wide">' +
            '<div class="modal-header"><h2>' + icon + ' ' + escapeHtml(name) + ' ' + typeBadge + '</h2>' +
            '<button class="modal-close" onclick="document.getElementById(\'supplierDetailModal\').remove()">&times;</button></div>' +
            tabNav +
            '<div class="modal-body sup-modal-body">' + body + '</div>' +
            '<div class="modal-footer">' +
            (_supDetailTab === 'overview' || _supDetailTab === 'contact' ?
                '<button class="btn btn-primary" onclick="window._suppliers.saveSupplierRecord(\'' + escapeHtml(name).replace(/'/g, "\\'") + '\')">Save</button>' : '') +
            '<button class="btn btn-secondary" onclick="document.getElementById(\'supplierDetailModal\').remove()">Close</button>' +
            '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    }

    // ── Overview Tab ──────────────────────────────────────────────────────────
    function _renderOverviewTab(record, name) {
        var isService = record.supplierType === 'service';
        var partStats = getSupplierStats()[name] || {};
        var parts = (app.data.costAnalysis && app.data.costAnalysis.parts || []).filter(p => p.currentSupplier === name);
        var issues = (app.data.issues || []).filter(i => i.supplier === name);
        var openIssues = issues.filter(i => i.status !== 'Closed').length;
        var meetings = _getSupplierMeetings(name);
        var opps = record.opportunities || [];
        var activeOpps = opps.filter(o => o.status === 'Open' || o.status === 'In Progress').length;

        var statCards = '<div class="sup-overview-stats">';
        if (isService) {
            statCards +=
                _statCard(meetings.length, 'Meetings', 'var(--accent)') +
                _statCard(openIssues, 'Open Issues', openIssues > 0 ? '#ff4757' : 'var(--muted)') +
                _statCard(activeOpps, 'Opportunities', activeOpps > 0 ? 'var(--accent)' : 'var(--muted)');
        } else {
            statCards +=
                _statCard(parts.length, 'Active Parts', 'var(--accent)') +
                _statCard(fmt$(partStats.totalSpendPerBoat || 0), '$/Boat', 'var(--accent)') +
                _statCard(openIssues, 'Open Issues', openIssues > 0 ? '#ff4757' : 'var(--muted)') +
                _statCard(meetings.length, 'Meetings', 'var(--accent)') +
                _statCard(activeOpps, 'Opportunities', activeOpps > 0 ? 'var(--accent)' : 'var(--muted)');
        }
        statCards += '</div>';

        var tags = (record.tags || []);
        var tagsHtml = tags.length > 0 ? '<div class="sup-tags-row">' + tags.map(t => '<span class="sup-tag">' + escapeHtml(t) + '</span>').join('') + '</div>' : '';

        var meta = '<div class="sup-overview-meta">' +
            (record.commodity ? '<span><strong>Commodity / Service:</strong> ' + escapeHtml(record.commodity) + '</span>' : '') +
            (record.paymentTerms ? '<span><strong>Payment Terms:</strong> ' + escapeHtml(record.paymentTerms) + '</span>' : '') +
            (record.leadTimeDays ? '<span><strong>Typical Lead Time:</strong> ' + record.leadTimeDays + ' days</span>' : '') +
            (record.website ? '<span><strong>Website:</strong> <a href="' + escapeHtml(record.website) + '" target="_blank" style="color:var(--accent);">' + escapeHtml(record.website) + '</a></span>' : '') +
            (record.contactName ? '<span><strong>Contact:</strong> ' + escapeHtml(record.contactName) + (record.contactEmail ? ' · ' + escapeHtml(record.contactEmail) : '') + '</span>' : '') +
            '</div>';

        return statCards + tagsHtml + meta +
            '<div class="cost-form-section-label" style="margin-top:18px;">Scorecard</div>' +
            buildScorecardHtml(record) +
            (record.notes ? '<div class="cost-form-section-label" style="margin-top:16px;">Notes</div><div class="sup-notes-display">' + escapeHtml(record.notes) + '</div>' : '');
    }

    function _statCard(val, lbl, color) {
        return '<div class="sup-stat-card"><div class="sup-stat-val" style="color:' + color + ';">' + val + '</div><div class="sup-stat-lbl">' + lbl + '</div></div>';
    }

    // ── Contact & Terms Tab ───────────────────────────────────────────────────
    function _renderContactTab(record) {
        var isService = record.supplierType === 'service';
        return '<div class="cost-form-section-label">Supplier Type</div>' +
            '<div class="form-group">' +
            '<select class="form-control" id="sup-type" style="max-width:280px;">' +
            '<option value="parts"' + (!isService ? ' selected' : '') + '>Parts Supplier — provides manufactured parts/components</option>' +
            '<option value="service"' + (isService ? ' selected' : '') + '>Service Provider — distributor, MRO, tooling, services</option>' +
            '</select></div>' +

            '<div class="cost-form-section-label" style="margin-top:16px;">Contact Information</div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label class="form-label">Contact Name</label><input type="text" class="form-control" id="sup-contact-name" value="' + escapeHtml(record.contactName || '') + '" placeholder="Jane Smith"></div>' +
            '<div class="form-group"><label class="form-label">Email</label><input type="email" class="form-control" id="sup-contact-email" value="' + escapeHtml(record.contactEmail || '') + '" placeholder="jane@supplier.com"></div>' +
            '<div class="form-group"><label class="form-label">Phone</label><input type="text" class="form-control" id="sup-contact-phone" value="' + escapeHtml(record.contactPhone || '') + '" placeholder="+1 555 0100"></div>' +
            '</div>' +
            '<div class="form-group"><label class="form-label">Website</label><input type="text" class="form-control" id="sup-website" value="' + escapeHtml(record.website || '') + '" placeholder="https://www.supplier.com"></div>' +

            '<div class="cost-form-section-label" style="margin-top:16px;">Commercial Terms</div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label class="form-label">Primary Commodity / Service</label><input type="text" class="form-control" id="sup-commodity" value="' + escapeHtml(record.commodity || '') + '" placeholder="Hardware, Gaskets, etc."></div>' +
            '<div class="form-group"><label class="form-label">Payment Terms</label><input type="text" class="form-control" id="sup-payment-terms" value="' + escapeHtml(record.paymentTerms || '') + '" placeholder="Net 30"></div>' +
            '<div class="form-group"><label class="form-label">Typical Lead Time (days)</label><input type="number" class="form-control" id="sup-lead-time" value="' + (record.leadTimeDays || '') + '" min="0" placeholder="14"></div>' +
            '</div>' +

            '<div class="cost-form-section-label" style="margin-top:16px;">Notes</div>' +
            '<div class="form-group"><textarea class="form-control" id="sup-notes" rows="4" placeholder="Relationship notes, contract details, performance history...">' + escapeHtml(record.notes || '') + '</textarea></div>';
    }

    // ── Parts Tab ─────────────────────────────────────────────────────────────
    function _renderPartsTab(name) {
        var parts = (app.data.costAnalysis && app.data.costAnalysis.parts || []).filter(p =>
            p.currentSupplier === name || (p.rfqs || []).some(r => r.supplier === name));

        if (parts.length === 0) return '<div class="sm-empty">No parts associated with this supplier.</div>';

        var rows = parts.map(function(p) {
            var rfqs = (p.rfqs || []).filter(r => r.supplier === name);
            var best = rfqs.length > 0 ? rfqs.sort((a,b) => Number(a.unitCost) - Number(b.unitCost))[0] : null;
            var isActive = p.currentSupplier === name;
            return '<tr>' +
                '<td><strong>' + escapeHtml(p.partNumber) + '</strong>' + (p.rev ? ' <span class="cost-rev-badge">Rev ' + escapeHtml(p.rev) + '</span>' : '') + '</td>' +
                '<td>' + escapeHtml(p.description || '') + '</td>' +
                '<td>' + escapeHtml(p.commodity || '—') + '</td>' +
                '<td>' + (isActive ? '<span style="color:var(--accent);font-weight:700;">Active</span>' : '<span class="muted">RFQ only</span>') + '</td>' +
                '<td>' + (isActive ? fmt$(p.currentUnitCost) : '—') + '</td>' +
                '<td>' + (p.qpb || 1) + '</td>' +
                '<td>' + (best ? fmt$(best.unitCost) : '—') + '</td>' +
                '</tr>';
        }).join('');

        return '<div class="cost-table-wrap"><table class="cost-table">' +
            '<thead><tr><th>Part #</th><th>Description</th><th>Commodity</th><th>Status</th><th>Current $/unit</th><th>QPB</th><th>RFQ $/unit</th></tr></thead>' +
            '<tbody>' + rows + '</tbody></table></div>';
    }

    // ── Meetings Tab ──────────────────────────────────────────────────────────
    function _getSupplierMeetings(name) {
        var nameLower = name.toLowerCase();
        return (app.data.meetings || []).filter(function(m) {
            return (m.supplier && m.supplier.toLowerCase() === nameLower) ||
                   (m.title && m.title.toLowerCase().indexOf(nameLower) !== -1) ||
                   (m.notes && m.notes.toLowerCase().indexOf(nameLower) !== -1);
        }).sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
    }

    function _renderMeetingsTab(name) {
        var meetings = _getSupplierMeetings(name);

        var logBtn = '<div style="margin-bottom:14px;">' +
            '<button class="btn btn-primary btn-small" onclick="window._suppliers._logMeetingForSupplier(\'' + escapeHtml(name).replace(/'/g, "\\'") + '\')">+ Log Meeting</button>' +
            '<span class="muted" style="font-size:11px;margin-left:10px;">Meetings are matched by supplier name in title or notes.</span>' +
            '</div>';

        if (meetings.length === 0) return logBtn + '<div class="sm-empty">No meetings found for this supplier yet.</div>';

        var rows = meetings.map(function(m) {
            var actionCount = (m.actions || []).length;
            var doneCount = (m.actions || []).filter(a => a.done || a.status === 'Done').length;
            return '<div class="sup-meeting-row">' +
                '<div class="sup-meeting-date">' + escapeHtml(m.date || '—') + '</div>' +
                '<div class="sup-meeting-main">' +
                    '<div class="sup-meeting-title">' + escapeHtml(m.title || 'Untitled') + '</div>' +
                    '<div class="sup-meeting-meta">' +
                        (m.type ? '<span class="sup-tag">' + escapeHtml(m.type) + '</span>' : '') +
                        (m.attendees && m.attendees.length ? '<span class="muted" style="font-size:11px;">' + m.attendees.length + ' attendee' + (m.attendees.length !== 1 ? 's' : '') + '</span>' : '') +
                        (actionCount ? '<span class="muted" style="font-size:11px;">' + doneCount + '/' + actionCount + ' actions done</span>' : '') +
                    '</div>' +
                '</div>' +
                '</div>';
        }).join('');

        return logBtn + '<div class="sup-meetings-list">' + rows + '</div>';
    }

    function _logMeetingForSupplier(name) {
        document.getElementById('supplierDetailModal').remove();
        if (typeof app.showNewMeetingModal === 'function') {
            app.showNewMeetingModal();
            setTimeout(function() {
                var titleEl = document.getElementById('meeting-title') || document.getElementById('meetingTitle');
                if (titleEl && !titleEl.value) titleEl.value = name + ' — ';
            }, 100);
        } else {
            navigateToPage('meetings');
        }
    }

    // ── Issues Tab ────────────────────────────────────────────────────────────
    function _renderIssuesTab(name) {
        var issues = (app.data.issues || []).filter(i => i.supplier === name)
            .sort(function(a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });

        var btn = '<div style="margin-bottom:14px;">' +
            '<button class="btn btn-primary btn-small" onclick="window._suppliers._newIssueForSupplier(\'' + escapeHtml(name).replace(/'/g, "\\'") + '\')">+ Log Issue</button>' +
            '</div>';

        if (issues.length === 0) return btn + '<div class="sm-empty">No issues logged for this supplier.</div>';

        var sevColor = { Critical:'#ff4757', High:'#ff6b35', Medium:'#f59e0b', Low:'var(--muted)' };
        var stColor = { Open:'#ff4757', Triaged:'#f59e0b', Investigating:'#a78bfa', 'In DMAIC':'#4a8fc7', Monitoring:'#7aaae4', Closed:'var(--muted)' };

        var rows = issues.map(function(i) {
            var sev = i.severity || 'Low';
            var st = i.status || 'Open';
            return '<div class="sup-issue-row" onclick="navigateToPage(\'issues\');setTimeout(function(){if(typeof app.viewIssueDetail===\'function\')app.viewIssueDetail(\'' + i.id + '\')},200)">' +
                '<div class="sup-issue-sev" style="background:' + (sevColor[sev] || 'var(--muted)') + '"></div>' +
                '<div class="sup-issue-main">' +
                    '<div class="sup-issue-title">' + escapeHtml(i.title || 'Untitled') + '</div>' +
                    '<div class="sup-issue-meta">' +
                        '<span class="sup-tag">' + escapeHtml(sev) + '</span>' +
                        '<span class="sup-tag" style="color:' + (stColor[st] || 'var(--muted)') + ';">' + escapeHtml(st) + '</span>' +
                        (i.createdAt ? '<span class="muted" style="font-size:11px;">' + formatDate(i.createdAt) + '</span>' : '') +
                    '</div>' +
                '</div>' +
                '</div>';
        }).join('');

        var open = issues.filter(i => i.status !== 'Closed').length;
        return btn +
            '<div style="margin-bottom:12px;font-size:12px;color:var(--muted);">' + open + ' open · ' + issues.length + ' total</div>' +
            '<div class="sup-issues-list">' + rows + '</div>';
    }

    function _newIssueForSupplier(name) {
        document.getElementById('supplierDetailModal').remove();
        navigateToPage('issues');
        setTimeout(function() {
            if (typeof showNewIssueModal === 'function') {
                showNewIssueModal();
                setTimeout(function() {
                    var el = document.getElementById('issueSupplier') || document.getElementById('issue-supplier');
                    if (el) el.value = name;
                }, 100);
            }
        }, 200);
    }

    // ── Opportunities Tab ─────────────────────────────────────────────────────
    function _renderOpportunitiesTab(record, name) {
        var opps = record.opportunities || [];
        var typeOpts = ['Cost Reduction','Lead Time Reduction','Quality Improvement','Alternate Source','Process Improvement','Contract / Terms','Other'];
        var statusOpts = ['Open','In Progress','Completed','On Hold'];
        var statusColor = { 'Open':'#4a8fc7', 'In Progress':'#f59e0b', 'Completed':'#7aaae4', 'On Hold':'var(--muted)' };

        var addForm = '<div class="sup-opp-form card" style="margin-bottom:16px;">' +
            '<div class="cost-form-section-label" style="margin-bottom:10px;">Add Opportunity</div>' +
            '<div class="form-group"><label class="form-label">Title</label><input type="text" class="form-control" id="sup-opp-title" placeholder="e.g. Negotiate volume discount on fasteners"></div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label class="form-label">Type</label><select class="form-control" id="sup-opp-type">' + typeOpts.map(t => '<option>' + t + '</option>').join('') + '</select></div>' +
            '<div class="form-group"><label class="form-label">Status</label><select class="form-control" id="sup-opp-status">' + statusOpts.map(s => '<option>' + s + '</option>').join('') + '</select></div>' +
            '</div>' +
            '<div class="form-group"><label class="form-label">Notes</label><textarea class="form-control" id="sup-opp-notes" rows="2" placeholder="Details, target savings, timeline..."></textarea></div>' +
            '<button class="btn btn-primary btn-small" onclick="window._suppliers._addOpportunity(\'' + escapeHtml(name).replace(/'/g, "\\'") + '\')">Add</button>' +
            '</div>';

        if (opps.length === 0) return addForm + '<div class="sm-empty">No improvement opportunities tracked yet.</div>';

        var list = opps.slice().reverse().map(function(o) {
            var sc = statusColor[o.status] || 'var(--muted)';
            return '<div class="sup-opp-card">' +
                '<div class="sup-opp-head">' +
                    '<div class="sup-opp-title">' + escapeHtml(o.title || 'Untitled') + '</div>' +
                    '<div class="sup-opp-actions">' +
                        '<select class="form-control" style="width:120px;font-size:11px;padding:2px 6px;" onchange="window._suppliers._updateOppStatus(\'' + escapeHtml(name).replace(/'/g,"\\'") + '\',\'' + o.id + '\',this.value)">' +
                        statusOpts.map(s => '<option' + (s === o.status ? ' selected' : '') + '>' + s + '</option>').join('') +
                        '</select>' +
                        '<button class="btn btn-danger btn-small" onclick="window._suppliers._deleteOpportunity(\'' + escapeHtml(name).replace(/'/g,"\\'") + '\',\'' + o.id + '\')">×</button>' +
                    '</div>' +
                '</div>' +
                '<div class="sup-opp-meta">' +
                    '<span class="sup-tag" style="color:var(--accent);">' + escapeHtml(o.type || '') + '</span>' +
                    '<span class="sup-tag" style="color:' + sc + ';">' + escapeHtml(o.status || '') + '</span>' +
                    (o.createdAt ? '<span class="muted" style="font-size:10px;">' + formatDate(o.createdAt) + '</span>' : '') +
                '</div>' +
                (o.notes ? '<div class="sup-opp-notes">' + escapeHtml(o.notes) + '</div>' : '') +
                '</div>';
        }).join('');

        return addForm + '<div class="sup-opps-list">' + list + '</div>';
    }

    function _addOpportunity(name) {
        var title = (document.getElementById('sup-opp-title').value || '').trim();
        if (!title) { showToast('Title is required', 'error'); return; }
        ensureSuppliersData();
        var idx = app.data.suppliers.findIndex(s => s.name === name);
        if (idx === -1) {
            app.data.suppliers.push({ id: generateId(), name, tags: [], quality:0, delivery:0, responsiveness:0, price:0 });
            idx = app.data.suppliers.length - 1;
        }
        if (!app.data.suppliers[idx].opportunities) app.data.suppliers[idx].opportunities = [];
        app.data.suppliers[idx].opportunities.push({
            id: generateId(),
            title,
            type: document.getElementById('sup-opp-type').value,
            status: document.getElementById('sup-opp-status').value,
            notes: (document.getElementById('sup-opp-notes').value || '').trim(),
            createdAt: new Date().toISOString()
        });
        saveData();
        showToast('Opportunity added');
        _renderSupplierModal();
    }

    function _updateOppStatus(name, oppId, status) {
        ensureSuppliersData();
        var rec = app.data.suppliers.find(s => s.name === name);
        if (!rec) return;
        var opp = (rec.opportunities || []).find(o => o.id === oppId);
        if (opp) { opp.status = status; saveData(); }
    }

    function _deleteOpportunity(name, oppId) {
        ensureSuppliersData();
        var rec = app.data.suppliers.find(s => s.name === name);
        if (!rec || !rec.opportunities) return;
        rec.opportunities = rec.opportunities.filter(o => o.id !== oppId);
        saveData();
        showToast('Opportunity removed');
        _renderSupplierModal();
    }

    // ─── Add Supplier Modal ───────────────────────────────────────────────────
    function _showAddSupplierModal() {
        var existing = document.getElementById('addSupplierModal');
        if (existing) existing.remove();
        var html = '<div class="modal-overlay" id="addSupplierModal">' +
            '<div class="modal">' +
            '<div class="modal-header"><h2>Add Supplier</h2>' +
            '<button class="modal-close" onclick="document.getElementById(\'addSupplierModal\').remove()">&times;</button></div>' +
            '<div class="modal-body">' +
            '<div class="form-group"><label class="form-label">Name</label>' +
            '<input type="text" class="form-control" id="add-sup-name" placeholder="e.g. Amper Technologies" autofocus></div>' +
            '<div class="form-group"><label class="form-label">Type</label>' +
            '<select class="form-control" id="add-sup-type">' +
            '<option value="parts">Parts Supplier</option>' +
            '<option value="service" selected>Service Provider</option>' +
            '</select></div>' +
            '<div class="form-group"><label class="form-label">Commodity / Service</label>' +
            '<input type="text" class="form-control" id="add-sup-commodity" placeholder="e.g. Machine Monitoring Software"></div>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button class="btn btn-primary" onclick="window._suppliers._confirmAddSupplier()">Add</button>' +
            '<button class="btn btn-secondary" onclick="document.getElementById(\'addSupplierModal\').remove()">Cancel</button>' +
            '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
        setTimeout(function() {
            var el = document.getElementById('add-sup-name');
            if (el) el.focus();
        }, 50);
    }

    function _confirmAddSupplier() {
        var name = (document.getElementById('add-sup-name').value || '').trim();
        if (!name) { showToast('Name is required', 'error'); return; }
        ensureSuppliersData();
        if (app.data.suppliers.find(function(s) { return s.name.toLowerCase() === name.toLowerCase(); })) {
            showToast('A supplier with that name already exists', 'error'); return;
        }
        var type = document.getElementById('add-sup-type').value;
        var commodity = (document.getElementById('add-sup-commodity').value || '').trim();
        app.data.suppliers.push({
            id: generateId(),
            name,
            supplierType: type,
            commodity,
            contactName: '', contactEmail: '', contactPhone: '',
            website: '', paymentTerms: '', leadTimeDays: null,
            notes: '', tags: [],
            quality: 0, delivery: 0, responsiveness: 0, price: 0,
            opportunities: []
        });
        saveData();
        document.getElementById('addSupplierModal').remove();
        showToast(name + ' added');
        renderSuppliersPage();
        // Open detail modal so they can fill in the rest
        _supDetailTab = 'contact';
        showSupplierDetailModal(name);
    }

    // ─── Save Supplier Record ─────────────────────────────────────────────────
    function saveSupplierRecord(name) {
        ensureSuppliersData();
        var idx = app.data.suppliers.findIndex(s => s.name === name);
        var existing = idx >= 0 ? app.data.suppliers[idx] : {};

        var typeEl = document.getElementById('sup-type');
        var data = Object.assign({}, existing, {
            id:             existing.id || generateId(),
            name,
            supplierType:   typeEl ? typeEl.value : (existing.supplierType || 'parts'),
            contactName:    document.getElementById('sup-contact-name') ? document.getElementById('sup-contact-name').value.trim() : (existing.contactName || ''),
            contactEmail:   document.getElementById('sup-contact-email') ? document.getElementById('sup-contact-email').value.trim() : (existing.contactEmail || ''),
            contactPhone:   document.getElementById('sup-contact-phone') ? document.getElementById('sup-contact-phone').value.trim() : (existing.contactPhone || ''),
            website:        document.getElementById('sup-website') ? document.getElementById('sup-website').value.trim() : (existing.website || ''),
            commodity:      document.getElementById('sup-commodity') ? document.getElementById('sup-commodity').value.trim() : (existing.commodity || ''),
            paymentTerms:   document.getElementById('sup-payment-terms') ? document.getElementById('sup-payment-terms').value.trim() : (existing.paymentTerms || ''),
            leadTimeDays:   document.getElementById('sup-lead-time') ? parseInt(document.getElementById('sup-lead-time').value) || null : (existing.leadTimeDays || null),
            notes:          document.getElementById('sup-notes') ? document.getElementById('sup-notes').value.trim() : (existing.notes || ''),
            tags:           existing.tags || [],
            quality:        _pendingScores.quality,
            delivery:       _pendingScores.delivery,
            responsiveness: _pendingScores.responsiveness,
            price:          _pendingScores.price,
            opportunities:  existing.opportunities || []
        });

        if (idx >= 0) app.data.suppliers[idx] = data;
        else app.data.suppliers.push(data);
        saveData();
        showToast('Supplier saved');
        _supDetailTab = 'overview';
        _renderSupplierModal();
        renderSuppliersPage();
    }

    // ─── Init ─────────────────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const orig = window.renderCurrentPage;
        if (orig) {
            window.renderCurrentPage = function() {
                orig();
                if (app.currentPage === 'suppliers') renderSuppliersPage();
            };
        }
    }

    // ─── Public API ───────────────────────────────────────────────────────────
    window._suppliers = {
        renderSuppliersPage, showSupplierDetailModal, saveSupplierRecord,
        _setSupTab, _addOpportunity, _updateOppStatus, _deleteOpportunity,
        _logMeetingForSupplier, _newIssueForSupplier,
        _showAddSupplierModal, _confirmAddSupplier
    };
    window.renderSuppliersPage = renderSuppliersPage;
    app.setSupplierStar = setSupplierStar;

})();
