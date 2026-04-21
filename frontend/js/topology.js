/**
 * Topology Visualization - D3.js 层次布局
 */

let svg = null;
let nodeMap = {};
let linkMap = {};

const nodeColors = {
    'core': '#2563eb',
    'agg': '#9333ea',
    'access': '#64748b',
    'host': '#16a34a',
    'server': '#ea580c'
};

const nodeRadius = {
    'core': 42,
    'agg': 36,
    'access': 28,
    'host': 22,
    'server': 28
};

function getNodeNameCN(nodeId) {
    if (window.NODE_NAMES_CN && window.NODE_NAMES_CN[nodeId]) {
        return window.NODE_NAMES_CN[nodeId];
    }
    return nodeId;
}

function renderTopology(data) {
    const container = document.getElementById('topologyContainer');
    const width = container.clientWidth || 1000;
    const height = 540;

    d3.select('#topologySvg').selectAll('*').remove();

    svg = d3.select('#topologySvg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const defs = svg.append('defs');

    // Drop shadow filter
    const shadow = defs.append('filter').attr('id', 'shadow');
    shadow.append('feDropShadow').attr('dx', '0').attr('dy', '3').attr('stdDeviation', '4').attr('flood-opacity', '0.2');

    // Glow filter
    const glow = defs.append('filter').attr('id', 'glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'coloredBlur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Gradients
    Object.entries(nodeColors).forEach(([type, color]) => {
        const gradient = defs.append('radialGradient').attr('id', `grad-${type}`).attr('cx', '35%').attr('cy', '35%');
        gradient.append('stop').attr('offset', '0%').attr('stop-color', d3.color(color).brighter(0.4));
        gradient.append('stop').attr('offset', '100%').attr('stop-color', color);
    });

    nodeMap = {};
    data.nodes.forEach(node => { nodeMap[node.id] = node; });

    linkMap = {};
    data.links.forEach(link => { linkMap[`${link.source}-${link.target}`] = link; });

    const layers = computeHierarchy(data);
    createHierarchicalLayout(layers, width, height);

    // Links
    svg.append('g').attr('class', 'links').selectAll('line')
        .data(data.links).enter().append('line')
        .attr('class', d => `link ${d.type || 'trunk'}`)
        .attr('x1', d => (nodeMap[d.source] || {}).x || 0)
        .attr('y1', d => (nodeMap[d.source] || {}).y || 0)
        .attr('x2', d => (nodeMap[d.target] || {}).x || 0)
        .attr('y2', d => (nodeMap[d.target] || {}).y || 0)
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '10,5');

    // Nodes
    const nodes = svg.append('g').attr('class', 'nodes').selectAll('g')
        .data(data.nodes).enter().append('g')
        .attr('class', 'node cursor-pointer')
        .attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);

    // Outer ring
    nodes.append('circle')
        .attr('r', d => (nodeRadius[d.subtype] || nodeRadius[d.type] || 15) + 8)
        .attr('fill', 'none')
        .attr('stroke', d => nodeColors[d.subtype || d.type] || '#999')
        .attr('stroke-width', 2)
        .attr('opacity', 0.2);

    // Main circle
    nodes.append('circle')
        .attr('class', 'node-circle')
        .attr('r', d => nodeRadius[d.subtype] || nodeRadius[d.type] || 15)
        .attr('fill', d => `url(#grad-${d.subtype || d.type})`)
        .attr('stroke', d => d.secure ? '#dc2626' : '#ffffff')
        .attr('stroke-width', d => d.secure ? 4 : 3)
        .attr('filter', 'url(#shadow)');

    // Label inside circle
    nodes.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', 'white')
        .attr('font-size', d => {
            const r = nodeRadius[d.subtype] || nodeRadius[d.type] || 15;
            return r < 24 ? '10px' : '12px';
        })
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none')
        .text(d => {
            const name = getNodeNameCN(d.id);
            return name.length > 5 ? name.substring(0, 4) + '..' : name;
        });

    // VLAN label below node
    nodes.filter(d => d.type === 'switch')
        .append('text')
        .attr('class', 'vlan-label')
        .attr('text-anchor', 'middle')
        .attr('dy', d => (nodeRadius[d.subtype] || nodeRadius[d.type] || 15) + 18)
        .attr('font-size', '11px')
        .attr('fill', '#64748b')
        .attr('font-weight', '500')
        .text(d => d.vlanName || '');

    // Tooltip
    nodes.on('mouseenter', function(event, d) { showTooltip(event, d); })
          .on('mouseleave', function() { hideTooltip(); });
}

