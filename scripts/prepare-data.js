import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

// Helper to parse CSV
async function parseCsv(filePath) {
  const results = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
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

async function run() {
  console.log('Preparing dataset artifacts for web dashboard...');

  const publicDataDir = path.resolve('public/data');
  const publicCsvDir = path.resolve('public/csv');
  fs.mkdirSync(publicDataDir, { recursive: true });
  fs.mkdirSync(publicCsvDir, { recursive: true });

  // 1. Copy raw CSVs to public/csv for transparency and download
  const csvFiles = [
    'dim_country.csv',
    'dim_date.csv',
    'dim_experiment.csv',
    'dim_game.csv',
    'dim_source_channel.csv',
    'dim_stakeholder_role.csv',
    'dim_variant.csv',
    'fact_ab_test_country_variant.csv',
    'fact_acquisition_cohort_monthly.csv',
    'fact_game_daily.csv'
  ];

  for (const f of csvFiles) {
    fs.copyFileSync(path.resolve(f), path.join(publicCsvDir, f));
  }
  console.log(`Copied ${csvFiles.length} raw CSVs to public/csv/`);

  // 2. Parse Dimensions
  const [games, countries, dates, channels, experiments, variants, roles] = await Promise.all([
    parseCsv('dim_game.csv'),
    parseCsv('dim_country.csv'),
    parseCsv('dim_date.csv'),
    parseCsv('dim_source_channel.csv'),
    parseCsv('dim_experiment.csv'),
    parseCsv('dim_variant.csv'),
    parseCsv('dim_stakeholder_role.csv'),
  ]);

  // Construct dimension maps
  const dimensions = {
    games,
    countries,
    // Store only observation window dates or compact date map
    dates: dates.map(d => ({
      date_key: Number(d.date_key),
      full_date: d.full_date,
      month_start_date: d.month_start_date,
      week_start_date: d.week_start_date,
      month_name: d.month_name,
      calendar_year: Number(d.calendar_year),
      quarter_label: d.quarter_label,
      is_in_observation_window: d.is_in_observation_window === 'true',
    })),
    channels,
    experiments,
    variants,
    platforms: [
      { platform_key: 1, platform_name: 'iOS', icon: 'Apple' },
      { platform_key: 2, platform_name: 'Android', icon: 'Smartphone' },
    ],
  };

  fs.writeFileSync(path.join(publicDataDir, 'dimensions.json'), JSON.stringify(dimensions));
  console.log('Saved dimensions.json');

  // 3. Compact daily facts:
  // To make client filtering blazing fast, store:
  // [date_key, game_key, country_key, platform_key, sessions, crash_sessions, dau, gross_revenue_usd]
  console.log('Parsing fact_game_daily.csv...');
  const dailyRows = await parseCsv('fact_game_daily.csv');
  console.log(`Parsed ${dailyRows.length} daily rows. Compacting...`);

  // Compact array format:
  // d: [dk, gk, ck, pk, sess, crash, dau, rev]
  const compactDaily = dailyRows.map(r => [
    Number(r.date_key),
    Number(r.game_key),
    Number(r.country_key),
    Number(r.platform_key),
    Number(r.sessions),
    Number(r.crash_sessions),
    Number(r.daily_active_users),
    Math.round(Number(r.gross_revenue_usd) * 100) / 100,
  ]);

  fs.writeFileSync(path.join(publicDataDir, 'fact_daily_compact.json'), JSON.stringify(compactDaily));
  console.log(`Saved fact_daily_compact.json (${(fs.statSync(path.join(publicDataDir, 'fact_daily_compact.json')).size / (1024 * 1024)).toFixed(2)} MB)`);

  // 4. Monthly Cohorts
  console.log('Parsing fact_acquisition_cohort_monthly.csv...');
  const cohortRows = await parseCsv('fact_acquisition_cohort_monthly.csv');
  const compactCohorts = cohortRows.map(r => ({
    cohort_month: r.cohort_month,
    period_type: r.period_type,
    game_key: Number(r.game_key),
    country_key: Number(r.country_key),
    platform_key: Number(r.platform_key),
    source_channel_key: Number(r.source_channel_key),
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
    installs: Number(r.installs),
    spend: Number(r.marketing_spend_usd),
    tut_start: Number(r.tutorial_started_users),
    tut_done: Number(r.tutorial_completed_users),
    d1_elig: Number(r.d1_eligible_users),
    d1_ret: Number(r.d1_retained_users),
    d7_elig: Number(r.d7_eligible_users),
    d7_ret: Number(r.d7_retained_users),
    d30_elig: Number(r.d30_eligible_users),
    d30_ret: Number(r.d30_retained_users),
  }));

  fs.writeFileSync(path.join(publicDataDir, 'fact_cohorts.json'), JSON.stringify(compactCohorts));
  console.log(`Saved fact_cohorts.json (${(fs.statSync(path.join(publicDataDir, 'fact_cohorts.json')).size / (1024 * 1024)).toFixed(2)} MB)`);

  // 5. AB Tests
  console.log('Parsing fact_ab_test_country_variant.csv...');
  const abRows = await parseCsv('fact_ab_test_country_variant.csv');
  const compactAb = abRows.map(r => ({
    experiment_key: Number(r.experiment_key),
    date_key: Number(r.date_key),
    game_key: Number(r.game_key),
    country_key: Number(r.country_key),
    platform_key: Number(r.platform_key),
    variant_key: Number(r.variant_key),
    exposed: Number(r.exposed_users),
    success: Number(r.primary_metric_success_users),
    denom: Number(r.primary_metric_denominator),
    d1_ret: Number(r.d1_retained_users),
    d7_ret: Number(r.d7_retained_users),
    payer: Number(r.payer_users),
    sessions: Number(r.sessions),
    rev: Number(r.gross_revenue_usd),
  }));

  fs.writeFileSync(path.join(publicDataDir, 'fact_ab_tests.json'), JSON.stringify(compactAb));
  console.log(`Saved fact_ab_tests.json (${(fs.statSync(path.join(publicDataDir, 'fact_ab_tests.json')).size / 1024).toFixed(2)} KB)`);

  console.log('All dataset artifacts successfully prepared!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
