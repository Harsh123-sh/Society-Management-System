import React from 'react';

function PremiumLayout({ children }) {
  return (
    <div className="min-h-screen p-6 sm:p-8 md:p-10" style={{ background: 'var(--page-bg)' }}>
      <main className="mx-auto max-w-[1400px]">
        {children}
      </main>
    </div>
  );
}

export default PremiumLayout;
