'use client';

import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import EmptyChatMessageInput from './EmptyChatMessageInput';
import { File } from './ChatWindow';
import Link from 'next/link';
import WeatherWidget from './WeatherWidget';
import NewsArticleWidget from './NewsArticleWidget';
import SettingsButtonMobile from '@/components/Settings/SettingsButtonMobile';
import {
  getShowNewsWidget,
  getShowWeatherWidget,
} from '@/lib/config/clientRegistry';

const EmptyChat = () => {
  const [showWeather, setShowWeather] = useState(() =>
    typeof window !== 'undefined' ? getShowWeatherWidget() : true,
  );
  const [showNews, setShowNews] = useState(() =>
    typeof window !== 'undefined' ? getShowNewsWidget() : true,
  );

  useEffect(() => {
    const updateWidgetVisibility = () => {
      setShowWeather(getShowWeatherWidget());
      setShowNews(getShowNewsWidget());
    };

    updateWidgetVisibility();

    window.addEventListener('client-config-changed', updateWidgetVisibility);
    window.addEventListener('storage', updateWidgetVisibility);

    return () => {
      window.removeEventListener(
        'client-config-changed',
        updateWidgetVisibility,
      );
      window.removeEventListener('storage', updateWidgetVisibility);
    };
  }, []);

  return (
    <div className="relative">
      <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5">
        <SettingsButtonMobile />
      </div>
      <div className="flex min-h-screen flex-col items-center justify-center px-2 pb-20 pt-10 sm:px-6 lg:pb-10">
        <div className="flex w-full max-w-[720px] flex-col items-center justify-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7f35b] text-2xl text-[#17200e] shadow-[0_0_40px_rgba(215,243,91,0.12)]">
            ✦
          </div>
          <div className="text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/40 dark:text-white/40">
              Search beyond the obvious
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-black dark:text-white sm:text-4xl">
              What do you want to know?
            </h2>
          </div>
          <EmptyChatMessageInput />
          <div className="flex flex-wrap justify-center gap-2 text-xs text-black/50 dark:text-white/50">
            <span className="rounded-full border border-light-200 px-3 py-1.5 dark:border-dark-200">Research a topic</span>
            <span className="rounded-full border border-light-200 px-3 py-1.5 dark:border-dark-200">Compare ideas</span>
            <span className="rounded-full border border-light-200 px-3 py-1.5 dark:border-dark-200">Find the latest</span>
          </div>
        </div>
        {(showWeather || showNews) && (
          <div className="flex flex-col w-full gap-4 mt-2 sm:flex-row sm:justify-center">
            {showWeather && (
              <div className="flex-1 w-full">
                <WeatherWidget />
              </div>
            )}
            {showNews && (
              <div className="flex-1 w-full">
                <NewsArticleWidget />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyChat;
