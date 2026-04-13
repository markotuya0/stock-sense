import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, glow = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass-card p-6 ${glow ? 'glow-border' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const BentoCard: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`glass-card p-8 flex flex-col justify-between h-full bg-gradient-to-br from-white/5 to-transparent ${className}`}>
      {children}
    </div>
  );
};
