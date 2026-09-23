import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "sparkles")
                .font(.system(size: 40))
                .foregroundStyle(Color(hex: "#e45f4e"))
            Text("AK Suite")
                .font(.system(size: 28, weight: .black))
            Text("Progetto nativo pronto. Prossima fase: login Supabase.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
    }
}

#Preview {
    ContentView()
}
