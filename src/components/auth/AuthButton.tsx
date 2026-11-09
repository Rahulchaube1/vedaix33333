'use client';

import { LogIn, LogOut, UserRound } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useState } from 'react';

const AuthButton = () => {
  const { data: session, status } = useSession();
  const [busy, setBusy] = useState(false);

  if (status === 'loading') {
    return <div className="h-9 w-full animate-pulse rounded-lg bg-light-200 dark:bg-dark-200" />;
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => {
          setBusy(true);
          signIn('google').finally(() => setBusy(false));
        }}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-light-300 bg-light-primary px-3 py-2 text-sm font-semibold text-black transition hover:border-[#86a500] dark:border-dark-300 dark:bg-dark-primary dark:text-white"
      >
        <LogIn size={15} />
        {busy ? 'Opening Google...' : 'Continue with Google'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {session.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d7f35b] text-xs font-bold text-[#17200e]">
          <UserRound size={15} />
        </span>
      )}
      <button
        type="button"
        onClick={() => signOut()}
        className="flex items-center gap-1.5 truncate text-xs text-black/60 transition hover:text-black dark:text-white/60 dark:hover:text-white"
      >
        <span className="max-w-[120px] truncate">{session.user.name || session.user.email}</span>
        <LogOut size={13} />
      </button>
    </div>
  );
};

export default AuthButton;
