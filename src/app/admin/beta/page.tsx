'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Loader2, Users, Lock } from 'lucide-react';

interface BetaRequest {
  id: string;
  email: string;
  display_name: string | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  reviewed_at: string | null;
}

interface Counts {
  pending: number;
  approved: number;
  denied: number;
  total: number;
}

export default function AdminBetaPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [requests, setRequests] = useState<BetaRequest[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, denied: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check sessionStorage for saved key
  useEffect(() => {
    const saved = sessionStorage.getItem('beta_admin_key');
    if (saved) {
      setAdminKey(saved);
      setAuthenticated(true);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const url = filter ? `/api/admin/beta?status=${filter}` : '/api/admin/beta';
      const res = await fetch(url, { headers: { 'x-admin-key': adminKey } });
      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false);
          sessionStorage.removeItem('beta_admin_key');
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setRequests(data.requests || []);
      setCounts(data.counts || { pending: 0, approved: 0, denied: 0, total: 0 });
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [adminKey, filter]);

  useEffect(() => {
    if (authenticated) fetchRequests();
  }, [authenticated, fetchRequests]);

  const handleAuth = () => {
    sessionStorage.setItem('beta_admin_key', adminKey);
    setAuthenticated(true);
  };

  const handleAction = async (id: string, action: 'approve' | 'deny') => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/beta/${id}/${action}`, {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
      });
      await fetchRequests();
    } catch {
      // Silent
    } finally {
      setActionLoading(null);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-sm w-full p-6 text-center">
          <Lock size={32} className="text-burnt mx-auto mb-4" />
          <h1 className="font-display text-xl text-armadillo-text mb-4">Admin Access</h1>
          <input
            type="password"
            placeholder="Admin key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            className="w-full bg-armadillo-card border border-armadillo-border rounded-xl px-4 py-3 text-sm text-armadillo-text placeholder:text-armadillo-muted/50 mb-3"
          />
          <button
            onClick={handleAuth}
            className="w-full bg-burnt text-white py-3 rounded-xl font-medium text-sm"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-armadillo-bg p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield size={24} className="text-burnt" />
          <h1 className="font-display text-2xl text-armadillo-text">Beta Access Manager</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pending', value: counts.pending, color: 'text-burnt', bg: 'bg-burnt/10' },
            { label: 'Approved', value: counts.approved, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Denied', value: counts.denied, color: 'text-danger', bg: 'bg-danger/10' },
            { label: 'Total', value: counts.total, color: 'text-armadillo-text', bg: 'bg-armadillo-card' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} border border-armadillo-border rounded-xl p-4 text-center`}>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-armadillo-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: null, label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'denied', label: 'Denied' },
          ].map((tab) => (
            <button
              key={tab.key ?? 'all'}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key ? 'bg-burnt text-white' : 'bg-armadillo-card text-armadillo-muted border border-armadillo-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="ml-auto px-4 py-2 rounded-lg text-sm bg-armadillo-card border border-armadillo-border text-armadillo-muted"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Refresh'}
          </button>
        </div>

        {/* Table */}
        <div className="bg-armadillo-card border border-armadillo-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-armadillo-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-armadillo-muted uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-armadillo-muted uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-xs font-semibold text-armadillo-muted uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-armadillo-muted uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-armadillo-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-armadillo-border/50">
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-armadillo-muted">
                    {loading ? 'Loading...' : 'No requests found.'}
                  </td>
                </tr>
              )}
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-armadillo-bg/30">
                  <td className="px-4 py-3">
                    <div className="text-armadillo-text font-medium">{req.display_name || 'Unknown'}</div>
                    <div className="text-xs text-armadillo-muted">{req.email}</div>
                  </td>
                  <td className="px-4 py-3 text-armadillo-muted max-w-xs truncate">
                    {req.reason || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-armadillo-muted whitespace-nowrap">
                    {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                      req.status === 'pending' ? 'bg-burnt/10 text-burnt' :
                      req.status === 'approved' ? 'bg-success/10 text-success' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {req.status === 'pending' && <Clock size={10} />}
                      {req.status === 'approved' && <CheckCircle size={10} />}
                      {req.status === 'denied' && <XCircle size={10} />}
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, 'approve')}
                          disabled={actionLoading === req.id}
                          className="flex items-center gap-1 bg-success/10 text-success px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-success/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === req.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'deny')}
                          disabled={actionLoading === req.id}
                          className="flex items-center gap-1 bg-danger/10 text-danger px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-danger/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={12} />
                          Deny
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
    </div>
  );
}
