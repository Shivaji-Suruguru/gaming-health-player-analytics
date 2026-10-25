import {
  calculateWeightedCrashRate,
  calculateAggregatedCrashRate,
  calculateCrashGap,
  calculateExcessCrashSessions,
  calculateGameDiagnosticMetrics,
  calculateCountryDiagnosticMetrics,
  calculateAcquisitionMetrics,
  calculateCohortRetention,
  calculateABExperimentMetrics,
} from './metrics.js';

let cachedData = null;

export async function loadAnalyticsData() {
  if (cachedData) return cachedData;

  const [dimRes, dailyRes, cohortRes, abRes] = await Promise.all([
    fetch('/data/dimensions.json').then(r => r.json()),
    fetch('/data/fact_daily_compact.json').then(r => r.json()),
    fetch('/data/fact_cohorts.json').then(r => r.json()),
    fetch('/data/fact_ab_tests.json').then(r => r.json()),
  ]);

  // Build lookup maps
  const gameMap = {};
  for (const g of dimRes.games) gameMap[g.game_key] = g;

  const countryMap = {};
  for (const c of dimRes.countries) countryMap[c.country_key] = c;

  const dateMap = {};
  for (const d of dimRes.dates) dateMap[d.date_key] = d;

  const channelMap = {};
  for (const ch of dimRes.channels) channelMap[ch.source_channel_key] = ch;

  const experimentMap = {};
  for (const exp of dimRes.experiments) experimentMap[exp.experiment_key] = exp;

  cachedData = {
    dimensions: dimRes,
    gameMap,
    countryMap,
    dateMap,
    channelMap,
    experimentMap,
    rawDaily: dailyRes,
    rawCohorts: cohortRes,
    rawAbTests: abRes,
  };

  return cachedData;
}

/**
 * Filter daily facts with global filters
 * Format of compact row: [dateKey, gameKey, countryKey, platformKey, sessions, crashSessions, dau, grossRevenueUsd]
 */
export function filterDailyFacts(rawDaily, filters, dateMap) {
  const { gameKey, countryKey, platformKey, dateRange } = filters;

  return rawDaily.filter(row => {
    const dk = row[0];
    const gk = row[1];
    const ck = row[2];
    const pk = row[3];

    if (gameKey && gameKey !== 'ALL' && gk !== Number(gameKey)) return false;
    if (countryKey && countryKey !== 'ALL' && ck !== Number(countryKey)) return false;
    if (platformKey && platformKey !== 'ALL' && pk !== Number(platformKey)) return false;

    if (dateRange && dateRange !== 'ALL') {
      const d = dateMap[dk];
      if (!d) return false;
      if (dateRange === 'L30') {
        // Last 30 days of dataset: 2026-09-25 to 2026-10-24
        if (d.full_date < '2026-09-25') return false;
      } else if (dateRange === '2026_Q3') {
        if (d.quarter_label !== '2026-Q3') return false;
      } else if (dateRange === '2026_Q2') {
        if (d.quarter_label !== '2026-Q2') return false;
      } else if (dateRange === '2025_FULL') {
        if (d.calendar_year !== 2025) return false;
      } else if (dateRange === '2026_YTD') {
        if (d.calendar_year !== 2026) return false;
      }
    }

    return true;
  });
}

/**
 * Calculate Executive Overview Metrics
 */
