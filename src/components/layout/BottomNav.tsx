import React from 'react';
import { 
  Plus, 
  Users, 
  Settings as SettingsIcon,
  Shield,
  Eye,
  Heart
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BottomNavProps {
  onOpenNewCycle: () => void;
  onOpenSettings: () => void;
  onOpenCouple: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenNewCycle,
  onOpenSettings,
  onOpenCouple,
}) => {
  const { profile, switchRole, toggleCamouflage } = useApp();
  const isWife = profile.currentRole === 'wife';

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto">
        
        {/* Toggle Role / Husband View */}
        <button
          onClick={() => switchRole(isWife ? 'husband' : 'wife')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            !isWife ? 'text-indigo-600 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          {!isWife ? <Eye className="w-5 h-5 text-indigo-600" /> : <Heart className="w-5 h-5 text-rose-500" />}
          <span className="text-[10px] mt-1 font-medium">{isWife ? 'תצוגת אישה' : 'תצוגת בעל'}</span>
        </button>

        {/* Couple Space */}
        <button
          onClick={onOpenCouple}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-500 hover:text-stone-800 transition-colors"
        >
          <Users className="w-5 h-5 text-stone-600" />
          <span className="text-[10px] mt-1 font-medium">מרחב זוגי</span>
        </button>

        {/* Center Prominent New Cycle Button (for Wife) */}
        {isWife ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </div>
        )}

        {/* Privacy Shield */}
        <button
          onClick={toggleCamouflage}
          className="flex flex-col items-center justify-center flex-1 py-1 text-stone-500 hover:text-stone-800 transition-colors"
          title="מצב הסוואה (מחשבון)"
        >
          <Shield className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px] mt-1 font-medium">הסוואה</span>
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
