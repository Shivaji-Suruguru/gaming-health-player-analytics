import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

import {
  normalCdf,
  calculateWeightedCrashRate,
  calculateAggregatedCrashRate,
  calculateCrashGap,
  calculateExcessCrashSessions,
  calculateGameDiagnosticMetrics,
  calculateCountryDiagnosticMetrics,
  calculateAcquisitionMetrics,
  calculateCohortRetention,
  calculateABExperimentMetrics,
} from '../src/analytics/metrics.js';

// --- UNIT TESTS ---

test('calculateWeightedCrashRate computes correct ratio and handles division by zero', () => {
  assert.equal(calculateWeightedCrashRate(10, 1000), 0.01);
  assert.equal(calculateWeightedCrashRate(0, 1000), 0);
  assert.equal(calculateWeightedCrashRate(5, 0), null);
  assert.equal(calculateWeightedCrashRate(5, -10), null);
  assert.equal(calculateWeightedCrashRate(5, null), null);
});

test('calculateCrashGap cleanly separates percentage points from relative difference', () => {
  const android = { crashRate: 0.0068, crashSessions: 68, sessions: 10000 };
  const ios = { crashRate: 0.0038, crashSessions: 38, sessions: 10000 };

  const gap = calculateCrashGap(android, ios);

  // Absolute gap: (0.0068 - 0.0038) * 100 = 0.30 pp
  assert.ok(Math.abs(gap.absoluteGapPp - 0.30) < 0.0001);

  // Relative diff: (0.0068 - 0.0038) / 0.0038 * 100 = ~78.947%
  assert.ok(Math.abs(gap.relativeDiffPct - 78.947) < 0.01);

  // Ratio: 0.0068 / 0.0038 = ~1.789
  assert.ok(Math.abs(gap.ratio - 1.789) < 0.01);
});

test('calculateExcessCrashSessions accurately models benchmark and preserves transparency', () => {
  const actualAndroidCrashes = 700;
  const androidSessions = 100000;
  const iosCrashRate = 0.0040; // 0.40%

  const excess = calculateExcessCrashSessions(actualAndroidCrashes, androidSessions, iosCrashRate);

  // Expected crashes = 100,000 * 0.004 = 400
  assert.equal(excess.expectedAndroidCrashes, 400);
  // Excess = 700 - 400 = 300
  assert.equal(excess.excessCrashSessions, 300);
  assert.equal(excess.potentialExcessCrashSessions, 300);
  assert.ok(excess.methodologyDescription.includes('Analytical benchmarking estimate'));

  // Test negative excess case (where Android performed better than iOS)
  const lowerAndroidCrashes = 300;
  const underExcess = calculateExcessCrashSessions(lowerAndroidCrashes, androidSessions, iosCrashRate);
  assert.equal(underExcess.excessCrashSessions, -100);
  // potentialExcess should clamp to 0
  assert.equal(underExcess.potentialExcessCrashSessions, 0);
});

test('calculateCohortRetention never converts immature D30 zero to a fake 0.0% rate', () => {
  // Immature cohort test vector (e.g. October 2026 MTD)
  const immatureRows = [
    { d30_eligible_users: 0, d30_retained_users: 0 },
    { d30_eligible_users: 0, d30_retained_users: 0 },
  ];

  const result = calculateCohortRetention(immatureRows, 30);
  assert.equal(result.eligibleUsers, 0);
  assert.equal(result.retainedUsers, 0);
  assert.equal(result.rate, null); // MUST NOT BE 0
  assert.equal(result.isImmature, true);
  assert.ok(result.status.includes('Immature'));

  // Mature cohort test vector
  const matureRows = [
    { d30_eligible_users: 100, d30_retained_users: 10 },
    { d30_eligible_users: 200, d30_retained_users: 30 },
  ];

  const matureResult = calculateCohortRetention(matureRows, 30);
  assert.equal(matureResult.eligibleUsers, 300);
  assert.equal(matureResult.retainedUsers, 40);
  assert.equal(matureResult.rate, 40 / 300);
  assert.equal(matureResult.isImmature, false);
});

