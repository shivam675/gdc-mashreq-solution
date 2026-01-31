// --- frontend/src/components/CreatePost.tsx ---
import { useState, useRef } from "react";
import { createPost } from "../services/api";
import { Channel } from "../types";
import { Send, Image as ImageIcon, Calendar, X, Loader2 } from "lucide-react";

type Props = {
  channel?: Channel;
  onPosted?: () => void;
};

export default function CreatePost({ channel, onPosted }: Props) {
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [showExtras, setShowExtras] = useState(false);
  const [loading, setLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handlePost = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      await createPost({
        content,
        channel_id: channel?.id || "general",
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        image_url: imageUrl || null,
      });

      // Reset
      setContent("");
      setImageUrl("");
      setScheduledAt("");
      setShowExtras(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      onPosted?.();
    } catch (error) {
      console.error("Failed to post", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handlePost();
    }
  };

  return (
    <div className="bg-card border border-white/10 rounded-xl shadow-lg relative transition-all">

      {/* Extras Preview (Image/Date) - Appears above input if set */}
      {(imageUrl || scheduledAt) && (
        <div className="flex gap-2 p-3 border-b border-white/5 bg-white/5 rounded-t-xl overflow-x-auto">
            {imageUrl && (
                <div className="flex items-center gap-2 bg-bg/80 px-2 py-1 rounded text-xs border border-white/10">
                    <span className="text-accent">IMAGE</span>
                    <span className="truncate max-w-[150px]">{imageUrl}</span>
                    <button onClick={() => setImageUrl("")}><X size={12}/></button>
                </div>
            )}
            {scheduledAt && (
                <div className="flex items-center gap-2 bg-bg/80 px-2 py-1 rounded text-xs border border-white/10">
                    <span className="text-accent">SCHEDULE</span>
                    <span>{new Date(scheduledAt).toLocaleString()}</span>
                    <button onClick={() => setScheduledAt("")}><X size={12}/></button>
                </div>
            )}
        </div>
      )}

      {/* Extras Input Fields (Toggleable) */}
      {showExtras && (
        <div className="p-3 grid gap-3 border-b border-white/5 animate-in slide-in-from-bottom-2 fade-in">
            <input
              type="text"
              placeholder="Paste Image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-bg/50 border border-white/10 rounded-lg p-2 text-sm focus:border-accent outline-none transition-colors"
            />
            <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-bg/50 border border-white/10 rounded-lg p-2 text-sm focus:border-accent outline-none text-text"
            />
        </div>
      )}

      {/* Main Input Bar */}
      <div className="flex items-end gap-2 p-3">
        <button
            onClick={() => setShowExtras(!showExtras)}
            className={`p-2 rounded-full transition-colors mb-0.5 ${showExtras || imageUrl || scheduledAt ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-white/10 hover:text-text'}`}
        >
            <ImageIcon size={20} />
        </button>

        <textarea
            ref={textareaRef}
            placeholder={`Message #${channel?.name || 'general'}`}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 bg-transparent max-h-[200px] py-2.5 outline-none resize-none text-text placeholder:text-muted/60 scrollbar-hide"
        />

        <button
            onClick={handlePost}
            disabled={loading || !content.trim()}
            className={`
                p-2 rounded-lg mb-0.5 transition-all duration-200
                ${content.trim()
                    ? "bg-accent text-white hover:bg-accent/90"
                    : "bg-white/5 text-muted cursor-not-allowed"}
            `}
        >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}