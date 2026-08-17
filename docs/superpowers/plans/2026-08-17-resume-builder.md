# Resume Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user generate one or more tailored, ATS-safe PDF resumes from their Profile data, with AI-assisted bullet rewriting and instant preview.

**Architecture:** Profile gains a `summary` field and three new sections (Certifications, Projects, Languages), each with its own card on `/profile` following the exact pattern already established there. A new `ResumeDocument` model stores a self-contained JSON snapshot (`content`) seeded from Profile at creation and freely editable afterward, independent of Profile. A single-page builder (`/resume-builder/[id]`) edits that snapshot in React state with one page-level Save. A `@react-pdf/renderer` template renders the snapshot to PDF through an authenticated route handler that serves both preview and download, so the two can never drift apart. Gemini (`gemini-2.5-flash`, free tier only) rewrites Work Experience bullets on request.

**Tech Stack:** Prisma (new models on the `perintis` Postgres schema), Zod, `@google/genai`, `@react-pdf/renderer`, next-intl, the existing toast system, Base UI/shadcn components.

**Spec:** `docs/superpowers/specs/2026-08-17-resume-builder-design.md`

## Global Constraints

- Every new/extended Server Action verifies ownership (Profile's `userId`, or `ResumeDocument.userId`) before reading or writing — never trust a client-supplied id alone.
- AI integration is **free tier only** — `gemini-2.5-flash`, no paid model, no automatic fallback to a paid provider on rate-limit/quota errors (spec §4). Every `generateContent` call sets `thinkingConfig: { thinkingBudget: 0 }`, `responseMimeType: "application/json"` with a `responseJsonSchema`, and `maxOutputTokens: 512`.
- `GEMINI_API_KEY` is already present in `.env` (confirmed) — no credential-gathering pause needed.
- `.env`'s `POSTGRES_PRISMA_URL`/`POSTGRES_URL_NON_POOLING` already point at the `perintis` Postgres schema (confirmed working since the ATS Check sub-project) — no new credential gathering needed for the migration either.
- `@react-pdf/renderer` was empirically verified during brainstorming (a throwaway scratchpad spike generated a PDF and round-tripped it through this project's own `pdfjs-dist` parser, confirming a genuine extractable text layer) — trust it, no further spike needed here.
- Design system (`docs/design-system.md`) governs the *product UI* only (hairline `border border-border` cards, accent color only on buttons/links, no em dashes). The generated PDF is a separate design surface and intentionally does not follow it — neutral, conventional resume typography instead (Helvetica, black text, underlined section headings).
- AI Enhance UX must be transparent and reversible: visible loading state, suggestions shown separately from the original text (never silently overwritten), explicit Terapkan Semua/Batalkan choice, graceful toast on failure with the original text untouched.
- Testing convention: TDD (Vitest) for Zod schemas and pure functions only. No automated tests for Server Actions or UI components — manual smoke test instead, and this environment has no working browser driver (Playwright MCP Bridge times out), so the manual smoke test is an explicit follow-up for the user, not something verified here.
- Git: commit messages never include Claude/AI attribution, plain messages only. Commits go directly to `main` (no branches), consistent with every prior sub-project this session.

---

## Task 1: Prisma schema — Profile.summary, Certification, Project, Language, ResumeDocument

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `db.certification`, `db.project`, `db.language`, `db.resumeDocument` Prisma client models; `Profile.summary` field — consumed by every later task in this plan.

- [ ] **Step 1: Add `summary` to `Profile` and its three new relations**

In `prisma/schema.prisma`, modify the `Profile` model:

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
  summary        String?
  updatedAt      DateTime @updatedAt

  workExperiences WorkExperience[]
  educations      Education[]
  skills          Skill[]
  certifications  Certification[]
  projects        Project[]
  languages       Language[]
}
```

- [ ] **Step 2: Add the three new models**

Append to `prisma/schema.prisma`:

```prisma
model Certification {
  id        String    @id @default(cuid())
  profileId String
  profile   Profile   @relation(fields: [profileId], references: [id])
  name      String
  issuer    String
  issueDate DateTime?
  url       String?
  createdAt DateTime  @default(now())
}

model Project {
  id        String   @id @default(cuid())
  profileId String
  profile   Profile  @relation(fields: [profileId], references: [id])
  name      String
  client    String?
  role      String?
  bullets   String[]
  techStack String[]
  createdAt DateTime @default(now())
}

model Language {
  id          String  @id @default(cuid())
  profileId   String
  profile     Profile @relation(fields: [profileId], references: [id])
  name        String
  proficiency String
}
```

- [ ] **Step 3: Add `ResumeDocument` and the `User` back-relation**

Modify `User`:

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
}
```

Append:

```prisma
model ResumeDocument {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  content   Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 4: Regenerate the Prisma client**

Run: `npx prisma generate`
Expected: `Generated Prisma Client (6.19.3) to ./src/generated/prisma` — succeeds.

- [ ] **Step 5: Validate the schema**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 6: Run the migration**

Run: `npx prisma migrate dev --name resume_builder`
Expected: migration applies cleanly to the `perintis` schema; `Certification`, `Project`, `Language`, `ResumeDocument` tables exist; `Profile.summary` column added.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add Profile.summary, Certification, Project, Language, and ResumeDocument models"
```

---

## Task 2: Shared ResumeContent types + date formatter

**Files:**
- Create: `src/lib/resume-builder/types.ts`
- Create: `src/lib/resume-builder/format-date.ts`
- Create: `src/lib/resume-builder/format-date.test.ts`

**Interfaces:**
- Produces: `ResumeContent` and its nested interfaces (`PersonalInfo`, `WorkExperienceEntry`, `EducationEntry`, `SkillEntry`, `CertificationEntry`, `ProjectEntry`, `LanguageEntry`) — consumed by every later task that touches resume content. `formatMonthYear(dateString: string | null): string` — consumed by the builder page's on-screen forms and the PDF template.

- [ ] **Step 1: Write the types**

`src/lib/resume-builder/types.ts`:
```ts
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
}

export interface WorkExperienceEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  bullets: string[];
}

export interface SkillEntry {
  id: string;
  name: string;
  category: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  issueDate: string | null;
  url: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  client: string;
  role: string;
  bullets: string[];
  techStack: string[];
}

export interface LanguageEntry {
  id: string;
  name: string;
  proficiency: string;
}

export interface ResumeContent {
  personalInfo: PersonalInfo;
  summary: string;
  workExperiences: WorkExperienceEntry[];
  educations: EducationEntry[];
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
  languages: LanguageEntry[];
}
```

- [ ] **Step 2: Write the failing test for the date formatter**

`src/lib/resume-builder/format-date.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formatMonthYear } from "./format-date";

describe("formatMonthYear", () => {
  it("formats an ISO date string as month + year", () => {
    expect(formatMonthYear("2024-09-15")).toBe("Sep 2024");
  });

  it("returns an empty string for null", () => {
    expect(formatMonthYear(null)).toBe("");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/lib/resume-builder/format-date.test.ts`
Expected: FAIL — `./format-date` module not found.

- [ ] **Step 4: Implement the formatter**

`src/lib/resume-builder/format-date.ts`:
```ts
export function formatMonthYear(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/resume-builder/format-date.test.ts`
Expected: PASS (2/2).

- [ ] **Step 6: Commit**

```bash
git add src/lib/resume-builder/types.ts src/lib/resume-builder/format-date.ts src/lib/resume-builder/format-date.test.ts
git commit -m "feat: shared ResumeContent types and date formatter for Resume Builder"
```

---

## Task 3: Zod schemas for the three new Profile sections + summary field

**Files:**
- Modify: `src/lib/validations/profile.ts`
- Modify: `src/lib/validations/profile.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `certificationSchema`, `projectSchema`, `languageSchema` (and their inferred `*Input` types); `personalInfoSchema` gains an optional `summary` field — consumed by Task 7 (Profile Server Actions) and Task 9/10 (Profile cards).

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/validations/profile.test.ts`:
```ts
import {
  certificationSchema,
  languageSchema,
  projectSchema,
} from "./profile";

describe("personalInfoSchema summary field", () => {
  it("accepts a summary string", () => {
    const result = personalInfoSchema.safeParse({ summary: "Experienced engineer." });
    expect(result.success).toBe(true);
  });

  it("still accepts input with no summary", () => {
    expect(personalInfoSchema.safeParse({}).success).toBe(true);
  });
});

describe("certificationSchema", () => {
  it("requires a name and issuer", () => {
    const result = certificationSchema.safeParse({ name: "", issuer: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid certification with no issueDate or url", () => {
    const result = certificationSchema.safeParse({
      name: "AWS Certified Developer",
      issuer: "Amazon",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid url", () => {
    const result = certificationSchema.safeParse({
      name: "AWS Certified Developer",
      issuer: "Amazon",
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("projectSchema", () => {
  it("requires a name", () => {
    expect(projectSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("accepts a valid project with bullets and techStack", () => {
    const result = projectSchema.safeParse({
      name: "Dulux Design Competition",
      client: "Dulux Indonesia",
      role: "Lead Backend",
      bullets: ["Built a high-traffic competition platform."],
      techStack: ["Next.js", "Node.js"],
    });
    expect(result.success).toBe(true);
  });
});

describe("languageSchema", () => {
  it("requires a name and proficiency", () => {
    expect(languageSchema.safeParse({ name: "", proficiency: "" }).success).toBe(false);
  });

  it("accepts a valid language", () => {
    const result = languageSchema.safeParse({ name: "English", proficiency: "Proficient" });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/validations/profile.test.ts`
Expected: FAIL — `certificationSchema`/`projectSchema`/`languageSchema` not exported.

- [ ] **Step 3: Implement**

In `src/lib/validations/profile.ts`, add `summary` to `personalInfoSchema`:

```ts
export const personalInfoSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.union([z.string().url(), z.literal("")]).optional(),
  portfolioUrl: z.union([z.string().url(), z.literal("")]).optional(),
  targetRole: z.string().optional(),
  targetIndustry: z.string().optional(),
  summary: z.string().optional(),
});
```

Append the three new schemas:

```ts
export const certificationSchema = z.object({
  name: z.string().min(1, "Nama sertifikasi wajib diisi"),
  issuer: z.string().min(1, "Penerbit wajib diisi"),
  issueDate: z.string().optional(),
  url: z.union([z.string().url(), z.literal("")]).optional(),
});

export type CertificationInput = z.infer<typeof certificationSchema>;

export const projectSchema = z.object({
  name: z.string().min(1, "Nama proyek wajib diisi"),
  client: z.string().optional(),
  role: z.string().optional(),
  bullets: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export const languageSchema = z.object({
  name: z.string().min(1, "Nama bahasa wajib diisi"),
  proficiency: z.string().min(1, "Level wajib diisi"),
});

export type LanguageInput = z.infer<typeof languageSchema>;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/validations/profile.test.ts`
Expected: PASS (all tests, including the new ones).

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/profile.ts src/lib/validations/profile.test.ts
git commit -m "feat: Zod schemas for Certification, Project, Language, and Profile summary"
```

---

## Task 4: resumeContentSchema

**Files:**
- Create: `src/lib/validations/resume-content.ts`
- Create: `src/lib/validations/resume-content.test.ts`

**Interfaces:**
- Consumes: nothing new (mirrors the shape of `ResumeContent` from Task 2, independently — Zod schemas don't import TS interfaces).
- Produces: `resumeContentSchema`, `type ResumeContentInput = z.infer<typeof resumeContentSchema>` — consumed by Task 15's `updateResumeContent` Server Action.

- [ ] **Step 1: Write the failing test**

`src/lib/validations/resume-content.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { resumeContentSchema } from "./resume-content";

const VALID_CONTENT = {
  personalInfo: {
    fullName: "Budi Santoso",
    email: "budi@example.com",
    phone: "+62 812-0000-0000",
    location: "Jakarta, Indonesia",
    linkedinUrl: "",
    portfolioUrl: "",
  },
  summary: "Software engineer with 3 years of experience.",
  workExperiences: [
    {
      id: "we-1",
      title: "Software Engineer",
      company: "Acme",
      location: "Jakarta",
      startDate: "2023-01-01",
      endDate: null,
      bullets: ["Built a thing."],
    },
  ],
  educations: [],
  skills: [{ id: "sk-1", name: "TypeScript", category: "Hard Skills" }],
  certifications: [],
  projects: [],
  languages: [],
};

describe("resumeContentSchema", () => {
  it("accepts a fully valid content object", () => {
    expect(resumeContentSchema.safeParse(VALID_CONTENT).success).toBe(true);
  });

  it("rejects a missing personalInfo.fullName", () => {
    const invalid = {
      ...VALID_CONTENT,
      personalInfo: { ...VALID_CONTENT.personalInfo, fullName: undefined },
    };
    expect(resumeContentSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects a work experience entry missing an id", () => {
    const invalid = {
      ...VALID_CONTENT,
      workExperiences: [{ ...VALID_CONTENT.workExperiences[0], id: undefined }],
    };
    expect(resumeContentSchema.safeParse(invalid).success).toBe(false);
  });

  it("accepts an empty content object with all arrays empty", () => {
    const empty = {
      personalInfo: {
        fullName: "",
        email: "",
        phone: "",
        location: "",
        linkedinUrl: "",
        portfolioUrl: "",
      },
      summary: "",
      workExperiences: [],
      educations: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
    };
    expect(resumeContentSchema.safeParse(empty).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/validations/resume-content.test.ts`
Expected: FAIL — `./resume-content` module not found.

- [ ] **Step 3: Implement**

`src/lib/validations/resume-content.ts`:
```ts
import { z } from "zod";

const personalInfoSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedinUrl: z.string(),
  portfolioUrl: z.string(),
});

const workExperienceEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  bullets: z.array(z.string()),
});

const educationEntrySchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string(),
  location: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  bullets: z.array(z.string()),
});

const skillEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
});

const certificationEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  issueDate: z.string().nullable(),
  url: z.string(),
});

const projectEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  client: z.string(),
  role: z.string(),
  bullets: z.array(z.string()),
  techStack: z.array(z.string()),
});

const languageEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  proficiency: z.string(),
});

export const resumeContentSchema = z.object({
  personalInfo: personalInfoSchema,
  summary: z.string(),
  workExperiences: z.array(workExperienceEntrySchema),
  educations: z.array(educationEntrySchema),
  skills: z.array(skillEntrySchema),
  certifications: z.array(certificationEntrySchema),
  projects: z.array(projectEntrySchema),
  languages: z.array(languageEntrySchema),
});

export type ResumeContentInput = z.infer<typeof resumeContentSchema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/validations/resume-content.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/resume-content.ts src/lib/validations/resume-content.test.ts
git commit -m "feat: resumeContentSchema for validating the full resume snapshot"
```

---

## Task 5: buildContentFromProfile

**Files:**
- Create: `src/lib/resume-builder/build-content.ts`
- Create: `src/lib/resume-builder/build-content.test.ts`

**Interfaces:**
- Consumes: `ResumeContent` and its nested types (Task 2). Takes a `Profile` shape matching what Prisma returns when queried with all relations included, plus the user's `email` (not on `Profile`).
- Produces: `buildContentFromProfile(profile: ProfileWithRelations, email: string): ResumeContent` — consumed by Task 12's `createResumeDocument` Server Action.

- [ ] **Step 1: Write the failing test**

`src/lib/resume-builder/build-content.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { buildContentFromProfile } from "./build-content";

const PROFILE_FIXTURE = {
  fullName: "Budi Santoso",
  phone: "+62 812-0000-0000",
  location: "Jakarta, Indonesia",
  linkedinUrl: "linkedin.com/in/budi",
  portfolioUrl: null,
  summary: "Software engineer.",
  workExperiences: [
    {
      id: "we-1",
      title: "Software Engineer",
      company: "Acme",
      location: "Jakarta",
      startDate: new Date("2023-01-15"),
      endDate: null,
      description: "Built the thing.\nShipped the other thing.\n\n",
    },
  ],
  educations: [
    {
      id: "ed-1",
      institution: "Universitas Indonesia",
      degree: "S1",
      fieldOfStudy: "Ilmu Komputer",
      startDate: new Date("2018-08-01"),
      endDate: new Date("2022-07-01"),
    },
  ],
  skills: [{ id: "sk-1", name: "TypeScript", category: "Hard Skills" }],
  certifications: [
    {
      id: "ce-1",
      name: "AWS Certified Developer",
      issuer: "Amazon",
      issueDate: new Date("2023-06-01"),
      url: null,
    },
  ],
  projects: [
    {
      id: "pr-1",
      name: "Dulux Design Competition",
      client: null,
      role: "Lead Backend",
      bullets: ["Built a platform."],
      techStack: ["Next.js"],
    },
  ],
  languages: [{ id: "la-1", name: "English", proficiency: "Proficient" }],
};

describe("buildContentFromProfile", () => {
  it("maps personal info, using the given email since Profile has none", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.personalInfo.fullName).toBe("Budi Santoso");
    expect(content.personalInfo.email).toBe("budi@example.com");
    expect(content.personalInfo.portfolioUrl).toBe("");
  });

  it("splits work experience description into bullets, dropping blank lines", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.workExperiences[0].bullets).toEqual([
      "Built the thing.",
      "Shipped the other thing.",
    ]);
  });

  it("formats dates as YYYY-MM-DD strings and preserves null end dates", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.workExperiences[0].startDate).toBe("2023-01-15");
    expect(content.workExperiences[0].endDate).toBeNull();
  });

  it("defaults education location and bullets to empty since Profile doesn't track them", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.educations[0].location).toBe("");
    expect(content.educations[0].bullets).toEqual([]);
  });

  it("copies project bullets and techStack as-is", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.projects[0].bullets).toEqual(["Built a platform."]);
    expect(content.projects[0].techStack).toEqual(["Next.js"]);
  });

  it("coerces null optional strings to empty strings, e.g. certification url", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.certifications[0].url).toBe("");
    expect(content.certifications[0].issueDate).toBe("2023-06-01");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/resume-builder/build-content.test.ts`
Expected: FAIL — `./build-content` module not found.

- [ ] **Step 3: Implement**

`src/lib/resume-builder/build-content.ts`:
```ts
import type {
  CertificationEntry,
  EducationEntry,
  LanguageEntry,
  ProjectEntry,
  ResumeContent,
  SkillEntry,
  WorkExperienceEntry,
} from "./types";

interface ProfileWithRelations {
  fullName: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  summary: string | null;
  workExperiences: Array<{
    id: string;
    title: string;
    company: string;
    location: string | null;
    startDate: Date;
    endDate: Date | null;
    description: string | null;
  }>;
  educations: Array<{
    id: string;
    institution: string;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: Date;
    endDate: Date | null;
  }>;
  skills: Array<{ id: string; name: string; category: string | null }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate: Date | null;
    url: string | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    client: string | null;
    role: string | null;
    bullets: string[];
    techStack: string[];
  }>;
  languages: Array<{ id: string; name: string; proficiency: string }>;
}

