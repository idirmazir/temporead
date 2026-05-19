'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Toast } from '@/components/rsvp'
import {
  AppTopBar, Reader, Library, SettingsDrawer, RecallPrompt, UpgradeToast,
} from '@/components/app-screens'
import { AuthModal } from '@/components/landing'

// localStorage prefix — never change (see CLAUDE.md).
const TR_PREFS_KEY = 'tr-prefs'

// Default user preferences. Persisted to localStorage per the brief.
const DEFAULT_PREFS = {
  startWpm: 300,
  maxWpm: 700,
  ramp: true,
  theme: 'ink',
  fontSize: 'm',
  font: 'geist',
  recall: true,
  recallInterval: 1000,
}

/* Tokenise a raw text blob into the shape Reader expects. */
function tokenize(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean)
  return { words, totalWords: words.length }
}

/* Convert a Supabase `documents` row into the in-memory doc shape. */
function rowToDoc(row) {
  const { words, totalWords } = tokenize(row.content || '')
  return {
    id: row.id,
    title: row.title,
    text: row.content,
    kind: row.kind || 'T',
    position: Math.min(row.current_position || 0, totalWords - 1),
    totalWords,
    words,
    lastRead: relativeTime(row.updated_at || row.created_at),
    raw: row,
  }
}

