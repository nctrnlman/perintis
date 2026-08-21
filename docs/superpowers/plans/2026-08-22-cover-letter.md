# Cover Letter Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `/cover-letter` module that generates an AI-drafted, no-fabrication cover letter from a user's Profile and a pasted job posting, saves it per company/position for later reuse and editing, and exports it as PDF or Word (`.docx`).

**Architecture:** Standalone `CoverLetter` Prisma model (no relation to `Resume`/`ResumeDocument`). A single-step generate flow (`/cover-letter/new` → server action calls Gemini → creates the record → redirects to the editor). The editor reuses the existing generic `RichTextEditor` and `useAutoSaveForm` hook exactly as Profile does. PDF export reuses `react-pdf-html` directly against the stored HTML body. Word export runs the same HTML through a small hand-written parser (`parseBlocks`) into `docx` library objects — no HTML-parsing dependency needed because the HTML only ever comes from this codebase's own editor.

**Tech Stack:** Next.js 16 App Router, Prisma 6, Zod, `@google/genai` (via the existing `generateJson` helper), `@react-pdf/renderer` + `react-pdf-html` (existing), `docx` (new dependency), Vitest, next-intl.

**Spec:** `docs/superpowers/specs/2026-08-22-cover-letter-design.md`

## Global Constraints

- Every user-facing string goes through `next-intl` (`messages/en.json` + `messages/id.json`) — no hardcoded copy, no em dashes in any copy.
- Every server action checks `supabase.auth.getUser()` first and every record read/write re-checks `existing.userId === user.id` before mutating — same ownership pattern as every other action file in this codebase.
- Route params are encrypted IDs: `encryptId`/`decryptId` from `@/lib/id-crypto`, never raw database IDs in URLs.
- AI generation must never fabricate experience/skills/achievements not present in the given Profile data — this instruction must appear explicitly in the prompt.
- Gemini calls only ever go through the existing `generateJson` helper (`@/lib/gemini`) — never call `@google/genai` directly. Do not override `thinkingBudget` (default `128` already satisfies the "small positive number" constraint).
- `docx` is a new dependency; it does not exist in `package.json` yet.
- After the Prisma migration in Task 1, the dev server must be restarted before any task that imports `db.coverLetter` — Node does not hot-reload the generated Prisma Client (`src/generated/prisma`).
- Test command is `npm run test` (`vitest run`); no vitest config file exists in this repo, tests run zero-config the same way the existing `src/lib/**/*.test.ts` files do.

---

### Task 1: Prisma schema — `CoverLetter` model

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `db.coverLetter` (Prisma Client model delegate) with fields `id, userId, companyName, positionTitle, jobPostingText, tone, length, bodyHtml, createdAt, updatedAt`, used by every later task.

- [ ] **Step 1: Add the `CoverLetter` model and the `User` relation**

