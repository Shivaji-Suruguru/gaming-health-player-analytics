# Gaming Health & Player Analytics

An interactive product analytics web application and portfolio project inspired by the **Zynga Data Analyst Intern** job specification.

> **Synthetic Data Notice:**
> This portfolio project uses synthetic data generated for a Zynga-inspired gaming analytics case study. The figures are simulated and do not represent Zynga's actual internal performance.

---

## 1. Primary Business Problem & Investigation Findings

### The Central Question
**Why does Android have a higher recorded crash rate than iOS, which games and countries contribute most to that gap, and where should the product team investigate first?**

### Empirical Data Validation
Across the 572-day observation window (`2025-04-01` to `2026-10-24`), calculations across all 120,120 rows in `fact_game_daily.csv` demonstrate:

| Platform Key | Inferred Platform | Gameplay Sessions | Crash Sessions | Weighted Crash Rate | Platform Gap (pp) | Relative Gap | Ratio |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **iOS** | 45,736,323 | 175,288 | **0.3833%** | — | — | Baseline |
| **2** | **Android** | 58,107,345 | 396,961 | **0.6832%** | **+0.30 pp** (+0.2999 pp) | **+78.2%** | **1.78x** |

### Key Findings
1. **Structural Measurement Invariance:** The monthly ratio of Android-to-iOS crash rates has remained constant across all 19 months (ranging strictly between **1.76x and 1.81x**). This persistent baseline points to **telemetry reporting differences** between Google Play Vitals (capturing background ANRs) and Apple MetricKit (crash-only logging), alongside lower memory limits on budget Android chipsets.
2. **Game-Level Outliers (Rate vs. Volume):**
   - **Highest Crash Rate:** **Turbo Trail (Racing)** at **0.7709% on Android** vs. **0.4688% on iOS** (+0.302 pp gap). Real-time 3D physics rendering and memory pressure overload budget Android GPUs.
   - **Highest Crash Volume:** **Puzzle Harbor (Puzzle)** at **74,097 Android crashes** (generating **33,401 estimated excess crashes** above the iOS baseline) driven by its large DAU base.
3. **Country Drivers:**
   - **Volume Priority (Western Europe):** **United Kingdom** (43,579 Android crashes, 19.1k excess), **Germany** (39,520 crashes, 17.3k excess), and **France** (36,058 crashes, 15.6k excess) account for over 119,000 total Android crashes.
   - **Rate Priority (Regional Device Mix):** **Spain** (0.6864%), **Saudi Arabia** (0.6871%), and **Sweden** (0.6854%) exhibit the highest crash rates.
4. **Engineering Action Plan:**
   - *Action 1:* Profile memory allocations, particle systems, and shader pipelines for **Turbo Trail**.
   - *Action 2:* Audit ANR handler timeouts and network retries for **Puzzle Harbor** in the UK and Germany.
   - *Action 3:* Align telemetry logging definitions between Android (Firebase Crashlytics / Google Play Vitals ANR) and iOS (MetricKit / Crashlytics) with Software Engineering Leads.

---

## 2. Project Architecture

The application is structured into a clean decoupled analytical architecture:

```
├── public/
│   ├── csv/                   # Original source CSV files available for download
│   └── data/                  # Compressed analytical JSON schemas & dimension maps
├── scripts/
│   └── prepare-data.js        # Data ingestion and pre-compilation script
├── src/
│   ├── analytics/
│   │   ├── metrics.js         # Pure functional analytical calculation library
│   │   └── dataService.js     # Query, filter, and aggregation engine
│   ├── components/
│   │   ├── Header.jsx         # Floating capsule navigation bar
│   │   ├── FilterBar.jsx      # Multi-dimensional pill filters (Game, Country, Platform, Date)
│   │   ├── ExecutiveOverview.jsx   # View 1: No-scroll summary & trajectory
│   │   ├── PlatformStability.jsx   # View 2: Monthly/Weekly trend analysis & PoP matrix
│   │   ├── GameDiagnostics.jsx     # View 3: Grouped bar chart & rate vs volume rankings
│   │   ├── CountryInvestigation.jsx# View 4: Stacked benchmark vs excess & triage matrix
│   │   └── PlayerGrowthExperiments.jsx # View 5: Cohort retention matrix & A/B testing scorecard
│   ├── App.jsx                # Main application coordinator
│   ├── main.jsx               # React 19 entry point with global Chart.js registration
│   └── index.css              # Lovart Light Design System stylesheet
├── test/
│   └── metrics.test.js        # Automated unit and real-data integration test suite
├── DATA_MODEL.md              # Full data warehouse specification & grain documentation
├── lovart.ai-design.md        # Authoritative UI design specification
├── package.json
└── vite.config.js
```

