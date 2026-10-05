import Foundation

enum ShoppingUnit: String, Codable, CaseIterable, Identifiable {
    case pieces = "pezzi", grams = "g", kilograms = "kg", milliliters = "ml", liters = "l"
    var id: String { rawValue }
    var label: String {
        switch self {
        case .pieces: return "Pezzi"
        case .grams: return "Grammi (g)"
        case .kilograms: return "Chilogrammi (kg)"
        case .milliliters: return "Millilitri (ml)"
        case .liters: return "Litri (l)"
        }
    }
}

struct ShoppingListRecord: Codable, Identifiable {
    let id: UUID
    let userID: UUID
    let title: String
    enum CodingKeys: String, CodingKey {
        case id, title
        case userID = "user_id"
    }
}

struct ShoppingProduct: Codable, Identifiable {
    let id: UUID
    let listID: UUID
    let name: String
    let quantity: String
    let quantityValue: Decimal?
    let quantityUnit: ShoppingUnit?
    let notes: String
    let purchased: Bool
    enum CodingKeys: String, CodingKey {
        case id, name, quantity, notes, purchased
        case listID = "list_id"
        case quantityValue = "quantity_value"
        case quantityUnit = "quantity_unit"
    }
    var quantityLabel: String {
        guard let value = quantityValue, let unit = quantityUnit else { return quantity }
        return ShoppingValidation.quantityLabel(value, unit: unit)
    }
}

enum ShoppingValidation {
    static func title(_ value: String) throws -> String {
        let result = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (1...120).contains(result.unicodeScalars.count) else {
            throw ShoppingError.invalid("Il nome della lista deve contenere da 1 a 120 caratteri.")
        }
        return result
    }

    static func amount(_ text: String) throws -> Decimal {
        let normalized = text.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: ",", with: ".")
        guard normalized.range(of: #"^[0-9]+(?:\.[0-9]{1,3})?$"#, options: .regularExpression) != nil,
              let value = Decimal(string: normalized, locale: Locale(identifier: "en_US_POSIX")),
              value > 0, value <= 999999999 else {
            throw ShoppingError.invalid("Inserisci una quantità maggiore di zero, fino a 999999999 e con al massimo 3 decimali.")
        }
        return value
    }

    static func quantityLabel(_ value: Decimal, unit: ShoppingUnit) -> String {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "it_IT")
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 3
        let number = NSDecimalNumber(decimal: value)
        return "\(formatter.string(from: number) ?? number.stringValue) \(unit.rawValue)"
    }

    static func product(name: String, amount: String, unit: ShoppingUnit, notes: String) throws -> ShoppingProductPayload {
        let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (1...160).contains(cleanName.unicodeScalars.count) else {
            throw ShoppingError.invalid("Il prodotto deve contenere da 1 a 160 caratteri.")
        }
        guard cleanNotes.unicodeScalars.count <= 1000 else {
            throw ShoppingError.invalid("Le note non possono superare 1000 caratteri.")
        }
        let value = try self.amount(amount)
        return ShoppingProductPayload(name: cleanName, quantity: quantityLabel(value, unit: unit), quantityValue: value, quantityUnit: unit, notes: cleanNotes)
    }
}

enum ShoppingError: LocalizedError {
    case invalid(String)
    case missingUser
    var errorDescription: String? {
        switch self {
        case .invalid(let message): return message
        case .missingUser: return "Devi accedere per gestire la spesa."
        }
    }
}

struct ShoppingProductPayload: Encodable {
    let name: String
    let quantity: String
    let quantityValue: Decimal
    let quantityUnit: ShoppingUnit
    let notes: String
    var listID: UUID?
    enum CodingKeys: String, CodingKey {
        case name, quantity, notes
        case quantityValue = "quantity_value"
        case quantityUnit = "quantity_unit"
        case listID = "list_id"
    }
}
