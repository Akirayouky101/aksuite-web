import SwiftUI

private struct CalendarClient: Decodable, Identifiable {
    let id: UUID
    let name: String
    let address: String
    let zipCode: String
    let city: String
    let province: String
    let parentClientID: UUID?

    enum CodingKeys: String, CodingKey {
        case id, name, address, city, province
        case zipCode = "zip_code"
        case parentClientID = "parent_client_id"
    }

    var location: String {
        [address, [zipCode, city].filter { !$0.isEmpty }.joined(separator: " "), province].filter { !$0.isEmpty }.joined(separator: ", ")
    }
}

private struct CalendarWorkItem: Decodable, Identifiable {
    let id: UUID
    let clientID: UUID?
    let title: String
    let kind: String

    enum CodingKeys: String, CodingKey {
        case id, title, kind
        case clientID = "client_id"
    }
}

private struct CalendarEventPayload: Encodable {
    let clientID: UUID?
    let workItemID: UUID?
    let title: String
    let description: String
    let startDate: String
    let endDate: String?
    let allDay: Bool
    let clientConfirmed: Bool
    let location: String
    let color: String
    let isRecurring: Bool
    let recurringType: String?
    let reminderMinutes: Int
    var userID: UUID?

    enum CodingKeys: String, CodingKey {
        case title, description, location, color
        case clientID = "client_id"
        case workItemID = "work_item_id"
        case startDate = "start_date"
        case endDate = "end_date"
        case allDay = "all_day"
        case clientConfirmed = "client_confirmed"
        case isRecurring = "is_recurring"
        case recurringType = "recurring_type"
        case reminderMinutes = "reminder_minutes"
        case userID = "user_id"
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(clientID, forKey: .clientID)
        try container.encode(workItemID, forKey: .workItemID)
        try container.encode(title, forKey: .title)
        try container.encode(description, forKey: .description)
        try container.encode(startDate, forKey: .startDate)
        try container.encode(endDate, forKey: .endDate)
        try container.encode(allDay, forKey: .allDay)
        try container.encode(clientConfirmed, forKey: .clientConfirmed)
        try container.encode(location, forKey: .location)
        try container.encode(color, forKey: .color)
        try container.encode(isRecurring, forKey: .isRecurring)
        try container.encode(recurringType, forKey: .recurringType)
        try container.encode(reminderMinutes, forKey: .reminderMinutes)
        try container.encodeIfPresent(userID, forKey: .userID)
    }
}

struct CalendarWorkspaceView: View {
    @EnvironmentObject private var auth: AuthViewModel
    let initialEventID: UUID?
    let initialClientID: UUID?
    let editInitialEvent: Bool
    let completeInitialEvent: Bool
    let onBack: () -> Void
    let onReturnToClient: () -> Void
    @State private var events: [CalendarEvent] = []
    @State private var clients: [CalendarClient] = []
    @State private var workItems: [CalendarWorkItem] = []
    @State private var visibleMonth = Date.now.startOfMonth
    @State private var selectedDate = Date.now
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showEditor = false
    @State private var editingEvent: CalendarEvent?
    @State private var viewingEvent: CalendarEvent?
    @State private var eventToDelete: CalendarEvent?
    @State private var onlyWithoutReminder = false
    @State private var historyState: NativeHistoryState = .pending
    @State private var changedHistoryID: NativeHistoryChange?
    @State private var showSettings = false
    @State private var changingEvent = false
    @State private var consumedInitialCompletion = false

    init(initialEventID: UUID? = nil, initialClientID: UUID? = nil, editInitialEvent: Bool = false, completeInitialEvent: Bool = false, createNewEvent: Bool = false, onBack: @escaping () -> Void, onReturnToClient: @escaping () -> Void = {}) {
        self.initialEventID = initialEventID
        self.initialClientID = initialClientID
        self.editInitialEvent = editInitialEvent
        self.completeInitialEvent = completeInitialEvent
        self.onBack = onBack
        self.onReturnToClient = onReturnToClient
        _showEditor = State(initialValue: createNewEvent)
    }

