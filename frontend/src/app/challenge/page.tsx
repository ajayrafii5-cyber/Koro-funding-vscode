"use client";
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const CHALLENGE_DATA = {
  '2step': {
    label: '2-Step Challenge',
    desc: 'Dua fase evaluasi. Profit target lebih rendah, cocok untuk trader disiplin.',
    accounts: [
      { size: '$10K',  price: '$89',   p1: '8%', p2: '5%', daily: '5%', dd: '10%', split: '80%', leverage: '1:100' },
      { size: '$25K',  price: '$199',  p1: '8%', p2: '5%', daily: '5%', dd: '10%', split: '85%', leverage: '1:100', popular: true },
      { size: '$50K',  price: '$349',  p1: '8%', p2: '5%', daily: '5%', dd: '10%', split: '85%', leverage: '1:100' },
      { size: '$100K', price: '$599',  p1: '8%', p2: '5%', daily: '5%', dd: '10%', split: '90%', leverage: '1:100' },
    ],
  },
  '1step': {
    label: '1-Step Challenge',
    desc: 'Satu fase evaluasi. Lebih cepat funded, cocok untuk trader berpengalaman.',
    accounts: [
      { size: '$10K',  price: '$129',  p1: '10%', p2: null, daily: '4%', dd: '8%', split: '80%', leverage: '1:50' },
      { size: '$25K',  price: '$279',  p1: '10%', p2: null, daily: '4%', dd: '8%', split: '85%', leverage: '1:50', popular: true },
      { size: '$50K',  price: '$479',  p1: '10%', p2: null, daily: '4%', dd: '8%', split: '85%', leverage: '1:50' },
      { size: '$100K', price: '$849',  p1: '10%', p2: null, daily: '4%', dd: '8%', split: '90%', leverage: '1:50' },
    ],
  },
  'instant': {
    label: 'Instant Funding',
    desc: 'Langsung trading tanpa challenge. Akun funded instan setelah pembayaran.',
    accounts: [
      { size: '$10K',  price: '$249',   p1: null, p2: null, daily: '3%', dd: '6%', split: '75%', leverage: '1:30' },
      { size: '$25K',  price: '$549',   p1: null, p2: null, daily: '3%', dd: '6%', split: '80%', leverage: '1:30', popular: true },
      { size: '$50K',  price: '$949',   p1: null, p2: null, daily: '3%', dd: '6%', split: '85%', leverage: '1:30' },
      { size: '$100K', price: '$1,699', p1: null, p2: null, daily: '3%', dd: '6%', split: '90%', leverage: '1:30' },
    ],
  },
} as const;

type ChallengeType = keyof typeof CHALLENGE_DATA;

function normalizeType(raw: string | null): ChallengeType {
  if (raw === '2step' || raw === '1step' || raw === 'instant') return raw;
  return '2step';
}

function normalizeSize(raw: string | null, accounts: readonly { size: string }[]): string {
  if (!raw) return accounts[0].size;
  const match = accounts.find(a => a.size.replace('$','').replace('K','000') === raw);
  return match ? match.size : accounts[0].size;
}

