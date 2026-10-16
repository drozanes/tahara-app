import React from 'react';
import { 
  Plus, 
  Users, 
  Settings as SettingsIcon,
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';

interface BottomNavProps {
  onOpenNewCycle: () => void;
  onOpenSettings: () => void;
  onOpenCouple: () => void;
  onScrollToCalendar?: () => void;
  onScrollToOnot?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenNewCycle,
  onOpenSettings,
  onOpenCouple,
  onScrollToCalendar,
  onScrollToOnot,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        
        {/* Calendar Shortcut */}
        <button
          onClick={onScrollToCalendar || (() => {
            const el = document.getElementById('calendar-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          })}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-500 hover:text-stone-800 transition-colors"
        >
          <CalendarIcon className="w-5 h-5 text-stone-600" />
          <span className="text-[10px] mt-1 font-medium">לוח שנה</span>
        </button>

        {/* Onot Shortcut */}
        <button
          onClick={onScrollToOnot || (() => {
            const el = document.getElementById('onot-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          })}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-500 hover:text-stone-800 transition-colors"
        >
          <Clock className="w-5 h-5 text-stone-600" />
          <span className="text-[10px] mt-1 font-medium">עונות</span>
        </button>

        {/* Center Prominent New Cycle Button */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={onOpenNewCycle}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 text-white shadow-lg shadow-rose-300 flex items-center justify-center active:scale-95 transition-transform border-4 border-white"
            title="הזנת ראייה חדשה"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-bold text-rose-600 mt-0.5">ראייה חדשה</span>
        </div>

        {/* Couple Space */}
        <button
          onClick={onOpenCouple}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-500 hover:text-stone-800 transition-colors"
        >
          <Users className="w-5 h-5 text-stone-600" />
          <span className="text-[10px] mt-1 font-medium">מרחב זוגי</span>
        </button>

        {/* Halachic Settings */}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-500 hover:text-stone-800 transition-colors"
        >
          <SettingsIcon className="w-5 h-5 text-stone-600" />
          <span className="text-[10px] mt-1 font-medium">הגדרות</span>
        </button>

      </div>
    </nav>
  );
};
