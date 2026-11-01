import React, { useState, useEffect } from 'react';
import { BirthdayContact, GeneratedMessageResponse } from '../types';
import {
  Sparkles,
  MessageCircle,
  Mail,
  Copy,
  Check,
  RefreshCw,
  Gift,
  Smile,
  Heart,
  Send,
  X,
  Sliders,
  Wand2,
} from 'lucide-react';
import { createWhatsAppUrl } from '../services/whatsapp';

interface MessageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContact?: BirthdayContact | null;
  contacts: BirthdayContact[];
  onOpenGmail: (contact: BirthdayContact, message: string, subject: string) => void;
  onRecordHistory: (
    contact: BirthdayContact,
    channel: 'whatsapp' | 'email',
    message: string,
    subject?: string
  ) => void;
  senderName: string;
}

const TONES = [
  { id: 'Emocionante e Carinhoso', label: '💖 Emocionante & Carinhoso', desc: 'Afeto profundo, gratidão e memórias' },
  { id: 'Divertido e Bem-Humorado', label: '😂 Divertido & Engraçado', desc: 'Brincadeiras leves, piadas e alegria' },
  { id: 'Profissional e Respeitoso', label: '👔 Profissional & Cortês', desc: 'Ideal para colegas, clientes e chefes' },
  { id: 'Curto e Direto', label: '⚡ Curto & Marcante', desc: 'Rápido, objetivo e carinhoso' },
  { id: 'Poético e Inspirador', label: '✨ Poético & Inspirador', desc: 'Desejos de luz, sabedoria e bênçãos' },
  { id: 'WhatsApp Casual', label: '📱 WhatsApp Casual', desc: 'Descontraído, áudio-vibe e muitos emojis' },
];

