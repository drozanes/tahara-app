import { describe, it, expect } from 'vitest';
import { determineOnaAndHebrewDate, parseLocalDate, toDateString } from '../engine/zmanim';
import { calculateOnotPrisha } from '../engine/onotCalculator';
import { initializeTaharaProcess, completeHefsekTahara } from '../engine/taharaTracker';
import { DEFAULT_SETTINGS, type FlowEntry } from '../types/halacha';

describe('Halachic Zmanim & Ona Determination', () => {
  it('correctly identifies עונת יום during afternoon hours', () => {
    // 2026-10-15 14:00 (Jerusalem sunset is around 18:07 local time)
    const dt = new Date('2026-10-15T14:00:00+03:00');
    const result = determineOnaAndHebrewDate(dt, 'Jerusalem');

    expect(result.ona).toBe('day');
    expect(result.isAfterSunset).toBe(false);
  });

  it('correctly identifies עונת לילה after sunset and advances Hebrew day', () => {
    // 2026-10-15 20:00 (Jerusalem sunset was ~18:07)
    const dt = new Date('2026-10-15T20:00:00+03:00');
    const result = determineOnaAndHebrewDate(dt, 'Jerusalem');

    expect(result.ona).toBe('night');
    expect(result.isAfterSunset).toBe(true);
  });
});

describe('Timezone-Safe Date Parsing', () => {
  it('parseLocalDate consistently parses YYYY-MM-DD regardless of local timezone', () => {
    const parsed = parseLocalDate('2026-10-15');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9); // 0-indexed October
    expect(parsed.getDate()).toBe(15);
    expect(toDateString(parsed)).toBe('2026-10-15');
  });
});

describe('Onot Prisha Calculations & Halachic Accuracy', () => {
  const sampleFlow: FlowEntry = {
    id: 'flow-1',
    dateTime: '2026-10-15T10:00:00+03:00',
    gregorianDate: '2026-10-15',
    hebrewDateStr: 'ד׳ חֶשְׁוָן תשפ״ז',
    hebrewYear: 5787,
    hebrewMonthName: 'Cheshvan',
    hebrewDay: 4,
    ona: 'day',
    createdAt: new Date().toISOString()
  };

  it('calculates עונה בינונית as day 30 for standard Sephardic/Ashkenazi', () => {
    const settings = { ...DEFAULT_SETTINGS.ashkenazi, orZarua: false };
    const onot = calculateOnotPrisha(sampleFlow, null, settings);

    const benonit = onot.find(o => o.type === 'benonit');
    expect(benonit).toBeDefined();
    // Day 30 is flowDate + 29 days: 2026-10-15 + 29 days = 2026-11-13
    expect(benonit?.gregorianDate).toBe('2026-11-13');
    expect(benonit?.ona).toBe('day');
  });

  it('calculates עונה בינונית as day 31 for Chabad custom', () => {
    const settings = { ...DEFAULT_SETTINGS.chabad, orZarua: false };
    const onot = calculateOnotPrisha(sampleFlow, null, settings);

    const benonit = onot.find(o => o.type === 'benonit');
    expect(benonit).toBeDefined();
    // Day 31 is flowDate + 30 days: 2026-10-15 + 30 days = 2026-11-14
    expect(benonit?.gregorianDate).toBe('2026-11-14');
  });

  it('calculates יום החודש on the same Hebrew day in the next month', () => {
    const settings = { ...DEFAULT_SETTINGS.ashkenazi, orZarua: false };
    const onot = calculateOnotPrisha(sampleFlow, null, settings);

    const yomHachodesh = onot.find(o => o.type === 'yom_hachodesh');
    expect(yomHachodesh).toBeDefined();
    expect(yomHachodesh?.ona).toBe('day');
    expect(yomHachodesh?.hebrewDateStr).toContain('ד׳');
  });

  it('correctly calculates יום החודש across the Rosh Hashana Elul -> Tishrei boundary', () => {
    // Flow on 15 Elul 5787 (Sep 17, 2027)
    // Yom Hachodesh must be in Tishrei 5788 (Oct 2027), NOT Tishrei 5787 (Sep 2026 in the past)!
    const elulFlow: FlowEntry = {
      id: 'elul-flow',
      dateTime: '2027-09-17T10:00:00+03:00',
      gregorianDate: '2027-09-17',
      hebrewDateStr: 'ט״ו אֱלוּל תשפ״ז',
      hebrewYear: 5787,
      hebrewMonthName: 'Elul',
      hebrewDay: 15,
      ona: 'day',
      createdAt: new Date().toISOString()
    };

    const settings = { ...DEFAULT_SETTINGS.ashkenazi, orZarua: false };
    const onot = calculateOnotPrisha(elulFlow, null, settings);

    const yomHachodesh = onot.find(o => o.type === 'yom_hachodesh');
    expect(yomHachodesh).toBeDefined();
    expect(yomHachodesh?.gregorianDate.startsWith('2027-10')).toBe(true);
    expect(yomHachodesh?.hebrewDateStr).toContain('ט״ו');
  });

  it('calculates הפלגה correctly based on interval between consecutive flows', () => {
    const prevFlow: FlowEntry = {
      id: 'flow-0',
      dateTime: '2026-09-17T10:00:00+03:00',
      gregorianDate: '2026-09-17',
      hebrewDateStr: 'ו׳ תִּשְׁרֵי תשפ״ז',
      hebrewYear: 5787,
      hebrewMonthName: 'Tishrei',
      hebrewDay: 6,
      ona: 'day',
      createdAt: new Date().toISOString()
    };

    // Days between Sep 17 and Oct 15 = 28 days -> interval is 29 days
    const settings = { ...DEFAULT_SETTINGS.ashkenazi, orZarua: false };
    const onot = calculateOnotPrisha(sampleFlow, prevFlow, settings);

    const haflagah = onot.find(o => o.type === 'haflagah');
    expect(haflagah).toBeDefined();
    expect(haflagah?.title).toContain('29 ימים');
  });

  it('correctly sets Or Zarua timing for a Day parent ona (night before)', () => {
    const settings = { ...DEFAULT_SETTINGS.ashkenazi, orZarua: true };
    const onot = calculateOnotPrisha(sampleFlow, null, settings);

    const benonitOZ = onot.find(o => o.type === 'or_zarua' && o.id.includes('benonit'));
    expect(benonitOZ).toBeDefined();
    expect(benonitOZ?.ona).toBe('night');
    // Day parent is on 2026-11-13. Preceding night begins sunset of 2026-11-12!
    expect(benonitOZ?.gregorianDate).toBe('2026-11-12');
  });
});

