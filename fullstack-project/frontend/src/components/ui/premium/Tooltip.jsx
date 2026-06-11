import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

/**
 * Tooltip Component
 * Premium tooltips with smooth animations and multiple positions
 */

type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';
type TooltipVariant = 'default' | 'dark' | 'light';

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: React.ReactNode;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  delay?: number;
  maxWidth?: string;
  arrow?: boolean;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
};

const arrowClasses: Record<TooltipPosition, string> = {
  top: 'bottom-[-4px] left-1/2 -translate-x-1/2 rotate-45',
  right: 'left-[-4px] top-1/2 -translate-y-1/2 rotate-45',
  bottom: 'top-[-4px] left-1/2 -translate-x-1/2 rotate-45',
  left: 'right-[-4px] top-1/2 -translate-y-1/2 rotate-45',
};

const variantClasses: Record<TooltipVariant, { bg: string; text: string }> = {
  default: {
    bg: 'bg-gray-900 dark:bg-white',
    text: 'text-white dark:text-gray-900',
  },
  dark: {
    bg: 'bg-gray-950',
    text: 'text-white',
  },
  light: {
    bg: 'bg-white',
    text: 'text-gray-900 shadow-lg border border-gray-200',
  },
};

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      position = 'top',
      variant = 'default',
      delay = 200,
      maxWidth = '200px',
      arrow = true,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
      const id = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      setTimeoutId(id);
    };

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsVisible(false);
    };

    const colors = variantClasses[variant];

    return (
      <div
        ref={ref}
        className={clsx('relative inline-block w-fit', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Trigger */}
        <div className="inline-block">{children}</div>

        {/* Tooltip Content */}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={clsx(
                'absolute whitespace-nowrap z-50 px-3 py-2 rounded-lg text-sm font-medium pointer-events-none',
                positionClasses[position],
                colors.bg,
                colors.text
              )}
              style={{ maxWidth }}
            >
              {/* Arrow */}
              {arrow && (
                <div
                  className={clsx(
                    'absolute w-2 h-2',
                    colors.bg.replace('bg-', 'bg-'),
                    arrowClasses[position]
                  )}
                  style={{
                    backgroundColor: variant === 'light' ? 'white' : undefined,
                  }}
                />
              )}

              {/* Text */}
              <div className="relative z-10">{content}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };
export type { TooltipProps, TooltipPosition, TooltipVariant };
