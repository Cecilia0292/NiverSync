import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { BirthdayContact, MessageHistoryItem } from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/auth';
import {
  getStoredContacts,
  saveStoredContacts,
  getStoredHistory,
  addHistoryItem,
  getDaysUntilBirthday,
} from './services/storage';
import {
  createGoogleCalendarBirthday,
  deleteGoogleCalendarEvent,
} from './services/googleWorkspace';
import { Navbar } from './components/Navbar';
import { TodayBanner } from './components/TodayBanner';
import { ContactCard } from './components/ContactCard';
import { ContactModal } from './components/ContactModal';
import { MessageGeneratorModal } from './components/MessageGeneratorModal';
import { GmailSendModal } from './components/GmailSendModal';
import { CalendarSyncModal } from './components/CalendarSyncModal';
import { RemindersTab } from './components/RemindersTab';
import { HistoryTab } from './components/HistoryTab';
import { fireBirthdayConfetti } from './utils/confetti';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Sparkles,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Cake,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [contacts, setContacts] = useState<BirthdayContact[]>([]);
  const [history, setHistory] = useState<MessageHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'contacts' | 'generator' | 'history' | 'reminders'>('contacts');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState('all');
  const [timingFilter, setTimingFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Modals state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<BirthdayContact | null>(null);

  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [generatorContact, setGeneratorContact] = useState<BirthdayContact | null>(null);

  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [gmailContact, setGmailContact] = useState<BirthdayContact | null>(null);
  const [gmailInitialMessage, setGmailInitialMessage] = useState('');
  const [gmailInitialSubject, setGmailInitialSubject] = useState('');

  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);

  // Toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Initialize Auth & Local Storage
  useEffect(() => {
    const loadedContacts = getStoredContacts();
    setContacts(loadedContacts);
    setHistory(getStoredHistory());

    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );

    // Check if there are birthdays today and fire confetti once
    const todayList = loadedContacts.filter(
      (c) => getDaysUntilBirthday(c.birthDay, c.birthMonth) === 0
    );
    if (todayList.length > 0) {
      setTimeout(() => {
        fireBirthdayConfetti();
      }, 800);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        showToast(`Bem-vindo, ${result.user.displayName || 'Usuário'}! Google Calendar e Gmail conectados.`);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showToast('Falha ao conectar conta Google.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    showToast('Você desconectou da sua conta Google.', 'info');
  };

  // Contact actions
  const handleSaveContact = async (contact: BirthdayContact, syncToCalendar: boolean) => {
    let updatedContact = { ...contact };

    if (syncToCalendar && user) {
      const token = await getAccessToken();
      if (token) {
        try {
          const eventId = await createGoogleCalendarBirthday(token, contact);
          updatedContact.googleEventId = eventId;
          showToast(`Aniversário sincronizado com seu Google Calendar!`);
        } catch (e: any) {
          console.error(e);
          showToast(`Salvo localmente, mas houve erro no Calendar: ${e.message}`, 'error');
        }
      }
    }

    setContacts((prev) => {
      const existsIndex = prev.findIndex((c) => c.id === updatedContact.id);
      let next: BirthdayContact[];
      if (existsIndex >= 0) {
        next = [...prev];
        next[existsIndex] = updatedContact;
      } else {
        next = [updatedContact, ...prev];
      }
      saveStoredContacts(next);
      return next;
    });

    showToast('Aniversariante salvo com sucesso!');
  };

  const handleDeleteContact = async (contact: BirthdayContact) => {
    const confirmed = window.confirm(
      contact.googleEventId
        ? `Tem certeza que deseja excluir "${contact.name}"? O evento também será removido do seu Google Calendar.`
        : `Tem certeza que deseja excluir "${contact.name}" da sua lista?`
    );

    if (!confirmed) return;

    if (contact.googleEventId && user) {
      const token = await getAccessToken();
      if (token) {
        try {
          await deleteGoogleCalendarEvent(token, contact.googleEventId);
        } catch (e) {
          console.error('Failed to remove event from Calendar:', e);
        }
      }
    }

    setContacts((prev) => {
      const filtered = prev.filter((c) => c.id !== contact.id);
      saveStoredContacts(filtered);
      return filtered;
    });

    showToast(`"${contact.name}" foi removido(a).`, 'info');
  };

  const handleSyncSingleContactToCalendar = async (contact: BirthdayContact) => {
    const token = await getAccessToken();
    if (!token) {
      showToast('Por favor, conecte sua conta Google no topo para sincronizar.', 'error');
      return;
    }

    try {
      const eventId = await createGoogleCalendarBirthday(token, contact);
      setContacts((prev) => {
        const next = prev.map((c) => (c.id === contact.id ? { ...c, googleEventId: eventId } : c));
        saveStoredContacts(next);
        return next;
      });
      showToast(`Aniversário de ${contact.name} adicionado ao Google Calendar!`);
    } catch (err: any) {
      showToast(err.message || 'Erro ao sincronizar com Google Calendar', 'error');
    }
  };

  // Calendar sync modal callbacks
  const handleImportCalendarContacts = (importedList: BirthdayContact[]) => {
    setContacts((prev) => {
      const merged = [...importedList, ...prev];
      // Deduplicate by ID
      const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
      saveStoredContacts(unique);
      return unique;
    });
    showToast(`${importedList.length} aniversariante(s) importado(s) da agenda!`);
  };

  const handleUpdateContactCalendarId = (contactId: string, eventId: string) => {
    setContacts((prev) => {
      const next = prev.map((c) => (c.id === contactId ? { ...c, googleEventId: eventId } : c));
      saveStoredContacts(next);
      return next;
    });
  };

  // Message Generator launcher
  const handleOpenGenerator = (contact?: BirthdayContact) => {
    setGeneratorContact(contact || null);
    setIsGeneratorModalOpen(true);
  };

  // Gmail Sender launcher
  const handleOpenGmailModal = (contact: BirthdayContact, message?: string, subject?: string) => {
    if (!user) {
      showToast('Por favor, faça login com a conta Google para enviar via Gmail.', 'info');
      handleLogin();
      return;
    }
    setGmailContact(contact);
    setGmailInitialMessage(
      message ||
        `Querido(a) ${contact.name},\n\nPassando para te desejar um Feliz Aniversário repleto de saúde, paz, alegria e muitas realizações!\n\nQue este novo ciclo traga tudo o que há de melhor para você.\n\nUm forte abraço!`
    );
    setGmailInitialSubject(subject || `🎂 Feliz Aniversário, ${contact.name}! 🎉`);
    setIsGmailModalOpen(true);
  };

  const handleGmailSuccess = (sentMessage: string, subject: string) => {
    if (gmailContact) {
      handleRecordHistory(gmailContact, 'email', sentMessage, subject);
      showToast(`E-mail de aniversário enviado para ${gmailContact.name}!`);
    }
  };

  const handleRecordHistory = (
    contact: BirthdayContact,
    channel: 'whatsapp' | 'email',
    message: string,
    subject?: string
  ) => {
    const item: MessageHistoryItem = {
      id: `hist-${Date.now()}`,
      contactId: contact.id,
      contactName: contact.name,
      recipient: channel === 'whatsapp' ? contact.phone || 'WhatsApp' : contact.email || 'E-mail',
      channel,
      subject,
      message,
      sentAt: new Date().toISOString(),
    };
    addHistoryItem(item);
    setHistory(getStoredHistory());

    // Update contact lastSent info
    setContacts((prev) => {
      const next = prev.map((c) =>
        c.id === contact.id
          ? { ...c, lastSentDate: new Date().toISOString().split('T')[0], lastSentChannel: channel }
          : c
      );
      saveStoredContacts(next);
      return next;
    });
  };

  // Filter and sort contacts: sorted by days until next birthday
  const sortedAndFilteredContacts = useMemo(() => {
    return contacts
      .map((c) => ({
        ...c,
        daysUntil: getDaysUntilBirthday(c.birthDay, c.birthMonth),
      }))
      .filter((c) => {
        // Query search
        const matchesQuery =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (c.phone && c.phone.includes(searchQuery)) ||
          (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

        // Relationship filter
        const matchesRelationship =
          selectedRelationship === 'all' || c.relationship === selectedRelationship;

        // Timing filter
        let matchesTiming = true;
        if (timingFilter === 'today') matchesTiming = c.daysUntil === 0;
        else if (timingFilter === 'week') matchesTiming = c.daysUntil <= 7;
        else if (timingFilter === 'month') matchesTiming = c.daysUntil <= 30;

        return matchesQuery && matchesRelationship && matchesTiming;
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [contacts, searchQuery, selectedRelationship, timingFilter]);

  // Today count and upcoming count
  const todayBirthdays = useMemo(() => {
    return contacts.filter((c) => getDaysUntilBirthday(c.birthDay, c.birthMonth) === 0);
  }, [contacts]);

  const upcoming7Days = useMemo(() => {
    return contacts.filter((c) => {
      const d = getDaysUntilBirthday(c.birthDay, c.birthMonth);
      return d > 0 && d <= 7;
    });
  }, [contacts]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans">
      {/* Toast banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-indigo-600 text-white border-indigo-500'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenSync={() => {
          if (!user) {
            handleLogin();
          } else {
            setIsCalendarSyncOpen(true);
          }
        }}
        todayCount={todayBirthdays.length}
        upcomingCount={upcoming7Days.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Today's Special Celebration Banner */}
        <TodayBanner
          contacts={todayBirthdays}
          onGenerateMessage={handleOpenGenerator}
          onOpenGmail={handleOpenGmailModal}
        />

        {/* Tab 1: Contacts & Calendar */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            {/* Control Bar: Search, Filters, Add Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome, hobbies, WhatsApp ou e-mail..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Relationship filter */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedRelationship}
                  onChange={(e) => setSelectedRelationship(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="all">Todas as Relações</option>
                  <option value="Amigo(a)">Amigos</option>
                  <option value="Família">Família</option>
                  <option value="Mãe/Pai">Mãe / Pai</option>
                  <option value="Irmão/Irmã">Irmãos</option>
                  <option value="Cônjuge/Namorado(a)">Cônjuge / Amor</option>
                  <option value="Colega de Trabalho">Trabalho</option>
                  <option value="Cliente">Clientes</option>
                </select>

                {/* Timing filter pills */}
                <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setTimingFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      timingFilter === 'all'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setTimingFilter('today')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      timingFilter === 'today'
                        ? 'bg-white text-rose-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hoje 🎉
                  </button>
                  <button
                    onClick={() => setTimingFilter('week')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      timingFilter === 'week'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Próx. 7 dias
                  </button>
                  <button
                    onClick={() => setTimingFilter('month')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      timingFilter === 'month'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Este Mês
                  </button>
                </div>

                {/* Add Contact Button */}
                <button
                  onClick={() => {
                    setEditingContact(null);
                    setIsContactModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Aniversário</span>
                </button>
              </div>
            </div>

            {/* List of Birthday Cards */}
            {sortedAndFilteredContacts.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                  <Cake className="w-6 h-6 text-indigo-500" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Nenhum aniversariante encontrado</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tente alterar seus filtros de busca ou adicione um novo aniversariante para começar a
                  gerar mensagens inteligentes e sincronizar lembretes!
                </p>
                <button
                  onClick={() => {
                    setEditingContact(null);
                    setIsContactModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Primeiro Aniversariante
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedAndFilteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onEdit={(c) => {
                      setEditingContact(c);
                      setIsContactModalOpen(true);
                    }}
                    onDelete={handleDeleteContact}
                    onGenerateMessage={handleOpenGenerator}
                    onOpenGmail={handleOpenGmailModal}
                    onSyncCalendar={handleSyncSingleContactToCalendar}
                    isCalendarAuthenticated={!!user}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Message Generator View */}
        {activeTab === 'generator' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Estúdio Criativo de Mensagens de Aniversário
                </h2>
                <p className="text-xs text-slate-500">
                  Gere mensagens personalizadas com inteligência artificial para WhatsApp e E-mail
                </p>
              </div>

              <button
                onClick={() => handleOpenGenerator()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-xs hover:scale-105 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Abrir Painel de Criação
              </button>
            </div>

            {/* Showcase Cards with Pre-made Tones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: '💖 Emocionante & Carinhoso',
                  desc: 'Perfeito para família, melhores amigos e parceiros de vida. Palavras profundas que tocam o coração.',
                  sample: 'Que este novo ciclo te traga a mesma luz e alegria que você espalha para todos ao seu redor...',
                },
                {
                  title: '😂 Divertido & Engraçado',
                  desc: 'Com piadas sobre idade, brincadeiras leves e muita descontração para quem adora rir.',
                  sample: 'Mais um ano de pura sabedoria (e novos boletos)! Parabéns, continue com esse espírito jovem...',
                },
                {
                  title: '👔 Profissional & Cortês',
                  desc: 'Para clientes, líderes de equipe e colegas de trabalho com elegância e respeito mútuo.',
                  sample: 'Desejo-lhe um aniversário extraordinário repleto de conquistas e sucesso profissional...',
                },
                {
                  title: '⚡ Curto & Marcante',
                  desc: 'Rápido, memorável e direto ao ponto. Ótimo para status de WhatsApp e mensagens pontuais.',
                  sample: 'Parabéns pelo seu dia! Muita saúde, paz e motivos para celebrar hoje e sempre! 🎂🥂',
                },
                {
                  title: '✨ Poético & Inspirador',
                  desc: 'Desejos de evolução, espiritualidade, sabedoria e gratidão pela vida.',
                  sample: 'Que os ventos deste novo ano soprem bênçãos, serenidade e realizações sobre os seus passos...',
                },
                {
                  title: '📱 WhatsApp Casual',
                  desc: 'Clima descontraído, emojis bem posicionados e formato perfeito para leitura no smartphone.',
                  sample: 'Fala meu querido! 🎉 Dia de comemorar! Bora marcar aquele churrasco pra comemorar? Parabéns demais! 🍻',
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{card.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">{card.desc}</p>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-100 text-xs italic text-slate-600 line-clamp-3">
                      "{card.sample}"
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenGenerator()}
                    className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    Gerar mensagem nesse estilo →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Reminders & Alerts */}
        {activeTab === 'reminders' && (
          <RemindersTab
            contacts={contacts}
            onGenerateMessage={handleOpenGenerator}
            onOpenGmail={handleOpenGmailModal}
            userEmail={user?.email || undefined}
            userName={user?.displayName || undefined}
          />
        )}

        {/* Tab 4: History */}
        {activeTab === 'history' && (
          <HistoryTab
            history={history}
            onClearHistory={() => {
              localStorage.removeItem('niversync_history_v1');
              setHistory([]);
              showToast('Histórico limpo com sucesso.', 'info');
            }}
          />
        )}
      </main>

      {/* Modals */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        editingContact={editingContact}
        isCalendarAuthenticated={!!user}
      />

      <MessageGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => {
          setIsGeneratorModalOpen(false);
          setGeneratorContact(null);
        }}
        selectedContact={generatorContact}
        contacts={contacts}
        onOpenGmail={(contact, msg, sub) => handleOpenGmailModal(contact, msg, sub)}
        onRecordHistory={handleRecordHistory}
        senderName={user?.displayName || ''}
      />

      <GmailSendModal
        isOpen={isGmailModalOpen}
        onClose={() => {
          setIsGmailModalOpen(false);
          setGmailContact(null);
        }}
        contact={gmailContact}
        initialMessage={gmailInitialMessage}
        initialSubject={gmailInitialSubject}
        senderName={user?.displayName || ''}
        onSuccess={handleGmailSuccess}
      />

      <CalendarSyncModal
        isOpen={isCalendarSyncOpen}
        onClose={() => setIsCalendarSyncOpen(false)}
        localContacts={contacts}
        onImportContacts={handleImportCalendarContacts}
        onUpdateContactCalendarId={handleUpdateContactCalendarId}
      />
    </div>
  );
}
