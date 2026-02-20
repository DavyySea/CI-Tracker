/* =========================
   app.js — PART 1/6
   ========================= */

// Storage key
const STORAGE_KEY = 'sc_ci_tracker_v1';

// App state
const app = {
    data: {
        kpis: [],
        projects: [],
        dmaicRecords: [],
        aars: [],
        processDocs: [],
        meetings: [],
        products: [],
        areaImprovements: []
    },
    currentPage: 'dashboard',
    currentProjectId: null,
    currentDMAICTab: 'define'
};

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initNavigation();
    renderCurrentPage();
});

// LocalStorage management
function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(app.data));
        return true;
    } catch (e) {
        console.error('Failed to save data:', e);
        showToast('Failed to save data', 'error');
        return false;
    }
}

function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            app.data = JSON.parse(stored);
        } else {
            // First load - seed sample data
            seedSampleData();
            saveData();
        }
    } catch (e) {
        console.error('Failed to load data:', e);
        showToast('Failed to load data', 'error');
    }
}

function seedSampleData() {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Sample KPIs
    app.data.kpis = [
        {
            id: generateId(),
            name: 'OTIF (On-Time In-Full)',
            category: 'Service',
            definition: 'Percentage of orders delivered on-time and complete',
            owner: 'Sarah Chen',
            target: 95,
            unit: '%',
            cadence: 'Weekly',
            dataPoints: [
                { date: formatDate(new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000)), value: 92, note: '' },
                { date: formatDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)), value: 93, note: '' },
                { date: formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)), value: 94, note: 'Improvement from expedite reduction' }
            ]
        },
        {
            id: generateId(),
            name: 'Schedule Adherence',
            category: 'Flow',
            definition: 'Percentage of production schedule met',
            owner: 'Mike Johnson',
            target: 90,
            unit: '%',
            cadence: 'Weekly',
            dataPoints: [
                { date: formatDate(new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000)), value: 87, note: '' },
                { date: formatDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)), value: 89, note: '' },
                { date: formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)), value: 91, note: 'New scheduling tool impact' }
            ]
        },
        {
            id: generateId(),
            name: 'Expedites Count',
            category: 'Stability',
            definition: 'Number of expedited orders per week',
            owner: 'Lisa Martinez',
            target: 10,
            unit: 'count',
            cadence: 'Weekly',
            dataPoints: [
                { date: formatDate(new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000)), value: 18, note: '' },
                { date: formatDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)), value: 15, note: '' },
                { date: formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)), value: 12, note: 'Trending in right direction' }
            ]
        },
        {
            id: generateId(),
            name: 'Premium Freight Cost',
            category: 'Cost',
            definition: 'Monthly spend on premium/expedited freight',
            owner: 'David Park',
            target: 50000,
            unit: '$',
            cadence: 'Monthly',
            dataPoints: [
                { date: formatDate(new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)), value: 78000, note: '' },
                { date: formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)), value: 65000, note: 'Expedite reduction initiative' }
            ]
        },
        {
            id: generateId(),
            name: 'Inventory Turns',
            category: 'Flow',
            definition: 'Number of times inventory is sold/replaced per year',
            owner: 'Jennifer Wu',
            target: 12,
            unit: 'turns',
            cadence: 'Monthly',
            dataPoints: [
                { date: formatDate(new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)), value: 9.2, note: '' },
                { date: formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)), value: 9.8, note: 'Safety stock optimization in progress' }
            ]
        },
        {
            id: generateId(),
            name: 'Supplier OTD',
            category: 'Quality',
            definition: 'Supplier on-time delivery performance',
            owner: 'Robert Kim',
            target: 95,
            unit: '%',
            cadence: 'Weekly',
            dataPoints: [
                { date: formatDate(new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000)), value: 91, note: '' },
                { date: formatDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)), value: 92, note: '' },
                { date: formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)), value: 93, note: 'Supplier scorecards deployed' }
            ]
        }
    ];

    // Sample Projects
    const project1Id = generateId();
    const project2Id = generateId();
    const project3Id = generateId();

    app.data.projects = [
        {
            id: project1Id,
            title: 'Reduce Expedite Frequency by 50%',
            area: 'Planning',
            problemStatement: 'Excessive expedites (18/week avg) driving premium freight costs and operational instability. Root causes include forecast accuracy, planning parameters, and supplier reliability.',
            impactedKPIs: [app.data.kpis[2].id, app.data.kpis[3].id],
            owner: 'Lisa Martinez',
            stakeholders: 'Planning, Buying, Logistics',
            startDate: formatDate(oneMonthAgo),
            dueDate: formatDate(twoWeeksFromNow),
            status: 'Analyze',
            health: 'On Track',
            priority: 'High',
            expectedImpact: 'Reduce expedites from 18/week to 9/week, save $30K/month in premium freight',
            actualImpact: '',
            lastUpdated: formatDate(oneWeekAgo),
            nextUpdateDate: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)),
            actions: [
                {
                    id: generateId(),
                    text: 'Complete Pareto analysis of expedite root causes',
                    owner: 'Lisa Martinez',
                    dueDate: formatDate(today),
                    status: 'Done',
                    blockerNote: ''
                },
                {
                    id: generateId(),
                    text: 'Review planning parameters with top 20 SKUs',
                    owner: 'Planning Team',
                    dueDate: formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)),
                    status: 'Open',
                    blockerNote: ''
                },
                {
                    id: generateId(),
                    text: 'Pilot improved forecast collaboration with Sales',
                    owner: 'Sarah Chen',
                    dueDate: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)),
                    status: 'Open',
                    blockerNote: ''
                }
            ],
            links: [],
            notes: 'Initial analysis shows 40% of expedites driven by demand changes within lead time, 35% by planning parameter issues, 25% by supplier delays.'
        },
        {
            id: project2Id,
            title: 'Improve Supplier OTD to 95%',
            area: 'Supplier Quality',
            problemStatement: 'Supplier on-time delivery at 91-93%, below 95% target. Late deliveries impact production schedule and customer OTIF.',
            impactedKPIs: [app.data.kpis[5].id, app.data.kpis[0].id],
            owner: 'Robert Kim',
            stakeholders: 'Buying, Receiving, Supplier Quality',
            startDate: formatDate(new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000)),
            dueDate: formatDate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)),
            status: 'Improve',
            health: 'At Risk',
            priority: 'High',
            expectedImpact: 'Achieve 95% supplier OTD, reduce late-related expedites by 30%',
            actualImpact: 'Currently at 93%, 2% improvement from baseline',
            lastUpdated: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
            nextUpdateDate: formatDate(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)),
            actions: [
                {
                    id: generateId(),
                    text: 'Deploy supplier scorecards to top 50 suppliers',
                    owner: 'Robert Kim',
                    dueDate: formatDate(oneWeekAgo),
                    status: 'Done',
                    blockerNote: ''
                },
                {
                    id: generateId(),
                    text: 'Conduct QBR with underperforming suppliers',
                    owner: 'Buying Team',
                    dueDate: formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)),
                    status: 'Blocked',
                    blockerNote: 'Waiting on supplier availability - 3 of 8 QBRs completed'
                },
                {
                    id: generateId(),
                    text: 'Implement early warning system for at-risk POs',
                    owner: 'IT/Buying',
                    dueDate: formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)),
                    status: 'Open',
                    blockerNote: ''
                }
            ],
            links: [
                { label: 'Supplier Scorecard Template', url: '#' }
            ],
            notes: 'Scorecard deployment showing positive early results. Need to accelerate QBR schedule.'
        },
        {
            id: project3Id,
            title: 'Optimize Safety Stock Levels',
            area: 'Planning',
            problemStatement: 'Inventory turns below target (9.8 vs 12). Excess safety stock identified on slow-moving items while shortages persist on fast-movers.',
            impactedKPIs: [app.data.kpis[4].id],
            owner: 'Jennifer Wu',
            stakeholders: 'Planning, Finance, Warehouse',
            startDate: formatDate(new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000)),
            dueDate: formatDate(new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)),
            status: 'Measure',
            health: 'On Track',
            priority: 'Med',
            expectedImpact: 'Achieve 12 inventory turns, reduce working capital by $500K',
            actualImpact: '',
            lastUpdated: formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)),
            nextUpdateDate: formatDate(new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000)),
            actions: [
                {
                    id: generateId(),
                    text: 'Complete ABC/XYZ analysis of all SKUs',
                    owner: 'Jennifer Wu',
                    dueDate: formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
                    status: 'Open',
                    blockerNote: ''
                },
                {
                    id: generateId(),
                    text: 'Calculate current vs optimal safety stock levels',
                    owner: 'Planning Team',
                    dueDate: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)),
                    status: 'Open',
                    blockerNote: ''
                }
            ],
            links: [],
            notes: 'Initial data pull complete. Moving into detailed analysis phase.'
        }
    ];

    // Sample DMAIC Records
    app.data.dmaicRecords = [
        {
            id: generateId(),
            projectId: project1Id,
            define: {
                scopeIn: 'All expedited orders across all product lines; Planning parameters; Supplier delivery performance',
                scopeOut: 'Engineering changes; New product launches; Customer-requested expedites',
                goal: 'Reduce expedite frequency from 18/week to 9/week within 3 months',
                customers: 'Production, Logistics, Finance, Customers',
                constraints: 'Cannot change ERP system; Must maintain customer service levels'
            },
            measure: {
                baselineMetrics: 'Current expedites: 18/week avg; Premium freight: $65K/month; OTIF: 94%',
                dataSources: 'ERP expedite reports, Freight invoices, Customer delivery data',
                measurementPlan: 'Track weekly expedite count by root cause category; Monitor premium freight spend; Track OTIF impact'
            },
            analyze: {
                rootCauses: '40% demand changes within lead time; 35% planning parameters (safety stock, lead times); 25% supplier late deliveries',
                fishboneNotes: 'People: Forecast accuracy, buyer workload; Process: Planning parameters outdated, no supplier escalation; Systems: No early warning alerts; Materials: Supplier reliability varies',
                paretoNotes: 'Top 3 root causes account for 75% of expedites. Focus area identified.'
            },
            improve: {
                countermeasures: 'Improve sales forecast collaboration; Review/update planning parameters for top 100 SKUs; Deploy supplier scorecards with escalation triggers',
                pilotPlan: 'Phase 1: Top 20 SKUs, 4 weeks; Phase 2: Top 100 SKUs, 8 weeks',
                implementationPlan: 'Week 1-2: Sales forecast workshops; Week 3-6: Planning parameter review; Week 4-8: Supplier scorecard deployment; Week 9-12: Monitor and adjust',
                riskAssessment: 'Risk: Supplier pushback on scorecards. Mitigation: Engage procurement leadership. Risk: Planning parameter changes cause shortages. Mitigation: Pilot with monitoring'
            },
            control: {
                controlPlan: 'Weekly expedite review meeting; Monthly planning parameter audit; Quarterly supplier performance review',
                standardWork: 'Planning parameter review SOP; Supplier escalation process; Forecast collaboration calendar',
                auditCadence: 'Weekly KPI review; Monthly deep dive; Quarterly process audit',
                owners: 'Lisa Martinez (overall); Planning Team (parameters); Robert Kim (suppliers)',
                sustainmentChecks: '30-day check: Expedite trend; 60-day: Planning parameter compliance; 90-day: Full goal achievement'
            },
            attachments: []
        },
        {
            id: generateId(),
            projectId: project2Id,
            define: {
                scopeIn: 'All supplier deliveries; Top 50 suppliers by spend; Standard purchase orders',
                scopeOut: 'Internal logistics delays; Customer return logistics; Engineering prototype orders',
                goal: 'Achieve 95% supplier OTD within 2 months',
                customers: 'Production scheduling, Planning, Receiving',
                constraints: 'Cannot change supplier base short-term; Must work within existing contracts'
            },
            measure: {
                baselineMetrics: 'Supplier OTD: 91-93%; Late deliveries: 25-30/week; Schedule impact: 10% of production days affected',
                dataSources: 'ERP receiving reports; Supplier delivery confirmations; Production schedule variance reports',
                measurementPlan: 'Track OTD% by supplier weekly; Document late delivery root causes; Measure schedule impact'
            },
            analyze: {
                rootCauses: 'Lack of supplier visibility to urgency; No consequences for late delivery; Transportation mode/carrier issues; Supplier capacity constraints',
                fishboneNotes: 'People: No supplier accountability; Process: No escalation triggers, reactive management; Systems: No automated alerts; Measurement: Inconsistent tracking',
                paretoNotes: 'Top 10 suppliers account for 60% of late deliveries. Focus on high-impact relationships.'
            },
            improve: {
                countermeasures: 'Deploy supplier scorecards with monthly reviews; Implement early warning system for at-risk POs; Conduct QBRs with underperforming suppliers; Establish escalation protocols',
                pilotPlan: 'Phase 1: Top 10 suppliers with scorecards; Phase 2: Expand to top 50; Phase 3: Automated alerts',
                implementationPlan: 'Week 1-2: Scorecard design and approval; Week 3-4: Scorecard deployment; Week 5-8: QBR completion; Week 6-10: Early warning system build',
                riskAssessment: 'Risk: Supplier relationship damage. Mitigation: Frame as partnership tool. Risk: System integration delays. Mitigation: Manual process backup'
            },
            control: {
                controlPlan: 'Weekly OTD tracking; Monthly supplier scorecards; Quarterly business reviews with key suppliers',
                standardWork: 'Supplier scorecard calculation SOP; QBR agenda template; Escalation protocol',
                auditCadence: 'Weekly metrics review; Monthly scorecard audit; Quarterly process effectiveness review',
                owners: 'Robert Kim (supplier quality); Buying team (relationship management); IT (early warning system)',
                sustainmentChecks: '30-day: Scorecard adoption; 60-day: OTD improvement trend; 90-day: 95% target achievement'
            },
            attachments: []
        }
    ];

    // Sample AARs
    app.data.aars = [
        {
            id: generateId(),
            date: formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)),
            relatedProjectId: project1Id,
            area: 'Planning',
            incidentType: 'Expedite',
            description: 'Critical component shortage required premium air freight from Asia to avoid production line stop',
            impact: {
                costUSD: 15000,
                timeHours: 120,
                units: 500,
                notes: '2-day production delay avoided, premium freight vs standard sea freight cost delta'
            },
            rootCauseCategory: 'Planning parameters',
            why1: 'Why did we need to expedite? - Part shortage would have stopped production line',
            why2: 'Why was there a part shortage? - Inventory fell below safety stock before reorder triggered',
            why3: 'Why did inventory fall below safety stock? - Safety stock level set too low for demand variability',
            why4: 'Why was safety stock too low? - Planning parameters last reviewed 18 months ago, demand increased 30% since then',
            why5: 'Why weren\'t parameters updated? - No systematic process for planning parameter review',
            countermeasures: 'Immediate: Update safety stock for this SKU. Short-term: Review parameters for top 100 SKUs. Long-term: Implement quarterly planning parameter review process',
            preventionStandardWork: 'Planning parameter review SOP - quarterly review cycle for top movers, annual review for all SKUs',
            owner: 'Lisa Martinez',
            dueDate: formatDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)),
            status: 'Open',
            lessonsLearned: 'Planning parameters must be dynamic and reviewed regularly as demand patterns change. Proactive parameter management prevents reactive expedites.'
        },
        {
            id: generateId(),
            date: formatDate(new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000)),
            relatedProjectId: project2Id,
            area: 'Supplier Quality',
            incidentType: 'Late supplier',
            description: 'Key supplier delivered 3 days late, no advance notice, impacting production schedule',
            impact: {
                costUSD: 8000,
                timeHours: 48,
                units: 200,
                notes: 'Schedule disruption, overtime labor, expedited freight for downstream orders'
            },
            rootCauseCategory: 'Supplier late/short',
            why1: 'Why did supplier deliver late? - Production delay at supplier site',
            why2: 'Why was there a production delay? - Supplier equipment breakdown',
            why3: 'Why didn\'t we know about the delay in advance? - Supplier did not communicate the issue',
            why4: 'Why didn\'t supplier communicate? - No requirement or expectation for proactive communication',
            why5: 'Why no communication requirement? - Supplier agreements lack delivery communication protocols',
            countermeasures: 'Immediate: Request supplier recovery plan. Short-term: Add communication requirements to supplier agreements. Long-term: Implement supplier portal with delivery status visibility',
            preventionStandardWork: 'Supplier communication protocol - 5-day advance notice for any delivery changes, escalation to buyer and planner',
            owner: 'Robert Kim',
            dueDate: formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)),
            status: 'Open',
            lessonsLearned: 'Visibility and communication are critical. Supplier agreements must include proactive communication requirements.'
        },
        {
            id: generateId(),
            date: formatDate(new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000)),
            relatedProjectId: '',
            area: 'Warehouse',
            incidentType: 'Inventory error',
            description: 'System showed 500 units available but physical count revealed only 50 units, causing shortage and expedite',
            impact: {
                costUSD: 6500,
                timeHours: 72,
                units: 450,
                notes: 'Expedite cost plus production delay'
            },
            rootCauseCategory: 'Internal execution',
            why1: 'Why was there an inventory discrepancy? - System count did not match physical count',
            why2: 'Why didn\'t counts match? - Inventory transaction errors during receiving',
            why3: 'Why were there transaction errors? - Manual entry mistakes, items placed in wrong location',
            why4: 'Why manual entry mistakes? - No scanning process at putaway, high workload during peak receiving hours',
            why5: 'Why no scanning process? - Warehouse layout and system limitations prevent full scanning workflow',
            countermeasures: 'Immediate: Full cycle count for this item family. Short-term: Implement receiving audit process. Long-term: Redesign receiving workflow with mandatory scanning',
            preventionStandardWork: 'Receiving audit SOP - 10% daily sample audit of received items before putaway confirmation',
            owner: 'Warehouse Manager',
            dueDate: formatDate(new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000)),
            status: 'Open',
            lessonsLearned: 'Inventory accuracy is foundation for planning. Need systematic controls at receiving to ensure data integrity from the start.'
        },
        {
            id: generateId(),
            date: formatDate(new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000)),
            relatedProjectId: project1Id,
            area: 'Planning',
            incidentType: 'Expedite',
            description: 'Sales forecast increased 40% within 2-week lead time, required expedite to meet customer demand',
            impact: {
                costUSD: 12000,
                timeHours: 0,
                units: 800,
                notes: 'Premium freight, opportunity cost of reallocation from other orders'
            },
            rootCauseCategory: 'Forecast/Demand change',
            why1: 'Why did we need to expedite? - Demand spike not in forecast',
            why2: 'Why wasn\'t demand spike forecasted? - Sales learned of large customer order late in the cycle',
            why3: 'Why did Sales learn late? - Customer delayed their planning and commitment',
            why4: 'Why did customer delay? - End market uncertainty, customer internal process issues',
            why5: 'Why couldn\'t we buffer for this? - Lead time too short to react, safety stock insufficient for 40% spike',
            countermeasures: 'Immediate: None (external driver). Short-term: Improve Sales-Planning collaboration frequency. Long-term: Negotiate longer planning horizons with key customers',
            preventionStandardWork: 'Weekly Sales-Planning forecast collaboration meeting, focus on next 4 weeks pipeline',
            owner: 'Sarah Chen',
            dueDate: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)),
            status: 'Open',
            lessonsLearned: 'Some demand variability is market-driven and unavoidable. Better collaboration can improve visibility and reaction time.'
        },
        {
            id: generateId(),
            date: formatDate(new Date(today.getTime() - 32 * 24 * 60 * 60 * 1000)),
            relatedProjectId: '',
            area: 'Logistics',
            incidentType: 'Late supplier',
            description: 'Carrier delay due to weather resulted in 2-day late delivery, subsequent expedite to customer',
            impact: {
                costUSD: 4500,
                timeHours: 48,
                units: 150,
                notes: 'Customer expedite cost, goodwill recovery discount'
            },
            rootCauseCategory: 'Logistics/Carrier',
            why1: 'Why was delivery late to customer? - Had to expedite after carrier delay',
            why2: 'Why did carrier delay cause customer late? - No buffer time in schedule',
            why3: 'Why no buffer time? - Tight production and shipping schedule to optimize inventory',
            why4: 'Why optimize so tightly? - Cost pressure to minimize working capital',
            why5: 'Why not balance cost and risk? - No formal risk assessment of schedule buffers',
            countermeasures: 'Immediate: Case-by-case evaluation. Short-term: Analyze schedule buffer vs expedite cost trade-off. Long-term: Build contingency plans for critical lanes',
            preventionStandardWork: 'Quarterly review of carrier performance and schedule buffer adequacy, weather-prone lanes identified',
            owner: 'David Park',
            dueDate: formatDate(today),
            status: 'Closed',
            lessonsLearned: 'Some delays are uncontrollable. Need to balance lean schedules with appropriate buffers based on risk.'
        }
    ];

    // Sample Process Docs
    app.data.processDocs = [
        {
            id: generateId(),
            name: 'Material Requirements Planning (MRP)',
            area: 'Planning',
            purpose: 'Calculate material requirements based on demand forecast, current inventory, and lead times to generate purchase requisitions',
            inputs: 'Demand forecast, BOM, current inventory, supplier lead times, planning parameters',
            outputs: 'Purchase requisitions, planned orders, shortage reports',
            upstreamPartners: 'Sales (forecast), Engineering (BOM), Finance (budgets)',
            downstreamPartners: 'Buying (requisitions), Production (planned orders)',
            steps: [
                'Load current demand forecast by SKU',
                'Review current on-hand and on-order inventory',
                'Calculate net requirements using safety stock and lead times',
                'Generate planned orders and purchase requisitions',
                'Review exception messages (shortages, excess)',
                'Release requisitions to Buying'
            ],
            metrics: [app.data.kpis[2].id, app.data.kpis[4].id],
            failureModes: [
                'Inaccurate forecast leads to wrong requirements',
                'Outdated lead times cause early/late orders',
                'Inventory inaccuracy causes phantom shortages or real stockouts',
                'Planning parameters not maintained'
            ],
            standardWorkLinks: ['Planning Parameter Review SOP', 'MRP Run Schedule'],
            lastReviewedDate: formatDate(new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000)),
            owner: 'Jennifer Wu'
        },
        {
            id: generateId(),
            name: 'Purchase Order Management',
            area: 'Buying',
            purpose: 'Convert purchase requisitions to purchase orders, manage supplier relationships, track delivery performance',
            inputs: 'Purchase requisitions from Planning, supplier quotes, contracts',
            outputs: 'Purchase orders to suppliers, delivery confirmations, supplier performance data',
            upstreamPartners: 'Planning (requisitions), Finance (approvals)',
            downstreamPartners: 'Suppliers (orders), Receiving (expected receipts), Accounts Payable (invoices)',
            steps: [
                'Review and prioritize purchase requisitions',
                'Select supplier and verify pricing/terms',
                'Create and release purchase order',
                'Confirm order with supplier and obtain delivery commitment',
                'Track PO status and follow up on at-risk deliveries',
                'Update system with delivery changes',
                'Close PO after receipt and invoice matching'
            ],
            metrics: [app.data.kpis[5].id],
            failureModes: [
                'Supplier not contacted to confirm delivery',
                'Late delivery not escalated proactively',
                'PO not updated when supplier changes date',
                'Payment terms not optimized'
            ],
            standardWorkLinks: ['PO Creation SOP', 'Supplier Communication Protocol'],
            lastReviewedDate: formatDate(new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000)),
            owner: 'Buying Team Lead'
        },
        {
            id: generateId(),
            name: 'Inbound Receiving',
            area: 'Receiving',
            purpose: 'Physically receive materials, verify quality and quantity, update system inventory, route to storage or production',
            inputs: 'Supplier deliveries, advance ship notices (ASN), purchase orders',
            outputs: 'Received inventory in system, discrepancy reports, items in warehouse or production',
            upstreamPartners: 'Suppliers (deliveries), Buying (POs), Carriers (freight)',
            downstreamPartners: 'Warehouse (storage), Production (consumption), Quality (inspection)',
            steps: [
                'Check in carrier and unload delivery',
                'Match delivery to PO and ASN',
                'Count and inspect items for quality and damage',
                'Record receipt in system with location',
                'Route items: Quality inspection, direct to production, or warehouse storage',
                'Report discrepancies to buyer and supplier',
                'File receiving documents'
            ],
            metrics: [],
            failureModes: [
                'Quantity discrepancy not caught at receiving',
                'Items placed in wrong location causing system inaccuracy',
                'Quality issues not identified before putaway',
                'System transaction errors',
                'Delays in processing during peak hours'
            ],
            standardWorkLinks: ['Receiving Audit SOP', 'Discrepancy Resolution Process'],
            lastReviewedDate: formatDate(new Date(today.getTime() - 95 * 24 * 60 * 60 * 1000)),
            owner: 'Receiving Supervisor'
        }
    ];

    // Sample Meetings
    app.data.meetings = [
        {
            id: generateId(),
            dateTime: formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
            area: 'Planning',
            attendees: 'Lisa Martinez, Jennifer Wu, Planning Team',
            agenda: '1) KPI trend review\n2) Top 3 pains\n3) Review project actions\n4) Choose next CI focus',
            notes: 'Expedite count trending down to 12/week. Safety stock optimization project moving to Measure phase. Top pain: Forecast accuracy for new products.',
            decisions: 'Prioritize planning parameter review for top 100 SKUs. Defer new product forecast project to next quarter.',
            actionItems: [
                {
                    id: generateId(),
                    text: 'Schedule training session on updated planning parameters',
                    owner: 'Jennifer Wu',
                    dueDate: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)),
                    status: 'Open',
                    blockerNote: ''
                }
            ],
            nextMeetingDate: formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))
        },
        {
            id: generateId(),
            dateTime: formatDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)),
            area: 'Supplier Quality',
            attendees: 'Robert Kim, Buying Team, Supplier Quality',
            agenda: '1) KPI trend review\n2) Top 3 pains\n3) Review project actions\n4) Choose next CI focus',
            notes: 'Supplier OTD improved to 93%. Scorecard deployment complete for top 50 suppliers. Positive feedback from suppliers on visibility.',
            decisions: 'Accelerate QBR schedule - target 2 per week. Expand scorecard to top 100 suppliers in Q2.',
            actionItems: [
                {
                    id: generateId(),
                    text: 'Schedule remaining 5 QBRs with underperforming suppliers',
                    owner: 'Buying Team',
                    dueDate: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)),
                    status: 'Open',
                    blockerNote: ''
                }
            ],
            nextMeetingDate: formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))
        },
        {
            id: generateId(),
            dateTime: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
            area: 'Logistics',
            attendees: 'David Park, Logistics Team, Warehouse',
            agenda: '1) KPI trend review\n2) Top 3 pains\n3) Review project actions\n4) Choose next CI focus',
            notes: 'Premium freight spend decreasing. Carrier performance generally stable. Top pain: Warehouse space constraints affecting flow.',
            decisions: 'Initiate warehouse layout optimization study. Continue focus on expedite reduction to drive freight cost down.',
            actionItems: [],
            nextMeetingDate: formatDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000))
        }
    ];
}

