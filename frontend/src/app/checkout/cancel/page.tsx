"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function CheckoutCancelPage() {
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
      <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl mb-6">❌</div>
      <h1 className="font-heading font-extrabold text-4xl mb-3">Pembayaran Dibatalkan</h1>
      <p className="text-muted text-base max-w-sm mb-8">Tidak ada yang dikenakan biaya. Kamu bisa mencoba lagi kapan saja.</p>
      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          className="bg-surface border border-white/10 text-white font-heading font-bold px-6 py-3 rounded-xl hover:border-white/30 transition-all"
        >
          ← Coba Lagi
        </button>
        <Link href="/dashboard" className="bg-teal text-bg font-heading font-bold px-6 py-3 rounded-xl hover:shadow-teal transition-all">
          Buka Dashboard
        </Link>
      </div>
    </div>
  );
}
