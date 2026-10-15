import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, Sun, Moon, AlertCircle, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { determineOnaAndHebrewDate, formatTime } from '../../engine/zmanim';

interface NewCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export const NewCycleModal: React.FC<NewCycleModalProps> = ({ isOpen, onClose, initialDate }) => {
  const { addFlow, settings } = useApp();

  const now = new Date();
  const defaultDate = initialDate || now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [dateStr, setDateStr] = useState<string>(defaultDate);
  const [timeStr, setTimeStr] = useState<string>(defaultTime);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (initialDate) {
      setDateStr(initialDate);
    }
  }, [initialDate, isOpen]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live preview of Hebrew date & Ona
  const preview = useMemo(() => {
    try {
      const combined = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(combined.getTime())) return null;
      return determineOnaAndHebrewDate(combined, settings.locationName);
    } catch {
      return null;
    }
  }, [dateStr, timeStr, settings.locationName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const combined = new Date(`${dateStr}T${timeStr}:00`);
      await addFlow(combined, notes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-rose-100 animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 border-b border-rose-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900">הזנת ראייה / תחילת מחזור</h2>
            <p className="text-xs text-stone-500 mt-1">חישוב אוטומטי של עונת יום או לילה וזמני הפרישה</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Date & Time Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                תאריך הראייה
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                שעת הראייה
              </label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              />
            </div>
          </div>

          {/* Live Halachic Preview Box */}
          {preview && (
            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-rose-900/70 font-medium">תאריך עברי מחושב:</span>
                <span className="font-bold text-rose-900">{preview.hebrewDateStr}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-rose-900/70 font-medium">עונה הלכתית:</span>
                <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full text-xs bg-white text-rose-700 shadow-sm border border-rose-100">
                  {preview.ona === 'day' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      עונת יום
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      עונת לילה
                    </>
                  )}
                </span>
              </div>
              <div className="text-[11px] text-stone-500 pt-1 border-t border-rose-200/50 flex justify-between">
                <span>זריחה: {formatTime(preview.zmanim.sunrise)}</span>
                <span>שקיעה: {formatTime(preview.zmanim.sunset)}</span>
              </div>
              {preview.isAfterSunset && (
                <div className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-lg flex items-start gap-1.5 border border-amber-100">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>הראייה אירעה לאחר שקיעת החמה, ולכן חלה על יום המחרת ההלכתי (עונת לילה).</span>
                </div>
              )}
            </div>
          )}

          {/* Notes Field */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              הערות (אופציונלי)
            </label>
            <input
              type="text"
              placeholder="למשל: בדיקה פנימית, שעת הרגשה וכו'"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-sm transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !preview}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              שמור וחשב זמנים
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
