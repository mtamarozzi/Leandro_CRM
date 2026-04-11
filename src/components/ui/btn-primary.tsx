import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';

export function BtnPrimary({ className, children, ...props }: ButtonProps) {
  return (
    <Button 
      className={cn('btn-primary', className)} 
      {...props}
    >
      {children}
    </Button>
  );
}
