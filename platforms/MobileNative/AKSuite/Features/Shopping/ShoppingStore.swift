import Foundation
import SwiftUI

@MainActor
final class ShoppingStore: ObservableObject {
    @Published private(set) var lists: [ShoppingListRecord] = []
    @Published private(set) var products: [ShoppingProduct] = []
    @Published private(set) var isLoading = true
    @Published private(set) var isBusy = false
    @Published var errorMessage: String?
    private var ownerID: UUID?
    private var generation = UUID()

    func load(userID: UUID?) async {
        let request = UUID()
        generation = request
        if ownerID != userID {
            lists = []
            products = []
        }
        ownerID = userID
        guard let userID else {
            isLoading = false
            errorMessage = ShoppingError.missingUser.localizedDescription
            return
        }
        isLoading = true
        errorMessage = nil
        do {
            async let listRequest: [ShoppingListRecord] = SupabaseService.shared.from("shopping_lists")
                .select().eq("user_id", value: userID.uuidString).order("created_at", ascending: false).execute().value
            async let productRequest: [ShoppingProduct] = SupabaseService.shared.from("shopping_items")
                .select().order("created_at", ascending: true).order("id", ascending: true).execute().value
            let (loadedLists, loadedProducts) = try await (listRequest, productRequest)
            guard generation == request else { return }
            lists = loadedLists
            products = loadedProducts
        } catch {
            guard generation == request else { return }
            errorMessage = "Impossibile caricare la spesa: \(error.localizedDescription)"
        }
        if generation == request { isLoading = false }
    }

    private func begin() throws -> UUID {
        guard let ownerID else { throw ShoppingError.missingUser }
        guard !isBusy, !isLoading else { throw ShoppingError.invalid("Attendi il completamento dell'operazione.") }
        isBusy = true
        errorMessage = nil
        return ownerID
    }

    func saveList(id: UUID?, title: String) async throws -> UUID {
        let cleanTitle = try ShoppingValidation.title(title)
        let owner = try begin()
        defer { isBusy = false }
        let saved: ShoppingListRecord
        if let id {
            saved = try await SupabaseService.shared.from("shopping_lists").update(["title": cleanTitle])
                .eq("id", value: id.uuidString).select().single().execute().value
        } else {
            struct Payload: Encodable {
                let title: String
                let user_id: UUID
            }
            saved = try await SupabaseService.shared.from("shopping_lists").insert(Payload(title: cleanTitle, user_id: owner))
                .select().single().execute().value
        }
        guard ownerID == owner else { throw ShoppingError.missingUser }
        if let index = lists.firstIndex(where: { $0.id == saved.id }) { lists[index] = saved }
        else { lists.insert(saved, at: 0) }
        return saved.id
    }

    func saveProduct(id: UUID?, listID: UUID, payload: ShoppingProductPayload) async throws {
        let owner = try begin()
        defer { isBusy = false }
        let saved: ShoppingProduct
        if let id {
            saved = try await SupabaseService.shared.from("shopping_items").update(payload)
                .eq("id", value: id.uuidString).select().single().execute().value
        } else {
            var insert = payload
            insert.listID = listID
            saved = try await SupabaseService.shared.from("shopping_items").insert(insert)
                .select().single().execute().value
        }
        guard ownerID == owner else { throw ShoppingError.missingUser }
        replace(saved)
    }

    func setPurchased(_ product: ShoppingProduct) async {
        do {
            let owner = try begin()
            defer { isBusy = false }
            let saved: ShoppingProduct = try await SupabaseService.shared.from("shopping_items")
                .update(["purchased": !product.purchased]).eq("id", value: product.id.uuidString)
                .select().single().execute().value
            guard ownerID == owner else { return }
            replace(saved)
        } catch { errorMessage = "Impossibile aggiornare il prodotto: \(error.localizedDescription)" }
    }

    func delete(id: UUID, isList: Bool) async throws {
        struct Deleted: Decodable { let id: UUID }
        let owner = try begin()
        defer { isBusy = false }
        let deleted: Deleted = try await SupabaseService.shared.from(isList ? "shopping_lists" : "shopping_items")
            .delete().eq("id", value: id.uuidString).select("id").single().execute().value
        guard ownerID == owner else { throw ShoppingError.missingUser }
        if isList {
            lists.removeAll { $0.id == deleted.id }
            products.removeAll { $0.listID == deleted.id }
        } else { products.removeAll { $0.id == deleted.id } }
    }

    private func replace(_ product: ShoppingProduct) {
        if let index = products.firstIndex(where: { $0.id == product.id }) { products[index] = product }
        else { products.append(product) }
    }
}
