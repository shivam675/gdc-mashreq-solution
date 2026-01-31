import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '@/api';
import { Edit3, Send, X, Clock, FileText, Trash2, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';

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

interface Props {
  workflows: AgentWorkflow[] | undefined;
  isLoading: boolean;
  refetch: () => void;
}

// Markdown Renderer Component
function MarkdownRenderer({ content }: { content: string }) {
  const cleanedContent = content
    .replace(/^```markdown\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 text-white">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-semibold mb-2 text-white">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-medium mb-2 text-slate-200">{children}</h3>,
        p: ({ children }) => <p className="mb-2 text-slate-300 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-slate-300 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-slate-300 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-slate-300">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary-500 pl-4 italic text-slate-400 mb-2">{children}</blockquote>
        ),
        code: ({ children }) => (
          <code className="bg-slate-900 px-1.5 py-0.5 rounded text-sm text-primary-400 font-mono">{children}</code>
        ),
      }}
    >
      {cleanedContent}
    </ReactMarkdown>
  );
}

export default function AwaitingApproval({ workflows, isLoading, refetch }: Props) {
  const queryClient = useQueryClient();
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [approverName, setApproverName] = useState('');
  const [countdowns, setCountdowns] = useState<Map<string, number>>(new Map());
  const timersRef = useRef<Map<string, number>>(new Map());

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
      refetch();
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setEditingWorkflow(null);
      setEditedContent('');
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
    setCountdowns((prev) => new Map(prev).set(workflowId, 5));

    let timeLeft = 5;
    const timer = setInterval(() => {
      timeLeft -= 1;
      
      if (timeLeft > 0) {
        setCountdowns((prev) => new Map(prev).set(workflowId, timeLeft));
      } else {
        clearInterval(timer);
        timersRef.current.delete(workflowId);
        setCountdowns((prev) => {
          const newMap = new Map(prev);
          newMap.delete(workflowId);
          return newMap;
        });

        approveMutation.mutate({
          workflowId: workflow.workflow_id,
          editedPost: useEdited ? editedContent : undefined,
          approvedBy: approverName,
        });
      }
    }, 1000);

    timersRef.current.set(workflowId, timer);
  };

  const handleCancelCountdown = (workflowId: string) => {
    const timer = timersRef.current.get(workflowId);
    if (timer) {
      clearInterval(timer);
      timersRef.current.delete(workflowId);
    }
    
    setCountdowns((prev) => {
      const newMap = new Map(prev);
      newMap.delete(workflowId);
      return newMap;
    });
  };

  const pendingPosts = workflows?.filter((w) => w.status === 'awaiting_approval') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          
          {!approverName.trim() && (
            <div className="mt-3 flex items-start space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">
                💡 Enter your name above to enable approval buttons
              </p>
            </div>
          )}
        </div>
      )}

      {pendingPosts.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No posts awaiting approval</p>
          <p className="text-slate-500 text-sm mt-2">New posts will appear here when ready for review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPosts.map((workflow) => {
            const isEditing = editingWorkflow === workflow.workflow_id;
            const countdown = countdowns.get(workflow.workflow_id);
            const isCountingDown = countdown !== undefined;

            return (
              <div
                key={workflow.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{workflow.workflow_id}</h4>
                    <p className="text-sm text-slate-400">
                      Created {formatDistanceToNow(new Date(workflow.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleDiscard(workflow)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Discard this post"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto break-words">
                  {isEditing ? (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-64 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                  ) : (
                    <MarkdownRenderer content={workflow.eba_original_post || ''} />
                  )}
                </div>

                {isCountingDown && (
                  <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
                      <span className="text-yellow-300 font-medium">
                        Posting in {countdown} seconds...
                      </span>
                    </div>
                    <button
                      onClick={() => handleCancelCountdown(workflow.workflow_id)}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-3">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => handleEdit(workflow)}
                          disabled={isCountingDown}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleApprove(workflow, false)}
                          disabled={!approverName.trim() || isCountingDown}
                          title={!approverName.trim() ? 'Enter your name to approve' : 'Approve original post'}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={() => handleApprove(workflow, true)}
                          disabled={!approverName.trim()}
                          title={!approverName.trim() ? 'Enter your name to approve' : 'Approve edited post'}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          <span>Approve Edited</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
