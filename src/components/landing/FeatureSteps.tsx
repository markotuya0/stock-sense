"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface FeatureStepsProps {
  steps: Step[];
  className?: string;
}

export const FeatureSteps: React.FC<FeatureStepsProps> = ({
  steps,
  className,
}) => {
  return (
    <div className={cn("grid gap-8 md:grid-cols-2 lg:grid-cols-4", className)}>
      {steps.map((step, index) => (
        <motion.div
          key={step.number}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          className="group relative"
        >
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="absolute left-1/2 top-12 hidden h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent lg:block" />
          )}

          <div className="relative flex flex-col items-center text-center">
            {/* Step number badge */}
            <div className="relative mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card shadow-lg transition-shadow duration-300 group-hover:shadow-xl"
              >
                <div className="text-accent">{step.icon}</div>
              </motion.div>
              <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {step.number}
              </span>
            </div>

            {/* Content */}
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default FeatureSteps;
