'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('trader');
    router.push('/auth/login');
  }, []);
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-muted text-sm">
      Keluar...
    </div>
  );
}
