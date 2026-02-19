'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Lock, LogIn, LogOut, User, Phone, UserCheck, Users,
  DollarSign, CheckSquare, StickyNote, ChevronRight, Plus,
  TrendingUp, Clock, Calendar, Menu, X, Shield, Star, ArrowUpRight,
  Search, Bell, Settings, MapPin, FileText, Wrench, Truck, ShoppingCart, Package, Upload
} from 'lucide-react'

// ═══ LAZY LOADED MODALS (next/dynamic, ssr: false) ═══
const PasswordModal = dynamic(() => import('./components/PasswordModal'), { ssr: false })
const PasswordMenuModal = dynamic(() => import('./components/PasswordMenuModal'), { ssr: false })
const PasswordListModal = dynamic(() => import('./components/PasswordListModal'), { ssr: false })
const BudgetModal = dynamic(() => import('./components/BudgetModal'), { ssr: false })
const BudgetMenuModal = dynamic(() => import('./components/BudgetMenuModal'), { ssr: false })
const BudgetViewModal = dynamic(() => import('./components/BudgetViewModal'), { ssr: false })
const RecurringModal = dynamic(() => import('./components/RecurringModal'), { ssr: false })
const RecurringListModal = dynamic(() => import('./components/RecurringListModal'), { ssr: false })
const BudgetLimitModal = dynamic(() => import('./components/BudgetLimitModal'), { ssr: false })
const BudgetLimitsViewModal = dynamic(() => import('./components/BudgetLimitsViewModal'), { ssr: false })
const CallModal = dynamic(() => import('./components/CallModal'), { ssr: false })
const CallMenuModal = dynamic(() => import('./components/CallMenuModal'), { ssr: false })
const CallsListModal = dynamic(() => import('./components/CallsListModal'), { ssr: false })
const VisitModal = dynamic(() => import('./components/VisitModal'), { ssr: false })
const VisitsListModal = dynamic(() => import('./components/VisitsListModal'), { ssr: false })
const TaskModal = dynamic(() => import('./components/TaskModal'), { ssr: false })
const TasksListModal = dynamic(() => import('./components/TasksListModal'), { ssr: false })
const NoteModal = dynamic(() => import('./components/NoteModal'), { ssr: false })
const NotesListModal = dynamic(() => import('./components/NotesListModal'), { ssr: false })
const EventModal = dynamic(() => import('./components/EventModal'), { ssr: false })
const CalendarView = dynamic(() => import('./components/CalendarView'), { ssr: false })
const LavorazioniListModal = dynamic(() => import('./components/LavorazioniListModal'), { ssr: false })
const LavorazioneModal = dynamic(() => import('./components/LavorazioneModal'), { ssr: false })
const LavorazioneTimelineModal = dynamic(() => import('./components/LavorazioneTimelineModal'), { ssr: false })
const LavorazioneReportModal = dynamic(() => import('./components/LavorazioneReportModal'), { ssr: false })
const CallTimelineModal = dynamic(() => import('./components/CallTimelineModal'), { ssr: false })
const ClientModal = dynamic(() => import('./components/ClientModal'), { ssr: false })
const ClientsListModal = dynamic(() => import('./components/ClientsListModal'), { ssr: false })
const ClientDetailModal = dynamic(() => import('./components/ClientDetailModal'), { ssr: false })
const PreventivoModal = dynamic(() => import('./components/PreventivoModal'), { ssr: false })
const SearchModal = dynamic(() => import('./components/SearchModal'), { ssr: false })
const AuthModal = dynamic(() => import('./components/AuthModal'), { ssr: false })
const SupplierModal = dynamic(() => import('./components/SupplierModal'), { ssr: false })
const SuppliersListModal = dynamic(() => import('./components/SuppliersListModal'), { ssr: false })
const ProductModal = dynamic(() => import('./components/ProductModal'), { ssr: false })
const OrderModal = dynamic(() => import('./components/OrderModal'), { ssr: false })
const OrdersListModal = dynamic(() => import('./components/OrdersListModal'), { ssr: false })
const WarehouseListModal = dynamic(() => import('./components/WarehouseListModal'), { ssr: false })
const LabelPrinterModal = dynamic(() => import('./components/LabelPrinterModal'), { ssr: false })
const UserManagementModal = dynamic(() => import('./components/UserManagementModal'), { ssr: false })
const ActivityLogModal = dynamic(() => import('./components/ActivityLogModal'), { ssr: false })
const CsvImportModal = dynamic(() => import('./components/CsvImportModal'), { ssr: false })
const LoadingListModal = dynamic(() => import('./components/LoadingListModal'), { ssr: false })

// ═══ NON-MODAL COMPONENTS (loaded normally) ═══
import TodayDashboard from './components/TodayDashboard'
import NotificationBar from './components/NotificationBar'
import { usePasswords } from './hooks/usePasswords'
import { useBudget } from './hooks/useBudget'
import { useRecurring } from './hooks/useRecurring'
import { useBudgetLimits } from './hooks/useBudgetLimits'
import { useCalls } from './hooks/useCalls'
import { useVisits } from './hooks/useVisits'
import { useTasks } from './hooks/useTasks'
import { useNotes } from './hooks/useNotes'
import { useEvents } from './hooks/useEvents'
import { useRelations } from './hooks/useRelations'
import { useTeamMembers } from './hooks/useTeamMembers'
import { useLavorazioni } from './hooks/useLavorazioni'
import { useLavorazioneTimeline } from './hooks/useLavorazioneTimeline'
import { useCallTimeline } from './hooks/useCallTimeline'
import { useClients } from './hooks/useClients'
import { useSuppliers } from './hooks/useSuppliers'
import { useWarehouse } from './hooks/useWarehouse'
import { useOrders } from './hooks/useOrders'
import { useUserManagement } from './hooks/useUserManagement'
import { useActivityLog } from './hooks/useActivityLog'
import { supabase } from '@/lib/supabase'
import { initConsoleGuard } from '@/lib/console-guard'

