import React, { useState } from 'react';
import { Eye, EyeOff, ShieldAlert, CheckCircle, UserPlus, Sun, Moon } from 'lucide-react';
import '../styles/LoginPage.css'; // signup uses the same auth card styles
import '../styles/SignupPage.css';

export default function SignupPage({ onNavigate, theme, toggleTheme }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [strength, setStrength] = useState({ label: 'Empty', score: 0, color: 'var(--text-secondary)' });

  // Toast notifier helper
  const triggerToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    
    let score = 0;
    if (val.length === 0) {
      setStrength({ label: 'Empty', score: 0, color: 'var(--text-secondary)' });
      return;
    }

    if (val.length >= 6) score++;
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];

    setStrength({
      label: labels[score - 1] || 'Too Weak',
      score: score,
      color: colors[score - 1] || '#ef4444'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (username.trim().length < 3) {
      triggerToast('Username must be at least 3 characters.', 'error');
      return;
    }

    if (password.length < 6) {
      triggerToast('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password
        }),
      });

      if (response.ok) {
        sessionStorage.setItem('just_registered_user', username.trim());
        triggerToast('Account created successfully!', 'success');
        setTimeout(() => {
          onNavigate('login');
        }, 1200);
      } else {
        // If Vite proxy returns bad gateway / timeout, fall back to local database
        if (response.status === 502 || response.status === 504 || response.status === 404) {
          throw new Error(`Proxy gateway status ${response.status}`);
        }
        const errorData = await response.json().catch(() => ({}));
        triggerToast(errorData.error || 'Registration failed.', 'error');
      }
    } catch (err) {
      console.warn('API signup request failed, falling back to local client database...', err);
      // Client-side fallback if backend is offline
      const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const duplicateUser = users.find(u => 
        u.username.toLowerCase() === username.trim().toLowerCase() || 
        u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (duplicateUser) {
        if (duplicateUser.username.toLowerCase() === username.trim().toLowerCase()) {
          triggerToast('Username is already taken.', 'error');
        } else {
          triggerToast('Email address is already registered.', 'error');
        }
        return;
      }

      users.push({ 
        username: username.trim(), 
        email: email.trim(), 
        password 
      });
      localStorage.setItem('registered_users', JSON.stringify(users));

      sessionStorage.setItem('just_registered_user', username.trim());
      triggerToast('Account created locally!', 'success');
      setTimeout(() => {
        onNavigate('login');
      }, 1200);
    }
  };

  return (
    <div className="auth-body">
      {/* Floating Theme Toggler */}
      <button type="button" onClick={toggleTheme} className="btn-theme-toggle" title="Toggle Theme Mode">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Ambient Glowing Background Blobs */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      {/* Toast Notification HUD */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type} show`}>
            <div className="toast-icon">
              {toast.type === 'success' ? (
                <CheckCircle size={18} />
              ) : (
                <ShieldAlert size={18} />
              )}
            </div>
            <div className="toast-message">{toast.message}</div>
            <button 
              className="toast-close" 
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <main className="auth-container">
        <div className="glass-card">
          {/* Header */}
          <div className="brand">
            <span className="brand-infosys">Infosys</span>
            <span className="brand-dot"></span>
            <span>Security</span>
          </div>

          <header className="auth-header">
            <h2 className="auth-title">Register Operator</h2>
            <p className="auth-subtitle">Create security clearance credentials to access SOC resources</p>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username Input */}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  id="username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="operator_name" 
                  required 
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@infosys.com" 
                  required 
                />
              </div>
            </div>

            {/* Password input */}
            <div className="form-group">
              <label htmlFor="password">Clearance Password</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password" 
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••" 
                  required 
                />
                <button 
                  type="button" 
                  className="btn-toggle-password" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              <div className="password-strength-wrapper">
                <div className="strength-bars">
                  <div 
                    className="strength-bar" 
                    style={{ backgroundColor: strength.score >= 1 ? strength.color : 'rgba(255,255,255,0.08)' }}
                  ></div>
                  <div 
                    className="strength-bar" 
                    style={{ backgroundColor: strength.score >= 2 ? strength.color : 'rgba(255,255,255,0.08)' }}
                  ></div>
                  <div 
                    className="strength-bar" 
                    style={{ backgroundColor: strength.score >= 3 ? strength.color : 'rgba(255,255,255,0.08)' }}
                  ></div>
                  <div 
                    className="strength-bar" 
                    style={{ backgroundColor: strength.score >= 4 ? strength.color : 'rgba(255,255,255,0.08)' }}
                  ></div>
                </div>
                <div className="strength-text">
                  Strength:{' '}
                  <span style={{ color: strength.color, fontWeight: 'bold' }}>
                    {strength.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-submit">
              <span>Register Clearance</span>
              <UserPlus size={16} strokeWidth={2.5} />
            </button>
          </form>

          {/* Footer */}
          <footer className="auth-footer">
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')} className="auth-link-btn">
              Log In
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}
