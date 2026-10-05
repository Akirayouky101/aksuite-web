import { jsPDF } from 'jspdf'
import { shoppingProgress } from '../../../../lib/shopping'
import type { ShoppingItem, ShoppingList } from '../../../../lib/shopping'

export function createShoppingPdf(list: ShoppingList, items: readonly ShoppingItem[]): Blob {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const left = 18
  const right = 192
  let y = 0
  const progress = shoppingProgress(items)

  function header() {
    pdf.setFillColor(45, 39, 84)
    pdf.rect(0, 0, 210, 25, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(255, 255, 255)
    pdf.text('AK Suite', left, 16)
    pdf.setFontSize(10)
    pdf.text('LISTA DELLA SPESA', right, 16, { align: 'right' })
    pdf.setTextColor(45, 39, 84)
    pdf.setFontSize(17)
    const titleLines = pdf.splitTextToSize(list.title, right - left) as string[]
    pdf.text(titleLines, left, 38)
    y = 38 + titleLines.length * 7
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(`${progress.remaining} da acquistare / ${progress.total} prodotti · ${new Date().toLocaleDateString('it-IT')}`, left, y)
    y += 12
  }

  function line(text: string, size: number, bold: boolean, x = left + 10) {
    if (y + 6 > 275) {
      pdf.addPage()
      header()
    }
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    pdf.setFontSize(size)
    pdf.setTextColor(45, 39, 84)
    pdf.text(text, x, y)
    y += 5.5
  }

  header()
  if (!items.length) line('Nessun prodotto nella lista.', 11, false, left)
  const ordered = [...items.filter(item => !item.purchased), ...items.filter(item => item.purchased)]
  for (const item of ordered) {
    if (y + 20 > 275) {
      pdf.addPage()
      header()
    }
    pdf.setDrawColor(37, 114, 89)
    pdf.rect(left, y - 3.5, 4, 4)
    if (item.purchased) {
      pdf.line(left + 0.7, y - 1.5, left + 1.7, y - 0.5)
      pdf.line(left + 1.7, y - 0.5, left + 3.4, y - 2.8)
    }
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    for (const text of pdf.splitTextToSize(item.name, right - left - 10) as string[]) line(text, 11, true)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const details = [
      item.quantity ? `Quantità: ${item.quantity}` : '',
      item.notes ? `Note: ${item.notes}` : '',
      item.purchased ? 'Acquistato' : '',
    ].filter(Boolean)
    for (const detail of details) {
      for (const text of pdf.splitTextToSize(detail, right - left - 10) as string[]) line(text, 9, false)
    }
    y += 5
  }
  const pages = pdf.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(113, 106, 145)
    pdf.text('Copia PDF personale · Non consente di modificare la lista', left, 286)
    pdf.text(`${page} / ${pages}`, right, 286, { align: 'right' })
  }
  return pdf.output('blob')
}
