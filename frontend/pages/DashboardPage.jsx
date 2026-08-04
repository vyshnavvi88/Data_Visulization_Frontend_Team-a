import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldAlert, AlertTriangle, Bug, Siren,
  LayoutDashboard, Map, Database, Shield, Settings,
  LogOut, Play, Square, Download, Search, RefreshCw,
  Terminal, ShieldCheck, Sun, Moon, Info, Sliders,
  UserCheck, ShieldQuestion, Menu
} from 'lucide-react';
import { getEvents, getStats } from '../services/api';
import DashboardCharts from '../charts/DashboardCharts';
import '../styles/DashboardPage.css';

export default function DashboardPage({ onNavigate, theme, toggleTheme }) {
  // Navigation State
  const [activePanel, setActivePanel] = useState('Overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Core Data
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    criticalThreats: 0,
    highSeverityAlerts: 0,
    vulnerabilities: 0,
    activeIncidents: 0
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [ipFilter, setIpFilter] = useState('ALL');
  
  // Simulator Controls
  const [isSimulating, setIsSimulating] = useState(true);
  const [simInterval, setSimInterval] = useState(12); // Speed in seconds
  const [severityAlertFilter, setSeverityAlertFilter] = useState('ALL'); // Simulator threshold

  // Vulnerability Shield Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanTarget, setScanTarget] = useState('System Secure');
  const [scanLog, setScanLog] = useState([
    'All shield buffers loaded.',
    'Gateway proxy active.'
  ]);
  const [scanSummary, setScanSummary] = useState({ audited: 1482, vulnerabilities: 0 });

  // Terminal Logs State
  const [terminalLogs, setTerminalLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), message: 'Initialized threat diagnostics framework...', type: 'info' },
    { id: 2, time: new Date().toLocaleTimeString(), message: 'Firewall rules compiled. Shield active.', type: 'success' }
  ]);
  const [toasts, setToasts] = useState([]);
  const [currentUser, setCurrentUser] = useState({ username: 'Admin Operator', email: '' });
  const [liveTime, setLiveTime] = useState('--:--:--');

  const simulationIntervalRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const terminalBottomRef = useRef(null);

  // Load user details and clock
  useEffect(() => {
    const sessionUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (sessionUser.username) {
      setCurrentUser(sessionUser);
    }

    const timer = setInterval(() => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch initial events
  useEffect(() => {
    async function loadData() {
      const allEvents = await getEvents();
      const initialStats = await getStats();
      setEvents(allEvents);
      setStats(initialStats);
    }
    loadData();
  }, []);

  // Auto scroll terminal logs to bottom
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollTop = terminalBottomRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Toast Alerts Trigger
  const triggerToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Log to terminal console
  const logTerminal = (message, type = 'info') => {
    setTerminalLogs((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        message,
        type
      }
    ].slice(-30));
  };

  // Threat templates for live simulation generator
  const threatTemplates = [
    { name: "Unauthorized SSH Attempt", source: "172.56.230.12", target: "Production-DB-Proxy", severity: "CRITICAL", event_type: "Brute Force" },
    { name: "Anomalous Traffic Spike Detected", source: "185.220.101.4", target: "Asset-Storage-S3", severity: "WARNING", event_type: "Reconnaissance" },
    { name: "SQL Injection Probe Blocked", source: "109.112.5.88", target: "Payment-Backend-API", severity: "CRITICAL", event_type: "Malware" },
    { name: "DNS Query Leak Vulnerability Check", source: "192.168.12.94", target: "Gateway-Router-03", severity: "WARNING", event_type: "Phishing" }
  ];

  // Threat Simulator Generator Hook
  useEffect(() => {
    if (isSimulating) {
      const delayMs = simInterval * 1000;
      simulationIntervalRef.current = setInterval(() => {
        // Pick a template
        let template = threatTemplates[Math.floor(Math.random() * threatTemplates.length)];
        
        // Respect simulator severity settings
        if (severityAlertFilter === 'CRITICAL' && template.severity !== 'CRITICAL') {
          template = threatTemplates.find(t => t.severity === 'CRITICAL') || template;
        } else if (severityAlertFilter === 'WARNING' && template.severity !== 'WARNING') {
          template = threatTemplates.find(t => t.severity === 'WARNING') || template;
        }

        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const newIncident = {
          id: Date.now(),
          time: time,
          timestamp: time,
          name: template.name,
          event_type: template.event_type,
          source: template.source,
          source_ip: template.source,
          target: template.target,
          destination_ip: template.target,
          severity: template.severity,
          status: 'UNRESOLVED',
          is_high_risk: template.severity === 'CRITICAL'
        };

        setEvents((prev) => [newIncident, ...prev]);

        const alertType = template.severity === 'CRITICAL' ? 'critical' : 'warning';
        logTerminal(`Intrusion anomaly detected: ${template.name} targeting host ${template.target}.`, alertType);
        triggerToast(`${template.name} from ${template.source} targeting ${template.target}`, alertType);

        setStats((prev) => ({
          ...prev,
          totalEvents: prev.totalEvents + 1,
          criticalThreats: template.severity === 'CRITICAL' ? prev.criticalThreats + 1 : prev.criticalThreats,
          highSeverityAlerts: template.severity === 'WARNING' ? prev.highSeverityAlerts + 1 : prev.highSeverityAlerts,
          activeIncidents: prev.activeIncidents + 1
        }));
      }, delayMs);
    } else {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [isSimulating, simInterval, severityAlertFilter]);

  // Handler functions
  const handleInvestigate = (id) => {
    setEvents((prev) => 
      prev.map((evt) => {
        if (evt.id === id) {
          logTerminal(`Threat Vector #${id} is now flagged as [UNDER INVESTIGATION] by ${currentUser.username}.`, 'info');
          triggerToast(`Investigating: ${evt.name || evt.event_type}`, 'info');
          return { ...evt, status: 'UNDER_INVESTIGATION' };
        }
        return evt;
      })
    );
  };

  const handleResolve = (id) => {
    setEvents((prev) => 
      prev.map((evt) => {
        if (evt.id === id) {
          logTerminal(`Threat Vector #${id} (${evt.name || evt.event_type}) successfully mitigated and resolved.`, 'success');
          triggerToast(`Resolved: ${evt.name || evt.event_type}`, 'info');
          
          setStats((prevStats) => ({
            ...prevStats,
            activeIncidents: Math.max(0, prevStats.activeIncidents - 1)
          }));

          return { ...evt, status: 'RESOLVED' };
        }
        return evt;
      })
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    logTerminal('Terminating analyst session...', 'warning');
    setTimeout(() => {
      onNavigate('landing');
    }, 800);
  };

  // Diagnostic scanner simulation hook
  const startDiagnosticsScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanLog(['Starting diagnostics scanner...', 'Acquiring security locks...']);
    
    let currentPct = 0;
    const scanSteps = [
      { progress: 10, target: 'Gateway Router SSL certificate', log: 'SSL credentials verified. No expiration flags.' },
      { progress: 30, target: 'Network port configuration', log: 'Scanning ports... 22, 80, 443 are audited. Shields locked.' },
      { progress: 50, target: 'Database clustering permission locks', log: 'Permissions check completed. Row limits audited.' },
      { progress: 75, target: 'Public S3 Buckets access keys', log: 'Audit complete. ACL parameters verify private access.' },
      { progress: 90, target: 'Threat database correlation logs', log: 'Analyzing log ratios... Outdated log entries found.' },
      { progress: 100, target: 'Active Clearance profiles', log: 'System audit done. clearance Operator logs sanitized.' }
    ];

    scanIntervalRef.current = setInterval(() => {
      currentPct += 5;
      setScanProgress(currentPct);

      const step = scanSteps.find(s => s.progress === currentPct);
      if (step) {
        setScanTarget(step.target);
        setScanLog(prev => [...prev, `[AUDITING] ${step.target}`, `[SUCCESS] ${step.log}`]);
      }

      if (currentPct >= 100) {
        clearInterval(scanIntervalRef.current);
        setIsScanning(false);
        setScanSummary({ audited: 1482, vulnerabilities: 1 });
        logTerminal('Diagnostics audit completed. 0 critical vulnerabilities found.', 'success');
        triggerToast('System Diagnostics Audit Completed!', 'success');
      }
    }, 200);
  };

  // Filter calculations
  const uniqueEventTypes = ['ALL', ...new Set(events.map(e => e.name || e.event_type).filter(Boolean))];
  const uniqueSourceIps = ['ALL', ...new Set(events.map(e => e.source || e.source_ip).filter(Boolean))];

  const filteredEvents = events.filter((evt) => {
    const nameStr = (evt.name || evt.event_type || '').toLowerCase();
    const sourceStr = (evt.source || evt.source_ip || '').toLowerCase();
    const targetStr = (evt.target || evt.destination_ip || '').toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch = nameStr.includes(searchLower) || 
                          sourceStr.includes(searchLower) || 
                          targetStr.includes(searchLower);

    let matchesSeverity = true;
    if (severityFilter !== 'ALL') {
      if (severityFilter === 'CRITICAL') matchesSeverity = evt.severity === 'CRITICAL';
      else if (severityFilter === 'WARNING') matchesSeverity = evt.severity === 'HIGH' || evt.severity === 'WARNING';
      else if (severityFilter === 'RESOLVED') matchesSeverity = evt.status === 'RESOLVED';
    }

    const matchesEventType = eventTypeFilter === 'ALL' || (evt.name || evt.event_type) === eventTypeFilter;
    const matchesIp = ipFilter === 'ALL' || (evt.source || evt.source_ip) === ipFilter;

    return matchesSearch && matchesSeverity && matchesEventType && matchesIp;
  });

  const handleExportCSV = () => {
    if (filteredEvents.length === 0) {
      triggerToast('No logs available to export.', 'warning');
      return;
    }

    const headers = ['Time', 'Threat Vector', 'Source IP', 'Target Host', 'Severity', 'Status'];
    const rows = filteredEvents.map(evt => [
      evt.time || evt.timestamp,
      evt.name || evt.event_type,
      evt.source || evt.source_ip,
      evt.target || evt.destination_ip,
      evt.severity,
      evt.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_threat_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logTerminal(`Exported ${filteredEvents.length} logs to CSV file successfully.`, 'success');
    triggerToast(`Exported ${filteredEvents.length} logs to CSV`, 'info');
  };

  // --- SUB-RENDER 1: OVERVIEW PANEL ---
  const renderOverview = () => (
    <>
      {/* KPI Cards Grid */}
      <section className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Events</span>
            <div className="kpi-icon-circle"><Activity size={18} /></div>
          </div>
          <h2 className="kpi-value">{stats.totalEvents.toLocaleString()}</h2>
          <span className="kpi-display">Total logged security network events</span>
        </div>

        <div className="kpi-card kpi-red">
          <div className="kpi-card-header">
            <span className="kpi-title">Critical Threats</span>
            <div className="kpi-icon-circle"><ShieldAlert size={18} /></div>
          </div>
          <h2 className="kpi-value">{stats.criticalThreats.toLocaleString()}</h2>
          <span className="kpi-display">Total severe active threat counts</span>
        </div>

        <div className="kpi-card kpi-orange">
          <div className="kpi-card-header">
            <span className="kpi-title">High Alerts</span>
            <div className="kpi-icon-circle"><AlertTriangle size={18} /></div>
          </div>
          <h2 className="kpi-value">{stats.highSeverityAlerts.toLocaleString()}</h2>
          <span className="kpi-display">High severity vulnerabilities flagged</span>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-card-header">
            <span className="kpi-title">Vulnerabilities</span>
            <div className="kpi-icon-circle"><Bug size={18} /></div>
          </div>
          <h2 className="kpi-value">{stats.vulnerabilities.toLocaleString()}</h2>
          <span className="kpi-display">Scanned bugs or CVSS scores &ge; 7</span>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-card-header">
            <span className="kpi-title">Active Incidents</span>
            <div className="kpi-icon-circle"><Siren size={18} /></div>
          </div>
          <h2 className="kpi-value">{stats.activeIncidents.toLocaleString()}</h2>
          <span className="kpi-display">Total unresolved threat counts</span>
        </div>
      </section>


      {/* Simulator control and mini terminal logs */}
      <section className="terminal-simulation-grid mb-4">
        <div className="row g-4">
          <div className="col-lg-8 col-12">
            <div className="terminal-card">
              <div className="terminal-card-header">
                <div className="d-flex align-items-center gap-2 text-white">
                  <Terminal size={16} className="text-success" />
                  <span className="fw-semibold font-mono">Intrusion Feed Terminal (Live Log stream)</span>
                </div>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 rounded-pill small fw-medium">
                  ● ACTIVE
                </span>
              </div>
              <div className="terminal-feed" ref={terminalBottomRef}>
                {terminalLogs.map((log) => (
                  <div key={log.id} className={`terminal-line ${log.type === 'critical' ? 'critical' : log.type === 'warning' ? 'warning' : log.type === 'success' ? 'text-success' : ''}`}>
                    [{log.time}] {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-4 col-12">
            <div className="control-card h-100">
              <h4 className="text-white mb-2 fw-semibold d-flex align-items-center gap-2">
                <Sliders size={18} className="text-success" />
                <span>Simulation Toolkit</span>
              </h4>
              <p className="text-secondary small mb-3">
                Operate dynamic generation settings to trigger simulated cyber intrusions.
              </p>
              <div className="d-flex flex-column gap-2">
                <button 
                  onClick={() => {
                    setIsSimulating(!isSimulating);
                    logTerminal(isSimulating ? 'Threat simulator PAUSED.' : 'Threat simulator INITIATED.', 'warning');
                  }}
                  className={`btn-control-toggle ${isSimulating ? 'active-sim' : 'inactive-sim'}`}
                >
                  {isSimulating ? (
                    <>
                      <Square size={16} />
                      <span>Stop Attack Simulator</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      <span>Start Attack Simulator</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={async () => {
                    const allEvents = await getEvents();
                    const initialStats = await getStats();
                    setEvents(allEvents);
                    setStats(initialStats);
                    logTerminal('Database logs synchronized.', 'success');
                    triggerToast('Database re-synchronized!', 'success');
                  }}
                  className="btn-control-sync"
                >
                  <RefreshCw size={16} />
                  <span>Sync with Database</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time event log table */}
      <section className="logs-section">
        <div className="logs-header">
          <h3 className="logs-title text-white">Real-Time Threat Vector Log</h3>
          
          <div className="logs-toolbar d-flex flex-wrap align-items-center gap-3">
            <div className="search-bar">
              <Search size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vector, host, IP..." 
              />
            </div>

            <div className="dropdown-filters d-flex gap-2">
              <select 
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="filter-select"
                title="Event Type"
              >
                <option value="ALL">All Event Types</option>
                {uniqueEventTypes.filter(t => t !== 'ALL').map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select 
                value={ipFilter}
                onChange={(e) => setIpFilter(e.target.value)}
                className="filter-select"
                title="Source IP"
              >
                <option value="ALL">All Source IPs</option>
                {uniqueSourceIps.filter(ip => ip !== 'ALL').map(ip => (
                  <option key={ip} value={ip}>{ip}</option>
                ))}
              </select>
            </div>

            <div className="table-controls">
              <button 
                className={`log-filter-btn ${severityFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSeverityFilter('ALL')}
              >
                All
              </button>
              <button 
                className={`log-filter-btn ${severityFilter === 'CRITICAL' ? 'active' : ''}`}
                onClick={() => setSeverityFilter('CRITICAL')}
              >
                Critical
              </button>
              <button 
                className={`log-filter-btn ${severityFilter === 'WARNING' ? 'active' : ''}`}
                onClick={() => setSeverityFilter('WARNING')}
              >
                Warning
              </button>
              <button 
                className={`log-filter-btn ${severityFilter === 'RESOLVED' ? 'active' : ''}`}
                onClick={() => setSeverityFilter('RESOLVED')}
              >
                Resolved
              </button>
            </div>

            <button onClick={handleExportCSV} className="btn-export-csv" title="Export CSV">
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Incidence Time</th>
                <th>Threat Vector</th>
                <th>Source Address</th>
                <th>Target Host</th>
                <th>Severity</th>
                <th>Status Badge</th>
                <th>Operator Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-secondary py-5">
                    No matching security records found.
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 15).map((log) => {
                  let statusLabel = 'Unresolved';
                  let badgeClass = 'badge-critical';
                  if (log.status === 'UNDER_INVESTIGATION') {
                    statusLabel = 'Investigating';
                    badgeClass = 'badge-warning';
                  } else if (log.status === 'RESOLVED') {
                    statusLabel = 'Resolved';
                    badgeClass = 'badge-low';
                  }

                  return (
                    <tr key={log.id}>
                      <td className="font-mono text-secondary small">{log.time || log.timestamp}</td>
                      <td className="fw-semibold text-white">{log.name || log.event_type}</td>
                      <td className="font-mono text-info small">{log.source || log.source_ip}</td>
                      <td className="text-secondary">{log.target || log.destination_ip}</td>
                      <td>
                        <span className={`badge badge-${(log.severity || 'LOW').toLowerCase()}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass} small`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td>
                        {log.status !== 'RESOLVED' ? (
                          <>
                            <button 
                              className="btn-table-action btn-investigate" 
                              onClick={() => handleInvestigate(log.id)}
                            >
                              Investigate
                            </button>
                            <button 
                              className="btn-table-action btn-dismiss" 
                              onClick={() => handleResolve(log.id)}
                            >
                              Resolve
                            </button>
                          </>
                        ) : (
                          <span className="text-muted d-flex align-items-center gap-1 small">
                            <ShieldCheck size={12} className="text-success" />
                            Archived
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  // --- SUB-RENDER 2: INTERACTIVE THREAT MAP PANEL ---
  const renderThreatMap = () => {
    // Extract unique active sources
    const activeThreats = events.filter(e => e.status !== 'RESOLVED').slice(0, 5);

    // Geographic coordinates for SVG map projection (600x320 grid)
    const geographicOrigins = [
      { name: 'North America (US-East)', x: 110, y: 75 },
      { name: 'Europe Region (EU-Central)', x: 250, y: 65 },
      { name: 'East Asia Region (APAC-East)', x: 430, y: 85 },
      { name: 'South America (LATAM-East)', x: 135, y: 185 },
      { name: 'Africa Region (AF-South)', x: 285, y: 205 }
    ];

    const targetDatacenter = { x: 350, y: 130, name: 'Mumbai Datacenter (Mainframe)' };

    return (
      <section className="threat-map-section card-view">
        <div className="panel-header mb-4">
          <h3 className="text-white d-flex align-items-center gap-2">
            <Map className="text-success" />
            <span>Interactive Cyber Heatmap & Threat Map</span>
          </h3>
          <p className="text-secondary small">Visualizing geographical attack distributions and vector entry points globally</p>
        </div>

        <div className="threat-map-container">
          <div className="row align-items-center">
            {/* Map Visual (SVG Nodes and Connections) */}
            <div className="col-md-8 col-12">
              <div className="map-canvas-wrapper">
                <svg viewBox="0 0 600 320" className="map-svg">
                  {/* Grid gridlines */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Abstract Continent Shapes in Background */}
                  <g fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" className="map-continents">
                    {/* North America */}
                    <path d="M 40 40 L 140 30 L 160 80 L 120 100 L 90 110 L 60 70 Z" />
                    {/* South America */}
                    <path d="M 120 120 L 150 140 L 140 210 L 110 230 L 105 160 Z" />
                    {/* Africa */}
                    <path d="M 235 120 L 295 110 L 315 155 L 290 210 L 260 230 L 245 150 Z" />
                    {/* Europe & Asia */}
                    <path d="M 220 40 L 305 30 L 440 40 L 470 100 L 390 150 L 330 135 L 260 80 Z" />
                    {/* Australia */}
                    <path d="M 440 185 L 490 175 L 510 210 L 460 220 Z" />
                  </g>

                  {/* Heatmap/Threat flow vector lines */}
                  {activeThreats.map((threat, index) => {
                    const origin = geographicOrigins[index % geographicOrigins.length];
                    const strokeColor = threat.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b';
                    
                    return (
                      <g key={threat.id}>
                        {/* Bezier curved threat flow pipe */}
                        <path 
                          d={`M ${origin.x} ${origin.y} C ${(origin.x + targetDatacenter.x)/2} ${Math.min(origin.y, targetDatacenter.y) - 20}, ${(origin.x + targetDatacenter.x)/2} ${Math.max(origin.y, targetDatacenter.y) + 20}, ${targetDatacenter.x} ${targetDatacenter.y}`} 
                          fill="none" 
                          stroke={strokeColor} 
                          strokeWidth="1.5"
                          strokeDasharray="6, 6"
                          className="attack-vector-line"
                        />
                      </g>
                    );
                  })}

                  {/* Heatmap Heat glow rings & Coordinate Pins */}
                  {activeThreats.map((threat, index) => {
                    const origin = geographicOrigins[index % geographicOrigins.length];
                    const isCritical = threat.severity === 'CRITICAL';
                    const glowColor = isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
                    const coreColor = isCritical ? '#ef4444' : '#f59e0b';

                    return (
                      <g key={threat.id} className="map-node font-mono">
                        {/* Heatmap bubble (Glow) */}
                        <circle cx={origin.x} cy={origin.y} r="18" fill={glowColor} className="heatmap-bubble-glow" />
                        <circle cx={origin.x} cy={origin.y} r="5" fill={coreColor} className="pulse-node" />
                        
                        {/* Host tag info */}
                        <text x={origin.x + 8} y={origin.y - 6} fill="#10b981" fontSize="8" fontWeight="600">IP SOURCE</text>
                        <text x={origin.x + 8} y={origin.y + 4} fill="#8e9fa6" fontSize="9" fontWeight="500">{threat.source || threat.source_ip}</text>
                      </g>
                    );
                  })}

                  {/* Local Enterprise target hub node */}
                  <g className="map-node target-hub">
                    {/* Target glowing sonar circles */}
                    <circle cx={targetDatacenter.x} cy={targetDatacenter.y} r="20" fill="none" stroke="var(--accent-mint)" strokeWidth="1.5" className="pulse-target" />
                    <circle cx={targetDatacenter.x} cy={targetDatacenter.y} r="12" fill="rgba(16, 185, 129, 0.1)" />
                    <circle cx={targetDatacenter.x} cy={targetDatacenter.y} r="6" fill="var(--accent-mint)" />
                    <text x={targetDatacenter.x - 50} y={targetDatacenter.y + 32} fill="#ffffff" fontSize="10" fontWeight="700">Mumbai Datacenter (Mainframe)</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Attack Details Overlay */}
            <div className="col-md-4 col-12">
              <div className="active-threats-card">
                <h5 className="text-white mb-3 fw-semibold">Live Threat Vector Streams</h5>
                <div className="d-flex flex-column gap-3">
                  {activeThreats.length === 0 ? (
                    <div className="text-center text-secondary py-4 small">
                      No active threats targeting Mainframe Gateway.
                    </div>
                  ) : (
                    activeThreats.map(threat => (
                      <div key={threat.id} className="active-threat-item">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="small font-mono text-danger fw-bold">{threat.source || threat.source_ip}</span>
                          <span className={`badge badge-${(threat.severity || 'LOW').toLowerCase()} xsmall`}>
                            {threat.severity}
                          </span>
                        </div>
                        <div className="text-white small fw-medium">{threat.name || threat.event_type}</div>
                        <div className="text-secondary xsmall mt-1">Targeting: {threat.target || threat.destination_ip}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // --- SUB-RENDER 3: THREAT TIMELINE PANEL ---
  const renderIncidents = () => {
    return (
      <section className="timeline-section card-view">
        <div className="panel-header mb-4">
          <h3 className="text-white d-flex align-items-center gap-2">
            <Database className="text-success" />
            <span>Threat Incident Timeline</span>
          </h3>
          <p className="text-secondary small">Chronological listing of security events and analyst responses</p>
        </div>

        <div className="timeline-wrapper">
          {events.length === 0 ? (
            <div className="text-center text-secondary py-5">
              No incidents recorded.
            </div>
          ) : (
            <div className="timeline-track">
              {events.slice(0, 15).map((evt) => {
                const isCritical = evt.severity === 'CRITICAL';
                const isResolved = evt.status === 'RESOLVED';
                
                let dotColor = '#10b981'; // resolved
                if (!isResolved) {
                  dotColor = isCritical ? '#ef4444' : '#f59e0b';
                }

                return (
                  <div key={evt.id} className="timeline-item">
                    <div className="timeline-node" style={{ backgroundColor: dotColor }}>
                      {!isResolved && <span className="timeline-node-glow" style={{ boxShadow: `0 0 8px ${dotColor}` }} />}
                    </div>
                    
                    <div className="timeline-card-content">
                      <div className="timeline-card-header d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="font-mono text-secondary small">{evt.time || evt.timestamp}</span>
                          <span className={`badge badge-${(evt.severity || 'LOW').toLowerCase()} xsmall`}>
                            {evt.severity}
                          </span>
                        </div>
                        <span className="xsmall text-secondary">{evt.status === 'RESOLVED' ? 'Resolved' : 'Active'}</span>
                      </div>

                      <h5 className="text-white mb-1 fw-semibold">{evt.name || evt.event_type}</h5>
                      <div className="row g-2 mt-2">
                        <div className="col-6">
                          <div className="xsmall text-secondary">SOURCE ADDRESS</div>
                          <div className="small text-info font-mono">{evt.source || evt.source_ip}</div>
                        </div>
                        <div className="col-6">
                          <div className="xsmall text-secondary">TARGET SERVICE</div>
                          <div className="small text-white font-mono">{evt.target || evt.destination_ip}</div>
                        </div>
                      </div>

                      <div className="timeline-card-actions mt-3 pt-2 border-top border-secondary-subtle d-flex justify-content-end">
                        {evt.status !== 'RESOLVED' ? (
                          <div className="d-flex gap-2">
                            <button 
                              className="btn-table-action btn-investigate py-1"
                              onClick={() => handleInvestigate(evt.id)}
                            >
                              Investigate
                            </button>
                            <button 
                              className="btn-table-action btn-dismiss py-1"
                              onClick={() => handleResolve(evt.id)}
                            >
                              Resolve
                            </button>
                          </div>
                        ) : (
                          <span className="text-success small d-flex align-items-center gap-1">
                            <ShieldCheck size={12} /> Mitigated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    );
  };

  // --- SUB-RENDER 4: RADAR SHIELD SCAN PANEL ---
  const renderShieldScans = () => {
    return (
      <section className="scan-section card-view">
        <div className="panel-header mb-4">
          <h3 className="text-white d-flex align-items-center gap-2">
            <Shield className="text-success" />
            <span>Vulnerability Shield Scanner</span>
          </h3>
          <p className="text-secondary small">Initiate threat assessments and diagnostic scans of network ports</p>
        </div>

        <div className="row g-4 align-items-center">
          {/* Radar Anim Widget */}
          <div className="col-md-6 col-12">
            <div className="radar-scanner-widget">
              <div className="radar-circle">
                <div className={`radar-sweep ${isScanning ? 'scanning' : ''}`} />
                <div className="radar-target-dots">
                  <div className="radar-dot dot-1 active-dot" />
                  <div className="radar-dot dot-2 active-dot" />
                  <div className="radar-dot dot-3" />
                </div>
              </div>
              <div className="text-center mt-3">
                <div className="text-white small fw-bold">Scan Scope: {scanTarget}</div>
                <div className="text-secondary xsmall mt-1">Status: {isScanning ? 'DIAGNOSTICS IN PROGRESS' : 'IDLE'}</div>
              </div>
            </div>
          </div>

          {/* Progress Logs & Summaries */}
          <div className="col-md-6 col-12">
            <div className="scan-audit-card p-4 rounded bg-dark border border-secondary-subtle">
              <h5 className="text-white mb-3 fw-semibold">Audit Scan Control Center</h5>
              
              {/* Progress Indicator */}
              <div className="mb-4">
                <div className="d-flex justify-content-between small text-secondary mb-1">
                  <span>Audit Progress</span>
                  <span className="text-white fw-bold">{scanProgress}%</span>
                </div>
                <div className="progress" style={{ height: '6px', backgroundColor: '#090f12' }}>
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar" 
                    style={{ width: `${scanProgress}%` }} 
                    aria-valuenow={scanProgress} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  />
                </div>
              </div>

              {/* Trigger audit */}
              <button 
                onClick={startDiagnosticsScan} 
                disabled={isScanning}
                className="btn-submit w-100 py-3 d-flex align-items-center justify-content-center gap-2 mb-4"
              >
                <ShieldCheck size={18} />
                <span>{isScanning ? 'Executing Diagnostics Audit...' : 'Initiate Security Audit'}</span>
              </button>

              {/* Real-time check outputs */}
              <div className="scan-logs-wrapper mt-3">
                <div className="xsmall text-secondary mb-1">AUDIT REAL-TIME OUTPUTS</div>
                <div className="scan-console-logs">
                  {scanLog.map((log, index) => (
                    <div key={index} className="scan-log-line font-mono xsmall text-secondary">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };



  return (
    <div className={`dashboard-body ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Background ambient glow */}
      <div className="dashboard-glow glow-top-right"></div>

      {/* Toast alert system HUD */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type === 'critical' ? 'critical' : 'info'} show`}>
            <div className="toast-icon">
              {toast.type === 'critical' ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div className="toast-content-wrapper">
              <div className="toast-header-text">
                {toast.type === 'critical' ? 'Alert Flagged' : 'System Notice'}
              </div>
              <div className="toast-message-text">{toast.message}</div>
            </div>
            <button 
              className="toast-close" 
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="brand-logo"></span>
          <h1 className="brand-name">
            <span className="brand-infosys">Infosys</span> Security
          </h1>
        </div>

        <ul className="sidebar-menu">
          <li className={`menu-item ${activePanel === 'Overview' ? 'active' : ''}`} onClick={() => setActivePanel('Overview')}>
            <a href="#overview" onClick={(e) => e.preventDefault()}>
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Security Events' ? 'active' : ''}`} onClick={() => setActivePanel('Security Events')}>
            <a href="#events" onClick={(e) => e.preventDefault()}>
              <Database size={18} />
              <span>Security Events</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Threat Intelligence' ? 'active' : ''}`} onClick={() => setActivePanel('Threat Intelligence')}>
            <a href="#intelligence" onClick={(e) => e.preventDefault()}>
              <Map size={18} />
              <span>Threat Intelligence</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Vulnerabilities' ? 'active' : ''}`} onClick={() => setActivePanel('Vulnerabilities')}>
            <a href="#vulnerabilities" onClick={(e) => e.preventDefault()}>
              <Shield size={18} />
              <span>Vulnerabilities</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Analytics' ? 'active' : ''}`} onClick={() => setActivePanel('Analytics')}>
            <a href="#analytics" onClick={(e) => e.preventDefault()}>
              <Activity size={18} />
              <span>Analytics</span>
            </a>
          </li>
        </ul>

        {/* User profile session card */}
        <div className="sidebar-profile">
          <div className="profile-card">
            <div className="profile-avatar">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <div className="profile-name">{currentUser.username}</div>
              <div className="profile-role">Security Operator</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={14} strokeWidth={2.5} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main workspace */}
      <main className="dashboard-workspace">
        {/* Header */}
        <header className="workspace-header">
          <div className="header-title-section d-flex align-items-center gap-3">
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className="btn-sidebar-toggle"
              title="Toggle Sidebar"
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                color: 'var(--accent-mint)',
                borderRadius: '6px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <Menu size={18} />
            </button>
            <div>
              <h2 style={{ margin: 0 }}>Cyber Threat Center</h2>
              <p style={{ margin: 0 }}>Real-time threat monitoring and network visualization terminal</p>
            </div>
          </div>

          <div className="system-status">
            {/* Theme Toggle option */}
            <button 
              type="button" 
              onClick={toggleTheme} 
              className="btn-theme-toggle-dashboard" 
              title="Toggle Theme Mode"
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                color: 'var(--accent-mint)',
                borderRadius: '6px',
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'all 0.2s ease'
              }}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <div className="live-clock">{liveTime}</div>
            <div className="status-badge">
              <span className="status-badge-dot"></span>
              <span>System Secure</span>
            </div>
          </div>
        </header>

        {/* Conditional rendering of panels based on sidebar selection */}
        {activePanel === 'Overview' && renderOverview()}
        {activePanel === 'Security Events' && renderIncidents()}
        {activePanel === 'Threat Intelligence' && renderThreatMap()}
        {activePanel === 'Vulnerabilities' && renderShieldScans()}
        {activePanel === 'Analytics' && (
          <>
            {/* Shared Search and Filters toolbar for Analytics engine */}
            <div className="logs-header mb-4 p-3 rounded" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <h3 className="logs-title text-white m-0" style={{ fontSize: '16px' }}>Interactive Engine Filters</h3>
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 rounded-pill small fw-medium">
                    {filteredEvents.length} Logs Active
                  </span>
                </div>
                
                <div className="logs-toolbar d-flex flex-wrap align-items-center gap-3 m-0">
                  <div className="search-bar">
                    <Search size={16} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search vector, host, IP..." 
                    />
                  </div>

                  <div className="dropdown-filters d-flex gap-2">
                    <select 
                      value={eventTypeFilter}
                      onChange={(e) => setEventTypeFilter(e.target.value)}
                      className="filter-select"
                      title="Event Type"
                    >
                      <option value="ALL">All Event Types</option>
                      {uniqueEventTypes.filter(t => t !== 'ALL').map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    <select 
                      value={ipFilter}
                      onChange={(e) => setIpFilter(e.target.value)}
                      className="filter-select"
                      title="Source IP"
                    >
                      <option value="ALL">All Source IPs</option>
                      {uniqueSourceIps.filter(ip => ip !== 'ALL').map(ip => (
                        <option key={ip} value={ip}>{ip}</option>
                      ))}
                    </select>
                  </div>

                  <div className="table-controls">
                    <button 
                      className={`log-filter-btn ${severityFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => setSeverityFilter('ALL')}
                    >
                      All
                    </button>
                    <button 
                      className={`log-filter-btn ${severityFilter === 'CRITICAL' ? 'active' : ''}`}
                      onClick={() => setSeverityFilter('CRITICAL')}
                    >
                      Critical
                    </button>
                    <button 
                      className={`log-filter-btn ${severityFilter === 'WARNING' ? 'active' : ''}`}
                      onClick={() => setSeverityFilter('WARNING')}
                    >
                      Warning
                    </button>
                    <button 
                      className={`log-filter-btn ${severityFilter === 'RESOLVED' ? 'active' : ''}`}
                      onClick={() => setSeverityFilter('RESOLVED')}
                    >
                      Resolved
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <section className="dashboard-charts-wrapper">
              <DashboardCharts events={filteredEvents} theme={theme} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
