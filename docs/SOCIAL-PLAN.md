# El Houma — the plan for a Tunisian training network

**Status: a plan. Nothing in this document is switched on.** FitCoach 3.3.1 has no
account, no server and no sync. What shipped with it is the *structure* the
network will stand on, listed in section 2. Everything from section 3 onward
needs an account and is therefore not built.

*Houma* is the neighbourhood: the people you see at the same gym door, the same
pitch, the same bars in the park. That is the scale this network is meant for —
your governorate before the world.

---

## 1. Principles

These are constraints, not aspirations. A feature that breaks one is not built.

1. **The app stays whole without an account.** Every feature that exists today
   keeps working offline, signed out, forever. The network is an addition.
2. **Nothing is shared by default.** Signing up shares a handle and nothing
   else. Each thing that leaves the phone is sent by an explicit act.
3. **Health data never leaves.** Section 5 lists what can never be shared, even
   on request. There is no setting that turns this off.
4. **Tunisia first.** Governorates, not countries. Places named as they are
   written on the door. Interface text in English today, with French, Arabic
   and derja planned as a first-class concern, not a translation pass.
5. **Built for a phone on 3G.** Text and numbers first; images small, optional
   and lazy. A feed must be usable on a metered connection.
6. **Measured, not claimed.** The app's rule — a number comes from what was
   logged — extends to the network: a rank shown to others is computed from
   sets, never typed in.

---

## 2. What already exists (shipped in 3.3.x, all local)

| Piece | Where | How the network will use it |
|---|---|---|
| Places marked by the user | `places`, `place_visits` tables; `src/repositories/placesRepo.ts` | A place has `visibility` (always `private` today) and `remote_id` (always null today). Sharing a place sets both; no migration is needed. |
| The kinds of place | `src/data/placeKinds.ts` | The shared vocabulary for the community map: gym, boxing gym, dojo, calisthenics park, stadium, five-a-side pitch, sports hall, court, racket club, pool, track, climbing, riding club, studio, beach, trail, park. |
| Governorates | `src/data/governorates.ts` | The unit of every leaderboard, feed and search. 24 of them, grouped in six everyday regions. |
| Strength ranks | `src/lib/ranks.ts` | The thing people compare. Pure functions, so the server can run the same code. |
| Level, titles, pinned badges | `src/lib/progression.ts` | The public profile is the identity header that already exists on the phone. |
| The athlete card and its skins | `ProfileCardScreen`, `src/data/souk.ts` | Already exported as an image and shared by hand. The network makes that one tap. |
| Paths | `src/data/paths.ts`, `path_enrolments`, `path_graduations` | "Walking the boxer path, stage 3" is a natural thing to show, and to find training partners by. |
| Weekly quests | `src/lib/quests.ts` | Decided by the week, so everyone has the same three: a ready-made shared goal for a crew. |
| Wire contracts | `src/social/contracts.ts` | Types only. They describe what would cross the wire, so the phone side can be built against them before a server exists. |

A place can already say which session happened there, and a session which
place. That link is the seed of "who trains here".

---

## 3. Phases

Each phase is usable on its own. None begins before the one above it is stable.

### Phase 1 — Account and identity
- Sign up with a phone number or an email; a handle; a governorate.
- The profile is **private** until the owner publishes it.
- What a published profile shows: handle, governorate, title, level, overall
  rank, up to three pinned badges, paths being walked. Nothing else.
- Sign out returns the app to exactly what it is today. Delete account deletes
  everything on the server and nothing on the phone.

### Phase 2 — The shared map
- A user can share a place they marked. It becomes a candidate on the
  community map.
- **Duplicates** are merged by distance and name (two gyms 30 m apart with
  similar names are one gym). The merge is proposed, not automatic.
- **Trust** comes from visits: a place several different people have logged
  sessions at is shown as confirmed. A place nobody has trained at stays a
  candidate.
- Notes on a place become short reviews: what equipment, what hours, what it
  costs, in TND. A review needs at least one logged session there.
- A private place stays private. Home is never shared, whatever it is marked.

### Phase 3 — People
- Follow, not friend: one-directional, no request needed for a public profile.
- The feed is made only of things people chose to post: a finished session
  (type, length, place if the place is shared), a rank gained, a stage
  graduated, a badge, an exported card. Never the contents of a diary.
- Reactions are few and plain. Comments are text.

### Phase 4 — Crews and ladders
- A **crew** is a small group: the people of one gym, one club, one houma.
- Leaderboards exist **per governorate and per place**, by overall rank and by
  lift, and only among people who opted in. There is no national ladder at
  launch: a ladder you can never climb teaches you to stop looking.
- Weekly quests can be taken on as a crew: the same three, summed.

### Phase 5 — Playing together
- "Looking for players": a pick-up game at a shared pitch, at a time, for a
  number of people. The Tunisian use case that no training app serves.
- Training partners by path and stage: someone on stage 3 of the boxer path,
  in Sousse, looking for a partner for body sparring.
- A directory of clubs and coaches, entered by the clubs themselves.

---

## 4. Data model (server side, proposed)

Identifiers are UUIDs generated on the phone, so a row can be created offline
and sent later without ever being renumbered.

