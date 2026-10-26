import React from 'react';
import { OrderDraft } from '../types/pharmacy';
import { calculateOrderSummary, formatCurrency } from '../utils/orderCalculations';
import { FileText, Plus, Trash2, Calendar, CheckCircle2, ExternalLink } from 'lucide-react';

interface SavedDraftsModalProps {
  drafts: OrderDraft[];
  currentDraftId: string;
  onSelectDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  onCreateNewDraft: () => void;
}

export const SavedDraftsModal: React.FC<SavedDraftsModalProps> = ({
  drafts,
  currentDraftId,
  onSelectDraft,
  onDeleteDraft,
  onCreateNewDraft,
}) => {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              سجل المسودات المحفوظة ({drafts.length})
            </h2>
            <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
              سحابي Firestore
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            مسوداتك مخزنة محلياً ومتزامنة سحابياً مع قاعدة بيانات Firestore لحسابك
          </p>
        </div>
        <button
          onClick={onCreateNewDraft}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء مسودة جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drafts.map((d) => {
          const isCurrent = d.id === currentDraftId;
          const summary = calculateOrderSummary(d.items, d.discountPercent);
          const dateStr = new Date(d.updatedAt || d.createdAt).toLocaleDateString('ar-SY');

          return (
            <div
              key={d.id}
              onClick={() => onSelectDraft(d.id)}
              className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                  : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-extrabold text-slate-900 text-sm truncate">
                    {d.pharmacyName || 'مسودة بدون اسم'}
                  </span>
                  {isCurrent && (
                    <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      المسودة النشطة
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 space-y-1 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>آخر تحديث: {dateStr}</span>
                  </div>
                  {d.pharmacistName && <div>الصيدلاني: {d.pharmacistName}</div>}
                  {d.notes && <div className="italic truncate">ملاحظة: {d.notes}</div>}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>عدد الأصناف:</span>
                    <span className="font-bold">{summary.totalItemsCount} صنف</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>إجمالي العلب:</span>
                    <span className="font-bold">{summary.totalUnitsAll} علبة</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-extrabold pt-1 border-t border-slate-200">
                    <span>المجموع:</span>
                    <span>{formatCurrency(summary.grandTotal)}</span>
                  </div>
                </div>

                {d.googleSheetUrl && (
                  <div className="mt-2 text-[11px] text-teal-700 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    <span>محفوظة في Google Sheets</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDraft(d.id);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                >
                  فتح وتعديل المسودة ←
                </button>
                {drafts.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`هل أنت متأكد من حذف مسودة "${d.pharmacyName || 'الطلبية'}"؟`)) {
                        onDeleteDraft(d.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title="حذف المسودة"
                    aria-label="حذف المسودة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
