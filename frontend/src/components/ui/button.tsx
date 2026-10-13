import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default:
    'bg-brand text-white shadow-sm hover:bg-brand-muted active:bg-brand-dim ' +
    'focus-visible:ring-offset-bg',
  secondary:
    'bg-surface-raised text-text hover:bg-surface-overlay border border-border ' +
    'active:bg-border/40 focus-visible:ring-offset-bg',
  outline:
    'border border-border bg-transparent hover:bg-surface-raised text-text ' +
    'active:bg-surface-overlay focus-visible:ring-offset-bg',
  ghost:
    'bg-transparent hover:bg-surface-raised text-text ' +
    'active:bg-surface-overlay focus-visible:ring-offset-bg',
  danger:
    'bg-danger text-white hover:bg-danger-muted active:bg-danger-dim shadow-sm ' +
    'focus-visible:ring-danger focus-visible:ring-offset-bg',
  link: 'bg-transparent underline-offset-4 hover:underline text-brand p-0 h-auto',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
  icon: 'h-9 w-9',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150',
          'disabled:pointer-events-none disabled:opacity-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          'active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {typeof children === 'string' ? children : null}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
