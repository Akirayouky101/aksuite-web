import SwiftUI

private struct SearchCall: Decodable { let id: UUID; let caller_name: String }
private struct SearchTitle: Decodable { let id: UUID; let title: String }
private struct SearchPayment: Decodable { let id: UUID; let payment_type: String; let recipient: String }
private struct SearchClient: Decodable { let id: UUID; let name: String }
private struct SearchHistory: Decodable {
    struct Item: Decodable { let title: String }
    let kind: String
    let item: Item
    let completion_time: String
    let item_id: UUID
}
private struct SearchResult: Identifiable {
    let id: UUID
    let type: String
    let title: String
    let detail: String
}

struct GlobalSearchView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var auth: AuthViewModel
    @State private var query = ""
    @State private var results: [SearchResult] = []
    @State private var busy = false
    @State private var error: String?
    @State private var historyCursor: SearchHistory?
    @State private var moreHistory = false
    @State private var searchedTerm = ""
    let onOpen: (String, UUID) -> Void

    var body: some View {
        NavigationStack {
            VStack {
                TextField("Cerca in AK Suite e nello storico", text: $query).textFieldStyle(.roundedBorder)
                    .onSubmit { Task { await search() } }.padding(.horizontal)
                Button(busy ? "Caricamento..." : "Cerca nel database") { Task { await search() } }.disabled(busy)
                Text("Ricerca solo su richiesta: massimo 5 risultati per sezione e 5 elementi dello storico per lotto.").font(.caption).padding(.horizontal)
                if let error { Text(error).foregroundStyle(.red).font(.caption) }
                List(results) { result in
                    Button { onOpen(result.type, result.id); dismiss() } label: {
                        VStack(alignment: .leading) { Text(result.title); Text(result.detail).font(.caption).foregroundStyle(.secondary) }
                    }
                }.listStyle(.plain)
                if moreHistory { Button("Carica altre 5 dallo storico") { Task { await search(more: true) } }.disabled(busy) }
            }
            .navigationTitle("Ricerca")
            .toolbar { ToolbarItem(placement: .akTrailing) { Button("Chiudi") { dismiss() } } }
        }
    }

    @MainActor private func search(more: Bool = false) async {
        guard !busy else { return }
        let term = more ? searchedTerm : query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (1...200).contains(term.count) else { error = "Inserisci da 1 a 200 caratteri."; return }
        busy = true; error = nil; defer { busy = false }
        let owner = auth.session?.user.id
        do {
            let pattern = "%\(term.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "%", with: "\\%").replacingOccurrences(of: "_", with: "\\_"))%"
            let quotedPattern = "\"\(pattern.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\""))\""
            var found: [SearchResult] = []
            if !more {
                async let calls: [SearchCall] = SupabaseService.shared.from("calls").select("id,caller_name").or("caller_name.ilike.\(quotedPattern),notes.ilike.\(quotedPattern)").limit(5).execute().value
                async let notes: [SearchTitle] = SupabaseService.shared.from("notes").select("id,title").or("title.ilike.\(quotedPattern),content.ilike.\(quotedPattern)").limit(5).execute().value
                async let events: [SearchTitle] = SupabaseService.shared.from("events").select("id,title").eq("is_completed", value: false).is("archived_at", value: nil).or("title.ilike.\(quotedPattern),location.ilike.\(quotedPattern)").limit(5).execute().value
                async let todos: [SearchTitle] = SupabaseService.shared.from("work_items").select("id,title").eq("kind", value: "todo").neq("status", value: "completed").is("archived_at", value: nil).ilike("title", pattern: pattern).limit(5).execute().value
                async let payments: [SearchPayment] = SupabaseService.shared.from("payments").select("id,payment_type,recipient").or("recipient.ilike.\(quotedPattern),payment_type.ilike.\(quotedPattern)").limit(5).execute().value
                async let clients: [SearchClient] = SupabaseService.shared.from("clients").select("id,name").or("name.ilike.\(quotedPattern),company.ilike.\(quotedPattern)").limit(5).execute().value
                let values = try await (calls, notes, events, todos, payments, clients)
                found = values.0.map { SearchResult(id: $0.id, type: "call", title: $0.caller_name, detail: "Chiamata") }
                    + values.1.map { SearchResult(id: $0.id, type: "note", title: $0.title, detail: "Nota") }
                    + values.2.map { SearchResult(id: $0.id, type: "event", title: $0.title, detail: "Evento da fare") }
                    + values.3.map { SearchResult(id: $0.id, type: "todo", title: $0.title, detail: "Cosa da fare") }
                    + values.4.map { SearchResult(id: $0.id, type: "payment", title: $0.payment_type, detail: $0.recipient) }
                    + values.5.map { SearchResult(id: $0.id, type: "client", title: $0.name, detail: "Contatto") }
            }
            struct Params: Encodable {
                let term: String
                let cursor_time: String?
                let cursor_id: UUID?
                let cursor_kind: String?
            }
            let cursor = more ? historyCursor : nil
            let page: [SearchHistory] = try await SupabaseService.shared.rpc("search_completed_history", params: Params(term: term, cursor_time: cursor?.completion_time, cursor_id: cursor?.item_id, cursor_kind: cursor?.kind)).execute().value
            guard auth.session?.user.id == owner else { return }
            results = (more ? results : found) + page.prefix(5).map { SearchResult(id: $0.item_id, type: $0.kind, title: $0.item.title, detail: "Storico · \($0.completion_time)") }
            historyCursor = page.prefix(5).last; moreHistory = page.count > 5; searchedTerm = term
        } catch { self.error = error.localizedDescription }
    }
}
