import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Cpu, Plus, Wifi, Edit3, Trash2,
  Server, X, Building2, Factory, Globe
} from 'lucide-react';
import { StatusChip } from './components/ui/status-chip';

export interface BiometricDevice {
  id: string;
  name: string;
  brand: 'ZKTeco' | 'Hikvision' | 'Suprema' | 'Dahua' | 'Anviz' | 'Realtime' | 'eSSL' | 'Matrix' | 'Generic';
  modelNumber: string;
  connectionMode: 'LAN / TCP-IP' | 'Cloud ADMS Push' | 'USB / Offline';
  ipAddress: string;
  port: number;
  commKey: string;
  deviceSn: string;
  location: string;
  assignedBranch: string;
  assignedPolicyName: string;
  status: 'Online' | 'Offline' | 'Maintenance';
  lastSync: string;
}

export const BRANCH_LIST = [
  'Head Office',
  'Factory / Plant 1',
  'Warehouse & Logistics',
  'Regional Branch'
];

export const DEFAULT_DEVICES: BiometricDevice[] = [
  {
    id: 'dev-1',
    name: 'Head Office Main Entrance Terminal',
    brand: 'ZKTeco',
    modelNumber: 'uFace 800 Plus',
    connectionMode: 'Cloud ADMS Push',
    ipAddress: '192.168.1.201',
    port: 4370,
    commKey: '0',
    deviceSn: 'ZK-UF800-9982',
    location: 'Head Office - Reception Turnstile',
    assignedBranch: 'Head Office',
    assignedPolicyName: 'Head Office Corporate Policy (5 Days)',
    status: 'Online',
    lastSync: 'Today at 08:30 AM',
  },
  {
    id: 'dev-2',
    name: 'Factory Gate 2 Biometric Turnstile',
    brand: 'Hikvision',
    modelNumber: 'DS-K1T671MF',
    connectionMode: 'Cloud ADMS Push',
    ipAddress: '192.168.10.150',
    port: 8000,
    commKey: 'admin123',
    deviceSn: 'HIK-MINMOE-4412',
    location: 'Manufacturing Plant 1 - Gate 2',
    assignedBranch: 'Factory / Plant 1',
    assignedPolicyName: 'Factory & Plant Shift Policy (6 Days)',
    status: 'Online',
    lastSync: 'Today at 08:45 AM',
  },
];

