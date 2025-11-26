export type Percentiles = {
  p50?: number;
  p60?: number;
  p70?: number;
  p80?: number;
  p90?: number;
};

export type ColumnSpec = {
  key: string;
  label: string;
  type: 'string' | 'int' | 'number' | 'date';
  banding?: 'fixed' | 'percentile' | null;
  percentiles?: Percentiles | null;
  sticky?: boolean;
  link_key?: string | null;
};

export type ManifestTab = {
  name: string;
  file: string;
  columns: ColumnSpec[];
};

export type Manifest = {
  updated_at: string;
  tabs: ManifestTab[];
};

export type PlayerRow = Record<string, any>;

export interface NumericFilter {
  min: number | null;
  max: number | null;
}

export interface AdvancedFilters {
  text: Record<string, string>;
  numeric: Record<string, NumericFilter>;
  select: Record<string, any | null>;
}
