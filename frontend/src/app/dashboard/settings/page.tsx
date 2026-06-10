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
              n.label === 'Settings' ? 'bg-teal/10 text-teal border border-teal/15 font-medium' : 'text-muted hover:bg-white/5 hover:text-white'
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

export default function SettingsPage() {
  const router = useRouter();
  const [trader, setTrader] = useState<{ fullName: string; email: string; id: string } | null>(null);
  const [profile, setProfile] = useState({ fullName: '', phone: '', country: '' });
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.replace('/auth/login'); return; }
    const t = localStorage.getItem('trader');
    if (t) {
      const parsed = JSON.parse(t);
      setTrader(parsed);
      setProfile({ fullName: parsed.fullName ?? '', phone: parsed.phone ?? '', country: parsed.country ?? '' });
    }
  }, [router]);

  async function handleProfileSave() {
    if (!profile.fullName) { setProfileErr('Nama wajib diisi.'); return; }
    setProfileErr(''); setProfileMsg(''); setProfileLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:4000/api/v1/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) { setProfileErr(data.error || 'Gagal update profil.'); return; }
      setProfileMsg('Profil berhasil disimpan!');
      const updated = { ...trader, ...profile };
      localStorage.setItem('trader', JSON.stringify(updated));
      setTrader(updated as any);
    } catch { setProfileErr('Gagal terhubung ke server.'); }
    setProfileLoading(false);
  }

  async function handlePasswordSave() {
    if (!password.current || !password.new || !password.confirm) { setPasswordErr('Semua field wajib diisi.'); return; }
    if (password.new !== password.confirm) { setPasswordErr('Password baru tidak cocok.'); return; }
    if (password.new.length < 8) { setPasswordErr('Password minimal 8 karakter.'); return; }
    setPasswordErr(''); setPasswordMsg(''); setPasswordLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:4000/api/v1/auth/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: password.current, newPassword: password.new }),
      });
      const data = await res.json();
      if (!res.ok) { setPasswordErr(data.error || 'Gagal ganti password.'); return; }
      setPasswordMsg('Password berhasil diubah!');
      setPassword({ current: '', new: '', confirm: '' });
    } catch { setPasswordErr('Gagal terhubung ke server.'); }
    setPasswordLoading(false);
  }

  const COUNTRIES = ['Indonesia','Malaysia','Singapore','Philippines','Thailand','Vietnam','Other'];

  return (
    <div className="flex min-h-screen">
      <Sidebar trader={trader} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="font-heading font-extrabold text-2xl mb-1">Settings</h1>
          <p className="text-muted text-sm">Kelola profil dan keamanan akun kamu.</p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Profile */}
          <div className="bg-surface border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading font-bold text-base mb-5">Profil</h2>
            {profileMsg && <div className="bg-teal/10 border border-teal/20 rounded-xl px-4 py-3 text-sm text-teal mb-4">{profileMsg}</div>}
            {profileErr && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">{profileErr}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Email</label>
                <input disabled value={trader?.email ?? ''} className="w-full bg-bg border border-white/5 rounded-xl px-4 py-3 text-sm text-muted cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Nama Lengkap</label>
                <input value={profile.fullName} onChange={e => setProfile({...profile, fullName: e.target.value})}
                  className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Nomor Telepon</label>
                <input value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})}
                  placeholder="+62 812 3456 7890"
                  className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Negara</label>
                <select value={profile.country} onChange={e => setProfile({...profile, country: e.target.value})}
                  className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal transition-colors">
                  <option value="">Pilih negara</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleProfileSave} disabled={profileLoading}
                className="w-full bg-teal text-bg font-heading font-bold py-3 rounded-xl text-sm hover:shadow-teal transition-all disabled:opacity-60">
                {profileLoading ? '⏳ Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="bg-surface border border-white/5 rounded-2xl p-6">
            <h2 className="font-heading font-bold text-base mb-5">Ganti Password</h2>
            {passwordMsg && <div className="bg-teal/10 border border-teal/20 rounded-xl px-4 py-3 text-sm text-teal mb-4">{passwordMsg}</div>}
            {passwordErr && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">{passwordErr}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Password Saat Ini</label>
                <input type="password" value={password.current} onChange={e => setPassword({...password, current: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Password Baru</label>
                <input type="password" value={password.new} onChange={e => setPassword({...password, new: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wider block mb-2">Konfirmasi Password Baru</label>
                <input type="password" value={password.confirm} onChange={e => setPassword({...password, confirm: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-bg border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-teal transition-colors" />
              </div>
              <button onClick={handlePasswordSave} disabled={passwordLoading}
                className="w-full bg-teal text-bg font-heading font-bold py-3 rounded-xl text-sm hover:shadow-teal transition-all disabled:opacity-60">
                {passwordLoading ? '⏳ Menyimpan...' : 'Ganti Password'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
