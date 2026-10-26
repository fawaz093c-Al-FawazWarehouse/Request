import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBonusUnits, calculateOrderSummary, formatWhatsAppMessage } from './orderCalculations.ts';
import type { OrderItem, OrderDraft } from '../types/pharmacy.ts';

test('calculateBonusUnits parses 3+10 correctly', () => {
  assert.equal(calculateBonusUnits('3+10', 10), 3);
  assert.equal(calculateBonusUnits('3+10', 20), 6);
  assert.equal(calculateBonusUnits('3+10', 25), 6);
  assert.equal(calculateBonusUnits('3+10', 9), 0);
});

test('calculateBonusUnits parses 5+20 and 1+3 correctly', () => {
  assert.equal(calculateBonusUnits('5+20', 40), 10);
  assert.equal(calculateBonusUnits('1+3', 9), 3);
  assert.equal(calculateBonusUnits('', 10), 0);
  assert.equal(calculateBonusUnits(undefined, 10), 0);
});

test('calculateOrderSummary calculates totals and discounts correctly', () => {
  const items: OrderItem[] = [
    {
      id: '1',
      name: 'اكزانتريك 40 ملغ',
      company: 'بركات',
      bonus: '3+10',
      unitPrice: 8200,
      quantity: 20,
      freeBonusUnits: 6,
    },
    {
      id: '2',
      name: 'اموكسيبين 500 ملغ',
      company: 'بركات',
      bonus: '2+10',
      unitPrice: 16400,
      quantity: 10,
      freeBonusUnits: 2,
    }
  ];

  // item 1: 8200 * 20 = 164000
  // item 2: 16400 * 10 = 164000
  // subtotal: 328000
  // discount 5%: 328000 * 0.05 = 16400
  // grand total: 311600
  const summary = calculateOrderSummary(items, 5);
  assert.equal(summary.totalItemsCount, 2);
  assert.equal(summary.totalPaidUnits, 30);
  assert.equal(summary.totalBonusUnits, 8);
  assert.equal(summary.totalUnitsAll, 38);
  assert.equal(summary.subtotal, 328000);
  assert.equal(summary.discountAmount, 16400);
  assert.equal(summary.grandTotal, 311600);
});

test('formatWhatsAppMessage includes pharmacy and items info', () => {
  const draft: OrderDraft = {
    id: 'test-1',
    title: 'طلبية تجريبية',
    pharmacyName: 'صيدلية السلام',
    pharmacistName: 'د. أحمد',
    phone: '0987654321',
    address: 'دمشق',
    notes: 'تسليم صباحاً',
    items: [
      {
        id: '1',
        name: 'باراسيتامول',
        company: 'بركات',
        bonus: '2+10',
        unitPrice: 5000,
        quantity: 10,
        freeBonusUnits: 2,
      }
    ],
    discountPercent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft'
  };

  const message = formatWhatsAppMessage(draft);
  assert.ok(message.includes('صيدلية السلام'));
  assert.ok(message.includes('د. أحمد'));
  assert.ok(message.includes('باراسيتامول'));
  assert.ok(message.includes('فواز البشير'));
});
