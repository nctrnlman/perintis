# Design Spec — Perintis: Career Fit ("Unlock Your Potential")

**Date**: 2026-08-24
**Status**: Approved for planning

## 1. Scope

A new module that analyzes a user's Profile (skills, work experience, education) against a curated list of common role archetypes and surfaces which roles are the best fit, with a plain-language explanation grounded strictly in the user's own data — no external job-market data, no salary or demand claims, no numeric precision the analysis can't actually back up.

This is the module the user described as "Unlock Your Potential" during brainstorming: recommend which job roles fit the user's skills/experience, and why. The user explicitly deferred the third part of their original idea — a skill-gap roadmap/development plan — to a future v2; this spec covers matching + reasoning only.

Working name used throughout this spec and the app: **Career Fit** (route `/career-fit`). "Unlock Your Potential" can still be used as marketing/tagline copy; this is a naming choice, not an architectural one, and can be changed freely without touching the design.

## 2. Role taxonomy (static, human-curated)

`src/lib/career-fit/role-taxonomy.ts` exports a hardcoded array of common role archetypes, each with a title, category, and a list of commonly-associated skills:

```typescript
export interface RoleArchetype {
  id: string;
  title: string;
  category: string;
  commonSkills: string[];
}

export const ROLE_TAXONOMY: RoleArchetype[] = [
  {
    id: "frontend-engineer",
    title: "Frontend Engineer",
    category: "Engineering",
    commonSkills: ["JavaScript", "TypeScript", "React", "CSS", "Git", "REST API"],
  },
  {
    id: "product-manager",
    title: "Product Manager",
    category: "Product",
    commonSkills: ["Roadmapping", "User Research", "Stakeholder Management", "Analytics", "Agile"],
  },
  // ...roughly 25-30 entries total across Engineering, Product, Design,
  // Data, Marketing, Business & Finance, Operations, and HR
];
```

