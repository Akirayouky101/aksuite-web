import { jsPDF } from 'jspdf'
import { ChecklistEntry, checklistProgress, installedQuantity, WorkItem } from '../hooks/useWorkItems'
import { Event } from '../hooks/useEvents'

const margin = 18
const pageWidth = 210
const pageHeight = 297
const right = pageWidth - margin
const ink: [number, number, number] = [45, 39, 84]
const muted: [number, number, number] = [113, 106, 145]
const green: [number, number, number] = [37, 114, 89]
const paper: [number, number, number] = [248, 246, 241]

async function iconData(): Promise<string | null> {
  try {
    const image = new Image()
    image.src = '/aksuite-icon.png'
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 192
    canvas.getContext('2d')?.drawImage(image, 0, 0, 192, 192)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

export async function createWorkItemPdf(item: WorkItem, clientName: string, events: Event[] = []): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const icon = await iconData()
  let y = 39

  function font(size: number, bold = false, color: [number, number, number] = ink) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    pdf.setTextColor(...color)
  }

  function header() {
    pdf.setFillColor(...ink)
    pdf.rect(0, 0, pageWidth, 28, 'F')
    if (icon) pdf.addImage(icon, 'PNG', margin, 5, 18, 18)
    font(16, true, [255, 255, 255])
    pdf.text('AK Suite', icon ? margin + 23 : margin, 17)
    font(8, true, [220, 232, 224])
    pdf.text('RAPPORTO LAVORAZIONE', right, 16, { align: 'right' })
  }

  function space(required: number) {
    if (y + required <= pageHeight - 22) return
    pdf.addPage()
    header()
    y = 39
  }

  function nextPage() {
    pdf.addPage()
    header()
    y = 39
  }

  function lines(value: string, maxWidth: number, size = 10, bold = false): string[] {
    font(size, bold)
    return pdf.splitTextToSize(value || '-', maxWidth) as string[]
  }

  function paragraph(value: string, size = 10, color: [number, number, number] = ink) {
    for (const block of value.split('\n')) {
      const wrapped = lines(block || ' ', right - margin, size)
      const lineHeight = size * 0.44
      space(wrapped.length * lineHeight + 4)
      font(size, false, color)
      pdf.text(wrapped, margin, y)
      y += wrapped.length * lineHeight + 4
    }
  }

  function heading(label: string, caption?: string) {
    space(22)
    y += 7
    pdf.setDrawColor(220, 227, 220)
    pdf.line(margin, y - 4, right, y - 4)
    font(12, true, green)
    pdf.text(label.toUpperCase(), margin, y + 2)
    if (caption) {
      font(9, true, muted)
      pdf.text(caption, right, y + 2, { align: 'right' })
    }
    y += 12
  }

  function field(label: string, value: string, x: number, columnWidth: number) {
    font(8, true, muted)
    pdf.text(label.toUpperCase(), x, y + 5)
    const wrapped = lines(value, columnWidth - 10, 10)
    font(10, true)
    pdf.text(wrapped, x, y + 12)
    return Math.max(19, 13 + wrapped.length * 4.3)
  }

  function date(value: string | null, withTime = false) {
    if (!value) return 'Non indicata'
    const parsed = new Date(withTime ? value : `${value.slice(0, 10)}T12:00:00`)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('it-IT', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' })
  }

  function rowHeight(entry: ChecklistEntry, depth: number) {
    const indent = Math.min(depth * 9, 27)
    const linked = item.materials.find(material => material.id === entry.materialId)
    const titleLines = lines(entry.text, right - margin - indent - 39, 10, depth === 0)
    const detailLines = linked ? lines(`Materiale: ${linked.text}`, right - margin - indent - 13, 8) : []
    return Math.max(12, titleLines.length * 4.4 + detailLines.length * 3.6 + 6) + 2
  }

  function groupHeight(entry: ChecklistEntry, depth = 0): number {
    return rowHeight(entry, depth) + (entry.steps || []).reduce((total, step) => total + groupHeight(step, depth + 1), 0)
  }

  function checklistRows(entries: ChecklistEntry[], depth = 0, continuation?: string) {
    for (const entry of entries) {
      const indent = Math.min(depth * 9, 27)
      const amount = `${entry.quantity || 1} ${entry.unit === 'metri' ? 'm' : 'pz'}`
      const linked = item.materials.find(material => material.id === entry.materialId)
      const titleLines = lines(entry.text, right - margin - indent - 39, 10, depth === 0)
      const detail = linked?.text
      const detailLines = detail ? lines(`Materiale: ${detail}`, right - margin - indent - 13, 8) : []
      const rowHeight = Math.max(12, titleLines.length * 4.4 + detailLines.length * 3.6 + 6)
      if (depth === 0 && y + groupHeight(entry) > pageHeight - 22 && groupHeight(entry) < pageHeight - 70) {
        nextPage()
        heading(continuation || 'Checklist (continua)')
      }
      if (y + rowHeight + 2 > pageHeight - 22) {
        nextPage()
        heading(continuation || 'Checklist (continua)')
      }
      if (depth === 0) {
        pdf.setFillColor(...paper)
        pdf.roundedRect(margin, y - 5, right - margin, rowHeight, 2, 2, 'F')
      }
      const x = margin + 5 + indent
      pdf.setDrawColor(...(entry.done ? green : muted))
      pdf.setLineWidth(0.4)
      pdf.rect(x, y - 1.5, 3.8, 3.8)
      if (entry.done) {
        pdf.setDrawColor(...green)
        pdf.line(x + 0.7, y + 0.3, x + 1.6, y + 1.2)
        pdf.line(x + 1.6, y + 1.2, x + 3.2, y - 0.9)
      }
      font(10, depth === 0, entry.done ? green : ink)
      pdf.text(titleLines, x + 7, y + 1.5)
      font(9, true, muted)
      pdf.text(amount, right - 5, y + 1.5, { align: 'right' })
      if (detailLines.length) {
        font(8, false, muted)
        pdf.text(detailLines, x + 7, y + titleLines.length * 4.4 + 1.5)
      }
      y += rowHeight + 2
      if (entry.steps?.length) checklistRows([...entry.steps.filter(step => step.done), ...entry.steps.filter(step => !step.done)], depth + 1, continuation)
    }
  }

  header()
  font(8, true, green)
  pdf.text('SCHEDA LAVORAZIONE', margin, y)
  y += 8
  const titleLines = lines(item.title, right - margin, 19, true)
  space(titleLines.length * 8 + 5)
  font(19, true)
  pdf.text(titleLines, margin, y)
  y += titleLines.length * 8 + 4

  const status = { planned: 'Da pianificare', in_progress: 'In corso', waiting: 'In attesa', completed: 'Completata' }[item.status]
  const priority = { low: 'Bassa', normal: 'Normale', high: 'Alta' }[item.priority]
  const clientLines = lines(clientName || 'Nessun cliente collegato', right - margin - 20, 10, true)
  const clientHeight = Math.max(19, 13 + clientLines.length * 4.3)
  const boxHeight = clientHeight + 43
  space(boxHeight + 4)
  const boxTop = y
  pdf.setFillColor(...paper)
  pdf.roundedRect(margin, boxTop, right - margin, boxHeight, 2, 2, 'F')
  y += 4
  const half = (right - margin) / 2
  field('Cliente', clientName || 'Nessun cliente collegato', margin + 5, right - margin - 10)
  y += clientHeight + 2
  field('Stato', status, margin + 5, half)
  field('Priorita', priority, margin + half + 3, half - 8)
  y += 19
  field('Scadenza', date(item.due_date), margin + 5, half)
  field('Appuntamento', date(item.scheduled_at, true), margin + half + 3, half - 8)
  y = Math.max(boxTop + boxHeight + 4, y + 18)

  if (item.description) { heading('Descrizione'); paragraph(item.description) }
  if (item.next_action) { heading('Prossima azione'); paragraph(item.next_action) }
  if (item.notes) { heading('Note'); paragraph(item.notes) }

  const progress = checklistProgress(item.checklist)
  nextPage()
  heading('Checklist', `${progress.done} / ${progress.total} completate    ${progress.percent}%`)
  if (item.checklist.length) {
    const completed = item.checklist.filter(entry => entry.done)
    const pending = item.checklist.filter(entry => !entry.done)
    if (completed.length) {
      heading('Completate')
      checklistRows(completed, 0, 'Completate (continua)')
    }
    if (pending.length) {
      if (completed.length) nextPage()
      heading('Da fare')
      checklistRows(pending, 0, 'Da fare (continua)')
    }
  } else paragraph('Nessuna voce', 9, muted)

  if (events.length) {
    nextPage()
    heading('Diagramma interventi', `${events.length} eventi`)
    for (const event of [...events].sort((first, second) => new Date(first.start_date).getTime() - new Date(second.start_date).getTime())) {
      const start = new Date(event.start_date)
      const label = Number.isNaN(start.getTime()) ? event.start_date : start.toLocaleString('it-IT', event.all_day ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' })
      const titleLines = lines(event.title, right - margin - 14, 10, true)
      const locationLines = event.location ? lines(event.location, right - margin - 14, 8) : []
      const rowHeight = titleLines.length * 4.4 + locationLines.length * 3.5 + 18
      if (y + rowHeight > pageHeight - 22) { nextPage(); heading('Interventi (continua)') }
      pdf.setFillColor(...paper)
      pdf.roundedRect(margin, y - 5, right - margin, rowHeight - 2, 2, 2, 'F')
      pdf.setFillColor(...(start.getTime() < Date.now() ? muted : green))
      pdf.circle(margin + 6, y + 1, 2, 'F')
      font(8, true, green)
      pdf.text(label, margin + 12, y + 1)
      font(10, true)
      pdf.text(titleLines, margin + 12, y + 7)
      if (locationLines.length) {
        font(8, false, muted)
        pdf.text(locationLines, margin + 12, y + 7 + titleLines.length * 4.4)
      }
      y += rowHeight
    }
  }

  nextPage()
  heading('Materiali', `${item.materials.filter(material => material.done).length} / ${item.materials.length} utilizzati`)
  if (!item.materials.length) paragraph('Nessun materiale', 9, muted)
  const sortedMaterials = [...item.materials.filter(material => material.done), ...item.materials.filter(material => !material.done)]
  let previousState: boolean | undefined
  for (const material of sortedMaterials) {
    const amount = `${installedQuantity(item.checklist, material.id, material.unit || 'pezzi')} / ${material.quantity || 1} ${material.unit === 'metri' ? 'm' : 'pz'}`
    const nameLines = lines(material.text, right - margin - 82, 10, true)
    const rowHeight = Math.max(13, nameLines.length * 4.4 + 6)
    if (previousState !== material.done) {
      if (previousState !== undefined) nextPage()
      heading(material.done ? 'Utilizzati' : 'Da utilizzare')
      previousState = material.done
    }
    if (y + rowHeight + 2 > pageHeight - 22) {
      nextPage()
      heading(material.done ? 'Utilizzati (continua)' : 'Da utilizzare (continua)')
    }
    pdf.setFillColor(...paper)
    pdf.roundedRect(margin, y - 5, right - margin, rowHeight, 2, 2, 'F')
    pdf.setFillColor(...(material.done ? green : muted))
    pdf.circle(margin + 6, y, 2, 'F')
    font(10, true)
    pdf.text(nameLines, margin + 12, y + 1.5)
    font(9, true, material.done ? green : muted)
    pdf.text(amount, right - 4, y + 1.5, { align: 'right' })
    y += rowHeight + 2
  }

  const totalPages = pdf.getNumberOfPages()
  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page)
    pdf.setDrawColor(221, 222, 216)
    pdf.line(margin, pageHeight - 17, right, pageHeight - 17)
    font(8, false, muted)
    pdf.text(`AK Suite  |  ${new Date().toLocaleDateString('it-IT')}`, margin, pageHeight - 11)
    pdf.text(`${page} / ${totalPages}`, right, pageHeight - 11, { align: 'right' })
  }
  return pdf.output('blob')
}