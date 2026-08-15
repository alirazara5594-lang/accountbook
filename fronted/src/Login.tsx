import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, LogIn, UserPlus, User as UserIcon, ArrowLeft } from 'lucide-react';
import './Login.css';

export interface UserData {
  email: string;
  fullName: string;
  role: string;
  avatar: string;
  provider: 'email' | 'google';
}

interface LoginProps {
  onLogin: (user: UserData) => void;
}

const DEMO_USERS: UserData[] = [
  {
    email: 'admin@acme.com',
    fullName: 'Muhammad Ali',
    role: 'Finance admin',
    avatar: 'MA',
    provider: 'email',
  },
  {
    email: 'accountant@acme.com',
    fullName: 'Sarah Jenkins',
    role: 'Senior Accountant',
    avatar: 'SJ',
    provider: 'email',
  },
  {
    email: 'auditor@acme.com',
    fullName: 'John Doe',
    role: 'External Auditor',
    avatar: 'JD',
    provider: 'email',
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
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
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const emailNorm = email.toLowerCase().trim();
      const demo = DEMO_USERS.find((u) => u.email.toLowerCase() === emailNorm);
      if (demo && password === 'password123') {
        completeLogin(demo);
        return;
      }
      const registered = loadRegistered().find((u) => u.email.toLowerCase() === emailNorm);
      if (registered && registered.password === password) {
        completeLogin({
          email: registered.email,
          fullName: registered.fullName,
          role: registered.role,
          avatar: initials(registered.fullName),
          provider: 'email',
        });
        return;
      }
      setIsLoading(false);
      setError('Invalid email or password. Demo accounts use password123.');
    }, 800);
  };

  const handleQuickSelect = (user: UserData) => {
    setMode('signin');
    setEmail(user.email);
    setPassword('password123');
    setError(null);
    setSuccess(null);
  };

  // Instant login for admin account (first demo user)
  const handleInstantLogin = (user: UserData) => {
    completeLogin(user);
  };

  const handleGoogle = () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    // Mock Google Identity Services account chooser
    setTimeout(() => {
      completeLogin({
        email: 'you@gmail.com',
        fullName: 'Google User',
        role: 'Accountant',
        avatar: initials('Google User'),
        provider: 'google',
      });
    }, 900);
  };

  return (
    <div className="login-container">
      <div className="login-bg-glow login-bg-glow-1" />
      <div className="login-bg-glow login-bg-glow-2" />

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <b>account</b><span>book</span>
          </div>
          <p className="login-subtitle">
            {mode === 'signin'
              ? 'Sign in to your multi-entity ERP dashboard'
              : 'Create your account to get started'}
          </p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="login-success">
            <AlertCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        {mode === 'signin' && (
          <button type="button" className="google-btn" onClick={handleGoogle} disabled={isLoading}>
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="fullName">FULL NAME</label>
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
            <label htmlFor="email">EMAIL ADDRESS</label>
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
              <label htmlFor="role">ROLE</label>
              <div className="input-wrapper">
                <select
                  id="role"
                  className="login-input login-select"
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
            <label htmlFor="password">PASSWORD</label>
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
              <label htmlFor="confirm">CONFIRM PASSWORD</label>
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
                <LogIn size={18} />
              </>
            ) : (
              <>
                <span>Create Account</span>
                <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'signin' ? (
            <span>
              New to accountbook?{' '}
              <button type="button" className="auth-switch-link" onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}>
                Create an account
              </button>
            </span>
          ) : (
            <button type="button" className="auth-switch-link" onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}>
              <ArrowLeft size={14} style={{ verticalAlign: 'middle' }} /> Back to sign in
            </button>
          )}
        </div>

        {mode === 'signin' && (
          <div className="demo-accounts">
            <div className="demo-title">Demo User Accounts</div>
            <div className="demo-grid">
              {DEMO_USERS.map((user) => {
                const isAdmin = user.email === 'admin@acme.com'
                return (
                  <button
                    key={user.email}
                    type="button"
                    className={`demo-btn ${isAdmin ? 'instant' : ''}`}
                    onClick={() => isAdmin ? handleInstantLogin(user) : handleQuickSelect(user)}
                    disabled={isLoading}
                  >
                    <div className="demo-info">
                      <span className="demo-name">{user.fullName}</span>
                      <span className="demo-role">{user.role}</span>
                    </div>
                    <span className="demo-cred">
                      {isAdmin ? 'Click to login' : user.email.split('@')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}