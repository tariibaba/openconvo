import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { QueryClient, QueryClientProvider } from 'react-query';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';

import '@/styles/globals.css';
import { getGoogleAnalyticsClientId, setUserProperties } from 'firebase/analytics';
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';

const inter = Inter({ subsets: ['latin'] });

function App({ Component, pageProps }: AppProps<{}>) {
  const queryClient = new QueryClient();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    const key = process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY!;
    const firebaseConfig = JSON.parse(key);
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
