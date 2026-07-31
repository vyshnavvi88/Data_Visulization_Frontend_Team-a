/**
 * Helper function to parse CSV string into an array of objects
 * @param {string} csvText
 * @returns {Array<Object>}
 */
function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];
  
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  // Extract header row
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV quoting gracefully
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));

    // Create record object mapping headers to values
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] !== undefined ? values[index] : '';
    });
    rows.push(record);
  }

  return rows;
}

/**
 * Calculates security KPI metrics dynamically from dataset
 * @param {Array<Object>|string} dataset - Array of event objects or raw CSV string
 * @returns {Array<Object>} List of calculated KPI objects with metadata for rendering
 */
export function calculateKPIs(dataset) {
  let rows = [];

  if (typeof dataset === 'string') {
    rows = parseCSV(dataset);
  } else if (Array.isArray(dataset)) {
    rows = dataset;
  }

  // 1. Total Events: Count total number of rows
  const totalEvents = rows.length;

  // 2. Critical Threats: Count rows where severity == "Critical"
  const criticalThreats = rows.filter((row) => {
    const sev = (row.severity || '').toString().trim().toLowerCase();
    return sev === 'critical';
  }).length;

  // 3. High Severity Alerts: Count rows where severity == "High"
  const highSeverityAlerts = rows.filter((row) => {
    const sev = (row.severity || '').toString().trim().toLowerCase();
    return sev === 'high';
  }).length;

  // 4. Vulnerabilities: Count rows where vulnerability_id is NOT empty OR cvss_score >= 7
  const vulnerabilities = rows.filter((row) => {
    const vulnId = (row.vulnerability_id || '').toString().trim();
    const cvssScore = parseFloat(row.cvss_score);
    const hasVulnId = vulnId !== '' && vulnId.toLowerCase() !== 'null' && vulnId.toLowerCase() !== 'undefined' && vulnId.toLowerCase() !== 'n/a';
    const isHighCvss = !isNaN(cvssScore) && cvssScore >= 7;
    return hasVulnId || isHighCvss;
  }).length;

  // 5. Active Incidents: Count rows where is_high_risk == true
  const activeIncidents = rows.filter((row) => {
    const val = row.is_high_risk;
    if (typeof val === 'boolean') return val === true;
    if (typeof val === 'string') {
      const normalized = val.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    if (typeof val === 'number') return val === 1;
    return false;
  }).length;

  // Structured array of KPI Cards configurations
  const kpiList = [
    {
      id: 'kpi-total-events',
      title: 'Total Events',
      value: totalEvents,
      display: 'Total number of security events recorded.',
      icon: 'Activity',
      color: 'blue',
      colorClass: 'kpi-blue',
      bgClass: 'bg-blue-subtle'
    },
    {
      id: 'kpi-critical-threats',
      title: 'Critical Threats',
      value: criticalThreats,
      display: 'Number of critical threats detected.',
      icon: 'ShieldAlert',
      color: 'red',
      colorClass: 'kpi-red',
      bgClass: 'bg-red-subtle'
    },
    {
      id: 'kpi-high-severity',
      title: 'High Severity Alerts',
      value: highSeverityAlerts,
      display: 'Number of high severity alerts.',
      icon: 'AlertTriangle',
      color: 'orange',
      colorClass: 'kpi-orange',
      bgClass: 'bg-orange-subtle'
    },
    {
      id: 'kpi-vulnerabilities',
      title: 'Vulnerabilities',
      value: vulnerabilities,
      display: 'Number of detected vulnerabilities.',
      icon: 'Bug',
      color: 'purple',
      colorClass: 'kpi-purple',
      bgClass: 'bg-purple-subtle'
    },
    {
      id: 'kpi-active-incidents',
      title: 'Active Incidents',
      value: activeIncidents,
      display: 'Number of active high-risk incidents.',
      icon: 'Siren',
      color: 'green',
      colorClass: 'kpi-green',
      bgClass: 'bg-green-subtle'
    }
  ];

  // Attach raw metric numbers to array for convenient programmatic access
  kpiList.metrics = {
    totalEvents,
    criticalThreats,
    highSeverityAlerts,
    vulnerabilities,
    activeIncidents
  };

  return kpiList;
}

export default calculateKPIs;
