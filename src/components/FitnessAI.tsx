import React from 'react';
import { Sparkles, Dumbbell, Brain, TrendingUp } from 'lucide-react';

interface FitnessAIProps {
  theme: 'light' | 'dark';
}

export function FitnessAI({ theme }: FitnessAIProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className={`w-full max-w-4xl ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} rounded-xl shadow-md p-8 mt-4`}>
        <div className="flex items-center mb-6">
          <div className={`rounded-full p-3 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-purple-50'} mr-4`}>
            <Brain size={28} className={theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} />
          </div>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Fitness AI Insights
          </h2>
          <div className="ml-auto">
            <Sparkles className={`${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} size={20} />
          </div>
        </div>
        
        <div className={`p-6 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-purple-50'}`}>
          <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
            AI-powered fitness insights coming soon! Our intelligent system will:
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} mr-3 mt-0.5`}>
                <Dumbbell size={16} className={theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} />
              </div>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                Analyze your workout patterns and suggest personalized training plans to improve performance
              </p>
            </div>
            
            <div className="flex items-start">
              <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} mr-3 mt-0.5`}>
                <TrendingUp size={16} className={theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} />
              </div>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                Track progress over time and identify trends to help you reach your fitness goals faster
              </p>
            </div>
            
            <div className="flex items-start">
              <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} mr-3 mt-0.5`}>
                <Sparkles size={16} className={theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} />
              </div>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                Provide science-backed recommendations for nutrition and recovery based on your activity data
              </p>
            </div>
          </div>
        </div>
        
        {/* Sample visualization */}
        <div className="relative h-64 rounded-lg overflow-hidden mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              <Dumbbell size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Workout visualization coming soon</p>
            </div>
          </div>
          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} rounded-lg`}></div>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-8">
          <div className="flex justify-between text-sm mb-1">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Feature Development</span>
            <span className={theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}>75%</span>
          </div>
          <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
            <div 
              className="bg-gradient-to-r from-[#8983f7] to-[#a3dafb] h-full rounded-full"
              style={{ width: '75%' }}
            />
          </div>
          <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            We're working hard to bring intelligent fitness insights to your personal tracker.
          </p>
        </div>
      </div>
    </div>
  );
}