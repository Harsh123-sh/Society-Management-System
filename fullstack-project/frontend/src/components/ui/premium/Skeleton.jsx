import React from 'react';
import clsx from 'clsx';

/**
 * Skeleton Loader Component
 * Loading placeholders with shimmer animation
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'rectangular',
      width,
      height,
      count = 1,
      className,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      text: 'rounded-md h-4 w-full',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };

    const defaultHeight = {
      text: 16,
      circular: 40,
      rectangular: 80,
    };

    const skeletons = Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        ref={i === 0 ? ref : null}
        className={clsx(
          'bg-surface-secondary animate-shimmer bg-gradient-to-r from-surface-secondary via-surface to-surface-secondary',
          variantClasses[variant],
          className
        )}
        style={{
          width: width || (variant === 'text' ? '100%' : undefined),
          height: height || `${defaultHeight[variant]}px`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite',
        }}
        {...props}
      />
    ));

    return <>{count === 1 ? skeletons[0] : <div className="space-y-2">{skeletons}</div>}</>;
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Skeleton Card Component
 * Loading state for card content
 */
const SkeletonCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('space-y-4 p-6', className)}
      {...props}
    >
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="rectangular" height={120} />
    </div>
  )
);

SkeletonCard.displayName = 'SkeletonCard';

/**
 * Skeleton Table Component
 * Loading state for table content
 */
const SkeletonTable = React.forwardRef<
  HTMLDivElement,
  {
    rows?: number;
    columns?: number;
  } & React.HTMLAttributes<HTMLDivElement>
>(({ rows = 5, columns = 4, className, ...props }, ref) => (
  <div ref={ref} className={clsx('space-y-3', className)} {...props}>
    <div className="flex gap-3">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" width="100%" height={20} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-3">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton
            key={j}
            variant="text"
            width="100%"
            height={40}
          />
        ))}
      </div>
    ))}
  </div>
));

SkeletonTable.displayName = 'SkeletonTable';

export { Skeleton, SkeletonCard, SkeletonTable };
export type { SkeletonProps };
