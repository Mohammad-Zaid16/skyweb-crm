import { create } from 'zustand'
import type { Lead, Notification, Roofer } from '@/types/database'

interface CRMStore {
  // Active tenant
  activeTenant: Roofer | null
  setActiveTenant: (roofer: Roofer) => void

  // Leads
  leads: Lead[]
  setLeads: (leads: Lead[]) => void
  updateLead: (id: string, updates: Partial<Lead>) => void
  addLead: (lead: Lead) => void

  // Notifications
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  markNotificationRead: (id: string) => void
  addNotification: (notification: Notification) => void

  // UI State
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Selected leads for bulk actions
  selectedLeads: string[]
  toggleLeadSelection: (id: string) => void
  clearSelection: () => void
  selectAll: (ids: string[]) => void
}

export const useCRMStore = create<CRMStore>((set) => ({
  activeTenant: null,
  setActiveTenant: (roofer) => set({ activeTenant: roofer }),

  leads: [],
  setLeads: (leads) => set({ leads }),
  updateLead: (id, updates) =>
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),
  addLead: (lead) =>
    set((state) => ({ leads: [lead, ...state.leads] })),

  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => n.status === 'SENT').length,
    }),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, status: 'READ' } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.status === 'SENT' ? state.unreadCount + 1 : state.unreadCount,
    })),

  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  selectedLeads: [],
  toggleLeadSelection: (id) =>
    set((state) => ({
      selectedLeads: state.selectedLeads.includes(id)
        ? state.selectedLeads.filter((l) => l !== id)
        : [...state.selectedLeads, id],
    })),
  clearSelection: () => set({ selectedLeads: [] }),
  selectAll: (ids) => set({ selectedLeads: ids }),
}))
