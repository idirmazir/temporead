'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Icon, Kicker, Wordmark, RSVPWord, ProgressBar, Slider, DocSpine } from './rsvp'

/* ─── App top bar ──────────────────────────────────────────────────── */
export function AppTopBar({
  docTitle, onHome, onLibrary, onSettings,
  user, isPro, wordsUsed = 0, wordLimit = 5000,
  onUpgrade, onPortal, onAnalytics, onSignOut, onSignIn,
  inReader,
}) {
  const [acctOpen, setAcctOpen] = useState(false)
  const acctRef = useRef(null)

  useEffect(() => {
    if (!acctOpen) return
    const onDown = (e) => {
      if (acctRef.current && !acctRef.current.contains(e.target)) setAcctOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [acctOpen])

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'var(--ink)',
        borderBottom: inReader ? '1px solid transparent' : '1px solid var(--bone-10)',
        height: 56,
        display: 'flex', alignItems: 'center',
        transition: 'border-color 200ms var(--ease)',
      }}
    >
      <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <button onClick={onHome} style={{ display: 'flex', alignItems: 'center' }} aria-label="Back to homepage">
          <Wordmark size={16}></Wordmark>
        </button>
        <div style={{ color: 'var(--bone)', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'center', maxWidth: 480 }}>
          {docTitle}
        </div>
        <div style={{ display: 'flex', gap: 4, position: 'relative' }} ref={acctRef}>
          <IconButton icon="library"  onClick={onLibrary}  label="Library"></IconButton>
          <IconButton icon="settings" onClick={onSettings} label="Settings"></IconButton>
          <IconButton icon="user"     onClick={() => setAcctOpen((o) => !o)} label="Account" active={acctOpen}></IconButton>

          {acctOpen && (
            <AccountPopover
              user={user}
              isPro={isPro}
              wordsUsed={wordsUsed}
              wordLimit={wordLimit}
              onUpgrade={() => { setAcctOpen(false); onUpgrade && onUpgrade() }}
              onPortal={() => { setAcctOpen(false); onPortal && onPortal() }}
              onAnalytics={() => { setAcctOpen(false); onAnalytics && onAnalytics() }}
              onSettings={() => { setAcctOpen(false); onSettings && onSettings() }}
              onSignOut={() => { setAcctOpen(false); onSignOut && onSignOut() }}
              onSignIn={() => { setAcctOpen(false); onSignIn && onSignIn() }}
            ></AccountPopover>
          )}
        </div>
      </div>
    </header>
  )
}

function IconButton({ icon, onClick, label, active }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? 'var(--signal)' : 'var(--bone)',
        transition: 'color 200ms var(--ease)',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--paper)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--bone)' }}
    >
      <Icon name={icon} size={18}></Icon>
    </button>
  )
}