export default function Home() {
  // ═══ STATE ═══
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [editPasswordData, setEditPasswordData] = useState<any>(null)
  const [isBudgetMenuModalOpen, setIsBudgetMenuModalOpen] = useState(false)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [isBudgetViewModalOpen, setIsBudgetViewModalOpen] = useState(false)
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false)
  const [isRecurringListModalOpen, setIsRecurringListModalOpen] = useState(false)
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false)
  const [isLimitsViewModalOpen, setIsLimitsViewModalOpen] = useState(false)
  const [isCallMenuModalOpen, setIsCallMenuModalOpen] = useState(false)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [isCallsListModalOpen, setIsCallsListModalOpen] = useState(false)
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false)
  const [isVisitsListModalOpen, setIsVisitsListModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isTasksListModalOpen, setIsTasksListModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [isNotesListModalOpen, setIsNotesListModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isCalendarViewOpen, setIsCalendarViewOpen] = useState(false)
  const [isLavorazioniListModalOpen, setIsLavorazioniListModalOpen] = useState(false)
  const [isLavorazioneModalOpen, setIsLavorazioneModalOpen] = useState(false)
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false)
  const [timelineLavorazione, setTimelineLavorazione] = useState<any>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportLavorazione, setReportLavorazione] = useState<any>(null)
  const [isCallTimelineOpen, setIsCallTimelineOpen] = useState(false)
  const [callTimelineCall, setCallTimelineCall] = useState<any>(null)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isClientsListModalOpen, setIsClientsListModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false)
  const [detailClient, setDetailClient] = useState<any>(null)
  const [isPreventivoModalOpen, setIsPreventivoModalOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ═══ WAREHOUSE / ORDERS STATE ═══
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [isSuppliersListModalOpen, setIsSuppliersListModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isWarehouseListModalOpen, setIsWarehouseListModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isOrdersListModalOpen, setIsOrdersListModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [isLabelPrinterOpen, setIsLabelPrinterOpen] = useState(false)
  const [labelProduct, setLabelProduct] = useState<any>(null)

  // ═══ USER MANAGEMENT STATE ═══
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false)
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false)
  const [isLoadingListOpen, setIsLoadingListOpen] = useState(false)
  const [productPrefill, setProductPrefill] = useState<any>(null)

  // ═══ BADGE "SEEN" TRACKING ═══
  const [seenCalls, setSeenCalls] = useState<number | null>(null)
  const [seenLavorazioni, setSeenLavorazioni] = useState<number | null>(null)
  const [seenTasks, setSeenTasks] = useState<number | null>(null)
  const [seenEvents, setSeenEvents] = useState<number | null>(null)

  const [userProfile, setUserProfile] = useState<any>(null)
  const [consoleGuard, setConsoleGuard] = useState<any>(null)
  const [editingNote, setEditingNote] = useState<any>(null)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [editingCall, setEditingCall] = useState<any>(null)
  const [editingVisit, setEditingVisit] = useState<any>(null)
  const [editingLavorazione, setEditingLavorazione] = useState<any>(null)

  // ═══ HOOKS ═══
  const { passwords, addPassword, updatePassword, user, deletePassword } = usePasswords()
  const { transactions, addTransaction, deleteTransaction, getStats } = useBudget()
  const { recurring, addRecurring, deleteRecurring, toggleActive } = useRecurring()
  const { limits, limitsStatus, addLimit, deleteLimit, toggleActive: toggleLimitActive } = useBudgetLimits()
  const { calls, addCall, deleteCall, updateCallStatus, updateCall } = useCalls()
  const { visits, addVisit, deleteVisit, updateVisitStatus, updateVisit } = useVisits()
  const { tasks, addTask, updateTask, deleteTask, toggleComplete } = useTasks()
  const { notes, addNote, updateNote, deleteNote, togglePin } = useNotes()
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()
  const { addRelation, removeRelation, getRelatedItems } = useRelations()
  const { members: teamMembers, addMember: addTeamMember, deleteMember: deleteTeamMember } = useTeamMembers()
  const { lavorazioni, addLavorazione, updateLavorazione, deleteLavorazione, toggleStatus: toggleLavorazioneStatus } = useLavorazioni()
  const { entries: timelineEntries, loading: timelineLoading, loadTimeline, addEntry: addTimelineEntry, deleteEntry: deleteTimelineEntry, updateEntry: updateTimelineEntry, uploadPhoto: uploadTimelinePhoto, clearTimeline } = useLavorazioneTimeline()
  const { entries: callTimelineEntries, loading: callTimelineLoading, loadTimeline: loadCallTimeline, addEntry: addCallTimelineEntry, deleteEntry: deleteCallTimelineEntry, updateEntry: updateCallTimelineEntry, uploadPhoto: uploadCallTimelinePhoto, clearTimeline: clearCallTimeline } = useCallTimeline()
  const { clients, addClient, updateClient, deleteClient, toggleFavorite: toggleClientFavorite } = useClients()
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, toggleFavorite: toggleSupplierFavorite } = useSuppliers()
  const { products, addProduct, updateProduct, deleteProduct, updateStock, loadMovements, findByBarcode } = useWarehouse()
  const { orders, addOrder, updateOrder, deleteOrder, addOrderItem, deleteOrderItem, getOrderItems, receiveOrder } = useOrders()
  const { users: managedUsers, isAdmin, loading: permissionsLoading, loadAllUsers, createUser, togglePermission, setAllPermissions, deleteUserPermissions, hasPermission } = useUserManagement()
  const { logs: activityLogs, loading: activityLoading, loadLogs: loadActivityLogs, clearOldLogs } = useActivityLog()

  const availableRelationItems = useMemo(() => ({ passwords, calls, visits, tasks, notes, events, transactions }), [passwords, calls, visits, tasks, notes, events, transactions])

  // ═══ SYNC: Lavorazione status → Call status ═══
  const lavStatusToCallStatus = (lavStatus: string): 'pending' | 'in_corso' | 'completed' | 'cancelled' => {
    if (lavStatus === 'in_corso') return 'in_corso'
    if (lavStatus === 'completata') return 'completed'
    if (lavStatus === 'annullata') return 'cancelled'
    return 'pending' // da_fare → pending
  }

  const syncCallStatus = async (lavorazioneId: string, newLavStatus?: string) => {
    const lav = lavorazioni.find(l => l.id === lavorazioneId)
    if (!lav?.call_id) return
    const status = newLavStatus || lav.status
    const callStatus = lavStatusToCallStatus(status)
    try { await updateCallStatus(lav.call_id, callStatus) } catch (e) { console.error('Sync call status error:', e) }
  }

  const statusLabelMap: Record<string, string> = { da_fare: 'Da Fare', in_corso: 'In Corso', completata: 'Completata', annullata: 'Annullata' }

  const handleToggleLavorazioneStatus = async (id: string) => {
    const lav = lavorazioni.find(l => l.id === id)
    if (!lav) return
    const nextStatus: Record<string, string> = { da_fare: 'in_corso', in_corso: 'completata', completata: 'da_fare', annullata: 'da_fare' }
    const newStatus = nextStatus[lav.status] || 'da_fare'
    await toggleLavorazioneStatus(id)
    if (lav.call_id) await syncCallStatus(id, newStatus)
    // Auto-timeline entry for status change
    try {
      await addTimelineEntry({
        lavorazione_id: id,
        description: `Stato cambiato: ${statusLabelMap[lav.status] || lav.status} \u2192 ${statusLabelMap[newStatus] || newStatus}`,
        event_type: 'nota',
        created_by_name: ''
      })
    } catch (e) { console.error('Auto-timeline status error:', e) }
  }

  const handleUpdateLavorazione = async (id: string, data: any) => {
    const lav = lavorazioni.find(l => l.id === id)
    const oldStatus = lav?.status
    await updateLavorazione(id, data)
    if (data.status) await syncCallStatus(id, data.status)
    // Auto-timeline entry if status changed during edit
    if (data.status && oldStatus && data.status !== oldStatus) {
      try {
        await addTimelineEntry({
          lavorazione_id: id,
          description: `Stato aggiornato: ${statusLabelMap[oldStatus] || oldStatus} \u2192 ${statusLabelMap[data.status] || data.status}`,
          event_type: 'nota',
          created_by_name: ''
        })
      } catch (e) { console.error('Auto-timeline update error:', e) }
    }
  }

  // ═══ MEMOIZED COMPUTED VALUES ═══
  const stats = useMemo(() => getStats(), [transactions])
  const pendingCalls = useMemo(() => calls.filter(c => c.status === 'pending' || c.status === 'in_corso').length, [calls])
  const activeTasks = useMemo(() => tasks.filter(t => !t.is_completed).length, [tasks])
  const todayEvents = useMemo(() => {
    const today = new Date()
    return events.filter(e => {
      const eventDate = new Date(e.start_date)
      return eventDate.toDateString() === today.toDateString()
    }).length
  }, [events])

  const activeLavorazioni = useMemo(() => lavorazioni.filter(l => l.status === 'da_fare' || l.status === 'in_corso').length, [lavorazioni])

  // Badge = nuovi dall'ultima apertura (null = primo caricamento, badge 0)
  const badgeCalls = seenCalls === null ? 0 : Math.max(0, pendingCalls - seenCalls)
  const badgeLavorazioni = seenLavorazioni === null ? 0 : Math.max(0, activeLavorazioni - seenLavorazioni)
  const badgeTasks = seenTasks === null ? 0 : Math.max(0, activeTasks - seenTasks)
  const badgeEvents = seenEvents === null ? 0 : Math.max(0, todayEvents - seenEvents)

  // ═══ EFFECTS ═══

  // Inizializza badge "seen" al primo caricamento dati (no badge fasulli)
  // Single consolidated effect to avoid cascading re-renders
  useEffect(() => {
    if (calls.length > 0 && seenCalls === null) setSeenCalls(pendingCalls)
    if (lavorazioni.length > 0 && seenLavorazioni === null) setSeenLavorazioni(activeLavorazioni)
    if (tasks.length > 0 && seenTasks === null) setSeenTasks(activeTasks)
    if (events.length > 0 && seenEvents === null) setSeenEvents(todayEvents)
  }, [calls.length, lavorazioni.length, tasks.length, events.length, pendingCalls, activeLavorazioni, activeTasks, todayEvents])

  useEffect(() => {
    const guard = initConsoleGuard()
    setConsoleGuard(guard)
  }, [])

  useEffect(() => {
    if (consoleGuard) {
      if (!user) { consoleGuard.blockConsole() } else { consoleGuard.unblockConsole() }
    }
  }, [user?.id, consoleGuard])

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (!error && data) setUserProfile(data)
      } else { setUserProfile(null) }
    }
    loadProfile()
  }, [user?.id])

  // ═══ Cmd+K Global Search Shortcut ═══
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchModalOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // ═══════════════════════════════════════════
  // NAVIGATION & ACTIONS CONFIG (must be before early return to respect Rules of Hooks)
  // ═══════════════════════════════════════════

  const navItems = useMemo(() => {
    const allItems = [
      { id: 'calls', perm: 'can_calls' as const, label: 'Chiamate', icon: Phone, onClick: () => { setSeenCalls(pendingCalls); setIsCallMenuModalOpen(true) }, count: calls.length, badge: badgeCalls },
      { id: 'lavorazioni', perm: 'can_lavorazioni' as const, label: 'Lavorazioni', icon: Wrench, onClick: () => { setSeenLavorazioni(activeLavorazioni); setIsLavorazioniListModalOpen(true) }, count: lavorazioni.length, badge: badgeLavorazioni },
      { id: 'tasks', perm: 'can_tasks' as const, label: 'Task', icon: CheckSquare, onClick: () => { setSeenTasks(activeTasks); setIsTasksListModalOpen(true) }, count: tasks.length, badge: badgeTasks },
      { id: 'calendar', perm: 'can_calendar' as const, label: 'Calendario', icon: Calendar, onClick: () => { setSeenEvents(todayEvents); setIsCalendarViewOpen(true) }, count: events.length, badge: badgeEvents },
      { id: 'budget', perm: 'can_budget' as const, label: 'Bilancio', icon: DollarSign, onClick: () => setIsBudgetMenuModalOpen(true), count: transactions.length },
      { id: 'passwords', perm: 'can_passwords' as const, label: 'Password', icon: Lock, onClick: () => setIsMenuModalOpen(true), count: passwords.length },
      { id: 'notes', perm: 'can_notes' as const, label: 'Note', icon: StickyNote, onClick: () => setIsNotesListModalOpen(true), count: notes.length },
      { id: 'clients', perm: 'can_clients' as const, label: 'Clienti', icon: Users, onClick: () => setIsClientsListModalOpen(true), count: clients.length },
      { id: 'visits', perm: 'can_visits' as const, label: 'Visite', icon: MapPin, onClick: () => setIsVisitsListModalOpen(true), count: visits.length },
      { id: 'suppliers', perm: 'can_suppliers' as const, label: 'Fornitori', icon: Truck, onClick: () => setIsSuppliersListModalOpen(true), count: suppliers.length },
      { id: 'orders', perm: 'can_orders' as const, label: 'Ordini', icon: ShoppingCart, onClick: () => setIsOrdersListModalOpen(true), count: orders.length },
      { id: 'warehouse', perm: 'can_warehouse' as const, label: 'Magazzino', icon: Package, onClick: () => setIsWarehouseListModalOpen(true), count: products.length },
      { id: 'preventivi', perm: 'can_preventivi' as const, label: 'Preventivi', icon: FileText, onClick: () => setIsPreventivoModalOpen(true) },
    ]
    return allItems.filter(item => hasPermission(item.perm))
  }, [calls.length, lavorazioni.length, tasks.length, events.length, transactions.length, passwords.length, notes.length, clients.length, visits.length, suppliers.length, orders.length, products.length, badgeCalls, badgeLavorazioni, badgeTasks, badgeEvents, pendingCalls, activeLavorazioni, activeTasks, todayEvents, hasPermission])

  const quickActions = useMemo(() => [
    { label: 'Chiamata', icon: Phone, onClick: () => setIsCallModalOpen(true) },
    { label: 'Lavorazione', icon: Wrench, onClick: () => { setEditingLavorazione(null); setIsLavorazioneModalOpen(true) } },
    { label: 'Task', icon: CheckSquare, onClick: () => setIsTaskModalOpen(true) },
    { label: 'Nota', icon: StickyNote, onClick: () => { setEditingNote(null); setIsNoteModalOpen(true) } },
    { label: 'Evento', icon: Calendar, onClick: () => { setEditingEvent(null); setIsEventModalOpen(true) } },
    { label: 'Visita', icon: UserCheck, onClick: () => { setEditingVisit(null); setIsVisitModalOpen(true) } },
    { label: 'Preventivo', icon: FileText, onClick: () => setIsPreventivoModalOpen(true) },
    { label: 'Lista Carico', icon: Upload, onClick: () => setIsLoadingListOpen(true) },
    { label: 'Transazione', icon: DollarSign, onClick: () => setIsBudgetModalOpen(true) },
  ], [])

  // Stat cards config
  const statCards = useMemo(() => [
    { label: 'Chiamate', value: calls.length, icon: Phone, onClick: () => { setSeenCalls(pendingCalls); setIsCallMenuModalOpen(true) }, gradient: 'from-blue-500 to-indigo-600', badgeText: badgeCalls > 0 ? `${badgeCalls} nuove` : null, badgeStyle: 'text-amber-600 bg-amber-50' },
    { label: 'Task', value: tasks.length, icon: CheckSquare, onClick: () => { setSeenTasks(activeTasks); setIsTasksListModalOpen(true) }, gradient: 'from-amber-500 to-orange-600', badgeText: badgeTasks > 0 ? `${badgeTasks} nuovi` : null, badgeStyle: 'text-blue-600 bg-blue-50' },
    { label: 'Eventi', value: events.length, icon: Calendar, onClick: () => { setSeenEvents(todayEvents); setIsCalendarViewOpen(true) }, gradient: 'from-rose-500 to-pink-600', badgeText: badgeEvents > 0 ? `${badgeEvents} oggi` : null, badgeStyle: 'text-rose-600 bg-rose-50' },
    { label: 'Bilancio', value: `${stats.balance >= 0 ? '+' : ''}${stats.balance.toFixed(0)}\u20AC`, icon: DollarSign, onClick: () => setIsBudgetMenuModalOpen(true), gradient: 'from-emerald-500 to-teal-600', isBalance: true, balancePositive: stats.balance >= 0 },
  ], [calls.length, tasks.length, events.length, stats.balance, badgeCalls, badgeTasks, badgeEvents, pendingCalls, activeTasks, todayEvents])

  // ═══════════════════════════════════════════
  // LOGIN SCREEN — Glassmorphism Chiaro
  // ═══════════════════════════════════════════
  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
        {/* Mesh gradient background */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50" />
        <div className="fixed top-[-200px] left-[-100px] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[120px]" />
        <div className="fixed bottom-[-150px] right-[-80px] w-[500px] h-[500px] bg-violet-200/25 rounded-full blur-[100px]" />
        <div className="fixed top-[40%] left-[50%] w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-[80px]" />

        <div className="relative z-10 w-full max-w-sm">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/25">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AK Suite</h1>
              <p className="text-slate-400 mt-2 text-sm">La tua suite gestionale premium</p>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5" />
              Accedi al pannello
            </button>
            <p className="text-center text-xs text-slate-400 mt-6">Crittografia end-to-end</p>
          </div>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} />
      </div>
    )
  }

  // ═══════════════════════════════════════════
  // MAIN APP — Glassmorphism Chiaro
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ═══ Mesh Gradient Background ═══ */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50" />
      <div className="fixed top-[-200px] left-[-100px] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[120px]" />
      <div className="fixed bottom-[-150px] right-[-80px] w-[500px] h-[500px] bg-violet-200/25 rounded-full blur-[100px]" />
      <div className="fixed top-[40%] left-[50%] w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-[80px]" />
      <div className="fixed top-[20%] right-[20%] w-[300px] h-[300px] bg-rose-200/15 rounded-full blur-[80px]" />

      <div className="relative z-10 flex h-screen">
        {/* ═══ SIDEBAR — Glass on Light ═══ */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed lg:relative w-[270px] h-screen border-r border-slate-200/60 bg-white/60 backdrop-blur-2xl flex flex-col z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          {/* Logo */}
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-800 font-bold text-lg tracking-tight">AK Suite</h1>
                <p className="text-slate-400 text-xs">Gestione Premium</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto w-8 h-8 rounded-lg bg-slate-100/70 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { item.onClick(); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium transition-all text-slate-500 hover:text-slate-700 hover:bg-white/50 active:bg-white/70 border border-transparent hover:border-slate-200/40"
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 ? (
                  <span className="min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                ) : item.count != null ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100/60 text-slate-400">{item.count}</span>
                ) : null}
              </button>
            ))}

            {/* Admin: Gestione Utenti */}
            {isAdmin && (
              <>
                <div className="border-t border-slate-200/40 my-4" />
                <p className="px-3 pb-2 text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Admin</p>
                <button
                  onClick={() => { setIsUserManagementOpen(true); setSidebarOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium transition-all text-amber-600 hover:text-amber-700 hover:bg-amber-50/50 active:bg-amber-50/70 border border-transparent hover:border-amber-200/40"
                >
                  <Shield className="w-[18px] h-[18px]" />
                  <span className="flex-1 text-left">Gestione Utenti</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-500">{managedUsers.length || '...'}</span>
                </button>
                <button
                  onClick={() => { setIsActivityLogOpen(true); loadActivityLogs(200); setSidebarOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium transition-all text-violet-600 hover:text-violet-700 hover:bg-violet-50/50 active:bg-violet-50/70 border border-transparent hover:border-violet-200/40"
                >
                  <Clock className="w-[18px] h-[18px]" />
                  <span className="flex-1 text-left">Cronologia</span>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              </>
            )}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-200/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/50 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-slate-700 text-sm font-medium truncate">{userProfile?.full_name || user.email}</p>
                <p className="text-slate-400 text-xs">Online</p>
              </div>
              <LogOut className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
            </button>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 overflow-y-auto">
          {/* Header — Glass */}
          <header className="sticky top-0 z-20 px-4 lg:px-8 py-5 border-b border-slate-200/50 bg-white/40 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-10 h-10 rounded-xl bg-white/70 border border-slate-200/60 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all" title="Menu">
                  <Menu className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-800 tracking-tight">
                    Bentornato{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5 hidden sm:block">Ecco la tua panoramica operativa di oggi.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button onClick={() => setIsSearchModalOpen(true)} className="w-10 h-10 rounded-xl bg-white/70 border border-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-sm active:scale-95 transition-all" title="Cerca (⌘K)">
                  <Search className="w-[18px] h-[18px]" />
                </button>
                <button onClick={() => setIsCalendarViewOpen(true)} className="w-10 h-10 rounded-xl bg-white/70 border border-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-sm active:scale-95 transition-all" title="Calendario">
                  <Calendar className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={() => setIsCallModalOpen(true)}
                  className="w-10 h-10 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /><span className="hidden sm:inline">Nuovo</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-6">
            {/* ═══ NOTIFICATION BAR ═══ */}
            <NotificationBar
              calls={calls} tasks={tasks} events={events} lavorazioni={lavorazioni}
              onOpenCalls={() => setIsCallsListModalOpen(true)}
              onOpenTasks={() => setIsTasksListModalOpen(true)}
              onOpenCalendar={() => setIsCalendarViewOpen(true)}
              onOpenLavorazioni={() => setIsLavorazioniListModalOpen(true)}
            />

            {/* ═══ TODAY DASHBOARD ═══ */}
            <TodayDashboard
              calls={calls} lavorazioni={lavorazioni} tasks={tasks} events={events} visits={visits}
              onOpenCall={(call) => { setEditingCall(call); setIsCallModalOpen(true) }}
              onOpenLavorazione={(lav) => { setEditingLavorazione(lav); setIsLavorazioneModalOpen(true) }}
              onOpenTasksList={() => setIsTasksListModalOpen(true)}
              onOpenCalendar={() => setIsCalendarViewOpen(true)}
              onOpenVisitsList={() => setIsVisitsListModalOpen(true)}
              onToggleTask={(id) => toggleComplete(id, true)}
              onToggleLavorazioneStatus={handleToggleLavorazioneStatus}
            />

            {/* ═══ STAT CARDS ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {statCards.map((card) => (
                <button
                  key={card.label}
                  onClick={card.onClick}
                  className="bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl p-4 sm:p-5 text-left hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg shadow-slate-200/50`}>
                      <card.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    {card.badgeText && (
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${card.badgeStyle}`}>
                        {card.badgeText}
                      </span>
                    )}
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold tabular-nums ${card.isBalance ? (card.balancePositive ? 'text-emerald-600' : 'text-rose-500') : 'text-slate-800'}`}>
                    {card.value}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">{card.label}</p>
                </button>
              ))}
            </div>

            {/* ═══ MAIN GRID: Activities + Quick Actions ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Recent Calls — 2 cols */}
              <div className="md:col-span-2 bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100/80 flex items-center justify-between">
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <Phone className="w-4 h-4 text-indigo-500" />
                    Chiamate Recenti
                  </h3>
                  <button onClick={() => setIsCallsListModalOpen(true)} className="text-indigo-500 text-sm hover:text-indigo-700 font-medium transition-colors flex items-center gap-0.5">
                    Tutte <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100/80">
                  {calls.slice(0, 5).map(call => (
                    <div key={call.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-white/60 transition-colors cursor-pointer active:bg-white/80">
                      <div className="w-9 h-9 rounded-lg bg-slate-100/80 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-sm font-medium truncate">{call.caller_name}</p>
                        <p className="text-slate-400 text-xs mt-0.5 truncate">{call.company || call.phone || '\u2014'}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 ${
                        call.status === 'completed' ? 'text-emerald-600 bg-emerald-50' :
                        call.status === 'cancelled' ? 'text-rose-500 bg-rose-50' :
                        'text-amber-600 bg-amber-50'
                      }`}>
                        {call.status === 'completed' ? 'Completata' : call.status === 'cancelled' ? 'Annullata' : 'In attesa'}
                      </span>
                    </div>
                  ))}
                  {calls.length === 0 && (
                    <div className="px-6 py-12 text-center">
                      <Phone className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                      <p className="text-sm text-slate-400">Nessuna chiamata</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Panel — 1 col */}
              <div className="md:col-span-2 lg:col-span-1 bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100/80">
                  <h3 className="text-slate-800 font-semibold text-sm sm:text-base">Azioni Rapide</h3>
                </div>
                <div className="p-3 sm:p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-2">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={action.onClick}
                      className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl bg-white/50 border border-slate-200/40 hover:bg-white hover:border-slate-200 hover:shadow-sm active:scale-[0.98] transition-all text-left"
                    >
                      <action.icon className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-slate-600 text-xs sm:text-sm font-medium truncate">{action.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto shrink-0 hidden sm:block" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ═══ DATA PANELS: Tasks + Notes ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Tasks */}
              <div className="bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100/80 flex items-center justify-between">
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                    Task Attivi
                  </h3>
                  <button onClick={() => setIsTasksListModalOpen(true)} className="text-indigo-500 text-sm hover:text-indigo-700 font-medium transition-colors flex items-center gap-0.5">
                    Tutti <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100/80">
                  {tasks.filter(t => !t.is_completed).slice(0, 4).map(task => (
                    <div key={task.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-white/60 transition-colors cursor-pointer active:bg-white/80">
                      <div className="w-9 h-9 rounded-lg bg-slate-100/80 flex items-center justify-center shrink-0">
                        <CheckSquare className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.due_date && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            task.priority === 'urgent' ? 'text-red-600 bg-red-50' :
                            task.priority === 'high' ? 'text-orange-600 bg-orange-50' :
                            task.priority === 'medium' ? 'text-yellow-600 bg-yellow-50' :
                            'text-slate-500 bg-slate-100'
                          }`}>
                            {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Bassa'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tasks.filter(t => !t.is_completed).length === 0 && (
                    <div className="px-6 py-12 text-center">
                      <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                      <p className="text-sm text-slate-400">Nessun task attivo</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100/80 flex items-center justify-between">
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <StickyNote className="w-4 h-4 text-indigo-500" />
                    Note Recenti
                  </h3>
                  <button onClick={() => setIsNotesListModalOpen(true)} className="text-indigo-500 text-sm hover:text-indigo-700 font-medium transition-colors flex items-center gap-0.5">
                    Tutte <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100/80">
                  {notes.slice(0, 4).map(note => (
                    <div key={note.id} onClick={() => { setEditingNote(note); setIsNoteModalOpen(true) }} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/60 transition-colors cursor-pointer active:bg-white/80">
                      <p className="text-slate-700 text-sm font-medium truncate">{note.title}</p>
                      <p className="text-slate-400 text-xs mt-1 truncate">{note.content?.replace(/<[^>]*>/g, '').substring(0, 80) || '\u2014'}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div className="px-6 py-12 text-center">
                      <StickyNote className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                      <p className="text-sm text-slate-400">Nessuna nota</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ BOTTOM PANELS: Visits + Password/Budget ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Visits */}
              <div className="md:col-span-2 bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100/80 flex items-center justify-between">
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    Visite Recenti
                  </h3>
                  <button onClick={() => setIsVisitsListModalOpen(true)} className="text-indigo-500 text-sm hover:text-indigo-700 font-medium transition-colors flex items-center gap-0.5">
                    Tutte <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100/80">
                  {visits.slice(0, 4).map(visit => (
                    <div key={visit.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-white/60 transition-colors cursor-pointer active:bg-white/80">
                      <div className="w-9 h-9 rounded-lg bg-slate-100/80 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 text-sm font-medium truncate">{visit.visitor_name}</p>
                        <p className="text-slate-400 text-xs mt-0.5 truncate">{visit.company || visit.visit_type}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 ${
                        visit.status === 'completed' ? 'text-emerald-600 bg-emerald-50' :
                        visit.status === 'in_progress' ? 'text-blue-600 bg-blue-50' :
                        visit.status === 'cancelled' ? 'text-rose-500 bg-rose-50' :
                        'text-slate-500 bg-slate-100/80'
                      }`}>
                        {visit.status === 'completed' ? 'Completata' : visit.status === 'in_progress' ? 'In corso' : visit.status === 'cancelled' ? 'Annullata' : 'Programmata'}
                      </span>
                    </div>
                  ))}
                  {visits.length === 0 && (
                    <div className="px-6 py-12 text-center">
                      <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                      <p className="text-sm text-slate-400">Nessuna visita</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Password + Budget cards */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-3 sm:gap-4">
                <button onClick={() => setIsMenuModalOpen(true)} className="w-full bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl p-4 sm:p-5 text-left hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200 active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-slate-200/50">
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-slate-700 text-sm font-semibold">Vault Password</h3>
                      <p className="text-slate-400 text-xs">{passwords.length} salvate</p>
                    </div>
                  </div>
                  <span className="flex items-center text-xs text-indigo-500 font-semibold hover:text-indigo-700">
                    Gestisci <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </button>

                <button onClick={() => setIsBudgetMenuModalOpen(true)} className="w-full bg-white/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl p-4 sm:p-5 text-left hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200 active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-slate-200/50">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-slate-700 text-sm font-semibold">Bilancio Familiare</h3>
                      <p className="text-slate-400 text-xs">{transactions.length} transazioni</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg">+{stats.totalIncome.toFixed(0)}€</span>
                    <span className="text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-lg">-{stats.totalExpenses.toFixed(0)}€</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ALL MODALS — Unchanged Logic */}
      {/* ═══════════════════════════════════════════ */}
      {isMenuModalOpen && <PasswordMenuModal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)}
        onSelectNew={() => setIsPasswordModalOpen(true)} onSelectList={() => setIsListModalOpen(true)} />}
      {isPasswordModalOpen && <PasswordModal isOpen={isPasswordModalOpen} onClose={() => { setIsPasswordModalOpen(false); setEditPasswordData(null) }}
        editPassword={editPasswordData}
        onSave={(data) => {
          if (data.id) {
            updatePassword(data.id, data)
          } else {
            addPassword(data)
          }
          setEditPasswordData(null)
        }} />}
      {isListModalOpen && <PasswordListModal isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)}
        passwords={passwords} onDelete={deletePassword}
        onEdit={(pwd) => { setEditPasswordData(pwd); setIsPasswordModalOpen(true) }} />}

      {isBudgetMenuModalOpen && <BudgetMenuModal isOpen={isBudgetMenuModalOpen} onClose={() => setIsBudgetMenuModalOpen(false)}
        onSelectNew={() => setIsBudgetModalOpen(true)} onSelectView={() => setIsBudgetViewModalOpen(true)}
        onSelectRecurring={() => setIsRecurringModalOpen(true)} onSelectRecurringList={() => setIsRecurringListModalOpen(true)}
        onSelectLimit={() => setIsLimitModalOpen(true)} onSelectLimitsList={() => setIsLimitsViewModalOpen(true)} />}
      {isBudgetModalOpen && <BudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} onSave={addTransaction} />}
      {isBudgetViewModalOpen && <BudgetViewModal isOpen={isBudgetViewModalOpen} onClose={() => setIsBudgetViewModalOpen(false)}
        transactions={transactions} onDelete={deleteTransaction} stats={stats} />}
      {isRecurringModalOpen && <RecurringModal isOpen={isRecurringModalOpen} onClose={() => setIsRecurringModalOpen(false)} onSave={addRecurring} />}
      {isRecurringListModalOpen && <RecurringListModal isOpen={isRecurringListModalOpen} onClose={() => setIsRecurringListModalOpen(false)}
        recurring={recurring} onToggleActive={toggleActive} onDelete={deleteRecurring} />}
      {isLimitModalOpen && <BudgetLimitModal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)}
        onSave={addLimit} existingCategories={limits.map(l => l.category)} />}
      {isLimitsViewModalOpen && <BudgetLimitsViewModal isOpen={isLimitsViewModalOpen} onClose={() => setIsLimitsViewModalOpen(false)}
        limits={limitsStatus} onToggleActive={toggleLimitActive} onDelete={deleteLimit} />}

      {isCallMenuModalOpen && <CallMenuModal isOpen={isCallMenuModalOpen} onClose={() => setIsCallMenuModalOpen(false)}
        onSelectNew={() => setIsCallModalOpen(true)} onSelectList={() => setIsCallsListModalOpen(true)} />}
      {isCallModalOpen && <CallModal
        isOpen={isCallModalOpen}
        onClose={() => { setIsCallModalOpen(false); setEditingCall(null) }}
        onSave={async (callData) => {
          // Separa i campi lavorazione dai dati della chiamata
          const { has_lavorazione, lavorazione_date, lavorazione_time, lavorazione_description, lavorazione_assignee, ...cleanCallData } = callData
          let callId: string | undefined
          if (editingCall) { await updateCall(editingCall.id, cleanCallData); callId = editingCall.id }
          else { const newCall = await addCall(cleanCallData); callId = newCall?.id }
          if (!editingCall && cleanCallData.follow_up && cleanCallData.follow_up_date && callId) {
            const newTask = await addTask({
              title: `Follow-up: ${cleanCallData.caller_name || 'Chiamata'}`,
              description: `Follow-up chiamata da ${cleanCallData.caller_name || 'contatto'}${cleanCallData.company ? ` (${cleanCallData.company})` : ''}`,
              due_date: cleanCallData.follow_up_date, priority: cleanCallData.priority || 'medium',
              status: 'todo', category: 'follow_up', is_recurring: false, recurring_type: null, tags: [], subtasks: []
            })
            if (newTask?.id) await addRelation('call', callId, 'task', newTask.id, 'related', 'Auto follow-up')
          }
          if (has_lavorazione && callId) {
            const newLav = await addLavorazione({
              call_id: callId,
              client_id: null,
              title: `Lavorazione: ${cleanCallData.caller_name || 'Chiamata'}${cleanCallData.company ? ` - ${cleanCallData.company}` : ''}`,
              description: lavorazione_description || '',
              assigned_to: lavorazione_assignee || '',
              scheduled_date: lavorazione_date || null,
              scheduled_time: lavorazione_time || null,
              status: 'da_fare',
              priority: cleanCallData.priority || 'media',
              address: cleanCallData.address || '',
              city: cleanCallData.city || '',
              zip_code: cleanCallData.zip_code || '',
              province: cleanCallData.province || '',
              notes: cleanCallData.notes || '',
              completed_at: null,
            })
            // Auto-create first timeline entry from the call
            if (newLav?.id) {
              try {
                await addTimelineEntry({
                  lavorazione_id: newLav.id,
                  description: `Lavorazione creata da chiamata di ${cleanCallData.caller_name || 'contatto'}${cleanCallData.company ? ` (${cleanCallData.company})` : ''}. ${cleanCallData.notes ? 'Note: ' + cleanCallData.notes : ''}`.trim(),
                  event_type: 'chiamata_cliente',
                  created_by_name: cleanCallData.caller_name || ''
                })
              } catch (e) { console.error('Auto-timeline error:', e) }
            }
          }
        }}
        editCall={editingCall} availableItems={availableRelationItems}
        onAddRelation={addRelation} onRemoveRelation={removeRelation} getRelatedItems={getRelatedItems}
        teamMembers={teamMembers} onAddTeamMember={addTeamMember} onDeleteTeamMember={deleteTeamMember}
        clients={clients} onAddClient={addClient}
      />}
      {isCallsListModalOpen && <CallsListModal isOpen={isCallsListModalOpen} onClose={() => setIsCallsListModalOpen(false)}
        calls={calls} onDelete={deleteCall} onStatusChange={updateCallStatus}
        onEdit={(call) => { setEditingCall(call); setIsCallModalOpen(true); setIsCallsListModalOpen(false) }}
        onViewTimeline={(call) => { setCallTimelineCall(call); loadCallTimeline(call.id); setIsCallTimelineOpen(true) }} />}

      {isLavorazioniListModalOpen && <LavorazioniListModal
        isOpen={isLavorazioniListModalOpen}
        onClose={() => setIsLavorazioniListModalOpen(false)}
        lavorazioni={lavorazioni}
        onToggleStatus={handleToggleLavorazioneStatus}
        onDelete={deleteLavorazione}
        onNew={() => { setEditingLavorazione(null); setIsLavorazioneModalOpen(true) }}
        onEdit={(lav) => { setEditingLavorazione(lav); setIsLavorazioneModalOpen(true); setIsLavorazioniListModalOpen(false) }}
        onViewTimeline={(lav) => { setTimelineLavorazione(lav); loadTimeline(lav.id); setIsTimelineModalOpen(true) }}
        onReport={(lav) => { setReportLavorazione(lav); loadTimeline(lav.id); setIsReportModalOpen(true) }}
        onDuplicate={async (lav) => {
          const duplicated = await addLavorazione({
            call_id: lav.call_id,
            client_id: lav.client_id,
            title: `${lav.title} (copia)`,
            description: lav.description,
            assigned_to: lav.assigned_to,
            scheduled_date: lav.scheduled_date,
            scheduled_time: lav.scheduled_time,
            status: 'da_fare',
            priority: lav.priority,
            address: lav.address,
            city: lav.city,
            zip_code: lav.zip_code,
            province: lav.province,
            notes: lav.notes,
            completed_at: null,
          })
          if (duplicated) {
            setEditingLavorazione(duplicated)
            setIsLavorazioneModalOpen(true)
            setIsLavorazioniListModalOpen(false)
          }
        }}
        teamMembers={teamMembers}
        clients={clients}
      />}

      {isLavorazioneModalOpen && <LavorazioneModal
        isOpen={isLavorazioneModalOpen}
        onClose={() => { setIsLavorazioneModalOpen(false); setEditingLavorazione(null) }}
        onSave={async (data) => {
          if (editingLavorazione) { await handleUpdateLavorazione(editingLavorazione.id, data) }
          else { await addLavorazione(data) }
        }}
        editLavorazione={editingLavorazione}
        teamMembers={teamMembers}
        clients={clients}
      />}

      {isTimelineModalOpen && <LavorazioneTimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => { setIsTimelineModalOpen(false); setTimelineLavorazione(null); clearTimeline() }}
        lavorazione={timelineLavorazione}
        entries={timelineEntries}
        loading={timelineLoading}
        onAddEntry={addTimelineEntry}
        onDeleteEntry={deleteTimelineEntry}
        onUpdateEntry={updateTimelineEntry}
        onUploadPhoto={uploadTimelinePhoto}
        teamMembers={teamMembers}
      />}

      {isCallTimelineOpen && <CallTimelineModal
        isOpen={isCallTimelineOpen}
        onClose={() => { setIsCallTimelineOpen(false); setCallTimelineCall(null); clearCallTimeline() }}
        call={callTimelineCall}
        entries={callTimelineEntries}
        loading={callTimelineLoading}
        onAddEntry={addCallTimelineEntry}
        onDeleteEntry={deleteCallTimelineEntry}
        onUpdateEntry={updateCallTimelineEntry}
        onUploadPhoto={uploadCallTimelinePhoto}
        teamMembers={teamMembers}
      />}

      {isReportModalOpen && <LavorazioneReportModal
        isOpen={isReportModalOpen}
        onClose={() => { setIsReportModalOpen(false); setReportLavorazione(null) }}
        lavorazione={reportLavorazione}
        entries={timelineEntries}
        userProfile={userProfile}
      />}

      {isVisitModalOpen && <VisitModal
        isOpen={isVisitModalOpen}
        onClose={() => { setIsVisitModalOpen(false); setEditingVisit(null) }}
        onSave={async (visitData) => {
          const { has_lavorazione, lavorazione_date, lavorazione_time, lavorazione_description, lavorazione_assignee, ...cleanVisitData } = visitData
          let visitId: string | undefined
          if (editingVisit) { await updateVisit(editingVisit.id, cleanVisitData); visitId = editingVisit.id }
          else { const newVisit = await addVisit(cleanVisitData); visitId = newVisit?.id }
          if (!editingVisit && cleanVisitData.follow_up && cleanVisitData.follow_up_date && visitId) {
            const newTask = await addTask({
              title: `Follow-up: ${cleanVisitData.visitor_name || 'Visita'}`,
              description: `Follow-up visita di ${cleanVisitData.visitor_name || 'visitatore'}${cleanVisitData.company ? ` (${cleanVisitData.company})` : ''}`,
              due_date: cleanVisitData.follow_up_date, priority: cleanVisitData.priority || 'medium',
              status: 'todo', category: 'follow_up', is_recurring: false, recurring_type: null, tags: [], subtasks: []
            })
            if (newTask?.id) await addRelation('visit', visitId, 'task', newTask.id, 'related', 'Auto follow-up')
          }
          if (has_lavorazione && visitId) {
            const newLav = await addLavorazione({
              call_id: null,
              client_id: null,
              title: `Lavorazione: ${cleanVisitData.visitor_name || 'Visita'}${cleanVisitData.company ? ` - ${cleanVisitData.company}` : ''}`,
              description: lavorazione_description || '',
              assigned_to: lavorazione_assignee || '',
              scheduled_date: lavorazione_date || null,
              scheduled_time: lavorazione_time || null,
              status: 'da_fare',
              priority: cleanVisitData.priority || 'media',
              address: '',
              city: '',
              zip_code: '',
              province: '',
              notes: cleanVisitData.notes || '',
              completed_at: null,
            })
            // Auto-create first timeline entry from the visit
            if (newLav?.id) {
              try {
                await addTimelineEntry({
                  lavorazione_id: newLav.id,
                  description: `Lavorazione creata da visita di ${cleanVisitData.visitor_name || 'visitatore'}${cleanVisitData.company ? ` (${cleanVisitData.company})` : ''}. ${cleanVisitData.notes ? 'Note: ' + cleanVisitData.notes : ''}`.trim(),
                  event_type: 'nota',
                  created_by_name: cleanVisitData.visitor_name || ''
                })
              } catch (e) { console.error('Auto-timeline error:', e) }
            }
          }
        }}
        editVisit={editingVisit}
        teamMembers={teamMembers}
        clients={clients}
        onAddClient={addClient}
      />}
      {isVisitsListModalOpen && <VisitsListModal isOpen={isVisitsListModalOpen} onClose={() => setIsVisitsListModalOpen(false)}
        visits={visits} onDelete={deleteVisit} onStatusChange={updateVisitStatus}
        onEdit={(visit) => { setEditingVisit(visit); setIsVisitModalOpen(true); setIsVisitsListModalOpen(false) }}
        onNew={() => { setEditingVisit(null); setIsVisitModalOpen(true) }} />}

      {isTaskModalOpen && <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)}
        onSave={async (task) => { await addTask(task) }} editTask={null}
        availableItems={availableRelationItems} onAddRelation={addRelation}
        onRemoveRelation={removeRelation} getRelatedItems={getRelatedItems} />}
      {isTasksListModalOpen && <TasksListModal isOpen={isTasksListModalOpen} onClose={() => setIsTasksListModalOpen(false)}
        tasks={tasks} onDelete={deleteTask} onToggleComplete={toggleComplete}
        onUpdate={updateTask} onAdd={async (task) => { await addTask(task) }} />}

      {isNoteModalOpen && <NoteModal isOpen={isNoteModalOpen}
        onClose={() => { setIsNoteModalOpen(false); setEditingNote(null) }}
        onSave={(noteData) => { if (editingNote) { updateNote(editingNote.id, noteData) } else { addNote(noteData) } }}
        editNote={editingNote} availableItems={availableRelationItems}
        onAddRelation={addRelation} onRemoveRelation={removeRelation} getRelatedItems={getRelatedItems} />}
      {isNotesListModalOpen && <NotesListModal isOpen={isNotesListModalOpen} onClose={() => setIsNotesListModalOpen(false)}
        notes={notes} onDelete={deleteNote} onUpdate={updateNote} onTogglePin={togglePin}
        onEdit={(note) => { setEditingNote(note); setIsNoteModalOpen(true) }}
        onAdd={() => { setEditingNote(null); setIsNoteModalOpen(true) }} />}

      {isEventModalOpen && <EventModal isOpen={isEventModalOpen}
        onClose={() => { setIsEventModalOpen(false); setEditingEvent(null) }}
        onSave={(eventData) => { if (editingEvent) { updateEvent(editingEvent.id, eventData) } else { addEvent(eventData) } }}
        editEvent={editingEvent} availableItems={availableRelationItems}
        onAddRelation={addRelation} onRemoveRelation={removeRelation} getRelatedItems={getRelatedItems} />}

      {isCalendarViewOpen && <CalendarView isOpen={isCalendarViewOpen} onClose={() => setIsCalendarViewOpen(false)}
        events={events} tasks={tasks} onDelete={deleteEvent}
        onEdit={(event) => { setEditingEvent(event); setIsEventModalOpen(true) }}
        onAdd={() => { setEditingEvent(null); setIsEventModalOpen(true) }} />}

      {isClientModalOpen && <ClientModal isOpen={isClientModalOpen}
        onClose={() => { setIsClientModalOpen(false); setEditingClient(null) }}
        onSave={async (data) => { if (editingClient) { await updateClient(editingClient.id, data) } else { await addClient(data) } }}
        editingClient={editingClient} />}
      {isClientsListModalOpen && <ClientsListModal isOpen={isClientsListModalOpen} onClose={() => setIsClientsListModalOpen(false)}
        clients={clients} onDelete={deleteClient} onToggleFavorite={toggleClientFavorite}
        onAdd={() => { setEditingClient(null); setIsClientModalOpen(true) }}
        onEdit={(client) => { setEditingClient(client); setIsClientModalOpen(true); setIsClientsListModalOpen(false) }}
        onSelectClient={(client) => { setDetailClient(client); setIsClientDetailOpen(true) }} />}
      {isClientDetailOpen && <ClientDetailModal
        isOpen={isClientDetailOpen}
        onClose={() => { setIsClientDetailOpen(false); setDetailClient(null) }}
        client={detailClient}
        calls={calls}
        lavorazioni={lavorazioni}
        visits={visits}
        onEditClient={(client) => { setEditingClient(client); setIsClientModalOpen(true); setIsClientDetailOpen(false) }}
        onOpenLavorazione={(lav) => { setEditingLavorazione(lav); setIsLavorazioneModalOpen(true); setIsClientDetailOpen(false) }}
        onNewCall={(clientData) => {
          setEditingCall({ caller_name: clientData.caller_name, company: clientData.company, phone: clientData.phone, email: clientData.email, address: clientData.address, city: clientData.city, zip_code: clientData.zip_code, province: clientData.province, _prefilled: true } as any)
          setIsCallModalOpen(true)
        }}
        onNewLavorazione={(clientData) => {
          setEditingLavorazione({ client_id: clientData.client_id, title: `Lavorazione: ${clientData.client_name}`, address: clientData.address, city: clientData.city, zip_code: clientData.zip_code, province: clientData.province, status: 'da_fare', _prefilled: true } as any)
          setIsLavorazioneModalOpen(true)
        }}
      />}

      {isSearchModalOpen && <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)}
        calls={calls} lavorazioni={lavorazioni} tasks={tasks} notes={notes} events={events} clients={clients} visits={visits}
        onOpenCall={(call) => { setEditingCall(call); setIsCallModalOpen(true) }}
        onOpenLavorazione={(lav) => { setEditingLavorazione(lav); setIsLavorazioneModalOpen(true) }}
        onOpenTask={() => setIsTasksListModalOpen(true)}
        onOpenNote={(note) => { setEditingNote(note); setIsNoteModalOpen(true) }}
        onOpenEvent={(event) => { setEditingEvent(event); setIsEventModalOpen(true) }}
        onOpenClient={(client) => { setEditingClient(client); setIsClientModalOpen(true) }}
        onOpenVisit={() => setIsVisitsListModalOpen(true)} />}

      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)} />}

      {isPreventivoModalOpen && <PreventivoModal
        isOpen={isPreventivoModalOpen}
        onClose={() => setIsPreventivoModalOpen(false)}
        clients={clients}
        lavorazioni={lavorazioni}
        products={products}
        onOpenProductModal={(prefill) => {
          setProductPrefill(prefill)
          setEditingProduct(null)
          setIsProductModalOpen(true)
        }}
      />}

      {/* ═══ WAREHOUSE / ORDERS / SUPPLIERS MODALS ═══ */}
      {isSupplierModalOpen && <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => { setIsSupplierModalOpen(false); setEditingSupplier(null) }}
        onSave={async (data) => { if (editingSupplier) { await updateSupplier(editingSupplier.id, data) } else { await addSupplier(data) } }}
        editingSupplier={editingSupplier}
      />}
      {isSuppliersListModalOpen && <SuppliersListModal
        isOpen={isSuppliersListModalOpen}
        onClose={() => setIsSuppliersListModalOpen(false)}
        suppliers={suppliers}
        onAdd={() => { setEditingSupplier(null); setIsSupplierModalOpen(true) }}
        onEdit={(supplier) => { setEditingSupplier(supplier); setIsSupplierModalOpen(true); setIsSuppliersListModalOpen(false) }}
        onDelete={deleteSupplier}
        onToggleFavorite={toggleSupplierFavorite}
      />}
      {isProductModalOpen && <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); setProductPrefill(null) }}
        onSave={async (data) => { if (editingProduct) { await updateProduct(editingProduct.id, data) } else { await addProduct(data) } }}
        editingProduct={editingProduct || productPrefill}
        suppliers={suppliers}
      />}
      {isWarehouseListModalOpen && <WarehouseListModal
        isOpen={isWarehouseListModalOpen}
        onClose={() => setIsWarehouseListModalOpen(false)}
        products={products}
        suppliers={suppliers}
        onAdd={() => { setEditingProduct(null); setIsProductModalOpen(true) }}
        onEdit={(product) => { setEditingProduct(product); setIsProductModalOpen(true); setIsWarehouseListModalOpen(false) }}
        onDelete={deleteProduct}
        onUpdateStock={async (productId, type, quantity, notes) => { await updateStock(productId, type as any, quantity, notes) }}
        onFindByBarcode={findByBarcode}
        onLoadMovements={loadMovements}
        onImportCsv={() => setIsCsvImportOpen(true)}
      />}

      {isCsvImportOpen && <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        existingSkus={products.map(p => p.sku).filter(Boolean) as string[]}
        onImport={async (items) => {
          let count = 0
          for (const item of items) {
            const result = await addProduct(item)
            if (result) count++
          }
          return count
        }}
      />}
      {isLoadingListOpen && <LoadingListModal
        isOpen={isLoadingListOpen}
        onClose={() => setIsLoadingListOpen(false)}
        products={products}
        onUpdateStock={async (productId, type, qty, ref, notes) => { await updateStock(productId, type as any, qty, ref, notes) }}
        onOpenProductModal={(prefill) => {
          setProductPrefill(prefill)
          setEditingProduct(null)
          setIsProductModalOpen(true)
        }}
      />}
      {isOrderModalOpen && <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => { setIsOrderModalOpen(false); setEditingOrder(null); setOrderItems([]) }}
        onSave={async (data) => {
          if (editingOrder) { await updateOrder(editingOrder.id, data) }
          else {
            const newOrder = await addOrder(data)
            if (newOrder) { setEditingOrder(newOrder); const items = await getOrderItems(newOrder.id); setOrderItems(items) }
          }
        }}
        onAddItem={async (item) => {
          if (editingOrder) {
            await addOrderItem(editingOrder.id, item)
            const items = await getOrderItems(editingOrder.id)
            setOrderItems(items)
          }
        }}
        onDeleteItem={async (id) => {
          if (editingOrder) {
            await deleteOrderItem(id, editingOrder.id)
            const items = await getOrderItems(editingOrder.id)
            setOrderItems(items)
          }
        }}
        editingOrder={editingOrder}
        orderItems={orderItems}
        suppliers={suppliers}
        products={products}
      />}
      {isOrdersListModalOpen && <OrdersListModal
        isOpen={isOrdersListModalOpen}
        onClose={() => setIsOrdersListModalOpen(false)}
        orders={orders}
        suppliers={suppliers}
        onAdd={() => { setEditingOrder(null); setOrderItems([]); setIsOrderModalOpen(true) }}
        onEdit={async (order) => {
          setEditingOrder(order)
          const items = await getOrderItems(order.id)
          setOrderItems(items)
          setIsOrderModalOpen(true)
          setIsOrdersListModalOpen(false)
        }}
        onDelete={deleteOrder}
        onReceive={async (orderId) => {
          const items = await getOrderItems(orderId)
          const receivedItems = items.map(i => ({ itemId: i.id, quantityReceived: i.quantity_ordered }))
          await receiveOrder(orderId, receivedItems)
        }}
      />}
      {isLabelPrinterOpen && <LabelPrinterModal
        isOpen={isLabelPrinterOpen}
        onClose={() => { setIsLabelPrinterOpen(false); setLabelProduct(null) }}
        product={labelProduct}
      />}

      {/* ═══ USER MANAGEMENT (Admin Only) ═══ */}
      {isUserManagementOpen && <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        users={managedUsers}
        onCreateUser={createUser}
        onTogglePermission={togglePermission}
        onSetAllPermissions={setAllPermissions}
        onDeleteUser={deleteUserPermissions}
        onLoadUsers={loadAllUsers}
      />}

      {/* ═══ ACTIVITY LOG (Admin Only) ═══ */}
      {isActivityLogOpen && <ActivityLogModal
        isOpen={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(false)}
        logs={activityLogs}
        loading={activityLoading}
        onLoadLogs={loadActivityLogs}
        onClearOldLogs={clearOldLogs}
        isAdmin={isAdmin}
      />}
    </div>
  )
}
