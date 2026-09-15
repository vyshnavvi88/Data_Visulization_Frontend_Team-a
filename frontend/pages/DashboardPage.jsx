import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldAlert, AlertTriangle, Bug, Siren, Cpu,
  LayoutDashboard, Map, Database, Shield, Settings,
  LogOut, Play, Square, Download, Search, RefreshCw,
  Terminal, ShieldCheck, Sun, Moon, Info, Sliders,
  UserCheck, ShieldQuestion, Menu, Github, ExternalLink, Mail,
  Users, Code2, Sparkles, CheckCircle2, Copy, Check, Layers,
  GitBranch, ArrowUpRight, Award, Compass, Filter, MessageSquare,
  Server, Globe, CheckCircle, Zap, Flame, TrendingUp, AlertOctagon, GitMerge
} from 'lucide-react';
import { 
  getEvents, getStats, getIncidents, getIncidentDetails, 
  getRiskSummary, DEFAULT_RISK_WEIGHTS, updateIncidentStatus,
  ingestEvent, getHeatmapData, getAuditData, DEFAULT_INCIDENTS,
  DEFAULT_EVENTS, getThreats, getThreatSummary, getModelPerformance,
  getPredictions, getAnomalies, predictThreat, getHighRiskAlerts,
  calculateRisk, getRecommendations, getAttackChains
} from '../services/api';
import DashboardCharts, { Milestone3RiskCharts } from '../charts/DashboardCharts';
import EventDetails from './EventDetails';
import IncidentDetails from './IncidentDetails';
import '../styles/DashboardPage.css';

