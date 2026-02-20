/* =========================
   js/vsm.js
   Value Stream Map Builder Module
   Visual canvas-based VSM tool
   ========================= */

(function() {
    'use strict';

    let currentVSM = null;
    let selectedNode = null;
    let connectMode = false;
    let connectFromNode = null;
    let draggedNode = null;
    let dragOffset = { x: 0, y: 0 };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVSMModule);
    } else {
        initVSMModule();
    }

    function initVSMModule() {
        setupVSMCanvas();
    }

    function setupVSMCanvas() {
        const canvas = document.getElementById('vsmCanvas');
        if (!canvas) return;

        // Canvas click handler
        canvas.addEventListener('click', (e) => {
            if (e.target === canvas) {
                // Clicked on empty canvas - deselect
                deselectAllNodes();
            }
        });
    }

    // Open VSM Modal
    function openVSMModal(issueId, issueTitle) {
        const modal = document.getElementById('vsmModal');
        if (!modal) return;

        const titleEl = document.getElementById('vsmTitle');
        if (titleEl) {
            titleEl.textContent = `Value Stream Map - ${issueTitle || 'New VSM'}`;
        }

        // Check if VSM already exists for this issue
        const existingVSM = app.data.vsmMaps?.find(v => v.issueId === issueId);
        if (existingVSM) {
            currentVSM = existingVSM;
        } else {
            // Create new VSM
            currentVSM = {
                id: generateId(),
                issueId: issueId,
                title: issueTitle || 'Untitled VSM',
                nodes: [],
                edges: [],
                createdDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
        }

        modal.classList.remove('hidden');
        renderVSM();
        updateVSMSummary();
    }

    function closeVSMModal() {
        const modal = document.getElementById('vsmModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        currentVSM = null;
        selectedNode = null;
        connectMode = false;
        connectFromNode = null;
    }

    // Render VSM
    function renderVSM() {
        const canvas = document.getElementById('vsmCanvas');
        if (!canvas || !currentVSM) return;

        canvas.innerHTML = '';

        // Render edges first (so they appear below nodes)
        currentVSM.edges.forEach(edge => {
            renderEdge(edge);
        });

        // Render nodes
        currentVSM.nodes.forEach(node => {
            renderNode(node);
        });
    }

    function renderNode(node) {
        const canvas = document.getElementById('vsmCanvas');
        if (!canvas) return;

        const nodeEl = document.createElement('div');
        nodeEl.className = `vsm-node node-${node.type.toLowerCase()}`;
        if (selectedNode && selectedNode.id === node.id) {
            nodeEl.classList.add('selected');
        }

        nodeEl.style.left = node.x + 'px';
        nodeEl.style.top = node.y + 'px';

        const metrics = node.metrics || {};
        nodeEl.innerHTML = `
            <div class="vsm-node-type">${node.type}</div>
            <div class="vsm-node-title">${escapeHtml(node.title)}</div>
            ${metrics.CT || metrics.LT || metrics.WIP ? `
                <div class="vsm-node-metrics">
                    ${metrics.CT ? `CT: ${metrics.CT}h` : ''}
                    ${metrics.LT ? `${metrics.CT ? ' • ' : ''}LT: ${metrics.LT}h` : ''}
                    ${metrics.WIP ? `${metrics.CT || metrics.LT ? ' • ' : ''}WIP: ${metrics.WIP}` : ''}
                </div>
            ` : ''}
        `;

        // Node interactions
        nodeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (connectMode) {
                handleNodeConnectClick(node);
            } else {
                selectNode(node);
            }
        });

        nodeEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            editNode(node);
        });

        // Drag functionality
        nodeEl.addEventListener('mousedown', (e) => {
            if (connectMode) return;
            draggedNode = node;
            dragOffset = {
                x: e.clientX - node.x,
                y: e.clientY - node.y
            };
            e.preventDefault();
        });

        canvas.appendChild(nodeEl);
    }

    function renderEdge(edge) {
        const canvas = document.getElementById('vsmCanvas');
        if (!canvas) return;

        const fromNode = currentVSM.nodes.find(n => n.id === edge.fromId);
        const toNode = currentVSM.nodes.find(n => n.id === edge.toId);

        if (!fromNode || !toNode) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('vsm-edge');
        svg.style.position = 'absolute';
        svg.style.pointerEvents = 'none';
        svg.style.overflow = 'visible';

        const fromX = fromNode.x + 60; // Center of node
        const fromY = fromNode.y + 40;
        const toX = toNode.x + 60;
        const toY = toNode.y + 40;

        const minX = Math.min(fromX, toX);
        const minY = Math.min(fromY, toY);
        const width = Math.abs(toX - fromX) + 20;
        const height = Math.abs(toY - fromY) + 20;

        svg.style.left = (minX - 10) + 'px';
        svg.style.top = (minY - 10) + 'px';
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('vsm-edge-line');
        line.setAttribute('x1', fromX - minX + 10);
        line.setAttribute('y1', fromY - minY + 10);
        line.setAttribute('x2', toX - minX + 10);
        line.setAttribute('y2', toY - minY + 10);
        line.setAttribute('marker-end', 'url(#arrowhead)');

        // Arrow marker
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.classList.add('vsm-edge-arrow');
        polygon.setAttribute('points', '0 0, 10 3, 0 6');
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);
        svg.appendChild(line);

        canvas.appendChild(svg);
    }

    // Mouse move for dragging
    document.addEventListener('mousemove', (e) => {
        if (draggedNode) {
            draggedNode.x = e.clientX - dragOffset.x;
            draggedNode.y = e.clientY - dragOffset.y;
            renderVSM();
        }
    });

    // Mouse up to stop dragging
    document.addEventListener('mouseup', () => {
        if (draggedNode) {
            draggedNode = null;
        }
    });

    // Add Node
    function addVSMNode(type) {
        if (!currentVSM) return;

        const node = {
            id: generateId(),
            type: type,
            title: `${type} ${currentVSM.nodes.length + 1}`,
            notes: '',
            metrics: {
                CT: 0,  // Cycle Time
                LT: 0,  // Lead Time
                WIP: 0, // Work in Process
                FPY: 0, // First Pass Yield
                scrap: 0,
                rework: 0
            },
            x: 100 + (currentVSM.nodes.length * 30),
            y: 100 + (currentVSM.nodes.length * 30)
        };

        currentVSM.nodes.push(node);
        renderVSM();
        selectNode(node);
        editNode(node); // Open editor immediately
    }

    function selectNode(node) {
        selectedNode = node;
        renderVSM();
    }

    function deselectAllNodes() {
        selectedNode = null;
        renderVSM();
    }

    function editNode(node) {
        const metrics = node.metrics || {};

        const modalHtml = `
            <div class="modal-overlay" id="vsmNodeModal">
                <div class="modal">
                    <div class="modal-header">
                        <h2>Edit ${node.type} Node</h2>
                        <button class="modal-close" onclick="app.closeVSMNodeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="vsmNodeForm">
                            <div class="form-group">
                                <label>Title *</label>
                                <input type="text" id="vsmNodeTitle" class="form-control" required value="${escapeHtml(node.title)}">
                            </div>

                            <div class="form-group">
                                <label>Notes</label>
                                <textarea id="vsmNodeNotes" class="form-control" rows="2">${escapeHtml(node.notes || '')}</textarea>
                            </div>

                            <h3 style="margin-top: 20px; margin-bottom: 12px; font-size: 16px;">Metrics</h3>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label>Cycle Time (hours)</label>
                                    <input type="number" id="vsmNodeCT" class="form-control" step="0.1" value="${metrics.CT || 0}">
                                </div>

                                <div class="form-group">
                                    <label>Lead Time (hours)</label>
                                    <input type="number" id="vsmNodeLT" class="form-control" step="0.1" value="${metrics.LT || 0}">
                                </div>

                                <div class="form-group">
                                    <label>WIP (units)</label>
                                    <input type="number" id="vsmNodeWIP" class="form-control" step="1" value="${metrics.WIP || 0}">
                                </div>

                                <div class="form-group">
                                    <label>First Pass Yield (%)</label>
                                    <input type="number" id="vsmNodeFPY" class="form-control" step="1" min="0" max="100" value="${metrics.FPY || 0}">
                                </div>

                                <div class="form-group">
                                    <label>Scrap (%)</label>
                                    <input type="number" id="vsmNodeScrap" class="form-control" step="0.1" min="0" max="100" value="${metrics.scrap || 0}">
                                </div>

                                <div class="form-group">
                                    <label>Rework (%)</label>
                                    <input type="number" id="vsmNodeRework" class="form-control" step="0.1" min="0" max="100" value="${metrics.rework || 0}">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-danger" onclick="app.deleteVSMNode('${node.id}')">Delete Node</button>
                        <button class="btn btn-secondary" onclick="app.closeVSMNodeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="app.saveVSMNode('${node.id}')">Save</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    function closeVSMNodeModal() {
        const modal = document.getElementById('vsmNodeModal');
        if (modal) modal.remove();
    }

    function saveVSMNode(nodeId) {
        const node = currentVSM.nodes.find(n => n.id === nodeId);
        if (!node) return;

        node.title = document.getElementById('vsmNodeTitle').value.trim();
        node.notes = document.getElementById('vsmNodeNotes').value.trim();
        node.metrics = {
            CT: parseFloat(document.getElementById('vsmNodeCT').value) || 0,
            LT: parseFloat(document.getElementById('vsmNodeLT').value) || 0,
            WIP: parseFloat(document.getElementById('vsmNodeWIP').value) || 0,
            FPY: parseFloat(document.getElementById('vsmNodeFPY').value) || 0,
            scrap: parseFloat(document.getElementById('vsmNodeScrap').value) || 0,
            rework: parseFloat(document.getElementById('vsmNodeRework').value) || 0
        };

        closeVSMNodeModal();
        renderVSM();
        updateVSMSummary();
        showToast('Node updated', 'success');
    }

    function deleteVSMNode(nodeId) {
        if (!confirm('Delete this node?')) return;

        // Remove node
        currentVSM.nodes = currentVSM.nodes.filter(n => n.id !== nodeId);

        // Remove edges connected to this node
        currentVSM.edges = currentVSM.edges.filter(e =>
            e.fromId !== nodeId && e.toId !== nodeId
        );

        closeVSMNodeModal();
        renderVSM();
        updateVSMSummary();
        showToast('Node deleted', 'success');
    }

    // Connect Mode
    function toggleVSMConnectMode() {
        connectMode = !connectMode;
        connectFromNode = null;

        const btn = document.querySelector('[onclick="app.toggleVSMConnectMode()"]');
        if (btn) {
            if (connectMode) {
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-secondary');
                btn.textContent = 'Connecting... (click 2 nodes)';
                showToast('Connect mode: Click first node, then second node', 'info');
            } else {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
                btn.textContent = 'Connect Nodes';
            }
        }
    }

    function handleNodeConnectClick(node) {
        if (!connectFromNode) {
            connectFromNode = node;
            showToast(`Selected: ${node.title}. Now click the destination node.`, 'info');
        } else {
            // Create edge
            if (connectFromNode.id === node.id) {
                showToast('Cannot connect node to itself', 'error');
                return;
            }

            // Check if edge already exists
            const exists = currentVSM.edges.some(e =>
                e.fromId === connectFromNode.id && e.toId === node.id
            );

            if (exists) {
                showToast('Connection already exists', 'error');
            } else {
                currentVSM.edges.push({
                    id: generateId(),
                    fromId: connectFromNode.id,
                    toId: node.id,
                    label: ''
                });
                renderVSM();
                showToast('Nodes connected', 'success');
            }

            // Reset connect mode
            connectFromNode = null;
            toggleVSMConnectMode();
        }
    }

    // Update Summary
    function updateVSMSummary() {
        if (!currentVSM) return;

        let totalLT = 0;
        let totalCT = 0;
        let totalWIP = 0;

        currentVSM.nodes.forEach(node => {
            const metrics = node.metrics || {};
            totalLT += metrics.LT || 0;
            totalCT += metrics.CT || 0;
            totalWIP += metrics.WIP || 0;
        });

        const ltEl = document.getElementById('vsmTotalLT');
        const ctEl = document.getElementById('vsmTotalCT');
        const wipEl = document.getElementById('vsmTotalWIP');

        if (ltEl) ltEl.textContent = totalLT.toFixed(1);
        if (ctEl) ctEl.textContent = totalCT.toFixed(1);
        if (wipEl) wipEl.textContent = totalWIP.toFixed(0);
    }

    // Save VSM
    function saveVSM() {
        if (!currentVSM) return;

        currentVSM.lastUpdated = new Date().toISOString();

        // Check if VSM already exists
        const existingIndex = app.data.vsmMaps?.findIndex(v => v.id === currentVSM.id);
        if (existingIndex !== undefined && existingIndex !== -1) {
            app.data.vsmMaps[existingIndex] = currentVSM;
            logAudit('update', 'vsm', `Updated VSM: ${currentVSM.title}`);
        } else {
            if (!app.data.vsmMaps) app.data.vsmMaps = [];
            app.data.vsmMaps.push(currentVSM);
            logAudit('create', 'vsm', `Created VSM: ${currentVSM.title}`);
        }

        saveData();
        showToast('VSM saved', 'success');
    }

    // Export VSM as JSON
    function exportVSMJSON() {
        if (!currentVSM) return;

        const json = JSON.stringify(currentVSM, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vsm_${currentVSM.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('VSM exported', 'success');
    }

    // Helper functions
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
    app.openVSMModal = openVSMModal;
    app.closeVSMModal = closeVSMModal;
    app.addVSMNode = addVSMNode;
    app.toggleVSMConnectMode = toggleVSMConnectMode;
    app.saveVSM = saveVSM;
    app.exportVSMJSON = exportVSMJSON;
    app.closeVSMNodeModal = closeVSMNodeModal;
    app.saveVSMNode = saveVSMNode;
    app.deleteVSMNode = deleteVSMNode;

})();
