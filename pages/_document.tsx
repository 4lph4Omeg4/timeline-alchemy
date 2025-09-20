// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="nl">
      <Head>
        {/* Icons & manifest */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#1E2897" />

        {/* Brand theming */}
        <meta name="theme-color" content="#0B0E20" />
        <meta name="msapplication-TileColor" content="#0B0E20" />
        <meta name="color-scheme" content="dark light" />

        {/* Social fallbacks (override per page met <Head> waar nodig) */}
        <meta property="og:title" content="Image Creator" />
        <meta property="og:description" content="Create. Remix. Shine." />
        <meta property="og:image" content="/opengraph-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Image Creator" />
        <meta name="twitter:description" content="Create. Remix. Shine." />
        <meta name="twitter:image" content="/opengraph-image.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
