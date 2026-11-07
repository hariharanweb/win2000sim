import type { ComponentType } from 'react';

import type { IconName } from '../DesktopIcons';
import type { AppId, AppProps } from '../desktop/types';
import AboutWindows from './AboutWindows';
import Calculator from './Calculator';
import CommandPrompt from './CommandPrompt';
import {
  DateTimeProperties,
  DisplayProperties,
  LanStatus,
  SystemProperties,
  TaskbarProperties,
  UsersAndPasswords,
} from './ControlPanelApplets';
import Explorer from './Explorer';
import HelpApp from './HelpApp';
import InternetExplorer from './InternetExplorer';
import MessageBox from './MessageBox';
import Notepad from './Notepad';
import Minefield from './Minefield';
import Paint from './Paint';
import Solitaire from './Solitaire';
import RunDialog from './RunDialog';
import SearchApp from './SearchApp';
import ShutDownDialog from './ShutDownDialog';

export type AppDef = {
  title: string;
  icon: IconName;
  Component: ComponentType<AppProps>;
  w: number;
  h: number;
  resizable: boolean;
  /** Dialog windows only have a close button and no title-bar icon. */
  dialog: boolean;
  /** Only one copy can be open; opening again focuses it. */
  single?: boolean;
};

export const APPS: Record<AppId, AppDef> = {
  notepad: { title: 'Untitled - Notepad', icon: 'notepad', Component: Notepad, w: 760, h: 520, resizable: true, dialog: false },
  paint: { title: 'untitled - Paint', icon: 'paint', Component: Paint, w: 1000, h: 720, resizable: true, dialog: false },
  solitaire: { title: 'Solitaire', icon: 'solitaire', Component: Solitaire, w: 840, h: 760, resizable: true, dialog: false },
  minefield: { title: 'Minefield', icon: 'minefield', Component: Minefield, w: 420, h: 560, resizable: false, dialog: false },
  calc: { title: 'Calculator', icon: 'calc', Component: Calculator, w: 520, h: 500, resizable: false, dialog: false },
  cmd: { title: 'Command Prompt', icon: 'cmd', Component: CommandPrompt, w: 900, h: 520, resizable: true, dialog: false },
  ie: { title: 'Microsoft Internet Explorer', icon: 'ie', Component: InternetExplorer, w: 1000, h: 680, resizable: true, dialog: false },
  explorer: { title: 'My Computer', icon: 'explorer', Component: Explorer, w: 820, h: 560, resizable: true, dialog: false },
  display: { title: 'Display Properties', icon: 'display', Component: DisplayProperties, w: 560, h: 680, resizable: false, dialog: true, single: true },
  datetime: { title: 'Date/Time Properties', icon: 'datetime', Component: DateTimeProperties, w: 720, h: 560, resizable: false, dialog: true, single: true },
  system: { title: 'System Properties', icon: 'computer', Component: SystemProperties, w: 640, h: 560, resizable: false, dialog: true, single: true },
  users: { title: 'Users and Passwords', icon: 'users', Component: UsersAndPasswords, w: 720, h: 560, resizable: false, dialog: true, single: true },
  taskbar: { title: 'Taskbar and Start Menu Properties', icon: 'taskbar', Component: TaskbarProperties, w: 600, h: 400, resizable: false, dialog: true, single: true },
  lanstatus: { title: 'Local Area Connection Status', icon: 'network', Component: LanStatus, w: 580, h: 520, resizable: false, dialog: true, single: true },
  run: { title: 'Run', icon: 'run', Component: RunDialog, w: 700, h: 300, resizable: false, dialog: true, single: true },
  shutdown: { title: 'Shut Down Windows', icon: 'shutdown', Component: ShutDownDialog, w: 860, h: 470, resizable: false, dialog: true, single: true },
  help: { title: 'Windows 2000 Help', icon: 'help', Component: HelpApp, w: 960, h: 560, resizable: true, dialog: false, single: true },
  search: { title: 'Search Results', icon: 'search', Component: SearchApp, w: 820, h: 560, resizable: true, dialog: false },
  about: { title: 'About Windows', icon: 'computer', Component: AboutWindows, w: 860, h: 520, resizable: false, dialog: true, single: true },
  msgbox: { title: '', icon: 'computer', Component: MessageBox, w: 500, h: 220, resizable: false, dialog: true },
};
