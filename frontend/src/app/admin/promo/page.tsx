'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type Promo = {
  id: string;
  code: string;
  discount: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  description: string | null;
};

const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

export default function AdminPromoPage() {
  const [promos, setPromos]     = useState<Promo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm]         = useState({
    code: '', discount: '10', maxUses: '', validFrom: '', validUntil: '', description: '', isActive: true,
  });

  async function fetchPromos() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/promo`, { headers: { Authorization: `Bearer ${token()}` } });
      const json = await res.json();
      setPromos(json.promos ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchPromos(); }, []);

  async function handleSubmit() {
    if (!form.code || !form.discount) return alert('Kode dan diskon wajib diisi');
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          discount: Number(form.discount),
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          validFrom: form.validFrom || undefined,
          validUntil: form.validUntil || null,
          description: form.description || null,
          isActive: form.isActive,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Gagal membuat promo');
      setForm({ code: '', discount: '10', maxUses: '', validFrom: '', validUntil: '', description: '', isActive: true });
      setShowForm(false);
      await fetchPromos();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(p: Promo) {
    await fetch(`${API}/admin/promo/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    await fetchPromos();
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Hapus promo code "${code}"?`)) return;
    setDeleting(id);
    try {
      await fetch(`${API}/admin/promo/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      await fetchPromos();
    } finally { setDeleting(null); }
  }

  const isExpired = (p: Promo) => p.validUntil ? new Date(p.validUntil) < new Date() : false;
  const isMaxed   = (p: Promo) => p.maxUses !== null && p.usedCount >= p.maxUses;
  const fmtDate   = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Promo Codes</h1>
            <p className="text-muted text-sm mt-1">Kelola kode diskon untuk campaign & event</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-teal text-background hover:bg-teal/80 transition-all"
          >
            {showForm ? 'Batal' : '+ Buat Promo'}
          </button>
        </div>

        {/* Form buat promo */}
        {showForm && (
          <div className="rounded-2xl border border-white/10 bg-surface p-6 space-y-4">
            <h2 className="text-white font-semibold">Buat Promo Code Baru</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Kode Promo *</label>
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="contoh: KORO20"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-teal/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Diskon (%) *</label>
                <input
                  type="number" min="1" max="100"
                  value={form.discount}
                  onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Max Penggunaan (kosong = unlimited)</label>
                <input
                  type="number" min="1"
                  value={form.maxUses}
                  onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                  placeholder="unlimited"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Berlaku Hingga (kosong = selamanya)</label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted mb-1 block">Deskripsi (opsional)</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="contoh: Diskon spesial Hari Raya"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted hover:text-white transition-colors">Batal</button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 rounded-xl text-sm font-semibold bg-teal text-background hover:bg-teal/80 disabled:opacity-40 transition-all"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-white/10 bg-surface overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-muted text-sm animate-pulse">Memuat data...</div>
          ) : promos.length === 0 ? (
            <div className="p-16 text-center text-muted text-sm">Belum ada promo code</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-muted text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Kode</th>
                    <th className="px-6 py-4 text-center">Diskon</th>
                    <th className="px-6 py-4 text-center">Penggunaan</th>
                    <th className="px-6 py-4 text-center">Berlaku Hingga</th>
                    <th className="px-6 py-4 text-left">Deskripsi</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {promos.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white tracking-widest">{p.code}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-teal font-bold">{p.discount}%</span>
                      </td>
                      <td className="px-6 py-4 text-center text-muted">
                        {p.usedCount} / {p.maxUses ?? '∞'}
                      </td>
                      <td className="px-6 py-4 text-center text-muted text-xs">
                        {p.validUntil ? fmtDate(p.validUntil) : '—'}
                        {isExpired(p) && <span className="ml-1 text-red-400">(expired)</span>}
                      </td>
                      <td className="px-6 py-4 text-muted text-xs">{p.description ?? '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleActive(p)}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all border ${
                            p.isActive && !isExpired(p) && !isMaxed(p)
                              ? 'bg-teal/10 text-teal border-teal/20 hover:bg-teal/20'
                              : 'bg-white/5 text-muted border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {p.isActive && !isExpired(p) && !isMaxed(p) ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(p.id, p.code)}
                          disabled={deleting === p.id}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                        >
                          {deleting === p.id ? '...' : 'Hapus'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
