import { NextResponse } from 'next/server'

/* POST /api/recall-question
   Body: { passage: string }
   Returns: { question: string, source: 'claude' | 'curated' }

   When ANTHROPIC_API_KEY is set, asks Claude Haiku for a single, specific
   recall question about the passage. Otherwise rotates through a small set
   of generic prompts — the feature still works without an API key, the
   questions are just less specific. */

const CURATED = [
  'What was the main argument of the last passage?',
  'Sum the last passage up in one sentence.',
  'What is the one fact from the last passage you most want to remember?',
  'What evidence or example was used to support the main point?',
  'If you stopped reading right now and had to explain this to someone, what would you say?',
  'What was the most surprising claim in the last passage?',
  'What word or term in the last passage are you least sure of?',
  'Which sentence in the last passage felt most important?',
]

export async function POST(request) {
  try {
    const { passage } = await request.json().catch(() => ({}))
    const key = process.env.ANTHROPIC_API_KEY

    // No key → rotate through curated prompts.
    if (!key) {
      const q = CURATED[Math.floor(Math.random() * CURATED.length)]
      return NextResponse.json({ question: q, source: 'curated' })
    }

    // Trim the passage to keep tokens low. A few hundred words is plenty.
    const trimmed = (passage || '').slice(-2500).trim()
    if (trimmed.length < 80) {
      const q = CURATED[Math.floor(Math.random() * CURATED.length)]
      return NextResponse.json({ question: q, source: 'curated' })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 80,
        system:
          'You write ONE short comprehension-recall question for a student who has just read a passage. ' +
          'Goal: catch reading drift. Reference something specific from the passage so the student must actually have followed it. ' +
          'Tone: direct, no hedging. No preamble. No "based on the passage" — just the question. ' +
          'Output: a single sentence ending with a question mark. Under 22 words. No quotes, no markdown.',
        messages: [{ role: 'user', content: trimmed }],
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      // Fall back silently rather than crashing the reader.
      const q = CURATED[Math.floor(Math.random() * CURATED.length)]
      return NextResponse.json({ question: q, source: 'curated' })
    }
    const data = await res.json()
    let question = data?.content?.[0]?.text || ''
    question = question.trim().replace(/^["'\u201C\u201D]|["'\u201C\u201D]$/g, '').trim()
    if (!question || question.length > 220) {
      const q = CURATED[Math.floor(Math.random() * CURATED.length)]
      return NextResponse.json({ question: q, source: 'curated' })
    }
    return NextResponse.json({ question, source: 'claude' })
  } catch (_) {
    const q = CURATED[Math.floor(Math.random() * CURATED.length)]
    return NextResponse.json({ question: q, source: 'curated' })
  }
}
