import { HDate } from '@hebcal/core';
import type { 
  FlowEntry, 
  HalachicSettings, 
  PrishaOna 
} from '../types/halacha';
import { 
  addDays, 
  toDateString, 
  parseLocalDate,
  getZmanimForDate, 
  formatTime,
  determineOnaAndHebrewDate
} from './zmanim';

/**
 * Creates an Or Zarua (preceding ona) companion for a primary prisha ona.
 */
function createOrZaruaOna(
  parentOna: PrishaOna, 
  settings: HalachicSettings
): PrishaOna | null {
  if (!settings.orZarua) return null;

  const parentDate = parseLocalDate(parentOna.gregorianDate);

  if (parentOna.ona === 'day') {
    // Parent is day -> Preceding ona is the night BEFORE this day.
    // That night starts at sunset of prevDate and ends at sunrise of parentDate.
    const prevDate = addDays(parentDate, -1);
    const prevZmanim = getZmanimForDate(prevDate, settings.locationName);
    const parentZmanim = getZmanimForDate(parentDate, settings.locationName);
    const parentHDate = new HDate(parentDate);

    return {
      id: `${parentOna.id}_or_zarua`,
      cycleId: parentOna.cycleId,
      type: 'or_zarua',
      title: `אור זרוע: ${parentOna.title}`,
      gregorianDate: toDateString(prevDate),
      hebrewDateStr: `ליל ${parentHDate.renderGematriya()}`,
      ona: 'night',
      startTime: formatTime(prevZmanim.sunset),
      endTime: formatTime(parentZmanim.sunrise),
      isOrZarua: true,
      description: `עונת אור זרוע (הלילה שלפני) עבור ${parentOna.title}`
    };
  } else {
    // Parent is night -> Starts at sunset of parentDate and ends sunrise of next day.
    // Preceding ona is the daytime of that same civil date (parentDate sunrise to sunset).
    const zmanim = getZmanimForDate(parentDate, settings.locationName);
    const parentHDate = new HDate(parentDate);

    return {
      id: `${parentOna.id}_or_zarua`,
      cycleId: parentOna.cycleId,
      type: 'or_zarua',
      title: `אור זרוע: ${parentOna.title}`,
      gregorianDate: parentOna.gregorianDate,
      hebrewDateStr: `יום ${parentHDate.renderGematriya()}`,
      ona: 'day',
      startTime: formatTime(zmanim.sunrise),
      endTime: formatTime(zmanim.sunset),
      isOrZarua: true,
      description: `עונת אור זרוע (היום שלפני) עבור ${parentOna.title}`
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
  const flowDate = parseLocalDate(currentFlow.gregorianDate);
  const location = settings.locationName;

  // -------------------------------------------------------------
  // 1. עונה בינונית (Ona Benonit)
  // Day 30 (Shulchan Aruch) = flowDate + 29 days
  // Day 31 (Chabad / Shulchan Aruch HaRav) = flowDate + 30 days
  // -------------------------------------------------------------
  const benonitDaysToAdd = settings.onaBenonitDay === 31 ? 30 : 29;
  const benonitDate = addDays(flowDate, benonitDaysToAdd);
  const benonitZmanim = getZmanimForDate(benonitDate, location);
  const nextDayBenonitZmanim = getZmanimForDate(addDays(benonitDate, 1), location);
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
    endTime: currentFlow.ona === 'day' ? formatTime(benonitZmanim.sunset) : formatTime(nextDayBenonitZmanim.sunrise),
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
    const flowDateTime = new Date(currentFlow.dateTime);
    const flowHDateInfo = determineOnaAndHebrewDate(flowDateTime, location);
    const currentHDate = flowHDateInfo.hDate;

    let targetMonth: number;
    let targetYear = currentHDate.getFullYear();
    const m = currentHDate.getMonth();
    const isLeap = currentHDate.isLeapYear();

    if (m === 6) {
      // Elul -> Tishrei (New Hebrew Year starts!)
      targetMonth = 7;
      targetYear += 1;
    } else if (m === 12) {
      // Adar I -> Adar II in leap year, or Adar -> Nisan in regular year
      targetMonth = isLeap ? 13 : 1;
    } else if (m === 13) {
      // Adar II -> Nisan
      targetMonth = 1;
    } else {
      targetMonth = m + 1;
    }

    // Check if target month has this day (e.g. 30th day in 29-day month)
    const targetMonthSample = new HDate(1, targetMonth, targetYear);
    const maxDays = targetMonthSample.daysInMonth();
    const isMonthChaser = maxDays < currentFlow.hebrewDay;
    const targetDay = isMonthChaser ? maxDays : currentFlow.hebrewDay;

    const targetHDate = new HDate(targetDay, targetMonth, targetYear);
    const targetGregorian = targetHDate.greg();
    const targetDateStr = toDateString(targetGregorian);
    const targetLocal = parseLocalDate(targetDateStr);
    const targetZmanim = getZmanimForDate(targetLocal, location);
    const targetNextZmanim = getZmanimForDate(addDays(targetLocal, 1), location);

    const yomHachodeshOna: PrishaOna = {
      id: `yom_hachodesh_${currentFlow.id}`,
      cycleId: currentFlow.id,
      type: 'yom_hachodesh',
      title: isMonthChaser
        ? `יום החודש (חודש חסר - יום ${targetHDate.renderGematriya()})`
        : `יום החודש (${targetHDate.renderGematriya()})`,
      gregorianDate: targetDateStr,
      hebrewDateStr: `${currentFlow.ona === 'night' ? 'ליל' : 'יום'} ${targetHDate.renderGematriya()}`,
      ona: currentFlow.ona,
      startTime: currentFlow.ona === 'day' ? formatTime(targetZmanim.sunrise) : formatTime(targetZmanim.sunset),
      endTime: currentFlow.ona === 'day' ? formatTime(targetZmanim.sunset) : formatTime(targetNextZmanim.sunrise),
      isOrZarua: false,
      description: isMonthChaser
        ? `יום החודש העברי המקביל (חודש זה חסר בן ${maxDays} ימים, יש לנהוג לפי מנהג המקום).`
        : `יום החודש העברי המקביל בחודש הבא, עונת ${currentFlow.ona === 'day' ? 'יום' : 'לילה'}.`
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
    const prevDate = parseLocalDate(previousFlow.gregorianDate);
    const diffTime = flowDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Halachic interval is counted inclusively (both end days):
    // e.g. 1st of month to 28th of month = 28 days interval
    const haflagahInterval = diffDays + 1;

    if (haflagahInterval > 1) {
      // Next haflagah is currentFlow + (haflagahInterval - 1) days
      const nextHaflagahDate = addDays(flowDate, haflagahInterval - 1);
      const haflagahZmanim = getZmanimForDate(nextHaflagahDate, location);
      const haflagahNextZmanim = getZmanimForDate(addDays(nextHaflagahDate, 1), location);
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
        endTime: currentFlow.ona === 'day' ? formatTime(haflagahZmanim.sunset) : formatTime(haflagahNextZmanim.sunrise),
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
