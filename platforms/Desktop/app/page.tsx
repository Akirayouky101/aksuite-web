'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowUpRight, Bell, Briefcase, Calendar, CheckCircle2, ClipboardList, CreditCard, KeyRound, LayoutGrid, LogIn, LogOut, Phone, Plus, Search, Shield, ShoppingCart, Sparkles, StickyNote, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePasswords } from './hooks/usePasswords'
import { useCalls } from './hooks/useCalls'
import { useNotes } from './hooks/useNotes'
import { useEvents } from './hooks/useEvents'
import { useClients } from './hooks/useClients'
import { useUserManagement } from './hooks/useUserManagement'
import PasswordModal from './components/PasswordModal'
import PasswordListModal from './components/PasswordListModal'
import CallModal from './components/CallModal'
import CallMenuModal from './components/CallMenuModal'
import CallsListModal from './components/CallsListModal'
import NoteModal from './components/NoteModal'
import NotesListModal from './components/NotesListModal'
import EventModal from './components/EventModal'
import CalendarView from './components/CalendarView'
import ClientModal from './components/ClientModal'
import ClientsListModal from './components/ClientsListModal'
import ClientDetailModal from './components/ClientDetailModal'
import CallsWorkspace from './components/CallsWorkspace'
import PasswordsWorkspace from './components/PasswordsWorkspace'
import ClientsWorkspace from './components/ClientsWorkspace'
import CallDetailModal from './components/CallDetailModal'
import PasswordDetailModal from './components/PasswordDetailModal'
import UserManagementModal from './components/UserManagementModal'
import AuthModal from './components/AuthModal'
import PaymentsWorkspace from './components/PaymentsWorkspace'
import PaymentModal from './components/PaymentModal'
import PaymentsOverview from './components/PaymentsOverview'
import DashboardDesk from './components/DashboardDesk'
import AgendaSummaryModal, { AgendaItem } from './components/AgendaSummaryModal'
import NotesStickyWidget from './components/NotesStickyWidget'
import TodayWorkspace from './components/TodayWorkspace'
import GlobalSearchModal from './components/GlobalSearchModal'
import SearchResultSummaryModal from './components/SearchResultSummaryModal'
import WorkItemsWorkspace from './components/WorkItemsWorkspace'
import WorkItemModal from './components/WorkItemModal'
import { paymentRemainingAmount, usePayments } from './hooks/usePayments'
import { useDesktopReminders } from './hooks/useDesktopReminders'
import { usePwa } from './hooks/usePwa'
import { useWorkItems } from './hooks/useWorkItems'
import { useShopping } from './hooks/useShopping'

const ShoppingWorkspace = dynamic(() => import('./components/ShoppingWorkspace'), {
  loading: () => <p role="status" className="py-8 text-center text-[#716a91]">Caricamento sezione Spesa...</p>,
})

const emptyRelations = { passwords: [], calls: [], notes: [], events: [] }
const PhotoGallery = dynamic(() => import('./components/PhotoGallery'))
const EventResponsePrompt = dynamic(() => import('./components/EventResponsePrompt'))

