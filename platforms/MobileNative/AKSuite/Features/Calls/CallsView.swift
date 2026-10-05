import SwiftUI

private struct CallClientPrefill: Decodable {
    let name: String
    let company: String?
    let phone: String?
    let email: String?
    let address: String?
    let city: String?
    let zipCode: String?
    let province: String?

    enum CodingKeys: String, CodingKey {
        case name, company, phone, email, address, city, province
        case zipCode = "zip_code"
    }

    var fullAddress: String {
        [address, [zipCode, city].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " "), province]
            .compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ", ")
    }
}

private struct CallRecord: Codable, Identifiable, Equatable {
    let id: UUID
    var callerName: String
    var company: String?
    var phone: String
    var email: String?
    var address: String?
    var notes: String
    var callType: String
    var priority: String
    var followUp: Bool
    var followUpDate: String?
    var followUpTime: String?
    var status: String
    var callDate: String

    enum CodingKeys: String, CodingKey {
        case id, company, phone, email, address, notes, status
        case callerName = "caller_name"
        case callType = "call_type"
        case priority
        case followUp = "follow_up"
        case followUpDate = "follow_up_date"
        case followUpTime = "follow_up_time"
        case callDate = "call_date"
    }
}

private struct CallPayload: Encodable {
    let callerName: String
    let company: String
    let phone: String
    let email: String
    let address: String
    let notes: String
    let callType: String
    let priority: String
    let followUp: Bool
    let followUpDate: String?
    let followUpTime: String?
    let status: String
    let callDate: String
    var userID: UUID?

    enum CodingKeys: String, CodingKey {
        case company, phone, email, address, notes, priority, status
        case callerName = "caller_name"
        case callType = "call_type"
        case followUp = "follow_up"
        case followUpDate = "follow_up_date"
        case followUpTime = "follow_up_time"
        case callDate = "call_date"
        case userID = "user_id"
    }
}

private enum CallDateFormatter {
    static let shortISO8601: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}

struct CallsView: View {
    @EnvironmentObject private var auth: AuthViewModel
    let initialCallID: UUID?
    let initialClientID: UUID?
    let initialFollowUpDate: Date?
    let initialFollowUpNote: String?
    let onBack: () -> Void
    @State private var calls: [CallRecord] = []
    @State private var query = ""
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var editingCall: CallRecord?
    @State private var selectedCall: CallRecord?
    @State private var showNewCall = false
    @State private var callToDelete: CallRecord?
    @State private var clientPrefill: CallClientPrefill?

    init(initialCallID: UUID? = nil, initialClientID: UUID? = nil, initialFollowUpDate: Date? = nil, initialFollowUpNote: String? = nil, onBack: @escaping () -> Void) {
        self.initialCallID = initialCallID
        self.initialClientID = initialClientID
        self.initialFollowUpDate = initialFollowUpDate
        self.initialFollowUpNote = initialFollowUpNote
        self.onBack = onBack
    }

