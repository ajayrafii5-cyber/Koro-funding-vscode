'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const TYPE_MAP: Record<string, string> = {
  '2step':   'CHALLENGE_2STEP',
  '1step':   'CHALLENGE_1STEP',
  'instant': 'INSTANT_FUNDING',
};
const PRICES_CENTS: Record<string, Record<string, number>> = {
  CHALLENGE_2STEP:  { '5000': 2500, '10000': 4500, '25000': 10900, '50000': 17900, '100000': 32900, '200000': 64900 },
  CHALLENGE_1STEP:  { '5000': 3500, '10000': 6500, '25000': 14900, '50000': 24900, '100000': 44900, '200000': 87900 },
  INSTANT_FUNDING:  { '5000': 4500, '10000': 8500, '25000': 18900, '50000': 31900, '100000': 57900, '200000': 109900 },
};
function fmt(cents: number) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 });
}

// ─── Inner form (butuh Elements context) ──────────────────────────────────────
function PaymentForm({ orderId, finalPrice }: { orderId: string; finalPrice: number }) {
  const stripe   = useStripe();
  const elements = useElements();
  const router   = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError]   = useState('');

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true);
    setError('');
    const { error: stripeErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
      },
    });
    if (stripeErr) {
      setError(stripeErr.message ?? 'Pembayaran gagal');
      setPaying(false);
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        onClick={handlePay}
        disabled={!stripe || paying}
        className="w-full py-4 rounded-2xl font-bold text-background bg-teal hover:bg-teal/80 disabled:opacity-50 transition-all text-base"
      >
        {paying ? 'Memproses...' : `Bayar ${fmt(finalPrice)}`}
      </button>
    </div>
  );
}