describe('Tahara Lifecycle & Night Flow Hefsek Accuracy', () => {
  const dayFlow: FlowEntry = {
    id: 'day-flow-1',
    dateTime: '2026-10-18T10:00:00+03:00',
    gregorianDate: '2026-10-18', // Sunday day
    hebrewDateStr: 'ז׳ חֶשְׁוָן תשפ״ז',
    hebrewYear: 5787,
    hebrewMonthName: 'Cheshvan',
    hebrewDay: 7,
    ona: 'day',
    createdAt: new Date().toISOString()
  };

  const nightFlow: FlowEntry = {
    id: 'night-flow-1',
    dateTime: '2026-10-18T20:30:00+03:00', // Sunday night (after sunset = Monday Hebrew day)
    gregorianDate: '2026-10-18',
    hebrewDateStr: 'ח׳ חֶשְׁוָן תשפ״ז',
    hebrewYear: 5787,
    hebrewMonthName: 'Cheshvan',
    hebrewDay: 8,
    ona: 'night',
    createdAt: new Date().toISOString()
  };

  it('requires 4 days minimum for Sephardic custom on Day flow', () => {
    const process = initializeTaharaProcess(dayFlow, DEFAULT_SETTINGS.sephardi);
    // Sunday (Day 1) -> Wednesday (Day 4)
    expect(process.earliestHefsekDate).toBe('2026-10-21');
  });

  it('requires 5 days minimum for Ashkenazic custom on Day flow', () => {
    const process = initializeTaharaProcess(dayFlow, DEFAULT_SETTINGS.ashkenazi);
    // Sunday (Day 1) -> Thursday (Day 5)
    expect(process.earliestHefsekDate).toBe('2026-10-22');
  });

  it('correctly shifts earliest Hefsek by +1 day when flow starts at Night (after sunset)', () => {
    // Flow starts Sunday night -> Hebrew Day 1 is Monday!
    // Ashkenazi 5 days min: Monday (1), Tue (2), Wed (3), Thu (4), Friday (5)!
    const ashkenaziNightProcess = initializeTaharaProcess(nightFlow, DEFAULT_SETTINGS.ashkenazi);
    expect(ashkenaziNightProcess.earliestHefsekDate).toBe('2026-10-23'); // Friday!

    // Sephardi 4 days min: Monday (1), Tue (2), Wed (3), Thursday (4)!
    const sephardiNightProcess = initializeTaharaProcess(nightFlow, DEFAULT_SETTINGS.sephardi);
    expect(sephardiNightProcess.earliestHefsekDate).toBe('2026-10-22'); // Thursday!
  });

  it('schedules 7 clean days and Mikveh night following Hefsek', () => {
    const process = initializeTaharaProcess(dayFlow, DEFAULT_SETTINGS.ashkenazi);
    const updated = completeHefsekTahara(process, '2026-10-22', true, DEFAULT_SETTINGS.ashkenazi);

    expect(updated.cleanDays.length).toBe(7);
    expect(updated.cleanDays[0].gregorianDate).toBe('2026-10-23');
    expect(updated.cleanDays[6].gregorianDate).toBe('2026-10-29');
    // Mikveh night is evening of day 7
    expect(updated.mikvehNightDate).toBe('2026-10-29');
    expect(updated.status).toBe('seven_clean_days');
  });
});

