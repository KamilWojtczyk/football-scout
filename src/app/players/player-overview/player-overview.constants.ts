import { PolarGroupKey, AgePeriodKey, BodyPartKey, BodyMarker } from './player-overview.types';

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

export const BODY_PART_LABELS: Record<BodyPartKey, string> = {
  all: 'All Injuries',
  head: 'Head / Face',
  neck: 'Neck',
  shoulder: 'Shoulder',
  arm: 'Arm / Elbow',
  hand: 'Hand / Wrist',
  chest: 'Chest / Torso',
  back: 'Back / Spine',
  abdomen: 'Abdomen / Internal',
  hip: 'Hip / Groin',
  thigh: 'Thigh / Hamstring',
  knee: 'Knee',
  calf: 'Calf / Shin',
  ankle: 'Ankle',
  foot: 'Foot / Toe',
  other: 'Other / Illness',
};

export const INJURY_BODY_MARKERS: BodyMarker[] = [
  // FRONT VIEW
  { id: 'f-head', key: 'head', label: 'Head', view: 'front', x: 135, y: 40 },
  { id: 'f-neck', key: 'neck', label: 'Neck', view: 'front', x: 135, y: 90 },
  { id: 'f-sh-l', key: 'shoulder', label: 'Shoulder', view: 'front', x: 75, y: 115 },
  // { id: 'f-sh-r', key: 'shoulder', label: 'Shoulder', view: 'front', x: 195, y: 115 },
  { id: 'f-chest', key: 'chest', label: 'Chest', view: 'front', x: 135, y: 140 },
  { id: 'f-arm-l', key: 'arm', label: 'Arm', view: 'front', x: 70, y: 180 },
  // { id: 'f-arm-r', key: 'arm', label: 'Arm', view: 'front', x: 200, y: 180 },
  { id: 'f-abd', key: 'abdomen', label: 'Abdomen', view: 'front', x: 135, y: 225 },
  { id: 'f-hand-l', key: 'hand', label: 'Hand', view: 'front', x: 32, y: 320 },
  // { id: 'f-hand-r', key: 'hand', label: 'Hand', view: 'front', x: 242, y: 320 },
  { id: 'f-hip', key: 'hip', label: 'Hip/Groin', view: 'front', x: 135, y: 275 },
  { id: 'f-thigh-l', key: 'thigh', label: 'Thigh', view: 'front', x: 100, y: 370 },
  // { id: 'f-thigh-r', key: 'thigh', label: 'Thigh', view: 'front', x: 175, y: 370 },
  { id: 'f-knee-l', key: 'knee', label: 'Knee', view: 'front', x: 105, y: 435 },
  // { id: 'f-knee-r', key: 'knee', label: 'Knee', view: 'front', x: 165, y: 435 },
  { id: 'f-calf-l', key: 'calf', label: 'Shin', view: 'front', x: 105, y: 485 },
  // { id: 'f-calf-r', key: 'calf', label: 'Shin', view: 'front', x: 170, y: 485 },
  { id: 'f-ankle-l', key: 'ankle', label: 'Ankle', view: 'front', x: 115, y: 555 },
  // { id: 'f-ankle-r', key: 'ankle', label: 'Ankle', view: 'front', x: 162, y: 555 },
  { id: 'f-foot-l', key: 'foot', label: 'Foot', view: 'front', x: 110, y: 585 },
  // { id: 'f-foot-r', key: 'foot', label: 'Foot', view: 'front', x: 160, y: 585 },

  // BACK VIEW
  { id: 'b-head', key: 'head', label: 'Head', view: 'back', x: 430, y: 40 },
  { id: 'b-neck', key: 'neck', label: 'Neck', view: 'back', x: 430, y: 90 },
  { id: 'b-back-u', key: 'back', label: 'Upper Back', view: 'back', x: 430, y: 135 },
  // { id: 'b-back-l', key: 'back', label: 'Lower Back', view: 'back', x: 430, y: 200 },
  { id: 'b-hip', key: 'hip', label: 'Glutes', view: 'back', x: 400, y: 305 },
  { id: 'b-thigh-l', key: 'thigh', label: 'Hamstring', view: 'back', x: 400, y: 370 },
  // { id: 'b-thigh-r', key: 'thigh', label: 'Hamstring', view: 'back', x: 465, y: 370 },
  { id: 'b-knee-l', key: 'knee', label: 'Knee', view: 'back', x: 398, y: 435 },
  // { id: 'b-knee-r', key: 'knee', label: 'Knee', view: 'back', x: 462, y: 435 },
  { id: 'b-calf-l', key: 'calf', label: 'Calf', view: 'back', x: 395, y: 485 },
  // { id: 'b-calf-r', key: 'calf', label: 'Calf', view: 'back', x: 465, y: 485 },
  { id: 'b-ankle-l', key: 'ankle', label: 'Ankle', view: 'back', x: 410, y: 555 },
  // { id: 'b-ankle-r', key: 'ankle', label: 'Achilles', view: 'back', x: 455, y: 555 },
  { id: 'b-foot', key: 'foot', label: 'Heel', view: 'back', x: 410, y: 575 },
];

