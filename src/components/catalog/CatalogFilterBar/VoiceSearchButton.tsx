import { useState, useEffect, useRef } from 'react'
import { useCatalogFilterStore } from '../../../stores/catalogFilterStore'

interface VoiceSearchButtonProps {
  /**
   * Language code for speech recognition
   * Default: 'hu-HU' (Hungarian)
   */
  lang?: string

  className?: string
}

/**
 * VoiceSearchButton Component
 *
 * Features:
 * - Web Speech API integration (webkitSpeechRecognition)
 * - Progressive enhancement (hidden if not supported)
 * - XSS protection (sanitizes transcript)
 * - Visual feedback (listening state, error state)
 * - Accessible (keyboard navigation, ARIA labels)
 *
 * SECURITY: All voice input is sanitized before updating the store
 * Browser support: Chrome, Edge (Safari partial support)
 */
export function VoiceSearchButton({
  lang = 'hu-HU',
  className = '',
}: VoiceSearchButtonProps) {
  const { setFilter } = useCatalogFilterStore()
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  /**
   * Check browser support on mount
   */
  useEffect(() => {
    // Feature detection
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)

      // Initialize recognition
      const recognition = new SpeechRecognition()
      recognition.lang = lang
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognitionRef.current = recognition

      // Event handlers
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript

        // ✅ CRITICAL FIX (v3-M4): Sanitize transcript (XSS protection)
        const sanitized = transcript.replace(/<[^>]*>/g, '')

        // Update search filter
        setFilter('search', sanitized)
        setIsListening(false)
        setError(null)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)

        // User-friendly error messages
        switch (event.error) {
          case 'no-speech':
            setError('Nem hallottam semmit. Próbáld újra!')
            break
          case 'audio-capture':
            setError('Mikrofon hiba. Ellenőrizd az engedélyeket.')
            break
          case 'not-allowed':
            setError('Mikrofon hozzáférés megtagadva.')
            break
          default:
            setError('Hiba történt. Próbáld újra!')
        }

        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000)
      }

      recognition.onend = () => {
        setIsListening(false)
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [lang, setFilter])

  /**
   * Start voice recognition
   */
  const handleStartListening = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.start()
      setIsListening(true)
      setError(null)
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setError('Nem sikerült elindítani a hangfelismerést.')
    }
  }

  /**
   * Stop voice recognition
   */
  const handleStopListening = () => {
    if (!recognitionRef.current) return

    recognitionRef.current.stop()
    setIsListening(false)
  }

  /**
   * Hide button if not supported
   */
  if (!isSupported) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={isListening ? handleStopListening : handleStartListening}
        className={`
          p-2.5
          rounded-lg
          border
          transition-all
          duration-200
          focus:outline-none
          focus:ring-2
          focus:ring-offset-1
          ${
            isListening
              ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 focus:ring-red-500 animate-pulse'
              : error
              ? 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100 focus:ring-red-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-blue-500'
          }
        `}
        aria-label={
          isListening ? 'Hangfelismerés leállítása' : 'Hangkeresés indítása'
        }
        aria-pressed={isListening}
        title={
          isListening
            ? 'Kattints a leállításhoz'
            : 'Kattints és mondj valamit'
        }
      >
        {isListening ? (
          // Listening icon (animated microphone)
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        ) : (
          // Idle microphone icon
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </button>

      {/* Status tooltip */}
      {(isListening || error) && (
        <div
          className={`
            absolute
            top-full
            left-1/2
            transform
            -translate-x-1/2
            mt-2
            px-3
            py-1.5
            text-xs
            font-medium
            rounded
            shadow-lg
            whitespace-nowrap
            z-10
            ${
              isListening
                ? 'bg-red-500 text-white'
                : 'bg-red-100 text-red-800 border border-red-300'
            }
          `}
          role="status"
          aria-live="polite"
        >
          {isListening ? '🎤 Hallgatok...' : error}
        </div>
      )}
    </div>
  )
}

/**
 * Type declarations for Web Speech API
 * (TypeScript doesn't have these by default)
 */
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
  length: number
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error:
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported'
}
