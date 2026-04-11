import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type ButtonProps = React.ComponentProps<typeof Button>;

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
