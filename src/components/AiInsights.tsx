import { useState, useEffect } from 'react';
import { getFinancialInsights, getSmartMoneyTips } from '../lib/gemini';
import { Expense } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Send, RefreshCw, HelpCircle, Lightbulb } from 'lucide-react';

interface AiInsightsProps {
  expenses: Expense[];
  onOpenTips?: () => void;
}

export function AiInsights({ expenses, onOpenTips }: AiInsightsProps) {
  const { theme } = useTheme();
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [responseIndex, setResponseIndex] = useState(0);

  // Suggested prompts for the user
  const suggestedPrompts = [
    "How can I save more money this month?",
    "What's my biggest spending category and how can I reduce it?",
    "Should I change my budget allocation?",
    "What financial habits should I improve?"
  ];

  // Get initial insights when the component loads
  const getInitialInsights = async () => {
    if (expenses.length === 0) {
      setAiResponse("Add some expenses to get started with AI-powered financial insights!");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Call our new function without a custom prompt to get default analysis
      const insights = await getFinancialInsights(expenses);
      
      setAiResponse(insights);
      startTypingEffect(insights);
    } catch (error) {
      console.error('Error getting AI insights:', error);
      setError('Unable to generate insights at this time. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getInitialInsights();
  }, [expenses]); // Re-run when expenses change

  // Simulate typing effect for a more dynamic feel
  const startTypingEffect = (text: string) => {
    setDisplayedResponse('');
    setResponseIndex(0);
    setIsTyping(true);
  };

  useEffect(() => {
    let typingTimer: NodeJS.Timeout;
    
    if (isTyping && responseIndex < aiResponse.length) {
      typingTimer = setTimeout(() => {
        setDisplayedResponse(prev => prev + aiResponse.charAt(responseIndex));
        setResponseIndex(prev => prev + 1);
      }, 10); // Adjust speed as needed
    } else {
      setIsTyping(false);
    }
    
    return () => clearTimeout(typingTimer);
  }, [isTyping, responseIndex, aiResponse]);

  // Handle form submission with a custom prompt
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setDisplayedResponse('');
    
    try {
      // Pass the custom prompt to our AI function
      const insights = await getFinancialInsights(expenses, prompt);
      setAiResponse(insights);
      startTypingEffect(insights);
      setPrompt('');
    } catch (error) {
      console.error('Error getting AI insights:', error);
      setError('Unable to generate insights based on your query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggested prompts
  const handleSuggestedPrompt = (suggestion: string) => {
    setPrompt(suggestion);
    handleSubmitWithPrompt(suggestion);
  };

  // Submit a prompt programmatically
  const handleSubmitWithPrompt = async (customPrompt: string) => {
    if (!customPrompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setDisplayedResponse('');
    
    try {
      const insights = await getFinancialInsights(expenses, customPrompt);
      setAiResponse(insights);
      startTypingEffect(insights);
      setPrompt('');
    } catch (error) {
      console.error('Error getting AI insights:', error);
      setError('Unable to generate insights based on your query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle the lightbulb button click (if no onOpenTips provided, we show the tips directly)
  const handleLightbulbClick = async () => {
    if (onOpenTips) {
      onOpenTips(); // Use the provided function if it exists
    } else {
      // If no handler is provided, we'll show tips directly in our component
      setIsLoading(true);
      setError(null);
      
      try {
        const tips = await getSmartMoneyTips();
        setAiResponse(tips);
        startTypingEffect(tips);
      } catch (error) {
        console.error('Error getting money tips:', error);
        setError('Unable to generate money-saving tips at this time.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-colors duration-200`}>
      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <Sparkles className={`${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} />
          <div>
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              AI Financial Assistant
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Ask questions about your finances and get personalized advice
            </p>
          </div>
        </div>
        <button
          onClick={handleLightbulbClick}
          className={`p-2 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-blue-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
          } transition-colors duration-200`}
          title="Smart Money Tips"
        >
          <Lightbulb size={18} />
        </button>
      </div>
      
      <div className={`p-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} space-y-4`}>
        {error && (
          <div className={`p-4 rounded-md ${theme === 'dark' ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}

        <div className={`${theme === 'dark' ? 'bg-gray-700/50' : 'bg-blue-50/50'} rounded-xl p-6 min-h-[300px] mb-4 relative`}>
          {isLoading && !displayedResponse ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
            </div>
          ) : (
            <div className="markdown-content">
              {displayedResponse || aiResponse}
              {isTyping && <span className="cursor animate-pulse">|</span>}
            </div>
          )}

          {(isLoading && displayedResponse) && (
            <div className="absolute bottom-4 right-4 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <div className="text-xs text-blue-500">Thinking...</div>
            </div>
          )}
        </div>

        {expenses.length === 0 && (
          <div className={`p-4 rounded-md ${theme === 'dark' ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
            <HelpCircle className="inline-block mr-2 h-5 w-5" />
            Add some expenses to get started with AI-powered insights!
          </div>
        )}

        <div className="space-y-4">
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedPrompts.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(suggestion)}
                  className={`px-4 py-2 rounded-lg text-left text-sm transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about your finances..."
                className={`flex-1 px-4 py-2 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } transition-colors duration-200 disabled:opacity-50`}
              >
                {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-xs text-center">
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Powered by Google Gemini AI • Financial insights are suggestions only
          </p>
        </div>
      </div>
    </div>
  );
}
