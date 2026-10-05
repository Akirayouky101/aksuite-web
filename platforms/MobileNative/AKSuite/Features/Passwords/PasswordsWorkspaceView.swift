import LocalAuthentication
import SwiftUI

private struct NativePassword: Codable, Identifiable, Equatable {
    let id: UUID
    var title: String
    var username: String
    var encryptedPassword: String
    var website: String?
    var category: String
    var emoji: String
    var notes: String?
    var isFavorite: Bool
    var pinCode: String?

    enum CodingKeys: String, CodingKey {
        case id, title, username, website, category, emoji, notes
        case encryptedPassword = "encrypted_password"
        case isFavorite = "is_favorite"
        case pinCode = "pin_code"
    }

    var password: String {
        guard let data = Data(base64Encoded: encryptedPassword), let value = String(data: data, encoding: .utf8) else { return encryptedPassword }
        return value
    }
}

private struct NativePasswordPayload: Encodable {
    let title: String
    let username: String
    let encryptedPassword: String
    let website: String
    let category: String
    let emoji: String
    let notes: String
    let isFavorite: Bool
    let pinCode: String
    var userID: UUID?

    enum CodingKeys: String, CodingKey {
        case title, username, website, category, emoji, notes
        case encryptedPassword = "encrypted_password"
        case isFavorite = "is_favorite"
        case pinCode = "pin_code"
        case userID = "user_id"
    }
}

struct PasswordsWorkspaceView: View {
    @EnvironmentObject private var auth: AuthViewModel
    let initialPasswordID: UUID?
    let onBack: () -> Void
    @State private var passwords: [NativePassword] = []
    @State private var query = ""
    @State private var selectedCategory = "all"
    @State private var favoritesOnly = false
    @State private var isLoading = true
    @State private var isUnlocked = false
    @State private var errorMessage: String?
    @State private var showEditor = false
    @State private var editingPassword: NativePassword?
    @State private var selectedPassword: NativePassword?
    @State private var passwordToDelete: NativePassword?

    init(initialPasswordID: UUID? = nil, onBack: @escaping () -> Void) {
        self.initialPasswordID = initialPasswordID
        self.onBack = onBack
    }

    private var categories: [String] { ["all"] + Array(Set(passwords.map(\.category))).sorted() }
    private var filteredPasswords: [NativePassword] {
        passwords.filter { item in
            (query.isEmpty || "\(item.title) \(item.username) \(item.website ?? "")".localizedCaseInsensitiveContains(query)) &&
            (selectedCategory == "all" || item.category == selectedCategory) &&
            (!favoritesOnly || item.isFavorite)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#efe8d8").ignoresSafeArea()
                if !isUnlocked { lockedState } else if isLoading { ProgressView("Caricamento password...") } else { content }
            }
            .platformNavigationBarTitleDisplayMode()
            .toolbar {
                ToolbarItem(placement: .akLeading) { Button(action: onBack) { Image(systemName: "chevron.left") }.accessibilityLabel("Dashboard") }
                ToolbarItem(placement: .principal) { Text("PASSWORD").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")) }
                if isUnlocked { ToolbarItem(placement: .akTrailing) { Button { editingPassword = nil; showEditor = true } label: { Image(systemName: "plus") }.accessibilityLabel("Nuova password") } }
            }
        }
        .task { await unlock() }
        .overlay {
            if showEditor {
                PasswordEditorView(password: editingPassword, onClose: { withAnimation(.easeOut(duration: 0.2)) { showEditor = false } }, onSave: savePassword)
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            }
        }
        .overlay {
            if let password = selectedPassword {
                PasswordDetailView(password: password, onClose: { withAnimation(.easeOut(duration: 0.2)) { selectedPassword = nil } }, onEdit: { selectedPassword = nil; editingPassword = password; showEditor = true }, onDelete: { passwordToDelete = password })
                    .platformModalWidth(compact: 360, regular: 760)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            }
        }
        .confirmationDialog("Eliminare questa password?", isPresented: Binding(get: { passwordToDelete != nil }, set: { if !$0 { passwordToDelete = nil } }), titleVisibility: .visible) {
            Button("Elimina", role: .destructive) { if let password = passwordToDelete { Task { await delete(password) } } }
        } message: { Text(passwordToDelete?.title ?? "") }
    }

