import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

/**
 * Premium Modal Component
 * Glassmorphism modal with smooth animations
 */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeButton?: boolean;
  closable?: boolean;
  className?: string;
  overlayClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      footer,
      size = 'md',
      closeButton = true,
      closable = true,
      className,
      overlayClassName,
    },
    ref
  ) => {
    // Lock body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = 'unset';
        };
      }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
      if (!isOpen) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closable) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closable, onClose]);

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className={clsx(
                'fixed inset-0 z-400 backdrop-blur-glass',
                overlayClassName
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => closable && onClose()}
            />

            {/* Modal */}
            <motion.div
              ref={ref}
              className={clsx(
                'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                'z-400 w-full px-4 sm:px-0'
              )}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                duration: 0.3,
                ease: 'easeOut',
              }}
            >
              <div
                className={clsx(
                  'glass rounded-2xl shadow-elevated',
                  'overflow-hidden',
                  sizeClasses[size],
                  'w-full',
                  className
                )}
              >
                {/* Header */}
                {(title || closeButton) && (
                  <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-surface/50">
                    {title && (
                      <h2 className="text-xl font-semibold text-text">
                        {title}
                      </h2>
                    )}
                    {closeButton && (
                      <button
                        onClick={onClose}
                        className={clsx(
                          'ml-auto text-text-secondary hover:text-text',
                          'transition-colors duration-200',
                          'p-1 hover:bg-hover-bg rounded-md'
                        )}
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="border-t border-border px-6 py-4 flex gap-2 justify-end bg-surface-secondary/50">
                    {footer}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

Modal.displayName = 'Modal';

/**
 * useModal Hook - for managing modal state
 */
const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = React.useState(initialOpen);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
};

export { Modal, useModal };
export type { ModalProps };
