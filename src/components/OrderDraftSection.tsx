import React, { useState } from 'react';
import { OrderDraft, OrderItem } from '../types/pharmacy';
import { calculateOrderSummary, formatCurrency, formatWhatsAppMessage, downloadDraftAsCSV } from '../utils/orderCalculations';
import { REPRESENTER } from '../data/constants';
import {
  Trash2,
  Printer,
  Share2,
  FileSpreadsheet,
  PlusCircle,
  Save,
  Gift,
  Phone,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MessageSquareShare,
  Download,
} from 'lucide-react';

interface OrderDraftSectionProps {
  draft: OrderDraft;
  onUpdateDraft: (draft: OrderDraft) => void;
  onSaveNewDraft: () => void;
  onClearDraft: () => void;
  onOpenCustomItemModal: () => void;
  onExportToGoogleSheets: () => void;
  isExportingToSheets: boolean;
  sheetsExportSuccessUrl?: string;
  isGoogleAuthenticated: boolean;
  onPromptGoogleLogin: () => void;
}

export const OrderDraftSection: React.FC<OrderDraftSectionProps> = ({
  draft,
  onUpdateDraft,
  onSaveNewDraft,
  onClearDraft,
  onOpenCustomItemModal,
  onExportToGoogleSheets,
  isExportingToSheets,
  sheetsExportSuccessUrl,
  isGoogleAuthenticated,
  onPromptGoogleLogin,
}) => {
  const [repPhoneInput, setRepPhoneInput] = useState(REPRESENTER.phone);
  const [customRepMode, setCustomRepMode] = useState(false);
  const summary = calculateOrderSummary(draft.items, draft.discountPercent);

  // Update item quantity
  const handleQuantityChange = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    const updatedItems = draft.items.map((it) => {
      if (it.id === itemId) {
        // Recalculate bonus for this item
        let freeBonus = 0;
        if (it.bonus) {
          const parts = it.bonus.replace(/\s+/g, '').split('+');
          if (parts.length === 2) {
            const free = parseFloat(parts[0]);
            const req = parseFloat(parts[1]);
            if (!isNaN(free) && !isNaN(req) && req > 0) {
              freeBonus = Math.floor(newQty / req) * free;
            }
          }
        }
        return { ...it, quantity: newQty, freeBonusUnits: freeBonus };
      }
      return it;
    });

    onUpdateDraft({
      ...draft,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    const updatedItems = draft.items.filter((it) => it.id !== itemId);
    onUpdateDraft({
      ...draft,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Send WhatsApp message
  const handleSendWhatsApp = () => {
    if (draft.items.length === 0) {
      alert('يرجى إضافة أصناف إلى المسودة أولاً');
      return;
    }
    if (!draft.pharmacyName.trim()) {
      alert('يرجى كتابة اسم الصيدلية قبل إرسال الطلبية');
      return;
    }

    const message = formatWhatsAppMessage(draft, REPRESENTER.name, repPhoneInput);
    const targetPhone = repPhoneInput.replace(/\D/g, '');
    const fullPhone = targetPhone.startsWith('0')
      ? '963' + targetPhone.substring(1)
      : targetPhone.startsWith('963')
      ? targetPhone
      : '963' + targetPhone;

    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    onUpdateDraft({
      ...draft,
      status: 'sent_whatsapp',
      updatedAt: new Date().toISOString(),
    });
  };

  // Print then WhatsApp flow
  const handlePrintThenWhatsApp = () => {
    if (draft.items.length === 0) {
      alert('يرجى إضافة أصناف إلى المسودة أولاً');
      return;
    }
    // 1. Trigger Print
    window.print();
    // 2. Prompt user to continue to WhatsApp
    setTimeout(() => {
      handleSendWhatsApp();
    }, 1000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Pharmacy Profile & Draft Meta Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-800">
              📝
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                بيانات الصيدلية ومسودة الطلبية
              </h2>
              <p className="text-xs text-slate-500">
                أدخل بيانات الصيدلية لتوثيقها في الفاتورة، جدول Google Sheets، ورسالة واتساب
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSaveNewDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>حفظ كمسودة جديدة</span>
            </button>
            <button
              onClick={onOpenCustomItemModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 text-xs font-bold transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>إضافة صنف يدوي</span>
            </button>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              اسم الصيدلية *
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: صيدلية النور..."
              value={draft.pharmacyName}
              onChange={(e) =>
                onUpdateDraft({ ...draft, pharmacyName: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              اسم الصيدلاني المسؤول
            </label>
            <input
              type="text"
              placeholder="د. محمد..."
              value={draft.pharmacistName}
              onChange={(e) =>
                onUpdateDraft({ ...draft, pharmacistName: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              رقم هاتف الصيدلية / الجوال
            </label>
            <input
              type="text"
              placeholder="09..."
              value={draft.phone}
              onChange={(e) =>
                onUpdateDraft({ ...draft, phone: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              المدينة / العنوان
            </label>
            <input
              type="text"
              placeholder="دمشق، الميدان..."
              value={draft.address}
              onChange={(e) =>
                onUpdateDraft({ ...draft, address: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="col-span-1 sm:col-span-2 md:col-span-4">
            <label className="block font-bold text-slate-700 mb-1">
              ملاحظات الطلبية / تعليمات التسليم
            </label>
            <input
              type="text"
              placeholder="مثلاً: وقت التسليم المفضل، أدوية عاجلة، شروط التواريخ..."
              value={draft.notes}
              onChange={(e) =>
                onUpdateDraft({ ...draft, notes: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Order Items Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-sm text-slate-900">
              جدول محتويات المسودة ({draft.items.length} صنف)
            </h3>
            {summary.totalBonusUnits > 0 && (
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Gift className="w-3 h-3 text-rose-600" />
                {summary.totalBonusUnits} علبة بونص مجاني
              </span>
            )}
          </div>
          {draft.items.length > 0 && (
            <button
              onClick={onClearDraft}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              تفريغ الجدول
            </button>
          )}
        </div>

        {draft.items.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400 space-y-3">
            <div className="text-4xl">🛒</div>
            <p className="text-sm font-semibold text-slate-600">
              المسودة فارغة حالياً
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              تصفح كتالوج الأدوية وأضف المستحضرات المطلوبة، أو اضغط على "إضافة صنف يدوي" لإدخال أدوية خاصة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">اسم المستحضر الدوائي</th>
                  <th className="p-3">الشركة</th>
                  <th className="p-3 text-center">عرض البونص</th>
                  <th className="p-3 text-center w-36">الكمية المطلوبة</th>
                  <th className="p-3 text-center">البونص المجاني</th>
                  <th className="p-3 text-left">السعر الفردي</th>
                  <th className="p-3 text-left">الإجمالي</th>
                  <th className="p-3 w-12 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {draft.items.map((item, index) => {
                  const rowTotal = item.unitPrice * item.quantity;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="p-3 font-extrabold text-slate-900">
                        <div>{item.name}</div>
                        {item.activeIngredient && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {item.activeIngredient}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {item.company}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-rose-700">
                        {item.bonus ? `🎁 ${item.bonus}` : '—'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl p-1">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 font-black text-slate-800 flex items-center justify-center shadow-xs text-sm"
                            aria-label="إنقاص الكمية"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                            }
                            className="w-12 text-center bg-transparent font-black text-slate-900 focus:outline-none text-xs"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-black text-white flex items-center justify-center shadow-xs text-sm"
                            aria-label="زيادة الكمية"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center font-black text-rose-600">
                        {item.freeBonusUnits > 0 ? (
                          <span className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            +{item.freeBonusUnits} مجاناً
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 text-left font-medium text-slate-700">
                        <span className="font-mono">{item.unitPrice.toLocaleString('en-US')}</span>
                      </td>
                      <td className="p-3 text-left font-black text-emerald-800">
                        <span className="font-mono">{rowTotal.toLocaleString('en-US')}</span> ليرة
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="حذف الصنف"
                          aria-label="حذف الصنف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary and Dispatch Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Representative & WhatsApp Target Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-700" />
              وجهة الإرسال (المندوب)
            </h4>
            <button
              onClick={() => setCustomRepMode(!customRepMode)}
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              {customRepMode ? 'استخدام المندوب الرسمي' : 'تغيير الرقم'}
            </button>
          </div>

          {!customRepMode ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
              <div className="font-black text-emerald-950 text-sm">
                {REPRESENTER.name}
              </div>
              <div className="text-emerald-800 font-semibold">
                المندوب المعتمد الحصري – 0995711536
              </div>
              <div className="text-[11px] text-emerald-700">
                يتم إرسال المسودة مباشرة إلى واتساب المندوب فواز البشير بضغطة زر.
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 text-xs">
              <label className="block text-slate-600 font-semibold">
                رقم واتساب المندوب / المستودع:
              </label>
              <input
                type="text"
                placeholder="0995711536"
                value={repPhoneInput}
                onChange={(e) => setRepPhoneInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
          )}

          {/* Google Sheets Link Status */}
          {draft.googleSheetUrl && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-teal-900">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                تم حفظ المسودة في Google Drive
              </div>
              <a
                href={draft.googleSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 font-bold underline flex items-center gap-1 text-[11px] hover:text-teal-900"
              >
                <span>فتح جدول البيانات في Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Financial Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900">
            📊 ملخص الحساب والإجماليات
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>عدد الأصناف المختارة:</span>
              <span className="font-bold text-slate-900">{summary.totalItemsCount} صنف</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>إجمالي العلب المطلوبة:</span>
              <span className="font-bold text-slate-900">{summary.totalPaidUnits} علبة</span>
            </div>
            {summary.totalBonusUnits > 0 && (
              <div className="flex justify-between text-rose-700 font-bold">
                <span>علب البونص المجانية (هدية):</span>
                <span>🎁 +{summary.totalBonusUnits} علبة</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
              <span>المجموع الفرعي للطلبية:</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(summary.subtotal)}
              </span>
            </div>

            {/* Discount Percentage Input */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-slate-600 font-medium">نسبة الخصم الإضافي (%):</span>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={draft.discountPercent || ''}
                  onChange={(e) =>
                    onUpdateDraft({
                      ...draft,
                      discountPercent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                    })
                  }
                  placeholder="0%"
                  className="w-full text-center px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {summary.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>قيمة الخصم ({draft.discountPercent}%):</span>
                <span>-{formatCurrency(summary.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-3 border-t-2 border-slate-900 text-sm font-black text-slate-950">
              <span>الصافي النهائي للطلبية:</span>
              <span className="text-base text-emerald-800 font-bold">
                {formatCurrency(summary.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Execution Actions (WhatsApp, Print, Google Sheets) */}
        <div className="bg-gradient-to-br from-slate-900 to-[#062014] rounded-2xl shadow-md p-5 text-white flex flex-col justify-between space-y-3">
          <div>
            <h4 className="font-extrabold text-sm text-amber-300 mb-1 flex items-center gap-1.5">
              🚀 إجراءات إرسال واعتماد الطلبية
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              اختر حفظ الطلبية كجدول بيانات على Google Drive، أو طباعتها وإرسالها فوراً إلى واتساب.
            </p>
          </div>

          <div className="space-y-2">
            {/* Google Sheets Export Button */}
            <button
              onClick={() => {
                if (!isGoogleAuthenticated) {
                  onPromptGoogleLogin();
                } else {
                  onExportToGoogleSheets();
                }
              }}
              disabled={isExportingToSheets || draft.items.length === 0}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>
                {isExportingToSheets
                  ? 'جاري الحفظ في Google Sheets...'
                  : isGoogleAuthenticated
                  ? 'حفظ وتصدير إلى Google Sheets'
                  : 'ربط Google Sheets وتصدير الجدول'}
              </span>
            </button>

            {/* Download CSV / Excel file */}
            <button
              onClick={() => downloadDraftAsCSV(draft)}
              disabled={draft.items.length === 0}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              title="تنزيل جدول البيانات كملف CSV متوافق مع Excel و Google Sheets"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل جدول الطلبية (ملف Excel / CSV)</span>
            </button>

            {/* Print Then Send WhatsApp Button (The exact user workflow) */}
            <button
              onClick={handlePrintThenWhatsApp}
              disabled={draft.items.length === 0}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة ثم إرسال على واتساب ⚡</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Print Only */}
              <button
                onClick={() => {
                  if (draft.items.length === 0) {
                    alert('يرجى إضافة أصناف أولاً');
                    return;
                  }
                  window.print();
                }}
                disabled={draft.items.length === 0}
                className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span>طباعة فقط</span>
              </button>

              {/* Direct WhatsApp Send */}
              <button
                onClick={handleSendWhatsApp}
                disabled={draft.items.length === 0}
                className="py-2 px-2.5 rounded-xl bg-[#25d366] hover:bg-[#1ebe57] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <MessageSquareShare className="w-3.5 h-3.5" />
                <span>واتساب فقط</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
