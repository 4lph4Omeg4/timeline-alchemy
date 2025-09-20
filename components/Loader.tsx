import React from 'react';

const Loader: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full border-t-4 border-b-4 border-indigo-400 animate-spin"></div>
        <div className="absolute h-16 w-16 rounded-full border-l-4 border-r-4 border-indigo-600 animate-[spin_1.2s_linear_infinite_reverse]"></div>
        <div className="p-4 bg-slate-900/50 rounded-full">
            <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.6802 2.50002C5.88022 2.50002 2.18022 9.41002 4.77022 14.63C6.44022 18.01 9.94022 20.5 14.1502 20.5C19.9502 20.5 23.6502 13.59 21.0602 8.37002C19.3902 4.99002 15.8902 2.50002 11.6802 2.50002Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.5 12.5C15.5 14.71 13.71 16.5 11.5 16.5C9.29 16.5 7.5 14.71 7.5 12.5C7.5 10.29 9.29 8.5 11.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
      </div>
      <p className="mt-6 text-lg font-medium text-gray-400 tracking-wider animate-pulse">{message}</p>
    </div>
  );
};

export default Loader;