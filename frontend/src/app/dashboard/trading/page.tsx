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
              n.label === 'Trading' ? 'bg-teal/10 text-teal border border-teal/15 font-medium' : 'text-muted hover:bg-white/5 hover:text-white'
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

function RiskBar({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const isWarning = pct >= 70;
  const isDanger = pct >= 90;
  const barColor = isDanger ? 'bg-danger' : isWarning ? 'bg-gold' : color;
  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] text-muted uppercase tracking-widest">{label}</span>
        <span className={`text-xs font-bold font-heading ${isDanger ? 'text-danger' : isWarning ? 'text-gold' : 'text-white'}`}>
          ${used.toFixed(0)} <span className="text-muted font-normal">/ ${limit.toFixed(0)}</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-[10px] mt-1 ${isDanger ? 'text-danger font-semibold' : isWarning ? 'text-gold' : 'text-muted'}`}>
        {isDanger ? '⚠️ Mendekati batas!' : isWarning ? '⚡ Hati-hati' : `${(100 - pct).toFixed(0)}% tersisa`}
      </p>
    </div>
  );
}

interface Trade {
  id: string; symbol: string; type: string; lots: number;
  openPrice: number; closePrice: number | null; profit: number;
  platformTicket: string; openTime: string; closeTime: string | null; isOpen: boolean;
}
interface Account {
  id: string; platformLogin: string; platformServer: string; platform: string;
  type: string; size: number; phase: number; status: string; trades: Trade[];
  balance: number; equity: number; openPnl: number;
  dailyLossUsed: number; dailyLossLimit: number;
  maxDrawdownUsed: number; maxDrawdownLimit: number;
  profitToDate: number; profitTarget: number;
  tradingDays: number; payoutSplit: number;
  expiresAt: string | null;
}

const PAGE_SIZE = 15;

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function daysLeft(iso: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function useServerClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcS = now.getUTCSeconds();
  const totalSecs = utcH * 3600 + utcM * 60 + utcS;
  const secsUntilReset = 86400 - totalSecs;
  const rH = String(Math.floor(secsUntilReset / 3600)).padStart(2, '0');
  const rM = String(Math.floor((secsUntilReset % 3600) / 60)).padStart(2, '0');
  const rS = String(secsUntilReset % 60).padStart(2, '0');
  const serverTime = `${String(utcH).padStart(2,'0')}:${String(utcM).padStart(2,'0')}:${String(utcS).padStart(2,'0')} UTC`;
  const resetCountdown = `${rH}:${rM}:${rS}`;
  return { serverTime, resetCountdown };
}

export default function TradingPage() {
  const router = useRouter();
  const [trader, setTrader] = useState<{ fullName: string; email: string } | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccId, setSelectedAccId] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { serverTime, resetCountdown } = useServerClock();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.replace('/auth/login'); return; }
    const t = localStorage.getItem('trader');
    if (t) setTrader(JSON.parse(t));
    fetch('http://localhost:4000/api/v1/dashboard/overview', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(async data => {
        if (!data.accounts?.length) { setLoading(false); return; }
        const accsWithTrades = await Promise.all(
          data.accounts.map(async (acc: Account) => {
            const r = await fetch(`http://localhost:4000/api/v1/dashboard/accounts/${acc.id}/metrics`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const d = await r.json();
            const a = d.account ?? {};
            return {
              ...acc,
              equity: Number(a.equity ?? acc.equity ?? 0),
              openPnl: Number(a.openPnl ?? 0),
              dailyLossUsed: Number(a.dailyLossUsed ?? 0),
              dailyLossLimit: Number(a.dailyLossLimit ?? 0),
              maxDrawdownUsed: Number(a.maxDrawdownUsed ?? 0),
              maxDrawdownLimit: Number(a.maxDrawdownLimit ?? 0),
              profitTarget: Number(a.profitTarget ?? 0),
              payoutSplit: Number(a.payoutSplit ?? 80),
              platformServer: a.platformServer ?? acc.platformServer ?? '—',
              platform: a.platform ?? acc.platform ?? 'MT5',
              trades: a.trades ?? [],
            };
          })
        );
        setAccounts(accsWithTrades);
        setSelectedAccId(accsWithTrades[0]?.id ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { setPage(1); }, [filter, search, selectedAccId]);

  const acc = accounts.find(a => a.id === selectedAccId) ?? accounts[0];
  const trades = acc?.trades ?? [];

  const filteredTrades = trades.filter(t => {
    if (filter === 'open' && !t.isOpen) return false;
    if (filter === 'closed' && t.isOpen) return false;
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / PAGE_SIZE));
  const paginated = filteredTrades.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalProfit = trades.filter(t => !t.isOpen).reduce((s, t) => s + Number(t.profit), 0);
  const winners = trades.filter(t => !t.isOpen && Number(t.profit) > 0).length;
  const closedCount = trades.filter(t => !t.isOpen).length;
  const winRate = closedCount > 0 ? Math.round((winners / closedCount) * 100) : 0;
  const openCount = trades.filter(t => t.isOpen).length;

  const remaining = daysLeft(acc?.expiresAt ?? null);
  const profitPct = acc ? Math.min(100, (Number(acc.profitToDate) / Number(acc.profitTarget)) * 100) : 0;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted text-sm">Memuat data trading...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar trader={trader} />
      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-extrabold text-2xl mb-1">Trading History</h1>
            <p className="text-muted text-sm">Riwayat semua transaksi trading kamu.</p>
          </div>
          {accounts.length > 1 && (
            <select value={selectedAccId} onChange={e => setSelectedAccId(e.target.value)}
              className="bg-surface border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-teal">
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.platformLogin} — Phase {a.phase}</option>
              ))}
            </select>
          )}
        </div>

        {/* Account Info Bar */}
        {acc && (
          <div className="bg-surface border border-white/5 rounded-2xl p-5 mb-5">
            {/* Row 1: identity + timer */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
              <span className="font-heading font-bold text-sm">{acc.platformLogin}</span>
              <span className="text-[10px] bg-teal/10 text-teal px-2 py-0.5 rounded-full font-bold">Phase {acc.phase}</span>
              <span className="text-[10px] bg-white/5 text-muted px-2 py-0.5 rounded-full">{acc.platform} · {acc.platformServer}</span>
              <div className="ml-auto flex items-center gap-3 flex-wrap justify-end">
                {/* Server time */}
                <span className="text-[10px] bg-white/5 text-muted px-2 py-0.5 rounded-full font-mono">
                  🕐 {serverTime}
                </span>
                {/* Daily reset countdown */}
                <span className="text-[10px] bg-teal/10 text-teal px-2 py-0.5 rounded-full font-mono font-bold">
                  🔄 Reset: {resetCountdown}
                </span>
                {/* Days remaining (challenge only) */}
                {acc.status !== 'FUNDED' && remaining !== null && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${remaining <= 7 ? 'bg-danger/10 text-danger' : 'bg-white/5 text-muted'}`}>
                    ⏳ {remaining} hari tersisa
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
              {[
                { label: 'Balance', value: `$${Number(acc.balance).toLocaleString()}`, sub: null },
                { label: 'Equity', value: `$${Number(acc.equity).toLocaleString()}`, sub: null },
                { label: 'Open P&L', value: `${Number(acc.openPnl) >= 0 ? '+' : ''}$${Number(acc.openPnl).toFixed(2)}`, sub: null, color: Number(acc.openPnl) >= 0 ? 'text-teal' : 'text-danger' },
                { label: 'Trading Days', value: acc.tradingDays, sub: 'hari aktif' },
                { label: 'Payout Split', value: `${acc.payoutSplit}%`, sub: 'profit share' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-[11px] text-muted uppercase tracking-widest mb-1">{item.label}</p>
                  <p className={`font-heading font-bold text-lg ${(item as {color?: string}).color ?? 'text-white'}`}>{item.value}</p>
                  {item.sub && <p className="text-[10px] text-muted">{item.sub}</p>}
                </div>
              ))}
            </div>

            {/* Row 3: risk meters */}
            <div className="border-t border-white/5 pt-4">
              <p className="text-[11px] text-muted uppercase tracking-widest mb-3">Risk Monitor</p>
              <div className="flex gap-6 flex-wrap">
                <RiskBar label="Daily Loss" used={Number(acc.dailyLossUsed)} limit={Number(acc.dailyLossLimit)} color="bg-teal" />
                <RiskBar label="Max Drawdown" used={Number(acc.maxDrawdownUsed)} limit={Number(acc.maxDrawdownLimit)} color="bg-teal" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] text-muted uppercase tracking-widest">Profit Target</span>
                    <span className="text-xs font-bold font-heading text-white">
                      ${Number(acc.profitToDate).toFixed(0)} <span className="text-muted font-normal">/ ${Number(acc.profitTarget).toFixed(0)}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-teal transition-all duration-500" style={{ width: `${profitPct}%` }} />
                  </div>
                  <p className="text-[10px] mt-1 text-muted">{profitPct.toFixed(0)}% tercapai</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Trades', value: trades.length, color: 'text-teal' },
            { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? 'text-teal' : 'text-danger' },
            { label: 'Total P&L', value: `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`, color: totalProfit >= 0 ? 'text-teal' : 'text-danger' },
            { label: 'Open Positions', value: openCount, color: 'text-gold' },
          ].map(s => (
            <div key={s.label} className="bg-surface border border-white/5 rounded-2xl p-5">
              <p className="text-[11px] text-muted uppercase tracking-widest mb-3">{s.label}</p>
              <p className={`font-heading font-extrabold text-2xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex gap-1 bg-surface border border-white/5 rounded-xl p-1">
            {(['all', 'open', 'closed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                  filter === f ? 'bg-teal text-bg' : 'text-muted hover:text-white'
                }`}>
                {f === 'all' ? 'Semua' : f === 'open' ? 'Open' : 'Closed'}
              </button>
            ))}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari simbol..."
            className="bg-surface border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
          <span className="text-xs text-muted ml-auto">{filteredTrades.length} trade ditemukan</span>
        </div>

        {/* Table */}
        <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
          {filteredTrades.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-muted text-sm">Belum ada trade.</p>
              <p className="text-muted text-xs mt-1">Trade akan muncul setelah kamu mulai trading di platform.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] text-muted uppercase tracking-wider border-b border-white/5">
                      <th className="px-5 py-4 text-left">Ticket</th>
                      <th className="px-5 py-4 text-left">Symbol</th>
                      <th className="px-5 py-4 text-left">Type</th>
                      <th className="px-5 py-4 text-right">Lots</th>
                      <th className="px-5 py-4 text-right">Open Price</th>
                      <th className="px-5 py-4 text-right">Close Price</th>
                      <th className="px-5 py-4 text-left">Open Time</th>
                      <th className="px-5 py-4 text-left">Close Time</th>
                      <th className="px-5 py-4 text-right">P&L</th>
                      <th className="px-5 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(t => (
                      <tr key={t.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 text-muted font-mono text-xs">#{t.platformTicket}</td>
                        <td className="px-5 py-3.5 font-heading font-bold">{t.symbol}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.type === 'BUY' ? 'bg-teal/10 text-teal' : 'bg-danger/10 text-danger'}`}>{t.type}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-muted">{Number(t.lots).toFixed(2)}</td>
                        <td className="px-5 py-3.5 text-right text-muted font-mono text-xs">{Number(t.openPrice).toFixed(5)}</td>
                        <td className="px-5 py-3.5 text-right text-muted font-mono text-xs">{t.closePrice ? Number(t.closePrice).toFixed(5) : '—'}</td>
                        <td className="px-5 py-3.5 text-muted text-xs">{formatDate(t.openTime)}</td>
                        <td className="px-5 py-3.5 text-muted text-xs">{formatDate(t.closeTime)}</td>
                        <td className={`px-5 py-3.5 text-right font-heading font-bold ${Number(t.profit) >= 0 ? 'text-teal' : 'text-danger'}`}>
                          {t.isOpen ? '—' : `${Number(t.profit) >= 0 ? '+' : ''}$${Number(t.profit).toFixed(2)}`}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.isOpen ? 'bg-gold/10 text-gold' : 'bg-white/5 text-muted'}`}>
                            {t.isOpen ? 'OPEN' : 'CLOSED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                  <p className="text-xs text-muted">Halaman {page} dari {totalPages} ({filteredTrades.length} trade)</p>
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-muted hover:bg-white/10 disabled:opacity-30 transition-all">← Prev</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return (
                        <button key={n} onClick={() => setPage(n)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-all ${page === n ? 'bg-teal text-bg font-bold' : 'bg-white/5 text-muted hover:bg-white/10'}`}>
                          {n}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-muted hover:bg-white/10 disabled:opacity-30 transition-all">Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </main>
    </div>
  );
}
