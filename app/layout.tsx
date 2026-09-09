import type { Metadata } from "next";
import "./globals.css";
import CartFix from "./cart-fix";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.shreegauri.in"),
  title: { default: "Shree Gauri | Jewellery, Gemstones & Spiritual Collections", template: "%s | Shree Gauri" },
  description: "Explore Shree Gauri jewellery, gemstones, Rudraksha, malas, bracelets, statues, spiritual products and meaningful gifts from India for customers in India and abroad.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://www.shreegauri.in",
    siteName: "Shree Gauri",
    title: "Shree Gauri | Jewellery, Gemstones & Spiritual Collections",
    description: "Thoughtfully selected jewellery, gemstones and spiritual collections from India for customers in India and abroad.",
  },
  robots: { index: true, follow: true },
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
        {children}
        <CartFix />
      </body>
    </html>
  );
}