export default function Home() {
  const { passwords, categories, addPassword, addCategory, updateCategory, deleteCategory, updatePassword, deletePassword, user } = usePasswords()
  const { calls, addCall, updateCall, deleteCall, updateCallStatus } = useCalls()
  const { notes, addNote, updateNote, deleteNote, togglePin } = useNotes()
  const { events, addEvent, updateEvent, deleteEvent, errorMessage: eventsError } = useEvents()
  const { clients, addClient, updateClient, deleteClient, toggleFavorite } = useClients()
  const { payments, addPayment, updatePayment, deletePayment } = usePayments()
  const { workItems, loading: workItemsLoading, errorMessage: workItemsError, addWorkItem, updateWorkItem, deleteWorkItem } = useWorkItems()
  const shopping = useShopping()
  const { users, isAdmin, createUser, togglePermission, setAllPermissions, deleteUserPermissions, loadAllUsers } = useUserManagement()
  const [authOpen, setAuthOpen] = useState(false)
  const [section, setSection] = useState('today')
  const [modal, setModal] = useState<string | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [appointmentClientId, setAppointmentClientId] = useState<string | null>(null)
  const [followUpClient, setFollowUpClient] = useState<any | null>(null)
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpNote, setFollowUpNote] = useState('')
  const [selectedPassword, setSelectedPassword] = useState<any>(null)
  const [paymentView, setPaymentView] = useState<'overview' | 'practice'>('overview')
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [workClientId, setWorkClientId] = useState<string | null>(null)
  const [todoClientId, setTodoClientId] = useState<string | null>(null)
  const [returnClientId, setReturnClientId] = useState<string | null>(null)
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<AgendaItem | null>(null)
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [calendarSettingsOpen, setCalendarSettingsOpen] = useState(false)
  const [integrationNotice, setIntegrationNotice] = useState('')
  const [selectedSearchResult, setSelectedSearchResult] = useState<{ type: string; item: any } | null>(null)
  const { requestPermission } = useDesktopReminders(events, notes, payments, calls)
  usePwa()
  useEffect(() => {
    if (!user) return
    const url = new URL(window.location.href)
    const result = url.searchParams.get('google-calendar')
    if (!result) return
    setIntegrationNotice(result === 'connected' ? 'Account Google collegato. Scegli il calendario nelle impostazioni.' : 'Collegamento Google non riuscito o annullato. Riprova dalle impostazioni calendario.')
    setCalendarSettingsOpen(true); setSection('calendar'); setModal('calendar')
    url.searchParams.delete('google-calendar')
    url.searchParams.set('web', '1')
    window.history.replaceState(null, '', url)
  }, [user?.id])
  useEffect(() => { if (section !== 'payments') { setPaymentView('overview'); setSelectedPaymentId(null) } }, [section])

  const open = (name: string, item: any = null) => { setEditing(item); setModal(name) }
  const openNewAppointment = (client: any) => { setSelectedClient(null); setReturnClientId(client.id); setAppointmentClientId(client.id); setEditing(null); setModal('event') }
  const openEditAppointment = (event: any) => { setSelectedClient(null); setReturnClientId(event.client_id); setAppointmentClientId(event.client_id); open('event', event) }
  const scheduleEventFollowUp = (event: any) => {
    const client = clients.find(item => item.id === event.client_id)
    if (!client) return
    const followUpAt = new Date(event.end_date || event.start_date)
    if (Number.isNaN(followUpAt.getTime()) || followUpAt <= new Date()) followUpAt.setTime(Date.now())
    followUpAt.setDate(followUpAt.getDate() + 1)
    followUpAt.setHours(9, 0, 0, 0)
    const localDate = new Date(followUpAt.getTime() - followUpAt.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    setFollowUpClient(client)
    setFollowUpDate(localDate)
    setFollowUpNote(`Richiamo dopo l'appuntamento: ${event.title}`)
    setReturnClientId(client.id)
    setAppointmentClientId(client.id)
    setSelectedClient(null)
    setEditing(null)
    setSection('clients')
    setModal('call')
  }
  const close = () => {
    if (appointmentClientId) setReturnClientId(appointmentClientId)
    setEditing(null)
    setModal(null)
    setCalendarSettingsOpen(false)
    setAppointmentClientId(null)
    setFollowUpClient(null)
    setFollowUpDate('')
    setFollowUpNote('')
    if (['calendar', 'notes', 'users'].includes(section)) setSection('today')
  }
  const navigateToSection = (id: string) => {
    setEditing(null)
    setWorkClientId(null)
    setTodoClientId(null)
    setReturnClientId(null)
    if (id === 'calendar' || id === 'notes' || id === 'users') {
      setSection(id)
      setModal(id)
      return
    }
    setModal(null)
    setSection(id)
    if (id === 'payments') {
      setPaymentView('overview')
      setSelectedPaymentId(null)
    }
  }
  const savePassword = async (data: any) => {
    const value = { title: data.title, username: data.username, password: data.password, website: data.website, category: data.category, emoji: data.emoji, notes: data.notes, isFavorite: data.isFavorite, pin_code: data.pin_code }
    if (editing) await updatePassword(editing.id, value)
    else await addPassword(value)
    close()
  }

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart); todayEnd.setHours(23, 59, 59, 999)
  const isToday = (value?: string | null) => {
    if (!value) return false
    const date = new Date(value)
    return !Number.isNaN(date.getTime()) && date >= todayStart && date <= todayEnd
  }
  const isPendingEvent = (event: typeof events[number]) => {
    if (event.is_completed || event.archived_at) return false
    const start = new Date(event.start_date)
    if (Number.isNaN(start.getTime())) return false
    if (event.all_day) return start >= todayStart
    const end = new Date(event.end_date || event.start_date)
    return !Number.isNaN(end.getTime()) && end >= now
  }
  const openCalls = calls.filter(call => call.status === 'pending' || call.status === 'in_corso')
  const openWorkItems = workItems.filter(item => item.kind !== 'todo' && item.status !== 'completed')
  const openTodos = workItems.filter(item => item.kind === 'todo' && item.status !== 'completed')
  const unpaidPayments = payments.filter(payment => paymentRemainingAmount(payment) > 0)
  const todayCount = calls.filter(call => (call.status === 'pending' || call.status === 'in_corso') && call.follow_up && isToday(call.follow_up_date)).length
    + events.filter(event => isToday(event.start_date) && isPendingEvent(event)).length
    + notes.filter(note => isToday(note.reminder_at)).length
    + unpaidPayments.filter(payment => isToday(payment.reminder_at)).length
    + workItems.filter(item => item.kind !== 'todo' && item.status !== 'completed' && (isToday(item.scheduled_at) || isToday(item.due_date))).length
  const items = [
    ['today', 'Oggi', CheckCircle2, todayCount, 'bg-[#d9e8d9]', 'text-[#257259]'],
    ['calls', 'Chiamate', Phone, openCalls.length, 'bg-[#ff765f]', 'text-[#a9322b]'],
    ['calendar', 'Calendario', Calendar, events.filter(isPendingEvent).length, 'bg-[#f7c948]', 'text-[#785b00]'],
    ['notes', 'Note', StickyNote, notes.length, 'bg-[#8ed8c3]', 'text-[#176653]'],
    ['photos', 'Galleria foto', LayoutGrid, null, 'bg-[#d9e8d9]', 'text-[#257259]'],
    ['passwords', 'Password', KeyRound, passwords.length, 'bg-[#9d8cff]', 'text-[#4b3ba5]'],
    ['clients', 'Rubrica', Users, clients.length, 'bg-[#76a9f7]', 'text-[#174a9b]'],
    ['work_items', 'Lavorazioni', Briefcase, openWorkItems.length, 'bg-[#d9e8d9]', 'text-[#257259]'],
    ['todos', 'Cose da fare', ClipboardList, openTodos.length, 'bg-[#f7c948]', 'text-[#785b00]'],
    ['shopping', 'Spesa', ShoppingCart, shopping.items.filter(item => !item.purchased).length, 'bg-[#d9e8d9]', 'text-[#257259]'],
    ['payments', 'Pagamenti', CreditCard, unpaidPayments.length, 'bg-[#cfe4ff]', 'text-[#376db5]'],
    ...(isAdmin ? [['users', 'Utenti', Shield, users.length, 'bg-[#f2a7cf]', 'text-[#9a3268]'] as const] : []),
  ] as const
  const activeItem = items.find(([id]) => id === section) || items[0]
  const todayLabel = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const recentItems = [...calls.slice(0, 2).map((item) => ({ label: item.caller_name, type: 'Chiamata', date: item.call_date })), ...notes.slice(0, 2).map((item) => ({ label: item.title, type: 'Nota', date: item.updated_at })), ...clients.slice(0, 2).map((item) => ({ label: item.name, type: 'Cliente', date: item.created_at }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4)
  const openList = section === 'calls' ? 'calls' : section === 'calendar' ? 'calendar' : section === 'notes' ? 'notes' : section === 'passwords' ? 'passwords' : section === 'clients' ? 'clients' : 'users'
  const openNew = section === 'calls' ? 'call' : section === 'calendar' ? 'event' : section === 'notes' ? 'note' : section === 'passwords' ? 'password' : section === 'clients' ? 'client' : section === 'payments' ? 'payment' : section === 'work_items' ? 'work_item' : section === 'todos' ? 'todo' : 'call'

  if (!user) return (
    <main className="ak-login relative flex min-h-screen items-center overflow-hidden p-5 sm:p-10">
      <div className="ak-orbit ak-orbit-one" /><div className="ak-orbit ak-orbit-two" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="ak-login-poster flex min-h-[33rem] flex-col justify-between rounded-[2.5rem] p-8 sm:p-12 lg:p-16">
          <div className="flex items-center gap-3"><span className="flex h-12 w-12 rotate-3 items-center justify-center rounded-2xl bg-[#ff765f] text-[#2d2754]"><KeyRound className="h-6 w-6" /></span><span className="text-lg font-black tracking-tight">AK SUITE</span></div>
          <div><p className="mb-5 text-sm font-black uppercase tracking-[0.3em] text-[#ff765f]">personal command center</p><h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.04em] sm:text-7xl">Le tue giornate, con più ritmo.</h1><p className="mt-7 max-w-lg text-lg leading-8 text-[#514b70]">Una console personale per tenere insieme contatti, chiamate, appunti, appuntamenti e credenziali.</p></div>
          <div className="flex items-center gap-3 text-sm font-bold text-[#514b70]"><Sparkles className="h-5 w-5 text-[#ff765f]" /> Sei aree. Un solo posto. Zero rumore.</div>
        </div>
        <div className="ak-login-card flex min-h-[33rem] flex-col justify-center rounded-[2.5rem] p-8 sm:p-12"><div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7c948] text-[#2d2754] shadow-lg shadow-[#f7c948]/30"><LogIn className="h-6 w-6" /></div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#716a91]">Bentornato</p><h2 className="mt-3 text-4xl font-black tracking-tight text-[#2d2754]">Riprendiamo da qui.</h2><p className="mt-4 leading-7 text-[#716a91]">Accedi al tuo spazio personale e ritrova tutto al suo posto.</p><button onClick={() => setAuthOpen(true)} className="mt-9 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2d2754] px-4 py-4 font-bold text-[#fff6df] shadow-xl shadow-[#2d2754]/20 transition hover:-translate-y-1 hover:bg-[#40376f]"><LogIn className="h-4 w-4" />Entra nella suite</button><div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#716a91]"><Shield className="h-4 w-4 text-[#5f9e8e]" />Accesso personale protetto</div></div>
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />
    </main>
  )

  return (
    <main className="ak-app min-h-screen p-4 text-[#2d2754] sm:p-7">
      <div className="mx-auto max-w-7xl">
        <header className="ak-topbar mb-5 grid gap-4 rounded-[1.75rem] px-5 py-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-2xl bg-[#ff765f] text-[#2d2754]"><KeyRound className="h-5 w-5" /></span>
            <div><p className="text-lg font-black tracking-tight">AK SUITE</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7f9f]">personal edition</p></div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setGlobalSearchOpen(true)} title="Ricerca globale" className="ak-logout"><Search className="h-4 w-4" />Cerca</button>
            <button onClick={() => void requestPermission()} title="Attiva notifiche" className="ak-logout"><Bell className="h-4 w-4" />Notifiche</button>
            <button onClick={() => supabase.auth.signOut()} title="Esci" className="ak-logout"><LogOut className="h-4 w-4" />Esci</button>
          </div>
          <nav className="hide-scrollbar flex min-w-0 gap-1 overflow-x-auto border-t border-[#ead8bf] pt-3 sm:col-span-2" aria-label="Navigazione principale">
            {items.map(([id, label, Icon, count, tint, ink]) => (
              <button key={id} onClick={() => navigateToSection(id)} className={`ak-nav-item shrink-0 whitespace-nowrap ${section === id ? `${tint} ${ink}` : ''}`}>
                <Icon className="h-4 w-4" />{label}<span className="opacity-60">{count}</span>
              </button>
            ))}
          </nav>
        </header>
        {section === 'today' && <><section className="ak-hero mb-5 grid gap-6 overflow-hidden rounded-[2rem] p-6 sm:p-9 lg:grid-cols-[1.4fr_0.6fr] lg:p-12"><div className="relative z-10"><p className="text-sm font-bold capitalize text-[#716a91]">{todayLabel}</p><h1 className="mt-3 max-w-2xl text-5xl font-black leading-[0.95] tracking-[-0.04em] text-[#2d2754] sm:text-7xl">Buongiorno,<br /><span className="text-[#e45f4e]">facciamo ordine.</span></h1><p className="mt-6 max-w-lg text-base leading-7 text-[#514b70]">Il tuo centro operativo per le cose che contano davvero oggi.</p><button onClick={() => open(openNew)} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#2d2754] px-5 py-3.5 font-bold text-[#fff6df] shadow-lg shadow-[#2d2754]/20 transition hover:-translate-y-1"><Plus className="h-4 w-4" />Aggiungi qualcosa</button></div><NotesStickyWidget notes={notes} onOpenNote={(note) => open('note', note)} onAddNote={() => open('note')} /></section><section className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.filter(([id]) => id !== 'today').map(([id, label, Icon, count, tint, ink]) => <button key={id} onClick={() => { if (id === 'work_items' || id === 'todos' || id === 'photos') navigateToSection(id); else { setSection(id); if (id === 'payments') close(); else open(id === 'calls' ? 'calls' : id === 'calendar' ? 'calendar' : id === 'notes' ? 'notes' : id === 'passwords' ? 'passwords' : id === 'clients' ? 'clients' : 'users') } }} className="ak-bento group text-left"><div className={`mb-7 flex h-12 w-12 items-center justify-center rounded-2xl ${tint} ${ink}`}><Icon className="h-5 w-5" /></div><div className="flex items-end justify-between"><div><p className="text-4xl font-black text-[#2d2754]">{count ?? '—'}</p><p className="mt-1 font-bold text-[#716a91]">{label}</p></div><ArrowUpRight className="h-5 w-5 text-[#a99dbb] transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#e45f4e]" /></div></button>)}</div><DashboardDesk calls={calls} events={events} payments={payments} onOpenAgendaItem={setSelectedAgendaItem} /></section></>}
        {eventsError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{eventsError}</p>}
        {integrationNotice && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm">{integrationNotice}<button className="ml-3 underline" onClick={() => setIntegrationNotice('')}>Chiudi</button></p>}
        {section === 'photos' && <PhotoGallery key={user?.id || 'guest'} scope={{ general: true }} />}
        {section === 'calls' && <CallsWorkspace calls={calls} onNew={() => open('call')} onEdit={(call) => open('call', call)} onDetail={setSelectedCall} onDelete={deleteCall} onStatusChange={updateCallStatus} />}
        {section === 'work_items' &&                 <WorkItemsWorkspace onRescheduleEvent={event => open('event', event)} key={`${user?.id || 'guest'}-work`} workItems={workItems} events={events} clients={clients} loading={workItemsLoading} errorMessage={workItemsError} clientScopeId={workClientId} onBackToClients={() => { setReturnClientId(workClientId); setWorkClientId(null); setSection('clients') }} onNew={() => open('work_item')} onEdit={item => open('work_item', item)} onUpdate={updateWorkItem} onDelete={deleteWorkItem} onScheduleFollowUp={scheduleEventFollowUp} />}
        {section === 'todos' &&                 <WorkItemsWorkspace onRescheduleEvent={event => open('event', event)} key={`${user?.id || 'guest'}-todo`} mode="todo" workItems={workItems} events={events} clients={clients} loading={workItemsLoading} errorMessage={workItemsError} clientScopeId={todoClientId} onBackToClients={() => { setReturnClientId(todoClientId); setTodoClientId(null); setSection('clients') }} onNew={() => open('todo')} onEdit={item => open('todo', item)} onUpdate={updateWorkItem} onDelete={deleteWorkItem} onScheduleFollowUp={scheduleEventFollowUp} />}
        {section === 'shopping' && <ShoppingWorkspace key={user.id} data={shopping} />}
        {section === 'today' && <TodayWorkspace calls={calls} events={events} notes={notes} payments={payments} workItems={workItems.filter(item => item.kind !== 'todo')} clients={clients} onOpen={(type, item) => { if (type === 'call') setSelectedCall(item); else if (type === 'event') open('event', item); else if (type === 'note') open('note', item); else if (type === 'work_item') { setSection('work_items'); open('work_item', item) } else { setSection('payments'); setSelectedPaymentId(item.id); setPaymentView('practice') } }} />}
        {section === 'passwords' && <PasswordsWorkspace passwords={passwords} categories={categories} onCreateCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} onNew={() => open('password')} onEdit={(password) => open('password', password)} onDetail={setSelectedPassword} onDelete={deletePassword} />}
        {section === 'clients' && <ClientsWorkspace clients={clients} calls={calls} events={events} workItems={workItems} initialSelectedClientId={returnClientId} onOpenWorkItems={client => { setReturnClientId(null); setWorkClientId(client.id); setSection('work_items') }} onOpenTodos={client => { setReturnClientId(null); setTodoClientId(client.id); setSection('todos') }} onNewAppointment={openNewAppointment} onEditEvent={openEditAppointment} onDeleteEvent={id => { void deleteEvent(id) }} onScheduleFollowUp={scheduleEventFollowUp} onNew={() => open('client')} onEdit={(client) => open('client', client)} onDelete={deleteClient} onToggleFavorite={toggleFavorite} />}
        {section === 'payments' && (paymentView === 'overview' ? <PaymentsOverview payments={payments} onNew={() => open('payment')} onDelete={deletePayment} onOpenPractice={(payment) => { setSelectedPaymentId(payment.id); setPaymentView('practice') }} /> : <PaymentsWorkspace payments={payments} focusPaymentId={selectedPaymentId} onNew={() => open('payment')} onEdit={(payment) => open('payment', payment)} onDelete={deletePayment} onUpdate={(id, updates) => updatePayment(id, updates)} onBack={() => { setSelectedPaymentId(null); setPaymentView('overview') }} />)}
      </div>

      {modal === 'password' && <PasswordModal isOpen onClose={close} onSave={savePassword} editPassword={editing} categories={categories} />}
      {modal === 'passwords' && <PasswordListModal isOpen onClose={close} passwords={passwords} onDelete={deletePassword} onEdit={(password) => open('password', password)} />}
      {modal === 'calls' && <CallMenuModal isOpen onClose={close} onSelectNew={() => open('call')} onSelectList={() => open('calls')} />}
      {modal === 'call' && <CallModal isOpen onClose={close} onSave={async (data) => { if (editing) await updateCall(editing.id, data); else await addCall(data); close() }} editCall={editing} clients={clients} initialClient={followUpClient} defaultFollowUpDate={followUpDate} initialFollowUpNote={followUpNote} onAddClient={addClient} availableItems={emptyRelations} />}
      {modal === 'notes' && <NotesListModal isOpen onClose={close} notes={notes} onDelete={deleteNote} onUpdate={updateNote} onTogglePin={togglePin} onEdit={(note) => open('note', note)} onAdd={() => open('note')} />}
      {modal === 'note' && <NoteModal isOpen onClose={close} onSave={async (data) => { if (editing) await updateNote(editing.id, data); else await addNote(data); close() }} editNote={editing} availableItems={emptyRelations} />}
      {modal === 'calendar' &&       <CalendarView key={user?.id || 'guest'} initialSettings={calendarSettingsOpen} isOpen onClose={close} events={events} clients={clients} workItems={workItems} onDelete={deleteEvent} onEdit={(event) => open('event', event)} onAdd={() => open('event')} onScheduleFollowUp={scheduleEventFollowUp} isAdmin={isAdmin} currentUserId={user?.id} managedUsers={users} />}
      {modal === 'event' && <EventModal isOpen clients={clients} workItems={workItems} events={events} defaultClientId={appointmentClientId} onClose={close} onSave={async (data) => {       if (editing) await updateEvent(editing.id, data); else await addEvent(data) }} editEvent={editing} isAdmin={isAdmin} managedUsers={users} availableItems={emptyRelations} />}
      {modal === 'clients' && <>
        <ClientsListModal isOpen onClose={close} clients={clients} onDelete={deleteClient} onToggleFavorite={toggleFavorite} onAdd={() => open('client')} onEdit={(client) => open('client', client)} onSelectClient={setSelectedClient} />
        {selectedClient && <ClientDetailModal
          client={selectedClient}
          clients={clients}
          calls={calls}
          events={events}
          workItems={workItems}
          onNewAppointment={openNewAppointment}
          onEditEvent={openEditAppointment}
          onDeleteEvent={id => { void deleteEvent(id) }}
          onScheduleFollowUp={scheduleEventFollowUp}
          onOpenWorkItems={client => { setSelectedClient(null); setReturnClientId(null); setWorkClientId(client.id); setModal(null); setSection('work_items') }}
          onOpenTodos={client => { setSelectedClient(null); setReturnClientId(null); setTodoClientId(client.id); setModal(null); setSection('todos') }}
          onClose={() => setSelectedClient(null)}
          onSelectClient={setSelectedClient}
          onEdit={client => { setSelectedClient(null); open('client', client) }}
          onDelete={deleteClient}
        />}
      </>}
      {modal === 'client' && <ClientModal isOpen clients={clients} onClose={close} onSave={async (data) => { if (editing) await updateClient(editing.id, data); else await addClient(data); close() }} editingClient={editing} />}
      {modal === 'payment' && <PaymentModal isOpen onClose={close} onSave={async (data) => { if (editing) await updatePayment(editing.id, data); else await addPayment(data) }} editingPayment={editing} />}
      {modal === 'work_item' && <WorkItemModal isOpen clients={clients} defaultClientId={workClientId} onClose={close} onSave={async data => { if (editing) await updateWorkItem(editing.id, data); else await addWorkItem(data) }} editingWorkItem={editing} />}
      {modal === 'todo' && <WorkItemModal isOpen mode="todo" clients={clients} defaultClientId={todoClientId} onClose={close} onSave={async data => { if (editing) await updateWorkItem(editing.id, data); else await addWorkItem(data) }} editingWorkItem={editing} />}
      {modal === 'users' && section !== 'work_items' && <UserManagementModal isOpen onClose={close} users={users} onCreateUser={createUser} onTogglePermission={togglePermission} onSetAllPermissions={setAllPermissions} onDeleteUser={deleteUserPermissions} onLoadUsers={loadAllUsers} />}
      <CallDetailModal isOpen={Boolean(selectedCall)} onClose={() => setSelectedCall(null)} call={selectedCall} />
      <PasswordDetailModal password={selectedPassword} onClose={() => setSelectedPassword(null)} onEdit={(password) => open('password', password)} onDelete={deletePassword} />
      <AgendaSummaryModal item={selectedAgendaItem} onClose={() => setSelectedAgendaItem(null)} onOpenFull={item => { setSelectedAgendaItem(null); if (item.kind === 'call') { setSection('calls'); setSelectedCall(item.item) } else if (item.kind === 'event') { setSection('calendar'); setModal('calendar') } else { setSection('payments'); setSelectedPaymentId(item.kind === 'advance' ? item.item.payment.id : item.item.id); setPaymentView('practice') } }} />
      <EventResponsePrompt onReschedule={event => open('event', event)} />
      <GlobalSearchModal key={user?.id || 'guest'} isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} calls={calls} events={events} notes={notes} payments={payments} clients={clients} passwords={passwords} onOpen={(type, item) => setSelectedSearchResult({ type, item })} />
      <SearchResultSummaryModal result={selectedSearchResult} onClose={() => setSelectedSearchResult(null)} onOpen={() => { const result = selectedSearchResult; setSelectedSearchResult(null); if (!result) return; if (result.type === 'call') setSelectedCall(result.item); else if (result.type === 'event') open('event', result.item); else if (result.type === 'note') open('note', result.item); else if (result.type === 'client') open('client', result.item); else if (result.type === 'payment') { setSection('payments'); setSelectedPaymentId(result.item.id); setPaymentView('practice') }       else if (result.type === 'password') setSelectedPassword(result.item); else if (result.type === 'todo') { setSection('todos'); open('todo', result.item) } }} />
    </main>
  )
}
