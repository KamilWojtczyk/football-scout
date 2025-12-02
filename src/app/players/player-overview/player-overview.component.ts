import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';

import { DataService } from '../../data.service';
import { Manifest, PlayerRow, ColumnSpec } from '../../types';
import { isNum, daysLeftFromIso, contractDaysLeftClass, formatDaysLeft } from '../../util';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { switchMap, map, forkJoin } from 'rxjs';

type Quantiles = [number, number, number, number];

interface PhysicalChartDef {
  key: string;
  label: string;
  data: any;
  options: any;
}

@Component({
  selector: 'app-player-overview',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './player-overview.component.html',
  styleUrls: ['./player-overview.component.scss'],
})
export class PlayerOverviewComponent implements OnInit {
  dataLabelPlugin = ChartDataLabels;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);

  player: PlayerRow | null = null;
  tabName: string | null = null;
  manifest: Manifest | null = null;

  private tabRows: PlayerRow[] = [];

  spiderData: any;
  spiderOptions: any;

  trendData: any;
  trendOptions: any;

  physicalCharts: PhysicalChartDef[] = [];

  private valueQuantiles: Quantiles | null = null;
  private costQuantiles: Quantiles | null = null;

  contractDays: number | null = null;
  contractBadgeClass = '';
  contractBadgeLabel = '';

  private ageCurveConfig: Record<string, { peakStart: number; peakEnd: number }> = {
    GK: { peakStart: 28, peakEnd: 34 },
    CB: { peakStart: 26, peakEnd: 31 },
    FB: { peakStart: 24, peakEnd: 28 },
    '6': { peakStart: 26, peakEnd: 30 },
    '8': { peakStart: 26, peakEnd: 30 },
    '10': { peakStart: 27, peakEnd: 30 },
    '9': { peakStart: 27, peakEnd: 30 },
    Other: { peakStart: 26, peakEnd: 30 },
  };

  get isGoalkeeperTab(): boolean {
    return (this.tabName ?? '').toLowerCase().includes('keeper');
  }

  ngOnInit() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.tabName = params.get('tab');
          const playerName = params.get('name');

          return forkJoin({
            manifest: this.dataService.getManifest(),
          }).pipe(
            switchMap(({ manifest }) => {
              this.manifest = manifest;
              const tab = manifest.tabs.find((t) => t.name === this.tabName);
              if (!tab) {
                throw new Error(`Tab ${this.tabName} not found`);
              }
              console.log(tab);
              return this.dataService
                .getTab(tab.file)
                .pipe(map((rows) => ({ rows, tab, playerName })));
            })
          );
        })
      )
      .subscribe({
        next: ({ rows, tab, playerName }) => {
          this.tabRows = rows || [];
          this.player = this.tabRows.find((r) => r['player_name'] === playerName) || null;

          if (this.player) {
            this.initContractMeta();
            this.initStarQuantiles();
            this.initSpiderChart(tab.columns);
            this.initTrendChart(tab.columns);
            this.initPhysicalCharts(tab.columns);
          }
        },
        error: (err) => console.error(err),
      });
  }

  goBack() {
    this.router.navigate(['/players'], { queryParams: { tab: this.tabName } });
  }

  private initContractMeta() {
    const iso = this.player?.['contract_expires'] as string | undefined;
    this.contractDays = daysLeftFromIso(iso);
    this.contractBadgeClass = contractDaysLeftClass(this.contractDays);
    this.contractBadgeLabel = formatDaysLeft(this.contractDays);
  }

  private computeQuantiles(field: string): Quantiles | null {
    const values = this.tabRows.map((r) => r[field]).filter((v) => isNum(v)) as number[];

    if (!values.length) return null;
    values.sort((a, b) => a - b);

    const idx = (p: number) =>
      values[Math.floor(p * (values.length - 1))] ?? values[values.length - 1];

    return [idx(0.2), idx(0.4), idx(0.6), idx(0.8)];
  }

  private initStarQuantiles() {
    this.valueQuantiles = this.computeQuantiles('value_for_money');
    this.costQuantiles = this.computeQuantiles('cost_per_point_k');
  }

  getStarRating(value: number | null | undefined, type: 'value' | 'cost'): number {
    if (!isNum(value)) return 0;

    if (type === 'value') {
      const q = this.valueQuantiles;
      if (!q) return 0;
      const [q20, q40, q60, q80] = q;
      if (value >= q80) return 5;
      if (value >= q60) return 4;
      if (value >= q40) return 3;
      if (value >= q20) return 2;
      return 1;
    } else {
      const q = this.costQuantiles;
      if (!q) return 0;
      const [q20, q40, q60, q80] = q;
      if (value <= q20) return 5;
      if (value <= q40) return 4;
      if (value <= q60) return 3;
      if (value <= q80) return 2;
      return 1;
    }
  }

  getStarsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => (i < rating ? 1 : 0));
  }

  private initSpiderChart(columns: ColumnSpec[]) {
    const spiderCols = columns.filter(
      (c) =>
        c.banding === 'fixed' && !c.key.match(/^\d{4}(_\d{2})?$/) && c.key !== 'overall_avg_last_4'
    );

    const labels = spiderCols.map((c) => c.label);
    const data = spiderCols.map((c) =>
      isNum(this.player?.[c.key]) ? (this.player as any)[c.key] : 0
    );

    this.spiderData = {
      labels,
      datasets: [
        {
          label: this.player?.['player_name'],
          data,
          fill: true,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235)',
          pointBackgroundColor: 'rgb(54, 162, 235)',
          pointBorderColor: '#fff',
        },
      ],
    };

    this.spiderOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
          grid: { color: 'rgba(255, 255, 255, 0.2)' },
          pointLabels: {
            color: '#9ca3af',
            font: { size: 11 },
          },
          ticks: {
            display: false,
            backdropColor: 'transparent',
          },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
    };
  }

  private getPositionGroup(): string {
    const tab = (this.tabName || '').toUpperCase();
    if (tab.includes('KEEPER') || tab.startsWith('GK')) return 'GK';
    if (tab.startsWith('CB')) return 'CB';
    if (tab.startsWith('FB') || tab.includes('FULL')) return 'FB';
    if (tab.startsWith('6')) return '6';
    if (tab.startsWith('8')) return '8';
    if (tab.startsWith('10') || tab.startsWith('RW') || tab.startsWith('LW')) return '10';
    if (tab.startsWith('9')) return '9';
    return 'Other';
  }

  private calculateRealisticMaximum(
    currentRating: number,
    age: number,
    peakAge: number,
    growthRate: number
  ): number {
    let baseMax: number;

    // Tiered ceiling system based on current performance
    if (currentRating >= 85) {
      baseMax = Math.min(95, currentRating + 5);
    } else if (currentRating >= 75) {
      baseMax = Math.min(85, currentRating + 8);
    } else if (currentRating >= 65) {
      baseMax = Math.min(78, currentRating + 10);
    } else {
      baseMax = Math.min(72, currentRating + 8);
    }

    // Age factor - younger players have more room to grow
    const yearsToPeak = peakAge - age;
    const ageFactor = yearsToPeak > 0 ? Math.min(1.0, yearsToPeak / 5) : 0.5;

    // Growth factor - players showing improvement get a boost
    const growthFactor = Math.max(0.7, Math.min(1.3, 1 + growthRate / 3));

    // Combine factors
    const realisticMax = baseMax * (0.85 + 0.15 * ageFactor) * growthFactor;

    return Math.max(currentRating, Math.min(99, realisticMax));
  }

  private basePotential(age: number, group: string): number {
    const cfg = this.ageCurveConfig[group] || this.ageCurveConfig['Other'];
    const { peakStart, peakEnd } = cfg;

    // More conservative base curve: 70-88 instead of 88-100
    if (age <= peakStart - 4) return 70;
    if (age < peakStart) {
      const t = (age - (peakStart - 4)) / 4;
      return 70 + t * 10; // Ramp from 70 to 80
    }
    if (age <= peakEnd) {
      const span = Math.max(1, peakEnd - peakStart);
      const t = (age - peakStart) / span;
      return 80 + t * 8; // Peak from 80 to 88
    }
    if (age <= peakEnd + 4) {
      const t = (age - peakEnd) / 4;
      return 88 - t * 8; // Decline from 88 to 80
    }
    if (age <= peakEnd + 8) {
      const t = (age - (peakEnd + 4)) / 4;
      return 80 - t * 8; // Further decline from 80 to 72
    }
    return 70; // Late career baseline
  }

  private computeTrendSlope(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;
    const xs = values.map((_, i) => i);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((acc, y, i) => acc + xs[i] * y, 0);
    const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);
    const denom = n * sumX2 - sumX * sumX;
    if (!denom) return 0;
    return (n * sumXY - sumX * sumY) / denom;
  }

  private initTrendChart(columns: ColumnSpec[]) {
    if (!this.player) {
      this.trendData = null;
      return;
    }

    const yearCols = columns.filter((c) => c.key.match(/^\d{4}(_\d{2})?$/));
    yearCols.sort((a, b) => a.key.localeCompare(b.key));
    if (!yearCols.length) {
      this.trendData = null;
      return;
    }

    const currentAge = isNum(this.player['age']) ? (this.player['age'] as number) : 26;

    const histAges: number[] = [];
    const histVals: number[] = [];
    const nYears = yearCols.length;

    yearCols.forEach((c, idx) => {
      const v = this.player?.[c.key];
      if (!isNum(v)) return;
      const approxAge = currentAge - (nYears - 1 - idx);
      histAges.push(approxAge);
      histVals.push(v as number);
    });

    if (!histVals.length) {
      const group = this.getPositionGroup();
      const minAge = Math.max(16, currentAge - 2);
      const maxAge = Math.min(40, currentAge + 10);
      const labels: number[] = [];
      for (let age = minAge; age <= maxAge; age++) labels.push(age);

      // Determine current rating - use overall_avg_last_4 if available, otherwise estimate from base
      const currentRating = isNum(this.player['overall_avg_last_4'])
        ? (this.player['overall_avg_last_4'] as number)
        : 75; // Reasonable default

      const cfg = this.ageCurveConfig[group] || this.ageCurveConfig['Other'];
      const peakAge = Math.floor((cfg.peakStart + cfg.peakEnd) / 2);
      const realisticMax = this.calculateRealisticMaximum(currentRating, currentAge, peakAge, 0);

      const baseCurrent = this.basePotential(currentAge, group);
      const potentialData = labels.map((age) => {
        const base = this.basePotential(age, group);
        let val = base + (baseCurrent - base);
        val = Math.max(70, Math.min(realisticMax, val));
        return val;
      });

      const minVal = Math.min(...potentialData);
      const maxVal = Math.max(...potentialData);
      const yMin = Math.max(60, Math.floor(minVal - 10));
      const yMax = Math.min(99, Math.ceil(maxVal + 3));

      this.trendData = {
        labels: labels.map((a) => a.toString()),
        datasets: [
          {
            label: 'Potential',
            data: potentialData,
            fill: false,
            borderColor: '#a3e635',
            borderWidth: 2,
            tension: 0.35,
          },
        ],
      };

      this.trendOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            min: yMin,
            max: yMax,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#9ca3af' },
            title: { display: true, text: 'Profile score', color: '#9ca3af' },
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#9ca3af' },
            title: { display: true, text: 'Age', color: '#9ca3af' },
          },
        },
      };
      return;
    }

    const histMap = new Map<number, number>();
    histAges.forEach((age, i) => histMap.set(age, histVals[i]));

    const lastAge = histAges[histAges.length - 1];
    const lastVal = histVals[histVals.length - 1];

    const group = this.getPositionGroup();
    const slope = this.computeTrendSlope(histVals);

    const minAge = histAges[0];
    const maxAge = Math.min(40, lastAge + 10);
    const labels: number[] = [];
    for (let age = minAge; age <= maxAge; age++) labels.push(age);

    const potentialData: number[] = [];

    const baseLast = this.basePotential(lastAge, group);
    const shift = lastVal - baseLast;
    const tilt = Math.max(-1.5, Math.min(1.5, slope));

    // Calculate realistic maximum ceiling based on current performance
    const cfg = this.ageCurveConfig[group] || this.ageCurveConfig['Other'];
    const peakAge = Math.floor((cfg.peakStart + cfg.peakEnd) / 2);
    const realisticMax = this.calculateRealisticMaximum(lastVal, lastAge, peakAge, slope);

    for (const age of labels) {
      let val: number;

      if (age <= lastAge) {
        if (histMap.has(age)) {
          val = histMap.get(age)!;
        } else {
          let prevIdx = -1;
          let nextIdx = -1;
          for (let i = 0; i < histAges.length; i++) {
            if (histAges[i] < age) prevIdx = i;
            if (histAges[i] > age) {
              nextIdx = i;
              break;
            }
          }

          if (prevIdx === -1 || nextIdx === -1) {
            val = prevIdx === -1 ? histVals[0] : histVals[histVals.length - 1];
          } else {
            const prevAge = histAges[prevIdx];
            const nextAge = histAges[nextIdx];
            const prevVal = histVals[prevIdx];
            const nextVal = histVals[nextIdx];
            const t = (age - prevAge) / (nextAge - prevAge);
            val = prevVal + t * (nextVal - prevVal);
          }
        }
      } else {
        const base = this.basePotential(age, group);
        const yearsFromLast = age - lastAge;

        const wShift = Math.max(0, 1 - yearsFromLast / 6);
        const wTrend = Math.max(0, 1 - yearsFromLast / 4);

        const extraAgePenalty = Math.max(0, yearsFromLast - 2) * 0.7;

        val = base + shift * wShift + tilt * yearsFromLast * wTrend - extraAgePenalty;

        // Apply realistic maximum ceiling
        val = Math.max(70, Math.min(realisticMax, val));
      }

      potentialData.push(val);
    }

    const actualSeries = new Array(labels.length).fill(null) as (number | null)[];
    labels.forEach((age, idx) => {
      if (histMap.has(age)) {
        actualSeries[idx] = histMap.get(age)!;
      }
    });

    const allVals = [...potentialData, ...histVals];
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    let yMin = Math.max(60, Math.floor(minVal - 6));
    let yMax = Math.min(99, Math.ceil(maxVal + 3));
    if (yMax - yMin < 8) yMax = yMin + 8;

    this.trendData = {
      labels: labels.map((a) => a.toString()),
      datasets: [
        {
          label: 'Potential',
          data: potentialData,
          fill: false,
          borderColor: '#a3e635',
          borderWidth: 2,
          tension: 0.35,
        },
        {
          label: 'Actual OVR',
          data: actualSeries,
          fill: false,
          borderColor: '#22c55e',
          borderDash: [4, 4],
          pointRadius: 3,
          spanGaps: false,
        },
      ],
    };

    this.trendOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          min: yMin,
          max: yMax,
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: '#9ca3af' },
          title: {
            display: true,
            text: 'Profile score',
            color: '#9ca3af',
          },
        },
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          ticks: { color: '#9ca3af' },
          title: {
            display: true,
            text: 'Age',
            color: '#9ca3af',
          },
        },
      },
    };
  }

  private initPhysicalCharts(columns: ColumnSpec[]) {
    this.physicalCharts = [];

    if (this.isGoalkeeperTab || !this.player) {
      return;
    }

    const physicalCols = columns.filter((c) => c.banding === 'percentile');
    if (!physicalCols.length) return;

    const playerName = this.player['player_name'] as string;

    for (const c of physicalCols) {
      const playerVal = isNum(this.player[c.key]) ? (this.player[c.key] as number) : null;

      if (!isNum(playerVal)) continue;

      const vals = this.tabRows.map((r) => r[c.key]).filter((v) => isNum(v)) as number[];
      const avgVal = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

      const data = {
        labels: [''],
        datasets: [
          {
            label: playerName,
            data: [playerVal],
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            borderRadius: 4,
          },
          {
            label: 'Position Avg',
            data: [avgVal],
            backgroundColor: 'rgba(156, 163, 175, 0.85)',
            borderRadius: 4,
          },
        ],
      };

      const options = {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#9ca3af',
              boxWidth: 10,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const raw = ctx.raw;
                if (typeof raw === 'number') {
                  return `${ctx.dataset.label}: ${raw.toFixed(2)}`;
                }
                return `${ctx.dataset.label}: ${raw}`;
              },
            },
          },
          datalabels: {
            color: '#e5e7eb',
            anchor: 'end',
            align: 'end',
            offset: -2,
            font: {
              size: 10,
              weight: '500',
            },
            formatter: (value: any) => {
              if (typeof value === 'number') {
                return value >= 100 ? value.toFixed(0) : value.toFixed(1);
              }
              return value;
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#9ca3af' },
          },
          x: {
            grid: { display: false },
            ticks: { display: false },
          },
        },
      };

      this.physicalCharts.push({
        key: c.key,
        label: c.label,
        data,
        options,
      });
    }
  }

  getPlayerImage(player: PlayerRow): string {
    const img = player['image_url'] as string | undefined;
    return img && img.length
      ? img
      : 'https://img.a.transfermarkt.technology/portrait/header/default.jpg?lm=1';
  }
}
