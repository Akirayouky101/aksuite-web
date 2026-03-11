'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Download, ZoomIn, ZoomOut, RotateCcw, Monitor, Server, Camera,
  HardDrive, Wifi, MapPin, Building2, ChevronDown
} from 'lucide-react'
import { InstallationFull, InstallationDevice, DeviceHdd, DeviceCredential, InstallationCamera } from '../hooks/useInstallations'
import { Client } from '../hooks/useClients'

type FullDevice = InstallationDevice & { hdds: DeviceHdd[]; credentials: DeviceCredential[] }

interface Props {
  isOpen: boolean
  onClose: () => void
  installation: InstallationFull | null
  clients: Client[]
}

// ─── Colori per tipo ─────────────────────────────────────────────────────────
const tipoStyle: Record<string, { header: string; border: string; dot: string; ring: string }> = {
  NVR:   { header: 'bg-blue-500',   border: 'border-blue-200',   dot: '#3b82f6', ring: 'ring-blue-200' },
  DVR:   { header: 'bg-violet-500', border: 'border-violet-200', dot: '#8b5cf6', ring: 'ring-violet-200' },
  XVR:   { header: 'bg-indigo-500', border: 'border-indigo-200', dot: '#6366f1', ring: 'ring-indigo-200' },
  HDCVI: { header: 'bg-cyan-500',   border: 'border-cyan-200',   dot: '#06b6d4', ring: 'ring-cyan-200' },
  Altro: { header: 'bg-slate-500',  border: 'border-slate-200',  dot: '#64748b', ring: 'ring-slate-200' },
}
const getStyle = (tipo: string) => tipoStyle[tipo] || tipoStyle['Altro']

