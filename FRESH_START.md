# TempoRead — Fresh Start Runbook

A complete, ordered set of steps to go from **nothing** to a **deployed,
paid-tier-working TempoRead** with the new design. Assumes you are deleting
the old Supabase project and starting a new GitHub repo. Pulls from the
existing Next.js source as a starting point.

Total time, with no surprises: **~90 minutes**.

---

## 0. Before you start — what you need

- [ ] GitHub account
- [ ] Vercel account (linked to your GitHub)
- [ ] Supabase account
- [ ] Stripe account (in test mode is fine to start)
- [ ] Node 20+ installed locally
- [ ] A domain name (optional — you can launch on `*.vercel.app` first)
- [ ] Your existing `speedread-main/` folder available locally as a source of
      truth for the API routes, parsing logic, and config files

---

## 1. New GitHub repo

```bash
# 1. Make a new local folder
mkdir temporead && cd temporead

# 2. Copy the existing Next.js codebase as your starting skeleton
cp -R /path/to/speedread-main/. .
# Make sure the following copy across:
#   package.json, package-lock.json, next.config.mjs, postcss.config.mjs,
#   jsconfig.json, eslint.config.mjs, .gitignore,
#   src/lib/, src/app/api/, src/app/layout.js, src/app/globals.css,
#   src/app/favicon.ico, src/app/privacy/, src/app/terms/,
#   src/app/app/loading.js

# 3. Replace the pages with the new design (see §3)

# 4. Init git
rm -rf .git
git init
git add -A
git commit -m "Initial commit — TempoRead redesign"

# 5. Create the GitHub repo and push
# On github.com: New repo named "temporead", do NOT add README/.gitignore
git remote add origin git@github.com:YOUR_USER/temporead.git
git branch -M main
git push -u origin main
```

If you want to be extra clean, generate fresh `.env.local` and `.env.local.example` files at this point — see §4.

---

## 2. Install deps

```bash
npm install
npm run dev   # smoke-test that Next.js boots
```

Stop the dev server. We'll come back after the env vars are set.

---

## 3. Drop in the new design

The new design lives across these files (in this project, the prototype
folder):

```
tokens.css                  → src/app/tokens.css        (design tokens)
components.jsx              → src/components/rsvp.jsx   (RSVPWord, icons, primitives)
landing.jsx                 → src/components/landing.jsx (landing sections + AuthModal)
app-screens.jsx             → src/components/app-screens.jsx  (reader, library, settings, recall, toast)
main.jsx                    → src/app/page.js + src/app/app/page.js  (split into two routes)
```

**Critical conversions you must apply when copying each file:**

| File | Change |
|---|---|
| `components.jsx` → `rsvp.jsx` | Add `'use client'` at the top. Replace the `Object.assign(window, …)` block with an `export` statement listing the same symbols. Replace `const { useState, ... } = React` with `import { useState, ... } from 'react'`. |
| `landing.jsx` | Same: `'use client'` + `export`. Remove the `Object.assign(window, …)`. Add `import { Icon, Kicker, Wordmark, RSVPWord, ProgressBar, WpmChips } from '@/components/rsvp'`. |
| `app-screens.jsx` | Same. Replace internal navigation `window.location.hash = '/library'` etc. with Next's `useRouter().push('/app')`. |
| `main.jsx` | Split. The **Landing** branch becomes `src/app/page.js`. The **App** branch (Reader / Library / Settings / overlays) becomes `src/app/app/page.js`. Delete the hash-router; in Next you use file-based routing. |
| `tokens.css` | Import it from `src/app/layout.js`: `import './tokens.css'`. Keep `globals.css` for the Tailwind preflight + font-face. |

A reasonable layout for the new repo:

```
src/
├── app/
│   ├── api/                 (unchanged — keep your stripe + extract routes)
│   ├── app/page.js          (new — Reader + Library + Settings)
│   ├── app/loading.js       (unchanged)
│   ├── page.js              (new — landing)
│   ├── layout.js            (update font + meta)
│   ├── globals.css          (keep — Tailwind preflight)
│   ├── tokens.css           (new — design tokens)
│   ├── privacy/page.js      (unchanged content, new shell)
│   └── terms/page.js        (unchanged content, new shell)
├── components/
│   ├── rsvp.jsx             (new — RSVPWord, Icon, primitives)
│   ├── landing.jsx          (new)
│   └── app-screens.jsx      (new)
└── lib/
    └── supabase-client.js   (unchanged)
```

### 3a. Wire AuthModal to real Supabase

In `landing.jsx`, find `AuthModal.submit` and replace the simulated delay
with the real call:

