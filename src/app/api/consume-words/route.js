import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/* POST /api/consume-words
   Body: { wordsToAdd: number }
   Auth: Bearer <supabase access token> in the Authorization header.

   Calls the consume_free_words RPC under the user's JWT so RLS sees the
   correct auth.uid(). Pro users get { allowed: true, remaining: Infinity-ish }.
   Free users get atomic monthly-bucket accounting. The browser must read
   the response BEFORE inserting the document; if allowed is false, show the
   upgrade toast instead of inserting. */
export async function POST(request) {
  try {
    const auth = request.headers.get('authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '').trim()
    if (!token) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const { wordsToAdd } = await request.json()
    const n = Number(wordsToAdd)
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: 'Invalid wordsToAdd' }, { status: 400 })
    }

    // Create a client that authenticates *as* the user — RLS + auth.uid()
    // resolve correctly. Never use the service-role key here; that would
    // give every user write access to every row.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    const { data, error } = await supabase.rpc('consume_free_words', { words_to_add: Math.round(n) })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // RPC returns a single-row table — Supabase JS gives us an array.
    const row = Array.isArray(data) ? data[0] : data
    return NextResponse.json({
      allowed: !!row?.allowed,
      used: row?.used ?? 0,
      remaining: row?.remaining ?? 0,
    })
  } catch (err) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 })
  }
}
