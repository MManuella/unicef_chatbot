"use client";

import { useState, useEffect } from "react";
import { SubTopic, TopicStarterResponse } from "@/lib/types";
import { fetchTopicDetails } from "@/lib/api";
import { getThemeById } from "@/lib/themes";

interface SuggestedQuestionsProps {
  themeId: string;
  onSelect: (question: string) => void;
}

export default function SuggestedQuestions({
  themeId,
  onSelect,
}: SuggestedQuestionsProps) {
  const [topicDetails, setTopicDetails] = useState<TopicStarterResponse | null>(null);

  // Charger les détails du topic depuis le backend
  useEffect(() => {
    setTopicDetails(null);
    fetchTopicDetails(themeId)
      .then(setTopicDetails)
      .catch(() => setTopicDetails(null));
  }, [themeId]);

  // Suggestions : sous-thèmes backend ou fallback thèmes locaux
  const localTheme = getThemeById(themeId);
  const suggestions: { label: string; prompt: string }[] =
    topicDetails?.sub_topics && topicDetails.sub_topics.length > 0
      ? topicDetails.sub_topics
      : (localTheme?.suggestedQuestions ?? []).map((q) => ({ label: q, prompt: q }));

  if (suggestions.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-6 pb-4">
      <div className="flex flex-wrap justify-center gap-3">
        {suggestions.map((s: SubTopic) => (
          <button
            key={s.prompt}
            onClick={() => onSelect(s.prompt)}
            className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm transition-all duration-150 hover:border-[#1CABE2]/50 hover:bg-blue-50 hover:text-[#1CABE2] dark:border-white/10 dark:bg-white/6 dark:text-white/82 dark:shadow-black/10 dark:hover:bg-[#1CABE2]/12 dark:hover:text-white"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
