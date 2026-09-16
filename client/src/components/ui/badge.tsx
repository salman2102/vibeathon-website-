import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-slate-100 text-slate-700',
        outline: 'border-slate-300 text-slate-700 bg-white',
        neutral: 'border-slate-200 bg-white text-charcoal-600',
        verified: 'border-verified-200 bg-verified-50 text-verified-700',
        warn: 'border-warn-100 bg-warn-50 text-warn-700',
        conflict: 'border-conflict-200 bg-conflict-50 text-conflict-700',
        accent: 'border-accent-200 bg-accent-50 text-accent-700',
        miss: 'border-slate-200 bg-slate-50 text-slate-600',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };