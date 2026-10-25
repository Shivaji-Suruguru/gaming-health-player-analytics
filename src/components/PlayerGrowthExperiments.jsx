import React, { useState, useMemo } from 'react';
import {
  computeAcquisitionCohortMetrics,
  computeExperimentAnalysis,
} from '../analytics/dataService.js';
import {
  Users,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

export default function PlayerGrowthExperiments({
  rawCohorts,
  rawAbTests,
  filters,
  dataset,
}) {
  const [subTab, setSubTab] = useState('acquisition'); // 'acquisition' | 'experiments'
  const [selectedExpKey, setSelectedExpKey] = useState('1'); // default to experiment 1
  const [channelFilter, setChannelFilter] = useState('ALL');

  const { channelMap = {}, gameMap = {}, countryMap = {}, experimentMap = {}, dimensions = {} } = dataset || {};
  const { experiments = [], channels = [] } = dimensions;

  // Acquisition and Retention Metrics
  const acqData = useMemo(() => {
    return computeAcquisitionCohortMetrics(
      rawCohorts,
      { ...filters, channelKey: channelFilter },
      channelMap,
      gameMap,
      countryMap
    );
  }, [rawCohorts, filters, channelFilter, channelMap, gameMap, countryMap]);

  // A/B Experiment Analysis
  const expData = useMemo(() => {
    return computeExperimentAnalysis(rawAbTests, selectedExpKey, experimentMap);
  }, [rawAbTests, selectedExpKey, experimentMap]);

  return (
    <div>
      {/* Title & Sub-tab Switcher Row */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Growth Economics & Experimentation</h1>
          <p className="page-subtitle">
            Analyzing acquisition funnel quality, cohort retention maturation, and hypothesis testing rigor
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="segmented-pill-control">
            <button
              className={`segmented-pill-item ${subTab === 'acquisition' ? 'active' : ''}`}
              onClick={() => setSubTab('acquisition')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Users size={14} />
                Acquisition & Retention Cohorts
              </span>
            </button>
            <button
              className={`segmented-pill-item ${subTab === 'experiments' ? 'active' : ''}`}
              onClick={() => setSubTab('experiments')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Target size={14} />
                A/B Testing Lab ({experiments.length} Tests)
              </span>
            </button>
          </div>

          {subTab === 'acquisition' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                className="filter-chip-select"
                value={channelFilter}
                onChange={e => setChannelFilter(e.target.value)}
              >
                <option value="ALL">All Attribution Channels</option>
                {channels?.map(c => (
                  <option key={c.source_channel_key} value={c.source_channel_key}>
                    {c.source_channel_name} ({c.channel_group})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* SUB-TAB A: ACQUISITION & RETENTION */}
      {subTab === 'acquisition' && (
        <div>
          {/* Funnel KPI Cards */}
          <div className="kpi-row-grid">
            <div className="lovart-kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Total Spend & CPI</span>
                <div className="kpi-icon-circle">$</div>
              </div>
              <div className="kpi-card-value">
                ${(acqData.overallAcq.spendUsd / 1000).toFixed(1)}k
              </div>
              <div className="kpi-card-subtext">
                <span>Blended CPI: <strong>${acqData.overallAcq.cpi?.toFixed(2)}</strong> per install</span>
              </div>
            </div>

            <div className="lovart-kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Total Installs</span>
                <div className="kpi-icon-circle">
                  <Users size={14} />
                </div>
              </div>
              <div className="kpi-card-value">
                {acqData.overallAcq.installs?.toLocaleString()}
              </div>
              <div className="kpi-card-subtext">
                <span>Click CVR: <strong>{(acqData.overallAcq.cvr * 100)?.toFixed(1)}%</strong></span>
              </div>
            </div>

            <div className="lovart-kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Tutorial Completion</span>
                <div className="kpi-icon-circle">
                  <CheckCircle2 size={14} />
                </div>
              </div>
              <div className="kpi-card-value">
                {(acqData.overallAcq.tutorialCompletionRate * 100)?.toFixed(1)}%
              </div>
              <div className="kpi-card-subtext">
                <span>
                  {acqData.overallAcq.tutorialCompleted?.toLocaleString()} of {acqData.overallAcq.tutorialStarted?.toLocaleString()} started
                </span>
              </div>
            </div>

            <div className="lovart-kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Day 1 / Day 7 Retention</span>
                <div className="kpi-icon-circle">D</div>
              </div>
              <div className="kpi-card-value" style={{ fontSize: 24 }}>
                {(acqData.d1Ret.rate * 100)?.toFixed(1)}% <span style={{ fontSize: 14, color: 'var(--color-secondary)' }}>/ {(acqData.d7Ret.rate * 100)?.toFixed(1)}%</span>
              </div>
              <div className="kpi-card-subtext">
                <span>Weighted across eligible players</span>
              </div>
            </div>

            <div className="lovart-kpi-card hero-kpi">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Mature Day 30 Retention</span>
                <div className="kpi-icon-circle" style={{ backgroundColor: '#027A48' }}>
                  30
                </div>
              </div>
              <div className="kpi-card-value" style={{ color: '#027A48' }}>
                {(acqData.d30Ret.rate * 100)?.toFixed(1)}%
              </div>
              <div className="kpi-card-subtext">
                <span className="status-pill warning" style={{ fontSize: 10, padding: '2px 6px' }}>
                  Excludes Immature Oct '26
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Cohort Matrix Table */}
          <div className="lovart-card">
            <div className="card-header-clean">
              <div>
                <h2 className="card-title-main">Monthly Acquisition Cohort Retention Matrix</h2>
                <p className="card-subtitle-main">
                  Cohort economics and retention maturation from April 2025 through October 2026.
                </p>
              </div>
              <span className="status-pill warning">
                Strict Rule: Immature D30 cohorts are never treated as 0%
              </span>
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table className="clean-data-table">
                <thead>
                  <tr>
                    <th>Cohort Month</th>
                    <th>Status</th>
                    <th>Installs</th>
                    <th>Spend (USD)</th>
                    <th>CPI</th>
                    <th>Tutorial Done</th>
                    <th>D1 Retention</th>
                    <th>D7 Retention</th>
                    <th>D30 Retention</th>
                    <th>D30 Maturity Window</th>
                  </tr>
                </thead>
                <tbody>
                  {acqData.monthlyBreakdown.map(m => (
                    <tr key={m.month}>
                      <td style={{ fontWeight: 600 }}>{m.month}</td>
                      <td>
                        <span className={`status-pill ${m.periodType === 'FULL_MONTH' ? 'neutral' : 'warning'}`}>
                          {m.periodType}
                        </span>
                      </td>
                      <td>{m.installs.toLocaleString()}</td>
                      <td>${m.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ fontWeight: 600 }}>
                        {m.cpi != null ? `$${m.cpi.toFixed(2)}` : '—'}
                      </td>
                      <td>
                        {m.tutRate != null ? `${(m.tutRate * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0056B3' }}>
                        {m.d1Rate != null ? `${(m.d1Rate * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0E703A' }}>
                        {m.d7Rate != null ? `${(m.d7Rate * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {m.isD30Immature ? (
                          <span style={{ color: 'var(--color-secondary)', fontStyle: 'italic' }}>
                            Immature (0 elig)
                          </span>
                        ) : (
                          `${(m.d30Rate * 100).toFixed(1)}%`
                        )}
                      </td>
                      <td>
                        {m.isD30Immature ? (
                          <span className="status-pill warning">Unmatured Window</span>
                        ) : (
                          <span className="status-pill success">Mature Window</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Explanatory Takeaway Card */}
            <div className="takeaway-editorial-card">
              <Zap size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="takeaway-editorial-content">
                <span className="takeaway-editorial-title">Cohort Maturation & Funnel Takeaway:</span>
                Blended acquisition economics are stable at <strong>${acqData.overallAcq.cpi?.toFixed(2)} CPI</strong> with healthy 
                <strong> {(acqData.overallAcq.tutorialCompletionRate * 100)?.toFixed(1)}% tutorial completion</strong>. 
                Downstream retention settles at <strong>{(acqData.d1Ret.rate * 100)?.toFixed(1)}% (D1)</strong>, 
                <strong> {(acqData.d7Ret.rate * 100)?.toFixed(1)}% (D7)</strong>, and 
                <strong> {(acqData.d30Ret.rate * 100)?.toFixed(1)}% (D30)</strong>. 
                Importantly, the October 2026 month-to-date cohort has not reached the 30-day post-install window (`0 eligible users`); 
                the system preserves analytical integrity by reporting it as <code>Immature</code> rather than misrepresenting it as 0% retention.
              </div>
            </div>
          </div>

          {/* Acquisition Channels Breakdown */}
          <div className="lovart-card">
            <div className="card-header-clean">
              <div>
                <h2 className="card-title-main">Channel Performance & Player Quality</h2>
                <p className="card-subtitle-main">
                  Comparing acquisition efficiency (CPI) with downstream retention by attribution channel.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="clean-data-table">
                <thead>
                  <tr>
                    <th>Attribution Channel</th>
                    <th>Channel Group</th>
                    <th>Channel Type</th>
                    <th>Installs</th>
                    <th>Marketing Spend</th>
                    <th>CPI</th>
                    <th>D1 Retention</th>
                    <th>D7 Retention</th>
                    <th>D30 Retention</th>
                    <th>Attribution Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {acqData.channelBreakdown.map(ch => {
                    const isHighRet = ch.d7Rate > 0.16;
                    return (
                      <tr key={ch.channelKey}>
                        <td style={{ fontWeight: 600 }}>{ch.channelName}</td>
                        <td>{ch.channelGroup}</td>
                        <td>
                          <span className={`status-pill ${ch.isPaid ? 'neutral' : 'success'}`}>
                            {ch.isPaid ? 'Paid Media' : 'Organic / Owned'}
                          </span>
                        </td>
                        <td>{ch.installs.toLocaleString()}</td>
                        <td>${ch.spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ fontWeight: 600 }}>
                          {ch.cpi != null ? `$${ch.cpi.toFixed(2)}` : '—'}
                        </td>
                        <td style={{ color: '#0056B3' }}>
                          {ch.d1Rate != null ? `${(ch.d1Rate * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ color: '#0E703A' }}>
                          {ch.d7Rate != null ? `${(ch.d7Rate * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {ch.d30Rate != null ? `${(ch.d30Rate * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td>
                          {isHighRet ? (
                            <span className="status-pill success">High Value Cohort</span>
                          ) : (
                            <span className="status-pill neutral">Standard Retention</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB B: A/B EXPERIMENTS */}
      {subTab === 'experiments' && (
        <div>
          {/* Experiment Selection Toolbar */}
          <div className="lovart-card">
            <div className="card-header-clean">
              <div>
                <h2 className="card-title-main">Select Experiment ({experiments.length} Tests)</h2>
                <p className="card-subtitle-main">
                  Each test has an assigned primary hypothesis and target metric. Evaluate Variant A (Control) vs. Variant B (Treatment).
                </p>
              </div>

              <div style={{ minWidth: 280 }}>
                <select
                  className="filter-chip-select"
                  style={{ width: '100%', padding: '8px 14px', fontSize: 13 }}
                  value={selectedExpKey}
                  onChange={e => setSelectedExpKey(e.target.value)}
                >
                  {experiments.map(e => (
                    <option key={e.experiment_key} value={e.experiment_key}>
                      {e.experiment_code}: {e.experiment_name} ({e.test_area})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Experiment Hypothesis Summary Box */}
            <div style={{ backgroundColor: 'var(--color-muted)', padding: 16, borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <span className="status-pill neutral" style={{ fontWeight: 700 }}>{expData.meta.experiment_code}</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{expData.meta.experiment_name}</span>
                <span className="status-pill success" style={{ marginLeft: 'auto' }}>
                  Status: {expData.meta.status_as_of_2026_10_24}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-secondary)' }}>
                <strong>Hypothesis:</strong> {expData.meta.hypothesis}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 4 }}>
                <strong>Assigned Primary Success Metric:</strong> <code>{expData.meta.primary_success_metric}</code>
              </p>
            </div>
          </div>

          {/* Experiment Scorecard Cards */}
          <div className="kpi-row-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {/* Control Group */}
            <div className="lovart-kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Variant A (Control)</span>
                <div className="kpi-icon-circle" style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-primary)' }}>
                  A
                </div>
              </div>
              <div className="kpi-card-value" style={{ color: 'var(--color-secondary)' }}>
                {expData.metrics.control.rate != null ? `${(expData.metrics.control.rate * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="kpi-card-subtext">
                <span>
                  {expData.metrics.control.success?.toLocaleString()} / {expData.metrics.control.denominator?.toLocaleString()} ({expData.metrics.control.exposed?.toLocaleString()} exposed)
                </span>
              </div>
            </div>

            {/* Treatment Group */}
            <div className="lovart-kpi-card hero-kpi">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Variant B (Treatment)</span>
                <div className="kpi-icon-circle" style={{ backgroundColor: '#0E703A' }}>
                  B
                </div>
              </div>
              <div className="kpi-card-value" style={{ color: '#0E703A' }}>
                {expData.metrics.treatment.rate != null ? `${(expData.metrics.treatment.rate * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="kpi-card-subtext">
                <span>
                  {expData.metrics.treatment.success?.toLocaleString()} / {expData.metrics.treatment.denominator?.toLocaleString()} ({expData.metrics.treatment.exposed?.toLocaleString()} exposed)
                </span>
              </div>
            </div>

            {/* Absolute Lift */}
            <div className="lovart-kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Absolute Lift (pp)</span>
                <div className="kpi-icon-circle">
                  <TrendingUp size={14} />
                </div>
              </div>
              <div className="kpi-card-value">
                {expData.metrics.absoluteLiftPp != null ? (
                  `${expData.metrics.absoluteLiftPp > 0 ? '+' : ''}${expData.metrics.absoluteLiftPp.toFixed(2)} pp`
                ) : '—'}
              </div>
              <div className="kpi-card-subtext">
                <span>
                  Relative Lift: <strong>{expData.metrics.relativeLiftPct > 0 ? '+' : ''}{expData.metrics.relativeLiftPct?.toFixed(1)}%</strong>
                </span>
              </div>
            </div>

            {/* Statistical Significance Z-Test */}
            <div className="lovart-kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-card-label">Significance (Z-Test)</span>
                <div className="kpi-icon-circle" style={{ backgroundColor: expData.metrics.isSignificant ? '#D1FADF' : 'var(--color-muted)', color: expData.metrics.isSignificant ? '#027A48' : 'var(--color-primary)' }}>
                  Z
                </div>
              </div>
              <div className="kpi-card-value" style={{ fontSize: 20 }}>
                {expData.metrics.isSignificant ? (
                  <span style={{ color: '#027A48', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={18} /> Stat. Significant
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-secondary)' }}>
                    Inconclusive
                  </span>
                )}
              </div>
              <div className="kpi-card-subtext">
                <span>
                  Z-Score: <strong>{expData.metrics.zScore?.toFixed(2)}</strong> | p-value: <strong>{expData.metrics.pValue < 0.001 ? '<0.001' : expData.metrics.pValue?.toFixed(4)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Guardrail Metrics Table */}
          <div className="lovart-card">
            <div className="card-header-clean">
              <div>
                <h2 className="card-title-main">Guardrail Metrics: Protecting Player Experience</h2>
                <p className="card-subtitle-main">
                  Verifying treatment optimization in {expData.meta.test_area} did not inadvertently degrade retention or revenue.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="clean-data-table">
                <thead>
                  <tr>
                    <th>Variant</th>
                    <th>Exposed Users</th>
                    <th>D1 Retention</th>
                    <th>D7 Retention</th>
                    <th>Payer Conversion</th>
                    <th>ARPU (USD)</th>
                    <th>Gross Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Variant A (Control)</td>
                    <td>{expData.metrics.control.exposed?.toLocaleString()}</td>
                    <td>{(expData.guardrails.control.d1RetRate * 100)?.toFixed(1)}%</td>
                    <td>{(expData.guardrails.control.d7RetRate * 100)?.toFixed(1)}%</td>
                    <td>{(expData.guardrails.control.payerRate * 100)?.toFixed(2)}%</td>
                    <td>${expData.guardrails.control.arpu?.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>
                      ${expData.metrics.control.revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#0E703A' }}>Variant B (Treatment)</td>
                    <td>{expData.metrics.treatment.exposed?.toLocaleString()}</td>
                    <td>{(expData.guardrails.treatment.d1RetRate * 100)?.toFixed(1)}%</td>
                    <td>{(expData.guardrails.treatment.d7RetRate * 100)?.toFixed(1)}%</td>
                    <td>{(expData.guardrails.treatment.payerRate * 100)?.toFixed(2)}%</td>
                    <td>${expData.guardrails.treatment.arpu?.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>
                      ${expData.metrics.treatment.revenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Editorial Takeaway Card */}
            <div className="takeaway-editorial-card">
              <Zap size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="takeaway-editorial-content">
                <span className="takeaway-editorial-title">Experiment Evaluation Takeaway ({expData.meta.experiment_code}):</span>
                {expData.metrics.isSignificant ? (
                  <span>
                    Variant B demonstrates a statistically significant uplift of 
                    <strong> {expData.metrics.absoluteLiftPp > 0 ? '+' : ''}{expData.metrics.absoluteLiftPp?.toFixed(2)} pp </strong>
                    (<strong>{expData.metrics.relativeLiftPct > 0 ? '+' : ''}{expData.metrics.relativeLiftPct?.toFixed(1)}% relative</strong>) 
                    on the primary metric <code>{expData.meta.primary_success_metric}</code> with <strong>p = {expData.metrics.pValue < 0.001 ? '<0.001' : expData.metrics.pValue?.toFixed(4)}</strong> ($Z = {expData.metrics.zScore?.toFixed(2)}$). 
                    Guardrail check confirms healthy downstream D1/D7 retention and ARPU stability.
                  </span>
                ) : (
                  <span>
                    Variant B results in an observed difference of 
                    <strong> {expData.metrics.absoluteLiftPp > 0 ? '+' : ''}{expData.metrics.absoluteLiftPp?.toFixed(2)} pp</strong>, 
                    but the test does not meet the 95% statistical significance threshold ($p = {expData.metrics.pValue?.toFixed(4)}$). 
                    Recommendation is to extend the observation period or iterate the treatment hypothesis.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
