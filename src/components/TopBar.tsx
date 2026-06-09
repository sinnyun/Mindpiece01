import React from 'react';
import { Search, Bell } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function TopBar({ searchQuery, onSearchChange }: TopBarProps) {
  return (
    <header className="fixed top-0 right-0 left-[280px] h-24 px-10 flex justify-between items-center bg-white/10 backdrop-blur-md z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-primary">主页看板</h2>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:flex items-center">
          <Search className="w-4 h-4 absolute left-4 text-on-surface-variant/60" />
          <input 
            type="text" 
            placeholder="快速搜索笔记..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-white/50 border border-white/60 rounded-full pl-11 pr-5 py-2.5 text-sm w-72 focus:ring-2 focus:ring-primary/20 focus:bg-white/80 transition-all shadow-sm box-border outline-none"
          />
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors shadow-sm">
          <Bell className="w-5 h-5 text-on-surface-variant" />
        </button>
      </div>
    </header>
  );
}
