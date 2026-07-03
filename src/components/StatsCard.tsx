import React from 'react';
import { motion } from 'motion/react';
import { Target, Flame } from 'lucide-react';

interface StatsCardProps {
  id: string;
  type: 'sessions' | 'streak';
  value: number;
  target?: number;
  title: string;
  subtitle: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  id,
  type,
  value,
  target,
  title,
  subtitle,
}) => {
  const isSessions = type === 'sessions';

  return (
    <motion.div
      id={id}
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass-panel flex flex-col items-center justify-between p-6 rounded-2xl w-full min-h-[140px] text-center shadow-lg relative overflow-hidden"
    >
      {/* Decorative ambient gradient background */}
      <div className={`absolute -right-12 -top-12 w-24 h-24 rounded-full blur-2xl opacity-10 ${
        isSessions ? 'bg-emerald-500' : 'bg-orange-500'
      }`} />

      {/* Card Header (Icon + Title) */}
      <div className="flex flex-col items-center gap-2">
        <div className={`p-2.5 rounded-xl ${
          isSessions 
            ? 'bg-emerald-500/10 text-emerald-400' 
            : 'bg-rose-500/10 text-rose-400'
        }`}>
          {isSessions ? (
            <Target className="w-5 h-5 stroke-[2]" />
          ) : (
            <Flame className="w-5 h-5 stroke-[2]" />
          )}
        </div>
        <span className="text-[10px] md:text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
      </div>

      {/* Main Big Number Value with animated count representation */}
      <div className="my-2">
        <motion.span
          key={value}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-3xl md:text-4xl font-bold font-display text-white"
        >
          {value}
        </motion.span>
        {isSessions && target !== undefined && (
          <span className="text-sm font-semibold text-slate-500 ml-1">
            /{target}
          </span>
        )}
      </div>

      {/* Subtitle / Context description */}
      <span className="text-[11px] md:text-xs text-slate-400 font-medium">
        {subtitle}
      </span>
    </motion.div>
  );
};
