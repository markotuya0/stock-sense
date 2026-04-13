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
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass-card p-6 border border-white/10 ${glow ? 'glow-border' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const BentoCard: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`glass-card p-8 flex flex-col justify-between h-full bg-[#020617] border border-white/10 ${className}`}>
      {children}
    </div>
  );
};
