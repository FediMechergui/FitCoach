/** Context can prompt a check-in, but logs cannot measure COHb, oxygen delivery,
 * neural recovery or an individual's phosphocreatine recovery rate. */
export interface RestConditions { coLoad?: number | null; stomachKcal?: number | null; avgSleepHours?: number | null }
export interface RestPhysiology {
  cohbPct: number | null; o2Factor: number; neuralFactor: number; tauS: number;
  neutral: boolean; notes: string[];
}
export function restPhysiology(c: RestConditions, baseTauS: number): RestPhysiology {
  const notes: string[] = [];
  if (c.coLoad != null && c.coLoad > 0) notes.push('Recent smoking is logged. This app cannot infer blood CO or oxygen delivery from cigarette counts.');
  if (c.stomachKcal != null && c.stomachKcal > 0) notes.push('A recent meal is logged. Adjust training for comfort; no oxygen-loss percentage is inferred.');
  if (c.avgSleepHours != null && c.avgSleepHours < 7) notes.push('Short sleep is logged. Check how you feel and reduce training if needed; this does not calculate neural recovery.');
  return { cohbPct: null, o2Factor: 1, neuralFactor: 1, tauS: baseTauS, neutral: true, notes };
}
