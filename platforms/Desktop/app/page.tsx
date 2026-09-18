'use client'

import { useState } from 'react'
import { ArrowUpRight, Calendar, CheckCircle2, KeyRound, LayoutGrid, LogIn, LogOut, Phone, Plus, Shield, Sparkles, StickyNote, Users } from 'lucide-react'
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
import CallsWorkspace from './components/CallsWorkspace'
import PasswordsWorkspace from './components/PasswordsWorkspace'
import ClientsWorkspace from './components/ClientsWorkspace'
import CallDetailModal from './components/CallDetailModal'
import PasswordDetailModal from './components/PasswordDetailModal'
import UserManagementModal from './components/UserManagementModal'
import AuthModal from './components/AuthModal'

const emptyRelations = { passwords: [], calls: [], notes: [], events: [] }

export default function Home() {
  const { passwords, categories, addPassword, addCategory, updatePassword, deletePassword, user } = usePasswords()
  const { calls, addCall, updateCall, deleteCall, updateCallStatus } = useCalls()
  const { notes, addNote, updateNote, deleteNote, togglePin } = useNotes()
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()
  const { clients, addClient, updateClient, deleteClient, toggleFavorite } = useClients()
  const { users, isAdmin, createUser, togglePermission, setAllPermissions, deleteUserPermissions, loadAllUsers } = useUserManagement()
  const [authOpen, setAuthOpen] = useState(false)
  const [section, setSection] = useState('dashboard')
  const [modal, setModal] = useState<string | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [selectedPassword, setSelectedPassword] = useState<any>(null)

  const open = (name: string, item: any = null) => { setEditing(item); setModal(name) }
  const close = () => { setEditing(null); setModal(null) }
  const savePassword = async (data: any) => {
    const value = { title: data.title, username: data.username, password: data.password, website: data.website, category: data.category, emoji: data.emoji, notes: data.notes, isFavorite: data.isFavorite, pin_code: data.pin_code }
    if (editing) await updatePassword(editing.id, value)
    else await addPassword(value)
    close()
  }

  const totalItems = calls.length + events.length + notes.length + passwords.length + clients.length
  const items = [
    ['dashboard', 'Dashboard', LayoutGrid, totalItems, 'bg-[#c9c2ff]', 'text-[#2d2754]'],
    ['calls', 'Chiamate', Phone, calls.length, 'bg-[#ff765f]', 'text-[#a9322b]'],
    ['calendar', 'Calendario', Calendar, events.length, 'bg-[#f7c948]', 'text-[#785b00]'],
    ['notes', 'Note', StickyNote, notes.length, 'bg-[#8ed8c3]', 'text-[#176653]'],
    ['passwords', 'Password', KeyRound, passwords.length, 'bg-[#9d8cff]', 'text-[#4b3ba5]'],
    ['clients', 'Rubrica', Users, clients.length, 'bg-[#76a9f7]', 'text-[#174a9b]'],
    ...(isAdmin ? [['users', 'Utenti', Shield, users.length, 'bg-[#f2a7cf]', 'text-[#9a3268]'] as const] : []),
  ] as const
  const activeItem = items.find(([id]) => id === section) || items[0]
  const todayLabel = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const recentItems = [...calls.slice(0, 2).map((item) => ({ label: item.caller_name, type: 'Chiamata', date: item.call_date })), ...notes.slice(0, 2).map((item) => ({ label: item.title, type: 'Nota', date: item.updated_at })), ...clients.slice(0, 2).map((item) => ({ label: item.name, type: 'Cliente', date: item.created_at }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4)
  const openList = section === 'dashboard' ? 'calls' : section === 'calls' ? 'calls' : section === 'calendar' ? 'calendar' : section === 'notes' ? 'notes' : section === 'passwords' ? 'passwords' : section === 'clients' ? 'clients' : 'users'
  const openNew = section === 'dashboard' ? 'call' : section === 'calls' ? 'call' : section === 'calendar' ? 'event' : section === 'notes' ? 'note' : section === 'passwords' ? 'password' : section === 'clients' ? 'client' : 'users'

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
        <header className="ak-topbar mb-5 flex flex-col gap-4 rounded-[1.75rem] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div className="flex items-center gap-3"><span className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-2xl bg-[#ff765f] text-[#2d2754]"><KeyRound className="h-5 w-5" /></span><div><p className="text-lg font-black tracking-tight">AK SUITE</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a7f9f]">personal edition</p></div></div><nav className="flex flex-wrap gap-2">{items.map(([id, label, Icon, count, tint, ink]) => <button key={id} onClick={() => { setSection(id); setModal(null) }} className={`ak-nav-item ${section === id ? `${tint} ${ink}` : ''}`}><Icon className="h-4 w-4" />{label}<span className="opacity-60">{count}</span></button>)}</nav><button onClick={() => supabase.auth.signOut()} title="Esci" className="ak-logout"><LogOut className="h-4 w-4" />Esci</button></header>
        <section className="ak-hero mb-5 grid gap-6 overflow-hidden rounded-[2rem] p-6 sm:p-9 lg:grid-cols-[1.4fr_0.6fr] lg:p-12"><div className="relative z-10"><p className="text-sm font-bold capitalize text-[#716a91]">{todayLabel}</p><h1 className="mt-3 max-w-2xl text-5xl font-black leading-[0.95] tracking-[-0.04em] text-[#2d2754] sm:text-7xl">Buongiorno,<br /><span className="text-[#e45f4e]">facciamo ordine.</span></h1><p className="mt-6 max-w-lg text-base leading-7 text-[#514b70]">Il tuo centro operativo per le cose che contano davvero oggi.</p><button onClick={() => open(openNew)} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#2d2754] px-5 py-3.5 font-bold text-[#fff6df] shadow-lg shadow-[#2d2754]/20 transition hover:-translate-y-1"><Plus className="h-4 w-4" />Aggiungi qualcosa</button></div><div className="ak-hero-sticker flex min-h-48 flex-col justify-between rounded-[1.75rem] p-6"><Sparkles className="h-7 w-7 text-[#e45f4e]" /><div><p className="text-sm font-bold text-[#716a91]">Sei aree, una vista</p><p className="mt-1 text-2xl font-black text-[#2d2754]">{calls.length + events.length + notes.length + passwords.length + clients.length}</p><p className="text-sm text-[#716a91]">elementi nel tuo spazio</p></div></div></section>
        {section === 'calls' && <CallsWorkspace calls={calls} onNew={() => open('call')} onEdit={(call) => open('call', call)} onDetail={setSelectedCall} onDelete={deleteCall} onStatusChange={updateCallStatus} />}
        {section === 'passwords' && <PasswordsWorkspace passwords={passwords} categories={categories} onNew={() => open('password')} onEdit={(password) => open('password', password)} onDetail={setSelectedPassword} onDelete={deletePassword} />}
        {section === 'clients' && <ClientsWorkspace clients={clients} onNew={() => open('client')} onEdit={(client) => open('client', client)} onDelete={deleteClient} onToggleFavorite={toggleFavorite} />}
        {!['calls', 'passwords', 'clients'].includes(section) && <section className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.filter(([id]) => id !== 'dashboard').map(([id, label, Icon, count, tint, ink]) => <button key={id} onClick={() => { setSection(id); open(id === 'calls' ? 'calls' : id === 'calendar' ? 'calendar' : id === 'notes' ? 'notes' : id === 'passwords' ? 'passwords' : id === 'clients' ? 'clients' : 'users') }} className="ak-bento group text-left"><div className={`mb-7 flex h-12 w-12 items-center justify-center rounded-2xl ${tint} ${ink}`}><Icon className="h-5 w-5" /></div><div className="flex items-end justify-between"><div><p className="text-4xl font-black text-[#2d2754]">{count}</p><p className="mt-1 font-bold text-[#716a91]">{label}</p></div><ArrowUpRight className="h-5 w-5 text-[#a99dbb] transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#e45f4e]" /></div></button>)}</div>
          <div className="ak-activity rounded-[1.75rem] p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#e45f4e]">live desk</p><h2 className="mt-2 text-2xl font-black text-[#2d2754]">Ultimi movimenti</h2></div><CheckCircle2 className="h-6 w-6 text-[#5f9e8e]" /></div><div className="mt-7 space-y-4">{recentItems.length ? recentItems.map((item) => <div key={`${item.type}-${item.label}`} className="ak-activity-row"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4e6d2] text-xs font-black text-[#e45f4e]">{item.type[0]}</span><div className="min-w-0"><p className="truncate font-bold text-[#3e3860]">{item.label}</p><p className="text-xs text-[#8a7f9f]">{item.type} · {new Date(item.date).toLocaleDateString('it-IT')}</p></div></div>) : <p className="text-sm text-[#8a7f9f]">Nessuna attività recente.</p>}</div></div>
        </section>}
      </div>

      {modal === 'password' && <PasswordModal isOpen onClose={close} onSave={savePassword} editPassword={editing} categories={categories} onCreateCategory={addCategory} />}
      {modal === 'passwords' && <PasswordListModal isOpen onClose={close} passwords={passwords} onDelete={deletePassword} onEdit={(password) => open('password', password)} />}
      {modal === 'calls' && <CallMenuModal isOpen onClose={close} onSelectNew={() => open('call')} onSelectList={() => open('calls')} />}
      {modal === 'call' && <CallModal isOpen onClose={close} onSave={async (data) => { if (editing) await updateCall(editing.id, data); else await addCall(data); close() }} editCall={editing} clients={clients} onAddClient={addClient} availableItems={emptyRelations} />}
      {modal === 'notes' && <NotesListModal isOpen onClose={close} notes={notes} onDelete={deleteNote} onUpdate={updateNote} onTogglePin={togglePin} onEdit={(note) => open('note', note)} onAdd={() => open('note')} />}
      {modal === 'note' && <NoteModal isOpen onClose={close} onSave={async (data) => { if (editing) await updateNote(editing.id, data); else await addNote(data); close() }} editNote={editing} availableItems={emptyRelations} />}
      {modal === 'calendar' && <CalendarView isOpen onClose={close} events={events} onDelete={deleteEvent} onEdit={(event) => open('event', event)} onAdd={() => open('event')} isAdmin={isAdmin} currentUserId={user?.id} managedUsers={users} />}
      {modal === 'event' && <EventModal isOpen onClose={close} onSave={async (data) => { if (editing) await updateEvent(editing.id, data); else await addEvent(data); close() }} editEvent={editing} isAdmin={isAdmin} managedUsers={users} availableItems={emptyRelations} />}
      {modal === 'clients' && <ClientsListModal isOpen onClose={close} clients={clients} onDelete={deleteClient} onToggleFavorite={toggleFavorite} onAdd={() => open('client')} onEdit={(client) => open('client', client)} onSelectClient={() => undefined} />}
      {modal === 'client' && <ClientModal isOpen onClose={close} onSave={async (data) => { if (editing) await updateClient(editing.id, data); else await addClient(data); close() }} editingClient={editing} />}
      {modal === 'users' && <UserManagementModal isOpen onClose={close} users={users} onCreateUser={createUser} onTogglePermission={togglePermission} onSetAllPermissions={setAllPermissions} onDeleteUser={deleteUserPermissions} onLoadUsers={loadAllUsers} />}
      <CallDetailModal isOpen={Boolean(selectedCall)} onClose={() => setSelectedCall(null)} call={selectedCall} />
      <PasswordDetailModal password={selectedPassword} onClose={() => setSelectedPassword(null)} onEdit={(password) => open('password', password)} onDelete={deletePassword} />
    </main>
  )
}
