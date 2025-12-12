import { PolarGroupKey, AgePeriodKey } from './player-overview.types';

export const OVERALL_COL = 'overall_avg_last_4';
export const MARKET_VALUE_COL = 'market_value';

export const POLAR_GROUP_ORDER: PolarGroupKey[] = [
  'stopping', // 1. Stopping / Saving
  'anticipation', // 2. Anticipation
  'control', // 3. Control
  'progressing', // 4. Progressing
  'creating', // 5. Creating
  'scoring', // 6. Scoring
];

export const POLAR_GROUP_STYLES: Record<
  PolarGroupKey,
  { fill: string; labelBg: string; labelText: string }
> = {
  stopping: {
    // dark red
    fill: 'rgba(153, 27, 27, 0.9)',
    labelBg: 'rgba(153, 27, 27, 0.95)',
    labelText: '#f9fafb',
  },
  anticipation: {
    // lighter red
    fill: 'rgba(248, 113, 113, 0.9)',
    labelBg: 'rgba(248, 113, 113, 0.95)',
    labelText: '#111827',
  },
  control: {
    // light blue
    fill: 'rgba(96, 165, 250, 0.9)',
    labelBg: 'rgba(59, 130, 246, 0.95)',
    labelText: '#0f172a',
  },
  progressing: {
    // darker blue
    fill: 'rgba(37, 99, 235, 0.9)',
    labelBg: 'rgba(30, 64, 175, 0.95)',
    labelText: '#e5f2ff',
  },
  creating: {
    // yellow / orange
    fill: 'rgba(251, 191, 36, 0.9)',
    labelBg: 'rgba(234, 179, 8, 0.95)',
    labelText: '#111827',
  },
  scoring: {
    // green
    fill: 'rgba(34, 197, 94, 0.9)',
    labelBg: 'rgba(34, 197, 94, 0.95)',
    labelText: '#052e16',
  },
};

export const AGE_CURVE_CONFIG: Record<string, { peakStart: number; peakEnd: number }> = {
  GK: { peakStart: 28, peakEnd: 34 },
  CB: { peakStart: 26, peakEnd: 31 },
  FB: { peakStart: 24, peakEnd: 28 },
  '6': { peakStart: 26, peakEnd: 30 },
  '8': { peakStart: 26, peakEnd: 30 },
  '10': { peakStart: 27, peakEnd: 30 },
  '9': { peakStart: 27, peakEnd: 30 },
  Other: { peakStart: 26, peakEnd: 30 },
};

export const BG_COLORS = {
  DARK_GREEN: 'rgba(74, 222, 128, 0.8)',
  GREEN: 'rgba(134, 239, 172, 0.8)',
  YELLOW: 'rgba(251, 191, 36, 0.8)',
  ORANGE: 'rgba(251, 146, 60, 0.8)',
  RED: 'rgba(248, 113, 113, 0.8)',
  DARK_RED: 'rgba(239, 68, 68, 0.8)',
};

export const AGE_BAND_COLORS: Record<AgePeriodKey, string> = {
  early: 'rgba(124, 252, 0, 0.6)',
  late: 'rgba(50, 205, 50, 0.7)',
  performance: 'rgba(0, 100, 0, 0.95)',
  peak: 'rgba(253, 230, 138, 0.75)',
  past: 'rgba(181, 23, 0, 0.4)',
  history: 'rgba(238, 34, 12, 0.2)',
};

export const AGE_BAND_LABELS: Record<AgePeriodKey, string> = {
  early: 'Early develop',
  late: 'Late develop',
  performance: 'Performance',
  peak: '“Peak Performance”',
  past: 'Past performance',
  history: 'History',
};

export const POLAR_GROUP_LABELS: Record<PolarGroupKey, string> = {
  stopping: 'Stopping / Saving',
  anticipation: 'Anticipation',
  control: 'Control',
  progressing: 'Progressing',
  creating: 'Creating',
  scoring: 'Scoring',
};

