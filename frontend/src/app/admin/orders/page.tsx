'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  traderId: string;
  trader: { email: string; fullName: string } | null;
  challengeType: string;
  accountSize: number;
  pricePaid: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  paidAt: string | null;
  accounts: { id: string; platformLogin: string; status: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-gold/10 text-gold border-gold/20',
  PAID:     'bg-teal/10 text-teal border-teal/20',
  FAILED:   'bg-danger/10 text-danger border-danger/20',
  REFUNDED: 'bg-white/10 text-muted border-white/10',
};

function AdminSidebar() {
  return (
    <aside className="w-60 flex-shrink-0 bg-surface border-r border-white/5 flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-2 font-heading font-extrabold text-base">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse2" />Koro Admin
        </Link>
      </div>
      <div className="px-3 py-4 flex-1">
        {[
          { label: 'Dashboard', icon: '⬡', href: '/admin' },
          { label: 'Orders',    icon: '📋', href: '/admin/orders' },
          { label: 'Traders',   icon: '👥', href: '/admin/traders' },
        ].map(n => (
          <Link key={n.label} href={n.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${
              n.label === 'Orders' ? 'bg-teal/10 text-teal border border-teal/15 font-medium' : 'text-muted hover:bg-white/5 hover:text-white'
            }`}>
            <span>{n.icon}</span>{n.label}
          </Link>
        ))}
      </div>
      <div className="px-4 py-4 border-t border-white/5">
        <Link href="/auth/logout" className="w-full text-center text-xs text-muted hover:text-danger transition-colors block py-1">Keluar</Link>
      </div>
    </aside>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [filter, setFilter]   = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    if (!token) { router.replace('/auth/login'); return; }
    fetchOrders();
  }, [filter]);

  const fetchOrders = () => {
    const url = filter
      ? `http://localhost:4000/api/v1/admin/orders?status=${filter}`
      : `http://localhost:4000/api/v1/admin/orders`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) { router.replace('/auth/login'); return null; }
        if (r.status === 404) { router.replace('/dashboard'); return null; }
        return r.json();
      })
      .then(json => { if (json) setOrders(json.orders); })
      .finally(() => setLoading(false));
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionId(id);
    await fetch(`http://localhost:4000/api/v1/admin/orders/${id}/${action}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setActionId(null);
    fetchOrders();
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-extrabold text-2xl">Orders</h1>
            <p className="text-muted text-sm mt-1">Kelola semua order masuk</p>
          </div>
          <div className="flex gap-2">
            {['', 'PENDING', 'PAID', 'FAILED'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  filter === s ? 'bg-teal text-bg border-teal' : 'border-white/10 text-muted hover:border-white/30'
                }`}>
                {s === '' ? 'Semua' : s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-muted">Tidak ada order.</div>
        ) : (
          <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted uppercase tracking-wider border-b border-white/5">
                  <th className="px-6 py-4 text-left">Trader</th>
                  <th className="px-6 py-4 text-left">Challenge</th>
                  <th className="px-6 py-4 text-left">Size</th>
                  <th className="px-6 py-4 text-left">Harga</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Tanggal</th>
                  <th className="px-6 py-4 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium">{o.trader?.fullName ?? '—'}</p>
                      <p className="text-xs text-muted">{o.trader?.email ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-muted">{o.challengeType.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 text-muted">${Number(o.accountSize).toLocaleString()}</td>
                    <td className="px-6 py-4 font-heading font-bold text-teal">${Number(o.pricePaid).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[o.paymentStatus] ?? ''}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {new Date(o.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      {o.paymentStatus === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(o.id, 'approve')}
                            disabled={actionId === o.id}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-teal/10 text-teal border border-teal/20 hover:bg-teal/20 transition-all disabled:opacity-50">
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(o.id, 'reject')}
                            disabled={actionId === o.id}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-all disabled:opacity-50">
                            Reject
                          </button>
                        </div>
                      )}
                      {o.paymentStatus !== 'PENDING' && (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
