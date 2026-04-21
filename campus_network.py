#!/usr/bin/env python
"""
校园网络模拟器 - Campus Network Simulator v2.1
修复三层路由：改用vrouter节点+每VLAN单独veth pair+OSPF/静态路由
"""
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.net import Mininet
from mininet.node import Controller, Switch, OVSKernelSwitch, Node as MininetNode
from mininet.topo import Topo
from mininet.util import quietRun

import signal
import sys

# =============================================================================
# 网络配置 - 缩短名称以满足WSL接口名限制(≤15字符)
# =============================================================================

VLAN_CONFIG = {
    'mgmt':      {'id': 1,   'network': '10.0.1.0/24',   'gateway': '10.0.1.1'},
    'dormA':     {'id': 10,  'network': '10.0.10.0/24', 'gateway': '10.0.10.1'},
    'dormB':     {'id': 11,  'network': '10.0.11.0/24', 'gateway': '10.0.11.1'},
    'dormC':     {'id': 12,  'network': '10.0.12.0/24', 'gateway': '10.0.12.1'},
    'canteen':   {'id': 13,  'network': '10.0.13.0/24', 'gateway': '10.0.13.1'},
    'office':    {'id': 20,  'network': '10.0.20.0/24', 'gateway': '10.0.20.1'},
    'lab':       {'id': 21,  'network': '10.0.21.0/24', 'gateway': '10.0.21.1'},
    'library':   {'id': 30,  'network': '10.0.30.0/24', 'gateway': '10.0.30.1'},
    'academic':  {'id': 40,  'network': '10.0.40.0/24', 'gateway': '10.0.40.1'},
    'hr':        {'id': 50,  'network': '10.0.50.0/24', 'gateway': '10.0.50.1', 'secure': True},
    'finance':   {'id': 60,  'network': '10.0.60.0/24', 'gateway': '10.0.60.1', 'secure': True},
    'logistics': {'id': 70,  'network': '10.0.70.0/24', 'gateway': '10.0.70.1'},
    'wifiOfc':   {'id': 80,  'network': '10.0.80.0/24', 'gateway': '10.0.80.1'},
    'wifiGst':   {'id': 90,  'network': '10.0.90.0/24', 'gateway': '10.0.90.1'},
    'server':    {'id': 100, 'network': '10.0.100.0/24', 'gateway': '10.0.100.1'},
    'dmz':       {'id': 110, 'network': '10.0.110.0/24', 'gateway': '10.0.110.1'},
}

# 交换机配置 (名称≤14字符)
SWITCHES = {
    'cs1': {'type': 'core', 'vlans': list(VLAN_CONFIG.keys())},
    'as1': {'type': 'agg', 'vlans': ['office', 'lab', 'library', 'academic', 'hr', 'finance', 'logistics']},
    'as2': {'type': 'agg', 'vlans': ['dormA', 'dormB', 'dormC', 'canteen', 'wifiOfc', 'wifiGst']},
    'as3': {'type': 'agg', 'vlans': ['server', 'dmz', 'mgmt']},
}

# 接入交换机配置
ACCESS_SW = {
    'sw1': {'vlan': 'office', 'agg': 'as1'},
    'sw2': {'vlan': 'lab', 'agg': 'as1'},
    'sw3': {'vlan': 'library', 'agg': 'as1'},
    'sw4': {'vlan': 'academic', 'agg': 'as1'},
    'sw5': {'vlan': 'hr', 'agg': 'as1', 'secure': True},
    'sw6': {'vlan': 'finance', 'agg': 'as1', 'secure': True},
    'sw7': {'vlan': 'logistics', 'agg': 'as1'},
    'sw8': {'vlan': 'dormA', 'agg': 'as2'},
    'sw9': {'vlan': 'dormB', 'agg': 'as2'},
    'sw10': {'vlan': 'dormC', 'agg': 'as2'},
    'sw11': {'vlan': 'canteen', 'agg': 'as2'},
    'sw12': {'vlan': 'wifiOfc', 'agg': 'as2'},
    'sw13': {'vlan': 'wifiGst', 'agg': 'as2'},
    'sw14': {'vlan': 'server', 'agg': 'as3'},
    'sw15': {'vlan': 'dmz', 'agg': 'as3'},
}

# 主机配置
HOSTS = []
base = 2

