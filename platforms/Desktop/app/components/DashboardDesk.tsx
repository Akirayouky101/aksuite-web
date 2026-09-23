'use client'

import { BellRing, CalendarClock, CheckCircle2, CreditCard, Phone } from 'lucide-react'
import { Call } from '../hooks/useCalls'
import { Event } from '../hooks/useEvents'
import { Payment } from '../hooks/usePayments'

interface DashboardDeskProps {
  calls: Call[]
  events: Event[]
  payments: Payment[]
}

const WINDOW_DAYS = 14
const formatDate = (value: string) => new Date(value).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const daysFromNow = (value: string) => (new Date(value).getTime() - Date.now()) / 86400000
const isNear = (value: string) => daysFromNow(value) <= WINDOW_DAYS
const paymentDate = (value: string | null) => value ? `${value}T12:00:00` : null
const money = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0)

function nextSalaryDate(payment: Payment) {
  const schedule = payment.installment_schedule || []
  const openIndex = schedule.findIndex(item => !item.paid_at)
  const previous = openIndex > 0 ? schedule[openIndex - 1] : schedule[schedule.length - 1]
  if (schedule[openIndex]?.due_date) return `${schedule[openIndex].due_date}T12:00:00`
  if (!previous?.paid_at) return null
  const paidDate = new Date(previous.paid_at)
  const next = new Date(paidDate.getFullYear(), paidDate.getMonth() + 1, paidDate.getDate())
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}T12:00:00`
}

function advanceTotal(payment: Payment) {
  const down = payment.payers?.reduce((sum, payer) => {
    const record = payment.down_payment_payer_payments?.find(item => item.payer_name === payer.name)
    return record?.advanced_by_me && !record.reimbursed_at ? sum + payment.down_payment * payer.percentage / 100 : sum
  }, 0) || 0
  const installments = payment.payers?.reduce((sum, payer) => sum + (payment.installment_schedule || []).reduce((inner, installment) => inner + (installment.payer_payments?.some(item => item.payer_name === payer.name && item.advanced_by_me && !item.reimbursed_at) ? payment.installment_amount * payer.percentage / 100 : 0), 0), 0) || 0
  return down + installments
}

function isDownPaymentSettled(payment: Payment) {
  if (payment.payers?.length) return payment.payers.every(payer => payment.down_payment_payer_payments?.some(item => item.payer_name === payer.name && item.paid_at))
  return Boolean(payment.down_payment_paid_at)
}

function advanceEntries(payment: Payment) {
  const entries = payment.payers?.flatMap(payer => {
    const down = payment.down_payment_payer_payments?.find(item => item.payer_name === payer.name)
    const installmentTotal = (payment.installment_schedule || []).reduce((sum, installment) => installment.payer_payments?.some(item => item.payer_name === payer.name && item.advanced_by_me && !item.reimbursed_at) ? sum + payment.installment_amount * payer.percentage / 100 : sum, 0)
    const downTotal = down?.advanced_by_me && !down.reimbursed_at ? payment.down_payment * payer.percentage / 100 : 0
    const amount = downTotal + installmentTotal
    return amount > 0 ? [{ payer: payer.name, amount }] : []
  }) || []
  return entries
}

export default function DashboardDesk({ calls, events, payments }: DashboardDeskProps) {
  const followUps = calls.filter(call => call.follow_up && call.follow_up_date && call.status !== 'completed' && call.status !== 'cancelled' && isNear(call.follow_up_date)).sort((a, b) => new Date(a.follow_up_date || '').getTime() - new Date(b.follow_up_date || '').getTime())
  const upcomingEvents = events.filter(event => isNear(event.start_date)).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).slice(0, 5)
  const upcomingPayments = payments.flatMap(payment => {
    if (payment.payment_mode === 'salary_withholding') {
      const date = nextSalaryDate(payment)
      return date && isNear(date) ? [{ date, label: 'Prossimo mese', payment }] : []
    }
    const dates = [
      payment.down_payment_due_date && !isDownPaymentSettled(payment) ? { date: paymentDate(payment.down_payment_due_date), label: 'Acconto' } : null,
      ...(payment.installment_schedule || []).map((installment, index) => installment.due_date && !(payment.payers?.length && payment.payers.every(payer => installment.payer_payments?.some(item => item.payer_name === payer.name && item.paid_at))) ? { date: paymentDate(installment.due_date), label: payment.payment_mode === 'salary_withholding' ? `Mese ${index + 1}` : `Rata ${index + 1}` } : null)
    ]
    return dates.filter((item): item is { date: string; label: string } => item !== null && Boolean(item.date)).map(item => ({ ...item, payment }))
  }).filter(item => isNear(item.date)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5)
  const advances = payments.flatMap(payment => advanceEntries(payment).map(entry => ({ payment, ...entry }))).sort((a, b) => b.amount - a.amount).slice(0, 5)
  const hasItems = followUps.length || upcomingEvents.length || upcomingPayments.length || advances.length

  return <div className="ak-activity rounded-[1.75rem] p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#e45f4e]">Agenda prossima</p><h2 className="mt-2 text-2xl font-black text-[#2d2754]">Parte chiamate</h2></div><BellRing className="h-6 w-6 text-[#5f9e8e]" /></div><div className="mt-6 space-y-5">{followUps.length > 0 && <DeskGroup icon={<Phone className="h-4 w-4" />} title="Richiamare"><div>{followUps.map(call => <DeskRow key={`call-${call.id}`} title={call.caller_name} detail={call.company || 'Richiamo'} date={call.follow_up_date || ''} tone="coral" />)}</div></DeskGroup>}{upcomingPayments.length > 0 && <DeskGroup icon={<CreditCard className="h-4 w-4" />} title="Pagamenti vicini"><div>{upcomingPayments.map(item => <DeskRow key={`payment-${item.payment.id}-${item.label}`} title={item.payment.payment_type} detail={item.label} date={item.date} tone="blue" />)}</div></DeskGroup>}{advances.length > 0 && <DeskGroup icon={<CreditCard className="h-4 w-4" />} title="Anticipi da recuperare"><div>{advances.map(item => <AdvanceRow key={`advance-${item.payment.id}-${item.payer}`} title={item.payment.payment_type} payer={item.payer} amount={item.amount} />)}</div></DeskGroup>}{upcomingEvents.length > 0 && <DeskGroup icon={<CalendarClock className="h-4 w-4" />} title="Calendario"><div>{upcomingEvents.map(event => <DeskRow key={`event-${event.id}`} title={event.title} detail={event.location || 'Appuntamento'} date={event.start_date} tone="yellow" />)}</div></DeskGroup>}{!hasItems && <div className="flex items-center gap-3 py-3 text-sm text-[#8a7f9f]"><CheckCircle2 className="h-5 w-5 text-[#5f9e8e]" />Nessuna scadenza imminente.</div>}</div></div>
}

function DeskGroup({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) { return <section><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#716a91]"><span className="text-[#e45f4e]">{icon}</span>{title}</div>{children}</section> }
function AdvanceRow({ title, payer, amount }: { title: string; payer: string; amount: number }) { return <div className="ak-activity-row"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ffddd2] text-xs font-black text-[#c75143]">€</span><div className="min-w-0"><p className="truncate font-bold text-[#3e3860]">{title}</p><p className="truncate text-xs text-[#8a7f9f]">{payer} deve restituire {money(amount)}</p></div></div> }
function DeskRow({ title, detail, date, tone }: { title: string; detail: string; date: string; tone: 'coral' | 'blue' | 'yellow' }) { const dateValue = new Date(date); const overdue = dateValue.getTime() < Date.now(); const tint = tone === 'coral' ? 'bg-[#ffddd2] text-[#c75143]' : tone === 'blue' ? 'bg-[#cfe4ff] text-[#376db5]' : 'bg-[#fff0bf] text-[#856300]'; return <div className="ak-activity-row"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${tint}`}>{overdue ? '!' : dateValue.getDate()}</span><div className="min-w-0 flex-1"><p className="truncate font-bold text-[#3e3860]">{title}</p><p className="truncate text-xs text-[#8a7f9f]">{detail} · {overdue ? 'Scaduto' : formatDate(date)}</p></div></div> }