export function computeExecutiveOverview(filteredDaily, allDaily, filters, dateMap) {
  // Current period metrics
  let iosSessions = 0, iosCrashes = 0, iosDauSum = 0;
  let androidSessions = 0, androidCrashes = 0, androidDauSum = 0;
  let totalSessions = 0, totalCrashes = 0, totalDauSum = 0;
  let distinctDays = new Set();

  for (const row of filteredDaily) {
    const dk = row[0];
    const pk = row[3];
    const sess = row[4];
    const cr = row[5];
    const dau = row[6];

    distinctDays.add(dk);
    totalSessions += sess;
    totalCrashes += cr;
    totalDauSum += dau;

    if (pk === 1) {
      iosSessions += sess;
      iosCrashes += cr;
      iosDauSum += dau;
    } else if (pk === 2) {
      androidSessions += sess;
      androidCrashes += cr;
      androidDauSum += dau;
    }
  }

  const iosRate = calculateWeightedCrashRate(iosCrashes, iosSessions);
  const androidRate = calculateWeightedCrashRate(androidCrashes, androidSessions);
  const overallRate = calculateWeightedCrashRate(totalCrashes, totalSessions);

  const gap = calculateCrashGap(
    { crashRate: androidRate, crashSessions: androidCrashes, sessions: androidSessions },
    { crashRate: iosRate, crashSessions: iosCrashes, sessions: iosSessions }
  );

  const excess = calculateExcessCrashSessions(androidCrashes, androidSessions, iosRate);

  // Compute prior equivalent completed period for period-over-period comparison
  // Baseline comparison: Compare with the earlier half or equivalent preceding span
  const dayCount = distinctDays.size || 1;
  const avgDau = Math.round(totalDauSum / dayCount);
  const avgAndroidDau = Math.round(androidDauSum / dayCount);
  const avgIosDau = Math.round(iosDauSum / dayCount);

  // Time series by month for Executive trend visual
  const monthlyMap = new Map();
  for (const row of filteredDaily) {
    const dk = row[0];
    const pk = row[3];
    const sess = row[4];
    const cr = row[5];
    const d = dateMap[dk];
    if (!d) continue;

    const m = d.month_start_date;
    const isMtd = m === '2026-10-01';
    const monthLabel = `${d.month_name.slice(0, 3)} '${String(d.calendar_year).slice(2)}${isMtd ? ' (MTD)' : ''}`;
    if (!monthlyMap.has(m)) {
      monthlyMap.set(m, { month: m, label: monthLabel, isMtd, iosSess: 0, iosCrash: 0, androidSess: 0, androidCrash: 0 });
    }
    const entry = monthlyMap.get(m);
    if (pk === 1) {
      entry.iosSess += sess;
      entry.iosCrash += cr;
    } else if (pk === 2) {
      entry.androidSess += sess;
      entry.androidCrash += cr;
    }
  }

  const monthlySeries = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month)).map(item => {
    const iRate = calculateWeightedCrashRate(item.iosCrash, item.iosSess);
    const aRate = calculateWeightedCrashRate(item.androidCrash, item.androidSess);
    const diffPp = iRate != null && aRate != null ? (aRate - iRate) * 100 : null;
    return {
      month: item.month,
      label: item.label,
      iosRate: iRate != null ? Number((iRate * 100).toFixed(4)) : null,
      androidRate: aRate != null ? Number((aRate * 100).toFixed(4)) : null,
      gapPp: diffPp != null ? Number(diffPp.toFixed(4)) : null,
      iosSessions: item.iosSess,
      androidSessions: item.androidSess,
    };
  });

  return {
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
    avgAndroidDau,
    avgIosDau,
    dayCount,
    monthlySeries,
  };
}

/**
 * Platform Stability Trend Aggregations (Monthly or Weekly)
 */