function showTooltip(event, node) {
    hideTooltip();
    const tooltip = document.createElement('div');
    tooltip.id = 'nodeTooltip';
    tooltip.className = 'fixed z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl min-w-52 text-sm';

    const nameCN = getNodeNameCN(node.id);
    tooltip.innerHTML = `
        <div class="font-bold text-base mb-2 border-b border-gray-700 pb-2">${nameCN}</div>
        <div class="space-y-1">
            <div class="flex justify-between gap-4"><span class="text-gray-400">ID:</span><span class="font-medium">${node.id}</span></div>
            <div class="flex justify-between gap-4"><span class="text-gray-400">类型:</span><span>${node.type}${node.subtype ? ' - ' + node.subtype : ''}</span></div>
            ${node.ip ? `<div class="flex justify-between gap-4"><span class="text-gray-400">IP:</span><span>${node.ip}</span></div>` : ''}
            ${node.vlan ? `<div class="flex justify-between gap-4"><span class="text-gray-400">VLAN:</span><span>${node.vlan}</span></div>` : ''}
            ${node.secure ? '<div class="text-red-400 mt-2 font-medium">🔒 安全区域</div>' : ''}
        </div>
    `;
    document.body.appendChild(tooltip);

    const rect = tooltip.getBoundingClientRect();
    let left = event.pageX + 15;
    let top = event.pageY - rect.height - 10;
    if (left + rect.width > window.innerWidth) left = event.pageX - rect.width - 15;
    if (top < 0) top = event.pageY + 15;

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';

    d3.select(event.currentTarget).select('.node-circle')
        .transition().duration(200)
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 4);
}

function hideTooltip() {
    const t = document.getElementById('nodeTooltip');
    if (t) t.remove();
    d3.selectAll('.node-circle').transition().duration(200)
        .attr('stroke', d => d.secure ? '#dc2626' : '#ffffff')
        .attr('stroke-width', d => d.secure ? 4 : 3);
}

function computeHierarchy(data) {
    const layers = { core: [], agg: [], access: [], hosts: [] };
    data.nodes.forEach(node => {
        if (node.type === 'switch') {
            if (node.subtype === 'core') layers.core.push(node);
            else if (node.subtype === 'agg') layers.agg.push(node);
            else if (node.subtype === 'access') layers.access.push(node);
        } else if (node.type === 'host' || node.type === 'server') {
            layers.hosts.push(node);
        }
    });
    return layers;
}

function createHierarchicalLayout(layers, width, height) {
    const padding = 60;
    const usableWidth = width - 2 * padding;
    const usableHeight = height - 2 * padding;
    const layerSpacing = usableHeight / 4;

    // Core - centered at top
    if (layers.core.length > 0) {
        layers.core[0].x = width / 2;
        layers.core[0].y = padding + layerSpacing * 0.5;
    }

    // Aggregation layer - spread evenly
    const aggSpacing = usableWidth / (layers.agg.length + 1);
    layers.agg.forEach((node, i) => {
        node.x = padding + aggSpacing * (i + 1);
        node.y = padding + layerSpacing * 1.5;
    });

    // Access layer - more spacing
    const accSpacing = usableWidth / (layers.access.length + 1);
    layers.access.forEach((node, i) => {
        node.x = padding + accSpacing * (i + 1);
        node.y = padding + layerSpacing * 2.5;
    });

    // Hosts layer - even more spacing
    const hostSpacing = usableWidth / (layers.hosts.length + 1);
    layers.hosts.forEach((node, i) => {
        node.x = padding + hostSpacing * (i + 1);
        node.y = padding + layerSpacing * 3.5;
    });
}

function highlightPathOnTopology(src, dst, success) {
    const srcNode = nodeMap[src], dstNode = nodeMap[dst];
    if (!srcNode || !dstNode) return;

    const path = findPath(srcNode, dstNode);

    d3.selectAll('.link')
        .transition().duration(300)
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '10,5');

    for (let i = 0; i < path.length - 1; i++) {
        const link = linkMap[`${path[i].id}-${path[i+1].id}`];
        if (link) {
            d3.selectAll('.link')
                .filter(d => d.source === link.source && d.target === link.target)
                .transition().duration(300)
                .attr('stroke', success ? '#16a34a' : '#dc2626')
                .attr('stroke-width', 4)
                .attr('stroke-dasharray', '0');
        }
    }

    d3.selectAll('.node circle:first-child')
        .transition().duration(300)
        .attr('opacity', d => path.some(p => p.id === d.id) ? 1 : 0.25);
}

function findPath(src, dst) {
    const path = [src];
    let current = src;
    while (current.type !== 'switch' || current.subtype !== 'core') {
        let found = null;
        for (const [, link] of Object.entries(linkMap)) {
            if (link.source === current.id || link.target === current.id) {
                const peer = link.source === current.id ? link.target : link.source;
                const peerNode = nodeMap[peer];
                if (peerNode && peerNode.type === 'switch') {
                    if (current.subtype === 'host' || current.subtype === 'server') { found = peerNode; break; }
                    else if (peerNode.subtype === 'core') { found = peerNode; break; }
                    else if (current.subtype === 'access' && peerNode.subtype === 'agg') { found = peerNode; break; }
                    else if (current.subtype === 'agg' && peerNode.subtype === 'core') { found = peerNode; break; }
                }
            }
        }
        if (found) { path.push(found); current = found; } else break;
    }
    if (!path.some(p => p.id === dst.id)) path.push(dst);
    return path;
}

function highlightACLOnTopology() {
    d3.selectAll('.link').transition().duration(500)
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 3);
}

function clearTopology() {
    d3.selectAll('.link').transition().duration(300)
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '10,5');
    d3.selectAll('.node circle').transition().duration(300)
        .attr('opacity', 1);
}

window.highlightPathOnTopology = highlightPathOnTopology;
window.highlightACLOnTopology = highlightACLOnTopology;
window.clearTopology = clearTopology;