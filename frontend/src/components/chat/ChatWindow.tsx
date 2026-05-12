"use client";

import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/store/chatStore";
import { getThemeById } from "@/lib/themes";
import { cn } from "@/lib/utils";
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
    createConversation,
    ui,
  } = useChatStore();

  // Forcer la recherche de la conversation à chaque changement de conversationId
  const conversation = conversationId
    ? conversations.find((c) => c.id === conversationId)
    : null;

  const activeThemeId = conversation?.themeId ?? selectedThemeId;
  const activeTheme = activeThemeId ? getThemeById(activeThemeId) : null;

  const { sendMessage, isLoading } = useChat(conversationId ?? null);

  const handleSend = async (message: string) => {
    let convId = conversationId;
    if (!convId) {
      convId = createConversation(selectedThemeId);
    }
    await sendMessage(message, convId);
  };

  const hasMessages = (conversation?.messages.length ?? 0) > 0;
  const isSourcesOpen = ui?.isSourcesPanelOpen ?? false;

  return (
  <div className={cn("flex h-full overflow-hidden px-1 py-4 md:px-1.5 md:py-6", isSourcesOpen && "gap-4")}>
    <div
      className={cn(
        "chat-surface flex flex-col flex-1 overflow-hidden rounded-3xl border border-gray-200/80 bg-white text-gray-700 shadow-xl shadow-slate-200/70 dark:border-white/8 dark:bg-[linear-gradient(180deg,#142235_0%,#0d1726_100%)] dark:text-white dark:shadow-[#07101c]/30",
        !hasMessages && "justify-center"
      )}
    >
      {conversationId && hasMessages && <Header conversationId={conversationId} />}

      {!hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
          <WelcomeScreen onSelectQuestion={handleSend} />
          <div className="w-full max-w-3xl mt-8">
            {activeThemeId && (
              <SuggestedQuestions themeId={activeThemeId} onSelect={handleSend} />
            )}
            <MessageInput
              selectedThemeId={activeThemeId}
              onThemeChange={setSelectedTheme}
              onSend={handleSend}
              disabled={isLoading}
            />
          </div>
        </div>
      ) : (
        <>
          <MessageList messages={conversation!.messages} isLoading={isLoading} />
          <MessageInput
            selectedThemeId={activeThemeId}
            onThemeChange={setSelectedTheme}
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

