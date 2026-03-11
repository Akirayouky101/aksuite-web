'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ZoomIn, ZoomOut, RotateCcw, Monitor, Server, Camera, HardDrive, Wifi, MapPin } from 'lucide-react'
import { InstallationFull, InstallationDevice, DeviceHdd, DeviceCredential, InstallationCamera } from '../hooks/useInstallations'

type FullDevice = InstallationDevice & { hdds: DeviceHdd[]; credentials: DeviceCredential[] }
import { Client } from '../hooks/useClients'

interface InstallationSchemaModalProps {
  isOpen: boolean
  onClose: () => void
  installation: InstallationFull | null
  clients: Client[]
}

// Layout constants
const NVR_W = 160
const NVR_H = 100
const CAM_W = 120
const CAM_H = 76
const H_GAP = 60    // horizontal gap between NVR columns
const V_GAP_NVR = 40
const V_GAP_CAM = 20
const CANVAS_PAD = 60

const tipoGradients: Record<string, [string, string]> = {
  NVR:   ['#3b82f6', '#6366f1'],
  DVR:   ['#8b5cf6', '#7c3aed'],
  XVR:   ['#6366f1', '#4338ca'],
  HDCVI: ['#06b6d4', '#0891b2'],
  Altro: ['#64748b', '#475569'],
}

function wrapText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text]
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxLen) {
      if (cur) lines.push(cur)
      cur = w
    } else {
      cur = (cur + ' ' + w).trim()
    }
  }
  if (cur) lines.push(cur)
  return lines
}

interface NodePos { x: number; y: number; w: number; h: number }
interface DevNode extends NodePos { dev: FullDevice; camPorts: { x: number; y: number }[] }
interface CamNode extends NodePos { cam: InstallationCamera; devIdx: number }

function buildLayout(installation: InstallationFull) {
  const devices = installation.devices
  const cameras = installation.cameras

  // Group cameras by device
  const camsByDevice: Record<string, InstallationCamera[]> = {}
  for (const cam of cameras) {
    const key = cam.device_id || '__unassigned__'
    if (!camsByDevice[key]) camsByDevice[key] = []
    camsByDevice[key].push(cam)
  }
  const unassigned = camsByDevice['__unassigned__'] || []

  const devNodes: DevNode[] = []
  const camNodes: CamNode[] = []

  // Calculate columns for devices
  // Each device occupies a vertical strip; cameras hang below
  let curX = CANVAS_PAD

  for (let di = 0; di < devices.length; di++) {
    const dev = devices[di]
    const devCams = camsByDevice[dev.id] || []

    const colCamCount = devCams.length
    // How wide is this column? max(NVR_W, cameras in a 2-column grid)
    const camCols = colCamCount <= 1 ? 1 : 2
    const camGridW = camCols * CAM_W + (camCols - 1) * V_GAP_CAM
    const colW = Math.max(NVR_W, camGridW)
    const colCenterX = curX + colW / 2

    const devX = colCenterX - NVR_W / 2
    const devY = CANVAS_PAD
    devNodes.push({ dev, x: devX, y: devY, w: NVR_W, h: NVR_H, camPorts: [] })

    // Cameras grid below NVR
    const camStartY = devY + NVR_H + V_GAP_NVR
    for (let ci = 0; ci < devCams.length; ci++) {
      const col = ci % camCols
      const row = Math.floor(ci / camCols)
      const camX = colCenterX - camGridW / 2 + col * (CAM_W + V_GAP_CAM)
      const camY = camStartY + row * (CAM_H + V_GAP_CAM)
      // Connection port on NVR bottom
      const portX = devX + NVR_W / 2 + (ci - (devCams.length - 1) / 2) * (NVR_W / Math.max(devCams.length, 4))
      devNodes[di].camPorts.push({ x: portX, y: devY + NVR_H })
      camNodes.push({ cam: devCams[ci], devIdx: di, x: camX, y: camY, w: CAM_W, h: CAM_H })
    }

    curX += colW + H_GAP
  }

  // Unassigned cameras — row at bottom
  if (unassigned.length > 0) {
    const maxY = Math.max(...camNodes.map(n => n.y + n.h), CANVAS_PAD + NVR_H)
    const unY = maxY + V_GAP_NVR
    for (let ci = 0; ci < unassigned.length; ci++) {
      camNodes.push({ cam: unassigned[ci], devIdx: -1, x: CANVAS_PAD + ci * (CAM_W + V_GAP_CAM), y: unY, w: CAM_W, h: CAM_H })
    }
  }

  const totalW = curX - H_GAP + CANVAS_PAD
  const maxBottomY = Math.max(
    ...devNodes.map(n => n.y + n.h),
    ...camNodes.map(n => n.y + n.h),
    CANVAS_PAD + NVR_H
  )
  const totalH = maxBottomY + CANVAS_PAD

  return { devNodes, camNodes, totalW, totalH }
}

