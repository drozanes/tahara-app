import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { PrivacyShield } from './components/layout/PrivacyShield';
import { MonthlyCalendar } from './components/calendar/MonthlyCalendar';
import { TaharaCard } from './components/tahara/TaharaCard';
import { HusbandView } from './components/couple/HusbandView';
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
    isCamouflage, 
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

  // If camouflage mode is on, render the functional calculator shield
  if (isCamouflage) {
    return <PrivacyShield />;
  }

  const isWife = profile.currentRole === 'wife';

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      
      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCouple={() => setIsCoupleOpen(true)}
        onOpenNewCycle={() => handleOpenNewCycle()}
      />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        
        {/* Husband Mode View */}
        {!isWife ? (
          <HusbandView />
        ) : (
          /* Wife Mode View */
          <>
            {/* Active Tahara Process Card */}
            <TaharaCard />

            {/* Interactive Monthly Calendar */}
            <MonthlyCalendar onOpenNewCycleWithDate={handleOpenNewCycle} />

            {/* Calculated Onot Prisha Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm">
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
                <p className="text-xs text-stone-500 text-center py-4">אין עונות פרישה מחושבות. הזן ראייה כדי לחשב זמנים.</p>
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
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                          ona.ona === 'day' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {ona.ona === 'day' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                          עונת {ona.ona === 'day' ? 'יום' : 'לילה'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mb-2">{ona.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-200/40">
                        <span>תאריך: {ona.gregorianDate} ({ona.hebrewDateStr})</span>
                        <span>שעות: {ona.startTime} - {ona.endTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History of Flows Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-base text-stone-900">היסטוריית ראיות ומחזורים</h3>
                </div>
                <button
                  onClick={() => setIsNewCycleOpen(true)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  הוספת ראייה
                </button>
              </div>

              {flows.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-4">לא הוזנו ראיות עדיין.</p>
              ) : (
                <div className="space-y-2">
                  {flows.map((flow, index) => (
                    <div 
                      key={flow.id}
                      className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
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
            </div>
          </>
        )}

      </main>

      {/* Floating Action Button (Mobile) for New Cycle */}
      {isWife && (
        <button
          onClick={() => setIsNewCycleOpen(true)}
          className="sm:hidden fixed bottom-6 left-6 z-30 w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-xl shadow-rose-300 flex items-center justify-center active:scale-95 transition-transform"
          title="הזנת ראייה חדשה"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modals */}
      <NewCycleModal 
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
