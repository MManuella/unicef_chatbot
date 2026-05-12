"use client";

import { Icon } from "@iconify/react";
import { useChatStore } from "@/store/chatStore";
import { cn, truncate } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Icon-only strip (collapsed state) ────────────────────────────────────────
function SidebarCollapsed({
  onOpenSearch,
}: {
  onOpenSearch: () => void;
}) {
  const { createConversation, toggleSidebar, toggleThemeMode, ui } =
    useChatStore();
  const router = useRouter();

  const handleNewConversation = () => {
    const id = createConversation();
    router.push(`/chat/${id}`);
  };

  return (
    <aside className="flex h-full w-12 flex-col items-center bg-[var(--background)] py-3 text-[color:var(--foreground)] dark:bg-[#0b1220] dark:text-white/78 flex-shrink-0">
      {/* Top icons */}
      <div className="flex flex-col items-center gap-1 flex-1">
        <StripBtn
          icon="mdi:view-dashboard-outline"
          label="Expand sidebar"
          onClick={toggleSidebar}
        />
        <StripBtn
          icon="mdi:plus"
          label="New discussion"
          onClick={handleNewConversation}
        />
        <StripBtn
          icon="mdi:magnify"
          label="Search"
          onClick={onOpenSearch}
        />
        <StripBtn
          icon="mdi:chat-outline"
          label="Discussions"
          onClick={toggleSidebar}
        />
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-1">
        <StripBtn icon="mdi:account-outline" label="Profile" />
        <StripBtn
          icon={
            ui.themeMode === "dark"
              ? "mdi:weather-sunny"
              : "mdi:weather-night"
          }
          label="Toggle theme"
          onClick={toggleThemeMode}
        />
        <StripBtn icon="mdi:cog-outline" label="Settings" />
      </div>
    </aside>
  );
}

function StripBtn({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/70 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
    >
      <Icon icon={icon} className="text-[18px]" />
    </button>
  );
}