```jsx
const submit = async (e) => {
  e.preventDefault();
  if (!canSubmit) return;
  setLoading(true);
  const supabase = createClient();   // import from '@/lib/supabase-client'
  const { error } = isSignup
    ? await supabase.auth.signUp({ email: email.trim(), password })
    : await supabase.auth.signInWithPassword({ email: email.trim(), password });
  setLoading(false);
  if (error) { setErr(error.message); return; }
  onAuth && onAuth({ email: email.trim(), mode });
};
```

Add a small `err` state and surface it under the password field — same
pattern as the `error` field already in the modal.

### 3b. Wire the Pro CTA to Stripe Checkout

In `app/app/page.js`, the upgrade toast and the account popover's "Upgrade
to Pro" button should both call:

```jsx
const handleUpgrade = async (plan = 'monthly') => {
  if (!user) { setAuthOpen(true); return; }      // open auth first if anon
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, userId: user.id, email: user.email }),
  });
  const data = await res.json();
  if (data.url) window.location.href = data.url;
};
```

And "Manage subscription" in the account popover calls:

```jsx
const handlePortal = async () => {
  const res = await fetch('/api/stripe/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id }),
  });
  const data = await res.json();
  if (data.url) window.location.href = data.url;
};
```

### 3c. Wire document persistence

The prototype keeps docs in `useState`. In the live app, replace with
Supabase calls:

```jsx
// Load on sign-in
useEffect(() => {
  if (!user) { setDocs([]); return; }
  supabase.from('documents').select('*').order('updated_at', { ascending: false })
    .then(({ data }) => setDocs((data || []).map(rowToDoc)));
}, [user]);

// Add doc
const addDoc = async ({ title, text, kind }) => {
  if (!user) { setAuthOpen(true); return; }
  const wc = text.trim().split(/\s+/).filter(Boolean).length;
  const { data, error } = await supabase.from('documents')
    .insert({ user_id: user.id, title, content: text, word_count: wc, current_position: 0, total_words: wc })
    .select().single();
  if (error) return;
  setDocs((d) => [rowToDoc(data), ...d]);
  setCurrentDocId(data.id);
  router.push('/app?screen=reader');
};

// Update position periodically while reading
useEffect(() => {
  if (!user || !currentDocId) return;
  const i = setInterval(() => {
    supabase.from('documents').update({
      current_position: idx,
      updated_at: new Date().toISOString(),
    }).eq('id', currentDocId);
  }, 8000);
  return () => clearInterval(i);
}, [user, currentDocId, idx]);
```

Where `rowToDoc(row)` adapts a DB row into the shape `Reader` expects
(`{ id, title, kind, words, paragraphs, position, lastRead }`). Tokenisation
runs client-side.

---

## 4. Env vars

Create `.env.local` (and add to `.gitignore` if it isn't already):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_ANNUAL=

# Anthropic (optional) — when set, /api/recall-question generates per-passage
# recall questions with Claude Haiku. When unset, the route returns a curated
# prompt rotation. Either way the recall feature works.
ANTHROPIC_API_KEY=
```

Also create `.env.local.example` with the same keys (no values) and commit
that file. Keeps future contributors on rails.

You'll fill in actual values in §5 and §6.

---

## 5. New Supabase project — from zero

1. **Delete the old project**. Supabase Dashboard → old project → Settings
   → General → "Delete project". This is irreversible — make sure no users
   you care about exist there.
2. **Create a new project**. Region: pick what's closest to your users
   (Sydney if you're targeting AU). DB password: store it in a password
   manager.
3. Wait for it to provision (~2 minutes).

### 5a. Schema

In **SQL Editor → New query**, paste and run:

```sql
-- ─── Extensions ────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── profiles ──────────────────────────────────────────────────────────────
-- Auto-created at signup (trigger below).
create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   text,
  is_pro                  boolean not null default false,
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  stripe_status           text,
  monthly_words_used      integer not null default 0,
  monthly_words_period    date    not null default date_trunc('month', now())::date,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── documents ─────────────────────────────────────────────────────────────
create table public.documents (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  content           text not null,
  kind              text not null default 'T',      -- 'P' pdf, 'D' docx, 'U' url, 'T' text
  word_count        integer not null default 0,
  current_position  integer not null default 0,
  total_words       integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index documents_user_updated_idx
  on public.documents (user_id, updated_at desc);
alter table public.documents enable row level security;
create policy "Users CRUD own documents"
  on public.documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── reading_sessions ──────────────────────────────────────────────────────
create table public.reading_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  document_id  uuid references public.documents(id) on delete set null,
  words_read   integer not null,
  wpm          integer not null,
  duration_ms  integer not null default 0,
  created_at   timestamptz not null default now()
);
create index reading_sessions_user_created_idx
  on public.reading_sessions (user_id, created_at desc);
alter table public.reading_sessions enable row level security;
create policy "Users CRUD own reading_sessions"
  on public.reading_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Free-tier monthly metering ────────────────────────────────────────────
create or replace function public.consume_free_words(words_to_add integer)
returns table (allowed boolean, used integer, remaining integer)
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  p public.profiles%rowtype;
  cap constant integer := 5000;
  bucket date := date_trunc('month', now())::date;
  new_used integer;
begin
  select * into p from public.profiles where id = uid for update;
  if p.is_pro then return query select true, 0, 2147483647; return; end if;
  if p.monthly_words_period <> bucket then
    update public.profiles set monthly_words_used = 0, monthly_words_period = bucket where id = uid;
    p.monthly_words_used := 0;
  end if;
  new_used := p.monthly_words_used + greatest(words_to_add, 0);
  if new_used > cap then
    return query select false, p.monthly_words_used, greatest(cap - p.monthly_words_used, 0); return;
  end if;
  update public.profiles set monthly_words_used = new_used where id = uid;
  return query select true, new_used, cap - new_used;
end; $$;
```

Verify in **Table Editor**: `profiles`, `documents`, `reading_sessions` all
exist with the lock icon (RLS on). Open **Database → Triggers** — confirm
`on_auth_user_created` is present.

### 5b. Auth config

**Authentication → Providers**
- Email: enabled. Confirm email: ON for production, OFF locally if you want
  faster iteration.
- Google (optional): enable, paste OAuth client ID + secret from
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
  Authorised redirect URI:
  `https://YOUR_REF.supabase.co/auth/v1/callback`.

**Authentication → URL Configuration**
- Site URL: `https://your-domain.com` (use `localhost:3000` while developing,
  then switch when you go live).
- Redirect URLs: add `http://localhost:3000/**` and your production URL.

### 5c. Grab keys

**Project Settings → API**:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose)

