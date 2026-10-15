import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles, 
  Check, 
  HeartHandshake,
  Undo2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatTime, toDateString, getZmanimForDate } from '../../engine/zmanim';

export const TaharaCard: React.FC = () => {
  const { 
    activeFlow, 
    taharaProcess, 
    settings, 
    recordHefsek, 
    cancelHefsek,
    toggleBedika 
  } = useApp();

  const [isHefsekModalOpen, setIsHefsekModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [rabbinicExemption, setRabbinicExemption] = useState(false);
  const [mochDachuk, setMochDachuk] = useState(true);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isHefsekModalOpen) setIsHefsekModalOpen(false);
        if (isCancelConfirmOpen) setIsCancelConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHefsekModalOpen, isCancelConfirmOpen]);

  if (!activeFlow || !taharaProcess) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm text-center">
        <Sparkles className="w-8 h-8 text-rose-300 mx-auto mb-2" />
        <h3 className="text-base font-bold text-stone-800">אין מחזור פעיל כעת</h3>
        <p className="text-xs text-stone-500 mt-1">הזיני ראייה חדשה כדי להתחיל מעקב וחישוב זמני פרישה</p>
      </div>
    );
  }

  const todayStr = toDateString(new Date());
  const todayZmanim = getZmanimForDate(new Date(), settings.locationName);
  const isEarliestReached = todayStr >= taharaProcess.earliestHefsekDate;

  const handleConfirmHefsek = () => {
    recordHefsek(todayStr, mochDachuk);
    setIsHefsekModalOpen(false);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-sm relative overflow-hidden">
      
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl -z-10" />

      {/* Header with status badge */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">תהליך טהרה נוכחי</span>
          <h2 className="text-lg font-bold text-stone-900 mt-0.5">
            ראייה ב-{activeFlow.hebrewDateStr}
          </h2>
        </div>

        {/* Dynamic Status Badge */}
        <div>
          {taharaProcess.status === 'active_flow' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
              <Clock className="w-3.5 h-3.5" />
              ימי מחזור (ממתין להפסק)
            </span>
          )}
          {taharaProcess.status === 'ready_for_hefsek' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              הגיע זמן הפסק טהרה
            </span>
          )}
          {taharaProcess.status === 'seven_clean_days' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              בשבעה נקיים
            </span>
          )}
          {taharaProcess.status === 'mikveh_night' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 animate-bounce">
              <HeartHandshake className="w-3.5 h-3.5" />
              הערב ליל טבילה!
            </span>
          )}
          {taharaProcess.status === 'tahor' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              טהורה
            </span>
          )}
        </div>
      </div>

      {/* Hefsek Tahara Section */}
      {!taharaProcess.hefsekDone ? (
        <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
          isEarliestReached || rabbinicExemption
            ? 'bg-rose-50/60 border-rose-100'
            : 'bg-amber-50/60 border-amber-200'
        }`}>
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-stone-900">
                מועד הפסק מוקדם: {taharaProcess.earliestHefsekDate}
              </p>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600 font-medium">
                מינימום {settings.minDaysToHefsek} ימים ({settings.custom === 'sephardi' ? 'ספרד' : 'אשכנז/חב״ד'})
              </span>
            </div>
            
            {isEarliestReached ? (
              <p className="text-xs text-rose-700/80 mt-1">
                הגיע הזמן המוקדם ביותר. יש לבצע בדיקה לפני שקיעת החמה (היום ב-{formatTime(todayZmanim.sunset)}).
              </p>
            ) : rabbinicExemption ? (
              <p className="text-xs text-amber-800 mt-1 font-medium">
                הופעל היתר רב להקדמת הפסק טהרה לפני המועד המינימלי.
              </p>
            ) : (
              <div className="mt-1 space-y-1">
                <p className="text-xs text-amber-800">
                  טרם הגיע המועד המינימלי להפסק טהרה לפי מנהגכם.
                </p>
                <button
                  type="button"
                  onClick={() => setRabbinicExemption(true)}
                  className="text-[11px] text-amber-700 underline hover:text-amber-900 font-semibold"
                >
                  האם קיבלתם היתר מיוחד מרב להקדים?
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsHefsekModalOpen(true)}
            disabled={!isEarliestReached && !rabbinicExemption}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 ${
              isEarliestReached || rabbinicExemption
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Check className="w-4 h-4" />
            {isEarliestReached || rabbinicExemption ? 'ביצוע הפסק טהרה' : 'טרם הגיע הזמן'}
          </button>
        </div>
      ) : (
        /* Seven Clean Days Checklist */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100 gap-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-stone-700">מעקב 7 נקיים (שחרית ומנחה לפני שקיעה)</span>
              <button
                onClick={() => setIsCancelConfirmOpen(true)}
                className="text-[11px] text-stone-400 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg hover:bg-rose-50"
                title="ביטול הפסק טהרה במידה ונלחץ בטעות"
              >
                <Undo2 className="w-3 h-3" />
                ביטול הפסק
              </button>
            </div>
            {taharaProcess.mikvehNightDate && (
              <span className="text-purple-700 font-medium">
                טבילה: {taharaProcess.mikvehNightDate} (מ-{taharaProcess.mikvehEarliestTime})
              </span>
            )}
          </div>

          <div className="flex sm:grid sm:grid-cols-7 overflow-x-auto pb-2 gap-2 scrollbar-none snap-x -mx-1 px-1 sm:mx-0 sm:px-0">
            {taharaProcess.cleanDays?.map((day) => {
              const isToday = day.gregorianDate === todayStr;
              const isFuture = day.gregorianDate > todayStr;
              return (
                <div 
                  key={day.dayNumber}
                  className={`min-w-[105px] sm:min-w-0 flex-1 snap-center shrink-0 rounded-2xl p-2.5 sm:p-3 border text-center transition-all ${
                    isToday 
                      ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-300/40 shadow-xs' 
                      : isFuture
                      ? 'bg-stone-50/40 border-stone-100 opacity-60'
                      : 'bg-stone-50/70 border-stone-200/70'
                  }`}
                >
                  <div className="flex justify-between items-center sm:block">
                    <span className={`text-xs font-bold ${isFuture ? 'text-stone-400' : 'text-stone-800'}`}>יום {day.dayNumber}</span>
                    <span className="text-[10px] text-stone-400 block">{day.gregorianDate.slice(5)}</span>
                  </div>

                  <div className="mt-2.5 flex sm:flex-col gap-2 justify-center">
                    {/* Morning Bedika */}
                    <button
                      onClick={() => !isFuture && toggleBedika(day.dayNumber, 'morning')}
                      disabled={isFuture}
                      title={isFuture ? "לא ניתן לסמן בדיקה עתידית" : "בדיקת שחרית"}
                      className={`flex-1 sm:w-full py-1 px-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
                        isFuture
                          ? 'bg-stone-100/50 text-stone-300 border border-dashed border-stone-200 cursor-not-allowed'
                          : day.morningBedikaDone 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-300'
                      }`}
                    >
                      {day.morningBedikaDone ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3 text-stone-300" />}
                      שחרית
                    </button>

                    {/* Afternoon Bedika */}
                    <button
                      onClick={() => !isFuture && toggleBedika(day.dayNumber, 'afternoon')}
                      disabled={isFuture}
                      title={isFuture ? "לא ניתן לסמן בדיקה עתידית" : "בדיקת מנחה לפני שקיעה"}
                      className={`flex-1 sm:w-full py-1 px-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
                        isFuture
                          ? 'bg-stone-100/50 text-stone-300 border border-dashed border-stone-200 cursor-not-allowed'
                          : day.afternoonBedikaDone 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-300'
                      }`}
                    >
                      {day.afternoonBedikaDone ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3 text-stone-300" />}
                      מנחה
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hefsek Confirmation Modal */}
      {isHefsekModalOpen && (
        <div 
          onClick={() => setIsHefsekModalOpen(false)}
          className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-rose-100 text-center animate-in slide-in-from-bottom duration-200 cursor-default pb-8 sm:pb-6"
          >
            <div className="w-12 h-1 rounded-full bg-stone-300 mx-auto mb-4 sm:hidden" />
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">אישור הפסק טהרה</h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              האם הבדיקה בוצעה לפני שקיעת החמה ויצאה נקייה ללא מראות אוסרים?
            </p>

            <label className="flex items-center justify-center gap-2 text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200 mb-5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={mochDachuk} 
                onChange={(e) => setMochDachuk(e.target.checked)}
                className="rounded text-rose-500 focus:ring-rose-400" 
              />
              <span>נעשה מוך דחוק (עד צאת הכוכבים)</span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => setIsHefsekModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold"
              >
                ביטול
              </button>
              <button
                onClick={handleConfirmHefsek}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-200"
              >
                אישור והתחלת 7 נקיים
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Hefsek Confirmation Modal */}
      {isCancelConfirmOpen && (
        <div 
          onClick={() => setIsCancelConfirmOpen(false)}
          className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-stone-200 text-center animate-in slide-in-from-bottom duration-200 cursor-default pb-8 sm:pb-6"
          >
            <div className="w-12 h-1 rounded-full bg-stone-300 mx-auto mb-4 sm:hidden" />
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Undo2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">ביטול הפסק טהרה</h3>
            <p className="text-xs text-stone-500 mt-1 mb-5">
              האם לבטל את הפסק הטהרה ולהחזיר את המחזור למצב פעיל? כל הבדיקות שסומנו יאופסו.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCancelConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold"
              >
                חזרה
              </button>
              <button
                onClick={() => {
                  cancelHefsek();
                  setIsCancelConfirmOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-200"
              >
                אישור ביטול
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
