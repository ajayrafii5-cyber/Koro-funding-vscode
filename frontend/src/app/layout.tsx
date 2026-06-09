import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Koro Funding — Trade. Prove. Get Funded.',
  description: 'Platform prop trading terpercaya. Buktikan skill Anda dan dapatkan akun funded hingga $200K dengan profit split 90%.',
  keywords: 'prop firm, forex funded, trading challenge, koro funding',
  openGraph: {
    title: 'Koro Funding',
    description: 'Trade. Prove. Get Funded.',
    url: 'https://korofunding.com',
    siteName: 'Koro Funding',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="noise">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111827',
              color: '#E8EDF5',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00D4C8', secondary: '#07090F' } },
            error: { iconTheme: { primary: '#FF4D6D', secondary: '#07090F' } },
          }}
        />
      </body>
    </html>
  );
}
