import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.timeline-alchemy.com'),
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
    url: 'https://www.timeline-alchemy.com',
    siteName: 'Timeline Alchemy',
    title: 'Timeline Alchemy - AI Content Creation Platform',
    description: 'Create, schedule, and publish AI-generated content across all your social media platforms.',
    images: [
      {
        url: '/images/ta-og-image.jpg',
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
      url: '/images/ta-og-image.jpg',
      alt: 'Timeline Alchemy - AI Content Creation Platform',
    },
  },
  icons: {
    icon: [
      { url: '/images/ta-favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/ta-favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/images/ta-favicon.ico',
    apple: '/images/ta-apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-K6DKJ89B');
          `}
        </Script>

        {/* Facebook SDK */}
        <Script id="facebook-sdk" strategy="afterInteractive">
          {`
            window.fbAsyncInit = function() {
              FB.init({
                appId      : '${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || ''}',
                cookie     : true,
                xfbml      : true,
                version    : 'v18.0'
              });
              FB.AppEvents.logPageView();
            };

            (function(d, s, id){
              var js, fjs = d.getElementsByTagName(s)[0];
              if (d.getElementById(id)) {return;}
              js = d.createElement(s); js.id = id;
              js.src = "https://connect.facebook.net/en_US/sdk.js";
              fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
          `}
        </Script>
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K6DKJ89B"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        {/* Facebook SDK Root Element */}
        <div id="fb-root"></div>

        {children}
        <Toaster position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
