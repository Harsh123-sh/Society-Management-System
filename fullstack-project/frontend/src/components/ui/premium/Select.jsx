import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

/**
 * Premium Select/Dropdown Component
 * Modern select with search, custom styling, and animations
 */

interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  error?: string;
  searchable?: boolean;
  clearable?: boolean;
  variant?: 'default' | 'glass' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder = 'Select an option',
      value,
      onChange,
      error,
      searchable = false,
      clearable = true,
      variant = 'default',
      size = 'md',
      icon,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sizeClasses = {
      sm: 'h-8 text-sm px-2.5 py-1.5',
      md: 'h-9 text-sm px-3 py-2',
      lg: 'h-10 text-base px-4 py-2.5',
    };

    const variantClasses = {
      default:
        'bg-surface border border-border hover:border-primary focus:border-primary',
      glass:
        'glass bg-glass border-glass-border hover:border-primary/50 focus:border-primary backdrop-blur-md',
      filled:
        'bg-surface-secondary border border-transparent hover:bg-surface focus:bg-surface focus:border-primary',
    };

    return (
      <div ref={ref} className="w-full">
        {label && (
          <label
            className={clsx(
              'block text-sm font-medium mb-2 transition-colors duration-200',
              isFocused || value ? 'text-primary' : 'text-text-secondary'
            )}
          >
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        <div ref={containerRef} className="relative">
          {/* Select Button */}
          <motion.button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={clsx(
              'w-full flex items-center gap-2 rounded-md transition-all duration-200',
              'text-left focus:outline-none focus:shadow-lg',
              variantClasses[variant],
              sizeClasses[size],
              isOpen && 'border-primary shadow-lg',
              error && 'border-danger focus:border-danger'
            )}
            whileTap={{ scale: 0.98 }}
          >
            {icon && (
              <span className="flex-shrink-0 text-text-secondary">
                {icon}
              </span>
            )}

            <span className="flex-1 truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            {clearable && value && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(null as any);
                  setIsOpen(false);
                }}
                className="flex-shrink-0 p-1 hover:bg-hover-bg rounded text-text-secondary hover:text-text transition-colors"
              >
                ✕
              </button>
            )}

            <svg
              className={clsx(
                'w-4 h-4 flex-shrink-0 text-text-secondary transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                  'absolute top-full left-0 right-0 mt-2 z-50',
                  'glass border border-border rounded-lg shadow-lg',
                  'overflow-hidden'
                )}
              >
                {/* Search Input */}
                {searchable && (
                  <div className="p-2 border-b border-border">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={clsx(
                        'w-full px-3 py-2 text-sm rounded-md',
                        'bg-surface-secondary border border-border',
                        'text-text placeholder-text-tertiary',
                        'focus:outline-none focus:border-primary'
                      )}
                    />
                  </div>
                )}

                {/* Options */}
                <div className="max-h-64 overflow-y-auto p-1">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onChange?.(option.value);
                          setIsOpen(false);
                          setSearchQuery('');
                        }}
                        disabled={option.disabled}
                        className={clsx(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md',
                          'transition-colors duration-200 text-left',
                          value === option.value
                            ? 'bg-primary/15 text-primary'
                            : 'text-text hover:bg-hover-bg',
                          option.disabled && 'opacity-50 cursor-not-allowed'
                        )}
                        whileHover={!option.disabled ? { x: 4 } : {}}
                      >
                        {option.icon && (
                          <span className="flex-shrink-0">{option.icon}</span>
                        )}
                        <span className="flex-1">{option.label}</span>
                        {value === option.value && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </motion.button>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center text-text-secondary text-sm">
                      No options found
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <p className="text-danger text-xs mt-1.5 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption };
