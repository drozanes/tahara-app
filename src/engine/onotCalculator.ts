import { HDate } from '@hebcal/core';
import type { 
  FlowEntry, 
  HalachicSettings, 
  PrishaOna 
} from '../types/halacha';
import { 
  addDays, 
  toDateString, 
  getZmanimForDate, 
  formatTime 
} from './zmanim';

/**
 * Creates an Or Zarua (preceding ona) companion for a primary prisha ona.
 */
function createOrZaruaOna(
  parentOna: PrishaOna, 
  settings: HalachicSettings
): PrishaOna | null {
  if (!settings.orZarua) return null;

  const parentDate = new Date(parentOna.gregorianDate);

  if (parentOna.ona === 'day') {
    // Parent is day -> Preceding ona is the night of that same civil day (which is the night before sunrise)
    // Note: in halacha, the night belongs to this Hebrew day!
    const zmanim = getZmanimForDate(parentDate, settings.locationName);
    const parentHDate = new HDate(parentDate);

    return {
      id: `${parentOna.id}_or_zarua`,
      cycleId: parentOna.cycleId,
      type: 'or_zarua',
      title: `אור זרוע: ${parentOna.title}`,
      gregorianDate: parentOna.gregorianDate,
      hebrewDateStr: `ליל ${parentHDate.renderGematriya()}`,
      ona: 'night',
      startTime: formatTime(zmanim.sunset), // Technically starts at sunset previous eve
      endTime: formatTime(zmanim.sunrise),
      isOrZarua: true,
      description: `עונת אור זרוע (לילה שלפני) עבור ${parentOna.title}`
    };
  } else {
    // Parent is night -> Preceding ona is the day of the previous civil date
    const prevDate = addDays(parentDate, -1);
    const zmanim = getZmanimForDate(prevDate, settings.locationName);
    const prevHDate = new HDate(prevDate);

    return {
      id: `${parentOna.id}_or_zarua`,
      cycleId: parentOna.cycleId,
      type: 'or_zarua',
      title: `אור זרוע: ${parentOna.title}`,
      gregorianDate: toDateString(prevDate),
      hebrewDateStr: `יום ${prevHDate.renderGematriya()}`,
      ona: 'day',
      startTime: formatTime(zmanim.sunrise),
      endTime: formatTime(zmanim.sunset),
      isOrZarua: true,
      description: `עונת אור זרוע (יום שלפני) עבור ${parentOna.title}`
    };
  }
}

/**
 * Calculates all Halachic Onot Prisha for a flow entry.
 */
