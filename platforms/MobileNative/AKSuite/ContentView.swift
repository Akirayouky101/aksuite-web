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
    @State private var completeInitialCalendarEvent = false
    @State private var calendarPresentationID = UUID()
    @State private var initialWorkClientID: UUID?
    @State private var initialTodoClientID: UUID?
    @State private var returnClientID: UUID?
    @State private var showGlobalSearch = false
    @State private var initialTodoID: UUID?
    @State private var initialWorkID: UUID?
    @State private var sidebarVisible = true
    @State private var createInSection: AppSection?

    private var dashboard: some View {
        OperationalDashboardView(onNavigate: navigate, onOpen: { kind, id in
            switch kind {
            case "event": navigate("calendar"); initialCalendarID = id
            case "todo": navigate("todos"); initialTodoID = id
            case "work_item": navigate("work_items"); initialWorkID = id
            case "call": navigate("calls"); initialCallID = id
            case "payment": navigate("payments"); initialPaymentID = id
            default: break
            }
        }, onCreate: { kind in
            let destination: AppSection = kind == "event" ? .calendar : kind == "todo" ? .todos : .notes
            navigate(destination.rawValue)
            createInSection = destination
        })
    }

    private func navigate(_ id: String) {
        guard let destination = AppSection(rawValue: id) else { return }
        initialCallID = nil; initialNoteID = nil; initialPasswordID = nil; initialPaymentID = nil
        initialCalendarID = nil; initialCalendarClientID = nil
        initialWorkClientID = nil; initialTodoClientID = nil; initialWorkID = nil; initialTodoID = nil
        initialFollowUpClientID = nil; initialFollowUpDate = nil; initialFollowUpNote = nil
        returnClientID = nil; createInSection = nil
        editInitialCalendarEvent = false; completeInitialCalendarEvent = false
        calendarPresentationID = UUID()
        section = destination
    }

    private var sectionMenu: some View {
        ForEach(AppSection.allCases.filter { $0 != .dashboard }) { destination in
            Button { navigate(destination.rawValue) } label: { Label(destination.title, systemImage: destination.icon) }
        }
    }

    private var sidebar: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 6) {
                Text("AK SUITE").font(.headline).padding(12)
                ForEach(AppSection.allCases.filter { $0 != .dashboard }) { destination in
                    Button { navigate(destination.rawValue) } label: {
                        Label(destination.title, systemImage: destination.icon)
                            .font(.subheadline.weight(.semibold)).padding(12).frame(maxWidth: .infinity, alignment: .leading)
                            .background(section == destination || (destination == .today && section == .dashboard) ? Color(hex: "#f8dfb9") : .clear)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }.buttonStyle(.plain)
                }
            }.padding(12)
        }.frame(width: 220).background(Color(hex: "#fff8ed"))
    }

    var body: some View {
        Group {
            if auth.isLoading {
                ProgressView()
            } else if auth.session != nil {
                GeometryReader { geometry in
                    HStack(spacing: 0) {
                        if geometry.size.width >= 760 && sidebarVisible { sidebar }
                        VStack(spacing: 0) {
                            HStack {
                                if geometry.size.width >= 760 {
                                    Button { sidebarVisible.toggle() } label: { Image(systemName: "sidebar.left") }.accessibilityLabel("Mostra o nascondi menu sezioni")
                                } else {
                                    Menu { sectionMenu } label: { Label("Sezioni", systemImage: "line.3.horizontal") }
                                }
                                Text(section.title).font(.headline)
                                Spacer()
                                Button { showGlobalSearch = true } label: { Image(systemName: "magnifyingglass") }.accessibilityLabel("Ricerca globale")
                                Menu {
                                    Button("Esci", role: .destructive) { Task { await auth.signOut() } }
                                } label: { Image(systemName: "person.crop.circle") }.accessibilityLabel("Account")
                            }.padding(14).background(Color(hex: "#fff8ed"))
                            Group {
                switch section {
                case .today, .dashboard:
                    dashboard
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
                        completeInitialEvent: completeInitialCalendarEvent,
                        createNewEvent: createInSection == .calendar,
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
                            completeInitialCalendarEvent = false
                        },
                        onReturnToClient: {
                            if let clientID = initialCalendarClientID {
                                returnClientID = clientID
                                section = .clients
                            }
                            initialCalendarID = nil
                            initialCalendarClientID = nil
                            editInitialCalendarEvent = false
                            completeInitialCalendarEvent = false
                        }
                    )
                    .id(calendarPresentationID)
                case .notes:
                    NotesWorkspaceView(initialNoteID: initialNoteID, createNewNote: createInSection == .notes, onBack: { createInSection = nil; section = .dashboard })
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
                    WorkItemsWorkspaceView(mode: "work", initialClientID: initialWorkClientID, onBack: { returnClientID = initialWorkClientID; section = initialWorkClientID == nil ? .dashboard : .clients; initialWorkClientID = nil; initialWorkID = nil }, initialItemID: initialWorkID)
                case .todos:
                    WorkItemsWorkspaceView(mode: "todo", initialClientID: initialTodoClientID, onBack: { returnClientID = initialTodoClientID; section = initialTodoClientID == nil ? .dashboard : .clients; initialTodoClientID = nil; initialTodoID = nil; createInSection = nil }, initialItemID: initialTodoID, createNewItem: createInSection == .todos)
                case .photos:
                    NativeGalleryWorkspace(onBack: { section = .dashboard }).id(auth.session?.user.id)
                case .shopping:
                    ShoppingWorkspaceView(onBack: { section = .dashboard }).id(auth.session?.user.id)
                }
                            }.frame(maxWidth: .infinity, maxHeight: .infinity)
                        }.frame(maxWidth: .infinity)
                    }
                }
            } else {
                LoginView()
            }
        }
        .id(auth.session?.user.id)
        .onChange(of: section) { destination in
            if createInSection != destination { createInSection = nil }
        }
        .onChange(of: pushNotifications.pendingDestination) { destination in
            guard let destination else { return }
            createInSection = nil
            switch destination {
            case .call(let id): initialCallID = id; section = .calls
            case .note(let id): initialNoteID = id; section = .notes
            case .payment(let id): initialPaymentID = id; section = .payments
            case .calendar(let id): initialCalendarID = id; editInitialCalendarEvent = false; completeInitialCalendarEvent = false; section = .calendar
            case .calendarConfirmation(let id, let action):
                initialCalendarID = id; editInitialCalendarEvent = action == "reschedule"; completeInitialCalendarEvent = action == "complete"; section = .calendar
            }
            calendarPresentationID = UUID()
            pushNotifications.pendingDestination = nil
        }
        .sheet(isPresented: $showGlobalSearch) { GlobalSearchView { type, id in switch type { case "call": initialCallID = id; section = .calls; case "note": initialNoteID = id; section = .notes; case "event": initialCalendarID = id; initialCalendarClientID = nil; editInitialCalendarEvent = false; completeInitialCalendarEvent = false; section = .calendar; case "todo": initialTodoID = id; section = .todos; case "payment": initialPaymentID = id; section = .payments; case "client": returnClientID = id; section = .clients; default: break } } }
        .alert("Operazione non riuscita", isPresented: Binding(get: { auth.session != nil && auth.errorMessage != nil }, set: { if !$0 { auth.errorMessage = nil } })) {
            Button("OK") { auth.errorMessage = nil }
        } message: { Text(auth.errorMessage ?? "") }
    }
}

private enum AppSection: String, CaseIterable, Identifiable {
    case today
    case dashboard
    case calls
    case calendar
    case notes
    case passwords
    case clients
    case payments
    case workItems = "work_items"
    case todos
    case shopping
    case photos

    var id: String { rawValue }
    var title: String {
        switch self {
        case .today, .dashboard: return "Dashboard"
        case .calls: return "Chiamate"
        case .calendar: return "Calendario"
        case .notes: return "Note"
        case .passwords: return "Password"
        case .clients: return "Rubrica"
        case .payments: return "Pagamenti"
        case .workItems: return "Lavorazioni"
        case .todos: return "Cose da fare"
        case .shopping: return "Spesa"
        case .photos: return "Galleria foto"
        }
    }
    var icon: String {
        switch self {
        case .today, .dashboard: return "square.grid.2x2"
        case .calls: return "phone"
        case .calendar: return "calendar"
        case .notes: return "note.text"
        case .passwords: return "key"
        case .clients: return "person.2"
        case .payments: return "creditcard"
        case .workItems: return "briefcase"
        case .todos: return "checklist"
        case .shopping: return "cart"
        case .photos: return "photo.on.rectangle"
        }
    }
}

#Preview {
    ContentView().environmentObject(AuthViewModel())
}
