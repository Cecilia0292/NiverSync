export interface BirthdayContact {
  id: string;
  name: string;
  birthDay: number; // 1-31
  birthMonth: number; // 1-12
  birthYear?: number; // Optional
  phone?: string; // WhatsApp number with country & DDD
  email?: string;
  relationship:
    | 'Amigo(a)'
    | 'Família'
    | 'Mãe/Pai'
    | 'Irmão/Irmã'
    | 'Cônjuge/Namorado(a)'
    | 'Colega de Trabalho'
    | 'Cliente'
    | 'Outro';
  notes?: string; // Hobbies, favorite things, style
  memories?: string;
  googleEventId?: string;
  remindDaysBefore: number[]; // e.g. [0, 1, 3]
  lastSentDate?: string;
  lastSentChannel?: 'whatsapp' | 'email';
}

export interface GeneratedMessageResponse {
  mainMessage: string;
  warmMessage: string;
  funnyMessage: string;
  emailSubject: string;
  giftIdeas: string[];
}

export interface MessageHistoryItem {
  id: string;
  contactId: string;
  contactName: string;
  recipient: string;
  channel: 'whatsapp' | 'email';
  subject?: string;
  message: string;
  sentAt: string;
}

export interface CalendarEventImport {
  id: string;
  summary: string;
  description?: string;
  start: {
    date?: string;
    dateTime?: string;
  };
  recurrence?: string[];
}