export const MessageGeneratorModal: React.FC<MessageGeneratorModalProps> = ({
  isOpen,
  onClose,
  selectedContact,
  contacts,
  onOpenGmail,
  onRecordHistory,
  senderName,
}) => {
  const [activeContactId, setActiveContactId] = useState<string>(selectedContact?.id || '');
  const [customName, setCustomName] = useState(selectedContact?.name || '');
  const [relationship, setRelationship] = useState(selectedContact?.relationship || 'Amigo(a)');
  const [age, setAge] = useState(selectedContact?.birthYear ? String(new Date().getFullYear() - selectedContact.birthYear) : '');
  const [tone, setTone] = useState('Emocionante e Carinhoso');
  const [interests, setInterests] = useState(selectedContact?.notes || '');
  const [memories, setMemories] = useState(selectedContact?.memories || '');
  const [length, setLength] = useState<'curto' | 'médio' | 'longo'>('médio');

  // Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedMessageResponse | null>(null);
  const [currentMessageText, setCurrentMessageText] = useState('');
  const [activeMessageVariant, setActiveMessageVariant] = useState<'main' | 'warm' | 'funny'>('main');
  const [emailSubject, setEmailSubject] = useState('');
  const [copied, setCopied] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync contact when prop changes
  useEffect(() => {
    if (selectedContact) {
      setActiveContactId(selectedContact.id);
      setCustomName(selectedContact.name);
      setRelationship(selectedContact.relationship);
      setInterests(selectedContact.notes || '');
      setMemories(selectedContact.memories || '');
      if (selectedContact.birthYear) {
        setAge(String(new Date().getFullYear() - selectedContact.birthYear));
      } else {
        setAge('');
      }
    } else if (contacts.length > 0 && !activeContactId) {
      const first = contacts[0];
      setActiveContactId(first.id);
      setCustomName(first.name);
      setRelationship(first.relationship);
      setInterests(first.notes || '');
      setMemories(first.memories || '');
    }
  }, [selectedContact, contacts, isOpen]);

  if (!isOpen) return null;

  const currentContact = contacts.find((c) => c.id === activeContactId) || selectedContact;

  const handleContactSelect = (contactId: string) => {
    setActiveContactId(contactId);
    const found = contacts.find((c) => c.id === contactId);
    if (found) {
      setCustomName(found.name);
      setRelationship(found.relationship);
      setInterests(found.notes || '');
      setMemories(found.memories || '');
      if (found.birthYear) {
        setAge(String(new Date().getFullYear() - found.birthYear));
      } else {
        setAge('');
      }
    }
  };

  const handleGenerate = async () => {
    if (!customName.trim()) {
      setError('Por favor, defina o nome do aniversariante.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customName,
          relationship,
          age,
          tone,
          interests,
          memories,
          length,
          senderName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao gerar mensagem.');
      }

      const data: GeneratedMessageResponse = await res.json();
      setGeneratedData(data);
      setCurrentMessageText(data.mainMessage);
      setActiveMessageVariant('main');
      setEmailSubject(data.emailSubject || `Feliz Aniversário, ${customName}! 🎂🎉`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Falha ao contatar o assistente de IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariant = (variant: 'main' | 'warm' | 'funny') => {
    if (!generatedData) return;
    setActiveMessageVariant(variant);
    if (variant === 'main') setCurrentMessageText(generatedData.mainMessage);
    if (variant === 'warm') setCurrentMessageText(generatedData.warmMessage);
    if (variant === 'funny') setCurrentMessageText(generatedData.funnyMessage);
  };

  const handleRefine = async () => {
    if (!refineInstruction.trim() || !currentMessageText) return;
    setIsRefining(true);
    try {
      const res = await fetch('/api/ai/refine-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentMessage: currentMessageText,
          instruction: refineInstruction,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.refinedMessage) {
          setCurrentMessageText(data.refinedMessage);
          setRefineInstruction('');
        }
      }
    } catch (e) {
      console.error('Refine error:', e);
    } finally {
      setIsRefining(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatchWhatsApp = () => {
    const phone = currentContact?.phone || '';
    const url = createWhatsAppUrl(phone, currentMessageText);
    window.open(url, '_blank');

    if (currentContact) {
      onRecordHistory(currentContact, 'whatsapp', currentMessageText);
    }
  };

  const handleDispatchGmail = () => {
    if (currentContact) {
      onOpenGmail(currentContact, currentMessageText, emailSubject);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Gerador de Mensagens Inteligentes</h3>
              <p className="text-xs text-white/80">
                Personalização com IA (Gemini 3.8 Flash) e envio via WhatsApp ou E-mail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two columns on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Column: Settings and Input (5 cols) */}
          <div className="lg:col-span-5 p-5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/50 space-y-4 overflow-y-auto">
            {/* Contact selector */}
            {contacts.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Selecionar Contato Cadastrado
                </label>
                <select
                  value={activeContactId}
                  onChange={(e) => handleContactSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.relationship}) - {c.birthDay}/{c.birthMonth}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Aniversariante *
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: Júlia Miranda"
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            {/* Relationship & Age */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Relação
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as any)}
                  placeholder="Ex: Melhor Amiga"
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Idade (opcional)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ex: 30"
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Tom da Mensagem</span>
                <span className="text-[10px] text-indigo-600 font-semibold">{tone}</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`p-2 rounded-xl text-left border text-xs font-medium transition-all cursor-pointer ${
                      tone === t.id
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-2xs font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="truncate">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Length selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Extensão
              </label>
              <div className="flex gap-2">
                {(['curto', 'médio', 'longo'] as const).map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setLength(len)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      length === len
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            {/* Interests & Memories */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Interesses / Hobbies
              </label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Ex: cinema, pilates, vinhos, praia"
                className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Memórias / Detalhes Pessoais
              </label>
              <textarea
                rows={2}
                value={memories}
                onChange={(e) => setMemories(e.target.value)}
                placeholder="Ex: lembrar da nossa viagem ou do apoio no trabalho..."
                className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              />
            </div>

            {/* Action to Generate */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Gerando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Gerar Mensagem com IA
                </>
              )}
            </button>
          </div>

          {/* Right Column: Generated Output, Variants & Dispatch (7 cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {generatedData ? (
              <div className="space-y-4">
                {/* Variant selector chips */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => handleSelectVariant('main')}
                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeMessageVariant === 'main'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Principal ({tone.split(' ')[0]})
                  </button>
                  <button
                    onClick={() => handleSelectVariant('warm')}
                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeMessageVariant === 'warm'
                        ? 'bg-white text-rose-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    Mais Afetuosa
                  </button>
                  <button
                    onClick={() => handleSelectVariant('funny')}
                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      activeMessageVariant === 'funny'
                        ? 'bg-white text-amber-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5 text-amber-500" />
                    Mais Divertida
                  </button>
                </div>

                {/* Email Subject preview if applicable */}
                {emailSubject && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                    <span className="font-bold text-indigo-900 shrink-0">Assunto sugerido:</span>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full bg-transparent border-none text-xs text-indigo-950 font-medium focus:outline-none"
                    />
                  </div>
                )}

                {/* Message Editable Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Mensagem Pronta para Envio
                    </label>
                    <button
                      onClick={handleCopy}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Texto
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={currentMessageText}
                    onChange={(e) => setCurrentMessageText(e.target.value)}
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-sans"
                  />
                </div>

                {/* Quick AI Refine Bar */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <Wand2 className="w-3 h-3 text-indigo-500" />
                    Quer ajustar? Peça à IA:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={refineInstruction}
                      onChange={(e) => setRefineInstruction(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                      placeholder="Ex: deixe mais curta, mencione que sinto saudades..."
                      className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      onClick={handleRefine}
                      disabled={isRefining || !refineInstruction.trim()}
                      className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isRefining ? 'Ajustando...' : 'Ajustar'}
                    </button>
                  </div>
                </div>

                {/* Gift Ideas from AI */}
                {generatedData.giftIdeas && generatedData.giftIdeas.length > 0 && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-1.5">
                      <Gift className="w-3.5 h-3.5 text-amber-600" />
                      Ideias de Presente / Gesto Carinhoso:
                    </span>
                    <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                      {generatedData.giftIdeas.map((idea, idx) => (
                        <li key={idx}>{idea}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-indigo-500" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Pronto para criar uma mensagem marcante?
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Selecione os parâmetros ao lado e clique em{' '}
                  <strong className="text-indigo-600">"Gerar Mensagem com IA"</strong>. Criaremos 3
                  versões sob medida para surpreender quem você ama!
                </p>
              </div>
            )}

            {/* Bottom Dispatch Controls */}
            {generatedData && (
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {currentContact?.phone ? (
                    <span className="text-emerald-700 font-medium">
                      WhatsApp: {currentContact.phone}
                    </span>
                  ) : (
                    <span>Sem número cadastrado</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDispatchWhatsApp}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar via WhatsApp
                  </button>

                  {currentContact?.email && (
                    <button
                      onClick={handleDispatchGmail}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      Enviar via Gmail
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
