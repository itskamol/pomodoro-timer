import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  Settings2, 
  Flame, 
  Target, 
  Coffee, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  Volume2, 
  Sparkles,
  ChevronRight,
  BookOpen,
  Info,
  X
} from 'lucide-react';
import { 
  TimerMode, 
  TimerState, 
  TimerSettings, 
  SessionStats, 
  DEFAULT_SETTINGS, 
  DEFAULT_STATS 
} from './types';
import { TimerDial } from './components/TimerDial';
import { StatsCard } from './components/StatsCard';
import { SettingsModal } from './components/SettingsModal';
import { synth } from './lib/audio';

export default function App() {
  // Load settings & stats from localStorage or defaults
  const [settings, setSettings] = useState<TimerSettings>(() => {
    const saved = localStorage.getItem('pomodoro_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [stats, setStats] = useState<SessionStats>(() => {
    const saved = localStorage.getItem('pomodoro_stats');
    if (saved) {
      try {
        return { ...DEFAULT_STATS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_STATS;
      }
    }
    return DEFAULT_STATS;
  });

  // State
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(settings.focusDuration * 60);
  const [duration, setDuration] = useState(settings.focusDuration * 60);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // References for keeping track of the timer without drift
  const intervalRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number | null>(null);

  // Sync settings changes to the timer when in 'idle'
  useEffect(() => {
    if (timerState === 'idle') {
      const activeDuration = getDurationForMode(mode, settings);
      setSecondsRemaining(activeDuration);
      setDuration(activeDuration);
    }
  }, [settings, mode, timerState]);

  // Helper to get duration for mode in seconds
  function getDurationForMode(m: TimerMode, s: TimerSettings): number {
    switch (m) {
      case 'focus':
        return s.focusDuration * 60;
      case 'short_break':
        return s.shortBreakDuration * 60;
      case 'long_break':
        return s.longBreakDuration * 60;
    }
  }

  // Handle Date Time strings for streaks in local timezone
  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };

  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };

  // Timer Core Controller
  const startTimer = () => {
    setTimerState('running');
    const target = Date.now() + secondsRemaining * 1000;
    targetTimeRef.current = target;

    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = window.setInterval(() => {
      if (!targetTimeRef.current) return;
      
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetTimeRef.current - now) / 1000));
      
      setSecondsRemaining(remaining);

      // Play soft tick sound every second if desired
      if (remaining > 0 && settings.playSound) {
        // synth.playTickSound(settings.soundVolume); // Optional, can be toggled
      }

      if (remaining === 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        handleTimerComplete();
      }
    }, 200);
  };

  const pauseTimer = () => {
    setTimerState('paused');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    targetTimeRef.current = null;
  };

  const resetTimer = () => {
    setTimerState('idle');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    targetTimeRef.current = null;
    const activeDuration = getDurationForMode(mode, settings);
    setSecondsRemaining(activeDuration);
    setDuration(activeDuration);
  };

  const handleStartPause = () => {
    if (timerState === 'running') {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  // Sound and transition triggers on completion
  const handleTimerComplete = () => {
    // Play synthesis chime
    if (settings.playSound) {
      synth.playCompletionSound(settings.soundType, settings.soundVolume);
    }

    // Determine next state & update stats
    let nextMode: TimerMode = 'focus';
    let updatedStats = { ...stats };

    if (mode === 'focus') {
      // Completed a focus session
      const newCompletedFocus = stats.completedFocus + 1;
      updatedStats.completedFocus = newCompletedFocus;

      // Update Streaks
      const today = getLocalDateString();
      const yesterday = getYesterdayDateString();
      let newStreak = stats.streakDays;

      if (stats.lastCompletedDate === null) {
        newStreak = 1;
      } else if (stats.lastCompletedDate === yesterday) {
        newStreak += 1;
      } else if (stats.lastCompletedDate !== today) {
        newStreak = 1;
      }
      
      updatedStats.streakDays = newStreak;
      updatedStats.lastCompletedDate = today;

      // Check if we should do short break or long break
      if (newCompletedFocus % settings.longBreakInterval === 0) {
        nextMode = 'long_break';
      } else {
        nextMode = 'short_break';
      }
    } else if (mode === 'short_break') {
      updatedStats.completedShortBreaks = stats.completedShortBreaks + 1;
      nextMode = 'focus';
    } else {
      updatedStats.completedLongBreaks = stats.completedLongBreaks + 1;
      nextMode = 'focus';
    }

    // Save stats
    setStats(updatedStats);
    localStorage.setItem('pomodoro_stats', JSON.stringify(updatedStats));

    // Update Mode & reset remaining time
    setMode(nextMode);
    const nextDuration = getDurationForMode(nextMode, settings);
    setSecondsRemaining(nextDuration);
    setDuration(nextDuration);

    // Auto Transition
    if (settings.autoTransition) {
      setTimerState('running');
      const nextTarget = Date.now() + nextDuration * 1000;
      targetTimeRef.current = nextTarget;
      
      intervalRef.current = window.setInterval(() => {
        if (!targetTimeRef.current) return;
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((targetTimeRef.current - now) / 1000));
        setSecondsRemaining(remaining);
        if (remaining === 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          handleTimerComplete();
        }
      }, 200);
    } else {
      setTimerState('idle');
    }
  };

  // Change mode manually from the footer bar or presets click
  const selectMode = (selectedMode: TimerMode) => {
    // If running, pause first
    if (timerState === 'running') {
      pauseTimer();
    }
    setMode(selectedMode);
    setTimerState('idle');
    const activeDuration = getDurationForMode(selectedMode, settings);
    setSecondsRemaining(activeDuration);
    setDuration(activeDuration);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pomodoro_settings', JSON.stringify(newSettings));
    
    // If idle, update the durations
    if (timerState === 'idle') {
      const activeDuration = getDurationForMode(mode, newSettings);
      setSecondsRemaining(activeDuration);
      setDuration(activeDuration);
    }
  };

  // Reset Stats
  const handleResetStats = () => {
    setStats(DEFAULT_STATS);
    localStorage.removeItem('pomodoro_stats');
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0d12] text-slate-100 flex flex-col justify-between p-4 md:p-6 overflow-hidden relative">
      {/* Absolute Ambient Background Highlights */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER BAR */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-2 relative z-20">
        {/* Menu/About Button */}
        <motion.button
          onClick={() => setIsHelpOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-2xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all border border-white/5 shadow-md flex items-center justify-center"
          title="Texnikani tushunish"
          id="menu-btn"
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        {/* Center App Brand (Styled beautifully according to the mockup) */}
        <div className="flex flex-col items-center text-center">
          {/* Custom elegant SVG Tomato Icon */}
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <svg viewBox="0 0 100 100" className="w-8 h-8 fill-rose-500 hover:scale-110 transition-transform duration-300 cursor-pointer">
              {/* Tomato Body */}
              <path d="M50 82C69.33 82 85 70.3594 85 56C85 41.6406 69.33 30 50 30C30.67 30 15 41.6406 15 56C15 70.3594 30.67 82 50 82Z" />
              {/* Tomato Leaves/Stem */}
              <path d="M50 32C50 22 47 18 43 15C48 18 50 20 50 24C50 20 52 18 57 15C53 18 50 22 50 32Z" fill="#10b981" />
              <path d="M50 30C52 26 58 24 64 25C58 26 54 28 50 30Z" fill="#10b981" />
              <path d="M50 30C48 26 42 24 36 25C42 26 46 28 50 30Z" fill="#10b981" />
            </svg>
          </div>
          <h1 className="text-sm tracking-[0.3em] font-extrabold text-slate-300 uppercase flex items-center gap-1 font-display">
            POMODORO <span className="text-rose-500 font-bold">TIMER</span>
          </h1>
          <p className="text-[9px] tracking-[0.25em] font-bold text-slate-500 uppercase mt-0.5">
            FOCUS • WORK • ACHIEVE
          </p>
        </div>

        {/* Settings Gear Button */}
        <motion.button
          onClick={() => setIsSettingsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-2xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all border border-white/5 shadow-md flex items-center justify-center"
          title="Sozlamalar"
          id="settings-btn"
        >
          <Settings2 className="w-5 h-5" />
        </motion.button>
      </header>

      {/* MAIN LAYOUT */}
      <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center py-6 md:py-10 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          
          {/* Left Column: Sessions Card (on large screen, stacked on mobile) */}
          <div className="lg:col-span-3 order-2 lg:order-1 flex justify-center w-full">
            <StatsCard
              id="sessions-stats-card"
              type="sessions"
              value={stats.completedFocus}
              target={settings.dailyTarget}
              title="Seanslar Bajarildi"
              subtitle={`${stats.completedFocus >= settings.dailyTarget ? "Maqsad bajarildi! 🎉" : `${settings.dailyTarget - stats.completedFocus} ta qoldi`}`}
            />
          </div>

          {/* Center Column: Timer Dial */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-center justify-center">
            <TimerDial
              id="main-timer-dial"
              mode={mode}
              state={timerState}
              secondsRemaining={secondsRemaining}
              duration={duration}
              onStartPause={handleStartPause}
              onReset={resetTimer}
            />
          </div>

          {/* Right Column: Streak Card */}
          <div className="lg:col-span-3 order-3 lg:order-3 flex justify-center w-full">
            <StatsCard
              id="streak-stats-card"
              type="streak"
              value={stats.streakDays}
              title="Kunlik Streak"
              subtitle={stats.streakDays > 0 ? "Kun davomida faolsiz! 🔥" : "Darsni boshlang!"}
            />
          </div>

        </div>

        {/* BOTTOM SELECTION RAIL (Mode Presets) */}
        <div className="w-full max-w-xl mt-12 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="grid grid-cols-3 gap-1">
            
            {/* Short Break Mode */}
            <button
              onClick={() => selectMode('short_break')}
              className={`p-3.5 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                mode === 'short_break'
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-semibold'
                  : 'bg-transparent text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              id="mode-short-break-btn"
            >
              <Coffee className="w-5 h-5 mb-1 stroke-[2]" />
              <span className="text-[10px] font-bold tracking-wider uppercase">QISQA DAM</span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5">{settings.shortBreakDuration} daq</span>
            </button>

            {/* Focus Mode (Custom/Pencil icon or dynamic) */}
            <button
              onClick={() => selectMode('focus')}
              className={`p-3.5 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                mode === 'focus'
                  ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400 font-semibold'
                  : 'bg-transparent text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              id="mode-focus-btn"
            >
              <Clock className="w-5 h-5 mb-1 stroke-[2]" />
              <span className="text-[10px] font-bold tracking-wider uppercase">ISH REJIMI</span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5">{settings.focusDuration} daq</span>
            </button>

            {/* Long Break Mode */}
            <button
              onClick={() => selectMode('long_break')}
              className={`p-3.5 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                mode === 'long_break'
                  ? 'bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 font-semibold'
                  : 'bg-transparent text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
              id="mode-long-break-btn"
            >
              <Sparkles className="w-5 h-5 mb-1 stroke-[2]" />
              <span className="text-[10px] font-bold tracking-wider uppercase">UZOQ DAM</span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5">{settings.longBreakDuration} daq</span>
            </button>

          </div>
        </div>
      </main>

      {/* FOOTER METADATA */}
      <footer className="w-full text-center py-4 text-xs font-semibold tracking-wide text-slate-500 select-none z-10 relative">
        DIQQATINGIZNI JAMLANG VA BARCHASIGA ERISHING • 2026
      </footer>

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onResetStats={handleResetStats}
      />

      {/* HELP SIDEBAR DRAWER (Explaining the technique) */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHelpOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Side panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute inset-y-0 left-0 w-full max-w-sm glass-panel-heavy p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2 text-rose-400">
                    <BookOpen className="w-5 h-5" />
                    <h2 className="text-lg font-bold font-display text-white">Pomodoro Texnikasi</h2>
                  </div>
                  <button
                    onClick={() => setIsHelpOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Steps Description */}
                <div className="space-y-4 text-slate-300 text-sm">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pomodoro texnikasi - 1980-yillar oxirida Franchesko Chirillo tomonidan ishlab chiqilgan vaqtni boshqarish usuli. Usul ishni tanaffuslar bilan ajratilgan intervallarga (an'anaviy ravishda 25 daqiqa) ajratadi.
                  </p>

                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mt-2">Asosiy 4 qadam:</h3>

                  <div className="space-y-3.5">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center justify-center border border-rose-500/20">1</div>
                      <div>
                        <h4 className="font-semibold text-white">Vazifani tanlang</h4>
                        <p className="text-xs text-slate-400">Bajarishingiz kerak bo'lgan muhim dars yoki ishni belgilab oling.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center justify-center border border-rose-500/20">2</div>
                      <div>
                        <h4 className="font-semibold text-white">Ish darsini yoqing</h4>
                        <p className="text-xs text-slate-400">25 daqiqa davomida butunlay chalg'imasdan diqqat bilan ishlang.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center justify-center border border-rose-500/20">3</div>
                      <div>
                        <h4 className="font-semibold text-white">Qisqa dam oling</h4>
                        <p className="text-xs text-slate-400">5 daqiqa jismoniy mashq qiling, suv iching yoki ko'zni dam oldiring.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center justify-center border border-rose-500/20">4</div>
                      <div>
                        <h4 className="font-semibold text-white">Uzoq damga o'ting</h4>
                        <p className="text-xs text-slate-400">Har 4 darsdan keyin uzoqroq (15-20 daqiqa) tanaffus bilan tiklaning.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Benefits Pill list */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Afzalliklari:</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/5 flex items-center gap-1.5">
                      ✨ Fokusni oshiradi
                    </span>
                    <span className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/5 flex items-center gap-1.5">
                      🔋 Charchoqni oladi
                    </span>
                    <span className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/5 flex items-center gap-1.5">
                      📈 Hosildorlik +30%
                    </span>
                    <span className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/5 flex items-center gap-1.5">
                      🎯 Aniq natija
                    </span>
                  </div>
                </div>
              </div>

              {/* Drawer footer info */}
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 flex gap-2.5 text-xs text-slate-400 items-start">
                <Info className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Ushbu taymer butunlay oflayn ishlaydi. Ma'lumotlar brauzeringizda xavfsiz saqlanadi.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
