'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Globe, Plus, Trash2, Eye, EyeOff, Copy, Check, ExternalLink, Edit2, Save } from 'lucide-react'

interface ExternalSite {
  id: string
  name: string
  url: string
  username: string
  password: string
}

interface ExternalSitesModalProps {
  isOpen: boolean
  onClose: () => void
}

const DEFAULT_SITES: ExternalSite[] = [
  { id: '1', name: 'Sacchi Corporate', url: 'https://corporate.sacchi.it/', username: '', password: '' },
  { id: '2', name: 'IDG01', url: 'https://www.idg01.com/', username: '', password: '' },
]

const STORAGE_KEY = 'aksuite_external_sites'

function loadSites(): ExternalSite[] {
  if (typeof window === 'undefined') return DEFAULT_SITES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_SITES
}

function saveSites(sites: ExternalSite[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sites)) } catch {}
}

export default function ExternalSitesModal({ isOpen, onClose }: ExternalSitesModalProps) {
  const [sites, setSites] = useState<ExternalSite[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ExternalSite | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [iframeError, setIframeError] = useState<Record<string, boolean>>({})
  const [addingNew, setAddingNew] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', url: '', username: '', password: '' })

  useEffect(() => {
    setSites(loadSites())
  }, [isOpen])

  if (!isOpen) return null

  const selectedSite = sites.find(s => s.id === selectedId)

  const handleSaveSite = (updated: ExternalSite) => {
    const next = sites.map(s => s.id === updated.id ? updated : s)
    setSites(next)
    saveSites(next)
    setEditingId(null)
    setEditForm(null)
  }

  const handleDeleteSite = (id: string) => {
    if (!confirm('Eliminare questo portale?')) return
    const next = sites.filter(s => s.id !== id)
    setSites(next)
    saveSites(next)
    if (selectedId === id) setSelectedId(null)
  }

  const handleAddSite = () => {
    if (!newForm.name.trim() || !newForm.url.trim()) return
    const site: ExternalSite = { id: Date.now().toString(), ...newForm }
    const next = [...sites, site]
    setSites(next)
    saveSites(next)
    setAddingNew(false)
    setNewForm({ name: '', url: '', username: '', password: '' })
    setSelectedId(site.id)
  }

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1500)
    } catch {}
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-white border border-slate-200/60 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/30'
  const labelCls = 'text-xs font-bold text-slate-500 mb-1'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onClick={e => e.stopPropagation()} className="relative w-full max-w-5xl h-[90vh] flex flex-col">
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl flex flex-col h-full border border-slate-200/60 shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Portali Fornitori</h2>
                  <p className="text-xs text-slate-400">Accesso rapido ai siti esterni</p>
                </div>
              </div>
              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Sidebar */}
              <div className="w-64 flex-shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/50">
                <div className="p-3 flex flex-col gap-1 flex-1 overflow-y-auto">
                  {sites.map(site => (
                    <button key={site.id}
                      onClick={() => { setSelectedId(site.id); setEditingId(null); setIframeError({}) }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 group ${selectedId === site.id ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                      <Globe className={`w-4 h-4 flex-shrink-0 ${selectedId === site.id ? 'text-white/80' : 'text-slate-400'}`} />
                      <span className="truncate flex-1">{site.name}</span>
                    </button>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-200/60">
                  <button onClick={() => setAddingNew(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white border border-dashed border-slate-300 text-slate-500 text-xs font-bold hover:border-indigo-400 hover:text-indigo-500 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Aggiungi sito
                  </button>
                </div>
              </div>

              {/* Main area */}
              <div className="flex-1 flex flex-col min-w-0">
                {!selectedSite && !addingNew && (
                  <div className="flex-1 flex items-center justify-center text-slate-300 flex-col gap-3">
                    <Globe className="w-12 h-12" />
                    <p className="text-sm font-medium">Seleziona un portale dalla lista</p>
                  </div>
                )}

                {/* Add new form */}
                {addingNew && (
                  <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                    <h3 className="text-sm font-bold text-slate-700">Nuovo Portale</h3>
                    <div>
                      <label className={labelCls}>Nome</label>
                      <input value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})} placeholder="es. Sacchi, RS Components..." className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>URL</label>
                      <input value={newForm.url} onChange={e => setNewForm({...newForm, url: e.target.value})} placeholder="https://..." className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Username / Email</label>
                      <input value={newForm.username} onChange={e => setNewForm({...newForm, username: e.target.value})} placeholder="Username..." className={inputCls} autoComplete="off" />
                    </div>
                    <div>
                      <label className={labelCls}>Password</label>
                      <input value={newForm.password} onChange={e => setNewForm({...newForm, password: e.target.value})} type="password" placeholder="Password..." className={inputCls} autoComplete="new-password" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleAddSite} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-all">
                        <Save className="w-3.5 h-3.5" /> Salva
                      </button>
                      <button onClick={() => setAddingNew(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-all">Annulla</button>
                    </div>
                  </div>
                )}

                {/* Selected site */}
                {selectedSite && !addingNew && (
                  <div className="flex flex-col h-full">
                    {/* Site toolbar */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
                      <h3 className="text-sm font-bold text-slate-700 flex-1 truncate">{selectedSite.name}</h3>
                      <a href={selectedSite.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold transition-all">
                        <ExternalLink className="w-3.5 h-3.5" /> Apri in nuova scheda
                      </a>
                      <button onClick={() => { setEditingId(selectedSite.id); setEditForm({...selectedSite}) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all">
                        <Edit2 className="w-3.5 h-3.5" /> Modifica
                      </button>
                      <button onClick={() => handleDeleteSite(selectedSite.id)} title="Elimina portale"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Edit form */}
                    {editingId === selectedSite.id && editForm && (
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelCls}>Nome</label>
                            <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Nome sito" className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>URL</label>
                            <input value={editForm.url} onChange={e => setEditForm({...editForm, url: e.target.value})} placeholder="https://..." className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Username</label>
                            <input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className={inputCls} autoComplete="off" />
                          </div>
                          <div>
                            <label className={labelCls}>Password</label>
                            <input value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} type="password" className={inputCls} autoComplete="new-password" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveSite(editForm)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all">
                            <Save className="w-3 h-3" /> Salva
                          </button>
                          <button onClick={() => { setEditingId(null); setEditForm(null) }} className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold transition-all">Annulla</button>
                        </div>
                      </div>
                    )}

                    {/* Credentials bar */}
                    {(selectedSite.username || selectedSite.password) && (
                      <div className="px-4 py-2 border-b border-slate-100 bg-amber-50/50 flex items-center gap-4 flex-shrink-0">
                        <span className="text-xs font-bold text-amber-700">Credenziali:</span>
                        {selectedSite.username && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500">User:</span>
                            <span className="text-xs font-mono font-bold text-slate-700">{selectedSite.username}</span>
                            <button onClick={() => copyToClipboard(selectedSite.username, 'user_' + selectedSite.id)}
                              className="w-5 h-5 rounded flex items-center justify-center hover:bg-amber-100 transition-all">
                              {copied === 'user_' + selectedSite.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-amber-500" />}
                            </button>
                          </div>
                        )}
                        {selectedSite.password && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500">Pass:</span>
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {showPasswords[selectedSite.id] ? selectedSite.password : '••••••••'}
                            </span>
                            <button onClick={() => setShowPasswords(p => ({...p, [selectedSite.id]: !p[selectedSite.id]}))}
                              className="w-5 h-5 rounded flex items-center justify-center hover:bg-amber-100 transition-all">
                              {showPasswords[selectedSite.id] ? <EyeOff className="w-3 h-3 text-amber-500" /> : <Eye className="w-3 h-3 text-amber-500" />}
                            </button>
                            <button onClick={() => copyToClipboard(selectedSite.password, 'pass_' + selectedSite.id)}
                              className="w-5 h-5 rounded flex items-center justify-center hover:bg-amber-100 transition-all">
                              {copied === 'pass_' + selectedSite.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-amber-500" />}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Iframe area */}
                    <div className="flex-1 relative min-h-0">
                      {iframeError[selectedSite.id] ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center h-full">
                          <Globe className="w-12 h-12 text-slate-200" />
                          <div>
                            <p className="text-sm font-bold text-slate-600 mb-1">Il sito blocca l'incorporamento</p>
                            <p className="text-xs text-slate-400 mb-4">Alcuni portali B2B non permettono di essere aperti all'interno di altre applicazioni per motivi di sicurezza.</p>
                            <a href={selectedSite.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-all shadow-md shadow-indigo-500/25">
                              <ExternalLink className="w-4 h-4" /> Apri {selectedSite.name} in una nuova scheda
                            </a>
                          </div>
                        </div>
                      ) : (
                        <iframe
                          key={selectedSite.id}
                          src={selectedSite.url}
                          title={selectedSite.name}
                          className="w-full h-full border-0"
                          onError={() => setIframeError(e => ({...e, [selectedSite.id]: true}))}
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
