// AutoBuildContext — React context that lets the admin walk the same
// client-portal experience against an AutoBuild record.

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AutoBuildContextType {
  activeBuildId: string | null;
  setActiveBuildId: (id: string | null) => void;
  activeBuild: any | null;
  refresh: () => Promise<void>;
}

const AutoBuildContext = createContext<AutoBuildContextType>({
  activeBuildId: null,
  setActiveBuildId: () => {},
  activeBuild: null,
  refresh: async () => {},
});

const STORAGE_KEY = "autobuilder_active_build_id";

export function AutoBuildProvider({ children }: { children: ReactNode }) {
  const [activeBuildId, setActiveBuildIdState] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });
  const [activeBuild, setActiveBuild] = useState<any>(null);

  const setActiveBuildId = (id: string | null) => {
    setActiveBuildIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const refresh = async () => {
    if (!activeBuildId) { setActiveBuild(null); return; }
    try {
      const { base44 } = await import("@/api/base44Client");
      const builds = await base44.entities.AutoBuild.filter({ id: activeBuildId }, "-created_date", 1);
      setActiveBuild(builds?.[0] || builds?.items?.[0] || null);
    } catch { setActiveBuild(null); }
  };

  useEffect(() => { refresh(); }, [activeBuildId]);

  return (
    <AutoBuildContext.Provider value={{ activeBuildId, setActiveBuildId, activeBuild, refresh }}>
      {children}
    </AutoBuildContext.Provider>
  );
}

export function useAutoBuild() {
  return useContext(AutoBuildContext);
}