In `prisma/schema.prisma`, add `coverLetters CoverLetter[]` to the `User` model (alongside the existing `resumeDocuments ResumeDocument[]` line):

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  oauthProvider String?
  createdAt     DateTime @default(now())

  profile         Profile?
  resumes         Resume[]
  atsChecks       ATSCheckAnalysis[]
  resumeDocuments ResumeDocument[]
  coverLetters    CoverLetter[]
}
```

Then append this new model at the end of the file, after `ATSCheckAnalysis`:

```prisma
model CoverLetter {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  companyName    String
  positionTitle  String
  jobPostingText String
  tone           String
  length         String
  bodyHtml       String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

- [ ] **Step 2: Run the migration**

Run: `npx prisma migrate dev --name add_cover_letter`
Expected: A new directory appears under `prisma/migrations/` and the command prints "Your database is now in sync with your schema." The Prisma Client is regenerated automatically as part of this command.

- [ ] **Step 3: Restart the dev server if it's running**

The generated client at `src/generated/prisma` does not hot-reload. If `npm run dev` is running in another terminal, restart it now so `db.coverLetter` is available in later tasks.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add CoverLetter Prisma model"
```

---

### Task 2: Zod validation schemas

**Files:**
- Create: `src/lib/validations/cover-letter.ts`
- Test: `src/lib/validations/cover-letter.test.ts`

**Interfaces:**
- Produces: `generateCoverLetterSchema`, `type GenerateCoverLetterInput`, `updateCoverLetterSchema`, `type UpdateCoverLetterInput` — consumed by Task 9 (server actions) and Task 4 (prompt builder types).

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/validations/cover-letter.test.ts
import { describe, expect, it } from "vitest";
import { generateCoverLetterSchema, updateCoverLetterSchema } from "./cover-letter";

describe("generateCoverLetterSchema", () => {
  it("accepts valid input", () => {
    const result = generateCoverLetterSchema.safeParse({
      companyName: "Acme Corp",
      positionTitle: "Software Engineer",
      jobPostingText: "We are looking for a software engineer...",
      tone: "formal",
      length: "standard",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty company name", () => {
    const result = generateCoverLetterSchema.safeParse({
      companyName: "",
      positionTitle: "Software Engineer",
      jobPostingText: "We are looking for...",
      tone: "formal",
      length: "standard",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown tone value", () => {
    const result = generateCoverLetterSchema.safeParse({
      companyName: "Acme Corp",
      positionTitle: "Software Engineer",
      jobPostingText: "We are looking for...",
      tone: "sarcastic",
      length: "standard",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown length value", () => {
    const result = generateCoverLetterSchema.safeParse({
      companyName: "Acme Corp",
      positionTitle: "Software Engineer",
      jobPostingText: "We are looking for...",
      tone: "formal",
      length: "very-long",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCoverLetterSchema", () => {
  it("accepts valid input, including an empty bodyHtml (user cleared the editor)", () => {
    const result = updateCoverLetterSchema.safeParse({
      companyName: "Acme Corp",
      positionTitle: "Software Engineer",
      bodyHtml: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty position title", () => {
    const result = updateCoverLetterSchema.safeParse({
      companyName: "Acme Corp",
      positionTitle: "",
      bodyHtml: "<p>Hello</p>",
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/validations/cover-letter.test.ts`
Expected: FAIL — `Cannot find module './cover-letter'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/validations/cover-letter.ts
import { z } from "zod";

export const generateCoverLetterSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  positionTitle: z.string().min(1, "Posisi wajib diisi"),
  jobPostingText: z.string().min(1, "Deskripsi lowongan wajib diisi"),
  tone: z.enum(["formal", "casual"]),
  length: z.enum(["short", "standard"]),
});

export type GenerateCoverLetterInput = z.infer<typeof generateCoverLetterSchema>;

export const updateCoverLetterSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  positionTitle: z.string().min(1, "Posisi wajib diisi"),
  bodyHtml: z.string(),
});

export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/validations/cover-letter.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/cover-letter.ts src/lib/validations/cover-letter.test.ts
git commit -m "feat: add cover letter Zod validation schemas"
```

---

### Task 3: Pure function — Profile-to-prompt-context serializer

**Files:**
- Create: `src/lib/cover-letter/build-profile-context.ts`
- Test: `src/lib/cover-letter/build-profile-context.test.ts`

**Interfaces:**
- Consumes: `stripHtml(html: string): string` from `@/lib/resume-builder/strip-html` (existing).
- Produces: `buildProfileContext(profile: ProfileContextInput): string`, `type ProfileContextInput` — consumed by Task 9 (server action).

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/cover-letter/build-profile-context.test.ts
import { describe, expect, it } from "vitest";
import { buildProfileContext } from "./build-profile-context";

const PROFILE_FIXTURE = {
  summary: "<p>Software engineer with 5 years of experience.</p>",
  targetRole: "Senior Software Engineer",
  targetIndustry: "Fintech",
  workExperiences: [
    {
      title: "Software Engineer",
      company: "Acme",
      startDate: new Date("2021-01-15"),
      endDate: null,
      description: "<p>Built the payments service.</p><p>Led a team of 3.</p>",
    },
  ],
  educations: [
    { institution: "Universitas Indonesia", degree: "S1", fieldOfStudy: "Ilmu Komputer" },
  ],
  skills: [{ name: "TypeScript" }, { name: "PostgreSQL" }],
  certifications: [{ name: "AWS Certified Developer", issuer: "Amazon" }],
  projects: [{ name: "Internal Tooling", role: "Lead", bullets: ["Cut deploy time by half"] }],
};

describe("buildProfileContext", () => {
  it("includes the target role and industry", () => {
    const result = buildProfileContext(PROFILE_FIXTURE);
    expect(result).toContain("Senior Software Engineer / Fintech");
  });

  it("strips HTML from the summary", () => {
    const result = buildProfileContext(PROFILE_FIXTURE);
    expect(result).toContain("Software engineer with 5 years of experience.");
    expect(result).not.toContain("<p>");
  });

  it("formats work experience with year range and stripped description lines", () => {
    const result = buildProfileContext(PROFILE_FIXTURE);
    expect(result).toContain("Software Engineer at Acme (2021-Present)");
    expect(result).toContain("Built the payments service.");
    expect(result).toContain("Led a team of 3.");
  });

  it("formats education, skills, certifications, and projects", () => {
    const result = buildProfileContext(PROFILE_FIXTURE);
    expect(result).toContain("S1 Ilmu Komputer at Universitas Indonesia");
    expect(result).toContain("Skills: TypeScript, PostgreSQL");
    expect(result).toContain("AWS Certified Developer (Amazon)");
    expect(result).toContain("Internal Tooling (Lead)");
    expect(result).toContain("Cut deploy time by half");
  });

  it("omits empty sections instead of printing empty headers", () => {
    const result = buildProfileContext({
      summary: null,
      targetRole: null,
      targetIndustry: null,
      workExperiences: [],
      educations: [],
      skills: [],
      certifications: [],
      projects: [],
    });
    expect(result).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/cover-letter/build-profile-context.test.ts`
Expected: FAIL — `Cannot find module './build-profile-context'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/cover-letter/build-profile-context.ts
// NOTE: this codebase's vitest runs zero-config and does not resolve the "@/"
// tsconfig path alias (confirmed during execution — every existing tested
// file uses relative imports only). Any file reachable from a test must use
// relative imports, not "@/".
import { stripHtml } from "../resume-builder/strip-html";

export interface ProfileContextInput {
  summary: string | null;
  targetRole: string | null;
  targetIndustry: string | null;
  workExperiences: {
    title: string;
    company: string;
    startDate: Date;
    endDate: Date | null;
    description: string | null;
  }[];
  educations: { institution: string; degree: string | null; fieldOfStudy: string | null }[];
  skills: { name: string }[];
  certifications: { name: string; issuer: string }[];
  projects: { name: string; role: string | null; bullets: string[] }[];
}

function descriptionLines(description: string | null): string[] {
  return stripHtml(description ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildProfileContext(profile: ProfileContextInput): string {
  const parts: string[] = [];

  if (profile.targetRole || profile.targetIndustry) {
    parts.push(
      `Target role: ${[profile.targetRole, profile.targetIndustry].filter(Boolean).join(" / ")}`
    );
  }

  if (profile.summary) {
    parts.push(`Summary: ${stripHtml(profile.summary)}`);
  }

  if (profile.workExperiences.length > 0) {
    const entries = profile.workExperiences
      .map((exp) => {
        const startYear = exp.startDate.getFullYear();
        const endYear = exp.endDate ? exp.endDate.getFullYear() : "Present";
        const lines = descriptionLines(exp.description);
        const detail = lines.length > 0 ? `\n  - ${lines.join("\n  - ")}` : "";
        return `- ${exp.title} at ${exp.company} (${startYear}-${endYear})${detail}`;
      })
      .join("\n");
    parts.push(`Work experience:\n${entries}`);
  }

  if (profile.educations.length > 0) {
    const entries = profile.educations
      .map((ed) =>
        `- ${[ed.degree, ed.fieldOfStudy].filter(Boolean).join(" ")} at ${ed.institution}`.trim()
      )
      .join("\n");
    parts.push(`Education:\n${entries}`);
  }

  if (profile.skills.length > 0) {
    parts.push(`Skills: ${profile.skills.map((s) => s.name).join(", ")}`);
  }

  if (profile.certifications.length > 0) {
    parts.push(
      `Certifications: ${profile.certifications.map((c) => `${c.name} (${c.issuer})`).join(", ")}`
    );
  }

  if (profile.projects.length > 0) {
    const entries = profile.projects
      .map((p) => {
        const bullets = p.bullets.filter(Boolean);
        const detail = bullets.length > 0 ? `\n  - ${bullets.join("\n  - ")}` : "";
        return `- ${p.name}${p.role ? ` (${p.role})` : ""}${detail}`;
      })
      .join("\n");
    parts.push(`Projects:\n${entries}`);
  }

  return parts.join("\n\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/cover-letter/build-profile-context.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/cover-letter/build-profile-context.ts src/lib/cover-letter/build-profile-context.test.ts
git commit -m "feat: add Profile-to-prompt-context serializer for cover letters"
```

---

### Task 4: Pure functions — prompt builder

**Files:**
- Create: `src/lib/cover-letter/prompt.ts`
- Test: `src/lib/cover-letter/prompt.test.ts`

**Interfaces:**
- Produces: `buildCoverLetterPrompt(input: BuildCoverLetterPromptInput): string`, `type BuildCoverLetterPromptInput` — consumed by Task 6 (`generateCoverLetterBody`).

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/cover-letter/prompt.test.ts
import { describe, expect, it } from "vitest";
import { buildCoverLetterPrompt } from "./prompt";

const BASE_INPUT = {
  companyName: "Acme Corp",
  positionTitle: "Software Engineer",
  jobPostingText: "We are looking for a software engineer with React experience.",
  tone: "formal" as const,
  length: "standard" as const,
  fullName: "Budi Santoso",
  profileContext: "Skills: TypeScript, React",
};

describe("buildCoverLetterPrompt", () => {
  it("includes the company name, position, and job posting text", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("Acme Corp");
    expect(prompt).toContain("Software Engineer");
    expect(prompt).toContain("We are looking for a software engineer with React experience.");
  });

  it("includes the no-fabrication hard rule", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("Never invent metrics, employers, job titles, or accomplishments");
  });

  it("includes a formal tone instruction for tone=formal", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("formal and professional");
  });

  it("includes a casual tone instruction for tone=casual", () => {
    const prompt = buildCoverLetterPrompt({ ...BASE_INPUT, tone: "casual" });
    expect(prompt).toContain("warm");
  });

  it("includes the short word-count target for length=short", () => {
    const prompt = buildCoverLetterPrompt({ ...BASE_INPUT, length: "short" });
    expect(prompt).toContain("150-200 words");
  });

  it("includes the standard word-count target for length=standard", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("250-350 words");
  });

  it("references the candidate's name when provided", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("Budi Santoso");
  });

  it("falls back to a nameless closing instruction when fullName is null", () => {
    const prompt = buildCoverLetterPrompt({ ...BASE_INPUT, fullName: null });
    expect(prompt).toContain("without a name");
  });

  it("includes the profile context block", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("Skills: TypeScript, React");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/cover-letter/prompt.test.ts`
Expected: FAIL — `Cannot find module './prompt'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/cover-letter/prompt.ts
export type CoverLetterTone = "formal" | "casual";
export type CoverLetterLength = "short" | "standard";

function toneInstruction(tone: CoverLetterTone): string {
  return tone === "casual"
    ? "Use a warm, personable tone, while staying respectful and professional."
    : "Use a formal and professional tone.";
}

function lengthInstruction(length: CoverLetterLength): string {
  return length === "short"
    ? "Target length: 150-200 words, 2-3 paragraphs."
    : "Target length: 250-350 words, 3-4 paragraphs.";
}

export interface BuildCoverLetterPromptInput {
  companyName: string;
  positionTitle: string;
  jobPostingText: string;
  tone: CoverLetterTone;
  length: CoverLetterLength;
  fullName: string | null;
  profileContext: string;
}

export function buildCoverLetterPrompt(input: BuildCoverLetterPromptInput): string {
  const closingInstruction = input.fullName
    ? `End with a polite closing line and the candidate's name, "${input.fullName}".`
    : "End with a polite closing line, without a name (the candidate's name is not available).";

  return `Write a complete cover letter for the position "${input.positionTitle}" at "${input.companyName}", based on the candidate profile data and the job posting below.

${toneInstruction(input.tone)}
${lengthInstruction(input.length)}
Write the letter in the same language as the job posting text below.
Start with a greeting addressed to the hiring team at "${input.companyName}".
${closingInstruction}

Hard rules:
- Only reference experience, skills, and achievements that are explicitly present in the candidate profile data below.
- Never invent metrics, employers, job titles, or accomplishments not present in the input.
- Return each paragraph as a separate string in the array, in the order they should appear (the greeting is its own paragraph, the closing is its own paragraph).

Candidate profile:
${input.profileContext}

Job posting:
${input.jobPostingText}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/cover-letter/prompt.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/cover-letter/prompt.ts src/lib/cover-letter/prompt.test.ts
git commit -m "feat: add cover letter prompt builder"
```

---

### Task 5: Pure function — paragraphs to HTML

**Files:**
- Create: `src/lib/cover-letter/paragraphs-to-html.ts`
- Test: `src/lib/cover-letter/paragraphs-to-html.test.ts`

**Interfaces:**
- Produces: `paragraphsToHtml(paragraphs: string[]): string` — consumed by Task 9 (server action).

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/cover-letter/paragraphs-to-html.test.ts
import { describe, expect, it } from "vitest";
import { paragraphsToHtml } from "./paragraphs-to-html";

describe("paragraphsToHtml", () => {
  it("wraps each paragraph in a <p> tag", () => {
    expect(paragraphsToHtml(["First paragraph.", "Second paragraph."])).toBe(
      "<p>First paragraph.</p><p>Second paragraph.</p>"
    );
  });

  it("trims whitespace and drops empty paragraphs", () => {
    expect(paragraphsToHtml(["  Hello.  ", "", "   "])).toBe("<p>Hello.</p>");
  });

  it("escapes HTML special characters", () => {
    expect(paragraphsToHtml(["R&D team, <script> included."])).toBe(
      "<p>R&amp;D team, &lt;script&gt; included.</p>"
    );
  });

  it("returns an empty string for an empty array", () => {
    expect(paragraphsToHtml([])).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/cover-letter/paragraphs-to-html.test.ts`
Expected: FAIL — `Cannot find module './paragraphs-to-html'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/cover-letter/paragraphs-to-html.ts
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function paragraphsToHtml(paragraphs: string[]): string {
  return paragraphs
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/cover-letter/paragraphs-to-html.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/cover-letter/paragraphs-to-html.ts src/lib/cover-letter/paragraphs-to-html.test.ts
git commit -m "feat: add paragraphs-to-HTML converter for cover letters"
```

---

### Task 6: AI wrapper — `generateCoverLetterBody`

**Files:**
- Create: `src/lib/cover-letter/generate-letter.ts`

No test file: this function's only logic beyond the pure prompt builder (already tested in Task 4) is a live call to `generateJson`, which hits the network. This matches the existing precedent in this codebase — `src/lib/resume-builder/enhance-bullets.ts`, which has the same shape and no test file — the surrounding pure functions carry the test coverage.

**Interfaces:**
- Consumes: `generateJson` from `@/lib/gemini` (existing), `buildCoverLetterPrompt` and types from `./prompt` (Task 4).
- Produces: `generateCoverLetterBody(input: GenerateCoverLetterBodyInput): Promise<string[]>` — consumed by Task 9 (server action). Throws on empty/malformed Gemini response (caller must catch).

- [ ] **Step 1: Write the implementation**

```typescript
// src/lib/cover-letter/generate-letter.ts
import { Type } from "@google/genai";
import { generateJson } from "@/lib/gemini";
import { buildCoverLetterPrompt, type CoverLetterLength, type CoverLetterTone } from "./prompt";

export interface GenerateCoverLetterBodyInput {
  companyName: string;
  positionTitle: string;
  jobPostingText: string;
  tone: CoverLetterTone;
  length: CoverLetterLength;
  fullName: string | null;
  profileContext: string;
}

export async function generateCoverLetterBody(
  input: GenerateCoverLetterBodyInput
): Promise<string[]> {
  const prompt = buildCoverLetterPrompt(input);

  const text = await generateJson({
    prompt,
    maxOutputTokens: 1024,
    schema: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  });

  const parsed = JSON.parse(text);
  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    !parsed.every((item) => typeof item === "string")
  ) {
    throw new Error("Malformed response shape from Gemini");
  }

  return parsed;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors referencing `generate-letter.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/cover-letter/generate-letter.ts
git commit -m "feat: add Gemini call wrapper for cover letter generation"
```

---

### Task 7: i18n — `coverLetter` namespace

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/id.json`

**Interfaces:**
- Produces: the `coverLetter` top-level namespace (`coverLetter.list.*`, `coverLetter.new.*`, `coverLetter.editor.*`, `coverLetter.autoSaving`/`autoSaved`/`autoSaveError`) — consumed by every UI task (10-14).

- [ ] **Step 1: Add the `coverLetter` namespace to `messages/en.json`**

Add this top-level key (alphabetically near `"ats"`/`"dashboard"`, matching the file's existing key ordering style — place it after the `"ats"` block):

```json
"coverLetter": {
  "list": {
    "title": "Cover Letter",
    "description": "Generate and save cover letters tailored to each job you apply to.",
    "empty": "No cover letters yet. Create your first one.",
    "newButton": "Create Cover Letter",
    "tableCompany": "Company",
    "tablePosition": "Position",
    "tableDate": "Last Updated",
    "searchPlaceholder": "Search by company...",
    "noResults": "No matching results.",
    "prevPage": "Previous",
    "nextPage": "Next",
    "pageInfo": "Page {page} of {totalPages}",
    "delete": "Delete",
    "toastDeleteSuccess": "Cover letter deleted",
    "toastDeleteError": "Failed to delete cover letter"
  },
  "new": {
    "title": "Create Cover Letter",
    "description": "Paste the job posting and we'll draft a cover letter from your Profile data.",
    "companyLabel": "Company Name",
    "positionLabel": "Position",
    "jobPostingLabel": "Job Posting",
    "jobPostingPlaceholder": "Paste the job posting text here...",
    "toneLabel": "Tone",
    "toneFormal": "Formal",
    "toneCasual": "Casual",
    "lengthLabel": "Length",
    "lengthShort": "Short",
    "lengthStandard": "Standard",
    "generating": "Drafting your cover letter...",
    "submit": "Generate Cover Letter",
    "toastGenerateSuccess": "Cover letter drafted",
    "toastGenerateErrorTitle": "Draft failed",
    "toastGenerateError": "Something went wrong. Please try again."
  },
  "editor": {
    "backToList": "Back to list",
    "detailsTitle": "Cover Letter",
    "companyLabel": "Company Name",
    "positionLabel": "Position",
    "bodyLabel": "Letter Body",
    "boldLabel": "Bold",
    "italicLabel": "Italic",
    "bulletListLabel": "Bullet List",
    "orderedListLabel": "Numbered List",
    "strikeLabel": "Strikethrough",
    "codeLabel": "Inline Code",
    "horizontalRuleLabel": "Horizontal Rule",
    "downloadPdfButton": "Download PDF",
    "downloadWordButton": "Download Word",
    "deleteButton": "Delete",
    "toastDeleteError": "Failed to delete cover letter"
  },
  "autoSaving": "Auto-saving...",
  "autoSaved": "Saved",
  "autoSaveError": "Failed to save"
}
```

- [ ] **Step 2: Add the matching `coverLetter` namespace to `messages/id.json`**

```json
"coverLetter": {
  "list": {
    "title": "Cover Letter",
    "description": "Buat dan simpan cover letter yang disesuaikan untuk setiap lowongan yang Anda lamar.",
    "empty": "Belum ada cover letter. Buat yang pertama.",
    "newButton": "Buat Cover Letter",
    "tableCompany": "Perusahaan",
    "tablePosition": "Posisi",
    "tableDate": "Terakhir Diperbarui",
    "searchPlaceholder": "Cari berdasarkan perusahaan...",
    "noResults": "Tidak ada hasil yang cocok.",
    "prevPage": "Sebelumnya",
    "nextPage": "Berikutnya",
    "pageInfo": "Halaman {page} dari {totalPages}",
    "delete": "Hapus",
    "toastDeleteSuccess": "Cover letter dihapus",
    "toastDeleteError": "Gagal menghapus cover letter"
  },
  "new": {
    "title": "Buat Cover Letter",
    "description": "Tempel deskripsi lowongan, kami akan susun draf cover letter dari data Profil Anda.",
    "companyLabel": "Nama Perusahaan",
    "positionLabel": "Posisi",
    "jobPostingLabel": "Deskripsi Lowongan",
    "jobPostingPlaceholder": "Tempel teks deskripsi lowongan di sini...",
    "toneLabel": "Nada",
    "toneFormal": "Formal",
    "toneCasual": "Santai",
    "lengthLabel": "Panjang",
    "lengthShort": "Singkat",
    "lengthStandard": "Standar",
    "generating": "Menyusun cover letter Anda...",
    "submit": "Buat Cover Letter",
    "toastGenerateSuccess": "Cover letter berhasil dibuat",
    "toastGenerateErrorTitle": "Gagal membuat draf",
    "toastGenerateError": "Terjadi kesalahan. Silakan coba lagi."
  },
  "editor": {
    "backToList": "Kembali ke daftar",
    "detailsTitle": "Cover Letter",
    "companyLabel": "Nama Perusahaan",
    "positionLabel": "Posisi",
    "bodyLabel": "Isi Surat",
    "boldLabel": "Tebal",
    "italicLabel": "Miring",
    "bulletListLabel": "Daftar Poin",
    "orderedListLabel": "Daftar Bernomor",
    "strikeLabel": "Coret",
    "codeLabel": "Kode Inline",
    "horizontalRuleLabel": "Garis Horizontal",
    "downloadPdfButton": "Unduh PDF",
    "downloadWordButton": "Unduh Word",
    "deleteButton": "Hapus",
    "toastDeleteError": "Gagal menghapus cover letter"
  },
  "autoSaving": "Menyimpan otomatis...",
  "autoSaved": "Tersimpan",
  "autoSaveError": "Gagal menyimpan"
}
```

- [ ] **Step 3: Validate both files are well-formed JSON**

Run: `python3 -c "import json; json.load(open('messages/en.json')); json.load(open('messages/id.json')); print('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/id.json
git commit -m "feat: add coverLetter i18n namespace"
```

---

### Task 8: Generalize `SaveStatus` to accept a namespace

**Files:**
- Modify: `src/components/profile/save-status.tsx`

The component is currently hardcoded to `useTranslations("profile")`, which only works for Profile. Task 13's editor needs the same auto-save indicator under the `coverLetter` namespace. This is a minimal, backward-compatible generalization (existing call sites need no changes since the new prop defaults to `"profile"`).

**Interfaces:**
- Consumes: `AutoSaveStatus` from `@/hooks/use-auto-save-form` (existing, unchanged).
- Produces: `SaveStatus({ status, namespace? }: SaveStatusProps)` — the `namespace` prop is new; consumed by Task 13.

- [ ] **Step 1: Add the `namespace` prop**

Replace the full contents of `src/components/profile/save-status.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import type { AutoSaveStatus } from "@/hooks/use-auto-save-form";

interface SaveStatusProps {
  status: AutoSaveStatus;
  namespace?: string;
}

export function SaveStatus({ status, namespace = "profile" }: SaveStatusProps) {
  const t = useTranslations(namespace);

  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        {t("autoSaving")}
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3.5" />
        {t("autoSaved")}
      </span>
    );
  }

  if (status === "error") {
    return <span className="text-xs text-destructive">{t("autoSaveError")}</span>;
  }

  return null;
}
```

- [ ] **Step 2: Verify the existing Profile call site still compiles**

Run: `npx tsc --noEmit`
Expected: No errors. `src/components/profile/personal-info-card.tsx` calls `<SaveStatus status={status} />` with no `namespace` prop, which now defaults to `"profile"` — identical runtime behavior to before.

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/save-status.tsx
git commit -m "refactor: generalize SaveStatus to accept a namespace prop"
```

---

### Task 9: Server actions

**Files:**
- Create: `src/app/[locale]/(app)/cover-letter/actions.ts`

**Interfaces:**
- Consumes: `generateCoverLetterSchema`/`updateCoverLetterSchema` (Task 2), `buildProfileContext` (Task 3), `generateCoverLetterBody` (Task 6), `paragraphsToHtml` (Task 5), `ensureProfileRecord` from `@/lib/ensure-profile` (existing), `encryptId` from `@/lib/id-crypto` (existing), `db.coverLetter` (Task 1).
- Produces: `generateCoverLetter(formData): Promise<{ token: string } | { error: string }>`, `updateCoverLetterFields(id, formData): Promise<{ success: true } | { error: string }>`, `deleteCoverLetter(id): Promise<{ success: true } | { error: string }>` — consumed by Tasks 10-13.

- [ ] **Step 1: Write the implementation**

```typescript
// src/app/[locale]/(app)/cover-letter/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { ensureProfileRecord } from "@/lib/ensure-profile";
import { generateCoverLetterSchema, updateCoverLetterSchema } from "@/lib/validations/cover-letter";
import { buildProfileContext } from "@/lib/cover-letter/build-profile-context";
import { generateCoverLetterBody } from "@/lib/cover-letter/generate-letter";
import { paragraphsToHtml } from "@/lib/cover-letter/paragraphs-to-html";

export async function generateCoverLetter(
  formData: FormData
): Promise<{ token: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const parsed = generateCoverLetterSchema.safeParse({
    companyName: formData.get("companyName") ?? "",
    positionTitle: formData.get("positionTitle") ?? "",
    jobPostingText: formData.get("jobPostingText") ?? "",
    tone: formData.get("tone") ?? "formal",
    length: formData.get("length") ?? "standard",
  });
  if (!parsed.success) return { error: "validation-failed" };

  await ensureProfileRecord(user.id);
  const profile = await db.profile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      workExperiences: { orderBy: { startDate: "desc" } },
      educations: { orderBy: { startDate: "desc" } },
      skills: { orderBy: { name: "asc" } },
      certifications: { orderBy: { issueDate: "desc" } },
      projects: { orderBy: { createdAt: "asc" } },
    },
  });

  const profileContext = buildProfileContext(profile);

  let paragraphs: string[];
  try {
    paragraphs = await generateCoverLetterBody({
      companyName: parsed.data.companyName,
      positionTitle: parsed.data.positionTitle,
      jobPostingText: parsed.data.jobPostingText,
      tone: parsed.data.tone,
      length: parsed.data.length,
      fullName: profile.fullName,
      profileContext,
    });
  } catch (err) {
    console.error("[cover-letter] Failed to generate letter:", err);
    return { error: "generation-failed" };
  }

  const coverLetter = await db.coverLetter.create({
    data: {
      userId: user.id,
      companyName: parsed.data.companyName,
      positionTitle: parsed.data.positionTitle,
      jobPostingText: parsed.data.jobPostingText,
      tone: parsed.data.tone,
      length: parsed.data.length,
      bodyHtml: paragraphsToHtml(paragraphs),
    },
  });

  return { token: encryptId(coverLetter.id) };
}

export async function updateCoverLetterFields(
  id: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.coverLetter.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  const parsed = updateCoverLetterSchema.safeParse({
    companyName: formData.get("companyName") ?? "",
    positionTitle: formData.get("positionTitle") ?? "",
    bodyHtml: formData.get("bodyHtml") ?? "",
  });
  if (!parsed.success) return { error: "validation-failed" };

  await db.coverLetter.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/cover-letter");
  return { success: true };
}

export async function deleteCoverLetter(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.coverLetter.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  await db.coverLetter.delete({ where: { id } });
  revalidatePath("/cover-letter");
  return { success: true };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors. (Requires Task 1's migration to have run so `db.coverLetter` exists on the generated client.)

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/cover-letter/actions.ts"
git commit -m "feat: add cover letter server actions"
```

---

### Task 10: Delete button component

**Files:**
- Create: `src/components/cover-letter/delete-cover-letter-button.tsx`

This mirrors `src/components/resume-builder/delete-resume-button.tsx` exactly (a row-level delete that stays on the list page, relying on `revalidatePath` to remove the row) — used only on the list page (Task 11). The editor page (Task 13) has its own delete handler that redirects afterward, since deleting from inside the record you're viewing needs different post-delete behavior.

**Interfaces:**
- Consumes: `deleteCoverLetter` from `../../app/[locale]/(app)/cover-letter/actions` (Task 9).
- Produces: `DeleteCoverLetterButton({ id }: { id: string })` — consumed by Task 11.

- [ ] **Step 1: Write the implementation**

```tsx
// src/components/cover-letter/delete-cover-letter-button.tsx
"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteCoverLetter } from "@/app/[locale]/(app)/cover-letter/actions";

export function DeleteCoverLetterButton({ id }: { id: string }) {
  const t = useTranslations("coverLetter.list");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCoverLetter(id);
      if ("error" in result) {
        toast.add({ title: t("toastDeleteError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastDeleteSuccess"), type: "success" });
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleDelete}
      disabled={isPending}
      aria-label={t("delete")}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/cover-letter/delete-cover-letter-button.tsx
git commit -m "feat: add cover letter delete button"
```

---

### Task 11: List page

**Files:**
- Create: `src/app/[locale]/(app)/cover-letter/page.tsx`

Mirrors `src/app/[locale]/(app)/resume-builder/page.tsx` structurally, with `CoverLetter` in place of `ResumeDocument` and a Company/Position/Date column layout instead of Title/Date.

**Interfaces:**
- Consumes: `DeleteCoverLetterButton` (Task 10), `db.coverLetter` (Task 1), existing shared components `DataTablePagination`/`DataTableSearch`/`DataTableSortLink`/`Table*` and `parseDirParam`/`parsePageParam`/`parseSortParam` from `@/lib/table-query` (all pre-existing, unchanged).
- Produces: the `/cover-letter` route.

- [ ] **Step 1: Write the implementation**

```tsx
// src/app/[locale]/(app)/cover-letter/page.tsx
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { DataTableSearch } from "@/components/shared/data-table-search";
import { DataTableSortLink } from "@/components/shared/data-table-sort-link";
import { DeleteCoverLetterButton } from "@/components/cover-letter/delete-cover-letter-button";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { parseDirParam, parsePageParam, parseSortParam } from "@/lib/table-query";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 10;
const SORT_KEYS = ["company", "date"] as const;

function toStr(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CoverLetterListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations("coverLetter.list");
  const format = await getFormatter();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = parsePageParam(toStr(params.page));
  const sort = parseSortParam(toStr(params.sort), SORT_KEYS, "date");
  const dir = parseDirParam(toStr(params.dir));
  const q = toStr(params.q) ?? "";

  const where: Prisma.CoverLetterWhereInput = {
    userId: user?.id ?? "__none__",
    ...(q ? { companyName: { contains: q, mode: "insensitive" } } : {}),
  };

  const orderBy: Prisma.CoverLetterOrderByWithRelationInput =
    sort === "company" ? { companyName: dir } : { updatedAt: dir };

  const [coverLetters, total] = user
    ? await Promise.all([
        db.coverLetter.findMany({
          where,
          orderBy,
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        db.coverLetter.count({ where }),
      ])
    : [[], 0];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rawSearchParams: Record<string, string | undefined> = {
    q: q || undefined,
    sort,
    dir,
  };

  const showEmptyState = total === 0 && !q;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/cover-letter/new">{t("newButton")}</Link>}
        />
      </div>

      {showEmptyState ? (
        <p className="mt-10 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="sm:w-64">
            <DataTableSearch defaultValue={q} placeholder={t("searchPlaceholder")} />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <DataTableSortLink
                    basePath="/cover-letter"
                    searchParams={rawSearchParams}
                    sortKey="company"
                    currentSort={sort}
                    currentDir={dir}
                    label={t("tableCompany")}
                  />
                </TableHead>
                <TableHead>{t("tablePosition")}</TableHead>
                <TableHead>
                  <DataTableSortLink
                    basePath="/cover-letter"
                    searchParams={rawSearchParams}
                    sortKey="date"
                    currentSort={sort}
                    currentDir={dir}
                    label={t("tableDate")}
                  />
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coverLetters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                coverLetters.map((letter) => (
                  <TableRow key={letter.id}>
                    <TableCell className="p-0">
                      <Link
                        href={`/cover-letter/${encryptId(letter.id)}`}
                        className="block truncate px-4 py-3 font-medium hover:underline"
                      >
                        {letter.companyName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {letter.positionTitle}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format.dateTime(letter.updatedAt, { dateStyle: "medium" })}
                    </TableCell>
                    <TableCell>
                      <DeleteCoverLetterButton id={letter.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <DataTablePagination
            basePath="/cover-letter"
            searchParams={rawSearchParams}
            page={page}
            totalPages={totalPages}
            prevLabel={t("prevPage")}
            nextLabel={t("nextPage")}
            pageInfo={t("pageInfo", { page, totalPages })}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Manual check**

Run: `npm run dev`, sign in, visit `/en/cover-letter` (or `/id/cover-letter`). Expected: empty state message and a "Create Cover Letter" button (no records exist yet).

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/cover-letter/page.tsx"
git commit -m "feat: add cover letter list page"
```

---

### Task 12: Create form page

**Files:**
- Create: `src/app/[locale]/(app)/cover-letter/new/page.tsx`

Structurally close to `src/app/[locale]/(app)/ats-check/new/page.tsx` (paste-JD-and-submit flow with `toast.promise`), plus company/position inputs and tone/length toggles. No existing `RadioGroup`/`ToggleGroup` primitive exists in `src/components/ui/`, so tone/length use small local toggle buttons (two buttons per group, active state via local component state) rather than introducing a new shared primitive for a single use site.

**Interfaces:**
- Consumes: `generateCoverLetter` from `../actions` (Task 9).
- Produces: the `/cover-letter/new` route.

- [ ] **Step 1: Write the implementation**

```tsx
// src/app/[locale]/(app)/cover-letter/new/page.tsx
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reveal } from "@/components/shared/reveal";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { generateCoverLetter } from "../actions";

type Tone = "formal" | "casual";
type Length = "short" | "standard";

export default function NewCoverLetterPage() {
  const t = useTranslations("coverLetter.new");
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [positionTitle, setPositionTitle] = useState("");
  const [jobPostingText, setJobPostingText] = useState("");
  const [tone, setTone] = useState<Tone>("formal");
  const [length, setLength] = useState<Length>("standard");
  const [isPending, startTransition] = useTransition();

  const canSubmit = Boolean(
    companyName.trim() && positionTitle.trim() && jobPostingText.trim()
  );

  function toggleClass(active: boolean) {
    return cn(
      "rounded-full border px-4 py-1.5 text-sm transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border text-muted-foreground hover:text-foreground"
    );
  }

  async function generate() {
    const formData = new FormData();
    formData.set("companyName", companyName);
    formData.set("positionTitle", positionTitle);
    formData.set("jobPostingText", jobPostingText);
    formData.set("tone", tone);
    formData.set("length", length);

    const result = await generateCoverLetter(formData);
    if ("error" in result) {
      throw new Error(t("toastGenerateError"));
    }
    return result;
  }

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      try {
        const result = await toast.promise(generate(), {
          loading: t("generating"),
          success: t("toastGenerateSuccess"),
          error: (err: Error) => ({
            title: t("toastGenerateErrorTitle"),
            description: err.message,
          }),
        });
        router.push(`/cover-letter/${result.token}`);
      } catch {
        // toast.promise already surfaced the error toast
      }
    });
  }

  return (
    <Reveal className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      <div className="mt-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">{t("companyLabel")}</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="positionTitle">{t("positionLabel")}</Label>
            <Input
              id="positionTitle"
              value={positionTitle}
              onChange={(e) => setPositionTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jobPostingText">{t("jobPostingLabel")}</Label>
          <Textarea
            id="jobPostingText"
            value={jobPostingText}
            onChange={(e) => setJobPostingText(e.target.value)}
            placeholder={t("jobPostingPlaceholder")}
            rows={8}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("toneLabel")}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={toggleClass(tone === "formal")}
                onClick={() => setTone("formal")}
              >
                {t("toneFormal")}
              </button>
              <button
                type="button"
                className={toggleClass(tone === "casual")}
                onClick={() => setTone("casual")}
              >
                {t("toneCasual")}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("lengthLabel")}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={toggleClass(length === "short")}
                onClick={() => setLength("short")}
              >
                {t("lengthShort")}
              </button>
              <button
                type="button"
                className={toggleClass(length === "standard")}
                onClick={() => setLength("standard")}
              >
                {t("lengthStandard")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={!canSubmit || isPending}
        onClick={handleSubmit}
      >
        {t("submit")}
      </Button>
    </Reveal>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Manual check**

Run: `npm run dev`, visit `/en/cover-letter/new`, fill in company/position/job posting, click "Generate Cover Letter". Expected: a loading toast, then either a success toast + redirect to `/en/cover-letter/[token]` (Task 13 must exist for the redirect target to render), or an error toast if `GEMINI_API_KEY` is not configured in the local environment — either outcome confirms the action is wired correctly.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/cover-letter/new/page.tsx"
git commit -m "feat: add cover letter create form page"
```

---

### Task 13: Editor page and client

**Files:**
- Create: `src/app/[locale]/(app)/cover-letter/[id]/page.tsx`
- Create: `src/app/[locale]/(app)/cover-letter/[id]/cover-letter-editor-client.tsx`

**Interfaces:**
- Consumes: `updateCoverLetterFields`, `deleteCoverLetter` from `../actions` (Task 9), `RichTextEditor` from `@/components/resume-builder/rich-text-editor` (existing, unchanged), `useAutoSaveForm` from `@/hooks/use-auto-save-form` (existing, unchanged), `SaveStatus` with `namespace` prop (Task 8), `decryptId` from `@/lib/id-crypto` (existing).
- Produces: the `/cover-letter/[id]` route. Links to `/cover-letter/[token]/pdf` (Task 14) and `/cover-letter/[token]/docx` (Task 17) — those routes don't exist yet at the end of this task, so the download buttons 404 until those tasks land; this is expected and resolved by Task 17.

- [ ] **Step 1: Write the server component**

```tsx
// src/app/[locale]/(app)/cover-letter/[id]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { CoverLetterEditorClient } from "./cover-letter-editor-client";

export default async function CoverLetterEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: token } = await params;

  const coverLetterId = decryptId(token);
  if (!coverLetterId) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const coverLetter = await db.coverLetter.findUnique({ where: { id: coverLetterId } });

  if (!coverLetter || coverLetter.userId !== user.id) {
    notFound();
  }

  return (
    <CoverLetterEditorClient
      id={coverLetter.id}
      token={token}
      initialCompanyName={coverLetter.companyName}
      initialPositionTitle={coverLetter.positionTitle}
      initialBodyHtml={coverLetter.bodyHtml}
    />
  );
}
```

- [ ] **Step 2: Write the client component**

```tsx
// src/app/[locale]/(app)/cover-letter/[id]/cover-letter-editor-client.tsx
"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { RichTextEditor } from "@/components/resume-builder/rich-text-editor";
import { SaveStatus } from "@/components/profile/save-status";
import { useAutoSaveForm } from "@/hooks/use-auto-save-form";
import { deleteCoverLetter, updateCoverLetterFields } from "../actions";

interface CoverLetterEditorClientProps {
  id: string;
  token: string;
  initialCompanyName: string;
  initialPositionTitle: string;
  initialBodyHtml: string;
}

export function CoverLetterEditorClient({
  id,
  token,
  initialCompanyName,
  initialPositionTitle,
  initialBodyHtml,
}: CoverLetterEditorClientProps) {
  const t = useTranslations("coverLetter.editor");
  const router = useRouter();
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml);
  const [isDeleting, startDeleteTransition] = useTransition();

  const save = useCallback(
    (formData: FormData) => updateCoverLetterFields(id, formData),
    [id]
  );
  const { formRef, status, handleChange } = useAutoSaveForm(save);

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteCoverLetter(id);
      if ("error" in result) {
        toast.add({ title: t("toastDeleteError"), type: "error" });
        return;
      }
      router.push("/cover-letter");
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/cover-letter" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; {t("backToList")}
        </Link>
      </div>

      <div className="rounded-2xl border border-border p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("detailsTitle")}</h2>
          <SaveStatus status={status} namespace="coverLetter" />
        </div>

        <form ref={formRef} onChange={handleChange} className="mt-6 space-y-6">
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
            <Label>{t("bodyLabel")}</Label>
            <RichTextEditor
              value={bodyHtml}
              onChange={(html) => {
                setBodyHtml(html);
                handleChange();
              }}
              boldLabel={t("boldLabel")}
              italicLabel={t("italicLabel")}
              bulletListLabel={t("bulletListLabel")}
              orderedListLabel={t("orderedListLabel")}
              strikeLabel={t("strikeLabel")}
              codeLabel={t("codeLabel")}
              horizontalRuleLabel={t("horizontalRuleLabel")}
              allowExtendedFormatting
            />
            <input type="hidden" name="bodyHtml" value={bodyHtml} readOnly />
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border p-6">
        <div className="flex gap-3">
          <Button
            variant="outline"
            render={<a href={`/cover-letter/${token}/pdf`} target="_blank" rel="noreferrer" />}
            nativeButton={false}
          >
            {t("downloadPdfButton")}
          </Button>
          <Button
            variant="outline"
            render={<a href={`/cover-letter/${token}/docx`} download />}
            nativeButton={false}
          >
            {t("downloadWordButton")}
          </Button>
        </div>
        <Button variant="ghost" onClick={handleDelete} disabled={isDeleting}>
          {t("deleteButton")}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Manual check**

With a cover letter already created (from Task 12's manual check), open `/en/cover-letter/[token]`. Expected: company/position fields and the rich-text body are editable, editing any field shows "Auto-saving..." then "Saved" (via `SaveStatus`), and both download buttons are visible (they will 404 until Tasks 14 and 17 land — that's expected here).

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(app)/cover-letter/[id]/page.tsx" "src/app/[locale]/(app)/cover-letter/[id]/cover-letter-editor-client.tsx"
git commit -m "feat: add cover letter editor page"
```

---

### Task 14: PDF export

**Files:**
- Create: `src/lib/cover-letter/pdf-template.tsx`
- Create: `src/app/[locale]/(app)/cover-letter/[id]/pdf/route.tsx`

**Interfaces:**
- Consumes: `decryptId` from `@/lib/id-crypto`, `db.coverLetter` (Task 1).
- Produces: `GET /cover-letter/[id]/pdf` — the PDF download link referenced by Task 13.

- [ ] **Step 1: Write the PDF template**

```tsx
// src/lib/cover-letter/pdf-template.tsx
import { Document, Page, StyleSheet, Text } from "@react-pdf/renderer";
import Html from "react-pdf-html";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#000000" },
  positionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  meta: { fontSize: 10, color: "#333333", marginBottom: 16 },
});

const richTextStyle = { fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 };
const richTextStylesheet = { p: { marginBottom: 10 } };

interface CoverLetterPdfProps {
  companyName: string;
  positionTitle: string;
  createdAt: Date;
  bodyHtml: string;
}

export function CoverLetterPdfDocument({
  companyName,
  positionTitle,
  createdAt,
  bodyHtml,
}: CoverLetterPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.positionTitle}>{positionTitle}</Text>
        <Text style={styles.meta}>
          {companyName} - {createdAt.toLocaleDateString("en-CA")}
        </Text>
        <Html style={richTextStyle} stylesheet={richTextStylesheet}>
          {bodyHtml}
        </Html>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Write the route handler**

```tsx
// src/app/[locale]/(app)/cover-letter/[id]/pdf/route.tsx
import { notFound } from "next/navigation";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { CoverLetterPdfDocument } from "@/lib/cover-letter/pdf-template";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: token } = await params;

  const coverLetterId = decryptId(token);
  if (!coverLetterId) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const coverLetter = await db.coverLetter.findUnique({ where: { id: coverLetterId } });

  if (!coverLetter || coverLetter.userId !== user.id) {
    notFound();
  }

  const buffer = await renderToBuffer(
    <CoverLetterPdfDocument
      companyName={coverLetter.companyName}
      positionTitle={coverLetter.positionTitle}
      createdAt={coverLetter.createdAt}
      bodyHtml={coverLetter.bodyHtml}
    />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${coverLetter.companyName}-cover-letter.pdf"`,
    },
  });
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Manual check**

From the editor page (Task 13), click "Download PDF". Expected: a PDF opens in a new tab showing the position title, company/date line, and the letter body.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cover-letter/pdf-template.tsx "src/app/[locale]/(app)/cover-letter/[id]/pdf/route.tsx"
git commit -m "feat: add cover letter PDF export"
```

---

### Task 15: Pure parser — HTML to block/inline structure

**Files:**
- Create: `src/lib/cover-letter/parse-rich-text.ts`
- Test: `src/lib/cover-letter/parse-rich-text.test.ts`

This is the core piece the Word export approach depends on: `bodyHtml` only ever contains the narrow tag set the `RichTextEditor` produces (`<p>`, `<strong>`, `<em>`, `<s>`, `<code>`, `<ul>/<ol>/<li>`, `<hr>`, where list items wrap their text in a nested `<p>` — see the `[&_li_p]:inline` CSS rule in `src/components/resume-builder/rich-text-editor.tsx`). This function walks that fixed grammar into a plain, framework-free data structure that Task 16 turns into `docx` objects.

**Interfaces:**
- Produces: `type InlineSegment`, `type Block`, `parseBlocks(html: string): Block[]` — consumed by Task 16.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/cover-letter/parse-rich-text.test.ts
import { describe, expect, it } from "vitest";
import { parseBlocks } from "./parse-rich-text";

describe("parseBlocks", () => {
  it("parses a plain paragraph into a single text segment", () => {
    expect(parseBlocks("<p>Hello world.</p>")).toEqual([
      {
        type: "paragraph",
        segments: [{ text: "Hello world.", bold: false, italic: false, strike: false, code: false }],
      },
    ]);
  });

  it("tracks bold, italic, strike, and code marks separately", () => {
    expect(
      parseBlocks("<p>Plain <strong>bold</strong> <em>italic</em> <s>struck</s> <code>code</code>.</p>")
    ).toEqual([
      {
        type: "paragraph",
        segments: [
          { text: "Plain ", bold: false, italic: false, strike: false, code: false },
          { text: "bold", bold: true, italic: false, strike: false, code: false },
          { text: " ", bold: false, italic: false, strike: false, code: false },
          { text: "italic", bold: false, italic: true, strike: false, code: false },
          { text: " ", bold: false, italic: false, strike: false, code: false },
          { text: "struck", bold: false, italic: false, strike: true, code: false },
          { text: " ", bold: false, italic: false, strike: false, code: false },
          { text: "code", bold: false, italic: false, strike: false, code: true },
          { text: ".", bold: false, italic: false, strike: false, code: false },
        ],
      },
    ]);
  });

  it("handles nested marks (bold + italic on the same text)", () => {
    expect(parseBlocks("<p><em><strong>both</strong></em></p>")).toEqual([
      {
        type: "paragraph",
        segments: [{ text: "both", bold: true, italic: true, strike: false, code: false }],
      },
    ]);
  });

  it("decodes HTML entities in text", () => {
    expect(parseBlocks("<p>R&amp;D &lt;team&gt;</p>")).toEqual([
      {
        type: "paragraph",
        segments: [{ text: "R&D <team>", bold: false, italic: false, strike: false, code: false }],
      },
    ]);
  });

  it("parses a bullet list into one bulletItem block per <li>, unwrapping the nested <p>", () => {
    expect(parseBlocks("<ul><li><p>First</p></li><li><p>Second</p></li></ul>")).toEqual([
      {
        type: "bulletItem",
        segments: [{ text: "First", bold: false, italic: false, strike: false, code: false }],
      },
      {
        type: "bulletItem",
        segments: [{ text: "Second", bold: false, italic: false, strike: false, code: false }],
      },
    ]);
  });

  it("parses an ordered list into numberedItem blocks", () => {
    expect(parseBlocks("<ol><li><p>Step one</p></li></ol>")).toEqual([
      {
        type: "numberedItem",
        segments: [{ text: "Step one", bold: false, italic: false, strike: false, code: false }],
      },
    ]);
  });

  it("parses a horizontal rule into its own block", () => {
    expect(parseBlocks("<p>Before</p><hr><p>After</p>")).toEqual([
      {
        type: "paragraph",
        segments: [{ text: "Before", bold: false, italic: false, strike: false, code: false }],
      },
      { type: "horizontalRule" },
      {
        type: "paragraph",
        segments: [{ text: "After", bold: false, italic: false, strike: false, code: false }],
      },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseBlocks("")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/cover-letter/parse-rich-text.test.ts`
Expected: FAIL — `Cannot find module './parse-rich-text'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/cover-letter/parse-rich-text.ts
export interface InlineSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  strike: boolean;
  code: boolean;
}

export type Block =
  | { type: "paragraph"; segments: InlineSegment[] }
  | { type: "bulletItem"; segments: InlineSegment[] }
  | { type: "numberedItem"; segments: InlineSegment[] }
  | { type: "horizontalRule" };

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  nbsp: " ",
};

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_match, name: string) => HTML_ENTITIES[name]);
}

const INLINE_MARK_TAGS: Record<string, keyof Omit<InlineSegment, "text">> = {
  strong: "bold",
  em: "italic",
  s: "strike",
  code: "code",
};

function parseInline(html: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const active = { bold: false, italic: false, strike: false, code: false };
  const tagRegex = /<(\/?)(strong|em|s|code)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  function pushText(raw: string) {
    const text = decodeHtmlEntities(raw);
    if (!text) return;
    segments.push({ text, ...active });
  }

  while ((match = tagRegex.exec(html)) !== null) {
    pushText(html.slice(lastIndex, match.index));
    const [, closing, tag] = match;
    active[INLINE_MARK_TAGS[tag]] = closing !== "/";
    lastIndex = tagRegex.lastIndex;
  }
  pushText(html.slice(lastIndex));

  return segments;
}

function parseListItems(html: string): string[] {
  const items: string[] = [];
  const itemRegex = /<li>([\s\S]*?)<\/li>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(html)) !== null) {
    items.push(match[1]);
  }
  return items;
}

function unwrapParagraph(html: string): string {
  const match = /^<p>([\s\S]*)<\/p>$/.exec(html.trim());
  return match ? match[1] : html;
}

export function parseBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const blockRegex = /<hr\s*\/?>|<(p|ul|ol)>([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const [full, tag, inner] = match;

    if (full.startsWith("<hr")) {
      blocks.push({ type: "horizontalRule" });
      continue;
    }

    if (tag === "p") {
      blocks.push({ type: "paragraph", segments: parseInline(inner) });
      continue;
    }

    const itemType = tag === "ul" ? "bulletItem" : "numberedItem";
    for (const item of parseListItems(inner)) {
      blocks.push({ type: itemType, segments: parseInline(unwrapParagraph(item)) });
    }
  }

  return blocks;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/cover-letter/parse-rich-text.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/cover-letter/parse-rich-text.ts src/lib/cover-letter/parse-rich-text.test.ts
git commit -m "feat: add pure HTML-to-block parser for cover letter Word export"
```

---

### Task 16: `htmlToDocxParagraphs`

**Files:**
- Modify: `package.json` (add `docx` dependency)
- Create: `src/lib/cover-letter/html-to-docx.ts`
- Test: `src/lib/cover-letter/html-to-docx.test.ts`

**Interfaces:**
- Consumes: `parseBlocks`, `type Block`, `type InlineSegment` from `./parse-rich-text` (Task 15).
- Produces: `htmlToDocxParagraphs(html: string): Paragraph[]` (from the `docx` package) — consumed by Task 17.

- [ ] **Step 1: Install the `docx` dependency**

Run: `npm install docx@^9.7.1`
Expected: `package.json` and `package-lock.json` are updated; `node_modules/docx` exists.

- [ ] **Step 2: Write the failing test**

Paragraph internals in `docx` aren't meant for deep equality assertions, so this test verifies structure at the boundary that matters: the right number of paragraphs comes out, and the whole thing renders to a non-empty `.docx` buffer without throwing for every supported construct (bold/italic/strike/code, bullet list, ordered list, horizontal rule).

```typescript
// src/lib/cover-letter/html-to-docx.test.ts
import { describe, expect, it } from "vitest";
import { Document, Packer, Paragraph } from "docx";
import { htmlToDocxParagraphs } from "./html-to-docx";

describe("htmlToDocxParagraphs", () => {
  it("returns one Paragraph per block", () => {
    const html = "<p>First.</p><p>Second.</p>";
    const result = htmlToDocxParagraphs(html);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeInstanceOf(Paragraph);
  });

  it("returns one Paragraph per list item", () => {
    const html = "<ul><li><p>A</p></li><li><p>B</p></li><li><p>C</p></li></ul>";
    expect(htmlToDocxParagraphs(html)).toHaveLength(3);
  });

  it("returns a Paragraph for a horizontal rule", () => {
    const html = "<p>Before</p><hr><p>After</p>";
    expect(htmlToDocxParagraphs(html)).toHaveLength(3);
  });

  it("renders a document containing every supported construct to a non-empty buffer", async () => {
    const html =
      "<p>Plain <strong>bold</strong> <em>italic</em> <s>struck</s> <code>code</code>.</p>" +
      "<ul><li><p>Bullet one</p></li><li><p>Bullet two</p></li></ul>" +
      "<ol><li><p>Step one</p></li><li><p>Step two</p></li></ol>" +
      "<hr>" +
      "<p>Closing paragraph.</p>";

    const document = new Document({
      sections: [{ children: htmlToDocxParagraphs(html) }],
    });

    const buffer = await Packer.toBuffer(document);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("returns an empty array for empty input", () => {
    expect(htmlToDocxParagraphs("")).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- src/lib/cover-letter/html-to-docx.test.ts`
Expected: FAIL — `Cannot find module './html-to-docx'`

- [ ] **Step 4: Write the implementation**

```typescript
// src/lib/cover-letter/html-to-docx.ts
import { BorderStyle, Paragraph, TextRun } from "docx";
import { parseBlocks, type Block, type InlineSegment } from "./parse-rich-text";

function segmentsToRuns(segments: InlineSegment[]): TextRun[] {
  return segments.map(
    (seg) =>
      new TextRun({
        text: seg.text,
        bold: seg.bold,
        italics: seg.italic,
        strike: seg.strike,
        font: seg.code ? "Courier New" : undefined,
      })
  );
}

function blockToParagraph(block: Block, numberedIndex: number): Paragraph {
  if (block.type === "horizontalRule") {
    return new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999" } },
    });
  }

  if (block.type === "bulletItem") {
    return new Paragraph({ children: segmentsToRuns(block.segments), bullet: { level: 0 } });
  }

  if (block.type === "numberedItem") {
    return new Paragraph({
      children: [new TextRun({ text: `${numberedIndex}. ` }), ...segmentsToRuns(block.segments)],
    });
  }

  return new Paragraph({ children: segmentsToRuns(block.segments) });
}

export function htmlToDocxParagraphs(html: string): Paragraph[] {
  const blocks = parseBlocks(html);
  let numberedIndex = 0;

  return blocks.map((block) => {
    numberedIndex = block.type === "numberedItem" ? numberedIndex + 1 : 0;
    return blockToParagraph(block, numberedIndex);
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/lib/cover-letter/html-to-docx.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/cover-letter/html-to-docx.ts src/lib/cover-letter/html-to-docx.test.ts
git commit -m "feat: add docx dependency and HTML-to-docx-Paragraph converter"
```

---

### Task 17: Word (.docx) export

**Files:**
- Create: `src/lib/cover-letter/docx-template.ts`
- Test: `src/lib/cover-letter/docx-template.test.ts`
- Create: `src/app/[locale]/(app)/cover-letter/[id]/docx/route.tsx`

**Interfaces:**
- Consumes: `htmlToDocxParagraphs` (Task 16), `decryptId` from `@/lib/id-crypto`, `db.coverLetter` (Task 1).
- Produces: `buildCoverLetterDocx(input: CoverLetterDocxInput): Document`, and `GET /cover-letter/[id]/docx` — the Word download link referenced by Task 13.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/cover-letter/docx-template.test.ts
import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import { buildCoverLetterDocx } from "./docx-template";

describe("buildCoverLetterDocx", () => {
  it("renders a complete cover letter document to a non-empty buffer", async () => {
    const document = buildCoverLetterDocx({
      companyName: "Acme Corp",
      positionTitle: "Software Engineer",
      createdAt: new Date("2026-08-22"),
      bodyHtml: "<p>Dear Hiring Team,</p><p>I am excited to apply.</p>",
    });

    const buffer = await Packer.toBuffer(document);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/cover-letter/docx-template.test.ts`
Expected: FAIL — `Cannot find module './docx-template'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/cover-letter/docx-template.ts
import { Document, Paragraph, TextRun } from "docx";
import { htmlToDocxParagraphs } from "./html-to-docx";

export interface CoverLetterDocxInput {
  companyName: string;
  positionTitle: string;
  createdAt: Date;
  bodyHtml: string;
}

export function buildCoverLetterDocx({
  companyName,
  positionTitle,
  createdAt,
  bodyHtml,
}: CoverLetterDocxInput): Document {
  return new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: positionTitle, bold: true, size: 28 })],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${companyName} - ${createdAt.toLocaleDateString("en-CA")}`,
                color: "555555",
              }),
            ],
            spacing: { after: 200 },
          }),
          ...htmlToDocxParagraphs(bodyHtml),
        ],
      },
    ],
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/cover-letter/docx-template.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Write the route handler**

```tsx
// src/app/[locale]/(app)/cover-letter/[id]/docx/route.tsx
import { notFound } from "next/navigation";
import { Packer } from "docx";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { buildCoverLetterDocx } from "@/lib/cover-letter/docx-template";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: token } = await params;

  const coverLetterId = decryptId(token);
  if (!coverLetterId) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const coverLetter = await db.coverLetter.findUnique({ where: { id: coverLetterId } });

  if (!coverLetter || coverLetter.userId !== user.id) {
    notFound();
  }

  const document = buildCoverLetterDocx({
    companyName: coverLetter.companyName,
    positionTitle: coverLetter.positionTitle,
    createdAt: coverLetter.createdAt,
    bodyHtml: coverLetter.bodyHtml,
  });

  const buffer = await Packer.toBuffer(document);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `inline; filename="${coverLetter.companyName}-cover-letter.docx"`,
    },
  });
}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Manual check**

From the editor page, click "Download Word". Expected: a `.docx` file downloads and opens correctly in Word/LibreOffice/Google Docs, showing the position title, company/date line, and the letter body with any bold/italic/list formatting preserved.

- [ ] **Step 8: Commit**

```bash
git add src/lib/cover-letter/docx-template.ts src/lib/cover-letter/docx-template.test.ts "src/app/[locale]/(app)/cover-letter/[id]/docx/route.tsx"
git commit -m "feat: add cover letter Word (.docx) export"
```

---

### Task 18: Wire into sidebar navigation and dashboard

**Files:**
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/app/[locale]/(app)/dashboard/page.tsx`
- Modify: `messages/en.json`
- Modify: `messages/id.json`

The `dashboard.modules` array (index 4, "Cover Letter") already exists in both locale files as a "coming soon" entry — `moduleRoutes[4]` is `null` in `app-shell.tsx` and index `4` is absent from `ACTIVE_MODULE_INDICES` in `dashboard/page.tsx`. This task flips both, and adds the `steps` array + a `moduleStatus` count line that the two already-live modules (ATS Check, Resume Builder) already have, so Cover Letter reaches full parity with them.

**Interfaces:**
- Consumes: `db.coverLetter.count` (Task 1).
- Produces: a reachable `/cover-letter` sidebar link and an active (non-"coming soon") dashboard module card with a Quick Start card.

- [ ] **Step 1: Point the sidebar nav at `/cover-letter`**

In `src/components/layout/app-shell.tsx`, change line 23:

```typescript
const moduleRoutes: (string | null)[] = [null, "/ats-check", "/resume-builder", null, "/cover-letter", null];
```

- [ ] **Step 2: Add index 4 to `ACTIVE_MODULE_INDICES` and add a status line**

In `src/app/[locale]/(app)/dashboard/page.tsx`, change line 22:

```typescript
const ACTIVE_MODULE_INDICES = new Set([1, 2, 4]);
```

Add a `coverLetterCount` query alongside the existing `resumeCount`/`atsCheckCount` queries (around line 37-52):

```typescript
const [profile, resumeCount, atsCheckCount, coverLetterCount, latestCheck] = await Promise.all([
  db.profile.findUnique({
    where: { userId: user.id },
    include: {
      _count: {
        select: { workExperiences: true, educations: true, skills: true },
      },
    },
  }),
  db.resumeDocument.count({ where: { userId: user.id } }),
  db.aTSCheckAnalysis.count({ where: { userId: user.id } }),
  db.coverLetter.count({ where: { userId: user.id } }),
  db.aTSCheckAnalysis.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  }),
]);
```

Add a `4:` entry to the `moduleStatuses` map (around line 85-92):

```typescript
const moduleStatuses: Record<number, string | undefined> = {
  1:
    atsCheckCount > 0
      ? t("moduleStatus.atsChecksDone", { count: atsCheckCount })
      : undefined,
  2:
    resumeCount > 0 ? t("moduleStatus.resumesCreated", { count: resumeCount }) : undefined,
  4:
    coverLetterCount > 0
      ? t("moduleStatus.coverLettersCreated", { count: coverLetterCount })
      : undefined,
};
```

- [ ] **Step 3: Add the Quick Start `steps` array and the `moduleStatus.coverLettersCreated` key to `messages/en.json`**

In the `dashboard.modules` array, replace the "Cover Letter" entry (index 4, currently `{"title": "Cover Letter", "description": "Generate a cover letter from your profile and a job posting."}`) with:

```json
{
  "title": "Cover Letter",
  "description": "Generate a cover letter from your profile and a job posting.",
  "steps": [
    "Open the \"Cover Letter\" menu in the sidebar",
    "Paste the job posting, fill in the company and position, and pick a tone and length",
    "Edit the AI-drafted letter, then download it as PDF or Word"
  ]
}
```

In `dashboard.moduleStatus`, add:

```json
"coverLettersCreated": "{count} cover letters created so far"
```

- [ ] **Step 4: Add the matching Indonesian copy to `messages/id.json`**

Replace the "Cover Letter" module entry:

```json
{
  "title": "Cover Letter",
  "description": "Buat cover letter dari profil dan lowongan.",
  "steps": [
    "Buka menu \"Cover Letter\" di sidebar",
    "Tempel deskripsi lowongan, isi perusahaan dan posisi, lalu pilih nada dan panjang",
    "Edit draf dari AI, lalu unduh sebagai PDF atau Word"
  ]
}
```

In `dashboard.moduleStatus`:

```json
"coverLettersCreated": "{count} cover letter dibuat sejauh ini"
```

- [ ] **Step 5: Validate JSON and typecheck**

Run: `python3 -c "import json; json.load(open('messages/en.json')); json.load(open('messages/id.json')); print('ok')"`
Expected: `ok`

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Manual check**

Visit `/en/dashboard`. Expected: "Cover Letter" no longer shows the "Coming Soon" badge, shows a status line once at least one cover letter exists, and (if any cover letters exist) appears as a Quick Start card with its 3 steps. Visit any `(app)` page and check the sidebar: "Cover Letter" is now a clickable link (with the `Mail` icon) instead of a greyed-out "Coming Soon" row.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/app-shell.tsx "src/app/[locale]/(app)/dashboard/page.tsx" messages/en.json messages/id.json
git commit -m "feat: wire cover letter into sidebar nav and dashboard"
```

---

### Task 19: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: All tests pass, including every new file from Tasks 2-6 and 15-17.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 3: Run a full typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Run a production build**

Run: `npm run build`
Expected: Build succeeds, including the three new dynamic routes (`/cover-letter`, `/cover-letter/new`, `/cover-letter/[id]`, `/cover-letter/[id]/pdf`, `/cover-letter/[id]/docx`).

- [ ] **Step 5: Manual end-to-end walkthrough**

With `npm run dev` running and a real `GEMINI_API_KEY` configured:
1. Sign in, go to the sidebar, click "Cover Letter" (no longer "Coming Soon").
2. Click "Create Cover Letter", fill in a real company name, position, and a real job posting, pick Casual + Short, submit.
3. Confirm the generated letter only references experience actually present in your Profile (no fabricated employers, metrics, or job titles).
4. Edit the company name and the letter body; confirm "Auto-saving..." then "Saved" appears without a page reload.
5. Download PDF — confirm it opens and matches the edited content.
6. Download Word — confirm it opens in Word/LibreOffice/Google Docs with formatting (bold/lists, if you added any) intact.
7. Go back to the list, confirm the record appears with the edited company name and can be reopened, then delete it and confirm it disappears from both the list and the dashboard's cover-letter count.

- [ ] **Step 6: No commit for this task** — it's verification only. If any step fails, fix the underlying task and re-run this task's checks.
