import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '@/api';
import { AgentWorkflow } from '@/types';
import { CheckCircle2, Edit3, Send, X, Clock, FileText, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

// Clean markdown code fences
function cleanMarkdownFences(text: string): string {
  return text
    .replace(/^```markdown\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

export default function PostsManagement() {
  const queryClient = useQueryClient();
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [approverName, setApproverName] = useState('');
  
  // Track countdown per workflow ID
  const [countdowns, setCountdowns] = useState<Map<string, number>>(new Map());
  const timersRef = useRef<Map<string, number>>(new Map());


  const { data: workflows, isLoading, refetch } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await workflowsApi.getAll();
      return response.data as AgentWorkflow[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const approveMutation = useMutation({
    mutationFn: async ({
      workflowId,
      editedPost,
      approvedBy,
    }: {
      workflowId: string;
      editedPost?: string;
      approvedBy: string;
    }) => {
      return workflowsApi.approve(workflowId, { edited_post: editedPost, approved_by: approvedBy });
    },
    onSuccess: () => {
      // Immediately refetch to remove approved post from list
      refetch();
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setEditingWorkflow(null);
      setEditedContent('');
      setApproverName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (workflowId: number) => {
      return workflowsApi.delete(workflowId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearInterval(timer));
      timersRef.current.clear();
    };
  }, []);

  const handleDiscard = (workflow: AgentWorkflow) => {
    if (confirm(`Discard workflow ${workflow.workflow_id}? This cannot be undone.`)) {
      deleteMutation.mutate(workflow.id);
    }
  };

  const pendingPosts = workflows?.filter((w) => w.status === 'awaiting_approval') || [];
  const approvedPosts = workflows?.filter((w) => w.status === 'approved' || w.status === 'posted') || [];

  const handleEdit = (workflow: AgentWorkflow) => {
    setEditingWorkflow(workflow.workflow_id);
    setEditedContent(workflow.eba_original_post || '');
  };

  const handleCancelEdit = () => {
    setEditingWorkflow(null);
    setEditedContent('');
  };

  const handleApprove = (workflow: AgentWorkflow, useEdited: boolean) => {
    if (!approverName.trim()) {
      alert('Please enter your name');
      return;
    }

    const workflowId = workflow.workflow_id;

    // Start countdown for this specific workflow
    setCountdowns((prev) => new Map(prev).set(workflowId, 5));

    let timeLeft = 5;

    const timer = setInterval(() => {
      timeLeft -= 1;
      
      if (timeLeft > 0) {
        // Update countdown
        setCountdowns((prev) => new Map(prev).set(workflowId, timeLeft));
      } else {
        // Clear timer
        clearInterval(timer);
        timersRef.current.delete(workflowId);
        
        // Remove countdown display
        setCountdowns((prev) => {
          const newMap = new Map(prev);
          newMap.delete(workflowId);
          return newMap;
        });

        // Execute approval
        approveMutation.mutate({
          workflowId: workflow.workflow_id,
          editedPost: useEdited ? editedContent : undefined,
          approvedBy: approverName,
        });
      }
    }, 1000);

    // Store timer reference
    timersRef.current.set(workflowId, timer);
  };

  const handleCancelCountdown = (workflowId: string) => {
    // Clear the timer for this specific workflow
    const timer = timersRef.current.get(workflowId);
    if (timer) {
      clearInterval(timer);
      timersRef.current.delete(workflowId);
    }
    
    // Remove countdown state
    setCountdowns((prev) => {
      const newMap = new Map(prev);
      newMap.delete(workflowId);
      return newMap;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading workflows...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white">PR Posts Management</h2>
        <p className="text-slate-400 mt-1">Review, edit, and approve AI-generated posts</p>
      </div>

      {/* Approver Name Input */}
      {pendingPosts.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Your Name (Approver):
          </label>
          <input
            type="text"
            value={approverName}
            onChange={(e) => setApproverName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full max-w-md px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      {/* Pending Approval */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          <span>Awaiting Approval ({pendingPosts.length})</span>
        </h3>

        {pendingPosts.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No posts awaiting approval</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingPosts.map((workflow) => {
              const countdown = countdowns.get(workflow.workflow_id);
              const isCountingDown = countdown !== undefined;
              
              return (
                <PostCard
                  key={workflow.workflow_id}
                  workflow={workflow}
                  isEditing={editingWorkflow === workflow.workflow_id}
                  editedContent={editedContent}
                  onEditChange={setEditedContent}
                  onEdit={() => handleEdit(workflow)}
                  onCancelEdit={handleCancelEdit}
                  onApprove={(useEdited) => handleApprove(workflow, useEdited)}
                  onDiscard={() => handleDiscard(workflow)}
                  approverName={approverName}
                  isApproving={approveMutation.isPending}
                  isDeleting={deleteMutation.isPending}
                  isCountingDown={isCountingDown}
                  countdown={countdown || 0}
                  onCancelCountdown={() => handleCancelCountdown(workflow.workflow_id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Approved/Posted */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span>Approved & Posted ({approvedPosts.length})</span>
        </h3>

        {approvedPosts.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-400">No approved posts yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvedPosts.map((workflow) => (
              <ApprovedPostCard key={workflow.workflow_id} workflow={workflow} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({
  workflow,
  isEditing,
  editedContent,
  onEditChange,
  onEdit,
  onCancelEdit,
  onApprove,
  onDiscard,
  approverName,
  isApproving,
  isDeleting,
  isCountingDown,
  countdown,
  onCancelCountdown,
}: {
  workflow: AgentWorkflow;
  isEditing: boolean;
  editedContent: string;
  onEditChange: (content: string) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onApprove: (useEdited: boolean) => void;
  onDiscard: () => void;
  approverName: string;
  isApproving: boolean;
  isDeleting: boolean;
  isCountingDown: boolean;
  countdown: number;
  onCancelCountdown: () => void;
}) {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-sm text-slate-300">{workflow.workflow_id}</div>
            <div className="text-xs text-slate-500">
              Generated {formatDistanceToNow(new Date(workflow.eba_completed_at!), { addSuffix: true })}
            </div>
          </div>
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full text-xs font-medium">
            Awaiting Approval
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Countdown Banner */}
        {isCountingDown && (
          <div className="bg-orange-900/30 border-2 border-orange-500 rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-orange-400 animate-spin" />
                <div>
                  <div className="font-semibold text-orange-300">
                    Posting in {countdown} second{countdown !== 1 ? 's' : ''}...
                  </div>
                  <div className="text-sm text-orange-400">
                    The post will be published to social media automatically
                  </div>
                </div>
              </div>
              <button
                onClick={onCancelCountdown}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
              >
                <X className="w-4 h-4" />
                <span>CANCEL</span>
              </button>
            </div>
          </div>
        )}

        {/* Approver Name Reminder */}
        {!approverName && !isCountingDown && (
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-3">
            <p className="text-sm text-blue-300">
              💡 <strong>Enter your name above</strong> to enable approval buttons
            </p>
          </div>
        )}

        {isEditing ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Edit Post:</label>
              {showComparison && (
                <button
                  onClick={() => setShowComparison(false)}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Hide Original
                </button>
              )}
              {!showComparison && (
                <button
                  onClick={() => setShowComparison(true)}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Show Original
                </button>
              )}
            </div>

            {showComparison && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                <div className="text-xs font-medium text-slate-400 mb-2">Original Post:</div>
                <MarkdownRenderer text={workflow.eba_original_post || ''} />
              </div>
            )}

            <textarea
              value={editedContent}
              onChange={(e) => onEditChange(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none leading-relaxed"
              style={{ lineHeight: '1.6' }}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onApprove(true)}
                  disabled={!approverName || isApproving || isCountingDown}
                  title={!approverName ? 'Enter your name above to enable' : 'Approve and post edited version'}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Edited</span>
                </button>
                <button
                  onClick={onCancelEdit}
                  disabled={isApproving || isCountingDown}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              </div>
              <button
                onClick={onDiscard}
                disabled={isApproving || isDeleting || isCountingDown}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Discard</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
              <MarkdownRenderer text={workflow.eba_original_post || ''} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onApprove(false)}
                  disabled={!approverName || isApproving || isCountingDown}
                  title={!approverName ? 'Enter your name above to enable' : 'Approve and post as-is'}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve As-Is</span>
                </button>
                <button
                  onClick={onEdit}
                  disabled={isApproving || isCountingDown}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Post</span>
                </button>
              </div>
              <button
                onClick={onDiscard}
                disabled={isApproving || isDeleting || isCountingDown}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Discard</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ApprovedPostCard({ workflow }: { workflow: AgentWorkflow }) {
  const [showBoth, setShowBoth] = useState(false);
  const wasEdited = workflow.eba_edited_post && workflow.eba_edited_post !== workflow.eba_original_post;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-sm text-slate-300">{workflow.workflow_id}</div>
            <div className="text-xs text-slate-500">
              Approved by {workflow.approved_by} •{' '}
              {formatDistanceToNow(new Date(workflow.approved_at!), { addSuffix: true })}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {wasEdited && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded text-xs">
                Edited
              </span>
            )}
            <span className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium border',
              workflow.status === 'posted'
                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                : 'bg-slate-700 text-slate-400 border-slate-600'
            )}>
              {workflow.status === 'posted' ? 'Posted' : 'Approved'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {wasEdited && (
          <button
            onClick={() => setShowBoth(!showBoth)}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            {showBoth ? 'Hide Original' : 'Show Original vs Edited'}
          </button>
        )}

        {showBoth && wasEdited ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">Original (AI):</div>
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                <MarkdownRenderer text={workflow.eba_original_post || ''} />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">Edited (Approved):</div>
              <div className="bg-slate-900/50 border border-green-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                <MarkdownRenderer text={workflow.eba_edited_post || ''} />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 max-h-96 overflow-y-auto">
            <MarkdownRenderer text={workflow.eba_edited_post || workflow.eba_original_post || ''} />
          </div>
        )}

        {workflow.status === 'posted' && workflow.posted_at && (
          <div className="flex items-center space-x-2 text-sm text-green-400">
            <Send className="w-4 h-4" />
            <span>Posted {formatDistanceToNow(new Date(workflow.posted_at), { addSuffix: true })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable Markdown Renderer Component
function MarkdownRenderer({ text }: { text: string }) {
  const cleanedText = cleanMarkdownFences(text);
  
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-3 mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-2 mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold text-white mb-2 mt-2">{children}</h3>,
          p: ({ children }) => <p className="text-slate-300 mb-2 leading-relaxed break-words">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside text-slate-300 space-y-1 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-slate-300 space-y-1 mb-2">{children}</ol>,
          li: ({ children }) => <li className="text-slate-300 break-words">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
          code: ({ children }) => (
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-primary-400 text-sm font-mono break-words">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto mb-2 border border-slate-700">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary-500 pl-3 italic text-slate-400 my-2">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-slate-700 my-3" />,
          a: ({ children, href }) => (
            <a href={href} className="text-primary-400 hover:text-primary-300 underline break-words" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {cleanedText}
      </ReactMarkdown>
    </div>
  );
}
