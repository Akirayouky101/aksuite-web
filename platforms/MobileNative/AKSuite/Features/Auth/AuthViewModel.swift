import Foundation
import Supabase

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var session: Session?
    @Published var isLoading = true
    @Published var errorMessage: String?
    @Published var isSubmitting = false

    private let client = SupabaseService.shared
    private var observeTask: Task<Void, Never>?

    init() {
        observeTask = Task { await observeAuthState() }
    }

    deinit {
        observeTask?.cancel()
    }

    private func observeAuthState() async {
        for await state in client.auth.authStateChanges {
            switch state.event {
            case .initialSession, .signedIn, .tokenRefreshed, .userUpdated:
                session = state.session
            case .signedOut:
                session = nil
            default:
                break
            }
            isLoading = false
        }
    }

    func signIn(email: String, password: String) async {
        errorMessage = nil
        isSubmitting = true
        defer { isSubmitting = false }
        do {
            try await client.auth.signIn(email: email, password: password)
        } catch {
            errorMessage = "Email o password non validi."
        }
    }

    func signOut() async {
        try? await client.auth.signOut()
    }
}
