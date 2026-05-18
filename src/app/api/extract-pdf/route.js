export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const pdfParse = (await import('pdf-parse-new')).default
    const result = await pdfParse(buffer)

    if (!result.text?.trim()) {
      return Response.json(
        { error: 'No text found in PDF. The file may be image-based or scanned.' },
        { status: 400 }
      )
    }

    return Response.json({
      text: result.text.trim(),
      pages: result.numpages,
      filename: file.name,
    })
  } catch (error) {
    console.error('PDF extraction error:', error)
    return Response.json(
      { error: 'Failed to process PDF. The file may be corrupted or password protected.' },
      { status: 500 }
    )
  }
}
