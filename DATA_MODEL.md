# Gaming Health & Player Analytics — Data Model & Schema Specification

## 1. Overview & Architecture

The analytics data warehouse follows a dimensional star/snowflake schema designed for gaming product performance, acquisition cohort economics, and experimentation.

### Data Model Diagram

```
                 +-----------------------+
                 |       dim_date        |
                 | (date_key, full_date) |
                 +-----------------------+
                             |
                             | date_key
                             v
+------------------+     +-------------------------------+     +--------------------+
|     dim_game     |     |        fact_game_daily        |     |    dim_country     |
| (game_key, name) |---->|  (daily performance, revenue, |<----| (country_key, ISO) |
+------------------+     |       sessions & crashes)     |     +--------------------+
     game_key            +-------------------------------+          country_key
                                         ^
                                         | platform_key
                       +-----------------------------------+
                       |       dim_platform (Virtual)      |
                       |  1: iOS  |  2: Android            |
                       +-----------------------------------+
                                         |
                                         v
+------------------------+     +-----------------------------------+
|   dim_source_channel   |---->| fact_acquisition_cohort_monthly   |
|  (channel_key, name)   |     | (installs, spend, tutorial, D1-30)|
+------------------------+     +-----------------------------------+
       source_channel_key                        |
                                                 | (Isolated grain)
+------------------------+     +-----------------------------------+     +------------------+
|     dim_experiment     |---->|   fact_ab_test_country_variant    |<----|   dim_variant    |
| (experiment_key, code) |     |  (exposed users, success, rev)    |     | (variant_key, A/B|
+------------------------+     +-----------------------------------+     +------------------+
                                                 |
                                                 v
                                    +--------------------------+
                                    |   dim_stakeholder_role   |
                                    +--------------------------+
```

---

## 2. Table Specifications

### A. Fact Tables

#### 1. `fact_game_daily.csv`
- **File size & rows:** 7.6 MB | 120,120 rows
- **Grain:** 1 row per `(date_key, game_key, country_key, platform_key)`
- **Temporal span:** `2025-04-01` to `2026-10-24` (572 days)
- **Schema:**
  | Column Name | Data Type | Nullable | Description / Business Meaning |
  | :--- | :--- | :---: | :--- |
  | `game_daily_key` | Integer | No | Surrogate Primary Key |
  | `date_key` | Integer | No | Foreign Key -> `dim_date.date_key` |
  | `game_key` | Integer | No | Foreign Key -> `dim_game.game_key` (1 to 7) |
  | `country_key` | Integer | No | Foreign Key -> `dim_country.country_key` (1 to 15) |
  | `platform_key` | Integer | No | Platform ID (`1` = iOS, `2` = Android) |
  | `new_users` | Integer | No | Count of newly registered/installed players on this day |
  | `daily_active_users` | Integer | No | Unique players with >= 1 session on this day (DAU) |
  | `sessions` | Integer | No | Total gameplay sessions started |
  | `session_minutes` | Integer | No | Total cumulative player session duration in minutes |
  | `payer_users` | Integer | No | Distinct players who made an IAP purchase |
  | `iap_revenue_usd` | Numeric(10,2) | No | In-app purchase gross revenue in USD |
  | `ad_revenue_usd` | Numeric(10,2) | No | Monetized advertising revenue in USD |
  | `gross_revenue_usd` | Numeric(10,2) | No | Total gross revenue (`iap_revenue_usd + ad_revenue_usd`) |
  | `crash_sessions` | Integer | No | Count of sessions that terminated in an unhandled crash |
  | `crash_rate` | Numeric(6,4) | No | Precalculated row rate (`crash_sessions / sessions`). **Rule:** Never average this column directly across rows. |

---

