import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'StockFlow — Smart Inventory & Supply Chain',
  description: 'End-to-end inventory and supply chain management. Monitor stock levels, forecast demand, manage suppliers, and automate alerts.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-slate-950 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
