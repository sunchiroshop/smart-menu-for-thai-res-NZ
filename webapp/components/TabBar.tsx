'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, FileText, Settings, Receipt } from 'lucide-react';

interface TabItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabItem[] = [
  {
    href: '/upload',
    label: 'Upload',
    icon: <Upload className="w-5 h-5" />,
  },
  {
    href: '/menus',
    label: 'My Menu',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    href: '/dashboard/order-summary',
    label: 'Orders',
    icon: <Receipt className="w-5 h-5" />,
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function TabBar() {
  const pathname = usePathname();

  // Don't show tab bar on dashboard main page, login, or public pages
  const hiddenPaths = [
    '/dashboard',
    '/login',
    '/restaurant',
    '/payment',
    '/order-status',
    '/pos',
    '/checkout',
    '/qr',
    '/pricing',
  ];

  // Check if current path starts with any hidden path
  const shouldHide = hiddenPaths.some(path => {
    if (path === '/dashboard') {
      // Only hide for exact /dashboard, not /dashboard/settings or /dashboard/order-summary
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  });

  if (shouldHide) {
    return null;
  }

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700 shadow-lg">
      <nav className="flex justify-center items-center h-14 max-w-4xl mx-auto px-4 gap-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm font-medium hidden sm:inline">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
