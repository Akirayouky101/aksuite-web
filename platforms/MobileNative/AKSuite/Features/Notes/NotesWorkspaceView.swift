import SwiftUI
import UniformTypeIdentifiers

private struct NativeNote: Codable, Identifiable, Equatable {
    let id: UUID
    var title: String
    var content: String?
    var tags: [String]
    var isPinned: Bool
    var folder: String
    var color: String
    var reminderAt: String?
    var recurrenceType: String?
    var updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id, title, content, tags, folder, color
        case isPinned = "is_pinned"
        case reminderAt = "reminder_at"
        case recurrenceType = "recurrence_type"
        case updatedAt = "updated_at"
    }
}

private struct NativeNotePayload: Encodable {
    let title: String
    let content: String
    let tags: [String]
    let isPinned: Bool
    let folder: String
    let color: String
    let reminderAt: String?
    let recurrenceType: String?
    var userID: UUID?

    enum CodingKeys: String, CodingKey {
        case title, content, tags, folder, color
        case isPinned = "is_pinned"
        case reminderAt = "reminder_at"
        case recurrenceType = "recurrence_type"
        case userID = "user_id"
    }
}

private struct NativeAttachment: Codable, Identifiable {
    let id: UUID
    let storagePath: String
    let fileName: String
    enum CodingKeys: String, CodingKey { case id; case storagePath = "storage_path"; case fileName = "file_name" }
}

struct NotesWorkspaceView: View {
    @EnvironmentObject private var auth: AuthViewModel
    let initialNoteID: UUID?
    let onBack: () -> Void
    @State private var notes: [NativeNote] = []
    @State private var query = ""
    @State private var selectedFolder = "all"
    @State private var showPinnedOnly = false
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showNewNote = false
    @State private var editingNote: NativeNote?
    @State private var selectedNote: NativeNote?
    @State private var noteToDelete: NativeNote?

    init(initialNoteID: UUID? = nil, onBack: @escaping () -> Void) {
        self.initialNoteID = initialNoteID
        self.onBack = onBack
    }

