import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom';

/**
 * Premium Sidebar Component
 * Apple + Linear inspired floating sidebar with glass effect
 */

interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href: string;
  badge?: string | number;
  children?: SidebarItem[];
  divider?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  isOpen?: boolean;
  onClose?: () => void;
  logo?: React.ReactNode;
  logoText?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  footer?: React.ReactNode;
  className?: string;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      items,
      isOpen = true,
      onClose,
      logo,
      logoText,
      collapsed = false,
      onCollapsedChange,
      footer,
      className,
    },
    ref
  ) => {
    const location = useLocation();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
      const newExpanded = new Set(expandedItems);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      setExpandedItems(newExpanded);
    };

    const isActive = (href: string) => location.pathname === href;

    const sidebarVariants = {
      visible: { x: 0, opacity: 1 },
      hidden: { x: -280, opacity: 0 },
    };

    return (
      <>
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          ref={ref}
          className={clsx(
            'fixed left-0 top-0 h-screen z-40 flex flex-col',
            'bg-surface border-r border-border glass',
            'w-sidebar transition-all duration-300',
            collapsed && 'w-sidebar-collapsed',
            'lg:translate-x-0',
            className
          )}
          variants={sidebarVariants}
          initial={isOpen ? 'visible' : 'hidden'}
          animate={isOpen ? 'visible' : 'hidden'}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2">
                {logo && <div className="text-xl flex-shrink-0">{logo}</div>}
                {logoText && (
                  <span className="font-bold text-lg text-text truncate">
                    {logoText}
                  </span>
                )}
              </div>
            )}
            <button
              onClick={() => onCollapsedChange?.(!collapsed)}
              className="p-1.5 hover:bg-hover-bg rounded-md transition-colors duration-200 text-text-secondary hover:text-text"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              <svg
                className={clsx(
                  'w-5 h-5 transition-transform duration-300',
                  collapsed && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {items.map((item, index) => (
              <div key={item.id || index}>
                {item.divider && (
                  <div className="my-2 border-t border-border" />
                )}

                <SidebarMenuButton
                  item={item}
                  isActive={isActive(item.href)}
                  collapsed={collapsed}
                  expanded={expandedItems.has(item.id)}
                  onToggleExpand={() => toggleExpand(item.id)}
                />

                {/* Submenu */}
                <AnimatePresence>
                  {item.children && expandedItems.has(item.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-2 space-y-1 mt-1">
                        {item.children.map((child) => (
                          <SidebarMenuButton
                            key={child.id}
                            item={child}
                            isActive={isActive(child.href)}
                            collapsed={collapsed}
                            isSubmenu
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Footer */}
          {footer && (
            <div className="border-t border-border p-2">
              {footer}
            </div>
          )}
        </motion.aside>
      </>
    );
  }
);

Sidebar.displayName = 'Sidebar';

/**
 * Sidebar Menu Button Component
 */
interface SidebarMenuButtonProps {
  item: SidebarItem;
  isActive: boolean;
  collapsed?: boolean;
  expanded?: boolean;
  isSubmenu?: boolean;
  onToggleExpand?: () => void;
}

const SidebarMenuButton: React.FC<SidebarMenuButtonProps> = ({
  item,
  isActive,
  collapsed = false,
  expanded = false,
  isSubmenu = false,
  onToggleExpand,
}) => {
  const hasChildren = item.children && item.children.length > 0;

  const buttonContent = (
    <>
      {item.icon && (
        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-text-secondary group-hover:text-text transition-colors duration-200">
          {item.icon}
        </span>
      )}
      {!collapsed && (
        <span className="flex-1 text-sm font-medium truncate">
          {item.label}
        </span>
      )}
      {item.badge && !collapsed && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary dark:bg-primary/30">
          {item.badge}
        </span>
      )}
      {hasChildren && !collapsed && (
        <svg
          className={clsx(
            'w-4 h-4 transition-transform duration-200 text-text-secondary',
            expanded && 'rotate-90'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </>
  );

  if (hasChildren) {
    return (
      <button
        onClick={onToggleExpand}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
          'text-text-secondary hover:text-text hover:bg-hover-bg',
          isSubmenu && 'text-xs',
          'group'
        )}
      >
        {buttonContent}
      </button>
    );
  }

  return (
    <Link
      to={item.href}
      className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
        'text-sm font-medium',
        isActive
          ? 'bg-primary/15 text-primary dark:bg-primary/20'
          : 'text-text-secondary hover:text-text hover:bg-hover-bg',
        isSubmenu && 'text-xs pl-5',
        'group'
      )}
      title={collapsed ? item.label : undefined}
    >
      {buttonContent}
    </Link>
  );
};

export { Sidebar };
export type { SidebarProps, SidebarItem };
