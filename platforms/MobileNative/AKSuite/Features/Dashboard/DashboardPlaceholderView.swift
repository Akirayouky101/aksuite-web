import SwiftUI

struct DashboardPlaceholderView: View {
    @EnvironmentObject private var auth: AuthViewModel

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "sparkles")
                .font(.system(size: 34))
                .foregroundStyle(Color(hex: "#e45f4e"))
            Text("Bentornato\(auth.session?.user.email.map { ", \($0)" } ?? "")")
                .font(.title3.weight(.bold))
                .multilineTextAlignment(.center)
            Text("Prossima fase: dashboard con post-it delle note.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Button("Esci") {
                Task { await auth.signOut() }
            }
            .font(.footnote.weight(.semibold))
            .foregroundStyle(Color(hex: "#c75143"))
            .padding(.top, 8)
        }
        .padding()
    }
}

#Preview {
    DashboardPlaceholderView().environmentObject(AuthViewModel())
}
