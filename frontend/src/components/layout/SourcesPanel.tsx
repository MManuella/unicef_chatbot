"use client";

import { Icon } from "@iconify/react";
import { Source } from "@/lib/types";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";

export default function SourcesPanel({ isOpen }: { isOpen: boolean }) {
  const { ui, closeSourcesPanel } = useChatStore();
  const sources = ui?.activeSources ?? [];
  const desktopRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let timer: ReturnType<typeof setTimeout>;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !desktopRef.current?.contains(target) &&
        !mobileRef.current?.contains(target)
      ) {
        closeSourcesPanel();
      }
    };
    timer = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [isOpen, closeSourcesPanel]);

  const innerContent = (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Icon icon="mynaui:book-open" className="text-[#1CABE2] text-xl" />
            <h2 className="font-semibold tracking-[-0.02em] text-gray-800 dark:text-white">Sources</h2>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-[#1CABE2] dark:bg-white/10 dark:text-white/85">
              {sources.length}
            </span>
          </div>
          <button
            onClick={closeSourcesPanel}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-white/55 dark:hover:bg-white/8 dark:hover:text-white"
            aria-label="Close"
          >
            <Icon icon="mynaui:x" className="text-lg" />
          </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon icon="mynaui:file-search" className="mb-3 text-4xl text-gray-300 dark:text-white/30" />
            <p className="text-sm text-gray-400 dark:text-white/45">Aucune source disponible</p>
          </div>
        ) : (
          sources.map((s, i) => <SourceCard key={`${s.id}-${i}`} source={s} index={i + 1} />)
        )}
      </div>
      <div className="border-t border-gray-200 px-4 py-3 dark:border-white/10">
        <p className="text-center text-xs text-gray-400 dark:text-white/50">
          Consultez toujours un professionnel de santé pour un avis médical personnalisé.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile : backdrop + drawer off-canvas */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeSourcesPanel}
        aria-hidden="true"
      />
      <aside
        ref={mobileRef}
        className={cn(
          "md:hidden fixed right-0 top-0 z-[160] h-full w-80 max-w-[90vw] flex flex-col",
          "bg-white text-gray-700 shadow-2xl shadow-black/20",
          "dark:bg-[linear-gradient(180deg,#173149_0%,#102537_100%)] dark:text-white dark:shadow-black/40",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Sources"
      >
        {innerContent}
      </aside>

      {/* Desktop : panneau inline dans le layout */}
      <aside
        ref={desktopRef}
        className={cn(
          "hidden md:flex flex-col sources-surface h-full min-h-0 flex-shrink-0 overflow-hidden rounded-3xl border border-gray-200/80 bg-white text-gray-700 shadow-xl shadow-slate-200/70 transition-all duration-300 dark:border-white/10 dark:bg-[linear-gradient(180deg,#173149_0%,#102537_100%)] dark:text-white dark:shadow-[#07101c]/25",
          isOpen ? "w-80 opacity-100" : "w-0 min-w-0 opacity-0 pointer-events-none border-transparent shadow-none"
        )}
        aria-label="Sources"
      >
        {innerContent}
      </aside>
    </>
  );
}

// Vérifie si une URL est un vrai lien web externe (et non "page X")
function isExternalUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Nettoie le nom d'un fichier : enlève l'extension et remplace _ / - par des espaces
function cleanTitle(raw: string): string {
  const filename = raw.split("/").pop()?.split("\\").pop() ?? raw;
  return filename.replace(/\.pdf$/i, "").replace(/[_-]/g, " ").trim();
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  const displayTitle = cleanTitle(source.title);
  // "page X" vient du backend via source.url quand c'est un PDF
  const pageLabel =
    source.url && !isExternalUrl(source.url) ? source.url : null;

  return (
    <div className="hover-lift cursor-default rounded-2xl border border-gray-200 bg-white p-3 shadow-sm shadow-slate-200/60 dark:border-white/10 dark:bg-white/6 dark:shadow-none dark:backdrop-blur-sm">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#1CABE2] dark:bg-white/10 dark:text-[#7fd5ff]">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          {/* Nom du document */}
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="mynaui:file" className="text-sm text-gray-400 flex-shrink-0 dark:text-white/35" />
            <h3 className="truncate text-sm font-semibold text-gray-800 dark:text-white" title={source.title}>
              {displayTitle}
            </h3>
            {pageLabel && (
              <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-white/10 dark:text-white/60">
                {pageLabel}
              </span>
            )}
          </div>
          {/* Extrait pertinent */}
          {source.excerpt && (
            <p className="text-xs leading-relaxed text-gray-500 dark:text-white/62">
              {source.excerpt}
            </p>
          )}
          {/* Lien externe uniquement si c'est une vraie URL */}
          {isExternalUrl(source.url) && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#1CABE2] hover:underline dark:text-[#7fd5ff]"
            >
              <Icon icon="mynaui:external-link" className="text-sm" />
              Consulter la source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

