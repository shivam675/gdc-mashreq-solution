import React from 'react';
import { Post } from "../types";
import ReactionBar from "./ReactionBar";
import CommentSection from "./CommentSection";
import { ThumbsUp, MessageSquare, Clock } from "lucide-react";

interface PostCardProps {
  post: Post;
  refreshFeed: () => void;
}

const formatDate = (dateString?: string) => {
    if (!dateString) return "Just now";
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        }).format(date);
    } catch (e) {
        return "Just now";
    }
};

const PostCard: React.FC<PostCardProps> = ({ post, refreshFeed }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl mb-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-none dark:border dark:border-slate-800 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
            {/* Mock Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white dark:ring-slate-800">
                AI
            </div>
            <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Anonymous User</h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock size={10} className="opacity-70" />
                    <p>{formatDate(post.created_at)}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="text-slate-800 dark:text-slate-300 text-[15px] leading-7 mb-4 whitespace-pre-wrap">
        {post.content}
      </div>

      {post.image_url && (
        <div className="rounded-xl overflow-hidden mb-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <img 
                src={post.image_url} 
                alt="Post content" 
                className="w-full h-auto object-cover max-h-[500px] hover:scale-[1.02] transition-transform duration-500 ease-out"
                loading="lazy"
            />
        </div>
      )}

      <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 mb-2 pt-2 border-t border-transparent dark:border-slate-800/50">
        <div className="flex items-center gap-1.5">
            <ThumbsUp size={16} className={post.reaction_count > 0 ? "text-brand-600 dark:text-brand-400 fill-brand-50 dark:fill-brand-900/20" : ""} />
            <span className="font-medium text-slate-700 dark:text-slate-300">{post.reaction_count}</span>
            <span className="sr-only">Reactions</span>
        </div>
        <div className="flex items-center gap-1.5">
            <MessageSquare size={16} />
            <span className="font-medium text-slate-700 dark:text-slate-300">{post.comment_count}</span>
            <span className="hidden sm:inline">Comments</span>
        </div>
      </div>

      <ReactionBar postId={post.id} onReact={refreshFeed} />
      
      <CommentSection postId={post.id} />
    </div>
  );
};

export default PostCard;