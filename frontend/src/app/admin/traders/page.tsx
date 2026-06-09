'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Account { id: string; status: string; size: number; type: string; phase: number; }
interface Trader { id: string; email: string; fullName: string; phone: string | null; country: string | null; kycStatus: string; role: string; createdAt: string; lastLoginAt: string | null; accounts: Account[]; _count: { accounts: number }; }

const KYC_COLORS: Record<string, string> = { PENDING: 'bg-gold/10 text-gold border-gold/20', SUBMITTED: 'bg-teal/10 text-teal border-teal/20', VERIFIED: 'bg-teal/10 text-teal border-teal/20', REJECTED: 'bg-danger/10 text-danger border-danger/20' };
const STATUS_COLORS: Record<string, string> = { ACTIVE: 'text-teal', SUSPENDED: 'text-danger', BREACHED: 'text-danger', PASSED: 'text-gold', FUNDED: 'text-teal', EXPIRED: 'text-muted' };

function AdminSidebar() {
  return (
    <aside className="w-60 flex-shrink-0 bg-surface border-r border-white/5 flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-white/5">
        <Link href="/admin" className="flex items-center gap-2 font-heading font-extrabold text-base">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse2" />Koro Admin
        </Link>
      </div>
      <div className="px-3 py-4 flex-1">
        {[{ label: 'Dashboard', icon: '⬡', href: '/admin' }, { label: 'Orders', icon: '📋', href: '/admin/orders' }, { label: 'Traders', icon: '👥', href: '/admin/traders' }].map(n => (
          <Link key={n.label} href={n.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${n.label === 'Traders' ? 'bg-teal/10 text-teal border border-teal/15 font-medium' : 'text-muted hover:bg-white/5 hover:text-white'}`}>
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

export default function AdminTradersPage() {
  const router = useRouter();
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => { if (!token) { router.replace('/auth/login'); return; } fetchTraders(); }, []);

  const fetchTraders = () => {
    fetch('http://localhost:4000/api/v1/admin/traders', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { router.replace('/auth/login'); return null; } if (r.status === 404) { router.replace('/dashboard'); return null; } return r.json(); })
      .then(json => { if (json) setTraders(json.traders); })
      .finally(() => setLoading(false));
  };

  const handleAction = async (id: string, action: 'suspend' | 'unsuspend') => {
    setActionId(id);
    await fetch(`http://localhost:4000/api/v1/admin/traders/${id}/${action}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
    setActionId(null);
    fetchTraders();
  };

  const handleDelete = async (id: string) => {
    setActionId(id);
    await fetch(`http://localhost:4000/api/v1/admin/traders/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setActionId(null);
    setConfirmDelete(null);
    fetchTraders();
  };

  const isSuspended = (t: Trader) => t.accounts.length > 0 && t.accounts.every(a => a.status === 'SUSPENDED');
  const phaseLabel = (phase: number) => phase === 0 ? 'Funded' : `Phase ${phase}`;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="font-heading font-extrabold text-2xl">Traders</h1>
          <p className="text-muted text-sm mt-1">Kelola semua trader terdaftar</p>
        </div>

        {confirmDelete && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="font-heading font-bold text-lg mb-2">Hapus Trader?</h2>
              <p className="text-muted text-sm mb-6">Aksi ini tidak bisa dibatalkan.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:border-white/30 transition-all">Batal</button>
                <button onClick={() => handleDelete(confirmDelete)} disabled={actionId === confirmDelete} className="flex-1 py-2.5 rounded-xl bg-danger/20 border border-danger/30 text-danger text-sm font-bold hover:bg-danger/30 transition-all disabled:opacity-50">{actionId === confirmDelete ? 'Menghapus...' : 'Hapus'}</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" /></div>
        ) : traders.length === 0 ? (
          <div className="text-center py-20 text-muted">Belum ada trader.</div>
        ) : (
          <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted uppercase tracking-wider border-b border-white/5">
                  <th className="px-6 py-4 text-left">Trader</th>
                  <th className="px-6 py-4 text-left">Negara</th>
                  <th className="px-6 py-4 text-left">KYC</th>
                  <th className="px-6 py-4 text-left">Akun Trading</th>
                  <th className="px-6 py-4 text-left">Login Terakhir</th>
                  <th className="px-6 py-4 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {traders.map(t => (
                  <tr key={t.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4"><p className="font-medium">{t.fullName}</p><p className="text-xs text-muted">{t.email}</p></td>
                    <td className="px-6 py-4 text-muted">{t.country ?? '—'}</td>
                    <td className="px-6 py-4"><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${KYC_COLORS[t.kycStatus] ?? ''}`}>{t.kycStatus}</span></td>
                    <td className="px-6 py-4">
                      {t.accounts.length === 0 ? <span className="text-xs text-muted">—</span> : (
                        <div className="flex flex-col gap-1">
                          {t.accounts.map(a => (
                            <div key={a.id} className="flex items-center gap-2">
                              <span className="text-xs text-muted">${Number(a.size).toLocaleString()}</span>
                              <span className="text-xs bg-white/5 px-1.5 py-0.5 rounded text-muted">{phaseLabel(a.phase)}</span>
                              <span className={`text-xs font-bold ${STATUS_COLORS[a.status] ?? "text-muted"}`}>{a.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">{t.lastLoginAt ? new Date(t.lastLoginAt).toLocaleDateString('id-ID') : '—'}</td>
                    <td className="px-6 py-4">
                      {t.role !== 'ADMIN' ? (
                        <div className="flex items-center gap-2">
                          {isSuspended(t) ? (
                            <button onClick={() => handleAction(t.id, 'unsuspend')} disabled={actionId === t.id} className="px-3 py-1 rounded-lg text-xs font-bold bg-teal/10 text-teal border border-teal/20 hover:bg-teal/20 transition-all disabled:opacity-50">Aktifkan</button>
                          ) : (
                            <button onClick={() => handleAction(t.id, 'suspend')} disabled={actionId === t.id} className="px-3 py-1 rounded-lg text-xs font-bold bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all disabled:opacity-50">Suspend</button>
                          )}
                          <button onClick={() => setConfirmDelete(t.id)} disabled={actionId === t.id} className="px-3 py-1 rounded-lg text-xs font-bold bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-all disabled:opacity-50">Hapus</button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Admin</span>
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
