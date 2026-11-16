import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Arabic, Amiri } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const notoSansArabic = Noto_Sans_Arabic({ 
  subsets: ["arabic"],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const amiri = Amiri({ 
  subsets: ["arabic"],
  variable: '--font-serif',
  weight: ['400', '700'],
});

import { PwaInstallPrompt } from '@/components/pwa-install-prompt'

export const metadata: Metadata = {
  title: 'حافظ | برنامج حفظ القرآن الكريم',
  description: 'تطبيق متكامل لحفظ القرآن الكريم في 4 أشهر مع تتبع دقيق واحترافي',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'حافظ',
  },
  keywords: ['قرآن', 'حفظ', 'تلاوة', 'إسلام', 'تجويد', 'تكرار متباعد'],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#12141a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${notoSansArabic.variable} ${amiri.variable} font-sans antialiased`}>
        {children}
        <PwaInstallPrompt />
        <Analytics />
      </body>
    </html>
  )
}
