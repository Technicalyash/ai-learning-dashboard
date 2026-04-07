import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { DataUpload } from './components/features/DataUpload';
import { DataAnalysis } from './components/features/DataAnalysis';
import { Visualization } from './components/features/Visualization';
import { MachineLearning } from './components/features/MachineLearning';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [datasetInfo, setDatasetInfo] = useState(null);

  const handleUploadSuccess = (data) => {
    setDatasetInfo(data);
    // Auto transition to analysis tab
    setTimeout(() => setActiveTab('analysis'), 1500);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <DataUpload onUploadSuccess={handleUploadSuccess} />;
      case 'analysis':
        return <DataAnalysis />;
      case 'visualization':
        return <Visualization />;
      case 'ml':
        return <MachineLearning />;
      default:
        return <DataUpload />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {renderContent()}
      </div>
    </Layout>
  );
}

export default App;