#### 2. `fact_acquisition_cohort_monthly.csv`
- **File size & rows:** 3.7 MB | 27,930 rows
- **Grain:** 1 row per `(cohort_month_date_key, game_key, country_key, platform_key, source_channel_key)`
- **Temporal span:** 19 monthly cohorts from `2025-04-01` to `2026-10-01`
- **Schema:**
  | Column Name | Data Type | Nullable | Description / Business Meaning |
  | :--- | :--- | :---: | :--- |
  | `acquisition_cohort_key` | Integer | No | Surrogate Primary Key |
  | `cohort_month_date_key` | Integer | No | Foreign Key -> `dim_date.date_key` (first day of cohort month) |
  | `cohort_month` | Date (YYYY-MM-DD) | No | Calendar month start date (e.g. `2025-04-01`) |
  | `period_start_date` | Date (YYYY-MM-DD) | No | Start of reporting observation period |
  | `period_end_date` | Date (YYYY-MM-DD) | No | End of observation period (e.g. `2026-10-24` for MTD) |
  | `period_type` | String | No | Period status (`FULL_MONTH` or `MONTH_TO_DATE`) |
  | `game_key` | Integer | No | Foreign Key -> `dim_game.game_key` |
  | `country_key` | Integer | No | Foreign Key -> `dim_country.country_key` |
  | `platform_key` | Integer | No | Platform ID (`1` = iOS, `2` = Android) |
  | `source_channel_key` | Integer | No | Foreign Key -> `dim_source_channel.source_channel_key` |
  | `impressions` | Integer | No | Ad impressions displayed in UA campaigns |
  | `clicks` | Integer | No | User clicks on UA ads |
  | `installs` | Integer | No | Completed app installs attributed to cohort/channel |
  | `marketing_spend_usd` | Numeric(10,2) | No | Paid acquisition cost in USD |
  | `tutorial_started_users` | Integer | No | Cohort users who initiated onboarding tutorial |
  | `tutorial_completed_users` | Integer | No | Cohort users who finished onboarding tutorial |
  | `d1_eligible_users` | Integer | No | Users whose acquisition date allows a full 24h D1 window |
  | `d1_retained_users` | Integer | No | Eligible users active on Day 1 |
  | `d1_retention_rate` | Numeric(6,4) | No | Row-level rate (`d1_retained_users / d1_eligible_users`) |
  | `d7_eligible_users` | Integer | No | Users whose acquisition date allows a full 7-day window |
  | `d7_retained_users` | Integer | No | Eligible users active on Day 7 |
  | `d7_retention_rate` | Numeric(6,4) | No | Row-level rate (`d7_retained_users / d7_eligible_users`) |
  | `d30_eligible_users` | Integer | No | Users whose acquisition date allows a full 30-day window |
  | `d30_retained_users` | Integer | No | Eligible users active on Day 30 |
  | `d30_retention_rate` | Numeric(6,4) | No | Row-level rate (`d30_retained_users / d30_eligible_users`) |
  | `data_as_of_date` | Date (YYYY-MM-DD) | No | Reporting snapshot date (`2026-10-24`) |

---

#### 3. `fact_ab_test_country_variant.csv`
- **File size & rows:** 86 KB | 1,260 rows
- **Grain:** 1 row per `(experiment_key, date_key, game_key, country_key, platform_key, stakeholder_role_key, variant_key)`
- **Temporal span:** Matches active testing windows of 42 distinct experiments
- **Schema:**
  | Column Name | Data Type | Nullable | Description / Business Meaning |
  | :--- | :--- | :---: | :--- |
  | `ab_test_result_key` | Integer | No | Surrogate Primary Key |
  | `experiment_key` | Integer | No | Foreign Key -> `dim_experiment.experiment_key` |
  | `date_key` | Integer | No | Foreign Key -> `dim_date.date_key` |
  | `game_key` | Integer | No | Foreign Key -> `dim_game.game_key` |
  | `country_key` | Integer | No | Foreign Key -> `dim_country.country_key` |
  | `platform_key` | Integer | No | Platform ID (`1` = iOS, `2` = Android) |
  | `stakeholder_role_key` | Integer | No | Foreign Key -> `dim_stakeholder_role.stakeholder_role_key` |
  | `variant_key` | Integer | No | Foreign Key -> `dim_variant.variant_key` (1: Control, 2: Treatment) |
  | `exposed_users` | Integer | No | Number of distinct users assigned to this variant segment |
  | `primary_metric_success_users` | Integer | No | Numerator count for the experiment's target metric |
  | `primary_metric_denominator` | Integer | No | Denominator count for the experiment's target metric |
  | `primary_metric_rate` | Numeric(6,4) | No | `primary_metric_success_users / primary_metric_denominator` |
  | `d1_retained_users` | Integer | No | Variant users retained on Day 1 |
  | `d7_retained_users` | Integer | No | Variant users retained on Day 7 |
  | `payer_users` | Integer | No | Variant users converted to paid purchasers |
  | `sessions` | Integer | No | Total sessions by variant cohort |
  | `gross_revenue_usd` | Numeric(10,2) | No | Total revenue generated by variant cohort |

---

### B. Dimension Tables

