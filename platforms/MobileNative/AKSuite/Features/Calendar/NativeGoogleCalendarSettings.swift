import SwiftUI
import UIKit
import UserNotifications

enum NativeCalendarAPI {
    private struct Failure: Decodable { let error: String }
    static func request<T: Decodable>(_ path: String, method: String = "GET", body: Data? = nil) async throws -> T {
        let session = try await SupabaseService.shared.auth.session
        guard let url = URL(string: "https://aksuite.app/api/google-calendar/\(path)") else {
            throw NativeIntegrationError.message("Indirizzo calendario non valido.")
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 65
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NativeIntegrationError.message("Risposta server non valida.") }
        guard (200..<300).contains(http.statusCode) else {
            let failure = try JSONDecoder().decode(Failure.self, from: data)
            throw NativeIntegrationError.message(failure.error)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}

struct NativeGoogleCalendarSettings: View {
    struct CalendarChoice: Decodable, Identifiable { let id: String; let summary: String }
    struct Settings: Decodable {
        let configured: Bool
        let connected: Bool
        let email: String?
        let calendarId: String?
        let calendars: [CalendarChoice]?
        let lastSync: String?
        let lastError: String?
    }
    struct Conflict: Decodable, Identifiable { let id: String; let title: String; let reason: String }
    struct Sync: Decodable {
        let pulled: Int
        let pushed: Int
        let more: Bool
        let message: String
        let conflicts: [Conflict]
    }
    struct Saved: Decodable { let saved: Bool }
    struct Disconnected: Decodable { let disconnected: Bool; let warning: String? }
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @EnvironmentObject private var auth: AuthViewModel
    @State private var settings: Settings?
    @State private var selected = ""
    @State private var from = Date.now
    @State private var result: Sync?
    @State private var resolutions: [String: String] = [:]
    @State private var busy = false
    @State private var error: String?
    @State private var message: String?
    @State private var confirmSelection = false
    @State private var confirmDisconnect = false
    @State private var notificationStatus = ""
    var body: some View {
        NavigationStack {
            Form {
                Section("Notifiche eventi") {
                    Text("Alla scadenza: Sì completa dopo l'accesso, No apre la scelta di una nuova data. Le notifiche native usano APNs, separato dalle notifiche web.")
                    Text(notificationStatus).font(.caption)
                    Button("Attiva / verifica notifiche") {
                        Task {
                            if let owner = auth.session?.user.id { await PushNotificationManager.shared?.registerDevice(for: owner) }
                            await readNotifications()
                        }
                    }
                    #if targetEnvironment(macCatalyst)
                    Text("Per modificare i permessi, apri Impostazioni di Sistema > Notifiche > AK Suite.").font(.caption)
                    #else
                    Button("Apri impostazioni dispositivo") {
                        if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
                    }
                    #endif
                }
                Section("Google Calendar") {
                    if let settings {
                        if !settings.configured { Text("Google non configurato sul server.") }
                        if settings.connected {
                            Text("Collegato: \(settings.email ?? "")")
                            if let calendar = settings.calendarId {
                                Text("Calendario: \(calendar)")
                                Button(result?.more == true ? "Continua sincronizzazione" : "Sincronizza ora") { Task { await sync() } }
                                    .disabled(busy || (result?.conflicts.contains { resolutions[$0.id] == nil } ?? false))
                            } else {
                                Picker("Calendario", selection: $selected) {
                                    Text("Scegli calendario").tag("")
                                    ForEach(settings.calendars ?? []) { Text($0.summary).tag($0.id) }
                                }
                                DatePicker("Prima importazione dal", selection: $from, displayedComponents: .date)
                                Text("AK Suite invia gli appuntamenti attivi di tua proprietà. Le future modifiche ed eliminazioni vengono replicate nei due sensi.").font(.caption)
                                Button("Salva calendario e avvia") { confirmSelection = true }.disabled(selected.isEmpty || busy)
                            }
                            if let last = settings.lastSync { Text("Ultimo lotto: \(NativeDates.parse(last)?.formatted() ?? last)").font(.caption) }
                            if let lastError = settings.lastError { Text(lastError).foregroundStyle(.red) }
                            Button("Disconnetti Google", role: .destructive) { confirmDisconnect = true }.disabled(busy)
                        }
                        Link(settings.connected ? "Rinnova autorizzazione nel browser" : "Collega Google nel browser",
                             destination: URL(string: "https://aksuite.app/?web=1")!)
                        Text("Il collegamento si autorizza nel browser: accedi allo stesso account AK Suite, poi Calendario → Impostazioni calendario. Al ritorno premi Aggiorna. Nessuna credenziale Google viene salvata nell'app.").font(.caption)
                    }
                    Button(busy ? "Attendere..." : "Aggiorna collegamento") { Task { await load() } }.disabled(busy)
                    if let error { Text(error).foregroundStyle(.red) }
                    if let message { Text(message).font(.caption) }
                    ForEach(result?.conflicts ?? []) { conflict in
                        Text(conflict.title).bold()
                        Text(conflict.reason).font(.caption)
                        Picker("Versione da mantenere", selection: Binding(get: { resolutions[conflict.id] ?? "" }, set: { resolutions[conflict.id] = $0 })) {
                            Text("Scegli").tag("")
                            Text("AK Suite (anche eliminazione)").tag("local")
                            Text("Google (anche eliminazione)").tag("google")
                        }
                    }
                }
            }
            .navigationTitle("Impostazioni calendario")
            .toolbar { ToolbarItem(placement: .akTrailing) { Button("Chiudi") { dismiss() }.disabled(busy) } }
        }
        .task { await load(); await readNotifications() }
        .onChange(of: scenePhase) { phase in if phase == .active { Task { await load(); await readNotifications() } } }
        .alert("Attivare la sincronizzazione bidirezionale?", isPresented: $confirmSelection) {
            Button("Annulla", role: .cancel) {}
            Button("Attiva") { Task { await configure() } }
        } message: { Text("Le future eliminazioni saranno replicate. La disconnessione conserva gli appuntamenti su entrambi i servizi.") }
        .alert("Disconnettere Google?", isPresented: $confirmDisconnect) {
            Button("Annulla", role: .cancel) {}
            Button("Disconnetti", role: .destructive) { Task { await disconnect() } }
        } message: { Text("Gli appuntamenti restano su entrambi i servizi.") }
    }
    @MainActor private func readNotifications() async {
        let status = await UNUserNotificationCenter.current().notificationSettings()
        notificationStatus = status.authorizationStatus == .denied ? "Permesso negato: abilita nelle impostazioni del dispositivo." :
            status.authorizationStatus == .notDetermined ? "Permesso non ancora richiesto." : "Permesso notifiche concesso."
        if let error = PushNotificationManager.shared?.errorMessage { notificationStatus += " \(error)" }
    }
    @MainActor private func load() async {
        guard !busy else { return }; busy = true; error = nil; defer { busy = false }
        let owner = auth.session?.user.id
        do {
            let loaded: Settings = try await NativeCalendarAPI.request("settings")
            guard owner == auth.session?.user.id else { return }
            settings = loaded; selected = loaded.calendarId ?? selected
        } catch { self.error = error.localizedDescription }
    }
    @MainActor private func sync() async {
        guard !busy else { return }; busy = true; error = nil; defer { busy = false }
        let owner = auth.session?.user.id
        do {
            let loaded: Sync = try await NativeCalendarAPI.request("sync", method: "POST", body: JSONSerialization.data(withJSONObject: ["resolutions": resolutions.filter { !$0.value.isEmpty }]))
            guard owner == auth.session?.user.id else { return }
            result = loaded; resolutions = [:]
            message = "\(loaded.message) Ricevuti: \(loaded.pulled), inviati: \(loaded.pushed)."
        } catch { self.error = error.localizedDescription }
    }
    @MainActor private func configure() async {
        guard !busy else { return }; busy = true; error = nil
        do {
            let _: Saved = try await NativeCalendarAPI.request("settings", method: "PUT", body: JSONSerialization.data(withJSONObject: [
                "calendarId": selected, "initialFrom": ISO8601DateFormatter().string(from: NativeDates.romeCalendar.startOfDay(for: from))
            ]))
            busy = false
            await load(); await sync()
        } catch { self.error = error.localizedDescription; busy = false }
    }
    @MainActor private func disconnect() async {
        guard !busy else { return }; busy = true; error = nil
        do {
            let reply: Disconnected = try await NativeCalendarAPI.request("settings", method: "DELETE")
            message = reply.warning ?? "Google disconnesso."
            result = nil; resolutions = [:]; busy = false; await load()
        } catch { self.error = error.localizedDescription; busy = false }
    }
}
