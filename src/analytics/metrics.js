/**
 * Gaming Health & Player Analytics - Core Reusable Calculation Engine
 * 
 * Strict Analytical Standards:
 * - Weighted calculations across all aggregated rows (never average precomputed row rates).
 * - Preservation of missing / immature states (never coerce incomplete cohort D30 retention to zero).
 * - Decoupling of absolute percentage points (pp) and relative percentage difference (%).
 * - Transparent benchmarking for excess crash sessions (explicitly labeled as hypothetical benchmark).
 * - Two-proportion Z-test for experimentation significance.
 */

/**
 * Standard Normal Cumulative Distribution Function (CDF) approximation (Abramowitz & Stegun).
 * @param {number} x - Z score value.
 * @returns {number} Probability P(Z <= x).
 */
export function normalCdf(x) {
  if (x < -8) return 0;
  if (x > 8) return 1;
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const poly = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
  const phi = 1.0 - c * Math.exp(-0.5 * absX * absX) * poly;

  return x >= 0 ? phi : 1.0 - phi;
}

/**
 * Calculates weighted crash rate from crash sessions and total sessions.
 * Formula: SUM(crash_sessions) / SUM(sessions)
 * 
 * @param {number} crashSessions - Total crash session count.
 * @param {number} totalSessions - Total session count.
 * @returns {number|null} Weighted crash rate or null if sessions <= 0.
 */
export function calculateWeightedCrashRate(crashSessions, totalSessions) {
  if (totalSessions == null || totalSessions <= 0) {
    return null;
  }
  const crashes = Number(crashSessions) || 0;
  const sessions = Number(totalSessions);
  return crashes / sessions;
}

/**
 * Aggregates fact_game_daily rows and computes weighted crash rate and total sessions.
 * 
 * @param {Array<Object>} rows - Array of daily game records.
 * @returns {{ crashSessions: number, sessions: number, crashRate: number|null, dau: number, grossRevenueUsd: number }}
 */
export function calculateAggregatedCrashRate(rows = []) {
  let crashSessions = 0;
  let sessions = 0;
  let dau = 0;
  let grossRevenueUsd = 0;

  for (const row of rows) {
    crashSessions += Number(row.crash_sessions) || 0;
    sessions += Number(row.sessions) || 0;
    dau += Number(row.daily_active_users) || 0;
    grossRevenueUsd += Number(row.gross_revenue_usd) || 0;
  }

  const crashRate = calculateWeightedCrashRate(crashSessions, sessions);

  return {
    crashSessions,
    sessions,
    crashRate,
    dau,
    grossRevenueUsd,
  };
}

/**
 * Calculates Android vs iOS crash-rate gap and relative ratio.
 * 
 * @param {{ crashRate: number|null, crashSessions: number, sessions: number }} androidMetrics
 * @param {{ crashRate: number|null, crashSessions: number, sessions: number }} iosMetrics
 * @returns {{
 *   androidCrashRate: number|null,
 *   iosCrashRate: number|null,
 *   absoluteGapPp: number|null,
 *   relativeDiffPct: number|null,
 *   ratio: number|null,
 *   status: string
 * }}
 */
export function calculateCrashGap(androidMetrics, iosMetrics) {
  if (!androidMetrics || !iosMetrics || androidMetrics.crashRate == null || iosMetrics.crashRate == null) {
    return {
      androidCrashRate: androidMetrics?.crashRate ?? null,
      iosCrashRate: iosMetrics?.crashRate ?? null,
      absoluteGapPp: null,
      relativeDiffPct: null,
      ratio: null,
      status: 'Incomplete or missing platform segment data',
    };
  }

  const pAndroid = androidMetrics.crashRate;
  const pIos = iosMetrics.crashRate;

  // Difference in percentage points (e.g. 0.68% - 0.38% = +0.30 pp)
  const absoluteGapPp = (pAndroid - pIos) * 100;

  // Relative percentage difference
  const relativeDiffPct = pIos > 0 ? ((pAndroid - pIos) / pIos) * 100 : null;

  // Multiplier ratio
  const ratio = pIos > 0 ? pAndroid / pIos : null;

  return {
    androidCrashRate: pAndroid,
    iosCrashRate: pIos,
    absoluteGapPp,
    relativeDiffPct,
    ratio,
    status: 'Valid',
  };
}

