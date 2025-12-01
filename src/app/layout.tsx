
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ThemeProvider } from '@/components/theme-provider';
import { QuickContactButton } from '@/components/quick-contact-button';
import { cn } from '@/lib/utils';


export const metadata: Metadata = {
  title: {
    default: 'Castillo Health & Aesthetics',
    template: `%s | Castillo Health & Aesthetics`,
  },
  description:
    'Hassle-free booking for general medicine and aesthetic treatments in the Philippines. Expert care by Dr. Katheryne Castillo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'font-body antialiased flex flex-col min-h-dvh'
        )}
      >
        <ThemeProvider defaultTheme="system">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
          <QuickContactButton />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