1. **`dim_date.csv`** (640 rows)
   - Keys: `date_key` (PK), `full_date` (Date)
   - Attributes: `day_of_month`, `day_of_week_num`, `day_name`, `week_start_date`, `month_start_date`, `month_name`, `month_num`, `quarter_num`, `quarter_label`, `calendar_year`, `is_weekend` (bool), `is_in_observation_window` (bool), `is_current_quarter` (bool).
   - **Critical Observation Window Boundary:**
     - Days 1 to 572 (`2025-04-01` to `2026-10-24`): `is_in_observation_window = true`.
     - Days 573 to 640 (`2026-10-25` to `2026-12-31`): `is_in_observation_window = false` (future calendar padding, 0 fact rows).

2. **`dim_game.csv`** (7 rows)
   - Keys: `game_key` (PK)
   - Attributes: `game_code` (`SG01` to `SG07`), `game_name`, `game_genre` (Puzzle, Strategy, Merge, Racing, Casual Strategy, Word), `lifecycle_stage` (Live, Growth), `is_synthetic_title` (bool).

3. **`dim_country.csv`** (15 rows)
   - Keys: `country_key` (PK), `country_code` (ISO 2-letter: GB, DE, FR, ES, IT, NL, SE, PL, TR, RO, SA, AE, ZA, EG, IE)
   - Attributes: `country_name`, `region` (EMEA), `subregion` (Western Europe, Southern Europe, Northern Europe, Eastern Europe, Middle East, Africa), `currency_code`, `locale`, `market_size_index`, `retention_index`, `monetization_index`, `timezone_group`.

4. **`dim_platform (Virtual Dimension)`**
   - Keys: `platform_key` (`1`, `2`)
   - Mapping:
     - `platform_key = 1` -> **iOS** (Apple iOS)
     - `platform_key = 2` -> **Android** (Google Android)
   - *Derivation Note:* No standalone `dim_platform.csv` exists in the source files. The mapping is established conclusively via:
     - The business investigation specification: Android recorded crash rate > iOS recorded crash rate.
     - Empirical facts: Platform 2 has an aggregate crash rate of 0.6832%, while Platform 1 has an aggregate crash rate of 0.3833%.

5. **`dim_source_channel.csv`** (7 rows)
   - Keys: `source_channel_key` (PK)
   - Attributes: `source_channel_name` (Organic, Paid Social, Search Ads, Ad Networks, Cross-Promotion, Influencer, App Store Referral), `channel_group`, `is_paid_channel` (bool), `is_trackable_click_channel` (bool).

6. **`dim_experiment.csv`** (42 rows)
   - Keys: `experiment_key` (PK)
   - Attributes: `experiment_code` (AB-001 to AB-042), `experiment_name`, `test_area` (Offer Framing, Onboarding, Store Layout, LiveOps Events, Difficulty Curve, Ad Frequency), `hypothesis`, `primary_success_metric` (`d7_retention_rate`, `payer_conversion_rate`, `tutorial_completion_rate`, etc.), `start_date`, `planned_end_date`, `status_as_of_2026_10_24`, `is_synthetic_experiment`.

7. **`dim_variant.csv`** (2 rows)
   - Keys: `variant_key` (PK)
   - Attributes: `variant_code` (`A`, `B`), `variant_name` (`Control`, `Treatment`), `is_control` (`true`, `false`).

8. **`dim_stakeholder_role.csv`** (24 rows)
   - Keys: `stakeholder_role_key` (PK)
   - Attributes: `role_title`, `department`, `career_level`, `reader_group`, `primary_analytics_use`, `is_synthetic_role`.

---

## 3. Strict Analytical Calculation Formulas

### 1. Weighted Crash Rate
$$\text{Weighted Crash Rate} = \frac{\sum \text{crash\_sessions}}{\sum \text{sessions}}$$
*Data Rule:* Never compute the arithmetic mean of precomputed row-level `crash_rate` columns. Always sum counts across the target partition.

### 2. Android vs. iOS Crash Gap
$$\text{Crash Rate Gap (pp)} = \left(\text{Weighted Crash Rate}_{\text{Android}} - \text{Weighted Crash Rate}_{\text{iOS}}\right) \times 100$$
$$\text{Relative Gap (\%)} = \frac{\text{Weighted Crash Rate}_{\text{Android}} - \text{Weighted Crash Rate}_{\text{iOS}}}{\text{Weighted Crash Rate}_{\text{iOS}}} \times 100$$
*Data Rule:* Always display the absolute gap in percentage points (pp). Clearly distinguish and label the relative percentage ratio/lift separately.

