/**
 * Invia un record ore al Google Apps Script che scrive su Google Sheets
 */
export async function saveOreToSheets(payload) {
  const url = process.env.APPS_SCRIPT_URL
  if (!url) throw new Error('APPS_SCRIPT_URL non configurato in .env.local')

  console.log('[sheets] Payload →', payload)

  // Google Apps Script risponde con redirect multipli (302/303).
  // fetch di default converte POST → GET sul redirect, perdendo il body.
  // Seguiamo tutti i redirect manualmente come POST fino alla risposta finale.
  // Apps Script flow:
  // 1. POST a exec → Apps Script elabora → risponde 302 verso googleusercontent.com/echo
  // 2. GET all'echo URL → ritorna il JSON pre-calcolato
  const postRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'manual',
  })

  let text
  if (postRes.status >= 300 && postRes.status < 400) {
    const echoUrl = postRes.headers.get('location')
    console.log('[sheets] Echo URL →', echoUrl)
    const getRes = await fetch(echoUrl)
    text = await getRes.text()
  } else {
    text = await postRes.text()
  }

  console.log('[sheets] Risposta raw ←', text.slice(0, 300))
  return JSON.parse(text)
}
