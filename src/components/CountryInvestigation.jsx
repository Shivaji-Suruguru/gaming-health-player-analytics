import React, { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { computeCountryDiagnostics } from '../analytics/dataService.js';
import { Globe, Zap, AlertCircle } from 'lucide-react';

export default function CountryInvestigation({ filteredDaily, countryMap }) {
  const [countrySort, setCountrySort] = useState('crashes'); // 'crashes' | 'excess' | 'rate' | 'sessions'

  const countryMetrics = useMemo(() => {
    const list = computeCountryDiagnostics(filteredDaily, countryMap);
    return list.sort((a, b) => {
      if (countrySort === 'rate') return (b.androidCrashRate || 0) - (a.androidCrashRate || 0);
      if (countrySort === 'excess') return (b.potentialExcessCrashes || 0) - (a.potentialExcessCrashes || 0);
      if (countrySort === 'sessions') return (b.androidSessions || 0) - (a.androidSessions || 0);
      return (b.androidCrashes || 0) - (a.androidCrashes || 0);
    });
  }, [filteredDaily, countryMap, countrySort]);

  // Visual: Top 10 Countries by Android Crash Volume with benchmark excess
  const top10 = countryMetrics.slice(0, 10);
  const chartData = {
    labels: top10.map(c => `${c.countryName} (${c.countryCode})`),
    datasets: [
      {
        label: 'Benchmark Android Crashes (Matching iOS Rate)',
        data: top10.map(c => c.expectedAndroidCrashes || 0),
        backgroundColor: 'rgba(0, 86, 179, 0.65)',
        borderRadius: 4,
      },
      {
        label: 'Estimated Excess Android Crashes (Benchmark)',
        data: top10.map(c => c.potentialExcessCrashes || 0),
        backgroundColor: 'rgba(217, 45, 32, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#100F09' } },
      y: {
        stacked: true,
        title: { display: true, text: 'Android Crash Sessions', font: { family: 'Inter', size: 11, weight: 600 }, color: '#5B5B56' },
        ticks: { callback: v => `${(v / 1000).toFixed(0)}k`, font: { family: 'Inter', size: 11 }, color: '#5B5B56' },
        grid: { color: '#E5E7EB' },
      },
    },
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Inter', size: 12, weight: 600 }, color: '#100F09' } },
      tooltip: {
        backgroundColor: '#100F09',
        padding: 10,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y?.toLocaleString()} crashes`,
        },
      },
    },
  };

  return (
    <div>
      {/* Title Row */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Country Investigation & Regional Triage</h1>
          <p className="page-subtitle">
            Differentiating high-volume Western European markets from regional crash-rate outliers across EMEA
          </p>
        </div>
      </div>

      {/* Stacked Chart Card */}
      <div className="lovart-card">
        <div className="card-header-clean">
          <div>
            <h2 className="card-title-main">Top 10 Country Markets: Benchmark Baseline vs. Estimated Excess Crashes</h2>
            <p className="card-subtitle-main">
              Deconstructing total recorded Android crashes into baseline (matching iOS rate) + estimated excess crashes.
            </p>
          </div>
          <div className="segmented-pill-control">
            <button
              className={`segmented-pill-item ${countrySort === 'crashes' ? 'active' : ''}`}
              onClick={() => setCountrySort('crashes')}
            >
              Highest Crashes
            </button>
            <button
              className={`segmented-pill-item ${countrySort === 'excess' ? 'active' : ''}`}
              onClick={() => setCountrySort('excess')}
            >
              Excess Crashes
            </button>
            <button
              className={`segmented-pill-item ${countrySort === 'rate' ? 'active' : ''}`}
              onClick={() => setCountrySort('rate')}
            >
              Highest Rate
            </button>
            <button
              className={`segmented-pill-item ${countrySort === 'sessions' ? 'active' : ''}`}
              onClick={() => setCountrySort('sessions')}
            >
              Session Volume
            </button>
          </div>
        </div>

        <div style={{ height: 320, position: 'relative' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Explanatory Takeaway Card Directly Beneath Visualization */}
        <div className="takeaway-editorial-card">
          <Zap size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div className="takeaway-editorial-content">
            <span className="takeaway-editorial-title">Geographic Prioritization Takeaway:</span>
            • <strong>Priority 1 for Player Volume (Western Europe):</strong> The <strong>United Kingdom (43,579 Android crashes, 19.1k excess)</strong>, 
            <strong> Germany (39,520 crashes, 17.3k excess)</strong>, and <strong>France (36,058 crashes, 15.6k excess)</strong> 
            account for over <strong>119,000 total Android crashes</strong>. Engineering teams should prioritize localized crash logs from these three countries.
            <br />
            • <strong>Priority 2 for Crash Rate (Regional Penetration):</strong> <strong>Spain (0.6864%)</strong>, <strong>Saudi Arabia (0.6871%)</strong>, 
            and <strong>Sweden (0.6854%)</strong> show the highest crash rates, driven by differences in device tier distribution (higher Android budget phone share).
          </div>
        </div>
      </div>

      {/* Country Table */}
      <div className="lovart-card">
        <div className="card-header-clean">
          <div>
            <h2 className="card-title-main">Full 15-Country Performance & Triage Table</h2>
            <p className="card-subtitle-main">
              Comparing Android and iOS metrics across all tracked EMEA territories.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="clean-data-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Subregion</th>
                <th>Android Crash Rate</th>
                <th>iOS Crash Rate</th>
                <th>Platform Gap (pp)</th>
                <th>Ratio</th>
                <th>Android Sessions</th>
                <th>Android Crashes</th>
                <th>Est. Excess Crashes*</th>
                <th>Triage Status</th>
              </tr>
            </thead>
            <tbody>
              {countryMetrics.map((c, idx) => {
                const isPriority1 = idx < 3;
                return (
                  <tr key={c.countryKey}>
                    <td style={{ fontWeight: 600 }}>
                      {c.countryName}{' '}
                      <span style={{ fontSize: 11, color: 'var(--color-secondary)', fontWeight: 400 }}>({c.countryCode})</span>
                    </td>
                    <td>{c.subregion}</td>
                    <td style={{ fontWeight: 700, color: '#0E703A' }}>
                      {c.androidCrashRate != null ? `${(c.androidCrashRate * 100).toFixed(4)}%` : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#0056B3' }}>
                      {c.iosCrashRate != null ? `${(c.iosCrashRate * 100).toFixed(4)}%` : '—'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      +{c.absoluteGapPp?.toFixed(2)} pp
                    </td>
                    <td>
                      <span className="status-pill neutral">{c.ratio?.toFixed(2)}x</span>
                    </td>
                    <td>{c.androidSessions?.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{c.androidCrashes?.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: '#B54708' }}>
                      {c.potentialExcessCrashes?.toLocaleString()}
                    </td>
                    <td>
                      {isPriority1 ? (
                        <span className="status-pill danger">Priority 1 (Volume)</span>
                      ) : (
                        <span className="status-pill neutral">Priority 2 (Monitor)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-secondary)' }}>
          *Est. Excess Crashes: Benchmarking estimate indicating potential excess over comparable iOS baseline. Not confirmed preventable crashes.
        </div>
      </div>
    </div>
  );
}
