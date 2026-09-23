import Foundation
import Supabase

enum SupabaseConfig {
    static var url: URL {
        guard let value = Bundle.main.infoDictionary?["SUPABASE_URL"] as? String, let url = URL(string: value) else {
            fatalError("Missing or invalid SUPABASE_URL in Info.plist — check Config/Secrets.xcconfig")
        }
        return url
    }

    static var anonKey: String {
        guard let value = Bundle.main.infoDictionary?["SUPABASE_ANON_KEY"] as? String, !value.isEmpty else {
            fatalError("Missing SUPABASE_ANON_KEY in Info.plist — check Config/Secrets.xcconfig")
        }
        return value
    }
}

enum SupabaseService {
    static let shared = SupabaseClient(supabaseURL: SupabaseConfig.url, supabaseKey: SupabaseConfig.anonKey)
}
