import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '../DesktopIcons';
import { type AppProps, useDesktop } from '../desktop/types';
import PixelText from '../PixelText';
import { useSystem } from '../system';
import { Checkbox, ClassicButton, Lines, PixelInput, Separator, SunkenPanel, T, text } from '../ui';
import { win } from '../Win2000Dialog';

/** OK / Cancel / Apply row used by property sheets. */
function SheetButtons({ onOk, onCancel, onApply }: { onOk: () => void; onCancel: () => void; onApply?: () => void }) {
  return (
    <View style={styles.sheetButtons}>
      <ClassicButton label="OK" isDefault onPress={onOk} width={120} />
      <ClassicButton label="Cancel" onPress={onCancel} width={120} />
      {onApply && <ClassicButton label="Apply" onPress={onApply} width={120} />}
    </View>
  );
}

/** A single "tab" header, since each sheet here only needs one page. */
function Tab({ label }: { label: string }) {
  return (
    <View style={styles.tabRow}>
      <View style={styles.tab}>
        <T>{label}</T>
      </View>
    </View>
  );
}

// ---------------- Display ----------------

const COLORS: { name: string; color: string }[] = [
  { name: '(Default) Windows 2000', color: '#4a6ea0' },
  { name: 'Teal', color: '#008080' },
  { name: 'Black', color: '#000000' },
  { name: 'Navy', color: '#000080' },
  { name: 'Maroon', color: '#800000' },
  { name: 'Dark Green', color: '#006000' },
  { name: 'Purple', color: '#600060' },
  { name: 'Gray', color: '#808080' },
];

export function DisplayProperties({ windowId }: AppProps) {
  const { settings, update } = useSystem();
  const { closeWindow } = useDesktop();
  const [choice, setChoice] = useState(settings.desktopColor);

  return (
    <View style={styles.sheet}>
      <Tab label="Background" />
      <View style={styles.page}>
        {/* Little monitor preview */}
        <View style={styles.previewMonitor}>
          <View style={[styles.previewScreen, { backgroundColor: choice }]} />
          <View style={styles.previewStand} />
        </View>
        <T>Select a background color:</T>
        <SunkenPanel style={styles.list}>
          {COLORS.map((c) => {
            const sel = c.color === choice;
            return (
              <Pressable key={c.color} onPress={() => setChoice(c.color)}
                style={[styles.listRow, sel && styles.listRowSel]}>
                <View style={[styles.swatch, { backgroundColor: c.color }]} />
                <PixelText text={c.name} style={[text.ui, sel && { color: '#fff' }]} />
              </Pressable>
            );
          })}
        </SunkenPanel>
      </View>
      <SheetButtons
        onOk={() => {
          update({ desktopColor: choice });
          closeWindow(windowId);
        }}
        onCancel={() => closeWindow(windowId)}
        onApply={() => update({ desktopColor: choice })}
      />
    </View>
  );
}

// ---------------- Date/Time ----------------

export function DateTimeProperties({ windowId }: AppProps) {
  const { closeWindow } = useDesktop();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <View style={styles.sheet}>
      <Tab label="Date & Time" />
      <View style={[styles.page, styles.dateRow]}>
        <View style={styles.dateCol}>
          <T>Date</T>
          <View style={styles.monthHeader}>
            <T>{now.toLocaleDateString(undefined, { month: 'long' })}</T>
            <T>{String(year)}</T>
          </View>
          <SunkenPanel style={styles.calendar}>
            <View style={styles.weekRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <View key={i} style={styles.dayCell}>
                  <PixelText text={d} style={text.bold} />
                </View>
              ))}
            </View>
            {weeks.map((week, w) => (
              <View key={w} style={styles.weekRow}>
                {week.map((d, i) => (
                  <View key={i} style={[styles.dayCell, d === now.getDate() && styles.today]}>
                    {d !== null && (
                      <PixelText text={String(d)} style={[text.ui, d === now.getDate() && { color: '#fff' }]} />
                    )}
                  </View>
                ))}
              </View>
            ))}
          </SunkenPanel>
        </View>
        <View style={styles.dateCol}>
          <T>Time</T>
          <View style={styles.clockFace}>
            <Icon name="datetime" size={96} />
          </View>
          <SunkenPanel style={styles.timeBox}>
            <T>{now.toLocaleTimeString()}</T>
          </SunkenPanel>
        </View>
      </View>
      <T style={styles.zone}>{`Current time zone: ${zone}`}</T>
      <SheetButtons onOk={() => closeWindow(windowId)} onCancel={() => closeWindow(windowId)} />
    </View>
  );
}

