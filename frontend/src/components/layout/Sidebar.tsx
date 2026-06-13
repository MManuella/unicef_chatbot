"use client";

import { Icon } from "@iconify/react";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { RenameDialog, DeleteConfirmDialog } from "@/components/ui/ConversationDialogs";
import type { Conversation } from "@/lib/types";

/** Truncate a conversation title for display (max 32 chars, word boundary) */
function truncDisplay(title: string, max = 32): string {
  if (title.length <= max) return title;
  const cut = title.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 12 ? cut.slice(0, lastSpace) : cut) + "…";
}
// ─── Icon-only strip (collapsed state) ────────────────────────────────────────
function SidebarCollapsed({
  onOpenSearch,
}: {
  onOpenSearch: () => void;
}) {
  const { toggleSidebar, toggleThemeMode, ui, setSelectedTheme } =
    useChatStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleNewConversation = () => {
    setSelectedTheme(null);
    router.push("/");
  };

  return (
    <aside className="flex h-full w-12 flex-col items-center bg-transparent py-3 text-[color:var(--foreground)] dark:text-white/78 flex-shrink-0">
      {/* Top icons */}
      <div className="flex flex-col items-center gap-1 flex-1">
        <StripBtn
          icon="mynaui:sidebar"
          label="Expand sidebar"
          onClick={toggleSidebar}
        />
        <StripBtn
          icon="mynaui:plus"
          label="New discussion"
          onClick={handleNewConversation}
          isActive={pathname === "/"}
        />
        <StripBtn
          icon="mynaui:search"
          label="Search"
          onClick={onOpenSearch}
        />
        <StripBtn
          icon="mynaui:chat"
          label="Discussions"
          onClick={toggleSidebar}
        />
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-1">
        <StripBtn icon="mynaui:user" label="Profile" />
        <StripBtn
          icon={
            ui.themeMode === "dark"
              ? "mynaui:sun"
              : "mynaui:moon"
          }
          label="Toggle theme"
          onClick={toggleThemeMode}
        />
        <StripBtn icon="mynaui:cog" label="Settings" />
      </div>
    </aside>
  );
}

function StripBtn({
  icon,
  label,
  onClick,
  isActive,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        isActive
          ? "bg-white/70 text-[#1CABE2] dark:bg-gray-800 dark:text-[#1CABE2]"
          : "text-gray-400 hover:bg-white/70 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      )}
    >
      <Icon icon={icon} className="text-[18px]" />
    </button>
  );
}

