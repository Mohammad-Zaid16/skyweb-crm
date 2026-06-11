import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const sb = createClient(
  'https://vwfxdvhxoyzmlexcjbaq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Znhkdmh4b3l6bWxleGNqYmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI4ODMsImV4cCI6MjA5NjUwODg4M30.qr4tPkssgTNcPJ45d2hxFHmgT_rftHh28gqT0x0UgKQ',
  { auth: { persistSession: false } }
)

const ULTRAMSG_URL   = 'https://api.ultramsg.com/instance180111/messages/chat'
const ULTRAMSG_TOKEN = 'fx0xyeaxdaana9o7'
const ROOFER_ID      = 'a1000000-0000-0000-0000-000000000001'
const ROOFER_PHONE   = '923228051306'
const GEMINI_KEY     = 'AIzaSyDiB5D1Gp34VPONl5LFuOHvflmjRCIrmXU'
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`

const SYSTEM_PROMPT = `You are the Senior Customer Concierge for Peak Roofing Solutions, an elite UK roofing contractor.
Collect booking details through natural WhatsApp conversation.

CHANNEL RULES:
- Max 2-3 short sentences per reply.
- Max 1 emoji per message.
- Bold dates/times with **text**.
- Mobile-first: short, scannable, clear.

SCOPE: Roofing only. For anything else say: "We specialise exclusively in roofing - happy to get your inspection booked!"

COLLECT 6 SLOTS IN ORDER (track silently, never mention tracking):
1. name - full name, 2+ words
2. phone - UK or international number
3. email - valid email, or NOT_PROVIDED if they say skip/no email
4. service_type - Emergency Repair / Maintenance / Commercial / Full Replacement
5. urgency - inferred only: EMERGENCY / HIGH / STANDARD
6. preferred_booking_slot - from available slots only

VALIDATION:
name: 2+ words. Ask once if single word.
phone: UK (07xxx, 01xxx) or international (+44, +92). On fail ask once.
email: must have @ and domain. "skip" or "no email" = NOT_PROVIDED.
service_type:
  Emergency Repair = leak, water in, flooding, storm, wet ceiling
  Maintenance = routine, guttering, small repair
  Commercial = business, office, warehouse
  Full Replacement = new roof, full re-roof
  If unclear ask: "Is there water coming in, or more of a visual concern?"
urgency (NEVER ask, infer from words):
  EMERGENCY = leak, water in, flooding, urgent, emergency, storm damage
  HIGH = missing tiles, hole, visible damage
  STANDARD = routine, planning, quote
preferred_booking_slot: max 2 options per message.

AVAILABLE SLOTS:
- Friday 13 June 2026: 10:00 AM or 2:00 PM
- Monday 16 June 2026: 9:00 AM or 1:00 PM
- Tuesday 17 June 2026: 11:00 AM or 3:30 PM

SLOT ROUTING:
EMERGENCY: offer Friday first - "Given the urgency I can get someone to you this Friday"
HIGH: offer Friday + Monday
STANDARD: offer Monday + Tuesday
Max 2 options at once.

IMPLICIT EXTRACTION: Extract all data from one message silently. Ask only for next missing slot.

FIRST MESSAGE (no prior history): respond with:
"Hi there! Welcome to Peak Roofing Solutions. I am here to get your inspection booked quickly - could I start with your full name please?"

WHEN ALL 6 SLOTS CONFIRMED send confirmation then JSON on next line (no code fences):
"You are all booked in [firstname]! Confirmation will be sent to [email or your phone]. Our team will be with you on [date] at [time]."
{"name":"...","phone":"...","email":"...","service_type":"...","urgency":"...","preferred_booking_slot":"YYYY-MM-DD HH:MM"}

Slot times in 24hr:
Fri 10AM=2026-06-13 10:00, Fri 2PM=2026-06-13 14:00
Mon 9AM=2026-06-16 09:00, Mon 1PM=2026-06-16 13:00
Tue 11AM=2026-06-17 11:00, Tue 3:30PM=2026-06-17 15:30

JSON must be on its own line starting with { and ending with }. No text after JSON.`

async function sendWA(to: string, body: string) {
  await fetch(ULTRAMSG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: ULTRAMSG_TOKEN, to, body }),
  }).catch(e => console.error('sendWA error:', e))
}

async function callGemini(history: { role: string; content: string }[]): Promise<string> {
  const contents: { role: string; parts: { text: string }[] }[] = []
  for (const msg of history) {
    const role = msg.role === 'assistant' ? 'model' : 'user'
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n' + msg.content
    } else {
      contents.push({ role, parts: [{ text: msg.content }] })
    }
  }
  if (contents.length === 0 || contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] })
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    }),
  })

  const raw = await res.text()
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${raw.slice(0, 300)}`)
  const data = JSON.parse(raw)
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No text from Gemini: ' + raw.slice(0, 200))
  return text
}