/**
 * Calculates the investigation-priority metric: Estimated excess Android crash sessions above iOS benchmark.
 * 
 * Expected Android crash sessions = Android sessions × comparable iOS crash rate.
 * Estimated excess crash sessions = actual Android crash sessions - expected Android crash sessions.
 * 
 * @param {number} actualAndroidCrashes - Actual recorded Android crash sessions.
 * @param {number} androidSessions - Actual recorded Android gameplay sessions.
 * @param {number|null} comparableIosCrashRate - Weighted crash rate of iOS for the exact same segment/period.
 * @returns {{
 *   expectedAndroidCrashes: number|null,
 *   excessCrashSessions: number|null,
 *   potentialExcessCrashSessions: number|null,
 *   methodologyDescription: string
 * }}
 */
export function calculateExcessCrashSessions(actualAndroidCrashes, androidSessions, comparableIosCrashRate) {
  const methodologyDescription = 
    "Analytical benchmarking estimate comparing recorded Android crash volume against the comparable iOS baseline rate. " +
    "This indicates variance relative to benchmark, not confirmed preventable crashes.";

  if (comparableIosCrashRate == null || androidSessions == null || androidSessions <= 0) {
    return {
      expectedAndroidCrashes: null,
      excessCrashSessions: null,
      potentialExcessCrashSessions: null,
      methodologyDescription,
    };
  }

  const actualCrashes = Number(actualAndroidCrashes) || 0;
  const sessions = Number(androidSessions);
  const expectedAndroidCrashes = Math.round(sessions * comparableIosCrashRate);
  const excessCrashSessions = actualCrashes - expectedAndroidCrashes;
  const potentialExcessCrashSessions = Math.max(0, excessCrashSessions);

  return {
    expectedAndroidCrashes,
    excessCrashSessions,
    potentialExcessCrashSessions,
    methodologyDescription,
  };
}

/**
 * Game-level diagnostic metrics: calculates weighted crash rates and gaps per game.
 * 
 * @param {Array<Object>} rows - Daily fact rows.
 * @param {Object} gameLookup - Map of game_key -> game metadata.
 * @returns {Array<Object>} Array of game diagnostic summaries.
 */
export function calculateGameDiagnosticMetrics(rows = [], gameLookup = {}) {
  // Partition by game_key and platform_key (1 = iOS, 2 = Android)
  const gamesMap = new Map();

  for (const row of rows) {
    const gk = String(row.game_key);
    const pk = String(row.platform_key);
    const sess = Number(row.sessions) || 0;
    const cr = Number(row.crash_sessions) || 0;

    if (!gamesMap.has(gk)) {
      gamesMap.set(gk, {
        gameKey: gk,
        iosSessions: 0,
        iosCrashes: 0,
        androidSessions: 0,
        androidCrashes: 0,
        totalSessions: 0,
        totalCrashes: 0,
      });
    }

    const entry = gamesMap.get(gk);
    entry.totalSessions += sess;
    entry.totalCrashes += cr;

    if (pk === '1') {
      entry.iosSessions += sess;
      entry.iosCrashes += cr;
    } else if (pk === '2') {
      entry.androidSessions += sess;
      entry.androidCrashes += cr;
    }
  }

  const results = [];

  for (const [gk, data] of gamesMap.entries()) {
    const meta = gameLookup[gk] || {};
    const iosCrashRate = calculateWeightedCrashRate(data.iosCrashes, data.iosSessions);
    const androidCrashRate = calculateWeightedCrashRate(data.androidCrashes, data.androidSessions);
    const totalCrashRate = calculateWeightedCrashRate(data.totalCrashes, data.totalSessions);

    const gap = calculateCrashGap(
      { crashRate: androidCrashRate, crashSessions: data.androidCrashes, sessions: data.androidSessions },
      { crashRate: iosCrashRate, crashSessions: data.iosCrashes, sessions: data.iosSessions }
    );

    const excess = calculateExcessCrashSessions(data.androidCrashes, data.androidSessions, iosCrashRate);

    results.push({
      gameKey: gk,
      gameCode: meta.game_code || `SG0${gk}`,
      gameName: meta.game_name || `Game ${gk}`,
      gameGenre: meta.game_genre || 'Unknown',
      lifecycleStage: meta.lifecycle_stage || 'Unknown',
      iosSessions: data.iosSessions,
      iosCrashes: data.iosCrashes,
      iosCrashRate,
      androidSessions: data.androidSessions,
      androidCrashes: data.androidCrashes,
      androidCrashRate,
      totalSessions: data.totalSessions,
      totalCrashes: data.totalCrashes,
      totalCrashRate,
      absoluteGapPp: gap.absoluteGapPp,
      relativeDiffPct: gap.relativeDiffPct,
      ratio: gap.ratio,
      expectedAndroidCrashes: excess.expectedAndroidCrashes,
      estimatedExcessCrashes: excess.excessCrashSessions,
      potentialExcessCrashes: excess.potentialExcessCrashSessions,
    });
  }

  // Sort descending by potential excess crashes to highlight highest investigation impact
  return results.sort((a, b) => (b.potentialExcessCrashes || 0) - (a.potentialExcessCrashes || 0));
}

