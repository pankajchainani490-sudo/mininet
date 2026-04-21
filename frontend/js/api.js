/**
 * API Client - 前端独立演示（无后端依赖）
 * 所有数据从 topology_data.js 获取
 */

// 调试日志
function apiDebug(msg) {
    console.log('[API] ' + msg);
}

/**
 * 获取网络拓扑（从本地 topology_data.js）
 */
async function getTopology() {
    try {
        const topologyData = generateTopology();
        apiDebug('Generated ' + topologyData.nodes.length + ' nodes');
        return topologyData;
    } catch (e) {
        apiDebug('ERROR in getTopology: ' + e.message);
        throw e;
    }
}

/**
 * 执行 ping 测试（本地模拟）
 */
async function ping(src, dst, count = 4) {
    const topologyData = generateTopology();
    return simulatePing(src, dst, topologyData);
}

/**
 * 获取 ACL 状态
 */
async function getACLStatus() {
    return {
        'switch': 'cs1',
        'flows': [
            'priority=607,ip,nw_src=10.0.10.0/24,nw_dst=10.0.50.0/24,actions=drop',
            'priority=606,ip,nw_src=10.0.11.0/24,nw_dst=10.0.50.0/24,actions=drop',
            'priority=605,ip,nw_src=10.0.10.0/24,nw_dst=10.0.60.0/24,actions=drop',
            'priority=604,ip,nw_src=10.0.11.0/24,nw_dst=10.0.60.0/24,actions=drop',
            'priority=603,ip,nw_src=10.0.90.0/24,nw_dst=10.0.0.0/8,actions=drop',
            'priority=602,ip,nw_src=10.0.10.0/24,nw_dst=10.0.100.0/24,actions=normal',
            'priority=602,ip,nw_src=10.0.11.0/24,nw_dst=10.0.100.0/24,actions=normal',
            'priority=1,ip,nw_src=0.0.0.0/0,nw_dst=0.0.0.0/0,actions=normal',
        ],
        'aclRules': ACL_RULES,
    };
}

/**
 * 在指定节点执行命令（演示模式下不支持）
 */
async function exec(node, command) {
    return {
        'node': node,
        'command': command,
        'output': '演示模式下不支持远程命令执行',
        'note': '如需真实测试，请在 Linux/WSL 中运行 Mininet 网络'
    };
}

// 导出全局 API
window.api = {
    getTopology,
    ping,
    getACLStatus,
    exec,
};
