'use client'

// TempoRead — shared primitives.
// RSVPWord pixel-centers the focal letter via useLayoutEffect + offsetLeft.
// Slider is pointer-event (never use <input type=range> — snap bugs).

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'

/* ─── Lucide-style icon set ─────────────────────────────────────────
   1.5px stroke, rounded caps/joins, 24px box, currentColor. */
const ICON_PATHS = {
  scale: 'M16 16h6l-3-8-3 8zM2 16h6l-3-8-3 8zM7 21h10M12 3v18M3 7h2c2 0 5-1 7-1s5 1 7 1h2',
  stethoscope: 'M11 2v2M6 2v2M5 4h7v6a4 4 0 0 1-8 0V4zM8 14v3a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4v-3M16 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  trendingUp: 'M3 17l6-6 4 4 8-8M14 7h7v7',
  bookOpen: 'M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z',
  play: 'M6 4l14 8-14 8V4z',
  pause: 'M7 4h3v16H7zM14 4h3v16h-3z',
  skipBack: 'M19 20L9 12l10-8v16zM5 19V5',
  skipForward: 'M5 4l10 8-10 8V4zM19 5v14',
  rotate: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  check: 'M5 13l4 4L19 7',
  x: 'M6 6l12 12M18 6L6 18',
  arrowRight: 'M5 12h14M13 5l7 7-7 7',
  chevronRight: 'M9 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  upload: 'M12 3v12M7 8l5-5 5 5M5 21h14',
  fileText: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M9 14h6M9 18h4',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  type: 'M4 7V5h16v2M9 20h6M12 5v15',
  library: 'M3 4h4v16H3zM10 4h4v16h-4zM17 6l4 14-4 1',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  keyboard: 'M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12',
  clock: 'M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  zap: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
  brain: 'M9 3a3 3 0 0 0-3 3 3 3 0 0 0-3 3 3 3 0 0 0 1 2.2A3 3 0 0 0 3 14a3 3 0 0 0 3 3 3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V3a0 0 0 0 0 0 0zM15 3a3 3 0 0 1 3 3 3 3 0 0 1 3 3 3 3 0 0 1-1 2.2A3 3 0 0 1 21 14a3 3 0 0 1-3 3 3 3 0 0 1-3 3h0a3 3 0 0 1-3-3',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  sparkles: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  search: 'M11 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM21 21l-4.3-4.3',
  eye: 'M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  helpCircle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 1 1 5.8 1c0 2-3 3-3 3M12 17h.01',
}

export function Icon({ name, size = 20, stroke = 1.5, style, className }) {
  const d = ICON_PATHS[name]
  if (!d) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d={d}></path>
    </svg>
  )
}

export function Kicker({ children, color, style }) {
  return (
    <div className="kicker" style={{ color: color || 'var(--bone)', ...style }}>{children}</div>
  )
}

export function Wordmark({ size = 20, onPaper = false }) {
  return (
    <span className={'wordmark' + (onPaper ? ' on-paper' : '')} style={{ fontSize: size, lineHeight: 1 }}>
      <span className="tempo">Tempo</span><span className="read">Read</span>
    </span>
  )
}

export function orpIndex(word) {
  const n = word.length
  if (n <= 1) return 0
  if (n <= 5) return 1
  if (n <= 9) return 2
  if (n <= 13) return 3
  return 4
}

/* RSVPWord — pixel-centers the focal letter inside its container and scales
   the word down if it would otherwise overflow.

   Strategy: render once at natural size, measure the letter's offset within
   the inner span (offsetLeft is in untransformed local px, fast, no layout
   thrash). Compute the corrective shift to put the letter at container
   center, plus a uniform scale if the longer half-word exceeds the available
   half-canvas. Apply both via a single transform with transform-origin pinned
   to the letter so scaling doesn't perturb the centering. */