    private var folders: [String] { ["all"] + Array(Set(notes.map(\.folder))).sorted() }
    private var filteredNotes: [NativeNote] {
        notes.filter { note in
            (query.isEmpty || "\(note.title) \(note.content ?? "") \(note.tags.joined(separator: " "))".localizedCaseInsensitiveContains(query)) &&
            (selectedFolder == "all" || note.folder == selectedFolder) &&
            (!showPinnedOnly || note.isPinned)
        }
        .sorted { ($0.isPinned ? 0 : 1, $0.updatedAt) < ($1.isPinned ? 0 : 1, $1.updatedAt) }
    }

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#efe8d8").ignoresSafeArea()
                if isLoading { ProgressView("Caricamento note...") } else { content }
            }
            .platformNavigationBarTitleDisplayMode()
            .toolbar {
                ToolbarItem(placement: .akLeading) { Button(action: onBack) { Image(systemName: "chevron.left") }.accessibilityLabel("Dashboard") }
                ToolbarItem(placement: .principal) { Text("NOTE").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")) }
                ToolbarItem(placement: .akTrailing) { Button { showNewNote = true } label: { Image(systemName: "plus") }.accessibilityLabel("Nuova nota") }
            }
        }
        .task { await loadNotes() }
        .overlay {
            if showNewNote {
                NoteEditorView(note: nil, onClose: { withAnimation(.easeOut(duration: 0.2)) { showNewNote = false } }, onSave: saveNote)
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            } else if let note = editingNote {
                NoteEditorView(note: note, onClose: { withAnimation(.easeOut(duration: 0.2)) { editingNote = nil } }, onSave: saveNote)
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            } else if let note = selectedNote {
                NoteSummaryView(note: note, onClose: { withAnimation(.easeOut(duration: 0.2)) { selectedNote = nil } }, onEdit: {
                    selectedNote = nil
                    editingNote = note
                })
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            }
        }
        .confirmationDialog("Eliminare questa nota?", isPresented: Binding(get: { noteToDelete != nil }, set: { if !$0 { noteToDelete = nil } }), titleVisibility: .visible) {
            Button("Elimina", role: .destructive) { if let note = noteToDelete { Task { await delete(note) } } }
        } message: { Text(noteToDelete?.title ?? "") }
    }

    private var content: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 15) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("APPUNTI E PROMEMORIA").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#e45f4e"))
                    Text("Note Manager").font(.title2.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                    Text("\(filteredNotes.count) \(filteredNotes.count == 1 ? "nota" : "note")").font(.caption).foregroundStyle(Color(hex: "#716a91"))
                }
                .padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Color(hex: "#f8dfb9")).clipShape(RoundedRectangle(cornerRadius: 20))

                HStack(spacing: 9) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Color(hex: "#8a7f9f"))
                    TextField("Cerca nelle note...", text: $query).platformNoAutocapitalization()
                    Menu { Picker("Cartella", selection: $selectedFolder) { ForEach(folders, id: \.self) { folder in Text(folder == "all" ? "Tutte" : folder.capitalized).tag(folder) } } } label: { Image(systemName: "folder").foregroundStyle(Color(hex: "#716a91")) }
                    Button { showPinnedOnly.toggle() } label: { Image(systemName: showPinnedOnly ? "pin.fill" : "pin").foregroundStyle(showPinnedOnly ? Color(hex: "#e45f4e") : Color(hex: "#716a91")) }
                }
                .padding(13).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 14))

                if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                if filteredNotes.isEmpty { emptyState } else {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(filteredNotes) { note in NoteCard(note: note, onOpen: { withAnimation(.spring(response: 0.34, dampingFraction: 0.82)) { selectedNote = note } }, onEdit: { withAnimation(.spring(response: 0.34, dampingFraction: 0.82)) { editingNote = note } }, onDelete: { noteToDelete = note }, onTogglePin: { Task { await togglePin(note) } }) }
                    }
                }
            }
            .padding(16)
        }
        .refreshable { await loadNotes() }
    }

    private var emptyState: some View {
        VStack(spacing: 9) {
            Image(systemName: "note.text.badge.plus").font(.system(size: 32)).foregroundStyle(Color(hex: "#e45f4e"))
            Text("Nessuna nota trovata").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
            Button("Nuova nota") { showNewNote = true }.font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#c75143"))
        }.frame(maxWidth: .infinity).padding(30).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private func loadNotes() async {
        isLoading = true; defer { isLoading = false }
        do {
            notes = try await SupabaseService.shared.from("notes").select().order("is_pinned", ascending: false).order("updated_at", ascending: false).execute().value
            if let initialNoteID, let note = notes.first(where: { $0.id == initialNoteID }) { selectedNote = note }
        }
        catch { errorMessage = "Impossibile caricare le note." }
    }

    private func saveNote(_ payload: NativeNotePayload, _ existing: NativeNote?) async throws {
        if let existing {
            let updated: NativeNote = try await SupabaseService.shared.from("notes").update(payload).eq("id", value: existing.id.uuidString).select().single().execute().value
            notes = notes.map { $0.id == updated.id ? updated : $0 }
            scheduleReminder(for: updated)
        } else {
            guard let userID = auth.session?.user.id else { throw NoteSaveError.missingAuthenticatedUser }
            var insertPayload = payload; insertPayload.userID = userID
            let created: NativeNote = try await SupabaseService.shared.from("notes").insert(insertPayload).select().single().execute().value
            notes.insert(created, at: 0)
            scheduleReminder(for: created)
        }
    }

    private func scheduleReminder(for note: NativeNote) {
        guard let manager = PushNotificationManager.shared else { return }
        guard let reminderAt = note.reminderAt,
              let date = ISO8601DateFormatter().date(from: reminderAt),
              date > .now else {
            manager.cancelNote(noteID: note.id)
            return
        }
        manager.scheduleNote(noteID: note.id, title: note.title, date: date)
    }

    private func togglePin(_ note: NativeNote) async {
        do { let updated: NativeNote = try await SupabaseService.shared.from("notes").update(["is_pinned": !note.isPinned]).eq("id", value: note.id.uuidString).select().single().execute().value; notes = notes.map { $0.id == updated.id ? updated : $0 } }
        catch { errorMessage = "Impossibile aggiornare la nota." }
    }

    private func delete(_ note: NativeNote) async {
        do { try await SupabaseService.shared.from("notes").delete().eq("id", value: note.id.uuidString).execute(); PushNotificationManager.shared?.cancelNote(noteID: note.id); notes.removeAll { $0.id == note.id } }
        catch { errorMessage = "Impossibile eliminare la nota." }
    }
}

