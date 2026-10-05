import SwiftUI

private struct DashboardNote: Decodable, Identifiable {
    let id: UUID
    let title: String
    let content: String?
    let isPinned: Bool
    let color: String

    enum CodingKeys: String, CodingKey {
        case id, title, content, color
        case isPinned = "is_pinned"
    }
}

private struct DashboardCall: Decodable, Identifiable {
    let id: UUID
    let callerName: String
    let company: String?
    let followUp: Bool
    let followUpDate: String?
    let status: String

    enum CodingKeys: String, CodingKey {
        case id, company, status
        case callerName = "caller_name"
        case followUp = "follow_up"
        case followUpDate = "follow_up_date"
    }
}

private struct DashboardEvent: Decodable, Identifiable {
    let id: UUID
    let title: String
    let location: String?
    let startDate: String

    enum CodingKeys: String, CodingKey {
        case id, title, location
        case startDate = "start_date"
    }
}

private struct DashboardWorkItem: Decodable, Identifiable {
    let id: UUID
    let title: String
    let status: String
    let dueDate: String?
    let scheduledAt: String?
    let nextAction: String

    enum CodingKeys: String, CodingKey {
        case id, title, status
        case dueDate = "due_date"
        case scheduledAt = "scheduled_at"
        case nextAction = "next_action"
    }
}

private struct ResourceID: Decodable {
    let id: UUID
}

private struct DashboardCounts {
    var calls = 0
    var events = 0
    var notes = 0
    var passwords = 0
    var clients = 0
    var payments = 0
    var workItems = 0
    var todos = 0
}

private struct AgendaItem: Identifiable {
    enum Kind { case call, event, workItem }

    let id: UUID
    let title: String
    let detail: String
    let date: Date
    let kind: Kind
    var isAllDay = false
}

struct DashboardView: View {
    @EnvironmentObject private var auth: AuthViewModel
    let onOpenCalls: () -> Void
    let onOpenCalendar: () -> Void
    let onOpenNotes: () -> Void
    let onOpenPasswords: () -> Void
    let onOpenClients: () -> Void
    let onOpenPayments: () -> Void
    let onOpenWorkItems: () -> Void
    let onOpenTodos: () -> Void
    let onOpenShopping: () -> Void
    @State private var notes: [DashboardNote] = []
    @State private var counts = DashboardCounts()
    @State private var agenda: [AgendaItem] = []
    @State private var noteIndex = 0
    @State private var selectedDashboardNote: DashboardNote?
    @State private var isLoading = true

