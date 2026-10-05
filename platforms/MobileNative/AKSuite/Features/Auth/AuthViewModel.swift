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
            case .initialSession:
                if let initialSession = state.session, !initialSession.isExpired {
                    session = initialSession
                    isLoading = false
                } else if state.session == nil {
                    session = nil
                    isLoading = false
                }
            case .signedIn, .tokenRefreshed, .userUpdated:
                session = state.session
                isLoading = false
            case .signedOut:
                session = nil
                isLoading = false
            default:
                break
            }
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
