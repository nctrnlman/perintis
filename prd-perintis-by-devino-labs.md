# Product Requirements Document — Perintis

**by Devino Labs**

Version: 2.0 (Complete — All Modules)
Status: Ready for development

---

## 1. Product Overview

**Perintis** is an AI-powered career toolkit that helps Indonesian jobseekers optimize their resumes, understand ATS compatibility, prepare for interviews, and manage their entire job search journey — with transparent, auditable AI reasoning (not black-box scores) grounded in the Indonesian job market context (bilingual language, local interview culture, labor regulations).

**Tagline**: "Setiap karir besar, dimulai dari langkah pertama." (Every great career starts with a first step.)

**Brand hierarchy**:

- Parent brand: **Devino Labs**
- Product: **Perintis** — hosted at `perintis.devino.id`

### 1.1 Problem Statement

- Jobseekers don't know if their resume passes ATS filters before a human ever reads it
- Existing global tools (Jobscan, Rezi, Teal) aren't grounded in bilingual Indonesian language or local interview culture (startup vs. corporate vs. state-owned enterprise)
- Most AI career tools give opaque scores without actionable, auditable reasoning
- The job search process is fragmented across many disconnected tools

### 1.2 Target Users

- Primary: the founder (self-use) and close network for validation
- Secondary: Indonesian fresh graduates and early-career professionals
- Scale: small, personal-project scale — not built for mass public traffic initially

### 1.3 Design Reference

Visual direction follows **Apple.com / Apple product pages**: generous whitespace, typography-led hierarchy, minimal color palette with one accent color, subtle motion, high-quality restrained visuals, confident short copy, consistent rounded corners and soft depth. Full dark mode support required.

---

## 2. Design System

```
Colors:
  --bg-primary: #FFFFFF (light) / #000000–#0A0A0A (dark)
  --bg-secondary: #F5F5F7 (light) / #1D1D1F (dark)
  --text-primary: #1D1D1F (light) / #F5F5F7 (dark)
  --text-secondary: #6E6E73
  --accent: [single accent color — finalize during visual design phase]

Typography:
  --font-display: system font stack (SF Pro fallback: Inter), weight 600–700
  --font-body: same family, weight 400–500
  Headline scale: 48–64px desktop, body: 17–19px

Spacing scale: 8, 16, 24, 32, 48, 64, 96, 128 (px)

Radius:
  Card: 16–24px
  Button: full-rounded or 12px, consistent throughout

Motion:
  Scroll-triggered fade/slide-in, subtle hover scale (1.02x max), no bouncy/playful easing
```

---

## 3. Information Architecture (Full Sitemap — All Modules)

```
perintis.devino.id/
│
├── /                          → Home (public, marketing)
├── /login
├── /register
├── /forgot-password
│
├── /dashboard                 → Post-login home
│
├── /optimizer                 → Module 1: Resume Optimizer
│   ├── /optimizer/new
│   └── /optimizer/[id]
│
├── /ats-check                 → Module 2: ATS Compatibility Check
│   ├── /ats-check/new
│   └── /ats-check/[id]
│
├── /builder                   → Module 3: Resume Builder
│   ├── /builder/new
│   └── /builder/[id]/edit
│
├── /interview                 → Module 4: Mock Interview
│   ├── /interview/new
│   ├── /interview/[id]        → active session
│   └── /interview/[id]/feedback
│
├── /interview-prep            → Module 5: Interview Prep extras
│   ├── /interview-prep/questions   → predicted questions from gap analysis
│   ├── /interview-prep/star        → STAR method helper
│   └── /interview-prep/negotiation → salary negotiation script
│
├── /cover-letter               → Module 6: Cover Letter
│   ├── /cover-letter/new
│   └── /cover-letter/[id]
│
├── /tracker                    → Module 7: Application Tracker
│   ├── /tracker                → funnel view / kanban
│   ├── /tracker/[id]           → application detail
│   └── /tracker/insights       → pattern insights from history
│
├── /company-intel              → Module 8: Company & Market Intelligence
│   ├── /company-intel/research      → company research summary
│   ├── /company-intel/salary        → salary benchmarking
│   ├── /company-intel/scam-check    → job scam / red flag detector
│   └── /company-intel/skill-trends  → skill demand trends
│
├── /linkedin                   → Module 9: LinkedIn & Personal Branding
│   ├── /linkedin/optimizer
│   ├── /linkedin/consistency-check
│   └── /linkedin/outreach
│
├── /skill-development          → Module 10: Skill Development
│   ├── /skill-development/gaps
│   └── /skill-development/learning-path
│
├── /documents                  → Module 11: Reference & Supporting Documents
│   ├── /documents/reference-letter
│   └── /documents/portfolio-writer
│
├── /history                    → Unified history across all modules
├── /profile                    → Profile bank (source of truth data)
├── /settings
│
└── /privacy-policy, /terms-of-service
```

