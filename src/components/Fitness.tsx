import React from 'react';
import { Dumbbell, Clock, Calendar } from 'lucide-react';

interface FitnessProps {
  theme: 'light' | 'dark';
}

export function Fitness({ theme }: FitnessProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className={`w-full max-w-3xl ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} rounded-xl shadow-md p-8 mt-4`}>
        <div className="flex items-center justify-center">
          <div className={`rounded-full p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-purple-50'} mb-6`}>
            <Dumbbell size={48} className={theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} />
          </div>
        </div>
        
        <h2 className={`text-2xl font-bold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Fitness Tracking Coming Soon
        </h2>
        
        <p className={`text-lg text-center mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          We're working on an amazing fitness tracking experience to help you monitor your health and athletic progress.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-purple-50'}`}>
            <div className="flex items-center mb-4">
              <Clock className={`mr-3 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} size={24} />
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Workout Tracking</h3>
            </div>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Log your exercises, sets, reps, and weights. Track your progress over time with visual charts.
            </p>
          </div>
          
          <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-purple-50'}`}>
            <div className="flex items-center mb-4">
              <Calendar className={`mr-3 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} size={24} />
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Goal Setting</h3>
            </div>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Set and manage fitness goals with intelligent progress tracking and reminders.
            </p>
          </div>
        </div>
        
        <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
          <div 
            className="bg-gradient-to-r from-[#8983f7] to-[#a3dafb] h-full rounded-full"
            style={{ width: '60%' }}
          />
        </div>
        <p className={`text-center mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Development progress: 60%
        </p>
      </div>
    </div>
  );
}