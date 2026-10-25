import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  AlertTriangle,
  Zap,
  ShieldAlert,
  Flame,
  Globe,
  HelpCircle,
  TrendingUp,
  BarChart2
} from 'lucide-react';

export default function ExecutiveOverview({ data, filters, dataset }) {
  const {
    androidRate,
    iosRate,
    overallRate,
    gap,
    excess,
    totalSessions,
    totalCrashes,
    androidSessions,
    androidCrashes,
    iosSessions,
    iosCrashes,
    avgDau,
    monthlySeries = [],
  } = data;

  // Chart configuration with Lovart Light aesthetics
  const chartLabels = monthlySeries.map(m => m.label);
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Android Weighted Crash Rate (%)',
        data: monthlySeries.map(m => m.androidRate),
        borderColor: '#0E703A',
        backgroundColor: 'rgba(14, 112, 58, 0.04)',
        tension: 0.25,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#0E703A',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5,
        fill: false,
      },
      {
        label: 'iOS Weighted Crash Rate (%)',
        data: monthlySeries.map(m => m.iosRate),
        borderColor: '#0056B3',
        backgroundColor: 'rgba(0, 86, 179, 0.04)',
        tension: 0.25,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#0056B3',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5,
        fill: false,
      },
      {
        label: 'Platform Gap (pp)',
        data: monthlySeries.map(m => m.gapPp),
        borderColor: '#D92D20',
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: { family: 'Inter', size: 12, weight: 600 },
          color: '#100F09',
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#100F09',
        titleFont: { family: 'Inter', size: 12, weight: 600 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y?.toFixed(4)}%`,
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Weighted Rate / Gap (%)',
          font: { family: 'Inter', size: 11, weight: 600 },
          color: '#5B5B56',
        },
        ticks: {
          callback: (value) => `${value.toFixed(2)}%`,
          font: { family: 'Inter', size: 11 },
          color: '#5B5B56',
        },
        min: 0.2,
        max: 0.85,
        grid: { color: '#E5E7EB' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 }, color: '#5B5B56' },
      },
    },
  };

  // Quick summary items for split grid
  const keyGameHighlights = [
    { title: 'Turbo Trail', genre: 'Racing', rate: '0.7709%', gap: '+0.30 pp', tag: 'Top Rate Leader', badgeClass: 'danger', excess: '21.9k' },
    { title: 'Puzzle Harbor', genre: 'Puzzle', rate: '0.6735%', gap: '+0.30 pp', tag: 'Top Volume Leader', badgeClass: 'warning', excess: '33.4k' },
    { title: 'Mythic Meadows', genre: 'Merge', rate: '0.6687%', gap: '+0.30 pp', tag: 'High Volume', badgeClass: 'neutral', excess: '29.3k' },
    { title: 'Orbit Tactics', genre: 'Strategy', rate: '0.6702%', gap: '+0.30 pp', tag: 'LiveOps Baseline', badgeClass: 'neutral', excess: '25.6k' },
  ];

  const keyCountryHighlights = [
    { name: 'United Kingdom', code: 'GB', crashes: '43,579', excess: '19,105', rate: '0.6822%', tier: 'Priority 1 (Volume)' },
    { name: 'Germany', code: 'DE', crashes: '39,520', excess: '17,287', rate: '0.6824%', tier: 'Priority 1 (Volume)' },
    { name: 'France', code: 'FR', crashes: '36,058', excess: '15,617', rate: '0.6796%', tier: 'Priority 1 (Volume)' },
    { name: 'Spain', code: 'ES', crashes: '31,092', excess: '13,862', rate: '0.6864%', tier: 'High Rate Outlier' },
  ];

  return (
    <div>
      {/* Title Row (Matching Reference Image 1) */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Executive Stability Overview</h1>
          <p className="page-subtitle">
            Cross-platform crash disparity investigation across 7 game titles and 15 country markets
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="status-pill accent">
            Status: Stable 1.78x Platform Gap
          </span>
        </div>
      </div>

      {/* Top 5 KPI Cards Row (Refined from Reference Image 1) */}
      <div className="kpi-row-grid">
        {/* Main KPI: Platform Gap */}
        <div className="lovart-kpi-card hero-kpi">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Platform Crash Gap</span>
            <div className="kpi-icon-circle" style={{ backgroundColor: 'var(--color-error)' }}>
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="kpi-card-value" style={{ color: 'var(--color-error)' }}>
            +{gap.absoluteGapPp != null ? gap.absoluteGapPp.toFixed(2) : '—'}{' '}
            <span style={{ fontSize: 16, fontWeight: 500 }}>pp</span>
          </div>
          <div className="kpi-card-subtext">
            <span className="status-pill danger">+{gap.relativeDiffPct?.toFixed(1)}% Relative</span>
            <span>(1.78x multiplier)</span>
          </div>
        </div>

        {/* Android Crash Rate */}
        <div className="lovart-kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Android Crash Rate</span>
            <div className="kpi-icon-circle" style={{ backgroundColor: '#0E703A' }}>
              A
            </div>
          </div>
          <div className="kpi-card-value">
            {androidRate != null ? `${(androidRate * 100).toFixed(3)}%` : '—'}
          </div>
          <div className="kpi-card-subtext">
            <span>{androidCrashes?.toLocaleString()} on {androidSessions?.toLocaleString()} sessions</span>
          </div>
        </div>

        {/* iOS Crash Rate */}
        <div className="lovart-kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">iOS Crash Rate</span>
            <div className="kpi-icon-circle" style={{ backgroundColor: '#0056B3' }}>
              iOS
            </div>
          </div>
          <div className="kpi-card-value">
            {iosRate != null ? `${(iosRate * 100).toFixed(3)}%` : '—'}
          </div>
          <div className="kpi-card-subtext">
            <span>{iosCrashes?.toLocaleString()} on {iosSessions?.toLocaleString()} sessions</span>
          </div>
        </div>

        {/* Total Crash Sessions */}
        <div className="lovart-kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Total Crash Sessions</span>
            <div className="kpi-icon-circle">
              <ShieldAlert size={14} />
            </div>
          </div>
          <div className="kpi-card-value">
            {totalCrashes?.toLocaleString()}
          </div>
          <div className="kpi-card-subtext">
            <span>Overall Rate: <strong>{(overallRate * 100).toFixed(3)}%</strong></span>
          </div>
        </div>

        {/* Total Sessions & Average Daily Activity */}
        <div className="lovart-kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Total Sessions & DAU</span>
            <div 
              className="kpi-icon-circle" 
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-primary)' }}
              title="Daily Active Users reflects average daily activity per day across the timeframe; not deduplicated unique players over the full dataset."
            >
              <HelpCircle size={14} />
            </div>
          </div>
          <div className="kpi-card-value">
            {(totalSessions / 1000000).toFixed(1)}M
          </div>
          <div className="kpi-card-subtext">
            <span>Avg Daily Activity: <strong>~{(avgDau / 1000).toFixed(1)}k DAU/day</strong></span>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="lovart-card">
        <div className="card-header-clean">
          <div>
            <h2 className="card-title-main">Android vs. iOS Crash Rate Trajectory (Monthly Comparison)</h2>
            <p className="card-subtitle-main">
              Weighted monthly crash rate across all 572 observation days (`2025-04-01` to `2026-10-24`).
            </p>
          </div>
          <span className="status-pill neutral">19 Monthly Reporting Windows</span>
        </div>

        <div style={{ height: 280, position: 'relative' }}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Explanatory Takeaway Card Directly Beneath Visualization */}
        <div className="takeaway-editorial-card">
          <Zap size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div className="takeaway-editorial-content">
            <span className="takeaway-editorial-title">Analytical Takeaway — Structural Measurement Invariance:</span>
            Android recorded a weighted crash rate of <strong>{(androidRate * 100).toFixed(4)}%</strong> vs. 
            <strong> {(iosRate * 100).toFixed(4)}%</strong> on iOS — a persistent gap of 
            <strong> +{gap.absoluteGapPp?.toFixed(2)} percentage points</strong> (<strong>{gap.ratio?.toFixed(2)}x higher</strong>). 
            This multiplier has stayed within a tight range of <strong>1.76x to 1.81x across every single month</strong>. 
            Benchmarked against the iOS baseline, Android experienced an estimated 
            <strong> {excess.potentialExcessCrashSessions?.toLocaleString()} excess crash sessions</strong>. 
            This structural consistency points to differences in how background ANRs/crashes are reported between Google Play and Apple App Store, 
            rather than a transient software regression.
          </div>
        </div>
      </div>

      {/* Bottom Split Grid (Inspired by Eventos + Ventas in Reference Image 1) */}
      <div className="split-dashboard-grid">
        {/* Left: Game Stability Leaderboard */}
        <div className="lovart-card" style={{ marginBottom: 0 }}>
          <div className="card-header-clean">
            <div>
              <h3 className="card-title-main">Game Stability Leaderboard</h3>
              <p className="card-subtitle-main">Rate vs. volume prioritization across key titles</p>
            </div>
            <span className="status-pill neutral">7 Titles</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="clean-data-table">
              <thead>
                <tr>
                  <th>Game Title</th>
                  <th>Android Rate</th>
                  <th>Platform Gap</th>
                  <th>Est. Excess*</th>
                  <th>Diagnostic Role</th>
                </tr>
              </thead>
              <tbody>
                {keyGameHighlights.map(g => (
                  <tr key={g.title}>
                    <td style={{ fontWeight: 600 }}>
                      {g.title}
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--color-secondary)', fontWeight: 400 }}>
                        {g.genre}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0E703A' }}>{g.rate}</td>
                    <td style={{ fontWeight: 600 }}>{g.gap}</td>
                    <td style={{ fontWeight: 600, color: '#B54708' }}>{g.excess}</td>
                    <td>
                      <span className={`status-pill ${g.badgeClass}`}>
                        {g.tag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Top Country Impact Markets */}
        <div className="lovart-card" style={{ marginBottom: 0 }}>
          <div className="card-header-clean">
            <div>
              <h3 className="card-title-main">Top Country Impact Markets</h3>
              <p className="card-subtitle-main">Volume concentration & excess crash benchmark</p>
            </div>
            <span className="status-pill neutral">EMEA Markets</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="clean-data-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Android Crashes</th>
                  <th>Excess Benchmark*</th>
                  <th>Triage Status</th>
                </tr>
              </thead>
              <tbody>
                {keyCountryHighlights.map(c => (
                  <tr key={c.code}>
                    <td style={{ fontWeight: 600 }}>
                      {c.name}{' '}
                      <span style={{ fontSize: 11, color: 'var(--color-secondary)', fontWeight: 400 }}>({c.code})</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{c.crashes}</td>
                    <td style={{ fontWeight: 600, color: '#B54708' }}>{c.excess}</td>
                    <td>
                      <span className={`status-pill ${c.tier.includes('Priority 1') ? 'danger' : 'warning'}`}>
                        {c.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