    private let calendar = Calendar.current
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 2), count: 7)
    private let weekdaySymbols = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"]

    private var selectedEvents: [CalendarEvent] {
        visibleEvents.filter { eventOverlaps($0, selectedDate) }.sorted { eventDate($0.startDate) < eventDate($1.startDate) }
    }

    private var visibleEvents: [CalendarEvent] {
        let pending = events.filter { !$0.isCompleted && $0.archivedAt == nil }
        return onlyWithoutReminder ? pending.filter { ($0.reminderMinutes ?? 0) == 0 } : pending
    }

    private var monthDays: [Date?] {
        guard let range = calendar.range(of: .day, in: .month, for: visibleMonth),
              let firstDay = calendar.date(from: calendar.dateComponents([.year, .month], from: visibleMonth)) else { return [] }
        let leadingDays = calendar.component(.weekday, from: firstDay) - 1
        return Array(repeating: nil, count: leadingDays) + range.compactMap { calendar.date(byAdding: .day, value: $0 - 1, to: firstDay) }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#efe8d8").ignoresSafeArea()
                if isLoading {
                    ProgressView("Caricamento calendario...")
                } else {
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 16) {
                            monthHeader
                            Button("Impostazioni calendario") { showSettings = true }
                            Picker("Stato", selection: $historyState) {
                                ForEach(NativeHistoryState.allCases) { Text($0.title).tag($0) }
                            }.pickerStyle(.segmented)
                            if historyState == .pending {
                                monthGrid
                                selectedDayPanel
                            } else {
                                NativeHistoryView(kind: "event", state: historyState, clientID: initialClientID, changedItem: changedHistoryID) { id in
                                    Task { await openHistoricalEvent(id) }
                                }.id(historyState)
                            }
                            if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
                        }
                        .padding(16)
                    }
                    .refreshable { await loadEvents() }
                }
            }
            .platformNavigationBarTitleDisplayMode()
            .toolbar {
                ToolbarItem(placement: .akLeading) { Button(action: onBack) { Image(systemName: "chevron.left") }.accessibilityLabel("Dashboard") }
                ToolbarItem(placement: .principal) { Label("Calendario", systemImage: "calendar").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")) }
                ToolbarItem(placement: .akTrailing) { Button { showEditor = true } label: { Image(systemName: "plus") }.accessibilityLabel("Nuovo evento") }
            }
        }
        .task { await loadEvents() }
        .onChange(of: initialEventID) { _ in Task { await loadEvents() } }
        .sheet(item: $viewingEvent) { event in
            CalendarEventSummarySheet(
                event: event,
                clientName: clients.first(where: { $0.id == event.clientID })?.name,
                workItemName: workItems.first(where: { $0.id == event.workItemID })?.title,
                onEdit: { viewingEvent = nil; editingEvent = event },
                onDelete: { viewingEvent = nil; eventToDelete = event },
                onCompletion: { try await setCompleted(event, to: !event.isCompleted) }
            )
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $showSettings, onDismiss: { Task { await loadEvents() } }) { NativeGoogleCalendarSettings() }
        .overlay {
            if showEditor {
                EventEditorView(event: nil, clients: clients, workItems: workItems, events: events, selectedDate: selectedDate, initialClientID: initialClientID, onClose: closeEditor, onSave: saveEvent)
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            } else if let event = editingEvent {
                EventEditorView(event: event, clients: clients, workItems: workItems, events: events, selectedDate: selectedDate, initialClientID: initialClientID, onClose: closeEditor, onSave: saveEvent)
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            }
        }
        .confirmationDialog("Eliminare questo evento?", isPresented: Binding(get: { eventToDelete != nil }, set: { if !$0 { eventToDelete = nil } }), titleVisibility: .visible) {
            Button("Elimina", role: .destructive) { if let event = eventToDelete { Task { await deleteEvent(event) } } }
        } message: { Text(eventToDelete?.title ?? "") }
    }

    private var monthHeader: some View {
        VStack(spacing: 14) {
            HStack {
                Image(systemName: "calendar").foregroundStyle(.white).frame(width: 42, height: 42)
                    .background(LinearGradient(colors: [Color(hex: "#e45f4e"), Color(hex: "#f7c948")], startPoint: .topLeading, endPoint: .bottomTrailing)).clipShape(RoundedRectangle(cornerRadius: 13))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Calendario").font(.title3.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                    Text("\(events.count) eventi").font(.caption).foregroundStyle(Color(hex: "#8a7f9f"))
                }
                Spacer()
                Button("Oggi") { visibleMonth = .now.startOfMonth; selectedDate = .now }
                    .font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#53627a")).padding(.horizontal, 11).padding(.vertical, 8).background(Color(hex: "#f1f4f9")).clipShape(RoundedRectangle(cornerRadius: 10))
            }
            HStack {
                Button { moveMonth(by: -1) } label: { Image(systemName: "chevron.left") }.frame(width: 34, height: 34).background(Color(hex: "#f1f4f9")).clipShape(RoundedRectangle(cornerRadius: 10))
                Spacer()
                Text(visibleMonth.formatted(.dateTime.month(.wide).year())).font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                Spacer()
                Button { moveMonth(by: 1) } label: { Image(systemName: "chevron.right") }.frame(width: 34, height: 34).background(Color(hex: "#f1f4f9")).clipShape(RoundedRectangle(cornerRadius: 10))
            }
            Button { onlyWithoutReminder.toggle() } label: {
                Label("Senza promemoria", systemImage: onlyWithoutReminder ? "bell.slash.fill" : "bell.slash")
                    .font(.caption.weight(.bold)).foregroundStyle(onlyWithoutReminder ? Color(hex: "#785b00") : Color(hex: "#716a91"))
                    .padding(.horizontal, 11).padding(.vertical, 8)
                    .background(onlyWithoutReminder ? Color(hex: "#fff1ba") : Color(hex: "#f1f4f9"))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }.buttonStyle(.plain)
        }
        .padding(18).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 20)).shadow(color: Color(hex: "#5e4931").opacity(0.08), radius: 12, y: 5)
    }

    private var monthGrid: some View {
        VStack(spacing: 7) {
            LazyVGrid(columns: columns, spacing: 2) {
                ForEach(weekdaySymbols, id: \.self) { day in Text(day).font(.caption2.weight(.bold)).foregroundStyle(Color(hex: "#8a7f9f")).frame(maxWidth: .infinity) }
            }
            LazyVGrid(columns: columns, spacing: 5) {
                ForEach(Array(monthDays.enumerated()), id: \.offset) { _, date in
                    if let date {
                        Button { selectedDate = date } label: { dayCell(date) }.buttonStyle(.plain)
                    } else {
                        Color.clear.frame(height: 52)
                    }
                }
            }
        }
        .padding(14).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 20)).shadow(color: Color(hex: "#5e4931").opacity(0.06), radius: 10, y: 4)
    }

    private func dayCell(_ date: Date) -> some View {
        let dayEvents = visibleEvents.filter { eventOverlaps($0, date) }
        let isSelected = calendar.isDate(date, inSameDayAs: selectedDate)
        let isToday = calendar.isDateInToday(date)
        return VStack(spacing: 4) {
            Text("\(calendar.component(.day, from: date))").font(.caption.weight(.bold))
                .foregroundStyle(isToday ? Color.white : isSelected ? Color(hex: "#c75143") : Color(hex: "#514b70"))
                .frame(width: 28, height: 28).background(isToday ? Color(hex: "#e45f4e") : isSelected ? Color(hex: "#f8dfb9") : Color.clear).clipShape(Circle())
            HStack(spacing: 2) {
                ForEach(dayEvents.prefix(3)) { event in Circle().fill(eventColor(event.color)).frame(width: 5, height: 5) }
            }.frame(height: 5)
        }
        .frame(maxWidth: .infinity, minHeight: 52)
        .background(isSelected && !isToday ? Color(hex: "#fff1d9") : Color.clear)
        .clipShape(RoundedRectangle(cornerRadius: 9))
    }

    private var selectedDayPanel: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(selectedDate.formatted(.dateTime.weekday(.abbreviated).month(.abbreviated).year())).font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#8a7f9f"))
                    Text("\(calendar.component(.day, from: selectedDate))").font(.system(size: 34, weight: .black)).foregroundStyle(Color(hex: "#2d2754"))
                }
                Spacer()
                Button { showEditor = true } label: { Image(systemName: "plus") }.foregroundStyle(Color(hex: "#c75143")).frame(width: 38, height: 38).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
            }
            if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(.red) }
            if selectedEvents.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "calendar.badge.plus").font(.title2).foregroundStyle(Color(hex: "#c7d2fe"))
                    Text("Nessun evento").font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: "#8a7f9f"))
                    Button("Aggiungi evento") { showEditor = true }.font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#c75143"))
                }.frame(maxWidth: .infinity).padding(.vertical, 24)
            } else {
                ForEach(selectedEvents) { event in
                    EventCard(event: event, onOpen: { viewingEvent = event }, onEdit: { editingEvent = event }, onDelete: { eventToDelete = event })
                }
            }
        }
        .padding(18).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 20)).shadow(color: Color(hex: "#5e4931").opacity(0.08), radius: 12, y: 5)
    }

    private func loadEvents() async {
        isLoading = true; defer { isLoading = false }
        do {
            events = try await SupabaseService.shared.from("events").select().eq("is_completed", value: false).is("archived_at", value: nil).order("start_date", ascending: true).execute().value
            clients = (try? await SupabaseService.shared.from("clients").select("id,name,address,zip_code,city,province,parent_client_id").order("name", ascending: true).execute().value) ?? []
            workItems = (try? await SupabaseService.shared.from("work_items").select("id,client_id,title,kind").eq("kind", value: "work").execute().value) ?? []
            if let initialEventID {
                let event: CalendarEvent = try await SupabaseService.shared.from("events").select().eq("id", value: initialEventID.uuidString).single().execute().value
                selectedDate = eventDate(event.startDate)
                visibleMonth = selectedDate.startOfMonth
                if completeInitialEvent && !consumedInitialCompletion && !event.isCompleted {
                    try await setCompleted(event, to: true)
                    consumedInitialCompletion = true
                    viewingEvent = try await SupabaseService.shared.from("events").select().eq("id", value: event.id.uuidString).single().execute().value
                } else if editInitialEvent { editingEvent = event }
                else { viewingEvent = event }
            }
        } catch { errorMessage = "Impossibile caricare il calendario: \(error.localizedDescription)" }
    }

    private func openHistoricalEvent(_ id: UUID) async {
        do {
            let event: CalendarEvent = try await SupabaseService.shared.from("events").select().eq("id", value: id.uuidString).single().execute().value
            viewingEvent = event
        } catch { errorMessage = "Impossibile leggere l'evento: \(error.localizedDescription)" }
    }

    private func setCompleted(_ event: CalendarEvent, to value: Bool) async throws {
        guard !changingEvent else { throw NativeIntegrationError.message("Operazione già in corso.") }
        guard let owner = auth.session?.user.id else { throw NativeIntegrationError.message("Accedi per confermare l'evento.") }
        changingEvent = true; defer { changingEvent = false }
        let updated: CalendarEvent = try await SupabaseService.shared.from("events").update(["is_completed": value])
            .eq("id", value: event.id.uuidString).or("user_id.eq.\(owner.uuidString),assigned_to.eq.\(owner.uuidString)").select().single().execute().value
        guard auth.session?.user.id == owner else { return }
        events.removeAll { $0.id == updated.id }
        if !updated.isCompleted { events.append(updated) }
        viewingEvent = nil
        changedHistoryID = NativeHistoryChange(id: updated.id)
        scheduleReminder(for: updated)
    }

    private func closeEditor() {
        withAnimation(.easeOut(duration: 0.2)) {
            showEditor = false
            editingEvent = nil
        }
        if initialClientID != nil { onReturnToClient() }
    }

    private func saveEvent(_ payload: CalendarEventPayload, _ existing: CalendarEvent?) async throws {
        if let existing {
            let updated: CalendarEvent = try await SupabaseService.shared.from("events").update(payload).eq("id", value: existing.id.uuidString).select().single().execute().value
            events.removeAll { $0.id == updated.id }
            if !updated.isCompleted && updated.archivedAt == nil { events.append(updated) }
            changedHistoryID = NativeHistoryChange(id: updated.id)
            scheduleReminder(for: updated)
        } else {
            guard let userID = auth.session?.user.id else { throw CalendarSaveError.missingAuthenticatedUser }
            var insertPayload = payload; insertPayload.userID = userID
            let created: CalendarEvent = try await SupabaseService.shared.from("events").insert(insertPayload).select().single().execute().value
            events.append(created); events.sort { eventDate($0.startDate) < eventDate($1.startDate) }
            scheduleReminder(for: created)
        }
    }

    private func scheduleReminder(for event: CalendarEvent) {
        guard let manager = PushNotificationManager.shared else { return }
        let start = eventDate(event.startDate)
        guard !event.isCompleted, let minutes = event.reminderMinutes, minutes > 0 else { manager.cancelCalendarEvent(eventID: event.id); return }
        manager.scheduleCalendarEvent(eventID: event.id, title: event.title, date: start.addingTimeInterval(-Double(minutes * 60)))
    }

    private func deleteEvent(_ event: CalendarEvent) async {
        do { try await SupabaseService.shared.from("events").delete().eq("id", value: event.id.uuidString).execute(); events.removeAll { $0.id == event.id }; changedHistoryID = NativeHistoryChange(id: event.id); PushNotificationManager.shared?.cancelCalendarEvent(eventID: event.id) }
        catch { errorMessage = "Impossibile eliminare l'evento." }
    }

    private func moveMonth(by value: Int) { visibleMonth = calendar.date(byAdding: .month, value: value, to: visibleMonth) ?? visibleMonth }
    private func eventDate(_ value: String) -> Date { NativeDates.parse(value) ?? .distantPast }
    private func eventOverlaps(_ event: CalendarEvent, _ date: Date) -> Bool {
        let start = eventDate(event.startDate); let end = event.endDate.map(eventDate) ?? start
        let dayStart = calendar.startOfDay(for: date); let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart) ?? dayStart
        return start < dayEnd && end >= dayStart
    }
    private func eventColor(_ color: String) -> Color { ["blue": "#3b82f6", "green": "#10b981", "red": "#ef4444", "purple": "#8b5cf6", "orange": "#f97316", "pink": "#ec4899", "yellow": "#f59e0b", "gray": "#94a3b8"][color].map(Color.init(hex:)) ?? Color(hex: "#3b82f6") }
}

