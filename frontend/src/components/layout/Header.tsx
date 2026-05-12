"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useChatStore } from "@/store/chatStore";
import { getThemeById } from "@/lib/themes";

interface HeaderProps {
  conversationId?: string;
}

export default function Header({ conversationId }: HeaderProps) {
  const {
    conversations,
    openSourcesPanel,
    toggleSaveConversation,
    deleteConversation,
    renameConversation,
  } = useChatStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const conversation = conversationId
    ? conversations.find((c) => c.id === conversationId)
    : null;

  const theme = conversation?.themeId ? getThemeById(conversation.themeId) : null;
  const allSources = conversation?.messages.flatMap((m) => m.sources ?? []) ?? [];
  const isPinned = !!conversation?.isSaved;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleRename = () => {
    if (!conversationId || !conversation) return;
    const nextTitle = window.prompt("Renommer la discussion", conversation.title);
    if (!nextTitle) return;
    renameConversation(conversationId, nextTitle);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    if (!conversationId) return;
    deleteConversation(conversationId);
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-transparent flex-shrink-0 animate-fade-in">
      {/* Titre */}
      <div ref={menuRef} className="relative flex items-center gap-2">
        <h1 className="text-sm font-semibold tracking-[-0.02em] text-gray-700 dark:text-white/88">
          {theme?.name ?? (conversation?.title ?? "")}
        </h1>
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className={[
            "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150",
            menuOpen
              ? "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-white/50 dark:hover:bg-white/8 dark:hover:text-white",
          ].join(" ")}
          aria-label="Afficher les actions"
          aria-expanded={menuOpen}
        >
          <Icon icon="mdi:chevron-down" className="text-lg" />
        </button>

        {menuOpen && conversationId && (
          <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-2xl border border-gray-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-[#0f1a28]/95 dark:backdrop-blur">
            <button
              onClick={() => {
                openSourcesPanel(allSources);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-white/82 dark:hover:bg-white/8"
            >
              <Icon icon="mdi:share-variant-outline" className="text-base text-gray-400 dark:text-white/45" />
              Partager
            </button>
            <button
              onClick={() => {
                toggleSaveConversation(conversationId);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-white/82 dark:hover:bg-white/8"
            >
              <Icon icon={isPinned ? "mdi:pin-off-outline" : "mdi:pin-outline"} className="text-base text-gray-400 dark:text-white/45" />
              {isPinned ? "Désépingler" : "Épingler"}
            </button>
            <button
              onClick={handleRename}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-white/82 dark:hover:bg-white/8"
            >
              <Icon icon="mdi:pencil-outline" className="text-base text-gray-400 dark:text-white/45" />
              Renommer
            </button>
            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Icon icon="mdi:trash-can-outline" className="text-base" />
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {allSources.length > 0 && (
          <button
            onClick={() => openSourcesPanel(allSources)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-gray-400 transition-all duration-150 hover:bg-gray-100 hover:text-[#1CABE2] dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white"
            aria-label="Partager"
            title="Partager"
          >
            <Icon icon="mdi:share-variant-outline" className="text-sm" />
            Partager
          </button>
        )}
      </div>
    </header>
  );
}
