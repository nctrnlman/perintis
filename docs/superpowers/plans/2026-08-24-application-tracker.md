# Application Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Application Tracker module: a Kanban board at `/application-tracker` for logging and tracking job applications through 7 stages, with an interview-round timeline per application, optional links to existing Resume Builder documents and Cover Letters, and a stats row computed from the user's own data.

**Architecture:** Two new Prisma models (`Application`, `InterviewRound`) scoped by `userId`. A Server Component board page fetches all of a user's applications + computes stats, hands them to a client `KanbanBoard` component (`@dnd-kit`) that calls a server action on drag-end to update `stage`. A separate detail page follows the existing Cover Letter editor pattern (debounced auto-save via `useAutoSaveForm`) for editing fields and managing the interview-round timeline.

**Tech Stack:** Next.js App Router, Prisma + Postgres (Supabase), `@dnd-kit/core` + `@dnd-kit/sortable` (new dependency), Zod, next-intl, existing `Combobox`/`Table`/`SaveStatus` UI primitives.

**Spec:** `docs/superpowers/specs/2026-08-24-application-tracker-design.md`

## Global Constraints

- No fabricated data anywhere: all 4 stats are pure functions of the signed-in user's own `Application` records, never an external/industry benchmark.
- All UI strings go through next-intl (`messages/id.json` + `messages/en.json`), Indonesian is the default locale.
- Every DB read/write is scoped to the authenticated user (`userId` ownership check), matching every existing feature in this codebase.
- Route params for `/application-tracker/[id]` use `encryptId`/`decryptId` (`src/lib/id-crypto.ts`), same as `/cover-letter/[id]`.
- Server actions are colocated in `actions.ts` files, `"use server"` at the top, ownership-checked before any mutation.
- Visual style: hairline `border-border`, `rounded-2xl` cards, `--primary` blue used sparingly, `hover:scale-[1.02]` on clickable cards — the Apple-centric language already established across this codebase.
- TDD applies to pure logic only (the stats function); UI components and server actions are written directly and verified via `npm run dev` manual walkthrough, matching how every other feature in this repo (Cover Letter, Resume Builder, dashboard cards) was built.
- **Correction from the spec:** §7 of the design spec states server actions should get ownership-check test coverage "matching the existing `deleteCoverLetter`-style pattern." That pattern doesn't actually exist — a repo-wide search (`find src -iname "*actions*.test.ts"`) turns up zero action test files anywhere, for any feature. This plan follows the actual, verified convention instead: server actions are hand-verified via the Task 18 manual walkthrough, not unit-tested, same as `cover-letter/actions.ts`, `resume-builder/actions.ts`, and every other `actions.ts` in this codebase.
- Deleting a linked `ResumeDocument`/`CoverLetter` must not delete the `Application` (`onDelete: SetNull`). Deleting an `Application` cascades to its `InterviewRound`s.
- The public `/features` marketing page is **not** touched by this plan — the spec explicitly defers the public landing page for this module (§8), so `features/page.tsx` keeps showing Application Tracker as "coming soon" until that separate page exists later. Only the authenticated dashboard and sidebar unlock it.

---

### Task 1: Prisma schema and migration

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `ApplicationStage` enum (`WISHLIST | APPLIED | INTERVIEWING | OFFER | ACCEPTED | REJECTED | WITHDRAWN`), `RoundOutcome` enum (`PENDING | PASSED | FAILED`), `Application` model, `InterviewRound` model — all later tasks depend on these exact names and field names.

- [ ] **Step 1: Add the enums and models to `prisma/schema.prisma`**

Add after the `CoverLetter` model (end of file):

```prisma
enum ApplicationStage {
  WISHLIST
  APPLIED
  INTERVIEWING
  OFFER
  ACCEPTED
  REJECTED
  WITHDRAWN
}

enum RoundOutcome {
  PENDING
  PASSED
  FAILED
}

model Application {
  id               String            @id @default(cuid())
  userId           String
  user             User              @relation(fields: [userId], references: [id])
  companyName      String
  positionTitle    String
  stage            ApplicationStage  @default(APPLIED)
  jobUrl           String?
  location         String?
  notes            String?
  resumeDocumentId String?
  resumeDocument   ResumeDocument?   @relation(fields: [resumeDocumentId], references: [id], onDelete: SetNull)
  coverLetterId    String?
  coverLetter      CoverLetter?      @relation(fields: [coverLetterId], references: [id], onDelete: SetNull)
  appliedAt        DateTime?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  interviewRounds  InterviewRound[]
}

model InterviewRound {
  id            String       @id @default(cuid())
  applicationId String
  application   Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  label         String
  scheduledAt   DateTime?
  outcome       RoundOutcome @default(PENDING)
  notes         String?
  createdAt     DateTime     @default(now())
}
```

- [ ] **Step 2: Add the reverse relations to `User`, `ResumeDocument`, and `CoverLetter`**

In `model User`, add to the relations block:

```prisma
  applications    Application[]
```

In `model ResumeDocument`, add:

```prisma
  applications Application[]
```

In `model CoverLetter`, add:

```prisma
  applications Application[]
```

- [ ] **Step 3: Format and generate the migration**

Run: `npx prisma format`
Run: `npx prisma migrate dev --name add_application_tracker`
Expected: a new folder under `prisma/migrations/` with a timestamp prefix and `add_application_tracker` suffix, containing the generated SQL; command exits 0.

- [ ] **Step 4: Verify the Prisma client regenerated correctly**

Run: `npx tsc --noEmit`
Expected: no errors (the generated Prisma client at `src/generated/prisma` now exports `Application`, `InterviewRound`, `ApplicationStage`, `RoundOutcome`).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add Application and InterviewRound Prisma models"
```

---

### Task 2: Zod validation schemas

**Files:**
- Create: `src/lib/validations/application-tracker.ts`

**Interfaces:**
- Consumes: nothing (leaf module)
- Produces: `applicationStageValues: readonly string[]`, `createApplicationSchema`, `UpdateApplicationInput` type, `updateApplicationSchema`, `addInterviewRoundSchema`, `AddInterviewRoundInput` type, `updateRoundOutcomeSchema` — used by Task 6/7 server actions.

- [ ] **Step 1: Write the schema file**

```typescript
import { z } from "zod";

export const applicationStageValues = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || z.string().url().safeParse(value).success, {
    message: "URL tidak valid",
  })
  .optional();

export const createApplicationSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  positionTitle: z.string().min(1, "Posisi wajib diisi"),
  stage: z.enum(applicationStageValues),
  jobUrl: optionalUrl,
  location: z.string().trim().optional(),
  resumeDocumentId: z.string().trim().optional(),
  coverLetterId: z.string().trim().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  positionTitle: z.string().min(1, "Posisi wajib diisi"),
  stage: z.enum(applicationStageValues),
  jobUrl: optionalUrl,
  location: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  appliedAt: z.string().trim().optional(),
  resumeDocumentId: z.string().trim().optional(),
  coverLetterId: z.string().trim().optional(),
});

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

