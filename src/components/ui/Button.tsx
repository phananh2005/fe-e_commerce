import * as React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-[var(--color-primary)] text-white hover:opacity-90',
      secondary: 'bg-transparent text-[var(--color-primary)] border-2 border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5',
      outline: 'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-muted)] text-[var(--color-foreground)]',
      ghost: 'hover:bg-[var(--color-muted)] text-[var(--color-foreground)]',
      destructive: 'bg-[var(--color-destructive)] text-white hover:opacity-90',
    };

    const sizes = {
      default: 'h-12 px-6 py-3',
      sm: 'h-9 rounded-md px-4',
      lg: 'h-14 rounded-lg px-8 text-lg',
      icon: 'h-12 w-12',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
