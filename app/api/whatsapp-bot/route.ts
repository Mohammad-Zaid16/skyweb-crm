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

// Available booking slots
const SLOTS = [
  { label: 'Friday 13 June at 10:00 AM',  value: '2026-06-13 10:00', day: 'friday'  },
  { label: 'Friday 13 June at 2:00 PM',   value: '2026-06-13 14:00', day: 'friday'  },
  { label: 'Monday 16 June at 9:00 AM',   value: '2026-06-16 09:00', day: 'monday'  },
  { label: 'Monday 16 June at 1:00 PM',   value: '2026-06-16 13:00', day: 'monday'  },
  { label: 'Tuesday 17 June at 11:00 AM', value: '2026-06-17 11:00', day: 'tuesday' },
  { label: 'Tuesday 17 June at 3:30 PM',  value: '2026-06-17 15:30', day: 'tuesday' },
]

// ── Validators ────────────────────────────────────────────────────────────────
function isValidName(v: string): boolean {
  return v.trim().split(/\s+/).length >= 2 && !/^\d+$/.test(v)
}

function isValidPhone(v: string): boolean {
  const digits = v.replace(/[\s\-\(\)\+]/g, '')
  return /^\d{7,15}$/.test(digits)
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function classifyService(msg: string): string | null {
  const m = msg.toLowerCase()
  if (/leak|water.*(in|through|coming)|flood|wet ceil|storm damage|emergency|ceiling drip/.test(m)) return 'Emergency Repair'
  if (/full.*(re.?roof|replace)|new roof|replace.*(all|tiles|felt)|entire roof/.test(m)) return 'Full Replacement'
  if (/commercial|business|office|warehouse|retail|shop|factory/.test(m)) return 'Commercial'
  if (/routine|guttering|gutter|small (repair|fix)|maintenance|check|upkeep|clean/.test(m)) return 'Maintenance'
  return null
}

function inferUrgency(msg: string, service: string | null): string | null {
  const m = msg.toLowerCase()
  if (/leak|water.*(in|through|coming)|flood|wet ceil|urgent|emergency|tonight|same.?day|storm|drip/.test(m)) return 'EMERGENCY'
  if (/missing tile|hole|crack|visible damage|blown off|broken tile|structural/.test(m)) return 'HIGH'
  if (service === 'Maintenance' || /routine|check|planning|quote|future|upkeep/.test(m)) return 'STANDARD'
  if (service === 'Emergency Repair') return 'EMERGENCY'
  if (service === 'Full Replacement' || service === 'Commercial') return 'HIGH'
  return null
}

function getSlotsForUrgency(urgency: string): typeof SLOTS {
  if (urgency === 'EMERGENCY') return SLOTS.filter(s => s.day === 'friday')
  if (urgency === 'HIGH')      return SLOTS.filter(s => s.day === 'friday' || s.day === 'monday').slice(0, 4)
  return SLOTS.filter(s => s.day === 'monday' || s.day === 'tuesday')
}

function matchSlot(msg: string, urgency: string): string | null {
  const m = msg.toLowerCase()
  for (const slot of SLOTS) {
    const label = slot.label.toLowerCase()
    // Match by day + time keywords
    if (
      (m.includes('friday') || m.includes('13')) && (m.includes('10') || m.includes('morning')) && slot.value === '2026-06-13 10:00') return slot.value
    if (
      (m.includes('friday') || m.includes('13')) && (m.includes('2') || m.includes('afternoon') || m.includes('14')) && slot.value === '2026-06-13 14:00') return slot.value
    if (
      (m.includes('monday') || m.includes('16')) && (m.includes('9') || m.includes('morning')) && slot.value === '2026-06-16 09:00') return slot.value
    if (
      (m.includes('monday') || m.includes('16')) && (m.includes('1') || m.includes('afternoon') || m.includes('13')) && slot.value === '2026-06-16 13:00') return slot.value
    if (
      (m.includes('tuesday') || m.includes('17')) && (m.includes('11') || m.includes('morning')) && slot.value === '2026-06-17 11:00') return slot.value
    if (
      (m.includes('tuesday') || m.includes('17')) && (m.includes('3') || m.includes('3:30') || m.includes('afternoon') || m.includes('15')) && slot.value === '2026-06-17 15:30') return slot.value
  }
  // Match by number choice (1 or 2)
  const available = getSlotsForUrgency(urgency)
  if (/^1$|^option 1|^first/.test(m.trim()) && available[0]) return available[0].value
  if (/^2$|^option 2|^second/.test(m.trim()) && available[1]) return available[1].value
  return null
}

function formatSlotLabel(value: string): string {
  return SLOTS.find(s => s.value === value)?.label ?? value
}

// ── Send WhatsApp ─────────────────────────────────────────────────────────────
async function sendWA(to: string, body: string): Promise<void> {
  await fetch(ULTRAMSG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: ULTRAMSG_TOKEN, to, body }),
  }).catch(e => console.error('sendWA error:', e))
}

