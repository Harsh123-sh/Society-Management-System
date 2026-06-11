import React from 'react';
import { Button } from './Button';
import clsx from 'clsx';

/**
 * Pagination Component
 * Modern pagination control for data lists
 */

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisible?: number;
  showFirstLast?: boolean;
  showPreviousNext?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      maxVisible = 5,
      showFirstLast = true,
      showPreviousNext = true,
      size = 'md',
      className,
      ...props
    },
    ref
  ) => {
    if (totalPages <= 1) return null;

    const sizeClasses = {
      sm: 'gap-1',
      md: 'gap-2',
      lg: 'gap-3',
    };

    // Calculate visible page range
    const halfVisible = Math.floor(maxVisible / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (endPage - startPage + 1 < maxVisible) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisible - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
    }

    const pages = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );

    const handlePreviousClick = () => {
      if (currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    };

    const handleNextClick = () => {
      if (currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'flex items-center',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {/* First Button */}
        {showFirstLast && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-2"
          >
            «
          </Button>
        )}

        {/* Previous Button */}
        {showPreviousNext && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePreviousClick}
            disabled={currentPage === 1}
            className="px-2"
          >
            ‹
          </Button>
        )}

        {/* Page Number Buttons */}
        {startPage > 1 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(1)}
              className="px-3"
            >
              1
            </Button>
            {startPage > 2 && (
              <span className="text-text-secondary px-2">...</span>
            )}
          </>
        )}

        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onPageChange(page)}
            className="px-3"
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="text-text-secondary px-2">...</span>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              className="px-3"
            >
              {totalPages}
            </Button>
          </>
        )}

        {/* Next Button */}
        {showPreviousNext && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNextClick}
            disabled={currentPage === totalPages}
            className="px-2"
          >
            ›
          </Button>
        )}

        {/* Last Button */}
        {showFirstLast && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2"
          >
            »
          </Button>
        )}
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

/**
 * Simple Page Info Component
 * Shows current page info (e.g., "1-10 of 45 items")
 */
interface PageInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

const PageInfo = React.forwardRef<HTMLDivElement, PageInfoProps>(
  ({ currentPage, pageSize, totalItems, className, ...props }, ref) => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
      <div
        ref={ref}
        className={clsx('text-sm text-text-secondary', className)}
        {...props}
      >
        Showing {startItem}-{endItem} of {totalItems} items
      </div>
    );
  }
);

PageInfo.displayName = 'PageInfo';

export { Pagination, PageInfo };
export type { PaginationProps, PageInfoProps };
