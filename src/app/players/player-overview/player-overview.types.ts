export type Quantiles = [number, number, number, number];

export type AgePeriodKey = 'early' | 'late' | 'performance' | 'peak' | 'past' | 'history';

export type PolarProfileKey = 'GK' | 'CB' | 'FB' | '6' | '8' | '10' | '9' | 'Other';

export type PolarGroupKey =
  | 'stopping'
  | 'anticipation'
  | 'control'
  | 'progressing'
  | 'creating'
  | 'scoring';

export interface PhysicalChartDef {
  key: string;
  label: string;
  data: any;
  options: any;
}

export type BodyPartKey =
  | 'all'
  | 'head'
  | 'neck'
  | 'back'
  | 'shoulder'
  | 'arm'
  | 'hand'
  | 'chest'
  | 'abdomen'
  | 'hip'
  | 'thigh'
  | 'knee'
  | 'calf'
  | 'ankle'
  | 'foot'
  | 'other';

export type BodyMarker = {
  id: string;
  key: Exclude<BodyPartKey, 'all' | 'other'>;
  label: string;
  view: 'front' | 'back';
  x: number;
  y: number;
};