export default function ChallengePage() {
  const params = useSearchParams();
  const initType = normalizeType(params.get('type'));
  const [tab, setTab] = useState<ChallengeType>(initType);
  const { accounts, label, desc } = CHALLENGE_DATA[tab];
  const initSize = normalizeSize(params.get('size'), accounts);
  const [selectedSize, setSelectedSize] = useState(initSize);

  const selected = accounts.find(a => a.size === selectedSize) ?? accounts[0];

  const rows = [
    { label: 'Phase 1 Target', value: selected.p1 ?? '—', show: true },
    { label: 'Phase 2 Target', value: (selected as any).p2 ?? '—', show: tab === '2step' },
    { label: 'Daily Loss Max',  value: selected.daily, show: true },
    { label: 'Max Drawdown',    value: selected.dd,    show: true },
    { label: 'Profit Split',    value: selected.split, show: true, highlight: true },
    { label: 'Leverage',        value: selected.leverage, show: true },
    { label: 'Platform',        value: 'MT4 / MT5 / cTrader', show: true },
    { label: 'News Trading',    value: tab === 'instant' ? 'Tidak' : 'Boleh', show: true },
  ].filter(r => r.show);

  const checkoutHref = `/checkout?type=${tab}&size=${selectedSize.replace('$','').replace('K','000')}&label=${encodeURIComponent(label)}&split=${selected.split}&leverage=${selected.leverage}`;

  return (
    <div className="min-h-screen bg-bg text-white">
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-16 py-5 bg-bg/80 backdrop-blur-xl border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 font-heading font-extrabold text-xl">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse2 shadow-teal" />
          Koro Funding
        </Link>
        <Link href="/" className="text-sm text-muted hover:text-white transition-colors">← Kembali</Link>
      </nav>

      <div className="pt-28 pb-24 px-6 md:px-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-3">Beli Challenge</p>
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-3">Pilih Paket Anda</h1>
          <p className="text-muted text-base max-w-md mx-auto">Satu langkah menuju akun funded.</p>
        </div>

        <div className="flex gap-2 justify-center mb-10 flex-wrap">
          {(Object.keys(CHALLENGE_DATA) as ChallengeType[]).map(k => (
            <button key={k} onClick={() => { setTab(k); setSelectedSize(CHALLENGE_DATA[k].accounts[0].size); }}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-all ${tab === k ? 'bg-teal/10 border-teal text-teal' : 'bg-surface border-white/5 text-muted hover:text-white hover:border-white/10'}`}>
              {CHALLENGE_DATA[k].label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <p className="text-xs text-muted uppercase tracking-widest mb-4 font-semibold">{label} — {desc}</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {accounts.map((a) => (
                <button key={a.size} onClick={() => setSelectedSize(a.size)}
                  className={`relative p-4 rounded-xl border text-left transition-all ${selectedSize === a.size ? 'border-teal bg-teal/10' : 'border-white/5 bg-surface hover:border-white/10'}`}>
                  {a.popular && <span className="absolute top-2 right-2 text-[9px] bg-teal text-bg font-bold px-2 py-0.5 rounded-full">POPULAR</span>}
                  <div className={`font-heading font-extrabold text-xl mb-0.5 ${selectedSize === a.size ? 'text-teal' : 'text-white'}`}>{a.size}</div>
                  <div className="text-sm text-muted">Account Size</div>
                  <div className="font-heading font-bold text-lg text-white mt-2">{a.price}</div>
                </button>
              ))}
            </div>
            <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <p className="text-xs font-semibold text-muted uppercase tracking-widest">Aturan Challenge</p>
              </div>
              {rows.map((r, i) => (
                <div key={i} className={`flex justify-between items-center px-5 py-3.5 border-b border-white/5 last:border-0 ${i % 2 !== 0 ? 'bg-white/[0.01]' : ''}`}>
                  <span className="text-sm text-muted">{r.label}</span>
                  <span className={`text-sm font-medium ${r.highlight ? 'text-teal font-bold' : 'text-white'}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-white/5 rounded-2xl p-6 sticky top-28">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-5">Ringkasan Pesanan</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted">{label}</span>
              <span className="text-sm text-white font-medium">{selected.size} Account</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted">Profit Split</span>
              <span className="text-sm text-teal font-bold">{selected.split}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-muted">Leverage</span>
              <span className="text-sm text-white">{selected.leverage}</span>
            </div>
            <div className="border-t border-white/5 pt-5 mb-2 flex justify-between items-center">
              <span className="font-heading font-bold text-base">Total</span>
              <div className="text-right">
                <span className="line-through text-muted text-sm mr-2">{selected.price}</span>
                <span className="font-heading font-extrabold text-3xl text-teal">$0</span>
              </div>
            </div>
            <p className="text-xs text-teal mb-5">Mode percobaan — transaksi gratis</p>
            <Link href={checkoutHref} className="w-full block text-center bg-teal text-bg font-heading font-bold py-4 rounded-xl text-base hover:shadow-teal transition-all hover:-translate-y-0.5 mb-3">
              Bayar Sekarang →
            </Link>
            <p className="text-center text-xs text-muted">Pembayaran aman • Biaya dikembalikan saat payout pertama</p>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[{icon:'🔒',label:'Secure Pay'},{icon:'⚡',label:'Instan Aktif'},{icon:'💸',label:'Fee Refund'}].map(b => (
                <div key={b.label} className="bg-bg rounded-xl p-3 border border-white/5">
                  <div className="text-lg mb-1">{b.icon}</div>
                  <div className="text-[10px] text-muted">{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
