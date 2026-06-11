import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

/**
 * Premium Topbar Component
 * Apple + Linear inspired floating topbar with glass effect
 */

interface TopbarAction {
  id: string;
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
  badge?: string | number;
  color?: 'default' | 'primary' | 'danger' | 'warning';
  menu?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    divider?: boolean;
  }>;
}

interface TopbarProps {
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  searchBar?: {
    placeholder?: string;
    onSearch?: (query: string) => void;
    value?: string;
  };
  actions?: TopbarAction[];
  profile?: {
    name: string;
    avatar?: string;
    role?: string;
    onLogout?: () => void;
  };
  className?: string;
  sticky?: boolean;
}

const Topbar = React.forwardRef<HTMLDivElement, TopbarProps>(
  (
    {
      leftContent,
      centerContent,
      rightContent,
      searchBar,
      actions,
      profile,
      className,
      sticky = true,
    },
    ref
  ) => {
    const [searchQuery, setSearchQuery] = useState(searchBar?.value || '');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    return (
      <div
        ref={ref}
        className={clsx(
          'glass h-topbar border-b border-border',
          'flex items-center justify-between px-6 gap-4',
          sticky && 'sticky top-0 z-30',
          'bg-surface/80 backdrop-blur-lg',
          className
        )}
      >
        {/* Left Content */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {leftContent && <div className="flex-shrink-0">{leftContent}</div>}
        </div>

        {/* Center - Search Bar */}
        {searchBar && (
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder={searchBar.placeholder || 'Search...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchBar.onSearch?.(e.target.value);
                }}
                className={clsx(
                  'w-full h-9 px-3 py-2 rounded-lg',
                  'bg-surface-secondary border border-border',
                  'text-sm text-text placeholder-text-tertiary',
                  'focus:outline-none focus:border-primary focus:shadow-lg',
                  'transition-all duration-200'
                )}
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        )}

        {centerContent && (
          <div className="flex-1 flex items-center justify-center">
            {centerContent}
          </div>
        )}

        {/* Right Content - Actions */}
        <div className="flex items-center gap-2">
          {actions?.map((action) => (
            <div key={action.id} className="relative">
              <TopbarActionButton
                action={action}
                isMenuOpen={openMenuId === action.id}
                onToggleMenu={() =>
                  setOpenMenuId(openMenuId === action.id ? null : action.id)
                }
              />

              {/* Action Menu */}
              <AnimatePresence>
                {action.menu && openMenuId === action.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={clsx(
                      'absolute right-0 mt-1 w-48 rounded-lg',
                      'glass border border-border shadow-lg',
                      'py-1 z-50'
                    )}
                  >
                    {action.menu.map((item, index) => (
                      <div key={`${action.id}-${index}`}>
                        {item.divider && (
                          <div className="border-t border-border my-1" />
                        )}
                        <button
                          onClick={() => {
                            item.onClick();
                            setOpenMenuId(null);
                          }}
                          className={clsx(
                            'w-full flex items-center gap-2 px-4 py-2 text-sm',
                            'text-text hover:bg-hover-bg transition-colors duration-200',
                            'text-left'
                          )}
                        >
                          {item.icon && (
                            <span className="flex-shrink-0 text-text-secondary">
                              {item.icon}
                            </span>
                          )}
                          <span>{item.label}</span>
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Profile Menu */}
          {profile && (
            <div className="relative">
              <TopbarProfileButton
                profile={profile}
                isMenuOpen={openMenuId === 'profile'}
                onToggleMenu={() =>
                  setOpenMenuId(openMenuId === 'profile' ? null : 'profile')
                }
              />

              {/* Profile Menu */}
              <AnimatePresence>
                {openMenuId === 'profile' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={clsx(
                      'absolute right-0 mt-1 w-56 rounded-lg',
                      'glass border border-border shadow-lg',
                      'p-3 z-50 space-y-2'
                    )}
                  >
                    <div className="px-2 py-2 border-b border-border">
                      <p className="text-sm font-semibold text-text">
                        {profile.name}
                      </p>
                      {profile.role && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          {profile.role}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        profile.onLogout?.();
                        setOpenMenuId(null);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-2 px-2 py-2 text-sm text-danger',
                        'hover:bg-danger/10 rounded-md transition-colors duration-200'
                      )}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
        </div>
      </div>
    );
  }
);

Topbar.displayName = 'Topbar';

/**
 * Topbar Action Button Component
 */
interface TopbarActionButtonProps {
  action: TopbarAction;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
}

const TopbarActionButton: React.FC<TopbarActionButtonProps> = ({
  action,
  isMenuOpen,
  onToggleMenu,
}) => {
  const colorClasses = {
    default: 'text-text-secondary hover:text-text hover:bg-hover-bg',
    primary: 'text-primary hover:text-primary-light hover:bg-primary/10',
    danger: 'text-danger hover:text-danger hover:bg-danger/10',
    warning: 'text-warning hover:text-warning hover:bg-warning/10',
  };

  return (
    <button
      onClick={() => (action.menu ? onToggleMenu?.() : action.onClick?.())}
      className={clsx(
        'relative p-2 rounded-lg transition-all duration-200',
        'flex items-center justify-center gap-1',
        colorClasses[action.color || 'default']
      )}
      title={action.label}
    >
      <span className="text-lg flex items-center justify-center">
        {action.icon}
      </span>
      {action.badge && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full animate-pulse" />
      )}
    </button>
  );
};

/**
 * Topbar Profile Button Component
 */
interface TopbarProfileButtonProps {
  profile: TopbarProps['profile'];
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
}

const TopbarProfileButton: React.FC<TopbarProfileButtonProps> = ({
  profile,
  onToggleMenu,
}) => {
  return (
    <button
      onClick={onToggleMenu}
      className={clsx(
        'flex items-center gap-2 px-2 py-1 rounded-lg',
        'hover:bg-hover-bg transition-colors duration-200',
        'text-text text-sm'
      )}
    >
      {profile?.avatar ? (
        <img
          src={profile.avatar}
          alt={profile.name}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
          {profile?.name?.[0]?.toUpperCase()}
        </div>
      )}
      <div className="hidden sm:block">
        <p className="text-xs font-medium text-text truncate max-w-[100px]">
          {profile?.name}
        </p>
      </div>
    </button>
  );
};

export { Topbar };
export type { TopbarProps, TopbarAction };
