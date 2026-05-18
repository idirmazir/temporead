import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing URL' }, { status: 400 })
    }

    // Basic URL validation
    let parsed
    try {
      parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Dynamic import (ESM module)
    const { extract } = await import('@extractus/article-extractor')

    const article = await extract(parsed.href, {}, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TempoRead/1.0)',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!article || !article.content) {
      return NextResponse.json(
        { error: 'Could not extract text from this page. It may be paywalled, require login, or use a format we can\'t parse.' },
        { status: 422 }
      )
    }

    // Strip HTML tags from content to get plain text
    const plainText = article.content
      .replace(/<[^>]*>/g, ' ')       // strip HTML tags
      .replace(/&nbsp;/g, ' ')        // HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')           // collapse whitespace
      .trim()

    const wordCount = plainText ? plainText.trim().split(/\s+/).filter(Boolean).length : 0
    if (!plainText || wordCount < 10) {
      return NextResponse.json(
        { error: 'Page had too little readable content. Try a different URL.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      text: plainText,
      title: article.title || parsed.hostname,
      wordCount,
      source: parsed.hostname,
    })
  } catch (err) {
    console.error('URL extraction error:', err)

    if (err.name === 'TimeoutError' || err.code === 'ABORT_ERR') {
      return NextResponse.json({ error: 'Request timed out. The page took too long to load.' }, { status: 408 })
    }

    return NextResponse.json(
      { error: 'Failed to extract text from this URL. The page may be blocked or unavailable.' },
      { status: 500 }
    )
  }
}