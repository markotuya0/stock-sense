import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className, 
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center rounded-[4px] font-medium tracking-wide transition-all focus:outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10px] tracking-[0.2em]";
  
  const variants = {
    primary: "bg-accent text-background hover:bg-emerald-400 border border-emerald-500",
    secondary: "bg-transparent text-white hover:bg-white/5 border border-white/20",
    ghost: "bg-transparent text-slate-400 hover:text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5",
    md: "px-6 py-3",
    lg: "px-10 py-4",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
