"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  rows,
  columns,
  emptyLabel = "No records",
  rowKey,
  onRowClick,
}: {
  rows: T[];
  columns: Column<T>[];
  emptyLabel?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-[var(--border)] bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--bg-muted)] text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={clsx("px-3 py-2", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-8 text-center text-[var(--fg-muted)]" colSpan={columns.length}>
                {emptyLabel}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={clsx(
                "border-t border-[var(--border)]",
                onRowClick && "cursor-pointer hover:bg-[var(--ub-blue-50)]",
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={clsx("px-3 py-2 align-top", c.className)}>
                  {c.render
                    ? c.render(row)
                    : ((row as Record<string, unknown>)[c.key] as ReactNode) ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
