"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Sidebar from "@/components/layout/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useChatStore } from "@/store/chatStore";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { id } = use(params);
  const conversations = useChatStore((s) => s.conversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const _hasHydrated = useChatStore((s) => s._hasHydrated);
  const router = useRouter();

  const conversation = conversations.find((c) => c.id === id);

  // Set active conversation only when it actually exists.
  // Calling setActiveConversation with a non-existent ID writes a stale ID to
  // the store, which causes an infinite redirect loop with page.tsx.
  useEffect(() => {
    if (conversation) {
      setActiveConversation(id);
    }
  }, [id, conversation, setActiveConversation]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (conversation) return; // All good
    // The conversation for this URL no longer exists (e.g. was wiped by a
    // multi-tab race condition). Redirect directly to the most recent valid
    // conversation, bypassing / to avoid a redirect loop.
    const first = conversations
      .filter((c) => c.messages.length > 0)
      .sort(
        (a, b) =>
          new Date(b.updatedAt ?? 0).getTime() -
          new Date(a.updatedAt ?? 0).getTime()
      )[0];
    if (first) {
      router.replace(`/chat/${first.id}`);
    } else {
      router.replace("/");
    }
  }, [_hasHydrated, conversation, conversations, router]);

  if (!conversation) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)] dark:bg-[#0b1220]">
        <Icon icon="mdi:loading" className="text-3xl text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] dark:bg-[#0b1220]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-[var(--background)] dark:bg-[#0b1220]">
        <ChatWindow key={id} conversationId={id} />
      </main>
    </div>
  );
}

