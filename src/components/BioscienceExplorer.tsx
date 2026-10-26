import React, { useState, useEffect } from 'react';
import { Product, OrderItem } from '../types/pharmacy';
import {
  FlaskConical,
  Search,
  ExternalLink,
  ShieldAlert,
  Dna,
  Atom,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface BioscienceExplorerProps {
  currentItems?: OrderItem[];
  availableProducts?: Product[];
  onAddProductToDraft?: (product: Product) => void;
}

interface PubChemData {
  cid: number;
  name: string;
  molecularFormula?: string;
  molecularWeight?: string;
  canonicalSmiles?: string;
  inChIKey?: string;
  xLogP?: number;
  tpsa?: number;
  hBondDonorCount?: number;
  hBondAcceptorCount?: number;
  rotatableBondCount?: number;
  complexity?: number;
  imageUrl?: string;
  lipinski?: {
    pass: boolean;
    violations: number;
  };
  veber?: {
    pass: boolean;
  };
  provenance: string;
}

interface OpenFdaData {
  drug: string;
  topReactions: Array<{ term: string; count: number }>;
  labelInfo?: {
    indications?: string;
    warnings?: string;
    contraindications?: string;
  };
  provenance: string;
}

interface ChemblData {
  chemblId: string;
  prefName: string;
  maxPhase: number;
  moleculeType: string;
  firstApproval?: number;
  mechanisms: Array<{
    mechanism: string;
    actionType: string;
    targetName: string;
  }>;
  provenance: string;
}

const PRESET_COMPOUNDS = [
  { ar: 'رابيبرازول', en: 'Rabeprazole', note: 'مثبط مضخة البروتون للمعدة' },
  { ar: 'أموكسيسيلين', en: 'Amoxicillin', note: 'مضاد حيوي واسع الطيف' },
  { ar: 'إيبوبروفين', en: 'Ibuprofen', note: 'مسكن ومضاد التهاب غير ستيرويدي' },
  { ar: 'أدابالين', en: 'Adapalene', note: 'رتينويد لعلاج حب الشباب' },
  { ar: 'باراسيتامول', en: 'Paracetamol', note: 'مسكن وخافض للحرارة' },
  { ar: 'ميتفورمين', en: 'Metformin', note: 'علاج السكري النمط الثاني' },
  { ar: 'أتورفاستاتين', en: 'Atorvastatin', note: 'خافض كوليسترول وستاتين' },
  { ar: 'غلوكوزامين', en: 'Glucosamine', note: 'مكمل لصحة الغضاريف والمفاصل' },
  { ar: 'سيتريزين', en: 'Cetirizine', note: 'مضاد هيستامين للحساسية' },
];

export const BioscienceExplorer: React.FC<BioscienceExplorerProps> = ({
  currentItems = [],
  availableProducts = [],
  onAddProductToDraft,
}) => {
  const [query, setQuery] = useState('Rabeprazole');
  const [activeTab, setActiveTab] = useState<'compound' | 'draft_scan' | 'fda_safety'>('compound');

  const [loading, setLoading] = useState(false);
  const [pubchemData, setPubchemData] = useState<PubChemData | null>(null);
  const [openfdaData, setOpenfdaData] = useState<OpenFdaData | null>(null);
  const [chemblData, setChemblData] = useState<ChemblData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [copiedSmiles, setCopiedSmiles] = useState(false);

  const fetchDrugScienceData = async (drugName: string) => {
    if (!drugName.trim()) return;
    setLoading(true);
    setError(null);
    setPubchemData(null);
    setOpenfdaData(null);
    setChemblData(null);

    try {
      // 1. Fetch PubChem
      const pcRes = await fetch(`/api/science/pubchem?q=${encodeURIComponent(drugName)}`);
      if (pcRes.ok) {
        const data = await pcRes.json();
        setPubchemData(data);
      } else {
        const err = await pcRes.json().catch(() => ({}));
        setError(err.error || 'لم يتم العثور على المركب في قاعدة بيانات PubChem');
      }

      // 2. Fetch openFDA in parallel
      fetch(`/api/science/openfda?q=${encodeURIComponent(drugName)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.error) setOpenfdaData(data);
        })
        .catch(() => {});

      // 3. Fetch ChEMBL
      fetch(`/api/science/chembl?q=${encodeURIComponent(drugName)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.error) setChemblData(data);
        })
        .catch(() => {});
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب البيانات الحيوية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugScienceData('Rabeprazole');
  }, []);

  const handleCopySmiles = (smiles?: string) => {
    if (!smiles) return;
    navigator.clipboard.writeText(smiles);
    setCopiedSmiles(true);
    setTimeout(() => setCopiedSmiles(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-l from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-teal-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-teal-500/30 text-teal-200 border border-teal-400/30 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-teal-300" />
                Science Skills Module (PubChem & ChEMBL & openFDA)
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-full border border-emerald-400/20">
                الحرائك والمعايير الحيوية
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              المستكشف الصيدلاني والحيوي - Bioscience Lab
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              تحليل كيميائي وسريري مباشر للمواد الفعالة في الأدوية: البنية الجزيئية 2D، صيغة التوافر الحيوي (Lipinski & Veber)، تقارير التيقظ الدوائي FAERS، وآلية التأثير الدوائي.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('compound')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'compound'
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              بحث مركب كيميائي
            </button>
            <button
              onClick={() => setActiveTab('draft_scan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'draft_scan'
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              فحص مسودة الطلبية ({currentItems.length})
            </button>
          </div>
        </div>

        {/* Quick pill bar */}
        <div className="mt-5 pt-4 border-t border-teal-800/60">
          <div className="text-xs text-teal-200/80 mb-2 font-medium">مركبات سريعة للتجربة الفورية:</div>
          <div className="flex flex-wrap gap-2">
            {PRESET_COMPOUNDS.map((c) => (
              <button
                key={c.en}
                onClick={() => {
                  setQuery(c.en);
                  fetchDrugScienceData(c.en);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-right ${
                  query.toLowerCase() === c.en.toLowerCase()
                    ? 'bg-teal-400 text-slate-950 font-bold border-teal-300 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                }`}
              >
                <span className="font-semibold">{c.ar}</span>
                <span className="text-[10px] opacity-75 mr-1 font-mono">({c.en})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'compound' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-3.5 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDrugScienceData(query)}
                placeholder="ابحث بالاسم العلمي أو الإنجليزي (مثل: Omeprazole, Paracetamol, Ibuprofen, Amoxicillin)..."
                className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-medium"
              />
            </div>
            <button
              onClick={() => fetchDrugScienceData(query)}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري جلب البيانات العلمية...
                </>
              ) : (
                <>
                  <Atom className="w-4 h-4" />
                  تحليل بيولوجي
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">تنبيه: </span>
                {error}
                <div className="text-xs text-amber-700 mt-1">
                  نصيحة: جرّب كتابة الاسم العلمي اللاتيني (مثل: Amoxicillin, Ibuprofen, Atorvastatin).
                </div>
              </div>
            </div>
          )}

          {pubchemData && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: 2D Structure & Identifiers */}
              <div className="lg:col-span-5 space-y-6">
                {/* 2D Molecular Image Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Atom className="w-4 h-4 text-teal-600" />
                      2D Chemical Structure Diagram
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      CID: {pubchemData.cid}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-center border border-slate-100 min-h-[260px]">
                    {pubchemData.imageUrl ? (
                      <img
                        src={pubchemData.imageUrl}
                        alt={`Structure of ${pubchemData.name}`}
                        className="max-h-60 object-contain mx-auto mix-blend-multiply"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">لا توجد صورة بنية متاحة</span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>مصدر البنية: PubChem PUG REST</span>
                    <a
                      href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemData.cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1"
                    >
                      فتح السجل في PubChem
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* SMILES & Formula Monograph */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-600" />
                    المعرفات الكيميائية الدقيقة
                  </h3>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      الصيغة الجزيئية (Molecular Formula)
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800 text-sm">
                      {pubchemData.molecularFormula || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      الوزن الجزيئي (Molecular Weight)
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-800 text-sm">
                      {pubchemData.molecularWeight ? `${pubchemData.molecularWeight} g/mol` : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-400">
                        Canonical SMILES
                      </label>
                      <button
                        onClick={() => handleCopySmiles(pubchemData.canonicalSmiles)}
                        className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                      >
                        {copiedSmiles ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            تم النسخ
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            نسخ الكود
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-slate-900 text-teal-300 font-mono text-xs p-2.5 rounded-lg break-all select-all dir-ltr text-left">
                      {pubchemData.canonicalSmiles || 'N/A'}
                    </div>
                  </div>

                  {pubchemData.inChIKey && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        InChIKey
                      </label>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-700 break-all dir-ltr text-left">
                        {pubchemData.inChIKey}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Physicochemical Properties & Drug-likeness & ChEMBL */}
              <div className="lg:col-span-7 space-y-6">
                {/* Lipinski Rule of 5 and Veber Assessment */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-teal-600" />
                      تقييم قابلية الدواء للامتصاص الفموي (Drug-Likeness)
                    </h3>
                    <div className="flex items-center gap-2">
                      {pubchemData.lipinski?.pass ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          مطابق لقاعدة ليبينسكي (Lipinski Ro5)
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-amber-600" />
                          تجاوز قاعدة ليبينسكي ({pubchemData.lipinski?.violations} مخالفات)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold">الوزن الجزيئي (MW)</div>
                      <div className="text-base font-black text-slate-800 mt-1 font-mono">
                        {pubchemData.molecularWeight || '--'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">الحد الأقصى: ≤ 500</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold">معامل التقسيم (XLogP)</div>
                      <div className="text-base font-black text-slate-800 mt-1 font-mono">
                        {pubchemData.xLogP !== undefined ? pubchemData.xLogP : '--'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">الحد الأقصى: ≤ 5</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold">مانحو الروابط (HBD)</div>
                      <div className="text-base font-black text-slate-800 mt-1 font-mono">
                        {pubchemData.hBondDonorCount !== undefined ? pubchemData.hBondDonorCount : '--'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">الحد الأقصى: ≤ 5</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold">مستقبلو الروابط (HBA)</div>
                      <div className="text-base font-black text-slate-800 mt-1 font-mono">
                        {pubchemData.hBondAcceptorCount !== undefined ? pubchemData.hBondAcceptorCount : '--'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">الحد الأقصى: ≤ 10</div>
                    </div>
                  </div>

                  {/* Veber Rules Bar */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                    <div className="flex items-center gap-4">
                      <span>
                        المساحة السطحية القطبية (TPSA):{' '}
                        <strong className="font-mono text-slate-900">{pubchemData.tpsa || '--'} Å²</strong> (شرط فيبر: ≤ 140)
                      </span>
                      <span>
                        الروابط القابلة للدوران:{' '}
                        <strong className="font-mono text-slate-900">{pubchemData.rotatableBondCount ?? '--'}</strong> (شرط فيبر: ≤ 10)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {pubchemData.veber?.pass ? '✓ توافر حيوي فموي ممتاز' : '! توافر حيوي محدود'}
                    </span>
                  </div>
                </div>

                {/* ChEMBL Mechanism & Clinical Phase */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-600" />
                      آلية التأثير البيولوجي والمرحلة السريرية (ChEMBL)
                    </h3>
                    {chemblData?.chemblId && (
                      <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded font-bold">
                        {chemblData.chemblId}
                      </span>
                    )}
                  </div>

                  {chemblData ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-xs bg-slate-100 px-3 py-1 rounded-lg">
                          المرحلة السريرية:{' '}
                          <strong className="text-teal-800">
                            {chemblData.maxPhase === 4 ? 'دواء معتمد ومسجل (Phase 4 Approved)' : `مرحلة سريرية: ${chemblData.maxPhase}`}
                          </strong>
                        </div>
                        {chemblData.moleculeType && (
                          <div className="text-xs bg-slate-100 px-3 py-1 rounded-lg">
                            نوع الجزيء: <strong className="text-slate-700">{chemblData.moleculeType}</strong>
                          </div>
                        )}
                        {chemblData.firstApproval && (
                          <div className="text-xs bg-slate-100 px-3 py-1 rounded-lg">
                            أول ترخيص عالمي: <strong className="text-slate-700">{chemblData.firstApproval}</strong>
                          </div>
                        )}
                      </div>

                      {chemblData.mechanisms && chemblData.mechanisms.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          <div className="text-xs font-bold text-slate-500">الآليات الموثقة للهدف البيولوجي (Target Mechanism):</div>
                          {chemblData.mechanisms.map((m, idx) => (
                            <div key={idx} className="bg-teal-50/70 border border-teal-100 p-2.5 rounded-xl text-xs text-teal-950">
                              <span className="font-bold text-teal-800">{m.actionType || 'تأثير'}: </span>
                              {m.mechanism}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                          تم توثيق هذا المركب كدواء مرخص ومسجل تجارياً.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 py-2">جاري فحص قاعدة ChEMBL أو لم يتم ربط المعرف...</div>
                  )}
                </div>

                {/* openFDA Safety & FAERS Adverse Events */}
                {openfdaData && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        التيقظ الدوائي والآثار الجانبية الأكثر إبلاغاً (openFDA FAERS)
                      </h3>
                      <span className="text-[11px] text-slate-400">تقارير السلامة الرسمية</span>
                    </div>

                    {openfdaData.topReactions && openfdaData.topReactions.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs text-slate-600">أكثر التفاعلات العكسية المرصودة إحصائياً:</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {openfdaData.topReactions.map((r, i) => (
                            <div key={i} className="bg-amber-50/60 border border-amber-100 rounded-lg p-2 text-center">
                              <div className="text-xs font-bold text-slate-800 truncate" title={r.term}>
                                {r.term}
                              </div>
                              <div className="text-[10px] text-amber-700 font-mono mt-0.5">{r.count.toLocaleString()} بلاغ</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">لا توجد بلاغات حرجة استثنائية مسجلة في بيانات FAERS الأخيرة.</div>
                    )}

                    {openfdaData.labelInfo?.warnings && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-950 mt-2">
                        <span className="font-bold text-rose-800 block mb-1">تحذيرات الاستخدام والنشرة الطبية (Label Warnings):</span>
                        <p className="line-clamp-3 text-[11px] leading-relaxed text-slate-700">
                          {openfdaData.labelInfo.warnings}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Draft Items Scientific Scanner */}
      {activeTab === 'draft_scan' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Dna className="w-5 h-5 text-teal-600" />
                المسح الحيوي والكيميائي لمسودة الطلبية الحالية
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                فحص المواد الفعالة في الأدوية المضافة لمسودتك للتحقق من التنوع العلاجي والخواص الصيدلانية.
              </p>
            </div>
            <span className="bg-teal-50 text-teal-800 text-xs px-3 py-1 rounded-full font-bold">
              {currentItems.length} أصناف في المسودة
            </span>
          </div>

          {currentItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FlaskConical className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold">المسودة الحالية فارغة حالياً</p>
              <p className="text-xs text-slate-400 mt-1">أضف أدوية من الكتالوج لفحصها كيميائياً وصيدلانياً هنا بنقرة واحدة.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 hover:bg-teal-50/40 transition-all border border-slate-200 hover:border-teal-300 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                      <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded font-mono shrink-0">
                        الكمية: {item.quantity}
                      </span>
                    </div>

                    <div className="mt-2 text-xs space-y-1">
                      <div className="text-teal-700 font-semibold flex items-center gap-1">
                        <Atom className="w-3.5 h-3.5" />
                        المادة الفعالة: {item.activeIngredient || 'غير محددة بدقة'}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        الشركة المصنعة: {item.company} | البونص: {item.bonus}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const ing = item.activeIngredient || item.name;
                        setQuery(ing);
                        setActiveTab('compound');
                        fetchDrugScienceData(ing);
                      }}
                      className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      تحليل المادة كيميائياً
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(item.unitPrice * item.quantity).toLocaleString()} ل.س
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