export function RSVPWord({ word, fontSize, fontFamily = 'var(--font-sans)', color = 'var(--bone)', signal = 'var(--signal)', showGuide = true, guideOpacity = 0.2 }) {
  const containerRef = useRef(null)
  const innerRef = useRef(null)
  const letterRef = useRef(null)

  const i = orpIndex(word)
  const before = word.slice(0, i)
  const letter = word.charAt(i) || '\u00A0'
  const after = word.slice(i + 1)

  useLayoutEffect(() => {
    const container = containerRef.current
    const inner = innerRef.current
    const letterEl = letterRef.current
    if (!container || !inner || !letterEl) return

    inner.style.transformOrigin = '50% 50%'
    inner.style.transform = 'translate(-50%, -50%)'

    const cw = container.clientWidth
    const iw = inner.offsetWidth
    if (iw === 0) return
    const lx = letterEl.offsetLeft + letterEl.offsetWidth / 2
    const ly = letterEl.offsetTop  + letterEl.offsetHeight / 2

    const dx = iw / 2 - lx
    const reach = Math.max(lx, iw - lx)
    const maxReach = cw / 2 - 8
    const scale = reach > maxReach && maxReach > 0 ? maxReach / reach : 1

    inner.style.transformOrigin = `${lx}px ${ly}px`
    inner.style.transform =
      `translate(calc(-50% + ${dx}px), -50%) scale(${scale})`
  }, [word, fontSize])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: `calc(${fontSize}px * 1.15)`,
        fontFamily,
        fontWeight: 500,
        fontSize,
        color,
        letterSpacing: '-0.02em',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {showGuide && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%', top: 0, bottom: 0, width: 1,
            background: signal,
            opacity: guideOpacity,
            transform: 'translateX(-0.5px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        ></div>
      )}
      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          whiteSpace: 'nowrap',
          transform: 'translate(-50%, -50%)',
          willChange: 'transform',
          zIndex: 1,
        }}
      >
        <span>{before}</span>
        <span ref={letterRef} style={{ color: signal }}>{letter}</span>
        <span>{after}</span>
      </div>
    </div>
  )
}

export function ProgressBar({ value, max = 100, height = 2, track = 'var(--bone-15)', fill = 'var(--signal)', style }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div style={{ width: '100%', height, background: track, position: 'relative', ...style }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`,
        background: fill, transition: 'width 200ms var(--ease)',
      }}></div>
    </div>
  )
}

/* Custom pointer-event slider — NEVER swap for <input type=range>. */
export function Slider({ value, min = 100, max = 1000, step = 10, onChange }) {
  const trackRef = useRef(null)
  const dragging = useRef(false)

  const handleMove = useCallback((clientX) => {
    const r = trackRef.current?.getBoundingClientRect()
    if (!r) return
    const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
    const raw = min + pct * (max - min)
    const snapped = Math.round(raw / step) * step
    onChange(Math.max(min, Math.min(max, snapped)))
  }, [min, max, step, onChange])

  useEffect(() => {
    const onUp = () => { dragging.current = false }
    const onMove = (e) => {
      if (!dragging.current) return
      const x = e.touches ? e.touches[0].clientX : e.clientX
      handleMove(x)
    }
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('touchmove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('touchmove', onMove)
    }
  }, [handleMove])

  const pct = ((value - min) / (max - min)) * 100

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={trackRef}
        onPointerDown={(e) => { dragging.current = true; handleMove(e.clientX) }}
        style={{
          position: 'relative', height: 32, display: 'flex', alignItems: 'center',
          cursor: 'pointer', touchAction: 'none',
        }}
      >
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'var(--bone-20)' }}></div>
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 2, background: 'var(--signal)' }}></div>
        <div style={{
          position: 'absolute', left: `${pct}%`, transform: 'translate(-50%, 0)',
          width: 14, height: 14, background: 'var(--signal)',
          boxShadow: '0 0 0 4px var(--ink)',
          borderRadius: 1,
        }}></div>
      </div>
    </div>
  )
}

export function WpmChips({ value, onChange, options = [200, 300, 500, 700] }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((wpm) => {
        const active = wpm === value
        return (
          <button
            key={wpm}
            onClick={() => onChange(wpm)}
            style={{
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.02em',
              border: '1px solid ' + (active ? 'var(--signal)' : 'var(--bone-30)'),
              background: active ? 'var(--signal)' : 'transparent',
              color: active ? 'var(--paper)' : 'var(--bone)',
              transition: 'all 200ms var(--ease)',
            }}
          >
            {wpm}
          </button>
        )
      })}
    </div>
  )
}

export function DocSpine({ kind = 'P' }) {
  return (
    <div style={{
      width: 40, height: 56, position: 'relative',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', left: 18, top: 0, bottom: 0, width: 4, background: 'var(--signal)' }}></div>
      <div style={{
        position: 'relative', marginTop: 4,
        fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
        color: 'var(--paper)', background: 'var(--signal)',
        width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{kind}</div>
    </div>
  )
}

/* ─── Shared full-screen Toast (replaces alert()) ──────────────────── */
export function Toast({ open, message, kind = 'info', onDismiss }) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => onDismiss && onDismiss(), 4500)
    return () => clearTimeout(t)
  }, [open, onDismiss])
  if (!open) return null
  const bg = kind === 'error' ? 'var(--signal)' : 'var(--paper)'
  const fg = kind === 'error' ? 'var(--paper)' : 'var(--ink)'
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 90,
      maxWidth: 360, background: bg, color: fg,
      padding: '14px 18px', fontSize: 14, fontWeight: 500,
      animation: 'toastIn 240ms var(--ease)',
    }}>
      {message}
      <style>{`
        @keyframes toastIn { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  )
}
