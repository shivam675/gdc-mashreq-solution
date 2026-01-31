import React from 'react';
import { reactPost } from "../services/api";
import { ReactionItem } from "../types";

const reactions: ReactionItem[] = [
  { emoji: "👍", color: "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40", label: "Like" },
  { emoji: "🎉", color: "bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40", label: "Celebrate" },
  { emoji: "💡", color: "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40", label: "Insightful" },
  { emoji: "❤️", color: "bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40", label: "Love" },
];

interface ReactionBarProps {
  postId: number;
  onReact: () => void;
}

export default function ReactionBar({ postId, onReact }: ReactionBarProps) {
  const handle = async (emoji: string) => {
    await reactPost(postId, emoji);
    if (onReact) onReact();
  };



  return (
    <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => handle(r.emoji)}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full
            transition-all duration-200 transform hover:scale-110 active:scale-95
            shadow-sm border border-transparent hover:border-black/5 dark:hover:border-white/10
            text-lg ${r.color}
          `}
          title={r.label}
          aria-label={r.label}
        >
          {r.emoji}
        </button>
      ))}
    </div>
  );
}