import Foundation
import PDFKit

@main
enum ShoppingNativeTests {
    static func main() throws {
        func check(_ condition: @autoclosure () throws -> Bool, _ message: String) throws {
            if try !condition() { throw ShoppingError.invalid("Test failed: \(message)") }
        }
        func rejects(_ operation: () throws -> Void) throws {
            do { try operation() }
            catch { return }
            throw ShoppingError.invalid("Test failed: invalid input was accepted")
        }
        try check(try ShoppingValidation.amount("1,5") == Decimal(string: "1.5"), "Italian decimal input")
        try check(try ShoppingValidation.amount("0.001") == Decimal(string: "0.001"), "Minimum amount")
        try check(try ShoppingValidation.amount("999999999") == 999999999, "Maximum amount")
        for value in ["", "0", "-1", "NaN", "Infinity", "0.0001", "1.2345", "1000000000", "2 confezioni", "1,2,3"] {
            try rejects { _ = try ShoppingValidation.amount(value) }
        }
        try check(try ShoppingValidation.title(" Spesa ") == "Spesa", "Title trimming")
        try rejects { _ = try ShoppingValidation.title(String(repeating: "x", count: 121)) }
        try rejects { _ = try ShoppingValidation.product(name: " ", amount: "1", unit: .grams, notes: "") }
        try rejects { _ = try ShoppingValidation.product(name: "Pane", amount: "1", unit: .grams, notes: String(repeating: "x", count: 1001)) }
        for unit in ShoppingUnit.allCases {
            let payload = try ShoppingValidation.product(name: " Pane ", amount: "1,25", unit: unit, notes: " Integrale ")
            try check(payload.name == "Pane" && payload.notes == "Integrale", "Product trimming")
            try check(payload.quantity == "1,25 \(unit.rawValue)", "Unit formatting")
            let encoded = try JSONSerialization.jsonObject(with: JSONEncoder().encode(payload)) as? [String: Any]
            try check((encoded?["quantity_value"] as? NSNumber)?.doubleValue == 1.25, "Numeric JSON value")
            try check(encoded?["quantity_unit"] as? String == unit.rawValue, "Database unit key")
            try check(encoded?["list_id"] == nil, "Update must not move a product between lists")
        }
        let list = ShoppingListRecord(id: UUID(), userID: UUID(), title: "Spesa settimanale")
        let legacyJSON = """
        {"id":"\(UUID())","list_id":"\(list.id)","name":"Latte","quantity":"2 confezioni","quantity_value":null,"quantity_unit":null,"notes":"","purchased":false}
        """
        let legacy = try JSONDecoder().decode(ShoppingProduct.self, from: Data(legacyJSON.utf8))
        try check(legacy.quantityLabel == "2 confezioni", "Legacy text retained")
        let products = (0..<80).map { index in
            ShoppingProduct(
                id: UUID(), listID: list.id, name: "Prodotto \(index)", quantity: "old text",
                quantityValue: Decimal(string: "1.25"), quantityUnit: .kilograms,
                notes: String(repeating: "Nota lunga con dettagli. ", count: 35) + "Fine nota \(index)",
                purchased: index == 0
            )
        }
        let pdf = try ShoppingPDF.create(list: list, products: products)
        guard let document = PDFDocument(data: pdf), let text = document.string else {
            throw ShoppingError.invalid("Test failed: unreadable PDF")
        }
        try check(document.pageCount > 1, "Long PDF paginates")
        try check(text.contains("Prodotto 79") && text.contains("Fine nota 79"), "Final product and notes retained")
        try check(text.contains("1,25 kg"), "Numeric amount in PDF")
        try check(text.contains("Acquistato"), "Purchased state in PDF")
        if let pending = text.range(of: "Prodotto 1"), let purchased = text.range(of: "Prodotto 0") {
            try check(pending.lowerBound < purchased.lowerBound, "Pending products precede purchased products")
        } else { throw ShoppingError.invalid("Test failed: product labels missing") }
        for page in 0..<document.pageCount {
            try check(document.page(at: page)?.string?.contains("Copia PDF personale") == true, "Footer on each page")
        }
        let empty = PDFDocument(data: try ShoppingPDF.create(list: list, products: []))
        try check(empty?.string?.contains("Nessun prodotto nella lista.") == true, "Empty PDF")
        let legacyPDF = PDFDocument(data: try ShoppingPDF.create(list: list, products: [legacy]))
        try check(legacyPDF?.string?.contains("2 confezioni") == true, "Legacy quantity PDF")
        print("PASS: native numeric validation, units, Supabase encoding, legacy compatibility and paginated PDF.")
    }
}
