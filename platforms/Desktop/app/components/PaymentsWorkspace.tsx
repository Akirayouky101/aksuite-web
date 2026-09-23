'use client'

import { CreditCard, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Payment, PaymentInstallment, PaymentPayerPayment } from '../hooks/usePayments'
import DateTimePicker from './DateTimePicker'

interface PaymentsWorkspaceProps {
  payments: Payment[]
  onNew: () => void
  onEdit: (payment: Payment) => void
  onDelete: (id: string) => Promise<void>
  onUpdate: (id: string, updates: Partial<Payment>) => Promise<unknown> | void
  onBack: () => void
  focusPaymentId?: string | null
}

const money = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0)
const dateLabel = (value: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('it-IT') : 'Nessuna data'
const paymentDate = (payment: Payment) => payment.installment_schedule?.find(item => item.due_date)?.due_date || payment.down_payment_due_date || payment.created_at
const amountValue = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const text = value.trim()
  const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

function variablePaidAmount(payment: Payment) {
  const schedule = Array.isArray(payment.installment_schedule) ? payment.installment_schedule : []
  return schedule.reduce((sum, installment) => {
    const rawAmount = installment.amount ?? (installment as PaymentInstallment & { actual_amount?: unknown }).actual_amount
    return sum + amountValue(rawAmount)
  }, 0)
}

function payerPayment(payment: Payment, payerName: string, installmentIndex?: number) {
  if (installmentIndex === undefined) return payment.down_payment_payer_payments?.find(item => item.payer_name === payerName)
  return payment.installment_schedule?.[installmentIndex]?.payer_payments?.find(item => item.payer_name === payerName)
}

function paidAmount(payment: Payment) {
  const variableRows = (payment.installment_schedule || []).filter(installment => amountValue(installment.amount ?? (installment as PaymentInstallment & { actual_amount?: unknown }).actual_amount) > 0)
  const hasVariableRows = variableRows.length > 0 && !payment.payers?.length
  const downPayment = payment.payers?.length
    ? payment.payers.reduce((sum, payer) => payerPayment(payment, payer.name)?.paid_at ? sum + payment.down_payment * payer.percentage / 100 : sum, 0)
    : (payment.down_payment_paid_at ? payment.down_payment : 0)
  const isSalaryWithholding = payment.payment_mode === 'salary_withholding' || hasVariableRows
  if (!payment.payers?.length && isSalaryWithholding) return downPayment + variablePaidAmount(payment)
  if (!payment.payers?.length && !(payment.installment_schedule || []).length) return downPayment + (payment.paid_installments || []).length * payment.installment_amount
  const installments = payment.payers?.reduce((sum, payer) => {
    const paid = (payment.installment_schedule || []).filter(installment => installment.payer_payments?.some(item => item.payer_name === payer.name && item.paid_at)).length
    return sum + payment.installment_amount * payer.percentage / 100 * paid
  }, 0) || 0
  return downPayment + installments
}

function amountToRecover(payment: Payment) {
  const down = payment.payers?.reduce((sum, payer) => {
    const record = payerPayment(payment, payer.name)
    return record?.advanced_by_me && !record.reimbursed_at ? sum + payment.down_payment * payer.percentage / 100 : sum
  }, 0) || 0
  const installments = payment.payment_mode === 'salary_withholding'
    ? (payment.installment_schedule || []).reduce((sum, installment) => installment.payer_payments?.some(item => item.advanced_by_me && !item.reimbursed_at) ? sum + (installment.amount || 0) : sum, 0)
    : payment.payers?.reduce((sum, payer) => sum + (payment.installment_schedule || []).reduce((installmentSum, installment) => installmentSum + (installment.payer_payments?.some(item => item.payer_name === payer.name && item.advanced_by_me && !item.reimbursed_at) ? payment.installment_amount * payer.percentage / 100 : 0), 0), 0) || 0
  return down + installments
}

function updatePayerPayment(payment: Payment, payerName: string, paidAt: string, advancedByMe: boolean, reimbursedAt: string | null, installmentIndex?: number) {
  if (installmentIndex === undefined) {
    const current = (payment.down_payment_payer_payments || []).filter(item => item.payer_name !== payerName)
    return paidAt ? [...current, { payer_name: payerName, paid_at: paidAt, advanced_by_me: advancedByMe, reimbursed_at: reimbursedAt }] : current
  }
  const schedule: PaymentInstallment[] = Array.from({ length: payment.installments_count }, (_, index) => payment.installment_schedule?.[index] || { due_date: null, payer_payments: [] })
  const current = schedule[installmentIndex].payer_payments.filter(item => item.payer_name !== payerName)
  schedule[installmentIndex] = { ...schedule[installmentIndex], payer_payments: paidAt ? [...current, { payer_name: payerName, paid_at: paidAt, advanced_by_me: advancedByMe, reimbursed_at: reimbursedAt }] : current }
  return schedule
}

export default function PaymentsWorkspace({ payments, onNew, onEdit, onDelete, onUpdate, onBack, focusPaymentId }: PaymentsWorkspaceProps) {
  const [query, setQuery] = useState('')
  const visiblePayments = focusPaymentId ? payments.filter(payment => payment.id === focusPaymentId) : payments
  const filtered = visiblePayments.filter(payment => `${payment.payment_type} ${payment.recipient} ${payment.reason} ${payment.notes}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => new Date(paymentDate(a)).getTime() - new Date(paymentDate(b)).getTime())
  const total = visiblePayments.reduce((sum, payment) => sum + payment.total_amount, 0)
  const outstanding = visiblePayments.reduce((sum, payment) => sum + Math.max(0, payment.total_amount - (payment.payment_mode === 'salary_withholding' ? variablePaidAmount(payment) : paidAmount(payment))), 0)
  const recoverable = visiblePayments.reduce((sum, payment) => sum + amountToRecover(payment), 0)

  return <section className="ak-workspace"><header className="ak-workspace-head"><div><p className="ak-kicker">Registro personale</p><h2>Pagamenti</h2><p>Scadenze, anticipi e rimborsi sempre sotto controllo.</p></div><button onClick={onNew} className="ak-primary-action"><Plus className="h-4 w-4" />Nuovo pagamento</button></header><div className="grid gap-3 py-5 sm:grid-cols-3"><Summary label="Importo complessivo" value={money(total)} /><Summary label="Manca al saldo" value={money(outstanding)} accent /><Summary label="Da recuperare" value={money(recoverable)} recoverable /></div><div className="ak-toolbar"><div className="ak-search"><Search className="h-4 w-4" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cerca pagamento, destinatario o causale" /></div><span className="ak-count">{filtered.length} registrati</span></div><div className="grid gap-3">{filtered.length ? filtered.map(payment => <PaymentCard key={payment.id} payment={payment} onEdit={onEdit} onDelete={onDelete} onUpdate={onUpdate} />) : <div className="ak-empty"><CreditCard className="h-8 w-8" /><h3>Nessun pagamento trovato</h3><p>Registra il primo pagamento per iniziare.</p></div>}</div><div className="mt-6 flex justify-center border-t border-[#ead8bf] pt-5"><button onClick={onBack} className="rounded-xl border border-[#d8cbb8] bg-[#fff8ed] px-5 py-3 text-sm font-bold text-[#716a91] transition hover:-translate-y-0.5 hover:bg-[#f5dfca] hover:text-[#2d2754]">← Torna ai pagamenti</button></div></section>
}

function PaymentCard({ payment, onEdit, onDelete, onUpdate }: { payment: Payment; onEdit: (payment: Payment) => void; onDelete: (id: string) => Promise<void>; onUpdate: (id: string, updates: Partial<Payment>) => Promise<unknown> | void }) {
  const paid = payment.payment_mode === 'salary_withholding' ? variablePaidAmount(payment) : paidAmount(payment)
  const balance = Math.max(0, payment.total_amount - paid)
  const schedule = Array.from({ length: payment.installments_count }, (_, index) => payment.installment_schedule?.[index] || { due_date: null, payer_payments: [] })
  return <article className="rounded-[1.2rem] border border-[#ead8bf] bg-[#fff8ed] p-4"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#cfe4ff] text-[#376db5]"><CreditCard className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-[#2d2754]">{payment.payment_type}</h3>{payment.is_installment && <span className="ak-status ak-status-in_corso">{payment.payment_mode === 'salary_withholding' ? 'Trattenuta stipendio' : 'A rate'}</span>}</div><p className="mt-1 text-sm text-[#716a91]">A {payment.recipient}{payment.reason ? ` · ${payment.reason}` : ''}</p><div className="mt-3 grid gap-1 text-xs text-[#716a91] sm:grid-cols-5"><span>Totale <strong className="text-[#2d2754]">{money(payment.total_amount)}</strong></span>{payment.payment_mode === 'salary_withholding' ? <span>Percentuale <strong className="text-[#2d2754]">{payment.salary_percentage}%</strong></span> : <span>Acconto <strong className="text-[#2d2754]">{money(payment.down_payment)}</strong></span>}<span>Pagato <strong className="text-[#257259]">{money(paid)}</strong></span><span>Manca <strong className="text-[#e45f4e]">{money(balance)}</strong></span><span>Da recuperare <strong className="text-[#376db5]">{money(amountToRecover(payment))}</strong></span></div>{payment.is_installment && (payment.payment_mode === 'salary_withholding' ? <VariableSchedule payment={payment} schedule={schedule} onUpdate={onUpdate} /> : <Schedule payment={payment} schedule={schedule} onUpdate={onUpdate} />)}{payment.notes && <p className="mt-3 text-xs italic text-[#716a91]">{payment.notes}</p>}</div><div className="flex shrink-0 gap-1"><button onClick={() => onEdit(payment)} title="Modifica" className="rounded-lg p-2 text-[#897e9d] hover:bg-[#f5dfca] hover:text-[#e45f4e]"><Pencil className="h-4 w-4" /></button><button onClick={() => onDelete(payment.id)} title="Elimina" className="rounded-lg p-2 text-[#897e9d] hover:bg-[#f5dfca] hover:text-[#b43c44]"><Trash2 className="h-4 w-4" /></button></div></div></article>
}

function VariableSchedule({ payment, schedule, onUpdate }: { payment: Payment; schedule: PaymentInstallment[]; onUpdate: (id: string, updates: Partial<Payment>) => Promise<unknown> | void }) {
  const update = (index: number, amount: number, paidAt: string) => {
    const next = schedule.map((installment, scheduleIndex) => scheduleIndex === index ? { ...installment, amount, paid_at: paidAt || null } : installment)
    onUpdate(payment.id, { installment_schedule: next })
  }
  const addMonth = () => {
    const lastDate = schedule[schedule.length - 1]?.due_date
    let dueDate: string | null = null
    if (lastDate) {
      const [year, month, day] = lastDate.split('-').map(Number)
      const next = new Date(year, month, day)
      dueDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
    }
    onUpdate(payment.id, {
      installments_count: payment.installments_count + 1,
      installment_schedule: [...schedule, { due_date: dueDate, payer_payments: [] }]
    })
  }
  const removeMonth = (index: number) => onUpdate(payment.id, { installments_count: Math.max(1, payment.installments_count - 1), installment_schedule: schedule.filter((_, scheduleIndex) => scheduleIndex !== index) })
  return <div className="mt-4 space-y-2"><div className="flex items-center justify-between gap-2"><p className="text-xs text-[#716a91]">Inserisci ogni mese l’importo reale e la data.</p><button type="button" onClick={addMonth} className="rounded-lg bg-[#cfe4ff] px-3 py-2 text-xs font-bold text-[#376db5]">+ Aggiungi mese</button></div>{schedule.map((installment, index) => <div key={index} className="rounded-xl border border-[#f0c7b5] bg-[#fff0e9] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black text-[#2d2754]">Mese {index + 1}</p><div className="flex items-center gap-2"><span className="text-xs text-[#716a91]">Scadenza: {dateLabel(installment.due_date)}</span><button type="button" onClick={() => removeMonth(index)} title="Elimina questo mese" className="rounded-lg p-1 text-[#897e9d] hover:bg-[#f5dfca] hover:text-[#b43c44]"><Trash2 className="h-3.5 w-3.5" /></button></div></div><div className="mt-2 grid gap-2 sm:grid-cols-2"><label className="text-xs font-medium text-[#716a91]">Importo trattenuto<input type="number" min="0" step="0.01" value={installment.amount || ''} onChange={event => update(index, Number(event.target.value), installment.paid_at || '')} className="mt-1 w-full rounded-lg border border-slate-200/60 px-2 py-2 text-sm" /></label><div><p className="text-xs font-medium text-[#716a91]">Pagata il</p><DateTimePicker mode="date" value={installment.paid_at || ''} onChange={value => update(index, installment.amount || 0, value)} placeholder="Segna data" clearable /></div></div></div>)}</div>
}

function Schedule({ payment, schedule, onUpdate }: { payment: Payment; schedule: PaymentInstallment[]; onUpdate: (id: string, updates: Partial<Payment>) => Promise<unknown> | void }) {
  return <div className="mt-4 space-y-3"><div className="rounded-xl border border-[#ead8bf] bg-white/60 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black text-[#2d2754]">Acconto · {money(payment.down_payment)}</p><span className="text-xs text-[#716a91]">Scadenza: {dateLabel(payment.down_payment_due_date)}</span></div>{payment.payers.length ? <div className="mt-2 space-y-2">{payment.payers.map(payer => <PayerPaymentRow key={`down-${payer.name}`} payment={payment} payer={payer} paymentData={payerPayment(payment, payer.name)} onUpdate={onUpdate} />)}</div> : <DateTimePicker mode="date" value={payment.down_payment_paid_at?.slice(0, 10) || ''} onChange={value => onUpdate(payment.id, { down_payment_paid_at: value ? new Date(`${value}T12:00:00`).toISOString() : null })} placeholder="Segna data" clearable />}</div>{schedule.map((installment, index) => <div key={index} className="rounded-xl border border-[#ead8bf] bg-white/60 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black text-[#2d2754]">Rata {index + 1} · {money(payment.installment_amount)}</p><span className="text-xs text-[#716a91]">Scadenza: {dateLabel(installment.due_date)}</span></div>{payment.payers.length ? <div className="mt-2 space-y-2">{payment.payers.map(payer => <PayerPaymentRow key={`${index}-${payer.name}`} payment={payment} payer={payer} paymentData={payerPayment(payment, payer.name, index)} installmentIndex={index} onUpdate={onUpdate} />)}</div> : <p className="mt-2 text-xs text-[#8a7f9f]">Nessun pagante configurato.</p>}</div>)}</div>
}

function PayerPaymentRow({ payment, payer, paymentData, installmentIndex, onUpdate }: { payment: Payment; payer: { name: string; percentage: number }; paymentData?: PaymentPayerPayment; installmentIndex?: number; onUpdate: (id: string, updates: Partial<Payment>) => Promise<unknown> | void }) {
  const amount = installmentIndex === undefined ? payment.down_payment * payer.percentage / 100 : payment.installment_amount * payer.percentage / 100
  const update = (paidAt: string, advancedByMe = paymentData?.advanced_by_me || false, reimbursedAt = paymentData?.reimbursed_at || null) => {
    if (installmentIndex === undefined) {
      onUpdate(payment.id, { down_payment_payer_payments: updatePayerPayment(payment, payer.name, paidAt, advancedByMe, reimbursedAt) as PaymentPayerPayment[] })
    } else {
      onUpdate(payment.id, { installment_schedule: updatePayerPayment(payment, payer.name, paidAt, advancedByMe, reimbursedAt, installmentIndex) as PaymentInstallment[] })
    }
  }
  return <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#716a91]"><span>{payer.name} · {payer.percentage}% ({money(amount)})</span><div className="flex flex-wrap items-center justify-end gap-2"><DateTimePicker mode="date" value={paymentData?.paid_at?.slice(0, 10) || ''} onChange={value => update(value)} placeholder="Segna data" clearable /><label className="flex items-center gap-1 whitespace-nowrap"><input type="checkbox" checked={Boolean(paymentData?.advanced_by_me)} onChange={event => update(paymentData?.paid_at?.slice(0, 10) || new Date().toISOString().slice(0, 10), event.target.checked, event.target.checked ? null : paymentData?.reimbursed_at || null)} /> Anticipato da me</label>{paymentData?.advanced_by_me && <label className="flex items-center gap-1 whitespace-nowrap"><input type="checkbox" checked={Boolean(paymentData.reimbursed_at)} onChange={event => update(paymentData.paid_at?.slice(0, 10) || new Date().toISOString().slice(0, 10), true, event.target.checked ? new Date().toISOString() : null)} /> Rimborso ricevuto</label>}</div></div>
}

function Summary({ label, value, accent = false, recoverable = false }: { label: string; value: string; accent?: boolean; recoverable?: boolean }) { return <div className={`rounded-[1.1rem] border p-4 ${recoverable ? 'border-[#b8d0c0] bg-[#d9e8d9]' : accent ? 'border-[#f0c7b5] bg-[#fff0e9]' : 'border-[#d8cbb8] bg-[#fff8ed]'}`}><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a7f9f]">{label}</p><p className={`mt-1 text-2xl font-black ${recoverable ? 'text-[#257259]' : accent ? 'text-[#e45f4e]' : 'text-[#2d2754]'}`}>{value}</p></div> }