    private var lockedState: some View {
        VStack(spacing: 15) {
            Image(systemName: "faceid").font(.system(size: 46)).foregroundStyle(Color(hex: "#9d8cff"))
            Text("Password protette").font(.title3.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
            Text("Sblocca con Face ID per visualizzare il tuo archivio.").font(.subheadline).multilineTextAlignment(.center).foregroundStyle(Color(hex: "#716a91"))
            Button("Riprova Face ID") { Task { await unlock() } }.font(.subheadline.weight(.bold)).foregroundStyle(Color(hex: "#4b3ba5"))
            if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")).multilineTextAlignment(.center) }
        }.padding(30)
    }

    private var content: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 15) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("ARCHIVIO SICURO").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#9d8cff"))
                    Text("Le tue password").font(.title2.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                    Text("\(filteredPasswords.count) elementi").font(.caption).foregroundStyle(Color(hex: "#716a91"))
                }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Color(hex: "#e5defd")).clipShape(RoundedRectangle(cornerRadius: 20))
                HStack(spacing: 9) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Color(hex: "#8a7f9f"))
                    TextField("Cerca password...", text: $query).platformNoAutocapitalization()
                    Menu { Picker("Categoria", selection: $selectedCategory) { ForEach(categories, id: \.self) { category in Text(category == "all" ? "Tutte" : category).tag(category) } } } label: { Image(systemName: "folder").foregroundStyle(Color(hex: "#716a91")) }
                    Button { favoritesOnly.toggle() } label: { Image(systemName: favoritesOnly ? "star.fill" : "star").foregroundStyle(favoritesOnly ? Color(hex: "#e45f4e") : Color(hex: "#716a91")) }
                }.padding(13).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 14))
                if filteredPasswords.isEmpty { emptyState } else { ForEach(filteredPasswords) { password in PasswordRow(password: password, onOpen: { withAnimation(.spring(response: 0.34, dampingFraction: 0.82)) { selectedPassword = password } }, onFavorite: { Task { await toggleFavorite(password) } }, onEdit: { editingPassword = password; showEditor = true }, onDelete: { passwordToDelete = password }) } }
            }.padding(16)
        }.refreshable { await loadPasswords() }
    }

    private var emptyState: some View { VStack(spacing: 9) { Image(systemName: "key.fill").font(.system(size: 32)).foregroundStyle(Color(hex: "#9d8cff")); Text("Nessuna password trovata").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")); Button("Aggiungi password") { editingPassword = nil; showEditor = true }.font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#4b3ba5")) }.frame(maxWidth: .infinity).padding(30).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 18)) }

    private func unlock() async {
        let context = LAContext(); var authError: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &authError) else { errorMessage = "Face ID non disponibile su questo dispositivo."; return }
        do { try await context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: "Sblocca le password di AK Suite"); isUnlocked = true; await loadPasswords() } catch { errorMessage = "Autenticazione non riuscita." }
    }

    private func loadPasswords() async { isLoading = true; defer { isLoading = false }; do { passwords = try await SupabaseService.shared.from("passwords").select().order("created_at", ascending: false).execute().value; if let initialPasswordID, let password = passwords.first(where: { $0.id == initialPasswordID }) { selectedPassword = password } } catch { errorMessage = "Impossibile caricare le password." } }

    private func savePassword(_ payload: NativePasswordPayload, _ existing: NativePassword?) async throws {
        if let existing { let updated: NativePassword = try await SupabaseService.shared.from("passwords").update(payload).eq("id", value: existing.id.uuidString).select().single().execute().value; passwords = passwords.map { $0.id == updated.id ? updated : $0 } }
        else { guard let userID = auth.session?.user.id else { throw PasswordSaveError.missingUser }; var insert = payload; insert.userID = userID; let created: NativePassword = try await SupabaseService.shared.from("passwords").insert(insert).select().single().execute().value; passwords.insert(created, at: 0) }
    }

    private func toggleFavorite(_ password: NativePassword) async { do { let updated: NativePassword = try await SupabaseService.shared.from("passwords").update(["is_favorite": !password.isFavorite]).eq("id", value: password.id.uuidString).select().single().execute().value; passwords = passwords.map { $0.id == updated.id ? updated : $0 } } catch { errorMessage = "Impossibile aggiornare la password." } }
    private func delete(_ password: NativePassword) async { do { try await SupabaseService.shared.from("passwords").delete().eq("id", value: password.id.uuidString).execute(); passwords.removeAll { $0.id == password.id } } catch { errorMessage = "Impossibile eliminare la password." } }
}

