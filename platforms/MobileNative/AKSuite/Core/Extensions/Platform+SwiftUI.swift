import SwiftUI

private struct PlatformModalWidth: ViewModifier {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    let compact: CGFloat
    let regular: CGFloat

    func body(content: Content) -> some View {
        content.frame(maxWidth: horizontalSizeClass == .regular ? regular : compact)
    }
}

extension View {
    func platformModalWidth(compact: CGFloat, regular: CGFloat) -> some View {
        modifier(PlatformModalWidth(compact: compact, regular: regular))
    }

    @ViewBuilder
    func platformNavigationBarTitleDisplayMode() -> some View {
        #if os(iOS)
        self.navigationBarTitleDisplayMode(.inline)
        #else
        self
        #endif
    }

    @ViewBuilder
    func platformNoAutocapitalization() -> some View {
        #if os(iOS)
        self.textInputAutocapitalization(.never)
        #else
        self
        #endif
    }

    @ViewBuilder
    func platformWordsAutocapitalization() -> some View {
        #if os(iOS)
        self.textInputAutocapitalization(.words)
        #else
        self
        #endif
    }

    @ViewBuilder
    func platformPhoneKeyboard() -> some View {
        #if os(iOS)
        self.keyboardType(.phonePad)
        #else
        self
        #endif
    }

    @ViewBuilder
    func platformEmailKeyboard() -> some View {
        #if os(iOS)
        self.keyboardType(.emailAddress)
        #else
        self
        #endif
    }
}

extension ToolbarItemPlacement {
    static var akLeading: ToolbarItemPlacement {
        #if os(iOS)
        return .topBarLeading
        #else
        return .automatic
        #endif
    }

    static var akTrailing: ToolbarItemPlacement {
        #if os(iOS)
        return .topBarTrailing
        #else
        return .automatic
        #endif
    }
}