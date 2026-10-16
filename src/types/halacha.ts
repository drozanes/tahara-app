export type OnaType = 'day' | 'night';

export type HalachicCustom = 'ashkenazi' | 'sephardi' | 'chabad' | 'custom';

export interface HalachicSettings {
  custom: HalachicCustom;
  onaBenonitDay: 30 | 31; // 30 is standard (Shulchan Aruch), 31 is Chabad (Shulchan Aruch HaRav)
  orZarua: boolean; // Stringency to keep preceding ona (standard Ashkenaz/Chabad)
  minDaysToHefsek: 4 | 5; // 4 Sephardic, 5 Ashkenazic
  requireMochDachuk: boolean;
  locationName: string; // e.g. 'Jerusalem', 'Tel Aviv', 'Bnei Brak', 'Haifa', 'New York'
}

export const DEFAULT_SETTINGS: Record<HalachicCustom, HalachicSettings> = {
  sephardi: {
    custom: 'sephardi',
    onaBenonitDay: 30,
    orZarua: false,
    minDaysToHefsek: 4,
    requireMochDachuk: true,
    locationName: 'Jerusalem',
  },
  ashkenazi: {
    custom: 'ashkenazi',
    onaBenonitDay: 30,
    orZarua: true,
    minDaysToHefsek: 5,
    requireMochDachuk: true,
    locationName: 'Jerusalem',
  },
  chabad: {
    custom: 'chabad',
    onaBenonitDay: 31,
    orZarua: true,
    minDaysToHefsek: 5,
    requireMochDachuk: true,
    locationName: 'Jerusalem',
  },
  custom: {
    custom: 'custom',
    onaBenonitDay: 30,
    orZarua: true,
    minDaysToHefsek: 5,
    requireMochDachuk: true,
    locationName: 'Jerusalem',
  }
};

export interface FlowEntry {
  id: string;
  dateTime: string; // ISO 8601 string
  gregorianDate: string; // YYYY-MM-DD
  hebrewDateStr: string; // e.g. "כ׳ תִּשְׁרֵי תשפ״ז"
  hebrewYear: number;
  hebrewMonthName: string;
  hebrewDay: number;
  ona: OnaType; // 'day' or 'night'
  notes?: string;
  createdAt: string;
}

export type PrishaType = 'benonit' | 'yom_hachodesh' | 'haflagah' | 'or_zarua' | 'veset_kavua';

export interface PrishaOna {
  id: string;
  cycleId: string;
  type: PrishaType;
  title: string;
  gregorianDate: string; // YYYY-MM-DD
  hebrewDateStr: string;
  ona: OnaType;
  startTime: string; // ISO or formatted
  endTime: string;
  isOrZarua: boolean;
  description: string;
}

export interface SevenCleanDaysStep {
  dayNumber: number; // 1 to 7
  gregorianDate: string; // YYYY-MM-DD
  hebrewDateStr: string;
  morningBedikaDone: boolean;
  afternoonBedikaDone: boolean;
  notes?: string;
}

export type TaharaStatus = 
  | 'active_flow'       // ימי המחזור / לפני הפסק
  | 'ready_for_hefsek'  // הגיע הזמן המינימלי להפסק טהרה
  | 'seven_clean_days'  // בשבעה נקיים
  | 'mikveh_night'      // ליל טבילה
  | 'tahor';            // טהורה

export interface TaharaProcess {
  cycleId: string;
  earliestHefsekDate: string; // YYYY-MM-DD
  hefsekDone: boolean;
  hefsekCompletedAt?: string; // ISO
  mochDachukDone: boolean;
  cleanDays: SevenCleanDaysStep[];
  mikvehNightDate?: string; // YYYY-MM-DD
  mikvehEarliestTime?: string; // צאת הכוכבים
  status: TaharaStatus;
}

export interface CoupleProfile {
  id: string;
  coupleCode: string;
  wifeName: string;
  husbandName: string;
  currentRole?: 'wife' | 'husband';
  settings: HalachicSettings;
  camouflageMode?: boolean;
}
