import * as React from 'react';

import {cn} from '@/lib/utils';
import { useMotionValue, useTransform, motion } from 'framer-motion';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [-10, 10]);
    const rotateY = useTransform(x, [-100, 100], [10, -10]);

    function handleMouseMove(event: React.MouseEvent<HTMLTextAreaElement>) {
      const rect = event.currentTarget.getBoundingClientRect();
      x.set(event.clientX - rect.left - rect.width / 2);
      y.set(event.clientY - rect.top - rect.height / 2);
    }

    function handleMouseLeave() {
      x.set(0);
      y.set(0);
    }


    return (
      <motion.div 
        className="relative"
        style={{ perspective: 400 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.textarea
          style={{ rotateX, rotateY }}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-lg',
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
