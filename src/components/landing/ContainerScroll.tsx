"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ContainerScrollProps {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}

export const ContainerScroll: React.FC<ContainerScrollProps> = ({
  titleComponent,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scaleDimensions = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const translateY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[120vh] flex-col items-center justify-start py-20 md:py-40"
    >
      <div className="w-full max-w-5xl px-4 md:px-8">
        {titleComponent}
      </div>

      <motion.div
        style={{
          scale: scaleDimensions,
          rotateX: rotate,
          translateY,
          opacity,
        }}
        className="relative mx-auto mt-12 w-full max-w-5xl px-4 md:mt-20"
      >
        <div className="relative rounded-2xl border border-border bg-card p-2 shadow-2xl md:rounded-3xl md:p-4">
          {/* Glow effect */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20 opacity-50 blur-xl md:rounded-3xl" />
          
          {/* Screen content */}
          <div className="relative overflow-hidden rounded-xl bg-background md:rounded-2xl">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContainerScroll;
