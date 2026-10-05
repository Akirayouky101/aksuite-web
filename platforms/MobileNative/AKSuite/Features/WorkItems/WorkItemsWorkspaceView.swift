import SwiftUI
import UIKit

private enum NativeWorkUnit: String, Codable, CaseIterable {
    case pezzi, metri

    var label: String { self == .pezzi ? "Pezzi" : "Metri" }
}

private struct NativeChecklistEntry: Codable, Identifiable, Equatable {
    var id: String
    var text: String
    var done: Bool
    var quantity: Double?
    var unit: NativeWorkUnit?
    var materialId: String?
    var steps: [NativeChecklistEntry]?

    init(text: String) {
        id = UUID().uuidString
        self.text = text
        done = false
        quantity = 1
        unit = .pezzi
    }
}

private func listProgress(_ entries: [NativeChecklistEntry]) -> (done: Int, total: Int) {
    let leaves = entries.flatMap { entry in
        let steps = (entry.steps ?? []).filter { !$0.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        return steps.isEmpty ? [entry] : steps
    }.filter { !$0.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    return (leaves.filter(\.done).count, leaves.count)
}

private func quantityLabel(_ quantity: Double) -> String {
    quantity.formatted(.number.precision(.fractionLength(0...3)))
}

private func linkedQuantity(_ entries: [NativeChecklistEntry], materialID: String, unit: NativeWorkUnit) -> Double {
    entries.reduce(0) { total, entry in
        total + (entry.materialId == materialID && (entry.unit ?? .pezzi) == unit ? entry.quantity ?? 1 : 0)
            + linkedQuantity(entry.steps ?? [], materialID: materialID, unit: unit)
    }
}

private func installedQuantity(_ entries: [NativeChecklistEntry], materialID: String, unit: NativeWorkUnit) -> Double {
    entries.reduce(0) { total, entry in
        total + (entry.done && entry.materialId == materialID && (entry.unit ?? .pezzi) == unit ? entry.quantity ?? 1 : 0)
            + installedQuantity(entry.steps ?? [], materialID: materialID, unit: unit)
    }
}

private func mismatchedQuantity(_ entries: [NativeChecklistEntry], materialID: String, unit: NativeWorkUnit) -> Double {
    entries.reduce(0) { total, entry in
        total + (entry.materialId == materialID && (entry.unit ?? .pezzi) != unit ? entry.quantity ?? 1 : 0)
            + mismatchedQuantity(entry.steps ?? [], materialID: materialID, unit: unit)
    }
}

private func synchronizeMaterialUsage(_ materials: [NativeChecklistEntry], checklist: [NativeChecklistEntry], previousChecklist: [NativeChecklistEntry]? = nil) -> [NativeChecklistEntry] {
    materials.map { material in
        let unit = material.unit ?? .pezzi
        let hasLink = linkedQuantity(checklist, materialID: material.id, unit: unit) > 0
            || mismatchedQuantity(checklist, materialID: material.id, unit: unit) > 0
        let previous = previousChecklist ?? checklist
        let hadLink = linkedQuantity(previous, materialID: material.id, unit: unit) > 0
            || mismatchedQuantity(previous, materialID: material.id, unit: unit) > 0
        guard hasLink || hadLink else { return material }
        var updated = material
        updated.done = hasLink && mismatchedQuantity(checklist, materialID: material.id, unit: unit) == 0
            && abs(installedQuantity(checklist, materialID: material.id, unit: unit) - (material.quantity ?? 1)) < 0.000001
        return updated
    }
}

private struct NativeMaterialCoverage {
    let matched: Int
    let total: Int
    let orphaned: Int
    let unitMismatches: Double

    var complete: Bool { total > 0 && matched == total && orphaned == 0 && unitMismatches == 0 }
}

private func materialCoverage(_ materials: [NativeChecklistEntry], checklist: [NativeChecklistEntry]) -> NativeMaterialCoverage {
    let materialIDs = Set(materials.map(\.id))
    func orphaned(_ entries: [NativeChecklistEntry]) -> Int {
        entries.reduce(0) { count, entry in
            count + (entry.materialId.map { !materialIDs.contains($0) } == true ? 1 : 0) + orphaned(entry.steps ?? [])
        }
    }
    let matched = materials.filter { material in
        abs(installedQuantity(checklist, materialID: material.id, unit: material.unit ?? .pezzi) - (material.quantity ?? 1)) < 0.000001
            && mismatchedQuantity(checklist, materialID: material.id, unit: material.unit ?? .pezzi) == 0
    }.count
    let mismatches = materials.reduce(0) { $0 + mismatchedQuantity(checklist, materialID: $1.id, unit: $1.unit ?? .pezzi) }
    return NativeMaterialCoverage(matched: matched, total: materials.count, orphaned: orphaned(checklist), unitMismatches: mismatches)
}

private struct WorkClient: Decodable, Identifiable {
    let id: UUID
    let name: String
    let company: String?
    let parentClientID: UUID?

    enum CodingKeys: String, CodingKey {
        case id, name, company
        case parentClientID = "parent_client_id"
    }
}

private struct WorkIntervention: Decodable, Identifiable {
    let id: UUID
    let workItemID: UUID?
    let title: String
    let startDate: String
    let endDate: String?
    let allDay: Bool
    let location: String?

    enum CodingKeys: String, CodingKey {
        case id, title, location
        case workItemID = "work_item_id"
        case startDate = "start_date"
        case endDate = "end_date"
        case allDay = "all_day"
    }
}

private struct WorkItem: Codable, Identifiable, Equatable {
    let id: UUID
    var kind: String
    var clientID: UUID?
    var title: String
    var description: String
    var status: String
    var priority: String
    var scheduledAt: String?
    var dueDate: String?
    var nextAction: String
    var notes: String
    var checklist: [NativeChecklistEntry]
    var materials: [NativeChecklistEntry]
    var createdAt: String?
    var updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case id, kind, title, description, status, priority, notes, checklist, materials
        case clientID = "client_id"
        case scheduledAt = "scheduled_at"
        case dueDate = "due_date"
        case nextAction = "next_action"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

private struct WorkItemPayload: Encodable {
    var clientID: UUID?
    let kind: String
    let title: String
    let description: String
    let status: String
    let priority: String
    let scheduledAt: String?
    let dueDate: String?
    let nextAction: String
    let notes: String
    let checklist: [NativeChecklistEntry]
    let materials: [NativeChecklistEntry]
    var userID: UUID?

    enum CodingKeys: String, CodingKey {
        case kind, title, description, status, priority, notes, checklist, materials
        case clientID = "client_id"
        case scheduledAt = "scheduled_at"
        case dueDate = "due_date"
        case nextAction = "next_action"
        case userID = "user_id"
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(clientID, forKey: .clientID)
        try container.encode(kind, forKey: .kind)
        try container.encode(title, forKey: .title)
        try container.encode(description, forKey: .description)
        try container.encode(status, forKey: .status)
        try container.encode(priority, forKey: .priority)
        try container.encode(scheduledAt, forKey: .scheduledAt)
        try container.encode(dueDate, forKey: .dueDate)
        try container.encode(nextAction, forKey: .nextAction)
        try container.encode(notes, forKey: .notes)
        try container.encode(checklist, forKey: .checklist)
        try container.encode(materials, forKey: .materials)
        try container.encodeIfPresent(userID, forKey: .userID)
    }
}

private enum WorkStatus {
    static let all = "all"
    static let values = ["planned", "in_progress", "waiting", "completed"]

    static func label(_ status: String) -> String {
        switch status {
        case "planned": "Da pianificare"
        case "in_progress": "In corso"
        case "waiting": "In attesa"
        case "completed": "Completata"
        default: status
        }
    }
}

private struct WorkListUpdate: Encodable {
    var checklist: [NativeChecklistEntry]?
    var materials: [NativeChecklistEntry]?
}

private enum WorkListKind: String, Identifiable {
    case checklist, materials

    var id: String { rawValue }
    var title: String { self == .checklist ? "Checklist" : "Materiali" }
    var icon: String { self == .checklist ? "checklist" : "shippingbox" }
}

struct WorkItemsWorkspaceView: View {
    @EnvironmentObject private var auth: AuthViewModel
    let mode: String
    let initialClientID: UUID?
    let onBack: () -> Void
    @State private var items: [WorkItem] = []
    @State private var clients: [WorkClient] = []
    @State private var interventions: [WorkIntervention] = []
    @State private var query = ""
    @State private var selectedStatus = WorkStatus.all
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showEditor = false
    @State private var editingItem: WorkItem?
    @State private var selectedItemID: UUID?
    @State private var selectedList: WorkListKind?
    @State private var itemToDelete: WorkItem?

    private var selectedItem: WorkItem? { items.first { $0.id == selectedItemID } }

    private let columns = [GridItem(.adaptive(minimum: 300, maximum: 440), spacing: 12, alignment: .top)]

    private var scopedItems: [WorkItem] { items.filter { $0.kind == mode && (initialClientID == nil || $0.clientID == initialClientID) } }
    private var filteredItems: [WorkItem] {
        scopedItems.filter { item in
            (selectedStatus == WorkStatus.all || item.status == selectedStatus) &&
            (query.isEmpty || "\(item.title) \(item.description) \(item.nextAction) \(item.notes) \(clientName(for: item))".localizedCaseInsensitiveContains(query))
        }.sorted {
            ($0.dueDate ?? $0.scheduledAt ?? "9999") < ($1.dueDate ?? $1.scheduledAt ?? "9999")
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#efe8d8").ignoresSafeArea()
                if isLoading {
                    ProgressView("Caricamento lavorazioni...")
                } else {
                    content
                }
            }
            .platformNavigationBarTitleDisplayMode()
            .toolbar {
                ToolbarItem(placement: .akLeading) { Button(action: onBack) { Image(systemName: "chevron.left") }.accessibilityLabel(initialClientID == nil ? "Dashboard" : "Rubrica") }
                ToolbarItem(placement: .principal) { Text(mode == "todo" ? "COSE DA FARE" : "LAVORAZIONI").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")) }
                ToolbarItem(placement: .akTrailing) { Button { editingItem = nil; showEditor = true } label: { Image(systemName: "plus") }.accessibilityLabel(mode == "todo" ? "Nuova cosa da fare" : "Nuova lavorazione") }
            }
        }
        .task { await load() }
        .overlay {
            if showEditor {
                WorkItemEditorView(item: editingItem, clients: clients, mode: mode, defaultClientID: initialClientID, onClose: closeEditor, onSave: save)
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.9).combined(with: .opacity), removal: .scale(scale: 0.95).combined(with: .opacity)))
            }
        }
        .overlay {
            if let item = selectedItem {
                WorkItemSummaryView(item: item, interventions: interventions.filter { $0.workItemID == item.id }, clientName: clientName(for: item), onClose: { selectedItemID = nil }, onEdit: { selectedItemID = nil; editingItem = item; showEditor = true }, onOpenList: { selectedList = $0 })
                    .platformModalWidth(compact: 380, regular: 760)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
            }
        }
        .sheet(item: $selectedList) { kind in
            if let item = selectedItem {
                WorkListEditorView(kind: kind, simple: mode == "todo", title: item.title, entries: kind == .checklist ? item.checklist : item.materials, materials: item.materials, checklist: item.checklist) { entries in
                    try await saveList(entries, kind: kind, for: item)
                }
            }
        }
        .confirmationDialog("Eliminare questa lavorazione?", isPresented: Binding(get: { itemToDelete != nil }, set: { if !$0 { itemToDelete = nil } }), titleVisibility: .visible) {
            Button("Elimina", role: .destructive) { if let item = itemToDelete { Task { await delete(item) } } }
        } message: { Text(itemToDelete?.title ?? "") }
    }

    private var content: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 15) {
                header
                HStack(spacing: 9) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Color(hex: "#8a7f9f"))
                    TextField("Cerca lavoro o cliente...", text: $query).platformNoAutocapitalization()
                }
                .padding(13).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 14))

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 7) {
                        statusFilter("all", title: "Tutte", count: scopedItems.count)
                        statusFilter("planned", title: "Da pianificare", count: count("planned"))
                        if mode != "todo" {
                            statusFilter("in_progress", title: "In corso", count: count("in_progress"))
                            statusFilter("waiting", title: "In attesa", count: count("waiting"))
                        }
                        statusFilter("completed", title: "Completate", count: count("completed"))
                    }
                }

                if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                if filteredItems.isEmpty {
                    emptyState
                } else {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(filteredItems) { item in
                            WorkItemCard(
                                item: item,
                                mode: mode,
                                clientName: clientName(for: item),
                                onOpen: { selectedItemID = item.id },
                                onEdit: { editingItem = item; showEditor = true },
                                onStatusChange: { status in Task { await updateStatus(item, to: status) } },
                                onDelete: { itemToDelete = item }
                            )
                        }
                    }
                }
            }
            .padding(16)
        }
        .refreshable { await load() }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("DAL PRIMO CONTATTO ALLA CONSEGNA").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#257259"))
            Text(clients.first(where: { $0.id == initialClientID }).map { "\(mode == "todo" ? "Cose da fare" : "Lavorazioni") · \($0.name)" } ?? (mode == "todo" ? "Le tue cose da fare" : "Le tue lavorazioni")).font(.title2.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
            Text("\(filteredItems.count) in vista · \(count("in_progress")) in corso").font(.caption).foregroundStyle(Color(hex: "#716a91"))
        }
        .padding(18).frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "#d9e8d9")).clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "briefcase").font(.system(size: 32)).foregroundStyle(Color(hex: "#257259"))
            Text(query.isEmpty ? (mode == "todo" ? "Nessuna cosa da fare" : "Nessuna lavorazione") : "Nessun risultato").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
            Text(query.isEmpty ? "Registra un lavoro e tieni a portata di mano il prossimo passo." : "Prova a modificare la ricerca o il filtro.").font(.caption).foregroundStyle(Color(hex: "#716a91"))
            if scopedItems.isEmpty { Button(mode == "todo" ? "Nuova cosa da fare" : "Nuova lavorazione") { editingItem = nil; showEditor = true }.font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#257259")) }
        }
        .frame(maxWidth: .infinity).padding(30).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private func statusFilter(_ value: String, title: String, count: Int) -> some View {
        Button { selectedStatus = value } label: {
            HStack(spacing: 5) {
                Text(title)
                Text("\(count)").opacity(0.7)
            }
            .font(.caption.weight(.bold))
            .foregroundStyle(selectedStatus == value ? Color.white : Color(hex: "#716a91"))
            .padding(.horizontal, 12).padding(.vertical, 10)
            .background(selectedStatus == value ? Color(hex: "#2d2754") : Color(hex: "#fff8ed"))
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    private func count(_ status: String) -> Int { scopedItems.filter { $0.status == status }.count }
    private func clientName(for item: WorkItem) -> String {
        guard let client = clients.first(where: { $0.id == item.clientID }) else { return "Senza cliente" }
        let parent = clients.first(where: { $0.id == client.parentClientID })
        let path = parent.map { "\($0.name) › \(client.name)" } ?? client.name
        guard let company = client.company, !company.isEmpty, company.localizedCaseInsensitiveCompare(client.name) != .orderedSame else { return path }
        return "\(path) · \(company)"
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let loadedItems: [WorkItem] = SupabaseService.shared.from("work_items").select().order("updated_at", ascending: false).execute().value
            async let loadedClients: [WorkClient] = SupabaseService.shared.from("clients").select("id,name,company,parent_client_id").order("name", ascending: true).execute().value
            items = try await loadedItems
            clients = (try? await loadedClients) ?? []
            interventions = (try? await SupabaseService.shared.from("events").select("id,work_item_id,title,start_date,end_date,all_day,location").not("work_item_id", operator: .is, value: "null").execute().value) ?? []
            errorMessage = nil
        } catch {
            errorMessage = "Impossibile caricare le lavorazioni. Verifica la configurazione Supabase."
        }
    }

    private func save(_ payload: WorkItemPayload, _ existing: WorkItem?) async throws {
        if let existing {
            let updated: WorkItem = try await SupabaseService.shared.from("work_items").update(payload).eq("id", value: existing.id.uuidString).select().single().execute().value
            items = items.map { $0.id == updated.id ? updated : $0 }
        } else {
            guard let userID = auth.session?.user.id else { throw WorkItemSaveError.missingUser }
            var insert = payload
            insert.userID = userID
            let created: WorkItem = try await SupabaseService.shared.from("work_items").insert(insert).select().single().execute().value
            items.insert(created, at: 0)
        }
    }

    private func updateStatus(_ item: WorkItem, to status: String) async {
        do {
            let updated: WorkItem = try await SupabaseService.shared.from("work_items").update(["status": status, "updated_at": ISO8601DateFormatter().string(from: .now)]).eq("id", value: item.id.uuidString).select().single().execute().value
            items = items.map { $0.id == updated.id ? updated : $0 }
        } catch {
            errorMessage = "Impossibile aggiornare lo stato."
        }
    }

    private func saveList(_ entries: [NativeChecklistEntry], kind: WorkListKind, for item: WorkItem) async throws {
        let checklist = kind == .checklist ? entries : item.checklist
        let materials = synchronizeMaterialUsage(kind == .materials ? entries : item.materials, checklist: checklist, previousChecklist: item.checklist)
        let updated: WorkItem = try await SupabaseService.shared.from("work_items")
            .update(WorkListUpdate(checklist: checklist, materials: materials))
            .eq("id", value: item.id.uuidString).select().single().execute().value
        items = items.map { $0.id == updated.id ? updated : $0 }
    }

    private func delete(_ item: WorkItem) async {
        do {
            try await SupabaseService.shared.from("work_items").delete().eq("id", value: item.id.uuidString).execute()
            items.removeAll { $0.id == item.id }
            itemToDelete = nil
        } catch {
            errorMessage = "Impossibile eliminare la lavorazione."
        }
    }

    private func closeEditor() { showEditor = false; editingItem = nil }
}

