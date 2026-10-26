import React from 'react';
import { Product } from '../types/pharmacy';
import { DRUG_INFO, COMPANY_COLORS } from '../data/constants';
import { X, Plus, Gift, AlertTriangle, ShieldCheck, Pill } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onInspectBioscience?: (ingredientOrName: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onInspectBioscience,
}) => {
  if (!product) return null;

  const info = product.act ? DRUG_INFO[product.act] : undefined;
  const companyColor = COMPANY_COLORS[product.c] || '#1a5c6e';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-amber-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <Pill className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                {product.n}
              </h3>
              <span 
                className="inline-block text-[11px] font-bold text-white px-2 py-0.5 rounded-md mt-0.5"
                style={{ backgroundColor: companyColor }}
              >
                شركة {product.c}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-slate-700 text-sm">
          {/* Key specs grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-0.5">سعر الصيدلي</span>
              <span className="text-base font-black text-emerald-700">
                {product.p.toLocaleString('en-US')} ليرة
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-0.5">الفئة الطبية</span>
              <span className="text-sm font-bold text-slate-800">
                {product.cat}
              </span>
            </div>
            {product.act && (
              <div className="col-span-2 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                <span className="text-xs text-emerald-700 block mb-0.5">المادة الفعالة والتركيبة</span>
                <span className="text-sm font-bold text-emerald-950">
                  {product.act}
                </span>
              </div>
            )}
            {product.b && (
              <div className="col-span-2 bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-rose-600 block mb-0.5 flex items-center gap-1 font-semibold">
                    <Gift className="w-3.5 h-3.5" /> عرض البونص الرسمي
                  </span>
                  <span className="text-sm font-black text-rose-700">
                    بونص {product.b} (مجاني)
                  </span>
                </div>
                <span className="text-xs text-rose-800 bg-white px-2 py-1 rounded-md font-bold shadow-sm">
                  عرض معتمد
                </span>
              </div>
            )}
          </div>

          {/* Scientific Clinical info */}
          {info ? (
            <div className="space-y-3 pt-2">
              <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/50">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-1 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> دواعي الاستعمال والاستطبابات
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">{info.ind}</p>
              </div>

              <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/50">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-1 text-blue-800">
                  💊 الجرعة الاعتيادية وطريقة التناول
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">{info.dose}</p>
              </div>

              <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/50">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-1 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> الآثار الجانبية والمحاذير
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">{info.side}</p>
                {info.warn && (
                  <p className="text-xs text-rose-700 font-semibold mt-1 bg-rose-50 p-2 rounded-lg">
                    ⚠️ {info.warn}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
              يرجى مراجعة النشرة الطبية المرفقة مع المستحضر أو استشارة الصيدلاني للحصول على تفاصيل الجرعة والاستعمال.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {onInspectBioscience && (product.act || product.n) && (
            <button
              onClick={() => {
                onInspectBioscience(product.act || product.n);
                onClose();
              }}
              className="px-3 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-800 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>🔬 المستكشف الحيوي</span>
            </button>
          )}
          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-98 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة إلى مسودة الطلبية</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors text-xs sm:text-sm"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
