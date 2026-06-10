import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Hardcoded for roofer-agent Supabase project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vwfxdvhxoyzmlexcjbaq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Znhkdmh4b3l6bWxleGNqYmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI4ODMsImV4cCI6MjA5NjUwODg4M30.qr4tPkssgTNcPJ45d2hxFHmgT_rftHh28gqT0x0UgKQ'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type SupabaseClient = typeof supabase