### 3. Investigation-Priority Excess Crash Benchmark
$$\text{Expected Android Crash Sessions} = \text{Android Sessions} \times \text{iOS Crash Rate}_{\text{segment}}$$
$$\text{Estimated Excess Crash Sessions} = \max\left(0, \text{Actual Android Crash Sessions} - \text{Expected Android Crash Sessions}\right)$$
*Data Rule:* This metric is an analytical benchmarking estimate indicating how many fewer crashes Android would have experienced had it matched the iOS baseline for the same segment. It must be explicitly labeled as an investigation benchmark, not confirmed preventable crashes.

### 4. Acquisition Funnel Metrics
$$\text{Cost Per Install (CPI)} = \frac{\sum \text{marketing\_spend\_usd}}{\sum \text{installs}}$$
$$\text{Click-Through Rate (CTR)} = \frac{\sum \text{clicks}}{\sum \text{impressions}}$$
$$\text{Conversion Rate (CVR)} = \frac{\sum \text{installs}}{\sum \text{clicks}}$$
$$\text{Tutorial Completion Rate} = \frac{\sum \text{tutorial\_completed\_users}}{\sum \text{tutorial\_started\_users}}$$

### 5. Cohort Retention Rates (Maturity Handling)
$$\text{D1 Retention Rate} = \frac{\sum \text{d1\_retained\_users}}{\sum \text{d1\_eligible\_users}} \quad (\text{Valid when } \sum \text{d1\_eligible\_users} > 0)$$
$$\text{D7 Retention Rate} = \frac{\sum \text{d7\_retained\_users}}{\sum \text{d7\_eligible\_users}} \quad (\text{Valid when } \sum \text{d7\_eligible\_users} > 0)$$
$$\text{D30 Retention Rate} = \frac{\sum \text{d30\_retained\_users}}{\sum \text{d30\_eligible\_users}} \quad (\text{Valid when } \sum \text{d30\_eligible\_users} > 0)$$
*Data Rules on Retention Maturity:*
- Never divide by total installs when eligible user counts exist.
- When `d30_eligible_users = 0` (such as the October 2026 month-to-date cohort), the metric value is **`null` / Undefined (Immature)**, NOT `0.0%`.
- For September 2026, partial maturity must be calculated strictly against `d30_eligible_users`.

### 6. A/B Testing Evaluation & Statistical Significance
$$\text{Success Rate } p = \frac{\sum \text{primary\_metric\_success\_users}}{\sum \text{primary\_metric\_denominator}}$$
$$\text{Absolute Lift (pp)} = (p_{\text{treatment}} - p_{\text{control}}) \times 100$$
$$\text{Relative Lift (\%)} = \frac{p_{\text{treatment}} - p_{\text{control}}}{p_{\text{control}}} \times 100$$

**Two-Proportion Z-Test:**
$$p_{\text{pooled}} = \frac{x_{\text{treatment}} + x_{\text{control}}}{n_{\text{treatment}} + n_{\text{control}}}$$
$$SE = \sqrt{p_{\text{pooled}} (1 - p_{\text{pooled}}) \left(\frac{1}{n_{\text{treatment}}} + \frac{1}{n_{\text{control}}}\right)}$$
$$Z = \frac{p_{\text{treatment}} - p_{\text{control}}}{SE}, \quad p\text{-value} = 2 \cdot (1 - \Phi(|Z|))$$
*Significance threshold:* Statistically significant if $p\text{-value} < 0.05$ ($|Z| \ge 1.96$).

---

## 4. Join Integrity & Boundary Constraints

1. **Isolation of Fact Grains:**
   - Do **NOT** perform SQL or relational joins between `fact_game_daily`, `fact_acquisition_cohort_monthly`, and `fact_ab_test_country_variant`.
   - Joining daily performance rows to monthly cohort rows or experiment rows produces Cartesian fan-out, multiplying sessions, spend, and revenue.
2. **Dimension Filtering:**
   - Filtering by `dim_game`, `dim_country`, or `dim_date` applies cleanly across all fact tables via their shared surrogate foreign keys (`game_key`, `country_key`, `date_key`).
3. **Data Limitations (Documented, Not Fabricated):**
   - **Device Models & OS Versions:** The source telemetry lacks hardware manufacturer, GPU tier, or OS build details (e.g., Android 11 vs 14). Root-cause triage must focus on Game architecture (Turbo Trail, Puzzle Harbor) and regional network/infrastructure differences (Spain, UK, Germany) while advising engineering teams to deploy device-level telemetry.
