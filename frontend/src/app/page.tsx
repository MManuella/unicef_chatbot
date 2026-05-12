"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { useChatStore } from "@/store/chatStore";

export default function Home() {
  const hasHydrated = useChatStore((s) => s._hasHydrated);
  const conversations = useChatStore((s) => s.conversations);
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!hasHydrated || hasRedirected.current) return;
    // Find the most recently updated conversation that has messages.
    // Do NOT use activeConversationId — it can point to a deleted/stale conversation
    // and cause an infinite redirect loop.
    const first = conversations
      .filter((c) => c.messages.length > 0)
      .sort(
        (a, b) =>
          new Date(b.updatedAt ?? 0).getTime() -
          new Date(a.updatedAt ?? 0).getTime()
      )[0];
    if (first) {
      hasRedirected.current = true;
      router.replace(`/chat/${first.id}`);
    }
    // If no conversations exist, stay on the welcome page.
  }, [hasHydrated, conversations, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] dark:bg-[#0b1220]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-[var(--background)] dark:bg-[#0b1220]">
        <ChatWindow />
      </main>
    </div>
  );
}


