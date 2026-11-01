import React, { useState, useEffect } from 'react';
import { BirthdayContact } from '../types';
import { X, Calendar, Phone, Mail, User, Sparkles, AlertCircle } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: BirthdayContact, syncToGoogleCalendar: boolean) => Promise<void>;
  editingContact?: BirthdayContact | null;
  isCalendarAuthenticated: boolean;
}

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const RELATIONSHIPS: BirthdayContact['relationship'][] = [
  'Amigo(a)',
  'Família',
  'Mãe/Pai',
  'Irmão/Irmã',
  'Cônjuge/Namorado(a)',
  'Colega de Trabalho',
  'Cliente',
  'Outro',
];

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingContact,
  isCalendarAuthenticated,
}) => {
  const [name, setName] = useState('');
  const [birthDay, setBirthDay] = useState<number>(new Date().getDate());
  const [birthMonth, setBirthMonth] = useState<number>(new Date().getMonth() + 1);
  const [birthYear, setBirthYear] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<BirthdayContact['relationship']>('Amigo(a)');
  const [notes, setNotes] = useState('');
  const [memories, setMemories] = useState('');
  const [remindDaysBefore, setRemindDaysBefore] = useState<number[]>([0, 1]);
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingContact) {
      setName(editingContact.name);
      setBirthDay(editingContact.birthDay);
      setBirthMonth(editingContact.birthMonth);
      setBirthYear(editingContact.birthYear ? String(editingContact.birthYear) : '');
      setPhone(editingContact.phone || '');
      setEmail(editingContact.email || '');
      setRelationship(editingContact.relationship);
      setNotes(editingContact.notes || '');
      setMemories(editingContact.memories || '');
      setRemindDaysBefore(editingContact.remindDaysBefore || [0, 1]);
      setSyncToCalendar(false);
    } else {
      setName('');
      setBirthDay(new Date().getDate());
      setBirthMonth(new Date().getMonth() + 1);
      setBirthYear('');
      setPhone('');
      setEmail('');
      setRelationship('Amigo(a)');
      setNotes('');
      setMemories('');
      setRemindDaysBefore([0, 1]);
      setSyncToCalendar(isCalendarAuthenticated);
    }
    setError(null);
  }, [editingContact, isOpen, isCalendarAuthenticated]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do aniversariante.');
      return;
    }

    const dayNum = Number(birthDay);
    const monthNum = Number(birthMonth);

    if (dayNum < 1 || dayNum > 31) {
      setError('Dia do aniversário inválido.');
      return;
    }

    const yearNum = birthYear.trim() ? parseInt(birthYear.trim(), 10) : undefined;
    if (yearNum && (yearNum < 1900 || yearNum > new Date().getFullYear())) {
      setError('Ano de nascimento inválido.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const contactData: BirthdayContact = {
        id: editingContact ? editingContact.id : `bday-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim(),
        birthDay: dayNum,
        birthMonth: monthNum,
        birthYear: yearNum,
        phone: phone.trim(),
        email: email.trim(),
        relationship,
        notes: notes.trim(),
        memories: memories.trim(),
        remindDaysBefore,
        googleEventId: editingContact?.googleEventId,
      };

      await onSave(contactData, syncToCalendar);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar contato.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReminderDay = (day: number) => {
    setRemindDaysBefore((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-lg">
              {editingContact ? 'Editar Aniversariante' : 'Novo Aniversariante'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Camila Soares"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Birthday Date (Day, Month, Year) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Data do Aniversário *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={birthDay}
                  onChange={(e) => setBirthDay(Number(e.target.value))}
                  placeholder="Dia"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-center font-semibold"
                />
                <span className="text-[10px] text-slate-400 block text-center mt-0.5">Dia</span>
              </div>

              <div>
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(Number(e.target.value))}
                  className="w-full px-2 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-semibold"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block text-center mt-0.5">Mês</span>
              </div>

              <div>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="Ano (opcional)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-center font-semibold"
                />
                <span className="text-[10px] text-slate-400 block text-center mt-0.5">
                  Ano (p/ calcular idade)
                </span>
              </div>
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Relação / Vínculo
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as BirthdayContact['relationship'])}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            >
              {RELATIONSHIPS.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp (DDD + Número)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="11987654321"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Para envio direto pelo WhatsApp
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                E-mail (Gmail)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-indigo-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@exemplo.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Para envio de felicitação por e-mail
              </span>
            </div>
          </div>

          {/* AI Helper Fields */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Personalização da Mensagem com IA</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                Gostos, Hobbies e Interesses:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: ama café, gatos, tecnologia, rock dos anos 80..."
                className="w-full px-3 py-1.5 border border-indigo-200/80 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                Memórias especiais ou piadas internas:
              </label>
              <input
                type="text"
                value={memories}
                onChange={(e) => setMemories(e.target.value)}
                placeholder="Ex: viagem inesquecível a Paraty, sempre atrasada mas amada..."
                className="w-full px-3 py-1.5 border border-indigo-200/80 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          {/* Reminder Preferences */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Quando deseja receber lembretes?
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { day: 0, label: 'No dia do aniversário' },
                { day: 1, label: '1 dia antes' },
                { day: 3, label: '3 dias antes' },
                { day: 7, label: '1 semana antes' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.day}
                  onClick={() => toggleReminderDay(opt.day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    remindDaysBefore.includes(opt.day)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {remindDaysBefore.includes(opt.day) ? '✓ ' : '+ '}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Google Calendar Sync Option */}
          {isCalendarAuthenticated && !editingContact?.googleEventId && (
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={syncToCalendar}
                  onChange={(e) => setSyncToCalendar(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-medium text-slate-700">
                  📅 Adicionar este aniversário como evento anual no meu Google Calendar
                </span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? 'Salvando...' : editingContact ? 'Atualizar Contato' : 'Adicionar Aniversariante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
