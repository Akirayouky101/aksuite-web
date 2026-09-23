import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @FocusState private var focusedField: Field?

    private enum Field { case email, password }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("BENTORNATO")
                        .font(.system(size: 12, weight: .black))
                        .tracking(3)
                        .foregroundStyle(Color(hex: "#ff765f"))
                    Text("Riprendiamo da qui.")
                        .font(.system(size: 34, weight: .black))
                        .foregroundStyle(Color(hex: "#2d2754"))
                    Text("Accedi al tuo spazio personale e ritrova tutto al suo posto.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: 14) {
                    fieldContainer {
                        TextField("Email", text: $email)
                            .textContentType(.username)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .focused($focusedField, equals: .email)
                    }
                    fieldContainer {
                        SecureField("Password", text: $password)
                            .textContentType(.password)
                            .focused($focusedField, equals: .password)
                    }
                }

                if let error = auth.errorMessage {
                    Text(error)
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Color(hex: "#c75143"))
                }

                Button {
                    focusedField = nil
                    Task { await auth.signIn(email: email, password: password) }
                } label: {
                    HStack {
                        if auth.isSubmitting {
                            ProgressView().tint(.white)
                        } else {
                            Text("Entra nella suite")
                                .font(.headline)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color(hex: "#2d2754"))
                    .foregroundStyle(Color(hex: "#fff6df"))
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
                .disabled(email.isEmpty || password.isEmpty || auth.isSubmitting)
                .opacity(email.isEmpty || password.isEmpty ? 0.6 : 1)
            }
            .padding(24)
        }
        .background(Color(hex: "#efe8d8").ignoresSafeArea())
    }

    @ViewBuilder
    private func fieldContainer<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Color.white.opacity(0.7))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color(hex: "#dfcdb1"), lineWidth: 1)
            )
    }
}

#Preview {
    LoginView().environmentObject(AuthViewModel())
}
