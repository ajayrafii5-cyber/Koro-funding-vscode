'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Account {
  id: string; platformLogin: string; type: string; size: number;
  phase: number; status: string; balance: number; equity: number;
  dailyLossUsed: number; dailyLossLimit: number;
  maxDrawdownUsed: number; maxDrawdownLimit: number;
  profitToDate: number; profitTarget: number; tradingDays: number;
  platform: string; platformServer: string; expiresAt: string | null;
  trades?: Trade[];
}
interface Trade {
  id: string; symbol: string; type: string; lots: number;
  openPrice: number; closePrice: number | null; profit: number;
  platformTicket: string; closeTime: string | null;
}
interface DashboardData {
  accounts: Account[];
  stats: { totalAccounts: number; activeAccounts: number; fundedAccounts: number; totalPayout: number; };
}

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
              n.label === 'Overview' ? 'bg-teal/10 text-teal border border-teal/15 font-medium' : 'text-muted hover:bg-white/5 hover:text-white'
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

function MetricCard({ label, value, color = 'text-teal', sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-5">
      <p className="text-[11px] text-muted uppercase tracking-widest mb-3">{label}</p>
      <p className={`font-heading font-extrabold text-2xl ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const pct = Math.min((used / limit) * 100, 100);
  const displayColor = pct >= 80 ? 'bg-danger' : pct >= 50 ? 'bg-gold' : color;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted">{label}</span>
        <span className={pct >= 80 ? 'text-danger' : pct >= 50 ? 'text-gold' : 'text-teal'}>
          ${used.toLocaleString()} / ${limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${displayColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface2 border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-muted mb-1">Day {label}</p>
      <p className="text-teal font-bold">${Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedAccId, setSelectedAccId] = useState<string>('');
  const [detailAcc, setDetailAcc] = useState<Account | null>(null);
  const [trader, setTrader] = useState<{ fullName: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState<{ day: string; equity: number }[]>([]);
  const [liveEquity, setLiveEquity] = useState(0);
  const [showAccDropdown, setShowAccDropdown] = useState(false);

  const fetchAccountDetail = (accId: string, token: string) => {
    fetch(`http://localhost:4000/api/v1/dashboard/accounts/${accId}/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setDetailAcc(d.account);
        setLiveEquity(Number(d.account?.equity ?? 0));
        if (d.account?.metricsSnapshots?.length > 0) {
          const chart = [...d.account.metricsSnapshots].reverse().map((s: any, i: number) => ({
            day: String(i + 1), equity: Number(s.equity),
          }));
          setChartData(chart);
        } else {
          setChartData([{ day: '1', equity: Number(d.account?.equity ?? 0) }]);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.replace('/auth/login'); return; }
    const t = localStorage.getItem('trader');
    if (t) setTrader(JSON.parse(t));

    fetch('http://localhost:4000/api/v1/dashboard/overview', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (r.status === 401) { router.replace('/auth/login'); return null; } return r.json(); })
      .then(json => {
        if (!json) return;
        setData(json);
        const firstAcc = json.accounts?.[0];
        if (firstAcc) {
          setSelectedAccId(firstAcc.id);
          fetchAccountDetail(firstAcc.id, token);
        }
      })
      .catch(() => setError('Gagal memuat data dashboard.'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSwitchAccount = (accId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setSelectedAccId(accId);
    setShowAccDropdown(false);
    setDetailAcc(null);
    setChartData([]);
    fetchAccountDetail(accId, token);
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted text-sm">Memuat dashboard...</p>
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

  if (!data?.accounts?.length) return (
    <div className="flex min-h-screen">
      <Sidebar trader={trader} />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted mb-2">Kamu belum punya akun trading.</p>
          <Link href="/challenge" className="bg-teal text-bg font-heading font-bold px-6 py-3 rounded-xl text-sm hover:shadow-teal transition-all">Mulai Challenge →</Link>
        </div>
      </main>
    </div>
  );

  const acc = data.accounts.find(a => a.id === selectedAccId) ?? data.accounts[0];
  const trades = detailAcc?.trades ?? [];
  const dailyPct  = (Number(acc.dailyLossUsed) / Number(acc.dailyLossLimit)) * 100;
  const profitPct = (Number(acc.profitToDate) / Number(acc.profitTarget)) * 100;

  return (
    <div className="flex min-h-screen">
      <Sidebar trader={trader} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-muted text-sm mb-1">Selamat datang kembali,</p>
            <h1 className="font-heading font-extrabold text-2xl">{trader?.fullName ?? 'Trader'} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Account Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowAccDropdown(!showAccDropdown)}
                className="flex items-center gap-2 bg-surface border border-white/5 rounded-xl px-4 py-2 hover:border-teal/30 transition-all"
              >
                <span className="text-xs text-muted">Akun:</span>
                <span className="text-sm font-heading font-bold text-teal">{acc.platformLogin}</span>
                <span className="text-[10px] bg-teal/10 text-teal border border-teal/20 rounded-full px-2 py-0.5 font-semibold">Phase {acc.phase}</span>
                <span className="text-muted text-xs ml-1">▾</span>
              </button>
              {showAccDropdown && (
                <div className="absolute right-0 top-12 z-50 bg-surface border border-white/10 rounded-xl shadow-2xl min-w-64 overflow-hidden">
                  <p className="text-[10px] text-muted uppercase tracking-widest px-4 py-3 border-b border-white/5 font-semibold">Pilih Akun Trading</p>
                  {data.accounts.map(a => (
                    <button
                      key={a.id}
                      onClick={() => handleSwitchAccount(a.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-all text-left ${a.id === selectedAccId ? 'bg-teal/5' : ''}`}
                    >
                      <div>
                        <p className="text-sm font-bold text-white">{a.platformLogin}</p>
                        <p className="text-xs text-muted">{a.type.replace(/_/g, ' ')} · ${Number(a.size).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          a.status === 'ACTIVE' ? 'bg-teal/10 text-teal' :
                          a.status === 'FUNDED' ? 'bg-gold/10 text-gold' : 'bg-white/5 text-muted'
                        }`}>{a.status}</span>
                        <p className="text-[10px] text-muted mt-1">Phase {a.phase}</p>
                      </div>
                    </button>
                  ))}
                  <div className="px-4 py-3 border-t border-white/5">
                    <Link href="/challenge" className="text-xs text-teal hover:underline">+ Beli Akun Baru</Link>
                  </div>
                </div>
              )}
            </div>
            <Link href="/dashboard/payout" className="bg-teal text-bg font-heading font-bold px-5 py-2 rounded-xl text-sm hover:shadow-teal transition-all">Request Payout</Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Balance" value={`$${Number(acc.balance).toLocaleString()}`} />
          <MetricCard label="Equity (Live)" value={`$${liveEquity.toLocaleString()}`} color={liveEquity >= Number(acc.balance) ? 'text-teal' : 'text-danger'} />
          <MetricCard label="Profit To Date" value={`+$${Number(acc.profitToDate).toLocaleString()}`} sub={`${profitPct.toFixed(0)}% dari target`} />
          <MetricCard label="Trading Days" value={`${acc.tradingDays} hari`} color="text-gold" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-surface border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-base">Equity Growth</h2>
              <span className="text-xs text-teal bg-teal/10 border border-teal/20 rounded-full px-3 py-1">Live Update</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D4C8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00D4C8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#6B7A99', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7A99', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="equity" stroke="#00D4C8" strokeWidth={2.5} fill="url(#eq)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-surface border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading font-bold text-base mb-6">Risk Meter</h2>
            <ProgressBar label="Profit Target" used={Number(acc.profitToDate)} limit={Number(acc.profitTarget)} color="bg-teal" />
            <ProgressBar label="Daily Loss"    used={Number(acc.dailyLossUsed)} limit={Number(acc.dailyLossLimit)} color="bg-teal" />
            <ProgressBar label="Max Drawdown"  used={Number(acc.maxDrawdownUsed)} limit={Number(acc.maxDrawdownLimit)} color="bg-teal" />
            <div className="mt-6 p-3 rounded-xl bg-bg border border-white/5 text-center">
              <p className="text-[11px] text-muted uppercase tracking-wider mb-1">Risk Score</p>
              <p className={`font-heading font-extrabold text-3xl ${dailyPct < 40 ? 'text-teal' : dailyPct < 70 ? 'text-gold' : 'text-danger'}`}>
                {dailyPct < 40 ? 'SAFE' : dailyPct < 70 ? 'MODERATE' : 'HIGH'}
              </p>
              <p className="text-xs text-muted mt-1">Daily usage: {dailyPct.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-surface border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading font-bold text-base mb-5">Info Akun</h2>
            {[
              { lbl:'Platform',  val: acc.platform },
              { lbl:'Login',     val: acc.platformLogin },
              { lbl:'Server',    val: acc.platformServer },
              { lbl:'Tipe',      val: acc.type.replace(/_/g, ' ') },
              { lbl:'Size',      val: `$${Number(acc.size).toLocaleString()}` },
              { lbl:'Expires',   val: acc.expiresAt ? new Date(acc.expiresAt).toLocaleDateString('id-ID') : '—' },
            ].map(r => (
              <div key={r.lbl} className="flex justify-between py-2.5 border-b border-white/5 last:border-0 text-sm">
                <span className="text-muted">{r.lbl}</span>
                <span className="font-medium text-white">{r.val}</span>
              </div>
            ))}
            <Link href="/dashboard/kyc" className="mt-5 w-full block text-center bg-teal/10 border border-teal/20 text-teal font-heading font-semibold py-2.5 rounded-xl text-sm hover:bg-teal/20 transition-all">Verifikasi KYC</Link>
          </div>
          <div className="lg:col-span-2 bg-surface border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-base">Recent Trades</h2>
              <Link href="/dashboard/trading" className="text-xs text-teal hover:underline">Lihat semua</Link>
            </div>
            {trades.length === 0 ? (
              <p className="text-muted text-sm text-center py-8">Belum ada trade. Mulai trading di platform MT5 kamu.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] text-muted uppercase tracking-wider">
                      <th className="pb-3 text-left">Ticket</th><th className="pb-3 text-left">Symbol</th>
                      <th className="pb-3 text-left">Type</th><th className="pb-3 text-right">Lots</th>
                      <th className="pb-3 text-right">Open</th><th className="pb-3 text-right">Close</th>
                      <th className="pb-3 text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(t => (
                      <tr key={t.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 text-muted">#{t.platformTicket}</td>
                        <td className="py-3 font-medium">{t.symbol}</td>
                        <td className="py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${t.type === 'BUY' ? 'bg-teal/10 text-teal' : 'bg-danger/10 text-danger'}`}>{t.type}</span></td>
                        <td className="py-3 text-right text-muted">{Number(t.lots).toFixed(2)}</td>
                        <td className="py-3 text-right text-muted">{Number(t.openPrice).toFixed(2)}</td>
                        <td className="py-3 text-right text-muted">{t.closePrice ? Number(t.closePrice).toFixed(2) : '—'}</td>
                        <td className={`py-3 text-right font-heading font-bold ${Number(t.profit) >= 0 ? 'text-teal' : 'text-danger'}`}>
                          {Number(t.profit) >= 0 ? '+' : ''}${Number(t.profit).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
