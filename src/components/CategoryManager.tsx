import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';

interface CategoryManagerProps {
  categories: Category[];
  onClose: () => void;
  onCategoriesChange: () => void;
}

export function CategoryManager({ categories, onClose, onCategoriesChange }: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('categories')
        .insert([
          { name: newCategoryName, color: newCategoryColor }
        ]);

      if (error) throw error;

      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
      onCategoriesChange();
    } catch (error: any) {
      console.error('Error adding category:', error);
      setError(error.message || 'Failed to add category');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      // Check if category is in use
      const { data: expensesUsingCategory, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (expensesUsingCategory && expensesUsingCategory.length > 0) {
        setError('Cannot delete category that is being used by expenses');
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      onCategoriesChange();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setError(error.message || 'Failed to delete category');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 overflow-y-auto hide-scrollbar max-h-[calc(90vh-2rem)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Manage Categories</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAddCategory} className="mb-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isAdding}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                {isAdding ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </form>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Existing Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span>{category.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