    private var filteredCalls: [CallRecord] {
        guard !query.isEmpty else { return calls }
        return calls.filter {
            "\($0.callerName) \($0.company ?? "") \($0.phone) \($0.notes)".localizedCaseInsensitiveContains(query)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#efe8d8").ignoresSafeArea()
                content
            }
            .platformNavigationBarTitleDisplayMode()
            .toolbar {
                ToolbarItem(placement: .akLeading) {
                    Button(action: onBack) { Image(systemName: "chevron.left") }
                        .accessibilityLabel("Dashboard")
                }
                ToolbarItem(placement: .principal) {
                    Text("CHIAMATE").font(.subheadline.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                }
                ToolbarItem(placement: .akTrailing) {
                    Button { showNewCall = true } label: { Image(systemName: "plus") }
                        .accessibilityLabel("Nuova chiamata")
                }
            }
        }
        .task {
            await loadCalls()
            await loadClientPrefill()
        }
        .overlay {
            if showNewCall {
                CallEditorView(call: nil, clientPrefill: clientPrefill, initialFollowUpDate: initialFollowUpDate, initialFollowUpNote: initialFollowUpNote, onClose: closeNewCall, onSave: saveCall)
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            } else if let call = editingCall {
                CallEditorView(call: call, clientPrefill: nil, initialFollowUpDate: nil, initialFollowUpNote: nil, onClose: { withAnimation(.easeOut(duration: 0.2)) { editingCall = nil } }, onSave: saveCall)
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            } else if let call = selectedCall {
                CallDetailView(call: call, onClose: { withAnimation(.easeOut(duration: 0.2)) { selectedCall = nil } }, onEdit: { selectedCall = nil; editingCall = call }, onStatusChange: updateStatus)
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            }
        }
        .confirmationDialog("Eliminare questa chiamata?", isPresented: Binding(get: { callToDelete != nil }, set: { if !$0 { callToDelete = nil } }), titleVisibility: .visible) {
            Button("Elimina", role: .destructive) { if let call = callToDelete { Task { await delete(call) } } }
        } message: { Text(callToDelete?.callerName ?? "") }
    }

    @ViewBuilder
    private var content: some View {
        if isLoading {
            ProgressView("Caricamento chiamate...")
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("REGISTRO PERSONALE").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#e45f4e"))
                        Text("Ogni contatto, con il suo riepilogo e il prossimo passo.")
                            .font(.title3.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                    }
                    .padding(20).frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(hex: "#f8dfb9")).clipShape(RoundedRectangle(cornerRadius: 22))

                    HStack(spacing: 10) {
                        Image(systemName: "magnifyingglass").foregroundStyle(Color(hex: "#8a7f9f"))
                        TextField("Cerca nome, azienda o telefono", text: $query)
                            .platformNoAutocapitalization()
                        Text("\(filteredCalls.count)").font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#8a7f9f"))
                    }
                    .padding(13).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 14))

                    if let errorMessage {
                        Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b"))
                    }

                    if filteredCalls.isEmpty {
                        emptyState
                    } else {
                        ForEach(filteredCalls) { call in
                            CallRow(call: call, onOpen: { selectedCall = call }, onEdit: { editingCall = call }, onDelete: { callToDelete = call })
                        }
                    }
                }
                .padding(16)
            }
            .refreshable { await loadCalls() }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "phone.badge.plus").font(.system(size: 32)).foregroundStyle(Color(hex: "#e45f4e"))
            Text("Nessuna chiamata trovata").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
            Text("Registra il primo contatto per iniziare il registro.").font(.subheadline).foregroundStyle(Color(hex: "#716a91")).multilineTextAlignment(.center)
            Button("Nuova chiamata") { showNewCall = true }.buttonStyle(.borderedProminent).tint(Color(hex: "#2d2754"))
        }
        .frame(maxWidth: .infinity).padding(32).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private func loadCalls() async {
        isLoading = true
        defer { isLoading = false }
        do {
            calls = try await SupabaseService.shared.from("calls").select().order("call_date", ascending: false).execute().value
            if let initialCallID, let call = calls.first(where: { $0.id == initialCallID }) {
                selectedCall = call
            }
        } catch {
            errorMessage = "Impossibile caricare le chiamate."
        }
    }

    private func loadClientPrefill() async {
        guard let initialClientID else { return }
        do {
            clientPrefill = try await SupabaseService.shared.from("clients")
                .select("name,company,phone,email,address,city,zip_code,province")
                .eq("id", value: initialClientID.uuidString)
                .single()
                .execute().value
            showNewCall = true
        } catch {
            errorMessage = "Impossibile caricare i dati del cliente per il richiamo."
        }
    }

    private func closeNewCall() {
        withAnimation(.easeOut(duration: 0.2)) { showNewCall = false }
        if initialClientID != nil { onBack() }
    }

    private func saveCall(_ payload: CallPayload, _ existing: CallRecord?) async throws {
        if let existing {
            let updated: CallRecord = try await SupabaseService.shared.from("calls").update(payload).eq("id", value: existing.id.uuidString).select().single().execute().value
            calls = calls.map { $0.id == updated.id ? updated : $0 }
            scheduleFollowUp(for: updated)
        } else {
            guard let userID = auth.session?.user.id else {
                throw CallSaveError.missingAuthenticatedUser
            }
            var insertPayload = payload
            insertPayload.userID = userID
            let created: CallRecord = try await SupabaseService.shared.from("calls").insert(insertPayload).select().single().execute().value
            calls.insert(created, at: 0)
            scheduleFollowUp(for: created)
        }
    }

    private func scheduleFollowUp(for call: CallRecord) {
        guard let manager = PushNotificationManager.shared else { return }
        guard call.followUp, let followUpDate = call.followUpDate else {
            manager.cancelFollowUp(callID: call.id)
            return
        }
        let date = CallDateFormatter.shortISO8601.date(from: followUpDate) ?? .now
        let scheduledDate: Date
        if let time = call.followUpTime, let parsedTime = DateFormatter.parseCallTime(time) {
            scheduledDate = Calendar.current.date(bySettingHour: Calendar.current.component(.hour, from: parsedTime), minute: Calendar.current.component(.minute, from: parsedTime), second: 0, of: date) ?? date
        } else {
            scheduledDate = date
        }
        manager.scheduleFollowUp(callID: call.id, callerName: call.callerName, date: scheduledDate)
    }

    private func updateStatus(_ call: CallRecord, _ status: String) async {
        do {
            let updated: CallRecord = try await SupabaseService.shared.from("calls").update(["status": status]).eq("id", value: call.id.uuidString).select().single().execute().value
            calls = calls.map { $0.id == updated.id ? updated : $0 }
            selectedCall = updated
        } catch {
            errorMessage = "Impossibile aggiornare lo stato."
        }
    }

    private func delete(_ call: CallRecord) async {
        do {
            try await SupabaseService.shared.from("calls").delete().eq("id", value: call.id.uuidString).execute()
            calls.removeAll { $0.id == call.id }
        } catch {
            errorMessage = "Impossibile eliminare la chiamata."
        }
    }
}

