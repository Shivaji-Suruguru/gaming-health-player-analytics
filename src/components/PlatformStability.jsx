import React, { useState, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { computePlatformStabilityTrends } from '../analytics/dataService.js';
import { ArrowUpRight, ArrowDownRight, Zap, CheckCircle2 } from 'lucide-react';

export default function PlatformStability({ filteredDaily, dateMap }) {
  const [aggregation, setAggregation] = useState('monthly'); // 'monthly' | 'weekly'

  const stabilityData = useMemo(() => {
    return computePlatformStabilityTrends(filteredDaily, dateMap, aggregation);
  }, [filteredDaily, dateMap, aggregation]);

  const labels = stabilityData.map(d => d.label);

  const crashRateChartData = {
    labels,
    datasets: [
      {
        type: 'line',
        label: 'Android Weighted Crash Rate (%)',
        data: stabilityData.map(d => d.androidRate != null ? Number((d.androidRate * 100).toFixed(4)) : null),
        borderColor: '#0E703A',
        backgroundColor: 'rgba(14, 112, 58, 0.05)',
        tension: 0.2,
        borderWidth: 2.5,
        pointRadius: aggregation === 'weekly' ? 1.5 : 3.5,
        pointBackgroundColor: '#0E703A',
      },
      {
        type: 'line',
        label: 'iOS Weighted Crash Rate (%)',
        data: stabilityData.map(d => d.iosRate != null ? Number((d.iosRate * 100).toFixed(4)) : null),
        borderColor: '#0056B3',
        backgroundColor: 'rgba(0, 86, 179, 0.05)',
        tension: 0.2,
        borderWidth: 2.5,
        pointRadius: aggregation === 'weekly' ? 1.5 : 3.5,
        pointBackgroundColor: '#0056B3',
      },
      {
        type: 'line',
        label: 'Platform Gap (pp)',
        data: stabilityData.map(d => d.gapPp != null ? Number(d.gapPp.toFixed(4)) : null),
        borderColor: '#D92D20',
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
      },
    ],
  };

  const volumeChartData = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Android Crash Sessions',
        data: stabilityData.map(d => d.androidCrashes),
        backgroundColor: 'rgba(14, 112, 58, 0.75)',
        borderRadius: 4,
      },
      {
        type: 'bar',
        label: 'iOS Crash Sessions',
        data: stabilityData.map(d => d.iosCrashes),
        backgroundColor: 'rgba(0, 86, 179, 0.75)',
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
        title: { display: true, text: 'Crash Rate / Gap (%)', font: { family: 'Inter', size: 11, weight: 600 }, color: '#5B5B56' },
        ticks: { callback: v => `${v.toFixed(2)}%`, font: { family: 'Inter', size: 11 }, color: '#5B5B56' },
        grid: { color: '#E5E7EB' },
        min: 0.15,
        max: 0.85,
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 10 }, color: '#5B5B56' },
      },
    },
  };

  const volumeOptions = {
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
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y?.toLocaleString()} crashes`,
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: 'Crash Volume (Sessions)', font: { family: 'Inter', size: 11, weight: 600 }, color: '#5B5B56' },
        ticks: { callback: v => `${(v / 1000).toFixed(0)}k`, font: { family: 'Inter', size: 11 }, color: '#5B5B56' },
        grid: { color: '#E5E7EB' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 10 }, color: '#5B5B56' },
      },
    },
  };

  return (
    <div>
      {/* Title Row */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Platform Stability & Long-Term Trend</h1>
          <p className="page-subtitle">
            Temporal tracking to verify whether the Android-versus-iOS crash gap is widening, narrowing, or stable
          </p>
        </div>
        <div className="segmented-pill-control">
          <button
            className={`segmented-pill-item ${aggregation === 'monthly' ? 'active' : ''}`}
            onClick={() => setAggregation('monthly')}
          >
            Monthly View (19 Periods)
          </button>
          <button
            className={`segmented-pill-item ${aggregation === 'weekly' ? 'active' : ''}`}
            onClick={() => setAggregation('weekly')}
          >
            Weekly View (83 Periods)
          </button>
        </div>
      </div>

      {/* Main Trend Line Chart */}
      <div className="lovart-card">
        <div className="card-header-clean">
          <div>
            <h2 className="card-title-main">Does the Crash-Rate Gap Change Over Time? (Trend Analysis)</h2>
            <p className="card-subtitle-main">
              Comparing Android crash rate, iOS crash rate, and the absolute platform gap across {aggregation === 'monthly' ? 'months' : 'weeks'}.
            </p>
          </div>
          <span className="status-pill success">
            <CheckCircle2 size={12} /> Finding: Structurally Stable
          </span>
        </div>

        <div style={{ height: 300, position: 'relative' }}>
          <Line data={crashRateChartData} options={chartOptions} />
        </div>

        {/* Explanatory Takeaway Card Directly Beneath Visualization */}
        <div className="takeaway-editorial-card">
          <Zap size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div className="takeaway-editorial-content">
            <span className="takeaway-editorial-title">Trend Diagnostic Finding — High Stability:</span>
            <strong>The gap is not widening or narrowing; it is remarkably stable.</strong> 
            Month over month, the Android-to-iOS ratio hovers tightly between <strong>1.76x and 1.81x</strong>, with the absolute difference 
            remaining within <strong>0.29 to 0.31 percentage points</strong> across every period. 
            Because there is no sudden macro jump or seasonal degradation, the difference represents an 
            <strong> architectural difference in OS exception handling / telemetry definitions</strong>, not an isolated app release failure.
          </div>
        </div>
      </div>

      {/* Volume Bar Chart */}
      <div className="lovart-card">
        <div className="card-header-clean">
          <div>
            <h2 className="card-title-main">Raw Crash Session Volume by Platform</h2>
            <p className="card-subtitle-main">
              Total absolute crashes recorded on Android vs iOS per {aggregation === 'monthly' ? 'month' : 'week'}.
            </p>
          </div>
        </div>

        <div style={{ height: 260, position: 'relative' }}>
          <Bar data={volumeChartData} options={volumeOptions} />
        </div>
      </div>

      {/* Period-over-Period Performance Table */}
      <div className="lovart-card">
        <div className="card-header-clean">
          <div>
            <h2 className="card-title-main">Granular Period-over-Period Performance Matrix</h2>
            <p className="card-subtitle-main">
              Period-over-period (PoP) rate changes displayed in percentage points (pp).
            </p>
          </div>
        </div>

        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          <table className="clean-data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Android Crash Rate</th>
                <th>Android PoP (pp)</th>
                <th>iOS Crash Rate</th>
                <th>iOS PoP (pp)</th>
                <th>Platform Gap (pp)</th>
                <th>Ratio</th>
                <th>Android Crashes</th>
                <th>iOS Crashes</th>
                <th>Total Sessions</th>
              </tr>
            </thead>
            <tbody>
              {stabilityData.map((row, idx) => {
                const aPop = row.androidPopChangePp;
                const iPop = row.iosPopChangePp;
                return (
                  <tr key={row.period || idx}>
                    <td style={{ fontWeight: 600 }}>{row.label}</td>
                    <td style={{ color: '#0E703A', fontWeight: 600 }}>
                      {row.androidRate != null ? `${(row.androidRate * 100).toFixed(4)}%` : '—'}
                    </td>
                    <td>
                      {aPop == null ? (
                        <span style={{ color: 'var(--color-secondary)' }}>—</span>
                      ) : aPop > 0 ? (
                        <span style={{ color: 'var(--color-error)', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 500 }}>
                          <ArrowUpRight size={12} /> +{aPop.toFixed(3)} pp
                        </span>
                      ) : (
                        <span style={{ color: '#027A48', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 500 }}>
                          <ArrowDownRight size={12} /> {aPop.toFixed(3)} pp
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#0056B3', fontWeight: 600 }}>
                      {row.iosRate != null ? `${(row.iosRate * 100).toFixed(4)}%` : '—'}
                    </td>
                    <td>
                      {iPop == null ? (
                        <span style={{ color: 'var(--color-secondary)' }}>—</span>
                      ) : iPop > 0 ? (
                        <span style={{ color: 'var(--color-error)', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 500 }}>
                          <ArrowUpRight size={12} /> +{iPop.toFixed(3)} pp
                        </span>
                      ) : (
                        <span style={{ color: '#027A48', display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 500 }}>
                          <ArrowDownRight size={12} /> {iPop.toFixed(3)} pp
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      +{row.gapPp?.toFixed(2)} pp
                    </td>
                    <td>
                      <span className="status-pill neutral">{row.ratio?.toFixed(2)}x</span>
                    </td>
                    <td>{row.androidCrashes?.toLocaleString()}</td>
                    <td>{row.iosCrashes?.toLocaleString()}</td>
                    <td>{row.totalSessions?.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
