import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workflowsApi } from '@/api';
import { FileText, Download, Filter, Clock, User, CheckCircle, XCircle, AlertTriangle, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface AuditEntry {
  id: number;
  workflow_id: string;
  action: string;
  performed_by: string;
  timestamp: string;
  details?: string;
  risk_level?: string;
}

export default function AuditTrail() {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterOperator, setFilterOperator] = useState<string>('');
  
  // Mock data removed - using real API from workflows

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await workflowsApi.getAll();
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Convert workflows to audit entries
  const auditLog: AuditEntry[] = workflows?.map((w: any) => {
    let action = 'pending';
    let performed_by = 'System';
    let details = 'Workflow created';
    let timestamp = w.created_at;
    
    if (w.status === 'approved' || w.status === 'posted') {
      action = w.eba_edited_post ? 'approved_edited' : 'approved';
      performed_by = w.approved_by || 'Unknown';
      details = w.eba_edited_post ? 'Edited post for clarity, then approved' : 'Approved original post after review';
      timestamp = w.approved_at || w.created_at;
    } else if (w.status === 'escalated_management') {
      action = 'escalated_management';
      performed_by = w.escalated_by || 'Unknown';
      details = 'Escalated to management due to high confidence uncertainty';
      timestamp = w.escalated_at || w.created_at;
    } else if (w.status === 'escalated_legal') {
      action = 'escalated_legal';
      performed_by = w.escalated_by || 'Unknown';
      details = 'Escalated to legal/compliance for review';
      timestamp = w.escalated_at || w.created_at;
    } else if (w.status === 'escalated_investigation') {
      action = 'flagged_investigation';
      performed_by = w.escalated_by || 'Unknown';
      details = 'Flagged for investigation';
      timestamp = w.escalated_at || w.created_at;
    } else if (w.status === 'discarded') {
      action = 'discarded';
      performed_by = w.discarded_by || 'Unknown';
      details = 'Discarded - false positive or not actionable';
      timestamp = w.created_at;
    }
    
    return {
      id: w.id,
      workflow_id: w.workflow_id,
      action,
      performed_by,
      timestamp,
      details,
      risk_level: w.risk_level || 'MEDIUM',
    };
  }).filter((entry: AuditEntry) => entry.action !== 'pending') || [];

  const isLoading = workflowsLoading;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
      case 'approved_edited':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'discarded':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'escalated_management':
      case 'escalated_legal':
      case 'flagged_investigation':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      approved: 'Approved & Posted',
      approved_edited: 'Approved (Edited)',
      discarded: 'Discarded',
      escalated_management: 'Escalated to Management',
      escalated_legal: 'Escalated to Legal',
      flagged_investigation: 'Flagged for Investigation',
    };
    return labels[action] || action;
  };

  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;
    
    const config = {
      CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
      HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold border ${config[riskLevel as keyof typeof config]}`}>
        {riskLevel}
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Workflow ID', 'Action', 'Performed By', 'Risk Level', 'Details'];
    const rows = filteredAuditLog.map(entry => [
      format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      entry.workflow_id,
      getActionLabel(entry.action),
      entry.performed_by,
      entry.risk_level || 'N/A',
      entry.details || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredAuditLog = auditLog.filter(entry => {
    if (filterAction !== 'all' && entry.action !== filterAction) return false;
    if (filterOperator && !entry.performed_by.toLowerCase().includes(filterOperator.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading audit trail...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Audit Trail</h2>
          <p className="text-slate-400 mt-1">Complete history of all operator actions</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Responsible AI Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-blue-300 font-semibold">Audit & Accountability</h3>
            <p className="text-blue-400 text-sm mt-1">
              All operator actions are permanently logged with timestamps and operator identification. 
              This audit trail ensures accountability and enables post-incident review.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <h3 className="text-slate-300 font-medium">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Action Type</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Actions</option>
              <option value="approved">Approved</option>
              <option value="approved_edited">Approved (Edited)</option>
              <option value="escalated_management">Escalated to Management</option>
              <option value="escalated_legal">Escalated to Legal</option>
              <option value="flagged_investigation">Flagged for Investigation</option>
              <option value="discarded">Discarded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Operator Name</label>
            <input
              type="text"
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              placeholder="Search by operator..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Workflow ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredAuditLog.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>{format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-blue-400">{entry.workflow_id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getActionIcon(entry.action)}
                      <span className="text-sm text-slate-300">{getActionLabel(entry.action)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>{entry.performed_by}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRiskBadge(entry.risk_level)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-400">{entry.details}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAuditLog.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No audit entries match your filters</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Approved</p>
              <p className="text-green-300 text-2xl font-bold mt-1">
                {auditLog.filter(e => e.action.includes('approved')).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400/50" />
          </div>
        </div>
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">Escalated</p>
              <p className="text-yellow-300 text-2xl font-bold mt-1">
                {auditLog.filter(e => e.action.includes('escalated') || e.action.includes('flagged')).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400/50" />
          </div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm font-medium">Discarded</p>
              <p className="text-red-300 text-2xl font-bold mt-1">
                {auditLog.filter(e => e.action === 'discarded').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400/50" />
          </div>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Total Actions</p>
              <p className="text-blue-300 text-2xl font-bold mt-1">{auditLog.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400/50" />
          </div>
        </div>
      </div>
    </div>
  );
}

