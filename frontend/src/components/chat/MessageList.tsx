"use client";

import { useEffect, useRef } from "react";
import { Message, Source } from "@/lib/types";
import { useChatStore } from "@/store/chatStore";
import MessageItem from "./MessageItem";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { openSourcesPanel } = useChatStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      className="flex-1 overflow-y-auto scrollbar-thin px-4 py-8"
      aria-live="polite"
      aria-label="Messages"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onViewSources={(sources: Source[]) => openSourcesPanel(sources)}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
