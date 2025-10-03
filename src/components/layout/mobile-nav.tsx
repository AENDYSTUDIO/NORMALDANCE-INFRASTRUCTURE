'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Главная' },
    { href: '/dex', label: 'DEX' },
    { href: '/analytics', label: 'Аналитика' },
    { href: '/profile', label: 'Профиль' },
  ];

  return (
    <div className="mobile-nav">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex flex-col items-center justify-center text-xs',
            pathname === item.href
              ? 'text-primary font-medium'
              : 'text-muted-foreground'
          )}
        >
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}