export default function InstallationSchemaModal({ isOpen, onClose, installation, clients }: InstallationSchemaModalProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  useEffect(() => {
    if (isOpen) { setZoom(1); setPan({ x: 0, y: 0 }) }
  }, [isOpen])

  if (!isOpen || !installation) return null

  const clientName = installation.client_id
    ? clients.find(c => c.id === installation.client_id)
    : null

  const { devNodes, camNodes, totalW, totalH } = buildLayout(installation)

  // Drag pan handlers
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const onMouseUp = () => setIsDragging(false)

  const handleZoom = (delta: number) => setZoom(z => Math.min(3, Math.max(0.3, z + delta)))
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // Export SVG as PNG
  const handleDownload = () => {
    const svg = svgRef.current
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schema-${installation.nome.replace(/\s+/g, '-').toLowerCase()}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Gradient defs
  const gradDefs = Object.entries(tipoGradients).map(([tipo, [c1, c2]]) => (
    <linearGradient key={tipo} id={`grad-${tipo}`} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor={c1} />
      <stop offset="100%" stopColor={c2} />
    </linearGradient>
  ))

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4">
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
          className="relative w-full max-w-6xl h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/60 bg-white/80 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Monitor className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Schema impianto</h2>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="font-semibold text-slate-600">{installation.nome}</span>
                  {clientName && <><span className="text-slate-300">·</span><span>{clientName.name}{clientName.company ? ` — ${clientName.company}` : ''}</span></>}
                  {(installation.citta || installation.indirizzo) && (
                    <><span className="text-slate-300">·</span><MapPin className="w-3 h-3" />{[installation.indirizzo, installation.citta, installation.provincia].filter(Boolean).join(', ')}</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <button onClick={() => handleZoom(-0.2)} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors" title="Zoom out">
                  <ZoomOut className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <span className="text-[11px] font-bold text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => handleZoom(0.2)} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors" title="Zoom in">
                  <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button onClick={handleReset} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center transition-colors" title="Reset vista">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              <button onClick={handleDownload} title="Scarica SVG"
                className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 text-indigo-600 text-xs font-bold transition-all flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />Esporta
              </button>

              <button onClick={onClose} title="Chiudi" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 flex items-center justify-center transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-50/60 border-b border-slate-100/80 flex-shrink-0 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold">
              <Server className="w-3.5 h-3.5 text-blue-500" />
              {installation.devices.length} registrator{installation.devices.length !== 1 ? 'i' : 'e'}
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              {installation.cameras.length} telecamer{installation.cameras.length !== 1 ? 'e' : 'a'}
            </span>
            {installation.devices.flatMap(d => d.hdds).length > 0 && (
              <span className="flex items-center gap-1.5 font-semibold">
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                {installation.devices.flatMap(d => d.hdds).reduce((s, h) => s + Number(h.dimensione_tb), 0).toFixed(1)} TB totali
              </span>
            )}
            {installation.devices.reduce((s, d) => s + d.canali, 0) > 0 && (
              <span className="flex items-center gap-1.5 font-semibold">
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                {installation.devices.reduce((s, d) => s + d.canali, 0)} canali totali
              </span>
            )}
            <span className="ml-auto text-slate-300 italic">Trascina per muovere • Scroll per zoom</span>
          </div>

          {/* Canvas */}
          <div
            className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 cursor-grab active:cursor-grabbing relative"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={e => { e.preventDefault(); handleZoom(e.deltaY < 0 ? 0.1 : -0.1) }}
          >
            {/* Grid background */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div className="absolute z-10 pointer-events-none bg-slate-800/90 text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-lg"
                style={{ left: tooltip.x + 12, top: tooltip.y - 30 }}>
                {tooltip.text}
              </div>
            )}

            {/* SVG Schema */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${totalW} ${totalH}`}
              width={totalW}
              height={totalH}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'top left',
                userSelect: 'none',
              }}
            >
              <defs>
                {gradDefs}
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.12" />
                </filter>
                <filter id="shadow-sm" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.08" />
                </filter>
                {/* Camera icon path */}
                <symbol id="icon-cam" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </symbol>
                <symbol id="icon-hdd" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm6 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-5.5 1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm11 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                </symbol>
              </defs>

              {/* Connection lines: NVR → Cameras */}
              {camNodes.map((cn, i) => {
                if (cn.devIdx < 0) return null
                const dn = devNodes[cn.devIdx]
                const port = dn.camPorts[camNodes.slice(0, i).filter(c => c.devIdx === cn.devIdx).length] || { x: dn.x + dn.w / 2, y: dn.y + dn.h }
                const camTopX = cn.x + cn.w / 2
                const camTopY = cn.y
                const midY = (port.y + camTopY) / 2
                return (
                  <g key={`line-${i}`}>
                    <path
                      d={`M ${port.x} ${port.y} C ${port.x} ${midY}, ${camTopX} ${midY}, ${camTopX} ${camTopY}`}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="5,4"
                      opacity="0.6"
                    />
                    {/* Dot on NVR side */}
                    <circle cx={port.x} cy={port.y} r="3" fill="#94a3b8" opacity="0.7" />
                    {/* Arrow on camera side */}
                    <circle cx={camTopX} cy={camTopY} r="2.5" fill="#3b82f6" opacity="0.5" />
                  </g>
                )
              })}

              {/* NVR/DVR nodes */}
              {devNodes.map((dn, di) => {
                const [g1, g2] = tipoGradients[dn.dev.tipo] || tipoGradients['Altro']
                const gradId = `grad-${dn.dev.tipo}`
                const hddCount = dn.dev.hdds.length
                const totalTb = dn.dev.hdds.reduce((s, h) => s + Number(h.dimensione_tb), 0)
                const label = [dn.dev.marca, dn.dev.modello].filter(Boolean).join(' ') || dn.dev.tipo
                const labelLines = wrapText(label, 18)

                return (
                  <g key={`dev-${di}`} filter="url(#shadow)"
                    onMouseEnter={e => setTooltip({ text: `${dn.dev.tipo} · ${dn.dev.ip_principale || 'no IP'} · ${dn.dev.canali} ch`, x: e.clientX, y: e.clientY })}
                    onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                    onMouseLeave={() => setTooltip(null)}>
                    {/* Card */}
                    <rect x={dn.x} y={dn.y} width={dn.w} height={dn.h} rx="12" ry="12" fill="white" />

                    {/* Top colored band */}
                    <rect x={dn.x} y={dn.y} width={dn.w} height={32} rx="12" ry="12" fill={`url(#${gradId})`} />
                    <rect x={dn.x} y={dn.y + 20} width={dn.w} height={12} fill={`url(#${gradId})`} />

                    {/* Type badge */}
                    <rect x={dn.x + 8} y={dn.y + 8} width={32} height={16} rx="6" fill="rgba(255,255,255,0.25)" />
                    <text x={dn.x + 24} y={dn.y + 19} textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">{dn.dev.tipo}</text>

                    {/* Channels badge */}
                    <rect x={dn.x + dn.w - 42} y={dn.y + 8} width={34} height={16} rx="6" fill="rgba(255,255,255,0.25)" />
                    <text x={dn.x + dn.w - 25} y={dn.y + 19} textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">{dn.dev.canali}ch</text>

                    {/* Model name */}
                    {labelLines.map((line, li) => (
                      <text key={li} x={dn.x + dn.w / 2} y={dn.y + 44 + li * 13}
                        textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e293b">
                        {line}
                      </text>
                    ))}

                    {/* IP */}
                    {dn.dev.ip_principale && (
                      <text x={dn.x + dn.w / 2} y={dn.y + dn.h - 22}
                        textAnchor="middle" fontSize="8.5" fontFamily="monospace" fill="#3b82f6">
                        {dn.dev.ip_principale}
                      </text>
                    )}

                    {/* HDD indicator */}
                    {hddCount > 0 && (
                      <g>
                        <rect x={dn.x + dn.w / 2 - 28} y={dn.y + dn.h - 14} width={56} height={11} rx="5" fill="#fef3c7" />
                        <text x={dn.x + dn.w / 2} y={dn.y + dn.h - 6}
                          textAnchor="middle" fontSize="8" fill="#92400e" fontWeight="600">
                          HDD: {totalTb.toFixed(1)} TB
                        </text>
                      </g>
                    )}

                    {/* Border */}
                    <rect x={dn.x} y={dn.y} width={dn.w} height={dn.h} rx="12" ry="12" fill="none" stroke={g1} strokeWidth="1.5" opacity="0.5" />
                  </g>
                )
              })}

              {/* Camera nodes */}
              {camNodes.map((cn, ci) => {
                const isUnassigned = cn.devIdx < 0
                const label = cn.cam.nome || cn.cam.posizione || `Cam ${cn.cam.canale ?? ci + 1}`
                const labelLines = wrapText(label, 16)

                return (
                  <g key={`cam-${ci}`} filter="url(#shadow-sm)"
                    onMouseEnter={e => setTooltip({ text: `${cn.cam.marca || ''} ${cn.cam.modello || ''} · ${cn.cam.ip || 'no IP'} · ${cn.cam.mpx}MP`.trim(), x: e.clientX, y: e.clientY })}
                    onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                    onMouseLeave={() => setTooltip(null)}>
                    {/* Card */}
                    <rect x={cn.x} y={cn.y} width={cn.w} height={cn.h} rx="10" ry="10"
                      fill={isUnassigned ? '#f8fafc' : 'white'}
                      stroke={isUnassigned ? '#e2e8f0' : '#dbeafe'}
                      strokeWidth="1.5" />

                    {/* Camera icon circle */}
                    <circle cx={cn.x + 18} cy={cn.y + 18} r="11"
                      fill={isUnassigned ? '#e2e8f0' : '#dbeafe'} />
                    <use href="#icon-cam" x={cn.x + 11} y={cn.y + 11} width="14" height="14"
                      color={isUnassigned ? '#94a3b8' : '#3b82f6'} />

                    {/* MP badge */}
                    {cn.cam.mpx > 0 && (
                      <g>
                        <rect x={cn.x + cn.w - 30} y={cn.y + 6} width={24} height={12} rx="5" fill="#ecfdf5" />
                        <text x={cn.x + cn.w - 18} y={cn.y + 15} textAnchor="middle" fontSize="8" fontWeight="700" fill="#059669">
                          {cn.cam.mpx}MP
                        </text>
                      </g>
                    )}

                    {/* Channel badge */}
                    {cn.cam.canale && (
                      <g>
                        <rect x={cn.x + cn.w - 30} y={cn.y + 21} width={24} height={12} rx="5" fill="#eff6ff" />
                        <text x={cn.x + cn.w - 18} y={cn.y + 30} textAnchor="middle" fontSize="8" fontWeight="700" fill="#3b82f6">
                          CH{cn.cam.canale}
                        </text>
                      </g>
                    )}

                    {/* Name */}
                    {labelLines.map((line, li) => (
                      <text key={li} x={cn.x + 33} y={cn.y + 18 + li * 12}
                        fontSize="9.5" fontWeight="600" fill="#334155">
                        {line}
                      </text>
                    ))}

                    {/* IP */}
                    {cn.cam.ip && (
                      <text x={cn.x + 8} y={cn.y + cn.h - 8}
                        fontSize="8" fontFamily="monospace" fill="#64748b">
                        {cn.cam.ip}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* Legend */}
              <g transform={`translate(${CANVAS_PAD}, ${totalH - 30})`}>
                <rect width="6" height="6" rx="1" fill="#3b82f6" />
                <text x="10" y="6" fontSize="9" fill="#64748b">Registratore</text>
                <circle cx="80" cy="3" r="3" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1" />
                <use href="#icon-cam" x="73" y="-3" width="12" height="12" color="#3b82f6" />
                <text x="90" y="6" fontSize="9" fill="#64748b">Telecamera</text>
                <rect x="170" y="0" width="20" height="1.5" fill="#94a3b8" opacity="0.6" strokeDasharray="5,4" />
                <text x="195" y="6" fontSize="9" fill="#64748b">Collegamento</text>
              </g>
            </svg>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