    private let columns = [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)]

    init(onOpenCalls: @escaping () -> Void = {}, onOpenCalendar: @escaping () -> Void = {}, onOpenNotes: @escaping () -> Void = {}, onOpenPasswords: @escaping () -> Void = {}, onOpenClients: @escaping () -> Void = {}, onOpenPayments: @escaping () -> Void = {}, onOpenWorkItems: @escaping () -> Void = {}, onOpenTodos: @escaping () -> Void = {}, onOpenShopping: @escaping () -> Void = {}) {
        self.onOpenCalls = onOpenCalls
        self.onOpenCalendar = onOpenCalendar
        self.onOpenNotes = onOpenNotes
        self.onOpenPasswords = onOpenPasswords
        self.onOpenClients = onOpenClients
        self.onOpenPayments = onOpenPayments
        self.onOpenWorkItems = onOpenWorkItems
        self.onOpenTodos = onOpenTodos
        self.onOpenShopping = onOpenShopping
    }

    var body: some View {
        ZStack {
            background
            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    header
                    hero
                    shortcuts
                    agendaPanel
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
            .refreshable { await loadDashboard() }

            .overlay {
                if let note = selectedDashboardNote {
                    DashboardNoteSummaryView(note: note, onClose: { withAnimation(.easeOut(duration: 0.2)) { selectedDashboardNote = nil } }, onOpenNotes: {
                        selectedDashboardNote = nil
                        onOpenNotes()
                    })
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
                }
            }

            if isLoading {
                ProgressView("Aggiorno la tua suite...")
                    .tint(Color(hex: "#e45f4e"))
                    .foregroundStyle(Color(hex: "#2d2754"))
                    .padding(20)
                    .background(Color(hex: "#f8e8cf"))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .shadow(color: Color.black.opacity(0.12), radius: 14, y: 6)
            }
        }
        .task { await loadDashboard() }
    }

    private var background: some View {
        ZStack {
            Color(hex: "#efe8d8").ignoresSafeArea()
            Circle().fill(Color(hex: "#f7c948").opacity(0.28)).frame(width: 210).offset(x: -155, y: -340)
            Circle().fill(Color(hex: "#76a9f7").opacity(0.23)).frame(width: 250).offset(x: 165, y: 390)
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            Image(systemName: "key.fill")
                .font(.title3.weight(.bold))
                .foregroundStyle(Color(hex: "#2d2754"))
                .frame(width: 44, height: 44)
                .background(Color(hex: "#ff765f"))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .rotationEffect(.degrees(-3))
            VStack(alignment: .leading, spacing: 2) {
                Text("AK SUITE").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                Text("PERSONAL EDITION").font(.caption2.weight(.bold)).foregroundStyle(Color(hex: "#8a7f9f"))
            }
            Spacer()
            Menu {
                Button(role: .destructive) { Task { await auth.signOut() } } label: {
                    Label("Esci", systemImage: "rectangle.portrait.and.arrow.right")
                }
            } label: {
                Image(systemName: "ellipsis").font(.headline.weight(.bold)).foregroundStyle(Color(hex: "#716a91"))
                    .frame(width: 44, height: 44).background(Color(hex: "#f8e8cf")).clipShape(Circle())
            }
            .accessibilityLabel("Opzioni account")
        }
        .padding(12)
        .background(Color(hex: "#fff8ed"))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color(hex: "#d8cbb8"), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: Color(hex: "#5e4931").opacity(0.1), radius: 14, y: 7)
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text(Date.now.formatted(.dateTime.weekday(.wide).day().month(.wide)).capitalized)
                .font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: "#716a91"))
            Text("Buongiorno,\nfacciamo ordine.")
                .font(.system(size: 38, weight: .black, design: .rounded))
                .foregroundStyle(Color(hex: "#2d2754"))
                .fixedSize(horizontal: false, vertical: true)
            Text("Il tuo centro operativo per le cose che contano davvero oggi.")
                .font(.subheadline).foregroundStyle(Color(hex: "#514b70"))
            stickyNote
        }
        .padding(22)
        .background(Color(hex: "#f8dfb9"))
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color(hex: "#e7c792"), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .shadow(color: Color(hex: "#5e4931").opacity(0.13), radius: 18, y: 9)
    }

    @ViewBuilder
    private var stickyNote: some View {
        if let note = notes[safe: noteIndex] {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "note.text").font(.headline).foregroundStyle(Color(hex: "#e45f4e"))
                        .frame(width: 32, height: 32).background(.white.opacity(0.62)).clipShape(RoundedRectangle(cornerRadius: 9))
                    Spacer()
                    Text("\(noteIndex + 1)/\(notes.count)").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                }
                Text(note.title).font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")).lineLimit(1)
                Text(note.content?.isEmpty == false ? note.content! : "Nessun contenuto")
                    .font(.caption).foregroundStyle(Color(hex: "#716a91")).lineLimit(2).frame(maxWidth: .infinity, alignment: .leading)
                if notes.count > 1 {
                    HStack {
                        Button { cycleNote(by: -1) } label: { Image(systemName: "chevron.left") }
                        Spacer()
                        HStack(spacing: 4) {
                            ForEach(notes.indices, id: \.self) { index in
                                Capsule().fill(index == noteIndex ? Color(hex: "#e45f4e") : Color(hex: "#d8cbb8"))
                                    .frame(width: index == noteIndex ? 16 : 6, height: 6)
                            }
                        }
                        Spacer()
                        Button { cycleNote(by: 1) } label: { Image(systemName: "chevron.right") }
                    }
                    .font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#716a91"))
                }
            }
            .padding(18)
            .background(stickyColor(note.color))
            .overlay(alignment: .top) { RoundedRectangle(cornerRadius: 2).fill(tapeColor(note.color)).frame(width: 46, height: 13).offset(y: -7) }
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(stickyBorder(note.color), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 18)).rotationEffect(.degrees(-1.5)).padding(.top, 6)
            .contentShape(RoundedRectangle(cornerRadius: 18))
            .onTapGesture { withAnimation(.spring(response: 0.34, dampingFraction: 0.82)) { selectedDashboardNote = note } }
        } else {
            VStack(alignment: .leading, spacing: 10) {
                Image(systemName: "sparkles").font(.title2).foregroundStyle(Color(hex: "#e45f4e"))
                Text("Nessun appunto in vista").font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: "#716a91"))
            }
            .frame(maxWidth: .infinity, alignment: .leading).padding(18).background(Color(hex: "#fff1d9"))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color(hex: "#e2a66d"), style: StrokeStyle(lineWidth: 1, dash: [5])))
            .clipShape(RoundedRectangle(cornerRadius: 18))
        }
    }

    private var shortcuts: some View {
        LazyVGrid(columns: columns, spacing: 14) {
            DashboardShortcut(title: "Chiamate", count: counts.calls, icon: "phone.fill", fill: "#ff765f", ink: "#a9322b", action: onOpenCalls)
            DashboardShortcut(title: "Calendario", count: counts.events, icon: "calendar", fill: "#f7c948", ink: "#785b00", action: onOpenCalendar)
            DashboardShortcut(title: "Note", count: counts.notes, icon: "note.text", fill: "#8ed8c3", ink: "#176653", action: onOpenNotes)
            DashboardShortcut(title: "Password", count: counts.passwords, icon: "key.fill", fill: "#9d8cff", ink: "#4b3ba5", action: onOpenPasswords)
            DashboardShortcut(title: "Rubrica", count: counts.clients, icon: "person.2.fill", fill: "#76a9f7", ink: "#174a9b", action: onOpenClients)
            DashboardShortcut(title: "Pagamenti", count: counts.payments, icon: "creditcard.fill", fill: "#cfe4ff", ink: "#376db5", action: onOpenPayments)
            DashboardShortcut(title: "Lavorazioni", count: counts.workItems, icon: "briefcase.fill", fill: "#d9e8d9", ink: "#257259", action: onOpenWorkItems)
            DashboardShortcut(title: "Cose da fare", count: counts.todos, icon: "checklist", fill: "#f7c948", ink: "#785b00", action: onOpenTodos)
            Button(action: onOpenShopping) {
                VStack(alignment: .leading, spacing: 14) {
                    Image(systemName: "cart.fill").font(.title2)
                    Text("Spesa").font(.headline.weight(.black))
                    Text("Liste personali e PDF").font(.caption)
                }
                .foregroundStyle(Color(hex: "#257259"))
                .padding(18).frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(hex: "#d9e8d9")).clipShape(RoundedRectangle(cornerRadius: 20))
            }.buttonStyle(.plain)
        }
    }

    private var agendaPanel: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("AGENDA PROSSIMA").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#e45f4e"))
                    Text("Parte chiamate").font(.title3.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                }
                Spacer()
                Image(systemName: "bell.badge.fill").font(.title3).foregroundStyle(Color(hex: "#5f9e8e"))
            }
            if agenda.isEmpty {
                Label("Nessuna scadenza imminente.", systemImage: "checkmark.circle.fill")
                    .font(.subheadline).foregroundStyle(Color(hex: "#5f9e8e"))
            } else {
                ForEach(agenda) { item in
                    Button {
                        switch item.kind {
                        case .call: onOpenCalls()
                        case .event: onOpenCalendar()
                        case .workItem: onOpenWorkItems()
                        }
                    } label: {
                        AgendaRow(item: item)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(20).background(Color(hex: "#d9e8d9"))
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(Color(hex: "#b8d0c0"), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }

    private func loadDashboard() async {
        isLoading = true
        async let notesRequest = fetchNotes()
        async let callsRequest = fetchCalls()
        async let eventsRequest = fetchEvents()
        async let workItemsRequest = fetchWorkItems()
        async let callsCount = resourceCount("calls")
        async let eventsCount = resourceCount("events")
        async let notesCount = resourceCount("notes")
        async let passwordsCount = resourceCount("passwords")
        async let clientsCount = resourceCount("clients")
        async let paymentsCount = resourceCount("payments")
        async let workItemsCount = workCount(kind: "work")
        async let todosCount = workCount(kind: "todo")

        notes = await notesRequest
        agenda = makeAgenda(calls: await callsRequest, events: await eventsRequest, workItems: await workItemsRequest)
        counts = DashboardCounts(calls: await callsCount, events: await eventsCount, notes: await notesCount, passwords: await passwordsCount, clients: await clientsCount, payments: await paymentsCount, workItems: await workItemsCount, todos: await todosCount)
        noteIndex = min(noteIndex, max(notes.count - 1, 0))
        isLoading = false
    }

    private func fetchNotes() async -> [DashboardNote] {
        (try? await SupabaseService.shared.from("notes").select().order("is_pinned", ascending: false).order("updated_at", ascending: false).limit(8).execute().value) ?? []
    }

    private func fetchCalls() async -> [DashboardCall] {
        (try? await SupabaseService.shared.from("calls").select().order("follow_up_date", ascending: true).execute().value) ?? []
    }

    private func fetchEvents() async -> [DashboardEvent] {
        (try? await SupabaseService.shared.from("events").select().order("start_date", ascending: true).execute().value) ?? []
    }

    private func fetchWorkItems() async -> [DashboardWorkItem] {
        (try? await SupabaseService.shared.from("work_items").select("id,title,status,due_date,scheduled_at,next_action").eq("kind", value: "work").execute().value) ?? []
    }

    private func workCount(kind: String) async -> Int {
        let resources: [ResourceID] = (try? await SupabaseService.shared.from("work_items").select("id").eq("kind", value: kind).execute().value) ?? []
        return resources.count
    }

    private func resourceCount(_ table: String) async -> Int {
        let resources: [ResourceID] = (try? await SupabaseService.shared.from(table).select("id").execute().value) ?? []
        return resources.count
    }

    private func makeAgenda(calls: [DashboardCall], events: [DashboardEvent], workItems: [DashboardWorkItem]) -> [AgendaItem] {
        let cutoff = Calendar.current.date(byAdding: .day, value: 14, to: .now) ?? .now
        let callItems = calls.compactMap { call -> AgendaItem? in
            guard call.followUp, call.status != "completed", call.status != "cancelled", let value = call.followUpDate, let date = parseDate(value), date <= cutoff else { return nil }
            return AgendaItem(id: call.id, title: call.callerName, detail: call.company ?? "Richiamo", date: date, kind: .call)
        }
        let eventItems = events.compactMap { event -> AgendaItem? in
            guard let date = parseDate(event.startDate), date <= cutoff else { return nil }
            return AgendaItem(id: event.id, title: event.title, detail: event.location ?? "Appuntamento", date: date, kind: .event)
        }
        let workItems = workItems.compactMap { item -> AgendaItem? in
            guard item.status != "completed" else { return nil }
            if let scheduledAt = item.scheduledAt, let date = parseDate(scheduledAt), date <= cutoff {
                return AgendaItem(id: item.id, title: item.title, detail: item.nextAction.isEmpty ? "Lavorazione" : item.nextAction, date: date, kind: .workItem)
            }
            if let dueDate = item.dueDate, let date = parseDate(dueDate), date <= cutoff {
                return AgendaItem(id: item.id, title: item.title, detail: item.nextAction.isEmpty ? "Scadenza lavorazione" : item.nextAction, date: date, kind: .workItem, isAllDay: true)
            }
            return nil
        }
        return (callItems + eventItems + workItems).sorted { $0.date < $1.date }.prefix(5).map { $0 }
    }

    private func parseDate(_ value: String) -> Date? {
        ISO8601DateFormatter().date(from: value) ?? DateFormatter.shortISO8601.date(from: value)
    }

    private func cycleNote(by offset: Int) {
        guard !notes.isEmpty else { return }
        noteIndex = (noteIndex + offset + notes.count) % notes.count
    }

    private func stickyColor(_ color: String) -> Color {
        switch color.lowercased() { case "blue": Color(hex: "#dfefff"); case "green": Color(hex: "#e3f6ea"); case "red", "coral": Color(hex: "#ffe1da"); case "purple": Color(hex: "#ece3ff"); default: Color(hex: "#fff3c9") }
    }

    private func stickyBorder(_ color: String) -> Color {
        switch color.lowercased() { case "blue": Color(hex: "#a9cff2"); case "green": Color(hex: "#a9dcc0"); case "red", "coral": Color(hex: "#f0aa9b"); case "purple": Color(hex: "#c6b4f2"); default: Color(hex: "#eccf7a") }
    }

    private func tapeColor(_ color: String) -> Color {
        switch color.lowercased() { case "blue": Color(hex: "#cfe4ff"); case "green": Color(hex: "#c8ecd6"); case "red", "coral": Color(hex: "#ffd0c4"); case "purple": Color(hex: "#ddd0ff"); default: Color(hex: "#ffe8a3") }
    }
}

private struct DashboardNoteSummaryView: View {
    let note: DashboardNote
    let onClose: () -> Void
    let onOpenNotes: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "note.text")
                    .font(.headline)
                    .foregroundStyle(Color(hex: "#e45f4e"))
                    .frame(width: 44, height: 44)
                    .background(Color.white.opacity(0.64))
                    .clipShape(RoundedRectangle(cornerRadius: 13))
                VStack(alignment: .leading, spacing: 4) {
                    Text(note.title).font(.title3.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                    if note.isPinned { Label("In evidenza", systemImage: "pin.fill").font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#e45f4e")) }
                }
                Spacer()
                Button(action: onClose) { Image(systemName: "xmark").foregroundStyle(Color(hex: "#8a7f9f")).frame(width: 36, height: 36).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 11)) }
            }

            VStack(alignment: .leading, spacing: 8) {
                Label("CONTENUTO", systemImage: "text.alignleft").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                Text(note.content?.isEmpty == false ? note.content! : "Nessun contenuto")
                    .font(.body).foregroundStyle(Color(hex: "#514b70"))
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(16)
            .background(Color(hex: "#fff8ed"))
            .clipShape(RoundedRectangle(cornerRadius: 14))

            Button(action: onOpenNotes) {
                Label("Apri Note", systemImage: "arrow.up.right.square")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(LinearGradient(colors: [Color(hex: "#e95d50"), Color(hex: "#efa633")], startPoint: .leading, endPoint: .trailing))
                    .clipShape(RoundedRectangle(cornerRadius: 13))
            }
        }
        .padding(22)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(noteColor)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .padding(16)
    }

    private var noteColor: Color { ["blue": "#dfefff", "green": "#e3f6ea", "yellow": "#fff3c9", "red": "#ffe1da", "purple": "#ece3ff", "pink": "#fce2ef", "orange": "#ffe5c9", "gray": "#f1f3f5"][note.color].map(Color.init(hex:)) ?? Color(hex: "#fff3c9") }
}

