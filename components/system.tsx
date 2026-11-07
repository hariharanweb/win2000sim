import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

import { INITIAL_FS, type FsFolder } from './fs';

// System-wide settings that outlive a single logon session (changed from Control Panel).
export type SystemSettings = {
  userName: string;
  password: string;
  desktopColor: string;
  showClock: boolean;
};

const DEFAULTS: SystemSettings = {
  userName: 'User',
  password: 'password',
  desktopColor: '#4a6ea0',
  showClock: true,
};

type SystemApi = {
  settings: SystemSettings;
  update: (patch: Partial<SystemSettings>) => void;
  /** Drive C:, kept here so files survive logging off and restarting. */
  fs: FsFolder;
  setFs: (update: (fs: FsFolder) => FsFolder) => void;
};

const SystemContext = createContext<SystemApi | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [fs, setFs] = useState<FsFolder>(INITIAL_FS);
  const api = useMemo<SystemApi>(
    () => ({ settings, update: (patch) => setSettings((s) => ({ ...s, ...patch })), fs, setFs }),
    [settings, fs],
  );
  return <SystemContext.Provider value={api}>{children}</SystemContext.Provider>;
}

export function useSystem(): SystemApi {
  const api = useContext(SystemContext);
  if (!api) throw new Error('useSystem must be used inside SystemProvider');
  return api;
}
