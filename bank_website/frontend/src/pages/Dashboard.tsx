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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Real-Time Dashboard</h2>
          <p className="text-slate-400 mt-1">
            Monitor FDA → IAA → EBA workflow in real-time
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-400">{workflows.size}</div>
          <div className="text-sm text-slate-400">Active Workflows</div>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">WebSocket disconnected. Attempting to reconnect...</span>
        </div>
      )}

      {/* Workflows */}
      <div className="space-y-4">
        {workflowArray.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No workflows yet. Waiting for FDA agent signals...</p>
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
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <StatusBadge status={workflow.status} />
          <div>
            <div className="font-mono text-sm text-slate-300">{workflow.workflow_id}</div>
            <div className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(workflow.timestamp), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* FDA Data */}
        {workflow.fda_data && (
          <Section
            icon={<TrendingUp className="w-5 h-5" />}
            title="FDA Sentiment Signal"
            status="completed"
          >
            <div className="space-y-2">
              <InfoRow label="Signal Type" value={workflow.fda_data.signal_type} />
              <InfoRow label="Confidence" value={`${(workflow.fda_data.confidence * 100).toFixed(1)}%`} />
              <InfoRow label="Escalation" value={workflow.fda_data.recommend_escalation ? 'Yes' : 'No'} />
              {workflow.fda_data.drivers && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Drivers:</div>
                  <div className="flex flex-wrap gap-2">
                    {workflow.fda_data.drivers.map((driver: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs"
                      >
                        {driver}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* IAA Analysis */}
        {(workflow.iaa_analysis || workflow.iaa_progress) && (
          <Section
            icon={<MessageSquare className="w-5 h-5" />}
            title="IAA Analysis"
            status={workflow.status === 'iaa' ? 'processing' : 'completed'}
          >
            <StreamingText
              text={workflow.iaa_analysis || workflow.iaa_progress || ''}
              isStreaming={workflow.status === 'iaa' && !!workflow.iaa_progress}
              markdown={true}
            />
          </Section>
        )}

        {/* EBA Post */}
        {(workflow.eba_post || workflow.eba_progress) && (
          <Section
            icon={<FileText className="w-5 h-5" />}
            title="EBA PR Post"
            status={workflow.status === 'eba' ? 'processing' : 'completed'}
          >
            <StreamingText
              text={cleanMarkdownFences(workflow.eba_post || workflow.eba_progress || '')}
              isStreaming={workflow.status === 'eba' && !!workflow.eba_progress}
              markdown={true}
            />
          </Section>
        )}

        {/* Error */}
        {workflow.error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <div className="font-medium text-red-300">Workflow Error</div>
                <div className="text-sm text-red-400 mt-1">{workflow.error}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  status,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  status: 'processing' | 'completed';
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center space-x-2 mb-3">
        <div className="text-primary-400">{icon}</div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {status === 'processing' && (
          <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
        )}
        {status === 'completed' && (
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        )}
      </div>
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500">{label}:</span>
      <span className="text-sm text-slate-300 font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: WorkflowState['status'] }) {
  const configs = {
    fda: { label: 'FDA Received', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    iaa: { label: 'IAA Processing', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
    eba: { label: 'EBA Processing', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
    completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
    error: { label: 'Error', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
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
      className="prose prose-invert prose-sm max-w-none max-h-96 overflow-y-auto"
      style={{ scrollBehavior: 'smooth' }}
    >
      {markdown ? (
        <ReactMarkdown
          components={{
            // Custom styling for markdown elements
            h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-semibold text-white mb-2">{children}</h3>,
            p: ({ children }) => <p className="text-slate-300 mb-3 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside text-slate-300 space-y-1 mb-3">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside text-slate-300 space-y-1 mb-3">{children}</ol>,
            li: ({ children }) => <li className="text-slate-300">{children}</li>,
            strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
            em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
            code: ({ children }) => (
              <code className="bg-slate-800 px-2 py-0.5 rounded text-primary-400 text-sm font-mono">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto mb-3 border border-slate-700">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary-500 pl-4 italic text-slate-400 my-3">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="border-slate-700 my-4" />,
            a: ({ children, href }) => (
              <a href={href} className="text-primary-400 hover:text-primary-300 underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {displayText}
        </ReactMarkdown>
      ) : (
        <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{displayText}</p>
      )}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary-500 ml-1 animate-pulse align-middle" />
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

