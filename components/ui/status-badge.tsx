import React from 'react';
import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/src/types';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  // Map Status strings to badge color modifier
  const variantMap: Record<string, string> = {
    'Novo': 'novo',
    'Em Contato': 'contato',
    'Visita Agendada': 'visita',
    'Proposta': 'proposta',
    'Perdido': 'perdido',
    'Ganho': 'ganho'
  };

  const suffix = variantMap[status] || 'novo';

  return (
    <span 
      className={cn('badge', `badge--${suffix}`, className)} 
      {...props}
    >
      {status}
    </span>
  );
}
