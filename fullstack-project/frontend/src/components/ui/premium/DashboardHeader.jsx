import React from 'react';
import ThemeToggle from '../../ThemeToggle';
import LanguageSelector from '../../LanguageSelector';
import PremiumNotificationButton from '../../common/PremiumNotificationButton';

function DashboardHeader({ user = { name: 'Ramesh Patel' }, society = { name: 'Lakeview Residency' } }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Good Morning,</p>
          <h1 className="text-2xl font-semibold text-[var(--text-main)]">{user.name}</h1>
          <p className="text-xs text-[var(--text-secondary)]">{society.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <input placeholder="Search" className="rounded-[18px] border border-[var(--border-default)] px-4 py-2 text-sm outline-none bg-[var(--input-bg)] text-[var(--input-text)]" />
        </div>
        <LanguageSelector />
        <ThemeToggle />
        <PremiumNotificationButton />
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] grid place-items-center text-white font-semibold">{(user.name || 'U').split(' ').map(n => n[0]).slice(0,2).join('')}</div>
      </div>
    </header>
  );
}

export default DashboardHeader;