private struct WorkItemCard: View {
    let item: WorkItem
    let mode: String
    let clientName: String
    let onOpen: () -> Void
    let onEdit: () -> Void
    let onStatusChange: (String) -> Void
    let onDelete: () -> Void

    private var dueLabel: String {
        guard let value = item.dueDate else { return "Senza scadenza" }
        guard let date = WorkDateFormatters.date.date(from: value) else { return value }
        return date.formatted(.dateTime.day().month(.abbreviated))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button(action: onOpen) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "briefcase.fill").font(.headline).foregroundStyle(Color(hex: "#257259"))
                            .frame(width: 40, height: 40).background(Color(hex: "#d9e8d9")).clipShape(RoundedRectangle(cornerRadius: 12))
                        VStack(alignment: .leading, spacing: 3) {
                            Text(item.title).font(.subheadline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")).lineLimit(2).multilineTextAlignment(.leading)
                            Text(clientName).font(.caption).foregroundStyle(Color(hex: "#716a91")).lineLimit(1)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#a99dbb"))
                    }
                    if !item.description.isEmpty { Text(item.description).font(.caption).foregroundStyle(Color(hex: "#514b70")).lineLimit(2).frame(maxWidth: .infinity, alignment: .leading) }
                    HStack(spacing: 6) {
                        Text(mode == "todo" && item.status == "planned" ? "Da fare" : WorkStatus.label(item.status)).font(.caption2.weight(.bold)).foregroundStyle(Color(hex: item.status == "completed" ? "#257259" : item.status == "waiting" ? "#856300" : "#376db5"))
                        Text(priorityLabel).font(.caption2.weight(.bold)).foregroundStyle(priorityColor).padding(.horizontal, 7).padding(.vertical, 4).background(priorityColor.opacity(0.12)).clipShape(Capsule())
                        Spacer(minLength: 0)
                        Label(dueLabel, systemImage: "calendar").font(.caption2.weight(.bold)).foregroundStyle(Color(hex: "#716a91"))
                    }
                    if !item.nextAction.isEmpty {
                        Label(item.nextAction, systemImage: "arrow.turn.down.right").font(.caption).foregroundStyle(Color(hex: "#514b70")).lineLimit(2).frame(maxWidth: .infinity, alignment: .leading)
                    }
                    let progress = listProgress(item.checklist)
                    if progress.total > 0 {
                        HStack(spacing: 6) { Image(systemName: "checklist"); Text("Checklist \(progress.done)/\(progress.total)"); Spacer(); Text("\(Int(Double(progress.done) / Double(progress.total) * 100))%") }
                            .font(.caption2.weight(.bold)).foregroundStyle(Color(hex: "#257259"))
                        ProgressView(value: Double(progress.done), total: Double(progress.total)).tint(Color(hex: "#257259"))
                    }
                    let coverage = materialCoverage(item.materials, checklist: item.checklist)
                    if mode != "todo" && (coverage.total > 0 || coverage.orphaned > 0) {
                        Label("\(coverage.matched)/\(coverage.total) materiali installati\(coverage.unitMismatches > 0 ? " · unità diversa" : "")\(coverage.orphaned > 0 ? " · da verificare" : "")", systemImage: coverage.complete ? "checkmark.circle.fill" : "exclamationmark.triangle")
                            .font(.caption2.weight(.bold)).foregroundStyle(Color(hex: coverage.complete ? "#257259" : "#856300"))
                    }
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            HStack {
                Menu {
                    ForEach(WorkStatus.values, id: \.self) { status in
                        Button(WorkStatus.label(status)) { onStatusChange(status) }
                    }
                } label: {
                    Label("Stato", systemImage: "arrow.trianglehead.2.clockwise.rotate.90")
                        .font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#376db5"))
                }
                Spacer()
                Button("Modifica", action: onEdit).font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#716a91"))
                Button(role: .destructive, action: onDelete) { Image(systemName: "trash") }.accessibilityLabel("Elimina lavorazione")
            }
        }
        .padding(14).frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "#fff8ed"))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color(hex: "#d8cbb8"), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var priorityLabel: String {
        switch item.priority { case "high": "Alta"; case "low": "Bassa"; default: "Normale" }
    }

    private var priorityColor: Color {
        switch item.priority { case "high": Color(hex: "#a83d35"); case "low": Color(hex: "#257259"); default: Color(hex: "#716a91") }
    }
}

