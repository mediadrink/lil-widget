// File: app/layout.tsx

import "./globals.css";
import SupabaseProvider from "./supabase-provider";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "Lil Widget - AI Chat Widget for Your Website",
    template: "%s | Lil Widget",
  },
  description:
    "Add an AI-powered chat widget to your website in minutes. Answer visitor questions 24/7, capture leads, and provide instant support. Free to start.",
  keywords: [
    "AI chat widget",
    "website chatbot",
    "AI customer support",
    "live chat widget",
    "chatbot for website",
    "AI assistant",
    "customer service automation",
  ],
  authors: [{ name: "Lil Widget" }],
  creator: "Lil Widget",
  metadataBase: new URL("https://www.lilwidget.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.lilwidget.com",
    siteName: "Lil Widget",
    title: "Lil Widget - AI Chat Widget for Your Website",
    description:
      "Add an AI-powered chat widget to your website in minutes. Answer visitor questions 24/7, capture leads, and provide instant support.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lil Widget - AI Chat Widget",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lil Widget - AI Chat Widget for Your Website",
    description:
      "Add an AI-powered chat widget to your website in minutes. Answer visitor questions 24/7.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3CVCJFF04V"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3CVCJFF04V');
          `}
        </Script>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
