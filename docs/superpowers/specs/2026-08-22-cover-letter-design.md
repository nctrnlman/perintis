# Design Spec — Perintis: Cover Letter Generator

**Date**: 2026-08-22
**Status**: Approved for planning

## 1. Scope

A new module, `/cover-letter`, that lets a user generate an AI-drafted cover letter tailored to a specific job posting, save it per company/position for later reuse, edit it, and export it as PDF or Word (`.docx`).

Out of scope for this spec (future work): a formal `Application` entity linking Resume + CoverLetter + application status (this is the future Application Tracker module — deliberately deferred, see §2), and any change to the existing `ResumeDocument`/`Resume` models.

## 2. Data model

New standalone model, no relation to `Resume`/`ResumeDocument`:

```prisma
model CoverLetter {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  companyName    String
  positionTitle  String
  jobPostingText String
  tone           String   // "formal" | "casual"
  length         String   // "short" | "standard"
  bodyHtml       String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

Add `coverLetters CoverLetter[]` to `User`.

`bodyHtml` stores the letter body as an HTML string — the same convention as every other rich-text field in this codebase (`ResumeDocument.content` sub-fields), produced by the existing `RichTextEditor` component (`src/components/resume-builder/rich-text-editor.tsx`, already generic: `value`/`onChange` HTML string, `allowExtendedFormatting` toggle for bold/italic/list/strike/code/hr). No new editor component needed.

Decision, explicitly made and not revisited without a new discussion: company/position live directly on `CoverLetter` rather than on a shared `Application` entity. When the Application Tracker module is eventually specced, this data can be adopted/migrated then — building that abstraction now would be speculative.

## 3. Generation flow (single step)

`/cover-letter/new`: form with company name, position title, job posting text (textarea, same pattern as `/ats-check/new`), a tone toggle (Formal / Santai) and a length toggle (Singkat / Standar).

On submit, a server action:

1. Loads the current user's full `Profile` (summary, work experiences, education, skills, certifications, projects) — same snapshot approach Resume Builder already uses when creating a new resume.
2. Builds a prompt for Gemini via the existing `generateJson` helper (`src/lib/gemini.ts`), same call pattern as `enhanceBullets` (`src/lib/resume-builder/enhance-bullets.ts`).
3. Requests a JSON array of paragraph strings (not HTML) as the response shape.
4. Joins the paragraphs into `<p>...</p>` HTML to populate `bodyHtml`.
5. Creates the `CoverLetter` row immediately (fully populated, not a placeholder) and redirects to `/cover-letter/[id]`.

If generation fails (all Gemini fallback models exhausted, or an empty/malformed response): do **not** create a record. Surface an error toast and keep the user on `/cover-letter/new` so they can retry. This differs from the ATS Check upload flow, which still saves partial structural results on AI failure — there is no meaningful partial result here, since the AI-generated body is the entire point of the record.

### Prompt design (no-fabrication)

- Tone: `formal` (default) → instruct professional/formal language; `casual` → instruct a warmer but still respectful register.
- Length: `short` → target ~150–200 words, 2–3 paragraphs; `standard` → target ~250–350 words, 3–4 paragraphs. State the target word count explicitly in the prompt, not just the label.
- Letter language follows the language of the pasted job posting text, not the UI locale (a job posting in English should produce an English letter).
- The prompt includes the full relevant Profile snapshot and the job posting text, with an explicit, repeated instruction: only reference experience/skills/achievements present in the given Profile data, never invent metrics, employers, or accomplishments not present in the input. This mirrors the project's existing no-fabrication principle but is stated more forcefully than in `enhanceBullets`, since a cover letter is free-form narrative rather than a rewrite of existing bullets, so the model has more room to drift.
- An empty/minimal Profile is not blocked — generation proceeds with whatever data exists, consistent with how other AI features degrade gracefully rather than hard-failing.

## 4. List and editor pages

- `/cover-letter` — list page, same shape as `/resume-builder`: table (Company, Position, Date), search, a "Create Cover Letter" button linking to `/cover-letter/new`, per-row delete (ownership check via `userId`, same pattern as `deleteAtsCheckAnalysis`).
- `/cover-letter/[id]` — editor page: company name and position title as plain editable text fields, `RichTextEditor` (`allowExtendedFormatting=true`) bound to `bodyHtml`, Export PDF and Export Word buttons, delete action.
- Saving is debounced auto-save on change (same UX as Profile), not an explicit Save button.

## 5. PDF export

Reuses the existing pipeline directly: `bodyHtml` is already HTML, so the PDF template is `<Html>` (from `react-pdf-html`) wrapped in a simple `<Document>/<Page>` — header line with company/position/date, then the letter body. Structurally identical to `src/lib/resume-builder/pdf-template.tsx` but simpler (no repeated section structure). Route handler `GET /cover-letter/[id]/pdf` mirrors `src/app/[locale]/(app)/resume-builder/[id]/pdf/route.tsx`.

## 6. Word (.docx) export

No existing dependency in this project generates `.docx` files. Two approaches were considered:

- **Chosen: `docx` (dolanmiu/docx) + a small hand-written HTML→docx serializer.** `bodyHtml` only ever contains a narrow, self-produced tag set (`<p>`, `<strong>`, `<em>`, `<s>`, `<code>`, `<ul>/<ol>/<li>`, `<hr>`) because it only ever comes from this codebase's own `RichTextEditor`. A single function, `htmlToDocxParagraphs()`, parses that known-small tag set into `docx`'s `Paragraph`/`TextRun` objects. No HTML-parsing library is needed — the tag set is small and well-formed enough to walk directly. This is one new dependency (`docx`) and gives full control over styling to match the PDF output.
- **Rejected: `html-to-docx`.** Converts HTML to a `.docx` buffer in one call, less code to write, but is a less-actively-maintained third-party black box with less styling control, and its Node-runtime compatibility (this app has no edge-runtime routes doing file generation today) would need separate verification before relying on it.

Route handler `GET /cover-letter/[id]/docx` parallels the PDF route: load the record, run `htmlToDocxParagraphs(bodyHtml)`, build the `docx` `Document`, return the buffer with `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

## 7. i18n and design consistency

All new UI strings (form labels, table headers, buttons, toasts) go through `next-intl` (`messages/id.json` + `messages/en.json`) — no hardcoded copy. Visual style follows `docs/design-system.md`: hairline borders, generous whitespace, accent blue reserved for primary actions, no em dashes in copy.

## 8. Explicitly out of scope

- `Application` entity / Application Tracker integration.
- Regenerating the AI draft after creation. The AI draft is a one-time starting point produced at `/cover-letter/new`; after that, all changes happen through manual editing in `RichTextEditor` only. No "regenerate" action exists in the editor page.
- Multiple saved drafts/versions per cover letter (one record = one current version).
- Any change to `Resume`/`ResumeDocument` models or their export pipelines beyond being a styling/pattern reference.
