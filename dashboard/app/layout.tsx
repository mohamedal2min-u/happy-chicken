'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tajawal, Outfit } from 'next/font/google';
import './globals.css';
import StyledJsxRegistry from './registry';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const isAuthPage = pathname.startsWith('/login');

    if (!token && !isAuthPage) {
      router.replace('/login');
    } else if (token && isAuthPage) {
      router.replace('/');
    } else {
      setLoading(false);
    }
  }, [pathname, router]);

  if (loading && !pathname.startsWith('/login')) {
    return (
      <html lang="ar" dir="rtl">
        <body className={`${tajawal.variable} ${outfit.variable}`}>
           <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#1e6534', fontSize: '24px', fontWeight: 'bold' }}>
             جاري التحقق من الهوية... 🐔
           </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="ar" dir="rtl">
      <body className={`${tajawal.variable} ${outfit.variable}`}>
        <StyledJsxRegistry>
          <main>{children}</main>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
