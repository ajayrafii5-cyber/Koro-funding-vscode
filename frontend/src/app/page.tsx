'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── CHALLENGE DATA ───────────────────────────────────────
const CHALLENGE_DATA = {
  '2step': {
    label: '2-Step Challenge',
    accounts: [
      { size: '$10K', price: '$45',  p1: '8%', p2: '5%', daily: '5%', dd: '10%', split: '80%', leverage: '1:100' },
      { size: '$25K', price: '$109', p1: '8%', p2: '5%', daily: '5%', dd: '10%', split: '85%', leverage: '1:100', popular: true },
      { size: '$50K', price: '$179', p1: '8%', p2: '5%', daily: '5%', dd: '10%', split: '85%', leverage: '1:100' },
      { size: '$100K',price: '$599', p1: '8%', p2: '5%', daily: '5%', dd: '10%', split: '90%', leverage: '1:100' },
    ],
  },
  '1step': {
    label: '1-Step Challenge',
    accounts: [
      { size: '$10K', price: '$65', p1: '10%', daily: '4%', dd: '8%', split: '80%', leverage: '1:50' },
      { size: '$25K', price: '$149', p1: '10%', daily: '4%', dd: '8%', split: '85%', leverage: '1:50', popular: true },
      { size: '$50K', price: '$85', p1: '10%', daily: '4%', dd: '8%', split: '85%', leverage: '1:50' },
      { size: '$100K',price: '$449', p1: '10%', daily: '4%', dd: '8%', split: '90%', leverage: '1:50' },
    ],
  },
  'instant': {
    label: 'Instant Funding',
    accounts: [
      { size: '$10K', price: '$85',  p1: 'N/A', daily: '3%', dd: '6%', split: '75%', leverage: '1:30' },
      { size: '$25K', price: '$189',  p1: 'N/A', daily: '3%', dd: '6%', split: '80%', leverage: '1:30', popular: true },
      { size: '$50K', price: '$319',  p1: 'N/A', daily: '3%', dd: '6%', split: '85%', leverage: '1:30' },
      { size: '$100K',price: '$579',p1: 'N/A', daily: '3%', dd: '6%', split: '90%', leverage: '1:30' },
    ],
  },
} as const;

const PAYOUTS = [
  { flag:'🇮🇩', name:'Andi R.', amount:'+$1,840', time:'2 mnt lalu' },
  { flag:'🇲🇾', name:'Hafiz M.', amount:'+$3,200', time:'5 mnt lalu' },
  { flag:'🇸🇬', name:'Kevin T.', amount:'+$560',   time:'12 mnt lalu' },
  { flag:'🇵🇭', name:'Maria C.', amount:'+$2,100', time:'18 mnt lalu' },
  { flag:'🇮🇩', name:'Rizky D.', amount:'+$4,500', time:'25 mnt lalu' },
  { flag:'🇹🇭', name:'Somchai P.',amount:'+$1,200', time:'31 mnt lalu' },
  { flag:'🇮🇩', name:'Dini W.', amount:'+$780',   time:'45 mnt lalu' },
  { flag:'🇲🇾', name:'Farid A.', amount:'+$6,000', time:'1 jam lalu' },
];

const FAQS = [
  { q: 'Apakah biaya challenge bisa di-refund?', a: 'Ya. Jika Anda berhasil lulus challenge dan diverifikasi sebagai trader funded, biaya challenge dikembalikan penuh pada payout pertama. Lihat Refund Policy kami untuk detail lengkap.' },
  { q: 'Berapa lama proses payout?', a: '1x24 jam kerja setelah request disetujui. Metode: transfer bank, Wise, atau USDT.' },
  { q: 'Platform trading apa yang didukung?', a: 'MetaTrader 4, MetaTrader 5, dan cTrader. Kredensial dikirim otomatis ke email setelah pembayaran dikonfirmasi.' },
  { q: 'Apakah boleh trading saat news?', a: 'Diperbolehkan di semua tipe kecuali Instant Funding. Semua aturan tertera di halaman Terms of Service.' },
  { q: 'Berapa maksimum akun yang bisa dimiliki?', a: 'Hingga 3 akun funded aktif secara bersamaan, total maksimum $400,000.' },
];

