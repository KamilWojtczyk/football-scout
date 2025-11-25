import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';

import { DataService } from '../data.service';
import { Manifest, ManifestTab, PlayerRow, ColumnSpec } from '../types';
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
  ],
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent implements OnInit, OnDestroy {
  manifest: Manifest | null = null;
  tabs: ManifestTab[] = [];
  selectedTabName: string | null = null;

  loading = false;
  globalFilter = '';

  rows: PlayerRow[] = [];
  cols: ColMeta[] = [];

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
        console.error('Failed to load manifest:', err);
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {}

  onTabChange() {
    if (this.selectedTabName) this.loadTab(this.selectedTabName);
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
  }

  private loadTab(name: string) {
    const tab = this.tabs.find((t) => t.name === name);
    if (!tab) return;

    this.loading = true;
    this.globalFilter = '';

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
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load tab:', err);
        this.loading = false;
      },
    });
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
  formatPhysical(value: any, colKey: string): string {
    if (value == null) return '—';
    if (!isNum(value)) return String(value);

    // 1 decimal for speed, sprints, meter/min
    if (['max_speed', 'sprints_90', 'meter_min'].includes(colKey)) {
      return value.toFixed(1);
    }

    // No decimals for distances
    return value.toFixed(0);
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
