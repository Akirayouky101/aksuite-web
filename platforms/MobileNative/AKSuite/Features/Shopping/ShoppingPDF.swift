import Foundation
import CoreGraphics
import CoreText

enum ShoppingPDF {
    static func create(list: ShoppingListRecord, products: [ShoppingProduct]) throws -> Data {
        let output = NSMutableData()
        var bounds = CGRect(x: 0, y: 0, width: 595, height: 842)
        guard let consumer = CGDataConsumer(data: output),
              let context = CGContext(consumer: consumer, mediaBox: &bounds, nil) else {
            throw ShoppingError.invalid("Impossibile creare il PDF.")
        }
        let width: CGFloat = 595
        let height: CGFloat = 842
        let margin: CGFloat = 48
        var y: CGFloat = 0
        var page = 0
        var hasPage = false
        let ink = CGColor(red: 45 / 255, green: 39 / 255, blue: 84 / 255, alpha: 1)
        let green = CGColor(red: 37 / 255, green: 114 / 255, blue: 89 / 255, alpha: 1)

        func draw(_ text: String, x: CGFloat, top: CGFloat, size: CGFloat, bold: Bool = false, color: CGColor = ink) {
            let font = CTFontCreateWithName((bold ? "Helvetica-Bold" : "Helvetica") as CFString, size, nil)
            let attributed = NSAttributedString(string: text, attributes: [
                NSAttributedString.Key(kCTFontAttributeName as String): font,
                NSAttributedString.Key(kCTForegroundColorAttributeName as String): color
            ])
            context.textMatrix = .identity
            context.textPosition = CGPoint(x: x, y: height - top - size)
            CTLineDraw(CTLineCreateWithAttributedString(attributed), context)
        }

        func newPage() {
            if hasPage { context.endPDFPage() }
            context.beginPDFPage(nil)
            hasPage = true
            page += 1
            context.setFillColor(ink)
            context.fill(CGRect(x: 0, y: height - 65, width: width, height: 65))
            draw("AK Suite · LISTA DELLA SPESA", x: margin, top: 22, size: 18, bold: true, color: CGColor(gray: 1, alpha: 1))
            draw("Copia PDF personale · Non modifica la lista · \(page)", x: margin, top: 810, size: 9)
            y = 84
        }

        func paragraph(_ text: String, size: CGFloat = 11, bold: Bool = false, indent: CGFloat = 0) {
            let font = CTFontCreateWithName((bold ? "Helvetica-Bold" : "Helvetica") as CFString, size, nil)
            let attributes = [NSAttributedString.Key(kCTFontAttributeName as String): font]
            let attributed = NSAttributedString(string: text, attributes: attributes)
            let typesetter = CTTypesetterCreateWithAttributedString(attributed)
            var offset = 0
            while offset < attributed.length {
                let count = max(1, CTTypesetterSuggestLineBreak(typesetter, offset, Double(width - margin * 2 - indent)))
                if y + size * 1.5 > 786 { newPage() }
                let value = (text as NSString).substring(with: NSRange(location: offset, length: count))
                draw(value.trimmingCharacters(in: .newlines), x: margin + indent, top: y, size: size, bold: bold)
                offset += count
                y += size * 1.5
            }
        }

        newPage()
        paragraph(list.title, size: 19, bold: true)
        let remaining = products.filter { !$0.purchased }.count
        paragraph("\(remaining) da acquistare / \(products.count) prodotti · \(Date.now.formatted(date: .abbreviated, time: .omitted))", size: 10)
        y += 12
        if products.isEmpty { paragraph("Nessun prodotto nella lista.") }
        for product in products.filter({ !$0.purchased }) + products.filter({ $0.purchased }) {
            if y + 35 > 786 { newPage() }
            context.setStrokeColor(green)
            context.stroke(CGRect(x: margin, y: height - y - 11, width: 10, height: 10))
            if product.purchased {
                context.move(to: CGPoint(x: margin + 2, y: height - y - 6))
                context.addLine(to: CGPoint(x: margin + 4, y: height - y - 9))
                context.addLine(to: CGPoint(x: margin + 9, y: height - y - 3))
                context.strokePath()
            }
            paragraph(product.name, bold: true, indent: 18)
            if !product.quantityLabel.isEmpty { paragraph("Quantità: \(product.quantityLabel)", size: 10, indent: 18) }
            if !product.notes.isEmpty { paragraph("Note: \(product.notes)", size: 10, indent: 18) }
            if product.purchased { paragraph("Acquistato", size: 9, indent: 18) }
            y += 12
        }
        context.endPDFPage()
        context.closePDF()
        return output as Data
    }
}