// ─── Card registratore con dropdown inline ───────────────────────────────────
function DeviceCard({ dev }: { dev: FullDevice }) {
  const [open, setOpen] = useState(false)
  const s = getStyle(dev.tipo)
  const label = [dev.marca, dev.modello].filter(Boolean).join(' ') || dev.tipo
  const totalTb = dev.hdds.reduce((sum, h) => sum + Number(h.dimensione_tb), 0)

  return (
    <div className={`rounded-2xl border-2 ${s.border} bg-white shadow-lg w-48 select-none`}>
      {/* Header colorato */}
      <button
        className={`w-full ${s.header} rounded-t-[14px] px-3 py-2.5 flex items-center justify-between`}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-[11px] font-bold">{dev.tipo}</span>
          <span className="bg-white/25 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{dev.canali}ch</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Body sempre visibile */}
      <div className="px-3 py-2.5">
        <p className="text-[12px] font-bold text-slate-800 leading-snug truncate" title={label}>{label}</p>
        {dev.ip_principale && (
          <p className="text-[10px] font-mono text-blue-500 mt-0.5">{dev.ip_principale}</p>
        )}
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {totalTb > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded-md border border-amber-100">
              <HardDrive className="w-2.5 h-2.5" />{totalTb.toFixed(1)} TB
            </span>
          )}
          {(dev.uscite_hdmi > 0) && <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md">HDMI×{dev.uscite_hdmi}</span>}
          {(dev.uscite_vga > 0) && <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md">VGA×{dev.uscite_vga}</span>}
        </div>
      </div>

      {/* Dropdown dettagli */}
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
              {/* IP dettaglio */}
              {(dev.ip_principale || dev.ip_secondario) && (
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Wifi className="w-2.5 h-2.5" />Rete</p>
                  {dev.ip_principale && (
                    <div className="flex justify-between items-center bg-emerald-50 rounded-lg px-2 py-1">
                      <span className="text-[9px] text-emerald-600 font-semibold">Locale</span>
                      <span className="text-[9px] font-mono text-slate-700">{dev.ip_principale}{dev.porta_http ? `:${dev.porta_http}` : ''}</span>
                    </div>
                  )}
                  {dev.ip_secondario && (
                    <div className="flex justify-between items-center bg-blue-50 rounded-lg px-2 py-1">
                      <span className="text-[9px] text-blue-600 font-semibold">Esterno</span>
                      <span className="text-[9px] font-mono text-slate-700">{dev.ip_secondario}{dev.porta_rtsp ? `:${dev.porta_rtsp}` : ''}</span>
                    </div>
                  )}
                </div>
              )}

              {/* HDD */}
              {dev.hdds.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1"><HardDrive className="w-2.5 h-2.5" />Storage</p>
                  <div className="flex flex-wrap gap-1">
                    {dev.hdds.map(hdd => (
                      <span key={hdd.id} className="text-[9px] bg-amber-50 border border-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-md">
                        {hdd.dimensione_tb}TB{hdd.marca ? ` ${hdd.marca}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              {dev.note && <p className="text-[9px] text-slate-400 italic">{dev.note}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Card telecamera con dropdown inline ────────────────────────────────────
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

// ─── Costanti layout ─────────────────────────────────────────────────────────
const DEV_W = 192        // larghezza card registratore px
const CAM_W = 144        // larghezza card telecamera px
const CAM_H_BASE = 72    // altezza base card cam (senza dropdown)
const H_GAP_DEV = 80     // gap orizzontale tra colonne NVR
const CAM_H_GAP = 20     // gap verticale tra telecamere
const CAM_COL_GAP = 16   // gap orizzontale tra telecamere nella griglia
const PAD_X = 60
const PAD_Y = 50
const DEV_Y = PAD_Y
const WIRE_V = 50        // spazio verticale per i cavi tra NVR e cam

// ─── Calcolo layout ──────────────────────────────────────────────────────────
function buildLayout(inst: InstallationFull) {
  const camsByDev: Record<string, InstallationCamera[]> = {}
  for (const cam of inst.cameras) {
    const k = cam.device_id || '__none__'
    if (!camsByDev[k]) camsByDev[k] = []
    camsByDev[k].push(cam)
  }

  // Calcola colonne per ogni NVR
  interface DevCol {
    dev: FullDevice
    devX: number
    devY: number
    cams: InstallationCamera[]
    camCols: number
    camGridW: number
    colW: number
    camStartX: number
    camStartY: number
  }

  const cols: DevCol[] = []
  let curX = PAD_X

  for (const dev of inst.devices) {
    const cams = camsByDev[dev.id] || []
    const camCols = cams.length <= 3 ? cams.length || 1 : cams.length <= 8 ? 4 : 5
    const camGridW = camCols * CAM_W + (camCols - 1) * CAM_COL_GAP
    const colW = Math.max(DEV_W, camGridW)
    const centerX = curX + colW / 2
    const devX = centerX - DEV_W / 2
    cols.push({
      dev, devX, devY: DEV_Y,
      cams, camCols, camGridW, colW,
      camStartX: centerX - camGridW / 2,
      camStartY: DEV_Y + 120 + WIRE_V,  // 120 = altezza card NVR chiusa
    })
    curX += colW + H_GAP_DEV
  }

  // Unassigned cams: riga separata in fondo
  const unassigned = camsByDev['__none__'] || []

  const totalW = Math.max(curX - H_GAP_DEV + PAD_X, 500)

  return { cols, unassigned, totalW }
}

// ─── SVG frecce tra NVR e telecamere ────────────────────────────────────────
function Wires({ cols, devH }: {
  cols: Array<{ devX: number; devY: number; cams: InstallationCamera[]; camCols: number; camGridW: number; camStartX: number; camStartY: number; colW: number }>
  devH: number
}) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        <marker id="dot" markerWidth="6" markerHeight="6" refX="3" refY="3">
          <circle cx="3" cy="3" r="2.5" fill="#94a3b8" />
        </marker>
        <marker id="arrowblue" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M1,1 L7,4 L1,7 Z" fill="#3b82f6" opacity="0.6" />
        </marker>
      </defs>
      {cols.map((col, ci) => {
        if (col.cams.length === 0) return null
        const nvrBottomX = col.devX + DEV_W / 2
        const nvrBottomY = col.devY + devH

        return col.cams.map((cam, i) => {
          const camCol = i % col.camCols
          const camRow = Math.floor(i / col.camCols)
          const camCenterX = col.camStartX + camCol * (CAM_W + CAM_COL_GAP) + CAM_W / 2
          const camTopY = col.camStartY + camRow * (CAM_H_BASE + CAM_H_GAP)
          const midY = nvrBottomY + WIRE_V * 0.45

          return (
            <g key={`wire-${ci}-${i}`}>
              <path
                d={`M ${nvrBottomX} ${nvrBottomY} C ${nvrBottomX} ${midY}, ${camCenterX} ${midY}, ${camCenterX} ${camTopY}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.8"
                strokeDasharray="5,4"
                markerEnd="url(#arrowblue)"
                markerStart="url(#dot)"
              />
            </g>
          )
        })
      })}
    </svg>
  )
}

