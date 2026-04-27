/* =========================
   js/cost-analysis.js  v54
   Cost Analysis Module
   ========================= */

(function() {
    'use strict';

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function fmt$(n) {
        if (n === null || n === undefined || isNaN(n)) return '—';
        return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function fmtPct(n) {
        if (n === null || n === undefined || isNaN(n)) return '—';
        return Number(n).toFixed(1) + '%';
    }

    // ─── Init ─────────────────────────────────────────────────────────────────

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCostAnalysisModule);
    } else {
        initCostAnalysisModule();
    }

    function initCostAnalysisModule() {
        ensureCostAnalysisData();
        // Focus table wrapper on hover so scroll wheel works without clicking first
        document.getElementById('page-cost-analysis').addEventListener('mouseover', function(e) {
            var wrap = e.target.closest('.cost-table-wrap');
            if (wrap && document.activeElement !== wrap) {
                wrap.tabIndex = -1;
                wrap.focus({ preventScroll: true });
            }
        });
    }

    function ensureCostAnalysisData() {
        if (!app.data.costAnalysis) {
            app.data.costAnalysis = { boatsPerYear: 12, parts: [], quarterlySnapshots: [], rawMaterials: [] };
        }
        if (!app.data.costAnalysis.parts) app.data.costAnalysis.parts = [];
        if (!app.data.costAnalysis.boatsPerYear) app.data.costAnalysis.boatsPerYear = 12;
        if (!app.data.costAnalysis.quarterlySnapshots) app.data.costAnalysis.quarterlySnapshots = [];
        if (!app.data.costAnalysis.rawMaterials) app.data.costAnalysis.rawMaterials = [];
        if (!app.data.costAnalysis.workCenters) app.data.costAnalysis.workCenters = [];
        if (!app.data.costAnalysis.tlas) app.data.costAnalysis.tlas = [];
        if (!app.data.costAnalysis.productKpis) app.data.costAnalysis.productKpis = [];
        // Auto-migrate any legacy embedded material data to the library
        migrateInHouseMaterials();
        // Seed manufacturing parts on first load
        _seedMfgParts();
        _seedMfgParts2();
        _seedRawMaterials();
        _seedMirageParts();
        _seedCorsairHingeParts();
        _initCorsairInHouseStructures();
        _seedPO8427();
        _seedAPEQuote030326();
        _seedGretnaQuote2456();
        _seedPayloadRailSystem();
        _seedPO12086();
        _seedPO9493();
        _seedPO9622();
        _seedPO11788();
        _healMTSSupplier();
        _seedTLA991_01014();
        _seedTLA991_01131();
        _migratePayloadRawMaterials();
        _migrate130_00029ToRawMaterial();
        // Ensure all standard work centers exist (re-creates any that were lost)
        _ensureStandardWorkCenters();
        // Auto-link ops to work centers by name match
        _autoLinkOpsByName();
        // Migrate commodity values out of supplier field
        _migrateCommodityField();
        // Normalize raw material UOM values
        _normalizeRMUomMigration();
        // Standardize Mill work center names
        _standardizeMillWC();
        // Merge any duplicate part-number entries
        _deduplicateParts();
        // Sync primary cost fields from purchaseOrders[] for parts that only got POs via seeds
        _migrateSyncPOPrimaries();
    }

    function _migrateCommodityField() {
        if (app.data.costAnalysis._commodityMigrated) return;
        app.data.costAnalysis._commodityMigrated = true;
        const COMMODITY_TERMS = ['mts mechanical', 'mechanical assembly', 'sub-assembly'];
        (app.data.costAnalysis.parts || []).forEach(function(p) {
            var sup = (p.currentSupplier || '').toLowerCase().trim();
            if (COMMODITY_TERMS.includes(sup)) {
                p.commodity = p.currentSupplier;
                p.currentSupplier = '';
            }
        });
        saveData();
    }

    function _seedMfgParts() {
        if (app.data.costAnalysis._mfgPartsSeeded) return;
        app.data.costAnalysis._mfgPartsSeeded = true;

        const seed = [
            { pn:'415-00402', rev:'000', desc:'BOW EYE RETAINING BLOCK, CORSAIR',                    qpb:1,  qtyRan:25,  ops:[{m:'Programming',h:9.3011},{m:'Saw',h:33.7619}] },
            { pn:'415-00473', rev:'000', desc:'*LS BOLT PAD, FUEL INLET, 316 SS',                    qpb:1,  qtyRan:113, ops:[{m:'Programming',h:18.2322},{m:'Lathe',h:32.0694}] },
            { pn:'415-00488', rev:'002', desc:'ORCA MOUNTING BRACKET, CLAMP',                        qpb:9,  qtyRan:90,  ops:[{m:'Programming',h:0.2947},{m:'Saw',h:3.0778},{m:'Mill Op 1',h:5.8608},{m:'Mill Op 2',h:12.7125},{m:'Mill Op 3',h:5.9108},{m:'Tumbler',h:0.1275}] },
            { pn:'415-00489', rev:'003', desc:'*LS ORCA MOUNTING BRACKET, LOCATING SLIDE',           qpb:9,  qtyRan:56,  ops:[{m:'Programming',h:1.6561},{m:'Saw',h:11.5067},{m:'Mill Op 1',h:2.9389},{m:'Manual Mill',h:2.0492}] },
            { pn:'415-00519', rev:'001', desc:'BACKING PLATE, MACHINED, LIFT POINT, FWD HULL',       qpb:4,  qtyRan:80,  ops:[{m:'Waterjet',h:5.4111},{m:'Mill Op 1',h:31.8164}] },
            { pn:'415-00585', rev:'000', desc:'L-TRACK, HEAVY DUTY, ANODIZED, 25 IN, 7075-T6',       qpb:2,  qtyRan:40,  ops:[{m:'Programming',h:7.1561},{m:'Saw',h:1.6433}] },
            { pn:'415-00586', rev:'001', desc:'L-TRACK, HEAVY DUTY, ANODIZED, 7075-T6',              qpb:2,  qtyRan:40,  ops:[{m:'Deburr',h:0.1097},{m:'Mill Op 1',h:3.2161},{m:'Mill Op 2',h:11.0622}] },
            { pn:'415-00604', rev:'000', desc:'Mounting Bracket (Bent), Standalone Volvo Steering Hub', qpb:1, qtyRan:68, ops:[{m:'Waterjet',h:0.8394},{m:'Deburr',h:1.8564},{m:'Press Brake',h:0.9075}] },
            { pn:'415-00605', rev:'000', desc:'BRACKET, VODIA DIAGNOSTIC PORT',                      qpb:1,  qtyRan:10,  ops:[{m:'Waterjet',h:2.5328},{m:'Deburr',h:0.3269},{m:'Press Brake',h:1.2969}] },
            { pn:'415-00611', rev:'001', desc:'PLUG, LPDC2M, THREADED',                              qpb:1,  qtyRan:40,  ops:[{m:'Lathe',h:6.5358}] },
            { pn:'415-00614', rev:'001', desc:'SPACER, NAV LIGHT CLAMP',                             qpb:1,  qtyRan:40,  ops:[{m:'Mill Op 1',h:20.2161},{m:'Manual Mill',h:0.9075}] },
            { pn:'415-00620', rev:'001', desc:'*LS ORCA MOUNTING BRACKET, MAIN BOSS, THRU MOUNTED',  qpb:9,  qtyRan:90,  ops:[{m:'Programming',h:2.3258},{m:'Saw',h:6.5886},{m:'Mill Op 1',h:18.9375},{m:'Manual Mill',h:4.1633}] },
            { pn:'415-00639', rev:'001', desc:'*LS SUNSHADE CLIP, DOVETAIL, SET SCREW',              qpb:16, qtyRan:200, ops:[{m:'Programming',h:17.1728},{m:'Saw',h:57.6961}] },
            { pn:'415-00662', rev:'000', desc:'LID, ENCLOSURE, CRADLEPOINT',                         qpb:1,  qtyRan:40,  ops:[{m:'Waterjet',h:2.9408},{m:'Mill Op 1',h:47.5742}] },
        ];

        const parts = app.data.costAnalysis.parts;
        let dirty = false;

        seed.forEach(function(s) {
            const existing = parts.find(function(p) { return p.partNumber === s.pn; });
            if (!existing) {
                parts.push({
                    id: generateId(),
                    partNumber: s.pn,
                    rev: s.rev,
                    description: s.desc,
                    unitOfMeasure: 'ea',
                    qpb: s.qpb,
                    currentSupplier: '',
                    currentPoNumber: '',
                    currentUnitCost: 0,
                    currentQtyPurchased: null,
                    aliases: [],
                    supersedesPartId: null,
                    productIds: [],
                    rfqs: [],
                    inHouse: {
                        qtyRan: s.qtyRan,
                        operations: s.ops.map(function(o) { return { id: generateId(), machine: o.m, hours: o.h, ratePerHour: 0 }; }),
                        laborOperations: [],
                        rawMaterialId: null,
                        usedPerPart: null,
                        materialQtyBought: null,
                        overheadPct: 0
                    }
                });
                dirty = true;
            } else if (!existing.inHouse) {
                existing.rev = existing.rev || s.rev;
                existing.inHouse = {
                    qtyRan: s.qtyRan,
                    operations: s.ops.map(function(o) { return { id: generateId(), machine: o.m, hours: o.h, ratePerHour: 0 }; }),
                    laborOperations: [],
                    rawMaterialId: null,
                    usedPerPart: null,
                    materialQtyBought: null,
                    overheadPct: 0
                };
                dirty = true;
            }
        });

        if (dirty) saveData();
    }

    // Auto-migrate parts that still have embedded materialPartNumber into the rawMaterials library.
    // Safe to run repeatedly — checks rawMaterialId before doing anything.
    function migrateInHouseMaterials() {
        const rms = app.data.costAnalysis.rawMaterials;
        const parts = app.data.costAnalysis.parts || [];
        let dirty = false;

        parts.forEach(p => {
            const ih = p.inHouse;
            if (!ih || ih.rawMaterialId) return; // already migrated or no material
            if (!ih.materialPartNumber && !ih.materialDescription) return; // nothing to migrate

            const pn = (ih.materialPartNumber || '').trim().toLowerCase();
            let match = pn ? rms.find(r => r.partNumber.trim().toLowerCase() === pn) : null;

            if (!match) {
                match = {
                    id: generateId(),
                    partNumber: ih.materialPartNumber || '',
                    description: ih.materialDescription || '',
                    uom: ih.materialUom || '',
                    costPerUom: Number(ih.materialCostPerUom) || 0,
                    supplier: '',
                    notes: 'Auto-migrated'
                };
                rms.push(match);
            }

            ih.rawMaterialId = match.id;
            // Migrate usedPerPart from legacy field
            if (ih.usedPerPart == null && ih.materialUsedPerPart != null) {
                ih.usedPerPart = ih.materialUsedPerPart;
            }
            dirty = true;
        });

        if (dirty) saveData();
    }


    // ─── Sync PO Primaries Migration ──────────────────────────────────────────
    // Parts seeded via append-only PO seeds have purchaseOrders[] entries but no
    // primary cost fields set (currentUnitCost=0, currentPoNumber=''). This one-time
    // migration calls _syncPrimaryFromPOs on all such parts so the comparison table
    // and detail modal header reflect the actual PO data.
    function _migrateSyncPOPrimaries() {
        if (app.data.costAnalysis._poSyncMigrated) return;
        app.data.costAnalysis._poSyncMigrated = true;
        var parts = app.data.costAnalysis.parts || [];
        var changed = false;
        parts.forEach(function(p) {
            if ((p.purchaseOrders || []).length > 0 && !(p.currentUnitCost > 0)) {
                _syncPrimaryFromPOs(p);
                changed = true;
            }
        });
        if (changed) saveData();
    }

    // ─── Deduplicate Parts ────────────────────────────────────────────────────
    // Finds parts with the same partNumber, merges them into one record, and
    // removes the extras. Safe to run repeatedly — only saves if it changed data.
    function _deduplicateParts() {
        var parts = app.data.costAnalysis.parts;
        if (!parts || parts.length === 0) return;

        // Group indices by normalized part number
        var groups = {};
        parts.forEach(function(p, i) {
            var key = (p.partNumber || '').trim().toUpperCase();
            if (!key) return;
            if (!groups[key]) groups[key] = [];
            groups[key].push(i);
        });

        var indicesToRemove = new Set();
        var changed = false;

        Object.keys(groups).forEach(function(key) {
            var indices = groups[key];
            if (indices.length < 2) return; // no dupe

            // Pick winner: prefer the one with currentUnitCost > 0, then most fields filled
            indices.sort(function(a, b) {
                var pa = parts[a], pb = parts[b];
                var scoreA = (pa.currentUnitCost > 0 ? 10 : 0) + (pa.inHouse ? 5 : 0) + (pa.description ? 1 : 0);
                var scoreB = (pb.currentUnitCost > 0 ? 10 : 0) + (pb.inHouse ? 5 : 0) + (pb.description ? 1 : 0);
                return scoreB - scoreA; // higher score first
            });

            var winner = parts[indices[0]];

            // Merge in data from losers
            indices.slice(1).forEach(function(li) {
                var loser = parts[li];

                // Fill in empty winner fields from loser
                if (!winner.description && loser.description) winner.description = loser.description;
                if (!winner.commodity && loser.commodity) winner.commodity = loser.commodity;
                if (!winner.currentSupplier && loser.currentSupplier) winner.currentSupplier = loser.currentSupplier;
                if (!winner.currentPoNumber && loser.currentPoNumber) winner.currentPoNumber = loser.currentPoNumber;
                if (!(winner.currentUnitCost > 0) && loser.currentUnitCost > 0) winner.currentUnitCost = loser.currentUnitCost;
                if (!winner.currentQtyPurchased && loser.currentQtyPurchased) winner.currentQtyPurchased = loser.currentQtyPurchased;
                if (!winner.qpb && loser.qpb) winner.qpb = loser.qpb;
                if (!winner.rev && loser.rev) winner.rev = loser.rev;
                if (!winner.unitOfMeasure && loser.unitOfMeasure) winner.unitOfMeasure = loser.unitOfMeasure;
                if (!winner.inHouse && loser.inHouse) winner.inHouse = loser.inHouse;

                // Merge productIds (union)
                var winnerPids = winner.productIds || [];
                (loser.productIds || []).forEach(function(pid) {
                    if (!winnerPids.includes(pid)) winnerPids.push(pid);
                });
                winner.productIds = winnerPids;

                // Merge aliases (union)
                var winnerAliases = winner.aliases || [];
                (loser.aliases || []).forEach(function(a) {
                    if (!winnerAliases.includes(a)) winnerAliases.push(a);
                });
                winner.aliases = winnerAliases;

                // Merge rfqs (by supplier+unitCost to avoid dupes)
                var winnerRfqs = winner.rfqs || [];
                (loser.rfqs || []).forEach(function(rfq) {
                    var already = winnerRfqs.find(function(r) {
                        return r.supplier === rfq.supplier && r.unitCost === rfq.unitCost;
                    });
                    if (!already) winnerRfqs.push(rfq);
                });
                winner.rfqs = winnerRfqs;

                // Merge purchaseOrders (by poNumber)
                var winnerPOs = winner.purchaseOrders || [];
                (loser.purchaseOrders || []).forEach(function(po) {
                    var already = winnerPOs.find(function(p) { return p.poNumber === po.poNumber; });
                    if (!already) winnerPOs.push(po);
                });
                winner.purchaseOrders = winnerPOs;

                indicesToRemove.add(li);
                changed = true;
            });
        });

        if (changed) {
            app.data.costAnalysis.parts = parts.filter(function(_, i) { return !indicesToRemove.has(i); });
            saveData();
        }
    }

    // Current view mode: 'comparison' | 'quarterly' | 'rawmaterials' | 'pipeline' | 'supply-risks'
    let _viewMode = 'comparison';
    let _supplyRiskFilter = 'all'; // 'all' | 'expired' | 'expiring' | 'single-source'
    let _pipelineFilter = null;    // null = kanban overview | 'All' | stage name
    let _caCharts = {};
    let _kpiSubView = null;
    let _auditFilter = null; // null = all issues | issue key string
    let _tlaDetailId = null; // null = TLA list | tla.id = detail view
    let _prodKpiProductId = null; // null = show all products
    let _rmSortCol = 'partNumber'; let _rmSortDir = 'asc'; let _rmSearch = '';
    let _compSortCol = 'savingsPct';  let _compSortDir = 'desc';
    let _compFilterCommodity = '';
    let _compFilterProduct = '';
    let _compFilterSearch = '';

    // ─── Top-level Render ─────────────────────────────────────────────────────

    function renderCostAnalysisPage() {
        const container = document.getElementById('page-cost-analysis');
        if (!container) return;
        ensureCostAnalysisData();

        const summary = computeSummary();
        const bpy = app.data.costAnalysis.boatsPerYear;

        container.innerHTML = `
            <header class="page-header">
                <h1>Cost Analysis</h1>
                <div class="cost-header-actions">
                    <button class="btn btn-primary" onclick="window._ca.showAddPartModal()">+ Add Part</button>
                    <button class="btn btn-secondary" onclick="window._ca.showPasteImportModal()">Paste from Excel</button>
                    <label class="btn btn-secondary" style="cursor:pointer;">
                        Upload CSV
                        <input type="file" accept=".csv" style="display:none" onchange="window._ca.handleCSVUpload(this)">
                    </label>
                    <button class="btn btn-secondary" onclick="window._ca.exportCostCSV()">Export CSV</button>
                    <button class="btn btn-secondary" onclick="window._ca.showBasketCompareModal()" title="Side-by-side supplier basket comparison">Basket Compare</button>
                    <button class="btn btn-secondary" onclick="window._ca.showCaptureSnapshotModal()" title="Save current costs as a quarterly snapshot">Capture Quarter</button>
                    <label class="cost-bpy-label">
                        Boats/Year:
                        <input type="number" class="cost-bpy-input" value="${bpy}" min="1"
                            onchange="window._ca.updateBoatsPerYear(this.value)">
                    </label>
                </div>
            </header>

            <div class="cost-kpi-strip">
                <div class="cost-kpi-card">
                    <div class="cost-kpi-value">${summary.partCount}</div>
                    <div class="cost-kpi-label">Parts Tracked</div>
                </div>
                <div class="cost-kpi-card">
                    <div class="cost-kpi-value">${fmt$(summary.currentSpendPerBoat)}</div>
                    <div class="cost-kpi-label">Current $/Boat</div>
                </div>
                <div class="cost-kpi-card ${summary.annualSavings > 0 ? 'cost-kpi-savings' : ''}">
                    <div class="cost-kpi-value">${fmt$(summary.annualSavings)}</div>
                    <div class="cost-kpi-label">Annual Savings Potential</div>
                </div>
            </div>

            <div class="cost-view-tabs">
                <button class="cost-view-tab ${_viewMode === 'comparison' ? 'active' : ''}"
                    onclick="window._ca.switchView('comparison')">Cost Comparison</button>
                <button class="cost-view-tab ${_viewMode === 'quarterly' ? 'active' : ''}"
                    onclick="window._ca.switchView('quarterly')">Quarter-to-Quarter</button>
                <button class="cost-view-tab ${_viewMode === 'rawmaterials' ? 'active' : ''}"
                    onclick="window._ca.switchView('rawmaterials')">Raw Materials</button>
                <button class="cost-view-tab ${_viewMode === 'workcenters' ? 'active' : ''}"
                    onclick="window._ca.switchView('workcenters')">Work Centers</button>
                <button class="cost-view-tab ${_viewMode === 'pipeline' ? 'active' : ''}"
                    onclick="window._ca.switchView('pipeline')">Savings Pipeline</button>
                <button class="cost-view-tab ${_viewMode === 'kpi' ? 'active' : ''}"
                    onclick="window._ca.switchView('kpi')">KPI Dashboard</button>
                <button class="cost-view-tab ${_viewMode === 'audit' ? 'active' : ''}"
                    onclick="window._ca.switchView('audit')">Data Audit</button>
                <button class="cost-view-tab ${_viewMode === 'tlas' ? 'active' : ''}"
                    onclick="window._ca.switchView('tlas')">TLAs</button>
                <button class="cost-view-tab ${_viewMode === 'product-kpis' ? 'active' : ''}"
                    onclick="window._ca.switchView('product-kpis')">Product KPIs</button>
            </div>

            <div id="ca-main-content">
                ${_viewMode === 'comparison' ? renderComparisonTable()
                    : _viewMode === 'quarterly' ? renderQuarterlyTable()
                    : _viewMode === 'workcenters' ? renderWorkCentersView()
                    : _viewMode === 'pipeline' ? renderSavingsPipeline()
                    : _viewMode === 'supply-risks' ? renderSupplyRisksView()
                    : _viewMode === 'kpi' ? renderKPIView()
                    : _viewMode === 'audit' ? renderAuditView()
                    : _viewMode === 'tlas' ? renderTLAsView()
                    : _viewMode === 'product-kpis' ? renderProductKPIsView()
                    : renderRawMaterialsView()}
            </div>
        `;
        if (_viewMode === 'kpi') _initKPICharts();
        if (_viewMode === 'audit') _initAuditCharts();
        if (typeof window.applyEmojiStyles === 'function') window.applyEmojiStyles();
    }

    function switchView(mode) {
        _viewMode = mode;
        renderCostAnalysisPage();
    }

    // ─── Summary ──────────────────────────────────────────────────────────────

    function _countExpiringRFQs() {
        var parts = app.data.costAnalysis.parts || [];
        var today = new Date(); today.setHours(0,0,0,0);
        var soonMs = 30 * 24 * 60 * 60 * 1000;
        var expired = 0, expiring = 0, singleSource = 0, longLT = 0;
        parts.forEach(function(p) {
            var rfqs = p.rfqs || [];
            if (rfqs.length === 0) { singleSource++; return; }
            var best = getBestRFQ(p);
            if (best && best.validUntil) {
                var d = new Date(best.validUntil);
                if (d < today) expired++;
                else if ((d - today) <= soonMs) expiring++;
            }
            if (best && Number(best.leadTimeDays) > 60) longLT++;
        });
        return { expired: expired, expiring: expiring, singleSource: singleSource, longLT: longLT };
    }

    // ─── Expiry Alert Banner ──────────────────────────────────────────────────

    function renderExpiryAlertBanner() {
        var r = _countExpiringRFQs();
        if (r.expired === 0 && r.expiring === 0 && r.singleSource === 0 && r.longLT === 0) return '';
        var items = [];
        if (r.expired > 0) items.push('<span class="ca-eb-item" onclick="window._ca.showSupplyRisks(\'expired\')" title="View expired RFQs">' + r.expired + ' expired RFQ' + (r.expired > 1 ? 's' : '') + '</span>');
        if (r.expiring > 0) items.push('<span class="ca-eb-item" onclick="window._ca.showSupplyRisks(\'expiring\')" title="View expiring RFQs">' + r.expiring + ' expiring within 30 days</span>');
        if (r.singleSource > 0) items.push('<span class="ca-eb-item" onclick="window._ca.showSupplyRisks(\'single-source\')" title="View single-source parts">' + r.singleSource + ' single-source part' + (r.singleSource > 1 ? 's' : '') + '</span>');
        if (r.longLT > 0) items.push('<span class="ca-eb-item" onclick="window._ca.showSupplyRisks(\'long-lt\')" title="View long lead time parts">' + r.longLT + ' long lead time part' + (r.longLT > 1 ? 's' : '') + ' (&gt;60 days)</span>');
        return '<div class="ca-expiry-banner"><span class="ca-eb-label">! Supply Risks:</span>' +
            items.join('<span class="ca-eb-sep"> · </span>') +
            '<span class="ca-eb-sep"> · </span><span class="ca-eb-item" onclick="window._ca.showSupplyRisks(\'all\')">View all →</span>' +
            '</div>';
    }

    function showSupplyRisks(type) {
        _supplyRiskFilter = type || 'all';
        _viewMode = 'supply-risks';
        renderCostAnalysisPage();
        // Scroll to top of main content
        var mc = document.getElementById('ca-main-content');
        if (mc) mc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ─── Supply Risks View ────────────────────────────────────────────────────

    function renderSupplyRisksView() {
        var allParts = app.data.costAnalysis.parts || [];
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var soonMs = 30 * 24 * 60 * 60 * 1000;

        function daysBetween(a, b) { return Math.round((b - a) / (1000 * 60 * 60 * 24)); }

        // ── Classify parts ──
        var expiredParts = [];
        var expiringParts = [];
        var singleSourceParts = [];
        var longLTParts = [];

        allParts.forEach(function(p) {
            var rfqs = p.rfqs || [];
            if (rfqs.length === 0) {
                singleSourceParts.push(p);
                return;
            }
            var best = getBestRFQ(p);
            if (best && best.validUntil) {
                var d = new Date(best.validUntil);
                if (d < today) expiredParts.push({ part: p, best: best, daysAgo: daysBetween(d, today) });
                else if ((d - today) <= soonMs) expiringParts.push({ part: p, best: best, daysLeft: daysBetween(today, d) });
            }
            if (best && Number(best.leadTimeDays) > 60) longLTParts.push({ part: p, best: best });
        });
        expiringParts.sort(function(a, b) { return a.daysLeft - b.daysLeft; });
        longLTParts.sort(function(a, b) { return Number(b.best.leadTimeDays) - Number(a.best.leadTimeDays); });

        var filter = _supplyRiskFilter;

        // ── Nav pills ──
        function pill(type, label, count, color) {
            var active = filter === type || (type === 'all' && filter === 'all');
            return '<button class="ca-risk-pill' + (active ? ' active' : '') + '" style="' + (active ? 'border-color:' + color + ';color:' + color + ';' : '') + '" onclick="window._ca.showSupplyRisks(\'' + type + '\')">' +
                label + (count != null ? ' <span class="ca-risk-pill-count">' + count + '</span>' : '') + '</button>';
        }

        var nav = '<div class="ca-risk-nav">' +
            '<button class="btn btn-secondary btn-small" onclick="window._ca.switchView(\'comparison\')" style="margin-right:12px;">← Cost Comparison</button>' +
            pill('all', 'All Risks', expiredParts.length + expiringParts.length + singleSourceParts.length + longLTParts.length, '#ef4444') +
            pill('expired', 'Expired', expiredParts.length, '#ef4444') +
            pill('expiring', 'Expiring Soon', expiringParts.length, '#f59e0b') +
            pill('single-source', 'Single Source', singleSourceParts.length, '#f97316') +
            pill('long-lt', 'Long Lead Time', longLTParts.length, '#6366f1') +
            '</div>';

        var sections = '';

        // ── Expired section ──
        if (filter === 'all' || filter === 'expired') {
            var expiredRows = expiredParts.length === 0
                ? '<tr><td colspan="9" class="muted" style="text-align:center;padding:16px;">No expired RFQs.</td></tr>'
                : expiredParts.map(function(e) {
                    var p = e.part; var r = e.best; var qpb = Number(p.qpb) || 1;
                    return '<tr class="rfq-expired">' +
                        '<td><strong>' + escapeHtml(p.partNumber) + '</strong>' + (p.rev ? ' <span class="cost-rev-badge">Rev ' + escapeHtml(p.rev) + '</span>' : '') + '</td>' +
                        '<td>' + escapeHtml(p.description || '') + '</td>' +
                        '<td style="text-align:center;">' + qpb + '</td>' +
                        '<td>' + escapeHtml(p.currentSupplier || '—') + '</td>' +
                        '<td>' + fmt$(p.currentUnitCost) + '</td>' +
                        '<td><strong>' + escapeHtml(r.supplier) + '</strong></td>' +
                        '<td>' + fmt$(r.unitCost) + '</td>' +
                        '<td>' + fmt$(Number(r.unitCost) * qpb) + '</td>' +
                        '<td>' + escapeHtml(r.quoteRef || '—') + '</td>' +
                        '<td><span style="color:#ef4444;font-weight:600;">' + escapeHtml(r.validUntil) + '</span><br><small class="muted">' + e.daysAgo + ' day' + (e.daysAgo !== 1 ? 's' : '') + ' ago</small></td>' +
                        '<td class="cost-table-actions">' +
                        '<button class="btn btn-primary btn-small" onclick="window._ca.showAddRFQModal(\'' + p.id + '\')">+ New RFQ</button> ' +
                        '<button class="btn btn-secondary btn-small" onclick="window._ca.showAddRFQModal(\'' + p.id + '\',\'' + r.id + '\')">Edit</button> ' +
                        '<button class="btn btn-secondary btn-small" onclick="window._ca.showPartDetailModal(\'' + p.id + '\')">⋯</button>' +
                        '</td></tr>';
                }).join('');

            sections += '<div class="ca-risk-section">' +
                '<div class="ca-risk-section-header" style="background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.3);">' +
                '<span class="ca-risk-section-icon"></span>' +
                '<div><strong>Expired RFQs</strong> — ' + expiredParts.length + ' part' + (expiredParts.length !== 1 ? 's' : '') +
                '<div class="ca-risk-section-sub">These quotes have passed their valid-until date. Re-quote or extend to restore coverage.</div></div>' +
                '</div>' +
                '<div class="cost-table-wrap"><table class="cost-table">' +
                '<thead><tr><th>Part #</th><th>Description</th><th>QPB</th><th>Current Supplier</th><th>Current $/unit</th><th>Best RFQ Supplier</th><th>RFQ $/unit</th><th>RFQ $/boat</th><th>Quote Ref</th><th>Expired On</th><th>Actions</th></tr></thead>' +
                '<tbody>' + expiredRows + '</tbody></table></div></div>';
        }

        // ── Expiring section ──
        if (filter === 'all' || filter === 'expiring') {
            var expiringRows = expiringParts.length === 0
                ? '<tr><td colspan="10" class="muted" style="text-align:center;padding:16px;">No RFQs expiring within 30 days.</td></tr>'
                : expiringParts.map(function(e) {
                    var p = e.part; var r = e.best; var qpb = Number(p.qpb) || 1;
                    var urgencyColor = e.daysLeft <= 7 ? '#ef4444' : e.daysLeft <= 14 ? '#f59e0b' : '#eab308';
                    return '<tr class="rfq-expiring">' +
                        '<td><strong>' + escapeHtml(p.partNumber) + '</strong>' + (p.rev ? ' <span class="cost-rev-badge">Rev ' + escapeHtml(p.rev) + '</span>' : '') + '</td>' +
                        '<td>' + escapeHtml(p.description || '') + '</td>' +
                        '<td style="text-align:center;">' + qpb + '</td>' +
                        '<td>' + escapeHtml(p.currentSupplier || '—') + '</td>' +
                        '<td>' + fmt$(p.currentUnitCost) + '</td>' +
                        '<td><strong>' + escapeHtml(r.supplier) + '</strong></td>' +
                        '<td>' + fmt$(r.unitCost) + '</td>' +
                        '<td>' + fmt$(Number(r.unitCost) * qpb) + '</td>' +
                        '<td>' + escapeHtml(r.quoteRef || '—') + '</td>' +
                        '<td>' + escapeHtml(r.validUntil) + '<br><small style="color:' + urgencyColor + ';font-weight:600;">' + e.daysLeft + ' day' + (e.daysLeft !== 1 ? 's' : '') + ' left</small></td>' +
                        '<td class="cost-table-actions">' +
                        '<button class="btn btn-primary btn-small" onclick="window._ca.showAddRFQModal(\'' + p.id + '\')">+ New RFQ</button> ' +
                        '<button class="btn btn-secondary btn-small" onclick="window._ca.showAddRFQModal(\'' + p.id + '\',\'' + r.id + '\')">Edit</button> ' +
                        '<button class="btn btn-secondary btn-small" onclick="window._ca.showPartDetailModal(\'' + p.id + '\')">⋯</button>' +
                        '</td></tr>';
                }).join('');

            sections += '<div class="ca-risk-section">' +
                '<div class="ca-risk-section-header" style="background:rgba(234,179,8,.1);border-color:rgba(234,179,8,.3);">' +
                '<span class="ca-risk-section-icon"></span>' +
                '<div><strong>Expiring Within 30 Days</strong> — ' + expiringParts.length + ' part' + (expiringParts.length !== 1 ? 's' : '') +
                '<div class="ca-risk-section-sub">Sorted by urgency. Renew or request updated quotes before expiry.</div></div>' +
                '</div>' +
                '<div class="cost-table-wrap"><table class="cost-table">' +
                '<thead><tr><th>Part #</th><th>Description</th><th>QPB</th><th>Current Supplier</th><th>Current $/unit</th><th>Best RFQ Supplier</th><th>RFQ $/unit</th><th>RFQ $/boat</th><th>Quote Ref</th><th>Expires On</th><th>Actions</th></tr></thead>' +
                '<tbody>' + expiringRows + '</tbody></table></div></div>';
        }

        // ── Single-source section ──
        if (filter === 'all' || filter === 'single-source') {
            var ssRows = singleSourceParts.length === 0
                ? '<tr><td colspan="7" class="muted" style="text-align:center;padding:16px;">No single-source parts.</td></tr>'
                : singleSourceParts.map(function(p) {
                    var qpb = Number(p.qpb) || 1;
                    var cur = Number(p.currentUnitCost) || 0;
                    return '<tr>' +
                        '<td><strong>' + escapeHtml(p.partNumber) + '</strong>' + (p.rev ? ' <span class="cost-rev-badge">Rev ' + escapeHtml(p.rev) + '</span>' : '') + '</td>' +
                        '<td>' + escapeHtml(p.description || '') + '</td>' +
                        '<td>' + escapeHtml(p.commodity || '—') + '</td>' +
                        '<td style="text-align:center;">' + qpb + '</td>' +
                        '<td>' + (p.currentSupplier ? escapeHtml(p.currentSupplier) : '<span class="muted">—</span>') + '</td>' +
                        '<td>' + (cur > 0 ? fmt$(cur) : '<span class="muted">—</span>') + '</td>' +
                        '<td>' + (cur > 0 ? fmt$(cur * qpb) : '<span class="muted">—</span>') + '</td>' +
                        '<td class="cost-table-actions">' +
                        '<button class="btn btn-primary btn-small" onclick="window._ca.showAddRFQModal(\'' + p.id + '\')">+ Add RFQ</button> ' +
                        '<button class="btn btn-secondary btn-small" onclick="window._ca.showPartDetailModal(\'' + p.id + '\')">⋯</button>' +
                        '</td></tr>';
                }).join('');

            var ssTotalBoat = singleSourceParts.reduce(function(s, p) { return s + (Number(p.currentUnitCost) || 0) * (Number(p.qpb) || 1); }, 0);

            sections += '<div class="ca-risk-section">' +
                '<div class="ca-risk-section-header" style="background:rgba(249,115,22,.1);border-color:rgba(249,115,22,.3);">' +
                '<span class="ca-risk-section-icon"></span>' +
                '<div><strong>Single-Source Parts</strong> — ' + singleSourceParts.length + ' part' + (singleSourceParts.length !== 1 ? 's' : '') +
                (ssTotalBoat > 0 ? ' · <span style="color:var(--text-muted);">Total exposure: ' + fmt$(ssTotalBoat) + '/boat</span>' : '') +
                '<div class="ca-risk-section-sub">No competing RFQs on file. Add quotes to enable price comparison and reduce supply risk.</div></div>' +
                '</div>' +
                '<div class="cost-table-wrap"><table class="cost-table">' +
                '<thead><tr><th>Part #</th><th>Description</th><th>Commodity</th><th>QPB</th><th>Current Supplier</th><th>$/unit</th><th>$/boat</th><th>Actions</th></tr></thead>' +
                '<tbody>' + ssRows + '</tbody></table></div></div>';
        }

        // ── Long Lead Time section ──
        if (filter === 'all' || filter === 'long-lt') {
            var ltRows = longLTParts.length === 0
                ? '<tr><td colspan="8" class="muted" style="text-align:center;padding:16px;">No parts with lead time &gt;60 days.</td></tr>'
                : longLTParts.map(function(e) {
                    var p = e.part; var r = e.best; var qpb = Number(p.qpb) || 1;
                    var lt = Number(r.leadTimeDays);
                    var ltColor = lt > 120 ? '#ef4444' : lt > 90 ? '#f59e0b' : '#6366f1';
                    return '<tr class="rfq-long-lt">' +
                        '<td><strong>' + escapeHtml(p.partNumber) + '</strong>' + (p.rev ? ' <span class="cost-rev-badge">Rev ' + escapeHtml(p.rev) + '</span>' : '') + '</td>' +
                        '<td>' + escapeHtml(p.description || '') + '</td>' +
                        '<td>' + escapeHtml(p.commodity || '—') + '</td>' +
                        '<td style="text-align:center;">' + qpb + '</td>' +
                        '<td>' + escapeHtml(p.currentSupplier || '—') + '</td>' +
                        '<td><strong>' + escapeHtml(r.supplier) + '</strong></td>' +
                        '<td style="color:' + ltColor + ';font-weight:600;">' + lt + ' days</td>' +
                        '<td>' + fmt$(r.unitCost) + '</td>' +
                        '<td class="cost-table-actions">' +
                        '<button class="btn btn-secondary btn-small" onclick="window._ca.showAddRFQModal(\'' + p.id + '\',\'' + r.id + '\')">Edit RFQ</button> ' +
                        '<button class="btn btn-secondary btn-small" onclick="window._ca.showPartDetailModal(\'' + p.id + '\')">⋯</button>' +
                        '</td></tr>';
                }).join('');

            sections += '<div class="ca-risk-section">' +
                '<div class="ca-risk-section-header" style="background:rgba(99,102,241,.1);border-color:rgba(99,102,241,.3);">' +
                '<span class="ca-risk-section-icon"></span>' +
                '<div><strong>Long Lead Time Parts</strong> — ' + longLTParts.length + ' part' + (longLTParts.length !== 1 ? 's' : '') + ' with best RFQ lead time &gt;60 days' +
                '<div class="ca-risk-section-sub">Long lead times increase supply risk. Consider alternative suppliers or stocking strategies.</div></div>' +
                '</div>' +
                '<div class="cost-table-wrap"><table class="cost-table">' +
                '<thead><tr><th>Part #</th><th>Description</th><th>Commodity</th><th>QPB</th><th>Current Supplier</th><th>Best RFQ Supplier</th><th>Lead Time</th><th>RFQ $/unit</th><th>Actions</th></tr></thead>' +
                '<tbody>' + ltRows + '</tbody></table></div></div>';
        }

        return nav + '<div class="ca-risk-sections">' + sections + '</div>';
    }

    // ─── Savings Pipeline (Phase 2) ───────────────────────────────────────────

    const PIPELINE_STAGES = ['Identified', 'Contacted', 'Quoted', 'Negotiating', 'Awarded', 'Declined'];

    // Stage metadata: color and whether savings are tracked
    var PIPELINE_STAGE_META = {
        'Identified':  { color: '#6b7280', accent: 'rgba(107,114,128,.12)' },
        'Contacted':   { color: '#3b82f6', accent: 'rgba(59,130,246,.12)'  },
        'Quoted':      { color: '#8b5cf6', accent: 'rgba(139,92,246,.12)'  },
        'Negotiating': { color: '#f59e0b', accent: 'rgba(245,158,11,.12)'  },
        'Awarded':     { color: '#7aaae4', accent: 'rgba(90,154,122,.12)'  },
        'Declined':    { color: '#ef4444', accent: 'rgba(239,68,68,.12)'   }
    };

    function renderSavingsPipeline() {
        var allParts = app.data.costAnalysis.parts || [];

        // Collect all RFQs with their part context
        var allEntries = [];
        allParts.forEach(function(p) {
            (p.rfqs || []).forEach(function(r) {
                var stage = r.negotiationStage || 'Identified';
                var savings = ((Number(p.currentUnitCost) || 0) - (Number(r.unitCost) || 0)) * (Number(p.qpb) || 1);
                allEntries.push({ part: p, rfq: r, stage: stage, savings: savings });
            });
        });

        if (allEntries.length === 0) {
            return '<div class="empty-state">' +
                '<p>No RFQs yet. Add RFQs to parts to populate the Savings Pipeline.</p></div>';
        }

        var filter = _pipelineFilter; // null | 'All' | stage name

        // ── Stage pills ──
        var pillsHtml = '<div class="ca-risk-nav">' +
            (filter !== null ? '<button class="btn btn-secondary btn-small" onclick="window._ca._setPipelineView(null)" style="margin-right:12px;">← Kanban</button>' : '') +
            _makePipelinePill(null, 'Kanban', null, filter) +
            _makePipelinePill('All', 'All RFQs', allEntries.length, filter) +
            PIPELINE_STAGES.map(function(s) {
                var count = allEntries.filter(function(e) { return e.stage === s; }).length;
                return _makePipelinePill(s, s, count, filter);
            }).join('') +
            '</div>';

        // ── Kanban board (when no filter) ──
        if (filter === null) {
            var kpiStrip = _renderPipelineKPIs(allEntries);
            var cols = PIPELINE_STAGES.map(function(stage) {
                var stageEntries = allEntries.filter(function(e) { return e.stage === stage; });
                var meta = PIPELINE_STAGE_META[stage] || {};
                var cardsHtml = stageEntries.map(function(e) {
                    var p = e.part; var r = e.rfq;
                    var savingsHtml = e.savings > 0
                        ? '<div class="pipeline-card-savings">saves ' + fmt$(e.savings) + '/boat</div>'
                        : (e.savings < 0 ? '<div class="pipeline-card-savings" style="color:#f87171;">+' + fmt$(Math.abs(e.savings)) + '/boat vs current</div>' : '');
                    var stageOpts = PIPELINE_STAGES.map(function(s) {
                        return '<option value="' + s + '"' + (s === stage ? ' selected' : '') + '>' + s + '</option>';
                    }).join('');
                    return '<div class="pipeline-card" onclick="window._ca.showPartDetailModal(\'' + p.id + '\')">' +
                        '<div class="pipeline-card-pn">' + escapeHtml(p.partNumber) + '</div>' +
                        '<div class="pipeline-card-supplier">' + escapeHtml(r.supplier) + '</div>' +
                        '<div class="pipeline-card-cost">' + fmt$(r.unitCost) + '/unit · ' + fmt$(Number(r.unitCost) * (Number(p.qpb) || 1)) + '/boat</div>' +
                        savingsHtml +
                        (r.validUntil ? '<div class="pipeline-card-supplier" style="margin-top:3px;">Exp: ' + escapeHtml(r.validUntil) + '</div>' : '') +
                        '<select class="pipeline-stage-select" onclick="event.stopPropagation()" onchange="window._ca._setPipelineStage(\'' + p.id + '\',\'' + r.id + '\',this.value)">' + stageOpts + '</select>' +
                        '</div>';
                }).join('');
                var stageSavings = stageEntries.reduce(function(s, e) { return s + (e.savings > 0 ? e.savings : 0); }, 0);
                return '<div class="pipeline-col">' +
                    '<div class="pipeline-col-header" style="cursor:pointer;border-bottom:2px solid ' + (meta.color || 'var(--accent)') + ';" onclick="window._ca._setPipelineView(\'' + stage + '\')" title="Click to view detail">' +
                    escapeHtml(stage) +
                    '<span class="pipeline-col-count">' + stageEntries.length + '</span>' +
                    '</div>' +
                    (stageSavings > 0 ? '<div style="font-size:11px;color:#7aaae4;padding:5px 12px 0;text-align:right;">' + fmt$(stageSavings) + ' savings</div>' : '') +
                    '<div class="pipeline-cards">' + (cardsHtml || '<div style="padding:8px;font-size:12px;color:var(--text-muted);">—</div>') + '</div>' +
                    '</div>';
            }).join('');
            return pillsHtml + kpiStrip + '<div class="pipeline-board">' + cols + '</div>';
        }

        // ── Detail table view (filter = 'All' or a stage name) ──
        var toShow = filter === 'All' ? allEntries
            : allEntries.filter(function(e) { return e.stage === filter; });

        // Sort: Awarded first for 'All'; within stage sort by savings desc
        if (filter === 'All') {
            var stageOrder = {};
            PIPELINE_STAGES.forEach(function(s, i) { stageOrder[s] = i; });
            toShow = toShow.slice().sort(function(a, b) {
                if (stageOrder[a.stage] !== stageOrder[b.stage]) return stageOrder[a.stage] - stageOrder[b.stage];
                return b.savings - a.savings;
            });
        } else {
            toShow = toShow.slice().sort(function(a, b) { return b.savings - a.savings; });
        }

        var kpiStrip = _renderPipelineKPIs(toShow);

        var sections = '';
        var stagesToRender = filter === 'All' ? PIPELINE_STAGES : [filter];

        stagesToRender.forEach(function(stage) {
            var stageEntries = filter === 'All'
                ? toShow.filter(function(e) { return e.stage === stage; })
                : toShow;
            if (filter === 'All' && stageEntries.length === 0) return;
            var meta = PIPELINE_STAGE_META[stage] || {};
            var stageSavings = stageEntries.reduce(function(s, e) { return s + (e.savings > 0 ? e.savings : 0); }, 0);

            var rows = stageEntries.map(function(e) {
                var p = e.part; var r = e.rfq; var qpb = Number(p.qpb) || 1;
                var savCls = e.savings > 0 ? 'savings-positive' : e.savings < 0 ? 'savings-negative' : '';
                var savPct = (p.currentUnitCost > 0 && r.unitCost != null)
                    ? ((e.savings / (Number(p.currentUnitCost) * qpb)) * 100)
                    : null;
                var today2 = new Date(); today2.setHours(0,0,0,0);
                var expHtml = '';
                if (r.validUntil) {
                    var expDate = new Date(r.validUntil);
                    var daysLeft = Math.round((expDate - today2) / (1000*60*60*24));
                    var expColor = daysLeft < 0 ? '#ef4444' : daysLeft <= 7 ? '#f87171' : daysLeft <= 30 ? '#f59e0b' : '';
                    expHtml = '<span style="' + (expColor ? 'color:' + expColor + ';font-weight:600;' : '') + '">' + escapeHtml(r.validUntil) +
                        (daysLeft >= 0 && daysLeft <= 30 ? ' (' + daysLeft + 'd)' : '') + '</span>';
                }
                var stageOpts = PIPELINE_STAGES.map(function(s) {
                    return '<option value="' + s + '"' + (s === e.stage ? ' selected' : '') + '>' + s + '</option>';
                }).join('');
                return '<tr>' +
                    '<td><strong>' + escapeHtml(p.partNumber) + '</strong>' + (p.rev ? ' <span class="cost-rev-badge">Rev ' + escapeHtml(p.rev) + '</span>' : '') + '</td>' +
                    '<td>' + escapeHtml(p.description || '') + '</td>' +
                    '<td>' + escapeHtml(p.commodity || '—') + '</td>' +
                    '<td style="text-align:center;">' + qpb + '</td>' +
                    '<td>' + escapeHtml(p.currentSupplier || '—') + '</td>' +
                    '<td>' + fmt$(p.currentUnitCost) + '</td>' +
                    '<td>' + fmt$(Number(p.currentUnitCost) * qpb) + '</td>' +
                    '<td><strong>' + escapeHtml(r.supplier) + '</strong></td>' +
                    '<td>' + escapeHtml(r.quoteRef || '—') + '</td>' +
                    '<td>' + fmt$(r.unitCost) + '</td>' +
                    '<td>' + fmt$(Number(r.unitCost) * qpb) + '</td>' +
                    '<td><span class="' + savCls + '">' + fmt$(e.savings) + '</span></td>' +
                    '<td>' + (savPct !== null ? '<span class="' + savCls + '">' + savPct.toFixed(1) + '%</span>' : '—') + '</td>' +
                    '<td>' + (r.leadTimeDays ? r.leadTimeDays + 'd' : '—') + '</td>' +
                    '<td>' + (r.moq || '—') + '</td>' +
                    '<td>' + (expHtml || '—') + '</td>' +
                    '<td>' + escapeHtml(r.notes || '') + '</td>' +
                    (filter === 'All' ? '<td><select class="pipeline-stage-select" style="width:110px;" onchange="window._ca._setPipelineStage(\'' + p.id + '\',\'' + r.id + '\',this.value)">' + stageOpts + '</select></td>' : '') +
                    '<td class="cost-table-actions">' +
                    '<button class="btn btn-secondary btn-small" onclick="window._ca.showAddRFQModal(\'' + p.id + '\',\'' + r.id + '\')">Edit</button> ' +
                    '<button class="btn btn-secondary btn-small" onclick="window._ca.showPartDetailModal(\'' + p.id + '\')">⋯</button>' +
                    '</td></tr>';
            }).join('');

            var stageColspan = filter === 'All' ? 20 : 19;
            if (rows === '') rows = '<tr><td colspan="' + stageColspan + '" class="muted" style="text-align:center;padding:16px;">No RFQs in this stage.</td></tr>';

            sections += '<div class="ca-risk-section" style="margin-bottom:24px;">' +
                '<div class="ca-risk-section-header" style="background:' + (meta.accent || 'rgba(107,114,128,.1)') + ';border-color:' + (meta.color || '#6b7280') + '40;">' +
                '<span class="ca-risk-section-icon" style="color:' + (meta.color || '#6b7280') + ';">●</span>' +
                '<div><strong>' + escapeHtml(stage) + '</strong> — ' + stageEntries.length + ' RFQ' + (stageEntries.length !== 1 ? 's' : '') +
                (stageSavings > 0 ? ' · <span style="color:#7aaae4;">potential savings: ' + fmt$(stageSavings) + '/boat</span>' : '') +
                '</div>' +
                '<div style="margin-left:auto;">' +
                '<select class="pipeline-stage-select" style="width:130px;font-size:12px;" onclick="event.stopPropagation()" title="Move ALL RFQs in this stage to another stage" onchange="window._ca._bulkMoveStage(\'' + stage + '\',this.value);this.value=\'' + stage + '\'">' +
                '<option value="' + stage + '">Move all to…</option>' +
                PIPELINE_STAGES.filter(function(s) { return s !== stage; }).map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
                '</select>' +
                '</div>' +
                '</div>' +
                '<div class="cost-table-wrap" style="overflow-x:auto;"><table class="cost-table">' +
                '<thead><tr>' +
                '<th>Part #</th><th>Description</th><th>Commodity</th><th>QPB</th>' +
                '<th>Curr Supplier</th><th>Curr $/unit</th><th>Curr $/boat</th>' +
                '<th>RFQ Supplier</th><th>Quote Ref</th><th>RFQ $/unit</th><th>RFQ $/boat</th>' +
                '<th>Savings/boat</th><th>Savings %</th>' +
                '<th>Lead Time</th><th>MOQ</th><th>Valid Until</th><th>Notes</th>' +
                (filter === 'All' ? '<th>Stage</th>' : '') +
                '<th>Actions</th>' +
                '</tr></thead>' +
                '<tbody>' + rows + '</tbody></table></div></div>';
        });

        return pillsHtml + kpiStrip + '<div class="ca-risk-sections">' + sections + '</div>';
    }

    function _makePipelinePill(value, label, count, activeFilter) {
        var active = activeFilter === value;
        var meta = PIPELINE_STAGE_META[value] || {};
        var color = meta.color || 'var(--accent)';
        return '<button class="ca-risk-pill' + (active ? ' active' : '') + '"' +
            (active && meta.color ? ' style="border-color:' + color + ';color:' + color + ';"' : '') +
            ' onclick="window._ca._setPipelineView(' + (value === null ? 'null' : '\'' + value + '\'') + ')">' +
            escapeHtml(label) +
            (count != null ? ' <span class="ca-risk-pill-count">' + count + '</span>' : '') +
            '</button>';
    }

    function _renderPipelineKPIs(entries) {
        var total = entries.length;
        var totalSavings = entries.reduce(function(s, e) { return s + (e.savings > 0 ? e.savings : 0); }, 0);
        var awarded = entries.filter(function(e) { return e.stage === 'Awarded'; });
        var awardedSavings = awarded.reduce(function(s, e) { return s + (e.savings > 0 ? e.savings : 0); }, 0);
        return '<div class="pipeline-kpi-strip">' +
            '<div class="pipeline-kpi-card"><div class="pipeline-kpi-val">' + total + '</div><div class="pipeline-kpi-lbl">RFQs Tracked</div></div>' +
            '<div class="pipeline-kpi-card"><div class="pipeline-kpi-val" style="color:#7aaae4;">' + fmt$(totalSavings) + '</div><div class="pipeline-kpi-lbl">Potential Savings/boat</div></div>' +
            '<div class="pipeline-kpi-card"><div class="pipeline-kpi-val" style="color:#7aaae4;">' + awarded.length + '</div><div class="pipeline-kpi-lbl">Awarded</div></div>' +
            (awardedSavings > 0 ? '<div class="pipeline-kpi-card"><div class="pipeline-kpi-val" style="color:#7aaae4;">' + fmt$(awardedSavings) + '</div><div class="pipeline-kpi-lbl">Captured Savings/boat</div></div>' : '') +
            '</div>';
    }

    function _setPipelineView(stage) {
        _pipelineFilter = stage;
        _viewMode = 'pipeline';
        renderCostAnalysisPage();
        var mc = document.getElementById('ca-main-content');
        if (mc) mc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function _setPipelineStage(partId, rfqId, stage) {
        var part = getPart(partId);
        if (!part) return;
        var rfq = (part.rfqs || []).find(function(r) { return r.id === rfqId; });
        if (!rfq) return;
        rfq.negotiationStage = stage;
        saveData();
        showToast('Stage: ' + stage);
        renderCostAnalysisPage();
    }

    function _bulkMoveStage(fromStage, toStage) {
        if (!toStage || toStage === fromStage) return;
        var parts = app.data.costAnalysis.parts || [];
        var count = 0;
        parts.forEach(function(p) {
            (p.rfqs || []).forEach(function(r) {
                if ((r.negotiationStage || 'Identified') === fromStage) {
                    r.negotiationStage = toStage; count++;
                }
            });
        });
        if (count > 0) { saveData(); showToast('Moved ' + count + ' RFQ' + (count !== 1 ? 's' : '') + ' to ' + toStage); renderCostAnalysisPage(); }
    }

    // ─── Make vs. Buy (Phase 3) ───────────────────────────────────────────────

    function _renderMakeVsBuyPanel(partId) {
        var part = getPart(partId);
        if (!part) return '';
        var mvb = part.makeVsBuy || {};
        var best = getBestRFQ(part);
        var cur = Number(part.currentUnitCost) || 0;
        var fields = [
            { id: 'mvb-machine-rate', label: 'Machine Rate ($/hr)', val: mvb.machineRate || 0, step: '0.01' },
            { id: 'mvb-cycle-time',   label: 'Cycle Time (min/unit)', val: mvb.cycleTimeMin || 0, step: '0.1' },
            { id: 'mvb-labor-rate',   label: 'Labor Rate ($/hr)', val: mvb.laborRate || 0, step: '0.01' },
            { id: 'mvb-labor-time',   label: 'Labor Time (min/unit)', val: mvb.laborTimeMin || 0, step: '0.1' },
            { id: 'mvb-tooling',      label: 'Tooling ($/unit)', val: mvb.toolingPerUnit || 0, step: '0.001' },
            { id: 'mvb-setup',        label: 'Setup Cost ($, amort. over batch)', val: mvb.setupCost || 0, step: '0.01' },
            { id: 'mvb-scrap',        label: 'Scrap %', val: mvb.scrapPct || 0, step: '0.1' },
            { id: 'mvb-overhead',     label: 'Overhead Multiplier', val: mvb.overheadMult || 1.0, step: '0.01' }
        ];
        var formHtml = '<div class="mvb-grid">' +
            fields.map(function(f) {
                return '<div class="form-group" style="margin-bottom:6px;">' +
                    '<label class="form-label" style="font-size:11px;">' + f.label + '</label>' +
                    '<input type="number" class="form-control" id="' + f.id + '" value="' + f.val + '" step="' + f.step + '" oninput="window._ca._updateMvbResult(\'' + partId + '\')" style="padding:4px 8px;">' +
                    '</div>';
            }).join('') + '</div>';
        var resultsHtml = '<div id="mvb-results-' + partId + '" class="mvb-result-cards"></div>';
        var qpb = Number(part.qpb) || 1;
        return '<div class="mvb-panel">' +
            '<div class="mvb-panel-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\'">' +
            'Make vs. Buy Analysis <span style="font-size:12px;font-weight:400;color:var(--text-muted);">click to expand</span>' +
            '</div>' +
            '<div class="mvb-panel-body" style="display:none;">' +
            formHtml + resultsHtml +
            '<div style="margin-top:10px;">' +
            '<button class="btn btn-primary btn-small" onclick="window._ca.saveMakeVsBuy(\'' + partId + '\')">Save</button></div>' +
            '</div></div>';
    }

    function _updateMvbResult(partId) {
        var part = getPart(partId);
        if (!part) return;
        var get = function(id) { return parseFloat(document.getElementById(id).value) || 0; };
        var machineRate = get('mvb-machine-rate');
        var cycleTimeMin = get('mvb-cycle-time');
        var laborRate = get('mvb-labor-rate');
        var laborTimeMin = get('mvb-labor-time');
        var tooling = get('mvb-tooling');
        var setup = get('mvb-setup');
        var scrapPct = get('mvb-scrap');
        var overheadMult = get('mvb-overhead') || 1;
        var qpb = Number(part.qpb) || 1;
        var base = (machineRate * cycleTimeMin / 60) + (laborRate * laborTimeMin / 60) + tooling + (setup / qpb);
        var inHouseCost = base * (1 + scrapPct / 100) * overheadMult;
        var cur = Number(part.currentUnitCost) || 0;
        var best = getBestRFQ(part);
        var bestCost = best ? Number(best.unitCost) : null;
        var container = document.getElementById('mvb-results-' + partId);
        if (!container) return;
        var decision = inHouseCost > 0 && cur > 0
            ? (inHouseCost < cur * 0.9 ? 'Make' : inHouseCost < cur * 1.1 ? 'Investigate' : 'Buy')
            : '';
        var decisionCls = decision === 'Make' ? 'mvb-make' : decision === 'Buy' ? 'mvb-buy' : 'mvb-investigate';
        var cards = [
            '<div class="mvb-result-card"><div class="mvb-result-label">In-House $/unit</div><div class="mvb-result-value ' + (inHouseCost > 0 ? '' : 'muted') + '">' + (inHouseCost > 0 ? fmt$(inHouseCost) : '—') + '</div></div>',
            '<div class="mvb-result-card"><div class="mvb-result-label">Current Purchase $/unit</div><div class="mvb-result-value">' + (cur > 0 ? fmt$(cur) : '—') + '</div></div>',
            bestCost !== null ? '<div class="mvb-result-card"><div class="mvb-result-label">Best RFQ $/unit</div><div class="mvb-result-value">' + fmt$(bestCost) + '</div></div>' : '',
            decision ? '<div class="mvb-result-card"><div class="mvb-result-label">Recommendation</div><div class="mvb-result-value ' + decisionCls + '">' + decision + '</div></div>' : ''
        ].filter(Boolean).join('');
        container.innerHTML = cards;
    }

    function saveMakeVsBuy(partId) {
        var part = getPart(partId);
        if (!part) return;
        var get = function(id) { return parseFloat(document.getElementById(id).value) || 0; };
        part.makeVsBuy = {
            machineRate:    get('mvb-machine-rate'),
            cycleTimeMin:   get('mvb-cycle-time'),
            laborRate:      get('mvb-labor-rate'),
            laborTimeMin:   get('mvb-labor-time'),
            toolingPerUnit: get('mvb-tooling'),
            setupCost:      get('mvb-setup'),
            scrapPct:       get('mvb-scrap'),
            overheadMult:   get('mvb-overhead') || 1
        };
        saveData();
        showToast('Make vs. Buy data saved');
    }

    // ─── Basket Compare Modal (Phase 4) ──────────────────────────────────────

    function showBasketCompareModal() {
        var parts = app.data.costAnalysis.parts || [];
        var supplierSet = new Set();
        parts.forEach(function(p) {
            if (p.currentSupplier) supplierSet.add(p.currentSupplier);
            (p.rfqs || []).forEach(function(r) { if (r.supplier) supplierSet.add(r.supplier); });
        });
        var suppliers = Array.from(supplierSet).sort();
        if (suppliers.length === 0) {
            showToast('No suppliers found. Add suppliers to parts first.', 'error'); return;
        }
        var supplierChecks = suppliers.map(function(s, i) {
            return '<label><input type="checkbox" id="bcs-' + i + '" value="' + escapeHtml(s) + '"' + (i < 4 ? ' checked' : '') + '> ' + escapeHtml(s) + '</label>';
        }).join('');
        var html = '<div class="modal-overlay" id="caBasketModal">' +
            '<div class="modal modal-wide">' +
            '<div class="modal-header"><h2>Basket Compare</h2>' +
            '<button class="modal-close" onclick="document.getElementById(\'caBasketModal\').remove()">&times;</button></div>' +
            '<div class="modal-body" style="padding:0;">' +
            '<div class="basket-modal-layout">' +
            '<div class="basket-supplier-list">' +
            '<div style="font-weight:600;font-size:12px;margin-bottom:8px;color:var(--text-muted);">SELECT SUPPLIERS</div>' +
            supplierChecks +
            '<button class="btn btn-primary btn-small" style="margin-top:12px;width:100%;" onclick="window._ca._renderBasketTable()">Compare</button>' +
            '</div>' +
            '<div class="basket-table-area" id="basketTableArea"><p style="color:var(--text-muted);padding:20px;">Select suppliers and click Compare.</p></div>' +
            '</div></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" onclick="document.getElementById(\'caBasketModal\').remove()">Close</button></div>' +
            '</div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function _renderBasketTable() {
        var parts = app.data.costAnalysis.parts || [];
        var selected = [];
        document.querySelectorAll('#caBasketModal .basket-supplier-list input[type=checkbox]:checked').forEach(function(cb) {
            selected.push(cb.value);
        });
        if (selected.length === 0) { showToast('Select at least one supplier.', 'error'); return; }
        var container = document.getElementById('basketTableArea');
        if (!container) return;

        // Build cost matrix: partId → {supplier → cost}
        var matrix = {};
        parts.forEach(function(p) {
            var row = {};
            selected.forEach(function(sup) {
                // Check current supplier first
                if ((p.currentSupplier || '').trim() === sup && p.currentUnitCost > 0) {
                    row[sup] = Number(p.currentUnitCost) * (Number(p.qpb) || 1);
                } else {
                    // Check RFQs
                    var rfq = (p.rfqs || []).filter(function(r) { return (r.supplier || '').trim() === sup; })
                        .sort(function(a, b) { return Number(a.unitCost) - Number(b.unitCost); })[0];
                    if (rfq) row[sup] = Number(rfq.unitCost) * (Number(p.qpb) || 1);
                    else row[sup] = null;
                }
            });
            // Only include part if at least one supplier has data
            if (Object.values(row).some(function(v) { return v !== null; })) {
                matrix[p.id] = { part: p, row: row };
            }
        });

        var thead = '<tr><th>Part #</th>' + selected.map(function(s) { return '<th>' + escapeHtml(s) + '</th>'; }).join('') + '</tr>';
        var totals = {};
        selected.forEach(function(s) { totals[s] = 0; });
        var tbodyRows = Object.values(matrix).map(function(entry) {
            var p = entry.part; var row = entry.row;
            var vals = selected.map(function(s) { return row[s]; });
            var minVal = Math.min.apply(null, vals.filter(function(v) { return v !== null; }));
            var cells = selected.map(function(s) {
                var v = row[s];
                if (v === null) return '<td><span class="muted">—</span></td>';
                var isBest = v === minVal;
                totals[s] += v;
                return '<td class="' + (isBest ? 'basket-best' : '') + '">' + fmt$(v) + '</td>';
            }).join('');
            return '<tr><td><strong>' + escapeHtml(p.partNumber) + '</strong></td>' + cells + '</tr>';
        }).join('');
        var totalVals = selected.map(function(s) { return totals[s]; });
        var minTotal = Math.min.apply(null, totalVals);
        var tfootCells = selected.map(function(s, i) {
            return '<td class="' + (totals[s] === minTotal ? 'basket-best' : '') + '">' + fmt$(totals[s]) + '</td>';
        }).join('');
        var tfoot = '<tr><td><strong>Total $/boat</strong></td>' + tfootCells + '</tr>';
        var html = '<div class="basket-table-wrap"><table class="basket-table">' +
            '<thead>' + thead + '</thead>' +
            '<tbody>' + tbodyRows + '</tbody>' +
            '<tfoot>' + tfoot + '</tfoot>' +
            '</table></div>';
        container.innerHTML = html;
    }

    function computeSummary() {
        const parts = app.data.costAnalysis.parts || [];
        const bpy = app.data.costAnalysis.boatsPerYear || 12;
        let currentSpendPerBoat = 0;
        let bestSpendPerBoat = 0;

        parts.forEach(p => {
            const qpb = Number(p.qpb) || 0;
            const cur = Number(p.currentUnitCost) || 0;
            currentSpendPerBoat += cur * qpb;
            const best = getBestRFQ(p);
            const bestCost = best ? Number(best.unitCost) : cur;
            bestSpendPerBoat += bestCost * qpb;
        });

        const savingsPerBoat = currentSpendPerBoat - bestSpendPerBoat;
        return {
            partCount: parts.length,
            currentSpendPerBoat,
            bestSpendPerBoat,
            savingsPerBoat,
            annualSavings: savingsPerBoat * bpy
        };
    }

    // ─── Sort helpers ─────────────────────────────────────────────────────────

    function _thSort(label, col, curCol, curDir, fn) {
        const active = curCol === col;
        const arrow  = active ? (curDir === 'asc' ? '&#9650;' : '&#9660;') : '<span style="opacity:.35">&#8645;</span>';
        const cls    = 'ca-th-sort' + (active ? ' ca-th-sort-active' : '');
        return '<th class="' + cls + '" onclick="window._ca.' + fn + '(\'' + col + '\')">' + label + ' ' + arrow + '</th>';
    }

    function _setRMSort(col) {
        if (_rmSortCol === col) { _rmSortDir = _rmSortDir === 'asc' ? 'desc' : 'asc'; }
        else { _rmSortCol = col; _rmSortDir = 'asc'; }
        renderCostAnalysisPage();
    }

    function _setCompSort(col) {
        if (_compSortCol === col) { _compSortDir = _compSortDir === 'asc' ? 'desc' : 'asc'; }
        else {
            _compSortCol = col;
            _compSortDir = ['partNumber','description','uom','supplier','commodity'].includes(col) ? 'asc' : 'desc';
        }
        renderCostAnalysisPage();
    }

    function _setCompFilter(val) {
        _compFilterCommodity = val;
        renderCostAnalysisPage();
    }

    function _setCompProductFilter(val) {
        _compFilterProduct = val;
        renderCostAnalysisPage();
    }

    function _setCompSearch(val) {
        _compFilterSearch = val;
        renderCostAnalysisPage();
        // Re-focus the search input and restore cursor (renderCostAnalysisPage is synchronous)
        const el = document.getElementById('ca-part-search');
        if (el) { el.focus(); el.setSelectionRange(val.length, val.length); }
    }

    // ─── Comparison Table ─────────────────────────────────────────────────────

    function renderComparisonTable() {
        const parts = app.data.costAnalysis.parts || [];

        if (parts.length === 0) {
            return '<div class="empty-state">' +
                   '<p>No parts yet. Add a part or import from Excel/CSV to get started.</p></div>';
        }

        // Build filter bar
        const allCommodities = [...new Set(parts.map(p => p.commodity).filter(Boolean))].sort();
        const commodityOptions = '<option value="">All Commodities</option>' +
            allCommodities.map(c => '<option value="' + escapeHtml(c) + '"' + (_compFilterCommodity === c ? ' selected' : '') + '>' + escapeHtml(c) + '</option>').join('');

        const allProducts = (app.data.products || []).slice().sort((a, b) => a.name.localeCompare(b.name));
        const productOptions = '<option value="">All Products</option>' +
            allProducts.map(pr => '<option value="' + escapeHtml(pr.id) + '"' + (_compFilterProduct === pr.id ? ' selected' : '') + '>' + escapeHtml(pr.name) + '</option>').join('');

        const anyFilter = _compFilterCommodity || _compFilterProduct || _compFilterSearch;
        const filterBar = '<div class="ca-filter-bar">' +
            '<input type="text" id="ca-part-search" class="form-control ca-filter-search" placeholder="Search part #..." value="' + escapeHtml(_compFilterSearch) + '" oninput="window._ca._setCompSearch(this.value)">' +
            '<label class="ca-filter-label">Commodity:</label>' +
            '<select class="form-control ca-filter-select" onchange="window._ca._setCompFilter(this.value)">' + commodityOptions + '</select>' +
            '<label class="ca-filter-label">Product:</label>' +
            '<select class="form-control ca-filter-select" onchange="window._ca._setCompProductFilter(this.value)">' + productOptions + '</select>' +
            (anyFilter ? '<button class="btn btn-secondary btn-small" onclick="window._ca._setCompFilter(\'\');window._ca._setCompProductFilter(\'\');window._ca._setCompSearch(\'\')">Clear All</button>' : '') +
            '</div>';

        const predecessorIds = new Set(
            parts.filter(p => p.supersedesPartId).map(p => p.supersedesPartId)
        );
        const searchTerm = _compFilterSearch.toLowerCase().trim();
        const filteredParts = parts
            .filter(p => !_compFilterCommodity || (p.commodity || '') === _compFilterCommodity)
            .filter(p => !_compFilterProduct || (p.productIds || []).includes(_compFilterProduct))
            .filter(p => !searchTerm ||
                (p.partNumber || '').toLowerCase().includes(searchTerm) ||
                (p.description || '').toLowerCase().includes(searchTerm) ||
                (p.aliases || []).some(a => a.toLowerCase().includes(searchTerm)));
        const rootParts = filteredParts.filter(p => !predecessorIds.has(p.id));

        function computeRow(p) {
            const qpb = Number(p.qpb) || 0;
            const cur = Number(p.currentUnitCost) || 0;
            const curPerBoat = cur * qpb;
            const best = getBestRFQ(p);
            const bestCost = best ? Number(best.unitCost) : null;
            const bestPerBoat = bestCost !== null ? bestCost * qpb : null;
            const savingsPerBoat = bestPerBoat !== null ? curPerBoat - bestPerBoat : null;
            const savingsPct = (savingsPerBoat !== null && curPerBoat > 0) ? (savingsPerBoat / curPerBoat) * 100 : null;
            return { p, qpb, cur, curPerBoat, best, bestCost, bestPerBoat, savingsPerBoat, savingsPct };
        }

        const rootRows = rootParts.map(computeRow);
        rootRows.sort((a, b) => {
            let aVal, bVal;
            switch (_compSortCol) {
                case 'partNumber':  aVal = a.p.partNumber || ''; bVal = b.p.partNumber || ''; break;
                case 'description': aVal = a.p.description || ''; bVal = b.p.description || ''; break;
                case 'uom':         aVal = a.p.unitOfMeasure || ''; bVal = b.p.unitOfMeasure || ''; break;
                case 'qpb':         aVal = a.qpb; bVal = b.qpb; break;
                case 'supplier':    aVal = a.p.currentSupplier || ''; bVal = b.p.currentSupplier || ''; break;
                case 'commodity':   aVal = a.p.commodity || ''; bVal = b.p.commodity || ''; break;
                case 'curUnit':     aVal = a.cur; bVal = b.cur; break;
                case 'poQty':       aVal = Number(a.p.currentQtyPurchased) || 0; bVal = Number(b.p.currentQtyPurchased) || 0; break;
                case 'curBoat':     aVal = a.curPerBoat; bVal = b.curPerBoat; break;
                case 'bestUnit':    aVal = a.bestCost || 0; bVal = b.bestCost || 0; break;
                case 'bestBoat':    aVal = a.bestPerBoat || 0; bVal = b.bestPerBoat || 0; break;
                case 'savingsBoat': aVal = a.savingsPerBoat || 0; bVal = b.savingsPerBoat || 0; break;
                default:            aVal = a.savingsPct || 0; bVal = b.savingsPct || 0;
            }
            if (typeof aVal === 'string') return _compSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            return _compSortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });

        function renderPartRow(r, isPredecessor) {
            const { p, qpb, cur, curPerBoat, best, bestCost, bestPerBoat, savingsPerBoat, savingsPct } = r;
            const isSaving = savingsPerBoat !== null && savingsPerBoat > 0;

            const allProducts = app.data.products || [];
            const productTagsHtml = (p.productIds || []).map(pid => {
                const pr = allProducts.find(x => x.id === pid);
                return pr ? '<span class="cost-product-tag">' + escapeHtml(pr.code || pr.name) + '</span>' : '';
            }).filter(Boolean).join('');
            const productTagsCell = productTagsHtml ? '<div style="margin-top:3px;">' + productTagsHtml + '</div>' : '';

            const aliases = p.aliases || [];
            const aliasHtml = aliases.length > 0
                ? '<br><small class="muted" style="font-size:11px;">' + escapeHtml(aliases.join(', ')) + '</small>'
                : '';
            const revBadge = p.rev ? ' <span class="cost-rev-badge">Rev ' + escapeHtml(p.rev) + '</span>' : '';
            const pnHtml = isPredecessor
                ? escapeHtml(p.partNumber) + revBadge + aliasHtml + ' <span class="cost-archived-badge">Previous</span>'
                : '<strong>' + escapeHtml(p.partNumber) + '</strong>' + revBadge + aliasHtml;


            const qtyPurchased = p.currentQtyPurchased != null ? p.currentQtyPurchased : '—';
            const poTotal = (p.currentQtyPurchased != null && cur > 0)
                ? fmt$(cur * Number(p.currentQtyPurchased))
                : '<span class="muted">—</span>';

            const ihCost = computeInHouseUnitCost(p);
            const ihCell = ihCost !== null
                ? '<span class="' + (ihCost < cur ? 'savings-positive' : '') + '">' + fmt$(ihCost) + '</span>'
                : (isPredecessor
                    ? '<span class="muted">—</span>'
                    : '<button class="btn btn-secondary btn-small" onclick="window._ca.showInHouseCostModal(\'' + p.id + '\')">+ Add</button>');


            const actionsCell = isPredecessor
                ? '<button class="btn btn-secondary btn-small" onclick="window._ca.showPartDetailModal(\'' + p.id + '\')">⋯</button>'
                : '<button class="btn btn-secondary btn-small" onclick="window._ca.showInHouseCostModal(\'' + p.id + '\')" title="In-House Cost">In-House</button>' +
                  ' <button class="btn btn-secondary btn-small" onclick="window._ca.showPartDetailModal(\'' + p.id + '\')">⋯</button>';

            const rowClass = isPredecessor ? 'cost-predecessor-row' : '';
            var finishBadge = '';
            var finishAdder = 0;
            if (p.surfaceFinish && p.surfaceFinish.type) {
                finishAdder = Number(p.surfaceFinish.costPerPart) || 0;
                var finishLabel = p.surfaceFinish.type === 'anodizing' ? 'Anodize' : 'Powder Coat';
                finishBadge = ' <span class="cost-finish-badge" title="' + finishLabel + (finishAdder ? ' — ' + fmt$(finishAdder) + '/part' : '') + '">' + finishLabel + '</span>';
            }
            return '<tr class="' + rowClass + '">' +
                '<td>' + pnHtml + '</td>' +
                '<td>' + escapeHtml(p.description) + productTagsCell + finishBadge + '</td>' +
                '<td>' + escapeHtml(p.unitOfMeasure || '') + '</td>' +
                '<td>' + qpb + '</td>' +
                '<td>' + escapeHtml(p.currentSupplier || '') + '</td>' +
                '<td>' + escapeHtml(p.commodity || '') + '</td>' +
                '<td>' + fmt$(cur) + (finishAdder ? ' <span class="muted" style="font-size:10px;" title="Incl. finish">+' + fmt$(finishAdder) + '</span>' : '') + '</td>' +
                '<td>' + qtyPurchased + '</td>' +
                '<td>' + poTotal + '</td>' +
                '<td>' + ihCell + '</td>' +
                '<td>' + fmt$(curPerBoat) + '</td>' +
                '<td class="cost-table-actions">' + actionsCell + '</td>' +
                '</tr>';
        }

        const tableRows = rootRows.reduce((acc, r) => {
            acc.push(renderPartRow(r, false));
            if (r.p.supersedesPartId) {
                const pred = parts.find(p => p.id === r.p.supersedesPartId);
                if (pred) acc.push(renderPartRow(computeRow(pred), true));
            }
            return acc;
        }, []).join('');

        return filterBar + '<div class="cost-table-wrap">' +
            '<table class="cost-table"><thead><tr>' +
            _thSort('Part #','partNumber',_compSortCol,_compSortDir,'_setCompSort') +
            _thSort('Description','description',_compSortCol,_compSortDir,'_setCompSort') +
            _thSort('UOM','uom',_compSortCol,_compSortDir,'_setCompSort') +
            _thSort('QPB','qpb',_compSortCol,_compSortDir,'_setCompSort') +
            _thSort('Supplier','supplier',_compSortCol,_compSortDir,'_setCompSort') +
            _thSort('Commodity','commodity',_compSortCol,_compSortDir,'_setCompSort') +
            _thSort('Current $/unit','curUnit',_compSortCol,_compSortDir,'_setCompSort') +
            _thSort('PO Qty','poQty',_compSortCol,_compSortDir,'_setCompSort') +
            '<th>PO Total</th><th>In-House $/unit</th>' +
            _thSort('Current $/boat','curBoat',_compSortCol,_compSortDir,'_setCompSort') +
            '<th>Actions</th>' +
            '</tr></thead>' +
            '<tbody>' + tableRows + '</tbody>' +
            '</table></div>';
    }

    // ─── Quarterly Comparison Table ───────────────────────────────────────────

    function renderQuarterlyTable() {
        const snapshots = (app.data.costAnalysis.quarterlySnapshots || [])
            .slice()
            .sort((a, b) => a.capturedAt > b.capturedAt ? 1 : -1);
        const parts = app.data.costAnalysis.parts || [];

        if (parts.length === 0) {
            return `<div class="empty-state">
                <p>No parts yet.</p></div>`;
        }

        const noSnapshots = snapshots.length === 0;
        const snapHeader = snapshots.map(s =>
            `<th colspan="2" class="cost-quarter-header">${escapeHtml(s.quarter)}
                <button class="cost-quarter-del" onclick="window._ca.deleteSnapshot('${s.id}')" title="Delete snapshot">×</button>
            </th>`
        ).join('');
        const snapSubHeader = snapshots.map(() =>
            `<th>Current $/unit</th><th>In-House $/unit</th>`
        ).join('');

        const tableRows = parts.map(p => {
            const cur = Number(p.currentUnitCost) || 0;
            const ih = computeInHouseUnitCost(p);

            const snapCells = snapshots.map(s => {
                const sp = (s.parts || []).find(x => x.partId === p.id);
                if (!sp) return '<td class="muted">—</td><td class="muted">—</td>';
                return `<td>${fmt$(sp.currentUnitCost)}</td><td>${sp.inHouseUnitCost != null ? fmt$(sp.inHouseUnitCost) : '<span class="muted">—</span>'}</td>`;
            }).join('');

            let trendHtml = '';
            if (snapshots.length > 0) {
                const earliest = (snapshots[0].parts || []).find(x => x.partId === p.id);
                if (earliest && earliest.currentUnitCost != null) {
                    const delta = cur - earliest.currentUnitCost;
                    const pct = earliest.currentUnitCost > 0 ? (delta / earliest.currentUnitCost) * 100 : 0;
                    trendHtml = `<span class="${delta < 0 ? 'savings-positive' : delta > 0 ? 'savings-negative' : ''}">
                        ${delta < 0 ? '↓' : delta > 0 ? '↑' : '→'} ${fmtPct(Math.abs(pct))}
                    </span>`;
                }
            }

            const aliases = p.aliases || [];
            const aliasHtml = aliases.length > 0
                ? '<br><small class="muted" style="font-size:11px;">' + escapeHtml(aliases.join(', ')) + '</small>'
                : '';

            return `<tr>
                <td><strong>${escapeHtml(p.partNumber)}</strong>${aliasHtml}</td>
                <td>${escapeHtml(p.description)}</td>
                ${snapCells}
                <td><strong>${fmt$(cur)}</strong></td>
                <td>${ih !== null ? fmt$(ih) : '<span class="muted">—</span>'}</td>
                <td>${trendHtml || '<span class="muted">—</span>'}</td>
            </tr>`;
        }).join('');

        if (noSnapshots) {
            return `<div class="cost-quarterly-empty">
                <p>No quarterly snapshots yet. Click <strong>Capture Quarter</strong> to save the current costs as a snapshot.</p>
            </div>
            <div class="cost-table-wrap" style="margin-top:16px;">
                <table class="cost-table">
                    <thead><tr>
                        <th>Part #</th><th>Description</th>
                        <th>Current $/unit</th><th>In-House $/unit</th><th>Trend</th>
                    </tr></thead>
                    <tbody>
                        ${parts.map(p => {
                            const aliases = p.aliases || [];
                            const aliasHtml = aliases.length > 0
                                ? '<br><small class="muted" style="font-size:11px;">' + escapeHtml(aliases.join(', ')) + '</small>'
                                : '';
                            return '<tr>' +
                                '<td><strong>' + escapeHtml(p.partNumber) + '</strong>' + aliasHtml + '</td>' +
                                '<td>' + escapeHtml(p.description) + '</td>' +
                                '<td>' + fmt$(p.currentUnitCost) + '</td>' +
                                '<td>' + (computeInHouseUnitCost(p) !== null ? fmt$(computeInHouseUnitCost(p)) : '<span class="muted">—</span>') + '</td>' +
                                '<td><span class="muted">—</span></td>' +
                                '</tr>';
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
        }

        return `
            <div class="cost-table-wrap">
                <table class="cost-table">
                    <thead>
                        <tr>
                            <th rowspan="2">Part #</th>
                            <th rowspan="2">Description</th>
                            ${snapHeader}
                            <th colspan="2" class="cost-quarter-header">Current</th>
                            <th rowspan="2">Trend</th>
                        </tr>
                        <tr>
                            ${snapSubHeader}
                            <th>Current $/unit</th><th>In-House $/unit</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>`;
    }

    // ─── Raw Materials Library View ────────────────────────────────────────────

    function renderRawMaterialsView() {
        const mats = app.data.costAnalysis.rawMaterials || [];
        const parts = app.data.costAnalysis.parts || [];

        // Count how many parts reference each material
        const usageMap = {};
        parts.forEach(p => {
            const id = p.inHouse && p.inHouse.rawMaterialId;
            if (id) usageMap[id] = (usageMap[id] || 0) + 1;
        });

        const toolbar = '<div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; align-items:center;">' +
            '<button class="btn btn-primary" onclick="window._ca.showRawMaterialForm()">+ Add Material</button>' +
            '<button class="btn btn-secondary" onclick="window._ca.showRawMatPasteModal()">Paste from Excel</button>' +
            '<label class="btn btn-secondary" style="cursor:pointer;">Upload CSV' +
                '<input type="file" accept=".csv" style="display:none" onchange="window._ca.handleRMCSVUpload(this)">' +
            '</label>' +
            '<button class="btn btn-secondary" onclick="window._ca.exportRMCSV()">Export CSV</button>' +
            '<input type="text" class="form-control ca-filter-search" id="ca-rm-search" placeholder="Search part #..." value="' + escapeHtml(_rmSearch) + '" oninput="window._ca._setRMSearch(this.value)" style="max-width:220px;margin-left:auto;">' +
            '</div>';

        if (mats.length === 0) {
            return toolbar + '<div class="empty-state">' +
                '<p>No raw materials yet. Add materials here, then link them to parts via the In-House Cost modal.</p></div>';
        }

        const sorted = [...mats].sort((a, b) => {
            let aVal, bVal;
            if (_rmSortCol === 'costPerUom') { aVal = a.costPerUom || 0; bVal = b.costPerUom || 0; }
            else if (_rmSortCol === 'usedBy') { aVal = usageMap[a.id] || 0; bVal = usageMap[b.id] || 0; }
            else { aVal = (a[_rmSortCol] || '').toLowerCase(); bVal = (b[_rmSortCol] || '').toLowerCase(); }
            if (typeof aVal === 'string') return _rmSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            return _rmSortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });
        const filtered = _rmSearch
            ? sorted.filter(m => m.partNumber.toLowerCase().includes(_rmSearch.toLowerCase()))
            : sorted;
        const rows = filtered.map(m => {
            const count = usageMap[m.id] || 0;
            const usedBadge = count > 0
                ? '<span class="cost-rm-used-badge is-used">' + count + ' part' + (count !== 1 ? 's' : '') + '</span>'
                : '<span class="muted">—</span>';
            return '<tr>' +
                '<td><strong>' + escapeHtml(m.partNumber) + '</strong></td>' +
                '<td>' + escapeHtml(m.description || '') + '</td>' +
                '<td>' + escapeHtml(m.uom || '') + '</td>' +
                '<td>' + fmt$(m.costPerUom) + '</td>' +
                '<td>' + escapeHtml(m.supplier || '') + '</td>' +
                '<td>' + escapeHtml(m.notes || '') + '</td>' +
                '<td>' + usedBadge + '</td>' +
                '<td class="cost-table-actions">' +
                    '<button class="btn btn-secondary btn-small" onclick="window._ca.showRawMaterialForm(\'' + m.id + '\')">Edit</button>' +
                    ' <button class="btn btn-danger btn-small" onclick="window._ca.deleteRawMaterial(\'' + m.id + '\')">Delete</button>' +
                '</td>' +
                '</tr>';
        }).join('');

        const noResults = filtered.length === 0
            ? '<tr><td colspan="8" class="muted" style="text-align:center;padding:20px;">No materials match "' + escapeHtml(_rmSearch) + '"</td></tr>'
            : '';

        return toolbar +
            '<div class="cost-table-wrap">' +
            '<table class="cost-table"><thead><tr>' +
            _thSort('Part #','partNumber',_rmSortCol,_rmSortDir,'_setRMSort') +
            _thSort('Description','description',_rmSortCol,_rmSortDir,'_setRMSort') +
            _thSort('UOM','uom',_rmSortCol,_rmSortDir,'_setRMSort') +
            _thSort('Cost / UOM','costPerUom',_rmSortCol,_rmSortDir,'_setRMSort') +
            _thSort('Supplier','supplier',_rmSortCol,_rmSortDir,'_setRMSort') +
            '<th>Notes</th>' +
            _thSort('Used By','usedBy',_rmSortCol,_rmSortDir,'_setRMSort') +
            '<th>Actions</th>' +
            '</tr></thead>' +
            '<tbody>' + (rows || noResults) + '</tbody>' +
            '</table></div>';
    }

    function _setRMSearch(val) {
        _rmSearch = val || '';
        renderCostAnalysisPage();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────


    // ─── KPI Dashboard ──────────────────────────────────────────────────────────

    function renderKPIView() {
        if (_kpiSubView === 'parts') return renderPartsDetailView();
        if (_kpiSubView === 'rawmaterials') return renderRawMatsDetailView();
        if (_kpiSubView === 'inhouse') return renderInHouseDetailView();
        if (_kpiSubView === 'povsinh') return renderPOvsInHouseView();
        if (_kpiSubView === 'po') return renderPOAnalysisView();
        const parts = app.data.costAnalysis.parts || [];
        const rms   = app.data.costAnalysis.rawMaterials || [];
        const ihCount   = parts.filter(p => p.inHouse).length;
        const rfqCount  = parts.filter(p => p.rfqs && p.rfqs.length > 0).length;
        const suppliers = new Set(parts.map(p => p.currentSupplier).filter(Boolean));
        const missing   = rms.filter(m => !m.costPerUom).length;
        const spend     = parts.reduce((s, p) => s + (p.currentUnitCost || 0) * (p.qpb || 1), 0);
        return `
            <div class="ca-kpi-page">
                <div class="ca-kpi-stat-strip">
                    <div class="ca-kpi-stat ca-kpi-stat-link" onclick="window._ca.setKpiSubView('parts')">
                        <div class="ca-kpi-stat-value">${parts.length}</div>
                        <div class="ca-kpi-stat-label">Total Parts ›</div>
                    </div>
                    <div class="ca-kpi-stat ca-kpi-stat-link" onclick="window._ca.setKpiSubView('rawmaterials')">
                        <div class="ca-kpi-stat-value">${rms.length}</div>
                        <div class="ca-kpi-stat-label">Raw Materials ›</div>
                    </div>
                    <div class="ca-kpi-stat ca-kpi-stat-link" onclick="window._ca.setKpiSubView('inhouse')">
                        <div class="ca-kpi-stat-value">${ihCount}</div>
                        <div class="ca-kpi-stat-label">In-House Parts ›</div>
                    </div>
                    <div class="ca-kpi-stat ca-kpi-stat-link" onclick="window._ca.setKpiSubView('po')">
                        <div class="ca-kpi-stat-value">${new Set(parts.map(p => p.currentPoNumber).filter(Boolean)).size}</div>
                        <div class="ca-kpi-stat-label">PO Numbers ›</div>
                    </div>
                    <div class="ca-kpi-stat">
                        <div class="ca-kpi-stat-value">${suppliers.size}</div>
                        <div class="ca-kpi-stat-label">Active Suppliers</div>
                    </div>
                    <div class="ca-kpi-stat ca-kpi-stat-link ${missing > 0 ? 'ca-kpi-stat-alert' : ''}" onclick="window._ca.setKpiSubView('povsinh')">
                        <div class="ca-kpi-stat-value">${missing > 0 ? missing : fmt$(spend)}</div>
                        <div class="ca-kpi-stat-label">${missing > 0 ? 'Materials Missing Price' : 'Spend Analysis ›'}</div>
                    </div>
                    </div>
                </div>

                <div class="ca-charts-grid">
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Make vs. Buy</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-chart-make-buy"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Top 10 Parts by Cost / Boat</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-chart-top-parts"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Parts by Supplier (Top 10)</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-chart-suppliers"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Parts by Product</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-chart-products"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Top 10 Raw Materials by Cost / UOM</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-chart-top-rms"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Raw Materials by Unit of Measure</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-chart-rm-uom"></canvas></div>
                    </div>
                </div>
            </div>`;
    }

    function _initKPICharts() {
        if (typeof Chart === 'undefined') return;
        Object.values(_caCharts).forEach(ch => { if (ch) ch.destroy(); });
        _caCharts = {};
        if (_kpiSubView === 'parts') { _initPartsCharts(); return; }
        if (_kpiSubView === 'rawmaterials') { _initRawMatsCharts(); return; }
        if (_kpiSubView === 'inhouse') { _initInHouseCharts(); return; }
        if (_kpiSubView === 'povsinh') { _initPOvsInHouseCharts(); return; }
        if (_kpiSubView === 'po') { _initPOCharts(); return; }

        const isDark  = document.documentElement.getAttribute('data-theme') === 'saronic';
        const txt     = isDark ? '#c2d0de' : '#374151';
        const grid    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
        const pal     = ['#ACFF24','#38bdf8','#fb923c','#a78bfa','#f472b6','#34d399','#fbbf24','#60a5fa','#f87171','#818cf8'];

        const parts = app.data.costAnalysis.parts || [];
        const rms   = app.data.costAnalysis.rawMaterials || [];

        const base = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: txt, font: { size: 11 }, boxWidth: 14 } } }
        };

        function axes(rotateX) {
            return {
                x: { ticks: { color: txt, maxRotation: rotateX || 0, font: { size: 10 } }, grid: { color: grid } },
                y: { ticks: { color: txt, font: { size: 10 } }, grid: { color: grid } }
            };
        }

        // 1 — Make vs Buy donut
        const c1 = document.getElementById('ca-chart-make-buy');
        if (c1) {
            const ih  = parts.filter(p => p.inHouse).length;
            const buy = parts.length - ih;
            _caCharts.c1 = new Chart(c1, {
                type: 'doughnut',
                data: { labels: ['In-House', 'Purchased'], datasets: [{ data: [ih, buy], backgroundColor: [pal[0], pal[1]], borderWidth: 0 }] },
                options: { ...base }
            });
        }

        // 2 — Top 10 parts by $/boat
        const c2 = document.getElementById('ca-chart-top-parts');
        if (c2) {
            const rows = parts
                .map(p => ({ lbl: p.partNumber, v: (p.currentUnitCost || 0) * (p.qpb || 1) }))
                .filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 10);
            _caCharts.c2 = new Chart(c2, {
                type: 'bar',
                data: { labels: rows.map(x => x.lbl), datasets: [{ label: '$/Boat', data: rows.map(x => +x.v.toFixed(2)), backgroundColor: pal[0] }] },
                options: { ...base, indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: { x: { ticks: { color: txt, callback: v => '$' + v, font: { size: 10 } }, grid: { color: grid } }, y: { ticks: { color: txt, font: { size: 10 } } } }
                }
            });
        }

        // 3 — Parts by Supplier
        const c3 = document.getElementById('ca-chart-suppliers');
        if (c3) {
            const map = {};
            parts.forEach(p => { const s = (p.currentSupplier || '').trim() || '(None)'; map[s] = (map[s] || 0) + 1; });
            const rows = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
            _caCharts.c3 = new Chart(c3, {
                type: 'bar',
                data: { labels: rows.map(r => r[0]), datasets: [{ label: 'Parts', data: rows.map(r => r[1]), backgroundColor: rows.map((_, i) => pal[i % pal.length]) }] },
                options: { ...base, plugins: { legend: { display: false } }, scales: axes(35) }
            });
        }

        // 4 — Parts by Product
        const c4 = document.getElementById('ca-chart-products');
        if (c4) {
            const prods = app.data.products || [];
            const map = {};
            parts.forEach(p => {
                const ids = p.productIds || [];
                if (ids.length === 0) { map['(None)'] = (map['(None)'] || 0) + 1; }
                else ids.forEach(pid => {
                    const pr = prods.find(x => x.id === pid);
                    map[pr ? pr.name : 'Unknown'] = (map[pr ? pr.name : 'Unknown'] || 0) + 1;
                });
            });
            const rows = Object.entries(map).sort((a, b) => b[1] - a[1]);
            _caCharts.c4 = new Chart(c4, {
                type: 'bar',
                data: { labels: rows.map(r => r[0]), datasets: [{ label: 'Parts', data: rows.map(r => r[1]), backgroundColor: rows.map((_, i) => pal[i % pal.length]) }] },
                options: { ...base, plugins: { legend: { display: false } }, scales: axes(20) }
            });
        }

        // 5 — Top 10 Raw Materials by Cost/UOM
        const c5 = document.getElementById('ca-chart-top-rms');
        if (c5) {
            const rows = [...rms].filter(m => m.costPerUom > 0).sort((a, b) => b.costPerUom - a.costPerUom).slice(0, 10);
            _caCharts.c5 = new Chart(c5, {
                type: 'bar',
                data: { labels: rows.map(m => m.partNumber), datasets: [{ label: '$/UOM', data: rows.map(m => m.costPerUom), backgroundColor: pal[2] }] },
                options: { ...base, indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: { x: { ticks: { color: txt, callback: v => '$' + v, font: { size: 10 } }, grid: { color: grid } }, y: { ticks: { color: txt, font: { size: 10 } } } }
                }
            });
        }

        // 6 — Raw Materials by UOM
        const c6 = document.getElementById('ca-chart-rm-uom');
        if (c6) {
            const map = {};
            rms.forEach(m => { const u = (m.uom || 'ea') || 'ea'; map[u] = (map[u] || 0) + 1; });
            const rows = Object.entries(map).sort((a, b) => b[1] - a[1]);
            _caCharts.c6 = new Chart(c6, {
                type: 'doughnut',
                data: { labels: rows.map(r => r[0] + ' (' + r[1] + ')'), datasets: [{ data: rows.map(r => r[1]), backgroundColor: pal.slice(0, rows.length), borderWidth: 0 }] },
                options: { ...base }
            });
        }
    }


    // ─── KPI Sub-View: Navigate ───────────────────────────────────────────────

    function setKpiSubView(view) {
        _kpiSubView = view;
        renderCostAnalysisPage();
    }

    // ─── KPI Sub-View: Total Parts ────────────────────────────────────────────

    function renderPartsDetailView() {
        const parts = app.data.costAnalysis.parts || [];
        const withCost  = parts.filter(p => p.currentUnitCost > 0).length;
        const withRFQ   = parts.filter(p => p.rfqs && p.rfqs.length > 0).length;
        const ihCount   = parts.filter(p => p.inHouse).length;
        const supSet    = new Set(parts.map(p => p.currentSupplier).filter(Boolean));
        const spendBoat = parts.reduce((s, p) => s + (p.currentUnitCost || 0) * (p.qpb || 1), 0);
        return `
            <div class="ca-detail-page">
                <div class="ca-detail-header">
                    <button class="btn btn-secondary btn-small" onclick="window._ca.setKpiSubView(null)">&#8592; Back to Dashboard</button>
                    <h2 class="ca-detail-title">All Parts — Detail Analysis</h2>
                </div>
                <div class="ca-kpi-stat-strip">
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${parts.length}</div><div class="ca-kpi-stat-label">Total Parts</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${withCost}</div><div class="ca-kpi-stat-label">With Unit Cost</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${withRFQ}</div><div class="ca-kpi-stat-label">Have RFQs</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${ihCount}</div><div class="ca-kpi-stat-label">In-House</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${supSet.size}</div><div class="ca-kpi-stat-label">Suppliers</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${fmt$(spendBoat)}</div><div class="ca-kpi-stat-label">Total Spend/Boat</div></div>
                </div>
                <div class="ca-charts-grid">
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Top 20 Parts by Cost / Boat</h3>
                        <div class="ca-chart-wrap" style="height:420px"><canvas id="ca-ch-p1"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Spend Distribution by Supplier</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-ch-p2"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Cost Data Coverage</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-ch-p3"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Top Savings Opportunities (RFQ vs Current)</h3>
                        <div class="ca-chart-wrap" style="height:360px"><canvas id="ca-ch-p4"></canvas></div>
                    </div>
                </div>
            </div>`;
    }

    function _initPartsCharts() {
        if (typeof Chart === 'undefined') return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'saronic';
        const txt    = isDark ? '#c2d0de' : '#374151';
        const grid   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
        const pal    = ['#ACFF24','#38bdf8','#fb923c','#a78bfa','#f472b6','#34d399','#fbbf24','#60a5fa','#f87171','#818cf8'];
        const parts  = app.data.costAnalysis.parts || [];

        const base = { responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ labels:{ color:txt, font:{ size:11 }, boxWidth:14 } } }
        };

        // P1 — Top 20 parts by $/boat
        const c1 = document.getElementById('ca-ch-p1');
        if (c1) {
            const rows = parts
                .map(p => ({ lbl: p.partNumber, v: (p.currentUnitCost || 0) * (p.qpb || 1) }))
                .filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 20);
            _caCharts.p1 = new Chart(c1, {
                type: 'bar',
                data: { labels: rows.map(x => x.lbl),
                    datasets: [{ label: '$/Boat', data: rows.map(x => +x.v.toFixed(2)), backgroundColor: pal[0] }] },
                options: { ...base, indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: txt, callback: v => '$'+v, font:{size:10} }, grid: { color: grid } },
                        y: { ticks: { color: txt, font: { size: 9 } } }
                    }
                }
            });
        }

        // P2 — Spend by supplier (donut)
        const c2 = document.getElementById('ca-ch-p2');
        if (c2) {
            const map = {};
            parts.forEach(p => {
                const s = (p.currentSupplier || '').trim() || '(None)';
                map[s] = (map[s] || 0) + (p.currentUnitCost || 0) * (p.qpb || 1);
            });
            const rows = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
            _caCharts.p2 = new Chart(c2, {
                type: 'doughnut',
                data: { labels: rows.map(r => r[0]),
                    datasets: [{ data: rows.map(r => +r[1].toFixed(2)),
                        backgroundColor: pal.slice(0, rows.length), borderWidth: 0 }] },
                options: { ...base }
            });
        }

        // P3 — Cost data coverage (donut)
        const c3 = document.getElementById('ca-ch-p3');
        if (c3) {
            const hasBoth  = parts.filter(p => p.currentUnitCost > 0 && p.inHouse).length;
            const buyOnly  = parts.filter(p => p.currentUnitCost > 0 && !p.inHouse).length;
            const ihOnly   = parts.filter(p => !(p.currentUnitCost > 0) && p.inHouse).length;
            const noCost   = parts.filter(p => !(p.currentUnitCost > 0) && !p.inHouse).length;
            _caCharts.p3 = new Chart(c3, {
                type: 'doughnut',
                data: { labels: ['Purchased + In-House', 'Purchased Only', 'In-House Only', 'No Cost Data'],
                    datasets: [{ data: [hasBoth, buyOnly, ihOnly, noCost],
                        backgroundColor: [pal[0], pal[1], pal[2], pal[8]], borderWidth: 0 }] },
                options: { ...base }
            });
        }

        // P4 — Savings opportunities (horizontal bar)
        const c4 = document.getElementById('ca-ch-p4');
        if (c4) {
            const rows = parts
                .filter(p => p.rfqs && p.rfqs.length > 0)
                .map(p => {
                    const best = getBestRFQ(p);
                    if (!best) return null;
                    const saving = ((p.currentUnitCost || 0) - Number(best.unitCost)) * (p.qpb || 1);
                    return { lbl: p.partNumber, v: saving };
                })
                .filter(x => x && x.v > 0)
                .sort((a, b) => b.v - a.v).slice(0, 15);
            if (rows.length === 0) {
                const el = document.getElementById('ca-ch-p4');
                if (el) el.closest('.ca-chart-wrap').innerHTML = '<p class="muted" style="padding:40px;text-align:center">No RFQ savings data yet.<br>Add RFQs to parts to see opportunities.</p>';
            } else {
                _caCharts.p4 = new Chart(c4, {
                    type: 'bar',
                    data: { labels: rows.map(x => x.lbl),
                        datasets: [{ label: 'Savings/Boat', data: rows.map(x => +x.v.toFixed(2)), backgroundColor: pal[3] }] },
                    options: { ...base, indexAxis: 'y',
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { color: txt, callback: v => '$'+v, font:{size:10} }, grid: { color: grid } },
                            y: { ticks: { color: txt, font: { size: 9 } } }
                        }
                    }
                });
            }
        }
    }

    // ─── KPI Sub-View: Raw Materials ──────────────────────────────────────────

    function renderRawMatsDetailView() {
        const rms      = app.data.costAnalysis.rawMaterials || [];
        const parts    = app.data.costAnalysis.parts || [];
        const withPrice = rms.filter(m => m.costPerUom > 0).length;
        const missing   = rms.filter(m => !m.costPerUom).length;
        const uomTypes  = new Set(rms.map(m => m.uom).filter(Boolean)).size;
        const linkedIds = new Set(parts.filter(p => p.inHouse && p.inHouse.rawMaterialId).map(p => p.inHouse.rawMaterialId));
        const linked    = rms.filter(m => linkedIds.has(m.id)).length;
        const priced    = rms.filter(m => m.costPerUom > 0);
        const avgCost   = priced.length ? priced.reduce((s, m) => s + m.costPerUom, 0) / priced.length : 0;
        return `
            <div class="ca-detail-page">
                <div class="ca-detail-header">
                    <button class="btn btn-secondary btn-small" onclick="window._ca.setKpiSubView(null)">&#8592; Back to Dashboard</button>
                    <h2 class="ca-detail-title">Raw Materials — Detail Analysis</h2>
                </div>
                <div class="ca-kpi-stat-strip">
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${rms.length}</div><div class="ca-kpi-stat-label">Total Materials</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${withPrice}</div><div class="ca-kpi-stat-label">Have Price</div></div>
                    <div class="ca-kpi-stat ${missing > 0 ? 'ca-kpi-stat-alert' : ''}"><div class="ca-kpi-stat-value">${missing}</div><div class="ca-kpi-stat-label">Missing Price</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${uomTypes}</div><div class="ca-kpi-stat-label">UOM Types</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${linked}</div><div class="ca-kpi-stat-label">Linked to Parts</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${fmt$(avgCost)}</div><div class="ca-kpi-stat-label">Avg Cost / UOM</div></div>
                </div>
                <div class="ca-charts-grid">
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Top 15 Materials by Cost / UOM</h3>
                        <div class="ca-chart-wrap" style="height:420px"><canvas id="ca-ch-r1"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Distribution by Unit of Measure</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-ch-r2"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Materials by Part Number Series</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-ch-r3"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Linked to In-House Parts vs Available</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-ch-r4"></canvas></div>
                    </div>
                </div>
            </div>`;
    }

    function _initRawMatsCharts() {
        if (typeof Chart === 'undefined') return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'saronic';
        const txt    = isDark ? '#c2d0de' : '#374151';
        const grid   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
        const pal    = ['#ACFF24','#38bdf8','#fb923c','#a78bfa','#f472b6','#34d399','#fbbf24','#60a5fa','#f87171','#818cf8'];
        const rms    = app.data.costAnalysis.rawMaterials || [];
        const parts  = app.data.costAnalysis.parts || [];

        const base = { responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ labels:{ color:txt, font:{ size:11 }, boxWidth:14 } } }
        };

        // R1 — Top 15 by cost/UOM
        const c1 = document.getElementById('ca-ch-r1');
        if (c1) {
            const rows = [...rms].filter(m => m.costPerUom > 0).sort((a,b) => b.costPerUom - a.costPerUom).slice(0, 15);
            _caCharts.r1 = new Chart(c1, {
                type: 'bar',
                data: { labels: rows.map(m => m.partNumber),
                    datasets: [{ label: '$/UOM', data: rows.map(m => m.costPerUom), backgroundColor: pal[2] }] },
                options: { ...base, indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: txt, callback: v => '$'+v, font:{size:10} }, grid: { color: grid } },
                        y: { ticks: { color: txt, font: { size: 9 } } }
                    }
                }
            });
        }

        // R2 — By UOM type (donut)
        const c2 = document.getElementById('ca-ch-r2');
        if (c2) {
            const map = {};
            rms.forEach(m => { const u = (m.uom || 'ea') || 'ea'; map[u] = (map[u] || 0) + 1; });
            const rows = Object.entries(map).sort((a,b) => b[1] - a[1]);
            _caCharts.r2 = new Chart(c2, {
                type: 'doughnut',
                data: { labels: rows.map(r => r[0]+' ('+r[1]+')'),
                    datasets: [{ data: rows.map(r => r[1]), backgroundColor: pal.slice(0, rows.length), borderWidth: 0 }] },
                options: { ...base }
            });
        }

        // R3 — By part number series (bar)
        const c3 = document.getElementById('ca-ch-r3');
        if (c3) {
            const map = {};
            rms.forEach(m => {
                const prefix = (m.partNumber || '').split('-')[0] || 'Other';
                map[prefix] = (map[prefix] || 0) + 1;
            });
            const rows = Object.entries(map).sort((a,b) => b[1] - a[1]);
            _caCharts.r3 = new Chart(c3, {
                type: 'bar',
                data: { labels: rows.map(r => r[0]+'-xxx'),
                    datasets: [{ label: 'Count', data: rows.map(r => r[1]),
                        backgroundColor: rows.map((_, i) => pal[i % pal.length]) }] },
                options: { ...base,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: txt, font:{size:11} }, grid: { color: grid } },
                        y: { ticks: { color: txt }, grid: { color: grid } }
                    }
                }
            });
        }

        // R4 — Linked vs available (donut)
        const c4 = document.getElementById('ca-ch-r4');
        if (c4) {
            const linkedIds = new Set(parts.filter(p => p.inHouse && p.inHouse.rawMaterialId).map(p => p.inHouse.rawMaterialId));
            const linked   = rms.filter(m => linkedIds.has(m.id)).length;
            const unlinked = rms.length - linked;
            _caCharts.r4 = new Chart(c4, {
                type: 'doughnut',
                data: { labels: ['Linked to In-House Part', 'Not Yet Linked'],
                    datasets: [{ data: [linked, unlinked], backgroundColor: [pal[0], pal[8]], borderWidth: 0 }] },
                options: { ...base }
            });
        }
    }

    // ─── KPI Sub-View: In-House Parts ─────────────────────────────────────────

    function renderInHouseDetailView() {
        const parts    = app.data.costAnalysis.parts || [];
        const ihParts  = parts.filter(p => p.inHouse);
        const withCost = ihParts.filter(p => computeInHouseUnitCost(p) !== null).length;
        const wcSet    = new Set();
        let totalOps   = 0;
        ihParts.forEach(p => {
            (p.inHouse.operations || []).forEach(op => {
                totalOps++;
                if (op.workCenterId) wcSet.add(op.workCenterId);
            });
        });
        const costs      = ihParts.map(p => computeInHouseUnitCost(p)).filter(v => v !== null);
        const avgCost    = costs.length ? costs.reduce((s,v) => s+v, 0) / costs.length : 0;
        const spendBoat  = ihParts.reduce((s, p) => {
            const c = computeInHouseUnitCost(p); return s + (c !== null ? c * (p.qpb || 1) : 0);
        }, 0);
        return `
            <div class="ca-detail-page">
                <div class="ca-detail-header">
                    <button class="btn btn-secondary btn-small" onclick="window._ca.setKpiSubView(null)">&#8592; Back to Dashboard</button>
                    <h2 class="ca-detail-title">In-House Parts — Detail Analysis</h2>
                </div>
                <div class="ca-kpi-stat-strip">
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${ihParts.length}</div><div class="ca-kpi-stat-label">In-House Parts</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${withCost}</div><div class="ca-kpi-stat-label">With Cost Data</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${wcSet.size}</div><div class="ca-kpi-stat-label">Work Centers Used</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${totalOps}</div><div class="ca-kpi-stat-label">Total Operations</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${fmt$(avgCost)}</div><div class="ca-kpi-stat-label">Avg Cost / Unit</div></div>
                    <div class="ca-kpi-stat"><div class="ca-kpi-stat-value">${fmt$(spendBoat)}</div><div class="ca-kpi-stat-label">Total In-House $/Boat</div></div>
                </div>
                <div class="ca-charts-grid">
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Top 15 In-House Parts by Computed Cost / Unit</h3>
                        <div class="ca-chart-wrap" style="height:420px"><canvas id="ca-ch-ih1"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Work Center Utilization (Operations)</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-ch-ih2"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Cost Component Breakdown (Aggregate)</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-ch-ih3"></canvas></div>
                    </div>
                    <div class="ca-chart-box">
                        <h3 class="ca-chart-title">Parts by Operation Count</h3>
                        <div class="ca-chart-wrap"><canvas id="ca-ch-ih4"></canvas></div>
                    </div>
                </div>
            </div>`;
    }

    function _initInHouseCharts() {
        if (typeof Chart === 'undefined') return;
        const isDark  = document.documentElement.getAttribute('data-theme') === 'saronic';
        const txt     = isDark ? '#c2d0de' : '#374151';
        const grid    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
        const pal     = ['#ACFF24','#38bdf8','#fb923c','#a78bfa','#f472b6','#34d399','#fbbf24','#60a5fa','#f87171','#818cf8'];
        const parts   = app.data.costAnalysis.parts || [];
        const ihParts = parts.filter(p => p.inHouse);

        const base = { responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ labels:{ color:txt, font:{ size:11 }, boxWidth:14 } } }
        };

        // IH1 — Top 15 in-house parts by computed cost/unit
        const c1 = document.getElementById('ca-ch-ih1');
        if (c1) {
            const rows = ihParts
                .map(p => ({ lbl: p.partNumber, v: computeInHouseUnitCost(p) }))
                .filter(x => x.v !== null && x.v > 0)
                .sort((a, b) => b.v - a.v).slice(0, 15);
            _caCharts.ih1 = new Chart(c1, {
                type: 'bar',
                data: { labels: rows.map(x => x.lbl),
                    datasets: [{ label: '$/Unit', data: rows.map(x => +x.v.toFixed(2)), backgroundColor: pal[1] }] },
                options: { ...base, indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: txt, callback: v => '$'+v, font:{size:10} }, grid: { color: grid } },
                        y: { ticks: { color: txt, font: { size: 9 } } }
                    }
                }
            });
        }

        // IH2 — Work center utilization (bar)
        const c2 = document.getElementById('ca-ch-ih2');
        if (c2) {
            const map = {};
            ihParts.forEach(p => {
                (p.inHouse.operations || []).forEach(op => {
                    const wc   = op.workCenterId ? getWorkCenter(op.workCenterId) : null;
                    const name = wc ? wc.name : (op.machine || 'Unknown');
                    map[name]  = (map[name] || 0) + 1;
                });
            });
            const rows = Object.entries(map).sort((a,b) => b[1] - a[1]);
            if (rows.length === 0) {
                document.getElementById('ca-ch-ih2').closest('.ca-chart-wrap').innerHTML =
                    '<p class="muted" style="padding:40px;text-align:center">No machine operations recorded yet.</p>';
            } else {
                _caCharts.ih2 = new Chart(c2, {
                    type: 'bar',
                    data: { labels: rows.map(r => r[0]),
                        datasets: [{ label: 'Operations', data: rows.map(r => r[1]),
                            backgroundColor: rows.map((_,i) => pal[i % pal.length]) }] },
                    options: { ...base,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { color:txt, maxRotation:35, font:{size:10} }, grid:{ color:grid } },
                            y: { ticks: { color:txt }, grid:{ color:grid } }
                        }
                    }
                });
            }
        }

        // IH3 — Cost component breakdown (aggregate donut: machine, labor, material)
        const c3 = document.getElementById('ca-ch-ih3');
        if (c3) {
            let totMachine = 0, totLabor = 0, totMat = 0;
            ihParts.forEach(p => {
                const ih  = p.inHouse;
                const qty = Number(ih.qtyRan) || 1;
                (ih.operations || []).forEach(op => {
                    const wc   = op.workCenterId ? getWorkCenter(op.workCenterId) : null;
                    const rate = wc ? Number(wc.ratePerHour) : (Number(op.ratePerHour) || 0);
                    totMachine += (Number(op.hours) || 0) / qty * rate;
                });
                (ih.laborOperations || []).forEach(op => {
                    totLabor += (Number(op.hours) || 0) / qty * (Number(op.ratePerHour) || 0);
                });
                if (ih.rawMaterialId && ih.usedPerPart != null) {
                    const rm = getRawMaterial(ih.rawMaterialId);
                    if (rm) totMat += Number(ih.usedPerPart) * Number(rm.costPerUom);
                } else if (ih.materialUsedPerPart != null && ih.materialCostPerUom != null) {
                    totMat += Number(ih.materialUsedPerPart) * Number(ih.materialCostPerUom);
                }
            });
            const total = totMachine + totLabor + totMat;
            if (total === 0) {
                document.getElementById('ca-ch-ih3').closest('.ca-chart-wrap').innerHTML =
                    '<p class="muted" style="padding:40px;text-align:center">No rate or material cost data yet.<br>Set work center rates and material costs to see breakdown.</p>';
            } else {
                _caCharts.ih3 = new Chart(c3, {
                    type: 'doughnut',
                    data: { labels: ['Machine Cost', 'Labor Cost', 'Material Cost'],
                        datasets: [{ data: [+totMachine.toFixed(2), +totLabor.toFixed(2), +totMat.toFixed(2)],
                            backgroundColor: [pal[1], pal[2], pal[0]], borderWidth: 0 }] },
                    options: { ...base }
                });
            }
        }

        // IH4 — Parts by operation count (bar)
        const c4 = document.getElementById('ca-ch-ih4');
        if (c4) {
            const buckets = { '0 ops': 0, '1 op': 0, '2 ops': 0, '3 ops': 0, '4 ops': 0, '5+ ops': 0 };
            ihParts.forEach(p => {
                const n = (p.inHouse.operations || []).length;
                if      (n === 0) buckets['0 ops']++;
                else if (n === 1) buckets['1 op']++;
                else if (n === 2) buckets['2 ops']++;
                else if (n === 3) buckets['3 ops']++;
                else if (n === 4) buckets['4 ops']++;
                else              buckets['5+ ops']++;
            });
            _caCharts.ih4 = new Chart(c4, {
                type: 'bar',
                data: { labels: Object.keys(buckets),
                    datasets: [{ label: 'Parts', data: Object.values(buckets),
                        backgroundColor: Object.keys(buckets).map((_, i) => pal[i % pal.length]) }] },
                options: { ...base,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color:txt, font:{size:11} }, grid:{ color:grid } },
                        y: { ticks: { color:txt }, grid:{ color:grid } }
                    }
                }
            });
        }
    }


    // ─── KPI Sub-View: PO vs In-House ─────────────────────────────────────────

    function renderPOvsInHouseView() {
        var parts = app.data.costAnalysis.parts || [];
        // Parts with a purchase price
        var purchased  = parts.filter(function(p) { return p.currentUnitCost > 0; });
        // Parts with both purchase price AND in-house cost estimate
        var withBoth   = parts.filter(function(p) { return p.currentUnitCost > 0 && computeInHouseUnitCost(p) !== null; });
        // Parts with PO qty AND in-house cost (actual money comparison)
        var withPOQtyAndIH = parts.filter(function(p) {
            return p.currentUnitCost > 0 && p.currentQtyPurchased > 0 && computeInHouseUnitCost(p) !== null;
        });
        var totalPOSpend   = withPOQtyAndIH.reduce(function(s, p) { return s + (p.currentUnitCost || 0) * (p.currentQtyPurchased || 0); }, 0);
        var totalIHEquiv   = withPOQtyAndIH.reduce(function(s, p) { var c = computeInHouseUnitCost(p); return s + c * (p.currentQtyPurchased || 0); }, 0);
        var potentialSav   = totalPOSpend - totalIHEquiv;
        var cheaper        = withBoth.filter(function(p) { return computeInHouseUnitCost(p) < p.currentUnitCost; }).length;
        return [
            '<div class="ca-detail-page">',
            '<div class="ca-detail-header">',
            '<button class="btn btn-secondary btn-small" onclick="window._ca.setKpiSubView(null)">&#8592; Back to Dashboard</button>',
            '<h2 class="ca-detail-title">Purchased vs. In-House Cost Analysis</h2>',
            '</div>',
            '<div class="ca-kpi-stat-strip">',
            '<div class="ca-kpi-stat"><div class="ca-kpi-stat-value">' + purchased.length + '</div><div class="ca-kpi-stat-label">Parts w/ Purchase Price</div></div>',
            '<div class="ca-kpi-stat"><div class="ca-kpi-stat-value">' + withBoth.length + '</div><div class="ca-kpi-stat-label">Parts w/ Both Data</div></div>',
            '<div class="ca-kpi-stat"><div class="ca-kpi-stat-value">' + cheaper + '</div><div class="ca-kpi-stat-label">In-House Cheaper</div></div>',
            '<div class="ca-kpi-stat"><div class="ca-kpi-stat-value">' + fmt$(totalPOSpend) + '</div><div class="ca-kpi-stat-label">Total PO Spend (tracked)</div></div>',
            '<div class="ca-kpi-stat"><div class="ca-kpi-stat-value">' + fmt$(totalIHEquiv) + '</div><div class="ca-kpi-stat-label">In-House Equivalent</div></div>',
            '<div class="ca-kpi-stat ' + (potentialSav > 0 ? 'ca-kpi-savings' : '') + '"><div class="ca-kpi-stat-value">' + fmt$(Math.abs(potentialSav)) + '</div><div class="ca-kpi-stat-label">' + (potentialSav > 0 ? 'Potential Savings' : 'In-House Costs More') + '</div></div>',
            '</div>',
            '<div class="ca-charts-grid">',
            '<div class="ca-chart-box"><h3 class="ca-chart-title">$/unit: Purchased vs. In-House (Top 15)</h3><div class="ca-chart-wrap" style="height:400px"><canvas id="ca-ch-pi1"></canvas></div></div>',
            '<div class="ca-chart-box"><h3 class="ca-chart-title">Actual PO Spend vs. In-House Est. (by Part)</h3><div class="ca-chart-wrap" style="height:400px"><canvas id="ca-ch-pi2"></canvas></div></div>',
            '<div class="ca-chart-box"><h3 class="ca-chart-title">Total $/Boat: Purchased vs. In-House</h3><div class="ca-chart-wrap"><canvas id="ca-ch-pi3"></canvas></div></div>',
            '<div class="ca-chart-box"><h3 class="ca-chart-title">Make vs. Buy Savings $/Boat</h3><div class="ca-chart-wrap" style="height:400px"><canvas id="ca-ch-pi4"></canvas></div></div>',
            '</div>',
            '</div>'
        ].join('\n');
    }

    function _initPOvsInHouseCharts() {
        if (typeof Chart === 'undefined') return;
        var parts  = app.data.costAnalysis.parts || [];
        var isDark = document.documentElement.getAttribute('data-theme') === 'saronic';
        var txt    = isDark ? '#c2d0de' : '#374151';
        var grid   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
        var pal    = ['#ACFF24','#38bdf8','#fb923c','#a78bfa','#f472b6','#34d399','#fbbf24','#60a5fa','#f87171','#818cf8'];
        var base   = { responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ labels:{ color:txt, font:{ size:11 }, boxWidth:14 } } }
        };

        // Parts with both purchase price and in-house cost
        var withBoth = parts.filter(function(p) {
            return p.currentUnitCost > 0 && computeInHouseUnitCost(p) !== null;
        }).map(function(p) {
            return { lbl: p.partNumber, buy: p.currentUnitCost, ih: computeInHouseUnitCost(p), qpb: p.qpb || 1, qtyPurch: p.currentQtyPurchased || 0 };
        });

        // PI1 — $/unit: purchased vs in-house (grouped bar, top 15 by purchase price)
        var c1 = document.getElementById('ca-ch-pi1');
        if (c1) {
            var rows1 = withBoth.slice().sort(function(a, b) { return b.buy - a.buy; }).slice(0, 15);
            if (rows1.length === 0) {
                c1.closest('.ca-chart-wrap').innerHTML = '<p class="muted" style="padding:40px;text-align:center">No parts have both a purchase price and in-house cost data yet.</p>';
            } else {
                _caCharts.pi1 = new Chart(c1, {
                    type: 'bar',
                    data: {
                        labels: rows1.map(function(r) { return r.lbl; }),
                        datasets: [
                            { label: 'Purchased $/unit', data: rows1.map(function(r) { return +r.buy.toFixed(4); }), backgroundColor: pal[1] },
                            { label: 'In-House $/unit',  data: rows1.map(function(r) { return +r.ih.toFixed(4);  }), backgroundColor: pal[0] }
                        ]
                    },
                    options: Object.assign({}, base, {
                        indexAxis: 'y',
                        plugins: { legend: { labels: { color: txt, font: { size: 11 }, boxWidth: 14 } } },
                        scales: {
                            x: { ticks: { color: txt, callback: function(v) { return '$' + v; }, font: { size: 10 } }, grid: { color: grid } },
                            y: { ticks: { color: txt, font: { size: 9 } } }
                        }
                    })
                });
            }
        }

        // PI2 — Actual PO Spend vs In-House Equivalent (grouped bar, parts with PO qty)
        var c2 = document.getElementById('ca-ch-pi2');
        if (c2) {
            var rows2 = withBoth.filter(function(r) { return r.qtyPurch > 0; })
                .map(function(r) { return Object.assign({}, r, { poSpend: r.buy * r.qtyPurch, ihSpend: r.ih * r.qtyPurch }); })
                .sort(function(a, b) { return b.poSpend - a.poSpend; }).slice(0, 12);
            if (rows2.length === 0) {
                c2.closest('.ca-chart-wrap').innerHTML = '<p class="muted" style="padding:40px;text-align:center">No parts have PO quantity data and in-house costs. Enter PO quantities on parts to see this chart.</p>';
            } else {
                _caCharts.pi2 = new Chart(c2, {
                    type: 'bar',
                    data: {
                        labels: rows2.map(function(r) { return r.lbl; }),
                        datasets: [
                            { label: 'PO Spend ($)', data: rows2.map(function(r) { return +r.poSpend.toFixed(2); }), backgroundColor: pal[1] },
                            { label: 'In-House Est. ($)', data: rows2.map(function(r) { return +r.ihSpend.toFixed(2); }), backgroundColor: pal[0] }
                        ]
                    },
                    options: Object.assign({}, base, {
                        indexAxis: 'y',
                        plugins: { legend: { labels: { color: txt, font: { size: 11 }, boxWidth: 14 } } },
                        scales: {
                            x: { ticks: { color: txt, callback: function(v) { return '$' + v.toLocaleString(); }, font: { size: 10 } }, grid: { color: grid } },
                            y: { ticks: { color: txt, font: { size: 9 } } }
                        }
                    })
                });
            }
        }

        // PI3 — Total $/boat: purchased vs in-house (donut)
        var c3 = document.getElementById('ca-ch-pi3');
        if (c3) {
            var buyBoat = parts.filter(function(p) { return p.currentUnitCost > 0 && !p.inHouse; })
                .reduce(function(s, p) { return s + p.currentUnitCost * (p.qpb || 1); }, 0);
            var ihBoat = parts.filter(function(p) { return p.inHouse; })
                .reduce(function(s, p) { var c = computeInHouseUnitCost(p); return s + (c !== null ? c : 0) * (p.qpb || 1); }, 0);
            var bothBuyBoat = parts.filter(function(p) { return p.currentUnitCost > 0 && p.inHouse; })
                .reduce(function(s, p) { return s + p.currentUnitCost * (p.qpb || 1); }, 0);
            _caCharts.pi3 = new Chart(c3, {
                type: 'doughnut',
                data: {
                    labels: [
                        'Purchased-only $/boat: ' + fmt$(buyBoat),
                        'In-House $/boat: ' + fmt$(ihBoat),
                        'Both (purchased side) $/boat: ' + fmt$(bothBuyBoat)
                    ],
                    datasets: [{ data: [+buyBoat.toFixed(2), +ihBoat.toFixed(2), +bothBuyBoat.toFixed(2)],
                        backgroundColor: [pal[1], pal[0], pal[2]], borderWidth: 0 }]
                },
                options: Object.assign({}, base)
            });
        }

        // PI4 — Make vs Buy savings $/boat (horizontal bar, parts where in-house is cheaper)
        var c4 = document.getElementById('ca-ch-pi4');
        if (c4) {
            var rows4 = withBoth.map(function(r) {
                return { lbl: r.lbl, sav: (r.buy - r.ih) * r.qpb };
            }).sort(function(a, b) { return b.sav - a.sav; }).slice(0, 15);
            if (rows4.length === 0) {
                c4.closest('.ca-chart-wrap').innerHTML = '<p class="muted" style="padding:40px;text-align:center">No comparison data available yet.</p>';
            } else {
                _caCharts.pi4 = new Chart(c4, {
                    type: 'bar',
                    data: {
                        labels: rows4.map(function(r) { return r.lbl; }),
                        datasets: [{ label: 'Savings $/boat (Purchased − In-House)',
                            data: rows4.map(function(r) { return +r.sav.toFixed(2); }),
                            backgroundColor: rows4.map(function(r) { return r.sav >= 0 ? pal[0] : pal[8]; }) }]
                    },
                    options: Object.assign({}, base, {
                        indexAxis: 'y',
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { color: txt, callback: function(v) { return '$' + v; }, font: { size: 10 } }, grid: { color: grid } },
                            y: { ticks: { color: txt, font: { size: 9 } } }
                        }
                    })
                });
            }
        }
    }


    // ─── KPI Sub-View: PO Analysis ────────────────────────────────────────────

    function renderPOAnalysisView() {
        var parts = app.data.costAnalysis.parts || [];

        // Group parts by PO number — aggregate from purchaseOrders[] (authoritative),
        // falling back to currentPoNumber for parts that have no array entries.
        var poMap = {};
        parts.forEach(function(p) {
            var pos = p.purchaseOrders || [];
            if (pos.length > 0) {
                pos.forEach(function(po) {
                    var poNum = (po.poNumber || '').trim();
                    if (!poNum) return;
                    if (!poMap[poNum]) poMap[poNum] = { po: poNum, parts: [], supplier: po.supplier || '', totalSpend: 0 };
                    if (!poMap[poNum].parts.some(function(ep) { return ep.id === p.id; })) {
                        poMap[poNum].parts.push(p);
                    }
                    poMap[poNum].totalSpend += (po.unitCost || 0) * (po.qty || 0);
                    if (!poMap[poNum].supplier && po.supplier) poMap[poNum].supplier = po.supplier;
                });
            } else {
                var poNum = (p.currentPoNumber || '').trim();
                if (!poNum) return;
                if (!poMap[poNum]) poMap[poNum] = { po: poNum, parts: [], supplier: p.currentSupplier || '', totalSpend: 0 };
                if (!poMap[poNum].parts.some(function(ep) { return ep.id === p.id; })) poMap[poNum].parts.push(p);
                poMap[poNum].totalSpend += (p.currentUnitCost || 0) * (p.currentQtyPurchased || 0);
                if (!poMap[poNum].supplier && p.currentSupplier) poMap[poNum].supplier = p.currentSupplier;
            }
        });
        var poList = Object.values(poMap).sort(function(a, b) { return b.totalSpend - a.totalSpend; });

        var uniquePOs    = poList.length;
        var partsWithPO  = parts.filter(function(p) {
            return (p.purchaseOrders && p.purchaseOrders.length > 0) || (p.currentPoNumber || '').trim();
        }).length;
        var totalSpend   = poList.reduce(function(s, po) { return s + po.totalSpend; }, 0);
        var avgParts     = uniquePOs > 0 ? (partsWithPO / uniquePOs).toFixed(1) : 0;
        var largestPO    = poList.length > 0 ? poList[0] : null;
        var multiPOs     = poList.filter(function(po) { return po.parts.length > 1; }).length;

        // Summary table rows
        var tableRows = poList.map(function(po) {
            var partNums = po.parts.map(function(p) { return escapeHtml(p.partNumber); }).join(', ');
            return '<tr>' +
                '<td><strong>' + escapeHtml(po.po) + '</strong></td>' +
                '<td>' + escapeHtml(po.supplier) + '</td>' +
                '<td>' + po.parts.length + '</td>' +
                '<td style="max-width:300px;white-space:normal;font-size:11px;color:var(--muted)">' + partNums + '</td>' +
                '<td>' + (po.totalSpend > 0 ? fmt$(po.totalSpend) : '—') + '</td>' +
                '</tr>';
        }).join('');

        return [
            '<div class="ca-detail-page">',
            '<div class="ca-detail-header">',
            '<button class="btn btn-secondary btn-small" onclick="window._ca.setKpiSubView(null)">&#8592; Back to Dashboard</button>',
            '<h2 class="ca-detail-title">PO Analysis</h2>',
            '</div>',
            '<div class="ca-kpi-stat-strip">',
            '<div class="ca-kpi-stat"><div class="ca-kpi-stat-value">' + uniquePOs + '</div><div class="ca-kpi-stat-label">Unique POs</div></div>',
            '<div class="ca-kpi-stat"><div class="ca-kpi-stat-value">' + partsWithPO + '</div><div class="ca-kpi-stat-label">Parts w/ PO #</div></div>',
            '<div class="ca-kpi-stat"><div class="ca-kpi-stat-value">' + avgParts + '</div><div class="ca-kpi-stat-label">Avg Parts / PO</div></div>',
            '<div class="ca-kpi-stat"><div class="ca-kpi-stat-value">' + multiPOs + '</div><div class="ca-kpi-stat-label">POs with 2+ Parts</div></div>',
            '<div class="ca-kpi-stat"><div class="ca-kpi-stat-value">' + fmt$(totalSpend) + '</div><div class="ca-kpi-stat-label">Total Tracked Spend</div></div>',
            '<div class="ca-kpi-stat"><div class="ca-kpi-stat-value">' + (largestPO ? escapeHtml(largestPO.po) : '—') + '</div><div class="ca-kpi-stat-label">Largest PO</div></div>',
            '</div>',
            '<div class="ca-charts-grid">',
            '<div class="ca-chart-box"><h3 class="ca-chart-title">Top POs by Total Value</h3><div class="ca-chart-wrap" style="height:380px"><canvas id="ca-ch-po1"></canvas></div></div>',
            '<div class="ca-chart-box"><h3 class="ca-chart-title">Parts per PO</h3><div class="ca-chart-wrap" style="height:380px"><canvas id="ca-ch-po2"></canvas></div></div>',
            '<div class="ca-chart-box"><h3 class="ca-chart-title">PO Spend by Supplier</h3><div class="ca-chart-wrap"><canvas id="ca-ch-po3"></canvas></div></div>',
            '<div class="ca-chart-box"><h3 class="ca-chart-title">PO Spend by Commodity</h3><div class="ca-chart-wrap"><canvas id="ca-ch-po4"></canvas></div></div>',
            '</div>',
            '<div style="margin-top:24px">',
            '<h3 style="font-size:14px;margin-bottom:10px;color:var(--muted)">All POs</h3>',
            '<div class="cost-table-wrap"><table class="cost-table"><thead><tr>',
            '<th>PO Number</th><th>Supplier</th><th>Parts</th><th>Part Numbers</th><th>Total Spend</th>',
            '</tr></thead><tbody>' + tableRows + '</tbody></table></div>',
            '</div>',
            '</div>'
        ].join('\n');
    }

    function _initPOCharts() {
        if (typeof Chart === 'undefined') return;
        var parts  = app.data.costAnalysis.parts || [];
        var isDark = document.documentElement.getAttribute('data-theme') === 'saronic';
        var txt    = isDark ? '#c2d0de' : '#374151';
        var grid   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
        var pal    = ['#ACFF24','#38bdf8','#fb923c','#a78bfa','#f472b6','#34d399','#fbbf24','#60a5fa','#f87171','#818cf8'];
        var base   = { responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ labels:{ color:txt, font:{ size:11 }, boxWidth:14 } } }
        };

        // Build PO map — aggregate from purchaseOrders[] (authoritative),
        // falling back to currentPoNumber for parts with no array entries.
        var poMap = {};
        parts.forEach(function(p) {
            var pos = p.purchaseOrders || [];
            if (pos.length > 0) {
                var seenNums = {};
                pos.forEach(function(po) {
                    var poNum = (po.poNumber || '').trim();
                    if (!poNum) return;
                    if (!poMap[poNum]) poMap[poNum] = { po: poNum, count: 0, spend: 0, supplier: po.supplier || '', commodity: p.commodity || '' };
                    if (!seenNums[poNum]) { poMap[poNum].count++; seenNums[poNum] = true; }
                    poMap[poNum].spend += (po.unitCost || 0) * (po.qty || 0);
                    if (!poMap[poNum].supplier && po.supplier) poMap[poNum].supplier = po.supplier;
                });
            } else {
                var poNum = (p.currentPoNumber || '').trim();
                if (!poNum) return;
                if (!poMap[poNum]) poMap[poNum] = { po: poNum, count: 0, spend: 0, supplier: p.currentSupplier || '', commodity: p.commodity || '' };
                poMap[poNum].count++;
                poMap[poNum].spend += (p.currentUnitCost || 0) * (p.currentQtyPurchased || 0);
                if (!poMap[poNum].supplier && p.currentSupplier) poMap[poNum].supplier = p.currentSupplier;
            }
        });
        var poList = Object.values(poMap);

        if (poList.length === 0) {
            ['ca-ch-po1','ca-ch-po2','ca-ch-po3','ca-ch-po4'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el) el.closest('.ca-chart-wrap').innerHTML = '<p class="muted" style="padding:40px;text-align:center">No PO data yet. Add PO numbers to parts to see charts.</p>';
            });
            return;
        }

        // PO1 — Top POs by total spend (horizontal bar)
        var c1 = document.getElementById('ca-ch-po1');
        if (c1) {
            var rows1 = poList.filter(function(p) { return p.spend > 0; })
                .sort(function(a,b) { return b.spend - a.spend; }).slice(0, 15);
            if (rows1.length === 0) {
                c1.closest('.ca-chart-wrap').innerHTML = '<p class="muted" style="padding:40px;text-align:center">No spend data yet. Add unit costs and PO quantities to parts.</p>';
            } else {
                _caCharts.po1 = new Chart(c1, {
                    type: 'bar',
                    data: { labels: rows1.map(function(r) { return r.po; }),
                        datasets: [{ label: 'Total PO Spend ($)', data: rows1.map(function(r) { return +r.spend.toFixed(2); }), backgroundColor: pal[1] }] },
                    options: Object.assign({}, base, {
                        indexAxis: 'y',
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { color:txt, callback: function(v) { return '$'+v.toLocaleString(); }, font:{size:10} }, grid:{color:grid} },
                            y: { ticks: { color:txt, font:{size:10} } }
                        }
                    })
                });
            }
        }

        // PO2 — Parts per PO (horizontal bar, sorted by count)
        var c2 = document.getElementById('ca-ch-po2');
        if (c2) {
            var rows2 = poList.slice().sort(function(a,b) { return b.count - a.count; }).slice(0, 20);
            _caCharts.po2 = new Chart(c2, {
                type: 'bar',
                data: { labels: rows2.map(function(r) { return r.po; }),
                    datasets: [{ label: 'Parts', data: rows2.map(function(r) { return r.count; }),
                        backgroundColor: rows2.map(function(r) { return r.count > 1 ? pal[0] : pal[2]; }) }] },
                options: Object.assign({}, base, {
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color:txt, stepSize:1, font:{size:10} }, grid:{color:grid} },
                        y: { ticks: { color:txt, font:{size:10} } }
                    }
                })
            });
        }

        // PO3 — Spend by supplier (donut)
        var c3 = document.getElementById('ca-ch-po3');
        if (c3) {
            var supMap = {};
            poList.forEach(function(po) {
                var s = po.supplier || '(No Supplier)';
                supMap[s] = (supMap[s] || 0) + po.spend;
            });
            var rows3 = Object.entries(supMap).sort(function(a,b) { return b[1]-a[1]; }).slice(0,10);
            _caCharts.po3 = new Chart(c3, {
                type: 'doughnut',
                data: { labels: rows3.map(function(r) { return r[0]; }),
                    datasets: [{ data: rows3.map(function(r) { return +r[1].toFixed(2); }),
                        backgroundColor: pal.slice(0, rows3.length), borderWidth:0 }] },
                options: Object.assign({}, base)
            });
        }

        // PO4 — Spend by commodity (donut)
        var c4 = document.getElementById('ca-ch-po4');
        if (c4) {
            var comMap = {};
            parts.forEach(function(p) {
                var pos = p.purchaseOrders || [];
                var c = p.commodity || '(No Commodity)';
                if (pos.length > 0) {
                    pos.forEach(function(po) {
                        if ((po.poNumber || '').trim()) comMap[c] = (comMap[c] || 0) + (po.unitCost || 0) * (po.qty || 0);
                    });
                } else if ((p.currentPoNumber || '').trim()) {
                    comMap[c] = (comMap[c] || 0) + (p.currentUnitCost || 0) * (p.currentQtyPurchased || 0);
                }
            });
            var rows4 = Object.entries(comMap).sort(function(a,b) { return b[1]-a[1]; });
            _caCharts.po4 = new Chart(c4, {
                type: 'doughnut',
                data: { labels: rows4.map(function(r) { return r[0]; }),
                    datasets: [{ data: rows4.map(function(r) { return +r[1].toFixed(2); }),
                        backgroundColor: pal.slice(0, rows4.length), borderWidth:0 }] },
                options: Object.assign({}, base)
            });
        }
    }

    function getBestRFQ(part) {
        const rfqs = part.rfqs || [];
        if (rfqs.length === 0) return null;
        return rfqs.reduce((best, r) => {
            if (best === null) return r;
            return Number(r.unitCost) < Number(best.unitCost) ? r : best;
        }, null);
    }

    function getPart(partId) {
        return (app.data.costAnalysis.parts || []).find(p => p.id === partId);
    }

    function getRawMaterial(id) {
        if (!id) return null;
        return (app.data.costAnalysis.rawMaterials || []).find(m => m.id === id) || null;
    }

    function getWorkCenter(id) {
        if (!id) return null;
        return (app.data.costAnalysis.workCenters || []).find(w => w.id === id) || null;
    }

    function computeInHouseUnitCost(part) {
        const ih = part.inHouse;
        if (!ih) return null;
        const hasOps = ih.operations && ih.operations.length > 0;
        const hasLaborOps = ih.laborOperations && ih.laborOperations.length > 0;
        const hasMat = ih.rawMaterialId && ih.usedPerPart != null;
        const hasLegacyMat = ih.materialUsedPerPart != null && ih.materialCostPerUom != null;
        const hasOldLegacyMat = ih.materialCost != null && ih.materialCost > 0;
        if (!hasOps && !hasLaborOps && !hasMat && !hasLegacyMat && !hasOldLegacyMat) return null;

        const qty = Number(ih.qtyRan) || 1;
        const machineTotal = hasOps
            ? ih.operations.reduce((sum, op) => {
                const wc = op.workCenterId ? getWorkCenter(op.workCenterId) : null;
                const rate = wc ? Number(wc.ratePerHour) : (Number(op.ratePerHour) || 0);
                return sum + ((Number(op.hours) || 0) / qty) * rate;
            }, 0)
            : 0;
        const laborTotal = hasLaborOps
            ? ih.laborOperations.reduce((sum, op) =>
                sum + ((Number(op.hours) || 0) / qty) * (Number(op.ratePerHour) || 0), 0)
            : 0;

        // 3-tier material cost lookup
        let mat = 0;
        if (hasMat) {
            const rm = getRawMaterial(ih.rawMaterialId);
            if (rm) mat = Number(ih.usedPerPart) * Number(rm.costPerUom);
        } else if (hasLegacyMat) {
            mat = Number(ih.materialUsedPerPart) * Number(ih.materialCostPerUom);
        } else if (hasOldLegacyMat) {
            mat = Number(ih.materialCost) / qty;
        }

        const ohPct = Number(ih.overheadPct) || 0;
        return (machineTotal + laborTotal + mat) * (1 + ohPct / 100);
    }

    // ─── Update Boats/Year ────────────────────────────────────────────────────

    function updateBoatsPerYear(val) {
        const n = parseInt(val);
        if (!isNaN(n) && n > 0) {
            app.data.costAnalysis.boatsPerYear = n;
            saveData();
            renderCostAnalysisPage();
        }
    }

    // ─── Add / Edit Part Modal ────────────────────────────────────────────────

    function showAddPartModal() { showPartForm(null); }
    function showEditPartModal(partId) { showPartForm(partId); }

    function showPartForm(partId) {
        const part = partId ? getPart(partId) : null;
        const title = part ? 'Edit Part' : 'Add Part';

        const allParts = app.data.costAnalysis.parts || [];
        const supersedOptions = allParts
            .filter(p => p.id !== partId)
            .map(p => {
                const selected = (part && part.supersedesPartId === p.id) ? ' selected' : '';
                return '<option value="' + p.id + '"' + selected + '>' +
                    escapeHtml(p.partNumber) +
                    (p.description ? ' — ' + escapeHtml(p.description) : '') +
                    '</option>';
            }).join('');

        const aliasVal = (part && part.aliases && part.aliases.length > 0)
            ? escapeHtml(part.aliases.join(', '))
            : '';

        const allProducts = app.data.products || [];
        const partProductIds = (part && part.productIds) || [];
        const productChecksHtml = allProducts.length === 0
            ? '<span class="muted" style="font-size:12px;">No products defined. Add products in the Products page.</span>'
            : allProducts.map(pr => {
                const chk = partProductIds.includes(pr.id) ? ' checked' : '';
                return '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:3px 0;">' +
                    '<input type="checkbox" class="ca-product-check" value="' + pr.id + '"' + chk + '> ' +
                    '<span>' + escapeHtml(pr.name) + (pr.code ? ' <span class="muted" style="font-size:11px;">(' + escapeHtml(pr.code) + ')</span>' : '') + '</span>' +
                    '</label>';
            }).join('');

        const partSuppliers = [...new Set((app.data.costAnalysis.parts || [])
            .map(p => p.currentSupplier).filter(Boolean))].sort();
        const partSupplierList = partSuppliers.map(s => '<option value="' + escapeHtml(s) + '">').join('');

        const partCommodities = [...new Set((app.data.costAnalysis.parts || [])
            .map(p => p.commodity).filter(Boolean))].sort();
        const partCommodityList = partCommodities.map(s => '<option value="' + escapeHtml(s) + '">').join('');

        const html = `
        <div class="modal-overlay" id="caPartModal">
            <div class="modal">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="document.getElementById('caPartModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group" style="flex:2;">
                            <label class="form-label">Part Number *</label>
                            <input type="text" class="form-control" id="ca-pn" value="${escapeHtml(part ? part.partNumber : '')}" placeholder="PN-001">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label class="form-label">Rev</label>
                            <input type="text" class="form-control" id="ca-rev" value="${escapeHtml(part ? part.rev || '' : '')}" placeholder="000">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <input type="text" class="form-control" id="ca-desc" value="${escapeHtml(part ? part.description : '')}" placeholder="Bracket, mounting">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Alternate Part Numbers (aliases)</label>
                        <input type="text" class="form-control" id="ca-aliases" value="${aliasVal}" placeholder="OLD-PN-001, ALT-001">
                        <small class="muted" style="font-size:11px;">Comma-separated. Old or alternate part numbers for this same part.</small>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Unit of Measure</label>
                            <select class="form-control" id="ca-uom">
                                <option value="ea" ${(!part || part.unitOfMeasure === 'ea') ? 'selected' : ''}>ea</option>
                                <option value="ft" ${part && part.unitOfMeasure === 'ft' ? 'selected' : ''}>ft</option>
                                <option value="m" ${part && part.unitOfMeasure === 'm' ? 'selected' : ''}>m</option>
                                <option value="in" ${part && part.unitOfMeasure === 'in' ? 'selected' : ''}>in</option>
                                <option value="kg" ${part && part.unitOfMeasure === 'kg' ? 'selected' : ''}>kg</option>
                                <option value="lb" ${part && part.unitOfMeasure === 'lb' ? 'selected' : ''}>lb</option>
                                <option value="lot" ${part && part.unitOfMeasure === 'lot' ? 'selected' : ''}>lot</option>
                                <option value="set" ${part && part.unitOfMeasure === 'set' ? 'selected' : ''}>set</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">QPB (Qty/Boat) *</label>
                            <input type="number" class="form-control" id="ca-qpb" value="${part ? part.qpb : 1}" min="0" step="0.01">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Commodity</label>
                        <input type="text" class="form-control" id="ca-commodity" list="ca-commodity-list" value="${escapeHtml(part ? part.commodity || '' : '')}" placeholder="e.g. MTS Mechanical" autocomplete="off">
                        <datalist id="ca-commodity-list">${partCommodityList}</datalist>
                    </div>

                    <div class="cost-form-section-label">Supplier</div>
                    <div class="form-group">
                        <label class="form-label">Supplier Name</label>
                        <input type="text" class="form-control" id="ca-supplier" list="ca-supplier-list" value="${escapeHtml(part ? part.currentSupplier : '')}" placeholder="Acme Corp" autocomplete="off">
                        <datalist id="ca-supplier-list">${partSupplierList}</datalist>
                    </div>
                    <div class="form-group">
                        <label class="form-label">PO Number</label>
                        <input type="text" class="form-control" id="ca-po" value="${escapeHtml(part ? part.currentPoNumber : '')}" placeholder="PO-2024-001">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Unit Cost ($) *</label>
                            <input type="number" class="form-control" id="ca-cost" value="${part ? part.currentUnitCost : ''}" min="0" step="0.0001" placeholder="0.00"
                                oninput="window._ca.updatePOTotal()">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Qty Purchased (PO)</label>
                            <input type="number" class="form-control" id="ca-qty-purchased" value="${part && part.currentQtyPurchased != null ? part.currentQtyPurchased : ''}" min="0" step="1" placeholder="0"
                                oninput="window._ca.updatePOTotal()">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Total PO Cost</label>
                        <input type="text" class="form-control" id="ca-po-total" readonly
                            style="background:var(--surface-2); color:var(--muted);"
                            value="${part && part.currentQtyPurchased && part.currentUnitCost ? fmt$((Number(part.currentQtyPurchased) || 0) * (Number(part.currentUnitCost) || 0)) : ''}">
                    </div>

                    <div class="cost-form-section-label">Products</div>
                    <div class="form-group">
                        <label class="form-label">Applies to Products</label>
                        <div style="display:flex; flex-wrap:wrap; gap:4px 20px; margin-top:4px;">
                            ${productChecksHtml}
                        </div>
                        <small class="muted" style="font-size:11px;">Tag which products this part is used in.</small>
                    </div>

                    <div class="cost-form-section-label">TLA Assignment</div>
                    <div class="form-group">
                        <label class="form-label">Belongs to TLA(s)</label>
                        ${(function() {
                            const tlas = app.data.costAnalysis.tlas || [];
                            if (!tlas.length) return '<span class="muted" style="font-size:12px;">No TLAs defined yet. Create one in the TLAs tab.</span>';
                            return '<div style="display:flex;flex-wrap:wrap;gap:4px 20px;margin-top:4px;">' +
                                tlas.map(function(t) {
                                    const inTLA = (t.items || []).some(function(i) { return i.partId === partId; });
                                    return '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:3px 0;">' +
                                        '<input type="checkbox" class="ca-tla-check" value="' + t.id + '"' + (inTLA ? ' checked' : '') + '> ' +
                                        '<span>' + escapeHtml(t.name) + (t.partNumber ? ' <span class="muted" style="font-size:11px;">(' + escapeHtml(t.partNumber) + ')</span>' : '') + '</span>' +
                                        '</label>';
                                }).join('') + '</div>';
                        })()}
                        <small class="muted" style="font-size:11px;">Check which TLAs this part belongs to. Qty defaults to 1 — adjust in the TLA detail view.</small>
                    </div>

                    <div class="cost-form-section-label">Surface Finish</div>
                    <div class="form-row">
                        <div class="form-group" style="flex:1;">
                            <label class="form-label">Finish Type</label>
                            <select class="form-control" id="ca-finish-type" onchange="window._ca._toggleFinishCost()">
                                <option value="" ${!part || !part.surfaceFinish || !part.surfaceFinish.type ? 'selected' : ''}>— None —</option>
                                <option value="anodizing" ${part && part.surfaceFinish && part.surfaceFinish.type === 'anodizing' ? 'selected' : ''}>Anodizing</option>
                                <option value="powdercoating" ${part && part.surfaceFinish && part.surfaceFinish.type === 'powdercoating' ? 'selected' : ''}>Powder Coating</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex:1;" id="ca-finish-cost-wrap" ${(!part || !part.surfaceFinish || !part.surfaceFinish.type) ? 'style="display:none;"' : ''}>
                            <label class="form-label">Finish Cost ($/part)</label>
                            <input type="number" class="form-control" id="ca-finish-cost" min="0" step="0.0001" placeholder="0.00"
                                value="${part && part.surfaceFinish && part.surfaceFinish.costPerPart ? part.surfaceFinish.costPerPart : ''}">
                        </div>
                    </div>
                    <div class="form-row" id="ca-finish-extra-wrap" ${(!part || !part.surfaceFinish || !part.surfaceFinish.type) ? 'style="display:none;"' : ''}>
                        <div class="form-group" style="flex:1;">
                            <label class="form-label">Finish Supplier</label>
                            <input type="text" class="form-control" id="ca-finish-supplier" placeholder="Anodizer Co." value="${escapeHtml(part && part.surfaceFinish ? part.surfaceFinish.supplier || '' : '')}">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label class="form-label">Finish Notes</label>
                            <input type="text" class="form-control" id="ca-finish-notes" placeholder="Type II clear, etc." value="${escapeHtml(part && part.surfaceFinish ? part.surfaceFinish.notes || '' : '')}">
                        </div>
                    </div>

                    <div class="cost-form-section-label">Part Lineage</div>
                    <div class="form-group">
                        <label class="form-label">Supersedes Part</label>
                        <select class="form-control" id="ca-supersedes">
                            <option value="">— none —</option>
                            ${supersedOptions}
                        </select>
                        <small class="muted" style="font-size:11px;">Select the part this one formally replaces. The predecessor will appear as a child row in the comparison table.</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('caPartModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="window._ca.savePart('${partId || ''}')">Save</button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('ca-pn').focus();
    }

    function _toggleFinishCost() {
        var type = document.getElementById('ca-finish-type').value;
        var costWrap = document.getElementById('ca-finish-cost-wrap');
        var extraWrap = document.getElementById('ca-finish-extra-wrap');
        if (costWrap) costWrap.style.display = type ? '' : 'none';
        if (extraWrap) extraWrap.style.display = type ? '' : 'none';
    }

    function updatePOTotal() {
        const cost = parseFloat(document.getElementById('ca-cost').value) || 0;
        const qty = parseFloat(document.getElementById('ca-qty-purchased').value) || 0;
        const el = document.getElementById('ca-po-total');
        if (el) el.value = (cost > 0 && qty > 0) ? fmt$(cost * qty) : '';
    }

    function savePart(partId) {
        const pn = document.getElementById('ca-pn').value.trim();
        const cost = parseFloat(document.getElementById('ca-cost').value);
        const qpb = parseFloat(document.getElementById('ca-qpb').value);
        const qtyPurchased = parseFloat(document.getElementById('ca-qty-purchased').value);
        const aliasesRaw = document.getElementById('ca-aliases').value;
        const aliases = aliasesRaw.split(',').map(s => s.trim()).filter(Boolean);
        const supersedesPartId = document.getElementById('ca-supersedes').value || null;
        const productIds = Array.from(document.querySelectorAll('.ca-product-check:checked')).map(cb => cb.value);

        if (!pn) { showToast('Part number is required', 'error'); return; }
        if (isNaN(cost) || cost < 0) { showToast('Valid unit cost is required', 'error'); return; }
        if (isNaN(qpb) || qpb < 0) { showToast('Valid QPB is required', 'error'); return; }

        const finishType = (document.getElementById('ca-finish-type') ? document.getElementById('ca-finish-type').value : '');
        const finishCost = parseFloat(document.getElementById('ca-finish-cost') ? document.getElementById('ca-finish-cost').value : '') || 0;
        const surfaceFinish = finishType
            ? { type: finishType, costPerPart: finishCost,
                supplier: (document.getElementById('ca-finish-supplier') ? document.getElementById('ca-finish-supplier').value.trim() : ''),
                notes: (document.getElementById('ca-finish-notes') ? document.getElementById('ca-finish-notes').value.trim() : '') }
            : null;

        const fields = {
            partNumber: pn,
            rev: document.getElementById('ca-rev').value.trim(),
            description: document.getElementById('ca-desc').value.trim(),
            unitOfMeasure: document.getElementById('ca-uom').value,
            qpb,
            currentSupplier: document.getElementById('ca-supplier').value.trim(),
            commodity: (document.getElementById('ca-commodity') ? document.getElementById('ca-commodity').value.trim() : ''),
            currentPoNumber: document.getElementById('ca-po').value.trim(),
            currentUnitCost: cost,
            currentQtyPurchased: isNaN(qtyPurchased) ? null : qtyPurchased,
            aliases,
            supersedesPartId,
            productIds,
            surfaceFinish
        };

        ensureCostAnalysisData();
        const parts = app.data.costAnalysis.parts;

        let savedPartId = partId;
        if (partId) {
            const idx = parts.findIndex(p => p.id === partId);
            if (idx >= 0) Object.assign(parts[idx], fields);
        } else {
            const np = Object.assign({ id: generateId(), rfqs: [], inHouse: null }, fields);
            parts.push(np);
            savedPartId = np.id;
        }

        // Sync TLA assignments
        const allTLAChecks = Array.from(document.querySelectorAll('.ca-tla-check'));
        if (allTLAChecks.length > 0) {
            const tlas = app.data.costAnalysis.tlas || [];
            const checkedIds = allTLAChecks.filter(cb => cb.checked).map(cb => cb.value);
            const allIds = allTLAChecks.map(cb => cb.value);
            tlas.forEach(function(t) {
                if (!allIds.includes(t.id)) return;
                t.items = t.items || [];
                if (checkedIds.includes(t.id)) {
                    if (!t.items.some(function(i) { return i.partId === savedPartId; })) {
                        t.items.push({ id: generateId(), partId: savedPartId, qtyPerTLA: 1, notes: '' });
                    }
                } else {
                    t.items = t.items.filter(function(i) { return i.partId !== savedPartId; });
                }
            });
        }

        saveData();
        document.getElementById('caPartModal').remove();
        showToast(partId ? 'Part updated' : 'Part added');
        renderCostAnalysisPage();
    }

    function deletePart(partId) {
        if (!confirm('Delete this part and all its data?')) return;
        const parts = app.data.costAnalysis.parts || [];
        parts.forEach(p => { if (p.supersedesPartId === partId) p.supersedesPartId = null; });
        app.data.costAnalysis.parts = parts.filter(p => p.id !== partId);
        saveData();
        showToast('Part deleted');
        const dm = document.getElementById('caDetailModal');
        if (dm) dm.remove();
        renderCostAnalysisPage();
    }

    function _standardizeMillWC() {
        if (app.data.costAnalysis._millWCStandardized) return;
        app.data.costAnalysis._millWCStandardized = true;
        var wcs  = app.data.costAnalysis.workCenters || [];
        var parts = app.data.costAnalysis.parts || [];
        var dirty = false;

        // Find canonical "Mill Op 1" and legacy "Mill" work centers
        var op1WC  = wcs.find(function(w) { return w.name.toLowerCase() === 'mill op 1'; });
        var millWC = wcs.find(function(w) { return w.name.toLowerCase() === 'mill' && w !== op1WC; });

        // If only "Mill" exists, rename it to "Mill Op 1"
        if (millWC && !op1WC) {
            millWC.name = 'Mill Op 1';
            op1WC = millWC;
            millWC = null;
            dirty = true;
        }

        // If both exist, migrate ops linked to "Mill" WC → "Mill Op 1" WC, then delete "Mill" WC
        if (millWC && op1WC) {
            parts.forEach(function(p) {
                ((p.inHouse && p.inHouse.operations) || []).forEach(function(op) {
                    if (op.workCenterId === millWC.id) {
                        op.workCenterId = op1WC.id;
                        dirty = true;
                    }
                });
            });
            app.data.costAnalysis.workCenters = wcs.filter(function(w) { return w !== millWC; });
        }

        // Rename any unlinked op.machine === "Mill" (case-insensitive, not "Manual Mill") → "Mill Op 1"
        parts.forEach(function(p) {
            ((p.inHouse && p.inHouse.operations) || []).forEach(function(op) {
                if (op.machine && op.machine.toLowerCase() === 'mill') {
                    op.machine = 'Mill Op 1';
                    dirty = true;
                }
            });
        });

        if (dirty) saveData();
        // Re-run auto-link so renamed ops get connected to their work center
        _autoLinkOpsByName();
    }

    function _ensureStandardWorkCenters() {
        var wcs = app.data.costAnalysis.workCenters;
        if (!wcs) { wcs = []; app.data.costAnalysis.workCenters = wcs; }
        var standard = [
            'Programming','Saw','Mill Op 1','Mill Op 2','Mill Op 3',
            'Manual Mill','5 Axis','Waterjet','Deburr','Press Brake',
            'Lathe','Tumbler','Welding'
        ];
        var dirty = false;
        standard.forEach(function(name) {
            var exists = wcs.find(function(w) { return w.name.toLowerCase() === name.toLowerCase(); });
            if (!exists) {
                wcs.push({ id: generateId(), name: name, ratePerHour: 0, notes: '' });
                dirty = true;
            }
        });
        if (dirty) saveData();
    }

    function _autoLinkOpsByName() {
        const wcs = app.data.costAnalysis.workCenters || [];
        if (wcs.length === 0) return;
        const nameMap = {};
        wcs.forEach(function(wc) { nameMap[wc.name.toLowerCase()] = wc.id; });
        const parts = app.data.costAnalysis.parts || [];
        let dirty = false;
        parts.forEach(function(p) {
            const ops = (p.inHouse && p.inHouse.operations) || [];
            ops.forEach(function(op) {
                if (!op.workCenterId && op.machine) {
                    const wcId = nameMap[op.machine.toLowerCase()];
                    if (wcId) { op.workCenterId = wcId; dirty = true; }
                }
            });
        });
        if (dirty) saveData();
    }

    function _seedMfgParts2() {
        if (app.data.costAnalysis._mfgParts2Seeded) return;
        app.data.costAnalysis._mfgParts2Seeded = true;
        var wcs = app.data.costAnalysis.workCenters || [];
        var weldWC = wcs.find(function(w) { return w.name.toLowerCase() === 'welding'; });
        if (!weldWC) {
            weldWC = { id: generateId(), name: 'Welding', ratePerHour: 0, notes: '' };
            wcs.push(weldWC);
            app.data.costAnalysis.workCenters = wcs;
        }
        var corsairProd = (app.data.products || []).find(function(p) { return p.name.toLowerCase().indexOf('corsair') !== -1; });
        var corsairId = corsairProd ? [corsairProd.id] : [];
        var existing = {};
        (app.data.costAnalysis.parts || []).forEach(function(p) { existing[p.partNumber] = p; });
        var seeds = [
            {pn:"416-00176",rev:"000",desc:"PAD, MAST FOOT, ADHESIVE BACKED, CORSAIR",qpb:4,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"416-00190",rev:"000",desc:"PAD, .25IN THICK, 50OO, SORBOTHANE",qpb:3,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"417-00114",rev:"000",desc:"SUPPORT, IRIDIUM, HDPE",qpb:2,sup:"MTS Mechanical",qty:88,ops:[{"m": "Waterjet", "h": 0.8394}, {"m": "Mill Op 1", "h": 2.7489}]},
            {pn:"417-00127",rev:"001",desc:"PLATE, TOP, VESSEL LINK",qpb:1,sup:"MTS Mechanical",qty:18,ops:[{"m": "Waterjet", "h": 3.1819}, {"m": "Deburr", "h": 1.6983}]},
            {pn:"417-00128",rev:"000",desc:"GUSSET, MID, IRIDIUM BRACKET",qpb:1,sup:"MTS Mechanical",qty:22,ops:[{"m": "Waterjet", "h": 8.5406}, {"m": "Mill Op 3", "h": 2.205}]},
            {pn:"419-00010",rev:"000",desc:"PAD, FUEL TANK ISOLATION, RUBBER",qpb:4,sup:"MTS Mechanical",qty:48,ops:[{"m": "Waterjet", "h": 0.7281}, {"m": "Programming", "h": 0.3381}]},
            {pn:"419-00011",rev:"000",desc:"PAD, SIDE FUEL TANK ISOLATION, RUBBER",qpb:2,sup:"MTS Mechanical",qty:10,ops:[{"m": "Waterjet", "h": 0.7336}, {"m": "Programming", "h": 0.3381}]},
            {pn:"420-00052",rev:"000",desc:"*LS ORCA MOUNTING BRACKET, ANTI SLIP PAD",qpb:9,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"420-00053",rev:"000",desc:"GASKET, E-CABINET, FORE HATCH",qpb:2,sup:"MTS Mechanical",qty:30,ops:[{"m": "Waterjet", "h": 2.4158}]},
            {pn:"420-00054",rev:"000",desc:"GASKET, I/O PANEL",qpb:4,sup:"MTS Mechanical",qty:55,ops:[{"m": "Waterjet", "h": 4.6769}, {"m": "Programming", "h": 0.1406}]},
            {pn:"420-00066",rev:"000",desc:"GASKET, E-CABINET, AFT HATCH",qpb:1,sup:"MTS Mechanical",qty:20,ops:[{"m": "Waterjet", "h": 1.2875}]},
            {pn:"420-00072",rev:"000",desc:"GASKET, ENCLOSURE, SIDE PANEL, CRADLEPOINT",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"420-00073",rev:"000",desc:"GASKET, BULKHEAD PANEL, ENCLOSURE, CRADLEPOINT",qpb:2,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"420-00082",rev:"000",desc:"GASKET, ENGINE HATCH DORADE ENCLOSURE, CORSAIR",qpb:2,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"421-00006",rev:"003",desc:"*EK CORSAIR BASELINE UID PLACARD",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"421-00008",rev:"002",desc:"CORSAIR COCOM PACKAGE UID PLACARD",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"421-00011",rev:"000",desc:"CORSAIR LIFT AND TIEDOWN PLACARD",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"421-00012",rev:"002",desc:"*EK CORSAIR TRAILER UID PLACARD",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"442-00028",rev:"000",desc:"THERMAL PAD, 0.5MM THICK, SASSB, CRADLEPOINT",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"442-00031",rev:"000",desc:"THERMAL PAD, 1MM THICK, POE INJECTOR",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"444-00113",rev:"000",desc:"TUBE, ROUND, 6IN, .125IN THICK, 6061 ALUMINUM",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"446-00287",rev:"000",desc:"BOAT OUTFITTERS, HATCH, 26IN X 36IN HINGED",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"459-00020",rev:"000",desc:"AUTOVIMATION, ORCA CAMERA MOUNT, BASLER Ace2",qpb:2,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"472-00101",rev:"000",desc:"PLATE, FRONT PLATE, ELECTRONICS CABINET",qpb:4,sup:"MTS Mechanical",qty:64,ops:[{"m": "Waterjet", "h": 6.9969}, {"m": "Deburr", "h": 13.1656}, {"m": "Mill Op 1", "h": 11.6964}]},
            {pn:"472-00196",rev:"001",desc:"BRACKET, SILVUS ANTENNA, MAST ATTACHMENT",qpb:2,sup:"MTS Mechanical",qty:18,ops:[{"m": "Waterjet", "h": 1.1358}, {"m": "Deburr", "h": 1.9547}]},
            {pn:"472-00210",rev:"001",desc:"BRACKET, MOUNTING, EXPANSION CORE",qpb:1,sup:"MTS Mechanical",qty:60,ops:[{"m": "Waterjet", "h": 5.5125}, {"m": "Deburr", "h": 0.3611}, {"m": "Press Brake", "h": 1.5875}]},
            {pn:"472-00211",rev:"001",desc:"BRACKET, MOUNTING, MIRROR, EXPANSION CORE",qpb:1,sup:"MTS Mechanical",qty:60,ops:[{"m": "Waterjet", "h": 6.915}, {"m": "Deburr", "h": 2.0458}, {"m": "Press Brake", "h": 0.4453}]},
            {pn:"472-00281",rev:"003",desc:"DORADE ENCLOSURE, ENGINE HATCH, INTAKE",qpb:1,sup:"MTS Mechanical",qty:24,ops:[{"m": "Waterjet", "h": 5.6175}, {"m": "Deburr", "h": 9.7836}, {"m": "Press Brake", "h": 1.2261}, {"m": "Lathe", "h": 10.1761}]},
            {pn:"472-00336",rev:"000",desc:"BRACKET, GPS, CORSAIR",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"472-00337",rev:"001",desc:"PANEL, ROXTEC BULKHEAD PLATE",qpb:1,sup:"MTS Mechanical",qty:60,ops:[{"m": "Waterjet", "h": 5.4192}, {"m": "Deburr", "h": 1.9644}]},
            {pn:"472-00353",rev:"003",desc:"BRACKET, BATTERY, RETAINMENT",qpb:3,sup:"MTS Mechanical",qty:120,ops:[{"m": "Waterjet", "h": 34.2322}, {"m": "Deburr", "h": 2.3861}, {"m": "Press Brake", "h": 2.5128}]},
            {pn:"472-00361",rev:"004",desc:"BRACKET, STARSHIELD, INTERNAL MOUNT",qpb:1,sup:"MTS Mechanical",qty:24,ops:[{"m": "Waterjet", "h": 6.9944}, {"m": "Deburr", "h": 7.7672}, {"m": "Press Brake", "h": 1.6197}]},
            {pn:"472-00374",rev:"003",desc:"BRACKET, E-CABINET FLOOR, CORSAIR",qpb:2,sup:"MTS Mechanical",qty:80,ops:[{"m": "Waterjet", "h": 14.6136}, {"m": "Deburr", "h": 4.6042}, {"m": "Press Brake", "h": 1.1667}]},
            {pn:"472-00377",rev:"002",desc:"PANEL, AMPHENOL CONNECTOR, CORSAIR",qpb:1,sup:"MTS Mechanical",qty:80,ops:[{"m": "Waterjet", "h": 5.6606}, {"m": "Deburr", "h": 1.3156}, {"m": "Press Brake", "h": 10.5283}]},
            {pn:"472-00383",rev:"000",desc:"PLATE, BLUESEA BUSSBAR",qpb:1,sup:"MTS Mechanical",qty:384,ops:[{"m": "Waterjet", "h": 2.0942}, {"m": "Deburr", "h": 5.5142}, {"m": "Programming", "h": 1.1881}]},
            {pn:"472-00400",rev:"001",desc:"PLATE, CELL, ANTENNA",qpb:1,sup:"MTS Mechanical",qty:60,ops:[{"m": "Waterjet", "h": 1.6222}, {"m": "Deburr", "h": 2.1306}]},
            {pn:"472-00426",rev:"000",desc:"SHELF, 1U, E-CABINET, S3, CORSAIR",qpb:1,sup:"MTS Mechanical",qty:18,ops:[{"m": "Waterjet", "h": 2.9692}, {"m": "Deburr", "h": 4.7506}, {"m": "Press Brake", "h": 1.1917}]},
            {pn:"472-00429",rev:"000",desc:"BRACKET, MOUNT, ANTENNAS, E-CAB, CORSAIR",qpb:1,sup:"MTS Mechanical",qty:80,ops:[{"m": "Waterjet", "h": 7.2217}, {"m": "Deburr", "h": 1.3156}, {"m": "Press Brake", "h": 0.6264}]},
            {pn:"472-00431",rev:"002",desc:"PLATE, CONNECTOR PLATE, J2, J4",qpb:1,sup:"MTS Mechanical",qty:14,ops:[{"m": "Waterjet", "h": 4.0172}, {"m": "Deburr", "h": 1.4375}, {"m": "Saw", "h": 2.6503}]},
            {pn:"472-00432",rev:"003",desc:"PLATE, CONNECTOR PLATE, HELM",qpb:1,sup:"MTS Mechanical",qty:82,ops:[{"m": "Waterjet", "h": 6.0039}, {"m": "Deburr", "h": 10.1608}, {"m": "Programming", "h": 0.1047}, {"m": "Mill Op 1", "h": 6.3981}]},
            {pn:"472-00433",rev:"002",desc:"PLATE, CONNECTOR PLATE, J5, J3",qpb:1,sup:"MTS Mechanical",qty:82,ops:[{"m": "Waterjet", "h": 4.7603}, {"m": "Deburr", "h": 2.4133}, {"m": "Programming", "h": 0.1642}, {"m": "Mill Op 1", "h": 3.5467}]},
            {pn:"472-00437",rev:"001",desc:"BRACKET, BULKHEAD CONNECTOR, SHELL SIZE 9",qpb:1,sup:"MTS Mechanical",qty:65,ops:[{"m": "Waterjet", "h": 2.0158}, {"m": "Deburr", "h": 3.1733}, {"m": "Manual Mill", "h": 1.7017}, {"m": "Press Brake", "h": 0.9983}]},
            {pn:"472-00438",rev:"001",desc:"BRACKET, BULKHEAD CONNECTOR, SHELL SIZE 9-13",qpb:1,sup:"MTS Mechanical",qty:170,ops:[{"m": "Waterjet", "h": 0.6789}, {"m": "Deburr", "h": 0.8053}, {"m": "Programming", "h": 0.0858}, {"m": "Press Brake", "h": 2.6794}]},
            {pn:"472-00439",rev:"001",desc:"BRACKET, BULKHEAD CONNECTOR, SHELL SIZE 13",qpb:3,sup:"MTS Mechanical",qty:124,ops:[{"m": "Waterjet", "h": 4.0547}, {"m": "Deburr", "h": 7.6294}, {"m": "Press Brake", "h": 0.9661}]},
            {pn:"472-00442",rev:"000",desc:"*LS, SHIM, FUEL TANK, .125IN THICK, AL",qpb:0,sup:"MTS Mechanical",qty:114,ops:[{"m": "Waterjet", "h": 0.6281}, {"m": "Deburr", "h": 0.7825}]},
            {pn:"472-00447",rev:"000",desc:"PLATE, TOP SHEET, ICM",qpb:1,sup:"MTS Mechanical",qty:70,ops:[{"m": "Waterjet", "h": 5.7875}, {"m": "Deburr", "h": 3.8333}]},
            {pn:"472-00460",rev:"000",desc:"VOLVO ENGINE MOUNT, CORSAIR",qpb:2,sup:"MTS Mechanical",qty:21,ops:[{"m": "Waterjet", "h": 3.4636}, {"m": "Deburr", "h": 0.3692}, {"m": "Press Brake", "h": 1.5186}]},
            {pn:"472-00468",rev:"001",desc:"BRACKET, BULKHEAD CONNECTOR, SHELL SIZE 11",qpb:1,sup:"MTS Mechanical",qty:36,ops:[{"m": "Waterjet", "h": 1.2383}, {"m": "Deburr", "h": 0.515}]},
            {pn:"472-00475",rev:"000",desc:"PLATE, BACKING, HANDLE. ENGINE HATCH",qpb:4,sup:"MTS Mechanical",qty:192,ops:[{"m": "Waterjet", "h": 4.2192}, {"m": "Deburr", "h": 0.5114}]},
            {pn:"472-00476",rev:"003",desc:"PLATE, CONNECTOR PLATE, J8 AND J1",qpb:1,sup:"MTS Mechanical",qty:14,ops:[{"m": "Waterjet", "h": 3.9728}, {"m": "Deburr", "h": 0.8925}, {"m": "Saw", "h": 0.7586}]},
            {pn:"472-00480",rev:"000",desc:"BRACKET, PAYLOAD RAIL SUPPORT, LONG",qpb:2,sup:"MTS Mechanical",qty:60,ops:[{"m": "Waterjet", "h": 4.0733}, {"m": "Deburr", "h": 9.6811}, {"m": "Press Brake", "h": 8.6239}]},
            {pn:"472-00481",rev:"000",desc:"BRACKET, PAYLOAD RAIL SUPPORT, PORT, SHORT",qpb:1,sup:"MTS Mechanical",qty:30,ops:[{"m": "Waterjet", "h": 2.3128}, {"m": "Deburr", "h": 0.455}, {"m": "Press Brake", "h": 2.9314}]},
            {pn:"472-00482",rev:"000",desc:"BRACKET, PAYLOAD RAIL SUPPORT, STBD, SHORT",qpb:1,sup:"MTS Mechanical",qty:60,ops:[{"m": "Waterjet", "h": 5.6233}, {"m": "Deburr", "h": 3.3311}, {"m": "Press Brake", "h": 1.7483}]},
            {pn:"472-00486",rev:"001",desc:"BRACKET, BULKHEAD CONNECTOR, SIZE 9-11-13 BONDED",qpb:1,sup:"MTS Mechanical",qty:72,ops:[{"m": "Waterjet", "h": 5.4639}, {"m": "Deburr", "h": 1.9881}, {"m": "Press Brake", "h": 1.9022}]},
            {pn:"472-00488",rev:"000",desc:"PLATE, LATCH, ENGINE HATCH",qpb:4,sup:"MTS Mechanical",qty:128,ops:[{"m": "Waterjet", "h": 5.7753}, {"m": "Deburr", "h": 1.8664}]},
            {pn:"472-00495",rev:"000",desc:"BRACKET, SILVUS RADIO 4400",qpb:1,sup:"MTS Mechanical",qty:80,ops:[{"m": "Waterjet", "h": 6.2364}, {"m": "Deburr", "h": 1.9986}, {"m": "Press Brake", "h": 1.7331}]},
            {pn:"472-00496",rev:"002",desc:"BRACKET, BULKHEAD CONNECTOR, SINGLE HOLE SIZE 13",qpb:1,sup:"MTS Mechanical",qty:72,ops:[{"m": "Waterjet", "h": 2.3022}, {"m": "Deburr", "h": 2.5067}, {"m": "Press Brake", "h": 1.0464}]},
            {pn:"472-00497",rev:"002",desc:"SUNSHADE SHROUD, DOUBLER",qpb:2,sup:"MTS Mechanical",qty:64,ops:[{"m": "Waterjet", "h": 7.4669}, {"m": "Deburr", "h": 3.2256}, {"m": "Press Brake", "h": 1.5483}]},
            {pn:"472-00498",rev:"002",desc:"SUNSHADE SHROUD, SINGLE",qpb:2,sup:"MTS Mechanical",qty:48,ops:[{"m": "Waterjet", "h": 5.9647}, {"m": "Deburr", "h": 2.9106}, {"m": "Press Brake", "h": 2.1714}]},
            {pn:"472-00506",rev:"000",desc:"CAP, SHROUD, VOLVO, HYDRAULIC MODULE",qpb:1,sup:"MTS Mechanical",qty:55,ops:[{"m": "Waterjet", "h": 8.0339}]},
            {pn:"472-00512",rev:"000",desc:"PLATE, SIDE PANEL, ENCLOSURE, CRADLEPOINT",qpb:1,sup:"MTS Mechanical",qty:20,ops:[{"m": "Waterjet", "h": 2.3158}, {"m": "Deburr", "h": 0.75}]},
            {pn:"472-00513",rev:"001",desc:"PLATE, BULKHEAD PANEL, ENCLOSURE, CRADLEPOINT",qpb:1,sup:"MTS Mechanical",qty:60,ops:[{"m": "Waterjet", "h": 4.9836}, {"m": "Deburr", "h": 6.4631}, {"m": "Programming", "h": 0.3067}, {"m": "Mill Op 1", "h": 1.5561}]},
            {pn:"472-00514",rev:"001",desc:"PLATE, BULKHEAD PANEL, ENCLOSURE, CRADLEPOINT (AFT)",qpb:1,sup:"MTS Mechanical",qty:60,ops:[{"m": "Waterjet", "h": 5.6861}, {"m": "Deburr", "h": 7.6744}, {"m": "Saw", "h": 2.1683}]},
            {pn:"472-00516",rev:"000",desc:"SHIM, FOR M12, PRECISION 6061 AL",qpb:6,sup:"MTS Mechanical",qty:null,ops:[{"m": "Waterjet", "h": 3.7128}, {"m": "Deburr", "h": 0.6594}]},
            {pn:"473-00083",rev:"003",desc:"WELDMENT, TUBE, MAST LIGHT",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"473-00097",rev:"002",desc:"WELDMENT, I/O ACCESS PANEL",qpb:2,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"473-00101",rev:"000",desc:"WELDMENT, GPS BRACKET",qpb:1,sup:"MTS Mechanical",qty:48,ops:[{"m": "Waterjet", "h": 4.5706}, {"m": "Deburr", "h": 4.0456}, {"m": "Mill Op 1", "h": 1.1847}, {"m": "Press Brake", "h": 1.7389}, {"m": "Lathe", "h": 3.8639}]},
            {pn:"473-00105",rev:"000",desc:"WELDMENT, NUT PLATE, MAST",qpb:4,sup:"Mechanical Assembly",qty:null,ops:[]},
            {pn:"473-00106",rev:"001",desc:"WELDMENT, FORWARD PORT ASSEMBLY, LIFTING, CORSAIR",qpb:1,sup:"Mechanical Assembly",qty:null,ops:[]},
            {pn:"473-00107",rev:"001",desc:"WELDMENT, AFT PORT ASSEMBLY, LIFTING, CORSAIR",qpb:1,sup:"Mechanical Assembly",qty:null,ops:[]},
            {pn:"473-00108",rev:"001",desc:"WELDMENT, FORWARD STARBOARD ASSEMBLY, LIFTING, CORSAIR",qpb:1,sup:"Mechanical Assembly",qty:null,ops:[]},
            {pn:"473-00109",rev:"001",desc:"WELDMENT, AFT STARBOARD ASSEMBLY, LIFTING, CORSAIR",qpb:1,sup:"Mechanical Assembly",qty:null,ops:[]},
            {pn:"473-00116",rev:"001",desc:"WELDMENT, FLIR OFFSET MOUNT, CORSAIR",qpb:1,sup:"MTS Mechanical",qty:null,ops:[]},
            {pn:"991-00372",rev:"000",desc:"ASSEMBLY, DORADE MOUNTING PLATE, CORSAIR",qpb:2,sup:"Mechanical Assembly",qty:116,ops:[{"m": "Waterjet", "h": 15.0106}, {"m": "Deburr", "h": 9.6064}, {"m": "Saw", "h": 3.7611}, {"m": "Press Brake", "h": 7.8747}]},
            {pn:"991-00411",rev:"000",desc:"ASSEMBLY, ISOLATOR BRACKET, 18IN SINGLE, ELECTRONICS CABINET",qpb:2,sup:"Mechanical Assembly",qty:80,ops:[{"m": "Waterjet", "h": 3.3197}, {"m": "Deburr", "h": 4.6564}, {"m": "Saw", "h": 1.2333}, {"m": "5 Axis", "h": 4.5547}, {"m": "Tumbler", "h": 0.7242}]},
            {pn:"991-00449",rev:"005",desc:"ASSEMBLY, BASLER RGB ACE 2, ENCLOSURE, ORCA M",qpb:2,sup:"Sub-Assembly",qty:null,ops:[]},
            {pn:"991-00538",rev:"000",desc:"ASSEMBLY, ISOLATOR BRACKET, 18IN SINGLE, ELECTRONICS CABINET (2)",qpb:1,sup:"Mechanical Assembly",qty:48,ops:[{"m": "Waterjet", "h": 6.0411}, {"m": "Deburr", "h": 4.8808}, {"m": "Saw", "h": 1.1486}, {"m": "5 Axis", "h": 1.9083}, {"m": "Tumbler", "h": 1.8508}]},
            {pn:"991-00556",rev:"000",desc:"ASSEMBLY, ACCESS PANEL, E CABINET",qpb:2,sup:"Mechanical Assembly",qty:null,ops:[]},
            {pn:"991-00583",rev:"000",desc:"ASSEMBLY, BACKING PLATE, ICM",qpb:1,sup:"Mechanical Assembly",qty:48,ops:[{"m": "Waterjet", "h": 3.1481}, {"m": "Deburr", "h": 7.1636}, {"m": "Saw", "h": 2.3331}, {"m": "Tumbler", "h": 1.0561}]},
            {pn:"991-00587",rev:"000",desc:"ASSEMBLY, BACKING PLATE, WATER FUEL SEPARATOR",qpb:1,sup:"Mechanical Assembly",qty:260,ops:[{"m": "Waterjet", "h": 4.165}, {"m": "Deburr", "h": 4.0189}, {"m": "Saw", "h": 1.0728}, {"m": "Tumbler", "h": 3.3817}]},
            {pn:"991-00592",rev:"000",desc:"ASSEMBLY, PLATE, STUD, M6, MULTI",qpb:4,sup:"Mechanical Assembly",qty:128,ops:[{"m": "Waterjet", "h": 2.7356}, {"m": "Deburr", "h": 7.6289}, {"m": "Mill Op 2", "h": 1.8331}, {"m": "Tumbler", "h": 3.1058}]},
            {pn:"991-00593",rev:"001",desc:"*LS ASSEMBLY, PLATE, STUD, M6, SINGLE",qpb:66,sup:"Mechanical Assembly",qty:418,ops:[{"m": "Waterjet", "h": 5.5761}, {"m": "Deburr", "h": 7.0536}, {"m": "Saw", "h": 0.6692}, {"m": "Tumbler", "h": 1.1636}]},
            {pn:"991-00596",rev:"000",desc:"ASSEMBLY, FUEL FILTER BACKING PLATE, CORSAIR",qpb:1,sup:"Mechanical Assembly",qty:72,ops:[{"m": "Waterjet", "h": 1.0928}, {"m": "Deburr", "h": 1.4547}, {"m": "Saw", "h": 1.5217}, {"m": "Tumbler", "h": 0.6542}]},
            {pn:"991-00601",rev:"000",desc:"ASSEMBLY, BRACKET, 1U SHELF, ELECTRONICS CABINET",qpb:4,sup:"Mechanical Assembly",qty:112,ops:[{"m": "Waterjet", "h": 3.43}, {"m": "Deburr", "h": 2.3986}, {"m": "Saw", "h": 1.0169}, {"m": "Tumbler", "h": 0.6081}]},
            {pn:"991-00637",rev:"000",desc:"BRACKET, POE SWITCH, E-CAB",qpb:1,sup:"Mechanical Assembly",qty:24,ops:[{"m": "Waterjet", "h": 2.985}, {"m": "Deburr", "h": 1.2156}, {"m": "Saw", "h": 1.0256}]},
            {pn:"991-00670",rev:"000",desc:"ASSEMBLY, BILGE MOUNT, CORSAIR",qpb:2,sup:"Mechanical Assembly",qty:88,ops:[{"m": "Waterjet", "h": 1.4294}, {"m": "Deburr", "h": 9.655}, {"m": "Saw", "h": 0.4161}, {"m": "Lathe", "h": 14.0661}]},
            {pn:"991-00676",rev:"000",desc:"ASSEMBLY, SYPHON LOOPS MOUNTING PLATE",qpb:1,sup:"Mechanical Assembly",qty:25,ops:[{"m": "Waterjet", "h": 1.4797}, {"m": "Deburr", "h": 0.8925}, {"m": "Programming", "h": 0.3744}, {"m": "Manual Mill", "h": 0.9019}, {"m": "Press Brake", "h": 1.5039}]},
            {pn:"991-00708",rev:"000",desc:"ASSEMBLY, ACCESS PANEL, AFT, E CABINET",qpb:1,sup:"Mechanical Assembly",qty:null,ops:[{"m": "5 Axis", "h": 1.4022}, {"m": "Tumbler", "h": 1.5008}]},
            {pn:"991-00740",rev:"001",desc:"ASSEMBLY, MOUNTING PLATE, FORWARD FACING, ICM",qpb:1,sup:"Mechanical Assembly",qty:40,ops:[{"m": "Waterjet", "h": 2.5539}, {"m": "Deburr", "h": 2.7575}, {"m": "5 Axis", "h": 2.77}, {"m": "Tumbler", "h": 1.4808}, {"m": "Press Brake", "h": 0.6325}]},
            {pn:"991-00751",rev:"002",desc:"Assy, Plate, Lift Point Access, STBD, PEM",qpb:1,sup:"Mechanical Assembly",qty:56,ops:[{"m": "Waterjet", "h": 2.3444}, {"m": "Deburr", "h": 2.6517}, {"m": "Programming", "h": 1.4056}, {"m": "Mill Op 3", "h": 1.9064}, {"m": "Manual Mill", "h": 2.1256}, {"m": "Press Brake", "h": 2.9933}]},
            {pn:"991-00788",rev:"001",desc:"ASSY, BRACKET, ETHERNET AND POE VERTICAL MOUNT, PEM",qpb:1,sup:"Mechanical Assembly",qty:30,ops:[{"m": "Waterjet", "h": 6.6114}, {"m": "Deburr", "h": 2.8772}, {"m": "Programming", "h": 0.3417}, {"m": "Mill Op 3", "h": 3.8983}, {"m": "Manual Mill", "h": 3.7644}, {"m": "Press Brake", "h": 2.0178}]},
            {pn:"991-00796",rev:"001",desc:"ASSEMBLY, BRACKET, MOUNT, COMPASS",qpb:1,sup:"Mechanical Assembly",qty:50,ops:[{"m": "Waterjet", "h": 3.8222}, {"m": "Deburr", "h": 6.0736}, {"m": "Saw", "h": 1.0964}, {"m": "5 Axis", "h": 1.1978}, {"m": "Tumbler", "h": 1.0706}]},
            {pn:"991-00806",rev:"000",desc:"ASSEMBLY, STUD PLATE, RULE BLOWER MOTOR",qpb:2,sup:"Mechanical Assembly",qty:40,ops:[{"m": "Waterjet", "h": 1.1953}, {"m": "Deburr", "h": 1.0839}, {"m": "Saw", "h": 0.3058}, {"m": "Tumbler", "h": 0.6489}]},
            {pn:"991-00822",rev:"002",desc:"PLATE, MOUNTING, MISC ELECTRONICS, E-CAB, PEM, CORSAIR",qpb:1,sup:"Mechanical Assembly",qty:20,ops:[{"m": "Waterjet", "h": 1.1861}, {"m": "Deburr", "h": 3.7294}, {"m": "5 Axis", "h": 1.7308}, {"m": "Press Brake", "h": 1.3347}]},
            {pn:"991-00824",rev:"000",desc:"DORADE ENCLOSURE, ENGINE HATCH, PEM, CORSAIR",qpb:1,sup:"Mechanical Assembly",qty:24,ops:[{"m": "Waterjet", "h": 9.0428}, {"m": "Deburr", "h": 4.2367}, {"m": "Mill Op 3", "h": 1.2081}, {"m": "Manual Mill", "h": 1.47}, {"m": "Press Brake", "h": 6.1539}, {"m": "Lathe", "h": 1.4083}]},
            {pn:"991-00849",rev:"000",desc:"BRACKET, POE VERTICAL MOUNT, ELECTRONICS CABINET, PEM",qpb:1,sup:"Mechanical Assembly",qty:20,ops:[{"m": "Waterjet", "h": 4.9331}, {"m": "Deburr", "h": 1.3344}, {"m": "Mill Op 3", "h": 3.2686}, {"m": "Manual Mill", "h": 1.4214}, {"m": "Press Brake", "h": 2.9872}]},
            {pn:"991-00853",rev:"002",desc:"ASSEMBLY, PLATE, LIFT POINT ACCESS, PORT, PEM",qpb:1,sup:"Mechanical Assembly",qty:27,ops:[{"m": "Waterjet", "h": 1.8872}, {"m": "Deburr", "h": 4.2789}, {"m": "Mill Op 3", "h": 2.7394}, {"m": "Manual Mill", "h": 1.4244}, {"m": "Press Brake", "h": 3.3667}]},
            {pn:"991-00861",rev:"000",desc:"ASSEMBLY, PLATE, STUD, M6x30, MULTI",qpb:1,sup:"Mechanical Assembly",qty:80,ops:[{"m": "Waterjet", "h": 4.2425}, {"m": "Deburr", "h": 9.2183}, {"m": "Programming", "h": 0.5631}, {"m": "Mill Op 3", "h": 0.8336}, {"m": "Press Brake", "h": 9.365}]},
            {pn:"991-00870",rev:"000",desc:"SHELF, 1U, E-CABINET, S2, PEM, CORSAIR V2",qpb:1,sup:"Mechanical Assembly",qty:80,ops:[{"m": "Waterjet", "h": 23.9508}, {"m": "Deburr", "h": 3.5}, {"m": "Saw", "h": 5.1617}, {"m": "5 Axis", "h": 1.2167}, {"m": "Press Brake", "h": 4.6767}]},
            {pn:"991-00876",rev:"000",desc:"ASSEMBLY, PEM, SHROUD, VOLVO, HYDRAULIC MODULE",qpb:1,sup:"Mechanical Assembly",qty:20,ops:[{"m": "Waterjet", "h": 3.5619}, {"m": "Deburr", "h": 2.0839}, {"m": "Mill Op 3", "h": 1.0}, {"m": "Manual Mill", "h": 3.2283}, {"m": "Press Brake", "h": 11.9961}, {"m": "Lathe", "h": 2.9969}]},
            {pn:"991-00898",rev:"000",desc:"ASSEMBLY, BRACKET, BATTERY, RETAINMENT",qpb:3,sup:"Mechanical Assembly",qty:null,ops:[]},
            {pn:"991-00910",rev:"001",desc:"*QI ASSEMBLY, EXPANSION CORE",qpb:1,sup:"Sub-Assembly",qty:null,ops:[]},
            {pn:"991-00927",rev:"000",desc:"ASSEMBLY, HINGE, PAYLOAD HATCH, CORSAIR",qpb:2,sup:"Mechanical Assembly",qty:null,ops:[]},
            {pn:"991-00948",rev:"000",desc:"ASSEMBLY, BASE WITH HELICOILS, ENCLOSURE, CRADLEPOINT",qpb:1,sup:"Mechanical Assembly",qty:6,ops:[{"m": "Programming", "h": 4.7439}, {"m": "Saw", "h": 4.2019}, {"m": "Mill Op 2", "h": 13.1872}, {"m": "Lathe", "h": 2.0}]},
            {pn:"991-00954",rev:"000",desc:"BRACKET, IRIDIUM, THALES, PIDC, PEM",qpb:1,sup:"Mechanical Assembly",qty:null,ops:[{"m": "Waterjet", "h": 2.7}, {"m": "Deburr", "h": 3.4336}, {"m": "Mill Op 3", "h": 2.0}, {"m": "Manual Mill", "h": 1.0}, {"m": "Press Brake", "h": 2.1808}]},
        ];
        seeds.forEach(function(s) {
            if (existing[s.pn]) {
                var ep = existing[s.pn];
                if (corsairId.length && ep.productIds && corsairId[0] && ep.productIds.indexOf(corsairId[0]) === -1) ep.productIds = ep.productIds.concat(corsairId);
                if (!ep.inHouse && s.ops.length > 0) ep.inHouse = {qtyRan:s.qty,operations:s.ops.map(function(o){return {id:generateId(),machine:o.m,hours:o.h,ratePerHour:0};}),laborOperations:[],rawMaterials:[]};
            } else {
                var pt = {id:generateId(),partNumber:s.pn,rev:s.rev,description:s.desc,unitOfMeasure:'ea',qpb:s.qpb,currentSupplier:s.sup,currentPoNumber:'',currentUnitCost:0,currentQtyPurchased:null,aliases:[],supersedesPartId:null,productIds:corsairId.slice(),rfqs:[],inHouse:null};
                if (s.ops.length > 0) pt.inHouse = {qtyRan:s.qty,operations:s.ops.map(function(o){return {id:generateId(),machine:o.m,hours:o.h,ratePerHour:0};}),laborOperations:[],rawMaterials:[]};
                app.data.costAnalysis.parts.push(pt);
            }
        });
        saveData();
    }

    function _seedRawMaterials() {
        if (app.data.costAnalysis._rawMatsSeeded) return;
        app.data.costAnalysis._rawMatsSeeded = true;
        var existing = new Set((app.data.costAnalysis.rawMaterials || []).map(function(m){ return m.partNumber; }));
        var seed = [
            {pn:'110-00003', desc:'Raw Material - Bar, Round, Aluminum, 6061, 2 IN',                        uom:'in',    cost:1.17},
            {pn:'110-00005', desc:'TUBE, ROUND, SEAMLESS, 1.25IN, .083IN THK, 316 SS',                     uom:'in',    cost:3.11},
            {pn:'110-00026', desc:'Raw Material - Bar, Round, 316 SS, .75 IN',                              uom:'in',    cost:0.69},
            {pn:'110-00027', desc:'Raw Material - Bar, Round, 316 SS, 3.75 IN',                             uom:'in',    cost:26.73},
            {pn:'110-00031', desc:'RAW MATERIAL - L-Track, HEAVY DUTY, AL 7075, 1.36 IN x .53 IN',         uom:'in',    cost:3.37},
            {pn:'110-00044', desc:'Raw Material - Bar, 316 SS, 0.5 IN x 1 IN',                             uom:'in',    cost:0},
            {pn:'120-00001', desc:'Raw Material - Sheet, Aluminum, 5052, .09 IN',                          uom:'sq in', cost:0.02},
            {pn:'120-00002', desc:'Raw Material - Sheet, Aluminum, 5052, .187 IN',                         uom:'sq in', cost:0.05},
            {pn:'120-00003', desc:'Raw Material - Sheet, Aluminum, 6061, .250 IN',                         uom:'sq in', cost:0.13},
            {pn:'120-00004', desc:'Raw Material - Sheet, Aluminum, 6061, .125 IN',                         uom:'sq in', cost:0.05},
            {pn:'120-00006', desc:'Raw Material - Sheet, Aluminum, 6061, .187 IN',                         uom:'sq in', cost:0.09},
            {pn:'120-00007', desc:'Raw Material - Sheet, SS, 316L, .250 IN',                               uom:'sq in', cost:0.23},
            {pn:'120-00008', desc:'Raw Material - Sheet, Aluminum, 5052, .063 IN',                         uom:'sq in', cost:0.02},
            {pn:'120-00009', desc:'Raw Material - Sheet, Aluminum, 5052, .125 IN',                         uom:'sq in', cost:0.03},
            {pn:'120-00010', desc:'Raw Material - Sheet, SS, 304, 0.06IN',                                 uom:'sq in', cost:0.04},
            {pn:'120-00011', desc:'Raw Material - Sheet, Aluminum, 6061, .09 IN',                          uom:'sq in', cost:1.58},
            {pn:'120-00012', desc:'Raw Material - Sheet, SS, 304, .125 IN',                                uom:'sq in', cost:0.15},
            {pn:'120-00013', desc:'Raw Material - Sheet, Aluminum, 5052, .25 IN',                          uom:'sq in', cost:0.08},
            {pn:'120-00018', desc:'RAW MATERIAL - SHEET, CS A36, .50 IN',                                  uom:'sq in', cost:0.07},
            {pn:'120-00019', desc:'RAW MATERIAL - SHEET, SS 304, .19 IN',                                  uom:'sq in', cost:0.11},
            {pn:'120-00025', desc:'Raw Material - Sheet, SS, 316, .05 IN',                                 uom:'sq in', cost:0},
            {pn:'130-00005', desc:'Raw Material - Bar, Aluminum, 6061, 3.50 IN x 2.50 IN',                uom:'in',    cost:4.57},
            {pn:'130-00006', desc:'Raw Material - Bar, Aluminum, 6061, 3 IN x 2 IN',                      uom:'in',    cost:1.97},
            {pn:'130-00009', desc:'Raw Material - Bar, Aluminum, 6061, 4.5 IN x .75 IN',                  uom:'in',    cost:1.98},
            {pn:'130-00012', desc:'Raw Material - Bar, Aluminum, 6061, 2 IN x 1 IN',                      uom:'in',    cost:0.90},
            {pn:'130-00013', desc:'Raw Material - Bar, SS 316, 2.5 IN x 1 IN',                            uom:'in',    cost:6.29},
            {pn:'130-00015', desc:'Raw Material - Bar, Aluminum, 6061, 3.5 IN x .50 IN',                  uom:'in',    cost:1.11},
            {pn:'130-00016', desc:'BAR, AL 6061, 3.5 IN x 3.5 IN',                                        uom:'in',    cost:4.59},
            {pn:'130-00018', desc:'RAW MATERIAL - BAR, ALUMINUM, 6061, 1 IN x .50 IN',                    uom:'in',    cost:0.25},
            {pn:'130-00022', desc:'Raw Material - Bar, SS 316 CR, 5 IN x .50 IN',                         uom:'in',    cost:5.50},
            {pn:'150-00006', desc:'*LS TUBING, SOFT, .5IN ID, .6875IN OD, PVC',                           uom:'in',    cost:0.43},
            {pn:'150-00020', desc:'*LS TUBING, FLEXIBLE, 4 IN ID, 4.375 OD, PP',                          uom:'in',    cost:0.74},
            {pn:'150-00022', desc:'*LS RAW MATERIAL - RUBBER, .125IN THICK, 2IN WIDE, REINFORCED EPDM',   uom:'in',    cost:1.01},
            {pn:'150-00023', desc:'*LS HOSE, -8AN, .45IN ID, .65IN OD, NYLON BRAIDED, VITON',             uom:'in',    cost:0.66},
            {pn:'150-00024', desc:'HOSE, -6AN, .35IN ID, .55IN OD, NYLON BRAIDED, VITON',                 uom:'in',    cost:0.61},
            {pn:'150-00025', desc:'*LS HOSE, 2IN ID, MARINE TYPE A2 FUEL HOSE, USCG',                     uom:'in',    cost:3.44},
            {pn:'150-00026', desc:'*LS HOSE, -12AN, .70IN ID, .96IN OD, NYLON BRAIDED, VITON',            uom:'in',    cost:0.93},
            {pn:'150-00033', desc:'*LS GASKET, D-SHAPE, RUBBER SEAL, .75INx.75IN',                        uom:'ea',    cost:0.19},
            {pn:'150-00056', desc:'RAW MATERIAL - RUBBER, .125IN THICK, REINFORCED EPDM 60 DUROMETER',    uom:'sq in', cost:0.10},
            {pn:'150-00062', desc:'*LS HOSE, 1IN ID, 1.375IN OD, SILICONE RUBBER',                        uom:'in',    cost:0},
            {pn:'150-00065', desc:'Raw Material - Tube RD, PVC, 3.5 IN OD, .22 IN WT',                    uom:'in',    cost:0},
            {pn:'150-00066', desc:'ROLL, FIBERGLASS, 60 IN, E-BXM 2408',                                   uom:'sq ft', cost:0.26},
            {pn:'150-00067', desc:'ROLL, FIBERGLASS, 60 IN, E-QXCFM 3515',                                 uom:'sq ft', cost:8.84},
            {pn:'150-00068', desc:'ROLL, FIBERGLASS, 60 IN, E-QXCFM 5615',                                 uom:'sq ft', cost:5.50},
            {pn:'150-00069', desc:'ROLL, FIBERGLASS, 12.5 IN, E-LT 2400',                                  uom:'sq ft', cost:0},
            {pn:'160-00006', desc:'Raw Material - Sheet, COOSA, .50 IN',                                   uom:'sq in', cost:0.07},
            {pn:'160-00007', desc:'Raw Material - Sheet, COOSA, 1 IN',                                     uom:'sq in', cost:0.06},
            {pn:'160-00009', desc:'Sheet, Plastic, HDPE MG, 1 IN',                                         uom:'sq in', cost:0.14},
            {pn:'160-00012', desc:'Raw material - Sheet, Rubber, 60A, .125 IN',                            uom:'sq in', cost:0.10},
            {pn:'160-00014', desc:'RAW MATERIAL - SHEET, SILICONE RUBBER, .06 IN',                         uom:'sq in', cost:0.13},
            {pn:'160-00018', desc:'RAW MATERIAL - SHEET, NEOPRENE RUBBER, ADHESIVE BACK, 50A, .016 IN',   uom:'sq in', cost:0.08},
            {pn:'160-00019', desc:'RAW MATERIAL - SHEET, AQUASTEEL, .50 IN',                               uom:'sq in', cost:0.08},
            {pn:'160-00031', desc:'RAW MATERIAL - SHEET, AQUASTEEL, .38 IN',                               uom:'sq in', cost:0.29},
            {pn:'160-00032', desc:'RAW MATERIAL - SHEET, AQUASTEEL, .75 IN',                               uom:'sq in', cost:0}
        ];
        var added = 0;
        seed.forEach(function(s) {
            if (existing.has(s.pn)) return;
            app.data.costAnalysis.rawMaterials.push({
                id: generateId(),
                partNumber: s.pn,
                description: s.desc,
                uom: s.uom,
                costPerUom: s.cost,
                supplier: '',
                notes: ''
            });
            added++;
        });
        if (added > 0) saveData();
    }

    function _seedMirageParts() {
        if (app.data.costAnalysis._miragePartsSeeded) return;
        app.data.costAnalysis._miragePartsSeeded = true;

        // Find Mirage product ID
        var prods = app.data.products || [];
        var mirageProd = prods.find(function(p) { return p.name && p.name.toLowerCase().indexOf('mirage') !== -1; });
        var mirageIds = mirageProd ? [mirageProd.id] : [];

        var existing = new Set((app.data.costAnalysis.parts || []).map(function(p) { return p.partNumber; }));

        var seed = [
            {pn:'NA-MIR-001', desc:'MIRAGE FUEL HITL BASE_1',                                       qpb:1,  cost:859.60, po:'14921'},
            {pn:'NA-MIR-002', desc:'MIRAGE FUEL HITL BASE_2',                                       qpb:1,  cost:886.80, po:'14921'},
            {pn:'NA-MIR-003', desc:'MIRAGE FUEL HITL BASE_3',                                       qpb:2,  cost:284.80, po:'14921'},
            {pn:'NA-MIR-004', desc:'MIRAGE FUEL HITL BASE_4',                                       qpb:2,  cost:141.80, po:'14921'},
            {pn:'NA-MIR-005', desc:'MIRAGE FUEL HITL BASE_5',                                       qpb:2,  cost:199.20, po:'14921'},
            {pn:'NA-MIR-006', desc:'MIRAGE FUEL HITL FILTER HOLD_1',                                qpb:1,  cost:418.80, po:'14921'},
            {pn:'NA-MIR-007', desc:'MIRAGE FUEL HITL L Support',                                    qpb:6,  cost:328.80, po:'14921'},
            {pn:'472-00630',  desc:'Middle plate for electronics integration in Mirage engine bay',  qpb:4,  cost:796.92, po:'15543'},
            {pn:'472-00621',  desc:'Battery Tray on STBD side in Mirage engine bay',                qpb:4,  cost:861.83, po:'15543'},
            {pn:'472-00633',  desc:'FWD plate for electronics integration in Mirage Engine Bay',     qpb:4,  cost:885.43, po:'15543'},
            {pn:'472-00619',  desc:'Front Battery Tray in Mirage Engine Bay',                        qpb:4,  cost:861.83, po:'15543'},
            {pn:'472-00657',  desc:'Support gusset for aft plate in Mirage engine bay',              qpb:4,  cost:97.78,  po:'15543'},
            {pn:'472-00658',  desc:'Support gusset for middle plate in Mirage engine bay',           qpb:4,  cost:97.78,  po:'15543'},
            {pn:'415-00913',  desc:'PLATE, NARROW, VERTICAL BOLTED INTERFACE, ENGINE BAY, MIRAGE',  qpb:8,  cost:459.00, po:'14921'},
            {pn:'472-00631',  desc:'PLATE, LONG, VERTICAL BOLTED INTERFACE, ENGINE BAY',            qpb:4,  cost:541.80, po:'14921'},
            {pn:'472-00632',  desc:'PLATE, SHORT, VERTICAL BOLTED INTERFACE, ENGINE BAY',           qpb:4,  cost:472.80, po:'14921'},
            {pn:'417-00196',  desc:'SPACER, VOLVO ENGINE MOUNT DRILL JIG, MIRROR',                  qpb:1,  cost:661.20, po:'14921'},
            {pn:'417-00165',  desc:'BORE ALIGNMENT PLATE VOLVO ENGINE MOUNT DRILL JIG',             qpb:2,  cost:677.70, po:'14921'},
            {pn:'417-00195',  desc:'SPACER, VOLVO ENGINE MOUNT DRILL JIG',                          qpb:1,  cost:661.20, po:'15049'},
            {pn:'472-00648',  desc:'PLATE, GEARBOX BOLT MOUNT, 17_4 SS',                            qpb:5,  cost:55.10,  po:'15049'},
            {pn:'472-00649',  desc:'PLATE, SIDE STIFFENER, GEARBOX, 17_4 SS',                      qpb:10, cost:33.70,  po:'15049'},
            {pn:'472-00650',  desc:'PLATE, HORIZONTAL MOUNT, GEARBOX, 17_4 SS',                     qpb:5,  cost:45.90,  po:'15049'},
            {pn:'NA-MIR-008', desc:'3" x 5" Rectangular Blank',                                     qpb:4,  cost:47.40,  po:'15049'},
            {pn:'473-00187',  desc:'WELDMENT, SKID, ECAB, MIRAGE',                                  qpb:1,  cost:0,      po:''},
            {pn:'472-00643',  desc:'SHEET METAL, RISER, STBD, ECAB, MIRAGE',                        qpb:2,  cost:123.10, po:'15088'},
            {pn:'472-00644',  desc:'SHEET METAL, RISER, PORT, ECAB, MIRAGE',                        qpb:2,  cost:123.10, po:'15088'},
            {pn:'472-00645',  desc:'GUSSET, SMALL, SKID, ECAB, MIRAGE',                             qpb:4,  cost:53.40,  po:'15088'},
            {pn:'472-00646',  desc:'GUSSET, LARGE, SKID, ECAB, MIRAGE',                             qpb:4,  cost:54.00,  po:'15088'},
            {pn:'472-00647',  desc:'PLATE, AFT, SKID, ECAB, MIRAGE',                                qpb:2,  cost:153.10, po:'15088'},
            {pn:'472-00651',  desc:'PLATE, FORE, PORT, SKID, ECAB, MIRAGE',                         qpb:2,  cost:107.00, po:'15088'},
            {pn:'472-00652',  desc:'PLATE, FORE, STBD, SKID, ECAB, MIRAGE',                         qpb:2,  cost:107.00, po:'15088'},
            {pn:'472-00653',  desc:'SHEET METAL, AFT MOUNT, SYSTEL, ECAB, MIRAGE',                  qpb:2,  cost:135.30, po:'15088'},
            {pn:'472-00654',  desc:'LIFT LUG, SKID, ECAB, MIRAGE',                                  qpb:8,  cost:47.20,  po:'15088'},
            {pn:'473-00181',  desc:'TUBE, WELDMENT, SKID, ECAB, MIRAGE',                            qpb:2,  cost:592.50, po:'15088'},
            {pn:'472-00660',  desc:'BASE PLATE, HOTEL BATTERY MOUNT, MIRAGE',                       qpb:8,  cost:90.70,  po:'15049'},
            {pn:'472-00659',  desc:'GUSSET, HOTEL BATTERY MOUNT, MIRAGE',                           qpb:32, cost:28.70,  po:'15049'},
            {pn:'NA-MIR-009', desc:'BATTERY SUPPORT PLATE, HOTEL BATTERY MOUNT, MIRAGE',            qpb:8,  cost:84.60,  po:'15049'}
        ];

        var added = 0;
        seed.forEach(function(s) {
            if (existing.has(s.pn)) return;
            app.data.costAnalysis.parts.push({
                id: generateId(),
                partNumber: s.pn,
                rev: '',
                description: s.desc,
                unitOfMeasure: 'ea',
                qpb: s.qpb,
                currentSupplier: '',
                currentPoNumber: s.po,
                currentUnitCost: s.cost,
                currentQtyPurchased: null,
                aliases: [],
                supersedesPartId: null,
                productIds: mirageIds.slice(),
                rfqs: [],
                inHouse: null
            });
            added++;
        });

        if (added > 0) saveData();
    }


    function _seedCorsairHingeParts() {
        if (app.data.costAnalysis._corsairHingeSeeded) return;
        app.data.costAnalysis._corsairHingeSeeded = true;

        var prods = app.data.products || [];
        var corsairProd = prods.find(function(p) { return p.name && p.name.toLowerCase().indexOf('corsair') !== -1; });
        var corsairIds = corsairProd ? [corsairProd.id] : [];

        var existing = new Set((app.data.costAnalysis.parts || []).map(function(p) { return p.partNumber; }));

        var seed = [
            {pn:'415-00504', desc:'HINGE, TOP BRACKET, QUICK PIN, PAYLOAD HATCH',                    qpb:2},
            {pn:'415-00673', desc:'HINGE, BASE, EXTENDED, TALL, PAYLOAD HATCH',                       qpb:2},
            {pn:'415-00674', desc:'HINGE, BASE, QUICK PIN, 1IN SPACER, PAYLOAD HATCH, CORSAIR',       qpb:2},
            {pn:'419-00025', desc:'PAD, HINGE, LINKAGE, SMALL, RUBBER',                               qpb:4},
            {pn:'419-00026', desc:'PAD, HINGE, LINKAGE, LARGE, RUBBER',                               qpb:2},
            {pn:'472-00508', desc:'LINK, HINGE, SMALL, PAYLOAD HATCH',                                qpb:4},
            {pn:'472-00509', desc:'LINK, HINGE, LARGE, SIDE, PAYLOAD HATCH',                          qpb:4},
            {pn:'472-00510', desc:'LINK, HINGE, PIN, CENTER, PAYLOAD HATCH',                          qpb:2},
            {pn:'991-00895', desc:'LINK, HINGE, GAS STRUT, CENTER, PRESS FIT, PAYLOAD HATCH',         qpb:2},
            {pn:'415-00669', desc:'STANDOFF, HINGE, GAS STRUT, PAYLOAD HATCH',                        qpb:2},
            {pn:'472-00511', desc:'LINK, HINGE, GAS STRUT, FLAT, PAYLOAD HATCH',                      qpb:2}
        ];

        var added = 0;
        seed.forEach(function(s) {
            if (existing.has(s.pn)) return;
            (app.data.costAnalysis.parts || []).push({
                id: generateId(),
                partNumber: s.pn,
                rev: '',
                description: s.desc,
                commodity: 'MTS Mechanical',
                unitOfMeasure: 'ea',
                qpb: s.qpb,
                currentSupplier: '',
                currentPoNumber: '',
                currentUnitCost: 0,
                currentQtyPurchased: null,
                aliases: [],
                supersedesPartId: null,
                productIds: corsairIds.slice(),
                rfqs: [],
                inHouse: null
            });
            added++;
        });

        if (added > 0) saveData();
    }

    // Initialize empty inHouse structures on all Corsair parts that currently have
    // inHouse: null so they appear in the cost analysis tool and ops can be entered.
    // Skips 438-series (screws) and 445-series (washers) per user request.
    function _initCorsairInHouseStructures() {
        if (app.data.costAnalysis._corsairInHouseInitialized) return;
        app.data.costAnalysis._corsairInHouseInitialized = true;

        var parts = app.data.costAnalysis.parts || [];
        var changed = 0;

        parts.forEach(function(p) {
            if (p.inHouse !== null && p.inHouse !== undefined) return;
            var pn = (p.partNumber || '').trim();
            if (/^438-/i.test(pn)) return;   // screws/hardware — skip per user
            if (/^445-/i.test(pn)) return;   // washers/hardware — skip per user
            if (/^NA-MIR-/i.test(pn)) return; // Mirage-only custom items — skip

            p.inHouse = {
                qtyRan: 0,
                operations: [],
                laborOperations: [],
                rawMaterialId: null,
                usedPerPart: null,
                materialQtyBought: null,
                overheadPct: 0
            };
            changed++;
        });

        if (changed > 0) saveData();
    }

    function _seedPO8427() {
        if (app.data.costAnalysis._po8427Seeded) return;
        app.data.costAnalysis._po8427Seeded = true;

        var poData = [
            {pn:'415-00504', cost:105.60, qty:40},
            {pn:'415-00674', cost:110.40, qty:40},
            {pn:'415-00673', cost:105.60, qty:40},
            {pn:'472-00508', cost:72.00,  qty:80},
            {pn:'472-00509', cost:82.80,  qty:80},
            {pn:'472-00510', cost:85.20,  qty:40},
            {pn:'415-00669', cost:52.80,  qty:40},
            {pn:'472-00511', cost:75.60,  qty:40},
            {pn:'419-00025', cost:2.58,   qty:80},
            {pn:'419-00026', cost:11.45,  qty:40}
        ];

        var parts = app.data.costAnalysis.parts || [];
        var changed = false;

        poData.forEach(function(d) {
            var part = parts.find(function(p) { return p.partNumber === d.pn; });
            if (!part) return;

            // If the part already has a different supplier, rescue that data as a PO entry
            // before overwriting the primary fields
            if (part.currentSupplier && part.currentSupplier !== 'Hadrian Automation, Inc.') {
                if (!part.purchaseOrders) part.purchaseOrders = [];
                var existingPO = part.currentPoNumber;
                var alreadySaved = part.purchaseOrders.find(function(po) {
                    return existingPO ? po.poNumber === existingPO : po.supplier === part.currentSupplier;
                });
                if (!alreadySaved) {
                    part.purchaseOrders.push({
                        id: generateId(),
                        poNumber: part.currentPoNumber || '',
                        supplier: part.currentSupplier,
                        unitCost: part.currentUnitCost || 0,
                        qty: part.currentQtyPurchased || null,
                        date: '',
                        notes: 'Preserved from primary fields during PO 8427 import'
                    });
                }
            }

            // Update primary supplier/cost fields
            part.currentSupplier = 'Hadrian Automation, Inc.';
            part.currentPoNumber = '8427';
            part.currentUnitCost = d.cost;
            part.currentQtyPurchased = d.qty;

            // Add PO entry (avoid duplicates)
            if (!part.purchaseOrders) part.purchaseOrders = [];
            var already = part.purchaseOrders.find(function(po) { return po.poNumber === '8427'; });
            if (!already) {
                part.purchaseOrders.push({
                    id: generateId(),
                    poNumber: '8427',
                    supplier: 'Hadrian Automation, Inc.',
                    unitCost: d.cost,
                    qty: d.qty,
                    date: '2025-07-29',
                    notes: '3-boat set order; line qty shown is per-set qty'
                });
            }
            changed = true;
        });

        if (changed) saveData();
    }

    function _seedAPEQuote030326() {
        if (app.data.costAnalysis._apeQuote030326Seeded) return;
        app.data.costAnalysis._apeQuote030326Seeded = true;

        var prods = app.data.products || [];
        var corsairProd = prods.find(function(p) { return p.name && p.name.toLowerCase().indexOf('corsair') !== -1; });
        var corsairIds = corsairProd ? [corsairProd.id] : [];

        var parts = app.data.costAnalysis.parts || [];
        var existing = new Set(parts.map(function(p) { return p.partNumber; }));

        // Quote 030326-01, American Precision Engineering, dated 3/3/26
        // All parts are for Corsair. QTY 10 is order quantity; QPB = 1 per boat.
        var seed = [
            { pn: '415-00708', desc: 'CARRIAGE, PAYLOAD RAIL SYSTEM, CORSAIR',                        cost: 967.89  },
            { pn: '415-00710', desc: 'PLATE, FRONT BULKHEAD, 1/2" THICK STEEL, PAYLOAD SIMULATOR',    cost: 482.97  },
            { pn: '415-00711', desc: 'PLATE, FRONT BULKHEAD, 3/8" THICK STEEL, PAYLOAD SIMULATOR',    cost: 386.68  },
            { pn: '415-00713', desc: 'PLATE, FRONT BULKHEAD, 3/8" THICK STEEL, PAYLOAD SIMULATOR',    cost: 386.68  },
            { pn: '415-00714', desc: 'PLATE, REAR BULKHEAD, 1/2" THICK STEEL, PAYLOAD SIMULATOR',     cost: 201.13  },
            { pn: '415-00716', desc: 'PLATE, PAYLOAD LIFT, FORWARD, CORSAIR',                         cost: 181.42  },
            { pn: '415-00718', desc: 'PLATE, REAR BULKHEAD, 3/8" THICK STEEL, PAYLOAD SIMULATOR',     cost: 155.45  },
            { pn: '415-00721', desc: 'PLATE, WEIGHT STACK SUPPORT, CORSAIR PAYLOAD SIMULATOR',        cost: 335.62  }
        ];

        var added = 0;
        seed.forEach(function(s) {
            var part;
            if (existing.has(s.pn)) {
                // Part already exists — add the APE quote as a PO record and update primary fields
                part = parts.find(function(p) { return p.partNumber === s.pn; });
                if (!part) return;
                if (!part.purchaseOrders) part.purchaseOrders = [];
                var alreadyHasQuote = part.purchaseOrders.find(function(po) { return po.poNumber === '030326-01'; });
                if (!alreadyHasQuote) {
                    part.purchaseOrders.push({
                        id: generateId(),
                        poNumber: '030326-01',
                        supplier: 'American Precision Engineering',
                        unitCost: s.cost,
                        qty: 10,
                        date: '2026-03-03',
                        notes: 'Quote 030326-01 — Price valid 5 days, FOB APE Shop, Net 30'
                    });
                }
                part.currentSupplier     = 'American Precision Engineering';
                part.currentPoNumber     = '030326-01';
                part.currentUnitCost     = s.cost;
                part.currentQtyPurchased = 10;
                added++;
                return;
            }

            // New part — create it fully populated
            part = {
                id:                  generateId(),
                partNumber:          s.pn,
                rev:                 '',
                description:         s.desc,
                commodity:           '',
                unitOfMeasure:       'ea',
                qpb:                 1,
                currentSupplier:     'American Precision Engineering',
                currentPoNumber:     '030326-01',
                currentUnitCost:     s.cost,
                currentQtyPurchased: 10,
                aliases:             [],
                supersedesPartId:    null,
                productIds:          corsairIds.slice(),
                rfqs:                [],
                purchaseOrders:      [{
                    id:       generateId(),
                    poNumber: '030326-01',
                    supplier: 'American Precision Engineering',
                    unitCost: s.cost,
                    qty:      10,
                    date:     '2026-03-03',
                    notes:    'Quote 030326-01 — Price valid 5 days, FOB APE Shop, Net 30'
                }],
                inHouse: null
            };
            parts.push(part);
            existing.add(s.pn);
            added++;
        });

        if (added > 0) saveData();
    }

    function _seedGretnaQuote2456() {
        if (app.data.costAnalysis._gretnaQuote2456Seeded) return;
        app.data.costAnalysis._gretnaQuote2456Seeded = true;

        var prods = app.data.products || [];
        var corsairProd = prods.find(function(p) { return p.name && p.name.toLowerCase().indexOf('corsair') !== -1; });
        var corsairIds = corsairProd ? [corsairProd.id] : [];

        var parts = app.data.costAnalysis.parts || [];
        var existing = new Set(parts.map(function(p) { return p.partNumber; }));

        // Gretna Machine Shop — Quote 2456-5, 03/03/2026, expires 03/06/2026
        // Lead time: 55 business days (4-5 weeks), Material: Aluminum 6061-T6
        // Qty ordered represents a multi-boat batch; QPB = 1 for all adapters/blocks
        var seed = [
            { pn: '415-00737', rev: '001', desc: 'ADAPTER, PAYLOAD RAIL, AFT PORT, CORSAIR',      cost: 498.63, qty: 80  },
            { pn: '415-00738', rev: '001', desc: 'ADAPTER, PAYLOAD RAIL, AFT STBD, CORSAIR',      cost: 498.63, qty: 80  },
            { pn: '415-00735', rev: '001', desc: 'ADAPTER, PAYLOAD RAIL, FORWARD PORT, CORSAIR',  cost: 885.60, qty: 80  },
            { pn: '415-00736', rev: '001', desc: 'ADAPTER, PAYLOAD RAIL, FORWARD STBD, CORSAIR',  cost: 885.60, qty: 80  },
            { pn: '415-00856', rev: '000', desc: 'BLOCK, IMPACT SENSOR MOUNT',                    cost: 205.18, qty: 200 }
        ];

        var poNotes = 'Quote 2456-5 — RFQ: URGENT Parts RFQ, expires 03/06/2026, lead time 55 business days, Aluminum 6061-T6';

        var added = 0;
        seed.forEach(function(s) {
            var part;
            if (existing.has(s.pn)) {
                // Part exists — add Gretna as an RFQ and update primary fields
                part = parts.find(function(p) { return p.partNumber === s.pn; });
                if (!part) return;
                if (!part.rfqs) part.rfqs = [];
                var alreadyHasRfq = part.rfqs.find(function(r) { return r.quoteRef === '2456-5' && r.supplier === 'Gretna Machine Shop, Inc.'; });
                if (!alreadyHasRfq) {
                    part.rfqs.push({
                        id:           generateId(),
                        supplier:     'Gretna Machine Shop, Inc.',
                        quoteRef:     '2456-5',
                        unitCost:     s.cost,
                        leadTimeDays: 55,
                        moq:          0,
                        validUntil:   '2026-03-06',
                        notes:        poNotes
                    });
                }
                // Update primary fields to reflect this quote
                if (!part.purchaseOrders) part.purchaseOrders = [];
                var alreadyHasPO = part.purchaseOrders.find(function(po) { return po.poNumber === '2456-5'; });
                if (!alreadyHasPO) {
                    part.purchaseOrders.push({
                        id:       generateId(),
                        poNumber: '2456-5',
                        supplier: 'Gretna Machine Shop, Inc.',
                        unitCost: s.cost,
                        qty:      s.qty,
                        date:     '2026-03-03',
                        notes:    poNotes
                    });
                }
                part.currentSupplier     = 'Gretna Machine Shop, Inc.';
                part.currentPoNumber     = '2456-5';
                part.currentUnitCost     = s.cost;
                part.currentQtyPurchased = s.qty;
                if (s.rev && !part.rev) part.rev = s.rev;
                added++;
                return;
            }

            // New part — create fully populated
            part = {
                id:                  generateId(),
                partNumber:          s.pn,
                rev:                 s.rev,
                description:         s.desc,
                commodity:           '',
                unitOfMeasure:       'ea',
                qpb:                 1,
                currentSupplier:     'Gretna Machine Shop, Inc.',
                currentPoNumber:     '2456-5',
                currentUnitCost:     s.cost,
                currentQtyPurchased: s.qty,
                aliases:             [],
                supersedesPartId:    null,
                productIds:          corsairIds.slice(),
                rfqs: [{
                    id:           generateId(),
                    supplier:     'Gretna Machine Shop, Inc.',
                    quoteRef:     '2456-5',
                    unitCost:     s.cost,
                    leadTimeDays: 55,
                    moq:          0,
                    validUntil:   '2026-03-06',
                    notes:        poNotes
                }],
                purchaseOrders: [{
                    id:       generateId(),
                    poNumber: '2456-5',
                    supplier: 'Gretna Machine Shop, Inc.',
                    unitCost: s.cost,
                    qty:      s.qty,
                    date:     '2026-03-03',
                    notes:    poNotes
                }],
                inHouse: null
            };
            parts.push(part);
            existing.add(s.pn);
            added++;
        });

        if (added > 0) saveData();
    }

    function _seedPayloadRailSystem() {
        if (app.data.costAnalysis._payloadRailSeeded) return;
        app.data.costAnalysis._payloadRailSeeded = true;

        var PARTS = [
            {pn:'438-00416', desc:'*LS SCREW, M6x30, 1, 316 SS',                                          commodity:'Hardware'},
            {pn:'450-00029', desc:'BEARING, LINEAR, CARRIGE, 23 MM RAIL',                                  commodity:'Hardware'},
            {pn:'465-00061', desc:'PIN, QUICK RELEASE, BALL, 0.375 INCH, 1 INCH USEABLE LENGTH, 17-4 SS', commodity:'Hardware'},
            {pn:'415-00741', desc:'L-TRACK, HEAVY DUTY, ANODIZED, 54 IN, 7075-T6 - 40467-10-144',         commodity:'MTS Mechanical'},
            {pn:'411-00261', desc:'BOLT, M12x35, 1.75, CLASS 10.9, ZINC PLATED',                           commodity:'Hardware'},
            {pn:'438-00503', desc:'SCREW, CS, M6x35, 1.0, 316 SS',                                         commodity:'Hardware'},
            {pn:'415-00735', desc:'ADAPTER, PAYLOAD RAIL, FORWARD PORT, CORSAIR',                          commodity:'MTS Mechanical'},
            {pn:'415-00708', desc:'CARRIGE, PAYLOAD RAIL SYSTEM, CORSAIR',                                 commodity:'MTS Mechanical'},
            {pn:'438-00377', desc:'*LS SCREW, M6x12, 1, 316 SS',                                           commodity:'Hardware'},
            {pn:'415-00738', desc:'ADAPTER, PAYLOAD RAIL, AFT STBD, CORSAIR',                              commodity:'MTS Mechanical'},
            {pn:'415-00736', desc:'ADAPTER, PAYLOAD RAIL, FORWARD STBD, CORSAIR',                         commodity:'MTS Mechanical'},
            {pn:'450-00030', desc:'BEARING, LINEAR, RAIL, 23 MM RAIL',                                     commodity:'Hardware'},
            {pn:'438-00551', desc:'SCREW, Button, M3x5, .5, 18-8',                                         commodity:'Hardware'},
            {pn:'465-00064', desc:'PIN, LOCATING, 16MM OD, 8MM MOUNT DIA',                                 commodity:'Hardware'},
            {pn:'415-00737', desc:'ADAPTER, PAYLOAD RAIL, AFT PORT, CORSAIR',                              commodity:'MTS Mechanical'},
        ];

        var parts = app.data.costAnalysis.parts || [];
        var tlas   = app.data.costAnalysis.tlas  || (app.data.costAnalysis.tlas = []);
        var idMap  = {};

        // Add any parts not already in the system
        PARTS.forEach(function(s) {
            var existing = parts.find(function(p) { return p.partNumber.toLowerCase() === s.pn.toLowerCase(); });
            if (existing) { idMap[s.pn] = existing.id; return; }
            var id = generateId();
            idMap[s.pn] = id;
            parts.push({ id: id, partNumber: s.pn, rev: '', description: s.desc,
                unitOfMeasure: 'ea', qpb: 1, commodity: s.commodity,
                currentSupplier: '', currentPoNumber: '', currentUnitCost: 0,
                currentQtyPurchased: null, aliases: [], supersedesPartId: null,
                rfqs: [], inHouse: null });
        });

        // Create TLA 991-00938 if it doesn't exist
        var tla = tlas.find(function(t) { return t.partNumber === '991-00938'; });
        if (!tla) {
            tla = { id: generateId(), partNumber: '991-00938',
                name: 'ASSEMBLY, PAYLOAD INTERFACE, RAIL SYSTEM',
                description: '', revision: '', notes: '',
                items: [], createdAt: new Date().toISOString() };
            tlas.push(tla);
        }

        // Link all parts to the TLA
        PARTS.forEach(function(s) {
            var pid = idMap[s.pn];
            if (!pid) return;
            if (!tla.items.some(function(i) { return i.partId === pid; })) {
                tla.items.push({ id: generateId(), partId: pid, qtyPerTLA: 1, notes: '' });
            }
        });

        saveData();
    }


    function _seedPO12086() {
        if (app.data.costAnalysis._po12086Seeded) return;
        app.data.costAnalysis._po12086Seeded = true;

        var corsairProd = (app.data.products || []).find(function(p) { return p.name.toLowerCase().indexOf('corsair') !== -1; });
        var corsairIds = corsairProd ? [corsairProd.id] : [];

        var poData = [
            {pn:'420-00026', desc:'GASKET, ENCLOSURE, SIDE SEAL',             rev:'000', cost:2.503,  qty:640},
            {pn:'420-00027', desc:'GASKET, ENCLOSURE, MAIN SEAL',             rev:'000', cost:47.539, qty:320},
            {pn:'420-00052', desc:'*LS ORCA MOUNTING BRACKET, ANTI SLIP PAD', rev:'000', cost:6.085,  qty:1440},
            {pn:'420-00053', desc:'GASKET, E-CABINET, FORE HATCH',            rev:'000', cost:20.217, qty:320},
            {pn:'420-00054', desc:'GASKET, I/O PANEL',                        rev:'000', cost:5.742,  qty:640},
            {pn:'420-00066', desc:'GASKET, E-CABINET, AFT HATCH',             rev:'000', cost:25.652, qty:160},
            {pn:'420-00072', desc:'GASKET, ENCLOSURE, SIDE PANEL, CRADLEPOINT',      rev:'000', cost:10.572, qty:160},
            {pn:'420-00073', desc:'GASKET, BULKHEAD PANEL, ENCLOSURE, CRADLEPOINT', rev:'000', cost:8.962,  qty:320},
            {pn:'420-00082', desc:'GASKET, ENGINE HATCH DORADE ENCLOSURE, CORSAIR', rev:'000', cost:72.337, qty:320},
            {pn:'442-00018', desc:'THERMAL PAD 1, 0.5MM, VIENT',             rev:'000', cost:1.466,  qty:1920},
            {pn:'442-00019', desc:'THERMAL PAD 2, 1.5MM, VIENT',             rev:'000', cost:1.367,  qty:1120},
            {pn:'442-00028', desc:'THERMAL PAD, 0.5MM THICK, SASSB, CRADLEPOINT', rev:'000', cost:26.211, qty:160},
            {pn:'442-00031', desc:'THERMAL PAD, 1MM THICK, POE INJECTOR',    rev:'000', cost:4.348,  qty:160}
        ];

        var parts = app.data.costAnalysis.parts || [];
        var changed = false;

        poData.forEach(function(d) {
            var part = parts.find(function(p) { return p.partNumber === d.pn; });

            if (!part) {
                // Create new part
                part = {
                    id: generateId(),
                    partNumber: d.pn,
                    rev: d.rev,
                    description: d.desc,
                    commodity: '',
                    unitOfMeasure: 'ea',
                    qpb: 1,
                    currentSupplier: '51 Rapid Die-Cut',
                    currentPoNumber: '12086',
                    currentUnitCost: d.cost,
                    currentQtyPurchased: d.qty,
                    aliases: [],
                    supersedesPartId: null,
                    productIds: corsairIds,
                    rfqs: [],
                    purchaseOrders: [],
                    priceHistory: [],
                    inHouse: null
                };
                parts.push(part);
                app.data.costAnalysis.parts = parts;
            } else {
                // Preserve existing supplier data as a PO record before overwriting
                if (part.currentSupplier && part.currentSupplier !== '51 Rapid Die-Cut') {
                    if (!part.purchaseOrders) part.purchaseOrders = [];
                    var alreadySaved = part.purchaseOrders.find(function(po) {
                        return part.currentPoNumber ? po.poNumber === part.currentPoNumber : po.supplier === part.currentSupplier;
                    });
                    if (!alreadySaved && part.currentUnitCost) {
                        part.purchaseOrders.push({
                            id: generateId(),
                            poNumber: part.currentPoNumber || '',
                            supplier: part.currentSupplier,
                            unitCost: part.currentUnitCost,
                            qty: part.currentQtyPurchased || null,
                            date: '',
                            notes: 'Preserved from primary fields during PO 12086 import'
                        });
                    }
                }
                part.currentSupplier = '51 Rapid Die-Cut';
                part.currentPoNumber = '12086';
                part.currentUnitCost = d.cost;
                part.currentQtyPurchased = d.qty;
            }

            // Add PO record (avoid duplicates)
            if (!part.purchaseOrders) part.purchaseOrders = [];
            var alreadyHasPO = part.purchaseOrders.find(function(po) { return po.poNumber === '12086'; });
            if (!alreadyHasPO) {
                part.purchaseOrders.push({
                    id: generateId(),
                    poNumber: '12086',
                    supplier: '51 Rapid Die-Cut',
                    unitCost: d.cost,
                    qty: d.qty,
                    date: '2026-03-23',
                    notes: 'Corsair — PO 12086'
                });
            }
            changed = true;
        });

        if (changed) saveData();
    }

    function _seedPO9493() {
        if (app.data.costAnalysis._po9493Seeded) return;
        app.data.costAnalysis._po9493Seeded = true;

        var corsairProd = (app.data.products || []).find(function(p) { return p.name.toLowerCase().indexOf('corsair') !== -1; });
        var corsairIds = corsairProd ? [corsairProd.id] : [];

        var poData = [
            {pn:'472-00101', desc:'PLATE, FRONT PLATE, ELECTRONICS CABINET',        rev:'000', cost:182.93, qty:470},
            {pn:'472-00337', desc:'PANEL, ROXTEC BULKHEAD PLATE',                   rev:'001', cost:17.06,  qty:100},
            {pn:'472-00351', desc:'ACCESS PANEL, E CABINET, FRONT',                 rev:'000', cost:54.81,  qty:200},
            {pn:'472-00355', desc:'BRACKET, HATCH GUIDE, HORIZONTAL',               rev:'001', cost:20.46,  qty:600},
            {pn:'472-00356', desc:'BRACKET, HATCH GUIDE, VERTICAL',                 rev:'001', cost:15.55,  qty:600},
            {pn:'472-00374', desc:'BRACKET, E-CABINET FLOOR, CORSAIR',              rev:'003', cost:69.22,  qty:200},
            {pn:'472-00377', desc:'PANEL, AMPHENOL CONNECTOR, CORSAIR',             rev:'002', cost:72.12,  qty:75},
            {pn:'472-00383', desc:'PLATE, BLUESEA BUSSBAR',                         rev:'000', cost:4.4,    qty:100},
            {pn:'472-00388', desc:'BRACKET, VHF ANTENNA',                           rev:'001', cost:19.88,  qty:100},
            {pn:'472-00423', desc:'PLATE, SIM CARD ACCESS LID',                     rev:'000', cost:6.86,   qty:100},
            {pn:'472-00429', desc:'BRACKET, MOUNT, ANTENNAS, E-CAB, CORSAIR',       rev:'000', cost:38.88,  qty:100},
            {pn:'472-00430', desc:'ACCESS PANEL, AFT, E CABINET',                   rev:'000', cost:84.15,  qty:100},
            {pn:'472-00437', desc:'BRACKET, BULKHEAD CONNECTOR, SHELL SIZE 9',      rev:'001', cost:21.04,  qty:100},
            {pn:'472-00444', desc:'*LS, SHIM, FUEL TANK, .375IN THICK, AL',         rev:'000', cost:13.2,   qty:600},
            {pn:'472-00460', desc:'VOLVO ENGINE MOUNT, CORSAIR',                    rev:'000', cost:141.93, qty:200},
            {pn:'472-00480', desc:'BRACKET, PAYLOAD RAIL SUPPORT, LONG',            rev:'000', cost:58.82,  qty:200},
            {pn:'472-00481', desc:'BRACKET, PAYLOAD RAIL SUPPORT, PORT, SHORT',     rev:'000', cost:71.4,   qty:100},
            {pn:'472-00482', desc:'BRACKET, PAYLOAD RAIL SUPPORT, STBD, SHORT',     rev:'000', cost:72.1,   qty:100},
            {pn:'472-00483', desc:'PLATE, BULKHEAD PANEL, SASSB',                   rev:'000', cost:32.57,  qty:100},
            {pn:'472-00484', desc:'PLATE, BULKHEAD PANEL, SASSB, AFT',              rev:'000', cost:32.84,  qty:100},
            {pn:'472-00512', desc:'PLATE, SIDE PANEL, ENCLOSURE, CRADLEPOINT',      rev:'000', cost:2.95,   qty:100},
            {pn:'472-00513', desc:'PLATE, BULKHEAD PANEL, ENCLOSURE, CRADLEPOINT',  rev:'001', cost:34.57,  qty:100},
            {pn:'472-00514', desc:'PLATE, BULKHEAD PANEL, ENCLOSURE, CRADLEPOINT (AFT)', rev:'001', cost:31.87, qty:100},
            {pn:'473-00101', desc:'WELDMENT, GPS BRACKET',                          rev:'000', cost:66.2,   qty:100},
            {pn:'472-00361', desc:'BRACKET, STARSHIELD, INTERNAL MOUNT',            rev:'003', cost:102.25, qty:100},
            {pn:'472-00400', desc:'PLATE, CELL, ANTENNA',                           rev:'001', cost:3.31,   qty:100},
            {pn:'472-00439', desc:'BRACKET, BULKHEAD CONNECTOR, SHELL SIZE 13',     rev:'001', cost:19.56,  qty:300}
        ];

        var parts = app.data.costAnalysis.parts || [];
        var changed = false;

        poData.forEach(function(d) {
            var part = parts.find(function(p) { return p.partNumber === d.pn; });

            if (!part) {
                part = {
                    id: generateId(),
                    partNumber: d.pn,
                    rev: d.rev,
                    description: d.desc,
                    commodity: '',
                    unitOfMeasure: 'ea',
                    qpb: 1,
                    currentSupplier: 'Xometry',
                    currentPoNumber: '9493',
                    currentUnitCost: d.cost,
                    currentQtyPurchased: d.qty,
                    aliases: [],
                    supersedesPartId: null,
                    productIds: corsairIds,
                    rfqs: [],
                    purchaseOrders: [],
                    priceHistory: [],
                    inHouse: null
                };
                parts.push(part);
                app.data.costAnalysis.parts = parts;
            } else {
                if (part.currentSupplier && part.currentSupplier !== 'Xometry') {
                    if (!part.purchaseOrders) part.purchaseOrders = [];
                    var alreadySaved = part.purchaseOrders.find(function(po) {
                        return part.currentPoNumber ? po.poNumber === part.currentPoNumber : po.supplier === part.currentSupplier;
                    });
                    if (!alreadySaved && part.currentUnitCost) {
                        part.purchaseOrders.push({
                            id: generateId(),
                            poNumber: part.currentPoNumber || '',
                            supplier: part.currentSupplier,
                            unitCost: part.currentUnitCost,
                            qty: part.currentQtyPurchased || null,
                            date: '',
                            notes: 'Preserved from primary fields during PO 9493 import'
                        });
                    }
                }
                part.currentSupplier = 'Xometry';
                part.currentPoNumber = '9493';
                part.currentUnitCost = d.cost;
                part.currentQtyPurchased = d.qty;
            }

            if (!part.purchaseOrders) part.purchaseOrders = [];
            var alreadyHasPO = part.purchaseOrders.find(function(po) { return po.poNumber === '9493'; });
            if (!alreadyHasPO) {
                part.purchaseOrders.push({
                    id: generateId(),
                    poNumber: '9493',
                    supplier: 'Xometry',
                    unitCost: d.cost,
                    qty: d.qty,
                    date: '2026-03-23',
                    notes: 'Corsair — PO 9493'
                });
            }
            changed = true;
        });

        if (changed) saveData();
    }

    function _seedPO9622() {
        if (app.data.costAnalysis._po9622Seeded) return;
        app.data.costAnalysis._po9622Seeded = true;

        var corsairProd = (app.data.products || []).find(function(p) { return p.name.toLowerCase().indexOf('corsair') !== -1; });
        var corsairIds = corsairProd ? [corsairProd.id] : [];

        var poData = [
            {pn:'415-00473', rev:'000', desc:'*LS BOLT PAD, FUEL INLET, 316 SS',                    cost:107.75, qty:105},
            {pn:'415-00604', rev:'000', desc:'MOUNTING BRACKET (BENT), STANDALONE',                  cost:80.65,  qty:105},
            {pn:'415-00605', rev:'000', desc:'BRACKET, VODIA DIAGNOSTIC PORT',                       cost:40.80,  qty:105},
            {pn:'415-00639', rev:'001', desc:'*LS SUNSHADE CLIP, DOVETAIL',                          cost:26.13,  qty:1680},
            {pn:'415-00662', rev:'000', desc:'LID, ENCLOSURE, CRADLEPOINT',                          cost:151.19, qty:105},
            {pn:'415-00658', rev:'002', desc:'BASE, ENCLOSURE, CRADLEPOINT',                         cost:930.16, qty:105},
            {pn:'472-00506', rev:'000', desc:'CAP, SHROUD, VOLVO, HYDRAULIC',                        cost:48.24,  qty:105},
            {pn:'415-00674', rev:'000', desc:'HINGE, BASE, QUICK PIN, 1IN SPACING',                  cost:189.69, qty:210},
            {pn:'472-00516', rev:'000', desc:'SHIM, FOR M12, PRECISION 606',                         cost:17.63,  qty:630}
        ];

        var parts = app.data.costAnalysis.parts || [];
        var changed = false;

        poData.forEach(function(d) {
            var part = parts.find(function(p) { return p.partNumber === d.pn; });

            if (!part) {
                // Only create if brand new — never modify existing parts
                part = {
                    id: generateId(),
                    partNumber: d.pn,
                    rev: d.rev,
                    description: d.desc,
                    commodity: '',
                    unitOfMeasure: 'ea',
                    qpb: 1,
                    currentSupplier: 'Xometry',
                    currentPoNumber: '9622',
                    currentUnitCost: d.cost,
                    currentQtyPurchased: d.qty,
                    aliases: [],
                    supersedesPartId: null,
                    productIds: corsairIds,
                    rfqs: [],
                    purchaseOrders: [],
                    priceHistory: [],
                    inHouse: null
                };
                parts.push(part);
                app.data.costAnalysis.parts = parts;
            }
            // For existing parts: only append the PO record — never touch any other fields
            if (!part.purchaseOrders) part.purchaseOrders = [];
            var alreadyHasPO = part.purchaseOrders.find(function(po) { return po.poNumber === '9622'; });
            if (!alreadyHasPO) {
                part.purchaseOrders.push({
                    id: generateId(),
                    poNumber: '9622',
                    supplier: 'Xometry',
                    unitCost: d.cost,
                    qty: d.qty,
                    date: '2026-03-26',
                    notes: 'Corsair — PO 9622'
                });
                changed = true;
            }
        });

        if (changed) saveData();
    }

    function _seedPO11788() {
        if (app.data.costAnalysis._po11788Seeded) return;
        app.data.costAnalysis._po11788Seeded = true;

        // PO 11788 — ORCA Mounting Bracket set
        // Parts: 415-00488 (Clamp), 415-00489 (Locating Slide), 415-00620 (Main Boss)
        // 3 receipt events per part: 100 @ $35, 100 @ $35, 200 @ $35 = 400 total each
        var poData = [
            { pn: '415-00488', qty: 400, receipts: [19576, 22103, 23014] },
            { pn: '415-00489', qty: 400, receipts: [21078, 23014, 23014] },
            { pn: '415-00620', qty: 400, receipts: [19262, 20080, 23014] }
        ];

        var parts = app.data.costAnalysis.parts || [];
        var changed = false;

        poData.forEach(function(d) {
            var part = parts.find(function(p) { return p.partNumber === d.pn; });
            if (!part) return; // all 3 parts already exist — never create duplicates

            if (!part.purchaseOrders) part.purchaseOrders = [];
            var alreadyHasPO = part.purchaseOrders.find(function(po) { return po.poNumber === '11788'; });
            if (!alreadyHasPO) {
                part.purchaseOrders.push({
                    id: generateId(),
                    poNumber: '11788',
                    supplier: 'MTS Mechanical',
                    unitCost: 35,
                    qty: d.qty,
                    date: '2026-03-26',
                    notes: 'ORCA Mounting Bracket set — 3 receipt events (receipts: ' + d.receipts.join(', ') + ')'
                });
                changed = true;
            }
        });

        if (changed) saveData();
    }

    // One-time heal: _syncPrimaryFromPOs incorrectly set currentSupplier = 'MTS Mechanical'
    // on the 3 ORCA bracket parts (in-house parts that should have no external supplier).
    function _healMTSSupplier() {
        if (app.data.costAnalysis._mtsSuppHealDone) return;
        app.data.costAnalysis._mtsSuppHealDone = true;
        var pns = ['415-00488', '415-00489', '415-00620'];
        var parts = app.data.costAnalysis.parts || [];
        var changed = false;
        pns.forEach(function(pn) {
            var p = parts.find(function(x) { return x.partNumber === pn; });
            if (p && p.currentSupplier === 'MTS Mechanical') {
                p.currentSupplier = '';
                changed = true;
            }
        });
        if (changed) saveData();
    }

    function _seedTLA991_01014() {
        if (app.data.costAnalysis._tla991_01014Seeded) return;
        app.data.costAnalysis._tla991_01014Seeded = true;

        var ITEMS = [
            {pn:'415-00712',   rev:'000', desc:'PLATE, CENTER BULKHEAD, 1/2" THICK STEEL, PAYLOAD SIMULATOR', qty:1},
            {pn:'411-00179',   rev:'000', desc:'BOLT, FLANGED, M12x25, 1.75, GRADE 8.8',                      qty:1},
            {pn:'415-00485-R1',rev:'002', desc:'Pre-paint - WEIGHT BLOCK, MOCK PAYLOAD',                      qty:3},
            {pn:'445-00200',   rev:'000', desc:'WASHER, 1/2 INCH, 1.062 INCH OD, ZINC',                       qty:20},
            {pn:'415-00484',   rev:'002', desc:'WEIGHT BLOCK, MOCK PAYLOAD',                                  qty:3},
            {pn:'415-00722',   rev:'001', desc:'PLATE, PAYLOAD LIFT, AFT, CORSAIR',                           qty:1},
            {pn:'415-00716',   rev:'001', desc:'PLATE, PAYLOAD LIFT, FORWARD, CORSAIR',                       qty:2},
            {pn:'433-00183',   rev:'000', desc:'NUT, LOCK, 1/2IN, 13, 316 SS',                                qty:56},
            {pn:'473-00134-R1',rev:'000', desc:'Pre-paint - WELDMENT, PAYLOAD SIMULATOR',                     qty:1},
            {pn:'415-00711',   rev:'000', desc:'PLATE, FRONT BULKHEAD, 3/8" THICK STEEL, PAYLOAD SIMULATOR',  qty:1},
            {pn:'445-00199',   rev:'000', desc:'WASHER, 1/2, 1IN OD, 316 SS',                                 qty:104},
            {pn:'415-00713',   rev:'000', desc:'PLATE, CENTER BULKHEAD, 3/8" THICK STEEL, PAYLOAD SIMULATOR', qty:1},
            {pn:'415-00710',   rev:'000', desc:'PLATE, FRONT BULKHEAD, 1/2" THICK STEEL, PAYLOAD SIMULATOR',  qty:1},
            {pn:'415-00721',   rev:'000', desc:'PLATE, WEIGHT STACK SUPPORT, CORSAIR PAYLOAD SIMULATOR',      qty:1},
            {pn:'438-00558',   rev:'000', desc:'SCREW, FLAT HEAD, 1/2x1.5IN, 13, 316 SS',                     qty:8},
            {pn:'438-00555',   rev:'000', desc:'SCREW, 1/2INx2-1/4IN, 13, 316 SS',                            qty:48},
            {pn:'433-00226',   rev:'000', desc:'NUT, 1/2-13, NYLOCK, GRADE 5 ZINC STEEL',                     qty:10},
            {pn:'415-00718',   rev:'000', desc:'PLATE, REAR BULKHEAD, 3/8" THICK STEEL, PAYLOAD SIMULATOR',   qty:1},
            {pn:'415-00714',   rev:'000', desc:'PLATE, REAR BULKHEAD, 1/2" THICK STEEL, PAYLOAD SIMULATOR',   qty:1},
            {pn:'411-00263',   rev:'000', desc:'BOLT, 1/2-13 INCH, 2.5 INCH LENGTH, ZINC PLATED',             qty:10}
        ];

        var parts = app.data.costAnalysis.parts || [];
        var tlas  = app.data.costAnalysis.tlas  || (app.data.costAnalysis.tlas = []);
        var idMap = {};

        // Ensure each part exists; create if not
        ITEMS.forEach(function(s) {
            var existing = parts.find(function(p) { return p.partNumber.toLowerCase() === s.pn.toLowerCase(); });
            if (existing) { idMap[s.pn] = existing.id; return; }
            var id = generateId();
            idMap[s.pn] = id;
            parts.push({
                id: id, partNumber: s.pn, rev: s.rev, description: s.desc,
                unitOfMeasure: 'ea', qpb: 1, commodity: '',
                currentSupplier: '', currentPoNumber: '', currentUnitCost: 0,
                currentQtyPurchased: null, aliases: [], supersedesPartId: null,
                productIds: [], rfqs: [], purchaseOrders: [], priceHistory: [], inHouse: null
            });
        });
        app.data.costAnalysis.parts = parts;

        // Find or create TLA 991-01014
        var tla = tlas.find(function(t) { return t.partNumber === '991-01014'; });
        if (!tla) {
            tla = {
                id: generateId(),
                partNumber: '991-01014',
                name: 'ASSEMBLY, PAYLOAD SIMULATOR, CORSAIR',
                description: '',
                revision: '',
                notes: '',
                items: [],
                createdAt: new Date().toISOString()
            };
            tlas.push(tla);
        }

        // Link parts to TLA with correct quantities
        ITEMS.forEach(function(s) {
            var pid = idMap[s.pn];
            if (!pid) return;
            var existing = tla.items.find(function(i) { return i.partId === pid; });
            if (existing) {
                existing.qtyPerTLA = s.qty; // update qty if already linked
            } else {
                tla.items.push({ id: generateId(), partId: pid, qtyPerTLA: s.qty, notes: '' });
            }
        });

        saveData();
    }

    // ── Mirage Bulkhead Electrical BOM ────────────────────────────────────────
    // TLA: 991-01131  ASSEMBLY, INSTALL, BULKHEAD ELECTRICAL COMPONENTS
    // Sub-assemblies: 991-01217, 991-01250, 991-01231, 991-01232, 991-01308
    function _seedTLA991_01131() {
        if (app.data.costAnalysis._tla991_01131Seeded) return;
        app.data.costAnalysis._tla991_01131Seeded = true;

        var parts = app.data.costAnalysis.parts || (app.data.costAnalysis.parts = []);
        var tlas  = app.data.costAnalysis.tlas  || (app.data.costAnalysis.tlas  = []);
        var HW    = 'OTS Hardware';

        // Find Mirage product to link parts
        var mirageProduct = (app.data.products || []).find(function(p) {
            return p.name && p.name.toLowerCase().indexOf('mirage') >= 0;
        });
        var mirageId  = mirageProduct ? mirageProduct.id : null;
        var mirageIds = mirageId ? [mirageId] : [];

        // ── Full part list ─────────────────────────────────────────────────────
        // Notes: ROXTEC CF32 (qty 6, no PN) and NLC CABINET (qty 1, no PN) are
        // intentionally omitted because they have no Saronic part number assigned.
        // Add them manually once PNs are known.
        // 445-00176 was listed as "445-00176?" — trailing ? removed.
        var ALL_PARTS = [
            // ── Sub-assemblies (direct children of TLA 991-01131) ──────────────
            {pn:'991-01131', rev:'0', desc:'ASSEMBLY, INSTALL, BULKHEAD ELECTRICAL COMPONENTS',      commodity:''},
            {pn:'991-01217', rev:'0', desc:'ASSEMBLY, FWD PLATE, STBD BULKHEAD INTERFACE, MIRAGE',   commodity:''},
            {pn:'991-01250', rev:'0', desc:'CUSTOM CIRCUIT BREAKER PANEL, 9.25X7.75IN, BLUESEA',     commodity:''},
            {pn:'991-01231', rev:'0', desc:'ASSEMBLY, FWD PLATE, MIDDLE BULKHEAD INTERFACE, MIRAGE', commodity:''},
            {pn:'991-01232', rev:'0', desc:'ASSEMBLY, FWD PLATE, PORT BULKHEAD INTERFACE, MIRAGE',   commodity:''},
            {pn:'991-01308', rev:'0', desc:'ASSEMBLY, FUSE DISTRIBUTION BAR, MIRAGE',                commodity:''},

            // ── 991-01217 children ─────────────────────────────────────────────
            {pn:'472-00665', rev:'0', desc:'FWD PLATE, STBD BULKHEAD INTERFACE, MIRAGE',             commodity:''},

            // ── 991-01250 children ─────────────────────────────────────────────
            {pn:'445-00119', rev:'0', desc:'WASHER, M10, 20 OD, 316 SS',                             commodity:HW},
            {pn:'423-00056', rev:'0', desc:'STUD, PEM, M10X30, 1.5, 18-8 SS',                        commodity:HW},
            {pn:'433-00099', rev:'0', desc:'NUT, LOCK, M10, 1.5, 316 SS',                             commodity:HW},
            {pn:'251-00007', rev:'0', desc:'BUS BAR, 250A, 6POS, BLUE SEA 2126',                      commodity:''},
            {pn:'440-00009', rev:'0', desc:'SPACER, RND, UNTHD, M5x5, 8OD, 18-8 SS',                 commodity:HW},
            {pn:'423-00058', rev:'0', desc:'STUD, PEM, M5X30, .8, 18-8 SS',                           commodity:HW},
            {pn:'433-00105', rev:'0', desc:'NUT, LOCK, M5x0.8, 316SS',                                commodity:HW},
            {pn:'445-00003', rev:'0', desc:'WASHER, M5, 9 OD, 316 SS',                                commodity:HW},

            // ── 991-01231 children ─────────────────────────────────────────────
            {pn:'472-00707', rev:'0', desc:'FWD PLATE, MIDDLE BULKHEAD INTERFACE, MIRAGE',            commodity:''},
            {pn:'251-00009', rev:'0', desc:'DISTRIBUTION BLOCK, 120VAC, DBL80, TE CONNECTIVITY',      commodity:''},
            {pn:'242-00813', rev:'0', desc:'AC POWER MONITOR, A3770, OCTOPLEX',                        commodity:''},
            {pn:'251-00008', rev:'0', desc:'DISTRIBUTION BLOCK, 240VAC, DBL250, TE CONNECTIVITY',      commodity:''},
            {pn:'423-00040', rev:'0', desc:'STUD, PEM, M4X20, .7, 18-8 SS',                            commodity:HW},
            {pn:'433-00031', rev:'0', desc:'NUT, LOCK, M4, .7, 316 SS',                                commodity:HW},
            {pn:'445-00025', rev:'0', desc:'WASHER, M4, 8OD, 316SS',                                   commodity:HW},
            {pn:'423-00034', rev:'0', desc:'STUD, PEM, M5X20, .8, 18-8 SS',                            commodity:HW},

            // ── 991-01232 children ─────────────────────────────────────────────
            {pn:'472-00679', rev:'0', desc:'FWD PLATE, PORT BULKHEAD INTERFACE, MIRAGE',               commodity:''},

            // ── 991-01308 children ─────────────────────────────────────────────
            {pn:'242-00756', rev:'0', desc:'BUS BAR, M10 STUD x2, M8 STUD x6, 1500A CONT. CURRENT, TINNED COPPER', commodity:''},
            {pn:'433-00147', rev:'0', desc:'NUT, PEM, M10 X 1.5, 18-8 SS',                             commodity:HW},
            {pn:'242-00757', rev:'0', desc:'FUSE HOLDER W/ FUSE HOLDER CAP, M8 STUD SIZE, MEGA FUSE',  commodity:''},
            {pn:'243-00079', rev:'0', desc:'BOTTOM, ENCLOSURE, FUSE BAR, MIRAGE',                      commodity:''},
            {pn:'472-00745', rev:'0', desc:'COPPER PLATE, FUSE DISTRIBUTION, MIRAGE',                  commodity:''},
            {pn:'445-00133', rev:'0', desc:'WASHER, M10, 30 OD, 316 SS',                               commodity:HW},
            {pn:'411-00138', rev:'0', desc:'BOLT, M10x30, 1.5, 316 SS',                                commodity:HW},
            {pn:'461-00047', rev:'0', desc:'INSERT, HEAT SET, NUT, M6x12.7, 1, 18-8 SS',               commodity:HW},
            {pn:'243-00080', rev:'0', desc:'TOP, ENCLOSURE, FUSE BAR, MIRAGE',                         commodity:''},
            {pn:'445-00176', rev:'0', desc:'WASHER, M6, 12 OD, 316 SS',                                commodity:HW},
            {pn:'438-00009', rev:'0', desc:'SCREW, M6x16, 1, 316 SS',                                  commodity:HW},
            {pn:'433-00022', rev:'0', desc:'M8 x 1.25mm Nyloc 316 SS',                                 commodity:HW},
            {pn:'445-00102', rev:'0', desc:'WASHER, M8, 15 OD, 316 SS',                                commodity:HW},
            {pn:'423-00052', rev:'0', desc:'STUD, PEM, M8X35, 1.25, 18-8 SS',                          commodity:HW},
            {pn:'423-00057', rev:'0', desc:'STUD, M5X25, PEM, 18-8 SS',                                commodity:HW}
        ];

        var idMap = {};

        // Ensure every part exists; create if missing; append Mirage product link
        ALL_PARTS.forEach(function(s) {
            var pnLower = s.pn.toLowerCase();
            var existing = parts.find(function(p) {
                return (p.partNumber || '').toLowerCase() === pnLower;
            });
            if (existing) {
                idMap[s.pn] = existing.id;
                if (mirageId && !(existing.productIds || []).includes(mirageId)) {
                    existing.productIds = (existing.productIds || []).concat([mirageId]);
                }
                // Set commodity only if blank and we have one
                if (!existing.commodity && s.commodity) existing.commodity = s.commodity;
                return;
            }
            var id = generateId();
            idMap[s.pn] = id;
            parts.push({
                id: id, partNumber: s.pn, rev: s.rev, description: s.desc,
                unitOfMeasure: 'ea', qpb: 1, commodity: s.commodity || '',
                currentSupplier: '', currentPoNumber: '', currentUnitCost: 0,
                currentQtyPurchased: null, aliases: [], supersedesPartId: null,
                productIds: mirageIds.slice(), rfqs: [], purchaseOrders: [],
                priceHistory: [], inHouse: null
            });
        });
        app.data.costAnalysis.parts = parts;

        // ── TLA definitions (one per 991- assembly) ────────────────────────────
        var TLA_DEFS = [
            {
                pn:'991-01131', rev:'0',
                name:'ASSEMBLY, INSTALL, BULKHEAD ELECTRICAL COMPONENTS',
                notes:'ROXTEC CF32 PASS THROUGH (qty 6, no PN) and NLC CABINET LIGHTING MIRAGE (qty 1, no PN) not yet assigned Saronic PNs — add manually.',
                items:[
                    {pn:'991-01217', qty:1},
                    {pn:'991-01250', qty:1},
                    {pn:'991-01231', qty:1},
                    {pn:'991-01232', qty:1},
                    {pn:'991-01308', qty:2}
                ]
            },
            {
                pn:'991-01217', rev:'0',
                name:'ASSEMBLY, FWD PLATE, STBD BULKHEAD INTERFACE, MIRAGE',
                notes:'',
                items:[
                    {pn:'472-00665', qty:1}
                ]
            },
            {
                pn:'991-01250', rev:'0',
                name:'CUSTOM CIRCUIT BREAKER PANEL, 9.25X7.75IN, BLUESEA',
                notes:'NLC CABINET, LIGHTING, MIRAGE (qty 1, no PN) — add manually once PN assigned.',
                items:[
                    {pn:'445-00119', qty:4},
                    {pn:'423-00056', qty:4},
                    {pn:'433-00099', qty:4},
                    {pn:'251-00007', qty:1},
                    {pn:'440-00009', qty:2},
                    {pn:'423-00058', qty:2},
                    {pn:'433-00105', qty:2},
                    {pn:'445-00003', qty:2}
                ]
            },
            {
                pn:'991-01231', rev:'0',
                name:'ASSEMBLY, FWD PLATE, MIDDLE BULKHEAD INTERFACE, MIRAGE',
                notes:'',
                items:[
                    {pn:'472-00707', qty:1},
                    {pn:'251-00009', qty:3},
                    {pn:'242-00813', qty:3},
                    {pn:'251-00008', qty:3},
                    {pn:'423-00040', qty:12},
                    {pn:'433-00031', qty:12},
                    {pn:'445-00025', qty:12},
                    {pn:'423-00034', qty:12},
                    {pn:'433-00105', qty:12},
                    {pn:'445-00003', qty:12}
                ]
            },
            {
                pn:'991-01232', rev:'0',
                name:'ASSEMBLY, FWD PLATE, PORT BULKHEAD INTERFACE, MIRAGE',
                notes:'',
                items:[
                    {pn:'472-00679', qty:1}
                ]
            },
            {
                pn:'991-01308', rev:'0',
                name:'ASSEMBLY, FUSE DISTRIBUTION BAR, MIRAGE',
                notes:'',
                items:[
                    {pn:'242-00756', qty:3},
                    {pn:'433-00147', qty:2},
                    {pn:'242-00757', qty:18},
                    {pn:'243-00079', qty:1},
                    {pn:'472-00745', qty:2},
                    {pn:'445-00133', qty:6},
                    {pn:'411-00138', qty:6},
                    {pn:'461-00047', qty:4},
                    {pn:'243-00080', qty:1},
                    {pn:'445-00176', qty:4},
                    {pn:'438-00009', qty:4},
                    {pn:'433-00022', qty:8},
                    {pn:'445-00102', qty:8},
                    {pn:'423-00052', qty:8},
                    {pn:'251-00007', qty:1},
                    {pn:'445-00003', qty:2},
                    {pn:'433-00105', qty:2},
                    {pn:'423-00057', qty:2},
                    {pn:'440-00009', qty:2}
                ]
            }
        ];

        // Create or update each TLA and link its items
        TLA_DEFS.forEach(function(def) {
            var tla = tlas.find(function(t) { return t.partNumber === def.pn; });
            if (!tla) {
                tla = {
                    id: generateId(), partNumber: def.pn, name: def.name,
                    description: '', revision: def.rev, notes: def.notes,
                    items: [], createdAt: new Date().toISOString()
                };
                tlas.push(tla);
            }
            def.items.forEach(function(item) {
                var pid = idMap[item.pn];
                if (!pid) return;
                var existing = tla.items.find(function(i) { return i.partId === pid; });
                if (existing) {
                    existing.qtyPerTLA = item.qty;
                } else {
                    tla.items.push({ id: generateId(), partId: pid, qtyPerTLA: item.qty, notes: '' });
                }
            });
        });

        saveData();
    }

    function _migrate130_00029ToRawMaterial() {
        if (app.data.costAnalysis._130_00029Migrated) return;
        app.data.costAnalysis._130_00029Migrated = true;

        var parts = app.data.costAnalysis.parts || [];
        var rms   = app.data.costAnalysis.rawMaterials || (app.data.costAnalysis.rawMaterials = []);
        var pn = '130-00029';

        // Find the part
        var idx = parts.findIndex(function(p) { return p.partNumber.toLowerCase() === pn.toLowerCase(); });
        if (idx === -1) return; // already gone or never existed as a part
        var part = parts[idx];

        // Add to raw materials if not already there
        if (!rms.find(function(m) { return m.partNumber.toLowerCase() === pn.toLowerCase(); })) {
            rms.push({
                id: generateId(),
                partNumber: part.partNumber,
                description: part.description || '',
                uom: part.unitOfMeasure || 'ea',
                costPerUom: Number(part.currentUnitCost) || 0,
                supplier: part.currentSupplier || '',
                notes: part.currentPoNumber ? 'PO: ' + part.currentPoNumber : ''
            });
        }

        // Remove from parts list
        parts.splice(idx, 1);
        app.data.costAnalysis.parts = parts;

        saveData();
    }

    function _migratePayloadRawMaterials() {
        if (app.data.costAnalysis._payloadRawMatsMigrated) return;
        app.data.costAnalysis._payloadRawMatsMigrated = true;

        var RAW = [
            {pn:'110-00031', desc:'RAW MATERIAL - L-Track, HEAVY DUTY, AL 7075, 1.36 IN x .53 IN', uom:'in',    cost:3.37},
            {pn:'120-00028', desc:'Sheet, AL 6061, .500"',                                           uom:'sq in', cost:0},
            {pn:'130-00005', desc:'Raw Material - Bar, Aluminum, 6061, 3.50 IN x 2.50 IN',          uom:'in',    cost:4.57},
            {pn:'130-00024', desc:'Bar, AL 6061, 4.00 x 2.50"',                                     uom:'in',    cost:0},
        ];
        var rms   = app.data.costAnalysis.rawMaterials || (app.data.costAnalysis.rawMaterials = []);
        var parts = app.data.costAnalysis.parts || [];
        var rmPNs = RAW.map(function(r) { return r.pn.toLowerCase(); });

        // Add to raw materials library if missing
        RAW.forEach(function(r) {
            if (!rms.find(function(m) { return m.partNumber.toLowerCase() === r.pn.toLowerCase(); })) {
                rms.push({ id: generateId(), partNumber: r.pn, description: r.desc,
                    uom: r.uom, costPerUom: r.cost, supplier: '', notes: '' });
            }
        });

        // Remove from parts list
        app.data.costAnalysis.parts = parts.filter(function(p) {
            return !rmPNs.includes(p.partNumber.toLowerCase());
        });

        // Remove from TLA items
        var tlas = app.data.costAnalysis.tlas || [];
        var removedIds = parts.filter(function(p) {
            return rmPNs.includes(p.partNumber.toLowerCase());
        }).map(function(p) { return p.id; });
        tlas.forEach(function(t) {
            t.items = (t.items || []).filter(function(i) { return !removedIds.includes(i.partId); });
        });

        saveData();
    }

    // ─── In-House Cost Modal ──────────────────────────────────────────────────

    let _ihPartId = null;
    let _ihOps = [];
    let _ihLaborOps = [];
    let _ihQty = 1;

    function showInHouseCostModal(partId) {
        const part = getPart(partId);
        if (!part) return;
        _ihPartId = partId;
        _ihOps = part.inHouse && part.inHouse.operations
            ? part.inHouse.operations.map(o => Object.assign({}, o))
            : [];
        _ihQty = (part.inHouse && part.inHouse.qtyRan) ? Number(part.inHouse.qtyRan) : 1;
        _ihLaborOps = part.inHouse && part.inHouse.laborOperations
            ? part.inHouse.laborOperations.map(o => Object.assign({}, o))
            : [];

        const ohPct     = (part.inHouse && part.inHouse.overheadPct != null) ? part.inHouse.overheadPct : '';
        const selRmId   = (part.inHouse && part.inHouse.rawMaterialId) || '';
        const usedPer   = (part.inHouse && part.inHouse.usedPerPart != null) ? part.inHouse.usedPerPart : '';
        const matQtyBought = (part.inHouse && part.inHouse.materialQtyBought != null) ? part.inHouse.materialQtyBought : '';

        const rawMats = app.data.costAnalysis.rawMaterials || [];
        const selRm = selRmId ? rawMats.find(m => m.id === selRmId) : null;

        const rmOptions = rawMats.slice().sort((a, b) => (a.partNumber || '').localeCompare(b.partNumber || '')).map(m => {
            const sel = m.id === selRmId ? ' selected' : '';
            return '<option value="' + m.id + '"' + sel + '>' +
                escapeHtml(m.partNumber) + ' — ' + escapeHtml(m.description || '') +
                ' (' + escapeHtml(m.uom || '') + ' @ ' + fmt$(m.costPerUom) + ')</option>';
        }).join('');

        const initInfoHtml = selRm
            ? '<div class="cost-rm-info-card">' +
              '<span><strong>' + escapeHtml(selRm.partNumber) + '</strong></span>' +
              '<span>' + escapeHtml(selRm.description || '') + '</span>' +
              '<span>' + escapeHtml(selRm.uom || '') + ' @ ' + fmt$(selRm.costPerUom) + '</span>' +
              (selRm.supplier ? '<span>' + escapeHtml(selRm.supplier) + '</span>' : '') +
              '</div>'
            : '';

        const uomLabel = selRm ? selRm.uom || 'UOM' : 'UOM';
        const noMatsHint = rawMats.length === 0
            ? '<small class="muted" style="font-size:11px;">No materials in library. <button style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:11px;padding:0;" onclick="document.getElementById(\'caIHModal\').remove(); window._ca.switchView(\'rawmaterials\');">Add materials →</button></small>'
            : '<small class="muted" style="font-size:11px;">Manage in the <button style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:11px;padding:0;" onclick="document.getElementById(\'caIHModal\').remove(); window._ca.switchView(\'rawmaterials\');">Raw Materials</button> tab.</small>';

        const html = `
        <div class="modal-overlay" id="caIHModal">
            <div class="modal modal-wide">
                <div class="modal-header">
                    <h2>In-House Cost — ${escapeHtml(part.partNumber)}</h2>
                    <button class="modal-close" onclick="document.getElementById('caIHModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group" style="max-width:240px; margin-bottom:16px;">
                        <label class="form-label">Quantity Ran In-House (batch size)</label>
                        <input type="number" class="form-control" id="ca-ih-qty" value="${_ihQty}" min="1" step="1"
                            oninput="window._ca._ihQtyChange(this.value)">
                        <small style="color:var(--muted); font-size:11px;">Hours below are totals for this batch — divided by qty to get $/unit.</small>
                    </div>

                    <div class="cost-table-wrap" style="margin-bottom:12px;">
                        <table class="cost-table" id="ca-ih-ops-table">
                            <thead>
                                <tr>
                                    <th>Work Center / Machine</th>
                                    <th>Hours</th>
                                    <th>Rate / hr ($)</th>
                                    <th>Machine Cost</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody id="ca-ih-ops-body">
                                ${_ihOps.map(op => ihOpRow(op)).join('')}
                            </tbody>
                        </table>
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="window._ca._ihAddRow()" style="margin-bottom:20px;">+ Add Machine</button>

                    <div class="cost-form-section-label">Labor</div>
                    <div class="cost-table-wrap" style="margin-bottom:12px;">
                        <table class="cost-table" id="ca-ih-labor-table">
                            <thead>
                                <tr>
                                    <th>Task / Role</th>
                                    <th>Hours</th>
                                    <th>Rate / hr ($)</th>
                                    <th>Labor Cost</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody id="ca-ih-labor-body">
                                ${_ihLaborOps.map(op => ihLaborRow(op)).join('')}
                            </tbody>
                        </table>
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="window._ca._ihAddLaborRow()" style="margin-bottom:20px;">+ Add Labor</button>

                    <div class="cost-form-section-label">Raw Material</div>
                    <div class="form-group">
                        <label class="form-label">Select Raw Material</label>
                        <select class="form-control" id="ca-ih-mat-select" onchange="window._ca._ihMatSelectChange(this.value)">
                            <option value="">— None —</option>
                            ${rmOptions}
                        </select>
                        ${noMatsHint}
                    </div>
                    <div id="ca-ih-mat-info" style="${selRm ? '' : 'display:none;'} margin-bottom:12px;">
                        ${initInfoHtml}
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Used per Part (<span id="ca-ih-mat-uom-label">${escapeHtml(uomLabel)}</span>)</label>
                            <input type="number" class="form-control" id="ca-ih-mat-used" value="${usedPer}" min="0" step="0.0001" placeholder="0.0000"
                                oninput="window._ca._ihUpdateTotal()">
                            <small class="muted" style="font-size:11px;">How many UOM units each finished part consumes.</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Material $/part</label>
                            <input type="text" class="form-control" id="ca-ih-mat-cost-per-part" readonly
                                style="background:var(--surface-2); color:var(--muted);" placeholder="auto-calculated">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Qty Bought (reference)</label>
                            <input type="number" class="form-control" id="ca-ih-mat-qty" value="${matQtyBought}" min="0" step="0.001" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Total Material Cost (batch)</label>
                            <input type="text" class="form-control" id="ca-ih-mat-total-ro" readonly
                                style="background:var(--surface-2); color:var(--muted);" placeholder="auto-calculated">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Overhead (%)</label>
                            <input type="number" class="form-control" id="ca-ih-oh" value="${ohPct}" min="0" step="0.1" placeholder="0"
                                oninput="window._ca._ihUpdateTotal()">
                        </div>
                    </div>

                    <div class="cost-ih-total-row">
                        <span>Machine Total:</span><span id="ca-ih-mach-total">—</span>
                        <span>+ Labor:</span><span id="ca-ih-labor-total">—</span>
                        <span>+ Material:</span><span id="ca-ih-mat-display">—</span>
                        <span>+ Overhead:</span><span id="ca-ih-oh-display">—</span>
                        <span class="cost-ih-grand-label">Total In-House $/unit:</span>
                        <span class="cost-ih-grand-value" id="ca-ih-grand">—</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('caIHModal').remove()">Cancel</button>
                    <button class="btn btn-danger" onclick="window._ca._ihClear()">Clear</button>
                    <button class="btn btn-primary" onclick="window._ca.saveInHouseCost()">Save</button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        _ihUpdateTotal();
    }

    function _ihMatSelectChange(rmId) {
        const rm = getRawMaterial(rmId);

        const uomLabel = document.getElementById('ca-ih-mat-uom-label');
        if (uomLabel) uomLabel.textContent = rm ? (rm.uom || 'UOM') : 'UOM';

        const infoEl = document.getElementById('ca-ih-mat-info');
        if (infoEl) {
            if (rm) {
                infoEl.innerHTML = '<div class="cost-rm-info-card">' +
                    '<span><strong>' + escapeHtml(rm.partNumber) + '</strong></span>' +
                    '<span>' + escapeHtml(rm.description || '') + '</span>' +
                    '<span>' + escapeHtml(rm.uom || '') + ' @ ' + fmt$(rm.costPerUom) + '</span>' +
                    (rm.supplier ? '<span>' + escapeHtml(rm.supplier) + '</span>' : '') +
                    '</div>';
                infoEl.style.display = '';
            } else {
                infoEl.innerHTML = '';
                infoEl.style.display = 'none';
            }
        }
        _ihUpdateTotal();
    }

    // ─── Time parsing helpers ─────────────────────────────────────────────────

    function parseHours(str) {
        if (!str && str !== 0) return 0;
        str = String(str).trim();
        if (!str) return 0;
        if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
        const colonMatch = str.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
        if (colonMatch) {
            return (parseInt(colonMatch[1]) || 0)
                 + (parseInt(colonMatch[2]) || 0) / 60
                 + (parseInt(colonMatch[3]) || 0) / 3600;
        }
        let total = 0, matched = false;
        const hMatch = str.match(/(\d+(?:\.\d+)?)\s*h/i);
        const mMatch = str.match(/(\d+(?:\.\d+)?)\s*m(?!s)/i);
        const sMatch = str.match(/(\d+(?:\.\d+)?)\s*s/i);
        if (hMatch) { total += parseFloat(hMatch[1]); matched = true; }
        if (mMatch) { total += parseFloat(mMatch[1]) / 60; matched = true; }
        if (sMatch) { total += parseFloat(sMatch[1]) / 3600; matched = true; }
        if (matched) return total;
        const fallback = parseFloat(str);
        return isNaN(fallback) ? 0 : fallback;
    }

    function fmtHours(h) {
        if (!h) return '';
        const totalSecs = Math.round(h * 3600);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        let parts = [];
        if (hrs)  parts.push(hrs + 'h');
        if (mins) parts.push(mins + 'm');
        if (secs) parts.push(secs + 's');
        return parts.length ? parts.join(' ') + ' (' + h.toFixed(4) + ' hrs)' : '';
    }

    function ihCostBreakdown(hours, rate, qty) {
        const h = Number(hours) || 0;
        const r = Number(rate) || 0;
        const q = Number(qty) || 1;
        if (!h && !r) return '<span class="muted">—</span>';
        const hPerUnit = h / q;
        const cost = hPerUnit * r;
        if (q > 1) {
            return `<span class="cost-ih-breakdown">${h.toFixed(4)} hrs ÷ ${q} = ${hPerUnit.toFixed(4)} hrs/unit × ${fmt$(r)} = <strong>${fmt$(cost)}</strong></span>`;
        }
        return `<span class="cost-ih-breakdown">${h.toFixed(4)} hrs × ${fmt$(r)} = <strong>${fmt$(cost)}</strong></span>`;
    }

    function _ihQtyChange(val) {
        _ihQty = Number(val) || 1;
        _ihOps.forEach(op => {
            const cell = document.getElementById('ih-row-cost-' + op.id);
            if (cell) cell.innerHTML = ihCostBreakdown(op.hours, getEffectiveOpRate(op), _ihQty);
        });
        _ihLaborOps.forEach(op => {
            const cell = document.getElementById('ih-labor-row-cost-' + op.id);
            if (cell) cell.innerHTML = ihCostBreakdown(op.hours, op.ratePerHour, _ihQty);
        });
        _ihUpdateTotal();
    }

    function getWorkCenterSelectHtml(selectedWcId) {
        const wcs = app.data.costAnalysis.workCenters || [];
        if (wcs.length === 0) return '';
        const opts = wcs.map(function(wc) {
            const sel = wc.id === selectedWcId ? ' selected' : '';
            return '<option value="' + wc.id + '"' + sel + '>' + escapeHtml(wc.name) + ' — ' + fmt$(wc.ratePerHour) + '/hr</option>';
        }).join('');
        return '<option value="">— Manual —</option>' + opts;
    }

    function getEffectiveOpRate(op) {
        if (op.workCenterId) {
            const wc = getWorkCenter(op.workCenterId);
            if (wc) return Number(wc.ratePerHour) || 0;
        }
        return Number(op.ratePerHour) || 0;
    }

    function ihOpRow(op) {
        const hoursHint = op.hours ? fmtHours(Number(op.hours)) : '';
        const wcs = app.data.costAnalysis.workCenters || [];
        const wc = op.workCenterId ? getWorkCenter(op.workCenterId) : null;
        const effectiveRate = getEffectiveOpRate(op);
        const wcSelect = wcs.length > 0
            ? '<select class="form-control" style="margin-bottom:4px;font-size:11px;" id="ih-wc-' + op.id + '"' +
              ' onchange="window._ca._ihWCChange(\'' + op.id + '\', this.value)">' +
              getWorkCenterSelectHtml(op.workCenterId || '') + '</select>'
            : '';
        const nameCell = wc
            ? '<small class="muted">' + escapeHtml(wc.name) + '</small>'
            : '<input type="text" class="form-control" value="' + escapeHtml(op.machine || '') + '"' +
              ' placeholder="Machine name" onchange="window._ca._ihRowChange(\'' + op.id + '\', \'machine\', this.value)">';
        const rateReadonly = wc ? ' readonly style="background:var(--surface-2);color:var(--muted);"' : '';
        const rateVal = effectiveRate > 0 ? String(effectiveRate) : '';
        const rateHint = wc ? '<small class="muted" style="font-size:10px;display:block;">Work center</small>' : '';
        return '<tr id="ih-row-' + op.id + '">' +
            '<td>' + wcSelect + '<div id="ih-name-area-' + op.id + '">' + nameCell + '</div></td>' +
            '<td>' +
            '<input type="text" class="form-control" value="' + escapeHtml(op._hoursRaw || (op.hours ? String(op.hours) : '')) + '"' +
            ' placeholder="e.g. 5h 30m" id="ih-hours-' + op.id + '"' +
            ' oninput="window._ca._ihRowChange(\'' + op.id + '\', \'hours\', this.value)">' +
            '<small class="cost-ih-hours-hint" id="ih-hours-hint-' + op.id + '">' + escapeHtml(hoursHint) + '</small>' +
            '</td>' +
            '<td>' +
            '<input type="number" class="form-control" value="' + rateVal + '"' +
            ' min="0" step="0.01" placeholder="0.00"' + rateReadonly +
            ' id="ih-rate-' + op.id + '"' +
            ' oninput="window._ca._ihRowChange(\'' + op.id + '\', \'ratePerHour\', this.value)">' +
            rateHint +
            '</td>' +
            '<td id="ih-row-cost-' + op.id + '">' + ihCostBreakdown(op.hours, effectiveRate, _ihQty) + '</td>' +
            '<td><button class="btn btn-danger btn-small" onclick="window._ca._ihRemoveRow(\'' + op.id + '\')">×</button></td>' +
            '</tr>';
    }

    function ihLaborRow(op) {
        const hoursHint = op.hours ? fmtHours(Number(op.hours)) : '';
        return `<tr id="ih-labor-row-${op.id}">
            <td><input type="text" class="form-control" value="${escapeHtml(op.task || '')}"
                placeholder="Assembly" onchange="window._ca._ihLaborRowChange('${op.id}', 'task', this.value)"></td>
            <td>
                <input type="text" class="form-control" value="${escapeHtml(op._hoursRaw || (op.hours ? String(op.hours) : ''))}"
                    placeholder="e.g. 1h 30m" id="ih-labor-hours-${op.id}"
                    oninput="window._ca._ihLaborRowChange('${op.id}', 'hours', this.value)">
                <small class="cost-ih-hours-hint" id="ih-labor-hours-hint-${op.id}">${escapeHtml(hoursHint)}</small>
            </td>
            <td><input type="number" class="form-control" value="${op.ratePerHour || ''}"
                min="0" step="0.01" placeholder="0.00" oninput="window._ca._ihLaborRowChange('${op.id}', 'ratePerHour', this.value)"></td>
            <td id="ih-labor-row-cost-${op.id}">${ihCostBreakdown(op.hours, op.ratePerHour, _ihQty)}</td>
            <td><button class="btn btn-danger btn-small" onclick="window._ca._ihRemoveLaborRow('${op.id}')">×</button></td>
        </tr>`;
    }

    function _ihWCChange(opId, wcId) {
        const op = _ihOps.find(o => o.id === opId);
        if (!op) return;
        op.workCenterId = wcId || null;
        const wc = wcId ? getWorkCenter(wcId) : null;

        // Update name area
        const nameAreaEl = document.getElementById('ih-name-area-' + opId);
        if (nameAreaEl) {
            if (wc) {
                nameAreaEl.innerHTML = '<small class="muted">' + escapeHtml(wc.name) + '</small>';
            } else {
                nameAreaEl.innerHTML = '<input type="text" class="form-control" value="' + escapeHtml(op.machine || '') + '"' +
                    ' placeholder="Machine name" onchange="window._ca._ihRowChange(\'' + opId + '\', \'machine\', this.value)">';
            }
        }
        // Update rate field
        const rateEl = document.getElementById('ih-rate-' + opId);
        if (rateEl) {
            if (wc) {
                rateEl.value = wc.ratePerHour;
                rateEl.readOnly = true;
                rateEl.style.background = 'var(--surface-2)';
                rateEl.style.color = 'var(--muted)';
            } else {
                rateEl.value = op.ratePerHour || '';
                rateEl.readOnly = false;
                rateEl.style.background = '';
                rateEl.style.color = '';
            }
        }
        const costCell = document.getElementById('ih-row-cost-' + opId);
        if (costCell) costCell.innerHTML = ihCostBreakdown(op.hours, getEffectiveOpRate(op), _ihQty);
        _ihUpdateTotal();
    }

    function _ihAddRow() {
        const op = { id: generateId(), workCenterId: null, machine: '', hours: '', ratePerHour: '' };
        _ihOps.push(op);
        document.getElementById('ca-ih-ops-body').insertAdjacentHTML('beforeend', ihOpRow(op));
        _ihUpdateTotal();
    }

    function _ihRemoveRow(rowId) {
        _ihOps = _ihOps.filter(o => o.id !== rowId);
        const row = document.getElementById('ih-row-' + rowId);
        if (row) row.remove();
        _ihUpdateTotal();
    }

    function _ihRowChange(rowId, field, value) {
        const op = _ihOps.find(o => o.id === rowId);
        if (!op) return;
        if (field === 'machine') {
            op.machine = value;
        } else if (field === 'hours') {
            op._hoursRaw = value;
            op.hours = parseHours(value);
            const hint = document.getElementById('ih-hours-hint-' + rowId);
            if (hint) hint.textContent = op.hours > 0 ? fmtHours(op.hours) : '';
        } else {
            op[field] = parseFloat(value) || 0;
        }
        const costCell = document.getElementById('ih-row-cost-' + rowId);
        if (costCell) costCell.innerHTML = ihCostBreakdown(op.hours, getEffectiveOpRate(op), _ihQty);
        _ihUpdateTotal();
    }

    function _ihAddLaborRow() {
        const op = { id: generateId(), task: '', hours: '', ratePerHour: '' };
        _ihLaborOps.push(op);
        document.getElementById('ca-ih-labor-body').insertAdjacentHTML('beforeend', ihLaborRow(op));
        _ihUpdateTotal();
    }

    function _ihRemoveLaborRow(rowId) {
        _ihLaborOps = _ihLaborOps.filter(o => o.id !== rowId);
        const row = document.getElementById('ih-labor-row-' + rowId);
        if (row) row.remove();
        _ihUpdateTotal();
    }

    function _ihLaborRowChange(rowId, field, value) {
        const op = _ihLaborOps.find(o => o.id === rowId);
        if (!op) return;
        if (field === 'task') {
            op.task = value;
        } else if (field === 'hours') {
            op._hoursRaw = value;
            op.hours = parseHours(value);
            const hint = document.getElementById('ih-labor-hours-hint-' + rowId);
            if (hint) hint.textContent = op.hours > 0 ? fmtHours(op.hours) : '';
        } else {
            op[field] = parseFloat(value) || 0;
        }
        const costCell = document.getElementById('ih-labor-row-cost-' + rowId);
        if (costCell) costCell.innerHTML = ihCostBreakdown(op.hours, op.ratePerHour, _ihQty);
        _ihUpdateTotal();
    }

    function _ihUpdateTotal() {
        const qty = _ihQty || 1;
        const machTotalPerUnit = _ihOps.reduce((s, op) =>
            s + ((Number(op.hours) || 0) / qty) * getEffectiveOpRate(op), 0);
        const laborTotalPerUnit = _ihLaborOps.reduce((s, op) =>
            s + ((Number(op.hours) || 0) / qty) * (Number(op.ratePerHour) || 0), 0);

        // Material cost: look up from raw materials library
        const rmId = document.getElementById('ca-ih-mat-select')?.value || '';
        const rm = rmId ? getRawMaterial(rmId) : null;
        const costPerUom = rm ? Number(rm.costPerUom) : 0;
        const usedPerPart = parseFloat(document.getElementById('ca-ih-mat-used')?.value) || 0;
        const matPerUnit = usedPerPart * costPerUom;

        const oh = parseFloat(document.getElementById('ca-ih-oh')?.value) || 0;
        const subtotal = machTotalPerUnit + laborTotalPerUnit + matPerUnit;
        const grand = subtotal * (1 + oh / 100);

        // Update readonly display fields
        const costPerPartEl = document.getElementById('ca-ih-mat-cost-per-part');
        if (costPerPartEl) costPerPartEl.value = matPerUnit > 0 ? fmt$(matPerUnit) : '';
        const roEl = document.getElementById('ca-ih-mat-total-ro');
        if (roEl) roEl.value = matPerUnit > 0 ? fmt$(matPerUnit * qty) : '';

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('ca-ih-mach-total', fmt$(machTotalPerUnit));
        set('ca-ih-labor-total', fmt$(laborTotalPerUnit));
        set('ca-ih-mat-display', fmt$(matPerUnit));
        set('ca-ih-oh-display', fmt$(subtotal * oh / 100));
        set('ca-ih-grand', fmt$(grand));
    }

    function _ihClear() {
        if (!confirm('Clear all in-house cost data for this part?')) return;
        _ihOps = [];
        _ihLaborOps = [];
        document.getElementById('ca-ih-ops-body').innerHTML = '';
        document.getElementById('ca-ih-labor-body').innerHTML = '';
        document.getElementById('ca-ih-qty').value = '1';
        document.getElementById('ca-ih-mat-select').value = '';
        const infoEl = document.getElementById('ca-ih-mat-info');
        if (infoEl) { infoEl.innerHTML = ''; infoEl.style.display = 'none'; }
        const uomLabel = document.getElementById('ca-ih-mat-uom-label');
        if (uomLabel) uomLabel.textContent = 'UOM';
        document.getElementById('ca-ih-mat-used').value = '';
        document.getElementById('ca-ih-mat-qty').value = '';
        document.getElementById('ca-ih-oh').value = '';
        _ihQty = 1;
        _ihUpdateTotal();
    }

    function saveInHouseCost() {
        const oh  = parseFloat(document.getElementById('ca-ih-oh').value) || 0;
        const part = getPart(_ihPartId);
        if (!part) return;

        const qty = parseFloat(document.getElementById('ca-ih-qty').value) || 1;
        part.inHouse = {
            qtyRan: qty,
            operations: _ihOps.map(o => ({
                id: o.id,
                workCenterId: o.workCenterId || null,
                machine: o.workCenterId ? (getWorkCenter(o.workCenterId) ? getWorkCenter(o.workCenterId).name : o.machine || '') : (o.machine || ''),
                hours: Number(o.hours) || 0,
                ratePerHour: Number(o.ratePerHour) || 0
            })),
            laborOperations: _ihLaborOps.map(o => ({
                id: o.id,
                task: o.task || '',
                hours: Number(o.hours) || 0,
                ratePerHour: Number(o.ratePerHour) || 0
            })),
            rawMaterialId: document.getElementById('ca-ih-mat-select').value || null,
            usedPerPart: parseFloat(document.getElementById('ca-ih-mat-used').value) || null,
            materialQtyBought: parseFloat(document.getElementById('ca-ih-mat-qty').value) || null,
            overheadPct: oh
        };

        saveData();
        document.getElementById('caIHModal').remove();
        showToast('In-house cost saved');
        renderCostAnalysisPage();
    }

    // ─── Part Detail Modal ────────────────────────────────────────────────────

    // ─── PO History Modal ────────────────────────────────────────────────────────

    function showPOModal(partId, poId) {
        const part = getPart(partId);
        if (!part) return;
        if (!part.purchaseOrders) part.purchaseOrders = [];
        const po = poId ? part.purchaseOrders.find(function(x) { return x.id === poId; }) : null;
        const title = po ? 'Edit Purchase Order' : 'Add Purchase Order';
        const allParts = app.data.costAnalysis.parts || [];
        const allSuppliers = [...new Set(allParts.map(function(p) { return p.currentSupplier; }).filter(Boolean))].sort();
        const supplierListHtml = allSuppliers.map(function(s) { return '<option value="' + escapeHtml(s) + '">'; }).join('');

        const html = '<div class="modal-overlay" id="caPOModal">' +
            '<div class="modal">' +
            '<div class="modal-header"><h2>' + title + '</h2>' +
            '<button class="modal-close" onclick="document.getElementById(\'caPOModal\').remove()">&times;</button></div>' +
            '<div class="modal-body">' +
            '<div class="form-row">' +
            '<div class="form-group" style="flex:2;"><label class="form-label">PO Number *</label>' +
            '<input type="text" class="form-control" id="ca-po-num" value="' + escapeHtml(po ? po.poNumber : '') + '" placeholder="PO-2024-001"></div>' +
            '<div class="form-group" style="flex:1;"><label class="form-label">Date</label>' +
            '<input type="date" class="form-control" id="ca-po-date" value="' + escapeHtml(po ? po.date || '' : '') + '"></div>' +
            '</div>' +
            '<div class="form-group"><label class="form-label">Supplier</label>' +
            '<input type="text" class="form-control" id="ca-po-supplier" list="ca-po-sup-list" value="' + escapeHtml(po ? po.supplier || '' : '') + '" placeholder="Supplier name" autocomplete="off">' +
            '<datalist id="ca-po-sup-list">' + supplierListHtml + '</datalist></div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label class="form-label">Unit Cost ($) *</label>' +
            '<input type="number" class="form-control" id="ca-po-cost" value="' + (po ? po.unitCost : '') + '" min="0" step="0.0001" placeholder="0.00"></div>' +
            '<div class="form-group"><label class="form-label">Qty Purchased</label>' +
            '<input type="number" class="form-control" id="ca-po-qty" value="' + (po ? po.qty || '' : '') + '" min="0" step="1" placeholder="0"></div>' +
            '</div>' +
            '<div class="form-group"><label class="form-label">Notes</label>' +
            '<input type="text" class="form-control" id="ca-po-notes" value="' + escapeHtml(po ? po.notes || '' : '') + '" placeholder="Optional notes"></div>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button class="btn btn-secondary" onclick="document.getElementById(\'caPOModal\').remove()">Cancel</button>' +
            '<button class="btn btn-primary" onclick="window._ca.savePO(\'' + partId + '\', \'' + (poId || '') + '\')">Save</button>' +
            '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('ca-po-num').focus();
    }

    // Sync the part's primary cost fields from the most recent PO record.
    // This ensures the comparison table always reflects PO data no matter how it was entered.
    function _syncPrimaryFromPOs(part) {
        var pos = part.purchaseOrders || [];
        if (pos.length === 0) return;
        // Sort: entries with a date go first (most recent date), undated go last (added last = most recent)
        var sorted = pos.slice().sort(function(a, b) {
            if (a.date && b.date) return b.date.localeCompare(a.date);
            if (a.date) return -1;
            if (b.date) return 1;
            return pos.indexOf(b) - pos.indexOf(a); // preserve insertion order, latest last
        });
        var primary = sorted[0];
        part.currentPoNumber      = primary.poNumber  || part.currentPoNumber || '';
        part.currentUnitCost      = primary.unitCost  != null ? primary.unitCost : part.currentUnitCost;
        part.currentQtyPurchased  = primary.qty       != null ? primary.qty    : part.currentQtyPurchased;
        if (!part.currentSupplier && primary.supplier) part.currentSupplier = primary.supplier;
    }

    function savePO(partId, poId) {
        const part = getPart(partId);
        if (!part) return;
        if (!part.purchaseOrders) part.purchaseOrders = [];

        const poNumber = document.getElementById('ca-po-num').value.trim();
        const cost     = parseFloat(document.getElementById('ca-po-cost').value);
        if (!poNumber) { showToast('PO Number is required', 'error'); return; }
        if (isNaN(cost) || cost < 0) { showToast('Valid unit cost is required', 'error'); return; }

        const fields = {
            poNumber,
            supplier: document.getElementById('ca-po-supplier').value.trim(),
            unitCost: cost,
            qty:      parseFloat(document.getElementById('ca-po-qty').value) || null,
            date:     document.getElementById('ca-po-date').value || '',
            notes:    document.getElementById('ca-po-notes').value.trim()
        };

        if (poId) {
            const idx = part.purchaseOrders.findIndex(function(x) { return x.id === poId; });
            if (idx >= 0) Object.assign(part.purchaseOrders[idx], fields);
        } else {
            part.purchaseOrders.push(Object.assign({ id: generateId() }, fields));
        }

        // Keep comparison table in sync — primary fields reflect the most recent PO
        _syncPrimaryFromPOs(part);

        saveData();
        document.getElementById('caPOModal').remove();
        showToast(poId ? 'PO updated' : 'PO added');
        // Refresh detail modal
        const dm = document.getElementById('caDetailModal');
        if (dm) { dm.remove(); showPartDetailModal(partId); }
    }

    function deletePO(partId, poId) {
        if (!confirm('Delete this PO record?')) return;
        const part = getPart(partId);
        if (!part) return;
        part.purchaseOrders = (part.purchaseOrders || []).filter(function(x) { return x.id !== poId; });
        // Re-sync primary fields after deletion
        _syncPrimaryFromPOs(part);
        saveData();
        showToast('PO deleted');
        const dm = document.getElementById('caDetailModal');
        if (dm) { dm.remove(); showPartDetailModal(partId); }
    }

    function showPartDetailModal(partId) {
        const part = getPart(partId);
        if (!part) return;

        const rfqs = part.rfqs || [];
        const best = getBestRFQ(part);
        const ihCost = computeInHouseUnitCost(part);
        const allParts = app.data.costAnalysis.parts || [];

        // Lineage
        const aliases = part.aliases || [];
        let lineageHtml = '';
        if (aliases.length > 0) {
            lineageHtml += '<span><strong>Aliases:</strong> ' + escapeHtml(aliases.join(', ')) + '</span>';
        }
        if (part.supersedesPartId) {
            const pred = allParts.find(p => p.id === part.supersedesPartId);
            if (pred) lineageHtml += '<span><strong>Supersedes:</strong> ' + escapeHtml(pred.partNumber) + (pred.description ? ' — ' + escapeHtml(pred.description) : '') + '</span>';
        }
        const supersededBy = allParts.find(p => p.supersedesPartId === partId);
        if (supersededBy) {
            lineageHtml += '<span><strong>Superseded by:</strong> ' + escapeHtml(supersededBy.partNumber) + ' <span class="cost-archived-badge">Current</span></span>';
        }

        const detailProducts = app.data.products || [];
        const partProductIds = part.productIds || [];
        if (partProductIds.length > 0) {
            const prodTags = partProductIds.map(pid => {
                const pr = detailProducts.find(x => x.id === pid);
                return pr ? '<span class="cost-product-tag">' + escapeHtml(pr.code || pr.name) + '</span>' : '';
            }).filter(Boolean).join(' ');
            if (prodTags) lineageHtml += '<span><strong>Products:</strong> ' + prodTags + '</span>';
        }

        const rfqRows = rfqs.length === 0
            ? `<tr><td colspan="9" class="muted" style="text-align:center;padding:16px;">No RFQs yet.</td></tr>`
            : rfqs.map(r => {
                const qpb = Number(part.qpb) || 0;
                const perBoat = (Number(r.unitCost) || 0) * qpb;
                const isBest = best && r.id === best.id;
                return `<tr class="${isBest ? 'cost-best-row' : ''}">
                    <td>${escapeHtml(r.supplier)}${isBest ? ' <span class="cost-best-badge">Best</span>' : ''}</td>
                    <td>${escapeHtml(r.quoteRef || '')}</td>
                    <td>${fmt$(r.unitCost)}</td>
                    <td>${fmt$(perBoat)}</td>
                    <td>${r.leadTimeDays ? r.leadTimeDays + ' days' : '—'}</td>
                    <td>${r.moq || '—'}</td>
                    <td>${r.validUntil ? escapeHtml(r.validUntil) : '—'}</td>
                    <td>${escapeHtml(r.notes || '')}</td>
                    <td class="cost-table-actions">
                        <button class="btn btn-secondary btn-small" onclick="window._ca.showAddRFQModal('${partId}', '${r.id}')">Edit</button>
                        <button class="btn btn-danger btn-small" onclick="window._ca.deleteRFQ('${partId}', '${r.id}')">Del</button>
                    </td>
                </tr>`;
            }).join('');

        // In-house breakdown
        let ihSection = '';
        if (part.inHouse && (part.inHouse.operations && part.inHouse.operations.length > 0 || part.inHouse.laborOperations && part.inHouse.laborOperations.length > 0 || ihCost !== null)) {
            const ih = part.inHouse;
            const ops = ih.operations || [];
            const laborOps = ih.laborOperations || [];
            const qty = Number(ih.qtyRan) || 1;
            const machTotal = ops.reduce((s, o) => s + ((o.hours || 0) / qty) * (o.ratePerHour || 0), 0);
            const laborTotal = laborOps.reduce((s, o) => s + ((o.hours || 0) / qty) * (o.ratePerHour || 0), 0);

            // Linked raw material
            const linkedRm = getRawMaterial(ih.rawMaterialId);
            let matHtml = '';
            if (linkedRm) {
                matHtml = '<span><strong>Raw Material:</strong> ' + escapeHtml(linkedRm.partNumber) +
                    (linkedRm.description ? ' — ' + escapeHtml(linkedRm.description) : '') + '</span>' +
                    '<span><strong>Material UOM:</strong> ' + escapeHtml(linkedRm.uom || '') + ' @ ' + fmt$(linkedRm.costPerUom) + '</span>' +
                    (linkedRm.supplier ? '<span><strong>Supplier:</strong> ' + escapeHtml(linkedRm.supplier) + '</span>' : '') +
                    (ih.usedPerPart != null ? '<span><strong>Used/part:</strong> ' + ih.usedPerPart + ' ' + escapeHtml(linkedRm.uom || '') + '</span>' : '');
            } else if (ih.materialPartNumber || ih.materialDescription) {
                // Legacy display
                matHtml = (ih.materialPartNumber ? '<span><strong>Material PN:</strong> ' + escapeHtml(ih.materialPartNumber) + '</span>' : '') +
                    (ih.materialDescription ? '<span><strong>Material:</strong> ' + escapeHtml(ih.materialDescription) + '</span>' : '') +
                    (ih.materialUsedPerPart != null ? '<span><strong>Used/part:</strong> ' + ih.materialUsedPerPart + (ih.materialUom ? ' ' + escapeHtml(ih.materialUom) : '') + '</span>' : '');
            }

            const opsTableRows = ops.map(o => {
                const wc = o.workCenterId ? getWorkCenter(o.workCenterId) : null;
                const rate = wc ? Number(wc.ratePerHour) : (Number(o.ratePerHour) || 0);
                const wcLabel = wc ? ' <span class="muted" style="font-size:10px;">(' + escapeHtml(wc.name) + ')</span>' : '';
                return '<tr>' +
                    '<td>' + escapeHtml(o.machine) + wcLabel + '</td>' +
                    '<td>' + o.hours + '</td>' +
                    '<td>' + fmt$(rate) + '</td>' +
                    '<td>' + fmt$((o.hours / qty) * rate) + '</td>' +
                    '</tr>';
            }).join('');

            ihSection = `
                <div class="cost-form-section-label" style="margin-top:20px;">In-House Cost Breakdown</div>
                ${ops.length > 0 ? `<div class="cost-table-wrap" style="margin-bottom:8px;">
                    <table class="cost-table">
                        <thead><tr><th>Machine</th><th>Total Hrs</th><th>Rate/hr</th><th>$/unit</th></tr></thead>
                        <tbody>${opsTableRows}</tbody>
                    </table>
                </div>` : ''}
                <div class="cost-detail-meta">
                    ${matHtml}
                    <span><strong>Qty Ran:</strong> ${qty}</span>
                    ${ops.length > 0 ? '<span><strong>Machine Total/unit:</strong> ' + fmt$(machTotal) + '</span>' : ''}
                    <span><strong>Overhead:</strong> ${ih.overheadPct || 0}%</span>
                    ${ihCost !== null ? '<span><strong>Total $/unit:</strong> <strong>' + fmt$(ihCost) + '</strong></span>' : ''}
                </div>`;
            if (laborOps.length > 0) {
                const laborRowsHtml = laborOps.map(o => '<tr>' +
                    '<td>' + escapeHtml(o.task) + '</td>' +
                    '<td>' + o.hours + '</td>' +
                    '<td>' + fmt$(o.ratePerHour) + '</td>' +
                    '<td>' + fmt$((o.hours / qty) * o.ratePerHour) + '</td>' +
                    '</tr>').join('');
                ihSection +=
                    '<div class="cost-form-section-label" style="margin-top:12px;">Labor</div>' +
                    '<div class="cost-table-wrap" style="margin-bottom:8px;">' +
                    '<table class="cost-table"><thead><tr>' +
                    '<th>Task / Role</th><th>Total Hrs</th><th>Rate/hr</th><th>$/unit</th>' +
                    '</tr></thead><tbody>' + laborRowsHtml + '</tbody></table></div>' +
                    '<div class="cost-detail-meta" style="margin-top:8px;">' +
                    '<span><strong>Labor Total/unit:</strong> ' + fmt$(laborTotal) + '</span>' +
                    '</div>';
            }
        }

        const purchaseOrders = part.purchaseOrders || [];
        const hasPrimaryPO = part.currentPoNumber || part.currentUnitCost > 0;
        const poRows = [];
        if (hasPrimaryPO) {
            const tot = (part.currentUnitCost || 0) * (part.currentQtyPurchased || 0);
            poRows.push('<tr>' +
                '<td><span class="cost-archived-badge" style="background:var(--accent);color:#000;">Primary</span> ' + escapeHtml(part.currentPoNumber || '—') + '</td>' +
                '<td>' + escapeHtml(part.currentSupplier || '—') + '</td>' +
                '<td>' + fmt$(part.currentUnitCost) + '</td>' +
                '<td>' + (part.currentQtyPurchased != null ? part.currentQtyPurchased : '—') + '</td>' +
                '<td>' + (tot > 0 ? fmt$(tot) : '—') + '</td>' +
                '<td>—</td>' +
                '<td></td>' +
                '</tr>');
        }
        purchaseOrders.forEach(function(po) {
            const tot = (po.unitCost || 0) * (po.qty || 0);
            poRows.push('<tr>' +
                '<td>' + escapeHtml(po.poNumber) + '</td>' +
                '<td>' + escapeHtml(po.supplier || '—') + '</td>' +
                '<td>' + fmt$(po.unitCost) + '</td>' +
                '<td>' + (po.qty != null ? po.qty : '—') + '</td>' +
                '<td>' + (tot > 0 ? fmt$(tot) : '—') + '</td>' +
                '<td>' + escapeHtml(po.date || '—') + '</td>' +
                '<td class="cost-table-actions">' +
                '<button class="btn btn-secondary btn-small" onclick="window._ca.showPOModal(\'' + partId + '\', \'' + po.id + '\')">Edit</button>' +
                '<button class="btn btn-danger btn-small" onclick="window._ca.deletePO(\'' + partId + '\', \'' + po.id + '\')">Del</button>' +
                '</td></tr>');
        });
        const poSection = '<div style="margin-bottom:4px;display:flex;align-items:center;gap:10px;">' +
            '<button class="btn btn-primary btn-small" onclick="window._ca.showPOModal(\'' + partId + '\')">+ Add PO</button>' +
            '</div>' +
            '<div class="cost-table-wrap"><table class="cost-table">' +
            '<thead><tr><th>PO Number</th><th>Supplier</th><th>$/unit</th><th>Qty</th><th>Total</th><th>Date</th><th>Actions</th></tr></thead>' +
            '<tbody>' + (poRows.length > 0 ? poRows.join('') : '<tr><td colspan="7" class="muted" style="text-align:center;padding:12px;">No PO records yet.</td></tr>') + '</tbody>' +
            '</table></div>';

        const html = `
        <div class="modal-overlay" id="caDetailModal">
            <div class="modal modal-wide">
                <div class="modal-header">
                    <h2>${escapeHtml(part.partNumber)} — ${escapeHtml(part.description || '')}</h2>
                    <button class="modal-close" onclick="document.getElementById('caDetailModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="cost-detail-meta">
                        <span><strong>Supplier:</strong> ${escapeHtml(part.currentSupplier || '—')}</span>
                        <span><strong>PO:</strong> ${escapeHtml(part.currentPoNumber || '—')}</span>
                        <span><strong>Unit Cost:</strong> ${fmt$(part.currentUnitCost)}</span>
                        <span><strong>PO Qty:</strong> ${part.currentQtyPurchased != null ? part.currentQtyPurchased : '—'}</span>
                        <span><strong>PO Total:</strong> ${(part.currentQtyPurchased != null && part.currentUnitCost) ? fmt$(Number(part.currentQtyPurchased) * Number(part.currentUnitCost)) : '—'}</span>
                        <span><strong>UOM:</strong> ${escapeHtml(part.unitOfMeasure || 'ea')}</span>
                        <span><strong>QPB:</strong> ${part.qpb}</span>
                        <span><strong>Cost/Boat:</strong> ${fmt$(((Number(part.currentUnitCost) || 0) + (part.surfaceFinish ? Number(part.surfaceFinish.costPerPart) || 0 : 0)) * (Number(part.qpb) || 0))}</span>
                        ${ihCost !== null ? `<span><strong>In-House $/unit:</strong> ${fmt$(ihCost)}</span>` : ''}
                        ${part.surfaceFinish && part.surfaceFinish.type ? `<span><strong>Surface Finish:</strong> ${part.surfaceFinish.type === 'anodizing' ? 'Anodizing' : 'Powder Coating'} — ${fmt$(part.surfaceFinish.costPerPart || 0)}/part${part.surfaceFinish.supplier ? ' · ' + escapeHtml(part.surfaceFinish.supplier) : ''}${part.surfaceFinish.notes ? ' · ' + escapeHtml(part.surfaceFinish.notes) : ''}</span>` : ''}
                        ${lineageHtml}
                    </div>

                    ${ihSection}

                    ${poSection}

                    <div style="margin: 16px 0 8px;">
                        <button class="btn btn-primary btn-small" onclick="window._ca.showAddRFQModal('${partId}')">+ Add RFQ</button>
                        <button class="btn btn-secondary btn-small" onclick="window._ca.showInHouseCostModal('${partId}')">In-House Cost</button>
                    </div>

                    <div class="cost-form-section-label">Competing RFQs</div>
                    <div class="cost-table-wrap">
                        <table class="cost-table">
                            <thead>
                                <tr>
                                    <th>Supplier</th><th>Quote Ref</th><th>$/unit</th><th>$/boat</th>
                                    <th>Lead Time</th><th>MOQ</th><th>Valid Until</th><th>Notes</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>${rfqRows}</tbody>
                        </table>
                    </div>

                    ${_renderMakeVsBuyPanel(partId)}

                    ${renderMOQAnalysisSection(part)}

                    ${renderPriceHistorySection(part)}

                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="window._ca.showEditPartModal('${partId}'); document.getElementById('caDetailModal').remove()">Edit Part</button>
                    <button class="btn btn-danger" onclick="window._ca.deletePart('${partId}')">Delete Part</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('caDetailModal').remove()">Close</button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    // ─── Add / Edit RFQ Modal ─────────────────────────────────────────────────

    function showAddRFQModal(partId, rfqId) {
        const part = getPart(partId);
        if (!part) return;
        const rfq = rfqId ? (part.rfqs || []).find(r => r.id === rfqId) : null;
        const title = rfq ? 'Edit RFQ' : 'Add RFQ';

        const html = `
        <div class="modal-overlay" id="caRFQModal">
            <div class="modal">
                <div class="modal-header">
                    <h2>${title} — ${escapeHtml(part.partNumber)}</h2>
                    <button class="modal-close" onclick="document.getElementById('caRFQModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Supplier *</label>
                        <input type="text" class="form-control" id="ca-rfq-supplier" value="${escapeHtml(rfq ? rfq.supplier : '')}" placeholder="Beta Supply">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Quote Reference</label>
                            <input type="text" class="form-control" id="ca-rfq-ref" value="${escapeHtml(rfq ? rfq.quoteRef || '' : '')}" placeholder="RFQ-2024-05">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Unit Cost ($) *</label>
                            <input type="number" class="form-control" id="ca-rfq-cost" value="${rfq ? rfq.unitCost : ''}" min="0" step="0.0001" placeholder="0.00">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Lead Time (days)</label>
                            <input type="number" class="form-control" id="ca-rfq-lt" value="${rfq ? rfq.leadTimeDays || '' : ''}" min="0" placeholder="21">
                        </div>
                        <div class="form-group">
                            <label class="form-label">MOQ</label>
                            <input type="number" class="form-control" id="ca-rfq-moq" value="${rfq ? rfq.moq || '' : ''}" min="0" placeholder="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Valid Until</label>
                        <input type="date" class="form-control" id="ca-rfq-valid" value="${rfq ? rfq.validUntil || '' : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Negotiation Stage</label>
                        <select class="form-control" id="ca-rfq-stage">
                            ${['Identified','Contacted','Quoted','Negotiating','Awarded','Declined'].map(s => '<option value="' + s + '"' + ((rfq ? rfq.negotiationStage : 'Identified') === s ? ' selected' : '') + '>' + s + '</option>').join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea class="form-control" id="ca-rfq-notes" rows="2" placeholder="Any conditions, terms, or notes">${rfq ? escapeHtml(rfq.notes || '') : ''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('caRFQModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="window._ca.saveRFQ('${partId}', '${rfqId || ''}')">Save</button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('ca-rfq-supplier').focus();
    }

    function saveRFQ(partId, rfqId) {
        const supplier = document.getElementById('ca-rfq-supplier').value.trim();
        const cost = parseFloat(document.getElementById('ca-rfq-cost').value);
        if (!supplier) { showToast('Supplier is required', 'error'); return; }
        if (isNaN(cost) || cost < 0) { showToast('Valid unit cost is required', 'error'); return; }

        const part = getPart(partId);
        if (!part) return;
        if (!part.rfqs) part.rfqs = [];

        const rfqData = {
            supplier,
            quoteRef: document.getElementById('ca-rfq-ref').value.trim(),
            unitCost: cost,
            leadTimeDays: parseInt(document.getElementById('ca-rfq-lt').value) || 0,
            moq: parseInt(document.getElementById('ca-rfq-moq').value) || 0,
            validUntil: document.getElementById('ca-rfq-valid').value || '',
            notes: document.getElementById('ca-rfq-notes').value.trim(),
            negotiationStage: document.getElementById('ca-rfq-stage').value || 'Identified'
        };

        const prevStage = rfqId ? ((part.rfqs.find(r => r.id === rfqId) || {}).negotiationStage || '') : '';
        if (rfqId) {
            const idx = part.rfqs.findIndex(r => r.id === rfqId);
            if (idx >= 0) Object.assign(part.rfqs[idx], rfqData);
        } else {
            part.rfqs.push(Object.assign({ id: generateId() }, rfqData));
        }

        // Auto-log price history when RFQ is awarded
        if (rfqData.negotiationStage === 'Awarded' && prevStage !== 'Awarded') {
            logPriceHistory(partId, {
                date: new Date().toISOString().slice(0, 10),
                unitCost: rfqData.unitCost,
                source: 'rfq',
                supplier: rfqData.supplier,
                note: 'RFQ awarded' + (rfqData.quoteRef ? ' · ' + rfqData.quoteRef : '')
            });
        }

        saveData();
        document.getElementById('caRFQModal').remove();
        showToast(rfqId ? 'RFQ updated' : 'RFQ added');
        const dm = document.getElementById('caDetailModal');
        if (dm) { dm.remove(); showPartDetailModal(partId); }
        renderCostAnalysisPage();
    }

    function deleteRFQ(partId, rfqId) {
        if (!confirm('Delete this RFQ?')) return;
        const part = getPart(partId);
        if (!part) return;
        part.rfqs = (part.rfqs || []).filter(r => r.id !== rfqId);
        saveData();
        showToast('RFQ deleted');
        const dm = document.getElementById('caDetailModal');
        if (dm) { dm.remove(); showPartDetailModal(partId); }
        renderCostAnalysisPage();
    }

    // ─── Quarterly Snapshots ──────────────────────────────────────────────────

    function showCaptureSnapshotModal() {
        const now = new Date();
        const currentQ = 'Q' + Math.ceil((now.getMonth() + 1) / 3);
        const currentY = now.getFullYear();

        const html = `
        <div class="modal-overlay" id="caSnapModal">
            <div class="modal">
                <div class="modal-header">
                    <h2>Capture Quarter Snapshot</h2>
                    <button class="modal-close" onclick="document.getElementById('caSnapModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="muted" style="margin-bottom:16px;">Saves the current costs for all parts as a snapshot you can compare against later.</p>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Quarter</label>
                            <select class="form-control" id="ca-snap-q">
                                <option ${currentQ === 'Q1' ? 'selected' : ''}>Q1</option>
                                <option ${currentQ === 'Q2' ? 'selected' : ''}>Q2</option>
                                <option ${currentQ === 'Q3' ? 'selected' : ''}>Q3</option>
                                <option ${currentQ === 'Q4' ? 'selected' : ''}>Q4</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Year</label>
                            <input type="number" class="form-control" id="ca-snap-y" value="${currentY}" min="2020" max="2040">
                        </div>
                    </div>
                    <p style="font-size:13px; color:var(--muted);">${(app.data.costAnalysis.parts || []).length} part(s) will be snapshotted.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('caSnapModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="window._ca.captureSnapshot()">Capture</button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    function captureSnapshot() {
        const q = document.getElementById('ca-snap-q').value;
        const y = document.getElementById('ca-snap-y').value;
        const label = q + ' ' + y;
        ensureCostAnalysisData();
        const parts = app.data.costAnalysis.parts || [];

        const snapshot = {
            id: generateId(),
            quarter: label,
            capturedAt: new Date().toISOString().slice(0, 10),
            parts: parts.map(p => ({
                partId: p.id,
                partNumber: p.partNumber,
                currentUnitCost: Number(p.currentUnitCost) || 0,
                inHouseUnitCost: computeInHouseUnitCost(p),
                bestRFQUnitCost: (() => { const b = getBestRFQ(p); return b ? Number(b.unitCost) : null; })(),
                bestRFQSupplier: (() => { const b = getBestRFQ(p); return b ? b.supplier : null; })()
            }))
        };

        app.data.costAnalysis.quarterlySnapshots.push(snapshot);
        saveData();
        document.getElementById('caSnapModal').remove();
        showToast('Snapshot captured: ' + label);
        _viewMode = 'quarterly';
        renderCostAnalysisPage();
    }

    function deleteSnapshot(snapshotId) {
        if (!confirm('Delete this quarterly snapshot?')) return;
        app.data.costAnalysis.quarterlySnapshots =
            (app.data.costAnalysis.quarterlySnapshots || []).filter(s => s.id !== snapshotId);
        saveData();
        showToast('Snapshot deleted');
        renderCostAnalysisPage();
    }

    // ─── Parts: Paste / CSV Import / Export ───────────────────────────────────

    function showPasteImportModal() {
        const html = `
        <div class="modal-overlay" id="caPasteModal">
            <div class="modal modal-wide">
                <div class="modal-header">
                    <h2>Paste from Excel — Parts</h2>
                    <button class="modal-close" onclick="document.getElementById('caPasteModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="muted" style="margin-bottom:12px;">
                        Copy cells from Excel and paste below. Expected columns (tab or comma separated):<br>
                        <code>Part Number, Description, Supplier, PO Number, Unit Cost, QPB, UOM</code>
                    </p>
                    <textarea class="form-control re-plain" id="ca-paste-area" rows="10"
                        placeholder="Paste Excel data here (include header row)..."></textarea>
                    <div id="ca-paste-preview"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('caPasteModal').remove()">Cancel</button>
                    <button class="btn btn-secondary" onclick="window._ca.previewPaste()">Preview</button>
                    <button class="btn btn-primary" id="ca-paste-import-btn" style="display:none" onclick="window._ca.commitPasteImport()">Import</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('ca-paste-area').focus();
    }

    function previewPaste() {
        const text = document.getElementById('ca-paste-area').value;
        const rows = parseImportData(text);
        const preview = document.getElementById('ca-paste-preview');
        if (rows.length === 0) {
            preview.innerHTML = '<p class="muted" style="margin-top:12px;">No valid rows detected. Check format.</p>';
            document.getElementById('ca-paste-import-btn').style.display = 'none';
            return;
        }
        preview.innerHTML = renderPreviewTable(rows);
        document.getElementById('ca-paste-import-btn').style.display = '';
    }

    function commitPasteImport() {
        const text = document.getElementById('ca-paste-area').value;
        commitImport(parseImportData(text));
        document.getElementById('caPasteModal').remove();
    }

    function handleCSVUpload(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const rows = parseImportData(e.target.result);
            if (rows.length === 0) { showToast('No valid rows found in file', 'error'); return; }
            showCSVPreviewModal(rows);
        };
        reader.readAsText(file);
        input.value = '';
    }

    let _pendingCSVRows = null;

    function showCSVPreviewModal(rows) {
        _pendingCSVRows = rows;
        const html = `
        <div class="modal-overlay" id="caCSVPreviewModal">
            <div class="modal modal-wide">
                <div class="modal-header">
                    <h2>CSV Import Preview — Parts</h2>
                    <button class="modal-close" onclick="document.getElementById('caCSVPreviewModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="muted" style="margin-bottom:12px;">${rows.length} row(s) detected. Existing part numbers will be updated; new ones will be added.</p>
                    ${renderPreviewTable(rows)}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('caCSVPreviewModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="window._ca._commitCSVImport()">Import ${rows.length} Part(s)</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function _commitCSVImport() {
        if (_pendingCSVRows) { commitImport(_pendingCSVRows); _pendingCSVRows = null; }
        const m = document.getElementById('caCSVPreviewModal');
        if (m) m.remove();
    }

    function parseImportData(text) {
        if (!text || !text.trim()) return [];
        const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return [];
        const delim = lines[0].includes('\t') ? '\t' : ',';

        function parseLine(line) {
            if (delim === '\t') return line.split('\t');
            const result = [];
            let inQ = false, cur = '';
            for (let i = 0; i < line.length; i++) {
                if (line[i] === '"') { inQ = !inQ; }
                else if (line[i] === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
                else { cur += line[i]; }
            }
            result.push(cur.trim());
            return result;
        }

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = parseLine(lines[i]);
            const pn = (cols[0] || '').trim();
            if (!pn) continue;
            const unitCost = parseFloat((cols[4] || '').replace(/[$,]/g, ''));
            const qpb = parseFloat((cols[5] || '').replace(/,/g, ''));
            rows.push({
                partNumber: pn,
                description: (cols[1] || '').trim(),
                currentSupplier: (cols[2] || '').trim(),
                currentPoNumber: (cols[3] || '').trim(),
                currentUnitCost: isNaN(unitCost) ? 0 : unitCost,
                qpb: isNaN(qpb) ? 1 : qpb,
                unitOfMeasure: (cols[6] || 'ea').trim() || 'ea'
            });
        }
        return rows;
    }

    function renderPreviewTable(rows) {
        const existing = new Set((app.data.costAnalysis.parts || []).map(p => p.partNumber));
        const tbody = rows.map(r => `<tr>
            <td>${escapeHtml(r.partNumber)}</td>
            <td>${escapeHtml(r.description)}</td>
            <td>${escapeHtml(r.currentSupplier)}</td>
            <td>${escapeHtml(r.currentPoNumber)}</td>
            <td>${fmt$(r.currentUnitCost)}</td>
            <td>${r.qpb}</td>
            <td>${escapeHtml(r.unitOfMeasure)}</td>
            <td>${existing.has(r.partNumber) ? '<span class="cost-badge-update">Update</span>' : '<span class="cost-badge-new">New</span>'}</td>
        </tr>`).join('');

        return `<div class="cost-table-wrap" style="margin-top:16px;">
            <table class="cost-table">
                <thead><tr><th>Part #</th><th>Description</th><th>Supplier</th><th>Unit Cost</th><th>QPB</th><th>UOM</th><th>Action</th></tr></thead>
                <tbody>${tbody}</tbody>
            </table>
        </div>`;
    }

    function commitImport(rows) {
        ensureCostAnalysisData();
        const parts = app.data.costAnalysis.parts;
        let updated = 0, added = 0;
        rows.forEach(r => {
            const idx = parts.findIndex(p => p.partNumber === r.partNumber);
            if (idx >= 0) { Object.assign(parts[idx], r); updated++; }
            else { parts.push(Object.assign({ id: generateId(), rfqs: [], inHouse: null, aliases: [], supersedesPartId: null }, r)); added++; }
        });
        saveData();
        showToast('Imported: ' + added + ' added, ' + updated + ' updated');
        renderCostAnalysisPage();
    }

    function exportCostCSV() {
        const parts = app.data.costAnalysis.parts || [];
        const header = 'Part #,Aliases,Description,UOM,QPB,Supplier,Commodity,PO Number,Current $/unit,PO Qty,PO Total,In-House $/unit,Current $/boat,Best RFQ Supplier,Best $/unit,Best $/boat,Savings/boat,Savings %,Lead Time (best)';

        const csvRows = parts.map(p => {
            const qpb = Number(p.qpb) || 0;
            const cur = Number(p.currentUnitCost) || 0;
            const qtyPurch = p.currentQtyPurchased != null ? Number(p.currentQtyPurchased) : '';
            const poTotal = qtyPurch !== '' ? (cur * qtyPurch).toFixed(4) : '';
            const ihCost = computeInHouseUnitCost(p);
            const curBoat = cur * qpb;
            const best = getBestRFQ(p);
            const bestCost = best ? Number(best.unitCost) : '';
            const bestBoat = best ? bestCost * qpb : '';
            const savBoat = best ? curBoat - bestBoat : '';
            const savPct = (savBoat !== '' && curBoat > 0) ? ((savBoat / curBoat) * 100).toFixed(1) : '';
            const lt = best ? best.leadTimeDays || '' : '';
            function q(v) { return '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"'; }
            return [
                q(p.partNumber), q((p.aliases || []).join(', ')), q(p.description), q(p.unitOfMeasure || 'ea'),
                qpb, q(p.currentSupplier), q(p.commodity || ''), q(p.currentPoNumber || ''),
                cur.toFixed(4), qtyPurch, poTotal,
                ihCost !== null ? ihCost.toFixed(4) : '',
                curBoat.toFixed(4),
                q(best ? best.supplier : ''),
                bestCost !== '' ? bestCost.toFixed(4) : '',
                bestBoat !== '' ? bestBoat.toFixed(4) : '',
                savBoat !== '' ? savBoat.toFixed(4) : '',
                savPct, lt
            ].join(',');
        });

        const csv = header + '\n' + csvRows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'cost-analysis.csv'; a.click();
        URL.revokeObjectURL(url);
        showToast('CSV exported');
    }

    // ─── Work Centers View ────────────────────────────────────────────────────

    function renderWorkCentersView() {
        const wcs = app.data.costAnalysis.workCenters || [];

        // Count usage per work center
        const parts = app.data.costAnalysis.parts || [];
        const usageMap = {};
        parts.forEach(function(p) {
            const ops = (p.inHouse && p.inHouse.operations) || [];
            ops.forEach(function(o) {
                if (o.workCenterId) usageMap[o.workCenterId] = (usageMap[o.workCenterId] || 0) + 1;
            });
        });

        const toolbar = '<div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">' +
            '<button class="btn btn-primary" onclick="window._ca.showWorkCenterForm()">+ Add Work Center</button>' +
            '<button class="btn btn-secondary" onclick="window._ca.showWCPasteModal()">Paste from Excel</button>' +
            '<label class="btn btn-secondary" style="cursor:pointer;">Upload CSV<input type="file" accept=".csv" style="display:none;" onchange="window._ca.handleWCCSVUpload(this)"></label>' +
            '<button class="btn btn-secondary" onclick="window._ca.exportWCCSV()">Export CSV</button>' +
            '</div>';

        if (wcs.length === 0) {
            return toolbar + '<div class="cost-quarterly-empty"><p>No work centers defined yet. Add your machines and their standard hourly rates.</p></div>';
        }

        const rows = wcs.map(function(w) {
            const usedBy = usageMap[w.id] || 0;
            const usedBadge = usedBy > 0
                ? '<span class="cost-rm-used-badge is-used">' + usedBy + ' op' + (usedBy !== 1 ? 's' : '') + '</span>'
                : '<span class="cost-rm-used-badge">' + usedBy + '</span>';
            return '<tr>' +
                '<td><strong>' + escapeHtml(w.name) + '</strong></td>' +
                '<td>' + fmt$(w.ratePerHour) + '</td>' +
                '<td>' + escapeHtml(w.notes || '') + '</td>' +
                '<td>' + usedBadge + '</td>' +
                '<td class="cost-table-actions">' +
                    '<button class="btn btn-secondary btn-small" onclick="window._ca.showWorkCenterForm(\'' + w.id + '\')">Edit</button>' +
                    ' <button class="btn btn-danger btn-small" onclick="window._ca.deleteWorkCenter(\'' + w.id + '\')">Delete</button>' +
                '</td>' +
                '</tr>';
        }).join('');

        return toolbar +
            '<div class="cost-table-wrap">' +
            '<table class="cost-table"><thead><tr>' +
            '<th>Work Center / Machine</th><th>Rate / hr ($)</th><th>Notes</th><th>Used In</th><th>Actions</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    // ─── Work Centers CRUD ────────────────────────────────────────────────────

    function showWorkCenterForm(wcId) {
        const wc = wcId ? getWorkCenter(wcId) : null;
        const title = wc ? 'Edit Work Center' : 'Add Work Center';
        const html = '<div class="modal-overlay" id="caWCModal">' +
            '<div class="modal">' +
            '<div class="modal-header"><h2>' + title + '</h2>' +
            '<button class="modal-close" onclick="document.getElementById(\'caWCModal\').remove()">&times;</button></div>' +
            '<div class="modal-body">' +
            '<div class="form-group"><label class="form-label">Work Center / Machine Name *</label>' +
            '<input type="text" class="form-control" id="ca-wc-name" value="' + escapeHtml(wc ? wc.name : '') + '" placeholder="CNC Mill"></div>' +
            '<div class="form-group"><label class="form-label">Rate / hr ($) *</label>' +
            '<input type="number" class="form-control" id="ca-wc-rate" value="' + (wc ? wc.ratePerHour : '') + '" min="0" step="0.01" placeholder="0.00"></div>' +
            '<div class="form-group"><label class="form-label">Notes</label>' +
            '<input type="text" class="form-control" id="ca-wc-notes" value="' + escapeHtml(wc ? wc.notes || '' : '') + '" placeholder="Optional notes"></div>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button class="btn btn-secondary" onclick="document.getElementById(\'caWCModal\').remove()">Cancel</button>' +
            '<button class="btn btn-primary" onclick="window._ca.saveWorkCenter(\'' + (wcId || '') + '\')">Save</button>' +
            '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('ca-wc-name').focus();
    }

    function saveWorkCenter(wcId) {
        const name = document.getElementById('ca-wc-name').value.trim();
        const rate = parseFloat(document.getElementById('ca-wc-rate').value);
        if (!name) { showToast('Work center name is required', 'error'); return; }
        if (isNaN(rate) || rate < 0) { showToast('Valid rate is required', 'error'); return; }

        ensureCostAnalysisData();
        const wcs = app.data.costAnalysis.workCenters;
        const fields = { name, ratePerHour: rate, notes: document.getElementById('ca-wc-notes').value.trim() };

        if (wcId) {
            const idx = wcs.findIndex(w => w.id === wcId);
            if (idx !== -1) Object.assign(wcs[idx], fields);
        } else {
            wcs.push(Object.assign({ id: generateId() }, fields));
        }
        saveData();
        document.getElementById('caWCModal').remove();
        showToast(wcId ? 'Work center updated' : 'Work center added');
        renderCostAnalysisPage();
    }

    function deleteWorkCenter(wcId) {
        const parts = app.data.costAnalysis.parts || [];
        const usageCount = parts.reduce(function(n, p) {
            return n + ((p.inHouse && p.inHouse.operations || []).filter(o => o.workCenterId === wcId).length);
        }, 0);
        const msg = usageCount > 0
            ? 'This work center is used in ' + usageCount + ' operation(s). Delete anyway? Those ops will revert to manual rate.'
            : 'Delete this work center?';
        if (!confirm(msg)) return;

        // Clear references
        parts.forEach(function(p) {
            if (p.inHouse && p.inHouse.operations) {
                p.inHouse.operations.forEach(function(o) {
                    if (o.workCenterId === wcId) o.workCenterId = null;
                });
            }
        });
        app.data.costAnalysis.workCenters = (app.data.costAnalysis.workCenters || []).filter(w => w.id !== wcId);
        saveData();
        showToast('Work center deleted');
        renderCostAnalysisPage();
    }

    function showWCPasteModal() {
        const html = '<div class="modal-overlay" id="caWCPasteModal">' +
            '<div class="modal modal-wide">' +
            '<div class="modal-header"><h2>Paste Work Centers from Excel</h2>' +
            '<button class="modal-close" onclick="document.getElementById(\'caWCPasteModal\').remove()">&times;</button></div>' +
            '<div class="modal-body">' +
            '<p class="muted" style="font-size:12px;margin-bottom:8px;">Expected columns: <strong>Work Center Name | Rate/hr | Notes</strong></p>' +
            '<textarea class="form-control re-plain" id="ca-wc-paste-area" rows="10" placeholder="Paste from Excel here..."></textarea>' +
            '<div id="ca-wc-paste-preview" style="margin-top:12px;"></div>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button class="btn btn-secondary" onclick="document.getElementById(\'caWCPasteModal\').remove()">Cancel</button>' +
            '<button class="btn btn-secondary" onclick="window._ca._previewWCPaste()">Preview</button>' +
            '<button class="btn btn-primary" id="ca-wc-paste-commit" style="display:none;" onclick="window._ca._commitWCPaste()">Import</button>' +
            '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function _previewWCPaste() {
        const text = document.getElementById('ca-wc-paste-area').value;
        const rows = parseWCImportData(text);
        const previewEl = document.getElementById('ca-wc-paste-preview');
        if (!rows.length) { previewEl.innerHTML = '<p class="muted">No valid rows found.</p>'; return; }
        const trs = rows.map(r => '<tr><td>' + escapeHtml(r.name) + '</td><td>' + fmt$(r.ratePerHour) + '</td><td>' + escapeHtml(r.notes) + '</td></tr>').join('');
        previewEl.innerHTML = '<p style="font-size:12px;margin-bottom:6px;">' + rows.length + ' row(s) parsed:</p>' +
            '<div class="cost-table-wrap"><table class="cost-table"><thead><tr><th>Name</th><th>Rate/hr</th><th>Notes</th></tr></thead><tbody>' + trs + '</tbody></table></div>';
        document.getElementById('ca-wc-paste-commit').style.display = '';
    }

    function _commitWCPaste() {
        const text = document.getElementById('ca-wc-paste-area').value;
        commitWCImport(parseWCImportData(text));
        document.getElementById('caWCPasteModal').remove();
    }

    function handleWCCSVUpload(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) { commitWCImport(parseWCImportData(e.target.result)); };
        reader.readAsText(file);
    }

    function parseWCImportData(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return [];
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].includes('\t') ? lines[i].split('\t') : lines[i].split(',');
            if (cols.length < 1) continue;
            const name = (cols[0] || '').trim();
            if (!name) continue;
            rows.push({ name, ratePerHour: parseFloat(cols[1]) || 0, notes: (cols[2] || '').trim() });
        }
        return rows;
    }

    function commitWCImport(rows) {
        ensureCostAnalysisData();
        const wcs = app.data.costAnalysis.workCenters;
        rows.forEach(function(r) {
            const existing = wcs.find(w => w.name.toLowerCase() === r.name.toLowerCase());
            if (existing) {
                existing.ratePerHour = r.ratePerHour;
                if (r.notes) existing.notes = r.notes;
            } else {
                wcs.push({ id: generateId(), name: r.name, ratePerHour: r.ratePerHour, notes: r.notes });
            }
        });
        saveData();
        showToast(rows.length + ' work center(s) imported');
        renderCostAnalysisPage();
    }

    function exportWCCSV() {
        const wcs = app.data.costAnalysis.workCenters || [];
        const header = 'Work Center Name,Rate/hr,Notes\n';
        const body = wcs.map(w => '"' + w.name + '",' + w.ratePerHour + ',"' + (w.notes || '') + '"').join('\n');
        const blob = new Blob([header + body], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'work-centers.csv'; a.click();
        URL.revokeObjectURL(url);
        showToast('Work centers exported');
    }

    // ─── Raw Materials CRUD ───────────────────────────────────────────────────

    function showRawMaterialForm(rmId) {
        const rm = rmId ? getRawMaterial(rmId) : null;
        const title = rm ? 'Edit Raw Material' : 'Add Raw Material';

        const rmSuppliers = [...new Set((app.data.costAnalysis.rawMaterials || [])
            .map(r => r.supplier).filter(Boolean))].sort();
        const rmSupplierList = rmSuppliers.map(s => '<option value="' + escapeHtml(s) + '">').join('');

        const RM_UOMS = ['in','sq in','ft','sq ft','ea','lbs','kg','m','yd','gal','L'];
        const uomOptions = RM_UOMS.map(function(u) {
            var sel = (rm && rm.uom === u) ? ' selected' : '';
            return '<option value="' + u + '"' + sel + '>' + u + '</option>';
        }).join('');

        const html = `
        <div class="modal-overlay" id="caRMModal">
            <div class="modal">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="document.getElementById('caRMModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Part Number *</label>
                            <input type="text" class="form-control" id="ca-rm-pn" value="${escapeHtml(rm ? rm.partNumber : '')}" placeholder="RM-AL6061">
                        </div>
                        <div class="form-group">
                            <label class="form-label">UOM</label>
                            <select class="form-control" id="ca-rm-uom">${uomOptions}</select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <input type="text" class="form-control" id="ca-rm-desc" value="${escapeHtml(rm ? rm.description || '' : '')}" placeholder="Aluminum 6061 Bar Stock">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Cost / UOM ($) *</label>
                            <input type="number" class="form-control" id="ca-rm-cost" value="${rm ? rm.costPerUom || '' : ''}" min="0" step="0.0001" placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Supplier</label>
                            <input type="text" class="form-control" id="ca-rm-supplier" list="ca-rm-supplier-list" value="${escapeHtml(rm ? rm.supplier || '' : '')}" placeholder="Metal Supermarkets" autocomplete="off">
                            <datalist id="ca-rm-supplier-list">${rmSupplierList}</datalist>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea class="form-control" id="ca-rm-notes" rows="2" placeholder="Any notes…">${rm ? escapeHtml(rm.notes || '') : ''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('caRMModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="window._ca.saveRawMaterial('${rmId || ''}')">Save</button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('ca-rm-pn').focus();
    }

    // ─── UOM Normalization ────────────────────────────────────────────────────

    var _RM_UOM_MAP = {
        // inches (linear)
        'inch':'in','inches':'in','in':'in',
        // square inches
        'sq in':'sq in','sq inch':'sq in','sq inches':'sq in',
        'square inch':'sq in','square inches':'sq in',
        'sqin':'sq in','sq. in':'sq in','in2':'sq in','in²':'sq in','in^2':'sq in',
        // feet (linear)
        'ft':'ft','foot':'ft','feet':'ft',
        // square feet
        'sq ft':'sq ft','sq foot':'sq ft','sq feet':'sq ft',
        'square foot':'sq ft','square feet':'sq ft',
        'sqft':'sq ft','sq. ft':'sq ft','ft2':'sq ft','ft²':'sq ft','ft^2':'sq ft',
        // each
        'ea':'ea','each':'ea','pcs':'ea','pc':'ea','piece':'ea','pieces':'ea',
        // weight
        'lbs':'lbs','lb':'lbs','pounds':'lbs','pound':'lbs',
        'kg':'kg','kilogram':'kg','kilograms':'kg',
        // length
        'm':'m','meter':'m','meters':'m','metre':'m','metres':'m',
        'yd':'yd','yds':'yd','yard':'yd','yards':'yd',
        // volume
        'gal':'gal','gallon':'gal','gallons':'gal',
        'l':'L','liter':'L','liters':'L','litre':'L','litres':'L','ltr':'L'
    };

    function _normalizeRMUom(uom) {
        if (!uom) return 'ea';
        var key = uom.trim().toLowerCase();
        return _RM_UOM_MAP[key] || uom.trim();
    }

    function _normalizeRMUomMigration() {
        if (app.data.costAnalysis._rmUomNormalized) return;
        app.data.costAnalysis._rmUomNormalized = true;
        (app.data.costAnalysis.rawMaterials || []).forEach(function(m) {
            m.uom = _normalizeRMUom(m.uom);
        });
        saveData();
    }

    function saveRawMaterial(rmId) {
        const pn = document.getElementById('ca-rm-pn').value.trim();
        const cost = parseFloat(document.getElementById('ca-rm-cost').value);
        if (!pn) { showToast('Part number is required', 'error'); return; }
        if (isNaN(cost) || cost < 0) { showToast('Valid cost per UOM is required', 'error'); return; }

        ensureCostAnalysisData();
        const mats = app.data.costAnalysis.rawMaterials;
        const fields = {
            partNumber: pn,
            description: document.getElementById('ca-rm-desc').value.trim(),
            uom: _normalizeRMUom(document.getElementById('ca-rm-uom').value.trim()),
            costPerUom: cost,
            supplier: document.getElementById('ca-rm-supplier').value.trim(),
            notes: document.getElementById('ca-rm-notes').value.trim()
        };

        if (rmId) {
            const idx = mats.findIndex(m => m.id === rmId);
            if (idx >= 0) Object.assign(mats[idx], fields);
        } else {
            mats.push(Object.assign({ id: generateId() }, fields));
        }

        saveData();
        document.getElementById('caRMModal').remove();
        showToast(rmId ? 'Material updated' : 'Material added');
        renderCostAnalysisPage();
    }

    function deleteRawMaterial(rmId) {
        const parts = app.data.costAnalysis.parts || [];
        const usedBy = parts.filter(p => p.inHouse && p.inHouse.rawMaterialId === rmId).length;

        const msg = usedBy > 0
            ? 'This material is used by ' + usedBy + ' part(s). Delete anyway? (Links will be cleared)'
            : 'Delete this raw material?';
        if (!confirm(msg)) return;

        if (usedBy > 0) {
            parts.forEach(p => {
                if (p.inHouse && p.inHouse.rawMaterialId === rmId) p.inHouse.rawMaterialId = null;
            });
        }
        app.data.costAnalysis.rawMaterials = (app.data.costAnalysis.rawMaterials || []).filter(m => m.id !== rmId);
        saveData();
        showToast('Material deleted');
        renderCostAnalysisPage();
    }

    // ─── Raw Materials: Paste / CSV Import / Export ───────────────────────────

    function showRawMatPasteModal() {
        const html = `
        <div class="modal-overlay" id="caRMPasteModal">
            <div class="modal modal-wide">
                <div class="modal-header">
                    <h2>Paste from Excel — Raw Materials</h2>
                    <button class="modal-close" onclick="document.getElementById('caRMPasteModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="muted" style="margin-bottom:12px;">
                        Expected columns (tab or comma separated):<br>
                        <code>Part Number, Description, UOM, Cost/UOM, Supplier, Notes</code>
                    </p>
                    <textarea class="form-control re-plain" id="ca-rm-paste-area" rows="10"
                        placeholder="Paste Excel data here (include header row)..."></textarea>
                    <div id="ca-rm-paste-preview"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('caRMPasteModal').remove()">Cancel</button>
                    <button class="btn btn-secondary" onclick="window._ca._previewRMPaste()">Preview</button>
                    <button class="btn btn-primary" id="ca-rm-paste-import-btn" style="display:none" onclick="window._ca._commitRMPaste()">Import</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('ca-rm-paste-area').focus();
    }

    function _previewRMPaste() {
        const text = document.getElementById('ca-rm-paste-area').value;
        const rows = parseRMImportData(text);
        const preview = document.getElementById('ca-rm-paste-preview');
        if (rows.length === 0) {
            preview.innerHTML = '<p class="muted" style="margin-top:12px;">No valid rows detected. Check format.</p>';
            document.getElementById('ca-rm-paste-import-btn').style.display = 'none';
            return;
        }
        preview.innerHTML = renderRMPreviewTable(rows);
        document.getElementById('ca-rm-paste-import-btn').style.display = '';
    }

    function _commitRMPaste() {
        const text = document.getElementById('ca-rm-paste-area').value;
        commitRMImport(parseRMImportData(text));
        document.getElementById('caRMPasteModal').remove();
    }

    function handleRMCSVUpload(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const rows = parseRMImportData(e.target.result);
            if (rows.length === 0) { showToast('No valid rows found in file', 'error'); return; }
            _showRMCSVPreviewModal(rows);
        };
        reader.readAsText(file);
        input.value = '';
    }

    let _pendingRMRows = null;

    function _showRMCSVPreviewModal(rows) {
        _pendingRMRows = rows;
        const html = `
        <div class="modal-overlay" id="caRMCSVPreviewModal">
            <div class="modal modal-wide">
                <div class="modal-header">
                    <h2>CSV Import Preview — Raw Materials</h2>
                    <button class="modal-close" onclick="document.getElementById('caRMCSVPreviewModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="muted" style="margin-bottom:12px;">${rows.length} row(s) detected.</p>
                    ${renderRMPreviewTable(rows)}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('caRMCSVPreviewModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="window._ca._commitRMCSVImport()">Import ${rows.length} Material(s)</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function _commitRMCSVImport() {
        if (_pendingRMRows) { commitRMImport(_pendingRMRows); _pendingRMRows = null; }
        const m = document.getElementById('caRMCSVPreviewModal');
        if (m) m.remove();
    }

    function parseRMImportData(text) {
        if (!text || !text.trim()) return [];
        const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return [];
        const delim = lines[0].includes('\t') ? '\t' : ',';

        function parseLine(line) {
            if (delim === '\t') return line.split('\t');
            const result = [];
            let inQ = false, cur = '';
            for (let i = 0; i < line.length; i++) {
                if (line[i] === '"') { inQ = !inQ; }
                else if (line[i] === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
                else { cur += line[i]; }
            }
            result.push(cur.trim());
            return result;
        }

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = parseLine(lines[i]);
            const pn = (cols[0] || '').trim();
            if (!pn) continue;
            const cost = parseFloat((cols[3] || '').replace(/[$,]/g, ''));
            rows.push({
                partNumber: pn,
                description: (cols[1] || '').trim(),
                uom: _normalizeRMUom((cols[2] || '').trim()),
                costPerUom: isNaN(cost) ? 0 : cost,
                supplier: (cols[4] || '').trim(),
                notes: (cols[5] || '').trim()
            });
        }
        return rows;
    }

    function renderRMPreviewTable(rows) {
        const existing = new Set((app.data.costAnalysis.rawMaterials || []).map(m => m.partNumber));
        const tbody = rows.map(r => '<tr>' +
            '<td>' + escapeHtml(r.partNumber) + '</td>' +
            '<td>' + escapeHtml(r.description) + '</td>' +
            '<td>' + escapeHtml(r.uom) + '</td>' +
            '<td>' + fmt$(r.costPerUom) + '</td>' +
            '<td>' + escapeHtml(r.supplier) + '</td>' +
            '<td>' + (existing.has(r.partNumber) ? '<span class="cost-badge-update">Update</span>' : '<span class="cost-badge-new">New</span>') + '</td>' +
            '</tr>').join('');
        return '<div class="cost-table-wrap" style="margin-top:16px;">' +
            '<table class="cost-table"><thead><tr>' +
            '<th>Part #</th><th>Description</th><th>UOM</th><th>Cost/UOM</th><th>Supplier</th><th>Action</th>' +
            '</tr></thead><tbody>' + tbody + '</tbody></table></div>';
    }

    function commitRMImport(rows) {
        ensureCostAnalysisData();
        const mats = app.data.costAnalysis.rawMaterials;
        let added = 0, updated = 0;
        rows.forEach(r => {
            const idx = mats.findIndex(m => m.partNumber === r.partNumber);
            if (idx >= 0) { Object.assign(mats[idx], r); updated++; }
            else { mats.push(Object.assign({ id: generateId() }, r)); added++; }
        });
        saveData();
        showToast('Imported: ' + added + ' added, ' + updated + ' updated');
        renderCostAnalysisPage();
    }

    function exportRMCSV() {
        const mats = app.data.costAnalysis.rawMaterials || [];
        if (mats.length === 0) { showToast('No raw materials to export', 'error'); return; }
        const header = 'Part #,Description,UOM,Cost/UOM,Supplier,Notes';
        function q(v) { return '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"'; }
        const rows = mats.map(m =>
            [q(m.partNumber), q(m.description), q(m.uom), m.costPerUom, q(m.supplier), q(m.notes)].join(',')
        );
        const csv = header + '\n' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'raw-materials.csv'; a.click();
        URL.revokeObjectURL(url);
        showToast('Raw materials exported');
    }

    // ─── Price History ────────────────────────────────────────────────────────

    function logPriceHistory(partId, entry) {
        const part = getPart(partId);
        if (!part) return;
        if (!part.priceHistory) part.priceHistory = [];
        part.priceHistory.push({
            id: generateId(),
            date: entry.date || new Date().toISOString().slice(0, 10),
            unitCost: Number(entry.unitCost) || 0,
            source: entry.source || 'manual',
            supplier: entry.supplier || '',
            note: entry.note || ''
        });
        saveData();
    }

    function renderPriceHistorySection(part) {
        const history = (part.priceHistory || []).slice().sort(function(a, b) {
            return b.date > a.date ? 1 : b.date < a.date ? -1 : 0;
        });
        const rows = history.length === 0
            ? '<tr><td colspan="5" class="muted" style="text-align:center;padding:12px;">No price history recorded yet.</td></tr>'
            : history.map(function(h) {
                return '<tr>' +
                    '<td>' + escapeHtml(h.date) + '</td>' +
                    '<td>' + escapeHtml(h.supplier || '—') + '</td>' +
                    '<td>' + fmt$(h.unitCost) + '</td>' +
                    '<td><span class="cost-archived-badge" style="' + (h.source === 'rfq' ? 'background:rgba(99,102,241,.2);color:#818cf8;' : '') + '">' + escapeHtml(h.source) + '</span></td>' +
                    '<td>' + escapeHtml(h.note || '') + '</td>' +
                    '</tr>';
            }).join('');
        return '<div style="border-top:1px solid var(--border);margin-top:16px;">' +
            '<div style="cursor:pointer;display:flex;align-items:center;gap:8px;padding:10px 0;" onclick="(function(el){var b=el.nextElementSibling;b.style.display=b.style.display===\'none\'?\'block\':\'none\';})(this)">' +
            '<span style="font-size:11px;color:var(--text-muted);">▶</span>' +
            '<span class="cost-form-section-label" style="margin:0;">Price History</span>' +
            '<span class="cost-archived-badge" style="margin-left:4px;">' + history.length + '</span>' +
            '<button class="btn btn-primary btn-small" style="margin-left:auto;" onclick="event.stopPropagation();window._ca.showAddPriceHistoryModal(\'' + part.id + '\')">+ Add Entry</button>' +
            '</div>' +
            '<div style="display:none;">' +
            '<div class="cost-table-wrap"><table class="price-history-table">' +
            '<thead><tr><th>Date</th><th>Supplier</th><th>$/unit</th><th>Source</th><th>Note</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '</table></div>' +
            '</div>' +
            '</div>';
    }

    function showAddPriceHistoryModal(partId) {
        const part = getPart(partId);
        if (!part) return;
        const today = new Date().toISOString().slice(0, 10);
        const html = `
        <div class="modal-overlay" id="caPriceHistModal">
            <div class="modal" style="max-width:420px;">
                <div class="modal-header">
                    <h2>Add Price History Entry</h2>
                    <button class="modal-close" onclick="document.getElementById('caPriceHistModal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Date *</label>
                            <input type="date" class="form-control" id="ca-ph-date" value="${today}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Unit Cost ($) *</label>
                            <input type="number" class="form-control" id="ca-ph-cost" min="0" step="0.0001" placeholder="0.00">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Supplier</label>
                        <input type="text" class="form-control" id="ca-ph-supplier" value="${escapeHtml(part.currentSupplier || '')}" placeholder="Supplier name">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Note</label>
                        <input type="text" class="form-control" id="ca-ph-note" placeholder="e.g. Annual contract renewal">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('caPriceHistModal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="window._ca.savePriceHistoryEntry('${partId}')">Save</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('ca-ph-cost').focus();
    }

    function savePriceHistoryEntry(partId) {
        const date = document.getElementById('ca-ph-date').value;
        const cost = parseFloat(document.getElementById('ca-ph-cost').value);
        if (!date) { showToast('Date is required', 'error'); return; }
        if (isNaN(cost) || cost < 0) { showToast('Valid unit cost is required', 'error'); return; }
        logPriceHistory(partId, {
            date: date,
            unitCost: cost,
            source: 'manual',
            supplier: document.getElementById('ca-ph-supplier').value.trim(),
            note: document.getElementById('ca-ph-note').value.trim()
        });
        document.getElementById('caPriceHistModal').remove();
        showToast('Price entry added');
        const dm = document.getElementById('caDetailModal');
        if (dm) { dm.remove(); showPartDetailModal(partId); }
    }

    // ─── MOQ Break-even Analysis ──────────────────────────────────────────────

    function renderMOQAnalysisSection(part) {
        const rfqs = (part.rfqs || []).filter(function(r) { return r.unitCost > 0; });
        if (rfqs.length === 0) {
            return '<div style="border-top:1px solid var(--border);margin-top:16px;padding-top:12px;">' +
                '<span class="cost-form-section-label">MOQ Break-even</span>' +
                '<p class="muted" style="font-size:12px;margin-top:8px;">No RFQs with pricing available for analysis.</p></div>';
        }

        const curCost = Number(part.currentUnitCost) || 0;
        const best = getBestRFQ(part);

        // Build comparison rows (up to 3 RFQs, sorted by unit cost asc)
        const topRFQs = rfqs.slice().sort(function(a, b) { return Number(a.unitCost) - Number(b.unitCost); }).slice(0, 3);

        const compRows = topRFQs.map(function(r) {
            const moq = Number(r.moq) || 1;
            const unitCost = Number(r.unitCost);
            const totalAtMOQ = unitCost * moq;
            const currentTotalAtMOQ = curCost * moq;
            const diff = currentTotalAtMOQ - totalAtMOQ;
            const isBest = best && r.id === best.id;
            const savingsCell = curCost > 0
                ? (diff > 0 ? '<span class="moq-savings">saves ' + fmt$(diff) + '</span>' : diff < 0 ? '<span style="color:#f87171;">costs ' + fmt$(Math.abs(diff)) + ' more</span>' : '<span class="muted">same</span>')
                : '<span class="muted">—</span>';
            return '<tr' + (isBest ? ' class="cost-best-row"' : '') + '>' +
                '<td>' + escapeHtml(r.supplier) + (isBest ? ' <span class="cost-best-badge">Best</span>' : '') + '</td>' +
                '<td style="text-align:center;">' + moq + '</td>' +
                '<td>' + fmt$(unitCost) + '</td>' +
                '<td>' + fmt$(totalAtMOQ) + '</td>' +
                '<td>' + savingsCell + '</td>' +
                '</tr>';
        }).join('');

        // Break-even analysis with best RFQ
        let breakEvenHtml = '';
        if (best && curCost > 0) {
            const bestCost = Number(best.unitCost);
            const bestMOQ = Number(best.moq) || 1;
            const savingsPerUnit = curCost - bestCost;
            if (savingsPerUnit > 0) {
                const totalSavingsAtMOQ = savingsPerUnit * bestMOQ;
                breakEvenHtml = '<div style="background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.2);border-radius:6px;padding:10px 12px;margin-top:10px;font-size:12px;">' +
                    '<strong>' + escapeHtml(best.supplier) + '</strong> saves <span class="moq-savings">' + fmt$(savingsPerUnit) + '/unit</span> vs current supplier. ' +
                    'At MOQ of ' + bestMOQ + ' unit' + (bestMOQ !== 1 ? 's' : '') + ', total savings = <span class="moq-savings">' + fmt$(totalSavingsAtMOQ) + '</span>.' +
                    '</div>';
            } else if (savingsPerUnit < 0) {
                breakEvenHtml = '<div style="background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:6px;padding:10px 12px;margin-top:10px;font-size:12px;">' +
                    'Best RFQ (<strong>' + escapeHtml(best.supplier) + '</strong>) is <span style="color:#f87171;font-weight:600;">' + fmt$(Math.abs(savingsPerUnit)) + '/unit more expensive</span> than current supplier at any quantity.' +
                    '</div>';
            } else {
                breakEvenHtml = '<div style="background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.2);border-radius:6px;padding:10px 12px;margin-top:10px;font-size:12px;" class="muted">' +
                    'Best RFQ matches current supplier cost.' +
                    '</div>';
            }
        } else if (!curCost) {
            breakEvenHtml = '<div class="muted" style="font-size:12px;margin-top:8px;">Set a current unit cost to enable break-even analysis.</div>';
        }

        return '<div style="border-top:1px solid var(--border);margin-top:16px;">' +
            '<div style="cursor:pointer;display:flex;align-items:center;gap:8px;padding:10px 0;" onclick="(function(el){var b=el.nextElementSibling;b.style.display=b.style.display===\'none\'?\'block\':\'none\';})(this)">' +
            '<span style="font-size:11px;color:var(--text-muted);">▶</span>' +
            '<span class="cost-form-section-label" style="margin:0;">MOQ Break-even Analysis</span>' +
            '</div>' +
            '<div style="display:none;">' +
            (curCost > 0 ? '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Current cost: <strong style="color:var(--text);">' + fmt$(curCost) + '/unit</strong></div>' : '') +
            '<div class="cost-table-wrap"><table class="moq-table">' +
            '<thead><tr><th>Supplier</th><th>MOQ</th><th>$/unit</th><th>Total at MOQ</th><th>vs Current</th></tr></thead>' +
            '<tbody>' + compRows + '</tbody>' +
            '</table></div>' +
            breakEvenHtml +
            '</div></div>';
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    // ─── Data Audit ───────────────────────────────────────────────────────────

    const AUDIT_CHECKS = [
        { key: 'no-qpb',      label: 'Missing QPB',       color: '#ff4757', test: function(p) { return !p.qpb || p.qpb === 0; } },
        { key: 'no-price',    label: 'No Unit Cost',      color: '#ff6b35', test: function(p) { return !p.currentUnitCost || p.currentUnitCost === 0; } },
        { key: 'no-supplier', label: 'No Supplier',       color: '#ffb800', test: function(p) { return !p.inHouse && (!p.currentSupplier || !p.currentSupplier.trim()); } },
        { key: 'no-raw-mat',  label: 'No Raw Material',   color: '#a78bfa', test: function(p) { return p.inHouse && !p.inHouse.rawMaterialId; } },
        { key: 'no-uom',      label: 'No UOM',            color: '#38bdf8', test: function(p) { return !p.unitOfMeasure || !p.unitOfMeasure.trim(); } },
        { key: 'no-commodity',label: 'No Commodity',      color: '#34d399', test: function(p) { return !p.commodity || !p.commodity.trim(); } },
        { key: 'no-rfq',      label: 'No RFQs',           color: '#60a5fa', test: function(p) { return !p.rfqs || p.rfqs.length === 0; } },
        { key: 'no-desc',     label: 'No Description',    color: '#f472b6', test: function(p) { return !p.description || !p.description.trim(); } },
    ];

    function _setAuditFilter(key) {
        _auditFilter = (_auditFilter === key) ? null : key;
        renderCostAnalysisPage();
    }

    function renderAuditView() {
        var parts = app.data.costAnalysis.parts || [];
        var total = parts.length;

        // Compute counts per check
        var counts = {};
        AUDIT_CHECKS.forEach(function(c) { counts[c.key] = parts.filter(c.test).length; });

        // Parts with at least one issue
        var anyIssue = parts.filter(function(p) {
            return AUDIT_CHECKS.some(function(c) { return c.test(p); });
        });
        var completeCount = total - anyIssue.length;
        var completePct = total ? Math.round((completeCount / total) * 100) : 100;

        // Filtered table rows
        var activeCheck = _auditFilter ? AUDIT_CHECKS.find(function(c) { return c.key === _auditFilter; }) : null;
        var tableRows = _auditFilter ? parts.filter(activeCheck.test) : anyIssue;

        // Stat cards
        var statCards = AUDIT_CHECKS.map(function(c) {
            var cnt = counts[c.key];
            var isActive = _auditFilter === c.key;
            return '<div class="ca-audit-stat' + (cnt === 0 ? ' ca-audit-stat-ok' : '') + (isActive ? ' ca-audit-stat-active' : '') + '" style="border-left:3px solid ' + c.color + '; cursor:pointer;" onclick="window._ca._setAuditFilter(\'' + c.key + '\')">'
                + '<div class="ca-audit-stat-value" style="color:' + (cnt === 0 ? 'var(--success)' : c.color) + '">' + (cnt === 0 ? 'OK' : cnt) + '</div>'
                + '<div class="ca-audit-stat-label">' + c.label + '</div>'
                + (isActive ? '<div style="font-size:10px;color:var(--muted);margin-top:2px;">click to clear</div>' : '')
                + '</div>';
        }).join('');

        // Table rows
        var rows = tableRows.map(function(p) {
            var badges = AUDIT_CHECKS.filter(function(c) { return c.test(p); }).map(function(c) {
                return '<span class="ca-audit-badge" style="background:' + c.color + '22;color:' + c.color + ';border:1px solid ' + c.color + '44;">' + c.label + '</span>';
            }).join(' ');
            return '<tr>'
                + '<td><strong>' + escapeHtml(p.partNumber || '—') + '</strong></td>'
                + '<td style="max-width:280px;">' + escapeHtml(p.description || '—') + '</td>'
                + '<td>' + escapeHtml(p.commodity || '—') + '</td>'
                + '<td>' + badges + '</td>'
                + '<td><button class="btn btn-secondary btn-small" onclick="window._ca.showEditPartModal(\'' + p.id + '\')">Edit</button>'
                + ' <button class="btn btn-secondary btn-small" onclick="window._ca.showPartDetailModal(\'' + p.id + '\')">⋯</button></td>'
                + '</tr>';
        }).join('');

        return '<div class="ca-audit-page">'
            + '<div class="ca-audit-header">'
            + '<h2 style="font-size:16px;font-weight:700;color:var(--text);">Data Audit</h2>'
            + '<div style="font-size:13px;color:var(--muted);">' + completeCount + ' of ' + total + ' parts complete (' + completePct + '%)</div>'
            + '</div>'
            + '<div class="ca-audit-progress-wrap"><div class="ca-audit-progress-bar" style="width:' + completePct + '%"></div></div>'
            + '<div class="ca-audit-stat-grid">' + statCards + '</div>'
            + '<div class="ca-charts-grid" style="grid-template-columns:1fr 1fr;margin:16px 0;">'
            + '<div class="ca-chart-box"><h3 class="ca-chart-title">Issues by Field</h3><div class="ca-chart-wrap" style="height:220px"><canvas id="ca-audit-bar"></canvas></div></div>'
            + '<div class="ca-chart-box"><h3 class="ca-chart-title">Complete vs. Incomplete</h3><div class="ca-chart-wrap" style="height:220px"><canvas id="ca-audit-donut"></canvas></div></div>'
            + '</div>'
            + '<div class="ca-audit-table-header">'
            + '<strong style="font-size:13px;">' + (activeCheck ? activeCheck.label + ' (' + tableRows.length + ' parts)' : 'All Incomplete Parts (' + anyIssue.length + ')') + '</strong>'
            + (activeCheck ? ' <button class="btn btn-secondary btn-small" onclick="window._ca._setAuditFilter(null)" style="margin-left:8px;">Clear Filter</button>' : '')
            + '</div>'
            + (rows ? '<div class="ca-audit-table-scroll"><table class="data-table"><thead><tr><th>Part #</th><th>Description</th><th>Commodity</th><th>Issues</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
               : '<div class="ca-empty" style="padding:32px;text-align:center;color:var(--success);">All parts are complete! Nothing to fix.</div>')
            + '</div>';
    }

    function _initAuditCharts() {
        if (typeof Chart === 'undefined') return;
        var parts = app.data.costAnalysis.parts || [];
        var isDark = document.documentElement.getAttribute('data-theme') !== 'saronic-light';
        var txt  = isDark ? '#c2d0de' : '#374151';
        var grid = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

        // Bar chart
        var bar = document.getElementById('ca-audit-bar');
        if (bar) {
            new Chart(bar, {
                type: 'bar',
                data: {
                    labels: AUDIT_CHECKS.map(function(c) { return c.label; }),
                    datasets: [{
                        label: 'Parts Missing',
                        data: AUDIT_CHECKS.map(function(c) { return parts.filter(c.test).length; }),
                        backgroundColor: AUDIT_CHECKS.map(function(c) { return c.color + 'bb'; }),
                        borderColor: AUDIT_CHECKS.map(function(c) { return c.color; }),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: txt, font: { size: 10 } }, grid: { color: grid } },
                        y: { ticks: { color: txt, font: { size: 10 } }, grid: { color: grid } }
                    }
                }
            });
        }

        // Donut chart
        var donut = document.getElementById('ca-audit-donut');
        if (donut) {
            var anyIssue = parts.filter(function(p) { return AUDIT_CHECKS.some(function(c) { return c.test(p); }); }).length;
            new Chart(donut, {
                type: 'doughnut',
                data: {
                    labels: ['Complete', 'Has Issues'],
                    datasets: [{ data: [parts.length - anyIssue, anyIssue], backgroundColor: ['#ACFF24', '#ff4757'], borderWidth: 0 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: txt, font: { size: 11 }, boxWidth: 14 } } }
                }
            });
        }
    }

    // ─── TLAs (Top Level Assemblies) ─────────────────────────────────────────

    function _tlaCost(tla) {
        var parts = app.data.costAnalysis.parts || [];
        return (tla.items || []).reduce(function(sum, item) {
            var p = parts.find(function(x) { return x.id === item.partId; });
            if (!p) return sum;
            return sum + (p.currentUnitCost || 0) * (item.qtyPerTLA || 1);
        }, 0);
    }

    function _tlaSetDetail(id) {
        _tlaDetailId = id;
        renderCostAnalysisPage();
    }

    function renderTLAsView() {
        return _tlaDetailId ? renderTLADetail(_tlaDetailId) : renderTLAList();
    }

    function renderTLAList() {
        var tlas = app.data.costAnalysis.tlas || [];
        var parts = app.data.costAnalysis.parts || [];

        var rows = tlas.map(function(t) {
            var cost = _tlaCost(t);
            var partCount = (t.items || []).length;
            return '<tr style="cursor:pointer;" onclick="window._ca._tlaSetDetail(\'' + t.id + '\')">'
                + '<td><strong>' + escapeHtml(t.partNumber || '—') + '</strong></td>'
                + '<td>' + escapeHtml(t.name) + '</td>'
                + '<td>' + escapeHtml(t.description || '—') + '</td>'
                + '<td>' + escapeHtml(t.revision || '—') + '</td>'
                + '<td style="text-align:right;">' + partCount + '</td>'
                + '<td style="text-align:right;font-weight:600;">' + fmt$(cost) + '</td>'
                + '<td onclick="event.stopPropagation()">'
                + '<button class="btn btn-secondary btn-small" onclick="window._ca.showTLAModal(\'' + t.id + '\')">Edit</button>'
                + ' <button class="btn btn-danger btn-small" onclick="window._ca.deleteTLA(\'' + t.id + '\')">Delete</button>'
                + '</td>'
                + '</tr>';
        }).join('');

        return '<div class="ca-tla-page">'
            + '<div class="ca-tla-toolbar">'
            + '<button class="btn btn-primary" onclick="window._ca.showTLAModal()">+ New TLA</button>'
            + '<button class="btn btn-secondary" onclick="window._ca.showTLAPasteModal()">Paste BOM from Excel</button>'
            + '<label class="btn btn-secondary" style="cursor:pointer;">Upload BOM CSV<input type="file" accept=".csv" style="display:none;" onchange="window._ca.handleTLACSV(this)"></label>'
            + '</div>'
            + (rows
                ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Part #</th><th>Name</th><th>Description</th><th>Rev</th><th style="text-align:right;">Parts</th><th style="text-align:right;">Total Cost</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
                : '<div class="ca-empty" style="padding:48px;text-align:center;color:var(--muted);">No TLAs yet. Create one or paste a BOM from Excel.</div>')
            + '</div>';
    }

    function renderTLADetail(tlaId) {
        var tlas = app.data.costAnalysis.tlas || [];
        var parts = app.data.costAnalysis.parts || [];
        var tla = tlas.find(function(t) { return t.id === tlaId; });
        if (!tla) return '<div class="ca-empty">TLA not found.</div>';

        var totalCost = _tlaCost(tla);
        var rows = (tla.items || []).map(function(item) {
            var p = parts.find(function(x) { return x.id === item.partId; });
            var pn    = p ? p.partNumber : item.partNumber || '—';
            var desc  = p ? p.description : item.description || '—';
            var sup   = p ? (p.currentSupplier || '—') : '—';
            var unit  = p ? (p.currentUnitCost || 0) : 0;
            var ext   = unit * (item.qtyPerTLA || 1);
            var pct   = totalCost > 0 ? ((ext / totalCost) * 100).toFixed(1) : '—';
            return '<tr>'
                + '<td><strong>' + escapeHtml(pn) + '</strong></td>'
                + '<td>' + escapeHtml(desc) + '</td>'
                + '<td style="text-align:right;">' + (item.qtyPerTLA || 1) + '</td>'
                + '<td style="text-align:right;">' + fmt$(unit) + '</td>'
                + '<td style="text-align:right;font-weight:600;">' + fmt$(ext) + '</td>'
                + '<td style="text-align:right;">' + pct + '%</td>'
                + '<td>' + escapeHtml(sup) + '</td>'
                + '<td>' + escapeHtml(item.notes || '') + '</td>'
                + '<td><button class="btn btn-danger btn-small" onclick="window._ca.removeTLAItem(\'' + tlaId + '\',\'' + item.id + '\')">×</button></td>'
                + '</tr>';
        }).join('');

        var addPartOptions = parts.map(function(p) {
            return '<option value="' + p.id + '">' + escapeHtml(p.partNumber) + (p.description ? ' — ' + escapeHtml(p.description.substring(0, 50)) : '') + '</option>';
        }).join('');

        return '<div class="ca-tla-page">'
            + '<div class="ca-tla-detail-header">'
            + '<button class="btn btn-secondary btn-small" onclick="window._ca._tlaSetDetail(null)">← Back to TLAs</button>'
            + '<div>'
            + '<h2 style="font-size:16px;font-weight:700;">' + escapeHtml(tla.name) + (tla.partNumber ? ' <span style="color:var(--muted);font-weight:400;font-size:13px;">' + escapeHtml(tla.partNumber) + '</span>' : '') + '</h2>'
            + (tla.description ? '<div style="color:var(--muted);font-size:13px;">' + escapeHtml(tla.description) + '</div>' : '')
            + '</div>'
            + '<div style="text-align:right;">'
            + '<div style="font-size:22px;font-weight:700;color:var(--accent);">' + fmt$(totalCost) + '</div>'
            + '<div style="font-size:11px;color:var(--muted);">Total Assembly Cost</div>'
            + '</div>'
            + '</div>'

            + '<div class="ca-tla-add-row">'
            + '<button class="btn btn-primary" onclick="window._ca.showTLAPartPicker(\'' + tlaId + '\')">+ Select Parts</button>'
            + '<span style="color:var(--muted);font-size:12px;">Choose from all parts in the system</span>'
            + '</div>'

            + (rows
                ? '<div class="table-wrap" style="max-height:420px;overflow-y:auto;"><table class="data-table"><thead><tr><th>Part #</th><th>Description</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Unit Cost</th><th style="text-align:right;">Ext. Cost</th><th style="text-align:right;">% of Total</th><th>Supplier</th><th>Notes</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
                : '<div class="ca-empty" style="padding:32px;text-align:center;color:var(--muted);">No parts in this TLA yet. Add parts above or paste a BOM.</div>')
            + '</div>';
    }

    function showTLAModal(tlaId) {
        var tla = tlaId ? (app.data.costAnalysis.tlas || []).find(function(t) { return t.id === tlaId; }) : null;
        var html = '<div class="modal-overlay" id="tlaModal">'
            + '<div class="modal" style="max-width:480px;">'
            + '<div class="modal-header"><h3>' + (tla ? 'Edit TLA' : 'New TLA') + '</h3><button class="modal-close" onclick="document.getElementById(\'tlaModal\').remove()">×</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label class="form-label">Name *</label><input id="tla-name" class="form-control" value="' + escapeHtml(tla ? tla.name : '') + '" placeholder="e.g. Hull Assembly"></div>'
            + '<div class="form-group"><label class="form-label">Part Number</label><input id="tla-pn" class="form-control" value="' + escapeHtml(tla ? (tla.partNumber || '') : '') + '" placeholder="e.g. 415-ASY-001"></div>'
            + '<div class="form-group"><label class="form-label">Description</label><input id="tla-desc" class="form-control" value="' + escapeHtml(tla ? (tla.description || '') : '') + '"></div>'
            + '<div class="form-group"><label class="form-label">Revision</label><input id="tla-rev" class="form-control" value="' + escapeHtml(tla ? (tla.revision || '') : '') + '" placeholder="000"></div>'
            + '<div class="form-group"><label class="form-label">Notes</label><textarea id="tla-notes" class="form-control" rows="2">' + escapeHtml(tla ? (tla.notes || '') : '') + '</textarea></div>'
            + '</div>'
            + '<div class="modal-footer">'
            + '<button class="btn btn-secondary" onclick="document.getElementById(\'tlaModal\').remove()">Cancel</button>'
            + '<button class="btn btn-primary" onclick="window._ca.saveTLA(\'' + (tlaId || '') + '\')">Save</button>'
            + '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function saveTLA(tlaId) {
        var name = document.getElementById('tla-name').value.trim();
        if (!name) { showToast('Name is required', 'error'); return; }
        var tlas = app.data.costAnalysis.tlas || [];
        if (tlaId) {
            var t = tlas.find(function(x) { return x.id === tlaId; });
            if (t) {
                t.name = name;
                t.partNumber = document.getElementById('tla-pn').value.trim();
                t.description = document.getElementById('tla-desc').value.trim();
                t.revision = document.getElementById('tla-rev').value.trim();
                t.notes = document.getElementById('tla-notes').value.trim();
            }
        } else {
            tlas.push({ id: generateId(), name: name,
                partNumber: document.getElementById('tla-pn').value.trim(),
                description: document.getElementById('tla-desc').value.trim(),
                revision: document.getElementById('tla-rev').value.trim(),
                notes: document.getElementById('tla-notes').value.trim(),
                items: [], createdAt: new Date().toISOString() });
        }
        app.data.costAnalysis.tlas = tlas;
        saveData();
        document.getElementById('tlaModal').remove();
        renderCostAnalysisPage();
        showToast('TLA saved', 'success');
    }

    function deleteTLA(tlaId) {
        if (!confirm('Delete this TLA?')) return;
        app.data.costAnalysis.tlas = (app.data.costAnalysis.tlas || []).filter(function(t) { return t.id !== tlaId; });
        saveData();
        if (_tlaDetailId === tlaId) _tlaDetailId = null;
        renderCostAnalysisPage();
        showToast('TLA deleted', 'success');
    }

    function addTLAItem(tlaId, partId, qty, notes) {
        var tla = (app.data.costAnalysis.tlas || []).find(function(t) { return t.id === tlaId; });
        if (!tla || !partId) return;
        if (!tla.items) tla.items = [];
        if (!tla.items.some(function(i) { return i.partId === partId; })) {
            tla.items.push({ id: generateId(), partId: partId, qtyPerTLA: qty || 1, notes: notes || '' });
        }
        saveData();
        renderCostAnalysisPage();
    }

    function showTLAPartPicker(tlaId) {
        var tla = (app.data.costAnalysis.tlas || []).find(function(t) { return t.id === tlaId; });
        if (!tla) return;
        var parts = app.data.costAnalysis.parts || [];
        var existingIds = (tla.items || []).map(function(i) { return i.partId; });

        var rows = parts.map(function(p) {
            var inTLA = existingIds.includes(p.id);
            return '<tr class="tla-picker-row" data-pn="' + escapeHtml((p.partNumber || '').toLowerCase()) + '" data-desc="' + escapeHtml((p.description || '').toLowerCase()) + '">'
                + '<td style="width:36px;text-align:center;"><input type="checkbox" class="tla-picker-check" value="' + p.id + '"' + (inTLA ? ' checked disabled' : '') + '></td>'
                + '<td><strong>' + escapeHtml(p.partNumber) + '</strong>' + (inTLA ? ' <span style="font-size:10px;color:var(--muted);">(already added)</span>' : '') + '</td>'
                + '<td style="color:var(--muted);font-size:12px;">' + escapeHtml(p.description || '—') + '</td>'
                + '<td style="color:var(--muted);font-size:12px;">' + escapeHtml(p.commodity || '—') + '</td>'
                + '<td style="width:70px;"><input type="number" class="form-control tla-picker-qty" value="1" min="1" style="padding:3px 6px;width:60px;"' + (inTLA ? ' disabled' : '') + '></td>'
                + '</tr>';
        }).join('');

        var html = '<div class="modal-overlay" id="tlaPickerModal">'
            + '<div class="modal" style="max-width:680px;">'
            + '<div class="modal-header"><h3>Select Parts — ' + escapeHtml(tla.name) + '</h3><button class="modal-close" onclick="document.getElementById(\'tlaPickerModal\').remove()">×</button></div>'
            + '<div class="modal-body" style="padding-top:8px;">'
            + '<input type="text" class="form-control" placeholder="Search part # or description..." style="margin-bottom:10px;" oninput="window._ca._filterTLAPicker(this.value)">'
            + '<div style="max-height:420px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);">'
            + '<table class="data-table" id="tla-picker-table"><thead><tr><th></th><th>Part #</th><th>Description</th><th>Commodity</th><th>Qty</th></tr></thead><tbody>' + rows + '</tbody></table>'
            + '</div></div>'
            + '<div class="modal-footer">'
            + '<button class="btn btn-secondary" onclick="document.getElementById(\'tlaPickerModal\').remove()">Cancel</button>'
            + '<button class="btn btn-primary" onclick="window._ca._commitTLAPartPicker(\'' + tlaId + '\')">Add Selected</button>'
            + '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function _filterTLAPicker(query) {
        var q = query.toLowerCase();
        document.querySelectorAll('.tla-picker-row').forEach(function(row) {
            var match = !q || row.dataset.pn.includes(q) || row.dataset.desc.includes(q);
            row.style.display = match ? '' : 'none';
        });
    }

    function _commitTLAPartPicker(tlaId) {
        var tla = (app.data.costAnalysis.tlas || []).find(function(t) { return t.id === tlaId; });
        if (!tla) return;
        if (!tla.items) tla.items = [];
        var checks = document.querySelectorAll('.tla-picker-check:checked:not(:disabled)');
        var added = 0;
        checks.forEach(function(cb) {
            var row = cb.closest('tr');
            var qty = parseFloat(row.querySelector('.tla-picker-qty').value) || 1;
            if (!tla.items.some(function(i) { return i.partId === cb.value; })) {
                tla.items.push({ id: generateId(), partId: cb.value, qtyPerTLA: qty, notes: '' });
                added++;
            }
        });
        saveData();
        document.getElementById('tlaPickerModal').remove();
        renderCostAnalysisPage();
        if (added > 0) showToast('Added ' + added + ' part' + (added !== 1 ? 's' : '') + ' to ' + tla.name, 'success');
    }

    function removeTLAItem(tlaId, itemId) {
        var tla = (app.data.costAnalysis.tlas || []).find(function(t) { return t.id === tlaId; });
        if (!tla) return;
        tla.items = (tla.items || []).filter(function(i) { return i.id !== itemId; });
        saveData();
        renderCostAnalysisPage();
    }

    // Paste BOM: columns = PartNumber, Qty, Notes (tab-separated)
    function showTLAPasteModal() {
        var tlas = app.data.costAnalysis.tlas || [];
        var tlaOptions = tlas.map(function(t) {
            return '<option value="' + t.id + '">' + escapeHtml(t.name) + (t.partNumber ? ' (' + escapeHtml(t.partNumber) + ')' : '') + '</option>';
        }).join('');

        var html = '<div class="modal-overlay" id="tlaPasteModal">'
            + '<div class="modal" style="max-width:560px;">'
            + '<div class="modal-header"><h3>Paste BOM from Excel</h3><button class="modal-close" onclick="document.getElementById(\'tlaPasteModal\').remove()">×</button></div>'
            + '<div class="modal-body">'
            + '<p style="color:var(--muted);font-size:13px;margin-bottom:12px;">Paste rows from Excel. Expected columns: <strong>Part Number, Qty, Notes</strong> (tab-separated). Matches parts by part number.</p>'
            + '<div class="form-group"><label class="form-label">Add to TLA</label>'
            + '<select id="tla-paste-tla" class="form-control"><option value="">— Create new TLA —</option>' + tlaOptions + '</select></div>'
            + '<div id="tla-paste-new-name-row" class="form-group"><label class="form-label">New TLA Name</label><input id="tla-paste-new-name" class="form-control" placeholder="e.g. Hull Assembly"></div>'
            + '<div class="form-group"><label class="form-label">Paste BOM here</label>'
            + '<textarea id="tla-paste-data" class="form-control" rows="10" style="font-family:monospace;font-size:12px;" placeholder="415-00402&#9;2&#9;Optional note&#10;415-00488&#9;4"></textarea></div>'
            + '<div id="tla-paste-preview"></div>'
            + '</div>'
            + '<div class="modal-footer">'
            + '<button class="btn btn-secondary" onclick="document.getElementById(\'tlaPasteModal\').remove()">Cancel</button>'
            + '<button class="btn btn-secondary" onclick="window._ca._previewTLAPaste()">Preview</button>'
            + '<button class="btn btn-primary" id="tla-paste-commit" style="display:none" onclick="window._ca._commitTLAPaste()">Import</button>'
            + '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('tla-paste-tla').addEventListener('change', function() {
            document.getElementById('tla-paste-new-name-row').style.display = this.value ? 'none' : '';
        });
    }

    function _previewTLAPaste() {
        var raw = document.getElementById('tla-paste-data').value.trim();
        if (!raw) { showToast('Paste some data first', 'error'); return; }
        var parts = app.data.costAnalysis.parts || [];
        var rows = raw.split('\n').map(function(line) { return line.split('\t'); });
        var matched = 0, unmatched = 0;
        var preview = rows.map(function(cols) {
            var pn  = (cols[0] || '').trim();
            var qty = parseFloat(cols[1]) || 1;
            var note= (cols[2] || '').trim();
            var p   = parts.find(function(x) { return (x.partNumber || '').toLowerCase() === pn.toLowerCase() || (x.aliases || []).some(function(a){ return a.toLowerCase() === pn.toLowerCase(); }); });
            if (p) matched++; else unmatched++;
            var status = p ? '<span style="color:var(--success);">matched</span>' : '<span style="color:var(--danger);">not found</span>';
            return '<tr><td>' + escapeHtml(pn) + '</td><td>' + qty + '</td><td>' + escapeHtml(note) + '</td><td>' + status + '</td></tr>';
        }).join('');
        document.getElementById('tla-paste-preview').innerHTML = '<div style="margin-top:12px;max-height:200px;overflow-y:auto;"><table class="data-table"><thead><tr><th>Part #</th><th>Qty</th><th>Notes</th><th>Status</th></tr></thead><tbody>' + preview + '</tbody></table>'
            + '<div style="margin-top:8px;font-size:12px;color:var(--muted);">' + matched + ' matched · ' + unmatched + ' not found (will be skipped)</div></div>';
        document.getElementById('tla-paste-commit').style.display = matched > 0 ? '' : 'none';
    }

    function _commitTLAPaste() {
        var raw    = document.getElementById('tla-paste-data').value.trim();
        var tlaId  = document.getElementById('tla-paste-tla').value;
        var newName= document.getElementById('tla-paste-new-name') ? document.getElementById('tla-paste-new-name').value.trim() : '';
        var parts  = app.data.costAnalysis.parts || [];
        var tlas   = app.data.costAnalysis.tlas || [];

        var tla;
        if (tlaId) {
            tla = tlas.find(function(t) { return t.id === tlaId; });
        } else {
            if (!newName) { showToast('Enter a name for the new TLA', 'error'); return; }
            tla = { id: generateId(), name: newName, partNumber: '', description: '', revision: '', notes: '', items: [], createdAt: new Date().toISOString() };
            tlas.push(tla);
            app.data.costAnalysis.tlas = tlas;
        }

        var rows = raw.split('\n').map(function(line) { return line.split('\t'); });
        var added = 0;
        rows.forEach(function(cols) {
            var pn  = (cols[0] || '').trim();
            var qty = parseFloat(cols[1]) || 1;
            var note= (cols[2] || '').trim();
            var p   = parts.find(function(x) { return (x.partNumber || '').toLowerCase() === pn.toLowerCase() || (x.aliases || []).some(function(a){ return a.toLowerCase() === pn.toLowerCase(); }); });
            if (p) { tla.items.push({ id: generateId(), partId: p.id, qtyPerTLA: qty, notes: note }); added++; }
        });

        saveData();
        document.getElementById('tlaPasteModal').remove();
        _tlaDetailId = tla.id;
        renderCostAnalysisPage();
        showToast('Imported ' + added + ' parts into ' + tla.name, 'success');
    }

    function handleTLACSV(input) {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            var lines = e.target.result.split('\n').filter(function(l) { return l.trim(); });
            // skip header if first cell looks non-numeric
            var start = 0;
            if (lines.length > 0 && isNaN(parseFloat((lines[0].split(',')[1] || '').trim()))) start = 1;
            var paste = lines.slice(start).map(function(l) {
                var cols = l.split(',');
                return [(cols[0] || '').replace(/"/g,'').trim(), (cols[1] || '').trim(), (cols[2] || '').replace(/"/g,'').trim()].join('\t');
            }).join('\n');
            showTLAPasteModal();
            setTimeout(function() {
                var el = document.getElementById('tla-paste-data');
                if (el) { el.value = paste; window._ca._previewTLAPaste(); }
            }, 100);
        };
        reader.readAsText(file);
        input.value = '';
    }

    // ── Product KPIs ──────────────────────────────────────────────────────────

    function escapeHtmlPK(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function _fmtPKVal(val, unit) {
        if (val === null || val === undefined || val === '') return '—';
        var n = Number(val);
        if (isNaN(n)) return val;
        if (unit === '$') return '$' + n.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:2});
        if (unit === '%') return n.toFixed(1) + '%';
        return n.toLocaleString(undefined, {maximumFractionDigits:2}) + (unit ? ' ' + unit : '');
    }

    function _pkTrend(dataPoints, higherIsBetter) {
        var pts = (dataPoints || []).slice().sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
        if (pts.length < 2) return {arrow:'—', color:'var(--muted)', good:null};
        var recent = pts.slice(-3);
        var diff = recent[recent.length-1].value - recent[0].value;
        var arrow = diff > 0.0001 ? '↑' : diff < -0.0001 ? '↓' : '→';
        var good = diff === 0 ? null : (higherIsBetter ? diff > 0 : diff < 0);
        var color = good === null ? 'var(--muted)' : good ? 'var(--success)' : 'var(--danger)';
        return {arrow:arrow, color:color, good:good};
    }

    function renderProductKPIsView() {
        var products = app.data.products || [];
        var pkpis    = app.data.costAnalysis.productKpis || [];

        // Product filter tabs
        var tabs = '<div class="prod-kpi-tabs">'
            + '<button class="prod-kpi-tab' + (!_prodKpiProductId ? ' active' : '') + '" '
            + 'onclick="window._ca._setProdKpiProduct(null)">All Products</button>'
            + products.map(function(p) {
                var cnt = pkpis.filter(function(k){ return k.productId === p.id; }).length;
                return '<button class="prod-kpi-tab' + (_prodKpiProductId === p.id ? ' active' : '') + '" '
                    + 'onclick="window._ca._setProdKpiProduct(\'' + p.id + '\')">'
                    + escapeHtmlPK(p.name)
                    + (cnt ? ' <span class="prod-kpi-tab-count">' + cnt + '</span>' : '')
                    + '</button>';
            }).join('')
            + '</div>';

        var visible = _prodKpiProductId
            ? pkpis.filter(function(k){ return k.productId === _prodKpiProductId; })
            : pkpis;

        var emptyState = '<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--muted);">'
            + (products.length === 0
                ? 'No products found. Add products first in the Products section.'
                : 'No KPIs yet. Click <strong>+ New KPI</strong> to track your first metric.')
            + '</div>';

        var cards = visible.length === 0 ? emptyState
            : visible.map(function(k){ return _renderPKCard(k, products); }).join('');

        return '<div class="ca-kpi-page">'
            + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">'
            + '<h3 style="margin:0;font-size:15px;font-weight:600;color:var(--text);">Product KPIs</h3>'
            + '<button class="btn btn-primary btn-small" onclick="window._ca.showProductKpiModal()">+ New KPI</button>'
            + '</div>'
            + tabs
            + '<div class="prod-kpi-grid">' + cards + '</div>'
            + '</div>';
    }

    function _renderPKCard(k, products) {
        var product  = (products || []).find(function(p){ return p.id === k.productId; });
        var prodName = product ? product.name : 'Unknown Product';
        var pts      = (k.dataPoints || []).slice().sort(function(a,b){ return new Date(a.date)-new Date(b.date); });
        var latest   = pts[pts.length - 1];
        var curVal   = latest ? latest.value : null;
        var tr       = _pkTrend(pts, k.higherIsBetter);

        // Status colour vs target
        var statusColor = 'var(--text)';
        if (curVal !== null && k.target !== null && k.target !== undefined) {
            var onTarget = k.higherIsBetter ? curVal >= k.target : curVal <= k.target;
            statusColor = onTarget ? 'var(--success)' : 'var(--danger)';
        }

        var dateStr = latest ? new Date(latest.date).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'2-digit'}) : '';

        return '<div class="prod-kpi-card" onclick="window._ca.showProductKpiDetailModal(\'' + k.id + '\')">'
            + '<div class="prod-kpi-card-top">'
            + '<span class="prod-kpi-product-tag">' + escapeHtmlPK(prodName) + '</span>'
            + '<div class="prod-kpi-card-actions" onclick="event.stopPropagation()">'
            + '<button class="icon-btn" title="Log data" onclick="window._ca.showProductKpiLogModal(\'' + k.id + '\')">+</button>'
            + '<button class="icon-btn" title="Edit" onclick="window._ca.showProductKpiModal(\'' + k.id + '\')">Edit</button>'
            + '<button class="icon-btn icon-btn-danger" title="Delete" onclick="window._ca.deleteProductKpi(\'' + k.id + '\')">×</button>'
            + '</div></div>'
            + '<div class="prod-kpi-card-name">' + escapeHtmlPK(k.name) + '</div>'
            + '<div class="prod-kpi-card-value" style="color:' + statusColor + '">'
            + _fmtPKVal(curVal, k.unit)
            + (pts.length >= 2 ? ' <span style="font-size:18px;color:' + tr.color + ';font-weight:700;">' + tr.arrow + '</span>' : '')
            + '</div>'
            + '<div class="prod-kpi-card-meta">'
            + 'Target: ' + _fmtPKVal(k.target, k.unit)
            + ' &nbsp;·&nbsp; ' + escapeHtmlPK(k.cadence || 'Monthly')
            + (k.higherIsBetter ? ' &nbsp;·&nbsp; ↑ higher better' : ' &nbsp;·&nbsp; ↓ lower better')
            + '</div>'
            + (dateStr ? '<div class="prod-kpi-card-date">Last updated ' + dateStr + '</div>' : '')
            + '</div>';
    }

    function _setProdKpiProduct(productId) {
        _prodKpiProductId = productId;
        renderCostAnalysisPage();
    }

    function showProductKpiModal(kpiId) {
        var pkpis    = app.data.costAnalysis.productKpis || [];
        var products = app.data.products || [];
        var k        = kpiId ? pkpis.find(function(x){ return x.id === kpiId; }) : null;

        if (products.length === 0) { showToast('Add a product first', 'error'); return; }

        var productOpts = products.map(function(p) {
            var sel = (k && k.productId === p.id) ? ' selected' : (!k && _prodKpiProductId === p.id ? ' selected' : '');
            return '<option value="' + p.id + '"' + sel + '>' + escapeHtmlPK(p.name) + '</option>';
        }).join('');

        var html = '<div class="modal-overlay" id="prodKpiModal">'
            + '<div class="modal" style="max-width:480px;">'
            + '<div class="modal-header"><h3>' + (k ? 'Edit' : 'New') + ' Product KPI</h3>'
            + '<button class="modal-close" onclick="document.getElementById(\'prodKpiModal\').remove()">×</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-group"><label class="form-label">Product *</label>'
            + '<select id="pk-product" class="form-control">' + productOpts + '</select></div>'
            + '<div class="form-group"><label class="form-label">KPI Name *</label>'
            + '<input id="pk-name" class="form-control" value="' + escapeHtmlPK(k ? k.name : '') + '" placeholder="e.g. BOM Cost Per Unit, On-Time Delivery %"></div>'
            + '<div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
            + '<div class="form-group"><label class="form-label">Target Value *</label>'
            + '<input id="pk-target" class="form-control" type="number" step="any" value="' + (k ? k.target : '') + '"></div>'
            + '<div class="form-group"><label class="form-label">Unit</label>'
            + '<input id="pk-unit" class="form-control" value="' + escapeHtmlPK(k ? k.unit : '') + '" placeholder="%, $, days, count…"></div>'
            + '</div>'
            + '<div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
            + '<div class="form-group"><label class="form-label">Cadence</label>'
            + '<select id="pk-cadence" class="form-control">'
            + ['Weekly','Monthly','Quarterly'].map(function(c){
                return '<option' + (k && k.cadence===c ? ' selected' : (!k && c==='Monthly' ? ' selected' : '')) + '>' + c + '</option>';
            }).join('')
            + '</select></div>'
            + '<div class="form-group"><label class="form-label">Direction</label>'
            + '<select id="pk-dir" class="form-control">'
            + '<option value="1"' + (k && k.higherIsBetter ? ' selected' : '') + '>↑ Higher is better</option>'
            + '<option value="0"' + (k && !k.higherIsBetter ? ' selected' : '') + '>↓ Lower is better</option>'
            + '</select></div>'
            + '</div>'
            + '<div class="form-group"><label class="form-label">Notes</label>'
            + '<textarea id="pk-notes" class="form-control" rows="2">' + escapeHtmlPK(k ? k.notes : '') + '</textarea></div>'
            + '</div>'
            + '<div class="modal-footer">'
            + '<button class="btn btn-secondary" onclick="document.getElementById(\'prodKpiModal\').remove()">Cancel</button>'
            + '<button class="btn btn-primary" onclick="window._ca.saveProductKpi(\'' + (kpiId || '') + '\')">Save</button>'
            + '</div></div></div>';

        var existing = document.getElementById('prodKpiModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function saveProductKpi(kpiId) {
        var name   = (document.getElementById('pk-name').value || '').trim();
        var prodId = document.getElementById('pk-product').value;
        var target = parseFloat(document.getElementById('pk-target').value);
        if (!name) { showToast('KPI name is required', 'error'); return; }
        if (!prodId) { showToast('Product is required', 'error'); return; }
        if (isNaN(target)) { showToast('Target value is required', 'error'); return; }

        var pkpis = app.data.costAnalysis.productKpis || (app.data.costAnalysis.productKpis = []);
        if (kpiId) {
            var k = pkpis.find(function(x){ return x.id === kpiId; });
            if (k) {
                k.productId      = prodId;
                k.name           = name;
                k.target         = target;
                k.unit           = document.getElementById('pk-unit').value.trim();
                k.cadence        = document.getElementById('pk-cadence').value;
                k.higherIsBetter = document.getElementById('pk-dir').value === '1';
                k.notes          = document.getElementById('pk-notes').value.trim();
            }
        } else {
            pkpis.push({
                id: generateId(), productId: prodId, name: name, target: target,
                unit: document.getElementById('pk-unit').value.trim(),
                cadence: document.getElementById('pk-cadence').value,
                higherIsBetter: document.getElementById('pk-dir').value === '1',
                notes: document.getElementById('pk-notes').value.trim(),
                dataPoints: [], createdAt: new Date().toISOString()
            });
        }
        saveData();
        document.getElementById('prodKpiModal').remove();
        renderCostAnalysisPage();
        showToast('KPI saved', 'success');
    }

    function deleteProductKpi(kpiId) {
        if (!confirm('Delete this KPI and all its data?')) return;
        app.data.costAnalysis.productKpis = (app.data.costAnalysis.productKpis || [])
            .filter(function(k){ return k.id !== kpiId; });
        saveData();
        renderCostAnalysisPage();
        showToast('KPI deleted');
    }

    function showProductKpiLogModal(kpiId) {
        var k = (app.data.costAnalysis.productKpis || []).find(function(x){ return x.id === kpiId; });
        if (!k) return;
        var today = new Date().toISOString().slice(0,10);
        var html = '<div class="modal-overlay" id="prodKpiLogModal">'
            + '<div class="modal" style="max-width:380px;">'
            + '<div class="modal-header"><h3>Log: ' + escapeHtmlPK(k.name) + '</h3>'
            + '<button class="modal-close" onclick="document.getElementById(\'prodKpiLogModal\').remove()">×</button></div>'
            + '<div class="modal-body">'
            + '<div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
            + '<div class="form-group"><label class="form-label">Date *</label>'
            + '<input id="pk-log-date" class="form-control" type="date" value="' + today + '"></div>'
            + '<div class="form-group"><label class="form-label">Value' + (k.unit ? ' (' + escapeHtmlPK(k.unit) + ')' : '') + ' *</label>'
            + '<input id="pk-log-val" class="form-control" type="number" step="any" placeholder="' + _fmtPKVal(k.target, k.unit) + '"></div>'
            + '</div>'
            + '<div class="form-group"><label class="form-label">Note</label>'
            + '<input id="pk-log-note" class="form-control" placeholder="Optional context…"></div>'
            + '</div>'
            + '<div class="modal-footer">'
            + '<button class="btn btn-secondary" onclick="document.getElementById(\'prodKpiLogModal\').remove()">Cancel</button>'
            + '<button class="btn btn-primary" onclick="window._ca.logProductKpiDataPoint(\'' + kpiId + '\')">Log</button>'
            + '</div></div></div>';
        var existing = document.getElementById('prodKpiLogModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', html);
        setTimeout(function(){ var el = document.getElementById('pk-log-val'); if(el) el.focus(); }, 50);
    }

    function logProductKpiDataPoint(kpiId) {
        var k = (app.data.costAnalysis.productKpis || []).find(function(x){ return x.id === kpiId; });
        if (!k) return;
        var date = document.getElementById('pk-log-date').value;
        var val  = parseFloat(document.getElementById('pk-log-val').value);
        var note = (document.getElementById('pk-log-note').value || '').trim();
        if (!date) { showToast('Date is required', 'error'); return; }
        if (isNaN(val)) { showToast('Value is required', 'error'); return; }
        if (!k.dataPoints) k.dataPoints = [];
        // Replace if same date, else append
        var idx = k.dataPoints.findIndex(function(d){ return d.date === date; });
        if (idx >= 0) k.dataPoints[idx] = {date:date, value:val, note:note};
        else k.dataPoints.push({date:date, value:val, note:note});
        saveData();
        document.getElementById('prodKpiLogModal').remove();
        renderCostAnalysisPage();
        showToast('Data point logged', 'success');
    }

    function showProductKpiDetailModal(kpiId) {
        var k = (app.data.costAnalysis.productKpis || []).find(function(x){ return x.id === kpiId; });
        if (!k) return;
        var products = app.data.products || [];
        var product  = products.find(function(p){ return p.id === k.productId; });
        var pts      = (k.dataPoints || []).slice().sort(function(a,b){ return new Date(a.date)-new Date(b.date); });

        var histRows = pts.length === 0
            ? '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:16px;">No data logged yet.</td></tr>'
            : pts.slice().reverse().map(function(d){
                var tr = _pkTrend(pts.slice(0, pts.indexOf(d)+1), k.higherIsBetter);
                return '<tr>'
                    + '<td>' + new Date(d.date).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) + '</td>'
                    + '<td style="font-weight:600;">' + _fmtPKVal(d.value, k.unit) + '</td>'
                    + '<td style="color:var(--muted);font-size:12px;">' + escapeHtmlPK(d.note || '') + '</td>'
                    + '</tr>';
            }).join('');

        var latest = pts[pts.length-1];
        var tr     = _pkTrend(pts, k.higherIsBetter);
        var statusColor = 'var(--text)';
        if (latest && k.target !== null && k.target !== undefined) {
            statusColor = (k.higherIsBetter ? latest.value >= k.target : latest.value <= k.target)
                ? 'var(--success)' : 'var(--danger)';
        }

        // Sparkline-style mini chart data
        var sparkData = pts.slice(-12).map(function(d){ return d.value; });
        var sparkMin  = Math.min.apply(null, sparkData.concat([k.target]));
        var sparkMax  = Math.max.apply(null, sparkData.concat([k.target]));
        var sparkRange = sparkMax - sparkMin || 1;
        var W = 440, H = 80, pad = 12;
        var spPts = sparkData.map(function(v,i){
            var x = pad + (sparkData.length < 2 ? W/2-pad : (W - pad*2) * i / (sparkData.length - 1));
            var y = H - pad - ((v - sparkMin) / sparkRange) * (H - pad*2);
            return [x, y];
        });
        var polyline = spPts.map(function(p){ return p[0]+','+p[1]; }).join(' ');
        var targetY  = H - pad - ((k.target - sparkMin) / sparkRange) * (H - pad*2);

        var sparkSvg = '<svg width="' + W + '" height="' + H + '" style="width:100%;height:80px;display:block;overflow:visible;">'
            + (spPts.length > 1 ? '<polyline points="' + polyline + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>' : '')
            + spPts.map(function(p){ return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="var(--accent)"/>'; }).join('')
            + '<line x1="' + pad + '" y1="' + targetY + '" x2="' + (W-pad) + '" y2="' + targetY + '" stroke="var(--danger)" stroke-width="1" stroke-dasharray="4 3" opacity="0.7"/>'
            + '<text x="' + (W-pad+2) + '" y="' + (targetY+4) + '" fill="var(--danger)" font-size="9" opacity="0.7">target</text>'
            + '</svg>';

        var html = '<div class="modal-overlay" id="prodKpiDetailModal">'
            + '<div class="modal" style="max-width:560px;">'
            + '<div class="modal-header">'
            + '<div><h3 style="margin:0 0 2px;">' + escapeHtmlPK(k.name) + '</h3>'
            + '<div style="font-size:12px;color:var(--muted);">' + escapeHtmlPK(product ? product.name : '') + ' · ' + escapeHtmlPK(k.cadence||'Monthly') + '</div></div>'
            + '<button class="modal-close" onclick="document.getElementById(\'prodKpiDetailModal\').remove()">×</button></div>'
            + '<div class="modal-body">'
            + '<div style="display:flex;gap:24px;margin-bottom:20px;align-items:flex-start;">'
            + '<div><div style="font-size:32px;font-weight:700;color:' + statusColor + ';line-height:1;">'
            + _fmtPKVal(latest ? latest.value : null, k.unit) + '</div>'
            + '<div style="font-size:12px;color:var(--muted);margin-top:4px;">Current</div></div>'
            + '<div><div style="font-size:32px;font-weight:700;color:var(--muted-2);line-height:1;">' + _fmtPKVal(k.target, k.unit) + '</div>'
            + '<div style="font-size:12px;color:var(--muted);margin-top:4px;">Target</div></div>'
            + (pts.length >= 2 ? '<div><div style="font-size:32px;font-weight:700;color:' + tr.color + ';line-height:1;">' + tr.arrow + '</div>'
                + '<div style="font-size:12px;color:var(--muted);margin-top:4px;">Trend</div></div>' : '')
            + '</div>'
            + (sparkData.length > 0 ? '<div style="background:var(--surface-2);border-radius:var(--radius);padding:12px;margin-bottom:16px;">' + sparkSvg + '</div>' : '')
            + '<table class="data-table"><thead><tr><th>Date</th><th>Value</th><th>Note</th></tr></thead>'
            + '<tbody>' + histRows + '</tbody></table>'
            + '</div>'
            + '<div class="modal-footer">'
            + '<button class="btn btn-secondary" onclick="document.getElementById(\'prodKpiDetailModal\').remove()">Close</button>'
            + '<button class="btn btn-primary" onclick="document.getElementById(\'prodKpiDetailModal\').remove();window._ca.showProductKpiLogModal(\'' + kpiId + '\')">+ Log Data</button>'
            + '</div></div></div>';
        var existing = document.getElementById('prodKpiDetailModal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', html);
    }

    window._ca = {
        // Parts
        showAddPartModal, showEditPartModal, showPartDetailModal, _toggleFinishCost,
        showPOModal, savePO, deletePO,
        showAddRFQModal, showPasteImportModal, handleCSVUpload,
        previewPaste, commitPasteImport, _commitCSVImport,
        exportCostCSV, savePart, saveRFQ, deletePart, deleteRFQ,
        updateBoatsPerYear, updatePOTotal,
        // In-house cost
        showInHouseCostModal, saveInHouseCost,
        _ihAddRow, _ihRemoveRow, _ihRowChange, _ihUpdateTotal, _ihClear, _ihQtyChange,
        _ihAddLaborRow, _ihRemoveLaborRow, _ihLaborRowChange,
        _ihWCChange, _ihMatSelectChange,
        // Quarterly snapshots
        showCaptureSnapshotModal, captureSnapshot, deleteSnapshot,
        switchView, setKpiSubView, _setRMSort, _setRMSearch, _setCompSort, _setCompFilter, _setCompProductFilter, _setCompSearch,
        // Raw Materials
        showRawMaterialForm, saveRawMaterial, deleteRawMaterial,
        showRawMatPasteModal, handleRMCSVUpload, exportRMCSV,
        _previewRMPaste, _commitRMPaste, _commitRMCSVImport,
        // Work Centers
        showWorkCenterForm, saveWorkCenter, deleteWorkCenter,
        showWCPasteModal, handleWCCSVUpload, exportWCCSV,
        _previewWCPaste, _commitWCPaste,
        // Phase 1: RFQ Alerts
        showSupplyRisks,
        // Phase 2: Savings Pipeline
        _setPipelineStage, _setPipelineView, _bulkMoveStage,
        // Phase 3: Make vs. Buy
        saveMakeVsBuy, _updateMvbResult,
        // Phase 4: Basket Compare
        showBasketCompareModal, _renderBasketTable,
        // Price History
        showAddPriceHistoryModal, savePriceHistoryEntry,
        // Data Audit
        _setAuditFilter,
        // TLAs
        _tlaSetDetail, showTLAModal, saveTLA, deleteTLA,
        addTLAItem, removeTLAItem,
        showTLAPartPicker, _filterTLAPicker, _commitTLAPartPicker,
        showTLAPasteModal, _previewTLAPaste, _commitTLAPaste, handleTLACSV,
        // Product KPIs
        _setProdKpiProduct,
        showProductKpiModal, saveProductKpi, deleteProductKpi,
        showProductKpiLogModal, logProductKpiDataPoint,
        showProductKpiDetailModal
    };

    window.renderCostAnalysisPage = renderCostAnalysisPage;

})();
