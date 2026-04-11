import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'lit';
  /** @deprecated use `variant="lit"` instead */
  lit?: boolean;
}

export function GlassCard({ children, className, variant, lit, ...props }: GlassCardProps) {
  const isLit = variant === 'lit' || lit;
  return (
    <div
      className={cn(isLit ? 'glass--lit' : 'card-glass', className)}
      {...props}
    >
      {children}
    </div>
  );
}
