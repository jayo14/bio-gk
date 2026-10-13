'use client';

import { Toaster as Sonner, toast } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-surface group-[.toaster]:text-dark group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:font-sans group-[.toaster]:text-xs',
          description: 'group-[.toast]:text-secondary-text group-[.toast]:text-[11px]',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:rounded-xl font-bold group-[.toast]:hover:bg-primary-hover',
          cancelButton:
            'group-[.toast]:bg-background group-[.toast]:text-secondary-text group-[.toast]:rounded-xl font-bold',
          success:
            'group-[.toaster]:border-success/30 group-[.toaster]:bg-surface group-[.toaster]:text-dark',
          error:
            'group-[.toaster]:border-error/30 group-[.toaster]:bg-surface group-[.toaster]:text-dark',
          warning:
            'group-[.toaster]:border-amber-400/30 group-[.toaster]:bg-surface group-[.toaster]:text-dark',
          info:
            'group-[.toaster]:border-primary/30 group-[.toaster]:bg-surface group-[.toaster]:text-dark',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
