import React from 'react';
import { RotateCcw, Filter } from 'lucide-react';

export default function FilterBar({ dimensions, filters, onFilterChange, onReset }) {
  const { games = [], countries = [] } = dimensions;

  const hasActiveFilters = 
    filters.gameKey !== 'ALL' || 
    filters.countryKey !== 'ALL' || 
    filters.platformKey !== 'ALL' || 
    filters.dateRange !== 'ALL';

  return (
    <div className="filter-bar-capsule">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
        <Filter size={14} color="var(--color-secondary)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>Filters</span>
      </div>

      <div className="filter-chip-group">
        <label className="filter-chip-label">Game:</label>
        <select
          className="filter-chip-select"
          value={filters.gameKey}
          onChange={e => onFilterChange('gameKey', e.target.value)}
        >
          <option value="ALL">All Games ({games.length})</option>
          {games.map(g => (
            <option key={g.game_key} value={g.game_key}>
              {g.game_name} ({g.game_genre})
            </option>
          ))}
        </select>
      </div>

      <div className="filter-chip-group">
        <label className="filter-chip-label">Country:</label>
        <select
          className="filter-chip-select"
          value={filters.countryKey}
          onChange={e => onFilterChange('countryKey', e.target.value)}
        >
          <option value="ALL">All Countries ({countries.length})</option>
          {countries.map(c => (
            <option key={c.country_key} value={c.country_key}>
              {c.country_name} ({c.country_code})
            </option>
          ))}
        </select>
      </div>

      <div className="filter-chip-group">
        <label className="filter-chip-label">Platform:</label>
        <select
          className="filter-chip-select"
          value={filters.platformKey}
          onChange={e => onFilterChange('platformKey', e.target.value)}
        >
          <option value="ALL">All Platforms (Android & iOS)</option>
          <option value="2">Android Only</option>
          <option value="1">iOS Only</option>
        </select>
      </div>

      <div className="filter-chip-group">
        <label className="filter-chip-label">Timeframe:</label>
        <select
          className="filter-chip-select"
          value={filters.dateRange}
          onChange={e => onFilterChange('dateRange', e.target.value)}
        >
          <option value="ALL">Full Window (Apr 2025 – Oct 2026)</option>
          <option value="L30">Last 30 Days (Sep 25 – Oct 24, 2026)</option>
          <option value="2026_Q3">2026 Q3 (Jul – Sep 2026)</option>
          <option value="2026_Q2">2026 Q2 (Apr – Jun 2026)</option>
          <option value="2026_YTD">2026 Year-to-Date</option>
          <option value="2025_FULL">2025 Full Year</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          className="action-pill-btn"
          onClick={onReset}
          style={{ marginLeft: 'auto', backgroundColor: 'var(--color-muted)', borderColor: 'var(--color-border)' }}
          title="Reset all filters"
        >
          <RotateCcw size={11} />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
