// --- frontend/src/services/api.ts ---
import axios from "axios";

export const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const createPost = (data: any) => API.post("/posts/", data);

export const fetchPosts = (channelId?: string) =>
  API.get(`/posts/`, { params: { channel_id: channelId } });

export const fetchComments = (postId: number) =>
  API.get(`/comments/${postId}`);

export const commentPost = (postId: number, text: string, parentId?: number) =>
  API.post(`/comments/${postId}`, { text, parent_id: parentId });

export const reactPost = (postId: number, emoji: string) =>
  API.post(`/reactions/${postId}`, { emoji });

// ✅ NEW RESET FUNCTION
export const resetDatabase = () => API.delete("/api/reset");