private enum NoteSaveError: Error { case missingAuthenticatedUser }

private struct NoteCard: View {
    let note: NativeNote
    let onOpen: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    let onTogglePin: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(alignment: .top) {
                Text(note.title).font(.subheadline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")).lineLimit(2)
                Spacer(minLength: 0)
                if note.isPinned { Image(systemName: "pin.fill").font(.caption).foregroundStyle(Color(hex: "#e45f4e")) }
                if note.reminderAt != nil { Image(systemName: "bell.fill").font(.caption).foregroundStyle(Color(hex: "#e45f4e")) }
            }
            Text(note.content?.isEmpty == false ? note.content! : "Nessun contenuto").font(.caption).foregroundStyle(Color(hex: "#514b70")).lineLimit(4)
            if !note.tags.isEmpty { Text(note.tags.map { "#\($0)" }.joined(separator: " ")).font(.caption2).foregroundStyle(Color(hex: "#716a91")).lineLimit(1) }
            Spacer(minLength: 0)
            HStack {
                Text(note.folder.capitalized).font(.caption2.weight(.bold)).foregroundStyle(Color(hex: "#716a91"))
                Spacer()
                Menu { Button(note.isPinned ? "Rimuovi evidenza" : "Fissa nota", action: onTogglePin); Button("Modifica", action: onEdit); Button("Elimina", role: .destructive, action: onDelete) } label: { Image(systemName: "ellipsis") }.foregroundStyle(Color(hex: "#716a91"))
            }
        }
        .padding(14).frame(maxWidth: .infinity, minHeight: 170, alignment: .topLeading).background(cardColor)
        .overlay(RoundedRectangle(cornerRadius: 15).stroke(borderColor, lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 15))
        .contentShape(RoundedRectangle(cornerRadius: 15))
        .onTapGesture(perform: onOpen)
    }

    private var cardColor: Color { ["blue": "#dfefff", "green": "#e3f6ea", "yellow": "#fff3c9", "red": "#ffe1da", "purple": "#ece3ff", "pink": "#fce2ef", "orange": "#ffe5c9", "gray": "#f1f3f5"][note.color].map(Color.init(hex:)) ?? Color(hex: "#dfefff") }
    private var borderColor: Color { ["blue": "#a9cff2", "green": "#a9dcc0", "yellow": "#eccf7a", "red": "#f0aa9b", "purple": "#c6b4f2", "pink": "#efb5d1", "orange": "#efc183", "gray": "#ced4da"][note.color].map(Color.init(hex:)) ?? Color(hex: "#a9cff2") }
}

private struct NoteSummaryView: View {
    let note: NativeNote
    let onClose: () -> Void
    let onEdit: () -> Void

