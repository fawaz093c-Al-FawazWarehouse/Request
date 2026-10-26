import React, { useState } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  Sparkles,
  RefreshCw,
  BookmarkCheck,
  Building2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { OrderDraft } from '../types/pharmacy';

interface GroundedSearchSectionProps {
  currentDraft?: OrderDraft;
}

interface GroundingSource {
  title: string;
  url: string;
}

const PRESET_GROUNDED_QUERIES = [
  'أحدث تعاميم ونشرات أسعار الأدوية والمضادات الصادرة في سوريا',
  'أحدث تحذيرات هيئة الغذاء والدواء FDA لمثبطات مضخة البروتون PPIs',
  'بدائل دواء رابيبرازول في حال انقطاعه من السوق',
  'بروتوكول علاج H. Pylori المحدث 2024 والجرعات الدقيقة',
  'هل يسبب استخدام الأيبوبروفين مع المضادات الحيوية مشاكل كلوية؟',
];

export const GroundedSearchSection: React.FC<GroundedSearchSectionProps> = ({ currentDraft }) => {
  const [query, setQuery] = useState(PRESET_GROUNDED_QUERIES[0]);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (targetQuery?: string) => {
    const q = (targetQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    const context = currentDraft
      ? `الصيدلية: ${currentDraft.pharmacyName}، الأصناف الحالية في المسودة: ${currentDraft.items
          .map((i) => `${i.name} (كمية ${i.quantity})`)
          .join('، ')}`
      : undefined;

    try {
      const res = await fetch('/api/gemini/grounded-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q, context }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'تعذر جلب نتائج البحث الموثقة');
      }

      const data = await res.json();
      setResultText(data.text);
      setSources(data.sources || []);
      setSearchQueries(data.searchQueries || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ في استعلام البحث المباشر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-l from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-blue-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-300" />
              Google Search Grounding
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full border border-indigo-400/20 font-mono">
              gemini-3.8-flash (with googleSearch tool)
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            استعلام الويب الصيدلاني الموثق والمحدث
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            احصل على إجابات حية ومحدثة ومطابقة لأحدث بيانات محرك بحث Google: أسعار الأدوية، قرارات وزارة الصحة، التوفر، البدائل، والبروتوكولات السريرية مع روابط ومصادر موثقة.
          </p>

          {/* Quick presets */}
          <div className="mt-4 pt-4 border-t border-blue-800/60">
            <div className="text-xs text-blue-200/80 mb-2 font-medium">استفسارات مقترحة بنقرة واحدة:</div>
            <div className="flex flex-wrap gap-2">
              {PRESET_GROUNDED_QUERIES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(preset);
                    handleSearch(preset);
                  }}
                  className="text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition-all text-right"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-3.5 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="اكتب استفسارك الصيدلاني المباشر للتحقق من Google Search..."
            className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              جاري البحث والتحقق من الويب...
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              بحث موثق في الويب
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {resultText && (
        <div className="space-y-6">
          {/* Main Grounded Answer Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <Sparkles className="w-5 h-5 text-blue-600" />
                الإجابة المستندة إلى مصادر الويب الحية (Google Grounded)
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <BookmarkCheck className="w-3.5 h-3.5" />
                تم التوثيق والمطابقة
              </span>
            </div>

            {/* Generated Text */}
            <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-line font-normal">
              {resultText}
            </div>

            {/* Queries used */}
            {searchQueries.length > 0 && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">عمليات البحث التي نفذها النموذج:</span>
                {searchQueries.map((sq, i) => (
                  <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
                    "{sq}"
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Source Citations */}
          {sources.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Globe className="w-4 h-4 text-blue-600" />
                المصادر والمراجع الطبية المستشهد بها ({sources.length}):
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-blue-50/50 transition-all border border-slate-200 hover:border-blue-300 rounded-xl p-3 flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 line-clamp-2">
                      {src.title}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-blue-600">
                      <span className="truncate max-w-[180px] font-mono dir-ltr text-left">
                        {new URL(src.url, 'http://localhost').hostname}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
