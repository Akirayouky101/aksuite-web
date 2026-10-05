import SwiftUI
import UniformTypeIdentifiers

private struct ShoppingPDFDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.pdf] }
    let data: Data
    init(data: Data) { self.data = data }
    init(configuration: ReadConfiguration) throws {
        guard let data = configuration.file.regularFileContents else { throw ShoppingError.invalid("PDF non leggibile.") }
        self.data = data
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: data) }
}

private enum ShoppingEditor: Identifiable {
    case list(ShoppingListRecord?)
    case product(UUID, ShoppingProduct?)
    var id: String {
        switch self {
        case .list(let list): return "list-\(list?.id.uuidString ?? "new")"
        case .product(let listID, let product): return "product-\(listID)-\(product?.id.uuidString ?? "new")"
        }
    }
}

private struct ShoppingDeletion: Identifiable {
    let id: UUID
    let title: String
    let isList: Bool
}

struct ShoppingWorkspaceView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @StateObject private var store = ShoppingStore()
    let onBack: () -> Void
    @State private var selectedID: UUID?
    @State private var query = ""
    @State private var filter = "all"
    @State private var editor: ShoppingEditor?
    @State private var deletion: ShoppingDeletion?
    @State private var pdfURL: URL?
    @State private var pdfDocument: ShoppingPDFDocument?
    @State private var showPDF = false
    @State private var showExporter = false

    private var selected: ShoppingListRecord? { store.lists.first { $0.id == selectedID } ?? store.lists.first }
    private var products: [ShoppingProduct] { store.products.filter { $0.listID == selected?.id } }
    private var remaining: Int { products.filter { !$0.purchased }.count }
    private var filtered: [ShoppingProduct] {
        let matches = products.filter {
            (filter == "all" || (filter == "purchased" ? $0.purchased : !$0.purchased))
            && (query.isEmpty || "\($0.name) \($0.quantityLabel) \($0.notes)".localizedCaseInsensitiveContains(query))
        }
        return matches.filter { !$0.purchased } + matches.filter { $0.purchased }
    }
    private let ink = Color(hex: "#2d2754")
    private let green = Color(hex: "#257259")

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    heading
                    if let message = store.errorMessage {
                        Text(message).foregroundStyle(Color(hex: "#a9322b")).accessibilityAddTraits(.updatesFrequently)
                        Button("Riprova") { Task { await store.load(userID: auth.session?.user.id) } }.disabled(store.isBusy || store.isLoading)
                    }
                    if store.isLoading {
                        ProgressView("Caricamento spesa...").frame(maxWidth: .infinity)
                    } else if store.lists.isEmpty {
                        if store.errorMessage == nil {
                            Label("Crea una lista e aggiungi i primi prodotti.", systemImage: "cart")
                                .foregroundStyle(Color(hex: "#716a91"))
                        }
                    } else {
                        listPicker
                        if let selected { listContent(selected) }
                    }
                }
                .padding(16)
                .frame(maxWidth: 900)
                .frame(maxWidth: .infinity)
            }
            .background(Color(hex: "#efe8d8"))
            .foregroundStyle(ink)
            .refreshable { if !store.isBusy { await store.load(userID: auth.session?.user.id) } }
            .platformNavigationBarTitleDisplayMode()
            .toolbar {
                ToolbarItem(placement: .akLeading) {
                    Button(action: onBack) { Image(systemName: "chevron.left") }.accessibilityLabel("Dashboard")
                }
                ToolbarItem(placement: .principal) { Text("SPESA").font(.headline.weight(.black)) }
                ToolbarItem(placement: .akTrailing) {
                    Button { editor = .list(nil) } label: { Image(systemName: "plus") }
                        .accessibilityLabel("Nuova lista").disabled(store.isBusy || store.isLoading)
                }
            }
        }
        .task(id: auth.session?.user.id) { await store.load(userID: auth.session?.user.id) }
        .sheet(item: $editor) { value in
            switch value {
            case .list(let list):
                ShoppingListEditor(list: list) { title in
                    let id = try await store.saveList(id: list?.id, title: title)
                    selectedID = id
                    query = ""
                    filter = "all"
                }
            case .product(let listID, let product):
                ShoppingProductEditor(product: product) { payload in
                    try await store.saveProduct(id: product?.id, listID: listID, payload: payload)
                }
            }
        }
        .alert("Eliminare \(deletion?.isList == true ? "la lista" : "il prodotto")?", isPresented: Binding(
            get: { deletion != nil }, set: { if !$0 { deletion = nil } }
        ), presenting: deletion) { target in
            Button("Annulla", role: .cancel) {}
            Button("Elimina", role: .destructive) {
                Task {
                    do { try await store.delete(id: target.id, isList: target.isList) }
                    catch { store.errorMessage = "Impossibile eliminare: \(error.localizedDescription)" }
                }
            }
        } message: { target in
            Text("\(target.title). \(target.isList ? "Verranno eliminati anche tutti i prodotti. " : "")L'operazione non può essere annullata.")
        }
        .sheet(isPresented: $showPDF, onDismiss: removeTemporaryPDF) {
            NavigationStack {
                VStack(spacing: 20) {
                    Image(systemName: "doc.richtext").font(.system(size: 44)).foregroundStyle(green)
                    Text("Lista della spesa in PDF").font(.title2.bold())
                    Text("Condividi una copia tramite WhatsApp, Telegram, email o altre app disponibili sul dispositivo.")
                        .multilineTextAlignment(.center)
                    if let pdfURL {
                        ShareLink(item: pdfURL) { Label("Condividi PDF", systemImage: "square.and.arrow.up") }
                            .buttonStyle(.borderedProminent).tint(green)
                    }
                    Button { showExporter = true } label: { Label("Salva PDF", systemImage: "arrow.down.doc") }
                    if let message = store.errorMessage { Text(message).foregroundStyle(.red) }
                }
                .padding(24)
                .toolbar { ToolbarItem(placement: .akTrailing) { Button("Chiudi") { showPDF = false } } }
                .fileExporter(isPresented: $showExporter, document: pdfDocument, contentType: .pdf, defaultFilename: "Spesa") { result in
                    if case .failure(let error) = result { store.errorMessage = "Impossibile salvare il PDF: \(error.localizedDescription)" }
                }
            }
        }
    }

    private var heading: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("LE TUE LISTE PERSONALI").font(.caption.weight(.black)).foregroundStyle(Color(hex: "#e45f4e"))
            Text("Spesa").font(.largeTitle.weight(.black))
            Text("Prodotti, quantità e note. Le stesse liste del web, sempre disponibili.")
                .font(.subheadline).foregroundStyle(Color(hex: "#716a91"))
            HStack {
                Button { editor = .list(nil) } label: { Label("Nuova lista", systemImage: "plus") }
                    .buttonStyle(.borderedProminent).tint(green).disabled(store.isBusy || store.isLoading)
                Button("Aggiorna") { Task { await store.load(userID: auth.session?.user.id) } }
                    .disabled(store.isBusy || store.isLoading)
            }
        }
        .padding(18).frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "#fff1d9")).clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private var listPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(store.lists) { list in
                    let pending = store.products.filter { $0.listID == list.id && !$0.purchased }.count
                    Button {
                        selectedID = list.id
                        query = ""
                        filter = "all"
                    } label: {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(list.title).font(.subheadline.bold()).lineLimit(2)
                            Text("\(pending) da acquistare").font(.caption)
                        }
                        .padding(14).frame(width: 190, alignment: .leading)
                        .background(selected?.id == list.id ? Color(hex: "#d9e8d9") : Color(hex: "#fff8ed"))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .buttonStyle(.plain).disabled(store.isBusy)
                    .accessibilityAddTraits(selected?.id == list.id ? .isSelected : [])
                }
            }
        }
    }

    private func listContent(_ list: ShoppingListRecord) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                Text(list.title).font(.title2.weight(.black))
                Spacer()
                Menu {
                    Button("Rinomina") { editor = .list(list) }
                    Button("Elimina lista", role: .destructive) { deletion = ShoppingDeletion(id: list.id, title: list.title, isList: true) }
                } label: { Image(systemName: "ellipsis.circle").font(.title2) }
                .accessibilityLabel("Opzioni lista").disabled(store.isBusy)
            }
            Text("\(products.count - remaining) di \(products.count) acquistati\(products.isEmpty || remaining > 0 ? "" : " · Spesa completata!")").font(.subheadline)
            ProgressView(value: Double(products.count - remaining), total: Double(max(1, products.count))).tint(green)
                .accessibilityLabel("Prodotti acquistati")
            HStack {
                Button { editor = .product(list.id, nil) } label: { Label("Prodotto", systemImage: "plus") }
                    .buttonStyle(.borderedProminent).tint(green)
                Button { exportPDF(list) } label: { Label("PDF", systemImage: "square.and.arrow.up") }
                    .buttonStyle(.bordered)
            }
            .disabled(store.isBusy || store.isLoading)
            Picker("Prodotti", selection: $filter) {
                Text("Tutti").tag("all")
                Text("Da acquistare").tag("pending")
                Text("Acquistati").tag("purchased")
            }.pickerStyle(.segmented)
            TextField("Cerca prodotti o note", text: $query).textFieldStyle(.roundedBorder)
            if filtered.isEmpty {
                Text(products.isEmpty ? "La lista è vuota. Aggiungi il primo prodotto." : "Nessun prodotto corrisponde ai filtri.")
                    .font(.subheadline).foregroundStyle(Color(hex: "#716a91")).padding(.vertical, 20)
            }
            LazyVStack(spacing: 10) {
                ForEach(filtered) { product in productRow(product) }
            }
        }
    }

    private func productRow(_ product: ShoppingProduct) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Button { Task { await store.setPurchased(product) } } label: {
                Image(systemName: product.purchased ? "checkmark.square.fill" : "square").font(.title2).foregroundStyle(green)
                    .frame(minWidth: 44, minHeight: 44)
            }
            .accessibilityLabel("\(product.purchased ? "Segna da acquistare" : "Segna acquistato"): \(product.name)")
            .accessibilityValue(product.purchased ? "Acquistato" : "Da acquistare")
            VStack(alignment: .leading, spacing: 5) {
                Text(product.name).font(.headline).strikethrough(product.purchased)
                if !product.quantityLabel.isEmpty { Text(product.quantityLabel).font(.subheadline.bold()).foregroundStyle(green) }
                if !product.notes.isEmpty { Text(product.notes).font(.subheadline).foregroundStyle(Color(hex: "#716a91")) }
                if product.purchased { Text("Acquistato").font(.caption).foregroundStyle(green) }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Menu {
                Button("Modifica") { editor = .product(product.listID, product) }
                Button("Elimina", role: .destructive) { deletion = ShoppingDeletion(id: product.id, title: product.name, isList: false) }
            } label: { Image(systemName: "ellipsis").frame(minWidth: 44, minHeight: 44) }
            .accessibilityLabel("Opzioni \(product.name)")
        }
        .buttonStyle(.plain).disabled(store.isBusy || store.isLoading)
        .padding(12).background(product.purchased ? Color(hex: "#eef3e9") : Color(hex: "#fff8ed"))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func exportPDF(_ list: ShoppingListRecord) {
        do {
            let data = try ShoppingPDF.create(list: list, products: products)
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("Spesa-\(UUID().uuidString).pdf")
            try data.write(to: url, options: .atomic)
            pdfURL = url
            pdfDocument = ShoppingPDFDocument(data: data)
            store.errorMessage = nil
            showPDF = true
        } catch { store.errorMessage = "Impossibile creare il PDF: \(error.localizedDescription)" }
    }

    private func removeTemporaryPDF() {
        guard let pdfURL else { return }
        do { try FileManager.default.removeItem(at: pdfURL) }
        catch { store.errorMessage = "Impossibile rimuovere il PDF temporaneo: \(error.localizedDescription)" }
        self.pdfURL = nil
        pdfDocument = nil
    }
}

