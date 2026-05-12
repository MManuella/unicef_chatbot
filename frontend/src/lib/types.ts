// ─── Core Types ──────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface Source {
  id: string;
  title: string;
  url?: string;
  excerpt: string;
  relevanceScore?: number;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sources?: Source[];
  isLoading?: boolean;
  error?: string;
}

export interface HealthTheme {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  suggestedQuestions: string[];
}

export interface Conversation {
  id: string;
  title: string;
  themeId: string | null;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isSaved?: boolean;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface ChatRequest {
  message: string;
  themeId: string | null;
  conversationId: string;
  history: { role: MessageRole; content: string }[];
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  conversationId: string;
  disclaimer?: string | null;
  subTopics?: SubTopic[];
}

// Sous-thème renvoyé par le backend (bouton cliquable)
export interface SubTopic {
  label: string;
  prompt: string;
}

// Thématique renvoyée par GET /api/topics/
export interface BackendTopic {
  id: string;
  title: string;
  icon: string;
}

// Détail d'une thématique renvoyé par GET /api/topics/{id}/start
export interface TopicStarterResponse {
  id: string;
  title: string;
  icon: string;
  starter_message: string;
  sub_topics: SubTopic[];
  related_topics: string[];
}

export type APIStatus = "idle" | "loading" | "success" | "error";

// ─── UI Types ─────────────────────────────────────────────────────────────────

export type ThemeMode = "light" | "dark";

export interface UIState {
  isSidebarOpen: boolean;
  isSourcesPanelOpen: boolean;
  themeMode: ThemeMode;
  activeSources: Source[];
}
