import React, { useState, useMemo, useRef } from 'react';
import { Product } from '../types/pharmacy';
import { RAW_PRODUCTS } from '../data/products';
import { COMPANY_COLORS, CATEGORY_ICONS } from '../data/constants';
import { Search, Gift, Info, Plus, RotateCcw, Building2, Mic, MicOff, Volume2 } from 'lucide-react';

interface CatalogSectionProps {
  onAddToCart: (product: Product, quantity?: number) => void;
  onOpenDetail: (product: Product) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  onAddToCart,
  onOpenDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [bonusOnly, setBonusOnly] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  // Voice Search State
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef<any>(null);

  // Extract companies and categories for filter dropdowns
  const companies = useMemo(() => {
    return Array.from(new Set(RAW_PRODUCTS.map((p) => p.c))).sort();
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(RAW_PRODUCTS.map((p) => p.cat))).filter(
      (c) => c && c !== 'أخرى'
    );
    return ['الكل', ...cats.sort(), 'أخرى'];
  }, []);

  // Voice Recognition Handler
  const handleToggleVoiceSearch = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError('البحث الصوتي غير مدعوم في هذا المتصفح. جرب متصفح Chrome.');
      setTimeout(() => setVoiceError(''), 3500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'ar-SA';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError('');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          // Clean transcript and update search term
          const cleaned = transcript.trim();
          setSearchTerm(cleaned);
          setPage(1);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError('يرجى السماح بالوصول إلى الميكروفون لاستخدام البحث الصوتي');
        } else if (event.error === 'no-speech') {
          setVoiceError('لم يتم التقاط أي صوت، حاول التحدث مرة أخرى');
        } else {
          setVoiceError('حدث خطأ أثناء التعرف على الصوت');
        }
        setTimeout(() => setVoiceError(''), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      setVoiceError('تعذر بدء التعرف على الصوت');
      setTimeout(() => setVoiceError(''), 3500);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return RAW_PRODUCTS.filter((p) => {
      if (q) {
        const matchName = p.n.toLowerCase().includes(q);
        const matchCompany = p.c.toLowerCase().includes(q);
        const matchAct = (p.act || '').toLowerCase().includes(q);
        if (!matchName && !matchCompany && !matchAct) return false;
      }
      if (selectedCompany && p.c !== selectedCompany) return false;
      if (selectedCategory && selectedCategory !== 'الكل' && p.cat !== selectedCategory) return false;
      if (bonusOnly && !p.b) return false;
      return true;
    });
  }, [searchTerm, selectedCompany, selectedCategory, bonusOnly]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = filteredProducts.slice(0, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCompany('');
    setSelectedCategory('');
    setBonusOnly(false);
    setPage(1);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <section className="space-y-6" dir="rtl">
      {/* Search & Filter Header Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar with Voice search integration */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isListening ? 'جارٍ الاستماع... انطق اسم الدواء الآن' : 'ابحث عن دواء، مادة فعالة، أو شركة موردة...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className={`w-full pr-10 pl-20 py-2.5 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 font-medium transition-all ${
                isListening
                  ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/40 text-rose-900 placeholder:text-rose-500 font-bold'
                  : 'border-slate-200 focus:ring-emerald-500'
              }`}
            />

            {/* Voice & Clear Buttons */}
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1"
                >
                  مسح
                </button>
              )}
              {/* Voice Search Button */}
              <button
                type="button"
                onClick={handleToggleVoiceSearch}
                title={isListening ? 'إيقاف الاستماع الصوتي' : 'بحث صوتي باسم الدواء باللغة العربية'}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-md'
                    : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
                aria-label="البحث الصوتي"
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 text-white" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Company filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="">جميع الشركات ({companies.length})</option>
              {companies.map((co) => (
                <option key={co} value={co}>
                  {co} ({RAW_PRODUCTS.filter((x) => x.c === co).length})
                </option>
              ))}
            </select>

            {/* Bonus only toggle */}
            <label className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/80 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors select-none">
              <input
                type="checkbox"
                checked={bonusOnly}
                onChange={(e) => {
                  setBonusOnly(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
              />
              <Gift className="w-3.5 h-3.5 text-rose-600" />
              <span>عروض البونص فقط</span>
            </label>
          </div>
        </div>

        {/* Voice Search Active Banner */}
        {isListening && (
          <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>🎙️ جارٍ الاستماع... انطق اسم المستحضر الدوائي باللغة العربية الآن</span>
            </div>
            <button
              onClick={handleToggleVoiceSearch}
              className="text-[11px] underline text-rose-900 font-bold"
            >
              إلغاء
            </button>
          </div>
        )}

        {/* Voice Search Error Banner */}
        {voiceError && (
          <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-bold flex items-center gap-2">
            <span>⚠️ {voiceError}</span>
          </div>
        )}

        {/* Category Chips Bar */}
        <div className="flex gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
          {categories.map((cat) => {
            const isSelected = (!selectedCategory && cat === 'الكل') || selectedCategory === cat;
            const count =
              cat === 'الكل'
                ? RAW_PRODUCTS.length
                : RAW_PRODUCTS.filter((x) => x.cat === cat).length;
            const icon = CATEGORY_ICONS[cat] || '💊';

            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat === 'الكل' ? '' : cat);
                  setPage(1);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>{icon}</span>
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 text-xs text-slate-500">
          <div>
            تم العثور على <strong className="text-emerald-700 font-bold">{filteredProducts.length}</strong> صنف دوائي متاح
          </div>
          {(searchTerm || selectedCompany || selectedCategory || bonusOnly) && (
            <button
              onClick={resetFilters}
              className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paginatedProducts.map((p) => {
          const compColor = COMPANY_COLORS[p.c] || '#1a5c6e';
          const icon = CATEGORY_ICONS[p.cat] || '💊';

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-amber-300"
            >
              <div className="p-4">
                {/* Top tags */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span
                    className="text-[10px] font-bold text-white px-2 py-0.5 rounded-md flex items-center gap-1"
                    style={{ backgroundColor: compColor }}
                  >
                    <Building2 className="w-2.5 h-2.5" />
                    {p.c}
                  </span>
                  {p.b ? (
                    <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <Gift className="w-2.5 h-2.5 text-rose-600" />
                      بونص {p.b}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {icon} {p.cat}
                    </span>
                  )}
                </div>

                {/* Medicine Name */}
                <h3 className="font-extrabold text-slate-900 text-sm leading-snug min-h-[38px] group-hover:text-emerald-900 transition-colors">
                  {p.n}
                </h3>

                {/* Active ingredient */}
                {p.act ? (
                  <p className="text-[11px] text-slate-500 font-medium mt-1 truncate" title={p.act}>
                    🔬 {p.act}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 font-normal mt-1 italic">
                    مستحضر صيدلاني نوعي
                  </p>
                )}

                {/* Price Display */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">سعر الصيدلي:</span>
                  <div className="text-base font-black text-emerald-800 font-mono">
                    {p.p.toLocaleString('en-US')}{' '}
                    <span className="text-[11px] text-slate-500 font-sans font-normal">ليرة</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => onAddToCart(p)}
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>أضف للمسودة</span>
                </button>
                <button
                  onClick={() => onOpenDetail(p)}
                  title="عرض التفاصيل العلمية والجرعات"
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold p-2 rounded-xl text-xs flex items-center justify-center transition-colors"
                  aria-label="عرض التفاصيل"
                >
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {paginatedProducts.length < filteredProducts.length && (
        <div className="text-center pt-4">
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="bg-white hover:bg-slate-50 text-slate-800 border-2 border-emerald-700/80 font-bold px-8 py-2.5 rounded-full text-xs shadow-sm transition-transform active:scale-95"
          >
            عرض المزيد من الأصناف ({filteredProducts.length - paginatedProducts.length} صنف متبقٍ) ↓
          </button>
        </div>
      )}
    </section>
  );
};
