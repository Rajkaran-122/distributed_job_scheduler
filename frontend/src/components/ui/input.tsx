import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-border bg-surface-raised px-3 py-1 text-sm text-text',
        'placeholder:text-text-tertiary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
        'focus-visible:border-border-focus',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-[border-color,box-shadow] duration-150',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-xs font-medium text-text-secondary mb-1.5 block', className)} {...props} />;
}

export function FormHelperText({ className, error, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { error?: boolean }) {
  return (
    <p
      className={cn(
        'text-[11px] mt-1',
        error ? 'text-danger' : 'text-text-tertiary',
        className
      )}
      {...props}
    />
  );
}
