'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { label: 'Overview',  icon: '⬡', href: '/dashboard' },
  { label: 'Trading',   icon: '📈', href: '/dashboard/trading' },
  { label: 'Payout',    icon: '💸', href: '/dashboard/payout' },
  { label: 'KYC',       icon: '✅', href: '/dashboard/kyc' },
  { label: 'Affiliate', icon: '🔗', href: '/dashboard/affiliate' },
  { label: 'Settings',  icon: '⚙️', href: '/dashboard/settings' },
];

function Sidebar({ trader }: { trader: { fullName: string; email: string } | null }) {
  const initial = trader?.fullName?.[0]?.toUpperCase() ?? 'T';
  return (
    <aside className="w-60 flex-shrink-0 bg-surface border-r border-white/5 flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 font-heading font-extrabold text-base">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse2" />Koro Funding
        </Link>
      </div>
      <div className="px-3 py-4 flex-1">
        <p className="text-[10px] text-muted font-semibold uppercase tracking-widest px-3 mb-2">Menu</p>
        {NAV.map(n => (
          <Link key={n.label} href={n.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${
              n.label === 'Affiliate' ? 'bg-teal/10 text-teal border border-teal/15 font-medium' : 'text-muted hover:bg-white/5 hover:text-white'
            }`}>
            <span>{n.icon}</span>{n.label}
          </Link>
        ))}
      </div>
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center text-sm font-bold text-teal">{initial}</div>
          <div>
            <p className="text-xs font-semibold">{trader?.fullName ?? '—'}</p>
            <p className="text-[10px] text-muted">{trader?.email ?? '—'}</p>
          </div>
        </div>
        <Link href="/auth/logout" className="mt-3 w-full text-center text-xs text-muted hover:text-danger transition-colors block py-1">Keluar</Link>
      </div>
    </aside>
  );
}

const TIER_CONFIG: Record<string, { color: string; bg: string; border: string; next?: string; nextAt?: number }> = {
  BRONZE:  { color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  next: 'Silver',  nextAt: 3 },
  SILVER:  { color: 'text-slate-300',  bg: 'bg-slate-300/10',  border: 'border-slate-300/20',  next: 'Gold',    nextAt: 10 },
  GOLD:    { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', next: 'Diamond', nextAt: 25 },
  DIAMOND: { color: 'text-cyan-300',   bg: 'bg-cyan-300/10',   border: 'border-cyan-300/20' },
};

const TIER_EMOJI: Record<string, string> = {
  BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇', DIAMOND: '💎',
};

interface Conversion {
  id: string;
  referredId: string;
  orderId: string;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  convertedAt: string;
}

interface AffiliateStats {
  tier: string;
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  pendingBalance: number;
  paidBalance: number;
}

interface AffiliateData {
  stats: AffiliateStats;
  refCode: string;
  refLink: string;
  commissionRate: number;
  discountRate: number;
  conversions: Conversion[];
  tierThresholds: Record<string, number>;
}

export default function AffiliatePage() {
  const router = useRouter();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [trader, setTrader] = useState<{ fullName: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.replace('/auth/login'); return; }
    const t = localStorage.getItem('trader');
    if (t) setTrader(JSON.parse(t));

    fetch('http://localhost:4000/api/v1/affiliate/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (r.status === 401) { router.replace('/auth/login'); return null; } return r.json(); })
      .then(json => { if (json) setData(json); })
      .catch(() => setError('Gagal memuat data affiliate.'))
      .finally(() => setLoading(false));
  }, [router]);

  const copyLink = () => {
    if (!data?.refLink) return;
    navigator.clipboard.writeText(data.refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    if (!data?.refCode) return;
    navigator.clipboard.writeText(data.refCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted text-sm">Memuat data affiliate...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-white">
      <div className="text-center">
        <p className="text-danger mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-teal text-bg px-6 py-2 rounded-xl font-heading font-bold text-sm">Coba Lagi</button>
      </div>
    </div>
  );

  const stats = data?.stats;
  const tier = stats?.tier ?? 'BRONZE';
  const tierCfg = TIER_CONFIG[tier];
  const conversions = data?.conversions ?? [];
  const nextAt = tierCfg.nextAt;
  const progress = nextAt ? Math.min((stats?.totalConversions ?? 0) / nextAt * 100, 100) : 100;

  return (
    <div className="flex min-h-screen">
      <Sidebar trader={trader} />
      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-muted text-sm mb-1">Program Referral</p>
          <h1 className="font-heading font-extrabold text-2xl">Affiliate Dashboard 🔗</h1>
        </div>

        {/* Tier + Reflink row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Tier card */}
          <div className="bg-surface border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-[11px] text-muted uppercase tracking-widest mb-3">Tier Kamu</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{TIER_EMOJI[tier]}</span>
                <div>
                  <span className={`font-heading font-extrabold text-2xl ${tierCfg.color}`}>{tier}</span>
                  <p className="text-xs text-muted mt-0.5">{(data?.commissionRate ?? 0.1) * 100}% komisi per konversi</p>
                </div>
              </div>
              {tierCfg.next && (
                <>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted">Menuju {tierCfg.next}</span>
                    <span className="text-white">{stats?.totalConversions ?? 0} / {nextAt}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${tierCfg.color.replace('text-', 'bg-')}`} style={{ width: `${progress}%` }} />
                  </div>
                </>
              )}
              {!tierCfg.next && (
                <p className="text-xs text-cyan-300 mt-2">✨ Tier tertinggi! Kamu sudah Diamond.</p>
              )}
            </div>
            <div className={`mt-5 text-xs px-3 py-2 rounded-xl ${tierCfg.bg} ${tierCfg.border} border ${tierCfg.color}`}>
              Bronze: 0 · Silver: 3 · Gold: 10 · Diamond: 25 konversi
            </div>
          </div>

          {/* Reflink card */}
          <div className="lg:col-span-2 bg-surface border border-white/5 rounded-2xl p-6">
            <p className="text-[11px] text-muted uppercase tracking-widest mb-3">Link & Kode Referral Kamu</p>
            <p className="text-xs text-slate-300 mb-4">Jadilah bagian dari ekosistem Koro Funding. Setiap trader yang bergabung melalui link kamu mendapatkan diskon <span className="text-teal font-bold">{(data?.discountRate ?? 0.25) * 100}%</span> dan kamu mendapatkan komisi <span className="text-teal font-bold">{(data?.commissionRate ?? 0.1) * 100}%</span> dari nilai transaksi mereka.</p>

            {/* Ref Link */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-muted truncate">
                {data?.refLink ?? '—'}
              </div>
              <button onClick={copyLink} className={`px-4 py-3 rounded-xl text-sm font-heading font-bold transition-all ${copied ? 'bg-teal/20 text-teal border border-teal/30' : 'bg-teal text-bg hover:shadow-teal'}`}>
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>

            {/* Ref Code */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 flex-1 bg-bg border border-white/10 rounded-xl px-4 py-3">
                <span className="text-xs text-muted">Kode:</span>
                <span className="font-mono font-bold text-white tracking-widest">{data?.refCode ?? '—'}</span>
              </div>
              <button onClick={copyCode} className={`px-4 py-3 rounded-xl text-sm font-heading font-bold transition-all border ${copiedCode ? 'bg-teal/10 text-teal border-teal/30' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}>
                {copiedCode ? '✓' : 'Copy'}
              </button>
            </div>

            <p className="text-[11px] text-muted mt-4">💡 Buyer bisa input kode saat checkout, atau langsung klik link di atas.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Konversi',   value: String(stats?.totalConversions ?? 0),               color: 'text-teal' },
            { label: 'Total Earned',     value: `$${Number(stats?.totalEarned ?? 0).toFixed(2)}`,   color: 'text-teal' },
            { label: 'Pending Balance',  value: `$${Number(stats?.pendingBalance ?? 0).toFixed(2)}`, color: 'text-yellow-400' },
            { label: 'Paid Out',         value: `$${Number(stats?.paidBalance ?? 0).toFixed(2)}`,   color: 'text-slate-300' },
          ].map(s => (
            <div key={s.label} className="bg-surface border border-white/5 rounded-2xl p-5">
              <p className="text-[11px] text-muted uppercase tracking-widest mb-3">{s.label}</p>
              <p className={`font-heading font-extrabold text-2xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Conversion history */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-base">History Konversi</h2>
            <span className="text-xs text-muted">{conversions.length} transaksi</span>
          </div>

          {conversions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">🔗</p>
              <p className="text-muted text-sm mb-1">Belum ada konversi.</p>
              <p className="text-xs text-muted">Bagikan link referral kamu dan mulai hasilkan komisi!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-muted uppercase tracking-wider">
                    <th className="pb-3 text-left">Tanggal</th>
                    <th className="pb-3 text-left">Order ID</th>
                    <th className="pb-3 text-right">Komisi Rate</th>
                    <th className="pb-3 text-right">Komisi</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {conversions.map(c => (
                    <tr key={c.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-muted">{new Date(c.convertedAt).toLocaleDateString('id-ID')}</td>
                      <td className="py-3 font-mono text-xs text-muted">{c.orderId.slice(0, 8)}…</td>
                      <td className="py-3 text-right text-muted">{(Number(c.commissionRate) * 100).toFixed(0)}%</td>
                      <td className="py-3 text-right font-heading font-bold text-teal">+${Number(c.commissionAmount).toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'PAID'     ? 'bg-teal/10 text-teal' :
                          c.status === 'APPROVED' ? 'bg-yellow-400/10 text-yellow-400' :
                          c.status === 'REJECTED' ? 'bg-danger/10 text-danger' :
                                                    'bg-white/5 text-muted'
                        }`}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Withdraw CTA */}
        {Number(stats?.pendingBalance ?? 0) > 0 && (
          <div className="mt-6 bg-teal/5 border border-teal/20 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="font-heading font-bold text-sm">Kamu punya saldo komisi yang bisa dicairkan!</p>
              <p className="text-xs text-muted mt-1">Saldo pending: <span className="text-teal font-bold">${Number(stats?.pendingBalance ?? 0).toFixed(2)}</span> — hubungi admin untuk proses penarikan.</p>
            </div>
            <a href="mailto:admin@korofunding.com?subject=Withdraw Komisi Affiliate" className="bg-teal text-bg font-heading font-bold px-5 py-2.5 rounded-xl text-sm hover:shadow-teal transition-all whitespace-nowrap">
              Request Withdraw →
            </a>
          </div>
        )}

      </main>
    </div>
  );
}
