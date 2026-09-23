'use client'

import { CreditCard, Eye, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Payment } from '../hooks/usePayments'

interface PaymentsOverviewProps {
  payments: Payment[]
  onNew: () => void
  onOpenPractice: (payment: Payment) => void
  onDelete: (id: string) => Promise<void>
}

const money = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0)

function paidAmount(payment: Payment) {
  const down = payment.payers?.length
    ? payment.payers.reduce((sum, payer) => payment.down_payment_payer_payments?.some(item => item.payer_name === payer.name && item.paid_at) ? sum + payment.down_payment * payer.percentage / 100 : sum, 0)
    : (payment.down_payment_paid_at ? payment.down_payment : 0)
  const isSalaryWithholding = payment.payment_mode === 'salary_withholding' || (!payment.payers?.length && (payment.installment_schedule || []).some(item => item.amount != null || item.paid_at))
  if (isSalaryWithholding) return down + (payment.installment_schedule || []).reduce((sum, item) => Number(item.amount) > 0 ? sum + Number(item.amount) : sum, 0)
  const installments = payment.payers?.reduce((sum, payer) => sum + (payment.installment_schedule || []).filter(item => item.payer_payments?.some(record => record.payer_name === payer.name && record.paid_at)).length * payment.installment_amount * payer.percentage / 100, 0) || 0
  return down + installments
}

export default function PaymentsOverview({ payments, onNew, onOpenPractice, onDelete }: PaymentsOverviewProps) {
  const [selected, setSelected] = useState<Payment | null>(null)

  return <section className="ak-workspace"><header className="ak-workspace-head"><div><p className="ak-kicker">Registro personale</p><h2>Pagamenti</h2><p>Scegli una pratica per vedere il riepilogo o gestire tutti i dettagli.</p></div><button onClick={onNew} className="ak-primary-action"><Plus className="h-4 w-4" />Nuovo pagamento</button></header><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{payments.length ? payments.map(payment => <div key={payment.id} className="relative rounded-[1.2rem] border border-[#ead8bf] bg-[#fff8ed] p-4 text-left transition hover:-translate-y-1 hover:shadow-lg"><button onClick={() => setSelected(payment)} className="w-full text-left"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#cfe4ff] text-[#376db5]"><CreditCard className="h-5 w-5" /></span><Eye className="h-4 w-4 text-[#a99dbb]" /></div><h3 className="mt-4 font-black text-[#2d2754]">{payment.payment_type}</h3><p className="mt-1 truncate text-sm text-[#716a91]">A {payment.recipient}</p><div className="mt-4 flex items-end justify-between gap-2 text-xs"><span className="text-[#716a91]">Totale<strong className="mt-1 block text-base text-[#2d2754]">{money(payment.total_amount)}</strong></span><span className="text-right text-[#716a91]">Pagato<strong className="mt-1 block text-base text-[#257259]">{money(paidAmount(payment))}</strong></span></div></button><button onClick={() => onDelete(payment.id)} title="Elimina pratica" className="absolute right-3 top-3 rounded-lg p-2 text-[#897e9d] hover:bg-[#f5dfca] hover:text-[#b43c44]"><Trash2 className="h-4 w-4" /></button></div>) : <div className="ak-empty sm:col-span-2 xl:col-span-3"><CreditCard className="h-8 w-8" /><h3>Nessun pagamento</h3><p>Crea il primo pagamento per iniziare.</p></div>}</div><QuickSummary payment={selected} onClose={() => setSelected(null)} onOpenPractice={payment => { setSelected(null); onOpenPractice(payment) }} /></section>
}

function QuickSummary({ payment, onClose, onOpenPractice }: { payment: Payment | null; onClose: () => void; onOpenPractice: (payment: Payment) => void }) {
  if (!payment) return null
  const paid = paidAmount(payment)
  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}><div className="w-full max-w-md rounded-2xl p-5" onClick={event => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="ak-kicker">Riepilogo veloce</p><h3 className="mt-2 text-2xl font-black text-[#2d2754]">{payment.payment_type}</h3><p className="mt-1 text-sm text-[#716a91]">A {payment.recipient}</p></div><button onClick={onClose} title="Chiudi" className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100"><X className="h-4 w-4 text-slate-400" /></button></div><div className="mt-5 grid grid-cols-2 gap-3"><Metric label="Totale" value={money(payment.total_amount)} /><Metric label="Pagato" value={money(paid)} green /><Metric label="Manca" value={money(Math.max(0, payment.total_amount - paid))} red /><Metric label="Paganti" value={String(payment.payers?.length || 0)} /></div>{payment.reason && <p className="mt-4 rounded-xl bg-white/60 p-3 text-sm text-[#716a91]">{payment.reason}</p>}<button onClick={() => onOpenPractice(payment)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d2754] py-3 text-sm font-bold text-white">Apri pratica</button></div></div>
}

function Metric({ label, value, green = false, red = false }: { label: string; value: string; green?: boolean; red?: boolean }) { return <div className="rounded-xl border border-[#ead8bf] bg-white/60 p-3"><p className="text-xs text-[#8a7f9f]">{label}</p><p className={`mt-1 font-black ${green ? 'text-[#257259]' : red ? 'text-[#e45f4e]' : 'text-[#2d2754]'}`}>{value}</p></div> }