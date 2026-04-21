/**
 * 拓扑数据 - 从 campus_network.py 提取
 * 此文件与 campus_network.py 的配置保持一致
 */

const VLAN_CONFIG = {
    'mgmt':      { 'id': 1,   'network': '10.0.1.0/24',   'gateway': '10.0.1.1' },
    'dormA':     { 'id': 10,  'network': '10.0.10.0/24', 'gateway': '10.0.10.1' },
    'dormB':     { 'id': 11,  'network': '10.0.11.0/24', 'gateway': '10.0.11.1' },
    'dormC':     { 'id': 12,  'network': '10.0.12.0/24', 'gateway': '10.0.12.1' },
    'canteen':   { 'id': 13,  'network': '10.0.13.0/24', 'gateway': '10.0.13.1' },
    'office':    { 'id': 20,  'network': '10.0.20.0/24', 'gateway': '10.0.20.1' },
    'lab':       { 'id': 21,  'network': '10.0.21.0/24', 'gateway': '10.0.21.1' },
    'library':   { 'id': 30,  'network': '10.0.30.0/24', 'gateway': '10.0.30.1' },
    'academic':  { 'id': 40,  'network': '10.0.40.0/24', 'gateway': '10.0.40.1' },
    'hr':         { 'id': 50,  'network': '10.0.50.0/24', 'gateway': '10.0.50.1', 'secure': true },
    'finance':   { 'id': 60,  'network': '10.0.60.0/24', 'gateway': '10.0.60.1', 'secure': true },
    'logistics': { 'id': 70,  'network': '10.0.70.0/24', 'gateway': '10.0.70.1' },
    'wifiOfc':   { 'id': 80,  'network': '10.0.80.0/24', 'gateway': '10.0.80.1' },
    'wifiGst':   { 'id': 90,  'network': '10.0.90.0/24', 'gateway': '10.0.90.1' },
    'server':    { 'id': 100, 'network': '10.0.100.0/24', 'gateway': '10.0.100.1' },
    'dmz':       { 'id': 110, 'network': '10.0.110.0/24', 'gateway': '10.0.110.1' },
};

const SWITCHES = {
    'cs1': { 'type': 'core', 'vlans': Object.keys(VLAN_CONFIG) },
    'as1': { 'type': 'agg', 'vlans': ['office', 'lab', 'library', 'academic', 'hr', 'finance', 'logistics'] },
    'as2': { 'type': 'agg', 'vlans': ['dormA', 'dormB', 'dormC', 'canteen', 'wifiOfc', 'wifiGst'] },
    'as3': { 'type': 'agg', 'vlans': ['server', 'dmz', 'mgmt'] },
};

const ACCESS_SW = {
    'sw1': { 'vlan': 'office', 'agg': 'as1' },
    'sw2': { 'vlan': 'lab', 'agg': 'as1' },
    'sw3': { 'vlan': 'library', 'agg': 'as1' },
    'sw4': { 'vlan': 'academic', 'agg': 'as1' },
    'sw5': { 'vlan': 'hr', 'agg': 'as1', 'secure': true },
    'sw6': { 'vlan': 'finance', 'agg': 'as1', 'secure': true },
    'sw7': { 'vlan': 'logistics', 'agg': 'as1' },
    'sw8': { 'vlan': 'dormA', 'agg': 'as2' },
    'sw9': { 'vlan': 'dormB', 'agg': 'as2' },
    'sw10': { 'vlan': 'dormC', 'agg': 'as2' },
    'sw11': { 'vlan': 'canteen', 'agg': 'as2' },
    'sw12': { 'vlan': 'wifiOfc', 'agg': 'as2' },
    'sw13': { 'vlan': 'wifiGst', 'agg': 'as2' },
    'sw14': { 'vlan': 'server', 'agg': 'as3' },
    'sw15': { 'vlan': 'dmz', 'agg': 'as3' },
};