> **Phasing note**: this sitemap represents the full product vision. Recommended build order is in Section 8 (Build Roadmap). Not all modules need to ship at once — the architecture below is designed so each module can be added incrementally without restructuring.

---

## 4. Core Data Model (Prisma Schema — Conceptual)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  oauthProvider String?
  createdAt     DateTime @default(now())

  profile              Profile?
  resumes              Resume[]
  optimizerAnalyses    OptimizerAnalysis[]
  atsChecks            ATSCheckAnalysis[]
  interviewSessions    InterviewSession[]
  coverLetters         CoverLetter[]
  applications         Application[]
  linkedinAnalyses     LinkedInAnalysis[]
  skillGaps            SkillGapAnalysis[]
  documents            SupportingDocument[]
}

model Profile {
  id           String  @id @default(cuid())
  userId       String  @unique
  user         User    @relation(fields: [userId], references: [id])
  targetRole   String?
  targetIndustry String?
  experienceBlocks Json  // reusable "building blocks": work experience, education, skills
  updatedAt    DateTime @updatedAt
}

model Resume {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  filename   String?
  rawText    String
  source     String   // "uploaded" | "built"
  uploadedAt DateTime @default(now())
}

model OptimizerAnalysis {
  id                 String   @id @default(cuid())
  userId             String
  user               User     @relation(fields: [userId], references: [id])
  resumeId           String
  jobPostingText     String
  jobPostingUrl      String?
  overallScore       Int
  criteriaBreakdown  Json     // [{ criterion, score, reasoning }]
  rewriteSuggestions Json     // [{ original, suggested, status }]
  createdAt          DateTime @default(now())
}

model ATSCheckAnalysis {
  id                 String   @id @default(cuid())
  userId             String
  user               User     @relation(fields: [userId], references: [id])
  resumeId           String
  jobPostingText      String?
  overallScore       Int
  structuralFindings Json
  keywordFindings    Json?
  createdAt          DateTime @default(now())
}

model InterviewSession {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  companyType  String   // "startup" | "corporate" | "state-owned"
  roleTarget   String?
  transcript   Json     // [{ role: "interviewer"|"user", content, timestamp }]
  feedback     Json?    // { strengths, weaknesses, suggestions }
  createdAt    DateTime @default(now())
}

model CoverLetter {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  jobPostingText String
  tone       String   // "formal" | "startup-casual"
  content    String
  createdAt  DateTime @default(now())
}