// Utility Functions
function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatDate(date) {
    if (typeof date === 'string') return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDate(dateStr) {
    return new Date(dateStr);
}

function getDaysDifference(date1, date2) {
    const diffTime = date1 - date2;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function isDateInRange(dateStr, daysFromNow) {
    const date = parseDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = getDaysDifference(date, today);
    return diff >= 0 && diff <= daysFromNow;
}

function isOverdue(dateStr) {
    const date = parseDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function confirmDialog(message) {
    return confirm(message);
}

function closeModal() {
    const container = document.getElementById('modal-container');
    container.innerHTML = '';
}

/* =========================
   app.js — PART 2/6
   ========================= */

// Navigation and Routing
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    // Setup filters and search handlers
    setupFilterHandlers();
}

function navigateToPage(page) {
    app.currentPage = page;

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    // Show active page
    document.querySelectorAll('.page').forEach(pageEl => {
        pageEl.classList.remove('active');
    });
    document.getElementById(`page-${page}`).classList.add('active');

    // Render page content
    renderCurrentPage();
}

function renderCurrentPage() {
    switch (app.currentPage) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'kpis':
            renderKPIs();
            break;
        case 'projects':
            renderProjects();
            break;
        case 'dmaic':
            renderDMAIC();
            break;
        case 'aar':
            renderAAR();
            break;
        case 'process':
            renderProcessLibrary();
            break;
        case 'meetings':
            renderMeetings();
            break;
        case 'settings':
            renderSettings();
            break;
        case 'products':
            if (typeof renderProductsPage === 'function') renderProductsPage();
            break;
        case 'areas':
            if (typeof renderAreasPage === 'function') renderAreasPage();
            break;
        case 'calendar':
            if (typeof renderCalendarPage === 'function') renderCalendarPage();
            break;
        case 'help':
            // Static page — no render needed
            break;
    }
}

// Filter and Search Handlers
function setupFilterHandlers() {
    // KPI filters
    const kpiSearch = document.getElementById('kpi-search');
    const kpiCategoryFilter = document.getElementById('kpi-category-filter');
    if (kpiSearch) {
        kpiSearch.addEventListener('input', () => renderKPIs());
    }
    if (kpiCategoryFilter) {
        kpiCategoryFilter.addEventListener('change', () => renderKPIs());
    }

    // Project filters
    const projectSearch = document.getElementById('project-search');
    const projectAreaFilter = document.getElementById('project-area-filter');
    const projectStatusFilter = document.getElementById('project-status-filter');
    const projectHealthFilter = document.getElementById('project-health-filter');

    if (projectSearch) projectSearch.addEventListener('input', () => renderProjects());
    if (projectAreaFilter) projectAreaFilter.addEventListener('change', () => renderProjects());
    if (projectStatusFilter) projectStatusFilter.addEventListener('change', () => renderProjects());
    if (projectHealthFilter) projectHealthFilter.addEventListener('change', () => renderProjects());
    const projectProductFilter = document.getElementById('project-product-filter');
    if (projectProductFilter) projectProductFilter.addEventListener('change', () => renderProjects());

    // AAR filters
    const aarSearch = document.getElementById('aar-search');
    const aarAreaFilter = document.getElementById('aar-area-filter');
    const aarTypeFilter = document.getElementById('aar-type-filter');
    const aarStatusFilter = document.getElementById('aar-status-filter');

    if (aarSearch) aarSearch.addEventListener('input', () => renderAAR());
    if (aarAreaFilter) aarAreaFilter.addEventListener('change', () => renderAAR());
    if (aarTypeFilter) aarTypeFilter.addEventListener('change', () => renderAAR());
    if (aarStatusFilter) aarStatusFilter.addEventListener('change', () => renderAAR());

    // Process filters
    const processSearch = document.getElementById('process-search');
    const processAreaFilter = document.getElementById('process-area-filter');

    if (processSearch) processSearch.addEventListener('input', () => renderProcessLibrary());
    if (processAreaFilter) processAreaFilter.addEventListener('change', () => renderProcessLibrary());

    // DMAIC tabs
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            const tab = e.target.getAttribute('data-tab');
            switchDMAICTab(tab);
        }
    });
}

