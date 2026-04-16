import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div className={`relative overflow-hidden rounded bg-slate-800/50 ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/30 to-transparent"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
      />
    </div>
  );
};

export const SignalSkeleton = () => {
  return (
    <div className="p-4 border border-slate-700/50 rounded-xl bg-slate-900/30 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between items-center mt-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
};
