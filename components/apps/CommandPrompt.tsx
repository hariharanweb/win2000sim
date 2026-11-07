import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { type AppProps, useDesktop } from '../desktop/types';
import {
  canonicalPath,
  getNode,
  makeFolder,
  pathToString,
  removeNode,
  resolvePath,
  sortedChildren,
  USER_HOME,
  type FsPath,
} from '../fs';
import PixelText from '../PixelText';
import { text } from '../ui';
import { runCommand } from './commands';

const BANNER = [
  'Microsoft Windows 2000 [Version 5.00.2195]',
  '(C) Copyright 1985-2000 Microsoft Corp.',
  '',
];
const MAX_LINES = 300;

const HELP = [
  'For more information on a specific command, type the command name.',
  'CD       Displays the name of or changes the current directory.',
  'CLS      Clears the screen.',
  'DATE     Displays the date.',
  'DEL      Deletes a file.',
  'DIR      Displays a list of files and subdirectories in a directory.',
  'ECHO     Displays messages.',
  'EXIT     Quits the CMD.EXE program (command interpreter).',
  'IPCONFIG Displays IP network configuration.',
  'MKDIR    Creates a directory.',
  'PING     Checks a connection to another computer.',
  'TIME     Displays the system time.',
  'TYPE     Displays the contents of a text file.',
  'VER      Displays the Windows version.',
  '',
  'You can also start programs: notepad, calc, explorer, iexplore, winver.',
];

