"use client";

import Sidebar from "@/components/layout/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] dark:bg-[#0b1220]">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[var(--background)] dark:bg-[#0b1220]">
        <ChatWindow />
      </main>
    </div>
  );
}