private struct ShoppingListEditor: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title: String
    @State private var busy = false
    @State private var errorMessage: String?
    let list: ShoppingListRecord?
    let onSave: (String) async throws -> Void

    init(list: ShoppingListRecord?, onSave: @escaping (String) async throws -> Void) {
        self.list = list
        self.onSave = onSave
        _title = State(initialValue: list?.title ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Nome della lista") { TextField("Es. Spesa della settimana", text: $title).disabled(busy) }
                if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
            }
            .navigationTitle(list == nil ? "Nuova lista" : "Rinomina lista")
            .toolbar {
                ToolbarItem(placement: .akLeading) { Button("Annulla") { dismiss() }.disabled(busy) }
                ToolbarItem(placement: .akTrailing) {
                    Button(busy ? "Salvataggio..." : "Salva") {
                        busy = true
                        Task {
                            do { try await onSave(title); dismiss() }
                            catch { errorMessage = error.localizedDescription }
                            busy = false
                        }
                    }.disabled(busy)
                }
            }
        }
        .interactiveDismissDisabled(busy)
    }
}

private struct ShoppingProductEditor: View {
    @Environment(\.dismiss) private var dismiss
    let product: ShoppingProduct?
    let onSave: (ShoppingProductPayload) async throws -> Void
    @State private var name: String
    @State private var amount: String
    @State private var unit: ShoppingUnit
    @State private var notes: String
    @State private var busy = false
    @State private var errorMessage: String?

