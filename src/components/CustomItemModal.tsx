import React, { useState } from 'react';
import { OrderItem } from '../types/pharmacy';
import { calculateBonusUnits } from '../utils/orderCalculations';
import { X, PlusCircle } from 'lucide-react';

interface CustomItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: OrderItem) => void;
}

export const CustomItemModal: React.FC<CustomItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [bonus, setBonus] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const price = typeof unitPrice === 'number' ? unitPrice : 0;
    const freeBonus = calculateBonusUnits(bonus, quantity);

    const newItem: OrderItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      company: company.trim() || 'صنف مخصص',
      bonus: bonus.trim(),
      unitPrice: price,
      quantity: quantity > 0 ? quantity : 1,
      freeBonusUnits: freeBonus,
      notes: notes.trim(),
    };

    onAddItem(newItem);
    // Reset form
    setName('');
    setCompany('');
    setUnitPrice('');
    setQuantity(1);
    setBonus('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">إضافة صنف دوائي مخصص للمسودة</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              اسم الصنف / العيار / الشكل الصيدلاني *
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: أوغمنتين 1 غرام 14 مضغوطة..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                الشركة المصنعة / الموردة
              </label>
              <input
                type="text"
                placeholder="مثلاً: بركات، دومنا..."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                سعر الوحدة (ل.س)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                الكمية المطلوبة (علبة) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                عرض البونص (اختياري)
              </label>
              <input
                type="text"
                placeholder="مثلاً: 3+10 أو 1+4"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              ملاحظة على الصنف
            </label>
            <input
              type="text"
              placeholder="مثلاً: شرط تاريخ صالح، أو بديل مناسب..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100 font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition-all"
            >
              إضافة الصنف للمسودة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
