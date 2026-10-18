import {
  DataPoint,
  MedicineModel,
  ScheduledDose,
  SimulationPoint,
  SimulationResult,
  SimulatorState
} from '../types/models';
import {
  DOSE_PALETTE,
  REGIMEN_PRESETS,
  getAllModels,
  getBrands,
  getModelById,
  loadCustomModels,
  saveCustomModels
} from '../models';
import {
  formatClockHour,
  formatOffsetHours,
  runSimulation
} from '../engine/pharmacokinetics';
import { Language, TRANSLATIONS, TranslationDictionary } from '../i18n/translations';
import { PlasmaGraphCanvas } from './graphCanvas';

const STATE_STORAGE_KEY = 'plasma_simulator_state_v2';

export class PlasmaSimulatorApp {
  private root: HTMLElement;
  private state: SimulatorState;
  private selectedBrand: string = 'Medikinet CR';
  private selectedModelId: string = 'medikinet-cr-10mg';
  private selectedSlotHours: number = 0;
  private selectedMultiplier: number = 1;
  private graphCanvas: PlasmaGraphCanvas | null = null;
  private activeModal: 'none' | 'sources' | 'custom-model' = 'none';

  constructor(root: HTMLElement) {
    this.root = root;
    this.state = this.loadInitialState();
    if (!this.state.language) {
      this.state.language = 'en';
    }
    this.mount();
  }

  private get t(): TranslationDictionary {
    return TRANSLATIONS[this.state.language || 'en'];
  }

  private setLanguage(lang: Language): void {
    if (this.state.language === lang) {
      return;
    }
    this.state.language = lang;
    document.documentElement.lang = lang;
    this.persistState();
    this.mount();
  }

