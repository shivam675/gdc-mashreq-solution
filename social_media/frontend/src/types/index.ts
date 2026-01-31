export type Channel = {
  id: string;
  name: string;
};

export type Post = {
  id: number;
  content: string;
  image_url?: string;
  created_at: string;
  scheduled_at?: string;
  channel_id: string;
  reaction_count: number;
  comment_count: number;
};

export type Comment = {
  id: number;
  text: string;
  parent_id: number | null;
  created_at: string;
  replies?: Comment[];
};

export type ReactionItem = {
  emoji: string;
  color: string;
  label: string;
};