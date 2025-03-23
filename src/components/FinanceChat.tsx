import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { getExpenseInsights } from '../lib/gemini';
import { useTheme } from '../context/ThemeContext';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

interface SuggestedPrompt {
  text: string;
  icon?: string;
}

interface FinanceChatProps {
  isOpen: boolean;
  onToggle: () => void;
  expenses: any[];
}

export function FinanceChat({ isOpen, onToggle, expenses }: FinanceChatProps) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    { 
      sender: 'bot', 
      text: 'Hi there! I can provide personalized financial tips based on your expense data. Ask me anything about your spending habits or budget recommendations.'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts: SuggestedPrompt[] = [
    { text: "What categories am I spending the most on?" },
    { text: "How can I improve my budget?" },
    { text: "Analyze my monthly spending trends" },
    { text: "Tips to reduce my expenses" },
  ];

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim()) return;
    
    const userMessage = { sender: 'user', text: text } as Message;
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Only analyze the expenses if explicitly asked
      const containsAnalysisRequest = text.toLowerCase().includes('analyze') || 
                                     text.toLowerCase().includes('spending') || 
                                     text.toLowerCase().includes('budget') ||
                                     text.toLowerCase().includes('expenses') ||
                                     text.toLowerCase().includes('trends') ||
                                     text.toLowerCase().includes('insights') ||
                                     text.toLowerCase().includes('tips');
      
      let response;
      if (containsAnalysisRequest) {
        response = await getExpenseInsights(expenses, text);
      } else {
        response = "I'd be happy to help with your finances. To give you personalized advice, I need to analyze your expense data. Could you ask me about your spending patterns, budget recommendations, or specific financial questions?";
      }
      
      setMessages(prev => [
        ...prev, 
        { sender: 'bot', text: response }
      ]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [
        ...prev, 
        { sender: 'bot', text: 'Sorry, I had trouble processing that request. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        className={`${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center justify-center`}
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-80 sm:w-96 h-96 flex flex-col overflow-hidden transition-colors duration-200`}>
      <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-medium">Financial Assistant</h3>
        <button onClick={onToggle} className="text-white">
          <X size={20} />
        </button>
      </div>
      
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} hide-scrollbar`}>
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`max-w-[85%] p-3 rounded-lg ${
              message.sender === 'user' 
                ? theme === 'dark' 
                  ? 'bg-blue-900 ml-auto rounded-tr-none' 
                  : 'bg-blue-100 ml-auto rounded-tr-none'
                : theme === 'dark'
                  ? 'bg-gray-700 mr-auto rounded-tl-none'
                  : 'bg-gray-100 mr-auto rounded-tl-none'
            }`}
          >
            <p className={`text-sm ${message.sender === 'user' ? theme === 'dark' ? 'text-blue-100' : 'text-blue-800' : theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
              {message.text}
            </p>
          </div>
        ))}
        
        {messages.length === 1 && (
          <div className="mt-3">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Try asking:</p>
            <div className="grid grid-cols-1 gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(prompt.text)}
                  className={`text-left p-2 rounded-md text-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3 max-w-[85%] rounded-tl-none mr-auto`}>
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className={`border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-3 transition-colors duration-200`}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your finances..."
            className={`flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'border-gray-300 text-gray-700 placeholder-gray-500'
            } transition-colors duration-200`}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            className={`${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-full p-2 focus:outline-none disabled:opacity-50 transition-colors duration-200`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
