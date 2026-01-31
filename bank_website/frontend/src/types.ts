// Type definitions for the application

export interface FDASentiment {
  signal_type: string;
  confidence: number;
  drivers: string[];
  uncertainty_notes?: string;
  recommend_escalation: boolean;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  currency: string;
  transaction_type: string;
  status: 'completed' | 'inprocess' | 'pending' | 'failed' | 'flagged';
  description?: string;
  source_account: string;
  destination_account?: string;
  flagged_reason?: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerReview {
  id: number;
  review_id: string;
  customer_id: string;
  customer_name: string;
  rating: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  review_text: string;
  source: string;
  timestamp: string;
  created_at: string;
}

export interface Sentiment {
  id: number;
  signal_type: string;
  confidence: number;
  drivers: string[];
  uncertainty_notes?: string;
  recommend_escalation: boolean;
  timestamp: string;
  created_at: string;
}

export type WorkflowStatus =
  | 'pending'
  | 'iaa_processing'
  | 'iaa_completed'
  | 'eba_processing'
  | 'eba_completed'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'posted'
  | 'failed';

export interface AgentWorkflow {
  id: number;
  workflow_id: string;
  sentiment_id: number;
  status: WorkflowStatus;
  iaa_matched_transactions?: any[];
  iaa_matched_reviews?: any[];
  iaa_analysis?: string;
  iaa_completed_at?: string;
  eba_original_post?: string;
  eba_edited_post?: string;
  eba_completed_at?: string;
  approved_by?: string;
  approved_at?: string;
  posted_at?: string;
  error_message?: string;
  retry_count: number;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export type WSMessageType =
  | 'fda_received'
  | 'iaa_started'
  | 'iaa_progress'
  | 'iaa_completed'
  | 'eba_started'
  | 'eba_progress'
  | 'eba_completed'
  | 'workflow_error'
  | 'post_approved'
  | 'post_posted';

export interface WSMessage {
  type: WSMessageType;
  workflow_id: string;
  data?: any;
  message?: string;
  timestamp: string;
}
