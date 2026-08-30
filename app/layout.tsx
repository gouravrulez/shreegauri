import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shree Gauri | Divine Energy. Timeless Beauty.",
  description: "Authentic gemstones, sacred jewellery, Rudraksha, spiritual products and meaningful gifts.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
