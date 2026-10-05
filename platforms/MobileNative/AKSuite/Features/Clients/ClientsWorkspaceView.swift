import SwiftUI

private struct ClientWorkReference: Decodable, Identifiable {
    let id: UUID
    let clientID: UUID?
    let title: String
    let status: String
    let kind: String

    enum CodingKeys: String, CodingKey {
        case id, title, status, kind
        case clientID = "client_id"
    }
}

private struct ClientAppointment: Decodable, Identifiable {
    let id: UUID
    let clientID: UUID?
    let workItemID: UUID?
    let title: String
    let description: String?
    let clientConfirmed: Bool?
    let startDate: String
    let endDate: String?
    let allDay: Bool
    let location: String?
    let reminderMinutes: Int?

    enum CodingKeys: String, CodingKey {
        case id, title, description, location
        case clientID = "client_id"
        case workItemID = "work_item_id"
        case clientConfirmed = "client_confirmed"
        case startDate = "start_date"
        case endDate = "end_date"
        case allDay = "all_day"
        case reminderMinutes = "reminder_minutes"
    }

    var start: Date { ISO8601DateFormatter().date(from: startDate) ?? .distantPast }
    var isPast: Bool {
        let end = ISO8601DateFormatter().date(from: endDate ?? startDate) ?? start
        if allDay, let dayEnd = Calendar.current.date(bySettingHour: 23, minute: 59, second: 59, of: end) { return dayEnd < .now }
        return end < .now
    }
}

private struct NativeClient: Codable, Identifiable, Equatable {
    let id: UUID
    var name: String
    var company: String
    var phone: String
    var phone2: String
    var email: String
    var contactFirstName: String?
    var contactLastName: String?
    var contactPhone: String?
    var contactEmail: String?
    var address: String
    var city: String
    var zipCode: String
    var province: String
    var fiscalCode: String
    var vatNumber: String
    var category: String
    var notes: String
    var isFavorite: Bool
    var parentClientID: UUID?

    enum CodingKeys: String, CodingKey {
        case id, name, company, phone, phone2, email, address, city, province, category, notes
        case contactFirstName = "contact_first_name"
        case contactLastName = "contact_last_name"
        case contactPhone = "contact_phone"
        case contactEmail = "contact_email"
        case zipCode = "zip_code"
        case fiscalCode = "fiscal_code"
        case vatNumber = "vat_number"
        case isFavorite = "is_favorite"
        case parentClientID = "parent_client_id"
    }
}

private struct NativeClientPayload: Encodable {
    let name: String
    let company: String
    let phone: String
    let phone2: String
    let email: String
    let contactFirstName: String
    let contactLastName: String
    let contactPhone: String
    let contactEmail: String
    let address: String
    let city: String
    let zipCode: String
    let province: String
    let fiscalCode: String
    let vatNumber: String
    let category: String
    let notes: String
    let isFavorite: Bool
    var parentClientID: UUID?
    var userID: UUID?

    enum CodingKeys: String, CodingKey {
        case name, company, phone, phone2, email, address, city, province, category, notes
        case contactFirstName = "contact_first_name"
        case contactLastName = "contact_last_name"
        case contactPhone = "contact_phone"
        case contactEmail = "contact_email"
        case zipCode = "zip_code"
        case fiscalCode = "fiscal_code"
        case vatNumber = "vat_number"
        case isFavorite = "is_favorite"
        case parentClientID = "parent_client_id"
        case userID = "user_id"
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(name, forKey: .name)
        try container.encode(company, forKey: .company)
        try container.encode(phone, forKey: .phone)
        try container.encode(phone2, forKey: .phone2)
        try container.encode(email, forKey: .email)
        try container.encode(contactFirstName, forKey: .contactFirstName)
        try container.encode(contactLastName, forKey: .contactLastName)
        try container.encode(contactPhone, forKey: .contactPhone)
        try container.encode(contactEmail, forKey: .contactEmail)
        try container.encode(address, forKey: .address)
        try container.encode(city, forKey: .city)
        try container.encode(zipCode, forKey: .zipCode)
        try container.encode(province, forKey: .province)
        try container.encode(fiscalCode, forKey: .fiscalCode)
        try container.encode(vatNumber, forKey: .vatNumber)
        try container.encode(category, forKey: .category)
        try container.encode(notes, forKey: .notes)
        try container.encode(isFavorite, forKey: .isFavorite)
        try container.encode(parentClientID, forKey: .parentClientID)
        try container.encodeIfPresent(userID, forKey: .userID)
    }
}

