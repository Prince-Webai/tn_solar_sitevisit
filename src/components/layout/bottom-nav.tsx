'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MapPin, 
  Clock, 
  Settings,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

const ALL_NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Dispatcher', 'Sales', 'Engineer'] },
  { label: 'Dispatch', href: '/dispatch', icon: MapPin, roles: ['Admin', 'Dispatcher', 'Sales', 'Engineer'] },
  { label: 'History', href: '/history', icon: Clock, roles: ['Admin', 'Dispatcher', 'Sales', 'Engineer'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['Admin', 'Dispatcher'] },
];

export function BottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const navItems = ALL_NAV_ITEMS.filter(item => 
    !profile || item.roles.includes(profile.role)
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] pb-safe bg-white/80 backdrop-blur-xl border-t border-light-gray flex items-center justify-around px-4 z-50 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] transition-all">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all duration-300 ${
              isActive ? 'text-vision-green' : 'text-mid-gray/70 hover:text-dark-gray'
            }`}
          >
            <div className={`relative flex items-center justify-center transition-all duration-300 ${
              isActive ? 'scale-110 -translate-y-0.5' : 'scale-100'
            }`}>
              <Icon className={`w-5 h-5 transition-all ${
                isActive ? 'stroke-[2.5px]' : 'stroke-2'
              }`} />
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-vision-green rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              )}
            </div>
            <span className={`text-[10px] font-bold tracking-tight transition-all ${
              isActive ? 'opacity-100' : 'opacity-80'
            }`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
