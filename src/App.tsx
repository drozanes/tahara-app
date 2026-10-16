import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { MonthlyCalendar } from './components/calendar/MonthlyCalendar';
import { TaharaCard } from './components/tahara/TaharaCard';
import { NewCycleModal } from './components/forms/NewCycleModal';
import { CoupleShareModal } from './components/couple/CoupleShareModal';
import { HalachicSettingsModal } from './components/settings/HalachicSettingsModal';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Moon, 
  Sun, 
  Trash2
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { 
    profile, 
    flows, 
    onot, 
    deleteFlow 
  } = useApp();

  const [isNewCycleOpen, setIsNewCycleOpen] = useState(false);
  const [selectedFlowDate, setSelectedFlowDate] = useState<string | undefined>(undefined);
  const [isCoupleOpen, setIsCoupleOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleOpenNewCycle = (dateStr?: string) => {
    setSelectedFlowDate(dateStr);
    setIsNewCycleOpen(true);
  };

  const handleScrollToCalendar = () => {
    document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToOnot = () => {
    document.getElementById('onot-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-28 sm:pb-14">
      
      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCouple={() => setIsCoupleOpen(true)}
        onOpenNewCycle={() => handleOpenNewCycle()}
      />

      {/* Main Unified Container */}
      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 py-5 sm:py-7 space-y-6">
        
        {/* Active Tahara Process Card */}
        <section id="tahara-section">
          <TaharaCard />
        </section>

        {/* Interactive Monthly Calendar */}
        <section id="calendar-section">
          <MonthlyCalendar onOpenNewCycleWithDate={handleOpenNewCycle} />
        </section>

        {/* Calculated Onot Prisha Summary Card */}
        <section id="onot-section" className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-base text-stone-900">זמני פרישה מחושבים</h3>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              לפי מנהג {profile.settings.custom === 'sephardi' ? 'ספרד' : profile.settings.custom === 'chabad' ? 'חב״ד' : 'אשכנז'}
            </span>
          </div>

          {onot.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">אין עונות פרישה מחושבות כעת. הזינו ראייה כדי לחשב זמנים אוטומטית.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {onot.map(ona => (
                <div 
                  key={ona.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    ona.isOrZarua 
                      ? 'border-amber-200 bg-amber-50/50' 
                      : 'border-rose-100 bg-rose-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-stone-800">{ona.title}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${
                      ona.ona === 'day' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {ona.ona === 'day' ? <Sun className="w-3 h-3 text-amber-600" /> : <Moon className="w-3 h-3 text-indigo-600" />}
                      עונת {ona.ona === 'day' ? 'יום' : 'לילה'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mb-2.5">{ona.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-200/50">
                    <span>תאריך: {ona.gregorianDate} ({ona.hebrewDateStr})</span>
                    <span className="font-medium text-stone-700">שעות: {ona.startTime} - {ona.endTime}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* History of Flows Card */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-base text-stone-900">היסטוריית ראיות ומחזורים</h3>
            </div>
            <button
              onClick={() => handleOpenNewCycle()}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              הוספת ראייה
            </button>
          </div>

          {flows.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">לא הוזנו ראיות עדיין.</p>
          ) : (
            <div className="space-y-2">
              {flows.map((flow, index) => (
                <div 
                  key={flow.id}
                  className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-100 flex items-center justify-between text-xs hover:bg-stone-50 transition-colors"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-800 text-sm">
                        {flow.hebrewDateStr}
                      </span>
                      <span className="text-stone-400">({flow.gregorianDate})</span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        flow.ona === 'day' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        עונת {flow.ona === 'day' ? 'יום' : 'לילה'}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-700">
                          מחזור פעיל
                        </span>
                      )}
                    </div>
                    {flow.notes && (
                      <p className="text-stone-500 text-[11px] mt-1">הערה: {flow.notes}</p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteFlow(flow.id)}
                    title="מחיקת ראייה"
                    className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        onOpenNewCycle={() => handleOpenNewCycle()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCouple={() => setIsCoupleOpen(true)}
        onScrollToCalendar={handleScrollToCalendar}
        onScrollToOnot={handleScrollToOnot}
      />

      {/* Modals */}
      <NewCycleModal 
        key={selectedFlowDate || 'new-cycle'}
        isOpen={isNewCycleOpen} 
        initialDate={selectedFlowDate}
        onClose={() => {
          setIsNewCycleOpen(false);
          setSelectedFlowDate(undefined);
        }} 
      />

      <CoupleShareModal
        isOpen={isCoupleOpen}
        onClose={() => setIsCoupleOpen(false)}
      />

      <HalachicSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
