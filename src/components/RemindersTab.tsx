import React, { useState } from 'react';
import { BirthdayContact } from '../types';
import { getDaysUntilBirthday } from '../services/storage';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Send,
  MessageCircle,
  Mail,
  Sparkles,
  Calendar,
  Clock,
  Volume2,
} from 'lucide-react';
import { createWhatsAppUrl } from '../services/whatsapp';
import { sendGmailBirthdayEmail } from '../services/googleWorkspace';
import { getAccessToken } from '../services/auth';

interface RemindersTabProps {
  contacts: BirthdayContact[];
  onGenerateMessage: (contact: BirthdayContact) => void;
  onOpenGmail: (contact: BirthdayContact) => void;
  userEmail?: string;
  userName?: string;
}

export const RemindersTab: React.FC<RemindersTabProps> = ({
  contacts,
  onGenerateMessage,
  onOpenGmail,
  userEmail,
  userName,
}) => {
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSendingDigest, setIsSendingDigest] = useState(false);
  const [digestSuccess, setDigestSuccess] = useState<string | null>(null);
  const [digestError, setDigestError] = useState<string | null>(null);

  // Group contacts by reminder urgency
  const todayBirthdays = contacts.filter(
    (c) => getDaysUntilBirthday(c.birthDay, c.birthMonth) === 0
  );
  const tomorrowBirthdays = contacts.filter(
    (c) => getDaysUntilBirthday(c.birthDay, c.birthMonth) === 1
  );
  const next7DaysBirthdays = contacts.filter((c) => {
    const days = getDaysUntilBirthday(c.birthDay, c.birthMonth);
    return days > 1 && days <= 7;
  });
  const thisMonthBirthdays = contacts.filter((c) => {
    const days = getDaysUntilBirthday(c.birthDay, c.birthMonth);
    return days > 7 && days <= 30;
  });

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Seu navegador não suporta notificações.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      new Notification('🎉 NiverSync Notificações Ativadas!', {
        body: 'Você será avisado sobre os aniversários importantes no dia certo!',
        icon: 'https://cdn-icons-png.flaticon.com/512/3159/3159066.png',
      });
    }
  };

  const handleSendDigestEmail = async () => {
    if (!userEmail) {
      setDigestError('Conecte sua conta Google para receber o resumo no seu próprio e-mail.');
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setDigestError('Token de autenticação expirado. Conecte sua conta Google no topo.');
      return;
    }

    setIsSendingDigest(true);
    setDigestError(null);
    setDigestSuccess(null);

    const upcomingList = [...todayBirthdays, ...tomorrowBirthdays, ...next7DaysBirthdays];
    if (upcomingList.length === 0) {
      setDigestError('Não há aniversários nos próximos 7 dias para enviar no resumo.');
      setIsSendingDigest(false);
      return;
    }

    const digestLines = upcomingList
      .map((c) => {
        const days = getDaysUntilBirthday(c.birthDay, c.birthMonth);
        const whenStr = days === 0 ? 'HOJE 🎂' : days === 1 ? 'AMANHÃ ⏰' : `em ${days} dias`;
        return `• ${c.name} (${c.relationship}): ${c.birthDay}/${c.birthMonth} - ${whenStr}`;
      })
      .join('\n');

    try {
      await sendGmailBirthdayEmail(token, {
        to: userEmail,
        subject: `🔔 Lembrete NiverSync: ${upcomingList.length} aniversários próximos!`,
        recipientName: userName || 'Você',
        messageText: `Aqui está o seu resumo de aniversários para os próximos dias:\n\n${digestLines}\n\nAcesse o NiverSync para gerar mensagens com IA e enviar com um clique no WhatsApp ou E-mail!`,
        senderName: 'NiverSync Notificador Automático',
      });
      setDigestSuccess(`Resumo enviado com sucesso para seu e-mail (${userEmail})!`);
    } catch (err: any) {
      setDigestError(err?.message || 'Falha ao enviar resumo por e-mail.');
    } finally {
      setIsSendingDigest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5" />
            Central de Notificações & Lembretes
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Automação de Lembretes de Aniversário
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Acompanhe quem está fazendo aniversário hoje, amanhã ou nos próximos dias. Ative avisos no
            navegador ou envie um resumo automático para o seu e-mail via Gmail!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {notificationPermission !== 'granted' ? (
            <button
              onClick={requestNotificationPermission}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              Ativar Avisos no Navegador
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Notificações Ativas
            </span>
          )}

          {userEmail && (
            <button
              onClick={handleSendDigestEmail}
              disabled={isSendingDigest}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              {isSendingDigest ? 'Enviando...' : 'Enviar Resumo para Meu E-mail'}
            </button>
          )}
        </div>
      </div>

      {digestSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{digestSuccess}</span>
        </div>
      )}

      {digestError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{digestError}</span>
        </div>
      )}

      {/* Grid of urgencies */}
      <div className="space-y-6">
        {/* Today Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            Aniversários de Hoje ({todayBirthdays.length})
          </h3>

          {todayBirthdays.length === 0 ? (
            <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-500 text-center">
              Nenhum aniversariante hoje.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayBirthdays.map((c) => (
                <ReminderItemCard
                  key={c.id}
                  contact={c}
                  urgencyLabel="🎂 É HOJE!"
                  badgeColor="bg-rose-500 text-white"
                  onGenerateMessage={onGenerateMessage}
                  onOpenGmail={onOpenGmail}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tomorrow Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Aniversários de Amanhã ({tomorrowBirthdays.length})
          </h3>

          {tomorrowBirthdays.length === 0 ? (
            <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-500 text-center">
              Nenhum aniversariante amanhã.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tomorrowBirthdays.map((c) => (
                <ReminderItemCard
                  key={c.id}
                  contact={c}
                  urgencyLabel="⏰ Amanhã"
                  badgeColor="bg-amber-500 text-white"
                  onGenerateMessage={onGenerateMessage}
                  onOpenGmail={onOpenGmail}
                />
              ))}
            </div>
          )}
        </div>

        {/* Next 7 Days Section */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            Próximos 7 Dias ({next7DaysBirthdays.length})
          </h3>

          {next7DaysBirthdays.length === 0 ? (
            <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-500 text-center">
              Nenhum aniversariante nos próximos 7 dias.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {next7DaysBirthdays.map((c) => {
                const days = getDaysUntilBirthday(c.birthDay, c.birthMonth);
                return (
                  <ReminderItemCard
                    key={c.id}
                    contact={c}
                    urgencyLabel={`Faltam ${days} dias`}
                    badgeColor="bg-indigo-50 text-indigo-700 border border-indigo-200"
                    onGenerateMessage={onGenerateMessage}
                    onOpenGmail={onOpenGmail}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Next 30 Days */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            Mais adiante neste mês ({thisMonthBirthdays.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {thisMonthBirthdays.map((c) => {
              const days = getDaysUntilBirthday(c.birthDay, c.birthMonth);
              return (
                <div
                  key={c.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-slate-500 text-[11px]">
                      {c.birthDay}/{c.birthMonth} • Faltam {days} dias
                    </p>
                  </div>
                  <button
                    onClick={() => onGenerateMessage(c)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    title="Adiantar Mensagem IA"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReminderItemCard: React.FC<{
  contact: BirthdayContact;
  urgencyLabel: string;
  badgeColor: string;
  onGenerateMessage: (contact: BirthdayContact) => void;
  onOpenGmail: (contact: BirthdayContact) => void;
}> = ({ contact, urgencyLabel, badgeColor, onGenerateMessage, onOpenGmail }) => {
  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{contact.name}</h4>
            <p className="text-xs text-slate-500">
              {contact.relationship} • {contact.birthDay}/{contact.birthMonth}
            </p>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {urgencyLabel}
          </span>
        </div>

        {contact.notes && (
          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-2 italic">
            "{contact.notes}"
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onGenerateMessage(contact)}
          className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          Gerar Mensagem
        </button>

        {contact.phone && (
          <a
            href={createWhatsAppUrl(
              contact.phone,
              `Oi ${contact.name}! 🎂🎉 Passando para desejar um feliz aniversário antecipado/no seu dia especial!`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
            title="WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        )}

        {contact.email && (
          <button
            onClick={() => onOpenGmail(contact)}
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
            title="Gmail"
          >
            <Mail className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
