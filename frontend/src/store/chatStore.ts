import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Conversation,
  Message,
  Source,
  ThemeMode,
  UIState,
} from "@/lib/types";
import { generateId } from "@/lib/utils";
import { getThemeById } from "@/lib/themes";

// ─── State Interface ──────────────────────────────────────────────────────────

interface ChatState {
  // Hydration flag — true once persist has reloaded from localStorage
  _hasHydrated: boolean;

  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;

  // Selected theme (for current input context)
  selectedThemeId: string | null;

  // UI
  ui: UIState;

  // ─── Computed Getters ───────────────────────────────────────────────────────
  getActiveConversation: () => Conversation | null;

  // ─── Hydration ──────────────────────────────────────────────────────────────
  setHasHydrated: (value: boolean) => void;

  // ─── Conversation Actions ───────────────────────────────────────────────────
  createConversation: (themeId?: string | null) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  toggleSaveConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;

  // ─── Message Actions ────────────────────────────────────────────────────────
  addMessage: (conversationId: string, message: Omit<Message, "id">) => string;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  clearMessages: (conversationId: string) => void;

  // ─── Theme Actions ──────────────────────────────────────────────────────────
  setSelectedTheme: (themeId: string | null) => void;

  // ─── UI Actions ─────────────────────────────────────────────────────────────
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openSourcesPanel: (sources: Source[]) => void;
  closeSourcesPanel: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      conversations: [],
      activeConversationId: null,
      selectedThemeId: null,
      ui: {
        isSidebarOpen: true,
        isSourcesPanelOpen: false,
        themeMode: "light",
        activeSources: [],
      },

      // ── Hydration ────────────────────────────────────────────────────────────
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      // ── Computed ────────────────────────────────────────────────────────────
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return (
          conversations.find((c) => c.id === activeConversationId) ?? null
        );
      },

      // ── Conversation Actions ─────────────────────────────────────────────────
      createConversation: (themeId = null) => {
        // Si la conversation active est déjà vide, la réutiliser
        const { conversations, activeConversationId } = get();
        const current = activeConversationId
          ? conversations.find((c) => c.id === activeConversationId)
          : null;
        if (current && current.messages.length === 0) {
          return activeConversationId!;
        }

        const id = generateId();
        const theme = themeId ? getThemeById(themeId) : null;
        const conversation: Conversation = {
          id,
          title: theme ? `${theme.name} – Nouvelle discussion` : "Nouvelle discussion",
          themeId,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isSaved: false,
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
          selectedThemeId: themeId,
        }));
        return id;
      },

      deleteConversation: (id) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          return {
            conversations: filtered,
            activeConversationId:
              state.activeConversationId === id
                ? (filtered[0]?.id ?? null)
                : state.activeConversationId,
          };
        });
      },

      setActiveConversation: (id) => {
        set((state) => {
          // Supprimer l'ancienne conversation si elle est vide (comportement ChatGPT)
          const currentId = state.activeConversationId;
          const current = currentId
            ? state.conversations.find((c) => c.id === currentId)
            : null;
          const shouldDelete =
            current && current.messages.length === 0 && currentId !== id;
          const conversations = shouldDelete
            ? state.conversations.filter((c) => c.id !== currentId)
            : state.conversations;

          const conv = conversations.find((c) => c.id === id);
          return {
            conversations,
            activeConversationId: id,
            selectedThemeId: conv?.themeId ?? null,
          };
        });
      },

      toggleSaveConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, isSaved: !c.isSaved } : c
          ),
        }));
      },

      renameConversation: (id, title) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title: trimmedTitle, updatedAt: new Date() } : c
          ),
        }));
      },

      // ── Message Actions ──────────────────────────────────────────────────────
      addMessage: (conversationId, message) => {
        const messageId = generateId();
        const newMessage: Message = { ...message, id: messageId };
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const messages = [...c.messages, newMessage];
            // Auto-update title from first user message
            const title =
              c.messages.length === 0 && message.role === "user"
                ? message.content.slice(0, 60)
                : c.title;
            return { ...c, messages, title, updatedAt: new Date() };
          }),
        }));
        return messageId;
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, ...updates } : m
              ),
              updatedAt: new Date(),
            };
          }),
        }));
      },

      clearMessages: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, messages: [] } : c
          ),
        }));
      },

      // ── Theme Actions ────────────────────────────────────────────────────────
      setSelectedTheme: (themeId) => {
        set({ selectedThemeId: themeId });
        // Update current conversation theme if active
        const { activeConversationId } = get();
        if (activeConversationId) {
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === activeConversationId ? { ...c, themeId } : c
            ),
          }));
        }
      },

      // ── UI Actions ───────────────────────────────────────────────────────────
      toggleSidebar: () =>
        set((state) => ({
          ui: { ...state.ui, isSidebarOpen: !state.ui.isSidebarOpen },
        })),

      setSidebarOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, isSidebarOpen: open } })),

      openSourcesPanel: (sources) =>
        set((state) => ({
          ui: {
            ...state.ui,
            isSourcesPanelOpen: true,
            activeSources: sources,
          },
        })),

      closeSourcesPanel: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            isSourcesPanelOpen: false,
            activeSources: [],
          },
        })),

      setThemeMode: (mode) =>
        set((state) => ({ ui: { ...state.ui, themeMode: mode } })),

      toggleThemeMode: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            themeMode: state.ui.themeMode === "light" ? "dark" : "light",
          },
        })),
    }),
    {
      name: "unicef-chatbot-store",
      partialize: (state) => ({
        conversations: state.conversations,
        // activeConversationId is NOT persisted: a stale ID causes an infinite
        // redirect loop between / and /chat/[id] on page refresh.
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      merge: (persistedState: unknown, currentState: ChatState) => {
        const persisted = persistedState as Partial<ChatState>;

        // Merge conversations additively by ID so that multi-tab writes never
        // erase each other. For duplicate IDs, keep the most recently updated.
        const currentMap = new Map(
          currentState.conversations.map((c) => [c.id, c])
        );
        for (const conv of persisted.conversations ?? []) {
          const existing = currentMap.get(conv.id);
          if (!existing) {
            currentMap.set(conv.id, conv);
          } else {
            const existingTs = existing.updatedAt
              ? new Date(existing.updatedAt).getTime()
              : 0;
            const convTs = conv.updatedAt
              ? new Date(conv.updatedAt).getTime()
              : 0;
            if (convTs > existingTs) currentMap.set(conv.id, conv);
          }
        }
        const mergedConversations = Array.from(currentMap.values()).sort(
          (a, b) =>
            new Date(b.updatedAt ?? 0).getTime() -
            new Date(a.updatedAt ?? 0).getTime()
        );

        return {
          ...currentState,
          ...persisted,
          conversations: mergedConversations,
          // Preserve in-memory UI state (theme, sidebar, sources)
          ui: { ...currentState.ui },
        };
      },
    }
  )
);