function toDateString(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

function splitBullets(description: string | null): string[] {
  if (!description) return [];
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildContentFromProfile(
  profile: ProfileWithRelations,
  email: string
): ResumeContent {
  const workExperiences: WorkExperienceEntry[] = profile.workExperiences.map((we) => ({
    id: we.id,
    title: we.title,
    company: we.company,
    location: we.location ?? "",
    startDate: toDateString(we.startDate),
    endDate: toDateString(we.endDate),
    bullets: splitBullets(we.description),
  }));

  const educations: EducationEntry[] = profile.educations.map((ed) => ({
    id: ed.id,
    institution: ed.institution,
    degree: ed.degree ?? "",
    fieldOfStudy: ed.fieldOfStudy ?? "",
    location: "",
    startDate: toDateString(ed.startDate),
    endDate: toDateString(ed.endDate),
    bullets: [],
  }));

  const skills: SkillEntry[] = profile.skills.map((sk) => ({
    id: sk.id,
    name: sk.name,
    category: sk.category ?? "",
  }));

  const certifications: CertificationEntry[] = profile.certifications.map((ce) => ({
    id: ce.id,
    name: ce.name,
    issuer: ce.issuer,
    issueDate: toDateString(ce.issueDate),
    url: ce.url ?? "",
  }));

  const projects: ProjectEntry[] = profile.projects.map((pr) => ({
    id: pr.id,
    name: pr.name,
    client: pr.client ?? "",
    role: pr.role ?? "",
    bullets: pr.bullets,
    techStack: pr.techStack,
  }));

  const languages: LanguageEntry[] = profile.languages.map((la) => ({
    id: la.id,
    name: la.name,
    proficiency: la.proficiency,
  }));

  return {
    personalInfo: {
      fullName: profile.fullName ?? "",
      email,
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
      portfolioUrl: profile.portfolioUrl ?? "",
    },
    summary: profile.summary ?? "",
    workExperiences,
    educations,
    skills,
    certifications,
    projects,
    languages,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/resume-builder/build-content.test.ts`
Expected: PASS (6/6).

- [ ] **Step 5: Commit**

```bash
git add src/lib/resume-builder/build-content.ts src/lib/resume-builder/build-content.test.ts
git commit -m "feat: buildContentFromProfile seeding function"
```

---

## Task 6: Bilingual messages — Profile extensions

**Files:**
- Modify: `messages/id.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: `profile.personalInfo.summaryLabel`; new `profile.certifications`, `profile.projects`, `profile.languages` namespaces — consumed by Tasks 8-10.

- [ ] **Step 1: Add `summaryLabel` to `profile.personalInfo` in `messages/id.json`**

In the existing `"personalInfo": { ... }` block, add after `"portfolioLabel"`:
```json
"summaryLabel": "Ringkasan Profesional",
```

- [ ] **Step 2: Add three new namespaces to `messages/id.json`**, as siblings of the existing `"skills"` key inside `"profile"`:

```json
    "certifications": {
      "title": "Sertifikasi",
      "empty": "Belum ada sertifikasi ditambahkan.",
      "addButton": "Tambah Sertifikasi",
      "nameLabel": "Nama Sertifikasi",
      "issuerLabel": "Penerbit",
      "issueDateLabel": "Tanggal Terbit",
      "urlLabel": "URL (opsional)",
      "toastAddSuccess": "Sertifikasi ditambahkan",
      "toastDeleteSuccess": "Sertifikasi dihapus",
      "toastError": "Terjadi kesalahan"
    },
    "projects": {
      "title": "Proyek Unggulan",
      "empty": "Belum ada proyek ditambahkan.",
      "addButton": "Tambah Proyek",
      "editButton": "Ubah Proyek",
      "nameLabel": "Nama Proyek",
      "clientLabel": "Klien (opsional)",
      "roleLabel": "Peran",
      "bulletsLabel": "Poin-poin (satu per baris)",
      "techStackLabel": "Tech Stack (pisahkan dengan koma)",
      "save": "Simpan",
      "saving": "Menyimpan...",
      "cancel": "Batal",
      "edit": "Ubah",
      "delete": "Hapus",
      "toastAddSuccess": "Proyek ditambahkan",
      "toastUpdateSuccess": "Proyek diperbarui",
      "toastDeleteSuccess": "Proyek dihapus",
      "toastError": "Terjadi kesalahan"
    },
    "languages": {
      "title": "Bahasa",
      "empty": "Belum ada bahasa ditambahkan.",
      "nameLabel": "Bahasa",
      "proficiencyLabel": "Level",
      "addButton": "Tambah",
      "toastAddSuccess": "Bahasa ditambahkan",
      "toastDeleteSuccess": "Bahasa dihapus",
      "toastError": "Terjadi kesalahan"
    }
```

- [ ] **Step 3: Mirror the same additions in `messages/en.json`**

`"summaryLabel": "Professional Summary",` in `personalInfo`, and:

```json
    "certifications": {
      "title": "Certifications",
      "empty": "No certifications added yet.",
      "addButton": "Add Certification",
      "nameLabel": "Certification Name",
      "issuerLabel": "Issuer",
      "issueDateLabel": "Issue Date",
      "urlLabel": "URL (optional)",
      "toastAddSuccess": "Certification added",
      "toastDeleteSuccess": "Certification deleted",
      "toastError": "Something went wrong"
    },
    "projects": {
      "title": "Highlight Projects",
      "empty": "No projects added yet.",
      "addButton": "Add Project",
      "editButton": "Edit Project",
      "nameLabel": "Project Name",
      "clientLabel": "Client (optional)",
      "roleLabel": "Role",
      "bulletsLabel": "Bullet Points (one per line)",
      "techStackLabel": "Tech Stack (comma-separated)",
      "save": "Save",
      "saving": "Saving...",
      "cancel": "Cancel",
      "edit": "Edit",
      "delete": "Delete",
      "toastAddSuccess": "Project added",
      "toastUpdateSuccess": "Project updated",
      "toastDeleteSuccess": "Project deleted",
      "toastError": "Something went wrong"
    },
    "languages": {
      "title": "Languages",
      "empty": "No languages added yet.",
      "nameLabel": "Language",
      "proficiencyLabel": "Proficiency",
      "addButton": "Add",
      "toastAddSuccess": "Language added",
      "toastDeleteSuccess": "Language deleted",
      "toastError": "Something went wrong"
    }
```

- [ ] **Step 4: Verify both files are still valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/id.json', 'utf8')); JSON.parse(require('fs').readFileSync('messages/en.json', 'utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 5: Commit**

```bash
git add messages/id.json messages/en.json
git commit -m "feat: bilingual messages for Profile summary, certifications, projects, languages"
```

---

## Task 7: Profile Server Actions — Certifications, Projects, Languages, Summary

**Files:**
- Modify: `src/app/[locale]/(app)/profile/actions.ts`

**Interfaces:**
- Consumes: `certificationSchema`, `projectSchema`, `languageSchema` (Task 3).
- Produces: `addCertification`, `deleteCertification`, `addProject`, `updateProject`, `deleteProject`, `addLanguage`, `deleteLanguage` — same `Promise<{ success: true } | { error: string }>` return shape as every existing action in this file — consumed by Tasks 9-10's card components. `updatePersonalInfo` (already exists) now also persists `summary` since `personalInfoSchema` already validates it (Task 3) and `parsed.data` is passed straight through to `db.profile.update`.

- [ ] **Step 1: Update the import line**

In `src/app/[locale]/(app)/profile/actions.ts`, change:
```ts
import {
  educationSchema,
  personalInfoSchema,
  skillSchema,
  workExperienceSchema,
} from "@/lib/validations/profile";
```
to:
```ts
import {
  certificationSchema,
  educationSchema,
  languageSchema,
  personalInfoSchema,
  projectSchema,
  skillSchema,
  workExperienceSchema,
} from "@/lib/validations/profile";
```

- [ ] **Step 2: Add `parseTechStack`/`parseBullets` helpers and the new actions**

Append to the end of the file:
```ts
function parseTechStack(formData: FormData): string[] {
  const raw = formData.get("techStack");
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBullets(formData: FormData): string[] {
  const raw = formData.get("bullets");
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function addCertification(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const parsed = certificationSchema.safeParse({
    name: formData.get("name") ?? "",
    issuer: formData.get("issuer") ?? "",
    issueDate: formData.get("issueDate") || undefined,
    url: formData.get("url") ?? "",
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.certification.create({
    data: {
      profileId,
      name: parsed.data.name,
      issuer: parsed.data.issuer,
      issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : null,
      url: parsed.data.url || null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteCertification(
  id: string
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.certification.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  await db.certification.delete({ where: { id } });
  revalidatePath("/profile");
  return { success: true };
}

export async function addProject(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const parsed = projectSchema.safeParse({
    name: formData.get("name") ?? "",
    client: formData.get("client") ?? "",
    role: formData.get("role") ?? "",
    bullets: parseBullets(formData),
    techStack: parseTechStack(formData),
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.project.create({
    data: {
      profileId,
      name: parsed.data.name,
      client: parsed.data.client || null,
      role: parsed.data.role || null,
      bullets: parsed.data.bullets,
      techStack: parsed.data.techStack,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function updateProject(
  id: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.project.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  const parsed = projectSchema.safeParse({
    name: formData.get("name") ?? "",
    client: formData.get("client") ?? "",
    role: formData.get("role") ?? "",
    bullets: parseBullets(formData),
    techStack: parseTechStack(formData),
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.project.update({
    where: { id },
    data: {
      name: parsed.data.name,
      client: parsed.data.client || null,
      role: parsed.data.role || null,
      bullets: parsed.data.bullets,
      techStack: parsed.data.techStack,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteProject(
  id: string
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.project.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  await db.project.delete({ where: { id } });
  revalidatePath("/profile");
  return { success: true };
}

export async function addLanguage(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const parsed = languageSchema.safeParse({
    name: formData.get("name") ?? "",
    proficiency: formData.get("proficiency") ?? "",
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.language.create({
    data: {
      profileId,
      name: parsed.data.name,
      proficiency: parsed.data.proficiency,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteLanguage(
  id: string
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.language.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  await db.language.delete({ where: { id } });
  revalidatePath("/profile");
  return { success: true };
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/profile/actions.ts"
git commit -m "feat: Server Actions for Certifications, Projects, and Languages"
```

---

## Task 8: PersonalInfoCard — add Summary field

**Files:**
- Modify: `src/components/profile/personal-info-card.tsx`

- [ ] **Step 1: Add `summary` to the props interface**

Change:
```ts
interface PersonalInfoCardProps {
  profile: {
    fullName: string | null;
    phone: string | null;
    location: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    targetRole: string | null;
    targetIndustry: string | null;
  };
}
```
to:
```ts
interface PersonalInfoCardProps {
  profile: {
    fullName: string | null;
    phone: string | null;
    location: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    targetRole: string | null;
    targetIndustry: string | null;
    summary: string | null;
  };
}
```

- [ ] **Step 2: Add a Summary textarea before the Target Career section**

Insert this block right before `<div className="border-t border-border pt-6">` (the Target Career section):

```tsx
        <div className="space-y-1.5">
          <Label htmlFor="summary">{t("summaryLabel")}</Label>
          <textarea
            id="summary"
            name="summary"
            defaultValue={profile.summary ?? ""}
            rows={4}
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
```

- [ ] **Step 3: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new type errors (this component's prop type won't be satisfied by the `/profile` page's query yet — that's expected until Task 11 updates the page's `include`; ignore that specific error if it surfaces here, it resolves once Task 11 lands).

- [ ] **Step 4: Commit**

```bash
git add src/components/profile/personal-info-card.tsx
git commit -m "feat: add Summary field to PersonalInfoCard"
```

---

## Task 9: CertificationsCard and LanguagesCard components

**Files:**
- Create: `src/components/profile/certifications-card.tsx`
- Create: `src/components/profile/languages-card.tsx`

**Interfaces:**
- Consumes: `addCertification`, `deleteCertification`, `addLanguage`, `deleteLanguage` (Task 7).
- Produces: `CertificationsCard` (props `{ certifications: { id: string; name: string; issuer: string; issueDate: Date | null; url: string | null }[] }`), `LanguagesCard` (props `{ languages: { id: string; name: string; proficiency: string }[] }`) — consumed by the `/profile` page (Task 11).

- [ ] **Step 1: Implement CertificationsCard**

`src/components/profile/certifications-card.tsx`:
```tsx
"use client";

import { useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  addCertification,
  deleteCertification,
} from "@/app/[locale]/(app)/profile/actions";

interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date | null;
  url: string | null;
}

interface CertificationsCardProps {
  certifications: CertificationItem[];
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

export function CertificationsCard({ certifications }: CertificationsCardProps) {
  const t = useTranslations("profile.certifications");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addCertification(formData);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastAddSuccess"), type: "success" });
      formRef.current?.reset();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCertification(id);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastDeleteSuccess"), type: "success" });
    });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("title")}</h2>

      {certifications.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border p-6"
            >
              <div>
                <h3 className="font-medium">
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {cert.name}
                    </a>
                  ) : (
                    cert.name
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                {cert.issueDate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMonthYear(cert.issueDate)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(cert.id)}
                aria-label={t("toastDeleteSuccess")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form
        ref={formRef}
        action={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-border p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cert-name">{t("nameLabel")}</Label>
            <Input id="cert-name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-issuer">{t("issuerLabel")}</Label>
            <Input id="cert-issuer" name="issuer" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-issueDate">{t("issueDateLabel")}</Label>
            <Input id="cert-issueDate" name="issueDate" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-url">{t("urlLabel")}</Label>
            <Input id="cert-url" name="url" />
          </div>
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          <Plus className="size-4" />
          {t("addButton")}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Implement LanguagesCard**

`src/components/profile/languages-card.tsx`:
```tsx
"use client";

import { useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { addLanguage, deleteLanguage } from "@/app/[locale]/(app)/profile/actions";

interface LanguageItem {
  id: string;
  name: string;
  proficiency: string;
}

interface LanguagesCardProps {
  languages: LanguageItem[];
}

export function LanguagesCard({ languages }: LanguagesCardProps) {
  const t = useTranslations("profile.languages");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addLanguage(formData);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastAddSuccess"), type: "success" });
      formRef.current?.reset();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteLanguage(id);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastDeleteSuccess"), type: "success" });
    });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("title")}</h2>

      {languages.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {languages.map((lang) => (
            <span
              key={lang.id}
              className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {lang.name} &middot; {lang.proficiency}
              <button
                type="button"
                onClick={() => handleDelete(lang.id)}
                aria-label={t("toastDeleteSuccess")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form
        ref={formRef}
        action={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <div className="space-y-1.5">
          <label htmlFor="lang-name" className="text-xs text-muted-foreground">
            {t("nameLabel")}
          </label>
          <Input id="lang-name" name="name" required className="w-40" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="lang-proficiency" className="text-xs text-muted-foreground">
            {t("proficiencyLabel")}
          </label>
          <Input id="lang-proficiency" name="proficiency" required className="w-40" />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          <Plus className="size-4" />
          {t("addButton")}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Verify both type-check**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/profile/certifications-card.tsx src/components/profile/languages-card.tsx
git commit -m "feat: CertificationsCard and LanguagesCard components"
```

---

## Task 10: ProjectsCard component

**Files:**
- Create: `src/components/profile/projects-card.tsx`

**Interfaces:**
- Consumes: `addProject`, `updateProject`, `deleteProject` (Task 7).
- Produces: `ProjectsCard` (props `{ projects: { id: string; name: string; client: string | null; role: string | null; bullets: string[]; techStack: string[] }[] }`) — consumed by the `/profile` page (Task 11).

- [ ] **Step 1: Implement**

`src/components/profile/projects-card.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  addProject,
  deleteProject,
  updateProject,
} from "@/app/[locale]/(app)/profile/actions";

interface ProjectItem {
  id: string;
  name: string;
  client: string | null;
  role: string | null;
  bullets: string[];
  techStack: string[];
}

interface ProjectsCardProps {
  projects: ProjectItem[];
}

export function ProjectsCard({ projects }: ProjectsCardProps) {
  const t = useTranslations("profile.projects");
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingItem = projects.find((p) => p.id === editingId) ?? null;

  function openAddForm() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEditForm(id: string) {
    setEditingId(id);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editingId
        ? await updateProject(editingId, formData)
        : await addProject(formData);

      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }

      toast.add({
        title: editingId ? t("toastUpdateSuccess") : t("toastAddSuccess"),
        type: "success",
      });
      closeForm();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteProject(id);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastDeleteSuccess"), type: "success" });
    });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        {!formOpen && (
          <Button variant="outline" size="sm" onClick={openAddForm}>
            <Plus className="size-4" />
            {t("addButton")}
          </Button>
        )}
      </div>

      {projects.length === 0 && !formOpen && (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      )}

      {projects.length > 0 && (
        <div className="mt-6 space-y-4">
          {projects.map((proj) => (
            <div key={proj.id} className="rounded-2xl border border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">
                    {proj.name}
                    {proj.client ? ` – ${proj.client}` : ""}
                  </h3>
                  {proj.role && (
                    <p className="text-sm text-muted-foreground">{proj.role}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditForm(proj.id)}
                    aria-label={t("edit")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(proj.id)}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {proj.bullets.length > 0 && (
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {proj.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
              {proj.techStack.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {proj.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <form
          action={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-border p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="proj-name">{t("nameLabel")}</Label>
              <Input id="proj-name" name="name" defaultValue={editingItem?.name ?? ""} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-client">{t("clientLabel")}</Label>
              <Input id="proj-client" name="client" defaultValue={editingItem?.client ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-role">{t("roleLabel")}</Label>
              <Input id="proj-role" name="role" defaultValue={editingItem?.role ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-techStack">{t("techStackLabel")}</Label>
              <Input
                id="proj-techStack"
                name="techStack"
                defaultValue={editingItem?.techStack.join(", ") ?? ""}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proj-bullets">{t("bulletsLabel")}</Label>
            <textarea
              id="proj-bullets"
              name="bullets"
              defaultValue={editingItem?.bullets.join("\n") ?? ""}
              rows={4}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/projects-card.tsx
git commit -m "feat: ProjectsCard component"
```

---

## Task 11: Wire the three new cards into the /profile page

**Files:**
- Modify: `src/app/[locale]/(app)/profile/page.tsx`

**Interfaces:**
- Consumes: `CertificationsCard`, `LanguagesCard` (Task 9), `ProjectsCard` (Task 10).

- [ ] **Step 1: Update imports and the Prisma query's `include`**

Change:
```tsx
import { PersonalInfoCard } from "@/components/profile/personal-info-card";
import { WorkExperienceCard } from "@/components/profile/work-experience-card";
import { EducationCard } from "@/components/profile/education-card";
import { SkillsCard } from "@/components/profile/skills-card";
```
to:
```tsx
import { PersonalInfoCard } from "@/components/profile/personal-info-card";
import { WorkExperienceCard } from "@/components/profile/work-experience-card";
import { EducationCard } from "@/components/profile/education-card";
import { SkillsCard } from "@/components/profile/skills-card";
import { CertificationsCard } from "@/components/profile/certifications-card";
import { ProjectsCard } from "@/components/profile/projects-card";
import { LanguagesCard } from "@/components/profile/languages-card";
```

Change the `db.profile.findUniqueOrThrow` call's `include`:
```tsx
  const profile = await db.profile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      workExperiences: { orderBy: { startDate: "desc" } },
      educations: { orderBy: { startDate: "desc" } },
      skills: { orderBy: { name: "asc" } },
      certifications: { orderBy: { issueDate: "desc" } },
      projects: { orderBy: { createdAt: "asc" } },
      languages: { orderBy: { name: "asc" } },
    },
  });
```

- [ ] **Step 2: Render the three new cards**

Change:
```tsx
      <PersonalInfoCard profile={profile} />
      <WorkExperienceCard experiences={profile.workExperiences} />
      <EducationCard educations={profile.educations} />
      <SkillsCard skills={profile.skills} />
```
to:
```tsx
      <PersonalInfoCard profile={profile} />
      <WorkExperienceCard experiences={profile.workExperiences} />
      <EducationCard educations={profile.educations} />
      <SkillsCard skills={profile.skills} />
      <CertificationsCard certifications={profile.certifications} />
      <ProjectsCard projects={profile.projects} />
      <LanguagesCard languages={profile.languages} />
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/profile/page.tsx"
git commit -m "feat: wire Certifications, Projects, and Languages cards into the Profile page"
```

---

## Task 12: Resume Builder Server Actions — create and delete

**Files:**
- Create: `src/app/[locale]/(app)/resume-builder/actions.ts`

**Interfaces:**
- Consumes: `buildContentFromProfile` (Task 5), `ensureProfileRecord` (existing), `encryptId` (existing `@/lib/id-crypto`).
- Produces: `createResumeDocument(): Promise<{ token: string } | { error: string }>`, `deleteResumeDocument(id: string): Promise<{ success: true } | { error: string }>` — consumed by Task 14's list page.

- [ ] **Step 1: Implement**

`src/app/[locale]/(app)/resume-builder/actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { ensureProfileRecord } from "@/lib/ensure-profile";
import { buildContentFromProfile } from "@/lib/resume-builder/build-content";

export async function createResumeDocument(): Promise<
  { token: string } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "not-authenticated" };

  await ensureProfileRecord(user.id);

  const profile = await db.profile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      workExperiences: { orderBy: { startDate: "desc" } },
      educations: { orderBy: { startDate: "desc" } },
      skills: { orderBy: { name: "asc" } },
      certifications: { orderBy: { issueDate: "desc" } },
      projects: { orderBy: { createdAt: "asc" } },
      languages: { orderBy: { name: "asc" } },
    },
  });

  const content = buildContentFromProfile(profile, user.email ?? "");

  const resumeDocument = await db.resumeDocument.create({
    data: {
      userId: user.id,
      title: "Resume Baru",
      content: JSON.parse(JSON.stringify(content)),
    },
  });

  return { token: encryptId(resumeDocument.id) };
}

export async function deleteResumeDocument(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "not-authenticated" };

  const existing = await db.resumeDocument.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  await db.resumeDocument.delete({ where: { id } });
  revalidatePath("/resume-builder");
  return { success: true };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/resume-builder/actions.ts"
git commit -m "feat: createResumeDocument and deleteResumeDocument Server Actions"
```

---

## Task 13: Bilingual messages — resumeBuilder namespace

**Files:**
- Modify: `messages/id.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: `nav.resumeBuilder`; the full `resumeBuilder` namespace — consumed by Tasks 14, 16-19, 21, 23-24.

- [ ] **Step 1: Add `nav.resumeBuilder` to `messages/id.json`**

In the `"nav"` block:
```json
"resumeBuilder": "Resume Builder",
```

- [ ] **Step 2: Add the `resumeBuilder` namespace to `messages/id.json`**, as a new top-level key:

```json
  "resumeBuilder": {
    "list": {
      "title": "Resume Builder",
      "description": "Buat resume ATS-safe dari data Profil Anda.",
      "empty": "Belum ada resume dibuat. Buat resume pertama Anda.",
      "newButton": "Buat Resume Baru",
      "tableTitle": "Judul",
      "tableDate": "Terakhir Diubah",
      "delete": "Hapus",
      "toastDeleteSuccess": "Resume dihapus",
      "toastDeleteError": "Gagal menghapus resume",
      "toastCreateError": "Gagal membuat resume"
    },
    "builder": {
      "titleLabel": "Judul Resume (internal, tidak muncul di PDF)",
      "contactInfoTitle": "Info Kontak",
      "fullNameLabel": "Nama Lengkap",
      "emailLabel": "Email",
      "phoneLabel": "Nomor Telepon",
      "locationLabel": "Lokasi",
      "linkedinLabel": "URL LinkedIn",
      "portfolioLabel": "URL Portofolio",
      "summaryTitle": "Ringkasan Profesional",
      "workExperienceTitle": "Pengalaman Kerja",
      "educationTitle": "Pendidikan",
      "skillsTitle": "Skills",
      "certificationsTitle": "Sertifikasi",
      "projectsTitle": "Proyek Unggulan",
      "languagesTitle": "Bahasa",
      "titleLabelField": "Jabatan",
      "companyLabel": "Perusahaan",
      "institutionLabel": "Institusi",
      "degreeLabel": "Gelar",
      "fieldOfStudyLabel": "Bidang Studi",
      "startDateLabel": "Tanggal Mulai",
      "endDateLabel": "Tanggal Selesai",
      "present": "Sekarang",
      "bulletsLabel": "Poin-poin",
      "addBulletButton": "Tambah Poin",
      "removeBulletLabel": "Hapus poin",
      "issuerLabel": "Penerbit",
      "issueDateLabel": "Tanggal Terbit",
      "urlLabel": "URL",
      "clientLabel": "Klien",
      "roleLabel": "Peran",
      "techStackLabel": "Tech Stack (pisahkan dengan koma)",
      "categoryLabel": "Kategori",
      "proficiencyLabel": "Level",
      "nameLabel": "Nama",
      "addEntryButton": "Tambah Entri",
      "removeEntryLabel": "Hapus entri",
      "enhanceButton": "Enhance dengan AI",
      "enhancing": "Menyusun ulang...",
      "aiSuggestionTitle": "Saran AI",
      "applyAll": "Terapkan Semua",
      "discardSuggestion": "Batalkan",
      "toastEnhanceError": "Gagal menyusun ulang. Coba lagi sebentar lagi.",
      "saveButton": "Simpan Perubahan",
      "saving": "Menyimpan...",
      "toastSaveSuccess": "Resume disimpan",
      "toastSaveError": "Gagal menyimpan resume",
      "previewButton": "Preview",
      "downloadButton": "Download PDF",
      "backToList": "Kembali ke daftar"
    }
  },
```

- [ ] **Step 3: Mirror both additions in `messages/en.json`**

`"resumeBuilder": "Resume Builder",` in `"nav"`, and:

```json
  "resumeBuilder": {
    "list": {
      "title": "Resume Builder",
      "description": "Build ATS-safe resumes from your Profile data.",
      "empty": "No resumes yet. Create your first one.",
      "newButton": "Create New Resume",
      "tableTitle": "Title",
      "tableDate": "Last Updated",
      "delete": "Delete",
      "toastDeleteSuccess": "Resume deleted",
      "toastDeleteError": "Failed to delete resume",
      "toastCreateError": "Failed to create resume"
    },
    "builder": {
      "titleLabel": "Resume Title (internal, not shown on the PDF)",
      "contactInfoTitle": "Contact Info",
      "fullNameLabel": "Full Name",
      "emailLabel": "Email",
      "phoneLabel": "Phone Number",
      "locationLabel": "Location",
      "linkedinLabel": "LinkedIn URL",
      "portfolioLabel": "Portfolio URL",
      "summaryTitle": "Professional Summary",
      "workExperienceTitle": "Work Experience",
      "educationTitle": "Education",
      "skillsTitle": "Skills",
      "certificationsTitle": "Certifications",
      "projectsTitle": "Highlight Projects",
      "languagesTitle": "Languages",
      "titleLabelField": "Job Title",
      "companyLabel": "Company",
      "institutionLabel": "Institution",
      "degreeLabel": "Degree",
      "fieldOfStudyLabel": "Field of Study",
      "startDateLabel": "Start Date",
      "endDateLabel": "End Date",
      "present": "Present",
      "bulletsLabel": "Bullet Points",
      "addBulletButton": "Add Bullet",
      "removeBulletLabel": "Remove bullet",
      "issuerLabel": "Issuer",
      "issueDateLabel": "Issue Date",
      "urlLabel": "URL",
      "clientLabel": "Client",
      "roleLabel": "Role",
      "techStackLabel": "Tech Stack (comma-separated)",
      "categoryLabel": "Category",
      "proficiencyLabel": "Proficiency",
      "nameLabel": "Name",
      "addEntryButton": "Add Entry",
      "removeEntryLabel": "Remove entry",
      "enhanceButton": "Enhance with AI",
      "enhancing": "Rewriting...",
      "aiSuggestionTitle": "AI Suggestion",
      "applyAll": "Apply All",
      "discardSuggestion": "Discard",
      "toastEnhanceError": "Couldn't rewrite that. Try again shortly.",
      "saveButton": "Save Changes",
      "saving": "Saving...",
      "toastSaveSuccess": "Resume saved",
      "toastSaveError": "Failed to save resume",
      "previewButton": "Preview",
      "downloadButton": "Download PDF",
      "backToList": "Back to list"
    }
  },
```

- [ ] **Step 4: Verify both files are still valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/id.json', 'utf8')); JSON.parse(require('fs').readFileSync('messages/en.json', 'utf8')); console.log('valid')"`
Expected: `valid`

- [ ] **Step 5: Commit**

```bash
git add messages/id.json messages/en.json
git commit -m "feat: bilingual messages for the Resume Builder"
```

---

## Task 14: /resume-builder list page

**Files:**
- Create: `src/app/[locale]/(app)/resume-builder/page.tsx`
- Create: `src/components/resume-builder/create-resume-button.tsx`
- Create: `src/components/resume-builder/delete-resume-button.tsx`

**Interfaces:**
- Consumes: `createResumeDocument`, `deleteResumeDocument` (Task 12).

- [ ] **Step 1: Implement the "create" client component**

A client component is needed because `createResumeDocument()` returns a token and the page must navigate to it — this can't be a plain link since the document doesn't exist until the action runs.

`src/components/resume-builder/create-resume-button.tsx`:
```tsx
"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { toast } from "@/components/ui/toast";
import { createResumeDocument } from "@/app/[locale]/(app)/resume-builder/actions";

export function CreateResumeButton() {
  const t = useTranslations("resumeBuilder.list");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createResumeDocument();
      if ("error" in result) {
        toast.add({ title: t("toastCreateError"), type: "error" });
        return;
      }
      router.push(`/resume-builder/${result.token}`);
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      <Plus className="size-4" />
      {t("newButton")}
    </Button>
  );
}
```

- [ ] **Step 2: Implement the "delete" client component**

`src/components/resume-builder/delete-resume-button.tsx`:
```tsx
"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteResumeDocument } from "@/app/[locale]/(app)/resume-builder/actions";

export function DeleteResumeButton({ id }: { id: string }) {
  const t = useTranslations("resumeBuilder.list");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteResumeDocument(id);
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

- [ ] **Step 3: Implement the list page**

`src/app/[locale]/(app)/resume-builder/page.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { CreateResumeButton } from "@/components/resume-builder/create-resume-button";
import { DeleteResumeButton } from "@/components/resume-builder/delete-resume-button";

export default async function ResumeBuilderListPage() {
  const t = await getTranslations("resumeBuilder.list");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resumeDocuments = user
    ? await db.resumeDocument.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <CreateResumeButton />
      </div>

      {resumeDocuments.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-2 gap-4 border-b border-border bg-muted/50 p-4 text-xs font-medium text-muted-foreground">
            <span>{t("tableTitle")}</span>
            <span>{t("tableDate")}</span>
          </div>
          {resumeDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 border-b border-border p-4 text-sm transition-colors last:border-0 hover:bg-muted"
            >
              <Link
                href={`/resume-builder/${encryptId(doc.id)}`}
                className="grid flex-1 grid-cols-2 items-center gap-4"
              >
                <span className="truncate font-medium">{doc.title}</span>
                <span className="text-muted-foreground">
                  {doc.updatedAt.toLocaleDateString()}
                </span>
              </Link>
              <DeleteResumeButton id={doc.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: succeeds, `/[locale]/resume-builder` appears in the route list.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(app)/resume-builder/page.tsx" src/components/resume-builder/create-resume-button.tsx src/components/resume-builder/delete-resume-button.tsx
git commit -m "feat: Resume Builder list page with delete"
```

---

## Task 15: updateResumeContent Server Action

**Files:**
- Modify: `src/app/[locale]/(app)/resume-builder/actions.ts`

**Interfaces:**
- Consumes: `resumeContentSchema` (Task 4).
- Produces: `updateResumeContent(id: string, title: string, content: ResumeContentInput): Promise<{ success: true } | { error: string }>` — consumed by Task 16's builder page.

- [ ] **Step 1: Add the import and the action**

Add to the top of `src/app/[locale]/(app)/resume-builder/actions.ts`:
```ts
import { resumeContentSchema, type ResumeContentInput } from "@/lib/validations/resume-content";
```

Append:
```ts
export async function updateResumeContent(
  id: string,
  title: string,
  content: ResumeContentInput
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "not-authenticated" };

  const existing = await db.resumeDocument.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  const parsed = resumeContentSchema.safeParse(content);
  if (!parsed.success) return { error: "validation-failed" };

  if (!title.trim()) return { error: "validation-failed" };

  await db.resumeDocument.update({
    where: { id },
    data: {
      title,
      content: JSON.parse(JSON.stringify(parsed.data)),
    },
  });

  revalidatePath("/resume-builder");
  return { success: true };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/resume-builder/actions.ts"
git commit -m "feat: updateResumeContent Server Action"
```

---

## Task 16: Builder page shell — ContactInfoCard and SummaryCard

**Files:**
- Create: `src/app/[locale]/(app)/resume-builder/[id]/page.tsx`
- Create: `src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx`
- Create: `src/components/resume-builder/contact-info-card.tsx`
- Create: `src/components/resume-builder/summary-card.tsx`

**Interfaces:**
- Consumes: `ResumeContent` (Task 2), `updateResumeContent` (Task 15), `decryptId` (existing).
- Produces: `BuilderClient` (the top-level client component holding `content` state, consumed internally by this task and extended by Tasks 17-19 to render the remaining section cards). `ContactInfoCard` (props `{ personalInfo: PersonalInfo; onChange: (personalInfo: PersonalInfo) => void }`). `SummaryCard` (props `{ summary: string; onChange: (summary: string) => void }`).

- [ ] **Step 1: Implement ContactInfoCard**

`src/components/resume-builder/contact-info-card.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PersonalInfo } from "@/lib/resume-builder/types";

interface ContactInfoCardProps {
  personalInfo: PersonalInfo;
  onChange: (personalInfo: PersonalInfo) => void;
}

export function ContactInfoCard({ personalInfo, onChange }: ContactInfoCardProps) {
  const t = useTranslations("resumeBuilder.builder");

  function handleFieldChange(field: keyof PersonalInfo, value: string) {
    onChange({ ...personalInfo, [field]: value });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("contactInfoTitle")}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rb-fullName">{t("fullNameLabel")}</Label>
          <Input
            id="rb-fullName"
            value={personalInfo.fullName}
            onChange={(e) => handleFieldChange("fullName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-email">{t("emailLabel")}</Label>
          <Input
            id="rb-email"
            value={personalInfo.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-phone">{t("phoneLabel")}</Label>
          <Input
            id="rb-phone"
            value={personalInfo.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-location">{t("locationLabel")}</Label>
          <Input
            id="rb-location"
            value={personalInfo.location}
            onChange={(e) => handleFieldChange("location", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-linkedin">{t("linkedinLabel")}</Label>
          <Input
            id="rb-linkedin"
            value={personalInfo.linkedinUrl}
            onChange={(e) => handleFieldChange("linkedinUrl", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-portfolio">{t("portfolioLabel")}</Label>
          <Input
            id="rb-portfolio"
            value={personalInfo.portfolioUrl}
            onChange={(e) => handleFieldChange("portfolioUrl", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement SummaryCard**

`src/components/resume-builder/summary-card.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";

interface SummaryCardProps {
  summary: string;
  onChange: (summary: string) => void;
}

export function SummaryCard({ summary, onChange }: SummaryCardProps) {
  const t = useTranslations("resumeBuilder.builder");

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("summaryTitle")}</h2>
      <textarea
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-4 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}
```

- [ ] **Step 3: Implement the server page**

`src/app/[locale]/(app)/resume-builder/[id]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import type { ResumeContent } from "@/lib/resume-builder/types";
import { BuilderClient } from "./builder-client";

export default async function ResumeBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: token } = await params;

  const resumeDocumentId = decryptId(token);
  if (!resumeDocumentId) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const resumeDocument = await db.resumeDocument.findUnique({
    where: { id: resumeDocumentId },
  });

  if (!resumeDocument || resumeDocument.userId !== user.id) {
    notFound();
  }

  return (
    <BuilderClient
      id={resumeDocument.id}
      token={token}
      initialTitle={resumeDocument.title}
      initialContent={resumeDocument.content as unknown as ResumeContent}
    />
  );
}
```

- [ ] **Step 4: Implement the client shell**

`src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import type { ResumeContent } from "@/lib/resume-builder/types";
import { updateResumeContent } from "@/app/[locale]/(app)/resume-builder/actions";
import { ContactInfoCard } from "@/components/resume-builder/contact-info-card";
import { SummaryCard } from "@/components/resume-builder/summary-card";

interface BuilderClientProps {
  id: string;
  token: string;
  initialTitle: string;
  initialContent: ResumeContent;
}

export function BuilderClient({ id, token, initialTitle, initialContent }: BuilderClientProps) {
  const t = useTranslations("resumeBuilder.builder");
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<ResumeContent>(initialContent);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateResumeContent(id, title, content);
      if ("error" in result) {
        toast.add({ title: t("toastSaveError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastSaveSuccess"), type: "success" });
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/resume-builder" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; {t("backToList")}
        </Link>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="rb-title">{t("titleLabel")}</Label>
          <Input id="rb-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      <ContactInfoCard
        personalInfo={content.personalInfo}
        onChange={(personalInfo) => setContent({ ...content, personalInfo })}
      />
      <SummaryCard
        summary={content.summary}
        onChange={(summary) => setContent({ ...content, summary })}
      />

      <div className="flex items-center justify-between rounded-2xl border border-border p-6">
        <div className="flex gap-3">
          <Button
            variant="outline"
            render={<a href={`/resume-builder/${token}/pdf`} target="_blank" rel="noreferrer" />}
            nativeButton={false}
          >
            {t("previewButton")}
          </Button>
          <Button
            variant="outline"
            render={<a href={`/resume-builder/${token}/pdf`} download={`${title}.pdf`} />}
            nativeButton={false}
          >
            {t("downloadButton")}
          </Button>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t("saving") : t("saveButton")}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: succeeds (the Preview/Download links point at a route that doesn't exist yet — Task 23 — that's fine, it's a client-side `<a>` href, not a build-time dependency).

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(app)/resume-builder/[id]/page.tsx" "src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx" src/components/resume-builder/contact-info-card.tsx src/components/resume-builder/summary-card.tsx
git commit -m "feat: Resume Builder page shell with Contact Info and Summary cards"
```

---

## Task 17: WorkExperienceSection component (no AI yet)

**Files:**
- Create: `src/components/resume-builder/work-experience-section.tsx`
- Modify: `src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx`

**Interfaces:**
- Consumes: `WorkExperienceEntry` (Task 2).
- Produces: `WorkExperienceSection` (props `{ entries: WorkExperienceEntry[]; onChange: (entries: WorkExperienceEntry[]) => void }`) — consumed by `BuilderClient` (this task) and extended with AI Enhance in Task 21.

- [ ] **Step 1: Implement**

`src/components/resume-builder/work-experience-section.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkExperienceEntry } from "@/lib/resume-builder/types";

interface WorkExperienceSectionProps {
  entries: WorkExperienceEntry[];
  onChange: (entries: WorkExperienceEntry[]) => void;
}

function emptyEntry(): WorkExperienceEntry {
  return {
    id: crypto.randomUUID(),
    title: "",
    company: "",
    location: "",
    startDate: null,
    endDate: null,
    bullets: [],
  };
}

export function WorkExperienceSection({ entries, onChange }: WorkExperienceSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function updateEntry(id: string, patch: Partial<WorkExperienceEntry>) {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function addEntry() {
    onChange([...entries, emptyEntry()]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  function updateBullet(entryId: string, index: number, value: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    const bullets = entry.bullets.map((b, i) => (i === index ? value : b));
    updateEntry(entryId, { bullets });
  }

  function addBullet(entryId: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { bullets: [...entry.bullets, ""] });
  }

  function removeBullet(entryId: string, index: number) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { bullets: entry.bullets.filter((_, i) => i !== index) });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("workExperienceTitle")}</h2>
        <Button variant="outline" size="sm" onClick={addEntry}>
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`we-title-${entry.id}`}>{t("titleLabelField")}</Label>
                  <Input
                    id={`we-title-${entry.id}`}
                    value={entry.title}
                    onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`we-company-${entry.id}`}>{t("companyLabel")}</Label>
                  <Input
                    id={`we-company-${entry.id}`}
                    value={entry.company}
                    onChange={(e) => updateEntry(entry.id, { company: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`we-location-${entry.id}`}>{t("locationLabel")}</Label>
                  <Input
                    id={`we-location-${entry.id}`}
                    value={entry.location}
                    onChange={(e) => updateEntry(entry.id, { location: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`we-start-${entry.id}`}>{t("startDateLabel")}</Label>
                    <Input
                      id={`we-start-${entry.id}`}
                      type="date"
                      value={entry.startDate ?? ""}
                      onChange={(e) =>
                        updateEntry(entry.id, { startDate: e.target.value || null })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`we-end-${entry.id}`}>{t("endDateLabel")}</Label>
                    <Input
                      id={`we-end-${entry.id}`}
                      type="date"
                      value={entry.endDate ?? ""}
                      onChange={(e) => updateEntry(entry.id, { endDate: e.target.value || null })}
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeEntry(entry.id)}
                aria-label={t("removeEntryLabel")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              <Label>{t("bulletsLabel")}</Label>
              {entry.bullets.map((bullet, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={bullet}
                    onChange={(e) => updateBullet(entry.id, index, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeBullet(entry.id, index)}
                    aria-label={t("removeBulletLabel")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addBullet(entry.id)}>
                <Plus className="size-4" />
                {t("addBulletButton")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `BuilderClient`**

In `src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx`, add the import:
```tsx
import { WorkExperienceSection } from "@/components/resume-builder/work-experience-section";
```

Insert right after the `<SummaryCard ... />` element:
```tsx
      <WorkExperienceSection
        entries={content.workExperiences}
        onChange={(workExperiences) => setContent({ ...content, workExperiences })}
      />
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/resume-builder/work-experience-section.tsx "src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx"
git commit -m "feat: WorkExperienceSection component for the Resume Builder"
```

---

## Task 18: EducationSection, SkillsSection, CertificationsSection, LanguagesSection

**Files:**
- Create: `src/components/resume-builder/education-section.tsx`
- Create: `src/components/resume-builder/skills-section.tsx`
- Create: `src/components/resume-builder/certifications-section.tsx`
- Create: `src/components/resume-builder/languages-section.tsx`
- Modify: `src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx`

**Interfaces:**
- Consumes: `EducationEntry`, `SkillEntry`, `CertificationEntry`, `LanguageEntry` (Task 2).
- Produces: `EducationSection` (props `{ entries: EducationEntry[]; onChange: (entries: EducationEntry[]) => void }`), `SkillsSection` (props `{ entries: SkillEntry[]; onChange: (entries: SkillEntry[]) => void }`), `CertificationsSection` (props `{ entries: CertificationEntry[]; onChange: (entries: CertificationEntry[]) => void }`), `LanguagesSection` (props `{ entries: LanguageEntry[]; onChange: (entries: LanguageEntry[]) => void }`) — all consumed by `BuilderClient`.

- [ ] **Step 1: Implement EducationSection**

`src/components/resume-builder/education-section.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EducationEntry } from "@/lib/resume-builder/types";

interface EducationSectionProps {
  entries: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
}

function emptyEntry(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
    fieldOfStudy: "",
    location: "",
    startDate: null,
    endDate: null,
    bullets: [],
  };
}

export function EducationSection({ entries, onChange }: EducationSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function updateEntry(id: string, patch: Partial<EducationEntry>) {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function addEntry() {
    onChange([...entries, emptyEntry()]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("educationTitle")}</h2>
        <Button variant="outline" size="sm" onClick={addEntry}>
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-institution-${entry.id}`}>{t("institutionLabel")}</Label>
                  <Input
                    id={`ed-institution-${entry.id}`}
                    value={entry.institution}
                    onChange={(e) => updateEntry(entry.id, { institution: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-degree-${entry.id}`}>{t("degreeLabel")}</Label>
                  <Input
                    id={`ed-degree-${entry.id}`}
                    value={entry.degree}
                    onChange={(e) => updateEntry(entry.id, { degree: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-field-${entry.id}`}>{t("fieldOfStudyLabel")}</Label>
                  <Input
                    id={`ed-field-${entry.id}`}
                    value={entry.fieldOfStudy}
                    onChange={(e) => updateEntry(entry.id, { fieldOfStudy: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-location-${entry.id}`}>{t("locationLabel")}</Label>
                  <Input
                    id={`ed-location-${entry.id}`}
                    value={entry.location}
                    onChange={(e) => updateEntry(entry.id, { location: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-start-${entry.id}`}>{t("startDateLabel")}</Label>
                  <Input
                    id={`ed-start-${entry.id}`}
                    type="date"
                    value={entry.startDate ?? ""}
                    onChange={(e) =>
                      updateEntry(entry.id, { startDate: e.target.value || null })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-end-${entry.id}`}>{t("endDateLabel")}</Label>
                  <Input
                    id={`ed-end-${entry.id}`}
                    type="date"
                    value={entry.endDate ?? ""}
                    onChange={(e) => updateEntry(entry.id, { endDate: e.target.value || null })}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeEntry(entry.id)}
                aria-label={t("removeEntryLabel")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement SkillsSection**

`src/components/resume-builder/skills-section.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SkillEntry } from "@/lib/resume-builder/types";

interface SkillsSectionProps {
  entries: SkillEntry[];
  onChange: (entries: SkillEntry[]) => void;
}

export function SkillsSection({ entries, onChange }: SkillsSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function addEntry(name: string, category: string) {
    if (!name.trim()) return;
    onChange([...entries, { id: crypto.randomUUID(), name: name.trim(), category }]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("skillsTitle")}</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {entries.map((skill) => (
          <span
            key={skill.id}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
          >
            {skill.name}
            <button
              type="button"
              onClick={() => removeEntry(skill.id)}
              aria-label={t("removeEntryLabel")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>

      <form
        action={(formData) => {
          addEntry(String(formData.get("name") ?? ""), String(formData.get("category") ?? ""));
        }}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <div className="space-y-1.5">
          <label htmlFor="rb-skill-name" className="text-xs text-muted-foreground">
            {t("nameLabel")}
          </label>
          <Input id="rb-skill-name" name="name" required className="w-40" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="rb-skill-category" className="text-xs text-muted-foreground">
            {t("categoryLabel")}
          </label>
          <Input id="rb-skill-category" name="category" className="w-40" />
        </div>
        <Button type="submit" variant="outline" size="sm">
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Implement CertificationsSection**

`src/components/resume-builder/certifications-section.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CertificationEntry } from "@/lib/resume-builder/types";

interface CertificationsSectionProps {
  entries: CertificationEntry[];
  onChange: (entries: CertificationEntry[]) => void;
}

export function CertificationsSection({ entries, onChange }: CertificationsSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function addEntry(name: string, issuer: string, issueDate: string, url: string) {
    if (!name.trim() || !issuer.trim()) return;
    onChange([
      ...entries,
      { id: crypto.randomUUID(), name: name.trim(), issuer: issuer.trim(), issueDate: issueDate || null, url },
    ]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("certificationsTitle")}</h2>

      <div className="mt-6 space-y-4">
        {entries.map((cert) => (
          <div
            key={cert.id}
            className="flex items-start justify-between gap-4 rounded-2xl border border-border p-6"
          >
            <div>
              <h3 className="font-medium">{cert.name}</h3>
              <p className="text-sm text-muted-foreground">{cert.issuer}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeEntry(cert.id)}
              aria-label={t("removeEntryLabel")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <form
        action={(formData) => {
          addEntry(
            String(formData.get("name") ?? ""),
            String(formData.get("issuer") ?? ""),
            String(formData.get("issueDate") ?? ""),
            String(formData.get("url") ?? "")
          );
        }}
        className="mt-6 grid gap-4 rounded-2xl border border-border p-6 sm:grid-cols-2"
      >
        <Input name="name" placeholder={t("nameLabel")} required />
        <Input name="issuer" placeholder={t("issuerLabel")} required />
        <Input name="issueDate" type="date" placeholder={t("issueDateLabel")} />
        <Input name="url" placeholder={t("urlLabel")} />
        <Button type="submit" variant="outline" size="sm" className="sm:col-span-2">
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Implement LanguagesSection**

`src/components/resume-builder/languages-section.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LanguageEntry } from "@/lib/resume-builder/types";

interface LanguagesSectionProps {
  entries: LanguageEntry[];
  onChange: (entries: LanguageEntry[]) => void;
}

export function LanguagesSection({ entries, onChange }: LanguagesSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function addEntry(name: string, proficiency: string) {
    if (!name.trim() || !proficiency.trim()) return;
    onChange([...entries, { id: crypto.randomUUID(), name: name.trim(), proficiency: proficiency.trim() }]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("languagesTitle")}</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {entries.map((lang) => (
          <span
            key={lang.id}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
          >
            {lang.name} &middot; {lang.proficiency}
            <button
              type="button"
              onClick={() => removeEntry(lang.id)}
              aria-label={t("removeEntryLabel")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>

      <form
        action={(formData) => {
          addEntry(String(formData.get("name") ?? ""), String(formData.get("proficiency") ?? ""));
        }}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <div className="space-y-1.5">
          <label htmlFor="rb-lang-name" className="text-xs text-muted-foreground">
            {t("nameLabel")}
          </label>
          <Input id="rb-lang-name" name="name" required className="w-40" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="rb-lang-proficiency" className="text-xs text-muted-foreground">
            {t("proficiencyLabel")}
          </label>
          <Input id="rb-lang-proficiency" name="proficiency" required className="w-40" />
        </div>
        <Button type="submit" variant="outline" size="sm">
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Wire all four into `BuilderClient`**

In `src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx`, add imports:
```tsx
import { EducationSection } from "@/components/resume-builder/education-section";
import { SkillsSection } from "@/components/resume-builder/skills-section";
import { CertificationsSection } from "@/components/resume-builder/certifications-section";
import { LanguagesSection } from "@/components/resume-builder/languages-section";
```

Insert right after the `<WorkExperienceSection ... />` element:
```tsx
      <EducationSection
        entries={content.educations}
        onChange={(educations) => setContent({ ...content, educations })}
      />
      <SkillsSection
        entries={content.skills}
        onChange={(skills) => setContent({ ...content, skills })}
      />
      <CertificationsSection
        entries={content.certifications}
        onChange={(certifications) => setContent({ ...content, certifications })}
      />
      <LanguagesSection
        entries={content.languages}
        onChange={(languages) => setContent({ ...content, languages })}
      />
```

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/resume-builder/education-section.tsx src/components/resume-builder/skills-section.tsx src/components/resume-builder/certifications-section.tsx src/components/resume-builder/languages-section.tsx "src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx"
git commit -m "feat: Education, Skills, Certifications, Languages sections for the Resume Builder"
```

---

## Task 19: ProjectsSection component

**Files:**
- Create: `src/components/resume-builder/projects-section.tsx`
- Modify: `src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx`

**Interfaces:**
- Consumes: `ProjectEntry` (Task 2).
- Produces: `ProjectsSection` (props `{ entries: ProjectEntry[]; onChange: (entries: ProjectEntry[]) => void }`) — consumed by `BuilderClient`.

- [ ] **Step 1: Implement**

`src/components/resume-builder/projects-section.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectEntry } from "@/lib/resume-builder/types";

interface ProjectsSectionProps {
  entries: ProjectEntry[];
  onChange: (entries: ProjectEntry[]) => void;
}

function emptyEntry(): ProjectEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    client: "",
    role: "",
    bullets: [],
    techStack: [],
  };
}

export function ProjectsSection({ entries, onChange }: ProjectsSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function updateEntry(id: string, patch: Partial<ProjectEntry>) {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function addEntry() {
    onChange([...entries, emptyEntry()]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  function updateBullet(entryId: string, index: number, value: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { bullets: entry.bullets.map((b, i) => (i === index ? value : b)) });
  }

  function addBullet(entryId: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { bullets: [...entry.bullets, ""] });
  }

  function removeBullet(entryId: string, index: number) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { bullets: entry.bullets.filter((_, i) => i !== index) });
  }

  function updateTechStack(entryId: string, value: string) {
    updateEntry(entryId, {
      techStack: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("projectsTitle")}</h2>
        <Button variant="outline" size="sm" onClick={addEntry}>
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`pr-name-${entry.id}`}>{t("nameLabel")}</Label>
                  <Input
                    id={`pr-name-${entry.id}`}
                    value={entry.name}
                    onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`pr-client-${entry.id}`}>{t("clientLabel")}</Label>
                  <Input
                    id={`pr-client-${entry.id}`}
                    value={entry.client}
                    onChange={(e) => updateEntry(entry.id, { client: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`pr-role-${entry.id}`}>{t("roleLabel")}</Label>
                  <Input
                    id={`pr-role-${entry.id}`}
                    value={entry.role}
                    onChange={(e) => updateEntry(entry.id, { role: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`pr-tech-${entry.id}`}>{t("techStackLabel")}</Label>
                  <Input
                    id={`pr-tech-${entry.id}`}
                    value={entry.techStack.join(", ")}
                    onChange={(e) => updateTechStack(entry.id, e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeEntry(entry.id)}
                aria-label={t("removeEntryLabel")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              <Label>{t("bulletsLabel")}</Label>
              {entry.bullets.map((bullet, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={bullet}
                    onChange={(e) => updateBullet(entry.id, index, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeBullet(entry.id, index)}
                    aria-label={t("removeBulletLabel")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addBullet(entry.id)}>
                <Plus className="size-4" />
                {t("addBulletButton")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `BuilderClient`**

In `src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx`, add:
```tsx
import { ProjectsSection } from "@/components/resume-builder/projects-section";
```

Insert right after `<SkillsSection ... />`:
```tsx
      <ProjectsSection
        entries={content.projects}
        onChange={(projects) => setContent({ ...content, projects })}
      />
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/resume-builder/projects-section.tsx "src/app/[locale]/(app)/resume-builder/[id]/builder-client.tsx"
git commit -m "feat: ProjectsSection component for the Resume Builder"
```

---

## Task 20: Gemini integration — enhanceBullets

**Files:**
- Create: `src/lib/resume-builder/enhance-bullets.ts`
- Modify: `src/app/[locale]/(app)/resume-builder/actions.ts`

**Interfaces:**
- Consumes: `GEMINI_API_KEY` env var, `@google/genai`.
- Produces: `enhanceBullets({ title, company, bullets }: { title: string; company: string; bullets: string[] }): Promise<string[]>` (throws on failure — caller wraps it) — consumed by the `enhanceWorkExperienceBullets` Server Action (this task) and Task 21's UI.

- [ ] **Step 1: Install the SDK**

Run: `npm install @google/genai`
Expected: adds `@google/genai` to `package.json` dependencies.

- [ ] **Step 2: Implement the enhancement function**

`src/lib/resume-builder/enhance-bullets.ts`:
```ts
import { GoogleGenAI, Type } from "@google/genai";

interface EnhanceBulletsInput {
  title: string;
  company: string;
  bullets: string[];
}

export async function enhanceBullets({
  title,
  company,
  bullets,
}: EnhanceBulletsInput): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `Rewrite the following resume bullet points for a "${title}" role at "${company}" into polished, professional resume language.

Hard rules:
- Never invent achievements, metrics, or numbers that are not already present in the input bullets.
- Return exactly ${bullets.length} bullet(s), one rewritten version per input bullet, in the same order.
- Do not merge, split, summarize, or add bullets.

Input bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 512,
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new Error("Malformed response shape from Gemini");
  }

  return parsed;
}
```

- [ ] **Step 3: Add the Server Action**

In `src/app/[locale]/(app)/resume-builder/actions.ts`, add the import:
```ts
import { enhanceBullets } from "@/lib/resume-builder/enhance-bullets";
```

Append:
```ts
export async function enhanceWorkExperienceBullets(
  title: string,
  company: string,
  bullets: string[]
): Promise<{ success: true; enhancedBullets: string[] } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "not-authenticated" };
  if (bullets.length === 0) return { error: "no-bullets" };

  try {
    const enhancedBullets = await enhanceBullets({ title, company, bullets });
    return { success: true, enhancedBullets };
  } catch (err) {
    console.error("[resume-builder] Failed to enhance bullets:", err);
    return { error: "enhancement-failed" };
  }
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/resume-builder/enhance-bullets.ts "src/app/[locale]/(app)/resume-builder/actions.ts"
git commit -m "feat: Gemini-powered bullet enhancement (free tier, thinking disabled)"
```

---

## Task 21: Wire AI Enhance into WorkExperienceSection

**Files:**
- Modify: `src/components/resume-builder/work-experience-section.tsx`

**Interfaces:**
- Consumes: `enhanceWorkExperienceBullets` (Task 20).

This task gives each Work Experience entry a visible, controllable AI Enhance flow: a clearly labeled button with a distinct loading state, the AI's suggestion shown in its own highlighted block (never silently overwriting the original), and one explicit choice — apply everything or discard it.

- [ ] **Step 1: Add local per-entry suggestion state and the enhance handler**

In `src/components/resume-builder/work-experience-section.tsx`, change the imports:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import type { WorkExperienceEntry } from "@/lib/resume-builder/types";
import { enhanceWorkExperienceBullets } from "@/app/[locale]/(app)/resume-builder/actions";
```

Inside the `WorkExperienceSection` function, right after `const t = useTranslations("resumeBuilder.builder");`, add:
```tsx
  const [isEnhancing, startEnhance] = useTransition();
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});

  function handleEnhance(entry: WorkExperienceEntry) {
    if (entry.bullets.filter((b) => b.trim()).length === 0) return;

    startEnhance(async () => {
      const result = await enhanceWorkExperienceBullets(
        entry.title,
        entry.company,
        entry.bullets
      );
      if ("error" in result) {
        toast.add({ title: t("toastEnhanceError"), type: "error" });
        return;
      }
      setSuggestions((prev) => ({ ...prev, [entry.id]: result.enhancedBullets }));
    });
  }

  function applySuggestion(entryId: string) {
    const suggested = suggestions[entryId];
    if (!suggested) return;
    updateEntry(entryId, { bullets: suggested });
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
  }

  function discardSuggestion(entryId: string) {
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
  }
```

- [ ] **Step 2: Add the Enhance button and suggestion block to each entry**

In the JSX, replace the bullets block (`<div className="mt-4 space-y-2">...</div>`) with this expanded version, which wraps "Add Bullet" and the new "Enhance" button together and adds a suggestion block as a sibling right after:

```tsx
            <div className="mt-4 space-y-2">
              <Label>{t("bulletsLabel")}</Label>
              {entry.bullets.map((bullet, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={bullet}
                    onChange={(e) => updateBullet(entry.id, index, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeBullet(entry.id, index)}
                    aria-label={t("removeBulletLabel")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => addBullet(entry.id)}>
                  <Plus className="size-4" />
                  {t("addBulletButton")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEnhance(entry)}
                  disabled={isEnhancing}
                >
                  <Sparkles className="size-4" />
                  {isEnhancing ? t("enhancing") : t("enhanceButton")}
                </Button>
              </div>
            </div>

            {suggestions[entry.id] && (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-medium">{t("aiSuggestionTitle")}</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                  {suggestions[entry.id].map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => applySuggestion(entry.id)}>
                    {t("applyAll")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => discardSuggestion(entry.id)}
                  >
                    {t("discardSuggestion")}
                  </Button>
                </div>
              </div>
            )}
```

Both blocks stay inside the entry's outer `<div key={entry.id} ...>` — the suggestion block is a new sibling immediately after the bullets `<div>`, still before that outer div's closing tag.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/resume-builder/work-experience-section.tsx
git commit -m "feat: AI Enhance UI for Work Experience bullets"
```

---

## Task 22: PDF template component

**Files:**
- Create: `src/lib/resume-builder/pdf-template.tsx`

**Interfaces:**
- Consumes: `ResumeContent` (Task 2), `formatMonthYear` (Task 2), `@react-pdf/renderer`.
- Produces: `ResumePdfDocument` (a `@react-pdf/renderer` component, props `{ content: ResumeContent }`) — consumed by Task 23's route handler.

- [ ] **Step 1: Install `@react-pdf/renderer`**

Run: `npm install @react-pdf/renderer`
Expected: adds `@react-pdf/renderer` to `package.json` dependencies.

- [ ] **Step 2: Implement the template**

`src/lib/resume-builder/pdf-template.tsx`:
```tsx
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ResumeContent } from "./types";
import { formatMonthYear } from "./format-date";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#000000" },
  name: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  contactLine: { fontSize: 9, color: "#333333", marginBottom: 12 },
  sectionHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    marginTop: 12,
    marginBottom: 6,
  },
  entryRow: { flexDirection: "row", justifyContent: "space-between" },
  entryTitle: { fontFamily: "Helvetica-Bold" },
  entrySubtitle: { fontStyle: "italic", color: "#333333", marginBottom: 2 },
  bullet: { marginLeft: 10, marginTop: 2 },
  paragraph: { marginTop: 2, lineHeight: 1.4 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
  tag: { marginRight: 8 },
});

function contactParts(content: ResumeContent): string[] {
  return [
    content.personalInfo.location,
    content.personalInfo.phone,
    content.personalInfo.email,
    content.personalInfo.linkedinUrl,
    content.personalInfo.portfolioUrl,
  ].filter(Boolean);
}

function dateRange(startDate: string | null, endDate: string | null): string {
  const start = formatMonthYear(startDate);
  const end = endDate ? formatMonthYear(endDate) : "Present";
  return start ? `${start} - ${end}` : "";
}

export function ResumePdfDocument({ content }: { content: ResumeContent }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{content.personalInfo.fullName}</Text>
        <Text style={styles.contactLine}>{contactParts(content).join(" | ")}</Text>

        {content.summary && (
          <>
            <Text style={styles.sectionHeading}>Summary</Text>
            <Text style={styles.paragraph}>{content.summary}</Text>
          </>
        )}

        {content.workExperiences.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Work Experience</Text>
            {content.workExperiences.map((entry) => (
              <View key={entry.id} style={{ marginBottom: 8 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <Text>{dateRange(entry.startDate, entry.endDate)}</Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {[entry.company, entry.location].filter(Boolean).join(" | ")}
                </Text>
                {entry.bullets.map((bullet, i) => (
                  <Text key={i} style={styles.bullet}>
                    &bull; {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        {content.educations.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Education</Text>
            {content.educations.map((entry) => (
              <View key={entry.id} style={{ marginBottom: 8 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryTitle}>{entry.institution}</Text>
                  <Text>{dateRange(entry.startDate, entry.endDate)}</Text>
                </View>
                <Text style={styles.entrySubtitle}>
                  {[entry.degree, entry.fieldOfStudy, entry.location].filter(Boolean).join(" | ")}
                </Text>
                {entry.bullets.map((bullet, i) => (
                  <Text key={i} style={styles.bullet}>
                    &bull; {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        {content.skills.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Skills</Text>
            <Text style={styles.paragraph}>
              {content.skills.map((s) => s.name).join(", ")}
            </Text>
          </>
        )}

        {content.certifications.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Certifications</Text>
            {content.certifications.map((cert) => (
              <View key={cert.id} style={styles.entryRow}>
                <Text>
                  {cert.name} - {cert.issuer}
                </Text>
                <Text>{formatMonthYear(cert.issueDate)}</Text>
              </View>
            ))}
          </>
        )}

        {content.projects.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Highlight Projects</Text>
            {content.projects.map((proj) => (
              <View key={proj.id} style={{ marginBottom: 8 }}>
                <Text style={styles.entryTitle}>
                  {proj.name}
                  {proj.client ? ` - ${proj.client}` : ""}
                </Text>
                {proj.role && <Text style={styles.entrySubtitle}>{proj.role}</Text>}
                {proj.bullets.map((bullet, i) => (
                  <Text key={i} style={styles.bullet}>
                    &bull; {bullet}
                  </Text>
                ))}
                {proj.techStack.length > 0 && (
                  <Text style={styles.paragraph}>
                    Tech Stack: {proj.techStack.join(", ")}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {content.languages.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Languages</Text>
            <Text style={styles.paragraph}>
              {content.languages.map((l) => `${l.name} - ${l.proficiency}`).join(" | ")}
            </Text>
          </>
        )}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/resume-builder/pdf-template.tsx
git commit -m "feat: ATS-safe PDF template for the Resume Builder"
```

---

## Task 23: PDF route handler

**Files:**
- Create: `src/app/[locale]/(app)/resume-builder/[id]/pdf/route.tsx`

**Interfaces:**
- Consumes: `decryptId` (existing), `ResumePdfDocument` (Task 22).

- [ ] **Step 1: Implement**

This route handler renders JSX inline (`<ResumePdfDocument ... />`), so the file must be `route.tsx`, not `route.ts` — Next.js still recognizes `route.tsx` as a valid route handler filename, and JSX won't parse in a plain `.ts` file.

`renderToStream` returns a Node.js `Readable` stream (classic `.on('data')`/`.on('end')` event API), not a Web-standard `ReadableStream` — the two are not interchangeable, so it can't be passed directly as a `Response` body. `renderToBuffer` collects the same stream into a `Buffer` internally and is safe to hand to `Response` directly (`Buffer` is a `Uint8Array` subclass, a valid body type) — use that instead.

`src/app/[locale]/(app)/resume-builder/[id]/pdf/route.tsx`:
```ts
import { notFound } from "next/navigation";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import type { ResumeContent } from "@/lib/resume-builder/types";
import { ResumePdfDocument } from "@/lib/resume-builder/pdf-template";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: token } = await params;

  const resumeDocumentId = decryptId(token);
  if (!resumeDocumentId) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const resumeDocument = await db.resumeDocument.findUnique({
    where: { id: resumeDocumentId },
  });

  if (!resumeDocument || resumeDocument.userId !== user.id) {
    notFound();
  }

  const content = resumeDocument.content as unknown as ResumeContent;
  const buffer = await renderToBuffer(<ResumePdfDocument content={content} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${resumeDocument.title}.pdf"`,
    },
  });
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: succeeds, `/[locale]/resume-builder/[id]/pdf` appears in the route list.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/resume-builder/[id]/pdf/route.tsx"
git commit -m "feat: authenticated PDF route handler for the Resume Builder"
```

---

## Task 24: Link to /resume-builder from DashboardNav

**Files:**
- Modify: `src/components/layout/dashboard-nav.tsx`

- [ ] **Step 1: Add a Resume Builder link**

Change:
```tsx
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
            {t("profile")}
          </Link>
          <span className="text-sm text-muted-foreground">{userEmail}</span>
          <ThemeToggle />
          <Button variant="ghost" onClick={handleLogout}>
            {t("logout")}
          </Button>
        </div>
```
to:
```tsx
        <div className="flex items-center gap-4">
          <Link
            href="/resume-builder"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("resumeBuilder")}
          </Link>
          <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
            {t("profile")}
          </Link>
          <span className="text-sm text-muted-foreground">{userEmail}</span>
          <ThemeToggle />
          <Button variant="ghost" onClick={handleLogout}>
            {t("logout")}
          </Button>
        </div>
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/dashboard-nav.tsx
git commit -m "feat: link to Resume Builder from the dashboard nav"
```

---

## Task 25: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm run test`
Expected: all tests pass (this sub-project adds: `format-date.test.ts` 2, `profile.test.ts` additions ~9, `resume-content.test.ts` 4, `build-content.test.ts` 6 — plus every test from Phase 1, ATS Check, and Profile).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds, `/resume-builder`, `/resume-builder/[id]`, and `/resume-builder/[id]/pdf` all present in the route list.

- [ ] **Step 4: Manual smoke test**

This environment has no working browser driver (the Playwright MCP Bridge extension times out), so this step is a follow-up for the user to run themselves, not something verified automatically here:

- Go to `/profile`, fill in Summary, add a Certification, a Project, and a Language, confirm they save and persist across a reload
- Go to `/resume-builder`, click "Buat Resume Baru", confirm it redirects to the new resume pre-filled with your Profile data
- Edit the title, contact info, and summary; add/remove a work experience bullet; click "Enhance dengan AI" on a work experience entry and confirm the suggestion appears separately with Apply/Discard controls, and that Apply replaces the bullets while Discard leaves them untouched
- Click "Simpan Perubahan", confirm a success toast
- Click "Preview", confirm the PDF opens and looks correct (single column, no tables, sections in order)
- Click "Download PDF", open the downloaded file, select some text to confirm it's real (copyable) text, not an image
- Switch to `/en` and confirm the builder and list pages are in English

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: Resume Builder sub-project complete"
```

(Only if there are uncommitted changes — skip if the working tree is already clean.)
