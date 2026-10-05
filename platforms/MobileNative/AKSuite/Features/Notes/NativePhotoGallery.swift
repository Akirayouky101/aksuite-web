import SwiftUI
import PhotosUI
import Supabase

struct NativePhotoGallery: View {
    struct Photo: Codable, Identifiable {
        let id: UUID
        let storagePath: String
        let fileName: String
        let createdAt: String
        enum CodingKeys: String, CodingKey {
            case id; case storagePath = "storage_path"; case fileName = "file_name"; case createdAt = "created_at"
        }
    }
    private struct Metadata: Encodable {
        let id: UUID
        let user_id: UUID
        let storage_path: String
        let file_name: String
        let content_type = "image/jpeg"
        let size_bytes: Int
        let note_id: UUID?
        let work_item_id: UUID?
        let checklist_entry_id: String?
    }
    var noteID: UUID? = nil
    var workItemID: UUID? = nil
    var entryID: String? = nil
    @EnvironmentObject private var auth: AuthViewModel
    @State private var rows: [Photo] = []
    @State private var urls: [UUID: URL] = [:]
    @State private var picked: PhotosPickerItem?
    @State private var preview: Photo?
    @State private var deleting: Photo?
    @State private var name = ""
    @State private var searchedName = ""
    @State private var filterDates = false
    @State private var from = Date.now
    @State private var until = Date.now
    @State private var searchedDates: (Date?, Date?) = (nil, nil)
    @State private var busy = false
    @State private var error: String?
    @State private var more = false
    @State private var started = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Galleria foto").font(.headline)
            Text("Foto private su Supabase. Massimo 10 MB, 5 alla volta su richiesta. Le foto del dispositivo vengono convertite in JPEG.").font(.caption)
            if noteID == nil && workItemID == nil {
                TextField("Cerca nome foto", text: $name).textFieldStyle(.roundedBorder)
                Toggle("Filtra per data", isOn: $filterDates)
                if filterDates {
                    DatePicker("Dal", selection: $from, displayedComponents: .date)
                    DatePicker("Al", selection: $until, displayedComponents: .date)
                }
            }
            HStack {
                Button(busy ? "Caricamento..." : "Carica / cerca foto") { Task { await load() } }.disabled(busy)
                Spacer()
                PhotosPicker(selection: $picked, matching: .images) { Label("Aggiungi", systemImage: "photo.badge.plus") }.disabled(busy)
            }
            if let error { Text(error).foregroundStyle(.red).font(.caption) }
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 130))]) {
                ForEach(rows) { photo in
                    VStack {
                        Button { preview = photo } label: {
                            AsyncImage(url: urls[photo.id]) { phase in
                                switch phase {
                                case .success(let image): image.resizable().scaledToFill()
                                case .failure: Text("Anteprima scaduta. Aggiorna.").font(.caption)
                                default: ProgressView()
                                }
                            }.frame(height: 110).clipped()
                        }
                        Text(photo.fileName).font(.caption).lineLimit(1)
                        Button("Elimina", role: .destructive) { deleting = photo }.disabled(busy)
                    }
                }
            }
            if started && rows.isEmpty { Text("Nessuna foto trovata.").font(.caption) }
            if more { Button("Carica altre 5") { Task { await load(next: true) } }.disabled(busy) }
        }
        .padding(12).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 12))
        .onChange(of: picked) { item in if let item { Task { await upload(item) } } }
        .sheet(item: $preview) { photo in
            NavigationStack {
                AsyncImage(url: urls[photo.id]) { phase in
                    if let image = phase.image { image.resizable().scaledToFit() }
                    else if phase.error != nil { Text("Anteprima non disponibile. Aggiorna la galleria.") }
                    else { ProgressView() }
                }.padding().toolbar { ToolbarItem(placement: .akTrailing) { Button("Chiudi") { preview = nil } } }
            }
        }
        .confirmationDialog("Eliminare definitivamente la foto?", isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } })) {
            Button("Elimina", role: .destructive) { if let photo = deleting { Task { await remove(photo) } } }
        }
    }

    @MainActor private func fetch(next: Bool, resetFilters: Bool) async throws {
        let owner = auth.session?.user.id
        guard owner != nil else { throw NativeIntegrationError.message("Accedi per leggere le foto.") }
        let term = resetFilters ? name.trimmingCharacters(in: .whitespacesAndNewlines) : searchedName
        var dates = searchedDates
        if resetFilters {
            dates = filterDates ? (NativeDates.romeCalendar.startOfDay(for: from), NativeDates.romeCalendar.date(byAdding: .day, value: 1, to: NativeDates.romeCalendar.startOfDay(for: until))) : (nil, nil)
        }
        if let start = dates.0, let end = dates.1, end <= start { throw NativeIntegrationError.message("Intervallo date non valido.") }
        var query = SupabaseService.shared.from("photo_assets").select("id,storage_path,file_name,created_at")
        if let noteID { query = query.eq("note_id", value: noteID.uuidString) }
        if let workItemID {
            query = query.eq("work_item_id", value: workItemID.uuidString)
            if let entryID { query = query.eq("checklist_entry_id", value: entryID) }
            else { query = query.is("checklist_entry_id", value: nil) }
        }
        if !term.isEmpty {
            let escaped = term.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "%", with: "\\%").replacingOccurrences(of: "_", with: "\\_")
            query = query.ilike("file_name", pattern: "%\(escaped)%")
        }
        if let start = dates.0 { query = query.gte("created_at", value: ISO8601DateFormatter().string(from: start)) }
        if let end = dates.1 { query = query.lt("created_at", value: ISO8601DateFormatter().string(from: end)) }
        if next, let last = rows.last { query = query.or("created_at.lt.\(last.createdAt),and(created_at.eq.\(last.createdAt),id.lt.\(last.id.uuidString))") }
        let page: [Photo] = try await query.order("created_at", ascending: false).order("id", ascending: false).limit(6).execute().value
        var signed: [UUID: URL] = [:]
        for photo in page.prefix(5) {
            signed[photo.id] = try await SupabaseService.shared.storage.from("photos").createSignedURL(path: photo.storagePath, expiresIn: 3600)
        }
        guard auth.session?.user.id == owner else { return }
        rows = (next ? rows : []) + Array(page.prefix(5))
        urls = next ? urls.merging(signed, uniquingKeysWith: { _, new in new }) : signed
        searchedName = term; searchedDates = dates; more = page.count > 5; started = true
    }

    @MainActor private func load(next: Bool = false) async {
        guard !busy else { return }
        busy = true; error = nil; defer { busy = false }
        do { try await fetch(next: next, resetFilters: !next) }
        catch { self.error = error.localizedDescription }
    }

    @MainActor private func upload(_ item: PhotosPickerItem) async {
        guard !busy else { return }
        busy = true; error = nil; defer { busy = false; picked = nil }
        do {
            guard let owner = auth.session?.user.id else { throw NativeIntegrationError.message("Accedi per caricare foto.") }
            guard let original = try await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: original), let data = image.jpegData(compressionQuality: 0.85) else {
                throw NativeIntegrationError.message("Impossibile convertire la foto in JPEG.")
            }
            guard !data.isEmpty && data.count <= 10485760 else { throw NativeIntegrationError.message("La foto supera 10 MB. Riducila prima di caricarla.") }
            guard auth.session?.user.id == owner else { throw NativeIntegrationError.message("L'account è cambiato. Riprova.") }
            let id = UUID()
            let path = "\(owner.uuidString.lowercased())/\(id.uuidString.lowercased())"
            try await SupabaseService.shared.storage.from("photos").upload(path: path, file: data, options: FileOptions(contentType: "image/jpeg"))
            do {
                try await SupabaseService.shared.from("photo_assets").insert(Metadata(id: id, user_id: owner, storage_path: path, file_name: "Foto-\(id.uuidString.prefix(8)).jpg", size_bytes: data.count, note_id: noteID, work_item_id: workItemID, checklist_entry_id: entryID)).execute()
            } catch {
                let metadataError = error
                do { try await SupabaseService.shared.storage.from("photos").remove(paths: [path]) }
                catch { throw NativeIntegrationError.message("Salvataggio e pulizia foto non riusciti. Contatta l'assistenza.") }
                throw metadataError
            }
            try await fetch(next: false, resetFilters: false)
        } catch { self.error = error.localizedDescription }
    }

    @MainActor private func remove(_ photo: Photo) async {
        guard !busy else { return }
        busy = true; error = nil; defer { busy = false; deleting = nil }
        do {
            try await SupabaseService.shared.storage.from("photos").remove(paths: [photo.storagePath])
            let _: Photo = try await SupabaseService.shared.from("photo_assets").delete().eq("id", value: photo.id.uuidString).select("id,storage_path,file_name,created_at").single().execute().value
            rows.removeAll { $0.id == photo.id }; urls[photo.id] = nil
        } catch { self.error = error.localizedDescription }
    }
}

struct NativeGalleryWorkspace: View {
    let onBack: () -> Void
    var body: some View {
        NavigationStack {
            ScrollView { NativePhotoGallery().padding() }.navigationTitle("Galleria foto")
                .toolbar { ToolbarItem(placement: .akLeading) { Button("Dashboard", action: onBack) } }
        }
    }
}
