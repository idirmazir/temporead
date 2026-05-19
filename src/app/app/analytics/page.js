'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { Icon, Kicker, Wordmark } from '@/components/rsvp'

/* /app/analytics — Pro-only summary of reading_sessions
   Stats are computed entirely client-side from the latest 500 sessions. RLS
   ensures users only see their own rows. */

export default function AnalyticsPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isPro, setIsPro] = useState(false)
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session?.user) { router.push('/app'); return }
      setUser(session.user)
      const { data: profile } = await supabase.from('profiles').select('is_pro').eq('id', session.user.id).single()
      setIsPro(!!profile?.is_pro)
      const { data: rows } = await supabase
        .from('reading_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      if (!cancelled) {
        setSessions(rows || [])
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [supabase, router])

  /* ─── Aggregate stats ─── */
  const stats = useMemo(() => {
    if (!sessions.length) {
      return { totalWords: 0, totalMinutes: 0, sessionCount: 0, avgWpm: 0, peakWpm: 0, last7: [], last30: [] }
    }
    const totalWords  = sessions.reduce((a, s) => a + (s.words_read || 0), 0)
    const totalMs     = sessions.reduce((a, s) => a + (s.duration_ms || 0), 0)
    const totalMinutes = Math.round(totalMs / 60000)
    const avgWpm = sessions.length
      ? Math.round(sessions.reduce((a, s) => a + (s.wpm || 0), 0) / sessions.length)
      : 0
    const peakWpm = sessions.reduce((a, s) => Math.max(a, s.wpm || 0), 0)

    // 30-day daily totals (words read per day)
    const today = new Date(); today.setHours(0,0,0,0)
    const buckets = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - (29 - i))
      return { date: d, words: 0, minutes: 0 }
    })
    const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const map = new Map(buckets.map((b) => [dayKey(b.date), b]))
    sessions.forEach((s) => {
      const t = new Date(s.created_at)
      const b = map.get(dayKey(new Date(t.getFullYear(), t.getMonth(), t.getDate())))
      if (b) {
        b.words += s.words_read || 0
        b.minutes += Math.round((s.duration_ms || 0) / 60000)
      }
    })
    const last30 = buckets
    const last7 = buckets.slice(-7)

    return { totalWords, totalMinutes, sessionCount: sessions.length, avgWpm, peakWpm, last7, last30 }
  }, [sessions])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--paper)' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'var(--ink)', borderBottom: '1px solid var(--bone-10)',
        height: 56, display: 'flex', alignItems: 'center',
      }}>
        <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <Link href="/app" style={{ display: 'flex', alignItems: 'center' }}><Wordmark size={16}></Wordmark></Link>
          <div style={{ color: 'var(--bone)', fontSize: 14, fontWeight: 500 }}>Reading analytics</div>
          <Link href="/app" style={{ color: 'var(--bone)', fontSize: 13 }}>Back to library &rarr;</Link>
        </div>
      </header>

      <main className="container-app" style={{ paddingTop: 48, paddingBottom: 96 }}>
        {loading && (
          <div style={{ color: 'var(--bone)', fontSize: 14 }}>Loading…</div>
        )}

        {!loading && !isPro && (
          <UpgradeWall></UpgradeWall>
        )}

        {!loading && isPro && sessions.length === 0 && (
          <div style={{ padding: '64px 24px', border: '1px dashed var(--bone-20)', textAlign: 'center', color: 'var(--bone)', fontSize: 14 }}>
            No reading sessions yet. Read for a bit and check back.
          </div>
        )}

        {!loading && isPro && sessions.length > 0 && (
          <>
            {/* Headline stats */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }}>
              <Stat label="Words read"        value={stats.totalWords.toLocaleString()}        sub="last 500 sessions"></Stat>
              <Stat label="Time reading"      value={`${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`} sub={`${stats.sessionCount} sessions`}></Stat>
              <Stat label="Average WPM"       value={String(stats.avgWpm)}                     sub="across sessions"></Stat>
              <Stat label="Peak WPM"          value={String(stats.peakWpm)}                    sub="your best beat"></Stat>
            </div>

            {/* 30-day bars */}
            <div style={{ marginBottom: 48 }}>
              <Kicker color="var(--signal)" style={{ marginBottom: 16 }}>Last 30 days</Kicker>
              <BarChart bars={stats.last30}></BarChart>
            </div>

            {/* Last 7-day breakdown */}
            <div>
              <Kicker color="var(--signal)" style={{ marginBottom: 16 }}>This week</Kicker>
              <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--bone-10)' }}>
                {stats.last7.map((b, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    padding: '14px 4px', borderBottom: '1px solid var(--bone-10)', fontSize: 13,
                  }}>
                    <span style={{ color: 'var(--bone)' }}>
                      {b.date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span style={{ color: 'var(--paper)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                      {b.words.toLocaleString()} words &middot; {b.minutes} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <style>{`
        @media (max-width: 720px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div style={{ padding: 24, border: '1px solid var(--bone-10)', background: 'var(--shadow)' }}>
      <Kicker color="var(--bone-60)" style={{ marginBottom: 12 }}>{label}</Kicker>
      <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--paper)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--bone-60)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function BarChart({ bars }) {
  const max = bars.reduce((a, b) => Math.max(a, b.words), 0) || 1
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 180, padding: '12px 0', borderBottom: '1px solid var(--bone-15)' }}>
      {bars.map((b, i) => {
        const h = Math.max(2, Math.round((b.words / max) * 160))
        const today = i === bars.length - 1
        return (
          <div key={i} title={`${b.date.toLocaleDateString()}: ${b.words.toLocaleString()} words`}
            style={{
              flex: 1, height: h, background: today ? 'var(--signal)' : 'var(--bone-30)',
              transition: 'background 200ms var(--ease)',
            }}></div>
        )
      })}
    </div>
  )
}

function UpgradeWall() {
  return (
    <div style={{ padding: 48, background: 'var(--shadow)', border: '1px solid var(--bone-10)', maxWidth: 600 }}>
      <Kicker color="var(--signal)" style={{ marginBottom: 16 }}>Pro feature</Kicker>
      <h1 className="h2" style={{ color: 'var(--paper)', marginBottom: 16 }}>Analytics is part of Pro.</h1>
      <p style={{ color: 'var(--bone)', fontSize: 15, lineHeight: 1.55, marginBottom: 32 }}>
        See your reading habits, average speed, peak WPM, and a 30-day chart of how much you&rsquo;ve covered.
      </p>
      <Link href="/app" className="btn btn-lg" style={{ background: 'var(--signal)', color: 'var(--paper)' }}>
        Back to library <Icon name="arrowRight" size={14}></Icon>
      </Link>
    </div>
  )
}
