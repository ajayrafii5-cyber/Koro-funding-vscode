'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type Conversion = {
  id: string;
  commissionAmount: string;
  commissionRate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  convertedAt: string;
  approvedAt: string | null;
  referrer: { id: string; fullName: string; email: string; affiliateRefCode: string } | null;
  referred: { id: string; fullName: string; email: string } | null;
  order: { id: string; pricePaid: string; accountSize: string; challengeType: string } | null;
};

const STATUS_STYLE: Record<string, string> = {
  PENDING:  'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  APPROVED: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

export default function AdminAffiliatePage() {
  const [data, setData]         = useState<Conversion[]>([]);
  const [filter, setFilter]     = useState<string>('ALL');
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError]       = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const q = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await fetch(`${API}/admin/affiliate/commissions${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Gagal memuat');
      setData(json.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [filter]);

  async function handleAction(id: string, action: 'approve' | 'reject') {
    if (!confirm(`${action === 'approve' ? 'Approve' : 'Reject'} komisi ini?`)) return;
    setActionId(id);
    try {
      const res = await fetch(`${API}/admin/affiliate/commissions/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await fetchData();
    } catch (e: any) {
      alert(e.message ?? 'Terjadi kesalahan');
    } finally {
      setActionId(null);
    }
  }

  const fmt = (n: string | number) =>
    `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  const pendingCount = data.filter(c => c.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Affiliate Commissions</h1>
            <p className="text-muted text-sm mt-1">
              Review dan approve komisi sebelum bisa dicairkan trader
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              {pendingCount} Pending
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filter === s
                  ? 'bg-teal text-background border-teal'
                  : 'bg-white/5 text-muted border-white/10 hover:bg-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 bg-surface overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-muted text-sm animate-pulse">Memuat data...</div>
          ) : error ? (
            <div className="p-16 text-center text-red-400 text-sm">{error}</div>
          ) : data.length === 0 ? (
            <div className="p-16 text-center text-muted text-sm">
              Tidak ada konversi {filter !== 'ALL' ? `dengan status ${filter}` : ''}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-muted text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Referrer</th>
                    <th className="px-6 py-4 text-left">Buyer</th>
                    <th className="px-6 py-4 text-left">Challenge</th>
                    <th className="px-6 py-4 text-right">Order</th>
                    <th className="px-6 py-4 text-right">Komisi (10%)</th>
                    <th className="px-6 py-4 text-center">Tanggal</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{c.referrer?.fullName ?? '—'}</p>
                        <p className="text-muted text-xs">{c.referrer?.email}</p>
                        <p className="text-teal text-xs font-mono mt-0.5">{c.referrer?.affiliateRefCode}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white">{c.referred?.fullName ?? '—'}</p>
                        <p className="text-muted text-xs">{c.referred?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {c.order?.challengeType ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-mono">
                        {c.order ? fmt(c.order.pricePaid) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-teal font-mono font-semibold">{fmt(c.commissionAmount)}</p>
                        <p className="text-muted text-xs">{(Number(c.commissionRate) * 100).toFixed(0)}%</p>
                      </td>
                      <td className="px-6 py-4 text-center text-muted text-xs">
                        {fmtDate(c.convertedAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[c.status]}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.status === 'PENDING' ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleAction(c.id, 'approve')}
                              disabled={actionId === c.id}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-teal/10 text-teal border border-teal/20 hover:bg-teal/20 disabled:opacity-40 transition-all"
                            >
                              {actionId === c.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleAction(c.id, 'reject')}
                              disabled={actionId === c.id}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 transition-all"
                            >
                              {actionId === c.id ? '...' : 'Reject'}
                            </button>
                          </div>
                        ) : (
                          <p className="text-center text-muted text-xs">
                            {c.approvedAt ? fmtDate(c.approvedAt) : '—'}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
