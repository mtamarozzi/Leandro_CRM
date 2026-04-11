import React from 'react';
import { cn } from '@/lib/utils';

type BtnWhatsappProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function BtnWhatsapp({ className, children, ...props }: BtnWhatsappProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center justify-center gap-2 w-full py-2 rounded-full',
        'bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/35',
        'font-semibold text-xs uppercase tracking-wide',
        'hover:bg-[#25D366] hover:text-white',
        'hover:shadow-[0_0_16px_rgba(37,211,102,0.5)]',
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
