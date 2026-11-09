'use client';

import { cn } from '@/lib/utils';
import {
  BookOpenText,
  ChevronDown,
  Clock3,
  Folder,
  Home,
  Search,
  SquarePen,
} from 'lucide-react';
import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Layout from './Layout';
import SettingsButton from './Settings/SettingsButton';
import AuthButton from './auth/AuthButton';

type RecentChat = { id: string; title: string };

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const segments = useSelectedLayoutSegments();
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);

  const navLinks = [
    {
      icon: Home,
      href: '/',
      active: segments.length === 0 || segments.includes('c'),
      label: 'Home',
    },
    {
      icon: Search,
      href: '/discover',
      active: segments.includes('discover'),
      label: 'Discover',
    },
    {
      icon: BookOpenText,
      href: '/library',
      active: segments.includes('library'),
      label: 'Library',
    },
  ];

  useEffect(() => {
    fetch('/api/chats')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setRecentChats((data?.chats ?? []).slice(0, 6)))
      .catch(() => setRecentChats([]));
  }, []);

  return (
    <div>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-[248px] lg:flex-col border-r border-light-200 bg-light-secondary dark:border-dark-200 dark:bg-dark-secondary">
        <div className="flex h-full flex-col px-3 py-4">
          <div className="flex items-center justify-between px-2 pb-7">
            <Link href="/" className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d7f35b] text-[#17200e]">✦</span>
              Vedaix
            </Link>
          </div>

          <Link href="/" className="mb-5 flex items-center justify-center gap-2 rounded-lg bg-[#d7f35b] px-3 py-2.5 text-sm font-semibold text-[#17200e] transition hover:bg-[#e2fa79]">
            <SquarePen size={16} /> New thread
          </Link>

          <nav className="space-y-1" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition', link.active ? 'bg-light-200 font-medium text-black dark:bg-dark-200 dark:text-white' : 'text-black/65 hover:bg-light-200/70 hover:text-black dark:text-white/65 dark:hover:bg-dark-200/70 dark:hover:text-white')}>
                <link.icon size={17} />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-7 border-t border-light-200 pt-5 dark:border-dark-200">
            <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/40 dark:text-white/40">
              <span>Workspace</span>
              <ChevronDown size={14} />
            </div>
            <div className="space-y-1">
              <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-black/65 dark:text-white/65">
                <Folder size={16} /> Research
              </div>
              <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-black/65 dark:text-white/65">
                <Folder size={16} /> Personal
              </div>
            </div>
          </div>

          <div className="mt-7 min-h-0 flex-1">
            <div className="flex items-center gap-2 px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/40 dark:text-white/40">
              <Clock3 size={13} /> Recent
            </div>
            <div className="space-y-0.5 overflow-y-auto">
              {recentChats.map((chat) => (
                <Link key={chat.id} href={`/c/${chat.id}`} className="block truncate rounded-lg px-3 py-2 text-sm text-black/60 transition hover:bg-light-200/70 hover:text-black dark:text-white/60 dark:hover:bg-dark-200/70 dark:hover:text-white" title={chat.title}>
                  {chat.title}
                </Link>
              ))}
              {recentChats.length === 0 && <p className="px-3 py-2 text-xs text-black/40 dark:text-white/40">Your threads will appear here.</p>}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-light-200 pt-3 dark:border-dark-200">
            <AuthButton />
            <SettingsButton />
          </div>
        </div>
      </aside>

      <div className="fixed bottom-0 z-50 flex w-full flex-row items-center gap-x-6 border-t border-light-200 bg-light-secondary px-4 py-3 shadow-sm dark:border-dark-200 dark:bg-dark-secondary lg:hidden">
        {navLinks.map((link) => (
          <Link href={link.href} key={link.href} className={cn('relative flex w-full flex-col items-center space-y-1 text-center', link.active ? 'text-black dark:text-white' : 'text-black/60 dark:text-white/70')}>
            {link.active && <div className="absolute top-0 -mt-3 h-0.5 w-full rounded-b-lg bg-[#d7f35b]" />}
            <link.icon size={18} />
            <p className="text-xs">{link.label}</p>
          </Link>
        ))}
      </div>

      <Layout>{children}</Layout>
    </div>
  );
};

export default Sidebar;