/**
 * Country-level diagnostic metrics: calculates weighted crash rates and gaps per country.
 * 
 * @param {Array<Object>} rows - Daily fact rows.
 * @param {Object} countryLookup - Map of country_key -> country metadata.
 * @returns {Array<Object>} Array of country diagnostic summaries.
 */
export function calculateCountryDiagnosticMetrics(rows = [], countryLookup = {}) {
  const countryMap = new Map();

  for (const row of rows) {
    const ck = String(row.country_key);
    const pk = String(row.platform_key);
    const sess = Number(row.sessions) || 0;
    const cr = Number(row.crash_sessions) || 0;

    if (!countryMap.has(ck)) {
      countryMap.set(ck, {
        countryKey: ck,
        iosSessions: 0,
        iosCrashes: 0,
        androidSessions: 0,
        androidCrashes: 0,
        totalSessions: 0,
        totalCrashes: 0,
      });
    }

    const entry = countryMap.get(ck);
    entry.totalSessions += sess;
    entry.totalCrashes += cr;

    if (pk === '1') {
      entry.iosSessions += sess;
      entry.iosCrashes += cr;
    } else if (pk === '2') {
      entry.androidSessions += sess;
      entry.androidCrashes += cr;
    }
  }

  const results = [];

  for (const [ck, data] of countryMap.entries()) {
    const meta = countryLookup[ck] || {};
    const iosCrashRate = calculateWeightedCrashRate(data.iosCrashes, data.iosSessions);
    const androidCrashRate = calculateWeightedCrashRate(data.androidCrashes, data.androidSessions);
    const totalCrashRate = calculateWeightedCrashRate(data.totalCrashes, data.totalSessions);

    const gap = calculateCrashGap(
      { crashRate: androidCrashRate, crashSessions: data.androidCrashes, sessions: data.androidSessions },
      { crashRate: iosCrashRate, crashSessions: data.iosCrashes, sessions: data.iosSessions }
    );

    const excess = calculateExcessCrashSessions(data.androidCrashes, data.androidSessions, iosCrashRate);

    results.push({
      countryKey: ck,
      countryCode: meta.country_code || ck,
      countryName: meta.country_name || `Country ${ck}`,
      region: meta.region || 'EMEA',
      subregion: meta.subregion || 'Unknown',
      iosSessions: data.iosSessions,
      iosCrashes: data.iosCrashes,
      iosCrashRate,
      androidSessions: data.androidSessions,
      androidCrashes: data.androidCrashes,
      androidCrashRate,
      totalSessions: data.totalSessions,
      totalCrashes: data.totalCrashes,
      totalCrashRate,
      absoluteGapPp: gap.absoluteGapPp,
      relativeDiffPct: gap.relativeDiffPct,
      ratio: gap.ratio,
      expectedAndroidCrashes: excess.expectedAndroidCrashes,
      estimatedExcessCrashes: excess.excessCrashSessions,
      potentialExcessCrashes: excess.potentialExcessCrashSessions,
    });
  }

  return results.sort((a, b) => (b.androidCrashes || 0) - (a.androidCrashes || 0));
}

