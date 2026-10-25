import React from 'react';
import { Activity, ShieldAlert, BarChart3, Globe, Users2, Download, Calendar } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'executive', label: 'Executive', icon: Activity },
    { id: 'stability', label: 'Stability', icon: ShieldAlert },
    { id: 'games', label: 'Games', icon: BarChart3 },
    { id: 'countries', label: 'Countries', icon: Globe },
    { id: 'growth_ab', label: 'Growth & Experiments', icon: Users2 },
  ];

  return (
    <div className="app-header-container">
      <header className="app-navbar">
        {/* Brand Pill */}
        <div className="navbar-brand">
          <span className="brand-pill">G</span>
          <div>
            <span className="brand-text">Gaming Health</span>
            <span style={{ fontSize: 11, color: 'var(--color-secondary)', marginLeft: 6 }}>Analytics</span>
          </div>
        </div>

        {/* Floating Capsule Navigation (Reference Image 1 center menu) */}
        <nav className="nav-capsule">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-capsule-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Pills */}
        <div className="navbar-actions">
          <span className="action-pill-btn" style={{ cursor: 'default' }}>
            <Calendar size={13} color="var(--color-secondary)" />
            <span>572 Days</span>
          </span>
          <a
            href="/csv/fact_game_daily.csv"
            download
            className="action-pill-btn"
            title="Download source telemetry CSV files"
          >
            <Download size={13} />
            <span>Raw CSV</span>
          </a>
        </div>
      </header>
    </div>
  );
}
