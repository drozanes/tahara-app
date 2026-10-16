import React, { useMemo } from 'react';
import { 
  Users, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Sparkles,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/useApp';
import { determineOnaAndHebrewDate, formatTime } from '../../engine/zmanim';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenCouple: () => void;
  onOpenNewCycle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenCouple,
  onOpenNewCycle
}) => {
  const { settings } = useApp();

  const todayInfo = useMemo(() => {
    return determineOnaAndHebrewDate(new Date(), settings.locationName);
  }, [settings.locationName]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100/80 shadow-2xs">
      <div className="max-w-5xl mx-auto px-4 h-15 sm:h-16 flex items-center justify-between">
        
        {/* Brand & Today's Hebrew Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-400 flex items-center justify-center text-white shadow-sm shadow-rose-200 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-stone-800 text-sm sm:text-lg leading-tight tracking-tight">טהרת המשפחה</h1>
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                {settings.custom === 'sephardi' ? 'ספרד' : settings.custom === 'chabad' ? 'חב״ד' : 'אשכנז'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-stone-500 mt-0.5">
              <span className="font-medium text-stone-700">{todayInfo.hebrewDateStr}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-stone-600 font-medium">
                {todayInfo.ona === 'day' ? <Sun className="w-3 h-3 text-amber-500" /> : <Moon className="w-3 h-3 text-indigo-400" />}
                שקיעה: {formatTime(todayInfo.zmanim.sunset)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Couple Sync Button */}
          <button
            onClick={onOpenCouple}
            title="מרחב זוגי וסנכרון"
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-600" />
            <span className="hidden sm:inline">מרחב זוגי</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="הגדרות הלכתיות ומיקום"
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <SettingsIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-stone-600" />
            <span className="hidden sm:inline">הגדרות</span>
          </button>

          {/* New Cycle Button (Desktop) */}
          <button
            onClick={onOpenNewCycle}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>הזנת ראייה</span>
          </button>

        </div>

      </div>
    </header>
  );
};
