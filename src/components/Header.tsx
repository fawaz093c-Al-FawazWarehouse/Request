import React from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  ShoppingCart,
  LogOut,
  CheckCircle,
  FileText,
  Phone,
  Award,
  BarChart3,
  FlaskConical,
  Bot,
  Globe,
  Mic,
  Cloud,
} from 'lucide-react';
import { REPRESENTER } from '../data/constants';

export type AppTab =
  | 'catalog'
  | 'draft'
  | 'drafts_list'
  | 'drive_sheets'
  | 'dashboard'
  | 'bioscience'
  | 'gemini_chat'
  | 'grounded_search';

interface HeaderProps {
  user: User | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  cartCount: number;
  totalUnits: number;
  onOpenVoiceAssistant: () => void;
  isFirestoreConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isLoggingIn,
  onLogin,
  onLogout,
  activeTab,
  setActiveTab,
  cartCount,
  onOpenVoiceAssistant,
  isFirestoreConnected = true,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#062014]/95 backdrop-blur-md border-b border-[#c9a227]/30 shadow-lg text-white">
      {/* Top Banner with Rep & Warehouse details */}
      <div className="bg-gradient-to-r from-[#062014] via-[#0a3320] to-[#062014] px-4 py-1.5 text-xs border-b border-[#c9a227]/20 flex flex-wrap justify-between items-center text-slate-300">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Award className="w-3.5 h-3.5" />
            مستودع الفواز للأدوية البشرية
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline">حيث تبدأ الثقة ولا تنتهي الخدمة</span>
          <span className="hidden md:flex items-center gap-1 text-[11px] text-teal-300/90 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/20">
            <Cloud className="w-3 h-3 text-teal-400" />
            قاعدة Firestore & مصادقة Google نشطة
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-300 font-semibold">
            <Phone className="w-3 h-3" />
            المندوب المعتمد: {REPRESENTER.name} ({REPRESENTER.phone})
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Warehouse Title */}
        <div onClick={() => setActiveTab('catalog')} className="flex items-center gap-2.5 cursor-pointer group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12523d] to-[#062014] border border-[#c9a227]/50 flex items-center justify-center shadow-inner text-amber-400 font-black text-xl group-hover:scale-105 transition-transform">
            💊
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              مستودع الفواز للأدوية
            </h1>
            <p className="text-[11px] text-slate-400">
              المنصة الذكية لإدارة ومزامنة الطلبيات مع العلوم الحيوية والذكاء الاصطناعي
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#0a3320]/70 p-1 rounded-xl border border-white/10 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            الكتالوج (726)
          </button>

          <button
            onClick={() => setActiveTab('draft')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'draft'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            المسودة
            {cartCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('bioscience')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'bioscience'
                ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                : 'text-teal-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-teal-300" />
            المستكشف الحيوي
          </button>

          <button
            onClick={() => setActiveTab('gemini_chat')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'gemini_chat'
                ? 'bg-indigo-500 text-white shadow-md font-black'
                : 'text-indigo-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-300" />
            مساعد Gemini
          </button>

          <button
            onClick={() => setActiveTab('grounded_search')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'grounded_search'
                ? 'bg-blue-600 text-white shadow-md font-black'
                : 'text-blue-200 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-300" />
            بحث موثق
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
            الإحصائيات
          </button>

          <button
            onClick={() => setActiveTab('drafts_list')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              activeTab === 'drafts_list'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            المسودات
          </button>

          <button
            onClick={() => setActiveTab('drive_sheets')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              activeTab === 'drive_sheets'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Sheets
          </button>
        </nav>

        {/* Right Section: Live Voice Assistant Button + User Login / Firestore + Cart */}
        <div className="flex items-center gap-2">
          {/* Live Voice API Button */}
          <button
            onClick={onOpenVoiceAssistant}
            className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs shadow-lg transition-transform active:scale-95 animate-pulse"
            title="محادثة صوتية فورية مع المساعد الصوتي (gemini-3.8-live)"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">صوت مباشر (Live)</span>
          </button>

          {/* User & Auth & Firestore Status */}
          {user ? (
            <div className="flex items-center gap-2 bg-[#0d452d]/80 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline max-w-[110px] truncate" title={user.email || user.displayName || ''}>
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="hidden lg:inline text-[9px] text-teal-200 bg-teal-900/80 px-1.5 py-0.5 rounded font-mono">
                  Firestore
                </span>
              </div>
              <button
                onClick={onLogout}
                title="تسجيل الخروج من حساب Google"
                className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-xl text-xs shadow-md transition-all border border-slate-300 hover:shadow-lg disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isLoggingIn ? 'جاري الاتصال...' : 'تسجيل Google & Firestore'}</span>
            </button>
          )}

          {/* Cart Icon button */}
          <button
            onClick={() => setActiveTab('draft')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs shadow-md transition-transform active:scale-95"
            aria-label="عرض مسودة الطلبية"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">الطلبية</span>
            <span className="bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-full text-[11px] font-bold">
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Bar for Small & Medium Screens */}
      <div className="xl:hidden flex items-center justify-around bg-[#062014] border-t border-white/10 px-2 py-1.5 text-xs overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-2 py-1 rounded whitespace-nowrap ${activeTab === 'catalog' ? 'text-amber-400 font-bold bg-white/5' : 'text-slate-400'}`}
        >
          الكتالوج
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 ${activeTab === 'draft' ? 'text-amber-400 font-bold bg-white/5' : 'text-slate-400'}`}
        >
          <span>المسودة</span>
          {cartCount > 0 && <span className="bg-red-600 text-white px-1 rounded-full text-[10px]">{cartCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('bioscience')}
          className={`px-2 py-1 rounded whitespace-nowrap text-teal-300 font-bold ${activeTab === 'bioscience' ? 'bg-teal-900/60' : ''}`}
        >
          العلوم الحيوية
        </button>
        <button
          onClick={() => setActiveTab('gemini_chat')}
          className={`px-2 py-1 rounded whitespace-nowrap text-indigo-300 font-bold ${activeTab === 'gemini_chat' ? 'bg-indigo-900/60' : ''}`}
        >
          مساعد Gemini
        </button>
        <button
          onClick={() => setActiveTab('grounded_search')}
          className={`px-2 py-1 rounded whitespace-nowrap text-blue-300 font-bold ${activeTab === 'grounded_search' ? 'bg-blue-900/60' : ''}`}
        >
          بحث موثق
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2 py-1 rounded whitespace-nowrap ${activeTab === 'dashboard' ? 'text-amber-400 font-bold bg-white/5' : 'text-slate-400'}`}
        >
          الإحصائيات
        </button>
        <button
          onClick={() => setActiveTab('drafts_list')}
          className={`px-2 py-1 rounded whitespace-nowrap ${activeTab === 'drafts_list' ? 'text-amber-400 font-bold bg-white/5' : 'text-slate-400'}`}
        >
          المسودات
        </button>
        <button
          onClick={() => setActiveTab('drive_sheets')}
          className={`px-2 py-1 rounded whitespace-nowrap text-emerald-400 ${activeTab === 'drive_sheets' ? 'font-bold bg-white/5' : ''}`}
        >
          Drive
        </button>
      </div>
    </header>
  );
};
