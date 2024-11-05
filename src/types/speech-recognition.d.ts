// src/types/speech-recognition.d.ts

// Define the SpeechRecognition interface
interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    start(): void;
    stop(): void;
}

// Define the SpeechRecognitionEvent interface
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
}

// Define the SpeechRecognitionErrorEvent interface
interface SpeechRecognitionErrorEvent {
    error: string;
}

// Extend the global Window interface to include SpeechRecognition
interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
}
