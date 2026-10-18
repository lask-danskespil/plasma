import { DataPoint, MedicineModel } from '../types/models';

function scaleCurve(points: DataPoint[], factor: number): DataPoint[] {
  return points.map((pt) => ({
    x: pt.x,
    y: Number((pt.y * factor).toFixed(4))
  }));
}

// Aptensio XR (40% IR : 60% ER multilayer beads), FDA NDA 205831 (normalized to 20 mg from 80 mg review curve)
const APTENSIO_XR_20MG_BASE: DataPoint[] = [
  { x: 0, y: 0 },
  { x: 0.5, y: 1.20 },
  { x: 1, y: 3.10 },
  { x: 1.5, y: 4.15 },
  { x: 2, y: 4.55 },
  { x: 3, y: 3.70 },
  { x: 4, y: 2.95 },
  { x: 5, y: 2.80 },
  { x: 6, y: 3.15 },
  { x: 7, y: 3.60 },
  { x: 8, y: 3.85 },
  { x: 10, y: 3.30 },
  { x: 12, y: 2.55 },
  { x: 16, y: 1.65 },
  { x: 20, y: 1.15 },
  { x: 24, y: 0.80 },
  { x: 30, y: 0.25 }
];

// Quillivant XR (20% IR : 80% ER oral suspension), FDA NDA 202100 (normalized to 20 mg from 60 mg Cmax 13.6 ng/mL @ 5h)
const QUILLIVANT_XR_20MG_BASE: DataPoint[] = [
  { x: 0, y: 0 },
  { x: 0.5, y: 0.95 },
  { x: 1, y: 2.25 },
  { x: 2, y: 3.55 },
  { x: 3, y: 4.15 },
  { x: 4, y: 4.45 },
  { x: 5, y: 4.53 },
  { x: 6, y: 4.35 },
  { x: 8, y: 3.65 },
  { x: 10, y: 2.85 },
  { x: 12, y: 2.10 },
  { x: 16, y: 1.05 },
  { x: 24, y: 0.30 },
  { x: 30, y: 0.05 }
];

// Daytrana Transdermal Patch (9-hour wear time), FDA NDA 021514 (10 mg/9h base curve)
const DAYTRANA_10MG_9HR_BASE: DataPoint[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0.15 },
  { x: 2, y: 0.65 },
  { x: 3, y: 1.45 },
  { x: 4, y: 2.30 },
  { x: 5, y: 3.10 },
  { x: 6, y: 3.80 },
  { x: 7, y: 4.35 },
  { x: 8, y: 4.75 },
  { x: 9, y: 4.90 }, // Patch removed at 9h
  { x: 10, y: 4.25 },
  { x: 11, y: 3.30 },
  { x: 12, y: 2.45 },
  { x: 14, y: 1.35 },
  { x: 16, y: 0.75 },
  { x: 20, y: 0.25 },
  { x: 24, y: 0.08 }
];

// Jornay PM (Delayed-Release / Extended-Release Evening Dose), FDA NDA 209311 (normalized to 20 mg from 100 mg Cmax 14.2 ng/mL @ 14h)
const JORNAY_PM_20MG_BASE: DataPoint[] = [
  { x: 0, y: 0 },
  { x: 4, y: 0.02 },
  { x: 6, y: 0.05 },
  { x: 8, y: 0.14 },
  { x: 9, y: 0.42 },
  { x: 10, y: 1.05 },
  { x: 11, y: 1.85 },
  { x: 12, y: 2.45 },
  { x: 13, y: 2.75 },
  { x: 14, y: 2.84 },
  { x: 15, y: 2.76 },
  { x: 16, y: 2.55 },
  { x: 18, y: 2.05 },
  { x: 20, y: 1.50 },
  { x: 22, y: 1.05 },
  { x: 24, y: 0.72 },
  { x: 28, y: 0.30 },
  { x: 32, y: 0.10 },
  { x: 36, y: 0.02 }
];

// Focalin XR (Dexmethylphenidate 50:50 SODAS), FDA NDA 021802 (10 mg d-MPH base curve)
const FOCALIN_XR_10MG_BASE: DataPoint[] = [
  { x: 0, y: 0 },
  { x: 0.5, y: 0.90 },
  { x: 1, y: 2.65 },
  { x: 1.5, y: 3.35 },
  { x: 2, y: 3.15 },
  { x: 3, y: 2.45 },
  { x: 4, y: 2.20 },
  { x: 5, y: 2.95 },
  { x: 6, y: 3.55 },
  { x: 6.5, y: 3.70 },
  { x: 7, y: 3.50 },
  { x: 8, y: 3.00 },
  { x: 10, y: 2.05 },
  { x: 12, y: 1.30 },
  { x: 16, y: 0.45 },
  { x: 24, y: 0.10 }
];

