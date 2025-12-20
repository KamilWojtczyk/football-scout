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

export type InjuryRow = {
  season: string;
  injury: string;
  from: string;
  until: string;
  days: number | null;
  games_missed: number | null;
};

export type InjuryHistoryRecord = {
  type: 'injury_history';
  player_id: number;
  player_href: string;
  injuries_url: string;
  injuries: InjuryRow[];
  fetched_at: string;
};
