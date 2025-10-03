import type { Metadata } from 'next';
import '../globals.css';

// Add the Telegram WebApp script to the head
export const metadata: Metadata = {
  title: 'NormalDance - Telegram Mini App',
  description: 'Music platform Telegram Mini App',
};

export default function TelegramAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}