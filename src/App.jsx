import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.jsx';
import FilterBar from './components/FilterBar.jsx';
import ExecutiveOverview from './components/ExecutiveOverview.jsx';
import PlatformStability from './components/PlatformStability.jsx';
import GameDiagnostics from './components/GameDiagnostics.jsx';
import CountryInvestigation from './components/CountryInvestigation.jsx';
import PlayerGrowthExperiments from './components/PlayerGrowthExperiments.jsx';
import { loadAnalyticsData, filterDailyFacts, computeExecutiveOverview } from './analytics/dataService.js';
import { AlertCircle, Database } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('executive');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [dataset, setDataset] = useState(null);

  // Global filters
  const [filters, setFilters] = useState({
    gameKey: 'ALL',
    countryKey: 'ALL',
    platformKey: 'ALL',
    dateRange: 'ALL',
  });

  // Load analytics datasets on mount
  useEffect(() => {
    loadAnalyticsData()
      .then(data => {
        setDataset(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dataset:', err);
        setLoadError(err.message || 'Error loading analytics dataset');
        setIsLoading(false);
      });
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      gameKey: 'ALL',
      countryKey: 'ALL',
      platformKey: 'ALL',
      dateRange: 'ALL',
    });
  };

  // Filter daily facts based on current filter selections
  const filteredDaily = useMemo(() => {
    if (!dataset) return [];
    return filterDailyFacts(dataset.rawDaily, filters, dataset.dateMap);
  }, [dataset, filters]);

  // Executive Overview calculated model
  const executiveData = useMemo(() => {
    if (!dataset || filteredDaily.length === 0) return null;
    return computeExecutiveOverview(filteredDaily, dataset.rawDaily, filters, dataset.dateMap);
  }, [dataset, filteredDaily, filters]);

  if (isLoading) {
    return (
      <div>
        <div className="lovart-banner">
          <div>
            <span className="banner-badge">PORTFOLIO DEMO</span>
            Gaming Health & Player Analytics • Synthetic Multi-Game Telemetry Dataset
          </div>
        </div>
        <div className="state-container" style={{ minHeight: '80vh' }}>
          <div className="spinner"></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
            Ingesting Analytical Warehouse...
          </h2>
          <p style={{ color: 'var(--color-secondary)', fontSize: 13, maxWidth: 450 }}>
            Parsing 120,120 daily records, 27,930 monthly cohort entries, and 42 experimentation logs into memory.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="state-container" style={{ minHeight: '80vh' }}>
        <AlertCircle size={40} color="var(--color-error)" style={{ marginBottom: 12 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-error)' }}>Data Loading Failure</h2>
        <p style={{ color: 'var(--color-secondary)', marginTop: 8 }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Lovart Accent Banner */}
      <div className="lovart-banner">
        <div>
          <span className="banner-badge">PORTFOLIO PROJECT</span>
          This portfolio project uses synthetic data generated for a Zynga-inspired gaming analytics case study. The figures are simulated and do not represent Zynga's actual internal performance.
        </div>
        <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Database size={13} />
          <span>120k Facts • 28k Cohorts • 42 Experiments</span>
        </div>
      </div>

      {/* Main Header & Floating Capsule Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Dashboard Canvas */}
      <main className="dashboard-content">
        {/* Compact Filter Capsule */}
        <FilterBar
          dimensions={dataset.dimensions}
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {filteredDaily.length === 0 ? (
          <div className="lovart-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <AlertCircle size={32} color="var(--color-secondary)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No Data for Selected Filter Criteria</h3>
            <p style={{ color: 'var(--color-secondary)', fontSize: 13, marginBottom: 16 }}>
              No recorded daily gameplay sessions match this combination of game, country, platform, and date range.
            </p>
            <button className="action-pill-btn" onClick={handleResetFilters} style={{ margin: '0 auto' }}>
              Reset Filters to All
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'executive' && executiveData && (
              <ExecutiveOverview data={executiveData} filters={filters} dataset={dataset} />
            )}

            {activeTab === 'stability' && (
              <PlatformStability filteredDaily={filteredDaily} dateMap={dataset.dateMap} />
            )}

            {activeTab === 'games' && (
              <GameDiagnostics filteredDaily={filteredDaily} gameMap={dataset.gameMap} />
            )}

            {activeTab === 'countries' && (
              <CountryInvestigation filteredDaily={filteredDaily} countryMap={dataset.countryMap} />
            )}

            {activeTab === 'growth_ab' && (
              <PlayerGrowthExperiments
                rawCohorts={dataset.rawCohorts}
                rawAbTests={dataset.rawAbTests}
                filters={filters}
                dataset={dataset}
              />
            )}
          </>
        )}
      </main>

      {/* Dedicated Legal & Portfolio Disclaimer Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        padding: '24px 32px',
        fontSize: '12px',
        color: 'var(--color-secondary)',
        lineHeight: 1.6,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: 4 }}>
            Synthetic Data Notice
          </p>
          <p>
            This portfolio project uses synthetic data generated for a Zynga-inspired gaming analytics case study. The figures are simulated and do not represent Zynga's actual internal performance.
          </p>
          <p style={{ marginTop: 6, fontSize: '11px', color: 'var(--color-secondary)' }}>
            Architecture: React 19 • Vite • Chart.js • Inter Typography • Lovart Light Design System • Zero Live Server Dependencies
          </p>
        </div>
      </footer>
    </div>
  );
}
