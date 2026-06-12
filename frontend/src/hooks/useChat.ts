"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { sendMessageStream } from "@/lib/api";

export function useChat(conversationId: string | null) {
  const { addMessage, updateMessage, selectedThemeId, conversations } =
    useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Annuler tout stream en cours au démontage du composant
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

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
            setIsLoading(false);
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
            // Vérifier que la conversation existe encore avant de mettre à jour
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
            setIsLoading(false);
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
