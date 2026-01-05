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

export type AppearanceTotals = {
  matches_total: number;
  matches_played: number;
  minutes_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  second_yellow_cards: number;
  red_cards: number;
};

export type AppearanceSummary = {
  squad: number;
  starting_eleven: number;
  substituted_in: number;
  on_the_bench: number;
  suspended: number;
  injured: number;
  absence: number;
};

export type AppearanceCompetition = {
  competition_code: string;
  competition_name: string;
  summary: AppearanceSummary;
  totals: AppearanceTotals;
};

export type AppearanceSeason = {
  season: string;
  url: string;
  competitions: AppearanceCompetition[];
};

export type AppearanceHistoryRecord = {
  type: 'appearance_history';
  player_id: number;
  player_href: string;
  player_code?: string;
  player_name?: string;
  parent?: any;
  appearances_url: string;
  seasons: AppearanceSeason[];
  fetched_at: string;
};
