import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TipCardProps {
  tipNumber: string;
  tipText: string;
  theme: string;
}

interface SmartMoneyTipsProps {
  tips: string;
  theme: string;
}

const TipCard = ({ tipNumber, tipText, theme }: TipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Generate a plausible implementation for the tip
  const generateImplementation = (tip: string): string => {
    if (tip.toLowerCase().includes('budget')) {
      return 'Create a detailed monthly budget in a spreadsheet or app. Allocate specific amounts for each category and track your spending daily.';
    } else if (tip.toLowerCase().includes('meal') || tip.toLowerCase().includes('food') || tip.toLowerCase().includes('grocery')) {
      return 'Plan your meals for the week, make a shopping list and stick to it. Cook in batches and freeze portions for busy days.';
    } else if (tip.toLowerCase().includes('transport') || tip.toLowerCase().includes('commute')) {
      return 'Research public transit options, look into carpooling opportunities, or consider biking for shorter distances.';
    } else if (tip.toLowerCase().includes('utility') || tip.toLowerCase().includes('utilities') || tip.toLowerCase().includes('electricity')) {
      return 'Install a programmable thermostat, use energy-efficient appliances, and unplug electronics when not in use.';
    } else if (tip.toLowerCase().includes('subscription') || tip.toLowerCase().includes('services')) {
      return 'Make a list of all your subscriptions with their monthly costs. Cancel those you rarely use or find free alternatives.';
    } else {
      return 'Break this down into smaller actionable steps. Start with a 30-day challenge and track your progress daily.';
    }
  };
  
  const implementation = generateImplementation(tipText);
  
  return (
    <div className="perspective-1000 relative h-full cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div
        className="w-full h-full transition-transform preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        initial={false}
        transition={{ duration: 0.7, type: "tween" }}
      >
        {/* Front of card */}
        <motion.div 
          className={`absolute w-full h-full backface-hidden rounded-xl p-5 ${
            theme === 'dark' ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-50'
          } shadow-sm border ${theme === 'dark' ? 'border-gray-700' : 'border-blue-100'}`}
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <div className="flex items-start">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center ${
              theme === 'dark' ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'
            } mr-3 shadow-sm shrink-0`}>
              {tipNumber}
            </div>
            <p className={`${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} text-sm font-medium`}>
              {tipText}
            </p>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center text-xs text-blue-500 dark:text-blue-400">
            <span className="mr-1">How to implement</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </motion.div>
        
        {/* Back of card */}
        <motion.div 
          className={`absolute w-full h-full backface-hidden rounded-xl p-5 rotate-y-180 ${
            theme === 'dark' ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30' : 'bg-gradient-to-br from-blue-100/80 to-indigo-100/80'
          } shadow-md border ${theme === 'dark' ? 'border-blue-900/30' : 'border-blue-200'}`}
        >
          <h4 className={`text-sm font-semibold mb-3 ${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
          }`}>How to implement:</h4>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
            {implementation}
          </p>
          <div className="absolute bottom-3 right-3 flex items-center text-xs text-blue-500 dark:text-blue-400">
            <svg className="w-3 h-3 rotate-180 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Back to tip</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export function SmartMoneyTips({ tips, theme }: SmartMoneyTipsProps) {
  const [parsedTips, setParsedTips] = useState<{ number: string; text: string }[]>([]);
  
  useEffect(() => {
    // Parse the tips from the Gemini formatted numbered list
    const parseGeminiTips = (tipsText: string) => {
      // Try to split into paragraphs first
      const paragraphs = tipsText.split('\n\n');
      
      // Find all lines that start with a number followed by a period
      const numberedTipRegex = /(\d+)\.\s+(.*)/;
      const extractedTips: { number: string; text: string }[] = [];
      
      // Process each paragraph
      paragraphs.forEach(para => {
        // Split paragraph into lines to handle newlines
        const lines = para.split('\n');
        
        lines.forEach(line => {
          const match = line.match(numberedTipRegex);
          if (match) {
            extractedTips.push({
              number: match[1],
              text: match[2].trim()
            });
          }
        });
      });
      
      return extractedTips;
    };
    
    if (tips && tips !== 'Loading personalized tips...') {
      setParsedTips(parseGeminiTips(tips));
    }
  }, [tips]);
  
  // If we couldn't parse the tips, just show the raw text
  if (parsedTips.length === 0 && tips !== 'Loading personalized tips...') {
    return (
      <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert text-gray-300' : 'text-gray-700'} whitespace-pre-line`}>
        {tips}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {parsedTips.map((tip, index) => (
        <div key={index} className="h-32">
          <TipCard 
            tipNumber={tip.number} 
            tipText={tip.text} 
            theme={theme} 
          />
        </div>
      ))}
    </div>
  );
}