Paste these into `.env.local`.

---

## 6. Stripe — fresh setup

Stay in **TEST mode** the whole way through this section. Toggle in the
top-right of the Stripe dashboard.

### 6a. Product + prices

**Products → Add product**
- Name: `TempoRead Pro`
- Description: `Unlimited reading, PDF/DOCX/URL import, cloud library, analytics`

Add two prices to the product:
- **Monthly** — `$5.00 AUD`, recurring monthly. Save. Copy the price ID
  (`price_…`) into `STRIPE_PRICE_MONTHLY`.
- **Annual** — `$35.00 AUD`, recurring yearly. Copy price ID into
  `STRIPE_PRICE_ANNUAL`.

### 6b. Webhook

**Developers → Webhooks → Add endpoint**
- Endpoint URL: `https://your-domain.com/api/stripe/webhook`
  (or the Vercel preview URL — you can edit this later. For local dev,
  use the Stripe CLI instead of registering localhost.)
- Select events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Save. Copy the **Signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

### 6c. Customer portal

**Settings → Billing → Customer portal** → enable. Allow:
- Update payment method
- Cancel subscription (at period end is fine)
- View invoice history

### 6d. Grab the secret key

**Developers → API keys** → copy the `sk_test_…` secret key into
`STRIPE_SECRET_KEY`.

Your `.env.local` is now complete. Triple-check no values are missing.

---

## 7. Local smoke test

```bash
# Restart dev server with the new env vars loaded
npm run dev

# In a second terminal, forward Stripe webhooks to localhost
stripe login          # one-time
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a `whsec_…` — **temporarily** override `STRIPE_WEBHOOK_SECRET`
in `.env.local` with this value, then restart `next dev`.

Open `http://localhost:3000`. Walk the happy path:

1. Land on the homepage. Hero demo plays. Nav scrolls smoothly.
2. Click "Start free". Auth modal opens. Sign up with any email.
3. After signup, library opens. Paste text → starts reading.
4. Open account popover (top right). Click "Upgrade to Pro".
5. Stripe Checkout opens with `$5 AUD/mo`. Pay with test card
   `4242 4242 4242 4242`, future expiry, any CVC.
6. Redirected back to `/app?upgraded=true`. Account popover now shows
   "Pro". Free-tier locks (PDF/DOCX gate, locked-doc badges) are gone.
7. In Supabase Table Editor → `profiles` → your row, `is_pro = true`.
8. Click "Manage subscription" in the popover. Stripe Billing Portal opens.
   Cancel. After the webhook fires, `is_pro` flips back.

If all 8 work, you are production-ready.

---

## 8. Deploy to Vercel

```bash
# From the repo root
npm install -g vercel    # if you don't have it
vercel                   # follow prompts, link to your GitHub repo
```

