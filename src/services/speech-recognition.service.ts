export type SpeechCallbacks = {
  lang: string;
  onResult: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
};

export interface SpeechRecognitionService {
  isSupported(): boolean;
  start(callbacks: SpeechCallbacks): void;
  stop(): void;
}



/**
 * تنفيذ أولي يعتمد على Web Speech API إن كانت متاحة.
 * عند عدم الدعم يستمر التطبيق بوضع المحاكاة النصية.
 */
class WebSpeechRecognitionService implements SpeechRecognitionService {
  private recognition: any = null;
  private manualStop = false;

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const w = window as any;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  start(callbacks: SpeechCallbacks): void {
    if (!this.isSupported()) {
      callbacks.onError("speech-not-supported");
      return;
    }
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    const recognition = new Ctor();
    recognition.lang = callbacks.lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (final) callbacks.onResult(final.trim(), true);
      if (interim) callbacks.onResult(interim.trim(), false);
    };
    recognition.onerror = (event: any) => {
      callbacks.onError(String(event?.error ?? "unknown"));
    };
    recognition.onend = () => {
      if (!this.manualStop && this.recognition === recognition) {
        // إعادة التشغيل التلقائي في وضع الاستماع المستمر
        try {
          recognition.start();
          return;
        } catch {
          // تجاهل ثم إنهاء
        }
      }
      callbacks.onEnd();
    };

    this.manualStop = false;
    this.recognition = recognition;
    try {
      recognition.start();
    } catch {
      callbacks.onError("start-failed");
    }
  }

  stop(): void {
    this.manualStop = true;
    try {
      this.recognition?.stop();
    } catch {
      // تجاهل
    }
    this.recognition = null;
  }
}

export const speechRecognitionService: SpeechRecognitionService =
  new WebSpeechRecognitionService();