// ─── Full expanded sidebar ────────────────────────────────────────────────────
function SidebarExpanded({
  onOpenSearch,
}: {
  onOpenSearch: () => void;
}) {
  const {
    conversations,
    activeConversationId,
    ui,
    setActiveConversation,
    createConversation,
    deleteConversation,
    toggleSaveConversation,
    renameConversation,
    toggleSidebar,
    setThemeMode,
  } = useChatStore();
  const router = useRouter();

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpenId) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    const t = setTimeout(() => document.addEventListener("mousedown", handle), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handle);
    };
  }, [menuOpenId]);

  const filtered = conversations.filter((c) => {
    if (c.messages.length === 0) return false; // masquer les discussions vides
    return true;
  });

  const pinnedConversations = filtered.filter((c) => c.isSaved);
  const regularConversations = filtered.filter((c) => !c.isSaved);

  const openMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (menuOpenId === id) { setMenuOpenId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 192) });
    setMenuOpenId(id);
  };

  const handleDelete = (id: string) => {
    const willBeEmpty = conversations.length <= 1;
    deleteConversation(id);
    setConfirmDeleteId(null);
    if (willBeEmpty) router.push("/");
  };

  const handleRename = (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) return;
    const nextTitle = window.prompt("Renommer la discussion", conversation.title);
    if (!nextTitle) return;
    renameConversation(id, nextTitle);
    setMenuOpenId(null);
  };

  const menuConversation = menuOpenId
    ? conversations.find((c) => c.id === menuOpenId)
    : null;

  return (
    <aside className="flex h-full w-72 flex-col bg-[var(--background)] text-[color:var(--foreground)] dark:bg-[#0b1220] dark:text-white/78 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1CABE2] flex items-center justify-center">
            <Icon icon="mdi:heart-pulse" className="text-white text-sm" />
          </div>
          <span className="font-bold text-[#1CABE2] text-base">UniSanté</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/70 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Collapse sidebar"
        >
          <Icon icon="mdi:dock-left" className="text-base" />
        </button>
      </div>

      {/* New discussion */}
      <div className="px-3 pt-3">
        <button
          onClick={() => { const id = createConversation(); router.push(`/chat/${id}`); }}
          className="flex w-full items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-sm text-[color:var(--foreground)] transition-all duration-200 hover:border-blue-100 hover:bg-white/70 hover:text-[#1CABE2] dark:text-gray-300 dark:hover:border-blue-800/30 dark:hover:bg-blue-900/20"
        >
          <Icon icon="mdi:plus" className="text-base text-gray-400" />
          Nouvelle discussion
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-1">
        <button
          onClick={onOpenSearch}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-white/70 dark:hover:bg-gray-800/60"
        >
          <Icon icon="mdi:magnify" className="text-base text-gray-400 flex-shrink-0" />
          <span className="text-sm text-[color:var(--foreground)] dark:text-white/88">
            Rechercher
          </span>
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 scrollbar-thin">
        <div className="space-y-0.5">
          {pinnedConversations.length > 0 && (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Épinglées
            </p>
          )}
          {pinnedConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
                  isActive
                    ? "bg-white shadow-sm shadow-slate-200/60 dark:bg-blue-900/20 pl-3"
                    : "hover:bg-white/70 dark:hover:bg-gray-800/60"
                )}
                onClick={() => { setActiveConversation(conv.id); router.push(`/chat/${conv.id}`); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") { setActiveConversation(conv.id); router.push(`/chat/${conv.id}`); } }}
              >
                <p className={cn("flex-1 text-sm truncate text-[color:var(--foreground)] transition-colors dark:text-white/88", isActive && "font-medium text-gray-700 dark:text-white")}>
                  {truncate(conv.title, 35)}
                </p>
                <button
                  onClick={(e) => openMenu(conv.id, e)}
                  className={cn(
                    "flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all",
                    menuOpenId === conv.id
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  )}
                  aria-label="Options"
                >
                  <Icon icon="mdi:dots-horizontal" className="text-sm" />
                </button>
              </div>
            );
          })}
          {regularConversations.length > 0 && (
            <p className={cn(
              "px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400",
              pinnedConversations.length > 0 && "pt-3"
            )}>
              Récentes
            </p>
          )}
          {regularConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
                  isActive
                    ? "bg-white shadow-sm shadow-slate-200/60 dark:bg-blue-900/20 pl-3"
                    : "hover:bg-white/70 dark:hover:bg-gray-800/60"
                )}
                onClick={() => { setActiveConversation(conv.id); router.push(`/chat/${conv.id}`); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") { setActiveConversation(conv.id); router.push(`/chat/${conv.id}`); } }}
              >
                <p className={cn("flex-1 text-sm truncate text-[color:var(--foreground)] transition-colors dark:text-white/88", isActive && "font-medium text-gray-700 dark:text-white")}>
                  {truncate(conv.title, 35)}
                </p>
                <button
                  onClick={(e) => openMenu(conv.id, e)}
                  className={cn(
                    "flex-shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all",
                    menuOpenId === conv.id
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  )}
                  aria-label="Options"
                >
                  <Icon icon="mdi:dots-horizontal" className="text-sm" />
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Aucune discussion
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-3 space-y-3">
        {/* User */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/75 bg-white/75 px-3 py-3 backdrop-blur-sm dark:border-gray-700 dark:bg-[#162132]">
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
            <Icon
              icon="mdi:account"
              className="text-gray-500 dark:text-gray-300 text-base"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
              Utilisateur
            </p>
            <p className="text-xs text-gray-400 truncate">UNICEF Chatbot</p>
          </div>
        </div>

        {/* Dark / Light toggle */}
        <div className="flex items-center gap-2 rounded-2xl bg-white/75 p-1.5 backdrop-blur-sm dark:bg-gray-800">
          <button
            onClick={() => setThemeMode("dark")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all",
              ui.themeMode === "dark"
                ? "bg-white text-gray-800 shadow-sm dark:bg-gray-600 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            )}
          >
            <Icon icon="mdi:weather-night" className="text-sm" />
            Sombre
          </button>
          <button
            onClick={() => setThemeMode("light")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all",
              ui.themeMode === "light"
                ? "bg-white text-gray-800 shadow-sm dark:bg-gray-600 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            )}
          >
            <Icon icon="mdi:weather-sunny" className="text-sm" />
            Clair
          </button>
        </div>
      </div>

      {/* Context menu — fixed positioned so it escapes overflow:auto */}
      {menuOpenId && (
        <div
          ref={menuRef}
          className="fixed z-50 w-48 rounded-2xl border border-gray-200 bg-white p-1 shadow-xl dark:border-gray-700 dark:bg-[#1e2535]"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <button
            onClick={() => setMenuOpenId(null)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Icon icon="mdi:share-variant-outline" className="text-base text-gray-400" />
            Partager
          </button>
          <button
            onClick={() => {
              toggleSaveConversation(menuOpenId);
              setMenuOpenId(null);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Icon icon={menuConversation?.isSaved ? "mdi:pin-off-outline" : "mdi:pin-outline"} className="text-base text-gray-400" />
            {menuConversation?.isSaved ? "Désépingler" : "Épingler"}
          </button>
          <button
            onClick={() => handleRename(menuOpenId)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Icon icon="mdi:pencil-outline" className="text-base text-gray-400" />
            Renommer
          </button>
          <button
            onClick={() => {
              setConfirmDeleteId(menuOpenId);
              setMenuOpenId(null);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Icon icon="mdi:trash-can-outline" className="text-base" />
            Supprimer
          </button>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl w-80 mx-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Supprimer la discussion ?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Cette action est irréversible.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { conversations, activeConversationId, setActiveConversation } = useChatStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const timeout = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timeout);
  }, [open]);

  if (!open) return null;

  const formatConversationDate = (value: Date) => {
    const date = new Date(value);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const visibleConversations = conversations.filter((conversation) => {
    if (conversation.messages.length === 0) return false;
    return conversation.title.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-4 shadow-2xl dark:bg-[#1e2535]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-700">
          <Icon icon="mdi:magnify" className="text-lg text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une discussion"
            className="flex-1 bg-transparent text-sm text-black outline-none placeholder:text-gray-400 dark:text-white"
          />
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Fermer la recherche"
          >
            <Icon icon="mdi:close" className="text-sm" />
          </button>
        </div>

        <div className="mt-4 max-h-[360px] overflow-y-auto scrollbar-thin">
          {visibleConversations.length > 0 ? (
            <div className="space-y-1">
              {visibleConversations.map((conversation) => {
                const isActive = conversation.id === activeConversationId;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setActiveConversation(conversation.id);
                      router.push(`/chat/${conversation.id}`);
                      onClose();
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-black dark:text-white">
                        {conversation.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatConversationDate(conversation.updatedAt)}
                      </p>
                    </div>
                    <Icon icon="mdi:arrow-top-right" className="text-base text-gray-300" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">
              Aucun résultat
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Sidebar() {
  const isExpanded = useChatStore((s) => s.ui.isSidebarOpen);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <div className="h-full pb-4 pt-4 md:pb-6 md:pt-6">
        {isExpanded ? (
          <SidebarExpanded onOpenSearch={() => setIsSearchOpen(true)} />
        ) : (
          <SidebarCollapsed onOpenSearch={() => setIsSearchOpen(true)} />
        )}
      </div>
      <SearchDialog
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}

