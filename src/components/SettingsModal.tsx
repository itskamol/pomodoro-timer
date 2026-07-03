import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, Music, RefreshCw, Flame, Check, HelpCircle } from 'lucide-react';
import { TimerSettings } from '../types';
import { synth } from '../lib/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TimerSettings;
  onSave: (newSettings: TimerSettings) => void;
  onResetStats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onResetStats,
}) => {
  const [localSettings, setLocalSettings] = useState<TimerSettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleChange = <K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTestSound = () => {
    synth.playCompletionSound(localSettings.soundType, localSettings.soundVolume);
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="glass-panel-heavy w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                  <Flame className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold font-display text-white">Sozlamalar</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                id="close-settings-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
              {/* Intervals Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-l-2 border-rose-500 pl-2">
                  Taymer Vaqtlari (Daqiqalarda)
                </h3>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Focus duration */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5">
                    <label className="text-xs font-medium text-slate-400">Ish vaqti</label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={localSettings.focusDuration}
                      onChange={(e) => handleChange('focusDuration', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg px-2.5 py-1.5 text-center text-white text-base font-bold font-display focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  {/* Short break */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5">
                    <label className="text-xs font-medium text-slate-400">Qisqa dam</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={localSettings.shortBreakDuration}
                      onChange={(e) => handleChange('shortBreakDuration', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg px-2.5 py-1.5 text-center text-white text-base font-bold font-display focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  {/* Long break */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5">
                    <label className="text-xs font-medium text-slate-400">Uzoq dam</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={localSettings.longBreakDuration}
                      onChange={(e) => handleChange('longBreakDuration', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg px-2.5 py-1.5 text-center text-white text-base font-bold font-display focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Intervals & Target Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-l-2 border-emerald-500 pl-2">
                  Sikl va Maqsadlar
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-400">Kunlik maqsad (Sikl)</label>
                      <span className="text-xs font-bold text-white">{localSettings.dailyTarget} marta</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={localSettings.dailyTarget}
                      onChange={(e) => handleChange('dailyTarget', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-400">Uzoq dam oralig'i</label>
                      <span className="text-xs font-bold text-white">Har {localSettings.longBreakInterval} darsdan so'ng</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={8}
                      value={localSettings.longBreakInterval}
                      onChange={(e) => handleChange('longBreakInterval', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-l-2 border-indigo-500 pl-2">
                  Avtomatlashtirish va Ovozlar
                </h3>

                <div className="space-y-3">
                  {/* Auto transition toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white">Avtomatik o'tish</span>
                      <span className="text-xs text-slate-400">Vaqt tugaganda keyingi siklni avtomatik boshlash</span>
                    </div>
                    <button
                      onClick={() => handleChange('autoTransition', !localSettings.autoTransition)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        localSettings.autoTransition ? 'bg-rose-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          localSettings.autoTransition ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Sound Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white">Tovush bildirishnomasi</span>
                      <span className="text-xs text-slate-400">Sikl yakunida chiroyli ohang chalish</span>
                    </div>
                    <button
                      onClick={() => handleChange('playSound', !localSettings.playSound)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        localSettings.playSound ? 'bg-rose-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          localSettings.playSound ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {localSettings.playSound && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4"
                    >
                      {/* Sound Type Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5" /> Ohang Turi
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['bowl', 'bell', 'digital'] as const).map((sound) => {
                            const labels: Record<string, string> = {
                              bowl: "Zen Kosasi",
                              bell: "Chaqiriq",
                              digital: "Signal"
                            };
                            const isSelected = localSettings.soundType === sound;
                            return (
                              <button
                                key={sound}
                                type="button"
                                onClick={() => handleChange('soundType', sound)}
                                className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                  isSelected
                                    ? 'bg-rose-500/15 border-rose-500 text-rose-400 font-semibold'
                                    : 'bg-slate-900 border-white/5 hover:bg-slate-800 text-slate-400'
                                }`}
                              >
                                {labels[sound]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sound Volume and Test */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5" /> Balandlik: {Math.round(localSettings.soundVolume * 100)}%
                          </span>
                          <button
                            type="button"
                            onClick={handleTestSound}
                            className="text-rose-400 hover:text-rose-300 transition-colors"
                          >
                            Tinglab ko'rish
                          </button>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={localSettings.soundVolume}
                          onChange={(e) => handleChange('soundVolume', parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-500 border-l-2 border-red-500 pl-2">
                  Xavfli Hudud
                </h3>

                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-red-200">Statistikani tozalash</h4>
                    <p className="text-xs text-slate-400">Bajarilgan seanslar va kunlik streakni o'chirish</p>
                  </div>
                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl transition-all font-medium text-xs border border-red-500/20"
                    >
                      Nollash
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onResetStats();
                          setShowResetConfirm(false);
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-all shadow-md"
                      >
                        Ha, nollash
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs transition-all"
                      >
                        Yo'q
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-950/50 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 rounded-2xl transition-all font-medium"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-rose-500/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Saqlash
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
