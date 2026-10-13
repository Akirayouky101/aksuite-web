import SwiftUI
#if os(macOS)
import AppKit
#else
import UIKit
#endif

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
    var checklistSourceID: UUID?
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
    var completedAt: String?
    var archivedAt: String?

    enum CodingKeys: String, CodingKey {
        case id, kind, title, description, status, priority, notes, checklist, materials
        case checklistSourceID = "checklist_source_id"
        case clientID = "client_id"
        case scheduledAt = "scheduled_at"
        case dueDate = "due_date"
        case nextAction = "next_action"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case completedAt = "completed_at"
        case archivedAt = "archived_at"
    }
}

private struct WorkItemPayload: Encodable {
    var clientID: UUID?
    var checklistSourceID: UUID?
    let kind: String
    let title: String
    let description: String
    var status: String?
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
        case checklistSourceID = "checklist_source_id"
        case clientID = "client_id"
        case scheduledAt = "scheduled_at"
        case dueDate = "due_date"
        case nextAction = "next_action"
        case userID = "user_id"
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(clientID, forKey: .clientID)
        try container.encode(checklistSourceID, forKey: .checklistSourceID)
        try container.encode(kind, forKey: .kind)
        try container.encode(title, forKey: .title)
        try container.encode(description, forKey: .description)
        try container.encodeIfPresent(status, forKey: .status)
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
    @Environment(\.akTabletDevice) private var tabletDevice
    let mode: String
    let initialClientID: UUID?
    let onBack: () -> Void
    var initialItemID: UUID? = nil
    var createNewItem = false
    @State private var consumedInitialCreation = false
    @State private var items: [WorkItem] = []
    @State private var checklistSources: [WorkItem] = []
    @State private var clients: [WorkClient] = []
    @State private var interventions: [WorkIntervention] = []
    @State private var query = ""
    @State private var selectedStatus = WorkStatus.all
    @State private var historyState: NativeHistoryState = .pending
    @State private var changedHistoryID: NativeHistoryChange?
    @State private var historicalItem: WorkItem?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showEditor = false
    @State private var editingItem: WorkItem?
    @State private var selectedItemID: UUID?
    @State private var selectedList: WorkListKind?
    @State private var phoneSummaryList: WorkListKind?
    @State private var editAfterSummaryDismissal = false
    @State private var itemToDelete: WorkItem?

    private var selectedItem: WorkItem? { historicalItem?.id == selectedItemID ? historicalItem : items.first { $0.id == selectedItemID } }