// ─── Conversation item ────────────────────────────────────────────────────────
function ConversationItem({
  conv,
  isActive,
  menuOpenId,
  onSelect,
  onMenu,
  onRename,
}: {
  conv: Conversation;
  isActive: boolean;
  menuOpenId: string | null;
  onSelect: () => void;
  onMenu: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onRename: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
        isActive
          ? "bg-gray-200/70 dark:bg-blue-900/20"
          : "hover:bg-gray-200/80 dark:hover:bg-gray-700/60"
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(); }}
    >
      <p
        className={cn("flex-1 text-[13px] truncate text-gray-800 transition-colors dark:text-white/88", isActive && "font-bold text-gray-900 dark:text-white")}
        title={conv.title}
        onDoubleClick={(e) => { e.stopPropagation(); onRename(); }}
      >
        {truncDisplay(conv.title)}
      </p>
      <button
        onClick={onMenu}
        className={cn(
          "flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-gray-700 transition-all hover:bg-gray-300/80 hover:text-gray-900 dark:text-white/70 dark:hover:bg-white/15 dark:hover:text-white",
          menuOpenId === conv.id
            ? "opacity-100 bg-gray-300/80 dark:bg-white/15"
            : "opacity-0 group-hover:opacity-100"
        )}
        aria-label="Options"
      >
        <Icon icon="mynaui:dots" className="text-base" />
      </button>
    </div>
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
    deleteConversation,
    toggleSaveConversation,
    renameConversation,
    toggleSidebar,
    setThemeMode,
    setSelectedTheme,
  } = useChatStore();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

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

  const filtered = conversations.filter((c) => c.messages.length > 0);

  const pinnedConversations = filtered.filter((c) => c.isSaved);
  const regularConversations = filtered.filter((c) => !c.isSaved);

  const openMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (menuOpenId === id) { setMenuOpenId(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 192) });
    setMenuOpenId(id);
  };

  useEffect(() => {
    if (renameId) {
      const conv = conversations.find((c) => c.id === renameId);
      setRenameValue(conv?.title ?? "");
    }
  }, [renameId, conversations]);

  const openRename = (id: string) => {
    setMenuOpenId(null);
    setRenameId(id);
  };

  const handleRenameSubmit = () => {
    if (!renameId || !renameValue.trim()) return;
    renameConversation(renameId, renameValue.trim());
    setRenameId(null);
  };

  const handleDelete = (id: string) => {
    const willBeEmpty = conversations.length <= 1;
    deleteConversation(id);
    setConfirmDeleteId(null);
    if (willBeEmpty) router.push("/");
  };

  const handleRename = (id: string) => {
    openRename(id);
  };

  const menuConversation = menuOpenId
    ? conversations.find((c) => c.id === menuOpenId)
    : null;

  return (
    <aside className="flex h-full w-64 flex-col bg-transparent text-[color:var(--foreground)] dark:text-white/78 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2 pl-3">
          <span className="font-bold text-gray-900 text-xl dark:text-white">U-Assistant</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onOpenSearch}
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-white/60 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Rechercher"
          >
            <Icon icon="mynaui:search" className="text-[18px]" />
          </button>
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-white/60 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Réduire la sidebar"
          >
            <Icon icon="mynaui:sidebar" className="text-[18px]" />
          </button>
        </div>
      </div>

      {/* New discussion */}
      <div className="px-3 pt-3">
        <button
          onClick={() => { setSelectedTheme(null); router.push("/"); }}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200",
            pathname === "/"
              ? "bg-gray-200/70 text-gray-900 dark:bg-white/10 dark:text-white"
              : "text-gray-800 hover:bg-gray-200/70 dark:text-gray-200 dark:hover:bg-white/10"
          )}
        >
          <span className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 transition-colors",
            pathname === "/"
              ? "bg-gray-200 text-gray-900 dark:bg-white/12 dark:text-white"
              : "bg-gray-200 text-gray-900 dark:bg-white/12 dark:text-white"
          )}>
            <Icon icon="mynaui:plus" className="text-sm" />
          </span>
          Nouvelle discussion
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 scrollbar-thin">
        <div className="space-y-0.5">
          {pinnedConversations.length > 0 && (
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Épinglées
            </p>
          )}
          {pinnedConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isActive={conv.id === activeConversationId && pathname !== "/"}
              menuOpenId={menuOpenId}
              onSelect={() => { setActiveConversation(conv.id); router.push(`/chat/${conv.id}`); }}
              onMenu={(e) => openMenu(conv.id, e)}
              onRename={() => openRename(conv.id)}
            />
          ))}
          {regularConversations.length > 0 && (
            <p className={cn(
              "px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500",
              pinnedConversations.length > 0 && "pt-3"
            )}>
              Récentes
            </p>
          )}
          {regularConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              isActive={conv.id === activeConversationId && pathname !== "/"}
              menuOpenId={menuOpenId}
              onSelect={() => { setActiveConversation(conv.id); router.push(`/chat/${conv.id}`); }}
              onMenu={(e) => openMenu(conv.id, e)}
              onRename={() => openRename(conv.id)}
            />
          ))}
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
            onClick={() => setThemeMode("light")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all",
              ui.themeMode === "light"
                ? "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            )}
          >
            <Icon icon="mynaui:sun" className="text-sm" />
            Clair
          </button>
          <button
            onClick={() => setThemeMode("dark")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all",
              ui.themeMode === "dark"
                ? "bg-gray-200 text-gray-800 shadow-sm dark:bg-gray-600 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            )}
          >
            <Icon icon="mynaui:moon" className="text-sm" />
            Sombre
          </button>
        </div>
      </div>

      {/* Context menu — rendered via portal to escape stacking contexts */}
      {menuOpenId && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] w-48 rounded-2xl border border-gray-200 bg-white p-1 shadow-xl dark:border-gray-700 dark:bg-[#1e2535]"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <button
            onClick={() => setMenuOpenId(null)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-900 transition-colors hover:bg-gray-200/60 dark:text-white dark:hover:bg-white/10"
          >
            <Icon icon="mynaui:share" className="text-base text-gray-700 dark:text-white/70" />
            Partager
          </button>
          <button
            onClick={() => {
              toggleSaveConversation(menuOpenId);
              setMenuOpenId(null);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-900 transition-colors hover:bg-gray-200/60 dark:text-white dark:hover:bg-white/10"
          >
            <Icon icon={menuConversation?.isSaved ? "mynaui:pin-solid" : "mynaui:pin"} className="text-base text-gray-700 dark:text-white/70" />
            {menuConversation?.isSaved ? "Désépingler" : "Épingler"}
          </button>
          <button
            onClick={() => handleRename(menuOpenId)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-900 transition-colors hover:bg-gray-200/60 dark:text-white dark:hover:bg-white/10"
          >
            <Icon icon="mynaui:edit" className="text-base text-gray-700 dark:text-white/70" />
            Renommer
          </button>
          <button
            onClick={() => {
              setConfirmDeleteId(menuOpenId);
              setMenuOpenId(null);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Icon icon="mynaui:trash" className="text-base" />
            Supprimer
          </button>
        </div>,
        document.body
      )}

      <DeleteConfirmDialog
        open={!!confirmDeleteId}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
      />

      <RenameDialog
        open={!!renameId}
        value={renameValue}
        onChange={setRenameValue}
        onSubmit={handleRenameSubmit}
        onClose={() => setRenameId(null)}
      />
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
        className="w-full max-w-xl rounded-3xl bg-white p-3 md:p-4 shadow-2xl dark:bg-[#1e2535]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-700">
          <Icon icon="mynaui:search" className="text-lg text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une discussion"
            className="flex-1 bg-transparent text-xs md:text-sm text-black outline-none placeholder:text-gray-400 dark:text-white"
          />
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Fermer la recherche"
          >
            <Icon icon="mynaui:x" className="text-sm" />
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
                      <p className="truncate text-xs md:text-sm font-medium text-black dark:text-white" title={conversation.title}>
                        {conversation.title}
                      </p>
                      <p className="mt-0.5 text-[10px] md:text-xs text-gray-400">
                        {formatConversationDate(conversation.updatedAt)}
                      </p>
                    </div>
                    <Icon icon="mynaui:arrow-up-right" className="text-base text-gray-300" />
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
  const toggleSidebar = useChatStore((s) => s.toggleSidebar);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      {/* ── Desktop: inline sidebar (hidden on mobile) ── */}
      <div className="hidden md:flex h-full pb-6 pt-6 flex-shrink-0">
        {isExpanded ? (
          <SidebarExpanded onOpenSearch={() => setIsSearchOpen(true)} />
        ) : (
          <SidebarCollapsed onOpenSearch={() => setIsSearchOpen(true)} />
        )}
      </div>

      {/* ── Mobile: backdrop overlay ── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      {/* ── Mobile: slide-in drawer ── */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full z-50 w-72 transition-transform duration-300 ease-in-out md:hidden",
          "bg-[var(--background)] dark:bg-[#0b1220] shadow-2xl",
          isExpanded ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarExpanded onOpenSearch={() => { setIsSearchOpen(true); }} />
      </div>

      <SearchDialog
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}

