// --- frontend/src/pages/Feed.tsx ---
import { useEffect, useState, useCallback, useRef } from "react";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import { Channel, Post } from "../types";
import { fetchPosts } from "../services/api";

type Props = {
  channel: Channel;
};

export default function Feed({ channel }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadPosts = useCallback(async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await fetchPosts(channel.id);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (isAutoRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [channel.id]);

  useEffect(() => {
    // Initial load
    loadPosts(false);
    
    // Auto-refresh every 3 seconds to show new posts
    const interval = setInterval(() => {
      loadPosts(true);
    }, 3000);
    
    // Cleanup on unmount or channel change
    return () => clearInterval(interval);
  }, [loadPosts]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Auto-refresh indicator */}
      {isRefreshing && (
        <div className="absolute top-2 right-2 z-50 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          Refreshing...
        </div>
      )}
      
      {/* Scrollable Post Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="w-full max-w-3xl mx-auto px-4 py-8">
          {loading && posts.length === 0 ? (
            <div className="flex justify-center items-center h-40">
                <p className="text-muted animate-pulse">Loading feed...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="flex flex-col-reverse gap-6 pb-4">
               {/* Note: flex-col-reverse helps keep scroll at bottom for chats,
                   but standard feeds usually map normally.
                   If you want newest at TOP, keep map normal.
                   If you want newest at BOTTOM (like chat), use reverse.
                   Let's stick to standard feed order (Newest First) for now.
               */}
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  refreshFeed={() => loadPosts(true)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-50">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-medium">No messages yet</h3>
              <p className="text-muted">Start the conversation in #{channel.name}</p>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Fixed Bottom Input Area */}
      <div className="w-full border-t border-white/10 bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/60 p-4">
        <div className="max-w-3xl mx-auto">
             <CreatePost channel={channel} onPosted={loadPosts} />
        </div>
      </div>
    </div>
  );
}