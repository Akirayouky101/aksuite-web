import Foundation

@main enum NativeLifecycleTests {
    static func main() throws {
        func check(_ condition: @autoclosure () throws -> Bool, _ message: String) throws {
            if try !condition() { throw NSError(domain: "NativeLifecycleTests", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
        }
        let json = """
        {"id":"00000000-0000-4000-8000-000000000001","title":"Test","start_date":"2026-10-05T14:00:00.123+00:00",
        "end_date":null,"all_day":false,"client_confirmed":false,"color":"blue","is_recurring":false,
        "reminder_minutes":null,"is_completed":true,"completed_at":"2026-10-05T14:01:00.000Z","archived_at":null}
        """
        let event = try JSONDecoder().decode(CalendarEvent.self, from: Data(json.utf8))
        try check(event.isCompleted && event.reminderMinutes == nil, "Google events with NULL reminders must decode")
        try check(event.completedAt != nil && event.archivedAt == nil, "Completion state must survive decoding")
        try check(NativeDates.parse(event.startDate) != nil, "Fractional Postgres timestamps must parse")
        try check(NativeDates.parse("2026-10-05T14:00:00Z") != nil, "Whole-second timestamps must parse")
        try check(NativeDates.parse("invalid") == nil, "Invalid timestamps must not invent current dates")
        let calendar = NativeDates.romeCalendar
        let spring = NativeDates.parse("2026-03-28T23:00:00Z")!
        let autumn = NativeDates.parse("2026-10-24T22:00:00Z")!
        try check(calendar.date(byAdding: .day, value: 1, to: spring)!.timeIntervalSince(spring) == 23 * 3600, "Rome spring DST day")
        try check(calendar.date(byAdding: .day, value: 1, to: autumn)!.timeIntervalSince(autumn) == 25 * 3600, "Rome autumn DST day")
        try check(NativeHistoryState.allCases.map(\.title) == ["Da fare", "Eseguite", "Archiviate"], "Three lifecycle sections")
        try check(NativeHistoryChange(id: event.id) != NativeHistoryChange(id: event.id), "Repeated changes to the same record must invalidate history again")
        print("Native lifecycle tests passed: decoding, NULL reminders, timestamps, DST and repeated history invalidation.")
    }
}
