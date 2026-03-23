import { saveOreToSheets } from '@/lib/sheets'

export async function POST(request) {
  try {
    const record = await request.json()
    await saveOreToSheets(record)
    return Response.json({ success: true })
  } catch (err) {
    console.error('save-ore error:', err)
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
