import type { Metadata } from "next";
import "./globals.css";
import CartFix from "./cart-fix";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://shreegauri.in"),
  title: { default: "Shree Gauri | Jewellery, Gemstones & Spiritual Products", template: "%s | Shree Gauri" },
  description: "Shop jewellery, gemstones, Rudraksha and thoughtfully selected spiritual products from Shree Gauri.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://shreegauri.in",
    siteName: "Shree Gauri",
    title: "Shree Gauri | Jewellery, Gemstones & Spiritual Products",
    description: "Jewellery, gemstones, Rudraksha and thoughtfully selected spiritual products.",
  },
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
  ¶»§q«^