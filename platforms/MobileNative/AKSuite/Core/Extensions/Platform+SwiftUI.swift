import SwiftUI

enum MacInterfaceSize: String, CaseIterable, Identifiable {
    case standard, larger, largest
    var id: String { rawValue }
    var title: String {
        switch self {
        case .standard: return "Standard"
        case .larger: return "Grande"
        case .largest: return "Molto grande"
        }
    }
    var dynamicTypeSize: DynamicTypeSize {
        switch self {
        case .standard: return .large
        case .larger: return .xxLarge
        case .largest: return .xxxLarge
        }
    }
}

private struct MacReadableInterface: ViewModifier {
    @Environment(\.dynamicTypeSize) private var systemSize
    @AppStorage("macInterfaceSize") private var preference = MacInterfaceSize.largest.rawValue

    func body(content: Content) -> some View {
        let preferred = MacInterfaceSize(rawValue: preference) ?? .largest
        content
            .dynamicTypeSize(max(systemSize, preferred.dynamicTypeSize))
            .controlSize(.large)
    }
}

private struct ScaledPlatformFont: ViewModifier {
    @ScaledMetric private var size: CGFloat
    let weight: Font.Weight

    init(size: CGFloat, weight: Font.Weight) {
        _size = ScaledMetric(wrappedValue: size, relativeTo: .body)
        self.weight = weight
    }

    func body(content: Content) -> some View {
        content.font(.system(size: size, weight: weight))
    }
}

private struct PlatformModalWidth: ViewModifier {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    let compact: CGFloat
    let regular: CGFloat

    func body(content: Content) -> some View {
        content.frame(maxWidth: horizontalSizeClass == .regular ? regular : compact)
    }
}

extension View {
    @ViewBuilder
    func platformReadableInterface() -> some View {
        #if targetEnvironment(macCatalyst)
        modifier(MacReadableInterface())
        #else
        self
        #endif
    }

    @ViewBuilder
    func platformScaledFont(size: CGFloat, weight: Font.Weight = .regular) -> some View {
        #if targetEnvironment(macCatalyst)
        modifier(ScaledPlatformFont(size: size, weight: weight))
        #else
        font(.system(size: size, weight: weight))
        #endif
    }

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