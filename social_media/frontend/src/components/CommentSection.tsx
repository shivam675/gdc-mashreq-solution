import React, { useEffect, useState, useCallback } from "react";
import { commentPost, fetchComments } from "../services/api";
import { Comment } from "../types";
import { MessageCircle, CornerDownRight, X, Send } from "lucide-react";

interface CommentSectionProps {
  postId: number;
}

const formatCommentDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        }).format(date);
    } catch {
        return "";
    }
};

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    const res = await fetchComments(postId);
    if (res.data) {
      setComments(res.data);
    }
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const submitComment = async () => {
    if (!newComment.trim()) return;
    await commentPost(postId, newComment);
    setNewComment("");
    loadComments();
  };

  const submitReply = async (parentId: number) => {
    if (!replyText.trim()) return;
    await commentPost(postId, replyText, parentId);
    setReplyText("");
    setActiveReplyId(null);
    loadComments();
  };

  const renderComments = (list: Comment[], level = 0) =>
    list.map((c) => (
      <div 
        key={c.id} 
        className={`relative ${level > 0 ? "ml-4 sm:ml-8 pl-4 border-l-2 border-slate-100 dark:border-slate-800" : "mt-4"}`}
      >
        <div className="group bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-lg p-3 transition-colors">
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{c.text}</p>
          
          <div className="mt-2 flex items-center justify-between">
            <button
                onClick={() => setActiveReplyId(activeReplyId === c.id ? null : c.id)}
                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 transition-colors"
            >
                <MessageCircle size={12} />
                Reply
            </button>
            {c.created_at && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {formatCommentDate(c.created_at)}
                </span>
            )}
          </div>
        </div>

        {/* INLINE REPLY BOX */}
        {activeReplyId === c.id && (
          <div className="mt-2 ml-2 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
             <div className="flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-0 rounded-md text-sm px-3 py-2 transition-all outline-none text-slate-900 dark:text-white"
                  autoFocus
                />
                <button 
                  onClick={() => submitReply(c.id)}
                  className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md transition-colors"
                >
                  <Send size={14} />
                </button>
                <button
                  onClick={() => {
                    setActiveReplyId(null);
                    setReplyText("");
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <X size={14} />
                </button>
             </div>
          </div>
        )}

        {c.replies && c.replies.length > 0 && (
          <div className="mt-2">
            {renderComments(c.replies, level + 1)}
          </div>
        )}
      </div>
    ));

  return (
    <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
      {/* NEW TOP-LEVEL COMMENT */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
            <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            placeholder="Add to the discussion..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm text-slate-900 dark:text-white placeholder-slate-400"
            />
            <button 
                onClick={submitComment}
                disabled={!newComment.trim()}
                className="absolute right-1.5 top-1.5 p-1.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <CornerDownRight size={14} />
            </button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && comments.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-2">Loading comments...</p>
        ) : (
            renderComments(comments)
        )}
        {!isLoading && comments.length === 0 && (
            <p className="text-center text-slate-400 dark:text-slate-500 text-xs italic">No comments yet. Be the first to say something!</p>
        )}
      </div>
    </div>
  );
}