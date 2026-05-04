'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Search, Wrench, User, Users, Package, Trash2,
  Edit, ChevronRight, ClipboardList, Building2, Calendar,
  CheckCircle2, Clock, AlertTriangle, Circle, Tag, FileText
} from 'lucide-react'
import { ListaLavorazione } from '../hooks/useListeLavorazioni'
import { Client } from '../hooks/useClients'
import { Lavorazione } from '../hooks/useLavorazioni'

interface ListeLavorazioniListModalProps {
  isOpen: boolean
  onClose: () => void
  liste: ListaLavorazione[]
  clients: Client[]
  lavorazioni: Lavorazione[]
  onNew: () => void
  onEdit: (lista: ListaLavorazione) => void
  onDelete: (id: string, alsoDeleteLavorazione?: boolean) => Promise<void>
  onCreateLavorazione: (lista: ListaLavorazione) => void
  onCreateEvent: (lista: ListaLavorazione) => void
}

const STATUS_CFG = {
  bozza:          { label: 'Bozza',          bg: 'bg-slate-100',   border: 'border-slate-200',   text: 'text-slate-500',   dot: 'bg-slate-400',   icon: Circle },
  confermata:     { label: 'Confermata',     bg: 'bg-indigo-50',   border: 'border-indigo-200',  text: 'text-indigo-600',  dot: 'bg-indigo-500',  icon: CheckCircle2 },
  in_lavorazione: { label: 'In Lavorazione', bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-600',   dot: 'bg-amber-500',   icon: Clock },
  completata:     { label: 'Completata',     bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-600', dot: 'bg-emerald-500', icon: CheckCircle2 },
  annullata:      { label: 'Annullata',      bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-500',     dot: 'bg-red-400',     icon: X },
}

export default function ListeLavorazioniListModal({
  isOpen, onClose, liste, clients, lavorazioni,
  onNew, onEdit, onDelete, onCreateLavorazione, onCreateEvent
}: ListeLavorazioniListModalProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState<ListaLavorazione | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ lista: ListaLavorazione } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const getClient = (id: string | null) => id ? clients.find(c => c.id === id) : null
  const getLavorazione = (id: string | null) => id ? lavorazioni.find(l => l.id === id) : null

  const filtered = useMemo(() => {
    return liste.filter(l => {
      const client = getClient(l.client_id)
      const term = search.toLowerCase()
      const matchSearch = !term ||
        l.title.toLowerCase().includes(term) ||
        l.description.toLowerCase().includes(term) ||
        (client?.name || '').toLowerCase().includes(term) ||
        (client?.company || '').toLowerCase().includes(term)
      const matchStatus = filterStatus === 'all' || l.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [liste, search, filterStatus])

  const handleDelete = async (alsoLav: boolean) => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await onDelete(deleteConfirm.lista.id, alsoLav)
      if (selected?.id === deleteConfirm.lista.id) setSelected(null)
      setDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  // Sync selected with updated data
  const selectedFresh = selected ? (liste.find(l => l.id === selected.id) ?? selected) : null

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full h-full bg-white flex flex-col overflow-hidden"
        >
          {/* HEADER */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 to-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Liste Lavorazioni</h2>
                <p className="text-xs text-slate-400">{liste.length} liste totali</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onNew}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-indigo-700 active:scale-95 transition-all">
                <Plus className="w-4 h-4" /> Nuova Lista
              </button>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 flex min-h-0">

            {/* LISTA SINISTRA */}
            <div className={`flex flex-col border-r border-slate-100 transition-all ${selectedFresh ? 'w-[420px] flex-shrink-0' : 'flex-1'}`}>
              {/* Filtri */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Cerca lista, cliente..."
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all"
                  />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 focus:outline-none cursor-pointer">
                  <option value="all">Tutti gli stati</option>
                  {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                      <ClipboardList className="w-7 h-7 text-slate-200" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">Nessuna lista trovata</p>
                    <p className="text-xs text-slate-300 mb-5 mt-1">Crea la prima lista lavorazione</p>
                    <button onClick={onNew} className="text-xs font-semibold px-4 py-2 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-100 border border-violet-200/60 transition-all">
                      + Nuova Lista
                    </button>
                  </div>
                )}
                {filtered.map((lista, idx) => {
                  const cfg = STATUS_CFG[lista.status] || STATUS_CFG.bozza
                  const StatusIcon = cfg.icon
                  const client = getClient(lista.client_id)
                  const lav = getLavorazione(lista.lavorazione_id)
                  const isActive = selectedFresh?.id === lista.id

                  return (
                    <motion.div
                      key={lista.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelected(isActive ? null : lista)}
                      className={`group rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
                        isActive
                          ? 'border-violet-400 bg-violet-50/60 shadow-lg shadow-violet-500/10'
                          : 'border-slate-100 hover:border-violet-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                              <StatusIcon className="w-3 h-3" />{cfg.label}
                            </span>
                            {lista.items && lista.items.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                <Package className="w-3 h-3" />{lista.items.length}
                              </span>
                            )}
                            {lista.assigned_users && lista.assigned_users.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                <Users className="w-3 h-3" />{lista.assigned_users.length}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">{lista.title}</h3>
                          {lista.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{lista.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {client && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <Building2 className="w-3 h-3 text-slate-400" />{client.company || client.name}
                              </span>
                            )}
                            {lav && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600">
                                <Wrench className="w-3 h-3" />{lav.title}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 transition-transform ${isActive ? 'rotate-90 text-violet-500' : 'text-slate-300 group-hover:text-slate-500'}`} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* PANNELLO DETTAGLIO */}
            <AnimatePresence>
              {selectedFresh && (
                <motion.div
                  key={selectedFresh.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  className="flex-1 flex flex-col overflow-hidden bg-slate-50/40"
                >
                  <DetailPanel
                    lista={selectedFresh}
                    client={getClient(selectedFresh.client_id)}
                    lavorazione={getLavorazione(selectedFresh.lavorazione_id)}
                    onEdit={() => onEdit(selectedFresh)}
                    onDelete={() => setDeleteConfirm({ lista: selectedFresh })}
                    onCreateLavorazione={() => onCreateLavorazione(selectedFresh)}
                    onCreateEvent={() => onCreateEvent(selectedFresh)}
                    onClose={() => setSelected(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* MODAL CONFERMA ELIMINAZIONE */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/60 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Elimina Lista</h3>
                  <p className="text-sm text-slate-500">"{deleteConfirm.lista.title}"</p>
                </div>
              </div>

              {deleteConfirm.lista.lavorazione_id && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                    <Wrench className="w-4 h-4 flex-shrink-0" />
                    Questa lista ha una lavorazione associata
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Vuoi eliminare anche la lavorazione collegata?</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {deleteConfirm.lista.lavorazione_id && (
                  <button onClick={() => handleDelete(true)} disabled={deleting}
                    className="w-full py-2.5 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-all">
                    {deleting ? 'Eliminazione...' : 'Elimina lista e lavorazione'}
                  </button>
                )}
                <button onClick={() => handleDelete(false)} disabled={deleting}
                  className="w-full py-2.5 text-sm font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-all">
                  {deleting ? 'Eliminazione...' : deleteConfirm.lista.lavorazione_id ? 'Elimina solo la lista' : 'Elimina lista'}
                </button>
                <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                  className="w-full py-2.5 text-sm font-semibold rounded-xl hover:bg-slate-50 text-slate-600 border border-slate-200 transition-all">
                  Annulla
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}

// ── DetailPanel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  lista: ListaLavorazione
  client: Client | null | undefined
  lavorazione: Lavorazione | null | undefined
  onEdit: () => void
  onDelete: () => void
  onCreateLavorazione: () => void
  onCreateEvent: () => void
  onClose: () => void
}

function DetailPanel({ lista, client, lavorazione, onEdit, onDelete, onCreateLavorazione, onCreateEvent, onClose }: DetailPanelProps) {
  const cfg = STATUS_CFG[lista.status] || STATUS_CFG.bozza
  const StatusIcon = cfg.icon
  const totalItems = lista.items?.length ?? 0
  const totalCost = lista.items?.reduce((s, i) => s + (i.quantity * i.unit_price), 0) ?? 0

  return (
    <div className="flex flex-col h-full">
      {/* Header dettaglio */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 bg-white flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
              <StatusIcon className="w-3 h-3" />{cfg.label}
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">{lista.title}</h3>
          {lista.description && <p className="text-sm text-slate-500 mt-1">{lista.description}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all" title="Modifica">
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all" title="Elimina">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Azioni rapide */}
        <div className="flex gap-2 flex-wrap">
          {!lavorazione && (
            <button onClick={onCreateLavorazione}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700 transition-all">
              <Wrench className="w-3.5 h-3.5" /> Crea Lavorazione
            </button>
          )}
          {(lista.assigned_users?.length ?? 0) > 0 && (
            <button onClick={onCreateEvent}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition-all">
              <Calendar className="w-3.5 h-3.5" /> Crea Evento Calendario
            </button>
          )}
        </div>

        {/* Info base */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon={Building2} label="Cliente" value={client ? (client.company || client.name) : '—'} />
          <InfoCard icon={Wrench} label="Lavorazione"
            value={lavorazione ? lavorazione.title : 'Non associata'}
            sub={lavorazione ? (lavorazione.status === 'da_fare' ? 'Da fare' : lavorazione.status === 'in_corso' ? 'In corso' : lavorazione.status === 'completata' ? 'Completata' : lavorazione.status) : undefined}
          />
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
            <p className="text-2xl font-black text-slate-900">{totalItems}</p>
            <p className="text-[11px] text-slate-400 font-medium">Componenti</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
            <p className="text-2xl font-black text-slate-900">{lista.assigned_users?.length ?? 0}</p>
            <p className="text-[11px] text-slate-400 font-medium">Tecnici</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-3 text-center">
            <p className="text-lg font-black text-slate-900">€{totalCost.toFixed(0)}</p>
            <p className="text-[11px] text-slate-400 font-medium">Valore</p>
          </div>
        </div>

        {/* Utenti assegnati */}
        {(lista.assigned_users?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tecnici Assegnati</p>
            <div className="flex flex-wrap gap-2">
              {lista.assigned_users!.map(u => (
                <span key={u.id} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full">
                  <User className="w-3 h-3" />{u.user_name || u.user_id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Componenti */}
        {(lista.items?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Componenti ({lista.items!.length})</p>
            <div className="space-y-2">
              {lista.items!.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.product_name}</p>
                    <div className="flex gap-2 mt-0.5">
                      {item.product_sku && <span className="text-[11px] text-slate-400">{item.product_sku}</span>}
                      {item.product_category && <span className="text-[11px] text-slate-400">{item.product_category}</span>}
                    </div>
                    {item.notes && <p className="text-[11px] text-slate-400 mt-0.5 italic">{item.notes}</p>}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-800">{item.quantity} {item.unit}</p>
                    {item.unit_price > 0 && <p className="text-[11px] text-slate-400">€{item.unit_price.toFixed(2)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        {lista.notes && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Note</p>
            <div className="bg-white rounded-xl border border-slate-100 p-3">
              <p className="text-sm text-slate-600 leading-relaxed">{lista.notes}</p>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-300 text-center pb-2">
          Creata il {new Date(lista.created_at).toLocaleDateString('it-IT')}
        </p>
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm font-bold text-slate-800 leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}
