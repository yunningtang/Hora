import { create } from "zustand";
import type { BaziData } from "../types/horosa";

export interface Profile {
  id: string;
  name: string;
  gender: "M" | "F" | "X";
  birthDate: string;
  birthTime: string;
  zone: string;
  lat: string;
  lon: string;
  location: string;
}

export type TabKey = "bazi" | "ziwei" | "astro" | "sixyao" | "qimen" | "predict";

interface AppState {
  profiles: Profile[];
  activeProfile: Profile | null;
  activeTab: TabKey;
  loading: boolean;
  error: string | null;

  // Chart data
  baziData: BaziData | null;
  ziweiData: Record<string, unknown> | null;
  astroData: Record<string, unknown> | null;
  sixyaoData: Record<string, unknown> | null;
  qimenData: Record<string, unknown> | null;
  predictData: Record<string, unknown> | null;

  setActiveProfile: (p: Profile | null) => void;
  addProfile: (p: Profile) => void;
  setActiveTab: (t: TabKey) => void;
  setBaziData: (d: BaziData | null) => void;
  setZiweiData: (d: Record<string, unknown> | null) => void;
  setAstroData: (d: Record<string, unknown> | null) => void;
  setSixyaoData: (d: Record<string, unknown> | null) => void;
  setQimenData: (d: Record<string, unknown> | null) => void;
  setPredictData: (d: Record<string, unknown> | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profiles: [],
  activeProfile: null,
  activeTab: "bazi",
  loading: false,
  error: null,
  baziData: null,
  ziweiData: null,
  astroData: null,
  sixyaoData: null,
  qimenData: null,
  predictData: null,

  setActiveProfile: (p) =>
    set({ activeProfile: p, baziData: null, ziweiData: null, astroData: null, sixyaoData: null, qimenData: null, predictData: null, error: null }),
  addProfile: (p) =>
    set((s) => ({ profiles: [...s.profiles, p], activeProfile: p })),
  setActiveTab: (t) => set({ activeTab: t }),
  setBaziData: (d) => set({ baziData: d }),
  setZiweiData: (d) => set({ ziweiData: d }),
  setAstroData: (d) => set({ astroData: d }),
  setSixyaoData: (d) => set({ sixyaoData: d }),
  setQimenData: (d) => set({ qimenData: d }),
  setPredictData: (d) => set({ predictData: d }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
}));
