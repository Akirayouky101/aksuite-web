import SwiftUI
import Speech
import AVFoundation

@MainActor final class NativeDictation: ObservableObject {
    @Published var listening = false
    @Published var starting = false
    @Published var finishing = false
    @Published var error: String?
    private let engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var tapInstalled = false
    private var generation = 0

    func start(onText: @escaping (String) -> Void) async {
        guard !starting && !finishing && !listening else { return }
        starting = true
        defer { starting = false }
        generation += 1
        let ticket = generation
        error = nil
        let permission = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { continuation.resume(returning: $0) }
        }
        guard ticket == generation else { return }
        guard permission == .authorized else { error = "Permesso dettatura negato. Abilitalo nelle Impostazioni."; return }
        let microphone = await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { continuation.resume(returning: $0) }
        }
        guard ticket == generation else { return }
        guard microphone else { error = "Permesso microfono negato. Abilitalo nelle Impostazioni."; return }
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "it-IT")), recognizer.isAvailable else {
            error = "Servizio di dettatura italiano non disponibile. Puoi usare il microfono della tastiera."; return
        }
        do {
            let audio = AVAudioSession.sharedInstance()
            try audio.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audio.setActive(true)
            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = false
            self.request = request
            let input = engine.inputNode
            let format = input.outputFormat(forBus: 0)
            guard format.sampleRate > 0 && format.channelCount > 0 else { throw NativeIntegrationError.message("Microfono non disponibile.") }
            input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in request.append(buffer) }
            tapInstalled = true
            task = recognizer.recognitionTask(with: request) { [weak self] result, failure in
                Task { @MainActor in
                    guard let self, self.generation == ticket else { return }
                    if let result, result.isFinal {
                        let text = result.bestTranscription.formattedString.trimmingCharacters(in: .whitespacesAndNewlines)
                        if !text.isEmpty { onText(text) }
                        self.stop()
                    } else if let failure {
                        self.error = "Dettatura interrotta: \(failure.localizedDescription)"
                        self.stop()
                    }
                }
            }
            engine.prepare()
            try engine.start()
            listening = true
        } catch {
            self.error = error.localizedDescription
            stop()
        }
    }

    func finish() {
        engine.stop()
        request?.endAudio()
        listening = false
        finishing = true
    }

    func stop() {
        generation += 1
        engine.stop()
        if tapInstalled { engine.inputNode.removeTap(onBus: 0); tapInstalled = false }
        request?.endAudio()
        task?.cancel(); task = nil; request = nil; listening = false; finishing = false
        do { try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation) }
        catch { self.error = "Impossibile rilasciare il microfono: \(error.localizedDescription)" }
    }
}

struct NativeDictationButton: View {
    @Binding var text: String
    @StateObject private var dictation = NativeDictation()
    @State private var consent = false
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Button {
                if dictation.listening { dictation.finish() } else { consent = true }
            } label: { Label(dictation.listening ? "Ferma dettatura" : dictation.finishing || dictation.starting ? "Attendere..." : "Detta testo", systemImage: "mic") }
                .disabled(dictation.starting || dictation.finishing)
            if dictation.listening { Text("Microfono attivo. Il testo viene aggiunto senza cancellare quello scritto.").font(.caption) }
            if let error = dictation.error { Text(error).font(.caption).foregroundStyle(.red) }
        }
        .alert("Attivare il microfono?", isPresented: $consent) {
            Button("Annulla", role: .cancel) {}
            Button("Attiva") { Task { await dictation.start { value in text += (text.isEmpty ? "" : " ") + value } } }
        } message: { Text("Apple può elaborare l'audio tramite il servizio vocale. Non dettare password o dati sensibili.") }
        .onDisappear { dictation.stop() }
    }
}
