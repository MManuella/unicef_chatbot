"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";

/**
 * Applies the dark/light class to <html> based on the Zustand store.
 * Must be rendered inside the store provider (client component).
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeMode = useChatStore((s) => s.ui.themeMode);

  const applyTheme = (mode: "light" | "dark") => {
    const root = document.documentElement;
    const body = document.body;
    const isDark = mode === "dark";

    root.classList.toggle("dark", isDark);
    body.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
  };

  // Applique le thème au montage et à chaque changement
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode]);

  return <>{children}</>;
}
