'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, Trash2, Eye, EyeOff, Server, Camera, HardDrive, KeyRound, Search, ChevronDown, MapPin, Monitor, Copy } from 'lucide-react'
import {
  Installation, InstallationDevice, DeviceHdd, DeviceCredential, InstallationCamera, InstallationFull
} from '../hooks/useInstallations'
import { Client } from '../hooks/useClients'

interface InstallationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: InstallationFull) => Promise<void>
  installation?: InstallationFull | null
  clients: Client[]
}

const emptyDevice = (): Omit<InstallationDevice, 'id' | 'installation_id' | 'user_id' | 'created_at' | 'updated_at'> & { _tempId: string; hdds: TempHdd[]; credentials: TempCred[] } => ({
  _tempId: Math.random().toString(36).slice(2),
  tipo: 'NVR',
  marca: '',
  modello: '',
  canali: 4,
  ip_principale: '',
  ip_secondario: '',
  porta_http: null,
  porta_rtsp: null,
  uscite_hdmi: 1,
  uscite_vga: 1,
  uscite_displayport: 0,
  note: '',
  hdds: [],
  credentials: [{ _tempId: Math.random().toString(36).slice(2), ruolo: 'admin', username: 'admin', password: '', note: '' }],
})

const emptyCamera = (): TempCamera => ({
  _tempId: Math.random().toString(36).slice(2),
  device_tempId: '',
  nome: '',
  marca: '',
  modello: '',
  mpx: 2,
  ip: '',
  canale: null,
  username: 'admin',
  password: '',
  posizione: '',
  note: '',
})

interface TempHdd { _tempId: string; slot: number; dimensione_tb: number; marca: string; note: string }
interface TempCred { _tempId: string; ruolo: string; username: string; password: string; note: string }
interface TempCamera {
  _tempId: string; device_tempId: string; nome: string; marca: string; modello: string
  mpx: number; ip: string; canale: number | null; username: string; password: string; posizione: string; note: string
}
type TempDevice = ReturnType<typeof emptyDevice>

