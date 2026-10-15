import React, { useState } from 'react';
import { X, Copy, Check, Users, Share2, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CoupleShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoupleShareModal: React.FC<CoupleShareModalProps> = ({ isOpen, onClose }) => {
  const { profile, joinCoupleCode } = useApp();
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [joinedSuccess, setJoinedSuccess] = useState(false);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(profile.coupleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `שלום! הזמנתי אותך להצטרף לחשבון טהרת המשפחה המשותף שלנו באפליקציה.\nקוד ההצטרפות שלך: *${profile.coupleCode}*`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCoupleCode(inputCode)) {
      setJoinedSuccess(true);
      setTimeout(() => {
        setJoinedSuccess(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 cursor-default"
      >
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">שיתוף וחיבור מרחב זוגי</h3>
              <p className="text-xs text-stone-500">חיבור שני המכשירים לסנכרון זמני פרישה וטהרה</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* My Couple Code Box */}
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-5 border border-rose-100 text-center mb-6">
          <span className="text-xs font-semibold text-rose-800">קוד המרחב הזוגי שלך</span>
          <div className="my-2 py-3 px-4 bg-white rounded-xl border border-rose-200/80 shadow-sm flex items-center justify-center gap-3">
            <span className="font-mono text-2xl font-bold tracking-widest text-rose-600">
              {profile.coupleCode}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="העתק קוד"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCopy}
              className="flex-1 py-2 px-3 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-100/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'הועתק!' : 'העתקת קוד'}
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              שליחה בוואטסאפ
            </button>
          </div>
        </div>

        {/* Connect to Existing Code */}
        <div className="border-t border-stone-100 pt-5">
          <h4 className="text-xs font-bold text-stone-700 mb-2">
            קיבלת קוד מבן/בת הזוג?
          </h4>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              placeholder="הזן קוד (למשל TZ-1234)"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>התחבר</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>

          {joinedSuccess && (
            <p className="text-xs text-emerald-600 font-bold mt-2 text-center">
              ✓ חובקת בהצלחה למרחב הזוגי!
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
