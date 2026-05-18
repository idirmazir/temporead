'use client'

export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 12, height: 12, background: 'var(--signal)',
        animation: 'tr-pulse 1.2s var(--ease) infinite',
      }}></div>
      <div style={{
        fontSize: 11,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--bone)',
        fontWeight: 500,
      }}>Loading</div>
      <style>{`
        @keyframes tr-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50%      { opacity: 1;   transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}
