import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputNumberModule } from 'primeng/inputnumber';

import { DataService } from '../data.service';
import {
  Manifest,
  ManifestTab,
  PlayerRow,
  ColumnSpec,
  AdvancedFilters,
  NumericFilter,
} from '../types';
import {
  fmt,
  fmtHeight,
  isNum,
  daysLeftFromIso,
  contractDaysLeftClass,
  formatDaysLeft,
} from '../util';

type ColMeta = ColumnSpec & {
  kind: 'name' | 'percent' | 'physical' | 'text' | 'money' | 'contract_days' | 'numeric' | 'height';
};

@Component({
  standalone: true,
  selector: 'app-players-list',
  imports: [
    CommonModule,
    FormsModule,
    ToolbarModule,
    InputTextModule,
    TableModule,
    TagModule,
    SelectModule,
    ButtonModule,
    DrawerModule,
    InputNumberModule,
  ],
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent implements OnInit, OnDestroy {
  @ViewChild('dt') dt!: Table;

  manifest: Manifest | null = null;
  tabs: ManifestTab[] = [];
  selectedTabName: string | null = null;

  loading = false;
  rows: PlayerRow[] = [];
  filteredRows: PlayerRow[] = [];
  cols: ColMeta[] = [];

  // Filter panel
  showFilterPanel = false;

  advancedFilters: AdvancedFilters = {
    text: {},
    numeric: {},
    select: {},
  };

  // Foot options
  footOptions = [
    { label: 'Both', value: null },
    { label: 'Left', value: 'Left' },
    { label: 'Right', value: 'Right' },
  ];

  private numericKinds = new Set<ColMeta['kind']>([
    'numeric',
    'money',
    'percent',
    'physical',
    'contract_days',
    'height',
  ]);

  isNumericColumn(col: ColMeta): boolean {
    return this.numericKinds.has(col.kind);
  }

  isFootColumn(col: ColMeta): boolean {
    return col.key === 'foot' || col.key === 'foot_17';
  }

  constructor(private data: DataService) {}

  ngOnInit() {
    this.loading = true;
    this.data.getManifest().subscribe({
      next: (m) => {
        this.manifest = m;
        this.tabs = m.tabs ?? [];
        this.selectedTabName =
          this.tabs.find((t) => t.name === 'Goalkeeper')?.name || this.tabs[0]?.name || null;
        if (this.selectedTabName) this.loadTab(this.selectedTabName);
      },
      error: (err) => {
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {}

  onTabChange() {
    if (this.selectedTabName) {
      this.clearAdvancedFilters();
      this.loadTab(this.selectedTabName);
    }
  }

  private classify(col: ColumnSpec): ColMeta['kind'] {
    if (col.key === 'contract_days_left') return 'contract_days';
    if (col.sticky || col.key === 'player_name') return 'name';
    if (
      col.key === 'market_value' ||
      col.key === 'cost_per_point_k' ||
      col.key === 'value_for_money'
    )
      return 'money';
    if (col.key === 'height') return 'height';
    if (col.banding === 'fixed') return 'percent';
    if (col.banding === 'percentile') return 'physical';
    if (col.type === 'number' || col.type === 'int') return 'numeric';
    return 'text';
  }

  private buildColumns(tab: ManifestTab, sample: PlayerRow[]) {
    let cols = tab.columns
      .filter((c) => (c.key !== 'tm_url' && c.key !== 'contract_expires') || c.sticky)
      .map((c) => ({
        ...c,
        kind: this.classify(c),
      }));

    // Find if we have contract_expires data in the rows
    const hasContractExpires = sample.length > 0 && 'contract_expires' in sample[0];

    // If contract_expires exists in data, add days left column before market_value
    if (hasContractExpires) {
      const marketValueIndex = cols.findIndex((c) => c.key === 'market_value');
      const insertIndex = marketValueIndex >= 0 ? marketValueIndex : cols.length;

      // Create synthetic column for days left
      const daysLeftCol: ColMeta = {
        key: 'contract_days_left',
        label: 'Contract Days Left',
        type: 'number',
        kind: 'contract_days',
        banding: null,
        percentiles: null,
        sticky: false,
        link_key: null,
      };

      cols.splice(insertIndex, 0, daysLeftCol);
    }

    this.cols = cols;
    this.resetAdvancedFiltersStructure();
  }

  private loadTab(name: string) {
    const tab = this.tabs.find((t) => t.name === name);
    if (!tab) return;

    this.loading = true;
    this.data.getTab(tab.file).subscribe({
      next: (rows) => {
        this.rows = rows || [];

        // Calculate contract_days_left for each row and add it to the row data
        this.rows.forEach((row) => {
          if (row['contract_expires']) {
            const days = daysLeftFromIso(row['contract_expires']);
            row['contract_days_left'] = days;
          } else {
            row['contract_days_left'] = null;
          }
        });

        this.buildColumns(tab, this.rows);
        this.applyAdvancedFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
      },
    });
  }

  /** Toggle filter panel */
  toggleFilterPanel() {
    this.showFilterPanel = !this.showFilterPanel;
  }

  applyAdvancedFilters() {
    const { text, numeric, select } = this.advancedFilters;

    this.filteredRows = this.rows.filter((row) => {
      for (const col of this.cols) {
        const key = col.key;

        // Select filters (e.g. foot)
        const selVal = select[key];
        if (selVal != null) {
          const raw = row[key];
          if (raw !== selVal) return false;
        }

        // Numeric filters (min/max)
        const nf = numeric[key];
        if (nf && (nf.min != null || nf.max != null)) {
          const raw = row[key];
          const num = typeof raw === 'number' ? raw : raw == null ? null : Number(raw);

          if (num == null || Number.isNaN(num)) return false;
          if (nf.min != null && num < nf.min) return false;
          if (nf.max != null && num > nf.max) return false;
        }

        // Text filters (contains, case-insensitive)
        const tf = text[key];
        if (tf && tf.trim()) {
          const needle = tf.trim().toLowerCase();
          const raw = row[key];
          const valueStr = (raw ?? '').toString().toLowerCase();
          if (!valueStr.includes(needle)) return false;
        }
      }

      return true;
    });
  }

  private resetAdvancedFiltersStructure() {
    const text: Record<string, string> = {};
    const numeric: Record<string, NumericFilter> = {};
    const select: Record<string, any | null> = {};

    for (const c of this.cols) {
      if (this.isNumericColumn(c)) {
        numeric[c.key] = { min: null, max: null };
      } else if (this.isFootColumn(c)) {
        select[c.key] = null;
      } else {
        text[c.key] = '';
      }
    }

    this.advancedFilters = { text, numeric, select };
  }

  clearAdvancedFilters() {
    this.resetAdvancedFiltersStructure();
    this.applyAdvancedFilters();
  }

  removeFilter(filterKey: string) {
    if (this.advancedFilters.text[filterKey] !== undefined) {
      this.advancedFilters.text[filterKey] = '';
    }
    if (this.advancedFilters.numeric[filterKey] !== undefined) {
      this.advancedFilters.numeric[filterKey] = { min: null, max: null };
    }
    if (this.advancedFilters.select[filterKey] !== undefined) {
      this.advancedFilters.select[filterKey] = null;
    }
    this.applyAdvancedFilters();
  }

  getActiveFilterCount(): number {
    return this.getFilterChips().length;
  }

  getFilterChips(): { key: string; label: string }[] {
    const chips: { key: string; label: string }[] = [];

    for (const col of this.cols) {
      const key = col.key;
      const labelBase = col.label;

      const tf = this.advancedFilters.text[key];
      if (tf && tf.trim()) {
        chips.push({ key, label: `${labelBase}: "${tf.trim()}"` });
        continue;
      }

      const nf = this.advancedFilters.numeric[key];
      if (nf && (nf.min != null || nf.max != null)) {
        let label = `${labelBase}: `;
        if (nf.min != null && nf.max != null) label += `${nf.min} – ${nf.max}`;
        else if (nf.min != null) label += `≥ ${nf.min}`;
        else if (nf.max != null) label += `≤ ${nf.max}`;
        chips.push({ key, label });
        continue;
      }

      const sel = this.advancedFilters.select[key];
      if (sel != null) {
        chips.push({ key, label: `${labelBase}: ${sel}` });
      }
    }

    return chips;
  }

  /** Get cell classes for styling */
  getCellClasses(row: PlayerRow, col: ColMeta): string {
    const classes: string[] = [];

    if (col.sticky) {
      classes.push('sticky-name');
    }

    if (col.kind === 'physical') {
      classes.push('physical-stat');
    }

    if (col.key === 'market_value') {
      classes.push('market-value');
    }

    return classes.join(' ');
  }

  /** Get badge class for fixed TL scores (0-100) */
  getBadgeClass(row: PlayerRow, col: ColMeta): string {
    const value = row[col.key];
    if (!isNum(value)) return '';

    if (value >= 90) return 'band-dg';
    if (value >= 80) return 'band-g';
    if (value >= 70) return 'band-lg';
    if (value >= 60) return 'band-y';
    if (value >= 50) return 'band-o';
    return 'band-r';
  }

  /** Get badge class for physical stats (percentile based) */
  getPhysicalBadgeClass(row: PlayerRow, col: ColMeta): string {
    const value = row[col.key];
    const percentiles = col.percentiles;

    if (!isNum(value) || !percentiles || percentiles.p50 == null) return '';

    if (value >= (percentiles.p90 ?? Infinity)) return 'physical-dg';
    if (value >= (percentiles.p80 ?? Infinity)) return 'physical-g';
    if (value >= (percentiles.p70 ?? Infinity)) return 'physical-lg';
    if (value >= (percentiles.p60 ?? Infinity)) return 'physical-y';
    if (value >= (percentiles.p50 ?? Infinity)) return 'physical-o';
    return 'physical-r';
  }

  /** Format physical stats with appropriate decimals */
  formatPhysical(value: any): string {
    if (value == null) return '—';
    if (!isNum(value)) return String(value);
    return value.toFixed(2);
  }

  /** Get contract days left */
  getContractDaysLeft(row: PlayerRow): number | null {
    return row['contract_days_left'] ?? null;
  }

  /** Get contract days class for color-coding */
  getContractDaysClass(row: PlayerRow): string {
    const days = this.getContractDaysLeft(row);
    return contractDaysLeftClass(days);
  }

  /** Format contract days - just show the number */
  formatContractDays(row: PlayerRow): string {
    const days = this.getContractDaysLeft(row);
    return formatDaysLeft(days);
  }

  /** Display value with formatting */
  display(row: PlayerRow, col: ColMeta): string {
    const value = row[col.key];

    if (col.kind === 'height') {
      return fmtHeight(value);
    }

    return fmt(value, col.key);
  }

  /** Get Transfermarkt link */
  tmLink(row: PlayerRow): string | null {
    const lk = this.cols.find((c) => c.sticky && c.link_key)?.link_key || 'tm_url';
    const v = row[lk];
    return typeof v === 'string' && v ? v : null;
  }

  /** Get all column keys for global filtering */
  globalFields(): string[] {
    return this.cols.map((c) => c.key);
  }
}
