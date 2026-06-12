"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useChatStore } from "@/store/chatStore";
import { getThemeById } from "@/lib/themes";
import { RenameDialog, DeleteConfirmDialog } from "@/components/ui/ConversationDialogs";

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
    toggleSidebar,
  } = useChatStore();
  const router = useRouter();

  // --- Dropdown titre ---
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });

  // --- Dropdown ⋮ ---
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsBtnRef = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [actionsPos, setActionsPos] = useState({ top: 0, right: 0 });

  // --- Partager ---
  const [copied, setCopied] = useState(false);

  // --- Supprimer ---
  const [deleteOpen, setDeleteOpen] = useState(false);

  // --- Renommer ---
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const conversation = conversationId
    ? conversations.find((c) => c.id === conversationId)
    : null;

  const theme = conversation?.themeId ? getThemeById(conversation.themeId) : null;
  const allSources = conversation?.messages.flatMap((m) => m.sources ?? []) ?? [];
  const isPinned = !!conversation?.isSaved;

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    if (!menuOpen && !actionsOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        menuBtnRef.current && !menuBtnRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
      if (
        actionsRef.current && !actionsRef.current.contains(event.target as Node) &&
        actionsBtnRef.current && !actionsBtnRef.current.contains(event.target as Node)
      ) {
        setActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, actionsOpen]);

  useEffect(() => {
    if (renameOpen) setRenameValue(conversation?.title ?? "");
  }, [renameOpen, conversation?.title]);

  const openMenu = () => {
    const rect = menuBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Alignement droit partout : bord droit du card aligné sous l'icône
    setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    setMenuOpen((o) => !o);
  };

  const openActions = () => {
    const rect = actionsBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setActionsPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    setActionsOpen((o) => !o);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: conversation?.title ?? "Discussion", url });
      } catch (_) {
        // annulé par l'utilisateur ou non supporté — fallback clipboard
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (_) {}
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (_) {}
    }
  };

  const handleRenameSubmit = () => {
    if (!conversationId || !renameValue.trim()) return;
    renameConversation(conversationId, renameValue.trim());
    setRenameOpen(false);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    if (!conversationId) return;
    deleteConversation(conversationId);
    setDeleteOpen(false);
    setMenuOpen(false);
    router.push("/");
  };

  // Style de positionnement du dropdown titre
  const menuStyle: React.CSSProperties = {
    top: menuPos.top,
    ...(menuPos.right !== undefined && { right: menuPos.right }),
    ...(menuPos.left !== undefined && { left: menuPos.left }),
  };

  return (
    <header className="flex items-center h-14 px-4 md:px-6 bg-transparent flex-shrink-0 animate-fade-in gap-2">
      {/* Hamburger mobile */}
      <button
        onClick={toggleSidebar}
        className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/8 transition-colors flex-shrink-0"
        aria-label="Ouvrir le menu"
      >
        <Icon icon="mynaui:menu" className="text-xl" />
      </button>

      {/* Titre + chevron */}
      <div className="flex items-center min-w-0 flex-1 gap-1">
        <h1 className="truncate min-w-0 shrink text-sm font-semibold tracking-[-0.02em] text-gray-900 dark:text-white">
          {conversation?.title ?? ""}
        </h1>
        <button
          ref={menuBtnRef}
          onClick={openMenu}
          className={[
            "flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-150",
            menuOpen
              ? "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-white/50 dark:hover:bg-white/8 dark:hover:text-white",
          ].join(" ")}
          aria-label="Afficher les actions"
        >
          <Icon icon="mynaui:chevron-down" className="text-base" />
        </button>
      </div>

      {/* Dropdown titre — portal */}
      {menuOpen && conversationId && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] w-48 rounded-2xl border border-gray-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-[#0f1a28] dark:shadow-black/40"
          style={menuStyle}
        >
          <button
            onClick={() => { handleShare(); setMenuOpen(false); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-200/60 dark:text-white/82 dark:hover:bg-white/10"
          >
            <Icon icon="mynaui:share" className="text-base text-gray-700 dark:text-white/70" />
            Partager
          </button>
          <button
            onClick={() => { toggleSaveConversation(conversationId); setMenuOpen(false); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-200/60 dark:text-white/82 dark:hover:bg-white/10"
          >
            <Icon icon={isPinned ? "mynaui:pin-solid" : "mynaui:pin"} className="text-base text-gray-700 dark:text-white/70" />
            {isPinned ? "Désépingler" : "Épingler"}
          </button>
          <button
            onClick={() => { setMenuOpen(false); setRenameOpen(true); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-200/60 dark:text-white/82 dark:hover:bg-white/10"
          >
            <Icon icon="mynaui:edit" className="text-base text-gray-700 dark:text-white/70" />
            Renommer
          </button>
          <button
            onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Icon icon="mynaui:trash" className="text-base" />
            Supprimer
          </button>
        </div>,
        document.body
      )}

      {/* Desktop : boutons Sources + Partager */}
      <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
        {allSources.length > 0 && (
          <button
            onClick={() => openSourcesPanel(allSources)}
            className="rounded-xl border border-gray-200 px-3 py-1 text-[10px] font-medium text-gray-900 transition-all hover:border-[#1CABE2]/50 hover:text-[#1CABE2] dark:border-white/15 dark:text-white dark:hover:border-[#1CABE2]/40"
          >
            Sources
          </button>
        )}
        <button
          onClick={handleShare}
          className="rounded-xl border border-gray-200 px-3 py-1 text-[10px] font-medium text-gray-900 transition-all hover:border-[#1CABE2]/50 hover:text-[#1CABE2] dark:border-white/15 dark:text-white dark:hover:border-[#1CABE2]/40"
        >
          {copied ? "Copié !" : "Partager"}
        </button>
      </div>

      {/* Mobile : icône ⋮ */}
      <div className="md:hidden flex-shrink-0">
        <button
          ref={actionsBtnRef}
          onClick={openActions}
          className={[
            "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
            actionsOpen
              ? "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-white/50 dark:hover:bg-white/8 dark:hover:text-white",
          ].join(" ")}
          aria-label="Plus d'actions"
        >
          <Icon icon="mynaui:dots-vertical" className="text-lg" />
        </button>
      </div>

      {/* Dropdown ⋮ — portal */}
      {actionsOpen && createPortal(
        <div
          ref={actionsRef}
          className="fixed z-[9999] w-48 rounded-2xl border border-gray-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-[#0f1a28] dark:shadow-black/40"
          style={{ top: actionsPos.top, right: actionsPos.right }}
        >
          {allSources.length > 0 && (
            <button
              onClick={() => { openSourcesPanel(allSources); setActionsOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-200/60 dark:text-white/82 dark:hover:bg-white/10"
            >
              <Icon icon="mynaui:book-open" className="text-base text-gray-700 dark:text-white/70" />
              Sources
            </button>
          )}
          <button
            onClick={() => { handleShare(); setActionsOpen(false); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-200/60 dark:text-white/82 dark:hover:bg-white/10"
          >
            <Icon icon={copied ? "mynaui:check" : "mynaui:share"} className="text-base text-gray-700 dark:text-white/70" />
            {copied ? "Copié !" : "Partager"}
          </button>
        </div>,
        document.body
      )}

      <DeleteConfirmDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />

      <RenameDialog
        open={renameOpen}
        value={renameValue}
        onChange={setRenameValue}
        onSubmit={handleRenameSubmit}
        onClose={() => setRenameOpen(false)}
      />
    </header>
  );
}
