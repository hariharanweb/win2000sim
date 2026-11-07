import { createContext, useContext } from 'react';

import type { MessageKind } from '../DesktopIcons';
import type { FsFolder, FsPath } from '../fs';

export type AppId =
  | 'notepad'
  | 'calc'
  | 'paint'
  | 'solitaire'
  | 'minefield'
  | 'cmd'
  | 'ie'
  | 'explorer'
  | 'display'
  | 'datetime'
  | 'system'
  | 'users'
  | 'taskbar'
  | 'lanstatus'
  | 'run'
  | 'shutdown'
  | 'help'
  | 'search'
  | 'about'
  | 'msgbox';

/** Special Explorer views that aren't folders on C:. */
export type SpecialPlace = 'mycomputer' | 'controlpanel' | 'printers' | 'network';

export type ExplorerLocation = { kind: 'path'; path: FsPath } | { kind: SpecialPlace };

export type MessageBoxSpec = {
  title: string;
  lines: string[];
  kind: MessageKind;
};

export type LaunchParams = {
  path?: FsPath; // file for Notepad, folder for Explorer
  location?: ExplorerLocation;
  url?: string; // Internet Explorer
  message?: MessageBoxSpec;
  searchText?: string;
};

export type WindowState = {
  id: number;
  app: AppId;
  title: string;
  params: LaunchParams;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
};

export type PowerAction = 'logoff' | 'shutdown' | 'restart';

/** What apps can do to the desktop and the rest of the system. */
export type DesktopApi = {
  openApp: (app: AppId, params?: LaunchParams) => void;
  closeWindow: (id: number) => void;
  setTitle: (id: number, title: string) => void;
  /** Resizes a window so its content area is exactly this size. */
  setContentSize: (id: number, width: number, height: number) => void;
  showMessage: (message: MessageBoxSpec) => void;
  fs: FsFolder;
  setFs: (update: (fs: FsFolder) => FsFolder) => void;
  /** Opens a file or folder the way double-clicking it in Explorer would. */
  openPath: (path: FsPath) => void;
  recentDocs: FsPath[];
  power: (action: PowerAction) => void;
  loggedOnAt: number;
};

export const DesktopContext = createContext<DesktopApi | null>(null);

export function useDesktop(): DesktopApi {
  const api = useContext(DesktopContext);
  if (!api) throw new Error('useDesktop must be used inside the Desktop');
  return api;
}

/** Props every app window's content receives. */
export type AppProps = {
  windowId: number;
  params: LaunchParams;
};