// ─── Main checkout page ────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const type     = params.get('type') ?? '2step';
  const size     = params.get('size') ?? '10000';
  const label    = params.get('label') ?? '2-Step Challenge';
  const split    = params.get('split') ?? '80%';
  const leverage = params.get('leverage') ?? '1:100';

  const challengeType  = TYPE_MAP[type] ?? 'CHALLENGE_2STEP';
  const basePriceCents = PRICES_CENTS[challengeType]?.[size] ?? 0;

  const [form, setForm]           = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors]       = useState({} as Record<string, string>);
  const [refCode, setRefCode]     = useState('');
  const [refStatus, setRefStatus] = useState<'idle'|'checking'|'valid'|'invalid'>('idle');
  const [discountRate, setDiscountRate] = useState(0);
  const [agreedTerms, setAgreedTerms]   = useState(false);

  // Step: 'form' | 'payment'
  const [step, setStep]           = useState<'form'|'payment'>('form');
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId]     = useState('');
  const [finalPriceCents, setFinalPriceCents] = useState(basePriceCents);
  const [discountCents, setDiscountCents]     = useState(0);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
      router.replace('/auth/login');
      return;
    }
    const urlRef = params.get('refCode') ?? params.get('ref');
    if (urlRef) { setRefCode(urlRef); handleValidateRef(urlRef); }
  }, []);

  async function handleValidateRef(code?: string) {
    const c = (code ?? refCode).trim();
    if (!c) return;
    setRefStatus('checking');
    try {
      const r = await fetch(`${API}/affiliate/validate/${c}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const d = await r.json();
      if (d.valid) { setRefStatus('valid'); setDiscountRate(d.discount ?? 0); }
      else { setRefStatus('invalid'); setDiscountRate(0); }
    } catch { setRefStatus('invalid'); setDiscountRate(0); }
  }

  function validateForm() {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = 'Nama wajib diisi';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Email tidak valid';
    if (!form.phone.trim()) e.phone = 'Nomor HP wajib diisi';
    if (!agreedTerms)       e.terms = 'Kamu harus menyetujui syarat & ketentuan';
    return e;
  }

  async function handleProceedToPayment() {
    const e = validateForm();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${API}/orders/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          challengeType,
          accountSize: Number(size),
          refCode: refStatus === 'valid' ? refCode.trim().toUpperCase() : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Gagal membuat order');
      setClientSecret(json.clientSecret);
      setOrderId(json.orderId);
      setFinalPriceCents(Math.round(json.finalPrice * 100));
      setDiscountCents(Math.round(json.discount * 100));
      setStep('payment');
    } catch (err: any) {
      setErrors({ submit: err.message });
    } finally { setLoading(false); }
  }

  const displayDiscount = fmt(Math.round(basePriceCents * discountRate));
  const displayFinal    = fmt(Math.round(basePriceCents * (1 - discountRate)));

  const stripeOptions = clientSecret ? {
    clientSecret,
    appearance: { theme: 'night' as const, variables: { colorPrimary: '#2DD4BF' } },
  } : undefined;

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT — Order summary */}
        <div className="space-y-6">
          <Link href="/challenge" className="text-muted text-sm hover:text-white transition-colors">← Kembali</Link>
          <div className="rounded-2xl border border-white/10 bg-surface p-6 space-y-4">
            <h2 className="font-bold text-white text-lg">{label}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Ukuran akun</span>
                <span className="text-white">${Number(size).toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Profit split</span>
                <span className="text-white">{split}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Leverage</span>
                <span className="text-white">{leverage}</span>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Harga asli</span>
                <span>{fmt(basePriceCents)}</span>
              </div>
              {discountRate > 0 && (
                <div className="flex justify-between text-teal">
                  <span>Diskon ({Math.round(discountRate * 100)}%)</span>
                  <span>-{displayDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-base pt-1 border-t border-white/10">
                <span>Total</span>
                <span>{step === 'payment' ? fmt(finalPriceCents) : displayFinal}</span>
              </div>
            </div>
          </div>

          {/* T&C */}
          {step === 'form' && (
            <div className="rounded-2xl border border-white/10 bg-surface p-6 space-y-3 text-xs text-muted">
              <p className="font-semibold text-white text-sm">Syarat & Ketentuan</p>
              <p>Dengan melanjutkan, kamu setuju bahwa ini adalah layanan digital yang dikirim segera setelah akun dibuat. Nama harus sesuai dengan KTP/Paspor.</p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 accent-teal" />
                <span>Saya telah membaca dan menyetujui <Link href="/legal" className="text-teal hover:underline">Syarat & Ketentuan</Link> Koro Funding.</span>
              </label>
              {errors.terms && <p className="text-red-400">{errors.terms}</p>}
            </div>
          )}
        </div>

        {/* RIGHT — Form / Payment */}
        <div className="rounded-2xl border border-white/10 bg-surface p-6 space-y-6">
          {step === 'form' ? (
            <>
              <h2 className="font-bold text-white text-lg">Data Diri</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider block mb-2">Nama Lengkap</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Ahmad Zaeni Rafii"
                    className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider block mb-2">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="kamu@email.com"
                    className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider block mb-2">Nomor HP / WhatsApp</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="+62 812 3456 7890"
                    className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>
                {/* Kode Promo */}
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-2">Kode Promo (Opsional)</p>
                  <div className="flex gap-2">
                    <input type="text" value={refCode}
                      onChange={e => { setRefCode(e.target.value); setRefStatus('idle'); setDiscountRate(0); }}
                      placeholder="Masukkan kode promo..."
                      className={`flex-1 bg-bg border rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none transition-colors ${
                        refStatus === 'valid' ? 'border-teal' : refStatus === 'invalid' ? 'border-red-500' : 'border-white/10 focus:border-teal'
                      }`} />
                    <button onClick={() => handleValidateRef()}
                      disabled={!refCode.trim() || refStatus === 'checking'}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-muted hover:text-white hover:bg-white/10 transition-all disabled:opacity-40">
                      {refStatus === 'checking' ? '...' : 'Pakai'}
                    </button>
                  </div>
                  {refStatus === 'valid' && <p className="text-teal text-xs mt-2">✅ Kode valid! Diskon {Math.round(discountRate * 100)}%</p>}
                  {refStatus === 'invalid' && <p className="text-red-400 text-xs mt-2">❌ Kode tidak valid</p>}
                </div>
              </div>
              {errors.submit && <p className="text-red-400 text-sm">{errors.submit}</p>}
              <button onClick={handleProceedToPayment} disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-background bg-teal hover:bg-teal/80 disabled:opacity-50 transition-all text-base">
                {loading ? 'Memproses...' : 'Lanjut ke Pembayaran →'}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => setStep('form')} className="text-muted hover:text-white text-sm transition-colors">← Edit data</button>
                <h2 className="font-bold text-white text-lg">Pembayaran</h2>
              </div>
              {clientSecret && stripeOptions && (
                <Elements stripe={stripePromise} options={stripeOptions}>
                  <PaymentForm orderId={orderId} finalPrice={finalPriceCents} />
                </Elements>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
