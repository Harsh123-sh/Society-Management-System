import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

/**
 * Premium Badge Component
 * Status indicators with multiple styles
 */

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors duration-200',
  {
    variants: {
      variant: {
        // Default - primary color
        primary: 'bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary-light',

        // Success - green
        success: 'bg-success/15 text-success dark:bg-success/20',

        // Warning - orange/yellow
        warning: 'bg-warning/15 text-warning dark:bg-warning/20',

        // Danger - red
        danger: 'bg-danger/15 text-danger dark:bg-danger/20',

        // Info - blue
        info: 'bg-info/15 text-info dark:bg-info/20',

        // Secondary - gray
        secondary: 'bg-surface-secondary text-text-secondary border border-border',

        // Outline - bordered style
        outline: 'border border-primary text-primary dark:border-primary-light dark:text-primary-light',

        // Gradient - premium look
        gradient:
          'bg-gradient-to-r from-primary/20 to-secondary/20 text-primary dark:text-primary-light border border-primary/30 dark:border-primary/50',
      },

      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
      },

      shape: {
        rounded: 'rounded-md',
        pill: 'rounded-full',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shape: 'pill',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
  children?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, shape, icon, dot, children, ...props }, ref) => (
    <span
      ref={ref}
      className={clsx(badgeVariants({ variant, size, shape }), className)}
      {...props}
    >
      {dot && <div className="w-1.5 h-1.5 bg-current rounded-full flex-shrink-0" />}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
);

Badge.displayName = 'Badge';

/**
 * Status Badge - specialized for status indicators
 */
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'approved' | 'rejected';
  showDot?: boolean;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showDot = true, className, children, ...props }, ref) => {
    const statusConfig = {
      active: { variant: 'success' as const, label: 'Active', dot: true },
      inactive: { variant: 'secondary' as const, label: 'Inactive', dot: true },
      pending: { variant: 'warning' as const, label: 'Pending', dot: true },
      completed: { variant: 'success' as const, label: 'Completed', dot: true },
      failed: { variant: 'danger' as const, label: 'Failed', dot: true },
      approved: { variant: 'success' as const, label: 'Approved', dot: true },
      rejected: { variant: 'danger' as const, label: 'Rejected', dot: true },
    };

    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        dot={showDot ? config.dot : false}
        className={className}
        {...props}
      >
        {children || config.label}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { Badge, StatusBadge, badgeVariants };
export type { BadgeProps, StatusBadgeProps };
