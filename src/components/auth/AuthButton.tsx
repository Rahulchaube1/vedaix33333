'use client';

import { LogIn, LogOut, UserRound, ShieldCheck } from 'lucide-react';
import { getProviders, signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

const AuthButton = () => {
  const { data: session, status } = useSession();
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getProviders()
      .then((provs) => {
        if (provs) setAvailableProviders(provs);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  if (status === 'loading') {
    return (
      <div className="h-9 w-full animate-pulse rounded-lg bg-light-200 dark:bg-dark-200" />
    );
  }

  if (!session?.user) {
    const providerKeys = Object.keys(availableProviders);

    // If neither provider is configured, show subtle guest badge
    if (loaded && providerKeys.length === 0) {
      return (
        <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-light-200 dark:border-dark-200 bg-light-secondary/30 dark:bg-dark-secondary/30 px-3 py-1.5 text-xs text-black/50 dark:text-white/50">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Local / Guest Mode</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 w-full">
        {(!loaded || availableProviders.google) && (
          <button
            type="button"
            onClick={() => {
              setBusyProvider('google');
              signIn('google').finally(() => setBusyProvider(null));
            }}
            disabled={busyProvider !== null}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-light-300 bg-light-primary px-3 py-2 text-xs font-semibold text-black transition hover:border-[#24A0ED] dark:border-dark-300 dark:bg-dark-primary dark:text-white disabled:opacity-60"
          >
            <LogIn size={14} />
            {busyProvider === 'google' ? 'Connecting Google...' : 'Continue with Google'}
          </button>
        )}

        {availableProviders.auth0 && (
          <button
            type="button"
            onClick={() => {
              setBusyProvider('auth0');
              signIn('auth0').finally(() => setBusyProvider(null));
            }}
            disabled={busyProvider !== null}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-light-300 bg-light-primary px-3 py-2 text-xs font-semibold text-black transition hover:border-[#EB5424] dark:border-dark-300 dark:bg-dark-primary dark:text-white disabled:opacity-60"
          >
            <LogIn size={14} />
            {busyProvider === 'auth0' ? 'Connecting Auth0...' : 'Continue with Auth0'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {session.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={session.user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#24A0ED] text-xs font-bold text-white">
          <UserRound size={15} />
        </span>
      )}
      <button
        type="button"
        onClick={() => signOut()}
        className="flex items-center gap-1.5 truncate text-xs text-black/60 transition hover:text-black dark:text-white/60 dark:hover:text-white"
        title="Click to sign out"
      >
        <span className="max-w-[120px] truncate">{session.user.name || session.user.email}</span>
        <LogOut size={13} />
      </button>
    </div>
  );
};

export default AuthButton;
