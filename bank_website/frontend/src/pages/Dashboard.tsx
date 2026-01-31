import { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { WSMessage } from '@/types';
import { AlertCircle, CheckCircle2, Loader2, TrendingUp, MessageSquare, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';

interface WorkflowState {
  workflow_id: string;
  fda_data?: any;
  iaa_analysis?: string;
  iaa_progress?: string;
  iaa_matched_transactions?: any[];
  iaa_matched_reviews?: any[];
  iaa_confidence_score?: number;
  iaa_sanitized_summary?: any;
  eba_post?: string;
  eba_progress?: string;
  status: 'fda' | 'iaa' | 'eba' | 'completed' | 'error';
  timestamp: string;
  error?: string;
}

export default function Dashboard() {
  const { messages, isConnected } = useWebSocket();
  const [workflows, setWorkflows] = useState<Map<string, WorkflowState>>(new Map());

  useEffect(() => {
    messages.forEach((msg: WSMessage) => {
      setWorkflows((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(msg.workflow_id) || {
          workflow_id: msg.workflow_id,
          status: 'fda',
          timestamp: msg.timestamp,
        };

        switch (msg.type) {
          case 'fda_received':
            newMap.set(msg.workflow_id, {
              ...existing,
              fda_data: msg.data,
              status: 'fda',
              timestamp: msg.timestamp,
            });
            break;

          case 'iaa_started':
            newMap.set(msg.workflow_id, {
              ...existing,
              status: 'iaa',
              timestamp: msg.timestamp,
            });
            break;

          case 'iaa_progress':
            if (msg.data?.data?.chunk) {
              newMap.set(msg.workflow_id, {
                ...existing,
                iaa_progress: (existing.iaa_progress || '') + msg.data.data.chunk,
                timestamp: msg.timestamp,
              });
            }
            break;

          case 'iaa_completed':
            newMap.set(msg.workflow_id, {
              ...existing,
              iaa_analysis: msg.data?.analysis || existing.iaa_progress || '',
              iaa_matched_transactions: msg.data?.matched_transactions || [],
              iaa_matched_reviews: msg.data?.matched_reviews || [],
              iaa_confidence_score: msg.data?.confidence_score || 0,
              iaa_sanitized_summary: msg.data?.sanitized_summary || {},
              iaa_progress: undefined,
              timestamp: msg.timestamp,
            });
            break;

          case 'eba_started':
            newMap.set(msg.workflow_id, {
              ...existing,
              status: 'eba',
              timestamp: msg.timestamp,
            });
            break;

          case 'eba_progress':
            if (msg.data?.data?.chunk) {
              newMap.set(msg.workflow_id, {
                ...existing,
                eba_progress: (existing.eba_progress || '') + msg.data.data.chunk,
                timestamp: msg.timestamp,
              });
            }
            break;

          case 'eba_completed':
            newMap.set(msg.workflow_id, {
              ...existing,
              eba_post: msg.data?.original_post || existing.eba_progress || '',
              eba_progress: undefined,
              status: 'completed',
              timestamp: msg.timestamp,
            });
            break;

          case 'workflow_error':
            newMap.set(msg.workflow_id, {
              ...existing,
              status: 'error',
              error: msg.data?.error || 'Unknown error',
              timestamp: msg.timestamp,
            });
            break;
        }

        return newMap;
      });
    });
  }, [messages]);

  const workflowArray = Array.from(workflows.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="h-full overflow-auto">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Real-Time Dashboard</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor FDA → IAA → EBA workflow in real-time
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{workflows.size}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Active Workflows</div>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-500/50 rounded-lg p-4 flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">WebSocket disconnected. Attempting to reconnect...</span>
        </div>
      )}

      {/* Workflows */}
      <div className="space-y-6">
        {workflowArray.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">No workflows yet. Waiting for FDA agent signals...</p>
          </div>
        ) : (
          workflowArray.map((workflow) => (
            <WorkflowCard key={workflow.workflow_id} workflow={workflow} />
          ))
        )}
      </div>
    </div>
  );
}

