"use client";

import { createContext, useContext, useState, useCallback } from "react";

const DEFAULT_QUALITIES: Record<string, number> = {
  "Liam Hamza": 4,
  "Karim Bennani": 4,
  "Youssef El Idrissi": 5,
  "Sofia Alaoui": 3,
  "Amine Tazi": 5,
  "Nadia Chraibi": 0,
  "Rachid Mouline": 2,
  "Hind Fassi": 4,
  "Mehdi Fassi-Fihri": 2,
};

interface PRQualityCtx {
  qualities: Record<string, number>;
  setQuality: (name: string, value: number) => void;
}

const PRQualityContext = createContext<PRQualityCtx>({
  qualities: DEFAULT_QUALITIES,
  setQuality: () => {},
});

export function PRQualityProvider({ children }: { children: React.ReactNode }) {
  const [qualities, setQualities] = useState(DEFAULT_QUALITIES);

  const setQuality = useCallback((name: string, value: number) => {
    setQualities((prev) => ({ ...prev, [name]: value }));
  }, []);

  return (
    <PRQualityContext.Provider value={{ qualities, setQuality }}>
      {children}
    </PRQualityContext.Provider>
  );
}

export function usePRQuality() {
  return useContext(PRQualityContext);
}