export default function InstallationModal({ isOpen, onClose, onSave, installation, clients }: InstallationModalProps) {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'devices' | 'cameras'>('info')

  // Info base
  const [nome, setNome] = useState('')
  const [clientId, setClientId] = useState<string>('')
  const [indirizzo, setIndirizzo] = useState('')
  const [citta, setCitta] = useState('')
  const [provincia, setProvincia] = useState('')
  const [note, setNote] = useState('')

  // Client search
  const [clientSearch, setClientSearch] = useState('')
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const clientRef = useRef<HTMLDivElement>(null)

  // Dispositivi
  const [devices, setDevices] = useState<TempDevice[]>([emptyDevice()])
  const [expandedDeviceIdx, setExpandedDeviceIdx] = useState<number>(0)

  // Telecamere
  const [cameras, setCameras] = useState<TempCamera[]>([])

  // Visibilità password
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!isOpen) return
    setActiveTab('info')
    setVisiblePasswords({})
    setClientSearch('')
    setClientDropdownOpen(false)
    if (installation) {
      setNome(installation.nome)
      setClientId(installation.client_id || '')
      setIndirizzo(installation.indirizzo)
      setCitta(installation.citta)
      setProvincia(installation.provincia)
      setNote(installation.note)
      setDevices(installation.devices.map(d => ({
        _tempId: d.id,
        tipo: d.tipo,
        marca: d.marca,
        modello: d.modello,
        canali: d.canali,
        ip_principale: d.ip_principale,
        ip_secondario: d.ip_secondario,
        porta_http: d.porta_http,
        porta_rtsp: d.porta_rtsp,
        uscite_hdmi: d.uscite_hdmi,
        uscite_vga: d.uscite_vga,
        uscite_displayport: d.uscite_displayport,
        note: d.note,
        hdds: d.hdds.map(h => ({ _tempId: h.id, slot: h.slot, dimensione_tb: h.dimensione_tb, marca: h.marca, note: h.note })),
        credentials: d.credentials.map(c => ({ _tempId: c.id, ruolo: c.ruolo, username: c.username, password: c.password, note: c.note })),
      })))
      setCameras(installation.cameras.map(c => ({
        _tempId: c.id,
        device_tempId: c.device_id || '',
        nome: c.nome,
        marca: c.marca,
        modello: c.modello,
        mpx: c.mpx,
        ip: c.ip,
        canale: c.canale,
        username: c.username,
        password: c.password,
        posizione: c.posizione,
        note: c.note,
      })))
      setExpandedDeviceIdx(0)
    } else {
      setNome(''); setClientId(''); setIndirizzo(''); setCitta(''); setProvincia(''); setNote('')
      setDevices([emptyDevice()])
      setCameras([])
      setExpandedDeviceIdx(0)
    }
  }, [isOpen, installation])

  // Click outside client dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (clientRef.current && !clientRef.current.contains(e.target as Node)) setClientDropdownOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.company?.toLowerCase().includes(clientSearch.toLowerCase())
  )
  const selectedClient = clients.find(c => c.id === clientId)

  // ─── Device helpers ───
  const updateDevice = (idx: number, field: keyof TempDevice, value: unknown) => {
    setDevices(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d))
  }
  const addDevice = () => {
    const nd = emptyDevice()
    setDevices(prev => [...prev, nd])
    setExpandedDeviceIdx(devices.length)
  }
  const removeDevice = (idx: number) => {
    setDevices(prev => prev.filter((_, i) => i !== idx))
    setExpandedDeviceIdx(Math.max(0, expandedDeviceIdx - 1))
  }

  // HDD helpers
  const addHdd = (devIdx: number) => {
    setDevices(prev => prev.map((d, i) => i !== devIdx ? d : {
      ...d, hdds: [...d.hdds, { _tempId: Math.random().toString(36).slice(2), slot: d.hdds.length + 1, dimensione_tb: 1, marca: '', note: '' }]
    }))
  }
  const updateHdd = (devIdx: number, hddIdx: number, field: keyof TempHdd, value: unknown) => {
    setDevices(prev => prev.map((d, i) => i !== devIdx ? d : {
      ...d, hdds: d.hdds.map((h, j) => j !== hddIdx ? h : { ...h, [field]: value })
    }))
  }
  const removeHdd = (devIdx: number, hddIdx: number) => {
    setDevices(prev => prev.map((d, i) => i !== devIdx ? d : { ...d, hdds: d.hdds.filter((_, j) => j !== hddIdx) }))
  }

  // Credential helpers
  const addCredential = (devIdx: number) => {
    setDevices(prev => prev.map((d, i) => i !== devIdx ? d : {
      ...d, credentials: [...d.credentials, { _tempId: Math.random().toString(36).slice(2), ruolo: 'guest', username: '', password: '', note: '' }]
    }))
  }
  const updateCredential = (devIdx: number, credIdx: number, field: keyof TempCred, value: string) => {
    setDevices(prev => prev.map((d, i) => i !== devIdx ? d : {
      ...d, credentials: d.credentials.map((c, j) => j !== credIdx ? c : { ...c, [field]: value })
    }))
  }
  const removeCredential = (devIdx: number, credIdx: number) => {
    setDevices(prev => prev.map((d, i) => i !== devIdx ? d : { ...d, credentials: d.credentials.filter((_, j) => j !== credIdx) }))
  }

  // Camera helpers
  const addCamera = () => setCameras(prev => [...prev, emptyCamera()])
  const updateCamera = (idx: number, field: keyof TempCamera, value: unknown) => {
    setCameras(prev => prev.map((c, i) => i !== idx ? c : { ...c, [field]: value }))
  }
  const removeCamera = (idx: number) => setCameras(prev => prev.filter((_, i) => i !== idx))

  // IP +1 sull'ultimo ottetto
  const incrementIp = (ip: string): string => {
    if (!ip || !ip.trim()) return ip
    const parts = ip.split('.')
    if (parts.length !== 4) return ip
    const last = parseInt(parts[3], 10)
    if (isNaN(last)) return ip
    parts[3] = String(last + 1)
    return parts.join('.')
  }

  const duplicateDevice = (idx: number) => {
    const src = devices[idx]
    const nd: TempDevice = {
      ...src,
      _tempId: Math.random().toString(36).slice(2),
      ip_principale: incrementIp(src.ip_principale),
      ip_secondario: incrementIp(src.ip_secondario),
      hdds: src.hdds.map(h => ({ ...h, _tempId: Math.random().toString(36).slice(2) })),
      credentials: src.credentials.map(c => ({ ...c, _tempId: Math.random().toString(36).slice(2) })),
    }
    setDevices(prev => [...prev.slice(0, idx + 1), nd, ...prev.slice(idx + 1)])
    setExpandedDeviceIdx(idx + 1)
  }

  const duplicateCamera = (idx: number) => {
    const src = cameras[idx]
    const nc: TempCamera = {
      ...src,
      _tempId: Math.random().toString(36).slice(2),
      ip: incrementIp(src.ip),
      canale: src.canale !== null ? src.canale + 1 : null,
    }
    setCameras(prev => [...prev.slice(0, idx + 1), nc, ...prev.slice(idx + 1)])
  }

  const togglePassword = (key: string) => setVisiblePasswords(prev => ({ ...prev, [key]: !prev[key] }))

  const handleSave = async () => {
    if (!nome.trim()) { alert('Il nome impianto è obbligatorio'); return }
    setSaving(true)
    try {
      const data: InstallationFull = {
        id: installation?.id || '',
        user_id: installation?.user_id || '',
        client_id: clientId || null,
        nome: nome.trim(),
        indirizzo: indirizzo.trim(),
        citta: citta.trim(),
        provincia: provincia.trim(),
        note: note.trim(),
        created_at: installation?.created_at || '',
        updated_at: new Date().toISOString(),
        devices: devices.map(d => ({
          id: d._tempId,
          installation_id: installation?.id || '',
          user_id: installation?.user_id || '',
          tipo: d.tipo,
          marca: d.marca,
          modello: d.modello,
          canali: d.canali,
          ip_principale: d.ip_principale,
          ip_secondario: d.ip_secondario,
          porta_http: d.porta_http,
          porta_rtsp: d.porta_rtsp,
          uscite_hdmi: d.uscite_hdmi,
          uscite_vga: d.uscite_vga,
          uscite_displayport: d.uscite_displayport,
          note: d.note,
          created_at: '',
          updated_at: '',
          hdds: d.hdds.map(h => ({ id: h._tempId, device_id: d._tempId, user_id: '', slot: h.slot, dimensione_tb: h.dimensione_tb, marca: h.marca, note: h.note, created_at: '' })),
          credentials: d.credentials.map(c => ({ id: c._tempId, device_id: d._tempId, user_id: '', ruolo: c.ruolo, username: c.username, password: c.password, note: c.note, created_at: '' })),
        })),
        cameras: cameras.map(c => ({
          id: c._tempId,
          installation_id: installation?.id || '',
          device_id: c.device_tempId || null,
          user_id: '',
          nome: c.nome,
          marca: c.marca,
          modello: c.modello,
          mpx: c.mpx,
          ip: c.ip,
          canale: c.canale,
          username: c.username,
          password: c.password,
          posizione: c.posizione,
          note: c.note,
          created_at: '',
          updated_at: '',
        }))
      }
      await onSave(data)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
  const labelCls = 'block text-xs font-semibold text-slate-500 mb-1'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-3xl w-full my-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{installation ? 'Modifica Impianto' : 'Nuovo Impianto'}</h2>
                  <p className="text-xs text-slate-400">Videosorveglianza</p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200/60 flex-shrink-0 px-5">
              {(['info', 'devices', 'cameras'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                  {tab === 'info' && <><MapPin className="w-3 h-3" />Luogo</>}
                  {tab === 'devices' && <><Server className="w-3 h-3" />Registratori <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px]">{devices.length}</span></>}
                  {tab === 'cameras' && <><Camera className="w-3 h-3" />Telecamere <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px]">{cameras.length}</span></>}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* ─── TAB INFO ─── */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Nome Impianto *</label>
                    <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Es. Ufficio Rossi, Negozio Via Roma..." className={inputCls} />
                  </div>

                  {/* Cliente searchable */}
                  <div>
                    <label className={labelCls}>Cliente</label>
                    <div ref={clientRef} className="relative">
                      <button type="button" onClick={() => setClientDropdownOpen(o => !o)}
                        className={`w-full px-3 py-2 rounded-xl bg-white/80 border border-slate-200/60 text-sm text-left flex items-center justify-between transition-all ${clientDropdownOpen ? 'ring-2 ring-blue-500/30' : ''}`}>
                        <span className={selectedClient ? 'text-slate-700' : 'text-slate-300'}>
                          {selectedClient ? `${selectedClient.name}${selectedClient.company ? ` — ${selectedClient.company}` : ''}` : 'Nessun cliente'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      </button>
                      {clientDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-slate-200/60 shadow-xl overflow-hidden">
                          <div className="p-2 border-b border-slate-100">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300" />
                              <input autoFocus value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                                placeholder="Cerca cliente..." className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-100 focus:outline-none" />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            <button className="w-full px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 text-left" onClick={() => { setClientId(''); setClientDropdownOpen(false) }}>— Nessun cliente</button>
                            {filteredClients.map(c => (
                              <button key={c.id} onClick={() => { setClientId(c.id); setClientDropdownOpen(false); setClientSearch('') }}
                                className={`w-full px-3 py-2 text-xs text-left hover:bg-blue-50 transition-colors ${clientId === c.id ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'}`}>
                                {c.name}{c.company ? <span className="text-slate-400 ml-1">— {c.company}</span> : ''}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Indirizzo</label>
                    <input value={indirizzo} onChange={e => setIndirizzo(e.target.value)} placeholder="Via Roma 1" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Città</label>
                      <input value={citta} onChange={e => setCitta(e.target.value)} placeholder="Milano" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Provincia</label>
                      <input value={provincia} onChange={e => setProvincia(e.target.value)} placeholder="MI" maxLength={2} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Note</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Note generali sull'impianto..." className={inputCls + ' resize-none'} />
                  </div>
                </div>
              )}

              {/* ─── TAB DEVICES ─── */}
              {activeTab === 'devices' && (
                <div className="space-y-3">
                  {devices.map((dev, devIdx) => (
                    <div key={dev._tempId} className="border border-slate-200/60 rounded-xl overflow-hidden">
                      {/* Device header */}
                      <button className="w-full px-4 py-3 flex items-center gap-3 bg-slate-50/80 hover:bg-slate-100/60 transition-colors text-left"
                        onClick={() => setExpandedDeviceIdx(expandedDeviceIdx === devIdx ? -1 : devIdx)}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Server className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">
                            {dev.tipo}{dev.marca ? ` • ${dev.marca}` : ''}{dev.modello ? ` ${dev.modello}` : ''}
                            {!dev.marca && !dev.modello ? ' — Nuovo registratore' : ''}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {dev.canali} ch{dev.ip_principale ? ` • ${dev.ip_principale}` : ''} • {dev.hdds.length} HDD • {dev.credentials.length} account
                          </p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${expandedDeviceIdx === devIdx ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedDeviceIdx === devIdx && (
                        <div className="p-4 space-y-4 bg-white">
                          {/* Tipo + marca + modello */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className={labelCls}>Tipo</label>
                              <select value={dev.tipo} onChange={e => updateDevice(devIdx, 'tipo', e.target.value as InstallationDevice['tipo'])}
                                className={inputCls}>
                                {['NVR', 'DVR', 'XVR', 'HDCVI', 'Altro'].map(t => <option key={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Marca</label>
                              <input value={dev.marca} onChange={e => updateDevice(devIdx, 'marca', e.target.value)} placeholder="Dahua, Hikvision..." className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Modello</label>
                              <input value={dev.modello} onChange={e => updateDevice(devIdx, 'modello', e.target.value)} placeholder="NVR4108..." className={inputCls} />
                            </div>
                          </div>

                          {/* Canali */}
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className={labelCls}>Canali</label>
                              <input type="number" value={dev.canali} onChange={e => updateDevice(devIdx, 'canali', Number(e.target.value))} min={1} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>HDMI</label>
                              <input type="number" value={dev.uscite_hdmi} onChange={e => updateDevice(devIdx, 'uscite_hdmi', Number(e.target.value))} min={0} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>VGA</label>
                              <input type="number" value={dev.uscite_vga} onChange={e => updateDevice(devIdx, 'uscite_vga', Number(e.target.value))} min={0} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>DisplayPort</label>
                              <input type="number" value={dev.uscite_displayport} onChange={e => updateDevice(devIdx, 'uscite_displayport', Number(e.target.value))} min={0} className={inputCls} />
                            </div>
                          </div>

                          {/* IP */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>IP Principale</label>
                              <input value={dev.ip_principale} onChange={e => updateDevice(devIdx, 'ip_principale', e.target.value)} placeholder="192.168.1.100" className={inputCls + ' font-mono'} />
                            </div>
                            <div>
                              <label className={labelCls}>IP Secondario / Esterno</label>
                              <input value={dev.ip_secondario} onChange={e => updateDevice(devIdx, 'ip_secondario', e.target.value)} placeholder="212.10.x.x o DDNS" className={inputCls + ' font-mono'} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Porta HTTP</label>
                              <input type="number" value={dev.porta_http ?? ''} onChange={e => updateDevice(devIdx, 'porta_http', e.target.value ? Number(e.target.value) : null)} placeholder="80" className={inputCls + ' font-mono'} />
                            </div>
                            <div>
                              <label className={labelCls}>Porta RTSP</label>
                              <input type="number" value={dev.porta_rtsp ?? ''} onChange={e => updateDevice(devIdx, 'porta_rtsp', e.target.value ? Number(e.target.value) : null)} placeholder="554" className={inputCls + ' font-mono'} />
                            </div>
                          </div>

                          {/* HDD */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><HardDrive className="w-3 h-3" />Hard Disk ({dev.hdds.length})</p>
                              <button onClick={() => addHdd(devIdx)} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 text-xs flex items-center gap-1 transition-colors">
                                <Plus className="w-3 h-3" />Aggiungi HDD
                              </button>
                            </div>
                            {dev.hdds.length === 0 && <p className="text-xs text-slate-300 italic">Nessun HDD configurato</p>}
                            <div className="space-y-2">
                              {dev.hdds.map((hdd, hddIdx) => (
                                <div key={hdd._tempId} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                  <span className="text-[10px] text-slate-400 w-10 flex-shrink-0">Slot {hddIdx + 1}</span>
                                  <input type="number" value={hdd.dimensione_tb} onChange={e => updateHdd(devIdx, hddIdx, 'dimensione_tb', Number(e.target.value))} step="0.5" min={0.5}
                                    className="w-16 px-2 py-1 rounded-lg bg-white border border-slate-200/60 text-xs font-mono" />
                                  <span className="text-[10px] text-slate-400">TB</span>
                                  <input value={hdd.marca} onChange={e => updateHdd(devIdx, hddIdx, 'marca', e.target.value)} placeholder="WD, Seagate..." className="flex-1 px-2 py-1 rounded-lg bg-white border border-slate-200/60 text-xs" />
                                  <button onClick={() => removeHdd(devIdx, hddIdx)} className="p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Credenziali */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><KeyRound className="w-3 h-3" />Account ({dev.credentials.length})</p>
                              <button onClick={() => addCredential(devIdx)} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 text-xs flex items-center gap-1 transition-colors">
                                <Plus className="w-3 h-3" />Aggiungi Account
                              </button>
                            </div>
                            <div className="space-y-2">
                              {dev.credentials.map((cred, credIdx) => (
                                <div key={cred._tempId} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-semibold">Ruolo</label>
                                      <input value={cred.ruolo} onChange={e => updateCredential(devIdx, credIdx, 'ruolo', e.target.value)} placeholder="admin, guest..." className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200/60 text-xs" />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-semibold">Username</label>
                                      <input value={cred.username} onChange={e => updateCredential(devIdx, credIdx, 'username', e.target.value)} placeholder="admin" className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200/60 text-xs font-mono" />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-400 font-semibold">Password</label>
                                      <div className="relative">
                                        <input type={visiblePasswords[`dev-${dev._tempId}-cred-${credIdx}`] ? 'text' : 'password'}
                                          value={cred.password} onChange={e => updateCredential(devIdx, credIdx, 'password', e.target.value)}
                                          placeholder="••••••" className="w-full px-2 py-1.5 pr-7 rounded-lg bg-white border border-slate-200/60 text-xs font-mono" />
                                        <button type="button" onClick={() => togglePassword(`dev-${dev._tempId}-cred-${credIdx}`)}
                                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                          {visiblePasswords[`dev-${dev._tempId}-cred-${credIdx}`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  {dev.credentials.length > 1 && (
                                    <div className="flex justify-end">
                                      <button onClick={() => removeCredential(devIdx, credIdx)} className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1">
                                        <Trash2 className="w-3 h-3" />Rimuovi account
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Note dispositivo */}
                          <div>
                            <label className={labelCls}>Note dispositivo</label>
                            <textarea value={dev.note} onChange={e => updateDevice(devIdx, 'note', e.target.value)} rows={2} placeholder="Note tecniche..." className={inputCls + ' resize-none'} />
                          </div>

                          {/* Rimuovi / Duplica dispositivo */}
                          <div className="flex justify-end gap-2 pt-1">
                            <button onClick={() => duplicateDevice(devIdx)} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-colors">
                              <Copy className="w-3 h-3" />Duplica registratore
                            </button>
                            {devices.length > 1 && (
                              <button onClick={() => removeDevice(devIdx)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold flex items-center gap-1 transition-colors">
                                <Trash2 className="w-3 h-3" />Rimuovi registratore
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button onClick={addDevice} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 text-slate-400 hover:text-blue-500 text-sm font-bold transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />Aggiungi Registratore
                  </button>
                </div>
              )}

              {/* ─── TAB CAMERAS ─── */}
              {activeTab === 'cameras' && (
                <div className="space-y-3">
                  {cameras.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Camera className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nessuna telecamera configurata</p>
                    </div>
                  )}
                  {cameras.map((cam, camIdx) => (
                    <div key={cam._tempId} className="p-4 rounded-xl border border-slate-200/60 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                            <Camera className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-xs font-bold text-slate-600">Telecamera {camIdx + 1}{cam.nome ? ` — ${cam.nome}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => duplicateCamera(camIdx)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-400 transition-colors" title="Duplica telecamera">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeCamera(camIdx)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors" title="Rimuovi telecamera">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className={labelCls}>Nome / Posizione</label>
                          <input value={cam.nome} onChange={e => updateCamera(camIdx, 'nome', e.target.value)} placeholder="Ingresso, Parcheggio..." className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Marca</label>
                          <input value={cam.marca} onChange={e => updateCamera(camIdx, 'marca', e.target.value)} placeholder="Dahua..." className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Modello</label>
                          <input value={cam.modello} onChange={e => updateCamera(camIdx, 'modello', e.target.value)} placeholder="IPC-HFW..." className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>MPX</label>
                          <input type="number" value={cam.mpx} onChange={e => updateCamera(camIdx, 'mpx', Number(e.target.value))} min={0.5} step={0.5} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>IP</label>
                          <input value={cam.ip} onChange={e => updateCamera(camIdx, 'ip', e.target.value)} placeholder="192.168.1.x" className={inputCls + ' font-mono'} />
                        </div>
                        <div>
                          <label className={labelCls}>Canale NVR</label>
                          <input type="number" value={cam.canale ?? ''} onChange={e => updateCamera(camIdx, 'canale', e.target.value ? Number(e.target.value) : null)} placeholder="1" min={1} className={inputCls} />
                        </div>
                      </div>

                      {/* Login telecamera */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Username</label>
                          <input value={cam.username} onChange={e => updateCamera(camIdx, 'username', e.target.value)} placeholder="admin" className={inputCls + ' font-mono'} />
                        </div>
                        <div>
                          <label className={labelCls}>Password</label>
                          <div className="relative">
                            <input type={visiblePasswords[`cam-${cam._tempId}`] ? 'text' : 'password'}
                              value={cam.password} onChange={e => updateCamera(camIdx, 'password', e.target.value)}
                              placeholder="••••••" className={inputCls + ' pr-9 font-mono'} />
                            <button type="button" onClick={() => togglePassword(`cam-${cam._tempId}`)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                              {visiblePasswords[`cam-${cam._tempId}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Registratore assegnato */}
                      {devices.length > 0 && (
                        <div>
                          <label className={labelCls}>Registratore associato</label>
                          <select value={cam.device_tempId} onChange={e => updateCamera(camIdx, 'device_tempId', e.target.value)} className={inputCls}>
                            <option value="">— Nessuno</option>
                            {devices.map((d, di) => (
                              <option key={d._tempId} value={d._tempId}>
                                {d.tipo}{d.marca ? ` ${d.marca}` : ''}{d.modello ? ` ${d.modello}` : ` #${di + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className={labelCls}>Note</label>
                        <input value={cam.note} onChange={e => updateCamera(camIdx, 'note', e.target.value)} placeholder="Note telecamera..." className={inputCls} />
                      </div>
                    </div>
                  ))}

                  <button onClick={addCamera} className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 text-slate-400 hover:text-blue-500 text-sm font-bold transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />Aggiungi Telecamera
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200/60 flex-shrink-0 bg-slate-50/30">
              <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-bold transition-all">
                Annulla
              </button>
              <button onClick={handleSave} disabled={saving || !nome.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saving ? 'Salvataggio...' : 'Salva Impianto'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
