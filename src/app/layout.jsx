import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'QuantumScheduler',
  description: 'A modern OS Scheduling Algorithm Simulator which visualize, calculate, and optimize process schedules in real-time make every CPU cycle count!!',
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-body antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
