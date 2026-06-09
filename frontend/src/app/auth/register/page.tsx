'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', country: 'ID' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!form.fullName || !form.email || !form.password) { setError('Semua field wajib diisi.'); return; }
    if (form.password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registrasi gagal.'); setLoading(false); return; }
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('trader', JSON.stringify(data.trader));
      router.push('/challenge');
    } catch {
      setError('Gagal terhubung ke server.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg text-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-heading font-extrabold text-xl mb-6">
            <span className="w-2 h-2 rounded-full bg-teal animate-pulse2 shadow-teal" />
            Koro Funding
          </Link>
          <h1 className="font-heading font-extrabold text-3xl mb-2">Daftar</h1>
          <p className="text-muted text-sm">Sudah punya akun? <Link href="/auth/login" className="text-teal hover:underline">Masuk di sini</Link></p>
        </div>
        <div className="bg-surface border border-white/5 rounded-2xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-2">Nama Lengkap</label>
            <input type="text" placeholder="Ahmad Rizky" value={form.fullName}
              onChange={e => setForm({...form, fullName: e.target.value})}
              className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-2">Email</label>
            <input type="email" placeholder="kamu@email.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-2">Password</label>
            <input type="password" placeholder="Min. 8 karakter" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-teal text-bg font-heading font-bold py-3 rounded-xl text-sm hover:shadow-teal transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? '⏳ Memproses...' : 'Buat Akun →'}
          </button>
        </div>
      </div>
    </div>
  );
}
