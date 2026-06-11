import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

/**
 * Premium Table Component
 * Modern table with sticky header, hover effects, and animations
 */

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  variant?: 'default' | 'striped' | 'bordered';
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table
        ref={ref}
        className={clsx(
          'w-full text-sm',
          variant === 'striped' && '[&_tbody_tr:nth-child(even)]:bg-surface-secondary',
          variant === 'bordered' && '[&_td]:border-r [&_td:last-child]:border-r-0 [&_th]:border-r [&_th:last-child]:border-r-0',
          className
        )}
        {...props}
      />
    </div>
  )
);

Table.displayName = 'Table';

/**
 * Table Head Component
 */
const TableHead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={clsx('bg-surface-secondary sticky top-0 z-10', className)}
    {...props}
  />
));

TableHead.displayName = 'TableHead';

/**
 * Table Body Component
 */
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={clsx('[&_tr:last-child_td]:border-b-0', className)}
    {...props}
  />
));

TableBody.displayName = 'TableBody';

/**
 * Table Row Component
 */
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
  clickable?: boolean;
  isSelected?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, hoverable = true, clickable = false, isSelected, ...props }, ref) => (
    <motion.tr
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'border-b border-border transition-colors duration-200 h-12',
        hoverable && 'hover:bg-hover-bg',
        clickable && 'cursor-pointer',
        isSelected && 'bg-selected-bg',
        className
      )}
      {...props}
    />
  )
);

TableRow.displayName = 'TableRow';

/**
 * Table Header Cell Component
 */
interface TableHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
  onSort?: (direction: 'asc' | 'desc') => void;
}

const TableHeaderCell = React.forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ className, sortable, sorted, onSort, children, ...props }, ref) => (
    <th
      ref={ref}
      className={clsx(
        'px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider',
        sortable && 'cursor-pointer hover:text-text select-none',
        className
      )}
      onClick={() => {
        if (sortable && onSort) {
          const newDirection = sorted === 'asc' ? 'desc' : 'asc';
          onSort(newDirection);
        }
      }}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <svg
            className={clsx(
              'w-4 h-4 transition-transform',
              sorted === 'asc' && 'rotate-180',
              sorted === 'desc' && '',
              !sorted && 'opacity-40'
            )}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        )}
      </div>
    </th>
  )
);

TableHeaderCell.displayName = 'TableHeaderCell';

/**
 * Table Data Cell Component
 */
interface TableDataCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  variant?: 'default' | 'muted' | 'success' | 'danger' | 'warning';
  align?: 'left' | 'center' | 'right';
}

const TableDataCell = React.forwardRef<HTMLTableCellElement, TableDataCellProps>(
  ({ className, variant = 'default', align = 'left', ...props }, ref) => {
    const variantClasses = {
      default: 'text-text',
      muted: 'text-text-secondary',
      success: 'text-success font-medium',
      danger: 'text-danger font-medium',
      warning: 'text-warning font-medium',
    };

    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <td
        ref={ref}
        className={clsx(
          'px-4 py-3 whitespace-nowrap',
          variantClasses[variant],
          alignClasses[align],
          className
        )}
        {...props}
      />
    );
  }
);

TableDataCell.displayName = 'TableDataCell';

/**
 * Table Empty State Component
 */
interface TableEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  icon?: React.ReactNode;
}

const TableEmpty = React.forwardRef<HTMLDivElement, TableEmptyProps>(
  ({ className, message = 'No data available', icon, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
      {...props}
    >
      {icon && <div className="mb-4 text-text-tertiary text-3xl">{icon}</div>}
      <p className="text-text-secondary text-sm">{message}</p>
    </div>
  )
);

TableEmpty.displayName = 'TableEmpty';

export {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableDataCell,
  TableEmpty,
};
export type { TableProps, TableRowProps, TableHeaderCellProps, TableDataCellProps, TableEmptyProps };
