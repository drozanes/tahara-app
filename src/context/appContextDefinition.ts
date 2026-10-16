import { createContext } from 'react';
import type { 
  FlowEntry, 
  HalachicSettings, 
  PrishaOna, 
  TaharaProcess, 
  CoupleProfile 
} from '../types/halacha';

export interface AppContextType {
  flows: FlowEntry[];
  activeFlow: FlowEntry | null;
  onot: PrishaOna[];
  taharaProcess: TaharaProcess | null;
  settings: HalachicSettings;
  profile: CoupleProfile;
  addFlow: (dateTime: Date, notes?: string) => Promise<void>;
  updateFlowDate: (flowId: string, newDateTime: Date, newNotes?: string) => Promise<void>;
  deleteFlow: (flowId: string) => Promise<void>;
  updateSettings: (settings: HalachicSettings) => void;
  recordHefsek: (hefsekDate: string, mochDachuk: boolean) => void;
  cancelHefsek: () => void;
  toggleBedika: (dayNumber: number, type: 'morning' | 'afternoon') => void;
  joinCoupleCode: (code: string) => Promise<boolean>;
}

export const AppContext = createContext<AppContextType | null>(null);
