'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Bell, Briefcase, Calendar, CheckCircle2, ClipboardList, CreditCard, KeyRound, LayoutGrid, LogIn, LogOut, Menu, Phone, Search, Shield, ShoppingCart, Sparkles, StickyNote, Users, X } from 'lucide-react'
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
import AgendaSummaryModal, { AgendaItem } from './components/AgendaSummaryModal'
import OperationalDashboard from './components/OperationalDashboard'
import { DashboardRow } from '@/lib/dashboard'
import { useReminderFeed } from './hooks/useReminderFeed'
import GlobalSearchModal from './components/GlobalSearchModal'
import SearchResultSummaryModal from './components/SearchResultSummaryModal'
import WorkItemsWorkspace from './components/WorkItemsWorkspace'
import WorkItemModal from './components/WorkItemModal'
import { usePayments } from './hooks/usePayments'
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
  const [section, setSection] = useState('today')
  const [modal, setModal] = useState<string | null>(null)
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const active = (...sections: string[]) => globalSearchOpen || sections.includes(section) || (modal !== null && sections.includes(modal))
  const { passwords, categories, addPassword, addCategory, updateCategory, deleteCategory, updatePassword, deletePassword, user } = usePasswords(active('passwords', 'password'))
  const { calls, addCall, updateCall, deleteCall, updateCallStatus } = useCalls(active('calls', 'call', 'clients'))
  const { notes, addNote, updateNote, deleteNote, togglePin } = useNotes(active('notes', 'note'))
  const { events, addEvent, updateEvent, deleteEvent, errorMessage: eventsError } = useEvents(active('calendar', 'event', 'clients', 'work_items', 'todos'))
  const { clients, addClient, updateClient, deleteClient, toggleFavorite } = useClients(active('clients', 'client', 'calendar', 'event', 'call', 'calls', 'work_items', 'work_item', 'todos', 'todo', 'payments', 'payment'))
  const { payments, addPayment, updatePayment, deletePayment } = usePayments(active('payments', 'payment'))
  const { workItems, loading: workItemsLoading, errorMessage: workItemsError, addWorkItem, updateWorkItem, deleteWorkItem } = useWorkItems(active('work_items', 'work_item', 'todos', 'todo', 'clients', 'calendar', 'event'))
  const shopping = useShopping(section === 'shopping')
  const { users, isAdmin, createUser, togglePermission, setAllPermissions, deleteUserPermissions, loadAllUsers } = useUserManagement()
  const owner = useRef(user?.id)
  owner.current = user?.id
  const [authOpen, setAuthOpen] = useState(false)
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
  const [calendarSettingsOpen, setCalendarSettingsOpen] = useState(false)
  const [integrationNotice, setIntegrationNotice] = useState('')
  const [selectedSearchResult, setSelectedSearchResult] = useState<{ type: string; item: any } | null>(null)
  const revision = `${section}:${modal || ''}`
  const reminderFeed = useReminderFeed(user?.id, revision)
  const { requestPermission } = useDesktopReminders(reminderFeed.events, reminderFeed.notes, reminderFeed.payments, reminderFeed.calls)
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
    setMenuOpen(false)
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

  const openDashboardEntry = async (row: DashboardRow) => {
    const userId = user?.id
    const tables = { event: 'events', todo: 'work_items', work_item: 'work_items', call: 'calls', payment: 'payments' }
    const { data, error } = await supabase.from(tables[row.kind]).select('*').eq('id', row.id).single()
    if (error) throw error
    if (owner.current !== userId) throw new Error('Sessione cambiata. Riprova.')
    setSelectedSearchResult({ type: row.kind, item: data })
  }

  const items = [
    ['today', 'Dashboard', CheckCircle2],
    ['calls', 'Chiamate', Phone],
    ['calendar', 'Calendario', Calendar],
    ['notes', 'Note', StickyNote],
    ['photos', 'Galleria foto', LayoutGrid],
    ['passwords', 'Password', KeyRound],
    ['clients', 'Rubrica', Users],
    ['work_items', 'Lavorazioni', Briefcase],
    ['todos', 'Cose da fare', ClipboardList],
    ['shopping', 'Spesa', ShoppingCart],
    ['payments', 'Pagamenti', CreditCard],
    ...(isAdmin ? [['users', 'Utenti', Shield] as const] : []),
  ] as const

  if (!user) return (
    <main className="ak-login relative flex min-h-screen items-center overflow-hidden p-5 sm:p-10">
      <div className="ak-orbit ak-orbit-one" /><div className="ak-orbit ak-orbit-two" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="ak-login-poster flex min-h-[33rem] flex-col justify-between rounded-[2.5rem] p-8 sm:p-12 lg:p-16">
          <div className="flex items-center gap-3"><span className="flex h-12 w-12 rotate-3 items-center justify-center rounded-2xl bg-[#ff765f] text-[#2d2754]"><KeyRound className="h-6 w-6" /></span><span className="text-lg font-black tracking-tight">AK SUITE</span></div>
          <div><p className="mb-5 text-sm font-black uppercase tracking-[0.3em] text-[#ff765f]">personal command center</p><h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.04em] sm:text-7xl">Le tue giornate, con più ritmo.</h1><p className="mt-7 max-w-lg text-lg leading-8 text-[#514b70]">Una console personale per tenere insieme contatti, chiamate, appunti, appuntamenti e credenziali.</p></div>
          <div className="flex items-center gap-3 text-sm font-bold text-[#514b70]"><Sparkles className="h-5 w-5 text-[#ff765f]" /> Tutto il tuo lavoro. Un solo posto.</div>
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
            <button onClick={() => setMenuOpen(value => !value)} aria-label="Menu sezioni" aria-expanded={menuOpen} className="ak-logout lg:hidden"><Menu className="h-5 w-5" /></button>
            <button onClick={() => setSidebarOpen(value => !value)} aria-label="Mostra o nascondi menu sezioni" aria-expanded={sidebarOpen} className="ak-logout hidden lg:inline-flex"><Menu className="h-5 w-5" /></button>
            <span className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-2xl bg-[#ff765f] text-[#2d2754]"><KeyRound className="h-5 w-5" /></span>
            <div><p className="text-lg font-black tracking-tight">AK SUITE</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7f9f]">personal edition</p></div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setGlobalSearchOpen(true)} title="Ricerca globale" className="ak-logout"><Search className="h-4 w-4" />Cerca</button>
            <button onClick={() => void requestPermission()} title="Attiva notifiche" className="ak-logout"><Bell className="h-4 w-4" />Notifiche</button>
            <button onClick={() => supabase.auth.signOut()} title="Esci" className="ak-logout"><LogOut className="h-4 w-4" />Esci</button>
          </div>
        </header>
        <div className={`grid items-start gap-5 ${sidebarOpen ? 'lg:grid-cols-[220px_minmax(0,1fr)]' : ''}`}>
          {(sidebarOpen || menuOpen) && <aside className={`${menuOpen ? 'block' : 'hidden'} rounded-2xl bg-[#fff8ed] p-3 ${sidebarOpen ? 'lg:sticky lg:top-5 lg:block' : 'lg:hidden'}`}>
            <div className="mb-2 flex items-center justify-between px-3 py-2"><strong className="text-xs uppercase text-[#716a91]">Sezioni</strong><button onClick={() => setMenuOpen(false)} aria-label="Chiudi menu" className="lg:hidden"><X className="h-4 w-4" /></button></div>
            <nav aria-label="Navigazione principale" className="space-y-1">{items.map(([id, label, Icon]) => <button key={id} aria-current={section === id ? 'page' : undefined} onClick={() => navigateToSection(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold ${section === id ? 'bg-[#f8dfb9] text-[#2d2754]' : 'text-[#716a91] hover:bg-[#efe8d8]'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
          </aside>}
          <div className="min-w-0">
        {section === 'today' && <OperationalDashboard key={user.id} revision={revision} enabled={modal === null} onNavigate={navigateToSection} onCreate={name => open(name)} onOpen={openDashboardEntry} />}
        {reminderFeed.error && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">{reminderFeed.error}</p>}
        {eventsError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{eventsError}</p>}
        {integrationNotice && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm">{integrationNotice}<button className="ml-3 underline" onClick={() => setIntegrationNotice('')}>Chiudi</button></p>}
        {section === 'photos' && <PhotoGallery key={user?.id || 'guest'} scope={{ general: true }} />}
        {section === 'calls' && <CallsWorkspace calls={calls} onNew={() => open('call')} onEdit={(call) => open('call', call)} onDetail={setSelectedCall} onDelete={deleteCall} onStatusChange={updateCallStatus} />}
        {section === 'work_items' &&                 <WorkItemsWorkspace onRescheduleEvent={event => open('event', event)} key={`${user?.id || 'guest'}-work`} workItems={workItems} events={events} clients={clients} loading={workItemsLoading} errorMessage={workItemsError} clientScopeId={workClientId} onBackToClients={() => { setReturnClientId(workClientId); setWorkClientId(null); setSection('clients') }} onNew={() => open('work_item')} onEdit={item => open('work_item', item)} onUpdate={updateWorkItem} onDelete={deleteWorkItem} onScheduleFollowUp={scheduleEventFollowUp} />}
        {section === 'todos' &&                 <WorkItemsWorkspace onRescheduleEvent={event => open('event', event)} key={`${user?.id || 'guest'}-todo`} mode="todo" workItems={workItems} events={events} clients={clients} loading={workItemsLoading} errorMessage={workItemsError} clientScopeId={todoClientId} onBackToClients={() => { setReturnClientId(todoClientId); setTodoClientId(null); setSection('clients') }} onNew={() => open('todo')} onEdit={item => open('todo', item)} onUpdate={updateWorkItem} onDelete={deleteWorkItem} onScheduleFollowUp={scheduleEventFollowUp} />}
        {section === 'shopping' && <ShoppingWorkspace key={user.id} data={shopping} />}
        {section === 'passwords' && <PasswordsWorkspace passwords={passwords} categories={categories} onCreateCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} onNew={() => open('password')} onEdit={(password) => open('password', password)} onDetail={setSelectedPassword} onDelete={deletePassword} />}
        {section === 'clients' && <ClientsWorkspace clients={clients} calls={calls} events={events} workItems={workItems} initialSelectedClientId={returnClientId} onOpenWorkItems={client => { setReturnClientId(null); setWorkClientId(client.id); setSection('work_items') }} onOpenTodos={client => { setReturnClientId(null); setTodoClientId(client.id); setSection('todos') }} onNewAppointment={openNewAppointment} onEditEvent={openEditAppointment} onDeleteEvent={id => { void deleteEvent(id) }} onScheduleFollowUp={scheduleEventFollowUp} onNew={() => open('client')} onEdit={(client) => open('client', client)} onDelete={deleteClient} onToggleFavorite={toggleFavorite} />}
        {section === 'payments' && (paymentView === 'overview' ? <PaymentsOverview payments={payments} onNew={() => open('payment')} onDelete={deletePayment} onOpenPractice={(payment) => { setSelectedPaymentId(payment.id); setPaymentView('practice') }} /> : <PaymentsWorkspace payments={payments} focusPaymentId={selectedPaymentId} onNew={() => open('payment')} onEdit={(payment) => open('payment', payment)} onDelete={deletePayment} onUpdate={(id, updates) => updatePayment(id, updates)} onBack={() => { setSelectedPaymentId(null); setPaymentView('overview') }} />)}
          </div>
        </div>
      </div>

      {modal === 'password' && <PasswordModal isOpen onClose={close} onSave={savePassword} editPassword={editing} categories={categories} />}
      {modal === 'passwords' && <PasswordListModal isOpen onClose={close} passwords={passwords} onDelete={deletePassword} onEdit={(password) => open('password', password)} />}
      {modal === 'calls' && <CallMenuModal isOpen onClose={close} onSelectNew={() => open('call')} onSelectList={() => open('calls')} />}
      {modal === 'call' && <CallModal isOpen onClose={close} onSave={async (data) => { if (editing) await updateCall(editing.id, data); else await addCall(data); close() }} editCall={editing} clients={clients} initialClient={followUpClient} defaultFollowUpDate={followUpDate} initialFollowUpNote={followUpNote} onAddClient={addClient} availableItems={emptyRelations} />}
      {modal === 'notes' && <NotesListModal isOpen onClose={close} notes={notes} onDelete={deleteNote} onUpdate={updateNote} onTogglePin={togglePin} onEdit={(note) => open('note', note)} onAdd={() => open('note')} />}
      {modal === 'note' && <NoteModal isOpen onClose={close} onSave={async (data) => { if (editing) await updateNote(editing.id, data); else await addNote(data); close() }} editNote={editing} availableItems={emptyRelations} />}
      {modal === 'calendar' &&       <CalendarView key={`calendar-${user?.id || 'guest'}`} initialSettings={calendarSettingsOpen} isOpen onClose={close} events={events} clients={clients} workItems={workItems} onDelete={deleteEvent} onEdit={(event) => open('event', event)} onAdd={() => open('event')} onScheduleFollowUp={scheduleEventFollowUp} isAdmin={isAdmin} currentUserId={user?.id} managedUsers={users} />}
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
      <GlobalSearchModal key={`global-search-${user?.id || 'guest'}`} isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} calls={calls} events={events} notes={notes} payments={payments} clients={clients} passwords={passwords} onOpen={(type, item) => setSelectedSearchResult({ type, item })} />
      <SearchResultSummaryModal result={selectedSearchResult} onClose={() => setSelectedSearchResult(null)} onOpen={() => {
        const result = selectedSearchResult
        setSelectedSearchResult(null)
        if (!result) return
        if (result.type === 'call') setSelectedCall(result.item)
        else if (result.type === 'event') open('event', result.item)
        else if (result.type === 'note') open('note', result.item)
        else if (result.type === 'client') open('client', result.item)
        else if (result.type === 'payment') { setSection('payments'); setSelectedPaymentId(result.item.id); setPaymentView('practice') }
        else if (result.type === 'password') setSelectedPassword(result.item)
        else if (result.type === 'todo') { setSection('todos'); open('todo', result.item) }
        else if (result.type === 'work_item') { setSection('work_items'); open('work_item', result.item) }
      }} />
    </main>
  )
}