// ---------------- System ----------------

export function SystemProperties({ windowId }: AppProps) {
  const { closeWindow } = useDesktop();
  const { settings } = useSystem();
  return (
    <View style={styles.sheet}>
      <Tab label="General" />
      <View style={[styles.page, styles.systemPage]}>
        <Icon name="computer" size={96} />
        <View style={styles.systemText}>
          <Lines lines={[
            'System:',
            '    Microsoft Windows 2000',
            '    5.00.2195',
            '    Service Pack 4',
            '',
            'Registered to:',
            `    ${settings.userName}`,
            '',
            'Computer:',
            '    Intel Core i7-14700K',
            '    AT/AT COMPATIBLE',
            '    262,144 KB RAM',
          ]} />
        </View>
      </View>
      <SheetButtons onOk={() => closeWindow(windowId)} onCancel={() => closeWindow(windowId)} />
    </View>
  );
}

// ---------------- Users and Passwords ----------------

export function UsersAndPasswords({ windowId }: AppProps) {
  const { closeWindow, showMessage } = useDesktop();
  const { settings, update } = useSystem();
  const [changing, setChanging] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');

  const save = () => {
    if (oldPw !== settings.password) {
      showMessage({ title: 'Change Password', kind: 'error', lines: ['The old password is not correct.'] });
      return;
    }
    if (newPw !== confirm) {
      showMessage({ title: 'Change Password', kind: 'error', lines: ['The passwords you typed do not match.', 'Type the new password in both text boxes.'] });
      return;
    }
    update({ password: newPw });
    setChanging(false);
    setOldPw('');
    setNewPw('');
    setConfirm('');
    showMessage({ title: 'Change Password', kind: 'info', lines: ['Your password has been changed.', 'Use it the next time you log on.'] });
  };

  return (
    <View style={styles.sheet}>
      <Tab label="Users" />
      <View style={styles.page}>
        <T>Users for this computer:</T>
        <SunkenPanel style={styles.userList}>
          <View style={[styles.listRow, styles.listRowSel]}>
            <Icon name="users" size={32} />
            <PixelText text={settings.userName} style={[text.ui, { color: '#fff' }]} />
            <PixelText text="   Administrators" style={[text.ui, { color: '#fff' }]} />
          </View>
        </SunkenPanel>
        <Separator style={styles.sep} />
        {!changing ? (
          <View style={styles.row}>
            <T>{`Password for ${settings.userName}:`}</T>
            <ClassicButton label="Set Password..." onPress={() => setChanging(true)} width={210} />
          </View>
        ) : (
          <View style={styles.pwForm}>
            {[
              ['Old password:', oldPw, setOldPw],
              ['New password:', newPw, setNewPw],
              ['Confirm new password:', confirm, setConfirm],
            ].map(([label, value, set], i) => (
              <View key={i} style={styles.row}>
                <T style={styles.pwLabel}>{label as string}</T>
                <PixelInput style={styles.pwInput} value={value as string} mask
                  onChangeText={set as (v: string) => void} autoFocus={i === 0} onSubmitEditing={save} />
              </View>
            ))}
            <View style={styles.sheetButtons}>
              <ClassicButton label="OK" isDefault onPress={save} width={120} />
              <ClassicButton label="Cancel" onPress={() => setChanging(false)} width={120} />
            </View>
          </View>
        )}
      </View>
      <SheetButtons onOk={() => closeWindow(windowId)} onCancel={() => closeWindow(windowId)} />
    </View>
  );
}

