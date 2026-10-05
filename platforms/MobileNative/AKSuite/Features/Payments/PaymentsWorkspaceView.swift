import SwiftUI

private struct NativePaymentPayer: Codable, Equatable {
    var name: String
    var percentage: Double
}

private struct NativePaymentInstallment: Codable, Equatable {
    var dueDate: String?
    var payerPayments: [NativePaymentPayerPayment]
    var amount: Double?
    var paidAt: String?

    enum CodingKeys: String, CodingKey {
        case amount
        case dueDate = "due_date"
        case payerPayments = "payer_payments"
        case paidAt = "paid_at"
    }
}

private struct NativePaymentPayerPayment: Codable, Equatable {
    var payerName: String
    var paidAt: String?
    var advancedByMe: Bool?
    var reimbursedAt: String?

    enum CodingKeys: String, CodingKey {
        case payerName = "payer_name"
        case paidAt = "paid_at"
        case advancedByMe = "advanced_by_me"
        case reimbursedAt = "reimbursed_at"
    }
}

private struct NativePayment: Codable, Identifiable, Equatable {
    let id: UUID
    var paymentType: String
    var recipient: String
    var reason: String
    var isInstallment: Bool
    var paymentMode: String
    var salaryPercentage: Double
    var totalAmount: Double
    var downPayment: Double
    var installmentAmount: Double
    var installmentsCount: Int
    var paidInstallments: [Int]
    var payers: [NativePaymentPayer]
    var notes: String
    var downPaymentDueDate: String?
    var reminderAt: String?
    var recurrenceType: String?
    var downPaymentPaidAt: String?
    var downPaymentPayerPayments: [NativePaymentPayerPayment]
    var installmentSchedule: [NativePaymentInstallment]

    enum CodingKeys: String, CodingKey {
        case id, reason, payers, notes
        case paymentType = "payment_type"
        case recipient, isInstallment = "is_installment", paymentMode = "payment_mode"
        case salaryPercentage = "salary_percentage", totalAmount = "total_amount"
        case downPayment = "down_payment", installmentAmount = "installment_amount"
        case installmentsCount = "installments_count", paidInstallments = "paid_installments"
        case downPaymentDueDate = "down_payment_due_date", reminderAt = "reminder_at", recurrenceType = "recurrence_type", downPaymentPaidAt = "down_payment_paid_at"
        case downPaymentPayerPayments = "down_payment_payer_payments"
        case installmentSchedule = "installment_schedule"
    }

    var installmentCount: Int { installmentSchedule.isEmpty ? installmentsCount : installmentSchedule.count }

    var paidAmount: Double {
        let down: Double
        if payers.isEmpty {
            down = downPaymentPaidAt == nil ? 0 : downPayment
        } else {
            down = payers.reduce(0) { total, payer in
                let isPaid = downPaymentPayerPayments.contains { $0.payerName == payer.name && $0.paidAt != nil }
                return total + (isPaid ? downPayment * payer.percentage / 100 : 0)
            }
        }
        let hasVariableRows = payers.isEmpty && installmentSchedule.contains { ($0.amount ?? 0) > 0 }
        if paymentMode == "salary_withholding" || hasVariableRows {
            return down + installmentSchedule.reduce(0) { $0 + ($1.amount ?? 0) }
        }
        guard !payers.isEmpty else {
            return down + Double(paidInstallments.count) * installmentAmount
        }
        let installments = payers.reduce(0) { total, payer in
            let paidCount = installmentSchedule.filter { installment in
                installment.payerPayments.contains { $0.payerName == payer.name && $0.paidAt != nil }
            }.count
            return total + Double(paidCount) * installmentAmount * payer.percentage / 100
        }
        return down + installments
    }

    var balance: Double { max(0, totalAmount - paidAmount) }
}

