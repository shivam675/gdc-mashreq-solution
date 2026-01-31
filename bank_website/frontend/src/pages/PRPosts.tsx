import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workflowsApi } from '@/api';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';
import AwaitingApproval from './tabs/AwaitingApproval';
import ApprovedPosts from './tabs/ApprovedPosts';
import DiscardedPosts from './tabs/DiscardedPosts';

type TabType = 'awaiting' | 'approved' | 'discarded';

export default function PRPosts() {
  const [activeTab, setActiveTab] = useState<TabType>('awaiting');

  const { data: workflows, isLoading, refetch } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await workflowsApi.getAll();
      return response.data as AgentWorkflow[];
    },
    refetchInterval: 5000,
  });

  const awaitingCount = workflows?.filter((w) => w.status === 'awaiting_approval').length || 0;
  const approvedCount = workflows?.filter((w) => w.status === 'approved' || w.status === 'posted').length || 0;
  const discardedCount = workflows?.filter((w) => w.status === 'discarded').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">PR Posts Management</h1>
        <p className="text-slate-400">Review, edit, and approve AI-generated PR posts</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex space-x-1">
          <button
            onClick={() => setActiveTab('awaiting')}
            className={clsx(
              'flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors border-b-2',
              activeTab === 'awaiting'
                ? 'text-primary-400 border-primary-400'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600'
            )}
          >
            <Clock className="w-4 h-4" />
            <span>Awaiting Approval</span>
            {awaitingCount > 0 && (
              <span className="ml-2 bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                {awaitingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={clsx(
              'flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors border-b-2',
              activeTab === 'approved'
                ? 'text-primary-400 border-primary-400'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600'
            )}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approved Posts</span>
            {approvedCount > 0 && (
              <span className="ml-2 bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                {approvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('discarded')}
            className={clsx(
              'flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors border-b-2',
              activeTab === 'discarded'
                ? 'text-primary-400 border-primary-400'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600'
            )}
          >
            <XCircle className="w-4 h-4" />
            <span>Discarded</span>
            {discardedCount > 0 && (
              <span className="ml-2 bg-red-500/20 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                {discardedCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'awaiting' ? (
          <AwaitingApproval workflows={workflows} isLoading={isLoading} refetch={refetch} />
        ) : activeTab === 'approved' ? (
          <ApprovedPosts workflows={workflows} isLoading={isLoading} />
        ) : (
          <DiscardedPosts workflows={workflows} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}

interface AgentWorkflow {
  id: number;
  workflow_id: string;
  status: string;
  eba_original_post?: string;
  eba_edited_post?: string;
  approved_by?: string;
  approved_at?: string;
  posted_at?: string;
  created_at: string;
}