export const INJURY_TO_BODY_PART_RULES: Array<{ part: BodyPartKey; re: RegExp[] }> = [
  {
    part: 'head',
    re: [
      /concussion/i,
      /head/i,
      /skull/i,
      /face/i,
      /facial/i,
      /nose/i,
      /jaw/i,
      /eye/i,
      /ear/i,
      /cheek/i,
      /tooth/i,
      /dental/i,
      /tonsil/i,
      /cerebral/i,
      /auditory/i,
      /frontal bone/i,
    ],
  },
  {
    part: 'neck',
    re: [/neck/i, /cervical/i, /whiplash/i],
  },
  {
    part: 'back',
    re: [
      /back/i,
      /spine/i,
      /spinal/i,
      /lumbar/i,
      /vertebra/i,
      /lumbago/i,
      /sciatica/i,
      /herniated disc/i,
      /pinched nerve/i,
      /coccyx/i,
    ],
  },
  {
    part: 'shoulder',
    re: [/shoulder/i, /clavicle/i, /collarbone/i, /acromioclavicular/i, /humeral head/i],
  },
  {
    part: 'arm',
    re: [/\barm\b/i, /forearm/i, /elbow/i, /humerus/i],
  },
  {
    part: 'hand',
    re: [/wrist/i, /hand/i, /finger/i, /thumb/i, /metacarpal/i, /scaphoid/i],
  },
  {
    part: 'chest',
    re: [
      /rib/i,
      /chest/i,
      /lung/i,
      /pneumothorax/i,
      /heart/i,
      /angina/i,
      /bronchitis/i,
      /pneumonia/i,
    ],
  },
  {
    part: 'abdomen',
    re: [
      /abdominal/i,
      /stomach/i,
      /append/i,
      /intestinal/i,
      /kidney/i,
      /pancreas/i,
      /spleen/i,
      /splenic/i,
      /hernia/i,
      /navel/i,
      /umbilical/i,
    ],
  },
  {
    part: 'hip',
    re: [
      /hip/i,
      /groin/i,
      /inguinal/i,
      /pubic/i,
      /pelvic/i,
      /pelvis/i,
      /pubalgia/i,
      /adductor/i,
      /glute/i,
      /buttock/i,
    ],
  },
  {
    part: 'thigh',
    re: [/thigh/i, /hamstring/i, /quadriceps/i, /femoral/i, /femur/i, /dead leg/i],
  },
  {
    part: 'knee',
    re: [
      /knee/i,
      /meniscus/i,
      /cruciate/i,
      /patella/i,
      /kneecap/i,
      /tibial head/i,
      /collateral ligament/i,
    ],
  },
  {
    part: 'calf',
    re: [/calf/i, /shin/i, /tibia/i, /fibula/i, /lower leg/i, /compartment syndrome/i],
  },
  {
    part: 'ankle',
    re: [/ankle/i, /syndesmo/i, /achilles/i, /malleolus/i, /talus/i],
  },
  {
    part: 'foot',
    re: [/foot/i, /heel/i, /metatarsal/i, /toe/i, /plantar/i, /tarsus/i, /corn/i, /blister/i],
  },
  {
    part: 'other',
    re: [
      /surgery/i,
      /ill/i,
      /virus/i,
      /flu/i,
      /cold/i,
      /fever/i,
      /infection/i,
      /pox/i,
      /covid/i,
      /corona/i,
      /quarantine/i,
      /rest/i,
      /fitness/i,
      /fatigue/i,
      /muscle/i,
      /muscular/i,
      /strain/i,
      /tear/i,
      /bruise/i,
      /fracture/i,
      /wound/i,
    ],
  },
];