struct ClientsWorkspaceView: View {
    @EnvironmentObject private var auth: AuthViewModel
    let initialClientID: UUID?
    let onBack: () -> Void
    let onOpenWorkItems: (UUID) -> Void
    let onOpenTodos: (UUID) -> Void
    let onOpenAppointment: (UUID, UUID?) -> Void
    let onOpenFollowUp: (UUID, String, Date) -> Void
    @State private var clients: [NativeClient] = []
    @State private var workItems: [ClientWorkReference] = []
    @State private var appointments: [ClientAppointment] = []
    @State private var query = ""
    @State private var selectedCategory = "all"
    @State private var favoritesOnly = false
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showEditor = false
    @State private var editingClient: NativeClient?
    @State private var selectedClientID: UUID?
    @State private var clientToDelete: NativeClient?
    @State private var appointmentToDelete: ClientAppointment?

    private var selectedClient: NativeClient? { clients.first { $0.id == selectedClientID } }

    private var categories: [String] { ["all"] + Array(Set(clients.map(\.category))).sorted() }
    private var filteredClients: [NativeClient] {
        clients.filter { client in
            guard client.parentClientID == nil || !clients.contains(where: { $0.id == client.parentClientID }) else { return false }
            let related = [client] + clients.filter { $0.parentClientID == client.id }
            return related.contains { candidate in
                (query.isEmpty || "\(candidate.name) \(candidate.company) \(candidate.phone) \(candidate.email) \(candidate.city)".localizedCaseInsensitiveContains(query)) &&
                (selectedCategory == "all" || candidate.category == selectedCategory) &&
                (!favoritesOnly || candidate.isFavorite)
            }
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#efe8d8").ignoresSafeArea()
                if isLoading { ProgressView("Caricamento rubrica...") } else { content }
            }
            .platformNavigationBarTitleDisplayMode()
            .toolbar {
                ToolbarItem(placement: .akLeading) { Button(action: onBack) { Image(systemName: "chevron.left") }.accessibilityLabel("Dashboard") }
                ToolbarItem(placement: .principal) { Text("RUBRICA").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")) }
                ToolbarItem(placement: .akTrailing) { Button { editingClient = nil; showEditor = true } label: { Image(systemName: "plus") }.accessibilityLabel("Nuovo contatto") }
            }
        }
        .task {
            await loadClients()
            if let initialClientID, clients.contains(where: { $0.id == initialClientID }) { selectedClientID = initialClientID }
        }
        .overlay {
            if showEditor {
                ClientEditorView(client: editingClient, clients: clients, onClose: { withAnimation(.easeOut(duration: 0.2)) { showEditor = false } }, onSave: saveClient)
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            }
        }
        .overlay {
            if let client = selectedClient {
                let parentClient = clients.first { $0.id == client.parentClientID }
                let childClients = clients.filter { $0.parentClientID == client.id }
                let clientAppointments = appointments.filter { $0.clientID == client.id }
                ClientDetailView(
                    client: client,
                    parent: parentClient,
                    children: childClients,
                    workItems: workItems,
                    appointments: clientAppointments,
                    onOpenWorkItems: onOpenWorkItems,
                    onOpenTodos: onOpenTodos,
                    onNewAppointment: { onOpenAppointment(client.id, nil) },
                    onEditAppointment: { onOpenAppointment(client.id, $0.id) },
                    onDeleteAppointment: { appointmentToDelete = $0 },
                    onScheduleFollowUp: { onOpenFollowUp(client.id, $0.title, $0.start) },
                    onSelect: { selectedClientID = $0.id },
                    onClose: { withAnimation(.easeOut(duration: 0.2)) { selectedClientID = nil } },
                    onEdit: { selectedClientID = nil; editingClient = client; showEditor = true },
                    onDelete: { clientToDelete = client }
                )
                    .platformModalWidth(compact: 360, regular: 760)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            }
        }
        .confirmationDialog("Eliminare questo contatto?", isPresented: Binding(get: { clientToDelete != nil }, set: { if !$0 { clientToDelete = nil } }), titleVisibility: .visible) {
            Button("Elimina", role: .destructive) { if let client = clientToDelete { Task { await delete(client) } } }
        } message: { Text(clientToDelete?.name ?? "") }
        .confirmationDialog("Eliminare questo appuntamento?", isPresented: Binding(get: { appointmentToDelete != nil }, set: { if !$0 { appointmentToDelete = nil } }), titleVisibility: .visible) {
            Button("Elimina", role: .destructive) { if let appointment = appointmentToDelete { Task { await deleteAppointment(appointment) } } }
        } message: { Text(appointmentToDelete?.title ?? "") }
    }

