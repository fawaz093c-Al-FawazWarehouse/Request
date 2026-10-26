import { OrderDraft } from '../types/pharmacy';
import { calculateOrderSummary } from '../utils/orderCalculations';

export interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export async function createOrderSpreadsheet(
  draft: OrderDraft,
  accessToken: string
): Promise<SheetCreationResult> {
  const summary = calculateOrderSummary(draft.items, draft.discountPercent);
  const now = new Date(draft.updatedAt || draft.createdAt || Date.now());
  const dateStr = now.toLocaleDateString('ar-SY');
  const title = `طلبية_${draft.pharmacyName || 'صيدلية'}_${dateStr.replace(/[\/\\?%*:|"<>]/g, '-')}`;

  // 1. Create a new Spreadsheet with RTL direction
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
        locale: 'ar_SY',
        timeZone: 'Asia/Damascus',
      },
      sheets: [
        {
          properties: {
            title: 'مسودة الطلبية',
            rightToLeft: true,
            gridProperties: {
              frozenRowCount: 6,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل إنشاء جدول البيانات في Google Sheets');
  }

  const createData = await createRes.json();
  const spreadsheetId = createData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare structured data rows
  const values: any[][] = [
    ['مستودع الفواز للأدوية البشرية - مسودة طلبية صيدلية', '', '', '', '', '', '', ''],
    ['الصيدلية', draft.pharmacyName || '—', 'الصيدلاني', draft.pharmacistName || '—', 'الهاتف', draft.phone || '—', 'التاريخ', dateStr],
    ['العنوان', draft.address || '—', 'الملاحظات', draft.notes || '—', 'المندوب', 'فواز البشير (0995711536)', 'الحالة', 'مسودة معتمدة'],
    ['', '', '', '', '', '', '', ''],
    ['م', 'اسم الدواء والمستحضر', 'الشركة الموردة', 'المادة الفعالة', 'الكمية المطلوبة', 'البونص المجاني', 'سعر الوحدة (ل.س)', 'الإجمالي (ل.س)'],
  ];

  draft.items.forEach((item, idx) => {
    const rowTotal = item.unitPrice * item.quantity;
    values.push([
      idx + 1,
      item.name,
      item.company,
      item.activeIngredient || '—',
      item.quantity,
      item.freeBonusUnits > 0 ? `+${item.freeBonusUnits}` : (item.bonus || '—'),
      item.unitPrice,
      rowTotal,
    ]);
  });

  // Summary rows
  values.push(['', '', '', '', '', '', '', '']);
  values.push([
    '',
    'الإجمالي الكلي',
    `عدد الأصناف: ${summary.totalItemsCount}`,
    '',
    `مجموع العلب: ${summary.totalPaidUnits}`,
    `إجمالي البونص: ${summary.totalBonusUnits}`,
    'المجموع الفرعي:',
    summary.subtotal,
  ]);

  if (summary.discountAmount > 0) {
    values.push([
      '',
      '',
      '',
      '',
      '',
      '',
      `الخصم (${summary.discountPercent}%):`,
      -summary.discountAmount,
    ]);
  }

  values.push([
    '',
    '',
    '',
    '',
    '',
    '',
    'الصافي النهائي:',
    summary.grandTotal,
  ]);

  // 3. Update cells with the values
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'A1',
        values: values,
      }),
    }
  );

  if (!updateRes.ok) {
    console.warn('Failed to populate sheet values, but spreadsheet was created');
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

export async function listUserOrderSheets(accessToken: string) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&orderBy=modifiedTime desc&pageSize=10&fields=files(id,name,webViewLink,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Error listing drive files:', err);
    return [];
  }
}
