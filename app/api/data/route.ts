import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const sb = createClient(
  'https://vwfxdvhxoyzmlexcjbaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Znhkdmh4b3l6bWxleGNqYmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI4ODMsImV4cCI6MjA5NjUwODg4M30.qr4tPkssgTNcPJ45d2hxFHmgT_rftHh28gqT0x0UgKQ',
  { auth: { persistSession: false } }
)
const ROOFER_ID = 'a1000000-0000-0000-0000-000000000001'

export async function GET() {
  const [appts, quotes, notifs, followups, roofer, settings] = await Promise.all([
    sb.from('appointments').select('*, leads(name,phone,postcode,service_type)').eq('roofer_id', ROOFER_ID).order('scheduled_time', { ascending: true }),
    sb.from('quotes').select('*, leads!inner(name,roofer_id,postcode,service_type)').eq('leads.roofer_id', ROOFER_ID).order('sent_at', { ascending: false }),
    sb.from('notifications').select('*').eq('roofer_id', ROOFER_ID).order('created_at', { ascending: false }),
    sb.from('followups').select('*, leads!inner(roofer_id,name,phone)').eq('leads.roofer_id', ROOFER_ID).order('scheduled_at', { ascending: true }),
    sb.from('roofers').select('*').eq('id', ROOFER_ID).single(),
    sb.from('settings').select('*').eq('roofer_id', ROOFER_ID).single(),
  ])
  return NextResponse.json({
    appointments: appts.data ?? [],
    quotes: quotes.data ?? [],
    notifications: notifs.data ?? [],
    followups: followups.data ?? [],
    roofer: roofer.data ?? null,
    settings: settings.data ?? null,
  })
}

export async function PATCH(req: Request) {
  const { table, id, data } = await req.json()
  const allowed = ['leads','quotes','notifications','appointments','settings','roofers','followups']
  if (!allowed.includes(table)) return NextResponse.json({ error: 'Not allowed' }, { status: 400 })
  const { data: result, error } = await sb.from(table as any).update(data).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const { table, data } = await req.json()
  const allowed = ['appointments','quotes','lead_events','notifications']
  if (!allowed.includes(table)) return NextResponse.json({ error: 'Not allowed' }, { status: 400 })
  const { data: result, error } = await sb.from(table as any).insert(data).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(result)
}