function extractJSON(text: string): Record<string, string> | null {
  for (const re of [
    /\{[^\n{}]*"preferred_booking_slot"[^\n{}]*\}/,
    /\{[\s\S]*?"preferred_booking_slot"[\s\S]*?\}/,
  ]) {
    const m = text.match(re)
    if (!m) continue
    try {
      const p = JSON.parse(m[0])
      if (['name','phone','email','service_type','urgency','preferred_booking_slot'].every(k => k in p && p[k])) return p
    } catch { /* try next */ }
  }
  return null
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const d = payload?.data || {}
    const phone   = (d.from || '').replace('@c.us', '').replace(/^\+/, '')
    const msgBody = (d.body || '').trim()
    const fromMe  = d.fromMe || false
    const msgType = d.type   || ''

    if (fromMe || !phone || !msgBody || msgType !== 'chat') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Load session
    const { data: session } = await sb
      .from('whatsapp_sessions').select('*').eq('phone', phone).single()
    const isNew = !session
    let history: { role: string; content: string }[] = []
    if (session?.conversation_history) {
      try { history = JSON.parse(session.conversation_history) } catch { history = [] }
    }

    history.push({ role: 'user', content: msgBody })

    // Call Gemini — Vercel has no network restrictions
    let reply: string
    try {
      reply = await callGemini(history)
    } catch (err: any) {
      console.error('Gemini error:', err.message)
      await sendWA(phone, 'Sorry, I had a brief issue. Please send your message again.')
      return NextResponse.json({ ok: false, error: err.message })
    }

    history.push({ role: 'assistant', content: reply })

    const booking    = extractJSON(reply)
    const isComplete = booking !== null

    // Strip JSON line before sending to customer
    const human = reply.split('\n').filter((l: string) => !l.trim().startsWith('{')).join('\n').trim()
    await sendWA(phone, human || reply)

    if (isComplete && booking) {
      const svcMap: Record<string, string> = {
        'Emergency Repair': 'repair', 'Maintenance': 'repair',
        'Commercial': 'flat_roof', 'Full Replacement': 'full_replacement',
      }
      const urgMap: Record<string, string> = {
        'EMERGENCY': 'emergency', 'HIGH': 'high', 'STANDARD': 'medium',
      }
      const { error: ie } = await sb.from('leads').insert({
        roofer_id: ROOFER_ID, name: booking.name, phone: booking.phone,
        email: ['NOT_PROVIDED','UNVERIFIED'].includes(booking.email) ? null : booking.email,
        service_type: svcMap[booking.service_type] ?? 'repair',
        urgency: urgMap[booking.urgency] ?? 'medium',
        source: 'whatsapp', status: 'BOOKED',
        score: booking.urgency === 'EMERGENCY' ? 85 : booking.urgency === 'HIGH' ? 65 : 40,
        preferred_time: booking.preferred_booking_slot,
        message: `WhatsApp AI. Service: ${booking.service_type}. Slot: ${booking.preferred_booking_slot}`,
        estimated_value: 0,
      })
      if (ie) console.error('Insert error:', ie)
      else {
        await sendWA(ROOFER_PHONE,
          `New Booking!\nName: ${booking.name}\nPhone: ${booking.phone}\nEmail: ${booking.email}\nService: ${booking.service_type}\nUrgency: ${booking.urgency}\nSlot: ${booking.preferred_booking_slot}\nhttps://skyweb-crm.vercel.app/leads`)
        fetch('https://skywebbuk.app.n8n.cloud/webhook/skyweb-crm-appointment', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_name: booking.name, lead_phone: booking.phone,
            lead_email: booking.email, scheduled_time: booking.preferred_booking_slot,
            date_formatted: booking.preferred_booking_slot, roofer_id: ROOFER_ID }),
        }).catch(() => {})
      }
      await sb.from('whatsapp_sessions').delete().eq('phone', phone)
    } else {
      const sd = { phone, step: 'ai',
        conversation_history: JSON.stringify(history.slice(-30)),
        updated_at: new Date().toISOString() }
      if (isNew) await sb.from('whatsapp_sessions').insert(sd)
      else await sb.from('whatsapp_sessions').update(sd).eq('phone', phone)
    }

    return NextResponse.json({ ok: true, complete: isComplete })
  } catch (err: any) {
    console.error('Fatal:', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}