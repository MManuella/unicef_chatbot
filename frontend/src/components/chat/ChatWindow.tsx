"use client";

import { useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/store/chatStore";
import { useRouter } from "next/navigation";
import { getThemeById } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import SuggestedQuestions from "./SuggestedQuestions";
import WelcomeScreen from "./WelcomeScreen";
import Header from "@/components/layout/Header";
import SourcesPanel from "@/components/layout/SourcesPanel";

interface ChatWindowProps {
  conversationId?: string;
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
  const {
    conversations,
    selectedThemeId,
    setSelectedTheme,
    updateConversationTheme,
    createConversation,
    ui,
    toggleSidebar,
  } = useChatStore();

  // Forcer la recherche de la conversation à chaque changement de conversationId
  const conversation = conversationId
    ? conversations.find((c) => c.id === conversationId)
    : null;

  const activeThemeId = conversationId ? (conversation?.themeId ?? null) : selectedThemeId;
  const activeTheme = activeThemeId ? getThemeById(activeThemeId) : null;

  const { sendMessage, retryMessage, isLoading } = useChat(conversationId ?? null);
  const router = useRouter();
  const isSendingRef = useRef(false);

  const handleThemeChange = (themeId: string | null) => {
    if (conversationId) {
      updateConversationTheme(conversationId, themeId);
    } else {
      setSelectedTheme(themeId);
    }
  };

  const handleSend = async (message: string) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    try {
      let convId = conversationId;
      if (!convId) {
        convId = createConversation(selectedThemeId);
        router.push(`/chat/${convId}`);
      }
      await sendMessage(message, convId);
    } finally {
      isSendingRef.current = false;
    }
  };

  const hasMessages = (conversation?.messages.length ?? 0) > 0;
  const isSourcesOpen = ui?.isSourcesPanelOpen ?? false;

  return (
  <div className={cn("flex h-full min-w-0 overflow-hidden p-0 md:px-1.5 md:py-4", isSourcesOpen && "md:gap-4")}>
    <div
      className={cn(
        "chat-surface flex flex-col flex-1 min-w-0 overflow-hidden rounded-none md:rounded-3xl border-0 md:border md:border-gray-200/80 bg-white text-gray-700 shadow-none md:shadow-md md:shadow-slate-200/50 dark:border-white/8 dark:bg-[linear-gradient(180deg,#142235_0%,#0d1726_100%)] dark:text-white dark:shadow-[#07101c]/20",
        !hasMessages && "justify-center"
      )}
    >
      {/* Barre mobile sur l'écran d'accueil (sans messages) */}
      {!hasMessages && (
        <div className="md:hidden flex items-center h-12 px-3 border-b border-gray-100 dark:border-white/8 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/8 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Icon icon="mynaui:menu" className="text-xl" />
          </button>
        </div>
      )}

      {conversationId && hasMessages && <Header conversationId={conversationId} />}

      {!hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
          <WelcomeScreen />
          <div className="w-full max-w-3xl mt-8">
            {activeThemeId && (
              <SuggestedQuestions themeId={activeThemeId} onSelect={handleSend} />
            )}
            <MessageInput
              selectedThemeId={activeThemeId}
              onThemeChange={handleThemeChange}
              onSend={handleSend}
              disabled={isLoading}
            />
          </div>
        </div>
      ) : (
        <>
          <MessageList
            messages={conversation?.messages ?? []}
            isLoading={isLoading}
            onRetry={(content, msgId) => retryMessage(content, msgId, conversationId)}
          />
          <MessageInput
            selectedThemeId={activeThemeId}
            onThemeChange={handleThemeChange}
            onSend={handleSend}
            disabled={isLoading}
          />
        </>
      )}
    </div>

    <SourcesPanel isOpen={isSourcesOpen} />
  </div>
);
}

