import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PrivacyShield: React.FC = () => {
  const { toggleCamouflage } = useApp();
  const [display, setDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);

  const handleNum = (n: string) => {
    setDisplay(prev => prev === '0' ? n : prev + n);
  };

  const handleOp = (nextOp: string) => {
    setPrevVal(parseFloat(display));
    setOp(nextOp);
    setDisplay('0');
  };

  const handleEquals = () => {
    if (prevVal === null || !op) return;
    const current = parseFloat(display);
    let res = 0;
    if (op === '+') res = prevVal + current;
    if (op === '-') res = prevVal - current;
    if (op === '×') res = prevVal * current;
    if (op === '÷') res = current !== 0 ? prevVal / current : 0;
    setDisplay(String(res));
    setPrevVal(null);
    setOp(null);
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevVal(null);
    setOp(null);
  };

  return (
    <div className="fixed inset-0 bg-stone-900 z-50 flex flex-col items-center justify-center p-4 text-white font-mono select-none" dir="ltr">
      <div className="w-full max-w-xs bg-stone-800 rounded-3xl p-6 shadow-2xl border border-stone-700">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-stone-400 font-sans tracking-wide">מחשבון</span>
          <button 
            onClick={toggleCamouflage}
            title="חזרה לאפליקציה"
            className="p-1.5 rounded-full hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-stone-900 rounded-2xl p-4 text-right text-3xl font-light mb-6 overflow-hidden text-stone-100 min-h-[60px] flex items-center justify-end">
          {display}
        </div>

        <div className="grid grid-cols-4 gap-3">
          {['C', '±', '%', '÷'].map((btn) => (
            <button
              key={btn}
              onClick={() => btn === 'C' ? handleClear() : btn === '÷' ? handleOp('÷') : null}
              className="h-14 rounded-full bg-stone-600 hover:bg-stone-500 text-xl font-medium flex items-center justify-center active:scale-95 transition-transform"
            >
              {btn}
            </button>
          ))}
          {['7', '8', '9', '×'].map((btn) => (
            <button
              key={btn}
              onClick={() => btn === '×' ? handleOp('×') : handleNum(btn)}
              className={`h-14 rounded-full ${btn === '×' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-stone-700 hover:bg-stone-600'} text-xl font-medium flex items-center justify-center active:scale-95 transition-transform`}
            >
              {btn}
            </button>
          ))}
          {['4', '5', '6', '-'].map((btn) => (
            <button
              key={btn}
              onClick={() => btn === '-' ? handleOp('-') : handleNum(btn)}
              className={`h-14 rounded-full ${btn === '-' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-stone-700 hover:bg-stone-600'} text-xl font-medium flex items-center justify-center active:scale-95 transition-transform`}
            >
              {btn}
            </button>
          ))}
          {['1', '2', '3', '+'].map((btn) => (
            <button
              key={btn}
              onClick={() => btn === '+' ? handleOp('+') : handleNum(btn)}
              className={`h-14 rounded-full ${btn === '+' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-stone-700 hover:bg-stone-600'} text-xl font-medium flex items-center justify-center active:scale-95 transition-transform`}
            >
              {btn}
            </button>
          ))}
          <button
            onClick={() => handleNum('0')}
            className="col-span-2 h-14 rounded-full bg-stone-700 hover:bg-stone-600 text-xl font-medium flex items-center justify-start pl-6 active:scale-95 transition-transform"
          >
            0
          </button>
          <button
            onClick={() => handleNum('.')}
            className="h-14 rounded-full bg-stone-700 hover:bg-stone-600 text-xl font-medium flex items-center justify-center active:scale-95 transition-transform"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="h-14 rounded-full bg-amber-600 hover:bg-amber-500 text-xl font-medium flex items-center justify-center active:scale-95 transition-transform"
          >
            =
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={toggleCamouflage}
            className="text-xs text-stone-500 hover:text-stone-300 font-sans transition-colors py-1 px-3 rounded-full hover:bg-stone-700/50"
          >
            לחץ ליציאה ממצב הסוואה
          </button>
        </div>
      </div>
    </div>
  );
};
