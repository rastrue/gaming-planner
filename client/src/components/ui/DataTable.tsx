import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  caption?: string;
  emptyMessage?: string;
  className?: string;
}

export default function DataTable<T>({
  columns,
  data,
  getRowKey,
  caption,
  emptyMessage = 'No records found.',
  className,
}: DataTableProps<T>) {
  const mobileColumns = columns.filter((column) => !column.hideOnMobile);

  return (
    <div className={cn('w-full', className)}>
      {data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
          {emptyMessage}
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-full border-collapse text-left text-sm">
              {caption ? <caption className="sr-only">{caption}</caption> : null}
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-slate-900 dark:text-slate-100">
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden" aria-label={caption}>
            {data.map((row) => (
              <article
                key={getRowKey(row)}
                className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <dl className="space-y-3">
                  {mobileColumns.map((column) => (
                    <div key={column.key}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {column.mobileLabel ?? column.header}
                      </dt>
                      <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{column.render(row)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