private struct WorkItemSummaryView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var pdfShare: WorkItemPDFShare?
    @State private var exportError: String?
    let item: WorkItem
    let interventions: [WorkIntervention]
    let clientName: String
    let onClose: () -> Void
    let onEdit: () -> Void
    let onOpenList: (WorkListKind) -> Void

    private var orderedInterventions: [WorkIntervention] { interventions.sorted { $0.startDate < $1.startDate } }

    private func interventionDate(_ value: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: value) ?? {
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            return formatter.date(from: value)
        }()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.kind == "todo" ? "COSA DA FARE" : "RIEPILOGO LAVORAZIONE").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#257259"))
                    Text(item.title).font(.title3.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                    Text(clientName).font(.subheadline).foregroundStyle(Color(hex: "#716a91"))
                }
                Spacer()
                Button(action: onClose) { Image(systemName: "xmark") }.accessibilityLabel("Chiudi")
            }
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    HStack { Text(item.kind == "todo" && item.status == "planned" ? "Da fare" : WorkStatus.label(item.status)); Text(item.priority == "high" ? "Priorità alta" : item.priority == "low" ? "Priorità bassa" : "Priorità normale") }
                        .font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#257259"))
                    if !item.description.isEmpty { summaryDetail("DESCRIZIONE", item.description) }
                    if let due = item.dueDate { summaryDetail("SCADENZA", WorkDateFormatters.date.date(from: due)?.formatted(.dateTime.day().month().year()) ?? due) }
                    if let scheduled = item.scheduledAt { summaryDetail("APPUNTAMENTO", ISO8601DateFormatter().date(from: scheduled)?.formatted(date: .abbreviated, time: .shortened) ?? scheduled) }
                    if !item.nextAction.isEmpty { summaryDetail("PROSSIMA AZIONE", item.nextAction) }
                    if !item.notes.isEmpty { summaryDetail("NOTE", item.notes) }
                    if horizontalSizeClass == .compact {
                        VStack(spacing: 10) {
                            listButton(.checklist, entries: item.checklist)
                            if item.kind != "todo" { listButton(.materials, entries: item.materials) }
                        }
                    } else {
                        HStack(spacing: 12) {
                            listButton(.checklist, entries: item.checklist)
                            if item.kind != "todo" { listButton(.materials, entries: item.materials) }
                        }
                    }
                    if item.kind != "todo" {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("DIAGRAMMA INTERVENTI").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#257259"))
                                Spacer()
                                Text("\(interventions.count)").font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#716a91"))
                            }
                            if orderedInterventions.isEmpty {
                                Text("Nessun intervento nel calendario per questa lavorazione.").font(.caption).foregroundStyle(Color(hex: "#716a91"))
                            }
                            ForEach(orderedInterventions) { intervention in
                                let start = interventionDate(intervention.startDate)
                                let elapsed = (interventionDate(intervention.endDate ?? intervention.startDate) ?? .distantFuture) < .now
                                HStack(alignment: .top, spacing: 12) {
                                    Circle().fill(Color(hex: elapsed ? "#716a91" : "#257259")).frame(width: 10, height: 10).padding(.top, 4)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("\(start.map { intervention.allDay ? $0.formatted(date: .abbreviated, time: .omitted) : $0.formatted(date: .abbreviated, time: .shortened) } ?? intervention.startDate) · \(elapsed ? "Trascorso" : "In programma")")
                                            .font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#257259"))
                                        Text(intervention.title).font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: "#2d2754"))
                                        if let location = intervention.location, !location.isEmpty { Text(location).font(.caption).foregroundStyle(Color(hex: "#716a91")) }
                                    }
                                }.padding(.leading, 6).padding(.vertical, 5)
                            }
                        }.padding(.top, 5)
                    }
                    if let exportError { Text(exportError).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                    if item.kind != "todo" { Button {
                        do { pdfShare = WorkItemPDFShare(url: try WorkItemPDF.create(for: item, clientName: clientName, interventions: orderedInterventions)); exportError = nil }
                        catch { exportError = "Impossibile creare il PDF della lavorazione." }
                    } label: {
                        Label("Esporta e condividi PDF", systemImage: "square.and.arrow.up")
                            .frame(maxWidth: .infinity).padding(12)
                    }.buttonStyle(.borderedProminent).tint(Color(hex: "#257259")) }
                    Button(item.kind == "todo" ? "Modifica attività" : "Modifica lavorazione", action: onEdit).buttonStyle(.borderedProminent).tint(Color(hex: "#2d2754")).frame(maxWidth: .infinity)
                }
            }
        }
        .padding(20).frame(maxHeight: 720).background(Color(hex: "#fffdf9")).clipShape(RoundedRectangle(cornerRadius: 24)).padding(16)
        .sheet(item: $pdfShare) { share in WorkItemShareSheet(url: share.url) }
    }

    private func summaryDetail(_ heading: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(heading).font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#716a91"))
            Text(value).font(.subheadline).foregroundStyle(Color(hex: "#2d2754"))
        }.frame(maxWidth: .infinity, alignment: .leading)
    }

    private func listButton(_ kind: WorkListKind, entries: [NativeChecklistEntry]) -> some View {
        let progress = listProgress(entries)
        let coverage = materialCoverage(item.materials, checklist: item.checklist)
        return Button { onOpenList(kind) } label: {
            VStack(alignment: .leading, spacing: 7) {
                Label(kind.title, systemImage: kind.icon).font(.subheadline.weight(.bold))
                Text("\(progress.done)/\(progress.total) \(kind == .materials ? "utilizzati" : "fatte")").font(.caption)
                if kind == .checklist && progress.total > 0 {
                    ProgressView(value: Double(progress.done), total: Double(progress.total)).tint(Color(hex: "#257259"))
                    Text("\(Int(Double(progress.done) / Double(progress.total) * 100))%").font(.caption.weight(.black))
                }
                if kind == .materials && (coverage.total > 0 || coverage.orphaned > 0) {
                    Label("\(coverage.matched)/\(coverage.total) installati\(coverage.unitMismatches > 0 ? " · unità diversa" : "")\(coverage.orphaned > 0 ? " · da verificare" : "")", systemImage: coverage.complete ? "checkmark.circle.fill" : "exclamationmark.triangle")
                        .font(.caption2.weight(.bold)).foregroundStyle(Color(hex: coverage.complete ? "#257259" : "#856300"))
                }
            }.frame(maxWidth: .infinity, alignment: .leading).padding(12).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
        }.buttonStyle(.plain).foregroundStyle(Color(hex: "#2d2754")).frame(maxWidth: .infinity)
    }
}

