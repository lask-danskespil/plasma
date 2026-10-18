export type Language = 'en' | 'da';

export interface TranslationDictionary {
  appTitle: string;
  appSubtitle: string;
  presetLabel: string;
  presetPlaceholder: string;
  startOfDayLabel: string;
  spanLabel: string;
  hoursUnit: string;
  customModelBtn: string;
  modelsSourcesBtn: (count: number) => string;
  shareUrlBtn: string;
  copiedLinkBtn: string;
  kpiTotalDose: string;
  kpiActiveDoses: (count: number) => string;
  kpiPeakPlasma: string;
  kpiCombinedPeak: string;
  kpiPeakClockTime: string;
  kpiFromStartOfDay: (offset: string) => string;
  kpiNoActiveDoses: string;
  kpiTotalExposure: string;
  kpiOverWindow: (hours: number) => string;
  kpiTargetBand: (min: number, max: number) => string;
  kpiDurationInBand: string;
  legendCombined: string;
  legendIndividual: string;
  toggleIndividual: string;
  toggleKnots: string;
  toggleBand: (min: number, max: number) => string;
  toggleFixedY: string;
  fixedYPlaceholder: string;
  timelineTitle: string;
  timelineHint: string;
  quickAddSelectedSlotBtn: (slotLabel: string) => string;
  slotCellTooltip: (clock: string, offset: string) => string;
  noDosesInTrack: string;
  dragPillTooltip: string;
  addDosePanelTitle: string;
  fieldBrand: string;
  fieldProduct: string;
  peakLabel: string;
  durationBadge: (dur: string) => string;
  singlePeakBadge: (peak: string, hour: number) => string;
  fieldTimeSlot: string;
  fromStartSuffix: string;
  fieldMultiplier: string;
  quickSlotPickerLabel: string;
  addDoseSubmitBtn: (brand: string, mg: string, clock: string) => string;
  scheduledDosesTitle: string;
  clearAllBtn: string;
  noDosesInList: string;
  toggleDoseTooltip: string;
  mutedLabel: string;
  copyPlus4hBtn: string;
  copyPlus4hTooltip: string;
  removeDoseTooltip: string;
  moveEarlierTooltip: string;
  moveLaterTooltip: string;
  doseShortLabel: string;
  tooltipClock: string;
  tooltipTotalPlasma: string;
  graphYAxisLabel: string;
  graphXAxisLabel: string;
  graphTargetBand: (min: number, max: number) => string;
  graphPeakBadge: (peak: string, clock: string) => string;
  modalCloseBtn: string;
  sourcesModalTitle: (count: number) => string;
  sourcesModalIntro: string;
  tableBrand: string;
  tableProduct: string;
  tableOriginalBadge: string;
  tableReleaseRatio: string;
  tableSinglePeak: string;
  tableDuration: string;
  tableSource: string;
  refGalleryTitle: string;
  customModalTitle: string;
  customBrandLabel: string;
  customNameLabel: string;
  customDoseLabel: string;
  customReleaseLabel: string;
  customDurationLabel: string;
  customPointsLabel: string;
  customSaveBtn: string;
  presetNames: Record<string, string>;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  en: {
    appTitle: 'Plasma — Methylphenidate PK Time-Slot Simulator',
    appSubtitle:
      'Interactive multi-dose plasma concentration (ng/mL) visualizer with published pharmacokinetic models',
    presetLabel: 'Preset:',
    presetPlaceholder: '-- Load Regimen Preset --',
    startOfDayLabel: 'Start of Day:',
    spanLabel: 'Span:',
    hoursUnit: 'hours',
    customModelBtn: '+ Custom Model',
    modelsSourcesBtn: (count) => `Models & Sources (${count})`,
    shareUrlBtn: 'Copy Share Link',
    copiedLinkBtn: 'Copied Link!',
    kpiTotalDose: 'Total Scheduled Dose',
    kpiActiveDoses: (count) => `${count} active time-slot dose(s)`,
    kpiPeakPlasma: 'Peak Plasma (Cmax)',
    kpiCombinedPeak: 'Combined peak concentration',
    kpiPeakClockTime: 'Peak Clock Time (Tmax)',
    kpiFromStartOfDay: (offset) => `${offset} from start of day`,
    kpiNoActiveDoses: 'No active doses',
    kpiTotalExposure: 'Total Exposure (AUC)',
    kpiOverWindow: (hours) => `Over ${hours}h window`,
    kpiTargetBand: (min, max) => `Target Band (${min}–${max} ng/mL)`,
    kpiDurationInBand: 'Duration inside reference band',
    legendCombined: 'Combined Total (ng/mL)',
    legendIndividual: 'Individual Scheduled Doses',
    toggleIndividual: 'Show individual curves',
    toggleKnots: 'Show published data points',
    toggleBand: (min, max) => `Reference window (${min}–${max} ng/mL)`,
    toggleFixedY: 'Fix Y-axis max:',
    fixedYPlaceholder: 'Auto',
    timelineTitle: 'Interactive Time-Slot Schedule Track',
    timelineHint:
      'Click any hour slot to select it (double-click to immediately add selected model), or drag scheduled dose bars left/right across time slots.',
    quickAddSelectedSlotBtn: (slotLabel) => `+ Add Selected Model at ${slotLabel}`,
    slotCellTooltip: (clock, offset) =>
      `Click to select ${clock} (${offset}). Double-click to add current model.`,
    noDosesInTrack:
      'No doses scheduled yet. Click a slot above or use the right panel to add a medicine.',
    dragPillTooltip: 'Drag left or right to change time slot',
    addDosePanelTitle: 'Add Medicine to Time Slot',
    fieldBrand: '1. Medicine Brand / Release Family',
    fieldProduct: '2. Product & Strength',
    peakLabel: 'Peak',
    durationBadge: (dur) => `Duration: ${dur}`,
    singlePeakBadge: (peak, hour) => `1× Peak: ${peak} ng/mL @ +${hour}h`,
    fieldTimeSlot: '3. Time Slot (Clock / Delay)',
    fromStartSuffix: 'from start',
    fieldMultiplier: '4. Dose Multiplier',
    quickSlotPickerLabel: 'Quick Time-Slot Picker',
    addDoseSubmitBtn: (brand, mg, clock) => `+ Add ${brand} ${mg} mg at ${clock}`,
    scheduledDosesTitle: 'Scheduled Doses',
    clearAllBtn: 'Clear All',
    noDosesInList:
      'No medicine doses in the schedule. Use the form above or click any time slot on the track to add one.',
    toggleDoseTooltip: 'Enable or mute this dose curve',
    mutedLabel: 'Muted',
    copyPlus4hBtn: '+4h Copy',
    copyPlus4hTooltip: 'Duplicate dose +4h later',
    removeDoseTooltip: 'Remove dose',
    moveEarlierTooltip: 'Move 30m earlier',
    moveLaterTooltip: 'Move 30m later',
    doseShortLabel: 'Dose:',
    tooltipClock: 'Clock:',
    tooltipTotalPlasma: 'Total Plasma:',
    graphYAxisLabel: 'Plasma Concentration (ng/mL)',
    graphXAxisLabel:
      'Time of Day (Click any time slot on chart or timeline below to schedule a dose)',
    graphTargetBand: (min, max) => `Target band (${min}–${max} ng/mL)`,
    graphPeakBadge: (peak, clock) => `Peak: ${peak} ng/mL @ ${clock}`,
    modalCloseBtn: 'Close ✕',
    sourcesModalTitle: (count) =>
      `Methylphenidate Pharmacokinetic Models & Published Sources (${count})`,
    sourcesModalIntro:
      'All plasma concentration models represent mean d,l-threo-methylphenidate (or d-threo-methylphenidate for Focalin) plasma levels in ng/mL measured from FDA Clinical Pharmacology reviews, EU Public Assessment Reports (PARs), and published studies. For educational and visualization purposes only.',
    tableBrand: 'Brand',
    tableProduct: 'Product',
    tableOriginalBadge: 'Original Repo',
    tableReleaseRatio: 'Release Ratio',
    tableSinglePeak: 'Single-Dose Cmax',
    tableDuration: 'Duration',
    tableSource: 'Source / Reference',
    refGalleryTitle: 'Reference Charts from Original Repository',
    customModalTitle: 'Create Custom Medicine PK Model',
    customBrandLabel: 'Brand / Category Name',
    customNameLabel: 'Product Name',
    customDoseLabel: 'Dose (mg)',
    customReleaseLabel: 'Release Profile Label',
    customDurationLabel: 'Duration Label',
    customPointsLabel: 'Time–Concentration Points (one hour, ng/mL pair per line)',
    customSaveBtn: 'Save Custom Model & Select',
    presetNames: {
      'original-repo-default': 'Original Repo Default (Medikinet 10mg + 20mg)',
      'formulation-comparison-20mg':
        'Compare 20 mg Formulations (IR vs LA vs Medikinet vs Equasym)',
      'concerta-plus-booster':
        'Concerta 36 mg Morning + Ritalin IR 10 mg Afternoon Booster',
      'ritalin-ir-tid': 'Ritalin IR 3x Daily (10 mg + 10 mg + 5 mg)',
      'jornay-pm-evening': 'Jornay PM 60 mg Bedtime Regimen (21:00 Dosing)'
    }
  },
  da: {
    appTitle: 'Plasma — Methylphenidat PK Tidsplan-Simulator',
    appSubtitle:
      'Interaktiv visualisering af plasmakoncentration (ng/mL) over tid baseret på publicerede farmakokinetiske modeller',
    presetLabel: 'Skabelon:',
    presetPlaceholder: '-- Vælg doseringsskabelon --',
    startOfDayLabel: 'Døgnstart:',
    spanLabel: 'Tidshorisont:',
    hoursUnit: 'timer',
    customModelBtn: '+ Egen model',
    modelsSourcesBtn: (count) => `Modeller & Kilder (${count})`,
    shareUrlBtn: 'Kopiér delingslink',
    copiedLinkBtn: 'Link kopieret!',
    kpiTotalDose: 'Samlet døgndosis',
    kpiActiveDoses: (count) => `${count} aktiv(e) dosis/doser i tidsplan`,
    kpiPeakPlasma: 'Maks. plasma (Cmax)',
    kpiCombinedPeak: 'Kombineret topkoncentration',
    kpiPeakClockTime: 'Tidspunkt for top (Tmax)',
    kpiFromStartOfDay: (offset) => `${offset} fra døgnstart`,
    kpiNoActiveDoses: 'Ingen aktive doser',
    kpiTotalExposure: 'Samlet eksponering (AUC)',
    kpiOverWindow: (hours) => `Over ${hours} timers vindue`,
    kpiTargetBand: (min, max) => `Målområde (${min}–${max} ng/mL)`,
    kpiDurationInBand: 'Tid inden for referenceområde',
    legendCombined: 'Samlet koncentration (ng/mL)',
    legendIndividual: 'Individuelle planlagte doser',
    toggleIndividual: 'Vis individuelle kurver',
    toggleKnots: 'Vis publicerede målepunkter',
    toggleBand: (min, max) => `Referenceområde (${min}–${max} ng/mL)`,
    toggleFixedY: 'Lås Y-akse maks.:',
    fixedYPlaceholder: 'Auto',
    timelineTitle: 'Interaktiv tidslinje & tidsintervaller',
    timelineHint:
      'Klik på et tidsinterval for at vælge det (dobbeltklik for straks at tilføje den valgte medicin), eller træk dosis-bjælkerne vandret til et nyt tidspunkt.',
    quickAddSelectedSlotBtn: (slotLabel) => `+ Tilføj valgt model kl. ${slotLabel}`,
    slotCellTooltip: (clock, offset) =>
      `Klik for at vælge kl. ${clock} (${offset}). Dobbeltklik for at tilføje valgt medicin her.`,
    noDosesInTrack:
      'Ingen doser planlagt endnu. Klik på et tidsinterval ovenfor eller brug panelet til højre for at tilføje medicin.',
    dragPillTooltip: 'Træk til venstre eller højre for at ændre tidspunkt',
    addDosePanelTitle: 'Tilføj medicin på tidspunkt',
    fieldBrand: '1. Præparat / Frigivelsesprofil',
    fieldProduct: '2. Produkt & styrke',
    peakLabel: 'Top',
    durationBadge: (dur) => `Varighed: ${dur}`,
    singlePeakBadge: (peak, hour) => `1× Top: ${peak} ng/mL ved +${hour}t`,
    fieldTimeSlot: '3. Tidspunkt (Klokkeslæt / Forsinkelse)',
    fromStartSuffix: 'fra start',
    fieldMultiplier: '4. Antal / Dosis-faktor',
    quickSlotPickerLabel: 'Hurtigvalg af tidspunkt',
    addDoseSubmitBtn: (brand, mg, clock) => `+ Tilføj ${brand} ${mg} mg kl. ${clock}`,
    scheduledDosesTitle: 'Planlagte doser',
    clearAllBtn: 'Ryd alle',
    noDosesInList:
      'Ingen doser i tidsplanen. Brug formularen ovenfor eller klik på et tidsinterval på tidslinjen.',
    toggleDoseTooltip: 'Slå denne dosiskurve til eller fra',
    mutedLabel: 'Skjult',
    copyPlus4hBtn: '+4t Kopi',
    copyPlus4hTooltip: 'Duplikér dosis +4 timer senere',
    removeDoseTooltip: 'Fjern dosis',
    moveEarlierTooltip: 'Flyt 30 min. tidligere',
    moveLaterTooltip: 'Flyt 30 min. senere',
    doseShortLabel: 'Dosis:',
    tooltipClock: 'Klokkeslæt:',
    tooltipTotalPlasma: 'Samlet plasma:',
    graphYAxisLabel: 'Plasmakoncentration (ng/mL)',
    graphXAxisLabel:
      'Tidspunkt på dagen (Klik på grafen eller tidslinjen nedenfor for at placere en dosis)',
    graphTargetBand: (min, max) => `Målområde (${min}–${max} ng/mL)`,
    graphPeakBadge: (peak, clock) => `Top: ${peak} ng/mL kl. ${clock}`,
    modalCloseBtn: 'Luk ✕',
    sourcesModalTitle: (count) =>
      `Farmakokinetiske Methylphenidat-modeller & Kilder (${count})`,
    sourcesModalIntro:
      'Alle plasmakoncentrationsmodeller viser gennemsnitlig d,l-threo-methylphenidat (eller d-threo-methylphenidat for Focalin) i ng/mL målt fra FDA Clinical Pharmacology-rapporter, EU Public Assessment Reports (PAR) og publicerede studier. Kun til undervisnings- og visualiseringsbrug.',
    tableBrand: 'Præparat',
    tableProduct: 'Produkt',
    tableOriginalBadge: 'Oprindelig repo',
    tableReleaseRatio: 'Frigivelsesprofil',
    tableSinglePeak: 'Enkeltdosis Cmax',
    tableDuration: 'Varighed',
    tableSource: 'Kilde / Reference',
    refGalleryTitle: 'Referencegrafer fra oprindeligt repository',
    customModalTitle: 'Opret brugerdefineret PK-model',
    customBrandLabel: 'Præparat / Kategori',
    customNameLabel: 'Produktnavn',
    customDoseLabel: 'Styrke (mg)',
    customReleaseLabel: 'Frigivelsesprofil',
    customDurationLabel: 'Varighed',
    customPointsLabel: 'Tid–Koncentrationspunkter (ét par: timer, ng/mL pr. linje)',
    customSaveBtn: 'Gem brugerdefineret model & vælg',
    presetNames: {
      'original-repo-default': 'Oprindelig Repo-standard (Medikinet 10mg + 20mg)',
      'formulation-comparison-20mg':
        'Sammenlign 20 mg præparater (IR vs LA vs Medikinet vs Equasym)',
      'concerta-plus-booster':
        'Concerta 36 mg morgen + Ritalin IR 10 mg eftermiddags-booster',
      'ritalin-ir-tid': 'Ritalin IR 3x dagligt (10 mg + 10 mg + 5 mg)',
      'jornay-pm-evening': 'Jornay PM 60 mg aftendosering (kl. 21:00)'
    }
  }
};
