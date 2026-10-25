import React, { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { computeGameDiagnostics } from '../analytics/dataService.js';
import { Flame, BarChart2, Zap, AlertTriangle } from 'lucide-react';

export default function GameDiagnostics({ filteredDaily, gameMap }) {
  const [sortCriterion, setSortCriterion] = useState('excess'); // 'excess' | 'rate' | 'gap' | 'volume'

  const gameMetrics = useMemo(() => {
    const list = computeGameDiagnostics(filteredDaily, gameMap);
    return list.sort((a, b) => {
      if (sortCriterion === 'rate') return (b.androidCrashRate || 0) - (a.androidCrashRate || 0);
      if (sortCriterion === 'gap') return (b.absoluteGapPp || 0) - (a.absoluteGapPp || 0);
      if (sortCriterion === 'volume') return (b.androidCrashes || 0) - (a.androidCrashes || 0);
      return (b.potentialExcessCrashes || 0) - (a.potentialExcessCrashes || 0);
    });
  }, [filteredDaily, gameMap, sortCriterion]);

  // Grouped Bar Chart of Android vs iOS crash rate by game
  const chartLabels = gameMetrics.map(g => g.gameName);
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Android Crash Rate (%)',
        data: gameMetrics.map(g => g.androidCrashRate != null ? Number((g.androidCrashRate * 100).toFixed(4)) : 0),
        backgroundColor: '#0E703A',
        borderRadius: 4,
      },
      {
        label: 'iOS Crash Rate (%)',
        data: gameMetrics.map(g => g.iosCrashRate != null ? Number((g.iosCrashRate * 100).toFixed(4)) : 0),
        backgroundColor: '#0056B3',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, font: { family: 'Inter', size: 12, weight: 600 }, color: '#100F09' },
      },
      tooltip: {
        backgroundColor: '#100F09',
        padding: 10,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y?.toFixed(4)}%`,
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: 'Weighted Crash Rate (%)', font: { family: 'Inter', size: 11, weight: 600 }, color: '#5B5B56' },
        ticks: { callback: v => `${v.toFixed(2)}%`, font: { family: 'Inter', size: 11 }, color: '#5B5B56' },
        grid: { color: '#E5E7EB' },
        min: 0,
        max: 0.85,
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11, weight: 600 }, color: '#100F09' },
      },
    },
  };

  return (
    <div>
      {/* Title Row */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Game Diagnostics & Prioritization</h1>
          <p className="page-subtitle">
            Isolating code/graphics bottlenecks from player volume drivers across all 7 game titles
          </p>
        </div>
      </div>

      {/* Grouped Bar Chart Card */}
      <div className="lovart-card">
        <div className="card-header-clean">
          <div>
            <h2 className="card-title-main">Which Games Suffer the Worst Crash Rates vs. Largest Gaps?</h2>
            <p className="card-subtitle-main">
              Grouped crash rate comparison for Android vs iOS across titles.
            </p>
          </div>
          <div className="segmented-pill-control">
            <button
              className={`segmented-pill-item ${sortCriterion === 'rate' ? 'active' : ''}`}
              onClick={() => setSortCriterion('rate')}
            >
              Highest Crash Rate
            </button>
            <button
              className={`segmented-pill-item ${sortCriterion === 'gap' ? 'active' : ''}`}
              onClick={() => setSortCriterion('gap')}
            >
              Largest Gap (pp)
            </button>
            <button
              className={`segmented-pill-item ${sortCriterion === 'volume' ? 'active' : ''}`}
              onClick={() => setSortCriterion('volume')}
            >
              Highest Crash Count
            </button>
            <button
              className={`segmented-pill-item ${sortCriterion === 'excess' ? 'active' : ''}`}
              onClick={() => setSortCriterion('excess')}
            >
              Excess Crashes
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
            <span className="takeaway-editorial-title">Critical Analyst Distinction — Rate vs. Volume Leaders:</span>
            Do not confuse the highest crash rate with the highest crash contributor:
            <br />
            • <strong>Rate Leader (Code Defect / GPU Strain):</strong> <strong>Turbo Trail (Racing)</strong> has the highest crash rate on both platforms 
            (<strong>0.7709% on Android</strong> vs 0.4688% on iOS). Its real-time 3D rendering pipeline and physics thread trigger memory allocation crashes on budget Android chipsets.
            <br />
            • <strong>Volume Leader (Player Scale Friction):</strong> <strong>Puzzle Harbor (Puzzle)</strong> generates the most total crashes 
            (<strong>74,097 Android crashes</strong>, generating <strong>33,401 estimated excess crashes</strong>) because of its massive active player volume.
          </div>
        </div>
      </div>

      {/* Diagnostics Table */}
      <div className="lovart-card">
        <div className="card-header-clean">
          <div>
            <h2 className="card-title-main">Game Performance & Engineering Triage Matrix</h2>
            <p className="card-subtitle-main">
              Evaluating all 7 titles across session volumes, platform gaps, and benchmark excess crashes.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="clean-data-table">
            <thead>
              <tr>
                <th>Game Title</th>
                <th>Genre</th>
                <th>Lifecycle</th>
                <th>Android Rate</th>
                <th>iOS Rate</th>
                <th>Platform Gap (pp)</th>
                <th>Ratio</th>
                <th>Android Sessions</th>
                <th>Android Crashes</th>
                <th>Est. Excess Crashes*</th>
                <th>Triage Priority</th>
              </tr>
            </thead>
            <tbody>
              {gameMetrics.map(g => {
                const isRateLeader = g.gameKey === '4';
                const isVolumeLeader = g.gameKey === '1';

                return (
                  <tr key={g.gameKey}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {g.gameName}
                        {isRateLeader && (
                          <span className="status-pill danger" title="Highest Crash Rate">
                            <Flame size={11} style={{ marginRight: 2 }} /> Top Rate
                          </span>
                        )}
                        {isVolumeLeader && (
                          <span className="status-pill warning" title="Highest Crash Volume">
                            <BarChart2 size={11} style={{ marginRight: 2 }} /> Top Volume
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{g.gameGenre}</td>
                    <td>
                      <span className={`status-pill ${g.lifecycleStage === 'Growth' ? 'success' : 'neutral'}`}>
                        {g.lifecycleStage}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0E703A' }}>
                      {g.androidCrashRate != null ? `${(g.androidCrashRate * 100).toFixed(4)}%` : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#0056B3' }}>
                      {g.iosCrashRate != null ? `${(g.iosCrashRate * 100).toFixed(4)}%` : '—'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      +{g.absoluteGapPp?.toFixed(2)} pp
                    </td>
                    <td>
                      <span className="status-pill neutral">{g.ratio?.toFixed(2)}x</span>
                    </td>
                    <td>{g.androidSessions?.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{g.androidCrashes?.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: '#B54708' }}>
                      {g.potentialExcessCrashes?.toLocaleString()}
                    </td>
                    <td>
                      {isRateLeader && (
                        <span style={{ fontSize: 12, color: 'var(--color-error)', fontWeight: 600 }}>
                          Engine & Shader Pipeline Audit
                        </span>
                      )}
                      {isVolumeLeader && (
                        <span style={{ fontSize: 12, color: '#B54708', fontWeight: 600 }}>
                          ANR Telemetry & Western Europe Triage
                        </span>
                      )}
                      {!isRateLeader && !isVolumeLeader && (
                        <span style={{ fontSize: 12, color: 'var(--color-secondary)' }}>
                          Secondary Monitoring
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-secondary)' }}>
          *Est. Excess Crashes: Analytical benchmarking estimate comparing Android crashes against comparable iOS rate. Not confirmed preventable crashes.
        </div>
      </div>
    </div>
  );
}
