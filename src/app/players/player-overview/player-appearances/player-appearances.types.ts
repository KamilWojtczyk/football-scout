import { AppearanceCompetition, AppearanceTotals } from '../../../types';

export type Agg = {
  matches_total: number;
  matches_played: number;
  minutes_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  second_yellow_cards: number;
  red_cards: number;

  squad: number;
  starting_eleven: number;
  substituted_in: number;
  on_the_bench: number;
  suspended: number;
  injured: number;
  absence: number;
};

export function emptyAgg(): Agg {
  return {
    matches_total: 0,
    matches_played: 0,
    minutes_played: 0,
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    second_yellow_cards: 0,
    red_cards: 0,

    squad: 0,
    starting_eleven: 0,
    substituted_in: 0,
    on_the_bench: 0,
    suspended: 0,
    injured: 0,
    absence: 0,
  };
}

export function addTotals(a: Agg, t: AppearanceTotals) {
  a.matches_total += t.matches_total || 0;
  a.matches_played += t.matches_played || 0;
  a.minutes_played += t.minutes_played || 0;
  a.goals += t.goals || 0;
  a.assists += t.assists || 0;
  a.yellow_cards += t.yellow_cards || 0;
  a.second_yellow_cards += t.second_yellow_cards || 0;
  a.red_cards += t.red_cards || 0;
}

export function addSummary(a: Agg, c: AppearanceCompetition) {
  const s = c.summary;
  a.squad += s?.squad || 0;
  a.starting_eleven += s?.starting_eleven || 0;
  a.substituted_in += s?.substituted_in || 0;
  a.on_the_bench += s?.on_the_bench || 0;
  a.suspended += s?.suspended || 0;
  a.injured += s?.injured || 0;
  a.absence += s?.absence || 0;
}

export function clampPct(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}
