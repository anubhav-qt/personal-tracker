import React from 'react';
import { GraduationCap, BookOpen, Award } from 'lucide-react';

interface AcademicsProps {
  theme: 'light' | 'dark';
}

export function Academics({ theme }: AcademicsProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className={`w-full max-w-3xl ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-white'} rounded-xl shadow-md p-8 mt-4`}>
        <div className="flex items-center justify-center">
          <div className={`rounded-full p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-purple-50'} mb-6`}>
            <GraduationCap size={48} className={theme === 'dark' ? 'text-purple-300' : 'text-purple-600'} />
          </div>
        </div>
        
        <h2 className={`text-2xl font-bold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Academic Tracking Coming Soon
        </h2>
        
        <p className={`text-lg text-center mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          We're developing powerful tools to help you track your educational progress, assignments, and goals.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-purple-50'}`}>
            <div className="flex items-center mb-4">
              <BookOpen className={`mr-3 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} size={24} />
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Course Management</h3>
            </div>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Track assignments, deadlines, and class schedules. Set reminders and get organized.
            </p>
          </div>
          
          <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-purple-50'}`}>
            <div className="flex items-center mb-4">
              <Award className={`mr-3 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} size={24} />
              <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Grade Analytics</h3>
            </div>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Log your grades and track your academic performance with detailed analytics and insights.
            </p>
          </div>
        </div>
        
        <div className={`w-full h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
          <div 
            className="bg-gradient-to-r from-[#8983f7] to-[#a3dafb] h-full rounded-full"
            style={{ width: '40%' }}
          />
        </div>
        <p className={`text-center mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Development progress: 40%
        </p>
      </div>
    </div>
  );
}