'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, BrainCircuit, Sparkles } from 'lucide-react';

interface ThinkBoxProps {
  content: string;
  thinkingEnded: boolean;
}

const ThinkBox = ({ content, thinkingEnded }: ThinkBoxProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (thinkingEnded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }, [thinkingEnded]);

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-[#d7f35b]/20 bg-[#d7f35b]/[0.04] shadow-[0_12px_40px_rgba(215,243,91,0.04)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-black/90 transition duration-200 hover:bg-[#d7f35b]/[0.06] dark:text-white/90"
      >
        <div className="flex items-center space-x-2">
          {thinkingEnded ? (
            <Sparkles size={18} className="text-[#86a500] dark:text-[#d7f35b]" />
          ) : (
            <BrainCircuit size={18} className="animate-pulse text-[#86a500] dark:text-[#d7f35b]" />
          )}
          <p className="text-sm font-semibold">{thinkingEnded ? 'Thought process' : 'Vedaix is thinking'}</p>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-black/70 dark:text-white/70" />
        ) : (
          <ChevronDown size={18} className="text-black/70 dark:text-white/70" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-[#d7f35b]/10 bg-black/[0.02] px-4 py-3 text-sm leading-relaxed text-black/70 whitespace-pre-wrap dark:bg-white/[0.02] dark:text-white/70">
          {content}
        </div>
      )}
    </div>
  );
};

export default ThinkBox;