    #if os(macOS)
    private var macFocusedItem: WorkItem? { selectedItem }
    #endif

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
        Group {
            #if os(macOS)
            macWorkspace
            #else
            mobileWorkspace
            #endif
        }
        .task {
            await load()
            if createNewItem && !consumedInitialCreation {
                consumedInitialCreation = true
                showEditor = true
            }
        }
        .overlay {
            if showEditor {
                WorkItemEditorView(item: editingItem, clients: clients, checklistSources: checklistSources, mode: mode, defaultClientID: initialClientID, onClose: closeEditor, onSave: save)
                    .platformModalWidth(compact: 380, regular: 980)
                    .shadow(color: Color.black.opacity(0.34), radius: 28, y: 12)
                    .transition(.asymmetric(insertion: .scale(scale: 0.94).combined(with: .opacity), removal: .scale(scale: 0.97).combined(with: .opacity)))
            }
        }
        #if !os(macOS)
        .overlay {
            if tabletDevice, let item = selectedItem {
                WorkItemSummaryView(item: item, interventions: interventions.filter { $0.workItemID == item.id }, clientName: clientName(for: item), onClose: { selectedItemID = nil; historicalItem = nil }, onEdit: { selectedItemID = nil; editingItem = item; showEditor = true }, onOpenList: { selectedList = $0 }, onRestore: { try await restore(item) })
                    .platformModalWidth(compact: 380, regular: 760)
                    .shadow(color: Color.black.opacity(0.3), radius: 28, y: 12)
            }
        }
        .fullScreenCover(isPresented: Binding(
            get: { !tabletDevice && selectedItem != nil },
            set: { if !$0 { selectedItemID = nil; historicalItem = nil } }
        ), onDismiss: {
            if editAfterSummaryDismissal {
                editAfterSummaryDismissal = false
                showEditor = true
            }
        }) {
            if let item = selectedItem {
                WorkItemSummaryView(
                    item: item,
                    interventions: interventions.filter { $0.workItemID == item.id },
                    clientName: clientName(for: item),
                    onClose: { selectedItemID = nil; historicalItem = nil },
                    onEdit: {
                        editingItem = item
                        editAfterSummaryDismissal = true
                        selectedItemID = nil
                        historicalItem = nil
                    },
                    onOpenList: { phoneSummaryList = $0 },
                    onRestore: { try await restore(item) }
                )
                .sheet(item: $phoneSummaryList) { kind in
                    WorkListEditorView(kind: kind, simple: mode == "todo", title: item.title,
                        entries: kind == .checklist ? item.checklist : item.materials,
                        materials: item.materials, checklist: item.checklist, workItemID: item.id) { entries in
                        try await saveList(entries, kind: kind, for: item)
                    }
                }
            }
        }
        #endif
        .sheet(item: $selectedList) { kind in
            if let item = selectedItem {
                WorkListEditorView(kind: kind, simple: mode == "todo", title: item.title, entries: kind == .checklist ? item.checklist : item.materials, materials: item.materials, checklist: item.checklist, workItemID: item.id) { entries in
                    try await saveList(entries, kind: kind, for: item)
                }
            }
        }
        .confirmationDialog("Eliminare questa lavorazione?", isPresented: Binding(get: { itemToDelete != nil }, set: { if !$0 { itemToDelete = nil } }), titleVisibility: .visible) {
            Button("Elimina", role: .destructive) { if let item = itemToDelete { Task { await delete(item) } } }
        } message: { Text(itemToDelete?.title ?? "") }
    }

    private var mobileWorkspace: some View {
        NavigationStack {
            ZStack {
                AKOrbitBackground()
                if isLoading {
                    ProgressView("Caricamento lavorazioni...").tint(AKOrbitTheme.cyan)
                } else {
                    content
                }
            }
            .foregroundStyle(AKOrbitTheme.primaryText)
            .tint(AKOrbitTheme.cyan)
            .preferredColorScheme(.dark)
            .platformNavigationBarTitleDisplayMode()
            .toolbar {
                ToolbarItem(placement: .akLeading) { Button(action: onBack) { Image(systemName: "chevron.left") }.accessibilityLabel(initialClientID == nil ? "Dashboard" : "Rubrica") }
                ToolbarItem(placement: .principal) { Text(mode == "todo" ? "COSE DA FARE" : "LAVORAZIONI").font(.headline.weight(.black)).foregroundStyle(AKOrbitTheme.primaryText) }
                ToolbarItem(placement: .akTrailing) { Button { editingItem = nil; showEditor = true } label: { Image(systemName: "plus") }.accessibilityLabel(mode == "todo" ? "Nuova cosa da fare" : "Nuova lavorazione") }
            }
        }
    }

    #if os(macOS)
    private var macWorkspace: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    macHeader
                    HStack(spacing: 14) {
                        macMetric(mode == "todo" ? "Da fare" : "In vista", count: filteredItems.count, icon: mode == "todo" ? "checklist" : "briefcase", tint: AKOrbitTheme.cyan)
                        macMetric("In corso", count: count("in_progress"), icon: "arrow.trianglehead.2.clockwise.rotate.90", tint: Color(hex: "#f0c778"))
                        macMetric("Completate", count: count("completed"), icon: "checkmark.circle", tint: Color(hex: "#70c3a3"))
                    }
                    if let errorMessage {
                        AKGlassPanel(cornerRadius: 16, padding: 14) {
                            HStack {
                                Label(errorMessage, systemImage: "exclamationmark.triangle").foregroundStyle(Color(hex: "#ffb5a7"))
                                Spacer()
                                Button("Riprova") { Task { await load() } }.disabled(isLoading)
                            }
                        }
                    }
                    if geometry.size.width >= 1050 {
                        HStack(alignment: .top, spacing: 18) {
                            macRegister(height: max(340, geometry.size.height - 400))
                            ScrollView { macInspector.padding(5) }
                                .frame(width: min(max(geometry.size.width * 0.36, 390), 540), height: max(420, geometry.size.height - 220))
                        }
                    } else {
                        macRegister(height: 420)
                        macInspector
                    }
                }
                .padding(24)
                .frame(maxWidth: 1560)
                .frame(maxWidth: .infinity)
            }
            .refreshable { await load() }
        }
        .background(AKOrbitBackground())
        .foregroundStyle(AKOrbitTheme.primaryText)
        .tint(AKOrbitTheme.cyan)
        .environment(\.colorScheme, .dark)
    }

    private var macHeader: some View {
        HStack(spacing: 18) {
            Button(action: onBack) {
                Image(systemName: "chevron.left")
                    .platformAdaptiveFont(size: 14, weight: .semibold)
                    .frame(width: 38, height: 38)
                    .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 11))
            }
            .platformPlainButtonStyle()
            .accessibilityLabel("Torna alla sezione precedente")
            VStack(alignment: .leading, spacing: 6) {
                Text("DAL PRIMO CONTATTO ALLA CONSEGNA")
                    .platformAdaptiveFont(size: mode == "todo" ? 12 : 11, weight: .bold).tracking(2)
                    .foregroundStyle(Color(hex: "#70c3a3"))
                Text(initialClientID.flatMap { id in clients.first(where: { $0.id == id })?.name }.map { "\(mode == "todo" ? "Cose da fare" : "Lavorazioni") · \($0)" } ?? (mode == "todo" ? "Le tue cose da fare" : "Le tue lavorazioni"))
                    .platformAdaptiveFont(size: mode == "todo" ? 30 : 28, weight: .bold).foregroundStyle(AKOrbitTheme.primaryText)
                Text(mode == "todo" ? "Dai priorità ai prossimi passi e tieni sotto controllo le attività." : "Interventi, materiali e prossime azioni in un unico spazio.")
                    .platformAdaptiveFont(size: mode == "todo" ? 15 : 14).foregroundStyle(AKOrbitTheme.secondaryText)
            }
            Spacer(minLength: 12)
            Button { editingItem = nil; showEditor = true } label: {
                Label(mode == "todo" ? "Nuova attività" : "Nuova lavorazione", systemImage: "plus")
                    .platformAdaptiveFont(size: 14, weight: .semibold)
                    .padding(.horizontal, 16).frame(height: 44)
                    .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 13), highlighted: true) }
            }
            .platformPlainButtonStyle()
        }
    }

    private func macMetric(_ title: String, count: Int, icon: String, tint: Color) -> some View {
        AKGlassPanel(cornerRadius: 17, padding: 15) {
            HStack(spacing: 12) {
                Image(systemName: icon).platformAdaptiveFont(size: 18, weight: .semibold)
                    .foregroundStyle(tint).frame(width: 38, height: 38)
                    .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 11))
                VStack(alignment: .leading, spacing: 3) {
                    Text("\(count)").platformAdaptiveFont(size: 23, weight: .bold).monospacedDigit()
                    Text(title).platformAdaptiveFont(size: mode == "todo" ? 14 : 12, weight: .medium).foregroundStyle(AKOrbitTheme.secondaryText)
                }
                Spacer(minLength: 0)
            }
        }
    }

    private func macRegister(height: CGFloat) -> some View {
        AKGlassPanel(cornerRadius: 21, padding: 18) {
            VStack(alignment: .leading, spacing: 15) {
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").foregroundStyle(AKOrbitTheme.cyan)
                    TextField(mode == "todo" ? "Cerca attività o cliente" : "Cerca lavorazione o cliente", text: $query)
                        .textFieldStyle(.plain).platformAdaptiveFont(size: mode == "todo" ? 16 : 14)
                    if !query.isEmpty {
                        Button { query = "" } label: { Image(systemName: "xmark.circle.fill") }
                            .platformPlainButtonStyle().accessibilityLabel("Cancella ricerca")
                    }
                }
                .padding(12)
                .background(.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 12))

                if mode == "todo" {
                    Picker("Stato", selection: $historyState) {
                        ForEach(NativeHistoryState.allCases) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.segmented)
                } else {
                    HStack(spacing: 7) {
                        ForEach(WorkStatus.values, id: \.self) { status in
                            macStatusFilter(status)
                        }
                    }
                }

                HStack {
                    Text("\(filteredItems.count) \(mode == "todo" ? "attività" : "lavorazioni")")
                        .platformAdaptiveFont(size: mode == "todo" ? 14 : 12, weight: .medium)
                    Spacer()
                    Text("Scadenza più vicina").platformAdaptiveFont(size: mode == "todo" ? 13 : 11)
                }
                .foregroundStyle(AKOrbitTheme.secondaryText)

                if mode == "todo" && historyState != .pending {
                    NativeHistoryView(kind: "todo", state: historyState, clientID: initialClientID, changedItem: changedHistoryID, usesGlassPanels: true) { id in
                        Task {
                            do {
                                historicalItem = try await SupabaseService.shared.from("work_items").select().eq("id", value: id.uuidString).single().execute().value
                                selectedItemID = id
                            } catch { errorMessage = NativeErrorMessages.message(for: error, action: "aprire la lavorazione archiviata") }
                        }
                    }
                    .frame(height: height - 130)
                } else if isLoading {
                    ProgressView("Caricamento...").frame(maxWidth: .infinity, minHeight: 180)
                } else if filteredItems.isEmpty {
                    emptyState.frame(maxWidth: .infinity, minHeight: 200)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 10) {
                            ForEach(filteredItems) { item in
                                WorkItemCard(
                                    item: item,
                                    mode: mode,
                                    clientName: clientName(for: item),
                                    selected: selectedItemID == item.id,
                                    onOpen: { selectedItemID = item.id },
                                    onEdit: { editingItem = item; showEditor = true },
                                    onStatusChange: { status in Task { await updateStatus(item, to: status) } },
                                    onDelete: { itemToDelete = item }
                                )
                            }
                        }
                        .padding(4)
                    }
                    .frame(height: height - 130)
                }
            }
        }
    }

    private func macStatusFilter(_ status: String) -> some View {
        let selected = selectedStatus == status
        return Button { selectedStatus = status } label: {
            Text(status == WorkStatus.all ? "Tutte" : WorkStatus.label(status))
                .platformAdaptiveFont(size: mode == "todo" ? 14 : 12, weight: .semibold)
                .padding(.horizontal, 11).padding(.vertical, 9)
                .background(selected ? AKOrbitTheme.orbitBlue.opacity(0.48) : .white.opacity(0.035), in: Capsule())
                .overlay { Capsule().stroke(AKOrbitTheme.cyan.opacity(selected ? 0.55 : 0.08), lineWidth: 1) }
        }
        .platformPlainButtonStyle()
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    @ViewBuilder private var macInspector: some View {
        if let item = macFocusedItem, !(mode == "todo" && historyState != .pending) {
            MacWorkItemInspector(
                item: item,
                interventions: interventions.filter { $0.workItemID == item.id },
                clientName: clientName(for: item),
                mode: mode,
                onEdit: { editingItem = item; showEditor = true },
                onStatusChange: { status in Task { await updateStatus(item, to: status) } },
                onDelete: { itemToDelete = item },
                onOpenList: { selectedList = $0 },
                onToggleChecklist: { entryID in Task { await toggleChecklistEntry(item, id: entryID) } },
                onRestore: { try await restore(item) }
            )
                .id(item.id)
        } else {
            AKGlassPanel {
                VStack(alignment: .leading, spacing: 12) {
                    Image(systemName: mode == "todo" ? "checklist" : "briefcase").platformAdaptiveFont(size: 28).foregroundStyle(AKOrbitTheme.cyan)
                    Text(mode == "todo" ? "Il prossimo passo" : "Panoramica lavoro").platformAdaptiveFont(size: 18, weight: .bold)
                    Text("Seleziona una voce per consultare dettagli, checklist e materiali.")
                        .platformAdaptiveFont(size: 14).foregroundStyle(AKOrbitTheme.secondaryText)
                }.frame(maxWidth: .infinity, minHeight: 220, alignment: .topLeading)
            }
        }
    }
    #endif

    private var content: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 15) {
                header
                if mode == "todo" {
                    Picker("Stato", selection: $historyState) {
                        ForEach(NativeHistoryState.allCases) { Text($0.title).tag($0) }
                    }.pickerStyle(.segmented)
                }
                if mode == "todo" && historyState != .pending {
                    NativeHistoryView(kind: "todo", state: historyState, clientID: initialClientID, changedItem: changedHistoryID) { id in
                        Task {
                            do {
                                historicalItem = try await SupabaseService.shared.from("work_items").select().eq("id", value: id.uuidString).single().execute().value
                                selectedItemID = id
                            } catch { errorMessage = NativeErrorMessages.message(for: error, action: "aprire l'attività archiviata") }
                        }
                    }.id(historyState)
                } else {
                    HStack(spacing: 9) {
                        Image(systemName: "magnifyingglass").foregroundStyle(AKOrbitTheme.cyan)
                        TextField("Cerca lavoro o cliente...", text: $query)
                            .platformNoAutocapitalization()
                            .foregroundStyle(AKOrbitTheme.primaryText)
                    }
                    .padding(13)
                    .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 14)) }
                    if mode != "todo" {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 7) {
                                statusFilter("all", title: "Tutte", count: scopedItems.count)
                                statusFilter("planned", title: "Da pianificare", count: count("planned"))
                                statusFilter("in_progress", title: "In corso", count: count("in_progress"))
                                statusFilter("waiting", title: "In attesa", count: count("waiting"))
                                statusFilter("completed", title: "Completate", count: count("completed"))
                            }
                        }
                    }
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
                if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#ffb5a7")) }
            }
            .padding(16)
        }
        .refreshable { await load() }
    }

    private var header: some View {
        AKGlassPanel(cornerRadius: 20, padding: 20) {
            VStack(alignment: .leading, spacing: 8) {
                Text("DAL PRIMO CONTATTO ALLA CONSEGNA").font(.caption.weight(.black)).foregroundStyle(Color(hex: "#70c3a3"))
                Text(clients.first(where: { $0.id == initialClientID }).map { "\(mode == "todo" ? "Cose da fare" : "Lavorazioni") · \($0.name)" } ?? (mode == "todo" ? "Le tue cose da fare" : "Le tue lavorazioni"))
                    .font(.title2.weight(.black)).foregroundStyle(AKOrbitTheme.primaryText)
                Text("\(filteredItems.count) in vista · \(count("in_progress")) in corso")
                    .font(.subheadline).foregroundStyle(AKOrbitTheme.secondaryText)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var emptyState: some View {
        AKGlassPanel(cornerRadius: 18, padding: 30) {
            VStack(spacing: 10) {
                Image(systemName: "briefcase").platformScaledFont(size: 32).foregroundStyle(AKOrbitTheme.cyan)
                Text(query.isEmpty ? (mode == "todo" ? "Nessuna cosa da fare" : "Nessuna lavorazione") : "Nessun risultato").font(.headline.weight(.black)).foregroundStyle(AKOrbitTheme.primaryText)
                Text(query.isEmpty ? "Registra un lavoro e tieni a portata di mano il prossimo passo." : "Prova a modificare la ricerca o il filtro.").font(.subheadline).foregroundStyle(AKOrbitTheme.secondaryText)
                if scopedItems.isEmpty { Button(mode == "todo" ? "Nuova cosa da fare" : "Nuova lavorazione") { editingItem = nil; showEditor = true }.font(.subheadline.weight(.bold)).foregroundStyle(AKOrbitTheme.cyan) }
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func statusFilter(_ value: String, title: String, count: Int) -> some View {
        Button { selectedStatus = value } label: {
            HStack(spacing: 5) {
                Text(title)
                Text("\(count)").opacity(0.7)
            }
            .font(.caption.weight(.bold))
            .foregroundStyle(selectedStatus == value ? AKOrbitTheme.primaryText : AKOrbitTheme.secondaryText)
            .padding(.horizontal, 12).padding(.vertical, 10)
            .background {
                Capsule().fill(selectedStatus == value ? AKOrbitTheme.orbitBlue.opacity(0.52) : AKOrbitTheme.glassBlue.opacity(0.74))
            }
            .overlay { Capsule().stroke(AKOrbitTheme.cyan.opacity(selectedStatus == value ? 0.55 : 0.18), lineWidth: 1) }
            .clipShape(Capsule())
        }
        .platformPlainButtonStyle()
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
            let itemQuery = mode == "todo"
                ? SupabaseService.shared.from("work_items").select().eq("kind", value: mode).neq("status", value: "completed").is("archived_at", value: nil)
                : SupabaseService.shared.from("work_items").select().eq("kind", value: mode)
            async let loadedItems: [WorkItem] = itemQuery.order("updated_at", ascending: false).execute().value
            async let loadedClients: [WorkClient] = SupabaseService.shared.from("clients").select("id,name,company,parent_client_id").order("name", ascending: true).execute().value
            items = try await loadedItems
            #if os(macOS)
            if mode == "work" {
                checklistSources = try await SupabaseService.shared.from("work_items")
                    .select()
                    .eq("kind", value: "todo")
                    .neq("status", value: "completed")
                    .is("archived_at", value: nil)
                    .order("updated_at", ascending: false)
                    .execute().value
            } else {
                checklistSources = []
            }
            #endif
            if let initialItemID {
                historicalItem = try await SupabaseService.shared.from("work_items").select().eq("id", value: initialItemID.uuidString).single().execute().value
                selectedItemID = initialItemID
            }
            clients = (try? await loadedClients) ?? []
            interventions = (try? await SupabaseService.shared.from("events").select("id,work_item_id,title,start_date,end_date,all_day,location").not("work_item_id", operator: .is, value: "null").eq("is_completed", value: false).is("archived_at", value: nil).execute().value) ?? []
            errorMessage = nil
        } catch {
            errorMessage = NativeErrorMessages.message(for: error, action: "caricare le lavorazioni")
        }
    }

    private func save(_ payload: WorkItemPayload, _ existing: WorkItem?) async throws {
        if let existing {
            let sharedChecklistChanged = payload.checklist != existing.checklist
                && payload.checklistSourceID == existing.checklistSourceID
            let checklistOwnerID = sharedChecklistChanged
                ? existing.checklistSourceID ?? (existing.kind == "todo" ? existing.id : nil)
                : nil
            let linkedItems: [WorkItem]
            if let checklistOwnerID {
                linkedItems = try await linkedWorkItems(checklistOwnerID)
            } else {
                linkedItems = []
            }
            if let sourceID = existing.checklistSourceID, checklistOwnerID == sourceID {
                retainChecklistSource(try await updateChecklistSource(sourceID, checklist: payload.checklist))
            }
            var update = payload
            if update.status == existing.status { update.status = nil }
            let updated: WorkItem = try await SupabaseService.shared.from("work_items").update(update).eq("id", value: existing.id.uuidString).select().single().execute().value
            retain(updated)
            try await synchronizeLinkedMaterials(linkedItems, checklist: payload.checklist)
        } else {
            guard let userID = auth.session?.user.id else { throw WorkItemSaveError.missingUser }
            if let sourceID = payload.checklistSourceID,
               let source = checklistSources.first(where: { $0.id == sourceID }),
               source.checklist != payload.checklist {
                retainChecklistSource(try await updateChecklistSource(sourceID, checklist: payload.checklist))
            }
            var insert = payload
            insert.userID = userID
            let created: WorkItem = try await SupabaseService.shared.from("work_items").insert(insert).select().single().execute().value
            retain(created)
        }
    }

    private func updateStatus(_ item: WorkItem, to status: String) async {
        do {
            let updated: WorkItem = try await SupabaseService.shared.from("work_items").update(["status": status, "updated_at": ISO8601DateFormatter().string(from: .now)]).eq("id", value: item.id.uuidString).select().single().execute().value
            retain(updated)
            #if os(macOS)
            selectedItemID = updated.id
            historicalItem = nil
            #else
            selectedItemID = nil; historicalItem = nil
            #endif
        } catch {
            errorMessage = NativeErrorMessages.message(for: error, action: "aggiornare lo stato")
        }
    }

    private func toggleChecklistEntry(_ item: WorkItem, id: String) async {
        var entries = item.checklist
        func toggle(_ entries: inout [NativeChecklistEntry]) -> Bool {
            for index in entries.indices {
                if entries[index].id == id {
                    entries[index].done.toggle()
                    if let steps = entries[index].steps {
                        let done = entries[index].done
                        entries[index].steps = steps.map { step in var value = step; value.done = done; return value }
                    }
                    return true
                }
                if var steps = entries[index].steps, toggle(&steps) {
                    entries[index].steps = steps
                    entries[index].done = !steps.isEmpty && steps.allSatisfy(\.done)
                    return true
                }
            }
            return false
        }
        guard toggle(&entries) else { return }
        do { try await saveList(entries, kind: .checklist, for: item) }
        catch { errorMessage = NativeErrorMessages.message(for: error, action: "aggiornare la checklist") }
    }

    private func restore(_ item: WorkItem) async throws {
        let updated: WorkItem = try await SupabaseService.shared.from("work_items")
            .update(["status": "planned"])
            .eq("id", value: item.id.uuidString)
            .select()
            .single()
            .execute().value
        retain(updated)
        selectedItemID = nil
        historicalItem = nil
    }

    private func saveList(_ entries: [NativeChecklistEntry], kind: WorkListKind, for item: WorkItem) async throws {
        let checklist = kind == .checklist ? entries : item.checklist
        let materials = synchronizeMaterialUsage(kind == .materials ? entries : item.materials, checklist: checklist, previousChecklist: item.checklist)
        if kind == .checklist, let checklistOwnerID = item.checklistSourceID ?? (item.kind == "todo" ? item.id : nil) {
            let linkedItems = try await linkedWorkItems(checklistOwnerID)
            if let sourceID = item.checklistSourceID {
                retainChecklistSource(try await updateChecklistSource(sourceID, checklist: checklist))
            } else {
                let updated: WorkItem = try await SupabaseService.shared.from("work_items")
                    .update(WorkListUpdate(checklist: checklist, materials: materials))
                    .eq("id", value: item.id.uuidString).select().single().execute().value
                retain(updated)
                if historicalItem?.id == updated.id { historicalItem = updated }
            }
            try await synchronizeLinkedMaterials(linkedItems, checklist: checklist)
            return
        }
        let updated: WorkItem = try await SupabaseService.shared.from("work_items")
            .update(WorkListUpdate(checklist: checklist, materials: materials))
            .eq("id", value: item.id.uuidString).select().single().execute().value
        retain(updated)
        if historicalItem?.id == updated.id { historicalItem = updated }
    }

    private func linkedWorkItems(_ sourceID: UUID) async throws -> [WorkItem] {
        try await SupabaseService.shared.from("work_items")
            .select()
            .eq("checklist_source_id", value: sourceID.uuidString)
            .execute().value
    }

    private func updateChecklistSource(_ sourceID: UUID, checklist: [NativeChecklistEntry]) async throws -> WorkItem {
        try await SupabaseService.shared.from("work_items")
            .update(WorkListUpdate(checklist: checklist, materials: nil))
            .eq("id", value: sourceID.uuidString)
            .select()
            .single()
            .execute().value
    }

    private func synchronizeLinkedMaterials(_ linkedItems: [WorkItem], checklist: [NativeChecklistEntry]) async throws {
        for linkedItem in linkedItems {
            let materials = synchronizeMaterialUsage(linkedItem.materials, checklist: checklist, previousChecklist: linkedItem.checklist)
            let updated: WorkItem = try await SupabaseService.shared.from("work_items")
                .update(WorkListUpdate(checklist: nil, materials: materials))
                .eq("id", value: linkedItem.id.uuidString)
                .select()
                .single()
                .execute().value
            if items.contains(where: { $0.id == updated.id }) { retain(updated) }
            if historicalItem?.id == updated.id { historicalItem = updated }
        }
    }

    private func retainChecklistSource(_ source: WorkItem) {
        guard let index = checklistSources.firstIndex(where: { $0.id == source.id }) else { return }
        checklistSources[index] = source
    }

    private func delete(_ item: WorkItem) async {
        do {
            try await SupabaseService.shared.from("work_items").delete().eq("id", value: item.id.uuidString).execute()
            items.removeAll { $0.id == item.id }
            changedHistoryID = NativeHistoryChange(id: item.id)
            itemToDelete = nil
        } catch {
            errorMessage = NativeErrorMessages.message(for: error, action: "eliminare la lavorazione")
        }
    }

    private func closeEditor() { showEditor = false; editingItem = nil }

    private func retain(_ updated: WorkItem) {
        items.removeAll { $0.id == updated.id }
        if mode != "todo" || (updated.status != "completed" && updated.archivedAt == nil) { items.append(updated) }
        changedHistoryID = NativeHistoryChange(id: updated.id)
    }
}

private struct WorkItemCard: View {
    let item: WorkItem
    let mode: String
    let clientName: String
    var selected = false
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
                        Image(systemName: "briefcase.fill").font(.headline).foregroundStyle(Color(hex: "#70c3a3"))
                            .frame(width: 40, height: 40).background(Color(hex: "#70c3a3").opacity(0.14)).clipShape(RoundedRectangle(cornerRadius: 12))
                        VStack(alignment: .leading, spacing: 3) {
                            Text(item.title).platformAdaptiveFont(size: 17, weight: .black).foregroundStyle(AKOrbitTheme.primaryText).lineLimit(2).multilineTextAlignment(.leading)
                            Text(clientName).platformAdaptiveFont(size: 14).foregroundStyle(AKOrbitTheme.secondaryText).lineLimit(1)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(AKOrbitTheme.cyan)
                    }
                    if !item.description.isEmpty { Text(item.description).platformAdaptiveFont(size: 14).foregroundStyle(AKOrbitTheme.secondaryText).lineLimit(2).frame(maxWidth: .infinity, alignment: .leading) }
                    HStack(spacing: 6) {
                        Text(mode == "todo" && item.status == "planned" ? "Da fare" : WorkStatus.label(item.status)).platformAdaptiveFont(size: 13, weight: .bold).foregroundStyle(Color(hex: item.status == "completed" ? "#70c3a3" : item.status == "waiting" ? "#f0c778" : "#83cfff"))
                        Text(priorityLabel).platformAdaptiveFont(size: 13, weight: .bold).foregroundStyle(priorityColor).padding(.horizontal, 7).padding(.vertical, 4).background(priorityColor.opacity(0.12)).clipShape(Capsule())
                        Spacer(minLength: 0)
                        Label(dueLabel, systemImage: "calendar").platformAdaptiveFont(size: 13, weight: .bold).foregroundStyle(AKOrbitTheme.secondaryText)
                    }
                    if !item.nextAction.isEmpty {
                        Label(item.nextAction, systemImage: "arrow.turn.down.right").platformAdaptiveFont(size: 14).foregroundStyle(AKOrbitTheme.secondaryText).lineLimit(2).frame(maxWidth: .infinity, alignment: .leading)
                    }
                    let progress = listProgress(item.checklist)
                    if progress.total > 0 {
                        HStack(spacing: 6) { Image(systemName: "checklist"); Text("Checklist \(progress.done)/\(progress.total)"); Spacer(); Text("\(Int(Double(progress.done) / Double(progress.total) * 100))%") }
                            .platformAdaptiveFont(size: 13, weight: .bold).foregroundStyle(Color(hex: "#70c3a3"))
                        ProgressView(value: Double(progress.done), total: Double(progress.total)).tint(Color(hex: "#70c3a3"))
                    }
                    let coverage = materialCoverage(item.materials, checklist: item.checklist)
                    if mode != "todo" && (coverage.total > 0 || coverage.orphaned > 0) {
                        Label("\(coverage.matched)/\(coverage.total) materiali installati\(coverage.unitMismatches > 0 ? " · unità diversa" : "")\(coverage.orphaned > 0 ? " · da verificare" : "")", systemImage: coverage.complete ? "checkmark.circle.fill" : "exclamationmark.triangle")
                            .platformAdaptiveFont(size: 13, weight: .bold).foregroundStyle(Color(hex: coverage.complete ? "#70c3a3" : "#f0c778"))
                    }
                }
                .contentShape(Rectangle())
            }
            .platformPlainButtonStyle()

            HStack {
                Menu {
                    ForEach(WorkStatus.values, id: \.self) { status in
                        Button(WorkStatus.label(status)) { onStatusChange(status) }
                    }
                } label: {
                    Label("Stato", systemImage: "arrow.trianglehead.2.clockwise.rotate.90")
                        .platformAdaptiveFont(size: 14, weight: .bold).foregroundStyle(AKOrbitTheme.cyan)
                }
                Spacer()
                Button("Modifica", action: onEdit).platformAdaptiveFont(size: 14, weight: .bold).foregroundStyle(AKOrbitTheme.secondaryText)
                Button(role: .destructive, action: onDelete) { Image(systemName: "trash") }.accessibilityLabel("Elimina lavorazione")
            }
        }
        .padding(14).frame(maxWidth: .infinity, alignment: .leading)
        .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 16), highlighted: selected) }
    }

    private var priorityLabel: String {
        switch item.priority { case "high": "Alta"; case "low": "Bassa"; default: "Normale" }
    }

    private var priorityColor: Color {
        switch item.priority { case "high": Color(hex: "#ffb5a7"); case "low": Color(hex: "#70c3a3"); default: AKOrbitTheme.secondaryText }
    }
}

