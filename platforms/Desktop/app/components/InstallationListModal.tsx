'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Monitor, Search, Plus, Pencil, Trash2, ChevronDown, ChevronUp, MapPin, Server, Camera, HardDrive, KeyRound, Eye, EyeOff, Wifi, Building2, Network } from 'lucide-react'
import { Installation, InstallationFull } from '../hooks/useInstallations'
import { Client } from '../hooks/useClients'

interface InstallationListModalProps {
  isOpen: boolean
  onClose: () => void
  installations: Installation[]
  clients: Client[]
  onAdd: () => void
  onEdit: (installation: InstallationFull) => void
  onDelete: (id: string) => void
  onLoadFull: (id: string) => Promise<InstallationFull | null>
  onSchema: (installation: InstallationFull) => void
}

export default function InstallationListModal({
  isOpen, onClose, installations, clients, onAdd, onEdit, onDelete, onLoadFull, onSchema
}: InstallationListModalProps) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadedData, setLoadedData] = useState<Record<string, InstallationFull>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  if (!isOpen) return null

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null
    const c = clients.find(c => c.id === clientId)
    return c ? `${c.name}${c.company ? ` — ${c.company}` : ''}` : null
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return installations
    return installations.filter(i =>
      i.nome.toLowerCase().includes(q) ||
      i.indirizzo.toLowerCase().includes(q) ||
      i.citta.toLowerCase().includes(q) ||
      getClientName(i.client_id)?.toLowerCase().includes(q)
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, installations, clients])

  const handleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!loadedData[id]) {
      setLoadingId(id)
      const full = await onLoadFull(id)
      if (full) setLoadedData(prev => ({ ...prev, [id]: full }))
      setLoadingId(null)
    }
  }

  const togglePassword = (key: string) => setVisiblePasswords(prev => ({ ...prev, [key]: !prev[key] }))

  const tipoColors: Record<string, string> = {
    NVR: 'bg-blue-100 text-blue-700',
    DVR: 'bg-violet-100 text-violet-700',
    XVR: 'bg-indigo-100 text-indigo-700',
    HDCVI: 'bg-cyan-100 text-cyan-700',
    Altro: 'bg-slate-100 text-slate-600',
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[55] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onClick={e => e.stopPropagation()} className="relative max-w-4xl w-full my-8">
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Impianti</h2>
                  <p className="text-xs text-slate-400">{installations.length} impianto{installations.length !== 1 ? 'i' : ''} configurato{installations.length !== 1 ? 'i' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onAdd} className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200/60 text-blue-600 text-xs font-bold transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" />Nuovo
                </button>
                <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-slate-100/80 bg-slate-50/30 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cerca per nome, indirizzo, città, cliente..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">🏠</div>
                  <p className="text-slate-400 text-lg">{search ? 'Nessun impianto trovato' : 'Nessun impianto configurato'}</p>
                  {!search && <button onClick={onAdd} className="mt-4 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-bold">Aggiungi impianto</button>}
                </div>
              )}

              {filtered.map(inst => {
                const isExpanded = expandedId === inst.id
                const full = loadedData[inst.id]
                const clientName = getClientName(inst.client_id)

                return (
                  <div key={inst.id} className="bg-white/80 rounded-xl border border-slate-200/40 overflow-hidden hover:shadow-md transition-all">
                    {/* Row */}
                    <button onClick={() => handleExpand(inst.id)} className="w-full px-4 py-3.5 text-left flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/20">
                        <Monitor className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-800">{inst.nome}</h3>
                          {clientName && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold flex items-center gap-0.5">
                              <Building2 className="w-2.5 h-2.5" />{clientName}
                            </span>
                          )}
                        </div>
                        {(inst.indirizzo || inst.citta) && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {[inst.indirizzo, inst.citta, inst.provincia].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button onClick={e => { e.stopPropagation(); if (confirm(`Eliminare impianto "${inst.nome}"?`)) onDelete(inst.id) }}
                          title="Elimina" className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                      </div>
                    </button>

                    {/* Expanded */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 border-t border-slate-100/60 space-y-4 pt-3">

                            {loadingId === inst.id && (
                              <div className="text-center py-4 text-slate-400 text-sm">Caricamento dati...</div>
                            )}

                            {full && (
                              <>
                                {/* Note impianto */}
                                {full.note && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 italic">{full.note}</p>}

                                {/* Pulsanti azioni */}
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => onSchema(full)} className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1 transition-colors border border-slate-200/60">
                                    <Network className="w-3 h-3" />Schema impianto
                                  </button>
                                  <button onClick={() => onEdit(full)} className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center gap-1 transition-colors">
                                    <Pencil className="w-3 h-3" />Modifica impianto
                                  </button>
                                </div>

                                {/* Dispositivi */}
                                {full.devices.length > 0 && (
                                  <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><Server className="w-3 h-3" />Registratori ({full.devices.length})</p>
                                    {full.devices.map(dev => (
                                      <div key={dev.id} className="rounded-xl border border-slate-200/60 overflow-hidden">
                                        {/* Device header */}
                                        <div className="px-3 py-2.5 bg-slate-50/80 flex items-center gap-2 flex-wrap">
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tipoColors[dev.tipo] || tipoColors['Altro']}`}>{dev.tipo}</span>
                                          <span className="text-xs font-bold text-slate-700">{dev.marca} {dev.modello}</span>
                                          <span className="text-[10px] text-slate-400">{dev.canali} canali</span>
                                          <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-400">
                                            {dev.uscite_hdmi > 0 && <span>HDMI×{dev.uscite_hdmi}</span>}
                                            {dev.uscite_vga > 0 && <span>VGA×{dev.uscite_vga}</span>}
                                            {dev.uscite_displayport > 0 && <span>DP×{dev.uscite_displayport}</span>}
                                          </div>
                                        </div>

                                        <div className="p-3 space-y-3">
                                          {/* IP */}
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {dev.ip_principale && (
                                              <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                                                <Wifi className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                                <div>
                                                  <p className="text-[9px] text-emerald-500 font-semibold uppercase">IP Locale</p>
                                                  <p className="text-xs font-mono font-bold text-slate-700">{dev.ip_principale}{dev.porta_http ? `:${dev.porta_http}` : ''}</p>
                                                </div>
                                              </div>
                                            )}
                                            {dev.ip_secondario && (
                                              <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                                                <Wifi className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                                <div>
                                                  <p className="text-[9px] text-blue-500 font-semibold uppercase">IP Esterno / DDNS</p>
                                                  <p className="text-xs font-mono font-bold text-slate-700">{dev.ip_secondario}{dev.porta_rtsp ? ` (RTSP: ${dev.porta_rtsp})` : ''}</p>
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {/* Credenziali */}
                                          {dev.credentials.length > 0 && (
                                            <div>
                                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1.5"><KeyRound className="w-3 h-3" />Account</p>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {dev.credentials.map(cred => (
                                                  <div key={cred.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-bold uppercase flex-shrink-0">{cred.ruolo}</span>
                                                    <span className="text-xs font-mono text-slate-700 flex-shrink-0">{cred.username}</span>
                                                    <span className="text-slate-300 flex-shrink-0">•</span>
                                                    <span className="text-xs font-mono text-slate-500 flex-1 truncate">
                                                      {visiblePasswords[`detail-cred-${cred.id}`] ? cred.password : '••••••••'}
                                                    </span>
                                                    <button type="button" title={visiblePasswords[`detail-cred-${cred.id}`] ? 'Nascondi' : 'Mostra'} onClick={() => togglePassword(`detail-cred-${cred.id}`)}
                                                      className="text-slate-300 hover:text-slate-500 flex-shrink-0">
                                                      {visiblePasswords[`detail-cred-${cred.id}`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    </button>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* HDD */}
                                          {dev.hdds.length > 0 && (
                                            <div>
                                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1.5"><HardDrive className="w-3 h-3" />Hard Disk</p>
                                              <div className="flex flex-wrap gap-2">
                                                {dev.hdds.map(hdd => (
                                                  <div key={hdd.id} className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                                                    <HardDrive className="w-3 h-3 text-amber-500" />
                                                    <span className="text-xs font-bold text-slate-700">{hdd.dimensione_tb} TB</span>
                                                    {hdd.marca && <span className="text-[10px] text-slate-400">{hdd.marca}</span>}
                                                  </div>
                                                ))}
                                              </div>
                                              <p className="text-[10px] text-slate-400 mt-1">
                                                Totale: <strong className="text-slate-600">{dev.hdds.reduce((s, h) => s + Number(h.dimensione_tb), 0).toFixed(1)} TB</strong>
                                              </p>
                                            </div>
                                          )}

                                          {dev.note && <p className="text-[10px] text-slate-400 italic">{dev.note}</p>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Telecamere */}
                                {full.cameras.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><Camera className="w-3 h-3" />Telecamere ({full.cameras.length})</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {full.cameras.map(cam => (
                                        <div key={cam.id} className="rounded-xl border border-slate-200/60 bg-white p-3 space-y-2">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center flex-shrink-0">
                                                <Camera className="w-3 h-3 text-white" />
                                              </div>
                                              <div>
                                                <p className="text-xs font-bold text-slate-700">{cam.nome || `Cam ${cam.canale || ''}`}</p>
                                                <p className="text-[10px] text-slate-400">{cam.marca} {cam.modello}</p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                              {cam.mpx > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold">{cam.mpx}MP</span>}
                                              {cam.canale && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">CH{cam.canale}</span>}
                                            </div>
                                          </div>
                                          {cam.ip && (
                                            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 py-1">
                                              <Wifi className="w-3 h-3 text-slate-400" />
                                              <span className="text-[10px] font-mono text-slate-600">{cam.ip}</span>
                                            </div>
                                          )}
                                          {(cam.username || cam.password) && (
                                            <div className="flex items-center gap-2">
                                              <KeyRound className="w-3 h-3 text-slate-300 flex-shrink-0" />
                                              <span className="text-[10px] font-mono text-slate-500">{cam.username}</span>
                                              {cam.password && <>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-[10px] font-mono text-slate-400 flex-1">
                                                  {visiblePasswords[`detail-cam-${cam.id}`] ? cam.password : '••••••••'}
                                                </span>
                                                <button type="button" title={visiblePasswords[`detail-cam-${cam.id}`] ? 'Nascondi' : 'Mostra'} onClick={() => togglePassword(`detail-cam-${cam.id}`)}
                                                  className="text-slate-300 hover:text-slate-500">
                                                  {visiblePasswords[`detail-cam-${cam.id}`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                </button>
                                              </>}
                                            </div>
                                          )}
                                          {cam.posizione && <p className="text-[10px] text-slate-400 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{cam.posizione}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
