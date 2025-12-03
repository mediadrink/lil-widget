// File: app/layout.tsx

import "./globals.css";
import SupabaseProvider from "./supabase-provider";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "LIL Widget",
  description: "Simple AI widget for any site",
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
