import React, { useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Sparkles,
  Eye,
  Heart
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
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
  const { profile, settings, switchRole, toggleCamouflage } = useApp();

  const todayInfo = useMemo(() => {
    return determineOnaAndHebrewDate(new Date(), settings.locationName);
  }, [settings.locationName]);

  const isWife = profile.currentRole === 'wife';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-xs">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        
        {/* Brand & Today's Hebrew Info */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-400 flex items-center justify-center text-white shadow-sm shadow-rose-200 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-bold text-stone-800 text-sm sm:text-lg leading-tight">טהרת המשפחה</h1>
              <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                {settings.custom === 'sephardi' ? 'ספרד' : settings.custom === 'chabad' ? 'חב״ד' : 'אשכנז'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-stone-500">
              <span className="font-medium text-stone-700">{todayInfo.hebrewDateStr}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-stone-600">
                {todayInfo.ona === 'day' ? <Sun className="w-3 h-3 text-amber-500" /> : <Moon className="w-3 h-3 text-indigo-400" />}
                שקיעה: {formatTime(todayInfo.zmanim.sunset)}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3">
          
          {/* Couple Role Toggle */}
          <div className="bg-stone-100 p-1 rounded-xl flex items-center text-xs font-medium">
            <button
              onClick={() => switchRole('wife')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                isWife 
                  ? 'bg-white text-rose-600 shadow-sm font-semibold' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>תצוגת אישה</span>
            </button>
            <button
              onClick={() => switchRole('husband')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                !isWife 
                  ? 'bg-white text-indigo-600 shadow-sm font-semibold' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>תצוגת בעל</span>
            </button>
          </div>

          {/* Privacy Camouflage Shield Button */}
          <button
            onClick={toggleCamouflage}
            title="מצב הסוואה מיידי (החלפה למחשבון)"
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors relative"
          >
            <Shield className="w-5 h-5 text-emerald-600" />
          </button>

          {/* Couple Share Button */}
          <button
            onClick={onOpenCouple}
            title="שיתוף וחיבור בן זוג"
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <Users className="w-5 h-5 text-rose-600" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="הגדרות הלכתיות ומיקום"
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>

          {/* New Cycle Button */}
          {isWife && (
            <button
              onClick={onOpenNewCycle}
              className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm hover:shadow transition-all active:scale-95"
            >
              <span>+ הזנת ראייה</span>
            </button>
          )}

        </div>

        {/* Mobile Quick Shield Button in Header */}
        <div className="flex sm:hidden items-center gap-1">
          <button
            onClick={toggleCamouflage}
            title="מצב הסוואה (מחשבון)"
            className="p-2 rounded-xl bg-stone-100/80 text-emerald-600 hover:bg-stone-200 transition-colors flex items-center gap-1"
          >
            <Shield className="w-4 h-4" />
            <span className="text-[11px] font-medium text-stone-600">הסוואה</span>
          </button>
        </div>

      </div>
    </header>
  );
};