private enum CallSaveError: Error {
    case missingAuthenticatedUser
}

private struct CallRow: View {
    let call: CallRecord
    let onOpen: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void

    var body: some View {
        Button(action: onOpen) {
            HStack(spacing: 12) {
                Image(systemName: "phone.fill").font(.headline).foregroundStyle(Color(hex: "#c75143"))
                    .frame(width: 44, height: 44).background(Color(hex: "#ffddd2")).clipShape(RoundedRectangle(cornerRadius: 13))
                VStack(alignment: .leading, spacing: 4) {
                    HStack { Text(call.callerName).font(.subheadline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")); StatusBadge(status: call.status) }
                    Text("\(call.company ?? "Contatto personale") - \(call.phone)").font(.caption).foregroundStyle(Color(hex: "#716a91")).lineLimit(1)
                    Text(call.notes.isEmpty ? "Nessuna nota aggiunta." : call.notes).font(.caption).foregroundStyle(Color(hex: "#8a7f9f")).lineLimit(1)
                }
                Spacer(minLength: 0)
                Menu {
                    Button("Modifica", action: onEdit)
                    Button("Elimina", role: .destructive, action: onDelete)
                } label: { Image(systemName: "ellipsis") }
                .foregroundStyle(Color(hex: "#716a91"))
            }
            .padding(14).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }
}

private struct StatusBadge: View {
    let status: String
    var body: some View {
        Text(label).font(.caption2.weight(.bold)).foregroundStyle(color).padding(.horizontal, 7).padding(.vertical, 3).background(color.opacity(0.14)).clipShape(Capsule())
    }
    private var label: String { ["pending": "In attesa", "in_corso": "In corso", "completed": "Completata", "cancelled": "Annullata"][status] ?? status }
    private var color: Color { ["pending": Color(hex: "#856300"), "in_corso": Color(hex: "#5144a1"), "completed": Color(hex: "#257259"), "cancelled": Color(hex: "#a83d35")][status] ?? Color.secondary }
}

private struct CallDetailView: View {
    let call: CallRecord
    let onClose: () -> Void
    let onEdit: () -> Void
    let onStatusChange: (CallRecord, String) async -> Void

    var body: some View {
        ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    HStack(spacing: 12) {
                        Text(String(call.callerName.prefix(1)).uppercased())
                            .font(.title3.weight(.black))
                            .foregroundStyle(Color(hex: "#8da0bd"))
                            .frame(width: 44, height: 44)
                            .background(Color(hex: "#f3f7fc"))
                            .clipShape(RoundedRectangle(cornerRadius: 13))
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 8) {
                                Text(call.callerName).font(.headline.weight(.black)).foregroundStyle(Color(hex: "#26324a"))
                                StatusBadge(status: call.status)
                            }
                            if let company = call.company, !company.isEmpty {
                                Label(company, systemImage: "building.2").font(.caption).foregroundStyle(Color(hex: "#8da0bd"))
                            }
                        }
                        Spacer()
                        Button(action: onClose) {
                            Image(systemName: "xmark").font(.subheadline.weight(.medium)).foregroundStyle(Color(hex: "#8da0bd"))
                                .frame(width: 40, height: 40).background(Color(hex: "#f3f7fc")).clipShape(RoundedRectangle(cornerRadius: 13))
                        }
                    }
                    .padding(22)
                    .overlay(alignment: .bottom) { Rectangle().fill(Color(hex: "#e8eef5")).frame(height: 1) }

                    VStack(spacing: 14) {
                        DetailSection(title: "Motivo della chiamata", icon: "text.bubble") {
                            Text(call.notes.isEmpty ? "Nessuna nota aggiunta." : call.notes)
                                .font(.subheadline).foregroundStyle(Color(hex: "#53627a"))
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        DetailSection(title: "Informazioni contatto", icon: "person") {
                            DetailContactRow(icon: "phone.fill", label: "Telefono", value: call.phone, tint: "#e45f4e")
                            if let email = call.email, !email.isEmpty {
                                DetailContactRow(icon: "envelope.fill", label: "Email", value: email, tint: "#9d8cff")
                            }
                        }

                        if let address = call.address, !address.isEmpty {
                            DetailSection(title: "Indirizzo cliente", icon: "mappin.and.ellipse") {
                                Text(address).font(.subheadline.weight(.semibold)).foregroundStyle(Color(hex: "#43516a"))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }

                        if call.followUp {
                            DetailSection(title: "Richiamo", icon: "calendar.badge.clock") {
                                HStack(spacing: 8) {
                                    Image(systemName: "clock.fill").foregroundStyle(Color(hex: "#e45f4e"))
                                    Text(followUpLabel).font(.subheadline.weight(.semibold)).foregroundStyle(Color(hex: "#43516a"))
                                }
                            }
                        }

                        Menu {
                            Button("In attesa") { Task { await onStatusChange(call, "pending") } }
                            Button("In corso") { Task { await onStatusChange(call, "in_corso") } }
                            Button("Completata") { Task { await onStatusChange(call, "completed") } }
                            Button("Annullata") { Task { await onStatusChange(call, "cancelled") } }
                        } label: {
                            Label("Aggiorna stato", systemImage: "arrow.triangle.2.circlepath")
                                .font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: "#716a91"))
                                .frame(maxWidth: .infinity).padding(.vertical, 13)
                                .background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 13))
                        }

                        Label("Chiamata ricevuta il \(formattedCallDate)", systemImage: "clock")
                            .font(.caption).foregroundStyle(Color(hex: "#8da0bd"))
                            .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 4).padding(.top, 2)
                    }
                    .padding(22)
                }
                .background(Color(hex: "#fffdf9")).clipShape(RoundedRectangle(cornerRadius: 26))
                .padding(16)
            }
            .frame(maxHeight: 620)
        }

    private var formattedCallDate: String {
        let date = ISO8601DateFormatter().date(from: call.callDate) ?? .now
        return date.formatted(.dateTime.day().month(.wide).year().hour().minute())
    }

    private var followUpLabel: String {
        let date = call.followUpDate ?? "Data non impostata"
        if let time = call.followUpTime, !time.isEmpty { return "\(date) alle \(time)" }
        return date
    }
}