private struct NativePaymentPayload: Encodable {
    let paymentType: String
    let recipient: String
    let reason: String
    let isInstallment: Bool
    let paymentMode: String
    let salaryPercentage: Double
    let totalAmount: Double
    let downPayment: Double
    let installmentAmount: Double
    let installmentsCount: Int
    let paidInstallments: [Int]
    let payers: [NativePaymentPayer]
    let notes: String
    let downPaymentDueDate: String?
    let reminderAt: String?
    let recurrenceType: String?
    let downPaymentPaidAt: String?
    let downPaymentPayerPayments: [NativePaymentPayerPayment]
    let installmentSchedule: [NativePaymentInstallment]
    var userID: UUID?

    enum CodingKeys: String, CodingKey {
        case reason, payers, notes
        case paymentType = "payment_type", recipient, isInstallment = "is_installment", paymentMode = "payment_mode"
        case salaryPercentage = "salary_percentage", totalAmount = "total_amount", downPayment = "down_payment"
        case installmentAmount = "installment_amount", installmentsCount = "installments_count", paidInstallments = "paid_installments"
        case downPaymentDueDate = "down_payment_due_date", reminderAt = "reminder_at", recurrenceType = "recurrence_type", downPaymentPaidAt = "down_payment_paid_at"
        case downPaymentPayerPayments = "down_payment_payer_payments", installmentSchedule = "installment_schedule"
        case userID = "user_id"
    }
}

struct PaymentsWorkspaceView: View {
    @EnvironmentObject private var auth: AuthViewModel
    let initialPaymentID: UUID?
    let onBack: () -> Void
    @State private var payments: [NativePayment] = []
    @State private var query = ""
    @State private var selectedMode = "all"
    @State private var selectedStatus = "all"
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showEditor = false
    @State private var editingPayment: NativePayment?
    @State private var selectedPayment: NativePayment?
    @State private var paymentToDelete: NativePayment?
    private let paymentColumns = [GridItem(.adaptive(minimum: 300, maximum: 440), spacing: 12, alignment: .top)]

    init(initialPaymentID: UUID? = nil, onBack: @escaping () -> Void) {
        self.initialPaymentID = initialPaymentID
        self.onBack = onBack
    }

    private var filteredPayments: [NativePayment] {
        payments.filter { payment in
            (query.isEmpty || "\(payment.paymentType) \(payment.recipient) \(payment.reason) \(payment.notes)".localizedCaseInsensitiveContains(query)) &&
            (selectedMode == "all" || payment.paymentMode == selectedMode) &&
            (selectedStatus == "all" || (selectedStatus == "due" ? payment.balance > 0 : payment.balance == 0))
        }
    }

