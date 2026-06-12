"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Message, Source } from "@/lib/types";
import { copyToClipboard, cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface MessageItemProps {
  message: Message;
  onViewSources: (sources: Source[]) => void;
  onRetry?: () => void;
}

function cleanContent(text: string): string {
  return text
    .replace(/\(?(?:voir\s+)?(?:la\s+)?fiche\s+(?:info\s+)?(?:n[°o]?\s*)?\d+\)?[,.]?/gi, "")
    .replace(/\(?(?:voir\s+)?document\s+(?:n[°o]?\s*)?\d+\)?[,.]?/gi, "")
    .replace(/\(?(?:voir\s+)?source\s+(?:n[°o]?\s*)?\d+\)?[,.]?/gi, "")
    .replace(/[^\S\n]{2,}/g, " ") // collapse spaces but preserve newlines
    .trim();
}

export default function MessageItem({ message, onViewSources, onRetry }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    const ok = await copyToClipboard(message.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (message.error) {
    return (
      <div className="flex gap-3 items-start msg-appear">
        <div className="max-w-xl flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-400/25 dark:bg-red-500/12 dark:text-red-100">
          {message.error}
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end msg-appear">
        <div className="max-w-[72%] rounded-2xl bg-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-800 dark:bg-white/12 dark:text-white/92 dark:backdrop-blur-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.isLoading && !message.content) {
    return (
      <div className="flex items-start gap-3 msg-appear">
        <div className="flex items-center gap-1.5 py-2 px-1">
          {[0, 1, 2].map((i) => (
            <span
              key={`dot-${i}`}
              className="w-2 h-2 rounded-full bg-[#1CABE2]/60 dot-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const displayContent = cleanContent(message.content);
  const isEmptyOrError =
    !displayContent.trim() ||
    displayContent.startsWith("[ERREUR") ||
    displayContent.includes("Le contexte fourni ne contient pas");

  return (
    <div className="flex items-start gap-3 msg-appear">
      {/* Contenu */}
      <div className="flex flex-col gap-2 flex-1 min-w-0 max-w-[85%]">
        <div className="max-w-none text-sm leading-relaxed text-gray-700 dark:text-white/84">
          <ReactMarkdown
            components={{
              ol: ({ children }) => <ol className="list-decimal pl-5 mt-2 mb-2 space-y-2">{children}</ol>,
              ul: ({ children }) => <ul className="list-disc pl-5 mt-2 mb-2 space-y-1.5">{children}</ul>,
              li: ({ children }) => <li className="leading-relaxed text-sm">{children}</li>,
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-gray-800 dark:text-white/95">{children}</strong>,
              h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1 text-gray-800 dark:text-white">{children}</h1>,
              h2: ({ children }) => <h2 className="text-[13px] font-bold mt-2 mb-1 text-gray-800 dark:text-white">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-gray-800 dark:text-white">{children}</h3>,
            }}
          >
            {displayContent}
          </ReactMarkdown>
          {message.isLoading && (
            <span className="inline-block w-0.5 h-4 bg-[#1CABE2]/70 animate-pulse align-middle ml-0.5" />
          )}
        </div>

        {/* Boutons action */}
        <div className="flex items-center gap-1">
          {message.sources && message.sources.length > 0 && (
            <button
              onClick={() => onViewSources(message.sources!)}
              className="flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-0.5 text-[10px] text-gray-500 transition-all duration-150 hover:border-[#1CABE2]/40 hover:bg-blue-50 hover:text-[#1CABE2] dark:border-white/12 dark:text-white/68 dark:hover:bg-[#1CABE2]/10 dark:hover:text-white"
            >
              <Icon icon="mynaui:plus" className="text-[10px]" />
              Sources
            </button>
          )}
          {!isEmptyOrError && (
            <>
              <button
                onClick={handleCopy}
                title={copied ? "Copié !" : "Copier"}
                className="rounded-lg p-1.5 text-gray-400 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 dark:text-white/45 dark:hover:bg-white/8 dark:hover:text-white"
                aria-label="Copier"
              >
                <Icon icon={copied ? "mynaui:check" : "mynaui:copy"} className="text-sm" />
              </button>
              {onRetry && (
                <button
                  onClick={onRetry}
                  title="Relancer"
                  className="rounded-lg p-1.5 text-gray-400 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 dark:text-white/45 dark:hover:bg-white/8 dark:hover:text-white"
                  aria-label="Relancer la question"
                >
                  <Icon icon="mynaui:refresh" className="text-sm" />
                </button>
              )}
              <button
                onClick={() => setFeedback(feedback === "up" ? null : "up")}
                title="Bonne réponse"
                className={cn(
                  "rounded-lg p-1.5 transition-all duration-150",
                  feedback === "up"
                    ? "text-[#1CABE2]"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-white/45 dark:hover:bg-white/8 dark:hover:text-white"
                )}
                aria-label="Bonne réponse"
              >
                <Icon icon={feedback === "up" ? "mynaui:like-solid" : "mynaui:like"} className="text-sm" />
              </button>
              <button
                onClick={() => setFeedback(feedback === "down" ? null : "down")}
                title="Mauvaise réponse"
                className={cn(
                  "rounded-lg p-1.5 transition-all duration-150",
                  feedback === "down"
                    ? "text-red-500"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-white/45 dark:hover:bg-white/8 dark:hover:text-white"
                )}
                aria-label="Mauvaise réponse"
              >
                <Icon icon={feedback === "down" ? "mynaui:dislike-solid" : "mynaui:dislike"} className="text-sm" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
