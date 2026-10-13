import * as React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-surface-raised/60', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-border/60', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100 hover:bg-surface-raised/50',
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-text-tertiary',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle text-sm text-text', className)} {...props} />;
}

/** Empty state for tables */
export function TableEmpty({ colSpan, message, icon: Icon }: {
  colSpan: number;
  message: string;
  icon?: React.ElementType;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="text-center py-16">
        <div className="flex flex-col items-center gap-2">
          {Icon && <Icon className="h-8 w-8 text-text-tertiary/50" />}
          <p className="text-sm text-text-tertiary">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

/** Skeleton loader for table rows */
export function TableSkeleton({ colSpan, rows = 5 }: { colSpan: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          {Array.from({ length: colSpan }).map((_, j) => (
            <TableCell key={j}>
              <div className="skeleton h-4 w-full max-w-[120px] rounded" style={{ animationDelay: `${(i * colSpan + j) * 50}ms` }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
