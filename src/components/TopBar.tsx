import React from 'react';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useSettingsStore } from '../store';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function TopBar({ searchQuery, onSearchChange }: TopBarProps) {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

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
            className="bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-white/10 rounded-full pl-11 pr-5 py-2.5 text-sm w-72 focus:ring-2 focus:ring-primary/20 focus:bg-white/80 dark:focus:bg-slate-900/80 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] box-border outline-none text-on-surface"
          />
        </div>
        
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-on-surface-variant"
          title={theme === 'dark' ? '切换为亮色模式' : '切换为暗色模式'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-slate-700" />
          )}
        </button>

        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/80 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <Bell className="w-5 h-5 text-on-surface-variant" />
        </button>
      </div>
    </header>
  );
}
