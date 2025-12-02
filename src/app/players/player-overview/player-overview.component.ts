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
    // If player is already past or at peak, their max is roughly their current rating
    if (age >= peakAge) {
      return Math.max(currentRating, Math.min(99, currentRating + 1));
    }

    const yearsToGrow = peakAge - age;

    // Base potential growth per year based on current rating tier
    let projectedGrowthPerYear = 0;
    let absoluteCeiling = 99;

    if (currentRating < 40) {
      projectedGrowthPerYear = 3.5;
      absoluteCeiling = 75;
    } else if (currentRating < 50) {
      projectedGrowthPerYear = 3.0;
      absoluteCeiling = 80;
    } else if (currentRating < 60) {
      projectedGrowthPerYear = 2.5;
      absoluteCeiling = 85;
    } else if (currentRating < 70) {
      projectedGrowthPerYear = 2.0;
      absoluteCeiling = 88;
    } else if (currentRating < 80) {
      projectedGrowthPerYear = 1.5;
      absoluteCeiling = 92;
    } else if (currentRating < 90) {
      projectedGrowthPerYear = 1.0;
      absoluteCeiling = 96;
    } else {
      projectedGrowthPerYear = 0.5;
      absoluteCeiling = 99;
    }

    // Influence of current growth rate (if positive)
    // If they are growing fast, boost the projection slightly
    // We limit the influence of slope to avoid overreacting to one good season
    const positiveGrowth = Math.max(0, Math.min(5, growthRate));
    const blendedGrowth = (projectedGrowthPerYear * 2 + positiveGrowth) / 3;

    // Calculate projected peak
    const projectedPeak = currentRating + yearsToGrow * blendedGrowth;

    // Apply ceiling
    return Math.min(absoluteCeiling, Math.min(99, projectedPeak));
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

    const currentAge = isNum(this.player['age']) ? (this.player['age'] as number) : 26;

    const histAges: number[] = [];
    const histVals: number[] = [];
    const nYears = yearCols.length;

    yearCols.forEach((c, idx) => {
      const v = this.player?.[c.key];
      if (isNum(v)) {
        const approxAge = currentAge - (nYears - 1 - idx);
        histAges.push(approxAge);
        histVals.push(v as number);
      }
    });

    // If no history, try to use current stats
    if (!histVals.length) {
      const currentRating = isNum(this.player['overall_avg_last_4'])
        ? (this.player['overall_avg_last_4'] as number)
        : null;

      if (currentRating !== null) {
        histAges.push(currentAge);
        histVals.push(currentRating);
      } else {
        this.trendData = null;
        return;
      }
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

    // Calculate realistic maximum ceiling based on current performance
    const cfg = this.ageCurveConfig[group] || this.ageCurveConfig['Other'];
    const peakStart = cfg.peakStart;
    const peakEnd = cfg.peakEnd;
    const peakAge = Math.floor((peakStart + peakEnd) / 2);

    const projectedPeak = this.calculateRealisticMaximum(lastVal, lastAge, peakAge, slope);

    for (const age of labels) {
      let val: number;

      if (age <= lastAge) {
        if (histMap.has(age)) {
          val = histMap.get(age)!;
        } else {
          // Interpolate missing history
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
        // Future projection
        if (age < peakStart) {
          // Growth phase
          // Interpolate from lastVal (at lastAge) to projectedPeak (at peakStart)
          const totalYears = peakStart - lastAge;
          const yearsPassed = age - lastAge;
          
          // If already past peakStart but logic brought us here (shouldn't happen if lastAge >= peakStart)
          if (totalYears <= 0) {
             val = projectedPeak;
          } else {
             const progress = Math.max(0, Math.min(1, yearsPassed / totalYears));
             // Ease out curve: fast growth early, slowing down
             const curve = 1 - Math.pow(1 - progress, 1.5);
             val = lastVal + (projectedPeak - lastVal) * curve;
          }
        } else if (age <= peakEnd) {
          // Peak phase
          val = projectedPeak;
        } else {
          // Decline phase
          const yearsPastPeak = age - peakEnd;
          const declinePerYear = 2.0; // Standard decline
          val = projectedPeak - yearsPastPeak * declinePerYear;
        }

        // Safety clamps
        val = Math.max(40, Math.min(99, val));
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
    let yMin = Math.max(40, Math.floor(minVal - 5));
    let yMax = Math.min(99, Math.ceil(maxVal + 3));
    if (yMax - yMin < 10) yMax = yMin + 10;

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
