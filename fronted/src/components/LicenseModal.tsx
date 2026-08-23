import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Key, Clock, AlertTriangle,
  X, Sparkles, Calendar, Unlock
} from 'lucide-react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  notify: (msg: string) => void;
}

interface LicenseStatus {
  status: string; // 'Trial' | 'Active' | 'Expired' | 'TrialExpired'
  tier: string;
  licensedTo: string;
  licenseKey?: string | null;
  issuedAt: string;
  expiryDate?: string | null;
  daysRemaining: number;
  isTrial: boolean;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose, notify }) => {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:5124/api/v1/license/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Fallback offline mock for trial
      setStatus({
        status: 'Trial',
        tier: '90-Day Commercial Evaluation',
        licensedTo: 'Pilot Organization',
        issuedAt: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 90 * 86400000).toISOString(),
        daysRemaining: 90,
        isTrial: true
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setError(null);
      setLicenseKeyInput('');
    }
  }, [isOpen]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) {
      setError('Please enter a valid license key.');
      return;
    }

    setActivating(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:5124/api/v1/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKeyInput.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        notify(`✓ ${data.message || 'License activated successfully!'}`);
        await fetchStatus();
      } else {
        setError(data.error || 'Failed to activate license.');
      }
    } catch (err: any) {
      setError(err?.message || 'Connection error while activating license.');
    } finally {
      setActivating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[10000] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">AMS Enterprise Licensing</h3>
              <p className="text-xs text-slate-300 mt-0.5">Commercial deployment & 90-day evaluation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-slate-700 dark:text-slate-200">
          {/* Status Card */}
          <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
            status?.isTrial
              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
              : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
          }`}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider ${
                  status?.isTrial
                    ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                    : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                }`}>
                  {status?.isTrial ? '⏳ 90-Day Free Trial' : '✓ Fully Licensed'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{status?.tier}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Licensed to: <b>{status?.licensedTo || 'Active Company'}</b>
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <b>{status?.daysRemaining} Days</b> Remaining
                </span>
                {status?.expiryDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Expires: {new Date(status.expiryDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            {status?.isTrial ? (
              <Unlock className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
            )}
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-3">
            <label className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
              <span>Enter License Activation Key</span>
              <span className="text-[10px] text-slate-500 font-normal">Founding Partner / Commercial Key</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="AMS-eyJPcmdhbml6YXRpb25OYW1lIj..."
                value={licenseKeyInput}
                onChange={e => setLicenseKeyInput(e.target.value)}
                className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={activating || !licenseKeyInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {activating ? 'Verifying Signature...' : 'Activate Commercial License'}
            </button>
          </form>

          {/* Early Adopter Note */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Pilot Customer / Early Adopter Program
            </p>
            <p>
              To generate custom 6-month, 1-year, or Lifetime Founding Partner license keys for your pilot clients, go to <b>Administration → System Settings → Commercial Licensing & Key Generator</b>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