// Global Event Delegation
document.addEventListener('click', (e) => {
    // Modal close
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }

    if (e.target.classList.contains('modal-close')) {
        closeModal();
    }

    // Project card clicks
    if (e.target.closest('.project-card')) {
        const projectCard = e.target.closest('.project-card');
        const projectId = projectCard.getAttribute('data-project-id');
        if (projectId) {
            showProjectDetailModal(projectId);
        }
    }

    // KPI card clicks
    if (e.target.closest('.kpi-card')) {
        const kpiCard = e.target.closest('.kpi-card');
        const kpiId = kpiCard.getAttribute('data-kpi-id');
        if (kpiId) {
            showKPIDetailModal(kpiId);
        }
    }

    // AAR card clicks
    if (e.target.closest('.aar-card')) {
        const aarCard = e.target.closest('.aar-card');
        const aarId = aarCard.getAttribute('data-aar-id');
        if (aarId) {
            showAARDetailModal(aarId);
        }
    }

    // Process card clicks
    if (e.target.closest('.process-card')) {
        const processCard = e.target.closest('.process-card');
        const processId = processCard.getAttribute('data-process-id');
        if (processId) {
            showProcessDetailModal(processId);
        }
    }

    // Meeting card clicks
    if (e.target.closest('.meeting-card')) {
        const meetingCard = e.target.closest('.meeting-card');
        const meetingId = meetingCard.getAttribute('data-meeting-id');
        if (meetingId) {
            showMeetingDetailModal(meetingId);
        }
    }
});

// Make app functions globally accessible
app.showCreateKPIModal = showCreateKPIModal;
app.showCreateProjectModal = showCreateProjectModal;
app.showCreateAARModal = showCreateAARModal;
app.showCreateProcessModal = showCreateProcessModal;
app.showCreateMeetingModal = showCreateMeetingModal;
app.exportData = exportData;
app.importDataPrompt = importDataPrompt;
app.resetToSampleData = resetToSampleData;
app.loadDMAICForProject = loadDMAICForProject;
app.saveDMAIC = saveDMAIC;
app.generateDMAICSummary = generateDMAICSummary;

/* =========================
   app.js — PART 3/6
   ========================= */

// Dashboard Rendering
function renderDashboard() {
    renderKPISummary();
    renderThisWeekPanel();
    renderProjectHealthChart();
    renderParetoChart();
}

