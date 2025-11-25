import { Percentiles } from './types';

export const isNum = (v: any): v is number => typeof v === 'number' && Number.isFinite(v);

export function daysLeftFromIso(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const ms = d.getTime() - midnight.getTime();
  return Math.floor(ms / 86_400_000);
}

export function bandClassFixed(n?: number | null): string {
  if (!isNum(n)) return '';
  if (n >= 90) return 'band-dg';
  if (n >= 80) return 'band-g';
  if (n >= 70) return 'band-lg';
  if (n >= 60) return 'band-y';
  if (n >= 50) return 'band-o';
  return 'band-r';
}

export function bandClassPercentile(n: number | null | undefined, p?: Percentiles | null): string {
  if (!isNum(n) || !p || p.p50 == null) return '';
  if (n >= (p.p90 ?? Infinity)) return 'band-dg';
  if (n >= (p.p80 ?? Infinity)) return 'band-g';
  if (n >= (p.p70 ?? Infinity)) return 'band-lg';
  if (n >= (p.p60 ?? Infinity)) return 'band-y';
  if (n >= (p.p50 ?? Infinity)) return 'band-o';
  return 'band-r';
}

export function fmt(val: any, colKey: string): string {
  if (val == null) return '—';

  if (colKey === 'market_value' && isNum(val)) {
    // Format market value with millions/thousands
    if (val >= 1_000_000) {
      return `€${(val / 1_000_000).toFixed(1)}M`;
    } else if (val >= 1_000) {
      return `€${(val / 1_000).toFixed(0)}K`;
    } else {
      return `€${val}`;
    }
  }

  if (colKey === 'cost_per_point_k' && isNum(val)) {
    return `€${val.toFixed(1)}K`;
  }

  if (colKey === 'value_for_money' && isNum(val)) {
    return val.toFixed(1);
  }

  if (
    [
      'max_speed',
      'sprints_90',
      'sprint_dis_90',
      'hir_dis_90',
      'meter_min',
      'total_dis_90',
    ].includes(colKey) &&
    isNum(val)
  ) {
    if (colKey === 'max_speed' || colKey === 'sprints_90' || colKey === 'meter_min') {
      return val.toFixed(1);
    }
    return val.toFixed(0);
  }

  if (isNum(val)) {
    return `${Math.round(val)}`;
  }

  return String(val);
}

export function fmtHeight(cm?: number | null): string {
  if (!isNum(cm) || cm === 0) return '—';
  const meters = cm / 100;
  return `${meters.toFixed(2)}m`;
}

export function fmtAge(age?: number | null): string {
  if (!isNum(age)) return '—';
  return `${age}`;
}

export function contractDaysLeftClass(days: number | null): string {
  if (days === null || days === 0) return 'contract-band-dg'; // No contract / 0 days
  if (days < 0) return 'contract-band-dg'; // Expired
  if (days < 183) return 'contract-band-g'; // < 0.5 year (183 days)
  if (days < 365) return 'contract-band-lg'; // < 1 year
  if (days < 548) return 'contract-band-y'; // < 1.5 years (548 days)
  if (days < 730) return 'contract-band-o'; // < 2 years (730 days)
  return 'contract-band-r'; // > 2 years
}

export function formatDaysLeft(days: number | null): string {
  if (days === null) return '—';
  return `${days}`;
}
