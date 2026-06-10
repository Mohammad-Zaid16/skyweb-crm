export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      roofers: {
        Row: {
          id: string
          business_name: string
          owner_name: string | null
          email: string | null
          phone: string | null
          plan: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['roofers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['roofers']['Insert']>
      }
      leads: {
        Row: {
          id: string
          roofer_id: string
          name: string | null
          phone: string | null
          email: string | null
          postcode: string | null
          message: string | null
          source: string | null
          service_type: string | null
          urgency: string | null
          score: number | null
          status: string | null
          estimated_value: number | null
          assigned_roofer_decision: string | null
          preferred_time: string | null
          last_contact_at: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      lead_events: {
        Row: {
          id: string
          lead_id: string
          event_type: string
          payload: Json | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['lead_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['lead_events']['Insert']>
      }
      appointments: {
        Row: {
          id: string
          lead_id: string
          roofer_id: string
          scheduled_time: string
          status: string | null
          google_event_id: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      quotes: {
        Row: {
          id: string
          lead_id: string
          amount: number
          description: string | null
          status: string | null
          sent_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['quotes']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>
      }
      followups: {
        Row: {
          id: string
          lead_id: string
          stage: string | null
          message: string | null
          status: string | null
          scheduled_at: string | null
          sent_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['followups']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['followups']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          roofer_id: string
          type: string | null
          title: string | null
          message: string | null
          status: string | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      settings: {
        Row: {
          id: string
          roofer_id: string
          notify_email: boolean | null
          notify_whatsapp: boolean | null
          auto_accept_hot_leads: boolean | null
          followup_enabled: boolean | null
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['settings']['Insert']>
      }
    }
  }
}

// Convenience types
export type Roofer = Database['public']['Tables']['roofers']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadEvent = Database['public']['Tables']['lead_events']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type Quote = Database['public']['Tables']['quotes']['Row']
export type Followup = Database['public']['Tables']['followups']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Settings = Database['public']['Tables']['settings']['Row']

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'BOOKED' | 'WON' | 'LOST'
export type LeadUrgency = 'emergency' | 'high' | 'medium' | 'low'
export type LeadSource = 'google' | 'referral' | 'website' | 'facebook' | 'callrail' | 'manual'
export type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
