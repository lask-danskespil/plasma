export interface DataPoint {
  x: number;
  y: number;
  calculated?: boolean;
}

export interface MedicineModel {
  id: string;
  brand: string;
  name: string;
  doseMg: number;
  releaseProfile: string;
  activeSubstance: string;
  durationHours: string;
  source: string;
  sourceTitle: string;
  referenceImage?: string;
  disclaimer: string;
  notes?: string;
  isLegacyOriginal?: boolean;
  isCustom?: boolean;
  model: DataPoint[];
}

export interface ScheduledDose {
  id: string;
  modelId: string;
  timeSlotHours: number;
  multiplier: number;
  color: string;
  enabled: boolean;
  label?: string;
}

export interface RegimenPreset {
  id: string;
  name: string;
  description: string;
  startOfDayHour: number;
  windowHours: number;
  doses: Omit<ScheduledDose, 'id'>[];
}

export interface DoseCurveEvaluation {
  dose: ScheduledDose;
  medicine: MedicineModel;
  points: DataPoint[];
  shiftedRawPoints: DataPoint[];
  cMax: number;
  tMaxHoursFromStart: number;
  auc: number;
}

export interface SimulationPoint {
  hourFromStart: number;
  clockHour: number;
  clockFormatted: string;
  totalConcentration: number;
  contributions: {
    doseId: string;
    label: string;
    color: string;
    concentration: number;
  }[];
}

export interface SimulationSummary {
  totalDailyMg: number;
  activeDoseCount: number;
  cMax: number;
  tMaxHoursFromStart: number;
  tMaxClockFormatted: string;
  auc24: number;
  hoursInTherapeuticRange: number;
}

export interface SimulationResult {
  timeline: SimulationPoint[];
  combinedCurvePoints: DataPoint[];
  doseEvaluations: DoseCurveEvaluation[];
  summary: SimulationSummary;
}

export interface SimulatorState {
  language?: 'en' | 'da';
  startOfDayHour: number;
  windowHours: number;
  curveTension: number;
  showIndividualCurves: boolean;
  showDataPoints: boolean;
  showTherapeuticBand: boolean;
  therapeuticMin: number;
  therapeuticMax: number;
  fixedYMax?: number | null;
  scheduledDoses: ScheduledDose[];
}