    private var content: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 15) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("CONTATTI E CLIENTI").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#3d8be8"))
                    Text("La tua rubrica").font(.title2.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                    Text("\(filteredClients.count) contatti").font(.caption).foregroundStyle(Color(hex: "#716a91"))
                }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Color(hex: "#d9e9ff")).clipShape(RoundedRectangle(cornerRadius: 20))
                HStack(spacing: 9) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Color(hex: "#8a7f9f"))
                    TextField("Cerca contatti...", text: $query).platformNoAutocapitalization()
                    Menu { Picker("Categoria", selection: $selectedCategory) { ForEach(categories, id: \.self) { category in Text(category == "all" ? "Tutte" : category.capitalized).tag(category) } } } label: { Image(systemName: "folder").foregroundStyle(Color(hex: "#716a91")) }
                    Button { favoritesOnly.toggle() } label: { Image(systemName: favoritesOnly ? "star.fill" : "star").foregroundStyle(favoritesOnly ? Color(hex: "#e45f4e") : Color(hex: "#716a91")) }
                }.padding(13).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 14))
                if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                if filteredClients.isEmpty { emptyState } else { ForEach(filteredClients) { client in ClientRow(client: client, parentName: clients.first(where: { $0.id == client.parentClientID })?.name, childCount: clients.filter { $0.parentClientID == client.id }.count, onOpen: { withAnimation(.spring(response: 0.34, dampingFraction: 0.82)) { selectedClientID = client.id } }, onFavorite: { Task { await toggleFavorite(client) } }, onEdit: { editingClient = client; showEditor = true }, onDelete: { clientToDelete = client }) } }
            }.padding(16)
        }.refreshable { await loadClients() }
    }

    private var emptyState: some View { VStack(spacing: 9) { Image(systemName: "person.crop.circle.badge.plus").font(.system(size: 32)).foregroundStyle(Color(hex: "#3d8be8")); Text("Nessun contatto trovato").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")); Button("Aggiungi contatto") { editingClient = nil; showEditor = true }.font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#2369b8")) }.frame(maxWidth: .infinity).padding(30).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 18)) }

    private func loadClients() async {
        isLoading = true
        defer { isLoading = false }
        do {
            clients = try await SupabaseService.shared.from("clients").select().order("name", ascending: true).execute().value
            workItems = (try? await SupabaseService.shared.from("work_items").select("id,client_id,title,status,kind").or("kind.eq.work,and(kind.eq.todo,status.neq.completed,archived_at.is.null)").execute().value) ?? []
            appointments = (try? await SupabaseService.shared.from("events").select("id,client_id,work_item_id,title,description,client_confirmed,start_date,end_date,all_day,location,reminder_minutes").eq("is_completed", value: false).is("archived_at", value: nil).execute().value) ?? []
        } catch { errorMessage = "Impossibile caricare la rubrica." }
    }
    private func saveClient(_ payload: NativeClientPayload, _ existing: NativeClient?) async throws {
        if let existing { let updated: NativeClient = try await SupabaseService.shared.from("clients").update(payload).eq("id", value: existing.id.uuidString).select().single().execute().value; clients = clients.map { $0.id == updated.id ? updated : $0 }.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending } }
        else { guard let userID = auth.session?.user.id else { throw ClientSaveError.missingUser }; var insert = payload; insert.userID = userID; let created: NativeClient = try await SupabaseService.shared.from("clients").insert(insert).select().single().execute().value; clients.append(created); clients.sort { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending } }
    }
    private func toggleFavorite(_ client: NativeClient) async { do { let updated: NativeClient = try await SupabaseService.shared.from("clients").update(["is_favorite": !client.isFavorite]).eq("id", value: client.id.uuidString).select().single().execute().value; clients = clients.map { $0.id == updated.id ? updated : $0 } } catch { errorMessage = "Impossibile aggiornare il contatto." } }
    private func delete(_ client: NativeClient) async { do { try await SupabaseService.shared.from("clients").delete().eq("id", value: client.id.uuidString).execute(); clients.removeAll { $0.id == client.id } } catch { errorMessage = "Impossibile eliminare il contatto." } }
    private func deleteAppointment(_ appointment: ClientAppointment) async {
        do {
            try await SupabaseService.shared.from("events").delete().eq("id", value: appointment.id.uuidString).execute()
            appointments.removeAll { $0.id == appointment.id }
            PushNotificationManager.shared?.cancelCalendarEvent(eventID: appointment.id)
            appointmentToDelete = nil
        } catch { errorMessage = "Impossibile eliminare l'appuntamento." }
    }
}

