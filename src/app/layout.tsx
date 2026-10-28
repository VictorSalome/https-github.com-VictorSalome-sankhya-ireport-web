import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sankhya iReport Web Designer | JasperReports 5.6.0',
  description: 'Web-based visual JRXML designer for Sankhya ERP reports reverse-engineered from JasperReports 5.6.0 engine.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