// ── Main conversation engine ──────────────────────────────────────────────────
async function processMessage(phone: string, msg: string): Promise<void> {
  const raw = msg.trim()
  const lower = raw.toLowerCase()

  // Load session
  const { data: session } = await sb
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone', phone)
    .single()

  const isNew = !session
  const step         = session?.step         ?? 'greeting'
  const name         = session?.name         ?? null
  const contactPhone = session?.contact_phone ?? null
  const email        = session?.email        ?? null
  const serviceType  = session?.service_type ?? null
  const urgency      = session?.urgency      ?? null
  const attempts     = session?.attempts     ?? 0

  // Scope lock — non-roofing topics
  if (/plumb|electri|paint|carpet|garden|double glaz/.test(lower)) {
    await sendWA(phone, "We specialise exclusively in roofing - I'd be happy to get a roofing inspection booked for you!")
    return
  }

  // Abuse handling
  if (/\b(fuck|shit|bastard|idiot|stupid bot)\b/.test(lower)) {
    await sendWA(phone, "I'm here to help with roofing enquiries. Please keep our conversation respectful.")
    return
  }

  // Bot question
  if (/are you (a )?(bot|ai|robot|human|real)/.test(lower)) {
    await sendWA(phone, "I'm an automated assistant for Peak Roofing Solutions - your details go straight to the team.")
    return
  }

  let reply = ''
  let nextStep = step
  let updates: Record<string, any> = { attempts: 0 }

  // ── Extract any implicit data from every message ──────────────────────────
  let impliedName    = name
  let impliedPhone   = contactPhone
  let impliedService = serviceType
  let impliedUrgency = urgency

  // Try to extract service from any message
  if (!impliedService) {
    const svc = classifyService(raw)
    if (svc) impliedService = svc
  }
  // Try to extract urgency from any message
  if (!impliedUrgency && impliedService) {
    const urg = inferUrgency(raw, impliedService)
    if (urg) impliedUrgency = urg
  }

  // ── STEP MACHINE ──────────────────────────────────────────────────────────
  switch (step) {

    case 'greeting':
    case 'ask_name': {
      // Check if they gave their name in the first message
      if (raw.length > 1 && isValidName(raw) && !['hi','hello','hey','hiya','good morning','good afternoon','good evening','help'].includes(lower)) {
        impliedName = raw
        updates.name = raw
        reply = `Thanks ${raw.split(' ')[0]}! What's the best phone number for us to reach you on?`
        nextStep = 'ask_phone'
      } else {
        reply = "Hi there! Welcome to *Peak Roofing Solutions*. I'm here to get your inspection booked quickly - could I start with your full name please?"
        nextStep = 'ask_name'
      }
      break
    }

    case 'ask_name': {
      if (isValidName(raw)) {
        impliedName = raw
        updates.name = raw
        reply = `Thanks ${raw.split(' ')[0]}! What's the best phone number for us to reach you on?`
        nextStep = 'ask_phone'
      } else if (attempts >= 2) {
        // Accept single word after 2 attempts
        impliedName = raw
        updates.name = raw
        reply = `Thanks! What's the best phone number for us to reach you on?`
        nextStep = 'ask_phone'
      } else {
        reply = `Could I take your *full name* please? (first and last name)`
        updates.attempts = attempts + 1
        nextStep = 'ask_name'
      }
      break
    }

    case 'ask_phone': {
      if (isValidPhone(raw)) {
        const cleanPhone = raw.replace(/[\s\-\(\)]/g, '')
        impliedPhone = cleanPhone
        updates.contact_phone = cleanPhone
        reply = `Got it! What's your *email address*? (or type *skip* if you don't have one)`
        nextStep = 'ask_email'
      } else if (attempts >= 2) {
        updates.attempts = 0
        reply = `No problem, we'll use WhatsApp to keep in touch. What's your *email address*? (or type *skip*)`
        nextStep = 'ask_email'
      } else {
        reply = `That doesn't look like a valid phone number - could you double-check it? (e.g. 07700 123456)`
        updates.attempts = attempts + 1
        nextStep = 'ask_phone'
      }
      break
    }

    case 'ask_email': {
      if (['skip','no','none','no email','dont have one','i dont have one',"don't have one",'nope','n/a'].some(w => lower.includes(w))) {
        updates.email = 'NOT_PROVIDED'
        reply = `No problem! What type of roofing work do you need?\n\n1️⃣ Emergency Repair\n2️⃣ Maintenance\n3️⃣ Commercial\n4️⃣ Full Replacement`
        nextStep = 'ask_service'
      } else if (isValidEmail(raw)) {
        updates.email = raw.trim().toLowerCase()
        reply = `Perfect! What type of roofing work do you need?\n\n1️⃣ Emergency Repair\n2️⃣ Maintenance\n3️⃣ Commercial\n4️⃣ Full Replacement`
        nextStep = 'ask_service'
      } else if (attempts >= 2) {
        updates.email = 'UNVERIFIED'
        updates.attempts = 0
        reply = `What type of roofing work do you need?\n\n1️⃣ Emergency Repair\n2️⃣ Maintenance\n3️⃣ Commercial\n4️⃣ Full Replacement`
        nextStep = 'ask_service'
      } else {
        reply = `That email doesn't look quite right - could you check it? Or type *skip* to continue.`
        updates.attempts = attempts + 1
        nextStep = 'ask_email'
      }
      break
    }

    case 'ask_service': {
      // Match by number or keyword
      let svc: string | null = null
      if (/^1$|emergency|leak|water|flood|urgent/.test(lower))        svc = 'Emergency Repair'
      else if (/^2$|mainten|routine|guttering|small|upkeep/.test(lower)) svc = 'Maintenance'
      else if (/^3$|commercial|business|office|warehouse/.test(lower)) svc = 'Commercial'
      else if (/^4$|full|replace|re.?roof|new roof/.test(lower))       svc = 'Full Replacement'
      else svc = classifyService(raw)

      if (svc) {
        impliedService = svc
        updates.service_type = svc
        // Ask urgency clarification only if needed
        if (svc === 'Emergency Repair') {
          impliedUrgency = 'EMERGENCY'
          updates.urgency = 'EMERGENCY'
          nextStep = 'ask_details'
          reply = `Understood - we treat this as a *priority*. Any additional details about the damage? (or type *skip*)`
        } else if (svc === 'Full Replacement' || svc === 'Commercial') {
          impliedUrgency = 'HIGH'
          updates.urgency = 'HIGH'
          nextStep = 'ask_details'
          reply = `Got it. Any additional details? (or type *skip*)`
        } else {
          // Need to determine urgency
          nextStep = 'ask_urgency'
          reply = `Got it. Is there any water coming in, or is it more of a visual/routine concern?\n\n1️⃣ Water is coming in\n2️⃣ Visual concern or routine`
        }
      } else if (attempts >= 2) {
        impliedService = 'Maintenance'
        impliedUrgency = 'STANDARD'
        updates.service_type = 'Maintenance'
        updates.urgency = 'STANDARD'
        updates.attempts = 0
        nextStep = 'ask_details'
        reply = `Any additional details about the work needed? (or type *skip*)`
      } else {
        reply = `Please reply with a number:\n\n1️⃣ Emergency Repair\n2️⃣ Maintenance\n3️⃣ Commercial\n4️⃣ Full Replacement`
        updates.attempts = attempts + 1
        nextStep = 'ask_service'
      }
      break
    }

    case 'ask_urgency': {
      if (/^1$|water|leak|coming in|flooding|urgent|emergency/.test(lower)) {
        impliedUrgency = 'EMERGENCY'
        updates.urgency = 'EMERGENCY'
      } else {
        impliedUrgency = 'STANDARD'
        updates.urgency = 'STANDARD'
      }
      nextStep = 'ask_details'
      reply = `Got it. Any additional details about the work? (or type *skip*)`
      break
    }

    case 'ask_details': {
      if (!['skip','none','no','n/a'].some(w => lower.includes(w))) {
        updates.message = raw
      }
      // Now present slots based on urgency
      const urg = impliedUrgency ?? urgency ?? 'STANDARD'
      const available = getSlotsForUrgency(urg)
      const slotMsg = urg === 'EMERGENCY'
        ? `Given the urgency, I can get someone to you *this Friday*:\n\n1️⃣ ${available[0]?.label}\n2️⃣ ${available[1]?.label}\n\nWhich works better?`
        : `Here are the next available slots:\n\n1️⃣ ${available[0]?.label}\n2️⃣ ${available[1]?.label}\n\nWhich works better?`
      reply = slotMsg
      nextStep = 'ask_slot'
      break
    }

    case 'ask_slot': {
      const urg = impliedUrgency ?? urgency ?? 'STANDARD'
      const chosen = matchSlot(raw, urg)
      if (chosen) {
        // All 6 slots collected — complete the booking
        const finalName    = impliedName    ?? name    ?? 'Customer'
        const finalPhone   = impliedPhone   ?? contactPhone ?? phone
        const finalEmail   = email          ?? 'NOT_PROVIDED'
        const finalService = impliedService ?? serviceType ?? 'Maintenance'
        const finalUrgency = impliedUrgency ?? urgency ?? 'STANDARD'
        const slotLabel    = formatSlotLabel(chosen)
        const firstName    = finalName.split(' ')[0]

        // Save lead to Supabase
        const svcMap: Record<string, string> = {
          'Emergency Repair': 'repair', 'Maintenance': 'repair',
          'Commercial': 'flat_roof', 'Full Replacement': 'full_replacement',
        }
        const urgMap: Record<string, string> = {
          'EMERGENCY': 'emergency', 'HIGH': 'high', 'STANDARD': 'medium',
        }
        const { error: ie } = await sb.from('leads').insert({
          roofer_id: ROOFER_ID,
          name: finalName,
          phone: finalPhone,
          email: ['NOT_PROVIDED','UNVERIFIED'].includes(finalEmail) ? null : finalEmail,
          service_type: svcMap[finalService] ?? 'repair',
          urgency: urgMap[finalUrgency] ?? 'medium',
          source: 'whatsapp',
          status: 'BOOKED',
          score: finalUrgency === 'EMERGENCY' ? 85 : finalUrgency === 'HIGH' ? 65 : 40,
          preferred_time: chosen,
          message: updates.message ?? session?.message ?? null,
          estimated_value: 0,
        })
        if (ie) console.error('Lead insert error:', ie)

        // Confirm to customer
        reply = `You're all booked in, ${firstName}! 🎉 Our team will be with you on *${slotLabel}*.\n\n${finalEmail !== 'NOT_PROVIDED' ? `A confirmation will be sent to ${finalEmail}.` : 'We will be in touch via WhatsApp.'}\n\nThank you for choosing Peak Roofing Solutions!`

        // Notify roofer
        await sendWA(ROOFER_PHONE,
          `New Booking via WhatsApp!\n\nName: ${finalName}\nPhone: ${finalPhone}\nEmail: ${finalEmail}\nService: ${finalService}\nUrgency: ${finalUrgency}\nSlot: ${slotLabel}\n\nView: https://skyweb-crm.vercel.app/leads`)

        // Fire n8n appointment webhook
        fetch('https://skywebbuk.app.n8n.cloud/webhook/skyweb-crm-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_name: finalName, lead_phone: finalPhone, lead_email: finalEmail,
            scheduled_time: chosen, date_formatted: slotLabel,
            service_type: finalService, urgency: finalUrgency, roofer_id: ROOFER_ID,
          }),
        }).catch(() => {})

        // Clear session
        await sb.from('whatsapp_sessions').delete().eq('phone', phone)
        await sendWA(phone, reply)
        return

      } else if (attempts >= 2) {
        // Just pick first available slot
        const urg2 = impliedUrgency ?? urgency ?? 'STANDARD'
        const avail = getSlotsForUrgency(urg2)
        reply = `Please reply with *1* or *2* to choose your slot:\n\n1️⃣ ${avail[0]?.label}\n2️⃣ ${avail[1]?.label}`
        updates.attempts = attempts + 1
        nextStep = 'ask_slot'
      } else {
        const urg2 = impliedUrgency ?? urgency ?? 'STANDARD'
        const avail = getSlotsForUrgency(urg2)
        reply = `Please choose:\n\n1️⃣ ${avail[0]?.label}\n2️⃣ ${avail[1]?.label}\n\nReply with *1* or *2*`
        updates.attempts = attempts + 1
        nextStep = 'ask_slot'
      }
      break
    }

    default: {
      // Reset
      await sb.from('whatsapp_sessions').delete().eq('phone', phone)
      reply = "Hi there! Welcome to *Peak Roofing Solutions*. I'm here to get your inspection booked - could I start with your full name please?"
      nextStep = 'ask_name'
    }
  }

  // Merge all inferred data into updates
  if (impliedService && !updates.service_type) updates.service_type = impliedService
  if (impliedUrgency && !updates.urgency)      updates.urgency      = impliedUrgency
  if (impliedName    && !updates.name)         updates.name         = impliedName
  if (impliedPhone   && !updates.contact_phone) updates.contact_phone = impliedPhone

  // Save session
  const sessionData = {
    phone, step: nextStep, ...updates,
    updated_at: new Date().toISOString(),
  }
  if (isNew) {
    await sb.from('whatsapp_sessions').insert(sessionData)
  } else {
    await sb.from('whatsapp_sessions').update(sessionData).eq('phone', phone)
  }

  await sendWA(phone, reply)
}

// ── Route handler ─────────────────────────────────────────────────────────────
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

    await processMessage(phone, msgBody)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Fatal:', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}