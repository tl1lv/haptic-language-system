export type Priority = "low" | "normal" | "high" | "emergency";

export type HapticStepType = "vibrate" | "pause";

/** أي محرك اهتزاز على السوار يُشغَّل: العلوي، السفلي، أو كلاهما معًا */
export type HapticChannel = "both" | "top" | "bottom";

export type HapticStep = {
  id: string;
  type: HapticStepType;
  durationMs: number;
  intensity: number; // 1-100 (ignored for pause)
};

export type WordCategory =
  | "names"
  | "danger"
  | "directions"
  | "daily"
  | "people"
  | "places"
  | "environment"
  | "custom";

export type WordMapping = {
  id: string;
  phrase: string;
  aliases: string[];
  description?: string;
  category: WordCategory;
  priority: Priority;
  pattern: HapticStep[];
  repeatCount: number;
  cooldownSeconds: number;
  matchInSentence: boolean;
  channel: HapticChannel;
  isEnabled: boolean;
  detectionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DetectionLog = {
  id: string;
  originalText: string;
  normalizedText: string;
  matchedPhrase: string;
  wordMappingId: string;
  confidence: number;
  responseTimeMs: number;
  source: "microphone" | "simulation";
  vibrationPlayed: boolean;
  detectedAt: string;
};

export type DeviceInfo = {
  id: string;
  name: string;
  batteryPercent: number;
  signalRssi: number;
  firmwareVersion: string;
  firmwareStatus: "up-to-date" | "update-available";
  lastConnectedAt: string | null;
};

export type DeviceConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected";

export type PlaybackOrder = "appearance" | "priority";

export type AppSettings = {
  schemaVersion: number;
  userName: string;
  language: "ar";
  dialect: string; // e.g. ar-SA
  theme: "light" | "dark";
  micAllowed: boolean;
  saveTranscripts: boolean;
  defaultCooldownSeconds: number;
  maxWordsPerSentence: number;
  playbackOrder: PlaybackOrder;
  defaultIntensity: number;
  phoneVibration: boolean;
  soundSimulation: boolean;
  onboardingComplete: boolean;
};

export const CATEGORY_LABELS: Record<WordCategory, string> = {
  names: "أسماء",
  danger: "خطر",
  directions: "اتجاهات",
  daily: "طلبات يومية",
  people: "أشخاص",
  places: "أماكن",
  environment: "أصوات بيئية",
  custom: "مخصصة",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "عالية",
  emergency: "طارئة",
};

export const CHANNEL_LABELS: Record<HapticChannel, string> = {
  both: "كلا المحركين",
  top: "المحرك العلوي",
  bottom: "المحرك السفلي",
};

export const PRIORITY_RANK: Record<Priority, number> = {
  emergency: 0,
  high: 1,
  normal: 2,
  low: 3,
};
