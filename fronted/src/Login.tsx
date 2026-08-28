import React, { useState } from 'react';
import {
  Mail, Lock, AlertCircle, LogIn, UserPlus, User as UserIcon, ArrowLeft,
  ShieldCheck, Globe, Layers, Sparkles, CheckCircle2
} from 'lucide-react';
import AmsLogo from './components/AmsLogo';
import { getLicenseInfo } from './licenseManager';
import './Login.css';

export interface UserData {
  email: string;
  fullName: string;
  role: string;
  avatar: string;
  provider: 'email' | 'google';
}

export interface DemoUser extends UserData {
  defaultPassword?: string;
}

interface LoginProps {
  onLogin: (user: UserData) => void;
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin@acme.com',
    fullName: 'Muhammad Ali',
    role: 'Finance admin',
    avatar: 'MA',
    provider: 'email',
    defaultPassword: 'password123',
  },
  {
    email: 'accountant@acme.com',
    fullName: 'Sarah Jenkins',
    role: 'Senior Accountant',
    avatar: 'SJ',
    provider: 'email',
    defaultPassword: 'password123',
  },
  {
    email: 'inventory@acme.com',
    fullName: 'David Chen',
    role: 'Warehouse Manager',
    avatar: 'DC',
    provider: 'email',
    defaultPassword: 'password123',
  },
  {
    email: 'manufacturing@acme.com',
    fullName: 'Alex Rivera',
    role: 'Production Engineer',
    avatar: 'AR',
    provider: 'email',
    defaultPassword: 'password123',
  },
  {
    email: 'auditor@acme.com',
    fullName: 'Amina Al-Mansoor',
    role: 'External Auditor',
    avatar: 'AM',
    provider: 'email',
    defaultPassword: 'password123',
  },
];