/**
 * Acquisition funnel metrics (CPI, CTR, CVR, Tutorial Completion).
 * 
 * @param {Array<Object>} rows - Array of monthly acquisition cohort records.
 * @returns {{
 *   spendUsd: number,
 *   installs: number,
 *   impressions: number,
 *   clicks: number,
 *   tutorialStarted: number,
 *   tutorialCompleted: number,
 *   cpi: number|null,
 *   ctr: number|null,
 *   cvr: number|null,
 *   tutorialCompletionRate: number|null
 * }}
 */
export function calculateAcquisitionMetrics(rows = []) {
  let spendUsd = 0;
  let installs = 0;
  let impressions = 0;
  let clicks = 0;
  let tutorialStarted = 0;
  let tutorialCompleted = 0;

  for (const row of rows) {
    spendUsd += Number(row.marketing_spend_usd) || 0;
    installs += Number(row.installs) || 0;
    impressions += Number(row.impressions) || 0;
    clicks += Number(row.clicks) || 0;
    tutorialStarted += Number(row.tutorial_started_users) || 0;
    tutorialCompleted += Number(row.tutorial_completed_users) || 0;
  }

  const cpi = installs > 0 ? spendUsd / installs : null;
  const ctr = impressions > 0 ? clicks / impressions : null;
  const cvr = clicks > 0 ? installs / clicks : null;
  const tutorialCompletionRate = tutorialStarted > 0 ? tutorialCompleted / tutorialStarted : null;

  return {
    spendUsd,
    installs,
    impressions,
    clicks,
    tutorialStarted,
    tutorialCompleted,
    cpi,
    ctr,
    cvr,
    tutorialCompletionRate,
  };
}

/**
 * Calculates cohort retention with strict handling of incomplete / unmatured cohorts.
 * 
 * Data Rule:
 * When eligible users is 0 (e.g. D30 for October 2026 MTD), rate must be null (not 0.0).
 * 
 * @param {Array<Object>} rows - Monthly cohort rows.
 * @param {number} day - Retention day target: 1, 7, or 30.
 * @returns {{
 *   retainedUsers: number,
 *   eligibleUsers: number,
 *   rate: number|null,
 *   isImmature: boolean,
 *   status: string
 * }}
 */
export function calculateCohortRetention(rows = [], day = 1) {
  const retCol = `d${day}_retained_users`;
  const eligCol = `d${day}_eligible_users`;

  let retainedUsers = 0;
  let eligibleUsers = 0;

  for (const row of rows) {
    retainedUsers += Number(row[retCol]) || 0;
    eligibleUsers += Number(row[eligCol]) || 0;
  }

  if (eligibleUsers <= 0) {
    return {
      retainedUsers,
      eligibleUsers,
      rate: null,
      isImmature: true,
      status: `D${day} Window Incomplete / Immature`,
    };
  }

  return {
    retainedUsers,
    eligibleUsers,
    rate: retainedUsers / eligibleUsers,
    isImmature: false,
    status: 'Mature',
  };
}

/**
 * A/B experiment evaluation with primary metric comparison and two-proportion z-test.
 * 
 * @param {Array<Object>} experimentFactRows - Rows belonging to a single experiment.
 * @param {Object} experimentMeta - Metadata from dim_experiment.
 * @returns {{
 *   experimentKey: string,
 *   experimentCode: string,
 *   experimentName: string,
 *   primaryMetric: string,
 *   control: { exposed: number, success: number, denominator: number, rate: number|null, revenue: number },
 *   treatment: { exposed: number, success: number, denominator: number, rate: number|null, revenue: number },
 *   absoluteLiftPp: number|null,
 *   relativeLiftPct: number|null,
 *   zScore: number|null,
 *   pValue: number|null,
 *   isSignificant: boolean|null,
 *   sampleStatus: string
 * }}
 */
