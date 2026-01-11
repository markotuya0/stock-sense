"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GridBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({
  className,
  children,
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-radial-glow" />
      
      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
};

export default GridBackground;
