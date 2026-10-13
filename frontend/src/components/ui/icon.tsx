import * as React from 'react';
import { cn } from '@/lib/utils';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  fill?: boolean;
  weight?: number;
  grade?: number;
  size?: number;
}

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  (
    {
      name,
      className,
      fill = false,
      weight = 400,
      grade = 0,
      size,
      style,
      ...props
    },
    ref
  ) => {
    const sizeStyle = size
      ? {
          fontSize: `${size}px`,
          width: `${size}px`,
          height: `${size}px`,
        }
      : undefined;

    return (
      <span
        ref={ref}
        className={cn(
          'material-symbols-rounded select-none inline-flex items-center justify-center leading-none align-middle',
          className
        )}
        style={{
          fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${size || 24}`,
          ...sizeStyle,
          ...style,
        }}
        aria-hidden="true"
        {...props}
      >
        {name}
      </span>
    );
  }
);

Icon.displayName = 'Icon';