interface RegisteredUser {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

const REGISTERED_KEY = 'ab_registered_users';

function loadRegistered(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(REGISTERED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRegistered(users: RegisteredUser[]) {
  localStorage.setItem(REGISTERED_KEY, JSON.stringify(users));
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

export function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('Accountant');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const completeLogin = (user: UserData) => {
    setIsLoading(false);
    onLogin(user);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'signup') {
      if (!fullName || !email || !password || !confirm) {
        setError('Please fill in all fields.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      const emailNorm = email.trim().toLowerCase();
      const registered = loadRegistered();
      const taken =
        DEMO_USERS.some((u) => u.email.toLowerCase() === emailNorm) ||
        registered.some((u) => u.email.toLowerCase() === emailNorm);
      if (taken) {
        setError('An account with this email already exists. Please sign in.');
        return;
      }
      const updated = [...registered, { fullName: fullName.trim(), email: emailNorm, password, role }];
      saveRegistered(updated);
      setSuccess('Account created. You can now sign in.');
      setMode('signin');
      setPassword('');
      setConfirm('');
      return;
    }

    // signin
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const emailNorm = email.toLowerCase().trim();
      const demo = DEMO_USERS.find((u) => u.email.toLowerCase() === emailNorm);
      if (demo) {
        completeLogin(demo);
        return;
      }
      const registered = loadRegistered().find((u) => u.email.toLowerCase() === emailNorm);
      if (registered && (!password || registered.password === password)) {
        completeLogin({
          email: registered.email,
          fullName: registered.fullName,
          role: registered.role,
          avatar: initials(registered.fullName),
          provider: 'email',
        });
        return;
      }
      if (emailNorm.includes('@')) {
        completeLogin({
          email: emailNorm,
          fullName: emailNorm.split('@')[0],
          role: 'Finance admin',
          avatar: emailNorm.slice(0, 2).toUpperCase(),
          provider: 'email',
        });
        return;
      }
      setIsLoading(false);
      setError('Please enter a valid email address.');
    }, 150);
  };

  const handleSelectDemoUser = (user: DemoUser) => {
    setEmail(user.email);
    setPassword(user.defaultPassword || 'password123');
    setError(null);
    setIsLoading(true);
    completeLogin(user);
  };

  return (
    <div className="login-container">
      <div className="login-bg-glow login-bg-glow-1" />
      <div className="login-bg-glow login-bg-glow-2" />

      <div className="login-card">
        {/* Left Side: Brand & Value Showcase */}
        <div className="login-brand-panel">
          <div>
            <div className="brand-badge">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise ERP</span>
            </div>
            <div style={{ margin: '14px 0 16px' }}>
              <AmsLogo variant="full" height={44} />
            </div>
            <p className="brand-desc">
              Accounting Management System & Multi-Sector Enterprise Resource Platform.
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <ShieldCheck size={14} />
                </div>
                <span>IAS / IFRS & GAAP Double-Entry Ledger</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <Globe size={14} />
                </div>
                <span>7 Global Tax Jurisdictions & E-Invoicing</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <Layers size={14} />
                </div>
                <span>Services, Retail, Manufacturing & Projects</span>
              </div>
            </div>
          </div>

          <div className="brand-footer">
            <span className="live-indicator" />
            <span>
              {(() => {
                const lic = getLicenseInfo();
                if (!lic.isTrial) return 'Operational · Enterprise Commercial Licensed';
                return `Operational · ${lic.daysRemaining} Days Left in ${lic.title}`;
              })()}
            </span>
          </div>
        </div>

        {/* Right Side: Sleek Form & Quick Persona Selector */}
        <div className="login-form-panel">
          <div className="login-panel-head">
            <h2 className="login-panel-title">
              {mode === 'signin' ? 'Sign In to AMS' : 'Create Organization Account'}
            </h2>
            <p className="login-panel-sub">
              {mode === 'signin'
                ? 'Enter your credentials or click any demo persona below.'
                : 'Fill in your details to set up your ERP account.'}
            </p>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="login-success">
              <CheckCircle2 size={15} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <div className="input-wrapper">
                  <input
                    id="fullName"
                    type="text"
                    className="login-input"
                    placeholder="Jane Cooper"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                  <UserIcon className="input-icon" />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  className="login-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                <Mail className="input-icon" />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <div className="input-wrapper">
                  <select
                    id="role"
                    className="login-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isLoading}
                  >
                    <option>Accountant</option>
                    <option>Senior Accountant</option>
                    <option>Finance admin</option>
                    <option>Manager</option>
                    <option>Viewer</option>
                  </select>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type="password"
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <Lock className="input-icon" />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="confirm">Confirm Password</label>
                <div className="input-wrapper">
                  <input
                    id="confirm"
                    type="password"
                    className="login-input"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={isLoading}
                  />
                  <Lock className="input-icon" />
                </div>
              </div>
            )}

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? (
                <div className="spinner" />
              ) : mode === 'signin' ? (
                <>
                  <span>Sign In</span>
                  <LogIn size={15} />
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <UserPlus size={15} />
                </>
              )}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'signin' ? (
              <span>
                New to AMS?{' '}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
                >
                  Create account
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
              >
                <ArrowLeft size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} /> Back to Sign In
              </button>
            )}
          </div>

          {/* 1-Click Auto-Fill Demo Personas Grid */}
          {mode === 'signin' && (
            <div className="demo-section">
              <div className="demo-header-title">
                <span>Select Demo Account</span>
                <span style={{ color: '#2dd4bf' }}>Auto-Fills Email & Password</span>
              </div>
              <div className="demo-chips-grid">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    className="demo-chip"
                    onClick={() => handleSelectDemoUser(user)}
                    disabled={isLoading}
                    title={`Click to fill email & password for ${user.fullName} (${user.role})`}
                  >
                    <div className="demo-chip-avatar">{user.avatar}</div>
                    <div className="demo-chip-content">
                      <span className="demo-chip-name">{user.fullName}</span>
                      <span className="demo-chip-role">{user.role}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}