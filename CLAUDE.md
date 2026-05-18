# TempoRead — agent notes

Persistent context for Claude (or any AI assistant) editing this repo.

## Brand — zero tolerance

The product is **TempoRead**. Never "SpeedRead", "FlashRead", "Requiem". The
localStorage prefix is `tr-prefs`. The wordmark is **two-tone**: `Tempo`
(font-light) + `Read` (font-semibold, signal-red).

## Stack

- Next.js 16 (App Router, React 19, React Compiler on)
- Tailwind v4 + design-token CSS variables (see `src/app/tokens.css`)
- Supabase for auth + data (`@supabase/ssr` + `@supabase/supabase-js`)
- Stripe for subscriptions (server routes in `src/app/api/stripe/`)
- `pdf-parse-new` for PDF (server-side only)
- `mammoth` for DOCX (client-side, dynamically imported)
- `@extractus/article-extractor` for URL import (server-side)

## Routing

```
src/app/page.js                       Landing at /
src/app/app/page.js                   App at /app — 90% of dev happens here
src/app/app/loading.js                Loading skeleton
src/app/privacy/page.js               Privacy at /privacy
src/app/terms/page.js                 Terms at /terms
src/app/api/stripe/checkout/route.js  Stripe Checkout session
src/app/api/stripe/portal/route.js    Stripe Customer Portal
src/app/api/stripe/webhook/route.js   Stripe webhook handler (uses service-role key)
src/app/api/extract-pdf/route.js      Server PDF extraction
src/app/api/extract-url/route.js      Server URL extraction
```

The app page imports Supabase from `@/lib/supabase-client`. The landing
page does NOT use Supabase.

## Anti-checklist — if any of this is in the build, it has failed

- Any gradient, anywhere.
- Any emoji used as iconography.
- Any drop shadow beyond a 1px hairline.
- More than one signal-coloured element visible in a single viewport.
- A "Most Popular" badge on the Pro pricing card.
- Pure white (`#FFFFFF`) backgrounds.
- A modal for the free-tier upgrade nudge. Use the toast.
- The wordmark stacked, abbreviated, or in any colour combination other
  than light + signal.
- Italics used for emphasis. Use weight or colour.
- A "Pro+ coming soon" placeholder on pricing.
- Sidebar navigation in the app.
- A hamburger menu on mobile.
- `<input type="range">`. Use the custom `Slider` in `rsvp.jsx`.
- `alert()` or `confirm()`. Use the Toast and Confirm primitives.

## Code conventions

- All pages use `'use client'`.
- State: `useState` / `useEffect` / `useCallback` / `useRef`. No external state library.
- ORP focal-letter centering uses `useLayoutEffect` + `offsetLeft` + a
  corrective `transform`. Pixel-perfect regardless of kerning. Don't refactor.
- Always provide complete files when handing off edits — partial snippets
  cause integration bugs.
- If a new package is added: include the `npm install` command.
- If a schema change is needed: provide the full SQL.

## Pricing — non-negotiable values

- Free: $0 forever, 5,000 words per month, paste text + TXT upload only.
- Pro: $5 AUD/mo, $35 AUD/yr. Unlimited + PDF/DOCX/URL + cloud library + analytics + recall + themes.
- Pro+: NOT yet built. Do NOT show on the landing page.

## Design tokens — locked

```
--ink     #0E0E10   Primary surface, ~60% of any view
--paper   #F5F2EC   Inverted surfaces, reader canvas, callout cards
--signal  #E5202D   Accent — max ONE per visible viewport
--bone    #8A8A90   Muted text on --ink
--shadow  #050507   Elevated surfaces on dark, never for text
```

The palette is **Noir** by default. Alternative palettes (Ink, Oxblood,
Forest, Sun) live in `tokens.css` as commented blocks if you want to
swap — but commit to one.
