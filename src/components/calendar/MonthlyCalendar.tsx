import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sun, 
  Moon, 
  Calendar as CalendarIcon, 
  X,
  Plus,
  Check,
  Undo2,
  AlertCircle
} from 'lucide-react';
import { HDate } from '@hebcal/core';
import { useApp } from '../../context/AppContext';
import { 
  toDateString, 
  getZmanimForDate, 
  formatTime,
  getMonthEvents 
} from '../../engine/zmanim';
import type { PrishaOna } from '../../types/halacha';

interface MonthlyCalendarProps {
  onOpenNewCycleWithDate?: (dateStr: string) => void;
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ onOpenNewCycleWithDate }) => {
  const { 
    flows, 
    onot, 
    taharaProcess, 
    settings,
    recordHefsek,
    cancelHefsek 
  } = useApp();

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [selectedDay, setSelectedDay] = useState<{
    dateStr: string;
    hebrewStr: string;
    onot: PrishaOna[];
    isFlow: boolean;
    isCleanDay?: number;
    isMikvehNight: boolean;
    parasha?: string;
    holidays: string[];
    sunrise: string;
    sunset: string;
    tzeit: string;
  } | null>(null);

  // Close modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedDay) {
        setSelectedDay(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDay]);

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Holidays & Parashot for the year/month
  const monthEvents = useMemo(() => {
    return getMonthEvents(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);

  // Build calendar matrix (Sunday to Saturday)
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Padding for days before the 1st
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = toDateString(dateObj);
      const hDate = new HDate(dateObj);
      const hebrewStr = hDate.renderGematriya();
      const zmanim = getZmanimForDate(dateObj, settings.locationName);

      // Check if any flow on this day
      const isFlow = flows.some(f => f.gregorianDate === dateStr);

      // Check onot on this day
      const dayOnot = onot.filter(o => o.gregorianDate === dateStr);

      // Check clean days
      const cleanDayObj = taharaProcess?.cleanDays?.find(c => c.gregorianDate === dateStr);
      const isCleanDay = cleanDayObj ? cleanDayObj.dayNumber : undefined;

      // Check Mikveh night
      const isMikvehNight = taharaProcess?.mikvehNightDate === dateStr;

      // Parasha and Holidays
      const events = monthEvents.get(dateStr) || [];
      const parasha = events.find(e => e.isParasha)?.title;
      const holidays = events.filter(e => !e.isParasha).map(e => e.title);

      days.push({
        dayNumber: d,
        dateObj,
        dateStr,
        hebrewStr,
        dayOnot,
        isFlow,
        isCleanDay,
        isMikvehNight,
        parasha,
        holidays,
        sunrise: formatTime(zmanim.sunrise),
        sunset: formatTime(zmanim.sunset),
        tzeit: formatTime(zmanim.tzeit)
      });
    }

    return days;
  }, [currentMonth, flows, onot, taharaProcess, settings.locationName, monthEvents]);

  const monthTitle = currentMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  const todayStr = toDateString(new Date());

  const daysOfWeek = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/80 shadow-sm">
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-rose-500" />
          <h2 className="text-base sm:text-lg font-bold text-stone-800 capitalize">
            {monthTitle}
          </h2>
        </div>

        {/* Prev / Next Month Controls */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-white transition-colors"
            title="חודש קודם"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            className="px-2 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
          >
            היום
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-white transition-colors"
            title="חודש הבא"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
        {daysOfWeek.map((day, idx) => (
          <div key={day} className={`text-xs font-semibold py-1 ${idx === 6 ? 'text-amber-700 font-bold' : 'text-stone-500'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="min-h-[75px] sm:min-h-[98px] rounded-2xl bg-stone-50/30" />;
          }

          const isToday = day.dateStr === todayStr;
          const hasOnot = day.dayOnot.length > 0;
          const isShabbat = day.dateObj.getDay() === 6;

          return (
            <div
              key={day.dateStr}
              onClick={() => setSelectedDay({
                dateStr: day.dateStr,
                hebrewStr: day.hebrewStr,
                onot: day.dayOnot,
                isFlow: day.isFlow,
                isCleanDay: day.isCleanDay,
                isMikvehNight: day.isMikvehNight,
                parasha: day.parasha,
                holidays: day.holidays,
                sunrise: day.sunrise,
                sunset: day.sunset,
                tzeit: day.tzeit
              })}
              className={`min-h-[75px] sm:min-h-[98px] rounded-2xl p-1.5 sm:p-2 border transition-all cursor-pointer flex flex-col justify-between select-none ${
                isToday 
                  ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-300' 
                  : day.isFlow
                  ? 'border-rose-200 bg-rose-50/70 hover:bg-rose-100/60'
                  : hasOnot
                  ? 'border-amber-200 bg-amber-50/60 hover:bg-amber-100/60'
                  : day.isCleanDay
                  ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/40'
                  : isShabbat
                  ? 'border-amber-100/80 bg-amber-50/30 hover:bg-amber-100/40'
                  : 'border-stone-100 bg-stone-50/50 hover:bg-stone-100/70'
              }`}
            >
              {/* Day numbers (Gregorian & Hebrew) */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isToday ? 'text-rose-600' : isShabbat ? 'text-amber-800' : 'text-stone-700'}`}>
                  {day.dayNumber}
                </span>
                <span className="text-[10px] text-stone-600 font-medium">
                  {day.hebrewStr.split(' ')[0]}
                </span>
              </div>

              {/* Event Tags */}
              <div className="flex flex-col gap-1 mt-1">
                
                {/* Parashat Hashavua on Shabbat */}
                {day.parasha && (
                  <span 
                    title={day.parasha}
                    className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-bold bg-amber-100/90 text-amber-900 border border-amber-200 truncate"
                  >
                    📖 {day.parasha.replace('פָּרָשַׁת ', '').replace('פַּרְשַׁת ', '')}
                  </span>
                )}

                {/* Holidays / Rosh Chodesh */}
                {day.holidays.map((h, hIdx) => (
                  <span 
                    key={`hol-${hIdx}`}
                    title={h}
                    className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-medium bg-blue-50 text-blue-800 border border-blue-200/60 truncate"
                  >
                    ✡️ {h}
                  </span>
                ))}

                {/* Flow Tag */}
                {day.isFlow && (
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white truncate shadow-2xs">
                    ראייה
                  </span>
                )}

                {/* Onot Prisha */}
                {day.dayOnot.map(o => (
                  <span 
                    key={o.id}
                    title={o.title}
                    className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium truncate ${
                      o.isOrZarua 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-rose-100 text-rose-800 font-bold'
                    }`}
                  >
                    {o.ona === 'day' ? <Sun className="w-2.5 h-2.5 text-amber-600 shrink-0" /> : <Moon className="w-2.5 h-2.5 text-indigo-500 shrink-0" />}
                    <span className="truncate">{o.title.split(' ')[0]}</span>
                  </span>
                ))}

                {/* 7 Clean days */}
                {day.isCleanDay && (
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-emerald-100 text-emerald-800">
                    נקי {day.isCleanDay}
                  </span>
                )}

                {/* Mikveh Night */}
                {day.isMikvehNight && (
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-purple-600 text-white">
                    טבילה
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-stone-100 text-xs text-stone-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span>ראייה</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-100 border border-rose-300" />
          <span>עונת פרישה</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300" />
          <span>אור זרוע</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300" />
          <span>שבעה נקיים</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-600" />
          <span>ליל טבילה</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300" />
          <span>חג / ראש חודש</span>
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDay && (
        <div 
          onClick={() => setSelectedDay(null)}
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto cursor-default"
          >
            
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">{selectedDay.hebrewStr}</h3>
                <p className="text-xs text-stone-500">{selectedDay.dateStr}</p>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Parasha & Holidays Banner */}
            {(selectedDay.parasha || selectedDay.holidays.length > 0) && (
              <div className="mb-4 space-y-1.5">
                {selectedDay.parasha && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-bold flex items-center gap-2">
                    <span>📖</span>
                    <span>{selectedDay.parasha}</span>
                  </div>
                )}
                {selectedDay.holidays.map((h, idx) => (
                  <div key={idx} className="p-2 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-900 font-semibold flex items-center gap-2">
                    <span>✡️</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Zmanim */}
            <div className="bg-stone-50 rounded-2xl p-3 text-xs space-y-1.5 mb-4 border border-stone-100">
              <div className="flex justify-between text-stone-600">
                <span>זריחה: {selectedDay.sunrise}</span>
                <span>שקיעה: {selectedDay.sunset}</span>
                <span>צאת הכוכבים: {selectedDay.tzeit}</span>
              </div>
            </div>

            {/* Events on this day */}
            <div className="space-y-2 mb-5">
              {selectedDay.isFlow && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                  <span className="font-bold">ראיית דם / תחילת וסת</span>
                </div>
              )}

              {selectedDay.onot.map(o => (
                <div key={o.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>{o.title}</span>
                    <span className="flex items-center gap-1 font-semibold text-[11px]">
                      {o.ona === 'day' ? <Sun className="w-3 h-3 text-amber-600" /> : <Moon className="w-3 h-3 text-indigo-500" />}
                      עונת {o.ona === 'day' ? 'יום' : 'לילה'}
                    </span>
                  </div>
                  <p className="text-amber-800/90 text-[11px]">{o.description}</p>
                  <p className="text-[10px] text-amber-700/80">שעות העונה: {o.startTime} - {o.endTime}</p>
                </div>
              ))}

              {selectedDay.isCleanDay && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <span className="font-bold">שבעה נקיים: יום {selectedDay.isCleanDay} מתוך 7</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">יש לבצע בדיקת שחרית ובדיקת מנחה לפני שקיעה.</p>
                </div>
              )}

              {selectedDay.isMikvehNight && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 font-bold">
                  ליל טבילה במקווה (מ-{selectedDay.tzeit})
                </div>
              )}

              {!selectedDay.isFlow && selectedDay.onot.length === 0 && !selectedDay.isCleanDay && !selectedDay.isMikvehNight && (
                <p className="text-xs text-stone-500 text-center py-1">אין עונות פרישה מיוחדות ביום זה.</p>
              )}
            </div>

            {/* Quick Actions on this Selected Date */}
            <div className="pt-3 border-t border-stone-100 space-y-2 mb-4">
              <span className="text-[11px] font-bold text-stone-500 block">פעולות לתאריך זה:</span>

              {/* Add Flow on this date */}
              <button
                onClick={() => {
                  const dateToUse = selectedDay.dateStr;
                  setSelectedDay(null);
                  if (onOpenNewCycleWithDate) {
                    onOpenNewCycleWithDate(dateToUse);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-rose-200"
              >
                <Plus className="w-3.5 h-3.5" />
                הזנת ראייה בתאריך זה ({selectedDay.dateStr})
              </button>

              {/* Perform Hefsek on this date (if cycle active and not done) */}
              {taharaProcess && !taharaProcess.hefsekDone && (
                selectedDay.dateStr >= taharaProcess.earliestHefsekDate ? (
                  <button
                    onClick={() => {
                      recordHefsek(selectedDay.dateStr, true);
                      setSelectedDay(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    הפסק טהרה ביום זה
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-amber-900">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>הפסק טהרה אינו אפשרי בתאריך זה</span>
                    </div>
                    <p className="text-amber-700 leading-relaxed pr-4">
                      לפי מנהג {settings.custom === 'sephardi' ? 'ספרד (4 ימים)' : 'אשכנז/חב״ד (5 ימים)'}, מועד הפסק מוקדם יחול רק ב-{taharaProcess.earliestHefsekDate}.
                    </p>
                  </div>
                )
              )}

              {/* Undo Hefsek if active */}
              {taharaProcess && taharaProcess.hefsekDone && (
                <button
                  onClick={() => {
                    cancelHefsek();
                    setSelectedDay(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  ביטול הפסק טהרה
                </button>
              )}
            </div>

            <button
              onClick={() => setSelectedDay(null)}
              className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition-colors"
            >
              סגור
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
