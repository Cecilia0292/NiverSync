import { BirthdayContact, MessageHistoryItem } from '../types';

const CONTACTS_KEY = 'niversync_contacts_v1';
const HISTORY_KEY = 'niversync_history_v1';
const SETTINGS_KEY = 'niversync_settings_v1';

export interface AppSettings {
  userName: string;
  userEmail: string;
  enableBrowserNotifications: boolean;
  autoRemindDays: number[]; // e.g. [0, 1, 3]
  defaultTone: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  userEmail: '',
  enableBrowserNotifications: true,
  autoRemindDays: [0, 1],
  defaultTone: 'Emocionante e Carinhoso',
};

// Initial demo data so the app looks vibrant and usable immediately
const INITIAL_CONTACTS: BirthdayContact[] = [
  {
    id: 'demo-1',
    name: 'Mariana Albuquerque',
    birthDay: new Date().getDate(), // Birthday TODAY!
    birthMonth: new Date().getMonth() + 1,
    birthYear: 1996,
    relationship: 'Amigo(a)',
    phone: '11987654321',
    email: 'mariana.exemplo@gmail.com',
    notes: 'Adora café, viagens, pets e fotografia.',
    memories: 'Amigos desde a faculdade, sempre rindo de qualquer coisa.',
    remindDaysBefore: [0, 1, 3],
  },
  {
    id: 'demo-2',
    name: 'Carlos Eduardo (Dudu)',
    birthDay: new Date(Date.now() + 86400000 * 2).getDate(), // In 2 days
    birthMonth: new Date(Date.now() + 86400000 * 2).getMonth() + 1,
    birthYear: 1990,
    relationship: 'Irmão/Irmã',
    phone: '21976543210',
    email: 'carlos.dudu@gmail.com',
    notes: 'Gosta de futebol, churrasco e música sertaneja.',
    memories: 'Lembrar daquela viagem inesquecível para a praia.',
    remindDaysBefore: [0, 1],
  },
  {
    id: 'demo-3',
    name: 'Dra. Beatriz Mendes',
    birthDay: new Date(Date.now() + 86400000 * 5).getDate(), // In 5 days
    birthMonth: new Date(Date.now() + 86400000 * 5).getMonth() + 1,
    birthYear: 1982,
    relationship: 'Colega de Trabalho',
    phone: '31998877665',
    email: 'beatriz.mendes@empresa.com',
    notes: 'Profissional admirada, adora livros de liderança e jardinagem.',
    memories: 'Agradecer pela parceria excelente nos projetos deste ano.',
    remindDaysBefore: [0, 1],
  },
];

export function getStoredContacts(): BirthdayContact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) {
      saveStoredContacts(INITIAL_CONTACTS);
      return INITIAL_CONTACTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading contacts from localStorage:', e);
    return INITIAL_CONTACTS;
  }
}

export function saveStoredContacts(contacts: BirthdayContact[]): void {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch (e) {
    console.error('Failed saving contacts to localStorage:', e);
  }
}

export function getStoredHistory(): MessageHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addHistoryItem(item: MessageHistoryItem): void {
  try {
    const history = getStoredHistory();
    history.unshift(item);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  } catch (e) {
    console.error('Failed saving history:', e);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed saving settings:', e);
  }
}

/**
 * Calculates days remaining until next birthday.
 * 0 = today, 1 = tomorrow, etc.
 */
export function getDaysUntilBirthday(birthDay: number, birthMonth: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();
  let nextBday = new Date(currentYear, birthMonth - 1, birthDay);
  nextBday.setHours(0, 0, 0, 0);

  if (nextBday.getTime() < today.getTime()) {
    // Already passed this year, take next year
    nextBday = new Date(currentYear + 1, birthMonth - 1, birthDay);
    nextBday.setHours(0, 0, 0, 0);
  }

  const diffMs = nextBday.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculates age turning on their next birthday
 */
export function getAgeTurning(birthDay: number, birthMonth: number, birthYear?: number): number | null {
  if (!birthYear) return null;
  const today = new Date();
  const currentYear = today.getFullYear();
  const thisYearBday = new Date(currentYear, birthMonth - 1, birthDay);
  
  if (thisYearBday < today) {
    return currentYear + 1 - birthYear;
  }
  return currentYear - birthYear;
}

/**
 * Calculates zodiac sign
 */
export function getZodiacSign(day: number, month: number): { name: string; icon: string } {
  const signs = [
    { name: 'Capricórnio', icon: '♑', maxDay: 19 },
    { name: 'Aquário', icon: '♒', maxDay: 18 },
    { name: 'Peixes', icon: '♓', maxDay: 20 },
    { name: 'Áries', icon: '♈', maxDay: 19 },
    { name: 'Touro', icon: '♉', maxDay: 20 },
    { name: 'Gêmeos', icon: '♊', maxDay: 20 },
    { name: 'Câncer', icon: '♋', maxDay: 22 },
    { name: 'Leão', icon: '♌', maxDay: 22 },
    { name: 'Virgem', icon: '♍', maxDay: 22 },
    { name: 'Libra', icon: '♎', maxDay: 22 },
    { name: 'Escorpião', icon: '♏', maxDay: 21 },
    { name: 'Sagitário', icon: '♐', maxDay: 21 },
    { name: 'Capricórnio', icon: '♑', maxDay: 31 },
  ];

  if (day <= signs[month - 1].maxDay) {
    return signs[month - 1];
  } else {
    return signs[month % 12];
  }
}
