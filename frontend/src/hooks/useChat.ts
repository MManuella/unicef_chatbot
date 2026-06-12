"use client";

import { useState, useCallback, useRef } from "react";
import { useChatStore } from "@/store/chatStore";
import { sendMessageStream } from "@/lib/api";

export function useChat(conversationId: string | null) {
  const { addMessage, updateMessage, selectedThemeId, conversations } =
    useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  // No abort-on-unmount: when the first message is sent from the welcome screen,
  // router.push unmounts this component mid-stream. Aborting here would leave
  // the assistant message stuck with isLoading:true forever. The abort at the
  // top of each sendMessage/retryMessage is sufficient to prevent duplicate
  // in-flight requests.
  const abortControllerRef = useRef<AbortController | null>(null);

  const retryMessage = useCallback(
    async (userContent: string, assistantMessageId: string, targetConversationId?: string) => {
      const convId = targetConversationId ?? conversationId;
      if (!convId) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const conversation = conversations.find((c) => c.id === convId);
      const themeId = conversation?.themeId ?? selectedThemeId;

      // Remettre le message assistant en état loading sans le recréer
      updateMessage(convId, assistantMessageId, {
        content: "",
        isLoading: true,
        sources: undefined,
        error: undefined,
        timestamp: new Date(),
      });

      setIsLoading(true);

      let accumulatedContent = "";

      try {
        // Historique sans le message assistant qu'on remplace
        const history = (conversation?.messages ?? [])
          .filter((m) => m.id !== assistantMessageId)
          .map((m) => ({ role: m.role, content: m.content }));

        await sendMessageStream(
          { message: userContent, themeId, conversationId: convId, history },
          (token: string) => {
            accumulatedContent += token;
            updateMessage(convId, assistantMessageId, {
              content: accumulatedContent,
              isLoading: true,
            });
          },
          (sources) => {
            setIsLoading(false);
            const stillExists = useChatStore
              .getState()
              .conversations.some((c) => c.id === convId);
            if (!stillExists) return;
            updateMessage(convId, assistantMessageId, {
              content: accumulatedContent,
              sources,
              isLoading: false,
              timestamp: new Date(),
            });
          },
          controller.signal,
        );
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setIsLoading(false);
          return;
        }
        updateMessage(convId, assistantMessageId, {
          content: accumulatedContent || "",
          isLoading: false,
          error: error instanceof Error ? error.message : "Une erreur est survenue. Veuillez réessayer.",
          timestamp: new Date(),
        });
        setIsLoading(false);
      }
    },
    [conversationId, conversations, selectedThemeId, updateMessage]
  );

  const sendMessage = useCallback(
    async (content: string, targetConversationId?: string) => {
      const convId = targetConversationId ?? conversationId;
      if (!convId) return;

      // Annuler un éventuel stream précédent encore actif
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const conversation = conversations.find((c) => c.id === convId);
      const themeId = conversation?.themeId ?? selectedThemeId;

      addMessage(convId, {
        role: "user",
        content,
        timestamp: new Date(),
      });

      const loadingId = addMessage(convId, {
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isLoading: true,
      });

      setIsLoading(true);

      let accumulatedContent = "";

      try {
        const history =
          conversation?.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })) ?? [];

        await sendMessageStream(
          { message: content, themeId, conversationId: convId, history },
          (token: string) => {
            accumulatedContent += token;
            updateMessage(convId, loadingId, {
              content: accumulatedContent,
              isLoading: true,
            });
          },
          (sources, _conversationId) => {
            setIsLoading(false);
            const stillExists = useChatStore
              .getState()
              .conversations.some((c) => c.id === convId);
            if (!stillExists) return;
            updateMessage(convId, loadingId, {
              content: accumulatedContent,
              sources,
              isLoading: false,
              timestamp: new Date(),
            });
          },
          controller.signal,
        );
      } catch (error) {
        // Ne pas afficher d'erreur si c'est une annulation volontaire
        if (error instanceof Error && error.name === "AbortError") {
          setIsLoading(false);
          return;
        }
        updateMessage(convId, loadingId, {
          content: accumulatedContent || "",
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Une erreur est survenue. Veuillez réessayer.",
          timestamp: new Date(),
        });
        setIsLoading(false);
      }
    },
    [conversationId, conversations, selectedThemeId, addMessage, updateMessage]
  );

  return { sendMessage, retryMessage, isLoading };
}