function WorkflowCard({ workflow }: { workflow: WorkflowState }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-slate-100 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <StatusBadge status={workflow.status} />
          <div>
            <div className="font-mono text-sm text-slate-700 dark:text-slate-300">{workflow.workflow_id}</div>
            <div className="text-xs text-slate-500 dark:text-slate-500">
              {formatDistanceToNow(new Date(workflow.timestamp), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="p-6 space-y-6">
        {/* Top Section: FDA Signal (Left) + Reviews Table (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FDA Sentiment Signal - Left */}
          {workflow.fda_data && (
            <div className="space-y-4">
              <SectionHeader
                icon={<TrendingUp className="w-5 h-5" />}
                title="FDA Sentiment Signal"
                status="completed"
              />
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-5 border border-slate-200 dark:border-slate-700 space-y-3">
                <InfoRow label="Signal Type" value={workflow.fda_data.signal_type} badge />
                <InfoRow label="Confidence" value={`${(workflow.fda_data.confidence * 100).toFixed(1)}%`} />
                <InfoRow label="Escalation" value={workflow.fda_data.recommend_escalation ? 'Yes' : 'No'} />
                {workflow.fda_data.drivers && (
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-500 mb-2 font-semibold">Drivers:</div>
                    <div className="flex flex-wrap gap-2">
                      {workflow.fda_data.drivers.map((driver: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium"
                        >
                          {driver}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Verification Stats */}
                {workflow.iaa_sanitized_summary && (
                  <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <StatCard label="Transactions" value={workflow.iaa_sanitized_summary.transactions_found || 0} color="blue" />
                    <StatCard label="Reviews" value={workflow.iaa_sanitized_summary.reviews_found || 0} color="blue" />
                    <StatCard label="Match" value={workflow.iaa_sanitized_summary.sentiment_match_count || 0} color="blue" />
                    <StatCard label="Score" value={`${workflow.iaa_confidence_score?.toFixed(1) || 0}%`} color="green" />
                    <StatCard 
                      label="Status" 
                      value={workflow.iaa_sanitized_summary.verification === 'CONFIRMED' ? '✓' : '⏳'} 
                      color={workflow.iaa_sanitized_summary.verification === 'CONFIRMED' ? 'green' : 'yellow'} 
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Matched Customer Reviews - Right */}
          {workflow.iaa_matched_reviews && workflow.iaa_matched_reviews.length > 0 && (
            <div className="space-y-4">
              <SectionHeader
                icon={<MessageSquare className="w-5 h-5" />}
                title="Matched Customer Reviews"
                status={workflow.status === 'iaa' ? 'processing' : 'completed'}
              />
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                <ReviewsTable 
                  reviews={workflow.iaa_matched_reviews} 
                  maxRows={7} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: IAA Analysis (Left) + EBA PR Post (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IAA Analysis - Left */}
          {(workflow.iaa_analysis || workflow.iaa_progress) && (
            <div className="space-y-4">
              <SectionHeader
                icon={<MessageSquare className="w-5 h-5" />}
                title="IAA Analysis"
                status={workflow.status === 'iaa' ? 'processing' : 'completed'}
              />
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                <StreamingText
                  text={workflow.iaa_analysis || workflow.iaa_progress || ''}
                  isStreaming={workflow.status === 'iaa' && !!workflow.iaa_progress}
                  markdown={true}
                />
              </div>
            </div>
          )}

          {/* EBA PR Post - Right */}
          {(workflow.eba_post || workflow.eba_progress) && (
            <div className="space-y-4">
              <SectionHeader
                icon={<FileText className="w-5 h-5" />}
                title="EBA PR Post"
                status={workflow.status === 'eba' ? 'processing' : 'completed'}
              />
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                <StreamingText
                  text={cleanMarkdownFences(workflow.eba_post || workflow.eba_progress || '')}
                  isStreaming={workflow.status === 'eba' && !!workflow.eba_progress}
                  markdown={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {workflow.error && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-500/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <div className="font-medium text-red-700 dark:text-red-300">Workflow Error</div>
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">{workflow.error}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// New compact section header component
function SectionHeader({
  icon,
  title,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  status: 'processing' | 'completed';
}) {
  return (
    <div className="flex items-center space-x-2">
      <div className="text-primary-600 dark:text-primary-400">{icon}</div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      {status === 'processing' && (
        <Loader2 className="w-4 h-4 text-primary-600 dark:text-primary-400 animate-spin" />
      )}
      {status === 'completed' && (
        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
      )}
    </div>
  );
}

// New compact stat card component
function StatCard({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: string | number; 
  color: 'blue' | 'green' | 'yellow';
}) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${colorClasses[color]}`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

function InfoRow({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-slate-600 dark:text-slate-500 font-medium">{label}:</span>
      {badge ? (
        <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold">
          {value}
        </span>
      ) : (
        <span className="text-sm text-slate-800 dark:text-slate-300 font-semibold">{value}</span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: WorkflowState['status'] }) {
  const configs = {
    fda: { label: 'FDA Received', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/50' },
    iaa: { label: 'IAA Processing', color: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/50' },
    eba: { label: 'EBA Processing', color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/50' },
    completed: { label: 'Completed', color: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-500/50' },
    error: { label: 'Error', color: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/50' },
  };

  const config = configs[status];

  return (
    <span className={clsx('px-3 py-1 rounded-full text-xs font-medium border', config.color)}>
      {config.label}
    </span>
  );
}

// Streaming text component with auto-scroll and markdown support
function StreamingText({ 
  text, 
  isStreaming, 
  markdown = false 
}: { 
  text: string; 
  isStreaming: boolean; 
  markdown?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll to bottom when content updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayText, text]);

  // Streaming effect - display text character by character when streaming
  useEffect(() => {
    if (isStreaming) {
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayText(text.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        }, 10); // 10ms per character for smooth streaming
        return () => clearTimeout(timeout);
      }
    } else {
      // When not streaming, show full text immediately
      setDisplayText(text);
      setCurrentIndex(text.length);
    }
  }, [text, isStreaming, currentIndex]);

  // Reset when text changes significantly (new workflow started)
  useEffect(() => {
    if (text.length < displayText.length) {
      setDisplayText('');
      setCurrentIndex(0);
    }
  }, [text.length, displayText.length]);

  return (
    <div 
      ref={containerRef}
      className="prose prose-slate dark:prose-invert prose-sm max-w-none overflow-y-auto"
      style={{ scrollBehavior: 'smooth' }}
    >
      {markdown ? (
        <ReactMarkdown
          components={{
            // Custom styling for markdown elements
            h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{children}</h3>,
            p: ({ children }) => <p className="text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 mb-3">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside text-slate-700 dark:text-slate-300 space-y-1 mb-3">{children}</ol>,
            li: ({ children }) => <li className="text-slate-700 dark:text-slate-300">{children}</li>,
            strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
            em: ({ children }) => <em className="italic text-slate-800 dark:text-slate-200">{children}</em>,
            code: ({ children }) => (
              <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-primary-600 dark:text-primary-400 text-sm font-mono">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto mb-3 border border-slate-200 dark:border-slate-700">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary-500 pl-4 italic text-slate-600 dark:text-slate-400 my-3">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="border-slate-300 dark:border-slate-700 my-4" />,
            a: ({ children, href }) => (
              <a href={href} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {displayText}
        </ReactMarkdown>
      ) : (
        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{displayText}</p>
      )}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary-600 dark:bg-primary-500 ml-1 animate-pulse align-middle" />
      )}
    </div>
  );
}

// Clean markdown code fences (```markdown ... ```)
function cleanMarkdownFences(text: string): string {
  // Remove ```markdown and closing ```
  return text
    .replace(/^```markdown\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

// Transactions Table Component
function TransactionsTable({ 
  transactions, 
  maxRows 
}: { 
  transactions: any[]; 
  maxRows: number;
}) {
  const displayTransactions = transactions.slice(0, maxRows);
  const remainingCount = Math.max(0, transactions.length - maxRows);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {displayTransactions.map((txn, idx) => (
              <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                <td className="py-2 px-3 text-slate-300">
                  {new Date(txn.date || txn.created_at).toLocaleDateString()}
                </td>
                <td className="py-2 px-3">
                  <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded text-xs font-medium">
                    {txn.type || txn.transaction_type}
                  </span>
                </td>
                <td className="py-2 px-3 font-mono text-slate-300">
                  AED {parseFloat(txn.amount).toFixed(2)}
                </td>
                <td className="py-2 px-3">
                  <span className={clsx(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    txn.status === 'completed' && 'bg-green-500/20 text-green-400',
                    txn.status === 'pending' && 'bg-yellow-500/20 text-yellow-400',
                    txn.status === 'flagged' && 'bg-red-500/20 text-red-400',
                    txn.status === 'inprocess' && 'bg-blue-500/20 text-blue-400'
                  )}>
                    {txn.status}
                  </span>
                </td>
                <td className="py-2 px-3 text-slate-400 max-w-md truncate">
                  {txn.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {remainingCount > 0 && (
        <div className="text-center py-2 px-4 bg-slate-800/50 rounded border border-slate-700 text-sm text-slate-400">
          ... and <span className="font-semibold text-primary-400">{remainingCount}</span> more transaction{remainingCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// Reviews Table Component
function ReviewsTable({ 
  reviews, 
  maxRows 
}: { 
  reviews: any[]; 
  maxRows: number;
}) {
  const displayReviews = reviews.slice(0, maxRows);
  const remainingCount = Math.max(0, reviews.length - maxRows);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Category
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Sentiment
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Rating
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Review
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {displayReviews.map((review, idx) => (
              <tr key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                  {new Date(review.date || review.created_at).toLocaleDateString()}
                </td>
                <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">
                  {review.customer_name}
                </td>
                <td className="py-2 px-3">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                    {review.category?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <span className={clsx(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    review.sentiment === 'positive' && 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
                    review.sentiment === 'neutral' && 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
                    review.sentiment === 'negative' && 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                  )}>
                    {review.sentiment}
                  </span>
                </td>
                <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                  ⭐ {review.rating}/5
                </td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400 max-w-md truncate">
                  {review.review_text}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {remainingCount > 0 && (
        <div className="text-center py-2 px-4 bg-slate-100 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
          ... and <span className="font-semibold text-primary-600 dark:text-primary-400">{remainingCount}</span> more review{remainingCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

