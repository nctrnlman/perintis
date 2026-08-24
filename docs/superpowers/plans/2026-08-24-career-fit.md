# Career Fit ("Unlock Your Potential") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Career Fit module: a `/career-fit` flow that deterministically matches a user's Profile skills against a curated role taxonomy, uses AI only to explain an already-decided match in grounded natural language, and shows qualitative fit tiers (never fabricated-precision percentages).

**Architecture:** A static, hand-curated role taxonomy feeds a pure deterministic matching function (score → tier, no AI involved in the decision). The top matches are handed to a single batched Gemini call that only writes reasoning prose under strict no-fabrication rules — it never chooses which roles appear. Results are snapshotted into a new `PotentialAnalysis` model (JSON blob) so past runs stay a faithful record even as the taxonomy or profile change later.

**Tech Stack:** Next.js App Router, Prisma + Postgres (Supabase), Gemini via the existing `generateJson` helper, next-intl, this repo's existing `Button`/`Reveal`/toast UI primitives.

**Spec:** `docs/superpowers/specs/2026-08-24-career-fit-design.md`

## Global Constraints

- No fabrication anywhere: role-skill associations come from a human-curated static list, matching/tiering is pure arithmetic, and the AI is contractually only allowed to explain a decision already made — never assert market demand, salary, or hiring-volume claims (this is stated as a hard rule in the AI prompt itself).
- Qualitative tiers only (`STRONG`/`GOOD`/`WORTH_EXPLORING`) — never a numeric percentage score.
- This feature has **no user-input forms** — `/career-fit/new` is a single button, `/career-fit/[id]` is read-only. No Zod validation schemas are needed anywhere in this plan.
- Every DB read/write is scoped to the authenticated user (`userId` ownership check), matching every existing feature in this codebase.
- Route params for `/career-fit/[id]` use `encryptId`/`decryptId` (`src/lib/id-crypto.ts`), same as every other detail page.
- Server actions are colocated in `actions.ts`, `"use server"` at the top, ownership-checked before any mutation.
- TDD applies to pure logic (`matchRoles`, `buildCareerFitPrompt`) — this repo's established convention (verified this session) is that server actions and Gemini-calling wrappers are **not** unit-tested, only pure functions are; verified manually via `npm run dev` instead.
- Visual style: hairline `border-border`, `rounded-2xl` cards, `--primary`/tier-appropriate colors used sparingly — the Apple-centric language already established across this codebase.

---

### Task 1: Prisma schema and migration

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `PotentialAnalysis` model (`id`, `userId`, `results: Json`, `createdAt`) — every later task depends on this exact shape.

- [ ] **Step 1: Add the model to `prisma/schema.prisma`**

Add after the `InterviewRound` model (end of file):

```prisma
model PotentialAnalysis {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  results   Json
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: Add the reverse relation to `User`**

In `model User`, add to the relations block:

```prisma
  potentialAnalyses PotentialAnalysis[]
```

- [ ] **Step 3: Format and generate the migration**

Run: `npx prisma format`
Run: `npx prisma migrate dev --name add_career_fit`
Expected: a new folder under `prisma/migrations/` with a timestamp prefix and `add_career_fit` suffix; command exits 0.

- [ ] **Step 4: Verify the Prisma client regenerated correctly**

Run: `npx tsc --noEmit`
Expected: no errors (the generated Prisma client now exports `PotentialAnalysis`).

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add PotentialAnalysis Prisma model"
```

---

### Task 2: Role taxonomy (static data)

**Files:**
- Create: `src/lib/career-fit/role-taxonomy.ts`

**Interfaces:**
- Produces: `RoleArchetype` interface, `ROLE_TAXONOMY: RoleArchetype[]` — consumed by Task 3 (`matchRoles`) and Task 8 (server action).

- [ ] **Step 1: Write the taxonomy file**

