import React from 'react';
import { cn } from '@/lib/utils';

interface TetrasanLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Tetrasan Logo Component
 * 
 * TODO: Replace placeholder with actual logo asset
 * The logo should be provided as an SVG or high-quality image
 * 
 * Current placeholder shows the text "TETRASAN" in brand colors
 * with the yellow accent elements as described in the brand guidelines
 */
export function TetrasanLogo({ size = 'md', className }: TetrasanLogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-12',
    xl: 'h-16'
  };

  return (
    <div 
      className={cn('flex items-center', sizeClasses[size], className)}
      aria-label="TETRASAN GmbH - Zukunftslösungen HEUTE"
    >
      {/* TODO: Replace this placeholder with the actual logo asset */}
      <div className="flex items-center space-x-2">
        {/* Yellow accent elements (top) */}
        <div className="flex space-x-1">
          <div className="w-2 h-1 bg-vacation-border transform -skew-x-12"></div>
          <div className="w-2 h-1 bg-vacation-border transform -skew-x-12"></div>
          <div className="w-2 h-1 bg-vacation-border transform -skew-x-12"></div>
          <div className="w-2 h-1 bg-vacation-border transform -skew-x-12"></div>
        </div>
        
        {/* Main text */}
        <div className="flex flex-col">
          <span className={cn(
            "text-brand font-bold leading-tight",
            size === 'sm' && "text-sm",
            size === 'md' && "text-lg", 
            size === 'lg' && "text-xl",
            size === 'xl' && "text-2xl"
          )}>
            TETRASAN
          </span>
          <span className={cn(
            "text-brand leading-tight",
            size === 'sm' && "text-xs",
            size === 'md' && "text-xs",
            size === 'lg' && "text-sm", 
            size === 'xl' && "text-base"
          )}>
            Zukunftslösungen <em>HEUTE</em>
          </span>
        </div>
        
        {/* Yellow accent elements (bottom) */}
        <div className="flex space-x-1">
          <div className="w-1.5 h-0.5 bg-vacation-border transform -skew-x-12"></div>
          <div className="w-1.5 h-0.5 bg-vacation-border transform -skew-x-12"></div>
          <div className="w-1.5 h-0.5 bg-vacation-border transform -skew-x-12"></div>
        </div>
      </div>
    </div>
  );
}

export default TetrasanLogo;