export const addInterviewRoundSchema = z.object({
  label: z.string().min(1, "Nama tahap wajib diisi"),
  scheduledAt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type AddInterviewRoundInput = z.infer<typeof addInterviewRoundSchema>;

export const updateRoundOutcomeSchema = z.object({
  outcome: z.enum(["PENDING", "PASSED", "FAILED"]),
});
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations/application-tracker.ts
git commit -m "feat: add Application Tracker validation schemas"
```

---

### Task 3: Pure stats function (TDD)

**Files:**
- Create: `src/lib/application-tracker/stats.ts`
- Test: `src/lib/application-tracker/stats.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module, no Prisma import — takes a plain array of stage strings so it stays dependency-free and easy to test, matching `src/lib/dashboard/score-trend.ts`'s pattern from this same codebase)
- Produces: `computeApplicationStats(stages: ApplicationStageLike[]): ApplicationStats` — used by Task 11 (board page).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { computeApplicationStats } from "./stats";

describe("computeApplicationStats", () => {
  it("returns all zeros and null rates for no applications", () => {
    const result = computeApplicationStats([]);
    expect(result).toEqual({
      total: 0,
      activePipeline: 0,
      winRate: null,
      interviewConversion: null,
    });
  });

  it("counts total and active pipeline correctly", () => {
    const result = computeApplicationStats([
      "APPLIED",
      "INTERVIEWING",
      "ACCEPTED",
      "REJECTED",
      "WITHDRAWN",
    ]);
    expect(result.total).toBe(5);
    expect(result.activePipeline).toBe(2); // APPLIED, INTERVIEWING
  });

  it("computes win rate from decided applications only", () => {
    const result = computeApplicationStats(["ACCEPTED", "ACCEPTED", "REJECTED", "APPLIED"]);
    expect(result.winRate).toBe(67); // 2/3 rounded
  });

  it("returns null win rate when nothing has been decided yet", () => {
    const result = computeApplicationStats(["APPLIED", "INTERVIEWING", "WISHLIST"]);
    expect(result.winRate).toBeNull();
  });

  it("computes interview conversion excluding wishlist from the denominator", () => {
    const result = computeApplicationStats([
      "WISHLIST",
      "APPLIED",
      "INTERVIEWING",
      "REJECTED",
    ]);
    // denominator = 3 (APPLIED, INTERVIEWING, REJECTED), numerator = 2 (INTERVIEWING, REJECTED)
    expect(result.interviewConversion).toBe(67);
  });

  it("returns null interview conversion when everything is still wishlist", () => {
    const result = computeApplicationStats(["WISHLIST", "WISHLIST"]);
    expect(result.interviewConversion).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/application-tracker/stats.test.ts`
Expected: FAIL with "Cannot find module './stats'"

- [ ] **Step 3: Write the implementation**

```typescript
export type ApplicationStageLike =
  | "WISHLIST"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFER"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface ApplicationStats {
  total: number;
  activePipeline: number;
  winRate: number | null;
  interviewConversion: number | null;
}

const TERMINAL_STAGES = new Set<ApplicationStageLike>(["ACCEPTED", "REJECTED", "WITHDRAWN"]);
const INTERVIEWED_OR_LATER = new Set<ApplicationStageLike>([
  "INTERVIEWING",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
]);

export function computeApplicationStats(stages: ApplicationStageLike[]): ApplicationStats {
  const total = stages.length;
  const activePipeline = stages.filter((stage) => !TERMINAL_STAGES.has(stage)).length;

  const accepted = stages.filter((stage) => stage === "ACCEPTED").length;
  const rejected = stages.filter((stage) => stage === "REJECTED").length;
  const decided = accepted + rejected;
  const winRate = decided === 0 ? null : Math.round((accepted / decided) * 100);

  const applied = stages.filter((stage) => stage !== "WISHLIST").length;
  const interviewed = stages.filter((stage) => INTERVIEWED_OR_LATER.has(stage)).length;
  const interviewConversion = applied === 0 ? null : Math.round((interviewed / applied) * 100);

  return { total, activePipeline, winRate, interviewConversion };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/application-tracker/stats.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/application-tracker/stats.ts src/lib/application-tracker/stats.test.ts
git commit -m "feat: add Application Tracker stats calculation"
```

---

### Task 4: i18n strings

**Files:**
- Modify: `messages/id.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: `applicationTracker.*` namespace and an updated `dashboard.modules[5].steps` array — every later UI task reads keys from this namespace by exact path.

- [ ] **Step 1: Add the `applicationTracker` namespace to `messages/id.json`**

Insert as a new top-level key (after `"blog"`, matching this file's existing key ordering by feature):

```json
"applicationTracker": {
  "title": "Application Tracker",
  "description": "Lacak setiap lamaran kerja Anda dari melamar sampai hasil akhir.",
  "newButton": "Tambah Lamaran",
  "empty": "Belum ada lamaran. Tambahkan lamaran pertama Anda.",
  "stats": {
    "total": "Total Lamaran",
    "activePipeline": "Sedang Berjalan",
    "winRate": "Tingkat Keberhasilan",
    "interviewConversion": "Konversi Wawancara",
    "notEnoughData": "Belum cukup data"
  },
  "stages": {
    "WISHLIST": "Tersimpan",
    "APPLIED": "Dilamar",
    "INTERVIEWING": "Wawancara",
    "OFFER": "Penawaran",
    "ACCEPTED": "Diterima",
    "REJECTED": "Ditolak",
    "WITHDRAWN": "Ditarik"
  },
  "card": {
    "roundsCount": "{count} tahap wawancara"
  },
  "new": {
    "title": "Tambah Lamaran",
    "description": "Catat lamaran baru untuk mulai melacak progresnya.",
    "companyLabel": "Nama Perusahaan",
    "positionLabel": "Posisi",
    "stageLabel": "Status",
    "jobUrlLabel": "Tautan Lowongan (opsional)",
    "locationLabel": "Lokasi (opsional)",
    "resumeLabel": "Resume Terkait (opsional)",
    "resumeNone": "Tidak ada",
    "coverLetterLabel": "Cover Letter Terkait (opsional)",
    "coverLetterNone": "Tidak ada",
    "submit": "Simpan Lamaran",
    "toastCreateSuccess": "Lamaran berhasil ditambahkan",
    "toastCreateError": "Gagal menambahkan lamaran"
  },
  "editor": {
    "backToBoard": "Kembali ke papan",
    "detailsTitle": "Detail Lamaran",
    "companyLabel": "Nama Perusahaan",
    "positionLabel": "Posisi",
    "stageLabel": "Status",
    "jobUrlLabel": "Tautan Lowongan",
    "locationLabel": "Lokasi",
    "appliedAtLabel": "Tanggal Melamar",
    "notesLabel": "Catatan",
    "resumeLabel": "Resume Terkait",
    "resumeNone": "Tidak ada",
    "coverLetterLabel": "Cover Letter Terkait",
    "coverLetterNone": "Tidak ada",
    "deleteButton": "Hapus Lamaran",
    "toastDeleteError": "Gagal menghapus lamaran",
    "roundsTitle": "Tahap Wawancara",
    "roundsEmpty": "Belum ada tahap wawancara yang dicatat.",
    "addRoundButton": "Tambah Tahap",
    "roundLabelLabel": "Nama Tahap",
    "roundLabelPlaceholder": "mis. Wawancara HR, Tes Teknis",
    "roundDateLabel": "Tanggal (opsional)",
    "roundNotesLabel": "Catatan (opsional)",
    "roundSubmit": "Simpan Tahap",
    "roundDelete": "Hapus",
    "outcomePending": "Menunggu",
    "outcomePassed": "Lolos",
    "outcomeFailed": "Tidak Lolos",
    "toastRoundAddError": "Gagal menambahkan tahap",
    "toastRoundDeleteError": "Gagal menghapus tahap"
  },
  "autoSaving": "Menyimpan otomatis...",
  "autoSaved": "Tersimpan",
  "autoSaveError": "Gagal menyimpan"
}
```

- [ ] **Step 2: Update `dashboard.modules[5]` in `messages/id.json`**

Find the `"Application Tracker"` entry inside `dashboard.modules` (index 5, currently has no `steps`) and add one:

```json
{
  "title": "Application Tracker",
  "description": "Lacak status lamaran Anda.",
  "steps": [
    "Buka menu \"Application Tracker\" di sidebar",
    "Tambahkan lamaran baru dan pilih status awalnya",
    "Seret kartu antar kolom saat status lamaran berubah"
  ]
}
```

- [ ] **Step 3: Repeat Steps 1–2 for `messages/en.json`**

```json
"applicationTracker": {
  "title": "Application Tracker",
  "description": "Track every job application from applying to the final outcome.",
  "newButton": "Add Application",
  "empty": "No applications yet. Add your first one.",
  "stats": {
    "total": "Total Applications",
    "activePipeline": "In Progress",
    "winRate": "Win Rate",
    "interviewConversion": "Interview Conversion",
    "notEnoughData": "Not enough data yet"
  },
  "stages": {
    "WISHLIST": "Wishlist",
    "APPLIED": "Applied",
    "INTERVIEWING": "Interviewing",
    "OFFER": "Offer",
    "ACCEPTED": "Accepted",
    "REJECTED": "Rejected",
    "WITHDRAWN": "Withdrawn"
  },
  "card": {
    "roundsCount": "{count} interview rounds"
  },
  "new": {
    "title": "Add Application",
    "description": "Log a new application to start tracking its progress.",
    "companyLabel": "Company Name",
    "positionLabel": "Position",
    "stageLabel": "Stage",
    "jobUrlLabel": "Job Posting URL (optional)",
    "locationLabel": "Location (optional)",
    "resumeLabel": "Linked Resume (optional)",
    "resumeNone": "None",
    "coverLetterLabel": "Linked Cover Letter (optional)",
    "coverLetterNone": "None",
    "submit": "Save Application",
    "toastCreateSuccess": "Application added",
    "toastCreateError": "Failed to add application"
  },
  "editor": {
    "backToBoard": "Back to board",
    "detailsTitle": "Application Details",
    "companyLabel": "Company Name",
    "positionLabel": "Position",
    "stageLabel": "Stage",
    "jobUrlLabel": "Job Posting URL",
    "locationLabel": "Location",
    "appliedAtLabel": "Applied Date",
    "notesLabel": "Notes",
    "resumeLabel": "Linked Resume",
    "resumeNone": "None",
    "coverLetterLabel": "Linked Cover Letter",
    "coverLetterNone": "None",
    "deleteButton": "Delete Application",
    "toastDeleteError": "Failed to delete application",
    "roundsTitle": "Interview Rounds",
    "roundsEmpty": "No interview rounds logged yet.",
    "addRoundButton": "Add Round",
    "roundLabelLabel": "Round Name",
    "roundLabelPlaceholder": "e.g. HR Interview, Technical Test",
    "roundDateLabel": "Date (optional)",
    "roundNotesLabel": "Notes (optional)",
    "roundSubmit": "Save Round",
    "roundDelete": "Delete",
    "outcomePending": "Pending",
    "outcomePassed": "Passed",
    "outcomeFailed": "Failed",
    "toastRoundAddError": "Failed to add round",
    "toastRoundDeleteError": "Failed to delete round"
  },
  "autoSaving": "Saving...",
  "autoSaved": "Saved",
  "autoSaveError": "Failed to save"
}
```

`dashboard.modules[5]` in `messages/en.json`:

```json
{
  "title": "Application Tracker",
  "description": "Track your application status.",
  "steps": [
    "Open \"Application Tracker\" in the sidebar",
    "Add a new application and pick its starting stage",
    "Drag the card between columns as its status changes"
  ]
}
```

- [ ] **Step 4: Verify both files are valid JSON**

Run: `python3 -c "import json; json.load(open('messages/id.json')); json.load(open('messages/en.json')); print('OK')"`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add messages/id.json messages/en.json
git commit -m "feat: add Application Tracker translations"
```

---

### Task 5: Install drag-and-drop dependency

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install `@dnd-kit/core` and `@dnd-kit/sortable`**

Run: `npm install @dnd-kit/core @dnd-kit/sortable`
Expected: exits 0, both packages added to `package.json` dependencies.

- [ ] **Step 2: Verify the install didn't break anything**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit for the Application Tracker board"
```

---

### Task 6: Server actions — Application CRUD and stage change

**Files:**
- Create: `src/app/[locale]/(app)/application-tracker/actions.ts`

**Interfaces:**
- Consumes: `createApplicationSchema`, `updateApplicationSchema` from Task 2; `db` from `@/lib/db`; `encryptId` from `@/lib/id-crypto`; `createClient` from `@/lib/supabase/server`.
- Produces: `createApplication(formData): Promise<{ token: string } | { error: string }>`, `updateApplicationFields(id, formData): Promise<{ success: true } | { error: string }>`, `updateApplicationStage(id, stage): Promise<{ success: true } | { error: string }>`, `deleteApplication(id): Promise<{ success: true } | { error: string }>` — consumed by Tasks 11–15.

- [ ] **Step 1: Write the actions file**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import {
  createApplicationSchema,
  updateApplicationSchema,
  applicationStageValues,
} from "@/lib/validations/application-tracker";

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createApplication(
  formData: FormData
): Promise<{ token: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const parsed = createApplicationSchema.safeParse({
    companyName: formData.get("companyName") ?? "",
    positionTitle: formData.get("positionTitle") ?? "",
    stage: formData.get("stage") ?? "APPLIED",
    jobUrl: formData.get("jobUrl") ?? "",
    location: formData.get("location") ?? "",
    resumeDocumentId: formData.get("resumeDocumentId") ?? "",
    coverLetterId: formData.get("coverLetterId") ?? "",
  });
  if (!parsed.success) return { error: "validation-failed" };

  const resumeDocumentId = emptyToNull(parsed.data.resumeDocumentId);
  const coverLetterId = emptyToNull(parsed.data.coverLetterId);

  if (resumeDocumentId) {
    const resume = await db.resumeDocument.findUnique({ where: { id: resumeDocumentId } });
    if (!resume || resume.userId !== user.id) return { error: "invalid-resume" };
  }
  if (coverLetterId) {
    const coverLetter = await db.coverLetter.findUnique({ where: { id: coverLetterId } });
    if (!coverLetter || coverLetter.userId !== user.id) return { error: "invalid-cover-letter" };
  }

  const application = await db.application.create({
    data: {
      userId: user.id,
      companyName: parsed.data.companyName,
      positionTitle: parsed.data.positionTitle,
      stage: parsed.data.stage,
      jobUrl: emptyToNull(parsed.data.jobUrl),
      location: emptyToNull(parsed.data.location),
      resumeDocumentId,
      coverLetterId,
      appliedAt: parsed.data.stage === "WISHLIST" ? null : new Date(),
    },
  });

  revalidatePath("/application-tracker");
  return { token: encryptId(application.id) };
}

export async function updateApplicationFields(
  id: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.application.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  const parsed = updateApplicationSchema.safeParse({
    companyName: formData.get("companyName") ?? "",
    positionTitle: formData.get("positionTitle") ?? "",
    stage: formData.get("stage") ?? existing.stage,
    jobUrl: formData.get("jobUrl") ?? "",
    location: formData.get("location") ?? "",
    notes: formData.get("notes") ?? "",
    appliedAt: formData.get("appliedAt") ?? "",
    resumeDocumentId: formData.get("resumeDocumentId") ?? "",
    coverLetterId: formData.get("coverLetterId") ?? "",
  });
  if (!parsed.success) return { error: "validation-failed" };

  const resumeDocumentId = emptyToNull(parsed.data.resumeDocumentId);
  const coverLetterId = emptyToNull(parsed.data.coverLetterId);

  if (resumeDocumentId) {
    const resume = await db.resumeDocument.findUnique({ where: { id: resumeDocumentId } });
    if (!resume || resume.userId !== user.id) return { error: "invalid-resume" };
  }
  if (coverLetterId) {
    const coverLetter = await db.coverLetter.findUnique({ where: { id: coverLetterId } });
    if (!coverLetter || coverLetter.userId !== user.id) return { error: "invalid-cover-letter" };
  }

  const appliedAtInput = parsed.data.appliedAt?.trim();
  const nextAppliedAt =
    appliedAtInput ? new Date(appliedAtInput) : existing.stage === "WISHLIST" && parsed.data.stage !== "WISHLIST"
      ? new Date()
      : existing.appliedAt;

  await db.application.update({
    where: { id },
    data: {
      companyName: parsed.data.companyName,
      positionTitle: parsed.data.positionTitle,
      stage: parsed.data.stage,
      jobUrl: emptyToNull(parsed.data.jobUrl),
      location: emptyToNull(parsed.data.location),
      notes: emptyToNull(parsed.data.notes),
      resumeDocumentId,
      coverLetterId,
      appliedAt: nextAppliedAt,
    },
  });

  revalidatePath("/application-tracker");
  return { success: true };
}

export async function updateApplicationStage(
  id: string,
  stage: string
): Promise<{ success: true } | { error: string }> {
  if (!(applicationStageValues as readonly string[]).includes(stage)) {
    return { error: "invalid-stage" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.application.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  const nextAppliedAt =
    existing.appliedAt === null && stage !== "WISHLIST" ? new Date() : existing.appliedAt;

  await db.application.update({
    where: { id },
    data: {
      stage: stage as typeof existing.stage,
      appliedAt: nextAppliedAt,
    },
  });

  revalidatePath("/application-tracker");
  return { success: true };
}

export async function deleteApplication(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.application.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  await db.application.delete({ where: { id } });
  revalidatePath("/application-tracker");
  return { success: true };
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(app)/application-tracker/actions.ts
git commit -m "feat: add Application server actions"
```

---

### Task 7: Server actions — Interview round CRUD

**Files:**
- Modify: `src/app/[locale]/(app)/application-tracker/actions.ts`

**Interfaces:**
- Consumes: `addInterviewRoundSchema`, `updateRoundOutcomeSchema` from Task 2.
- Produces: `addInterviewRound(applicationId, formData): Promise<{ success: true } | { error: string }>`, `updateInterviewRoundOutcome(roundId, outcome): Promise<{ success: true } | { error: string }>`, `deleteInterviewRound(roundId): Promise<{ success: true } | { error: string }>` — consumed by Task 14 (interview round timeline component).

- [ ] **Step 1: Add the import**

Add `addInterviewRoundSchema` and `updateRoundOutcomeSchema` to the existing import from `@/lib/validations/application-tracker` at the top of `actions.ts`:

```typescript
import {
  createApplicationSchema,
  updateApplicationSchema,
  applicationStageValues,
  addInterviewRoundSchema,
  updateRoundOutcomeSchema,
} from "@/lib/validations/application-tracker";
```

- [ ] **Step 2: Append the three round actions to the end of `actions.ts`**

```typescript
export async function addInterviewRound(
  applicationId: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const application = await db.application.findUnique({ where: { id: applicationId } });
  if (!application || application.userId !== user.id) return { error: "not-found" };

  const parsed = addInterviewRoundSchema.safeParse({
    label: formData.get("label") ?? "",
    scheduledAt: formData.get("scheduledAt") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { error: "validation-failed" };

  const scheduledAtInput = parsed.data.scheduledAt?.trim();

  await db.interviewRound.create({
    data: {
      applicationId,
      label: parsed.data.label,
      scheduledAt: scheduledAtInput ? new Date(scheduledAtInput) : null,
      notes: emptyToNull(parsed.data.notes),
    },
  });

  revalidatePath("/application-tracker");
  return { success: true };
}

export async function updateInterviewRoundOutcome(
  roundId: string,
  outcome: string
): Promise<{ success: true } | { error: string }> {
  const parsed = updateRoundOutcomeSchema.safeParse({ outcome });
  if (!parsed.success) return { error: "invalid-outcome" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const round = await db.interviewRound.findUnique({
    where: { id: roundId },
    include: { application: true },
  });
  if (!round || round.application.userId !== user.id) return { error: "not-found" };

  await db.interviewRound.update({
    where: { id: roundId },
    data: { outcome: parsed.data.outcome },
  });

  revalidatePath("/application-tracker");
  return { success: true };
}

export async function deleteInterviewRound(
  roundId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const round = await db.interviewRound.findUnique({
    where: { id: roundId },
    include: { application: true },
  });
  if (!round || round.application.userId !== user.id) return { error: "not-found" };

  await db.interviewRound.delete({ where: { id: roundId } });
  revalidatePath("/application-tracker");
  return { success: true };
}
```

- [ ] **Step 3: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/(app)/application-tracker/actions.ts
git commit -m "feat: add InterviewRound server actions"
```

---

### Task 8: Application card component

**Files:**
- Create: `src/components/application-tracker/application-card.tsx`

**Interfaces:**
- Consumes: nothing beyond props (presentational).
- Produces: `<ApplicationCard>` — consumed by Task 9 (Kanban board).

- [ ] **Step 1: Write the component**

```typescript
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import { FileEdit, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface ApplicationCardProps {
  id: string;
  token: string;
  companyName: string;
  positionTitle: string;
  hasResume: boolean;
  hasCoverLetter: boolean;
  roundCount: number;
}

export function ApplicationCard({
  id,
  token,
  companyName,
  positionTitle,
  hasResume,
  hasCoverLetter,
  roundCount,
}: ApplicationCardProps) {
  const t = useTranslations("applicationTracker.card");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link
        href={`/application-tracker/${token}`}
        className="block rounded-2xl border border-border bg-background p-4 transition-transform hover:scale-[1.02]"
      >
        <p className="font-medium">{companyName}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{positionTitle}</p>
        {(hasResume || hasCoverLetter || roundCount > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {hasResume && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <FileEdit className="size-3" />
              </span>
            )}
            {hasCoverLetter && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <Mail className="size-3" />
              </span>
            )}
            {roundCount > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {t("roundsCount", { count: roundCount })}
              </span>
            )}
          </div>
        )}
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors (will fail until Task 5's `@dnd-kit` packages are installed — confirm Task 5 ran first).

- [ ] **Step 3: Commit**

```bash
git add src/components/application-tracker/application-card.tsx
git commit -m "feat: add ApplicationCard component"
```

---

### Task 9: Kanban board client component

**Files:**
- Create: `src/components/application-tracker/kanban-board.tsx`

**Interfaces:**
- Consumes: `ApplicationCard` from Task 8; `updateApplicationStage` from Task 6.
- Produces: `<KanbanBoard applications={...} />` — consumed by Task 11 (board page). `KanbanApplication` type — the exact shape the board page must pass in.

- [ ] **Step 1: Write the component**

```typescript
"use client";

import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/toast";
import { ApplicationCard } from "./application-card";
import { updateApplicationStage } from "@/app/[locale]/(app)/application-tracker/actions";

export interface KanbanApplication {
  id: string;
  token: string;
  companyName: string;
  positionTitle: string;
  stage: string;
  hasResume: boolean;
  hasCoverLetter: boolean;
  roundCount: number;
}

const STAGES = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

function KanbanColumn({
  stage,
  label,
  applications,
}: {
  stage: string;
  label: string;
  applications: KanbanApplication[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-2xl border border-border p-3 ${
        isOver ? "bg-muted/50" : ""
      }`}
    >
      <div className="flex items-center justify-between px-1 pb-3">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground">{applications.length}</span>
      </div>
      <SortableContext
        items={applications.map((application) => application.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              id={application.id}
              token={application.token}
              companyName={application.companyName}
              positionTitle={application.positionTitle}
              hasResume={application.hasResume}
              hasCoverLetter={application.hasCoverLetter}
              roundCount={application.roundCount}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ applications }: { applications: KanbanApplication[] }) {
  const t = useTranslations("applicationTracker.stages");
  const tErrors = useTranslations("applicationTracker.editor");
  const [items, setItems] = useState(applications);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const nextStage = String(over.id);
    if (!(STAGES as readonly string[]).includes(nextStage)) return;

    const applicationId = String(active.id);
    const current = items.find((application) => application.id === applicationId);
    if (!current || current.stage === nextStage) return;

    setItems((prev) =>
      prev.map((application) =>
        application.id === applicationId ? { ...application, stage: nextStage } : application
      )
    );

    updateApplicationStage(applicationId, nextStage).then((result) => {
      if ("error" in result) {
        toast.add({ title: tErrors("toastDeleteError"), type: "error" });
        setItems((prev) =>
          prev.map((application) =>
            application.id === applicationId ? { ...application, stage: current.stage } : application
          )
        );
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            label={t(stage)}
            applications={items.filter((application) => application.stage === stage)}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/application-tracker/kanban-board.tsx
git commit -m "feat: add KanbanBoard component with drag-and-drop stage changes"
```

---

### Task 10: Stats row component

**Files:**
- Create: `src/components/application-tracker/stats-row.tsx`

**Interfaces:**
- Consumes: `ApplicationStats` type from Task 3.
- Produces: `<ApplicationStatsRow stats={...} />` — consumed by Task 11.

- [ ] **Step 1: Write the component**

```typescript
import { useTranslations } from "next-intl";
import type { ApplicationStats } from "@/lib/application-tracker/stats";

export function ApplicationStatsRow({ stats }: { stats: ApplicationStats }) {
  const t = useTranslations("applicationTracker.stats");

  const items = [
    { label: t("total"), value: String(stats.total) },
    { label: t("activePipeline"), value: String(stats.activePipeline) },
    {
      label: t("winRate"),
      value: stats.winRate === null ? t("notEnoughData") : `${stats.winRate}%`,
    },
    {
      label: t("interviewConversion"),
      value: stats.interviewConversion === null ? t("notEnoughData") : `${stats.interviewConversion}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border p-4">
          <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/application-tracker/stats-row.tsx
git commit -m "feat: add ApplicationStatsRow component"
```

---

### Task 11: Board page (`/application-tracker`)

**Files:**
- Create: `src/app/[locale]/(app)/application-tracker/page.tsx`

**Interfaces:**
- Consumes: `KanbanBoard`/`KanbanApplication` from Task 9, `ApplicationStatsRow` from Task 10, `computeApplicationStats` from Task 3, `encryptId` from `@/lib/id-crypto`, `db` from `@/lib/db`.
- Produces: the `/application-tracker` route.

- [ ] **Step 1: Write the page**

```typescript
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { computeApplicationStats } from "@/lib/application-tracker/stats";
import { ApplicationStatsRow } from "@/components/application-tracker/stats-row";
import { KanbanBoard, type KanbanApplication } from "@/components/application-tracker/kanban-board";

export default async function ApplicationTrackerPage() {
  const t = await getTranslations("applicationTracker");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const applications = await db.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { interviewRounds: true } } },
  });

  const stats = computeApplicationStats(applications.map((application) => application.stage));

  const kanbanApplications: KanbanApplication[] = applications.map((application) => ({
    id: application.id,
    token: encryptId(application.id),
    companyName: application.companyName,
    positionTitle: application.positionTitle,
    stage: application.stage,
    hasResume: application.resumeDocumentId !== null,
    hasCoverLetter: application.coverLetterId !== null,
    roundCount: application._count.interviewRounds,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/application-tracker/new">{t("newButton")}</Link>} />
      </div>

      <div className="mt-8">
        <ApplicationStatsRow stats={stats} />
      </div>

      {applications.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8">
          <KanbanBoard applications={kanbanApplications} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/(app)/application-tracker/page.tsx
git commit -m "feat: add Application Tracker board page"
```

---

### Task 12: Delete application button

**Files:**
- Create: `src/components/application-tracker/delete-application-button.tsx`

**Interfaces:**
- Consumes: `deleteApplication` from Task 6.
- Produces: `<DeleteApplicationButton id={...} />` — consumed by Task 15 (detail page).

- [ ] **Step 1: Write the component**

```typescript
"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteApplication } from "@/app/[locale]/(app)/application-tracker/actions";
import { trackEvent } from "@/lib/analytics-events";

export function DeleteApplicationButton({ id }: { id: string }) {
  const t = useTranslations("applicationTracker.editor");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteApplication(id);
      if ("error" in result) {
        toast.add({ title: t("toastDeleteError"), type: "error" });
        return;
      }
      trackEvent("application_deleted");
      router.push("/application-tracker");
    });
  }

  return (
    <Button variant="ghost" onClick={handleDelete} disabled={isPending}>
      {t("deleteButton")}
    </Button>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/application-tracker/delete-application-button.tsx
git commit -m "feat: add DeleteApplicationButton component"
```

---

### Task 13: Create form page (`/application-tracker/new`)

**Files:**
- Create: `src/app/[locale]/(app)/application-tracker/new/page.tsx`
- Create: `src/app/[locale]/(app)/application-tracker/new/new-application-form.tsx`

**Interfaces:**
- Consumes: `createApplication` from Task 6; `Combobox` from `@/components/ui/combobox`; `db` for fetching the user's resumes/cover letters to populate pickers.
- Produces: the `/application-tracker/new` route.

- [ ] **Step 1: Write the page**

This is a Server Component that fetches picker options, wrapped around a small client sub-component for the interactive form (mirrors the split already used between `cover-letter/new/page.tsx`, which is entirely client because it needs no server-fetched options — here we need server-fetched Resume/CoverLetter lists first).

```typescript
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { NewApplicationForm } from "./new-application-form";

export default async function NewApplicationPage() {
  const t = await getTranslations("applicationTracker.new");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [resumes, coverLetters] = await Promise.all([
    db.resumeDocument.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    db.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, companyName: true, positionTitle: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      <NewApplicationForm
        resumeOptions={resumes.map((resume) => ({ value: resume.id, label: resume.title }))}
        coverLetterOptions={coverLetters.map((letter) => ({
          value: letter.id,
          label: `${letter.companyName} — ${letter.positionTitle}`,
        }))}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write the client form sub-component**

```typescript
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { toast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics-events";
import { createApplication } from "../actions";

const STAGES = ["WISHLIST", "APPLIED", "INTERVIEWING", "OFFER", "ACCEPTED", "REJECTED", "WITHDRAWN"];

interface NewApplicationFormProps {
  resumeOptions: ComboboxOption[];
  coverLetterOptions: ComboboxOption[];
}

export function NewApplicationForm({ resumeOptions, coverLetterOptions }: NewApplicationFormProps) {
  const t = useTranslations("applicationTracker.new");
  const tStages = useTranslations("applicationTracker.stages");
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [positionTitle, setPositionTitle] = useState("");
  const [stage, setStage] = useState("APPLIED");
  const [jobUrl, setJobUrl] = useState("");
  const [location, setLocation] = useState("");
  const [resumeDocumentId, setResumeDocumentId] = useState("");
  const [coverLetterId, setCoverLetterId] = useState("");
  const [isPending, startTransition] = useTransition();

  const canSubmit = Boolean(companyName.trim() && positionTitle.trim());

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("companyName", companyName);
      formData.set("positionTitle", positionTitle);
      formData.set("stage", stage);
      formData.set("jobUrl", jobUrl);
      formData.set("location", location);
      formData.set("resumeDocumentId", resumeDocumentId);
      formData.set("coverLetterId", coverLetterId);

      const result = await createApplication(formData);
      if ("error" in result) {
        toast.add({ title: t("toastCreateError"), type: "error" });
        return;
      }
      trackEvent("application_created", { stage });
      toast.add({ title: t("toastCreateSuccess"), type: "success" });
      router.push(`/application-tracker/${result.token}`);
    });
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="companyName">{t("companyLabel")}</Label>
          <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="positionTitle">{t("positionLabel")}</Label>
          <Input id="positionTitle" value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t("stageLabel")}</Label>
        <Combobox
          value={stage}
          onChange={setStage}
          options={STAGES.map((value) => ({ value, label: tStages(value) }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="jobUrl">{t("jobUrlLabel")}</Label>
          <Input id="jobUrl" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">{t("locationLabel")}</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("resumeLabel")}</Label>
          <Combobox
            value={resumeDocumentId}
            onChange={setResumeDocumentId}
            options={[{ value: "", label: t("resumeNone") }, ...resumeOptions]}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("coverLetterLabel")}</Label>
          <Combobox
            value={coverLetterId}
            onChange={setCoverLetterId}
            options={[{ value: "", label: t("coverLetterNone") }, ...coverLetterOptions]}
          />
        </div>
      </div>

      <Button size="lg" className="w-full" disabled={!canSubmit || isPending} onClick={handleSubmit}>
        {t("submit")}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/(app)/application-tracker/new
git commit -m "feat: add Application Tracker create form"
```

---

### Task 14: Interview round timeline component

**Files:**
- Create: `src/components/application-tracker/interview-round-timeline.tsx`

**Interfaces:**
- Consumes: `addInterviewRound`, `updateInterviewRoundOutcome`, `deleteInterviewRound` from Task 7.
- Produces: `<InterviewRoundTimeline applicationId={...} rounds={...} />` — consumed by Task 15 (detail page).

- [ ] **Step 1: Write the component**

```typescript
"use client";

import { useState, useTransition } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics-events";
import {
  addInterviewRound,
  deleteInterviewRound,
  updateInterviewRoundOutcome,
} from "@/app/[locale]/(app)/application-tracker/actions";

export interface InterviewRoundItem {
  id: string;
  label: string;
  scheduledAt: Date | null;
  outcome: "PENDING" | "PASSED" | "FAILED";
  notes: string | null;
}

export function InterviewRoundTimeline({
  applicationId,
  rounds,
}: {
  applicationId: string;
  rounds: InterviewRoundItem[];
}) {
  const t = useTranslations("applicationTracker.editor");
  const format = useFormatter();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isAdding, startAddTransition] = useTransition();

  function handleAdd() {
    if (!label.trim()) return;
    startAddTransition(async () => {
      const formData = new FormData();
      formData.set("label", label);
      formData.set("scheduledAt", scheduledAt);
      formData.set("notes", notes);

      const result = await addInterviewRound(applicationId, formData);
      if ("error" in result) {
        toast.add({ title: t("toastRoundAddError"), type: "error" });
        return;
      }
      trackEvent("interview_round_added");
      setLabel("");
      setScheduledAt("");
      setNotes("");
      setShowForm(false);
    });
  }

  function handleOutcomeChange(roundId: string, outcome: string) {
    updateInterviewRoundOutcome(roundId, outcome);
  }

  function handleDelete(roundId: string) {
    deleteInterviewRound(roundId).then((result) => {
      if ("error" in result) {
        toast.add({ title: t("toastRoundDeleteError"), type: "error" });
        return;
      }
      trackEvent("interview_round_deleted");
    });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("roundsTitle")}</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm((prev) => !prev)}>
          <Plus className="size-4" />
          {t("addRoundButton")}
        </Button>
      </div>

      {showForm && (
        <div className="mt-5 space-y-3 rounded-xl border border-border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="roundLabel">{t("roundLabelLabel")}</Label>
            <Input
              id="roundLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("roundLabelPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roundDate">{t("roundDateLabel")}</Label>
            <Input
              id="roundDate"
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roundNotes">{t("roundNotesLabel")}</Label>
            <Input id="roundNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button size="sm" disabled={!label.trim() || isAdding} onClick={handleAdd}>
            {t("roundSubmit")}
          </Button>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {rounds.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">{t("roundsEmpty")}</p>
        )}
        {rounds.map((round) => (
          <div
            key={round.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{round.label}</p>
              {round.scheduledAt && (
                <p className="text-xs text-muted-foreground">
                  {format.dateTime(round.scheduledAt, { dateStyle: "medium" })}
                </p>
              )}
              {round.notes && <p className="mt-1 text-sm text-muted-foreground">{round.notes}</p>}
            </div>
            <Combobox
              className="w-36"
              value={round.outcome}
              onChange={(value) => handleOutcomeChange(round.id, value)}
              options={[
                { value: "PENDING", label: t("outcomePending") },
                { value: "PASSED", label: t("outcomePassed") },
                { value: "FAILED", label: t("outcomeFailed") },
              ]}
            />
            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(round.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/application-tracker/interview-round-timeline.tsx
git commit -m "feat: add InterviewRoundTimeline component"
```

---

### Task 15: Detail page (`/application-tracker/[id]`)

**Files:**
- Create: `src/app/[locale]/(app)/application-tracker/[id]/page.tsx`
- Create: `src/app/[locale]/(app)/application-tracker/[id]/application-editor-client.tsx`

**Interfaces:**
- Consumes: `updateApplicationFields` from Task 6, `DeleteApplicationButton` from Task 12, `InterviewRoundTimeline`/`InterviewRoundItem` from Task 14, `decryptId` from `@/lib/id-crypto`, `useAutoSaveForm` from `@/hooks/use-auto-save-form`, `SaveStatus` from `@/components/profile/save-status`.
- Produces: the `/application-tracker/[id]` route.

- [ ] **Step 1: Write the server page**

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { ApplicationEditorClient } from "./application-editor-client";

export default async function ApplicationEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: token } = await params;
  const applicationId = decryptId(token);
  if (!applicationId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const [application, resumes, coverLetters] = await Promise.all([
    db.application.findUnique({
      where: { id: applicationId },
      include: { interviewRounds: { orderBy: { createdAt: "asc" } } },
    }),
    db.resumeDocument.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    db.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, companyName: true, positionTitle: true },
    }),
  ]);

  if (!application || application.userId !== user.id) notFound();

  return (
    <ApplicationEditorClient
      id={application.id}
      initialCompanyName={application.companyName}
      initialPositionTitle={application.positionTitle}
      initialStage={application.stage}
      initialJobUrl={application.jobUrl ?? ""}
      initialLocation={application.location ?? ""}
      initialNotes={application.notes ?? ""}
      initialAppliedAt={application.appliedAt ? application.appliedAt.toISOString().slice(0, 10) : ""}
      initialResumeDocumentId={application.resumeDocumentId ?? ""}
      initialCoverLetterId={application.coverLetterId ?? ""}
      resumeOptions={resumes.map((resume) => ({ value: resume.id, label: resume.title }))}
      coverLetterOptions={coverLetters.map((letter) => ({
        value: letter.id,
        label: `${letter.companyName} — ${letter.positionTitle}`,
      }))}
      rounds={application.interviewRounds}
    />
  );
}
```

- [ ] **Step 2: Write the client editor**

```typescript
"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { SaveStatus } from "@/components/profile/save-status";
import { DeleteApplicationButton } from "@/components/application-tracker/delete-application-button";
import {
  InterviewRoundTimeline,
  type InterviewRoundItem,
} from "@/components/application-tracker/interview-round-timeline";
import { useAutoSaveForm } from "@/hooks/use-auto-save-form";
import { updateApplicationFields } from "../actions";

const STAGES = ["WISHLIST", "APPLIED", "INTERVIEWING", "OFFER", "ACCEPTED", "REJECTED", "WITHDRAWN"];

interface ApplicationEditorClientProps {
  id: string;
  initialCompanyName: string;
  initialPositionTitle: string;
  initialStage: string;
  initialJobUrl: string;
  initialLocation: string;
  initialNotes: string;
  initialAppliedAt: string;
  initialResumeDocumentId: string;
  initialCoverLetterId: string;
  resumeOptions: ComboboxOption[];
  coverLetterOptions: ComboboxOption[];
  rounds: InterviewRoundItem[];
}

export function ApplicationEditorClient({
  id,
  initialCompanyName,
  initialPositionTitle,
  initialStage,
  initialJobUrl,
  initialLocation,
  initialNotes,
  initialAppliedAt,
  initialResumeDocumentId,
  initialCoverLetterId,
  resumeOptions,
  coverLetterOptions,
  rounds,
}: ApplicationEditorClientProps) {
  const t = useTranslations("applicationTracker.editor");
  const tStages = useTranslations("applicationTracker.stages");
  const [stage, setStage] = useState(initialStage);
  const [resumeDocumentId, setResumeDocumentId] = useState(initialResumeDocumentId);
  const [coverLetterId, setCoverLetterId] = useState(initialCoverLetterId);

  const save = useCallback((formData: FormData) => updateApplicationFields(id, formData), [id]);
  const { formRef, status, handleChange } = useAutoSaveForm(save);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/application-tracker" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; {t("backToBoard")}
        </Link>
      </div>

      <div className="rounded-2xl border border-border p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("detailsTitle")}</h2>
          <SaveStatus status={status} namespace="applicationTracker" />
        </div>

        <form ref={formRef} onChange={handleChange} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">{t("companyLabel")}</Label>
              <Input id="companyName" name="companyName" defaultValue={initialCompanyName} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="positionTitle">{t("positionLabel")}</Label>
              <Input id="positionTitle" name="positionTitle" defaultValue={initialPositionTitle} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("stageLabel")}</Label>
            <Combobox
              value={stage}
              onChange={(value) => {
                setStage(value);
                handleChange();
              }}
              options={STAGES.map((value) => ({ value, label: tStages(value) }))}
            />
            <input type="hidden" name="stage" value={stage} readOnly />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jobUrl">{t("jobUrlLabel")}</Label>
              <Input id="jobUrl" name="jobUrl" defaultValue={initialJobUrl} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">{t("locationLabel")}</Label>
              <Input id="location" name="location" defaultValue={initialLocation} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appliedAt">{t("appliedAtLabel")}</Label>
            <Input id="appliedAt" name="appliedAt" type="date" defaultValue={initialAppliedAt} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("notesLabel")}</Label>
            <Textarea id="notes" name="notes" defaultValue={initialNotes} rows={4} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("resumeLabel")}</Label>
              <Combobox
                value={resumeDocumentId}
                onChange={(value) => {
                  setResumeDocumentId(value);
                  handleChange();
                }}
                options={[{ value: "", label: t("resumeNone") }, ...resumeOptions]}
              />
              <input type="hidden" name="resumeDocumentId" value={resumeDocumentId} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>{t("coverLetterLabel")}</Label>
              <Combobox
                value={coverLetterId}
                onChange={(value) => {
                  setCoverLetterId(value);
                  handleChange();
                }}
                options={[{ value: "", label: t("coverLetterNone") }, ...coverLetterOptions]}
              />
              <input type="hidden" name="coverLetterId" value={coverLetterId} readOnly />
            </div>
          </div>
        </form>
      </div>

      <InterviewRoundTimeline applicationId={id} rounds={rounds} />

      <div className="flex justify-end">
        <DeleteApplicationButton id={id} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/(app)/application-tracker/[id]
git commit -m "feat: add Application Tracker detail/edit page"
```

---

### Task 16: Dashboard integration

**Files:**
- Modify: `src/app/[locale]/(app)/dashboard/page.tsx`
- Modify: `messages/id.json`, `messages/en.json`

**Interfaces:**
- Consumes: `db.application.count` (new Prisma model from Task 1).

- [ ] **Step 1: Add Application Tracker to the active module set**

In `src/app/[locale]/(app)/dashboard/page.tsx`, change:

```typescript
const moduleHrefs: (string | null)[] = [null, "/ats-check", "/resume-builder", null, "/cover-letter", null];
const ACTIVE_MODULE_INDICES = new Set([1, 2, 4]);
```

to:

```typescript
const moduleHrefs: (string | null)[] = [
  null,
  "/ats-check",
  "/resume-builder",
  null,
  "/cover-letter",
  "/application-tracker",
];
const ACTIVE_MODULE_INDICES = new Set([1, 2, 4, 5]);
```

- [ ] **Step 2: Fetch the application count and surface it as a module status**

In the `Promise.all` query batch, add a sixth query and destructure it:

```typescript
const [profile, resumeCount, atsCheckCount, coverLetterCount, recentChecks, applicationCount] =
  await Promise.all([
    db.profile.findUnique({ /* unchanged */ }),
    db.resumeDocument.count({ where: { userId: user.id } }),
    db.aTSCheckAnalysis.count({ where: { userId: user.id } }),
    db.coverLetter.count({ where: { userId: user.id } }),
    db.aTSCheckAnalysis.findMany({ /* unchanged */ }),
    db.application.count({ where: { userId: user.id } }),
  ]);
```

Add to `moduleStatuses`:

```typescript
5:
  applicationCount > 0
    ? t("applicationCountStatus", { count: applicationCount })
    : undefined,
```

- [ ] **Step 3: Add the new translation key**

In `messages/id.json`, inside `dashboard.moduleStatus`:

```json
"applicationCountStatus": "{count} lamaran dilacak"
```

In `messages/en.json`, inside `dashboard.moduleStatus`:

```json
"applicationCountStatus": "{count} applications tracked"
```

- [ ] **Step 4: Verify it typechecks and the JSON is valid**

Run: `npx tsc --noEmit`
Run: `python3 -c "import json; json.load(open('messages/id.json')); json.load(open('messages/en.json')); print('OK')"`
Expected: no errors, `OK`.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/(app)/dashboard/page.tsx messages/id.json messages/en.json
git commit -m "feat: surface Application Tracker as an active dashboard module"
```

---

### Task 17: Sidebar integration

**Files:**
- Modify: `src/components/layout/app-shell.tsx`

- [ ] **Step 1: Unlock the sidebar nav entry**

Change:

```typescript
const moduleRoutes: (string | null)[] = [null, "/ats-check", "/resume-builder", null, "/cover-letter", null];
```

to:

```typescript
const moduleRoutes: (string | null)[] = [
  null,
  "/ats-check",
  "/resume-builder",
  null,
  "/cover-letter",
  "/application-tracker",
];
```

(The icon at index 5 is already `ListChecks`, which fits an application tracker — no icon change needed.)

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/app-shell.tsx
git commit -m "feat: add Application Tracker to the sidebar"
```

---

### Task 18: Final verification

- [ ] **Step 1: Run the full automated suite**

Run: `npx tsc --noEmit`
Run: `npm run lint`
Run: `npm run test`
Run: `npm run build`
Expected: all four pass cleanly.

- [ ] **Step 2: Manual walkthrough**

Run: `npm run dev`, log in, then verify:
- `/application-tracker` shows the stats row and 7 empty columns.
- Creating an application via `/application-tracker/new` (with and without linking a Resume/Cover Letter) lands on its detail page.
- Dragging a card between columns updates its stage (refresh the page to confirm it persisted).
- On the detail page: editing fields auto-saves (`SaveStatus` shows "Tersimpan"); adding an interview round appears in the timeline; changing a round's outcome persists after refresh; deleting a round removes it.
- Deleting the application redirects to `/application-tracker` and the card is gone.
- Dashboard's "Lanjutkan" section now shows Application Tracker as a live card (not in "Segera Hadir" anymore); sidebar nav link works.
- Deleting a linked Resume or Cover Letter (from their own list pages) does not delete the Application — reload its detail page and confirm the picker shows "Tidak ada" instead of erroring.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final verification for Application Tracker"
```

(Only if Steps 1–2 required any fixes; otherwise there is nothing left to commit.)
