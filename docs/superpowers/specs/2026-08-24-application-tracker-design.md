# Design Spec — Perintis: Application Tracker

**Date**: 2026-08-24
**Status**: Approved for planning

## 1. Scope

A new module, `/application-tracker`, that lets a user log job applications, track them through a Kanban board by stage, log interview rounds per application, optionally link each application to a Resume Builder document and/or a Cover Letter already created in Perintis, and see basic win/loss statistics computed from their own data.

This is the module referenced (and deferred) in the Cover Letter design spec (`2026-08-22-cover-letter-design.md`, §1 and §8) as "the future Application Tracker module." It currently exists only as a "coming soon" placeholder tile in `messages/*.json` (`dashboard.modules[5]`), the dashboard's coming-soon strip, and the public `/features` index.

Out of scope for this spec (see §8 for full list): reminders/notifications, calendar sync, importing applications from external job boards, and any external benchmark data (e.g. "average win rate in Indonesia is X%") — all statistics are computed only from the signed-in user's own records.

## 2. Data model

Two new models, both scoped to the owning user through `Application.userId`:

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

Add reverse relations: `applications Application[]` on `User`, `ResumeDocument`, and `CoverLetter`.

Deleting a linked `ResumeDocument` or `CoverLetter` sets the FK to `null` (`onDelete: SetNull`) rather than deleting the `Application` — a user removing an old resume should not silently destroy their application history. Deleting an `Application` cascades to its `InterviewRound`s (`onDelete: Cascade`), since a round has no meaning without its parent application.

`stage` transitions are user-driven (drag-and-drop or a manual picker) with no enforced state machine — a real hiring process is not strictly linear (an application can be rejected straight after `APPLIED`, or after several interview rounds), so the schema does not attempt to validate allowed transitions.

`label` on `InterviewRound` is freeform text (e.g. "Wawancara HR", "Tes Teknis", "Wawancara User") rather than an enum, because round names and structure vary by company — this is where the HR/assessment/user-interview granularity the user asked for actually lives, without bloating the Kanban board's column count.

## 3. Kanban board (`/application-tracker`)

One column per `ApplicationStage` value (7 columns: Wishlist, Applied, Interviewing, Offer, Accepted, Rejected, Withdrawn), horizontally scrollable on narrow viewports — the same pattern used by Trello/Linear-style boards, not a Perintis-specific novelty.

Each card shows: company name, position title, a small chip if a Resume and/or Cover Letter is linked, and an interview-round count badge if any rounds have been logged. Dragging a card to another column updates `stage` via a server action; there is no confirmation dialog for stage changes (low-stakes, reversible by dragging back).

New dependency: **`@dnd-kit/core`** (+ `@dnd-kit/sortable` for column reordering of cards) — this codebase has no drag-and-drop library today. `@dnd-kit` is chosen over `react-beautiful-dnd` because the latter is unmaintained; `@dnd-kit` is the current standard for accessible React DnD (keyboard support, screen-reader announcements built in).

A stats row (see §5) renders above the board.

The "Create Application" entry point opens `/application-tracker/new`: a form with company name, position title, stage (defaults to `APPLIED`), job URL (optional), location (optional), and optional Resume/Cover Letter pickers (dropdowns populated from `db.resumeDocument.findMany({ where: { userId } })` / `db.coverLetter.findMany({ where: { userId } })`, following the same ownership-scoped query pattern used everywhere else in this codebase). `appliedAt` is set to the creation timestamp automatically when the chosen stage is `APPLIED` or later, and left `null` for `WISHLIST` (not yet applied) — there is no separate date input on the create form.

## 4. Detail page (`/application-tracker/[id]`)

Same `encryptId`/`decryptId` route-param pattern as `/cover-letter/[id]`. Contains:

