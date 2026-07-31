import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, AlertTriangle, Bug, Siren } from 'lucide-react';
import { calculateKPIs } from '../utils/calculateKPIs.js';
import '../styles/KPICards.css';

// Icon mapping dictionary
const ICON_COMPONENTS = {
  Activity: Activity,
  ShieldAlert: ShieldAlert,
  AlertTriangle: AlertTriangle,
  Bug: Bug,
  Siren: Siren,
};

/**
 * KPICards Component
 * Calculates and renders 5 security KPI metrics using Bootstrap 5 grid layout.
 *
 * @param {Object} props
 * @param {Array|string} [props.dataset] Optional dataset array or CSV string passed as prop
 */
export function KPICards({ dataset: propDataset }) {
  const [kpiData, setKpiData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDatasetAndCalculate() {
      try {
        let datasetToUse = propDataset;

        // If dataset prop is not provided or empty, attempt to fetch /final_security_dataset.csv
        if (!datasetToUse) {
          const response = await fetch('/final_security_dataset.csv');
          if (response.ok) {
            datasetToUse = await response.text();
          } else {
            // Fallback to import from src if fetch public path fails
            const module = await import('../data/final_security_dataset.csv?raw').catch(() => null);
            if (module && module.default) {
              datasetToUse = module.default;
            }
          }
        }

        if (isMounted) {
          const calculatedKpis = calculateKPIs(datasetToUse || '');
          setKpiData(calculatedKpis);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error calculating KPI metrics:', err);
        if (isMounted) {
          // Fallback calculation with empty data
          setKpiData(calculateKPIs([]));
          setLoading(false);
        }
      }
    }

    loadDatasetAndCalculate();

    return () => {
      isMounted = false;
    };
  }, [propDataset]);

  if (loading) {
    return (
      <div className="kpi-cards-wrapper text-center py-4">
        <div className="spinner-border text-primary me-2" role="status" style={{ width: '1.5rem', height: '1.5rem' }}>
          <span className="visually-hidden">Loading KPIs...</span>
        </div>
        <span className="text-muted small fw-semibold">Calculating Threat Detection KPIs...</span>
      </div>
    );
  }

  return (
    <div className="kpi-cards-wrapper">
      <div className="row-kpi-grid">
        {kpiData.map((card) => {
          const IconComponent = ICON_COMPONENTS[card.icon] || Activity;

          return (
            <div key={card.id} className="col-kpi-item">
              <div className={`kpi-card ${card.colorClass || ''}`}>
                <div>
                  <div className="kpi-card-header">
                    <h6 className="kpi-title">{card.title}</h6>
                    <div className="kpi-icon-circle" title={card.title}>
                      <IconComponent size={20} strokeWidth={2.2} />
                    </div>
                  </div>

                  <div className="kpi-value-wrapper">
                    <h2 className="kpi-value">
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </h2>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="kpi-display">{card.display}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KPICards;
