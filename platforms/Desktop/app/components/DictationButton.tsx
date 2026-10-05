'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic } from 'lucide-react'

interface SpeechResultEvent {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}
interface Recognition {
  lang: string; continuous: boolean; interimResults: boolean
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void; stop(): void; abort(): void
}
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }

export default function DictationButton({ onText, label = 'Detta testo' }: { onText: (text: string) => void; label?: string }) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recognition = useRef<Recognition | null>(null)
  const onTextRef = useRef(onText)
  onTextRef.current = onText
  useEffect(() => {
    const browser = window as SpeechWindow
    setSupported(Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition))
    return () => {
      if (recognition.current) {
        recognition.current.onresult = null; recognition.current.onend = null; recognition.current.onerror = null
        recognition.current.abort()
      }
    }
  }, [])
  function toggle() {
    if (listening) { recognition.current?.stop(); return }
    const browser = window as SpeechWindow
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition
    if (!Constructor) { setError('Dettatura non supportata da questo browser. Puoi usare la dettatura della tastiera del dispositivo.'); return }
    if (!window.confirm('Attivare il microfono? La dettatura è gestita dal browser e può inviare l’audio al suo servizio vocale. Non dettare password o dati sensibili.')) return
    const speech = new Constructor()
    recognition.current = speech
    speech.lang = 'it-IT'; speech.continuous = true; speech.interimResults = false
    speech.onresult = event => {
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index]
        if (result.isFinal && result[0].transcript.trim()) onTextRef.current(result[0].transcript.trim())
      }
    }
    speech.onerror = event => {
      const messages: Record<string, string> = {
        'not-allowed': 'Permesso microfono negato. Abilitalo nelle impostazioni del browser.',
        'audio-capture': 'Microfono non disponibile.',
        'no-speech': 'Non è stata rilevata voce. Riprova.',
        'network': 'Servizio vocale non raggiungibile. Controlla la connessione.',
        'language-not-supported': 'Il browser non supporta la dettatura in italiano.',
      }
      setError(messages[event.error] || `Dettatura interrotta (${event.error}). Riprova.`)
      setListening(false)
    }
    speech.onend = () => { setListening(false); recognition.current = null }
    setError('')
    try { speech.start(); setListening(true) }
    catch (cause) { console.error('Dictation start failed:', cause); setError('Impossibile avviare il microfono. Riprova.'); setListening(false) }
  }
  return <div className="my-2">
    <button type="button" onClick={toggle} aria-pressed={listening} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${listening ? 'bg-red-100 text-red-800' : 'bg-[#d9e8d9] text-[#257259]'}`}><Mic className="h-4 w-4" />{listening ? 'Ferma dettatura' : label}</button>
    {!supported && <p className="mt-1 text-xs text-[#716a91]">Se non disponibile, usa il microfono della tastiera del dispositivo.</p>}
    {listening && <p role="status" className="mt-1 text-xs">Microfono attivo. Il testo riconosciuto viene aggiunto senza cancellare quello scritto.</p>}
    {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
  </div>
}
