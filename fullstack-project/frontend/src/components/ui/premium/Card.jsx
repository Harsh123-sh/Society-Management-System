import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

/**
 * Premium Card Component
 * Premium glassmorphism card with multiple styles
 */

const cardVariants = cva(
  'rounded-xl transition-all duration-300 overflow-hidden',
  {
    variants: {
      variant: {
        // Solid background with border
        solid:
          'bg-surface border border-border shadow-sm hover:shadow-lg hover:translate-y-[-4px]',

        // Glass effect with blur
        glass:
          'glass shadow-sm hover:shadow-lg hover:translate-y-[-4px] backdrop-blur-md',

        // Elevated card with strong shadow
        elevated:
          'bg-surface border border-border shadow-md hover:shadow-xl hover:translate-y-[-6px]',

        // Flat - minimal styling
        flat: 'bg-surface-secondary border border-border-light hover:bg-surface-tertiary',

        // Gradient background
        gradient:
          'bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 dark:border-primary-light/20',

        // Interactive - for clickable cards
        interactive:
          'bg-surface border border-border shadow-sm cursor-pointer hover:shadow-lg hover:translate-y-[-4px] active:scale-98',
      },

      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
        '2xl': 'p-10',
      },

      size: {
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
      },
    },

    defaultVariants: {
      variant: 'solid',
      padding: 'lg',
      size: 'md',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

/**
 * Card Container Component
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, size, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(cardVariants({ variant, padding, size }), className)}
      {...props}
    />
  )
);

Card.displayName = 'Card';

/**
 * Card Header Component
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('border-b border-border pb-4 mb-4', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

/**
 * Card Title Component
 */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={clsx('text-lg font-semibold text-text', className)}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

/**
 * Card Description Component
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={clsx('text-sm text-text-secondary', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

/**
 * Card Content Component
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('', className)}
    {...props}
  />
));

CardContent.displayName = 'CardContent';

/**
 * Card Footer Component
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('border-t border-border pt-4 mt-4 flex gap-2', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
export type { CardProps };
