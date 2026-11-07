// A small in-memory file system for drive C:. Paths are arrays of names starting
// with 'C:', e.g. ['C:', 'WINNT', 'win.ini']. Updates are immutable.

export type FsFolder = { kind: 'folder'; name: string; children: FsNode[] };
export type FsFile = { kind: 'file'; name: string; content: string };
export type FsNode = FsFolder | FsFile;
export type FsPath = string[];

const folder = (name: string, children: FsNode[] = []): FsFolder => ({ kind: 'folder', name, children });
const file = (name: string, content = ''): FsFile => ({ kind: 'file', name, content });

export const USER_HOME: FsPath = ['C:', 'Documents and Settings', 'User'];
export const MY_DOCUMENTS: FsPath = [...USER_HOME, 'My Documents'];

export const INITIAL_FS: FsFolder = folder('C:', [
  folder('Documents and Settings', [
    folder('User', [
      folder('My Documents', [
        folder('My Pictures'),
        file(
          'Readme.txt',
          'Welcome to Windows 2000!\r\n\r\nThis is your My Documents folder. Files you save from Notepad go here.\r\n',
        ),
      ]),
      folder('Desktop'),
      folder('Favorites'),
    ]),
  ]),
  folder('Program Files', [
    folder('Internet Explorer', [file('IEXPLORE.EXE')]),
    folder('Accessories'),
    folder('Common Files'),
  ]),
  folder('WINNT', [
    folder('system32', [file('calc.exe'), file('cmd.exe'), file('mines.exe'), file('mspaint.exe'), file('notepad.exe'), file('sol.exe'), file('winver.exe')]),
    file('explorer.exe'),
    file('notepad.exe'),
    file('win.ini', '; for 16-bit app support\r\n[fonts]\r\n[extensions]\r\n[mci extensions]\r\n[files]\r\n'),
    file('system.ini', '; for 16-bit app support\r\n[drivers]\r\nwave=mmdrv.dll\r\ntimer=timer.drv\r\n'),
  ]),
  file('AUTOEXEC.BAT'),
  file('CONFIG.SYS'),
  file(
    'boot.ini',
    '[boot loader]\r\ntimeout=30\r\ndefault=multi(0)disk(0)rdisk(0)partition(1)\\WINNT\r\n[operating systems]\r\nmulti(0)disk(0)rdisk(0)partition(1)\\WINNT="Microsoft Windows 2000 Professional" /fastdetect\r\n',
  ),
]);

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function getNode(root: FsFolder, path: FsPath): FsNode | undefined {
  if (path.length === 0 || !same(path[0], root.name)) return undefined;
  let node: FsNode = root;
  for (const part of path.slice(1)) {
    if (node.kind !== 'folder') return undefined;
    const next: FsNode | undefined = node.children.find((c) => same(c.name, part));
    if (!next) return undefined;
    node = next;
  }
  return node;
}

/** Returns the path with each name's real capitalization, or undefined if it doesn't exist. */
export function canonicalPath(root: FsFolder, path: FsPath): FsPath | undefined {
  if (path.length === 0 || !same(path[0], root.name)) return undefined;
  const out: FsPath = [root.name];
  let node: FsNode = root;
  for (const part of path.slice(1)) {
    if (node.kind !== 'folder') return undefined;
    const next: FsNode | undefined = node.children.find((c) => same(c.name, part));
    if (!next) return undefined;
    out.push(next.name);
    node = next;
  }
  return out;
}

function updateFolder(
  node: FsFolder,
  rest: string[],
  fn: (f: FsFolder) => FsFolder,
): FsFolder {
  if (rest.length === 0) return fn(node);
  return {
    ...node,
    children: node.children.map((c) =>
      c.kind === 'folder' && same(c.name, rest[0]) ? updateFolder(c, rest.slice(1), fn) : c,
    ),
  };
}

function putChild(parent: FsFolder, child: FsNode): FsFolder {
  const others = parent.children.filter((c) => !same(c.name, child.name));
  return { ...parent, children: [...others, child] };
}

/** Creates or overwrites a file. The parent folder must exist. */
export function writeFile(root: FsFolder, path: FsPath, content: string): FsFolder {
  const name = path[path.length - 1];
  return updateFolder(root, path.slice(1, -1), (p) => putChild(p, file(name, content)));
}

/** Creates a folder if it doesn't exist. The parent folder must exist. */
export function makeFolder(root: FsFolder, path: FsPath): FsFolder {
  if (getNode(root, path)) return root;
  const name = path[path.length - 1];
  return updateFolder(root, path.slice(1, -1), (p) => putChild(p, folder(name)));
}

export function removeNode(root: FsFolder, path: FsPath): FsFolder {
  const name = path[path.length - 1];
  return updateFolder(root, path.slice(1, -1), (p) => ({
    ...p,
    children: p.children.filter((c) => !same(c.name, name)),
  }));
}

export function pathToString(path: FsPath): string {
  return path.length <= 1 ? `${path[0] ?? 'C:'}\\` : path.join('\\');
}

/** Resolves a typed path (absolute like C:\WINNT or relative to cwd, with . and ..). */
export function resolvePath(input: string, cwd: FsPath): FsPath {
  const cleaned = input.trim().replace(/\//g, '\\').replace(/^"|"$/g, '');
  let parts: FsPath;
  let rest: string;
  if (/^[a-z]:/i.test(cleaned)) {
    parts = [cleaned.slice(0, 2).toUpperCase()];
    rest = cleaned.slice(2);
  } else if (cleaned.startsWith('\\')) {
    parts = [cwd[0]];
    rest = cleaned;
  } else {
    parts = [...cwd];
    rest = cleaned;
  }
  for (const seg of rest.split('\\')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      if (parts.length > 1) parts.pop();
    } else {
      parts.push(seg);
    }
  }
  return parts;
}

/** Finds files and folders whose name contains the query (case-insensitive). */
export function searchFs(root: FsFolder, query: string): FsPath[] {
  const q = query.trim().toLowerCase().replace(/\*/g, '');
  const results: FsPath[] = [];
  const walk = (node: FsFolder, path: FsPath) => {
    for (const child of node.children) {
      const childPath = [...path, child.name];
      if (!q || child.name.toLowerCase().includes(q)) results.push(childPath);
      if (child.kind === 'folder') walk(child, childPath);
    }
  };
  walk(root, [root.name]);
  return results;
}

export function sortedChildren(node: FsFolder): FsNode[] {
  return [...node.children].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

export function fileExtension(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i + 1).toLowerCase();
}