private struct DetailSection<Content: View>: View {
    let title: String
    let icon: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title.uppercased(), systemImage: icon).font(.caption2.weight(.medium)).foregroundStyle(Color(hex: "#8da0bd"))
            content
        }
        .padding(16).background(Color(hex: "#ffffff").opacity(0.72))
        .overlay(RoundedRectangle(cornerRadius: 13).stroke(Color(hex: "#e8eef5"), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 13))
    }
}

private struct DetailContactRow: View {
    let icon: String
    let label: String
    let value: String
    let tint: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon).font(.caption).foregroundStyle(Color(hex: tint))
                .frame(width: 30, height: 30).background(Color(hex: tint).opacity(0.14)).clipShape(RoundedRectangle(cornerRadius: 8))
            VStack(alignment: .leading, spacing: 2) {
                Text(label.uppercased()).font(.caption2.weight(.medium)).foregroundStyle(Color(hex: "#8da0bd"))
                Text(value).font(.subheadline.weight(.semibold)).foregroundStyle(Color(hex: tint))
            }
        }
    }
}

private struct CallEditorView: View {
    let call: CallRecord?
    let clientPrefill: CallClientPrefill?
    let initialFollowUpDate: Date?
    let initialFollowUpNote: String?
    let onClose: () -> Void
    let onSave: (CallPayload, CallRecord?) async throws -> Void
    @State private var callerName = ""
    @State private var company = ""
    @State private var phone = ""
    @State private var email = ""
    @State private var address = ""
    @State private var notes = ""
    @State private var callType = "altro"
    @State private var priority = "media"
    @State private var status = "pending"
    @State private var followUp = false
    @State private var followUpDate = Date.now
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showPriority = false
    @State private var showStatus = false
    @State private var showFollowUp = true

