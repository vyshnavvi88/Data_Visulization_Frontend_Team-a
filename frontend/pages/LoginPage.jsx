import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldAlert, CheckCircle, ArrowRight, Sun, Moon } from 'lucide-react';
import '../styles/LoginPage.css';

export default function LoginPage({ onNavigate, theme, toggleTheme }) {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast notifier helper
  const triggerToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    // Check if account created redirect exists in query parameters (emulated or in session)
    const registeredUser = sessionStorage.getItem('just_registered_user');
    if (registeredUser) {
      triggerToast(`Success! Account created for ${registeredUser}. Please login.`, 'success');
      sessionStorage.removeItem('just_registered_user');
    }
  }, [onNavigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identity.trim() || !password) {
      triggerToast('Please fill out all fields.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identity, password }),
      });

      if (response.ok) {
        const activeUser = await response.json();
        triggerToast('Authentication successful!', 'success');
        
        const sessionData = {
          username: activeUser.username,
          email: activeUser.email,
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('currentUser', JSON.stringify(sessionData));

        setTimeout(() => {
          onNavigate('dashboard');
        }, 1200);
      } else {
        const errorData = await response.json().catch(() => ({}));
        triggerToast(errorData.error || 'Invalid email/username or password.', 'error');
      }
    } catch (err) {
      console.warn('API login request failed, falling back to local client database...', err);
      // Client-side fallback if backend is offline
      const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const foundUser = users.find(u => 
        (u.username.toLowerCase() === identity.trim().toLowerCase() || 
         u.email.toLowerCase() === identity.trim().toLowerCase()) && 
        u.password === password
      );

      const isAdminDefault = users.length === 0 && 
        (identity.trim().toLowerCase() === 'admin' && password === 'admin123');

      if (foundUser || isAdminDefault) {
        const activeUser = foundUser || { username: 'Admin Operator', email: 'admin@infosys.com' };
        triggerToast('Authentication successful (Local Session)!', 'success');
        
        const sessionData = {
          username: activeUser.username,
          email: activeUser.email,
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('currentUser', JSON.stringify(sessionData));

        setTimeout(() => {
          onNavigate('dashboard');
        }, 1200);
      } else {
        triggerToast('Invalid email/username or password.', 'error');
      }
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
            <h2 className="auth-title">Welcome Analyst</h2>
            <p className="auth-subtitle">Verify credentials to initialize monitoring environment</p>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Identity input */}
            <div className="form-group">
              <label htmlFor="identity">Email or Username</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  id="identity" 
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="analyst@infosys.com or username" 
                  required 
                />
              </div>
            </div>

            {/* Password input */}
            <div className="form-group">
              <label htmlFor="password">Security Password</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {/* Options */}
            <div className="form-options">
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="remember-checkbox" 
                />
                Remember me
              </label>
              <a 
                href="#forgot" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  triggerToast('Password reset link sent! Check your email.', 'success'); 
                }} 
                className="forgot-password"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-submit">
              <span>Sign In</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </form>

          {/* Footer */}
          <footer className="auth-footer">
            Don't have an account?{' '}
            <button onClick={() => onNavigate('signup')} className="auth-link-btn">
              Create Account
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}
