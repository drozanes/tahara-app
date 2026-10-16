import React, { useState, useEffect, useMemo } from 'react';
import type { 
  FlowEntry, 
  HalachicSettings, 
  TaharaProcess, 
  CoupleProfile 
} from '../types/halacha';
import { storageService } from '../services/storageService';
import { determineOnaAndHebrewDate, toDateString } from '../engine/zmanim';
import { calculateOnotPrisha } from '../engine/onotCalculator';
import { initializeTaharaProcess, completeHefsekTahara, updateTaharaStatus } from '../engine/taharaTracker';
import { AppContext } from './appContextDefinition';
export { useApp } from './useApp';
export type { AppContextType } from './appContextDefinition';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<CoupleProfile>(() => storageService.getCoupleProfile());
  const [settings, setSettings] = useState<HalachicSettings>(() => storageService.getSettings(profile.coupleCode));
  const [flows, setFlows] = useState<FlowEntry[]>([]);
  const [taharaProcess, setTaharaProcess] = useState<TaharaProcess | null>(null);

  // Load flows on mount or coupleCode change
  useEffect(() => {
    let isCurrent = true;
    storageService.getFlows(profile.coupleCode).then(loadedFlows => {
      if (isCurrent) {
        setFlows(loadedFlows);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [profile.coupleCode]);

  // Real-time synchronization via Firebase
  useEffect(() => {
    if (!profile.coupleCode) return;

    const unsubFlows = storageService.subscribeFlows(profile.coupleCode, (updatedFlows) => {
      setFlows(updatedFlows);
    });

    const unsubSettings = storageService.subscribeSettings(profile.coupleCode, (updatedSettings) => {
      setSettings(updatedSettings);
    });

    return () => {
      if (unsubFlows) unsubFlows();
      if (unsubSettings) unsubSettings();
    };
  }, [profile.coupleCode]);

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

  // Real-time listener for active flow's Tahara process
  useEffect(() => {
    if (!profile.coupleCode || !activeFlow) return;

    const unsubProc = storageService.subscribeTaharaProcess(profile.coupleCode, activeFlow.id, (proc) => {
      if (proc) {
        setTaharaProcess(proc);
      }
    });

    return () => {
      if (unsubProc) unsubProc();
    };
  }, [profile.coupleCode, activeFlow]);

  // Load or initialize Tahara process for active flow
  useEffect(() => {
    if (activeFlow) {
      let proc = storageService.getTaharaProcess(activeFlow.id, profile.coupleCode);
      if (!proc) {
        proc = initializeTaharaProcess(activeFlow, settings);
        storageService.saveTaharaProcess(proc, profile.coupleCode);
      } else {
        const newStatus = updateTaharaStatus(proc);
        if (proc.status !== newStatus) {
          proc = { ...proc, status: newStatus };
          storageService.saveTaharaProcess(proc, profile.coupleCode);
        }
      }
      setTaharaProcess(proc);
    } else {
      setTaharaProcess(null);
    }
  }, [activeFlow, settings, profile.coupleCode]);

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

    await storageService.saveFlow(newFlow, profile.coupleCode);
    const updated = await storageService.getFlows(profile.coupleCode);
    setFlows(updated);
  };

  const deleteFlow = async (flowId: string) => {
    await storageService.deleteFlow(flowId, profile.coupleCode);
    const updated = await storageService.getFlows(profile.coupleCode);
    setFlows(updated);
  };

  const updateSettings = (newSettings: HalachicSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings, profile.coupleCode);
    const updatedProfile = { ...profile, settings: newSettings };
    setProfile(updatedProfile);
    storageService.saveCoupleProfile(updatedProfile);

    // If active flow exists and hefsek is not done, recalculate earliest hefsek date with new minDays
    if (activeFlow && taharaProcess && !taharaProcess.hefsekDone) {
      const refreshedProc = initializeTaharaProcess(activeFlow, newSettings);
      setTaharaProcess(refreshedProc);
      storageService.saveTaharaProcess(refreshedProc, profile.coupleCode);
    }
  };

  const recordHefsek = (hefsekDate: string, mochDachuk: boolean) => {
    if (!taharaProcess) return;
    const updated = completeHefsekTahara(taharaProcess, hefsekDate, mochDachuk, settings);
    setTaharaProcess(updated);
    storageService.saveTaharaProcess(updated, profile.coupleCode);
  };

  const cancelHefsek = () => {
    if (!activeFlow) return;
    const reset = initializeTaharaProcess(activeFlow, settings);
    setTaharaProcess(reset);
    storageService.saveTaharaProcess(reset, profile.coupleCode);
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
    storageService.saveTaharaProcess(updated, profile.coupleCode);
  };

  const joinCoupleCode = async (code: string): Promise<boolean> => {
    const clean = code.trim().toUpperCase();
    if (clean.length >= 4) {
      const updated = { ...profile, coupleCode: clean };
      setProfile(updated);
      storageService.saveCoupleProfile(updated);

      // Fetch existing data for this couple from Firestore/LocalStorage
      const coupleFlows = await storageService.getFlows(clean);
      setFlows(coupleFlows);
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
      addFlow,
      deleteFlow,
      updateSettings,
      recordHefsek,
      cancelHefsek,
      toggleBedika,
      joinCoupleCode
    }}>
      {children}
    </AppContext.Provider>
  );
};
