"use client";

import { useState, useCallback } from "react";
import { useChatStore } from "@/store/chatStore";
import { sendMessageStream } from "@/lib/api";

/**
 * useChat — orchestrates sending messages, handling loading/error states,
 * and updating the store with streaming support.
 */
export function useChat(conversationId: string | null) {
  const { addMessage, updateMessage, selectedThemeId, conversations } =
    useChatStore();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string, targetConversationId?: string) => {
      const convId = targetConversationId ?? conversationId;
      if (!convId) return;

      const conversation = conversations.find((c) => c.id === convId);
      const themeId = conversation?.themeId ?? selectedThemeId;

      // 1. Add the user message immediately
      addMessage(convId, {
        role: "user",
        content,
        timestamp: new Date(),
      });

      // 2. Add a loading placeholder for the assistant
      const loadingId = addMessage(convId, {
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isLoading: true,
      });

      setIsLoading(true);

      try {
        // 3. Call the streaming API
        const history =
          conversation?.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })) ?? [];

        let accumulatedContent = "";

        await sendMessageStream(
          {
            message: content,
            themeId,
            conversationId: convId,
            history,
          },
          // onChunk: ajouter chaque token reçu
          (token: string) => {
            accumulatedContent += token;
            updateMessage(convId, loadingId, {
              content: accumulatedContent,
              isLoading: true, // toujours en loading pendant le stream
            });
          },
          // onComplete: marquer comme terminé
          (sources, _conversationId) => {
            updateMessage(convId, loadingId, {
              content: accumulatedContent,
              sources,
              isLoading: false,
              timestamp: new Date(),
            });
            setIsLoading(false);
          }
        );
      } catch (error) {
        // 4. Update the placeholder with an error
        updateMessage(convId, loadingId, {
          content: "",
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "An error occurred. Please try again.",
          timestamp: new Date(),
        });
        setIsLoading(false);
      }
    },
    [conversationId, conversations, selectedThemeId, addMessage, updateMessage]
  );

  return { sendMessage, isLoading };
}
