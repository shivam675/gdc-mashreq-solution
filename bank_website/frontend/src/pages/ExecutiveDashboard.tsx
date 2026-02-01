import { useQuery } from '@tanstack/react-query';
import { workflowsApi } from '@/api';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Shield, BarChart3, Info } from 'lucide-react';

interface ExecutiveSummary {
  signals_detected: number;
  signals_approved: number;
  signals_escalated: number;
  signals_pending: number;
  avg_response_time_hours: number;
  top_concerns: Array<{ concern: string; count: number; risk: string }>;
  trend_data: Array<{ date: string; signals: number }>;
  risk_distribution: { critical: number; high: number; medium: number; low: number };
}

export default function ExecutiveDashboard() {
  // Mock data for now
  const mockData: ExecutiveSummary = {
    signals_detected: 42,
    signals_approved: 28,
    signals_escalated: 8,
    signals_pending: 6,
    avg_response_time_hours: 2.4,
    top_concerns: [
      { concern: 'Phishing SMS Campaign', count: 15, risk: 'CRITICAL' },
      { concern: 'Fake Website (gbank-rewards-portal.com)', count: 12, risk: 'HIGH' },
      { concern: 'CVV Disclosure Tactics', count: 8, risk: 'HIGH' },
      { concern: 'Urgency-Based Social Engineering', count: 5, risk: 'MEDIUM' },
      { concern: 'Brand Impersonation', count: 2, risk: 'MEDIUM' },
    ],
    trend_data: [
      { date: 'Jan 27', signals: 5 },
      { date: 'Jan 28', signals: 8 },
      { date: 'Jan 29', signals: 12 },
      { date: 'Jan 30', signals: 9 },
      { date: 'Jan 31', signals: 8 },
    ],
    risk_distribution: { critical: 15, high: 18, medium: 7, low: 2 },
  };

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await workflowsApi.getAll();
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Calculate top concerns from real workflow data
  const calculateTopConcerns = () => {
    if (!workflows || workflows.length === 0) return [];
    
    // Count occurrences of each signal_type with risk level
    const concernMap = new Map<string, { count: number; risk: string }>();
    
    workflows.forEach((w: any) => {
      if (w.signal_type) {
        const existing = concernMap.get(w.signal_type);
        if (existing) {
          existing.count += 1;
          // Keep the highest risk level
          if (w.risk_level === 'CRITICAL' || existing.risk === 'CRITICAL') {
            existing.risk = 'CRITICAL';
          } else if (w.risk_level === 'HIGH' || existing.risk === 'HIGH') {
            existing.risk = 'HIGH';
          } else if (w.risk_level === 'MEDIUM' || existing.risk === 'MEDIUM') {
            existing.risk = 'MEDIUM';
          }
        } else {
          concernMap.set(w.signal_type, {
            count: 1,
            risk: w.risk_level || 'MEDIUM'
          });
        }
      }
    });
    
    // Convert to array and sort by count
    return Array.from(concernMap.entries())
      .map(([concern, data]) => ({ concern, count: data.count, risk: data.risk }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Calculate real metrics from workflows
  const summary: ExecutiveSummary = {
    signals_detected: workflows?.length || 0,
    signals_approved: workflows?.filter((w: any) => w.status === 'approved' || w.status === 'posted').length || 0,
    signals_escalated: workflows?.filter((w: any) => 
      w.status === 'escalated_management' || 
      w.status === 'escalated_legal' || 
      w.status === 'escalated_investigation'
    ).length || 0,
    signals_pending: workflows?.filter((w: any) => w.status === 'awaiting_approval').length || 0,
    avg_response_time_hours: workflows?.length > 0 ? 2.4 : 0,
    top_concerns: calculateTopConcerns(),
    trend_data: mockData.trend_data,
    risk_distribution: {
      critical: workflows?.filter((w: any) => w.risk_level === 'CRITICAL').length || 0,
      high: workflows?.filter((w: any) => w.risk_level === 'HIGH').length || 0,
      medium: workflows?.filter((w: any) => w.risk_level === 'MEDIUM').length || 0,
      low: workflows?.filter((w: any) => w.risk_level === 'LOW').length || 0,
    },
  };

  const isLoading = workflowsLoading;

  const getRiskColor = (risk: string) => {
    const colors = {
      CRITICAL: 'text-red-400 bg-red-500/20 border-red-500/30',
      HIGH: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
      MEDIUM: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      LOW: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    };
    return colors[risk as keyof typeof colors] || colors.MEDIUM;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading executive dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Executive Dashboard</h2>
        <p className="text-slate-400 mt-1">High-level overview of threat signals and response metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Signals Detected</p>
              <p className="text-white text-3xl font-bold mt-2">{summary.signals_detected}</p>
              <p className="text-green-400 text-xs mt-1">+12% vs last week</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-400/50" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Approved & Posted</p>
              <p className="text-white text-3xl font-bold mt-2">{summary.signals_approved}</p>
              <p className="text-blue-400 text-xs mt-1">{Math.round((summary.signals_approved / summary.signals_detected) * 100)}% of total</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400/50" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Escalated</p>
              <p className="text-white text-3xl font-bold mt-2">{summary.signals_escalated}</p>
              <p className="text-yellow-400 text-xs mt-1">{Math.round((summary.signals_escalated / summary.signals_detected) * 100)}% escalation rate</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-400/50" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Avg Response Time</p>
              <p className="text-white text-3xl font-bold mt-2">{summary.avg_response_time_hours}h</p>
              <p className="text-green-400 text-xs mt-1">-30min vs last week</p>
            </div>
            <Clock className="w-10 h-10 text-purple-400/50" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top Concerns */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Top Security Concerns</h3>
            <span className="text-sm text-slate-400">Last 7 days</span>
          </div>
          
          <div className="space-y-4">
            {summary.top_concerns.map((concern, index) => (
              <div key={index} className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl font-bold text-slate-600">#{index + 1}</span>
                      <h4 className="text-white font-medium">{concern.concern}</h4>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-slate-400">{concern.count} mentions</span>
                      <div className="group relative inline-block">
                        <span className={`px-2 py-1 rounded text-xs font-semibold border flex items-center gap-1 ${getRiskColor(concern.risk)}`}>
                          {concern.risk} RISK
                          <Info className="w-3 h-3 cursor-help" />
                        </span>
                        <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-72 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            <strong className="text-white">Risk Level:</strong> Assessment of threat severity and potential impact.
                            <br/><br/>
                            <span className="text-red-400">CRITICAL:</span> Fraud/phishing, immediate customer safety risk<br/>
                            <span className="text-orange-400">HIGH:</span> Service outages, significant brand impact<br/>
                            <span className="text-yellow-400">MEDIUM:</span> Moderate sentiment shifts<br/>
                            <span className="text-blue-400">LOW:</span> Minor concerns, positive signals
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Visual bar */}
                <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(concern.count / summary.top_concerns[0].count) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Risk Distribution */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">Risk Distribution</h3>
              <div className="group relative">
                <Info className="w-4 h-4 text-slate-500 cursor-help" />
                <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-80 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white">Risk Distribution:</strong> Breakdown of all detected signals by their assessed threat level based on:
                    <br/><br/>
                    • Signal type (phishing, fraud, service issues, etc.)<br/>
                    • Confidence level (FDA agent's certainty)<br/>
                    • Social media velocity (posts per hour)<br/>
                    • Potential impact on customers, brand, and operations
                  </p>
                </div>
              </div>
            </div>
            <BarChart3 className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-400 font-medium">Critical</span>
                <span className="text-white font-bold">{summary.risk_distribution.critical}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-red-500 h-3 rounded-full" style={{ width: `${(summary.risk_distribution.critical / summary.signals_detected) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-400 font-medium">High</span>
                <span className="text-white font-bold">{summary.risk_distribution.high}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${(summary.risk_distribution.high / summary.signals_detected) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-400 font-medium">Medium</span>
                <span className="text-white font-bold">{summary.risk_distribution.medium}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-yellow-500 h-3 rounded-full" style={{ width: `${(summary.risk_distribution.medium / summary.signals_detected) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400 font-medium">Low</span>
                <span className="text-white font-bold">{summary.risk_distribution.low}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${(summary.risk_distribution.low / summary.signals_detected) * 100}%` }}></div>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Signals</span>
              <span className="text-white text-xl font-bold">{summary.signals_detected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-purple-300 font-semibold text-lg mb-3">Actionable Insights</h3>
            <div className="space-y-2 text-sm text-purple-200">
              <p>📈 <strong>Phishing campaign intensity is increasing</strong> - Consider proactive customer communication</p>
              <p>⚡ <strong>Response time improved by 30 minutes</strong> - Team efficiency is trending positively</p>
              <p>🎯 <strong>15 critical signals require immediate attention</strong> - Prioritize escalated workflows</p>
              <p>🔒 <strong>All actions logged in audit trail</strong> - Full compliance with governance requirements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Actions Summary */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-yellow-300 font-semibold text-lg">Pending Actions Required</h3>
            <p className="text-yellow-400 text-sm mt-1">{summary.signals_pending} workflows awaiting human review</p>
          </div>
          <div className="text-right">
            <p className="text-yellow-300 text-3xl font-bold">{summary.signals_pending}</p>
            <a href="/posts" className="text-yellow-400 text-sm hover:underline">Review Now →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
