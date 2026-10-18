import {
  DataPoint,
  SimulationPoint,
  SimulationResult,
  SimulatorState
} from '../types/models';
import { formatClockHour, formatOffsetHours } from '../engine/pharmacokinetics';
import { TRANSLATIONS } from '../i18n/translations';

export interface GraphHoverCallback {
  (point: SimulationPoint | null, clientX: number, clientY: number): void;
}

export interface GraphSlotClickCallback {
  (slotHourOffset: number): void;
}

export class PlasmaGraphCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: SimulatorState | null = null;
  private result: SimulationResult | null = null;
  private hoveredHourOffset: number | null = null;
  private onHover: GraphHoverCallback;
  private onSlotClick: GraphSlotClickCallback;

  private readonly padding = {
    top: 38,
    right: 32,
    bottom: 62,
    left: 68
  };

  constructor(
    canvas: HTMLCanvasElement,
    onHover: GraphHoverCallback,
    onSlotClick: GraphSlotClickCallback
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to initialize 2D canvas context');
    }
    this.ctx = context;
    this.onHover = onHover;
    this.onSlotClick = onSlotClick;
    this.bindEvents();
  }

  public render(state: SimulatorState, result: SimulationResult): void {
    this.state = state;
    this.result = result;
    this.draw();
  }

  public resize(): void {
    if (this.state && this.result) {
      this.draw();
    }
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.state || !this.result) {
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const plotWidth = rect.width - this.padding.left - this.padding.right;

      if (x < this.padding.left || x > rect.width - this.padding.right) {
        this.hoveredHourOffset = null;
        this.draw();
        this.onHover(null, e.clientX, e.clientY);
        return;
      }

      const ratio = Math.max(0, Math.min(1, (x - this.padding.left) / plotWidth));
      const rawHour = ratio * this.state.windowHours;
      const snappedHour = Math.round(rawHour * 4) / 4; // Snap to 15-min (0.25h) steps
      this.hoveredHourOffset = snappedHour;

      const simPoint =
        this.result.timeline.find((pt) => Math.abs(pt.hourFromStart - snappedHour) < 0.05) ||
        null;

      this.draw();
      this.onHover(simPoint, e.clientX, e.clientY);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredHourOffset = null;
      if (this.state && this.result) {
        this.draw();
      }
      this.onHover(null, 0, 0);
    });

    this.canvas.addEventListener('click', (e: MouseEvent) => {
      if (!this.state) {
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const plotWidth = rect.width - this.padding.left - this.padding.right;
      if (x < this.padding.left || x > rect.width - this.padding.right) {
        return;
      }
      const ratio = Math.max(0, Math.min(1, (x - this.padding.left) / plotWidth));
      const rawHour = ratio * this.state.windowHours;
      const snappedHalfHour = Math.round(rawHour * 2) / 2;
      this.onSlotClick(snappedHalfHour);
    });
  }

  private draw(): void {
    if (!this.state || !this.result) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(280, rect.height);

    if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const plotLeft = this.padding.left;
    const plotRight = width - this.padding.right;
    const plotTop = this.padding.top;
    const plotBottom = height - this.padding.bottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const autoMaxConc = Math.max(
      10,
      Math.ceil(this.result.summary.cMax * 1.18),
      this.state.showTherapeuticBand ? Math.ceil(this.state.therapeuticMax * 1.15) : 10
    );
    const maxConc =
      typeof this.state.fixedYMax === 'number' && this.state.fixedYMax > 0
        ? this.state.fixedYMax
        : autoMaxConc;

    const xToPx = (hourOffset: number): number =>
      plotLeft + (hourOffset / this.state!.windowHours) * plotWidth;
    const yToPx = (conc: number): number =>
      plotBottom - (conc / maxConc) * plotHeight;

    // 1. Optional Therapeutic Range Band
    if (this.state.showTherapeuticBand && this.state.therapeuticMax > this.state.therapeuticMin) {
      const bandTop = Math.max(plotTop, yToPx(this.state.therapeuticMax));
      const bandBottom = Math.min(plotBottom, yToPx(this.state.therapeuticMin));
      ctx.fillStyle = 'rgba(22, 163, 74, 0.08)';
      ctx.fillRect(plotLeft, bandTop, plotWidth, Math.max(0, bandBottom - bandTop));

      ctx.save();
      ctx.strokeStyle = 'rgba(22, 163, 74, 0.32)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, bandTop);
      ctx.lineTo(plotRight, bandTop);
      ctx.moveTo(plotLeft, bandBottom);
      ctx.lineTo(plotRight, bandBottom);
      ctx.stroke();

      ctx.fillStyle = 'rgba(21, 128, 61, 0.85)';
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      const dict = TRANSLATIONS[this.state.language || 'en'];
      ctx.fillText(
        dict.graphTargetBand(this.state.therapeuticMin, this.state.therapeuticMax),
        plotRight - 8,
        bandTop + 14
      );
      ctx.restore();
    }

    // 2. Gridlines & Axes Marks
    const yStep =
      maxConc <= 6 ? 0.5 : maxConc <= 12 ? 1 : maxConc <= 25 ? 2 : maxConc <= 50 ? 5 : 10;
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    let lastTick = 0;
    for (let c = 0; c <= maxConc + 1e-6; c += yStep) {
      const roundedC = Math.round(c * 100) / 100;
      lastTick = roundedC;
      const y = yToPx(roundedC);
      ctx.strokeStyle = roundedC === 0 ? '#94a3b8' : '#e2e8f0';
      ctx.lineWidth = roundedC === 0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, y);
      ctx.lineTo(plotRight, y);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.fillText(`${roundedC}`, plotLeft - 10, y);
    }

    if (maxConc - lastTick > yStep * 0.25) {
      const y = yToPx(maxConc);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, y);
      ctx.lineTo(plotRight, y);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.fillText(`${Math.round(maxConc * 100) / 100}`, plotLeft - 10, y);
    }

    // X-axis hour ticks and clock labels
    ctx.textAlign = 'center';
    for (let h = 0; h <= this.state.windowHours; h++) {
      const x = xToPx(h);
      const clockHour = (this.state.startOfDayHour + h) % 24;
      const isMidnight = clockHour === 0 && h > 0;

      ctx.strokeStyle = isMidnight ? '#94a3b8' : '#f1f5f9';
      ctx.lineWidth = isMidnight ? 1.25 : 1;
      ctx.beginPath();
      ctx.moveTo(x, plotTop);
      ctx.lineTo(x, plotBottom);
      ctx.stroke();

      // Tick mark
      ctx.strokeStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(x, plotBottom);
      ctx.lineTo(x, plotBottom + 6);
      ctx.stroke();

      // Label every hour (or every 2 hours if window > 28 and narrow screen)
      const labelStep = width < 640 && this.state.windowHours > 20 ? 2 : 1;
      if (h % labelStep === 0) {
        ctx.fillStyle = isMidnight ? '#0f172a' : '#334155';
        ctx.font = isMidnight
          ? '700 11.5px Inter, system-ui, sans-serif'
          : '500 11.5px Inter, system-ui, sans-serif';
        ctx.fillText(formatClockHour(this.state.startOfDayHour + h), x, plotBottom + 18);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.fillText(`+${h}h`, x, plotBottom + 33);
      }
    }

    const dict = TRANSLATIONS[this.state.language || 'en'];

    // Y-axis title
    ctx.save();
    ctx.translate(18, plotTop + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.font = '600 12.5px Inter, system-ui, sans-serif';
    ctx.fillText(dict.graphYAxisLabel, 0, 0);
    ctx.restore();

    // X-axis title
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11.5px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dict.graphXAxisLabel, plotLeft + plotWidth / 2, height - 8);

    // 3. Clip to plot area for curves
    ctx.save();
    ctx.beginPath();
    ctx.rect(plotLeft, plotTop, plotWidth, plotHeight);
    ctx.clip();

    // 4. Combined Total Concentration Area Fill & Solid Curve
    if (this.result.combinedCurvePoints.length > 1 && this.result.summary.activeDoseCount > 0) {
      const grad = ctx.createLinearGradient(0, plotTop, 0, plotBottom);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.16)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.01)');

      ctx.beginPath();
      ctx.moveTo(xToPx(0), plotBottom);
      for (const pt of this.result.combinedCurvePoints) {
        ctx.lineTo(xToPx(pt.x), yToPx(pt.y));
      }
      ctx.lineTo(xToPx(this.state.windowHours), plotBottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Solid total curve
      ctx.beginPath();
      for (let i = 0; i < this.result.combinedCurvePoints.length; i++) {
        const pt = this.result.combinedCurvePoints[i];
        if (i === 0) {
          ctx.moveTo(xToPx(pt.x), yToPx(pt.y));
        } else {
          ctx.lineTo(xToPx(pt.x), yToPx(pt.y));
        }
      }
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // 5. Individual Dose Curves (Dashed)
    if (this.state.showIndividualCurves) {
      for (const evalItem of this.result.doseEvaluations) {
        ctx.save();
        ctx.strokeStyle = evalItem.dose.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        for (let i = 0; i < evalItem.points.length; i++) {
          const pt = evalItem.points[i];
          if (i === 0) {
            ctx.moveTo(xToPx(pt.x), yToPx(pt.y));
          } else {
            ctx.lineTo(xToPx(pt.x), yToPx(pt.y));
          }
        }
        ctx.stroke();
        ctx.restore();

        // Optional published raw knot points
        if (this.state.showDataPoints) {
          this.drawRawKnots(evalItem.shiftedRawPoints, evalItem.dose.color, xToPx, yToPx);
        }
      }
    }

    ctx.restore(); // End plot clip

    // 6. Dose Administration Slot Markers on X-Axis
    for (const evalItem of this.result.doseEvaluations) {
      const slotX = xToPx(evalItem.dose.timeSlotHours);
      if (slotX >= plotLeft && slotX <= plotRight) {
        ctx.save();
        ctx.fillStyle = evalItem.dose.color;
        ctx.beginPath();
        ctx.moveTo(slotX, plotBottom);
        ctx.lineTo(slotX - 6, plotBottom - 10);
        ctx.lineTo(slotX + 6, plotBottom - 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // 7. Cmax Peak Callout Badge
    if (this.result.summary.cMax > 0) {
      const peakX = xToPx(this.result.summary.tMaxHoursFromStart);
      const peakY = Math.max(plotTop, Math.min(plotBottom, yToPx(this.result.summary.cMax)));

      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(peakX, peakY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      const badgeText = dict.graphPeakBadge(
        this.result.summary.cMax.toFixed(2),
        this.result.summary.tMaxClockFormatted
      );
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      const textWidth = ctx.measureText(badgeText).width;
      const boxW = textWidth + 14;
      const boxH = 22;
      const boxX = Math.min(plotRight - boxW - 4, Math.max(plotLeft + 4, peakX - boxW / 2));
      const boxY = Math.max(plotTop + 4, peakY - 30);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 5);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, boxX + 7, boxY + boxH / 2);
      ctx.restore();
    }

    // 8. Interactive Hover Crosshair
    if (this.hoveredHourOffset !== null) {
      const hoverX = xToPx(this.hoveredHourOffset);
      const simPoint = this.result.timeline.find(
        (pt) => Math.abs(pt.hourFromStart - this.hoveredHourOffset!) < 0.05
      );

      ctx.save();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hoverX, plotTop);
      ctx.lineTo(hoverX, plotBottom);
      ctx.stroke();

      if (simPoint) {
        const totalY = Math.max(plotTop, Math.min(plotBottom, yToPx(simPoint.totalConcentration)));
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(hoverX, totalY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        for (const contrib of simPoint.contributions) {
          if (contrib.concentration > 0.01) {
            const cy = Math.max(plotTop, Math.min(plotBottom, yToPx(contrib.concentration)));
            ctx.fillStyle = contrib.color;
            ctx.beginPath();
            ctx.arc(hoverX, cy, 3.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Small time pill at top of crosshair
      const timeLabel = `${formatClockHour(
        this.state.startOfDayHour + this.hoveredHourOffset
      )} (${formatOffsetHours(this.hoveredHourOffset)})`;
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      const tw = ctx.measureText(timeLabel).width + 12;
      const tx = Math.min(plotRight - tw, Math.max(plotLeft, hoverX - tw / 2));
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(tx, plotTop - 24, tw, 20, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(timeLabel, tx + tw / 2, plotTop - 14);
      ctx.restore();
    }

    // Outer L-axis border matching classic graph style
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.moveTo(plotLeft, plotTop);
    ctx.lineTo(plotLeft, plotBottom);
    ctx.lineTo(plotRight, plotBottom);
    ctx.stroke();

    ctx.restore();
  }

  private drawRawKnots(
    points: DataPoint[],
    color: string,
    xToPx: (x: number) => number,
    yToPx: (y: number) => number
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (const pt of points) {
      const px = xToPx(pt.x);
      const py = yToPx(pt.y);
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}
