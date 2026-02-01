import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '@/api';
import { Edit3, Send, X, Clock, FileText, Info, AlertTriangle, Shield, Flag, UserCheck, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
  confidence_score?: number;
  data_quality?: string;
  escalation_recommendation?: string;
  risk_level?: string;
}

interface Props {
  workflows: AgentWorkflow[] | undefined;
  isLoading: boolean;
  refetch: () => void;
}

// Confidence Band Component
function ConfidenceBand({ score }: { score: number }) {
  let color = 'bg-red-500';
  let label = 'Low Confidence';
  
  if (score >= 80) {
    color = 'bg-green-500';
    label = 'High Confidence';
  } else if (score >= 60) {
    color = 'bg-yellow-500';
    label = 'Medium Confidence';
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Confidence Level</span>
          <div className="group relative">
            <Info className="w-4 h-4 text-slate-500 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10">
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Confidence Level:</strong> Represents the FDA agent's certainty in detecting this threat pattern based on signal strength and consistency.
                <br/><br/>
                <span className="text-green-400">≥80%:</span> High confidence - clear threat signals<br/>
                <span className="text-yellow-400">60-79%:</span> Medium confidence - moderate signals<br/>
                <span className="text-red-400">&lt;60%:</span> Low confidence - weak or ambiguous signals
              </p>
            </div>
          </div>
        </div>
        <span className={`font-semibold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
          {score}% - {label}
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${score}%` }}></div>
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>0%</span>
        <span>60%</span>
        <span>80%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

// Data Quality Indicator
function DataQualityIndicator({ quality }: { quality: string }) {
  const qualityConfig = {
    excellent: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: '✓' },
    good: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '○' },
    fair: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: '⚠' },
    poor: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '✗' },
  };
  
  const config = qualityConfig[quality as keyof typeof qualityConfig] || qualityConfig.fair;
  
  return (
    <div className={`flex items-center space-x-2 px-3 py-2 ${config.bg} border ${config.border} rounded-lg`}>
      <span className={`text-lg ${config.color}`}>{config.icon}</span>
      <div className="flex items-center gap-2 flex-1">
        <p className={`text-sm font-medium ${config.color}`}>Data Quality: {quality.charAt(0).toUpperCase() + quality.slice(1)}</p>
        <div className="group relative">
          <Info className="w-4 h-4 text-slate-500 cursor-help" />
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10">
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">Data Quality:</strong> Indicates how much social media data was analyzed and reliability of the assessment.
              <br/><br/>
              <span className="text-green-400">Excellent (≥90%):</span> Large dataset, high reliability<br/>
              <span className="text-blue-400">Good (75-89%):</span> Sufficient data for analysis<br/>
              <span className="text-yellow-400">Fair (60-74%):</span> Limited data, acceptable<br/>
              <span className="text-red-400">Poor (&lt;60%):</span> Insufficient data, low reliability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [approverName, setApproverName] = useState(() => {
    // Load approver name from localStorage on mount
    return localStorage.getItem('approverName') || '';
  });
  const [countdowns, setCountdowns] = useState<Map<string, number>>(new Map());
  const [expandedDetails, setExpandedDetails] = useState<Map<string, boolean>>(new Map());
  const timersRef = useRef<Map<string, number>>(new Map());

  // Persist approver name to localStorage whenever it changes
  useEffect(() => {
    if (approverName.trim()) {
      localStorage.setItem('approverName', approverName);
    }
  }, [approverName]);

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

  const discardMutation = useMutation({
    mutationFn: async ({
      workflowId,
      discardedBy,
    }: {
      workflowId: string;
      discardedBy: string;
    }) => {
      return workflowsApi.discard(workflowId, { discarded_by: discardedBy });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async ({
      workflowId,
      escalationType,
      escalatedBy,
    }: {
      workflowId: string;
      escalationType: string;
      escalatedBy: string;
    }) => {
      return workflowsApi.escalate(workflowId, { escalation_type: escalationType, escalated_by: escalatedBy });
    },
    onSuccess: () => {
      refetch();
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
    if (!approverName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (confirm(`Discard post ${workflow.workflow_id}? This will move it to the Discarded tab.`)) {
      discardMutation.mutate({
        workflowId: workflow.workflow_id,
        discardedBy: approverName,
      });
    }
  };

  const handleEscalate = (workflow: AgentWorkflow, escalationType: string) => {
    if (!approverName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    const messages = {
      'management': 'Escalate to Management Review?',
      'legal': 'Escalate to Legal/Compliance?',
      'investigation': 'Flag for Investigation?'
    };
    
    if (confirm(messages[escalationType as keyof typeof messages])) {
      escalateMutation.mutate({
        workflowId: workflow.workflow_id,
        escalationType: escalationType,
        escalatedBy: approverName,
      });
    }
  };

  const toggleDetails = (workflowId: string) => {
    setExpandedDetails((prev) => {
      const newMap = new Map(prev);
      newMap.set(workflowId, !prev.get(workflowId));
      return newMap;
    });
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

    const message = useEdited 
      ? `Approve edited post for workflow ${workflow.workflow_id}?`
      : `Approve original post for workflow ${workflow.workflow_id}?`;
    
    if (!confirm(message)) {
      return;
    }

    const workflowId = workflow.workflow_id;
    setCountdowns((prev) => new Map(prev).set(workflowId, 10));

    let timeLeft = 10;
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
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{workflow.workflow_id}</h4>
                        <p className="text-sm text-slate-400">
                          Created {formatDistanceToNow(new Date(workflow.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {/* Risk Badge */}
                      {workflow.risk_level && (
                        <div className="group relative">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            workflow.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            workflow.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            workflow.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {workflow.risk_level} RISK
                            <Info className="w-3 h-3 cursor-help" />
                          </div>
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10">
                            <p className="text-xs text-slate-300 leading-relaxed">
                              <strong className="text-white">Risk Level:</strong> Assessment of threat severity and potential impact on the bank.
                              <br/><br/>
                              <span className="text-red-400">CRITICAL:</span> Fraud/phishing threats, immediate customer safety risk<br/>
                              <span className="text-orange-400">HIGH:</span> Service outages, significant brand/operational impact<br/>
                              <span className="text-yellow-400">MEDIUM:</span> Moderate sentiment shifts, potential issues<br/>
                              <span className="text-blue-400">LOW:</span> Minor concerns, positive signals
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Uncertainty Indicators */}
                    <div className="mt-4 space-y-3">
                      <ConfidenceBand score={workflow.confidence_score || 75} />
                      <DataQualityIndicator quality={workflow.data_quality || 'good'} />
                      
                      {/* Escalation Recommendation */}
                      {workflow.escalation_recommendation && (
                        <div className="flex items-start space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                          <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-purple-300">Recommended Action</p>
                            <p className="text-sm text-purple-400 mt-1">{workflow.escalation_recommendation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Responsible AI Notice */}
                    <div className="mt-3 bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-slate-400 space-y-1">
                          <p>🚫 <strong className="text-slate-300">DO NOT</strong> auto-post without human review</p>
                          <p>✅ <strong className="text-slate-300">MUST</strong> verify accuracy before approval</p>
                          <p>🔒 All actions are <strong className="text-slate-300">logged</strong> in audit trail</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleDetails(workflow.workflow_id)}
                        className="mt-2 flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {expandedDetails.get(workflow.workflow_id) ? (
                          <>
                            <ChevronUp className="w-3 h-3" />
                            <span>Hide Responsible AI Details</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" />
                            <span>Show Responsible AI Details</span>
                          </>
                        )}
                      </button>
                      
                      {expandedDetails.get(workflow.workflow_id) && (
                        <div className="mt-3 space-y-2 text-xs text-slate-400 border-t border-slate-600 pt-3">
                          <p><strong className="text-slate-300">Privacy:</strong> No personal data in public posts</p>
                          <p><strong className="text-slate-300">Transparency:</strong> Clearly indicate bank's official response</p>
                          <p><strong className="text-slate-300">Accountability:</strong> Human approver takes final responsibility</p>
                          <p><strong className="text-slate-300">Fairness:</strong> Consistent response regardless of customer segment</p>
                        </div>
                      )}
                    </div>
                  </div>
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

                <div className="flex flex-col space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {!isEditing ? (
                      <>
                        {/* Primary Actions */}
                        <button
                          onClick={() => handleApprove(workflow, false)}
                          disabled={!approverName.trim() || isCountingDown}
                          title={!approverName.trim() ? 'Enter your name to approve' : 'Approve & Post Immediately'}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors font-medium"
                        >
                          <Send className="w-4 h-4" />
                          <span>Approve & Post</span>
                        </button>
                        
                        <button
                          onClick={() => handleEdit(workflow)}
                          disabled={isCountingDown}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        
                        {/* Escalation Actions */}
                        <button
                          onClick={() => handleEscalate(workflow, 'management')}
                          disabled={!approverName.trim() || isCountingDown}
                          title="Requires senior management approval"
                          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Escalate Management</span>
                        </button>
                        
                        <button
                          onClick={() => handleEscalate(workflow, 'legal')}
                          disabled={!approverName.trim() || isCountingDown}
                          title="Requires legal/compliance review"
                          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Escalate Legal</span>
                        </button>
                        
                        <button
                          onClick={() => handleEscalate(workflow, 'investigation')}
                          disabled={!approverName.trim() || isCountingDown}
                          title="Flag for further investigation"
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          <span>Flag Investigation</span>
                        </button>
                        
                        <button
                          onClick={() => handleDiscard(workflow)}
                          disabled={!approverName.trim() || isCountingDown}
                          title={!approverName.trim() ? 'Enter your name to discard' : 'Discard this post'}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Discard</span>
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
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors font-medium"
                        >
                          <Send className="w-4 h-4" />
                          <span>Approve Edited</span>
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Action Descriptions */}
                  {!isEditing && (
                    <div className="text-xs text-slate-500 space-y-1 bg-slate-900/50 rounded-lg p-3">
                      <p>💚 <strong>Approve & Post:</strong> Publish immediately (10s countdown)</p>
                      <p>✏️ <strong>Edit:</strong> Modify before approval</p>
                      <p>🟡 <strong>Escalate Management:</strong> Requires senior review</p>
                      <p>🟠 <strong>Escalate Legal:</strong> Requires compliance approval</p>
                      <p>🟣 <strong>Flag Investigation:</strong> Requires deeper analysis</p>
                      <p>🔴 <strong>Discard:</strong> Reject and archive</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
