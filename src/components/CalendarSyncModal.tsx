import React, { useState, useEffect } from 'react';
import { BirthdayContact } from '../types';
import {
  Calendar,
  RefreshCw,
  Check,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  AlertCircle,
  CalendarCheck,
} from 'lucide-react';
import {
  fetchCalendarEvents,
  createGoogleCalendarBirthday,
} from '../services/googleWorkspace';
import { getAccessToken } from '../services/auth';

interface CalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  localContacts: BirthdayContact[];
  onImportContacts: (newContacts: BirthdayContact[]) => void;
  onUpdateContactCalendarId: (contactId: string, eventId: string) => void;
}

export const CalendarSyncModal: React.FC<CalendarSyncModalProps> = ({
  isOpen,
  onClose,
  localContacts,
  onImportContacts,
  onUpdateContactCalendarId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<BirthdayContact[]>([]);
  const [selectedToImport, setSelectedToImport] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedCount, setExportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleLoadCalendarEvents();
    }
  }, [isOpen]);

  const handleLoadCalendarEvents = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Você precisa estar conectado à sua Conta Google para sincronizar.');
      }

      const events = await fetchCalendarEvents(token);
      setCalendarEvents(events);
      // Auto-select those not yet in localContacts by name
      const localNames = new Set(localContacts.map((c) => c.name.toLowerCase()));
      const newItems = events.filter((e) => !localNames.has(e.name.toLowerCase()));
      setSelectedToImport(newItems.map((e) => e.id));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Falha ao buscar eventos do Google Calendar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedToImport((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleImportSelected = () => {
    const toImport = calendarEvents.filter((e) => selectedToImport.includes(e.id));
    if (toImport.length === 0) return;
    onImportContacts(toImport);
    setSuccessMsg(`${toImport.length} aniversário(s) importado(s) com sucesso para o NiverSync!`);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleExportAllToCalendar = async () => {
    const unexported = localContacts.filter((c) => !c.googleEventId);
    if (unexported.length === 0) {
      setSuccessMsg('Todos os seus contatos locais já estão sincronizados no Google Calendar!');
      return;
    }

    const confirmed = window.confirm(
      `Deseja adicionar ${unexported.length} aniversariante(s) como eventos anuais no seu Google Calendar?`
    );
    if (!confirmed) return;

    setIsExporting(true);
    setError(null);
    let count = 0;

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Token Google indisponível.');

      for (const contact of unexported) {
        try {
          const eventId = await createGoogleCalendarBirthday(token, contact);
          onUpdateContactCalendarId(contact.id, eventId);
          count++;
          setExportedCount(count);
        } catch (e) {
          console.error(`Failed to export ${contact.name}:`, e);
        }
      }

      setSuccessMsg(`${count} aniversários foram sincronizados no seu Google Calendar!`);
    } catch (err: any) {
      setError(err?.message || 'Erro durante a exportação.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base sm:text-lg">Sincronização Google Calendar</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Sync actions bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <ArrowDownToLine className="w-4 h-4 text-indigo-600" />
                  Importar do Calendar
                </span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Encontra eventos de aniversário na sua agenda Google para adicionar ao NiverSync.
                </p>
              </div>
              <button
                onClick={handleLoadCalendarEvents}
                disabled={isLoading}
                className="mt-3 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Buscando...' : 'Atualizar Lista da Agenda'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <ArrowUpFromLine className="w-4 h-4 text-purple-600" />
                  Exportar para o Calendar
                </span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Adiciona seus aniversariantes locais do NiverSync como eventos anuais no Google Calendar.
                </p>
              </div>
              <button
                onClick={handleExportAllToCalendar}
                disabled={isExporting}
                className="mt-3 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                {isExporting ? `Sincronizando (${exportedCount})...` : 'Exportar Contatos Locais'}
              </button>
            </div>
          </div>

          {/* List of found calendar events */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Aniversários Encontrados no seu Google Calendar ({calendarEvents.length})
              </h4>
              {calendarEvents.length > 0 && (
                <button
                  onClick={() =>
                    setSelectedToImport(
                      selectedToImport.length === calendarEvents.length
                        ? []
                        : calendarEvents.map((e) => e.id)
                    )
                  }
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  {selectedToImport.length === calendarEvents.length
                    ? 'Desmarcar Todos'
                    : 'Marcar Todos'}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                <p className="text-xs font-medium">Lendo sua agenda do Google Calendar...</p>
              </div>
            ) : calendarEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Nenhum evento de aniversário identificado automaticamente no Calendar.
                <br />
                (Dica: eventos com nome "Aniversário de [Nome]" ou na agenda "Aniversários").
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {calendarEvents.map((event) => {
                  const isSelected = selectedToImport.includes(event.id);
                  const alreadyLocal = localContacts.some(
                    (c) => c.name.toLowerCase() === event.name.toLowerCase()
                  );

                  return (
                    <div
                      key={event.id}
                      onClick={() => handleToggleSelect(event.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/60'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent div
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{event.name}</p>
                          <p className="text-slate-500 text-[11px]">
                            {event.birthDay}/{event.birthMonth}
                            {alreadyLocal && (
                              <span className="ml-2 text-amber-600 font-medium">
                                (já cadastrado localmente)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                        Calendar
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            {selectedToImport.length} selecionado(s)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handleImportSelected}
              disabled={selectedToImport.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Importar Selecionados para o NiverSync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
