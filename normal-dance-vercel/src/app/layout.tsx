import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from './providers'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NORMAL DANCE - Музыкальная платформа",
  description: "Откройте для себя лучшие треки и создайте свои плейлисты",
  keywords: ["NORMAL DANCE", "музыка", "плейлисты", "стриминг", "Next.js", "TypeScript"],
  authors: [{ name: "NORMAL DANCE Team" }],
  openGraph: {
    title: "NORMAL DANCE",
    description: "Современная музыкальная платформа",
    url: "http://localhost:3000",
    siteName: "NORMAL DANCE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NORMAL DANCE",
    description: "Современная музыкальная платформа",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
