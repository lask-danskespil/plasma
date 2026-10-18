import { DataPoint, MedicineModel } from '../types/models';

const EQUASYM_XL_20MG_BASE: DataPoint[] = [
  { x: 0, y: 0 },
  { x: 0.5, y: 1.15 },
  { x: 1, y: 3.35 },
  { x: 1.5, y: 4.20 },
  { x: 2, y: 4.05 },
  { x: 2.5, y: 3.85 },
  { x: 3, y: 4.45 },
  { x: 4, y: 6.10 },
  { x: 4.5, y: 6.75 },
  { x: 5, y: 6.65 },
  { x: 6, y: 5.75 },
  { x: 7, y: 4.40 },
  { x: 8, y: 3.25 },
  { x: 10, y: 1.95 },
  { x: 12, y: 1.20 },
  { x: 16, y: 0.42 },
  { x: 24, y: 0.09 }
];

function scaleEquasym(factor: number): DataPoint[] {
  return EQUASYM_XL_20MG_BASE.map((pt) => ({
    x: pt.x,
    y: Number((pt.y * factor).toFixed(4))
  }));
}

export const equasymModels: MedicineModel[] = [
  {
    id: 'equasym-xl-10mg',
    brand: 'Equasym XL / Metadate CD',
    name: 'Equasym XL / Metadate CD 10 mg (30:70)',
    doseMg: 10,
    releaseProfile: '30:70 IR:ER (Diffucaps)',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '8h',
    source: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021259s023lbl.pdf',
    sourceTitle: 'FDA Metadate CD Label (NDA 021259) & Gonzalez et al. 2002 (0.5x 20 mg)',
    referenceImage: '/reference/Mean-concentration-time-profiles-of-DL-threo-methylphenidate-after-administration-of.png',
    disclaimer: 'Dose-proportional scaling from published 20 mg 30:70 Diffucaps PK profile.',
    model: scaleEquasym(0.5)
  },
  {
    id: 'equasym-xl-20mg',
    brand: 'Equasym XL / Metadate CD',
    name: 'Equasym XL / Metadate CD 20 mg (30:70)',
    doseMg: 20,
    releaseProfile: '30:70 IR:ER (Diffucaps)',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '8h',
    source: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021259s023lbl.pdf',
    sourceTitle: 'FDA Metadate CD Label (NDA 021259) & Gonzalez et al. 2002',
    referenceImage: '/reference/Mean-concentration-time-profiles-of-DL-threo-methylphenidate-after-administration-of.png',
    disclaimer: 'Measured from published Metadate CD / Equasym XL 20 mg 30:70 plasma profile.',
    model: EQUASYM_XL_20MG_BASE
  },
  {
    id: 'equasym-xl-30mg',
    brand: 'Equasym XL / Metadate CD',
    name: 'Equasym XL / Metadate CD 30 mg (30:70)',
    doseMg: 30,
    releaseProfile: '30:70 IR:ER (Diffucaps)',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '8–9h',
    source: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021259s023lbl.pdf',
    sourceTitle: 'FDA Metadate CD Label (NDA 021259, 1.5x 20 mg)',
    referenceImage: '/reference/Mean-concentration-time-profiles-of-DL-threo-methylphenidate-after-administration-of.png',
    disclaimer: 'Dose-proportional scaling from published 20 mg 30:70 Diffucaps PK profile.',
    model: scaleEquasym(1.5)
  },
  {
    id: 'equasym-xl-40mg',
    brand: 'Equasym XL / Metadate CD',
    name: 'Equasym XL / Metadate CD 40 mg (30:70)',
    doseMg: 40,
    releaseProfile: '30:70 IR:ER (Diffucaps)',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '8–9h',
    source: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021259s023lbl.pdf',
    sourceTitle: 'FDA Metadate CD Label (NDA 021259, 2.0x 20 mg)',
    referenceImage: '/reference/Mean-concentration-time-profiles-of-DL-threo-methylphenidate-after-administration-of.png',
    disclaimer: 'Dose-proportional scaling from published 20 mg 30:70 Diffucaps PK profile.',
    model: scaleEquasym(2.0)
  },
  {
    id: 'equasym-xl-50mg',
    brand: 'Equasym XL / Metadate CD',
    name: 'Equasym XL / Metadate CD 50 mg (30:70)',
    doseMg: 50,
    releaseProfile: '30:70 IR:ER (Diffucaps)',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '8–10h',
    source: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021259s023lbl.pdf',
    sourceTitle: 'FDA Metadate CD Label (NDA 021259, 2.5x 20 mg)',
    referenceImage: '/reference/Mean-concentration-time-profiles-of-DL-threo-methylphenidate-after-administration-of.png',
    disclaimer: 'Dose-proportional scaling from published 20 mg 30:70 Diffucaps PK profile.',
    model: scaleEquasym(2.5)
  },
  {
    id: 'equasym-xl-60mg',
    brand: 'Equasym XL / Metadate CD',
    name: 'Equasym XL / Metadate CD 60 mg (30:70)',
    doseMg: 60,
    releaseProfile: '30:70 IR:ER (Diffucaps)',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '8–10h',
    source: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/021259s023lbl.pdf',
    sourceTitle: 'FDA Metadate CD Label (NDA 021259, 3.0x 20 mg)',
    referenceImage: '/reference/Mean-concentration-time-profiles-of-DL-threo-methylphenidate-after-administration-of.png',
    disclaimer: 'Dose-proportional scaling from published 20 mg 30:70 Diffucaps PK profile.',
    model: scaleEquasym(3.0)
  }
];
