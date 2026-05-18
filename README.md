# TempoRead

RSVP speed-reading web app for university students.

**Live:** _set when you ship._
**Stack:** Next.js 16 · React 19 (with the React Compiler) · Tailwind v4 · Supabase · Stripe

---

## Quick start

```bash
git clone git@github.com:YOUR_USER/temporead.git
cd temporead
cp .env.local.example .env.local   # fill in the values
npm install
npm run dev                        # http://localhost:3000
```

You will need a Supabase project and a Stripe account before things actually work — see `FRESH_START.md` (kept alongside this repo or in your design project) for the end-to-end setup walkthrough.

---

## Project layout

```
src/
├── app/
│   ├── api/
│   │   ├── stripe/{checkout,portal,webhook}/route.js   Stripe endpoints
│   │   ├── extract-pdf/route.js                        pdf-parse-new (server)
│   │   └── extract-url/route.js                        @extractus/article-extractor
│   ├── app/page.js                                     The reader (auth-gated)
│   ├── app/loading.js                                  Loading shell
│   ├── page.js                                         Landing page
│   ├── layout.js                                       Root layout + Geist font
│   ├── globals.css                                     Tailwind preflight
│   ├── tokens.css                                      Design tokens (the 5-colour palette)
│   ├── privacy/page.js
│   └── terms/page.js
├── components/
│   ├── rsvp.jsx                                        RSVPWord + Icon + primitives
│   ├── landing.jsx                                     Landing sections + AuthModal
│   └── app-screens.jsx                                 Reader + Library + Settings + overlays
└── lib/
    └── supabase-client.js                              Browser Supabase client
```

---

## Brand — zero tolerance

The app is **TempoRead**. Never "SpeedRead", "FlashRead", "Requiem". The
localStorage prefix is `tr-prefs`. The wordmark is two-tone:
`Tempo` (light weight) + `Read` (semibold, signal-red).

The palette is locked to five colours — see `tokens.css`. There are no
gradients. There is no emoji-as-icon. There is no "Most Popular" badge on
the Pro card. The defaults match the Noir palette (near-black + cream +
vivid red); other palettes (Ink, Oxblood, Forest, Sun) are documented in
the design canvas.

---

## Commands

```bash
npm run dev                        # local dev server
npm run build                      # production build
rm -rf .next && npm run dev        # clear build cache (first thing to try when things break)
pkill -f "next dev"                # kill stale dev servers
git commit --allow-empty -m "trigger rebuild" && git push    # force Vercel redeploy
```

---

## Code conventions

- Every page uses `'use client'`.
- State: `useState` / `useEffect` / `useCallback` / `useRef`. No external state library.
- **Never** use HTML `<input type="range">` — known snap/jerk issues. Use the custom pointer-event `Slider` in `rsvp.jsx`.
- **Never** `alert()` or `confirm()`. Use the Toast and Confirm components.
- ORP focal-letter centering uses `useLayoutEffect` + `offsetLeft` measurement and a corrective `transform`. Pixel-perfect regardless of kerning. Don't refactor to CSS-only.
- Tailwind utilities are fine. Inline `style={}` is fine when colour comes from a token. Avoid mixing both for the same property on one element.

---

## Pricing

- **Free** — $0. Paste text, TXT upload, RSVP reader, keyboard shortcuts, 5,000 words per month.
- **Pro** — $5 AUD/month or $35 AUD/year (save 42%). Everything in Free + unlimited reading + PDF/DOCX/URL import + cloud library across devices + analytics + recall prompts + themes + priority support.
- **Pro+** — not on the landing page. Reserved for future AI features.

---

## Owner

Idir Mazir · Perth, Australia
Contact: `support@temporead.app`
