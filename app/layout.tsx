import type { Metadata } from 'next';
import './globals.css';
import ClientProvider from '@/app/components/ClientProvider';

export const metadata: Metadata = {
  title: 'QuarantineCare - Facility Management',
  description: 'Virus quarantine facility management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
