"use client";

import { Icon } from "@iconify/react";
import { useChatStore } from "@/store/chatStore";

interface WelcomeScreenProps {
  onSelectQuestion: (question: string) => void;
}

export default function WelcomeScreen({ onSelectQuestion: _ }: WelcomeScreenProps) {
  const selectedThemeId = useChatStore((s) => s.selectedThemeId);

  return (
    <div className="flex flex-col items-center gap-6 animate-in">
      {/* Logo + titre */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1CABE2] to-[#0d8bbf] flex items-center justify-center shadow-lg shadow-[#1CABE2]/20">
          <Icon icon="mdi:heart-pulse" className="text-white text-3xl" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
            UniSanté
          </h1>
          <p className="mt-0.5 text-sm text-gray-400 dark:text-white/52">
            Assistant de santé UNICEF
          </p>
        </div>
      </div>

      {/* Sous-titre */}
      <p className="max-w-md text-center text-base leading-relaxed text-gray-500 dark:text-white/68">
        Posez votre question ou choisissez un sujet ci-dessous pour commencer.
      </p>

      {/* Hint si pas de thème sélectionné */}
      {!selectedThemeId && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-white/10 dark:bg-white/6 dark:backdrop-blur-sm">
          <Icon icon="mdi:lightbulb-on-outline" className="text-[#1CABE2] text-base flex-shrink-0" />
          <p className="text-sm text-gray-500 dark:text-white/68">
            Sélectionnez une thématique pour voir les suggestions de questions.
          </p>
        </div>
      )}
    </div>
  );
}
