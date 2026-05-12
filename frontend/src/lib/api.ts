import {
  ChatRequest,
  ChatResponse,
  BackendTopic,
  TopicStarterResponse,
  Source,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
//  API Configuration
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Chat Endpoint ─────────────────────────────────────────────────────────────

/**
 * Envoie un message au backend et retourne la réponse du chatbot EN STREAMING.
 * 
 * La réponse arrive mot par mot via Server-Sent Events (SSE).
 * On appelle `onChunk` à chaque token reçu, puis `onComplete` à la fin.
 */
export async function sendMessageStream(
  payload: ChatRequest,
  onChunk: (token: string) => void,
  onComplete: (sources: Source[], conversationId: string) => void
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: payload.message,
      conversation_id: payload.conversationId,
      theme_id: payload.themeId,
      history: payload.history,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? `Erreur API : ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("Pas de reader disponible");

  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // Garder la dernière ligne incomplète

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;

          const data = JSON.parse(dataStr);
          if (data.done) {
            // Fin du stream - récupérer les sources depuis le backend
            const sources: Source[] = (data.sources ?? []).map(
              (s: { document: string; page?: number; excerpt?: string }, i: number) => ({
                id: `src-${i}`,
                title: s.document,
                excerpt: s.excerpt ?? "",
                ...(s.page != null && { url: `page ${s.page}` }),
              })
            );
            onComplete(sources, payload.conversationId ?? "");
          } else if (data.token) {
            onChunk(data.token);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Envoie un message au backend et retourne la réponse du chatbot (non-streaming).
 *
 * Le frontend envoie :  { message, themeId, conversationId, history }
 * Le backend répond  :  { answer, sources, conversation_id, disclaimer }
 *
 * La fonction mappe la réponse snake_case du backend en camelCase pour le
 * store Zustand, et transforme les SourceInfo en Source.
 */
export async function sendMessage(payload: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${BASE_URL}/api/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: payload.message,
      conversation_id: payload.conversationId,
      theme_id: payload.themeId,
      history: payload.history,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? `Erreur API : ${response.status}`);
  }

  // Le backend retourne snake_case → on mappe en camelCase
  const data = await response.json();

  // Transformation des sources : SourceInfo (backend) → Source (frontend)
  const sources: Source[] = (data.sources ?? []).map(
    (s: { document: string; page?: number; excerpt?: string }, i: number) => ({
      id: `src-${i}`,
      title: s.document,
      excerpt: s.excerpt ?? "",
      ...(s.page != null && { url: `page ${s.page}` }),
    })
  );

  return {
    answer: data.answer,
    sources,
    conversationId: data.conversation_id ?? payload.conversationId,
    disclaimer: data.disclaimer ?? null,
    subTopics: data.sub_topics ?? [],
  };
}

// ─── Topics / Thématiques Endpoints ───────────────────────────────────────────

/**
 * Récupère la liste de toutes les thématiques depuis le backend.
 * Appelé au chargement du ThemeSelector.
 *
 * GET /api/topics/ → { topics: BackendTopic[] }
 */
export async function fetchThemes(): Promise<BackendTopic[]> {
  const response = await fetch(`${BASE_URL}/api/topics/`);
  if (!response.ok) throw new Error("Impossible de charger les thématiques.");
  const data = await response.json();
  return data.topics ?? [];
}

/**
 * Récupère les détails d'une thématique : message d'introduction +
 * sous-thèmes (boutons suggestions).
 *
 * GET /api/topics/{topicId}/start → TopicStarterResponse
 */
export async function fetchTopicDetails(
  topicId: string
): Promise<TopicStarterResponse> {
  const response = await fetch(`${BASE_URL}/api/topics/${topicId}/start`);
  if (!response.ok) throw new Error("Thématique introuvable.");
  return response.json();
}

// ─── Health Check ──────────────────────────────────────────────────────────────

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Conversations (localStorage uniquement pour l'instant) ───────────────────

export async function fetchConversations(): Promise<void> {
  // Les conversations sont persistées dans localStorage via Zustand.
}

export async function saveConversation(_id: string): Promise<void> {
  // Placeholder – persistance serveur non implémentée.
}
