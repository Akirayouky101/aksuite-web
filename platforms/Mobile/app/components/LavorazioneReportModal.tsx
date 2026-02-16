'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Printer, Download, Building2, Calendar, User, MapPin, Clock, Wrench } from 'lucide-react'
import { Lavorazione } from '../hooks/useLavorazioni'
import { TimelineEntry, EVENT_TYPES } from '../hooks/useLavorazioneTimeline'

interface LavorazioneReportModalProps {
  isOpen: boolean
  onClose: () => void
  lavorazione: Lavorazione | null
  entries: TimelineEntry[]
  userProfile?: any
}

const statusLabels: Record<string, string> = {
  da_fare: 'Da Fare',
  in_corso: 'In Corso',
  completata: 'Completata',
  annullata: 'Annullata',
}

export default function LavorazioneReportModal({ isOpen, onClose, lavorazione, entries, userProfile }: LavorazioneReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !lavorazione) return null

  const handlePrint = () => {
    const content = reportRef.current
    if (!content) return
    const printWin = window.open('', '_blank', 'width=800,height=600')
    if (!printWin) return
    printWin.document.write(`
      <!DOCTYPE html><html><head><title>Report - ${lavorazione.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; font-size: 13px; line-height: 1.6; }
        .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 24px; }
        .header h1 { font-size: 22px; color: #1e293b; font-weight: 700; }
        .header .subtitle { color: #64748b; font-size: 12px; margin-top: 4px; }
        .company { font-size: 14px; color: #4f46e5; font-weight: 600; margin-bottom: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        .info-item label { display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 2px; }
        .info-item span { font-size: 13px; color: #334155; font-weight: 500; }
        .section-title { font-size: 14px; font-weight: 700; color: #1e293b; margin: 20px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
        .description { padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px; }
        .timeline-entry { padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; gap: 12px; align-items: flex-start; }
        .timeline-entry:last-child { border-bottom: none; }
        .timeline-dot { width: 28px; height: 28px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .timeline-content { flex: 1; }
        .timeline-type { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .timeline-desc { font-size: 12px; color: #334155; margin-top: 2px; }
        .timeline-meta { font-size: 10px; color: #94a3b8; margin-top: 2px; }
        .timeline-img { max-width: 200px; max-height: 150px; border-radius: 6px; margin-top: 6px; border: 1px solid #e2e8f0; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .status-da_fare { background: #fef3c7; color: #92400e; }
        .status-in_corso { background: #dbeafe; color: #1e40af; }
        .status-completata { background: #d1fae5; color: #065f46; }
        .status-annullata { background: #fee2e2; color: #991b1b; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `)
    printWin.document.close()
    setTimeout(() => { printWin.print(); }, 500)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
  const formatDateTime = (d: string) => {
    const date = new Date(d)
    return `${date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()} className="relative max-w-2xl w-full my-8">
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl max-h-[90vh] overflow-hidden border border-slate-200/60 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Report Lavorazione</h2>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[300px]">{lavorazione.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} title="Stampa / Salva PDF"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" />Stampa PDF
                </button>
                <button onClick={onClose} title="Chiudi"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200/60 hover:border-red-200 flex items-center justify-center transition-all">
                  <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* Report Preview */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <div ref={reportRef}>
                <div className="header">
                  <p className="company">{userProfile?.full_name || 'AK Suite'}</p>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>{lavorazione.title}</h1>
                  <p className="subtitle">Report generato il {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>

                <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  <div className="info-item">
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>Stato</label>
                    <span className={`status-badge status-${lavorazione.status}`} style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                      {statusLabels[lavorazione.status] || lavorazione.status}
                    </span>
                  </div>
                  {lavorazione.assigned_to && (
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>Assegnato a</label>
                      <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{lavorazione.assigned_to}</span>
                    </div>
                  )}
                  {lavorazione.scheduled_date && (
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>Data prevista</label>
                      <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{formatDate(lavorazione.scheduled_date)}</span>
                    </div>
                  )}
                  {lavorazione.address && (
                    <div className="info-item">
                      <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>Indirizzo</label>
                      <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{lavorazione.address}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>Creata il</label>
                    <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{formatDate(lavorazione.created_at)}</span>
                  </div>
                </div>

                {lavorazione.description && (
                  <div>
                    <div className="section-title" style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: '20px 0 12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>Descrizione</div>
                    <div className="description" style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px', color: '#334155' }}>
                      {lavorazione.description}
                    </div>
                  </div>
                )}

                {entries.length > 0 && (
                  <div>
                    <div className="section-title" style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: '20px 0 12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
                      Cronologia ({entries.length} eventi)
                    </div>
                    {entries.map(entry => {
                      const typeConfig = EVENT_TYPES[entry.event_type] || EVENT_TYPES.altro
                      return (
                        <div key={entry.id} className="timeline-entry" style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div className="timeline-dot" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                            {typeConfig.emoji}
                          </div>
                          <div className="timeline-content" style={{ flex: 1 }}>
                            <div className="timeline-type" style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{typeConfig.label}</div>
                            <div className="timeline-desc" style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>{entry.description}</div>
                            {entry.image_url && (
                              <img src={entry.image_url} alt="Foto" className="timeline-img" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '6px', marginTop: '6px', border: '1px solid #e2e8f0' }} />
                            )}
                            <div className="timeline-meta" style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                              {formatDateTime(entry.created_at)}{entry.created_by_name ? ` — ${entry.created_by_name}` : ''}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="footer" style={{ marginTop: '32px', paddingTop: '16px', borderTop: '2px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '10px' }}>
                  AK Suite &mdash; Report generato automaticamente &mdash; {new Date().toLocaleDateString('it-IT')}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
