/* =========================
   js/shingo-model.js  v3
   Shingo Model — Supply Chain CI Edition
   ========================= */
(function () {
    'use strict';

    function escapeHtml(t) {
        if (!t) return '';
        return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    var DIMENSIONS = {
        'cultural':  { label: 'Cultural Enablers',     color: '#4a8fc7', desc: 'The foundation of supply chain excellence — without these, tools and processes collapse.' },
        'ci':        { label: 'Continuous Improvement', color: '#38bdf8', desc: 'The engine that drives waste out of the supply chain, one experiment at a time.' },
        'alignment': { label: 'Enterprise Alignment',   color: '#fb923c', desc: 'Ensures SC strategy connects to Saronic\'s production mission, not just cost targets.' },
        'results':   { label: 'Results',                color: '#a78bfa', desc: 'The proof — parts arrive on time, defect-free, at the right cost, enabling the build.' }
    };

    // SC function tags
    var SC_FUNCS = {
        'suppdev':   { label: 'Supplier Dev',      color: '#4a8fc7' },
        'procure':   { label: 'Procurement',        color: '#38bdf8' },
        'quality':   { label: 'Incoming Quality',   color: '#a78bfa' },
        'inventory': { label: 'Inventory',          color: '#fb923c' },
        'strategy':  { label: 'SC Strategy',        color: '#f59e0b' }
    };

    var PRINCIPLES = [
        {
            id: 'respect', dimension: 'cultural',
            name: 'Respect Every Individual',
            summary: 'Suppliers are strategic partners, not interchangeable vendors. Internal customers — the production line — deserve the same respect as leadership.',
            scFocus: ['suppdev','procure','quality'],
            scApplication: 'In supply chain, respect shows up in how you engage suppliers: do you listen to their constraints, or just push harder on price and lead time? It also shows in how you treat the receiving team — their daily feedback about incoming parts is gold.',
            idealBehaviors: [
                'Treat suppliers as long-term partners, not cost-cutting targets',
                'Listen to the receiving team — they see incoming quality problems first',
                'Involve suppliers in design reviews and spec development early',
                'Acknowledge supplier effort when they go above and beyond',
                'Ask the production line what they actually need from supply chain'
            ],
            atRiskBehaviors: [
                'Purely transactional supplier relationships (PO in, parts out)',
                'Ignoring feedback from the people handling incoming parts',
                'Blaming suppliers without understanding their constraints',
                'Making sourcing decisions without consulting end users'
            ],
            raymerNote: 'Respect in supply chain is visible in RFQ language, PO terms, and how you open a supplier call. A partner relationship requires mutual respect long before a crisis hits.'
        },
        {
            id: 'humility', dimension: 'cultural',
            name: 'Lead with Humility',
            summary: 'Go to the gemba — the supplier floor, the receiving dock, the production line. You cannot manage supply chain risk from a spreadsheet.',
            scFocus: ['suppdev','quality'],
            scApplication: 'Humility for a SC CI Manager means physically going to where the work happens: supplier facilities, the receiving dock, the line where parts get assembled. The people doing the work know things your data cannot tell you.',
            idealBehaviors: [
                'Conduct regular supplier site visits — go see their process, not just their metrics',
                'Walk the receiving dock and ask what makes their job harder',
                'Admit when specs or PO terms are unclear or unrealistic',
                'Seek out supplier feedback on Saronic\'s own processes',
                'Ask "what am I missing?" before making a sourcing decision'
            ],
            atRiskBehaviors: [
                'Managing all suppliers entirely via email and scorecards',
                'Assuming supplier problems are always the supplier\'s fault',
                'Never visiting the production line to understand true demand',
                'Dismissing supplier concerns as excuses'
            ],
            raymerNote: 'The best supply chain intel doesn\'t come from a dashboard — it comes from standing on a supplier\'s shop floor asking why a fixture takes 45 minutes to set up.'
        },
        {
            id: 'perfection', dimension: 'ci',
            name: 'Seek Perfection',
            summary: 'Zero late deliveries. Zero incoming defects. Perfect supplier alignment to Saronic\'s production schedule. The north star is never fully reached — but always pursued.',
            scFocus: ['quality','suppdev','inventory'],
            scApplication: 'Perfection in SC means not settling for "our on-time delivery is 82% which is industry average." Industry average is the floor, not the ceiling. Every late part, every incoming defect, every excess inventory dollar is an invitation to improve.',
            idealBehaviors: [
                'Set targets beyond industry benchmarks — 95%+ OTD, zero incoming defects',
                'Track first-pass yield on incoming parts by supplier',
                'Pursue supplier development over supplier replacement when possible',
                'Celebrate incremental SC improvements publicly'
            ],
            atRiskBehaviors: [
                'Accepting supplier defect rates as "within tolerance" without asking why',
                'Only reacting to supply failures after they stop the line',
                'Benchmarking against industry average rather than theoretical best'
            ],
            raymerNote: 'A 95% on-time delivery rate sounds great. But at 50 parts per boat, 5% late means 2-3 parts holding up every build. Perfection-seeking means feeling that pain acutely, not normalizing it.'
        },
        {
            id: 'scientific', dimension: 'ci',
            name: 'Embrace Scientific Thinking',
            summary: 'Every supplier change, every process improvement, every sourcing decision should be a hypothesis tested with data — not a gut call.',
            scFocus: ['procure','quality','suppdev'],
            scApplication: 'Scientific thinking in supply chain means running A3s on supply disruptions, using data to drive supplier selection (not just price and relationships), and treating every improvement as an experiment with a measurable outcome.',
            idealBehaviors: [
                'Run A3 root cause analysis on every supply disruption, not just the big ones',
                'Use data (lead time variance, defect rates, cost trend) to select suppliers',
                'Define success criteria before launching a supplier improvement initiative',
                'Document learnings from failed sourcing decisions'
            ],
            atRiskBehaviors: [
                'Choosing suppliers primarily on price or existing relationships',
                'Reacting to supply crises without structured root cause analysis',
                'Making process changes without measuring before/after'
            ],
            raymerNote: 'In supply chain, "we\'ve always used that supplier" is the enemy of scientific thinking. Every incumbent should have to earn their position through data, not history.'
        },
        {
            id: 'process', dimension: 'ci',
            name: 'Focus on Process',
            summary: 'Standard work for procurement, receiving, supplier qualification, and escalation eliminates variation and makes problems visible immediately.',
            scFocus: ['procure','quality'],
            scApplication: 'SC process focus means: every buyer runs the same PO process, every new supplier goes through the same qualification gates, every incoming shipment gets inspected the same way. Variation in the SC process creates variation in the outcome — late parts, missed specs, cost surprises.',
            idealBehaviors: [
                'Document standard work for PO creation, approval, and change order',
                'Maintain a documented supplier qualification process with clear gates',
                'Define standard escalation paths for supply disruptions',
                'Involve the receiving team in designing inspection standards'
            ],
            atRiskBehaviors: [
                'Every buyer has their own way of managing supplier relationships',
                'Supplier onboarding varies based on who handles it',
                'No standard for how supply emergencies are escalated',
                'Creating process docs once and never updating them'
            ],
            raymerNote: 'If every buyer on your team would answer a supplier\'s question differently, you don\'t have a process — you have a collection of individual habits.'
        },
        {
            id: 'quality', dimension: 'ci',
            name: 'Assure Quality at the Source',
            summary: 'Never accept, create, or pass a defective part. Every supplier is the last line of defense before that part reaches the Saronic production line.',
            scFocus: ['quality','suppdev'],
            scApplication: 'For supply chain, quality at the source means First Article Inspection for new parts, supplier quality audits, clear acceptance criteria in every PO, and the cultural backing to reject a shipment even under schedule pressure.',
            idealBehaviors: [
                'Require and review First Article Inspection (FAI) for all new parts',
                'Conduct supplier quality audits — not just scorecards, actual visits',
                'Make acceptance criteria explicit on every PO, not assumed',
                'Support the receiving team when they reject a non-conforming shipment',
                'Track and publish incoming quality data by supplier'
            ],
            atRiskBehaviors: [
                'Accepting parts without inspection under schedule pressure',
                'Relying on final assembly to catch supplier-introduced defects',
                'Penalizing the receiving team for slowing the line by rejecting parts'
            ],
            raymerNote: 'The moment you let one bad shipment through "because we need to hit the build schedule," you\'ve told the supplier — and your own team — that quality is negotiable.'
        },
        {
            id: 'flow', dimension: 'ci',
            name: 'Flow & Pull Value',
            summary: 'Parts should arrive when the line needs them — not sitting in a warehouse for weeks, not arriving late. Build SC around demand, not forecast.',
            scFocus: ['inventory','procure'],
            scApplication: 'Pull-based supply chain for Saronic means understanding the actual build schedule and pulling parts to match it — not pushing safety stock "just in case." Every dollar of excess inventory is a sign of either unreliable suppliers or poor demand communication.',
            idealBehaviors: [
                'Align replenishment to actual production pull signals, not rolling forecasts',
                'Work to reduce safety stock by improving supplier reliability',
                'Map the supply chain value stream and identify waiting and batching waste',
                'Measure and reduce supplier lead time variability, not just average'
            ],
            atRiskBehaviors: [
                'Building excess inventory to cover for unreliable suppliers instead of fixing reliability',
                'Batch ordering to meet MOQs without challenging the MOQ',
                'Measuring warehouse size as a sign of preparedness'
            ],
            raymerNote: 'Safety stock is the physical evidence of a trust problem. Reducing it isn\'t about taking risk — it\'s about building the supplier relationships and processes that make it unnecessary.'
        },
        {
            id: 'systemic', dimension: 'alignment',
            name: 'Think Systemically',
            summary: 'A single-supplier failure can stop a boat build. Supply chain decisions have second and third-order effects that local cost optimization never sees.',
            scFocus: ['strategy','procure'],
            scApplication: 'Systemic thinking in SC means understanding how a 2-week supplier slip cascades into a 6-week production delay. It means evaluating total cost of ownership — not just unit price. It means seeing your supply chain as a system, not a list of vendors.',
            idealBehaviors: [
                'Map single-source dependencies and develop mitigation plans',
                'Evaluate total cost of ownership (TCO) — lead time, quality, risk — not just price',
                'Communicate SC risks and tradeoffs to production planning proactively',
                'Understand how supplier changes affect downstream assembly processes'
            ],
            atRiskBehaviors: [
                'Optimizing for unit price while ignoring lead time and quality risk',
                'Single-sourcing critical parts without awareness or mitigation',
                'SC function operates in a silo with no visibility into production schedule'
            ],
            raymerNote: 'The cheapest supplier on a spreadsheet is often the most expensive supplier in practice. Systemic thinking makes the full cost visible before the decision, not after.'
        },
        {
            id: 'purpose', dimension: 'alignment',
            name: 'Create Constancy of Purpose',
            summary: 'Supply chain exists to enable Saronic to build boats on schedule. Every sourcing decision, supplier relationship, and process improvement should trace back to that mission.',
            scFocus: ['strategy'],
            scApplication: 'Constancy of purpose means your suppliers know Saronic\'s build targets and growth trajectory. It means the SC team can articulate how their work enables the production schedule. It means strategy doesn\'t change every quarter based on whoever is loudest.',
            idealBehaviors: [
                'Communicate Saronic\'s production roadmap to key suppliers — they\'re partners',
                'Align SC metrics directly to production outcomes (line stoppages, build rate)',
                'Hold a consistent SC strategy across quarters, not reactive pivots',
                'Make trade-off decisions transparently, citing SC mission'
            ],
            atRiskBehaviors: [
                'Suppliers don\'t know Saronic\'s growth plans or what\'s coming in the next quarter',
                'SC team success measured by cost savings alone, not production support',
                'Sourcing strategy changes with every leadership conversation'
            ],
            raymerNote: 'If your key suppliers don\'t know your production targets, you\'ve made them reactive by design. A supply chain built on constancy shares context, not just POs.'
        },
        {
            id: 'value', dimension: 'results',
            name: 'Create Value for the Customer',
            summary: 'The production line is your internal customer. A boat rolling out on schedule, defect-free, is the ultimate proof of supply chain excellence.',
            scFocus: ['strategy','quality'],
            scApplication: 'In SC, value creation means the production line gets what it needs, when it needs it, at the right quality — every time. SC success is not just cost savings; it\'s boats built on schedule because parts showed up right.',
            idealBehaviors: [
                'Define the production line\'s needs and measure SC performance against them',
                'Track and report supply-chain-driven line stoppages as a primary KPI',
                'Eliminate SC-caused production delays as a key CI initiative',
                'Engage production regularly — not just when there\'s a problem'
            ],
            atRiskBehaviors: [
                'SC success measured only by cost savings, ignoring production impact',
                'Supply-driven line stoppages reported as "supplier issue" not SC ownership',
                'No regular communication between SC and production planning'
            ],
            raymerNote: 'Every late part, every line stoppage, every defect that reaches assembly is supply chain\'s problem to own — even when it\'s the supplier\'s fault. Ownership is the difference between a function and a partner.'
        }
    ];

    // ── State ────────────────────────────────────────────────────────────────
    var _tab = 'overview';
    var _assessFilter = 'all';
    var _expandedCard = null;
    var _selectedStar = 0;
    var _radarChart = null;
    var _tiChart = null;
    var _ciExpandedMonth = null;

    function ensureData() {
        if (!app.data.shingo) app.data.shingo = {};
        var d = app.data.shingo;
        if (!d.assessments)   d.assessments   = [];
        if (!d.sss)           d.sss            = { speed:5, scale:5, substance:5, notes:'', history:[] };
        if (!d.sss.history)   d.sss.history    = [];
        if (!d.behaviorLogs)  d.behaviorLogs   = [];
        if (!d.gembaWalks)    d.gembaWalks     = [];
        if (!d.ciFocus)       d.ciFocus        = { months: [] };
    }

    function getLatestScore(pid) {
        var a = app.data.shingo.assessments.slice().reverse().find(function(x){ return x.principleId === pid; });
        return a ? a.score : null;
    }

    function getDimAvg(dimKey) {
        var ps = PRINCIPLES.filter(function(p){ return p.dimension === dimKey; });
        var sc = ps.map(function(p){ return getLatestScore(p.id); }).filter(function(s){ return s !== null; });
        return sc.length ? sc.reduce(function(a,b){return a+b;},0)/sc.length : null;
    }

    function scoreColor(s) {
        return s >= 4 ? '#4a8fc7' : s >= 3 ? '#ffb800' : '#ff4757';
    }

    function svgRing(score, max, size) {
        size = size || 54;
        var r = (size - 10) / 2;
        var cx = size / 2;
        var circ = 2 * Math.PI * r;
        var fill = score ? (score / max) * circ : 0;
        var c = score ? scoreColor(score) : 'rgba(255,255,255,0.08)';
        return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="transform:rotate(-90deg);display:block;flex-shrink:0">'
            + '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="5"/>'
            + '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="' + c + '" stroke-width="5" '
            + 'stroke-dasharray="' + fill.toFixed(2) + ' ' + circ.toFixed(2) + '" stroke-linecap="round"/>'
            + '</svg>';
    }

    // ── SC Live Data ─────────────────────────────────────────────────────────
    function getSCStats() {
        var stats = { suppliers:0, avgQuality:null, avgDelivery:null, partsNoSupplier:0, openIssues:0, rfqs:0 };
        try {
            var suppliers = app.data.suppliers || [];
            stats.suppliers = suppliers.length;
            if (suppliers.length) {
                var qScores = suppliers.filter(function(s){ return s.quality; }).map(function(s){ return s.quality; });
                var dScores = suppliers.filter(function(s){ return s.delivery; }).map(function(s){ return s.delivery; });
                if (qScores.length) stats.avgQuality = (qScores.reduce(function(a,b){return a+b;},0)/qScores.length).toFixed(1);
                if (dScores.length) stats.avgDelivery = (dScores.reduce(function(a,b){return a+b;},0)/dScores.length).toFixed(1);
            }
            var ca = (app.data.costAnalysis || {});
            var parts = ca.parts || [];
            stats.partsNoSupplier = parts.filter(function(p){ return !p.supplier; }).length;
            var rfqs = ca.rfqs || [];
            stats.rfqs = rfqs.length;
            var issues = app.data.issues || [];
            stats.openIssues = issues.filter(function(i){ return i.status !== 'Closed' && i.status !== 'Resolved'; }).length;
        } catch(e){}
        return stats;
    }

    // ── Main Render ──────────────────────────────────────────────────────────
    function renderShingoPage() {
        ensureData();
        var el = document.getElementById('page-shingo');
        if (!el) return;

        if (_radarChart) { try { _radarChart.destroy(); } catch(e){} _radarChart = null; }
        if (_tiChart)    { try { _tiChart.destroy();    } catch(e){} _tiChart    = null; }

        var sss = app.data.shingo.sss;
        var latestMap = {};
        app.data.shingo.assessments.forEach(function(a){ latestMap[a.principleId] = a.score; });
        var scores = Object.values(latestMap);
        var avgScore = scores.length ? (scores.reduce(function(s,v){return s+v;},0)/scores.length).toFixed(1) : null;
        var ti = Math.round((sss.speed * sss.scale * sss.substance) / 100);
        var tiColor = ti >= 7 ? '#4a8fc7' : ti >= 4 ? '#ffb800' : '#ff4757';
        var assessed = Object.keys(latestMap).length;

        var allIssues = app.data.issues || [];
        var openIssues = allIssues.filter(function(i){ return i.status !== 'Closed'; });
        var linkedIssues = allIssues.filter(function(i){ return i.shingoP; });

        var tabs = [
            { id:'overview',   label:'Overview' },
            { id:'principles', label:'Principles' },
            { id:'sss',        label:'Speed · Scale · Substance' },
            { id:'behaviors',  label:'Behavioral Log' },
            { id:'gemba',      label:'Gemba Walk' },
            { id:'issues',     label:'Issues' + (openIssues.length ? ' (' + openIssues.length + ')' : '') },
            { id:'focus',      label:'CI Monthly Focus' }
        ];

        var body = _tab === 'overview'   ? renderOverview()
                 : _tab === 'principles' ? renderPrinciples()
                 : _tab === 'sss'        ? renderSSS()
                 : _tab === 'gemba'      ? renderGembaWalk()
                 : _tab === 'issues'     ? renderIssuesTab()
                 : _tab === 'focus' ? renderCIFocusTab()
                 : renderBehaviorLog();

        el.innerHTML = '<div class="sm-page">'
            + '<div class="sm-header">'
            + '<div class="sm-header-left">'
            + '<h1 class="sm-title">Shingo Model</h1>'
            + '<div class="sm-subtitle">Supply Chain CI · Saronic</div>'
            + '</div>'
            + '<div class="sm-header-stats">'
            + '<div class="sm-hstat"><div class="sm-hstat-val" style="color:var(--accent)">' + (avgScore || '—') + '</div><div class="sm-hstat-lbl">Avg Score</div></div>'
            + '<div class="sm-hstat-sep"></div>'
            + '<div class="sm-hstat"><div class="sm-hstat-val" style="color:' + tiColor + '">' + ti + '</div><div class="sm-hstat-lbl">Transform Index</div></div>'
            + '<div class="sm-hstat-sep"></div>'
            + '<div class="sm-hstat"><div class="sm-hstat-val" style="color:#fb923c">' + assessed + '<span style="font-size:13px;font-weight:400">/10</span></div><div class="sm-hstat-lbl">Assessed</div></div>'
            + '</div>'
            + '</div>'
            + '<div class="sm-tabs">' + tabs.map(function(t){
                return '<button class="sm-tab' + (_tab===t.id?' active':'') + '" onclick="window._sm.setTab(\'' + t.id + '\')">' + t.label + '</button>';
            }).join('') + '</div>'
            + '<div class="sm-body">' + body + '</div>'
            + '</div>';

        if (_tab === 'overview')   setTimeout(initRadarChart, 80);
        if (_tab === 'sss')        setTimeout(initTIChart, 80);
    }

    // ── Overview ─────────────────────────────────────────────────────────────
    function renderOverview() {
        var sc = getSCStats();

        var scPanel = '<div class="sm-sc-panel">'
            + '<div class="sm-sc-panel-title">Your SC Pulse</div>'
            + '<div class="sm-sc-stats">'
            + scStat(sc.suppliers, 'Suppliers', '#4a8fc7', 'window._sm.setTab(\'principles\')')
            + scStat(sc.avgQuality ? sc.avgQuality + '/5' : '—', 'Avg Quality Score', '#a78bfa', null)
            + scStat(sc.avgDelivery ? sc.avgDelivery + '/5' : '—', 'Avg Delivery Score', '#38bdf8', null)
            + scStat(sc.partsNoSupplier, 'Parts w/o Supplier', '#ff4757', null)
            + scStat(sc.rfqs, 'Active RFQs', '#ffb800', null)
            + scStat(sc.openIssues, 'Open Issues', '#fb923c', null)
            + '</div>'
            + '<div class="sm-sc-panel-hint">Data pulled live from your Suppliers, Cost Analysis, and Issues modules.</div>'
            + '</div>';

        var insights = [
            { num:'01', title:'Ideal Results Require Ideal Behavior', body:'On-time delivery and zero defects are lagging indicators. The leading indicators are the behaviors your SC team and suppliers demonstrate every day.' },
            { num:'02', title:'Purpose and Systems Drive Behavior', body:'Suppliers behave consistently with the systems you put them in. Punitive PO terms, last-minute schedule changes, and adversarial audits produce adversarial behavior.' },
            { num:'03', title:'Principles Inform Ideal Behavior', body:'A supplier scorecard is a tool. Supplier development is a principle. Tools without principle create compliance, not excellence.' }
        ];

        var dimCards = Object.entries(DIMENSIONS).map(function(e){
            var key = e[0], dim = e[1];
            var ps = PRINCIPLES.filter(function(p){ return p.dimension === key; });
            var avg = getDimAvg(key);
            var pct = avg ? (avg/5)*100 : 0;
            var assessed = ps.filter(function(p){ return getLatestScore(p.id) !== null; }).length;
            return '<div class="sm-dim-card2" onclick="window._sm.setTab(\'principles\');window._sm.setAssessFilter(\'' + key + '\')" style="border-top:3px solid ' + dim.color + '">'
                + '<div class="sm-dim-card2-head">'
                + '<div class="sm-dim-tag-lg" style="background:' + dim.color + '18;color:' + dim.color + ';border:1px solid ' + dim.color + '33">' + dim.label + '</div>'
                + (avg ? '<div class="sm-dim-avg" style="color:' + dim.color + '">' + parseFloat(avg).toFixed(1) + '<small>/5</small></div>'
                       : '<div class="sm-dim-avg sm-dim-na">N/A</div>')
                + '</div>'
                + '<p class="sm-dim-card2-desc">' + dim.desc + '</p>'
                + '<div class="sm-dim-bar-wrap"><div class="sm-dim-bar" style="width:' + pct + '%;background:' + dim.color + '"></div></div>'
                + '<div class="sm-dim-meta"><span style="color:' + dim.color + '">' + assessed + '/' + ps.length + '</span> assessed · <span style="color:var(--muted)">click to explore</span></div>'
                + '</div>';
        }).join('');

        return '<div class="sm-overview">'
            + '<div class="sm-overview-hero">'
            + '<div class="sm-insights-col">'
            + '<h2 class="sm-section-title">Three Insights · Supply Chain Lens</h2>'
            + insights.map(function(i){
                return '<div class="sm-insight">'
                    + '<div class="sm-insight-num">' + i.num + '</div>'
                    + '<div><strong class="sm-insight-title">' + i.title + '</strong><p class="sm-insight-body">' + i.body + '</p></div>'
                    + '</div>';
            }).join('')
            + scPanel
            + '</div>'
            + '<div class="sm-radar-col">'
            + '<h2 class="sm-section-title">Principle Radar</h2>'
            + '<div class="sm-radar-wrap"><canvas id="sm-radar"></canvas></div>'
            + '<div class="sm-sc-func-legend">'
            + Object.entries(SC_FUNCS).map(function(e){
                return '<span class="sm-sc-func-chip" style="background:' + e[1].color + '18;color:' + e[1].color + ';border:1px solid ' + e[1].color + '33">' + e[1].label + '</span>';
            }).join('')
            + '</div>'
            + '</div>'
            + '</div>'
            + '<h2 class="sm-section-title" style="margin-top:32px">Four Dimensions</h2>'
            + '<div class="sm-dim-grid2">' + dimCards + '</div>'
            + '<h2 class="sm-section-title" style="margin-top:32px">The Shingo Diamond</h2>'
            + renderDiamond()
            + '</div>';
    }

    function scStat(val, label, color, onclick) {
        return '<div class="sm-sc-stat"' + (onclick ? ' onclick="' + onclick + '" style="cursor:pointer"' : '') + '>'
            + '<div class="sm-sc-stat-val" style="color:' + color + '">' + val + '</div>'
            + '<div class="sm-sc-stat-lbl">' + label + '</div>'
            + '</div>';
    }

    function renderDiamond() {
        var cells = [
            null,
            { dim:'results',   color:'#a78bfa', label:'Results',               sub:'Boats built on time, defect-free' },
            null,
            { dim:'ci',        color:'#38bdf8', label:'Continuous Improvement', sub:'Scientific · Process · Flow · Quality · Perfection' },
            'center',
            { dim:'alignment', color:'#fb923c', label:'Enterprise Alignment',   sub:'Systemic Thinking · Constancy of Purpose' },
            null,
            { dim:'cultural',  color:'#4a8fc7', label:'Cultural Enablers',      sub:'Respect · Humility' },
            null
        ];
        return '<div class="sm-diamond-grid">' + cells.map(function(c){
            if (!c) return '<div class="sm-d-empty"></div>';
            if (c === 'center') return '<div class="sm-d-center"><div class="sm-d-core"><div class="sm-d-core-main">Behavior</div><div class="sm-d-core-sub">Systems · Principles</div></div></div>';
            return '<div class="sm-d-cell" onclick="window._sm.setTab(\'principles\');window._sm.setAssessFilter(\'' + c.dim + '\')">'
                + '<span class="sm-d-label" style="color:' + c.color + '">' + c.label + '</span>'
                + '<small>' + c.sub + '</small>'
                + '</div>';
        }).join('') + '</div>';
    }

    function initRadarChart() {
        if (typeof Chart === 'undefined') return;
        var canvas = document.getElementById('sm-radar');
        if (!canvas) return;
        var labels = PRINCIPLES.map(function(p){
            var w = p.name.split(' ');
            return w.length > 2 ? w[0] + ' ' + w[1] : p.name;
        });
        var data = PRINCIPLES.map(function(p){ return getLatestScore(p.id) || 0; });
        var ptColors = PRINCIPLES.map(function(p){ return DIMENSIONS[p.dimension].color; });
        _radarChart = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: 'rgba(74,143,199,0.07)', borderColor: 'rgba(0,200,240,0.5)',
                    pointBackgroundColor: ptColors, pointBorderColor: 'rgba(0,0,0,0.3)',
                    pointRadius: 5, pointHoverRadius: 7, borderWidth: 1.5 }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                scales: { r: { min:0, max:5,
                    ticks: { stepSize:1, color:'rgba(255,255,255,0.2)', font:{size:8}, backdropColor:'transparent' },
                    grid: { color:'rgba(255,255,255,0.06)' }, angleLines: { color:'rgba(255,255,255,0.06)' },
                    pointLabels: { color:'rgba(255,255,255,0.5)', font:{size:9,weight:'500'} }
                }},
                plugins: { legend:{display:false}, tooltip:{ callbacks:{ label:function(ctx){ return ctx.raw>0?'Score: '+ctx.raw+'/5':'Not assessed'; }}}}
            }
        });
    }

    // ── Principles ───────────────────────────────────────────────────────────
    function renderPrinciples() {
        var filterOpts = [
            { key:'all',       label:'All' },
            { key:'cultural',  label:'Cultural',   color: DIMENSIONS.cultural.color },
            { key:'ci',        label:'CI',          color: DIMENSIONS.ci.color },
            { key:'alignment', label:'Alignment',   color: DIMENSIONS.alignment.color },
            { key:'results',   label:'Results',     color: DIMENSIONS.results.color },
            { key:'suppdev',   label:'Supplier Dev',   color: SC_FUNCS.suppdev.color },
            { key:'procure',   label:'Procurement',    color: SC_FUNCS.procure.color },
            { key:'quality',   label:'Incoming Quality',color: SC_FUNCS.quality.color },
            { key:'inventory', label:'Inventory',      color: SC_FUNCS.inventory.color },
            { key:'strategy',  label:'SC Strategy',    color: SC_FUNCS.strategy.color }
        ];
        var filterHtml = filterOpts.map(function(f){
            var isActive = _assessFilter === f.key;
            var style = isActive && f.color ? 'background:' + f.color + ';color:#050e1a;border-color:' + f.color
                      : f.color ? 'border-color:' + f.color + '55;color:' + f.color : '';
            return '<button class="sm-filter-btn' + (isActive?' active':'') + '" style="' + style + '" onclick="window._sm.setAssessFilter(\'' + f.key + '\')">' + f.label + '</button>';
        }).join('');

        var isDimFilter = ['all','cultural','ci','alignment','results'].indexOf(_assessFilter) >= 0;
        var filtered = isDimFilter
            ? (_assessFilter === 'all' ? PRINCIPLES : PRINCIPLES.filter(function(p){ return p.dimension === _assessFilter; }))
            : PRINCIPLES.filter(function(p){ return p.scFocus && p.scFocus.indexOf(_assessFilter) >= 0; });

        return '<div class="sm-principles-page">'
            + '<div class="sm-filter-bar">' + filterHtml + '</div>'
            + '<div class="sm-pcard-grid">' + filtered.map(renderPrincipleCard).join('') + '</div>'
            + '</div>';
    }

    function renderPrincipleCard(p) {
        var dim = DIMENSIONS[p.dimension];
        var score = getLatestScore(p.id);
        var isOpen = _expandedCard === p.id;
        var ring = svgRing(score, 5, 54);
        var sc = score ? scoreColor(score) : null;

        var scFuncTags = (p.scFocus || []).map(function(f){
            var fn = SC_FUNCS[f];
            if (!fn) return '';
            return '<span class="sm-sc-func-chip" style="background:' + fn.color + '18;color:' + fn.color + ';border:1px solid ' + fn.color + '33">' + fn.label + '</span>';
        }).join('');

        var idealHtml = p.idealBehaviors.map(function(b){
            return '<li><span class="sm-bdot" style="background:#4a8fc7"></span>' + escapeHtml(b) + '</li>';
        }).join('');
        var atRiskHtml = p.atRiskBehaviors.map(function(b){
            return '<li><span class="sm-bdot" style="background:#ff4757"></span>' + escapeHtml(b) + '</li>';
        }).join('');

        var historyItems = app.data.shingo.assessments.filter(function(a){ return a.principleId === p.id; }).slice(-3).reverse();
        var histHtml = historyItems.length ? '<div class="sm-pcard-history">'
            + historyItems.map(function(a){
                return '<div class="sm-hist-row">'
                    + '<span class="sm-hist-date">' + a.date + '</span>'
                    + '<span class="sm-hist-score" style="color:' + scoreColor(a.score) + '">' + a.score + '/5</span>'
                    + (a.notes ? '<span class="sm-hist-note">' + escapeHtml(a.notes.slice(0,70)) + (a.notes.length>70?'…':'') + '</span>' : '')
                    + '</div>';
            }).join('') + '</div>' : '';

        return '<div class="sm-pcard' + (isOpen?' open':'') + '" id="smc-' + p.id + '" style="border-top:3px solid ' + dim.color + '">'
            + '<div class="sm-pcard-head" onclick="window._sm.toggleCard(\'' + p.id + '\')">'
            + '<div class="sm-pcard-ring-wrap">'
            + ring
            + '<div class="sm-pcard-score-lbl" style="color:' + (sc||'rgba(255,255,255,0.2)') + '">' + (score||'?') + '</div>'
            + '</div>'
            + '<div class="sm-pcard-info">'
            + '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:5px">'
            + '<span class="sm-dim-tag" style="background:' + dim.color + '18;color:' + dim.color + ';border:1px solid ' + dim.color + '33">' + dim.label + '</span>'
            + scFuncTags
            + '</div>'
            + '<h3 class="sm-pcard-name">' + escapeHtml(p.name) + '</h3>'
            + '<p class="sm-pcard-summary">' + escapeHtml(p.summary) + '</p>'
            + '</div>'
            + '<div class="sm-pcard-chevron">' + (isOpen?'▲':'▼') + '</div>'
            + '</div>'
            + '<div class="sm-pcard-expand">'
            + '<div class="sm-pcard-sc-app"><span class="sm-sc-app-label">SC Application</span>' + escapeHtml(p.scApplication) + '</div>'
            + '<div class="sm-pcard-behaviors">'
            + '<div class="sm-bsection"><div class="sm-bsection-title" style="color:#4a8fc7">Ideal Behaviors</div><ul class="sm-blist">' + idealHtml + '</ul></div>'
            + '<div class="sm-bsection"><div class="sm-bsection-title" style="color:#ff4757">At-Risk Behaviors</div><ul class="sm-blist">' + atRiskHtml + '</ul></div>'
            + '</div>'
            + '<div class="sm-pcard-raymer"><span class="sm-raymer-label">Raymer</span><em>' + escapeHtml(p.raymerNote) + '</em></div>'
            + (histHtml ? '<div class="sm-pcard-sub-title">Recent Assessments</div>' + histHtml : '')
            + '<div class="sm-pcard-actions">'
            + '<button class="btn btn-primary btn-small" onclick="event.stopPropagation();window._sm.showAssessModal(\'' + p.id + '\')">Assess</button>'
            + '<button class="btn btn-secondary btn-small" onclick="event.stopPropagation();window._sm.toggleCard(null)">Collapse</button>'
            + '</div></div>'
            + '</div>';
    }

    function toggleCard(id) {
        _expandedCard = (_expandedCard === id) ? null : id;
        document.querySelectorAll('.sm-pcard').forEach(function(el){
            var elId = el.id.replace('smc-','');
            var open = elId === id && _expandedCard !== null;
            el.classList.toggle('open', open);
            var ch = el.querySelector('.sm-pcard-chevron');
            if (ch) ch.textContent = open ? '▲' : '▼';
        });
    }

    // ── SSS ──────────────────────────────────────────────────────────────────
    function renderSSS() {
        ensureData();
        var sss = app.data.shingo.sss;
        var ti = Math.round((sss.speed * sss.scale * sss.substance) / 100);
        var tiColor = ti >= 7 ? '#4a8fc7' : ti >= 4 ? '#ffb800' : '#ff4757';
        var tiLabel = ti >= 7 ? 'Strong SC Transformation' : ti >= 4 ? 'Developing Transformation' : 'Early / Tool-Focused';
        var dims = [
            { key:'speed', label:'Speed', color:'#38bdf8',
              desc:'How quickly are SC improvements being implemented and sustained? Are supplier behaviors and team habits actually changing?',
              lo:'Reactive, crisis-driven', hi:'Proactive, daily improvement' },
            { key:'scale', label:'Scale', color:'#fb923c',
              desc:'How broadly is the SC transformation spreading — across the supplier base, across procurement, receiving, and inventory?',
              lo:'One supplier or one process', hi:'Entire SC function + supplier base' },
            { key:'substance', label:'Substance', color:'#a78bfa',
              desc:'How deep is the change? Are people applying CI principles to SC decisions, or just using new tools (e.g., a new ERP)?',
              lo:'New tools, old thinking', hi:'Principle-driven SC decisions' }
        ];

        var sliders = dims.map(function(d){
            var val = sss[d.key] || 5;
            var pct = (val / 10) * 100;
            return '<div class="sm-sss-card" style="border-top:3px solid ' + d.color + '">'
                + '<div class="sm-sss-card-top">'
                + '<span class="sm-sss-card-label" style="color:' + d.color + '">' + d.label + '</span>'
                + '<span class="sm-sss-card-val" id="sm-sss-val-' + d.key + '" style="color:' + d.color + '">' + val + '<small>/10</small></span>'
                + '</div>'
                + '<p class="sm-sss-card-desc">' + d.desc + '</p>'
                + '<input type="range" class="sm-sss-slider" min="1" max="10" value="' + val + '" oninput="window._sm.updateSSS(\'' + d.key + '\',this.value)" style="--sss-color:' + d.color + ';accent-color:' + d.color + '">'
                + '<div class="sm-sss-range-lbl"><span>' + d.lo + '</span><span>' + d.hi + '</span></div>'
                + '<div class="sm-sss-bar-wrap"><div class="sm-sss-bar" id="sm-sss-bar-' + d.key + '" style="width:' + pct + '%;background:' + d.color + '"></div></div>'
                + '</div>';
        }).join('');

        var hasHistory = (sss.history || []).length >= 2;

        return '<div class="sm-sss-page">'
            + '<div class="sm-sss-layout">'
            + '<div class="sm-ti-panel">'
            + '<div class="sm-ti-num" id="sm-ti-val" style="color:' + tiColor + '">' + ti + '</div>'
            + '<div class="sm-ti-label-main">Transformation Index</div>'
            + '<div class="sm-ti-status" id="sm-ti-status" style="color:' + tiColor + '">' + tiLabel + '</div>'
            + '<div class="sm-ti-formula">TI = Speed × Scale × Substance ÷ 100</div>'
            + '<div class="sm-ti-breakdown" id="sm-ti-breakdown">'
            + '<span style="color:#38bdf8">Speed: ' + sss.speed + '</span>'
            + '<span class="sm-ti-x">×</span>'
            + '<span style="color:#fb923c">Scale: ' + sss.scale + '</span>'
            + '<span class="sm-ti-x">×</span>'
            + '<span style="color:#a78bfa">Substance: ' + sss.substance + '</span>'
            + '</div>'
            + '</div>'
            + '<div class="sm-sss-sliders">' + sliders + '</div>'
            + '</div>'
            + '<div class="sm-sss-bottom">'
            + '<div class="sm-sss-notes-wrap">'
            + '<label class="form-label">SC Transformation notes</label>'
            + '<textarea class="form-control" id="sm-sss-notes" rows="3" placeholder="What\'s driving the scores? Where are you seeing real behavior change in the SC team or supplier base?">' + escapeHtml(sss.notes || '') + '</textarea>'
            + '<button class="btn btn-primary" style="margin-top:10px" onclick="window._sm.saveSSS()">Save Snapshot</button>'
            + '</div>'
            + (hasHistory ? '<div class="sm-ti-history-wrap"><h3 class="sm-section-title">TI Over Time</h3><div style="height:160px"><canvas id="sm-ti-chart"></canvas></div></div>' : '')
            + '</div>'
            + '</div>';
    }

    function initTIChart() {
        if (typeof Chart === 'undefined') return;
        var canvas = document.getElementById('sm-ti-chart');
        if (!canvas) return;
        if (_tiChart) { try { _tiChart.destroy(); } catch(e){} }
        var history = (app.data.shingo.sss.history || []).slice(-12);
        if (history.length < 2) return;
        _tiChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: history.map(function(h){ return h.date; }),
                datasets: [{ data: history.map(function(h){ return Math.round((h.speed*h.scale*h.substance)/100); }),
                    borderColor:'#4a8fc7', backgroundColor:'rgba(74,143,199,0.07)',
                    fill:true, tension:0.4, pointBackgroundColor:'#4a8fc7', pointRadius:4 }]
            },
            options: {
                responsive:true, maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{
                    y:{min:0,max:10,ticks:{color:'rgba(255,255,255,0.3)',stepSize:2},grid:{color:'rgba(255,255,255,0.05)'}},
                    x:{ticks:{color:'rgba(255,255,255,0.3)',font:{size:10}},grid:{color:'rgba(255,255,255,0.05)'}}
                }
            }
        });
    }

    function updateSSS(key, val) {
        ensureData();
        val = parseInt(val);
        app.data.shingo.sss[key] = val;
        var valEl = document.getElementById('sm-sss-val-' + key);
        if (valEl) valEl.innerHTML = val + '<small>/10</small>';
        var barEl = document.getElementById('sm-sss-bar-' + key);
        if (barEl) barEl.style.width = ((val/10)*100) + '%';
        var sss = app.data.shingo.sss;
        var ti = Math.round((sss.speed * sss.scale * sss.substance) / 100);
        var tiColor = ti >= 7 ? '#4a8fc7' : ti >= 4 ? '#ffb800' : '#ff4757';
        var tiLabel = ti >= 7 ? 'Strong SC Transformation' : ti >= 4 ? 'Developing Transformation' : 'Early / Tool-Focused';
        var tiEl = document.getElementById('sm-ti-val');
        if (tiEl) { tiEl.textContent = ti; tiEl.style.color = tiColor; }
        var stEl = document.getElementById('sm-ti-status');
        if (stEl) { stEl.textContent = tiLabel; stEl.style.color = tiColor; }
        var bkEl = document.getElementById('sm-ti-breakdown');
        if (bkEl) bkEl.innerHTML = '<span style="color:#38bdf8">Speed: '+sss.speed+'</span><span class="sm-ti-x">×</span><span style="color:#fb923c">Scale: '+sss.scale+'</span><span class="sm-ti-x">×</span><span style="color:#a78bfa">Substance: '+sss.substance+'</span>';
        saveData();
    }

    function saveSSS() {
        ensureData();
        var notes = document.getElementById('sm-sss-notes');
        if (notes) app.data.shingo.sss.notes = notes.value.trim();
        var sss = app.data.shingo.sss;
        sss.history.push({ date:new Date().toISOString().slice(0,10), speed:sss.speed, scale:sss.scale, substance:sss.substance, notes:sss.notes });
        saveData(); showToast('Snapshot saved','success');
        _tab = 'sss'; renderShingoPage();
    }

    // ── Behavioral Log ───────────────────────────────────────────────────────
    function renderBehaviorLog() {
        ensureData();
        var logs = app.data.shingo.behaviorLogs;
        var principleOptions = PRINCIPLES.map(function(p){
            return '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>';
        }).join('');

        var feedHtml = logs.length
            ? '<div class="sm-feed">' + logs.slice().reverse().map(function(l){
                var p = PRINCIPLES.find(function(x){ return x.id === l.principleId; });
                var dim = p ? DIMENSIONS[p.dimension] : null;
                var ideal = l.type === 'ideal';
                return '<div class="sm-feed-item">'
                    + '<div class="sm-feed-dot-col"><div class="sm-feed-dot" style="background:' + (ideal?'#4a8fc7':'#ff4757') + ';box-shadow:0 0 8px ' + (ideal?'#4a8fc755':'#ff475755') + '"></div><div class="sm-feed-line"></div></div>'
                    + '<div class="sm-feed-card">'
                    + '<div class="sm-feed-meta">'
                    + '<span class="sm-feed-date">' + escapeHtml(l.date) + '</span>'
                    + (dim ? '<span class="sm-dim-tag" style="background:' + dim.color + '18;color:' + dim.color + ';border:1px solid ' + dim.color + '33;font-size:10px">' + escapeHtml(p.name) + '</span>' : '')
                    + '<span class="sm-feed-type" style="color:' + (ideal?'#4a8fc7':'#ff4757') + ';font-weight:700">' + (ideal?'Ideal':'At-Risk') + '</span>'
                    + '<button class="sm-feed-del" onclick="window._sm.deleteBehaviorLog(\'' + l.id + '\')" title="Delete">×</button>'
                    + '</div>'
                    + '<p class="sm-feed-desc">' + escapeHtml(l.description) + '</p>'
                    + (l.observer||l.area ? '<div class="sm-feed-who">'+(l.observer?'<span>'+escapeHtml(l.observer)+'</span>':'')+(l.area?'<span>'+escapeHtml(l.area)+'</span>':'')+'</div>' : '')
                    + '</div></div>';
            }).join('') + '</div>'
            : '<div class="sm-empty">No behaviors logged yet.</div>';

        return '<div class="sm-behavior-page">'
            + '<div class="sm-blog-form card">'
            + '<h3 style="font-size:14px;font-weight:700;margin-bottom:16px">Log a Behavior Observation</h3>'
            + '<div class="sm-blog-row">'
            + '<div class="form-group" style="flex:2"><label class="form-label">Principle</label><select class="form-control" id="bl-principle">' + principleOptions + '</select></div>'
            + '<div class="form-group" style="flex:1"><label class="form-label">Type</label><select class="form-control" id="bl-type"><option value="ideal">Ideal Behavior</option><option value="at-risk">At-Risk Behavior</option></select></div>'
            + '</div>'
            + '<div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="bl-desc" rows="2" placeholder="Describe the specific behavior observed..."></textarea></div>'
            + '<div class="sm-blog-row">'
            + '<div class="form-group" style="flex:1"><label class="form-label">Observer</label><input class="form-control" id="bl-observer" placeholder="Name"></div>'
            + '<div class="form-group" style="flex:1"><label class="form-label">Area / Supplier</label><input class="form-control" id="bl-area" placeholder="e.g. Supplier X, Receiving Dock"></div>'
            + '</div>'
            + '<button class="btn btn-primary" onclick="window._sm.saveBehaviorLog()">+ Log Behavior</button>'
            + '</div>' + feedHtml + '</div>';
    }

    function saveBehaviorLog() {
        ensureData();
        var desc = document.getElementById('bl-desc').value.trim();
        if (!desc) { showToast('Please describe the behavior','error'); return; }
        app.data.shingo.behaviorLogs.push({
            id:generateId(), date:new Date().toISOString().slice(0,10),
            principleId:document.getElementById('bl-principle').value,
            type:document.getElementById('bl-type').value,
            description:desc,
            observer:document.getElementById('bl-observer').value.trim(),
            area:document.getElementById('bl-area').value.trim()
        });
        saveData(); showToast('Behavior logged','success');
        _tab = 'behaviors'; renderShingoPage();
    }

    function deleteBehaviorLog(id) {
        ensureData();
        app.data.shingo.behaviorLogs = app.data.shingo.behaviorLogs.filter(function(l){ return l.id !== id; });
        saveData(); _tab = 'behaviors'; renderShingoPage();
    }

    // ── Gemba Walk ───────────────────────────────────────────────────────────
    var GEMBA_PROMPTS = [
        { principle:'humility',   prompt:'Did you observe leadership engaging with workers at the actual work location?' },
        { principle:'respect',    prompt:'How are suppliers/workers treated when raising problems or concerns?' },
        { principle:'process',    prompt:'Is standard work visible and being followed at this location?' },
        { principle:'quality',    prompt:'Are defects being caught at the source, or passed downstream?' },
        { principle:'flow',       prompt:'Is there visible WIP, waiting, or batching that interrupts flow?' },
        { principle:'scientific', prompt:'Are problems addressed with root cause analysis or by firefighting?' },
        { principle:'systemic',   prompt:'Do people understand how their work connects to the next step in the supply chain?' },
        { principle:'value',      prompt:'Would the end customer (production line) recognize value in what you observed today?' }
    ];

    function renderGembaWalk() {
        ensureData();
        var walks = app.data.shingo.gembaWalks || [];

        var promptsHtml = GEMBA_PROMPTS.map(function(gp, i){
            var p = PRINCIPLES.find(function(x){ return x.id === gp.principle; });
            var dim = p ? DIMENSIONS[p.dimension] : null;
            return '<div class="sm-gemba-prompt">'
                + '<div class="sm-gemba-prompt-header">'
                + (dim ? '<span class="sm-dim-tag" style="background:' + dim.color + '18;color:' + dim.color + ';border:1px solid ' + dim.color + '33;font-size:10px">' + p.name + '</span>' : '')
                + '</div>'
                + '<p class="sm-gemba-prompt-text">' + escapeHtml(gp.prompt) + '</p>'
                + '<div class="sm-gemba-obs-row">'
                + '<select class="form-control sm-gemba-type" id="gemba-type-' + i + '" style="flex:0 0 130px">'
                + '<option value="">Observation</option>'
                + '<option value="ideal">Ideal Behavior</option>'
                + '<option value="at-risk">At-Risk Behavior</option>'
                + '<option value="na">N/A / Not observed</option>'
                + '</select>'
                + '<input class="form-control" id="gemba-note-' + i + '" placeholder="What did you see?" style="flex:1">'
                + '</div>'
                + '</div>';
        }).join('');

        var historyHtml = walks.length
            ? '<div class="sm-gemba-history">'
                + '<h3 class="sm-section-title" style="margin-top:24px">Past Gemba Walks</h3>'
                + walks.slice().reverse().slice(0,5).map(function(w){
                    var count = w.observations.filter(function(o){ return o.type && o.type !== 'na'; }).length;
                    var ideal = w.observations.filter(function(o){ return o.type === 'ideal'; }).length;
                    var risk  = w.observations.filter(function(o){ return o.type === 'at-risk'; }).length;
                    return '<div class="sm-gemba-walk-card">'
                        + '<div class="sm-gemba-walk-head">'
                        + '<strong>' + escapeHtml(w.location || 'Unnamed location') + '</strong>'
                        + '<span class="sm-gemba-walk-date">' + w.date + '</span>'
                        + '<span style="color:#4a8fc7">' + ideal + ' ideal</span>'
                        + '<span style="color:#ff4757">' + risk + ' at-risk</span>'
                        + '<button class="sm-feed-del" onclick="window._sm.deleteGembaWalk(\'' + w.id + '\')" title="Delete">×</button>'
                        + '</div>'
                        + (w.notes ? '<p style="font-size:12px;color:var(--muted);margin:6px 0 0">' + escapeHtml(w.notes) + '</p>' : '')
                        + '</div>';
                }).join('')
                + '</div>'
            : '';

        return '<div class="sm-gemba-page">'
            + '<div class="sm-gemba-intro">'
            + '<div class="sm-gemba-intro-text">'
            + '<h2 class="sm-section-title">Structured Gemba Walk</h2>'
            + '<p style="font-size:13px;color:var(--muted);line-height:1.6;margin:0">A gemba walk is not an inspection — it is an act of humility. Go to where the work happens (supplier floor, receiving dock, production line), observe with curiosity, and record what you see without judgment. These observations feed directly into your behavioral log and principle assessments.</p>'
            + '</div>'
            + '</div>'
            + '<div class="sm-gemba-form card">'
            + '<div class="sm-blog-row" style="margin-bottom:14px">'
            + '<div class="form-group" style="flex:2"><label class="form-label">Location / Supplier</label><input class="form-control" id="gemba-location" placeholder="e.g. Supplier X facility, Receiving Dock B"></div>'
            + '<div class="form-group" style="flex:1"><label class="form-label">Observer</label><input class="form-control" id="gemba-observer" placeholder="Your name"></div>'
            + '</div>'
            + '<div class="sm-gemba-prompts">' + promptsHtml + '</div>'
            + '<div class="form-group" style="margin-top:14px"><label class="form-label">Overall notes from this walk</label><textarea class="form-control" id="gemba-notes" rows="2" placeholder="Key themes, follow-up actions, things that stood out..."></textarea></div>'
            + '<button class="btn btn-primary" style="margin-top:4px" onclick="window._sm.saveGembaWalk()">Save Gemba Walk</button>'
            + '</div>'
            + historyHtml
            + '</div>';
    }

    function saveGembaWalk() {
        ensureData();
        if (!app.data.shingo.gembaWalks) app.data.shingo.gembaWalks = [];
        var location = document.getElementById('gemba-location').value.trim();
        var observer = document.getElementById('gemba-observer').value.trim();
        var notes    = document.getElementById('gemba-notes').value.trim();
        var observations = GEMBA_PROMPTS.map(function(gp, i){
            return {
                principle: gp.principle,
                prompt: gp.prompt,
                type: document.getElementById('gemba-type-' + i).value,
                note: document.getElementById('gemba-note-' + i).value.trim()
            };
        });
        // Auto-create behavior log entries for each observation with a type
        var today = new Date().toISOString().slice(0,10);
        observations.forEach(function(o){
            if ((o.type === 'ideal' || o.type === 'at-risk') && o.note) {
                app.data.shingo.behaviorLogs.push({
                    id: generateId(), date: today,
                    principleId: o.principle, type: o.type,
                    description: o.note,
                    observer: observer,
                    area: location
                });
            }
        });
        app.data.shingo.gembaWalks.push({
            id: generateId(), date: today,
            location: location, observer: observer,
            notes: notes, observations: observations
        });
        saveData();
        showToast('Gemba walk saved — observations added to Behavioral Log', 'success');
        _tab = 'gemba'; renderShingoPage();
    }

    function deleteGembaWalk(id) {
        ensureData();
        app.data.shingo.gembaWalks = app.data.shingo.gembaWalks.filter(function(w){ return w.id !== id; });
        saveData(); _tab = 'gemba'; renderShingoPage();
    }

    // ── Issues Tab ───────────────────────────────────────────────────────────
    function renderIssuesTab() {
        var allIssues = (app.data.issues || []).slice().sort(function(a,b){
            var sev = {Critical:0,High:1,Med:2,Low:3};
            return (sev[a.severity]||3) - (sev[b.severity]||3);
        });

        if (!allIssues.length) {
            return '<div class="sm-empty" style="margin-top:20px">No issues logged yet. Create issues in the Issues module and link them to Shingo principles to see them here.</div>';
        }

        // Summary bar
        var open   = allIssues.filter(function(i){ return i.status !== 'Closed'; }).length;
        var linked = allIssues.filter(function(i){ return i.shingoP; }).length;
        var crit   = allIssues.filter(function(i){ return i.severity === 'Critical' && i.status !== 'Closed'; }).length;
        var summaryHtml = '<div class="sm-issues-summary">'
            + issueStat(allIssues.length, 'Total',       'var(--muted)')
            + issueStat(open,             'Open',         '#fb923c')
            + issueStat(crit,             'Critical Open','#ff4757')
            + issueStat(linked,           'Linked to SM', 'var(--accent)')
            + issueStat(allIssues.length - linked, 'Unlinked', 'var(--muted)')
            + '</div>';

        // Group by principle (only principles that have issues)
        var grouped = {}; // principleId → issues[]
        var unlinked = [];
        allIssues.forEach(function(i){
            if (i.shingoP) {
                if (!grouped[i.shingoP]) grouped[i.shingoP] = [];
                grouped[i.shingoP].push(i);
            } else {
                unlinked.push(i);
            }
        });

        var sectionsHtml = '';

        // Sections per principle in order
        PRINCIPLES.forEach(function(p){
            var issues = grouped[p.id];
            if (!issues || !issues.length) return;
            var dim = DIMENSIONS[p.dimension];
            var openCount = issues.filter(function(i){ return i.status !== 'Closed'; }).length;
            sectionsHtml += '<div class="sm-issues-group">'
                + '<div class="sm-issues-group-head">'
                + '<span class="sm-dim-tag" style="background:' + dim.color + '18;color:' + dim.color + ';border:1px solid ' + dim.color + '33">' + dim.label + '</span>'
                + '<strong>' + escapeHtml(p.name) + '</strong>'
                + '<span class="sm-issues-group-count">' + issues.length + ' issue' + (issues.length!==1?'s':'')
                + (openCount ? ' · <span style="color:#fb923c">' + openCount + ' open</span>' : '') + '</span>'
                + '</div>'
                + '<div class="sm-issues-list">' + issues.map(function(i){ return issueRow(i, true); }).join('') + '</div>'
                + '</div>';
        });

        // Unlinked section
        if (unlinked.length) {
            sectionsHtml += '<div class="sm-issues-group sm-issues-unlinked">'
                + '<div class="sm-issues-group-head">'
                + '<strong style="color:var(--muted)">Unlinked Issues</strong>'
                + '<span class="sm-issues-group-count" style="color:var(--muted)">' + unlinked.length + ' issue' + (unlinked.length!==1?'s':'') + ' — link these to a Shingo principle for better tracking</span>'
                + '</div>'
                + '<div class="sm-issues-list">' + unlinked.map(function(i){ return issueRow(i, false); }).join('') + '</div>'
                + '</div>';
        }

        return '<div class="sm-issues-page">'
            + summaryHtml
            + '<div class="sm-issues-hint">Issues are linked to principles via the Shingo Principle field on each issue. Open an issue → Edit → set the Shingo Principle field.</div>'
            + sectionsHtml
            + '</div>';
    }

    function issueStat(val, label, color) {
        return '<div class="sm-issues-stat"><div class="sm-issues-stat-val" style="color:' + color + '">' + val + '</div><div class="sm-issues-stat-lbl">' + label + '</div></div>';
    }

    function issueRow(issue, linked) {
        var sevColor = {Critical:'#ff4757',High:'#fb923c',Med:'#ffb800',Low:'var(--muted)'}[issue.severity] || 'var(--muted)';
        var statusClass = 'sm-issue-status-' + (issue.status||'new').toLowerCase().replace(/\s+/g,'-');
        return '<div class="sm-issue-row" onclick="navigateToPage(\'issues\');setTimeout(function(){app.viewIssueDetail(\'' + issue.id + '\')},150)">'
            + '<div class="sm-issue-sev-dot" style="background:' + sevColor + ';box-shadow:0 0 6px ' + sevColor + '55" title="' + escapeHtml(issue.severity) + '"></div>'
            + '<div class="sm-issue-main">'
            + '<span class="sm-issue-title">' + escapeHtml(issue.title) + '</span>'
            + '<div class="sm-issue-meta">'
            + (issue.section ? '<span class="sm-issue-tag">' + escapeHtml(issue.section) + '</span>' : '')
            + (issue.type    ? '<span class="sm-issue-tag">' + escapeHtml(issue.type)    + '</span>' : '')
            + (issue.owner   ? '<span class="sm-issue-tag" style="color:var(--muted)">' + escapeHtml(issue.owner) + '</span>' : '')
            + (issue.supplier ? '<span class="sm-issue-tag" style="color:#38bdf8">' + escapeHtml(issue.supplier) + '</span>' : '')
            + '</div>'
            + '</div>'
            + '<div class="sm-issue-right">'
            + '<span class="sm-issue-status ' + statusClass + '">' + escapeHtml(issue.status||'New') + '</span>'
            + '<span class="sm-issue-sev" style="color:' + sevColor + '">' + escapeHtml(issue.severity) + '</span>'
            + '</div>'
            + '</div>';
    }

    // ── Modals ───────────────────────────────────────────────────────────────
    function showAssessModal(principleId) {
        var p = PRINCIPLES.find(function(x){ return x.id === principleId; });
        if (!p) return;
        var dim = DIMENSIONS[p.dimension];
        var html = '<div class="modal-overlay" id="smAssessModal">'
            + '<div class="modal" style="max-width:540px">'
            + '<div class="modal-header" style="border-top:3px solid ' + dim.color + '">'
            + '<div><div class="sm-dim-tag" style="background:' + dim.color + '18;color:' + dim.color + ';border:1px solid ' + dim.color + '33;margin-bottom:4px">' + dim.label + '</div>'
            + '<h3>' + escapeHtml(p.name) + '</h3></div>'
            + '<button class="modal-close" onclick="document.getElementById(\'smAssessModal\').remove()">×</button></div>'
            + '<div class="modal-body">'
            + '<p style="color:var(--muted);font-size:13px;margin-bottom:6px">' + escapeHtml(p.summary) + '</p>'
            + '<div style="background:var(--surface-3);border-radius:var(--radius);padding:10px 12px;margin-bottom:16px;font-size:12px;color:var(--text-2);line-height:1.5;border-left:2px solid ' + dim.color + '">'
            + '<strong style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:' + dim.color + '">SC Application</strong><br>' + escapeHtml(p.scApplication)
            + '</div>'
            + '<div class="form-group"><label class="form-label">Score (1 = Reactive → 5 = Excellent)</label>'
            + '<div class="sm-assess-stars" id="sm-assess-stars">'
            + [1,2,3,4,5].map(function(n){
                return '<button class="sm-star" data-val="' + n + '" onclick="window._sm._setStar(' + n + ')">'
                    + '<span class="sm-star-num">' + n + '</span>'
                    + '<span class="sm-star-lbl">' + ['','Reactive','Aware','Systematic','Proactive','Excellent'][n] + '</span>'
                    + '</button>';
            }).join('') + '</div></div>'
            + '<div class="form-group"><label class="form-label">Ideal Behaviors Observed</label><textarea class="form-control" id="sm-assess-ideal" rows="2" placeholder="What positive SC behaviors did you observe?"></textarea></div>'
            + '<div class="form-group"><label class="form-label">At-Risk Behaviors Observed</label><textarea class="form-control" id="sm-assess-atrisk" rows="2" placeholder="What concerning behaviors did you observe?"></textarea></div>'
            + '<div class="form-group"><label class="form-label">Notes / Evidence</label><textarea class="form-control" id="sm-assess-notes" rows="2" placeholder="Data, specific examples, follow-up actions..."></textarea></div>'
            + '</div>'
            + '<div class="modal-footer">'
            + '<button class="btn btn-secondary" onclick="document.getElementById(\'smAssessModal\').remove()">Cancel</button>'
            + '<button class="btn btn-primary" onclick="window._sm.saveAssessment(\'' + principleId + '\')">Save Assessment</button>'
            + '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
        _selectedStar = 0;
    }

    function _setStar(n) {
        _selectedStar = n;
        document.querySelectorAll('.sm-star').forEach(function(btn){
            btn.classList.toggle('selected', parseInt(btn.dataset.val) <= n);
        });
    }

    function saveAssessment(principleId) {
        if (!_selectedStar) { showToast('Please select a score','error'); return; }
        ensureData();
        app.data.shingo.assessments.push({
            id:generateId(), principleId:principleId, score:_selectedStar,
            date:new Date().toISOString().slice(0,10),
            idealObserved:document.getElementById('sm-assess-ideal').value.trim(),
            atRiskObserved:document.getElementById('sm-assess-atrisk').value.trim(),
            notes:document.getElementById('sm-assess-notes').value.trim()
        });
        saveData();
        document.getElementById('smAssessModal').remove();
        showToast('Assessment saved','success');
        renderShingoPage();
    }

    // ── CI Monthly Focus ─────────────────────────────────────────────────────
    var FOCUS_PLAN = [
        {year:2026,month:4,  principle:'Respect Every Individual',      theme:'Building the Foundation of Trust',
         weeks:['The SC Leader\'s Role in Respect — Your Tone Sets the Team\'s Tone',
                'Suppliers Are Telling You Something — Are You Listening?',
                'Respect in the Details: Communication, Commitments, Follow-Through',
                'Month-End Check-In: What Did You Practice?']},
        {year:2026,month:5,  principle:'Lead with Humility',            theme:'Learning Before Leading',
         weeks:['The Most Dangerous Words in SC: "We\'ve Always Done It This Way"',
                'Go to the Gemba — Real Problems Don\'t Live in Spreadsheets',
                'Asking Better Questions: From Directives to Discovery',
                'Month-End Reflection: Where Did Humility Show Up in Your Work?']},
        {year:2026,month:6,  principle:'Seek Perfection',               theme:'The Pursuit Is the Point',
         weeks:['Perfection Isn\'t the Goal — the Pursuit Is',
                'What Does "Good Enough" Cost You?',
                'Making Problems Visible: Defect-Free Starts with Transparency',
                'Month-End: What Did You Improve This Month?']},
        {year:2026,month:7,  principle:'Embrace Scientific Thinking',   theme:'Evidence Over Instinct',
         weeks:['PDCA Isn\'t Just a Framework — It\'s a Mindset',
                'Root Cause vs. Blame: How Do You Really Investigate Problems?',
                'Your Data Is Only as Good as Your Questions',
                'Month-End: What Experiment Did You Run?']},
        {year:2026,month:8,  principle:'Focus on Process',              theme:'The System Produces the Result',
         weeks:['The Process Is Never Wrong — Your Understanding of It Is',
                'Standard Work: The Baseline for Improvement',
                'When Outcomes Disappoint, Look at the Process, Not the Person',
                'Month-End: Which Processes Did You Document or Improve?']},
        {year:2026,month:9,  principle:'Assure Quality at the Source',  theme:'Build It In, Don\'t Inspect It In',
         weeks:['Don\'t Inspect Quality In — Build It In',
                'First Article Isn\'t Optional — It\'s a Contract',
                'Supplier Quality Is Your Quality',
                'Month-End: What Quality Gates Did You Strengthen?']},
        {year:2026,month:10, principle:'Flow & Pull Value',             theme:'Let Demand Drive Supply',
         weeks:['Batch-and-Queue Is the Enemy of Flow',
                'Pull Systems: Letting Demand Drive Supply',
                'Inventory Is a Symptom, Not a Solution',
                'Month-End: Where Did You Reduce Wait Time or Batch Size?']},
        {year:2026,month:11, principle:'Think Systemically',            theme:'Every Decision Has Ripple Effects',
         weeks:['Every SC Decision Has Ripple Effects — Think Upstream and Down',
                'The Supplier Is Part of Your System',
                'Optimization of Parts Can Sub-Optimize the Whole',
                'Month-End: What System-Level Thinking Did You Apply?']},
        {year:2026,month:12, principle:'Create Constancy of Purpose',   theme:'Holding the Long View',
         weeks:['Why Does Your SC Team Come to Work?',
                'Alignment Between Daily Work and Long-Term Goals',
                'Leading Through Disruption with Consistent Values',
                'Year-End Reflection: What Did We Build This Year?']},
        {year:2027,month:1,  principle:'Create Value for the Customer', theme:'The Customer Experience Starts in SC',
         weeks:['Who Is Your Customer? (Hint: It\'s More Than One Person)',
                'Value-Add vs. Non-Value-Add in Your SC Processes',
                'The Customer Experience Starts in the Supply Chain',
                'Month-End: How Did You Create More Customer Value?']},
        {year:2027,month:2,  principle:'Respect Every Individual',      theme:'Applied — Respect in Action',
         weeks:['Respect in Supplier Negotiations: Beyond Price Pressure',
                'Psychological Safety in SC Reviews — Can People Speak Up?',
                'Recognizing Invisible Contributions Across the Supply Chain',
                'Month-End: Who Did You Make Feel Respected This Month?']},
        {year:2027,month:3,  principle:'Lead with Humility',            theme:'Applied — Humility at Scale',
         weeks:['Learning from Supplier Feedback — Not Just Giving It',
                'When the Leader Admits the Mistake First',
                'Celebrating Others\' Successes as Your Own',
                'Q1 Retrospective: What Has Changed in the Last 12 Months?']},
        {year:2027,month:4,  principle:'Seek Perfection',               theme:'Advanced — Kaizen & Measurement',
         weeks:['Kaizen Events: Focused Bursts of Improvement',
                'Using SPC to See What Your Processes Are Telling You',
                'Incremental vs. Breakthrough Improvement — When to Use Which?',
                'Month-End: What Does Your Improvement Backlog Look Like?']},
        {year:2027,month:5,  principle:'Embrace Scientific Thinking',   theme:'Advanced — A3 & Hypothesis Testing',
         weeks:['A3 Problem Solving in Your SC Context',
                'Hypothesis Testing: Before You Change the Process, Test the Theory',
                'Building a Culture of Data-Driven Decisions',
                'Month-End: What Problem Did You Solve Scientifically?']},
        {year:2027,month:6,  principle:'Focus on Process',              theme:'Advanced — Value Stream Mapping',
         weeks:['Process Mapping: Do You Know What Actually Happens?',
                'Variation in SC Processes: Where Does It Come From?',
                'Value Stream Mapping Your End-to-End Supply Chain',
                'Month-End: What Hidden Process Did You Surface?']},
        {year:2027,month:7,  principle:'Assure Quality at the Source',  theme:'Advanced — Error-Proofing',
         weeks:['Error-Proofing (Poka-Yoke) in Supplier Processes',
                'Escalation Paths That Preserve Quality Without Blame',
                'Building Incoming Inspection Out of the Process',
                'Month-End: What Quality Problem Did You Prevent at the Source?']},
        {year:2027,month:8,  principle:'Flow & Pull Value',             theme:'Advanced — Takt Time & Leveling',
         weeks:['Takt Time and Supplier Rhythm — Are They Aligned?',
                'Leveling Demand Signals to Your Supply Chain',
                'The Hidden Costs of Expediting',
                'Month-End: What Flow Improvement Did You Achieve?']},
        {year:2027,month:9,  principle:'Think Systemically',            theme:'Advanced — Total Cost & Risk',
         weeks:['Total Cost of Ownership — Not Just Unit Price',
                'Risk as a System Property: Seeing Fragility Before It Breaks',
                'Supplier Development as a System Investment',
                'Month-End: What Did You See in the System That Others Missed?']},
        {year:2027,month:10, principle:'Create Constancy of Purpose',   theme:'Advanced — Culture & Sustainability',
         weeks:['Communicating SC Strategy to the People Who Execute It',
                'When Short-Term Pressure Conflicts with Long-Term Purpose',
                'Building a CI Culture That Outlasts Any One Leader',
                'Month-End: How Did You Reinforce Purpose This Month?']},
        {year:2027,month:11, principle:'Create Value for the Customer', theme:'Advanced — SC as Competitive Advantage',
         weeks:['Voice of the Customer in SC Decision-Making',
                'SC Responsiveness as a Competitive Advantage',
                'Co-Creating Value with Key Suppliers',
                'Month-End: What Customer Value Did You Enable?']},
        {year:2027,month:12, principle:'Respect Every Individual',      theme:'Mastery — The Respectful Ecosystem',
         weeks:['Building a Respectful Supplier Ecosystem',
                'Equity and Fairness in SC Sourcing Decisions',
                'The Long Game: Relationships That Outlast Transactions',
                'Year-End Reflection: How Have You Grown as a Leader?']},
        {year:2028,month:1,  principle:'Lead with Humility',            theme:'Mastery — The Humble Teacher',
         weeks:['Teaching What You\'ve Learned — Humility as a Teacher',
                'Inviting Challenge: Creating Space for Better Ideas',
                'The Legacy You\'re Building in SC',
                'Month-End: What Did You Learn from Unexpected Sources?']},
        {year:2028,month:2,  principle:'Synthesizing the Shingo Model', theme:'Integration — All 10 Principles at Work',
         weeks:['How the 10 Principles Work Together in SC',
                'Self-Assessment: Where Have You Grown Most?',
                'Coaching Others in the Principles',
                'What Does a Shingo-Aligned SC Look Like for Saronic?']},
        {year:2028,month:3,  principle:'The Road Ahead',                theme:'Vision — Your Next Chapter in CI',
         weeks:['Building the Next 2-Year CI Plan',
                'Sharing Your SC CI Story Across the Organization',
                'Engaging Leadership in the Ongoing CI Journey',
                'Two-Year Celebration: What We Built and Where We\'re Going']}
    ];

    function _getCIState(year, month) {
        var months = app.data.shingo.ciFocus.months;
        var st = months.find(function(m){ return m.year === year && m.month === month; });
        if (!st) {
            st = { year:year, month:month, monthlyEmailSent:false, monthlyEmailDate:null,
                   weeksSent:[false,false,false,false], weekDates:[null,null,null,null], weekNotes:['','','',''] };
            months.push(st);
        }
        return st;
    }

    function markMonthlyEmailSent(year, month) {
        ensureData();
        var st = _getCIState(year, month);
        st.monthlyEmailSent = !st.monthlyEmailSent;
        st.monthlyEmailDate = st.monthlyEmailSent ? new Date().toISOString().slice(0,10) : null;
        saveData();
        renderShingoPage();
    }

    function markWeeklySent(year, month, wi) {
        ensureData();
        var st = _getCIState(year, month);
        st.weeksSent[wi] = !st.weeksSent[wi];
        st.weekDates[wi] = st.weeksSent[wi] ? new Date().toISOString().slice(0,10) : null;
        saveData();
        renderShingoPage();
    }

    function saveCIWeekNote(year, month, wi) {
        ensureData();
        var inp = document.getElementById('ci-note-' + year + '-' + month + '-' + wi);
        if (!inp) return;
        var st = _getCIState(year, month);
        st.weekNotes[wi] = inp.value;
        saveData();
        showToast('Note saved', 'success');
    }

    function toggleCIMonth(year, month) {
        var key = year * 100 + month;
        _ciExpandedMonth = (_ciExpandedMonth === key) ? null : key;
        renderShingoPage();
    }

    function _ciMonthName(m) {
        return ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m];
    }

    function renderCIFocusTab() {
        ensureData();
        var now = new Date();
        var nowY = now.getFullYear(), nowM = now.getMonth() + 1;
        var currentPlan = FOCUS_PLAN.find(function(p){ return p.year === nowY && p.month === nowM; }) || FOCUS_PLAN[0];
        var currentState = _getCIState(currentPlan.year, currentPlan.month);

        var sentCount = FOCUS_PLAN.filter(function(p){
            var st = app.data.shingo.ciFocus.months.find(function(m){ return m.year===p.year && m.month===p.month; });
            return st && st.monthlyEmailSent;
        }).length;
        var pct = Math.round(sentCount / 24 * 100);

        var html = '<div class="ci-focus-page">';

        // Header
        html += '<div class="ci-focus-header">'
            + '<div class="ci-focus-header-left">'
            + '<div class="ci-focus-title">CI Monthly Focus Program</div>'
            + '<div class="ci-focus-subtitle">24-Month Continuous Improvement Journey &nbsp;·&nbsp; Apr 2026 – Mar 2028</div>'
            + '</div>'
            + '<div class="ci-focus-prog-wrap">'
            + '<div class="ci-focus-prog-label">' + sentCount + ' of 24 months launched</div>'
            + '<div class="ci-focus-prog-bar"><div class="ci-focus-prog-fill" style="width:' + pct + '%"></div></div>'
            + '</div>'
            + '</div>';

        // Current month spotlight
        var mSent = currentState.monthlyEmailSent;
        html += '<div class="ci-focus-spotlight">'
            + '<div class="ci-focus-spot-eyebrow">CURRENT MONTH &nbsp;·&nbsp; ' + _ciMonthName(currentPlan.month) + ' ' + currentPlan.year + '</div>'
            + '<div class="ci-focus-spot-principle">' + escapeHtml(currentPlan.principle) + '</div>'
            + '<div class="ci-focus-spot-theme">' + escapeHtml(currentPlan.theme) + '</div>'
            + '<div class="ci-focus-email-row' + (mSent ? ' sent' : '') + '">'
            + '<span class="ci-check-btn" onclick="window._sm.markMonthlyEmailSent(' + currentPlan.year + ',' + currentPlan.month + ')" title="Toggle sent status">'
            + (mSent ? '&#10003;' : '&#9675;') + '</span>'
            + '<span>' + (mSent ? 'Monthly intro email sent &nbsp;·&nbsp; ' + currentState.monthlyEmailDate : 'Mark monthly intro email as sent') + '</span>'
            + '</div>';

        // Weekly tracker
        html += '<div class="ci-focus-weeks">';
        currentPlan.weeks.forEach(function(topic, wi) {
            var wSent = currentState.weeksSent[wi];
            var wNote = currentState.weekNotes[wi] || '';
            html += '<div class="ci-focus-week' + (wSent ? ' sent' : '') + '">'
                + '<div class="ci-focus-week-hd">'
                + '<span class="ci-check-btn" onclick="window._sm.markWeeklySent(' + currentPlan.year + ',' + currentPlan.month + ',' + wi + ')">' + (wSent ? '&#10003;' : '&#9675;') + '</span>'
                + '<span class="ci-wk-num">Week ' + (wi+1) + '</span>'
                + '<span class="ci-wk-topic">' + escapeHtml(topic) + '</span>'
                + (wSent && currentState.weekDates[wi] ? '<span class="ci-wk-date">Sent ' + currentState.weekDates[wi] + '</span>' : '')
                + '</div>'
                + '<div class="ci-focus-week-note">'
                + '<textarea id="ci-note-' + currentPlan.year + '-' + currentPlan.month + '-' + wi + '" class="form-control" rows="1" placeholder="Notes…" style="font-size:12px;min-height:32px;resize:vertical">' + escapeHtml(wNote) + '</textarea>'
                + '<button class="btn btn-xs" style="margin-top:4px" onclick="window._sm.saveCIWeekNote(' + currentPlan.year + ',' + currentPlan.month + ',' + wi + ')">Save Note</button>'
                + '</div>'
                + '</div>';
        });
        html += '</div>'; // weeks
        html += '</div>'; // spotlight

        // 24-month roadmap
        html += '<div class="ci-focus-roadmap-title">24-Month Roadmap</div>';
        html += '<div class="ci-focus-roadmap">';
        FOCUS_PLAN.forEach(function(plan) {
            var st2 = app.data.shingo.ciFocus.months.find(function(m){ return m.year===plan.year && m.month===plan.month; });
            var mSent2 = st2 && st2.monthlyEmailSent;
            var weeksSentCount = st2 ? st2.weeksSent.filter(Boolean).length : 0;
            var isCurrent = plan.year === nowY && plan.month === nowM;
            var isPast = plan.year < nowY || (plan.year === nowY && plan.month < nowM);
            var key = plan.year * 100 + plan.month;
            var isExp = _ciExpandedMonth === key;

            html += '<div class="ci-rm-card' + (isCurrent?' ci-rm-current':'') + (isPast?' ci-rm-past':'') + '">';
            html += '<div class="ci-rm-row" onclick="window._sm.toggleCIMonth(' + plan.year + ',' + plan.month + ')">'
                + '<span class="ci-rm-dt">' + _ciMonthName(plan.month) + ' ' + plan.year + '</span>'
                + '<span class="ci-rm-p">' + escapeHtml(plan.principle) + '</span>'
                + '<span class="ci-rm-status">' + (mSent2 ? (weeksSentCount + '/4 &#10003;') : '&#8212;') + '</span>'
                + '<span class="ci-rm-chevron">' + (isExp ? '&#9650;' : '&#9660;') + '</span>'
                + '</div>';

            if (isExp) {
                html += '<div class="ci-rm-detail">'
                    + '<div class="ci-rm-theme">' + escapeHtml(plan.theme) + '</div>'
                    + '<ul class="ci-rm-weeks">';
                plan.weeks.forEach(function(w, wi) {
                    var wS = st2 && st2.weeksSent[wi];
                    html += '<li' + (wS?' class="sent"':'') + '>' + (wS?'&#10003; ':'') + 'Wk' + (wi+1) + ' — ' + escapeHtml(w) + '</li>';
                });
                html += '</ul>'
                    + '<button class="btn btn-sm' + (mSent2 ? '' : ' btn-primary') + '" style="margin-top:8px" onclick="event.stopPropagation();window._sm.markMonthlyEmailSent(' + plan.year + ',' + plan.month + ')">'
                    + (mSent2 ? 'Undo Email Sent' : 'Mark Email Sent') + '</button>'
                    + '</div>';
            }
            html += '</div>';
        });
        html += '</div>'; // roadmap
        html += '</div>'; // ci-focus-page
        return html;
    }

    // ── Nav ──────────────────────────────────────────────────────────────────
    function setTab(t) { _tab = t; renderShingoPage(); }
    function setAssessFilter(f) { _assessFilter = f; renderShingoPage(); }

    // ── Public API ───────────────────────────────────────────────────────────
    window._sm = {
        setTab:setTab, setAssessFilter:setAssessFilter, toggleCard:toggleCard,
        showAssessModal:showAssessModal, saveAssessment:saveAssessment, _setStar:_setStar,
        updateSSS:updateSSS, saveSSS:saveSSS,
        saveBehaviorLog:saveBehaviorLog, deleteBehaviorLog:deleteBehaviorLog,
        saveGembaWalk:saveGembaWalk, deleteGembaWalk:deleteGembaWalk,
        markMonthlyEmailSent:markMonthlyEmailSent, markWeeklySent:markWeeklySent,
        saveCIWeekNote:saveCIWeekNote, toggleCIMonth:toggleCIMonth
    };
    window.renderShingoPage = renderShingoPage;

})();
