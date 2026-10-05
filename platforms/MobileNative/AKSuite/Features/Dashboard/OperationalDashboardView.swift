import SwiftUI

private struct DashboardEntry: Decodable, Identifiable {
    let id: UUID
    let title: String
    let date: String?
    let allDay: Bool?

    enum CodingKeys: String, CodingKey {
        case id, title, date
        case allDay = "all_day"
    }
}

private struct DashboardDeadline: Identifiable {
    let entry: DashboardEntry
    let kind: String
    var id: String { "\(kind)-\(entry.id)" }
}

struct OperationalDashboardView: View {
    let onNavigate: (String) -> Void
    let onOpen: (String, UUID) -> Void
    let onCreate: (String) -> Void
    @State private var agenda: [DashboardEntry] = []
    @State private var todos: [DashboardEntry] = []
    @State private var deadlines: [DashboardDeadline] = []
    @State private var loading = true
    @State private var errorMessage: String?
    @State private var requestID = UUID()
    @ScaledMetric(relativeTo: .body) private var panelWidth: CGFloat = 280

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 12) {
                    Text(Date.now.formatted(.dateTime.weekday(.wide).day().month(.wide))).font(.subheadline).foregroundStyle(.secondary)
                    Text("Il tuo spazio operativo").font(.largeTitle.bold())
                    Text("Oggi, le attività aperte e le prossime scadenze. Tutte le sezioni sono nel menu.").foregroundStyle(.secondary)
                    ViewThatFits(in: .horizontal) {
                        HStack { quickActions }
                        VStack(alignment: .leading) { quickActions }
                    }
                }
                .padding(24).frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(hex: "#f8dfb9")).clipShape(RoundedRectangle(cornerRadius: 24))
                if let errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                    Button("Riprova") { Task { await load() } }
                }
                if loading { ProgressView("Aggiorno il riepilogo...").frame(maxWidth: .infinity) }
                if !loading && errorMessage == nil {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: panelWidth), spacing: 16, alignment: .top)], alignment: .leading, spacing: 16) {
                        panel(title: "Agenda di oggi", icon: "calendar", empty: "Nessun appuntamento oggi.", rows: agenda, kind: "event", section: "calendar")
                        panel(title: "Cose da fare", icon: "checklist", empty: "Nessuna attività da fare.", rows: todos, kind: "todo", section: "todos")
                        VStack(alignment: .leading, spacing: 14) {
                            Label("Scadenze e richiami", systemImage: "clock").font(.headline)
                            if deadlines.isEmpty { Text("Nessuna scadenza o richiamo nei prossimi 14 giorni.").font(.subheadline).foregroundStyle(.secondary) }
                            ForEach(deadlines) { row(entry: $0.entry, kind: $0.kind) }
                            footnote
                        }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 20))
                    }
                    Text("Le scadenze includono lavorazioni, richiami e promemoria dei pagamenti, anche arretrati. Per rate e anticipi apri Pagamenti dal menu.")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }.padding(20).frame(maxWidth: 1400)
        }
        .background(Color(hex: "#efe8d8"))
        .refreshable { await load() }
        .task { await load() }
    }

    private var quickActions: some View {
        Group {
            Button { onCreate("event") } label: { Label("Evento", systemImage: "plus") }
            Button { onCreate("todo") } label: { Label("Attività", systemImage: "plus") }
            Button { onCreate("note") } label: { Label("Nota", systemImage: "plus") }
        }.buttonStyle(.borderedProminent).tint(Color(hex: "#2d2754"))
    }

    private var footnote: some View {
        Text("Al massimo 5 elementi, non il totale della sezione.").font(.caption).foregroundStyle(.secondary)
    }

    private func panel(title: String, icon: String, empty: String, rows: [DashboardEntry], kind: String, section: String) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Label(title, systemImage: icon).font(.headline)
            if rows.isEmpty { Text(empty).font(.subheadline).foregroundStyle(.secondary) }
            ForEach(rows) { row(entry: $0, kind: kind) }
            footnote
            Button("Apri \(section == "calendar" ? "calendario" : "cose da fare")") { onNavigate(section) }
        }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private func row(entry: DashboardEntry, kind: String) -> some View {
        Button { onOpen(kind, entry.id) } label: {
            VStack(alignment: .leading, spacing: 5) {
                Text(entry.title).font(.subheadline.bold()).lineLimit(2)
                Text("\(kindLabel(kind)) · \(entry.allDay == true ? "Tutto il giorno" : dateLabel(entry.date, kind: kind))").font(.caption).foregroundStyle(.secondary)
            }.padding(12).frame(maxWidth: .infinity, alignment: .leading).background(.white.opacity(0.6)).clipShape(RoundedRectangle(cornerRadius: 12))
        }.buttonStyle(.plain)
    }

    private func dateLabel(_ value: String?, kind: String) -> String {
        guard let value else { return "Senza scadenza" }
        if let date = NativeDates.parse(value) {
            return kind == "event" ? date.formatted(date: .abbreviated, time: .shortened) : date.formatted(date: .abbreviated, time: .omitted)
        }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        if let date = formatter.date(from: value) { return date.formatted(date: .abbreviated, time: .omitted) }
        return value
    }

    private func kindLabel(_ kind: String) -> String {
        switch kind {
        case "event": return "Evento"
        case "todo": return "Attività"
        case "call": return "Richiamo"
        case "work_item": return "Lavorazione"
        default: return "Promemoria pagamento"
        }
    }

    @MainActor private func load() async {
        guard !Task.isCancelled else { return }
        loading = true
        let ticket = UUID()
        requestID = ticket
        errorMessage = nil
        do {
            let calendar = Calendar.current
            let start = calendar.startOfDay(for: .now)
            guard let end = calendar.date(byAdding: .day, value: 1, to: start),
                  let horizon = calendar.date(byAdding: .day, value: 14, to: end) else {
                throw NativeIntegrationError.message("Impossibile calcolare le date del riepilogo.")
            }
            let client = SupabaseService.shared
            async let eventResult: [DashboardEntry] = client.from("events").select("id,title,date:start_date,all_day")
                .eq("is_completed", value: false).is("archived_at", value: nil).lt("start_date", value: end.ISO8601Format())
                .or("end_date.gte.\(start.ISO8601Format()),and(end_date.is.null,start_date.gte.\(start.ISO8601Format()))")
                .order("start_date").order("id").limit(5).execute().value
            async let todoResult: [DashboardEntry] = client.from("work_items").select("id,title,date:due_date")
                .eq("kind", value: "todo").neq("status", value: "completed").is("archived_at", value: nil)
                .order("due_date", nullsFirst: false).order("id").limit(5).execute().value
            async let callResult: [DashboardEntry] = client.from("calls").select("id,title:caller_name,date:follow_up_date")
                .eq("follow_up", value: true).in("status", values: ["pending", "in_corso"]).lte("follow_up_date", value: horizon.ISO8601Format())
                .order("follow_up_date").order("id").limit(5).execute().value
            async let workResult: [DashboardEntry] = client.from("work_items").select("id,title,date:due_date")
                .eq("kind", value: "work").neq("status", value: "completed").is("archived_at", value: nil)
                .lte("due_date", value: horizon.ISO8601Format()).order("due_date").order("id").limit(5).execute().value
            async let paymentResult: [DashboardEntry] = client.from("payments").select("id,title:payment_type,date:reminder_at")
                .lte("reminder_at", value: horizon.ISO8601Format()).order("reminder_at").order("id").limit(5).execute().value
            let (events, tasks, calls, work, payments) = try await (eventResult, todoResult, callResult, workResult, paymentResult)
            guard !Task.isCancelled && requestID == ticket else { return }
            agenda = events
            todos = tasks
            deadlines = (calls.map { DashboardDeadline(entry: $0, kind: "call") }
                + work.map { DashboardDeadline(entry: $0, kind: "work_item") }
                + payments.map { DashboardDeadline(entry: $0, kind: "payment") })
                .sorted { ($0.entry.date ?? "", $0.id) < ($1.entry.date ?? "", $1.id) }.prefix(5).map { $0 }
        } catch {
            if !Task.isCancelled && requestID == ticket { errorMessage = "Impossibile aggiornare il riepilogo: \(error.localizedDescription)" }
        }
        if requestID == ticket { loading = false }
    }
}
