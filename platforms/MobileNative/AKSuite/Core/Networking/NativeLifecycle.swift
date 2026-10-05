import Foundation

enum NativeHistoryState: String, CaseIterable, Identifiable {
    case pending, completed, archived
    var id: String { rawValue }
    var title: String {
        switch self {
        case .pending: return "Da fare"
        case .completed: return "Eseguite"
        case .archived: return "Archiviate"
        }
    }
}

struct NativeHistoryChange: Equatable {
    let id: UUID
    let revision = UUID()
}

enum NativeDates {
    static func parse(_ value: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: value) ?? ISO8601DateFormatter().date(from: value)
    }
    static var romeCalendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Europe/Rome")!
        return calendar
    }
}

struct CalendarEvent: Codable, Identifiable, Equatable {
    let id: UUID
    var clientID: UUID?
    var workItemID: UUID?
    var title: String
    var description: String?
    var startDate: String
    var endDate: String?
    var allDay: Bool
    var clientConfirmed: Bool
    var location: String?
    var color: String
    var isRecurring: Bool
    var recurringType: String?
    var reminderMinutes: Int?
    var isCompleted: Bool
    var completedAt: String?
    var archivedAt: String?

    enum CodingKeys: String, CodingKey {
        case id, title, description, location, color
        case clientID = "client_id"
        case workItemID = "work_item_id"
        case startDate = "start_date"
        case endDate = "end_date"
        case allDay = "all_day"
        case clientConfirmed = "client_confirmed"
        case isRecurring = "is_recurring"
        case recurringType = "recurring_type"
        case reminderMinutes = "reminder_minutes"
        case isCompleted = "is_completed"
        case completedAt = "completed_at"
        case archivedAt = "archived_at"
    }
}
