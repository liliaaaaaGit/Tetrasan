import React from "react";
import { cn } from "@/lib/utils";

interface Column {
  header: string;
  accessor: string;
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
}

/**
 * DataTable Component
 * A reusable table for displaying tabular data
 * Works well on both mobile and desktop
 */
export function DataTable({ columns, data, onRowClick }: DataTableProps) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={cn(
                  "text-left px-4 py-3 text-sm font-medium text-muted-foreground",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "hover:bg-muted/30 transition-colors",
                onRowClick && "cursor-pointer"
              )}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="px-4 py-3 text-sm">
                  {row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