private enum CalendarSaveError: Error { case missingAuthenticatedUser }

private struct EventCard: View {
    let event: CalendarEvent
    let onOpen: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 11) {
            RoundedRectangle(cornerRadius: 2).fill(color).frame(width: 4, height: 62)
            Button(action: onOpen) {
                VStack(alignment: .leading, spacing: 5) {
                    Text(event.title).font(.subheadline.weight(.black)).foregroundStyle(color).frame(maxWidth: .infinity, alignment: .leading)
                    Label(timeLabel, systemImage: "clock").font(.caption).foregroundStyle(color.opacity(0.75)).frame(maxWidth: .infinity, alignment: .leading)
                    if let location = event.location, !location.isEmpty { Label(location, systemImage: "mappin.and.ellipse").font(.caption).foregroundStyle(color.opacity(0.7)).lineLimit(1).frame(maxWidth: .infinity, alignment: .leading) }
                }.contentShape(Rectangle())
            }.buttonStyle(.plain)
            Spacer(minLength: 0)
            Menu { Button("Modifica", action: onEdit); Button("Elimina", role: .destructive, action: onDelete) } label: { Image(systemName: "ellipsis").foregroundStyle(color) }
        }
        .padding(13).background(color.opacity(0.09)).clipShape(RoundedRectangle(cornerRadius: 15))
    }

    private var color: Color { ["blue": "#2563eb", "green": "#059669", "red": "#dc2626", "purple": "#7c3aed", "orange": "#ea580c", "pink": "#db2777", "yellow": "#b45309", "gray": "#64748b"][event.color].map(Color.init(hex:)) ?? Color(hex: "#2563eb") }
    private var timeLabel: String { event.allDay ? "Tutto il giorno" : (ISO8601DateFormatter().date(from: event.startDate) ?? .now).formatted(.dateTime.hour().minute()) }
}