```typescript
export interface RoleArchetype {
  id: string;
  title: string;
  category: string;
  commonSkills: string[];
}

export const ROLE_TAXONOMY: RoleArchetype[] = [
  // Engineering
  {
    id: "frontend-engineer",
    title: "Frontend Engineer",
    category: "Engineering",
    commonSkills: ["JavaScript", "TypeScript", "React", "CSS", "Git", "REST API"],
  },
  {
    id: "backend-engineer",
    title: "Backend Engineer",
    category: "Engineering",
    commonSkills: ["Node.js", "SQL", "REST API", "Git", "Docker", "System Design"],
  },
  {
    id: "full-stack-engineer",
    title: "Full-Stack Engineer",
    category: "Engineering",
    commonSkills: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git"],
  },
  {
    id: "mobile-engineer",
    title: "Mobile Engineer",
    category: "Engineering",
    commonSkills: ["Kotlin", "Swift", "Flutter", "REST API", "Git", "Mobile UI Design"],
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    category: "Engineering",
    commonSkills: ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "Git"],
  },
  {
    id: "qa-engineer",
    title: "QA Engineer",
    category: "Engineering",
    commonSkills: ["Test Automation", "Manual Testing", "Selenium", "Bug Tracking", "SQL"],
  },
  // Product
  {
    id: "product-manager",
    title: "Product Manager",
    category: "Product",
    commonSkills: ["Roadmapping", "User Research", "Stakeholder Management", "Analytics", "Agile"],
  },
  {
    id: "product-owner",
    title: "Product Owner",
    category: "Product",
    commonSkills: ["Backlog Management", "Agile", "Stakeholder Management", "User Stories"],
  },
  {
    id: "business-analyst",
    title: "Business Analyst",
    category: "Product",
    commonSkills: ["Requirements Gathering", "SQL", "Data Analysis", "Process Mapping", "Stakeholder Management"],
  },
  // Design
  {
    id: "ui-ux-designer",
    title: "UI/UX Designer",
    category: "Design",
    commonSkills: ["Figma", "User Research", "Wireframing", "Prototyping", "Design Systems"],
  },
  {
    id: "graphic-designer",
    title: "Graphic Designer",
    category: "Design",
    commonSkills: ["Adobe Illustrator", "Adobe Photoshop", "Typography", "Branding", "Layout Design"],
  },
  {
    id: "product-designer",
    title: "Product Designer",
    category: "Design",
    commonSkills: ["Figma", "User Research", "Prototyping", "Interaction Design", "Design Systems"],
  },
  // Data
  {
    id: "data-analyst",
    title: "Data Analyst",
    category: "Data",
    commonSkills: ["SQL", "Excel", "Data Visualization", "Statistics", "Python"],
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    category: "Data",
    commonSkills: ["Python", "Machine Learning", "Statistics", "SQL", "Data Visualization"],
  },
  {
    id: "data-engineer",
    title: "Data Engineer",
    category: "Data",
    commonSkills: ["SQL", "Python", "ETL", "Data Warehousing", "Cloud Platforms"],
  },
  // Marketing
  {
    id: "digital-marketing-specialist",
    title: "Digital Marketing Specialist",
    category: "Marketing",
    commonSkills: ["SEO", "Google Ads", "Content Marketing", "Social Media", "Analytics"],
  },
  {
    id: "content-marketing-specialist",
    title: "Content Marketing Specialist",
    category: "Marketing",
    commonSkills: ["Copywriting", "SEO", "Content Strategy", "Social Media", "Editing"],
  },
  {
    id: "social-media-manager",
    title: "Social Media Manager",
    category: "Marketing",
    commonSkills: ["Content Creation", "Social Media", "Community Management", "Analytics", "Copywriting"],
  },
  {
    id: "seo-specialist",
    title: "SEO Specialist",
    category: "Marketing",
    commonSkills: ["SEO", "Keyword Research", "Google Analytics", "Content Strategy", "Link Building"],
  },
  // Business & Finance
  {
    id: "financial-analyst",
    title: "Financial Analyst",
    category: "Business & Finance",
    commonSkills: ["Financial Modeling", "Excel", "Forecasting", "Data Analysis", "Accounting"],
  },
  {
    id: "accountant",
    title: "Accountant",
    category: "Business & Finance",
    commonSkills: ["Accounting", "Bookkeeping", "Tax Compliance", "Excel", "Financial Reporting"],
  },
  {
    id: "business-development",
    title: "Business Development",
    category: "Business & Finance",
    commonSkills: ["Sales", "Negotiation", "Relationship Management", "Market Research", "Presentation"],
  },
  // Operations
  {
    id: "operations-manager",
    title: "Operations Manager",
    category: "Operations",
    commonSkills: ["Process Improvement", "Project Management", "Team Leadership", "Vendor Management", "Budgeting"],
  },
  {
    id: "project-manager",
    title: "Project Manager",
    category: "Operations",
    commonSkills: ["Project Planning", "Agile", "Stakeholder Management", "Risk Management", "Budgeting"],
  },
  {
    id: "supply-chain-analyst",
    title: "Supply Chain Analyst",
    category: "Operations",
    commonSkills: ["Logistics", "Inventory Management", "Data Analysis", "Excel", "Forecasting"],
  },
  // HR
  {
    id: "hr-generalist",
    title: "HR Generalist",
    category: "HR",
    commonSkills: ["Recruitment", "Employee Relations", "Onboarding", "HR Policies", "Payroll"],
  },
  {
    id: "talent-acquisition-specialist",
    title: "Talent Acquisition Specialist",
    category: "HR",
    commonSkills: ["Recruitment", "Sourcing", "Interviewing", "Employer Branding", "Applicant Tracking Systems"],
  },
  {
    id: "l-and-d-specialist",
    title: "L&D Specialist",
    category: "HR",
    commonSkills: ["Training Design", "Facilitation", "Needs Assessment", "Onboarding", "Employee Development"],
  },
];
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/career-fit/role-taxonomy.ts
git commit -m "feat: add Career Fit role taxonomy"
```