private struct WorkListEditorView: View {
    @Environment(\.dismiss) private var dismiss
    let kind: WorkListKind
    let simple: Bool
    let title: String
    let materials: [NativeChecklistEntry]
    let checklist: [NativeChecklistEntry]
    let onSave: ([NativeChecklistEntry]) async throws -> Void
    @State private var draft: [NativeChecklistEntry]
    @State private var selectedParentID: String?
    @State private var ordering: [NativeChecklistEntry]?
    @State private var newText = ""
    @State private var newStepText = ""
    @State private var editingID: String?
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(kind: WorkListKind, simple: Bool = false, title: String, entries: [NativeChecklistEntry], materials: [NativeChecklistEntry], checklist: [NativeChecklistEntry], onSave: @escaping ([NativeChecklistEntry]) async throws -> Void) {
        self.kind = kind
        self.simple = simple
        self.title = title
        self.materials = materials
        self.checklist = checklist
        self.onSave = onSave
        _draft = State(initialValue: entries)
    }

    private var parent: NativeChecklistEntry? { draft.first { $0.id == selectedParentID } }
    private var visibleEntries: [NativeChecklistEntry] { parent?.steps ?? draft }
    private var currentMaterials: [NativeChecklistEntry] { kind == .materials ? draft : materials }
    private var currentChecklist: [NativeChecklistEntry] { kind == .materials ? checklist : draft }
    private func hasMaterialLink(_ material: NativeChecklistEntry) -> Bool {
        let unit = material.unit ?? .pezzi
        return linkedQuantity(currentChecklist, materialID: material.id, unit: unit) > 0
            || mismatchedQuantity(currentChecklist, materialID: material.id, unit: unit) > 0
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                if parent != nil && ordering == nil {
                    Button { if !newStepText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { addEntry() }; selectedParentID = nil; editingID = nil } label: { Image(systemName: "chevron.left") }.accessibilityLabel("Checklist")
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.caption).foregroundStyle(Color(hex: "#716a91"))
                    Text(ordering == nil ? parent?.text ?? kind.title : "Riordina \(parent?.text ?? kind.title)")
                        .font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")).lineLimit(2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                if ordering == nil && visibleEntries.count > 1 {
                    Button("Riordina") { ordering = visibleEntries }
                        .font(.caption.weight(.bold)).lineLimit(1).fixedSize()
                        .disabled(!pendingText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        .accessibilityHint("Apri l'ordinamento delle voci")
                }
                Button { dismiss() } label: { Image(systemName: "xmark") }.disabled(isSaving).accessibilityLabel("Chiudi")
            }.padding(18)
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 13) {
                    if let ordering {
                        ForEach(Array(ordering.enumerated()), id: \.element.id) { index, entry in
                            HStack(spacing: 12) {
                                Text("\(index + 1)").font(.caption.weight(.bold)).frame(width: 24)
                                Text(entry.text).frame(maxWidth: .infinity, alignment: .leading)
                                Button { move(index, by: -1) } label: { Image(systemName: "arrow.up") }.disabled(index == 0 || isSaving).accessibilityLabel("Sposta \(entry.text) su")
                                Button { move(index, by: 1) } label: { Image(systemName: "arrow.down") }.disabled(index == ordering.count - 1 || isSaving).accessibilityLabel("Sposta \(entry.text) giù")
                            }.padding(12).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    } else {
                        let progress = listProgress(visibleEntries)
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Text("\(progress.done) \(kind == .materials ? "utilizzati" : "fatte") · \(progress.total - progress.done) \(kind == .materials ? "da utilizzare" : "da fare")")
                                .font(.caption.weight(.bold)).frame(maxWidth: .infinity, alignment: .leading)
                            if progress.total > 0 { Text("\(Int(Double(progress.done) / Double(progress.total) * 100))%").font(.caption.weight(.black)).fixedSize() }
                        }
                        if progress.total > 0 { ProgressView(value: Double(progress.done), total: Double(progress.total)).tint(Color(hex: "#257259")) }
                        ForEach(visibleEntries) { entry in entryRow(entry) }
                        HStack {
                            TextField(kind == .materials ? "Nuovo materiale" : parent == nil ? "Nuova voce" : "Nuova sottoattività", text: parent == nil ? $newText : $newStepText).onSubmit(addEntry).paymentInputStyle()
                            Button(action: addEntry) { Image(systemName: "plus") }.disabled(pendingText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty).accessibilityLabel("Aggiungi voce")
                        }
                    }
                    if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                }.padding(20)
            }
            HStack(spacing: 12) {
                Button { if ordering != nil { ordering = nil } else { dismiss() } } label: {
                    Text("Annulla").font(.subheadline.weight(.bold)).frame(maxWidth: .infinity).padding(.vertical, 12)
                        .foregroundStyle(Color(hex: "#2d2754")).background(Color(hex: "#f0ece8")).clipShape(RoundedRectangle(cornerRadius: 12))
                }.buttonStyle(.plain).disabled(isSaving)
                Button { Task { await persistOrderOrList() } } label: {
                    Text(isSaving ? "Salvo..." : "Salva").font(.subheadline.weight(.bold)).frame(maxWidth: .infinity).padding(.vertical, 12)
                        .foregroundStyle(.white).background(Color(hex: "#2d2754")).clipShape(RoundedRectangle(cornerRadius: 12))
                }.buttonStyle(.plain).disabled(isSaving)
            }.padding(16).background(Color(hex: "#fffdf9"))
        }.foregroundStyle(Color(hex: "#2d2754")).background(Color(hex: "#fffdf9")).presentationDetents([.large])
    }

    private func entryRow(_ entry: NativeChecklistEntry) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 10) {
                Button { toggle(entry) } label: { Image(systemName: entry.done ? "checkmark.square.fill" : "square").foregroundStyle(Color(hex: "#257259")) }
                    .disabled(kind == .materials && hasMaterialLink(entry))
                    .accessibilityLabel("\(entry.done ? "Deseleziona" : "Completa") \(entry.text)")
                    .accessibilityHint(kind == .materials && hasMaterialLink(entry) ? "Utilizzo gestito dalla checklist lavorazione" : "")
                if kind == .checklist && parent == nil && editingID != entry.id {
                    Button { selectedParentID = entry.id } label: {
                        HStack { Text(entry.text).frame(maxWidth: .infinity, alignment: .leading); if let steps = entry.steps, !steps.isEmpty { let progress = listProgress(steps); Text("\(progress.done)/\(progress.total)").font(.caption) }; Image(systemName: "chevron.right") }
                    }.buttonStyle(.plain)
                } else {
                    TextField("Voce", text: Binding(get: { currentText(for: entry.id) }, set: { updateText(entry.id, to: $0) }))
                        .onSubmit { editingID = nil }.paymentInputStyle()
                }
                if kind == .checklist && parent == nil {
                    Button { editingID = entry.id } label: { Image(systemName: "pencil") }.accessibilityLabel("Rinomina \(entry.text)")
                }
                Button(role: .destructive) { remove(entry.id) } label: { Image(systemName: "trash") }.accessibilityLabel("Elimina \(entry.text)")
            }
            if !simple { HStack(spacing: 8) {
                Text("Quantità").font(.caption)
                TextField("Quantità", value: Binding(get: { currentEntry(for: entry.id)?.quantity ?? 1 }, set: { value in
                    guard value > 0, value.isFinite, (currentEntry(for: entry.id)?.unit ?? .pezzi) == .metri || value.rounded() == value else { return }
                    updateEntry(entry.id) { $0.quantity = value }
                }), format: .number).keyboardType(.decimalPad).frame(width: 65).paymentInputStyle()
                Spacer(minLength: 0)
                Menu {
                    ForEach(NativeWorkUnit.allCases, id: \.self) { unit in
                        Button(unit.label) {
                            updateEntry(entry.id) { current in
                                current.unit = unit
                                if unit == .pezzi && (current.quantity ?? 1).rounded() != (current.quantity ?? 1) { current.quantity = 1 }
                            }
                        }
                    }
                } label: {
                    Label((entry.unit ?? .pezzi).label, systemImage: "chevron.up.chevron.down")
                        .font(.caption.weight(.bold)).lineLimit(1).foregroundStyle(Color(hex: "#2d2754"))
                        .padding(.horizontal, 10).padding(.vertical, 9)
                        .background(Color(hex: "#fffdf9")).clipShape(RoundedRectangle(cornerRadius: 10))
                }.accessibilityLabel("Unità \((entry.unit ?? .pezzi).label)")
            } }
            if kind == .checklist && !simple {
                Menu {
                    Button("Nessuno") { updateEntry(entry.id) { $0.materialId = nil } }
                    ForEach(currentMaterials) { material in
                        Button("\(material.text) (\((material.unit ?? .pezzi).label))") {
                            updateEntry(entry.id) { current in
                                current.materialId = material.id
                                current.unit = material.unit ?? .pezzi
                                if current.unit == .pezzi && (current.quantity ?? 1).rounded() != (current.quantity ?? 1) { current.quantity = 1 }
                            }
                        }
                    }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "shippingbox").fixedSize()
                        Text(currentMaterials.first(where: { $0.id == entry.materialId })?.text ?? (entry.materialId == nil ? "Nessun materiale" : "Materiale eliminato"))
                            .lineLimit(1).truncationMode(.tail).frame(maxWidth: .infinity, alignment: .leading)
                        Image(systemName: "chevron.down").font(.caption2.weight(.bold)).fixedSize()
                    }
                    .font(.caption.weight(.semibold)).foregroundStyle(Color(hex: "#2d2754"))
                    .padding(.horizontal, 12).padding(.vertical, 10)
                    .background(Color(hex: "#fffdf9")).clipShape(RoundedRectangle(cornerRadius: 10))
                    .frame(maxWidth: .infinity)
                }.accessibilityLabel("Materiale per \(entry.text)")
            }
            if !simple { coverageStatus(for: entry) }
        }.font(.subheadline).padding(10).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func currentText(for id: String) -> String { visibleEntries.first { $0.id == id }?.text ?? "" }
    private func currentEntry(for id: String) -> NativeChecklistEntry? { visibleEntries.first { $0.id == id } }
    private var pendingText: String { parent == nil ? newText : newStepText }
    private func updateText(_ id: String, to value: String) { updateEntry(id) { $0.text = value } }

    @ViewBuilder
    private func coverageStatus(for entry: NativeChecklistEntry) -> some View {
        if kind == .materials {
            coverageLabel(material: entry)
        } else if let materialID = entry.materialId {
            if let material = currentMaterials.first(where: { $0.id == materialID }) { coverageLabel(material: material) }
            else { Label("Materiale eliminato", systemImage: "exclamationmark.triangle").foregroundStyle(Color(hex: "#a83d35")).font(.caption.weight(.bold)) }
        }
    }

    private func coverageLabel(material: NativeChecklistEntry) -> some View {
        let unit = material.unit ?? .pezzi
        let installed = installedQuantity(currentChecklist, materialID: material.id, unit: unit)
        let mismatched = mismatchedQuantity(currentChecklist, materialID: material.id, unit: unit)
        let required = material.quantity ?? 1
        return Label("\(quantityLabel(installed))/\(quantityLabel(required)) \(unit.label.lowercased()) installati\(mismatched > 0 ? " · unità diversa" : "")", systemImage: mismatched > 0 ? "exclamationmark.triangle" : abs(installed - required) < 0.000001 ? "checkmark.circle.fill" : "circle.dotted")
            .font(.caption.weight(.bold))
            .foregroundStyle(Color(hex: mismatched > 0 ? "#a83d35" : abs(installed - required) < 0.000001 ? "#257259" : "#856300"))
    }

    private func updateEntry(_ id: String, change: (inout NativeChecklistEntry) -> Void) {
        if let selectedParentID {
            guard let index = draft.firstIndex(where: { $0.id == selectedParentID }), let stepIndex = draft[index].steps?.firstIndex(where: { $0.id == id }) else { return }
            change(&draft[index].steps![stepIndex])
            draft[index].done = draft[index].steps?.allSatisfy(\.done) ?? false
        } else if let index = draft.firstIndex(where: { $0.id == id }) {
            change(&draft[index])
        }
    }

    private func toggle(_ entry: NativeChecklistEntry) {
        updateEntry(entry.id) { current in
            current.done.toggle()
            if let steps = current.steps { current.steps = steps.map { var step = $0; step.done = current.done; return step } }
        }
    }

    private func remove(_ id: String) {
        if let selectedParentID, let index = draft.firstIndex(where: { $0.id == selectedParentID }) {
            draft[index].steps?.removeAll { $0.id == id }
            draft[index].done = draft[index].steps?.isEmpty == false && draft[index].steps?.allSatisfy(\.done) == true
        } else { draft.removeAll { $0.id == id } }
    }

    private func addEntry() {
        let text = pendingText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        if let selectedParentID, let index = draft.firstIndex(where: { $0.id == selectedParentID }) {
            draft[index].steps = (draft[index].steps ?? []) + [NativeChecklistEntry(text: text)]
            draft[index].done = false
        } else { draft.append(NativeChecklistEntry(text: text)) }
        if parent == nil { newText = "" } else { newStepText = "" }
    }

    private func move(_ index: Int, by offset: Int) {
        guard var ordering, ordering.indices.contains(index), ordering.indices.contains(index + offset) else { return }
        ordering.swapAt(index, index + offset)
        self.ordering = ordering
    }

    private func persistOrderOrList() async {
        var updated = draft
        if let ordering {
            if let selectedParentID, let index = updated.firstIndex(where: { $0.id == selectedParentID }) { updated[index].steps = ordering }
            else { updated = ordering }
        } else if !pendingText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            let entry = NativeChecklistEntry(text: pendingText.trimmingCharacters(in: .whitespacesAndNewlines))
            if let selectedParentID, let index = updated.firstIndex(where: { $0.id == selectedParentID }) { updated[index].steps = (updated[index].steps ?? []) + [entry]; updated[index].done = false }
            else { updated.append(entry) }
        }
        isSaving = true
        errorMessage = nil
        do {
            try await onSave(updated)
            draft = updated
            newText = ""
            newStepText = ""
            if ordering != nil { self.ordering = nil } else { dismiss() }
        } catch { errorMessage = "Impossibile salvare la lista." }
        isSaving = false
    }
}

