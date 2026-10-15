import { describe, it, expect } from 'vitest';
import { determineOnaAndHebrewDate } from '../engine/zmanim';
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

describe('Onot Prisha Calculations', () => {
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

  it('adds עונת אור זרוע when enabled in Ashkenazi/Chabad settings', () => {
    const settings = { ...DEFAULT_SETTINGS.ashkenazi, orZarua: true };
    const onot = calculateOnotPrisha(sampleFlow, null, settings);

    const orZaruaOnot = onot.filter(o => o.isOrZarua);
    expect(orZaruaOnot.length).toBeGreaterThan(0);
    // Since primary ona is day, Or Zarua must be the preceding night
    expect(orZaruaOnot[0].ona).toBe('night');
  });
});

describe('Tahara Lifecycle & Hefsek', () => {
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

  it('requires 4 days minimum for Sephardic custom', () => {
    const process = initializeTaharaProcess(sampleFlow, DEFAULT_SETTINGS.sephardi);
    // 2026-10-15 (Day 1) -> 2026-10-18 (Day 4)
    expect(process.earliestHefsekDate).toBe('2026-10-18');
  });

  it('requires 5 days minimum for Ashkenazic custom', () => {
    const process = initializeTaharaProcess(sampleFlow, DEFAULT_SETTINGS.ashkenazi);
    // 2026-10-15 (Day 1) -> 2026-10-19 (Day 5)
    expect(process.earliestHefsekDate).toBe('2026-10-19');
  });

  it('schedules 7 clean days and Mikveh night following Hefsek', () => {
    const process = initializeTaharaProcess(sampleFlow, DEFAULT_SETTINGS.ashkenazi);
    const updated = completeHefsekTahara(process, '2026-10-19', true, DEFAULT_SETTINGS.ashkenazi);

    expect(updated.cleanDays.length).toBe(7);
    expect(updated.cleanDays[0].gregorianDate).toBe('2026-10-20');
    expect(updated.cleanDays[6].gregorianDate).toBe('2026-10-26');
    // Mikveh night is evening of day 7
    expect(updated.mikvehNightDate).toBe('2026-10-26');
    expect(updated.status).toBe('seven_clean_days');
  });
});