export function computePlatformStabilityTrends(filteredDaily, dateMap, aggregation = 'monthly') {
  const groups = new Map();

  for (const row of filteredDaily) {
    const dk = row[0];
    const pk = row[3];
    const sess = row[4];
    const cr = row[5];
    const d = dateMap[dk];
    if (!d) continue;

    const groupKey = aggregation === 'weekly' ? d.week_start_date : d.month_start_date;
    const isMtd = groupKey === '2026-10-01';
    const isPartialWeek = groupKey === '2026-10-19';
    const label = aggregation === 'weekly'
      ? `Wk ${d.week_start_date.slice(5)}${isPartialWeek ? ' (Partial)' : ''}`
      : `${d.month_name.slice(0, 3)} '${String(d.calendar_year).slice(2)}${isMtd ? ' (MTD / 24d)' : ''}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        period: groupKey,
        label,
        isMtd,
        isPartialWeek,
        iosSess: 0,
        iosCrash: 0,
        androidSess: 0,
        androidCrash: 0,
        totalSess: 0,
        totalCrash: 0,
      });
    }

    const g = groups.get(groupKey);
    g.totalSess += sess;
    g.totalCrash += cr;
    if (pk === 1) {
      g.iosSess += sess;
      g.iosCrash += cr;
    } else if (pk === 2) {
      g.androidSess += sess;
      g.androidCrash += cr;
    }
  }

  const sortedPeriods = Array.from(groups.values()).sort((a, b) => a.period.localeCompare(b.period));

  let prevAndroidRate = null;
  let prevIosRate = null;

  return sortedPeriods.map(p => {
    const iosRate = calculateWeightedCrashRate(p.iosCrash, p.iosSess);
    const androidRate = calculateWeightedCrashRate(p.androidCrash, p.androidSess);
    const totalRate = calculateWeightedCrashRate(p.totalCrash, p.totalSess);

    const gapPp = (androidRate != null && iosRate != null) ? (androidRate - iosRate) * 100 : null;
    const ratio = (androidRate != null && iosRate != null && iosRate > 0) ? androidRate / iosRate : null;

    const androidPopChangePp = (androidRate != null && prevAndroidRate != null) ? (androidRate - prevAndroidRate) * 100 : null;
    const iosPopChangePp = (iosRate != null && prevIosRate != null) ? (iosRate - prevIosRate) * 100 : null;

    prevAndroidRate = androidRate;
    prevIosRate = iosRate;

    return {
      period: p.period,
      label: p.label,
      iosRate,
      androidRate,
      totalRate,
      iosSessions: p.iosSess,
      androidSessions: p.androidSess,
      totalSessions: p.totalSess,
      iosCrashes: p.iosCrash,
      androidCrashes: p.androidCrash,
      totalCrashes: p.totalCrash,
      gapPp,
      ratio,
      androidPopChangePp,
      iosPopChangePp,
    };
  });
}

/**
 * Game Diagnostics: Grouped calculations by game with multi-dimensional ranking
 */
export function computeGameDiagnostics(filteredDaily, gameLookup) {
  // Convert compact tuples to field objects for metric functions
  const adaptedRows = filteredDaily.map(r => ({
    game_key: r[1],
    country_key: r[2],
    platform_key: r[3],
    sessions: r[4],
    crash_sessions: r[5],
  }));

  return calculateGameDiagnosticMetrics(adaptedRows, gameLookup);
}

/**
 * Country Investigation: Grouped calculations by country and platform
 */
export function computeCountryDiagnostics(filteredDaily, countryLookup) {
  const adaptedRows = filteredDaily.map(r => ({
    country_key: r[2],
    platform_key: r[3],
    sessions: r[4],
    crash_sessions: r[5],
  }));

  return calculateCountryDiagnosticMetrics(adaptedRows, countryLookup);
}

/**
 * Acquisition & Retention Cohort Analytics
 */
export function computeAcquisitionCohortMetrics(rawCohorts, filters, channelLookup, gameLookup, countryLookup) {
  const { gameKey, countryKey, platformKey, channelKey } = filters;

  const filtered = rawCohorts.filter(r => {
    if (gameKey && gameKey !== 'ALL' && r.game_key !== Number(gameKey)) return false;
    if (countryKey && countryKey !== 'ALL' && r.country_key !== Number(countryKey)) return false;
    if (platformKey && platformKey !== 'ALL' && r.platform_key !== Number(platformKey)) return false;
    if (channelKey && channelKey !== 'ALL' && r.source_channel_key !== Number(channelKey)) return false;
    return true;
  });

  // Aggregate overall
  const overallAcq = calculateAcquisitionMetrics(filtered.map(r => ({
    marketing_spend_usd: r.spend,
    installs: r.installs,
    impressions: r.impressions,
    clicks: r.clicks,
    tutorial_started_users: r.tut_start,
    tutorial_completed_users: r.tut_done,
  })));

  const d1Ret = calculateCohortRetention(filtered.map(r => ({ d1_retained_users: r.d1_ret, d1_eligible_users: r.d1_elig })), 1);
  const d7Ret = calculateCohortRetention(filtered.map(r => ({ d7_retained_users: r.d7_ret, d7_eligible_users: r.d7_elig })), 7);
  const d30Ret = calculateCohortRetention(filtered.map(r => ({ d30_retained_users: r.d30_ret, d30_eligible_users: r.d30_elig })), 30);

  // Group by Cohort Month for curve / heatmap
  const cohortMonthMap = new Map();
  for (const r of filtered) {
    const m = r.cohort_month;
    if (!cohortMonthMap.has(m)) {
      cohortMonthMap.set(m, {
        month: m,
        periodType: r.period_type,
        installs: 0,
        spend: 0,
        tutStart: 0,
        tutDone: 0,
        d1Elig: 0,
        d1Ret: 0,
        d7Elig: 0,
        d7Ret: 0,
        d30Elig: 0,
        d30Ret: 0,
      });
    }
    const entry = cohortMonthMap.get(m);
    entry.installs += r.installs;
    entry.spend += r.spend;
    entry.tutStart += r.tut_start;
    entry.tutDone += r.tut_done;
    entry.d1Elig += r.d1_elig;
    entry.d1Ret += r.d1_ret;
    entry.d7Elig += r.d7_elig;
    entry.d7Ret += r.d7_ret;
    entry.d30Elig += r.d30_elig;
    entry.d30Ret += r.d30_ret;
  }

  const monthlyBreakdown = Array.from(cohortMonthMap.values()).sort((a, b) => a.month.localeCompare(b.month)).map(item => {
    const cpi = item.installs > 0 ? item.spend / item.installs : null;
    const tutRate = item.tutStart > 0 ? item.tutDone / item.tutStart : null;
    const d1Rate = item.d1Elig > 0 ? item.d1Ret / item.d1Elig : null;
    const d7Rate = item.d7Elig > 0 ? item.d7Ret / item.d7Elig : null;
    // D30 maturity check!
    const d30Rate = item.d30Elig > 0 ? item.d30Ret / item.d30Elig : null;
    const isD30Immature = item.d30Elig === 0;

    return {
      month: item.month,
      periodType: item.periodType,
      installs: item.installs,
      spend: item.spend,
      cpi,
      tutRate,
      d1Rate,
      d7Rate,
      d30Rate,
      isD30Immature,
      d30Status: isD30Immature ? 'Immature (0 eligible)' : 'Mature',
    };
  });

  // Channel breakdown
  const channelBreakdownMap = new Map();
  for (const r of filtered) {
    const ch = String(r.source_channel_key);
    if (!channelBreakdownMap.has(ch)) {
      channelBreakdownMap.set(ch, { channelKey: ch, installs: 0, spend: 0, d1Elig: 0, d1Ret: 0, d7Elig: 0, d7Ret: 0, d30Elig: 0, d30Ret: 0 });
    }
    const cEntry = channelBreakdownMap.get(ch);
    cEntry.installs += r.installs;
    cEntry.spend += r.spend;
    cEntry.d1Elig += r.d1_elig;
    cEntry.d1Ret += r.d1_ret;
    cEntry.d7Elig += r.d7_elig;
    cEntry.d7Ret += r.d7_ret;
    cEntry.d30Elig += r.d30_elig;
    cEntry.d30Ret += r.d30_ret;
  }

  const channelBreakdown = Array.from(channelBreakdownMap.values()).map(c => {
    const meta = channelLookup[c.channelKey] || {};
    return {
      channelKey: c.channelKey,
      channelName: meta.source_channel_name || `Channel ${c.channelKey}`,
      channelGroup: meta.channel_group || 'Other',
      isPaid: meta.is_paid_channel === 'true',
      installs: c.installs,
      spend: c.spend,
      cpi: c.installs > 0 ? c.spend / c.installs : null,
      d1Rate: c.d1Elig > 0 ? c.d1Ret / c.d1Elig : null,
      d7Rate: c.d7Elig > 0 ? c.d7Ret / c.d7Elig : null,
      d30Rate: c.d30Elig > 0 ? c.d30Ret / c.d30Elig : null,
    };
  }).sort((a, b) => b.installs - a.installs);

  return {
    overallAcq,
    d1Ret,
    d7Ret,
    d30Ret,
    monthlyBreakdown,
    channelBreakdown,
  };
}

/**
 * A/B Experiment Analysis
 */
export function computeExperimentAnalysis(rawAbTests, experimentKey, experimentLookup) {
  const meta = experimentLookup[experimentKey] || {};
  const expRows = rawAbTests.filter(r => r.experiment_key === Number(experimentKey));

  const adaptedRows = expRows.map(r => ({
    variant_key: r.variant_key,
    exposed_users: r.exposed,
    primary_metric_success_users: r.success,
    primary_metric_denominator: r.denom,
    d1_retained_users: r.d1_ret,
    d7_retained_users: r.d7_ret,
    payer_users: r.payer,
    sessions: r.sessions,
    gross_revenue_usd: r.rev,
  }));

  const metrics = calculateABExperimentMetrics(adaptedRows, meta);

  // Compute guardrail metrics across variants
  let cD1Ret = 0, cD7Ret = 0, cPayers = 0, cSess = 0;
  let tD1Ret = 0, tD7Ret = 0, tPayers = 0, tSess = 0;

  for (const r of adaptedRows) {
    if (r.variant_key === 1) {
      cD1Ret += r.d1_retained_users;
      cD7Ret += r.d7_retained_users;
      cPayers += r.payer_users;
      cSess += r.sessions;
    } else if (r.variant_key === 2) {
      tD1Ret += r.d1_retained_users;
      tD7Ret += r.d7_retained_users;
      tPayers += r.payer_users;
      tSess += r.sessions;
    }
  }

  const guardrails = {
    control: {
      d1RetRate: metrics.control.exposed > 0 ? cD1Ret / metrics.control.exposed : null,
      d7RetRate: metrics.control.exposed > 0 ? cD7Ret / metrics.control.exposed : null,
      payerRate: metrics.control.exposed > 0 ? cPayers / metrics.control.exposed : null,
      arpu: metrics.control.exposed > 0 ? metrics.control.revenue / metrics.control.exposed : null,
    },
    treatment: {
      d1RetRate: metrics.treatment.exposed > 0 ? tD1Ret / metrics.treatment.exposed : null,
      d7RetRate: metrics.treatment.exposed > 0 ? tD7Ret / metrics.treatment.exposed : null,
      payerRate: metrics.treatment.exposed > 0 ? tPayers / metrics.treatment.exposed : null,
      arpu: metrics.treatment.exposed > 0 ? metrics.treatment.revenue / metrics.treatment.exposed : null,
    },
  };

  return {
    meta,
    metrics,
    guardrails,
  };
}