- Editable fields: company name, position title, stage, job URL, location, notes, and `appliedAt` (a plain date field — lets a user log a `WISHLIST` entry now and fill in the real applied date later, or correct it) (debounced auto-save, same UX as Profile and the Cover Letter editor — no explicit Save button). Moving the stage picker from `WISHLIST` to `APPLIED` or later auto-fills `appliedAt` with the current date if it is still `null`, but does not overwrite an already-set date.
- Resume/Cover Letter link pickers (same dropdowns as the create form, can be changed or cleared after creation).
- Interview round timeline: an ordered list of `InterviewRound`s (oldest first), each showing label, scheduled date, outcome (Pending/Passed/Failed as a small status pill), and notes. "Add round" opens an inline form (label + optional date + notes; outcome starts at `PENDING` and is edited from the list afterward). Rounds can be deleted individually.
- Delete Application button, same confirmation pattern as `DeleteCoverLetterButton`.

## 5. Statistics

A compact stats row above the Kanban board (not a separate page — keeps it visible where the user is already looking), computed entirely from the signed-in user's own `Application` records:

- **Total applications** — count of all records.
- **Active pipeline** — count where `stage` is not one of `ACCEPTED`/`REJECTED`/`WITHDRAWN`.
- **Win rate** — `ACCEPTED ÷ (ACCEPTED + REJECTED)`, counting only decided applications (excludes `WITHDRAWN` and anything still active, since those haven't reached an outcome). Renders as "—" rather than a misleading 0% when the denominator is 0.
- **Interview conversion** — applications whose `stage` is `INTERVIEWING`, `OFFER`, `ACCEPTED`, or `REJECTED`, divided by all applications whose `stage` is not `WISHLIST` (i.e. were actually submitted). Based on `stage` alone, not on whether any `InterviewRound` has been logged — a user can advance a card to `INTERVIEWING` without bothering to log round-by-round detail, and the stat should still count it.

All four numbers are pure functions of the user's own `Application[]`/`InterviewRound[]` data — no external or industry benchmark numbers are introduced anywhere in this feature, consistent with this project's no-fabrication principle applied throughout the rest of the site.

## 6. Integration touch points

- `messages/id.json` + `messages/en.json`: new `applicationTracker.*` namespace (list/board copy, form labels, stage names, round outcome labels, stats labels), following the structure of the existing `coverLetter`/`resumeBuilder` namespaces. `dashboard.modules[5]` gains a `steps` array (it currently has none, since it's coming-soon) so it renders like the other three active features on the dashboard's "Lanjutkan" section.
- `src/app/[locale]/(app)/dashboard/page.tsx`: `ACTIVE_MODULE_INDICES` gains `5`; `moduleHrefs[5]` becomes `/application-tracker`; `moduleStatuses[5]` reports application count once the action exists to fetch it.
- `src/app/[locale]/(marketing)/features/page.tsx`: same "coming soon" badge removed for this module (`moduleHrefs[5]` set to `/features/application-tracker` if a public feature-landing page is added — see §8, deferred).
- `src/components/layout/app-shell.tsx`: new sidebar nav entry pointing at `/application-tracker`.

## 7. Testing

Per this project's TDD convention for pure logic: the four statistics calculations (§5) are extracted into a pure function (e.g. `computeApplicationStats(applications, interviewRounds)`) in `src/lib/application-tracker/stats.ts` with a paired `.test.ts`, covering the zero-denominator cases explicitly. Server actions (create/update/delete Application, add/update/delete InterviewRound, stage-change) get ownership-check test coverage matching the existing `deleteCoverLetter`-style pattern (reject when `userId` doesn't match).

Kanban drag-and-drop interaction itself is not unit-tested (no existing precedent for interaction-testing in this codebase — verified manually per this project's established workflow of `npm run dev` + manual walkthrough before considering a feature done).

## 8. Explicitly out of scope

- Reminders/notifications (e.g. "follow up in 7 days").
- Calendar integration for interview scheduling.
- Importing applications from LinkedIn/job boards.
- A public `/features/application-tracker` marketing landing page (can be added later following the existing `features/ats-check`-style pattern; not required for the tracker itself to function).
- Any external/industry benchmark statistic — every number in §5 is derived solely from the signed-in user's own data.
- Enforcing valid stage transitions (e.g. blocking a drag from `WISHLIST` straight to `ACCEPTED`) — fully user-driven, no state machine validation.
