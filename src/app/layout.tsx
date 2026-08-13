import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import { MuiProvider } from "@/components/mui-provider";
import { SiteHeader } from "@/components/site-header";
import { FlashToast } from "@/components/flash-toast";
import { Toaster } from "@/components/ui/sonner";
import { BUSINESS_NAME } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: BUSINESS_NAME,
  description: `Catálogo, servicios y compra de oro de ${BUSINESS_NAME}.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <MuiProvider>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          {/* Suspense porque FlashToast lee searchParams en el cliente. */}
          <Suspense>
            <FlashToast />
          </Suspense>
          <Toaster position="top-center" richColors />
        </MuiProvider>
      </body>
    </html>
  );
}