export const extendedCatalogModels: MedicineModel[] = [
  // Aptensio XR
  ...[10, 15, 20, 30, 40, 50, 60, 80].map((mg): MedicineModel => ({
    id: `aptensio-xr-${mg}mg`,
    brand: 'Aptensio XR / Foquest',
    name: `Aptensio XR ${mg} mg (40:60 Biphasic ER)`,
    doseMg: mg,
    releaseProfile: '40:60 IR:ER Multilayer',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '12–14h',
    source: 'https://www.fda.gov/files/drugs/published/N205-831-Methylphenidate-HCL-XR-Clinpharm-PREA.pdf',
    sourceTitle: 'FDA Clinical Pharmacology Review NDA 205831 (Aptensio XR)',
    disclaimer: 'Derived from FDA NDA 205831 clinical pharmacology mean d,l-MPH plasma profile.',
    model: scaleCurve(APTENSIO_XR_20MG_BASE, mg / 20)
  })),

  // Quillivant XR
  ...[20, 30, 40, 60].map((mg): MedicineModel => ({
    id: `quillivant-xr-${mg}mg`,
    brand: 'Quillivant XR',
    name: `Quillivant XR ${mg} mg Oral Suspension (20:80)`,
    doseMg: mg,
    releaseProfile: '20:80 IR:ER Suspension',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '10–12h',
    source: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2012/202100s000lbl.pdf',
    sourceTitle: 'FDA Quillivant XR Prescribing Information (NDA 202100)',
    disclaimer: 'Scaled from FDA NDA 202100 60 mg adult single-dose plasma profile (Cmax 13.6 ng/mL @ 5h).',
    model: scaleCurve(QUILLIVANT_XR_20MG_BASE, mg / 20)
  })),

  // Daytrana Patch
  ...[10, 15, 20, 30].map((mg): MedicineModel => ({
    id: `daytrana-patch-${mg}mg`,
    brand: 'Daytrana Patch',
    name: `Daytrana ${mg} mg / 9h Transdermal Patch`,
    doseMg: mg,
    releaseProfile: '9h Transdermal Patch',
    activeSubstance: 'd,l-threo-methylphenidate',
    durationHours: '11–12h (9h wear)',
    source: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2006/021514lbl.pdf',
    sourceTitle: 'FDA Daytrana Label Section 12.3 Clinical Pharmacology (NDA 021514)',
    disclaimer: 'Single 9-hour patch application PK profile; concentration declines after patch removal at hour 9.',
    model: scaleCurve(DAYTRANA_10MG_9HR_BASE, mg / 10)
  })),

  // Jornay PM
  ...[20, 40, 60, 80, 100].map((mg): MedicineModel => ({
    id: `jornay-pm-${mg}mg`,
    brand: 'Jornay PM',
    name: `Jornay PM ${mg} mg Evening Delayed-ER`,
    doseMg: mg,
    releaseProfile: 'Delayed (8–10h lag) + ER',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '20–24h post-evening dose',
    source: 'https://www.fda.gov/media/130108/download',
    sourceTitle: 'FDA Jornay PM Clinical Review (NDA 209311)',
    disclaimer: 'Designed for evening dosing (~20:00); <5% released in first 10h, peaking ~14h post-dose.',
    notes: 'Tip: Set Start of Day to 20:00 (or schedule at slot +0h with 20:00 start) to visualize overnight lag into next day.',
    model: scaleCurve(JORNAY_PM_20MG_BASE, mg / 20)
  })),

  // Focalin XR
  ...[10, 20, 30, 40].map((mg): MedicineModel => ({
    id: `focalin-xr-${mg}mg`,
    brand: 'Focalin XR (d-MPH)',
    name: `Focalin XR ${mg} mg Bimodal (50:50 d-MPH)`,
    doseMg: mg,
    releaseProfile: '50:50 IR:ER (d-enantiomer)',
    activeSubstance: 'd-threo-methylphenidate HCl',
    durationHours: '8–10h',
    source: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2017/021802s033lbl.pdf',
    sourceTitle: 'FDA Focalin XR Label Section 12.3 (NDA 021802)',
    disclaimer: 'Shows d-threo-methylphenidate ng/mL concentration (equipotent to ~2x racemic d,l-MPH dose).',
    model: scaleCurve(FOCALIN_XR_10MG_BASE, mg / 10)
  }))
];
