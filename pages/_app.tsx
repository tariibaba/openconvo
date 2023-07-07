import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { QueryClient, QueryClientProvider } from 'react-query';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';

import { firebaseConfig } from '../firebase.config';

import '@/styles/globals.css';
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';

const inter = Inter({ subsets: ['latin'] });

function App({ Component, pageProps }: AppProps<{}>) {
  const queryClient = new QueryClient();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);
  }, []);

  return (
    <>
      <div className={inter.className}>
        <Toaster />
        <QueryClientProvider client={queryClient}>
          <HotkeysProvider>
            <Component {...pageProps} />
          </HotkeysProvider>
        </QueryClientProvider>
      </div>
    </>
  );
}

export default appWithTranslation(App);
