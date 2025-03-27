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
  currency: string;
  // theme property has been removed as it's now handled via localStorage only
}

export interface UpcomingPayment {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  is_recurring: boolean;
  category_id: string;
  category?: Category;
  created_at: string;
  updated_at: string;
}
