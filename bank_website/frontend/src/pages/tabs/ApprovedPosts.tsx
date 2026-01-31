import { CheckCircle2, Calendar, User } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
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

export default function ApprovedPosts({ workflows, isLoading }: Props) {
  const approvedPosts = workflows?.filter((w) => w.status === 'approved' || w.status === 'posted') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {approvedPosts.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No approved posts yet</p>
          <p className="text-slate-500 text-sm mt-2">Approved posts will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvedPosts.map((workflow) => {
            const finalPost = workflow.eba_edited_post || workflow.eba_original_post || '';
            // Only show "Edited" if edited_post exists AND is different from original
            const wasEdited = workflow.eba_edited_post && 
                            workflow.eba_edited_post !== workflow.eba_original_post &&
                            workflow.eba_edited_post.trim() !== workflow.eba_original_post?.trim();
            const isPosted = workflow.status === 'posted';

            return (
              <div
                key={workflow.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-lg font-semibold text-white">{workflow.workflow_id}</h4>
                      {isPosted ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Posted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Approved
                        </span>
                      )}
                      {wasEdited && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Edited
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-400 mt-2">
                      {workflow.approved_by && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>by {workflow.approved_by}</span>
                        </div>
                      )}
                      {workflow.approved_at && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(workflow.approved_at), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto break-words">
                  <MarkdownRenderer content={finalPost} />
                </div>

                {isPosted && workflow.posted_at && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-sm text-slate-400">
                      Published {formatDistanceToNow(new Date(workflow.posted_at), { addSuffix: true })}
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
