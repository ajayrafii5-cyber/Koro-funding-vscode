'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token') ?? '';

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (!token) router.replace('/auth/forgot-password');
  }, [token, router]);

  async function handleSubmit() {
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (password !== confirm) { setError('Password tidak cocok.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal reset password.'); return; }
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="min-h-screen bg-bg text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center text-4xl mb-6 mx-auto">✅</div>
        <h1 className="font-heading font-extrabold text-3xl mb-3">Password Berhasil Diubah!</h1>
        <p className="text-muted text-sm mb-6">Kamu akan diarahkan ke halaman login dalam 3 detik...</p>
        <Link href="/auth/login" className="text-teal text-sm hover:underline">Login Sekarang</Link>
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
          <h1 className="font-heading font-extrabold text-3xl mt-4 mb-2">Buat Password Baru</h1>
          <p className="text-muted text-sm">Masukkan password baru kamu di bawah.</p>
        </div>
        <div className="bg-surface border border-white/5 rounded-2xl p-8">
          <div className="mb-4">
            <label className="text-xs text-muted uppercase tracking-wider block mb-2">Password Baru</label>
            <input
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors"
            />
          </div>
          <div className="mb-4">
            <label className="text-xs text-muted uppercase tracking-wider block mb-2">Konfirmasi Password</label>
            <input
              type="password"
              placeholder="Ulangi password baru"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-teal text-bg font-heading font-bold py-3 rounded-xl text-sm hover:shadow-teal transition-all disabled:opacity-60"
          >
            {loading ? 'Menyimpan...' : 'Simpan Password Baru →'}
          </button>
          <p className="text-center text-xs text-muted mt-4">
            <Link href="/auth/login" className="text-teal hover:underline">Kembali ke Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
