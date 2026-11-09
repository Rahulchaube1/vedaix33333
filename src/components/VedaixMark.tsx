'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const VedaixMark = ({
  showWordmark = true,
  className,
}: {
  showWordmark?: boolean;
  className?: string;
}) => {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-sky-400 to-indigo-500 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.22)]">
        <Sparkles size={17} strokeWidth={2.2} />
      </span>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-slate-100">
          Vedaix
        </span>
      )}
    </span>
  );
};

export default VedaixMark;