    init(product: ShoppingProduct?, onSave: @escaping (ShoppingProductPayload) async throws -> Void) {
        self.product = product
        self.onSave = onSave
        _name = State(initialValue: product?.name ?? "")
        _amount = State(initialValue: product.map { $0.quantityValue.map { NSDecimalNumber(decimal: $0).stringValue.replacingOccurrences(of: ".", with: ",") } ?? "" } ?? "1")
        _unit = State(initialValue: product?.quantityUnit ?? .pieces)
        _notes = State(initialValue: product?.notes ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Prodotto") { TextField("Es. Latte", text: $name) }
                Section("Quantità") {
                    if let product, product.quantityValue == nil {
                        Text("Quantità precedente: \(product.quantity.isEmpty ? "non indicata" : product.quantity). Inserisci numero e unità per salvare.")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    HStack(alignment: .top, spacing: 16) {
                        VStack(alignment: .leading) {
                            Text("Quantità").font(.caption)
                            #if os(iOS)
                            TextField("Numero", text: $amount).keyboardType(.decimalPad).textFieldStyle(.roundedBorder)
                            #else
                            TextField("Numero", text: $amount).textFieldStyle(.roundedBorder)
                            #endif
                        }
                        VStack(alignment: .leading) {
                            Text("Unità").font(.caption)
                            Picker("Unità", selection: $unit) { ForEach(ShoppingUnit.allCases) { Text($0.label).tag($0) } }
                                .labelsHidden().pickerStyle(.menu)
                        }
                    }
                    Text("Numero positivo, fino a 3 decimali.").font(.caption).foregroundStyle(.secondary)
                }
                Section("Note (facoltative)") { TextEditor(text: $notes).frame(minHeight: 100) }
                if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
            }
            .disabled(busy)
            .navigationTitle(product == nil ? "Nuovo prodotto" : "Modifica prodotto")
            .toolbar {
                ToolbarItem(placement: .akLeading) { Button("Annulla") { dismiss() }.disabled(busy) }
                ToolbarItem(placement: .akTrailing) {
                    Button(busy ? "Salvataggio..." : "Salva") {
                        busy = true
                        errorMessage = nil
                        Task {
                            do {
                                let payload = try ShoppingValidation.product(name: name, amount: amount, unit: unit, notes: notes)
                                try await onSave(payload)
                                dismiss()
                            } catch { errorMessage = error.localizedDescription }
                            busy = false
                        }
                    }.disabled(busy)
                }
            }
        }
        .interactiveDismissDisabled(busy)
    }
}
