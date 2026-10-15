import type { 
  FlowEntry, 
  HalachicSettings, 
  TaharaProcess, 
  CoupleProfile 
} from '../types/halacha';
import { DEFAULT_SETTINGS } from '../types/halacha';
import { db, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';

const STORAGE_KEYS = {
  FLOWS: 'tahara_flows_v1',
  SETTINGS: 'tahara_settings_v1',
  PROCESSES: 'tahara_processes_v1',
  COUPLE: 'tahara_couple_v1'
};

// Seed initial sample flow if completely empty
const INITIAL_SAMPLE_FLOWS: FlowEntry[] = [
  {
    id: 'sample-flow-1',
    dateTime: '2026-09-15T15:30:00+03:00',
    gregorianDate: '2026-09-15',
    hebrewDateStr: 'ד׳ תשרי תשפ״ז',
    hebrewYear: 5787,
    hebrewMonthName: 'Tishrei',
    hebrewDay: 4,
    ona: 'day',
    notes: 'מחזור קודם',
    createdAt: '2026-09-15T15:30:00.000Z'
  },
  {
    id: 'sample-flow-2',
    dateTime: '2026-10-13T09:15:00+03:00',
    gregorianDate: '2026-10-13',
    hebrewDateStr: 'ב׳ חשוון תשפ״ז',
    hebrewYear: 5787,
    hebrewMonthName: 'Cheshvan',
    hebrewDay: 2,
    ona: 'day',
    notes: 'ראייה אחרונה',
    createdAt: '2026-10-13T09:15:00.000Z'
  }
];

export const storageService = {
  // --- FLOWS ---
  async getFlows(coupleId?: string): Promise<FlowEntry[]> {
    if (isFirebaseConfigured && db && coupleId) {
      try {
        const colRef = collection(db, `couples/${coupleId}/flows`);
        const snapshot = await getDocs(colRef);
        return snapshot.docs.map(d => d.data() as FlowEntry);
      } catch (err) {
        console.warn('Firebase getFlows failed, using local storage:', err);
      }
    }

    const local = localStorage.getItem(STORAGE_KEYS.FLOWS);
    if (!local) {
      localStorage.setItem(STORAGE_KEYS.FLOWS, JSON.stringify(INITIAL_SAMPLE_FLOWS));
      return INITIAL_SAMPLE_FLOWS;
    }
    try {
      return JSON.parse(local);
    } catch {
      return [];
    }
  },

  async saveFlow(flow: FlowEntry, coupleId?: string): Promise<void> {
    const flows = await this.getFlows();
    const index = flows.findIndex(f => f.id === flow.id);
    if (index >= 0) {
      flows[index] = flow;
    } else {
      flows.unshift(flow);
    }
    // Sort descending by date
    flows.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    localStorage.setItem(STORAGE_KEYS.FLOWS, JSON.stringify(flows));

    if (isFirebaseConfigured && db && coupleId) {
      try {
        const docRef = doc(db, `couples/${coupleId}/flows`, flow.id);
        await setDoc(docRef, flow);
      } catch (err) {
        console.warn('Firebase saveFlow failed:', err);
      }
    }
  },

  async deleteFlow(flowId: string, coupleId?: string): Promise<void> {
    const flows = await this.getFlows();
    const filtered = flows.filter(f => f.id !== flowId);
    localStorage.setItem(STORAGE_KEYS.FLOWS, JSON.stringify(filtered));

    if (isFirebaseConfigured && db && coupleId) {
      try {
        const docRef = doc(db, `couples/${coupleId}/flows`, flowId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('Firebase deleteFlow failed:', err);
      }
    }
  },

  // --- SETTINGS ---
  getSettings(): HalachicSettings {
    const local = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return DEFAULT_SETTINGS.ashkenazi;
  },

  saveSettings(settings: HalachicSettings, coupleId?: string): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

    if (isFirebaseConfigured && db && coupleId) {
      try {
        const docRef = doc(db, `couples/${coupleId}/settings`, 'current');
        setDoc(docRef, settings);
      } catch (err) {
        console.warn('Firebase saveSettings failed:', err);
      }
    }
  },

  // --- TAHARA PROCESS ---
  getTaharaProcess(cycleId: string): TaharaProcess | null {
    const local = localStorage.getItem(`${STORAGE_KEYS.PROCESSES}_${cycleId}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return null;
  },

  saveTaharaProcess(process: TaharaProcess, coupleId?: string): void {
    localStorage.setItem(`${STORAGE_KEYS.PROCESSES}_${process.cycleId}`, JSON.stringify(process));

    if (isFirebaseConfigured && db && coupleId) {
      try {
        const docRef = doc(db, `couples/${coupleId}/processes`, process.cycleId);
        setDoc(docRef, process);
      } catch (err) {
        console.warn('Firebase saveTaharaProcess failed:', err);
      }
    }
  },

  // --- COUPLE PROFILE ---
  getCoupleProfile(): CoupleProfile {
    const local = localStorage.getItem(STORAGE_KEYS.COUPLE);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    const defaultProfile: CoupleProfile = {
      id: 'default-couple',
      coupleCode: 'TZ-' + Math.floor(1000 + Math.random() * 9000),
      wifeName: 'שרה',
      husbandName: 'אברהם',
      currentRole: 'wife',
      settings: DEFAULT_SETTINGS.ashkenazi,
      camouflageMode: false
    };
    localStorage.setItem(STORAGE_KEYS.COUPLE, JSON.stringify(defaultProfile));
    return defaultProfile;
  },

  saveCoupleProfile(profile: CoupleProfile): void {
    localStorage.setItem(STORAGE_KEYS.COUPLE, JSON.stringify(profile));
  }
};
