"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const TYPE_MAP: Record<string, string> = {
  '2step':   'CHALLENGE_2STEP',
  '1step':   'CHALLENGE_1STEP',
  'instant': 'INSTANT_FUNDING',
};

const PRICES: Record<string, Record<string, string>> = {
  CHALLENGE_2STEP:  { '10000': '$149', '25000': '$299', '50000': '$499', '100000': '$899', '200000': '$1,499' },
  CHALLENGE_1STEP:  { '10000': '$199', '25000': '$399', '50000': '$699', '100000': '$1,199', '200000': '$1,999' },
  INSTANT_FUNDING:  { '10000': '$249', '25000': '$499', '50000': '$899', '100000': '$1,499', '200000': '$2,499' },
};

export default function CheckoutPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const type     = params.get('type') ?? '2step';
  const size     = params.get('size') ?? '10000';
  const label    = params.get('label') ?? '2-Step Challenge';
  const split    = params.get('split') ?? '80%';
  const leverage = params.get('leverage') ?? '1:100';

  const displaySize  = '$' + parseInt(size).toLocaleString();
  const challengeType = TYPE_MAP[type] ?? 'CHALLENGE_2STEP';
  const displayPrice  = PRICES[challengeType]?.[size] ?? '-';

  const [form, setForm]       = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({} as Record<string, string>);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.replace('/auth/login');
    }
  }, [router]);

  function validate() {
    const e = {} as Record<string, string>;
    if (!form.name.trim())  e.name  = 'Nama wajib diisi';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Email tidak valid';
    if (!form.phone.trim()) e.phone = 'Nomor HP wajib diisi';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');

      const orderRes = await fetch('http://localhost:4000/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          challengeType,
          accountSize: parseInt(size),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Gagal membuat order');

      // Redirect ke halaman pembayaran Stripe
      window.location.href = orderData.data.paymentUrl;

    } catch (err: any) {
      setErrors({ submit: err.message || 'Terjadi kesalahan, coba lagi.' });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-16 py-5 bg-bg/80 backdrop-blur-xl border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 font-heading font-extrabold text-xl">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse2 shadow-teal" />
          Koro Funding
        </Link>
        <Link href={"/challenge?type=" + type + "&size=" + size} className="text-sm text-muted hover:text-white transition-colors">← Kembali</Link>
      </nav>
      <div className="pt-28 pb-24 px-6 md:px-16 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-3">Checkout</h1>
          <p className="text-muted text-base">Lengkapi data di bawah lalu lanjutkan ke pembayaran.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="bg-surface border border-white/5 rounded-2xl p-6">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-6">Data Diri</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Nama Lengkap</label>
                <input type="text" placeholder="Ahmad Rizky" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Email</label>
                <input type="email" placeholder="kamu@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Nomor HP / WhatsApp</label>
                <input type="tel" placeholder="+62 812 3456 7890" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
            {errors.submit && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-xs">{errors.submit}</p>
              </div>
            )}
            <div className="mt-6 p-4 bg-teal/5 border border-teal/10 rounded-xl">
              <p className="text-xs text-teal font-semibold mb-1">💳 Pembayaran Aman via Stripe</p>
              <p className="text-xs text-muted">Kartu kredit/debit internasional diterima. Data kamu dienkripsi.</p>
            </div>
          </div>
          <div className="bg-surface border border-white/5 rounded-2xl p-6 sticky top-28">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-5">Ringkasan Pesanan</p>
            {[{l:'Tipe Challenge',v:label},{l:'Ukuran Akun',v:displaySize},{l:'Profit Split',v:split},{l:'Leverage',v:leverage}].map(r => (
              <div key={r.l} className="flex justify-between items-center mb-3">
                <span className="text-sm text-muted">{r.l}</span>
                <span className="text-sm text-white font-medium">{r.v}</span>
              </div>
            ))}
            <div className="border-t border-white/5 pt-5 mt-3 mb-6 flex justify-between items-center">
              <span className="font-heading font-bold">Total</span>
              <span className="font-heading font-extrabold text-3xl text-teal">{displayPrice}</span>
            </div>
            <button onClick={handleSubmit} disabled={loading} className="w-full bg-teal text-bg font-heading font-bold py-4 rounded-xl text-base hover:shadow-teal transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? '⏳ Mengarahkan ke pembayaran...' : 'Bayar Sekarang →'}
            </button>
            <p className="text-center text-xs text-muted mt-3">Kamu akan diarahkan ke halaman pembayaran Stripe.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
