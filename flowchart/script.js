/**
 * Flowchart Studio - Interactive Vector Flowchart Builder
 * Antigravity Webtools Suite
 */

(function () {
    'use strict';

    // --- State Management ---
    const state = {
        nodes: [],
        edges: [],
        selectedNodeIds: new Set(),
        selectedEdgeIds: new Set(),
        pan: { x: 40, y: 40 },
        zoom: 1.0,
        activeTool: 'select', // 'select', 'pan'
        snapToGrid: true,
        showGrid: true,
        gridSize: 20,
        
        // Dragging & Interaction States
        isPanning: false,
        panStart: { x: 0, y: 0 },
        isDraggingNode: false,
        dragNodeStartPos: new Map(), // nodeId -> {x, y}
        dragMouseStart: { x: 0, y: 0 },
        
        isResizingNode: false,
        resizeNodeId: null,
        resizeInitialBounds: null,
        
        isConnecting: false,
        connectStartPort: null, // { nodeId, portId ('top'|'right'|'bottom'|'left') }
        
        isMarquee: false,
        marqueeStart: { x: 0, y: 0 },
        
        // Clipboard & History
        clipboard: null,
        history: [],
        redoStack: [],
        maxHistory: 40
    };

    let nextIdCounter = 1;
    function generateId(prefix = 'node') {
        return `${prefix}_${Date.now()}_${nextIdCounter++}`;
    }

    // --- DOM Elements Cache ---
    const DOM = {
        appContainer: document.getElementById('app'),
        viewport: document.getElementById('canvas-viewport'),
        svgCanvas: document.getElementById('svg-canvas'),
        canvasContentGroup: document.getElementById('canvas-content-group'),
        nodesLayer: document.getElementById('nodes-layer'),
        edgesLayer: document.getElementById('edges-layer'),
        alignmentGuidesLayer: document.getElementById('alignment-guides-layer'),
        tempEdgePath: document.getElementById('temp-edge-path'),
        marqueeRect: document.getElementById('marquee-rect'),
        bgGridRect: document.getElementById('bg-grid-rect'),
        
        // Toolbar
        btnSelectTool: document.getElementById('btn-select-tool'),
        btnPanTool: document.getElementById('btn-pan-tool'),
        btnUndo: document.getElementById('btn-undo'),
        btnRedo: document.getElementById('btn-redo'),
        btnTemplates: document.getElementById('btn-templates'),
        btnClear: document.getElementById('btn-clear'),
        btnThemeToggle: document.getElementById('btn-theme-toggle'),
        btnExportMenu: document.getElementById('btn-export-menu'),
        exportDropdown: document.getElementById('export-dropdown'),
        btnExportPng: document.getElementById('btn-export-png'),
        btnExportSvg: document.getElementById('btn-export-svg'),
        btnSaveJson: document.getElementById('btn-save-json'),
        btnLoadJsonTrigger: document.getElementById('btn-load-json-trigger'),
        fileInputJson: document.getElementById('file-input-json'),

        // Zoom & Controls
        btnZoomIn: document.getElementById('btn-zoom-in'),
        btnZoomOut: document.getElementById('btn-zoom-out'),
        btnZoomReset: document.getElementById('btn-zoom-reset'),
        btnZoomFit: document.getElementById('btn-zoom-fit'),
        zoomLevelText: document.getElementById('zoom-level-text'),
        btnToggleGrid: document.getElementById('btn-toggle-grid'),
        btnToggleSnap: document.getElementById('btn-toggle-snap'),

        // Status Bar
        statusCounts: document.getElementById('status-counts'),
        statusActionHint: document.getElementById('status-action'),

        // Inspector Sections
        selectedTypeBadge: document.getElementById('selected-type-badge'),
        inspectorEmpty: document.getElementById('inspector-empty'),
        inspectorNode: document.getElementById('inspector-node'),
        inspectorEdge: document.getElementById('inspector-edge'),
        inspectorMulti: document.getElementById('inspector-multi'),

        // Node Inspector Inputs
        nodePropText: document.getElementById('node-prop-text'),
        nodePropShape: document.getElementById('node-prop-shape'),
        nodePropFontSize: document.getElementById('node-prop-fontsize'),
        nodePropFill: document.getElementById('node-prop-fill'),
        nodePropStroke: document.getElementById('node-prop-stroke'),
        nodePropWidth: document.getElementById('node-prop-width'),
        nodePropHeight: document.getElementById('node-prop-height'),
        btnBringFront: document.getElementById('btn-bring-front'),
        btnSendBack: document.getElementById('btn-send-back'),
        btnDuplicateNode: document.getElementById('btn-duplicate-node'),
        btnDeleteItem: document.getElementById('btn-delete-item'),

        // Edge Inspector Inputs
        edgePropLabel: document.getElementById('edge-prop-label'),
        edgePropRouting: document.getElementById('edge-prop-routing'),
        edgePropStyle: document.getElementById('edge-prop-style'),
        edgePropColor: document.getElementById('edge-prop-color'),
        edgePropWidth: document.getElementById('edge-prop-width'),
        btnDeleteEdge: document.getElementById('btn-delete-edge'),

        // Multi Inspector
        multiSelectCount: document.getElementById('multi-select-count'),
        btnAlignLeft: document.getElementById('btn-align-left'),
        btnAlignCenterH: document.getElementById('btn-align-center-h'),
        btnAlignRight: document.getElementById('btn-align-right'),
        btnAlignTop: document.getElementById('btn-align-top'),
        btnAlignCenterV: document.getElementById('btn-align-center-v'),
        btnAlignBottom: document.getElementById('btn-align-bottom'),
        btnDeleteMulti: document.getElementById('btn-delete-multi'),

        // Modal
        modalTemplates: document.getElementById('modal-templates')
    };

    // --- Shape Definitions & Default Specs ---
    const SHAPE_SPECS = {
        'start-end': { defaultW: 130, defaultH: 50, label: '開始/終了' },
        'process': { defaultW: 140, defaultH: 60, label: '処理' },
        'decision': { defaultW: 130, defaultH: 70, label: '条件分岐' },
        'io': { defaultW: 140, defaultH: 55, label: 'データ入出力' },
        'document': { defaultW: 130, defaultH: 65, label: '書類' },
        'database': { defaultW: 120, defaultH: 70, label: 'データベース' },
        'subprocess': { defaultW: 140, defaultH: 60, label: 'サブプロセス' },
        'note': { defaultW: 130, defaultH: 60, label: 'メモ...' },
        'connector': { defaultW: 40, defaultH: 40, label: '' }
    };

    // --- Initialization ---
    function init() {
        setupEventListeners();
        updateTransform();
        loadInitialTemplate();
        render();
    }

    // --- History / Undo / Redo ---
    function saveHistory() {
        const snapshot = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges))
        };
        state.history.push(snapshot);
        if (state.history.length > state.maxHistory) {
            state.history.shift();
        }
        state.redoStack = []; // Clear redo on new action
        updateUndoRedoButtons();
    }

    function undo() {
        if (state.history.length === 0) return;
        const currentSnapshot = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges))
        };
        state.redoStack.push(currentSnapshot);

        const previousSnapshot = state.history.pop();
        state.nodes = previousSnapshot.nodes;
        state.edges = previousSnapshot.edges;

        state.selectedNodeIds.clear();
        state.selectedEdgeIds.clear();
        render();
        updateUndoRedoButtons();
    }

    function redo() {
        if (state.redoStack.length === 0) return;
        const currentSnapshot = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges))
        };
        state.history.push(currentSnapshot);

        const nextSnapshot = state.redoStack.pop();
        state.nodes = nextSnapshot.nodes;
        state.edges = nextSnapshot.edges;

        state.selectedNodeIds.clear();
        state.selectedEdgeIds.clear();
        render();
        updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() {
        DOM.btnUndo.disabled = state.history.length === 0;
        DOM.btnRedo.disabled = state.redoStack.length === 0;
        DOM.btnUndo.style.opacity = state.history.length === 0 ? '0.4' : '1';
        DOM.btnRedo.style.opacity = state.redoStack.length === 0 ? '0.4' : '1';
    }

    // --- Coordinate Translation Helpers ---
    function clientToCanvasCoords(clientX, clientY) {
        const rect = DOM.viewport.getBoundingClientRect();
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;
        const canvasX = (screenX - state.pan.x) / state.zoom;
        const canvasY = (screenY - state.pan.y) / state.zoom;
        return { x: canvasX, y: canvasY };
    }

    function snapValue(val) {
        if (!state.snapToGrid) return val;
        return Math.round(val / state.gridSize) * state.gridSize;
    }

    function updateTransform() {
        DOM.canvasContentGroup.setAttribute('transform', `translate(${state.pan.x}, ${state.pan.y}) scale(${state.zoom})`);
        DOM.zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
    }

    // --- Node Helpers & Port Position Logic ---
    function getNodePortCoords(node, portId) {
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;

        switch (portId) {
            case 'top':
                return { x: cx, y: node.y };
            case 'right':
                return { x: node.x + node.width, y: cy };
            case 'bottom':
                return { x: cx, y: node.y + node.height };
            case 'left':
                return { x: node.x, y: cy };
            default:
                return { x: cx, y: cy };
        }
    }

    // --- SVG Path Generator for Nodes ---
    function createNodeSvgPath(shape, w, h) {
        switch (shape) {
            case 'start-end':
                const rx = Math.min(w, h) / 2;
                return `<rect width="${w}" height="${h}" rx="${rx}" ry="${rx}" class="node-body"/>`;
            case 'process':
                return `<rect width="${w}" height="${h}" rx="6" ry="6" class="node-body"/>`;
            case 'decision':
                return `<polygon points="${w/2},0 ${w},${h/2} ${w/2},${h} 0,${h/2}" class="node-body"/>`;
            case 'io':
                const offset = Math.min(w * 0.15, 20);
                return `<polygon points="${offset},0 ${w},0 ${w - offset},${h} 0,${h}" class="node-body"/>`;
            case 'document':
                return `<path d="M 0,0 L ${w},0 L ${w},${h - 12} Q ${w * 0.75},${h} ${w * 0.5},${h - 8} Q ${w * 0.25},${h - 16} 0,${h - 6} Z" class="node-body"/>`;
            case 'database':
                const ry = 10;
                return `<path d="M 0,${ry} C 0,0 ${w},0 ${w},${ry} L ${w},${h - ry} C ${w},${h} 0,${h} 0,${h - ry} Z" class="node-body"/>
                        <path d="M 0,${ry} C 0,${ry*2} ${w},${ry*2} ${w},${ry}" fill="none" class="node-body-decor" stroke="currentColor" opacity="0.4"/>`;
            case 'subprocess':
                return `<rect width="${w}" height="${h}" rx="4" ry="4" class="node-body"/>
                        <line x1="12" y1="0" x2="12" y2="${h}" stroke="currentColor" opacity="0.4"/>
                        <line x1="${w - 12}" y1="0" x2="${w - 12}" y2="${h}" stroke="currentColor" opacity="0.4"/>`;
            case 'note':
                return `<polygon points="0,0 ${w - 14},0 ${w},14 ${w},${h} 0,${h}" class="node-body"/>
                        <polygon points="${w - 14},0 ${w - 14},14 ${w},14" fill="rgba(0,0,0,0.15)" stroke="currentColor"/>`;
            case 'connector':
                return `<circle cx="${w/2}" cy="${h/2}" r="${w/2}" class="node-body"/>`;
            default:
                return `<rect width="${w}" height="${h}" rx="4" ry="4" class="node-body"/>`;
        }
    }

    // --- Edge Path Routing Logic (Orthogonal, Bezier, Straight) ---
    function calculateEdgePath(p1, port1, p2, port2, routing = 'orthogonal') {
        if (routing === 'straight') {
            return `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`;
        }

        if (routing === 'bezier') {
            let dx = Math.abs(p2.x - p1.x) * 0.5;
            let dy = Math.abs(p2.y - p1.y) * 0.5;
            let c1 = { x: p1.x, y: p1.y };
            let c2 = { x: p2.x, y: p2.y };

            if (port1 === 'top') c1.y -= dy;
            else if (port1 === 'bottom') c1.y += dy;
            else if (port1 === 'left') c1.x -= dx;
            else if (port1 === 'right') c1.x += dx;

            if (port2 === 'top') c2.y -= dy;
            else if (port2 === 'bottom') c2.y += dy;
            else if (port2 === 'left') c2.x -= dx;
            else if (port2 === 'right') c2.x += dx;

            return `M ${p1.x},${p1.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
        }

        // Orthogonal (Smart Elbow)
        const margin = 20;
        const pts = [p1];

        // First stub out of port 1
        let startStub = { ...p1 };
        if (port1 === 'top') startStub.y -= margin;
        else if (port1 === 'bottom') startStub.y += margin;
        else if (port1 === 'left') startStub.x -= margin;
        else if (port1 === 'right') startStub.x += margin;
        pts.push(startStub);

        // End stub into port 2
        let endStub = { ...p2 };
        if (port2 === 'top') endStub.y -= margin;
        else if (port2 === 'bottom') endStub.y += margin;
        else if (port2 === 'left') endStub.x -= margin;
        else if (port2 === 'right') endStub.x += margin;

        // Route between stubs
        if ((port1 === 'left' || port1 === 'right') && (port2 === 'left' || port2 === 'right')) {
            const midX = (startStub.x + endStub.x) / 2;
            pts.push({ x: midX, y: startStub.y });
            pts.push({ x: midX, y: endStub.y });
        } else if ((port1 === 'top' || port1 === 'bottom') && (port2 === 'top' || port2 === 'bottom')) {
            const midY = (startStub.y + endStub.y) / 2;
            pts.push({ x: startStub.x, y: midY });
            pts.push({ x: endStub.x, y: midY });
        } else {
            // Mixed directions
            if (port1 === 'top' || port1 === 'bottom') {
                pts.push({ x: startStub.x, y: endStub.y });
            } else {
                pts.push({ x: endStub.x, y: startStub.y });
            }
        }

        pts.push(endStub);
        pts.push(p2);

        // Build SVG path string with rounded corners
        let pathStr = `M ${pts[0].x},${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            pathStr += ` L ${pts[i].x},${pts[i].y}`;
        }
        return pathStr;
    }

    function calculateEdgeMidpoint(p1, port1, p2, port2, routing) {
        // Simple midpoint calculation for label positioning
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
    }

    // --- Main Rendering Engine ---
    function render() {
        renderNodes();
        renderEdges();
        updateInspector();
        updateStatusBar();
    }

    function renderNodes() {
        DOM.nodesLayer.innerHTML = '';

        state.nodes.forEach(node => {
            const isSelected = state.selectedNodeIds.has(node.id);
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', `flow-node-group ${isSelected ? 'selected' : ''}`);
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            g.dataset.nodeId = node.id;

            // Custom Shape SVG
            const shapeContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            shapeContainer.innerHTML = createNodeSvgPath(node.shape, node.width, node.height);
            
            const bodyEl = shapeContainer.querySelector('.node-body');
            if (bodyEl) {
                bodyEl.style.fill = node.fill || 'var(--node-bg-default)';
                bodyEl.style.stroke = node.stroke || 'var(--node-stroke-default)';
            }
            g.appendChild(shapeContainer);

            // Multiline Text Support
            const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.setAttribute('class', 'node-text');
            textEl.setAttribute('x', (node.width / 2).toString());
            textEl.setAttribute('y', (node.height / 2).toString());
            textEl.style.fontSize = `${node.fontSize || 14}px`;
            textEl.style.fill = node.textColor || 'var(--text-color)';

            const lines = (node.text || '').split('\n');
            const lineHeight = (node.fontSize || 14) * 1.25;
            const startY = (node.height / 2) - ((lines.length - 1) * lineHeight / 2);

            lines.forEach((line, index) => {
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.setAttribute('x', (node.width / 2).toString());
                tspan.setAttribute('y', (startY + (index * lineHeight)).toString());
                tspan.textContent = line;
                textEl.appendChild(tspan);
            });
            g.appendChild(textEl);

            // Render 4 Anchor Ports
            const ports = ['top', 'right', 'bottom', 'left'];
            ports.forEach(portId => {
                const portCoords = getNodePortCoords({ x: 0, y: 0, width: node.width, height: node.height }, portId);
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('class', 'node-port');
                circle.setAttribute('cx', portCoords.x.toString());
                circle.setAttribute('cy', portCoords.y.toString());
                circle.setAttribute('r', '6');
                circle.dataset.nodeId = node.id;
                circle.dataset.portId = portId;
                g.appendChild(circle);
            });

            // Resize Handle (Bottom-Right)
            if (isSelected && node.shape !== 'connector') {
                const resizeHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                resizeHandle.setAttribute('class', 'resize-handle');
                resizeHandle.setAttribute('x', (node.width - 6).toString());
                resizeHandle.setAttribute('y', (node.height - 6).toString());
                resizeHandle.setAttribute('width', '10');
                resizeHandle.setAttribute('height', '10');
                resizeHandle.dataset.nodeId = node.id;
                g.appendChild(resizeHandle);
            }

            DOM.nodesLayer.appendChild(g);
        });
    }

    function renderEdges() {
        DOM.edgesLayer.innerHTML = '';

        state.edges.forEach(edge => {
            const fromNode = state.nodes.find(n => n.id === edge.fromNodeId);
            const toNode = state.nodes.find(n => n.id === edge.toNodeId);
            if (!fromNode || !toNode) return;

            const p1 = getNodePortCoords(fromNode, edge.fromPort);
            const p2 = getNodePortCoords(toNode, edge.toPort);

            const isSelected = state.selectedEdgeIds.has(edge.id);
            const pathStr = calculateEdgePath(p1, edge.fromPort, p2, edge.toPort, edge.routing || 'orthogonal');

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', `edge-group ${isSelected ? 'selected' : ''}`);
            g.dataset.edgeId = edge.id;

            // Hitbox for easy clicking
            const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            hitbox.setAttribute('class', 'edge-hitbox');
            hitbox.setAttribute('d', pathStr);
            g.appendChild(hitbox);

            // Visual Edge Line
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('class', 'edge-path');
            path.setAttribute('d', pathStr);
            path.setAttribute('marker-end', isSelected ? 'url(#arrow-end-selected)' : 'url(#arrow-end)');

            if (edge.style === 'dashed') {
                path.setAttribute('stroke-dasharray', '6,4');
            } else if (edge.style === 'dotted') {
                path.setAttribute('stroke-dasharray', '2,4');
            }

            if (edge.stroke) path.style.stroke = edge.stroke;
            if (edge.strokeWidth) path.style.strokeWidth = `${edge.strokeWidth}px`;

            g.appendChild(path);

            // Edge Label (if present)
            if (edge.label && edge.label.trim() !== '') {
                const mid = calculateEdgeMidpoint(p1, edge.fromPort, p2, edge.toPort, edge.routing);
                const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                labelGroup.setAttribute('transform', `translate(${mid.x}, ${mid.y})`);

                const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                labelText.setAttribute('class', 'edge-label-text');
                labelText.textContent = edge.label;

                // Create background rect after temporary append to measure text width
                const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                bgRect.setAttribute('class', 'edge-label-bg');
                
                // Estimate text width
                const charCount = edge.label.length;
                const rectW = Math.max(30, charCount * 9 + 12);
                const rectH = 20;
                bgRect.setAttribute('x', (-rectW / 2).toString());
                bgRect.setAttribute('y', (-rectH / 2).toString());
                bgRect.setAttribute('width', rectW.toString());
                bgRect.setAttribute('height', rectH.toString());

                labelGroup.appendChild(bgRect);
                labelGroup.appendChild(labelText);
                g.appendChild(labelGroup);
            }

            DOM.edgesLayer.appendChild(g);
        });
    }

    // --- Status Bar Update ---
    function updateStatusBar() {
        DOM.statusCounts.textContent = `ノード: ${state.nodes.length} | 接続: ${state.edges.length}`;
        if (state.selectedNodeIds.size > 0 || state.selectedEdgeIds.size > 0) {
            DOM.statusActionHint.textContent = `選択中: ノード ${state.selectedNodeIds.size}件, 接続線 ${state.selectedEdgeIds.size}件`;
        } else {
            DOM.statusActionHint.textContent = `操作ヘルプ: [Shift+ドラッグ] で範囲選択, [Space+ドラッグ] でパン`;
        }
    }

    // --- Inspector Panel Two-Way Synchronization ---
    function updateInspector() {
        const selNodes = Array.from(state.selectedNodeIds).map(id => state.nodes.find(n => n.id === id)).filter(Boolean);
        const selEdges = Array.from(state.selectedEdgeIds).map(id => state.edges.find(e => e.id === id)).filter(Boolean);

        DOM.inspectorEmpty.style.display = 'none';
        DOM.inspectorNode.style.display = 'none';
        DOM.inspectorEdge.style.display = 'none';
        DOM.inspectorMulti.style.display = 'none';

        if (selNodes.length === 1 && selEdges.length === 0) {
            // Single Node Selected
            const node = selNodes[0];
            DOM.selectedTypeBadge.textContent = SHAPE_SPECS[node.shape]?.label || 'ノード';
            DOM.inspectorNode.style.display = 'block';

            DOM.nodePropText.value = node.text || '';
            DOM.nodePropShape.value = node.shape || 'process';
            DOM.nodePropFontSize.value = node.fontSize || 14;
            DOM.nodePropFill.value = rgbToHex(node.fill) || '#1e293b';
            DOM.nodePropStroke.value = rgbToHex(node.stroke) || '#475569';
            DOM.nodePropWidth.value = Math.round(node.width);
            DOM.nodePropHeight.value = Math.round(node.height);

        } else if (selEdges.length === 1 && selNodes.length === 0) {
            // Single Edge Selected
            const edge = selEdges[0];
            DOM.selectedTypeBadge.textContent = '接続線';
            DOM.inspectorEdge.style.display = 'block';

            DOM.edgePropLabel.value = edge.label || '';
            DOM.edgePropRouting.value = edge.routing || 'orthogonal';
            DOM.edgePropStyle.value = edge.style || 'solid';
            DOM.edgePropColor.value = rgbToHex(edge.stroke) || '#94a3b8';
            DOM.edgePropWidth.value = edge.strokeWidth || 2.5;

        } else if (selNodes.length + selEdges.length > 1) {
            // Multiple Selection
            DOM.selectedTypeBadge.textContent = '複数選択';
            DOM.inspectorMulti.style.display = 'block';
            DOM.multiSelectCount.textContent = `${selNodes.length + selEdges.length}個のアイテムを選択中`;

        } else {
            // Nothing Selected
            DOM.selectedTypeBadge.textContent = '選択なし';
            DOM.inspectorEmpty.style.display = 'block';
        }
    }

    function rgbToHex(colorStr) {
        if (!colorStr) return '#1e293b';
        if (colorStr.startsWith('#')) return colorStr;
        // Simple fallback hex return if CSS variable or rgba
        if (colorStr.includes('var(')) return '#1e293b';
        return '#3b82f6';
    }

    // --- Interactive Mouse Handlers ---
    function setupEventListeners() {
        // Window & Shortcuts
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', () => updateTransform());

        // Canvas Viewport Mouse Events
        DOM.viewport.addEventListener('mousedown', handleViewportMouseDown);
        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
        DOM.viewport.addEventListener('wheel', handleViewportWheel, { passive: false });

        // Double Click for Text Edit
        DOM.viewport.addEventListener('dblclick', handleViewportDblClick);

        // Drag and Drop from Palette
        setupDragAndDropPalette();

        // Topbar Buttons
        DOM.btnSelectTool.addEventListener('click', () => setTool('select'));
        DOM.btnPanTool.addEventListener('click', () => setTool('pan'));
        DOM.btnUndo.addEventListener('click', undo);
        DOM.btnRedo.addEventListener('click', redo);
        DOM.btnTemplates.addEventListener('click', () => showModal('modal-templates'));
        DOM.btnClear.addEventListener('click', clearCanvas);
        DOM.btnThemeToggle.addEventListener('click', toggleTheme);

        // Export Dropdown
        DOM.btnExportMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.exportDropdown.parentElement.classList.toggle('active');
        });
        document.addEventListener('click', () => DOM.exportDropdown.parentElement.classList.remove('active'));

        DOM.btnExportPng.addEventListener('click', exportPng);
        DOM.btnExportSvg.addEventListener('click', exportSvg);
        DOM.btnSaveJson.addEventListener('click', saveJson);
        DOM.btnLoadJsonTrigger.addEventListener('click', () => DOM.fileInputJson.click());
        DOM.fileInputJson.addEventListener('change', loadJsonFile);

        // Zoom Controls
        DOM.btnZoomIn.addEventListener('click', () => zoomBy(1.2));
        DOM.btnZoomOut.addEventListener('click', () => zoomBy(0.8));
        DOM.btnZoomReset.addEventListener('click', () => { state.zoom = 1.0; state.pan = { x: 40, y: 40 }; updateTransform(); });
        DOM.btnZoomFit.addEventListener('click', zoomToFit);

        // Snap & Grid Toggles
        DOM.btnToggleGrid.addEventListener('click', () => {
            state.showGrid = !state.showGrid;
            DOM.btnToggleGrid.classList.toggle('active', state.showGrid);
            DOM.bgGridRect.style.display = state.showGrid ? 'block' : 'none';
        });
        DOM.btnToggleSnap.addEventListener('click', () => {
            state.snapToGrid = !state.snapToGrid;
            DOM.btnToggleSnap.classList.toggle('active', state.snapToGrid);
        });

        // Inspector Form Events
        setupInspectorEvents();

        // Modal Handlers
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.close;
                hideModal(targetId);
            });
        });

        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateKey = card.dataset.template;
                loadPresetTemplate(templateKey);
                hideModal('modal-templates');
            });
        });
    }

    function setTool(toolName) {
        state.activeTool = toolName;
        DOM.btnSelectTool.classList.toggle('active', toolName === 'select');
        DOM.btnPanTool.classList.toggle('active', toolName === 'pan');
        DOM.viewport.classList.toggle('panning', toolName === 'pan');
    }

    function handleViewportMouseDown(e) {
        if (e.button === 1 || state.activeTool === 'pan' || e.spaceKey) {
            // Pan Start (Middle Mouse or Pan Tool)
            state.isPanning = true;
            state.panStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
            DOM.viewport.classList.add('panning');
            return;
        }

        if (e.button !== 0) return; // Left click only for actions

        const portTarget = e.target.closest('.node-port');
        if (portTarget) {
            // Start Port Connection Drag
            state.isConnecting = true;
            state.connectStartPort = {
                nodeId: portTarget.dataset.nodeId,
                portId: portTarget.dataset.portId
            };

            const node = state.nodes.find(n => n.id === portTarget.dataset.nodeId);
            const startCoords = getNodePortCoords(node, portTarget.dataset.portId);
            DOM.tempEdgePath.setAttribute('d', `M ${startCoords.x},${startCoords.y} L ${startCoords.x},${startCoords.y}`);
            DOM.tempEdgePath.style.display = 'block';
            return;
        }

        const resizeTarget = e.target.closest('.resize-handle');
        if (resizeTarget) {
            // Start Node Resizing
            state.isResizingNode = true;
            state.resizeNodeId = resizeTarget.dataset.nodeId;
            const node = state.nodes.find(n => n.id === state.resizeNodeId);
            state.resizeInitialBounds = { x: node.x, y: node.y, width: node.width, height: node.height };
            state.dragMouseStart = { x: e.clientX, y: e.clientY };
            return;
        }

        const nodeTarget = e.target.closest('.flow-node-group');
        if (nodeTarget) {
            // Node Selection & Drag Start
            const nodeId = nodeTarget.dataset.nodeId;
            
            if (e.shiftKey) {
                // Toggle selection
                if (state.selectedNodeIds.has(nodeId)) state.selectedNodeIds.delete(nodeId);
                else state.selectedNodeIds.add(nodeId);
            } else if (!state.selectedNodeIds.has(nodeId)) {
                state.selectedNodeIds.clear();
                state.selectedEdgeIds.clear();
                state.selectedNodeIds.add(nodeId);
            }

            state.isDraggingNode = true;
            state.dragMouseStart = { x: e.clientX, y: e.clientY };
            state.dragNodeStartPos.clear();
            state.selectedNodeIds.forEach(id => {
                const n = state.nodes.find(item => item.id === id);
                if (n) state.dragNodeStartPos.set(id, { x: n.x, y: n.y });
            });

            render();
            return;
        }

        const edgeTarget = e.target.closest('.edge-group');
        if (edgeTarget) {
            // Edge Selection
            const edgeId = edgeTarget.dataset.edgeId;
            if (!e.shiftKey) {
                state.selectedNodeIds.clear();
                state.selectedEdgeIds.clear();
            }
            state.selectedEdgeIds.add(edgeId);
            render();
            return;
        }

        // Click on empty canvas background -> Marquee Selection Start
        if (!e.shiftKey) {
            state.selectedNodeIds.clear();
            state.selectedEdgeIds.clear();
            render();
        }

        state.isMarquee = true;
        const coords = clientToCanvasCoords(e.clientX, e.clientY);
        state.marqueeStart = coords;
        DOM.marqueeRect.setAttribute('x', coords.x.toString());
        DOM.marqueeRect.setAttribute('y', coords.y.toString());
        DOM.marqueeRect.setAttribute('width', '0');
        DOM.marqueeRect.setAttribute('height', '0');
        DOM.marqueeRect.style.display = 'block';
    }

    function handleWindowMouseMove(e) {
        if (state.isPanning) {
            state.pan.x = e.clientX - state.panStart.x;
            state.pan.y = e.clientY - state.panStart.y;
            updateTransform();
            return;
        }

        if (state.isConnecting) {
            const currentCoords = clientToCanvasCoords(e.clientX, e.clientY);
            const node = state.nodes.find(n => n.id === state.connectStartPort.nodeId);
            const startCoords = getNodePortCoords(node, state.connectStartPort.portId);
            const pathStr = calculateEdgePath(startCoords, state.connectStartPort.portId, currentCoords, 'center', 'orthogonal');
            DOM.tempEdgePath.setAttribute('d', pathStr);
            return;
        }

        if (state.isResizingNode) {
            const dx = (e.clientX - state.dragMouseStart.x) / state.zoom;
            const dy = (e.clientY - state.dragMouseStart.y) / state.zoom;
            const node = state.nodes.find(n => n.id === state.resizeNodeId);
            if (node) {
                node.width = Math.max(50, snapValue(state.resizeInitialBounds.width + dx));
                node.height = Math.max(30, snapValue(state.resizeInitialBounds.height + dy));
                render();
            }
            return;
        }

        if (state.isDraggingNode) {
            const dx = (e.clientX - state.dragMouseStart.x) / state.zoom;
            const dy = (e.clientY - state.dragMouseStart.y) / state.zoom;

            state.selectedNodeIds.forEach(id => {
                const initial = state.dragNodeStartPos.get(id);
                const node = state.nodes.find(n => n.id === id);
                if (initial && node) {
                    node.x = snapValue(initial.x + dx);
                    node.y = snapValue(initial.y + dy);
                }
            });

            renderNodes();
            renderEdges();
            return;
        }

        if (state.isMarquee) {
            const currentCoords = clientToCanvasCoords(e.clientX, e.clientY);
            const x = Math.min(state.marqueeStart.x, currentCoords.x);
            const y = Math.min(state.marqueeStart.y, currentCoords.y);
            const w = Math.abs(currentCoords.x - state.marqueeStart.x);
            const h = Math.abs(currentCoords.y - state.marqueeStart.y);

            DOM.marqueeRect.setAttribute('x', x.toString());
            DOM.marqueeRect.setAttribute('y', y.toString());
            DOM.marqueeRect.setAttribute('width', w.toString());
            DOM.marqueeRect.setAttribute('height', h.toString());

            // Select nodes inside box
            state.nodes.forEach(node => {
                if (node.x >= x && node.x + node.width <= x + w &&
                    node.y >= y && node.y + node.height <= y + h) {
                    state.selectedNodeIds.add(node.id);
                }
            });
            renderNodes();
            updateInspector();
            return;
        }
    }

    function handleWindowMouseUp(e) {
        if (state.isPanning) {
            state.isPanning = false;
            if (state.activeTool !== 'pan') DOM.viewport.classList.remove('panning');
            return;
        }

        if (state.isConnecting) {
            state.isConnecting = false;
            DOM.tempEdgePath.style.display = 'none';

            const portTarget = document.elementFromPoint(e.clientX, e.clientY)?.closest('.node-port');
            if (portTarget) {
                const toNodeId = portTarget.dataset.nodeId;
                const toPortId = portTarget.dataset.portId;

                if (toNodeId !== state.connectStartPort.nodeId) {
                    saveHistory();
                    const newEdge = {
                        id: generateId('edge'),
                        fromNodeId: state.connectStartPort.nodeId,
                        fromPort: state.connectStartPort.portId,
                        toNodeId: toNodeId,
                        toPort: toPortId,
                        label: '',
                        routing: 'orthogonal',
                        style: 'solid',
                        stroke: 'var(--edge-color-default)',
                        strokeWidth: 2.5
                    };
                    state.edges.push(newEdge);
                    state.selectedNodeIds.clear();
                    state.selectedEdgeIds.clear();
                    state.selectedEdgeIds.add(newEdge.id);
                    render();
                }
            }
            return;
        }

        if (state.isResizingNode || state.isDraggingNode) {
            saveHistory();
            state.isResizingNode = false;
            state.isDraggingNode = false;
            updateInspector();
            return;
        }

        if (state.isMarquee) {
            state.isMarquee = false;
            DOM.marqueeRect.style.display = 'none';
            return;
        }
    }

    function handleViewportWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        zoomAtPoint(zoomFactor, e.clientX, e.clientY);
    }

    function zoomBy(factor) {
        const rect = DOM.viewport.getBoundingClientRect();
        zoomAtPoint(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    function zoomAtPoint(factor, clientX, clientY) {
        const newZoom = Math.min(Math.max(0.25, state.zoom * factor), 3.0);
        if (newZoom === state.zoom) return;

        const rect = DOM.viewport.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        state.pan.x = mouseX - (mouseX - state.pan.x) * (newZoom / state.zoom);
        state.pan.y = mouseY - (mouseY - state.pan.y) * (newZoom / state.zoom);
        state.zoom = newZoom;

        updateTransform();
    }

    function zoomToFit() {
        if (state.nodes.length === 0) {
            state.zoom = 1.0;
            state.pan = { x: 40, y: 40 };
            updateTransform();
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        state.nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + n.width);
            maxY = Math.max(maxY, n.y + n.height);
        });

        const padding = 60;
        const rect = DOM.viewport.getBoundingClientRect();
        const contentW = (maxX - minX) + padding * 2;
        const contentH = (maxY - minY) + padding * 2;

        const scaleX = rect.width / contentW;
        const scaleY = rect.height / contentH;
        state.zoom = Math.min(Math.max(0.3, Math.min(scaleX, scaleY)), 1.5);

        state.pan.x = (rect.width - (maxX - minX) * state.zoom) / 2 - minX * state.zoom;
        state.pan.y = (rect.height - (maxY - minY) * state.zoom) / 2 - minY * state.zoom;
        updateTransform();
    }

    function handleViewportDblClick(e) {
        const nodeTarget = e.target.closest('.flow-node-group');
        if (nodeTarget) {
            const node = state.nodes.find(n => n.id === nodeTarget.dataset.nodeId);
            if (node) {
                const newText = prompt('ノードのテキストを入力してください:', node.text || '');
                if (newText !== null) {
                    saveHistory();
                    node.text = newText;
                    render();
                }
            }
            return;
        }

        const edgeTarget = e.target.closest('.edge-group');
        if (edgeTarget) {
            const edge = state.edges.find(e => e.id === edgeTarget.dataset.edgeId);
            if (edge) {
                const newLabel = prompt('接続線のラベルを入力してください (例: はい, いいえ):', edge.label || '');
                if (newLabel !== null) {
                    saveHistory();
                    edge.label = newLabel;
                    render();
                }
            }
            return;
        }
    }

    // --- Drag & Drop Palette ---
    function setupDragAndDropPalette() {
        const paletteItems = document.querySelectorAll('.palette-item');
        paletteItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                    shape: item.dataset.shape
                }));
            });

            item.addEventListener('click', () => {
                // Click to add shape at canvas center
                const rect = DOM.viewport.getBoundingClientRect();
                const centerCoords = clientToCanvasCoords(rect.left + rect.width / 2, rect.top + rect.height / 2);
                addNewNode(item.dataset.shape, centerCoords.x - 70, centerCoords.y - 30);
            });
        });

        DOM.viewport.addEventListener('dragover', (e) => e.preventDefault());

        DOM.viewport.addEventListener('drop', (e) => {
            e.preventDefault();
            const dataStr = e.dataTransfer.getData('application/json');
            if (dataStr) {
                try {
                    const data = JSON.parse(dataStr);
                    const coords = clientToCanvasCoords(e.clientX, e.clientY);
                    const spec = SHAPE_SPECS[data.shape] || SHAPE_SPECS.process;
                    addNewNode(data.shape, coords.x - spec.defaultW / 2, coords.y - spec.defaultH / 2);
                } catch (err) {
                    console.error(err);
                }
            }
        });
    }

    function addNewNode(shape, x, y) {
        saveHistory();
        const spec = SHAPE_SPECS[shape] || SHAPE_SPECS.process;
        const newNode = {
            id: generateId('node'),
            shape: shape,
            text: spec.label,
            x: snapValue(x),
            y: snapValue(y),
            width: spec.defaultW,
            height: spec.defaultH,
            fill: shape === 'note' ? '#fef08a' : 'var(--node-bg-default)',
            stroke: shape === 'note' ? '#eab308' : 'var(--node-stroke-default)',
            textColor: shape === 'note' ? '#713f12' : 'var(--text-color)',
            fontSize: 14
        };

        state.nodes.push(newNode);
        state.selectedNodeIds.clear();
        state.selectedEdgeIds.clear();
        state.selectedNodeIds.add(newNode.id);
        render();
    }

    // --- Inspector Events Setup ---
    function setupInspectorEvents() {
        DOM.nodePropText.addEventListener('input', () => {
            const selNode = getSingleSelectedNode();
            if (selNode) {
                saveHistory();
                selNode.text = DOM.nodePropText.value;
                render();
            }
        });

        DOM.nodePropShape.addEventListener('change', () => {
            const selNode = getSingleSelectedNode();
            if (selNode) {
                saveHistory();
                selNode.shape = DOM.nodePropShape.value;
                render();
            }
        });

        DOM.nodePropFontSize.addEventListener('change', () => {
            const selNode = getSingleSelectedNode();
            if (selNode) {
                saveHistory();
                selNode.fontSize = parseInt(DOM.nodePropFontSize.value, 10);
                render();
            }
        });

        DOM.nodePropFill.addEventListener('input', () => {
            const selNode = getSingleSelectedNode();
            if (selNode) {
                saveHistory();
                selNode.fill = DOM.nodePropFill.value;
                render();
            }
        });

        DOM.nodePropStroke.addEventListener('input', () => {
            const selNode = getSingleSelectedNode();
            if (selNode) {
                saveHistory();
                selNode.stroke = DOM.nodePropStroke.value;
                render();
            }
        });

        DOM.nodePropWidth.addEventListener('change', () => {
            const selNode = getSingleSelectedNode();
            if (selNode) {
                saveHistory();
                selNode.width = Math.max(40, parseInt(DOM.nodePropWidth.value, 10));
                render();
            }
        });

        DOM.nodePropHeight.addEventListener('change', () => {
            const selNode = getSingleSelectedNode();
            if (selNode) {
                saveHistory();
                selNode.height = Math.max(30, parseInt(DOM.nodePropHeight.value, 10));
                render();
            }
        });

        // Color Swatches
        document.querySelectorAll('#node-color-presets .color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                const selNode = getSingleSelectedNode();
                if (selNode) {
                    saveHistory();
                    selNode.fill = swatch.dataset.fill;
                    selNode.stroke = swatch.dataset.stroke;
                    selNode.textColor = swatch.dataset.color || 'var(--text-color)';
                    render();
                }
            });
        });

        // Layer Ordering
        DOM.btnBringFront.addEventListener('click', () => {
            const selNode = getSingleSelectedNode();
            if (selNode) {
                saveHistory();
                state.nodes = state.nodes.filter(n => n.id !== selNode.id);
                state.nodes.push(selNode);
                render();
            }
        });

        DOM.btnSendBack.addEventListener('click', () => {
            const selNode = getSingleSelectedNode();
            if (selNode) {
                saveHistory();
                state.nodes = state.nodes.filter(n => n.id !== selNode.id);
                state.nodes.unshift(selNode);
                render();
            }
        });

        DOM.btnDuplicateNode.addEventListener('click', duplicateSelectedItems);
        DOM.btnDeleteItem.addEventListener('click', deleteSelectedItems);

        // Edge Inspector
        DOM.edgePropLabel.addEventListener('input', () => {
            const selEdge = getSingleSelectedEdge();
            if (selEdge) {
                saveHistory();
                selEdge.label = DOM.edgePropLabel.value;
                render();
            }
        });

        DOM.edgePropRouting.addEventListener('change', () => {
            const selEdge = getSingleSelectedEdge();
            if (selEdge) {
                saveHistory();
                selEdge.routing = DOM.edgePropRouting.value;
                render();
            }
        });

        DOM.edgePropStyle.addEventListener('change', () => {
            const selEdge = getSingleSelectedEdge();
            if (selEdge) {
                saveHistory();
                selEdge.style = DOM.edgePropStyle.value;
                render();
            }
        });

        DOM.edgePropColor.addEventListener('input', () => {
            const selEdge = getSingleSelectedEdge();
            if (selEdge) {
                saveHistory();
                selEdge.stroke = DOM.edgePropColor.value;
                render();
            }
        });

        DOM.edgePropWidth.addEventListener('change', () => {
            const selEdge = getSingleSelectedEdge();
            if (selEdge) {
                saveHistory();
                selEdge.strokeWidth = parseFloat(DOM.edgePropWidth.value);
                render();
            }
        });

        DOM.btnDeleteEdge.addEventListener('click', deleteSelectedItems);

        // Multi Select Alignment
        DOM.btnAlignLeft.addEventListener('click', () => alignSelectedNodes('left'));
        DOM.btnAlignCenterH.addEventListener('click', () => alignSelectedNodes('centerH'));
        DOM.btnAlignRight.addEventListener('click', () => alignSelectedNodes('right'));
        DOM.btnAlignTop.addEventListener('click', () => alignSelectedNodes('top'));
        DOM.btnAlignCenterV.addEventListener('click', () => alignSelectedNodes('centerV'));
        DOM.btnAlignBottom.addEventListener('click', () => alignSelectedNodes('bottom'));
        DOM.btnDeleteMulti.addEventListener('click', deleteSelectedItems);
    }

    function getSingleSelectedNode() {
        if (state.selectedNodeIds.size === 1) {
            const id = Array.from(state.selectedNodeIds)[0];
            return state.nodes.find(n => n.id === id);
        }
        return null;
    }

    function getSingleSelectedEdge() {
        if (state.selectedEdgeIds.size === 1) {
            const id = Array.from(state.selectedEdgeIds)[0];
            return state.edges.find(e => e.id === id);
        }
        return null;
    }

    function alignSelectedNodes(type) {
        const nodes = Array.from(state.selectedNodeIds).map(id => state.nodes.find(n => n.id === id)).filter(Boolean);
        if (nodes.length < 2) return;

        saveHistory();
        if (type === 'left') {
            const minX = Math.min(...nodes.map(n => n.x));
            nodes.forEach(n => n.x = minX);
        } else if (type === 'centerH') {
            const avgCx = nodes.reduce((sum, n) => sum + (n.x + n.width / 2), 0) / nodes.length;
            nodes.forEach(n => n.x = snapValue(avgCx - n.width / 2));
        } else if (type === 'right') {
            const maxRight = Math.max(...nodes.map(n => n.x + n.width));
            nodes.forEach(n => n.x = maxRight - n.width);
        } else if (type === 'top') {
            const minY = Math.min(...nodes.map(n => n.y));
            nodes.forEach(n => n.y = minY);
        } else if (type === 'centerV') {
            const avgCy = nodes.reduce((sum, n) => sum + (n.y + n.height / 2), 0) / nodes.length;
            nodes.forEach(n => n.y = snapValue(avgCy - n.height / 2));
        } else if (type === 'bottom') {
            const maxBottom = Math.max(...nodes.map(n => n.y + n.height));
            nodes.forEach(n => n.y = maxBottom - n.height);
        }

        render();
    }

    function deleteSelectedItems() {
        if (state.selectedNodeIds.size === 0 && state.selectedEdgeIds.size === 0) return;

        saveHistory();
        state.nodes = state.nodes.filter(n => !state.selectedNodeIds.has(n.id));
        state.edges = state.edges.filter(e => {
            const isEdgeSel = state.selectedEdgeIds.has(e.id);
            const isNodeDeleted = state.selectedNodeIds.has(e.fromNodeId) || state.selectedNodeIds.has(e.toNodeId);
            return !isEdgeSel && !isNodeDeleted;
        });

        state.selectedNodeIds.clear();
        state.selectedEdgeIds.clear();
        render();
    }

    function duplicateSelectedItems() {
        if (state.selectedNodeIds.size === 0) return;

        saveHistory();
        const idMapping = new Map();
        const newNodes = [];

        state.selectedNodeIds.forEach(id => {
            const oldNode = state.nodes.find(n => n.id === id);
            if (oldNode) {
                const newId = generateId('node');
                idMapping.set(id, newId);
                const cloned = JSON.parse(JSON.stringify(oldNode));
                cloned.id = newId;
                cloned.x += 30;
                cloned.y += 30;
                newNodes.push(cloned);
            }
        });

        state.nodes.push(...newNodes);

        // Also duplicate internal edges between selected nodes
        const newEdges = [];
        state.edges.forEach(e => {
            if (idMapping.has(e.fromNodeId) && idMapping.has(e.toNodeId)) {
                const clonedEdge = JSON.parse(JSON.stringify(e));
                clonedEdge.id = generateId('edge');
                clonedEdge.fromNodeId = idMapping.get(e.fromNodeId);
                clonedEdge.toNodeId = idMapping.get(e.toNodeId);
                newEdges.push(clonedEdge);
            }
        });
        state.edges.push(...newEdges);

        state.selectedNodeIds.clear();
        state.selectedEdgeIds.clear();
        newNodes.forEach(n => state.selectedNodeIds.add(n.id));
        render();
    }

    function handleKeyDown(e) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            deleteSelectedItems();
        } else if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            undo();
        } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
            e.preventDefault();
            redo();
        } else if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            duplicateSelectedItems();
        } else if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            state.selectedNodeIds.clear();
            state.nodes.forEach(n => state.selectedNodeIds.add(n.id));
            render();
        } else if (e.key === 'v' || e.key === 'V') {
            setTool('select');
        } else if (e.key === 'h' || e.key === 'H') {
            setTool('pan');
        }
    }

    function clearCanvas() {
        if (state.nodes.length === 0) return;
        if (confirm('キャンバス上のすべての図形と接続線を削除してもよろしいですか？')) {
            saveHistory();
            state.nodes = [];
            state.edges = [];
            state.selectedNodeIds.clear();
            state.selectedEdgeIds.clear();
            render();
        }
    }

    function toggleTheme() {
        const isDark = DOM.appContainer.classList.contains('theme-dark');
        DOM.appContainer.classList.toggle('theme-dark', !isDark);
        DOM.appContainer.classList.toggle('theme-light', isDark);
    }

    // --- Export & File Operations ---
    function saveJson() {
        const data = {
            version: '1.0',
            nodes: state.nodes,
            edges: state.edges
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowchart_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function loadJsonFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
                    saveHistory();
                    state.nodes = data.nodes;
                    state.edges = data.edges;
                    state.selectedNodeIds.clear();
                    state.selectedEdgeIds.clear();
                    zoomToFit();
                    render();
                } else {
                    alert('有効なフローチャートJSONファイルではありません。');
                }
            } catch (err) {
                alert('JSONファイルの解析エラーが発生しました。');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function exportSvg() {
        // Deselect for clean export
        state.selectedNodeIds.clear();
        state.selectedEdgeIds.clear();
        render();

        const svgClone = DOM.svgCanvas.cloneNode(true);
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Inline css variables
        const isDark = DOM.appContainer.classList.contains('theme-dark');
        const style = document.createElement('style');
        style.textContent = `
            .node-body { fill: ${isDark ? '#1e293b' : '#ffffff'}; stroke: ${isDark ? '#475569' : '#cbd5e1'}; }
            .node-text { fill: ${isDark ? '#f8fafc' : '#1e293b'}; font-family: sans-serif; font-size: 14px; text-anchor: middle; dominant-baseline: central; }
            .edge-path { fill: none; stroke: ${isDark ? '#94a3b8' : '#64748b'}; stroke-width: 2.5px; }
            .edge-label-bg { fill: ${isDark ? '#1e293b' : '#ffffff'}; stroke: ${isDark ? '#475569' : '#cbd5e1'}; }
            .edge-label-text { fill: ${isDark ? '#f8fafc' : '#1e293b'}; font-size: 11px; font-family: sans-serif; text-anchor: middle; dominant-baseline: central; }
        `;
        svgClone.prepend(style);

        const svgString = new XMLSerializer().serializeToString(svgClone);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowchart_${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportPng() {
        state.selectedNodeIds.clear();
        state.selectedEdgeIds.clear();
        render();

        const svgClone = DOM.svgCanvas.cloneNode(true);
        const isDark = DOM.appContainer.classList.contains('theme-dark');
        const style = document.createElement('style');
        style.textContent = `
            .node-body { fill: ${isDark ? '#1e293b' : '#ffffff'}; stroke: ${isDark ? '#475569' : '#cbd5e1'}; }
            .node-text { fill: ${isDark ? '#f8fafc' : '#1e293b'}; font-family: sans-serif; font-size: 14px; text-anchor: middle; dominant-baseline: central; }
            .edge-path { fill: none; stroke: ${isDark ? '#94a3b8' : '#64748b'}; stroke-width: 2.5px; }
            .edge-label-bg { fill: ${isDark ? '#1e293b' : '#ffffff'}; stroke: ${isDark ? '#475569' : '#cbd5e1'}; }
            .edge-label-text { fill: ${isDark ? '#f8fafc' : '#1e293b'}; font-size: 11px; font-family: sans-serif; text-anchor: middle; dominant-baseline: central; }
        `;
        svgClone.prepend(style);

        const svgString = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = DOM.viewport.clientWidth * 2;
            canvas.height = DOM.viewport.clientHeight * 2;
            const ctx = canvas.getContext('2d');
            ctx.scale(2, 2);

            // Fill background
            ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(image, 0, 0);

            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `flowchart_${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(blobURL);
        };
        image.src = blobURL;
    }

    // --- Modal Controls ---
    function showModal(id) {
        document.getElementById(id).style.display = 'flex';
    }
    function hideModal(id) {
        document.getElementById(id).style.display = 'none';
    }

    // --- Prebuilt Template Preset Loaders ---
    function loadInitialTemplate() {
        loadPresetTemplate('login-auth');
    }

    function loadPresetTemplate(key) {
        saveHistory();
        state.selectedNodeIds.clear();
        state.selectedEdgeIds.clear();

        if (key === 'login-auth') {
            state.nodes = [
                { id: 'n1', shape: 'start-end', text: 'ユーザーログイン', x: 280, y: 40, width: 140, height: 50, fill: 'rgba(59, 130, 246, 0.2)', stroke: '#3b82f6', textColor: '#60a5fa', fontSize: 14 },
                { id: 'n2', shape: 'io', text: 'ID・パスワード入力', x: 270, y: 130, width: 160, height: 55, fill: 'var(--node-bg-default)', stroke: 'var(--node-stroke-default)', textColor: 'var(--text-color)', fontSize: 14 },
                { id: 'n3', shape: 'decision', text: '認証成功？', x: 280, y: 230, width: 140, height: 75, fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b', textColor: '#fbbf24', fontSize: 14 },
                { id: 'n4', shape: 'database', text: '会員DB', x: 500, y: 232, width: 120, height: 70, fill: 'rgba(168, 85, 247, 0.2)', stroke: '#a855f7', textColor: '#c084fc', fontSize: 14 },
                { id: 'n5', shape: 'process', text: 'マイページ表示', x: 270, y: 350, width: 160, height: 60, fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981', textColor: '#34d399', fontSize: 14 },
                { id: 'n6', shape: 'process', text: 'エラーメッセージ表示\n(再入力案内)', x: 60, y: 237, width: 170, height: 60, fill: 'rgba(244, 63, 94, 0.2)', stroke: '#f43f5e', textColor: '#fb7185', fontSize: 13 },
                { id: 'n7', shape: 'start-end', text: 'ログイン完了', x: 280, y: 450, width: 140, height: 50, fill: 'rgba(59, 130, 246, 0.2)', stroke: '#3b82f6', textColor: '#60a5fa', fontSize: 14 }
            ];
            state.edges = [
                { id: 'e1', fromNodeId: 'n1', fromPort: 'bottom', toNodeId: 'n2', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' },
                { id: 'e2', fromNodeId: 'n2', fromPort: 'bottom', toNodeId: 'n3', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' },
                { id: 'e3', fromNodeId: 'n3', fromPort: 'right', toNodeId: 'n4', toPort: 'left', label: '照会', routing: 'orthogonal', style: 'dashed' },
                { id: 'e4', fromNodeId: 'n3', fromPort: 'bottom', toNodeId: 'n5', toPort: 'top', label: 'はい', routing: 'orthogonal', style: 'solid' },
                { id: 'e5', fromNodeId: 'n3', fromPort: 'left', toNodeId: 'n6', toPort: 'right', label: 'いいえ', routing: 'orthogonal', style: 'solid' },
                { id: 'e6', fromNodeId: 'n6', fromPort: 'top', toNodeId: 'n2', toPort: 'left', label: 'リトライ', routing: 'orthogonal', style: 'solid' },
                { id: 'e7', fromNodeId: 'n5', fromPort: 'bottom', toNodeId: 'n7', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' }
            ];
        } else if (key === 'order-process') {
            state.nodes = [
                { id: 'n1', shape: 'start-end', text: '注文開始', x: 280, y: 40, width: 130, height: 50, fill: 'rgba(59, 130, 246, 0.2)', stroke: '#3b82f6', textColor: '#60a5fa', fontSize: 14 },
                { id: 'n2', shape: 'io', text: 'カート情報送信', x: 265, y: 125, width: 160, height: 55, fill: 'var(--node-bg-default)', stroke: 'var(--node-stroke-default)', textColor: 'var(--text-color)', fontSize: 14 },
                { id: 'n3', shape: 'decision', text: '在庫あり？', x: 280, y: 220, width: 130, height: 70, fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b', textColor: '#fbbf24', fontSize: 14 },
                { id: 'n4', shape: 'process', text: 'クレジットカード決済処理', x: 255, y: 330, width: 180, height: 60, fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981', textColor: '#34d399', fontSize: 14 },
                { id: 'n5', shape: 'document', text: '注文確認メール配信', x: 260, y: 430, width: 170, height: 65, fill: 'rgba(6, 182, 212, 0.2)', stroke: '#06b6d4', textColor: '#22d3ee', fontSize: 13 },
                { id: 'n6', shape: 'subprocess', text: '倉庫出荷指示データ生成', x: 250, y: 535, width: 190, height: 60, fill: 'rgba(168, 85, 247, 0.2)', stroke: '#a855f7', textColor: '#c084fc', fontSize: 13 },
                { id: 'n7', shape: 'start-end', text: '注文受託完了', x: 280, y: 635, width: 130, height: 50, fill: 'rgba(59, 130, 246, 0.2)', stroke: '#3b82f6', textColor: '#60a5fa', fontSize: 14 },
                { id: 'n8', shape: 'process', text: '在庫切れキャンセル通知', x: 70, y: 225, width: 170, height: 60, fill: 'rgba(244, 63, 94, 0.2)', stroke: '#f43f5e', textColor: '#fb7185', fontSize: 13 }
            ];
            state.edges = [
                { id: 'e1', fromNodeId: 'n1', fromPort: 'bottom', toNodeId: 'n2', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' },
                { id: 'e2', fromNodeId: 'n2', fromPort: 'bottom', toNodeId: 'n3', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' },
                { id: 'e3', fromNodeId: 'n3', fromPort: 'bottom', toNodeId: 'n4', toPort: 'top', label: 'OK', routing: 'orthogonal', style: 'solid' },
                { id: 'e4', fromNodeId: 'n3', fromPort: 'left', toNodeId: 'n8', toPort: 'right', label: 'なし', routing: 'orthogonal', style: 'solid' },
                { id: 'e5', fromNodeId: 'n4', fromPort: 'bottom', toNodeId: 'n5', toPort: 'top', label: '決済成功', routing: 'orthogonal', style: 'solid' },
                { id: 'e6', fromNodeId: 'n5', fromPort: 'bottom', toNodeId: 'n6', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' },
                { id: 'e7', fromNodeId: 'n6', fromPort: 'bottom', toNodeId: 'n7', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' }
            ];
        } else if (key === 'prime-algorithm') {
            state.nodes = [
                { id: 'n1', shape: 'start-end', text: '開始', x: 280, y: 40, width: 120, height: 45, fill: 'rgba(59, 130, 246, 0.2)', stroke: '#3b82f6', textColor: '#60a5fa', fontSize: 14 },
                { id: 'n2', shape: 'io', text: '数値 N を入力', x: 265, y: 115, width: 150, height: 50, fill: 'var(--node-bg-default)', stroke: 'var(--node-stroke-default)', textColor: 'var(--text-color)', fontSize: 14 },
                { id: 'n3', shape: 'decision', text: 'N ≤ 1 ?', x: 280, y: 195, width: 120, height: 65, fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b', textColor: '#fbbf24', fontSize: 14 },
                { id: 'n4', shape: 'process', text: '変数 i = 2 に初期化', x: 260, y: 290, width: 160, height: 50, fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981', textColor: '#34d399', fontSize: 14 },
                { id: 'n5', shape: 'decision', text: 'i * i > N ?', x: 275, y: 370, width: 130, height: 70, fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b', textColor: '#fbbf24', fontSize: 14 },
                { id: 'n6', shape: 'decision', text: 'N mod i == 0 ?', x: 265, y: 475, width: 150, height: 70, fill: 'rgba(245, 158, 11, 0.2)', stroke: '#f59e0b', textColor: '#fbbf24', fontSize: 14 },
                { id: 'n7', shape: 'process', text: 'i = i + 1', x: 480, y: 485, width: 120, height: 50, fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981', textColor: '#34d399', fontSize: 14 },
                { id: 'n8', shape: 'io', text: '「素数である」表示', x: 70, y: 380, width: 160, height: 50, fill: 'rgba(6, 182, 212, 0.2)', stroke: '#06b6d4', textColor: '#22d3ee', fontSize: 13 },
                { id: 'n9', shape: 'io', text: '「素数ではない」表示', x: 70, y: 485, width: 160, height: 50, fill: 'rgba(244, 63, 94, 0.2)', stroke: '#f43f5e', textColor: '#fb7185', fontSize: 13 },
                { id: 'n10', shape: 'start-end', text: '終了', x: 90, y: 580, width: 120, height: 45, fill: 'rgba(59, 130, 246, 0.2)', stroke: '#3b82f6', textColor: '#60a5fa', fontSize: 14 }
            ];
            state.edges = [
                { id: 'e1', fromNodeId: 'n1', fromPort: 'bottom', toNodeId: 'n2', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' },
                { id: 'e2', fromNodeId: 'n2', fromPort: 'bottom', toNodeId: 'n3', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' },
                { id: 'e3', fromNodeId: 'n3', fromPort: 'bottom', toNodeId: 'n4', toPort: 'top', label: 'いいえ', routing: 'orthogonal', style: 'solid' },
                { id: 'e4', fromNodeId: 'n3', fromPort: 'left', toNodeId: 'n9', toPort: 'top', label: 'はい', routing: 'orthogonal', style: 'solid' },
                { id: 'e5', fromNodeId: 'n4', fromPort: 'bottom', toNodeId: 'n5', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' },
                { id: 'e6', fromNodeId: 'n5', fromPort: 'left', toNodeId: 'n8', toPort: 'right', label: 'はい', routing: 'orthogonal', style: 'solid' },
                { id: 'e7', fromNodeId: 'n5', fromPort: 'bottom', toNodeId: 'n6', toPort: 'top', label: 'いいえ', routing: 'orthogonal', style: 'solid' },
                { id: 'e8', fromNodeId: 'n6', fromPort: 'left', toNodeId: 'n9', toPort: 'right', label: 'はい', routing: 'orthogonal', style: 'solid' },
                { id: 'e9', fromNodeId: 'n6', fromPort: 'right', toNodeId: 'n7', toPort: 'left', label: 'いいえ', routing: 'orthogonal', style: 'solid' },
                { id: 'e10', fromNodeId: 'n7', fromPort: 'top', toNodeId: 'n5', toPort: 'right', label: '', routing: 'orthogonal', style: 'solid' },
                { id: 'e11', fromNodeId: 'n8', fromPort: 'bottom', toNodeId: 'n10', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' },
                { id: 'e12', fromNodeId: 'n9', fromPort: 'bottom', toNodeId: 'n10', toPort: 'top', label: '', routing: 'orthogonal', style: 'solid' }
            ];
        }

        zoomToFit();
        render();
    }

    // Start App
    document.addEventListener('DOMContentLoaded', init);

})();
