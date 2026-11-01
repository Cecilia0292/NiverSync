import React from 'react';
import { BirthdayContact } from '../types';
import {
  getDaysUntilBirthday,
  getAgeTurning,
  getZodiacSign,
} from '../services/storage';
import { createWhatsAppUrl } from '../services/whatsapp';
import {
  Sparkles,
  MessageCircle,
  Mail,
  Calendar,
  CalendarPlus,
  Pencil,
  Trash2,
  Phone,
  Heart,
  Briefcase,
  Users,
} from 'lucide-react';

interface ContactCardProps {
  contact: BirthdayContact;
  onEdit: (contact: BirthdayContact) => void;
  onDelete: (contact: BirthdayContact) => void;
  onGenerateMessage: (contact: BirthdayContact) => void;
  onOpenGmail: (contact: BirthdayContact) => void;
  onSyncCalendar?: (contact: BirthdayContact) => void;
  isCalendarAuthenticated: boolean;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const RELATIONSHIP_COLORS: Record<string, string> = {
  'Amigo(a)': 'bg-blue-50 text-blue-700 border-blue-200',
  'Família': 'bg-purple-50 text-purple-700 border-purple-200',
  'Mãe/Pai': 'bg-pink-50 text-pink-700 border-pink-200',
  'Irmão/Irmã': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Cônjuge/Namorado(a)': 'bg-rose-50 text-rose-700 border-rose-200',
  'Colega de Trabalho': 'bg-amber-50 text-amber-700 border-amber-200',
  'Cliente': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Outro': 'bg-slate-50 text-slate-700 border-slate-200',
};

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
  onGenerateMessage,
  onOpenGmail,
  onSyncCalendar,
  isCalendarAuthenticated,
}) => {
  const daysUntil = getDaysUntilBirthday(contact.birthDay, contact.birthMonth);
  const ageTurning = getAgeTurning(contact.birthDay, contact.birthMonth, contact.birthYear);
  const zodiac = getZodiacSign(contact.birthDay, contact.birthMonth);

  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;
  const isSoon = daysUntil <= 7;

  // Initials for avatar
  const initials = contact.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  return (
    <div
      className={`relative group bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
        isToday
          ? 'border-rose-400 shadow-md ring-2 ring-rose-300/40 bg-gradient-to-b from-rose-50/30 to-white'
          : isTomorrow
          ? 'border-amber-300 shadow-sm bg-gradient-to-b from-amber-50/20 to-white'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="p-5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                isToday
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                {contact.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                    RELATIONSHIP_COLORS[contact.relationship] || RELATIONSHIP_COLORS['Outro']
                  }`}
                >
                  {contact.relationship}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1" title={zodiac.name}>
                  <span>{zodiac.icon}</span> {zodiac.name}
                </span>
              </div>
            </div>
          </div>

          {/* Days Remaining Pill */}
          <div>
            {isToday ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-xs animate-bounce">
                🎂 É HOJE!
              </span>
            ) : isTomorrow ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
                ⏰ Amanhã!
              </span>
            ) : isSoon ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Faltam {daysUntil} dias
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                em {daysUntil} dias
              </span>
            )}
          </div>
        </div>

        {/* Date & Age Info */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold text-slate-800">
              {contact.birthDay} de {MONTH_NAMES[contact.birthMonth - 1]}
            </span>
          </div>

          {ageTurning !== null && (
            <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md font-medium border border-slate-200/60">
              Completará <strong className="text-slate-700 font-bold">{ageTurning} anos</strong>
            </span>
          )}
        </div>

        {/* Contact details: Phone & Email */}
        <div className="mt-3 space-y-1 text-xs text-slate-600">
          {contact.phone && (
            <div className="flex items-center gap-2 text-slate-600 truncate">
              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{contact.phone}</span>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-2 text-slate-600 truncate">
              <Mail className="w-3 h-3 text-indigo-600 shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
        </div>

        {/* Notes preview */}
        {contact.notes && (
          <p className="mt-2.5 text-xs text-slate-500 line-clamp-2 bg-slate-50/80 p-2 rounded-lg border border-slate-100 italic">
            "{contact.notes}"
          </p>
        )}

        {/* Google Calendar sync status indicator */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
          {contact.googleEventId ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sincronizado no Calendar
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              Apenas local
            </span>
          )}

          {isCalendarAuthenticated && !contact.googleEventId && onSyncCalendar && (
            <button
              onClick={() => onSyncCalendar(contact)}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              <CalendarPlus className="w-3 h-3" />
              Adicionar ao Calendar
            </button>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-2">
        <button
          onClick={() => onGenerateMessage(contact)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          Gerar Mensagem IA
        </button>

        <div className="flex items-center gap-1">
          {contact.phone && (
            <a
              href={createWhatsAppUrl(
                contact.phone,
                `Olá ${contact.name}! 🎂🎉 Feliz Aniversário! Desejo que seu novo ciclo seja repleto de realizações, saúde e felicidade!`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Abrir no WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}

          {contact.email && (
            <button
              onClick={() => onOpenGmail(contact)}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              title="Enviar via Gmail"
            >
              <Mail className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onEdit(contact)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Editar contato"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(contact)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Excluir contato"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
