'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, UserPlus, Users, Shield, ShieldCheck, ShieldOff,
  Mail, Lock, User, Eye, EyeOff, Check, ChevronRight,
  Phone, Wrench, CheckSquare, Calendar, DollarSign,
  StickyNote, MapPin, Truck, ShoppingCart, Package, FileText,
  ToggleLeft, ToggleRight, Trash2, Search, CheckCircle2,
  ChevronDown, ChevronUp, AlertTriangle,
  ClipboardList, Monitor, PackageMinus, Layers, Ticket, Zap, Globe, UserCheck, DoorOpen
} from 'lucide-react'
import { type ManagedUser, type PermissionKey, PERMISSION_MODULES } from '../hooks/useUserManagement'

// Mappa icone per modulo
const ICON_MAP: Record<string, any> = {
  Phone, Wrench, CheckSquare, Calendar, DollarSign,
  Lock, StickyNote, Users, MapPin, Truck, ShoppingCart, Package, FileText,
  ClipboardList, Monitor, PackageMinus, Layers, Ticket, Zap, Globe, UserCheck, DoorOpen,
}

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
  users: ManagedUser[]
  onCreateUser: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>
  onTogglePermission: (userId: string, key: PermissionKey, value: boolean) => Promise<boolean>
  onSetAllPermissions: (userId: string, enabled: boolean) => Promise<boolean>
  onDeleteUser: (userId: string) => Promise<boolean>
  onLoadUsers: () => Promise<void>
}

