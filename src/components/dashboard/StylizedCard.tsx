import React from 'react';

interface StylizedCardProps {
  label: string;
  hoverText?: string;
  theme: 'light' | 'dark';
  onClick?: () => void;
}

export const StylizedCard: React.FC<StylizedCardProps> = ({ 
  label, 
  hoverText = "COMING SOON", 
  theme, 
  onClick 
}) => {
  return (
    <div 
      className="relative h-full w-full rounded-[30px] overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Base Card */}
      <div 
        className={`absolute inset-0 flex items-center justify-center font-bold text-2xl text-white 
                  ${theme === 'dark' ? 'bg-[#26242e]' : 'bg-[#191a19]'}`}
      >
        {label}
      </div>
      
      {/* Top Right Corner Effect */}
      <div 
        className={`absolute top-0 right-0 w-1/5 h-1/5 rounded-bl-[100%]
                  ${theme === 'dark' ? 'bg-gray-700/70' : 'bg-[#3f4344]'}
                  transition-all duration-500 z-10 
                  group-hover:w-full group-hover:h-full group-hover:rounded-[30px]`}
      ></div>
      
      {/* Bottom Left Corner with Hover Text */}
      <div 
        className={`absolute bottom-0 left-0 w-1/5 h-1/5 rounded-tr-[100%]
                  ${theme === 'dark' ? 'bg-gray-700/70' : 'bg-[#3f4344]'}
                  transition-all duration-500 z-20 
                  group-hover:w-full group-hover:h-full group-hover:rounded-[30px]
                  group-hover:flex group-hover:items-center group-hover:justify-center
                  group-hover:text-white group-hover:font-bold group-hover:text-2xl`}
      >
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300">
          {hoverText}
        </span>
      </div>
    </div>
  );
};
