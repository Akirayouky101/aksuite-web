import SwiftUI

private struct NotePreview: Decodable, Identifiable {
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

struct LegacyDashboardView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var notes: [NotePreview] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    private let columns = [GridItem(.adaptive(minimum: 155), spacing: 14)]

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Caricamento note...")
                } else if let errorMessage {
                    DashboardStateView(
                        title: "Impossibile caricare le note",
                        systemImage: "exclamationmark.triangle",
                        message: errorMessage
                    )
                } else if notes.isEmpty {
                    DashboardStateView(
                        title: "Nessuna nota",
                        systemImage: "note.text",
                        message: "Le tue note appariranno qui."
                    )
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 14) {
                            ForEach(notes) { note in
                                NoteCard(note: note)
                            }
                        }
                        .padding()
                    }
                    .refreshable { await loadNotes() }
                }
            }
            .navigationTitle("AK Suite")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await auth.signOut() }
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                    }
                    .accessibilityLabel("Esci")
                }
            }
        }
        .task { await loadNotes() }
    }

    private func loadNotes() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            notes = try await SupabaseService.shared
                .from("notes")
                .select()
                .order("is_pinned", ascending: false)
                .order("updated_at", ascending: false)
                .limit(8)
                .execute()
                .value
        } catch {
            errorMessage = "Controlla la connessione e riprova."
        }
    }
}

private struct DashboardStateView: View {
    let title: String
    let systemImage: String
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 36))
                .foregroundStyle(Color(hex: "#e45f4e"))
            Text(title)
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(32)
    }
}

private struct NoteCard: View {
    let note: NotePreview

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                if note.isPinned {
                    Image(systemName: "pin.fill")
                        .font(.caption2)
                }
                Text(note.title)
                    .font(.headline)
                    .lineLimit(2)
            }
            if let content = note.content, !content.isEmpty {
                Text(content)
                    .font(.subheadline)
                    .lineLimit(5)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            Spacer(minLength: 0)
        }
        .foregroundStyle(Color(hex: "#2d2754"))
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 150, alignment: .topLeading)
        .background(cardColor)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private var cardColor: Color {
        switch note.color.lowercased() {
        case "yellow": Color(hex: "#f7c948")
        case "green": Color(hex: "#8ed8c3")
        case "red", "coral": Color(hex: "#f3aaa1")
        case "purple": Color(hex: "#c5bde7")
        default: Color(hex: "#b9dbf8")
        }
    }
}

#Preview {
    LegacyDashboardView().environmentObject(AuthViewModel())
}
