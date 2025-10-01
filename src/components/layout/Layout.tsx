import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  useEffect(() => {
    if (!isMobileNavOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileNav();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [closeMobileNav, isMobileNavOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:h-dvh lg:flex-row lg:overflow-hidden">
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:flex-none lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white lg:overflow-y-auto lg:pb-6 lg:pt-6">
          <Sidebar onNavigate={closeMobileNav} />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:min-h-0">
          <Header onOpenMenu={() => setIsMobileNavOpen(true)} />
          <main className="flex-1 w-full max-w-full overflow-x-hidden px-4 pb-12 pt-6 sm:px-6 lg:min-h-0 lg:overflow-y-auto lg:px-10">
            {children}
          </main>
        </div>
      </div>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="flex-1 bg-slate-900/60"
            aria-label="Fechar menu"
            onClick={closeMobileNav}
          />
          <div className="relative flex h-dvh w-72 max-w-[85vw] flex-col bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <span className="text-sm font-semibold text-ink">Menu</span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMobileNav}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-muted transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Fechar menu lateral"
              >
                <span aria-hidden>×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6 pt-4">
              <Sidebar isMobile onNavigate={closeMobileNav} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};