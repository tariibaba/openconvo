import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'react-hot-toast';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { QueryClient, QueryClientProvider } from 'react-query';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';

import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

function App({ Component, pageProps }: AppProps<{}>) {
  const queryClient = new QueryClient();

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
      <Analytics />
    </>
  );
}

export default appWithTranslation(App);
