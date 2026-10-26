import type { OrderDraft } from '../types/pharmacy.ts';
import { calculateOrderSummary } from './orderCalculations.ts';

export interface MonthlyStat {
  month: string;
  orderCount: number;
  totalAmount: number;
  totalUnits: number;
  totalBonus: number;
}

export interface PharmacyStat {
  name: string;
  orderCount: number;
  totalAmount: number;
  totalUnits: number;
  color?: string;
}

export interface CompanyStat {
  company: string;
  unitCount: number;
  totalAmount: number;
}

const MONTH_NAMES_AR = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
];

/**
 * Aggregates order drafts by month
 */
export function getMonthlyOrderStats(drafts: OrderDraft[]): MonthlyStat[] {
  const map = new Map<string, MonthlyStat>();

  // Initialize with last 6 months so chart is never empty
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = MONTH_NAMES_AR[d.getMonth()];
    map.set(key, {
      month: monthLabel,
      orderCount: 0,
      totalAmount: 0,
      totalUnits: 0,
      totalBonus: 0,
    });
  }

  drafts.forEach((draft) => {
    const date = new Date(draft.updatedAt || draft.createdAt || Date.now());
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const summary = calculateOrderSummary(draft.items, draft.discountPercent);

    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.orderCount += 1;
      existing.totalAmount += summary.grandTotal;
      existing.totalUnits += summary.totalPaidUnits;
      existing.totalBonus += summary.totalBonusUnits;
    } else {
      const monthLabel = MONTH_NAMES_AR[date.getMonth()];
      map.set(key, {
        month: monthLabel,
        orderCount: 1,
        totalAmount: summary.grandTotal,
        totalUnits: summary.totalPaidUnits,
        totalBonus: summary.totalBonusUnits,
      });
    }
  });

  return Array.from(map.values());
}

/**
 * Aggregates order drafts by pharmacy name
 */
export function getPharmacyDistribution(drafts: OrderDraft[]): PharmacyStat[] {
  const map = new Map<string, PharmacyStat>();
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

  drafts.forEach((draft) => {
    const name = draft.pharmacyName?.trim() || 'صيدلية غير محددة';
    const summary = calculateOrderSummary(draft.items, draft.discountPercent);

    if (map.has(name)) {
      const existing = map.get(name)!;
      existing.orderCount += 1;
      existing.totalAmount += summary.grandTotal;
      existing.totalUnits += summary.totalPaidUnits;
    } else {
      map.set(name, {
        name,
        orderCount: 1,
        totalAmount: summary.grandTotal,
        totalUnits: summary.totalPaidUnits,
      });
    }
  });

  const list = Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  list.forEach((item, index) => {
    item.color = COLORS[index % COLORS.length];
  });
  return list;
}

/**
 * Aggregates items inside drafts by manufacturer company
 */
export function getCompanyOrderStats(drafts: OrderDraft[]): CompanyStat[] {
  const map = new Map<string, CompanyStat>();

  drafts.forEach((draft) => {
    draft.items.forEach((item) => {
      const company = item.company?.trim() || 'أخرى';
      const itemTotal = item.unitPrice * (item.quantity || 0);

      if (map.has(company)) {
        const existing = map.get(company)!;
        existing.unitCount += item.quantity || 0;
        existing.totalAmount += itemTotal;
      } else {
        map.set(company, {
          company,
          unitCount: item.quantity || 0,
          totalAmount: itemTotal,
        });
      }
    });
  });

  return Array.from(map.values())
    .sort((a, b) => b.unitCount - a.unitCount)
    .slice(0, 8); // Top 8 companies
}
