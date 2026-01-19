import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BromeoLIVE Command Center',
  description: 'Commands, kanaalpunten en bits acties voor BromeoLIVE.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="bg-bromeo">{children}</body>
    </html>
  );
}
