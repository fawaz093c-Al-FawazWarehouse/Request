import React from 'react';
import { OrderDraft } from '../types/pharmacy';
import { calculateOrderSummary, formatCurrency } from '../utils/orderCalculations';
import { REPRESENTER } from '../data/constants';

interface PrintInvoiceProps {
  draft: OrderDraft;
}

export const PrintInvoice: React.FC<PrintInvoiceProps> = ({ draft }) => {
  const summary = calculateOrderSummary(draft.items, draft.discountPercent);
  const now = new Date(draft.updatedAt || draft.createdAt || Date.now());
  const dateStr = now.toLocaleDateString('ar-SY');

  return (
    <div className="print-only hidden p-8 text-black bg-white" dir="rtl" id="printSection">
      {/* Official Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-wide">
              مستودع الفواز للأدوية البشرية
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              حيث تبدأ الثقة ولا تنتهي الخدمة • بروشور الأدوية المعتمد
            </p>
            <p className="text-xs text-slate-500 mt-1">
              المندوب الحصري: {REPRESENTER.name} — هاتف: {REPRESENTER.phone}
            </p>
          </div>
          <div className="text-left">
            <div className="inline-block border border-slate-900 px-3 py-1 rounded font-bold text-sm bg-slate-100">
              مسودة طلبية رسمية
            </div>
            <p className="text-xs text-slate-600 mt-1">التاريخ: {dateStr}</p>
            <p className="text-xs text-slate-500">رقم المسودة: #{draft.id.substring(0, 8)}</p>
          </div>
        </div>

        {/* Pharmacy Info Card */}
        <div className="grid grid-cols-4 gap-4 mt-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
          <div>
            <span className="font-bold block text-slate-700">اسم الصيدلية:</span>
            <span className="font-semibold text-slate-900">{draft.pharmacyName || '—'}</span>
          </div>
          <div>
            <span className="font-bold block text-slate-700">اسم الصيدلاني:</span>
            <span className="text-slate-900">{draft.pharmacistName || '—'}</span>
          </div>
          <div>
            <span className="font-bold block text-slate-700">رقم الهاتف:</span>
            <span className="text-slate-900">{draft.phone || '—'}</span>
          </div>
          <div>
            <span className="font-bold block text-slate-700">العنوان / المنطقة:</span>
            <span className="text-slate-900">{draft.address || '—'}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-xs border-collapse border border-slate-300 mb-6">
        <thead>
          <tr className="bg-slate-100 text-slate-900">
            <th className="border border-slate-300 p-2 text-center w-8">#</th>
            <th className="border border-slate-300 p-2 text-right">اسم المستحضر والدواء</th>
            <th className="border border-slate-300 p-2 text-right w-24">الشركة</th>
            <th className="border border-slate-300 p-2 text-center w-16">بونص</th>
            <th className="border border-slate-300 p-2 text-center w-16">الكمية</th>
            <th className="border border-slate-300 p-2 text-center w-16">مجاني</th>
            <th className="border border-slate-300 p-2 text-left w-24">السعر الفردي</th>
            <th className="border border-slate-300 p-2 text-left w-28">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {draft.items.map((item, idx) => {
            const rowTotal = item.unitPrice * item.quantity;
            return (
              <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                <td className="border border-slate-300 p-2 font-bold text-slate-900">
                  {item.name}
                  {item.notes && <span className="block text-[10px] text-slate-500 font-normal">{item.notes}</span>}
                </td>
                <td className="border border-slate-300 p-2">{item.company}</td>
                <td className="border border-slate-300 p-2 text-center">{item.bonus || '—'}</td>
                <td className="border border-slate-300 p-2 text-center font-bold">{item.quantity}</td>
                <td className="border border-slate-300 p-2 text-center text-rose-700 font-bold">
                  {item.freeBonusUnits > 0 ? `+${item.freeBonusUnits}` : '—'}
                </td>
                <td className="border border-slate-300 p-2 text-left font-mono">{item.unitPrice.toLocaleString('en-US')}</td>
                <td className="border border-slate-300 p-2 text-left font-mono font-bold text-slate-900">
                  {rowTotal.toLocaleString('en-US')} ليرة
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Financial Summary & Signatures */}
      <div className="grid grid-cols-2 gap-8 items-start">
        {/* Notes and Disclaimers */}
        <div className="text-xs text-slate-600 space-y-2">
          {draft.notes && (
            <div className="p-2 border border-slate-200 rounded bg-slate-50">
              <span className="font-bold block text-slate-800">ملاحظات الصيدلية:</span>
              <p>{draft.notes}</p>
            </div>
          )}
          <p className="text-[11px] text-slate-500 leading-relaxed">
            * الأسعار والبونصات مستخرجة من البروشور المحدث ومعتمدة وفق عروض الشركات وقت الفوترة.
          </p>
          {draft.googleSheetUrl && (
            <p className="text-[10px] text-slate-500">
              تمت المزامنة مع جدول بيانات Google Drive: {draft.googleSheetUrl}
            </p>
          )}
        </div>

        {/* Totals Box */}
        <div className="border border-slate-300 rounded p-4 bg-slate-50 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-600">عدد الأصناف:</span>
            <span className="font-bold">{summary.totalItemsCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">إجمالي العلب المشتراة:</span>
            <span className="font-bold">{summary.totalPaidUnits}</span>
          </div>
          {summary.totalBonusUnits > 0 && (
            <div className="flex justify-between text-rose-700 font-semibold">
              <span>إجمالي علب البونص المجانية:</span>
              <span>+{summary.totalBonusUnits} علبة</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-600">المجموع الفرعي:</span>
            <span className="font-mono font-bold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {summary.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>الخصم الممنوح ({summary.discountPercent}%):</span>
              <span className="font-mono">-{formatCurrency(summary.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-950">
            <span>الصافي المطلوب سداده:</span>
            <span className="font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-slate-200 text-xs text-center">
        <div>
          <span className="font-bold block mb-8">توقيع وختم الصيدلية:</span>
          <div className="border-b border-dashed border-slate-400 w-48 mx-auto"></div>
        </div>
        <div>
          <span className="font-bold block mb-8">توقيع المندوب / المستودع:</span>
          <div className="border-b border-dashed border-slate-400 w-48 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};
