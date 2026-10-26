import type { OrderItem, OrderDraft } from '../types/pharmacy.ts';

/**
 * Calculates free bonus items based on bonus string like "3+10", "1+4", etc.
 * Format is typically: freeUnits + requiredUnits (e.g. 3 free for every 10 ordered)
 */
export function calculateBonusUnits(bonusStr: string | undefined, quantity: number): number {
  if (!bonusStr || quantity <= 0) return 0;
  
  // Clean string e.g. "3+10", "5+20", "1+3"
  const clean = bonusStr.trim().replace(/\s+/g, '');
  const parts = clean.split('+');
  
  if (parts.length === 2) {
    const free = parseFloat(parts[0]);
    const required = parseFloat(parts[1]);
    if (!isNaN(free) && !isNaN(required) && required > 0 && free > 0) {
      const sets = Math.floor(quantity / required);
      return Math.floor(sets * free);
    }
  }
  return 0;
}

/**
 * Calculate totals for an order
 */
export function calculateOrderSummary(items: OrderItem[], discountPercent: number = 0) {
  const totalItemsCount = items.length;
  const totalPaidUnits = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const totalBonusUnits = items.reduce((sum, it) => sum + (it.freeBonusUnits || 0), 0);
  const totalUnitsAll = totalPaidUnits + totalBonusUnits;
  
  const subtotal = items.reduce((sum, it) => sum + (it.unitPrice * (it.quantity || 0)), 0);
  const discountAmount = Math.round(subtotal * (Math.max(0, Math.min(100, discountPercent)) / 100));
  const grandTotal = Math.max(0, subtotal - discountAmount);

  return {
    totalItemsCount,
    totalPaidUnits,
    totalBonusUnits,
    totalUnitsAll,
    subtotal,
    discountPercent,
    discountAmount,
    grandTotal,
  };
}

/**
 * Format currency in Syrian Pounds (ليرة) with standard numerals
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US') + ' ليرة';
}

/**
 * Format WhatsApp order message
 */
export function formatWhatsAppMessage(draft: OrderDraft, repName: string = 'فواز البشير', repPhone: string = '0995711536'): string {
  const summary = calculateOrderSummary(draft.items, draft.discountPercent);
  const now = new Date(draft.updatedAt || draft.createdAt || Date.now());
  const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

  let text = `🏥 *مسودة طلبية أدوية - مستودع الفواز*\n`;
  text += `📅 التاريخ: ${dateStr}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🏛️ *الصيدلية:* ${draft.pharmacyName || 'صيدلية غير محددة'}\n`;
  if (draft.pharmacistName) text += `👨‍⚕️ *الصيدلاني:* ${draft.pharmacistName}\n`;
  if (draft.phone) text += `📞 *رقم الهاتف:* ${draft.phone}\n`;
  if (draft.address) text += `📍 *العنوان:* ${draft.address}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📦 *قائمة المواد والأدوية المطلوبة:*\n\n`;

  draft.items.forEach((item, index) => {
    const itemTotal = item.unitPrice * item.quantity;
    text += `${index + 1}. *${item.name}*\n`;
    text += `   🏢 الشركة: ${item.company}`;
    if (item.bonus) {
      text += ` | 🎁 بونص: ${item.bonus}`;
      if (item.freeBonusUnits > 0) {
        text += ` (+${item.freeBonusUnits} مجاناً)`;
      }
    }
    text += `\n`;
    text += `   🔢 الكمية: *${item.quantity}* × ${item.unitPrice.toLocaleString('en-US')} = *${itemTotal.toLocaleString('en-US')} ل.س*\n`;
    if (item.notes) text += `   📝 ملاحظة: ${item.notes}\n`;
    text += `\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📊 *ملخص الطلبية:*\n`;
  text += `▪ عدد الأصناف: ${summary.totalItemsCount}\n`;
  text += `▪ إجمالي العلب المطلوبة: ${summary.totalPaidUnits}\n`;
  if (summary.totalBonusUnits > 0) {
    text += `▪ إجمالي البونص المجاني: 🎁 ${summary.totalBonusUnits} قطعة\n`;
    text += `▪ مجموع العلب المستلمة: ${summary.totalUnitsAll}\n`;
  }
  text += `▪ المجموع الفرعي: ${summary.subtotal.toLocaleString('en-US')} ل.س\n`;
  if (summary.discountAmount > 0) {
    text += `▪ نسبة الخصم (${summary.discountPercent}%): -${summary.discountAmount.toLocaleString('en-US')} ل.س\n`;
  }
  text += `💰 *الصافي المطلوب: ${summary.grandTotal.toLocaleString('en-US')} ل.س*\n`;

  if (draft.notes) {
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📝 *ملاحظات خاصة:* ${draft.notes}\n`;
  }

  if (draft.googleSheetUrl) {
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📑 *رابط جدول البيانات في غوغل درايف:*\n${draft.googleSheetUrl}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👤 المندوب المعتمد: ${repName} (${repPhone})\n`;
  text += `✨ حررت عبر منصة مسودات الفواز للأدوية الذكية`;

  return text;
}

/**
 * Export draft as a downloadable CSV file (UTF-8 with BOM for Excel compatibility)
 */
export function downloadDraftAsCSV(draft: OrderDraft): void {
  const summary = calculateOrderSummary(draft.items, draft.discountPercent);
  const now = new Date(draft.updatedAt || draft.createdAt || Date.now());
  const dateStr = now.toLocaleDateString('ar-SY');

  const rows: string[][] = [
    ['مستودع الفواز للأدوية البشرية - مسودة طلبية صيدلية'],
    ['الصيدلية', draft.pharmacyName || '', 'الصيدلاني', draft.pharmacistName || '', 'الهاتف', draft.phone || '', 'التاريخ', dateStr],
    ['العنوان', draft.address || '', 'الملاحظات', draft.notes || '', 'المندوب', 'فواز البشير (0995711536)'],
    [],
    ['م', 'اسم الدواء', 'الشركة', 'المادة الفعالة', 'الكمية المطلوبة', 'البونص المجاني', 'سعر الوحدة', 'الإجمالي'],
  ];

  draft.items.forEach((item, idx) => {
    rows.push([
      String(idx + 1),
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.company.replace(/"/g, '""')}"`,
      `"${(item.activeIngredient || '').replace(/"/g, '""')}"`,
      String(item.quantity),
      String(item.freeBonusUnits > 0 ? `+${item.freeBonusUnits}` : (item.bonus || '')),
      String(item.unitPrice),
      String(item.unitPrice * item.quantity),
    ]);
  });

  rows.push([]);
  rows.push(['الإجمالي الكلي', `عدد الأصناف: ${summary.totalItemsCount}`, `مجموع العلب: ${summary.totalPaidUnits}`, `إجمالي البونص: ${summary.totalBonusUnits}`, '', '', 'المجموع الفرعي:', String(summary.subtotal)]);
  if (summary.discountAmount > 0) {
    rows.push(['', '', '', '', '', '', `الخصم (${summary.discountPercent}%):`, String(-summary.discountAmount)]);
  }
  rows.push(['', '', '', '', '', '', 'الصافي النهائي:', String(summary.grandTotal)]);

  const csvContent = '\uFEFF' + rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `طلبية_${draft.pharmacyName || 'صيدلية'}_${dateStr.replace(/[\/\\?%*:|"<>]/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

