import { ClientInit } from "@/components/ClientInit";
import { MobileNavWrapper } from "@/components/layout/mobile-nav-wrapper";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NORMAL DANCE - Децентрализованная музыкальная платформа",
  description: "Революционная децентрализованная музыкальная платформа, созданная для предоставления артистам полного контроля над их творчеством и монетизацией.",
  keywords: ["NORMAL DANCE", "музыка", "децентрализация", "Web3", "блокчейн", "NFT", "крипто"],
  authors: [{ name: "NORMAL DANCE Team" }],
  openGraph: {
    title: "NORMAL DANCE - Децентрализованная музыкальная платформа",
    description: "Революционная децентрализованная музыкальная платформа для артистов и слушателей",
    url: "https://normaldance.app",
    siteName: "NORMAL DANCE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NORMAL DANCE - Децентрализованная музыкальная платформа",
    description: "Революционная децентрализованная музыкальная платформа для артистов и слушателей",
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
         className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
       >
         <ClientInit />
         {children}
         <Toaster />
         <Analytics />
         <SpeedInsights />
         <MobileNavWrapper />
       </body>
     </html>
   );
}