export default function CommandPrompt({ windowId }: AppProps) {
  const api = useDesktop();
  const [lines, setLines] = useState<string[]>(BANNER);
  const [cwd, setCwd] = useState<FsPath>(USER_HOME);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [cursorOn, setCursorOn] = useState(true);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const prompt = `${pathToString(cwd)}>`;

  useEffect(() => {
    const id = setInterval(() => setCursorOn((on) => !on), 530);
    return () => clearInterval(id);
  }, []);

  const print = (...out: string[]) => setLines((l) => [...l, ...out].slice(-MAX_LINES));

  const execute = (raw: string) => {
    const lineIn = raw.trim();
    print(`${prompt}${raw}`);
    if (lineIn) setHistory((h) => [...h, lineIn]);
    setHistoryIndex(null);
    if (!lineIn) return;

    const [cmdRaw, ...args] = lineIn.split(/\s+/);
    const cmd = cmdRaw.toLowerCase();
    const arg = args.join(' ');

    switch (cmd) {
      case 'cls':
        setLines([]);
        return;
      case 'exit':
        api.closeWindow(windowId);
        return;
      case 'help':
        print(...HELP, '');
        return;
      case 'ver':
        print('', 'Microsoft Windows 2000 [Version 5.00.2195]', '');
        return;
      case 'echo':
        print(arg || 'ECHO is on.');
        return;
      case 'date':
        print(`The current date is: ${new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' })}`);
        return;
      case 'time':
        print(`The current time is: ${new Date().toLocaleTimeString(undefined, { hour12: false })}`);
        return;
      case 'cd':
      case 'chdir': {
        if (!arg) {
          print(pathToString(cwd));
          return;
        }
        const target = canonicalPath(api.fs, resolvePath(arg, cwd));
        const node = target && getNode(api.fs, target);
        if (!target || !node || node.kind !== 'folder') {
          print('The system cannot find the path specified.');
          return;
        }
        setCwd(target);
        return;
      }
      case 'dir': {
        const target = arg ? resolvePath(arg, cwd) : cwd;
        const node = getNode(api.fs, target);
        if (!node || node.kind !== 'folder') {
          print('File Not Found');
          return;
        }
        const children = sortedChildren(node);
        const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
        const out = [' Volume in drive C has no label.', ' Volume Serial Number is 1166-2000', '', ` Directory of ${pathToString(target)}`, ''];
        if (target.length > 1) out.push(`${today}  10:00a      <DIR>          .`, `${today}  10:00a      <DIR>          ..`);
        let bytes = 0;
        for (const c of children) {
          if (c.kind === 'folder') {
            out.push(`${today}  10:00a      <DIR>          ${c.name}`);
          } else {
            bytes += c.content.length;
            out.push(`${today}  10:00a      ${String(c.content.length).padStart(14)} ${c.name}`);
          }
        }
        const files = children.filter((c) => c.kind === 'file').length;
        const dirs = children.length - files;
        out.push(
          `${String(files).padStart(16)} File(s) ${String(bytes).padStart(14)} bytes`,
          `${String(dirs).padStart(16)} Dir(s)  20,401,094,656 bytes free`,
          '',
        );
        print(...out);
        return;
      }
      case 'type': {
        const node = arg && getNode(api.fs, resolvePath(arg, cwd));
        if (!node) {
          print('The system cannot find the file specified.');
          return;
        }
        if (node.kind === 'folder') {
          print('Access is denied.');
          return;
        }
        print(...node.content.split(/\r?\n/));
        return;
      }
      case 'md':
      case 'mkdir': {
        if (!arg) {
          print('The syntax of the command is incorrect.');
          return;
        }
        const target = resolvePath(arg, cwd);
        if (getNode(api.fs, target)) {
          print(`A subdirectory or file ${arg} already exists.`);
          return;
        }
        if (!getNode(api.fs, target.slice(0, -1))) {
          print('The system cannot find the path specified.');
          return;
        }
        api.setFs((fs) => makeFolder(fs, target));
        return;
      }
      case 'del':
      case 'erase': {
        const target = arg && resolvePath(arg, cwd);
        const node = target && getNode(api.fs, target);
        if (!target || !node) {
          print(`Could Not Find ${arg ? pathToString(resolvePath(arg, cwd)) : ''}`);
          return;
        }
        if (node.kind === 'folder') {
          print('Access is denied.');
          return;
        }
        api.setFs((fs) => removeNode(fs, target));
        return;
      }
      case 'ipconfig':
        print(
          '',
          'Windows 2000 IP Configuration',
          '',
          'Ethernet adapter Local Area Connection:',
          '',
          '        Connection-specific DNS Suffix  . :',
          '        IP Address. . . . . . . . . . . . : 192.168.0.66',
          '        Subnet Mask . . . . . . . . . . . : 255.255.255.0',
          '        Default Gateway . . . . . . . . . : 192.168.0.1',
          '',
        );
        return;
      case 'ping': {
        if (!arg) {
          print('Usage: ping target_name');
          return;
        }
        const host = args[0];
        print('', `Pinging ${host} with 32 bytes of data:`, '');
        // Replies arrive one per second, like the real thing.
        [1, 2, 3, 4].forEach((n) =>
          setTimeout(() => {
            print(`Reply from ${host}: bytes=32 time=${8 + Math.floor(Math.random() * 20)}ms TTL=54`);
            if (n === 4) print('', `Ping statistics for ${host}:`, '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),', '');
          }, n * 1000),
        );
        return;
      }
    }

    // Not a built-in: try it as a program, path or address.
    if (!runCommand(lineIn, api, cwd)) {
      print(`'${cmdRaw}' is not recognized as an internal or external command,`, 'operable program or batch file.');
    }
  };

  const onKey = (key: string) => {
    if (key === 'ArrowUp' && history.length) {
      const i = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(i);
      setInput(history[i]);
    } else if (key === 'ArrowDown' && historyIndex !== null) {
      const i = historyIndex + 1;
      if (i >= history.length) {
        setHistoryIndex(null);
        setInput('');
      } else {
        setHistoryIndex(i);
        setInput(history[i]);
      }
    }
  };

  return (
    <Pressable style={styles.root} onPress={() => inputRef.current?.focus()}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {lines.map((line, i) => (
          <PixelText key={i} text={line || ' '} style={text.mono} />
        ))}
        <View style={styles.inputLine}>
          <PixelText text={`${prompt}${input}`} style={text.mono} />
          <PixelText text={cursorOn ? '_' : ' '} style={text.mono} />
        </View>
      </ScrollView>
      {/* Hidden input that captures typing; the line above shows what's typed. */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => {
          execute(input);
          setInput('');
        }}
        onKeyPress={(e) => onKey(e.nativeEvent.key)}
        blurOnSubmit={false}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 4,
  },
  inputLine: {
    flexDirection: 'row',
  },
  hiddenInput: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 1,
    height: 1,
    opacity: 0,
  },
});