| Table | Holds | Notes |
|---|---|---|
| `accounts` | auth identity | owned by the auth provider |
| `profiles` | handle, governorate, title, level, overall rank, pinned badges, `published` | a cache of what the phone computed, re-verified for ranks |
| `places` | name, kind, point, governorate, city, access, price note | PostGIS `geography(Point)`; `confirmed_by` count |
| `place_aliases` | merged duplicates | keeps old ids resolving |
| `place_reviews` | author, place, text, rating | requires a visit |
| `visits` | who, where, when (day only) | day precision, never a timestamp |
| `follows` | follower, followed | |
| `posts` | author, kind, payload, place | payload is one of the contract types |
| `reactions`, `comments` | | |
| `crews`, `crew_members` | | a crew may be tied to a place |
| `lift_records` | author, lift, e1RM, bodyweight band, date | what a public rank is computed from |
| `games` | place, time, sport, seats | phase 5 |
| `reports`, `blocks` | moderation | from day one, not later |

Bodyweight is stored as a **band** (for example 75–80 kg), which is enough to
compute a rank and not enough to publish a weigh-in.

---

## 5. What can be shared, and what never can

| Never leaves the phone | Leaves only by an explicit act | Computed, then shown if published |
|---|---|---|
| Menstrual cycle, hormones, health conditions | A finished session's summary | Overall rank and per-lift ranks |
| Smoking, alcohol, habits | A place you marked | Level and title |
| Food diary, calories, micronutrients, supplements | An exported athlete card | Badges you pinned |
| Sleep, naps, work hours | A review of a place | Paths and stages |
| Weigh-ins and body measurements | A game you are organising | |
| Prayer and fasting logs | | |
| Your home base, and any live location | | |
| Notes on sessions, mood | | |

The left column is enforced in code, not in settings: the contract types in
`src/social/contracts.ts` have no field that could carry any of it, and the
engine suite checks that they never gain one.

**Location** deserves its own line. The network never shows where someone is
*now*. A visit is recorded to the day. A session posted with a place is posted
after it ended. Home is never shared.

---

## 6. Architecture

### Recommendation: Supabase (Postgres, row-level security, PostGIS)
- Row-level security puts the privacy rules in the database, where a bug in the
  app cannot bypass them.
- PostGIS answers "places within 5 km of here, of this kind" properly.
- Auth by phone OTP or email is built in.
- It is plain Postgres: the data can be exported and moved if the project
  outgrows the host.

Alternatives considered: **Firebase** (faster to start, but the privacy rules
live in a rules language that is hard to test, and geographic queries are
awkward); **a custom server** (full control, and a full-time job).

### Sync
- The phone stays the source of truth for the user's own data.
- Things to send go into a local **outbox** and are sent when there is a
  connection; each carries its UUID, so sending twice is harmless.
- The community map is downloaded **by governorate** and cached, so the map
  works offline for the places you are likely to be.
- Conflicts are rare by design: a user edits only their own rows. For shared
  places, the last confirmed edit wins and the previous text is kept.

### Ranks that can be trusted
- The phone sends lift records; the server recomputes the rank with the same
  pure code as `src/lib/ranks.ts`.
- A rank in the top two rungs (Carthage, Hannibal) is shown as *unverified*
  until it is confirmed, by a video or by a gym that vouches for it.
- Impossible jumps (a 60 kg gain in a week) are held for review, not shown.

### What needs a new APK
Everything up to now shipped over the air. The network will not:
- push notifications for follows and games,
- a tile map, if the dot map stops being enough,
- deep links for shared profiles and places.

---

## 7. Law, safety and moderation

This section lists what must be checked **with a lawyer in Tunisia** before
phase 1 ships. It is not legal advice.

- Tunisia's personal-data law (organic law 2004-63) and the declaration it
  requires to the national data-protection authority (INPDP) before personal
  data is processed.
- Whether hosting outside Tunisia needs an authorisation for transfer abroad.
- Age: the network should be 16+ at launch, with no attempt to serve minors.
- Health data is a special category almost everywhere. Section 5 exists so that
  the network never processes any.
- Moderation from the first day: report, block, and a human who reads reports.
  Places can be vandalised and people can be harassed; both need an answer
  before launch, not after.
- Coaches and clubs: a directory implies a claim about who is qualified. Entries
  should say "as stated by the club" until there is a way to verify.

---

## 8. Decisions that are yours to make

These change what gets built, and none of them can be decided by code.

1. **The name.** El Houma, or something else.
2. **Sign-up by phone number or by email.** Phone is how people in Tunisia
   identify each other and costs money per SMS; email is free and less used.
3. **Languages at launch.** English only, or French and Arabic with it. Arabic
   means right-to-left layout across the whole app.
4. **Hosting and budget.** Free tiers carry a few thousand users. Beyond that
   it is a monthly bill.
5. **Public by default or private by default** for a new profile. The plan
   assumes private.
6. **Who moderates.** One person can, at the start. It has to be someone.
7. **Seed data.** Whether to start the community map empty, or to enter the
   well-known stadiums and public facilities by hand first. The plan assumes
   empty: coordinates entered from memory would be wrong.

---

## 9. Build order

| Step | Needs an account | Status |
|---|---|---|
| Places, kinds, governorates, the dot map | no | **shipped 3.3.1** |
| Ranks, level, titles, pinned badges, card skins | no | **shipped 3.3.0 – 3.3.1** |
| Paths and weekly quests | no | **shipped 3.3.1** |
| Wire contracts and the outbox shape | no | **shipped 3.3.1** (types only) |
| Backup and restore to a file | no | next, and worth doing before any account |
| Interface languages (French, Arabic) | no | next |
| Account, profile, sign-out, delete | yes | phase 1 |
| Shared map | yes | phase 2 |
| Follows and feed | yes | phase 3 |
| Crews and ladders | yes | phase 4 |
| Games and partners | yes | phase 5 |

Backup comes before the account on purpose: today the only copy of someone's
training history is the phone in their pocket.
