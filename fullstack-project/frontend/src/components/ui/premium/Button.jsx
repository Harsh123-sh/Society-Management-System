import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

/**
 * Premium Button Component
 * Apple + Linear inspired with glassmorphism support
 */

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer relative overflow-hidden',
  {
    variants: {
      variant: {
        // Primary - Solid gradient button with glow
        primary:
          'bg-primary text-white hover:shadow-glow hover:scale-105 active:scale-95 dark:bg-primary-light',

        // Secondary - Subtle background
        secondary:
          'bg-surface-secondary text-text border border-border hover:bg-hover-bg active:bg-active-bg dark:border-border-light',

        // Tertiary - Minimal style
        tertiary:
          'text-text hover:bg-hover-bg active:bg-active-bg dark:text-white',

        // Danger - Red alert style
        danger:
          'bg-danger text-white hover:shadow-glow hover:scale-105 active:scale-95',

        // Success - Green confirmation
        success:
          'bg-success text-white hover:shadow-glow hover:scale-105 active:scale-95',

        // Outline - Border only
        outline:
          'border-2 border-primary text-primary hover:bg-primary hover:text-white active:scale-95',

        // Glass - Glassmorphism style
        glass:
          'glass text-text hover:shadow-lg active:scale-95 dark:text-white backdrop-blur-md',

        // Ghost - No background
        ghost:
          'text-primary hover:bg-selected-bg active:scale-95 dark:text-primary-light',
      },

      size: {
        xs: 'h-7 px-2 text-xs rounded-sm gap-1',
        sm: 'h-8 px-2 text-sm rounded-md gap-1.5',
        md: 'h-9 px-3 text-sm rounded-md gap-2',
        lg: 'h-10 px-4 text-base rounded-lg gap-2',
        xl: 'h-12 px-6 text-base rounded-lg gap-3',
        '2xl': 'h-14 px-8 text-lg rounded-xl gap-3',
        icon: 'h-9 w-9 p-0 rounded-md',
        'icon-lg': 'h-10 w-10 p-0 rounded-lg',
      },

      disabled: {
        true: 'opacity-50 cursor-not-allowed pointer-events-none',
        false: '',
      },

      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
      disabled: false,
      fullWidth: false,
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      disabled,
      fullWidth,
      isLoading = false,
      icon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          buttonVariants({
            variant,
            size,
            disabled: disabled || isLoading,
            fullWidth,
          }),
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-2">{children}</span>
          </>
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