function AccountPopover({ user, isPro, wordsUsed, wordLimit, onUpgrade, onPortal, onSettings, onAnalytics, onSignOut, onSignIn }) {
  if (!user) {
    return (
      <div style={popoverStyle}>
        <div style={{ padding: '18px 20px 16px' }}>
          <div style={{ fontSize: 13, color: 'var(--ink-60)', marginBottom: 12 }}>
            You&rsquo;re reading as a guest. Sign in to keep your library across devices.
          </div>
          <button onClick={onSignIn} className="btn btn-sm" style={{ background: 'var(--ink)', color: 'var(--paper)', width: '100%', justifyContent: 'center' }}>
            Sign in or sign up <Icon name="arrowRight" size={14}></Icon>
          </button>
        </div>
      </div>
    )
  }
  const isFree = !isPro
  const pct = isFree ? Math.min(100, (wordsUsed / wordLimit) * 100) : 0
  const near = isFree && pct > 80
  return (
    <div style={popoverStyle}>
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--ink-30)' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{user.email}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '2px 8px',
            background: isFree ? 'var(--ink)' : 'var(--signal)',
            color: 'var(--paper)',
          }}>{isFree ? 'Free' : 'Pro'}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-60)' }}>
            {isFree ? `${wordLimit.toLocaleString()} words / month` : 'Unlimited reading'}
          </span>
        </div>
      </div>

      {isFree && (
        <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid var(--ink-30)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12, marginBottom: 8 }}>
            <span style={{ color: 'var(--ink-60)' }}>Words this month</span>
            <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: near ? 'var(--signal)' : 'var(--ink)' }}>
              {wordsUsed.toLocaleString()} / {wordLimit.toLocaleString()}
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--ink-30)', position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'var(--signal)' }}></div>
          </div>
          {near && (
            <div style={{ fontSize: 11, color: 'var(--signal)', marginTop: 8, fontWeight: 500 }}>
              {wordLimit - wordsUsed > 0 ? `Only ${(wordLimit - wordsUsed).toLocaleString()} words left` : 'Free limit reached'}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '8px 0' }}>
        {isFree ? (
          <button
            onClick={onUpgrade}
            style={{
              width: '100%', textAlign: 'left', padding: '12px 20px', fontSize: 14, fontWeight: 500,
              background: 'var(--signal)', color: 'var(--paper)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span>Upgrade to Pro &middot; $5/mo</span>
            <Icon name="arrowRight" size={14}></Icon>
          </button>
        ) : (
          <>
            <PopoverItem icon="trendingUp" label="Reading analytics" onClick={onAnalytics}></PopoverItem>
            <PopoverItem icon="link" label="Manage subscription" onClick={onPortal}></PopoverItem>
          </>
        )}
        <PopoverItem icon="settings" label="All settings" onClick={onSettings}></PopoverItem>
        <div style={{ height: 1, background: 'var(--ink-30)', margin: '8px 0' }}></div>
        <PopoverItem label="Sign out" onClick={onSignOut}></PopoverItem>
      </div>
      <style>{`
        @keyframes acctIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

const popoverStyle = {
  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
  width: 300, background: 'var(--paper)', color: 'var(--ink)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  zIndex: 40,
  animation: 'acctIn 200ms var(--ease)',
}

function PopoverItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '10px 20px', fontSize: 13,
        color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 12,
        transition: 'background 150ms var(--ease)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(14,14,16,0.06)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {icon && <span style={{ color: 'var(--ink-60)' }}><Icon name={icon} size={14}></Icon></span>}
      <span>{label}</span>
    </button>
  )
}

/* ─── Reader ───────────────────────────────────────────────────────── */
function ControlButton({ icon, onClick, label, active, size = 40 }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--signal)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--bone)',
        border: '1px solid ' + (active ? 'var(--signal)' : 'var(--bone-20)'),
        transition: 'all 200ms var(--ease)',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--bone)'; e.currentTarget.style.color = 'var(--paper)' } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--bone-20)'; e.currentTarget.style.color = 'var(--bone)' } }}
    >
      <Icon name={icon} size={16}></Icon>
    </button>
  )
}

function formatTime(mins) {
  const m = Math.floor(mins)
  const s = Math.round((mins - m) * 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function Reader({ doc, theme = 'ink', font = 'geist', fontScale = 'm', startWpm = 300, maxWpm = 700, ramp = true, onRequestRecall, onPositionTick, onSessionEnd }) {
  const isPaper = theme === 'paper'
  const surface = isPaper ? 'var(--paper)' : 'var(--ink)'
  const signal = 'var(--signal)'

  const FONT_SIZES = { s: 56, m: 72, l: 96 }
  const fontPx = FONT_SIZES[fontScale] || FONT_SIZES.m
  const fontFamily = font === 'dyslexic'
    ? '"OpenDyslexic", "OpenDyslexic 3", var(--font-sans)'
    : 'var(--font-sans)'

  // wpm is what the user has manually dialled in. effectiveWpm is what we
  // actually play at, which during the ramp-in lerps from startWpm to wpm
  // over the first 60s. Once the ramp finishes (or if ramp is off), they
  // are identical and the slider is the source of truth.
  const [wpm, setWpm] = useState(maxWpm)
  const [rampActive, setRampActive] = useState(!!ramp)
  const sessionStartRef = useRef(null)
  const RAMP_MS = 60_000

  // Reset state when the document or prefs change
  useEffect(() => {
    setWpm(maxWpm)
    setRampActive(!!ramp)
    sessionStartRef.current = Date.now()
  }, [doc.id, maxWpm, ramp])

  const [idx, setIdx] = useState(doc.position || 0)
  const [playing, setPlaying] = useState(true)

  const words = doc.words

  // Track the session window. We emit a reading_sessions row when the user
  // pauses long-form (>30s of inactivity), navigates away, or unmounts.
  const sessionRef = useRef({ startIdx: doc.position || 0, lastIdx: doc.position || 0, startedAt: Date.now() })
  useEffect(() => {
    sessionRef.current = { startIdx: idx, lastIdx: idx, startedAt: Date.now() }
    // On idx change, just update lastIdx.
    return () => {
      const s = sessionRef.current
      const wordsRead = Math.max(0, s.lastIdx - s.startIdx)
      const durationMs = Date.now() - s.startedAt
      if (wordsRead >= 10 && onSessionEnd) {
        onSessionEnd({ wordsRead, wpm, durationMs, documentId: doc.id })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id])

  useEffect(() => { sessionRef.current.lastIdx = idx }, [idx])
  const effectiveWpm = useMemo(() => {
    if (!rampActive) return wpm
    const elapsed = Date.now() - (sessionStartRef.current || Date.now())
    if (elapsed >= RAMP_MS) return wpm
    const t = Math.max(0, Math.min(1, elapsed / RAMP_MS))
    // Ease-out so the early ramp feels generous, then closes in on target
    const eased = 1 - Math.pow(1 - t, 2)
    return Math.round(startWpm + (wpm - startWpm) * eased)
  }, [rampActive, wpm, startWpm, idx])  // idx in deps so it recomputes per word

  // Once the ramp finishes, drop out of ramp mode permanently for this doc
  useEffect(() => {
    if (!rampActive) return
    const t = setTimeout(() => setRampActive(false), RAMP_MS)
    return () => clearTimeout(t)
  }, [rampActive])

  // If the user manually drags the slider during ramp-in, treat that as
  // committing to that speed — exit the ramp immediately.
  const setWpmManual = useCallback((v) => { setRampActive(false); setWpm(v) }, [])

  // Variable-delay tick — full stops and punctuation get a longer pause.
  useEffect(() => {
    if (!playing) return
    const base = 60000 / effectiveWpm
    const cur = words[idx] || ''
    const last = cur.slice(-1)
    const delay =
      /[.!?]/.test(last) ? base * 2.6 :
      /["')\]]/.test(last) && /[.!?]/.test(cur.slice(-2, -1)) ? base * 2.6 :
      /[,:;\u2014\u2013\-]/.test(last) ? base * 1.5 :
      base
    const t = setTimeout(() => {
      setIdx((i) => {
        const next = i + 1
        if (next >= words.length) return i
        if (next > 0 && next % 1000 === 0 && onRequestRecall) {
          // Pass the last passage so the caller can generate a real question.
          const passage = words.slice(Math.max(0, next - 600), next).join(' ')
          onRequestRecall(passage)
        }
        return next
      })
    }, delay)
    return () => clearTimeout(t)
  }, [playing, effectiveWpm, idx, words, onRequestRecall])

  // Periodically report position back so the page can persist to Supabase.
  useEffect(() => {
    if (!onPositionTick) return
    const t = setInterval(() => onPositionTick(idx, words.length), 8000)
    return () => clearInterval(t)
  }, [idx, words.length, onPositionTick])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (e.code === 'Space')   { e.preventDefault(); setPlaying((p) => !p) }
      if (e.key === 'ArrowLeft')  setIdx((i) => Math.max(0, i - Math.round(wpm / 6)))
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(words.length - 1, i + Math.round(wpm / 6)))
      if (e.key === 'ArrowUp')   { e.preventDefault(); setWpmManual(Math.min(1000, wpm + 25)) }
      if (e.key === 'ArrowDown') { e.preventDefault(); setWpmManual(Math.max(100,  wpm - 25)) }
      if (e.key === 'r' || e.key === 'R') setIdx(0)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [wpm, words.length])

  const word = words[idx] || ''
  const wordsRemaining = words.length - idx
  const minsRemaining = Math.max(0, Math.round((wordsRemaining / Math.max(effectiveWpm, 1)) * 10) / 10)
  const timeRemaining = formatTime(minsRemaining)

  return (
    <div
      className={isPaper ? '' : 'tr-grid-quiet'}
      style={{
        background: surface,
        minHeight: 'calc(100vh - 56px)',
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px',
        gap: 64,
      }}
    >
      <div style={{ width: '100%', maxWidth: 720, position: 'relative' }}>
        <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%' }}>
            <RSVPWord
              word={word}
              fontSize={fontPx}
              fontFamily={fontFamily}
              color={isPaper ? 'var(--ink)' : 'var(--bone)'}
              signal={signal}
              guideOpacity={isPaper ? 0.18 : 0.2}
            ></RSVPWord>
          </div>
        </div>

        <div style={{ marginTop: 64 }}>
          <ProgressBar
            value={idx + 1} max={words.length}
            track={isPaper ? 'rgba(14,14,16,0.12)' : 'var(--bone-15)'}
          ></ProgressBar>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginTop: 12, fontSize: 13, fontWeight: 500,
            color: isPaper ? 'var(--ink-60)' : 'var(--bone)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span>{(idx + 1).toLocaleString()} / {words.length.toLocaleString()} words</span>
            <span>{timeRemaining} remaining</span>
          </div>
        </div>

        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ControlButton icon="skipBack"    onClick={() => setIdx((i) => Math.max(0, i - Math.round(wpm / 6)))} label="Back 10s"></ControlButton>
            <ControlButton icon={playing ? 'pause' : 'play'} onClick={() => setPlaying((p) => !p)} label={playing ? 'Pause' : 'Play'} active size={48}></ControlButton>
            <ControlButton icon="skipForward" onClick={() => setIdx((i) => Math.min(words.length - 1, i + Math.round(wpm / 6)))} label="Forward 10s"></ControlButton>
          </div>

          <div style={{ width: '100%', maxWidth: 480 }}>
            <div className="kicker" style={{ color: isPaper ? 'var(--ink-60)' : 'var(--bone)', marginBottom: 8, textAlign: 'center' }}>
              {rampActive
                ? <>{effectiveWpm} WPM <span style={{ color: 'var(--signal)', marginLeft: 6 }}>&middot; ramping to {wpm}</span></>
                : <>{wpm} WPM</>}
            </div>
            <Slider value={wpm} min={100} max={1000} step={25} onChange={setWpmManual}></Slider>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: isPaper ? 'var(--ink-60)' : 'var(--bone-60)', marginTop: 4 }}>
              <span>100</span><span>1000</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 24, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 16,
        color: isPaper ? 'var(--ink-60)' : 'var(--bone-60)',
        fontSize: 11, letterSpacing: '0.05em',
      }}>
        <ShortcutHint k="Space"  label="play/pause"></ShortcutHint>
        <ShortcutHint k="\u2190  \u2192" label="scrub"></ShortcutHint>
        <ShortcutHint k="\u2191  \u2193" label="WPM"></ShortcutHint>
        <ShortcutHint k="R"      label="restart"></ShortcutHint>
      </div>
    </div>
  )
}

function ShortcutHint({ k, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '2px 6px', border: '1px solid rgba(138,138,144,0.2)' }}>{k}</span>
      <span style={{ opacity: 0.7 }}>{label}</span>
    </span>
  )
}

/* ─── Recall prompt overlay ────────────────────────────────────────── */
export function RecallPrompt({ open, question, loading, onDismiss }) {
  const [countdown, setCountdown] = useState(15)
  useEffect(() => {
    if (!open) { setCountdown(15); return }
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { onDismiss('timeout'); return 15 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [open, onDismiss])

  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(14,14,16,0.4)', zIndex: 40, padding: 32,
      animation: 'recallFade 240ms var(--ease)',
    }}>
      <div style={{
        width: '100%', maxWidth: 720, background: 'var(--paper)', color: 'var(--ink)',
        padding: '40px 48px', position: 'relative',
        animation: 'recallSlide 280ms var(--ease)',
      }}>
        <Kicker color="var(--ink-60)" style={{ marginBottom: 16 }}>Quick recall</Kicker>
        <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.4, maxWidth: 620, marginBottom: 32, minHeight: 60 }}>
          {loading ? (
            <span style={{ opacity: 0.4 }}>Generating a question from the last passage&hellip;</span>
          ) : (question || 'What was the main argument of the last passage?')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <RecallChip onClick={() => onDismiss('got')}>Got it &rarr; continue</RecallChip>
          <RecallChip onClick={() => onDismiss('replay')}>Hmm, replay last 30s</RecallChip>
          <RecallChip onClick={() => onDismiss('skip')}>Skip prompt</RecallChip>
        </div>
        <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 11, color: 'var(--ink-60)', letterSpacing: '0.1em' }}>
          AUTO-CONTINUE IN {countdown}s
        </div>
      </div>
      <style>{`
        @keyframes recallFade  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes recallSlide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  )
}

function RecallChip({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 18px', background: 'transparent', color: 'var(--ink)',
        border: '1px solid var(--ink-30)', fontSize: 14, fontWeight: 500,
        transition: 'all 200ms var(--ease)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.color = 'var(--paper)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent';  e.currentTarget.style.color = 'var(--ink)' }}
    >{children}</button>
  )
}

/* ─── Upgrade toast — never a modal ─────────────────────────────────── */
export function UpgradeToast({ open, onDismiss, onUpgrade }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 50,
      width: 320, background: 'var(--paper)', color: 'var(--ink)',
      padding: 20, animation: 'toastIn 280ms var(--ease)',
    }}>
      <button onClick={onDismiss} style={{ position: 'absolute', top: 12, right: 12, color: 'var(--ink-60)' }} aria-label="Dismiss"><Icon name="x" size={14}></Icon></button>
      <div style={{ marginBottom: 12, color: 'var(--signal)' }}><Icon name="zap" size={18}></Icon></div>
      <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, marginBottom: 16 }}>
        Upgrade to Pro to import PDFs, DOCX and URLs.
      </div>
      <button onClick={onUpgrade} className="btn btn-sm" style={{ background: 'var(--ink)', color: 'var(--paper)', width: '100%', justifyContent: 'center' }}>
        Upgrade &rarr; $5/mo
      </button>
      <style>{`@keyframes toastIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

/* ─── Settings drawer ──────────────────────────────────────────────── */
export function SettingsDrawer({ open, onClose, prefs, setPrefs }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(5,5,7,0.5)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 240ms var(--ease)', zIndex: 60,
        }}
      ></div>
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, maxWidth: '100vw',
        background: 'var(--ink)', borderLeft: '1px solid var(--bone-10)',
        zIndex: 70, transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 280ms var(--ease)',
        overflowY: 'auto',
      }}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--bone-10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Kicker color="var(--bone)">Settings</Kicker>
          <button onClick={onClose} style={{ color: 'var(--bone)' }} aria-label="Close settings"><Icon name="x" size={18}></Icon></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <SettingsSection label="Reading speed defaults">
            <SettingsRow label="Starting WPM" value={`${prefs.startWpm} WPM`}>
              <Slider value={prefs.startWpm} min={100} max={700} step={25} onChange={(v) => setPrefs({ startWpm: v })}></Slider>
            </SettingsRow>
            <SettingsRow label="Maximum WPM" value={`${prefs.maxWpm} WPM`}>
              <Slider value={prefs.maxWpm} min={300} max={1000} step={25} onChange={(v) => setPrefs({ maxWpm: v })}></Slider>
            </SettingsRow>
            <ToggleRow label="Speed ramp" sub="Ramp from start to max over the first minute" value={prefs.ramp} onChange={(v) => setPrefs({ ramp: v })}></ToggleRow>
          </SettingsSection>

          <SettingsSection label="Display">
            <SegmentRow label="Theme"     options={[{ v: 'ink', l: 'Ink' }, { v: 'paper', l: 'Paper' }]} value={prefs.theme} onChange={(v) => setPrefs({ theme: v })}></SegmentRow>
            <SegmentRow label="Font size" options={[{ v: 's', l: 'Small' }, { v: 'm', l: 'Medium' }, { v: 'l', l: 'Large' }]} value={prefs.fontSize} onChange={(v) => setPrefs({ fontSize: v })}></SegmentRow>
            <SegmentRow label="Font"      options={[{ v: 'geist', l: 'Geist' }, { v: 'dyslexic', l: 'OpenDyslexic' }]} value={prefs.font} onChange={(v) => setPrefs({ font: v })}></SegmentRow>
          </SettingsSection>

          <SettingsSection label="Recall prompts">
            <ToggleRow label="Enable recall prompts" sub="Pauses to check comprehension as you read" value={prefs.recall} onChange={(v) => setPrefs({ recall: v })}></ToggleRow>
            <SettingsRow label="Prompt interval" value={`Every ${prefs.recallInterval} words`}>
              <Slider value={prefs.recallInterval} min={250} max={2500} step={250} onChange={(v) => setPrefs({ recallInterval: v })}></Slider>
            </SettingsRow>
          </SettingsSection>

          <SettingsSection label="Keyboard shortcuts">
            <KeyRow k="Space"   desc="Play / pause"></KeyRow>
            <KeyRow k="\u2190 / \u2192" desc="Scrub back / forward"></KeyRow>
            <KeyRow k="\u2191 / \u2193" desc="WPM +25 / -25"></KeyRow>
            <KeyRow k="R"       desc="Restart document"></KeyRow>
            <KeyRow k="Esc"     desc="Back to library"></KeyRow>
          </SettingsSection>
        </div>
      </aside>
    </>
  )
}

function SettingsSection({ label, children }) {
  return (
    <div>
      <Kicker color="var(--signal)" style={{ marginBottom: 16 }}>{label}</Kicker>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  )
}

function SettingsRow({ label, value, children }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ color: 'var(--paper)', fontSize: 14 }}>{label}</span>
        <span style={{ color: 'var(--bone)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
      {children}
    </div>
  )
}

function ToggleRow({ label, sub, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '4px 0' }}>
      <div>
        <div style={{ color: 'var(--paper)', fontSize: 14 }}>{label}</div>
        {sub && <div style={{ color: 'var(--bone)', fontSize: 12, marginTop: 2 }}>{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 22, position: 'relative',
          background: value ? 'var(--signal)' : 'var(--bone-20)',
          transition: 'background 200ms var(--ease)',
          flexShrink: 0,
        }}
        aria-pressed={value}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 21 : 3,
          width: 16, height: 16, background: value ? 'var(--paper)' : 'var(--paper)',
          transition: 'left 200ms var(--ease)',
        }}></div>
      </button>
    </div>
  )
}

function SegmentRow({ label, options, value, onChange }) {
  return (
    <div>
      <div style={{ color: 'var(--paper)', fontSize: 14, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', border: '1px solid var(--bone-20)' }}>
        {options.map((o) => {
          const active = o.v === value
          return (
            <button
              key={String(o.v)}
              onClick={() => onChange(o.v)}
              style={{
                flex: 1, padding: '10px 8px', fontSize: 13,
                background: active ? 'var(--signal)' : 'transparent',
                color: active ? 'var(--paper)' : 'var(--bone)',
                fontWeight: 500,
                transition: 'all 200ms var(--ease)',
                borderRight: '1px solid var(--bone-20)',
              }}
            >{o.l}</button>
          )
        })}
      </div>
    </div>
  )
}

function KeyRow({ k, desc }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <span style={{ color: 'var(--bone)' }}>{desc}</span>
      <span style={{ color: 'var(--paper)', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '2px 8px', border: '1px solid var(--bone-20)' }}>{k}</span>
    </div>
  )
}

/* ─── Library ──────────────────────────────────────────────────────── */
export function Library({ docs, onOpen, onAddDoc, onIngestFile, isFree, isPro, onShowUpgrade, onSignIn, user }) {
  const [dragOver, setDragOver] = useState(false)
  const [textOpen, setTextOpen] = useState(false)
  const [urlOpen,  setUrlOpen]  = useState(false)
  const fileInputRef = useRef(null)
  const FREE_LIMIT = 5000

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) onIngestFile(f)
  }

  const handleUploadClick = () => fileInputRef.current && fileInputRef.current.click()

  const handleFilePicked = (e) => {
    const f = e.target.files?.[0]
    if (f) onIngestFile(f)
    e.target.value = ''
  }

  return (
    <div style={{ background: 'var(--ink)', minHeight: 'calc(100vh - 56px)' }}>
      <div className="container-app" style={{ paddingTop: 48, paddingBottom: 96 }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            height: 200,
            background: 'var(--shadow)',
            border: '1px dashed ' + (dragOver ? 'var(--signal)' : 'var(--bone-30)'),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12,
            transition: 'all 200ms var(--ease)',
          }}
        >
          <div style={{ color: 'var(--bone)' }}><Icon name="upload" size={24}></Icon></div>
          <div style={{ color: 'var(--bone)', fontSize: 18, fontWeight: 500 }}>
            {isFree ? 'Drop a TXT file or paste text' : 'Drop a PDF, DOCX, or TXT here'}
          </div>
          <div style={{ display: 'flex', gap: 4, fontSize: 13, color: 'var(--bone-60)', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <span>or</span>
            <DropAction onClick={() => setTextOpen(true)}>paste text</DropAction>
            <span>&middot;</span>
            <DropAction onClick={handleUploadClick}>upload {isFree ? 'TXT' : 'file'}</DropAction>
            {isFree ? (
              <>
                <span>&middot;</span>
                <button
                  onClick={onShowUpgrade}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--bone-60)' }}
                >
                  <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>PDF &middot; DOCX &middot; URL</span>
                  <span style={{
                    fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
                    padding: '2px 6px', background: 'var(--signal)', color: 'var(--paper)',
                  }}>Pro</span>
                </button>
              </>
            ) : (
              <>
                <span>&middot;</span>
                <DropAction onClick={() => setUrlOpen(true)}>paste a URL</DropAction>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={isFree ? '.txt,text/plain' : '.txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'}
            onChange={handleFilePicked}
            style={{ display: 'none' }}
          ></input>
        </div>

        <div style={{ marginTop: 64 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
            <Kicker color="var(--signal)">Your library</Kicker>
            <span style={{ color: 'var(--bone)', fontSize: 12 }}>
              {!user ? 'Not signed in &middot; sign in to save' : (
                `${docs.length} documents \u00B7 ${isPro ? 'Pro plan \u00B7 unlimited' : 'Free plan \u00B7 5,000 words/mo'}`
              )}
            </span>
          </div>

          {!user && (
            <div style={{
              padding: '32px 24px', border: '1px dashed var(--bone-20)',
              textAlign: 'center', color: 'var(--bone)', fontSize: 14,
            }}>
              You&rsquo;re reading as a guest. <button onClick={onSignIn} style={{ color: 'var(--signal)', fontWeight: 500 }}>Sign in or sign up</button> to save documents to your library.
            </div>
          )}

          {user && (
            <div style={{ borderTop: '1px solid var(--bone-10)' }}>
              {docs.length === 0 && (
                <div style={{ padding: '40px 16px', color: 'var(--bone-60)', fontSize: 14 }}>
                  No documents yet. Drop or paste something above to start reading.
                </div>
              )}
              {docs.map((d) => {
                const locked = isFree && d.totalWords > FREE_LIMIT
                return (
                  <DocRow key={d.id} doc={d} locked={locked}
                    onOpen={() => locked ? onShowUpgrade() : onOpen(d.id)}></DocRow>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <IngestModal
        open={textOpen}
        onClose={() => setTextOpen(false)}
        title="Paste text"
        eyebrow="Drop in"
        confirmLabel="Start reading"
        placeholder="Paste your reading here. Lecture notes, an article, a chapter excerpt — anything plain text."
        kind="text"
        isFree={isFree}
        wordLimit={FREE_LIMIT}
        onSubmit={({ title, body }) => {
          onAddDoc && onAddDoc({ title: title || 'Pasted text', text: body, kind: 'T' })
          setTextOpen(false)
        }}
      ></IngestModal>

      <IngestModal
        open={urlOpen}
        onClose={() => setUrlOpen(false)}
        title="Import from URL"
        eyebrow="From the web"
        confirmLabel="Fetch + start"
        placeholder="https://www.example.com/article"
        kind="url"
        isFree={isFree}
        wordLimit={FREE_LIMIT}
        onSubmit={({ title, body }) => {
          onAddDoc && onAddDoc({ title: title || 'Imported URL', text: body, kind: 'U' })
          setUrlOpen(false)
        }}
      ></IngestModal>
    </div>
  )
}

function DropAction({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ color: 'var(--bone)', position: 'relative', padding: 0, fontSize: 13 }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--paper)'; const u = e.currentTarget.querySelector('span'); if (u) u.style.transform = 'scaleX(1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--bone)';   const u = e.currentTarget.querySelector('span'); if (u) u.style.transform = 'scaleX(0)' }}
    >
      {children}
      <span style={{
        position: 'absolute', left: 0, right: 0, bottom: -2, height: 1,
        background: 'var(--signal)', transform: 'scaleX(0)', transformOrigin: 'left center',
        transition: 'transform 200ms var(--ease)',
      }}></span>
    </button>
  )
}

function DocRow({ doc, onOpen, locked }) {
  const [hover, setHover] = useState(false)
  const pct = doc.totalWords > 0 ? Math.round((doc.position / doc.totalWords) * 100) : 0
  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 24,
        height: 72, padding: '0 16px',
        background: hover ? 'var(--shadow)' : 'transparent',
        borderBottom: '1px solid var(--bone-10)',
        cursor: 'pointer',
        transition: 'background 200ms var(--ease)',
        opacity: locked ? 0.65 : 1,
      }}
    >
      <DocSpine kind={doc.kind}></DocSpine>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--paper)', fontSize: 16, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 10 }}>
          {doc.title}
          {locked && (
            <span style={{
              fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
              padding: '2px 6px', background: 'var(--signal)', color: 'var(--paper)', flexShrink: 0,
            }}>Pro</span>
          )}
        </div>
        <div style={{ color: 'var(--bone)', fontSize: 12, marginTop: 4, display: 'flex', gap: 12 }}>
          <span>{doc.totalWords.toLocaleString()} words</span>
          <span>&middot;</span>
          <span>last read {doc.lastRead}</span>
          <span>&middot;</span>
          <span>{locked ? 'Exceeds 5,000-word free limit' : `${pct}% complete`}</span>
        </div>
      </div>
      <div style={{ width: 160, display: 'flex', alignItems: 'center', gap: 16 }}>
        {!locked && <ProgressBar value={pct} max={100}></ProgressBar>}
      </div>
      <button style={{ color: 'var(--bone)', padding: 8 }} onClick={(e) => e.stopPropagation()} aria-label="More">
        <Icon name="more" size={16}></Icon>
      </button>
    </div>
  )
}

/* ─── Ingest modal (paste text / paste URL) ────────────────────────── */
function IngestModal({ open, onClose, title, eyebrow, confirmLabel, placeholder, kind, isFree, wordLimit, onSubmit }) {
  const [docTitle, setDocTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setDocTitle(''); setBody(''); setLoading(false); setError('') }
  }, [open])

  const wordCount = useMemo(() => body.trim() ? body.trim().split(/\s+/).length : 0, [body])
  const overLimit = isFree && wordCount > wordLimit
  const canSubmit = !loading && !overLimit && (kind === 'text' ? wordCount > 0 : body.trim().length > 0)

  const submit = async () => {
    if (kind === 'url') {
      setLoading(true); setError('')
      try {
        const res = await fetch('/api/extract-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: body.trim() }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Could not fetch that URL.'); setLoading(false); return }
        onSubmit({ title: docTitle || data.title || data.source, body: data.text })
      } catch (e) {
        setError('Network error.')
      } finally {
        setLoading(false)
      }
      return
    }
    onSubmit({ title: docTitle, body: body.trim() })
  }

  if (!open) return null

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(5,5,7,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
      animation: 'modalFade 200ms var(--ease)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--paper)', color: 'var(--ink)', width: '100%', maxWidth: 640,
        padding: '40px 40px 32px', position: 'relative',
        animation: 'modalSlide 240ms var(--ease)',
      }}>
        <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, color: 'var(--ink-60)', padding: 8 }}>
          <Icon name="x" size={16}></Icon>
        </button>

        <Kicker color="var(--ink-60)" style={{ marginBottom: 12 }}>{eyebrow}</Kicker>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 24 }}>{title}</div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-60)', fontWeight: 500, marginBottom: 6 }}>
            Document title <span style={{ opacity: 0.6, textTransform: 'none', letterSpacing: 0 }}>&middot; optional</span>
          </label>
          <input type="text" value={docTitle} onChange={(e) => setDocTitle(e.target.value)}
            placeholder={kind === 'url' ? 'e.g. Caparo case note' : 'e.g. Tort lecture notes'}
            style={{
              width: '100%', background: 'transparent', color: 'var(--ink)',
              border: 'none', borderBottom: '1px solid var(--ink-30)', padding: '10px 0',
              fontSize: 16, outline: 'none', fontFamily: 'inherit',
            }}></input>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-60)', fontWeight: 500, marginBottom: 6 }}>
            {kind === 'url' ? 'URL' : 'Text'}
          </label>
          {kind === 'url' ? (
            <input type="url" value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} autoFocus
              style={{
                width: '100%', background: 'transparent', color: 'var(--ink)',
                border: 'none', borderBottom: '1px solid var(--ink-30)', padding: '10px 0',
                fontSize: 16, outline: 'none', fontFamily: 'inherit',
              }}></input>
          ) : (
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} rows={10} autoFocus
              style={{
                width: '100%', background: 'rgba(14,14,16,0.04)', color: 'var(--ink)',
                border: '1px solid var(--ink-30)', padding: '14px 16px',
                fontSize: 15, lineHeight: 1.5, outline: 'none', fontFamily: 'inherit', resize: 'vertical',
              }}></textarea>
          )}
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginTop: 12, fontSize: 12,
          color: overLimit ? 'var(--signal)' : 'var(--ink-60)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span>{kind === 'url'
            ? 'We extract just the article body, no nav or ads.'
            : (overLimit
                ? `${wordCount.toLocaleString()} words \u00B7 ${(wordCount - wordLimit).toLocaleString()} over the free limit`
                : `${wordCount.toLocaleString()} words${isFree ? ` \u00B7 ${wordLimit.toLocaleString()} free limit` : ''}`)}</span>
          {error && <span style={{ color: 'var(--signal)' }}>{error}</span>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
          <button onClick={onClose} className="btn" style={{ background: 'transparent', color: 'var(--ink)', padding: '14px 20px' }}>Cancel</button>
          <button onClick={submit} disabled={!canSubmit} className="btn btn-lg"
            style={{
              background: canSubmit ? 'var(--ink)' : 'rgba(14,14,16,0.2)',
              color: 'var(--paper)', cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}>
            {loading ? 'Fetching\u2026' : confirmLabel} <Icon name="arrowRight" size={14}></Icon>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalFade  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlide { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  )
}
