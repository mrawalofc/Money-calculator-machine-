import React from 'react';
import { 
  Utensils, 
  Car, 
  ShoppingBag, 
  Zap, 
  Film, 
  HeartPulse, 
  PieChart, 
  DollarSign, 
  HelpCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  GraduationCap,
  Home,
  Plane,
  Gift,
  PiggyBank,
  CircleDollarSign,
  TrendingUp,
  Tag,
  Coffee,
  Fuel,
  Repeat,
  Briefcase,
  Coins
} from 'lucide-react';
import { Category, TransactionType } from '../types';

interface CategoryIconProps {
  category: Category;
  type?: TransactionType;
  size?: number;
  className?: string;
}

export const CategoryIcon = ({ category, type, size = 20, className = "" }: CategoryIconProps) => {
  if (type === 'income' && category === 'Salary') return <TrendingUp size={size} className={className} />;
  if (type === 'income') return <DollarSign size={size} className={className} />;
  
  switch (category) {
    case 'Food & Dining': return <Utensils size={size} className={className} />;
    case 'Grocery': return <Coffee size={size} className={className} />;
    case 'Transport': return <Car size={size} className={className} />;
    case 'Auto & Fuel': return <Fuel size={size} className={className} />;
    case 'Shopping': return <ShoppingBag size={size} className={className} />;
    case 'Subscriptions': return <Repeat size={size} className={className} />;
    case 'Bills & Utilities': return <Zap size={size} className={className} />;
    case 'Entertainment': return <Film size={size} className={className} />;
    case 'Health': return <HeartPulse size={size} className={className} />;
    case 'Education': return <GraduationCap size={size} className={className} />;
    case 'Rent': return <Home size={size} className={className} />;
    case 'Travel': return <Plane size={size} className={className} />;
    case 'Gift': return <Gift size={size} className={className} />;
    case 'Savings': return <PiggyBank size={size} className={className} />;
    case 'Debt': return <CircleDollarSign size={size} className={className} />;
    case 'Investment': return <PieChart size={size} className={className} />;
    case 'Salary': return <TrendingUp size={size} className={className} />;
    case 'Business': return <Briefcase size={size} className={className} />;
    case 'Lending': 
      if (type === 'lent_repayment') return <ArrowDownLeft size={size} className={className} />;
      return <ArrowUpRight size={size} className={className} />;
    case 'Borrowing': 
      if (type === 'borrowed_repayment') return <ArrowUpRight size={size} className={className} />;
      return <ArrowDownLeft size={size} className={className} />;
    case 'Income - Other': return <Coins size={size} className={className} />;
    case 'Other': return <Tag size={size} className={className} />;
    default: return <HelpCircle size={size} className={className} />;
  }
};
