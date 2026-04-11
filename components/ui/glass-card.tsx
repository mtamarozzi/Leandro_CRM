import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  lit?: boolean;
}

export function GlassCard({ children, className, lit, ...props }: GlassCardProps) {
  return (
    <div 
      className={cn(lit ? 'glass--lit' : 'card-glass', className)} 
      {...props}
    >
      {children}
    </div>
  );
}
