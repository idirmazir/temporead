'use client'

import Link from 'next/link'
import { Wordmark } from '@/components/rsvp'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--paper)' }}>
      <nav style={{ borderBottom: '1px solid var(--bone-10)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}><Wordmark size={20}></Wordmark></Link>
          <Link href="/app" className="btn btn-primary btn-sm">Open app</Link>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 760, paddingTop: 64, paddingBottom: 96 }}>
        <div className="kicker" style={{ color: 'var(--signal)', marginBottom: 16 }}>Privacy Policy</div>
        <h1 className="h1" style={{ fontSize: 'clamp(36px, 5vw, 56px)', marginBottom: 12 }}>What we collect. What we don&rsquo;t.</h1>
        <p style={{ color: 'var(--bone)', fontSize: 13, marginBottom: 48 }}>Last updated: 18 May 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, color: 'var(--bone)', fontSize: 15, lineHeight: 1.65 }}>
          <Section n="1." title="Overview">
            TempoRead is operated by Idir Mazir from Perth, Western Australia. We collect the minimum data needed to run the service. No advertising trackers. No analytics scripts. No selling your data.
          </Section>

          <Section n="2." title="What we collect">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card title="Account">
                <ul style={listStyle}>
                  <li>Email address (for sign-in)</li>
                  <li>Subscription status and Stripe customer ID (for billing)</li>
                </ul>
              </Card>
              <Card title="Usage">
                <ul style={listStyle}>
                  <li>Documents you upload or paste (stored only in your library, accessible only by you)</li>
                  <li>Reading session statistics — words read, duration, average WPM</li>
                  <li>Reading position within each document</li>
                  <li>Preferences (theme, font, speed)</li>
                </ul>
              </Card>
              <Card title="What we do NOT collect">
                <ul style={listStyle}>
                  <li>No cookies for tracking or advertising</li>
                  <li>No location data</li>
                  <li>No analytics trackers (no Google Analytics, no Meta Pixel)</li>
                  <li>We do not sell or share your data with third parties</li>
                </ul>
              </Card>
            </div>
          </Section>

          <Section n="3." title="How we use it">
            <ul style={{ ...listStyle, paddingLeft: 16 }}>
              <li>To provide authentication, document storage, and reading analytics</li>
              <li>To process payments via Stripe</li>
              <li>To communicate about your account or material service changes</li>
            </ul>
          </Section>

          <Section n="4." title="Storage and security">
            <ul style={{ ...listStyle, paddingLeft: 16 }}>
              <li><strong style={{ color: 'var(--paper)' }}>Supabase</strong> — authentication + database (Postgres on AWS, encrypted at rest and in transit, row-level security so users can only access their own rows)</li>
              <li><strong style={{ color: 'var(--paper)' }}>Stripe</strong> — payments (PCI DSS Level 1 — we never see card details)</li>
              <li><strong style={{ color: 'var(--paper)' }}>Vercel</strong> — application hosting</li>
            </ul>
            <p style={{ marginTop: 8 }}>All traffic is HTTPS.</p>
          </Section>

          <Section n="5." title="Your rights">
            Under the Australian Privacy Act 1988 you can request access to, correction of, deletion of, or export of your data. Email <a href="mailto:support@temporead.app" style={{ color: 'var(--signal)' }}>support@temporead.app</a>. We respond within 30 days.
          </Section>

          <Section n="6." title="Retention">
            We retain your data while your account is active. On deletion, personal data and documents are removed within 30 days. Anonymised, aggregate analytics may be retained indefinitely.
          </Section>

          <Section n="7." title="Children">
            TempoRead is not intended for children under 16. We do not knowingly collect data from anyone under 16.
          </Section>

          <Section n="8." title="Changes">
            We may update this policy. Material changes are emailed to active users. The &ldquo;Last updated&rdquo; date reflects the most recent revision.
          </Section>

          <Section n="9." title="Contact">
            <a href="mailto:support@temporead.app" style={{ color: 'var(--signal)' }}>support@temporead.app</a>
          </Section>
        </div>
      </main>

      <footer style={{ background: 'var(--ink)', borderTop: '1px solid var(--bone-10)', padding: '32px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <Wordmark size={16}></Wordmark>
          <div style={{ display: 'flex', gap: 24, color: 'var(--bone)', fontSize: 13 }}>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <a href="mailto:support@temporead.app">Contact</a>
          </div>
          <div style={{ color: 'var(--bone)', fontSize: 13 }}>&copy; 2026 TempoRead &middot; Built in Perth</div>
        </div>
      </footer>
    </div>
  )
}

const listStyle = { listStyle: 'disc', paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }

function Section({ n, title, children }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 8 }}>
        <span style={{ color: 'var(--signal)', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, letterSpacing: '0.1em', fontVariantNumeric: 'tabular-nums' }}>{n}</span>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--paper)', letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ paddingLeft: 28 }}>{children}</div>
    </section>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--shadow)', border: '1px solid var(--bone-10)', padding: 20 }}>
      <div style={{ color: 'var(--paper)', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}
