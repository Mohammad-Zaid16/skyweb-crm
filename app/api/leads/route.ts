import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Never cache — always fetch fresh leads
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Server-side only — bypasses Supabase allowlist entirely
const supabaseAdmin = createClient(
  'https://vwfxdvhxoyzmlexcjbaq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Znhkdmh4b3l6bWxleGNqYmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI4ODMsImV4cCI6MjA5NjUwODg4M30.qr4tPkssgTNcPJ45d2hxFHmgT_rftHh28gqT0x0UgKQ',
  { auth: { persistSession: false } }
)

const DEMO_ROOFER_ID = 'a1000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('roofer_id', DEMO_ROOFER_ID)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Leads API error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}