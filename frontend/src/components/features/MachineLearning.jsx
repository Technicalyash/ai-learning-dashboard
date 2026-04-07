import React, { useState, useEffect } from 'react';
import { analysisAPI, modelAPI } from '../../services/api';
import { BrainCircuit, Play, Zap, CheckCircle2, TrendingUp, Key } from 'lucide-react';

export const MachineLearning = () => {
  const [columns, setColumns] = useState([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [modelData, setModelData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [predictInputs, setPredictInputs] = useState({});
  const [predictionResult, setPredictionResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState(null);

  useEffect(() => {
    const fetchCols = async () => {
      try {
        const res = await analysisAPI.getAnalysis();
        setColumns(res.stats.map(s => s.name));
        if (res.stats.length > 0) setTargetColumn(res.stats[res.stats.length - 1].name);
      } catch (e) {
        setError("Failed to load columns for selection.");
      }
    };
    fetchCols();
  }, []);

  const handleTrain = async () => {
    if (!targetColumn) return;
    setLoading(true);
    setError(null);
    setModelData(null);
    setPredictionResult(null);
    try {
      const data = await modelAPI.trainModel(targetColumn);
      setModelData(data);
      // Initialize predict inputs
      const initialInputs = {};
      data.features.forEach(f => {
        initialInputs[f] = '';
      });
      setPredictInputs(initialInputs);
    } catch (err) {
      setError(err.response?.data?.detail || "Error training model.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, feature) => {
    setPredictInputs({ ...predictInputs, [feature]: e.target.value });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredicting(true);
    setPredictError(null);
    setPredictionResult(null);
    try {
      // Cast numeric strings where possible
      const cleanedInputs = {};
      Object.keys(predictInputs).forEach(k => {
        const val = predictInputs[k];
        cleanedInputs[k] = isNaN(Number(val)) || val === '' ? val : Number(val);
      });
      
      const res = await modelAPI.predict(cleanedInputs);
      setPredictionResult(res);
    } catch (err) {
      setPredictError(err.response?.data?.detail || "Prediction failed.");
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="grid-2">
      <div className="glass-card">
        <h2 className="page-title"><BrainCircuit className="inline-block mr-2" /> Model Training</h2>
        <p className="page-description">Select a target variable to automatically build an ML pipeline.</p>
        
        {error && <div className="alert alert-danger mb-4">{error}</div>}
        
        <div className="form-group">
          <label className="form-label">Target Column to Predict</label>
          <select 
            className="form-select" 
            value={targetColumn} 
            onChange={(e) => setTargetColumn(e.target.value)}
          >
            {columns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <button 
          className="btn btn-primary mt-4 w-full" 
          onClick={handleTrain} 
          disabled={loading || columns.length === 0}
          style={{ width: '100%' }}
        >
          {loading ? "Training Pipeline..." : <><Play size={16} /> Train AutoML Model</>}
        </button>

        {modelData && (
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <h3 className="mb-2" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> Model Trained Successfully
            </h3>
            <ul style={{ listStyle: 'none', gap: '0.5rem', display: 'flex', flexDirection: 'column', fontSize: '0.9rem' }}>
              <li><b>Task Type:</b> <span style={{ textTransform: 'capitalize' }}>{modelData.model_type}</span></li>
              <li><b>{modelData.metric_name}:</b> {(modelData.score * (modelData.metric_name === 'Accuracy' ? 100 : 1)).toFixed(2)}{modelData.metric_name === 'Accuracy' ? '%' : ''}</li>
              <li><b>Feature Count:</b> {modelData.features.length}</li>
            </ul>
          </div>
        )}
      </div>

      <div className="glass-card">
        <h2 className="page-title"><Zap className="inline-block mr-2" /> Dynamic Prediction</h2>
        <p className="page-description">Provide input data below to test the trained model.</p>

        {!modelData ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Train a model first to unlock the prediction interface.
          </div>
        ) : (
          <form onSubmit={handlePredict}>
            <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {modelData.features.map(feature => (
                <div key={feature} className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>{feature}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder={`Enter ${feature}...`}
                    value={predictInputs[feature] || ''}
                    onChange={(e) => handleInputChange(e, feature)}
                    required
                  />
                </div>
              ))}
            </div>
            
            {predictError && <div className="alert alert-danger mt-4 mb-2">{predictError}</div>}
            
            <button 
              type="submit"
              className="btn btn-secondary mt-4" 
              disabled={predicting}
              style={{ width: '100%', borderColor: 'var(--success)', color: 'var(--success)' }}
            >
              {predicting ? "Predicting..." : "Generate Prediction"}
            </button>

            {predictionResult && (
              <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px dashed var(--success)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Predicted Value:</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                  {predictionResult.prediction}
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {modelData && Object.keys(modelData.feature_importances).length > 0 && (
         <div className="glass-card mt-6" style={{ gridColumn: '1 / -1' }}>
            <h3 className="mb-4"><TrendingUp className="inline-block mr-2" size={20} /> Feature Importance Insights</h3>
            <div className="grid-3">
              {Object.entries(modelData.feature_importances).map(([feature, importance], idx) => (
                <div key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid var(--primary)` }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Key size={12} className="inline mr-1" /> {feature}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{(importance * 100).toFixed(1)}% weight</div>
                </div>
              ))}
            </div>
         </div>
      )}
    </div>
  );
};
