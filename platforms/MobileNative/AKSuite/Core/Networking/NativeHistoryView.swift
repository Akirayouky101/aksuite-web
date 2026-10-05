import SwiftUI
import Supabase

struct NativeHistoryView: View {
    struct Row: Decodable, Identifiable {
        let id: UUID
        let title: String
        let completedAt: String
        enum CodingKeys: String, CodingKey { case id, title; case completedAt = "completed_at" }
    }
    let kind: String
    let state: NativeHistoryState
    var clientID: UUID? = nil
    var changedItem: NativeHistoryChange? = nil
    let onOpen: (UUID) -> Void
    @EnvironmentObject private var auth: AuthViewModel
    @State private var rows: [Row] = []
    @State private var title = ""
    @State private var filterDates = false
    @State private var from = Date.now
    @State private var until = Date.now
    @State private var busy = false
    @State private var error: String?
    @State private var searched = false
    @State private var more = false
    @State private var criteria: (String, Date?, Date?) = ("", nil, nil)
    @State private var invalidated: Set<UUID> = []
    @State private var cursor: Row?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Lo storico resta nel database. Carica 5 elementi alla volta, solo su richiesta. Le eseguite passano in archivio dopo 7 giorni.").font(.caption)
            TextField("Titolo", text: $title).textFieldStyle(.roundedBorder)
            Toggle("Filtra per data di completamento", isOn: $filterDates)
            if filterDates {
                DatePicker("Dal", selection: $from, displayedComponents: .date)
                DatePicker("Al", selection: $until, displayedComponents: .date)
            }
            Button(busy ? "Caricamento..." : "Cerca / carica 5") { Task { await search() } }.disabled(busy)
            if let error { Text(error).foregroundStyle(.red).font(.caption) }
            ForEach(rows) { row in
                Button { onOpen(row.id) } label: {
                    VStack(alignment: .leading) {
                        Text(row.title).bold()
                        Text(NativeDates.parse(row.completedAt)?.formatted(date: .abbreviated, time: .shortened) ?? row.completedAt).font(.caption)
                    }.frame(maxWidth: .infinity, alignment: .leading).padding().background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            if searched && rows.isEmpty { Text("Nessun risultato.") }
            if more { Button("Carica altre 5") { Task { await search(loadMore: true) } }.disabled(busy) }
        }
        .onChange(of: changedItem) { change in
            if let change { invalidated.insert(change.id); rows.removeAll { $0.id == change.id } }
        }
    }

    @MainActor private func search(loadMore: Bool = false) async {
        guard !busy else { return }
        busy = true; error = nil
        defer { busy = false }
        let owner = auth.session?.user.id
        do {
            guard owner != nil else { throw NativeIntegrationError.message("Accedi per consultare lo storico.") }
            var input = criteria
            if !loadMore {
                invalidated.removeAll()
                let start = filterDates ? NativeDates.romeCalendar.startOfDay(for: from) : nil
                let end = filterDates ? NativeDates.romeCalendar.date(byAdding: .day, value: 1, to: NativeDates.romeCalendar.startOfDay(for: until)) : nil
                if let start, let end, end <= start { throw NativeIntegrationError.message("La data finale deve seguire quella iniziale.") }
                input = (title.trimmingCharacters(in: .whitespacesAndNewlines), start, end)
            }
            let isEvent = kind == "event"
            var query = SupabaseService.shared.from(isEvent ? "events" : "work_items").select("id,title,completed_at")
            if isEvent { query = query.eq("is_completed", value: true) }
            else { query = query.eq("kind", value: "todo").eq("status", value: "completed") }
            query = state == .archived ? query.not("archived_at", operator: .is, value: "null") : query.is("archived_at", value: nil)
            if let clientID { query = query.eq("client_id", value: clientID.uuidString) }
            if !input.0.isEmpty {
                let term = input.0.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "%", with: "\\%").replacingOccurrences(of: "_", with: "\\_")
                query = query.ilike("title", pattern: "%\(term)%")
            }
            if let start = input.1 { query = query.gte("completed_at", value: ISO8601DateFormatter().string(from: start)) }
            if let end = input.2 { query = query.lt("completed_at", value: ISO8601DateFormatter().string(from: end)) }
            if loadMore, let last = cursor {
                query = query.or("completed_at.lt.\(last.completedAt),and(completed_at.eq.\(last.completedAt),id.lt.\(last.id.uuidString))")
            }
            let page: [Row] = try await query.order("completed_at", ascending: false).order("id", ascending: false).limit(6).execute().value
            guard auth.session?.user.id == owner else { return }
            rows = (loadMore ? rows : []) + Array(page.prefix(5)).filter { !invalidated.contains($0.id) }
            cursor = page.prefix(5).last
            criteria = input; more = page.count > 5; searched = true
        } catch { self.error = error.localizedDescription }
    }
}

enum NativeIntegrationError: LocalizedError {
    case message(String)
    var errorDescription: String? { if case .message(let value) = self { return value }; return nil }
}
