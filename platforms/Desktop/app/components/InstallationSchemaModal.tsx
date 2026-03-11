'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Download, ZoomIn, ZoomOut, RotateCcw, Monitor, Server, Camera,
  HardDrive, Wifi, MapPin, Building2, ChevronDown, Network
} from 'lucide-react'
import {
  InstallationFull, InstallationDevice, DeviceHdd, DeviceCredential,
  InstallationCamera, buildDeviceTree, DeviceTreeNode
} from '../hooks/useInstallations'
import { Client } from '../hooks/useClients'

type FullDevice = InstallationDevice & { hdds: DeviceHdd[]; credentials: DeviceCredential[] }

interface Props {
  isOpen: boolean
  onClose: () => void
  installation: InstallationFull | null
  clients: Client[]
}

// ─── Stili per tipo ──────────────────────────────────────────────────────────
const tipoStyle: Record<string, { header: string; border: string; dot: string }> = {
  NVR:    { header: 'bg-blue-500',    border: 'border-blue-200',    dot: '#3b82f6' },
  DVR:    { header: 'bg-violet-500',  border: 'border-violet-200',  dot: '#8b5cf6' },
  XVR:    { header: 'bg-indigo-500',  border: 'border-indigo-200',  dot: '#6366f1' },
  HDCVI:  { header: 'bg-cyan-500',    border: 'border-cyan-200',    dot: '#06b6d4' },
  Switch: { header: 'bg-emerald-500', border: 'border-emerald-200', dot: '#10b981' },
  Altro:  { header: 'bg-slate-500',   border: 'border-slate-200',   dot: '#64748b' },
}
const getStyle = (tipo: string) => tipoStyle[tipo] ?? tipoStyle['Altro']