#if os(macOS)
private enum MacWorkItemTab: String, CaseIterable, Identifiable {
    case details, checklist, materials
    var id: String { rawValue }
    var title: String {
        switch self {
        case .details: return "Dettagli"
        case .checklist: return "Checklist"
        case .materials: return "Materiali"
        }
    }
}

private struct MacWorkItemInspector: View {
    let item: WorkItem
    let interventions: [WorkIntervention]
    let clientName: String
    let mode: String
    let onEdit: () -> Void
    let onStatusChange: (String) -> Void
    let onDelete: () -> Void
    let onOpenList: (WorkListKind) -> Void
    let onToggleChecklist: (String) -> Void
    let onRestore: () async throws -> Void
    @State private var tab: MacWorkItemTab = .details
    @State private var showAllChecklist = false
    @State private var restoring = false
    @State private var restoreError: String?

    private var progress: (done: Int, total: Int) { listProgress(item.checklist) }
    private var visibleChecklist: [NativeChecklistEntry] {
        showAllChecklist ? item.checklist : Array(item.checklist.prefix(4))
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            tabPicker
            ScrollView(showsIndicators: false) {
                Group {
                    switch tab {
                    case .details: detailsContent
                    case .checklist: checklistContent
                    case .materials: materialsContent
                    }
                }
                .padding(16)
            }
            Divider().overlay(AKOrbitTheme.cyan.opacity(0.18))
            footer
        }
        .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 22), highlighted: true) }
        .clipShape(RoundedRectangle(cornerRadius: 22))
    }

    private var header: some View {
        HStack(spacing: 12) {
            Image(systemName: mode == "todo" ? "checklist" : "briefcase.fill")
                .platformAdaptiveFont(size: 18, weight: .semibold)
                .foregroundStyle(Color(hex: "#70c3a3"))
                .frame(width: 42, height: 42)
                .background(Color(hex: "#70c3a3").opacity(0.14), in: RoundedRectangle(cornerRadius: 12))
            VStack(alignment: .leading, spacing: 4) {
                Text(item.title).platformAdaptiveFont(size: 20, weight: .bold).foregroundStyle(AKOrbitTheme.primaryText)
                Text(clientName).platformAdaptiveFont(size: 14).foregroundStyle(AKOrbitTheme.secondaryText)
            }
            Spacer(minLength: 4)
            Menu {
                Button("Modifica", action: onEdit)
                Button("Elimina", role: .destructive, action: onDelete)
            } label: {
                Image(systemName: "ellipsis").platformAdaptiveFont(size: 16, weight: .semibold)
                    .foregroundStyle(AKOrbitTheme.secondaryText).frame(width: 34, height: 34)
            }
            .menuStyle(.borderlessButton)
            .accessibilityLabel("Azioni per \(item.title)")
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 12)
    }

    private var tabPicker: some View {
        HStack(spacing: 4) {
            ForEach(MacWorkItemTab.allCases) { destination in
                Button { withAnimation(.easeOut(duration: 0.18)) { tab = destination } } label: {
                    Text(destination.title)
                        .platformAdaptiveFont(size: 15, weight: .semibold)
                        .foregroundStyle(tab == destination ? Color(hex: "#061426") : AKOrbitTheme.secondaryText)
                        .frame(maxWidth: .infinity, minHeight: 34)
                        .background(tab == destination ? AKOrbitTheme.cyan : .clear, in: Capsule())
                }
                .platformPlainButtonStyle()
                .accessibilityAddTraits(tab == destination ? .isSelected : [])
            }
        }
        .padding(4)
        .background(AKOrbitTheme.glassBlue.opacity(0.85), in: Capsule())
        .overlay(Capsule().stroke(AKOrbitTheme.cyan.opacity(0.18), lineWidth: 1))
        .padding(.horizontal, 14)
        .padding(.bottom, 4)
    }

    private var detailsContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 7) {
                statusChip
                priorityChip
                Spacer(minLength: 0)
            }
            if !item.description.isEmpty { detailCard("DESCRIZIONE", item.description) }
            if let dueDate = item.dueDate {
                detailCard("SCADENZA", WorkDateFormatters.date.date(from: dueDate)?.formatted(.dateTime.day().month(.wide).year()) ?? dueDate)
            }
            if let scheduledAt = item.scheduledAt {
                detailCard("APPUNTAMENTO", ISO8601DateFormatter().date(from: scheduledAt)?.formatted(date: .abbreviated, time: .shortened) ?? scheduledAt)
            }
            if !item.nextAction.isEmpty { detailCard("PROSSIMA AZIONE", item.nextAction) }
            if !item.notes.isEmpty { detailCard("NOTE", item.notes) }
            NativePhotoGallery(workItemID: item.id)
            if !interventions.isEmpty {
                AKGlassPanel(cornerRadius: 14, padding: 13) {
                    VStack(alignment: .leading, spacing: 9) {
                        Label("Interventi collegati", systemImage: "calendar").platformAdaptiveFont(size: 15, weight: .semibold)
                        ForEach(interventions.sorted { $0.startDate < $1.startDate }) { intervention in
                            HStack(spacing: 9) {
                                Circle().fill(Color(hex: "#70c3a3")).frame(width: 7, height: 7)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(intervention.title).platformAdaptiveFont(size: 14, weight: .medium)
                                    Text(intervention.startDate).platformAdaptiveFont(size: 12).foregroundStyle(AKOrbitTheme.secondaryText)
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private var checklistContent: some View {
        VStack(alignment: .leading, spacing: 11) {
            AKGlassPanel(cornerRadius: 13, padding: 13) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Label("Checklist", systemImage: "checklist").platformAdaptiveFont(size: 15, weight: .semibold)
                        Spacer()
                        Text("\(progress.done) di \(progress.total) completati").platformAdaptiveFont(size: 13).foregroundStyle(AKOrbitTheme.secondaryText)
                    }
                    ProgressView(value: Double(progress.done), total: Double(max(progress.total, 1))).tint(Color(hex: "#70c3a3"))
                    HStack {
                        Text("\(progress.total == 0 ? 0 : Int(Double(progress.done) / Double(progress.total) * 100))%")
                            .platformAdaptiveFont(size: 13, weight: .bold).foregroundStyle(Color(hex: "#70c3a3"))
                        Spacer()
                        Button("Modifica checklist") { onOpenList(.checklist) }.platformAdaptiveFont(size: 13, weight: .semibold)
                    }
                }
            }
            if item.checklist.isEmpty {
                emptyTab("Nessuna voce nella checklist.", icon: "checklist")
            } else {
                ForEach(visibleChecklist) { entry in
                    Button { onToggleChecklist(entry.id) } label: {
                        HStack(spacing: 10) {
                            Image(systemName: entry.done ? "checkmark.circle.fill" : "circle")
                                .platformAdaptiveFont(size: 17).foregroundStyle(entry.done ? Color(hex: "#70c3a3") : AKOrbitTheme.cyan.opacity(0.7))
                            Text(entry.text).platformAdaptiveFont(size: 14, weight: .medium)
                                .foregroundStyle(entry.done ? AKOrbitTheme.secondaryText : AKOrbitTheme.primaryText)
                                .strikethrough(entry.done, color: AKOrbitTheme.secondaryText)
                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, 11).frame(minHeight: 40)
                        .contentShape(Rectangle())
                    }
                    .platformPlainButtonStyle()
                    .overlay(alignment: .bottom) { Rectangle().fill(.white.opacity(0.07)).frame(height: 1) }
                    .accessibilityLabel("\(entry.done ? "Completata" : "Da fare"): \(entry.text)")
                }
                if item.checklist.count > 4 {
                    Button(showAllChecklist ? "Mostra meno" : "Mostra tutte le \(item.checklist.count) voci") {
                        withAnimation(.easeInOut(duration: 0.18)) { showAllChecklist.toggle() }
                    }
                    .platformAdaptiveFont(size: 13, weight: .semibold)
                    .frame(maxWidth: .infinity, minHeight: 34)
                    .background(.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 9))
                }
            }
        }
    }

    private var materialsContent: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Materiali").platformAdaptiveFont(size: 19, weight: .bold)
                Spacer()
                Button("Modifica materiali") { onOpenList(.materials) }.platformAdaptiveFont(size: 13, weight: .semibold)
            }
            if item.materials.isEmpty {
                emptyTab("Nessun materiale registrato.", icon: "shippingbox")
            } else {
                ForEach(item.materials) { material in
                    let unit = material.unit ?? .pezzi
                    let installed = installedQuantity(item.checklist, materialID: material.id, unit: unit)
                    let required = material.quantity ?? 1
                    AKGlassPanel(cornerRadius: 12, padding: 12) {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 9) {
                                Image(systemName: material.done ? "checkmark.circle.fill" : "shippingbox")
                                    .foregroundStyle(material.done ? Color(hex: "#70c3a3") : AKOrbitTheme.cyan)
                                Text(material.text).platformAdaptiveFont(size: 15, weight: .semibold)
                                Spacer(minLength: 4)
                                Text("\(quantityLabel(installed))/\(quantityLabel(required)) \(unit.label.lowercased())")
                                    .platformAdaptiveFont(size: 13, weight: .medium).foregroundStyle(AKOrbitTheme.secondaryText)
                            }
                            ProgressView(value: min(installed, required), total: max(required, 1)).tint(Color(hex: "#70c3a3"))
                        }
                    }
                }
            }
        }
    }

    private var statusChip: some View {
        Text(item.kind == "todo" && item.status == "planned" ? "Da fare" : WorkStatus.label(item.status))
            .platformAdaptiveFont(size: 12, weight: .semibold).foregroundStyle(Color(hex: "#70c3a3"))
            .padding(.horizontal, 9).padding(.vertical, 5).background(Color(hex: "#70c3a3").opacity(0.12), in: Capsule())
    }

    private var priorityChip: some View {
        let title = item.priority == "high" ? "Priorità alta" : item.priority == "low" ? "Priorità bassa" : "Priorità normale"
        let tint = item.priority == "high" ? Color(hex: "#ffb5a7") : item.priority == "low" ? Color(hex: "#70c3a3") : AKOrbitTheme.secondaryText
        return Text(title).platformAdaptiveFont(size: 12, weight: .semibold).foregroundStyle(tint)
            .padding(.horizontal, 9).padding(.vertical, 5).background(tint.opacity(0.12), in: Capsule())
    }

    private func detailCard(_ title: String, _ text: String) -> some View {
        AKGlassPanel(cornerRadius: 12, padding: 12) {
            VStack(alignment: .leading, spacing: 5) {
                Text(title).platformAdaptiveFont(size: 12, weight: .bold).foregroundStyle(AKOrbitTheme.cyan)
                Text(text).platformAdaptiveFont(size: 14).foregroundStyle(AKOrbitTheme.primaryText).textSelection(.enabled)
            }.frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func emptyTab(_ message: String, icon: String) -> some View {
        AKGlassPanel(cornerRadius: 12, padding: 20) {
            Label(message, systemImage: icon).platformAdaptiveFont(size: 14).foregroundStyle(AKOrbitTheme.secondaryText)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var footer: some View {
        HStack(spacing: 8) {
            Menu {
                ForEach(WorkStatus.values, id: \.self) { status in
                    Button(WorkStatus.label(status)) { onStatusChange(status) }
                }
            } label: {
                Label("Stato", systemImage: "arrow.trianglehead.2.clockwise.rotate.90")
                    .platformAdaptiveFont(size: 13, weight: .semibold)
                    .padding(.horizontal, 11).frame(height: 34)
                    .background(AKOrbitTheme.glassBlue, in: RoundedRectangle(cornerRadius: 10))
            }
            .menuStyle(.borderlessButton)
            Spacer(minLength: 0)
            if mode == "todo" && item.status == "completed" {
                Button("Riporta da fare") {
                    Task { restoring = true; defer { restoring = false }; try? await onRestore() }
                }
                .disabled(restoring)
            }
            Button { onEdit() } label: {
                Label(item.kind == "todo" ? "Modifica attività" : "Modifica lavorazione", systemImage: "pencil")
                    .platformAdaptiveFont(size: 13, weight: .semibold).padding(.horizontal, 12).frame(height: 38)
                    .background(AKOrbitTheme.orbitBlue.opacity(0.68), in: RoundedRectangle(cornerRadius: 10))
            }
            .platformPlainButtonStyle()
            Button(role: .destructive, action: onDelete) { Image(systemName: "trash") }
                .buttonStyle(.bordered).help("Elimina")
        }
        .padding(12)
        .overlay(alignment: .top) { Rectangle().fill(AKOrbitTheme.cyan.opacity(0.15)).frame(height: 1) }
    }
}
#endif

private struct WorkItemSummaryView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.akTabletDevice) private var tabletDevice
    @State private var pdfShare: WorkItemPDFShare?
    @State private var exportError: String?
    let item: WorkItem
    let interventions: [WorkIntervention]
    let clientName: String
    let onClose: () -> Void
    let onEdit: () -> Void
    let onOpenList: (WorkListKind) -> Void
    let onRestore: () async throws -> Void
    @State private var restoring = false
    @State private var restoreError: String?

    private var orderedInterventions: [WorkIntervention] { interventions.sorted { $0.startDate < $1.startDate } }

    private func interventionDate(_ value: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: value) ?? {
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            return formatter.date(from: value)
        }()
    }

    var body: some View {
        AKModalScrollContent {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.kind == "todo" ? "COSA DA FARE" : "RIEPILOGO LAVORAZIONE").platformAdaptiveFont(size: 13, weight: .black).foregroundStyle(Color(hex: "#70c3a3"))
                    Text(item.title).platformAdaptiveFont(size: 22, weight: .black).foregroundStyle(AKOrbitTheme.primaryText)
                    Text(clientName).platformAdaptiveFont(size: 16).foregroundStyle(AKOrbitTheme.secondaryText)
                }
                Spacer()
                Button(action: onClose) {
                    Image(systemName: "xmark").platformAdaptiveFont(size: 13, weight: .semibold)
                        .foregroundStyle(AKOrbitTheme.primaryText).frame(width: 44, height: 44)
                        .background(.white.opacity(0.07), in: Circle())
                }
                .platformPlainButtonStyle().accessibilityLabel("Chiudi").disabled(restoring)
            }
            .padding(.bottom, 16)
        } content: {
                VStack(alignment: .leading, spacing: 16) {
                    ViewThatFits(in: .horizontal) {
                        HStack(spacing: 16) {
                            statusLabel
                            priorityLabel
                        }
                        VStack(alignment: .leading, spacing: 6) {
                            statusLabel
                            priorityLabel
                        }
                    }
                    .font(.subheadline.weight(.semibold))
                    if !item.description.isEmpty { summaryDetail("DESCRIZIONE", item.description) }
                    if let due = item.dueDate { summaryDetail("SCADENZA", WorkDateFormatters.date.date(from: due)?.formatted(.dateTime.day().month().year()) ?? due) }
                    if let scheduled = item.scheduledAt { summaryDetail("APPUNTAMENTO", ISO8601DateFormatter().date(from: scheduled)?.formatted(date: .abbreviated, time: .shortened) ?? scheduled) }
                    if !item.nextAction.isEmpty { summaryDetail("PROSSIMA AZIONE", item.nextAction) }
                    if !item.notes.isEmpty { summaryDetail("NOTE", item.notes) }
                    if item.kind == "todo" && item.status == "completed" {
                        Button(restoring ? "Salvataggio..." : "Riporta da fare") {
                            Task {
                                restoring = true; restoreError = nil; defer { restoring = false }
                                do { try await onRestore() }
                                catch { restoreError = error.localizedDescription }
                            }
                        }.buttonStyle(.bordered).disabled(restoring)
                        if let restoreError { Text(restoreError).foregroundStyle(.red) }
                    }
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
                    NativePhotoGallery(workItemID: item.id)
                    if item.kind != "todo" {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Label("Interventi", systemImage: "calendar")
                                    .font(.subheadline.weight(.semibold)).foregroundStyle(Color(hex: "#70c3a3"))
                                Spacer()
                                Text("\(interventions.count)").platformAdaptiveFont(size: 14, weight: .bold).foregroundStyle(AKOrbitTheme.secondaryText)
                            }
                            if orderedInterventions.isEmpty {
                                Text("Nessun intervento programmato.")
                                    .font(.subheadline).foregroundStyle(AKOrbitTheme.secondaryText)
                            }
                            ForEach(orderedInterventions) { intervention in
                                let start = interventionDate(intervention.startDate)
                                let elapsed = (interventionDate(intervention.endDate ?? intervention.startDate) ?? .distantFuture) < .now
                                HStack(alignment: .top, spacing: 12) {
                                    Circle().fill(Color(hex: elapsed ? "#75869a" : "#70c3a3")).frame(width: 10, height: 10).padding(.top, 4)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("\(start.map { intervention.allDay ? $0.formatted(date: .abbreviated, time: .omitted) : $0.formatted(date: .abbreviated, time: .shortened) } ?? intervention.startDate) · \(elapsed ? "Trascorso" : "In programma")")
                                            .platformAdaptiveFont(size: 14, weight: .bold).foregroundStyle(Color(hex: "#70c3a3"))
                                        Text(intervention.title).platformAdaptiveFont(size: 16, weight: .bold).foregroundStyle(AKOrbitTheme.primaryText)
                                        if let location = intervention.location, !location.isEmpty { Text(location).platformAdaptiveFont(size: 14).foregroundStyle(AKOrbitTheme.secondaryText) }
                                    }
                                }.padding(.leading, 6).padding(.vertical, 5)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .background(.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 14))
                    }
                    if let exportError {
                        Label(exportError, systemImage: "exclamationmark.triangle")
                            .font(.subheadline).foregroundStyle(Color(hex: "#ffb5a7"))
                    }
                    if item.kind != "todo" { Button {
                        do { pdfShare = WorkItemPDFShare(url: try WorkItemPDF.create(for: item, clientName: clientName, interventions: orderedInterventions)); exportError = nil }
                        catch { exportError = "Impossibile creare il PDF della lavorazione." }
                    } label: {
                        Label("Condividi PDF", systemImage: "square.and.arrow.up")
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity, minHeight: 44)
                            .padding(.horizontal, 12)
                            .background(.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 12))
                    }
                    .platformPlainButtonStyle()
                    .foregroundStyle(AKOrbitTheme.cyan)
                    .disabled(restoring)
                    }
                    Button(action: onEdit) {
                        Label(item.kind == "todo" ? "Modifica attività" : "Modifica lavorazione", systemImage: "pencil")
                            .font(.body.weight(.semibold))
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                        .buttonStyle(.borderedProminent).tint(AKOrbitTheme.orbitBlue)
                        .frame(maxWidth: .infinity, minHeight: 48).disabled(restoring)
            }
        }
        .padding(tabletDevice ? 20 : 16)
        .frame(maxWidth: .infinity, maxHeight: tabletDevice ? 760 : .infinity)
        .background {
            if tabletDevice {
                AKGlassSurface(shape: RoundedRectangle(cornerRadius: 24), highlighted: true)
            } else {
                AKOrbitBackground()
            }
        }
        .environment(\.colorScheme, .dark)
        .padding(tabletDevice ? 16 : 0)
        .preferredColorScheme(.dark)
        .sheet(item: $pdfShare) { share in WorkItemShareSheet(url: share.url) }
    }

    private var statusLabel: some View {
        Label(item.kind == "todo" && item.status == "planned" ? "Da fare" : WorkStatus.label(item.status),
              systemImage: item.status == "completed" ? "checkmark.circle" : "clock")
            .foregroundStyle(Color(hex: "#70c3a3"))
    }

    private var priorityLabel: some View {
        Label(item.priority == "high" ? "Priorità alta" : item.priority == "low" ? "Priorità bassa" : "Priorità normale",
              systemImage: "flag")
            .foregroundStyle(AKOrbitTheme.secondaryText)
    }

    private func summaryDetail(_ heading: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(heading).platformAdaptiveFont(size: 13, weight: .black).foregroundStyle(AKOrbitTheme.cyan)
            Text(value).platformAdaptiveFont(size: 16).foregroundStyle(AKOrbitTheme.primaryText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 12)) }
    }

    private func listButton(_ kind: WorkListKind, entries: [NativeChecklistEntry]) -> some View {
        let progress = listProgress(entries)
        let coverage = materialCoverage(item.materials, checklist: item.checklist)
        return Button { onOpenList(kind) } label: {
            AKGlassPanel(cornerRadius: 12, padding: 12) {
                VStack(alignment: .leading, spacing: 7) {
                    HStack(spacing: 8) {
                        Label(kind.title, systemImage: kind.icon).font(.headline).foregroundStyle(AKOrbitTheme.primaryText)
                        Spacer(minLength: 4)
                        Text("\(progress.done)/\(progress.total)").font(.subheadline).foregroundStyle(AKOrbitTheme.secondaryText)
                        Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(AKOrbitTheme.cyan)
                    }
                    if kind == .checklist && progress.total > 0 {
                        ProgressView(value: Double(progress.done), total: Double(progress.total)).tint(Color(hex: "#70c3a3"))
                    }
                    if kind == .materials && (coverage.total > 0 || coverage.orphaned > 0) {
                        Label("\(coverage.matched)/\(coverage.total) installati\(coverage.unitMismatches > 0 ? " · unità diversa" : "")\(coverage.orphaned > 0 ? " · da verificare" : "")", systemImage: coverage.complete ? "checkmark.circle.fill" : "exclamationmark.triangle")
                            .platformAdaptiveFont(size: 13, weight: .bold).foregroundStyle(Color(hex: coverage.complete ? "#70c3a3" : "#f0c778"))
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .contentShape(Rectangle())
        }.platformPlainButtonStyle().frame(maxWidth: .infinity)
    }
}

private struct WorkListDraftSnapshot: Equatable {
    let entries: [NativeChecklistEntry]
    let pendingOrder: [NativeChecklistEntry]?
    let newText: String
    let newStepText: String
}

private struct WorkListEditorView: View {
    @Environment(\.akTabletDevice) private var tabletDevice
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
    @State private var draftState: AKDraftState<WorkListDraftSnapshot>
    let workItemID: UUID?
    private let savedEntryIDs: Set<String>
    @State private var photoEntry: NativeChecklistEntry?

    init(kind: WorkListKind, simple: Bool = false, title: String, entries: [NativeChecklistEntry], materials: [NativeChecklistEntry], checklist: [NativeChecklistEntry], workItemID: UUID? = nil, onSave: @escaping ([NativeChecklistEntry]) async throws -> Void) {
        self.kind = kind
        self.simple = simple
        self.title = title
        self.materials = materials
        self.checklist = checklist
        self.onSave = onSave
        self.workItemID = workItemID
        self.savedEntryIDs = Set(entries.flatMap { [$0.id] + ($0.steps ?? []).map(\.id) })
        _draft = State(initialValue: entries)
        _draftState = State(initialValue: AKDraftState(baseline: WorkListDraftSnapshot(entries: entries, pendingOrder: nil, newText: "", newStepText: "")))
    }

    private var draftSnapshot: WorkListDraftSnapshot {
        WorkListDraftSnapshot(
            entries: draft,
            pendingOrder: ordering == visibleEntries ? nil : ordering,
            newText: AKDraftValue.text(newText),
            newStepText: AKDraftValue.text(newStepText)
        )
    }

    private func requestClose() {
        draftState.requestClose(current: draftSnapshot, isSaving: isSaving) { dismiss() }
    }

    private var parent: NativeChecklistEntry? { draft.first { $0.id == selectedParentID } }
    private var visibleEntries: [NativeChecklistEntry] { parent?.steps ?? draft }
    private var currentMaterials: [NativeChecklistEntry] { kind == .materials ? draft : materials }
    private var currentChecklist: [NativeChecklistEntry] { kind == .materials ? checklist : draft }
    private var lightweightRows: Bool {
        #if os(iOS)
        !tabletDevice
        #else
        false
        #endif
    }
    private func hasMaterialLink(_ material: NativeChecklistEntry) -> Bool {
        let unit = material.unit ?? .pezzi
        return linkedQuantity(currentChecklist, materialID: material.id, unit: unit) > 0
            || mismatchedQuantity(currentChecklist, materialID: material.id, unit: unit) > 0
    }

    var body: some View {
        VStack(spacing: 0) {
            checklistScrollContent
            HStack(spacing: 12) {
                Button { if ordering != nil { ordering = nil } else { requestClose() } } label: {
                    Text("Annulla").platformAdaptiveFont(size: 15, weight: .bold).frame(maxWidth: .infinity).padding(.vertical, 12)
                        .foregroundStyle(AKOrbitTheme.secondaryText).background(AKOrbitTheme.glassBlue).clipShape(RoundedRectangle(cornerRadius: 12))
                }.platformPlainButtonStyle().disabled(isSaving)
                Button { Task { await persistOrderOrList() } } label: {
                    Text(isSaving ? "Salvo..." : "Salva").platformAdaptiveFont(size: 15, weight: .bold).frame(maxWidth: .infinity).padding(.vertical, 12)
                        .foregroundStyle(.white).background(AKOrbitTheme.orbitBlue).clipShape(RoundedRectangle(cornerRadius: 12))
                }.platformPlainButtonStyle().disabled(isSaving)
            }.padding(16).background(AKOrbitTheme.glassBlue.opacity(0.85))
        }
        .foregroundStyle(AKOrbitTheme.primaryText)
        .background(AKOrbitBackground())
        .presentationDetents([.large])
        .akUnsavedChangesGuard($draftState, current: draftSnapshot, isSaving: isSaving, canSave: true, onSave: { Task { await persistOrderOrList(closeAfterSave: true) } }, onDiscard: { dismiss() })
        .sheet(item: $photoEntry) { entry in
            AKModalScrollContent {
                HStack {
                    Text(entry.text).font(.headline).frame(maxWidth: .infinity, alignment: .leading)
                    Button { photoEntry = nil } label: {
                        Image(systemName: "xmark").frame(width: 44, height: 44)
                    }.accessibilityLabel("Chiudi")
                }.padding(.horizontal, 16).padding(.top, 12)
            } content: {
                NativePhotoGallery(workItemID: workItemID, entryID: entry.id).padding(16)
            }
            .background(AKOrbitBackground())
            .preferredColorScheme(.dark)
        }
    }

    @ViewBuilder
    private var checklistScrollContent: some View {
        #if os(iOS)
        if !tabletDevice {
            List {
                checklistHeader
                    .listRowInsets(EdgeInsets(top: 0, leading: 0, bottom: 8, trailing: 0))
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
                checklistContent
                    .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .buttonStyle(.borderless)
            .id("\(selectedParentID ?? "root")-\(ordering == nil ? "editing" : "ordering")")
        } else {
            tabletChecklistScrollContent
        }
        #else
        tabletChecklistScrollContent
        #endif
    }

    private var tabletChecklistScrollContent: some View {
        AKModalScrollContent {
            checklistHeader
        } content: {
            VStack(alignment: .leading, spacing: 13) { checklistContent }
                .padding(20)
                .id("\(selectedParentID ?? "root")-\(ordering == nil ? "editing" : "ordering")")
        }
    }

    private var checklistHeader: some View {
                HStack(spacing: 12) {
                    if parent != nil && ordering == nil {
                        Button { if !newStepText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { addEntry() }; selectedParentID = nil; editingID = nil } label: { Image(systemName: "chevron.left") }.accessibilityLabel("Checklist")
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title).platformAdaptiveFont(size: 14).foregroundStyle(AKOrbitTheme.secondaryText)
                        Text(ordering == nil ? parent?.text ?? kind.title : "Riordina \(parent?.text ?? kind.title)")
                            .platformAdaptiveFont(size: 19, weight: .black).foregroundStyle(AKOrbitTheme.primaryText).lineLimit(2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Button(action: requestClose) { Image(systemName: "xmark").frame(width: 44, height: 44).contentShape(Rectangle()) }
                        .platformPlainButtonStyle().keyboardShortcut(.cancelAction).disabled(isSaving).accessibilityLabel("Chiudi")
                }
                .padding(18)
                .background(AKOrbitTheme.glassBlue.opacity(0.8))
    }

    @ViewBuilder
    private var checklistContent: some View {
                Group {
                    if ordering == nil && visibleEntries.count > 1 {
                        Button { ordering = visibleEntries } label: {
                            Label("Riordina voci", systemImage: "arrow.up.arrow.down")
                                .platformAdaptiveFont(size: 14, weight: .bold)
                                .frame(minHeight: 44)
                        }
                        .disabled(!pendingText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        .accessibilityHint("Apri l'ordinamento delle voci")
                    }
                    if let ordering {
                        ForEach(Array(ordering.enumerated()), id: \.element.id) { index, entry in
                            HStack(spacing: 12) {
                                Text("\(index + 1)").platformAdaptiveFont(size: 14, weight: .bold).frame(width: 24)
                                Text(entry.text).platformAdaptiveFont(size: 15).frame(maxWidth: .infinity, alignment: .leading)
                                Button { move(index, by: -1) } label: { Image(systemName: "arrow.up") }.disabled(index == 0 || isSaving).accessibilityLabel("Sposta \(entry.text) su")
                                Button { move(index, by: 1) } label: { Image(systemName: "arrow.down") }.disabled(index == ordering.count - 1 || isSaving).accessibilityLabel("Sposta \(entry.text) giù")
                            }.padding(12).background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 12), lightweight: lightweightRows) }
                        }
                    } else {
                        let progress = listProgress(visibleEntries)
                        HStack(alignment: .firstTextBaseline, spacing: 8) {
                            Text("\(progress.done) \(kind == .materials ? "utilizzati" : "fatte") · \(progress.total - progress.done) \(kind == .materials ? "da utilizzare" : "da fare")")
                                .platformAdaptiveFont(size: 14, weight: .bold).frame(maxWidth: .infinity, alignment: .leading)
                            if progress.total > 0 { Text("\(Int(Double(progress.done) / Double(progress.total) * 100))%").platformAdaptiveFont(size: 14, weight: .black).fixedSize() }
                        }
                        if progress.total > 0 { ProgressView(value: Double(progress.done), total: Double(progress.total)).tint(Color(hex: "#70c3a3")) }
                        ForEach(visibleEntries) { entry in entryRow(entry) }
                        HStack {
                            TextField(kind == .materials ? "Nuovo materiale" : parent == nil ? "Nuova voce" : "Nuova sottoattività", text: parent == nil ? $newText : $newStepText).onSubmit(addEntry).paymentInputStyle(lightweight: lightweightRows).platformAdaptiveFont(size: 17)
                            Button(action: addEntry) { Image(systemName: "plus") }.disabled(pendingText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty).accessibilityLabel("Aggiungi voce")
                        }
                        NativeDictationButton(text: parent == nil ? $newText : $newStepText)
                    }
                    if let errorMessage { Text(errorMessage).platformAdaptiveFont(size: 14).foregroundStyle(Color(hex: "#a9322b")) }
                }
    }

    private func entryRow(_ entry: NativeChecklistEntry) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 10) {
                Button { toggle(entry) } label: {
                    Image(systemName: entry.done ? "checkmark.square.fill" : "square")
                        .foregroundStyle(Color(hex: "#70c3a3"))
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                    .disabled(kind == .materials && hasMaterialLink(entry))
                    .accessibilityLabel("\(entry.done ? "Deseleziona" : "Completa") \(entry.text)")
                    .accessibilityHint(kind == .materials && hasMaterialLink(entry) ? "Utilizzo gestito dalla checklist lavorazione" : "")
                if kind == .checklist && parent == nil && editingID != entry.id {
                    Button { selectedParentID = entry.id } label: {
                        HStack { Text(entry.text).platformAdaptiveFont(size: 15).frame(maxWidth: .infinity, alignment: .leading); if let steps = entry.steps, !steps.isEmpty { let progress = listProgress(steps); Text("\(progress.done)/\(progress.total)").platformAdaptiveFont(size: 13) }; Image(systemName: "chevron.right") }
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                    }.platformPlainButtonStyle()
                } else {
                    TextField("Voce", text: Binding(get: { currentText(for: entry.id) }, set: { updateText(entry.id, to: $0) }))
                        .onSubmit { editingID = nil }.paymentInputStyle(lightweight: lightweightRows).platformAdaptiveFont(size: 17)
                }
            }
            HStack(spacing: 12) {
                if kind == .checklist && parent == nil {
                    Button { editingID = entry.id } label: { Label("Rinomina", systemImage: "pencil") }
                        .frame(minHeight: 44).accessibilityLabel("Rinomina \(entry.text)")
                }
                Spacer(minLength: 0)
                Button(role: .destructive) { remove(entry.id) } label: {
                    Image(systemName: "trash").frame(width: 44, height: 44)
                }.accessibilityLabel("Elimina \(entry.text)")
            }
            if !simple { HStack(spacing: 8) {
                Text("Quantità").platformAdaptiveFont(size: 14)
                TextField("Quantità", value: Binding(get: { currentEntry(for: entry.id)?.quantity ?? 1 }, set: { value in
                    guard value > 0, value.isFinite, (currentEntry(for: entry.id)?.unit ?? .pezzi) == .metri || value.rounded() == value else { return }
                    updateEntry(entry.id) { $0.quantity = value }
                }), format: .number).platformDecimalKeyboard().frame(width: 75).paymentInputStyle(lightweight: lightweightRows).platformAdaptiveFont(size: 16)
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
                        .platformAdaptiveFont(size: 14, weight: .bold).lineLimit(1).foregroundStyle(AKOrbitTheme.primaryText)
                        .padding(.horizontal, 10).padding(.vertical, 9)
                            .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 10), lightweight: lightweightRows) }
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
                    .font(.caption.weight(.semibold)).foregroundStyle(AKOrbitTheme.primaryText)
                    .padding(.horizontal, 12).padding(.vertical, 10)
                    .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 10), lightweight: lightweightRows) }
                    .frame(maxWidth: .infinity)
                }.accessibilityLabel("Materiale per \(entry.text)")
            }
            if !simple { coverageStatus(for: entry) }
            if kind == .checklist {
                Button { photoEntry = entry } label: { Label("Foto voce", systemImage: "photo") }
                    .disabled(workItemID == nil || !savedEntryIDs.contains(entry.id))
                if workItemID == nil || !savedEntryIDs.contains(entry.id) {
                    Text("Salva prima la voce per aggiungere foto.").font(.caption)
                }
            }
        }.platformAdaptiveFont(size: 15).padding(10).background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 12), lightweight: lightweightRows) }
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
            .foregroundStyle(Color(hex: mismatched > 0 ? "#ffb5a7" : abs(installed - required) < 0.000001 ? "#70c3a3" : "#f0c778"))
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

    private func persistOrderOrList(closeAfterSave: Bool = false) async {
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
            let keepOpen = ordering != nil && !closeAfterSave
            ordering = nil
            draftState.markSaved(draftSnapshot)
            if !keepOpen { dismiss() }
        } catch { errorMessage = "Impossibile salvare la lista." }
        isSaving = false
    }
}

