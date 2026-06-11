import React from 'react';
import { Button } from './Button';
import clsx from 'clsx';

/**
 * EmptyState Component
 * Premium empty state illustrations for various scenarios
 */

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode | string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg';
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      icon,
      title,
      description,
      action,
      secondaryAction,
      size = 'md',
      className,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'py-8',
      md: 'py-12',
      lg: 'py-20',
    };

    const iconSizeClasses = {
      sm: 'text-4xl mb-3',
      md: 'text-6xl mb-4',
      lg: 'text-8xl mb-6',
    };

    const titleSizeClasses = {
      sm: 'text-lg',
      md: 'text-2xl',
      lg: 'text-3xl',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'flex flex-col items-center justify-center text-center',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {/* Icon */}
        {icon && (
          <div className={clsx(iconSizeClasses[size])}>
            {typeof icon === 'string' ? icon : icon}
          </div>
        )}

        {/* Title */}
        <h3
          className={clsx(
            'font-bold text-text mb-2',
            titleSizeClasses[size]
          )}
        >
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-text-secondary mb-6 max-w-sm">
            {description}
          </p>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex gap-3 flex-wrap justify-center">
            {action && (
              <Button
                variant={action.variant || 'primary'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}

            {secondaryAction && (
              <Button
                variant="secondary"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

/**
 * Predefined Empty State Variants
 */

const EmptySearchResults = (props: Omit<EmptyStateProps, 'icon' | 'title'>) => (
  <EmptyState
    icon="🔍"
    title="No results found"
    description="Try adjusting your search terms or filters"
    {...props}
  />
);

const EmptyNoData = (props: Omit<EmptyStateProps, 'icon' | 'title'>) => (
  <EmptyState
    icon="📭"
    title="No data available"
    description="There's nothing to show here yet"
    {...props}
  />
);

const EmptyNoPermission = (props: Omit<EmptyStateProps, 'icon' | 'title'>) => (
  <EmptyState
    icon="🔒"
    title="Access Denied"
    description="You don't have permission to view this content"
    {...props}
  />
);

const EmptyServerError = (props: Omit<EmptyStateProps, 'icon' | 'title'>) => (
  <EmptyState
    icon="⚠️"
    title="Something went wrong"
    description="We encountered an error loading this content"
    {...props}
  />
);

const EmptyNoNotifications = (props: Omit<EmptyStateProps, 'icon' | 'title'>) => (
  <EmptyState
    icon="🔔"
    title="No notifications"
    description="You're all caught up!"
    {...props}
  />
);

const EmptyNoMessages = (props: Omit<EmptyStateProps, 'icon' | 'title'>) => (
  <EmptyState
    icon="💬"
    title="No messages"
    description="Start a conversation with someone"
    {...props}
  />
);

const EmptyNoMembers = (props: Omit<EmptyStateProps, 'icon' | 'title'>) => (
  <EmptyState
    icon="👥"
    title="No members"
    description="Invite people to get started"
    {...props}
  />
);

const EmptyOffline = (props: Omit<EmptyStateProps, 'icon' | 'title'>) => (
  <EmptyState
    icon="📡"
    title="You're offline"
    description="Check your internet connection and try again"
    {...props}
  />
);

export {
  EmptyState,
  EmptySearchResults,
  EmptyNoData,
  EmptyNoPermission,
  EmptyServerError,
  EmptyNoNotifications,
  EmptyNoMessages,
  EmptyNoMembers,
  EmptyOffline,
};

export type { EmptyStateProps };
