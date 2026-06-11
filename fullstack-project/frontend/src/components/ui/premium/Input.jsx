import React from 'react';
import clsx from 'clsx';

/**
 * Premium Input Component
 * Modern floating label input with validation
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'glass' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      success,
      icon,
      rightIcon,
      variant = 'default',
      size = 'md',
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!props.defaultValue);

    const sizeClasses = {
      sm: 'h-8 text-sm px-2.5 py-1.5',
      md: 'h-9 text-sm px-3 py-2',
      lg: 'h-10 text-base px-4 py-2.5',
    };

    const variantClasses = {
      default:
        'bg-surface border border-border hover:border-primary focus:border-primary focus:shadow-lg',
      glass:
        'glass bg-glass border-glass-border hover:border-primary/50 focus:border-primary focus:shadow-lg backdrop-blur-md',
      filled:
        'bg-surface-secondary border border-transparent hover:bg-surface focus:bg-surface focus:border-primary focus:shadow-lg',
    };

    const baseClasses =
      'w-full rounded-md transition-all duration-200 font-medium placeholder-text-tertiary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const errorClasses = error
      ? 'border-danger focus:border-danger focus:shadow-danger/25'
      : '';
    const successClasses = success
      ? 'border-success focus:border-success focus:shadow-success/25'
      : '';

    return (
      <div className="w-full">
        {label && (
          <label
            className={clsx(
              'block text-sm font-medium mb-2 transition-colors duration-200',
              isFocused || hasValue ? 'text-primary' : 'text-text-secondary'
            )}
          >
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-text-secondary flex items-center pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={clsx(
              baseClasses,
              variantClasses[variant],
              sizeClasses[size],
              icon && 'pl-9',
              rightIcon && 'pr-9',
              errorClasses,
              successClasses,
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              setHasValue(!!e.target.value);
              props.onBlur?.(e);
            }}
            onChange={(e) => {
              setHasValue(!!e.target.value);
              props.onChange?.(e);
            }}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-text-secondary flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}

          {success && !error && (
            <div className="absolute right-3 text-success">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          {error && (
            <div className="absolute right-3 text-danger">
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18.101 12.93a10 10 0 11-1.414-1.414L18.101 12.93zM10 15a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {error && (
          <p className="text-danger text-xs mt-1.5 font-medium">{error}</p>
        )}

        {props.maxLength && (
          <p className="text-text-tertiary text-xs mt-1">
            {(props.value as string)?.length || 0}/{props.maxLength}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
