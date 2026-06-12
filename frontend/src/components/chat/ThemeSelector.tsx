"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { HEALTH_THEMES } from "@/lib/themes";
import { BackendTopic } from "@/lib/types";
import { fetchThemes } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ThemeSelectorProps {
  selectedThemeId: string | null;
  onThemeSelect: (themeId: string | null) => void;
}

export default function ThemeSelector({
  selectedThemeId,
  onThemeSelect,
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Thématiques chargées depuis le backend (fallback sur les thèmes locaux)
  const [backendTopics, setBackendTopics] = useState<BackendTopic[]>(
    HEALTH_THEMES.map((t) => ({ id: t.id, title: t.name, icon: t.icon }))
  );

  // Charger les thématiques depuis le backend au montage
  useEffect(() => {
    let isMounted = true;
    fetchThemes()
      .then((topics) => {
        if (!isMounted || topics.length === 0) return;
        const localOrder = HEALTH_THEMES.map((t) => t.id);
        const sorted = [...topics].sort((a, b) => {
          const ia = localOrder.indexOf(a.id);
          const ib = localOrder.indexOf(b.id);
          if (ia === -1 && ib === -1) return 0;
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });
        setBackendTopics(sorted);
      })
      .catch(() => {}); // garder les thèmes locaux en cas d'erreur
    return () => { isMounted = false; };
  }, []);

  // Nom à afficher pour la thématique sélectionnée
  const selectedName =
    backendTopics?.find((t) => t.id === selectedThemeId)?.title ??
    HEALTH_THEMES.find((t) => t.id === selectedThemeId)?.name;

  const displayTopics = backendTopics;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSelect = (id: string) => {
    onThemeSelect(id);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative flex items-center gap-2 flex-shrink-0">
      {/* Bouton déclencheur */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-150",
          isOpen
            ? "bg-gray-200 text-gray-900 dark:bg-white/15 dark:text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-white/72 dark:hover:bg-white/8 dark:hover:text-white"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Icon icon="mdi:tune-variant" className="text-sm" />
        Thématiques
      </button>

      {/* Tag de la thématique sélectionnée */}
      {selectedName && (
        <div className="group flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-gray-900 transition-all duration-150 hover:bg-gray-100 dark:text-white dark:hover:bg-white/10">
          {selectedName}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onThemeSelect(null);
            }}
            className="ml-0.5 rounded-full p-0.5 text-gray-600 transition-all duration-150 hover:bg-gray-200 hover:text-gray-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Supprimer la thématique"
          >
            <Icon icon="mynaui:x" className="text-xs" />
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#0f1a28]/95 dark:backdrop-blur"
          role="listbox"
          aria-label="Choisir une thématique"
        >
          <div className="max-h-60 overflow-y-auto scrollbar-thin space-y-1">
            {(
              displayTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleSelect(topic.id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left text-sm transition-all duration-150",
                    selectedThemeId === topic.id
                      ? "bg-blue-50 text-[#1CABE2] dark:bg-[#1CABE2]/18 dark:text-white"
                      : "text-gray-700 hover:bg-blue-50 hover:text-gray-900 dark:text-white/82 dark:hover:bg-white/8 dark:hover:text-white"
                  )}
                  role="option"
                  aria-selected={selectedThemeId === topic.id}
                >
                  {topic.title}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