private struct WorkItemEditorView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    let item: WorkItem?
    let clients: [WorkClient]
    let mode: String
    let defaultClientID: UUID?
    let onClose: () -> Void
    let onSave: (WorkItemPayload, WorkItem?) async throws -> Void

    @State private var title = ""
    @State private var description = ""
    @State private var clientID: UUID?
    @State private var status = "planned"
    @State private var priority = "normal"
    @State private var hasDueDate = false
    @State private var dueDate = Date.now
    @State private var hasAppointment = false
    @State private var scheduledAt = Date.now
    @State private var nextAction = ""
    @State private var notes = ""
    @State private var checklist: [NativeChecklistEntry] = []
    @State private var materials: [NativeChecklistEntry] = []
    @State private var selectedList: WorkListKind?
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: "briefcase.fill").foregroundStyle(Color(hex: "#257259")).font(.title3).frame(width: 42, height: 42).background(Color(hex: "#d9e8d9")).clipShape(RoundedRectangle(cornerRadius: 13))
                VStack(alignment: .leading, spacing: 2) {
                    Text(mode == "todo" ? item == nil ? "Nuova cosa da fare" : "Modifica cosa da fare" : item == nil ? "Nuova lavorazione" : "Modifica lavorazione").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                    Text("Un posto solo per il lavoro e il prossimo passo").font(.caption).foregroundStyle(Color(hex: "#8a7f9f"))
                }
                Spacer()
                Button(action: onClose) { Image(systemName: "xmark").foregroundStyle(Color(hex: "#8a7f9f")).frame(width: 36, height: 36).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 11)) }
            }
            .padding(18).overlay(alignment: .bottom) { Rectangle().fill(Color(hex: "#ead8bf")).frame(height: 1) }

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    field(mode == "todo" ? "COSA DEVI FARE" : "NOME DEL LAVORO", placeholder: mode == "todo" ? "Es. Sentire Pietro" : "Es. Installazione cucina", text: $title)
                    VStack(alignment: .leading, spacing: 7) {
                        fieldLabel("CLIENTE", icon: "person")
                        Menu {
                            Button("Nessun cliente") { clientID = nil }
                            ForEach(clients) { client in Button(clientOptionLabel(client)) { clientID = client.id } }
                        } label: {
                            HStack(spacing: 8) {
                                Text(clients.first(where: { $0.id == clientID }).map(clientOptionLabel) ?? "Nessun cliente")
                                    .lineLimit(1).truncationMode(.tail).frame(maxWidth: .infinity, alignment: .leading)
                                Image(systemName: "chevron.up.chevron.down").font(.caption.weight(.bold)).fixedSize()
                            }
                            .font(.subheadline).foregroundStyle(Color(hex: "#2d2754"))
                            .padding(12).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    field("DESCRIZIONE", placeholder: "Cosa c'è da fare?", text: $description)

                    if horizontalSizeClass == .compact {
                        VStack(spacing: 10) {
                            listButton(.checklist, entries: checklist)
                            if mode != "todo" { listButton(.materials, entries: materials) }
                        }
                    } else {
                        HStack(spacing: 12) {
                            listButton(.checklist, entries: checklist)
                            if mode != "todo" { listButton(.materials, entries: materials) }
                        }
                    }

                    HStack(spacing: 12) {
                        pickerField("STATO", selection: $status, values: mode == "todo" ? [("planned", "Da fare"), ("completed", "Completata")] : WorkStatus.values.map { ($0, WorkStatus.label($0)) })
                        pickerField("PRIORITÀ", selection: $priority, values: [("low", "Bassa"), ("normal", "Normale"), ("high", "Alta")])
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Toggle("Imposta una scadenza", isOn: $hasDueDate).tint(Color(hex: "#3d8be8"))
                        if hasDueDate { DatePicker("Scadenza", selection: $dueDate, displayedComponents: .date).datePickerStyle(.compact) }
                        Toggle("Fissa un appuntamento", isOn: $hasAppointment).tint(Color(hex: "#3d8be8"))
                        if hasAppointment { DatePicker("Data e ora", selection: $scheduledAt, displayedComponents: [.date, .hourAndMinute]).datePickerStyle(.compact) }
                    }
                    .font(.subheadline.weight(.medium)).padding(14).background(Color(hex: "#f4eddf")).clipShape(RoundedRectangle(cornerRadius: 15))

                    field("PROSSIMA AZIONE", placeholder: "Es. richiamare per confermare", text: $nextAction)
                    VStack(alignment: .leading, spacing: 7) {
                        fieldLabel("NOTE", icon: "text.alignleft")
                        TextField("Dettagli da ritrovare al volo...", text: $notes, axis: .vertical).lineLimit(3...6).paymentInputStyle()
                    }
                    if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                }
                .padding(20)
            }

            HStack(spacing: 12) {
                Button(action: onClose) {
                    Text("Annulla").font(.subheadline.weight(.bold)).frame(maxWidth: .infinity).padding(.vertical, 12)
                        .foregroundStyle(Color(hex: "#2d2754")).background(Color(hex: "#f0ece8")).clipShape(RoundedRectangle(cornerRadius: 12))
                }.buttonStyle(.plain)
                Button { Task { await submit() } } label: {
                    Text(isSaving ? "Salvo..." : horizontalSizeClass == .compact ? "Salva" : mode == "todo" ? "Salva attività" : "Salva lavorazione")
                        .font(.subheadline.weight(.bold)).frame(maxWidth: .infinity).padding(.vertical, 12)
                        .foregroundStyle(.white).background(Color(hex: "#3d8be8")).clipShape(RoundedRectangle(cornerRadius: 12))
                }.buttonStyle(.plain).disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
            }
            .padding(16).background(Color(hex: "#fffdf9"))
        }
        .frame(maxHeight: 760).background(Color(hex: "#fffdf9")).clipShape(RoundedRectangle(cornerRadius: 24)).padding(16)
        .onAppear(perform: load)
        .sheet(item: $selectedList) { kind in
            WorkListEditorView(kind: kind, simple: mode == "todo", title: title, entries: kind == .checklist ? checklist : materials, materials: materials, checklist: checklist) { entries in
                if kind == .checklist {
                    let previous = checklist
                    checklist = entries
                    materials = synchronizeMaterialUsage(materials, checklist: entries, previousChecklist: previous)
                } else { materials = synchronizeMaterialUsage(entries, checklist: checklist) }
            }
        }
    }

    private func listButton(_ kind: WorkListKind, entries: [NativeChecklistEntry]) -> some View {
        let progress = listProgress(entries)
        return Button { selectedList = kind } label: {
            HStack {
                Label(kind.title, systemImage: kind.icon).font(.caption.weight(.bold)).lineLimit(1)
                Spacer(minLength: 2)
                Text(kind == .checklist && progress.total > 0 ? "\(Int(Double(progress.done) / Double(progress.total) * 100))%" : "\(progress.total)").font(.caption.weight(.black)).fixedSize()
            }.padding(12).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
        }.buttonStyle(.plain).foregroundStyle(Color(hex: "#2d2754")).frame(maxWidth: .infinity)
    }

    private func field(_ label: String, placeholder: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 7) { fieldLabel(label, icon: "text.alignleft"); TextField(placeholder, text: text).platformNoAutocapitalization().paymentInputStyle() }
    }

    private func fieldLabel(_ title: String, icon: String) -> some View {
        Label(title, systemImage: icon).font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
    }

    private func clientOptionLabel(_ client: WorkClient) -> String {
        let parent = clients.first(where: { $0.id == client.parentClientID })
        let path = parent.map { "\($0.name) › \(client.name)" } ?? client.name
        guard let company = client.company, !company.isEmpty, company.localizedCaseInsensitiveCompare(client.name) != .orderedSame else { return path }
        return "\(path) · \(company)"
    }

    private func pickerField(_ title: String, selection: Binding<String>, values: [(String, String)]) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            fieldLabel(title, icon: "line.3.horizontal.decrease")
            Picker(title, selection: selection) { ForEach(values, id: \.0) { Text($0.1).tag($0.0) } }
                .pickerStyle(.menu).frame(maxWidth: .infinity, alignment: .leading)
                .padding(11).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func load() {
        guard let item else { clientID = defaultClientID; return }
        title = item.title
        description = item.description
        clientID = item.clientID
        status = item.status
        priority = item.priority
        nextAction = item.nextAction
        notes = item.notes
        checklist = item.checklist
        materials = item.materials
        if let value = item.dueDate, let date = WorkDateFormatters.date.date(from: value) { dueDate = date; hasDueDate = true }
        if let value = item.scheduledAt, let date = ISO8601DateFormatter().date(from: value) { scheduledAt = date; hasAppointment = true }
    }

    private func submit() async {
        isSaving = true
        defer { isSaving = false }
        let payload = WorkItemPayload(
            clientID: clientID,
            kind: item?.kind ?? mode,
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            description: description,
            status: status,
            priority: priority,
            scheduledAt: hasAppointment ? ISO8601DateFormatter().string(from: scheduledAt) : nil,
            dueDate: hasDueDate ? WorkDateFormatters.date.string(from: dueDate) : nil,
            nextAction: nextAction.trimmingCharacters(in: .whitespacesAndNewlines),
            notes: notes,
            checklist: checklist,
            materials: synchronizeMaterialUsage(materials, checklist: checklist, previousChecklist: item?.checklist),
            userID: nil
        )
        do { try await onSave(payload, item); onClose() }
        catch { errorMessage = "Impossibile salvare. Verifica la tabella work_items su Supabase." }
    }
}