test('calculateABExperimentMetrics performs two-proportion Z-test and reports significance', () => {
  const rows = [
    { variant_key: 1, primary_metric_success_users: 100, primary_metric_denominator: 1000, exposed_users: 1000, gross_revenue_usd: 500 },
    { variant_key: 2, primary_metric_success_users: 150, primary_metric_denominator: 1000, exposed_users: 1000, gross_revenue_usd: 750 },
  ];

  const meta = {
    experiment_key: '1',
    experiment_code: 'AB-001',
    experiment_name: 'Offer Framing Test',
    primary_success_metric: 'payer_conversion_rate',
  };

  const exp = calculateABExperimentMetrics(rows, meta);
  assert.equal(exp.control.rate, 0.10);
  assert.equal(exp.treatment.rate, 0.15);
  // Absolute lift = +5.0 pp
  assert.ok(Math.abs(exp.absoluteLiftPp - 5.0) < 0.0001);
  // Relative lift = +50.0%
  assert.ok(Math.abs(exp.relativeLiftPct - 50.0) < 0.0001);
  // Z-score should be statistically significant at 95% (p < 0.05)
  assert.ok(exp.zScore > 1.96);
  assert.ok(exp.pValue < 0.05);
  assert.equal(exp.isSignificant, true);
});

// --- INTEGRATION TESTS WITH ACTUAL SOURCE DATASETS ---

// Helper function to stream CSV into parsed objects
async function parseCsv(filePath) {
  const results = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    // Basic CSV splitting respecting quotes
    const fields = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        fields.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    fields.push(cur.trim());

    if (!headers) {
      headers = fields;
    } else {
      const obj = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = fields[i];
      }
      results.push(obj);
    }
  }
  return results;
}

test('Integration Test: Real fact_game_daily dataset verifies Android crash disparity', async () => {
  const filePath = path.resolve('fact_game_daily.csv');
  const rows = await parseCsv(filePath);

  assert.equal(rows.length, 120120, 'Expected exactly 120,120 daily records');

  const iosRows = rows.filter(r => r.platform_key === '1');
  const androidRows = rows.filter(r => r.platform_key === '2');

  const iosAgg = calculateAggregatedCrashRate(iosRows);
  const androidAgg = calculateAggregatedCrashRate(androidRows);

  // Platform 1 (iOS) crash rate: ~0.3833%
  assert.ok(Math.abs(iosAgg.crashRate - 0.003833) < 0.0001, `iOS rate was ${iosAgg.crashRate}`);
  // Platform 2 (Android) crash rate: ~0.6832%
  assert.ok(Math.abs(androidAgg.crashRate - 0.006832) < 0.0001, `Android rate was ${androidAgg.crashRate}`);

  const gap = calculateCrashGap(androidAgg, iosAgg);
  assert.ok(Math.abs(gap.absoluteGapPp - 0.30) < 0.01, `Gap in pp was ${gap.absoluteGapPp}`);
  assert.ok(gap.ratio > 1.75 && gap.ratio < 1.82, `Ratio was ${gap.ratio}`);

  // Test Excess Crash Sessions portfolio-wide
  const excess = calculateExcessCrashSessions(androidAgg.crashSessions, androidAgg.sessions, iosAgg.crashRate);
  // Expected Android crashes: ~222,700
  // Actual Android crashes: 396,961
  // Excess: ~174,200 crashes
  assert.ok(excess.excessCrashSessions > 170000 && excess.excessCrashSessions < 176000);
});