// ---------------- Taskbar & Start Menu ----------------

export function TaskbarProperties({ windowId }: AppProps) {
  const { closeWindow } = useDesktop();
  const { settings, update } = useSystem();
  const [showClock, setShowClock] = useState(settings.showClock);
  return (
    <View style={styles.sheet}>
      <Tab label="General" />
      <View style={styles.page}>
        <Checkbox label="Always on top" checked onChange={() => {}} disabled />
        <Checkbox label="Auto hide" checked={false} onChange={() => {}} disabled />
        <Checkbox label="Show small icons in Start menu" checked={false} onChange={() => {}} disabled />
        <Checkbox label="Show clock" checked={showClock} onChange={setShowClock} />
      </View>
      <SheetButtons
        onOk={() => {
          update({ showClock });
          closeWindow(windowId);
        }}
        onCancel={() => closeWindow(windowId)}
        onApply={() => update({ showClock })}
      />
    </View>
  );
}

// ---------------- Local Area Connection Status ----------------

export function LanStatus({ windowId }: AppProps) {
  const { closeWindow, loggedOnAt } = useDesktop();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secs = Math.floor((now - loggedOnAt) / 1000);
  const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  const sent = 1200 + secs * 7;
  const received = 2400 + secs * 19;

  return (
    <View style={styles.sheet}>
      <Tab label="General" />
      <View style={styles.page}>
        <PixelText text="Connection" style={text.bold} />
        <Lines lines={['Status:          Connected', `Duration:        ${hh}:${mm}:${ss}`, 'Speed:           100.0 Mbps']} />
        <Separator style={styles.sep} />
        <PixelText text="Activity" style={text.bold} />
        <View style={styles.activity}>
          <Icon name="network" size={64} />
          <Lines lines={[`Packets sent:      ${sent.toLocaleString()}`, `Packets received:  ${received.toLocaleString()}`]} />
        </View>
      </View>
      <View style={styles.sheetButtons}>
        <ClassicButton label="Close" isDefault onPress={() => closeWindow(windowId)} width={120} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    padding: 10,
  },
  tabRow: {
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopColor: '#fff',
    borderLeftColor: '#fff',
    borderRightColor: '#404040',
    marginBottom: -2,
    backgroundColor: win.face,
    zIndex: 1,
  },
  page: {
    flex: 1,
    padding: 14,
    gap: 10,
    ...win.raised,
  },
  sheetButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 10,
  },
  previewMonitor: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  previewScreen: {
    width: 200,
    height: 130,
    borderWidth: 10,
    borderColor: '#d4d0c8',
    outlineWidth: 2,
    outlineColor: '#404040',
    outlineStyle: 'solid',
  },
  previewStand: {
    width: 80,
    height: 14,
    backgroundColor: '#a8a49c',
  },
  list: {
    flex: 1,
    padding: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
    height: 34,
  },
  listRowSel: {
    backgroundColor: '#0a246a',
  },
  swatch: {
    width: 28,
    height: 20,
    borderWidth: 1,
    borderColor: '#000',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 20,
  },
  dateCol: {
    gap: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    gap: 20,
  },
  calendar: {
    padding: 4,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    backgroundColor: '#0a246a',
  },
  clockFace: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  timeBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  zone: {
    marginTop: 8,
  },
  systemPage: {
    flexDirection: 'row',
    gap: 24,
  },
  systemText: {
    flex: 1,
  },
  userList: {
    height: 120,
    padding: 2,
  },
  sep: {
    marginVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pwForm: {
    gap: 10,
  },
  pwLabel: {
    width: 260,
  },
  pwInput: {
    flex: 1,
  },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
});