private enum ClientSaveError: Error { case missingUser }

private struct ClientRow: View {
    let client: NativeClient
    let parentName: String?
    let childCount: Int
    let onOpen: () -> Void
    let onFavorite: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 13) {
            Text(initials).font(.subheadline.weight(.black)).foregroundStyle(Color(hex: "#174a9b")).frame(width: 44, height: 44).background(Color(hex: "#d9e9ff")).clipShape(Circle())
            VStack(alignment: .leading, spacing: 3) {
                Text(client.name).font(.subheadline.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                Text(client.category == "azienda" ? "Azienda" : client.company.isEmpty ? (client.email.isEmpty ? client.phone : client.email) : client.company).font(.caption).foregroundStyle(Color(hex: "#716a91"))
                if let parentName { Label(parentName, systemImage: "arrow.turn.up.left").font(.caption2.weight(.bold)).foregroundStyle(Color(hex: "#376db5")) }
                else if childCount > 0 { Text("\(childCount) clienti collegati").font(.caption2.weight(.bold)).foregroundStyle(Color(hex: "#257259")) }
                Text(client.category.capitalized).font(.caption2.weight(.bold)).foregroundStyle(Color(hex: "#3d8be8"))
            }
            Spacer(minLength: 4)
            Button(action: onFavorite) { Image(systemName: client.isFavorite ? "star.fill" : "star").foregroundStyle(client.isFavorite ? Color(hex: "#e45f4e") : Color(hex: "#8a7f9f")) }
            Menu { Button("Modifica", action: onEdit); Button("Elimina", role: .destructive, action: onDelete) } label: { Image(systemName: "ellipsis") }.foregroundStyle(Color(hex: "#716a91"))
        }
        .padding(14).background(Color(hex: "#fff8ed")).overlay(RoundedRectangle(cornerRadius: 15).stroke(Color(hex: "#d1e1f5"), lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 15)).contentShape(Rectangle()).onTapGesture(perform: onOpen)
    }
    private var initials: String { client.name.split(separator: " ").prefix(2).compactMap { $0.first }.map(String.init).joined().uppercased() }
}

private struct ClientDetailView: View {
    let client: NativeClient
    let parent: NativeClient?
    let children: [NativeClient]
    let workItems: [ClientWorkReference]
    let appointments: [ClientAppointment]
    let onOpenWorkItems: (UUID) -> Void
    let onOpenTodos: (UUID) -> Void
    let onNewAppointment: () -> Void
    let onEditAppointment: (ClientAppointment) -> Void
    let onDeleteAppointment: (ClientAppointment) -> Void
    let onScheduleFollowUp: (ClientAppointment) -> Void
    let onSelect: (NativeClient) -> Void
    let onClose: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    @State private var showingPastAppointments = false
    @State private var selectedAppointment: ClientAppointment?

    private var relatedWorkItems: [ClientWorkReference] { workItems.filter { $0.clientID == client.id && $0.kind == "work" } }
    private var relatedTodos: [ClientWorkReference] { workItems.filter { $0.clientID == client.id && $0.kind == "todo" } }
    private var upcomingAppointments: [ClientAppointment] { appointments.filter { !$0.isPast }.sorted { $0.start < $1.start } }
    private var pastAppointments: [ClientAppointment] { appointments.filter(\.isPast).sorted { $0.start > $1.start } }
    private var visibleAppointments: [ClientAppointment] { showingPastAppointments ? pastAppointments : upcomingAppointments }

