'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit() {
    if (!email.trim() || !email.includes('@')) { setError('Email tidak valid.'); return; }
    setError('');
    setLoading(true);
    try {
      await fetch('http://localhost:4000/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) return (
    <div className="min-h-screen bg-bg text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center text-4xl mb-6 mx-auto">📧</div>
        <h1 className="font-heading font-extrabold text-3xl mb-3">Cek Email Kamu</h1>
        <p className="text-muted text-sm mb-6">Jika email <strong className="text-white">{email}</strong> terdaftar, link reset password sudah dikirim. Berlaku 1 jam.</p>
        <Link href="/auth/login" className="text-teal text-sm hover:underline">Kembali ke Login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-heading font-extrabold text-xl mb-6 justify-center">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse2" />Koro Funding
          </Link>
          <h1 className="font-heading font-extrabold text-3xl mt-4 mb-2">Lupa Password?</h1>
          <p className="text-muted text-sm">Masukkan email kamu dan kami akan kirim link reset.</p>
        </div>
        <div className="bg-surface border border-white/5 rounded-2xl p-8">
          <label className="text-xs text-muted uppercase tracking-wider block mb-2">Email</label>
          <input
            type="email"
            placeholder="kamu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors mb-4"
          />
          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-teal text-bg font-heading font-bold py-3 rounded-xl text-sm hover:shadow-teal transition-all disabled:opacity-60"
          >
            {loading ? 'Mengirim...' : 'Kirim Link Reset →'}
          </button>
          <p className="text-center text-xs text-muted mt-4">
            Ingat password? <Link href="/auth/login" className="text-teal hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