    private var outstandingPaymentsCount: Int { payments.filter { $0.balance > 0 }.count }
    private var completedPaymentsCount: Int { payments.count - outstandingPaymentsCount }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "#efe8d8").ignoresSafeArea()
                if isLoading { ProgressView("Caricamento pagamenti...") } else { content }
            }
            .platformNavigationBarTitleDisplayMode()
            .toolbar {
                ToolbarItem(placement: .akLeading) { Button(action: onBack) { Image(systemName: "chevron.left") }.accessibilityLabel("Dashboard") }
                ToolbarItem(placement: .principal) { Text("PAGAMENTI").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")) }
                ToolbarItem(placement: .akTrailing) { Button { editingPayment = nil; showEditor = true } label: { Image(systemName: "plus") }.accessibilityLabel("Nuovo pagamento") }
            }
        }
        .task { await loadPayments() }
        .overlay {
            if showEditor {
                PaymentEditorView(payment: editingPayment, onClose: { withAnimation(.easeOut(duration: 0.2)) { showEditor = false } }, onSave: savePayment)
                    .platformModalWidth(compact: 380, regular: 860)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            }
        }
        .overlay {
            if let payment = selectedPayment {
                PaymentDetailView(payment: payment, onClose: { withAnimation(.easeOut(duration: 0.2)) { selectedPayment = nil } }, onEdit: { selectedPayment = nil; editingPayment = payment; showEditor = true }, onDelete: { paymentToDelete = payment })
                    .platformModalWidth(compact: 360, regular: 760)
                    .shadow(color: Color.black.opacity(0.18), radius: 24, y: 10)
                    .transition(.asymmetric(insertion: .scale(scale: 0.88).combined(with: .opacity), removal: .scale(scale: 0.94).combined(with: .opacity)))
            }
        }
        .confirmationDialog("Eliminare questo pagamento?", isPresented: Binding(get: { paymentToDelete != nil }, set: { if !$0 { paymentToDelete = nil } }), titleVisibility: .visible) {
            Button("Elimina", role: .destructive) { if let payment = paymentToDelete { Task { await delete(payment) } } }
        } message: { Text(paymentToDelete?.paymentType ?? "") }
    }

    private var content: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 15) {
                header
                HStack(spacing: 9) {
                    Image(systemName: "magnifyingglass").foregroundStyle(Color(hex: "#8a7f9f"))
                    TextField("Cerca pagamenti...", text: $query).platformNoAutocapitalization()
                    Menu { Picker("Modalità", selection: $selectedMode) { Text("Tutti").tag("all"); Text("Pagamenti fissi").tag("fixed"); Text("Trattenute").tag("salary_withholding") } } label: { Image(systemName: "line.3.horizontal.decrease").foregroundStyle(Color(hex: "#716a91")) }
                }.padding(13).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 14))
                Picker("Stato pagamento", selection: $selectedStatus) {
                    Text("Tutti \(payments.count)").tag("all")
                    Text("Da pagare \(outstandingPaymentsCount)").tag("due")
                    Text("Completati \(completedPaymentsCount)").tag("completed")
                }
                .pickerStyle(.segmented)
                .tint(Color(hex: "#3d8be8"))
                if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                if filteredPayments.isEmpty { emptyState } else {
                    LazyVGrid(columns: paymentColumns, spacing: 12) {
                        ForEach(filteredPayments) { payment in
                            PaymentRow(payment: payment, onOpen: { withAnimation(.spring(response: 0.34, dampingFraction: 0.82)) { selectedPayment = payment } }, onEdit: { editingPayment = payment; showEditor = true }, onDelete: { paymentToDelete = payment })
                        }
                    }
                }
            }.padding(16)
        }.refreshable { await loadPayments() }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("SCADENZE E USCITE").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#376db5"))
                Text("I tuoi pagamenti").font(.title2.weight(.black)).foregroundStyle(Color(hex: "#2d2754"))
                Text("\(filteredPayments.count) registrati").font(.caption).foregroundStyle(Color(hex: "#716a91"))
            }
            HStack(spacing: 9) {
                paymentSummary("Totale", payments.reduce(0) { $0 + $1.totalAmount }, "#2d2754")
                paymentSummary("Da saldare", payments.reduce(0) { $0 + $1.balance }, "#e45f4e")
            }
        }.padding(18).frame(maxWidth: .infinity, alignment: .leading).background(Color(hex: "#d9e9ff")).clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private func paymentSummary(_ title: String, _ amount: Double, _ color: String) -> some View { VStack(alignment: .leading, spacing: 3) { Text(title).font(.caption2.weight(.bold)).foregroundStyle(Color(hex: "#716a91")); Text(amount, format: .currency(code: "EUR")).font(.headline.weight(.black)).foregroundStyle(Color(hex: color)) }.frame(maxWidth: .infinity, alignment: .leading) }
    private var emptyState: some View { VStack(spacing: 9) { Image(systemName: "creditcard.fill").font(.system(size: 32)).foregroundStyle(Color(hex: "#376db5")); Text("Nessun pagamento trovato").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")); Button("Registra pagamento") { editingPayment = nil; showEditor = true }.font(.caption.weight(.bold)).foregroundStyle(Color(hex: "#376db5")) }.frame(maxWidth: .infinity).padding(30).background(Color(hex: "#fff8ed")).clipShape(RoundedRectangle(cornerRadius: 18)) }

    private func loadPayments() async { isLoading = true; defer { isLoading = false }; do { payments = try await SupabaseService.shared.from("payments").select().order("created_at", ascending: false).execute().value; payments.forEach(scheduleReminder); if let initialPaymentID, let payment = payments.first(where: { $0.id == initialPaymentID }) { selectedPayment = payment } } catch { errorMessage = "Impossibile caricare i pagamenti." } }
    private func savePayment(_ payload: NativePaymentPayload, _ existing: NativePayment?) async throws {
        if let existing { let updated: NativePayment = try await SupabaseService.shared.from("payments").update(payload).eq("id", value: existing.id.uuidString).select().single().execute().value; payments = payments.map { $0.id == updated.id ? updated : $0 }; scheduleReminder(for: updated) }
        else { guard let userID = auth.session?.user.id else { throw PaymentSaveError.missingUser }; var insert = payload; insert.userID = userID; let created: NativePayment = try await SupabaseService.shared.from("payments").insert(insert).select().single().execute().value; payments.insert(created, at: 0); scheduleReminder(for: created) }
    }

    private func scheduleReminder(for payment: NativePayment) {
        guard let manager = PushNotificationManager.shared else { return }
        if let reminderAt = payment.reminderAt, let date = ISO8601DateFormatter().date(from: reminderAt), date > .now {
            manager.schedulePayment(paymentID: payment.id, title: "\(payment.paymentType) · \(payment.recipient)", date: date)
            return
        }
        let dateValue = payment.downPaymentDueDate ?? payment.installmentSchedule.first?.dueDate
        guard let dateValue, let date = DateFormatter.paymentDate.date(from: dateValue) else { manager.cancelPayment(paymentID: payment.id); return }
        manager.schedulePayment(paymentID: payment.id, title: "\(payment.paymentType) · \(payment.recipient)", date: Calendar.current.startOfDay(for: date).addingTimeInterval(9 * 60 * 60))
    }
    private func delete(_ payment: NativePayment) async { do { try await SupabaseService.shared.from("payments").delete().eq("id", value: payment.id.uuidString).execute(); payments.removeAll { $0.id == payment.id }; selectedPayment = nil } catch { errorMessage = "Impossibile eliminare il pagamento." } }
}

private extension DateFormatter {
    static let paymentDate: DateFormatter = { let formatter = DateFormatter(); formatter.dateFormat = "yyyy-MM-dd"; formatter.locale = Locale(identifier: "en_US_POSIX"); formatter.calendar = Calendar(identifier: .iso8601); return formatter }()
}

private enum PaymentSaveError: Error { case missingUser }

private struct PaymentRow: View {
    let payment: NativePayment; let onOpen: () -> Void; let onEdit: () -> Void; let onDelete: () -> Void

    private var installmentDescription: String {
        guard payment.isInstallment else { return "Pagamento singolo" }
        let count = payment.installmentCount
        let mode = payment.paymentMode == "salary_withholding" ? "Trattenuta stipendio" : "Rate fisse"
        return "\(mode) · \(count) \(count == 1 ? "rata" : "rate")"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "creditcard.fill")
                    .font(.title3)
                    .foregroundStyle(Color(hex: "#376db5"))
                    .frame(width: 42, height: 42)
                    .background(Color(hex: "#d9e9ff"))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                VStack(alignment: .leading, spacing: 3) {
                    Text(payment.paymentType)
                        .font(.subheadline.weight(.black))
                        .foregroundStyle(Color(hex: "#2d2754"))
                        .lineLimit(1)
                    Text("A \(payment.recipient)")
                        .font(.caption)
                        .foregroundStyle(Color(hex: "#716a91"))
                        .lineLimit(1)
                }
                Spacer(minLength: 4)
                Menu {
                    Button("Modifica", action: onEdit)
                    Button("Elimina", role: .destructive, action: onDelete)
                } label: {
                    Image(systemName: "ellipsis")
                        .foregroundStyle(Color(hex: "#716a91"))
                        .frame(width: 36, height: 36)
                        .contentShape(Rectangle())
                }
            }

            HStack(spacing: 6) {
                Text(installmentDescription)
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(Color(hex: "#376db5"))
                    .lineLimit(1)
                Spacer(minLength: 4)
                Text(payment.balance > 0 ? "Da saldare" : "Saldato")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(payment.balance > 0 ? Color(hex: "#e45f4e") : Color(hex: "#257259"))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(payment.balance > 0 ? Color(hex: "#fff0e9") : Color(hex: "#d9e8d9"))
                    .clipShape(Capsule())
            }

            Rectangle()
                .fill(Color(hex: "#ead8bf"))
                .frame(height: 1)

            HStack(spacing: 6) {
                amountMetric("Totale", value: payment.totalAmount, color: "#2d2754", alignment: .leading)
                amountMetric("Pagato", value: payment.paidAmount, color: "#257259", alignment: .center)
                amountMetric("Manca", value: payment.balance, color: "#e45f4e", alignment: .trailing)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "#fff8ed"))
        .overlay(RoundedRectangle(cornerRadius: 15).stroke(Color(hex: "#d1e1f5"), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 15))
        .contentShape(RoundedRectangle(cornerRadius: 15))
        .onTapGesture(perform: onOpen)
    }

    private func amountMetric(_ title: String, value: Double, color: String, alignment: Alignment) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(Color(hex: "#716a91"))
                .frame(maxWidth: .infinity, alignment: alignment)
            Text(value, format: .currency(code: "EUR"))
                .font(.subheadline.weight(.black))
                .foregroundStyle(Color(hex: color))
                .lineLimit(1)
                .minimumScaleFactor(0.75)
                .frame(maxWidth: .infinity, alignment: alignment)
        }
    }
}

