export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  date: string;
  category_id: string;
  category: Category;
  created_at?: string;
}

export interface UserSettings {
  monthlyBudget: number;
  theme: 'light' | 'dark';
  currency: string;
}