export default function DashboardPage({ onNavigate, theme = 'dark', toggleTheme }) {
  // Navigation State
  const [activePanel, setActivePanel] = useState('Overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Core Data
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [stats, setStats] = useState({
    totalEvents: 1800,
    anomaliesDetected: 919,
    normalEvents: 881,
    highRiskEvents: 573,
    criticalThreats: 346,
    activeIncidents: 905,
    vulnerabilities: 1373
  });
  const [investigatingEventId, setInvestigatingEventId] = useState(null);

  // Milestone 2 State: Machine Learning Anomaly Detection (Isolation Forest IF_v2)
  const [modelPerf, setModelPerf] = useState({
    model_version: 'IF_v2',
    algorithm: 'Isolation Forest',
    total_events: 1800,
    suspicious_count: 1309,
    normal_count: 491,
    suspicious_percentage: 72.7,
    feature_count: 46
  });
  const [threatSummary, setThreatSummary] = useState({
    by_severity: { Critical: 346, High: 573, Medium: 476, Low: 405 },
    by_type: { 'Brute Force': 195, 'Malware Detection': 182, 'Phishing Email': 175, 'SQL Injection': 142, 'DDoS Traffic': 128, 'Privilege Escalation': 97 }
  });
  const [anomaliesList, setAnomaliesList] = useState([]);
  const [mlPredictInput, setMlPredictInput] = useState({
    event_type: 'Brute Force',
    failed_login_attempts: 18,
    cvss_score: 8.9,
    severity: 'High',
    status: 'Failed',
    protocol: 'SSH',
    malware_detected: 'No',
    department: 'IT',
    vulnerability_id: 'CVE-2023-1234'
  });
  const [mlPredictResult, setMlPredictResult] = useState(null);
  const [mlPredictLoading, setMlPredictLoading] = useState(false);

  // Milestone 3 State: Security Intelligence & Decision Layer
  const [incidents, setIncidents] = useState(DEFAULT_INCIDENTS);
  const [investigatingIncidentId, setInvestigatingIncidentId] = useState(null);
  const [riskWeights, setRiskWeights] = useState(DEFAULT_RISK_WEIGHTS);
  const [showWeightAdjuster, setShowWeightAdjuster] = useState(false);
  const [incidentSearchQuery, setIncidentSearchQuery] = useState('');
  const [incidentFilterRisk, setIncidentFilterRisk] = useState('ALL');
  const [incidentFilterStatus, setIncidentFilterStatus] = useState('ALL');
  const [incidentFilterAsset, setIncidentFilterAsset] = useState('ALL');
  const [attackChainsList, setAttackChainsList] = useState([]);
  const [riskSummaryData, setRiskSummaryData] = useState(null);

  // Interactive 5-Factor Risk Calculator State (POST /api/v1/risk/calculate)
  const [riskCalcInput, setRiskCalcInput] = useState({
    event_type: 'Brute Force',
    severity: 'Critical',
    confidence_score: 92,
    asset_criticality: 'Critical',
    cvss_score: 9.8,
    ioc_match: true
  });
  const [riskCalcResult, setRiskCalcResult] = useState(null);
  const [riskCalcLoading, setRiskCalcLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [ipFilter, setIpFilter] = useState('ALL');

  // Contact Us / Command Center State
  const [teamCategoryFilter, setTeamCategoryFilter] = useState('ALL');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [copiedMemberEmail, setCopiedMemberEmail] = useState(null);
  
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
  const [vocalAlerts, setVocalAlerts] = useState(false);
  const vocalAlertsRef = useRef(vocalAlerts);
  vocalAlertsRef.current = vocalAlerts;

  const [chimeVolume, setChimeVolume] = useState(80);
  const chimeVolumeRef = useRef(chimeVolume);
  chimeVolumeRef.current = chimeVolume;

  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState(null);
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState(null);

  // Terminal Logs State
  const [terminalLogs, setTerminalLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), message: 'Initialized threat diagnostics framework...', type: 'info' },
    { id: 2, time: new Date().toLocaleTimeString(), message: 'Firewall rules compiled. Shield active.', type: 'success' }
  ]);
  const [toasts, setToasts] = useState([]);
  const [toastsEnabled, setToastsEnabled] = useState(true);
  const toastsEnabledRef = useRef(toastsEnabled);
  toastsEnabledRef.current = toastsEnabled;

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

  // Fetch initial telemetry events, ML metrics & Milestone 3 incidents
  const loadIncidentsData = async (weights = riskWeights) => {
    const incs = await getIncidents(weights);
    setIncidents(incs);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [allEvents, initialStats, perf, summ, anoms, rSumm, chains] = await Promise.all([
          getEvents(),
          getStats(),
          getModelPerformance(),
          getThreatSummary(),
          getAnomalies(),
          getRiskSummary(),
          getAttackChains()
        ]);
        setEvents(allEvents);
        setStats(initialStats);
        if (perf) setModelPerf(perf);
        if (summ) setThreatSummary(summ);
        if (anoms && anoms.length > 0) setAnomaliesList(anoms);
        if (rSumm) setRiskSummaryData(rSumm);
        if (chains && chains.length > 0) setAttackChainsList(chains);
        await loadIncidentsData(riskWeights);
      } catch (e) {
        console.warn('Initial load fallback:', e);
      }
    }
    loadData();
  }, []);

  // Recalculate incident risk scores when dynamic weights change
  useEffect(() => {
    loadIncidentsData(riskWeights);
  }, [riskWeights]);

  // Auto scroll terminal logs to bottom
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollTop = terminalBottomRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Toast Alerts Trigger
  const triggerToast = (message, type = 'info', forceShow = false) => {
    if (!toastsEnabledRef.current && !forceShow) return;
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
        const isoTimestamp = new Date().toISOString();
        const prediction = template.severity === 'CRITICAL' ? 'Critical' : 'Suspicious';
        const confidence = template.severity === 'CRITICAL' ? 95 : 78;
        const reasons = [
          `${template.name} triggered anomaly alert`,
          `Targeting enterprise asset ${template.target}`,
          `High risk activity signature matched`
      ];

        const newIncident = {
          id: `EVT-${Date.now().toString().slice(-4)}`,
          event_id: `EVT-${Date.now().toString().slice(-4)}`,
          time: time,
          timestamp: isoTimestamp,
          date: isoTimestamp.slice(0, 10),
          name: template.name,
          event_type: template.event_type,
          source: template.source,
          source_ip: template.source,
          target: template.target,
          destination_ip: template.target,
          severity: template.severity,
          status: 'UNRESOLVED',
          is_high_risk: template.severity === 'CRITICAL',
          prediction: prediction,
          confidence: confidence,
          reasons: reasons,
          failed_login_attempts: template.event_type === 'Brute Force' ? 12 : 0,
          cvss_score: template.severity === 'CRITICAL' ? 9.8 : 6.5,
          risk_score: template.severity === 'CRITICAL' ? 95 : 78
        };

        setEvents((prev) => [newIncident, ...prev]);
        ingestEvent(newIncident).catch(e => console.warn('Background sync:', e));

        // Dynamic high-tech sound synthesiser alarm and vocal readouts
        if (vocalAlertsRef.current) {
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(template.severity === 'CRITICAL' ? 880 : 440, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08 * (chimeVolumeRef.current / 100), audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
          } catch (e) {
            console.error(e);
          }

          try {
            const msg = new SpeechSynthesisUtterance();
            msg.text = `Warning. ${template.severity.toLowerCase()} threat ${template.event_type.toLowerCase()} detected.`;
            msg.volume = 0.65 * (chimeVolumeRef.current / 100);
            msg.rate = 1.05;
            window.speechSynthesis.speak(msg);
          } catch (e) {
            console.error(e);
          }
        }

        const alertType = template.severity === 'CRITICAL' ? 'critical' : 'warning';
        logTerminal(`Intrusion anomaly detected: ${template.name} targeting host ${template.target}.`, alertType);
        triggerToast(`${template.name} from ${template.source} targeting ${template.target}`, alertType);

        setStats((prev) => {
          const isCrit = template.severity === 'CRITICAL';
          return {
            ...prev,
            totalEvents: prev.totalEvents + 1,
            anomaliesDetected: prev.anomaliesDetected + 1,
            criticalThreats: isCrit ? prev.criticalThreats + 1 : prev.criticalThreats,
            highRiskEvents: !isCrit ? prev.highRiskEvents + 1 : prev.highRiskEvents,
            normalEvents: prev.normalEvents // remains same
          };
        });
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
    setInvestigatingEventId(id);
    setActivePanel('Event Investigation');
    setEvents((prev) => 
      prev.map((evt) => {
        if ((evt.id || evt.event_id) === id) {
          logTerminal(`Threat Vector #${id} is now flagged as [UNDER INVESTIGATION] by ${currentUser.username}.`, 'info');
          triggerToast(`Investigating: ${evt.name || evt.event_type}`, 'info');
          return { ...evt, status: 'UNDER_INVESTIGATION' };
        }
        return evt;
      })
    );
  };

  const handleInvestigateIncident = (incId) => {
    const allIncs = (incidents && incidents.length > 0) ? incidents : DEFAULT_INCIDENTS;
    const targetId = incId || allIncs[0]?.incident_id || 'INC-1001';
    setInvestigatingEventId(null);
    setInvestigatingIncidentId(targetId);
    setActivePanel('Risk Intelligence');
    logTerminal(`Triggered decision-layer deep dive on Incident #${targetId}.`, 'info');
    triggerToast(`Investigating Incident ${targetId}`, 'info');
  };

  const handleResolveIncident = async (incId) => {
    await updateIncidentStatus(incId, 'Resolved', 'True Positive');
    setIncidents((prev) => prev.map(i => i.incident_id === incId ? { ...i, status: 'Resolved' } : i));
    logTerminal(`Incident #${incId} marked as [RESOLVED] by Operator ${currentUser.username}.`, 'success');
    triggerToast(`Incident ${incId} Resolved!`, 'success');
  };

  const handleResolve = (id) => {
    setEvents((prev) => 
      prev.map((evt) => {
        if ((evt.id || evt.event_id) === id) {
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
  const uniqueDates = [
    'ALL',
    ...new Set(
      events
        .map((e) => (e.date || e.timestamp || '').toString().slice(0, 10))
        .filter((value) => value && value !== 'Invalid Date')
    )
  ].sort((a, b) => (a === 'ALL' ? -1 : b === 'ALL' ? 1 : b.localeCompare(a)));
  const uniqueIpAddresses = [
    'ALL',
    ...new Set(
      events
        .flatMap((e) => [e.source || e.source_ip, e.target || e.destination_ip])
        .filter(Boolean)
    )
  ];

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

    const eventDate = (evt.date || evt.timestamp || '').toString().slice(0, 10);
    const matchesDate = dateFilter === 'ALL' || eventDate === dateFilter;
    const matchesEventType = eventTypeFilter === 'ALL' || (evt.name || evt.event_type) === eventTypeFilter;
    const matchesIp = ipFilter === 'ALL' || (evt.source || evt.source_ip) === ipFilter || (evt.target || evt.destination_ip) === ipFilter;

<<<<<<< HEAD
    return matchesSearch && matchesSeverity && matchesDate && matchesEventType && matchesIp;
=======
    let matchesHeatmapDate = true;
    if (selectedHeatmapDate) {
      let evtDate;
      if (evt.timestamp && evt.timestamp.includes('T')) {
        evtDate = new Date(evt.timestamp);
      } else {
        evtDate = new Date();
        if (evt.time) {
          const parts = evt.time.split(':');
          if (parts.length >= 2) {
            evtDate.setHours(parseInt(parts[0]), parseInt(parts[1]), parts[2] ? parseInt(parts[2]) : 0, 0);
          }
        }
      }
      const evtMidnight = new Date(evtDate.getFullYear(), evtDate.getMonth(), evtDate.getDate());
      const selectedMidnight = new Date(selectedHeatmapDate);
      matchesHeatmapDate = evtMidnight.getTime() === selectedMidnight.getTime();
    }

    return matchesSearch && matchesSeverity && matchesEventType && matchesIp && matchesHeatmapDate;
>>>>>>> upstream/main
  });

  const handleExportCSV = () => {
    // If we are on Event Investigation tab and an event is active, export that event's full detail report
    const activeEvent = activePanel === 'Event Investigation' 
      ? events.find(e => (e.id || e.event_id) === investigatingEventId) 
      : null;

    if (activeEvent) {
      const headers = ['FIELD', 'VALUE'];
      const rows = [
        ['Event ID', activeEvent.id || activeEvent.event_id || ''],
        ['Timestamp', activeEvent.timestamp || activeEvent.time || ''],
        ['Threat Type', activeEvent.name || activeEvent.event_type || ''],
        ['Severity', activeEvent.severity || ''],
        ['Source IP', activeEvent.source || activeEvent.source_ip || ''],
        ['Destination IP', activeEvent.target || activeEvent.destination_ip || ''],
        ['Username', activeEvent.username || ''],
        ['Asset Name', activeEvent.asset_name || activeEvent.target || ''],
        ['Event Status', activeEvent.status || ''],
        ['Risk Score', activeEvent.risk_score || ''],
        ['AI Verdict', activeEvent.prediction || ''],
        ['Confidence Level', `${activeEvent.confidence || 0}%`],
        ['XAI Findings', (activeEvent.reasons || []).join('; ')]
      ];

      const csvContent = [
        headers.join(','), 
        ...rows.map(r => r.map(val => {
          let str = String(val);
          if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
            str = str.replace(/"/g, '""');
            return `"${str}"`;
          }
          return `"${str}"`;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `incident_report_${activeEvent.id || activeEvent.event_id || 'unspecified'}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logTerminal(`Exported incident report for ${activeEvent.id || activeEvent.event_id} to CSV successfully.`, 'success');
      triggerToast(`Exported report to CSV`, 'success');
      return;
    }

    // Default: export filtered logs list
    if (filteredEvents.length === 0) {
      triggerToast('No logs available to export.', 'warning');
      return;
    }

    const headers = ['Event ID', 'Timestamp', 'Threat Type', 'Severity', 'Source IP', 'Destination IP', 'Username', 'Status', 'Risk Score'];
    const rows = filteredEvents.map(evt => [
      evt.id || evt.event_id || '',
      evt.timestamp || evt.time || '',
      evt.name || evt.event_type || '',
      evt.severity || '',
      evt.source || evt.source_ip || '',
      evt.target || evt.destination_ip || '',
      evt.username || '',
      evt.status || '',
      evt.risk_score || ''
    ]);

    const csvContent = [
      headers.join(','), 
      ...rows.map(r => r.map(val => {
        let str = String(val);
        if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
          str = str.replace(/"/g, '""');
          return `"${str}"`;
        }
        return `"${str}"`;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `security_threat_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logTerminal(`Exported ${filteredEvents.length} logs to CSV file successfully.`, 'success');
    triggerToast(`Exported logs to CSV`, 'info');
  };

  const handleExportPDF = () => {
    const activeEvent = events.find(e => (e.id || e.event_id) === investigatingEventId);
    if (!activeEvent) {
      triggerToast('No active event loaded to export PDF.', 'warning');
      return;
    }

    const reportWindow = window.open('', '_blank', 'width=900,height=900');
    if (!reportWindow) {
      triggerToast('Popup blocker blocked report generation window.', 'warning');
      return;
    }

    const dateStr = new Date(activeEvent.timestamp || activeEvent.time || Date.now()).toLocaleString();
    const reasonsHTML = (activeEvent.reasons || []).map(r => `<li>${r}</li>`).join('');

    reportWindow.document.write(`
      <html>
        <head>
          <title>Security Incident Report - ${activeEvent.id || activeEvent.event_id}</title>
          <style>
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
              color: #0f172a;
              padding: 40px;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo {
              font-size: 20px;
              font-weight: 800;
              letter-spacing: -0.02em;
              color: #0d9488;
            }
            .report-title {
              font-size: 24px;
              font-weight: 800;
              margin: 0;
            }
            .verdict-badge {
              display: inline-block;
              padding: 6px 14px;
              border-radius: 6px;
              font-weight: bold;
              font-size: 14px;
              text-transform: uppercase;
              margin-top: 10px;
            }
            .badge-critical { background-color: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }
            .badge-warning { background-color: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
            .badge-low { background-color: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
            
            .metadata-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 40px;
            }
            .metadata-item {
              border-bottom: 1px solid #e2e8f0;
              padding: 10px 0;
            }
            .label {
              font-size: 11px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 600;
            }
            .value {
              font-size: 15px;
              font-weight: 600;
              color: #0f172a;
            }
            .section-title {
              font-size: 18px;
              font-weight: 700;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 8px;
              margin-bottom: 15px;
              margin-top: 30px;
            }
            .findings-list {
              padding-left: 20px;
            }
            .findings-list li {
              margin-bottom: 8px;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
              font-size: 11px;
              color: #64748b;
              text-align: center;
            }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">INFOSYS INTEGRATED THREAT DETECTION</div>
              <h1 class="report-title">Incident Analysis Report</h1>
            </div>
            <div style="text-align: right;">
              <span class="label">Incident ID</span>
              <div style="font-size: 20px; font-weight: bold; font-family: monospace;">${activeEvent.id || activeEvent.event_id}</div>
            </div>
          </div>

          <div>
            <span class="label">Incident Classification (ML Verdict)</span>
            <div>
              <span class="verdict-badge badge-${(activeEvent.prediction || 'NORMAL').toLowerCase() === 'critical' ? 'critical' : (activeEvent.prediction || 'NORMAL').toLowerCase() === 'suspicious' ? 'warning' : 'low'}">
                ${activeEvent.prediction || 'NORMAL'} (${activeEvent.confidence || 75}% Confidence)
              </span>
            </div>
          </div>

          <h2 class="section-title">Telemetry Metadata</h2>
          <div class="metadata-grid">
            <div class="metadata-item">
              <span class="label">Threat Type / Event Type</span>
              <div class="value">${activeEvent.name || activeEvent.event_type}</div>
            </div>
            <div class="metadata-item">
              <span class="label">Timestamp</span>
              <div class="value">${dateStr}</div>
            </div>
            <div class="metadata-item">
              <span class="label">Source IP Address</span>
              <div class="value">${activeEvent.source || activeEvent.source_ip}</div>
            </div>
            <div class="metadata-item">
              <span class="label">Target Asset</span>
              <div class="value">${activeEvent.target || activeEvent.destination_ip}</div>
            </div>
            <div class="metadata-item">
              <span class="label">Risk Severity Level</span>
              <div class="value" style="text-transform: uppercase;">${activeEvent.severity}</div>
            </div>
            <div class="metadata-item">
              <span class="label">Vulnerability Reference (CVE)</span>
              <div class="value">${activeEvent.vulnerability_id || 'N/A'}</div>
            </div>
          </div>

          <h2 class="section-title">Explainable AI (XAI) Analysis</h2>
          <span class="label">Identified Contributory Factors</span>
          <ul class="findings-list">
            ${reasonsHTML || '<li>No significant anomaly factors triggered flag limits.</li>'}
          </ul>

          <h2 class="section-title">System Verdict Notes</h2>
          <p style="font-size: 13px; color: #475569;">
            This document serves as an official incident record validated by the Infosys neural network threat detection model. Recommended course of action includes immediate firewall routing restrictions on the source IP address if severity is flagged as critical.
          </p>

          <div class="footer">
            Generated on ${new Date().toLocaleString()} by SOC Operator ${currentUser.username}.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    reportWindow.document.close();
    logTerminal(`Generated printable PDF incident report for ${activeEvent.id || activeEvent.event_id}.`, 'success');
  };

  // --- SUB-RENDER 0: MILESTONE 3 RISK INTELLIGENCE & DECISION LAYER ---
  const renderRiskIntelligence = () => {
    if (investigatingIncidentId) {
      const allIncs = (incidents && incidents.length > 0) ? incidents : DEFAULT_INCIDENTS;
      const selectedInc = allIncs.find(i => String(i.incident_id || '').toUpperCase() === String(investigatingIncidentId).toUpperCase()) 
        || allIncs.find(i => String(i.incident_id || '').includes('1001')) 
        || allIncs[0]
        || DEFAULT_INCIDENTS[0];
      
      return (
        <IncidentDetails 
          incident={selectedInc}
          onBack={() => setInvestigatingIncidentId(null)}
          onSelectEvent={(evtId) => handleInvestigate(evtId)}
          theme={theme}
          onUpdateIncident={(updated) => {
            setIncidents(prev => prev.map(i => i.incident_id === updated.incident_id ? updated : i));
          }}
        />
      );
    }

    const uniqueIncidentAssets = ['ALL', ...new Set(incidents.map(i => i.asset_name).filter(Boolean))];

    const filteredIncidents = incidents.filter(inc => {
      const q = incidentSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        inc.incident_id.toLowerCase().includes(q) ||
        inc.threat_type.toLowerCase().includes(q) ||
        inc.asset_name.toLowerCase().includes(q) ||
        (inc.affected_user && inc.affected_user.toLowerCase().includes(q)) ||
        (inc.source_ip && inc.source_ip.toLowerCase().includes(q)) ||
        (inc.mitre_technique && inc.mitre_technique.toLowerCase().includes(q));

      let matchesRisk = true;
      if (incidentFilterRisk !== 'ALL') {
        matchesRisk = inc.priority.toUpperCase() === incidentFilterRisk;
      }

      let matchesStatus = true;
      if (incidentFilterStatus !== 'ALL') {
        matchesStatus = inc.status.toUpperCase() === incidentFilterStatus;
      }

      let matchesAsset = true;
      if (incidentFilterAsset !== 'ALL') {
        matchesAsset = inc.asset_name === incidentFilterAsset;
      }

      return matchesSearch && matchesRisk && matchesStatus && matchesAsset;
    });

    const critIncCount = incidents.filter(i => i.priority === 'Critical').length;
    const highIncCount = incidents.filter(i => i.priority === 'High').length;
    const medIncCount = incidents.filter(i => i.priority === 'Medium').length;
    const lowIncCount = incidents.filter(i => i.priority === 'Low').length;
    const openIncCount = incidents.filter(i => i.status === 'Open' || i.status === 'Investigating').length;

    return (
      <section className="risk-intelligence-panel">
        {/* HERO TITLE & DYNAMIC WEIGHTS CONFIGURATOR STRIP */}
        <div className="card-view p-4 rounded-4 mb-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-danger text-white rounded-pill px-2.5 py-1 font-mono fw-bold" style={{ fontSize: '11px' }}>
                  MILESTONE 3 LAYER
                </span>
                <span className="text-secondary small font-mono">&bull; Security Intelligence & Threat Prioritization Engine</span>
              </div>
              <h3 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: '20px' }}>
                <Flame className="text-danger" size={22} />
                <span>Security Intelligence & Threat Prioritization Matrix</span>
              </h3>
              <p className="text-secondary small m-0 mt-1" style={{ fontSize: '12.5px', maxWidth: '850px' }}>
                Transforms Milestone 2 ML anomaly detections into actionable intelligence by fusing asset criticality, CVE vulnerability exposure, MITRE ATT&CK mappings, and IOC threat intelligence into a unified 0–100 Risk Score.
              </p>
            </div>

            <button 
              onClick={() => setShowWeightAdjuster(!showWeightAdjuster)}
              className="btn btn-sm d-flex align-items-center gap-2"
              style={{
                borderRadius: '8px',
                padding: '8px 16px',
                border: showWeightAdjuster ? '1px solid var(--accent-mint)' : '1px solid var(--border-color)',
                backgroundColor: showWeightAdjuster ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-deep)',
                color: showWeightAdjuster ? 'var(--accent-mint)' : 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '12.5px'
              }}
            >
              <Sliders size={15} />
              <span>{showWeightAdjuster ? 'Hide Weight Tuner' : 'Dynamic Risk Weights'}</span>
              <span className="badge bg-secondary-subtle text-secondary font-mono px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                {Math.round(riskWeights.threatSeverity * 100)}/{Math.round(riskWeights.mlConfidence * 100)}/{Math.round(riskWeights.assetCriticality * 100)}/{Math.round(riskWeights.vulnerabilityExposure * 100)}/{Math.round(riskWeights.threatIntelligence * 100)}
              </span>
            </button>
          </div>

          {/* Dynamic Weight Sliders Drawer */}
          {showWeightAdjuster && (
            <div className="p-3 mt-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <span className="small fw-bold text-secondary text-uppercase font-mono" style={{ fontSize: '11px' }}>
                  Adjust Risk Factor Weights (Formula: Threat Severity × W1 + ML Conf × W2 + Asset Crit × W3 + Vuln × W4 + IOC × W5)
                </span>
                <button 
                  onClick={() => setRiskWeights(DEFAULT_RISK_WEIGHTS)}
                  className="btn btn-outline-secondary btn-sm py-0.5 px-2"
                  style={{ fontSize: '11px', borderRadius: '4px' }}
                >
                  Reset to Defaults (25/25/20/20/10)
                </button>
              </div>

              <div className="row g-3">
                <div className="col-md-2 col-sm-4 col-6">
                  <label className="text-secondary xsmall d-flex justify-content-between font-mono mb-1">
                    <span>Threat Severity</span>
                    <strong className="text-danger">{Math.round(riskWeights.threatSeverity * 100)}%</strong>
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="5"
                    value={Math.round(riskWeights.threatSeverity * 100)}
                    onChange={(e) => setRiskWeights(prev => ({ ...prev, threatSeverity: Number(e.target.value) / 100 }))}
                    className="w-100" 
                    style={{ accentColor: '#ef4444' }}
                  />
                </div>

                <div className="col-md-2 col-sm-4 col-6">
                  <label className="text-secondary xsmall d-flex justify-content-between font-mono mb-1">
                    <span>ML Confidence</span>
                    <strong className="text-primary">{Math.round(riskWeights.mlConfidence * 100)}%</strong>
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="5"
                    value={Math.round(riskWeights.mlConfidence * 100)}
                    onChange={(e) => setRiskWeights(prev => ({ ...prev, mlConfidence: Number(e.target.value) / 100 }))}
                    className="w-100" 
                    style={{ accentColor: '#3b82f6' }}
                  />
                </div>

                <div className="col-md-2 col-sm-4 col-6">
                  <label className="text-secondary xsmall d-flex justify-content-between font-mono mb-1">
                    <span>Asset Criticality</span>
                    <strong className="text-warning">{Math.round(riskWeights.assetCriticality * 100)}%</strong>
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="5"
                    value={Math.round(riskWeights.assetCriticality * 100)}
                    onChange={(e) => setRiskWeights(prev => ({ ...prev, assetCriticality: Number(e.target.value) / 100 }))}
                    className="w-100" 
                    style={{ accentColor: '#f59e0b' }}
                  />
                </div>

                <div className="col-md-2 col-sm-4 col-6">
                  <label className="text-secondary xsmall d-flex justify-content-between font-mono mb-1">
                    <span>Vulnerability / CVE</span>
                    <strong style={{ color: '#a855f7' }}>{Math.round(riskWeights.vulnerabilityExposure * 100)}%</strong>
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="5"
                    value={Math.round(riskWeights.vulnerabilityExposure * 100)}
                    onChange={(e) => setRiskWeights(prev => ({ ...prev, vulnerabilityExposure: Number(e.target.value) / 100 }))}
                    className="w-100" 
                    style={{ accentColor: '#a855f7' }}
                  />
                </div>

                <div className="col-md-2 col-sm-4 col-6">
                  <label className="text-secondary xsmall d-flex justify-content-between font-mono mb-1">
                    <span>Threat Intel (IOC)</span>
                    <strong className="text-success">{Math.round(riskWeights.threatIntelligence * 100)}%</strong>
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="5"
                    value={Math.round(riskWeights.threatIntelligence * 100)}
                    onChange={(e) => setRiskWeights(prev => ({ ...prev, threatIntelligence: Number(e.target.value) / 100 }))}
                    className="w-100" 
                    style={{ accentColor: '#10b981' }}
                  />
                </div>

                <div className="col-md-2 col-sm-4 col-6 d-flex flex-column justify-content-center">
                  <span className="text-secondary xsmall font-mono">Current Weight Sum:</span>
                  <span className="font-mono fw-bold text-success fs-6">
                    {Math.round((riskWeights.threatSeverity + riskWeights.mlConfidence + riskWeights.assetCriticality + riskWeights.vulnerabilityExposure + riskWeights.threatIntelligence) * 100)}% Active
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6 RISK KPI CARDS GRID */}
        <div className="kpi-grid mb-4">
          <div className="kpi-card kpi-blue">
            <div className="kpi-card-header">
              <span className="kpi-title">Total Incidents</span>
              <div className="kpi-icon-circle"><Layers size={18} /></div>
            </div>
            <h2 className="kpi-value">{incidents.length}</h2>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
              <span className="kpi-display">Correlated Security Incidents</span>
              <span className="kpi-trend-badge trend-blue">Correlated Chains</span>
            </div>
          </div>

          <div className="kpi-card kpi-purple">
            <div className="kpi-card-header">
              <span className="kpi-title">Critical Priority</span>
              <div className="kpi-icon-circle"><Siren size={18} /></div>
            </div>
            <h2 className="kpi-value">{critIncCount}</h2>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
              <span className="kpi-display">Risk Score: 81 &ndash; 100</span>
              <span className="kpi-trend-badge trend-purple">Immediate SOC Action</span>
            </div>
          </div>

          <div className="kpi-card kpi-orange">
            <div className="kpi-card-header">
              <span className="kpi-title">High Priority</span>
              <div className="kpi-icon-circle"><AlertTriangle size={18} /></div>
            </div>
            <h2 className="kpi-value">{highIncCount}</h2>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
              <span className="kpi-display">Risk Score: 61 &ndash; 80</span>
              <span className="kpi-trend-badge trend-orange">Elevated Triage</span>
            </div>
          </div>

          <div className="kpi-card kpi-blue">
            <div className="kpi-card-header">
              <span className="kpi-title">Medium Priority</span>
              <div className="kpi-icon-circle"><ShieldAlert size={18} /></div>
            </div>
            <h2 className="kpi-value">{medIncCount}</h2>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
              <span className="kpi-display">Risk Score: 41 &ndash; 60</span>
              <span className="kpi-trend-badge trend-blue">Standard Policy</span>
            </div>
          </div>

          <div className="kpi-card kpi-green">
            <div className="kpi-card-header">
              <span className="kpi-title">Low Priority</span>
              <div className="kpi-icon-circle"><ShieldCheck size={18} /></div>
            </div>
            <h2 className="kpi-value">{lowIncCount}</h2>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
              <span className="kpi-display">Risk Score: 0 &ndash; 40</span>
              <span className="kpi-trend-badge trend-green">Routine Logged</span>
            </div>
          </div>

          <div className="kpi-card kpi-red">
            <div className="kpi-card-header">
              <span className="kpi-title">Open Actionable</span>
              <div className="kpi-icon-circle"><Flame size={18} /></div>
            </div>
            <h2 className="kpi-value">{openIncCount}</h2>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
              <span className="kpi-display">Require Analyst Decision</span>
              <span className="kpi-trend-badge trend-red">Pending Mitigation</span>
            </div>
          </div>
        </div>

        {/* MILESTONE 3 CHARTS */}
        <Milestone3RiskCharts incidents={filteredIncidents} theme={theme} />

        {/* INTERACTIVE 5-FACTOR RISK CALCULATOR (POST /api/v1/risk/calculate) */}
        <section className="card-view p-4 rounded-4 mb-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-mono xsmall px-2 py-0.5 rounded">
                  POST /api/v1/risk/calculate
                </span>
                <span className="text-secondary small font-mono">Interactive SOC Threat Scoring Engine</span>
              </div>
              <h4 className="fw-bold m-0 mt-1 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: '17px' }}>
                <Zap size={18} className="text-warning" />
                <span>Interactive 5-Factor Risk Score Calculator</span>
              </h4>
            </div>
            <span className="text-secondary xsmall font-mono">
              Formula: Severity (25%) + Confidence (25%) + Asset (20%) + Vulnerability (20%) + Intel (10%)
            </span>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setRiskCalcLoading(true);
            try {
              const res = await calculateRisk(riskCalcInput);
              setRiskCalcResult(res);
              triggerToast(`Risk Calculated: ${res.risk_score} (${res.risk_class})`, res.risk_class === 'Critical' ? 'critical' : 'info');
            } catch (err) {
              triggerToast('Calculation error: ' + err.message, 'critical');
            } finally {
              setRiskCalcLoading(false);
            }
          }}>
            <div className="row g-3 align-items-end">
              <div className="col-md-3 col-sm-6 col-12">
                <label className="small fw-medium mb-1 d-block text-secondary">Threat Event Type</label>
                <select 
                  className="w-100 filter-select"
                  value={riskCalcInput.event_type}
                  onChange={(e) => setRiskCalcInput(prev => ({ ...prev, event_type: e.target.value }))}
                >
                  <option value="Brute Force">Brute Force</option>
                  <option value="Malware Detection">Malware Detection</option>
                  <option value="Phishing Email">Phishing Email</option>
                  <option value="SQL Injection">SQL Injection</option>
                  <option value="Privilege Escalation">Privilege Escalation</option>
                  <option value="Ransomware Probe">Ransomware Probe</option>
                </select>
              </div>

              <div className="col-md-2 col-sm-6 col-12">
                <label className="small fw-medium mb-1 d-block text-secondary">Threat Severity</label>
                <select 
                  className="w-100 filter-select"
                  value={riskCalcInput.severity}
                  onChange={(e) => setRiskCalcInput(prev => ({ ...prev, severity: e.target.value }))}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="col-md-2 col-sm-6 col-12">
                <label className="small fw-medium mb-1 d-block text-secondary">ML Confidence (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  className="w-100 filter-select"
                  value={riskCalcInput.confidence_score}
                  onChange={(e) => setRiskCalcInput(prev => ({ ...prev, confidence_score: Number(e.target.value) }))}
                />
              </div>

              <div className="col-md-2 col-sm-6 col-12">
                <label className="small fw-medium mb-1 d-block text-secondary">Asset Criticality</label>
                <select 
                  className="w-100 filter-select"
                  value={riskCalcInput.asset_criticality}
                  onChange={(e) => setRiskCalcInput(prev => ({ ...prev, asset_criticality: e.target.value }))}
                >
                  <option value="Critical">Critical (Tier 1 DB/Gateway)</option>
                  <option value="High">High (App / Auth Server)</option>
                  <option value="Medium">Medium (Endpoint Laptop)</option>
                  <option value="Low">Low (Sandbox / Kiosk)</option>
                </select>
              </div>

              <div className="col-md-2 col-sm-6 col-12">
                <label className="small fw-medium mb-1 d-block text-secondary">CVSS Vulnerability Score</label>
                <input 
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-100 filter-select"
                  value={riskCalcInput.cvss_score}
                  onChange={(e) => setRiskCalcInput(prev => ({ ...prev, cvss_score: parseFloat(e.target.value) }))}
                />
              </div>

              <div className="col-md-1 col-sm-6 col-12">
                <label className="small fw-medium mb-1 d-block text-secondary">IOC Match</label>
                <div className="d-flex align-items-center" style={{ height: '36px' }}>
                  <input 
                    type="checkbox"
                    checked={riskCalcInput.ioc_match}
                    onChange={(e) => setRiskCalcInput(prev => ({ ...prev, ioc_match: e.target.checked }))}
                    className="form-check-input mt-0"
                    style={{ cursor: 'pointer' }}
                  />
                  <span className="ms-1.5 small font-mono">{riskCalcInput.ioc_match ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <button 
                type="submit" 
                disabled={riskCalcLoading}
                className="btn btn-primary btn-sm px-4 py-2 font-mono fw-bold d-flex align-items-center gap-2"
                style={{ borderRadius: '6px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: 'none' }}
              >
                {riskCalcLoading ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
                <span>Calculate 5-Factor Risk Score</span>
              </button>

              {riskCalcResult && (
                <div className="d-flex align-items-center gap-3 font-mono">
                  <span className="text-secondary small">Final Score:</span>
                  <span className="fw-bold fs-5" style={{ color: riskCalcResult.risk_class === 'Critical' ? '#ef4444' : riskCalcResult.risk_class === 'High' ? '#f59e0b' : '#3b82f6' }}>
                    {riskCalcResult.risk_score} / 100
                  </span>
                  <span className={`badge ${riskCalcResult.risk_class === 'Critical' ? 'bg-danger' : riskCalcResult.risk_class === 'High' ? 'bg-warning text-dark' : 'bg-info'} text-uppercase`}>
                    {riskCalcResult.risk_class} (Priority #{riskCalcResult.priority})
                  </span>
                </div>
              )}
            </div>
          </form>

          {riskCalcResult && (
            <div className="mt-4 p-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
              <div className="row g-3">
                <div className="col-lg-6 col-12">
                  <span className="xsmall text-secondary font-mono text-uppercase fw-bold d-block mb-2">5-Factor Score Breakdown</span>
                  <div className="d-flex flex-column gap-1.5 small font-mono">
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">1. Threat Severity (25%):</span>
                      <strong className="text-danger">{riskCalcResult.breakdown?.threat_severity_score || 100}/100</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">2. ML Confidence (25%):</span>
                      <strong className="text-primary">{riskCalcResult.breakdown?.ml_confidence_score || 92}/100</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">3. Asset Criticality (20%):</span>
                      <strong className="text-warning">{riskCalcResult.breakdown?.asset_criticality_score || 100}/100</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">4. Vulnerability Exposure (20%):</span>
                      <strong style={{ color: '#a855f7' }}>{riskCalcResult.breakdown?.vulnerability_score || 98}/100</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">5. Threat Intelligence (10%):</span>
                      <strong className="text-success">{riskCalcResult.breakdown?.threat_intelligence_score || 100}/100</strong>
                    </div>
                  </div>
                </div>

                <div className="col-lg-6 col-12">
                  <span className="xsmall text-secondary font-mono text-uppercase fw-bold d-block mb-2">Actionable Response Recommendations</span>
                  <ul className="mb-0 ps-3 small text-secondary">
                    {(riskCalcResult.recommendation || []).map((rec, idx) => (
                      <li key={idx} className="mb-1 text-white">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* TOP PRIORITY INCIDENTS TABLE MATRIX */}
        <section className="logs-section">
          <div className="logs-header">
            <div>
              <h3 className="logs-title text-white m-0 d-flex align-items-center gap-2">
                <TrendingUp size={18} className="text-success" />
                <span>Incident Prioritization & Decision Matrix</span>
              </h3>
              <p className="text-secondary xsmall m-0 mt-0.5 font-mono">
                Sorted by Risk Score descending &middot; Answers "Which threat should you investigate first and why?"
              </p>
            </div>

            <div className="logs-toolbar d-flex flex-wrap align-items-center gap-3">
              <div className="search-bar">
                <Search size={16} />
                <input 
                  type="text" 
                  value={incidentSearchQuery}
                  onChange={(e) => setIncidentSearchQuery(e.target.value)}
                  placeholder="Search incident, threat, asset, CVE..." 
                />
              </div>

              <div className="dropdown-filters d-flex gap-2">
                <select 
                  value={incidentFilterStatus}
                  onChange={(e) => setIncidentFilterStatus(e.target.value)}
                  className="filter-select"
                  title="Filter by Status"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="RESOLVED">Resolved</option>
                </select>

                <select 
                  value={incidentFilterAsset}
                  onChange={(e) => setIncidentFilterAsset(e.target.value)}
                  className="filter-select"
                  title="Filter by Asset"
                >
                  <option value="ALL">All Assets</option>
                  {uniqueIncidentAssets.filter(a => a !== 'ALL').map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="table-controls">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
                  <button
                    key={lvl}
                    className={`log-filter-btn ${incidentFilterRisk === lvl ? 'active' : ''}`}
                    onClick={() => setIncidentFilterRisk(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Incident ID</th>
                  <th>Attack Chain / Threat Scenario</th>
                  <th>Risk Score</th>
                  <th>Priority</th>
                  <th>Affected Asset</th>
                  <th>MITRE ATT&CK</th>
                  <th>Threat Intel / IOC</th>
                  <th>Status</th>
                  <th>Decision Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center text-secondary py-5">
                      No security incidents match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map(inc => {
                    const isCrit = inc.priority === 'Critical';
                    const isHigh = inc.priority === 'High';
                    const isMed = inc.priority === 'Medium';
                    const pClass = isCrit ? 'badge-critical' : isHigh ? 'badge-warning' : isMed ? 'badge-info' : 'badge-low';
                    const pColor = isCrit ? '#ef4444' : isHigh ? '#f59e0b' : isMed ? '#3b82f6' : '#10b981';

                    return (
                      <tr key={inc.incident_id} className={`severity-row-${(inc.priority || 'LOW').toLowerCase()}`}>
                        {/* Incident ID */}
                        <td className="font-mono">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleInvestigateIncident(inc.incident_id);
                            }}
                            className="btn btn-link p-0 text-decoration-none font-mono fw-bold text-success"
                            style={{ fontSize: '13px', cursor: 'pointer' }}
                          >
                            {inc.incident_id}
                          </button>
                        </td>

                        {/* Threat Scenario */}
                        <td>
                          <div className="fw-semibold text-white" style={{ fontSize: '13px' }}>
                            {inc.threat_type}
                          </div>
                          <div className="d-flex align-items-center gap-1.5 mt-0.5">
                            {inc.chain_id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleInvestigateIncident(inc.incident_id);
                                }}
                                className="badge bg-danger-subtle text-danger border border-danger-subtle font-mono xsmall px-1.5 py-0 btn p-0 text-start"
                                style={{ cursor: 'pointer' }}
                              >
                                {inc.chain_id} (Multi-Stage)
                              </button>
                            )}
                            <span className="text-secondary xsmall" style={{ fontSize: '10.5px' }}>
                              User: {inc.affected_user || 'system'}
                            </span>
                          </div>
                        </td>

                        {/* Risk Score */}
                        <td className="font-mono">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold fs-6" style={{ color: pColor }}>
                              {inc.risk_score}
                            </span>
                            <div className="progress flex-grow-1" style={{ width: '50px', height: '6px', backgroundColor: 'var(--bg-deep)', borderRadius: '3px' }}>
                              <div 
                                className="progress-bar" 
                                style={{ width: `${inc.risk_score}%`, backgroundColor: pColor }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Priority Badge */}
                        <td>
                          <span className={`badge ${pClass} text-uppercase fw-bold`} style={{ fontSize: '11px', borderRadius: '6px' }}>
                            {inc.priority}
                          </span>
                        </td>

                        {/* Asset */}
                        <td>
                          <div className="fw-medium" style={{ color: 'var(--text-primary)', fontSize: '12.5px' }}>
                            {inc.asset_name}
                          </div>
                          <span className="badge bg-secondary-subtle text-secondary xsmall font-mono mt-0.5">
                            {inc.asset_tier} Tier
                          </span>
                        </td>

                        {/* MITRE */}
                        <td className="font-mono text-info small" style={{ fontSize: '11px' }}>
                          {inc.mitre_technique}
                        </td>

                        {/* Threat Intel */}
                        <td>
                          <div className="text-danger fw-semibold xsmall" style={{ fontSize: '11.5px' }}>
                            {inc.threat_actor}
                          </div>
                          <div className="font-mono text-secondary xsmall" style={{ fontSize: '10px' }}>
                            {inc.source_ip}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`badge ${inc.status === 'Resolved' ? 'bg-success-subtle text-success border border-success-subtle' : inc.status === 'Investigating' ? 'bg-warning-subtle text-warning border border-warning-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} px-2.5 py-1 rounded small font-mono`}>
                            {inc.status}
                          </span>
                        </td>

                        {/* Decision Action Buttons */}
                        <td>
                          <div className="d-flex gap-1.5">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleInvestigateIncident(inc.incident_id);
                              }}
                              className="btn-table-action btn-investigate d-flex align-items-center gap-1"
                              style={{ height: '28px', padding: '0 10px', fontSize: '11px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                            >
                              <span>Investigate & Decide</span>
                              <ArrowUpRight size={11} />
                            </button>
                            {inc.status !== 'Resolved' && (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleResolveIncident(inc.incident_id);
                                }}
                                className="btn-table-action btn-dismiss"
                                style={{ height: '28px', padding: '0 8px', fontSize: '11px', cursor: 'pointer' }}
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    );
  };

  // Handler for Milestone 2: Real-time ML Threat Predictor
  const handleMLPredict = async (e) => {
    if (e) e.preventDefault();
    setMlPredictLoading(true);
    try {
      const result = await predictThreat(mlPredictInput);
      setMlPredictResult(result);
      const isAnom = result.prediction === 'Suspicious' || result.prediction === 'Critical';
      logTerminal(`Executed ML threat inference for vector "${mlPredictInput.event_type}": Verdict [${result.prediction?.toUpperCase()}] (Score: ${result.anomaly_score}, Conf: ${result.confidence_score}%)`, isAnom ? 'critical' : 'success');
      triggerToast(`ML Verdict: ${result.prediction} (${result.confidence_score}% Conf)`, isAnom ? 'warning' : 'success');
    } catch (err) {
      console.error('ML inference error:', err);
      triggerToast('ML Inference failed', 'error');
    } finally {
      setMlPredictLoading(false);
    }
  };

  // --- SUB-RENDER: MILESTONE 2 MACHINE LEARNING ANOMALY DETECTION (IF_v2) ---
  const renderMLAnomalies = () => {
    const rawAnomalies = anomaliesList.length > 0 ? anomaliesList : events.filter(e => e.prediction && e.prediction !== 'Normal');
    const displayAnomalies = rawAnomalies.slice(0, 10);

    return (
      <section className="ml-anomalies-section mt-4">
        {/* ML Module Banner Header */}
        <div className="card mb-4" style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
        }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 font-mono small fw-bold">
                  MILESTONE 2
                </span>
                <span className="badge rounded-pill px-2.5 py-1 font-mono small" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.35)' }}>
                  IF_v2 UN-SUPERVISED
                </span>
                <h3 className="fw-bold m-0" style={{ color: 'var(--text-primary)', fontSize: '18px' }}>
                  Machine Learning Anomaly Detection Engine
                </h3>
              </div>
              <p className="text-secondary small m-0" style={{ fontSize: '13px' }}>
                46-dimensional feature vector extraction and unsupervised outlier detection via Isolation Forest algorithm.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge px-3 py-2 rounded-pill font-mono small fw-bold d-flex align-items-center gap-1.5" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.35)'
              }}>
                <span className="ticker-pulse-dot" style={{ backgroundColor: '#10b981' }} />
                <span>MODEL STATUS: ONLINE</span>
              </span>
            </div>
          </div>

          {/* 4-Box Model Metrics Grid */}
          <div className="row g-3 mt-3">
            <div className="col-lg-3 col-sm-6 col-12">
              <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
                <div className="text-secondary font-mono small text-uppercase" style={{ fontSize: '10.5px' }}>Model Version</div>
                <div className="d-flex align-items-center justify-content-between mt-1">
                  <span className="fw-bold fs-5 font-mono" style={{ color: 'var(--text-primary)' }}>{modelPerf.model_version || 'IF_v2'}</span>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill font-mono xsmall">Active</span>
                </div>
                <div className="text-secondary small mt-1" style={{ fontSize: '11px' }}>{modelPerf.algorithm || 'Isolation Forest'} (46 Features)</div>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6 col-12">
              <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
                <div className="text-secondary font-mono small text-uppercase" style={{ fontSize: '10.5px' }}>Total Events Evaluated</div>
                <div className="d-flex align-items-center justify-content-between mt-1">
                  <span className="fw-bold fs-5 font-mono" style={{ color: 'var(--text-primary)' }}>{(modelPerf.total_events || 1800).toLocaleString()}</span>
                  <Activity size={16} className="text-info" />
                </div>
                <div className="text-secondary small mt-1" style={{ fontSize: '11px' }}>Continuous stream ingestion</div>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6 col-12">
              <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
                <div className="text-secondary font-mono small text-uppercase" style={{ fontSize: '10.5px' }}>Flagged Anomalies</div>
                <div className="d-flex align-items-center justify-content-between mt-1">
                  <span className="fw-bold fs-5 font-mono text-danger">{(modelPerf.suspicious_count || 1309).toLocaleString()}</span>
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill font-mono xsmall">{modelPerf.suspicious_percentage || 72.7}%</span>
                </div>
                <div className="text-secondary small mt-1" style={{ fontSize: '11px' }}>Outlier score &lt; -0.50 threshold</div>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6 col-12">
              <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
                <div className="text-secondary font-mono small text-uppercase" style={{ fontSize: '10.5px' }}>Baseline Normal Telemetry</div>
                <div className="d-flex align-items-center justify-content-between mt-1">
                  <span className="fw-bold fs-5 font-mono text-success">{(modelPerf.normal_count || 491).toLocaleString()}</span>
                  <ShieldCheck size={16} className="text-success" />
                </div>
                <div className="text-secondary small mt-1" style={{ fontSize: '11px' }}>In-distribution nominal traffic</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Interactive Inference Sandbox & Threat Distribution */}
        <div className="row g-4 mb-4">
          {/* Left Column: Interactive ML Predictor Sandbox */}
          <div className="col-lg-7 col-12">
            <div className="card h-100" style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
            }}>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h4 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
                    <Cpu size={18} className="text-primary" />
                    <span>Interactive ML Inference Sandbox (POST /api/predict)</span>
                  </h4>
                  <p className="text-secondary small m-0 mt-0.5" style={{ fontSize: '12px' }}>
                    Pass real-time event attributes to test the live Isolation Forest model prediction.
                  </p>
                </div>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill font-mono xsmall">
                  Live API Testing
                </span>
              </div>

              <form onSubmit={handleMLPredict}>
                <div className="row g-3">
                  {/* Event Type */}
                  <div className="col-md-6 col-12">
                    <label className="form-label text-secondary small font-mono mb-1">Threat / Event Type</label>
                    <select
                      className="form-select small font-mono"
                      value={mlPredictInput.event_type}
                      onChange={(e) => setMlPredictInput(prev => ({ ...prev, event_type: e.target.value }))}
                      style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12.5px' }}
                    >
                      <option value="Brute Force">Brute Force</option>
                      <option value="Malware Detection">Malware Detection</option>
                      <option value="Phishing Email">Phishing Email</option>
                      <option value="SQL Injection">SQL Injection</option>
                      <option value="DDoS Traffic">DDoS Traffic</option>
                      <option value="Privilege Escalation">Privilege Escalation</option>
                      <option value="Routine DNS Lookup">Routine DNS Lookup</option>
                      <option value="Standard HTTPS Traffic">Standard HTTPS Traffic</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div className="col-md-6 col-12">
                    <label className="form-label text-secondary small font-mono mb-1">Severity Classification</label>
                    <select
                      className="form-select small font-mono"
                      value={mlPredictInput.severity}
                      onChange={(e) => setMlPredictInput(prev => ({ ...prev, severity: e.target.value }))}
                      style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12.5px' }}
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Failed Login Attempts */}
                  <div className="col-md-6 col-12">
                    <label className="form-label text-secondary small font-mono mb-1">Failed Login Attempts</label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      className="form-control small font-mono"
                      value={mlPredictInput.failed_login_attempts}
                      onChange={(e) => setMlPredictInput(prev => ({ ...prev, failed_login_attempts: parseInt(e.target.value || 0, 10) }))}
                      style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12.5px' }}
                    />
                  </div>

                  {/* CVSS Score */}
                  <div className="col-md-6 col-12">
                    <label className="form-label text-secondary small font-mono mb-1">
                      CVSS Vulnerability Score: <span className="text-warning fw-bold">{mlPredictInput.cvss_score}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      className="form-range"
                      value={mlPredictInput.cvss_score}
                      onChange={(e) => setMlPredictInput(prev => ({ ...prev, cvss_score: parseFloat(e.target.value) }))}
                    />
                  </div>

                  {/* Protocol */}
                  <div className="col-md-4 col-12">
                    <label className="form-label text-secondary small font-mono mb-1">Network Protocol</label>
                    <select
                      className="form-select small font-mono"
                      value={mlPredictInput.protocol}
                      onChange={(e) => setMlPredictInput(prev => ({ ...prev, protocol: e.target.value }))}
                      style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12.5px' }}
                    >
                      <option value="SSH">SSH (Port 22)</option>
                      <option value="HTTPS">HTTPS (Port 443)</option>
                      <option value="DNS">DNS (Port 53)</option>
                      <option value="SMB">SMB (Port 445)</option>
                      <option value="RDP">RDP (Port 3389)</option>
                    </select>
                  </div>

                  {/* Malware Detected */}
                  <div className="col-md-4 col-12">
                    <label className="form-label text-secondary small font-mono mb-1">Malware Signature</label>
                    <select
                      className="form-select small font-mono"
                      value={mlPredictInput.malware_detected}
                      onChange={(e) => setMlPredictInput(prev => ({ ...prev, malware_detected: e.target.value }))}
                      style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12.5px' }}
                    >
                      <option value="No">No Signature Match</option>
                      <option value="Yes">Malicious Signature Found</option>
                    </select>
                  </div>

                  {/* Department */}
                  <div className="col-md-4 col-12">
                    <label className="form-label text-secondary small font-mono mb-1">Department</label>
                    <select
                      className="form-select small font-mono"
                      value={mlPredictInput.department}
                      onChange={(e) => setMlPredictInput(prev => ({ ...prev, department: e.target.value }))}
                      style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12.5px' }}
                    >
                      <option value="IT">IT Infrastructure</option>
                      <option value="Finance">Finance &amp; Banking</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Executive">C-Suite / Executive</option>
                      <option value="HR">Human Resources</option>
                    </select>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button
                    type="submit"
                    disabled={mlPredictLoading}
                    className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-3 fw-bold"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)'
                    }}
                  >
                    {mlPredictLoading ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Running Inference...</span>
                      </>
                    ) : (
                      <>
                        <Cpu size={15} />
                        <span>Execute ML Inference</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMlPredictInput({
                        event_type: 'Brute Force',
                        failed_login_attempts: 18,
                        cvss_score: 8.9,
                        severity: 'High',
                        status: 'Failed',
                        protocol: 'SSH',
                        malware_detected: 'No',
                        department: 'IT',
                        vulnerability_id: 'CVE-2023-1234'
                      });
                      setMlPredictResult(null);
                    }}
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                  >
                    Reset Form
                  </button>
                </div>
              </form>

              {/* Real-time Inference Results Card */}
              {mlPredictResult && (
                <div className="mt-4 p-3.5 rounded-3" style={{
                  backgroundColor: 'var(--bg-deep)',
                  border: '1px solid var(--border-color)',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-2 mb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <Sparkles size={16} className="text-primary" />
                      <span className="fw-bold font-mono" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                        Model Output Verdict
                      </span>
                    </div>
                    <span className="badge rounded-pill px-3 py-1 font-mono fw-bold" style={{
                      backgroundColor: mlPredictResult.prediction === 'Suspicious' || mlPredictResult.prediction === 'Critical'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                      color: mlPredictResult.prediction === 'Suspicious' || mlPredictResult.prediction === 'Critical' ? '#ef4444' : '#10b981',
                      border: `1px solid ${mlPredictResult.prediction === 'Suspicious' || mlPredictResult.prediction === 'Critical' ? '#ef4444' : '#10b981'}40`,
                      fontSize: '12px'
                    }}>
                      {mlPredictResult.prediction?.toUpperCase()} VERDICT
                    </span>
                  </div>

                  <div className="row g-3 font-mono">
                    <div className="col-sm-4 col-12">
                      <div className="text-secondary small" style={{ fontSize: '11px' }}>Confidence Score</div>
                      <div className="fw-bold fs-5 mt-0.5" style={{ color: 'var(--text-primary)' }}>{mlPredictResult.confidence_score}%</div>
                      <div className="progress mt-1.5" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${mlPredictResult.confidence_score}%`,
                            backgroundColor: mlPredictResult.confidence_score >= 80 ? '#ef4444' : '#3b82f6'
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-sm-4 col-12">
                      <div className="text-secondary small" style={{ fontSize: '11px' }}>Anomaly Raw Score</div>
                      <div className={`fw-bold fs-5 mt-0.5 ${mlPredictResult.anomaly_score < 0 ? 'text-danger' : 'text-success'}`}>
                        {mlPredictResult.anomaly_score}
                      </div>
                      <div className="text-secondary small" style={{ fontSize: '10px' }}>
                        {mlPredictResult.anomaly_score < 0 ? 'Anomalous Isolation Flag' : 'In-Distribution Normal'}
                      </div>
                    </div>

                    <div className="col-sm-4 col-12">
                      <div className="text-secondary small" style={{ fontSize: '11px' }}>Model Version</div>
                      <div className="fw-bold fs-5 mt-0.5 text-primary">{mlPredictResult.model_version || 'IF_v2'}</div>
                      <div className="text-secondary small" style={{ fontSize: '10px' }}>Trained on 46 Dimensions</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Threat Summary & Distribution */}
          <div className="col-lg-5 col-12">
            <div className="card h-100" style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
            }}>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h4 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
                  <Activity size={18} className="text-warning" />
                  <span>Threat Summary Breakdown</span>
                </h4>
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-0.5 rounded-pill font-mono xsmall">
                  GET /api/threat-summary
                </span>
              </div>

              {/* By Severity */}
              <div className="mb-4">
                <div className="small font-mono text-secondary text-uppercase mb-2" style={{ fontSize: '11px' }}>
                  Distribution by Severity
                </div>
                <div className="d-flex flex-column gap-2">
                  {Object.entries(threatSummary.by_severity || { Critical: 346, High: 573, Medium: 476, Low: 405 }).map(([sev, cnt]) => {
                    const total = 1800;
                    const pct = Math.round((cnt / total) * 100);
                    const color = sev === 'Critical' ? '#ef4444' : sev === 'High' ? '#f59e0b' : sev === 'Medium' ? '#3b82f6' : '#10b981';
                    return (
                      <div key={sev}>
                        <div className="d-flex justify-content-between font-mono small mb-1" style={{ fontSize: '11.5px' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{sev}</span>
                          <span className="text-secondary">{cnt} ({pct}%)</span>
                        </div>
                        <div className="progress" style={{ height: '6px', backgroundColor: 'var(--bg-deep)', borderRadius: '3px' }}>
                          <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: color, borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Attack Type */}
              <div>
                <div className="small font-mono text-secondary text-uppercase mb-2" style={{ fontSize: '11px' }}>
                  Top Detected Attack Categories
                </div>
                <div className="d-flex flex-column gap-2">
                  {Object.entries(threatSummary.by_type || { 'Brute Force': 195, 'Malware Detection': 182, 'Phishing Email': 175, 'SQL Injection': 142 }).map(([typ, cnt]) => {
                    return (
                      <div key={typ} className="d-flex justify-content-between align-items-center p-2 rounded-2" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
                        <span className="small fw-semibold" style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{typ}</span>
                        <span className="badge px-2 py-1 rounded-pill font-mono" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', fontSize: '11px' }}>
                          {cnt} events
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly Detections Feed Table */}
        <div className="card" style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
        }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h4 className="fw-bold m-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>
                <Layers size={18} className="text-danger" />
                <span>Recent ML Anomaly Telemetry Detections</span>
              </h4>
              <p className="text-secondary small m-0 mt-0.5" style={{ fontSize: '12px' }}>
                Stream of highest outlier anomaly events classified by Isolation Forest.
              </p>
            </div>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 rounded-pill font-mono xsmall">
              {displayAnomalies.length} Flagged Inferences
            </span>
          </div>

          <div className="table-responsive">
            <table className="table align-middle m-0" style={{ color: 'var(--text-primary)' }}>
              <thead>
                <tr className="text-secondary font-mono small" style={{ fontSize: '11px', borderBottom: '1px solid var(--border-color)' }}>
                  <th className="py-2.5">Event ID</th>
                  <th className="py-2.5">Threat Type</th>
                  <th className="py-2.5">Classification</th>
                  <th className="py-2.5">Confidence</th>
                  <th className="py-2.5">Severity</th>
                  <th className="py-2.5">Time</th>
                  <th className="py-2.5 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayAnomalies.map((evt) => (
                  <tr key={evt.id || evt.event_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-2.5 font-mono fw-bold text-success" style={{ fontSize: '12.5px' }}>
                      {evt.id || evt.event_id}
                    </td>
                    <td className="py-2.5 fw-semibold" style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                      {evt.name || evt.event_type || evt.threat_type}
                    </td>
                    <td className="py-2.5">
                      <span className={`badge ${
                        (evt.prediction || '').toUpperCase() === 'CRITICAL' ? 'bg-danger text-white' :
                        (evt.prediction || '').toUpperCase() === 'SUSPICIOUS' ? 'bg-warning text-dark' :
                        'bg-success text-white'
                      } px-2 py-0.5 rounded font-mono xsmall`}>
                        {evt.prediction || 'Suspicious'}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono fw-bold" style={{ fontSize: '12.5px' }}>
                      {evt.confidence || evt.confidence_score || 85}%
                    </td>
                    <td className="py-2.5">
                      <span className={`badge ${
                        (evt.severity || '').toUpperCase() === 'CRITICAL' ? 'bg-danger-subtle text-danger border border-danger-subtle' :
                        (evt.severity || '').toUpperCase() === 'HIGH' ? 'bg-warning-subtle text-warning border border-warning-subtle' :
                        'bg-info-subtle text-info border border-info-subtle'
                      } px-2 py-0.5 rounded font-mono xsmall`}>
                        {evt.severity || 'High'}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-secondary small">{evt.time || evt.timestamp || 'Just now'}</td>
                    <td className="py-2.5 text-end">
                      <button
                        onClick={() => handleInvestigate(evt.id || evt.event_id)}
                        className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                        style={{ fontSize: '11px', fontWeight: '600' }}
                      >
                        <Search size={11} />
                        <span>Investigate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
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
          <h2 className="kpi-value">{(stats.totalEvents || 0).toLocaleString()}</h2>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
            <span className="kpi-display">Total logged network events</span>
            <span className="kpi-trend-badge trend-blue">+14.2% AI Telemetry</span>
          </div>
        </div>

        <div className="kpi-card kpi-red">
          <div className="kpi-card-header">
            <span className="kpi-title">Anomalies Detected</span>
            <div className="kpi-icon-circle"><ShieldAlert size={18} /></div>
          </div>
          <h2 className="kpi-value">{(stats.anomaliesDetected || 0).toLocaleString()}</h2>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
            <span className="kpi-display">AI-flagged anomaly logs</span>
            <span className="kpi-trend-badge trend-red">Real-time ML Flagged</span>
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-card-header">
            <span className="kpi-title">Normal Events</span>
            <div className="kpi-icon-circle"><ShieldCheck size={18} /></div>
          </div>
          <h2 className="kpi-value">{(stats.normalEvents || 0).toLocaleString()}</h2>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
            <span className="kpi-display">Baseline non-threat events</span>
            <span className="kpi-trend-badge trend-green">99.8% Healthy SLA</span>
          </div>
        </div>

        <div className="kpi-card kpi-orange">
          <div className="kpi-card-header">
            <span className="kpi-title">High-Risk Events</span>
            <div className="kpi-icon-circle"><AlertTriangle size={18} /></div>
          </div>
          <h2 className="kpi-value">{(stats.highRiskEvents || 0).toLocaleString()}</h2>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
            <span className="kpi-display">High warning classification</span>
            <span className="kpi-trend-badge trend-orange">Elevated Alert</span>
          </div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-card-header">
            <span className="kpi-title">Critical Threats</span>
            <div className="kpi-icon-circle"><Siren size={18} /></div>
          </div>
          <h2 className="kpi-value">{(stats.criticalThreats || 0).toLocaleString()}</h2>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
            <span className="kpi-display">Severe priority exploits</span>
            <span className="kpi-trend-badge trend-purple">0 Unmitigated</span>
          </div>
        </div>
      </section>

      {/* MILESTONE 3 DECISION SPOTLIGHT BANNER */}
      <section className="mb-4">
        <div className="m3-spotlight-banner">
          <div className="m3-spotlight-left">
            <div className="m3-spotlight-icon">
              <Flame size={24} />
            </div>

            <div className="m3-spotlight-content">
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <span className="badge bg-danger text-white font-mono fw-bold px-2 py-0.5 rounded small" style={{ fontSize: '10px', letterSpacing: '0.04em' }}>
                  TOP THREAT TO INVESTIGATE FIRST (M3 DECISION)
                </span>
                <span className="m3-spotlight-meta font-mono fw-semibold">
                  {incidents[0]?.incident_id || 'INC-1001'} &middot; Risk Score: {incidents[0]?.risk_score || 97}/100
                </span>
                <span className="badge rounded-pill" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '10px' }}>
                  {incidents[0]?.asset_name || 'Database-Server-01'} ({incidents[0]?.asset_tier || 'Tier 1 Critical'})
                </span>
              </div>
              <h4 className="m3-spotlight-title">
                {incidents[0]?.threat_type || 'Multi-Stage Database Takeover & Ransomware Campaign'} &rarr; <span className="text-danger">{incidents[0]?.asset_name || 'Database-Server-01'}</span>
              </h4>
              <p className="m3-spotlight-desc">
                <strong>Why investigate first?</strong> Critical production database asset, CVSS 10.0 Log4j/Ransomware exploit, APT-29 nation-state IOC, and 5 correlated intrusion chain stages.
              </p>
            </div>
          </div>

          <div className="m3-spotlight-actions">
            <button 
              type="button"
              id="btn-investigate-top-threat-m3"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const allIncs = (incidents && incidents.length > 0) ? incidents : DEFAULT_INCIDENTS;
                const targetId = allIncs[0]?.incident_id || 'INC-1001';
                handleInvestigateIncident(targetId);
              }}
              className="btn m3-spotlight-btn-primary btn-sm d-flex align-items-center justify-content-center gap-1.5 px-3.5 py-2"
              style={{ cursor: 'pointer', position: 'relative', zIndex: 10 }}
            >
              <span>Investigate Top Threat (M3)</span>
              <ArrowUpRight size={14} />
            </button>
            <button 
              type="button"
              id="btn-view-all-prioritized-threats"
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation();
                setInvestigatingIncidentId(null);
                setActivePanel('Risk Intelligence'); 
              }}
              className="btn m3-spotlight-btn-secondary btn-sm py-2 px-3.5 d-flex align-items-center justify-content-center gap-1.5"
              style={{ cursor: 'pointer', position: 'relative', zIndex: 10 }}
            >
              <span>View All Prioritized Threats &rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* Simulator control and mini terminal logs */}
      <section className="terminal-simulation-grid mb-4">
        <div className="row g-4">
          <div className="col-lg-8 col-12">
            <div className="terminal-card h-100 d-flex flex-column">
              <div className="terminal-card-header">
                <div className="d-flex align-items-center gap-2">
                  <div className="terminal-window-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <Terminal size={15} className="text-success ms-1" />
                  <span className="fw-semibold font-mono" style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                    Intrusion Feed Terminal (Live Stream)
                  </span>
                </div>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill small fw-bold font-mono" style={{ fontSize: '10px' }}>
                  ● LIVE FEED
                </span>
              </div>
              <div className="terminal-feed flex-grow-1" ref={terminalBottomRef}>
                {terminalLogs.map((log) => (
                  <div key={log.id} className={`terminal-line ${log.type === 'critical' ? 'critical' : log.type === 'warning' ? 'warning' : log.type === 'success' ? 'text-success' : ''}`}>
                    <span style={{ opacity: 0.6, marginRight: '6px' }}>[{log.time}]</span>
                    {log.message}
                  </div>
                ))}
                <div className="d-flex align-items-center font-mono mt-2 pt-1" style={{ color: '#10b981', fontSize: '11px', opacity: 0.85 }}>
                  <span>soc-agent@infosys-gateway:~$</span>
                  <span className="terminal-cursor" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4 col-12 d-flex flex-column gap-3">
            {/* Simulator control and options */}
            <div className="control-card">
              <h4 className="mb-2 fw-semibold d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: '15px' }}>
                <Sliders size={17} className="text-success" />
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
                  <RefreshCw size={15} />
                  <span>Sync with Database</span>
                </button>
              </div>
            </div>

            {/* AI Model Core Telemetry */}
            <div className="control-card">
              <h4 className="mb-2 fw-semibold d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: '15px' }}>
                <Cpu size={17} className="text-success" />
                <span>Cyber AI Core Telemetry</span>
              </h4>
              <p className="text-secondary small mb-3">
                Performance indicators of the neural networks anomaly prediction model.
              </p>
              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex justify-content-between text-secondary">
                  <span>AI Engine State:</span>
                  <span className="text-success fw-bold">ONLINE (v2.4)</span>
                </div>
                <div className="d-flex justify-content-between text-secondary">
                  <span>Model Accuracy:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>98.4%</span>
                </div>
                <div className="d-flex justify-content-between text-secondary">
                  <span>Inference Latency:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>12ms</span>
                </div>
                <div className="d-flex justify-content-between text-secondary">
                  <span>Database State:</span>
                  <span className="text-success font-mono">ESTABLISHED</span>
                </div>
                <hr className="my-2" style={{ borderColor: 'var(--border-color)', opacity: 0.5 }} />
                <label className="d-flex align-items-center gap-2 text-secondary cursor-pointer" style={{ userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={vocalAlerts}
                    onChange={(e) => {
                      setVocalAlerts(e.target.checked);
                      if (e.target.checked) {
                        triggerToast('Synthesized Vocal Alerts Activated!', 'success');
                      }
                    }}
                    className="form-check-input"
                  />
                  <span>Voice Warn Alerts</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time event log table */}
      <section className="logs-section">
        <div className="logs-header">
          <h3 className="logs-title text-white">Threat Detection Table</h3>
          
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

            {selectedHeatmapDate && (
              <div 
                className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill text-success"
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  letterSpacing: '0.02em',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <span>DATE: {new Date(selectedHeatmapDate + 'T00:00:00').toLocaleDateString()}</span>
                <button 
                  onClick={() => {
                    setSelectedHeatmapDate(null);
                    logTerminal('Date filter cleared.', 'info');
                  }} 
                  className="btn-close btn-close-white p-0 ms-1" 
                  style={{ fontSize: '8px', cursor: 'pointer', filter: 'invert(1) grayscale(1) brightness(1.5)', width: '8px', height: '8px' }} 
                  title="Clear date filter"
                />
              </div>
            )}

            <div className="dropdown-filters d-flex gap-2">
                  <select 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="filter-select"
                    title="Date"
                  >
                    <option value="ALL">All Dates</option>
                    {uniqueDates.filter(date => date !== 'ALL').map(date => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>

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
                <th>Event ID</th>
                <th>Event Type</th>
                <th>AI Prediction</th>
                <th>Confidence</th>
                <th>Severity</th>
                <th>Timestamp</th>
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
                  let predictionLabel = log.prediction || 'Normal';
                  let predClass = 'badge-low';
                  if (predictionLabel === 'Critical') {
                    predClass = 'badge-critical';
                  } else if (predictionLabel === 'Suspicious') {
                    predClass = 'badge-warning';
                  }

                  let severityRowClass = `severity-row-${(log.severity || 'LOW').toLowerCase()}`;

                  return (
                    <tr key={log.id} className={severityRowClass}>
                      <td className="font-mono text-info small">
                        <button 
                          className="btn btn-link p-0 text-decoration-none font-mono fw-bold text-success" 
                          onClick={() => handleInvestigate(log.id || log.event_id)}
                          style={{ fontSize: '13px' }}
                        >
                          {log.id || log.event_id}
                        </button>
                      </td>
                      <td className="fw-semibold text-white">{log.name || log.event_type}</td>
                      <td>
                        <span className={`badge ${predClass} small`}>
                          {predictionLabel}
                        </span>
                      </td>
                      <td className="font-mono text-white fw-bold">{log.confidence}%</td>
                      <td>
                        <span className={`badge badge-${(log.severity || 'LOW').toLowerCase()}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="font-mono text-secondary small">{log.time || log.timestamp}</td>
                      <td>
                        {log.status !== 'RESOLVED' ? (
                          <>
                            <button 
                              className="btn-table-action btn-investigate" 
                              onClick={() => handleInvestigate(log.id || log.event_id)}
                            >
                              Investigate
                            </button>
                            <button 
                              className="btn-table-action btn-dismiss" 
                              onClick={() => handleResolve(log.id || log.event_id)}
                            >
                              Resolve
                            </button>
                          </>
                        ) : (
                          <span className="badge-resolved-status">
                            <ShieldCheck size={12} className="me-1" />
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

  // --- SUB-RENDER 2: INTERACTIVE CALENDAR ACTIVITY HEATMAP ---
  const renderThreatMap = () => {
    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const months = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];
    
    const totalCols = 30; // Fits perfectly next to the live threat list
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    // Group real events by date (YYYY-MM-DD)
    const eventDateMap = {};
    events.forEach((evt) => {
      let dateKey = null;
      if (evt.timestamp && evt.timestamp.includes('T')) {
        dateKey = evt.timestamp.split('T')[0];
      } else if (evt.timestamp && evt.timestamp.includes('-') && evt.timestamp.length >= 10) {
        dateKey = evt.timestamp.slice(0, 10);
      } else {
        // Today's event (simulator or newly logged)
        const now = new Date();
        dateKey = now.toISOString().split('T')[0];
      }
      if (dateKey) {
        if (!eventDateMap[dateKey]) {
          eventDateMap[dateKey] = [];
        }
        eventDateMap[dateKey].push(evt);
      }
    });

    const today = new Date();
    const todayDay = today.getDay() === 0 ? 7 : today.getDay(); // Mon=1..Sun=7
    const mondayOfThisWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (todayDay - 1));

    // Precalculate grid cells with exact daily telemetry
    const gridMatrix = [];
    let totalTrackedThreats = 0;
    let maxDailyThreats = 0;

    for (let r = 0; r < 7; r++) {
      gridMatrix[r] = [];
      for (let c = 0; c < totalCols; c++) {
        const cellDate = new Date(mondayOfThisWeek.getTime());
        cellDate.setDate(mondayOfThisWeek.getDate() - (29 - c) * 7 + r);
        const cellDateStr = cellDate.toISOString().split('T')[0];
        const isFuture = cellDate.getTime() > today.getTime();

        const realEvents = eventDateMap[cellDateStr] || [];
        
        // Deterministic realistic baseline for historic days
        const seed = Math.abs(Math.sin(cellDate.getTime()) * 10000);
        const baselineNoise = (!isFuture && seed % 7 < 3) ? Math.floor((seed % 4) + 1) : 0;
        const count = isFuture ? 0 : (realEvents.length > 0 ? realEvents.length : baselineNoise);
        
        totalTrackedThreats += count;
        if (count > maxDailyThreats) maxDailyThreats = count;

        const criticalCount = realEvents.filter(e => e.severity === 'CRITICAL').length || (count >= 4 ? 2 : (count >= 2 ? 1 : 0));
        const warningCount = realEvents.filter(e => e.severity === 'HIGH' || e.severity === 'WARNING').length || Math.max(0, count - criticalCount);
        const resolvedCount = realEvents.filter(e => e.status === 'RESOLVED').length;
        const topThreat = realEvents[0] ? (realEvents[0].name || realEvents[0].event_type) : (criticalCount > 0 ? 'Brute Force Probe' : (count > 0 ? 'Anomalous Traffic Spike' : 'None'));
        const topTarget = realEvents[0] ? (realEvents[0].target || realEvents[0].destination_ip) : (count > 0 ? 'Production Gateway' : 'None');

        gridMatrix[r][c] = {
          cellDate,
          cellDateStr,
          isFuture,
          count,
          criticalCount,
          warningCount,
          resolvedCount,
          topThreat,
          topTarget,
          realEvents
        };
      }
    }

    // Extract unresolved live threat vectors for the side panel
    const activeThreats = events.filter(e => e.status !== 'RESOLVED').slice(0, 5);

    return (
      <section className="threat-map-section card-view">
        <div className="panel-header mb-4">
          <h3 className="d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Map className="text-success" />
            <span>Interactive Threat Activity Heatmap</span>
          </h3>
          <p className="text-secondary small">Chronological density distribution of security incidents and active attack vectors across enterprise network nodes</p>
        </div>

        <div className="row g-4 align-items-stretch">
          {/* Left Column: Calendar Heatmap Card */}
          <div className="col-lg-8 col-12">
            <div className="threat-map-container p-4 rounded-4 h-100 d-flex flex-column justify-content-between" style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
            }}>
              {/* Heatmap Year & Subtitle Header */}
              <div className="d-flex justify-content-between align-items-center mb-3 px-2 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h2 className="fw-extrabold m-0 font-mono" style={{ fontSize: '20px', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>{prevYear} &mdash; {currentYear}</h2>
                  <span className="text-secondary small font-mono" style={{ fontSize: '11px' }}>Chronological Incident Density ({totalCols} Weeks Range)</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  {selectedHeatmapDate && (
                    <button 
                      onClick={() => setSelectedHeatmapDate(null)}
                      className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1 font-mono"
                      style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px' }}
                    >
                      <span>Filtered: {selectedHeatmapDate}</span>
                      <span>✕</span>
                    </button>
                  )}
                  <div className="text-end">
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill font-mono fw-bold" style={{ fontSize: '10px' }}>
                      ● LIVE MATRIX
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Hover Details Inspector Bar */}
              <div className="heatmap-inspector-bar p-3 rounded-3 mb-3" style={{
                backgroundColor: 'var(--bg-deep)',
                border: '1px solid var(--border-color)',
                minHeight: '62px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                transition: 'all 0.25s ease'
              }}>
                {hoveredHeatmapCell ? (
                  <>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: hoveredHeatmapCell.count > 0 ? (hoveredHeatmapCell.criticalCount > 0 ? '#ef4444' : '#10b981') : '#64748b',
                        boxShadow: hoveredHeatmapCell.count > 0 ? `0 0 8px ${hoveredHeatmapCell.criticalCount > 0 ? '#ef4444' : '#10b981'}` : 'none'
                      }} />
                      <div>
                        <div className="fw-bold font-mono" style={{ color: 'var(--text-primary)', fontSize: '12.5px' }}>
                          {hoveredHeatmapCell.formattedDate}
                        </div>
                        <div className="text-secondary small font-mono" style={{ fontSize: '10.5px' }}>
                          {hoveredHeatmapCell.count > 0 ? `${hoveredHeatmapCell.count} Incident${hoveredHeatmapCell.count === 1 ? '' : 's'} Tracked` : 'No Incidents Logged (Clean)'}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap font-mono">
                      {hoveredHeatmapCell.count > 0 ? (
                        <>
                          {hoveredHeatmapCell.criticalCount > 0 && (
                            <span className="badge bg-danger text-white px-2 py-1 rounded" style={{ fontSize: '10px' }}>
                              {hoveredHeatmapCell.criticalCount} Critical
                            </span>
                          )}
                          {hoveredHeatmapCell.warningCount > 0 && (
                            <span className="badge bg-warning text-dark px-2 py-1 rounded" style={{ fontSize: '10px' }}>
                              {hoveredHeatmapCell.warningCount} Warning
                            </span>
                          )}
                          <span className="text-secondary small ms-1" style={{ fontSize: '10.5px' }}>
                            Target: <span className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{hoveredHeatmapCell.topTarget}</span>
                          </span>
                        </>
                      ) : (
                        <span className="text-secondary small" style={{ fontSize: '11px' }}>
                          Baseline nominal telemetry &middot; 0 threats
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="d-flex align-items-center justify-content-between w-100 text-secondary font-mono small" style={{ fontSize: '11px' }}>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-success">ℹ</span>
                      <span>Hover over any calendar cell to inspect telemetry details. Click to filter security event logs.</span>
                    </div>
                    <div className="d-none d-md-flex align-items-center gap-3">
                      <span>Max Daily: <strong style={{ color: 'var(--text-primary)' }}>{maxDailyThreats}</strong></span>
                      <span>Tracked Range: <strong style={{ color: 'var(--text-primary)' }}>210 Days</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Heatmap Grid */}
              <div className="d-flex align-items-start gap-2 overflow-auto py-2">
                <div className="flex-grow-1" style={{ minWidth: '420px' }}>
                  <div className="d-flex flex-column gap-1">
                    {daysOfWeek.map((dayName, rIdx) => (
                      <div key={dayName} className="d-flex align-items-center gap-1">
                        <div className="d-flex gap-1 flex-grow-1">
                          {Array.from({ length: totalCols }).map((_, cIdx) => {
                            const cellInfo = gridMatrix[rIdx][cIdx];
                            const count = cellInfo.count;
                            const isFuture = cellInfo.isFuture;

                            let cellBg = theme === 'light' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)'; 
                            let fontColor = 'transparent';
                            let borderStyle = '1px solid var(--border-color)';
                            let cellShadow = 'none';

                            if (!isFuture && count > 0) {
                              if (count >= 10) {
                                // High alert — bright emerald
                                cellBg = '#059669';
                                fontColor = '#ffffff';
                                borderStyle = '1.5px solid #34d399';
                                cellShadow = '0 0 10px rgba(16, 185, 129, 0.7)';
                              } else if (count >= 6) {
                                // Moderate-high
                                cellBg = '#10b981';
                                fontColor = '#000000';
                                borderStyle = '1px solid #34d399';
                                cellShadow = '0 0 6px rgba(16, 185, 129, 0.4)';
                              } else if (count >= 3) {
                                // Medium density
                                cellBg = theme === 'light' ? '#6ee7b7' : '#047857';
                                fontColor = theme === 'light' ? '#064e3b' : '#ffffff';
                                borderStyle = '1px solid #10b981';
                              } else {
                                // Low density
                                cellBg = theme === 'light' ? '#d1fae5' : '#064e3b';
                                fontColor = theme === 'light' ? '#065f46' : '#6ee7b7';
                                borderStyle = '1px solid rgba(16, 185, 129, 0.35)';
                              }
                            }

                            const isSelected = selectedHeatmapDate === cellInfo.cellDateStr;

                            return (
                              <div 
                                key={cIdx} 
                                className={`heatmap-cell d-flex align-items-center justify-content-center rounded-1`}
                                style={{
                                  width: '21px',
                                  height: '21px',
                                  backgroundColor: cellBg,
                                  border: isSelected ? '2px solid #38bdf8' : borderStyle,
                                  boxShadow: isSelected ? '0 0 12px #38bdf8' : cellShadow,
                                  fontSize: '8.5px',
                                  fontWeight: '800',
                                  fontFamily: 'JetBrains Mono, monospace',
                                  color: fontColor,
                                  transition: 'all 0.15s ease',
                                  cursor: isFuture ? 'default' : 'pointer',
                                  userSelect: 'none',
                                  opacity: isFuture ? 0.3 : 1,
                                  transform: isSelected ? 'scale(1.15)' : 'none',
                                  zIndex: isSelected ? 5 : 1
                                }}
                                title={`${cellInfo.cellDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}: ${count} Threat${count === 1 ? '' : 's'}`}
                                onMouseEnter={() => {
                                  if (!isFuture) {
                                    setHoveredHeatmapCell({
                                      dateStr: cellInfo.cellDateStr,
                                      formattedDate: cellInfo.cellDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
                                      count: cellInfo.count,
                                      criticalCount: cellInfo.criticalCount,
                                      warningCount: cellInfo.warningCount,
                                      resolvedCount: cellInfo.resolvedCount,
                                      topThreat: cellInfo.topThreat,
                                      topTarget: cellInfo.topTarget
                                    });
                                  }
                                }}
                                onMouseLeave={() => setHoveredHeatmapCell(null)}
                                onClick={() => {
                                  if (isFuture) return;

                                  if (cellInfo.realEvents.length > 0 || count > 0) {
                                    setSelectedHeatmapDate(cellInfo.cellDateStr);
                                    logTerminal(`Filtered security events to show incidents on ${cellInfo.cellDate.toLocaleDateString()}.`, 'info');
                                    triggerToast(`Filtered date: ${cellInfo.cellDate.toLocaleDateString()}`, 'info');
                                  } else {
                                    triggerToast(`0 logged incidents on ${cellInfo.cellDate.toLocaleDateString()}`, 'info');
                                  }
                                }}
                              >
                                {count > 0 ? count : ''}
                              </div>
                            );
                          })}
                        </div>
                        <div className="font-mono text-secondary text-end px-2 fw-semibold" style={{ width: '40px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {dayName}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Months Legend */}
                  <div className="d-flex justify-content-between mt-3 px-1 font-mono text-secondary small fw-semibold" style={{ width: '92%', fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {months.map((m, idx) => (
                      <span key={idx}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Heatmap Density Scale Legend */}
              <div className="d-flex align-items-center justify-content-between pt-3 mt-3 px-2 flex-wrap gap-2" style={{ borderTop: '1px solid var(--border-color)', fontSize: '11px' }}>
                <span className="text-secondary font-mono">Incident Density:</span>
                <div className="d-flex align-items-center gap-2 font-mono">
                  <span className="text-secondary" style={{ fontSize: '10px' }}>0 Clean</span>
                  <div className="d-flex gap-1 align-items-center">
                    <div style={{ width: '13px', height: '13px', borderRadius: '3px', backgroundColor: theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }} />
                    <div style={{ width: '13px', height: '13px', borderRadius: '3px', backgroundColor: theme === 'light' ? '#d1fae5' : '#064e3b', border: '1px solid rgba(16,185,129,0.35)' }} />
                    <div style={{ width: '13px', height: '13px', borderRadius: '3px', backgroundColor: theme === 'light' ? '#6ee7b7' : '#047857', border: '1px solid #10b981' }} />
                    <div style={{ width: '13px', height: '13px', borderRadius: '3px', backgroundColor: '#10b981', border: '1px solid #34d399' }} />
                    <div style={{ width: '13px', height: '13px', borderRadius: '3px', backgroundColor: '#059669', border: '1.5px solid #34d399', boxShadow: '0 0 6px rgba(16,185,129,0.7)' }} />
                  </div>
                  <span className="text-secondary" style={{ fontSize: '10px' }}>10+ Alert</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Incident Streams */}
          <div className="col-lg-4 col-12">
            <div className="active-threats-card p-4 rounded-4 h-100" style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
            }}>
              <h5 className="mb-3 fw-semibold d-flex align-items-center gap-2 pb-3" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>
                <Siren size={18} className="text-danger" />
                <span>Live Threat Streams</span>
              </h5>
              <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '280px' }}>
                {activeThreats.length === 0 ? (
                  <div className="text-center text-secondary py-5 small">
                    No active threats targeting Mainframe Gateway.
                  </div>
                ) : (
                  activeThreats.map(threat => (
                    <div 
                      key={threat.id} 
                      className="active-threat-item p-3 rounded"
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: 'var(--bg-deep)',
                        border: '1px solid var(--border-color)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => handleInvestigate(threat.id || threat.event_id)}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small font-mono text-danger fw-bold">{threat.source || threat.source_ip}</span>
                        <span className={`badge badge-${(threat.severity || 'LOW').toLowerCase()} xsmall`}>
                          {threat.severity}
                        </span>
                      </div>
                      <div className="small fw-medium" style={{ color: 'var(--text-primary)', fontSize: '12.5px' }}>{threat.name || threat.event_type}</div>
                      <div className="text-secondary xsmall mt-1" style={{ fontSize: '10.5px' }}>Targeting: {threat.target || threat.destination_ip}</div>
                    </div>
                  ))
                )}
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
          <h3 className="d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
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
                    
                    <div className="timeline-card-content" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                      <div className="timeline-card-header d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="font-mono text-secondary small">{evt.time || evt.timestamp}</span>
                          <span className={`badge badge-${(evt.severity || 'LOW').toLowerCase()} xsmall`}>
                            {evt.severity}
                          </span>
                        </div>
                        <span className="xsmall text-secondary">{evt.status === 'RESOLVED' ? 'Resolved' : 'Active'}</span>
                      </div>

                      <h5 className="mb-1 fw-semibold" style={{ color: 'var(--text-primary)' }}>{evt.name || evt.event_type}</h5>
                      <div className="row g-2 mt-2">
                        <div className="col-6">
                          <div className="xsmall text-secondary">SOURCE ADDRESS</div>
                          <div className="small text-info font-mono">{evt.source || evt.source_ip}</div>
                        </div>
                        <div className="col-6">
                          <div className="xsmall text-secondary">TARGET SERVICE</div>
                          <div className="small font-mono" style={{ color: 'var(--text-primary)' }}>{evt.target || evt.destination_ip}</div>
                        </div>
                      </div>

                      <div className="timeline-card-actions mt-3 pt-2 d-flex justify-content-end" style={{ borderTop: '1px solid var(--border-color)' }}>
                        {evt.status !== 'RESOLVED' ? (
                          <div className="d-flex gap-2">
                            <button 
                              className="btn-table-action btn-investigate py-1"
                              onClick={() => handleInvestigate(evt.id || evt.event_id)}
                            >
                              Investigate
                            </button>
                            <button 
                              className="btn-table-action btn-dismiss py-1"
                              onClick={() => handleResolve(evt.id || evt.event_id)}
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
          <h3 className="d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
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
                <div className="small fw-bold" style={{ color: 'var(--text-primary)' }}>Scan Scope: {scanTarget}</div>
                <div className="text-secondary xsmall mt-1">Status: {isScanning ? 'DIAGNOSTICS IN PROGRESS' : 'IDLE'}</div>
              </div>
            </div>
          </div>

          {/* Progress Logs & Summaries */}
          <div className="col-md-6 col-12">
            <div className="scan-audit-card p-4 rounded" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <h5 className="mb-3 fw-semibold" style={{ color: 'var(--text-primary)' }}>Audit Scan Control Center</h5>
              
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

  // --- SUB-RENDER 5: CONTACT US TEAM PANEL ---
  const renderContactUs = () => {
    const teamMembers = [
<<<<<<< HEAD
      {
        name: 'Naveen S',
        role: 'UI/UX Developer',
        email: 'naveen9819687@gmail.com',
        bio: 'Built the auth portal, contact page, and dark mode. Unified and integrated all modular workspaces into the dashboard layout.',
        avatar: 'NS'
=======
      { 
        name: 'Naveen S',            
        role: 'UI/UX Developer',       
        tag: 'Lead Designer',
        category: 'UI/UX',
        email: 'naveen9819687@gmail.com',                  
        bio: 'Designed the overall UI design system, built the auth portal, contact command center, and dark/light mode engine. Unified and integrated all modular SOC workspaces into the dashboard layout.',
        skills: ['UI/UX Design', 'Design System', 'Light/Dark Theme', 'Auth Portal', 'Dashboard Layout'],
        avatar: 'NS', 
        color: '#10b981', 
        index: 0 
>>>>>>> upstream/main
      },
      { 
        name: 'Priyanga C S',        
        role: 'Frontend Developer',    
        tag: 'Events & Filters',
        category: 'Frontend',
        email: 'cspriyanga26@gmail.com',                    
        bio: 'Created the threat events logging table, dynamic search filters, and real-time incident status controls with instant status toggling and badge synchronization.',
        skills: ['Threat Events Log', 'Real-time Filters', 'Incident Status', 'Data Grid', 'Event Search'],
        avatar: 'PC', 
        color: '#3b82f6', 
        index: 1 
      },
      { 
        name: 'Devendhar Reddy',     
        role: 'Frontend Developer',    
        tag: 'Charts & Parsing',
        category: 'Frontend',
        email: 'ndreddy2005@gmail.com',                     
        bio: 'Contributed to frontend chart layouts, telemetry data parsing libraries, responsive grid structure, and interactive visualization controls.',
        skills: ['Chart Layouts', 'Data Parsing', 'Telemetry UI', 'Responsive Grids', 'Chart Integration'],
        avatar: 'DR', 
        color: '#f59e0b', 
        index: 2 
      },
      { 
        name: 'Sahil Kedare',        
        role: 'Frontend Developer',    
        tag: 'Data Visualizations',
        category: 'Frontend',
        email: 'kedaresahil70@gmail.com',                   
        bio: 'Created interactive data visualization charts: Pie chart of severity events, Bar chart of top attack types, and Timeline anomaly trend analytics chart.',
        skills: ['Severity Pie Chart', 'Attack Bar Chart', 'Timeline Trends', 'Chart.js Engine', 'Telemetry Plots'],
        avatar: 'SK', 
        color: '#8b5cf6', 
        index: 3 
      },
      { 
        name: 'Vasavi',              
        role: 'Frontend Developer',    
        tag: 'Search & Filters',
        category: 'Frontend',
        email: 'vasavi.n2004@gmail.com',                    
        bio: 'Designed and implemented interactive search controls and dynamic dropdown filter systems for the real-time analytics data visualization engine.',
        skills: ['Interactive Search', 'Dropdown Controls', 'Filter State Sync', 'Analytics Engine', 'Multi-Param Search'],
        avatar: 'VA', 
        color: '#ec4899', 
        index: 4 
      },
<<<<<<< HEAD
      {
        name: 'LAXMI VYSHNAVVI',
        role: 'Backend Developer',
        email: '324103210088.vyshnavvi@gvpcew.ac.in',
        bio: 'Responsible for backend data cleaning, parsing incoming security logs, and formatting MongoDB documents for telemetry queries.',
        avatar: 'LV'
      }
=======
      { 
        name: 'Vaishnavi S',         
        role: 'Frontend Developer',    
        tag: 'KPI Metrics',
        category: 'Frontend',
        email: 'vaishnavis.dev@gmail.com',                  
        bio: 'Designed and integrated the main KPI metrics widgets (total events, critical threats, active incidents, normal traffic) on the SOC dashboard overview panel.',
        skills: ['KPI Dashboards', 'Telemetry Widgets', 'Threat Counters', 'Real-time Stats', 'Overview Metrics'],
        avatar: 'VS', 
        color: '#06b6d4', 
        index: 5 
      },
      { 
        name: 'LAXMI VYSHNAVVI',     
        role: 'Backend Developer',     
        tag: 'Data Engineering',
        category: 'Backend',
        email: '324103210088.vyshnavvi@gvpcew.ac.in',       
        bio: 'Responsible for backend data engineering, telemetry data cleaning, parsing incoming security logs, and formatting MongoDB documents for high-speed queries.',
        skills: ['Data Pipelines', 'Log Cleaning', 'MongoDB Formatting', 'Data Engineering', 'Telemetry Ingestion'],
        avatar: 'LV', 
        color: '#10b981', 
        index: 6 
      },
      { 
        name: 'Prasanth Gannavarapu',
        role: 'Backend Developer',     
        tag: 'Database Architect',
        category: 'Backend',
        email: 'prasanthgannavarapu20@gmail.com',            
        bio: 'Responsible for database architecture, establishing MongoDB Atlas connections, query performance tuning, and ensuring robust backend data handling.',
        skills: ['MongoDB Atlas', 'Database Architecture', 'Query Optimization', 'Connection Pooling', 'Schema Design'],
        avatar: 'PG', 
        color: '#f97316', 
        index: 7 
      },
      { 
        name: 'Suriyakumar P',       
        role: 'Fullstack Developer',   
        tag: 'API & Auth',
        category: 'Fullstack',
        email: '953623244051@ritrjpm.ac.in',                
        bio: 'Engineered REST API endpoints, handled authentication and session routes, and aligned frontend requests with backend server response schemas.',
        skills: ['REST APIs', 'JWT & Auth Routes', 'Express Handlers', 'Fullstack Integration', 'Payload Validation'],
        avatar: 'SP', 
        color: '#a78bfa', 
        index: 8 
      },
>>>>>>> upstream/main
    ];

    const colorToRgb = (hex) => {
      const map = {
        '#10b981': '16,185,129', '#3b82f6': '59,130,246',
        '#f59e0b': '245,158,11', '#8b5cf6': '139,92,246',
        '#ec4899': '236,72,153', '#06b6d4': '6,182,212',
        '#f97316': '249,115,22', '#a78bfa': '167,139,250',
      };
      return map[hex] || '16,185,129';
    };

    const handleCopyEmail = (email) => {
      navigator.clipboard.writeText(email);
      setCopiedMemberEmail(email);
      triggerToast(`Copied ${email} to clipboard!`, 'success');
      setTimeout(() => {
        setCopiedMemberEmail((prev) => (prev === email ? null : prev));
      }, 2500);
    };

    const filteredMembers = teamMembers.filter((m) => {
      const matchesCategory = 
        teamCategoryFilter === 'ALL' || 
        m.category === teamCategoryFilter ||
        (teamCategoryFilter === 'Frontend' && (m.category === 'Frontend' || m.category === 'UI/UX'));
      
      const q = teamSearchQuery.toLowerCase().trim();
      const matchesQuery = 
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.tag.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.skills.some((s) => s.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });

    return (
      <div className="command-center-container">
        {/* HERO COMMAND BANNER */}
        <div className="cc-hero-banner">
          <div className="cc-hero-grid-bg" />
          <div className="cc-hero-glow-1" />
          <div className="cc-hero-glow-2" />
          <div className="cc-hero-content">
            <div className="cc-badge-row">
              <div className="cc-hero-badge">
                <span className="cc-hero-badge-dot" />
                Team — A &nbsp;·&nbsp; Infosys Internship 2026
              </div>
              <div className="cc-live-tag">
                <Sparkles size={12} className="text-warning" />
                <span>Sprint M2 Verified</span>
              </div>
            </div>

            <h1 className="cc-hero-title">
              Project Command <span className="cc-title-gradient">Center</span>
            </h1>

            <p className="cc-hero-subtitle">
              Meet the 9 developer operations engineers powering the <strong className="cc-hero-highlight">Infosys Threat Detection Suite</strong> — architecting real-time telemetry, advanced AI anomaly analytics, and responsive cybersecurity dashboards.
            </p>

            <div className="cc-quick-stats-pills">
              <span className="cc-quick-stat-pill">
                <Users size={13} style={{ color: '#34d399' }} />
                <span>9 Fullstack & SOC Engineers</span>
              </span>
              <span className="cc-quick-stat-pill">
                <ShieldCheck size={13} style={{ color: '#38bdf8' }} />
                <span>100% Component Coverage</span>
              </span>
              <span className="cc-quick-stat-pill">
                <Server size={13} style={{ color: '#fbbf24' }} />
                <span>Express & MongoDB Pipeline</span>
              </span>
              <span className="cc-quick-stat-pill">
                <Zap size={13} style={{ color: '#c084fc' }} />
                <span>Dual Theme Architecture</span>
              </span>
            </div>
          </div>
        </div>

        {/* HIGH-TECH KPI METRICS STRIP */}
        <div className="cc-kpi-grid">
          <div className="cc-kpi-card">
            <div className="cc-kpi-card-header">
              <span className="cc-kpi-title">Team Composition</span>
              <div className="cc-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <Users size={20} />
              </div>
            </div>
            <div className="cc-kpi-value-row">
              <span className="cc-kpi-val" style={{ color: '#10b981' }}>9</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Engineers</span>
            </div>
            <div className="cc-kpi-subtext">Unified agile dev squad</div>
            <div className="cc-kpi-badge" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              6 Frontend · 2 Backend · 1 Fullstack
            </div>
          </div>

          <div className="cc-kpi-card">
            <div className="cc-kpi-card-header">
              <span className="cc-kpi-title">Current Sprint</span>
              <div className="cc-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="cc-kpi-value-row">
              <span className="cc-kpi-val" style={{ color: '#3b82f6' }}>M2</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sprint Complete</span>
            </div>
            <div className="cc-kpi-subtext">Telemetry & Light Theme</div>
            <div className="cc-kpi-badge" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              Milestone 2 of 3 Verified
            </div>
          </div>

          <div className="cc-kpi-card">
            <div className="cc-kpi-card-header">
              <span className="cc-kpi-title">Frontend Coverage</span>
              <div className="cc-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <Cpu size={20} />
              </div>
            </div>
            <div className="cc-kpi-value-row">
              <span className="cc-kpi-val" style={{ color: '#f59e0b' }}>100%</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Integrated</span>
            </div>
            <div className="cc-kpi-subtext">7 Workspaces & Analytics</div>
            <div className="cc-kpi-badge" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              Responsive & Theme Synced
            </div>
          </div>

          <div className="cc-kpi-card">
            <div className="cc-kpi-card-header">
              <span className="cc-kpi-title">Data Pipeline</span>
              <div className="cc-kpi-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                <Activity size={20} />
              </div>
            </div>
            <div className="cc-kpi-value-row">
              <span className="cc-kpi-val" style={{ color: '#8b5cf6' }}>24/7</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Live Telemetry</span>
            </div>
            <div className="cc-kpi-subtext">MongoDB REST Ingestion</div>
            <div className="cc-kpi-badge" style={{ background: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              AI Anomaly Detection
            </div>
          </div>
        </div>

        {/* INTERACTIVE FILTERS & SEARCH TOOLBAR */}
        <div className="cc-toolbar">
          <div className="cc-filters-group">
            <button 
              className={`cc-filter-pill ${teamCategoryFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setTeamCategoryFilter('ALL')}
            >
              <Users size={13} />
              <span>All Members ({teamMembers.length})</span>
            </button>
            <button 
              className={`cc-filter-pill ${teamCategoryFilter === 'UI/UX' ? 'active' : ''}`}
              onClick={() => setTeamCategoryFilter('UI/UX')}
            >
              <Sparkles size={13} />
              <span>UI/UX & Design (1)</span>
            </button>
            <button 
              className={`cc-filter-pill ${teamCategoryFilter === 'Frontend' ? 'active' : ''}`}
              onClick={() => setTeamCategoryFilter('Frontend')}
            >
              <Code2 size={13} />
              <span>Frontend Core (6)</span>
            </button>
            <button 
              className={`cc-filter-pill ${teamCategoryFilter === 'Backend' ? 'active' : ''}`}
              onClick={() => setTeamCategoryFilter('Backend')}
            >
              <Database size={13} />
              <span>Backend & DB (2)</span>
            </button>
            <button 
              className={`cc-filter-pill ${teamCategoryFilter === 'Fullstack' ? 'active' : ''}`}
              onClick={() => setTeamCategoryFilter('Fullstack')}
            >
              <Layers size={13} />
              <span>Fullstack (1)</span>
            </button>
          </div>

          <div className="cc-search-box">
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by name, role, tag, or skill..." 
              value={teamSearchQuery}
              onChange={(e) => setTeamSearchQuery(e.target.value)}
            />
            {teamSearchQuery && (
              <button 
                onClick={() => setTeamSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: '11px', fontWeight: 700 }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* TEAM MEMBER CARDS GRID */}
        {filteredMembers.length === 0 ? (
          <div className="card-view p-5 text-center">
            <UserCheck size={36} className="text-secondary mb-2" />
            <h5 className="text-white">No team members match "{teamSearchQuery}"</h5>
            <p className="text-secondary small">Try clearing your search query or selecting "All Members".</p>
            <button 
              className="btn btn-sm btn-outline-success mt-2" 
              onClick={() => { setTeamCategoryFilter('ALL'); setTeamSearchQuery(''); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="cc-team-grid">
            {filteredMembers.map((m) => {
              const rgb = colorToRgb(m.color);
              const isCopied = copiedMemberEmail === m.email;

              return (
                <div 
                  key={m.email} 
                  className="cc-member-card"
                  style={{
                    '--card-accent-border': `rgba(${rgb}, 0.35)`,
                    '--card-accent-glow': `rgba(${rgb}, 0.15)`,
                    '--card-accent-subtle': `rgba(${rgb}, 0.12)`,
                    '--card-accent-gradient': `linear-gradient(90deg, ${m.color}, #38bdf8)`,
                  }}
                >
                  <div className="cc-card-top-accent" />
                  <div className="cc-card-glow-mesh" />

                  {/* Header info */}
                  <div className="cc-card-header">
                    <div 
                      className="cc-avatar"
                      style={{
                        background: `linear-gradient(135deg, rgba(${rgb}, 0.22) 0%, rgba(${rgb}, 0.08) 100%)`,
                        borderColor: `rgba(${rgb}, 0.35)`,
                        color: m.color,
                        boxShadow: `0 4px 14px rgba(${rgb}, 0.2)`
                      }}
                    >
                      {m.avatar}
                    </div>

                    <div className="cc-member-headings">
                      <div className="cc-name-row">
                        <h4 className="cc-member-name">{m.name}</h4>
                        <span 
                          className="cc-role-badge"
                          style={{
                            background: `rgba(${rgb}, 0.12)`,
                            color: m.color,
                            borderColor: `rgba(${rgb}, 0.3)`
                          }}
                        >
                          {m.tag}
                        </span>
                      </div>
                      <div className="cc-member-role-title">
                        {m.role}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="cc-member-bio">{m.bio}</p>

                  {/* Contribution chips */}
                  <div className="cc-skills-row">
                    {m.skills.map((skill, idx) => (
                      <span key={idx} className="cc-skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="cc-card-actions">
                    <a 
                      href={`mailto:${m.email}`} 
                      className="cc-email-link"
                      title={`Send email to ${m.name}`}
                    >
                      <Mail size={13} style={{ color: m.color, flexShrink: 0 }} />
                      <span className="cc-email-text">{m.email}</span>
                      <ExternalLink size={11} style={{ marginLeft: 'auto', opacity: 0.5, flexShrink: 0 }} />
                    </a>

                    <button 
                      type="button"
                      className={`cc-copy-btn ${isCopied ? 'copied' : ''}`}
                      onClick={() => handleCopyEmail(m.email)}
                      title={isCopied ? 'Copied!' : 'Copy email address'}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PROJECT ARCHITECTURE & MILESTONE ROADMAP */}
        <div className="cc-architecture-panel">
          <div className="cc-arch-header">
            <div>
              <h3 className="cc-arch-title d-flex align-items-center gap-2">
                <GitBranch size={20} className="text-success" />
                <span>Project Architecture & Milestone Roadmap</span>
              </h3>
              <p className="cc-arch-subtitle">
                Sprint progression, technical stack ecosystem, and engineering milestones delivered for Infosys Internship 2026.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill small fw-semibold">
                Milestone 2 Verified · M3 Ready
              </span>
            </div>
          </div>

          <div className="cc-roadmap-track">
            <div className="cc-milestone-card">
              <div className="cc-milestone-top">
                <span className="cc-milestone-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  MILESTONE 1
                </span>
                <CheckCircle2 size={16} style={{ color: '#10b981' }} />
              </div>
              <h5 className="cc-milestone-name">Core Architecture & Auth</h5>
              <p className="cc-milestone-desc">
                Project initialization, modular SOC dashboard layout, authentication portal, dark mode engine, and component scaffolding.
              </p>
            </div>

            <div className="cc-milestone-card active-sprint">
              <div className="cc-milestone-top">
                <span className="cc-milestone-tag" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                  MILESTONE 2 (CURRENT)
                </span>
                <span className="badge bg-primary text-white px-2 py-0.5" style={{ fontSize: '10px' }}>Active</span>
              </div>
              <h5 className="cc-milestone-name">Telemetry, Analytics & Light Mode</h5>
              <p className="cc-milestone-desc">
                Interactive threat events log, Chart.js trend & attack visualizations, AI anomaly scoring, full light-mode UI overhaul, and SOC investigation drilldown.
              </p>
            </div>

            <div className="cc-milestone-card">
              <div className="cc-milestone-top">
                <span className="cc-milestone-tag" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                  MILESTONE 3
                </span>
                <Award size={16} style={{ color: '#8b5cf6' }} />
              </div>
              <h5 className="cc-milestone-name">Enterprise Hardening & Export</h5>
              <p className="cc-milestone-desc">
                Vulnerability radar sweep, dynamic CSV/PDF report generators, threshold override rules, production build optimization, and SOC evaluator suite.
              </p>
            </div>
          </div>

          <div className="cc-tech-stack-section">
            <div className="cc-tech-title">Technology Stack & Dependencies</div>
            <div className="cc-tech-chips-wrapper">
              <span className="cc-tech-badge"><Code2 size={14} className="text-primary" /> React 19</span>
              <span className="cc-tech-badge"><Zap size={14} className="text-warning" /> Vite 6.2</span>
              <span className="cc-tech-badge"><Server size={14} className="text-success" /> Node.js & Express 4</span>
              <span className="cc-tech-badge"><Database size={14} className="text-info" /> MongoDB Atlas</span>
              <span className="cc-tech-badge"><Activity size={14} className="text-danger" /> Chart.js 4</span>
              <span className="cc-tech-badge"><Shield size={14} className="text-success" /> Lucide Vector Icons</span>
              <span className="cc-tech-badge"><Sliders size={14} className="text-primary" /> CSS3 Design Tokens</span>
              <span className="cc-tech-badge"><Globe size={14} className="text-info" /> REST Telemetry API</span>
            </div>
          </div>
        </div>

        {/* FOOTER BANNER */}
        <div className="cc-footer-banner">
          <div>
            <div className="cc-footer-title">Infosys Threat Detection Suite — Engineering Team A</div>
            <div className="cc-footer-sub">Internship Project &nbsp;·&nbsp; August–September 2026 &nbsp;·&nbsp; Full Stack Telemetry & Cyber Analytics Platform</div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', display: 'inline-block', animation: 'glowPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              System Operational &middot; M2 Complete
            </span>
          </div>
        </div>
      </div>
    );
  };


  // --- SUB-RENDER 5: GLOBAL SETTINGS PANEL ---
  const renderSettings = () => {
    return (
      <section className="settings-section card-view">
        <div className="panel-header mb-4">
          <h3 className="d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Settings className="text-success" />
            <span>Operational & User Settings</span>
          </h3>
          <p className="text-secondary small">Configure operator profiles, visual themes, neural thresholds, and system overrides</p>
        </div>

        <div className="row g-4">
          {/* Row 1: Basic settings (Profile, Theme, Notifications) */}
          <div className="col-12">
            <div className="card-view p-4 rounded-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <h5 className="mb-3 d-flex align-items-center gap-2 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', fontSize: '15px' }}>
                <UserCheck size={16} className="text-success" />
                <span>General Profile & Theme (Basic Settings)</span>
              </h5>
              
              <div className="row g-3 align-items-start">
                {/* Operator Username Change */}
                <div className="col-md-4 col-12">
                  <label className="small fw-medium mb-2 d-block" style={{ color: 'var(--text-primary)' }}>Operator Display Name</label>
                  <input 
                    type="text" 
                    className="w-100"
                    value={currentUser.username}
                    onChange={(e) => setCurrentUser(prev => ({ ...prev, username: e.target.value }))}
                    style={{ 
                      fontSize: '13px', 
                      backgroundColor: 'var(--bg-deep)', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-primary)', 
                      outline: 'none', 
                      padding: '0 12px',
                      height: '37px',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Enter analyst name..."
                  />
                  <span className="text-secondary xsmall mt-1 d-block" style={{ fontSize: '10px' }}>Updates your name shown at the bottom of the sidebar.</span>
                </div>

                {/* Color Theme Switcher — Sliding Pill Toggle */}
                <div className="col-md-4 col-12">
                  <label className="small fw-medium mb-2 d-block" style={{ color: 'var(--text-primary)' }}>Interface Color Theme</label>

                  {/* Pill Track */}
                  <div
                    onClick={toggleTheme}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      backgroundColor: theme === 'dark' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                      border: theme === 'dark'
                        ? '1px solid rgba(16,185,129,0.3)'
                        : '1px solid rgba(245,158,11,0.35)',
                      borderRadius: '50px',
                      padding: '3px',
                      width: '100%',
                      height: '37px',
                      boxSizing: 'border-box',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      userSelect: 'none',
                    }}
                  >
                    {/* Gliding Highlight Pill */}
                    <div style={{
                      position: 'absolute',
                      top: '3px',
                      left: theme === 'dark' ? '3px' : 'calc(50% + 2px)',
                      width: 'calc(50% - 5px)',
                      height: 'calc(100% - 6px)',
                      borderRadius: '46px',
                      background: theme === 'dark'
                        ? 'linear-gradient(135deg, #0d9488, #10b981)'
                        : 'linear-gradient(135deg, #d97706, #f59e0b)',
                      boxShadow: theme === 'dark'
                        ? '0 0 12px rgba(16,185,129,0.4)'
                        : '0 0 12px rgba(245,158,11,0.4)',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      zIndex: 0,
                    }} />

                    {/* Dark Option */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '7px 10px',
                      borderRadius: '46px',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      position: 'relative',
                      zIndex: 1,
                      color: theme === 'dark' ? '#000' : (theme === 'light' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255,255,255,0.4)'),
                      transition: 'color 0.3s ease',
                    }}>
                      <Moon size={13} />
                      Dark
                    </div>

                    {/* Light Option */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '7px 10px',
                      borderRadius: '46px',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      position: 'relative',
                      zIndex: 1,
                      color: theme === 'light' ? '#000' : (theme === 'light' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255,255,255,0.4)'),
                      transition: 'color 0.3s ease',
                    }}>
                      <Sun size={13} />
                      Light
                    </div>
                  </div>

                  <span className="text-secondary mt-1 d-block" style={{ fontSize: '10px' }}>
                    Adjusts visual contrast and colors across all system panels.
                  </span>
                </div>


                {/* HUD notifications toggle */}
                <div className="col-md-4 col-12">
                  <label className="small fw-medium mb-2 d-block" htmlFor="showToastsToggle" style={{ color: 'var(--text-primary)' }}>Incident Pop-ups</label>
                  <div className="d-flex align-items-center justify-content-between"
                    style={{
                      backgroundColor: 'var(--bg-deep)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '0 14px',
                      height: '37px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span className="text-secondary" style={{ fontSize: '12px' }}>Enable overlay alerts</span>
                    <input
                      className="form-check-input ms-0"
                      type="checkbox"
                      role="switch"
                      checked={toastsEnabled}
                      onChange={(e) => {
                        setToastsEnabled(e.target.checked);
                        logTerminal(`Incident pop-up alerts ${e.target.checked ? 'ENABLED' : 'DISABLED'} by operator.`, 'info');
                        triggerToast(`Pop-ups ${e.target.checked ? 'Enabled' : 'Disabled'}`, 'info', true);
                      }}
                      id="showToastsToggle"
                      style={{ width: '2.2em', height: '1.1em', cursor: 'pointer', accentColor: 'var(--accent-mint)', flexShrink: 0, marginBottom: 0 }}
                    />
                  </div>
                  <span className="text-secondary mt-1 d-block" style={{ fontSize: '10px' }}>Show overlay alert toasts on new logs.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 1: Advanced Engine Settings */}
          <div className="col-lg-6 col-12">
            <div className="card-view p-4 rounded-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', height: '100%' }}>
              <h5 className="mb-3 d-flex align-items-center gap-2 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', fontSize: '15px' }}>
                <Cpu size={16} className="text-success" />
                <span>AI Simulation Settings (Advanced)</span>
              </h5>
              
              <div className="mb-4">
                <label className="small fw-medium d-flex justify-content-between mb-2" style={{ color: 'var(--text-primary)' }}>
                  <span>Intrusion Stream Frequency</span>
                  <span className="font-mono text-success fw-bold">{simInterval}s</span>
                </label>
                <input 
                  type="range" 
                  min="3" 
                  max="30" 
                  value={simInterval} 
                  onChange={(e) => setSimInterval(Number(e.target.value))} 
                  className="w-100 accent-success"
                  style={{ accentColor: 'var(--accent-mint)' }}
                />
                <span className="text-secondary xsmall mt-1 d-block" style={{ fontSize: '10px' }}>Adjust how often a new threat or baseline event is simulated.</span>
              </div>

              <div className="mb-4">
                <label className="small fw-medium d-flex justify-content-between mb-2" style={{ color: 'var(--text-primary)' }}>
                  <span>Minimum AI Confidence Trigger</span>
                  <span className="font-mono text-success fw-bold">85%</span>
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="99" 
                  defaultValue="85"
                  className="w-100"
                  style={{ accentColor: 'var(--accent-mint)' }}
                />
                <span className="text-secondary xsmall mt-1 d-block" style={{ fontSize: '10px' }}>Filter simulated alarms below this threshold level.</span>
              </div>

              <div className="mb-3">
                <label className="small fw-medium mb-2 d-block" style={{ color: 'var(--text-primary)' }}>Simulator Severity Target</label>
                <div className="d-flex gap-2">
                  {['ALL', 'CRITICAL', 'WARNING'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSeverityAlertFilter(lvl)}
                      className={`btn btn-sm ${severityAlertFilter === lvl ? 'btn-success' : 'btn-outline-secondary'}`}
                      style={{ fontSize: '12px' }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <span className="text-secondary xsmall mt-2 d-block" style={{ fontSize: '10px' }}>Target simulator outputs to specific severity classes.</span>
              </div>
            </div>
          </div>

          {/* Column 2: Advanced Audio & Accessibility */}
          <div className="col-lg-6 col-12">
            <div className="card-view p-4 rounded-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', height: '100%' }}>
              <h5 className="mb-3 d-flex align-items-center gap-2 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', fontSize: '15px' }}>
                <Sliders size={16} className="text-success" />
                <span>Multi-Sensory Warnings (Advanced)</span>
              </h5>

              <div className="form-check form-switch mb-4 d-flex align-items-center justify-content-between p-0">
                <div>
                  <label className="small fw-semibold d-block" htmlFor="vocalAlertsToggle" style={{ color: 'var(--text-primary)' }}>Synthesized Vocal Alerts</label>
                  <span className="text-secondary xsmall" style={{ fontSize: '10px' }}>Announce incoming critical threats out loud in real-time.</span>
                </div>
                <input 
                  className="form-check-input ms-0" 
                  type="checkbox" 
                  role="switch" 
                  id="vocalAlertsToggle"
                  checked={vocalAlerts}
                  onChange={(e) => setVocalAlerts(e.target.checked)}
                  style={{ width: '2.5em', height: '1.25em', cursor: 'pointer', backgroundColor: vocalAlerts ? 'var(--accent-mint)' : '' }}
                />
              </div>

              <div className="mb-4">
                <label className="small fw-medium d-flex justify-content-between mb-2" style={{ color: 'var(--text-primary)' }}>
                  <span>Warning Chime Tone Volume</span>
                  <span className="font-mono text-secondary">{chimeVolume}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={chimeVolume} 
                  className="w-100" 
                  style={{ accentColor: 'var(--accent-mint)' }}
                  onChange={(e) => {
                    const vol = parseInt(e.target.value);
                    setChimeVolume(vol);
                    try {
                      const ctx = new (window.AudioContext || window.webkitAudioContext)();
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      osc.frequency.setValueAtTime(800, ctx.currentTime);
                      gain.gain.setValueAtTime(0.08 * (vol / 100), ctx.currentTime);
                      osc.start();
                      osc.stop(ctx.currentTime + 0.08);
                    } catch(e) {}
                  }}
                />
                <span className="text-secondary xsmall mt-1 d-block" style={{ fontSize: '10px' }}>Adjust gain limit for system threat oscillators.</span>
              </div>

              <div className="pt-2">
                <h6 className="small fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>System Cache & Factory Overrides</h6>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => {
                      setEvents([]);
                      setStats({
                        totalEvents: 0,
                        anomaliesDetected: 0,
                        normalEvents: 0,
                        highRiskEvents: 0,
                        criticalThreats: 0
                      });
                      logTerminal('Threat logs database wiped clean by Administrator override.', 'warning');
                      triggerToast('Database status wiped!', 'warning');
                    }}
                  >
                    Wipe Logs Cache
                  </button>
                  <button 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      logTerminal('Security tunnel config profiles reset to factory values.', 'info');
                      triggerToast('Configs reset successfully', 'info');
                    }}
                  >
                    Reset Tunnels
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Milestone 3 Dynamic Risk Scoring Factor Weights */}
          <div className="col-12">
            <div className="card-view p-4 rounded-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 flex-wrap gap-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h5 className="m-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-primary)', fontSize: '15px' }}>
                  <Flame size={17} className="text-danger" />
                  <span>Milestone 3 Risk Scoring Engine Weights Configuration</span>
                </h5>
                <button 
                  onClick={() => {
                    setRiskWeights(DEFAULT_RISK_WEIGHTS);
                    logTerminal('Reset Risk Engine weights to 25/25/20/20/10.', 'info');
                    triggerToast('Reset to default weights', 'info');
                  }}
                  className="btn btn-outline-secondary btn-sm py-1 px-3"
                  style={{ fontSize: '11px', borderRadius: '6px' }}
                >
                  Reset Defaults (25% / 25% / 20% / 20% / 10%)
                </button>
              </div>

              <p className="text-secondary small mb-4" style={{ fontSize: '12.5px' }}>
                Tuning these 5 factor weights immediately re-evaluates all security incidents, recomputing the 0–100 Risk Score, severity tiers, and priority order across the entire SOC intelligence matrix.
              </p>

              <div className="row g-4">
                <div className="col-md-2 col-sm-4 col-6">
                  <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
                    <div className="d-flex justify-content-between font-mono small mb-2">
                      <span className="text-secondary">Threat Severity</span>
                      <strong className="text-danger">{Math.round(riskWeights.threatSeverity * 100)}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="5"
                      value={Math.round(riskWeights.threatSeverity * 100)}
                      onChange={(e) => setRiskWeights(prev => ({ ...prev, threatSeverity: Number(e.target.value) / 100 }))}
                      className="w-100" 
                      style={{ accentColor: '#ef4444' }}
                    />
                    <span className="text-secondary xsmall mt-1 d-block" style={{ fontSize: '10px' }}>Default: 25%</span>
                  </div>
                </div>

                <div className="col-md-2 col-sm-4 col-6">
                  <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
                    <div className="d-flex justify-content-between font-mono small mb-2">
                      <span className="text-secondary">ML Confidence</span>
                      <strong className="text-primary">{Math.round(riskWeights.mlConfidence * 100)}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="5"
                      value={Math.round(riskWeights.mlConfidence * 100)}
                      onChange={(e) => setRiskWeights(prev => ({ ...prev, mlConfidence: Number(e.target.value) / 100 }))}
                      className="w-100" 
                      style={{ accentColor: '#3b82f6' }}
                    />
                    <span className="text-secondary xsmall mt-1 d-block" style={{ fontSize: '10px' }}>Default: 25%</span>
                  </div>
                </div>

                <div className="col-md-2 col-sm-4 col-6">
                  <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
                    <div className="d-flex justify-content-between font-mono small mb-2">
                      <span className="text-secondary">Asset Criticality</span>
                      <strong className="text-warning">{Math.round(riskWeights.assetCriticality * 100)}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="5"
                      value={Math.round(riskWeights.assetCriticality * 100)}
                      onChange={(e) => setRiskWeights(prev => ({ ...prev, assetCriticality: Number(e.target.value) / 100 }))}
                      className="w-100" 
                      style={{ accentColor: '#f59e0b' }}
                    />
                    <span className="text-secondary xsmall mt-1 d-block" style={{ fontSize: '10px' }}>Default: 20%</span>
                  </div>
                </div>

                <div className="col-md-2 col-sm-4 col-6">
                  <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
                    <div className="d-flex justify-content-between font-mono small mb-2">
                      <span className="text-secondary">Vulnerability / CVE</span>
                      <strong style={{ color: '#a855f7' }}>{Math.round(riskWeights.vulnerabilityExposure * 100)}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="5"
                      value={Math.round(riskWeights.vulnerabilityExposure * 100)}
                      onChange={(e) => setRiskWeights(prev => ({ ...prev, vulnerabilityExposure: Number(e.target.value) / 100 }))}
                      className="w-100" 
                      style={{ accentColor: '#a855f7' }}
                    />
                    <span className="text-secondary xsmall mt-1 d-block" style={{ fontSize: '10px' }}>Default: 20%</span>
                  </div>
                </div>

                <div className="col-md-2 col-sm-4 col-6">
                  <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
                    <div className="d-flex justify-content-between font-mono small mb-2">
                      <span className="text-secondary">Threat Intel (IOC)</span>
                      <strong className="text-success">{Math.round(riskWeights.threatIntelligence * 100)}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="5"
                      value={Math.round(riskWeights.threatIntelligence * 100)}
                      onChange={(e) => setRiskWeights(prev => ({ ...prev, threatIntelligence: Number(e.target.value) / 100 }))}
                      className="w-100" 
                      style={{ accentColor: '#10b981' }}
                    />
                    <span className="text-secondary xsmall mt-1 d-block" style={{ fontSize: '10px' }}>Default: 10%</span>
                  </div>
                </div>

                <div className="col-md-2 col-sm-4 col-6 d-flex flex-column justify-content-center p-3 rounded-3" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}>
                  <span className="text-secondary xsmall font-mono">Weight Aggregate</span>
                  <span className="font-mono fw-bold text-success fs-5">
                    {Math.round((riskWeights.threatSeverity + riskWeights.mlConfidence + riskWeights.assetCriticality + riskWeights.vulnerabilityExposure + riskWeights.threatIntelligence) * 100)}%
                  </span>
                  <span className="text-secondary xsmall font-mono mt-1">Live Engine Active</span>
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
          <li className={`menu-item ${activePanel === 'Overview' ? 'active' : ''}`} onClick={() => { setActivePanel('Overview'); setInvestigatingEventId(null); setInvestigatingIncidentId(null); }}>
            <a href="#overview" onClick={(e) => e.preventDefault()}>
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Risk Intelligence' ? 'active' : ''}`} onClick={() => { setActivePanel('Risk Intelligence'); setInvestigatingIncidentId(null); setInvestigatingEventId(null); }}>
            <a href="#risk" onClick={(e) => e.preventDefault()}>
              <Flame size={18} className="text-danger" />
              <span>Risk Intelligence</span>
              <span className="badge bg-danger text-white rounded-pill px-1.5 py-0.5" style={{ fontSize: '9px', marginLeft: 'auto' }}>M3</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Security Events' ? 'active' : ''}`} onClick={() => { setActivePanel('Security Events'); setInvestigatingEventId(null); setInvestigatingIncidentId(null); }}>
            <a href="#events" onClick={(e) => e.preventDefault()}>
              <Database size={18} />
              <span>Security Events</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Threat Intelligence' ? 'active' : ''}`} onClick={() => { setActivePanel('Threat Intelligence'); setInvestigatingEventId(null); setInvestigatingIncidentId(null); }}>
            <a href="#intelligence" onClick={(e) => e.preventDefault()}>
              <Map size={18} />
              <span>Threat Intelligence</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Event Investigation' ? 'active' : ''}`} onClick={() => { setActivePanel('Event Investigation'); }}>
            <a href="#investigate" onClick={(e) => e.preventDefault()}>
              <Search size={18} />
              <span>Event Investigation</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Vulnerabilities' ? 'active' : ''}`} onClick={() => { setActivePanel('Vulnerabilities'); setInvestigatingEventId(null); setInvestigatingIncidentId(null); }}>
            <a href="#vulnerabilities" onClick={(e) => e.preventDefault()}>
              <Shield size={18} />
              <span>Vulnerabilities</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Analytics' ? 'active' : ''}`} onClick={() => { setActivePanel('Analytics'); setInvestigatingEventId(null); setInvestigatingIncidentId(null); }}>
            <a href="#analytics" onClick={(e) => e.preventDefault()}>
              <Activity size={18} />
              <span>Analytics</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Contact Us' ? 'active' : ''}`} onClick={() => { setActivePanel('Contact Us'); setInvestigatingEventId(null); setInvestigatingIncidentId(null); }}>
            <a href="#contact" onClick={(e) => e.preventDefault()}>
              <UserCheck size={18} />
              <span>Contact Us</span>
            </a>
          </li>
          <li className={`menu-item ${activePanel === 'Settings' ? 'active' : ''}`} onClick={() => { setActivePanel('Settings'); setInvestigatingEventId(null); setInvestigatingIncidentId(null); }}>
            <a href="#settings" onClick={(e) => e.preventDefault()}>
              <Settings size={18} />
              <span>Settings</span>
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
        {/* Global Threat Live Marquee Ticker */}
        <div className="soc-live-ticker-marquee">
          <div className="ticker-badge">
            <span className="ticker-pulse-dot" />
            <span>LIVE INTEL STREAM</span>
          </div>
          <div className="ticker-content-track">
            <span className="ticker-item">DEFENSE MATRIX ACTIVE</span>
            <span className="ticker-divider">&bull;</span>
            <span className="ticker-item">ISOLATION FOREST ML: 98.4% ACCURACY</span>
            <span className="ticker-divider">&bull;</span>
            <span className="ticker-item">TOTAL EVENTS: {(stats.totalEvents || 0).toLocaleString()}</span>
            <span className="ticker-divider">&bull;</span>
            <span className="ticker-item">ANOMALIES FLAGGED: {(stats.anomaliesDetected || 0).toLocaleString()}</span>
            <span className="ticker-divider">&bull;</span>
            <span className="ticker-item">ZERO-DAY RADAR: NOMINAL</span>
            <span className="ticker-divider">&bull;</span>
            <span className="ticker-item">INFERENCE LATENCY: &lt; 12ms</span>
          </div>
        </div>

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
              <h2 style={{ margin: 0 }} className="d-flex align-items-center gap-2">
                {activePanel === 'Event Investigation' && <Search size={22} className="text-success" />}
                {activePanel === 'Risk Intelligence' && <Flame size={22} className="text-danger" />}
                {activePanel === 'ML Anomalies' && <Cpu size={22} className="text-primary" />}
                {activePanel === 'Overview' && 'Cyber Threat Center'}
                {activePanel === 'Risk Intelligence' && 'Security Intelligence & Threat Prioritization (M3)'}
                {activePanel === 'ML Anomalies' && 'Machine Learning Anomaly Detection (IF_v2)'}
                {activePanel === 'Security Events' && 'Security Events Log'}
                {activePanel === 'Threat Intelligence' && 'Threat Intelligence'}
                {activePanel === 'Event Investigation' && 'Event Investigation'}
                {activePanel === 'Vulnerabilities' && 'Vulnerabilities'}
                {activePanel === 'Analytics' && 'Interactive Engine Analytics'}
                {activePanel === 'Contact Us' && 'Project Command Center'}
                {activePanel === 'Settings' && 'Operational & User Settings'}
              </h2>
              <p style={{ margin: 0 }} className="small">
                {activePanel === 'Overview' && 'Real-time threat monitoring and network visualization terminal'}
                {activePanel === 'Risk Intelligence' && 'Multi-factor risk assessment, CVE vulnerability correlation, attack chain detection, and response recommendations'}
                {activePanel === 'ML Anomalies' && 'Isolation Forest unsupervised anomaly prediction, model performance metrics, and interactive inference simulator'}
                {activePanel === 'Security Events' && 'Database of incoming network logs and alerts'}
                {activePanel === 'Threat Intelligence' && 'Global visualization of attack patterns'}
                {activePanel === 'Event Investigation' && 'Real-time threat telemetry and security risk analytics monitoring'}
                {activePanel === 'Vulnerabilities' && 'Network port audit and risk analysis metrics'}
                {activePanel === 'Analytics' && 'Visual charting of attack trends'}
                {activePanel === 'Contact Us' && 'Meet the developer operations team behind the Infosys Threat Detection Suite'}
                {activePanel === 'Settings' && 'Configure profiles, themes, and thresholds'}
              </p>
            </div>
          </div>

          <div className="system-status d-flex align-items-center gap-2">
            {activePanel === 'Event Investigation' && (
              <div className="d-flex gap-2">
                <button 
                  onClick={() => {
                    logTerminal('Triggered telemetric lookup database validation. Diagnostic tables refreshed.', 'info');
                    triggerToast('Refreshed telemetric dataset', 'info');
                  }} 
                  className="btn btn-sm d-flex align-items-center gap-1.5 text-white border"
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    height: '34px',
                    padding: '0 12px',
                    whiteSpace: 'nowrap',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: '6px'
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Refresh Telemetry</span>
                </button>
                <button 
                  onClick={handleExportCSV} 
                  className="btn btn-success btn-sm d-flex align-items-center gap-1.5 text-white"
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    height: '34px',
                    padding: '0 12px',
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                  title="Export Details to CSV"
                >
                  <Download size={12} />
                  <span>Export CSV</span>
                </button>
                <button 
                  onClick={handleExportPDF} 
                  className="btn btn-sm d-flex align-items-center gap-1.5 text-white"
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    height: '34px',
                    padding: '0 12px',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    color: 'var(--accent-mint)',
                    borderRadius: '6px'
                  }}
                  title="Export Details to PDF"
                >
                  <Download size={12} />
                  <span>Export PDF</span>
                </button>
              </div>
            )}

            {/* Theme Toggle option */}
            {toggleTheme && (
              <button 
                type="button" 
                onClick={toggleTheme} 
                className="btn-theme-toggle-dashboard" 
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  color: 'var(--accent-mint)',
                  borderRadius: '6px',
                  height: '34px',
                  padding: '0 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            )}

            <div className="live-clock">{liveTime}</div>
            <div className="status-badge">
              <span className="status-badge-dot"></span>
              <span>System Secure</span>
            </div>
          </div>
        </header>

        {/* Conditional rendering of panels based on sidebar selection or drilldown */}
        {activePanel === 'Event Investigation' ? (
          <EventDetails 
            event={events.find(e => (e.id || e.event_id) === investigatingEventId) || events[0] || DEFAULT_EVENTS[0]} 
            events={events}
            onSelectEvent={(id) => handleInvestigate(id)}
            theme={theme}
          />
        ) : (
          <>
            {activePanel === 'Overview' && renderOverview()}
            {activePanel === 'Risk Intelligence' && renderRiskIntelligence()}
            {activePanel === 'ML Anomalies' && renderMLAnomalies()}
            {activePanel === 'Security Events' && renderIncidents()}
            {activePanel === 'Threat Intelligence' && renderThreatMap()}
            {activePanel === 'Vulnerabilities' && renderShieldScans()}
            {activePanel === 'Contact Us' && renderContactUs()}
            {activePanel === 'Settings' && renderSettings()}
            {activePanel === 'Analytics' && (
              <>
                {/* KPI Cards Grid */}
                <section className="kpi-grid mb-4">
                  <div className="kpi-card kpi-blue">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Total Events</span>
                      <div className="kpi-icon-circle"><Activity size={18} /></div>
                    </div>
                    <h2 className="kpi-value">{(stats.totalEvents || 0).toLocaleString()}</h2>
                    <span className="kpi-display">Total logged security network events</span>
                  </div>

<<<<<<< HEAD
                  <div className="dropdown-filters d-flex gap-2">
                    <select 
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="filter-select"
                      title="Date"
                    >
                      <option value="ALL">All Dates</option>
                      {uniqueDates.filter(date => date !== 'ALL').map(date => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </select>

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
                      title="IP Address"
                    >
                      <option value="ALL">All IP Addresses</option>
                      {uniqueIpAddresses.filter(ip => ip !== 'ALL').map(ip => (
                        <option key={ip} value={ip}>{ip}</option>
                      ))}
                    </select>
=======
                  <div className="kpi-card kpi-red">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Anomalies Detected</span>
                      <div className="kpi-icon-circle"><ShieldAlert size={18} /></div>
                    </div>
                    <h2 className="kpi-value">{(stats.anomaliesDetected || 0).toLocaleString()}</h2>
                    <span className="kpi-display">Total AI-flagged anomaly logs</span>
>>>>>>> upstream/main
                  </div>

                  <div className="kpi-card kpi-green">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Normal Events</span>
                      <div className="kpi-icon-circle"><ShieldCheck size={18} /></div>
                    </div>
                    <h2 className="kpi-value">{(stats.normalEvents || 0).toLocaleString()}</h2>
                    <span className="kpi-display">Baseline non-threat events</span>
                  </div>

                  <div className="kpi-card kpi-orange">
                    <div className="kpi-card-header">
                      <span className="kpi-title">High-Risk Events</span>
                      <div className="kpi-icon-circle"><AlertTriangle size={18} /></div>
                    </div>
                    <h2 className="kpi-value">{(stats.highRiskEvents || 0).toLocaleString()}</h2>
                    <span className="kpi-display">High-risk warning level classification</span>
                  </div>

                  <div className="kpi-card kpi-purple">
                    <div className="kpi-card-header">
                      <span className="kpi-title">Critical Threats</span>
                      <div className="kpi-icon-circle"><Siren size={18} /></div>
                    </div>
                    <h2 className="kpi-value">{(stats.criticalThreats || 0).toLocaleString()}</h2>
                    <span className="kpi-display">Severe priority exploits flagged</span>
                  </div>
                </section>

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

<<<<<<< HEAD
            <section className="dashboard-charts-wrapper">
              <DashboardCharts 
                events={filteredEvents} 
                theme={theme} 
                searchQuery={searchQuery}
                dateFilter={dateFilter}
                eventTypeFilter={eventTypeFilter}
                ipFilter={ipFilter}
                severityFilter={severityFilter}
              />
            </section>
=======
                <section className="dashboard-charts-wrapper mb-4">
                  <DashboardCharts 
                    events={filteredEvents} 
                    theme={theme} 
                    searchQuery={searchQuery}
                    eventTypeFilter={eventTypeFilter}
                    ipFilter={ipFilter}
                    severityFilter={severityFilter}
                  />
                </section>

                {renderMLAnomalies()}
              </>
            )}
>>>>>>> upstream/main
          </>
        )}
      </main>
    </div>
  );
}
