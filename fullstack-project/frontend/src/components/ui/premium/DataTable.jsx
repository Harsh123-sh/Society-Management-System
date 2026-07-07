import React from 'react';
import clsx from 'clsx';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableDataCell, TableEmpty } from './Table';

/**
 * DataTable
 * - columns: [{ key, title, minWidth, align, render }]
 * - data: array
 * - loading, error, emptyMessage
 */
function DataTable({ columns = [], data = [], loading = false, error = null, emptyMessage = 'No data found', className }) {
  if (error) {
    return (
      <div className="rounded-lg border p-6 text-sm">
        <div className="mb-3 text-lg font-semibold">Failed to load data</div>
        <div className="mb-4 text-sm text-gray-600">{String(error)}</div>
        <button onClick={() => window.location.reload()} className="rounded-xl bg-cyan-600 px-4 py-2 text-white">Retry</button>
      </div>
    );
  }

  if (!loading && (!Array.isArray(data) || data.length === 0)) {
    return <TableEmpty message={emptyMessage} />;
  }

  return (
    <div className={clsx('w-full overflow-x-auto', className)}>
      <Table className="min-w-[720px]">
        <TableHead>
          <tr>
            {columns.map((col) => (
              <TableHeaderCell key={col.key} className="whitespace-nowrap" style={{ minWidth: col.minWidth || 120 }}>
                {col.title}
              </TableHeaderCell>
            ))}
          </tr>
        </TableHead>

        <TableBody>
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`s-${idx}`}>
                  <TableDataCell colSpan={columns.length}>
                    <div className="h-4 w-full animate-pulse rounded bg-[rgb(var(--app-surface-muted-rgb))]" />
                  </TableDataCell>
                </TableRow>
              ))
            : data.map((row) => (
                <TableRow key={row.id || JSON.stringify(row)}>
                  {columns.map((col) => (
                    <TableDataCell key={col.key} className={clsx(col.className)} style={{ minWidth: col.minWidth }}>
                      {col.render ? col.render(row) : row[col.key]}
                    </TableDataCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {/* Mobile cards */}
      {!loading && (
        <div className="mt-4 grid gap-3 md:hidden">
          {data.map((row) => (
            <div key={`card-${row.id || JSON.stringify(row)}`} className="rounded-xl border p-4">
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between py-1">
                  <div className="text-xs text-[rgb(var(--app-text-muted-rgb))] uppercase tracking-wider">{col.title}</div>
                  <div className="ml-3 text-sm truncate" style={{ maxWidth: '60%' }}>{col.render ? col.render(row) : row[col.key]}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DataTable;