private struct PaymentDetailView: View {
    let payment: NativePayment; let onClose: () -> Void; let onEdit: () -> Void; let onDelete: () -> Void
    var body: some View { VStack(alignment: .leading, spacing: 18) { HStack { Image(systemName: "creditcard.fill").font(.title3).foregroundStyle(Color(hex: "#376db5")).frame(width: 48, height: 48).background(Color(hex: "#d9e9ff")).clipShape(RoundedRectangle(cornerRadius: 13)); VStack(alignment: .leading) { Text(payment.paymentType).font(.title3.weight(.black)).foregroundStyle(Color(hex: "#2d2754")); Text("A \(payment.recipient)").font(.caption).foregroundStyle(Color(hex: "#716a91")) }; Spacer(); Button(action: onClose) { Image(systemName: "xmark") } }.foregroundStyle(Color(hex: "#716a91")); detail("TOTALE", payment.totalAmount.formatted(.currency(code: "EUR"))); detail("PAGATO", payment.paidAmount.formatted(.currency(code: "EUR"))); detail("DA SALDARE", payment.balance.formatted(.currency(code: "EUR"))); if !payment.reason.isEmpty { detail("CAUSALE", payment.reason) }; if payment.isInstallment { detail("MODALITÀ", payment.paymentMode == "salary_withholding" ? "Trattenuta stipendio · \(payment.salaryPercentage.formatted())% · \(payment.installmentCount) rate" : "A rate · \(payment.installmentCount) rate") }; if !payment.notes.isEmpty { detail("NOTE", payment.notes) }; HStack(spacing: 12) { Button("Modifica", action: onEdit).buttonStyle(.borderedProminent).tint(Color(hex: "#3d8be8")); Button("Elimina", role: .destructive, action: onDelete).buttonStyle(.bordered) }.frame(maxWidth: .infinity).padding(.top, 2) }.padding(22).frame(maxWidth: .infinity, alignment: .leading).background(Color(hex: "#fffdf9")).clipShape(RoundedRectangle(cornerRadius: 24)).padding(16) }
    private func detail(_ label: String, _ value: String) -> some View { VStack(alignment: .leading, spacing: 6) { Text(label).font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f")); Text(value).font(.body).foregroundStyle(Color(hex: "#2d2754")).frame(maxWidth: .infinity, alignment: .leading).padding(13).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 12)) } }
}

private struct PaymentEditorView: View {
    let payment: NativePayment?
    let onClose: () -> Void
    let onSave: (NativePaymentPayload, NativePayment?) async throws -> Void
    @State private var paymentType = ""; @State private var recipient = ""; @State private var reason = ""; @State private var totalAmount = ""; @State private var downPayment = ""; @State private var isInstallment = false; @State private var paymentMode = "fixed"; @State private var salaryPercentage = "20"; @State private var installmentCount = "1"; @State private var dueDate = ""; @State private var notes = ""; @State private var hasReminder = false; @State private var reminderDate = Date.now.addingTimeInterval(60 * 60); @State private var recurrenceType = ""; @State private var isMarkedPaid = false; @State private var paidDate = Date.now; @State private var isSaving = false; @State private var errorMessage: String?
    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: "creditcard.fill").foregroundStyle(.white).font(.title3).frame(width: 42, height: 42).background(Color(hex: "#3d8be8")).clipShape(RoundedRectangle(cornerRadius: 13))
                VStack(alignment: .leading, spacing: 2) { Text(payment == nil ? "Nuovo pagamento" : "Modifica pagamento").font(.headline.weight(.black)).foregroundStyle(Color(hex: "#2d2754")); Text(payment == nil ? "Registra una nuova uscita" : "Aggiorna i dati salvati").font(.caption).foregroundStyle(Color(hex: "#8a7f9f")) }
                Spacer(); Button(action: onClose) { Image(systemName: "xmark").foregroundStyle(Color(hex: "#8a7f9f")).frame(width: 36, height: 36).background(Color(hex: "#f8e8cf")).clipShape(RoundedRectangle(cornerRadius: 11)) }
            }.padding(18).overlay(alignment: .bottom) { Rectangle().fill(Color(hex: "#ead8bf")).frame(height: 1) }
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    field("TIPO PAGAMENTO", icon: "tag", placeholder: "Es. Affitto, bolletta, acquisto", text: $paymentType)
                    field("DESTINATARIO", icon: "person", placeholder: "A chi è destinato", text: $recipient)
                    field("CAUSALE", icon: "text.alignleft", placeholder: "Descrivi brevemente la spesa", text: $reason)
                    HStack(spacing: 12) { field("IMPORTO TOTALE", icon: "eurosign.circle", placeholder: "0,00", text: $totalAmount); field("ACCONTO", icon: "arrow.down.circle", placeholder: "0,00", text: $downPayment).disabled(!isInstallment || paymentMode == "salary_withholding") }
                    Toggle(isOn: $isInstallment) { Label("Pagamento a rate", systemImage: isInstallment ? "calendar.badge.clock" : "calendar") }.tint(Color(hex: "#3d8be8"))
                    if payment?.isInstallment == false && !isInstallment {
                        VStack(alignment: .leading, spacing: 10) {
                            Toggle(isOn: $isMarkedPaid) {
                                Label("Pagamento saldato", systemImage: isMarkedPaid ? "checkmark.circle.fill" : "circle")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(Color(hex: "#257259"))
                            }
                            .tint(Color(hex: "#5f9e8e"))
                            if isMarkedPaid {
                                DatePicker("Pagato il", selection: $paidDate, displayedComponents: .date)
                                    .datePickerStyle(.compact)
                                    .font(.caption)
                            }
                        }
                        .padding(14)
                        .background(Color(hex: "#d9e8d9"))
                        .clipShape(RoundedRectangle(cornerRadius: 15))
                    }
                    if isInstallment {
                        VStack(alignment: .leading, spacing: 12) {
                            Label("PIANO DI PAGAMENTO", systemImage: "calendar.badge.clock").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                            Picker("Modalità", selection: $paymentMode) { Text("Rate fisse").tag("fixed"); Text("Trattenuta stipendio").tag("salary_withholding") }.pickerStyle(.segmented)
                            if paymentMode == "salary_withholding" { field("PERCENTUALE STIPENDIO", icon: "percent", placeholder: "20", text: $salaryPercentage) }
                            field("NUMERO RATE", icon: "number", placeholder: "1", text: $installmentCount)
                            field("PRIMA SCADENZA", icon: "calendar", placeholder: "AAAA-MM-GG", text: $dueDate)
                        }.padding(14).background(Color(hex: "#f4eddf")).clipShape(RoundedRectangle(cornerRadius: 15))
                    }
                    VStack(alignment: .leading, spacing: 9) {
                        Label("PROMEMORIA", systemImage: "bell").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f"))
                        HStack(spacing: 10) {
                            Button { hasReminder.toggle() } label: {
                                Image(systemName: hasReminder ? "bell.fill" : "bell")
                                    .foregroundStyle(hasReminder ? Color(hex: "#376db5") : Color(hex: "#716a91"))
                                    .frame(width: 42, height: 42)
                                    .background(hasReminder ? Color(hex: "#d9e9ff") : Color(hex: "#f8e8cf"))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                            .accessibilityLabel(hasReminder ? "Disattiva promemoria" : "Attiva promemoria")
                            if hasReminder { DatePicker("", selection: $reminderDate, in: Date.now..., displayedComponents: [.date, .hourAndMinute]).labelsHidden() }
                            else { Text("Tocca la campanella per attivarlo").font(.caption).foregroundStyle(Color(hex: "#716a91")) }
                        }
                        if hasReminder { Picker("Ripetizione", selection: $recurrenceType) { Text("Non ripetere").tag(""); Text("Ogni giorno").tag("daily"); Text("Ogni settimana").tag("weekly"); Text("Ogni mese").tag("monthly"); Text("Ogni anno").tag("yearly") }.pickerStyle(.menu) }
                    }
                    VStack(alignment: .leading, spacing: 7) { Label("NOTE", systemImage: "text.alignleft").font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f")); TextField("Note aggiuntive...", text: $notes, axis: .vertical).lineLimit(3...5).paymentInputStyle() }
                    if let errorMessage { Text(errorMessage).font(.caption).foregroundStyle(Color(hex: "#a9322b")) }
                }.padding(20)
            }
            HStack(spacing: 12) { Button("Annulla", action: onClose).buttonStyle(.bordered).frame(maxWidth: .infinity); Button(isSaving ? "Salvo..." : "Salva pagamento") { Task { await submit() } }.buttonStyle(.borderedProminent).tint(Color(hex: "#3d8be8")).frame(maxWidth: .infinity).disabled(paymentType.trimmingCharacters(in: .whitespaces).isEmpty || recipient.trimmingCharacters(in: .whitespaces).isEmpty || isSaving) }.padding(16).background(Color(hex: "#fffdf9"))
        }.frame(maxHeight: 700).background(Color(hex: "#fffdf9")).clipShape(RoundedRectangle(cornerRadius: 24)).onAppear(perform: load)
    }

    private func field(_ label: String, icon: String, placeholder: String, text: Binding<String>) -> some View { VStack(alignment: .leading, spacing: 7) { Label(label, systemImage: icon).font(.caption2.weight(.black)).foregroundStyle(Color(hex: "#8a7f9f")); TextField(placeholder, text: text).platformNoAutocapitalization().paymentInputStyle() }.frame(maxWidth: .infinity, alignment: .leading) }
    private func load() { guard let payment else { return }; paymentType = payment.paymentType; recipient = payment.recipient; reason = payment.reason; totalAmount = String(payment.totalAmount); downPayment = String(payment.downPayment); isInstallment = payment.isInstallment; paymentMode = payment.paymentMode; salaryPercentage = String(payment.salaryPercentage); installmentCount = String(payment.installmentCount); dueDate = payment.downPaymentDueDate ?? ""; notes = payment.notes; recurrenceType = payment.recurrenceType ?? ""; isMarkedPaid = payment.downPaymentPaidAt != nil; if let paidAt = payment.downPaymentPaidAt, let date = ISO8601DateFormatter().date(from: paidAt) { paidDate = date }; if let reminderAt = payment.reminderAt, let date = ISO8601DateFormatter().date(from: reminderAt) { hasReminder = true; reminderDate = date } }
    private func amount(_ value: String) -> Double { Double(value.replacingOccurrences(of: ",", with: ".")) ?? 0 }
    private func submit() async {
        isSaving = true
        defer { isSaving = false }
        let total = amount(totalAmount)
        let count = max(1, Int(installmentCount) ?? 1)
        let isNewSinglePayment = payment == nil && !isInstallment
        let isExistingSinglePayment = payment?.isInstallment == false && !isInstallment
        let paidAt: String?
        if isNewSinglePayment {
            paidAt = ISO8601DateFormatter().string(from: .now)
        } else if isExistingSinglePayment {
            paidAt = isMarkedPaid ? ISO8601DateFormatter().string(from: paidDate) : nil
        } else {
            paidAt = payment?.downPaymentPaidAt
        }
        let down: Double
        if isNewSinglePayment || isExistingSinglePayment {
            down = paidAt == nil ? 0 : total
        } else {
            down = paymentMode == "salary_withholding" ? 0 : amount(downPayment)
        }
        let installment = isInstallment && paymentMode == "fixed" ? max(0, (total - down) / Double(count)) : 0
        let schedule = isInstallment ? (0..<count).map { index in
            NativePaymentInstallment(dueDate: dueDate.isEmpty ? nil : addMonth(to: dueDate, offset: index), payerPayments: [], amount: nil, paidAt: nil)
        } : []
        let payload = NativePaymentPayload(
            paymentType: paymentType.trimmingCharacters(in: .whitespaces),
            recipient: recipient.trimmingCharacters(in: .whitespaces),
            reason: reason,
            isInstallment: isInstallment,
            paymentMode: paymentMode,
            salaryPercentage: amount(salaryPercentage),
            totalAmount: total,
            downPayment: down,
            installmentAmount: installment,
            installmentsCount: count,
            paidInstallments: [],
            payers: [],
            notes: notes,
            downPaymentDueDate: dueDate.isEmpty ? nil : dueDate,
            reminderAt: hasReminder ? ISO8601DateFormatter().string(from: reminderDate) : nil,
            recurrenceType: hasReminder && !recurrenceType.isEmpty ? recurrenceType : nil,
            downPaymentPaidAt: paidAt,
            downPaymentPayerPayments: [],
            installmentSchedule: schedule,
            userID: nil
        )
        do { try await onSave(payload, payment); onClose() }
        catch { errorMessage = "Impossibile salvare il pagamento." }
    }
    private func addMonth(to value: String, offset: Int) -> String? { let parts = value.split(separator: "-").compactMap { Int($0) }; guard parts.count == 3, let date = Calendar.current.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2])), let next = Calendar.current.date(byAdding: .month, value: offset, to: date) else { return nil }; return next.formatted(.iso8601.year().month().day()) }
}

private extension View {
    func paymentInputStyle() -> some View { self.font(.subheadline).foregroundStyle(Color(hex: "#2d2754")).padding(.horizontal, 13).padding(.vertical, 11).background(Color(hex: "#f8e8cf")).overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(hex: "#e6d3b6"), lineWidth: 1)).clipShape(RoundedRectangle(cornerRadius: 12)) }
}