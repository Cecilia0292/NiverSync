import React, { useState } from 'react';
import { BirthdayContact } from '../types';
import { Mail, CheckCircle, AlertCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { sendGmailBirthdayEmail } from '../services/googleWorkspace';
import { getAccessToken } from '../services/auth';

interface GmailSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: BirthdayContact | null;
  initialMessage: string;
  initialSubject?: string;
  senderName: string;
  onSuccess: (sentMessage: string, subject: string) => void;
}

export const GmailSendModal: React.FC<GmailSendModalProps> = ({
  isOpen,
  onClose,
  contact,
  initialMessage,
  initialSubject,
  senderName,
  onSuccess,
}) => {
  const [subject, setSubject] = useState(
    initialSubject || `🎂 Feliz Aniversário, ${contact?.name || ''}! 🎉`
  );
  const [messageText, setMessageText] = useState(initialMessage);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  React.useEffect(() => {
    if (contact) {
      setSubject(initialSubject || `🎂 Feliz Aniversário, ${contact.name}! 🎉`);
      setMessageText(initialMessage);
      setError(null);
      setSentSuccess(false);
    }
  }, [contact, initialMessage, initialSubject, isOpen]);

  if (!isOpen || !contact) return null;

  const handleConfirmAndSend = async () => {
    if (!contact.email) {
      setError('Este contato não possui um endereço de e-mail cadastrado.');
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setError('Sessão do Google não encontrada ou expirada. Por favor, conecte sua conta Google no topo da página.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await sendGmailBirthdayEmail(token, {
        to: contact.email,
        subject,
        messageText,
        recipientName: contact.name,
        senderName: senderName || 'Seu amigo(a)',
      });

      setSentSuccess(true);
      onSuccess(messageText, subject);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Failed to send email via Gmail:', err);
      setError(err?.message || 'Falha ao enviar e-mail através da API do Gmail.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base sm:text-lg">Confirmação de Envio via Gmail</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Security & Explicit Action Notification */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Ação direta na sua conta Google</p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Um e-mail será enviado diretamente da sua caixa de saída do Gmail para{' '}
                <strong>{contact.name}</strong> ({contact.email}). Revise os dados abaixo antes de confirmar o envio.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {sentSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm">
                E-mail enviado com sucesso via Gmail!
              </span>
            </div>
          )}

          {/* Form Fields Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Destinatário:
            </label>
            <input
              type="text"
              readOnly
              value={`${contact.name} <${contact.email}>`}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assunto:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mensagem (Corpo do E-mail):
            </label>
            <textarea
              rows={6}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Card Preview of Email */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Pré-visualização do rodapé:
            </span>
            <p className="text-slate-600 italic">
              "Com todo carinho, {senderName || 'Seu amigo(a)'}" — Enviado com carinho através do NiverSync ✨
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmAndSend}
              disabled={isSending || sentSuccess}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Enviando via Gmail...
                </>
              ) : sentSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  Enviado!
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Confirmar e Enviar E-mail
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
