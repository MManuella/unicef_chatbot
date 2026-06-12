"use client";

import { Icon } from "@iconify/react";
import { useChatStore } from "@/store/chatStore";

export default function WelcomeScreen() {
  const selectedThemeId = useChatStore((s) => s.selectedThemeId);

  return (
    <div className="flex flex-col items-center gap-6 animate-in">
      {/* Logo + titre */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1CABE2] to-[#0d8bbf] flex items-center justify-center shadow-lg shadow-[#1CABE2]/20">
          <Icon icon="arcticons:vivo-tips" className="text-white text-3xl" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
            U-Assistant
          </h1>
          <p className="mt-0.5 text-sm text-gray-400 dark:text-white/52">
            Votre assistant de sensibilisation et d'accompagnement en santé
          </p>
        </div>
      </div>

      {!selectedThemeId && (
        <p className="animate-fade-in text-sm text-gray-800 dark:text-white/70 text-center max-w-sm">
          Sélectionnez une thématique pour voir des suggestions, ou posez directement votre question.
        </p>
      )}
    </div>
  );
}
