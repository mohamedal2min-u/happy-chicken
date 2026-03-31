import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: 'نظام دجاجتي - إدارة المداجن',
  description: 'نظام دجاجتي لإدارة أفواج دجاج اللحم والمحاسبة المتكاملة',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="rtl">
      <body className={`${tajawal.variable} ${outfit.variable}`}>
        <StyledJsxRegistry>
          <main>{children}</main>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
