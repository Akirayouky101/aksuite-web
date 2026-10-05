import Foundation
import UIKit
import UserNotifications

enum PushDestination: Equatable {
    case call(UUID)
    case note(UUID)
    case payment(UUID)
    case calendar(UUID)
    case calendarConfirmation(UUID, String)
}

@MainActor
final class PushNotificationManager: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate, ObservableObject {
    static weak var shared: PushNotificationManager?
    @Published var pendingDestination: PushDestination?
    @Published var errorMessage: String?
    private var pendingDeviceToken: String?
    private var registeredUserID: UUID?
    private struct Device: Encodable {
        let user_id: UUID
        let device_token: String
        let platform = "ios"
        let event_confirmations = true
    }

    override init() {
        super.init()
        Self.shared = self
    }

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        center.setNotificationCategories([UNNotificationCategory(
            identifier: "EVENT_CONFIRMATION",
            actions: [
                UNNotificationAction(identifier: "complete", title: "Sì, completato", options: [.foreground, .authenticationRequired]),
                UNNotificationAction(identifier: "reschedule", title: "No, riprogramma", options: [.foreground, .authenticationRequired]),
            ], intentIdentifiers: []
        )])
        UIApplication.shared.applicationIconBadgeNumber = 0
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        pendingDeviceToken = deviceToken.map { String(format: "%02x", $0) }.joined()
        Task { await persistPendingToken() }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("APNs registration failed: \(error.localizedDescription)")
        errorMessage = "Registrazione notifiche non riuscita: \(error.localizedDescription)"
    }

    func registerDevice(for userID: UUID) async {
        registeredUserID = userID
        errorMessage = nil
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()

        switch settings.authorizationStatus {
        case .notDetermined:
            do {
                let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
                print("Push permission granted: \(granted)")
                if granted { UIApplication.shared.registerForRemoteNotifications() }
            } catch {
                print("Push permission request failed: \(error.localizedDescription)")
                errorMessage = "Richiesta permesso notifiche non riuscita."
            }
        case .authorized, .provisional, .ephemeral:
            UIApplication.shared.registerForRemoteNotifications()
        case .denied:
            print("Push permission denied. Enable notifications in iOS Settings.")
            errorMessage = "Permesso notifiche negato. Abilitalo nelle Impostazioni."
        @unknown default:
            break
        }
        await persistPendingToken()
    }

    func scheduleFollowUp(callID: UUID, callerName: String, date: Date) {
        schedule(id: "call-follow-up-\(callID.uuidString)", destination: "call", itemID: callID, title: "Richiamo tra 15 minuti", body: "Preparati a richiamare \(callerName).", date: date.addingTimeInterval(-15 * 60))
    }

    func scheduleCalendarEvent(eventID: UUID, title: String, date: Date) {
        schedule(id: "calendar-event-\(eventID.uuidString)", destination: "calendar", itemID: eventID, title: "Evento in programma", body: title, date: date)
    }

    func scheduleNote(noteID: UUID, title: String, date: Date) {
        schedule(id: "note-\(noteID.uuidString)", destination: "note", itemID: noteID, title: "Nota", body: title, date: date)
    }

    func schedulePayment(paymentID: UUID, title: String, date: Date) {
        schedule(id: "payment-\(paymentID.uuidString)", destination: "payment", itemID: paymentID, title: "Pagamento in scadenza", body: title, date: date)
    }

    private func schedule(id: String, destination: String, itemID: UUID, title: String, body: String, date: Date) {
        guard date > .now else { return }
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.userInfo = ["destination": destination, "id": itemID.uuidString]
        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request) { error in
            if let error { print("Unable to schedule follow-up notification: \(error.localizedDescription)") }
        }
    }

    func cancelFollowUp(callID: UUID) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["call-follow-up-\(callID.uuidString)"])
    }

    func cancelCalendarEvent(eventID: UUID) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["calendar-event-\(eventID.uuidString)"])
    }

    func cancelNote(noteID: UUID) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["note-\(noteID.uuidString)"])
    }

    func cancelPayment(paymentID: UUID) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ["payment-\(paymentID.uuidString)"])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        let userInfo = response.notification.request.content.userInfo
        guard let destination = userInfo["destination"] as? String,
              let identifier = userInfo["id"] as? String,
              let id = UUID(uuidString: identifier) else { return }
        switch destination {
        case "call": pendingDestination = .call(id)
        case "note": pendingDestination = .note(id)
        case "payment": pendingDestination = .payment(id)
        case "calendar": pendingDestination = .calendar(id)
        case "calendar-confirmation": pendingDestination = .calendarConfirmation(id, response.actionIdentifier)
        default: break
        }
    }

    private func persistPendingToken() async {
        guard let userID = registeredUserID, let deviceToken = pendingDeviceToken else { return }
        do {
            try await SupabaseService.shared
                .from("push_devices")
                .upsert(Device(user_id: userID, device_token: deviceToken), onConflict: "user_id,device_token")
                .execute()
        } catch {
            print("Unable to save APNs device token: \(error.localizedDescription)")
            errorMessage = "Impossibile registrare il dispositivo sul server. Riprova."
        }

    }

    func unregisterDevice() async throws {
        if let userID = registeredUserID, let token = pendingDeviceToken {
            try await SupabaseService.shared.from("push_devices").delete()
                .eq("user_id", value: userID.uuidString).eq("device_token", value: token).execute()
        }
        registeredUserID = nil
        pendingDestination = nil
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
}