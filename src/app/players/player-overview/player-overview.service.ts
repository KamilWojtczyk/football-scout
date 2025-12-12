import { Injectable } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ColumnSpec, PlayerRow } from '../../types';
import { isNum } from '../../util';
import {
  AGE_BAND_COLORS,
  AGE_BAND_LABELS,
  AGE_CURVE_CONFIG,
  BG_COLORS,
  MARKET_VALUE_COL,
  OVERALL_COL,
  POLAR_GROUP_ORDER,
  POLAR_GROUP_STYLES,
  TAB_POLAR_METRIC_ORDER,
} from './player-overview.constants';
import { AgePeriodKey, PhysicalChartDef, PolarGroupKey, Quantiles } from './player-overview.types';

@Injectable({
  providedIn: 'root',
})
export class PlayerOverviewService {
  getPositionGroup(tabName: string | null): string {
    const tab = (tabName || '').toUpperCase();
    if (tab.includes('GOALKEEPER')) return 'GK';
    if (tab.startsWith('CB')) return 'CB';
    if (tab.startsWith('FB')) return 'FB';
    if (tab.startsWith('#6')) return '6';
    if (tab.startsWith('#8')) return '8';
    if (tab.startsWith('RW') || tab.startsWith('LW')) return '10';
    if (tab.startsWith('#9')) return '9';
    return 'Other';
  }

  getAgePeriod(age: number, group: string): AgePeriodKey {
    if (!group) group = 'Other';

    if (group === 'GK') {
      if (age <= 22) return 'early';
      if (age <= 24) return 'late';
      if (age <= 26) return 'performance';
      if (age <= 29) return 'peak';
      return 'past';
    }

    if (group === 'CB') {
      if (age <= 21) return 'early';
      if (age <= 23) return 'late';
      if (age <= 25) return 'performance';
      if (age <= 28) return 'peak';
      if (age <= 30) return 'past';
      return 'history';
    }

    if (['6', '8', 'FB'].includes(group)) {
      if (age <= 19) return 'early';
      if (age <= 21) return 'late';
      if (age <= 23) return 'performance';
      if (age <= 26) return 'peak';
      if (age <= 28) return 'past';
      return 'history';
    }

    if (group === '10') {
      if (age <= 20) return 'early';
      if (age <= 22) return 'late';
      if (age <= 24) return 'performance';
      if (age <= 27) return 'peak';
      if (age <= 29) return 'past';
      return 'history';
    }

    if (group === '9') {
      if (age <= 21) return 'early';
      if (age <= 23) return 'late';
      if (age <= 25) return 'performance';
      if (age <= 28) return 'peak';
      if (age <= 30) return 'past';
      return 'history';
    }

    // Default 'Other'
    if (age <= 21) return 'early';
    if (age <= 24) return 'late';
    if (age <= 26) return 'performance';
    if (age <= 29) return 'peak';
    return 'past';
  }

  getBandColor(age: number, group: string): string {
    const period = this.getAgePeriod(age, group);
    return AGE_BAND_COLORS[period];
  }

  getScoreColor(value: number): string {
    if (value >= 90) return BG_COLORS.DARK_GREEN;
    if (value >= 80) return BG_COLORS.GREEN;
    if (value >= 70) return BG_COLORS.YELLOW;
    if (value >= 60) return BG_COLORS.ORANGE;
    if (value >= 50) return BG_COLORS.RED;
    return BG_COLORS.DARK_RED;
  }

  getDataLabelValue(ctx: any): number {
    const ds = ctx?.dataset;
    const idx = ctx?.dataIndex;

    if (ds && Array.isArray(ds.data) && typeof idx === 'number') {
      const v = ds.data[idx];
      if (typeof v === 'number' && !Number.isNaN(v)) {
        return v;
      }
    }

    const raw = (ctx as any).raw;
    if (typeof raw === 'number' && !Number.isNaN(raw)) {
      return raw;
    }

    return 0;
  }

  private computeQuantilesFromValues(values: number[]): Quantiles | null {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);

