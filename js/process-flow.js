/* =========================
   js/process-flow.js
   Visual Process Flow Map — horizontal Lucidchart-style diagram
   ========================= */

(function () {
    'use strict';

    let _zoomLevel = 1;
    let _layoutMode = 'horizontal';

    // ─── Public entry point ───────────────────────────────────────────────────
    window.showProcessFlowModal = function (processId) {
        const proc = (app.data.processDocs || []).find(function (p) { return p.id === processId; });
        if (!proc) return;

        const existing = document.getElementById('processFlowModal');
        if (existing) existing.remove();

        _zoomLevel = 1;
        _layoutMode = 'horizontal';
        document.body.insertAdjacentHTML('beforeend', buildModalHTML(proc));
    };

    window.closeProcessFlowModal = function () {
        const m = document.getElementById('processFlowModal');
        if (m) m.remove();
    };

    window.pfZoom = function (delta) {
        _zoomLevel = Math.min(2, Math.max(0.3, _zoomLevel + delta));
        const el = document.getElementById('pf-flow-inner');
        if (el) el.style.transform = 'scale(' + _zoomLevel + ')';
        const label = document.getElementById('pf-zoom-label');
        if (label) label.textContent = Math.round(_zoomLevel * 100) + '%';
    };

    window.pfZoomFit = function () {
        const wrapper = document.getElementById('pf-flow-wrapper');
        const inner   = document.getElementById('pf-flow-inner');
        if (!wrapper || !inner) return;
        // Reset to 1 first to get natural size
        inner.style.transform = 'scale(1)';
        const wrapW = wrapper.clientWidth  - 40;
        const wrapH = wrapper.clientHeight - 40;
        const nodeW = inner.scrollWidth;
        const nodeH = inner.scrollHeight;
        const scale = Math.min(1, Math.min(wrapW / nodeW, wrapH / nodeH));
        _zoomLevel = Math.round(scale * 10) / 10;
        inner.style.transform = 'scale(' + _zoomLevel + ')';
        inner.style.transformOrigin = 'top left';
        const label = document.getElementById('pf-zoom-label');
        if (label) label.textContent = Math.round(_zoomLevel * 100) + '%';
    };

    window.pfToggleLayout = function () {
        _layoutMode = _layoutMode === 'horizontal' ? 'vertical' : 'horizontal';
        const flow = document.getElementById('pf-flow');
        if (flow) {
            flow.className = 'pf-flow ' + (_layoutMode === 'horizontal' ? 'pf-flow-h' : 'pf-flow-v');
        }
        const btn = document.getElementById('pf-layout-btn');
        if (btn) btn.textContent = _layoutMode === 'horizontal' ? '↕ Vert' : '↔ Horiz';
        window.pfZoomFit();
    };

    window.printProcessFlow = function (processId) {
        const proc = (app.data.processDocs || []).find(function (p) { return p.id === processId; });
        if (!proc) return;
        const steps = proc.steps || [];
        const failures = proc.failureModes || proc.failures || [];

        // Steps HTML — vertical numbered list
        var stepsHTML = steps.map(function (s, i) {
            var arrow = i < steps.length - 1
                ? '<div class="step-arrow">↓</div>'
                : '';
            return '<div class="step"><div class="step-num">' + (i + 1) + '</div>'
                + '<div class="step-text">' + esc(String(s)) + '</div></div>' + arrow;
        }).join('');

        // IO HTML
        var ioHTML = '';
        if (proc.inputs || proc.outputs) {
            ioHTML = '<div class="io-row">'
                + (proc.inputs  ? '<div class="io-box"><div class="io-label">Input</div><div>' + esc(proc.inputs)  + '</div></div>' : '')
                + (proc.outputs ? '<div class="io-box"><div class="io-label">Output</div><div>' + esc(proc.outputs) + '</div></div>' : '')
                + '</div>';
        }

        // Failure modes HTML
        var failHTML = '';
        if (failures.length > 0) {
            failHTML = '<h2>Failure Modes</h2>'
                + failures.map(function (f) {
                    var ft = typeof f === 'string' ? f : (f.failureMode || '');
                    var fi = typeof f === 'object' ? f.impact : '';
                    var fm = typeof f === 'object' ? f.mitigation : '';
                    return '<div class="failure">'
                        + '<div class="failure-mode">!' + esc(ft) + '</div>'
                        + (fi ? '<div class="failure-sub"><strong>Impact:</strong> ' + esc(fi) + '</div>' : '')
                        + (fm ? '<div class="failure-sub"><strong>Mitigation:</strong> ' + esc(fm) + '</div>' : '')
                        + '</div>';
                }).join('');
        }

        // Partners HTML
        var partnersHTML = '';
        if (proc.upstreamPartners || proc.downstreamPartners) {
            partnersHTML = '<h2>Partners</h2>'
                + (proc.upstreamPartners   ? '<p><strong>Upstream:</strong> '   + esc(proc.upstreamPartners)   + '</p>' : '')
                + (proc.downstreamPartners ? '<p><strong>Downstream:</strong> ' + esc(proc.downstreamPartners) + '</p>' : '');
        }

        var win = window.open('', '_blank');
        win.document.write('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
            + '<title>' + esc(proc.name) + ' — Process Flow</title>'
            + '<style>'
            + '@page { margin: 0.75in; size: letter; }'
            + '*, *::before, *::after { box-sizing: border-box; }'
            + 'body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #111; font-size: 13px; line-height: 1.6; background: #fff; }'
            + '.doc-header { border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 20px; }'
            + 'h1 { font-size: 20px; font-weight: 700; margin: 0 0 4px; }'
            + '.meta { color: #444; font-size: 12px; margin: 4px 0 0; }'
            + 'h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: #333; border-bottom: 1px solid #bbb; padding-bottom: 3px; margin: 24px 0 10px; page-break-after: avoid; }'
            + 'p { margin: 5px 0; font-size: 13px; }'
            + '.purpose { font-style: italic; color: #555; margin: 10px 0 0; font-size: 13px; }'
            + '.io-row { display: flex; gap: 16px; margin-bottom: 4px; page-break-inside: avoid; }'
            + '.io-box { flex: 1; border: 1px solid #ccc; border-radius: 4px; padding: 10px 14px; font-size: 13px; }'
            + '.io-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: #555; margin-bottom: 4px; }'
            + '.step { display: flex; align-items: flex-start; gap: 12px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; page-break-inside: avoid; }'
            + '.step-num { background: #111; color: #fff; font-size: 11px; font-weight: 700; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }'
            + '.step-text { font-size: 13px; line-height: 1.5; }'
            + '.step-arrow { text-align: center; color: #bbb; font-size: 14px; margin: 3px 0; line-height: 1; }'
            + '.failure { padding: 7px 10px; border-left: 3px solid #c0392b; margin-bottom: 6px; background: #fdf8f8; page-break-inside: avoid; }'
            + '.failure-mode { font-weight: 600; color: #c0392b; font-size: 13px; }'
            + '.failure-sub { font-size: 12px; color: #555; margin-top: 2px; }'
            + '.footer { margin-top: 36px; padding-top: 8px; border-top: 1px solid #ddd; color: #aaa; font-size: 10px; }'
            + '@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }'
            + '</style></head><body>'
            + '<div class="doc-header">'
            + '<h1>' + esc(proc.name) + '</h1>'
            + '<div class="meta">' + esc(proc.area) + ' · Owner: ' + esc(proc.owner) + ' · ' + steps.length + ' steps</div>'
            + (proc.purpose ? '<div class="purpose">' + esc(proc.purpose) + '</div>' : '')
            + '</div>'
            + (ioHTML ? '<h2>Inputs &amp; Outputs</h2>' + ioHTML : '')
            + (partnersHTML)
            + '<h2>Process Steps</h2>'
            + stepsHTML
            + failHTML
            + '<div class="footer">Generated by CI Tracker — ' + new Date().toLocaleString() + '</div>'
            + '</body></html>');
        win.document.close();
        win.print();
    };

    // ─── Modal HTML ───────────────────────────────────────────────────────────
    function buildModalHTML(proc) {
        const steps    = proc.steps || [];
        const failures = proc.failureModes || proc.failures || [];

        return '<div class="modal-overlay" id="processFlowModal"'
            + ' onclick="if(event.target===this)window.closeProcessFlowModal()">'
            + '<div class="pf-modal">'

            // Header
            + '<div class="pf-header">'
            + '<div>'
            + '<div class="pf-title">' + esc(proc.name) + '</div>'
            + '<div class="pf-subtitle">' + esc(proc.area) + ' &nbsp;·&nbsp; Owner: ' + esc(proc.owner) + '</div>'
            + '</div>'
            + '<div style="display:flex;gap:8px;align-items:center;">'
            + '<div class="pf-zoom-controls">'
            + '<button class="pf-zoom-btn" onclick="window.pfZoom(-0.1)" title="Zoom out">−</button>'
            + '<span id="pf-zoom-label" class="pf-zoom-label">100%</span>'
            + '<button class="pf-zoom-btn" onclick="window.pfZoom(0.1)" title="Zoom in">+</button>'
            + '<button class="pf-zoom-btn" onclick="window.pfZoomFit()" title="Fit to screen">Fit</button>'
            + '<div style="width:1px;background:var(--border);align-self:stretch;margin:2px 4px;"></div>'
            + '<button class="pf-zoom-btn" id="pf-layout-btn" onclick="window.pfToggleLayout()" title="Toggle layout">↕ Vert</button>'
            + '</div>'
            + '<button class="btn btn-secondary btn-small" onclick="window.printProcessFlow(\'' + proc.id + '\')">Print</button>'
            + '<button class="modal-close" onclick="window.closeProcessFlowModal()">&times;</button>'
            + '</div>'
            + '</div>'

            // Flow area (scrollable)
            + '<div class="pf-flow-wrapper" id="pf-flow-wrapper">'
            + '<div class="pf-flow-inner" id="pf-flow-inner">'
            + buildFlowHTML(proc, steps)
            + '</div>'
            + '</div>'

            // Details strip at bottom
            + buildDetailsStrip(proc, failures)

            + '</div>'  // .pf-modal
            + '</div>'; // .modal-overlay
    }

    // ─── Horizontal Flow ──────────────────────────────────────────────────────
    function buildFlowHTML(proc, steps) {
        const nodes = [];

        nodes.push({ type: 'terminal', text: 'START' });

        if (proc.inputs && proc.inputs.trim()) {
            nodes.push({ type: 'io', dir: 'in', label: 'INPUT', text: proc.inputs.trim() });
        }

        if (proc.upstreamPartners && proc.upstreamPartners.trim()) {
            nodes.push({ type: 'partner', label: 'UPSTREAM', text: proc.upstreamPartners.trim() });
        }

        steps.forEach(function (step, i) {
            nodes.push({ type: 'step', num: i + 1, text: String(step) });
        });

        if (proc.downstreamPartners && proc.downstreamPartners.trim()) {
            nodes.push({ type: 'partner', label: 'DOWNSTREAM', text: proc.downstreamPartners.trim() });
        }

        if (proc.outputs && proc.outputs.trim()) {
            nodes.push({ type: 'io', dir: 'out', label: 'OUTPUT', text: proc.outputs.trim() });
        }

        nodes.push({ type: 'terminal', text: 'END' });

        let html = '<div class="pf-flow ' + (_layoutMode === 'horizontal' ? 'pf-flow-h' : 'pf-flow-v') + '" id="pf-flow">';
        nodes.forEach(function (node, i) {
            if (i > 0) html += buildArrow();
            html += buildNode(node);
        });
        html += '</div>';
        return html;
    }

    function buildArrow() {
        return '<div class="pf-arrow"><div class="pf-arrow-line"></div><div class="pf-arrow-head"></div></div>';
    }

    function buildNode(node) {
        if (node.type === 'terminal') {
            return '<div class="pf-node pf-terminal">' + esc(node.text) + '</div>';
        }
        if (node.type === 'step') {
            return '<div class="pf-node pf-step">'
                + '<div class="pf-step-num">Step ' + node.num + '</div>'
                + '<div class="pf-step-text">' + esc(node.text) + '</div>'
                + '</div>';
        }
        if (node.type === 'io') {
            const cls = node.dir === 'out' ? 'pf-io pf-io-out' : 'pf-io pf-io-in';
            return '<div class="pf-node ' + cls + '">'
                + '<div class="pf-io-label">' + esc(node.label) + '</div>'
                + '<div class="pf-io-text">' + esc(node.text) + '</div>'
                + '</div>';
        }
        if (node.type === 'partner') {
            return '<div class="pf-node pf-partner">'
                + '<div class="pf-partner-label">' + esc(node.label) + '</div>'
                + '<div class="pf-partner-text">' + esc(node.text) + '</div>'
                + '</div>';
        }
        return '';
    }

    // ─── Details Strip ────────────────────────────────────────────────────────
    function buildDetailsStrip(proc, failures) {
        const steps = proc.steps || [];
        let cards = '';

        // Process info card
        cards += '<div class="pf-detail-card">'
            + '<div class="pf-detail-card-title">Process Info</div>'
            + detailRow('Area', proc.area)
            + detailRow('Owner', proc.owner)
            + detailRow('Steps', steps.length)
            + (proc.lastReviewedDate ? detailRow('Reviewed', proc.lastReviewedDate) : '')
            + '</div>';

        // Inputs / Outputs
        if (proc.inputs || proc.outputs) {
            cards += '<div class="pf-detail-card">'
                + '<div class="pf-detail-card-title">I / O</div>'
                + (proc.inputs  ? '<div class="pf-detail-io-label in">INPUT</div><div class="pf-detail-io-text">' + esc(proc.inputs)  + '</div>' : '')
                + (proc.outputs ? '<div class="pf-detail-io-label out" style="margin-top:8px;">OUTPUT</div><div class="pf-detail-io-text">' + esc(proc.outputs) + '</div>' : '')
                + '</div>';
        }

        // Failure modes
        if (failures.length > 0) {
            const fRows = failures.map(function (f) {
                const modeText = typeof f === 'string' ? f : (f.failureMode || '');
                const impact = typeof f === 'object' ? f.impact : '';
                const mitigation = typeof f === 'object' ? f.mitigation : '';
                return '<div class="pf-detail-failure">'
                    + '<div class="pf-failure-mode-text">!' + esc(modeText) + '</div>'
                    + (impact     ? '<div class="pf-failure-sub"><strong>Impact:</strong> ' + esc(impact) + '</div>' : '')
                    + (mitigation ? '<div class="pf-failure-sub"><strong>Fix:</strong> ' + esc(mitigation) + '</div>' : '')
                    + '</div>';
            }).join('');
            cards += '<div class="pf-detail-card pf-detail-card-wide">'
                + '<div class="pf-detail-card-title">Failure Modes (' + failures.length + ')</div>'
                + fRows
                + '</div>';
        }

        // Partners
        if (proc.upstreamPartners || proc.downstreamPartners) {
            cards += '<div class="pf-detail-card">'
                + '<div class="pf-detail-card-title">Partners</div>'
                + (proc.upstreamPartners   ? '<div class="pf-partner-label-sm">UPSTREAM</div><div class="pf-detail-io-text">'  + esc(proc.upstreamPartners)   + '</div>' : '')
                + (proc.downstreamPartners ? '<div class="pf-partner-label-sm" style="margin-top:8px;">DOWNSTREAM</div><div class="pf-detail-io-text">' + esc(proc.downstreamPartners) + '</div>' : '')
                + '</div>';
        }

        // Purpose
        if (proc.purpose) {
            cards += '<div class="pf-detail-card pf-detail-card-wide">'
                + '<div class="pf-detail-card-title">Purpose</div>'
                + '<div style="font-size:12px;color:var(--muted);line-height:1.5;">' + esc(proc.purpose) + '</div>'
                + '</div>';
        }

        return '<div class="pf-details-strip">' + cards + '</div>';
    }

    function detailRow(label, val) {
        return '<div class="pf-detail-kv"><span class="pf-detail-k">' + esc(label) + '</span><span class="pf-detail-v">' + esc(val) + '</span></div>';
    }

    // ─── Utility ──────────────────────────────────────────────────────────────
    function esc(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

})();
