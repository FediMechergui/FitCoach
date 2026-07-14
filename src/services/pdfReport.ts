import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildReportData, type ReportData } from '@/repositories/reportRepo';
import { ACTIVITY_LABELS, GOAL_LABELS } from '@/lib/calories';
import { bodyFatCategory, ffmiCategory } from '@/lib/bodyComposition';
import { PHASE_GUIDANCE } from '@/lib/cycle';
import { ATTRIBUTE_LABELS } from '@/lib/rating';

function esc(s: string | null | undefined): string {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

function section(title: string, body: string): string {
  return `<section><h2>${esc(title)}</h2>${body}</section>`;
}

function kv(rows: Array<[string, string]>): string {
  return `<table class="kv">${rows
    .map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`)
    .join('')}</table>`;
}

function reportHtml(d: ReportData): string {
  const isCoach = d.audience === 'coach';
  const title = isCoach ? 'Training & Recovery Report' : 'Nutrition & Body Report';

  const profile = section(
    'Athlete',
    kv([
      ['Name', d.profile.name],
      ['Age', `${d.profile.age}`],
      ['Sex (metabolic)', d.profile.sex],
      ['Gender', d.profile.gender.replace('_', ' ')],
      ['Height', d.profile.heightCm ? `${d.profile.heightCm} cm` : '—'],
      ['Weight', d.weightKg ? `${d.weightKg.toFixed(1)} kg` : '—'],
      ['Goal', GOAL_LABELS[d.profile.goal as keyof typeof GOAL_LABELS] ?? d.profile.goal],
      ['Activity', ACTIVITY_LABELS[d.profile.activityLevel as keyof typeof ACTIVITY_LABELS]?.split(' — ')[0] ?? d.profile.activityLevel],
      ['Body type', d.profile.bodyType ?? '—'],
    ])
  );

  const bc = d.bodyComp;
  const bodyComp = bc
    ? section(
        'Body Composition',
        kv([
          ['Body fat', bc.bodyFatPct != null ? `${bc.bodyFatPct}% (${bodyFatCategory(bc.bodyFatPct, d.profile.sex)})` : '—'],
          ['Fat mass', bc.fatMassKg != null ? `${bc.fatMassKg} kg` : '—'],
          ['Lean / fat-free mass', bc.leanMassKg != null ? `${bc.leanMassKg} kg` : '—'],
          ['Muscle mass', bc.muscleMassKg != null ? `${bc.muscleMassKg} kg` : '—'],
          ['Body water', bc.bodyWaterPct != null ? `${bc.bodyWaterPct}% (${bc.waterStatus})` : '—'],
          ['Bone mass', bc.boneMassKg != null ? `${bc.boneMassKg} kg` : '—'],
          ['Normalized FFMI', bc.normalizedFFMI != null ? `${bc.normalizedFFMI} (${ffmiCategory(bc.normalizedFFMI, d.profile.sex)})` : '—'],
          ['Weight trend', d.weightTrendKgPerWeek != null ? `${d.weightTrendKgPerWeek >= 0 ? '+' : ''}${d.weightTrendKgPerWeek.toFixed(2)} kg/week` : '—'],
        ])
      )
    : '';

  const n = d.nutrition;
  const nutrition = n
    ? section(
        'Nutrition',
        kv([
          ['Calorie target', `${n.calorieTarget} kcal`],
          ['Avg intake (7d / 30d)', `${n.avg7d.calories} / ${n.avg30d.calories} kcal`],
          ['Protein target', `${n.proteinG} g`],
          ['Avg protein (7d / 30d)', `${n.avg7d.protein} / ${n.avg30d.protein} g`],
          ['Carbs / Fat target', `${n.carbsG} g / ${n.fatG} g`],
          ['Days logged (30d)', `${n.daysLogged30d}`],
          ['Water goal', `${(n.waterGoalMl / 1000).toFixed(1)} L`],
          ['Caffeine soft-limit', `${n.caffeineSoftLimitMg} mg`],
        ])
      )
    : '';

  const t = d.training;
  const mix = Object.entries(t.sessionMix)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${esc(k)} ×${v}`)
    .join(', ');
  const prRows = t.prs.length
    ? `<table class="data"><tr><th>Date</th><th>Exercise</th><th>Best set</th><th>Est. 1RM</th></tr>${t.prs
        .map((p) => `<tr><td>${esc(p.date)}</td><td>${esc(p.exerciseName)}</td><td>${p.weightKg}kg × ${p.reps}</td><td>${p.est1RM} kg</td></tr>`)
        .join('')}</table>`
    : '<p class="muted">No PRs recorded yet.</p>';
  const training = section(
    'Training & Activity',
    kv([
      ['Sessions (30d)', `${t.sessions30d}`],
      ['Current streak', `${t.streak} days`],
      ['Session mix (30d)', mix || '—'],
      ['Avg steps / day', `${t.avgStepsPerDay.toLocaleString()}`],
    ]) + `<h3>Personal Records</h3>${prRows}`
  );

  const s = d.sleep;
  const sleep = section(
    'Sleep',
    kv([
      ['Avg sleep (7d)', s.avg7d != null ? `${s.avg7d} h` : '—'],
      ['Last night', s.lastNight != null ? `${s.lastNight} h` : '—'],
      ['Sleep debt (7d)', `${s.debt7d} h`],
      ['Performance factor', `${Math.round(s.performanceFactor * 100)}%`],
    ])
  );

  const a = d.alcohol;
  const alcohol = section(
    'Alcohol',
    kv([
      ['This week', `${a.weekGrams} g (${a.weekDrinks} std drinks)`],
      ['Weekly guideline', `${a.weeklyLimitG} g`],
      ['Alcohol calories (week)', `${a.weekCalories} kcal`],
      ['Alcohol-free days (7d)', `${a.dryDays7d}`],
    ])
  );

  const sm = d.smoking;
  const smoking =
    sm.week > 0 || sm.avgPerDay > 0
      ? section(
          'Smoking',
          kv([
            ['Avg per day', `${sm.avgPerDay}`],
            ['This week', `${sm.week}`],
            ['Est. aerobic penalty', `−${sm.aerobicPenaltyPct}%`],
            ['Est. resting HR elevation', `+${sm.restingHrElevationBpm} bpm`],
            ['Weekly cost', `${sm.currency}${sm.moneyWeek.toFixed(2)}`],
          ])
        )
      : '';

  const c = d.cycle;
  const cycle = c
    ? section(
        'Menstrual Cycle',
        kv([
          ['Cycle day', `${c.dayOfCycle} of ${c.cycleLength}`],
          ['Phase', PHASE_GUIDANCE[c.phase].title],
          ['Next period', `${c.nextPeriodDate} (in ${c.daysUntilNextPeriod} days)`],
          ['Training note', PHASE_GUIDANCE[c.phase].training],
        ])
      )
    : '';

  const conditions = d.conditions.length
    ? section(
        'Health Considerations',
        `<ul>${d.conditions
          .map(
            (cd) =>
              `<li><strong>${esc(cd.label)}</strong>${cd.category ? ` <span class="muted">(${esc(cd.category)})</span>` : ''}${cd.notes ? `<br><span class="muted">${esc(cd.notes)}</span>` : ''}</li>`
          )
          .join('')}</ul><p class="disclaimer">These are user-declared conditions with general considerations only — not a diagnosis. Please apply your professional judgment.</p>`
      )
    : '';

  const r = d.rating;
  const rating = section(
    'Athlete Rating',
    `<p class="rating">Overall <strong>${r.overall}</strong> · ${esc(r.tier)}</p>` +
      kv(
        (Object.keys(r.attributes) as Array<keyof typeof r.attributes>).map(
          (k) => [ATTRIBUTE_LABELS[k], String(r.attributes[k])] as [string, string]
        )
      )
  );

  // Order sections by audience emphasis.
  const order = isCoach
    ? [profile, rating, training, sleep, bodyComp, alcohol, smoking, cycle, nutrition, conditions]
    : [profile, nutrition, bodyComp, alcohol, smoking, sleep, cycle, training, rating, conditions];

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Roboto, 'Segoe UI', sans-serif; color: #1a2233; margin: 0; padding: 28px; font-size: 12px; }
    header { border-bottom: 3px solid #4F8CFF; padding-bottom: 12px; margin-bottom: 18px; }
    header h1 { margin: 0; font-size: 22px; }
    header .sub { color: #667; font-size: 12px; margin-top: 4px; }
    .badge { display: inline-block; background: #4F8CFF; color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    section { margin-bottom: 18px; break-inside: avoid; }
    h2 { font-size: 14px; color: #4F8CFF; border-bottom: 1px solid #e2e8f2; padding-bottom: 5px; margin: 0 0 8px; }
    h3 { font-size: 12px; margin: 10px 0 5px; }
    table.kv { width: 100%; border-collapse: collapse; }
    table.kv td { padding: 3px 0; vertical-align: top; }
    table.kv td.k { color: #667; width: 45%; }
    table.kv td.v { font-weight: 600; }
    table.data { width: 100%; border-collapse: collapse; margin-top: 4px; }
    table.data th, table.data td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #eef; }
    table.data th { background: #f4f7fc; font-size: 11px; }
    ul { margin: 4px 0; padding-left: 18px; }
    li { margin-bottom: 5px; }
    .muted { color: #889; }
    .rating { font-size: 14px; }
    .disclaimer { font-style: italic; color: #889; font-size: 10px; margin-top: 6px; }
    footer { margin-top: 24px; border-top: 1px solid #e2e8f2; padding-top: 8px; color: #99a; font-size: 10px; text-align: center; }
  </style></head><body>
  <header>
    <span class="badge">${isCoach ? 'For your Coach' : 'For your Nutritionist'}</span>
    <h1>${esc(d.profile.name)} — ${esc(title)}</h1>
    <div class="sub">Generated ${esc(d.generatedOn)} · FitCoach</div>
  </header>
  ${order.filter(Boolean).join('')}
  <footer>Generated by FitCoach · Local-first personal health data · Not a medical document.</footer>
  </body></html>`;
}

/**
 * Build the report for the given audience, render it to a PDF file and open the
 * share sheet. Returns the file URI. Requires explicit user action (a button).
 */
export async function exportReport(audience: 'nutritionist' | 'coach'): Promise<string> {
  const data = buildReportData(audience);
  const html = reportHtml(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: audience === 'coach' ? 'Share coach report' : 'Share nutritionist report',
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}
