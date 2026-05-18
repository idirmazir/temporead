'use client'

import { useState, useEffect, useMemo } from 'react'
import { Icon, Kicker, Wordmark, RSVPWord, ProgressBar, WpmChips } from './rsvp'

function useScrolled(threshold = 80) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

/* ─── Nav ──────────────────────────────────────────────────────────── */
function LandingNav({ onStart, onSignIn }) {
  const scrolled = useScrolled(80)
  const goSection = (id) => (e) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <nav
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: scrolled ? 'var(--ink)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--bone-10)' : '1px solid transparent',
        transition: 'background 200ms var(--ease), border-color 200ms var(--ease)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        <button onClick={goSection('top')} style={{ display: 'flex', alignItems: 'center' }} aria-label="Top"><Wordmark size={20}></Wordmark></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-links">
          <button onClick={goSection('features')} className="nav-item">Features</button>
          <button onClick={goSection('pricing')}  className="nav-item">Pricing</button>
          <button onClick={onSignIn}              className="nav-item">Sign in</button>
          <button onClick={onStart} className="btn btn-primary btn-sm">
            Start free <Icon name="arrowRight" size={14}></Icon>
          </button>
        </div>
        <div className="nav-mobile">
          <button onClick={onStart} className="btn btn-primary btn-sm">
            Start free <Icon name="arrowRight" size={14}></Icon>
          </button>
        </div>
      </div>
      <style>{`
        .nav-item { color: var(--bone); font-size: 14px; font-weight: 500; transition: color 200ms var(--ease); }
        .nav-item:hover { color: var(--paper); }
        .nav-mobile { display: none; }
        @media (max-width: 720px) {
          .nav-links { display: none; }
          .nav-mobile { display: block; }
        }
      `}</style>
    </nav>
  )
}

/* ─── Hero — live RSVP demo ────────────────────────────────────────── */
const HERO_SENTENCE = "The average person reads 250 words per minute. At that pace, a single textbook chapter takes an hour. A research paper takes thirty minutes. The reading list piles up faster than you can clear it. RSVP reading changes the equation. Instead of your eyes jumping across a page, words appear one at a time in a fixed spot. Your brain stops working to track position and starts working to absorb meaning. Most people double their reading speed within a week. You are reading at 500 words per minute right now. You understood everything. That is the point."

function HeroDemo() {
  const words = useMemo(() => HERO_SENTENCE.trim().split(/\s+/).filter(Boolean), [])
  const [wpm, setWpm] = useState(500)
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  const prefersReduced = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (paused || prefersReduced) return
    const base = 60000 / wpm
    const cur = words[idx] || ''
    const last = cur.slice(-1)
    const delay =
      /[.!?]/.test(last) ? base * 2.6 :
      /["')\]]/.test(last) && /[.!?]/.test(cur.slice(-2, -1)) ? base * 2.6 :
      /[,:;\u2014\u2013\-]/.test(last) ? base * 1.5 :
      base
    const t = setTimeout(() => setIdx((i) => (i + 1) % words.length), delay)
    return () => clearTimeout(t)
  }, [wpm, words, idx, paused, prefersReduced])

  if (prefersReduced) {
    return (
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
        {['active', 'recall', 'works'].map((w, i) => (
          <div key={i} style={{ fontSize: 56 }}><RSVPWord word={w} fontSize={56}></RSVPWord></div>
        ))}
      </div>
    )
  }

  const word = words[idx] || ''

  return (
    <div
      onClick={() => setPaused((p) => !p)}
      style={{
        position: 'relative',
        background: 'var(--shadow)',
        border: '1px solid var(--bone-10)',
        padding: '56px 40px 32px',
        cursor: 'pointer',
        userSelect: 'none',
        minHeight: 420,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Kicker color="var(--bone)">{wpm} WPM</Kicker>
        <Kicker color="var(--bone-60)">{paused ? 'Paused · tap to resume' : 'Tap to pause'}</Kicker>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '32px 0' }}>
        <div style={{ width: '100%' }}>
          <RSVPWord word={word} fontSize={64}></RSVPWord>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ProgressBar value={idx + 1} max={words.length}></ProgressBar>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <Kicker color="var(--bone-60)">Speed</Kicker>
            <WpmChips value={wpm} onChange={setWpm}></WpmChips>
          </div>
          <div style={{ fontSize: 12, color: 'var(--bone-60)', fontVariantNumeric: 'tabular-nums' }}>
            {idx + 1}/{words.length}
          </div>
        </div>
      </div>
    </div>
  )
}