    const idx = (p: number) =>
      sorted[Math.floor(p * (sorted.length - 1))] ?? sorted[sorted.length - 1];

    return [idx(0.2), idx(0.4), idx(0.6), idx(0.8)];
  }

  getValueForMoneyStars(player: PlayerRow | null, allRows: PlayerRow[]): number {
    if (!player) return 0;

    const candidates = allRows.filter((r) => isNum(r[MARKET_VALUE_COL]) && isNum(r[OVERALL_COL]));
    const n = candidates.length;
    if (!n) return 0;

    const mvSortedAsc = [...candidates].sort(
      (a, b) => (a[MARKET_VALUE_COL] as number) - (b[MARKET_VALUE_COL] as number)
    );
    const mvPct = new Map<PlayerRow, number>();

    if (n === 1) {
      mvPct.set(mvSortedAsc[0], 0.5);
    } else {
      mvSortedAsc.forEach((r, i) => {
        mvPct.set(r, i / (n - 1));
      });
    }

    const ovSortedAsc = [...candidates].sort(
      (a, b) => (a[OVERALL_COL] as number) - (b[OVERALL_COL] as number)
    );
    const ovPct = new Map<PlayerRow, number>();

    if (n === 1) {
      ovPct.set(ovSortedAsc[0], 0.5);
    } else {
      ovSortedAsc.forEach((r, i) => {
        ovPct.set(r, i / (n - 1));
      });
    }

    const scoreByPlayer = new Map<PlayerRow, number>();
    const scores: number[] = [];

    for (const r of candidates) {
      const pMv = mvPct.get(r) ?? 0;
      const pOv = ovPct.get(r) ?? 0;
      const score = pOv - pMv;
      scoreByPlayer.set(r, score);
      scores.push(score);
    }

    scores.sort((a, b) => a - b);

    const idx = (p: number) =>
      scores[Math.floor(p * (scores.length - 1))] ?? scores[scores.length - 1];

    const q20 = idx(0.2);
    const q40 = idx(0.4);
    const q60 = idx(0.6);
    const q80 = idx(0.8);

    const thisPlayer = candidates.find(
      (r) => r === player || r['player_name'] === player['player_name']
    );
    if (!thisPlayer) return 0;

    const s = scoreByPlayer.get(thisPlayer);
    if (s == null) return 0;

    if (s >= q80) return 5;
    if (s >= q60) return 4;
    if (s >= q40) return 3;
    if (s >= q20) return 2;
    return 1;
  }

  getPolarChart(
    player: PlayerRow | null,
    columns: ColumnSpec[],
    tabName: string | null
  ): {
    data: ChartConfiguration['data'] | null;
    options: ChartOptions | null;
    legendGroups: PolarGroupKey[];
  } {
    if (!player) {
      return { data: null, options: null, legendGroups: [] };
    }

    const baseCols = columns.filter(
      (c) =>
        c.banding === 'fixed' && !c.key.match(/^\d{4}(_\d{2})?$/) && c.key !== 'overall_avg_last_4'
    );

    const tName = tabName ?? '';
    const tabConfig = TAB_POLAR_METRIC_ORDER[tName] ?? {};

    const colByKey = new Map(baseCols.map((c) => [c.key, c] as const));
    const usedKeys = new Set<string>();

    const ordered: { col: ColumnSpec; group: PolarGroupKey }[] = [];

    for (const group of POLAR_GROUP_ORDER) {
      const keysForGroup = tabConfig[group] ?? [];
      for (const key of keysForGroup) {
        const col = colByKey.get(key);
        if (col && !usedKeys.has(col.key)) {
          ordered.push({ col, group });
          usedKeys.add(col.key);
        }
      }
    }

    for (const col of baseCols) {
      if (!usedKeys.has(col.key)) {
        ordered.push({ col, group: 'control' });
        usedKeys.add(col.key);
      }
    }

    if (!ordered.length) {
      return { data: null, options: null, legendGroups: [] };
    }

    const legendGroups = POLAR_GROUP_ORDER.filter((group) =>
      ordered.some((item) => item.group === group)
    );

    const labels = ordered.map((item) => item.col.label);
    const dataValues = ordered.map((item) =>
      isNum(player?.[item.col.key]) ? (player as any)[item.col.key] : 0
    );
    const groups = ordered.map((item) => item.group);

    const barBackgroundColors = groups.map((g) => POLAR_GROUP_STYLES[g].fill);
    const barBorderColors = groups.map(() => '#111827');

    const data: ChartConfiguration['data'] = {
      labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: barBackgroundColors,
          borderColor: barBorderColors,
          borderWidth: 2,
        },
      ],
    };

    const options: ChartOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (ctx: any) => ctx.chart.data.labels[ctx.dataIndex] + ': ' + ctx.raw,
          },
        },
        datalabels: {
          display: true,
          color: (ctx: any) => {
            const value = this.getDataLabelValue(ctx);
            return this.getScoreColor(value);
          },
          backgroundColor: 'rgba(45, 45, 46)',
          borderRadius: 4,
          font: {
            weight: 'bolder',
            size: 12,
          },
          padding: 4,
          formatter: (value: any) => Math.round(value),
          anchor: 'end',
          align: 'start',
          offset: 0,
        },
      },
      scales: {
        r: {
          grid: {
            color: 'rgba(255, 255, 255, 0.08)',
            circular: true,
          },
          angleLines: {
            display: true,
            color: 'rgba(255, 255, 255, 0.25)',
            lineWidth: 1,
          },
          pointLabels: {
            display: true,
            centerPointLabels: true,
            color: '#9ca3af',
            padding: 5,
            font: {
              size: 10,
            },
            callback: (label: string | string[]) => {
              const strLabel = Array.isArray(label) ? label.join(' ') : label;
              if (strLabel.length <= 20) return strLabel;
              const words = strLabel.split(' ');
              const lines: string[] = [];
              let current = words[0];
              for (let i = 1; i < words.length; i++) {
                if (current.length + words[i].length + 1 < 20) {
                  current += ' ' + words[i];
                } else {
                  lines.push(current);
                  current = words[i];
                }
              }
              lines.push(current);
              return lines;
            },
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

    return { data, options, legendGroups };
  }

  private calculateRealisticMaximum(
    currentRating: number,
    age: number,
    peakAge: number,
    growthRate: number
  ): number {
    if (age >= peakAge) {
      return Math.max(currentRating, Math.min(99, currentRating + 1));
    }

    const yearsToGrow = peakAge - age;

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

    const positiveGrowth = Math.max(0, Math.min(5, growthRate));
    const blendedGrowth = (projectedGrowthPerYear * 2 + positiveGrowth) / 3;

    const projectedPeak = currentRating + yearsToGrow * blendedGrowth;

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

  getTrendChart(
    player: PlayerRow | null,
    columns: ColumnSpec[],
    tabName: string | null
  ): {
    data: ChartConfiguration['data'] | null;
    options: ChartOptions | null;
    plugins: any[];
  } {
    if (!player) {
      return { data: null, options: null, plugins: [] };
    }

    const seasonCols = columns.filter((c) => c.key.match(/^\d{4}(_\d{2})?$/));
    const currentAge = isNum(player['age']) ? (player['age'] as number) : 26;

    const buckets = new Map<number, number[]>();

    for (const c of seasonCols) {
      const m = c.key.match(/^(\d{4})(?:_(\d{2}))?$/);
      if (!m) continue;

      const baseYear = parseInt(m[1], 10);
      const v = player?.[c.key];
      if (!isNum(v)) continue;

      const arr = buckets.get(baseYear) ?? [];
      arr.push(v as number);
      buckets.set(baseYear, arr);
    }

    const years = Array.from(buckets.keys()).sort((a, b) => a - b);
    const histAges: number[] = [];
    const histVals: number[] = [];

    const nYears = years.length;
    years.forEach((year, idx) => {
      const vals = buckets.get(year)!;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const approxAge = currentAge - (nYears - 1 - idx);
      histAges.push(approxAge);
      histVals.push(avg);
    });

    if (!histVals.length) {
      const currentRating = isNum(player['overall_avg_last_4'])
        ? (player['overall_avg_last_4'] as number)
        : null;

      if (currentRating !== null) {
        histAges.push(currentAge);
        histVals.push(currentRating);
      } else {
        return { data: null, options: null, plugins: [] };
      }
    }

    const histMap = new Map<number, number>();
    histAges.forEach((age, i) => histMap.set(age, histVals[i]));

    const lastAge = histAges[histAges.length - 1];
    const lastVal = histVals[histVals.length - 1];

    const group = this.getPositionGroup(tabName);
    const slope = this.computeTrendSlope(histVals);

    const minAge = histAges[0];
    const maxAge = Math.min(40, lastAge + 10);
    const labels: number[] = [];
    for (let age = minAge; age <= maxAge; age++) labels.push(age);

    const potentialData: number[] = [];

    const cfg = AGE_CURVE_CONFIG[group] || AGE_CURVE_CONFIG['Other'];
    const peakStart = cfg.peakStart;
    const peakEnd = cfg.peakEnd;
    const peakAge = Math.floor((peakStart + peakEnd) / 2);

    const projectedPeak = this.calculateRealisticMaximum(lastVal, lastAge, peakAge, slope);

    for (const age of labels) {
      let val: number | null = null;
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
        if (age <= lastAge + 2) {
          if (age < peakStart) {
            const totalYears = peakStart - lastAge;
            const yearsPassed = age - lastAge;
            if (totalYears <= 0) {
              val = projectedPeak;
            } else {
              const progress = Math.max(0, Math.min(1, yearsPassed / totalYears));
              const curve = 1 - Math.pow(1 - progress, 1.5);
              val = lastVal + (projectedPeak - lastVal) * curve;
            }
          } else if (age <= peakEnd) {
            val = projectedPeak;
          } else {
            const yearsPastPeak = age - peakEnd;
            const declinePerYear = 2.0;
            val = projectedPeak - yearsPastPeak * declinePerYear;
          }
          val = Math.max(40, Math.min(99, val));
        } else {
          val = null;
        }
      }
      potentialData.push(val as any);
    }

    const actualSeries = new Array(labels.length).fill(null) as (number | null)[];
    labels.forEach((age, idx) => {
      if (histMap.has(age)) {
        actualSeries[idx] = histMap.get(age)!;
      }
    });

    const allVals = [...(potentialData.filter((v) => v !== null) as number[]), ...histVals];
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);

    let yMin = Math.max(40, Math.floor(minVal - 5));
    let yMax = Math.ceil(maxVal + 3);
    if (yMax - yMin < 10) {
      yMax = yMin + 10;
    }
    yMax = Math.min(100, yMax);

    const data: ChartConfiguration['data'] = {
      labels: labels.map((a) => a.toString()),
      datasets: [
        {
          label: 'Potential',
          data: potentialData,
          fill: false,
          borderColor: 'rgba(255, 120, 0, 1) ',
          borderWidth: 2,
          tension: 0.35,
        },
        {
          label: 'Actual OVR',
          data: actualSeries,
          fill: false,
          borderColor: 'rgba(255, 120, 0, 1) ',
          borderDash: [4, 4],
          pointRadius: 3,
          spanGaps: false,
        },
      ],
    };

    const backgroundPlugin = {
      id: 'backgroundBands',
      beforeDraw: (chart: any) => {
        const { ctx, chartArea, scales } = chart;
        const xAxis = scales.x;
        const yAxis = scales.y;
        if (!xAxis || !yAxis || !chartArea) return;

        const labels: string[] = chart.data.labels;

        ctx.save();
        ctx.beginPath();
        ctx.rect(
          chartArea.left,
          chartArea.top,
          chartArea.right - chartArea.left,
          chartArea.bottom - chartArea.top
        );
        ctx.clip();

        labels.forEach((labelStr: string, index: number) => {
          const age = parseInt(labelStr, 10);
          if (isNaN(age)) return;

          const color = this.getBandColor(age, group);
          const x = xAxis.getPixelForValue(index);

          let width = 0;
          if (index < labels.length - 1) {
            const nextX = xAxis.getPixelForValue(index + 1);
            width = nextX - x;
          } else if (index > 0) {
            const prevX = xAxis.getPixelForValue(index - 1);
            width = x - prevX;
          } else {
            width = xAxis.width / labels.length;
          }

          const left = x - width / 2;
          ctx.fillStyle = color;
          ctx.fillRect(left, chartArea.top, width, chartArea.bottom - chartArea.top);
        });

        ctx.restore();
      },

      afterDatasetsDraw: (chart: any) => {
        const { ctx, chartArea, scales, data } = chart;
        const xAxis = scales.x;
        const yAxis = scales.y;
        if (!xAxis || !yAxis || !chartArea) return;

        const labels: string[] = data.labels;

        const periodBounds: Partial<Record<AgePeriodKey, { minLeft: number; maxRight: number }>> =
          {};

        labels.forEach((labelStr: string, index: number) => {
          const age = parseInt(labelStr, 10);
          if (isNaN(age)) return;

          const period = this.getAgePeriod(age, group);
          const x = xAxis.getPixelForValue(index);

          let width = 0;
          if (index < labels.length - 1) {
            const nextX = xAxis.getPixelForValue(index + 1);
            width = nextX - x;
          } else if (index > 0) {
            const prevX = xAxis.getPixelForValue(index - 1);
            width = x - prevX;
          } else {
            width = xAxis.width / labels.length;
          }

          const left = x - width / 2;
          const right = left + width;

          const bounds = periodBounds[period];
          if (!bounds) {
            periodBounds[period] = { minLeft: left, maxRight: right };
          } else {
            bounds.minLeft = Math.min(bounds.minLeft, left);
            bounds.maxRight = Math.max(bounds.maxRight, right);
          }

          let nextPeriod = period;
          if (index < labels.length - 1) {
            const nextAge = parseInt(labels[index + 1], 10);
            if (!isNaN(nextAge)) {
              nextPeriod = this.getAgePeriod(nextAge, group);
            }
          }
        });

        const currentAge = isNum(player?.['age']) ? (player!['age'] as number) : null;
        const roundedAge = currentAge != null ? Math.round(currentAge) : null;
        const currentPeriod: AgePeriodKey | null =
          roundedAge != null ? this.getAgePeriod(roundedAge, group) : null;

        ctx.save();
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

        const labelPaddingX = 2;
        const labelPaddingY = 3;
        const approxTextHeight = 12;
        const labelY = chartArea.top - 30;

        (Object.keys(periodBounds) as AgePeriodKey[]).forEach((period) => {
          const bounds = periodBounds[period]!;
          const bandWidth = bounds.maxRight - bounds.minLeft;
          const centerX = (bounds.minLeft + bounds.maxRight) / 2;
          const text = AGE_BAND_LABELS[period];

          const metrics = ctx.measureText(text);
          const textWidth = metrics.width;
          const totalWidth = textWidth + labelPaddingX;

          if (totalWidth > bandWidth - 4) {
            return;
          }

          const totalHeight = approxTextHeight + labelPaddingY * 2;
          const rectX = centerX - totalWidth / 2;
          const rectY = labelY - totalHeight / 2;

          if (currentPeriod === period) {
            ctx.save();
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 2;
            ctx.strokeRect(rectX, rectY, totalWidth, totalHeight);
            ctx.restore();
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, centerX, labelY);
        });

        ctx.restore();

        if (currentAge != null) {
          const idxFromAge = labels.findIndex((l) => parseInt(l, 10) === Math.round(currentAge));
          const idx = idxFromAge !== -1 ? idxFromAge : labels.length - 1;

          const x = xAxis.getPixelForValue(idx);

          const actualDs = chart.data.datasets[1];
          const raw = actualDs?.data?.[idx] as number | null;
          const yValue = raw != null ? raw : (chart.data.datasets[0].data[idx] as number);
          const y = yAxis.getPixelForValue(yValue);

          const arrowTopY = chartArea.top - 6;

          ctx.save();
          ctx.strokeStyle = 'rgba(255, 120, 0, 1)';
          ctx.fillStyle = 'rgba(255, 120, 0, 1)';
          ctx.lineWidth = 3;

          ctx.beginPath();
          ctx.moveTo(x, arrowTopY);
          ctx.lineTo(x, y - 8);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x, y - 8);
          ctx.lineTo(x - 5, y + 2);
          ctx.lineTo(x + 5, y + 2);
          ctx.closePath();
          ctx.fill();

          ctx.textBaseline = 'bottom';
          ctx.textAlign = 'center';
          ctx.font =
            'bold 11px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillText('Now', x, arrowTopY - 2);

          ctx.restore();
        }
      },
    };

    const options: ChartOptions = {
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 48,
          right: 16,
          bottom: 24,
          left: 8,
        },
      },
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
          grid: {
            display: false,
          },
          ticks: { color: '#9ca3af' },
          title: {
            display: true,
            text: 'Age',
            color: '#9ca3af',
          },
        },
      },
    };

    return { data, options, plugins: [backgroundPlugin] };
  }

  getPhysicalCharts(
    player: PlayerRow | null,
    columns: ColumnSpec[],
    tabName: string | null
  ): PhysicalChartDef[] {
    const charts: PhysicalChartDef[] = [];

    const isGoalkeeperTab = (tabName ?? '').toLowerCase().includes('keeper');

    if (isGoalkeeperTab || !player) {
      return [];
    }

    const physicalCols = columns.filter((c) => c.banding === 'percentile');
    if (!physicalCols.length) return [];

    const playerName = player['player_name'] as string;

    for (const c of physicalCols) {
      const playerVal = isNum(player[c.key]) ? (player[c.key] as number) : null;

      if (!isNum(playerVal)) continue;

      const p = c.percentiles;

      // Default
      let labelBgColor = BG_COLORS.DARK_RED;
      let labelTextColor = 'white';

      if (p) {
        if (isNum(p.p90) && (playerVal as number) >= p.p90!) {
          labelBgColor = BG_COLORS.DARK_GREEN;
          labelTextColor = 'black';
        } else if (isNum(p.p80) && (playerVal as number) >= p.p80!) {
          labelBgColor = BG_COLORS.GREEN;
          labelTextColor = 'black';
        } else if (isNum(p.p70) && (playerVal as number) >= p.p70!) {
          labelBgColor = BG_COLORS.YELLOW;
          labelTextColor = 'black';
        } else if (isNum(p.p60) && (playerVal as number) >= p.p60!) {
          labelBgColor = BG_COLORS.ORANGE;
          labelTextColor = 'black';
        } else if (isNum(p.p50) && (playerVal as number) >= p.p50!) {
          labelBgColor = BG_COLORS.RED;
          labelTextColor = 'black';
        }
      }

      const suggestedMax = (playerVal as number) * 1.1;

      const data = {
        labels: [''],
        datasets: [
          {
            label: playerName,
            data: [playerVal],
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            borderRadius: 4,
            barPercentage: 0.6,
          },
        ],
      };

      const options = {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
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
            color: labelTextColor,
            backgroundColor: labelBgColor,
            borderRadius: 4,
            padding: 6,
            anchor: 'end',
            align: 'end',
            offset: -2,
            font: {
              size: 10,
              weight: '700',
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
            suggestedMax: suggestedMax,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: '#9ca3af' },
          },
          x: {
            grid: { display: false },
            ticks: { display: false },
          },
        },
      };

      charts.push({
        key: c.key,
        label: c.label,
        data,
        options,
      });
    }
    return charts;
  }
}
