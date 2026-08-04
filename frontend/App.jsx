import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('landing');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('appTheme') || 'dark';
  });

  // Apply theme class to document element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  // Toggle theme helper
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('appTheme', nextTheme);
  };

  // Route Guard verification helper
  const handleNavigation = (route) => {
    if (route === 'dashboard') {
      const sessionUser = localStorage.getItem('currentUser');
      if (!sessionUser) {
        setCurrentRoute('login');
        return;
      }
    }
    setCurrentRoute(route);
  };


  return (
    <>
      {currentRoute === 'landing' && (
        <LandingPage 
          onNavigate={handleNavigation} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
      {currentRoute === 'login' && (
        <LoginPage 
          onNavigate={handleNavigation} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
      {currentRoute === 'signup' && (
        <SignupPage 
          onNavigate={handleNavigation} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
      {currentRoute === 'dashboard' && (
        <DashboardPage 
          onNavigate={handleNavigation} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
    </>
  );
}
