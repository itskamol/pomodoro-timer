export type TimerMode = 'focus' | 'short_break' | 'long_break';
export type TimerState = 'idle' | 'running' | 'paused';

export interface TimerSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // number of focus sessions before a long break
  autoTransition: boolean; // auto start next session
  playSound: boolean;
  soundType: 'bowl' | 'digital' | 'bell' | 'none';
  soundVolume: number; // 0 to 1
  dailyTarget: number; // number of focus sessions target
}

export interface SessionStats {
  completedFocus: number;
  completedShortBreaks: number;
  completedLongBreaks: number;
  streakDays: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
}

export const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoTransition: true,
  playSound: true,
  soundType: 'bowl',
  soundVolume: 0.5,
  dailyTarget: 4,
};

export const DEFAULT_STATS: SessionStats = {
  completedFocus: 0,
  completedShortBreaks: 0,
  completedLongBreaks: 0,
  streakDays: 0,
  lastCompletedDate: null,
};
