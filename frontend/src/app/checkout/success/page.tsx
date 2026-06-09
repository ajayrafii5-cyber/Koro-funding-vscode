"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function CheckoutSuccessPage() {
  const params  = useSearchParams();
  const router  = useRouter();
  const orderId = params.get('order_id') ?? '';

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.replace('/auth/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center text-4xl mb-6">✅</div>
      <h1 className="font-heading font-extrabold text-4xl mb-3">Pembayaran Berhasil!</h1>
      <p className="text-muted text-base max-w-sm mb-2">Akun trading kamu sedang diaktifkan. Proses ini berlangsung otomatis.</p>
      <p className="text-muted text-sm mb-8">Email konfirmasi dan kredensial akun akan segera dikirim ke inbox kamu.</p>
      {orderId && (
        <div className="bg-surface border border-white/5 rounded-2xl p-6 w-full max-w-sm mb-8 text-left">
          <p className="text-xs text-muted uppercase tracking-widest mb-4 font-semibold">Detail Transaksi</p>
          <div className="flex justify-between py-2.5 border-b border-white/5">
            <span className="text-sm text-muted">Order ID</span>
            <span className="text-sm text-white font-medium">{orderId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-sm text-muted">Status</span>
            <span className="text-sm text-teal font-medium">Pembayaran Diterima</span>
          </div>
        </div>
      )}
      <Link href="/dashboard" className="bg-teal text-bg font-heading font-bold px-8 py-3 rounded-xl hover:shadow-teal transition-all">
        Buka Dashboard →
      </Link>
    </div>
  );
}