private struct CalendarEventSummarySheet: View {
    @Environment(\.dismiss) private var dismiss
    let event: CalendarEvent
    let clientName: String?
    let workItemName: String?
    let onEdit: () -> Void
    let onDelete: () -> Void
    let onCompletion: () async throws -> Void
    @State private var busy = false
    @State private var error: String?

    private var startDate: Date { ISO8601DateFormatter().date(from: event.startDate) ?? .now }
    private var endDate: Date? { event.endDate.flatMap(ISO8601DateFormatter().date(from:)) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text(event.title).font(.title2.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                    Text(event.isCompleted ? "Evento eseguito" : "L'evento è stato eseguito?").font(.headline)
                    Label(dateLabel, systemImage: "calendar").font(.subheadline.weight(.semibold)).foregroundStyle(Color(hex: "#257259"))
                    if let clientName {
                        Label(clientName, systemImage: "person.crop.circle").font(.subheadline).foregroundStyle(Color(hex: "#716a91"))
                        Label(event.clientConfirmed ? "Confermato dal cliente" : "Conferma in attesa", systemImage: event.clientConfirmed ? "checkmark.circle.fill" : "clock")
                            .font(.subheadline.weight(.semibold)).foregroundStyle(Color(hex: event.clientConfirmed ? "#257259" : "#9a6817"))
                    }
                    if let workItemName { Label(workItemName, systemImage: "briefcase").font(.subheadline).foregroundStyle(Color(hex: "#716a91")) }
                    if let location = event.location, !location.isEmpty {
                        Label(location, systemImage: "mappin.and.ellipse").font(.subheadline).foregroundStyle(Color(hex: "#716a91"))
                        if let url = mapsURL(for: location) { Link(destination: url) { Label("Apri in Mappe", systemImage: "map").font(.subheadline.weight(.bold)) }.foregroundStyle(Color(hex: "#257259")) }
                    }
                    if let description = event.description, !description.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("DESCRIZIONE").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                            Text(description).font(.body).foregroundStyle(Color(hex: "#2d2754"))
                        }
                    }
                    Label((event.reminderMinutes ?? 0) > 0 ? "Promemoria \(reminderLabel(event.reminderMinutes ?? 0)) prima" : "Nessun promemoria", systemImage: (event.reminderMinutes ?? 0) > 0 ? "bell" : "bell.slash")
                        .font(.subheadline).foregroundStyle(Color(hex: "#716a91"))
                    if let error { Text(error).foregroundStyle(.red) }
                    Button(event.isCompleted ? "Riporta da fare" : "Sì, completato") {
                        Task {
                            busy = true; defer { busy = false }
                            do { try await onCompletion() }
                            catch { self.error = error.localizedDescription }
                        }
                    }.buttonStyle(.borderedProminent).disabled(busy)
                    if !event.isCompleted { Button("No, scegli nuova data e ora", action: onEdit).disabled(busy) }
                    HStack(spacing: 10) {
                        Button(action: onEdit) {
                            Label("Modifica", systemImage: "pencil").font(.subheadline.weight(.bold))
                                .frame(maxWidth: .infinity).padding(.vertical, 13).foregroundStyle(.white)
                                .background(Color(hex: "#2d2754")).clipShape(RoundedRectangle(cornerRadius: 12))
                        }.disabled(busy)
                        Button(role: .destructive, action: onDelete) {
                            Label("Elimina", systemImage: "trash").font(.subheadline.weight(.bold))
                                .frame(maxWidth: .infinity).padding(.vertical, 13)
                                .background(Color.red.opacity(0.08)).clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }.padding(22)
            }
            .background(Color(hex: "#fffdf9"))
            .toolbar {
                ToolbarItem(placement: .principal) { Text("Riepilogo evento").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")) }
                ToolbarItem(placement: .topBarTrailing) { Button("Chiudi") { dismiss() }.disabled(busy) }
            }
        }
        .interactiveDismissDisabled(busy)
    }

    private var dateLabel: String {
        let day = startDate.formatted(date: .complete, time: .omitted)
        guard !event.allDay else { return "\(day) · Tutto il giorno" }
        let time = startDate.formatted(date: .omitted, time: .shortened)
        return "\(day) · \(time)" + (endDate.map { "–\($0.formatted(date: .omitted, time: .shortened))" } ?? "")
    }

    private func reminderLabel(_ minutes: Int) -> String {
        if minutes % 1440 == 0 { return "\(minutes / 1440) g" }
        if minutes % 60 == 0 { return "\(minutes / 60) h" }
        return "\(minutes) min"
    }

    private func mapsURL(for location: String) -> URL? {
        var components = URLComponents()
        components.scheme = "https"
        components.host = "maps.apple.com"
        components.queryItems = [URLQueryItem(name: "q", value: location)]
        return components.url
    }
}