function relativeTime(iso) {
  if (!iso) return 'just now'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const s = Math.max(0, Math.round((now - then) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr${h === 1 ? '' : 's'} ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`
  const w = Math.round(d / 7)
  if (w < 5) return `${w} week${w === 1 ? '' : 's'} ago`
  return new Date(iso).toLocaleDateString()
}

export default function AppPage() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [wordsUsed, setWordsUsed] = useState(0)

  const [docs, setDocs] = useState([])
  const [currentDocId, setCurrentDocId] = useState(null)
  const [view, setView] = useState('library') // 'library' | 'reader'

  const [prefs, setPrefsState] = useState(DEFAULT_PREFS)
  const setPrefs = useCallback((patch) => {
    setPrefsState((p) => {
      const next = { ...p, ...patch }
      try { localStorage.setItem(TR_PREFS_KEY, JSON.stringify(next)) } catch (_) {}
      return next
    })
  }, [])

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [recallOpen, setRecallOpen] = useState(false)
  const [recallQuestion, setRecallQuestion] = useState('')
  const [recallLoading, setRecallLoading] = useState(false)

  const requestRecall = useCallback(async (passage) => {
    if (!prefs.recall) return
    setRecallOpen(true)
    setRecallQuestion('')
    setRecallLoading(true)
    try {
      const res = await fetch('/api/recall-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage }),
      })
      const data = await res.json()
      setRecallQuestion(data.question || 'What was the main argument of the last passage?')
    } catch (_) {
      setRecallQuestion('What was the main argument of the last passage?')
    } finally {
      setRecallLoading(false)
    }
  }, [])
  const [toastOpen, setToastOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signin')

  const [feedback, setFeedback] = useState({ open: false, message: '', kind: 'info' })
  const showFeedback = useCallback((message, kind = 'info') => {
    setFeedback({ open: true, message, kind })
  }, [])

  /* ─── Load prefs from localStorage ─────────────────────────────── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TR_PREFS_KEY)
      if (raw) setPrefsState({ ...DEFAULT_PREFS, ...JSON.parse(raw) })
    } catch (_) {}
  }, [])

  /* ─── Watch auth state ─────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!cancelled) {
        setUser(session?.user || null)
        setLoadingAuth(false)
      }
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => { cancelled = true; subscription?.unsubscribe?.() }
  }, [supabase])

  /* ─── On sign-in: load profile, docs, monthly usage ────────────── */
  useEffect(() => {
    if (!user) { setDocs([]); setIsPro(false); setWordsUsed(0); return }

    // profile / pro flag / monthly usage
    supabase.from('profiles')
      .select('is_pro, monthly_words_used, monthly_words_period')
      .eq('id', user.id).single()
      .then(({ data }) => {
        if (!data) return
        setIsPro(!!data.is_pro)
        // Roll the bucket client-side too in case the DB hasn't yet.
        const thisBucket = new Date(); thisBucket.setDate(1)
        const dbBucket = data.monthly_words_period ? new Date(data.monthly_words_period) : new Date(0)
        const sameMonth = dbBucket.getUTCFullYear() === thisBucket.getUTCFullYear() &&
                          dbBucket.getUTCMonth() === thisBucket.getUTCMonth()
        setWordsUsed(sameMonth ? (data.monthly_words_used || 0) : 0)
      })

    // documents
    supabase.from('documents')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { showFeedback('Could not load library: ' + error.message, 'error'); return }
        setDocs((data || []).map(rowToDoc))
      })
  }, [user, supabase, showFeedback])

  /* ─── ?upgraded=true success banner ────────────────────────────── */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('upgraded') === 'true') {
      showFeedback('Welcome to Pro. Unlimited reading unlocked.', 'info')
      // Refresh profile so is_pro flips immediately even before webhook lag clears.
      if (user) {
        supabase.from('profiles').select('is_pro').eq('id', user.id).single()
          .then(({ data }) => { if (data) setIsPro(!!data.is_pro) })
      }
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('upgraded')
      window.history.replaceState({}, '', url.toString())
    }
  }, [user, supabase, showFeedback])

  /* ─── Helpers ──────────────────────────────────────────────────── */
  const currentDoc = useMemo(() =>
    docs.find((d) => d.id === currentDocId) || null,
    [docs, currentDocId])

  const FREE_LIMIT = 5000

  const persistDoc = useCallback(async (doc) => {
    if (!user) return null
    const { data, error } = await supabase.from('documents')
      .insert({
        user_id: user.id,
        title: doc.title,
        content: doc.text,
        word_count: doc.totalWords,
        current_position: 0,
        total_words: doc.totalWords,
        kind: doc.kind || 'T',
      })
      .select().single()
    if (error) { showFeedback('Could not save: ' + error.message, 'error'); return null }
    return data
  }, [user, supabase, showFeedback])

  const addDoc = useCallback(async ({ title, text, kind }) => {
    if (!user) { setAuthMode('signup'); setAuthOpen(true); return }
    const { words, totalWords } = tokenize(text)
    if (!totalWords) { showFeedback('No readable text found.', 'error'); return }

    // Server-side free-tier enforcement. The RPC also rolls the monthly
    // bucket atomically. Pro users always pass.
    if (!isPro) {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setAuthMode('signin'); setAuthOpen(true); return }
      try {
        const res = await fetch('/api/consume-words', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ wordsToAdd: totalWords }),
        })
        const meter = await res.json()
        if (!res.ok || !meter.allowed) {
          setToastOpen(true)
          return
        }
        if (typeof meter.used === 'number') setWordsUsed(meter.used)
      } catch (_) {
        showFeedback('Could not check usage. Try again.', 'error')
        return
      }
    }

    const row = await persistDoc({ title, text, totalWords, kind })
    if (!row) return
    const newDoc = rowToDoc(row)
    setDocs((d) => [newDoc, ...d])
    setCurrentDocId(newDoc.id)
    setView('reader')
  }, [user, isPro, supabase, persistDoc, showFeedback])

  const ingestFile = useCallback(async (file) => {
    if (!file) return
    const name = file.name || 'Document'
    const isTxt  = /\.txt$/i.test(name)  || file.type === 'text/plain'
    const isPdf  = /\.pdf$/i.test(name)  || file.type === 'application/pdf'
    const isDocx = /\.docx$/i.test(name) || (file.type && file.type.includes('word'))

    if ((isPdf || isDocx) && !isPro) { setToastOpen(true); return }

    if (isTxt) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = String(ev.target?.result || '')
        const title = name.replace(/\.[a-z]+$/i, '')
        addDoc({ title, text, kind: 'T' })
      }
      reader.readAsText(file)
      return
    }

    if (isPdf) {
      // PDF: server-side extraction
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { showFeedback(data.error || 'PDF extraction failed.', 'error'); return }
      addDoc({ title: name.replace(/\.pdf$/i, ''), text: data.text, kind: 'P' })
      return
    }

    if (isDocx) {
      // DOCX: mammoth runs in the browser
      try {
        const mammoth = await import('mammoth')
        const arrayBuffer = await file.arrayBuffer()
        const { value: text } = await mammoth.extractRawText({ arrayBuffer })
        addDoc({ title: name.replace(/\.docx$/i, ''), text, kind: 'D' })
      } catch (e) {
        showFeedback('DOCX extraction failed.', 'error')
      }
      return
    }

    showFeedback('Unsupported file type.', 'error')
  }, [isPro, addDoc, showFeedback])

  const recordSession = useCallback(async ({ wordsRead, wpm: sessionWpm, durationMs, documentId }) => {
    if (!user) return
    await supabase.from('reading_sessions').insert({
      user_id: user.id,
      document_id: documentId || null,
      words_read: wordsRead,
      wpm: sessionWpm,
      duration_ms: durationMs,
    })
  }, [user, supabase])
  const onPositionTick = useCallback((idx, total) => {
    if (!user || !currentDocId) return
    supabase.from('documents').update({
      current_position: idx,
      total_words: total,
      updated_at: new Date().toISOString(),
    }).eq('id', currentDocId).then(() => {})
  }, [user, currentDocId, supabase])

  /* ─── Stripe — checkout + portal ───────────────────────────────── */
  const handleUpgrade = useCallback(async (plan = 'monthly') => {
    if (!user) { setAuthMode('signup'); setAuthOpen(true); return }
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId: user.id, email: user.email }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showFeedback(data.error || 'Could not start checkout.', 'error')
    } catch (_) { showFeedback('Network error starting checkout.', 'error') }
  }, [user, showFeedback])

  const handlePortal = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showFeedback(data.error || 'Could not open billing portal.', 'error')
    } catch (_) { showFeedback('Network error opening portal.', 'error') }
  }, [user, showFeedback])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    setView('library')
    setCurrentDocId(null)
    showFeedback('Signed out.', 'info')
  }, [supabase, showFeedback])

  /* ─── Render ───────────────────────────────────────────────────── */
  const docTitle = view === 'reader' && currentDoc ? currentDoc.title : 'Library'

  return (
    <div style={{ background: 'var(--ink)', minHeight: '100vh' }}>
      <AppTopBar
        docTitle={docTitle}
        onHome={() => { window.location.href = '/' }}
        onLibrary={() => { setView('library'); setCurrentDocId(null) }}
        onSettings={() => setSettingsOpen(true)}
        user={user}
        isPro={isPro}
        wordsUsed={wordsUsed}
        wordLimit={FREE_LIMIT}
        onUpgrade={() => handleUpgrade('monthly')}
        onPortal={handlePortal}
        onAnalytics={() => { window.location.href = '/app/analytics' }}
        onSignOut={handleSignOut}
        onSignIn={() => { setAuthMode('signin'); setAuthOpen(true) }}
        inReader={view === 'reader'}
      ></AppTopBar>

      {view === 'library' && (
        <Library
          docs={docs}
          user={user}
          isFree={!isPro}
          isPro={isPro}
          onOpen={(id) => { setCurrentDocId(id); setView('reader') }}
          onAddDoc={addDoc}
          onIngestFile={ingestFile}
          onShowUpgrade={() => setToastOpen(true)}
          onSignIn={() => { setAuthMode('signin'); setAuthOpen(true) }}
        ></Library>
      )}

      {view === 'reader' && currentDoc && (
        <Reader
          doc={currentDoc}
          theme={prefs.theme}
          font={prefs.font}
          fontScale={prefs.fontSize}
          startWpm={prefs.startWpm}
          maxWpm={prefs.maxWpm}
          ramp={prefs.ramp}
          onRequestRecall={requestRecall}
          onPositionTick={onPositionTick}
          onSessionEnd={recordSession}
        ></Reader>
      )}

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        prefs={prefs}
        setPrefs={setPrefs}
      ></SettingsDrawer>

      <RecallPrompt
        open={recallOpen}
        question={recallQuestion}
        loading={recallLoading}
        onDismiss={() => setRecallOpen(false)}
      ></RecallPrompt>

      <UpgradeToast
        open={toastOpen}
        onDismiss={() => setToastOpen(false)}
        onUpgrade={() => { setToastOpen(false); handleUpgrade('monthly') }}
      ></UpgradeToast>

      <AuthModal
        open={authOpen}
        defaultMode={authMode}
        supabase={supabase}
        onClose={() => setAuthOpen(false)}
        onAuth={() => setAuthOpen(false)}
      ></AuthModal>

      <Toast
        open={feedback.open}
        message={feedback.message}
        kind={feedback.kind}
        onDismiss={() => setFeedback((f) => ({ ...f, open: false }))}
      ></Toast>
    </div>
  )
}