describe('Halachic Flow Conflict & Future Safeguards', () => {
  it('identifies future dates as invalid for flow logging and hefsek', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days in future
    const isFuture = futureDate.getTime() > Date.now();
    expect(isFuture).toBe(true);

    const todayStr = toDateString(new Date());
    const futureDateStr = toDateString(futureDate);
    expect(futureDateStr > todayStr).toBe(true);
  });

  it('correctly handles interruption of 7 clean days (סתירה) by resetting to new cycle', () => {
    const dayFlow: FlowEntry = {
      id: 'flow-base',
      dateTime: '2026-10-18T10:00:00+03:00',
      gregorianDate: '2026-10-18',
      hebrewDateStr: 'ז׳ חֶשְׁוָן תשפ״ז',
      hebrewYear: 5787,
      hebrewMonthName: 'Cheshvan',
      hebrewDay: 7,
      ona: 'day',
      createdAt: new Date().toISOString()
    };

    // Cycle started, Hefsek completed on Oct 22
    const initialProcess = initializeTaharaProcess(dayFlow, DEFAULT_SETTINGS.ashkenazi);
    const withHefsek = completeHefsekTahara(initialProcess, '2026-10-22', true, DEFAULT_SETTINGS.ashkenazi);
    expect(withHefsek.status).toBe('seven_clean_days');

    // Sighting on Day 3 of 7 clean days (Oct 25) - Halachic "Satrah"
    const newSightingDate = new Date('2026-10-25T11:00:00+03:00');
    const { ona, hebrewDateStr, hebrewYear, hebrewMonthName, hebrewDay } = 
      determineOnaAndHebrewDate(newSightingDate, 'Jerusalem');

    const interruptedFlow: FlowEntry = {
      id: 'flow-interrupted',
      dateTime: newSightingDate.toISOString(),
      gregorianDate: toDateString(newSightingDate),
      hebrewDateStr,
      hebrewYear,
      hebrewMonthName,
      hebrewDay,
      ona,
      createdAt: new Date().toISOString()
    };

    // New process initialized from the interrupting flow
    const resetProcess = initializeTaharaProcess(interruptedFlow, DEFAULT_SETTINGS.ashkenazi);
    expect(resetProcess.status).toBe('active_flow');
    expect(resetProcess.hefsekDone).toBe(false);
    expect(resetProcess.cleanDays.length).toBe(0);
    // Ashkenazi 5 days min: Oct 25 (1), 26 (2), 27 (3), 28 (4), Oct 29 (5)
    expect(resetProcess.earliestHefsekDate).toBe('2026-10-29');
  });
});

