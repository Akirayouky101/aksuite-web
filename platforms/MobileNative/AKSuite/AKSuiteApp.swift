import SwiftUI
import UIKit

@main
struct AKSuiteApp: App {
    @StateObject private var auth = AuthViewModel()
    @UIApplicationDelegateAdaptor(PushNotificationManager.self) private var pushNotifications

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(auth)
                .environmentObject(pushNotifications)
                .task(id: auth.session?.user.id) {
                    if let userID = auth.session?.user.id {
                        await pushNotifications.registerDevice(for: userID)
                    }
                }
        }
    }
}
