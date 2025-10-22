'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, User, Music, TrendingUp } from '@/components/icons';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Главная', icon: Home },
    { href: '/tracks', label: 'Треки', icon: Music },
    { href: '/dex', label: 'DEX', icon: TrendingUp },
    { href: '/analytics', label: 'Аналитика', icon: BarChart2 },
    { href: '/profile', label: 'Профиль', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-background border-t border-border py-2 px-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center p-2 rounded-lg transition-colors',
              pathname === item.href
                ? 'text-primary font-medium bg-primary/10'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            )}
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}