export function calculateOnotPrisha(
  currentFlow: FlowEntry,
  previousFlow: FlowEntry | null,
  settings: HalachicSettings
): PrishaOna[] {
  const onot: PrishaOna[] = [];
  const flowDate = new Date(currentFlow.gregorianDate);
  const location = settings.locationName;

  // -------------------------------------------------------------
  // 1. עונה בינונית (Ona Benonit)
  // Day 30 (Shulchan Aruch) = flowDate + 29 days
  // Day 31 (Chabad / Shulchan Aruch HaRav) = flowDate + 30 days
  // -------------------------------------------------------------
  const benonitDaysToAdd = settings.onaBenonitDay === 31 ? 30 : 29;
  const benonitDate = addDays(flowDate, benonitDaysToAdd);
  const benonitZmanim = getZmanimForDate(benonitDate, location);
  const benonitHDate = new HDate(benonitDate);

  const benonitOna: PrishaOna = {
    id: `benonit_${currentFlow.id}`,
    cycleId: currentFlow.id,
    type: 'benonit',
    title: `עונה בינונית (יום ${settings.onaBenonitDay === 31 ? "ל״א" : "ל׳"})`,
    gregorianDate: toDateString(benonitDate),
    hebrewDateStr: `${currentFlow.ona === 'night' ? 'ליל' : 'יום'} ${benonitHDate.renderGematriya()}`,
    ona: currentFlow.ona,
    startTime: currentFlow.ona === 'day' ? formatTime(benonitZmanim.sunrise) : formatTime(benonitZmanim.sunset),
    endTime: currentFlow.ona === 'day' ? formatTime(benonitZmanim.sunset) : formatTime(benonitZmanim.sunrise),
    isOrZarua: false,
    description: `עונה בינונית - יום ${settings.onaBenonitDay} מהראייה, עונת ${currentFlow.ona === 'day' ? 'יום' : 'לילה'}.`
  };
  onot.push(benonitOna);

  const benonitOZ = createOrZaruaOna(benonitOna, settings);
  if (benonitOZ) onot.push(benonitOZ);

  // -------------------------------------------------------------
  // 2. יום החודש (Yom Hachodesh)
  // Same Hebrew day in the next Hebrew month, same ona (day/night)
  // -------------------------------------------------------------
  try {
    const currentHDate = new HDate(flowDate);
    // Find next Hebrew month
    const targetMonth = currentHDate.getMonth() === 12 && !currentHDate.isLeapYear() ? 1 : 
                        currentHDate.getMonth() === 13 ? 1 : currentHDate.getMonth() + 1;
    const targetYear = (currentHDate.getMonth() === 12 && !currentHDate.isLeapYear()) || currentHDate.getMonth() === 13 
      ? currentHDate.getFullYear() + 1 
      : currentHDate.getFullYear();

    // Check if target month has this day (e.g. 30th day in 29-day month)
    const targetHDate = new HDate(currentFlow.hebrewDay, targetMonth, targetYear);
    const targetGregorian = targetHDate.greg();
    const targetZmanim = getZmanimForDate(targetGregorian, location);

    const yomHachodeshOna: PrishaOna = {
      id: `yom_hachodesh_${currentFlow.id}`,
      cycleId: currentFlow.id,
      type: 'yom_hachodesh',
      title: `יום החודש (${targetHDate.renderGematriya()})`,
      gregorianDate: toDateString(targetGregorian),
      hebrewDateStr: `${currentFlow.ona === 'night' ? 'ליל' : 'יום'} ${targetHDate.renderGematriya()}`,
      ona: currentFlow.ona,
      startTime: currentFlow.ona === 'day' ? formatTime(targetZmanim.sunrise) : formatTime(targetZmanim.sunset),
      endTime: currentFlow.ona === 'day' ? formatTime(targetZmanim.sunset) : formatTime(targetZmanim.sunrise),
      isOrZarua: false,
      description: `יום החודש העברי המקביל בחודש הבא, עונת ${currentFlow.ona === 'day' ? 'יום' : 'לילה'}.`
    };
    onot.push(yomHachodeshOna);

    const yomHachodeshOZ = createOrZaruaOna(yomHachodeshOna, settings);
    if (yomHachodeshOZ) onot.push(yomHachodeshOZ);
  } catch (err) {
    console.warn('Error calculating Yom Hachodesh:', err);
  }

  // -------------------------------------------------------------
  // 3. הפלגה (Haflagah - Interval)
  // Distance in days between previous flow and current flow
  // Projected forward from current flow
  // -------------------------------------------------------------
  if (previousFlow) {
    const prevDate = new Date(previousFlow.gregorianDate);
    const diffTime = flowDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Halachic interval is counted inclusively (both end days):
    // e.g. 1st of month to 28th of month = 28 days interval
    const haflagahInterval = diffDays + 1;

    if (haflagahInterval > 1) {
      // Next haflagah is currentFlow + (haflagahInterval - 1) days
      const nextHaflagahDate = addDays(flowDate, haflagahInterval - 1);
      const haflagahZmanim = getZmanimForDate(nextHaflagahDate, location);
      const haflagahHDate = new HDate(nextHaflagahDate);

      const haflagahOna: PrishaOna = {
        id: `haflagah_${currentFlow.id}`,
        cycleId: currentFlow.id,
        type: 'haflagah',
        title: `עונת הפלגה (${haflagahInterval} ימים)`,
        gregorianDate: toDateString(nextHaflagahDate),
        hebrewDateStr: `${currentFlow.ona === 'night' ? 'ליל' : 'יום'} ${haflagahHDate.renderGematriya()}`,
        ona: currentFlow.ona,
        startTime: currentFlow.ona === 'day' ? formatTime(haflagahZmanim.sunrise) : formatTime(haflagahZmanim.sunset),
        endTime: currentFlow.ona === 'day' ? formatTime(haflagahZmanim.sunset) : formatTime(haflagahZmanim.sunrise),
        isOrZarua: false,
        description: `עונת הפלגה - הפרש של ${haflagahInterval} ימים מהראייה הקודמת.`
      };
      onot.push(haflagahOna);

      const haflagahOZ = createOrZaruaOna(haflagahOna, settings);
      if (haflagahOZ) onot.push(haflagahOZ);
    }
  }

  return onot;
}