private struct WorkItemDraftSnapshot: Equatable {
    let title: String
    let description: String
    let clientID: UUID?
    let checklistSourceID: UUID?
    let status: String
    let priority: String
    let dueDay: DateComponents?
    let scheduledMinute: Int?
    let nextAction: String
    let notes: String
    let checklist: [NativeChecklistEntry]
    let materials: [NativeChecklistEntry]
}

private struct WorkItemEditorView: View {
    private enum MacPlanningTarget { case dueDate, appointment }

    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    let item: WorkItem?
    let clients: [WorkClient]
    let checklistSources: [WorkItem]
    let mode: String
    let defaultClientID: UUID?
    let onClose: () -> Void
    let onSave: (WorkItemPayload, WorkItem?) async throws -> Void

    @State private var title = ""
    @State private var description = ""
    @State private var clientID: UUID?
    @State private var checklistSourceID: UUID?
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
    @State private var macPlanningTarget = MacPlanningTarget.appointment
    @State private var macVisibleMonth = Calendar.current.dateInterval(of: .month, for: .now)?.start ?? .now
    @State private var macAppointmentTime = "09:00"
    @State private var draft = AKDraftState<WorkItemDraftSnapshot>()

    private static let macTimeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "HH:mm"
        return formatter
    }()

    var body: some View {
        Group {
            #if os(macOS)
            macBody
            #else
            mobileBody
            #endif
        }
        .akUnsavedChangesGuard($draft, current: draftSnapshot, isSaving: isSaving, canSave: !title.trimmingCharacters(in: .whitespaces).isEmpty, onSave: { Task { await submit() } }, onDiscard: onClose)
    }

    private var mobileBody: some View {
        VStack(spacing: 0) {
            AKModalScrollContent {
                HStack(spacing: 12) {
                    Image(systemName: "briefcase.fill").foregroundStyle(Color(hex: "#70c3a3")).font(.title3).frame(width: 42, height: 42).background(Color(hex: "#70c3a3").opacity(0.14)).clipShape(RoundedRectangle(cornerRadius: 13))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(mode == "todo" ? item == nil ? "Nuova cosa da fare" : "Modifica cosa da fare" : item == nil ? "Nuova lavorazione" : "Modifica lavorazione").platformAdaptiveFont(size: 20, weight: .black).foregroundStyle(AKOrbitTheme.primaryText)
                        Text("Un posto solo per il lavoro e il prossimo passo").platformAdaptiveFont(size: 14).foregroundStyle(AKOrbitTheme.secondaryText)
                    }
                    Spacer()
                    Button(action: requestClose) {
                        Image(systemName: "xmark").foregroundStyle(AKOrbitTheme.primaryText)
                            .frame(width: 44, height: 44).background(AKOrbitTheme.glassBlue, in: Circle())
                    }
                    .platformPlainButtonStyle().accessibilityLabel("Chiudi").disabled(isSaving)
                }
                .padding(18).overlay(alignment: .bottom) { Rectangle().fill(AKOrbitTheme.cyan.opacity(0.22)).frame(height: 1) }
            } content: {
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
                            .platformAdaptiveFont(size: 16).foregroundStyle(AKOrbitTheme.primaryText)
                            .padding(12).background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 12)) }
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

                    if horizontalSizeClass == .compact {
                        VStack(spacing: 12) {
                            pickerField("STATO", selection: $status, values: mode == "todo" ? [("planned", "Da fare"), ("completed", "Completata")] : WorkStatus.values.map { ($0, WorkStatus.label($0)) })
                            pickerField("PRIORITÀ", selection: $priority, values: [("low", "Bassa"), ("normal", "Normale"), ("high", "Alta")])
                        }
                    } else {
                        HStack(spacing: 12) {
                            pickerField("STATO", selection: $status, values: mode == "todo" ? [("planned", "Da fare"), ("completed", "Completata")] : WorkStatus.values.map { ($0, WorkStatus.label($0)) })
                            pickerField("PRIORITÀ", selection: $priority, values: [("low", "Bassa"), ("normal", "Normale"), ("high", "Alta")])
                        }
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Toggle("Imposta una scadenza", isOn: $hasDueDate).tint(AKOrbitTheme.cyan)
                        if hasDueDate {
                            DatePicker("Scadenza", selection: $dueDate, displayedComponents: .date)
                                .datePickerStyle(.compact).tint(AKOrbitTheme.cyan)
                        }
                        Toggle("Fissa un appuntamento", isOn: $hasAppointment).tint(AKOrbitTheme.cyan)
                        if hasAppointment {
                            DatePicker("Data e ora", selection: $scheduledAt, displayedComponents: [.date, .hourAndMinute])
                                .datePickerStyle(.compact).tint(AKOrbitTheme.cyan)
                        }
                    }
                    .platformAdaptiveFont(size: 16, weight: .medium).padding(14).background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 15)) }

                    field("PROSSIMA AZIONE", placeholder: "Es. richiamare per confermare", text: $nextAction)
                    VStack(alignment: .leading, spacing: 7) {
                        fieldLabel("NOTE", icon: "text.alignleft")
                        TextField("Dettagli da ritrovare al volo...", text: $notes, axis: .vertical).lineLimit(3...6).paymentInputStyle().platformAdaptiveFont(size: 16)
                        NativeDictationButton(text: $notes)
                    }
                    if let errorMessage { Text(errorMessage).platformAdaptiveFont(size: 14).foregroundStyle(Color(hex: "#ffb5a7")) }
                }
                .padding(20)
            }

            HStack(spacing: 12) {
                Button(action: requestClose) {
                    Text("Annulla").platformAdaptiveFont(size: 15, weight: .bold).frame(maxWidth: .infinity, minHeight: 48)
                        .foregroundStyle(AKOrbitTheme.secondaryText).background(AKOrbitTheme.glassBlue).clipShape(RoundedRectangle(cornerRadius: 12))
                }.platformPlainButtonStyle().disabled(isSaving)
                Button { Task { await submit() } } label: {
                    Text(isSaving ? "Salvo..." : horizontalSizeClass == .compact ? "Salva" : mode == "todo" ? "Salva attività" : "Salva lavorazione")
                        .platformAdaptiveFont(size: 15, weight: .bold).frame(maxWidth: .infinity, minHeight: 48)
                        .foregroundStyle(.white).background(AKOrbitTheme.orbitBlue).clipShape(RoundedRectangle(cornerRadius: 12))
                }.platformPlainButtonStyle().disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
            }
            .padding(16).background(AKOrbitTheme.glassBlue.opacity(0.85))
        }
        .frame(maxHeight: 780)
        .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 24), highlighted: true) }
        .environment(\.colorScheme, .dark)
        .padding(16)
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

    #if os(macOS)
    private var macBody: some View {
        VStack(spacing: 0) {
            HStack(spacing: 13) {
                Image(systemName: mode == "todo" ? "checklist" : "briefcase.fill")
                    .platformAdaptiveFont(size: 19, weight: .semibold)
                    .foregroundStyle(AKOrbitTheme.cyan)
                    .frame(width: 44, height: 44)
                    .background(AKOrbitTheme.cyan.opacity(0.12), in: RoundedRectangle(cornerRadius: 13))
                VStack(alignment: .leading, spacing: 4) {
                    Text(mode == "todo" ? item == nil ? "Nuova attività" : "Modifica attività" : item == nil ? "Nuova lavorazione" : "Modifica lavorazione")
                        .platformAdaptiveFont(size: 22, weight: .bold).foregroundStyle(AKOrbitTheme.primaryText)
                    Text(mode == "todo" ? "Organizza la tua attività e il prossimo passo." : "Organizza interventi, checklist e materiali.")
                        .platformAdaptiveFont(size: 14).foregroundStyle(AKOrbitTheme.secondaryText)
                }
                Spacer()
                Button(action: requestClose) {
                    Image(systemName: "xmark").platformAdaptiveFont(size: 14, weight: .semibold)
                        .foregroundStyle(AKOrbitTheme.secondaryText).frame(width: 38, height: 38)
                        .background(.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 11))
                }
                .platformPlainButtonStyle().keyboardShortcut(.cancelAction).accessibilityLabel("Chiudi").disabled(isSaving)
            }
            .padding(.horizontal, 22).padding(.vertical, 16)
            .overlay(alignment: .bottom) { Rectangle().fill(AKOrbitTheme.cyan.opacity(0.22)).frame(height: 1) }

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 15) {
                    macField(mode == "todo" ? "COSA DEVI FARE" : "NOME DEL LAVORO", icon: "text.alignleft") {
                        TextField(mode == "todo" ? "Es. Sentire Pietro" : "Es. Installazione cucina", text: $title)
                            .platformNoAutocapitalization()
                            .paymentInputStyle()
                            .platformAdaptiveFont(size: 18)
                    }
                    macField("CLIENTE", icon: "person") {
                        Picker("Cliente", selection: $clientID) {
                            Text("Nessun cliente").tag(UUID?.none)
                            ForEach(clients) { client in Text(clientOptionLabel(client)).tag(Optional(client.id)) }
                        }
                        .pickerStyle(.menu).paymentInputStyle().platformAdaptiveFont(size: 18)
                    }
                    macField("DESCRIZIONE", icon: "text.bubble") {
                        TextField("Cosa c'è da fare?", text: $description, axis: .vertical)
                            .lineLimit(3...5).paymentInputStyle().platformAdaptiveFont(size: 17)
                    }

                    if mode != "todo" {
                        macField("CHECKLIST COLLEGATA", icon: "link") {
                            Picker("Checklist collegata", selection: $checklistSourceID) {
                                Text("Checklist indipendente").tag(UUID?.none)
                                ForEach(checklistSources) { source in
                                    let progress = listProgress(source.checklist)
                                    Text("\(source.title) · \(progress.done)/\(progress.total)").tag(Optional(source.id))
                                }
                            }
                            .pickerStyle(.menu)
                            .paymentInputStyle()
                            .platformAdaptiveFont(size: 16)
                            .onChange(of: checklistSourceID) { sourceID in
                                guard let source = checklistSources.first(where: { $0.id == sourceID }) else { return }
                                let previous = checklist
                                checklist = source.checklist
                                materials = synchronizeMaterialUsage(materials, checklist: source.checklist, previousChecklist: previous)
                            }
                            Text(checklistSourceID == nil
                                 ? "Puoi crearne una nuova oppure collegarne una da Cose da fare."
                                 : "Modifiche e avanzamenti saranno sincronizzati con la checklist originale.")
                                .platformAdaptiveFont(size: 11)
                                .foregroundStyle(AKOrbitTheme.secondaryText)
                        }
                    }

                    HStack(spacing: 12) {
                        macListButton(.checklist, entries: checklist)
                        if mode != "todo" { macListButton(.materials, entries: materials) }
                    }

                    HStack(alignment: .top, spacing: 12) {
                        macField("STATO", icon: "circle.lefthalf.filled") {
                            Picker("Stato", selection: $status) {
                                ForEach(WorkStatus.values.filter { mode != "todo" || $0 != "waiting" }, id: \.self) { value in
                                    Text(value == "planned" ? "Da fare" : WorkStatus.label(value)).tag(value)
                                }
                            }
                            .pickerStyle(.segmented).platformAdaptiveFont(size: 14, weight: .medium)
                        }
                        macField("PRIORITÀ", icon: "chart.bar") {
                            Picker("Priorità", selection: $priority) {
                                Text("Bassa").tag("low"); Text("Normale").tag("normal"); Text("Alta").tag("high")
                            }.pickerStyle(.menu).paymentInputStyle().platformAdaptiveFont(size: 16)
                        }
                    }

                    HStack(spacing: 12) {
                        macPlanningToggle("Imposta una scadenza", subtitle: "Indica la data di completamento prevista.", icon: "calendar", value: $hasDueDate) {
                            macPlanningTarget = .dueDate
                            macVisibleMonth = Calendar.current.dateInterval(of: .month, for: dueDate)?.start ?? dueDate
                        }
                        if mode != "todo" {
                            macPlanningToggle("Fissa un appuntamento", subtitle: "Pianifica un incontro o un intervento.", icon: "calendar.badge.plus", value: $hasAppointment) {
                                macPlanningTarget = .appointment
                                macVisibleMonth = Calendar.current.dateInterval(of: .month, for: scheduledAt)?.start ?? scheduledAt
                            }
                        }
                    }

                    if hasDueDate || (mode != "todo" && hasAppointment) {
                        macPlanningCalendar
                    }

                    macField("PROSSIMA AZIONE", icon: "arrow.turn.down.right") {
                        TextField("Es. richiamare per confermare", text: $nextAction).paymentInputStyle().platformAdaptiveFont(size: 17)
                    }
                    macField("NOTE", icon: "text.alignleft") {
                        VStack(alignment: .leading, spacing: 9) {
                            TextField("Dettagli da ritrovare al volo...", text: $notes, axis: .vertical).lineLimit(3...5).paymentInputStyle().platformAdaptiveFont(size: 17)
                            NativeDictationButton(text: $notes)
                        }
                    }
                    if let errorMessage { Text(errorMessage).platformAdaptiveFont(size: 12).foregroundStyle(Color(hex: "#ffb5a7")) }
                }
                .padding(.horizontal, 20).padding(.vertical, 16)
            }

            HStack(spacing: 12) {
                Text("* Campi obbligatori").platformAdaptiveFont(size: 13).foregroundStyle(AKOrbitTheme.secondaryText)
                Spacer()
                Button("Annulla", action: requestClose).platformAdaptiveFont(size: 14, weight: .medium).buttonStyle(.bordered).tint(AKOrbitTheme.cyan).disabled(isSaving)
                Button(isSaving ? "Salvo..." : mode == "todo" ? "Salva attività" : "Salva lavorazione") {
                    Task { await submit() }
                }
                .platformAdaptiveFont(size: 14, weight: .semibold)
                .buttonStyle(.borderedProminent).tint(AKOrbitTheme.orbitBlue)
                .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
            }
            .padding(.horizontal, 20).padding(.vertical, 14)
            .background(AKOrbitTheme.glassBlue.opacity(0.84))
            .overlay(alignment: .top) { Rectangle().fill(AKOrbitTheme.cyan.opacity(0.18)).frame(height: 1) }
        }
        .frame(minWidth: 640, maxWidth: 760, maxHeight: 780)
        .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 24), highlighted: true) }
        .onAppear(perform: load)
        .sheet(item: $selectedList) { kind in
            WorkListEditorView(kind: kind, simple: mode == "todo", title: title, entries: kind == .checklist ? checklist : materials, materials: materials, checklist: checklist) { entries in
                if kind == .checklist {
                    let previous = checklist
                    checklist = entries
                    materials = synchronizeMaterialUsage(materials, checklist: entries, previousChecklist: previous)
                } else {
                    materials = synchronizeMaterialUsage(entries, checklist: checklist)
                }
            }
        }
    }

    private func macField<Content: View>(_ title: String, icon: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(title, systemImage: icon).platformAdaptiveFont(size: 12, weight: .bold).foregroundStyle(AKOrbitTheme.cyan)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func macListButton(_ kind: WorkListKind, entries: [NativeChecklistEntry]) -> some View {
        Button { selectedList = kind } label: {
            HStack(spacing: 9) {
                Image(systemName: kind.icon).foregroundStyle(AKOrbitTheme.cyan)
                Text(kind.title).platformAdaptiveFont(size: 15, weight: .semibold)
                Text("· \(entries.count) elementi").platformAdaptiveFont(size: 13).foregroundStyle(AKOrbitTheme.secondaryText)
                Spacer(minLength: 0)
                Image(systemName: "plus.circle.fill").foregroundStyle(AKOrbitTheme.cyan)
                Image(systemName: "chevron.down").platformAdaptiveFont(size: 10, weight: .bold).foregroundStyle(AKOrbitTheme.secondaryText)
            }
            .padding(.horizontal, 12).frame(maxWidth: .infinity, minHeight: 46)
            .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 12)) }
        }
        .platformPlainButtonStyle()
        .foregroundStyle(AKOrbitTheme.primaryText)
    }

    private func macPlanningToggle(_ title: String, subtitle: String, icon: String, value: Binding<Bool>, action: @escaping () -> Void) -> some View {
        AKGlassPanel(cornerRadius: 12, padding: 13) {
            HStack(spacing: 11) {
                Image(systemName: icon)
                    .platformAdaptiveFont(size: 17)
                    .foregroundStyle(AKOrbitTheme.cyan)
                    .frame(width: 34, height: 34)
                    .background(AKOrbitTheme.cyan.opacity(0.12), in: RoundedRectangle(cornerRadius: 9))
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).platformAdaptiveFont(size: 15, weight: .semibold)
                    Text(subtitle).platformAdaptiveFont(size: 12).foregroundStyle(AKOrbitTheme.secondaryText)
                }
                Spacer(minLength: 3)
                Toggle(title, isOn: value).labelsHidden().tint(AKOrbitTheme.orbitBlue)
            }
        }
        .onChange(of: value.wrappedValue) { isEnabled in if isEnabled { action() } }
    }

    private var macPlanningDate: Date {
        macPlanningTarget == .dueDate ? dueDate : scheduledAt
    }

    private var macPlanningDays: [Date?] {
        let calendar = Calendar.current
        let firstDay = calendar.date(from: calendar.dateComponents([.year, .month], from: macVisibleMonth)) ?? macVisibleMonth
        let leadingDays = (calendar.component(.weekday, from: firstDay) + 5) % 7
        guard let range = calendar.range(of: .day, in: .month, for: firstDay) else { return [] }
        let days = range.compactMap { calendar.date(byAdding: .day, value: $0 - 1, to: firstDay) }
        let trailingDays = (7 - ((leadingDays + days.count) % 7)) % 7
        return Array(repeating: nil, count: leadingDays) + days.map(Optional.some) + Array(repeating: nil, count: trailingDays)
    }

    private var macPlanningCalendar: some View {
        AKGlassPanel(cornerRadius: 15, padding: 13) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    planningDateChip("Scadenza", date: dueDate, enabled: hasDueDate, selected: macPlanningTarget == .dueDate) {
                        macPlanningTarget = .dueDate
                        macVisibleMonth = Calendar.current.dateInterval(of: .month, for: dueDate)?.start ?? dueDate
                    }
                    if mode != "todo" {
                        planningDateChip("Appuntamento", date: scheduledAt, enabled: hasAppointment, selected: macPlanningTarget == .appointment) {
                            macPlanningTarget = .appointment
                            macVisibleMonth = Calendar.current.dateInterval(of: .month, for: scheduledAt)?.start ?? scheduledAt
                        }
                    }
                }
                HStack(alignment: .top, spacing: 15) {
                    VStack(spacing: 9) {
                        HStack {
                            Button { shiftMacPlanningMonth(-1) } label: { Image(systemName: "chevron.left") }.platformPlainButtonStyle().accessibilityLabel("Mese precedente")
                            Spacer()
                            Text(macVisibleMonth.formatted(.dateTime.month(.wide).year().locale(Locale(identifier: "it_IT"))).capitalized)
                                .platformAdaptiveFont(size: 15, weight: .semibold)
                            Spacer()
                            Button { shiftMacPlanningMonth(1) } label: { Image(systemName: "chevron.right") }.platformPlainButtonStyle().accessibilityLabel("Mese successivo")
                        }
                        HStack(spacing: 5) {
                            ForEach(["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"], id: \.self) { day in
                                Text(day).platformAdaptiveFont(size: 11, weight: .semibold).foregroundStyle(AKOrbitTheme.secondaryText).frame(maxWidth: .infinity)
                            }
                        }
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 3), count: 7), spacing: 3) {
                            ForEach(Array(macPlanningDays.enumerated()), id: \.offset) { _, date in
                                if let date { macPlanningDay(date) }
                                else { Color.clear.frame(height: 28) }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    if mode != "todo" && macPlanningTarget == .appointment {
                        Rectangle().fill(AKOrbitTheme.cyan.opacity(0.15)).frame(width: 1)
                        VStack(alignment: .leading, spacing: 8) {
                            Text("ORA").platformAdaptiveFont(size: 12, weight: .bold).foregroundStyle(AKOrbitTheme.cyan)
                            HStack(spacing: 9) {
                                Image(systemName: "clock").foregroundStyle(AKOrbitTheme.cyan)
                                TextField("09:00", text: $macAppointmentTime)
                                    .textFieldStyle(.plain)
                                    .platformAdaptiveFont(size: 17, weight: .semibold).monospacedDigit()
                                    .onChange(of: macAppointmentTime) { value in updateMacAppointmentTime(value) }
                                    .onSubmit { macAppointmentTime = Self.macTimeFormatter.string(from: scheduledAt) }
                            }
                            .padding(11)
                            .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 10), highlighted: true) }
                            Text("Scrivi l'ora nel formato HH:mm")
                                .platformAdaptiveFont(size: 10).foregroundStyle(AKOrbitTheme.secondaryText)
                            Rectangle().fill(AKOrbitTheme.cyan.opacity(0.14)).frame(height: 1)
                            Text("Appuntamento: \(scheduledAt.formatted(.dateTime.weekday(.wide).day().month(.wide).hour().minute().locale(Locale(identifier: "it_IT"))))")
                                .platformAdaptiveFont(size: 13, weight: .semibold).foregroundStyle(AKOrbitTheme.primaryText)
                            if hasDueDate {
                                Text("Scadenza: \(dueDate.formatted(.dateTime.weekday(.wide).day().month(.wide).locale(Locale(identifier: "it_IT"))))")
                                    .platformAdaptiveFont(size: 12).foregroundStyle(AKOrbitTheme.secondaryText)
                            }
                        }
                        .frame(width: 225, alignment: .leading)
                    } else if macPlanningTarget == .dueDate {
                        Rectangle().fill(AKOrbitTheme.cyan.opacity(0.15)).frame(width: 1)
                        VStack(alignment: .leading, spacing: 8) {
                            Text("SCADENZA SELEZIONATA").platformAdaptiveFont(size: 12, weight: .bold).foregroundStyle(AKOrbitTheme.cyan)
                            Text(dueDate.formatted(.dateTime.weekday(.wide).day().month(.wide).year().locale(Locale(identifier: "it_IT"))))
                                .platformAdaptiveFont(size: 14, weight: .semibold).foregroundStyle(AKOrbitTheme.primaryText)
                            if hasAppointment {
                                Text("Appuntamento: \(scheduledAt.formatted(.dateTime.day().month(.wide).hour().minute().locale(Locale(identifier: "it_IT"))))")
                                    .platformAdaptiveFont(size: 12).foregroundStyle(AKOrbitTheme.secondaryText)
                            }
                        }
                        .frame(width: 225, alignment: .leading)
                    }
                }
            }
        }
    }

    private func planningDateChip(_ title: String, date: Date, enabled: Bool, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label("\(title) · \(date.formatted(.dateTime.day().month(.abbreviated).locale(Locale(identifier: "it_IT"))))", systemImage: title == "Scadenza" ? "calendar" : "calendar.badge.plus")
                .platformAdaptiveFont(size: 11, weight: .semibold)
                .foregroundStyle(enabled ? AKOrbitTheme.primaryText : AKOrbitTheme.secondaryText)
                .padding(.horizontal, 10).frame(maxWidth: .infinity, minHeight: 34)
                .background(selected ? AKOrbitTheme.orbitBlue.opacity(0.6) : AKOrbitTheme.glassBlue, in: RoundedRectangle(cornerRadius: 9))
                .overlay { RoundedRectangle(cornerRadius: 9).stroke(AKOrbitTheme.cyan.opacity(selected ? 0.65 : 0.18), lineWidth: 1) }
        }
        .platformPlainButtonStyle().disabled(!enabled)
    }

    private func macPlanningDay(_ date: Date) -> some View {
        let selected = Calendar.current.isDate(date, inSameDayAs: macPlanningDate)
        let currentMonth = Calendar.current.isDate(date, equalTo: macVisibleMonth, toGranularity: .month)
        return Button {
            let currentTime = Calendar.current.dateComponents([.hour, .minute], from: macPlanningDate)
            let dateWithTime = Calendar.current.date(bySettingHour: currentTime.hour ?? 9, minute: currentTime.minute ?? 0, second: 0, of: date) ?? date
            if macPlanningTarget == .dueDate { dueDate = dateWithTime } else { scheduledAt = dateWithTime }
        } label: {
            Text("\(Calendar.current.component(.day, from: date))")
                .platformAdaptiveFont(size: 13, weight: selected ? .bold : .medium)
                .foregroundStyle(selected ? Color(hex: "#061426") : currentMonth ? AKOrbitTheme.primaryText : AKOrbitTheme.secondaryText.opacity(0.45))
                .frame(maxWidth: .infinity).frame(height: 28)
                .background {
                    if selected { Circle().fill(AKOrbitTheme.cyan) }
                    else if Calendar.current.isDateInToday(date) { Circle().stroke(AKOrbitTheme.cyan.opacity(0.62), lineWidth: 1) }
                }
                .contentShape(Circle())
        }
        .platformPlainButtonStyle()
        .accessibilityLabel(date.formatted(date: .complete, time: .omitted))
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func shiftMacPlanningMonth(_ offset: Int) {
        macVisibleMonth = Calendar.current.date(byAdding: .month, value: offset, to: macVisibleMonth) ?? macVisibleMonth
    }

    private func updateMacAppointmentTime(_ value: String) {
        guard value.range(of: #"^\d{2}:\d{2}$"#, options: .regularExpression) != nil,
              let parsed = Self.macTimeFormatter.date(from: value) else { return }
        let components = Calendar.current.dateComponents([.hour, .minute], from: parsed)
        guard let hour = components.hour, (0..<24).contains(hour),
              let minute = components.minute, (0..<60).contains(minute) else { return }
        scheduledAt = Calendar.current.date(bySettingHour: hour, minute: minute, second: 0, of: scheduledAt) ?? scheduledAt
    }

    #endif

    private func listButton(_ kind: WorkListKind, entries: [NativeChecklistEntry]) -> some View {
        let progress = listProgress(entries)
        return Button { selectedList = kind } label: {
            AKGlassPanel(cornerRadius: 12, padding: 12) {
                HStack {
                Label(kind.title, systemImage: kind.icon).font(.caption.weight(.bold)).lineLimit(1)
                Spacer(minLength: 2)
                Text(kind == .checklist && progress.total > 0 ? "\(Int(Double(progress.done) / Double(progress.total) * 100))%" : "\(progress.total)").font(.caption.weight(.black)).fixedSize()
                }
            }
            .contentShape(Rectangle())
        }.platformPlainButtonStyle().foregroundStyle(AKOrbitTheme.primaryText).frame(maxWidth: .infinity)
    }

    private func field(_ label: String, placeholder: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 7) { fieldLabel(label, icon: "text.alignleft"); TextField(placeholder, text: text).platformNoAutocapitalization().paymentInputStyle().platformAdaptiveFont(size: 16) }
    }

    private func fieldLabel(_ title: String, icon: String) -> some View {
        Label(title, systemImage: icon).platformAdaptiveFont(size: 12, weight: .black).foregroundStyle(Color(hex: "#8a7f9f"))
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
                .platformAdaptiveFont(size: 16)
                .padding(11).background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 12)) }
        }
    }

    private func load() {
        defer { draft.capture(draftSnapshot) }
        guard let item else {
            clientID = defaultClientID
            macAppointmentTime = Self.macTimeFormatter.string(from: scheduledAt)
            return
        }
        title = item.title
        description = item.description
        clientID = item.clientID
        checklistSourceID = item.checklistSourceID
        status = item.status
        priority = item.priority
        nextAction = item.nextAction
        notes = item.notes
        checklist = item.checklist
        materials = item.materials
        if let value = item.dueDate, let date = WorkDateFormatters.date.date(from: value) { dueDate = date; hasDueDate = true }
        if let value = item.scheduledAt, let date = ISO8601DateFormatter().date(from: value) {
            scheduledAt = date
            macAppointmentTime = Self.macTimeFormatter.string(from: date)
            hasAppointment = true
        } else {
            macAppointmentTime = Self.macTimeFormatter.string(from: scheduledAt)
        }
    }

    private var draftSnapshot: WorkItemDraftSnapshot {
        WorkItemDraftSnapshot(
            title: AKDraftValue.text(title),
            description: AKDraftValue.text(description),
            clientID: clientID,
            checklistSourceID: checklistSourceID,
            status: status,
            priority: priority,
            dueDay: hasDueDate ? AKDraftValue.day(dueDate) : nil,
            scheduledMinute: hasAppointment ? AKDraftValue.minute(scheduledAt) : nil,
            nextAction: AKDraftValue.text(nextAction),
            notes: AKDraftValue.text(notes),
            checklist: checklist,
            materials: materials
        )
    }

    private func requestClose() {
        draft.requestClose(current: draftSnapshot, isSaving: isSaving, close: onClose)
    }

    private func submit() async {
        isSaving = true
        defer { isSaving = false }
        let payload = WorkItemPayload(
            clientID: clientID,
            checklistSourceID: checklistSourceID,
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

#if os(macOS)
private struct WorkItemShareSheet: View {
    let url: URL

    var body: some View {
        ShareLink(item: url) {
            Label("Condividi PDF", systemImage: "square.and.arrow.up")
        }
        .padding(24)
        .frame(minWidth: 320, minHeight: 140)
    }
}

private enum WorkItemPDF {
    static func create(for item: WorkItem, clientName: String, interventions: [WorkIntervention] = []) throws -> URL {
        let sections = [
            "AK Suite · Riepilogo lavorazione",
            item.title,
            "Cliente: \(clientName)",
            "Stato: \(item.status)",
            item.description,
            "Prossima azione: \(item.nextAction)",
            item.notes,
            "Checklist\n\(item.checklist.map { "• \($0.text)" }.joined(separator: "\n"))",
            "Materiali\n\(item.materials.map { "• \($0.text)" }.joined(separator: "\n"))",
        ].filter { !$0.isEmpty }
        let textView = NSTextView(frame: NSRect(x: 0, y: 0, width: 595, height: 842))
        textView.string = sections.joined(separator: "\n\n")
        textView.font = .systemFont(ofSize: 12)
        textView.isEditable = false
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("AKSuite-Lavorazione-\(item.id.uuidString).pdf")
        try textView.dataWithPDF(inside: textView.bounds).write(to: url, options: .atomic)
        return url
    }
}
#else
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
#endif

private extension View {
    func paymentInputStyle(lightweight: Bool = false) -> some View {
        #if os(macOS)
        self.platformAdaptiveFont(size: 17).foregroundStyle(AKOrbitTheme.primaryText).textFieldStyle(.plain)
            .padding(.horizontal, 13).padding(.vertical, 11)
            .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 12), lightweight: lightweight) }
        #else
        self.platformAdaptiveFont(size: 16).foregroundStyle(AKOrbitTheme.primaryText)
            .padding(.horizontal, 13).padding(.vertical, 11)
            .background { AKGlassSurface(shape: RoundedRectangle(cornerRadius: 12), lightweight: lightweight) }
        #endif
    }
}