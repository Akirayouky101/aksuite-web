'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Download, ZoomIn, ZoomOut, RotateCcw, Monitor, Server, Camera,
  HardDrive, Wifi, MapPin, KeyRound, Eye, EyeOff, Building2, ChevronDown
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

// ─── Colori per tipo registratore ───────────────────────────────────────────
const tipoColor: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  NVR:   { bg: 'bg-blue-500',   text: 'text-blue-500',   border: 'border-blue-300',   dot: '#3b82f6' },
  DVR:   { bg: 'bg-violet-500', text: 'text-violet-500', border: 'border-violet-300', dot: '#8b5cf6' },
  XVR:   { bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-300', dot: '#6366f1' },
  HDCVI: { bg: 'bg-cyan-500',   text: 'text-cyan-500',   border: 'border-cyan-300',   dot: '#06b6d4' },
  Altro: { bg: 'bg-slate-500',  text: 'text-slate-500',  border: 'border-slate-300',  dot: '#64748b' },
}
const getTipoColor = (tipo: string) => tipoColor[tipo] || tipoColor['Altro']

// ─── Popup dettaglio registratore ───────────────────────────────────────────
function DeviceDetailPopup({ dev, onClose }: { dev: FullDevice; onClose: () => void }) {
  const [visiblePwd, setVisiblePwd] = useState<Record<string, boolean>>({})
  const tc = getTipoColor(dev.tipo)
  const totalTb = dev.hdds.reduce((s, h) => s + Number(h.dimensione_tb), 0)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      className="absolute z-30 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden"
      style={{ top: '110%', left: '50%', transform: 'translateX(-50%)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className={`${tc.bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm">{dev.tipo}</span>
          <span className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{dev.canali} canali</span>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Dispositivo</p>
          <p className="text-sm font-bold text-slate-800">{[dev.marca, dev.modello].filter(Boolean).join(' ') || '—'}</p>
        </div>

        {(dev.ip_principale || dev.ip_secondario) && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide flex items-center gap-1"><Wifi className="w-3 h-3" />Rete</p>
            {dev.ip_principale && (
              <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-1.5">
                <span className="text-[10px] text-emerald-600 font-semibold">IP Locale</span>
                <span className="font-mono text-xs text-slate-700">{dev.ip_principale}{dev.porta_http ? `:${dev.porta_http}` : ''}</span>
              </div>
            )}
            {dev.ip_secondario && (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-1.5">
                <span className="text-[10px] text-blue-600 font-semibold">IP Esterno</span>
                <span className="font-mono text-xs text-slate-700">{dev.ip_secondario}{dev.porta_rtsp ? ` (RTSP: ${dev.porta_rtsp})` : ''}</span>
              </div>
            )}
          </div>
        )}

        {(dev.uscite_hdmi > 0 || dev.uscite_vga > 0 || dev.uscite_displayport > 0) && (
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Uscite video</p>
            <div className="flex gap-2 flex-wrap">
              {dev.uscite_hdmi > 0 && <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold">HDMI ×{dev.uscite_hdmi}</span>}
              {dev.uscite_vga > 0 && <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold">VGA ×{dev.uscite_vga}</span>}
              {dev.uscite_displayport > 0 && <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold">DP ×{dev.uscite_displayport}</span>}
            </div>
          </div>
        )}

        {dev.hdds.length > 0 && (
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <HardDrive className="w-3 h-3" />Storage — {totalTb.toFixed(1)} TB totali
            </p>
            <div className="flex flex-wrap gap-1.5">
              {dev.hdds.map(hdd => (
                <div key={hdd.id} className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                  <HardDrive className="w-2.5 h-2.5 text-amber-500" />
                  <span className="text-[10px] font-bold text-slate-700">{hdd.dimensione_tb} TB</span>
                  {hdd.marca && <span className="text-[10px] text-slate-400">{hdd.marca}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {dev.credentials.length > 0 && (
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5">
              <KeyRound className="w-3 h-3" />Accesso
            </p>
            <div className="space-y-1.5">
              {dev.credentials.map(cred => (
                <div key={cred.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                  <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded uppercase">{cred.ruolo}</span>
                  <span className="text-[11px] font-mono text-slate-700">{cred.username}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] font-mono text-slate-500 flex-1">{visiblePwd[cred.id] ? cred.password : '••••••'}</span>
                  <button onClick={() => setVisiblePwd(p => ({ ...p, [cred.id]: !p[cred.id] }))} className="text-slate-300 hover:text-slate-500">
                    {visiblePwd[cred.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {dev.note && <p className="text-[10px] text-slate-400 italic bg-slate-50 rounded-lg p-2">{dev.note}</p>}
      </div>
    </motion.div>
  )
}

// ─── Popup dettaglio telecamera ──────────────────────────────────────────────
function CameraDetailPopup({ cam, onClose }: { cam: InstallationCamera; onClose: () => void }) {
  const [visiblePwd, setVisiblePwd] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      className="absolute z-30 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden"
      style={{ top: '110%', left: '50%', transform: 'translateX(-50%)' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-white" />
          <span className="text-white font-bold text-sm truncate max-w-[150px]">{cam.nome || cam.posizione || `CH ${cam.canale ?? '—'}`}</span>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {cam.mpx > 0 && <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">{cam.mpx} Megapixel</span>}
          {cam.canale && <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100">Canale {cam.canale}</span>}
        </div>

        {(cam.marca || cam.modello) && (
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Modello</p>
            <p className="text-sm font-bold text-slate-800">{[cam.marca, cam.modello].filter(Boolean).join(' ')}</p>
          </div>
        )}

        {cam.posizione && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-600">{cam.posizione}</span>
          </div>
        )}

        {cam.ip && (
          <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-1.5">
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"><Wifi className="w-3 h-3" />IP</span>
            <span className="font-mono text-xs text-slate-700">{cam.ip}</span>
          </div>
        )}

        {(cam.username || cam.password) && (
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide flex items-center gap-1 mb-1.5"><KeyRound className="w-3 h-3" />Accesso</p>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
              <span className="text-[11px] font-mono text-slate-700">{cam.username}</span>
              {cam.password && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] font-mono text-slate-500 flex-1">{visiblePwd ? cam.password : '••••••'}</span>
                  <button onClick={() => setVisiblePwd(v => !v)} className="text-slate-300 hover:text-slate-500">
                    {visiblePwd ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {cam.note && <p className="text-[10px] text-slate-400 italic bg-slate-50 rounded-lg p-2">{cam.note}</p>}
      </div>
    </motion.div>
  )
}

// ─── Costanti layout ─────────────────────────────────────────────────────────
const DEV_W = 180
const DEV_H = 110
const CAM_W = 140
const CAM_H = 72
const H_GAP = 60
const V_GAP_DEV_CAM = 56
const V_GAP_CAM = 18
const PAD = 60

interface LayoutNode { x: number; y: number; w: number; h: number }
interface DevLayoutNode extends LayoutNode { dev: FullDevice; ports: { x: number; y: number }[] }
interface CamLayoutNode extends LayoutNode { cam: InstallationCamera; devIdx: number }

function buildLayout(inst: InstallationFull) {
  const camsByDev: Record<string, InstallationCamera[]> = {}
  for (const cam of inst.cameras) {
    const k = cam.device_id || '__none__'
    if (!camsByDev[k]) camsByDev[k] = []
    camsByDev[k].push(cam)
  }

  const devNodes: DevLayoutNode[] = []
  const camNodes: CamLayoutNode[] = []
  let curX = PAD

  for (let di = 0; di < inst.devices.length; di++) {
    const dev = inst.devices[di]
    const devCams = camsByDev[dev.id] || []
    const camCols = devCams.length <= 2 ? (devCams.length || 1) : devCams.length <= 6 ? 3 : 4
    const camGridW = camCols * CAM_W + (camCols - 1) * V_GAP_CAM
    const colW = Math.max(DEV_W, camGridW)
    const centerX = curX + colW / 2

    const devX = centerX - DEV_W / 2
    const devY = PAD
    devNodes.push({ dev, x: devX, y: devY, w: DEV_W, h: DEV_H, ports: [] })

    const camStartY = devY + DEV_H + V_GAP_DEV_CAM
    for (let ci = 0; ci < devCams.length; ci++) {
      const col = ci % camCols
      const row = Math.floor(ci / camCols)
      const camX = centerX - camGridW / 2 + col * (CAM_W + V_GAP_CAM)
      const camY = camStartY + row * (CAM_H + V_GAP_CAM)
      const portX = devX + DEV_W * (0.2 + 0.6 * (ci / Math.max(devCams.length - 1, 1)))
      devNodes[di].ports.push({ x: portX, y: devY + DEV_H })
      camNodes.push({ cam: devCams[ci], devIdx: di, x: camX, y: camY, w: CAM_W, h: CAM_H })
    }
    curX += colW + H_GAP
  }

  const unassigned = camsByDev['__none__'] || []
  if (unassigned.length > 0) {
    const maxY = camNodes.length > 0 ? Math.max(...camNodes.map(n => n.y + n.h)) : PAD + DEV_H
    const unY = maxY + V_GAP_DEV_CAM
    for (let ci = 0; ci < unassigned.length; ci++) {
      camNodes.push({ cam: unassigned[ci], devIdx: -1, x: PAD + ci * (CAM_W + V_GAP_CAM), y: unY, w: CAM_W, h: CAM_H })
    }
  }

  const totalW = Math.max(curX - H_GAP + PAD, 400)
  const maxY = Math.max(
    ...devNodes.map(n => n.y + n.h),
    ...camNodes.map(n => n.y + n.h),
    PAD + DEV_H
  )
  const totalH = maxY + PAD

  return { devNodes, camNodes, totalW, totalH }
}

// ─── Componente principale ───────────────────────────────────────────────────
export default function InstallationSchemaModal({ isOpen, onClose, installation, clients }: Props) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const [openDevIdx, setOpenDevIdx] = useState<number | null>(null)
  const [openCamIdx, setOpenCamIdx] = useState<number | null>(null)

  const handleZoom = useCallback((d: number) => setZoom(z => Math.min(3, Math.max(0.25, z + d))), [])
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
  }
  const onMouseUp = () => setIsDragging(false)

  const handleDownload = () => {
    if (!installation) return
    const { devNodes, camNodes, totalW, totalH } = buildLayout(installation)
    const lines = camNodes.map((cn, i) => {
      if (cn.devIdx < 0) return ''
      const dn = devNodes[cn.devIdx]
      const portIdx = camNodes.slice(0, i).filter(c => c.devIdx === cn.devIdx).length
      const port = dn.ports[portIdx] || { x: dn.x + DEV_W / 2, y: dn.y + DEV_H }
      const cx2 = cn.x + cn.w / 2; const cy2 = cn.y
      const midY = port.y + V_GAP_DEV_CAM * 0.5
      return `<path d="M${port.x},${port.y} C${port.x},${midY} ${cx2},${midY} ${cx2},${cy2}" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6,5" fill="none"/>`
    }).join('\n')
    const devRects = devNodes.map(dn => {
      const tc = getTipoColor(dn.dev.tipo)
      const label = [dn.dev.marca, dn.dev.modello].filter(Boolean).join(' ') || dn.dev.tipo
      return `<rect x="${dn.x}" y="${dn.y}" width="${DEV_W}" height="${DEV_H}" rx="12" fill="white" stroke="${tc.dot}" stroke-width="2"/>
<rect x="${dn.x}" y="${dn.y}" width="${DEV_W}" height="32" rx="12" fill="${tc.dot}"/>
<rect x="${dn.x}" y="${dn.y + 20}" width="${DEV_W}" height="12" fill="${tc.dot}"/>
<text x="${dn.x + DEV_W / 2}" y="${dn.y + 20}" text-anchor="middle" font-size="11" font-weight="bold" fill="white">${dn.dev.tipo} — ${dn.dev.canali}ch</text>
<text x="${dn.x + DEV_W / 2}" y="${dn.y + 52}" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">${label}</text>
<text x="${dn.x + DEV_W / 2}" y="${dn.y + 68}" text-anchor="middle" font-size="9" font-family="monospace" fill="#3b82f6">${dn.dev.ip_principale}</text>`
    }).join('\n')
    const camRects = camNodes.map(cn => {
      const label = cn.cam.nome || cn.cam.posizione || `CH${cn.cam.canale ?? '?'}`
      return `<rect x="${cn.x}" y="${cn.y}" width="${CAM_W}" height="${CAM_H}" rx="10" fill="white" stroke="#cbd5e1" stroke-width="1.5"/>
<text x="${cn.x + CAM_W / 2}" y="${cn.y + 24}" text-anchor="middle" font-size="10" font-weight="600" fill="#334155">${label}</text>
<text x="${cn.x + CAM_W / 2}" y="${cn.y + 40}" text-anchor="middle" font-size="9" fill="#64748b">${cn.cam.mpx > 0 ? cn.cam.mpx + 'MP' : ''} ${cn.cam.canale ? 'CH' + cn.cam.canale : ''}</text>
<text x="${cn.x + CAM_W / 2}" y="${cn.y + 56}" text-anchor="middle" font-size="8" font-family="monospace" fill="#64748b">${cn.cam.ip}</text>`
    }).join('\n')
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">\n${lines}\n${devRects}\n${camRects}\n</svg>`
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `schema-${installation.nome.replace(/\s+/g, '-').toLowerCase()}.svg`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen || !installation) return null

  const clientObj = installation.client_id ? clients.find(c => c.id === installation.client_id) : null
  const { devNodes, camNodes, totalW, totalH } = buildLayout(installation)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
          className="relative w-full max-w-6xl h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden"
          onClick={() => { setOpenDevIdx(null); setOpenCamIdx(null) }}
        >
          {/* ── Header ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/60 bg-white/80 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Monitor className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Schema impianto</h2>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-600">{installation.nome}</span>
                  {clientObj && (<><span className="text-slate-300">·</span>
                    <span className="flex items-center gap-0.5"><Building2 className="w-2.5 h-2.5" />{clientObj.name}{clientObj.company ? ` — ${clientObj.company}` : ''}</span></>)}
                  {(installation.citta || installation.indirizzo) && (<><span className="text-slate-300">·</span>
                    <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{[installation.indirizzo, installation.citta, installation.provincia].filter(Boolean).join(', ')}</span></>)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <button onClick={() => handleZoom(-0.15)} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors" title="Zoom out"><ZoomOut className="w-3.5 h-3.5 text-slate-500" /></button>
                <span className="text-[11px] font-bold text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => handleZoom(0.15)} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors" title="Zoom in"><ZoomIn className="w-3.5 h-3.5 text-slate-500" /></button>
                <button onClick={handleReset} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors" title="Reset"><RotateCcw className="w-3.5 h-3.5 text-slate-500" /></button>
              </div>
              <button onClick={handleDownload} className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 text-indigo-600 text-xs font-bold transition-all flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />Esporta
              </button>
              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* ── Stats bar ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-5 px-5 py-2.5 bg-slate-50/60 border-b border-slate-100/80 flex-shrink-0 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold"><Server className="w-3.5 h-3.5 text-blue-500" />{installation.devices.length} registratore{installation.devices.length !== 1 ? 'i' : ''}</span>
            <span className="flex items-center gap-1.5 font-semibold"><Camera className="w-3.5 h-3.5 text-slate-400" />{installation.cameras.length} telecamera{installation.cameras.length !== 1 ? 'e' : ''}</span>
            {installation.devices.flatMap(d => d.hdds).length > 0 && (
              <span className="flex items-center gap-1.5 font-semibold"><HardDrive className="w-3.5 h-3.5 text-amber-500" />{installation.devices.flatMap(d => d.hdds).reduce((s, h) => s + Number(h.dimensione_tb), 0).toFixed(1)} TB</span>
            )}
            {installation.devices.reduce((s, d) => s + d.canali, 0) > 0 && (
              <span className="flex items-center gap-1.5 font-semibold"><Wifi className="w-3.5 h-3.5 text-emerald-500" />{installation.devices.reduce((s, d) => s + d.canali, 0)} canali totali</span>
            )}
            <span className="ml-auto text-slate-300 italic hidden sm:block">Clicca su una card per i dettagli · Trascina per muovere · Scroll per zoom</span>
          </div>

          {/* ── Canvas ──────────────────────────────────────────────────── */}
          <div
            className="flex-1 overflow-hidden relative"
            style={{ background: 'radial-gradient(circle at 50% 30%, #f8fafc 0%, #eef2f7 100%)' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={e => { e.preventDefault(); handleZoom(e.deltaY < 0 ? 0.1 : -0.1) }}
          >
            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.45 }} />

            {/* Pan/zoom container */}
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'top left',
                width: totalW,
                height: totalH,
                position: 'relative',
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            >
              {/* SVG connessioni */}
              <svg className="absolute inset-0 pointer-events-none" width={totalW} height={totalH} style={{ overflow: 'visible' }}>
                {camNodes.map((cn, i) => {
                  if (cn.devIdx < 0) return null
                  const dn = devNodes[cn.devIdx]
                  const portIdx = camNodes.slice(0, i).filter(c => c.devIdx === cn.devIdx).length
                  const port = dn.ports[portIdx] || { x: dn.x + DEV_W / 2, y: dn.y + DEV_H }
                  const cx2 = cn.x + cn.w / 2; const cy2 = cn.y
                  const midY = port.y + V_GAP_DEV_CAM * 0.5
                  return (
                    <g key={`wire-${i}`}>
                      <path d={`M ${port.x} ${port.y} C ${port.x} ${midY}, ${cx2} ${midY}, ${cx2} ${cy2}`}
                        fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6,5" />
                      <circle cx={port.x} cy={port.y} r="3.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
                      <circle cx={cx2} cy={cy2} r="3" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1.5" />
                    </g>
                  )
                })}
              </svg>

              {/* Card registratori */}
              {devNodes.map((dn, di) => {
                const tc = getTipoColor(dn.dev.tipo)
                const label = [dn.dev.marca, dn.dev.modello].filter(Boolean).join(' ') || dn.dev.tipo
                const totalTb = dn.dev.hdds.reduce((s, h) => s + Number(h.dimensione_tb), 0)
                const isOpen = openDevIdx === di

                return (
                  <div key={`dev-${di}`} data-card="1" className="absolute select-none"
                    style={{ left: dn.x, top: dn.y, width: DEV_W }}
                    onClick={e => { e.stopPropagation(); setOpenCamIdx(null); setOpenDevIdx(isOpen ? null : di) }}>
                    <div className={`bg-white rounded-2xl border-2 transition-all cursor-pointer overflow-visible ${isOpen ? `${tc.border} shadow-xl ring-2 ring-offset-1` : 'border-slate-200/80 shadow-md hover:shadow-xl hover:-translate-y-0.5'}`}
                      style={{ width: DEV_W }}>
                      {/* Band colorata */}
                      <div className={`${tc.bg} rounded-t-[14px] px-3 py-2.5 flex items-center justify-between`}>
                        <div className="flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-white" />
                          <span className="text-white text-[11px] font-bold">{dn.dev.tipo}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-white/25 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{dn.dev.canali}ch</span>
                          <ChevronDown className={`w-3 h-3 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      {/* Body */}
                      <div className="px-3 py-2.5 space-y-1.5">
                        <p className="text-[12px] font-bold text-slate-800 leading-tight truncate" title={label}>{label || '—'}</p>
                        {dn.dev.ip_principale && <p className={`text-[10px] font-mono ${tc.text} leading-tight`}>{dn.dev.ip_principale}</p>}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {totalTb > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded-md border border-amber-100">
                              <HardDrive className="w-2.5 h-2.5" />{totalTb.toFixed(1)} TB
                            </span>
                          )}
                          {dn.dev.credentials.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-md">
                              <KeyRound className="w-2.5 h-2.5" />{dn.dev.credentials.length} acc.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isOpen && <DeviceDetailPopup dev={dn.dev} onClose={() => setOpenDevIdx(null)} />}
                    </AnimatePresence>
                  </div>
                )
              })}

              {/* Card telecamere */}
              {camNodes.map((cn, ci) => {
                const isOpen = openCamIdx === ci
                const label = cn.cam.nome || cn.cam.posizione || `CH ${cn.cam.canale ?? ci + 1}`
                const isUnassigned = cn.devIdx < 0

                return (
                  <div key={`cam-${ci}`} data-card="1" className="absolute select-none"
                    style={{ left: cn.x, top: cn.y, width: CAM_W }}
                    onClick={e => { e.stopPropagation(); setOpenDevIdx(null); setOpenCamIdx(isOpen ? null : ci) }}>
                    <div className={`bg-white rounded-xl border-2 transition-all cursor-pointer ${isOpen ? 'border-blue-300 shadow-xl ring-2 ring-blue-100 ring-offset-1' : isUnassigned ? 'border-slate-200/60 shadow-sm' : 'border-slate-200/80 shadow-md hover:shadow-xl hover:-translate-y-0.5'}`}
                      style={{ width: CAM_W }}>
                      <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center ${isUnassigned ? 'bg-slate-100' : 'bg-blue-50'}`}>
                            <Camera className={`w-3.5 h-3.5 ${isUnassigned ? 'text-slate-400' : 'text-blue-500'}`} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 leading-tight truncate" title={label}>{label}</span>
                        </div>
                        <ChevronDown className={`w-3 h-3 text-slate-300 flex-shrink-0 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                      <div className="flex items-center gap-1 px-2.5 pb-2.5 flex-wrap">
                        {cn.cam.mpx > 0 && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md border border-emerald-100">{cn.cam.mpx}MP</span>
                        )}
                        {cn.cam.canale && (
                          <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded-md border border-blue-100">CH{cn.cam.canale}</span>
                        )}
                        {cn.cam.ip && (
                          <span className="text-[9px] font-mono text-slate-400 truncate">…{cn.cam.ip.split('.').pop()}</span>
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isOpen && <CameraDetailPopup cam={cn.cam} onClose={() => setOpenCamIdx(null)} />}
                    </AnimatePresence>
                  </div>
                )
              })}

              {devNodes.length === 0 && camNodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-3">📷</div>
                    <p className="text-slate-400">Nessun dispositivo configurato</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Legenda ─────────────────────────────────────────────────── */}
          <div className="px-5 py-2.5 border-t border-slate-100/80 bg-white/60 flex items-center gap-5 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <div className="w-4 h-4 rounded-md bg-blue-500" /><span>Registratore</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <div className="w-4 h-4 rounded-md bg-white border-2 border-slate-200 flex items-center justify-center">
                <Camera className="w-2.5 h-2.5 text-blue-400" />
              </div><span>Telecamera</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,4" /></svg>
              <span>Collegamento</span>
            </div>
            <span className="ml-auto text-[10px] text-slate-300 italic">Clicca su NVR o telecamera per i dettagli</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
