import React, { useState, useEffect } from 'react';
import { analysisAPI } from '../../services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const DataAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analysisAPI.getAnalysis();
      setData(result);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load analysis. Make sure a dataset is uploaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  if (loading) {
    return <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>Loading analysis...</div>;
  }

  if (error) {
    return (
      <div className="glass-card">
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
        <button className="btn btn-primary" onClick={fetchAnalysis}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="page-title">Dataset Analysis</h2>
          <p className="page-description" style={{ marginBottom: 0 }}>Basic statistical properties and column data types.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAnalysis}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Feature Name</th>
              <th>Type</th>
              <th>Missing (%)</th>
              <th>Unique Vals</th>
              <th>Mean</th>
              <th>Median</th>
              <th>Std Dev</th>
            </tr>
          </thead>
          <tbody>
            {data.stats.map((stat, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{stat.name}</td>
                <td>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem',
                    backgroundColor: stat.col_type === 'numeric' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: stat.col_type === 'numeric' ? '#818cf8' : '#34d399'
                  }}>
                    {stat.col_type}
                  </span>
                </td>
                <td style={{ color: stat.missing_count > 0 ? 'var(--warning)' : 'inherit' }}>
                  {stat.missing_count} ({stat.missing_percent.toFixed(1)}%)
                </td>
                <td>{stat.unique_values}</td>
                <td>{stat.mean !== null ? stat.mean.toFixed(2) : '-'}</td>
                <td>{stat.median !== null ? stat.median.toFixed(2) : '-'}</td>
                <td>{stat.std !== null ? stat.std.toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
