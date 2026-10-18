import { MedicineModel, RegimenPreset } from '../types/models';
import { ritalinModels } from './ritalin';
import { concertaModels } from './concerta';
import { medikinetModels } from './medikinet';
import { equasymModels } from './equasym';
import { extendedCatalogModels } from './extendedCatalog';

const CUSTOM_MODELS_STORAGE_KEY = 'plasma_custom_models_v1';

export const DOSE_PALETTE: string[] = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#ea580c', // Orange
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#db2777', // Pink
  '#ca8a04'  // Amber
];

export const BUILTIN_MODELS: MedicineModel[] = [
  ...medikinetModels,
  ...concertaModels,
  ...ritalinModels,
  ...equasymModels,
  ...extendedCatalogModels
];

export function loadCustomModels(): MedicineModel[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MODELS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as MedicineModel[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomModels(models: MedicineModel[]): void {
  localStorage.setItem(CUSTOM_MODELS_STORAGE_KEY, JSON.stringify(models));
}

export function getAllModels(): MedicineModel[] {
  return [...BUILTIN_MODELS, ...loadCustomModels()];
}

export function getModelById(id: string): MedicineModel | undefined {
  return getAllModels().find((m) => m.id === id);
}

export function getBrands(): string[] {
  const brands = new Set<string>();
  for (const model of getAllModels()) {
    brands.add(model.brand);
  }
  return Array.from(brands);
}

export const REGIMEN_PRESETS: RegimenPreset[] = [
  {
    id: 'original-repo-default',
    name: 'Original Repo Default (Medikinet 10mg + 20mg)',
    description: 'The hardcoded regimen from the original Bitbucket repo: Medikinet CR 10 mg at +0h and Medikinet CR 20 mg at +9h.',
    startOfDayHour: 7,
    windowHours: 24,
    doses: [
      {
        modelId: 'medikinet-cr-10mg',
        timeSlotHours: 0,
        multiplier: 1,
        color: '#2563eb',
        enabled: true
      },
      {
        modelId: 'medikinet-cr-20mg',
        timeSlotHours: 9,
        multiplier: 1,
        color: '#dc2626',
        enabled: true
      }
    ]
  },
  {
    id: 'formulation-comparison-20mg',
    name: 'Compare 20 mg Formulations (IR vs LA vs Medikinet vs Equasym)',
    description: 'Side-by-side comparison of 20 mg single-dose profiles taken at 08:00 (+1h) showing how release ratios shape peaks.',
    startOfDayHour: 7,
    windowHours: 20,
    doses: [
      {
        modelId: 'ritalin-ir-20mg',
        timeSlotHours: 1,
        multiplier: 1,
        color: '#dc2626',
        enabled: true
      },
      {
        modelId: 'medikinet-cr-20mg',
        timeSlotHours: 1,
        multiplier: 1,
        color: '#2563eb',
        enabled: true
      },
      {
        modelId: 'ritalin-la-20mg',
        timeSlotHours: 1,
        multiplier: 1,
        color: '#16a34a',
        enabled: true
      },
      {
        modelId: 'equasym-xl-20mg',
        timeSlotHours: 1,
        multiplier: 1,
        color: '#9333ea',
        enabled: true
      }
    ]
  },
  {
    id: 'concerta-plus-booster',
    name: 'Concerta 36 mg Morning + Ritalin IR 10 mg Afternoon Booster',
    description: 'Common clinical regimen: Concerta 36 mg at 07:30 (+0.5h) with a 10 mg IR booster at 15:30 (+8.5h) to smooth evening taper.',
    startOfDayHour: 7,
    windowHours: 24,
    doses: [
      {
        modelId: 'concerta-er-36mg',
        timeSlotHours: 0.5,
        multiplier: 1,
        color: '#2563eb',
        enabled: true
      },
      {
        modelId: 'ritalin-ir-10mg',
        timeSlotHours: 8.5,
        multiplier: 1,
        color: '#ea580c',
        enabled: true
      }
    ]
  },
  {
    id: 'ritalin-ir-tid',
    name: 'Ritalin IR 3x Daily (10 mg + 10 mg + 5 mg)',
    description: 'Three immediate-release doses spaced 4 hours apart: 10 mg at 07:30, 10 mg at 11:30, and 5 mg at 15:30.',
    startOfDayHour: 7,
    windowHours: 20,
    doses: [
      {
        modelId: 'ritalin-ir-10mg',
        timeSlotHours: 0.5,
        multiplier: 1,
        color: '#2563eb',
        enabled: true
      },
      {
        modelId: 'ritalin-ir-10mg',
        timeSlotHours: 4.5,
        multiplier: 1,
        color: '#16a34a',
        enabled: true
      },
      {
        modelId: 'ritalin-ir-5mg',
        timeSlotHours: 8.5,
        multiplier: 1,
        color: '#ea580c',
        enabled: true
      }
    ]
  },
  {
    id: 'jornay-pm-evening',
    name: 'Jornay PM 60 mg Bedtime Regimen (21:00 Dosing)',
    description: 'Evening administration at 21:00 (+1h from 20:00 start) demonstrating the overnight colonic absorption lag and morning peak.',
    startOfDayHour: 20,
    windowHours: 30,
    doses: [
      {
        modelId: 'jornay-pm-60mg',
        timeSlotHours: 1,
        multiplier: 1,
        color: '#9333ea',
        enabled: true
      }
    ]
  }
];