    var body: some View {
        ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    header

                    VStack(alignment: .leading, spacing: 20) {
                        modalField("person", "Nome e cognome *") {
                            TextField("Mario Rossi", text: $callerName)
                                .platformWordsAutocapitalization()
                        }

                        modalField("text.bubble", "Motivo della chiamata *") {
                            TextField("Descrivi la richiesta...", text: $notes, axis: .vertical)
                                .lineLimit(4...6)
                        }

                        HStack(alignment: .top, spacing: 12) {
                            modalField("phone", "Telefono *") {
                                TextField("+39 123 456 7890", text: $phone).platformPhoneKeyboard()
                            }
                            modalField("envelope", "Email") {
                                TextField("email@esempio.it", text: $email)
                                    .platformEmailKeyboard()
                                    .platformNoAutocapitalization()
                            }
                        }

                        modalField("mappin.and.ellipse", "Indirizzo") {
                            TextField("Via Roma 1, 00100 Roma (RM)", text: $address)
                        }

                        DisclosureGroup("Altri dettagli") {
                            VStack(spacing: 12) {
                                TextField("Azienda", text: $company).callFieldStyle()
                                Picker("Tipo", selection: $callType) {
                                    Text("Informazioni").tag("informazioni"); Text("Assistenza").tag("assistenza"); Text("Vendita").tag("vendita"); Text("Reclamo").tag("reclamo"); Text("Altro").tag("altro")
                                }
                                .pickerStyle(.menu).callDropdownStyle()
                                if showPriority {
                                    Picker("Priorità", selection: $priority) {
                                        Text("Bassa").tag("bassa"); Text("Media").tag("media"); Text("Alta").tag("alta"); Text("Urgente").tag("urgente")
                                    }
                                    .pickerStyle(.menu).callDropdownStyle()
                                }
                                if showStatus {
                                    Picker("Stato", selection: $status) {
                                        Text("In attesa").tag("pending"); Text("In corso").tag("in_corso"); Text("Completata").tag("completed"); Text("Annullata").tag("cancelled")
                                    }
                                    .pickerStyle(.menu).callDropdownStyle()
                                }
                                if showFollowUp {
                                    Toggle("Richiamo necessario", isOn: $followUp)
                                    if followUp {
                                        DatePicker("Data e ora", selection: $followUpDate, displayedComponents: [.date, .hourAndMinute])
                                    }
                                }
                            }
                            .padding(.top, 12)
                        }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color(hex: "#716a91"))

                        if let errorMessage {
                            Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b"))
                        }

                        Button { Task { await submit() } } label: {
                            Text(isSaving ? "Salvataggio..." : call == nil ? "Salva chiamata" : "Aggiorna chiamata")
                                .font(.subheadline.weight(.bold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .foregroundStyle(Color.white)
                                .background(
                                    LinearGradient(
                                        colors: [Color(hex: "#e95d50"), Color(hex: "#efa633")],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 15))
                                .shadow(color: Color(hex: "#e45f4e").opacity(0.25), radius: 12, y: 6)
                        }
                        .disabled(!isValid || isSaving)
                        .opacity(isValid ? 1 : 0.55)
                    }
                    .padding(22)
                }
        }
        .frame(maxHeight: 700)
        .background(Color(hex: "#fffdf9"))
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .onAppear(perform: loadCall)
        .onChange(of: callType) { _ in showPriority = true }
        .onChange(of: priority) { _ in showStatus = true }
        .onChange(of: status) { _ in showFollowUp = true }
    }

    private var header: some View {
        HStack(spacing: 12) {
            Image(systemName: "phone.fill")
                .font(.headline)
                .foregroundStyle(Color.white)
                .frame(width: 44, height: 44)
                .background(
                    LinearGradient(colors: [Color(hex: "#e95d50"), Color(hex: "#efa633")], startPoint: .topLeading, endPoint: .bottomTrailing)
                )
                .clipShape(RoundedRectangle(cornerRadius: 13))
                .shadow(color: Color(hex: "#e45f4e").opacity(0.25), radius: 10, y: 5)

            VStack(alignment: .leading, spacing: 3) {
                Text(call == nil ? "Nuova Chiamata" : "Modifica Chiamata")
                    .font(.title3.weight(.black))
                    .foregroundStyle(Color(hex: "#26324a"))
                Label(headerDate.formatted(.dateTime.day().month(.abbreviated).year().hour().minute()), systemImage: "clock")
                    .font(.caption)
                    .foregroundStyle(Color(hex: "#8da0bd"))
            }

            Spacer()

            Button(action: onClose) {
                Image(systemName: "xmark")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Color(hex: "#8da0bd"))
                    .frame(width: 40, height: 40)
                    .background(Color(hex: "#f3f7fc"))
                    .clipShape(RoundedRectangle(cornerRadius: 13))
            }
            .accessibilityLabel("Chiudi")
        }
        .padding(22)
        .overlay(alignment: .bottom) { Rectangle().fill(Color(hex: "#e8eef5")).frame(height: 1) }
    }

    private var isValid: Bool {
        !callerName.trimmingCharacters(in: .whitespaces).isEmpty &&
        !phone.trimmingCharacters(in: .whitespaces).isEmpty &&
        !notes.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private var headerDate: Date {
        guard let callDate = call?.callDate else { return .now }
        return ISO8601DateFormatter().date(from: callDate) ?? .now
    }

    private func modalField<Content: View>(_ icon: String, _ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title.uppercased(), systemImage: icon)
                .font(.caption.weight(.medium))
                .foregroundStyle(Color(hex: "#8da0bd"))
            content()
                .callFieldStyle()
        }
    }

    private func loadCall() {
        guard let call else {
            if let clientPrefill {
                callerName = clientPrefill.name
                company = clientPrefill.company ?? ""
                phone = clientPrefill.phone ?? ""
                email = clientPrefill.email ?? ""
                address = clientPrefill.fullAddress
            }
            if let initialFollowUpDate { followUpDate = initialFollowUpDate; followUp = true }
            if let initialFollowUpNote { notes = initialFollowUpNote }
            return
        }
        callerName = call.callerName; company = call.company ?? ""; phone = call.phone; email = call.email ?? ""; address = call.address ?? ""; notes = call.notes; callType = call.callType; priority = call.priority; status = call.status; followUp = call.followUp
        if let value = call.followUpDate {
            let date = CallDateFormatter.shortISO8601.date(from: value) ?? .now
            if let time = call.followUpTime, let hourAndMinute = DateFormatter.parseCallTime(time) {
                followUpDate = Calendar.current.date(bySettingHour: Calendar.current.component(.hour, from: hourAndMinute), minute: Calendar.current.component(.minute, from: hourAndMinute), second: 0, of: date) ?? date
            } else { followUpDate = date }
        }
        showPriority = true
        showStatus = true
        showFollowUp = true
    }

    private func submit() async {
        isSaving = true
        defer { isSaving = false }
        let formatter = CallDateFormatter.shortISO8601
        let timeFormatter = DateFormatter(); timeFormatter.dateFormat = "HH:mm"; timeFormatter.locale = Locale(identifier: "en_US_POSIX")
        let payload = CallPayload(callerName: callerName.trimmingCharacters(in: .whitespaces), company: company.trimmingCharacters(in: .whitespaces), phone: phone.trimmingCharacters(in: .whitespaces), email: email.trimmingCharacters(in: .whitespaces), address: address.trimmingCharacters(in: .whitespaces), notes: notes.trimmingCharacters(in: .whitespaces), callType: callType, priority: priority, followUp: followUp, followUpDate: followUp ? formatter.string(from: followUpDate) : nil, followUpTime: followUp ? timeFormatter.string(from: followUpDate) : nil, status: status, callDate: call?.callDate ?? ISO8601DateFormatter().string(from: .now), userID: nil)
        do { try await onSave(payload, call); onClose() } catch { errorMessage = "Impossibile salvare la chiamata." }
    }
}