### Analytical Engine Principles
- **No row rate averaging:** Crash rates are calculated as $\frac{\sum \text{crash\_sessions}}{\sum \text{sessions}}$.
- **No fact joins:** Daily performance facts, acquisition cohort facts, and A/B experiment facts are isolated to prevent Cartesian fan-out and measure duplication.
- **Strict retention maturity:** For October 2026 MTD, `d30_eligible_users = 0`, and the metric is reported as `null` / `Immature`, never converted into an artificial 0.0% retention drop.
- **Statistical significance testing:** A/B tests evaluate primary metrics using a **Two-Proportion Z-Test** ($p$-value and 95% confidence intervals).

---

## 3. Setup and Run Instructions

### Prerequisites
- Node.js (version 18 or higher; tested on v22.13.0)
- npm (version 9 or higher)

### Installation
```bash
# Clone or navigate to the project directory
cd ANALYST

# Install dependencies
npm install
```

### Running Locally
```bash
# Start the local Vite development server
npm run dev

# Open your browser to http://127.0.0.1:3000/
```

### Running the Test Suite
```bash
# Run unit and real-data integration tests via Node's native test runner
npm test
```

### Building for Production
```bash
# Generate the optimized production bundle in /dist
npm run build

# Preview the production build locally
npm run preview
```

---

## 4. Deployment Instructions

Because the application is built using a static Single Page Application (SPA) architecture with pure client-side data queries, it can be deployed to any modern static hosting service with **zero backend server maintenance**.

### Option A: Vercel (Recommended)
1. Install the Vercel CLI: `npm install -g vercel`
2. Run `vercel` from the project root.
3. Accept the default build settings (`npm run build`, output directory: `dist`).

### Option B: Netlify
1. Connect the GitHub repository or run `npx netlify deploy --prod`.
2. Set Build Command: `npm run build`.
3. Set Publish Directory: `dist`.

### Option C: GitHub Pages
1. In `vite.config.js`, set `base: './'`.
2. Run `npm run build`.
3. Deploy the contents of the `dist/` directory to the `gh-pages` branch.

---

## 5. Completed Validation Checks

| Validation Area | Specific Check Performed | Status |
| :--- | :--- | :---: |
| **Crash Rate Metric** | Verified weighted calculation: $\frac{\sum \text{crash\_sessions}}{\sum \text{sessions}}$ across 120,120 rows. | **Passed** |
| **Platform Gap** | Verified iOS = 0.3833%, Android = 0.6832%, Gap = +0.2999 pp (+78.2% relative, 1.78x). | **Passed** |
| **Totals Verification** | 103,843,668 gameplay sessions and 572,249 crash sessions verified portfolio-wide. | **Passed** |
| **Game Diagnostics** | Verified Turbo Trail has the highest crash rate (0.7709%) and Puzzle Harbor has the highest volume (74,097 crashes). | **Passed** |
| **Country Distribution** | Verified UK, Germany, and France represent the top 3 volume contributors (>119k crashes). | **Passed** |
| **Retention Denominators** | Verified October 2026 MTD D30 has 0 eligible users and renders as `Immature` (not 0.0%). | **Passed** |
| **A/B Experiment Calculations** | Verified 42 tests evaluate assigned primary metrics with Two-Proportion Z-Test $p$-values. | **Passed** |
| **Interactive Filters** | Verified Game, Country, Platform, and Date Range filters reactively recompute all views. | **Passed** |
| **Responsive Layout** | Verified desktop (1536px) and tablet/mobile viewports render cleanly without horizontal overflow. | **Passed** |
| **Zero Console Errors** | Verified all Chart.js controllers, scales, and elements render without browser warnings. | **Passed** |

---

## 6. Known Limitations & Documented Data Boundaries

The following items reflect intentional data boundaries rather than application defects:
1. **No Device Hardware / OS Build Grain:** The source telemetry does not include device manufacturer (e.g. Samsung vs. Xiaomi), GPU model, or Android build version (Android 11 vs 14). Product recommendations advise adding hardware-level telemetry tags rather than speculating on absent fields.
2. **October 2026 Incomplete Cohort:** Telemetry stops on October 24, 2026. Therefore, the October 2026 cohort is Month-to-Date (MTD) and its D30 retention window has not matured.
3. **No External Live Refresh API:** The dashboard is an interactive, CSV-backed analytical portfolio tool. Telemetry figures reflect the 572-day observation window and do not claim live real-time stream processing.
