import { useState } from 'react';
import { AiInsights } from './AiInsights';
import { SmartMoneyTipsModal } from './SmartMoneyTipsModal';
import { getSmartMoneyTips } from '../lib/gemini';
import { useTheme } from '../context/ThemeContext';
import { Expense } from '../types';

interface FinanceChatProps {
  expenses: Expense[];
}

export function FinanceChat({ expenses }: FinanceChatProps) {
  const { theme } = useTheme();
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [tips, setTips] = useState('');
  const [isLoadingTips, setIsLoadingTips] = useState(false);

  // Function to load money-saving tips
  const loadMoneyTips = async () => {
    setIsLoadingTips(true);
    try {
      const tipsData = await getSmartMoneyTips();
      setTips(tipsData);
    } catch (error) {
      console.error('Error loading money tips:', error);
      setTips('Unable to load tips at this time. Please try again later.');
    } finally {
      setIsLoadingTips(false);
    }
  };

  // Open the tips modal and load tips if not already loaded
  const handleOpenTipsModal = () => {
    if (!tips) {
      loadMoneyTips();
    }
    setShowTipsModal(true);
  };

  // Close the tips modal
  const handleCloseTipsModal = () => {
    setShowTipsModal(false);
  };

  // Refresh the tips
  const handleRefreshTips = () => {
    loadMoneyTips();
  };

  return (
    <div className="container mx-auto px-4">
      <AiInsights expenses={expenses} onOpenTips={handleOpenTipsModal} />
      
      {showTipsModal && (
        <SmartMoneyTipsModal
          tips={tips}
          isLoading={isLoadingTips}
          onRefresh={handleRefreshTips}
          onClose={handleCloseTipsModal}
          theme={theme}
        />
      )}
    </div>
  );
}