test('Integration Test: Game diagnostics identify Turbo Trail as highest rate and Puzzle Harbor as highest volume', async () => {
  const gameCsv = await parseCsv(path.resolve('dim_game.csv'));
  const gameLookup = {};
  for (const g of gameCsv) gameLookup[g.game_key] = g;

  const factRows = await parseCsv(path.resolve('fact_game_daily.csv'));
  const gameMetrics = calculateGameDiagnosticMetrics(factRows, gameLookup);

  assert.equal(gameMetrics.length, 7, 'Expected 7 game summaries');

  // Find Turbo Trail (SG04 / game_key 4)
  const turboTrail = gameMetrics.find(g => g.gameKey === '4');
  assert.ok(turboTrail, 'Turbo Trail should exist');
  // Turbo Trail has the highest crash rate on Android (~0.7709%) and iOS (~0.4688%)
  assert.ok(turboTrail.androidCrashRate > 0.0076, `Turbo Trail Android rate: ${turboTrail.androidCrashRate}`);
  assert.ok(turboTrail.iosCrashRate > 0.0046, `Turbo Trail iOS rate: ${turboTrail.iosCrashRate}`);

  // Find Puzzle Harbor (game_key 1) - has the highest absolute Android crash volume
  const puzzleHarbor = gameMetrics.find(g => g.gameKey === '1');
  assert.ok(puzzleHarbor, 'Puzzle Harbor should exist');
  assert.ok(puzzleHarbor.androidCrashes > 70000, `Puzzle Harbor crashes: ${puzzleHarbor.androidCrashes}`);
  for (const other of gameMetrics) {
    if (other.gameKey !== '1') {
      assert.ok(puzzleHarbor.androidCrashes >= other.androidCrashes, 'Puzzle Harbor has highest Android crash count');
    }
  }
});

test('Integration Test: Acquisition and retention correctly flags October 2026 MTD D30 as immature', async () => {
  const cohortRows = await parseCsv(path.resolve('fact_acquisition_cohort_monthly.csv'));
  assert.equal(cohortRows.length, 27930, 'Expected 27,930 cohort rows');

  // October 2026 cohort (month-to-date)
  const octRows = cohortRows.filter(r => r.cohort_month === '2026-10-01');
  assert.ok(octRows.length > 0);

  const octD1 = calculateCohortRetention(octRows, 1);
  const octD7 = calculateCohortRetention(octRows, 7);
  const octD30 = calculateCohortRetention(octRows, 30);

  assert.equal(octD1.isImmature, false, 'October D1 has eligible users');
  assert.ok(octD1.rate > 0.25 && octD1.rate < 0.40);

  assert.equal(octD7.isImmature, false, 'October D7 has eligible users');
  assert.ok(octD7.rate > 0.10 && octD7.rate < 0.25);

  // D30 MUST be immature
  assert.equal(octD30.isImmature, true, 'October D30 must be marked immature');
  assert.equal(octD30.eligibleUsers, 0, 'October D30 eligible users must be 0');
  assert.equal(octD30.rate, null, 'October D30 rate must be null');

  // Full acquisition funnel check across all cohorts
  const funnel = calculateAcquisitionMetrics(cohortRows);
  assert.ok(funnel.installs > 600000);
  assert.ok(funnel.spendUsd > 600000);
  assert.ok(funnel.cpi > 0.85 && funnel.cpi < 0.95, `Blended CPI was $${funnel.cpi}`);
  assert.ok(funnel.tutorialCompletionRate > 0.50 && funnel.tutorialCompletionRate < 0.80);
});

test('Integration Test: A/B experiments primary metric calculation runs accurately', async () => {
  const expMetaRows = await parseCsv(path.resolve('dim_experiment.csv'));
  const expMetaLookup = {};
  for (const e of expMetaRows) expMetaLookup[e.experiment_key] = e;

  const abFactRows = await parseCsv(path.resolve('fact_ab_test_country_variant.csv'));
  assert.equal(abFactRows.length, 1260, 'Expected 1,260 A/B result records');

  // Test first experiment (AB-001)
  const exp1Rows = abFactRows.filter(r => r.experiment_key === '1');
  const exp1Meta = expMetaLookup['1'];

  const evaluation = calculateABExperimentMetrics(exp1Rows, exp1Meta);
  assert.equal(evaluation.experimentCode, 'AB-001');
  assert.ok(evaluation.control.exposed > 1000);
  assert.ok(evaluation.treatment.exposed > 1000);
  assert.ok(evaluation.control.rate > 0);
  assert.ok(evaluation.treatment.rate > 0);
  assert.ok(evaluation.zScore != null);
  assert.ok(evaluation.pValue != null);
});
