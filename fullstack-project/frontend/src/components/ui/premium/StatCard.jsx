import React from 'react';
import { motion } from 'framer-motion';

function StatCard({ title, value, icon, trend, tone = 'primary' }) {
  const toneMap = {
    primary: 'bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white',
    neutral: 'bg-white text-[#0F172A] border',
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-[24px] p-4 shadow-md border border-[var(--border-default)] ${tone === 'primary' ? 'bg-white dark:bg-[var(--card)]' : 'bg-white'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{title}</p>
          <div className="mt-2 flex items-center gap-3">
            <h3 className="text-2xl font-semibold text-[var(--text-main)]">{value}</h3>
            {trend && <div className="text-sm text-[var(--text-secondary)]">{trend}</div>}
          </div>
        </div>
        <div className="h-12 w-12 shrink-0 rounded-xl bg-[linear-gradient(135deg,#eef2ff,#f5f3ff)] grid place-items-center text-[#4F46E5]">{icon}</div>
      </div>
    </motion.article>
  );
}

export default StatCard;