# 办公楼
for i in range(1, 4):
    HOSTS.append({'name': f'ofc{i}', 'ip': f'10.0.20.{base+i}/24', 'vlan': 20, 'gw': '10.0.20.1'})
# 教学楼
for i in range(1, 4):
    HOSTS.append({'name': f'acd{i}', 'ip': f'10.0.40.{base+i}/24', 'vlan': 40, 'gw': '10.0.40.1'})
# 宿舍A
for i in range(1, 4):
    HOSTS.append({'name': f'dA{i}', 'ip': f'10.0.10.{base+i}/24', 'vlan': 10, 'gw': '10.0.10.1'})
# 宿舍B
for i in range(1, 4):
    HOSTS.append({'name': f'dB{i}', 'ip': f'10.0.11.{base+i}/24', 'vlan': 11, 'gw': '10.0.11.1'})
# 人事处
for i in range(1, 3):
    HOSTS.append({'name': f'hr{i}', 'ip': f'10.0.50.{base+i}/24', 'vlan': 50, 'gw': '10.0.50.1'})
# 财务处
for i in range(1, 3):
    HOSTS.append({'name': f'fin{i}', 'ip': f'10.0.60.{base+i}/24', 'vlan': 60, 'gw': '10.0.60.1'})
# 访客
for i in range(1, 3):
    HOSTS.append({'name': f'gst{i}', 'ip': f'10.0.90.{base+i}/24', 'vlan': 90, 'gw': '10.0.90.1'})
# 服务器（需要defaultRoute才能跨VLAN通信）
SRV_HOSTS = [
    {'name': 'web', 'ip': '10.0.100.2/24', 'vlan': 100, 'gw': '10.0.100.1'},
    {'name': 'ftp', 'ip': '10.0.100.3/24', 'vlan': 100, 'gw': '10.0.100.1'},
    {'name': 'dns', 'ip': '10.0.100.4/24', 'vlan': 100, 'gw': '10.0.100.1'},
]


class CampusTopo(Topo):
    def __init__(self):
        super(CampusTopo, self).__init__()

        info("=== 构建校园网络拓扑 ===\n")

        # 创建核心/汇聚交换机
        info("创建核心/汇聚交换机...\n")
        core_sw = self.addSwitch('cs1', cls=OVSKernelSwitch)
        as1 = self.addSwitch('as1', cls=OVSKernelSwitch)
        as2 = self.addSwitch('as2', cls=OVSKernelSwitch)
        as3 = self.addSwitch('as3', cls=OVSKernelSwitch)

        # 创建接入交换机
        info("创建接入交换机...\n")
        access_sws = {}
        for sw_name, sw_config in ACCESS_SW.items():
            s = self.addSwitch(sw_name, cls=OVSKernelSwitch)
            access_sws[sw_name] = s
            vlan_name = sw_config['vlan']
            info(f"  {sw_name} -> VLAN {VLAN_CONFIG[vlan_name]['id']} ({vlan_name})\n")

        # 创建主机
        info("创建主机...\n")
        host_nodes = {}
        for h in HOSTS:
            node = self.addHost(h['name'], ip=h['ip'], defaultRoute=f"via {h['gw']}")
            host_nodes[h['name']] = node
            info(f"  {h['name']} -> {h['ip']}\n")

        # 创建服务器
        info("创建服务器...\n")
        srv_nodes = {}
        for s in SRV_HOSTS:
            node = self.addHost(s['name'], ip=s['ip'], defaultRoute=f"via {s['gw']}")
            srv_nodes[s['name']] = node
            info(f"  {s['name']} -> {s['ip']}\n")

        # 创建链路 - 核心到汇聚
        info("创建链路 (核心-汇聚)...\n")
        self.addLink(core_sw, as1)
        self.addLink(core_sw, as2)
        self.addLink(core_sw, as3)

        # 创建链路 - 汇聚到接入
        info("创建链路 (汇聚-接入)...\n")
        for sw_name, sw_config in ACCESS_SW.items():
            agg_sw = sw_config['agg']
            if agg_sw == 'as1':
                self.addLink(as1, access_sws[sw_name])
            elif agg_sw == 'as2':
                self.addLink(as2, access_sws[sw_name])
            elif agg_sw == 'as3':
                self.addLink(as3, access_sws[sw_name])
            info(f"  {agg_sw} <-> {sw_name}\n")

        # 创建链路 - 主机到接入交换机
        info("创建链路 (主机-接入)...\n")
        vlan_to_sw = {}
        for sw_name, sw_config in ACCESS_SW.items():
            vlan_to_sw[sw_config['vlan']] = sw_name

        for h in HOSTS:
            vlan_name = None
            for vn, vc in VLAN_CONFIG.items():
                if vc['id'] == h['vlan']:
                    vlan_name = vn
                    break
            if vlan_name and vlan_name in vlan_to_sw:
                sw_name = vlan_to_sw[vlan_name]
                self.addLink(host_nodes[h['name']], access_sws[sw_name])

        # 创建链路 - 服务器到接入交换机
        info("创建链路 (服务器-接入)...\n")
        for s in SRV_HOSTS:
            vlan_name = None
            for vn, vc in VLAN_CONFIG.items():
                if vc['id'] == s['vlan']:
                    vlan_name = vn
                    break
            if vlan_name and vlan_name in vlan_to_sw:
                sw_name = vlan_to_sw[vlan_name]
                self.addLink(srv_nodes[s['name']], access_sws[sw_name])

        info("\n=== 拓扑构建完成 ===\n")


