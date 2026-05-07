import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, HTMLMotionProps } from 'motion/react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const GlassCard = ({ children, className, hoverable = false, ...props }: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hoverable ? { y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' } : undefined}
      className={cn(
        "glass-card overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
