'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { Icon, Kicker, Wordmark } from '@/components/rsvp'

/* /auth/reset
   Supabase redirects here from the password-reset email. The recovery token
   is already in the URL hash; the SDK picks it up and emits a PASSWORD_RECOVERY
   auth event, after which calling auth.updateUser({ password }) succeeds. */
export default function ResetPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [stage, setStage] = useState('checking') // 'checking' | 'ready' | 'done' | 'invalid'
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let recovered = false
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') { recovered = true; setStage('ready') }
    })
    // Fallback: if there's no recovery event after a tick, assume the link is bad.
    const t = setTimeout(() => { if (!recovered) setStage((s) => s === 'checking' ? 'invalid' : s) }, 2000)
    return () => { sub.data?.subscription?.unsubscribe?.(); clearTimeout(t) }
  }, [supabase])

  const canSubmit = !loading && password.length >= 6 && password === confirm

  const submit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true); setErr('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setErr(error.message); return }
    setStage('done')
    setTimeout(() => router.push('/app'), 1500)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--paper)' }}>
      <nav style={{ borderBottom: '1px solid var(--bone-10)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 72 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}><Wordmark size={20}></Wordmark></Link>
        </div>
      </nav>

      <main style={{ display: 'flex', justifyContent: 'center', padding: '64px 24px' }}>
        <form onSubmit={submit} style={{ background: 'var(--paper)', color: 'var(--ink)', width: '100%', maxWidth: 460, padding: '40px 40px 32px' }}>
          <Kicker color="var(--ink-60)" style={{ marginBottom: 12 }}>Reset password</Kicker>

          {stage === 'checking' && (
            <div style={{ fontSize: 16, color: 'var(--ink-60)' }}>Verifying your link…</div>
          )}

          {stage === 'invalid' && (
            <>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 16 }}>
                That link is no longer valid.
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink-60)', marginBottom: 24 }}>
                Reset links expire after a short time. Request a new one from the sign-in screen.
              </p>
              <Link href="/" className="btn btn-lg" style={{ background: 'var(--ink)', color: 'var(--paper)', width: '100%', justifyContent: 'center' }}>
                Back to home <Icon name="arrowRight" size={14}></Icon>
              </Link>
            </>
          )}

          {stage === 'ready' && (
            <>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 24 }}>
                Pick a new password.
              </div>

              <Field label="New password">
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 6 characters" autoFocus
                  style={fieldStyle}></input>
              </Field>
              <div style={{ marginTop: 16 }}>
                <Field label="Confirm new password">
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="Re-enter"
                    style={fieldStyle}></input>
                </Field>
              </div>

              {err && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--signal)', fontWeight: 500 }}>{err}</div>}
              {password && confirm && password !== confirm && (
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--signal)', fontWeight: 500 }}>Passwords don&rsquo;t match.</div>
              )}

              <button type="submit" disabled={!canSubmit} className="btn btn-lg" style={{
                marginTop: 24, width: '100%', justifyContent: 'center',
                background: canSubmit ? 'var(--ink)' : 'rgba(14,14,16,0.25)',
                color: 'var(--paper)', cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}>
                {loading ? 'Saving\u2026' : 'Save new password'} <Icon name="arrowRight" size={14}></Icon>
              </button>
            </>
          )}

          {stage === 'done' && (
            <>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 16 }}>
                Password updated.
              </div>
              <p style={{ fontSize: 14, color: 'var(--ink-60)' }}>Redirecting to the reader…</p>
            </>
          )}
        </form>
      </main>
    </div>
  )
}

const fieldStyle = {
  width: '100%', background: 'transparent', color: 'var(--ink)',
  border: 'none', borderBottom: '1px solid var(--ink-30)', padding: '10px 0',
  fontSize: 16, outline: 'none', fontFamily: 'inherit',
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-60)', fontWeight: 500, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