These skill associations are general, well-established occupational knowledge (a human author's own domain understanding, curated once at build time), not a claim about live job-market conditions — the same kind of judgment a career counselor would apply, not a data assertion that needs sourcing. The full list is authored during implementation, not enumerated here.

**Known v1 limitation, stated explicitly so it isn't a surprise later:** skill matching is exact string equality after case-normalization (§3). A profile skill entered as "JS" will not match a taxonomy skill listed as "JavaScript" unless the user's own wording happens to line up. No synonym/alias resolution or fuzzy matching in v1 — this is a deliberate scope cut, not an oversight.

## 3. Matching (pure function, TDD)

`src/lib/career-fit/match-roles.ts`:

```typescript
export interface RoleMatch {
  roleId: string;
  title: string;
  category: string;
  tier: "STRONG" | "GOOD" | "WORTH_EXPLORING";
  matchedSkills: string[];
  missingSkills: string[];
}

export function matchRoles(userSkills: string[], roles: RoleArchetype[]): RoleMatch[];
```

Algorithm:
1. Normalize `userSkills` (trim, lowercase) into a `Set`.
2. For each role, compute `matchedSkills` = role's `commonSkills` whose normalized form is present in the user's skill set; `missingSkills` = the rest; `coverage` = `matchedSkills.length / commonSkills.length`.
3. Assign a tier by coverage: `>= 0.6` → `STRONG`, `>= 0.35` → `GOOD`, `>= 0.15` → `WORTH_EXPLORING`. Roles below `0.15` are dropped entirely (not returned, not shown as a weak/no match — silence is more honest than a token result).
4. Sort remaining roles by coverage descending, return at most the top 5 — if fewer than 5 roles clear the `0.15` threshold, return only those (never padded with weaker matches just to fill five slots).

`userSkills` is built by the caller as the union of `Profile.skills[].name` and every `WorkExperience.skillsUsed[]` entry, deduplicated. If the union is empty, `matchRoles` returns `[]` — the UI (§5) shows a prompt to fill in Profile skills first, the same nudge pattern the dashboard's profile-completeness card already uses.

## 4. AI reasoning (grounded, batched)

One Gemini call via the existing `generateJson` helper (`src/lib/gemini.ts`, same pattern as `enhanceBullets` and the Cover Letter generator) takes the top-5 `RoleMatch` results plus the relevant profile context (work experience titles/descriptions, education, summary — same `buildProfileContext`-style snapshot Cover Letter generation already builds) and returns exactly one reasoning paragraph per role, in the same order — mirroring `enhanceBullets`'s "return exactly N items, same order" response contract.

Hard rules stated in the prompt, following this project's established no-fabrication phrasing (`src/lib/cover-letter/prompt.ts`):
- Only reference experience, skills, and education explicitly present in the profile data given.
- Never invent employers, metrics, or accomplishments not present in the input.
- Never state or imply anything about job-market demand, hiring volume, or salary — the analysis is about fit to the role's typical skill set, not about market conditions, which this feature has no data source for.

The AI does not choose which roles appear — that's fully decided by `matchRoles` (§3) before this call happens. Its only job is turning an already-determined match into a clear explanation of *why*, in the user's own terms.

If Gemini generation fails, the record is not created and the user sees an error toast with a retry option — same failure handling as Cover Letter generation (`src/app/[locale]/(app)/cover-letter/actions.ts`), since a `PotentialAnalysis` without any reasoning text would be a broken/useless record.

## 5. Data model

```prisma
model PotentialAnalysis {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  results   Json
  createdAt DateTime @default(now())
}
```

Add `potentialAnalyses PotentialAnalysis[]` to `User`.

`results` stores a full snapshot: `{ roleId, title, category, tier, matchedSkills, missingSkills, reasoning }[]`, one entry per matched role at generation time. Snapshotting (rather than re-deriving from the current taxonomy + profile on every view) matches `ATSCheckAnalysis`'s existing pattern — both the taxonomy and the user's profile can change after the fact, and a past run should stay a faithful record of what it actually said, not silently reinterpret itself against newer data.

## 6. Pages (`/career-fit`)

Mirrors the ATS Check list → new → detail shape:

- `/career-fit` — history list of past runs (date, "Analisis Baru" button), per-row delete, empty state when there are none yet.
- `/career-fit/new` — no form: this is fully profile-driven (unlike Cover Letter, which needs a pasted job posting). A single "Analisis Profil Saya" button. Its server action loads the Profile, builds `userSkills`, runs `matchRoles`, calls the Gemini reasoning step, creates the `PotentialAnalysis` record, and redirects to the result page. If `matchRoles` returns `[]` — whether because the Profile has no skills at all, or because the skills present don't clear the `0.15` threshold for any role — the page shows the same "lengkapi skill di Profile Anda" prompt instead of attempting generation or creating an empty record. The two cases share one corrective action (add more skills), so they share one message rather than needing to be distinguished.
- `/career-fit/[id]` — result page: one card per matched role showing title, category, a tier badge (Sangat Cocok / Cocok / Layak Dicoba), matched-skill chips, missing-skill chips, and the reasoning paragraph. Delete button, same confirmation pattern as the other modules' delete buttons.

`encryptId`/`decryptId` for the `[id]` route param, ownership check via `userId`, same conventions as every other module in this codebase.

## 7. Integration touch points

- New `careerFit.*` i18n namespace (`messages/id.json` + `messages/en.json`): list/new/detail copy, tier labels, category labels.
- Dashboard: new active module tile from day one (not a "coming soon" placeholder — this spec covers the real feature, so it launches active), added to `ACTIVE_MODULE_INDICES` and `moduleHrefs`/`moduleIcons` in `src/app/[locale]/(app)/dashboard/page.tsx`.
- Sidebar (`app-shell.tsx`): new nav entry pointing at `/career-fit`.
- A public `/features/career-fit` marketing landing page is not required for this spec — it can follow later using the same deferred pattern Application Tracker's public page used (§8 of `2026-08-24-application-tracker-design.md`).

## 8. Testing

Per this project's TDD convention for pure logic: `matchRoles` (§3) gets full unit test coverage — tier boundary values, empty `userSkills`, a role with zero overlap, case-insensitivity, the top-5 cap. The role taxonomy file is static data, no tests needed (same as `blog-slugs.ts`). The Gemini reasoning call and server actions are verified manually via `npm run dev`, not unit-tested — this repo has no precedent for testing server actions or AI-calling code (verified from `cover-letter/actions.ts` and the rest of this session's work), only for pure functions.

## 9. Explicitly out of scope

- Skill-gap roadmap / development plan (deferred to v2; `missingSkills` is already captured per role so v2 has what it needs without re-deriving anything).
- Any external job-market, salary, or hiring-demand data — every claim in this feature must be traceable to the user's own Profile data or the static taxonomy.
- Numeric percentage match scores — qualitative tiers only, so the feature never implies a precision the underlying analysis doesn't have.
- Synonym/alias-aware skill matching (e.g. "JS" ≠ "JavaScript" in v1 — see the known limitation in §2).
- A UI for editing the role taxonomy — it's static, code-only, updated by future code changes.
- A public marketing landing page for this feature (see §7).
