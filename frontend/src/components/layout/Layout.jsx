import React from 'react';
import { Upload, PieChart, Activity, BrainCircuit } from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'upload', label: 'Data Upload', icon: <Upload size={20} /> },
    { id: 'analysis', label: 'Analysis', icon: <Activity size={20} /> },
    { id: 'visualization', label: 'Visualization', icon: <PieChart size={20} /> },
    { id: 'ml', label: 'Machine Learning', icon: <BrainCircuit size={20} /> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-title">AI Learning</div>
      <nav>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </div>
        ))}
      </nav>
    </div>
  );
};

export const Layout = ({ activeTab, setActiveTab, children }) => {
  return (
    <div className="layout-wrapper">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
