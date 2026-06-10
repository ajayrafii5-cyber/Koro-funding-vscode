'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Overview {
  totalTraders: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

function AdminSidebar() {
  const NAV = [
    { label: 'Dashboard', icon: '⬡', href: '/admin' },
    { label: 'Orders',    icon: '📋', href: '/admin/orders' },
    { label: 'Traders',   icon: '👥', href: '/admin/traders' },
    { label: 'Affiliate', icon: '🤝', href: '/admin/affiliate' },
    { label: 'Promo',     icon: '🏷️',  href: '/admin/promo' },
  ];
  return (
    <aside className="w-60 flex-shrink-0 bg-surface border-r border-white/5 flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-2 font-heading font-extrabold text-base">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse2" />Koro Admin
        </Link>
      </div>
      <div className="px-3 py-4 flex-1">
        {NAV.map(n => (
          <Link key={n.label} href={n.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 text-muted hover:bg-white/5 hover:text-white">
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

function StatCard({ label, value, color = 'text-teal' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-5">
      <p className="text-[11px] text-muted uppercase tracking-widest mb-3">{label}</p>
      <p className={`font-heading font-extrabold text-2xl ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.replace('/auth/login'); return; }

    fetch('http://localhost:4000/api/v1/admin/overview', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 401) { router.replace('/auth/login'); return null; }
        if (r.status === 404) { router.replace('/dashboard'); return null; }
        return r.json();
      })
      .then(json => { if (json) setOverview(json); })
      .catch(() => setError('Gagal memuat data.'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-white">
      <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-white">
      <p className="text-danger">{error}</p>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="font-heading font-extrabold text-2xl">Admin Dashboard</h1>
          <p className="text-muted text-sm mt-1">Overview platform Koro Funding</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Traders"   value={overview?.totalTraders ?? 0} />
          <StatCard label="Total Orders"    value={overview?.totalOrders ?? 0} color="text-gold" />
          <StatCard label="Pending Orders"  value={overview?.pendingOrders ?? 0} color="text-danger" />
          <StatCard label="Total Revenue"   value={`$${Number(overview?.totalRevenue ?? 0).toLocaleString()}`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/admin/orders"
            className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-teal/30 transition-all group">
            <p className="text-2xl mb-3">📋</p>
            <h2 className="font-heading font-bold text-base mb-1 group-hover:text-teal transition-colors">Kelola Orders</h2>
            <p className="text-muted text-sm">Approve atau reject order masuk</p>
            {(overview?.pendingOrders ?? 0) > 0 && (
              <span className="mt-3 inline-block bg-danger/10 text-danger border border-danger/20 text-xs font-bold px-2 py-0.5 rounded-full">
                {overview?.pendingOrders} pending
              </span>
            )}
          </Link>
          <Link href="/admin/traders"
            className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-teal/30 transition-all group">
            <p className="text-2xl mb-3">👥</p>
            <h2 className="font-heading font-bold text-base mb-1 group-hover:text-teal transition-colors">Kelola Traders</h2>
            <p className="text-muted text-sm">Lihat detail dan suspend trader</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
