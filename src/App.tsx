import React from 'react';
import KPICards from './components/KPICards';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  return (
    <div className="min-vh-100 py-4 px-3 px-md-4" style={{ backgroundColor: '#0b1120', color: '#f8fafc' }}>
      <div className="container-fluid max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <header className="mb-4 pb-3 border-bottom border-secondary-subtle d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-pill small fw-bold">
                SOC LIVE MONITORING
              </span>
              <span className="text-secondary small">• final_security_dataset.csv</span>
            </div>
            <h1 className="h3 fw-bold text-white mb-0">AI-Assisted Threat Detection Dashboard</h1>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill small fw-medium">
              ● System Active & Monitoring
            </span>
          </div>
        </header>

        {/* KPI Cards Module */}
        <main>
          <KPICards />
        </main>
      </div>
    </div>
  );
}