// ─── COMPONENTS ───────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-16 py-5 transition-all ${scrolled ? 'bg-bg/80 backdrop-blur-xl border-b border-white/5' : ''}`}>
      <Link href="/" className="flex items-center gap-2 font-heading font-extrabold text-xl">
        <span className="w-2 h-2 rounded-full bg-teal animate-pulse2 shadow-teal" />
        Koro Funding
      </Link>
      <div className="hidden md:flex items-center gap-8 text-sm text-muted">
        <Link href="#challenge" className="hover:text-white transition-colors">Challenge</Link>
        <Link href="#dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
        <Link href="/legal" className="hover:text-white transition-colors">Legal</Link>
        <Link href="/dashboard" className="bg-teal text-bg font-heading font-bold px-5 py-2 rounded-lg text-sm hover:shadow-teal transition-all hover:-translate-y-0.5">Mulai Sekarang</Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: 'linear-gradient(rgba(0,212,200,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,200,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)',
      }} />
      {/* Glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,200,0.10) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-2 bg-teal/10 border border-teal/20 rounded-full px-4 py-1.5 text-teal text-xs font-semibold mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse2" />
          Platform Prop Firm Terpercaya 2026
        </div>

        <h1 className="font-heading font-extrabold text-5xl md:text-7xl lg:text-8xl leading-none tracking-tight mb-6">
          Trade Smart.<br />
          <span className="text-teal">Get Funded.</span><br />
          <span className="text-gold">Keep 90%.</span>
        </h1>

        <p className="text-muted text-lg md:text-xl max-w-xl leading-relaxed mb-10">
          Buktikan skill trading Anda melalui challenge kami dan dapatkan akun funded hingga <strong className="text-white">$200,000</strong>. Tanpa risiko modal pribadi.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="#challenge" className="bg-teal text-bg font-heading font-bold px-8 py-4 rounded-xl hover:shadow-teal transition-all hover:-translate-y-1 text-base">
            Mulai Challenge →
          </Link>
          <Link href="/dashboard" className="border border-white/10 text-white font-heading font-semibold px-8 py-4 rounded-xl hover:border-teal hover:text-teal transition-all text-base">
            Lihat Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden w-full max-w-2xl border border-white/5">
          {[
            { val: '$3.2M+', lbl: 'Total Payout' },
            { val: '2,400+', lbl: 'Trader Aktif' },
            { val: '90%',    lbl: 'Profit Split', gold: true },
            { val: '24h',    lbl: 'Proses Payout' },
          ].map(s => (
            <div key={s.lbl} className="bg-surface px-6 py-5 text-left">
              <div className={`font-heading font-extrabold text-2xl ${s.gold ? 'text-gold' : 'text-teal'}`}>{s.val}</div>
              <div className="text-muted text-xs uppercase tracking-widest mt-1">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n:'01', icon:'🎯', title:'Pilih & Beli Challenge', desc:'Pilih ukuran akun dari $5K–$200K. Bayar biaya sekali, mulai trading tanpa risiko modal.' },
    { n:'02', icon:'📈', title:'Buktikan Skill Anda', desc:'Capai target profit sambil mematuhi aturan risk management. Dashboard real-time memantau semua metrik.' },
    { n:'03', icon:'💸', title:'Terima Payout', desc:'Lulus → KYC → akun funded aktif. Minta payout kapan saja dengan profit split hingga 90%.' },
  ];
  return (
    <section className="px-6 md:px-16 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-3">Cara Kerja</p>
          <h2 className="font-heading font-extrabold text-4xl md:text-5xl">3 Langkah Menuju Akun Funded</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
          {steps.map(s => (
            <div key={s.n} className="bg-surface p-10 relative group hover:bg-surface2 transition-colors">
              <div className="absolute top-5 right-6 font-heading font-extrabold text-6xl text-teal/5 group-hover:text-teal/10 transition-colors">{s.n}</div>
              <div className="w-12 h-12 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-2xl mb-6">{s.icon}</div>
              <h3 className="font-heading font-bold text-lg mb-3">{s.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PayoutTicker() {
  const doubled = [...PAYOUTS, ...PAYOUTS];
  return (
    <div className="border-y border-white/5 py-6 overflow-hidden">
      <p className="text-center text-xs text-muted uppercase tracking-widest mb-5">💰 Live Payout Feed</p>
      <div className="flex gap-4 animate-ticker w-max">
        {doubled.map((p, i) => (
          <div key={i} className="flex items-center gap-3 bg-surface border border-white/5 rounded-xl px-4 py-3 flex-shrink-0">
            <span className="text-xl">{p.flag}</span>
            <div>
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted">{p.time}</div>
            </div>
            <div className="text-teal font-heading font-bold text-sm ml-2">{p.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChallengeTable() {
  const [tab, setTab] = useState<keyof typeof CHALLENGE_DATA>('2step');
  const { accounts } = CHALLENGE_DATA[tab];
  const rows2Step = [
    { label: 'Harga',          key: 'price' },
    { label: 'Phase 1 Target', key: 'p1' },
    { label: 'Phase 2 Target', key: 'p2', only2: true },
    { label: 'Daily Loss Max', key: 'daily' },
    { label: 'Max Drawdown',   key: 'dd' },
    { label: 'Profit Split',   key: 'split' },
    { label: 'Leverage',       key: 'leverage' },
  ];

  return (
    <section id="challenge" className="px-6 md:px-16 py-24 bg-bg2">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-3">Pilih Challenge</p>
          <h2 className="font-heading font-extrabold text-4xl md:text-5xl">Mulai dengan Modal yang Tepat</h2>
          <p className="text-muted mt-3">Semua tipe challenge. Satu tujuan: akun funded.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center mb-10 flex-wrap">
          {(Object.keys(CHALLENGE_DATA) as Array<keyof typeof CHALLENGE_DATA>).map(k => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                tab === k ? 'bg-teal/10 border-teal text-teal' : 'bg-surface border-white/5 text-muted hover:text-white hover:border-white/10'
              }`}>
              {CHALLENGE_DATA[k].label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden border border-white/5">
          {/* Header */}
          <div className="grid grid-cols-5 bg-surface border-b border-white/5">
            <div className="p-4 text-xs text-muted font-semibold uppercase tracking-wider" />
            {accounts.map((a, i) => (
              <div key={i} className={`p-4 text-center relative ${a.popular ? 'bg-teal/5' : ''}`}>
                {a.popular && (
                  <span className="absolute top-2 right-2 text-[9px] bg-teal text-bg font-bold px-2 py-0.5 rounded-full tracking-wider">POPULAR</span>
                )}
                <div className={`font-heading font-extrabold text-lg ${a.popular ? 'text-teal' : 'text-white'}`}>{a.size}</div>
                <div className="text-xs text-muted mt-0.5">Account Size</div>
              </div>
            ))}
          </div>
          {/* Rows */}
          {rows2Step.filter(r => !r.only2 || tab === '2step').map((row, ri) => (
            <div key={ri} className={`grid grid-cols-5 border-b border-white/5 last:border-0 ${ri % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
              <div className="p-4 text-xs text-muted">{row.label}</div>
              {accounts.map((a: any, i) => (
                <div key={i} className={`p-4 text-center text-sm font-medium ${a.popular ? 'bg-teal/[0.03]' : ''} ${row.key === 'split' ? 'text-teal font-bold' : 'text-white'}`}>
                  {a[row.key] ?? '—'}
                </div>
              ))}
            </div>
          ))}
          {/* CTA Row */}
          <div className="grid grid-cols-5 bg-surface p-4 gap-3">
            <div className="text-xs text-muted flex items-center">Beli Sekarang</div>
            {accounts.map((a, i) => (
              <Link key={i} href={`/challenge?type=${tab}&size=${a.size.replace('$','').replace('K','000')}`}
                className={`text-center py-2.5 rounded-lg text-sm font-heading font-bold transition-all ${
                  a.popular ? 'bg-teal text-bg hover:shadow-teal hover:-translate-y-0.5' : 'border border-white/10 text-white hover:border-teal hover:text-teal'
                }`}>
                {a.price}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const [equity, setEquity] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); setEquity(25610); }, []);
  useEffect(() => {
    const t = setInterval(() => setEquity(v => v + Math.round((Math.random() - 0.4) * 50)), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="dashboard" className="px-6 md:px-16 py-24">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-3">Trader Dashboard</p>
          <h2 className="font-heading font-extrabold text-4xl md:text-5xl mb-5">Pantau Semua<br />Metrik Real-Time</h2>
          <p className="text-muted text-base leading-relaxed mb-8">Dashboard canggih kami memberikan visibilitas penuh terhadap performa trading — dari balance, equity, hingga batas loss harian.</p>
          <ul className="space-y-3 mb-8">
            {['Update balance & equity secara real-time','Progress bar visual untuk daily & max loss','Grafik pertumbuhan akun interaktif','Notifikasi push mendekati batas loss','Satu klik untuk request payout'].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-muted">
                <span className="text-teal font-bold">→</span>{f}
              </li>
            ))}
          </ul>
          <Link href="/dashboard" className="inline-block bg-teal text-bg font-heading font-bold px-6 py-3 rounded-xl hover:shadow-teal transition-all hover:-translate-y-0.5">
            Buka Dashboard →
          </Link>
        </div>

        {/* Live Dashboard Card */}
        <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs text-muted mb-1">Account #KF-28471</p>
              <p className="font-heading font-extrabold text-2xl">$25,840.00</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs bg-teal/10 text-teal border border-teal/20 rounded-full px-3 py-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse2" />Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { lbl:'Equity', val: `$${equity.toLocaleString()}`, color:'text-teal' },
              { lbl:'Profit Today', val:'+$340', color:'text-teal' },
              { lbl:'Daily Loss', val:'$210/$500', color:'text-gold' },
              { lbl:'Max DD Used', val:'$540/$2,500', color:'text-teal' },
            ].map(m => (
              <div key={m.lbl} className="bg-bg rounded-xl p-3.5 border border-white/5">
                <p className="text-[11px] text-muted uppercase tracking-wider mb-2">{m.lbl}</p>
                <p className={`font-heading font-bold text-lg ${m.color}`}>{m.val}</p>
              </div>
            ))}
          </div>

          {[
            { lbl:'Profit Target', pct:33, color:'bg-teal', val:'$840 / $2,500' },
            { lbl:'Daily Loss Limit', pct:42, color:'bg-gold', val:'42%' },
            { lbl:'Max Drawdown', pct:22, color:'bg-teal', val:'22%' },
          ].map(p => (
            <div key={p.lbl} className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted">{p.lbl}</span>
                <span className={p.color === 'bg-teal' ? 'text-teal' : 'text-gold'}>{p.val}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${p.color} progress-fill`} style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="px-6 md:px-16 py-24 bg-bg2">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="font-heading font-extrabold text-4xl">Pertanyaan Umum</h2>
        </div>
        <div className="space-y-0">
          {FAQS.map((f, i) => (
            <div key={i} className="border-b border-white/5">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full py-5 flex justify-between items-center text-left gap-6 group">
                <span className="font-heading font-semibold text-base group-hover:text-teal transition-colors">{f.q}</span>
                <span className={`w-7 h-7 border border-white/10 rounded-full flex items-center justify-center flex-shrink-0 text-teal transition-all ${open === i ? 'rotate-45 bg-teal/10' : ''}`}>+</span>
              </button>
              {open === i && <p className="pb-5 text-sm text-muted leading-relaxed">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-6 py-32 text-center relative overflow-hidden">
      <div className="absolute w-[700px] h-[700px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,200,0.08) 0%, transparent 60%)' }} />
      <div className="relative z-10">
        <p className="text-teal text-xs font-semibold uppercase tracking-widest mb-4">Siap Memulai?</p>
        <h2 className="font-heading font-extrabold text-5xl md:text-6xl mb-5">
          Trader Terbaik<br /><span className="text-teal">Tidak Menunggu.</span>
        </h2>
        <p className="text-muted text-lg max-w-md mx-auto mb-10 leading-relaxed">Bergabung dengan ribuan trader yang sudah mendapat payout dari Koro Funding.</p>
        <Link href="#challenge" className="inline-block bg-teal text-bg font-heading font-bold px-10 py-4 rounded-xl text-lg hover:shadow-teal transition-all hover:-translate-y-1">
          Pilih Challenge Sekarang →
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 md:px-16 py-16">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 font-heading font-extrabold text-lg mb-4">
            <span className="w-2 h-2 rounded-full bg-teal" />Koro Funding
          </div>
          <p className="text-sm text-muted leading-relaxed">Platform prop trading terpercaya untuk trader Asia Tenggara.</p>
        </div>
        {[
          { title:'Challenge', links:[['2-Step Challenge','/challenge?type=2step'],['1-Step Challenge','/challenge?type=1step'],['Instant Funding','/challenge?type=instant']] },
          { title:'Perusahaan', links:[['Tentang Kami','/about'],['Blog','/blog'],['Afiliasi','/affiliate'],['Karir','/career']] },
          { title:'Legal', links:[['Terms of Service','/legal#tos'],['Refund Policy','/legal#refund'],['Privacy Policy','/legal#privacy'],['Risk Disclosure','/legal#risk']] },
        ].map(col => (
          <div key={col.title}>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="text-sm text-muted hover:text-teal transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-5xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted">
        <span>© 2026 Koro Funding. All rights reserved.</span>
        <span>⚠️ Trading forex mengandung risiko tinggi. Prop firm bukan layanan keuangan berlisensi.</span>
      </div>
    </footer>
  );
}

// ─── PAGE ─────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <HowItWorks />
      <PayoutTicker />
      <ChallengeTable />
      <DashboardPreview />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}
