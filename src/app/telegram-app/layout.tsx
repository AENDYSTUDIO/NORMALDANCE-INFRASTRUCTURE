import { TelegramUXAdapter } from "@/components/telegram/telegram-ux-adapter";
import { TelegramProvider } from "@/contexts/telegram-context";
import { TonConnectProvider } from "@/contexts/ton-connect-context";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NormalDance Telegram Mini App",
  description: "Music NFT marketplace on TON blockchain",
};

export default function TelegramAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <script
          src="https://telegram.org/js/telegram-web-app.js"
          async
        ></script>
      </head>
      <body className={inter.className}>
        <TelegramProvider>
          <TonConnectProvider>
            <TelegramUXAdapter>
              <div className="min-h-screen bg-background">{children}</div>
            </TelegramUXAdapter>
          </TonConnectProvider>
        </TelegramProvider>
      </body>
    </html>
  );
}
