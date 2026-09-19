import type { Metadata } from "next";
import "./globals.css";
import CartFix from "./cart-fix";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Shree Gauri | Divine Energy. Timeless Beauty.",
  description: "Authentic gemstones, sacred jewellery, Rudraksha, spiritual products and meaningful gifts.",
  verification: {
    google: "lN23qxr0DWCu_kG2znDpYCJqtep-1Yq-Jxk1gJAbM_k",
  },
  icons: {
    icon: [{ url: "/shree-gauri-om.svg", type: "image/svg+xml" }],
    shortcut: "/shree-gauri-om.svg",
    apple: "/shree-gauri-om.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/maa-lakshmi-hero-fast.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
      </head>
      <body className="antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-14K0LF1DHG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-14K0LF1DHG');`}
        </Script>
        {children}
        <CartFix />
      </body>
    </html>
  );
}
