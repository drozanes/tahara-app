import { HDate, Zmanim, Location, HebrewCalendar, flags } from '@hebcal/core';
import type { OnaType } from '../types/halacha';

export interface DayZmanim {
  sunrise: Date;
  sunset: Date;
  tzeit: Date;
  alotHaShachar: Date;
}

export function getLocation(cityName: string = 'Jerusalem'): Location {
  try {
    const loc = Location.lookup(cityName) || Location.lookup('Jerusalem');
    if (loc) return loc;
    return new Location(31.7683, 35.2137, false, 'Asia/Jerusalem', 'Jerusalem', 'IL');
  } catch {
    const fallback = Location.lookup('Jerusalem');
    if (fallback) return fallback;
    return new Location(31.7683, 35.2137, false, 'Asia/Jerusalem', 'Jerusalem', 'IL');
  }
}

/**
 * Returns precise Halachic zmanim for a given civil date and location.
 */
export function getZmanimForDate(date: Date, locationName: string = 'Jerusalem'): DayZmanim {
  const loc = getLocation(locationName);
  const zman = new Zmanim(loc, date, false);

  const sunrise = zman.sunrise() || new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 0);
  const sunset = zman.sunset() || new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 0);
  const tzeit = zman.tzeit() || new Date(sunset.getTime() + 20 * 60 * 1000);
  const alotHaShachar = zman.alotHaShachar() || new Date(sunrise.getTime() - 72 * 60 * 1000);

  return { sunrise, sunset, tzeit, alotHaShachar };
}

/**
 * Determines whether a given timestamp falls into עונת יום or עונת לילה,
 * and whether the Hebrew calendar day has already transitioned (after sunset).
 */
export function determineOnaAndHebrewDate(
  dateTime: Date,
  locationName: string = 'Jerusalem'
): {
  ona: OnaType;
  isAfterSunset: boolean;
  hDate: HDate;
  hebrewDateStr: string;
  hebrewDay: number;
  hebrewMonthName: string;
  hebrewYear: number;
  zmanim: DayZmanim;
} {
  const zmanim = getZmanimForDate(dateTime, locationName);
  const timeMs = dateTime.getTime();
  const sunsetMs = zmanim.sunset.getTime();
  const sunriseMs = zmanim.sunrise.getTime();

  let ona: OnaType;
  let isAfterSunset = false;

  // Between sunrise and sunset = DAY (עונת יום)
  if (timeMs >= sunriseMs && timeMs < sunsetMs) {
    ona = 'day';
    isAfterSunset = false;
  } else {
    // Before sunrise or after sunset = NIGHT (עונת לילה)
    ona = 'night';
    if (timeMs >= sunsetMs) {
      isAfterSunset = true;
    }
  }

  // If time is after sunset, the Hebrew day is tomorrow's Gregorian day
  let hDate = new HDate(dateTime);
  if (isAfterSunset) {
    // Advance to next Hebrew day
    hDate = hDate.next();
  }

  const hebrewDateStr = hDate.renderGematriya(true);
  const hebrewDay = hDate.getDate();
  const hebrewMonthName = hDate.getMonthName();
  const hebrewYear = hDate.getFullYear();

  return {
    ona,
    isAfterSunset,
    hDate,
    hebrewDateStr,
    hebrewDay,
    hebrewMonthName,
    hebrewYear,
    zmanim
  };
}

/**
 * Parse YYYY-MM-DD string as a local Date at noon (12:00:00) to prevent
 * any timezone shifts in UTC-negative zones or during DST transitions.
 */
export function parseLocalDate(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  return new Date(year, month, day, 12, 0, 0);
}

/**
 * Format Date to YYYY-MM-DD local string
 */
export function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add days to a Date safely
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format time HH:MM
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

export interface CalendarEventItem {
  dateStr: string;
  title: string;
  isParasha: boolean;
  isHoliday: boolean;
  isRoshChodesh: boolean;
}

/**
 * Returns Jewish holidays, Rosh Chodesh, and Parashat Hashavua for a given year & month.
 */
export function getMonthEvents(year: number, month: number): Map<string, CalendarEventItem[]> {
  const yearsToFetch = [year];
  if (month === 0) yearsToFetch.push(year - 1);
  if (month === 11) yearsToFetch.push(year + 1);

  const eventMap = new Map<string, CalendarEventItem[]>();

  for (const y of yearsToFetch) {
    const events = HebrewCalendar.calendar({
      year: y,
      isHebrewYear: false,
      il: true,
      sedrot: true
    });

    for (const ev of events) {
      const d = ev.getDate().greg();
      // Only process events around this month (previous, current, next month)
      const diffMonths = (d.getFullYear() - year) * 12 + (d.getMonth() - month);
      if (Math.abs(diffMonths) > 1) {
        continue;
      }

      const dateStr = toDateString(d);
      const mask = ev.getFlags();
      const isParasha = Boolean(mask & flags.PARSHA_HASHAVUA);
      const isRoshChodesh = Boolean(mask & flags.ROSH_CHODESH);
      const titleNoNikud = ev.render('he-x-NoNikud');
      const isHoliday = Boolean(
        mask & (flags.CHAG | flags.MINOR_FAST | flags.MAJOR_FAST | flags.SPECIAL_SHABBAT | flags.CHOL_HAMOED | flags.ROSH_CHODESH) ||
        titleNoNikud.includes('חנוכה') ||
        titleNoNikud.includes('פורים')
      );

      if (isParasha || isHoliday || isRoshChodesh) {
        const item: CalendarEventItem = {
          dateStr,
          title: titleNoNikud,
          isParasha,
          isHoliday,
          isRoshChodesh
        };

        const existing = eventMap.get(dateStr) || [];
        // Avoid duplicate entries if years overlap
        if (!existing.some(e => e.title === item.title)) {
          existing.push(item);
          eventMap.set(dateStr, existing);
        }
      }
    }
  }

  return eventMap;
}

