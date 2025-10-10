"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initDataUnsafe: { user?: any };
        setHeaderColor: (color: string) => void;
        openLink: (url: string) => void;
      };
    };
  }
}

export default function TelegramApp() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#6366f1");

      setUser(tg.initDataUnsafe?.user);
      setIsReady(true);
    }
  }, []);

  if (!isReady) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>NormalDance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Welcome, {user?.first_name}!</p>
          <Button
            className="w-full"
            onClick={() => window.Telegram?.WebApp.openLink("/music")}
          >
            Open Music Platform
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
