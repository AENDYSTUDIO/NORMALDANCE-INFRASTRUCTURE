"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Music, 
  Share2, 
  Users, 
  TrendingUp,
  Heart,
  Bookmark,
  Bell,
  MessageCircle,
  Gift,
  Star
} from "lucide-react";
import { useTelegram } from "@/contexts/telegram-context";
import { useToast } from "@/hooks/use-toast";

// Advanced Telegram Features Component
export function AdvancedTelegramFeatures() {
  const { isTMA, tgWebApp, hapticFeedback, showAlert, user } = useTelegram();
  const { toast } = useToast();
  
  const [isSharing, setIsSharing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [referralStats, setReferralStats] = useState({
    referrals: 0,
    rewardEarned: 0,
    nextReward: 10
  });

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ("Notification" in window && isTMA) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === "granted") {
          hapticFeedback("selection");
          toast({
            title: "Notifications enabled!",
            description: "You'll receive updates about new music",
          });
        }
      } catch (error) {
        console.error("Failed to request notification permission:", error);
      }
    } else {
      hapticFeedback("impact");
      showAlert("Notifications are not available in your browser");
    }
  };

  // Share content
  const shareContent = async (content: {
    type: 'track' | 'playlist' | 'profile';
    title: string;
    description: string;
    url?: string;
  }) => {
    setIsSharing(true);
    hapticFeedback("selection");

    try {
      if (isTMA && tgWebApp?.shareStory) {
        // Use Telegram's native shareStory
        await tgWebApp.shareStory({
          mediaUrl: content.url,
          text: content.title,
          caption: content.description,
        });
      } else if (navigator.share) {
        // Fallback to Web Share API
        await navigator.share({
          title: content.title,
          text: content.description,
          url: content.url || window.location.href,
        });
      }

      toast({
        title: "Shared successfully!",
        description: `${content.title} shared with your friends`,
      });
    } catch (error) {
      console.error("Share failed:", error);
      toast({
        title: "Share failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Handle subscription
  const handleSubscription = async () => {
    setIsSubscribed(!isSubscribed);
    hapticFeedback("selection");

    if (!isSubscribed) {
      toast({
        title: "Subscribed! 🎉",
        description: "You'll get updates about new music and features",
      });
    } else {
      toast({
        title: "Unsubscribed",
        description: "You won't receive notifications anymore",
      });
    }
  };

  // Handle referral
  const shareReferralLink = useCallback(async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to get your referral link",
        variant: "destructive",
      });
      return;
    }

    const referralLink = `https://t.me/normaldance_bot?start=ref_${user.id}`;
    
    try {
      if (isTMA && tgWebApp?.shareTextMessage) {
        await tgWebApp.shareTextMessage(
          `Join NormalDance and get 50 Stars bonus! 🎵\n${referralLink}`
        );
      }

      setReferralStats(prev => ({
        ...prev,
        referrals: prev.referrals + 1
      }));

      toast({
        title: "Referral link shared!",
        description: "You'll earn rewards when friends join",
      });
    } catch (error) {
      console.error("Referral share failed:", error);
    }

    hapticFeedback("impact");
  }, [user, isTMA, tgWebApp]);

  // Send custom notification
  const sendNotification = useCallback(async (title: string, message: string, icon: string = "🎵") => {
    if (!("Notification" in window) || notificationPermission !== "granted") {
      return false;
    }

    try {
      await new Notification(title, {
        body: message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "normaldance",
        vibrate: [200, 100, 200],
      });
      return true;
    } catch (error) {
      console.error("Notification failed:", error);
      return false;
    }
  }, [notificationPermission]);

  // Handle inline keyboard
  const showInlineKeyboard = (buttons: Array<{text: string; callback: () => void}>) => {
    if (isTMA && tgWebApp?.showPopup) {
      tgWebApp.showPopup({
        title: "Choose option",
        message: "What would you like to do?",
        buttons: buttons.map(btn => [
          { text: btn.text, id: btn.callback.name }
        ]),
      }, (buttonId: string) => {
        const button = buttons.find(btn => btn.callback.name === buttonId);
        if (button) {
          button.callback();
        }
      });
    }
  };

  // Handle main button
  const configureMainButton = useCallback((text: string, callback: () => void, visible: boolean = true) => {
    if (isTMA && tgWebApp?.MainButton) {
      tgWebApp.MainButton.text = text;
      
      if (visible) {
        tgWebApp.MainButton.show();
        tgWebApp.MainButton.onClick(callback);
      } else {
        tgWebApp.MainButton.hide();
        tgWebApp.MainButton.offClick(callback);
      }
      
      return () => {
        tgWebApp.MainButton.offClick(callback);
        tgWebApp.MainButton.hide();
        tgWebApp.MainButton.text = "Main Button";
      };
    }

    return Promise.resolve();
  }, [isTMA, tgWebApp]);

  return (
    <div className="space-y-6">
      {/* User Engagement Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Engagement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Program */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Referral Program</h3>
                <Button
                  size="sm"
                  onClick={shareReferralLink}
                  disabled={isSharing}
                >
                  <Gift className="h-4 w-4 mr-1" />
                  Share Link
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Invite friends and earn Stars rewards
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span>Referrals: {referralStats.referrals}</span>
                <Badge variant="secondary">
                  {referralStats.referrals}/{referralStats.nextReward}
                </Badge>
              </div>
            </div>

            {/* Subscription */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Notifications</h3>
                <Button
                  size="sm"
                  onClick={handleSubscription}
                  variant={isSubscribed ? "destructive" : "default"}
                >
                  {isSubscribed ? (
                    <>
                      <Bell className="h-4 w-4 mr-1" />
                      Unsubscribe
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-1" />
                      Subscribe
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get updates about new music and features
              </p>
              {notificationPermission === "prompt" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestNotificationPermission}
                >
                  Enable Notifications
                </Button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => shareContent({
                type: 'track',
                title: 'Check out this track!',
                description: 'Amazing music on NormalDance',
                url: window.location.href
              })}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => hapticFeedback("impact")}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => hapticFeedback("selection")}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => showInlineKeyboard([
                { text: 'Create Playlist', callback: () => console.log('Create playlist') },
                { text: 'Share Music', callback: () => console.log('Share music') },
                { text: 'Support', callback: () => console.log('Support') }
              ])}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Social Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Social Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Leaderboard */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Top Listeners This Week</h3>
              <Badge>Gaming Mode</Badge>
            </div>
            {/* User list would go here */}
            <div className="space-y-2">
              {[
                { name: "MusicLover42", stars: 1250, tracks: 42 },
                { name: "BeatMaker99", stars: 980, tracks: 31 },
                { name: "DJ_Master", stars: 756, tracks: 28 }
              ].map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                      {user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.tracks} tracks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">{user.stars}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" className="w-full">
              View Full Leaderboard
            </Button>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <h3 className="font-semibold">Community</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-medium">Active Users</div>
                  <div className="text-2xl font-bold">12.5K</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Music className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="font-medium">Total Tracks</div>
                  <div className="text-2xl font-bold">3.2K</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <div className="font-medium">Daily Stakes</div>
                  <div className="text-2xl font-bold">847</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Advanced Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Messages */}
          <div className="space-y-2">
            <h3 className="font-semibold">Voice Commands</h3>
            <p className="text-sm text-muted-foreground">
              Use voice commands to control the app
            </p>
            <Button
              size="sm"
              onClick={() => {
                if (isTMA && tgWebApp?.requestVoiceQuery) {
                  tgWebApp.requestVoiceQuery({
                    prompt: "What would you like to listen to?",
                    callback: (voiceQuery, voiceId) => {
                      console.log("Voice query:", voiceQuery);
                      hapticFeedback("notification");
                    }
                  });
                }
              }}
            >
              🎤 Enable Voice Control
            </Button>
          </div>

          {/* Location Sharing */}
          <div className="space-y-2">
            <h3 className="font-semibold">Location Sharing</h3>
            <p className="text-sm text-muted-foreground">
              Share your location to find local music events
            </p>
            <Button
              size="sm"
              onClick={() => {
                if (isTMA && tgWebApp?.requestLocationData) {
                  tgWebApp.requestLocationData({
                    action: "share_location",
                    callback: (locationData) => {
                      console.log("Location shared:", locationData);
                      hapticFeedback("impact");
                    }
                  });
                }
              }}
            >
              📍 Share Location
            </Button>
          </div>

          {/* QR Code Scanner */}
          <div className="space-y-2">
            <h3 className="font-semibold">QR Scanner</h3>
            <p className="text-sm text-muted-foreground">
              Scan QR codes for quick access to content
            </p>
            <Button
              size="sm"
              onClick={() => {
                if (isTMA && tgWebApp?.showScanQrPopup) {
                  tgWebApp.showScanQrPopup({
                    text: "Scan a QR code to access content quickly",
                    callback: (data) => {
                      console.log("QR code scanned:", data);
                      hapticFeedback("selection");
                    }
                  });
                }
              }}
            >
              📷 Scan QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Stars Earned</span>
              <span className="font-bold text-yellow-600">2,450</span>
            </div>
            <Progress value={45} className="h-2" />
            <p className="text-xs text-muted-foreground">
              45% to next reward (5,000 Stars)
            </p>
          </div>

          {/* Achievements */}
          <div className="space-y-2">
            <h3 className="font-semibold">Recent Achievements</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text">🎵</div>
                <div>
                  <p className="font-medium">First Stream</p>
                  <p className="text-xs text-muted-foreground">Started your music journey</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text">🌟</div>
                <div>
                  <p className="font-medium">Social Butterfly</p>
                  <p className="text-xs text-muted-foreground">Shared 10 times</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text">⭐</div>
                <div>
                  <p className="font-medium">Star Collector</p>
                  <p className="text-xs text-muted-foreground">Saved 50 Stars</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for sending notifications
export function useNotifications() {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  const requestPermission = async () => {
    if (!("Notification" in window)) {
      return false;
    }
    
    const result = await Notification.requestPermission();
    setPermission(result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'prompt');
    return result === 'granted';
  };

  const notify = useCallback((title: string, options: NotificationOptions = {}) => {
    if (!("Notification" in window) || permission !== 'granted') {
      return false;
    }

    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  }, [permission]);

  return {
    permission,
    requestPermission,
    notify,
  };
}

// Hook for Telegram sharing
export function useTelegramSharing() {
  const { isTMA, tgWebApp } = useTelegram();
  
  const shareStory = useCallback(async (mediaUrl: string, text: string, caption: string) => {
    if (isTMA && tgWebApp?.shareStory) {
      await tgWebApp.shareStory({ mediaUrl, text, caption });
    }
  }, [isTMA, tgWebApp]);

  const shareText = useCallback(async (text: string) => {
    if (isTMA && tgWebApp?.shareTextMessage) {
      await tgWebApp.shareTextMessage(text);
    }
  }, [isTMA, tgWebApp]);

  const shareUrl = useCallback(async (url: string, title?: string) => {
    if (isTMA && tgWebApp?.openLink) {
      tgWebApp.openLink(url);
    }
  }, [isTMA, tgWebApp]);

  return {
    shareStory,
    shareText,
    shareUrl,
  };
}

// Hook for Telegram navigation
export function useTelegramNavigation() {
  const { isTMA, tgWebApp } = useTelegram();
  
  const handleBack = useCallback(() => {
    if (isTMA && tgWebApp?.BackButton?.isVisible()) {
      tgWebApp.BackButton.hide();
      // Handle back navigation
    }
  }, [isTMA, tgWebApp]);

  const setupBackButton = useCallback((callback: () => void, visible: boolean = true) => {
    if (isTMA && tgWebApp?.BackButton) {
      if (visible) {
        tgWebApp.BackButton.show();
        tgWebApp.BackButton.onClick(callback);
        return () => {
          tgWebApp.BackButton.hide();
          tgWebApp.BackButton.offClick(callback);
        };
      } else {
        tgWebApp.BackButton.hide();
        tgWebApp.BackButton.offClick(callback);
      }
    }
  }, [isTMA, tgWebApp]);

  return {
    handleBack,
    setupBackButton,
  };
}
