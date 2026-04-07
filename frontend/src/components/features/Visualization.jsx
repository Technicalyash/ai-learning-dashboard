import React, { useState, useEffect } from 'react';
import { analysisAPI, uploadAPI } from '../../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';

export const Visualization = () => {
  const [data, setData] = useState(null);
  const [headData, setHeadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [analysisRes, infoRes] = await Promise.all([
          analysisAPI.getAnalysis(),
          uploadAPI.getInfo()
        ]);
        setData(analysisRes);
        setHeadData(infoRes.head || []);
      } catch (err) {
        setError("Failed to load visualization data. Please ensure a dataset is uploaded.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>Generating visuals...</div>;
  if (error) return <div className="glass-card"><div className="alert alert-danger"><AlertCircle size={18} /><span>{error}</span></div></div>;

  const numericCols = data.stats.filter(s => s.col_type === 'numeric').map(s => s.name);
  const catCols = data.stats.filter(s => s.col_type === 'categorical').map(s => s.name);

  return (
    <div className="grid-2">
      <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
        <h2 className="page-title">Correlation Heatmap</h2>
        <p className="page-description">Numeric correlation between continuous variables.</p>
        <div className="data-table-container">
          <table className="data-table" style={{ textAlign: 'center' }}>
            <thead>
              <tr>
                <th></th>
                {numericCols.map(c => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {numericCols.map(rowCol => (
                <tr key={rowCol}>
                  <td style={{ fontWeight: 500, textAlign: 'left' }}>{rowCol}</td>
                  {numericCols.map(col => {
                    const val = data.correlation_matrix?.[rowCol]?.[col];
                    const numVal = val !== null && val !== undefined ? Number(val) : 0;
                    const opacity = Math.abs(numVal);
                    const color = numVal > 0 ? `rgba(99, 102, 241, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
                    return (
                      <td key={col} style={{ backgroundColor: val !== null ? color : 'transparent', color: opacity > 0.5 ? '#fff' : 'inherit' }}>
                        {val !== null ? numVal.toFixed(2) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {numericCols.length >= 2 && headData.length > 0 && (
        <>
          <div className="glass-card">
            <h3 className="mb-4">Trend Line Chart (Sample Data)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={headData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey={catCols[0] || numericCols[0]} stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)' }} />
                  <Legend />
                  <Line type="monotone" dataKey={numericCols[0]} stroke="var(--primary)" strokeWidth={2} />
                  <Line type="monotone" dataKey={numericCols[1]} stroke="var(--success)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="glass-card">
            <h3 className="mb-4">Bar Distribution (Sample Data)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={headData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey={catCols[0] || numericCols[0]} stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)' }} />
                  <Legend />
                  <Bar dataKey={numericCols[0]} fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