private enum WorkDateFormatters {
    static let date: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .iso8601)
        return formatter
    }()
}

private enum WorkItemSaveError: Error { case missingUser }

private struct WorkItemPDFShare: Identifiable {
    let id = UUID()
    let url: URL
}

private struct WorkItemShareSheet: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [url], applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}

private enum WorkItemPDF {
    static func create(for item: WorkItem, clientName: String, interventions: [WorkIntervention] = []) throws -> URL {
        let page = CGRect(x: 0, y: 0, width: 595, height: 842)
        let margin: CGFloat = 48
        let purple = UIColor(red: 45/255, green: 39/255, blue: 84/255, alpha: 1)
        let green = UIColor(red: 37/255, green: 114/255, blue: 89/255, alpha: 1)
        let muted = UIColor(red: 113/255, green: 106/255, blue: 145/255, alpha: 1)
        let paper = UIColor(red: 248/255, green: 246/255, blue: 241/255, alpha: 1)
        let renderer = UIGraphicsPDFRenderer(bounds: page)
        let data = renderer.pdfData { context in
            var position: CGFloat = 110
            var pageNumber = 0

            func newPage() {
                context.beginPage()
                pageNumber += 1
                position = 110
                purple.setFill()
                context.fill(CGRect(x: 0, y: 0, width: page.width, height: 75))
                UIImage(named: "PDFLogo")?.draw(in: CGRect(x: margin, y: 18, width: 38, height: 38))
                ("AK Suite" as NSString).draw(at: CGPoint(x: margin + 48, y: 24), withAttributes: [
                    .font: UIFont.boldSystemFont(ofSize: 22), .foregroundColor: UIColor.white
                ])
                ("RIEPILOGO LAVORAZIONE" as NSString).draw(at: CGPoint(x: 395, y: 32), withAttributes: [
                    .font: UIFont.boldSystemFont(ofSize: 9), .foregroundColor: UIColor.white
                ])
                ("AK Suite  •  \(Date.now.formatted(date: .abbreviated, time: .omitted))  |  \(pageNumber)" as NSString)
                    .draw(at: CGPoint(x: margin, y: 809), withAttributes: [
                        .font: UIFont.systemFont(ofSize: 9), .foregroundColor: muted
                    ])
            }

            func line(_ value: String, indent: CGFloat = 0, bold: Bool = false, size: CGFloat = 11, color: UIColor = .darkGray) {
                let font = bold ? UIFont.boldSystemFont(ofSize: size) : UIFont.systemFont(ofSize: size)
                let attributes: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: color]
                let available = page.width - margin * 2 - indent
                let lineHeight = size * 1.4
                for paragraph in value.components(separatedBy: "\n") {
                    var current = ""
                    for word in paragraph.split(separator: " ", omittingEmptySubsequences: true) {
                        let proposed = current.isEmpty ? String(word) : "\(current) \(word)"
                        if !current.isEmpty && (proposed as NSString).size(withAttributes: attributes).width > available {
                            if position + lineHeight > 785 { newPage() }
                            (current as NSString).draw(at: CGPoint(x: margin + indent, y: position), withAttributes: attributes)
                            position += lineHeight
                            current = String(word)
                        } else { current = proposed }
                    }
                    if position + lineHeight > 785 { newPage() }
                    (current as NSString).draw(at: CGPoint(x: margin + indent, y: position), withAttributes: attributes)
                    position += lineHeight + 3
                }
            }

            func section(_ title: String) {
                if position + 44 > 785 { newPage() }
                position += 16
                UIColor(red: 220/255, green: 227/255, blue: 220/255, alpha: 1).setStroke()
                let path = UIBezierPath()
                path.move(to: CGPoint(x: margin, y: position - 9))
                path.addLine(to: CGPoint(x: page.width - margin, y: position - 9))
                path.stroke()
                line(title.uppercased(), bold: true, size: 13, color: green)
            }

            func field(_ label: String, value: String, x: CGFloat, width: CGFloat, y: CGFloat) -> CGFloat {
                (label.uppercased() as NSString).draw(at: CGPoint(x: x, y: y), withAttributes: [
                    .font: UIFont.boldSystemFont(ofSize: 9), .foregroundColor: muted
                ])
                let attributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.boldSystemFont(ofSize: 11), .foregroundColor: purple
                ]
                let bounds = (value as NSString).boundingRect(with: CGSize(width: width, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attributes, context: nil)
                (value as NSString).draw(in: CGRect(x: x, y: y + 18, width: width, height: ceil(bounds.height) + 2), withAttributes: attributes)
                return ceil(bounds.height) + 24
            }

            func entryHeight(_ entry: NativeChecklistEntry, depth: Int) -> CGFloat {
                let indentation = CGFloat(min(depth, 3)) * 20
                let font = depth == 0 ? UIFont.boldSystemFont(ofSize: 11) : UIFont.systemFont(ofSize: 11)
                let attributes: [NSAttributedString.Key: Any] = [.font: font]
                let nameWidth = page.width - margin * 2 - indentation - 117
                let nameHeight = ceil((entry.text as NSString).boundingRect(with: CGSize(width: nameWidth, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attributes, context: nil).height)
                return max(28, nameHeight + (item.materials.contains { $0.id == entry.materialId } ? 17 : 0) + 14)
            }

            func groupHeight(_ entry: NativeChecklistEntry, depth: Int = 0) -> CGFloat {
                entryHeight(entry, depth: depth) + (entry.steps ?? []).reduce(0) { $0 + groupHeight($1, depth: depth + 1) }
            }

            func list(_ entries: [NativeChecklistEntry], depth: Int = 0, continuation: String) {
                for entry in entries {
                    let unit = entry.unit == .metri ? "m" : "pz"
                    let material = item.materials.first { $0.id == entry.materialId }?.text
                    let indentation = CGFloat(min(depth, 3)) * 20
                    let nameFont = depth == 0 ? UIFont.boldSystemFont(ofSize: 11) : UIFont.systemFont(ofSize: 11)
                    let attributes: [NSAttributedString.Key: Any] = [.font: nameFont, .foregroundColor: entry.done ? green : purple]
                    let nameWidth = page.width - margin * 2 - indentation - 117
                    let nameHeight = ceil((entry.text as NSString).boundingRect(with: CGSize(width: nameWidth, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attributes, context: nil).height)
                    let rowHeight = entryHeight(entry, depth: depth)
                    let groupSize = groupHeight(entry, depth: depth)
                    if depth == 0 && position + groupSize > 785 && groupSize < 630 {
                        newPage()
                        section("\(continuation) (continua)")
                    }
                    if position + rowHeight > 785 {
                        newPage()
                        section("\(continuation) (continua)")
                    }
                    if depth == 0 {
                        paper.setFill()
                        UIBezierPath(roundedRect: CGRect(x: margin, y: position, width: page.width - margin * 2, height: rowHeight - 4), cornerRadius: 6).fill()
                    }
                    let x = margin + indentation + 11
                    (entry.done ? green : muted).setStroke()
                    UIBezierPath(rect: CGRect(x: x, y: position + 10, width: 12, height: 12)).stroke()
                    if entry.done {
                        ("✓" as NSString).draw(at: CGPoint(x: x + 1, y: position + 7), withAttributes: [.font: UIFont.boldSystemFont(ofSize: 14), .foregroundColor: green])
                    }
                    (entry.text as NSString).draw(in: CGRect(x: x + 22, y: position + 7, width: nameWidth, height: nameHeight + 3), withAttributes: attributes)
                    ("\(quantityLabel(entry.quantity ?? 1)) \(unit)" as NSString).draw(at: CGPoint(x: page.width - margin - 70, y: position + 8), withAttributes: [.font: UIFont.boldSystemFont(ofSize: 10), .foregroundColor: muted])
                    if let material {
                        ("Materiale: \(material)" as NSString).draw(in: CGRect(x: x + 22, y: position + 9 + nameHeight, width: page.width - margin - x - 35, height: 15), withAttributes: [.font: UIFont.systemFont(ofSize: 9), .foregroundColor: muted])
                    }
                    position += rowHeight
                    if let steps = entry.steps {
                        list(steps.filter(\.done) + steps.filter { !$0.done }, depth: depth + 1, continuation: continuation)
                    }
                }
            }

            newPage()
            line("SCHEDA LAVORAZIONE", bold: true, size: 9, color: green)
            line(item.title, bold: true, size: 21, color: purple)
            let due = item.dueDate.map { WorkDateFormatters.date.date(from: $0)?.formatted(.dateTime.day().month().year()) ?? $0 } ?? "Non indicata"
            let appointment = item.scheduledAt.map { ISO8601DateFormatter().date(from: $0)?.formatted(date: .abbreviated, time: .shortened) ?? $0 } ?? "Non indicato"
            let clientAttributes: [NSAttributedString.Key: Any] = [.font: UIFont.boldSystemFont(ofSize: 11), .foregroundColor: purple]
            let clientHeight = ceil((clientName as NSString).boundingRect(with: CGSize(width: page.width - margin * 2 - 22, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: clientAttributes, context: nil).height)
            let panelHeight = max(138, clientHeight + 126)
            if position + panelHeight > 785 { newPage() }
            paper.setFill()
            UIBezierPath(roundedRect: CGRect(x: margin, y: position, width: page.width - margin * 2, height: panelHeight), cornerRadius: 7).fill()
            let panelTop = position + 12
            _ = field("Cliente", value: clientName, x: margin + 12, width: page.width - margin * 2 - 24, y: panelTop)
            let secondRow = panelTop + clientHeight + 30
            let columnWidth = (page.width - margin * 2 - 36) / 2
            _ = field("Stato", value: WorkStatus.label(item.status), x: margin + 12, width: columnWidth, y: secondRow)
            _ = field("Priorità", value: item.priority == "high" ? "Alta" : item.priority == "low" ? "Bassa" : "Normale", x: margin + 24 + columnWidth, width: columnWidth, y: secondRow)
            _ = field("Scadenza", value: due, x: margin + 12, width: columnWidth, y: secondRow + 42)
            _ = field("Appuntamento", value: appointment, x: margin + 24 + columnWidth, width: columnWidth, y: secondRow + 42)
            position += panelHeight + 5
            if !item.description.isEmpty { section("Descrizione"); line(item.description) }
            if !item.nextAction.isEmpty { section("Prossima azione"); line(item.nextAction) }
            if !item.notes.isEmpty { section("Note"); line(item.notes) }
            let progress = listProgress(item.checklist)
            newPage()
            section("Checklist  ·  \(progress.done)/\(progress.total) fatte")
            if item.checklist.isEmpty { line("Nessuna voce") }
            else {
                let completed = item.checklist.filter(\.done)
                let pending = item.checklist.filter { !$0.done }
                if !completed.isEmpty {
                    section("Completate")
                    list(completed, continuation: "Completate")
                }
                if !pending.isEmpty {
                    if !completed.isEmpty { newPage() }
                    section("Da fare")
                    list(pending, continuation: "Da fare")
                }
            }
            if !interventions.isEmpty {
                newPage()
                section("Diagramma interventi · \(interventions.count)")
                for intervention in interventions.sorted(by: { $0.startDate < $1.startDate }) {
                    let formatter = ISO8601DateFormatter()
                    let start = formatter.date(from: intervention.startDate) ?? {
                        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                        return formatter.date(from: intervention.startDate)
                    }()
                    let dateLabel = start.map { intervention.allDay ? $0.formatted(date: .abbreviated, time: .omitted) : $0.formatted(date: .abbreviated, time: .shortened) } ?? intervention.startDate
                    let titleHeight = ceil((intervention.title as NSString).boundingRect(with: CGSize(width: page.width - margin * 2 - 32, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: [.font: UIFont.boldSystemFont(ofSize: 11)], context: nil).height)
                    let locationWidth = page.width - margin * 2 - 24
                    let locationAttributes: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 9), .foregroundColor: muted]
                    let locationHeight = intervention.location.map { ceil(($0 as NSString).boundingRect(with: CGSize(width: locationWidth, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: locationAttributes, context: nil).height) } ?? 0
                    let rowHeight = max(53, titleHeight + (locationHeight > 0 ? locationHeight + 3 : 0) + 35)
                    if position + rowHeight > 785 { newPage(); section("Interventi (continua)") }
                    paper.setFill()
                    UIBezierPath(roundedRect: CGRect(x: margin, y: position, width: page.width - margin * 2, height: rowHeight - 4), cornerRadius: 6).fill()
                    (dateLabel as NSString).draw(at: CGPoint(x: margin + 12, y: position + 7), withAttributes: [.font: UIFont.boldSystemFont(ofSize: 10), .foregroundColor: green])
                    (intervention.title as NSString).draw(in: CGRect(x: margin + 12, y: position + 23, width: page.width - margin * 2 - 24, height: titleHeight + 3), withAttributes: [.font: UIFont.boldSystemFont(ofSize: 11), .foregroundColor: purple])
                    if let location = intervention.location, !location.isEmpty {
                        (location as NSString).draw(in: CGRect(x: margin + 12, y: position + titleHeight + 25, width: locationWidth, height: locationHeight + 2), withAttributes: locationAttributes)
                    }
                    position += rowHeight
                }
            }
            newPage()
            section("Materiali")
            if item.materials.isEmpty { line("Nessun materiale") }
            let sortedMaterials = item.materials.filter(\.done) + item.materials.filter { !$0.done }
            var previousState: Bool?
            for material in sortedMaterials {
                let installed = installedQuantity(item.checklist, materialID: material.id, unit: material.unit ?? .pezzi)
                let unit = material.unit == .metri ? "m" : "pz"
                let materialAttributes: [NSAttributedString.Key: Any] = [.font: UIFont.boldSystemFont(ofSize: 11), .foregroundColor: purple]
                let nameWidth = page.width - margin * 2 - 140
                let nameHeight = ceil((material.text as NSString).boundingRect(with: CGSize(width: nameWidth, height: .greatestFiniteMagnitude), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: materialAttributes, context: nil).height)
                let rowHeight = max(34, nameHeight + 16)
                if previousState != material.done {
                    if previousState != nil { newPage() }
                    section(material.done ? "Utilizzati" : "Da utilizzare")
                    previousState = material.done
                }
                if position + rowHeight > 785 {
                    newPage()
                    section(material.done ? "Utilizzati (continua)" : "Da utilizzare (continua)")
                }
                paper.setFill()
                UIBezierPath(roundedRect: CGRect(x: margin, y: position, width: page.width - margin * 2, height: rowHeight - 4), cornerRadius: 6).fill()
                (material.done ? green : muted).setFill()
                UIBezierPath(ovalIn: CGRect(x: margin + 10, y: position + 12, width: 8, height: 8)).fill()
                (material.text as NSString).draw(in: CGRect(x: margin + 27, y: position + 7, width: nameWidth, height: nameHeight + 2), withAttributes: materialAttributes)
                ("\(quantityLabel(installed))/\(quantityLabel(material.quantity ?? 1)) \(unit)" as NSString).draw(at: CGPoint(x: page.width - margin - 105, y: position + 10), withAttributes: [.font: UIFont.boldSystemFont(ofSize: 10), .foregroundColor: material.done ? green : muted])
                position += rowHeight
            }
        }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("AKSuite-Lavorazione-\(item.id.uuidString).pdf")
        try data.write(to: url, options: .atomic)
        return url
    }
}

private extension View {
    func paymentInputStyle() -> some View {
        self.font(.subheadline).foregroundStyle(Color(hex: "#2d2754")).padding(.horizontal, 13).padding(.vertical, 11)
            .background(Color(hex: "#f8e8cf")).overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#e6d3b6"), lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 12))
    }
}