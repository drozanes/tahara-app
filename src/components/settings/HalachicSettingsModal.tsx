import React, { useState } from 'react';
import { X, BookOpen, MapPin, Sliders } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_SETTINGS, type HalachicCustom, type HalachicSettings } from '../../types/halacha';

interface HalachicSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CITIES = [
  'Jerusalem',
  'Tel Aviv',
  'Bnei Brak',
  'Haifa',
  'Beer Sheva',
  'New York',
  'London'
];

const CITY_LABELS: Record<string, string> = {
  'Jerusalem': 'ירושלים',
  'Tel Aviv': 'תל אביב',
  'Bnei Brak': 'בני ברק',
  'Haifa': 'חיפה',
  'Beer Sheva': 'באר שבע',
  'New York': 'ניו יורק',
  'London': 'לונדון'
};

export const HalachicSettingsModal: React.FC<HalachicSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useApp();
  const [formData, setFormData] = useState<HalachicSettings>(settings);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCustomChange = (custom: HalachicCustom) => {
    if (custom === 'custom') {
      setFormData(prev => ({ ...prev, custom: 'custom' }));
    } else {
      setFormData({
        ...DEFAULT_SETTINGS[custom],
        locationName: formData.locationName
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto cursor-default"
      >
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">הגדרות הלכתיות ומיקום</h3>
              <p className="text-xs text-stone-500">התאמת חישוב זמני הפרישה והשקיעה למנהגכם</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Halachic Custom Radio Cards */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              מנהג הלכתי עיקרי
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ashkenazi', title: 'אשכנז', desc: 'רמ״א / משנ״ב' },
                { id: 'sephardi', title: 'ספרד', desc: 'מרן שו״ע' },
                { id: 'chabad', title: 'חב״ד', desc: 'שו״ע הרב' },
              ].map(c => {
                const isSelected = formData.custom === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCustomChange(c.id as HalachicCustom)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected 
                        ? 'border-rose-400 bg-rose-50/60 ring-2 ring-rose-300 text-rose-900' 
                        : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <span className="font-bold text-sm block">{c.title}</span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">{c.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Selector for Zmanim */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              עיר לחישוב שקיעה וזריחה
            </label>
            <select
              value={formData.locationName}
              onChange={(e) => setFormData(prev => ({ ...prev, locationName: e.target.value }))}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {CITIES.map(city => (
                <option key={city} value={city}>
                  {CITY_LABELS[city] || city}
                </option>
              ))}
            </select>
          </div>

          {/* Fine Tuning Toggles */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-stone-400" />
              פרמטרים מורחבים
            </span>

            {/* Benonit Day 30 vs 31 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
              <div>
                <span className="font-semibold text-stone-800 block">עונה בינונית</span>
                <span className="text-stone-500 text-[11px]">יום ה-30 (שו״ע) או יום ה-31 (חב״ד)</span>
              </div>
              <div className="flex bg-stone-200 p-0.5 rounded-lg font-bold">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, onaBenonitDay: 30, custom: 'custom' }))}
                  className={`px-2.5 py-1 rounded-md transition-colors ${formData.onaBenonitDay === 30 ? 'bg-white shadow-xs text-rose-600' : 'text-stone-600'}`}
                >
                  יום ל׳
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, onaBenonitDay: 31, custom: 'custom' }))}
                  className={`px-2.5 py-1 rounded-md transition-colors ${formData.onaBenonitDay === 31 ? 'bg-white shadow-xs text-rose-600' : 'text-stone-600'}`}
                >
                  יום ל״א
                </button>
              </div>
            </div>

            {/* Or Zarua Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
              <div>
                <span className="font-semibold text-stone-800 block">עונת אור זרוע</span>
                <span className="text-stone-500 text-[11px]">פרישה גם בעונה הסמוכה שלפניה</span>
              </div>
              <input
                type="checkbox"
                checked={formData.orZarua}
                onChange={(e) => setFormData(prev => ({ ...prev, orZarua: e.target.checked, custom: 'custom' }))}
                className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400"
              />
            </div>

            {/* Min days to Hefsek */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
              <div>
                <span className="font-semibold text-stone-800 block">מינימום ימים להפסק טהרה</span>
                <span className="text-stone-500 text-[11px]">4 ימים (ספרדים) או 5 ימים (אשכנזים)</span>
              </div>
              <div className="flex bg-stone-200 p-0.5 rounded-lg font-bold">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, minDaysToHefsek: 4, custom: 'custom' }))}
                  className={`px-2.5 py-1 rounded-md transition-colors ${formData.minDaysToHefsek === 4 ? 'bg-white shadow-xs text-rose-600' : 'text-stone-600'}`}
                >
                  4 ימים
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, minDaysToHefsek: 5, custom: 'custom' }))}
                  className={`px-2.5 py-1 rounded-md transition-colors ${formData.minDaysToHefsek === 5 ? 'bg-white shadow-xs text-rose-600' : 'text-stone-600'}`}
                >
                  5 ימים
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-200"
            >
              שמור הגדרות
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