// 主机配置 (对应 campus_network.py HOSTS)
const HOSTS_CONFIG = [
    { 'name': 'ofc1', 'ip': '10.0.20.3/24', 'vlan': 20, 'vlanName': 'office' },
    { 'name': 'ofc2', 'ip': '10.0.20.4/24', 'vlan': 20, 'vlanName': 'office' },
    { 'name': 'ofc3', 'ip': '10.0.20.5/24', 'vlan': 20, 'vlanName': 'office' },
    { 'name': 'acd1', 'ip': '10.0.40.3/24', 'vlan': 40, 'vlanName': 'academic' },
    { 'name': 'acd2', 'ip': '10.0.40.4/24', 'vlan': 40, 'vlanName': 'academic' },
    { 'name': 'acd3', 'ip': '10.0.40.5/24', 'vlan': 40, 'vlanName': 'academic' },
    { 'name': 'dA1', 'ip': '10.0.10.3/24', 'vlan': 10, 'vlanName': 'dormA' },
    { 'name': 'dA2', 'ip': '10.0.10.4/24', 'vlan': 10, 'vlanName': 'dormA' },
    { 'name': 'dA3', 'ip': '10.0.10.5/24', 'vlan': 10, 'vlanName': 'dormA' },
    { 'name': 'dB1', 'ip': '10.0.11.3/24', 'vlan': 11, 'vlanName': 'dormB' },
    { 'name': 'dB2', 'ip': '10.0.11.4/24', 'vlan': 11, 'vlanName': 'dormB' },
    { 'name': 'dB3', 'ip': '10.0.11.5/24', 'vlan': 11, 'vlanName': 'dormB' },
    { 'name': 'hr1', 'ip': '10.0.50.3/24', 'vlan': 50, 'vlanName': 'hr', 'secure': true },
    { 'name': 'hr2', 'ip': '10.0.50.4/24', 'vlan': 50, 'vlanName': 'hr', 'secure': true },
    { 'name': 'fin1', 'ip': '10.0.60.3/24', 'vlan': 60, 'vlanName': 'finance', 'secure': true },
    { 'name': 'fin2', 'ip': '10.0.60.4/24', 'vlan': 60, 'vlanName': 'finance', 'secure': true },
    { 'name': 'gst1', 'ip': '10.0.90.3/24', 'vlan': 90, 'vlanName': 'wifiGst' },
    { 'name': 'gst2', 'ip': '10.0.90.4/24', 'vlan': 90, 'vlanName': 'wifiGst' },
];

// 中文名称映射
const NODE_NAMES_CN = {
    // 交换机
    'cs1': '核心交换机',
    'as1': '汇聚交换机-1',
    'as2': '汇聚交换机-2',
    'as3': '汇聚交换机-3',
    'sw1': '办公楼交换机', 'sw2': '实验室交换机', 'sw3': '图书馆交换机',
    'sw4': '科研楼交换机', 'sw5': '人事处交换机', 'sw6': '财务处交换机',
    'sw7': '后勤处交换机', 'sw8': '宿舍A交换机', 'sw9': '宿舍B交换机',
    'sw10': '宿舍C交换机', 'sw11': '食堂交换机', 'sw12': '办公WiFi交换机',
    'sw13': '访客WiFi交换机', 'sw14': '服务器区交换机', 'sw15': 'DMZ交换机',
    // 主机
    'ofc1': '办公楼-1', 'ofc2': '办公楼-2', 'ofc3': '办公楼-3',
    'acd1': '科研楼-1', 'acd2': '科研楼-2', 'acd3': '科研楼-3',
    'dA1': '宿舍A-1', 'dA2': '宿舍A-2', 'dA3': '宿舍A-3',
    'dB1': '宿舍B-1', 'dB2': '宿舍B-2', 'dB3': '宿舍B-3',
    'hr1': '人事处-1', 'hr2': '人事处-2',
    'fin1': '财务处-1', 'fin2': '财务处-2',
    'gst1': '访客-1', 'gst2': '访客-2',
    // 服务器
    'web': 'Web服务器', 'ftp': 'FTP服务器', 'dns': 'DNS服务器',
};

// 服务器配置 (对应 campus_network.py SRV_HOSTS)
const SRV_HOSTS_CONFIG = [
    { 'name': 'web', 'ip': '10.0.100.2/24', 'vlan': 100, 'vlanName': 'server' },
    { 'name': 'ftp', 'ip': '10.0.100.3/24', 'vlan': 100, 'vlanName': 'server' },
    { 'name': 'dns', 'ip': '10.0.100.4/24', 'vlan': 100, 'vlanName': 'server' },
];

// ACL 规则配置 (与 campus_network.py 中的 ACL 规则一致)
const ACL_RULES = [
    { 'srcVlan': 10, 'dstVlan': 50, 'action': 'drop', 'desc': '宿舍A → 人事处' },
    { 'srcVlan': 11, 'dstVlan': 50, 'action': 'drop', 'desc': '宿舍B → 人事处' },
    { 'srcVlan': 10, 'dstVlan': 60, 'action': 'drop', 'desc': '宿舍A → 财务处' },
    { 'srcVlan': 11, 'dstVlan': 60, 'action': 'drop', 'desc': '宿舍B → 财务处' },
    { 'srcVlan': 90, 'dstVlan': '*', 'action': 'drop', 'desc': '访客 → 内网' },
];

