import { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--tv-bg)', width: '100%' }}>
      <Navbar />
      <main style={{ width: '100%' }}>{children}</main>
    </div>
  );
};
