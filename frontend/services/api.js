/**
 * API Service Layer for SOC Threat Detection Dashboard
 * Calls backend endpoints:
 *   - GET /events
 *   - GET /stats
 *   - GET /threats
 * 
 * If endpoints fail (e.g. backend is not running), falls back gracefully
 * by fetching and parsing the local CSV dataset.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper to parse CSV data into structured objects
function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];
  
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  // Extract header row and clean quote signs
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Standard CSV split with quotes handle
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

    const record = {};
    headers.forEach((header, index) => {
      // Map properties gracefully
      let val = values[index] !== undefined ? values[index] : '';
      record[header] = val;
    });

    // Provide default mappings to match expected properties
    record.time = record.timestamp || record.time || '12:00:00';
    record.name = record.event_type || record.name || 'Unknown Incident';
    record.source = record.source_ip || record.source || '0.0.0.0';
    record.target = record.destination_ip || record.target || 'Internal Host';
    record.severity = (record.severity || 'LOW').toUpperCase();
    
    // Status mapping
    if (!record.status) {
      const isHighRisk = record.is_high_risk;
      const parsedHighRisk = (isHighRisk === true || isHighRisk === 'true' || isHighRisk === '1' || isHighRisk === 'yes');
      record.status = parsedHighRisk ? 'UNRESOLVED' : 'RESOLVED';
    } else {
      record.status = record.status.toUpperCase();
    }

    rows.push(record);
  }

  return rows;
}

// Fetch local CSV dataset helper
async function fetchLocalCSVFallback() {
  try {
    const response = await fetch('/final_security_dataset.csv');
    if (response.ok) {
      const text = await response.text();
      return parseCSV(text);
    }
  } catch (e) {
    console.warn('Failed to fetch public CSV fallback, trying raw import...', e);
  }

  try {
    // Try raw Vite import query
    const module = await import('../data/final_security_dataset.csv?raw').catch(() => null);
    if (module && module.default) {
      return parseCSV(module.default);
    }
  } catch (e) {
    console.error('Failed to import raw CSV dataset...', e);
  }

  return [];
}

/**
 * Fetch all events (combining remote API and local CSV fallback)
 */
export async function getEvents() {
  try {
    const response = await fetch(`${API_BASE_URL}/events`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.log('GET /events API failed, falling back to local dataset...');
  }
  return await fetchLocalCSVFallback();
}

/**
 * Fetch statistics summary
 */
export async function getStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.log('GET /stats API failed, falling back to local calculation...');
  }

  const events = await fetchLocalCSVFallback();
  
  const totalEvents = events.length;
  const criticalThreats = events.filter(e => e.severity === 'CRITICAL').length;
  const highSeverityAlerts = events.filter(e => e.severity === 'HIGH').length;
  
  // Vulnerabilities: Count rows with vulnerability_id or CVSS >= 7
  const vulnerabilities = events.filter(e => {
    const vulnId = (e.vulnerability_id || '').toString().trim();
    const cvssScore = parseFloat(e.cvss_score);
    const hasVulnId = vulnId !== '' && vulnId.toLowerCase() !== 'null' && vulnId.toLowerCase() !== 'undefined' && vulnId.toLowerCase() !== 'n/a';
    const isHighCvss = !isNaN(cvssScore) && cvssScore >= 7;
    return hasVulnId || isHighCvss;
  }).length;

  const activeIncidents = events.filter(e => e.status !== 'RESOLVED').length;

  return {
    totalEvents,
    criticalThreats,
    highSeverityAlerts,
    vulnerabilities,
    activeIncidents
  };
}

/**
 * Fetch unresolved threats logs
 */
export async function getThreats() {
  try {
    const response = await fetch(`${API_BASE_URL}/threats`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.log('GET /threats API failed, falling back to local parsing...');
  }

  const events = await fetchLocalCSVFallback();
  return events.filter(e => e.status !== 'RESOLVED');
}