// ─── Componente principale ───────────────────────────────────────────────────
export default function InstallationSchemaModal({ isOpen, onClose, installation, clients }: Props) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 40, y: 30 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)           // valore zoom senza re-render durante scroll
  const animFrameRef = useRef<number | null>(null)

  // Reset quando si apre
  useEffect(() => {
    if (isOpen) { setZoom(1); zoomRef.current = 1; setPan({ x: 40, y: 30 }) }
  }, [isOpen])

  // Zoom smorzato tramite rAF — evita lo sbalzo "al volo"
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.06 : 0.06
    zoomRef.current = Math.min(3, Math.max(0.2, zoomRef.current + delta))
    if (animFrameRef.current) return
    animFrameRef.current = requestAnimationFrame(() => {
      setZoom(zoomRef.current)
      animFrameRef.current = null
    })
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    isDragging.current = true
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
  }
  const onMouseUp = () => { isDragging.current = false }

  const bumpZoom = (delta: number) => {
    const nz = Math.min(3, Math.max(0.2, zoom + delta))
    zoomRef.current = nz
    setZoom(nz)
  }
  const resetView = () => { const nz = 1; zoomRef.current = nz; setZoom(nz); setPan({ x: 40, y: 30 }) }

  const handleDownload = () => {
    if (!installation) return
    const { cols, unassigned, totalW } = buildLayout(installation)
    const devH = 120
    const maxCamRows = Math.max(...cols.map(c => Math.ceil(c.cams.length / c.camCols)), 0)
    const totalH = DEV_Y + devH + WIRE_V + maxCamRows * (CAM_H_BASE + CAM_H_GAP) + PAD_Y

    const wires = cols.flatMap((col, ci) =>
      col.cams.map((_, i) => {
        const cc = i % col.camCols; const cr = Math.floor(i / col.camCols)
        const cx2 = col.camStartX + cc * (CAM_W + CAM_COL_GAP) + CAM_W / 2
        const cy2 = col.camStartY + cr * (CAM_H_BASE + CAM_H_GAP)
        const bx = col.devX + DEV_W / 2; const by = col.devY + devH
        const midY = by + WIRE_V * 0.45
        return `<path d="M${bx},${by} C${bx},${midY} ${cx2},${midY} ${cx2},${cy2}" stroke="#94a3b8" stroke-width="1.8" stroke-dasharray="5,4" fill="none"/>`
      })
    ).join('\n')

    const devRects = cols.map(col => {
      const s = getStyle(col.dev.tipo)
      const lbl = [col.dev.marca, col.dev.modello].filter(Boolean).join(' ') || col.dev.tipo
      const totalTb = col.dev.hdds.reduce((sum, h) => sum + Number(h.dimensione_tb), 0)
      return `<rect x="${col.devX}" y="${col.devY}" width="${DEV_W}" height="${devH}" rx="12" fill="white" stroke="${s.dot}" stroke-width="1.5"/>
<rect x="${col.devX}" y="${col.devY}" width="${DEV_W}" height="32" rx="10" fill="${s.dot}"/>
<rect x="${col.devX}" y="${col.devY + 20}" width="${DEV_W}" height="12" fill="${s.dot}"/>
<text x="${col.devX + DEV_W / 2}" y="${col.devY + 20}" text-anchor="middle" font-size="11" font-weight="700" fill="white">${col.dev.tipo} · ${col.dev.canali}ch</text>
<text x="${col.devX + DEV_W / 2}" y="${col.devY + 50}" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">${lbl}</text>
<text x="${col.devX + DEV_W / 2}" y="${col.devY + 66}" text-anchor="middle" font-size="9" font-family="monospace" fill="#3b82f6">${col.dev.ip_principale}</text>
${totalTb > 0 ? `<rect x="${col.devX + DEV_W / 2 - 32}" y="${col.devY + 76}" width="64" height="14" rx="5" fill="#fef3c7"/><text x="${col.devX + DEV_W / 2}" y="${col.devY + 86}" text-anchor="middle" font-size="9" font-weight="600" fill="#92400e">HDD ${totalTb.toFixed(1)} TB</text>` : ''}`
    }).join('\n')

    const camRects = cols.flatMap(col =>
      col.cams.map((cam, i) => {
        const cc = i % col.camCols; const cr = Math.floor(i / col.camCols)
        const cx = col.camStartX + cc * (CAM_W + CAM_COL_GAP)
        const cy = col.camStartY + cr * (CAM_H_BASE + CAM_H_GAP)
        const lbl = cam.nome || cam.posizione || `CH${cam.canale ?? i + 1}`
        return `<rect x="${cx}" y="${cy}" width="${CAM_W}" height="60" rx="10" fill="white" stroke="#e2e8f0" stroke-width="1.5"/>
<text x="${cx + CAM_W / 2}" y="${cy + 20}" text-anchor="middle" font-size="10" font-weight="600" fill="#334155">${lbl}</text>
<text x="${cx + CAM_W / 2}" y="${cy + 34}" text-anchor="middle" font-size="9" fill="#64748b">${cam.mpx > 0 ? cam.mpx + 'MP' : ''} ${cam.canale ? 'CH' + cam.canale : ''}</text>
<text x="${cx + CAM_W / 2}" y="${cy + 48}" text-anchor="middle" font-size="8" font-family="monospace" fill="#64748b">${cam.ip || ''}</text>`
      })
    ).join('\n')

    const unassignedRects = unassigned.map((cam, i) => {
      const cx = PAD_X + i * (CAM_W + CAM_COL_GAP)
      const cy = totalH - PAD_Y - 60
      const lbl = cam.nome || cam.posizione || `CH${cam.canale ?? i + 1}`
      return `<rect x="${cx}" y="${cy}" width="${CAM_W}" height="60" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
<text x="${cx + CAM_W / 2}" y="${cy + 20}" text-anchor="middle" font-size="10" font-weight="600" fill="#94a3b8">${lbl} (non assegnata)</text>`
    }).join('\n')

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}">\n${wires}\n${devRects}\n${camRects}\n${unassignedRects}\n</svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `schema-${installation.nome.replace(/\s+/g, '-').toLowerCase()}.svg`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen || !installation) return null

  const clientObj = installation.client_id ? clients.find(c => c.id === installation.client_id) : null
  const { cols, unassigned, totalW } = buildLayout(installation)

  // Altezza stimata canvas (sufficiente per non clippare)
  const maxCamRows = cols.length > 0 ? Math.max(...cols.map(c => Math.ceil(c.cams.length / c.camCols))) : 0
  const totalH = DEV_Y + 200 + WIRE_V + maxCamRows * (CAM_H_BASE + CAM_H_GAP) + (unassigned.length > 0 ? 120 : 0) + PAD_Y

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.93 }}
          className="relative w-full max-w-6xl h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden"
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/60 bg-white/80 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Monitor className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Schema impianto</h2>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-600">{installation.nome}</span>
                  {clientObj && (<><span className="text-slate-300">·</span><span className="flex items-center gap-0.5"><Building2 className="w-2.5 h-2.5" />{clientObj.name}{clientObj.company ? ` — ${clientObj.company}` : ''}</span></>)}
                  {(installation.citta || installation.indirizzo) && (<><span className="text-slate-300">·</span><span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{[installation.indirizzo, installation.citta, installation.provincia].filter(Boolean).join(', ')}</span></>)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
                <button onClick={() => bumpZoom(-0.2)} title="Zoom out" className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors"><ZoomOut className="w-3.5 h-3.5 text-slate-500" /></button>
                <span className="text-[11px] font-bold text-slate-500 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                <button onClick={() => bumpZoom(0.2)} title="Zoom in" className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors"><ZoomIn className="w-3.5 h-3.5 text-slate-500" /></button>
                <button onClick={resetView} title="Reset" className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors"><RotateCcw className="w-3.5 h-3.5 text-slate-500" /></button>
              </div>
              <button onClick={handleDownload} className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 text-indigo-600 text-xs font-bold flex items-center gap-1 transition-colors">
                <Download className="w-3.5 h-3.5" />Esporta
              </button>
              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* ── Stats ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-5 px-5 py-2 bg-slate-50/60 border-b border-slate-100/80 flex-shrink-0 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold"><Server className="w-3.5 h-3.5 text-blue-500" />{installation.devices.length} registratore{installation.devices.length !== 1 ? 'i' : ''}</span>
            <span className="flex items-center gap-1.5 font-semibold"><Camera className="w-3.5 h-3.5 text-slate-400" />{installation.cameras.length} telecamera{installation.cameras.length !== 1 ? 'e' : ''}</span>
            {installation.devices.flatMap(d => d.hdds).length > 0 && (
              <span className="flex items-center gap-1.5 font-semibold"><HardDrive className="w-3.5 h-3.5 text-amber-500" />{installation.devices.flatMap(d => d.hdds).reduce((s, h) => s + Number(h.dimensione_tb), 0).toFixed(1)} TB</span>
            )}
            <span className="ml-auto text-[10px] text-slate-300 italic hidden sm:block">Trascina · Scroll per zoom · Clicca per dettagli</span>
          </div>

          {/* ── Canvas ─────────────────────────────────────────────────── */}
          <div
            className="flex-1 overflow-hidden relative select-none"
            style={{ background: 'radial-gradient(ellipse at 40% 30%, #f0f4ff 0%, #f1f5f9 60%, #e8edf5 100%)' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={handleWheel}
          >
            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none opacity-40"
              style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

            {/* Pan+zoom wrapper */}
            <div
              className="absolute"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'top left',
                width: totalW,
                height: totalH,
                cursor: isDragging.current ? 'grabbing' : 'grab',
              }}
            >
              {/* SVG frecce — sotto le card */}
              <Wires cols={cols} devH={120} />

              {/* Card registratori */}
              {cols.map((col, ci) => (
                <div key={`dev-${ci}`} className="absolute" style={{ left: col.devX, top: col.devY, width: DEV_W }}>
                  <DeviceCard dev={col.dev} />
                </div>
              ))}

              {/* Card telecamere */}
              {cols.map((col, ci) =>
                col.cams.map((cam, i) => {
                  const camCol = i % col.camCols
                  const camRow = Math.floor(i / col.camCols)
                  const camX = col.camStartX + camCol * (CAM_W + CAM_COL_GAP)
                  const camY = col.camStartY + camRow * (CAM_H_BASE + CAM_H_GAP)
                  return (
                    <div key={`cam-${ci}-${i}`} className="absolute" style={{ left: camX, top: camY, width: CAM_W }}>
                      <CameraCard cam={cam} />
                    </div>
                  )
                })
              )}

              {/* Telecamere non assegnate */}
              {unassigned.length > 0 && (
                <>
                  <div className="absolute text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    style={{ left: PAD_X, top: DEV_Y + 120 + WIRE_V + maxCamRows * (CAM_H_BASE + CAM_H_GAP) + 28 }}>
                    Telecamere non assegnate
                  </div>
                  {unassigned.map((cam, i) => {
                    const camX = PAD_X + i * (CAM_W + CAM_COL_GAP)
                    const camY = DEV_Y + 120 + WIRE_V + maxCamRows * (CAM_H_BASE + CAM_H_GAP) + 46
                    return (
                      <div key={`unassigned-${i}`} className="absolute opacity-60" style={{ left: camX, top: camY, width: CAM_W }}>
                        <CameraCard cam={cam} />
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>

          {/* ── Legenda ─────────────────────────────────────────────────── */}
          <div className="px-5 py-2.5 border-t border-slate-100/80 bg-white/60 flex items-center gap-5 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <div className="w-4 h-4 rounded bg-blue-500" /><span>Registratore</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <div className="w-4 h-4 rounded bg-white border-2 border-slate-200 flex items-center justify-center">
                <Camera className="w-2.5 h-2.5 text-blue-500" />
              </div><span>Telecamera</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <svg width="28" height="10"><path d="M2,5 C2,5 14,5 26,5" stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="5,4" fill="none" markerEnd="url(#ab)" /><defs><marker id="ab" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M1,1 L5,3 L1,5 Z" fill="#3b82f6" opacity="0.6"/></marker></defs></svg>
              <span>Collegamento</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
