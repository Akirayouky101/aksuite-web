import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @EnvironmentObject private var pushNotifications: PushNotificationManager
    @State private var section: AppSection = .today
    @State private var initialCallID: UUID?
    @State private var initialFollowUpClientID: UUID?
    @State private var initialFollowUpDate: Date?
    @State private var initialFollowUpNote: String?
    @State private var initialNoteID: UUID?
    @State private var initialPasswordID: UUID?
    @State private var initialPaymentID: UUID?
    @State private var initialCalendarID: UUID?
    @State private var initialCalendarClientID: UUID?
    @State private var editInitialCalendarEvent = false
    @State private var initialWorkClientID: UUID?
    @State private var initialTodoClientID: UUID?
    @State private var returnClientID: UUID?
    @State private var showGlobalSearch = false

    var body: some View {
        Group {
            if auth.isLoading {
                ProgressView()
            } else if auth.session != nil {
                switch section {
                case .today:
                    ZStack(alignment: .topTrailing) { DashboardView(onOpenCalls: { section = .calls }, onOpenCalendar: { section = .calendar }, onOpenNotes: { section = .notes }, onOpenPasswords: { section = .passwords }, onOpenClients: { returnClientID = nil; section = .clients }, onOpenPayments: { section = .payments }, onOpenWorkItems: { section = .workItems }, onOpenTodos: { section = .todos }); Button { showGlobalSearch = true } label: { Image(systemName: "magnifyingglass").padding(12).background(.white.opacity(0.85)).clipShape(Circle()) }.padding(20) }
                case .dashboard:
                    DashboardView(onOpenCalls: { section = .calls }, onOpenCalendar: { section = .calendar }, onOpenNotes: { section = .notes }, onOpenPasswords: { section = .passwords }, onOpenClients: { returnClientID = nil; section = .clients }, onOpenPayments: { section = .payments }, onOpenWorkItems: { section = .workItems }, onOpenTodos: { section = .todos })
                case .calls:
                    CallsView(initialCallID: initialCallID, initialClientID: initialFollowUpClientID, initialFollowUpDate: initialFollowUpDate, initialFollowUpNote: initialFollowUpNote, onBack: {
                        if let clientID = initialFollowUpClientID {
                            returnClientID = clientID
                            section = .clients
                        } else {
                            section = .dashboard
                        }
                        initialFollowUpClientID = nil
                        initialFollowUpDate = nil
                        initialFollowUpNote = nil
                    })
                case .calendar:
                    CalendarWorkspaceView(
                        initialEventID: initialCalendarID,
                        initialClientID: initialCalendarClientID,
                        editInitialEvent: editInitialCalendarEvent,
                        onBack: {
                            if let clientID = initialCalendarClientID {
                                returnClientID = clientID
                                section = .clients
                            } else {
                                section = .dashboard
                            }
                            initialCalendarID = nil
                            initialCalendarClientID = nil
                            editInitialCalendarEvent = false
                        },
                        onReturnToClient: {
                            if let clientID = initialCalendarClientID {
                                returnClientID = clientID
                                section = .clients
                            }
                            initialCalendarID = nil
                            initialCalendarClientID = nil
                            editInitialCalendarEvent = false
                        }
                    )
                case .notes:
                    NotesWorkspaceView(initialNoteID: initialNoteID, onBack: { section = .dashboard })
                case .passwords:
                    PasswordsWorkspaceView(initialPasswordID: initialPasswordID, onBack: { section = .dashboard })
                case .clients:
                    ClientsWorkspaceView(initialClientID: returnClientID, onBack: { returnClientID = nil; section = .dashboard }, onOpenWorkItems: { id in returnClientID = nil; initialWorkClientID = id; section = .workItems }, onOpenTodos: { id in returnClientID = nil; initialTodoClientID = id; section = .todos }, onOpenAppointment: { clientID, eventID in
                        returnClientID = clientID
                        initialCalendarClientID = clientID
                        initialCalendarID = eventID
                        editInitialCalendarEvent = eventID != nil
                        section = .calendar
                    }, onOpenFollowUp: { clientID, title, appointmentDate in
                        var followUpDate = Calendar.current.date(byAdding: .day, value: 1, to: appointmentDate) ?? .now
                        if followUpDate <= .now { followUpDate = Calendar.current.date(byAdding: .day, value: 1, to: .now) ?? .now }
                        followUpDate = Calendar.current.date(bySettingHour: 9, minute: 0, second: 0, of: followUpDate) ?? followUpDate
                        returnClientID = clientID
                        initialFollowUpClientID = clientID
                        initialFollowUpDate = followUpDate
                        initialFollowUpNote = "Richiamo dopo l'appuntamento: \(title)"
                        section = .calls
                    })
                case .payments:
                    PaymentsWorkspaceView(initialPaymentID: initialPaymentID, onBack: { section = .dashboard })
                case .workItems:
                    WorkItemsWorkspaceView(mode: "work", initialClientID: initialWorkClientID, onBack: { returnClientID = initialWorkClientID; section = initialWorkClientID == nil ? .dashboard : .clients; initialWorkClientID = nil })
                case .todos:
                    WorkItemsWorkspaceView(mode: "todo", initialClientID: initialTodoClientID, onBack: { returnClientID = initialTodoClientID; section = initialTodoClientID == nil ? .dashboard : .clients; initialTodoClientID = nil })
                }
            } else {
                LoginView()
            }
        }
        .onChange(of: pushNotifications.pendingDestination) { destination in
            guard let destination else { return }
            switch destination {
            case .call(let id): initialCallID = id; section = .calls
            case .note(let id): initialNoteID = id; section = .notes
            case .payment(let id): initialPaymentID = id; section = .payments
            case .calendar(let id): initialCalendarID = id; section = .calendar
            }
            pushNotifications.pendingDestination = nil
        }
        .sheet(isPresented: $showGlobalSearch) { GlobalSearchView { type, id in switch type { case "call": initialCallID = id; section = .calls; case "note": initialNoteID = id; section = .notes; case "event": initialCalendarID = id; section = .calendar; case "payment": initialPaymentID = id; section = .payments; case "client": section = .clients; default: break } } }
    }
}

private enum AppSection {
    case today
    case dashboard
    case calls
    case calendar
    case notes
    case passwords
    case clients
    case payments
    case workItems
    case todos
}

#Preview {
    ContentView().environmentObject(AuthViewModel())
}
