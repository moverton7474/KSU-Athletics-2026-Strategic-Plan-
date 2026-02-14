
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-black text-white p-6 border-b-4 border-yellow-500 shadow-xl z-20 sticky top-0">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-3">
             <div className="h-10 w-2 bg-yellow-500 rounded-full"></div>
             <h1 className="text-3xl font-extrabold uppercase tracking-tighter sm:text-4xl">
               Taking Flight <span className="text-yellow-500 italic">to 2026</span>
             </h1>
          </div>
          <p className="text-gray-400 font-semibold mt-1 tracking-wide uppercase text-xs sm:text-sm">
            Strategic Architecture for the Power Four Ascent
          </p>
        </div>
        <div className="text-center md:text-right">
          <p className="text-sm font-bold text-yellow-500 uppercase tracking-widest">Executive Staff Retreat</p>
          <p className="text-xs text-gray-500 font-mono mt-1">Tuesday, Jan 15, 2026 | Session 1</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