private struct EventEditorView: View {
    let event: CalendarEvent?
    let clients: [CalendarClient]
    let workItems: [CalendarWorkItem]
    let events: [CalendarEvent]
    let selectedDate: Date
    let initialClientID: UUID?
    let onClose: () -> Void
    let onSave: (CalendarEventPayload, CalendarEvent?) async throws -> Void
    @State private var title = ""
    @State private var description = ""
    @State private var startDate = Date.now
    @State private var endDate = Date.now
    @State private var hasEndDate = false
    @State private var allDay = false
    @State private var clientConfirmed = false
    @State private var location = ""
    @State private var clientID: UUID?
    @State private var workItemID: UUID?
    @State private var color = "blue"
    @State private var isRecurring = false
    @State private var recurringType = "weekly"
    @State private var reminderMinutes = 30
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var conflictingEvents: [CalendarEvent] = []

    private let colors = ["blue", "green", "red", "purple", "orange", "pink", "yellow", "gray"]

    var body: some View {
        VStack(spacing: 0) {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        header
                        VStack(alignment: .leading, spacing: 18) {
                            VStack(alignment: .leading, spacing: 7) {
                                calendarLabel("Cliente / struttura", icon: "building.2")
                                Menu {
                                    Button("Nessun cliente collegato") { clientID = nil; workItemID = nil }
                                    ForEach(clients) { client in
                                        Button(clientLabel(client)) {
                                            clientID = client.id
                                            workItemID = nil
                                            title = client.name
                                            if !client.location.isEmpty { location = client.location }
                                        }
                                    }
                                } label: {
                                    HStack {
                                        Text(clients.first(where: { $0.id == clientID }).map(clientLabel) ?? "Nessun cliente collegato")
                                            .lineLimit(1).truncationMode(.tail).frame(maxWidth: .infinity, alignment: .leading)
                                        Image(systemName: "chevron.up.chevron.down").font(.caption).fixedSize()
                                    }.calendarControlStyle()
                                }
                            }
                            if let clientID {
                                Toggle("Appuntamento confermato dal cliente", isOn: $clientConfirmed)
                                    .font(.subheadline.weight(.medium)).tint(Color(hex: "#257259"))
                                VStack(alignment: .leading, spacing: 7) {
                                    calendarLabel("Lavorazione", icon: "briefcase")
                                    Menu {
                                        Button("Nessuna lavorazione collegata") { workItemID = nil }
                                        ForEach(workItems.filter { $0.clientID == clientID && $0.kind == "work" }) { work in
                                            Button(work.title) { workItemID = work.id; title = work.title }
                                        }
                                    } label: {
                                        HStack {
                                            Text(workItems.first(where: { $0.id == workItemID && $0.clientID == clientID })?.title ?? "Nessuna lavorazione collegata")
                                                .lineLimit(1).truncationMode(.tail).frame(maxWidth: .infinity, alignment: .leading)
                                            Image(systemName: "chevron.up.chevron.down").font(.caption).fixedSize()
                                        }.calendarControlStyle()
                                    }
                                }
                            }
                            modalField("Titolo *") { TextField("Es: Riunione, Compleanno, Scadenza...", text: $title) }
                            modalField("Descrizione") { TextField("Aggiungi dettagli...", text: $description, axis: .vertical).lineLimit(3...5) }
                            NativeDictationButton(text: $description)
                            Toggle("Evento giornata intera", isOn: $allDay).font(.subheadline.weight(.medium)).tint(Color(hex: "#e45f4e"))
                            HStack(alignment: .top, spacing: 12) {
                                VStack(alignment: .leading, spacing: 7) {
                                    calendarLabel("Data inizio *", icon: "calendar")
                                    DatePicker("", selection: $startDate, displayedComponents: allDay ? .date : [.date, .hourAndMinute]).labelsHidden().datePickerStyle(.compact).calendarControlStyle()
                                }
                                VStack(alignment: .leading, spacing: 7) {
                                    calendarLabel("Data fine", icon: "clock")
                                    Toggle("", isOn: $hasEndDate).labelsHidden().tint(Color(hex: "#e45f4e"))
                                    if hasEndDate { DatePicker("", selection: $endDate, in: startDate..., displayedComponents: allDay ? .date : [.date, .hourAndMinute]).labelsHidden().datePickerStyle(.compact).calendarControlStyle() }
                                }
                            }
                            modalField("Luogo", icon: "mappin.and.ellipse") { TextField("Es: Ufficio, Casa, Online...", text: $location) }
                            VStack(alignment: .leading, spacing: 9) {
                                calendarLabel("Colore", icon: "paintpalette")
                                HStack(spacing: 9) {
                                    ForEach(colors, id: \.self) { item in
                                        Button { color = item } label: {
                                            RoundedRectangle(cornerRadius: 7).fill(eventColor(item)).frame(width: 29, height: 29)
                                                .overlay { if color == item { RoundedRectangle(cornerRadius: 7).stroke(Color.white, lineWidth: 3).padding(2) } }
                                        }.buttonStyle(.plain)
                                    }
                                }
                            }
                            DisclosureGroup(isRecurring ? "Evento ricorrente" : "Altri dettagli") {
                                VStack(spacing: 13) {
                                    Toggle("Evento ricorrente", isOn: $isRecurring).tint(Color(hex: "#e45f4e"))
                                    if isRecurring { Picker("Ripetizione", selection: $recurringType) { Text("Giornaliero").tag("daily"); Text("Settimanale").tag("weekly"); Text("Mensile").tag("monthly"); Text("Annuale").tag("yearly") }.pickerStyle(.menu).calendarControlStyle() }
                                    Picker("Promemoria", selection: $reminderMinutes) { Text("Nessun promemoria").tag(0); Text("15 minuti prima").tag(15); Text("30 minuti prima").tag(30); Text("1 ora prima").tag(60); Text("1 giorno prima").tag(1440) }.pickerStyle(.menu).calendarControlStyle()
                                }.padding(.top, 10)
                            }
                            .font(.subheadline.weight(.semibold)).foregroundStyle(Color(hex: "#716a91"))
                            if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                        }
                        .padding(22)
                    }
                }
                Button { Task { await submit() } } label: {
                    Text(isSaving ? "Salvataggio..." : event == nil ? "Salva Evento" : "Aggiorna Evento")
                        .font(.subheadline.weight(.bold)).frame(maxWidth: .infinity).padding(.vertical, 16).foregroundStyle(.white)
                        .background(LinearGradient(colors: [Color(hex: "#e95d50"), Color(hex: "#efa633")], startPoint: .leading, endPoint: .trailing)).clipShape(RoundedRectangle(cornerRadius: 13))
                }
                .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSaving).opacity(title.trimmingCharacters(in: .whitespaces).isEmpty ? 0.55 : 1)
                .padding(.horizontal, 32).padding(.vertical, 14).background(Color(hex: "#fffdf9"))
            }
        .frame(maxHeight: 700)
        .background(Color(hex: "#fffdf9"))
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .onAppear(perform: loadEvent)
        .confirmationDialog("Orario già occupato", isPresented: Binding(get: { !conflictingEvents.isEmpty }, set: { if !$0 { conflictingEvents = [] } }), titleVisibility: .visible) {
            Button("Salva comunque") { conflictingEvents = []; Task { await persistEvent() } }
            Button("Modifica orario", role: .cancel) { conflictingEvents = [] }
        } message: {
            Text(conflictingEvents.map(\.title).joined(separator: ", "))
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            Image(systemName: "calendar").font(.headline).foregroundStyle(.white).frame(width: 42, height: 42)
                .background(LinearGradient(colors: [Color(hex: "#e95d50"), Color(hex: "#efa633")], startPoint: .topLeading, endPoint: .bottomTrailing)).clipShape(RoundedRectangle(cornerRadius: 13))
            VStack(alignment: .leading, spacing: 2) {
                Text(event == nil ? "Nuovo Evento" : "Modifica Evento").font(.system(size: 19, weight: .black)).foregroundStyle(Color(hex: "#2d2754"))
                Text("Pianifica il tuo calendario").font(.system(size: 12)).foregroundStyle(Color(hex: "#8a7f9f"))
            }
            Spacer()
            Button(action: onClose) { Image(systemName: "xmark").font(.subheadline.weight(.medium)).foregroundStyle(Color(hex: "#8a7f9f")).frame(width: 36, height: 36).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 11)) }.accessibilityLabel("Chiudi")
        }
        .padding(18).overlay(alignment: .bottom) { Rectangle().fill(Color(hex: "#ead8bf")).frame(height: 1) }
    }

    @ViewBuilder
    private func calendarLabel(_ title: String, icon: String? = nil) -> some View {
        if let icon {
            Label(title.uppercased(), systemImage: icon).font(.system(size: 11, weight: .medium)).foregroundStyle(Color(hex: "#8a7f9f"))
        } else {
            Text(title.uppercased()).font(.system(size: 11, weight: .medium)).foregroundStyle(Color(hex: "#8a7f9f"))
        }
    }

    private func modalField<Content: View>(_ label: String, icon: String? = nil, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            calendarLabel(label, icon: icon)
            content().calendarControlStyle()
        }
    }

    private func loadEvent() {
        guard let event else {
            startDate = selectedDate
            clientID = initialClientID
            if let client = clients.first(where: { $0.id == initialClientID }) {
                title = "Appuntamento · \(client.name)"
                location = client.location
            }
            return
        }
        title = event.title; description = event.description ?? ""; startDate = parseDate(event.startDate); hasEndDate = event.endDate != nil; endDate = event.endDate.map(parseDate) ?? startDate; allDay = event.allDay; clientConfirmed = event.clientConfirmed; clientID = event.clientID; workItemID = event.workItemID; location = event.location ?? ""; color = event.color; isRecurring = event.isRecurring; recurringType = event.recurringType ?? "weekly"; reminderMinutes = event.reminderMinutes ?? 0
    }

    private func clientLabel(_ client: CalendarClient) -> String {
        let parent = clients.first { $0.id == client.parentClientID }
        return parent.map { "\($0.name) › \(client.name)" } ?? client.name
    }

    private func submit() async {
        let overlaps = findOverlappingEvents()
        guard overlaps.isEmpty else { conflictingEvents = overlaps; return }
        await persistEvent()
    }

    private func findOverlappingEvents() -> [CalendarEvent] {
        let proposed = interval(start: startDate, end: hasEndDate ? endDate : nil, allDay: allDay)
        return events.filter { existing in
            guard existing.id != event?.id else { return false }
            let existingStart = parseDate(existing.startDate)
            let existingEnd = existing.endDate.map(parseDate)
            let existingInterval = interval(start: existingStart, end: existingEnd, allDay: existing.allDay)
            return proposed.start < existingInterval.end && existingInterval.start < proposed.end
        }
    }

    private func interval(start: Date, end: Date?, allDay: Bool) -> (start: Date, end: Date) {
        let intervalStart = allDay ? Calendar.current.startOfDay(for: start) : start
        if allDay {
            let endDay = Calendar.current.startOfDay(for: end ?? start)
            return (intervalStart, Calendar.current.date(byAdding: .day, value: 1, to: endDay) ?? endDay.addingTimeInterval(86_400))
        }
        let intervalEnd = end.flatMap { $0 > intervalStart ? $0 : nil } ?? start.addingTimeInterval(3_600)
        return (intervalStart, intervalEnd)
    }

    private func persistEvent() async {
        isSaving = true; defer { isSaving = false }
        let formatter = ISO8601DateFormatter()
        let payload = CalendarEventPayload(clientID: clientID, workItemID: workItemID, title: title.trimmingCharacters(in: .whitespaces), description: description.trimmingCharacters(in: .whitespaces), startDate: formatter.string(from: startDate), endDate: hasEndDate ? formatter.string(from: endDate) : nil, allDay: allDay, clientConfirmed: clientID != nil && clientConfirmed, location: location.trimmingCharacters(in: .whitespaces), color: color, isRecurring: isRecurring, recurringType: isRecurring ? recurringType : nil, reminderMinutes: reminderMinutes, userID: nil)
        do { try await onSave(payload, event); onClose() } catch { errorMessage = "Impossibile salvare l'evento." }
    }

    private func parseDate(_ value: String) -> Date { ISO8601DateFormatter().date(from: value) ?? .now }
    private func eventColor(_ value: String) -> Color { ["blue": "#3b82f6", "green": "#10b981", "red": "#ef4444", "purple": "#8b5cf6", "orange": "#f97316", "pink": "#ec4899", "yellow": "#f59e0b", "gray": "#94a3b8"][value].map(Color.init(hex:)) ?? Color(hex: "#3b82f6") }
}

private extension Date {
    var startOfMonth: Date { Calendar.current.date(from: Calendar.current.dateComponents([.year, .month], from: self)) ?? self }
}

private extension View {
    func calendarControlStyle() -> some View {
        self.platformScaledFont(size: 15).foregroundStyle(Color(hex: "#2d2754")).padding(.horizontal, 12).padding(.vertical, 10)
            .frame(maxWidth: .infinity, alignment: .leading).background(Color(hex: "#fae9ce"))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#e6d3b6"), lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 12))
    }
}