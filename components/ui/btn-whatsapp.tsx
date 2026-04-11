import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';

export function BtnWhatsapp({ className, children, ...props }: ButtonProps) {
  return (
    <Button 
      variant="outline"
      size="sm"
      className={cn(
        'border-[#25D366]/30 text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white transition-colors duration-300 font-medium', 
        className
      )} 
      {...props}
    >
      {children}
    </Button>
  );
}
