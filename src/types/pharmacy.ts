export interface Product {
  id: number;
  n: string; // name
  c: string; // company
  b: string; // bonus (e.g., "3+10", "5+20")
  p: number; // price in SYP
  cat: string; // category
  act?: string; // active ingredient
}

export interface OrderItem {
  id: string; // unique item id in cart/draft
  productId?: number;
  name: string;
  company: string;
  bonus: string;
  unitPrice: number;
  quantity: number;
  freeBonusUnits: number;
  activeIngredient?: string;
  notes?: string;
}

export interface OrderDraft {
  id: string;
  title: string;
  pharmacyName: string;
  pharmacistName: string;
  phone: string;
  address: string;
  notes: string;
  items: OrderItem[];
  discountPercent: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'printed' | 'sent_whatsapp' | 'synced_sheets';
  googleSheetUrl?: string;
  googleSheetId?: string;
}

export interface DrugScientificInfo {
  ind: string;
  dose: string;
  side: string;
  warn: string;
}
