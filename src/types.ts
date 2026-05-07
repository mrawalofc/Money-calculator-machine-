
export type TransactionType = 'income' | 'expense' | 'lent' | 'borrowed' | 'lent_repayment' | 'borrowed_repayment';

export type Category = 
  | 'Food & Dining' 
  | 'Grocery'
  | 'Transport' 
  | 'Auto & Fuel'
  | 'Shopping' 
  | 'Subscriptions'
  | 'Bills & Utilities' 
  | 'Entertainment' 
  | 'Health'
  | 'Education'
  | 'Rent'
  | 'Travel'
  | 'Gift'
  | 'Investment'
  | 'Salary'
  | 'Lending'
  | 'Borrowing'
  | 'Savings'
  | 'Debt'
  | 'Business'
  | 'Income - Other'
  | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  currency?: string;
  type: TransactionType;
  category: Category;
  personName?: string;
  date: string;
  note: string;
  createdAt: number;
}

export interface Budget {
  category: Category;
  limit: number;
  currency?: string;
  period: 'monthly';
}

export type Language = 'en' | 'bn';

export interface UserSettings {
  name: string;
  currency: string;
  darkMode: boolean;
  avatarUrl?: string;
  language: Language;
  multiColorMode?: boolean;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR (Saudi Rial)' },
  { code: 'BDT', symbol: '৳', label: 'BDT (Bangladesh TK)' },
  { code: 'AED', symbol: 'DH', label: 'AED (UAE Dirham)' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' }
];

export const CONVERSION_RATES: Record<string, number> = {
  'USD': 1,
  'EUR': 0.92,
  'GBP': 0.79,
  'JPY': 150,
  'INR': 83,
  'SAR': 3.75,
  'BDT': 110,
  'AED': 3.67,
  'CAD': 1.36,
  'AUD': 1.54
};

export const CATEGORIES: Category[] = [
  'Food & Dining',
  'Grocery',
  'Transport',
  'Auto & Fuel',
  'Shopping',
  'Subscriptions',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Education',
  'Rent',
  'Travel',
  'Gift',
  'Savings',
  'Debt',
  'Investment',
  'Salary',
  'Business',
  'Lending',
  'Borrowing',
  'Income - Other',
  'Other'
];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Food & Dining': '#F43F5E', // rose-500
  'Grocery': '#FB7185', // rose-400
  'Transport': '#F59E0B', // amber-500
  'Auto & Fuel': '#B45309', // amber-700
  'Shopping': '#8B5CF6', // violet-500
  'Subscriptions': '#C084FC', // purple-400
  'Bills & Utilities': '#3B82F6', // blue-500
  'Entertainment': '#EC4899', // pink-500
  'Health': '#10B981', // emerald-500
  'Education': '#6366F1', // indigo-500
  'Rent': '#64748B', // slate-500
  'Travel': '#0EA5E9', // sky-500
  'Gift': '#D946EF', // fuchsia-500
  'Savings': '#059669', // emerald-600
  'Debt': '#7C3AED', // purple-600
  'Investment': '#22C55E', // green-500
  'Salary': '#10B981', // emerald-500
  'Business': '#475569', // slate-600
  'Lending': '#F97316', // orange-500
  'Borrowing': '#06B6D4', // cyan-500
  'Income - Other': '#14B8A6', // teal-500
  'Other': '#94A3B8' // slate-400
};
