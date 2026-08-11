import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, LogIn } from 'lucide-react';
import './Login.css';

export interface UserData {
  email: string;
  fullName: string;
  role: string;
  avatar: string;
}

interface LoginProps {
  onLogin: (user: UserData) => void;
}

const DEMO_USERS: UserData[] = [
  {
    email: 'admin@acme.com',
    fullName: 'Muhammad Ali',
    role: 'Finance admin',
    avatar: 'MA'
  },
  {
    email: 'accountant@acme.com',
    fullName: 'Sarah Jenkins',
    role: 'Senior Accountant',
    avatar: 'SJ'
  },
  {
    email: 'auditor@acme.com',
    fullName: 'John Doe',
    role: 'External Auditor',
    avatar: 'JD'
  }
];

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setIsLoading(true);

    // Mock network request delay for high-end feel
    setTimeout(() => {
      // Find user by email
      const matchedUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (matchedUser && password === 'password123') {
        setIsLoading(false);
        onLogin(matchedUser);
      } else {
        setIsLoading(false);
        setError('Invalid email or password. Use password123 for any demo account.');
      }
    }, 800);
  };

  const handleQuickSelect = (user: UserData) => {
    setEmail(user.email);
    setPassword('password123');
    setError(null);
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
          <p className="login-subtitle">Sign in to your multi-entity ERP dashboard</p>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
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

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        <div className="demo-accounts">
          <div className="demo-title">Demo User Accounts</div>
          <div className="demo-grid">
            {DEMO_USERS.map((user) => (
              <button
                key={user.email}
                type="button"
                className="demo-btn"
                onClick={() => handleQuickSelect(user)}
                disabled={isLoading}
              >
                <div className="demo-info">
                  <span className="demo-name">{user.fullName}</span>
                  <span className="demo-role">{user.role}</span>
                </div>
                <span className="demo-cred">{user.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