function Hero({ onStart }) {
  return (
    <section id="top" className="tr-grid" style={{ background: 'var(--ink)', paddingTop: 96, paddingBottom: 128 }}>
      <div className="container">
        <div style={{ maxWidth: 780, marginBottom: 72 }}>
          <Kicker color="var(--bone)" style={{ marginBottom: 24 }}>RSVP · Built for students</Kicker>
          <h1 className="h1" style={{ color: 'var(--paper)' }}>
            200 pages. 1 hour. Let&rsquo;s go.
          </h1>
          <p className="body-lg" style={{ color: 'var(--bone)', maxWidth: 560, marginTop: 24 }}>
            Paste your reading. We flash one word at a time with the focal point centred,
            so your eyes stop searching and your brain just reads.
          </p>
        </div>

        <HeroDemo></HeroDemo>

        <div style={{ display: 'flex', gap: 16, marginTop: 48, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={onStart}>
            Start reading <Icon name="arrowRight" size={16}></Icon>
          </button>
          <a href="#how" className="btn btn-ghost btn-lg">
            See how it works <Icon name="arrowRight" size={14}></Icon>
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── Problem section — live side-by-side ──────────────────────────── */
const COMPARISON_PARAGRAPH =
  "The fix is called active recall. After each section, close the book and write down what you remember. It feels harder because it is harder. That difficulty is the learning."

function ProblemSection() {
  const words = useMemo(() => COMPARISON_PARAGRAPH.split(/\s+/).filter(Boolean), [])

  const [tradIdx, setTradIdx] = useState(0)
  const [rsvpIdx, setRsvpIdx] = useState(0)

  useEffect(() => {
    const base = 60000 / 220
    const cur = words[tradIdx] || ''
    const last = cur.slice(-1)
    const delay = /[.!?]/.test(last) ? base * 2.4 : /[,:;]/.test(last) ? base * 1.4 : base
    const t = setTimeout(() => setTradIdx((i) => (i + 1) % words.length), delay)
    return () => clearTimeout(t)
  }, [tradIdx, words])

  useEffect(() => {
    const base = 60000 / 500
    const cur = words[rsvpIdx] || ''
    const last = cur.slice(-1)
    const delay = /[.!?]/.test(last) ? base * 2.4 : /[,:;]/.test(last) ? base * 1.4 : base
    const t = setTimeout(() => setRsvpIdx((i) => (i + 1) % words.length), delay)
    return () => clearTimeout(t)
  }, [rsvpIdx, words])

  const tradPct = ((tradIdx + 1) / words.length) * 100
  const rsvpPct = ((rsvpIdx + 1) / words.length) * 100

  return (
    <section style={{ background: 'var(--ink)', padding: '96px 0', borderTop: '1px solid var(--bone-10)' }}>
      <div className="container">
        <div style={{ maxWidth: 780, marginBottom: 64 }}>
          <Kicker color="var(--signal)" style={{ marginBottom: 16 }}>The problem</Kicker>
          <h2 className="h2" style={{ color: 'var(--paper)' }}>
            You have 3 chapters due tomorrow. Sound familiar?
          </h2>
          <p className="body-lg" style={{ color: 'var(--bone)', maxWidth: 600, marginTop: 16 }}>
            Watch the same paragraph, two ways. Same words, same comprehension.
          </p>
        </div>

        <div className="compare-grid">
          <div style={{ padding: '32px 32px 28px', border: '1px solid var(--bone-10)', background: 'var(--ink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
              <Kicker color="var(--bone-60)">Traditional</Kicker>
              <Kicker color="var(--bone-60)">220 WPM</Kicker>
            </div>
            <div style={{
              minHeight: 220, fontSize: 17, lineHeight: 1.7,
              color: 'var(--bone-60)', letterSpacing: '-0.005em', userSelect: 'none',
            }}>
              {words.map((w, i) => (
                <span key={i}>
                  <span style={{
                    background: i === tradIdx ? 'var(--signal-40)' : 'transparent',
                    color: i === tradIdx ? 'var(--paper)' : 'var(--bone-60)',
                    padding: '1px 2px', margin: '0 -2px',
                    transition: 'background 60ms linear, color 60ms linear',
                  }}>{w}</span>{' '}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 24, marginBottom: 12 }}>
              <ProgressBar value={tradIdx + 1} max={words.length}></ProgressBar>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--bone-60)' }}>
              <span>Eyes do the work · ~4 saccades per line</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(tradPct)}%</span>
            </div>
          </div>

          <div className="tr-grid" style={{ padding: '32px 32px 28px', border: '1px solid var(--signal-20)', background: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
              <Kicker color="var(--signal)">TempoRead</Kicker>
              <Kicker color="var(--signal)">500 WPM</Kicker>
            </div>
            <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%' }}>
                <RSVPWord word={words[rsvpIdx] || ''} fontSize={56}></RSVPWord>
              </div>
            </div>
            <div style={{ marginTop: 24, marginBottom: 12 }}>
              <ProgressBar value={rsvpIdx + 1} max={words.length}></ProgressBar>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--bone)' }}>
              <span>Page does the work · zero saccades</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(rsvpPct)}%</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 80, textAlign: 'center', maxWidth: 900, margin: '80px auto 0' }}>
          <div style={{
            fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 600,
            letterSpacing: '-0.025em', lineHeight: 1.2, color: 'var(--paper)',
          }}>
            Now multiply that by <span style={{ color: 'var(--signal)' }}>200 pages</span>.
          </div>
          <div style={{ marginTop: 16, color: 'var(--bone)', fontSize: 16 }}>
            That&rsquo;s the difference between a 4-hour study session and a 1-hour one.
          </div>
        </div>
      </div>
      <style>{`
        .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 880px) { .compare-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}

/* ─── How it works ─────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Drop your reading', body: 'PDF, DOCX, URL or paste text. 5,000 words free per month, unlimited on Pro.' },
    { n: '02', title: 'Pick your tempo',   body: 'Start at 300 WPM. Comfortable. Push to 700 when you find the rhythm.' },
    { n: '03', title: 'Read',              body: 'One word at a time, focal letter centred. Pause, replay, recall. Done in an hour.' },
  ]
  return (
    <section id="how" style={{ background: 'var(--ink)', padding: '96px 0' }}>
      <div className="container">
        <div style={{ maxWidth: 720, marginBottom: 64 }}>
          <Kicker color="var(--signal)" style={{ marginBottom: 16 }}>How it works</Kicker>
          <h2 className="h2" style={{ color: 'var(--paper)' }}>
            Three steps to faster reading. No training. No learning curve.
          </h2>
        </div>
        <div className="how-grid">
          {steps.map((s) => (
            <div key={s.n} style={{ borderTop: '1px solid var(--bone-20)', paddingTop: 32 }}>
              <span style={{ color: 'var(--signal)', fontSize: 44, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, display: 'block', marginBottom: 24 }}>{s.n}</span>
              <h3 className="h3" style={{ color: 'var(--paper)', marginBottom: 12 }}>{s.title}</h3>
              <p style={{ color: 'var(--bone)', fontSize: 15, lineHeight: 1.5, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; }
        @media (max-width: 880px) { .how-grid { grid-template-columns: 1fr; gap: 32px; } }
      `}</style>
    </section>
  )
}

/* ─── Features ─────────────────────────────────────────────────────── */
function Features() {
  const blocks = [
    { icon: 'fileText', title: 'PDF + DOCX import',          body: 'Drop in lecture slides, case readings, or chapter PDFs. Parsed server-side, ready in seconds.' },
    { icon: 'link',     title: 'URL extraction',             body: 'Paste a link to a law-review article or research paper. We pull the readable text.' },
    { icon: 'type',     title: 'Optimal recognition point',  body: 'Every word is centred on the focal letter, so your eyes never move. The brand signature.' },
    { icon: 'sliders',  title: 'Adjustable WPM',             body: 'Slide from 100 to 1000. Speed-ramp option ramps you up gradually as you settle in.' },
    { icon: 'brain',    title: 'Comprehension recall',       body: 'Periodic prompts ask what you just read. Catches drift before it costs you a chapter.' },
    { icon: 'library',  title: 'Cloud library',              body: 'Documents follow you between devices. Pick up where you left off — to the word.' },
    { icon: 'zap',      title: 'Speed ramp',                 body: 'Start gentle at 250 WPM and ramp to your target over the first minute. Easier to settle in.' },
    { icon: 'keyboard', title: 'Keyboard-first',             body: 'Space to pause. Arrows to scrub. ↑↓ for WPM. Press ? anywhere for the shortcut sheet.' },
    { icon: 'sparkles', title: 'Two themes, one focus',      body: 'Ink for night sessions. Paper for the morning. No mood-board carousel. Just two.' },
  ]
  return (
    <section id="features" style={{ background: 'var(--ink)', padding: '96px 0', borderTop: '1px solid var(--bone-10)' }}>
      <div className="container">
        <div style={{ maxWidth: 720, marginBottom: 64 }}>
          <Kicker color="var(--signal)" style={{ marginBottom: 16 }}>Features</Kicker>
          <h2 className="h2" style={{ color: 'var(--paper)' }}>
            Built for serious students. Every feature designed around how students actually study.
          </h2>
        </div>
        <div className="features-grid">
          {blocks.map((b, i) => (
            <div key={i} style={{ padding: 32, border: '1px solid var(--bone-10)' }}>
              <div style={{
                width: 32, height: 32, border: '1px solid var(--signal-20)',
                background: 'var(--ink)', color: 'var(--signal)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
              }}>
                <Icon name={b.icon} size={18}></Icon>
              </div>
              <h3 className="h3" style={{ color: 'var(--paper)', marginBottom: 8 }}>{b.title}</h3>
              <p style={{ color: 'var(--bone)', fontSize: 14, lineHeight: 1.55, margin: 0 }}>{b.body}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 960px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .features-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}

/* ─── Built for your field ─────────────────────────────────────────── */
function Fields() {
  const fields = [
    { icon: 'scale',       name: 'Law',        hrs: '25+ hrs/week reading', body: 'Case law, statutes, treatises. The hours add up before week 4.' },
    { icon: 'stethoscope', name: 'Medicine',   hrs: '30+ hrs/week reading', body: 'Pre-clinical textbooks, board prep, journal articles, the never-ending question banks.' },
    { icon: 'trendingUp',  name: 'Business',   hrs: '15+ hrs/week reading', body: 'Cases, market reports, financial filings. Skim is not a study strategy.' },
    { icon: 'bookOpen',    name: 'Humanities', hrs: '20+ hrs/week reading', body: 'Primary sources, theory, secondary criticism. Read more, write better.' },
  ]
  return (
    <section style={{ background: 'var(--ink)', padding: '96px 0' }}>
      <div className="container">
        <div style={{ maxWidth: 720, marginBottom: 64 }}>
          <Kicker color="var(--signal)" style={{ marginBottom: 16 }}>Built for your field</Kicker>
          <h2 className="h2" style={{ color: 'var(--paper)' }}>Perfect for your field</h2>
        </div>
        <div className="fields-grid">
          {fields.map((f, i) => (
            <div key={i} style={{ background: 'var(--paper)', color: 'var(--ink)', padding: 40, position: 'relative' }}>
              <div style={{ color: 'var(--signal)', marginBottom: 32 }}>
                <Icon name={f.icon} size={56} stroke={1.25}></Icon>
              </div>
              <h3 className="h3" style={{ color: 'var(--ink)', marginBottom: 8 }}>{f.name}</h3>
              <div className="kicker" style={{ color: 'var(--ink-60)', marginBottom: 16 }}>{f.hrs}</div>
              <p style={{ color: 'var(--ink)', fontSize: 15, lineHeight: 1.55, margin: 0, opacity: 0.85 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 760px) { .fields-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}

/* ─── Pricing ──────────────────────────────────────────────────────── */
function PricingCard({ kind, onPick }) {
  // Pro card uses paper background with red ticks + signal CTA.
  const isPro = kind === 'pro'
  const bg = isPro ? 'var(--paper)' : 'var(--shadow)'
  const fg = isPro ? 'var(--ink)'   : 'var(--paper)'
  const subFg = isPro ? 'var(--ink-60)' : 'var(--bone)'
  const checkColor = isPro ? 'var(--signal)' : 'var(--signal)'

  const features = isPro
    ? [
        'Everything in Free',
        'Unlimited reading',
        'PDF + DOCX + URL import',
        'Cloud library across devices',
        'Reading analytics',
        'Comprehension recall prompts',
        'Ink + Paper themes',
        'Priority support',
      ]
    : [
        'Paste text + TXT upload',
        '5,000 words per month',
        'Full RSVP reader',
        'Keyboard shortcuts',
        'Single device',
      ]

  return (
    <div style={{
      background: bg, color: fg,
      border: isPro ? 'none' : '1px solid var(--bone-20)',
      padding: 40,
      transform: isPro ? 'scale(1.04)' : 'none',
      transition: 'transform 200ms var(--ease)',
      position: 'relative',
    }}>
      <Kicker color={subFg} style={{ marginBottom: 24 }}>{isPro ? 'Pro' : 'Free'}</Kicker>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 56, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, color: fg }}>
          {isPro ? '$5' : '$0'}
        </span>
        <span style={{ fontSize: 13, color: subFg }}>AUD / month</span>
      </div>
      <div style={{ fontSize: 13, color: subFg, marginBottom: 32 }}>
        {isPro ? 'or $35/year (save 42%)' : 'forever'}
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: fg }}>
            <span style={{ color: checkColor, flexShrink: 0, marginTop: 2 }}>
              <Icon name="check" size={16} stroke={2}></Icon>
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onPick}
        className="btn btn-lg"
        style={{
          width: '100%', justifyContent: 'center',
          background: isPro ? 'var(--signal)' : 'transparent',
          color: 'var(--paper)',
          border: isPro ? 'none' : '1px solid var(--bone-30)',
        }}
      >
        {isPro ? 'Upgrade to Pro' : 'Start free'} <Icon name="arrowRight" size={14}></Icon>
      </button>
    </div>
  )
}

function Pricing({ onStart }) {
  return (
    <section id="pricing" className="tr-grid" style={{ background: 'var(--ink)', padding: '96px 0' }}>
      <div className="container">
        <div style={{ maxWidth: 720, marginBottom: 64 }}>
          <Kicker color="var(--signal)" style={{ marginBottom: 16 }}>Pricing</Kicker>
          <h2 className="h2" style={{ color: 'var(--paper)' }}>
            Start free. Upgrade when ready. No tricks. Free tier is genuinely useful.
          </h2>
        </div>
        <div className="pricing-grid">
          <PricingCard kind="free" onPick={onStart}></PricingCard>
          <PricingCard kind="pro"  onPick={onStart}></PricingCard>
        </div>
      </div>
      <style>{`
        .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; max-width: 880px; margin: 0 auto; }
        @media (max-width: 760px) { .pricing-grid { grid-template-columns: 1fr; gap: 24px; } }
      `}</style>
    </section>
  )
}

function FinalCTA({ onStart }) {
  return (
    <section style={{ background: 'var(--ink)', padding: '128px 0', borderTop: '1px solid var(--bone-10)' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <h2 className="h2" style={{ color: 'var(--paper)', maxWidth: 880, margin: '0 auto 32px' }}>
          Stop spending 4 hours on readings. Finish in 1.
        </h2>
        <p className="body-lg" style={{ color: 'var(--bone)', maxWidth: 560, margin: '0 auto 40px' }}>
          Free forever for up to 5,000 words per month. No card.
        </p>
        <button onClick={onStart} className="btn btn-primary btn-lg">
          Start reading <Icon name="arrowRight" size={16}></Icon>
        </button>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ background: 'var(--ink)', borderTop: '1px solid var(--bone-10)', padding: '32px 0' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
        <Wordmark size={16}></Wordmark>
        <div style={{ display: 'flex', gap: 24, color: 'var(--bone)', fontSize: 13 }}>
          <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: 'inherit' }}>Features</button>
          <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}  style={{ fontSize: 'inherit' }}>Pricing</button>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="mailto:support@temporead.app">Contact</a>
        </div>
        <div style={{ color: 'var(--bone)', fontSize: 13 }}>&copy; 2026 TempoRead &middot; Built in Perth</div>
      </div>
    </footer>
  )
}

/* ─── Auth modal (Supabase email + password) ───────────────────────── */
export function AuthModal({ open, onClose, onAuth, supabase, defaultMode = 'signin' }) {
  const [mode, setMode] = useState(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (open) { setMode(defaultMode); setEmail(''); setPassword(''); setLoading(false); setErr('') }
  }, [open, defaultMode])

  if (!open) return null
  const isSignup = mode === 'signup'
  const canSubmit = email.trim().includes('@') && password.length >= 6 && !loading

  const submit = async (e) => {
    e.preventDefault()
    if (!canSubmit || !supabase) return
    setLoading(true); setErr('')
    const { data, error } = isSignup
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) { setErr(error.message); return }
    onAuth && onAuth({ user: data?.user || null, mode })
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(6,13,22,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
      animation: 'modalFade 200ms var(--ease)',
    }}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--paper)', color: 'var(--ink)', width: '100%', maxWidth: 460,
        padding: '40px 40px 32px', position: 'relative',
        animation: 'modalSlide 240ms var(--ease)',
      }}>
        <button type="button" onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: 16, right: 16, color: 'var(--ink-60)', padding: 8,
        }}><Icon name="x" size={16}></Icon></button>

        <Kicker color="var(--ink-60)" style={{ marginBottom: 12 }}>{isSignup ? 'Create account' : 'Welcome back'}</Kicker>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 24 }}>
          {isSignup ? 'Start reading faster.' : 'Sign in to TempoRead'}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-60)', fontWeight: 500, marginBottom: 6 }}>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus autoComplete="email"
            placeholder="you@uni.edu.au"
            style={{ width: '100%', background: 'transparent', color: 'var(--ink)',
              border: 'none', borderBottom: '1px solid var(--ink-30)', padding: '10px 0',
              fontSize: 16, outline: 'none', fontFamily: 'inherit',
            }}></input>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-60)', fontWeight: 500, marginBottom: 6 }}>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isSignup ? 'new-password' : 'current-password'}
            placeholder={isSignup ? 'At least 6 characters' : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
            style={{ width: '100%', background: 'transparent', color: 'var(--ink)',
              border: 'none', borderBottom: '1px solid var(--ink-30)', padding: '10px 0',
              fontSize: 16, outline: 'none', fontFamily: 'inherit',
            }}></input>
        </div>

        {err && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--signal)', fontWeight: 500 }}>{err}</div>}

        <button type="submit" disabled={!canSubmit} className="btn btn-lg" style={{
          marginTop: 24, width: '100%', justifyContent: 'center',
          background: canSubmit ? 'var(--ink)' : 'rgba(14,14,16,0.25)',
          color: 'var(--paper)', cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}>
          {loading ? (isSignup ? 'Creating\u2026' : 'Signing in\u2026') : (isSignup ? 'Create account' : 'Sign in')}
          <Icon name="arrowRight" size={14}></Icon>
        </button>

        <div style={{ marginTop: 20, fontSize: 13, color: 'var(--ink-60)', textAlign: 'center' }}>
          {isSignup ? 'Already have an account? ' : 'New to TempoRead? '}
          <button type="button" onClick={() => setMode(isSignup ? 'signin' : 'signup')} style={{
            color: 'var(--signal)', fontWeight: 500, fontSize: 'inherit',
          }}>{isSignup ? 'Sign in' : 'Create one'}</button>
        </div>
      </form>
      <style>{`
        @keyframes modalFade  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlide { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  )
}

/* ─── Landing root ─────────────────────────────────────────────────── */
export default function Landing({ onStart, onSignIn }) {
  return (
    <div>
      <LandingNav onStart={onStart} onSignIn={onSignIn || onStart}></LandingNav>
      <Hero onStart={onStart}></Hero>
      <ProblemSection></ProblemSection>
      <HowItWorks></HowItWorks>
      <Features></Features>
      <Fields></Fields>
      <Pricing onStart={onStart}></Pricing>
      <FinalCTA onStart={onStart}></FinalCTA>
      <Footer></Footer>
    </div>
  )
}