function renderKPISummary() {
    const container = document.getElementById('kpi-summary');
    if (!container) return;

    const html = app.data.kpis.map(kpi => {
        const lastValue = kpi.dataPoints.length > 0 ? kpi.dataPoints[kpi.dataPoints.length - 1].value : 0;
        const trend = calculateTrend(kpi.dataPoints);
        const trendArrow = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';
        const vsTarget = lastValue >= kpi.target ? 'on-track' : 'off-track';

        return `
            <div class="kpi-card" data-kpi-id="${kpi.id}">
                <div class="kpi-card-header">
                    <div class="kpi-name">${kpi.name}</div>
                    <div class="kpi-trend">${trendArrow}</div>
                </div>
                <div class="kpi-value">${formatKPIValue(lastValue, kpi.unit)}</div>
                <div class="kpi-target">Target: ${formatKPIValue(kpi.target, kpi.unit)}</div>
                <span class="kpi-category">${kpi.category}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = html || '<div class="empty-state">No KPIs defined</div>';
}

function renderThisWeekPanel() {
    const container = document.getElementById('this-week-panel');
    if (!container) return;

    const overdueActions = [];
    const dueSoonActions = [];
    const updatesDue = [];

    app.data.projects.forEach(project => {
        project.actions.forEach(action => {
            if (action.status !== 'Done') {
                if (isOverdue(action.dueDate)) {
                    overdueActions.push({ ...action, projectTitle: project.title });
                } else if (isDateInRange(action.dueDate, 7)) {
                    dueSoonActions.push({ ...action, projectTitle: project.title });
                }
            }
        });

        if (project.nextUpdateDate && isDateInRange(project.nextUpdateDate, 7)) {
            updatesDue.push(project);
        }
    });

    let html = '';

    if (overdueActions.length > 0) {
        html += '<div class="week-section"><h3>Overdue Actions</h3>';
        overdueActions.forEach(action => {
            html += `
                <div class="action-item overdue">
                    <div class="action-text">${action.text}</div>
                    <div class="action-meta">
                        ${action.projectTitle} • ${action.owner} • Due: ${action.dueDate}
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    if (dueSoonActions.length > 0) {
        html += '<div class="week-section"><h3>Due This Week</h3>';
        dueSoonActions.forEach(action => {
            html += `
                <div class="action-item due-soon">
                    <div class="action-text">${action.text}</div>
                    <div class="action-meta">
                        ${action.projectTitle} • ${action.owner} • Due: ${action.dueDate}
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }

    if (updatesDue.length > 0) {
        html += '<div class="week-section"><h3>Project Updates Due</h3>';
        updatesDue.forEach(project => {
            html += `
                <div class="action-item">
                    <div class="action-text">${project.title}</div>
                    <div class="action-meta">Next update: ${project.nextUpdateDate}</div>
                </div>
            `;
        });
        html += '</div>';
    }

    if (!html) {
        html = '<div class="empty-state">Nothing due this week</div>';
    }

    container.innerHTML = html;
}

function renderProjectHealthChart() {
    const container = document.getElementById('project-health-chart');
    if (!container) return;

    const counts = {
        'On Track': 0,
        'At Risk': 0,
        'Off Track': 0
    };

    app.data.projects.forEach(project => {
        if (project.status !== 'Closed') {
            counts[project.health] = (counts[project.health] || 0) + 1;
        }
    });

    const html = `
        <div class="health-stat">
            <span class="health-stat-label">
                <span class="health-badge health-on-track">On Track</span>
            </span>
            <span class="health-stat-value">${counts['On Track']}</span>
        </div>
        <div class="health-stat">
            <span class="health-stat-label">
                <span class="health-badge health-at-risk">At Risk</span>
            </span>
            <span class="health-stat-value">${counts['At Risk']}</span>
        </div>
        <div class="health-stat">
            <span class="health-stat-label">
                <span class="health-badge health-off-track">Off Track</span>
            </span>
            <span class="health-stat-value">${counts['Off Track']}</span>
        </div>
    `;

    container.innerHTML = html;
}

function renderParetoChart() {
    const container = document.getElementById('pareto-chart');
    if (!container) return;

    const categoryCounts = {};
    app.data.aars.forEach(aar => {
        const cat = aar.rootCauseCategory || 'Unknown';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;

    const html = sorted.map(([category, count]) => {
        const percentage = (count / maxCount) * 100;
        return `
            <div class="pareto-bar">
                <div class="pareto-label">${category}</div>
                <div class="pareto-bar-container">
                    <div class="pareto-bar-fill" style="width: ${percentage}%">${count}</div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html || '<div class="empty-state">No AAR data</div>';
}

// KPI Rendering
function renderKPIs() {
    const container = document.getElementById('kpi-list');
    if (!container) return;

    const searchTerm = document.getElementById('kpi-search')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('kpi-category-filter')?.value || '';

    let filtered = app.data.kpis.filter(kpi => {
        const matchesSearch = kpi.name.toLowerCase().includes(searchTerm) ||
                            kpi.definition.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || kpi.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const html = filtered.map(kpi => {
        const lastValue = kpi.dataPoints.length > 0 ? kpi.dataPoints[kpi.dataPoints.length - 1].value : 0;
        const trend = calculateTrend(kpi.dataPoints);
        const trendArrow = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';

        return `
            <div class="kpi-card" data-kpi-id="${kpi.id}">
                <div class="kpi-card-header">
                    <div class="kpi-name">${kpi.name}</div>
                    <div class="kpi-trend">${trendArrow}</div>
                </div>
                <div class="kpi-value">${formatKPIValue(lastValue, kpi.unit)}</div>
                <div class="kpi-target">Target: ${formatKPIValue(kpi.target, kpi.unit)} | Owner: ${kpi.owner}</div>
                <span class="kpi-category">${kpi.category}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">📈</div>No KPIs found</div>';
}

// KPI Detail Modal
function showKPIDetailModal(kpiId) {
    const kpi = app.data.kpis.find(k => k.id === kpiId);
    if (!kpi) return;

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>${kpi.name}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Definition:</label>
                        <p>${kpi.definition}</p>
                    </div>
                    <div class="form-group">
                        <label>Category:</label>
                        <span class="kpi-category">${kpi.category}</span>
                    </div>
                    <div class="form-group">
                        <label>Owner:</label>
                        <p>${kpi.owner}</p>
                    </div>
                    <div class="form-group">
                        <label>Target:</label>
                        <p>${formatKPIValue(kpi.target, kpi.unit)}</p>
                    </div>
                    <div class="form-group">
                        <label>Cadence:</label>
                        <p>${kpi.cadence}</p>
                    </div>

                    <h3>Performance Trend</h3>
                    <canvas id="kpi-chart-canvas" width="600" height="300"></canvas>

                    <h3>Add Data Point</h3>
                    <div class="form-group">
                        <label>Date:</label>
                        <input type="date" id="kpi-datapoint-date" class="form-control" value="${formatDate(new Date())}">
                    </div>
                    <div class="form-group">
                        <label>Value:</label>
                        <input type="number" id="kpi-datapoint-value" class="form-control" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Note (optional):</label>
                        <input type="text" id="kpi-datapoint-note" class="form-control">
                    </div>
                    <button class="btn btn-primary" onclick="addKPIDataPoint('${kpiId}')">Add Data Point</button>

                    <h3>Data History</h3>
                    <div id="kpi-datapoints-list">
                        ${renderKPIDataPoints(kpi)}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="editKPI('${kpiId}')">Edit KPI</button>
                    <button class="btn btn-danger" onclick="deleteKPI('${kpiId}')">Delete KPI</button>
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;

    setTimeout(() => drawKPIChart(kpi), 100);
}

function renderKPIDataPoints(kpi) {
    if (kpi.dataPoints.length === 0) {
        return '<p>No data points yet</p>';
    }

    return kpi.dataPoints.slice().reverse().map(dp => `
        <div style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
            <strong>${dp.date}:</strong> ${formatKPIValue(dp.value, kpi.unit)}
            ${dp.note ? `<br><small>${dp.note}</small>` : ''}
        </div>
    `).join('');
}

function drawKPIChart(kpi) {
    const canvas = document.getElementById('kpi-chart-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;

    ctx.clearRect(0, 0, width, height);

    if (kpi.dataPoints.length === 0) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data to display', width / 2, height / 2);
        return;
    }

    const values = kpi.dataPoints.map(dp => dp.value);
    const maxValue = Math.max(...values, kpi.target);
    const minValue = Math.min(...values, kpi.target);
    const range = maxValue - minValue || 1;

    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw axes
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw target line
    const targetY = height - padding - ((kpi.target - minValue) / range) * chartHeight;
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, targetY);
    ctx.lineTo(width - padding, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ea580c';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Target: ${kpi.target}`, width - padding - 10, targetY - 5);

    // Draw data line
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();

    kpi.dataPoints.forEach((dp, i) => {
        const x = padding + (i / (kpi.dataPoints.length - 1 || 1)) * chartWidth;
        const y = height - padding - ((dp.value - minValue) / range) * chartHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        // Draw point
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });

    ctx.strokeStyle = '#2563eb';
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#4b5563';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    kpi.dataPoints.forEach((dp, i) => {
        const x = padding + (i / (kpi.dataPoints.length - 1 || 1)) * chartWidth;
        const shortDate = dp.date.slice(5);
        ctx.fillText(shortDate, x, height - padding + 20);
    });
}

// KPI CRUD Operations
function showCreateKPIModal() {
    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Create New KPI</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="kpi-form">
                        <div class="form-group">
                            <label>KPI Name *</label>
                            <input type="text" id="kpi-name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Category *</label>
                            <select id="kpi-category" class="form-control" required>
                                <option value="Service">Service</option>
                                <option value="Flow">Flow</option>
                                <option value="Stability">Stability</option>
                                <option value="Cost">Cost</option>
                                <option value="Quality">Quality</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Definition *</label>
                            <textarea id="kpi-definition" class="form-control" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Owner *</label>
                            <input type="text" id="kpi-owner" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Target Value *</label>
                            <input type="number" id="kpi-target" class="form-control" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>Unit *</label>
                            <input type="text" id="kpi-unit" class="form-control" placeholder="%, $, count, etc." required>
                        </div>
                        <div class="form-group">
                            <label>Cadence *</label>
                            <select id="kpi-cadence" class="form-control" required>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="createKPI()">Create KPI</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function createKPI() {
    const name = document.getElementById('kpi-name').value;
    const category = document.getElementById('kpi-category').value;
    const definition = document.getElementById('kpi-definition').value;
    const owner = document.getElementById('kpi-owner').value;
    const target = parseFloat(document.getElementById('kpi-target').value);
    const unit = document.getElementById('kpi-unit').value;
    const cadence = document.getElementById('kpi-cadence').value;

    if (!name || !definition || !owner || !target || !unit) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const kpi = {
        id: generateId(),
        name,
        category,
        definition,
        owner,
        target,
        unit,
        cadence,
        dataPoints: []
    };

    app.data.kpis.push(kpi);
    saveData();
    closeModal();
    renderKPIs();
    showToast('KPI created successfully');
}

function editKPI(kpiId) {
    const kpi = app.data.kpis.find(k => k.id === kpiId);
    if (!kpi) return;

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Edit KPI</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="kpi-form">
                        <div class="form-group">
                            <label>KPI Name *</label>
                            <input type="text" id="kpi-name" class="form-control" value="${kpi.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Category *</label>
                            <select id="kpi-category" class="form-control" required>
                                <option value="Service" ${kpi.category === 'Service' ? 'selected' : ''}>Service</option>
                                <option value="Flow" ${kpi.category === 'Flow' ? 'selected' : ''}>Flow</option>
                                <option value="Stability" ${kpi.category === 'Stability' ? 'selected' : ''}>Stability</option>
                                <option value="Cost" ${kpi.category === 'Cost' ? 'selected' : ''}>Cost</option>
                                <option value="Quality" ${kpi.category === 'Quality' ? 'selected' : ''}>Quality</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Definition *</label>
                            <textarea id="kpi-definition" class="form-control" required>${kpi.definition}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Owner *</label>
                            <input type="text" id="kpi-owner" class="form-control" value="${kpi.owner}" required>
                        </div>
                        <div class="form-group">
                            <label>Target Value *</label>
                            <input type="number" id="kpi-target" class="form-control" step="0.01" value="${kpi.target}" required>
                        </div>
                        <div class="form-group">
                            <label>Unit *</label>
                            <input type="text" id="kpi-unit" class="form-control" value="${kpi.unit}" required>
                        </div>
                        <div class="form-group">
                            <label>Cadence *</label>
                            <select id="kpi-cadence" class="form-control" required>
                                <option value="Weekly" ${kpi.cadence === 'Weekly' ? 'selected' : ''}>Weekly</option>
                                <option value="Monthly" ${kpi.cadence === 'Monthly' ? 'selected' : ''}>Monthly</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="updateKPI('${kpiId}')">Update KPI</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function updateKPI(kpiId) {
    const kpi = app.data.kpis.find(k => k.id === kpiId);
    if (!kpi) return;

    kpi.name = document.getElementById('kpi-name').value;
    kpi.category = document.getElementById('kpi-category').value;
    kpi.definition = document.getElementById('kpi-definition').value;
    kpi.owner = document.getElementById('kpi-owner').value;
    kpi.target = parseFloat(document.getElementById('kpi-target').value);
    kpi.unit = document.getElementById('kpi-unit').value;
    kpi.cadence = document.getElementById('kpi-cadence').value;

    saveData();
    closeModal();
    showToast('KPI updated successfully');
    if (app.currentPage === 'kpis') {
        renderKPIs();
    } else {
        renderDashboard();
    }
}

function deleteKPI(kpiId) {
    if (!confirmDialog('Are you sure you want to delete this KPI? This action cannot be undone.')) {
        return;
    }

    const index = app.data.kpis.findIndex(k => k.id === kpiId);
    if (index > -1) {
        app.data.kpis.splice(index, 1);
        saveData();
        closeModal();
        showToast('KPI deleted successfully');
        if (app.currentPage === 'kpis') {
            renderKPIs();
        } else {
            renderDashboard();
        }
    }
}

function addKPIDataPoint(kpiId) {
    const kpi = app.data.kpis.find(k => k.id === kpiId);
    if (!kpi) return;

    const date = document.getElementById('kpi-datapoint-date').value;
    const value = parseFloat(document.getElementById('kpi-datapoint-value').value);
    const note = document.getElementById('kpi-datapoint-note').value;

    if (!date || isNaN(value)) {
        showToast('Please enter date and value', 'error');
        return;
    }

    kpi.dataPoints.push({ date, value, note });
    kpi.dataPoints.sort((a, b) => a.date.localeCompare(b.date));

    saveData();
    showToast('Data point added successfully');
    showKPIDetailModal(kpiId);
}

// Helper Functions
function calculateTrend(dataPoints) {
    if (dataPoints.length < 2) return 0;
    const recent = dataPoints.slice(-3);
    if (recent.length < 2) return 0;
    const first = recent[0].value;
    const last = recent[recent.length - 1].value;
    return last > first ? 1 : last < first ? -1 : 0;
}

function formatKPIValue(value, unit) {
    if (unit === '$') {
        return `$${value.toLocaleString()}`;
    } else if (unit === '%') {
        return `${value}%`;
    } else {
        return `${value} ${unit}`;
    }
}

window.addKPIDataPoint = addKPIDataPoint;
window.createKPI = createKPI;
window.editKPI = editKPI;
window.updateKPI = updateKPI;
window.deleteKPI = deleteKPI;

/* =========================
   app.js — PART 4/6
   ========================= */

// Projects Rendering
function renderProjects() {
    const container = document.getElementById('project-list');
    if (!container) return;

    // Populate product filter dropdown dynamically
    const productFilterEl = document.getElementById('project-product-filter');
    if (productFilterEl && productFilterEl.options.length <= 1) {
        const currentVal = productFilterEl.value;
        productFilterEl.innerHTML = '<option value="">All Products</option>';
        (app.data.products || []).forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name + (p.code ? ' (' + p.code + ')' : '');
            productFilterEl.appendChild(opt);
        });
        productFilterEl.value = currentVal;
    }

    const searchTerm = document.getElementById('project-search')?.value.toLowerCase() || '';
    const areaFilter = document.getElementById('project-area-filter')?.value || '';
    const statusFilter = document.getElementById('project-status-filter')?.value || '';
    const healthFilter = document.getElementById('project-health-filter')?.value || '';
    const productFilter = document.getElementById('project-product-filter')?.value || '';

    let filtered = app.data.projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchTerm) ||
                            project.problemStatement.toLowerCase().includes(searchTerm);
        const matchesArea = !areaFilter || project.area === areaFilter;
        const matchesStatus = !statusFilter || project.status === statusFilter;
        const matchesHealth = !healthFilter || project.health === healthFilter;
        const matchesProduct = !productFilter || (project.productIds || []).includes(productFilter);
        return matchesSearch && matchesArea && matchesStatus && matchesHealth && matchesProduct;
    });

    const html = filtered.map(project => {
        const healthClass = project.health === 'On Track' ? 'health-on-track' :
                          project.health === 'At Risk' ? 'health-at-risk' : 'health-off-track';
        const priorityClass = project.priority === 'High' ? 'priority-high' :
                            project.priority === 'Med' ? 'priority-med' : 'priority-low';

        const openActions = project.actions.filter(a => a.status !== 'Done').length;
        const overdueActions = project.actions.filter(a => a.status !== 'Done' && isOverdue(a.dueDate)).length;

        const linkedProducts = (project.productIds || []).map(pid => {
            const p = (app.data.products || []).find(p => p.id === pid);
            return p ? `<span class="product-tag">${escapeHtml(p.name)}</span>` : '';
        }).join('');

        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-card-header">
                    <div>
                        <div class="project-title">${project.title}</div>
                        <div style="color: var(--gray-600); font-size: 13px; margin-top: 4px;">
                            ${project.area} • ${project.owner}
                        </div>
                        ${linkedProducts ? `<div class="product-tags" style="margin-top: 6px;">${linkedProducts}</div>` : ''}
                    </div>
                    <div class="project-badges">
                        <span class="health-badge ${healthClass}">${project.health}</span>
                        <span class="priority-badge ${priorityClass}">${project.priority}</span>
                        <span class="status-badge ${project.status === 'Closed' ? 'status-closed' : ''}">${project.status}</span>
                    </div>
                </div>
                <div style="margin: 12px 0; color: var(--gray-700); font-size: 13px;">
                    ${project.problemStatement}
                </div>
                <div class="project-meta">
                    <span>Due: ${project.dueDate}</span>
                    <span>Actions: ${openActions} open${overdueActions > 0 ? ` (${overdueActions} overdue)` : ''}</span>
                    <span>Last updated: ${project.lastUpdated}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">📋</div>No projects found</div>';
}

// Create Project Modal
function showCreateProjectModal() {
    const kpiOptions = app.data.kpis.map(kpi =>
        `<option value="${kpi.id}">${kpi.name}</option>`
    ).join('');

    const productOptions = (app.data.products || []).map(p =>
        `<option value="${p.id}">${escapeHtml(p.name)}${p.code ? ' (' + escapeHtml(p.code) + ')' : ''}</option>`
    ).join('');

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Create New Project</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="project-form">
                        <div class="form-group">
                            <label>Project Title *</label>
                            <input type="text" id="project-title" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Area *</label>
                            <select id="project-area" class="form-control" required>
                                <option value="Planning">Planning</option>
                                <option value="Buying">Buying</option>
                                <option value="Receiving">Receiving</option>
                                <option value="Warehouse">Warehouse</option>
                                <option value="Logistics">Logistics</option>
                                <option value="Supplier Quality">Supplier Quality</option>
                                <option value="Scheduling">Scheduling</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Product(s)</label>
                            <select id="project-products" class="form-control" multiple size="3">
                                ${productOptions}
                            </select>
                            <small>Hold Ctrl/Cmd to select multiple${productOptions ? '' : ' — add products in the Products page first'}</small>
                        </div>
                        <div class="form-group">
                            <label>Problem Statement *</label>
                            <textarea id="project-problem" class="form-control" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Impacted KPIs</label>
                            <select id="project-kpis" class="form-control" multiple size="4">
                                ${kpiOptions}
                            </select>
                            <small>Hold Ctrl/Cmd to select multiple</small>
                        </div>
                        <div class="form-group">
                            <label>Owner *</label>
                            <input type="text" id="project-owner" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Stakeholders</label>
                            <input type="text" id="project-stakeholders" class="form-control" placeholder="Comma-separated">
                        </div>
                        <div class="form-group">
                            <label>Start Date *</label>
                            <input type="date" id="project-start" class="form-control" value="${formatDate(new Date())}" required>
                        </div>
                        <div class="form-group">
                            <label>Due Date *</label>
                            <input type="date" id="project-due" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Priority *</label>
                            <select id="project-priority" class="form-control" required>
                                <option value="High">High</option>
                                <option value="Med">Med</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Expected Impact</label>
                            <textarea id="project-expected-impact" class="form-control"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="createProject()">Create Project</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function createProject() {
    const title = document.getElementById('project-title').value;
    const area = document.getElementById('project-area').value;
    const problemStatement = document.getElementById('project-problem').value;
    const owner = document.getElementById('project-owner').value;
    const stakeholders = document.getElementById('project-stakeholders').value;
    const startDate = document.getElementById('project-start').value;
    const dueDate = document.getElementById('project-due').value;
    const priority = document.getElementById('project-priority').value;
    const expectedImpact = document.getElementById('project-expected-impact').value;

    const kpiSelect = document.getElementById('project-kpis');
    const impactedKPIs = Array.from(kpiSelect.selectedOptions).map(opt => opt.value);

    const productSelect = document.getElementById('project-products');
    const productIds = productSelect ? Array.from(productSelect.selectedOptions).map(opt => opt.value) : [];

    if (!title || !area || !problemStatement || !owner || !startDate || !dueDate) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const project = {
        id: generateId(),
        title,
        area,
        problemStatement,
        impactedKPIs,
        productIds,
        owner,
        stakeholders,
        startDate,
        dueDate,
        status: 'New',
        health: 'On Track',
        priority,
        expectedImpact,
        actualImpact: '',
        lastUpdated: formatDate(new Date()),
        nextUpdateDate: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        actions: [],
        links: [],
        notes: ''
    };

    app.data.projects.push(project);
    saveData();
    closeModal();
    renderProjects();
    showToast('Project created successfully');
}

// Project Detail Modal
function showProjectDetailModal(projectId) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    const healthClass = project.health === 'On Track' ? 'health-on-track' :
                      project.health === 'At Risk' ? 'health-at-risk' : 'health-off-track';

    const impactedKPINames = project.impactedKPIs
        .map(kpiId => app.data.kpis.find(k => k.id === kpiId)?.name)
        .filter(Boolean)
        .join(', ') || 'None';

    const relatedAARs = app.data.aars.filter(aar => aar.relatedProjectId === projectId);
    const dmaicRecord = app.data.dmaicRecords.find(d => d.projectId === projectId);

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>${project.title}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                        <span class="health-badge ${healthClass}">${project.health}</span>
                        <span class="priority-badge priority-${project.priority.toLowerCase()}">${project.priority}</span>
                        <span class="status-badge">${project.status}</span>
                    </div>

                    <h3>Overview</h3>
                    <div class="form-group">
                        <label>Area:</label>
                        <p>${project.area}</p>
                    </div>
                    <div class="form-group">
                        <label>Problem Statement:</label>
                        <p>${project.problemStatement}</p>
                    </div>
                    <div class="form-group">
                        <label>Owner:</label>
                        <p>${project.owner}</p>
                    </div>
                    <div class="form-group">
                        <label>Stakeholders:</label>
                        <p>${project.stakeholders}</p>
                    </div>
                    <div class="form-group">
                        <label>Impacted KPIs:</label>
                        <p>${impactedKPINames}</p>
                    </div>
                    <div class="form-group">
                        <label>Timeline:</label>
                        <p>${project.startDate} to ${project.dueDate}</p>
                    </div>
                    <div class="form-group">
                        <label>Expected Impact:</label>
                        <p>${project.expectedImpact || 'Not specified'}</p>
                    </div>
                    <div class="form-group">
                        <label>Actual Impact:</label>
                        <p>${project.actualImpact || 'Not yet measured'}</p>
                    </div>
                    <div class="form-group">
                        <label>Last Updated:</label>
                        <p>${project.lastUpdated} | Next update: ${project.nextUpdateDate}</p>
                    </div>

                    <h3>Actions</h3>
                    <div id="project-actions-list">
                        ${renderProjectActions(project)}
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="addProjectAction('${projectId}')">+ Add Action</button>

                    <h3>Links</h3>
                    ${dmaicRecord ? `<p>✓ <a href="#" onclick="navigateToPage('dmaic'); app.loadDMAICForProject(); closeModal(); return false;">View DMAIC Record</a></p>` : '<p>No DMAIC record yet</p>'}
                    ${relatedAARs.length > 0 ? `<p>✓ ${relatedAARs.length} related AAR(s)</p>` : '<p>No related AARs</p>'}

                    <h3>Notes</h3>
                    <textarea id="project-notes" class="form-control" style="min-height: 80px;">${project.notes}</textarea>
                    <button class="btn btn-secondary btn-small mt-2" onclick="saveProjectNotes('${projectId}')">Save Notes</button>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="updateProjectStatus('${projectId}')">Update Status/Health</button>
                    <button class="btn btn-secondary" onclick="markProjectUpdated('${projectId}')">Mark Updated Today</button>
                    <button class="btn btn-secondary" onclick="editProject('${projectId}')">Edit Project</button>
                    <button class="btn btn-danger" onclick="deleteProject('${projectId}')">Delete</button>
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function renderProjectActions(project) {
    if (project.actions.length === 0) {
        return '<p style="color: var(--gray-400);">No actions yet</p>';
    }

    return project.actions.map(action => {
        const overdue = action.status !== 'Done' && isOverdue(action.dueDate);
        const actionClass = overdue ? 'action-item overdue' : action.status === 'Blocked' ? 'action-item' : 'action-item';
        const statusBadge = action.status === 'Done' ? '✓' : action.status === 'Blocked' ? '⚠' : '○';

        return `
            <div class="${actionClass}" style="margin-bottom: 12px; border-left: 3px solid ${overdue ? 'var(--danger)' : action.status === 'Done' ? 'var(--success)' : 'var(--gray-300)'};">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div class="action-text">
                            ${statusBadge} ${action.text}
                        </div>
                        <div class="action-meta">
                            ${action.owner} • Due: ${action.dueDate}
                            ${action.status === 'Blocked' && action.blockerNote ? `<br><strong>Blocker:</strong> ${action.blockerNote}` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        ${action.status !== 'Done' ? `
                            <button class="btn btn-success btn-small" onclick="markActionDone('${project.id}', '${action.id}')">Done</button>
                            <button class="btn btn-secondary btn-small" onclick="toggleActionBlocked('${project.id}', '${action.id}')">
                                ${action.status === 'Blocked' ? 'Unblock' : 'Block'}
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-small" onclick="editAction('${project.id}', '${action.id}')">Edit</button>
                        <button class="btn btn-danger btn-small" onclick="deleteAction('${project.id}', '${action.id}')">×</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addProjectAction(projectId) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    const actionModal = `
        <div class="modal-overlay" style="z-index: 1100;">
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Add Action</h2>
                    <button class="modal-close" onclick="closeSecondaryModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Action Description *</label>
                        <textarea id="action-text" class="form-control" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Owner *</label>
                        <input type="text" id="action-owner" class="form-control" value="${project.owner}" required>
                    </div>
                    <div class="form-group">
                        <label>Due Date *</label>
                        <input type="date" id="action-due" class="form-control" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeSecondaryModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveProjectAction('${projectId}')">Add Action</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').insertAdjacentHTML('beforeend', actionModal);
}

function saveProjectAction(projectId, actionId = null) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    const text = document.getElementById('action-text').value;
    const owner = document.getElementById('action-owner').value;
    const dueDate = document.getElementById('action-due').value;

    if (!text || !owner || !dueDate) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (actionId) {
        const action = project.actions.find(a => a.id === actionId);
        if (action) {
            action.text = text;
            action.owner = owner;
            action.dueDate = dueDate;
        }
    } else {
        project.actions.push({
            id: generateId(),
            text,
            owner,
            dueDate,
            status: 'Open',
            blockerNote: ''
        });
    }

    saveData();
    closeSecondaryModal();
    showProjectDetailModal(projectId);
    showToast('Action saved successfully');
}

function editAction(projectId, actionId) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    const action = project.actions.find(a => a.id === actionId);
    if (!action) return;

    const actionModal = `
        <div class="modal-overlay" style="z-index: 1100;">
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Edit Action</h2>
                    <button class="modal-close" onclick="closeSecondaryModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Action Description *</label>
                        <textarea id="action-text" class="form-control" required>${action.text}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Owner *</label>
                        <input type="text" id="action-owner" class="form-control" value="${action.owner}" required>
                    </div>
                    <div class="form-group">
                        <label>Due Date *</label>
                        <input type="date" id="action-due" class="form-control" value="${action.dueDate}" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeSecondaryModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveProjectAction('${projectId}', '${actionId}')">Update Action</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').insertAdjacentHTML('beforeend', actionModal);
}

function markActionDone(projectId, actionId) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    const action = project.actions.find(a => a.id === actionId);
    if (action) {
        action.status = 'Done';
        saveData();
        showProjectDetailModal(projectId);
        showToast('Action marked as done');
    }
}

function toggleActionBlocked(projectId, actionId) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    const action = project.actions.find(a => a.id === actionId);
    if (!action) return;

    if (action.status === 'Blocked') {
        action.status = 'Open';
        action.blockerNote = '';
        saveData();
        showProjectDetailModal(projectId);
        showToast('Action unblocked');
    } else {
        const note = prompt('Enter blocker description:');
        if (note !== null) {
            action.status = 'Blocked';
            action.blockerNote = note;
            saveData();
            showProjectDetailModal(projectId);
            showToast('Action marked as blocked');
        }
    }
}

function deleteAction(projectId, actionId) {
    if (!confirmDialog('Delete this action?')) return;

    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    const index = project.actions.findIndex(a => a.id === actionId);
    if (index > -1) {
        project.actions.splice(index, 1);
        saveData();
        showProjectDetailModal(projectId);
        showToast('Action deleted');
    }
}

function saveProjectNotes(projectId) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    project.notes = document.getElementById('project-notes').value;
    saveData();
    showToast('Notes saved');
}

function markProjectUpdated(projectId) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    project.lastUpdated = formatDate(new Date());
    project.nextUpdateDate = formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    saveData();
    showProjectDetailModal(projectId);
    showToast('Project marked as updated');
}

function updateProjectStatus(projectId) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    const statusModal = `
        <div class="modal-overlay" style="z-index: 1100;">
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>Update Status & Health</h2>
                    <button class="modal-close" onclick="closeSecondaryModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Status</label>
                        <select id="project-status-update" class="form-control">
                            <option value="New" ${project.status === 'New' ? 'selected' : ''}>New</option>
                            <option value="Define" ${project.status === 'Define' ? 'selected' : ''}>Define</option>
                            <option value="Measure" ${project.status === 'Measure' ? 'selected' : ''}>Measure</option>
                            <option value="Analyze" ${project.status === 'Analyze' ? 'selected' : ''}>Analyze</option>
                            <option value="Improve" ${project.status === 'Improve' ? 'selected' : ''}>Improve</option>
                            <option value="Control" ${project.status === 'Control' ? 'selected' : ''}>Control</option>
                            <option value="Closed" ${project.status === 'Closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Health</label>
                        <select id="project-health-update" class="form-control">
                            <option value="On Track" ${project.health === 'On Track' ? 'selected' : ''}>On Track</option>
                            <option value="At Risk" ${project.health === 'At Risk' ? 'selected' : ''}>At Risk</option>
                            <option value="Off Track" ${project.health === 'Off Track' ? 'selected' : ''}>Off Track</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeSecondaryModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveProjectStatusUpdate('${projectId}')">Update</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').insertAdjacentHTML('beforeend', statusModal);
}

function saveProjectStatusUpdate(projectId) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    project.status = document.getElementById('project-status-update').value;
    project.health = document.getElementById('project-health-update').value;
    project.lastUpdated = formatDate(new Date());

    saveData();
    closeSecondaryModal();
    showProjectDetailModal(projectId);
    showToast('Status and health updated');
}

function editProject(projectId) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    const kpiOptions = app.data.kpis.map(kpi =>
        `<option value="${kpi.id}" ${project.impactedKPIs.includes(kpi.id) ? 'selected' : ''}>${kpi.name}</option>`
    ).join('');

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Edit Project</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="project-form">
                        <div class="form-group">
                            <label>Project Title *</label>
                            <input type="text" id="project-title" class="form-control" value="${project.title}" required>
                        </div>
                        <div class="form-group">
                            <label>Area *</label>
                            <select id="project-area" class="form-control" required>
                                <option value="Planning" ${project.area === 'Planning' ? 'selected' : ''}>Planning</option>
                                <option value="Buying" ${project.area === 'Buying' ? 'selected' : ''}>Buying</option>
                                <option value="Receiving" ${project.area === 'Receiving' ? 'selected' : ''}>Receiving</option>
                                <option value="Warehouse" ${project.area === 'Warehouse' ? 'selected' : ''}>Warehouse</option>
                                <option value="Logistics" ${project.area === 'Logistics' ? 'selected' : ''}>Logistics</option>
                                <option value="Supplier Quality" ${project.area === 'Supplier Quality' ? 'selected' : ''}>Supplier Quality</option>
                                <option value="Scheduling" ${project.area === 'Scheduling' ? 'selected' : ''}>Scheduling</option>
                                <option value="Other" ${project.area === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Problem Statement *</label>
                            <textarea id="project-problem" class="form-control" required>${project.problemStatement}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Impacted KPIs</label>
                            <select id="project-kpis" class="form-control" multiple size="4">
                                ${kpiOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Owner *</label>
                            <input type="text" id="project-owner" class="form-control" value="${project.owner}" required>
                        </div>
                        <div class="form-group">
                            <label>Stakeholders</label>
                            <input type="text" id="project-stakeholders" class="form-control" value="${project.stakeholders}">
                        </div>
                        <div class="form-group">
                            <label>Due Date *</label>
                            <input type="date" id="project-due" class="form-control" value="${project.dueDate}" required>
                        </div>
                        <div class="form-group">
                            <label>Priority *</label>
                            <select id="project-priority" class="form-control" required>
                                <option value="High" ${project.priority === 'High' ? 'selected' : ''}>High</option>
                                <option value="Med" ${project.priority === 'Med' ? 'selected' : ''}>Med</option>
                                <option value="Low" ${project.priority === 'Low' ? 'selected' : ''}>Low</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Expected Impact</label>
                            <textarea id="project-expected-impact" class="form-control">${project.expectedImpact}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Actual Impact</label>
                            <textarea id="project-actual-impact" class="form-control">${project.actualImpact}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="updateProject('${projectId}')">Update Project</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function updateProject(projectId) {
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    project.title = document.getElementById('project-title').value;
    project.area = document.getElementById('project-area').value;
    project.problemStatement = document.getElementById('project-problem').value;
    project.owner = document.getElementById('project-owner').value;
    project.stakeholders = document.getElementById('project-stakeholders').value;
    project.dueDate = document.getElementById('project-due').value;
    project.priority = document.getElementById('project-priority').value;
    project.expectedImpact = document.getElementById('project-expected-impact').value;
    project.actualImpact = document.getElementById('project-actual-impact').value;

    const kpiSelect = document.getElementById('project-kpis');
    project.impactedKPIs = Array.from(kpiSelect.selectedOptions).map(opt => opt.value);

    saveData();
    closeModal();
    renderProjects();
    showToast('Project updated successfully');
}

function deleteProject(projectId) {
    if (!confirmDialog('Are you sure you want to delete this project? This will also delete associated DMAIC records.')) {
        return;
    }

    const projectIndex = app.data.projects.findIndex(p => p.id === projectId);
    if (projectIndex > -1) {
        app.data.projects.splice(projectIndex, 1);

        const dmaicIndex = app.data.dmaicRecords.findIndex(d => d.projectId === projectId);
        if (dmaicIndex > -1) {
            app.data.dmaicRecords.splice(dmaicIndex, 1);
        }

        saveData();
        closeModal();
        renderProjects();
        showToast('Project deleted successfully');
    }
}

function closeSecondaryModal() {
    const modals = document.querySelectorAll('.modal-overlay');
    if (modals.length > 1) {
        modals[modals.length - 1].remove();
    }
}

window.addProjectAction = addProjectAction;
window.saveProjectAction = saveProjectAction;
window.editAction = editAction;
window.markActionDone = markActionDone;
window.toggleActionBlocked = toggleActionBlocked;
window.deleteAction = deleteAction;
window.saveProjectNotes = saveProjectNotes;
window.markProjectUpdated = markProjectUpdated;
window.updateProjectStatus = updateProjectStatus;
window.saveProjectStatusUpdate = saveProjectStatusUpdate;
window.createProject = createProject;
window.editProject = editProject;
window.updateProject = updateProject;
window.deleteProject = deleteProject;
window.closeSecondaryModal = closeSecondaryModal;

/* =========================
   app.js — PART 5/6
   ========================= */

// DMAIC Page Rendering
function renderDMAIC() {
    const select = document.getElementById('dmaic-project-select');
    if (!select) return;

    const projects = app.data.projects.filter(p => p.status !== 'Closed');
    select.innerHTML = '<option value="">Select a project...</option>' +
        projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('');

    if (app.currentProjectId) {
        select.value = app.currentProjectId;
        loadDMAICForProject();
    } else {
        document.getElementById('dmaic-tab-content').innerHTML = '<p class="empty-state">Select a project to view or edit DMAIC details</p>';
    }
}

function loadDMAICForProject() {
    const select = document.getElementById('dmaic-project-select');
    const projectId = select.value;

    if (!projectId) {
        document.getElementById('dmaic-tab-content').innerHTML = '<p class="empty-state">Select a project to view or edit DMAIC details</p>';
        return;
    }

    app.currentProjectId = projectId;
    const project = app.data.projects.find(p => p.id === projectId);
    if (!project) return;

    let dmaic = app.data.dmaicRecords.find(d => d.projectId === projectId);
    if (!dmaic) {
        dmaic = {
            id: generateId(),
            projectId: projectId,
            define: { scopeIn: '', scopeOut: '', goal: '', customers: '', constraints: '' },
            measure: { baselineMetrics: '', dataSources: '', measurementPlan: '' },
            analyze: { rootCauses: '', fishboneNotes: '', paretoNotes: '' },
            improve: { countermeasures: '', pilotPlan: '', implementationPlan: '', riskAssessment: '' },
            control: { controlPlan: '', standardWork: '', auditCadence: '', owners: '', sustainmentChecks: '' },
            attachments: []
        };
        app.data.dmaicRecords.push(dmaic);
        saveData();
    }

    app.currentDMAIC = dmaic;
    switchDMAICTab(app.currentDMAICTab);
}

function switchDMAICTab(tab) {
    app.currentDMAICTab = tab;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

    const container = document.getElementById('dmaic-tab-content');
    if (!container || !app.currentDMAIC) return;

    const dmaic = app.currentDMAIC;

    switch (tab) {
        case 'define':
            container.innerHTML = `
                <div class="dmaic-field-group">
                    <label>Scope In</label>
                    <textarea id="dmaic-scopeIn" class="form-control">${dmaic.define.scopeIn}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Scope Out</label>
                    <textarea id="dmaic-scopeOut" class="form-control">${dmaic.define.scopeOut}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Goal</label>
                    <textarea id="dmaic-goal" class="form-control">${dmaic.define.goal}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Customers</label>
                    <textarea id="dmaic-customers" class="form-control">${dmaic.define.customers}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Constraints</label>
                    <textarea id="dmaic-constraints" class="form-control">${dmaic.define.constraints}</textarea>
                </div>
            `;
            break;

        case 'measure':
            container.innerHTML = `
                <div class="dmaic-field-group">
                    <label>Baseline Metrics</label>
                    <textarea id="dmaic-baselineMetrics" class="form-control">${dmaic.measure.baselineMetrics}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Data Sources</label>
                    <textarea id="dmaic-dataSources" class="form-control">${dmaic.measure.dataSources}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Measurement Plan</label>
                    <textarea id="dmaic-measurementPlan" class="form-control">${dmaic.measure.measurementPlan}</textarea>
                </div>
            `;
            break;

        case 'analyze':
            container.innerHTML = `
                <div class="dmaic-field-group">
                    <label>Root Causes</label>
                    <textarea id="dmaic-rootCauses" class="form-control">${dmaic.analyze.rootCauses}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Fishbone Analysis Notes</label>
                    <textarea id="dmaic-fishboneNotes" class="form-control">${dmaic.analyze.fishboneNotes}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Pareto Analysis Notes</label>
                    <textarea id="dmaic-paretoNotes" class="form-control">${dmaic.analyze.paretoNotes}</textarea>
                </div>
            `;
            break;

        case 'improve':
            container.innerHTML = `
                <div class="dmaic-field-group">
                    <label>Countermeasures</label>
                    <textarea id="dmaic-countermeasures" class="form-control">${dmaic.improve.countermeasures}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Pilot Plan</label>
                    <textarea id="dmaic-pilotPlan" class="form-control">${dmaic.improve.pilotPlan}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Implementation Plan</label>
                    <textarea id="dmaic-implementationPlan" class="form-control">${dmaic.improve.implementationPlan}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Risk Assessment</label>
                    <textarea id="dmaic-riskAssessment" class="form-control">${dmaic.improve.riskAssessment}</textarea>
                </div>
            `;
            break;

        case 'control':
            container.innerHTML = `
                <div class="dmaic-field-group">
                    <label>Control Plan</label>
                    <textarea id="dmaic-controlPlan" class="form-control">${dmaic.control.controlPlan}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Standard Work</label>
                    <textarea id="dmaic-standardWork" class="form-control">${dmaic.control.standardWork}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Audit Cadence</label>
                    <textarea id="dmaic-auditCadence" class="form-control">${dmaic.control.auditCadence}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Owners</label>
                    <textarea id="dmaic-owners" class="form-control">${dmaic.control.owners}</textarea>
                </div>
                <div class="dmaic-field-group">
                    <label>Sustainment Checks</label>
                    <textarea id="dmaic-sustainmentChecks" class="form-control">${dmaic.control.sustainmentChecks}</textarea>
                </div>
            `;
            break;
    }
}

function saveDMAIC() {
    if (!app.currentDMAIC) {
        showToast('No DMAIC record selected', 'error');
        return;
    }

    const dmaic = app.currentDMAIC;
    const tab = app.currentDMAICTab;

    switch (tab) {
        case 'define':
            dmaic.define.scopeIn = document.getElementById('dmaic-scopeIn')?.value || '';
            dmaic.define.scopeOut = document.getElementById('dmaic-scopeOut')?.value || '';
            dmaic.define.goal = document.getElementById('dmaic-goal')?.value || '';
            dmaic.define.customers = document.getElementById('dmaic-customers')?.value || '';
            dmaic.define.constraints = document.getElementById('dmaic-constraints')?.value || '';
            break;
        case 'measure':
            dmaic.measure.baselineMetrics = document.getElementById('dmaic-baselineMetrics')?.value || '';
            dmaic.measure.dataSources = document.getElementById('dmaic-dataSources')?.value || '';
            dmaic.measure.measurementPlan = document.getElementById('dmaic-measurementPlan')?.value || '';
            break;
        case 'analyze':
            dmaic.analyze.rootCauses = document.getElementById('dmaic-rootCauses')?.value || '';
            dmaic.analyze.fishboneNotes = document.getElementById('dmaic-fishboneNotes')?.value || '';
            dmaic.analyze.paretoNotes = document.getElementById('dmaic-paretoNotes')?.value || '';
            break;
        case 'improve':
            dmaic.improve.countermeasures = document.getElementById('dmaic-countermeasures')?.value || '';
            dmaic.improve.pilotPlan = document.getElementById('dmaic-pilotPlan')?.value || '';
            dmaic.improve.implementationPlan = document.getElementById('dmaic-implementationPlan')?.value || '';
            dmaic.improve.riskAssessment = document.getElementById('dmaic-riskAssessment')?.value || '';
            break;
        case 'control':
            dmaic.control.controlPlan = document.getElementById('dmaic-controlPlan')?.value || '';
            dmaic.control.standardWork = document.getElementById('dmaic-standardWork')?.value || '';
            dmaic.control.auditCadence = document.getElementById('dmaic-auditCadence')?.value || '';
            dmaic.control.owners = document.getElementById('dmaic-owners')?.value || '';
            dmaic.control.sustainmentChecks = document.getElementById('dmaic-sustainmentChecks')?.value || '';
            break;
    }

    saveData();
    showToast('DMAIC saved successfully');
}

function generateDMAICSummary() {
    if (!app.currentDMAIC || !app.currentProjectId) {
        showToast('No DMAIC record to summarize', 'error');
        return;
    }

    const project = app.data.projects.find(p => p.id === app.currentProjectId);
    const dmaic = app.currentDMAIC;

    const summary = `
# DMAIC Summary: ${project ? project.title : 'Project'}

## Define
**Scope In:** ${dmaic.define.scopeIn || 'Not specified'}
**Scope Out:** ${dmaic.define.scopeOut || 'Not specified'}
**Goal:** ${dmaic.define.goal || 'Not specified'}
**Customers:** ${dmaic.define.customers || 'Not specified'}
**Constraints:** ${dmaic.define.constraints || 'Not specified'}

## Measure
**Baseline Metrics:** ${dmaic.measure.baselineMetrics || 'Not specified'}
**Data Sources:** ${dmaic.measure.dataSources || 'Not specified'}
**Measurement Plan:** ${dmaic.measure.measurementPlan || 'Not specified'}

## Analyze
**Root Causes:** ${dmaic.analyze.rootCauses || 'Not specified'}
**Fishbone Analysis:** ${dmaic.analyze.fishboneNotes || 'Not specified'}
**Pareto Analysis:** ${dmaic.analyze.paretoNotes || 'Not specified'}

## Improve
**Countermeasures:** ${dmaic.improve.countermeasures || 'Not specified'}
**Pilot Plan:** ${dmaic.improve.pilotPlan || 'Not specified'}
**Implementation Plan:** ${dmaic.improve.implementationPlan || 'Not specified'}
**Risk Assessment:** ${dmaic.improve.riskAssessment || 'Not specified'}

## Control
**Control Plan:** ${dmaic.control.controlPlan || 'Not specified'}
**Standard Work:** ${dmaic.control.standardWork || 'Not specified'}
**Audit Cadence:** ${dmaic.control.auditCadence || 'Not specified'}
**Owners:** ${dmaic.control.owners || 'Not specified'}
**Sustainment Checks:** ${dmaic.control.sustainmentChecks || 'Not specified'}
    `.trim();

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>DMAIC Summary</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <textarea class="form-control" style="min-height: 400px; font-family: monospace; font-size: 12px;" readonly>${summary}</textarea>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="copyDMAICSummary()">Copy to Clipboard</button>
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function copyDMAICSummary() {
    const textarea = document.querySelector('.modal-body textarea');
    if (textarea) {
        textarea.select();
        document.execCommand('copy');
        showToast('Summary copied to clipboard');
    }
}

// AAR Page Rendering
function renderAAR() {
    const container = document.getElementById('aar-list');
    if (!container) return;

    const searchTerm = document.getElementById('aar-search')?.value.toLowerCase() || '';
    const areaFilter = document.getElementById('aar-area-filter')?.value || '';
    const typeFilter = document.getElementById('aar-type-filter')?.value || '';
    const statusFilter = document.getElementById('aar-status-filter')?.value || '';

    let filtered = app.data.aars.filter(aar => {
        const matchesSearch = aar.description.toLowerCase().includes(searchTerm) ||
                            aar.countermeasures.toLowerCase().includes(searchTerm);
        const matchesArea = !areaFilter || aar.area === areaFilter;
        const matchesType = !typeFilter || aar.incidentType === typeFilter;
        const matchesStatus = !statusFilter || aar.status === statusFilter;
        return matchesSearch && matchesArea && matchesType && matchesStatus;
    });

    // Update totals
    const totalCost = filtered.reduce((sum, aar) => sum + (aar.impact.costUSD || 0), 0);
    const totalHours = filtered.reduce((sum, aar) => sum + (aar.impact.timeHours || 0), 0);

    document.getElementById('aar-total-cost').textContent = `$${totalCost.toLocaleString()}`;
    document.getElementById('aar-total-hours').textContent = `${totalHours.toLocaleString()} hrs`;

    const html = filtered.map(aar => {
        const project = aar.relatedProjectId ? app.data.projects.find(p => p.id === aar.relatedProjectId) : null;
        const statusClass = aar.status === 'Closed' ? 'status-closed' : '';

        return `
            <div class="aar-card" data-aar-id="${aar.id}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">${aar.incidentType} - ${aar.date}</div>
                        <div style="color: var(--gray-600); font-size: 13px;">
                            ${aar.area} • ${aar.owner}
                            ${project ? `• Project: ${project.title}` : ''}
                        </div>
                    </div>
                    <span class="status-badge ${statusClass}">${aar.status}</span>
                </div>
                <div style="margin-bottom: 12px; color: var(--gray-700);">
                    ${aar.description}
                </div>
                <div style="display: flex; gap: 24px; font-size: 13px; color: var(--gray-600);">
                    <span>Cost: $${aar.impact.costUSD.toLocaleString()}</span>
                    <span>Time: ${aar.impact.timeHours}hrs</span>
                    <span>Root Cause: ${aar.rootCauseCategory}</span>
                    <span>Due: ${aar.dueDate}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">📝</div>No AARs found</div>';
}

// Create AAR Modal
function showCreateAARModal() {
    const projectOptions = app.data.projects
        .filter(p => p.status !== 'Closed')
        .map(p => `<option value="${p.id}">${p.title}</option>`)
        .join('');

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Create After Action Report</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <form id="aar-form">
                        <div class="form-group">
                            <label>Date *</label>
                            <input type="date" id="aar-date" class="form-control" value="${formatDate(new Date())}" required>
                        </div>
                        <div class="form-group">
                            <label>Area *</label>
                            <select id="aar-area" class="form-control" required>
                                <option value="Planning">Planning</option>
                                <option value="Buying">Buying</option>
                                <option value="Receiving">Receiving</option>
                                <option value="Warehouse">Warehouse</option>
                                <option value="Logistics">Logistics</option>
                                <option value="Supplier Quality">Supplier Quality</option>
                                <option value="Scheduling">Scheduling</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Incident Type *</label>
                            <select id="aar-type" class="form-control" required>
                                <option value="Expedite">Expedite</option>
                                <option value="Shortage">Shortage</option>
                                <option value="Line stop">Line stop</option>
                                <option value="Late supplier">Late supplier</option>
                                <option value="Quality hold">Quality hold</option>
                                <option value="Inventory error">Inventory error</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Description *</label>
                            <textarea id="aar-description" class="form-control" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Related Project (optional)</label>
                            <select id="aar-project" class="form-control">
                                <option value="">None</option>
                                ${projectOptions}
                            </select>
                        </div>

                        <h3>Impact</h3>
                        <div class="form-group">
                            <label>Cost (USD)</label>
                            <input type="number" id="aar-cost" class="form-control" value="0" min="0">
                        </div>
                        <div class="form-group">
                            <label>Time (Hours)</label>
                            <input type="number" id="aar-hours" class="form-control" value="0" min="0">
                        </div>
                        <div class="form-group">
                            <label>Units Affected</label>
                            <input type="number" id="aar-units" class="form-control" value="0" min="0">
                        </div>
                        <div class="form-group">
                            <label>Impact Notes</label>
                            <textarea id="aar-impact-notes" class="form-control"></textarea>
                        </div>

                        <h3>Root Cause Analysis</h3>
                        <div class="form-group">
                            <label>Root Cause Category *</label>
                            <select id="aar-root-category" class="form-control" required>
                                <option value="Forecast/Demand change">Forecast/Demand change</option>
                                <option value="Planning parameters">Planning parameters</option>
                                <option value="Supplier late/short">Supplier late/short</option>
                                <option value="Internal execution">Internal execution</option>
                                <option value="Quality">Quality</option>
                                <option value="Engineering/BOM">Engineering/BOM</option>
                                <option value="Logistics/Carrier">Logistics/Carrier</option>
                                <option value="System/ERP">System/ERP</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Why 1 *</label>
                            <input type="text" id="aar-why1" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Why 2 *</label>
                            <input type="text" id="aar-why2" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Why 3 *</label>
                            <input type="text" id="aar-why3" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Why 4</label>
                            <input type="text" id="aar-why4" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Why 5</label>
                            <input type="text" id="aar-why5" class="form-control">
                        </div>

                        <h3>Countermeasures</h3>
                        <div class="form-group">
                            <label>Countermeasures *</label>
                            <textarea id="aar-countermeasures" class="form-control" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Prevention / Standard Work</label>
                            <textarea id="aar-prevention" class="form-control"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Lessons Learned</label>
                            <textarea id="aar-lessons" class="form-control"></textarea>
                        </div>

                        <div class="form-group">
                            <label>Owner *</label>
                            <input type="text" id="aar-owner" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Due Date *</label>
                            <input type="date" id="aar-due" class="form-control" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="createAAR()">Create AAR</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function createAAR() {
    const date = document.getElementById('aar-date').value;
    const area = document.getElementById('aar-area').value;
    const incidentType = document.getElementById('aar-type').value;
    const description = document.getElementById('aar-description').value;
    const relatedProjectId = document.getElementById('aar-project').value;
    const costUSD = parseFloat(document.getElementById('aar-cost').value) || 0;
    const timeHours = parseFloat(document.getElementById('aar-hours').value) || 0;
    const units = parseFloat(document.getElementById('aar-units').value) || 0;
    const impactNotes = document.getElementById('aar-impact-notes').value;
    const rootCauseCategory = document.getElementById('aar-root-category').value;
    const why1 = document.getElementById('aar-why1').value;
    const why2 = document.getElementById('aar-why2').value;
    const why3 = document.getElementById('aar-why3').value;
    const why4 = document.getElementById('aar-why4').value;
    const why5 = document.getElementById('aar-why5').value;
    const countermeasures = document.getElementById('aar-countermeasures').value;
    const preventionStandardWork = document.getElementById('aar-prevention').value;
    const lessonsLearned = document.getElementById('aar-lessons').value;
    const owner = document.getElementById('aar-owner').value;
    const dueDate = document.getElementById('aar-due').value;

    if (!date || !area || !incidentType || !description || !rootCauseCategory || !why1 || !why2 || !why3 || !countermeasures || !owner || !dueDate) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const aar = {
        id: generateId(),
        date,
        relatedProjectId,
        area,
        incidentType,
        description,
        impact: {
            costUSD,
            timeHours,
            units,
            notes: impactNotes
        },
        rootCauseCategory,
        why1,
        why2,
        why3,
        why4,
        why5,
        countermeasures,
        preventionStandardWork,
        owner,
        dueDate,
        status: 'Open',
        lessonsLearned
    };

    app.data.aars.push(aar);
    saveData();
    closeModal();
    renderAAR();
    showToast('AAR created successfully');
}

// AAR Detail Modal
function showAARDetailModal(aarId) {
    const aar = app.data.aars.find(a => a.id === aarId);
    if (!aar) return;

    const project = aar.relatedProjectId ? app.data.projects.find(p => p.id === aar.relatedProjectId) : null;

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>AAR: ${aar.incidentType} - ${aar.date}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <div style="margin-bottom: 20px;">
                        <span class="status-badge ${aar.status === 'Closed' ? 'status-closed' : ''}">${aar.status}</span>
                    </div>

                    <div class="form-group">
                        <label>Area:</label>
                        <p>${aar.area}</p>
                    </div>
                    <div class="form-group">
                        <label>Incident Type:</label>
                        <p>${aar.incidentType}</p>
                    </div>
                    <div class="form-group">
                        <label>Description:</label>
                        <p>${aar.description}</p>
                    </div>
                    ${project ? `<div class="form-group"><label>Related Project:</label><p>${project.title}</p></div>` : ''}

                    <h3>Impact</h3>
                    <div class="form-group">
                        <label>Cost:</label>
                        <p>$${aar.impact.costUSD.toLocaleString()}</p>
                    </div>
                    <div class="form-group">
                        <label>Time:</label>
                        <p>${aar.impact.timeHours} hours</p>
                    </div>
                    <div class="form-group">
                        <label>Units:</label>
                        <p>${aar.impact.units}</p>
                    </div>
                    <div class="form-group">
                        <label>Notes:</label>
                        <p>${aar.impact.notes}</p>
                    </div>

                    <h3>5 Whys Analysis</h3>
                    <div class="form-group">
                        <label>Root Cause Category:</label>
                        <p>${aar.rootCauseCategory}</p>
                    </div>
                    <div class="form-group">
                        <label>Why 1:</label>
                        <p>${aar.why1}</p>
                    </div>
                    <div class="form-group">
                        <label>Why 2:</label>
                        <p>${aar.why2}</p>
                    </div>
                    <div class="form-group">
                        <label>Why 3:</label>
                        <p>${aar.why3}</p>
                    </div>
                    ${aar.why4 ? `<div class="form-group"><label>Why 4:</label><p>${aar.why4}</p></div>` : ''}
                    ${aar.why5 ? `<div class="form-group"><label>Why 5:</label><p>${aar.why5}</p></div>` : ''}

                    <h3>Countermeasures</h3>
                    <div class="form-group">
                        <label>Countermeasures:</label>
                        <p>${aar.countermeasures}</p>
                    </div>
                    <div class="form-group">
                        <label>Prevention / Standard Work:</label>
                        <p>${aar.preventionStandardWork}</p>
                    </div>
                    <div class="form-group">
                        <label>Lessons Learned:</label>
                        <p>${aar.lessonsLearned}</p>
                    </div>

                    <div class="form-group">
                        <label>Owner:</label>
                        <p>${aar.owner}</p>
                    </div>
                    <div class="form-group">
                        <label>Due Date:</label>
                        <p>${aar.dueDate}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    ${aar.status === 'Open' ? `<button class="btn btn-success" onclick="closeAAR('${aarId}')">Close AAR</button>` : ''}
                    <button class="btn btn-secondary" onclick="editAAR('${aarId}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteAAR('${aarId}')">Delete</button>
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function editAAR(aarId) {
    const aar = app.data.aars.find(a => a.id === aarId);
    if (!aar) return;

    const projectOptions = app.data.projects
        .filter(p => p.status !== 'Closed')
        .map(p => `<option value="${p.id}" ${aar.relatedProjectId === p.id ? 'selected' : ''}>${p.title}</option>`)
        .join('');

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Edit After Action Report</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <form id="aar-form">
                        <div class="form-group">
                            <label>Date *</label>
                            <input type="date" id="aar-date" class="form-control" value="${aar.date}" required>
                        </div>
                        <div class="form-group">
                            <label>Area *</label>
                            <select id="aar-area" class="form-control" required>
                                <option value="Planning" ${aar.area === 'Planning' ? 'selected' : ''}>Planning</option>
                                <option value="Buying" ${aar.area === 'Buying' ? 'selected' : ''}>Buying</option>
                                <option value="Receiving" ${aar.area === 'Receiving' ? 'selected' : ''}>Receiving</option>
                                <option value="Warehouse" ${aar.area === 'Warehouse' ? 'selected' : ''}>Warehouse</option>
                                <option value="Logistics" ${aar.area === 'Logistics' ? 'selected' : ''}>Logistics</option>
                                <option value="Supplier Quality" ${aar.area === 'Supplier Quality' ? 'selected' : ''}>Supplier Quality</option>
                                <option value="Scheduling" ${aar.area === 'Scheduling' ? 'selected' : ''}>Scheduling</option>
                                <option value="Other" ${aar.area === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Incident Type *</label>
                            <select id="aar-type" class="form-control" required>
                                <option value="Expedite" ${aar.incidentType === 'Expedite' ? 'selected' : ''}>Expedite</option>
                                <option value="Shortage" ${aar.incidentType === 'Shortage' ? 'selected' : ''}>Shortage</option>
                                <option value="Line stop" ${aar.incidentType === 'Line stop' ? 'selected' : ''}>Line stop</option>
                                <option value="Late supplier" ${aar.incidentType === 'Late supplier' ? 'selected' : ''}>Late supplier</option>
                                <option value="Quality hold" ${aar.incidentType === 'Quality hold' ? 'selected' : ''}>Quality hold</option>
                                <option value="Inventory error" ${aar.incidentType === 'Inventory error' ? 'selected' : ''}>Inventory error</option>
                                <option value="Other" ${aar.incidentType === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Description *</label>
                            <textarea id="aar-description" class="form-control" required>${aar.description}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Related Project (optional)</label>
                            <select id="aar-project" class="form-control">
                                <option value="">None</option>
                                ${projectOptions}
                            </select>
                        </div>

                        <h3>Impact</h3>
                        <div class="form-group">
                            <label>Cost (USD)</label>
                            <input type="number" id="aar-cost" class="form-control" value="${aar.impact.costUSD}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Time (Hours)</label>
                            <input type="number" id="aar-hours" class="form-control" value="${aar.impact.timeHours}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Units Affected</label>
                            <input type="number" id="aar-units" class="form-control" value="${aar.impact.units}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Impact Notes</label>
                            <textarea id="aar-impact-notes" class="form-control">${aar.impact.notes}</textarea>
                        </div>

                        <h3>Root Cause Analysis</h3>
                        <div class="form-group">
                            <label>Root Cause Category *</label>
                            <select id="aar-root-category" class="form-control" required>
                                <option value="Forecast/Demand change" ${aar.rootCauseCategory === 'Forecast/Demand change' ? 'selected' : ''}>Forecast/Demand change</option>
                                <option value="Planning parameters" ${aar.rootCauseCategory === 'Planning parameters' ? 'selected' : ''}>Planning parameters</option>
                                <option value="Supplier late/short" ${aar.rootCauseCategory === 'Supplier late/short' ? 'selected' : ''}>Supplier late/short</option>
                                <option value="Internal execution" ${aar.rootCauseCategory === 'Internal execution' ? 'selected' : ''}>Internal execution</option>
                                <option value="Quality" ${aar.rootCauseCategory === 'Quality' ? 'selected' : ''}>Quality</option>
                                <option value="Engineering/BOM" ${aar.rootCauseCategory === 'Engineering/BOM' ? 'selected' : ''}>Engineering/BOM</option>
                                <option value="Logistics/Carrier" ${aar.rootCauseCategory === 'Logistics/Carrier' ? 'selected' : ''}>Logistics/Carrier</option>
                                <option value="System/ERP" ${aar.rootCauseCategory === 'System/ERP' ? 'selected' : ''}>System/ERP</option>
                                <option value="Other" ${aar.rootCauseCategory === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Why 1 *</label>
                            <input type="text" id="aar-why1" class="form-control" value="${aar.why1}" required>
                        </div>
                        <div class="form-group">
                            <label>Why 2 *</label>
                            <input type="text" id="aar-why2" class="form-control" value="${aar.why2}" required>
                        </div>
                        <div class="form-group">
                            <label>Why 3 *</label>
                            <input type="text" id="aar-why3" class="form-control" value="${aar.why3}" required>
                        </div>
                        <div class="form-group">
                            <label>Why 4</label>
                            <input type="text" id="aar-why4" class="form-control" value="${aar.why4 || ''}">
                        </div>
                        <div class="form-group">
                            <label>Why 5</label>
                            <input type="text" id="aar-why5" class="form-control" value="${aar.why5 || ''}">
                        </div>

                        <h3>Countermeasures</h3>
                        <div class="form-group">
                            <label>Countermeasures *</label>
                            <textarea id="aar-countermeasures" class="form-control" required>${aar.countermeasures}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Prevention / Standard Work</label>
                            <textarea id="aar-prevention" class="form-control">${aar.preventionStandardWork}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Lessons Learned</label>
                            <textarea id="aar-lessons" class="form-control">${aar.lessonsLearned}</textarea>
                        </div>

                        <div class="form-group">
                            <label>Owner *</label>
                            <input type="text" id="aar-owner" class="form-control" value="${aar.owner}" required>
                        </div>
                        <div class="form-group">
                            <label>Due Date *</label>
                            <input type="date" id="aar-due" class="form-control" value="${aar.dueDate}" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="updateAAR('${aarId}')">Update AAR</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function updateAAR(aarId) {
    const aar = app.data.aars.find(a => a.id === aarId);
    if (!aar) return;

    aar.date = document.getElementById('aar-date').value;
    aar.area = document.getElementById('aar-area').value;
    aar.incidentType = document.getElementById('aar-type').value;
    aar.description = document.getElementById('aar-description').value;
    aar.relatedProjectId = document.getElementById('aar-project').value;
    aar.impact.costUSD = parseFloat(document.getElementById('aar-cost').value) || 0;
    aar.impact.timeHours = parseFloat(document.getElementById('aar-hours').value) || 0;
    aar.impact.units = parseFloat(document.getElementById('aar-units').value) || 0;
    aar.impact.notes = document.getElementById('aar-impact-notes').value;
    aar.rootCauseCategory = document.getElementById('aar-root-category').value;
    aar.why1 = document.getElementById('aar-why1').value;
    aar.why2 = document.getElementById('aar-why2').value;
    aar.why3 = document.getElementById('aar-why3').value;
    aar.why4 = document.getElementById('aar-why4').value;
    aar.why5 = document.getElementById('aar-why5').value;
    aar.countermeasures = document.getElementById('aar-countermeasures').value;
    aar.preventionStandardWork = document.getElementById('aar-prevention').value;
    aar.lessonsLearned = document.getElementById('aar-lessons').value;
    aar.owner = document.getElementById('aar-owner').value;
    aar.dueDate = document.getElementById('aar-due').value;

    saveData();
    closeModal();
    renderAAR();
    showToast('AAR updated successfully');
}

function closeAAR(aarId) {
    if (!confirmDialog('Mark this AAR as closed?')) return;

    const aar = app.data.aars.find(a => a.id === aarId);
    if (aar) {
        aar.status = 'Closed';
        saveData();
        closeModal();
        renderAAR();
        showToast('AAR closed successfully');
    }
}

function deleteAAR(aarId) {
    if (!confirmDialog('Are you sure you want to delete this AAR?')) return;

    const index = app.data.aars.findIndex(a => a.id === aarId);
    if (index > -1) {
        app.data.aars.splice(index, 1);
        saveData();
        closeModal();
        renderAAR();
        showToast('AAR deleted successfully');
    }
}

window.copyDMAICSummary = copyDMAICSummary;
window.createAAR = createAAR;
window.editAAR = editAAR;
window.updateAAR = updateAAR;
window.closeAAR = closeAAR;
window.deleteAAR = deleteAAR;

/* =========================
   app.js — PART 6/6
   ========================= */

// Process Library Rendering
function renderProcessLibrary() {
    const container = document.getElementById('process-list');
    if (!container) return;

    const searchTerm = document.getElementById('process-search')?.value.toLowerCase() || '';
    const areaFilter = document.getElementById('process-area-filter')?.value || '';

    let filtered = app.data.processDocs.filter(proc => {
        const matchesSearch = proc.name.toLowerCase().includes(searchTerm) ||
                            proc.purpose.toLowerCase().includes(searchTerm);
        const matchesArea = !areaFilter || proc.area === areaFilter;
        return matchesSearch && matchesArea;
    });

    const today = new Date();
    const html = filtered.map(proc => {
        const lastReviewed = parseDate(proc.lastReviewedDate);
        const daysSinceReview = getDaysDifference(today, lastReviewed);
        const needsReview = daysSinceReview > 90;

        return `
            <div class="process-card" data-process-id="${proc.id}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">
                            ${proc.name}
                            ${needsReview ? '<span class="process-warning">Review Overdue</span>' : ''}
                        </div>
                        <div style="color: var(--gray-600); font-size: 13px;">
                            ${proc.area} • Owner: ${proc.owner}
                        </div>
                    </div>
                </div>
                <div style="margin-bottom: 12px; color: var(--gray-700); font-size: 13px;">
                    ${proc.purpose}
                </div>
                <div style="font-size: 13px; color: var(--gray-600);">
                    Last reviewed: ${proc.lastReviewedDate} (${daysSinceReview} days ago)
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">📚</div>No process docs found</div>';
}

// Create Process Modal
function showCreateProcessModal() {
    const kpiOptions = app.data.kpis.map(kpi =>
        `<option value="${kpi.id}">${kpi.name}</option>`
    ).join('');

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Add Process Document</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <form id="process-form">
                        <div class="form-group">
                            <label>Process Name *</label>
                            <input type="text" id="process-name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Area *</label>
                            <select id="process-area" class="form-control" required>
                                <option value="Planning">Planning</option>
                                <option value="Buying">Buying</option>
                                <option value="Receiving">Receiving</option>
                                <option value="Warehouse">Warehouse</option>
                                <option value="Logistics">Logistics</option>
                                <option value="Supplier Quality">Supplier Quality</option>
                                <option value="Scheduling">Scheduling</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Purpose *</label>
                            <textarea id="process-purpose" class="form-control" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Inputs</label>
                            <textarea id="process-inputs" class="form-control"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Outputs</label>
                            <textarea id="process-outputs" class="form-control"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Upstream Partners</label>
                            <textarea id="process-upstream" class="form-control"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Downstream Partners</label>
                            <textarea id="process-downstream" class="form-control"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Linked KPIs</label>
                            <select id="process-kpis" class="form-control" multiple size="4">
                                ${kpiOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Owner *</label>
                            <input type="text" id="process-owner" class="form-control" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="createProcess()">Create Process</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function createProcess() {
    const name = document.getElementById('process-name').value;
    const area = document.getElementById('process-area').value;
    const purpose = document.getElementById('process-purpose').value;
    const inputs = document.getElementById('process-inputs').value;
    const outputs = document.getElementById('process-outputs').value;
    const upstreamPartners = document.getElementById('process-upstream').value;
    const downstreamPartners = document.getElementById('process-downstream').value;
    const owner = document.getElementById('process-owner').value;

    const kpiSelect = document.getElementById('process-kpis');
    const metrics = Array.from(kpiSelect.selectedOptions).map(opt => opt.value);

    if (!name || !area || !purpose || !owner) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const process = {
        id: generateId(),
        name,
        area,
        purpose,
        inputs,
        outputs,
        upstreamPartners,
        downstreamPartners,
        steps: [],
        metrics,
        failureModes: [],
        standardWorkLinks: [],
        lastReviewedDate: formatDate(new Date()),
        owner
    };

    app.data.processDocs.push(process);
    saveData();
    closeModal();
    renderProcessLibrary();
    showToast('Process created successfully');
}

// Process Detail Modal
function showProcessDetailModal(processId) {
    const proc = app.data.processDocs.find(p => p.id === processId);
    if (!proc) return;

    const lastReviewed = parseDate(proc.lastReviewedDate);
    const daysSinceReview = getDaysDifference(new Date(), lastReviewed);
    const needsReview = daysSinceReview > 90;

    const linkedKPIs = proc.metrics
        .map(kpiId => app.data.kpis.find(k => k.id === kpiId)?.name)
        .filter(Boolean)
        .join(', ') || 'None';

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>${proc.name}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    ${needsReview ? '<div style="padding: 12px; background: #fed7aa; color: #9a3412; border-radius: 6px; margin-bottom: 16px;">⚠ This process has not been reviewed in over 90 days</div>' : ''}

                    <div class="form-group">
                        <label>Area:</label>
                        <p>${proc.area}</p>
                    </div>
                    <div class="form-group">
                        <label>Purpose:</label>
                        <p>${proc.purpose}</p>
                    </div>
                    <div class="form-group">
                        <label>Inputs:</label>
                        <p>${proc.inputs || 'Not specified'}</p>
                    </div>
                    <div class="form-group">
                        <label>Outputs:</label>
                        <p>${proc.outputs || 'Not specified'}</p>
                    </div>
                    <div class="form-group">
                        <label>Upstream Partners:</label>
                        <p>${proc.upstreamPartners || 'Not specified'}</p>
                    </div>
                    <div class="form-group">
                        <label>Downstream Partners:</label>
                        <p>${proc.downstreamPartners || 'Not specified'}</p>
                    </div>
                    <div class="form-group">
                        <label>Linked KPIs:</label>
                        <p>${linkedKPIs}</p>
                    </div>

                    <h3>Process Steps</h3>
                    <div id="process-steps-list">
                        ${renderProcessSteps(proc)}
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="addProcessStep('${processId}')">+ Add Step</button>

                    <h3>Failure Modes</h3>
                    <div id="process-failures-list">
                        ${renderProcessFailures(proc)}
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="addProcessFailure('${processId}')">+ Add Failure Mode</button>

                    <div class="form-group" style="margin-top: 20px;">
                        <label>Owner:</label>
                        <p>${proc.owner}</p>
                    </div>
                    <div class="form-group">
                        <label>Last Reviewed:</label>
                        <p>${proc.lastReviewedDate} (${daysSinceReview} days ago)</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="markProcessReviewed('${processId}')">Mark Reviewed Today</button>
                    <button class="btn btn-secondary" onclick="editProcess('${processId}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteProcess('${processId}')">Delete</button>
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function renderProcessSteps(proc) {
    if (proc.steps.length === 0) {
        return '<p style="color: var(--gray-400);">No steps defined</p>';
    }

    return proc.steps.map((step, index) => `
        <div style="display: flex; gap: 8px; align-items: center; padding: 8px; background: var(--gray-50); border-radius: 6px; margin-bottom: 8px;">
            <span style="font-weight: 600; color: var(--gray-600);">${index + 1}.</span>
            <span style="flex: 1;">${step}</span>
            <div style="display: flex; gap: 4px;">
                ${index > 0 ? `<button class="btn btn-secondary btn-small" onclick="moveStepUp('${proc.id}', ${index})">↑</button>` : ''}
                ${index < proc.steps.length - 1 ? `<button class="btn btn-secondary btn-small" onclick="moveStepDown('${proc.id}', ${index})">↓</button>` : ''}
                <button class="btn btn-danger btn-small" onclick="deleteProcessStep('${proc.id}', ${index})">×</button>
            </div>
        </div>
    `).join('');
}

function renderProcessFailures(proc) {
    if (proc.failureModes.length === 0) {
        return '<p style="color: var(--gray-400);">No failure modes defined</p>';
    }

    return proc.failureModes.map((failure, index) => `
        <div style="display: flex; gap: 8px; align-items: center; padding: 8px; background: var(--gray-50); border-radius: 6px; margin-bottom: 8px;">
            <span style="flex: 1;">${failure}</span>
            <button class="btn btn-danger btn-small" onclick="deleteProcessFailure('${proc.id}', ${index})">×</button>
        </div>
    `).join('');
}

function addProcessStep(processId) {
    const step = prompt('Enter process step:');
    if (!step) return;

    const proc = app.data.processDocs.find(p => p.id === processId);
    if (proc) {
        proc.steps.push(step);
        saveData();
        showProcessDetailModal(processId);
        showToast('Step added');
    }
}

function addProcessFailure(processId) {
    const failure = prompt('Enter failure mode:');
    if (!failure) return;

    const proc = app.data.processDocs.find(p => p.id === processId);
    if (proc) {
        proc.failureModes.push(failure);
        saveData();
        showProcessDetailModal(processId);
        showToast('Failure mode added');
    }
}

function moveStepUp(processId, index) {
    const proc = app.data.processDocs.find(p => p.id === processId);
    if (proc && index > 0) {
        [proc.steps[index], proc.steps[index - 1]] = [proc.steps[index - 1], proc.steps[index]];
        saveData();
        showProcessDetailModal(processId);
    }
}

function moveStepDown(processId, index) {
    const proc = app.data.processDocs.find(p => p.id === processId);
    if (proc && index < proc.steps.length - 1) {
        [proc.steps[index], proc.steps[index + 1]] = [proc.steps[index + 1], proc.steps[index]];
        saveData();
        showProcessDetailModal(processId);
    }
}

function deleteProcessStep(processId, index) {
    if (!confirmDialog('Delete this step?')) return;

    const proc = app.data.processDocs.find(p => p.id === processId);
    if (proc) {
        proc.steps.splice(index, 1);
        saveData();
        showProcessDetailModal(processId);
        showToast('Step deleted');
    }
}

function deleteProcessFailure(processId, index) {
    if (!confirmDialog('Delete this failure mode?')) return;

    const proc = app.data.processDocs.find(p => p.id === processId);
    if (proc) {
        proc.failureModes.splice(index, 1);
        saveData();
        showProcessDetailModal(processId);
        showToast('Failure mode deleted');
    }
}

function editProcess(processId) {
    const proc = app.data.processDocs.find(p => p.id === processId);
    if (!proc) return;

    const kpiOptions = app.data.kpis.map(kpi =>
        `<option value="${kpi.id}" ${proc.metrics.includes(kpi.id) ? 'selected' : ''}>${kpi.name}</option>`
    ).join('');

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Edit Process Document</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <form id="process-form">
                        <div class="form-group">
                            <label>Process Name *</label>
                            <input type="text" id="process-name" class="form-control" value="${proc.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Area *</label>
                            <select id="process-area" class="form-control" required>
                                <option value="Planning" ${proc.area === 'Planning' ? 'selected' : ''}>Planning</option>
                                <option value="Buying" ${proc.area === 'Buying' ? 'selected' : ''}>Buying</option>
                                <option value="Receiving" ${proc.area === 'Receiving' ? 'selected' : ''}>Receiving</option>
                                <option value="Warehouse" ${proc.area === 'Warehouse' ? 'selected' : ''}>Warehouse</option>
                                <option value="Logistics" ${proc.area === 'Logistics' ? 'selected' : ''}>Logistics</option>
                                <option value="Supplier Quality" ${proc.area === 'Supplier Quality' ? 'selected' : ''}>Supplier Quality</option>
                                <option value="Scheduling" ${proc.area === 'Scheduling' ? 'selected' : ''}>Scheduling</option>
                                <option value="Other" ${proc.area === 'Other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Purpose *</label>
                            <textarea id="process-purpose" class="form-control" required>${proc.purpose}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Inputs</label>
                            <textarea id="process-inputs" class="form-control">${proc.inputs}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Outputs</label>
                            <textarea id="process-outputs" class="form-control">${proc.outputs}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Upstream Partners</label>
                            <textarea id="process-upstream" class="form-control">${proc.upstreamPartners}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Downstream Partners</label>
                            <textarea id="process-downstream" class="form-control">${proc.downstreamPartners}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Linked KPIs</label>
                            <select id="process-kpis" class="form-control" multiple size="4">
                                ${kpiOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Owner *</label>
                            <input type="text" id="process-owner" class="form-control" value="${proc.owner}" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="updateProcess('${processId}')">Update Process</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function updateProcess(processId) {
    const proc = app.data.processDocs.find(p => p.id === processId);
    if (!proc) return;

    proc.name = document.getElementById('process-name').value;
    proc.area = document.getElementById('process-area').value;
    proc.purpose = document.getElementById('process-purpose').value;
    proc.inputs = document.getElementById('process-inputs').value;
    proc.outputs = document.getElementById('process-outputs').value;
    proc.upstreamPartners = document.getElementById('process-upstream').value;
    proc.downstreamPartners = document.getElementById('process-downstream').value;
    proc.owner = document.getElementById('process-owner').value;

    const kpiSelect = document.getElementById('process-kpis');
    proc.metrics = Array.from(kpiSelect.selectedOptions).map(opt => opt.value);

    saveData();
    closeModal();
    renderProcessLibrary();
    showToast('Process updated successfully');
}

function markProcessReviewed(processId) {
    const proc = app.data.processDocs.find(p => p.id === processId);
    if (proc) {
        proc.lastReviewedDate = formatDate(new Date());
        saveData();
        showProcessDetailModal(processId);
        showToast('Process marked as reviewed');
    }
}

function deleteProcess(processId) {
    if (!confirmDialog('Are you sure you want to delete this process?')) return;

    const index = app.data.processDocs.findIndex(p => p.id === processId);
    if (index > -1) {
        app.data.processDocs.splice(index, 1);
        saveData();
        closeModal();
        renderProcessLibrary();
        showToast('Process deleted successfully');
    }
}

// Meetings Rendering
function renderMeetings() {
    renderCadencePlanner();
    renderMeetingList();
}

function renderCadencePlanner() {
    const container = document.getElementById('cadence-planner');
    if (!container) return;

    const areas = ['Planning', 'Buying', 'Receiving', 'Warehouse', 'Logistics', 'Supplier Quality', 'Scheduling'];
    const today = new Date();

    const html = areas.map(area => {
        const areaMeetings = app.data.meetings.filter(m => m.area === area).sort((a, b) => b.dateTime.localeCompare(a.dateTime));
        const lastMeeting = areaMeetings[0];
        const nextMeetingDate = lastMeeting?.nextMeetingDate || '';

        let status = '';
        let statusClass = '';
        if (nextMeetingDate) {
            const nextDate = parseDate(nextMeetingDate);
            if (isOverdue(nextMeetingDate)) {
                status = 'Overdue';
                statusClass = 'cadence-overdue';
            } else if (isDateInRange(nextMeetingDate, 7)) {
                status = 'Due Soon';
                statusClass = '';
            } else {
                status = 'On Track';
                statusClass = '';
            }
        } else {
            status = 'No Meeting Scheduled';
            statusClass = 'cadence-overdue';
        }

        return `
            <div class="cadence-item ${statusClass}">
                <div>
                    <strong>${area}</strong>
                    <div style="font-size: 12px; color: var(--gray-600);">
                        ${nextMeetingDate ? `Next: ${nextMeetingDate}` : 'No meeting scheduled'}
                    </div>
                </div>
                <span style="font-size: 12px; font-weight: 500;">${status}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function renderMeetingList() {
    const container = document.getElementById('meeting-list');
    if (!container) return;

    const sortedMeetings = [...app.data.meetings].sort((a, b) => b.dateTime.localeCompare(a.dateTime));

    const html = sortedMeetings.map(meeting => {
        return `
            <div class="meeting-card" data-meeting-id="${meeting.id}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div>
                        <div style="font-weight: 600; font-size: 15px;">${meeting.area} - ${meeting.dateTime}</div>
                        <div style="font-size: 13px; color: var(--gray-600);">Attendees: ${meeting.attendees}</div>
                    </div>
                </div>
                <div style="font-size: 13px; color: var(--gray-700); margin-bottom: 8px;">
                    ${meeting.notes ? meeting.notes.substring(0, 150) + '...' : 'No notes'}
                </div>
                <div style="font-size: 13px; color: var(--gray-600);">
                    Next meeting: ${meeting.nextMeetingDate || 'Not scheduled'}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html || '<div class="empty-state">No meetings recorded</div>';
}

// Create Meeting Modal
function showCreateMeetingModal() {
    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>Schedule Meeting</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="meeting-form">
                        <div class="form-group">
                            <label>Meeting Date *</label>
                            <input type="date" id="meeting-date" class="form-control" value="${formatDate(new Date())}" required>
                        </div>
                        <div class="form-group">
                            <label>Area *</label>
                            <select id="meeting-area" class="form-control" required>
                                <option value="Planning">Planning</option>
                                <option value="Buying">Buying</option>
                                <option value="Receiving">Receiving</option>
                                <option value="Warehouse">Warehouse</option>
                                <option value="Logistics">Logistics</option>
                                <option value="Supplier Quality">Supplier Quality</option>
                                <option value="Scheduling">Scheduling</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Attendees *</label>
                            <input type="text" id="meeting-attendees" class="form-control" placeholder="Comma-separated names" required>
                        </div>
                        <div class="form-group">
                            <label>Agenda</label>
                            <textarea id="meeting-agenda" class="form-control">1) KPI trend review
2) Top 3 pains
3) Review project actions
4) Choose next CI focus</textarea>
                        </div>
                        <div class="form-group">
                            <label>Next Meeting Date</label>
                            <input type="date" id="meeting-next" class="form-control">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="createMeeting()">Create Meeting</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function createMeeting() {
    const dateTime = document.getElementById('meeting-date').value;
    const area = document.getElementById('meeting-area').value;
    const attendees = document.getElementById('meeting-attendees').value;
    const agenda = document.getElementById('meeting-agenda').value;
    const nextMeetingDate = document.getElementById('meeting-next').value;

    if (!dateTime || !area || !attendees) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const meeting = {
        id: generateId(),
        dateTime,
        area,
        attendees,
        agenda,
        notes: '',
        decisions: '',
        actionItems: [],
        nextMeetingDate
    };

    app.data.meetings.push(meeting);
    saveData();
    closeModal();
    renderMeetings();
    showToast('Meeting created successfully');
}

// Meeting Detail Modal
function showMeetingDetailModal(meetingId) {
    const meeting = app.data.meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h2>${meeting.area} Meeting - ${meeting.dateTime}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <div class="form-group">
                        <label>Attendees:</label>
                        <p>${meeting.attendees}</p>
                    </div>
                    <div class="form-group">
                        <label>Agenda:</label>
                        <pre style="white-space: pre-wrap; font-family: inherit;">${meeting.agenda}</pre>
                    </div>

                    <h3>Meeting Notes</h3>
                    <textarea id="meeting-notes" class="form-control" style="min-height: 100px;">${meeting.notes}</textarea>

                    <h3>Decisions</h3>
                    <textarea id="meeting-decisions" class="form-control" style="min-height: 80px;">${meeting.decisions}</textarea>

                    <h3>Action Items</h3>
                    <div id="meeting-actions-list">
                        ${renderMeetingActions(meeting)}
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="addMeetingAction('${meetingId}')">+ Add Action Item</button>

                    <div class="form-group" style="margin-top: 20px;">
                        <label>Next Meeting Date:</label>
                        <input type="date" id="meeting-next-date" class="form-control" value="${meeting.nextMeetingDate || ''}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="saveMeetingDetails('${meetingId}')">Save Meeting</button>
                    <button class="btn btn-danger" onclick="deleteMeeting('${meetingId}')">Delete</button>
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').innerHTML = modal;
}

function renderMeetingActions(meeting) {
    if (meeting.actionItems.length === 0) {
        return '<p style="color: var(--gray-400);">No action items</p>';
    }

    return meeting.actionItems.map(action => {
        const statusBadge = action.status === 'Done' ? '✓' : '○';
        return `
            <div style="padding: 8px; background: var(--gray-50); border-radius: 6px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        ${statusBadge} ${action.text}
                        <div style="font-size: 12px; color: var(--gray-600);">
                            ${action.owner} • Due: ${action.dueDate}
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        ${action.status !== 'Done' ? `<button class="btn btn-success btn-small" onclick="markMeetingActionDone('${meeting.id}', '${action.id}')">Done</button>` : ''}
                        <button class="btn btn-danger btn-small" onclick="deleteMeetingAction('${meeting.id}', '${action.id}')">×</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addMeetingAction(meetingId) {
    const meeting = app.data.meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const actionModal = `
        <div class="modal-overlay" style="z-index: 1100;">
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Add Action Item</h2>
                    <button class="modal-close" onclick="closeSecondaryModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Action *</label>
                        <textarea id="meeting-action-text" class="form-control" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Owner *</label>
                        <input type="text" id="meeting-action-owner" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Due Date *</label>
                        <input type="date" id="meeting-action-due" class="form-control" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeSecondaryModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveMeetingAction('${meetingId}')">Add Action</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-container').insertAdjacentHTML('beforeend', actionModal);
}

function saveMeetingAction(meetingId) {
    const meeting = app.data.meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const text = document.getElementById('meeting-action-text').value;
    const owner = document.getElementById('meeting-action-owner').value;
    const dueDate = document.getElementById('meeting-action-due').value;

    if (!text || !owner || !dueDate) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    meeting.actionItems.push({
        id: generateId(),
        text,
        owner,
        dueDate,
        status: 'Open',
        blockerNote: ''
    });

    saveData();
    closeSecondaryModal();
    showMeetingDetailModal(meetingId);
    showToast('Action item added');
}

function markMeetingActionDone(meetingId, actionId) {
    const meeting = app.data.meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const action = meeting.actionItems.find(a => a.id === actionId);
    if (action) {
        action.status = 'Done';
        saveData();
        showMeetingDetailModal(meetingId);
        showToast('Action marked as done');
    }
}

function deleteMeetingAction(meetingId, actionId) {
    if (!confirmDialog('Delete this action item?')) return;

    const meeting = app.data.meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const index = meeting.actionItems.findIndex(a => a.id === actionId);
    if (index > -1) {
        meeting.actionItems.splice(index, 1);
        saveData();
        showMeetingDetailModal(meetingId);
        showToast('Action deleted');
    }
}

function saveMeetingDetails(meetingId) {
    const meeting = app.data.meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    meeting.notes = document.getElementById('meeting-notes').value;
    meeting.decisions = document.getElementById('meeting-decisions').value;
    meeting.nextMeetingDate = document.getElementById('meeting-next-date').value;

    saveData();
    showToast('Meeting saved successfully');
    renderMeetings();
}

function deleteMeeting(meetingId) {
    if (!confirmDialog('Are you sure you want to delete this meeting?')) return;

    const index = app.data.meetings.findIndex(m => m.id === meetingId);
    if (index > -1) {
        app.data.meetings.splice(index, 1);
        saveData();
        closeModal();
        renderMeetings();
        showToast('Meeting deleted successfully');
    }
}

// Settings Page
function renderSettings() {
    // No dynamic rendering needed - static page
}

function exportData() {
    const dataStr = JSON.stringify(app.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sc-ci-tracker-export-${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
}

function importDataPrompt() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (confirmDialog('This will replace all current data. Are you sure?')) {
                    app.data = importedData;
                    saveData();
                    showToast('Data imported successfully');
                    renderCurrentPage();
                }
            } catch (error) {
                showToast('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetToSampleData() {
    if (!confirmDialog('This will delete all current data and reset to sample data. Are you sure?')) {
        return;
    }

    app.data = {
        kpis: [],
        projects: [],
        dmaicRecords: [],
        aars: [],
        processDocs: [],
        meetings: [],
        products: [],
        areaImprovements: []
    };

    seedSampleData();
    saveData();
    showToast('Data reset to sample data');
    renderCurrentPage();
}

// Wire up global functions
window.showProcessDetailModal = showProcessDetailModal;
window.createProcess = createProcess;
window.editProcess = editProcess;
window.updateProcess = updateProcess;
window.deleteProcess = deleteProcess;
window.markProcessReviewed = markProcessReviewed;
window.addProcessStep = addProcessStep;
window.addProcessFailure = addProcessFailure;
window.moveStepUp = moveStepUp;
window.moveStepDown = moveStepDown;
window.deleteProcessStep = deleteProcessStep;
window.deleteProcessFailure = deleteProcessFailure;

window.createMeeting = createMeeting;
window.showMeetingDetailModal = showMeetingDetailModal;
window.saveMeetingDetails = saveMeetingDetails;
window.deleteMeeting = deleteMeeting;
window.addMeetingAction = addMeetingAction;
window.saveMeetingAction = saveMeetingAction;
window.markMeetingActionDone = markMeetingActionDone;
window.deleteMeetingAction = deleteMeetingAction;
