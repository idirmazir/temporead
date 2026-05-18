'use client'

import Link from 'next/link'
import { Wordmark } from '@/components/rsvp'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', color: 'var(--paper)' }}>
      <nav style={{ borderBottom: '1px solid var(--bone-10)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center' }}><Wordmark size={20}></Wordmark></Link>
          <Link href="/app" className="btn btn-primary btn-sm">Open app</Link>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 760, paddingTop: 64, paddingBottom: 96 }}>
        <div className="kicker" style={{ color: 'var(--signal)', marginBottom: 16 }}>Terms of Service</div>
        <h1 className="h1" style={{ fontSize: 'clamp(36px, 5vw, 56px)', marginBottom: 12 }}>The agreement.</h1>
        <p style={{ color: 'var(--bone)', fontSize: 13, marginBottom: 48 }}>Last updated: 18 May 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, color: 'var(--bone)', fontSize: 15, lineHeight: 1.65 }}>
          <Section n="1." title="Agreement to Terms">
            By accessing or using TempoRead, you agree to these Terms. If you do not agree, do not use the service. TempoRead is operated by Idir Mazir from Perth, Western Australia.
          </Section>

          <Section n="2." title="Description of Service">
            TempoRead is a web-based RSVP (Rapid Serial Visual Presentation) speed-reading application. You can paste text, upload documents, or import from URLs, and read the content one word at a time at an adjustable speed. Both free and paid tiers are available.
          </Section>

          <Section n="3." title="Accounts">
            Limited features are available without an account. To access Pro features and cloud storage you must create an account with a valid email address. You are responsible for maintaining the security of your credentials. You must be 16 or older.
          </Section>

          <Section n="4." title="Subscriptions and payments">
            TempoRead Pro is $5 AUD per month or $35 AUD per year. Payments are processed by Stripe — we never see your card details. Subscriptions auto-renew unless cancelled. You can cancel at any time via the billing portal in the app; cancellation takes effect at the end of the current period. Refunds are handled case-by-case within 7 days of a charge.
          </Section>

          <Section n="5." title="Your content">
            You retain ownership of all text and documents you upload. We do not read, analyse, sell, or share your content. Documents in your library are accessible only to you, enforced by row-level security at the database layer.
          </Section>

          <Section n="6." title="Acceptable use">
            You agree not to use the service for unlawful purposes, upload content that infringes third-party rights, attempt to access other users&rsquo; data, or interfere with the service or its infrastructure.
          </Section>

          <Section n="7." title="Service availability">
            We strive for high availability but make no guarantees. The service is provided as-is, without warranties of any kind. We may modify or discontinue features with reasonable notice.
          </Section>

          <Section n="8." title="Limitation of liability">
            To the maximum extent permitted by Australian law, TempoRead and its operator shall not be liable for indirect, incidental, special, or consequential damages. Total liability shall not exceed the amount you paid in the 12 months preceding the claim.
          </Section>

          <Section n="9." title="Termination">
            We may terminate or suspend your account at our discretion if you violate these Terms. You may delete your account at any time by contacting us. On termination, stored documents and reading data are deleted within 30 days.
          </Section>

          <Section n="10." title="Governing law">
            These Terms are governed by the laws of Western Australia. Disputes are resolved in the courts of Western Australia.
          </Section>

          <Section n="11." title="Contact">
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