    var body: some View {
        ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "note.text")
                            .font(.headline).foregroundStyle(Color(hex: "#e45f4e"))
                            .frame(width: 42, height: 42).background(Color.white.opacity(0.64)).clipShape(RoundedRectangle(cornerRadius: 13))
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 7) {
                                Text(note.title).font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")).lineLimit(2)
                                if note.isPinned { Image(systemName: "pin.fill").font(.caption).foregroundStyle(Color(hex: "#e45f4e")) }
                            }
                            Text(note.folder.capitalized).font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#716a91"))
                        }
                        Spacer(minLength: 0)
                        Button(action: onClose) { Image(systemName: "xmark").foregroundStyle(Color(hex: "#8a7f9f")).frame(width: 36, height: 36).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 11)) }.accessibilityLabel("Chiudi")
                    }
                    .padding(20).background(noteBackground)

                    VStack(alignment: .leading, spacing: 18) {
                        VStack(alignment: .leading, spacing: 8) {
                            Label("CONTENUTO", systemImage: "text.alignleft").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                            Text(note.content?.isEmpty == false ? note.content! : "Nessun contenuto")
                                .font(.body).foregroundStyle(Color(hex: "#514b70")).frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(16).background(Color(hex: "#fff8ed")).overlay(RoundedRectangle(cornerRadius: 14).stroke(noteBorder, lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 14))

                        if !note.tags.isEmpty {
                            VStack(alignment: .leading, spacing: 9) {
                                Label("TAG", systemImage: "tag").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                                FlowTags(tags: note.tags)
                            }
                        }

                        Label("Aggiornata \(formattedDate)", systemImage: "clock")
                            .font(.caption).foregroundStyle(Color(hex: "#8a7f9f"))

                        Button(action: onEdit) {
                            Label("Modifica nota", systemImage: "pencil")
                                .font(.subheadline.weight(.bold)).foregroundStyle(Color.white).frame(maxWidth: .infinity).padding(.vertical, 15)
                                .background(LinearGradient(colors: [Color(hex: "#e95d50"), Color(hex: "#efa633")], startPoint: .leading, endPoint: .trailing)).clipShape(RoundedRectangle(cornerRadius: 13))
                        }
                    }
                    .padding(20)
                }
                .background(Color(hex: "#fffdf9")).clipShape(RoundedRectangle(cornerRadius: 24)).padding(16)
            }
        .frame(maxHeight: 620)
    }

    private var formattedDate: String { (ISO8601DateFormatter().date(from: note.updatedAt) ?? .now).formatted(.dateTime.day().month(.wide).year().hour().minute()) }
    private var noteBackground: Color { ["blue": "#dfefff", "green": "#e3f6ea", "yellow": "#fff3c9", "red": "#ffe1da", "purple": "#ece3ff", "pink": "#fce2ef", "orange": "#ffe5c9", "gray": "#f1f3f5"][note.color].map(Color.init(hex:)) ?? Color(hex: "#dfefff") }
    private var noteBorder: Color { ["blue": "#a9cff2", "green": "#a9dcc0", "yellow": "#eccf7a", "red": "#f0aa9b", "purple": "#c6b4f2", "pink": "#efb5d1", "orange": "#efc183", "gray": "#ced4da"][note.color].map(Color.init(hex:)) ?? Color(hex: "#a9cff2") }
}

private struct FlowTags: View {
    let tags: [String]

    var body: some View {
        HStack(spacing: 7) {
            ForEach(tags, id: \.self) { tag in
                Text("#\(tag)").font(.caption.weight(.medium)).foregroundStyle(Color(hex: "#716a91")).padding(.horizontal, 9).padding(.vertical, 5).background(Color(hex: "#f8e8cf")).clipShape(Capsule())
            }
        }
    }
}

private struct NoteEditorView: View {
    @EnvironmentObject private var auth: AuthViewModel
    let note: NativeNote?
    let onClose: () -> Void
    let onSave: (NativeNotePayload, NativeNote?) async throws -> Void
    @State private var title = ""
    @State private var content = ""
    @State private var folder = "general"
    @State private var isPinned = false
    @State private var color = "blue"
    @State private var tagsText = ""
    @State private var hasReminder = false
    @State private var reminderDate = Date.now.addingTimeInterval(60 * 60)
    @State private var recurrenceType = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var attachments: [NativeAttachment] = []
    @State private var showFileImporter = false
    @State private var isUploading = false
    private let folders = ["general", "work", "personal", "ideas", "projects", "meeting-notes", "recipes", "other"]
    private let colors = ["blue", "green", "yellow", "red", "purple", "pink", "orange", "gray"]

