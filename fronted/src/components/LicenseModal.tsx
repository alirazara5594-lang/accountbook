import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Key, Clock, AlertTriangle,
  X, Sparkles, Calendar, Unlock, CheckCircle2, RefreshCw
} from 'lucide-react';
import {
  getLicenseInfo,
  setLicenseMode,
  activateLicenseKey,
  type LicenseInfo,
  type LicenseModeId,
  LICENSE_PRESETS
} from '../licenseManager';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  notify: (msg: string) => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose, notify }) => {
  const [lic, setLic] = useState<LicenseInfo>(() => getLicenseInfo());
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLic(getLicenseInfo());
      setError(null);
      setLicenseKeyInput('');
    }
  }, [isOpen]);

  const handleSelectMode = (mode: LicenseModeId) => {
    const updated = setLicenseMode(mode);
    setLic(updated);
    notify(`✓ Switched to ${updated.title}`);
  };

  const handleResetTrialDate = () => {
    const updated = setLicenseMode(lic.mode, new Date().toISOString());
    setLic(updated);
    notify(`✓ Trial start date refreshed to today (${updated.totalDays} Days Left)`);
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) {
      setError('Please enter a valid license key.');
      return;
    }

    setActivating(true);
    setError(null);

    const res = activateLicenseKey(licenseKeyInput.trim());
    if (res.success) {
      setLic(res.info);
      notify(`✓ ${res.message}`);
      setLicenseKeyInput('');
    } else {
      setError(res.message);
    }
    setActivating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[10000] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">AMS Enterprise Licensing & Trials</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live real-time evaluation & commercial license manager</p>
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
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700 dark:text-slate-200">
          
          {/* Active Status Hero Card */}
          <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
            !lic.isTrial
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : lic.daysRemaining <= 15
              ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
              : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider ${
                    !lic.isTrial
                      ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                      : lic.daysRemaining <= 15
                      ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                      : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                  }`}>
                    {!lic.isTrial ? '✓ Full Commercial License' : `⏳ Active Trial · ${lic.daysRemaining} Days Left`}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{lic.tierName}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Installation Mode: <b className="text-slate-800 dark:text-slate-200">{lic.title}</b>
                </p>
              </div>

              {!lic.isTrial ? (
                <ShieldCheck className="w-7 h-7 text-emerald-500 shrink-0" />
              ) : (
                <Unlock className="w-7 h-7 text-amber-500 shrink-0" />
              )}
            </div>

            {/* Live Progress Bar */}
            {lic.isTrial && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <b>{lic.daysRemaining} Days</b> Remaining of {lic.totalDays} Days
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Expires: {new Date(lic.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      lic.daysRemaining <= 15
                        ? 'bg-rose-500'
                        : lic.mode === 'trial-180'
                        ? 'bg-gradient-to-r from-teal-500 to-indigo-600'
                        : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, 100 - lic.progressPercent)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick License & Trial Selector Mode */}
          <div className="space-y-2">
            <label className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
              <span>Select Active Trial / Evaluation Mode:</span>
              <button
                type="button"
                onClick={handleResetTrialDate}
                className="text-[10.5px] text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1 cursor-pointer"
                title="Reset elapsed days countdown from today"
              >
                <RefreshCw size={11} /> Reset to Day 1
              </button>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 90-Day Trial Card */}
              <button
                type="button"
                onClick={() => handleSelectMode('trial-90')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  lic.mode === 'trial-90'
                    ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">90 Days</span>
                  {lic.mode === 'trial-90' && <CheckCircle2 size={13} className="text-teal-600" />}
                </div>
                <div className="text-[10.5px] font-semibold text-teal-700 dark:text-teal-400">3-Month Trial</div>
                <div className="text-[10px] text-slate-500 mt-1">Standard commercial evaluation.</div>
              </button>

              {/* 180-Day Trial Card (NEW) */}
              <button
                type="button"
                onClick={() => handleSelectMode('trial-180')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  lic.mode === 'trial-180'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">180 Days</span>
                  {lic.mode === 'trial-180' && <CheckCircle2 size={13} className="text-indigo-600" />}
                </div>
                <div className="text-[10.5px] font-semibold text-indigo-700 dark:text-indigo-400">6-Month Extended</div>
                <div className="text-[10px] text-slate-500 mt-1">Long-term enterprise rollout.</div>
              </button>

              {/* 365-Day Beta Partner Card */}
              <button
                type="button"
                onClick={() => handleSelectMode('beta-365')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  lic.mode === 'beta-365'
                    ? 'border-violet-500 bg-violet-50/60 dark:bg-violet-950/30 ring-2 ring-violet-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">365 Days</span>
                  {lic.mode === 'beta-365' && <CheckCircle2 size={13} className="text-violet-600" />}
                </div>
                <div className="text-[10.5px] font-semibold text-violet-700 dark:text-violet-400">1-Year Founding</div>
                <div className="text-[10px] text-slate-500 mt-1">Beta partner & strategic pilot.</div>
              </button>
            </div>
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-2.5 pt-1">
            <label className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
              <span>Or Enter Commercial License Key:</span>
              <span className="text-[10px] text-slate-500 font-normal">Perpetual / Annual Key</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. AMS-PRO-8894-ENTERPRISE"
                value={licenseKeyInput}
                onChange={e => setLicenseKeyInput(e.target.value)}
                className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={activating || !licenseKeyInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {activating ? 'Verifying License...' : 'Activate Commercial License'}
            </button>
          </form>

          {/* Early Adopter Note */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Real-Time Dynamic Countdown
            </p>
            <p>
              Your selected license mode immediately updates the top navigation countdown pill, security policies, and financial reporting modules in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