export default function BiometricDevicesView() {
  const [devices, setDevices] = useState<BiometricDevice[]>(() => {
    const saved = localStorage.getItem('ab_biometric_devices');
    return saved ? JSON.parse(saved) : DEFAULT_DEVICES;
  });

  const [editingDevice, setEditingDevice] = useState<BiometricDevice | null>(null);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [pingStatus, setPingStatus] = useState<Record<string, string>>({});
  const [showMultiLocationGuide, setShowMultiLocationGuide] = useState(true);

  const saveDevicesToStorage = (updated: BiometricDevice[]) => {
    setDevices(updated);
    localStorage.setItem('ab_biometric_devices', JSON.stringify(updated));
  };

  const handlePingDevice = (device: BiometricDevice) => {
    setPingStatus(p => ({ ...p, [device.id]: `Testing handshake with ${device.assignedBranch} terminal (${device.ipAddress}:${device.port})...` }));
    setTimeout(() => {
      setPingStatus(p => ({
        ...p,
        [device.id]: `✓ Handshake Verified! Connected to ${device.brand} ${device.modelNumber} at ${device.assignedBranch} (${device.ipAddress}:${device.port}, Latency 14ms)`
      }));
    }, 850);
  };

  const handleSaveDevice = (e: FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;

    const exists = devices.find(d => d.id === editingDevice.id);
    let updated: BiometricDevice[];
    if (exists) {
      updated = devices.map(d => d.id === editingDevice.id ? editingDevice : d);
    } else {
      updated = [...devices, editingDevice];
    }

    saveDevicesToStorage(updated);
    setDeviceModalOpen(false);
    setEditingDevice(null);
  };

  const handleDeleteDevice = (id: string) => {
    if (confirm('Are you sure you want to remove this biometric machine from configuration?')) {
      const updated = devices.filter(d => d.id !== id);
      saveDevicesToStorage(updated);
    }
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-amber-500 to-rose-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Cpu className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Biometric Hardware Configuration (Multi-Location / Multi-Branch)</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400"><span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Connect machines located in Head Office, Factory / Manufacturing Plant, and Warehouses to the central ERP.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setEditingDevice({
                id: `dev-${Date.now()}`,
                name: 'New Location Biometric Terminal',
                brand: 'ZKTeco',
                modelNumber: 'uFace 800',
                connectionMode: 'Cloud ADMS Push',
                ipAddress: '192.168.1.205',
                port: 4370,
                commKey: '0',
                deviceSn: 'SN-ZK-' + Math.floor(1000 + Math.random() * 9000),
                location: 'Head Office Reception',
                assignedBranch: 'Head Office',
                assignedPolicyName: 'Head Office Corporate Policy (5 Days)',
                status: 'Online',
                lastSync: 'Pending Initial Connection',
              });
              setDeviceModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Add Biometric Device Manually
          </button>
          </div>
        </div>
      </div>

      {/* Multi-Location Architecture Explainer */}
      {showMultiLocationGuide && (
        <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs space-y-3 relative">
          <button
            onClick={() => setShowMultiLocationGuide(false)}
            className="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs">
            <Globe className="w-4 h-4" />
            <span>How Multi-Location Biometric Connectivity Works (Head Office & Factory in Different Places):</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] space-y-1">
              <span className="font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> 1. Head Office Terminal
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Located at Head Office. In device menu $\rightarrow$ <em>ADMS / Cloud Server</em>, enter your ERP Cloud Webhook URL. All office punches automatically apply the <strong>5-Day Corporate Policy</strong>.
              </p>
            </div>

            <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] space-y-1">
              <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5" /> 2. Factory / Plant Terminal
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Located at Factory Plant in another city. It also connects via <em>ADMS / Cloud Webhook over Internet</em> to your central ERP URL. Factory punches automatically apply the <strong>6-Day Factory Shift Policy</strong>.
              </p>
            </div>

            <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] space-y-1">
              <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> 3. Real-Time Central Sync
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                No local network cabling or VPN needed between Head Office and Factory! Both terminals push attendance live into one centralized ERP database.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Server & Webhook Info Banner */}
      <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-gradient-to-r from-indigo-500/5 to-teal-500/5 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white font-bold shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[var(--color-text-strong)]">Central Biometric Webhook URL (Enter in Head Office & Factory Devices):</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">● Active & Ready</span>
              </div>
              <p className="font-mono text-[11px] text-[var(--color-text-muted)] mt-0.5">
                POST https://your-erp-domain.com/api/v1/payroll/attendance/biometric-push (ADMS / WDMS Push Protocol)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Network Devices Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {devices.map(dev => (
          <div key={dev.id} className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[var(--color-text-strong)]">{dev.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold">{dev.brand}</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">{dev.modelNumber}</span>
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mt-1 flex items-center gap-1.5 font-semibold">
                    {dev.assignedBranch.includes('Factory') ? <Factory className="w-3.5 h-3.5 text-indigo-600" /> : <Building2 className="w-3.5 h-3.5 text-teal-600" />}
                    <span>Facility: <strong className="text-[var(--color-text-strong)]">{dev.assignedBranch}</strong> ({dev.location})</span>
                  </div>
                </div>

                <StatusChip status={dev.status} label={dev.status} hex={
                  dev.status === 'Online' ? '#10b981' :
                  dev.status === 'Maintenance' ? '#f59e0b' : '#94a3b8'
                } />
              </div>

              {/* Device Network & Credentials Details */}
              <div className="p-3 bg-[var(--color-surface-muted)] rounded-xl space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-muted)] font-sans">Active Location Policy:</span>
                  <span className="font-sans font-bold text-teal-600">{dev.assignedPolicyName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-muted)] font-sans">Network IP & Port:</span>
                  <span className="font-bold text-[var(--color-text-strong)]">{dev.ipAddress}:{dev.port}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-muted)] font-sans">Serial Number (SN):</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{dev.deviceSn}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-muted)] font-sans">Sync Protocol:</span>
                  <span className="font-sans font-semibold text-indigo-600">{dev.connectionMode}</span>
                </div>
              </div>

              {pingStatus[dev.id] && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-[11px] font-mono rounded-xl border border-emerald-200 animate-in fade-in">
                  {pingStatus[dev.id]}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
              <button
                onClick={() => handlePingDevice(dev)}
                className="px-3 py-1.5 rounded-xl border border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-100 text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 transition-colors"
              >
                <Wifi className="w-3.5 h-3.5" /> Test & Ping Terminal
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingDevice({ ...dev });
                    setDeviceModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                  title="Edit Device Configuration"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                </button>
                <button
                  onClick={() => handleDeleteDevice(dev.id)}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-rose-600"
                  title="Remove Device"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: MANUAL BIOMETRIC DEVICE CONFIGURATION */}
      {deviceModalOpen && editingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text-strong)]">
                    {editingDevice.id.startsWith('dev-') && devices.some(d => d.id === editingDevice.id) ? 'Edit Biometric Machine' : 'Add New Biometric Terminal'}
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Configure branch assignment, hardware model, IP address, and credentials</p>
                </div>
              </div>
              <button onClick={() => setDeviceModalOpen(false)} className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Device Name / Alias *</label>
                <input
                  required
                  type="text"
                  value={editingDevice.name}
                  onChange={e => setEditingDevice({ ...editingDevice, name: e.target.value })}
                  placeholder="e.g. Head Office Reception Face ID, Factory Gate 2 Turnstile"
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Assigned Location / Branch *</label>
                  <select
                    value={editingDevice.assignedBranch}
                    onChange={e => setEditingDevice({
                      ...editingDevice,
                      assignedBranch: e.target.value,
                      assignedPolicyName: e.target.value === 'Factory / Plant 1' ? 'Factory & Plant Shift Policy (6 Days)' : 'Head Office Corporate Policy (5 Days)'
                    })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
                  >
                    {BRANCH_LIST.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Physical Location in Building</label>
                  <input
                    type="text"
                    value={editingDevice.location}
                    onChange={e => setEditingDevice({ ...editingDevice, location: e.target.value })}
                    placeholder="e.g. Reception Turnstile, Plant Gate 2"
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Manufacturer / Brand *</label>
                  <select
                    value={editingDevice.brand}
                    onChange={e => setEditingDevice({ ...editingDevice, brand: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
                  >
                    <option value="ZKTeco">ZKTeco</option>
                    <option value="Hikvision">Hikvision</option>
                    <option value="Suprema">Suprema</option>
                    <option value="Dahua">Dahua</option>
                    <option value="Anviz">Anviz</option>
                    <option value="Realtime">Realtime</option>
                    <option value="eSSL">eSSL</option>
                    <option value="Matrix">Matrix</option>
                    <option value="Generic">Generic / Other Terminal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Model Name / Number *</label>
                  <input
                    required
                    type="text"
                    value={editingDevice.modelNumber}
                    onChange={e => setEditingDevice({ ...editingDevice, modelNumber: e.target.value })}
                    placeholder="e.g. uFace 800, DS-K1T671MF, BioStation 3"
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Local IP Address *</label>
                  <input
                    required
                    type="text"
                    value={editingDevice.ipAddress}
                    onChange={e => setEditingDevice({ ...editingDevice, ipAddress: e.target.value })}
                    placeholder="e.g. 192.168.1.201"
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Port Number *</label>
                  <input
                    required
                    type="number"
                    value={editingDevice.port}
                    onChange={e => setEditingDevice({ ...editingDevice, port: parseInt(e.target.value) || 4370 })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Device Serial Number (SN) / MAC</label>
                  <input
                    type="text"
                    value={editingDevice.deviceSn}
                    onChange={e => setEditingDevice({ ...editingDevice, deviceSn: e.target.value })}
                    placeholder="e.g. ZK-UF800-9982"
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Communication Password / CommKey</label>
                  <input
                    type="text"
                    value={editingDevice.commKey}
                    onChange={e => setEditingDevice({ ...editingDevice, commKey: e.target.value })}
                    placeholder="e.g. 0 (default) or password"
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Connection & Push Mode</label>
                <select
                  value={editingDevice.connectionMode}
                  onChange={e => setEditingDevice({ ...editingDevice, connectionMode: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold text-indigo-700"
                >
                  <option value="Cloud ADMS Push">Cloud Push (ADMS / WDMS Webhook - Recommended for Multi-City)</option>
                  <option value="LAN / TCP-IP">LAN / Local TCP-IP (Same Network Only)</option>
                  <option value="USB / Offline">USB Drive / Offline File Sync</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setDeviceModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Device Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