private extension DateFormatter {
    static let callTime: DateFormatter = { let formatter = DateFormatter(); formatter.dateFormat = "HH:mm"; formatter.locale = Locale(identifier: "en_US_POSIX"); return formatter }()
    static let callTimeWithSeconds: DateFormatter = { let formatter = DateFormatter(); formatter.dateFormat = "HH:mm:ss"; formatter.locale = Locale(identifier: "en_US_POSIX"); return formatter }()

    static func parseCallTime(_ value: String) -> Date? {
        callTime.date(from: value) ?? callTimeWithSeconds.date(from: value)
    }
}

private extension View {
    func callFieldStyle() -> some View {
        self
            .font(.subheadline)
            .foregroundStyle(Color(hex: "#26324a"))
            .padding(.horizontal, 15)
            .padding(.vertical, 14)
            .background(Color(hex: "#fae9ce"))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: "#e6d3b6"), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    func callDropdownStyle() -> some View {
        self
            .frame(maxWidth: .infinity, alignment: .center)
            .multilineTextAlignment(.center)
            .font(.subheadline.weight(.medium))
            .foregroundStyle(Color(hex: "#26324a"))
            .padding(.horizontal, 15)
            .padding(.vertical, 14)
            .background(Color(hex: "#fae9ce"))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: "#e6d3b6"), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}