private struct DashboardShortcut: View {
    let title: String
    let count: Int
    let icon: String
    let fill: String
    let ink: String
    var action: (() -> Void)?

    var body: some View {
        if let action {
            Button(action: action) { card }
                .buttonStyle(.plain)
                .accessibilityLabel("Apri \(title)")
        } else {
            card
        }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 20) {
            Image(systemName: icon).font(.headline).foregroundStyle(Color(hex: ink))
                .frame(width: 42, height: 42).background(Color(hex: fill)).clipShape(RoundedRectangle(cornerRadius: 13))
            HStack(alignment: .lastTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(count)").font(.title.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                    Text(title).font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#716a91"))
                }
                Spacer()
                Image(systemName: "arrow.up.right").font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#a99dbb"))
            }
        }
        .padding(16).frame(maxWidth: .infinity, minHeight: 142, alignment: .leading).background(Color(hex: "#fff8ed"))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color(hex: "#d8cbb8"), lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 18))
        .shadow(color: Color(hex: "#5e4931").opacity(0.08), radius: 10, y: 5)
    }
}

private struct AgendaRow: View {
    let item: AgendaItem

    var body: some View {
        HStack(spacing: 10) {
            Text(isOverdue ? "!" : "\(Calendar.current.component(.day, from: item.date))")
                .font(.caption.weight(.black)).foregroundStyle(foreground).frame(width: 32, height: 32).background(background).clipShape(RoundedRectangle(cornerRadius: 9))
            VStack(alignment: .leading, spacing: 2) {
                Text(item.title).font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: "#3e3860")).lineLimit(1)
                Text("\(item.detail) · \(item.isAllDay ? item.date.formatted(.dateTime.day().month(.abbreviated)) : item.date.formatted(.dateTime.day().month(.abbreviated).hour().minute()))")
                    .font(.caption).foregroundStyle(Color(hex: "#8a7f9f")).lineLimit(1)
            }
            Spacer(minLength: 0)
        }
        .padding(.bottom, 9).overlay(alignment: .bottom) { Rectangle().fill(Color(hex: "#5f7564").opacity(0.17)).frame(height: 1) }
    }

    private var isOverdue: Bool {
        if item.isAllDay { return Calendar.current.startOfDay(for: item.date) < Calendar.current.startOfDay(for: .now) }
        return item.date < .now
    }
    private var background: Color {
        switch item.kind { case .call: Color(hex: "#ffddd2"); case .event: Color(hex: "#fff0bf"); case .workItem: Color(hex: "#d9e8d9") }
    }
    private var foreground: Color {
        switch item.kind { case .call: Color(hex: "#c75143"); case .event: Color(hex: "#856300"); case .workItem: Color(hex: "#257259") }
    }
}

private extension Array {
    subscript(safe index: Index) -> Element? { indices.contains(index) ? self[index] : nil }
}

private extension DateFormatter {
    static let shortISO8601: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}

#Preview {
    DashboardView().environmentObject(AuthViewModel())
}