import {
  DataPoint,
  DoseCurveEvaluation,
  MedicineModel,
  ScheduledDose,
  SimulationPoint,
  SimulationResult,
  SimulatorState
} from '../types/models';
import { getModelById } from '../models';

export function formatClockHour(hourValue: number): string {
  const normalized = ((hourValue % 24) + 24) % 24;
  const wholeHours = Math.floor(normalized + 1e-6);
  const minutes = Math.round((normalized - wholeHours) * 60);
  if (minutes === 60) {
    const nextHour = (wholeHours + 1) % 24;
    return `${String(nextHour).padStart(2, '0')}:00`;
  }
  return `${String(wholeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatOffsetHours(offsetHours: number): string {
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  const h = Math.floor(abs + 1e-6);
  const m = Math.round((abs - h) * 60);
  if (m === 0) {
    return `${sign}${h}h`;
  }
  return `${sign}${h}h ${m}m`;
}

/**
 * Evaluates a model's plasma concentration at relative time `t` (hours after administration)
 * using Catmull-Rom / Cardinal spline interpolation matching the original Bezier tension,
 * clamped to non-negative concentrations.
 */
export function evaluateModelAtTime(
  modelPoints: DataPoint[],
  t: number,
  tension: number = 0.5
): number {
  if (modelPoints.length === 0 || t <= modelPoints[0].x) {
    return 0;
  }

  const last = modelPoints[modelPoints.length - 1];
  if (t >= last.x) {
    return 0;
  }

  let segIdx = 0;
  for (let i = 0; i < modelPoints.length - 1; i++) {
    if (t >= modelPoints[i].x && t <= modelPoints[i + 1].x) {
      segIdx = i;
      break;
    }
  }

  const p0 = segIdx > 0 ? modelPoints[segIdx - 1] : modelPoints[0];
  const p1 = modelPoints[segIdx];
  const p2 = modelPoints[segIdx + 1];
  const p3 = segIdx < modelPoints.length - 2 ? modelPoints[segIdx + 2] : p2;

  const span = p2.x - p1.x;
  if (span <= 0) {
    return Math.max(0, p1.y);
  }

  const u = (t - p1.x) / span;
  const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
  const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

  const invU = 1 - u;
  const y =
    invU * invU * invU * p1.y +
    3 * invU * invU * u * cp1y +
    3 * invU * u * u * cp2y +
    u * u * u * p2.y;

  return Math.max(0, y);
}

/**
 * Legacy-compatible half-hour linear autofill from the original Helper.autoFillArray
 */
export function autoFillArray(array: DataPoint[]): DataPoint[] {
  if (array.length === 0) {
    return [];
  }
  const filledArray: DataPoint[] = [];
  for (let i = 1; i < array.length; i++) {
    const first = { ...array[i - 1], calculated: false };
    const second = { ...array[i], calculated: false };

    const firstPos = Math.round(first.x * 2);
    const secondPos = Math.round(second.x * 2);
    const diffPos = secondPos - firstPos;

    filledArray.push(first);

    if (diffPos > 1) {
      const valueSpan = second.y - first.y;
      const stepValue = valueSpan / diffPos;
      let tempValue = first.y;

      for (let s = 1; s < diffPos; s++) {
        tempValue += stepValue;
        filledArray.push({
          x: (firstPos + s) / 2,
          y: tempValue,
          calculated: true
        });
      }
    }
    if (i === array.length - 1) {
      filledArray.push(second);
    }
  }
  return filledArray;
}

export function runSimulation(state: SimulatorState): SimulationResult {
  const stepHours = 0.25; // 15-minute simulation resolution
  const totalSteps = Math.round(state.windowHours / stepHours);

  const activeDoses: { dose: ScheduledDose; medicine: MedicineModel }[] = [];
  for (const dose of state.scheduledDoses) {
    if (!dose.enabled) {
      continue;
    }
    const medicine = getModelById(dose.modelId);
    if (medicine) {
      activeDoses.push({ dose, medicine });
    }
  }

  const timeline: SimulationPoint[] = [];
  const combinedCurvePoints: DataPoint[] = [];
  const perDosePointsMap = new Map<string, DataPoint[]>();

  for (const { dose } of activeDoses) {
    perDosePointsMap.set(dose.id, []);
  }

  let globalCMax = 0;
  let globalTMaxHours = 0;
  let hoursInTherapeuticRange = 0;

  for (let s = 0; s <= totalSteps; s++) {
    const hourFromStart = Number((s * stepHours).toFixed(4));
    const clockHour = state.startOfDayHour + hourFromStart;
    const clockFormatted = formatClockHour(clockHour);

    let totalConcentration = 0;
    const contributions: SimulationPoint['contributions'] = [];

    for (const { dose, medicine } of activeDoses) {
      const elapsedSinceDose = hourFromStart - dose.timeSlotHours;
      const rawConc = evaluateModelAtTime(medicine.model, elapsedSinceDose, state.curveTension);
      const conc = Number((rawConc * dose.multiplier).toFixed(4));
      totalConcentration += conc;

      const dosePoints = perDosePointsMap.get(dose.id);
      if (dosePoints) {
        dosePoints.push({ x: hourFromStart, y: conc });
      }

      const effectiveMg = Number((medicine.doseMg * dose.multiplier).toFixed(1));
      const defaultLabel = `${medicine.brand} ${effectiveMg} mg (${formatClockHour(
        state.startOfDayHour + dose.timeSlotHours
      )})`;

      contributions.push({
        doseId: dose.id,
        label: dose.label || defaultLabel,
        color: dose.color,
        concentration: conc
      });
    }

    totalConcentration = Number(totalConcentration.toFixed(4));

    if (totalConcentration > globalCMax) {
      globalCMax = totalConcentration;
      globalTMaxHours = hourFromStart;
    }

    if (
      s < totalSteps &&
      totalConcentration >= state.therapeuticMin &&
      totalConcentration <= state.therapeuticMax
    ) {
      hoursInTherapeuticRange += stepHours;
    }

    timeline.push({
      hourFromStart,
      clockHour,
      clockFormatted,
      totalConcentration,
      contributions
    });

    combinedCurvePoints.push({
      x: hourFromStart,
      y: totalConcentration
    });
  }

  // Compute trapezoidal AUC over the window
  let totalAuc = 0;
  for (let i = 1; i < combinedCurvePoints.length; i++) {
    const dt = combinedCurvePoints[i].x - combinedCurvePoints[i - 1].x;
    totalAuc += ((combinedCurvePoints[i].y + combinedCurvePoints[i - 1].y) / 2) * dt;
  }

  const doseEvaluations: DoseCurveEvaluation[] = activeDoses.map(({ dose, medicine }) => {
    const pts = perDosePointsMap.get(dose.id) || [];
    let cMax = 0;
    let tMaxHoursFromStart = dose.timeSlotHours;
    let auc = 0;

    for (let i = 0; i < pts.length; i++) {
      if (pts[i].y > cMax) {
        cMax = pts[i].y;
        tMaxHoursFromStart = pts[i].x;
      }
      if (i > 0) {
        const dt = pts[i].x - pts[i - 1].x;
        auc += ((pts[i].y + pts[i - 1].y) / 2) * dt;
      }
    }

    const shiftedRawPoints: DataPoint[] = medicine.model.map((pt) => ({
      x: pt.x + dose.timeSlotHours,
      y: Number((pt.y * dose.multiplier).toFixed(4))
    }));

    return {
      dose,
      medicine,
      points: pts,
      shiftedRawPoints,
      cMax: Number(cMax.toFixed(2)),
      tMaxHoursFromStart,
      auc: Number(auc.toFixed(1))
    };
  });

  const totalDailyMg = Number(
    activeDoses
      .reduce((acc, { dose, medicine }) => acc + medicine.doseMg * dose.multiplier, 0)
      .toFixed(1)
  );

  return {
    timeline,
    combinedCurvePoints,
    doseEvaluations,
    summary: {
      totalDailyMg,
      activeDoseCount: activeDoses.length,
      cMax: Number(globalCMax.toFixed(2)),
      tMaxHoursFromStart: globalTMaxHours,
      tMaxClockFormatted: formatClockHour(state.startOfDayHour + globalTMaxHours),
      auc24: Number(totalAuc.toFixed(1)),
      hoursInTherapeuticRange: Number(hoursInTherapeuticRange.toFixed(2))
    }
  };
}
