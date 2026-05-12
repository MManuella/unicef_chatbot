"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import ThemeSelector from "./ThemeSelector";

interface MessageInputProps {
  selectedThemeId: string | null;
  onThemeChange: (themeId: string | null) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({
  selectedThemeId,
  onThemeChange,
  onSend,
  disabled,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !!value.trim() && !disabled;

  return (
    <div className="px-4 pb-5 pt-2">
      <div
        className={cn(
          "mx-auto max-w-3xl rounded-2xl border bg-white",
          "border transition-all duration-200",
          focused
            ? "border-[#1CABE2]/50 shadow-lg shadow-[#1CABE2]/8 ring-2 ring-[#1CABE2]/10"
            : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md dark:border-white/10 dark:bg-white/6 dark:shadow-black/10 dark:hover:border-white/18 dark:hover:shadow-black/10"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Posez votre question..."
          disabled={disabled}
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent px-4 pt-3.5 pb-2",
            "text-sm text-gray-700 dark:text-white",
            "placeholder:text-slate-400 focus:outline-none leading-6",
            "min-h-[44px] max-h-[180px] scrollbar-thin",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Votre message"
        />

        <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
          <ThemeSelector
            selectedThemeId={selectedThemeId}
            onThemeSelect={onThemeChange}
          />

          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200",
              canSend
                ? "bg-[#1CABE2] text-white hover:bg-[#1598cc] shadow-md shadow-[#1CABE2]/30 hover:scale-105 active:scale-95"
                : "bg-gray-100 text-gray-300 cursor-not-allowed dark:bg-white/10 dark:text-white/35"
            )}
            aria-label="Envoyer"
          >
            <Icon icon="mdi:arrow-up" className="text-base" />
          </button>
        </div>
      </div>
    </div>
  );
}
