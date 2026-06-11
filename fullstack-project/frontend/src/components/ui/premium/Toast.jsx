import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Toast/Notification System
 * Global notifications with glassmorphism styling
 */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, options?: Partial<Toast>) => string;
  error: (message: string, options?: Partial<Toast>) => string;
  warning: (message: string, options?: Partial<Toast>) => string;
  info: (message: string, options?: Partial<Toast>) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Provider
 * Wrap your app with this provider to enable toast notifications
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
        variant: toast.variant ?? 'info',
      };

      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message: string, options?: Partial<Toast>) =>
      addToast({ ...options, message, variant: 'success' }),
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: Partial<Toast>) =>
      addToast({ ...options, message, variant: 'error' }),
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: Partial<Toast>) =>
      addToast({ ...options, message, variant: 'warning' }),
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: Partial<Toast>) =>
      addToast({ ...options, message, variant: 'info' }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * useToast Hook
 * Use this hook to access toast functions in any component
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Toast Container
 * Renders all active toasts
 */
const ToastContainer: React.FC<{
  toasts: Toast[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Individual Toast Item
 */
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const colorMap = {
    success: {
      icon: 'text-success',
      bg: 'bg-success/10 border-success/20 hover:bg-success/15',
    },
    error: {
      icon: 'text-danger',
      bg: 'bg-danger/10 border-danger/20 hover:bg-danger/15',
    },
    warning: {
      icon: 'text-warning',
      bg: 'bg-warning/10 border-warning/20 hover:bg-warning/15',
    },
    info: {
      icon: 'text-primary',
      bg: 'bg-primary/10 border-primary/20 hover:bg-primary/15',
    },
  };

  const colors = colorMap[toast.variant || 'info'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, x: 400 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 400 }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 100,
      }}
      className="pointer-events-auto"
    >
      <div
        className={clsx(
          'rounded-xl border backdrop-blur-xl px-4 py-3 flex items-start gap-3 min-w-[300px] max-w-md shadow-xl transition-colors',
          colors.bg
        )}
      >
        {/* Icon */}
        <div
          className={clsx(
            'text-lg font-bold flex-shrink-0 mt-1',
            colors.icon
          )}
        >
          {iconMap[toast.variant || 'info']}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="font-semibold text-text mb-1 truncate">
              {toast.title}
            </h4>
          )}
          <p className="text-sm text-text-secondary break-words">
            {toast.message}
          </p>
        </div>

        {/* Action Button */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onRemove(toast.id);
            }}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0 whitespace-nowrap"
          >
            {toast.action.label}
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={() => onRemove(toast.id)}
          className="text-text-secondary hover:text-text transition-colors flex-shrink-0 text-lg leading-none"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

export { ToastContainer };
