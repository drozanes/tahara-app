import React from 'react';
import { 
  Heart, 
  ShieldAlert, 
  Moon, 
  Sun, 
  Clock,
  Calendar, 
  CheckCircle2, 
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toDateString, formatTime, getZmanimForDate } from '../../engine/zmanim';

export const HusbandView: React.FC = () => {
  const { onot, taharaProcess, settings, profile } = useApp();

  const todayStr = toDateString(new Date());
  const todayZmanim = getZmanimForDate(new Date(), settings.locationName);

  // Check if today has an active Ona
  const activeOnotToday = onot.filter(o => o.gregorianDate === todayStr);
  const nextUpcomingOnot = onot
    .filter(o => o.gregorianDate >= todayStr)
    .sort((a, b) => a.gregorianDate.localeCompare(b.gregorianDate))
    .slice(0, 3);

  // Determine status for husband
  const isTaharaActive = taharaProcess && taharaProcess.status !== 'tahor';
  const isMikvehTonight = taharaProcess && taharaProcess.status === 'mikveh_night';

  return (
    <div className="space-y-6">
      
      {/* Husband Welcome & Status Banner */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-indigo-300 tracking-wider">
            מרחב זוגי • {profile.wifeName} & {profile.husbandName}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white backdrop-blur-sm border border-white/10">
            תצוגת בעל
          </span>
        </div>

        {/* Big Halachic Status */}
        <div className="my-3">
          {activeOnotToday.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-amber-300">היום עונת פרישה</h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  {activeOnotToday.map(o => `${o.title} (${o.ona === 'day' ? 'עונת יום' : 'עונת לילה'})`).join(' • ')}
                </p>
              </div>
            </div>
          ) : isMikvehTonight ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-emerald-300">הערב ליל טבילה בע״ה</h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  מזמן צאת הכוכבים ({taharaProcess?.mikvehEarliestTime || formatTime(todayZmanim.tzeit)})
                </p>
              </div>
            </div>
          ) : isTaharaActive ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 border border-rose-500/30">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-rose-200">
                  {taharaProcess?.hefsekDone ? 'בימי שבעה נקיים' : 'ימי מחזור (ממתינים להפסק)'}
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  {taharaProcess?.mikvehNightDate 
                    ? `טבילה צפויה: ${taharaProcess.mikvehNightDate}` 
                    : `הפסק מוקדם: ${taharaProcess?.earliestHefsekDate}`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-emerald-300">זמן היתר</h3>
                <p className="text-xs text-stone-300 mt-0.5">אין עונות פרישה פעילות כעת</p>
              </div>
            </div>
          )}
        </div>

        {/* Zmanim Today */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-indigo-200">
          <span>זריחה: {formatTime(todayZmanim.sunrise)}</span>
          <span>שקיעה: {formatTime(todayZmanim.sunset)}</span>
          <span>צאת כוכבים: {formatTime(todayZmanim.tzeit)}</span>
        </div>
      </div>

      {/* Upcoming Onot Prisha List */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm">
        <h3 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          עונות פרישה קרובות
        </h3>

        {nextUpcomingOnot.length === 0 ? (
          <p className="text-xs text-stone-500 text-center py-4">אין עונות פרישה צפויות בטווח הקרוב.</p>
        ) : (
          <div className="space-y-3">
            {nextUpcomingOnot.map(ona => (
              <div 
                key={ona.id}
                className="p-4 rounded-2xl border border-stone-100 bg-stone-50/70 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-800">{ona.title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600 font-medium">
                      {ona.hebrewDateStr}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">{ona.description}</p>
                </div>

                <div className="text-left shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl ${
                    ona.ona === 'day' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {ona.ona === 'day' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    עונת {ona.ona === 'day' ? 'יום' : 'לילה'}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-1">{ona.gregorianDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Halachic Guidelines for Husband */}
      <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 text-xs text-stone-600 space-y-2">
        <h4 className="font-bold text-stone-800 flex items-center gap-1.5 text-sm">
          <HelpCircle className="w-4 h-4 text-stone-500" />
          הלכות עונת פרישה בקצרה:
        </h4>
        <ul className="list-disc list-inside space-y-1 text-stone-600 leading-relaxed pr-1">
          <li><strong>איסור תשמיש:</strong> בעונת הפרישה נאסרו בני הזוג בתשמיש המיטה.</li>
          <li><strong>הרחקות:</strong> רוב הפוסקים מקלים בשאר הרחקות (נגיעה, חיבוק, הושטה מיד ליד) בעונת פרישה סמוך לווסת, ובלבד שנזהרים בתשמיש.</li>
          <li><strong>עונת אור זרוע:</strong> למנהג אשכנז וחב״ד, פורשים גם בעונה הסמוכה לעונת הפרישה.</li>
          <li><strong>בדיקה:</strong> חובת בדיקה בעונת הפרישה כדי לוודא שלא ראתה.</li>
        </ul>
      </div>

    </div>
  );
};
