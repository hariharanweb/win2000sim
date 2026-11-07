import { getNode, MY_DOCUMENTS, resolvePath, type FsPath } from '../fs';
import type { DesktopApi } from '../desktop/types';

/** Turns whatever the user typed into an address Internet Explorer can open. */
export function normalizeUrl(input: string): string {
  const s = input.trim();
  if (!s) return 'about:home';
  if (/^(about:|https?:\/\/)/i.test(s)) return s;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(s)) return `https://${s}`;
  // Anything else is treated as a search.
  return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(s)}`;
}

/**
 * Runs a program name, path or address the way the Run dialog does.
 * Returns false if nothing matched, so the caller can show an error.
 */
export function runCommand(input: string, api: DesktopApi, cwd: FsPath = MY_DOCUMENTS): boolean {
  const line = input.trim();
  if (!line) return true;
  const [rawName, ...restParts] = line.split(/\s+/);
  const arg = restParts.join(' ');
  const name = rawName.toLowerCase().replace(/\.exe$/, '');

  switch (name) {
    case 'notepad': {
      if (!arg) {
        api.openApp('notepad');
        return true;
      }
      const path = resolvePath(arg, cwd);
      api.openApp('notepad', { path });
      return true;
    }
    case 'mspaint':
    case 'pbrush': {
      api.openApp('paint', arg ? { path: resolvePath(arg, cwd) } : undefined);
      return true;
    }
    case 'sol':
      api.openApp('solitaire');
      return true;
    case 'mines':
    case 'minefield':
      api.openApp('minefield');
      return true;
    case 'calc':
      api.openApp('calc');
      return true;
    case 'cmd':
    case 'command':
      api.openApp('cmd');
      return true;
    case 'explorer': {
      const path = arg ? resolvePath(arg, cwd) : MY_DOCUMENTS;
      api.openApp('explorer', { location: { kind: 'path', path } });
      return true;
    }
    case 'iexplore':
      api.openApp('ie', { url: arg ? normalizeUrl(arg) : undefined });
      return true;
    case 'control':
      api.openApp('explorer', { location: { kind: 'controlpanel' } });
      return true;
    case 'winver':
      api.openApp('about');
      return true;
    case 'help':
    case 'winhelp':
      api.openApp('help');
      return true;
  }

  if (/^(https?:\/\/|www\.|about:)/i.test(line)) {
    api.openApp('ie', { url: normalizeUrl(line) });
    return true;
  }

  // A path to a file or folder on C:.
  if (/^[a-z]:|^\\|\\/i.test(line) || getNode(api.fs, resolvePath(line, cwd))) {
    const path = resolvePath(line, cwd);
    if (getNode(api.fs, path)) {
      api.openPath(path);
      return true;
    }
  }
  return false;
}

/** The error the Run dialog shows for an unknown name, as pre-broken lines. */
export function notFoundLines(input: string): string[] {
  return [
    `Windows cannot find '${input.trim()}'. Make sure you typed`,
    'the name correctly, and then try again. To search for a file,',
    'click the Start button, and then click Search.',
  ];
}