Or via Vercel dashboard: **Add New → Project → Import** your `temporead`
GitHub repo. Framework preset: Next.js (auto-detected).

**Settings → Environment Variables** — add every key from §4, for all three
environments (Production, Preview, Development). Be careful with these:

- `STRIPE_SECRET_KEY`: paste **test** key here while you verify, then swap
  to **live** later.
- `STRIPE_WEBHOOK_SECRET`: must be the signing secret of the **production**
  endpoint you create in §8a below, NOT the CLI's local one.

Deploy.

### 8a. Production webhook

Go back to **Stripe → Developers → Webhooks → Add endpoint**. Endpoint URL
is now `https://your-vercel-domain.vercel.app/api/stripe/webhook`. Same
three events. Copy the new signing secret into Vercel's
`STRIPE_WEBHOOK_SECRET` env var. Redeploy:

```bash
git commit --allow-empty -m "Refresh production env" && git push
```

### 8b. Swap Supabase to production URLs

**Supabase → Authentication → URL Configuration** → set Site URL to your
production domain. Add the production URL to Redirect URLs. (You can keep
`localhost:3000/**` for local dev.)

---

## 9. Go live with real money

Run the §7 smoke test once more against the deployed URL with test mode keys.
If it passes:

1. **Stripe** → top-right toggle from TEST to LIVE.
2. Re-create the product, monthly price, annual price, webhook in LIVE mode
   (Stripe segregates them entirely).
3. Update Vercel env vars: swap the four `STRIPE_*` vars to LIVE values.
4. Redeploy.
5. Run the §7 happy-path one more time with a real card. Refund yourself
   from the Stripe dashboard once you've confirmed `is_pro` flipped.

You are live.

---

## 10. Recap — the four moving parts

```
GitHub repo  ──push──►  Vercel build  ──serves──►  your domain
                              │
                              ├── reads NEXT_PUBLIC_SUPABASE_* (browser bundle)
                              ├── reads SUPABASE_SERVICE_ROLE_KEY (server only)
                              └── reads STRIPE_* (server only)
                                        │
                                        ▼
              Stripe Checkout ──redirect──► /app?upgraded=true
                  │
                  └─POST events──► /api/stripe/webhook
                                      │
                                      └── writes profiles.is_pro  ──► Supabase
```

If something breaks, work the diagram from left to right.

---

## 11. Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Sign-up returns "Database error saving new user" | The `on_auth_user_created` trigger is missing or the `profiles` table doesn't exist. | Re-run the schema block in §5a. |
| Stripe checkout opens but redirects back with the same `is_pro = false` | Webhook is not firing or is rejected with 400. | Check Stripe dashboard → Webhooks → recent deliveries. Most common: `STRIPE_WEBHOOK_SECRET` doesn't match the endpoint. |
| Webhook fires but `profiles.is_pro` doesn't change | The webhook is using the anon key, so RLS blocks the update. | The webhook route must `createClient(URL, SERVICE_ROLE_KEY)`. Confirm in `src/app/api/stripe/webhook/route.js`. |
| User signs up but immediately gets signed out on refresh | Cookies are blocked or the SSR client isn't set up. | You're using `createBrowserClient` from `@supabase/ssr` — that's correct. Make sure your domain matches Site URL exactly (including https). |
| Two Stripe customers created for one user | First checkout failed but a customer was created; the second succeeds with a new customer. | Already guarded: `/api/stripe/checkout` reads `profiles.stripe_customer_id` first. If you see duplicates, the bug is the route was edited. Restore from §3b. |

---

## 12. Optional improvements once it's stable

- **Email verification flow** — set Supabase to require email confirmation,
  build a `/auth/callback` page that redirects to `/app` on success.
- **Forgot password** — `supabase.auth.resetPasswordForEmail(email,
  { redirectTo: '/auth/reset' })`. Build the reset page.
- **Analytics dashboard** — `reading_sessions` already accumulates the data.
  Add `/app/analytics` showing minutes read, words read, peak WPM by week.
- **`consume_free_words` enforcement** — currently `monthly_words_used` is
  defined but not enforced. Wire it: every time a free user calls `addDoc`,
  call `supabase.rpc('consume_free_words', { words_to_add: wc })` first;
  block the save if `allowed = false` and open the upgrade toast.
- **Annual toggle on pricing** — add a `monthly|annual` segmented control
  above the price; pipe selection into `handleUpgrade(plan)`.
- **Soft delete of documents** — add `deleted_at` to `documents`, filter
  `select` queries. Lets users recover from accidental deletes.

That's the whole runway. Push the repo, follow the steps in order, and
you will end with a paid product on a custom domain.
