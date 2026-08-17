# Design System

The direction is **Apple.com**: generous whitespace, typography-led hierarchy, minimal color, one accent reserved almost exclusively for interactive elements. This mirrors the hard-won rules from the owner's portfolio (`rhazes-labs`) — treat them as constraints, not suggestions, for every future page in this project.

## Color rule (strict)

- **All body text, headings, icons, badges, and decorative elements are neutral** (`text-foreground`, `text-muted-foreground`, `bg-muted`, `bg-card`).
- **The accent color (`--primary` / `--ring`) is reserved for**: primary buttons, real navigational links (e.g. `text-primary hover:underline` on an actual `<Link>`), and genuinely interactive selected states.
- Before reaching for `bg-primary` or `text-primary` on anything that isn't a button or a real link, stop and ask: is this decorative? If so, use `bg-muted` / `text-foreground` / `text-muted-foreground` instead.
- This was violated once already in this project's own Home page redesign (feature-card icon badges and the closing CTA section background were both decorative `bg-primary` — fixed to neutral, see commit `3bc0f37`).

## Color tokens (`src/app/globals.css`)

Tailwind v4, CSS-first config — colors are OKLCH, defined once in `:root` and `.dark`, no `tailwind.config.ts`. When adding a new semantic token, always define both blocks.

| Token | Light | Dark | Source (PRD §2) |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | `--bg-primary` |
| `--card` / `--secondary` / `--muted` | `oklch(0.971 0.003 286.4)` | `oklch(0.232 0.004 286.1)` | `--bg-secondary` (`#F5F5F7`) |
| `--foreground` | `oklch(0.232 0.004 286.1)` | `oklch(0.971 0.003 286.4)` | `--text-primary` |
| `--muted-foreground` | `oklch(0.540 0.008 286.1)` | `oklch(0.65 0.008 286.1)` | `--text-secondary` (`#6E6E73`) |
| `--primary` (accent) | `oklch(0.511 0.230 277.0)` | `oklch(0.585 0.204 277.1)` | `#4F46E5` |
| `--radius` | `0.75rem` (12px) | same | button radius |

Cards use `rounded-2xl` (~21.6px) directly in markup for the PRD's 16–24px card radius — not the shared `--radius`, which governs buttons/inputs.

## Components

- This project uses **Base UI** (`@base-ui/react`), not Radix — `shadcn add` here scaffolds Base UI primitives. `<Button asChild>` doesn't exist; use `<Button render={<Link href="..." />} />`.
- **Base UI gotcha**: `Button` defaults to `nativeButton={true}`. Whenever `render` targets a non-`<button>` element (almost always `<Link>`), always add `nativeButton={false}` — otherwise Base UI warns in the console. Native `type="submit"` buttons (auth forms) keep the default.
- shadcn's `form` registry component was empty in this project's registry snapshot (Base UI preset, shadcn 4.18) — auth forms use `react-hook-form`'s `register()`/`formState.errors` directly with `Label`/`Input`, not a `Form` wrapper.

## Apple-style principles

- **Curate, don't cram.** One or two primary CTAs per hero/section, not four.
- **Hairline rules over filled boxes.** Feature/content cards use a `border border-border` (hairline) rather than a filled `bg-*` box wherever the surrounding section already has a distinct background — see the Home page feature grid.
- **No em dashes in prose.** Applies to on-page copy and metadata (`title`, `description`). Use periods, commas, or "dan"/"dengan" instead. Does not apply to code comments or legitimate date-range en-dashes (not currently used anywhere in this project).
- **Write like a person.** First person where applicable, concrete claims, no corporate filler ("leveraging synergies", "end-to-end solutions" as padding).

See `content-guidelines.md` for the no-fabrication and company-naming rules (copied from the portfolio project as a starting reference — the specific examples there are about that project, but the underlying discipline — never invent a plausible-sounding detail — applies here too, e.g. don't fabricate example metrics or testimonials for Perintis marketing copy).