  private loadInitialState(): SimulatorState {
    try {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('state=')) {
        const decoded = JSON.parse(decodeURIComponent(atob(hash.slice(6)))) as SimulatorState;
        if (decoded && Array.isArray(decoded.scheduledDoses)) {
          return decoded;
        }
      }
      const saved = localStorage.getItem(STATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SimulatorState;
        if (parsed && Array.isArray(parsed.scheduledDoses)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to default preset
    }

    const defaultPreset = REGIMEN_PRESETS[0];
    return {
      startOfDayHour: defaultPreset.startOfDayHour,
      windowHours: defaultPreset.windowHours,
      curveTension: 0.5,
      showIndividualCurves: true,
      showDataPoints: false,
      showTherapeuticBand: false,
      therapeuticMin: 4,
      therapeuticMax: 12,
      fixedYMax: null,
      scheduledDoses: defaultPreset.doses.map((d, idx) => ({
        ...d,
        id: `dose-${Date.now()}-${idx}`
      }))
    };
  }

  private persistState(): void {
    try {
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore storage quota errors
    }
  }

  private nextColor(): string {
    const used = new Set(this.state.scheduledDoses.map((d) => d.color));
    for (const c of DOSE_PALETTE) {
      if (!used.has(c)) {
        return c;
      }
    }
    return DOSE_PALETTE[this.state.scheduledDoses.length % DOSE_PALETTE.length];
  }

  private mount(): void {
    const t = this.t;
    const lang = this.state.language || 'en';
    this.root.innerHTML = `
      <div class="app-shell">
        <header class="top-header">
          <div class="brand-block">
            <div class="brand-icon">Pk</div>
            <div>
              <h1 class="brand-title">${t.appTitle}</h1>
              <p class="brand-subtitle">${t.appSubtitle}</p>
            </div>
          </div>
          <div class="header-controls">
            <div class="lang-switch" role="group" aria-label="Language switch">
              <button type="button" class="lang-btn ${
                lang === 'en' ? 'active' : ''
              }" data-set-lang="en">EN</button>
              <button type="button" class="lang-btn ${
                lang === 'da' ? 'active' : ''
              }" data-set-lang="da">DA</button>
            </div>
            <div class="inline-field">
              <label for="presetSelect">${t.presetLabel}</label>
              <select id="presetSelect">
                <option value="">${t.presetPlaceholder}</option>
                ${REGIMEN_PRESETS.map(
                  (p) => `<option value="${p.id}">${t.presetNames[p.id] || p.name}</option>`
                ).join('')}
              </select>
            </div>
            <div class="inline-field">
              <label for="startOfDaySelect">${t.startOfDayLabel}</label>
              <select id="startOfDaySelect">
                ${Array.from({ length: 24 }, (_, h) => {
                  const label = formatClockHour(h);
                  const sel = h === this.state.startOfDayHour ? 'selected' : '';
                  return `<option value="${h}" ${sel}>${label}</option>`;
                }).join('')}
              </select>
            </div>
            <div class="inline-field">
              <label for="windowSelect">${t.spanLabel}</label>
              <select id="windowSelect">
                ${[16, 20, 24, 30, 36]
                  .map(
                    (w) =>
                      `<option value="${w}" ${
                        w === this.state.windowHours ? 'selected' : ''
                      }>${w} ${t.hoursUnit}</option>`
                  )
                  .join('')}
              </select>
            </div>
            <button class="btn" id="openCustomModelBtn">${t.customModelBtn}</button>
            <button class="btn" id="openSourcesBtn">${t.modelsSourcesBtn(
              getAllModels().length
            )}</button>
            <button class="btn" id="shareUrlBtn">${t.shareUrlBtn}</button>
          </div>
        </header>

        <div class="workspace-grid">
          <div class="main-column">
            <div class="kpi-strip" id="kpiStrip"></div>

            <div class="graph-card">
              <div class="graph-toolbar">
                <div class="graph-legend">
                  <span class="legend-item"><span class="legend-line-solid"></span> ${
                    t.legendCombined
                  }</span>
                  <span class="legend-item"><span class="legend-line-dashed"></span> ${
                    t.legendIndividual
                  }</span>
                </div>
                <div class="graph-toggles">
                  <label class="toggle-label">
                    <input type="checkbox" id="toggleIndividual" ${
                      this.state.showIndividualCurves ? 'checked' : ''
                    } />
                    ${t.toggleIndividual}
                  </label>
                  <label class="toggle-label">
                    <input type="checkbox" id="toggleKnots" ${
                      this.state.showDataPoints ? 'checked' : ''
                    } />
                    ${t.toggleKnots}
                  </label>
                  <label class="toggle-label">
                    <input type="checkbox" id="toggleBand" ${
                      this.state.showTherapeuticBand ? 'checked' : ''
                    } />
                    ${t.toggleBand(this.state.therapeuticMin, this.state.therapeuticMax)}
                  </label>
                  <div class="fixed-y-control">
                    <label class="toggle-label" for="toggleFixedY">
                      <input type="checkbox" id="toggleFixedY" ${
                        typeof this.state.fixedYMax === 'number' && this.state.fixedYMax > 0
                          ? 'checked'
                          : ''
                      } />
                      ${t.toggleFixedY}
                    </label>
                    <input
                      type="number"
                      id="fixedYMaxInput"
                      class="fixed-y-input"
                      min="1"
                      max="200"
                      step="1"
                      placeholder="${t.fixedYPlaceholder}"
                      value="${
                        typeof this.state.fixedYMax === 'number' && this.state.fixedYMax > 0
                          ? this.state.fixedYMax
                          : ''
                      }"
                    />
                    <span class="fixed-y-unit">ng/mL</span>
                  </div>
                </div>
              </div>
              <div class="canvas-wrapper">
                <canvas id="plasmaCanvas"></canvas>
              </div>
            </div>

            <div class="timeline-card">
              <div class="timeline-header">
                <div>
                  <h2 class="timeline-title">${t.timelineTitle}</h2>
                  <div class="timeline-hint">${t.timelineHint}</div>
                </div>
                <button class="btn btn-primary" id="quickAddSelectedSlotBtn"><span id="quickSlotLabel"></span></button>
              </div>
              <div class="timeslot-grid" id="timeslotGrid"></div>
              <div class="dose-lanes" id="doseLanes"></div>
            </div>
          </div>

          <aside class="side-panel">
            <div class="panel-card" id="addDosePanel"></div>
            <div class="panel-card">
              <div class="panel-title">
                <span>${t.scheduledDosesTitle} (<span id="doseCountBadge">0</span>)</span>
                <button class="btn btn-danger-ghost" id="clearAllDosesBtn">${t.clearAllBtn}</button>
              </div>
              <div class="dose-list" id="doseListContainer"></div>
            </div>
          </aside>
        </div>
      </div>
      <div class="hover-tooltip" id="hoverTooltip"></div>
      <div id="modalContainer"></div>
    `;

    const canvasEl = this.root.querySelector<HTMLCanvasElement>('#plasmaCanvas');
    if (canvasEl) {
      this.graphCanvas = new PlasmaGraphCanvas(
        canvasEl,
        (point, cx, cy) => this.handleGraphHover(point, cx, cy),
        (slotHourOffset) => {
          this.selectedSlotHours = slotHourOffset;
          this.renderAddDosePanel();
          this.renderTimelineTrack();
        }
      );
    }

    window.addEventListener('resize', () => {
      this.graphCanvas?.resize();
    });

    this.bindTopHeaderEvents();
    this.renderAddDosePanel();
    this.updateSimulationView();
    if (this.activeModal !== 'none') {
      this.renderModal();
    }
  }

  private bindTopHeaderEvents(): void {
    this.root.querySelectorAll<HTMLButtonElement>('[data-set-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.setLang as Language;
        this.setLanguage(lang);
      });
    });

    const presetSelect = this.root.querySelector<HTMLSelectElement>('#presetSelect');
    presetSelect?.addEventListener('change', () => {
      const preset = REGIMEN_PRESETS.find((p) => p.id === presetSelect.value);
      if (preset) {
        this.state.startOfDayHour = preset.startOfDayHour;
        this.state.windowHours = preset.windowHours;
        this.state.scheduledDoses = preset.doses.map((d, idx) => ({
          ...d,
          id: `dose-${Date.now()}-${idx}`
        }));

        const startSel = this.root.querySelector<HTMLSelectElement>('#startOfDaySelect');
        if (startSel) {
          startSel.value = String(this.state.startOfDayHour);
        }
        const winSel = this.root.querySelector<HTMLSelectElement>('#windowSelect');
        if (winSel) {
          winSel.value = String(this.state.windowHours);
        }

        this.persistState();
        this.renderAddDosePanel();
        this.updateSimulationView();
        presetSelect.value = '';
      }
    });

    const startOfDaySelect = this.root.querySelector<HTMLSelectElement>('#startOfDaySelect');
    startOfDaySelect?.addEventListener('change', () => {
      this.state.startOfDayHour = Number(startOfDaySelect.value);
      this.persistState();
      this.renderAddDosePanel();
      this.updateSimulationView();
    });

    const windowSelect = this.root.querySelector<HTMLSelectElement>('#windowSelect');
    windowSelect?.addEventListener('change', () => {
      this.state.windowHours = Number(windowSelect.value);
      if (this.selectedSlotHours > this.state.windowHours - 0.5) {
        this.selectedSlotHours = 0;
      }
      this.persistState();
      this.renderAddDosePanel();
      this.updateSimulationView();
    });

    const toggleIndividual = this.root.querySelector<HTMLInputElement>('#toggleIndividual');
    toggleIndividual?.addEventListener('change', () => {
      this.state.showIndividualCurves = toggleIndividual.checked;
      this.persistState();
      this.updateSimulationView();
    });

    const toggleKnots = this.root.querySelector<HTMLInputElement>('#toggleKnots');
    toggleKnots?.addEventListener('change', () => {
      this.state.showDataPoints = toggleKnots.checked;
      this.persistState();
      this.updateSimulationView();
    });

    const toggleBand = this.root.querySelector<HTMLInputElement>('#toggleBand');
    toggleBand?.addEventListener('change', () => {
      this.state.showTherapeuticBand = toggleBand.checked;
      this.persistState();
      this.updateSimulationView();
    });

    const toggleFixedY = this.root.querySelector<HTMLInputElement>('#toggleFixedY');
    const fixedYMaxInput = this.root.querySelector<HTMLInputElement>('#fixedYMaxInput');

    toggleFixedY?.addEventListener('change', () => {
      if (toggleFixedY.checked) {
        const parsed = Number(fixedYMaxInput?.value);
        const val = Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
        this.state.fixedYMax = val;
        if (fixedYMaxInput) {
          fixedYMaxInput.value = String(val);
        }
      } else {
        this.state.fixedYMax = null;
        if (fixedYMaxInput) {
          fixedYMaxInput.value = '';
        }
      }
      this.persistState();
      this.updateSimulationView();
    });

    fixedYMaxInput?.addEventListener('input', () => {
      const raw = fixedYMaxInput.value.trim();
      if (!raw) {
        this.state.fixedYMax = null;
        if (toggleFixedY) {
          toggleFixedY.checked = false;
        }
        this.persistState();
        this.updateSimulationView();
        return;
      }
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        this.state.fixedYMax = parsed;
        if (toggleFixedY && !toggleFixedY.checked) {
          toggleFixedY.checked = true;
        }
        this.persistState();
        this.updateSimulationView();
      }
    });

    const quickAddBtn = this.root.querySelector<HTMLButtonElement>('#quickAddSelectedSlotBtn');
    quickAddBtn?.addEventListener('click', () => {
      this.addDose(this.selectedModelId, this.selectedSlotHours, this.selectedMultiplier);
    });

    const clearAllBtn = this.root.querySelector<HTMLButtonElement>('#clearAllDosesBtn');
    clearAllBtn?.addEventListener('click', () => {
      this.state.scheduledDoses = [];
      this.persistState();
      this.updateSimulationView();
    });

    const openSourcesBtn = this.root.querySelector<HTMLButtonElement>('#openSourcesBtn');
    openSourcesBtn?.addEventListener('click', () => {
      this.activeModal = 'sources';
      this.renderModal();
    });

    const openCustomBtn = this.root.querySelector<HTMLButtonElement>('#openCustomModelBtn');
    openCustomBtn?.addEventListener('click', () => {
      this.activeModal = 'custom-model';
      this.renderModal();
    });

    const shareUrlBtn = this.root.querySelector<HTMLButtonElement>('#shareUrlBtn');
    shareUrlBtn?.addEventListener('click', () => {
      const encoded = btoa(encodeURIComponent(JSON.stringify(this.state)));
      const url = `${window.location.origin}${window.location.pathname}#state=${encoded}`;
      window.history.replaceState(null, '', `#state=${encoded}`);
      navigator.clipboard?.writeText(url);
      shareUrlBtn.textContent = this.t.copiedLinkBtn;
      setTimeout(() => {
        shareUrlBtn.textContent = this.t.shareUrlBtn;
      }, 1800);
    });
  }

  private renderAddDosePanel(): void {
    const container = this.root.querySelector<HTMLElement>('#addDosePanel');
    if (!container) {
      return;
    }

    const t = this.t;
    const allModels = getAllModels();
    const brands = getBrands();
    if (!brands.includes(this.selectedBrand)) {
      this.selectedBrand = brands[0];
    }

    const brandModels = allModels.filter((m) => m.brand === this.selectedBrand);
    if (!brandModels.some((m) => m.id === this.selectedModelId)) {
      this.selectedModelId = brandModels[0]?.id || allModels[0].id;
    }

    const currentModel = getModelById(this.selectedModelId) || allModels[0];
    const singlePeak = Math.max(...currentModel.model.map((pt) => pt.y));
    const singlePeakHour = currentModel.model.find((pt) => pt.y === singlePeak)?.x ?? 0;

    // Build half-hour time slot options across the window
    const slotOptions: string[] = [];
    const totalHalfHours = Math.min(48, this.state.windowHours * 2);
    for (let s = 0; s <= totalHalfHours; s++) {
      const offsetH = s / 2;
      const clock = formatClockHour(this.state.startOfDayHour + offsetH);
      const sel = Math.abs(offsetH - this.selectedSlotHours) < 0.01 ? 'selected' : '';
      slotOptions.push(
        `<option value="${offsetH}" ${sel}>${clock} (${formatOffsetHours(offsetH)} ${
          t.fromStartSuffix
        })</option>`
      );
    }

    const quickSlots = [0, 0.5, 1, 2, 4, 5, 6, 8, 9, 12];

    container.innerHTML = `
      <h2 class="panel-title">
        <span>${t.addDosePanelTitle}</span>
        <span class="badge badge-blue">${formatClockHour(
          this.state.startOfDayHour + this.selectedSlotHours
        )}</span>
      </h2>

      <div class="form-group">
        <label for="brandSelect">${t.fieldBrand}</label>
        <select class="form-control" id="brandSelect">
          ${brands
            .map(
              (b) =>
                `<option value="${b}" ${b === this.selectedBrand ? 'selected' : ''}>${b}</option>`
            )
            .join('')}
        </select>
      </div>

      <div class="form-group">
        <label for="modelSelect">${t.fieldProduct}</label>
        <select class="form-control" id="modelSelect">
          ${brandModels
            .map(
              (m) =>
                `<option value="${m.id}" ${m.id === this.selectedModelId ? 'selected' : ''}>${
                  m.name
                } — ${t.peakLabel} ${Math.max(...m.model.map((p) => p.y)).toFixed(1)} ng/mL</option>`
            )
            .join('')}
        </select>
      </div>

      <div class="model-preview-box">
        <div class="model-preview-meta">
          <span class="badge badge-blue">${currentModel.releaseProfile}</span>
          <span class="badge badge-green">${t.durationBadge(currentModel.durationHours)}</span>
          <span class="badge">${t.singlePeakBadge(
            singlePeak.toFixed(2),
            singlePeakHour
          )}</span>
        </div>
        <div style="color: var(--text-secondary); margin-top: 4px;">
          ${currentModel.activeSubstance} • <span style="color: var(--text-muted);">${
      currentModel.sourceTitle
    }</span>
        </div>
        ${
          currentModel.notes
            ? `<div style="margin-top:4px; color:#7c3aed; font-weight:600;">${currentModel.notes}</div>`
            : ''
        }
      </div>

      <div class="form-row-2col">
        <div class="form-group">
          <label for="slotSelect">${t.fieldTimeSlot}</label>
          <select class="form-control" id="slotSelect">
            ${slotOptions.join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="multiplierSelect">${t.fieldMultiplier}</label>
          <select class="form-control" id="multiplierSelect">
            ${[0.5, 1, 1.5, 2, 2.5, 3]
              .map(
                (mult) =>
                  `<option value="${mult}" ${
                    mult === this.selectedMultiplier ? 'selected' : ''
                  }>${mult}× (${(currentModel.doseMg * mult).toFixed(1)} mg)</option>`
              )
              .join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>${t.quickSlotPickerLabel}</label>
        <div class="quick-slots">
          ${quickSlots
            .map((h) => {
              const active = Math.abs(this.selectedSlotHours - h) < 0.01 ? 'active' : '';
              return `<button type="button" class="chip-btn ${active}" data-quick-slot="${h}">
                ${formatClockHour(this.state.startOfDayHour + h)} (+${h}h)
              </button>`;
            })
            .join('')}
        </div>
      </div>

      <button class="btn btn-primary" id="addDoseSubmitBtn" style="width: 100%; padding: 10px; font-size: 13.5px; margin-top: 4px;">
        ${t.addDoseSubmitBtn(
          currentModel.brand,
          (currentModel.doseMg * this.selectedMultiplier).toFixed(1),
          formatClockHour(this.state.startOfDayHour + this.selectedSlotHours)
        )}
      </button>
    `;

    const quickSlotLabel = this.root.querySelector<HTMLElement>('#quickSlotLabel');
    if (quickSlotLabel) {
      const slotStr = `${formatClockHour(
        this.state.startOfDayHour + this.selectedSlotHours
      )} (${formatOffsetHours(this.selectedSlotHours)})`;
      quickSlotLabel.textContent = t.quickAddSelectedSlotBtn(slotStr);
    }

    container.querySelector<HTMLSelectElement>('#brandSelect')?.addEventListener('change', (e) => {
      this.selectedBrand = (e.target as HTMLSelectElement).value;
      const firstInBrand = getAllModels().find((m) => m.brand === this.selectedBrand);
      if (firstInBrand) {
        this.selectedModelId = firstInBrand.id;
      }
      this.renderAddDosePanel();
    });

    container.querySelector<HTMLSelectElement>('#modelSelect')?.addEventListener('change', (e) => {
      this.selectedModelId = (e.target as HTMLSelectElement).value;
      this.renderAddDosePanel();
    });

    container.querySelector<HTMLSelectElement>('#slotSelect')?.addEventListener('change', (e) => {
      this.selectedSlotHours = Number((e.target as HTMLSelectElement).value);
      this.renderAddDosePanel();
      this.renderTimelineTrack();
    });

    container
      .querySelector<HTMLSelectElement>('#multiplierSelect')
      ?.addEventListener('change', (e) => {
        this.selectedMultiplier = Number((e.target as HTMLSelectElement).value);
        this.renderAddDosePanel();
      });

    container.querySelectorAll<HTMLButtonElement>('[data-quick-slot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedSlotHours = Number(btn.dataset.quickSlot);
        this.renderAddDosePanel();
        this.renderTimelineTrack();
      });
    });

    container.querySelector<HTMLButtonElement>('#addDoseSubmitBtn')?.addEventListener('click', () => {
      this.addDose(this.selectedModelId, this.selectedSlotHours, this.selectedMultiplier);
    });
  }

  public addDose(modelId: string, timeSlotHours: number, multiplier: number = 1): void {
    const newDose: ScheduledDose = {
      id: `dose-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      modelId,
      timeSlotHours: Math.max(0, Math.min(this.state.windowHours - 0.5, timeSlotHours)),
      multiplier,
      color: this.nextColor(),
      enabled: true
    };
    this.state.scheduledDoses.push(newDose);
    this.state.scheduledDoses.sort((a, b) => a.timeSlotHours - b.timeSlotHours);
    this.persistState();
    this.updateSimulationView();
  }

  private updateSimulationView(): void {
    const result = runSimulation(this.state);
    this.renderKpiStrip(result);
    this.graphCanvas?.render(this.state, result);
    this.renderTimelineTrack();
    this.renderDoseList(result);
  }

  private renderKpiStrip(result: SimulationResult): void {
    const strip = this.root.querySelector<HTMLElement>('#kpiStrip');
    if (!strip) {
      return;
    }

    const { summary } = result;
    const t = this.t;
    strip.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">${t.kpiTotalDose}</div>
        <div class="kpi-value">${summary.totalDailyMg} mg</div>
        <div class="kpi-sub">${t.kpiActiveDoses(summary.activeDoseCount)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">${t.kpiPeakPlasma}</div>
        <div class="kpi-value">${summary.cMax.toFixed(2)} ng/mL</div>
        <div class="kpi-sub">${t.kpiCombinedPeak}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">${t.kpiPeakClockTime}</div>
        <div class="kpi-value">${summary.activeDoseCount > 0 ? summary.tMaxClockFormatted : '—'}</div>
        <div class="kpi-sub">${
          summary.activeDoseCount > 0
            ? t.kpiFromStartOfDay(formatOffsetHours(summary.tMaxHoursFromStart))
            : t.kpiNoActiveDoses
        }</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">${t.kpiTotalExposure}</div>
        <div class="kpi-value">${summary.auc24.toFixed(1)} <span style="font-size:13px;font-weight:600;">ng·h/mL</span></div>
        <div class="kpi-sub">${t.kpiOverWindow(this.state.windowHours)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">${t.kpiTargetBand(
          this.state.therapeuticMin,
          this.state.therapeuticMax
        )}</div>
        <div class="kpi-value">${summary.hoursInTherapeuticRange.toFixed(1)} h</div>
        <div class="kpi-sub">${t.kpiDurationInBand}</div>
      </div>
    `;
  }

  private renderTimelineTrack(): void {
    const grid = this.root.querySelector<HTMLElement>('#timeslotGrid');
    const lanes = this.root.querySelector<HTMLElement>('#doseLanes');
    if (!grid || !lanes) {
      return;
    }

    const t = this.t;
    const hoursToShow = Math.min(24, this.state.windowHours);
    const cellsHtml: string[] = [];

    for (let h = 0; h < hoursToShow; h++) {
      const isSelected = Math.floor(this.selectedSlotHours) === h;
      const dosesInHour = this.state.scheduledDoses.filter(
        (d) => Math.floor(d.timeSlotHours) === h
      );
      const clockStr = formatClockHour(this.state.startOfDayHour + h);

      cellsHtml.push(`
        <div class="timeslot-cell ${
          isSelected ? 'selected-slot' : ''
        }" data-slot-hour="${h}" title="${t.slotCellTooltip(clockStr, `+${h}h`)}">
          <span class="slot-clock">${clockStr}</span>
          <span class="slot-offset">+${h}h</span>
          <div class="slot-dots">
            ${dosesInHour
              .map((d) => {
                const med = getModelById(d.modelId);
                const shortMg = med ? `${med.doseMg * d.multiplier}mg` : 'Dose';
                return `<span class="slot-pill-badge" style="background:${d.color}; opacity:${
                  d.enabled ? 1 : 0.4
                }">${shortMg}</span>`;
              })
              .join('')}
          </div>
        </div>
      `);
    }

    grid.innerHTML = cellsHtml.join('');

    grid.querySelectorAll<HTMLElement>('[data-slot-hour]').forEach((cell) => {
      cell.addEventListener('click', () => {
        this.selectedSlotHours = Number(cell.dataset.slotHour);
        this.renderAddDosePanel();
        this.renderTimelineTrack();
      });
      cell.addEventListener('dblclick', () => {
        const h = Number(cell.dataset.slotHour);
        this.selectedSlotHours = h;
        this.addDose(this.selectedModelId, h, this.selectedMultiplier);
      });
    });

    // Render draggable horizontal dose bars
    if (this.state.scheduledDoses.length === 0) {
      lanes.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding: 6px;">${t.noDosesInTrack}</div>`;
      return;
    }

    lanes.innerHTML = this.state.scheduledDoses
      .map((dose) => {
        const med = getModelById(dose.modelId);
        if (!med) {
          return '';
        }
        const leftPercent = Math.max(
          2,
          Math.min(98, (dose.timeSlotHours / this.state.windowHours) * 100)
        );
        const clock = formatClockHour(this.state.startOfDayHour + dose.timeSlotHours);
        const effectiveMg = Number((med.doseMg * dose.multiplier).toFixed(1));
        return `
          <div class="dose-lane" data-lane-dose-id="${dose.id}">
            <div
              class="draggable-dose-pill"
              data-drag-dose-id="${dose.id}"
              style="left: ${leftPercent}%; background: ${dose.color}; opacity: ${
          dose.enabled ? 1 : 0.45
        };"
              title="${t.dragPillTooltip}"
            >
              <span>⇄ ${clock} (${formatOffsetHours(dose.timeSlotHours)})</span>
              <span>• ${med.brand} ${effectiveMg} mg</span>
            </div>
          </div>
        `;
      })
      .join('');

    lanes.querySelectorAll<HTMLElement>('[data-drag-dose-id]').forEach((pill) => {
      pill.addEventListener('pointerdown', (ev: PointerEvent) => {
        ev.preventDefault();
        const doseId = pill.dataset.dragDoseId;
        const lane = pill.parentElement;
        if (!doseId || !lane) {
          return;
        }
        const dose = this.state.scheduledDoses.find((d) => d.id === doseId);
        if (!dose) {
          return;
        }

        pill.setPointerCapture(ev.pointerId);
        const laneRect = lane.getBoundingClientRect();

        const onMove = (moveEv: PointerEvent): void => {
          const relX = Math.max(0, Math.min(laneRect.width, moveEv.clientX - laneRect.left));
          const rawHours = (relX / laneRect.width) * this.state.windowHours;
          const snappedHalfHour = Math.round(rawHours * 2) / 2;
          if (snappedHalfHour !== dose.timeSlotHours) {
            dose.timeSlotHours = Math.max(0, Math.min(this.state.windowHours - 0.5, snappedHalfHour));
            this.persistState();
            this.updateSimulationView();
          }
        };

        const onUp = (): void => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });
    });
  }

  private renderDoseList(result: SimulationResult): void {
    const listContainer = this.root.querySelector<HTMLElement>('#doseListContainer');
    const countBadge = this.root.querySelector<HTMLElement>('#doseCountBadge');
    if (!listContainer || !countBadge) {
      return;
    }

    const t = this.t;
    countBadge.textContent = String(this.state.scheduledDoses.length);

    if (this.state.scheduledDoses.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding: 18px 10px; color: var(--text-muted); font-size: 13px;">
          ${t.noDosesInList}
        </div>
      `;
      return;
    }

    const totalHalfHours = Math.min(72, this.state.windowHours * 2);

    listContainer.innerHTML = this.state.scheduledDoses
      .map((dose) => {
        const med = getModelById(dose.modelId);
        if (!med) {
          return '';
        }
        const evalData = result.doseEvaluations.find((e) => e.dose.id === dose.id);
        const effectiveMg = Number((med.doseMg * dose.multiplier).toFixed(1));
        const doseClock = formatClockHour(this.state.startOfDayHour + dose.timeSlotHours);
        const peakClock = evalData
          ? formatClockHour(this.state.startOfDayHour + evalData.tMaxHoursFromStart)
          : '—';

        const slotOptions: string[] = [];
        for (let s = 0; s <= totalHalfHours; s++) {
          const h = s / 2;
          const sel = Math.abs(h - dose.timeSlotHours) < 0.01 ? 'selected' : '';
          slotOptions.push(
            `<option value="${h}" ${sel}>${formatClockHour(
              this.state.startOfDayHour + h
            )} (${formatOffsetHours(h)})</option>`
          );
        }

        return `
          <div class="dose-item ${dose.enabled ? '' : 'disabled'}" data-dose-card="${dose.id}">
            <div class="dose-item-top">
              <div class="dose-title-wrap">
                <input
                  type="checkbox"
                  data-toggle-dose="${dose.id}"
                  ${dose.enabled ? 'checked' : ''}
                  title="${t.toggleDoseTooltip}"
                />
                <span class="color-swatch" style="background: ${dose.color}"></span>
                <div>
                  <div class="dose-name">${med.name} ${
          dose.multiplier !== 1 ? `(${dose.multiplier}× = ${effectiveMg} mg)` : ''
        }</div>
                  <div class="dose-submeta">
                    <span class="badge">${med.releaseProfile}</span>
                    ${
                      evalData
                        ? `${t.peakLabel}: <strong>${evalData.cMax.toFixed(
                            2
                          )} ng/mL</strong> @ ${peakClock}`
                        : t.mutedLabel
                    }
                  </div>
                </div>
              </div>
              <div style="display:flex; gap:4px;">
                <button class="btn" style="padding:3px 7px; font-size:11px;" data-dup-dose="${
                  dose.id
                }" title="${t.copyPlus4hTooltip}">${t.copyPlus4hBtn}</button>
                <button class="btn btn-danger-ghost" data-del-dose="${
                  dose.id
                }" title="${t.removeDoseTooltip}">✕</button>
              </div>
            </div>

            <div class="dose-controls-row">
              <div class="slot-stepper">
                <button class="stepper-btn" data-step-dose="${dose.id}" data-step-delta="-0.5" title="${
          t.moveEarlierTooltip
        }">-30m</button>
                <select class="slot-time-select" data-slot-select-dose="${dose.id}" aria-label="Dose Time Slot for ${
          med.name
        } at ${doseClock}">
                  ${slotOptions.join('')}
                </select>
                <button class="stepper-btn" data-step-dose="${dose.id}" data-step-delta="0.5" title="${
          t.moveLaterTooltip
        }">+30m</button>
              </div>

              <div style="display:flex; align-items:center; gap:5px; font-size:11.5px;">
                <label>${t.doseShortLabel}</label>
                <select class="slot-time-select" data-mult-select-dose="${dose.id}" aria-label="Dose multiplier">
                  ${[0.5, 1, 1.5, 2, 2.5, 3]
                    .map(
                      (m) =>
                        `<option value="${m}" ${
                          m === dose.multiplier ? 'selected' : ''
                        }>${m}× (${(med.doseMg * m).toFixed(1)} mg)</option>`
                    )
                    .join('')}
                </select>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    listContainer.querySelectorAll<HTMLInputElement>('[data-toggle-dose]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const dose = this.state.scheduledDoses.find((d) => d.id === cb.dataset.toggleDose);
        if (dose) {
          dose.enabled = cb.checked;
          this.persistState();
          this.updateSimulationView();
        }
      });
    });

    listContainer.querySelectorAll<HTMLButtonElement>('[data-del-dose]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.scheduledDoses = this.state.scheduledDoses.filter(
          (d) => d.id !== btn.dataset.delDose
        );
        this.persistState();
        this.updateSimulationView();
      });
    });

    listContainer.querySelectorAll<HTMLButtonElement>('[data-dup-dose]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const orig = this.state.scheduledDoses.find((d) => d.id === btn.dataset.dupDose);
        if (orig) {
          this.addDose(
            orig.modelId,
            Math.min(this.state.windowHours - 0.5, orig.timeSlotHours + 4),
            orig.multiplier
          );
        }
      });
    });

    listContainer.querySelectorAll<HTMLButtonElement>('[data-step-dose]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dose = this.state.scheduledDoses.find((d) => d.id === btn.dataset.stepDose);
        const delta = Number(btn.dataset.stepDelta);
        if (dose) {
          dose.timeSlotHours = Math.max(
            0,
            Math.min(this.state.windowHours - 0.5, dose.timeSlotHours + delta)
          );
          this.persistState();
          this.updateSimulationView();
        }
      });
    });

    listContainer
      .querySelectorAll<HTMLSelectElement>('[data-slot-select-dose]')
      .forEach((sel) => {
        sel.addEventListener('change', () => {
          const dose = this.state.scheduledDoses.find(
            (d) => d.id === sel.dataset.slotSelectDose
          );
          if (dose) {
            dose.timeSlotHours = Number(sel.value);
            this.persistState();
            this.updateSimulationView();
          }
        });
      });

    listContainer
      .querySelectorAll<HTMLSelectElement>('[data-mult-select-dose]')
      .forEach((sel) => {
        sel.addEventListener('change', () => {
          const dose = this.state.scheduledDoses.find(
            (d) => d.id === sel.dataset.multSelectDose
          );
          if (dose) {
            dose.multiplier = Number(sel.value);
            this.persistState();
            this.updateSimulationView();
          }
        });
      });
  }

  private handleGraphHover(point: SimulationPoint | null, clientX: number, clientY: number): void {
    const tooltip = this.root.querySelector<HTMLElement>('#hoverTooltip');
    if (!tooltip) {
      return;
    }

    if (!point) {
      tooltip.style.display = 'none';
      return;
    }

    tooltip.style.display = 'block';
    const left = Math.min(window.innerWidth - 260, clientX + 16);
    const top = Math.max(16, clientY - 30);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    const t = this.t;
    tooltip.innerHTML = `
      <div class="tooltip-header">
        <span>${t.tooltipClock} ${point.clockFormatted}</span>
        <span>${formatOffsetHours(point.hourFromStart)}</span>
      </div>
      <div class="tooltip-total">
        <span>${t.tooltipTotalPlasma}</span>
        <span>${point.totalConcentration.toFixed(2)} ng/mL</span>
      </div>
      ${point.contributions
        .map(
          (c) => `
        <div class="tooltip-row">
          <span><span class="tooltip-dot" style="background:${c.color}"></span>${c.label}</span>
          <strong>${c.concentration.toFixed(2)} ng/mL</strong>
        </div>
      `
        )
        .join('')}
    `;
  }

  private renderModal(): void {
    const modalContainer = this.root.querySelector<HTMLElement>('#modalContainer');
    if (!modalContainer) {
      return;
    }

    if (this.activeModal === 'none') {
      modalContainer.innerHTML = '';
      return;
    }

    const t = this.t;
    if (this.activeModal === 'sources') {
      const models = getAllModels();
      modalContainer.innerHTML = `
        <div class="modal-backdrop" id="modalBackdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3 style="margin:0;">${t.sourcesModalTitle(models.length)}</h3>
              <button class="btn" id="closeModalBtn">${t.modalCloseBtn}</button>
            </div>
            <div class="modal-body">
              <p style="margin-top:0; font-size:13px; color:var(--text-secondary);">
                ${t.sourcesModalIntro}
              </p>
              <table class="catalog-table">
                <thead>
                  <tr>
                    <th>${t.tableBrand}</th>
                    <th>${t.tableProduct}</th>
                    <th>${t.tableReleaseRatio}</th>
                    <th>${t.tableSinglePeak}</th>
                    <th>${t.tableDuration}</th>
                    <th>${t.tableSource}</th>
                  </tr>
                </thead>
                <tbody>
                  ${models
                    .map((m) => {
                      const peak = Math.max(...m.model.map((p) => p.y));
                      const peakT = m.model.find((p) => p.y === peak)?.x ?? 0;
                      return `
                        <tr>
                          <td><strong>${m.brand}</strong></td>
                          <td>${m.name} ${
                        m.isLegacyOriginal
                          ? `<span class="badge">${t.tableOriginalBadge}</span>`
                          : ''
                      }</td>
                          <td><span class="badge badge-blue">${m.releaseProfile}</span></td>
                          <td>${peak.toFixed(2)} ng/mL @ +${peakT}h</td>
                          <td>${m.durationHours}</td>
                          <td>
                            ${
                              m.source
                                ? `<a href="${m.source}" target="_blank" rel="noopener noreferrer">${m.sourceTitle}</a>`
                                : m.sourceTitle
                            }
                          </td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>

              <h4 style="margin-top: 22px; margin-bottom: 8px;">${t.refGalleryTitle}</h4>
              <div class="ref-gallery">
                <div class="ref-card">
                  <img src="/reference/Concerta-FDA.jpg" alt="Concerta FDA PK" />
                  <div><strong>Concerta 18 / 36 / 54 mg</strong> — FDA NDA 021121 Clinical Pharmacology</div>
                </div>
                <div class="ref-card">
                  <img src="/reference/Medikinet 20 mg.png" alt="Medikinet 20 mg PK" />
                  <div><strong>Medikinet CR 20 mg</strong> — EU PAR NL/H/0529</div>
                </div>
                <div class="ref-card">
                  <img src="/reference/US06344215-20020205-D00001.png" alt="Ritalin IR & MR Patent" />
                  <div><strong>Ritalin IR 10 mg &amp; MR 25 mg</strong> — US Patent US06344215</div>
                </div>
                <div class="ref-card">
                  <img src="/reference/Ritalin®+LA+vs.+Concerta®.jpg" alt="Ritalin LA vs Concerta" />
                  <div><strong>Ritalin LA 20 mg vs Concerta 18 mg</strong> — Bimodal 50:50 vs OROS 22:78</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeModal === 'custom-model') {
      modalContainer.innerHTML = `
        <div class="modal-backdrop" id="modalBackdrop">
          <div class="modal-card" style="max-width: 560px;">
            <div class="modal-header">
              <h3 style="margin:0;">${t.customModalTitle}</h3>
              <button class="btn" id="closeModalBtn">${t.modalCloseBtn}</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="customBrand">${t.customBrandLabel}</label>
                <input class="form-control" id="customBrand" value="Custom Formulation" />
              </div>
              <div class="form-row-2col">
                <div class="form-group">
                  <label for="customName">${t.customNameLabel}</label>
                  <input class="form-control" id="customName" placeholder="e.g. Generic MPH ER 30 mg" value="Custom MPH 25 mg" />
                </div>
                <div class="form-group">
                  <label for="customDoseMg">${t.customDoseLabel}</label>
                  <input type="number" class="form-control" id="customDoseMg" value="25" />
                </div>
              </div>
              <div class="form-row-2col">
                <div class="form-group">
                  <label for="customRelease">${t.customReleaseLabel}</label>
                  <input class="form-control" id="customRelease" value="Custom ER" />
                </div>
                <div class="form-group">
                  <label for="customDuration">${t.customDurationLabel}</label>
                  <input class="form-control" id="customDuration" value="8–10h" />
                </div>
              </div>
              <div class="form-group">
                <label for="customPoints">${t.customPointsLabel}</label>
                <textarea class="form-control" id="customPoints" rows="8" style="font-family: monospace;">0, 0
1, 4.2
2, 6.8
4, 5.9
6, 7.4
8, 5.1
10, 3.2
12, 1.8
16, 0.6
24, 0.1</textarea>
              </div>
              <button class="btn btn-primary" id="saveCustomModelBtn" style="width:100%; padding:10px;">${t.customSaveBtn}</button>
            </div>
          </div>
        </div>
      `;

      modalContainer
        .querySelector<HTMLButtonElement>('#saveCustomModelBtn')
        ?.addEventListener('click', () => {
          const brand =
            modalContainer.querySelector<HTMLInputElement>('#customBrand')?.value.trim() ||
            'Custom';
          const name =
            modalContainer.querySelector<HTMLInputElement>('#customName')?.value.trim() ||
            'Custom Model';
          const doseMg =
            Number(modalContainer.querySelector<HTMLInputElement>('#customDoseMg')?.value) || 20;
          const releaseProfile =
            modalContainer.querySelector<HTMLInputElement>('#customRelease')?.value.trim() ||
            'Custom';
          const durationHours =
            modalContainer.querySelector<HTMLInputElement>('#customDuration')?.value.trim() ||
            '8h';
          const rawLines =
            modalContainer.querySelector<HTMLTextAreaElement>('#customPoints')?.value || '';

          const points: DataPoint[] = rawLines
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [xStr, yStr] = line.split(/[,\s]+/);
              return { x: Number(xStr), y: Number(yStr) };
            })
            .filter((pt) => !Number.isNaN(pt.x) && !Number.isNaN(pt.y))
            .sort((a, b) => a.x - b.x);

          if (points.length >= 2) {
            const customModel: MedicineModel = {
              id: `custom-${Date.now()}`,
              brand,
              name,
              doseMg,
              releaseProfile,
              activeSubstance: 'd,l-threo-methylphenidate HCl',
              durationHours,
              source: '',
              sourceTitle: 'User-defined custom PK profile',
              disclaimer: 'Custom user-created pharmacokinetic curve.',
              isCustom: true,
              model: points
            };
            const existing = loadCustomModels();
            existing.push(customModel);
            saveCustomModels(existing);

            this.selectedBrand = customModel.brand;
            this.selectedModelId = customModel.id;
            this.activeModal = 'none';
            this.renderModal();
            this.renderAddDosePanel();

            const sourcesBtn = this.root.querySelector<HTMLButtonElement>('#openSourcesBtn');
            if (sourcesBtn) {
              sourcesBtn.textContent = t.modelsSourcesBtn(getAllModels().length);
            }
          }
        });
    }

    modalContainer.querySelector<HTMLButtonElement>('#closeModalBtn')?.addEventListener('click', () => {
      this.activeModal = 'none';
      this.renderModal();
    });

    modalContainer.querySelector<HTMLElement>('#modalBackdrop')?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'modalBackdrop') {
        this.activeModal = 'none';
        this.renderModal();
      }
    });
  }
}