    var body: some View {
        ScrollView(showsIndicators: false) {
        VStack(alignment: .leading, spacing: 18) {
            if let parent {
                Button { onSelect(parent) } label: { Label(parent.name, systemImage: "chevron.left").font(.caption.weight(.bold)) }
                    .foregroundStyle(Color(hex: "#257259"))
            }
            HStack {
                Text(initials).font(.title3.weight(.black)).foregroundStyle(Color(hex: "#174a9b")).frame(width: 48, height: 48).background(Color(hex: "#d9e9ff")).clipShape(Circle())
                VStack(alignment: .leading) { Text(client.name).font(.title3.weight(.black)).foregroundStyle(Color(hex: "#2d2754")); if client.category == "azienda" { Text("Azienda").font(.caption).foregroundStyle(Color(hex: "#716a91")) } else if !client.company.isEmpty { Text(client.company).font(.caption).foregroundStyle(Color(hex: "#716a91")) } }
                Spacer()
                Button(action: onClose) { Image(systemName: "xmark") }
            }
            .foregroundStyle(Color(hex: "#716a91"))
            if let parent { detail("CLIENTE PRINCIPALE", parent.name) }
            if !children.isEmpty {
                VStack(alignment: .leading, spacing: 9) {
                    Text("STRUTTURE COLLEGATE · \(children.count)").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                    ForEach(children) { child in
                        Button { onSelect(child) } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "building.2").foregroundStyle(Color(hex: "#257259"))
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(child.name).font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: "#2d2754"))
                                    let info = [child.city, child.phone, child.email].filter { !$0.isEmpty }.joined(separator: " · ")
                                    if !info.isEmpty { Text(info).font(.caption).foregroundStyle(Color(hex: "#716a91")).lineLimit(1) }
                                }
                                Spacer(minLength: 0)
                                Image(systemName: "chevron.right").font(.caption).foregroundStyle(Color(hex: "#8a7f9f"))
                            }.padding(12).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
                        }.buttonStyle(.plain)
                    }
                }
            }
            if parent != nil || !relatedWorkItems.isEmpty {
                Button { onOpenWorkItems(client.id) } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "briefcase").foregroundStyle(Color(hex: "#257259"))
                        Text("Lavorazioni").font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: "#2d2754"))
                        Spacer(minLength: 0)
                        Text("\(relatedWorkItems.count)").font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#257259"))
                        Image(systemName: "chevron.right").font(.caption).foregroundStyle(Color(hex: "#8a7f9f"))
                    }.padding(14).background(Color(hex: "#d9e8d9")).clipShape(RoundedRectangle(cornerRadius: 12))
                }.buttonStyle(.plain)
            }
            if parent != nil || !relatedTodos.isEmpty {
                Button { onOpenTodos(client.id) } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "checklist").foregroundStyle(Color(hex: "#785b00"))
                        Text("Cose da fare").font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: "#2d2754"))
                        Spacer(minLength: 0)
                        Text("\(relatedTodos.count)").font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#785b00"))
                        Image(systemName: "chevron.right").font(.caption).foregroundStyle(Color(hex: "#8a7f9f"))
                    }.padding(14).background(Color(hex: "#fff1ba")).clipShape(RoundedRectangle(cornerRadius: 12))
                }.buttonStyle(.plain)
            }
            VStack(alignment: .leading, spacing: 11) {
                HStack {
                    Text("APPUNTAMENTI").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                    Spacer()
                    Button(action: onNewAppointment) {
                        Label("Nuovo", systemImage: "plus").font(.caption.weight(.bold))
                            .foregroundStyle(.white).padding(.horizontal, 11).padding(.vertical, 8)
                            .background(Color(hex: "#2d2754")).clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
                Picker("Appuntamenti", selection: $showingPastAppointments) {
                    Text("Prossimi · \(upcomingAppointments.count)").tag(false)
                    Text("Passati · \(pastAppointments.count)").tag(true)
                }.pickerStyle(.segmented)
                if visibleAppointments.isEmpty {
                    Text(showingPastAppointments ? "Nessun appuntamento passato." : "Nessun appuntamento in programma.")
                        .font(.caption).foregroundStyle(Color(hex: "#716a91"))
                        .frame(maxWidth: .infinity, alignment: .leading).padding(13)
                        .background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    ForEach(visibleAppointments) { appointment in
                        HStack(spacing: 10) {
                            Button { selectedAppointment = appointment } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: "calendar").foregroundStyle(Color(hex: appointment.isPast ? "#716a91" : "#257259"))
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(appointment.title).font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: "#2d2754")).lineLimit(2)
                                        Text(appointment.start.formatted(date: .abbreviated, time: appointment.allDay ? .omitted : .shortened))
                                            .font(.caption).foregroundStyle(Color(hex: "#716a91"))
                                        if let location = appointment.location, !location.isEmpty { Text(location).font(.caption2).foregroundStyle(Color(hex: "#8a7f9f")).lineLimit(1) }
                                    }
                                    Spacer(minLength: 0)
                                }
                                .contentShape(Rectangle())
                            }.buttonStyle(.plain)
                            Menu {
                                Button("Modifica", systemImage: "pencil") { onEditAppointment(appointment) }
                                Button("Elimina", systemImage: "trash", role: .destructive) { onDeleteAppointment(appointment) }
                            } label: { Image(systemName: "ellipsis").foregroundStyle(Color(hex: "#716a91")).frame(width: 32, height: 32) }
                            .accessibilityLabel("Azioni appuntamento")
                        }
                        .padding(12).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
            if !client.phone.isEmpty { detail("TELEFONO", client.phone) }
            if !client.phone2.isEmpty { detail("TELEFONO 2", client.phone2) }
            if !client.email.isEmpty { detail("EMAIL", client.email) }
            if client.category == "azienda" {
                let contactName = [client.contactFirstName, client.contactLastName].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " ")
                if !contactName.isEmpty { detail("REFERENTE", contactName) }
                if let contactPhone = client.contactPhone, !contactPhone.isEmpty { detail("TELEFONO REFERENTE", contactPhone) }
                if let contactEmail = client.contactEmail, !contactEmail.isEmpty { detail("EMAIL REFERENTE", contactEmail) }
            }
            let address = [client.address, client.zipCode, client.city, client.province].filter { !$0.isEmpty }.joined(separator: ", ")
            if !address.isEmpty { detail("INDIRIZZO", address) }
            if !client.category.isEmpty { detail("CATEGORIA", client.category.capitalized) }
            if !client.fiscalCode.isEmpty { detail("CODICE FISCALE", client.fiscalCode) }
            if !client.vatNumber.isEmpty { detail("PARTITA IVA", client.vatNumber) }
            if !client.notes.isEmpty { detail("NOTE", client.notes) }
            HStack(spacing: 12) { Button("Modifica", action: onEdit).buttonStyle(.borderedProminent).tint(Color(hex: "#3d8be8")); Button("Elimina", role: .destructive, action: onDelete).buttonStyle(.bordered) }.frame(maxWidth: .infinity).padding(.top, 2)
        }
        .padding(22).frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxHeight: 700).background(Color(hex: "#fffdf9")).clipShape(RoundedRectangle(cornerRadius: 24)).padding(16)
        .sheet(item: $selectedAppointment) { appointment in
            ClientAppointmentDetailSheet(appointment: appointment, onScheduleFollowUp: { onScheduleFollowUp(appointment) }) {
                selectedAppointment = nil
                onEditAppointment(appointment)
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }
    private var initials: String { client.name.split(separator: " ").prefix(2).compactMap { $0.first }.map(String.init).joined().uppercased() }
    private func detail(_ label: String, _ value: String) -> some View { VStack(alignment: .leading, spacing: 6) { Text(label).font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f")); Text(value).font(.body).foregroundStyle(Color(hex: "#2d2754")).frame(maxWidth: .infinity, alignment: .leading).padding(13).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12)) } }
}

private struct ClientAppointmentDetailSheet: View {
    @Environment(\.dismiss) private var dismiss
    let appointment: ClientAppointment
    let onScheduleFollowUp: () -> Void
    let onEdit: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text(appointment.title).font(.title2.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                    Label(appointment.allDay ? appointment.start.formatted(date: .complete, time: .omitted) : appointment.start.formatted(date: .complete, time: .shortened), systemImage: "calendar")
                        .font(.subheadline.weight(.semibold)).foregroundStyle(Color(hex: "#257259"))
                    if let location = appointment.location, !location.isEmpty {
                        Label(location, systemImage: "mappin.and.ellipse").font(.subheadline).foregroundStyle(Color(hex: "#716a91"))
                        if let url = mapsURL(for: location) {
                            Link(destination: url) {
                                Label("Apri in Mappe", systemImage: "map").font(.subheadline.weight(.bold))
                            }.foregroundStyle(Color(hex: "#257259"))
                        }
                    }
                    if let description = appointment.description, !description.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("DESCRIZIONE").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                            Text(description).font(.body).foregroundStyle(Color(hex: "#2d2754"))
                        }
                    }
                    Label(appointment.clientConfirmed == true ? "Confermato dal cliente" : "Conferma in attesa", systemImage: appointment.clientConfirmed == true ? "checkmark.circle.fill" : "clock")
                        .font(.subheadline.weight(.semibold)).foregroundStyle(Color(hex: appointment.clientConfirmed == true ? "#257259" : "#9a6817"))
                    if let reminderMinutes = appointment.reminderMinutes, reminderMinutes > 0 {
                        Label("Promemoria \(reminderLabel(reminderMinutes)) prima", systemImage: "bell")
                            .font(.subheadline).foregroundStyle(Color(hex: "#716a91"))
                    }
                    Button {
                        dismiss()
                        onScheduleFollowUp()
                    } label: {
                        Label("Programma richiamo", systemImage: "phone.badge.clock")
                            .font(.subheadline.weight(.bold)).frame(maxWidth: .infinity).padding(.vertical, 13)
                            .foregroundStyle(.white).background(Color(hex: "#257259")).clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    Button(action: onEdit) {
                        Label("Modifica appuntamento", systemImage: "pencil")
                            .font(.subheadline.weight(.bold)).frame(maxWidth: .infinity).padding(.vertical, 13)
                            .foregroundStyle(.white).background(Color(hex: "#2d2754")).clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }.padding(22)
            }
            .background(Color(hex: "#fffdf9"))
            .toolbar {
                ToolbarItem(placement: .principal) { Text("Appuntamento").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")) }
                ToolbarItem(placement: .topBarTrailing) { Button("Chiudi") { dismiss() } }
            }
        }
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

private struct ClientEditorView: View {
    let client: NativeClient?
    let clients: [NativeClient]
    let onClose: () -> Void
    let onSave: (NativeClientPayload, NativeClient?) async throws -> Void
    @State private var name = ""; @State private var company = ""; @State private var phone = ""; @State private var phone2 = ""; @State private var email = ""; @State private var contactFirstName = ""; @State private var contactLastName = ""; @State private var contactPhone = ""; @State private var contactEmail = ""; @State private var address = ""; @State private var city = ""; @State private var zipCode = ""; @State private var province = ""; @State private var fiscalCode = ""; @State private var vatNumber = ""; @State private var category = "privato"; @State private var notes = ""; @State private var favorite = false; @State private var parentClientID: UUID?; @State private var isSaving = false; @State private var errorMessage: String?

    private var isCompany: Bool { category == "azienda" }
    private var canSave: Bool { !(isCompany ? company : name).trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }

    private var hasChildren: Bool {
        guard let client else { return false }
        return clients.contains { $0.parentClientID == client.id }
    }
    private var possibleParents: [NativeClient] {
        guard !hasChildren else { return [] }
        return clients.filter { $0.parentClientID == nil && $0.id != client?.id }.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: "person.crop.circle.fill").foregroundStyle(.white).font(.title3).frame(width: 42, height: 42).background(Color(hex: "#3d8be8")).clipShape(RoundedRectangle(cornerRadius: 13))
                VStack(alignment: .leading, spacing: 2) { Text(client == nil ? "Nuovo contatto" : "Modifica contatto").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")); Text(client == nil ? "Aggiungi alla rubrica" : "Aggiorna i dati salvati").font(.caption).foregroundStyle(Color(hex: "#8a7f9f")) }
                Spacer(); Button(action: onClose) { Image(systemName: "xmark").foregroundStyle(Color(hex: "#8a7f9f")).frame(width: 36, height: 36).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 11)) }
            }.padding(18).overlay(alignment: .bottom) { Rectangle().fill(Color(hex: "#ead8bf")).frame(height: 1) }
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    field(isCompany ? "AZIENDA *" : "NOME E COGNOME *", icon: isCompany ? "building.2" : "person", placeholder: isCompany ? "Ragione sociale" : "Nome del contatto", text: isCompany ? $company : $name)
                    HStack(spacing: 12) {
                        if !isCompany { field("AZIENDA", icon: "building.2", placeholder: "Azienda", text: $company) }
                        Picker("Categoria", selection: $category) {
                            Text("Privato").tag("privato")
                            Text("Azienda").tag("azienda")
                            Text("Condominio").tag("condominio")
                            Text("Ente pubblico").tag("ente_pubblico")
                            Text("Altro").tag("altro")
                        }.pickerStyle(.menu).frame(maxWidth: .infinity, alignment: .leading).padding(11).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    VStack(alignment: .leading, spacing: 7) {
                        Label("CLIENTE PRINCIPALE", systemImage: "arrow.turn.up.left").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                        Picker("Cliente principale", selection: $parentClientID) {
                            Text("Autonomo / nessun principale").tag(Optional<UUID>.none)
                            ForEach(possibleParents) { parent in
                                Text(parent.company.isEmpty ? parent.name : "\(parent.name) · \(parent.company)").tag(Optional(parent.id))
                            }
                        }
                        .pickerStyle(.menu).frame(maxWidth: .infinity, alignment: .leading).padding(11).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
                        Text("Per collegare una struttura o un condominio a un’azienda o amministratore.").font(.caption2).foregroundStyle(Color(hex: "#8a7f9f"))
                    }
                    HStack(spacing: 12) { field("TELEFONO", icon: "phone", placeholder: "+39...", text: $phone); field("TELEFONO 2", icon: "phone", placeholder: "Alternativo", text: $phone2) }
                    if isCompany {
                        VStack(alignment: .leading, spacing: 12) {
                            Label("REFERENTE AZIENDALE", systemImage: "person.crop.circle").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                            HStack(spacing: 12) { field("NOME", icon: "person", placeholder: "Nome", text: $contactFirstName); field("COGNOME", icon: "person", placeholder: "Cognome", text: $contactLastName) }
                            HStack(spacing: 12) { field("TELEFONO", icon: "phone", placeholder: "Telefono", text: $contactPhone); field("EMAIL", icon: "envelope", placeholder: "Email", text: $contactEmail) }
                        }
                    }
                    field("EMAIL", icon: "envelope", placeholder: "email@esempio.it", text: $email)
                    field("INDIRIZZO", icon: "mappin.and.ellipse", placeholder: "Via e numero civico", text: $address)
                    HStack(spacing: 12) { field("CITTÀ", icon: "building", placeholder: "Città", text: $city); field("CAP", icon: "number", placeholder: "CAP", text: $zipCode) }
                    HStack(spacing: 12) { field("PROVINCIA", icon: "map", placeholder: "Provincia", text: $province); field("CODICE FISCALE", icon: "person.text.rectangle", placeholder: "Codice fiscale", text: $fiscalCode) }
                    field("PARTITA IVA", icon: "doc.text", placeholder: "Partita IVA", text: $vatNumber)
                    VStack(alignment: .leading, spacing: 7) { Label("NOTE", systemImage: "text.alignleft").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f")); TextField("Note aggiuntive...", text: $notes, axis: .vertical).lineLimit(3...5).clientInputStyle() }
                    Toggle(isOn: $favorite) { Label("Preferito", systemImage: favorite ? "star.fill" : "star") }.tint(Color(hex: "#3d8be8"))
                    if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                }.padding(20)
            }
            HStack(spacing: 12) { Button("Annulla", action: onClose).buttonStyle(.bordered).frame(maxWidth: .infinity); Button(isSaving ? "Salvo..." : "Salva contatto") { Task { await submit() } }.buttonStyle(.borderedProminent).tint(Color(hex: "#3d8be8")).frame(maxWidth: .infinity).disabled(!canSave || isSaving) }.padding(16).background(Color(hex: "#fffdf9"))
        }.frame(maxHeight: 700).background(Color(hex: "#fffdf9")).clipShape(RoundedRectangle(cornerRadius: 24)).onAppear(perform: load)
    }

    private func field(_ label: String, icon: String, placeholder: String, text: Binding<String>) -> some View { VStack(alignment: .leading, spacing: 7) { Label(label, systemImage: icon).font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f")); TextField(placeholder, text: text).platformNoAutocapitalization().clientInputStyle() }.frame(maxWidth: .infinity, alignment: .leading) }
    private func load() { guard let client else { return }; name = client.name; company = client.company; phone = client.phone; phone2 = client.phone2; email = client.email; contactFirstName = client.contactFirstName ?? ""; contactLastName = client.contactLastName ?? ""; contactPhone = client.contactPhone ?? ""; contactEmail = client.contactEmail ?? ""; address = client.address; city = client.city; zipCode = client.zipCode; province = client.province; fiscalCode = client.fiscalCode; vatNumber = client.vatNumber; category = client.category; notes = client.notes; favorite = client.isFavorite; parentClientID = client.parentClientID }
    private func submit() async { guard canSave else { return }; isSaving = true; defer { isSaving = false }; let payload = NativeClientPayload(name: (isCompany ? company : name).trimmingCharacters(in: .whitespacesAndNewlines), company: company, phone: phone, phone2: phone2, email: email, contactFirstName: contactFirstName, contactLastName: contactLastName, contactPhone: contactPhone, contactEmail: contactEmail, address: address, city: city, zipCode: zipCode, province: province, fiscalCode: fiscalCode, vatNumber: vatNumber, category: category.isEmpty ? "privato" : category, notes: notes, isFavorite: favorite, parentClientID: hasChildren ? client?.parentClientID : parentClientID, userID: nil); do { try await onSave(payload, client); onClose() } catch { errorMessage = "Impossibile salvare il contatto." } }
}

private extension View {
    func clientInputStyle() -> some View { self.font(.subheadline).foregroundStyle(Color(hex: "#2d2754")).padding(.horizontal, 13).padding(.vertical, 11).background(Color(hex: "#f8e8cf")).overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#e6d3b6"), lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 12)) }
}