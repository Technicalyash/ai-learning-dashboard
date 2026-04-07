import React, { useState } from 'react';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadAPI } from '../../services/api';

export const DataUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await uploadAPI.uploadFile(file);
      setSuccessData(data);
      if (onUploadSuccess) onUploadSuccess(data);
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <h2 className="page-title">Dataset Upload</h2>
      <p className="page-description">Upload a CSV file to begin analysis and machine learning.</p>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successData && (
        <div className="alert alert-success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <CheckCircle2 size={18} />
          <span>Successfully uploaded <b>{successData.filename}</b> with {successData.num_columns} columns and {successData.num_rows} rows.</span>
        </div>
      )}

      <div 
        style={{
          border: '2px dashed var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: 'rgba(0,0,0,0.2)',
          marginBottom: '1.5rem',
          position: 'relative'
        }}
      >
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {file ? <FileSpreadsheet size={48} color="var(--primary)" /> : <UploadIcon size={48} color="var(--text-muted)" />}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
              {file ? file.name : "Click or drag & drop to upload"}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {file ? `${(file.size / 1024).toFixed(2)} KB` : "CSV files only"}
            </p>
          </div>
        </div>
      </div>

      <button 
        className="btn btn-primary" 
        onClick={handleUpload} 
        disabled={!file || loading}
        style={{ width: '100%' }}
      >
        {loading ? "Processing..." : "Upload and Process Dataset"}
      </button>

      {successData && successData.head && (
        <div className="mt-6">
          <h3 className="mb-4">Data Preview</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {successData.columns.map((col, idx) => (
                    <th key={idx}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {successData.head.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {successData.columns.map((col, colIdx) => (
                      <td key={colIdx}>{row[col] !== null ? String(row[col]) : <i>NaN</i>}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
