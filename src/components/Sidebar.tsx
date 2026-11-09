'use client';

import { cn } from '@/lib/utils';
import {
  BookOpenText,
  Home,
  Search,
  SquarePen,
  Settings,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import React, { useState, type ReactNode } from 'react';
import Layout from './Layout';
import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import SettingsButton from './Settings/SettingsButton';
import VedaixMark from './VedaixMark';

const VerticalIconContainer = ({ children }: { children: ReactNode }) => {
  return <div className="flex w-full flex-col items-stretch gap-1">{children}</div>;
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const segments = useSelectedLayoutSegments();
  const [isOpen, setIsOpen] = useState<boolean>(true);

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

  return (
    <div>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-r border-white/[0.07]">
        <div className="flex grow flex-col justify-between gap-y-5 overflow-y-auto bg-[#111318] px-3 py-5 shadow-2xl shadow-black/20">
          <div className="flex w-full flex-col gap-6">
            <a href="/" className="px-2 py-1">
              <VedaixMark />
            </a>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl bg-white/[0.07] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.12]"
            >
              <Plus size={18} />
              <span>New research</span>
            </Link>
          </div>
          <VerticalIconContainer>
            {navLinks.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                aria-current={link.active ? 'page' : undefined}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition duration-200',
                  link.active
                    ? 'bg-white/[0.1] text-white'
                    : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90',
                )}
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </Link>
            ))}
          </VerticalIconContainer>

          <SettingsButton />
        </div>
      </div>

      <div className="fixed bottom-0 w-full z-50 flex flex-row items-center gap-x-6 bg-light-secondary dark:bg-dark-secondary px-4 py-4 shadow-sm lg:hidden">
        {navLinks.map((link, i) => (
          <Link
            href={link.href}
            key={i}
            className={cn(
              'relative flex flex-col items-center space-y-1 text-center w-full',
              link.active
                ? 'text-black dark:text-white'
                : 'text-black dark:text-white/70',
            )}
          >
            {link.active && (
              <div className="absolute top-0 -mt-4 h-1 w-full rounded-b-lg bg-black dark:bg-white" />
            )}
            <link.icon />
            <p className="text-xs">{link.label}</p>
          </Link>
        ))}
      </div>

      <Layout>{children}</Layout>
    </div>
  );
};

export default Sidebar;
