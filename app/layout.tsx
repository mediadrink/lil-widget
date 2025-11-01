// File: app/layout.tsx

import "./globals.css";
import SupabaseProvider from "./supabase-provider";
import type { Metadata } from "next";

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
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