/**
 * 生成完整的拓扑数据
 */
function generateTopology() {
    const nodes = [];
    const links = [];

    // 添加核心/汇聚交换机
    for (const [swName, swConfig] of Object.entries(SWITCHES)) {
        nodes.push({
            'id': swName,
            'type': 'switch',
            'subtype': swConfig.type,
            'vlans': swConfig.vlans,
        });
    }

    // 添加接入交换机
    for (const [swName, swConfig] of Object.entries(ACCESS_SW)) {
        nodes.push({
            'id': swName,
            'type': 'switch',
            'subtype': 'access',
            'vlans': [swConfig.vlan],
            'vlanName': swConfig.vlan,
            'secure': swConfig.secure || false,
            'parentAgg': swConfig.agg,
        });
    }

    // 添加主机
    for (const h of HOSTS_CONFIG) {
        nodes.push({
            'id': h.name,
            'type': 'host',
            'ip': h.ip,
            'vlan': h.vlan,
            'vlanName': h.vlanName,
            'secure': h.secure || false,
        });
    }

    // 添加服务器
    for (const s of SRV_HOSTS_CONFIG) {
        nodes.push({
            'id': s.name,
            'type': 'server',
            'ip': s.ip,
            'vlan': s.vlan,
            'vlanName': s.vlanName,
        });
    }

    // 添加链路 - 核心到汇聚
    links.push({ 'source': 'cs1', 'target': 'as1', 'type': 'trunk' });
    links.push({ 'source': 'cs1', 'target': 'as2', 'type': 'trunk' });
    links.push({ 'source': 'cs1', 'target': 'as3', 'type': 'trunk' });

    // 添加链路 - 汇聚到接入
    for (const [swName, swConfig] of Object.entries(ACCESS_SW)) {
        links.push({ 'source': swConfig.agg, 'target': swName, 'type': 'trunk' });
    }

    return {
        'nodes': nodes,
        'links': links,
        'vlans': VLAN_CONFIG,
        'aclRules': ACL_RULES,
    };
}

/**
 * 模拟 Ping 结果 (基于 ACL 规则)
 */
function simulatePing(src, dst, topologyData) {
    const srcNode = topologyData.nodes.find(n => n.id === src);
    const dstNode = topologyData.nodes.find(n => n.id === dst);

    if (!srcNode || !dstNode) {
        return { 'success': false, 'error': '节点不存在' };
    }

    // 检查 ACL 规则
    const srcVlan = srcNode.vlan;
    const dstVlan = dstNode.vlan;

    for (const rule of ACL_RULES) {
        if (rule.action === 'drop') {
            const srcMatch = rule.srcVlan === srcVlan || rule.srcVlan === '*';
            const dstMatch = rule.dstVlan === dstVlan || rule.dstVlan === '*';
            if (srcMatch && dstMatch) {
                return {
                    'success': false,
                    'output': `PING ${dst} (${dstNode.ip}) 56(84) bytes of data.\nFrom ${src} icmp_seq=1 Packet filtered\n--- ${dst} ping statistics ---\n1 packets transmitted, 0 received, 100% packet loss`,
                    'error': 'ACL blocked',
                    'rtt': null,
                };
            }
        }
    }

    // 正常 ping
    const avgRtt = (Math.random() * 0.5 + 0.3).toFixed(2);
    return {
        'success': true,
        'output': `PING ${dst} (${dstNode.ip}) 56(84) bytes of data.\n64 bytes from ${dst}: icmp_seq=1 ttl=64 time=${avgRtt} ms\n--- ${dst} ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss`,
        'rtt': { 'min': (avgRtt * 0.8).toFixed(2), 'avg': avgRtt, 'max': (avgRtt * 1.2).toFixed(2) },
    };
}

// 导出全局变量
window.VLAN_CONFIG = VLAN_CONFIG;
window.SWITCHES = SWITCHES;
window.ACCESS_SW = ACCESS_SW;
window.HOSTS_CONFIG = HOSTS_CONFIG;
window.SRV_HOSTS_CONFIG = SRV_HOSTS_CONFIG;
window.ACL_RULES = ACL_RULES;
window.NODE_NAMES_CN = NODE_NAMES_CN;
window.generateTopology = generateTopology;
window.simulatePing = simulatePing;
