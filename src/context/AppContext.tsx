import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { 
  FlowEntry, 
  HalachicSettings, 
  PrishaOna, 
  TaharaProcess, 
  CoupleProfile 
} from '../types/halacha';
import { storageService } from '../services/storageService';
import { determineOnaAndHebrewDate, toDateString } from '../engine/zmanim';
import { calculateOnotPrisha } from '../engine/onotCalculator';
import { initializeTaharaProcess, completeHefsekTahara, updateTaharaStatus } from '../engine/taharaTracker';

interface AppContextType {
  flows: FlowEntry[];
  activeFlow: FlowEntry | null;
  onot: PrishaOna[];
  taharaProcess: TaharaProcess | null;
  settings: HalachicSettings;
  profile: CoupleProfile;
  isCamouflage: boolean;
  addFlow: (dateTime: Date, notes?: string) => Promise<void>;
  deleteFlow: (flowId: string) => Promise<void>;
  updateSettings: (settings: HalachicSettings) => void;
  switchRole: (role: 'wife' | 'husband') => void;
  toggleCamouflage: () => void;
  recordHefsek: (hefsekDate: string, mochDachuk: boolean) => void;
  cancelHefsek: () => void;
  toggleBedika: (dayNumber: number, type: 'morning' | 'afternoon') => void;
  joinCoupleCode: (code: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flows, setFlows] = useState<FlowEntry[]>([]);
  const [settings, setSettings] = useState<HalachicSettings>(storageService.getSettings());
  const [profile, setProfile] = useState<CoupleProfile>(storageService.getCoupleProfile());
  const [isCamouflage, setIsCamouflage] = useState<boolean>(false);
  const [taharaProcess, setTaharaProcess] = useState<TaharaProcess | null>(null);

  // Load flows on mount
  useEffect(() => {
    storageService.getFlows().then(loadedFlows => {
      setFlows(loadedFlows);
    });
  }, []);

  // Most recent flow
  const activeFlow = useMemo(() => {
    return flows.length > 0 ? flows[0] : null;
  }, [flows]);

  // Previous flow for Haflagah
  const previousFlow = useMemo(() => {
    return flows.length > 1 ? flows[1] : null;
  }, [flows]);

  // Recalculate Onot whenever activeFlow, previousFlow, or settings change
  const onot = useMemo(() => {
    if (!activeFlow) return [];
    return calculateOnotPrisha(activeFlow, previousFlow, settings);
  }, [activeFlow, previousFlow, settings]);

  // Load or initialize Tahara process for active flow
  useEffect(() => {
    if (activeFlow) {
      let proc = storageService.getTaharaProcess(activeFlow.id);
      if (!proc) {
        proc = initializeTaharaProcess(activeFlow, settings);
        storageService.saveTaharaProcess(proc);
      } else {
        proc.status = updateTaharaStatus(proc);
      }
      setTaharaProcess(proc);
    } else {
      setTaharaProcess(null);
    }
  }, [activeFlow, settings]);

  const addFlow = async (dateTime: Date, notes?: string) => {
    const { ona, hebrewDateStr, hebrewYear, hebrewMonthName, hebrewDay } = 
      determineOnaAndHebrewDate(dateTime, settings.locationName);

    const newFlow: FlowEntry = {
      id: `flow_${Date.now()}`,
      dateTime: dateTime.toISOString(),
      gregorianDate: toDateString(dateTime),
      hebrewDateStr,
      hebrewYear,
      hebrewMonthName,
      hebrewDay,
      ona,
      notes,
      createdAt: new Date().toISOString()
    };

    await storageService.saveFlow(newFlow);
    const updated = await storageService.getFlows();
    setFlows(updated);
  };

  const deleteFlow = async (flowId: string) => {
    await storageService.deleteFlow(flowId);
    const updated = await storageService.getFlows();
    setFlows(updated);
  };

  const updateSettings = (newSettings: HalachicSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    const updatedProfile = { ...profile, settings: newSettings };
    setProfile(updatedProfile);
    storageService.saveCoupleProfile(updatedProfile);
  };

  const switchRole = (role: 'wife' | 'husband') => {
    const updated = { ...profile, currentRole: role };
    setProfile(updated);
    storageService.saveCoupleProfile(updated);
  };

  const toggleCamouflage = () => {
    setIsCamouflage(prev => !prev);
  };

  const recordHefsek = (hefsekDate: string, mochDachuk: boolean) => {
    if (!taharaProcess) return;
    const updated = completeHefsekTahara(taharaProcess, hefsekDate, mochDachuk, settings);
    setTaharaProcess(updated);
    storageService.saveTaharaProcess(updated);
  };

  const cancelHefsek = () => {
    if (!activeFlow) return;
    const reset = initializeTaharaProcess(activeFlow, settings);
    setTaharaProcess(reset);
    storageService.saveTaharaProcess(reset);
  };

  const toggleBedika = (dayNumber: number, type: 'morning' | 'afternoon') => {
    if (!taharaProcess || !taharaProcess.cleanDays) return;
    const todayStr = toDateString(new Date());

    const cleanDays = taharaProcess.cleanDays.map(day => {
      if (day.dayNumber === dayNumber) {
        // Prevent marking future bedikot
        if (day.gregorianDate > todayStr) {
          return day;
        }
        return {
          ...day,
          morningBedikaDone: type === 'morning' ? !day.morningBedikaDone : day.morningBedikaDone,
          afternoonBedikaDone: type === 'afternoon' ? !day.afternoonBedikaDone : day.afternoonBedikaDone,
        };
      }
      return day;
    });

    const updated = { ...taharaProcess, cleanDays };
    setTaharaProcess(updated);
    storageService.saveTaharaProcess(updated);
  };

  const joinCoupleCode = (code: string) => {
    if (code.trim().length >= 4) {
      const updated = { ...profile, coupleCode: code.toUpperCase() };
      setProfile(updated);
      storageService.saveCoupleProfile(updated);
      return true;
    }
    return false;
  };

  return (
    <AppContext.Provider value={{
      flows,
      activeFlow,
      onot,
      taharaProcess,
      settings,
      profile,
      isCamouflage,
      addFlow,
      deleteFlow,
      updateSettings,
      switchRole,
      toggleCamouflage,
      recordHefsek,
      cancelHefsek,
      toggleBedika,
      joinCoupleCode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
