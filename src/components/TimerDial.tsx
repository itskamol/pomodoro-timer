import React from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, AlertCircle, Coffee, Brain } from 'lucide-react';
import { TimerMode, TimerState } from '../types';

interface TimerDialProps {
  id: string;
  mode: TimerMode;
  state: TimerState;
  secondsRemaining: number;
  duration: number; // total duration in seconds
  onStartPause: () => void;
  onReset: () => void;
}

export const TimerDial: React.FC<TimerDialProps> = ({
  id,
  mode,
  state,
  secondsRemaining,
  duration,
  onStartPause,
  onReset,
}) => {
  // Calculate progress ratio (0 to 1)
  const ratio = duration > 0 ? (duration - secondsRemaining) / duration : 0;
  
  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SVG parameters
  const size = 320;
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2; // 150
  const circumference = 2 * Math.PI * radius; // ~942.48
  const strokeDashoffset = circumference - ratio * circumference;

  // Calculate tip coordinates for the indicator dot (starting at 3 o'clock, which rotates to 12 o'clock)
  const angle = ratio * 2 * Math.PI;
  const cx = size / 2;
  const cy = size / 2;
  const dotX = cx + radius * Math.cos(angle);
  const dotY = cy + radius * Math.sin(angle);

  // Get Uzbek text representations
  const getModeLabel = () => {
    switch (mode) {
      case 'focus':
        return 'ISH VAQTI';
      case 'short_break':
        return 'QISQA TANAFUSS';
      case 'long_break':
        return 'UZOQ TANAFUSS';
    }
  };

  const getStatusMessage = () => {
    if (state === 'paused') {
      return 'Vaqt to\'xtatildi';
    }
    switch (mode) {
      case 'focus':
        return 'Diqqatni jamlash vaqti!';
      case 'short_break':
        return 'Biroz dam oling...';
      case 'long_break':
        return 'Yaxshilab hordiq chiqaring!';
    }
  };

  const getModeColor = () => {
    switch (mode) {
      case 'focus':
        return 'from-rose-500 to-red-600';
      case 'short_break':
        return 'from-emerald-400 to-teal-500';
      case 'long_break':
        return 'from-cyan-400 to-indigo-500';
    }
  };

  const getStrokeColor = () => {
    switch (mode) {
      case 'focus':
        return '#ef4444'; // Red-500
      case 'short_break':
        return '#10b981'; // Emerald-500
      case 'long_break':
        return '#06b6d4'; // Cyan-500
    }
  };

  const getGlowFilterClass = () => {
    switch (mode) {
      case 'focus':
        return 'shadow-rose-500/25';
      case 'short_break':
        return 'shadow-emerald-500/25';
      case 'long_break':
        return 'shadow-cyan-500/25';
    }
  };

  return (
    <div id={id} className="relative flex flex-col items-center select-none py-4">
      {/* Circle Container */}
      <div className="relative w-[320px] h-[320px] md:w-[350px] md:h-[350px] flex items-center justify-center">
        {/* Glow behind the circle */}
        <div className={`absolute inset-6 rounded-full blur-3xl opacity-15 transition-all duration-700 bg-gradient-to-tr ${getModeColor()}`} />

        {/* Outer Circular frame / Glass backing */}
        <div className="absolute inset-2 rounded-full glass-panel border border-white/5 shadow-2xl flex items-center justify-center" />

        {/* SVG Drawing */}
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 w-full h-full -rotate-90 transform"
        >
          {/* Track Circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            className="stroke-slate-950/40 fill-none"
            strokeWidth={strokeWidth}
          />

          {/* Active Animated Progress Arc */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
          />

          {/* Glowing Indicator Dot at Tip */}
          {ratio > 0 && ratio < 1 && (
            <motion.circle
              cx={dotX}
              cy={dotY}
              r={7}
              fill={getStrokeColor()}
              className="glow-coral"
              animate={state === 'running' ? {
                scale: [1, 1.3, 1],
                opacity: [1, 0.8, 1],
              } : {}}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
            />
          )}
        </svg>

        {/* Inner Content Panel */}
        <div className="absolute inset-8 rounded-full flex flex-col items-center justify-center text-center p-4">
          {/* Session Mode Label */}
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-400 font-display">
            {mode === 'focus' ? (
              <Brain className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Coffee className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{getModeLabel()}</span>
          </div>

          {/* Massive Display Time */}
          <div className="text-5xl md:text-6xl font-extrabold font-display tracking-tight text-white my-3 select-all">
            {formatTime(secondsRemaining)}
          </div>

          {/* Status Message Pill */}
          <motion.div
            key={`${mode}-${state}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] md:text-xs text-slate-300 flex items-center gap-1.5 shadow-sm`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${state === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {getStatusMessage()}
          </motion.div>
        </div>
      </div>

      {/* Control Buttons (Below Dial) */}
      <div className="flex items-center gap-4 mt-8">
        {/* Play/Pause Button */}
        <motion.button
          onClick={onStartPause}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.04 }}
          className={`px-8 py-3.5 rounded-full font-bold tracking-wide shadow-lg shadow-rose-500/10 text-white flex items-center gap-2 bg-gradient-to-r ${getModeColor()}`}
          id="start-pause-btn"
        >
          {state === 'running' ? (
            <>
              <Pause className="w-4 h-4 fill-white text-white" />
              <span>PAUZA</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white text-white" />
              <span>BOSHLASH</span>
            </>
          )}
        </motion.button>

        {/* Reset Button */}
        <motion.button
          onClick={onReset}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.08 }}
          className="p-3.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition-all shadow-md"
          title="Qaytadan boshlash"
          id="reset-btn"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
