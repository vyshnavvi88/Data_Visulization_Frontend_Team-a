import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import '../styles/LandingPage.css';

export default function LandingPage({ onNavigate, theme, toggleTheme }) {
  useEffect(() => {
    // Robust removal of Spline logo watermark from shadow DOM
    let intervalId;
    const hideSplineLogo = () => {
      const viewer = document.querySelector('spline-viewer');
      if (viewer && viewer.shadowRoot) {
        const logo = viewer.shadowRoot.querySelector('#logo');
        if (logo) {
          logo.style.display = 'none';
          logo.remove();
          return true;
        }
      }
      return false;
    };

    // Poll every 50ms to ensure the watermark is caught early
    intervalId = setInterval(() => {
      if (hideSplineLogo()) {
        clearInterval(intervalId);
      }
    }, 50);

    // Run once on load
    hideSplineLogo();

    // Clear after 15 seconds to avoid memory leaks
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 15000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="landing-body">
      {/* Theme Toggle Switch */}
      <button onClick={toggleTheme} className="btn-theme-toggle" title="Toggle Theme Mode">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Spline 3D Globe Background */}
      <div className="spline-container">
        <spline-viewer url="https://prod.spline.design/U0tqb4deFtcdXE9U/scene.splinecode"></spline-viewer>
      </div>

      {/* Hero Content Overlay */}
      <main className="hero-container">
        <section className="hero-content">
          <h1 className="hero-title">
            <span className="infosys-blue">Infosys</span><br />
            Threat Detection<br />
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="hero-desc">
            Safeguard your enterprise operations and stay ahead of zero-day vulnerabilities.
          </p>
          <button onClick={() => onNavigate('login')} className="btn-join">
            Get Started
          </button>
        </section>
      </main>
    </div>
  );
}
