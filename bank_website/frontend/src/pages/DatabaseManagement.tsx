import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, reviewsApi, sentimentsApi } from '@/api';
import { Transaction, CustomerReview, Sentiment } from '@/types';
import {
  Edit3,
  Trash2,
  X,
  Save,
  DollarSign,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

type TabType = 'transactions' | 'reviews' | 'sentiments';

export default function DatabaseManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white">Database Management</h2>
        <p className="text-slate-400 mt-1">View and manage all database records</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex space-x-1">
          <TabButton
            active={activeTab === 'transactions'}
            onClick={() => setActiveTab('transactions')}
            icon={<DollarSign className="w-4 h-4" />}
            label="Transactions"
          />
          <TabButton
            active={activeTab === 'reviews'}
            onClick={() => setActiveTab('reviews')}
            icon={<MessageSquare className="w-4 h-4" />}
            label="Customer Reviews"
          />
          <TabButton
            active={activeTab === 'sentiments'}
            onClick={() => setActiveTab('sentiments')}
            icon={<TrendingUp className="w-4 h-4" />}
            label="Sentiments"
          />
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'transactions' && <TransactionsTable />}
        {activeTab === 'reviews' && <ReviewsTable />}
        {activeTab === 'sentiments' && <SentimentsTable />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
        active
          ? 'text-primary-400 border-primary-400'
          : 'text-slate-400 border-transparent hover:text-slate-200'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ==================== TRANSACTIONS TABLE ====================
function TransactionsTable() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await transactionsApi.getAll({ limit: 100 });
      return response.data as Transaction[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setEditingId(null);
      setEditForm({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditForm({
      status: transaction.status,
      flagged_reason: transaction.flagged_reason || '',
      description: transaction.description || '',
    });
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: editForm });
    }
  };

  if (isLoading) {
    return <div className="text-slate-400">Loading transactions...</div>;
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {transactions?.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-slate-700/50">
                <td className="px-4 py-3 text-sm font-mono text-slate-300">
                  {transaction.transaction_id}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{transaction.customer_name}</td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {transaction.currency} {transaction.amount.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{transaction.transaction_type}</td>
                <td className="px-4 py-3">
                  {editingId === transaction.id ? (
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-sm text-slate-300"
                    >
                      <option value="completed">Completed</option>
                      <option value="inprocess">In Process</option>
                      <option value="pending">Pending</option>
                      <option value="flagged">Flagged</option>
                      <option value="failed">Failed</option>
                    </select>
                  ) : (
                    <StatusBadge status={transaction.status} />
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {format(new Date(transaction.timestamp), 'MMM dd, yyyy')}
                </td>
                <td className="px-4 py-3">
                  {editingId === transaction.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSave}
                        className="p-1 text-green-400 hover:bg-green-900/20 rounded"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-1 text-primary-400 hover:bg-primary-900/20 rounded"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this transaction?')) {
                            deleteMutation.mutate(transaction.id);
                          }
                        }}
                        className="p-1 text-red-400 hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== REVIEWS TABLE ====================
function ReviewsTable() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomerReview>>({});

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const response = await reviewsApi.getAll({ limit: 100 });
      return response.data as CustomerReview[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CustomerReview> }) =>
      reviewsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setEditingId(null);
      setEditForm({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reviewsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const handleEdit = (review: CustomerReview) => {
    setEditingId(review.id);
    setEditForm({
      sentiment: review.sentiment,
      review_text: review.review_text,
      rating: review.rating,
    });
  };

  const handleSave = (id: number) => {
    updateMutation.mutate({ id, data: editForm });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (isLoading) {
    return <div className="text-slate-400">Loading reviews...</div>;
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Rating
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Sentiment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Review
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {reviews?.map((review) => {
              const isEditing = editingId === review.id;
              
              return (
                <tr key={review.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-300">{review.review_id}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{review.customer_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {isEditing ? (
                      <select
                        value={editForm.rating || review.rating}
                        onChange={(e) => setEditForm({ ...editForm, rating: parseInt(e.target.value) })}
                        className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm"
                      >
                        <option value={1}>⭐</option>
                        <option value={2}>⭐⭐</option>
                        <option value={3}>⭐⭐⭐</option>
                        <option value={4}>⭐⭐⭐⭐</option>
                        <option value={5}>⭐⭐⭐⭐⭐</option>
                      </select>
                    ) : (
                      '⭐'.repeat(review.rating)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={editForm.sentiment || review.sentiment}
                        onChange={(e) => setEditForm({ ...editForm, sentiment: e.target.value as 'positive' | 'negative' | 'neutral' })}
                        className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm"
                      >
                        <option value="positive">Positive</option>
                        <option value="neutral">Neutral</option>
                        <option value="negative">Negative</option>
                      </select>
                    ) : (
                      <SentimentBadge sentiment={review.sentiment} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{review.category}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {isEditing ? (
                      <textarea
                        value={editForm.review_text || review.review_text}
                        onChange={(e) => setEditForm({ ...editForm, review_text: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm min-h-[60px]"
                        rows={2}
                      />
                    ) : (
                      <div className="max-w-xs truncate">{review.review_text}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {format(new Date(review.timestamp), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSave(review.id)}
                            className="p-1 text-green-400 hover:bg-green-900/20 rounded"
                            title="Save changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(review)}
                            className="p-1 text-blue-400 hover:bg-blue-900/20 rounded"
                            title="Edit review"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this review?')) {
                                deleteMutation.mutate(review.id);
                              }
                            }}
                            className="p-1 text-red-400 hover:bg-red-900/20 rounded"
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== SENTIMENTS TABLE ====================
function SentimentsTable() {
  const queryClient = useQueryClient();

  const { data: sentiments, isLoading } = useQuery({
    queryKey: ['sentiments'],
    queryFn: async () => {
      const response = await sentimentsApi.getAll({ limit: 100 });
      return response.data as Sentiment[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sentimentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentiments'] });
    },
  });

  if (isLoading) {
    return <div className="text-slate-400">Loading sentiments...</div>;
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Signal Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Confidence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Drivers
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Escalation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sentiments?.map((sentiment) => (
              <tr key={sentiment.id} className="hover:bg-slate-700/50">
                <td className="px-4 py-3 text-sm font-mono text-slate-300">{sentiment.id}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{sentiment.signal_type}</td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {(sentiment.confidence * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {sentiment.drivers.slice(0, 3).map((driver, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs"
                      >
                        {driver}
                      </span>
                    ))}
                    {sentiment.drivers.length > 3 && (
                      <span className="text-xs text-slate-500">
                        +{sentiment.drivers.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {sentiment.recommend_escalation ? (
                    <span className="text-red-400 text-sm">Yes</span>
                  ) : (
                    <span className="text-slate-500 text-sm">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-400">
                  {format(new Date(sentiment.timestamp), 'MMM dd, HH:mm')}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      if (confirm('Delete this sentiment?')) {
                        deleteMutation.mutate(sentiment.id);
                      }
                    }}
                    className="p-1 text-red-400 hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== UTILITY COMPONENTS ====================
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    completed: 'bg-green-500/20 text-green-400 border-green-500/50',
    inprocess: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    pending: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    flagged: 'bg-red-500/20 text-red-400 border-red-500/50',
    failed: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
  };

  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium border', configs[status])}>
      {status}
    </span>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const configs: Record<string, string> = {
    positive: 'bg-green-500/20 text-green-400 border-green-500/50',
    negative: 'bg-red-500/20 text-red-400 border-red-500/50',
    neutral: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
  };

  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium border', configs[sentiment])}>
      {sentiment}
    </span>
  );
}