export const TAB_POLAR_METRIC_ORDER: Record<string, Partial<Record<PolarGroupKey, string[]>>> = {
  Goalkeeper: {
    stopping: ['parries_quality', 'saves_quality'],
    anticipation: ['interceptions_per_90'],
    control: [
      'short_passes_per_90',
      'pass_completion_pct',
      'adjusted_pass_accuracy',
      'all_passes_quality',
    ],
    progressing: ['carries_quality', 'progressive_short_passing', 'progressive_long_passing'],
  },

  'CB (L)': {
    stopping: [
      'headers_open_play_defending_quality',
      '1v1_defending_quality',
      'tackles_quality',
      'shots_blocked_quality',
    ],
    anticipation: ['interceptions_quality'],
    control: ['short_passes_per_90', 'adjusted_pass_accuracy'],
    progressing: [
      'carries_quality',
      'progressive_short_passing',
      'line_breaking_passes_quality',
      'half_space_passes_quality',
      'progressive_long_passing',
    ],
  },

  'CB (R)': {
    stopping: [
      'headers_open_play_defending_quality',
      '1v1_defending_quality',
      'tackles_quality',
      'shots_blocked_quality',
    ],
    anticipation: ['interceptions_quality'],
    control: ['short_passes_per_90', 'adjusted_pass_accuracy'],
    progressing: [
      'carries_quality',
      'progressive_short_passing',
      'line_breaking_passes_quality',
      'half_space_passes_quality',
      'progressive_long_passing',
    ],
  },

  'FB (L)': {
    stopping: ['1v1_defending_quality', 'tackles_quality'],
    anticipation: [
      'counterpressing_recoveries_quality',
      'interceptions_per_90',
      'interceptions_quality',
      'high_regains_quality',
    ],
    progressing: [
      'forward_passes_received_quality',
      'progressive_short_passing',
      'line_breaking_carries_quality',
    ],
    creating: ['crosses_per_90', 'crosses_quality', 'expected_assists_key_passes'],
  },

  'FB (R)': {
    stopping: ['1v1_defending_quality', 'tackles_quality'],
    anticipation: [
      'counterpressing_recoveries_quality',
      'interceptions_per_90',
      'interceptions_quality',
      'high_regains_quality',
    ],
    progressing: [
      'forward_passes_received_quality',
      'progressive_short_passing',
      'line_breaking_carries_quality',
    ],
    creating: ['crosses_per_90', 'crosses_quality', 'expected_assists_key_passes'],
  },

  '#6': {
    stopping: ['1v1_defending_quality', 'headers_open_play_defending_quality'],
    anticipation: [
      'counterpressing_recoveries_quality',
      'second_balls_won_quality',
      'interceptions_quality',
    ],
    control: ['all_passes_per_90', 'adjusted_pass_accuracy'],
    progressing: [
      'forward_passes_received_per_90',
      'passes_before_progression_quality',
      'switching_play_quality',
      'progressive_short_passing',
      'line_breaking_passes_quality',
      'through_balls_quality',
    ],
  },

  '#8': {
    anticipation: [
      'counterpressing_recoveries_quality',
      'interceptions_quality',
      'high_regains_quality',
    ],
    progressing: [
      'forward_passes_received_quality',
      'touches_in_final_third_quality',
      'touches_in_box_per_90',
      'dribbles_quality',
      'line_breaking_carries_quality',
      'progressive_short_passing',
    ],
    creating: ['expected_assists_key_passes', 'key_passes_quality', 'through_balls_quality'],
    scoring: ['expected_goals_shots_open_play', 'goal_difference_added'],
  },

  RW: {
    anticipation: ['counterpressing_recoveries_quality', 'high_regains_quality'],
    progressing: [
      'forward_passes_received_quality',
      'touches_in_final_third_quality',
      'carries_quality',
      'dribbles_quality',
      'dribbles_plus',
      'carries_followed_by_pass_quality',
    ],
    creating: ['expected_assists_key_passes'],
    scoring: ['expected_goals_shots_open_play', 'finishing_shots_open_play'],
  },

  LW: {
    anticipation: ['counterpressing_recoveries_quality', 'high_regains_quality'],
    progressing: [
      'forward_passes_received_quality',
      'touches_in_final_third_quality',
      'carries_quality',
      'dribbles_quality',
      'dribbles_plus',
      'carries_followed_by_pass_quality',
    ],
    creating: ['expected_assists_key_passes'],
    scoring: ['expected_goals_shots_open_play', 'finishing_shots_open_play'],
  },

  '#9': {
    anticipation: [
      'counterpressing_recoveries_quality',
      'interceptions_quality',
      'high_regains_quality',
    ],
    progressing: [
      'forward_passes_received_quality',
      'dribbles_quality',
      'touches_in_box_quality',
      'touches_in_box_per_90',
    ],
    scoring: [
      'expected_goals_combined',
      'finishing_headers_open_play',
      'finishing_shots_open_play',
      'finishing_combined',
    ],
  },
};
