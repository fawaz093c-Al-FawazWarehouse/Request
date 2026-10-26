import test from 'node:test';
import assert from 'node:assert/strict';
import { getMonthlyOrderStats, getPharmacyDistribution, getCompanyOrderStats } from './dashboardCalculations.ts';
import type { OrderDraft } from '../types/pharmacy.ts';

const mockDrafts: OrderDraft[] = [
  {
    id: 'd1',
    title: 'طلبية 1',
    pharmacyName: 'صيدلية النور',
    pharmacistName: 'د. خالد',
    phone: '0911',
    address: 'دمشق',
    notes: '',
    items: [
      {
        id: 'i1',
        name: 'اكزانتريك 40 ملغ',
        company: 'بركات',
        bonus: '3+10',
        unitPrice: 8000,
        quantity: 10,
        freeBonusUnits: 3,
      },
      {
        id: 'i2',
        name: 'باراسيتامول',
        company: 'دومنا',
        bonus: '',
        unitPrice: 5000,
        quantity: 20,
        freeBonusUnits: 0,
      },
    ],
    discountPercent: 0,
    createdAt: new Date('2026-09-15').toISOString(),
    updatedAt: new Date('2026-09-15').toISOString(),
    status: 'draft',
  },
  {
    id: 'd2',
    title: 'طلبية 2',
    pharmacyName: 'صيدلية السلام',
    pharmacistName: 'د. سامر',
    phone: '0922',
    address: 'حلب',
    notes: '',
    items: [
      {
        id: 'i3',
        name: 'اموكسيبين 500 ملغ',
        company: 'بركات',
        bonus: '2+10',
        unitPrice: 16000,
        quantity: 5,
        freeBonusUnits: 0,
      },
    ],
    discountPercent: 10,
    createdAt: new Date('2026-10-10').toISOString(),
    updatedAt: new Date('2026-10-10').toISOString(),
    status: 'synced_sheets',
  },
];

test('getPharmacyDistribution groups drafts by pharmacy correctly', () => {
  const dist = getPharmacyDistribution(mockDrafts);
  assert.equal(dist.length, 2);
  const alnour = dist.find((p) => p.name === 'صيدلية النور');
  assert.ok(alnour);
  assert.equal(alnour.orderCount, 1);
  assert.equal(alnour.totalUnits, 30);
  assert.equal(alnour.totalAmount, 180000); // 10*8000 + 20*5000
});

test('getCompanyOrderStats aggregates products by company', () => {
  const companyStats = getCompanyOrderStats(mockDrafts);
  const barakat = companyStats.find((c) => c.company === 'بركات');
  assert.ok(barakat);
  assert.equal(barakat.unitCount, 15); // 10 from d1 + 5 from d2
  assert.equal(barakat.totalAmount, 160000); // 80000 + 80000
});

test('getMonthlyOrderStats groups by month', () => {
  const monthly = getMonthlyOrderStats(mockDrafts);
  assert.ok(monthly.length >= 6);
  const totalOrders = monthly.reduce((sum, m) => sum + m.orderCount, 0);
  assert.equal(totalOrders, 2);
});
