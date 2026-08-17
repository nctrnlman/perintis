# Content Guidelines

## No fabrication, ever

Every fact shown on this site — project descriptions, metrics, testimonials, experience highlights, tech stacks — must trace back to something real: the owner's LinkedIn data, an explicit statement from the owner, or an existing verified source in this codebase (e.g. a blog post that already documents a project in depth). Never invent a plausible-sounding detail to fill a gap.

This has bitten the project before: the initial `create-next-app`-era seed data included generic placeholder projects ("HCI Learning Platform", "Fintech Analytics Dashboard") and testimonials ("Ahmad Fauzi, CTO, Startup Jakarta") that were never real — they were later found and replaced wholesale with real LinkedIn data. When you find content that looks generic, unverifiable, or suspiciously convenient, flag it and ask before trusting it.

If a required detail is missing (e.g. a project's tech stack, a client's industry), leave the field empty or ask — don't guess.

## Company name policy

- **Codenito ID** can be named anywhere, in any context — it's the owner's own studio.
- **No other employer or client name** (e.g. "Home Credit Indonesia") should appear in **marketing/narrative copy** — the Home page hero, About page, Work With Me page, meta descriptions, blog article framing, generated OG images. Reference "industries" or "clients" generically instead ("e-commerce, healthcare, logistics, legal, FMCG, fintech, HR technology").
- **Factual records are exempt.** The Experience timeline (`/experience`), the generated portfolio PDF, and the admin Experience data legitimately name real employers (Home Credit Indonesia, Jobseeker Company, PT Mineral Alam Abadi) because that's an actual resume/CV record, not narrative flavor. Don't scrub real employer names from a literal career history — that would misrepresent it.
- Similarly, blog articles should avoid using specific past-employer names as narrative color (a "from CCIT to founder" framing was renamed to "from bootcamp to founder", and a "Home Credit" case-study article was rewritten around a real Codenito client project instead) — but the Experience/Education database records themselves keep the real institution names.

## Private / unlinked projects

Most of the real project list is internal or client-confidential systems with no public URL. This is normal and doesn't need to be hidden or apologized for — `ProjectCard` and the project detail page show a "Private project" indicator (lock icon) instead of link buttons when neither `liveUrl` nor `githubUrl` is set. Don't fabricate a URL to fill the gap.

## Tone

First person, concrete, professional but human. Avoid corporate boilerplate ("leveraging synergies", "end-to-end solutions" as a filler phrase) in favor of specific, verifiable claims ("15+ production launches", "99.99% uptime"). See `design-system.md` for the em-dash rule.
