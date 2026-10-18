import { DataPoint, MedicineModel } from '../types/models';

const MEDIKINET_CR_20MG_BASE: DataPoint[] = [
  { x: 0, y: 0 },
  { x: 1, y: 6.93 },
  { x: 2, y: 9.26 },
  { x: 3, y: 8.26 },
  { x: 4, y: 7.02 },
  { x: 5, y: 7.61 },
  { x: 6, y: 8.54 },
  { x: 7, y: 8.04 },
  { x: 8, y: 6.52 },
  { x: 9, y: 5.32 },
  { x: 10, y: 4.52 },
  { x: 11, y: 3.80 },
  { x: 12, y: 3.08 },
  { x: 13, y: 2.52 },
  { x: 14, y: 1.84 },
  { x: 15, y: 1.15 },
  { x: 16, y: 0.54 },
  { x: 19, y: 0.18 },
  { x: 30, y: 0 }
];

function scaleMedikinet(factor: number): DataPoint[] {
  return MEDIKINET_CR_20MG_BASE.map((pt) => ({
    x: pt.x,
    y: Number((pt.y * factor).toFixed(4))
  }));
}

export const medikinetModels: MedicineModel[] = [
  {
    id: 'medikinet-cr-5mg',
    brand: 'Medikinet CR',
    name: 'Medikinet CR 5 mg (50:50 Modified Release)',
    doseMg: 5,
    releaseProfile: '50:50 IR:Enteric ER',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '7–8h',
    source: 'https://www.geneesmiddeleninformatiebank.nl/pars/h116382.pdf',
    sourceTitle: 'EU Public Assessment Report NL/H/0529 (0.25x 20 mg CR)',
    referenceImage: '/reference/Medikinet 20 mg.png',
    disclaimer: 'Linearly scaled from published Medikinet CR 20 mg fed-state curve.',
    model: scaleMedikinet(0.25)
  },
  {
    id: 'medikinet-cr-10mg',
    brand: 'Medikinet CR',
    name: 'Medikinet CR 10 mg (50:50 Modified Release)',
    doseMg: 10,
    releaseProfile: '50:50 IR:Enteric ER',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '7–8h',
    source: 'https://www.geneesmiddeleninformatiebank.nl/pars/h116382.pdf',
    sourceTitle: 'EU Public Assessment Report NL/H/0529 (0.5x 20 mg CR)',
    referenceImage: '/reference/Medikinet 20 mg.png',
    disclaimer: 'The values are measured from published media (Original repo model, label fixed from 20 mg to 10 mg).',
    isLegacyOriginal: true,
    model: scaleMedikinet(0.5)
  },
  {
    id: 'medikinet-cr-20mg',
    brand: 'Medikinet CR',
    name: 'Medikinet CR 20 mg (50:50 Modified Release)',
    doseMg: 20,
    releaseProfile: '50:50 IR:Enteric ER',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '8h',
    source: 'https://www.geneesmiddeleninformatiebank.nl/pars/h116382.pdf',
    sourceTitle: 'EU Public Assessment Report NL/H/0529 & Haessler et al. 2008',
    referenceImage: '/reference/Medikinet 20 mg.png',
    disclaimer: 'The values are measured from published media (Original repo model).',
    isLegacyOriginal: true,
    model: MEDIKINET_CR_20MG_BASE
  },
  {
    id: 'medikinet-cr-30mg',
    brand: 'Medikinet CR',
    name: 'Medikinet CR 30 mg (50:50 Modified Release)',
    doseMg: 30,
    releaseProfile: '50:50 IR:Enteric ER',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '8h',
    source: 'https://www.geneesmiddeleninformatiebank.nl/pars/h116382.pdf',
    sourceTitle: 'EU Public Assessment Report NL/H/0529 (1.5x 20 mg CR)',
    referenceImage: '/reference/Medikinet-retard.png',
    disclaimer: 'Linearly scaled from published Medikinet CR 20 mg fed-state curve.',
    model: scaleMedikinet(1.5)
  },
  {
    id: 'medikinet-cr-40mg',
    brand: 'Medikinet CR',
    name: 'Medikinet CR 40 mg (50:50 Modified Release)',
    doseMg: 40,
    releaseProfile: '50:50 IR:Enteric ER',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '8h',
    source: 'https://www.geneesmiddeleninformatiebank.nl/pars/h116382.pdf',
    sourceTitle: 'EU Public Assessment Report NL/H/0529 (2.0x 20 mg CR)',
    referenceImage: '/reference/Medikinet-retard.png',
    disclaimer: 'Linearly scaled from published Medikinet CR 20 mg fed-state curve.',
    model: scaleMedikinet(2.0)
  },
  {
    id: 'medikinet-cr-50mg',
    brand: 'Medikinet CR',
    name: 'Medikinet CR 50 mg (50:50 Modified Release)',
    doseMg: 50,
    releaseProfile: '50:50 IR:Enteric ER',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '8–9h',
    source: 'https://www.geneesmiddeleninformatiebank.nl/pars/h116382.pdf',
    sourceTitle: 'EU Public Assessment Report NL/H/0529 (2.5x 20 mg CR)',
    referenceImage: '/reference/Medikinet-retard.png',
    disclaimer: 'Linearly scaled from published Medikinet CR 20 mg fed-state curve.',
    model: scaleMedikinet(2.5)
  },
  {
    id: 'medikinet-cr-60mg',
    brand: 'Medikinet CR',
    name: 'Medikinet CR 60 mg (50:50 Modified Release)',
    doseMg: 60,
    releaseProfile: '50:50 IR:Enteric ER',
    activeSubstance: 'd,l-threo-methylphenidate HCl',
    durationHours: '8–9h',
    source: 'https://www.geneesmiddeleninformatiebank.nl/pars/h116382.pdf',
    sourceTitle: 'EU Public Assessment Report NL/H/0529 (3.0x 20 mg CR)',
    referenceImage: '/reference/Medikinet-retard.png',
    disclaimer: 'Linearly scaled from published Medikinet CR 20 mg fed-state curve.',
    model: scaleMedikinet(3.0)
  }
];
