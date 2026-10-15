import { HDate } from '@hebcal/core';
import type { 
  FlowEntry, 
  HalachicSettings, 
  TaharaProcess, 
  SevenCleanDaysStep,
  TaharaStatus 
} from '../types/halacha';
import { 
  addDays, 
  toDateString, 
  getZmanimForDate, 
  formatTime 
} from './zmanim';

/**
 * Initializes a Tahara process for a new menstrual flow.
 */
export function initializeTaharaProcess(
  flow: FlowEntry,
  settings: HalachicSettings
): TaharaProcess {
  const flowDate = new Date(flow.gregorianDate);
  
  // Earliest Hefsek day:
  // Sephardi: 4th day (flow + 3 days)
  // Ashkenazi: 5th day (flow + 4 days)
  const daysToHefsek = settings.minDaysToHefsek === 4 ? 3 : 4;
  const earliestHefsekDate = toDateString(addDays(flowDate, daysToHefsek));

  return {
    cycleId: flow.id,
    earliestHefsekDate,
    hefsekDone: false,
    mochDachukDone: false,
    cleanDays: [],
    status: 'active_flow'
  };
}

/**
 * Calculates the 7 Clean Days and Mikveh Night once Hefsek Tahara is completed.
 */
export function completeHefsekTahara(
  process: TaharaProcess,
  hefsekDateStr: string,
  mochDachuk: boolean,
  settings: HalachicSettings
): TaharaProcess {
  const hefsekDate = new Date(hefsekDateStr);
  const location = settings.locationName;
  const cleanDays: SevenCleanDaysStep[] = [];

  // 7 clean days start the day after Hefsek
  for (let i = 1; i <= 7; i++) {
    const dayDate = addDays(hefsekDate, i);
    const hDate = new HDate(dayDate);
    cleanDays.push({
      dayNumber: i,
      gregorianDate: toDateString(dayDate),
      hebrewDateStr: hDate.renderGematriya(),
      morningBedikaDone: false,
      afternoonBedikaDone: false,
    });
  }

  // Mikveh night is the night following Day 7 (at Tzeit Hakochavim)
  const day7Date = addDays(hefsekDate, 7);
  const day7Zmanim = getZmanimForDate(day7Date, location);
  const mikvehNightDate = toDateString(day7Date); // Evening of day 7
  const mikvehEarliestTime = formatTime(day7Zmanim.tzeit);

  return {
    ...process,
    hefsekDone: true,
    hefsekCompletedAt: new Date().toISOString(),
    mochDachukDone: mochDachuk,
    cleanDays,
    mikvehNightDate,
    mikvehEarliestTime,
    status: 'seven_clean_days'
  };
}

/**
 * Computes current status based on today's date and completed steps.
 */
export function updateTaharaStatus(
  process: TaharaProcess,
  today: Date = new Date()
): TaharaStatus {
  const todayStr = toDateString(today);

  if (!process.hefsekDone) {
    if (todayStr >= process.earliestHefsekDate) {
      return 'ready_for_hefsek';
    }
    return 'active_flow';
  }

  // If 7 clean days are in progress
  if (process.cleanDays && process.cleanDays.length === 7) {
    const lastDayStr = process.cleanDays[6].gregorianDate;

    if (todayStr === lastDayStr) {
      return 'mikveh_night';
    } else if (todayStr > lastDayStr) {
      return 'tahor';
    }
    return 'seven_clean_days';
  }

  return 'active_flow';
}
