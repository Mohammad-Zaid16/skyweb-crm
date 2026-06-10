import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://vwfxdvhxoyzmlexcjbaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Znhkdmh4b3l6bWxleGNqYmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI4ODMsImV4cCI6MjA5NjUwODg4M30.qr4tPkssgTNcPJ45d2hxFHmgT_rftHh28gqT0x0UgKQ',
  { auth: { persistSession: false } }
)

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { data, error } = await supabaseAdmin
    .from('lead_events').select('*').eq('lead_id', id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