model Application {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  companyName  String
  roleTitle    String
  status       String    // "applied" | "interview" | "offer" | "rejected"
  appliedAt    DateTime?
  notes        String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model LinkedInAnalysis {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  type       String   // "about-optimizer" | "consistency-check" | "outreach"
  input      Json
  output     Json
  createdAt  DateTime @default(now())
}

model SkillGapAnalysis {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  sourceAnalysisId String? // links back to OptimizerAnalysis if derived from it
  gaps           Json     // [{ skill, priority, suggestedResources }]
  createdAt      DateTime @default(now())
}

model SupportingDocument {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  type       String   // "reference-letter" | "portfolio-case-study"
  content    String
  createdAt  DateTime @default(now())
}
```

---

## 5. Module Specifications

### 5.1 Module: Resume Optimizer (`/optimizer`)

- Upload resume (PDF/DOCX) or paste text; large, clear drag-and-drop zone
- Input job posting (paste text or URL — fetch and extract if URL)
- Progressive loading states: "Reading your resume...", "Comparing against requirements...", "Preparing recommendations..."
- Results: overall match score (visual, e.g. progress ring) + **per-criterion breakdown with written reasoning** (never a bare number)
- **Before/after rewrite suggestions** per bullet point; user can accept/reject/edit each
- **Anti-fabrication guardrail**: never invent achievements or metrics not present in the source resume — use explicit placeholders (e.g. `[insert your metric here]`) when specificity is missing

### 5.2 Module: ATS Compatibility Check (`/ats-check`)

- Structural checks run server-side without LLM (tables, multi-column layouts, non-standard fonts, headers/footers with critical info) — fast and deterministic
- Keyword relevance check uses LLM, compared against job posting if provided
- Findings displayed as a structured list: category, severity (critical/warning/suggestion), explanation, fix guidance

### 5.3 Module: Resume Builder (`/builder`)

- Guided, step-based input form pulling from the Profile bank (`experienceBlocks`)
- AI composes raw input into properly structured resume bullets (not just a list of duties)
- 1–2 ATS-safe templates (single-column, standard headings)
- Live preview while editing
- PDF export

### 5.4 Module: Mock Interview (`/interview`)

- Text-based, turn-by-turn conversational session
- Persona selection: startup / corporate / state-owned enterprise — each with distinct interviewer tone and typical question patterns
- Adaptive follow-up questions based on the user's previous answers (not a fixed linear script)
- Session feedback: strengths, weaknesses, concrete suggestions
- Voice-based mode is explicitly out of scope for this build (documented complexity trade-off; may be revisited later)

### 5.5 Module: Interview Prep Extras (`/interview-prep`)

- **Predicted questions**: derived from gap analysis in Module 5.1 — surfaces likely questions about resume weaknesses
- **STAR method helper**: restructures a user's raw experience description into Situation-Task-Action-Result format
- **Salary negotiation script**: generates a draft negotiation script based on role, seniority, and (if available) salary benchmark data from Module 5.8

### 5.6 Module: Cover Letter (`/cover-letter`)

- Generates from Profile bank + job posting
- Tone selector: formal / startup-casual

### 5.7 Module: Application Tracker (`/tracker`)

- Kanban or funnel view: applied → interview → offer → rejected
- Follow-up reminders based on time-since-applied
- **Funnel analytics**: conversion rate visualization across stages
- **Insight generation**: AI summarizes patterns from the user's own history (e.g. "You convert more often for roles emphasizing X")
- Export history as CSV

### 5.8 Module: Company & Market Intelligence (`/company-intel`)

- **Company research summary**: compiles public information (products, recent news, publicly stated culture) before an interview
- **Salary benchmarking**: local Indonesian salary ranges by role/level/city
- **Job scam / red flag detector**: checks a job posting or recruiter message against known local scam patterns (fee requests, WhatsApp-only communication, unrealistic offers) — scoped to publicly available postings and messages the user personally received; never used to search or profile private individuals
- **Skill demand trends**: aggregated insight on which skills appear most frequently in job postings the user has scanned (later-phase feature, requires accumulated data volume)

### 5.9 Module: LinkedIn & Personal Branding (`/linkedin`)

- **About/headline optimizer**: same reasoning-based approach as the resume optimizer
- **Consistency check**: flags mismatches between resume and LinkedIn profile (dates, titles)
- **Outreach message generator**: drafts cold messages to recruiters/hiring managers, natural tone

### 5.10 Module: Skill Development (`/skill-development`)

- **Gap summary**: pulled from Optimizer analyses, aggregated across sessions
- **Learning path suggestions**: recommends a learning order and resource types (not paid course endorsements) to close identified gaps

### 5.11 Module: Reference & Supporting Documents (`/documents`)

- **Reference letter generator**: structured template, user supplies factual details — not fabricated by AI
- **Portfolio case study writer**: helps structure a project narrative into a short case study (useful for design/product roles)

---

## 6. Cross-Cutting Requirements

### 6.1 SEO

- Unique `title` and `meta description` per public page via Next.js Metadata API
- Open Graph + Twitter Card tags with custom preview images
- Auto-generated `sitemap.xml` and `robots.txt`
- JSON-LD structured data (`SoftwareApplication` schema) on the Home page
- Semantic HTML: single `h1` per page, proper heading hierarchy, alt text on all images
- Core Web Vitals: lazy-loaded images via `next/image`, no layout shift
- Canonical URLs on every page
- Register with Google Search Console post-launch

### 6.2 Analytics

- Google Analytics 4 across all pages
- Custom events: `sign_up`, `login`, `optimizer_analysis_started/completed`, `ats_check_started/completed`, `rewrite_suggestion_accepted/rejected`, `interview_session_started/completed`, `application_added`, `cover_letter_generated`
- Funnel to track: Home visit → Sign up → First analysis completed → Return usage
- Simple cookie/privacy consent notice

### 6.3 Non-Functional Requirements

- Full responsive design, mobile-first (most jobseekers access via phone)
- Dark mode from day one
- WCAG AA color contrast minimum, visible keyboard focus states
- Clear loading feedback on every async operation (AI calls, uploads)
- Server-side input validation on all endpoints (never trust client-only validation)
- Rate limiting on all AI-calling endpoints
- File upload sanitization

---

## 7. Recommended Tech Stack

| Layer             | Choice                                      | Rationale                                                                                                                         |
| ----------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Framework         | Next.js 14+ (App Router), TypeScript        | SSR for SEO, API routes/Server Actions sufficient without a separate backend                                                      |
| Styling           | Tailwind CSS + shadcn/ui                    | Accessible, customizable components; fits the Apple-inspired design system                                                        |
| Database          | PostgreSQL (Supabase)                       | Already provisioned; supports `pgvector` for future semantic search (Module 5.10, 5.8)                                            |
| ORM               | Prisma                                      | End-to-end type safety, clear migrations                                                                                          |
| Auth              | Supabase Auth                               | Integrated with existing database; supports email + Google OAuth                                                                  |
| LLM orchestration | Vercel AI SDK                               | Abstracts LLM provider behind one interface — critical for resilience if a provider's free tier changes; native streaming support |
| LLM provider      | Google Gemini Flash (free tier)             | Multimodal, cost-effective at this scale                                                                                          |
| File parsing      | `pdf-parse`/`unpdf` (PDF), `mammoth` (DOCX) | Extract text before sending to LLM — cheaper and more reliable than sending raw files                                             |
| File storage      | Supabase Storage                            | Same ecosystem as the database                                                                                                    |
| Rate limiting     | Upstash Redis                               | Required before any public-facing AI endpoint goes live                                                                           |
| Hosting           | Vercel                                      | Native Next.js integration                                                                                                        |
| Analytics         | Google Analytics 4 + Vercel Analytics       | Behavioral funnel + Core Web Vitals                                                                                               |
| Error monitoring  | Sentry                                      | Free tier sufficient at this scale                                                                                                |

### 7.1 Key Trade-off: Synchronous vs. Background AI Jobs

Start with synchronous LLM calls (user waits with a loading state) — simplest to build and debug. Move to background jobs (Inngest or Trigger.dev) with polling/websocket progress updates only if multi-step analyses (parse → gap analysis → rewrite) start exceeding ~10–15 seconds. Do not over-engineer this before it's a proven problem.

### 7.2 Environment Variables

**Never commit `.env` or `.env.local` to version control.** Confirm `.gitignore` includes these before the first commit.

```dotenv
# .env.local — do not commit
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEMINI_API_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

> Security note: any database credentials previously shared outside of a `.env` file should be treated as compromised and rotated via the Supabase dashboard (Settings → Database → Reset Database Password) before development begins.

---

## 8. Project Folder Structure (English naming, App Router convention)

```
perintis/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx                    → Home
│   │   │   ├── privacy-policy/page.tsx
│   │   │   └── terms-of-service/page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   │
│   │   ├── (app)/                          → authenticated routes
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── optimizer/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── ats-check/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── builder/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── interview/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── interview-prep/
│   │   │   │   ├── questions/page.tsx
│   │   │   │   ├── star/page.tsx
│   │   │   │   └── negotiation/page.tsx
│   │   │   ├── cover-letter/
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── tracker/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── insights/page.tsx
│   │   │   ├── company-intel/
│   │   │   │   ├── research/page.tsx
│   │   │   │   ├── salary/page.tsx
│   │   │   │   ├── scam-check/page.tsx
│   │   │   │   └── skill-trends/page.tsx
│   │   │   ├── linkedin/
│   │   │   │   ├── optimizer/page.tsx
│   │   │   │   ├── consistency-check/page.tsx
│   │   │   │   └── outreach/page.tsx
│   │   │   ├── skill-development/
│   │   │   │   ├── gaps/page.tsx
│   │   │   │   └── learning-path/page.tsx
│   │   │   ├── documents/
│   │   │   │   ├── reference-letter/page.tsx
│   │   │   │   └── portfolio-writer/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── optimizer/route.ts
│   │   │   ├── ats-check/route.ts
│   │   │   ├── builder/route.ts
│   │   │   ├── interview/route.ts
│   │   │   ├── cover-letter/route.ts
│   │   │   ├── tracker/route.ts
│   │   │   ├── company-intel/route.ts
│   │   │   ├── linkedin/route.ts
│   │   │   ├── skill-development/route.ts
│   │   │   └── documents/route.ts
│   │   │
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                             → shadcn base components
│   │   ├── layout/                         → navbar, footer, sidebar
│   │   └── shared/                         → cards, score displays, loading states
│   │
│   ├── features/                           → feature-scoped logic, colocated
│   │   ├── optimizer/
│   │   │   ├── components/
│   │   │   ├── prompts/                    → LLM prompt templates
│   │   │   └── logic.ts
│   │   ├── ats-check/
│   │   │   ├── rules/                      → rule-based structural checks
│   │   │   └── logic.ts
│   │   ├── builder/
│   │   ├── interview/
│   │   ├── cover-letter/
│   │   ├── tracker/
│   │   ├── company-intel/
│   │   ├── linkedin/
│   │   ├── skill-development/
│   │   └── documents/
│   │
│   ├── lib/
│   │   ├── db.ts                           → Prisma client
│   │   ├── auth.ts
│   │   ├── ai/
│   │   │   ├── client.ts                   → Vercel AI SDK setup
│   │   │   └── providers.ts
│   │   ├── file-parsing/
│   │   │   ├── pdf.ts
│   │   │   └── docx.ts
│   │   ├── rate-limit.ts
│   │   └── analytics.ts
│   │
│   └── types/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
├── .env.local                              → NOT committed
├── .gitignore
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 9. Build Roadmap

Recommended sequencing — each phase is independently shippable and validated before moving to the next:

**Phase 1 — Foundation**

1. Project setup (Next.js, Tailwind, Prisma, Supabase connection via env vars)
2. Design system components (design tokens as reusable Tailwind config + shadcn theme)
3. Home page (static)
4. Full auth flow (register, login, forgot password, Google OAuth)
5. Dashboard skeleton

**Phase 2 — Core Value** 6. ATS Compatibility Check (rule-based checks first, then LLM keyword layer) 7. Resume Optimizer (parsing → gap analysis → rewrite suggestions) 8. History and Profile pages

**Phase 3 — Interview Readiness** 9. Mock Interview (text-based) 10. Interview Prep extras (predicted questions, STAR helper, negotiation script)

**Phase 4 — Expansion** 11. Resume Builder 12. Cover Letter generator 13. Application Tracker

**Phase 5 — Intelligence Layer** 14. Company & Market Intelligence 15. LinkedIn & Personal Branding 16. Skill Development 17. Reference & Supporting Documents

**Cross-cutting, integrated throughout**: SEO metadata, GA4 event tracking, responsive/dark mode QA, accessibility pass.
