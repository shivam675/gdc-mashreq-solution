import { AlertTriangle, Calendar, User, Shield, Flag } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface AgentWorkflow {
  id: number;
  workflow_id: string;
  status: string;
  eba_original_post?: string;
  eba_edited_post?: string;
  escalated_by?: string;
  escalated_at?: string;
  escalation_type?: string;
  risk_level?: string;
  created_at: string;
}

interface Props {
  workflows: AgentWorkflow[] | undefined;
  isLoading: boolean;
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

export default function EscalatedPosts({ workflows, isLoading }: Props) {
  const escalatedPosts = workflows?.filter((w) => 
    w.status === 'escalated_management' || 
    w.status === 'escalated_legal' || 
    w.status === 'escalated_investigation'
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const getEscalationBadge = (escalationType?: string) => {
    switch (escalationType) {
      case 'management':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Shield className="w-3 h-3 mr-1" />
            Management Review
          </span>
        );
      case 'legal':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Shield className="w-3 h-3 mr-1" />
            Legal/Compliance
          </span>
        );
      case 'investigation':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <Flag className="w-3 h-3 mr-1" />
            Investigation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Escalated
          </span>
        );
    }
  };

  const getRiskBadge = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            LOW
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {escalatedPosts.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No escalated posts</p>
          <p className="text-slate-500 text-sm mt-2">Posts escalated for review will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {escalatedPosts.map((workflow) => {
            const finalPost = workflow.eba_edited_post || workflow.eba_original_post || '';

            return (
              <div
                key={workflow.id}
                className="bg-slate-800 border-2 border-orange-500/30 rounded-lg p-6 hover:border-orange-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-lg font-semibold text-white">{workflow.workflow_id}</h4>
                      {getEscalationBadge(workflow.escalation_type)}
                      {getRiskBadge(workflow.risk_level)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-400 mt-2">
                      {workflow.escalated_by && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>by {workflow.escalated_by}</span>
                        </div>
                      )}
                      {workflow.escalated_at && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(workflow.escalated_at), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto break-words">
                  <MarkdownRenderer content={finalPost} />
                </div>

                {workflow.escalated_at && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-sm text-slate-400">
                      Escalated {formatDistanceToNow(new Date(workflow.escalated_at), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