class CampusNetwork:
    def __init__(self):
        self.net = None
        self.vrouter = None

    def build(self):
        info("="*60 + "\n")
        info("  校园网络构建系统 v2.1 (三层路由修复版)")
        info("="*60 + "\n\n")

        topo = CampusTopo()

        info(">> 启动网络...\n")
        self.net = Mininet(
            topo=topo,
            switch=OVSKernelSwitch,
            controller=None
        )

        info(">> 启动Mininet...\n")
        self.net.start()

        # 配置交换机为独立模式
        info(">> 配置交换机为独立模式...\n")
        for sw in self.net.switches:
            sw.cmd('ovs-vsctl set-fail-mode', sw, 'standalone')
            sw.cmd('ip link set', sw, 'up')

        # 配置接入端口VLAN
        info(">> 配置接入端口VLAN...\n")
        self._setup_access_ports()

        # 配置三层路由
        info(">> 配置三层路由（vrouter节点）...\n")
        self._setup_router()

        # 配置ACL
        info(">> 配置ACL...\n")
        self._setup_acl()

        info("\n" + "="*60 + "\n")
        info("  校园网络构建完成!")
        info("="*60 + "\n")

        return self.net

    def _setup_access_ports(self):
        """配置接入端口VLAN + 明确配置所有trunk端口允许所有VLAN"""
        all_vlans = ','.join(str(v['id']) for v in VLAN_CONFIG.values())

        for sw in self.net.switches:
            sw_name = sw.name
            for intf in sw.intfList():
                if not intf.link:
                    continue
                port_name = intf.name
                # 跳过回路端口
                if port_name == 'lo':
                    continue
                # 判断是主机端口还是交换机间端口
                intf1_node = intf.link.intf1.node.name if intf.link.intf1 else None
                intf2_node = intf.link.intf2.node.name if intf.link.intf2 else None

                is_host_port = (intf1_node in [h['name'] for h in HOSTS] or
                                intf2_node in [h['name'] for h in HOSTS] or
                                intf1_node in [s['name'] for s in SRV_HOSTS] or
                                intf2_node in [s['name'] for s in SRV_HOSTS])

                if is_host_port:
                    # 接入端口：配置VLAN tag
                    vlan_id = None
                    host_name = None
                    for h in HOSTS:
                        if intf1_node == h['name'] or intf2_node == h['name']:
                            vlan_id = h['vlan']
                            host_name = h['name']
                            break
                    if vlan_id is None:
                        for s in SRV_HOSTS:
                            if intf1_node == s['name'] or intf2_node == s['name']:
                                vlan_id = s['vlan']
                                host_name = s['name']
                                break
                    if vlan_id is not None:
                        sw.cmd(f'ovs-vsctl set port {port_name} tag={vlan_id}')
                        info(f"  {port_name}: access VLAN {vlan_id}\n")
                else:
                    # 交换机间trunk端口：明确允许所有VLAN
                    sw.cmd(f'ovs-vsctl set port {port_name} trunks={all_vlans}')
                    info(f"  {port_name}: trunk allowed={all_vlans}\n")

    def _setup_router(self):
        """配置vrouter：所有网络配置在 root namespace 通过 subprocess 执行"""
        import subprocess

        info("  配置 vrouter 网络（root namespace）...\n")

        all_vlans = ','.join(str(v['id']) for v in VLAN_CONFIG.values())

        # 清理旧接口
        def run(cmd):
            subprocess.run(cmd, shell=True)

        run('ip link del cs1-vr0 2>/dev/null; ip link del vrouter-vr0 2>/dev/null; true')
        for vid in [1, 10, 11, 12, 13, 20, 21, 30, 40, 50, 60, 70, 80, 90, 100, 110]:
            run(f'ip link del vrouter-vr0.{vid} 2>/dev/null; true')

        # 创建 veth pair（两端都在 root namespace）
        run('ip link add vrouter-vr0 type veth peer name cs1-vr0')
        run('ip link set vrouter-vr0 up')
        info("  created veth pair (root ns)\n")

        # 在 vrouter-vr0 上创建 VLAN sub-interfaces 并配置网关 IP
        info("  配置 VLAN sub-interfaces:\n")
        for vlan_name, config in VLAN_CONFIG.items():
            vid = config['id']
            gw = config['gateway']
            run(f'ip link add link vrouter-vr0 name vrouter-vr0.{vid} type vlan id {vid}')
            run(f'ip addr add {gw}/24 dev vrouter-vr0.{vid}')
            run(f'ip link set vrouter-vr0.{vid} up')
            info(f"    vlan{vid} ({vlan_name}): {gw}\n")

        # 启用 IP 转发
        run('sysctl -w net.ipv4.ip_forward=1')
        info("  IP forwarding enabled\n")

        # cs1 端：添加 trunk port（用 os.system 确保在 root ns）
        import os
        os.system('ip link set cs1-vr0 up')
        os.system(f'ovs-vsctl add-port cs1 cs1-vr0')
        os.system(f'ovs-vsctl set port cs1-vr0 trunks={all_vlans}')
        info(f"  cs1-vr0: trunk vlans={all_vlans}\n")

        # 保存 vrouter 引用（用于后续 CLI 命令）
        self.vrouter = None  # 不再需要 vrouter 节点，所有命令在 root 执行

    def _setup_acl(self):
        """配置访问控制"""
        cs1 = self.net.get('cs1')

        # ACL规则：优先级600-607，高于路由规则的500
        rules = [
            # 宿舍A/B → 人事处/财务处（drop）
            ('607', '10.0.10.0/24', '10.0.50.0/24', 'drop'),
            ('606', '10.0.11.0/24', '10.0.50.0/24', 'drop'),
            ('605', '10.0.10.0/24', '10.0.60.0/24', 'drop'),
            ('604', '10.0.11.0/24', '10.0.60.0/24', 'drop'),
            # 访客 → 整个内网（drop）
            ('603', '10.0.90.0/24', '10.0.0.0/8', 'drop'),
            # 宿舍区 → 办公/教学服务器区（仅允许到server VLAN 100）
            ('602', '10.0.10.0/24', '10.0.100.0/24', 'normal'),
            ('602', '10.0.11.0/24', '10.0.100.0/24', 'normal'),
            # 默认放行
            ('1', '0.0.0.0/0', '0.0.0.0/0', 'normal'),
        ]

        for priority, src, dst, action in rules:
            cmd = f'ovs-ofctl add-flow cs1 "priority={priority},ip,nw_src={src},nw_dst={dst},actions={action}"'
            cs1.cmd(cmd)
            info(f"  ACL: {src} -> {dst} [{action}]\n")

    def run_cli(self):
        info("\n>> 启动CLI...\n")
        info("常用命令:\n")
        info("  nodes              - 查看节点\n")
        info("  net                - 查看网络\n")
        info("  dA1 ping ofc1     - 测试三层连通性\n")
        info("  dA1 ping hr1      - 测试ACL(应失败)\n")
        info("  exit               - 退出\n\n")
        CLI(self.net)

    def stop(self):
        if self.net:
            self.net.stop()


def signal_handler(sig, frame):
    print("\n正在停止网络...")
    if net:
        net.stop()
    print("网络已停止")
    sys.exit(0)


net = None

def main():
    global net
    setLogLevel('info')

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    campus = CampusNetwork()
    try:
        net = campus.build()
        campus.run_cli()
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if net:
            campus.stop()


if __name__ == '__main__':
    main()
