/* =========================
   js/spc.js  v1
   SPC Control Charts
   ========================= */

(function() {
    'use strict';

    let _activeChartId = null;
    const _charts = {};  // Chart.js instances keyed by canvas id

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function ensureData() {
        if (!app.data.spcCharts) app.data.spcCharts = [];
    }

    // ─── Page render ──────────────────────────────────────────────────────────

    function renderSPCPage() {
        const page = document.getElementById('page-spc');
        if (!page) return;
        ensureData();

        const charts = app.data.spcCharts;

        page.innerHTML = `
            <header class="page-header">
                <h1>SPC Control Charts</h1>
                <button class="btn btn-primary" onclick="app.showCreateSPCChartModal()">+ New Chart</button>
            </header>
            <div class="spc-layout">
                <div class="spc-sidebar">
                    ${charts.length === 0
                        ? '<div class="spc-sidebar-empty">No charts yet.<br>Create one to get started.</div>'
                        : charts.map(c => `
                            <div class="spc-chart-item${_activeChartId === c.id ? ' active' : ''}"
                                 onclick="app.selectSPCChart('${c.id}')">
                                <div class="spc-chart-item-name">${escapeHtml(c.name)}</div>
                                <div class="spc-chart-item-meta">${escapeHtml(c.unit)} · ${(c.data||[]).length} pts</div>
                            </div>`).join('')
                    }
                </div>
                <div class="spc-main" id="spc-main">
                    ${_activeChartId
                        ? renderChartDetail(_activeChartId)
                        : '<div class="spc-placeholder">Select a chart from the list, or create a new one.</div>'}
                </div>
            </div>`;
    }

    function renderChartDetail(chartId) {
        const chart = (app.data.spcCharts || []).find(c => c.id === chartId);
        if (!chart) return '<div class="spc-placeholder">Chart not found.</div>';

        const pts = (chart.data || []).slice().sort((a, b) => a.date.localeCompare(b.date));
        const stats = computeStats(pts.map(p => p.value));

        const tableRows = pts.map((p, i) => {
            const oc = stats.n >= 2 && (p.value > stats.ucl || p.value < stats.lcl);
            return `<tr${oc ? ' class="spc-oc-row"' : ''}>
                <td>${p.date}</td>
                <td>${p.value}</td>
                <td style="color:var(--text-muted);font-size:11px;">${escapeHtml(p.note||'')}</td>
                <td><button class="btn btn-danger btn-small" onclick="app.deleteSPCPoint('${chartId}',${i})">Remove</button></td>
            </tr>`;
        }).join('');

        const statsHtml = stats.n >= 2
            ? `<div class="spc-stats-strip">
                <div class="spc-stat"><div class="spc-stat-val">${stats.mean.toFixed(3)}</div><div class="spc-stat-lbl">Mean (X̄)</div></div>
                <div class="spc-stat"><div class="spc-stat-val">${stats.sigma.toFixed(3)}</div><div class="spc-stat-lbl">Std Dev (σ)</div></div>
                <div class="spc-stat"><div class="spc-stat-val" style="color:#ef4444;">${stats.ucl.toFixed(3)}</div><div class="spc-stat-lbl">UCL (X̄+3σ)</div></div>
                <div class="spc-stat"><div class="spc-stat-val" style="color:#3b82f6;">${stats.lcl.toFixed(3)}</div><div class="spc-stat-lbl">LCL (X̄−3σ)</div></div>
                <div class="spc-stat"><div class="spc-stat-val" style="color:${stats.outOfControl>0?'#ef4444':'#7aaae4'};">${stats.outOfControl}</div><div class="spc-stat-lbl">Out-of-Control</div></div>
               </div>`
            : '<div style="color:var(--text-muted);font-size:12px;padding:8px 0;">Need at least 2 data points to compute control limits.</div>';

        return `
            <div class="spc-detail">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <div>
                        <h2 style="margin:0;">${escapeHtml(chart.name)}</h2>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Metric: ${escapeHtml(chart.metric)} · Unit: ${escapeHtml(chart.unit)}</div>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-secondary btn-small" onclick="app.showAddSPCPointModal('${chartId}')">+ Add Point</button>
                        <button class="btn btn-danger btn-small" onclick="app.deleteSPCChart('${chartId}')">Delete Chart</button>
                    </div>
                </div>
                ${statsHtml}
                <div style="position:relative;height:280px;margin:16px 0;">
                    <canvas id="spc-canvas-${chartId}"></canvas>
                </div>
                <div style="overflow-x:auto;margin-top:8px;">
                    <table class="spc-data-table">
                        <thead><tr><th>Date</th><th>${escapeHtml(chart.unit)}</th><th>Note</th><th></th></tr></thead>
                        <tbody>${tableRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:16px;">No data points yet.</td></tr>'}</tbody>
                    </table>
                </div>
            </div>`;
    }

    // ─── Statistics ───────────────────────────────────────────────────────────

    function computeStats(values) {
        const n = values.length;
        if (n === 0) return { n:0, mean:0, sigma:0, ucl:0, lcl:0, outOfControl:0 };
        const mean = values.reduce((s,v) => s + v, 0) / n;
        const sigma = n >= 2
            ? Math.sqrt(values.reduce((s,v) => s + (v - mean)**2, 0) / (n - 1))
            : 0;
        const ucl = mean + 3 * sigma;
        const lcl = mean - 3 * sigma;
        const outOfControl = values.filter(v => v > ucl || v < lcl).length;
        return { n, mean, sigma, ucl, lcl, outOfControl };
    }

    // ─── Chart.js rendering ───────────────────────────────────────────────────

    function drawChart(chartId) {
        const chart = (app.data.spcCharts || []).find(c => c.id === chartId);
        if (!chart) return;
        const pts = (chart.data || []).slice().sort((a, b) => a.date.localeCompare(b.date));
        if (pts.length === 0) return;

        const canvas = document.getElementById('spc-canvas-' + chartId);
        if (!canvas) return;

        const canvasKey = 'spc-canvas-' + chartId;
        if (_charts[canvasKey]) { _charts[canvasKey].destroy(); }

        const labels = pts.map(p => p.date);
        const values = pts.map(p => p.value);
        const stats = computeStats(values);

        const pointColors = values.map(v =>
            stats.n >= 2 && (v > stats.ucl || v < stats.lcl) ? '#ef4444' : '#ACFF24'
        );

        _charts[canvasKey] = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: chart.unit,
                        data: values,
                        borderColor: '#ACFF24',
                        backgroundColor: 'rgba(172,255,36,0.08)',
                        pointBackgroundColor: pointColors,
                        pointBorderColor: pointColors,
                        pointRadius: 5,
                        tension: 0.3,
                        fill: true,
                        order: 1
                    },
                    stats.n >= 2 && {
                        label: 'Mean (' + stats.mean.toFixed(2) + ')',
                        data: labels.map(() => stats.mean),
                        borderColor: '#94a3b8',
                        borderDash: [6,3],
                        pointRadius: 0,
                        borderWidth: 1.5,
                        order: 2
                    },
                    stats.n >= 2 && {
                        label: 'UCL (' + stats.ucl.toFixed(2) + ')',
                        data: labels.map(() => stats.ucl),
                        borderColor: '#ef4444',
                        borderDash: [4,4],
                        pointRadius: 0,
                        borderWidth: 1.5,
                        order: 3
                    },
                    stats.n >= 2 && {
                        label: 'LCL (' + stats.lcl.toFixed(2) + ')',
                        data: labels.map(() => stats.lcl),
                        borderColor: '#3b82f6',
                        borderDash: [4,4],
                        pointRadius: 0,
                        borderWidth: 1.5,
                        order: 4
                    }
                ].filter(Boolean)
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8', font: { size: 11 } } }
                },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }

    // ─── Modals ───────────────────────────────────────────────────────────────

    function showCreateSPCChartModal() {
        const existing = document.getElementById('spcCreateModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="spcCreateModal">
                <div class="modal" style="max-width:440px;">
                    <div class="modal-header">
                        <h2>New Control Chart</h2>
                        <button class="modal-close" onclick="document.getElementById('spcCreateModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Chart Name *</label>
                            <input class="form-control" id="spc-name" placeholder="e.g. Daily Defect Count">
                        </div>
                        <div class="form-group">
                            <label>Metric Description</label>
                            <input class="form-control" id="spc-metric" placeholder="e.g. Number of defects per shift">
                        </div>
                        <div class="form-group">
                            <label>Unit / Y-axis Label *</label>
                            <input class="form-control" id="spc-unit" placeholder="e.g. Defects, mm, %, mins">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('spcCreateModal').remove()">Cancel</button>
                        <button class="btn btn-primary" onclick="app.createSPCChart()">Create Chart</button>
                    </div>
                </div>
            </div>`);
        document.getElementById('spc-name').focus();
    }

    function createSPCChart() {
        const name   = (document.getElementById('spc-name')||{}).value?.trim();
        const metric = (document.getElementById('spc-metric')||{}).value?.trim() || name;
        const unit   = (document.getElementById('spc-unit')||{}).value?.trim();
        if (!name || !unit) { showToast('Name and unit are required'); return; }
        ensureData();
        const chart = { id: generateId(), name, metric, unit, data: [], createdAt: new Date().toISOString() };
        app.data.spcCharts.push(chart);
        saveData();
        document.getElementById('spcCreateModal')?.remove();
        _activeChartId = chart.id;
        renderSPCPage();
        requestAnimationFrame(() => drawChart(chart.id));
    }

    function showAddSPCPointModal(chartId) {
        const existing = document.getElementById('spcPointModal');
        if (existing) existing.remove();
        const today = new Date().toISOString().split('T')[0];
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="spcPointModal">
                <div class="modal" style="max-width:380px;">
                    <div class="modal-header">
                        <h2>Add Data Point</h2>
                        <button class="modal-close" onclick="document.getElementById('spcPointModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Date *</label>
                            <input class="form-control" id="spc-pt-date" type="date" value="${today}">
                        </div>
                        <div class="form-group">
                            <label>Value *</label>
                            <input class="form-control" id="spc-pt-val" type="number" step="any" placeholder="Numeric value">
                        </div>
                        <div class="form-group">
                            <label>Note (optional)</label>
                            <input class="form-control" id="spc-pt-note" placeholder="Any context for this point">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('spcPointModal').remove()">Cancel</button>
                        <button class="btn btn-primary" onclick="app.saveSPCPoint('${chartId}')">Add Point</button>
                    </div>
                </div>
            </div>`);
        document.getElementById('spc-pt-val').focus();
    }

    function saveSPCPoint(chartId) {
        const chart = (app.data.spcCharts || []).find(c => c.id === chartId);
        if (!chart) return;
        const date  = (document.getElementById('spc-pt-date')||{}).value;
        const val   = parseFloat((document.getElementById('spc-pt-val')||{}).value);
        const note  = (document.getElementById('spc-pt-note')||{}).value?.trim() || '';
        if (!date || isNaN(val)) { showToast('Date and numeric value are required'); return; }
        if (!chart.data) chart.data = [];
        chart.data.push({ date, value: val, note });
        saveData();
        document.getElementById('spcPointModal')?.remove();
        const main = document.getElementById('spc-main');
        if (main) main.innerHTML = renderChartDetail(chartId);
        requestAnimationFrame(() => drawChart(chartId));
    }

    function deleteSPCPoint(chartId, idx) {
        const chart = (app.data.spcCharts || []).find(c => c.id === chartId);
        if (!chart || !chart.data) return;
        const sorted = chart.data.slice().sort((a,b) => a.date.localeCompare(b.date));
        const pt = sorted[idx];
        if (!pt) return;
        const orig = chart.data.indexOf(pt);
        if (orig >= 0) chart.data.splice(orig, 1);
        saveData();
        const main = document.getElementById('spc-main');
        if (main) main.innerHTML = renderChartDetail(chartId);
        requestAnimationFrame(() => drawChart(chartId));
    }

    function deleteSPCChart(chartId) {
        if (!confirm('Delete this control chart and all its data?')) return;
        app.data.spcCharts = (app.data.spcCharts || []).filter(c => c.id !== chartId);
        if (_activeChartId === chartId) _activeChartId = null;
        saveData();
        renderSPCPage();
    }

    function selectSPCChart(chartId) {
        _activeChartId = chartId;
        const main = document.getElementById('spc-main');
        if (main) {
            main.innerHTML = renderChartDetail(chartId);
            requestAnimationFrame(() => drawChart(chartId));
        }
        document.querySelectorAll('.spc-chart-item').forEach(el => {
            el.classList.toggle('active', el.onclick?.toString().includes(chartId));
        });
        renderSPCPage(); // re-render sidebar active state cleanly
        requestAnimationFrame(() => drawChart(chartId));
    }

    // ─── Expose ───────────────────────────────────────────────────────────────

    window.renderSPCPage          = renderSPCPage;
    app.showCreateSPCChartModal   = showCreateSPCChartModal;
    app.createSPCChart            = createSPCChart;
    app.selectSPCChart            = selectSPCChart;
    app.showAddSPCPointModal      = showAddSPCPointModal;
    app.saveSPCPoint              = saveSPCPoint;
    app.deleteSPCPoint            = deleteSPCPoint;
    app.deleteSPCChart            = deleteSPCChart;

})();
