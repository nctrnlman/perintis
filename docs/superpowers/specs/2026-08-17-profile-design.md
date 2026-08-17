# Design Spec — Perintis: Profile (Source of Truth Data)

**Date**: 2026-08-17
**Status**: Approved for planning
**Source PRD**: `prd-perintis-by-devino-labs.md` §3 (sitemap `/profile`), §4 (`Profile` model), §5.3 ("Profile bank... reusable 'building blocks': work experience, education, skills")

## 1. Scope

A `/profile` page where the user maintains their career "source of truth" data: personal info, target role/industry, work experience, education, and skills. This replaces the free-form `experienceBlocks Json` field from Phase 1 with properly structured, queryable records — a deliberate change from the original PRD's conceptual schema, made because the user explicitly wants this data to support future trend analysis (skill frequency, career progression over time), which an opaque JSON blob cannot support.

In scope:
- Prisma schema change: `Profile.experienceBlocks Json` removed, replaced by `Profile` direct fields (personal info, target role/industry) plus three new related models: `WorkExperience`, `Education`, `Skill`
- `/profile` page: one page, several independently-saving cards (Personal Info, Target Career, Work Experience, Education, Skills)
- A nav link to `/profile` from the authenticated shell (`DashboardNav`)
- A `Profile` row is ensured to exist (created empty if missing) the first time a user visits `/profile` — mirrors the existing `ensureUserRecord` pattern from Phase 1, so every Server Action here can assume a `Profile` row exists and just `update`/`create` child records

Out of scope for this sub-project (explicit):
- The actual trend-analysis computation (skill-frequency charts, career-progression views) — this sub-project only makes the data structured enough to support that later; computing and displaying trends is a separate future sub-project
- Resume Builder and Cover Letter (Phase 4 modules) reusing this Profile data — noted as the reason this data must be structured, but not built now
- Certifications and languages — not mentioned in the PRD's "building blocks" list (work experience, education, skills only); can be added later without breaking this design
- Profile picture / avatar upload — no Supabase Storage wiring in this project yet (same reasoning as the ATS Check spec)

## 2. Data model

Replace in `prisma/schema.prisma`:

```prisma
model Profile {
  id             String   @id @default(cuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  fullName       String?
  phone          String?
  location       String?
  linkedinUrl    String?
  portfolioUrl   String?
  targetRole     String?
  targetIndustry String?
  updatedAt      DateTime @updatedAt

  workExperiences WorkExperience[]
  educations      Education[]
  skills          Skill[]
}

model WorkExperience {
  id          String    @id @default(cuid())
  profileId   String
  profile     Profile   @relation(fields: [profileId], references: [id])
  title       String
  company     String
  location    String?
  startDate   DateTime
  endDate     DateTime?
  description String?
  skillsUsed  String[]
  createdAt   DateTime  @default(now())
}

model Education {
  id           String    @id @default(cuid())
  profileId    String
  profile      Profile   @relation(fields: [profileId], references: [id])
  institution  String
  degree       String?
  fieldOfStudy String?
  startDate    DateTime
  endDate      DateTime?
  createdAt    DateTime  @default(now())
}

model Skill {
  id        String  @id @default(cuid())
  profileId String
  profile   Profile @relation(fields: [profileId], references: [id])
  name      String
  category  String?
}
```

`experienceBlocks Json` is removed entirely — no data migration needed since Phase 1 never shipped a UI that wrote to it (the field has been dead weight since it was created).

`skillsUsed` on `WorkExperience` uses Postgres's native array type (`String[]`) — a real Postgres feature, not a JSON workaround, queryable directly.

Migration runs against the dedicated `perintis` Postgres schema established during the ATS Check sub-project (not `public`, which belongs to the unrelated rhazes-labs project sharing this database).

## 3. Pages and flow

`/profile` (single page, protected, under `(app)`):
- On load, `ensureProfileRecord(userId)` (new helper, same pattern as `ensureUserRecord`) finds-or-creates an empty `Profile` row for the current user, so every section below always has a `profileId` to attach to
- **Personal Info card**: full name, phone, location, LinkedIn URL, portfolio URL — one form, one Server Action, save button, toast on success/error
- **Target Career card**: target role, target industry — small form, same pattern (could be merged into Personal Info visually as one card with two sub-sections, kept as a distinct heading within the same card to avoid an extra near-empty card — see visual note below)
- **Work Experience card**: list of existing entries (title, company, date range formatted as "Jan 2023 – Present" or "Jan 2020 – Des 2022"), each with edit/delete; an inline "add new" form (collapsed by default, expands on click) with title, company, location, start date, end date (or a "still working here" checkbox that nulls `endDate`), description, and skills used (comma-separated input that becomes a tag list)
- **Education card**: same list + inline add pattern (institution, degree, field of study, start/end date)
- **Skills card**: tag-style list of standalone skills, each removable; a small input + "add" button to append a new one (name + optional category)

Visual note: Personal Info and Target Career are combined into one card with two labeled sections, since target role/industry is only two short fields — a whole separate hairline card for two fields would read as empty/sparse, violating "curate, don't cram" from the other direction (don't over-fragment either).

## 4. Server Actions

All in `src/app/[locale]/(app)/profile/actions.ts`, each re-verifying the authenticated user owns the `Profile`/child record before writing (never trust a client-supplied id alone — same discipline as the ATS Check `[id]` page's ownership check):

- `updatePersonalInfo(formData)` — updates `Profile`'s direct fields
- `addWorkExperience(formData)`, `updateWorkExperience(id, formData)`, `deleteWorkExperience(id)`
- `addEducation(formData)`, `updateEducation(id, formData)`, `deleteEducation(id)`
- `addSkill(formData)`, `deleteSkill(id)` (skills are add/remove only — no in-place edit, matching the "quick tag list" UI; removing and re-adding covers correction)

## 5. Validation

Zod schemas in `src/lib/validations/profile.ts`, TDD-tested like `src/lib/validations/auth.ts`:
- `personalInfoSchema`: all fields optional strings, `linkedinUrl`/`portfolioUrl` validated as URLs when non-empty
- `workExperienceSchema`: `title`/`company` required, `startDate` required, `endDate` optional (must be after `startDate` when present — a `.refine()`), `skillsUsed` as a string array
- `educationSchema`: `institution` required, `startDate` required, `endDate` optional with the same after-start refinement
- `skillSchema`: `name` required (min 1 char), `category` optional

## 6. Error handling

- Same pattern as ATS Check: Server Actions return `{ error: string }` on failure (validation or ownership mismatch), pages show a toast with the translated message
- Ownership mismatch (a `workExperienceId`/`educationId`/`skillId` that doesn't belong to the current user's profile) returns a generic error, not a 404 — this is a same-page inline mutation, not a route, so `notFound()` doesn't apply; the toast just says something went wrong without confirming or denying the record's existence to avoid leaking information

## 7. Cross-cutting

- Bilingual via next-intl, new `profile` message namespace in `messages/id.json`/`messages/en.json`
- Design system: hairline cards, accent only on buttons/links, no em dashes — same as every other page in this project
- `DashboardNav` gets a "Profil" link (next to the user email, before the theme toggle) so the page is reachable

## 8. Testing

- Zod schema unit tests (Vitest) for all four schemas, including the end-date-after-start-date refinement
- Manual smoke test: fill personal info, add/edit/delete a work experience entry, add/delete education, add/delete a skill, confirm data persists across a page reload

## 9. Out of scope (explicit, restated)

- Trend-analysis computation/visualization
- Resume Builder / Cover Letter consuming this data
- Certifications, languages
- Profile picture upload
