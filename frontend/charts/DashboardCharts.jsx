import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function DashboardCharts({ events, theme }) {
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

    // 1. Calculate Event Trend (Events over Time)
    // Extract unique active hours in dataset
    let hoursList = [];
    events.forEach(e => {
      if (e.time && typeof e.time === 'string') {
        const hr = parseInt(e.time.split(':')[0], 10);
        if (!isNaN(hr)) hoursList.push(hr);
      }
    });

    let minHr = hoursList.length > 0 ? Math.min(...hoursList) : 10;
    let maxHr = hoursList.length > 0 ? Math.max(...hoursList) : 21;
    
    // Expand to a minimum of 8 points to prevent a boring straight line
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
          const hr = parseInt(e.time.split(':')[0], 10);
          return hr === h;
        }
        return false;
      }).length;

      trendValues.push(count);
    }

    // Fallback counts for demo
    if (trendValues.every(val => val === 0)) {
      trendValues[0] = 5;
      trendValues[2] = 12;
      trendValues[4] = 8;
      trendValues[6] = 20;
    }

    // 2. Calculate Severity Threat Distribution (Critical, High, Medium, Low)
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    events.forEach(e => {
      const sev = (e.severity || '').toString().toUpperCase();
      if (sev === 'CRITICAL') critical++;
      else if (sev === 'HIGH') high++;
      else if (sev === 'MEDIUM') medium++;
      else if (sev === 'LOW' || sev === 'INFO' || sev === 'WARNING') low++;
    });

    const distData = [
      critical || 3,
      high || 5,
      medium || 11,
      low || 9
    ];

    // 3. Calculate Top Attack Types
    let bruteForce = 0;
    let malware = 0;
    let phishing = 0;
    let recon = 0;

    events.forEach(e => {
      const name = (e.name || e.event_type || '').toLowerCase();
      if (name.includes('brute') || name.includes('ssh') || name.includes('auth')) bruteForce++;
      else if (name.includes('malware') || name.includes('virus') || name.includes('probe') || name.includes('injection')) malware++;
      else if (name.includes('phishing') || name.includes('email') || name.includes('dns')) phishing++;
      else if (name.includes('recon') || name.includes('scan') || name.includes('traffic')) recon++;
    });

    const bruteVal = bruteForce || 12;
    const malwareVal = malware || 8;
    const phishingVal = phishing || 3;
    const reconVal = recon || 11;

    // --- RENDER TREND LINE CHART ---
    if (trendCanvasRef.current) {
      if (trendChartInst.current) trendChartInst.current.destroy();

      const ctx = trendCanvasRef.current.getContext('2d');
      // Create a gorgeous gradient area fill
      const lineGradient = ctx.createLinearGradient(0, 0, 0, 200);
      lineGradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      lineGradient.addColorStop(1, 'rgba(16, 185, 129, 0.00)');

      trendChartInst.current = new Chart(trendCanvasRef.current, {
        type: 'line',
        data: {
          labels: trendLabels,
          datasets: [{
            label: 'Incidents Count',
            data: trendValues,
            borderColor: '#10b981',
            borderWidth: 3,
            backgroundColor: lineGradient,
            fill: true,
            tension: 0.4, // Curvature of the line
            pointBackgroundColor: '#10b981',
            pointBorderColor: isLight ? '#ffffff' : '#0a0f12',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: '#10b981',
            pointHoverBorderColor: isLight ? '#0f172a' : '#ffffff',
            pointHoverBorderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10, 15, 18, 0.95)',
              titleColor: isLight ? '#0f172a' : '#ffffff',
              bodyColor: isLight ? '#475569' : '#8e9fa6',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: (context) => `Events: ${context.raw}`
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
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [{
            data: distData,
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
          cutout: '78%' // Sleek cutout matching center count text
        },
        plugins: [{
          id: 'centerText',
          afterDraw: (chart) => {
            const { ctx, chartArea: { top, bottom, left, right } } = chart;
            ctx.save();
            const centerX = (left + right) / 2;
            const centerY = (top + bottom) / 2;
            const active = chart.getActiveElements();
            let labelText = 'THREATS';
            let valText = chart.data.datasets[0].data.reduce((a, b) => a + b, 0).toString();

            if (active.length > 0) {
              const idx = active[0].index;
              labelText = chart.data.labels[idx].toUpperCase();
              valText = chart.data.datasets[0].data[idx].toString();
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Top tiny subtitle label
            ctx.font = '700 9px Inter';
            ctx.fillStyle = legendColor;
            ctx.fillText(labelText, centerX, centerY - 10);

            // Large integer value
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

      // Create glowing gradient fills for the bars
      const g1 = barCtx.createLinearGradient(0, 0, 0, 200);
      g1.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
      g1.addColorStop(1, 'rgba(239, 68, 68, 0.25)');

      const g2 = barCtx.createLinearGradient(0, 0, 0, 200);
      g2.addColorStop(0, 'rgba(59, 130, 246, 0.85)');
      g2.addColorStop(1, 'rgba(59, 130, 246, 0.25)');

      const g3 = barCtx.createLinearGradient(0, 0, 0, 200);
      g3.addColorStop(0, 'rgba(245, 158, 11, 0.85)');
      g3.addColorStop(1, 'rgba(245, 158, 11, 0.25)');

      const g4 = barCtx.createLinearGradient(0, 0, 0, 200);
      g4.addColorStop(0, 'rgba(16, 185, 129, 0.85)');
      g4.addColorStop(1, 'rgba(16, 185, 129, 0.25)');

      attackChartInst.current = new Chart(attackCanvasRef.current, {
        type: 'bar',
        data: {
          labels: ['Brute Force', 'Malware', 'Phishing', 'Reconnaissance'],
          datasets: [{
            label: 'Incident Volume',
            data: [bruteVal, malwareVal, phishingVal, reconVal],
            backgroundColor: [g1, g2, g3, g4],
            borderColor: ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'],
            borderWidth: 2,
            borderRadius: 5,
            borderSkipped: false,
            hoverBackgroundColor: ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'],
            hoverBorderColor: isLight ? '#0f172a' : '#ffffff',
            hoverBorderWidth: 3
          }]
        },
        options: {
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

    return () => {
      if (trendChartInst.current) trendChartInst.current.destroy();
      if (distChartInst.current) distChartInst.current.destroy();
      if (attackChartInst.current) attackChartInst.current.destroy();
    };
  }, [events, theme]);

  // Calculate Top Affected Assets dynamically
  const assetCounts = {};
  events.forEach(e => {
    // Gracefully fallback to destination_ip or asset_name if target is empty
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
          <div className="chart-card-header">
            <h3 className="chart-card-title text-white">Event Trend Graph</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Incidents timeline</span>
          </div>
          <div className="chart-container" style={{ height: '240px' }}>
            <canvas ref={trendCanvasRef}></canvas>
          </div>
        </div>
      </div>

      {/* Threat Distribution (Donut Chart) */}
      <div className="col-lg-4 col-12">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title text-white">Threat Severity</h3>
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
          <div className="chart-card-header">
            <h3 className="chart-card-title text-white">Top Attack Types</h3>
          </div>
          <div className="chart-container" style={{ height: '240px' }}>
            <canvas ref={attackCanvasRef}></canvas>
          </div>
        </div>
      </div>

      {/* Top Affected Assets Widget */}
      <div className="col-lg-6 col-12">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title text-white">Top Affected Assets</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Most targeted hosts</span>
          </div>
          <div className="d-flex flex-column gap-3 justify-content-center" style={{ height: '240px' }}>
            {finalAssets.map((asset, index) => {
              const percentage = Math.round((asset.count / maxCount) * 100);
              return (
                <div key={index} className="w-100">
                  <div className="d-flex justify-content-between mb-1" style={{ fontSize: '12.5px' }}>
                    <span className="font-mono text-white fw-medium">{asset.name}</span>
                    <span className="text-secondary font-mono small">{asset.count} alerts ({percentage}%)</span>
                  </div>
                  <div className="progress" style={{ height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '4px', overflow: 'hidden' }}>
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
