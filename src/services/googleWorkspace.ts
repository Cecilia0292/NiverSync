import { BirthdayContact, CalendarEventImport } from '../types';

/**
 * Base64URL encoder conforming to RFC 4648 §5
 */
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Fetch calendar events related to birthdays or fetch all events to detect birthdays
 */
export async function fetchCalendarEvents(accessToken: string): Promise<BirthdayContact[]> {
  const contacts: BirthdayContact[] = [];

  try {
    // 1. Search primary calendar for birthday-related terms
    const queries = ['aniversario', 'aniversário', 'birthday', 'bday'];
    const eventMap = new Map<string, CalendarEventImport>();

    for (const q of queries) {
      const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
      url.searchParams.set('q', q);
      url.searchParams.set('maxResults', '100');
      url.searchParams.set('singleEvents', 'false'); // Get recurring master events

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        console.warn(`Calendar search failed for query "${q}":`, res.statusText);
        continue;
      }

      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          if (!eventMap.has(item.id)) {
            eventMap.set(item.id, item);
          }
        }
      }
    }

    // Also check if user has a secondary "Birthdays" or "Aniversários" calendar
    try {
      const calListRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (calListRes.ok) {
        const calList = await calListRes.json();
        const birthdayCal = calList.items?.find((c: any) =>
          c.summary?.toLowerCase().includes('aniversário') ||
          c.summary?.toLowerCase().includes('birthday') ||
          c.id?.includes('birthday')
        );
        if (birthdayCal && birthdayCal.id !== 'primary') {
          const bdayRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
              birthdayCal.id
            )}/events?maxResults=150`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (bdayRes.ok) {
            const bdayData = await bdayRes.json();
            if (bdayData.items) {
              for (const item of bdayData.items) {
                if (!eventMap.has(item.id)) {
                  eventMap.set(item.id, item);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not list secondary calendars:', e);
    }

    // Process detected events into contacts
    const items = Array.from(eventMap.values());
    for (const item of items) {
      const summary = item.summary || '';
      const startDateStr = item.start?.date || item.start?.dateTime;
      if (!startDateStr) continue;

      // Extract date components
      const datePart = startDateStr.split('T')[0];
      const [yearStr, monthStr, dayStr] = datePart.split('-');
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);
      const year = yearStr ? parseInt(yearStr, 10) : undefined;

      if (!month || !day) continue;

      // Clean name from summary e.g. "Aniversário de João Silva" -> "João Silva"
      let cleanedName = summary
        .replace(/^🎂\s*/i, '')
        .replace(/^aniversário\s+(de|da|do)?\s*/i, '')
        .replace(/^aniversario\s+(de|da|do)?\s*/i, '')
        .replace(/^birthday\s+of\s*/i, '')
        .replace(/'s\s+birthday/i, '')
        .replace(/-?\s*aniversário.*$/i, '')
        .replace(/-?\s*birthday.*$/i, '')
        .trim();

      if (!cleanedName) {
        cleanedName = summary;
      }

      contacts.push({
        id: `cal-${item.id}`,
        name: cleanedName,
        birthDay: day,
        birthMonth: month,
        birthYear: year && year < new Date().getFullYear() ? year : undefined,
        relationship: 'Amigo(a)',
        notes: item.description || '',
        googleEventId: item.id,
        remindDaysBefore: [0, 1],
      });
    }
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    throw err;
  }

  return contacts;
}

/**
 * Creates an annual recurring birthday event in Google Calendar
 */
export async function createGoogleCalendarBirthday(
  accessToken: string,
  contact: BirthdayContact
): Promise<string> {
  const currentYear = new Date().getFullYear();
  const monthStr = String(contact.birthMonth).padStart(2, '0');
  const dayStr = String(contact.birthDay).padStart(2, '0');

  // All-day event start and end (end date in Calendar API is exclusive for all-day events)
  const startDate = `${currentYear}-${monthStr}-${dayStr}`;
  const nextDay = new Date(currentYear, contact.birthMonth - 1, contact.birthDay + 1);
  const nextDayMonthStr = String(nextDay.getMonth() + 1).padStart(2, '0');
  const nextDayStr = String(nextDay.getDate()).padStart(2, '0');
  const endDate = `${nextDay.getFullYear()}-${nextDayMonthStr}-${nextDayStr}`;

  const eventPayload = {
    summary: `🎂 Aniversário de ${contact.name}`,
    description: `Lembrete automático criado pelo NiverSync.\n` +
      (contact.phone ? `WhatsApp: ${contact.phone}\n` : '') +
      (contact.email ? `E-mail: ${contact.email}\n` : '') +
      (contact.relationship ? `Relação: ${contact.relationship}\n` : '') +
      (contact.notes ? `Notas: ${contact.notes}` : ''),
    start: {
      date: startDate,
    },
    end: {
      date: endDate,
    },
    recurrence: ['RRULE:FREQ=YEARLY'],
    transparency: 'transparent', // Free, does not block time on calendar
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 540 }, // 9:00 AM on the day
        { method: 'popup', minutes: 1440 }, // 24 hours before
      ],
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha ao criar evento no Google Calendar: ${errorBody}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Delete a birthday event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const errorBody = await response.text();
    throw new Error(`Falha ao remover evento do Google Calendar: ${errorBody}`);
  }
}

/**
 * Sends a birthday email directly through Gmail API
 */
export async function sendGmailBirthdayEmail(
  accessToken: string,
  options: {
    to: string;
    subject: string;
    messageText: string;
    recipientName: string;
    senderName?: string;
  }
): Promise<{ id: string; threadId: string }> {
  const formattedHtml = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 40px;">🎂🎉🎈</span>
      <h1 style="color: #4f46e5; margin: 8px 0 0; font-size: 24px;">Feliz Aniversário, ${options.recipientName}!</h1>
    </div>
    <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px; white-space: pre-wrap; font-size: 16px; line-height: 1.6; color: #334155;">
${options.messageText.replace(/\n/g, '<br/>')}
    </div>
    <p style="font-size: 14px; color: #64748b; text-align: center; margin: 0;">
      Com todo carinho,<br/>
      <strong>${options.senderName || 'Seu amigo(a)'}</strong>
    </p>
    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 12px;" />
    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
      Mensagem enviada com carinho através do NiverSync ✨
    </p>
  </div>
  `;

  // Encode subject to MIME B-encoded word to support UTF-8 accents and emojis
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`;

  const emailRaw = [
    `To: ${options.to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    formattedHtml,
  ].join('\r\n');

  const base64UrlEmail = toBase64Url(emailRaw);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64UrlEmail,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha ao enviar e-mail via Gmail: ${errorBody}`);
  }

  return response.json();
}