---

### Task 3: Matching function (TDD)

**Files:**
- Create: `src/lib/career-fit/match-roles.ts`
- Test: `src/lib/career-fit/match-roles.test.ts`

**Interfaces:**
- Consumes: `RoleArchetype` from Task 2.
- Produces: `RoleMatch` interface (`roleId`, `title`, `category`, `tier: "STRONG"|"GOOD"|"WORTH_EXPLORING"`, `matchedSkills`, `missingSkills`), `matchRoles(userSkills: string[], roles: RoleArchetype[]): RoleMatch[]` — consumed by Task 8 (server action).

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { matchRoles, type RoleArchetype } from "./match-roles";

const FIVE_SKILL_ROLE: RoleArchetype = {
  id: "five-skill-role",
  title: "Five Skill Role",
  category: "Test",
  commonSkills: ["Skill A", "Skill B", "Skill C", "Skill D", "Skill E"],
};

const SEVEN_SKILL_ROLE: RoleArchetype = {
  id: "seven-skill-role",
  title: "Seven Skill Role",
  category: "Test",
  commonSkills: ["S1", "S2", "S3", "S4", "S5", "S6", "S7"],
};

describe("matchRoles", () => {
  it("returns an empty array when the user has no skills", () => {
    expect(matchRoles([], [FIVE_SKILL_ROLE])).toEqual([]);
  });

  it("drops a role whose coverage is below 0.15", () => {
    const result = matchRoles(["S1"], [SEVEN_SKILL_ROLE]); // 1/7 ≈ 0.143
    expect(result).toEqual([]);
  });

  it("tiers a role as WORTH_EXPLORING at 0.2 coverage", () => {
    const result = matchRoles(["Skill A"], [FIVE_SKILL_ROLE]); // 1/5 = 0.2
    expect(result[0].tier).toBe("WORTH_EXPLORING");
  });

  it("tiers a role as GOOD at 0.4 coverage", () => {
    const result = matchRoles(["Skill A", "Skill B"], [FIVE_SKILL_ROLE]); // 2/5 = 0.4
    expect(result[0].tier).toBe("GOOD");
  });

  it("tiers a role as STRONG at 0.6 coverage", () => {
    const result = matchRoles(["Skill A", "Skill B", "Skill C"], [FIVE_SKILL_ROLE]); // 3/5 = 0.6
    expect(result[0].tier).toBe("STRONG");
  });

  it("matches skills case-insensitively", () => {
    const result = matchRoles(["skill a", "SKILL B", "Skill C"], [FIVE_SKILL_ROLE]);
    expect(result[0].matchedSkills).toEqual(["Skill A", "Skill B", "Skill C"]);
  });

  it("reports matchedSkills and missingSkills correctly", () => {
    const result = matchRoles(["Skill A", "Skill B", "Skill C"], [FIVE_SKILL_ROLE]);
    expect(result[0].matchedSkills).toEqual(["Skill A", "Skill B", "Skill C"]);
    expect(result[0].missingSkills).toEqual(["Skill D", "Skill E"]);
  });

  it("caps results at the top 5 by coverage", () => {
    const roles: RoleArchetype[] = Array.from({ length: 7 }, (_, i) => ({
      id: `role-${i}`,
      title: `Role ${i}`,
      category: "Test",
      commonSkills: ["Common Skill"],
    }));
    const result = matchRoles(["Common Skill"], roles);
    expect(result).toHaveLength(5);
  });

  it("does not pad results when fewer than 5 roles qualify", () => {
    const result = matchRoles(["Skill A", "Skill B", "Skill C"], [FIVE_SKILL_ROLE]);
    expect(result).toHaveLength(1);
  });

  it("sorts results by coverage descending", () => {
    const lowMatch: RoleArchetype = {
      id: "low",
      title: "Low",
      category: "Test",
      commonSkills: ["Skill A", "Skill B", "Skill C", "Skill D"],
    }; // 1/4 = 0.25
    const highMatch: RoleArchetype = {
      id: "high",
      title: "High",
      category: "Test",
      commonSkills: ["Skill A"],
    }; // 1/1 = 1.0
    const result = matchRoles(["Skill A"], [lowMatch, highMatch]);
    expect(result.map((r) => r.roleId)).toEqual(["high", "low"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/career-fit/match-roles.test.ts`
Expected: FAIL with "Cannot find module './match-roles'"

- [ ] **Step 3: Write the implementation**

```typescript
export interface RoleArchetype {
  id: string;
  title: string;
  category: string;
  commonSkills: string[];
}

export interface RoleMatch {
  roleId: string;
  title: string;
  category: string;
  tier: "STRONG" | "GOOD" | "WORTH_EXPLORING";
  matchedSkills: string[];
  missingSkills: string[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function tierForCoverage(coverage: number): RoleMatch["tier"] | null {
  if (coverage >= 0.6) return "STRONG";
  if (coverage >= 0.35) return "GOOD";
  if (coverage >= 0.15) return "WORTH_EXPLORING";
  return null;
}

export function matchRoles(userSkills: string[], roles: RoleArchetype[]): RoleMatch[] {
  const normalizedUserSkills = new Set(userSkills.map(normalize));

  const scored = roles.map((role) => {
    const matchedSkills = role.commonSkills.filter((skill) =>
      normalizedUserSkills.has(normalize(skill))
    );
    const missingSkills = role.commonSkills.filter(
      (skill) => !normalizedUserSkills.has(normalize(skill))
    );
    const coverage =
      role.commonSkills.length === 0 ? 0 : matchedSkills.length / role.commonSkills.length;
    const tier = tierForCoverage(coverage);

    return { role, matchedSkills, missingSkills, coverage, tier };
  });

  return scored
    .filter((entry): entry is typeof entry & { tier: RoleMatch["tier"] } => entry.tier !== null)
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, 5)
    .map((entry) => ({
      roleId: entry.role.id,
      title: entry.role.title,
      category: entry.role.category,
      tier: entry.tier,
      matchedSkills: entry.matchedSkills,
      missingSkills: entry.missingSkills,
    }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/career-fit/match-roles.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/career-fit/match-roles.ts src/lib/career-fit/match-roles.test.ts
git commit -m "feat: add Career Fit deterministic role matching"
```

---

### Task 4: AI prompt builder (TDD)

**Files:**
- Create: `src/lib/career-fit/prompt.ts`
- Test: `src/lib/career-fit/prompt.test.ts`

**Interfaces:**
- Consumes: nothing beyond its own input shape.
- Produces: `CareerFitPromptInput` interface, `buildCareerFitPrompt(input): string` — consumed by Task 5.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { buildCareerFitPrompt } from "./prompt";

const BASE_INPUT = {
  profileContext: "Skills: TypeScript, React",
  matches: [
    { title: "Frontend Engineer", matchedSkills: ["TypeScript", "React"], missingSkills: ["Git"] },
    { title: "Full-Stack Engineer", matchedSkills: ["TypeScript"], missingSkills: ["Node.js", "SQL"] },
  ],
};

describe("buildCareerFitPrompt", () => {
  it("includes each role title", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("Frontend Engineer");
    expect(prompt).toContain("Full-Stack Engineer");
  });

  it("includes matched and missing skills per role", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("TypeScript, React");
    expect(prompt).toContain("Node.js, SQL");
  });

  it("includes the profile context block", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("Skills: TypeScript, React");
  });

  it("includes the exact-count return instruction", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("Return exactly 2 paragraph(s)");
  });

  it("includes the no-fabrication hard rule", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("Never invent employers, metrics, or accomplishments");
  });

  it("includes the no-market-claims hard rule", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("Never state or imply anything about job-market demand");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/career-fit/prompt.test.ts`
Expected: FAIL with "Cannot find module './prompt'"

- [ ] **Step 3: Write the implementation**

```typescript
export interface CareerFitPromptInput {
  profileContext: string;
  matches: {
    title: string;
    matchedSkills: string[];
    missingSkills: string[];
  }[];
}

export function buildCareerFitPrompt(input: CareerFitPromptInput): string {
  const roleList = input.matches
    .map((match, index) => {
      const matched = match.matchedSkills.join(", ") || "-";
      const missing = match.missingSkills.join(", ") || "-";
      return `${index + 1}. ${match.title}\n   Matched skills: ${matched}\n   Missing skills: ${missing}`;
    })
    .join("\n");

  return `A candidate's profile has already been matched against ${input.matches.length} role(s) below using a deterministic skill-matching algorithm. Write one short paragraph per role explaining why it is a good potential fit for this specific candidate, based only on their profile data.

Hard rules:
- Only reference experience, skills, and education explicitly present in the candidate profile data below.
- Never invent employers, metrics, or accomplishments not present in the input.
- Never state or imply anything about job-market demand, hiring volume, or salary for any role.
- Return exactly ${input.matches.length} paragraph(s), one per role listed below, in the same order.

Roles already matched (do not add, remove, or reorder):
${roleList}

Candidate profile:
${input.profileContext}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/career-fit/prompt.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/career-fit/prompt.ts src/lib/career-fit/prompt.test.ts
git commit -m "feat: add Career Fit AI prompt builder"
```

---

### Task 5: AI reasoning generator

**Files:**
- Create: `src/lib/career-fit/generate-reasoning.ts`

**Interfaces:**
- Consumes: `buildCareerFitPrompt`/`CareerFitPromptInput` from Task 4; `generateJson` from `@/lib/gemini`.
- Produces: `generateCareerFitReasoning(input: CareerFitPromptInput): Promise<string[]>` — consumed by Task 8 (server action).

- [ ] **Step 1: Write the file**

```typescript
import { Type } from "@google/genai";
import { generateJson } from "@/lib/gemini";
import { buildCareerFitPrompt, type CareerFitPromptInput } from "./prompt";

export async function generateCareerFitReasoning(
  input: CareerFitPromptInput
): Promise<string[]> {
  const prompt = buildCareerFitPrompt(input);

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
    !parsed.every((item) => typeof item === "string") ||
    parsed.length !== input.matches.length
  ) {
    throw new Error("Malformed response shape from Gemini");
  }

  return parsed;
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/career-fit/generate-reasoning.ts
git commit -m "feat: add Career Fit AI reasoning generator"
```

---

### Task 6: i18n strings

**Files:**
- Modify: `messages/id.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: `careerFit.*` namespace and a new `dashboard.modules[6]` entry — every later UI task reads keys from this namespace by exact path.

- [ ] **Step 1: Add the `careerFit` namespace to `messages/id.json`**

Insert as a new top-level key (after `"applicationTracker"`, matching this file's convention of adding new feature namespaces at the end):

```json
"careerFit": {
  "title": "Career Fit",
  "list": {
    "title": "Career Fit",
    "description": "Lihat posisi apa yang paling cocok dengan skill dan pengalaman Anda.",
    "newButton": "Analisis Baru",
    "empty": "Belum ada analisis. Buat yang pertama.",
    "resultCount": "{count} posisi ditemukan",
    "delete": "Hapus",
    "toastDeleteSuccess": "Analisis dihapus",
    "toastDeleteError": "Gagal menghapus analisis"
  },
  "new": {
    "title": "Temukan Potensi Karir Anda",
    "description": "Kami akan mencocokkan skill dan pengalaman di Profil Anda dengan berbagai posisi umum, lalu menjelaskan kenapa posisi itu cocok untuk Anda.",
    "submit": "Analisis Profil Saya",
    "generating": "Menganalisis profil Anda...",
    "toastNoSkills": "Lengkapi skill di Profil Anda dulu sebelum menjalankan analisis ini.",
    "toastGenerateError": "Terjadi kesalahan. Silakan coba lagi."
  },
  "detail": {
    "title": "Hasil Career Fit",
    "backToList": "Kembali ke daftar",
    "matchedSkillsLabel": "Skill yang cocok",
    "missingSkillsLabel": "Skill yang belum ada",
    "toastDeleteError": "Gagal menghapus analisis"
  },
  "tiers": {
    "STRONG": "Sangat Cocok",
    "GOOD": "Cocok",
    "WORTH_EXPLORING": "Layak Dicoba"
  }
}
```

- [ ] **Step 2: Add `dashboard.modules[6]` to `messages/id.json`**

Find the closing `]` right after the `"Application Tracker"` module entry (index 5) inside `dashboard.modules`, and add a 7th entry:

```json
{
  "title": "Career Fit",
  "description": "Temukan posisi yang paling cocok dengan skill Anda.",
  "steps": [
    "Buka menu \"Career Fit\" di sidebar",
    "Klik \"Analisis Profil Saya\"",
    "Lihat posisi yang cocok beserta alasannya"
  ]
}
```

- [ ] **Step 3: Repeat Steps 1-2 for `messages/en.json`**

```json
"careerFit": {
  "title": "Career Fit",
  "list": {
    "title": "Career Fit",
    "description": "See which roles best match your skills and experience.",
    "newButton": "New Analysis",
    "empty": "No analyses yet. Create your first one.",
    "resultCount": "{count} roles found",
    "delete": "Delete",
    "toastDeleteSuccess": "Analysis deleted",
    "toastDeleteError": "Failed to delete analysis"
  },
  "new": {
    "title": "Unlock Your Potential",
    "description": "We'll match the skills and experience in your Profile against common roles, then explain why each one fits.",
    "submit": "Analyze My Profile",
    "generating": "Analyzing your profile...",
    "toastNoSkills": "Add some skills to your Profile before running this analysis.",
    "toastGenerateError": "Something went wrong. Please try again."
  },
  "detail": {
    "title": "Career Fit Results",
    "backToList": "Back to list",
    "matchedSkillsLabel": "Matched skills",
    "missingSkillsLabel": "Skills to develop",
    "toastDeleteError": "Failed to delete analysis"
  },
  "tiers": {
    "STRONG": "Strong Fit",
    "GOOD": "Good Fit",
    "WORTH_EXPLORING": "Worth Exploring"
  }
}
```

`dashboard.modules[6]` in `messages/en.json`:

```json
{
  "title": "Career Fit",
  "description": "Find roles that best match your skills.",
  "steps": [
    "Open \"Career Fit\" in the sidebar",
    "Click \"Analyze My Profile\"",
    "See which roles fit, and why"
  ]
}
```

- [ ] **Step 4: Verify both files are valid JSON**

Run: `python3 -c "import json; json.load(open('messages/id.json')); json.load(open('messages/en.json')); print('OK')"`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add messages/id.json messages/en.json
git commit -m "feat: add Career Fit translations"
```

---

### Task 7: Delete button component

**Files:**
- Create: `src/components/career-fit/delete-potential-analysis-button.tsx`

**Interfaces:**
- Consumes: `deletePotentialAnalysis` from Task 8 (server actions — written next, but this component's import path is fixed now, so Task 8 must export a function of that exact name).
- Produces: `<DeletePotentialAnalysisButton id={...} />` — consumed by Task 9 (list page) and Task 11 (detail page).

- [ ] **Step 1: Write the component**

```typescript
"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deletePotentialAnalysis } from "@/app/[locale]/(app)/career-fit/actions";
import { trackEvent } from "@/lib/analytics-events";

export function DeletePotentialAnalysisButton({ id }: { id: string }) {
  const t = useTranslations("careerFit");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePotentialAnalysis(id);
      if ("error" in result) {
        toast.add({ title: t("list.toastDeleteError"), type: "error" });
        return;
      }
      trackEvent("career_fit_deleted");
      router.push("/career-fit");
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleDelete}
      disabled={isPending}
      aria-label={t("list.delete")}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: this will show an error until Task 8 creates `career-fit/actions.ts` — that's expected at this point in the plan; re-run after Task 8.

- [ ] **Step 3: Commit**

```bash
git add src/components/career-fit/delete-potential-analysis-button.tsx
git commit -m "feat: add DeletePotentialAnalysisButton component"
```

---

### Task 8: Server actions

**Files:**
- Create: `src/app/[locale]/(app)/career-fit/actions.ts`

**Interfaces:**
- Consumes: `ROLE_TAXONOMY` from Task 2; `matchRoles` from Task 3; `generateCareerFitReasoning` from Task 5; `buildProfileContext` from `@/lib/cover-letter/build-profile-context` (existing, reused as-is — it's already generic Profile-shape serialization, not cover-letter-specific); `ensureProfileRecord` from `@/lib/ensure-profile`; `encryptId` from `@/lib/id-crypto`.
- Produces: `createPotentialAnalysis(): Promise<{ token: string } | { error: string }>`, `deletePotentialAnalysis(id: string): Promise<{ success: true } | { error: string }>` — consumed by Task 7 (already written, forward reference), Task 10 (create page), Task 9/11 (list/detail pages via the delete button).

- [ ] **Step 1: Write the actions file**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { ensureProfileRecord } from "@/lib/ensure-profile";
import { buildProfileContext } from "@/lib/cover-letter/build-profile-context";
import { matchRoles } from "@/lib/career-fit/match-roles";
import { ROLE_TAXONOMY } from "@/lib/career-fit/role-taxonomy";
import { generateCareerFitReasoning } from "@/lib/career-fit/generate-reasoning";

export async function createPotentialAnalysis(): Promise<
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
    },
  });

  const skillNames = profile.skills.map((skill) => skill.name);
  const experienceSkills = profile.workExperiences.flatMap((exp) => exp.skillsUsed);
  const userSkills = [...skillNames, ...experienceSkills];

  const matches = matchRoles(userSkills, ROLE_TAXONOMY);
  if (matches.length === 0) {
    return { error: "no-skills" };
  }

  const profileContext = buildProfileContext(profile);

  let reasoning: string[];
  try {
    reasoning = await generateCareerFitReasoning({
      profileContext,
      matches: matches.map((match) => ({
        title: match.title,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
      })),
    });
  } catch (err) {
    console.error("[career-fit] Failed to generate reasoning:", err);
    return { error: "generation-failed" };
  }

  const results = matches.map((match, index) => ({
    roleId: match.roleId,
    title: match.title,
    category: match.category,
    tier: match.tier,
    matchedSkills: match.matchedSkills,
    missingSkills: match.missingSkills,
    reasoning: reasoning[index],
  }));

  const analysis = await db.potentialAnalysis.create({
    data: { userId: user.id, results },
  });

  revalidatePath("/career-fit");
  return { token: encryptId(analysis.id) };
}

export async function deletePotentialAnalysis(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.potentialAnalysis.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  await db.potentialAnalysis.delete({ where: { id } });
  revalidatePath("/career-fit");
  return { success: true };
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors (this also resolves Task 7's forward-reference error).

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/career-fit/actions.ts"
git commit -m "feat: add Career Fit server actions"
```

---

### Task 9: List page (`/career-fit`)

**Files:**
- Create: `src/app/[locale]/(app)/career-fit/page.tsx`

**Interfaces:**
- Consumes: `DeletePotentialAnalysisButton` from Task 7; `encryptId` from `@/lib/id-crypto`.
- Produces: the `/career-fit` route.

- [ ] **Step 1: Write the page**

```typescript
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { DeletePotentialAnalysisButton } from "@/components/career-fit/delete-potential-analysis-button";

export default async function CareerFitListPage() {
  const t = await getTranslations("careerFit.list");
  const format = await getFormatter();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const analyses = await db.potentialAnalysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/career-fit/new">{t("newButton")}</Link>} />
      </div>

      {analyses.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8 space-y-3">
          {analyses.map((analysis) => {
            const results = analysis.results as { title: string }[];
            return (
              <div
                key={analysis.id}
                className="flex items-center justify-between rounded-2xl border border-border p-5"
              >
                <Link href={`/career-fit/${encryptId(analysis.id)}`} className="flex-1">
                  <p className="font-medium">{t("resultCount", { count: results.length })}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format.dateTime(analysis.createdAt, { dateStyle: "medium" })}
                  </p>
                </Link>
                <DeletePotentialAnalysisButton id={analysis.id} />
              </div>
            );
          })}
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
git add "src/app/[locale]/(app)/career-fit/page.tsx"
git commit -m "feat: add Career Fit list page"
```

---

### Task 10: Create/trigger page (`/career-fit/new`)

**Files:**
- Create: `src/app/[locale]/(app)/career-fit/new/page.tsx`

**Interfaces:**
- Consumes: `createPotentialAnalysis` from Task 8.
- Produces: the `/career-fit/new` route.

- [ ] **Step 1: Write the page**

No server-fetched picker options are needed (unlike Application Tracker's create form) — this is a single client-side button.

```typescript
"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { toast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics-events";
import { createPotentialAnalysis } from "../actions";

export default function NewCareerFitPage() {
  const t = useTranslations("careerFit.new");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const result = await createPotentialAnalysis();
      if ("error" in result) {
        if (result.error === "no-skills") {
          toast.add({ title: t("toastNoSkills"), type: "error" });
        } else {
          toast.add({ title: t("toastGenerateError"), type: "error" });
        }
        trackEvent("career_fit_generate_failed", { error: result.error });
        return;
      }
      trackEvent("career_fit_generated");
      router.push(`/career-fit/${result.token}`);
    });
  }

  return (
    <Reveal className="mx-auto max-w-xl text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("description")}</p>
      <Button size="lg" className="mt-8" disabled={isPending} onClick={handleGenerate}>
        {isPending ? t("generating") : t("submit")}
      </Button>
    </Reveal>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/career-fit/new"
git commit -m "feat: add Career Fit trigger page"
```

---

### Task 11: Detail page (`/career-fit/[id]`)

**Files:**
- Create: `src/app/[locale]/(app)/career-fit/[id]/page.tsx`

**Interfaces:**
- Consumes: `DeletePotentialAnalysisButton` from Task 7; `decryptId` from `@/lib/id-crypto`.
- Produces: the `/career-fit/[id]` route.

- [ ] **Step 1: Write the page**

This is a Server Component — no editable fields exist, so no client wrapper is needed (the delete button is its own self-contained client leaf component, composed directly into this server-rendered tree, same as how `DeleteCoverLetterButton` sits inside the otherwise-server-rendered Cover Letter list rows).

```typescript
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { DeletePotentialAnalysisButton } from "@/components/career-fit/delete-potential-analysis-button";

interface CareerFitResult {
  roleId: string;
  title: string;
  category: string;
  tier: "STRONG" | "GOOD" | "WORTH_EXPLORING";
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

const TIER_STYLES: Record<CareerFitResult["tier"], string> = {
  STRONG: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  GOOD: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  WORTH_EXPLORING: "bg-muted text-muted-foreground",
};

export default async function CareerFitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: token } = await params;
  const analysisId = decryptId(token);
  if (!analysisId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const analysis = await db.potentialAnalysis.findUnique({ where: { id: analysisId } });
  if (!analysis || analysis.userId !== user.id) notFound();

  const t = await getTranslations("careerFit.detail");
  const tTiers = await getTranslations("careerFit.tiers");
  const results = analysis.results as CareerFitResult[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/career-fit" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; {t("backToList")}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <DeletePotentialAnalysisButton id={analysis.id} />
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.roleId} className="rounded-2xl border border-border p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{result.title}</h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {result.category}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TIER_STYLES[result.tier]}`}
              >
                {tTiers(result.tier)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {result.reasoning}
            </p>
            {result.matchedSkills.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("matchedSkillsLabel")}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {result.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.missingSkills.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("missingSkillsLabel")}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {result.missingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
git add "src/app/[locale]/(app)/career-fit/[id]"
git commit -m "feat: add Career Fit detail page"
```

---

### Task 12: Dashboard integration

**Files:**
- Modify: `src/app/[locale]/(app)/dashboard/page.tsx`
- Modify: `messages/id.json`, `messages/en.json`

**Interfaces:**
- Consumes: `db.potentialAnalysis.count` (new Prisma model from Task 1).

- [ ] **Step 1: Add a 7th icon and unlock the module**

In `src/app/[locale]/(app)/dashboard/page.tsx`, add `Compass` to the lucide-react import and extend the module arrays:

```typescript
import {
  Compass,
  FileCheck2,
  FileEdit,
  Mail,
  ListChecks,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
```

```typescript
const moduleIcons = [FileCheck2, ShieldCheck, FileEdit, MessagesSquare, Mail, ListChecks, Compass];
const moduleHrefs: (string | null)[] = [
  null,
  "/ats-check",
  "/resume-builder",
  null,
  "/cover-letter",
  "/application-tracker",
  "/career-fit",
];
const ACTIVE_MODULE_INDICES = new Set([1, 2, 4, 5, 6]);
```

- [ ] **Step 2: Fetch the analysis count and surface it as a module status**

Add a query to the `Promise.all` batch and destructure it:

```typescript
const [
  profile,
  resumeCount,
  atsCheckCount,
  coverLetterCount,
  recentChecks,
  applicationCount,
  careerFitCount,
] = await Promise.all([
  db.profile.findUnique({ /* unchanged */ }),
  db.resumeDocument.count({ where: { userId: user.id } }),
  db.aTSCheckAnalysis.count({ where: { userId: user.id } }),
  db.coverLetter.count({ where: { userId: user.id } }),
  db.aTSCheckAnalysis.findMany({ /* unchanged */ }),
  db.application.count({ where: { userId: user.id } }),
  db.potentialAnalysis.count({ where: { userId: user.id } }),
]);
```

Add to `moduleStatuses`:

```typescript
6:
  careerFitCount > 0
    ? t("moduleStatus.careerFitCountStatus", { count: careerFitCount })
    : undefined,
```

- [ ] **Step 3: Add the new translation key**

In `messages/id.json`, inside `dashboard.moduleStatus`:

```json
"careerFitCountStatus": "{count} analisis dibuat"
```

In `messages/en.json`, inside `dashboard.moduleStatus`:

```json
"careerFitCountStatus": "{count} analyses run"
```

- [ ] **Step 4: Verify it typechecks and the JSON is valid**

Run: `npx tsc --noEmit`
Run: `python3 -c "import json; json.load(open('messages/id.json')); json.load(open('messages/en.json')); print('OK')"`
Expected: no errors, `OK`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(app)/dashboard/page.tsx" messages/id.json messages/en.json
git commit -m "feat: surface Career Fit as an active dashboard module"
```

---

### Task 13: Sidebar integration

**Files:**
- Modify: `src/components/layout/app-shell.tsx`

- [ ] **Step 1: Add the 7th icon and route**

```typescript
import {
  Compass,
  FileCheck2,
  FileEdit,
  LayoutDashboard,
  ListChecks,
  Mail,
  Menu,
  MessagesSquare,
  ShieldCheck,
  X,
} from "lucide-react";
```

```typescript
const moduleIcons = [FileCheck2, ShieldCheck, FileEdit, MessagesSquare, Mail, ListChecks, Compass];
const moduleRoutes: (string | null)[] = [
  null,
  "/ats-check",
  "/resume-builder",
  null,
  "/cover-letter",
  "/application-tracker",
  "/career-fit",
];
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/app-shell.tsx
git commit -m "feat: add Career Fit to the sidebar"
```

---

### Task 14: Final verification

- [ ] **Step 1: Run the full automated suite**

Run: `npx tsc --noEmit`
Run: `npm run lint`
Run: `npm run test`
Run: `npm run build`
Expected: all four pass cleanly.

- [ ] **Step 2: Manual walkthrough**

Run: `npm run dev`, log in with a profile that has at least a few skills entered, then verify:
- `/career-fit` shows the empty state before any analysis exists.
- `/career-fit/new` → clicking "Analisis Profil Saya" generates a result and redirects to `/career-fit/[id]`.
- The detail page shows a plausible set of matched roles with tier badges, matched/missing skill chips, and grounded reasoning paragraphs that reference things actually in the test profile (not invented employers/metrics, no market-demand claims).
- Deleting the analysis (from either the list row or the detail page) removes it and redirects to `/career-fit`.
- Try this with a profile that has **no** skills entered anywhere (no `Skill` rows, no `workExperience.skillsUsed`): confirm `/career-fit/new` shows the "lengkapi skill" toast instead of generating anything.
- Dashboard's "Lanjutkan" section shows Career Fit as a live card; sidebar nav link works.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final verification for Career Fit"
```

(Only if Steps 1-2 required any fixes; otherwise there is nothing left to commit.)
