import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Rhythm — a calm habit tracker',
  description: 'A private habit, routine, mood, and wellness tracker.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Rhythm' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF9F6' },
    { media: '(prefers-color-scheme: dark)', color: '#14161A' },
  ],
};

import { SoundManager } from '@/components/SoundManager';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-body min-h-screen antialiased">
        <SoundManager />
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center -z-10 overflow-hidden">
          <span className="font-display text-[20vw] leading-none opacity-10 text-ink dark:text-dark-text select-none whitespace-nowrap tracking-wider">
            Rhythm
          </span>
        </div>
        <div className="relative z-0">
          {children}
        </div>
      </body>
    </html>
  );
}