    var body: some View {
        VStack(spacing: 0) {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 0) {
                        header
                        VStack(alignment: .leading, spacing: 17) {
                            field("Titolo *") { TextField("Inserisci il titolo della nota...", text: $title) }
                            field("Contenuto") { TextField("Scrivi qui il contenuto della nota...", text: $content, axis: .vertical).lineLimit(7...10) }
                            HStack(alignment: .top, spacing: 12) {
                                VStack(alignment: .leading, spacing: 7) { label("Cartella", icon: "folder"); Picker("", selection: $folder) { ForEach(folders, id: \.self) { Text($0.capitalized).tag($0) } }.labelsHidden().pickerStyle(.menu).noteControlStyle() }
                                VStack(alignment: .leading, spacing: 7) { label("In evidenza", icon: "pin"); Toggle("Fissata", isOn: $isPinned).tint(Color(hex: "#e45f4e")).frame(height: 42) }
                            }
                            VStack(alignment: .leading, spacing: 9) { label("Colore", icon: "paintpalette"); HStack(spacing: 9) { ForEach(colors, id: \.self) { item in Button { color = item } label: { Circle().fill(colorValue(item)).frame(width: 29, height: 29).overlay { if color == item { Image(systemName: "checkmark").font(.caption2.weight(.black)).foregroundStyle(.white) } } }.buttonStyle(.plain) } } }
                            VStack(alignment: .leading, spacing: 9) {
                                label("Promemoria", icon: "bell")
                                HStack(spacing: 10) {
                                    Button { hasReminder.toggle() } label: {
                                        Image(systemName: hasReminder ? "bell.fill" : "bell")
                                            .foregroundStyle(hasReminder ? Color(hex: "#e45f4e") : Color(hex: "#716a91"))
                                            .frame(width: 42, height: 42)
                                            .background(hasReminder ? Color(hex: "#ffe1da") : Color(hex: "#fae9ce"))
                                            .clipShape(RoundedRectangle(cornerRadius: 12))
                                    }
                                    .accessibilityLabel(hasReminder ? "Disattiva promemoria" : "Attiva promemoria")
                                    if hasReminder { DatePicker("", selection: $reminderDate, in: Date.now..., displayedComponents: [.date, .hourAndMinute]).labelsHidden() }
                                    else { Text("Tocca la campanella per attivarlo").font(.caption).foregroundStyle(Color(hex: "#716a91")) }
                                }
                                if hasReminder { Picker("Ripetizione", selection: $recurrenceType) { Text("Non ripetere").tag(""); Text("Ogni giorno").tag("daily"); Text("Ogni settimana").tag("weekly"); Text("Ogni mese").tag("monthly"); Text("Ogni anno").tag("yearly") }.pickerStyle(.menu) }
                            }
                            field("Tag separati da virgola", icon: "tag") { TextField("Lavoro, urgente, idee", text: $tagsText) }
                            if let note { attachmentSection(note) }
                            if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                        }.padding(20)
                    }
                }
                Button { Task { await submit() } } label: { Text(isSaving ? "Salvataggio..." : note == nil ? "Salva Nota" : "Aggiorna Nota").font(.subheadline.weight(.bold)).frame(maxWidth: .infinity).padding(.vertical, 15).foregroundStyle(.white).background(LinearGradient(colors: [Color(hex: "#e95d50"), Color(hex: "#efa633")], startPoint: .leading, endPoint: .trailing)).clipShape(RoundedRectangle(cornerRadius: 13)) }.disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSaving).opacity(title.trimmingCharacters(in: .whitespaces).isEmpty ? 0.55 : 1).padding(.horizontal, 32).padding(.vertical, 14).background(Color(hex: "#fffdf9"))
            }
        .frame(maxHeight: 680)
        .background(Color(hex: "#fffdf9"))
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .onAppear(perform: loadNote)
        .fileImporter(isPresented: $showFileImporter, allowedContentTypes: [.image, .pdf, .text, .data]) { result in
            guard case let .success(url) = result else { return }
            Task { await uploadAttachment(url) }
        }
    }

    private var header: some View { HStack(spacing: 12) { Image(systemName: "note.text").foregroundStyle(.white).frame(width: 42, height: 42).background(LinearGradient(colors: [Color(hex: "#e95d50"), Color(hex: "#efa633")], startPoint: .topLeading, endPoint: .bottomTrailing)).clipShape(RoundedRectangle(cornerRadius: 13)); VStack(alignment: .leading, spacing: 2) { Text(note == nil ? "Nuova Nota" : "Modifica Nota").font(.system(size: 19, weight: .black)).foregroundStyle(Color(hex: "#2d2754")); Text("Appunti e promemoria").font(.system(size: 12)).foregroundStyle(Color(hex: "#8a7f9f")) }; Spacer(); Button(action: onClose) { Image(systemName: "xmark").foregroundStyle(Color(hex: "#8a7f9f")).frame(width: 36, height: 36).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 11)) } }.padding(18).overlay(alignment: .bottom) { Rectangle().fill(Color(hex: "#ead8bf")).frame(height: 1) } }
    private func label(_ title: String, icon: String? = nil) -> some View { Group { if let icon { Label(title.uppercased(), systemImage: icon) } else { Text(title.uppercased()) } }.font(.system(size: 11, weight: .medium)).foregroundStyle(Color(hex: "#8a7f9f")) }
    private func field<Content: View>(_ title: String, icon: String? = nil, @ViewBuilder content: () -> Content) -> some View { VStack(alignment: .leading, spacing: 7) { label(title, icon: icon); content().noteControlStyle() } }
    private func loadNote() { guard let note else { return }; title = note.title; content = note.content ?? ""; folder = note.folder; isPinned = note.isPinned; color = note.color; tagsText = note.tags.joined(separator: ", "); recurrenceType = note.recurrenceType ?? ""; if let reminderAt = note.reminderAt, let date = ISO8601DateFormatter().date(from: reminderAt) { hasReminder = true; reminderDate = date }; loadAttachments(for: note) }
    private func submit() async { isSaving = true; defer { isSaving = false }; let tags = tagsText.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }; let payload = NativeNotePayload(title: title.trimmingCharacters(in: .whitespaces), content: content.trimmingCharacters(in: .whitespaces), tags: tags, isPinned: isPinned, folder: folder, color: color, reminderAt: hasReminder ? ISO8601DateFormatter().string(from: reminderDate) : nil, recurrenceType: hasReminder && !recurrenceType.isEmpty ? recurrenceType : nil, userID: nil); do { try await onSave(payload, note); onClose() } catch { errorMessage = "Impossibile salvare la nota." } }
    private func attachmentSection(_ note: NativeNote) -> some View { VStack(alignment: .leading, spacing: 8) { HStack { label("Allegati", icon: "paperclip"); Spacer(); Button { showFileImporter = true } label: { Image(systemName: "plus") }.disabled(isUploading) }; if attachments.isEmpty { Text("Nessun allegato").font(.caption).foregroundStyle(Color(hex: "#716a91")) } else { ForEach(attachments) { attachment in HStack { Image(systemName: "doc"); Text(attachment.fileName).font(.caption).lineLimit(1); Spacer(); Button(role: .destructive) { Task { await removeAttachment(attachment) } } label: { Image(systemName: "trash") } } } } }.padding(12).background(Color(hex: "#fae9ce")).clipShape(RoundedRectangle(cornerRadius: 12)) }
    private func loadAttachments(for note: NativeNote) { Task { attachments = (try? await SupabaseService.shared.from("item_attachments").select().eq("entity_type", value: "note").eq("entity_id", value: note.id.uuidString).execute().value) ?? [] } }
    private func uploadAttachment(_ url: URL) async { guard let note, let userID = auth.session?.user.id else { return }; isUploading = true; defer { isUploading = false }; let accessed = url.startAccessingSecurityScopedResource(); defer { if accessed { url.stopAccessingSecurityScopedResource() } }; do { let data = try Data(contentsOf: url); let path = "\(userID.uuidString)/note/\(note.id.uuidString)/\(UUID().uuidString)-\(url.lastPathComponent)"; try await SupabaseService.shared.storage.from("attachments").upload(path, data: data); try await SupabaseService.shared.from("item_attachments").insert(["user_id": userID.uuidString, "entity_type": "note", "entity_id": note.id.uuidString, "storage_path": path, "file_name": url.lastPathComponent, "size_bytes": String(data.count)]).execute(); loadAttachments(for: note) } catch { errorMessage = "Impossibile caricare l'allegato." } }
    private func removeAttachment(_ attachment: NativeAttachment) async { do { try await SupabaseService.shared.storage.from("attachments").remove(paths: [attachment.storagePath]); try await SupabaseService.shared.from("item_attachments").delete().eq("id", value: attachment.id.uuidString).execute(); attachments.removeAll { $0.id == attachment.id } } catch { errorMessage = "Impossibile eliminare l'allegato." } }
    private func colorValue(_ value: String) -> Color { ["blue": "#3b82f6", "green": "#10b981", "yellow": "#f59e0b", "red": "#ef4444", "purple": "#8b5cf6", "pink": "#ec4899", "orange": "#f97316", "gray": "#94a3b8"][value].map(Color.init(hex:)) ?? Color(hex: "#3b82f6") }
}

private extension View { func noteControlStyle() -> some View { self.font(.system(size: 15)).foregroundStyle(Color(hex: "#2d2754")).padding(.horizontal, 12).padding(.vertical, 10).frame(maxWidth: .infinity, alignment: .leading).background(Color(hex: "#fae9ce")).overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#e6d3b6"), lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 12)) } }