private enum PasswordSaveError: Error { case missingUser }

private struct PasswordRow: View {
    let password: NativePassword; let onOpen: () -> Void; let onFavorite: () -> Void; let onEdit: () -> Void; let onDelete: () -> Void
    var body: some View { HStack(spacing: 13) { Text(password.emoji).font(.title2).frame(width: 44, height: 44).background(Color(hex: "#e5defd")).clipShape(RoundedRectangle(cornerRadius: 13)); VStack(alignment: .leading, spacing: 3) { Text(password.title).font(.subheadline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")); Text(password.username).font(.caption).foregroundStyle(Color(hex: "#716a91")); Text(password.category).font(.caption2.weight(.bold)).foregroundStyle(Color(hex: "#9d8cff")) }; Spacer(); Button(action: onFavorite) { Image(systemName: password.isFavorite ? "star.fill" : "star").foregroundStyle(password.isFavorite ? Color(hex: "#e45f4e") : Color(hex: "#8a7f9f")) }; Menu { Button("Modifica", action: onEdit); Button("Elimina", role: .destructive, action: onDelete) } label: { Image(systemName: "ellipsis") }.foregroundStyle(Color(hex: "#716a91")) }.padding(14).background(Color(hex: "#fff8ed")).overlay(RoundedRectangle(cornerRadius: 15).stroke(Color(hex: "#e1d5c4"), lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 15)).contentShape(Rectangle()).onTapGesture(perform: onOpen) }
}

private struct PasswordDetailView: View {
    let password: NativePassword; let onClose: () -> Void; let onEdit: () -> Void; let onDelete: () -> Void; @State private var isVisible = false
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
                HStack {
                    Text(password.emoji).font(.largeTitle)
                    VStack(alignment: .leading) {
                        Text(password.title).font(.title3.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                        Text(password.category).font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#9d8cff"))
                    }
                    Spacer()
                    Button(action: onClose) { Image(systemName: "xmark") }
                }
                .foregroundStyle(Color(hex: "#716a91"))

                detail("UTENTE", password.username)
                detail("PASSWORD", isVisible ? password.password : "••••••••") {
                    Button { isVisible.toggle() } label: { Image(systemName: isVisible ? "eye.slash" : "eye") }
                }
                if let website = password.website, !website.isEmpty { detail("SITO WEB", website) }
                if let pin = password.pinCode, !pin.isEmpty { detail("PIN", isVisible ? pin : "••••") }
                if let notes = password.notes, !notes.isEmpty { detail("NOTE", notes) }

                HStack(spacing: 12) {
                    Button("Modifica", action: onEdit)
                        .buttonStyle(.borderedProminent)
                        .tint(Color(hex: "#9d8cff"))
                    Button("Elimina", role: .destructive, action: onDelete)
                        .buttonStyle(.bordered)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 2)
            }
            .padding(22)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(hex: "#fffdf9"))
            .clipShape(RoundedRectangle(cornerRadius: 24))
        .padding(16)
    }
    private func detail(_ label: String, _ value: String, @ViewBuilder action: () -> some View = { EmptyView() }) -> some View { VStack(alignment: .leading, spacing: 6) { Text(label).font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f")); HStack { Text(value).font(.body).foregroundStyle(Color(hex: "#2d2754")); Spacer(); action() } .padding(13).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12)) } }
}

private struct PasswordEditorView: View {
    let password: NativePassword?
    let onClose: () -> Void
    let onSave: (NativePasswordPayload, NativePassword?) async throws -> Void
    @State private var title = ""
    @State private var username = ""
    @State private var secret = ""
    @State private var website = ""
    @State private var category = "Personal"
    @State private var emoji = "🔑"
    @State private var notes = ""
    @State private var favorite = false
    @State private var pin = ""
    @State private var showPassword = false
    @State private var showPin = false
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    field("TITOLO", icon: "textformat", placeholder: "Es. Account Google, VPN aziendale...", text: $title)
                    HStack(spacing: 12) {
                        field("NOME UTENTE", icon: "person", placeholder: "Username o email", text: $username)
                        field("CATEGORIA", icon: "tag", placeholder: "Personal", text: $category)
                    }
                    secureField("PASSWORD", icon: "lock.fill", placeholder: "Inserisci la password", text: $secret, isVisible: $showPassword)
                    field("SITO WEB", icon: "globe", placeholder: "https://...", text: $website)
                    HStack(spacing: 12) {
                        field("PIN", icon: "number", placeholder: "Codice PIN", text: $pin, isSecure: !showPin)
                        field("EMOJI", icon: "face.smiling", placeholder: "🔑", text: $emoji)
                    }
                    VStack(alignment: .leading, spacing: 7) {
                        Label("NOTE", systemImage: "text.alignleft").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                        TextField("Note aggiuntive...", text: $notes, axis: .vertical).lineLimit(3...6).passwordInputStyle()
                    }
                    Toggle(isOn: $favorite) { Label("Preferita", systemImage: favorite ? "star.fill" : "star") }.tint(Color(hex: "#9d8cff"))
                    if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                }
                .padding(20)
            }
            HStack(spacing: 12) {
                Button("Annulla", action: onClose).buttonStyle(.bordered).frame(maxWidth: .infinity)
                Button(isSaving ? "Salvo..." : "Salva password") { Task { await submit() } }.buttonStyle(.borderedProminent).tint(Color(hex: "#9d8cff")).frame(maxWidth: .infinity).disabled(title.isEmpty || username.isEmpty || secret.isEmpty || isSaving)
            }
            .padding(16)
            .background(Color(hex: "#fffdf9"))
        }
        .frame(maxHeight: 690)
        .background(Color(hex: "#fffdf9"))
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .onAppear(perform: load)
    }

