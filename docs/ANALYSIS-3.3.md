# FitCoach at 3.3.1 — analysis, what changed, and what is proposed

Measured from the source on 2026-09-27. Every count below was produced by
running against the shipped catalogues.

## 1. The app in numbers

| | 3.2.3 | 3.3.1 |
|---|---|---|
| Exercises | 995 | **1281** |
| …with a verified how-to video | 995 | 1280 |
| Martial arts entries | 82 | 171 |
| Sport entries | 83 | 230 |
| Outdoor entries | 53 | 70 |
| Cardio entries | 79 | 101 |
| Daily challenges | 70 | 70 |
| Weekly quests | 0 | **28** in the pool, 3 a week |
| Badges | 150 | **160** in 16 categories |
| Badges that can actually unlock | 110 | **123** |
| Special programmes (one week, repeated) | 61 | 61 |
| Paths (five stages each) | 0 | **18** paths, 90 stages, 402 training days |
| Ranked lifts | 0 | **64** |
| Database tables | 43 | 50 (schema 36) |
| Engine checks | 1767 | see the changelog |

## 2. What the analysis found

### Strengths
- **One rule, applied everywhere:** a number on screen comes from something
  logged. Challenges are measured, not ticked. Badges read data. That rule is
  what makes points and ranks worth having, and every addition in 3.3 keeps it.
- **Local-first is real.** Two network calls in the whole app (weather, and the
  optional photo food logger). Everything else works with the radio off.
- **The guard suite.** Pure-function checks before every release are why the
  app could take 7 new tables and 286 exercises in one step.

### Weaknesses found, and what was done

| Finding | Status |
|---|---|
| The profile had no identity: no rating, points, level, badge or streak on the "You" tab. | **Fixed 3.3.0** — identity header. |
| 40 of 150 badges had no rule and could never unlock. The screen said event badges "unlock when you do them", which was not true. | **Partly fixed.** Three now unlock (card export, two reports). Copy corrected. 37 remain unmeasured; see section 4. |
| Badge 8 asked for an *exported* card rated 70+, and unlocked on the rating alone. | **Fixed 3.3.0.** |
| Special programmes have no progression: one week, repeated, any day in any order, nothing tracked. | **Addressed by Paths 3.3.1.** Special programmes are unchanged. |
| One generic entry per sport ("Handball", "Boxing"). A programme could not say what to actually train. | **Fixed 3.3.1** — 286 specific skills and sessions. |
| Sessions had nowhere to say where they happened. | **Fixed 3.3.1** — places. |
| A session's GPS route is thrown away; only its distance is kept. | **Open.** Needs a `route_json` column on sessions. |
| No backup or restore. The only copy of a training history is the phone. | **Open, and the most important open item.** |
| The smoking page rendered nothing while loading. | **Fixed 3.3.1.** |
| Challenge difficulty colours and athlete-card colours are hard-coded hex, outside the theme. | **Open.** Cosmetic. |
| `FITCOACH-SPEC.md` and `README.md` document v2.64. | **Open.** This file is the current summary; a full regeneration is a job of its own. |
| Near-duplicate exercise slugs (`ma-skipping` and `jump-rope`, `medicine-ball-slam` and `medicine-ball-slams`). | **Open.** Aliasing them is safe; deleting is not. |

## 3. What was built

### The Carthage ladder (strength ranks)
Inspired by the idea of ranked lifting, and built differently on every axis that
matters:

| | This app |
|---|---|
| Scale | 0 to 100 |
| Rungs | Eight, each in three divisions: Sand, Clay, Copper, Olive, Coral, Marble, Carthage, Hannibal |
| Source of the standards | FitCoach's own table, set from published strength standards. Said on the screen: "a yardstick, not a census". There is no population behind it, because there is no server. |
| Bodyweight | Ratio scaled by the cube root of mass to a reference bodyweight |
| Roll-up | Mean of the best lift in each of four pillars (push, pull, legs, hinge); provisional under three |
| Time | Form (last 120 days) and peak kept apart |
| Next step | Each lift says how many kilograms the next division takes |

### Points, in three currencies that never mix
- **Points** are earned by challenges and quests, and **spent** on spins and in
  the souk. The balance goes up and down.
- **Experience** counts everything ever done. It never goes down, and spending
  points does not touch it.
- **Rank** is how strong you are now. It can fall after a lay-off, and says so.

### Gimmicks shipped
- The identity header: crest, title, level, three pinned badges.
- Sixteen titles, earned by the record and worn by choice, four of them in derja.
- Weekly quests: three a week, one of each weight, decided by the week.
- The souk: nine card skins, each a place in Tunisia.
- The crest on the athlete card; the body shaded by rank.
- A dot map of Tunisia drawn without tiles or network.

## 4. Proposed, not built

Ordered by what they would give for what they would cost.

1. **Backup and restore to a file.** Before anything social.
2. **Measure more of the 37 unmeasured badges.** Most need one small event
   stamp each (a warm-up checklist completed, a fasted session, a slip logged).
3. **Seasons.** A three-month season with its own ladder of points, reset at
   the end, all-time totals untouched. Gives points a rhythm.
4. **Rank for endurance.** A second ladder from tracked runs: pace over 5 km
   and 10 km against age-graded standards.
5. **Session route kept.** So an outdoor session has a map like a walk does.
6. **Path partners.** Needs the network; see `SOCIAL-PLAN.md`, phase 5.
7. **A second batch of exercises.** The path authors listed what the library
   still lacks: padel serve and volley, handball three-step rhythm, judo foot
   sweeps, named grappling positions, posing practice, marathon-pace runs,
   resisted sprints, swim time trials, ground poles for riders.
8. **Interface languages.** French and Arabic; Arabic means right-to-left.
9. **Haptics.** Needs a new APK.
