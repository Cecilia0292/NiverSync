import React from 'react';
import { User } from 'firebase/auth';
import {
  Calendar,
  Sparkles,
  Bell,
  LogOut,
  CalendarCheck,
  RefreshCw,
  Gift,
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSync: () => void;
  todayCount: number;
  upcomingCount: number;
  activeTab: 'contacts' | 'generator' | 'history' | 'reminders';
  setActiveTab: (tab: 'contacts' | 'generator' | 'history' | 'reminders') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isLoggingIn,
  onLogin,
  onLogout,
  onOpenSync,
  todayCount,
  upcomingCount,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  Niver<span className="text-indigo-600">Sync</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200/60">
                  Google Calendar & WhatsApp
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Mensagens inteligentes e lembretes automáticos
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'contacts'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Aniversários
              {todayCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                  {todayCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'generator'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Gerador com IA
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'reminders'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Lembretes
              {upcomingCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {upcomingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Histórico
            </button>
          </nav>

          {/* Right Area: Google Auth & Sync */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenSync}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                  title="Sincronizar com o Google Calendar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sincronizar Calendar
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuário'}
                      className="w-8 h-8 rounded-full border border-slate-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.displayName || 'Conectado'}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[140px]">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Desconectar"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-all disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                {isLoggingIn ? 'Conectando...' : 'Entrar com Google'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Submenu Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-2 py-1 text-xs font-medium rounded-md ${
              activeTab === 'contacts' ? 'text-indigo-600 font-bold' : 'text-slate-600'
            }`}
          >
            Aniversários {todayCount > 0 && `(${todayCount})`}
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-2 py-1 text-xs font-medium rounded-md ${
              activeTab === 'generator' ? 'text-indigo-600 font-bold' : 'text-slate-600'
            }`}
          >
            Gerador IA
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-2 py-1 text-xs font-medium rounded-md ${
              activeTab === 'reminders' ? 'text-indigo-600 font-bold' : 'text-slate-600'
            }`}
          >
            Lembretes
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-2 py-1 text-xs font-medium rounded-md ${
              activeTab === 'history' ? 'text-indigo-600 font-bold' : 'text-slate-600'
            }`}
          >
            Histórico
          </button>
        </div>
      </div>
    </header>
  );
};