    private var header: some View {
        HStack(spacing: 12) {
            Image(systemName: "key.fill").foregroundStyle(.white).frame(width: 42, height: 42).background(Color(hex: "#9d8cff")).clipShape(RoundedRectangle(cornerRadius: 13))
            VStack(alignment: .leading, spacing: 2) {
                Text(password == nil ? "Nuova credenziale" : "Modifica credenziale").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                Text(password == nil ? "Aggiungi al vault" : "Aggiorna i dati salvati").font(.caption).foregroundStyle(Color(hex: "#8a7f9f"))
            }
            Spacer()
            Button(action: onClose) { Image(systemName: "xmark").foregroundStyle(Color(hex: "#8a7f9f")).frame(width: 36, height: 36).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 11)) }.accessibilityLabel("Chiudi")
        }
        .padding(18)
        .overlay(alignment: .bottom) { Rectangle().fill(Color(hex: "#ead8bf")).frame(height: 1) }
    }

    private func field(_ label: String, icon: String, placeholder: String, text: Binding<String>, isSecure: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Label(label, systemImage: icon).font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
            Group { if isSecure { SecureField(placeholder, text: text) } else { TextField(placeholder, text: text) } }.platformNoAutocapitalization().passwordInputStyle()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func secureField(_ label: String, icon: String, placeholder: String, text: Binding<String>, isVisible: Binding<Bool>) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack { Label(label, systemImage: icon); Spacer(); Button(isVisible.wrappedValue ? "Nascondi" : "Mostra") { isVisible.wrappedValue.toggle() }.font(.caption2.weight(.bold)).foregroundStyle(Color(hex: "#4b3ba5")) }.font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
            HStack { Group { if isVisible.wrappedValue { TextField(placeholder, text: text) } else { SecureField(placeholder, text: text) } }.platformNoAutocapitalization(); Image(systemName: isVisible.wrappedValue ? "eye.slash" : "eye").foregroundStyle(Color(hex: "#9d8cff")) }.passwordInputStyle()
        }
    }

    private func load() { guard let password else { return }; title = password.title; username = password.username; secret = password.password; website = password.website ?? ""; category = password.category; emoji = password.emoji; notes = password.notes ?? ""; favorite = password.isFavorite; pin = password.pinCode ?? "" }
    private func submit() async { isSaving = true; defer { isSaving = false }; let encoded = Data(secret.utf8).base64EncodedString(); let payload = NativePasswordPayload(title: title.trimmingCharacters(in: .whitespaces), username: username, encryptedPassword: encoded, website: website, category: category.isEmpty ? "Personal" : category, emoji: emoji.isEmpty ? "🔑" : emoji, notes: notes, isFavorite: favorite, pinCode: pin, userID: nil); do { try await onSave(payload, password); onClose() } catch { errorMessage = "Impossibile salvare la password." } }
}

private extension View {
    func passwordInputStyle() -> some View { self.font(.subheadline).foregroundStyle(Color(hex: "#2d2754")).padding(.horizontal, 13).padding(.vertical, 11).background(Color(hex: "#f8e8cf")).overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#e6d3b6"), lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 12)) }
}