// ─── Card registratore / switch ──────────────────────────────────────────────
function DeviceCard({ dev }: { dev: FullDevice }) {
  const [open, setOpen] = useState(false)
  const s = getStyle(dev.tipo)
  const label = [dev.marca, dev.modello].filter(Boolean).join(' ') || dev.tipo
  const totalTb = dev.hdds.reduce((sum, h) => sum + Number(h.dimensione_tb), 0)
  const isSwitch = dev.tipo === 'Switch'

  return (
    <div className={`rounded-2xl border-2 ${s.border} bg-white shadow-lg select-none`}
      style={{ width: isSwitch ? 160 : 192 }}>
      <button
        className={`w-full ${s.header} rounded-t-[14px] px-3 py-2.5 flex items-center justify-between`}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-1.5">
          {isSwitch
            ? <Network className="w-3.5 h-3.5 text-white" />
            : <Server className="w-3.5 h-3.5 text-white" />}
          <span className="text-white text-[11px] font-bold">{dev.tipo}</span>
          {!isSwitch && <span className="bg-white/25 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{dev.canali}ch</span>}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className="px-3 py-2.5">
        <p className="text-[12px] font-bold text-slate-800 leading-snug truncate" title={label}>{label}</p>
        {dev.ip_principale && (
          <p className="text-[10px] font-mono text-blue-500 mt-0.5">{dev.ip_principale}</p>
        )}
        {!isSwitch && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {totalTb > 0 && (
              <span className="flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded-md border border-amber-100">
                <HardDrive className="w-2.5 h-2.5" />{totalTb.toFixed(1)} TB
              </span>
            )}
            {dev.uscite_hdmi > 0 && <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md">HDMI×{dev.uscite_hdmi}</span>}
            {dev.uscite_vga > 0 && <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md">VGA×{dev.uscite_vga}</span>}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="px-3 py-2.5 space-y-2 bg-slate-50/60 rounded-b-2xl">
              {(dev.ip_principale || dev.ip_secondario) && (
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5" />Rete
                  </p>
                  {dev.ip_principale && (
                    <div className="flex justify-between items-center bg-emerald-50 rounded-lg px-2 py-1">
                      <span className="text-[9px] text-emerald-600 font-semibold">Locale</span>
                      <span className="text-[9px] font-mono text-slate-700">
                        {dev.ip_principale}{dev.porta_http ? `:${dev.porta_http}` : ''}
                      </span>
                    </div>
                  )}
                  {dev.ip_secondario && (
                    <div className="flex justify-between items-center bg-blue-50 rounded-lg px-2 py-1">
                      <span className="text-[9px] text-blue-600 font-semibold">Esterno</span>
                      <span className="text-[9px] font-mono text-slate-700">
                        {dev.ip_secondario}{dev.porta_rtsp ? `:${dev.porta_rtsp}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {dev.hdds.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                    <HardDrive className="w-2.5 h-2.5" />Storage
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {dev.hdds.map(hdd => (
                      <span key={hdd.id} className="text-[9px] bg-amber-50 border border-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-md">
                        {hdd.dimensione_tb}TB{hdd.marca ? ` ${hdd.marca}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {dev.note && <p className="text-[9px] text-slate-400 italic">{dev.note}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Card telecamera ─────────────────────────────────────────────────────────
function CameraCard({ cam }: { cam: InstallationCamera }) {
  const [open, setOpen] = useState(false)
  const label = cam.nome || cam.posizione || `CH ${cam.canale ?? '?'}`

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white shadow-md w-36 select-none">
      <button
        className="w-full px-2.5 pt-2.5 pb-2 flex items-center justify-between gap-1"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Camera className="w-3 h-3 text-blue-500" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 truncate leading-snug" title={label}>{label}</span>
        </div>
        <ChevronDown className={`w-3 h-3 text-slate-300 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className="flex items-center gap-1 px-2.5 pb-2 flex-wrap">
        {cam.mpx > 0 && <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md border border-emerald-100">{cam.mpx}MP</span>}
        {cam.canale && <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded-md border border-blue-100">CH{cam.canale}</span>}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="px-2.5 py-2 space-y-1.5 bg-slate-50/60 rounded-b-xl">
              {(cam.marca || cam.modello) && (
                <p className="text-[9px] font-bold text-slate-600">{[cam.marca, cam.modello].filter(Boolean).join(' ')}</p>
              )}
              {cam.ip && (
                <div className="flex justify-between items-center bg-emerald-50 rounded-lg px-2 py-1">
                  <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5"><Wifi className="w-2.5 h-2.5" />IP</span>
                  <span className="text-[9px] font-mono text-slate-700">{cam.ip}</span>
                </div>
              )}
              {cam.posizione && cam.posizione !== cam.nome && (
                <div className="flex items-center gap-1 text-[9px] text-slate-500">
                  <MapPin className="w-2.5 h-2.5 text-slate-400" />{cam.posizione}
                </div>
              )}
              {cam.note && <p className="text-[9px] text-slate-400 italic">{cam.note}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Connettore verticale con freccia ────────────────────────────────────────
function Connector({ height = 28 }: { height?: number }) {
  return (
    <div className="flex flex-col items-center pointer-events-none" style={{ gap: 0 }}>
      <div className="w-px bg-slate-300" style={{ height }} />
      <svg width="12" height="8" viewBox="0 0 12 8">
        <path d="M6,0 L0,8 L12,8 Z" fill="#94a3b8" opacity="0.7" />
      </svg>
    </div>
  )
}

// ─── Nodo albero ricorsivo ────────────────────────────────────────────────────
function TreeNode({ node, depth = 0 }: { node: DeviceTreeNode; depth?: number }) {
  const hasChildren = node.children.length > 0 || node.cameras.length > 0
  const camCols = node.cameras.length <= 3 ? (node.cameras.length || 1) : node.cameras.length <= 8 ? 4 : 5
  const camRows: InstallationCamera[][] = []
  for (let i = 0; i < node.cameras.length; i += camCols) {
    camRows.push(node.cameras.slice(i, i + camCols))
  }

  return (
    <div className="flex flex-col items-center" style={{ gap: 0 }}>
      {/* Card del dispositivo */}
      <DeviceCard dev={node.device} />

      {hasChildren && (
        <>
          {/* Connettore verticale */}
          <Connector height={24} />

          {/* Figli: telecamere dirette + nodi figli affiancati */}
          <div className="flex items-start gap-6 flex-wrap justify-center">
            {/* Telecamere direttamente collegate a questo nodo */}
            {camRows.length > 0 && (
              <div className="flex flex-col items-center gap-0">
                <div className="flex flex-col gap-3 items-center">
                  {camRows.map((row, ri) => (
                    <div key={ri} className="flex gap-3">
                      {row.map((cam, ci) => (
                        <CameraCard key={cam.id ?? `${ri}-${ci}`} cam={cam} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nodi figli (Switch, NVR secondari, ecc.) — ricorsione */}
            {node.children.map(child => (
              <div key={child.device.id} className="flex flex-col items-center" style={{ gap: 0 }}>
                {/* Piccolo ramo verticale discendente (separatore visivo prima del figlio) */}
                <div className="w-px bg-slate-300" style={{ height: 8 }} />
                <TreeNode node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Componente principale ───────────────────────────────────────────────────
export default function InstallationSchemaModal({ isOpen, onClose, installation, clients }: Props) {
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollOrigin = useRef({ scrollLeft: 0, scrollTop: 0 })

  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      zoomRef.current = 1
      if (scrollRef.current) { scrollRef.current.scrollLeft = 0; scrollRef.current.scrollTop = 0 }
    }
  }, [isOpen])

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    scrollOrigin.current = {
      scrollLeft: scrollRef.current?.scrollLeft ?? 0,
      scrollTop: scrollRef.current?.scrollTop ?? 0,
    }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    scrollRef.current.scrollLeft = scrollOrigin.current.scrollLeft - (e.clientX - dragStart.current.x)
    scrollRef.current.scrollTop  = scrollOrigin.current.scrollTop  - (e.clientY - dragStart.current.y)
  }
  const onMouseUp = () => { isDragging.current = false }

  const bumpZoom = (delta: number) => {
    const nz = Math.min(3, Math.max(0.2, zoom + delta))
    zoomRef.current = nz
    setZoom(nz)
  }
  const resetView = () => {
    zoomRef.current = 1; setZoom(1)
    if (scrollRef.current) { scrollRef.current.scrollLeft = 0; scrollRef.current.scrollTop = 0 }
  }

  const handleDownload = () => {
    if (!installation) return
    // Export SVG semplificato (flat export, non gerarchico — per semplicità)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 100">
      <rect width="800" height="100" fill="white"/>
      <text x="400" y="60" text-anchor="middle" font-size="14" font-weight="600" fill="#334155">${installation.nome} — ${installation.devices.length} dispositivi · ${installation.cameras.length} telecamere</text>
    </svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `schema-${installation.nome.replace(/\s+/g, '-').toLowerCase()}.svg`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen || !installation) return null

  const clientObj = installation.client_id ? clients.find(c => c.id === installation.client_id) : null

  // Costruisce albero gerarchico
  const tree = buildDeviceTree(installation.devices, installation.cameras)

  // Telecamere non assegnate ad alcun dispositivo
  const unassigned = installation.cameras.filter(c => !c.device_id)

  const totalTb = installation.devices.flatMap(d => d.hdds).reduce((s, h) => s + Number(h.dimensione_tb), 0)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.93 }}
          className="relative w-full max-w-6xl h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden"
        >
          {/* ── Header ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/60 bg-white/80 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Monitor className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Schema impianto</h2>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-600">{installation.nome}</span>
                  {clientObj && (
                    <><span className="text-slate-300">·</span>
                    <span className="flex items-center gap-0.5">
                      <Building2 className="w-2.5 h-2.5" />
                      {clientObj.name}{clientObj.company ? ` — ${clientObj.company}` : ''}
                    </span></>
                  )}
                  {(installation.citta || installation.indirizzo) && (
                    <><span className="text-slate-300">·</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {[installation.indirizzo, installation.citta, installation.provincia].filter(Boolean).join(', ')}
                    </span></>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
                <button onClick={() => bumpZoom(-0.2)} title="Zoom out" className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors">
                  <ZoomOut className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <span className="text-[11px] font-bold text-slate-500 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                <button onClick={() => bumpZoom(0.2)} title="Zoom in" className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors">
                  <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button onClick={resetView} title="Reset" className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
              <button onClick={handleDownload} className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 text-indigo-600 text-xs font-bold flex items-center gap-1 transition-colors">
                <Download className="w-3.5 h-3.5" />Esporta
              </button>
              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* ── Stats ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-5 px-5 py-2 bg-slate-50/60 border-b border-slate-100/80 flex-shrink-0 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold">
              <Server className="w-3.5 h-3.5 text-blue-500" />
              {installation.devices.length} dispositivo{installation.devices.length !== 1 ? 'i' : ''}
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              {installation.cameras.length} telecamera{installation.cameras.length !== 1 ? 'e' : ''}
            </span>
            {totalTb > 0 && (
              <span className="flex items-center gap-1.5 font-semibold">
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />{totalTb.toFixed(1)} TB
              </span>
            )}
            <span className="ml-auto text-[10px] text-slate-300 italic hidden sm:block">
              Trascina per muovere · + / − per zoom · Clicca per dettagli
            </span>
          </div>

          {/* ── Canvas ───────────────────────────────────────────────── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-auto relative select-none"
            style={{ background: 'radial-gradient(ellipse at 40% 30%, #f0f4ff 0%, #f1f5f9 60%, #e8edf5 100%)' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {/* Dot grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />

            {/* Contenuto zoomabile */}
            <div
              className="flex flex-col items-center min-h-full py-10 px-8 gap-12"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                cursor: isDragging.current ? 'grabbing' : 'grab',
              }}
            >
              {/* Albero dispositivi: radici affiancate in riga */}
              {tree.length === 0 ? (
                <div className="flex flex-col items-center gap-3 text-slate-300 py-20">
                  <Server className="w-12 h-12 opacity-30" />
                  <p className="text-sm font-semibold">Nessun dispositivo configurato</p>
                </div>
              ) : (
                <div className="flex items-start gap-12 flex-wrap justify-center">
                  {tree.map(node => (
                    <TreeNode key={node.device.id} node={node} />
                  ))}
                </div>
              )}

              {/* Telecamere non assegnate */}
              {unassigned.length > 0 && (
                <div className="flex flex-col items-center gap-3 pt-4 border-t border-dashed border-slate-300/60 w-full">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Telecamere non assegnate
                  </p>
                  <div className="flex gap-3 flex-wrap justify-center opacity-60">
                    {unassigned.map((cam, i) => (
                      <CameraCard key={cam.id ?? i} cam={cam} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Legenda ──────────────────────────────────────────────── */}
          <div className="px-5 py-2.5 border-t border-slate-100/80 bg-white/60 flex items-center gap-5 flex-shrink-0 flex-wrap">
            {['NVR', 'DVR', 'XVR', 'Switch'].map(tipo => {
              const s = getStyle(tipo)
              return (
                <div key={tipo} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <div className={`w-4 h-4 rounded ${s.header}`} />
                  <span>{tipo}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <div className="w-4 h-4 rounded bg-white border-2 border-slate-200 flex items-center justify-center">
                <Camera className="w-2.5 h-2.5 text-blue-500" />
              </div>
              <span>Telecamera</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