export function calculateABExperimentMetrics(experimentFactRows = [], experimentMeta = {}) {
  let controlExposed = 0;
  let controlSuccess = 0;
  let controlDenominator = 0;
  let controlRevenue = 0;

  let treatmentExposed = 0;
  let treatmentSuccess = 0;
  let treatmentDenominator = 0;
  let treatmentRevenue = 0;

  for (const row of experimentFactRows) {
    const vk = String(row.variant_key);
    const exposed = Number(row.exposed_users) || 0;
    const success = Number(row.primary_metric_success_users) || 0;
    const denom = Number(row.primary_metric_denominator) || 0;
    const rev = Number(row.gross_revenue_usd) || 0;

    if (vk === '1') { // Variant A: Control
      controlExposed += exposed;
      controlSuccess += success;
      controlDenominator += denom;
      controlRevenue += rev;
    } else if (vk === '2') { // Variant B: Treatment
      treatmentExposed += exposed;
      treatmentSuccess += success;
      treatmentDenominator += denom;
      treatmentRevenue += rev;
    }
  }

  const controlRate = controlDenominator > 0 ? controlSuccess / controlDenominator : null;
  const treatmentRate = treatmentDenominator > 0 ? treatmentSuccess / treatmentDenominator : null;

  if (controlRate == null || treatmentRate == null || controlDenominator <= 0 || treatmentDenominator <= 0) {
    return {
      experimentKey: experimentMeta.experiment_key || 'unknown',
      experimentCode: experimentMeta.experiment_code || 'unknown',
      experimentName: experimentMeta.experiment_name || 'unknown',
      primaryMetric: experimentMeta.primary_success_metric || 'unknown',
      control: { exposed: controlExposed, success: controlSuccess, denominator: controlDenominator, rate: controlRate, revenue: controlRevenue },
      treatment: { exposed: treatmentExposed, success: treatmentSuccess, denominator: treatmentDenominator, rate: treatmentRate, revenue: treatmentRevenue },
      absoluteLiftPp: null,
      relativeLiftPct: null,
      zScore: null,
      pValue: null,
      isSignificant: null,
      sampleStatus: 'Insufficient Sample Data',
    };
  }

  const absoluteLiftPp = (treatmentRate - controlRate) * 100;
  const relativeLiftPct = controlRate > 0 ? ((treatmentRate - controlRate) / controlRate) * 100 : null;

  // Two-proportion Z-test
  const pPooled = (controlSuccess + treatmentSuccess) / (controlDenominator + treatmentDenominator);
  const se = Math.sqrt(pPooled * (1 - pPooled) * ((1 / controlDenominator) + (1 / treatmentDenominator)));

  let zScore = null;
  let pValue = null;
  let isSignificant = null;

  if (se > 0) {
    zScore = (treatmentRate - controlRate) / se;
    // Two-tailed p-value
    pValue = 2 * (1 - normalCdf(Math.abs(zScore)));
    isSignificant = pValue < 0.05;
  }

  return {
    experimentKey: experimentMeta.experiment_key || 'unknown',
    experimentCode: experimentMeta.experiment_code || 'unknown',
    experimentName: experimentMeta.experiment_name || 'unknown',
    primaryMetric: experimentMeta.primary_success_metric || 'unknown',
    control: {
      exposed: controlExposed,
      success: controlSuccess,
      denominator: controlDenominator,
      rate: controlRate,
      revenue: controlRevenue,
    },
    treatment: {
      exposed: treatmentExposed,
      success: treatmentSuccess,
      denominator: treatmentDenominator,
      rate: treatmentRate,
      revenue: treatmentRevenue,
    },
    absoluteLiftPp,
    relativeLiftPct,
    zScore,
    pValue,
    isSignificant,
    sampleStatus: controlDenominator >= 100 && treatmentDenominator >= 100 ? 'Adequate Sample' : 'Small Sample',
  };
}
