import React from 'react';
import { BirthdayContact } from '../types';
import { Sparkles, MessageCircle, Mail, PartyPopper } from 'lucide-react';
import { fireBirthdayConfetti } from '../utils/confetti';
import { createWhatsAppUrl } from '../services/whatsapp';

interface TodayBannerProps {
  contacts: BirthdayContact[];
  onGenerateMessage: (contact: BirthdayContact) => void;
  onOpenGmail: (contact: BirthdayContact) => void;
}

export const TodayBanner: React.FC<TodayBannerProps> = ({
  contacts,
  onGenerateMessage,
  onOpenGmail,
}) => {
  if (contacts.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 p-6 text-white shadow-lg mb-8">
      {/* Decorative background glow circles */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
            <PartyPopper className="w-3.5 h-3.5 text-amber-200" />
            <span>Festa do Dia! 🎂</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {contacts.length === 1
              ? `Hoje é o aniversário de ${contacts[0].name}!`
              : `Hoje temos ${contacts.length} aniversários para celebrar!`}
          </h2>
          <p className="text-sm text-white/90 mt-1 max-w-xl">
            Não deixe passar em branco. Use nossa IA para criar uma homenagem única em segundos e
            enviar diretamente pelo WhatsApp ou E-mail!
          </p>
        </div>

        <button
          onClick={fireBirthdayConfetti}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm shadow-md hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <PartyPopper className="w-4 h-4 text-rose-500 animate-bounce" />
          Soltar Confetes 🎉
        </button>
      </div>

      {/* Mini-cards for today's birthday celebrants */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-3.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 transition-all"
          >
            <div className="truncate mr-2">
              <p className="font-bold text-sm text-white truncate">{contact.name}</p>
              <p className="text-xs text-white/80">{contact.relationship}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onGenerateMessage(contact)}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="Gerar Mensagem com IA"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
              </button>

              {contact.phone && (
                <a
                  href={createWhatsAppUrl(
                    contact.phone,
                    `Olá ${contact.name}! 🎂🎉 Feliz aniversário! Que o seu dia seja repleto de alegrias e realizações!`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  title="Abrir no WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}

              {contact.email && (
                <button
                  onClick={() => onOpenGmail(contact)}
                  className="p-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                  title="Enviar via Gmail"
                >
                  <Mail className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
