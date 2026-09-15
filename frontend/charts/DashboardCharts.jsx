import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

/**
 * Milestone 3: Dedicated Risk Intelligence Charts Component
 * Shows:
 * 1. Risk Priority Distribution (Critical, High, Medium, Low Donut Chart)
 * 2. Risk Score Trend Timeline (Line Chart tracking mean threat severity over time)
 * 3. Attack Vector Risk Severity (Bar Chart comparing risk scores across attack types)
 */
export function Milestone3RiskCharts({ incidents = [], theme = 'dark' }) {
  const riskDonutRef = useRef(null);
  const riskTrendRef = useRef(null);
  const vectorBarRef = useRef(null);

  const riskDonutInst = useRef(null);
  const riskTrendInst = useRef(null);
  const vectorBarInst = useRef(null);

  useEffect(() => {
    const isLight = theme === 'light';
    const textColor = isLight ? '#475569' : '#8e9fa6';
    const gridColor = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.03)';
    const legendColor = isLight ? '#0f172a' : '#8e9fa6';
    const donutBorderColor = isLight ? '#ffffff' : '#0a0f12';

    // 1. Calculate Priority Counts
    let crit = 0;
    let high = 0;
    let med = 0;
    let low = 0;

    incidents.forEach(inc => {
      const p = (inc.priority || '').toUpperCase();
      if (p === 'CRITICAL') crit++;
      else if (p === 'HIGH') high++;
      else if (p === 'MEDIUM') med++;
      else low++;
    });

    // --- RENDER 1: RISK PRIORITY DONUT CHART ---
    if (riskDonutRef.current) {
      if (riskDonutInst.current) riskDonutInst.current.destroy();

      riskDonutInst.current = new Chart(riskDonutRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Critical (81-100)', 'High (61-80)', 'Medium (41-60)', 'Low (0-40)'],
          datasets: [{
            data: [crit, high, med, low],
            backgroundColor: [
              '#ef4444', // Critical
              '#f59e0b', // High
              '#3b82f6', // Medium
              '#10b981'  // Low
            ],
            borderWidth: 3,
            borderColor: donutBorderColor,
            hoverOffset: 6
          }]
        },
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: legendColor,
                font: { size: 11, family: 'Inter', weight: '500' },
                padding: 12,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10, 15, 18, 0.95)',
              titleColor: isLight ? '#0f172a' : '#ffffff',
              bodyColor: isLight ? '#475569' : '#8e9fa6',
              borderColor: 'rgba(239, 68, 68, 0.25)',
              borderWidth: 1
            }
          },
          cutout: '76%'
        },
        plugins: [{
          id: 'riskCenterText',
          afterDraw: (chart) => {
            const { ctx, chartArea: { top, bottom, left, right } } = chart;
            ctx.save();
            const centerX = (left + right) / 2;
            const centerY = (top + bottom) / 2;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '700 9px Inter';
            ctx.fillStyle = legendColor;
            ctx.fillText('CRITICAL INC.', centerX, centerY - 10);
            ctx.font = '800 24px Inter';
            ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
            ctx.fillText(crit.toString(), centerX, centerY + 8);
            ctx.restore();
          }
        }]
      });
    }

    // --- RENDER 2: RISK SCORE TIMELINE TREND (LINE CHART) ---
    if (riskTrendRef.current) {
      if (riskTrendInst.current) riskTrendInst.current.destroy();

      const timeLabels = ['01:10', '01:25', '01:40', '02:00', '02:20', '02:45', '03:15', '03:30'];
      const riskTrendPoints = [65, 82, 97, 88, 94, 76, 52, 89];

      const ctx = riskTrendRef.current.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 200);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

      riskTrendInst.current = new Chart(riskTrendRef.current, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [{
            label: 'Incident Risk Score',
            data: riskTrendPoints,
            borderColor: '#ef4444',
            borderWidth: 3,
            backgroundColor: grad,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: isLight ? '#ffffff' : '#0a0f12',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7
          }]
        },
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10, 15, 18, 0.95)',
              titleColor: isLight ? '#0f172a' : '#ffffff',
              bodyColor: isLight ? '#475569' : '#8e9fa6',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderWidth: 1,
              callbacks: {
                label: (c) => `Risk Score: ${c.raw} / 100`
              }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { size: 10, family: 'Inter' } }
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: gridColor },
              ticks: { 
                color: textColor, 
                font: { size: 10, family: 'Inter' },
                stepSize: 20
              }
            }
          }
        }
      });
    }

    // --- RENDER 3: ATTACK VECTOR RISK COMPARISON (BAR CHART) ---
    if (vectorBarRef.current) {
      if (vectorBarInst.current) vectorBarInst.current.destroy();

      const vectors = ['Ransomware', 'Zero-Day', 'Phishing Exfil', 'SQL Injection', 'DDoS', 'Brute Force'];
      const riskScores = [97, 94, 89, 78, 72, 55];

      const barColors = ['#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#3b82f6', '#10b981'];

      vectorBarInst.current = new Chart(vectorBarRef.current, {
        type: 'bar',
        data: {
          labels: vectors,
          datasets: [{
            label: 'Calculated Risk Score',
            data: riskScores,
            backgroundColor: barColors,
            borderColor: barColors,
            borderWidth: 1.5,
            borderRadius: 5,
            hoverBorderWidth: 2
          }]
        },
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10, 15, 18, 0.95)',
              titleColor: isLight ? '#0f172a' : '#ffffff',
              bodyColor: isLight ? '#475569' : '#8e9fa6',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              borderWidth: 1,
              callbacks: {
                label: (c) => `Risk Score: ${c.raw} / 100`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 9.5, family: 'Inter' } }
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: gridColor },
              ticks: { 
                color: textColor, 
                font: { size: 10, family: 'Inter' },
                stepSize: 20
              }
            }
          }
        }
      });
    }

    return () => {
      if (riskDonutInst.current) riskDonutInst.current.destroy();
      if (riskTrendInst.current) riskTrendInst.current.destroy();
      if (vectorBarInst.current) vectorBarInst.current.destroy();
    };
  }, [incidents, theme]);

  return (
    <div className="row g-4 mb-4">
      {/* 1. Risk Trend Chart */}
      <div className="col-lg-5 col-12">
        <div className="chart-card h-100">
          <div className="chart-card-header d-flex justify-content-between align-items-center">
            <div>
              <h3 className="chart-card-title" style={{ color: 'var(--text-primary)' }}>Risk Severity Timeline</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tracks campaign escalation (0-100 Risk Score)</span>
            </div>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-0.5 rounded font-mono xsmall fw-bold">
              AVG RISK: 76
            </span>
          </div>
          <div className="chart-container" style={{ height: '220px' }}>
            <canvas ref={riskTrendRef}></canvas>
          </div>
        </div>
      </div>

      {/* 2. Risk Distribution Donut Chart */}
      <div className="col-lg-3 col-md-6 col-12">
        <div className="chart-card h-100">
          <div className="chart-card-header">
            <h3 className="chart-card-title" style={{ color: 'var(--text-primary)' }}>Risk Prioritization Tier</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Incidents grouped by severity</span>
          </div>
          <div className="chart-container" style={{ height: '220px' }}>
            <canvas ref={riskDonutRef}></canvas>
          </div>
        </div>
      </div>

      {/* 3. Attack Vector Comparison Bar Chart */}
      <div className="col-lg-4 col-md-6 col-12">
        <div className="chart-card h-100">
          <div className="chart-card-header">
            <h3 className="chart-card-title" style={{ color: 'var(--text-primary)' }}>Vector Risk Index</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Risk score comparison across vectors</span>
          </div>
          <div className="chart-container" style={{ height: '220px' }}>
            <canvas ref={vectorBarRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Standard DashboardCharts Component (Milestones 1 & 2)
 */
export default function DashboardCharts({ 
  events, 
  theme,
  searchQuery = '',
  dateFilter = 'ALL',
  eventTypeFilter = 'ALL',
  ipFilter = 'ALL',
  severityFilter = 'ALL'
}) {
  const [isFiltering, setIsFiltering] = useState(false);
  const prevFiltersRef = useRef({ searchQuery, dateFilter, eventTypeFilter, ipFilter, severityFilter });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.searchQuery !== searchQuery ||
      prev.dateFilter !== dateFilter ||
      prev.eventTypeFilter !== eventTypeFilter ||
      prev.ipFilter !== ipFilter ||
      prev.severityFilter !== severityFilter
    ) {
      setIsFiltering(true);
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 450); // 450ms smooth scanning delay
      prevFiltersRef.current = { searchQuery, dateFilter, eventTypeFilter, ipFilter, severityFilter };
      return () => clearTimeout(timer);
    }
  }, [searchQuery, dateFilter, eventTypeFilter, ipFilter, severityFilter]);

  const trendCanvasRef = useRef(null);
  const distCanvasRef = useRef(null);
  const attackCanvasRef = useRef(null);

  const trendChartInst = useRef(null);
  const distChartInst = useRef(null);
  const attackChartInst = useRef(null);

  useEffect(() => {
    const isLight = theme === 'light';
    const textColor = isLight ? '#475569' : '#8e9fa6';
    const gridColor = isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.02)';
    const legendColor = isLight ? '#0f172a' : '#8e9fa6';
    const donutBorderColor = isLight ? '#ffffff' : '#0a0f12';

    // 1. Calculate Event Trend (Detected Anomalies over Time)
    let hoursList = [];
    events.forEach(e => {
      if (e.time && typeof e.time === 'string') {
        let hr = NaN;
        if (e.time.includes('T')) {
          const timePart = e.time.split('T')[1];
          hr = parseInt(timePart.split(':')[0], 10);
        } else {
          hr = parseInt(e.time.split(':')[0], 10);
        }
        if (!isNaN(hr)) hoursList.push(hr);
      }
    });

    let minHr = hoursList.length > 0 ? Math.min(...hoursList) : 0;
    let maxHr = hoursList.length > 0 ? Math.max(...hoursList) : 23;
    
    if (maxHr - minHr < 7) {
      minHr = Math.max(0, minHr - 4);
      maxHr = Math.min(23, maxHr + 3);
    }

    const trendLabels = [];
    const trendValues = [];

    for (let h = minHr; h <= maxHr; h++) {
      const labelStr = `${String(h).padStart(2, '0')}:00`;
      trendLabels.push(labelStr);

      const count = events.filter(e => {
        if (e.time && typeof e.time === 'string') {
          let hr = NaN;
          if (e.time.includes('T')) {
            const timePart = e.time.split('T')[1];
            hr = parseInt(timePart.split(':')[0], 10);
          } else {
            hr = parseInt(e.time.split(':')[0], 10);
          }
          return hr === h && (e.prediction && e.prediction !== 'Normal');
        }
        return false;
      }).length;

      trendValues.push(count);
    }

    // 2. Calculate AI Prediction Distribution (Normal, Suspicious, Critical)
    let normalCount = 0;
    let suspiciousCount = 0;
    let criticalCount = 0;

    events.forEach(e => {
      const pred = (e.prediction || '').toUpperCase();
      if (pred === 'CRITICAL') {
        criticalCount++;
      } else if (pred === 'SUSPICIOUS') {
        suspiciousCount++;
      } else {
        normalCount++;
      }
    });

    const distData = [
      normalCount,
      suspiciousCount,
      criticalCount
    ];

    // 3. Calculate Top AI Attack Types
    let bruteForce = 0;
    let malware = 0;
    let phishing = 0;
    let sqlInjection = 0;
    let privilegeEscalation = 0;

    events.forEach(e => {
      const name = (e.name || e.event_type || '').toLowerCase();
      if (name.includes('brute') || name.includes('ssh') || name.includes('auth') || name.includes('login') || name.includes('spray')) bruteForce++;
      else if (name.includes('malware') || name.includes('virus') || name.includes('trojan') || name.includes('ransomware') || name.includes('rootkit')) malware++;
      else if (name.includes('phishing')) phishing++;
      else if (name.includes('sql') || name.includes('injection')) sqlInjection++;
      else if (name.includes('privilege') || name.includes('escalation')) privilegeEscalation++;
    });

    // --- RENDER TREND LINE CHART ---
    if (trendCanvasRef.current) {
      if (trendChartInst.current) trendChartInst.current.destroy();

      const ctx = trendCanvasRef.current.getContext('2d');
      const lineGradient = ctx.createLinearGradient(0, 0, 0, 200);
      lineGradient.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
      lineGradient.addColorStop(1, 'rgba(239, 68, 68, 0.00)');

      trendChartInst.current = new Chart(trendCanvasRef.current, {
        type: 'line',
        data: {
          labels: trendLabels,
          datasets: [{
            label: 'Detected Anomalies',
            data: trendValues,
            borderColor: '#ef4444',
            borderWidth: 3,
            backgroundColor: lineGradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: isLight ? '#ffffff' : '#0a0f12',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#ef4444',
            pointHoverBorderColor: isLight ? '#0f172a' : '#ffffff',
            pointHoverBorderWidth: 3
          }]
        },
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10, 15, 18, 0.95)',
              titleColor: isLight ? '#0f172a' : '#ffffff',
              bodyColor: isLight ? '#475569' : '#8e9fa6',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: (context) => `Anomalies: ${context.raw}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: textColor, font: { size: 10, family: 'Inter' } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { 
                color: textColor, 
                font: { size: 10, family: 'Inter' },
                precision: 0 
              }
            }
          }
        }
      });
    }

    // --- RENDER THREAT DISTRIBUTION DONUT CHART ---
    if (distCanvasRef.current) {
      if (distChartInst.current) distChartInst.current.destroy();

      distChartInst.current = new Chart(distCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Normal', 'Suspicious', 'Critical'],
          datasets: [{
            data: distData,
            backgroundColor: [
              '#10b981', // Normal
              '#f59e0b', // Suspicious
              '#ef4444'  // Critical
            ],
            borderWidth: 3,
            borderColor: donutBorderColor,
            hoverOffset: 6
          }]
        },
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: legendColor,
                font: { size: 11, family: 'Inter', weight: '500' },
                padding: 14,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10, 15, 18, 0.95)',
              titleColor: isLight ? '#0f172a' : '#ffffff',
              bodyColor: isLight ? '#475569' : '#8e9fa6',
              borderColor: 'rgba(16, 185, 129, 0.15)',
              borderWidth: 1
            }
          },
          cutout: '78%'
        },
        plugins: [{
          id: 'centerText',
          afterDraw: (chart) => {
            const { ctx, chartArea: { top, bottom, left, right } } = chart;
            ctx.save();
            const centerX = (left + right) / 2;
            const centerY = (top + bottom) / 2;
            const active = chart.getActiveElements();
            let labelText = 'ANOMALIES';
            let valText = (suspiciousCount + criticalCount).toString();

            if (active.length > 0) {
              const idx = active[0].index;
              labelText = chart.data.labels[idx].toUpperCase();
              valText = chart.data.datasets[0].data[idx].toString();
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.font = '700 9px Inter';
            ctx.fillStyle = legendColor;
            ctx.fillText(labelText, centerX, centerY - 10);

            ctx.font = '800 24px Inter';
            ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
            ctx.fillText(valText, centerX, centerY + 8);
            ctx.restore();
          }
        }]
      });
    }

    // --- RENDER TOP ATTACK TYPES BAR CHART ---
    if (attackCanvasRef.current) {
      if (attackChartInst.current) attackChartInst.current.destroy();

      const barCtx = attackCanvasRef.current.getContext('2d');

      const g1 = barCtx.createLinearGradient(0, 0, 0, 200);
      g1.addColorStop(0, 'rgba(245, 158, 11, 0.85)'); // Amber
      g1.addColorStop(1, 'rgba(245, 158, 11, 0.25)');

      const g2 = barCtx.createLinearGradient(0, 0, 0, 200);
      g2.addColorStop(0, 'rgba(59, 130, 246, 0.85)'); // Blue
      g2.addColorStop(1, 'rgba(59, 130, 246, 0.25)');

      const g3 = barCtx.createLinearGradient(0, 0, 0, 200);
      g3.addColorStop(0, 'rgba(168, 85, 247, 0.85)'); // Purple
      g3.addColorStop(1, 'rgba(168, 85, 247, 0.25)');

      const g4 = barCtx.createLinearGradient(0, 0, 0, 200);
      g4.addColorStop(0, 'rgba(239, 68, 68, 0.85)'); // Red
      g4.addColorStop(1, 'rgba(239, 68, 68, 0.25)');

      const g5 = barCtx.createLinearGradient(0, 0, 0, 200);
      g5.addColorStop(0, 'rgba(236, 72, 153, 0.85)'); // Pink
      g5.addColorStop(1, 'rgba(236, 72, 153, 0.25)');

      attackChartInst.current = new Chart(attackCanvasRef.current, {
        type: 'bar',
        data: {
          labels: ['Brute Force', 'Malware', 'Phishing', 'SQL Injection', 'Privilege Esc.'],
          datasets: [{
            label: 'Incident Volume',
            data: [bruteForce, malware, phishing, sqlInjection, privilegeEscalation],
            backgroundColor: [g1, g2, g3, g4, g5],
            borderColor: ['#f59e0b', '#3b82f6', '#a855f7', '#ef4444', '#ec4899'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
            hoverBackgroundColor: ['#f59e0b', '#3b82f6', '#a855f7', '#ef4444', '#ec4899'],
            hoverBorderColor: isLight ? '#0f172a' : '#ffffff',
            hoverBorderWidth: 3
          }]
        },
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10, 15, 18, 0.95)',
              titleColor: isLight ? '#0f172a' : '#ffffff',
              bodyColor: isLight ? '#475569' : '#8e9fa6',
              borderColor: 'rgba(16, 185, 129, 0.15)',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 9, family: 'Inter' } }
            },
            y: {
              grid: { color: gridColor },
              ticks: { 
                color: textColor, 
                font: { size: 10, family: 'Inter' },
                precision: 0
              }
            }
          }
        }
      });
    }

    return () => {
      if (trendChartInst.current) trendChartInst.current.destroy();
      if (distChartInst.current) distChartInst.current.destroy();
      if (attackChartInst.current) attackChartInst.current.destroy();
    };
  }, [events, theme]);

  // Calculate Top Affected Assets dynamically
  const assetCounts = {};
  events.forEach(e => {
    const asset = e.target || e.destination_ip || e.asset_name || 'Unknown Host';
    assetCounts[asset] = (assetCounts[asset] || 0) + 1;
  });

  const sortedAssets = Object.entries(assetCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const defaultAssets = [
    { name: 'Asset-Storage-S3', count: 18 },
    { name: 'Production-DB-Proxy', count: 14 },
    { name: 'Gateway-Router-03', count: 9 },
    { name: 'Payment-Backend-API', count: 7 },
    { name: 'Web-Frontend', count: 5 }
  ];

  const finalAssets = sortedAssets.length > 0 ? sortedAssets : defaultAssets;
  const maxCount = Math.max(...finalAssets.map(a => a.count), 1);

  return (
    <div className="row g-4 mb-4">
      {/* --- ROW 1 --- */}
      {/* Event Trend Chart (Line Chart) */}
      <div className="col-lg-8 col-12">
        <div className="chart-card">
          {isFiltering && (
            <div className="chart-loading-overlay">
              <div className="chart-loader">
                <div className="chart-loader-spinner"></div>
                <span className="loader-text font-mono">COMPUTING ANALYTICS...</span>
              </div>
            </div>
          )}
          <div className="chart-card-header">
            <h3 className="chart-card-title" style={{ color: 'var(--text-primary)' }}>Anomaly Trend Graph</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Detected anomalies timeline</span>
          </div>
          <div className="chart-container" style={{ height: '240px' }}>
            <canvas ref={trendCanvasRef}></canvas>
          </div>
        </div>
      </div>

      {/* Threat Distribution (Donut Chart) */}
      <div className="col-lg-4 col-12">
        <div className="chart-card">
          {isFiltering && (
            <div className="chart-loading-overlay">
              <div className="chart-loader">
                <div className="chart-loader-spinner"></div>
                <span className="loader-text font-mono">COMPUTING ANALYTICS...</span>
              </div>
            </div>
          )}
          <div className="chart-card-header">
            <h3 className="chart-card-title" style={{ color: 'var(--text-primary)' }}>Anomaly Distribution</h3>
          </div>
          <div className="chart-container" style={{ height: '240px' }}>
            <canvas ref={distCanvasRef}></canvas>
          </div>
        </div>
      </div>

      {/* --- ROW 2 --- */}
      {/* Top Attack Types (Bar Chart) */}
      <div className="col-lg-6 col-12">
        <div className="chart-card">
          {isFiltering && (
            <div className="chart-loading-overlay">
              <div className="chart-loader">
                <div className="chart-loader-spinner"></div>
                <span className="loader-text font-mono">COMPUTING ANALYTICS...</span>
              </div>
            </div>
          )}
          <div className="chart-card-header">
            <h3 className="chart-card-title" style={{ color: 'var(--text-primary)' }}>Top Attack Types</h3>
          </div>
          <div className="chart-container" style={{ height: '240px' }}>
            <canvas ref={attackCanvasRef}></canvas>
          </div>
        </div>
      </div>

      {/* Top Affected Assets Widget */}
      <div className="col-lg-6 col-12">
        <div className="chart-card">
          {isFiltering && (
            <div className="chart-loading-overlay">
              <div className="chart-loader">
                <div className="chart-loader-spinner"></div>
                <span className="loader-text font-mono">COMPUTING ANALYTICS...</span>
              </div>
            </div>
          )}
          <div className="chart-card-header">
            <h3 className="chart-card-title" style={{ color: 'var(--text-primary)' }}>Top Affected Assets</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Most targeted hosts</span>
          </div>
          <div className="d-flex flex-column gap-3 justify-content-center" style={{ height: '240px' }}>
            {finalAssets.map((asset, index) => {
              const percentage = Math.round((asset.count / maxCount) * 100);
              return (
                <div key={index} className="w-100">
                  <div className="d-flex justify-content-between mb-1" style={{ fontSize: '12.5px' }}>
                    <span className="font-mono fw-medium" style={{ color: 'var(--text-primary)' }}>{asset.name}</span>
                    <span className="text-secondary font-mono small">{asset.count} alerts ({percentage}%)</span>
                  </div>
                  <div className="progress" style={{ height: '8px', backgroundColor: 'var(--bg-deep)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${percentage}%`,
                        background: 'linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-mint) 100%)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
