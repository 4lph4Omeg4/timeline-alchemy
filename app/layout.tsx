import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Timeline Alchemy - AI Content Creation Platform',
  description: 'Create, schedule, and publish AI-generated content across all your social media platforms.',
  keywords: ['AI content creation', 'social media automation', 'content scheduling', 'AI tools', 'social media management'],
  authors: [{ name: 'Timeline Alchemy' }],
  creator: 'Timeline Alchemy',
  publisher: 'Timeline Alchemy',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://timeline-alchemy.com',
    siteName: 'Timeline Alchemy',
    title: 'Timeline Alchemy - AI Content Creation Platform',
    description: 'Create, schedule, and publish AI-generated content across all your social media platforms.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Timeline Alchemy - AI Content Creation Platform',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@timelinealchemy',
    creator: '@timelinealchemy',
    title: 'Timeline Alchemy - AI Content Creation Platform',
    description: 'Create, schedule, and publish AI-generated content across all your social media platforms.',
    images: {
      url: '/og-image.jpg',
      alt: 'Timeline Alchemy - AI Content Creation Platform',
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
