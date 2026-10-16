import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, Sun, Moon, AlertCircle, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/useApp';
import { determineOnaAndHebrewDate, formatTime, toDateString } from '../../engine/zmanim';

interface NewCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export const NewCycleModal: React.FC<NewCycleModalProps> = ({ isOpen, onClose, initialDate }) => {
  const { addFlow, updateFlowDate, activeFlow, taharaProcess, settings } = useApp();

  const todayDateStr = useMemo(() => toDateString(new Date()), []);
  const defaultTimeStr = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  const [dateStr, setDateStr] = useState<string>(() => initialDate || todayDateStr);
  const [timeStr, setTimeStr] = useState<string>(() => defaultTimeStr);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Future date validation
  const isFutureDateTime = useMemo(() => {
    try {
      const combined = new Date(`${dateStr}T${timeStr}:00`);
      return combined.getTime() > Date.now();
    } catch {
      return false;
    }
  }, [dateStr, timeStr]);

  // Halachic Active Cycle Conflict Determination
  const activeConflict = useMemo(() => {
    if (!activeFlow) return null;

    if (dateStr === activeFlow.gregorianDate) {
      return 'same_day';
    }

    // Seeing blood after flow started but before Hefsek is done
    if (!taharaProcess?.hefsekDone && dateStr > activeFlow.gregorianDate) {
      return 'bleeding_during_period';
    }

    // Seeing blood during 7 clean days (סתרה)
    if (taharaProcess?.hefsekDone && taharaProcess?.status !== 'tahor') {
      return 'in_seven_clean_days';
    }

    return null;
  }, [activeFlow, taharaProcess, dateStr]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFutureDateTime) {
      setErrorMessage('לא ניתן להזין ראייה בתאריך או שעה עתידיים.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const combined = new Date(`${dateStr}T${timeStr}:00`);
      await addFlow(combined, notes);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בשמירת הראייה';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateActiveFlowDate = async () => {
    if (!activeFlow) return;
    if (isFutureDateTime) {
      setErrorMessage('לא ניתן להזין ראייה בתאריך או שעה עתידיים.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const combined = new Date(`${dateStr}T${timeStr}:00`);
      await updateFlowDate(activeFlow.id, combined, notes);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'שגיאה בעדכון הראייה';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-rose-100 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 cursor-default max-h-[92vh] flex flex-col"
      >
        {/* Grab Handle (Mobile) */}
        <div className="w-12 h-1 rounded-full bg-stone-300 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-5 sm:p-6 border-b border-rose-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">הזנת ראייה / תחילת מחזור</h2>
            <p className="text-xs text-stone-500 mt-0.5">חישוב הלכתי של עונת יום או לילה וזמני הפרישה</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

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
                max={todayDateStr}
                onChange={(e) => {
                  setDateStr(e.target.value);
                  setErrorMessage(null);
                }}
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
                onChange={(e) => {
                  setTimeStr(e.target.value);
                  setErrorMessage(null);
                }}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
              />
            </div>
          </div>

          {/* Future Date Warning */}
          {isFutureDateTime && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>לא ניתן להזין ראייה בתאריך או שעה עתידיים. אנא בחרו את הזמן המדויק שכבר אירע.</span>
            </div>
          )}

          {/* Halachic Conflict Handling Banner */}
          {activeConflict === 'same_day' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>כבר קיימת ראייה רשומה בתאריך זה</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed pr-5">
                המחזור הפעיל כבר מתועד ב-{activeFlow?.hebrewDateStr}. אין צורך להזין ראייה נוספת לאותו יום.
              </p>
            </div>
          )}

          {activeConflict === 'bleeding_during_period' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>המחזור הנוכחי עדיין פעיל (טרם נעשה הפסק טהרה)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                קיים מחזור פעיל מתאריך <strong>{activeFlow?.hebrewDateStr}</strong> ({activeFlow?.gregorianDate}).  
                בהלכה, דימום בימים אלו הוא המשך ישיר של אותו מחזור ואינו קובע עונות פרישה חדשות.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleUpdateActiveFlowDate}
                  disabled={isSubmitting || isFutureDateTime}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  עדכן את תחילת המחזור הנוכחי לתאריך זה ({dateStr})
                </button>
              </div>
            </div>
          )}

          {activeConflict === 'in_seven_clean_days' && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-950">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>ראיית דם במהלך שבעה נקיים</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                הנכם נמצאים כעת בימי שבעה נקיים. הזנת ראייה חדשה תבטל את הספירה הנוכחית ותתחיל מחזור וספירה חדשים.
              </p>
            </div>
          )}

          {/* Live Halachic Preview Box */}
          {preview && !isFutureDateTime && (
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
                  <span>הראייה אירעה לאחר שקיעת החמה, ולכן שייכת ליום המחרת ההלכתי (עונת לילה).</span>
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
              disabled={isSubmitting || !preview || isFutureDateTime || activeConflict === 'same_day' || activeConflict === 'bleeding_during_period'}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              {activeConflict === 'in_seven_clean_days' ? 'אישור ומחזור חדש' : 'שמור וחשב זמנים'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