export default function UserManagementModal({
  isOpen,
  onClose,
  users,
  onCreateUser,
  onTogglePermission,
  onSetAllPermissions,
  onDeleteUser,
  onLoadUsers,
}: UserManagementModalProps) {
  const [view, setView] = useState<'list' | 'create'>('list')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editFullName, setEditFullName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState(false)

  // Create user form
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Permessi toggle loading
  const [togglingPerm, setTogglingPerm] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      onLoadUsers()
    }
  }, [isOpen, onLoadUsers])

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      u.full_name.toLowerCase().includes(q)
    )
  })

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError('')

    const result = await onCreateUser(newEmail, newPassword, newFullName)

    if (result.success) {
      setShowSuccess(true)
      setNewEmail('')
      setNewPassword('')
      setNewFullName('')
      setTimeout(() => {
        setShowSuccess(false)
        setView('list')
      }, 1500)
    } else {
      setCreateError(result.error || 'Errore durante la creazione')
    }
    setCreateLoading(false)
  }

  const handleToggle = async (userId: string, key: PermissionKey, currentValue: boolean) => {
    const toggleKey = `${userId}-${key}`
    setTogglingPerm(toggleKey)
    await onTogglePermission(userId, key, !currentValue)
    setTogglingPerm(null)
  }

  const handleSetAll = async (userId: string, enabled: boolean) => {
    setTogglingPerm(`${userId}-all`)
    await onSetAllPermissions(userId, enabled)
    setTogglingPerm(null)
  }

  const handleDelete = async (userId: string) => {
    await onDeleteUser(userId)
    setConfirmDelete(null)
  }

  const startEdit = (u: ManagedUser) => {
    setEditingUser(u.id)
    setEditEmail(u.email)
    setEditFullName(u.full_name)
    setEditPassword('')
    setEditError('')
    setEditSuccess(false)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return
    setEditLoading(true)
    setEditError('')
    try {
      const { data: { user: currentUser } } = await (await import('@/lib/supabase')).supabase.auth.getUser()
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser,
          email: editEmail || undefined,
          fullName: editFullName || undefined,
          password: editPassword || undefined,
          adminUserId: currentUser?.id,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Errore aggiornamento')
      setEditSuccess(true)
      setTimeout(() => { setEditingUser(null); setEditSuccess(false); onLoadUsers() }, 1200)
    } catch (err: any) {
      setEditError(err.message)
    }
    setEditLoading(false)
  }

  const getPermissionCount = (user: ManagedUser): number => {
    if (!user.permissions) return 0
    return PERMISSION_MODULES.filter(m => (user.permissions as any)?.[m.key] === true).length
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Gestione Utenti</h2>
                <p className="text-slate-400 text-xs">{users.length} utenti registrati</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {view === 'list' ? (
                <button
                  onClick={() => setView('create')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nuovo Utente</span>
                </button>
              ) : (
                <button
                  onClick={() => { setView('list'); setCreateError('') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100/70 text-slate-600 text-sm font-medium hover:bg-slate-200/70 transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Lista Utenti</span>
                </button>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all text-slate-400" aria-label="Chiudi">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {view === 'create' ? (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 relative"
                >
                  {/* Success Overlay */}
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 rounded-2xl"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                      </motion.div>
                      <p className="text-lg font-bold text-slate-800">Utente Creato!</p>
                    </motion.div>
                  )}

                  <h3 className="text-slate-800 font-semibold text-base mb-4 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-500" />
                    Registra Nuovo Utente
                  </h3>

                  {createError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200/60 rounded-xl text-rose-600 text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {createError}
                    </div>
                  )}

                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2 block">Nome Completo</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={newFullName}
                          onChange={(e) => setNewFullName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-sm"
                          placeholder="Nome e cognome"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2 block">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-sm"
                          placeholder="email@esempio.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2 block">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-12 py-3 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-sm"
                          placeholder="Minimo 6 caratteri"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
                    >
                      {createLoading ? 'Creazione in corso...' : 'Crea Utente'}
                    </button>
                  </form>

                  <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl">
                    <p className="text-amber-700 text-xs font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      L'utente avr\u00e0 tutti i permessi disabilitati. Attivali dalla lista utenti.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 sm:p-6"
                >
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-sm"
                      placeholder="Cerca utente..."
                    />
                  </div>

                  {/* Users List */}
                  <div className="space-y-3">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                        <p className="text-slate-400 text-sm">
                          {searchQuery ? 'Nessun utente trovato' : 'Nessun utente registrato'}
                        </p>
                      </div>
                    ) : (
                      filteredUsers.map((managedUser) => {
                        const isExpanded = expandedUser === managedUser.id
                        const permCount = getPermissionCount(managedUser)
                        const isCurrentAdmin = managedUser.permissions?.is_admin || managedUser.id === '3740d43e-4020-4020-8582-ad305f9d06b4'

                        return (
                          <div
                            key={managedUser.id}
                            className="bg-white/60 backdrop-blur-lg border border-slate-200/50 rounded-2xl overflow-hidden transition-all hover:bg-white/80"
                          >
                            {/* User Header */}
                            <button
                              onClick={() => setExpandedUser(isExpanded ? null : managedUser.id)}
                              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                                isCurrentAdmin
                                  ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                  : 'bg-gradient-to-br from-indigo-400 to-violet-500'
                              }`}>
                                {managedUser.full_name ? managedUser.full_name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-slate-700 text-sm font-semibold truncate">
                                    {managedUser.full_name || 'Senza Nome'}
                                  </p>
                                  {isCurrentAdmin && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60">
                                      ADMIN
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-400 text-xs truncate">{managedUser.email}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                                  permCount === PERMISSION_MODULES.length
                                    ? 'text-emerald-600 bg-emerald-50'
                                    : permCount > 0
                                    ? 'text-amber-600 bg-amber-50'
                                    : 'text-slate-400 bg-slate-100'
                                }`}>
                                  {permCount}/{PERMISSION_MODULES.length}
                                </span>
                                {!isCurrentAdmin && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(confirmDelete === managedUser.id ? null : managedUser.id) }}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                    title="Elimina utente"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </button>

                            {/* Confirm Delete — shown inline without needing to expand */}
                            <AnimatePresence>
                              {confirmDelete === managedUser.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200/70 rounded-xl flex items-center justify-between">
                                    <p className="text-red-600 text-xs font-semibold flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                      Eliminare <span className="font-bold">{managedUser.full_name || managedUser.email}</span>?
                                    </p>
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                      <button
                                        onClick={() => handleDelete(managedUser.id)}
                                        className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all shadow-sm"
                                      >
                                        Elimina
                                      </button>
                                      <button
                                        onClick={() => setConfirmDelete(null)}
                                        className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-50 transition-all"
                                      >
                                        Annulla
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Expanded: Permission Checklist */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 border-t border-slate-100/80 pt-3">
                                    {/* Edit user form */}
                                    {editingUser === managedUser.id ? (
                                      <div className="mb-4 p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Modifica nome / credenziali</p>
                                        {editError && <p className="text-rose-600 text-xs font-medium">{editError}</p>}
                                        {editSuccess && <p className="text-emerald-600 text-xs font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" />Salvato!</p>}
                                        <div className="relative">
                                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                          <input value={editFullName} onChange={e => setEditFullName(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
                                            placeholder="Nome completo" />
                                        </div>
                                        <div className="relative">
                                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                          <input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email"
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
                                            placeholder="Email (login)" />
                                        </div>
                                        <div className="relative">
                                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                          <input value={editPassword} onChange={e => setEditPassword(e.target.value)} type="password"
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
                                            placeholder="Nuova password (lascia vuoto per non cambiare)" />
                                        </div>
                                        <div className="flex gap-2">
                                          <button onClick={handleSaveEdit} disabled={editLoading}
                                            className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 disabled:opacity-50 transition-all">
                                            {editLoading ? 'Salvo...' : 'Salva'}
                                          </button>
                                          <button onClick={() => setEditingUser(null)}
                                            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-50 transition-all">
                                            Annulla
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button onClick={() => startEdit(managedUser)}
                                        className="mb-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-all">
                                        <Mail className="w-3.5 h-3.5" />
                                        Modifica nome / email / password
                                      </button>
                                    )}

                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-2 mb-3">
                                      <button
                                        onClick={() => handleSetAll(managedUser.id, true)}
                                        disabled={togglingPerm === `${managedUser.id}-all`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-all disabled:opacity-50"
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Attiva Tutti
                                      </button>
                                      <button
                                        onClick={() => handleSetAll(managedUser.id, false)}
                                        disabled={togglingPerm === `${managedUser.id}-all`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-500 text-xs font-semibold hover:bg-rose-100 transition-all disabled:opacity-50"
                                      >
                                        <ShieldOff className="w-3.5 h-3.5" />
                                        Disattiva Tutti
                                      </button>
                                      {!isCurrentAdmin && (
                                        <button
                                          onClick={() => setConfirmDelete(managedUser.id)}
                                          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-400 text-xs font-medium hover:bg-rose-50 hover:text-rose-600 transition-all"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          Elimina
                                        </button>
                                      )}
                                    </div>

                                    {/* Permission Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {PERMISSION_MODULES.map((mod) => {
                                        const IconComponent = ICON_MAP[mod.icon]
                                        const isEnabled = (managedUser.permissions as any)?.[mod.key] === true
                                        const isToggling = togglingPerm === `${managedUser.id}-${mod.key}` || togglingPerm === `${managedUser.id}-all`

                                        return (
                                          <button
                                            key={mod.key}
                                            onClick={() => handleToggle(managedUser.id, mod.key, isEnabled)}
                                            disabled={isToggling}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                                              isEnabled
                                                ? 'bg-indigo-50/80 border-indigo-200/60 text-indigo-700'
                                                : 'bg-slate-50/50 border-slate-200/40 text-slate-400'
                                            } ${isToggling ? 'opacity-50' : 'hover:shadow-sm active:scale-[0.98]'}`}
                                          >
                                            {IconComponent && <IconComponent className={`w-4 h-4 shrink-0 ${isEnabled ? 'text-indigo-500' : 'text-slate-300'}`} />}
                                            <span className="flex-1 text-xs font-medium">{mod.label}</span>
                                            <div className={`w-8 h-5 rounded-full flex items-center transition-all ${
                                              isEnabled ? 'bg-indigo-500 justify-end' : 'bg-slate-200 justify-start'
                                            }`}>
                                              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm mx-0.5" />
                                            </div>
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
